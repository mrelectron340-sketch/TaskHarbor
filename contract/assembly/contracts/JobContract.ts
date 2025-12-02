// Job Contract - Manages job creation, acceptance, and lifecycle
import { Context, generateEvent, Storage } from '@massalabs/massa-as-sdk';
import { Args, stringToBytes, bytesToString } from '@massalabs/as-types';

// Storage keys
const JOB_COUNTER_KEY = 'job_counter';
const JOB_PREFIX = 'job_';
const CLIENT_JOBS_PREFIX = 'client_jobs_';
const FREELANCER_JOBS_PREFIX = 'freelancer_jobs_';

// Job status enum
export enum JobStatus {
  Posted = 0,
  Accepted = 1,
  InProgress = 2,
  Submitted = 3,
  Voting = 4,
  Completed = 5,
  Disputed = 6,
  Cancelled = 7,
  Refunded = 8,
}

// Job structure
export class Job {
  id: u64;
  client: string;
  freelancer: string;
  title: string;
  descriptionCID: string;
  totalPayment: u64;
  status: JobStatus;
  createdAt: u64;
  deadline: u64;
  votingEnd: u64;
  escrowBalance: u64;
  disputeId: u64;
  submissionCID: string;

  constructor(
    id: u64,
    client: string,
    title: string,
    descriptionCID: string,
    totalPayment: u64,
    deadline: u64,
  ) {
    this.id = id;
    this.client = client;
    this.freelancer = '';
    this.title = title;
    this.descriptionCID = descriptionCID;
    this.totalPayment = totalPayment;
    this.status = JobStatus.Posted;
    this.createdAt = Context.timestamp();
    this.deadline = deadline;
    this.votingEnd = 0;
    this.escrowBalance = totalPayment;
    this.disputeId = 0;
    this.submissionCID = '';
  }

  serialize(): StaticArray<u8> {
    const args = new Args();
    args.add(this.id);
    args.add(this.client);
    args.add(this.freelancer);
    args.add(this.title);
    args.add(this.descriptionCID);
    args.add(this.totalPayment);
    args.add(this.status);
    args.add(this.createdAt);
    args.add(this.deadline);
    args.add(this.votingEnd);
    args.add(this.escrowBalance);
    args.add(this.disputeId);
    args.add(this.submissionCID);
    return args.serialize();
  }

  static deserialize(data: StaticArray<u8>): Job {
    const args = new Args(data);
    const job = new Job(0, '', '', '', 0, 0);
    job.id = args.nextU64().expect('Failed to deserialize id');
    job.client = args.nextString().expect('Failed to deserialize client');
    job.freelancer = args.nextString().expect('Failed to deserialize freelancer');
    job.title = args.nextString().expect('Failed to deserialize title');
    job.descriptionCID = args.nextString().expect('Failed to deserialize descriptionCID');
    job.totalPayment = args.nextU64().expect('Failed to deserialize totalPayment');
    job.status = args.nextU8().expect('Failed to deserialize status') as JobStatus;
    job.createdAt = args.nextU64().expect('Failed to deserialize createdAt');
    job.deadline = args.nextU64().expect('Failed to deserialize deadline');
    job.votingEnd = args.nextU64().expect('Failed to deserialize votingEnd');
    job.escrowBalance = args.nextU64().expect('Failed to deserialize escrowBalance');
    job.disputeId = args.nextU64().expect('Failed to deserialize disputeId');
    job.submissionCID = args.nextString().expect('Failed to deserialize submissionCID');
    return job;
  }
}

/**
 * Constructor - Initialize the contract
 */
export function constructor(_: StaticArray<u8>): void {
  assert(Context.isDeployingContract(), 'Constructor can only be called during deployment');
  Storage.set(JOB_COUNTER_KEY, '0');
  generateEvent('JobContract initialized');
}

/**
 * Create a new job
 */
