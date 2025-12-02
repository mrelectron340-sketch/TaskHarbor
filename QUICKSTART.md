# TaskHarbor Quick Start Guide

## 🚀 Quick Deployment to Buildnet

### Step 1: Install Dependencies

```bash
# Install contract dependencies
cd contract
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Configure Environment

1. Copy `.env.example` to `.env` in the `contract` directory:
```bash
cd contract
cp .env.example .env
```

2. Add your private key to `.env`:
```
WALLET_PRIVATE_KEY=your_private_key_here
```

### Step 3: Build Contracts

```bash
cd contract
npm run build
```

### Step 4: Deploy Contracts

```bash
npm run deploy
```

**Save the contract address** that is printed after deployment!

### Step 5: Update Frontend Config

Edit `frontend/src/config.ts` and add your deployed contract address:

```typescript
export const CONFIG = {
  // ... existing config
  CONTRACTS: {
    JOB: 'your_contract_address_here',
    ESCROW: 'your_contract_address_here',
    VOTING: 'your_contract_address_here',
    PROFILE: 'your_contract_address_here',
  },
};
```

### Step 6: Run Frontend

```bash
cd frontend
npm run dev
```

Open http://localhost:5173 in your browser.

### Step 7: Connect Wallet

1. Install Bearby wallet extension if you haven't already
2. Click "Connect Wallet" in the app
3. Complete your profile setup
4. Start using TaskHarbor!

## 📝 Network Information

- **Network**: Buildnet
- **RPC**: https://buildnet.massa.net/api/v2
- **Chain ID**: 77658366
- **Explorer**: https://buildnet-explorer.massa.net/

## 🐛 Troubleshooting

### Contract deployment fails
- Make sure you have testnet MAS tokens in your wallet
- Verify your private key is correct in `.env`
- Check that the RPC endpoint is accessible

### Frontend can't connect to wallet
- Ensure Bearby extension is installed and unlocked
- Check browser console for errors
- Try refreshing the page

### Transactions failing
- Verify you have enough MAS for gas fees
- Check that contract addresses are correct in config
- Ensure you're on the Buildnet network

## 🎯 Next Steps

1. Create your first job as a client
2. Accept jobs as a freelancer
3. Stake tokens to participate in DAO voting
4. Explore all features!

---

Need help? Check the main README.md for detailed documentation.






