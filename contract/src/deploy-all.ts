import 'dotenv/config';
import { Account, Args, Mas, SmartContract, JsonRpcProvider } from '@massalabs/massa-web3';
import { getScByteCode } from './utils';

function resolvePrivateKey(): string {
  const candidates = ['PRIVATE_KEY', 'WALLET_PRIVATE_KEY', 'WALLET_SECRET_KEY'];
  for (const key of candidates) {
    const val = process.env[key];
    if (val && val.length > 0) return val;
  }
  throw new Error('Missing PRIVATE_KEY in environment');
}

const rawPk = resolvePrivateKey();
if (!rawPk.startsWith('S')) throw new Error('Invalid PRIVATE_KEY: expected prefix S');
process.env.PRIVATE_KEY = rawPk;

const account = await Account.fromEnv();
const provider = JsonRpcProvider.buildnet(account);

console.log('Deploying all TaskHarbor contracts to Buildnet...');
console.log('Account:', account.address);
console.log('RPC: https://buildnet.massa.net/api/v2');

async function deployOne(name: string, wasm: string): Promise<string> {
  console.log(`\nDeploying ${name}...`);
  const byteCode = getScByteCode('build', wasm);
  const contract = await SmartContract.deploy(provider, byteCode, new Args(), { coins: Mas.fromString('0.1') });
  console.log(`${name} Address: ${contract.address}`);
  return contract.address;
}

const addresses = {
  MAIN: await deployOne('Main', 'main.wasm'),
  JOB: await deployOne('JobContract', 'JobContract.wasm'),
  ESCROW: await deployOne('EscrowContract', 'EscrowContract.wasm'),
  VOTING: await deployOne('VotingContract', 'VotingContract.wasm'),
  PROFILE: await deployOne('ProfileContract', 'ProfileContract.wasm'),
};

console.log('\nAll contracts deployed:');
console.log(addresses);
console.log('\n📝 Save these addresses in your frontend config!');

