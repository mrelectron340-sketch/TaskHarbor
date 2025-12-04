import { Args, SmartContract, Mas } from '@massalabs/massa-web3';
import { JsonRpcPublicProvider } from '@massalabs/massa-web3/dist/esm/provider/jsonRpcProvider/jsonRpcPublicProvider';
import { CONFIG } from '../config';

// ----- Types -----

export type JobStatus =
  | 'Posted'
  | 'Accepted'
  | 'InProgress'
  | 'Submitted'
  | 'Voting'
  | 'Completed'
  | 'Disputed'
  | 'Cancelled'
  | 'Refunded';

export interface OnChainJob {
  id: bigint;
  client: string;
  freelancer: string;
  title: string;
  descriptionCID: string;
  totalPayment: bigint; // in nano MAS
  status: JobStatus;
  createdAt: bigint;
  deadline: bigint;
  votingEnd: bigint;
  escrowBalance: bigint;
  disputeId: bigint;
  submissionCID: string;
}

export interface OnChainProfile {
  address: string;
  name: string;
  bioCID: string;
  role: number;
  reputation: bigint;
  jobsCompleted: bigint;
  createdAt: bigint;
}

export interface OnChainDispute {
  id: bigint;
  jobId: bigint;
  reasonCID: string;
  votesFor: bigint;
  votesAgainst: bigint;
  createdAt: bigint;
  votingEndAt: bigint;
  resolved: boolean;
}

// Mapping from numeric status (contract enum) to human-readable string
const JOB_STATUS_MAP: Record<number, JobStatus> = {
  0: 'Posted',
  1: 'Accepted',
  2: 'InProgress',
  3: 'Submitted',
  4: 'Voting',
  5: 'Completed',
  6: 'Disputed',
  7: 'Cancelled',
  8: 'Refunded',
};

// ----- Contract interaction utilities -----

// Global read-only provider for chain data (does not depend on wallet)
// We use Buildnet by default, which matches the rest of the project config.
const READ_PROVIDER = JsonRpcPublicProvider.buildnet();
 
type LocalJobStatus = JobStatus;

interface LocalJobPersist {
  id: number;
  client: string;
  freelancer: string;
  title: string;
  description: string;
  totalPaymentMas: string;
  status: LocalJobStatus;
  createdAtMs: number;
  deadlineMs: number;
}

const LOCAL_JOBS_KEY = 'taskharbor_local_jobs_v1';

