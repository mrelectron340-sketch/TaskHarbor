// Voting Contract - Manages DAO voting on job submissions
import { Context, generateEvent, Storage } from '@massalabs/massa-as-sdk';
import { Args, stringToBytes, bytesToString } from '@massalabs/as-types';

const DISPUTE_COUNTER_KEY = 'dispute_counter';
const DISPUTE_PREFIX = 'dispute_';
const VOTE_PREFIX = 'vote_';
const STAKE_PREFIX = 'stake_';
const VOTING_PERIOD: u64 = 259200000; // 3 days in milliseconds

export enum VoteSide {
  For = 0,
  Against = 1,
}

export class Dispute {
  id: u64;
  jobId: u64;
  reasonCID: string;
  votesFor: u64;
  votesAgainst: u64;
  createdAt: u64;
  votingEndAt: u64;
  resolved: bool;

  constructor(jobId: u64, reasonCID: string) {
    // Initialize all fields first
    this.jobId = jobId;
    this.reasonCID = reasonCID;
    this.votesFor = 0;
    this.votesAgainst = 0;
    this.createdAt = Context.timestamp();
    this.votingEndAt = this.createdAt + VOTING_PERIOD;
    this.resolved = false;
    
    // Get counter and set id
    let counter: u64 = 0;
    if (Storage.has(DISPUTE_COUNTER_KEY)) {
      const counterStr = Storage.get(DISPUTE_COUNTER_KEY);
      counter = U64.parseInt(counterStr);
    }
    this.id = counter + 1;
    Storage.set(DISPUTE_COUNTER_KEY, this.id.toString());
  }

  serialize(): StaticArray<u8> {
    const args = new Args();
    args.add(this.id);
    args.add(this.jobId);
    args.add(this.reasonCID);
    args.add(this.votesFor);
    args.add(this.votesAgainst);
    args.add(this.createdAt);
    args.add(this.votingEndAt);
    args.add(this.resolved);
    return args.serialize();
  }

  static deserialize(data: StaticArray<u8>): Dispute {
    const args = new Args(data);
    const id = args.nextU64().expect('Failed to deserialize id');
    const jobId = args.nextU64().expect('Failed to deserialize jobId');
    const reasonCID = args.nextString().expect('Failed to deserialize reasonCID');
    const dispute = new Dispute(jobId, reasonCID);
    dispute.id = id; // Override the auto-generated id
    dispute.votesFor = args.nextU64().expect('Failed to deserialize votesFor');
    dispute.votesAgainst = args.nextU64().expect('Failed to deserialize votesAgainst');
    dispute.createdAt = args.nextU64().expect('Failed to deserialize createdAt');
    dispute.votingEndAt = args.nextU64().expect('Failed to deserialize votingEndAt');
    dispute.resolved = args.nextBool().expect('Failed to deserialize resolved');
    return dispute;
  }
}

/**
 * Constructor
 */
export function constructor(_: StaticArray<u8>): void {
  assert(Context.isDeployingContract(), 'Constructor can only be called during deployment');
  Storage.set(DISPUTE_COUNTER_KEY, '0');
  generateEvent('VotingContract initialized');
}

/**
 * Stake tokens for voting power
 */
export function stakeTokens(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const amount = args.nextU64().expect('Amount is required');

  const caller = Context.caller().toString();
  const stakeKey = STAKE_PREFIX + caller;
  
  let currentStake: u64 = 0;
  if (Storage.has(stakeKey)) {
    const stakeStr = Storage.get(stakeKey);
    currentStake = U64.parseInt(stakeStr);
  }

  const newStake = currentStake + amount;
  Storage.set(stakeKey, newStake.toString());

  generateEvent(`TokensStaked:${caller}:${amount}:${newStake}`);
  return stringToBytes(newStake.toString());
}

/**
 * Unstake tokens
 */
export function unstakeTokens(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const amount = args.nextU64().expect('Amount is required');

  const caller = Context.caller().toString();
  const stakeKey = STAKE_PREFIX + caller;
  
  assert(Storage.has(stakeKey), 'No stake found');
  const stakeStr = Storage.get(stakeKey);
  const currentStake = U64.parseInt(stakeStr);
  assert(currentStake >= amount, 'Insufficient stake');

  const newStake = currentStake - amount;
  Storage.set(stakeKey, newStake.toString());

  generateEvent(`TokensUnstaked:${caller}:${amount}:${newStake}`);
  return stringToBytes(newStake.toString());
}

