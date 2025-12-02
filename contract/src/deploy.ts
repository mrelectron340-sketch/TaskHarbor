import 'dotenv/config';
import {
  Account,
  Args,
  Mas,
  SmartContract,
  JsonRpcProvider,
  CHAIN_ID,
} from '@massalabs/massa-web3';
import { getScByteCode } from './utils';

// Initialize account from environment
const account = await Account.fromEnv();
const provider = JsonRpcProvider.buildnet(account);

console.log('Deploying TaskHarbor contracts to Buildnet...');
console.log('Account:', account.address);
console.log('RPC: https://buildnet.massa.net/api/v2');

// Deploy main contract (includes all sub-contracts)
const byteCode = getScByteCode('build', 'main.wasm');

const constructorArgs = new Args().addString('TaskHarbor');

console.log('\nDeploying Main Contract...');
const contract = await SmartContract.deploy(
  provider,
  byteCode,
  constructorArgs,
  { coins: Mas.fromString('0.1') }, // Deployment fee
);

console.log('\n✅ Contract deployed successfully!');
console.log('Contract Address:', contract.address);
console.log('Chain ID:', CHAIN_ID.BuildNet);

// Get deployment events
const events = await provider.getEvents({
  smartContractAddress: contract.address,
});

console.log('\nDeployment Events:');
for (const event of events) {
  console.log('  -', event.data);
}

console.log('\n📝 Save this contract address in your frontend config!');
console.log('Contract Address:', contract.address);
