import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { Home, Briefcase, User, Vote, Wallet, LogOut, Menu, X, Settings, Info, Plus as PlusIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isConnected, account, disconnectWallet, userProfile } = useWallet();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const activeRole = userProfile?.role ?? 'guest';
  const isClient = activeRole === 'client';
  const isFreelancer = activeRole === 'freelancer';
  const isDao = activeRole === 'dao';

  const baseNav = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/jobs', label: 'Jobs', icon: Briefcase },
    { path: '/about', label: 'How it works', icon: Info },
  ];

  const roleNav = [
    ...(isClient
      ? [
          { path: '/dashboard/client', label: 'Client Dashboard', icon: Briefcase },
          { path: '/jobs/create', label: 'Create Job', icon: PlusIcon },
        ]
      : []),
    ...(isFreelancer
      ? [{ path: '/dashboard/freelancer', label: 'Freelancer Dashboard', icon: User }]
      : []),
    ...(isDao ? [{ path: '/disputes', label: 'Dispute Center', icon: Vote }] : []),
    ...(isConnected ? [{ path: '/wallet/transactions', label: 'Transactions', icon: Wallet }] : []),
  ];

  const navItems = [...baseNav, ...(isConnected ? roleNav : [])];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2 group">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center"
              >
                <Briefcase className="w-6 h-6 text-white" />
              </motion.div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
                TaskHarbor
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                      isActive
                        ? 'bg-primary-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Wallet Section */}
            <div className="flex items-center space-x-4">
              {isConnected ? (
                <>
                  <div className="hidden md:flex items-center space-x-3 bg-slate-800 px-4 py-2 rounded-lg">
                    <Wallet className="w-4 h-4 text-primary-400" />
                    <span className="text-sm font-mono">
                      {typeof account?.address === 'string' && account.address.length > 10
                        ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}`
                        : String(account?.address ?? '')}
                    </span>
                    {userProfile?.role && (
                      <span className="px-2 py-0.5 text-xs uppercase tracking-wide bg-primary-600/20 text-primary-200 rounded">
                        {userProfile.role}
                      </span>
                    )}
                  </div>
                  {userProfile && (
                    <Link
                      to={`/profile/${account?.address}`}
                      className="hidden md:flex items-center space-x-2 bg-primary-600 px-4 py-2 rounded-lg hover:bg-primary-700 transition"
                    >
                      <User className="w-4 h-4" />
                      <span>{userProfile.name || 'Profile'}</span>
                    </Link>
                  )}
                  <Link
                    to="/settings"
                    className="p-2 hover:bg-slate-800 rounded-lg transition"
                    title="Settings"
                  >
                    <Settings className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={disconnectWallet}
                    className="p-2 hover:bg-slate-800 rounded-lg transition"
                    title="Disconnect"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="btn-primary flex items-center space-x-2"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Connect Wallet</span>
                </Link>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 hover:bg-slate-800 rounded-lg"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden border-t border-slate-700 bg-slate-900/95"
          >
            <nav className="container mx-auto px-4 py-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                      isActive
                        ? 'bg-primary-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900/80 border-t border-slate-700 py-8 mt-auto">
        <div className="container mx-auto px-4 text-center text-slate-400">
          <p>TaskHarbor - Decentralized Job Marketplace on Massa Blockchain</p>
          <p className="mt-2 text-sm">Built on Buildnet Testnet</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

