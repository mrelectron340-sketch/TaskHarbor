// Profile Contract - Manages user profiles and roles
import { Context, generateEvent, Storage } from '@massalabs/massa-as-sdk';
import { Args, stringToBytes, bytesToString } from '@massalabs/as-types';

const PROFILE_PREFIX = 'profile_';
const ROLE_CLIENT = 1;
const ROLE_FREELANCER = 2;
const ROLE_DAO = 4;

export class Profile {
  address: string;
  name: string;
  bioCID: string;
  role: u8;
  reputation: u64;
  jobsCompleted: u64;
  createdAt: u64;

  constructor(address: string, name: string, bioCID: string, role: u8) {
    this.address = address;
    this.name = name;
    this.bioCID = bioCID;
    this.role = role;
    this.reputation = 0;
    this.jobsCompleted = 0;
    this.createdAt = Context.timestamp();
  }

  serialize(): StaticArray<u8> {
    const args = new Args();
    args.add(this.address);
    args.add(this.name);
    args.add(this.bioCID);
    args.add(this.role);
    args.add(this.reputation);
    args.add(this.jobsCompleted);
    args.add(this.createdAt);
    return args.serialize();
  }

  static deserialize(data: StaticArray<u8>): Profile {
    const args = new Args(data);
    const address = args.nextString().expect('Failed to deserialize address');
    const name = args.nextString().expect('Failed to deserialize name');
    const bioCID = args.nextString().expect('Failed to deserialize bioCID');
    const role = args.nextU8().expect('Failed to deserialize role');
    const profile = new Profile(address, name, bioCID, role);
    profile.reputation = args.nextU64().expect('Failed to deserialize reputation');
    profile.jobsCompleted = args.nextU64().expect('Failed to deserialize jobsCompleted');
    profile.createdAt = args.nextU64().expect('Failed to deserialize createdAt');
    return profile;
  }
}

/**
 * Constructor
 */
export function constructor(_: StaticArray<u8>): void {
  assert(Context.isDeployingContract(), 'Constructor can only be called during deployment');
  generateEvent('ProfileContract initialized');
}

/**
 * Create or update profile
 */
export function createProfile(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const name = args.nextString().expect('Name is required');
  const bioCID = args.nextString().expect('Bio CID is required');
  const role = args.nextU8().expect('Role is required');

  const caller = Context.caller().toString();
  const profileKey = PROFILE_PREFIX + caller;

  let profile: Profile;
  if (Storage.has(profileKey)) {
    const profileStr = Storage.get(profileKey);
    const profileBytes = changetype<StaticArray<u8>>(profileStr);
    profile = Profile.deserialize(profileBytes);
    profile.name = name;
    profile.bioCID = bioCID;
    profile.role = role;
  } else {
    profile = new Profile(caller, name, bioCID, role);
  }

  Storage.set(profileKey, changetype<string>(profile.serialize()));
  generateEvent(`ProfileCreated:${caller}:${name}:${role}`);
  return stringToBytes('Profile created/updated');
}

/**
 * Get profile
 */
export function getProfile(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const address = args.nextString().expect('Address is required');

  const profileKey = PROFILE_PREFIX + address;
  if (!Storage.has(profileKey)) {
    return new StaticArray<u8>(0);
  }

  const profileStr = Storage.get(profileKey);
  return changetype<StaticArray<u8>>(profileStr);
}

/**
 * Update reputation
 */
export function updateReputation(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const address = args.nextString().expect('Address is required');
  const points = args.nextI64().expect('Points is required');

  const profileKey = PROFILE_PREFIX + address;
  assert(Storage.has(profileKey), 'Profile does not exist');

  const profileStr = Storage.get(profileKey);
  const profileBytes = changetype<StaticArray<u8>>(profileStr);
  const profile = Profile.deserialize(profileBytes);
  if (points > 0) {
    profile.reputation = profile.reputation + (points as u64);
  } else {
    const absPoints = (-points) as u64;
    if (profile.reputation >= absPoints) {
      profile.reputation = profile.reputation - absPoints;
    } else {
      profile.reputation = 0;
    }
  }

  Storage.set(profileKey, changetype<string>(profile.serialize()));
  generateEvent(`ReputationUpdated:${address}:${profile.reputation}`);
  return stringToBytes(profile.reputation.toString());
}

/**
 * Increment jobs completed
 */
export function incrementJobsCompleted(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const address = args.nextString().expect('Address is required');

  const profileKey = PROFILE_PREFIX + address;
  assert(Storage.has(profileKey), 'Profile does not exist');

  const profileStr = Storage.get(profileKey);
  const profileBytes = changetype<StaticArray<u8>>(profileStr);
  const profile = Profile.deserialize(profileBytes);
  profile.jobsCompleted = profile.jobsCompleted + 1;
  Storage.set(profileKey, changetype<string>(profile.serialize()));

  generateEvent(`JobsCompletedUpdated:${address}:${profile.jobsCompleted}`);
  return stringToBytes(profile.jobsCompleted.toString());
}

/**
 * Check if address has role
 */
export function hasRole(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const address = args.nextString().expect('Address is required');
  const role = args.nextU8().expect('Role is required');

  const profileKey = PROFILE_PREFIX + address;
  if (!Storage.has(profileKey)) {
    return stringToBytes('0');
  }

  const profileStr = Storage.get(profileKey);
  const profileBytes = changetype<StaticArray<u8>>(profileStr);
  const profile = Profile.deserialize(profileBytes);
  const hasRoleFlag = (profile.role & role) != 0 ? 1 : 0;
  return stringToBytes(hasRoleFlag.toString());
}
