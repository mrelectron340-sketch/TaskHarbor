import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// Using wallet-provider accounts directly; we treat the underlying provider as `any` for compatibility
import { providers } from '@massalabs/wallet-provider';

interface UserProfile {
  name: string;
  bio: string;
  role: 'client' | 'freelancer' | 'dao' | 'guest';
  address: string;
}

interface ConnectedAccount {
  address: string;
  providerName: string;
}

interface WalletContextType {
  account: ConnectedAccount | null;
  isConnected: boolean;
  userProfile: UserProfile | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  // `client` represents the on-chain Provider (implements readSC / callSC)
  client: any | null;
  // `wallet` is the UI wallet instance (Bearby, MassaStation, etc.)
  wallet: any | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<ConnectedAccount | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [client, setClient] = useState<any | null>(null);
  const [wallet, setWallet] = useState<any | null>(null);

  // Small helper to normalize whatever the wallet returns into a clean string address
  const getAddressString = (base: any): string => {
    try {
      const raw =
        typeof base?.address === 'function'
          ? base.address()
          : base?.address ?? base;
      return typeof raw === 'string' ? raw : String(raw ?? '');
    } catch {
      return '';
    }
  };

  useEffect(() => {
    // Check for existing connection
    const storedAccount = localStorage.getItem('massa_wallet_account');
    if (storedAccount) {
      try {
        JSON.parse(storedAccount);
        // Try to restore connection and provider bound to wallet account
        restoreConnection();
      } catch (e) {
        console.error('Failed to restore account:', e);
      }
    }
  }, []);

  const restoreConnection = async () => {
    try {
      const walletProviders = await providers();
      if (walletProviders.length > 0) {
        // Prefer Bearby if available, otherwise try MassaStation
        const preferred =
          walletProviders.find((w) => w.name().toLowerCase().includes('bearby')) ||
          walletProviders.find((w) => w.name().toLowerCase().includes('massastation')) ||
          walletProviders[0];

        let accounts = [] as Array<any>;
        try {
          if (preferred.name().toLowerCase().includes('bearby')) {
            const ok = await preferred.connect();
            if (!ok) return;
          }
          accounts = await preferred.accounts();
        } catch {
          accounts = [] as Array<any>;
        }

        if (accounts && accounts.length > 0) {
          // UI wallet instance (Bearby / MassaStation)
          setWallet(preferred);
          // Underlying wallet provider is used as the on-chain client implementing readSC / callSC
          const base = accounts[0];
          setClient(preferred);
          const addrStr = getAddressString(base);
          setAccount({
            address: addrStr,
            providerName: preferred.name(),
          });
          setIsConnected(true);

          const storedProfile = addrStr
            ? localStorage.getItem(`profile_${addrStr}`)
            : null;
          if (storedProfile) {
            setUserProfile(JSON.parse(storedProfile));
          }
        }
      }
    } catch (error) {
      console.error('Failed to restore connection:', error);
    }
  };

  const connectWallet = async () => {
    try {
      // Get available providers (Massa Station, Bearby, etc.)
      const walletProviders = await providers();

      if (walletProviders.length === 0) {
        alert('No wallets found. Please install Massa Station or Bearby wallet.');
        return;
      }

      // Prefer Bearby; fallback to MassaStation or first available
      const selectedWallet =
        walletProviders.find((w) => w.name().toLowerCase().includes('bearby')) ||
        walletProviders.find((w) => w.name().toLowerCase().includes('massastation')) ||
        walletProviders[0];

      // Connect if supported (Bearby); for MassaStation, skip connect
      if (selectedWallet.name().toLowerCase().includes('bearby')) {
        const connected = await selectedWallet.connect();
        if (!connected) {
          alert('Failed to connect to wallet. Please approve the connection.');
          return;
        }
      }

      // Get accounts
      const accounts = await selectedWallet.accounts();
      if (!accounts || accounts.length === 0) {
        alert('No accounts found in wallet.');
        return;
      }

      const base = accounts[0];
      // UI wallet instance (Bearby / MassaStation)
      setWallet(selectedWallet);
      // Underlying wallet provider is used as the on-chain client implementing readSC / callSC
      setClient(selectedWallet);
      const addrStr = getAddressString(base);
      setAccount({
        address: addrStr,
        providerName: selectedWallet.name(),
      });
      setIsConnected(true);
      localStorage.setItem('massa_wallet_account', JSON.stringify({
        address: addrStr,
        providerName: selectedWallet.name(),
      }));

      // Load or create profile
      const storedProfile = localStorage.getItem(`profile_${addrStr}`);
      if (storedProfile) {
        setUserProfile(JSON.parse(storedProfile));
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert(`Failed to connect wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setIsConnected(false);
    setUserProfile(null);
    setWallet(null);
    setClient(null);
    localStorage.removeItem('massa_wallet_account');
    void wallet?.disconnect?.();
  };

  const updateProfile = (profile: Partial<UserProfile>) => {
    if (account) {
      const newProfile = { ...userProfile, ...profile, address: account.address } as UserProfile;
      setUserProfile(newProfile);
      localStorage.setItem(`profile_${account.address}`, JSON.stringify(newProfile));
    }
  };

  return (
    <WalletContext.Provider
      value={{
        account,
        isConnected,
        userProfile,
        connectWallet,
        disconnectWallet,
        updateProfile,
        client,
        wallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
