import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, Clock, DollarSign, User, Search, Filter } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { createContractService, OnChainJob } from '../utils/contracts';
import CONFIG from '../config';

interface UiJob {
  id: string;
  title: string;
  description: string;
  client: string;
  totalPaymentMas: string;
  deadline: string;
  status: string;
  createdAt: string;
}

const Jobs: React.FC = () => {
  const { isConnected, account, client, wallet } = useWallet();
  const [jobs, setJobs] = useState<UiJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    const loadJobs = async () => {
      if (!client || !wallet) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const service = createContractService(client);

        if (!service) {
          throw new Error('Wallet not connected. Please connect your wallet first.');
        }

        if (!CONFIG.CONTRACTS.JOB) {
          throw new Error('Job contract address is not configured. Set it in config.ts after deploying.');
        }

        // Load all jobs from the JobContract so freelancers can browse public offers
        const allIds = await service.getAllJobs();

        const jobsRaw: OnChainJob[] = await Promise.all(
          allIds.map(async (id) => service.getJob(id)),
        );

        const uiJobs: UiJob[] = jobsRaw.map((job) => ({
          id: job.id.toString(),
          title: job.title,
          description: job.descriptionCID || 'On-chain job description (IPFS CID: ' + job.descriptionCID + ')',
          client: job.client,
          totalPaymentMas: (Number(job.totalPayment) / 1e9).toString(),
          deadline: new Date(Number(job.deadline)).toISOString(),
          status: job.status,
          createdAt: new Date(Number(job.createdAt)).toISOString(),
        }));

        setJobs(uiJobs);
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : 'Failed to load jobs');
      } finally {
        setLoading(false);
      }
    };

    if (isConnected) {
      void loadJobs();
    } else {
      setJobs([]);
      setLoading(false);
    }
  }, [isConnected, account, client]);

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || job.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const statusColors: Record<string, string> = {
    Posted: 'bg-green-500/20 text-green-400',
    Accepted: 'bg-blue-500/20 text-blue-400',
    InProgress: 'bg-yellow-500/20 text-yellow-400',
    Submitted: 'bg-purple-500/20 text-purple-400',
    Completed: 'bg-primary-500/20 text-primary-400',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold">Job Marketplace</h1>
          <p className="text-slate-400 mt-2">Find your next opportunity</p>
        </div>
        {isConnected && (
          <Link to="/jobs/create" className="btn-primary flex items-center space-x-2">
            <Briefcase className="w-5 h-5" />
            <span>Post a Job</span>
          </Link>
        )}
      </div>

      {!isConnected && (
        <div className="card bg-yellow-500/10 border border-yellow-500/40 text-center">
          <p className="text-yellow-200 font-semibold mb-1">Wallet not connected</p>
          <p className="text-sm text-slate-300">
            Connect your wallet to fetch personalized jobs (client + freelancer history) from the blockchain.
          </p>
        </div>
      )}

      {/* Search and Filters */}
      <div className="card space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-12"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field"
            >
              <option value="all">All Status</option>
              <option value="Posted">Posted</option>
              <option value="Accepted">Accepted</option>
              <option value="InProgress">In Progress</option>
              <option value="Submitted">Submitted</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Jobs Grid */}
      {error && (
        <div className="card border border-red-500/40 bg-red-500/10 text-red-300">
          {error}
        </div>
      )}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-slate-700 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-slate-700 rounded w-full mb-2"></div>
              <div className="h-3 bg-slate-700 rounded w-5/6"></div>
            </div>
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="card text-center py-12">
          <Briefcase className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">No jobs found</h3>
          <p className="text-slate-400">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job, index) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="card cursor-pointer group"
            >
              <Link to={`/jobs/${job.id}`}>
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <h3 className="text-xl font-bold group-hover:text-primary-400 transition">
                      {job.title}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[job.status] || 'bg-slate-700'}`}>
                      {job.status}
                    </span>
                  </div>

                  <p className="text-slate-400 line-clamp-3">{job.description}</p>

                  <div className="flex items-center space-x-2 text-sm text-slate-400">
                    <User className="w-4 h-4" />
                    <span className="font-mono">{job.client}</span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                    <div className="flex items-center space-x-2 text-primary-400 font-bold">
                      <DollarSign className="w-5 h-5" />
                      <span>{job.totalPaymentMas} MAS</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-400 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(job.deadline).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Jobs;
