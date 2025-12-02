import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, TrendingUp, Shield, Zap, ArrowRight, Search } from 'lucide-react';
import { useWallet } from '../context/WalletContext';

const Home: React.FC = () => {
  const { isConnected, userProfile } = useWallet();
  const [searchQuery, setSearchQuery] = useState('');
  const role = userProfile?.role;

  const features = [
    {
      icon: Shield,
      title: 'Trustless Escrow',
      description: 'Funds are locked in smart contracts until work is approved',
    },
    {
      icon: Zap,
      title: 'Auto-Payments',
      description: 'Automatic payment release after DAO voting period',
    },
    {
      icon: TrendingUp,
      title: 'DAO Governance',
      description: 'Community-driven dispute resolution and job approval',
    },
    {
      icon: Briefcase,
      title: 'On-Chain Jobs',
      description: 'All job data stored on-chain for transparency',
    },
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-6 py-12"
      >
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-primary-400 via-primary-300 to-primary-500 bg-clip-text text-transparent"
        >
          TaskHarbor
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto"
        >
          Autonomous On-Chain Job Marketplace with Trustless Escrow & Auto-Pay
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          {!isConnected && (
            <Link to="/login" className="btn-primary text-lg px-8 py-4 flex items-center space-x-2">
              <Zap className="w-5 h-5" />
              <span>Connect & Choose Role</span>
            </Link>
          )}
          {isConnected && role === 'client' && (
            <Link to="/jobs/create" className="btn-primary text-lg px-8 py-4 flex items-center space-x-2">
              <Briefcase className="w-5 h-5" />
              <span>Post a Job</span>
            </Link>
          )}
          {isConnected && role === 'freelancer' && (
            <Link to="/dashboard/freelancer" className="btn-primary text-lg px-8 py-4 flex items-center space-x-2">
              <Briefcase className="w-5 h-5" />
              <span>Go to My Work</span>
            </Link>
          )}
          {isConnected && role === 'dao' && (
            <Link to="/disputes" className="btn-primary text-lg px-8 py-4 flex items-center space-x-2">
              <Briefcase className="w-5 h-5" />
              <span>Review Disputes</span>
            </Link>
          )}
          <Link to="/jobs" className="btn-secondary text-lg px-8 py-4 flex items-center space-x-2">
            <ArrowRight className="w-5 h-5" />
            <span>Browse Jobs</span>
          </Link>
        </motion.div>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="card"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search jobs by title, skills, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-12"
            />
          </div>
          <button className="btn-secondary flex items-center space-x-2">
            <span>Filters</span>
          </button>
        </div>
      </motion.div>

      {/* Features Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="space-y-8"
      >
        <h2 className="text-4xl font-bold text-center">Why TaskHarbor?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 + index * 0.1 }}
                whileHover={{ y: -5 }}
                className="card text-center space-y-4"
              >
                <div className="inline-flex p-4 bg-primary-600/20 rounded-full">
                  <Icon className="w-8 h-8 text-primary-400" />
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="card bg-gradient-to-r from-primary-600/20 to-primary-700/20 border-primary-500/50 text-center space-y-6"
      >
        <h2 className="text-4xl font-bold">Ready to Get Started?</h2>
        <p className="text-xl text-slate-300">
          Join the future of decentralized freelancing
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {!isConnected && (
            <Link to="/login" className="btn-primary text-lg px-8 py-4">
              Connect Wallet
            </Link>
          )}
          <Link to="/jobs" className="btn-secondary text-lg px-8 py-4">
            Explore Jobs
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Home;