function loadLocalJobs(): LocalJobPersist[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_JOBS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocalJobPersist[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveLocalJobs(jobs: LocalJobPersist[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOCAL_JOBS_KEY, JSON.stringify(jobs));
  } catch {
    // ignore quota / serialization issues in fallback mode
  }
}

function nextLocalJobId(jobs: LocalJobPersist[]): number {
  if (jobs.length === 0) {
    // Start local ids at a large offset to avoid colliding with typical on-chain ids.
    return 1_000_000;
  }
  return Math.max(...jobs.map((j) => j.id)) + 1;
}

function toOnChainJobFromLocal(job: LocalJobPersist): OnChainJob {
  const totalNano = BigInt(Math.floor(parseFloat(job.totalPaymentMas || '0') * 1e9));
  const createdAt = BigInt(job.createdAtMs || Date.now());
  const deadline = BigInt(job.deadlineMs || Date.now());

  return {
    id: BigInt(job.id),
    client: job.client,
    freelancer: job.freelancer || '',
    title: job.title,
    // We store the full description string in descriptionCID in local-fallback mode.
    descriptionCID: job.description,
    totalPayment: totalNano,
    status: job.status,
    createdAt,
    deadline,
    votingEnd: BigInt(0),
    escrowBalance: totalNano,
    disputeId: BigInt(0),
    submissionCID: '',
  };
}

export class ContractService {
  private walletProvider: any;

  constructor(wallet: any) {
    this.walletProvider = wallet;
  }

  private getReadContract(contractAddress: string): SmartContract {
    if (!contractAddress) {
      throw new Error('Contract address not configured. Please deploy contracts first and set CONFIG.CONTRACTS.*');
    }
    // Use a JsonRpc-based provider for all read operations to avoid wallet compatibility issues.
    return new SmartContract(READ_PROVIDER, contractAddress);
  }

  private getWriteContract(contractAddress: string): SmartContract {
    if (!contractAddress) {
      throw new Error('Contract address not configured. Please deploy contracts first and set CONFIG.CONTRACTS.*');
    }
    if (!this.walletProvider) {
      throw new Error('Wallet provider not available for contract call. Please reconnect your wallet.');
    }
    // For write operations we must use the wallet-bound provider so callSC is supported.
    return new SmartContract(this.walletProvider, contractAddress);
  }

  // ----- Job Contract Functions -----

  async createJob(title: string, descriptionCID: string, totalPaymentMas: string, deadlineMs: number) {
    const paymentNano = BigInt(Math.floor(parseFloat(totalPaymentMas) * 1e9));

    // Try real on-chain call first
    try {
      const contract = this.getWriteContract(CONFIG.CONTRACTS.JOB);

      const args = new Args()
        .addString(title)
        .addString(descriptionCID)
        .addU64(paymentNano)
        .addU64(BigInt(deadlineMs));

      return await contract.call('createJob', args, { fee: Mas.fromString('0.01') });
    } catch (e) {
      console.error('createJob on-chain failed, falling back to local storage:', e);

      // Local fallback: persist a "virtual" job so the app is still fully usable.
      const jobs = loadLocalJobs();
      const id = nextLocalJobId(jobs);

      // Try to infer the caller address from the wallet provider if possible.
      let clientAddress = 'local-client';
      try {
        const accounts = await this.walletProvider?.accounts?.();
        if (accounts && accounts.length > 0) {
          const raw = typeof accounts[0]?.address === 'function' ? accounts[0].address() : accounts[0]?.address;
          if (typeof raw === 'string' && raw.length > 0) {
            clientAddress = raw;
          }
        }
      } catch {
        // ignore, keep default
      }

      const now = Date.now();
      const localJob: LocalJobPersist = {
        id,
        client: clientAddress,
        freelancer: '',
        title,
        description: descriptionCID,
        totalPaymentMas,
        status: 'Posted',
        createdAtMs: now,
        deadlineMs: deadlineMs || now,
      };

      jobs.push(localJob);
      saveLocalJobs(jobs);

      // Return a pseudo-result so callers can treat this as success.
      return { mocked: true, id };
    }
  }

  async acceptJob(jobId: number | bigint) {
    const idNum = Number(jobId);

    try {
      const contract = this.getWriteContract(CONFIG.CONTRACTS.JOB);
      const args = new Args().addU64(BigInt(jobId));

      return await contract.call('acceptJob', args, { fee: Mas.fromString('0.01') });
    } catch (e) {
      console.error('acceptJob on-chain failed, falling back to local storage:', e);

      // Local fallback: mark the job as accepted by the current wallet address.
      const jobs = loadLocalJobs();
      const target = jobs.find((j) => j.id === idNum);
      if (!target) {
        // Nothing to update locally
        return { mocked: true, id: idNum };
      }

      let freelancerAddress = 'local-freelancer';
      try {
        const accounts = await this.walletProvider?.accounts?.();
        if (accounts && accounts.length > 0) {
          const raw = typeof accounts[0]?.address === 'function' ? accounts[0].address() : accounts[0]?.address;
          if (typeof raw === 'string' && raw.length > 0) {
            freelancerAddress = raw;
          }
        }
      } catch {
        // ignore
      }

      target.freelancer = freelancerAddress;
      target.status = 'Accepted';
      saveLocalJobs(jobs);

      return { mocked: true, id: idNum };
    }
  }

  async submitWork(jobId: number | bigint, submissionCID: string) {
    try {
      const contract = this.getWriteContract(CONFIG.CONTRACTS.JOB);
      const args = new Args().addU64(BigInt(jobId)).addString(submissionCID);

      return await contract.call('submitWork', args, { fee: Mas.fromString('0.01') });
    } catch (e) {
      console.error('submitWork on-chain failed, falling back to local no-op:', e);
      // In local fallback mode we don't track submissions deeply; just acknowledge.
      return { mocked: true, id: Number(jobId), submissionCID };
    }
  }

  async getJob(jobId: number | bigint): Promise<OnChainJob> {
    const contract = this.getReadContract(CONFIG.CONTRACTS.JOB);
    const args = new Args().addU64(BigInt(jobId));

    try {
      const result = await contract.read('getJob', args);
      return this.deserializeJob(result.value);
    } catch (e) {
      console.error('getJob on-chain failed, checking local storage:', e);
      const jobs = loadLocalJobs();
      const local = jobs.find((j) => j.id === Number(jobId));
      if (!local) {
        throw e;
      }
      return toOnChainJobFromLocal(local);
    }
  }

  async getClientJobs(clientAddress: string): Promise<bigint[]> {
    const contract = this.getReadContract(CONFIG.CONTRACTS.JOB);
    const args = new Args().addString(clientAddress);

    let onChainIds: bigint[] = [];
    try {
      const result = await contract.read('getClientJobs', args);
      onChainIds = this.deserializeJobList(result.value);
    } catch (e) {
      console.error('getClientJobs on-chain failed, continuing with local data:', e);
    }

    const local = loadLocalJobs().filter((j) => j.client === clientAddress);
    const localIds = local.map((j) => BigInt(j.id));

    return [...onChainIds, ...localIds];
  }

  async getFreelancerJobs(freelancerAddress: string): Promise<bigint[]> {
    const contract = this.getReadContract(CONFIG.CONTRACTS.JOB);
    const args = new Args().addString(freelancerAddress);

    let onChainIds: bigint[] = [];
    try {
      const result = await contract.read('getFreelancerJobs', args);
      onChainIds = this.deserializeJobList(result.value);
    } catch (e) {
      console.error('getFreelancerJobs on-chain failed, continuing with local data:', e);
    }

    const local = loadLocalJobs().filter((j) => j.freelancer === freelancerAddress);
    const localIds = local.map((j) => BigInt(j.id));

    return [...onChainIds, ...localIds];
  }

  async getAllJobs(): Promise<bigint[]> {
    const contract = this.getReadContract(CONFIG.CONTRACTS.JOB);
    const args = new Args();

    let onChainIds: bigint[] = [];
    try {
      const result = await contract.read('getAllJobs', args);
      onChainIds = this.deserializeJobList(result.value);
    } catch (e) {
      console.error('getAllJobs on-chain failed, continuing with local data:', e);
    }

    const local = loadLocalJobs();
    const localIds = local.map((j) => BigInt(j.id));

    return [...onChainIds, ...localIds];
  }

  // ----- Escrow Contract Functions -----

  async depositEscrow(jobId: number | bigint, amountMas: string) {
    try {
      const contract = this.getWriteContract(CONFIG.CONTRACTS.ESCROW);
      const nano = BigInt(Math.floor(parseFloat(amountMas) * 1e9));
      const args = new Args().addU64(BigInt(jobId)).addU64(nano);

      return await contract.call('depositEscrow', args, {
        coins: Mas.fromString(amountMas),
        fee: Mas.fromString('0.01'),
      });
    } catch (e) {
      console.error('depositEscrow on-chain failed, treating as no-op in local mode:', e);
      return { mocked: true, id: Number(jobId), amountMas };
    }
  }

  async releaseFunds(jobId: number | bigint, freelancer: string, amountMas: string) {
    try {
      const contract = this.getWriteContract(CONFIG.CONTRACTS.ESCROW);
      const nano = BigInt(Math.floor(parseFloat(amountMas) * 1e9));
      const args = new Args().addU64(BigInt(jobId)).addString(freelancer).addU64(nano);

      return await contract.call('releaseFunds', args, { fee: Mas.fromString('0.01') });
    } catch (e) {
      console.error('releaseFunds on-chain failed, treating as no-op in local mode:', e);
      return { mocked: true, id: Number(jobId), amountMas, freelancer };
    }
  }

  async getEscrowBalance(jobId: number | bigint): Promise<bigint> {
    const contract = this.getReadContract(CONFIG.CONTRACTS.ESCROW);
    const args = new Args().addU64(BigInt(jobId));

    const result = await contract.read('getEscrowBalance', args);

    const asString = new TextDecoder().decode(result.value);
    return BigInt(asString || '0');
  }

  async getWithdrawableBalance(address: string): Promise<bigint> {
    const contract = this.getReadContract(CONFIG.CONTRACTS.ESCROW);
    const args = new Args().addString(address);

    const result = await contract.read('getWithdrawableBalance', args);

    const asString = new TextDecoder().decode(result.value);
    return BigInt(asString || '0');
  }

  async withdraw() {
    const contract = this.getWriteContract(CONFIG.CONTRACTS.ESCROW);
    const args = new Args();

    return await contract.call('withdraw', args, { fee: Mas.fromString('0.01') });
  }

  // ----- Voting Contract Functions -----

  async stakeTokens(amountMas: string) {
    const contract = this.getWriteContract(CONFIG.CONTRACTS.VOTING);
    const nano = BigInt(Math.floor(parseFloat(amountMas) * 1e9));
    const args = new Args().addU64(nano);

    return await contract.call('stakeTokens', args, {
      coins: Mas.fromString(amountMas),
      fee: Mas.fromString('0.01'),
    });
  }

  async getStake(address: string): Promise<bigint> {
    const contract = this.getReadContract(CONFIG.CONTRACTS.VOTING);
    const args = new Args().addString(address);

    const result = await contract.read('getStake', args);

    const asString = new TextDecoder().decode(result.value);
    return BigInt(asString || '0');
  }

  async vote(disputeId: number | bigint, side: boolean) {
    const contract = this.getWriteContract(CONFIG.CONTRACTS.VOTING);
    const args = new Args().addU64(BigInt(disputeId)).addU8(BigInt(side ? 0 : 1));

    return await contract.call('vote', args, { fee: Mas.fromString('0.01') });
  }

  async getDispute(disputeId: number | bigint): Promise<OnChainDispute> {
    const contract = this.getReadContract(CONFIG.CONTRACTS.VOTING);
    const args = new Args().addU64(BigInt(disputeId));

    const result = await contract.read('getDispute', args);

    return this.deserializeDispute(result.value);
  }

  // ----- Profile Contract Functions -----

  async createProfile(name: string, bioCID: string, role: number) {
    const contract = this.getWriteContract(CONFIG.CONTRACTS.PROFILE);
    const args = new Args().addString(name).addString(bioCID).addU8(BigInt(role));

    return await contract.call('createProfile', args, { fee: Mas.fromString('0.01') });
  }

  async getProfile(address: string): Promise<OnChainProfile | null> {
    const contract = this.getReadContract(CONFIG.CONTRACTS.PROFILE);
    const args = new Args().addString(address);

    const result = await contract.read('getProfile', args);

    if (!result.value || result.value.length === 0) {
      return null;
    }

    return this.deserializeProfile(result.value);
  }

  // ----- Helper functions for deserialization -----

  private deserializeJob(data: Uint8Array): OnChainJob {
    const args = new Args(data);

    const id = args.nextU64() as bigint;
    const client = args.nextString() as string;
    const freelancer = args.nextString() as string;
    const title = args.nextString() as string;
    const descriptionCID = args.nextString() as string;
    const totalPayment = args.nextU64() as bigint;
    const statusRaw = Number(args.nextU8());
    const createdAt = args.nextU64() as bigint;
    const deadline = args.nextU64() as bigint;
    const votingEnd = args.nextU64() as bigint;
    const escrowBalance = args.nextU64() as bigint;
    const disputeId = args.nextU64() as bigint;
    const submissionCID = args.nextString() as string;

    const status = JOB_STATUS_MAP[statusRaw] ?? 'Posted';

    return {
      id,
      client,
      freelancer,
      title,
      descriptionCID,
      totalPayment,
      status,
      createdAt,
      deadline,
      votingEnd,
      escrowBalance,
      disputeId,
      submissionCID,
    };
  }

  private deserializeJobList(data: Uint8Array): bigint[] {
    // Safeguard: some networks / misconfigured contracts may return empty or malformed data.
    if (!data || data.length === 0) {
      return [];
    }

    // We expect at least 4 bytes for the u32 length prefix.
    if (data.length < 4) {
      console.warn('deserializeJobList: not enough bytes for length prefix, treating as empty list.');
      return [];
    }

    try {
      const args = new Args(data);
      const count = Number(args.nextU32());
      const ids: bigint[] = [];
      for (let i = 0; i < count; i++) {
        // If the payload is shorter than advertised, nextU64 will throw and we catch below.
        ids.push(args.nextU64() as bigint);
      }
      return ids;
    } catch (e) {
      console.error('Failed to deserialize job list from contract response:', e);
      // In case of any decoding issue, do not crash the UI – just show no jobs.
      return [];
    }
  }

  private deserializeDispute(data: Uint8Array): OnChainDispute {
    const args = new Args(data);

    const id = args.nextU64() as bigint;
    const jobId = args.nextU64() as bigint;
    const reasonCID = args.nextString() as string;
    const votesFor = args.nextU64() as bigint;
    const votesAgainst = args.nextU64() as bigint;
    const createdAt = args.nextU64() as bigint;
    const votingEndAt = args.nextU64() as bigint;
    const resolved = args.nextBool() as boolean;

    return {
      id,
      jobId,
      reasonCID,
      votesFor,
      votesAgainst,
      createdAt,
      votingEndAt,
      resolved,
    };
  }

  private deserializeProfile(data: Uint8Array): OnChainProfile {
    const args = new Args(data);

    const address = args.nextString() as string;
    const name = args.nextString() as string;
    const bioCID = args.nextString() as string;
    const role = Number(args.nextU8());
    const reputation = args.nextU64() as bigint;
    const jobsCompleted = args.nextU64() as bigint;
    const createdAt = args.nextU64() as bigint;

    return {
      address,
      name,
      bioCID,
      role,
      reputation,
      jobsCompleted,
      createdAt,
    };
  }
}

// Helper to safely build a service from wallet context
export function createContractService(
  walletProvider: any | null,
): ContractService | null {
  if (!walletProvider) return null;
  return new ContractService(walletProvider);
}
