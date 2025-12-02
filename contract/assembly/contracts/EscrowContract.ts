// Escrow Contract - Manages escrow deposits and withdrawals
import { Context, generateEvent, Storage, transferCoins } from '@massalabs/massa-as-sdk';
import { Args, stringToBytes, bytesToString } from '@massalabs/as-types';

const ESCROW_PREFIX = 'escrow_';
const WITHDRAWABLE_PREFIX = 'withdrawable_';

/**
 * Constructor
 */
export function constructor(_: StaticArray<u8>): void {
  assert(Context.isDeployingContract(), 'Constructor can only be called during deployment');
  generateEvent('EscrowContract initialized');
}

/**
 * Deposit funds to escrow for a job
 */
export function depositEscrow(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const jobId = args.nextU64().expect('Job ID is required');
  const amount = args.nextU64().expect('Amount is required');

  const escrowKey = ESCROW_PREFIX + jobId.toString();
  let currentBalance: u64 = 0;
  
  if (Storage.has(escrowKey)) {
    const balanceStr = Storage.get(escrowKey);
    currentBalance = U64.parseInt(balanceStr);
  }

  const newBalance = currentBalance + amount;
  Storage.set(escrowKey, newBalance.toString());

  generateEvent(`EscrowDeposited:${jobId}:${amount}:${newBalance}`);
  return stringToBytes(newBalance.toString());
}

/**
 * Release funds to freelancer (pull pattern)
 */
export function releaseFunds(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const jobId = args.nextU64().expect('Job ID is required');
  const freelancer = args.nextString().expect('Freelancer address is required');
  const amount = args.nextU64().expect('Amount is required');

  const escrowKey = ESCROW_PREFIX + jobId.toString();
  assert(Storage.has(escrowKey), 'Escrow does not exist');

  const balanceStr = Storage.get(escrowKey);
  const balance = U64.parseInt(balanceStr);
  assert(balance >= amount, 'Insufficient escrow balance');

  const newBalance = balance - amount;
  Storage.set(escrowKey, newBalance.toString());

  // Add to freelancer's withdrawable balance
  const withdrawableKey = WITHDRAWABLE_PREFIX + freelancer;
  let withdrawableBalance: u64 = 0;
  if (Storage.has(withdrawableKey)) {
    const wbStr = Storage.get(withdrawableKey);
    withdrawableBalance = U64.parseInt(wbStr);
  }
  const newWithdrawable = withdrawableBalance + amount;
  Storage.set(withdrawableKey, newWithdrawable.toString());

  generateEvent(`FundsReleased:${jobId}:${freelancer}:${amount}`);
  return stringToBytes('Funds released to withdrawable balance');
}

/**
 * Refund client
 */
export function refundClient(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const jobId = args.nextU64().expect('Job ID is required');
  const client = args.nextString().expect('Client address is required');

  const escrowKey = ESCROW_PREFIX + jobId.toString();
  assert(Storage.has(escrowKey), 'Escrow does not exist');

  const balanceStr = Storage.get(escrowKey);
  const balance = U64.parseInt(balanceStr);
  assert(balance > 0, 'Escrow is empty');

  // Clear escrow
  Storage.set(escrowKey, '0');

  // Add to client's withdrawable balance
  const withdrawableKey = WITHDRAWABLE_PREFIX + client;
  let withdrawableBalance: u64 = 0;
  if (Storage.has(withdrawableKey)) {
    const wbStr = Storage.get(withdrawableKey);
    withdrawableBalance = U64.parseInt(wbStr);
  }
  const newWithdrawable = withdrawableBalance + balance;
  Storage.set(withdrawableKey, newWithdrawable.toString());

  generateEvent(`RefundIssued:${jobId}:${client}:${balance}`);
  return stringToBytes(balance.toString());
}

/**
 * Withdraw available balance
 */
export function withdraw(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const caller = Context.caller();
  const withdrawableKey = WITHDRAWABLE_PREFIX + caller.toString();
  
  assert(Storage.has(withdrawableKey), 'No withdrawable balance');

  const balanceStr = Storage.get(withdrawableKey);
  const balance = U64.parseInt(balanceStr);
  assert(balance > 0, 'No balance to withdraw');

  // Clear withdrawable balance
  Storage.set(withdrawableKey, '0');

  // Transfer coins (this would need proper address parsing)
  // For now, we'll just record the withdrawal
  generateEvent(`Withdrawal:${caller.toString()}:${balance}`);
  return stringToBytes(balance.toString());
}

/**
 * Get escrow balance
 */
export function getEscrowBalance(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const jobId = args.nextU64().expect('Job ID is required');

  const escrowKey = ESCROW_PREFIX + jobId.toString();
  if (!Storage.has(escrowKey)) {
    return stringToBytes('0');
  }

  const balanceStr = Storage.get(escrowKey);
  return stringToBytes(balanceStr);
}

/**
 * Get withdrawable balance
 */
export function getWithdrawableBalance(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const address = args.nextString().expect('Address is required');

  const withdrawableKey = WITHDRAWABLE_PREFIX + address;
  if (!Storage.has(withdrawableKey)) {
    return stringToBytes('0');
  }

  const balanceStr = Storage.get(withdrawableKey);
  return stringToBytes(balanceStr);
}
