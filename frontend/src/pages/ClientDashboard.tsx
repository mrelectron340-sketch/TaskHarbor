import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, Plus, Clock, DollarSign, LayoutDashboard, Wallet, Settings } from 'lucide-react';
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
}

const ClientDashboard: React.FC = () => {
  const { account, isConnected, client, userProfile } = useWallet();
  const [jobs, setJobs] = useState<UiJob[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'pending' | 'completed' | 'disputes'>('active');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadJobs = async () => {
      if (!isConnected || !account || !client) return;

      setLoading(true);
      setError(null);

      try {
        if (!CONFIG.CONTRACTS.JOB) {
          throw new Error('Job contract address is not configured. Set it in config.ts after deploying.');
        }

        const service = createContractService(client);
        if (!service) throw new Error('Wallet not connected');

        const ids = await service.getClientJobs(account.address);
        const jobsOnChain: OnChainJob[] = await Promise.all(ids.map((id) => service.getJob(id)));

        const uiJobs: UiJob[] = jobsOnChain.map((job) => ({
          id: job.id.toString(),
          title: job.title,
          status: job.status,
          paymentMas: (Number(job.totalPayment) / 1e9).toString(),
          deadline: new Date(Number(job.deadline)).toISOString(),
        }));

        setJobs(uiJobs);
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : 'Failed to load jobs');
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    void loadJobs();
  }, [isConnected, account, client]);

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Please connect your wallet</h2>
      </div>
    );
  }

  if (userProfile?.role !== 'client') {
    return (
      <div className="card max-w-2xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold mb-3">Client access required</h2>
        <p className="text-slate-400">
          Switch to the client role from the Settings page or complete onboarding as a client to use the client
          dashboard.
        </p>
      </div>
    );
  }

  const stats = {
    active: jobs.filter((j) => j.status === 'Accepted' || j.status === 'InProgress').length,
    pending: jobs.filter((j) => j.status === 'Submitted' || j.status === 'Voting').length,
    completed: jobs.filter((j) => j.status === 'Completed').length,
    disputes: jobs.filter((j) => j.status === 'Disputed').length,
  };

  const filteredJobs = jobs.filter((job) => {
    switch (activeTab) {
      case 'active':
        return job.status === 'Accepted' || job.status === 'InProgress';
      case 'pending':
        return job.status === 'Submitted' || job.status === 'Voting';
      case 'completed':
        return job.status === 'Completed';
      case 'disputes':
        return job.status === 'Disputed';
      default:
        return true;
    }
  });

  return (
    <div className="space-y-6">
      <DashboardNav
        title="Client HQ"
        subtitle="Control every job, escrow, and payout from one place."
        links={[
          { path: '/dashboard/client', label: 'Overview', description: 'Pipeline & escrow health', icon: LayoutDashboard },
          { path: '/jobs/create', label: 'Create Job', description: 'Post new on-chain work', icon: Plus },
          { path: '/wallet/transactions', label: 'Transactions', description: 'Escrow + MAS movement', icon: Wallet },
          { path: '/settings', label: 'Settings', description: 'Profile & role controls', icon: Settings },
        ]}
        actionSlot={
          <Link to="/jobs/create" className="btn-primary flex items-center space-x-2 px-6 py-3">
            <Plus className="w-5 h-5" />
            <span>New Job</span>
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Active Jobs', value: stats.active, tone: 'text-blue-400', hint: 'Accepted · In-progress' },
          { label: 'Awaiting Approval', value: stats.pending, tone: 'text-yellow-400', hint: 'Submitted · Voting' },
          { label: 'Completed', value: stats.completed, tone: 'text-green-400', hint: 'Ready to archive' },
          { label: 'Disputes', value: stats.disputes, tone: 'text-red-400', hint: 'Needs DAO attention' },
        ].map((card) => (
          <div key={card.label} className="card">
            <p className="text-sm text-slate-400">{card.label}</p>
            <p className={`text-4xl font-bold mt-2 ${card.tone}`}>{card.value}</p>
            <p className="text-xs text-slate-500 mt-1">{card.hint}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-700">
        {[
          { id: 'active', label: 'Active', count: jobs.filter(j => j.status === 'Accepted' || j.status === 'InProgress').length },
          { id: 'pending', label: 'Pending Approval', count: jobs.filter(j => j.status === 'Submitted' || j.status === 'Voting').length },
          { id: 'completed', label: 'Completed', count: jobs.filter(j => j.status === 'Completed').length },
          { id: 'disputes', label: 'Disputes', count: jobs.filter(j => j.status === 'Disputed').length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'active' | 'pending' | 'completed' | 'disputes')}
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
            <p className="text-slate-400 mb-4">Get started by creating your first job</p>
            <Link to="/jobs/create" className="btn-primary inline-flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Create Job</span>
            </Link>
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

export default ClientDashboard;


