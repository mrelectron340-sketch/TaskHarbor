import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Clock, DollarSign, User, CheckCircle, Upload, AlertCircle } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { createContractService, OnChainJob } from '../utils/contracts';
import CONFIG from '../config';

interface UiJob {
  id: string;
  title: string;
  client: string;
  freelancer: string;
  totalPaymentMas: string;
  deadline: string;
  status: string;
  createdAt: string;
  description: string;
  descriptionCID: string;
  submissionCID: string;
}

const JobDetail: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const { account, isConnected, client, wallet } = useWallet();
  const [job, setJob] = useState<UiJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissionCID, setSubmissionCID] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [escrowBalanceMas, setEscrowBalanceMas] = useState<string>('0');
  const [releasing, setReleasing] = useState(false);

  const loadJob = async () => {
    if (!wallet || !client || !jobId) return;

    setLoading(true);
    setError(null);

    try {
      if (!CONFIG.CONTRACTS.JOB) {
        throw new Error('Job contract address is not configured. Set it in config.ts after deploying.');
      }

      const service = createContractService(client);
      if (!service) {
        throw new Error('Wallet not connected. Please connect your wallet first.');
      }

      const onChain: OnChainJob = await service.getJob(BigInt(jobId));

      const ui: UiJob = {
        id: onChain.id.toString(),
        title: onChain.title,
        client: onChain.client,
        freelancer: onChain.freelancer,
        totalPaymentMas: (Number(onChain.totalPayment) / 1e9).toString(),
        deadline: new Date(Number(onChain.deadline)).toISOString(),
        status: onChain.status,
        createdAt: new Date(Number(onChain.createdAt)).toISOString(),
        // We store the full description string directly in descriptionCID on-chain.
        description: onChain.descriptionCID,
        descriptionCID: '',
        submissionCID: onChain.submissionCID,
      };

      setJob(ui);
      // Load escrow balance if escrow contract is configured
      if (CONFIG.CONTRACTS.ESCROW) {
        try {
          const escrow = await service.getEscrowBalance(onChain.id);
          setEscrowBalanceMas((Number(escrow) / 1e9).toString());
        } catch {
          setEscrowBalanceMas('0');
        }
      }
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Failed to load job');
      setJob(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      void loadJob();
    } else {
      setJob(null);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, client, account, jobId]);

  const handleAccept = async () => {
    if (!wallet || !client || !account || !jobId) return;

    setAccepting(true);
    setError(null);
    try {
      const service = createContractService(client);
      if (!service) throw new Error('Wallet not connected');

      await service.acceptJob(BigInt(jobId));
      await loadJob();
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Failed to accept job');
    } finally {
      setAccepting(false);
    }
  };

  const handleSubmit = async () => {
    if (!submissionCID) {
      alert('Please enter a submission CID (upload your work to IPFS and paste the CID here).');
      return;
    }
    if (!wallet || !client || !account || !jobId) return;

    setSubmitting(true);
    setError(null);
    try {
      const service = createContractService(client);
      if (!service) throw new Error('Wallet not connected');

      await service.submitWork(BigInt(jobId), submissionCID);
      await loadJob();
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Failed to submit work');
    } finally {
      setSubmitting(false);
    }
  };

  const isClient = !!job && job.client === account?.address;
  const isFreelancer = !!job && job.freelancer === account?.address;
  const canAccept = isConnected && !!job && !job.freelancer && job.status === 'Posted';
  const canSubmit = isFreelancer && !!job && (job.status === 'Accepted' || job.status === 'InProgress');
  const canRelease =
    isClient &&
    !!job &&
    !!job.freelancer &&
    (job.status === 'Submitted' || job.status === 'Completed') &&
    parseFloat(escrowBalanceMas) > 0;

  const handleReleaseFunds = async () => {
    if (!wallet || !client || !account || !job) return;
    if (!jobId) {
      setError('Job id is missing from the URL.');
      return;
    }
    if (!CONFIG.CONTRACTS.ESCROW) {
      setError('Escrow contract address is not configured. Set it in config.ts after deploying.');
      return;
    }

    setReleasing(true);
    setError(null);
    try {
      const service = createContractService(client);
      if (!service) throw new Error('Wallet not connected');

      await service.releaseFunds(BigInt(jobId), job.freelancer, job.totalPaymentMas);
      // Reload escrow balance
      await loadJob();
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Failed to release funds');
    } finally {
      setReleasing(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-400">{error}</div>;
  }

  if (!job) {
    return <div className="text-center py-12">Job not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="card space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold">{job.title}</h1>
            <div className="flex items-center space-x-4 mt-2 text-slate-400">
              <span className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span className="font-mono">{job.client}</span>
              </span>
              <span className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Due: {new Date(job.deadline).toLocaleDateString()}</span>
              </span>
            </div>
          </div>
          <span
            className={`px-4 py-2 rounded-full font-semibold ${
              job.status === 'Posted'
                ? 'bg-green-500/20 text-green-400'
                : job.status === 'Accepted'
                ? 'bg-blue-500/20 text-blue-400'
                : job.status === 'Completed'
                ? 'bg-primary-500/20 text-primary-400'
                : 'bg-slate-700'
            }`}
          >
            {job.status}
          </span>
        </div>

        <div className="pt-4 border-t border-slate-700">
          <h2 className="text-2xl font-bold mb-4">Description</h2>
          <p className="text-slate-300 whitespace-pre-wrap">{job.description}</p>
          {job.descriptionCID && (
            <p className="text-xs text-slate-500 mt-2">
              IPFS CID: {job.descriptionCID}
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-slate-700">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="text-slate-400 text-sm mb-1">Payment</div>
            <div className="text-2xl font-bold text-primary-400 flex items-center space-x-2">
              <DollarSign className="w-6 h-6" />
              <span>{job.totalPaymentMas} MAS</span>
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="text-slate-400 text-sm mb-1">Deadline</div>
            <div className="text-xl font-semibold">
              {new Date(job.deadline).toLocaleDateString()}
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 space-y-1">
            <div className="text-slate-400 text-sm mb-1">Status</div>
            <div className="text-xl font-semibold">{job.status}</div>
            {CONFIG.CONTRACTS.ESCROW && (
              <div className="text-sm text-slate-400">
                Escrow: <span className="font-semibold text-primary-300">{escrowBalanceMas} MAS</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Card */}
      {isConnected && (
        <div className="card space-y-4">
          <h2 className="text-2xl font-bold">Actions</h2>

          {canAccept && (
            <button
              onClick={handleAccept}
              className="w-full btn-primary py-4 disabled:opacity-50"
              disabled={accepting}
            >
              {accepting ? 'Accepting...' : 'Accept Job'}
            </button>
          )}

          {canSubmit && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Submission CID</label>
                <div className="relative">
                  <Upload className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={submissionCID}
                    onChange={(e) => setSubmissionCID(e.target.value)}
                    placeholder="Paste IPFS CID for your work submission"
                    className="input-field pl-12"
                  />
                </div>
              </div>
              <button
                onClick={handleSubmit}
                className="w-full btn-primary py-4 disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Work'}
              </button>
            </div>
          )}

          {isClient && job.status === 'Submitted' && (
            <div className="space-y-4">
              <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-yellow-400 mb-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-semibold">Work Submitted</span>
                </div>
                <p className="text-sm text-slate-300">
                  The freelancer has submitted their work. DAO voting will begin automatically.
                </p>
                {job.submissionCID && (
                  <p className="text-xs text-slate-500 mt-2">
                    Submission CID: {job.submissionCID}
                  </p>
                )}
              </div>
              {canRelease && (
                <button
                  onClick={handleReleaseFunds}
                  className="w-full btn-primary py-4 disabled:opacity-50"
                  disabled={releasing}
                >
                  {releasing ? 'Releasing...' : 'Release Funds to Freelancer'}
                </button>
              )}
            </div>
          )}

          {!canAccept && !canSubmit && !isClient && (
            <p className="text-slate-400 text-center py-4">
              {job.freelancer
                ? 'This job has been accepted by another freelancer'
                : 'No actions available'}
            </p>
          )}

          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Timeline</h2>
        <div className="space-y-4">
          <div className="flex items-start space-x-4">
            <CheckCircle className="w-6 h-6 text-green-400 mt-1" />
            <div>
              <div className="font-semibold">Job Created</div>
              <div className="text-sm text-slate-400">
                {new Date(job.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
          {job.freelancer && (
            <div className="flex items-start space-x-4">
              <CheckCircle className="w-6 h-6 text-blue-400 mt-1" />
              <div>
                <div className="font-semibold">Job Accepted</div>
                <div className="text-sm text-slate-400">By {job.freelancer}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobDetail;
