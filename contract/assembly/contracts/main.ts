// Main Contract - Entry point that delegates to other contracts
import { Context, generateEvent } from '@massalabs/massa-as-sdk';
import { Args } from '@massalabs/as-types';

// Re-export all contract functions
export * from './JobContract';
export * from './EscrowContract';
export * from './VotingContract';
export * from './ProfileContract';

/**
 * Constructor - Initialize all contracts
 */
export function constructor(binaryArgs: StaticArray<u8>): void {
  assert(Context.isDeployingContract(), 'Constructor can only be called during deployment');
  generateEvent('TaskHarbor Main Contract initialized');
}
