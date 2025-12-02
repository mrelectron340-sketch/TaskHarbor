import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Shield, Save } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
// import { useNavigate } from 'react-router-dom';
import { createContractService } from '../utils/contracts';
import CONFIG from '../config';

const Settings: React.FC = () => {
  const { userProfile, updateProfile, account, client, wallet } = useWallet();
  // const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security'>('profile');
  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    bio: userProfile?.bio || '',
    role: userProfile?.role || 'freelancer',
    profileCid: '',
  });
  const [notifications, setNotifications] = useState({
    email: true,
    jobUpdates: true,
    payments: true,
    disputes: true,
  });

  if (!account) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Please connect your wallet</h2>
      </div>
    );
  }

  const handleSaveProfile = async () => {
    updateProfile(formData);

    // Optionally push profile to on-chain ProfileContract if CID is provided
    if (wallet && client && CONFIG.CONTRACTS.PROFILE && formData.profileCid.trim()) {
      try {
        const service = createContractService(client);
        if (!service) {
          throw new Error('Wallet not connected');
        }

        const roleNumber =
          formData.role === 'client' ? 1 : formData.role === 'freelancer' ? 2 : 4;

        await service.createProfile(formData.name || '', formData.profileCid.trim(), roleNumber);
      } catch (e) {
        console.error(e);
        alert(
          e instanceof Error
            ? `On-chain profile update failed: ${e.message}`
            : 'On-chain profile update failed',
        );
        return;
      }
    }

    alert('Profile updated successfully!');
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-4xl font-bold">Settings</h1>
        <p className="text-slate-400 mt-2">Manage your account settings and preferences</p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <div className="card space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'profile' | 'notifications' | 'security')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                    activeTab === tab.id
                      ? 'bg-primary-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="md:col-span-3">
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="card space-y-6"
            >
              <h2 className="text-2xl font-bold">Profile Settings</h2>

              <div>
                <label className="block text-sm font-semibold mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Profile IPFS CID</label>
                <input
                  type="text"
                  value={formData.profileCid}
                  onChange={(e) => setFormData({ ...formData, profileCid: e.target.value })}
                  placeholder="CID of your profile JSON (bio, avatar, skills, links)"
                  className="input-field"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Upload a JSON file with your profile data (bio, skills, avatarCid, portfolio links) to any IPFS
                  pinning service, then paste the CID here to reference it fully on-chain.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'client' | 'freelancer' | 'dao' })}
                  className="input-field"
                >
                  <option value="client">Client</option>
                  <option value="freelancer">Freelancer</option>
                  <option value="dao">DAO Member</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Wallet Address</label>
                <input
                  type="text"
                  value={account.address}
                  disabled
                  className="input-field bg-slate-900 opacity-50"
                />
              </div>

              <button onClick={handleSaveProfile} className="btn-primary flex items-center space-x-2">
                <Save className="w-5 h-5" />
                <span>Save Changes</span>
              </button>
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="card space-y-6"
            >
              <h2 className="text-2xl font-bold">Notification Preferences</h2>

              <div className="space-y-4">
                {Object.entries(notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                    <div>
                      <div className="font-semibold">
                        {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                      </div>
                      <div className="text-sm text-slate-400">
                        {key === 'email' && 'Receive email notifications'}
                        {key === 'jobUpdates' && 'Get notified about job status changes'}
                        {key === 'payments' && 'Receive payment notifications'}
                        {key === 'disputes' && 'Get notified about disputes'}
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                ))}
              </div>

              <button className="btn-primary flex items-center space-x-2">
                <Save className="w-5 h-5" />
                <span>Save Preferences</span>
              </button>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="card space-y-6"
            >
              <h2 className="text-2xl font-bold">Security Settings</h2>

              <div className="space-y-4">
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <div className="font-semibold mb-2">Wallet Connection</div>
                  <div className="text-sm text-slate-400 mb-4">
                    Your wallet is connected via Massa Station. Disconnect from the wallet extension.
                  </div>
                  <div className="font-mono text-sm bg-slate-900 p-2 rounded">
                    {account.address}
                  </div>
                </div>

                <div className="p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
                  <div className="font-semibold text-yellow-400 mb-2">Security Tips</div>
                  <ul className="text-sm text-slate-300 space-y-2 list-disc list-inside">
                    <li>Never share your private key with anyone</li>
                    <li>Always verify transaction details before signing</li>
                    <li>Keep your wallet software updated</li>
                    <li>Use hardware wallets for large amounts</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;

