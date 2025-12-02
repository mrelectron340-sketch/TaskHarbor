type EnvBag = Record<string, string | undefined>;

const envSource: EnvBag =
  (typeof import.meta !== 'undefined' && (import.meta as any).env) ||
  ((globalThis as any)?.process?.env as EnvBag) ||
  {};

const fromEnv = (key: string, fallback = ''): string => {
  const value = envSource?.[key];
  return typeof value === 'string' && value.length > 0 ? value : fallback;
};

// Configuration for TaskHarbor
export const CONFIG = {
  NETWORK: fromEnv('VITE_NETWORK', 'buildnet'),
  RPC_URL: fromEnv('VITE_RPC_URL', 'https://buildnet.massa.net/api/v2'),
  CHAIN_ID: Number(fromEnv('VITE_CHAIN_ID', '77658366')),
  CONTRACTS: {
    JOB: fromEnv('VITE_CONTRACT_JOB', 'AS1GnQUuQi3T1Mj1dxAseQJbheo1ZcTGFL2ZxytLmjd386ygXLLT'),
    ESCROW: fromEnv('VITE_CONTRACT_ESCROW', 'AS1ZsdZ7DTmvAKzuW18k32wEVqd6Z2Tb6jWYCC8mwF4saiZ4oiLg'),
    VOTING: fromEnv('VITE_CONTRACT_VOTING', 'AS12toFoErTvMsoB8N3Jbu9cddvg4RWJVGW11ZKpU3TPMEEfUsmuU'),
    PROFILE: fromEnv('VITE_CONTRACT_PROFILE', 'AS12YWLjrReV9XNPRpSs3YNSBZk988HyGPTbYzNtt7yexsmaqwM9q'),
  },
  IPFS_GATEWAY: fromEnv('VITE_IPFS_GATEWAY', 'https://gateway.pinata.cloud/ipfs/'),
  VOTING_PERIOD_DAYS: Number(fromEnv('VITE_VOTING_PERIOD_DAYS', '3')),
};

export default CONFIG;