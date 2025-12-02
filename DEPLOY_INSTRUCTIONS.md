# TaskHarbor Deployment Instructions

## Step 1: Deploy Smart Contracts

1. **Navigate to contract directory:**
   ```bash
   cd contract
   ```

2. **Create .env file** (if not exists):
   ```bash
   # Copy from .env.example if available, or create new
   # Add your private key:
   WALLET_PRIVATE_KEY=your_private_key_here
   ```

3. **Deploy the contract:**
   ```bash
   npm run deploy
   ```

4. **Save the contract address** that is printed after deployment!

## Step 2: Update Frontend Configuration

After deployment, you'll get a contract address like: `AS12N5DvTVwvaLbaniMgDJqKwJ3uXBGwzzGuB1f6fjeSx3nhhahTE`

1. **Open `frontend/src/config.ts`**

2. **Update the CONTRACTS section:**
   ```typescript
   export const CONFIG = {
     NETWORK: 'buildnet',
     RPC_URL: 'https://buildnet.massa.net/api/v2',
     CHAIN_ID: 77658366,
     CONTRACTS: {
       JOB: 'YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE',
       ESCROW: 'YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE',
       VOTING: 'YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE',
       PROFILE: 'YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE',
     },
     IPFS_GATEWAY: 'https://gateway.pinata.cloud/ipfs/',
     VOTING_PERIOD_DAYS: 3,
   };
   ```

   **Note:** Since all contracts are in one main contract, use the same address for all four (JOB, ESCROW, VOTING, PROFILE).

## Step 3: Run Frontend

1. **Navigate to frontend:**
   ```bash
   cd frontend
   ```

2. **Install dependencies (if not done):**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open browser:**
   - Go to `http://localhost:5173`
   - Connect your Massa Station wallet
   - Start using TaskHarbor!

## Step 4: Test the Application

1. **Connect Wallet:**
   - Click "Connect Wallet"
   - Select Massa Station or Bearby
   - Complete profile setup

2. **Create a Job (as Client):**
   - Go to "Create Job"
   - Fill in job details
   - Upload description to IPFS
   - Fund escrow and create job

3. **Accept Job (as Freelancer):**
   - Browse jobs
   - Accept a job
   - Submit work when complete

4. **Vote (as DAO Member):**
   - Stake tokens for voting power
   - Vote on disputes

## Troubleshooting

### Contract deployment fails:
- Check you have testnet MAS tokens
- Verify private key in .env is correct
- Ensure RPC endpoint is accessible

### Frontend can't connect:
- Make sure Massa Station is running
- Check browser console for errors
- Verify contract addresses in config.ts

### Transactions failing:
- Ensure you have enough MAS for gas
- Check contract addresses are correct
- Verify you're on Buildnet network

## Network Information

- **Network:** Buildnet
- **RPC:** https://buildnet.massa.net/api/v2
- **Chain ID:** 77658366
- **Explorer:** https://buildnet-explorer.massa.net/

---

**Ready to deploy!** 🚀






