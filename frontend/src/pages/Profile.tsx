import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { User, Briefcase, Star, TrendingUp } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { createContractService, OnChainProfile } from '../utils/contracts';
import CONFIG from '../config';

interface ProfileJson {
  bio?: string;
  skills?: string[];
  avatarCid?: string;
  portfolio?: string[];
}

const roleLabel = (role: number): string => {
  if (role & 1) return 'client';
  if (role & 2) return 'freelancer';
  if (role & 4) return 'dao';
  return 'guest';
};

const Profile: React.FC = () => {
  const { address } = useParams<{ address: string }>();
  const { account, client, wallet } = useWallet();
  const [onChainProfile, setOnChainProfile] = useState<OnChainProfile | null>(null);
  const [profileJson, setProfileJson] = useState<ProfileJson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const targetAddress = address || account?.address || '';
  const isOwnProfile = targetAddress && account?.address === targetAddress;

  useEffect(() => {
    const loadProfile = async () => {
      if (!wallet || !client || !targetAddress || !CONFIG.CONTRACTS.PROFILE) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const service = createContractService(client);
        if (!service) throw new Error('Wallet not connected');

        const profile = await service.getProfile(targetAddress);
        if (!profile) {
          setOnChainProfile(null);
          setProfileJson(null);
          setLoading(false);
          return;
        }

        setOnChainProfile(profile);

        if (profile.bioCID) {
          try {
            const res = await fetch(`${CONFIG.IPFS_GATEWAY}${profile.bioCID}`);
            if (res.ok) {
              const text = await res.text();
              try {
                const parsed = JSON.parse(text) as ProfileJson;
                setProfileJson(parsed);
              } catch {
                setProfileJson({ bio: text });
              }
            }
          } catch {
            // Ignore IPFS failures
          }
        }
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [client, account, targetAddress]);

  if (loading) {
    return <div className="text-center py-12">Loading profile...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-400">{error}</div>;
  }

  if (!onChainProfile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">No on-chain profile found</h2>
        <p className="text-slate-400">
          {isOwnProfile
            ? 'Create your profile from the Settings page by adding an IPFS profile CID.'
            : 'This address has not created a profile yet.'}
        </p>
      </div>
    );
  }

  const avatarUrl =
    profileJson?.avatarCid && `${CONFIG.IPFS_GATEWAY}${profileJson.avatarCid}`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="card">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-6">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">{onChainProfile.name}</h1>
              <p className="text-slate-400 mb-4">
                {profileJson?.bio || 'No bio provided yet.'}
              </p>
              <div className="flex items-center flex-wrap gap-3 text-sm">
                <span className="font-mono text-slate-400">{onChainProfile.address}</span>
                <span className="px-3 py-1 bg-primary-600/20 text-primary-400 rounded-full capitalize">
                  {roleLabel(onChainProfile.role)}
                </span>
                {profileJson?.skills && profileJson.skills.length > 0 && (
                  <span className="text-slate-400">
                    Skills:{' '}
                    {profileJson.skills.join(', ')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card text-center">
          <div className="inline-flex p-4 bg-primary-600/20 rounded-full mb-4">
            <Briefcase className="w-8 h-8 text-primary-400" />
          </div>
          <div className="text-3xl font-bold text-primary-400">
            {onChainProfile.jobsCompleted.toString()}
          </div>
          <div className="text-slate-400 mt-2">Jobs Completed</div>
        </div>
        <div className="card text-center">
          <div className="inline-flex p-4 bg-yellow-500/20 rounded-full mb-4">
            <Star className="w-8 h-8 text-yellow-400" />
          </div>
          <div className="text-3xl font-bold text-yellow-400">
            {onChainProfile.reputation.toString()}
          </div>
          <div className="text-slate-400 mt-2">Reputation Score</div>
        </div>
        <div className="card text-center">
          <div className="inline-flex p-4 bg-green-500/20 rounded-full mb-4">
            <TrendingUp className="w-8 h-8 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-green-400">N/A</div>
          <div className="text-slate-400 mt-2">Total Earned (indexer required)</div>
        </div>
      </div>

      {/* Portfolio / Links */}
      {profileJson?.portfolio && profileJson.portfolio.length > 0 && (
        <div className="card">
          <h2 className="text-2xl font-bold mb-4">Portfolio</h2>
          <ul className="space-y-2">
            {profileJson.portfolio.map((url) => (
              <li key={url}>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary-400 hover:underline break-all"
                >
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Profile;
