import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wallet, User, Briefcase, Vote, ArrowRight } from 'lucide-react';
import { useWallet } from '../context/WalletContext';

const Login: React.FC = () => {
  const { connectWallet, updateProfile } = useWallet();
  const navigate = useNavigate();
  const [step, setStep] = useState<'connect' | 'profile'>('connect');
  const [profileData, setProfileData] = useState({
    name: '',
    bio: '',
    role: 'freelancer' as 'client' | 'freelancer' | 'dao',
  });

  const handleConnect = async () => {
    await connectWallet();
    setStep('profile');
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: profileData.name,
      bio: profileData.bio,
      role: profileData.role,
    });
    const nextRoute =
      profileData.role === 'client'
        ? '/dashboard/client'
        : profileData.role === 'freelancer'
        ? '/dashboard/freelancer'
        : '/disputes';
    navigate(nextRoute);
  };

  const roles = [
    { value: 'client', label: 'Client', icon: Briefcase, description: 'Post jobs and hire freelancers' },
    { value: 'freelancer', label: 'Freelancer', icon: User, description: 'Accept jobs and get paid' },
    { value: 'dao', label: 'DAO Member', icon: Vote, description: 'Vote on disputes and approvals' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h1 className="text-5xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
          Welcome to TaskHarbor
        </h1>
        <p className="text-xl text-slate-300">Connect your wallet to get started</p>
      </motion.div>

      {step === 'connect' ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card space-y-6"
        >
          <div className="text-center space-y-4">
            <div className="inline-flex p-6 bg-primary-600/20 rounded-full">
              <Wallet className="w-12 h-12 text-primary-400" />
            </div>
            <h2 className="text-3xl font-bold">Connect Your Wallet</h2>
            <p className="text-slate-400">
              Connect with Bearby or MassaStation to access TaskHarbor
            </p>
          </div>

          <button
            onClick={handleConnect}
            className="w-full btn-primary py-4 text-lg flex items-center justify-center space-x-3"
          >
            <Wallet className="w-6 h-6" />
            <span>Connect Wallet</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-semibold">Don't have a Massa wallet?</p>
            <p className="text-sm text-slate-400">
              Install Bearby (browser extension) or MassaStation (desktop) and reload
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.form
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onSubmit={handleProfileSubmit}
          className="card space-y-6"
        >
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">Complete Your Profile</h2>
            <p className="text-slate-400">Tell us about yourself</p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                required
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                placeholder="Enter your name"
                className="input-field pl-12"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Bio</label>
            <textarea
              required
              value={profileData.bio}
              onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
              placeholder="Tell us about yourself, your skills, and experience..."
              rows={4}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-4">I am a...</label>
            <div className="grid gap-4">
              {roles.map((role) => {
                const Icon = role.icon;
                const isSelected = profileData.role === role.value;
                return (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setProfileData({ ...profileData, role: role.value as 'client' | 'freelancer' | 'dao' })}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? 'border-primary-500 bg-primary-600/20'
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <Icon className={`w-6 h-6 ${isSelected ? 'text-primary-400' : 'text-slate-400'}`} />
                      <div>
                        <div className="font-semibold">{role.label}</div>
                        <div className="text-sm text-slate-400">{role.description}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <button type="submit" className="w-full btn-primary py-4 text-lg">
            Complete Setup
          </button>
        </motion.form>
      )}
    </div>
  );
};

export default Login;





