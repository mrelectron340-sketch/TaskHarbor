import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Receipt, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useWallet } from '../context/WalletContext';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'payment' | 'refund';
  amount: string;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  jobId?: string;
}

const WalletTransactions: React.FC = () => {
  const { isConnected } = useWallet();
  const [transactions] = useState<Transaction[]>([]);
  const [loading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'deposit' | 'withdrawal' | 'payment' | 'refund'>('all');

  // NOTE:
  // A real on-chain transaction history requires indexing contract events off-chain.
  // This page is left as a read-only shell; once you run an indexer, you can feed
  // its data into this component instead of using mock data.

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Please connect your wallet</h2>
        <p className="text-slate-400">Connect your wallet to view transaction history</p>
      </div>
    );
  }

  const filteredTransactions = transactions.filter(tx => 
    filter === 'all' || tx.type === filter
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="w-5 h-5 text-blue-400" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-5 h-5 text-green-400" />;
      case 'payment':
        return <ArrowDownLeft className="w-5 h-5 text-primary-400" />;
      case 'refund':
        return <ArrowUpRight className="w-5 h-5 text-yellow-400" />;
      default:
        return <Receipt className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold">Transaction History</h1>
        <p className="text-slate-400 mt-2">View all your escrow transactions and payments</p>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-2">
          {(['all', 'deposit', 'withdrawal', 'payment', 'refund'] as const).map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filter === filterType
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-20 bg-slate-700 rounded"></div>
            </div>
          ))}
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="card text-center py-12">
          <Receipt className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">No transactions found</h3>
          <p className="text-slate-400">Your transaction history will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTransactions.map((tx, index) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card hover:border-primary-500/50 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-slate-800 rounded-lg">
                    {getTypeIcon(tx.type)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{tx.description}</h3>
                    <div className="flex items-center space-x-2 text-sm text-slate-400 mt-1">
                      <span>{new Date(tx.timestamp).toLocaleString()}</span>
                      {tx.jobId && (
                        <>
                          <span>•</span>
                          <span>Job #{tx.jobId}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xl font-bold ${
                    tx.type === 'withdrawal' || tx.type === 'refund'
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}>
                    {tx.type === 'withdrawal' || tx.type === 'refund' ? '+' : '-'}{tx.amount} MAS
                  </div>
                  <div className="flex items-center justify-end space-x-2 mt-1">
                    {getStatusIcon(tx.status)}
                    <span className="text-sm text-slate-400 capitalize">{tx.status}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WalletTransactions;