/**
 * Get stake for an address
 */
export function getStake(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const address = args.nextString().expect('Address is required');

  const stakeKey = STAKE_PREFIX + address;
  if (!Storage.has(stakeKey)) {
    return stringToBytes('0');
  }

  const stakeStr = Storage.get(stakeKey);
  return stringToBytes(stakeStr);
}

/**
 * Create a dispute
 */
export function createDispute(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const jobId = args.nextU64().expect('Job ID is required');
  const reasonCID = args.nextString().expect('Reason CID is required');

  const dispute = new Dispute(jobId, reasonCID);
  const disputeKey = DISPUTE_PREFIX + dispute.id.toString();
  Storage.set(disputeKey, changetype<string>(dispute.serialize()));

  generateEvent(`DisputeCreated:${dispute.id}:${jobId}:${reasonCID}`);
  return stringToBytes(dispute.id.toString());
}

/**
 * Vote on a dispute
 */
export function vote(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const disputeId = args.nextU64().expect('Dispute ID is required');
  const side = args.nextU8().expect('Vote side is required');

  const disputeKey = DISPUTE_PREFIX + disputeId.toString();
  assert(Storage.has(disputeKey), 'Dispute does not exist');

  const disputeStr = Storage.get(disputeKey);
  const disputeBytes = changetype<StaticArray<u8>>(disputeStr);
  const dispute = Dispute.deserialize(disputeBytes);
  assert(!dispute.resolved, 'Dispute is already resolved');
  assert(Context.timestamp() < dispute.votingEndAt, 'Voting period has ended');

  // Check if already voted
  const caller = Context.caller().toString();
  const voteKey = VOTE_PREFIX + disputeId.toString() + '_' + caller;
  assert(!Storage.has(voteKey), 'Already voted');

  // Get voter's stake
  const stakeKey = STAKE_PREFIX + caller;
  assert(Storage.has(stakeKey), 'No stake found');
  const stakeStr = Storage.get(stakeKey);
  const stake = U64.parseInt(stakeStr);
  assert(stake > 0, 'No voting power');

  // Record vote
  Storage.set(voteKey, '1');

  // Update dispute votes
  if (side == VoteSide.For) {
    dispute.votesFor = dispute.votesFor + stake;
  } else {
    dispute.votesAgainst = dispute.votesAgainst + stake;
  }
  Storage.set(disputeKey, changetype<string>(dispute.serialize()));

  generateEvent(`VoteCast:${disputeId}:${caller}:${stake}:${side}`);
  return stringToBytes('Vote cast successfully');
}

/**
 * Resolve voting (called automatically via deferred call)
 */
export function resolveVoting(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const disputeId = args.nextU64().expect('Dispute ID is required');

  const disputeKey = DISPUTE_PREFIX + disputeId.toString();
  assert(Storage.has(disputeKey), 'Dispute does not exist');

  const disputeStr = Storage.get(disputeKey);
  const disputeBytes = changetype<StaticArray<u8>>(disputeStr);
  const dispute = Dispute.deserialize(disputeBytes);
  assert(!dispute.resolved, 'Dispute is already resolved');
  assert(Context.timestamp() >= dispute.votingEndAt, 'Voting period has not ended');

  dispute.resolved = true;
  Storage.set(disputeKey, changetype<string>(dispute.serialize()));

  const result = dispute.votesFor > dispute.votesAgainst ? 'approved' : 'rejected';
  generateEvent(`VotingResolved:${disputeId}:${result}:${dispute.votesFor}:${dispute.votesAgainst}`);
  return stringToBytes(result);
}

/**
 * Get dispute details
 */
export function getDispute(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const disputeId = args.nextU64().expect('Dispute ID is required');

  const disputeKey = DISPUTE_PREFIX + disputeId.toString();
  assert(Storage.has(disputeKey), 'Dispute does not exist');

  const disputeStr = Storage.get(disputeKey);
  return changetype<StaticArray<u8>>(disputeStr);
}

/**
 * Start voting period for a job
 */
export function startVoting(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const jobId = args.nextU64().expect('Job ID is required');

  // Create a dispute for voting
  const dispute = new Dispute(jobId, '');
  const disputeKey = DISPUTE_PREFIX + dispute.id.toString();
  Storage.set(disputeKey, changetype<string>(dispute.serialize()));

  generateEvent(`VotingStarted:${jobId}:${dispute.id}:${dispute.votingEndAt}`);
  return stringToBytes(dispute.id.toString());
}
