import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, DollarSign, Clock, TrendingUp, LayoutDashboard, Wallet, Compass, Settings } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { createContractService, OnChainJob } from '../utils/contracts';
import CONFIG from '../config';
import DashboardNav from '../components/DashboardNav';

interface UiJob {
  id: string;
  title: string;
  status: string;
  paymentMas: string;
  deadline: string;
  client: string;
  // Whether this job is already associated with the freelancer (accepted/in progress/etc.)
  isMine?: boolean;
}

const FreelancerDashboard: React.FC = () => {
  const { account, isConnected, client, wallet, userProfile } = useWallet();
  // Jobs that are already linked to this freelancer (via JobContract.getFreelancerJobs)
  const [myJobs, setMyJobs] = useState<UiJob[]>([]);
  // Publicly posted jobs that any freelancer can apply for
  const [offerJobs, setOfferJobs] = useState<UiJob[]>([]);
  const [earnings, setEarnings] = useState({ total: '0', withdrawable: '0' });
  const [activeTab, setActiveTab] = useState<'offers' | 'inprogress' | 'submissions' | 'earnings'>('offers');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!isConnected || !account || !client) return;

      setLoading(true);
      setError(null);

      try {
        if (!CONFIG.CONTRACTS.JOB || !CONFIG.CONTRACTS.ESCROW) {
          throw new Error('Contract addresses are not fully configured. Set JOB and ESCROW in config.ts after deploying.');
        }

        const service = createContractService(client);
        if (!service) throw new Error('Wallet not connected');

        const [freelancerJobIds, allJobIds, withdrawable] = await Promise.all([
          service.getFreelancerJobs(account.address),
          service.getAllJobs(),
          service.getWithdrawableBalance(account.address),
        ]);

        const [freelancerJobsOnChain, allJobsOnChain]: [OnChainJob[], OnChainJob[]] = await Promise.all([
          Promise.all(freelancerJobIds.map((id) => service.getJob(id))),
          Promise.all(allJobIds.map((id) => service.getJob(id))),
        ]);

        const myUiJobs: UiJob[] = freelancerJobsOnChain.map((job) => ({
          id: job.id.toString(),
          title: job.title,
          status: job.status,
          paymentMas: (Number(job.totalPayment) / 1e9).toString(),
          deadline: new Date(Number(job.deadline)).toISOString(),
          client: job.client,
          isMine: true,
        }));

        // Offers are all jobs that are still Posted and not yet assigned to a freelancer.
        const offerUiJobs: UiJob[] = allJobsOnChain
          .filter((job) => job.status === 'Posted' && !job.freelancer)
          .map((job) => ({
            id: job.id.toString(),
            title: job.title,
            status: job.status,
            paymentMas: (Number(job.totalPayment) / 1e9).toString(),
            deadline: new Date(Number(job.deadline)).toISOString(),
            client: job.client,
          }));

        setMyJobs(myUiJobs);
        setOfferJobs(offerUiJobs);

        const withdrawableMas = (Number(withdrawable) / 1e9).toString();
        setEarnings({
          total: '0', // Full historical earnings would require an indexer; we only show withdrawable on-chain balance here
          withdrawable: withdrawableMas,
        });
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : 'Failed to load freelancer data');
        setMyJobs([]);
        setOfferJobs([]);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [isConnected, account, client]);

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Please connect your wallet</h2>
      </div>
    );
  }

  if (userProfile?.role !== 'freelancer') {
    return (
      <div className="card max-w-2xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold mb-3">Freelancer access required</h2>
        <p className="text-slate-400">
          Switch your role to freelancer inside Settings to access work tracking and withdrawals.
        </p>
      </div>
    );
  }

  const stats = {
    offers: offerJobs.length,
    inprogress: myJobs.filter((j) => j.status === 'Accepted' || j.status === 'InProgress').length,
    submissions: myJobs.filter((j) => j.status === 'Submitted' || j.status === 'Voting').length,
  };

  const filteredJobs: UiJob[] = (() => {
    switch (activeTab) {
      case 'offers':
        return offerJobs;
      case 'inprogress':
        return myJobs.filter((job) => job.status === 'Accepted' || job.status === 'InProgress');
      case 'submissions':
        return myJobs.filter((job) => job.status === 'Submitted' || job.status === 'Voting');
      default:
        return myJobs;
    }
  })();

  const handleWithdraw = async () => {
    if (!wallet || !client || !account) return;

    try {
      const service = createContractService(client);
      if (!service) throw new Error('Wallet not connected');

      await service.withdraw();
      alert('Withdrawal transaction sent from escrow contract.');
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'Failed to withdraw');
    }
  };

  return (
    <div className="space-y-6">
      <DashboardNav
        title="Freelancer HQ"
        subtitle="Track offers, submissions, and escrow releases."
        links={[
          { path: '/dashboard/freelancer', label: 'My Work', description: 'Offers & progress', icon: LayoutDashboard },
          { path: '/jobs', label: 'Browse Jobs', description: 'New opportunities', icon: Compass },
          { path: '/wallet/transactions', label: 'Payouts', description: 'Escrow withdrawals', icon: Wallet },
          { path: '/settings', label: 'Profile', description: 'Skills & role settings', icon: Settings },
        ]}
        actionSlot={
          <Link to="/jobs" className="btn-primary flex items-center space-x-2 px-6 py-3">
            <Briefcase className="w-5 h-5" />
            <span>Find Jobs</span>
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Open Offers', value: stats.offers, tone: 'text-primary-400', hint: 'Ready to accept' },
          { label: 'In Progress', value: stats.inprogress, tone: 'text-blue-400', hint: 'Deliver on time' },
          { label: 'Awaiting Review', value: stats.submissions, tone: 'text-yellow-400', hint: 'Voting or client review' },
        ].map((card) => (
          <div key={card.label} className="card">
            <p className="text-sm text-slate-400">{card.label}</p>
            <p className={`text-4xl font-bold mt-2 ${card.tone}`}>{card.value}</p>
            <p className="text-xs text-slate-500 mt-1">{card.hint}</p>
          </div>
        ))}
      </div>

      {/* Earnings Card */}
      {activeTab === 'earnings' && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="card">
            <div className="text-slate-400 text-sm mb-2">Total Earned</div>
            <div className="text-3xl font-bold text-primary-400 flex items-center space-x-2">
              <DollarSign className="w-8 h-8" />
              <span>{earnings.total} MAS</span>
            </div>
          </div>
          <div className="card">
            <div className="text-slate-400 text-sm mb-2">Withdrawable</div>
            <div className="text-3xl font-bold text-green-400 flex items-center space-x-2">
              <TrendingUp className="w-8 h-8" />
              <span>{earnings.withdrawable} MAS</span>
            </div>
          </div>
          <div className="card flex items-center justify-center">
            <button onClick={handleWithdraw} className="btn-primary w-full py-4">
              Withdraw Funds
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-700">
        {[
          { id: 'offers', label: 'Available Offers' },
          { id: 'inprogress', label: 'In Progress' },
          { id: 'submissions', label: 'Submissions' },
          { id: 'earnings', label: 'Earnings' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'offers' | 'inprogress' | 'submissions' | 'earnings')}
            className={`px-6 py-3 font-semibold border-b-2 transition ${
              activeTab === tab.id
                ? 'border-primary-500 text-primary-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Jobs List */}
      {error && (
        <div className="card border border-red-500/40 bg-red-500/10 text-red-300 mb-4">
          {error}
        </div>
      )}
      <div className="space-y-4">
        {loading ? (
          <div className="card text-center py-12">Loading jobs...</div>
        ) : filteredJobs.length === 0 ? (
          <div className="card text-center py-12">
            <Briefcase className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">No jobs found</h3>
            <p className="text-slate-400 mb-4">
              {activeTab === 'offers' ? 'Browse available jobs to get started' : 'No jobs in this category'}
            </p>
            {activeTab === 'offers' && (
              <Link to="/jobs" className="btn-primary inline-flex items-center space-x-2">
                <Briefcase className="w-5 h-5" />
                <span>Browse Jobs</span>
              </Link>
            )}
          </div>
        ) : (
          filteredJobs.map((job, index) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card hover:border-primary-500/50 transition cursor-pointer"
            >
              <Link to={`/jobs/${job.id}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{job.title}</h3>
                    <div className="flex items-center space-x-6 text-sm text-slate-400">
                      <span className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4" />
                        <span>{job.paymentMas} MAS</span>
                      </span>
                      <span className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>Due: {new Date(job.deadline).toLocaleDateString()}</span>
                      </span>
                      {job.client && (
                        <span className="font-mono">{job.client}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      job.status === 'InProgress' ? 'bg-blue-500/20 text-blue-400' :
                      job.status === 'Submitted' ? 'bg-yellow-500/20 text-yellow-400' :
                      job.status === 'Completed' ? 'bg-green-500/20 text-green-400' :
                      'bg-slate-700'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default FreelancerDashboard;


