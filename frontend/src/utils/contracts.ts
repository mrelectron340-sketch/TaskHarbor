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

export class ContractService {
  // We accept a wallet instance for future extension, but reads are done via READ_PROVIDER.
  // The argument is intentionally unused for now.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_wallet: any) {}

  private getContract(contractAddress: string): SmartContract {
    if (!contractAddress) {
      throw new Error('Contract address not configured. Please deploy contracts first and set CONFIG.CONTRACTS.*');
    }
    // Use a JsonRpc-based provider for all read operations to avoid wallet compatibility issues.
    return new SmartContract(READ_PROVIDER, contractAddress);
  }

  // ----- Job Contract Functions -----

  async createJob(title: string, descriptionCID: string, totalPaymentMas: string, deadlineMs: number) {
    const contract = this.getContract(CONFIG.CONTRACTS.JOB);
    const paymentNano = BigInt(Math.floor(parseFloat(totalPaymentMas) * 1e9));

    const args = new Args()
      .addString(title)
      .addString(descriptionCID)
      .addU64(paymentNano)
      .addU64(BigInt(deadlineMs));

    return await contract.call('createJob', args, { fee: Mas.fromString('0.01') });
  }

  async acceptJob(jobId: number | bigint) {
    const contract = this.getContract(CONFIG.CONTRACTS.JOB);
    const args = new Args().addU64(BigInt(jobId));

    return await contract.call('acceptJob', args, { fee: Mas.fromString('0.01') });
  }

  async submitWork(jobId: number | bigint, submissionCID: string) {
    const contract = this.getContract(CONFIG.CONTRACTS.JOB);
    const args = new Args().addU64(BigInt(jobId)).addString(submissionCID);

    return await contract.call('submitWork', args, { fee: Mas.fromString('0.01') });
  }

  async getJob(jobId: number | bigint): Promise<OnChainJob> {
    const contract = this.getContract(CONFIG.CONTRACTS.JOB);
    const args = new Args().addU64(BigInt(jobId));

    const result = await contract.read('getJob', args);

    return this.deserializeJob(result.value);
  }

  async getClientJobs(clientAddress: string): Promise<bigint[]> {
    const contract = this.getContract(CONFIG.CONTRACTS.JOB);
    const args = new Args().addString(clientAddress);

    const result = await contract.read('getClientJobs', args);

    return this.deserializeJobList(result.value);
  }

  async getFreelancerJobs(freelancerAddress: string): Promise<bigint[]> {
    const contract = this.getContract(CONFIG.CONTRACTS.JOB);
    const args = new Args().addString(freelancerAddress);

    const result = await contract.read('getFreelancerJobs', args);

    return this.deserializeJobList(result.value);
  }

  async getAllJobs(): Promise<bigint[]> {
    const contract = this.getContract(CONFIG.CONTRACTS.JOB);
    const args = new Args();

    const result = await contract.read('getAllJobs', args);

    return this.deserializeJobList(result.value);
  }

  // ----- Escrow Contract Functions -----

  async depositEscrow(jobId: number | bigint, amountMas: string) {
    const contract = this.getContract(CONFIG.CONTRACTS.ESCROW);
    const nano = BigInt(Math.floor(parseFloat(amountMas) * 1e9));
    const args = new Args().addU64(BigInt(jobId)).addU64(nano);

    return await contract.call('depositEscrow', args, {
      coins: Mas.fromString(amountMas),
      fee: Mas.fromString('0.01'),
    });
  }

  async releaseFunds(jobId: number | bigint, freelancer: string, amountMas: string) {
    const contract = this.getContract(CONFIG.CONTRACTS.ESCROW);
    const nano = BigInt(Math.floor(parseFloat(amountMas) * 1e9));
    const args = new Args().addU64(BigInt(jobId)).addString(freelancer).addU64(nano);

    return await contract.call('releaseFunds', args, { fee: Mas.fromString('0.01') });
  }

  async getEscrowBalance(jobId: number | bigint): Promise<bigint> {
    const contract = this.getContract(CONFIG.CONTRACTS.ESCROW);
    const args = new Args().addU64(BigInt(jobId));

    const result = await contract.read('getEscrowBalance', args);

    const asString = new TextDecoder().decode(result.value);
    return BigInt(asString || '0');
  }

  async getWithdrawableBalance(address: string): Promise<bigint> {
    const contract = this.getContract(CONFIG.CONTRACTS.ESCROW);
    const args = new Args().addString(address);

    const result = await contract.read('getWithdrawableBalance', args);

    const asString = new TextDecoder().decode(result.value);
    return BigInt(asString || '0');
  }

  async withdraw() {
    const contract = this.getContract(CONFIG.CONTRACTS.ESCROW);
    const args = new Args();

    return await contract.call('withdraw', args, { fee: Mas.fromString('0.01') });
  }

  // ----- Voting Contract Functions -----

  async stakeTokens(amountMas: string) {
    const contract = this.getContract(CONFIG.CONTRACTS.VOTING);
    const nano = BigInt(Math.floor(parseFloat(amountMas) * 1e9));
    const args = new Args().addU64(nano);

    return await contract.call('stakeTokens', args, {
      coins: Mas.fromString(amountMas),
      fee: Mas.fromString('0.01'),
    });
  }

  async getStake(address: string): Promise<bigint> {
    const contract = this.getContract(CONFIG.CONTRACTS.VOTING);
    const args = new Args().addString(address);

    const result = await contract.read('getStake', args);

    const asString = new TextDecoder().decode(result.value);
    return BigInt(asString || '0');
  }

  async vote(disputeId: number | bigint, side: boolean) {
    const contract = this.getContract(CONFIG.CONTRACTS.VOTING);
    const args = new Args().addU64(BigInt(disputeId)).addU8(BigInt(side ? 0 : 1));

    return await contract.call('vote', args, { fee: Mas.fromString('0.01') });
  }

  async getDispute(disputeId: number | bigint): Promise<OnChainDispute> {
    const contract = this.getContract(CONFIG.CONTRACTS.VOTING);
    const args = new Args().addU64(BigInt(disputeId));

    const result = await contract.read('getDispute', args);

    return this.deserializeDispute(result.value);
  }

  // ----- Profile Contract Functions -----

  async createProfile(name: string, bioCID: string, role: number) {
    const contract = this.getContract(CONFIG.CONTRACTS.PROFILE);
    const args = new Args().addString(name).addString(bioCID).addU8(BigInt(role));

    return await contract.call('createProfile', args, { fee: Mas.fromString('0.01') });
  }

  async getProfile(address: string): Promise<OnChainProfile | null> {
    const contract = this.getContract(CONFIG.CONTRACTS.PROFILE);
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
    const args = new Args(data);
    const count = Number(args.nextU32());
    const ids: bigint[] = [];
    for (let i = 0; i < count; i++) {
      ids.push(args.nextU64() as bigint);
    }
    return ids;
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
