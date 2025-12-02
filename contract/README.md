# My Massa Smart-contract Project

## Build

By default this will build all files in `assembly/contracts` directory.

```shell
npm run build
```

## Deploy a smart contract

Prerequisites :

- Create a `.env` file in the `contract` directory with:
  - `PRIVATE_KEY=S...` (your Massa secret key)

Deployment uses Buildnet RPC by default.

The following command will build contracts in `assembly/contracts` and execute `src/deploy.ts` on Buildnet.

```shell
npm run deploy
```

### Deploy all contracts separately

Use the multi-deploy script to deploy each module (Main, Job, Escrow, Voting, Profile) to Buildnet:

```shell
npm run deploy:all
```

After deployment, copy the printed addresses into your frontend config `frontend/src/config.ts`:

```ts
export const CONFIG = {
  NETWORK: 'buildnet',
  RPC_URL: 'https://buildnet.massa.net/api/v2',
  CHAIN_ID: 77658366,
  CONTRACTS: {
    JOB: 'AS...JobContract',
    ESCROW: 'AS...EscrowContract',
    VOTING: 'AS...VotingContract',
    PROFILE: 'AS...ProfileContract',
  },
};
```

The app will use these addresses for reads and writes.

You can modify `src/deploy.ts` to change the smart contract being deployed, and to pass arguments to the constructor
function:

- line 31: specify what contract you want to deploy
- line 33: create the `Args` object to pass to the constructor of the contract you want to deploy

When the deployment operation is executed on-chain, the
[constructor](https://github.com/massalabs/massa-sc-toolkit/blob/main/packages/sc-project-initializer/commands/init/assembly/contracts/main.ts#L10)
function of the smart contract being deployed will
be called with the arguments provided in the deployment script.

You can edit this script and use [massa-web3 library](https://www.npmjs.com/package/@massalabs/massa-web3)
to create advanced deployment procedure.

For more information, please visit our ReadTheDocs about
[Massa smart-contract development](https://docs.massa.net/en/latest/web3-dev/smart-contracts.html).

## Unit tests

The test framework documentation is available here: [as-pect docs](https://as-pect.gitbook.io/as-pect)

```shell
npm run test
```

## Format code

```shell
npm run fmt
```
