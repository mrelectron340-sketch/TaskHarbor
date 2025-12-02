import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Vote, Clock, CheckCircle, XCircle, AlertCircle, Gavel, Wallet, Settings } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { createContractService, OnChainDispute } from '../utils/contracts';
import CONFIG from '../config';
import DashboardNav from '../components/DashboardNav';

const Disputes: React.FC = () => {
  const { account, isConnected, client, wallet, userProfile } = useWallet();
  const [stake, setStake] = useState('0');
  const [dispute, setDispute] = useState<OnChainDispute | null>(null);
  const [disputeIdInput, setDisputeIdInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStake = async () => {
      if (!isConnected || !account || !client || !wallet || !CONFIG.CONTRACTS.VOTING) return;
      try {
        const service = createContractService(client);
        if (!service) return;
        const rawStake = await service.getStake(account.address);
        setStake((Number(rawStake) / 1e9).toString());
      } catch (e) {
        console.error(e);
        setStake('0');
      }
    };

    void loadStake();
  }, [isConnected, account, client]);

  const handleLoadDispute = async () => {
    if (!wallet || !client || !account || !disputeIdInput.trim()) return;
    if (!CONFIG.CONTRACTS.VOTING) {
      setError('Voting contract address is not configured. Set it in config.ts after deploying.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const service = createContractService(wallet);
      if (!service) throw new Error('Wallet not connected');

      const d = await service.getDispute(BigInt(disputeIdInput));
      setDispute(d);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Failed to load dispute');
      setDispute(null);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (side: 'for' | 'against') => {
    if (!wallet || !client || !account || !dispute || !CONFIG.CONTRACTS.VOTING) return;

    try {
      const service = createContractService(client);
      if (!service) throw new Error('Wallet not connected');

      await service.vote(dispute.id, side === 'for');
      alert(`Vote ${side} submitted on dispute ${dispute.id.toString()}`);
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'Failed to vote');
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Please connect your wallet</h2>
        <p className="text-slate-400">You need to be connected to view disputes</p>
      </div>
    );
  }

  if (userProfile?.role !== 'dao') {
    return (
      <div className="card max-w-2xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold mb-3">DAO role required</h2>
        <p className="text-slate-400">
          Only DAO members can review and vote on disputes. Switch your role in Settings if you are part of the DAO.
        </p>
      </div>
    );
  }

  const hasVotingPower = parseFloat(stake) > 0;

  return (
    <div className="space-y-6">
      <DashboardNav
        title="DAO Desk"
        subtitle="Review submissions, vote fairly, and keep escrow outcomes honest."
        links={[
          { path: '/disputes', label: 'Active Disputes', description: 'Cases awaiting your vote', icon: Gavel },
          { path: '/wallet/transactions', label: 'Treasury', description: 'Check rewards + stakes', icon: Wallet },
          { path: '/settings', label: 'Profile & Role', description: 'Manage DAO credentials', icon: Settings },
        ]}
        actionSlot={
          <div className="rounded-2xl bg-slate-800/70 px-6 py-4 text-left">
            <p className="text-xs uppercase tracking-wide text-slate-400">Voting Power</p>
            <p className="text-3xl font-extrabold text-primary-300 mt-1">{stake} MAS</p>
          </div>
        }
      />

      {!hasVotingPower && (
        <div className="card bg-yellow-500/10 border-yellow-500/50">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-yellow-400" />
            <div>
              <h3 className="font-semibold text-yellow-400">No Voting Power</h3>
              <p className="text-sm text-slate-300 mt-1">
                Stake tokens to participate in DAO voting
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="card space-y-4">
          <div className="flex items-center space-x-3">
            <Vote className="w-5 h-5 text-primary-400" />
            <h2 className="text-xl font-semibold">Load dispute by ID</h2>
          </div>
          <div className="flex flex-col md:flex-row gap-3 items-center">
            <input
              type="number"
              min="1"
              value={disputeIdInput}
              onChange={(e) => setDisputeIdInput(e.target.value)}
              placeholder="Enter dispute ID"
              className="input-field md:flex-1"
            />
            <button
              onClick={handleLoadDispute}
              disabled={loading || !disputeIdInput}
              className="btn-primary px-6 py-2 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load Dispute'}
            </button>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        {dispute ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <h3 className="text-xl font-bold">Dispute #{dispute.id.toString()}</h3>
                <p className="text-slate-400 text-sm">Job ID: {dispute.jobId.toString()}</p>
                <p className="text-slate-400">
                  Reason CID: {dispute.reasonCID || 'N/A (reason stored off-chain)'}
                </p>
                <div className="flex items-center space-x-6 text-sm mt-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 font-semibold">
                      {dispute.votesFor.toString()} For
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span className="text-red-400 font-semibold">
                      {dispute.votesAgainst.toString()} Against
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span>
                      Ends:{' '}
                      {new Date(Number(dispute.votingEndAt)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              {!dispute.resolved && (
                <span className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-semibold">
                  Active
                </span>
              )}
            </div>

            {!dispute.resolved && hasVotingPower && (
              <div className="flex space-x-4 pt-4 border-t border-slate-700">
                <button
                  onClick={() => handleVote('for')}
                  className="flex-1 btn-primary flex items-center justify-center space-x-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>Vote For</span>
                </button>
                <button
                  onClick={() => handleVote('against')}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition"
                >
                  <XCircle className="w-5 h-5 inline mr-2" />
                  Vote Against
                </button>
              </div>
            )}

            {dispute.resolved && (
              <div className="pt-4 border-t border-slate-700">
                <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-green-400">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">Resolved</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="card text-center py-12">
            <Vote className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">No dispute loaded</h3>
            <p className="text-slate-400">
              Enter a dispute ID above to inspect and vote using your on-chain stake.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Disputes;