export function createJob(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const title = args.nextString().expect('Title is required');
  const descriptionCID = args.nextString().expect('Description CID is required');
  const totalPayment = args.nextU64().expect('Total payment is required');
  const deadline = args.nextU64().expect('Deadline is required');

  // Get job counter
  let jobId: u64 = 1;
  if (Storage.has(JOB_COUNTER_KEY)) {
    const counter = Storage.get(JOB_COUNTER_KEY);
    jobId = U64.parseInt(counter) + 1;
  }
  Storage.set(JOB_COUNTER_KEY, jobId.toString());

  const client = Context.caller().toString();
  const job = new Job(jobId, client, title, descriptionCID, totalPayment, deadline);

  // Store job
  const jobKey = JOB_PREFIX + jobId.toString();
  Storage.set(jobKey, changetype<string>(job.serialize()));

  // Store in client's job list
  const clientJobsKey = CLIENT_JOBS_PREFIX + client;
  let jobIds: Array<u64> = [];
  if (Storage.has(clientJobsKey)) {
    const clientJobsStr = Storage.get(clientJobsKey);
    const clientJobsBytes = changetype<StaticArray<u8>>(clientJobsStr);
    const clientJobsArgs = new Args(clientJobsBytes);
    const count = clientJobsArgs.nextU32().expect('Failed to read job count');
    for (let i: u32 = 0; i < count; i++) {
      jobIds.push(clientJobsArgs.nextU64().expect('Failed to read job id'));
    }
  }
  jobIds.push(jobId);
  const newClientJobsArgs = new Args();
  newClientJobsArgs.add(jobIds.length as u32);
  for (let i: u32 = 0; i < (jobIds.length as u32); i++) {
    newClientJobsArgs.add(jobIds[i]);
  }
  Storage.set(clientJobsKey, changetype<string>(newClientJobsArgs.serialize()));

  generateEvent(`JobCreated:${jobId}:${client}:${totalPayment}`);
  return stringToBytes(jobId.toString());
}

/**
 * Accept a job
 */
export function acceptJob(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const jobId = args.nextU64().expect('Job ID is required');

  const jobKey = JOB_PREFIX + jobId.toString();
  assert(Storage.has(jobKey), 'Job does not exist');

  const jobStr = Storage.get(jobKey);
  const jobBytes = changetype<StaticArray<u8>>(jobStr);
  const job = Job.deserialize(jobBytes);
  assert(job.status == JobStatus.Posted, 'Job is not available');
  assert(job.client != Context.caller().toString(), 'Client cannot accept their own job');

  job.freelancer = Context.caller().toString();
  job.status = JobStatus.Accepted;
  Storage.set(jobKey, changetype<string>(job.serialize()));

  // Store in freelancer's job list
  const freelancerJobsKey = FREELANCER_JOBS_PREFIX + job.freelancer;
  let jobIds: Array<u64> = [];
  if (Storage.has(freelancerJobsKey)) {
    const freelancerJobsStr = Storage.get(freelancerJobsKey);
    const freelancerJobsBytes = changetype<StaticArray<u8>>(freelancerJobsStr);
    const freelancerJobsArgs = new Args(freelancerJobsBytes);
    const count = freelancerJobsArgs.nextU32().expect('Failed to read job count');
    for (let i: u32 = 0; i < count; i++) {
      jobIds.push(freelancerJobsArgs.nextU64().expect('Failed to read job id'));
    }
  }
  jobIds.push(jobId);
  const newFreelancerJobsArgs = new Args();
  newFreelancerJobsArgs.add(jobIds.length as u32);
  for (let i: u32 = 0; i < (jobIds.length as u32); i++) {
    newFreelancerJobsArgs.add(jobIds[i]);
  }
  Storage.set(freelancerJobsKey, changetype<string>(newFreelancerJobsArgs.serialize()));

  generateEvent(`JobAccepted:${jobId}:${job.freelancer}`);
  return stringToBytes('Job accepted successfully');
}

/**
 * Submit work for a job
 */
export function submitWork(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const jobId = args.nextU64().expect('Job ID is required');
  const submissionCID = args.nextString().expect('Submission CID is required');

  const jobKey = JOB_PREFIX + jobId.toString();
  assert(Storage.has(jobKey), 'Job does not exist');

  const jobStr = Storage.get(jobKey);
  const jobBytes = changetype<StaticArray<u8>>(jobStr);
  const job = Job.deserialize(jobBytes);
  assert(job.freelancer == Context.caller().toString(), 'Only assigned freelancer can submit');
  assert(job.status == JobStatus.Accepted || job.status == JobStatus.InProgress, 'Job is not in progress');

  job.submissionCID = submissionCID;
  job.status = JobStatus.Submitted;
  Storage.set(jobKey, changetype<string>(job.serialize()));

  generateEvent(`WorkSubmitted:${jobId}:${submissionCID}`);
  return stringToBytes('Work submitted successfully');
}

/**
 * Get job details
 */
export function getJob(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const jobId = args.nextU64().expect('Job ID is required');

  const jobKey = JOB_PREFIX + jobId.toString();
  assert(Storage.has(jobKey), 'Job does not exist');

  const jobStr = Storage.get(jobKey);
  return changetype<StaticArray<u8>>(jobStr);
}

/**
 * Get client's jobs
 */
export function getClientJobs(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const client = args.nextString().expect('Client address is required');

  const clientJobsKey = CLIENT_JOBS_PREFIX + client;
  if (!Storage.has(clientJobsKey)) {
    const emptyArgs = new Args();
    emptyArgs.add(0 as u32);
    return emptyArgs.serialize();
  }

  const jobsStr = Storage.get(clientJobsKey);
  return changetype<StaticArray<u8>>(jobsStr);
}

/**
 * Get freelancer's jobs
 */
export function getFreelancerJobs(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const freelancer = args.nextString().expect('Freelancer address is required');

  const freelancerJobsKey = FREELANCER_JOBS_PREFIX + freelancer;
  if (!Storage.has(freelancerJobsKey)) {
    const emptyArgs = new Args();
    emptyArgs.add(0 as u32);
    return emptyArgs.serialize();
  }

  const jobsStr = Storage.get(freelancerJobsKey);
  return changetype<StaticArray<u8>>(jobsStr);
}

/**
 * Get all job IDs (for public job browsing)
 */
export function getAllJobs(_: StaticArray<u8>): StaticArray<u8> {
  // If no jobs have been created yet, return an empty list
  if (!Storage.has(JOB_COUNTER_KEY)) {
    const emptyArgs = new Args();
    emptyArgs.add(0 as u32);
    return emptyArgs.serialize();
  }

  const counterStr = Storage.get(JOB_COUNTER_KEY);
  const maxId = U64.parseInt(counterStr);

  const args = new Args();
  const count = maxId as u32;
  args.add(count);
  for (let i: u32 = 0; i < count; i++) {
    const jobId = (i + 1) as u64;
    args.add(jobId);
  }

  return args.serialize();
}

/**
 * Update job status (internal, called by other contracts)
 */
export function updateJobStatus(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const jobId = args.nextU64().expect('Job ID is required');
  const newStatus = args.nextU8().expect('Status is required');

  const jobKey = JOB_PREFIX + jobId.toString();
  assert(Storage.has(jobKey), 'Job does not exist');

  const jobStr = Storage.get(jobKey);
  const jobBytes = changetype<StaticArray<u8>>(jobStr);
  const job = Job.deserialize(jobBytes);
  job.status = newStatus as JobStatus;
  Storage.set(jobKey, changetype<string>(job.serialize()));

  generateEvent(`JobStatusUpdated:${jobId}:${newStatus}`);
  return stringToBytes('Status updated');
}
