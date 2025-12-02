# TaskHarbor - Autonomous On-Chain Job Marketplace

A decentralized freelance jobs marketplace where payments live in autonomous smart contract escrows, work is submitted and DAO-voted, and payments are automatically released or refunded — all hosted on DeWeb and run by Massa Autonomous Smart Contracts (ASCs).

## 🚀 Features

- **Trustless Escrow**: Funds are locked in smart contracts until work is approved
- **Auto-Payments**: Automatic payment release after DAO voting period
- **DAO Governance**: Community-driven dispute resolution and job approval
- **On-Chain Jobs**: All job data stored on-chain for transparency
- **Modern UI**: Beautiful, responsive interface with animations
- **Bearby Wallet Integration**: Seamless wallet connection and transaction signing

## 🏗️ Architecture 

### Smart Contracts

The project uses separate contracts for modularity:

- **JobContract**: Manages job creation, acceptance, and lifecycle
- **EscrowContract**: Handles escrow deposits and withdrawals
- **VotingContract**: Manages DAO voting on job submissions
- **ProfileContract**: Manages user profiles and roles

### Frontend

- **React + TypeScript**: Modern frontend framework
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Smooth animations
- **React Router**: Client-side routing
- **Massa Web3**: Blockchain interaction library

## 📋 Prerequisites

- Node.js 18+ and npm
- Bearby wallet extension installed
- Massa Buildnet testnet access

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd taskharvor
```

### 2. Install contract dependencies

```bash
cd contract
npm install
```

### 3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

## 🔧 Configuration

### Contract Deployment

1. Create a `.env` file in the `contract` directory:

```env
WALLET_PRIVATE_KEY=your_private_key_here
```

2. Build the contracts:

```bash
cd contract
npm run build
```

3. Deploy to Buildnet:

```bash
npm run deploy
```

4. Save the deployed contract addresses and either set them as Vite env vars or leave the shipped Buildnet defaults.

### Frontend Configuration

Create a `.env.local` file in `frontend/` (or export the vars in your hosting provider) and fill in your contract addresses. The app falls back to the latest Buildnet deployments we provide, so you can get started even if you skip this step.

```
VITE_CONTRACT_JOB=AS1GnQUuQi3T1Mj1dxAseQJbheo1ZcTGFL2ZxytLmjd386ygXLLT
VITE_CONTRACT_ESCROW=AS1ZsdZ7DTmvAKzuW18k32wEVqd6Z2Tb6jWYCC8mwF4saiZ4oiLg
VITE_CONTRACT_VOTING=AS12toFoErTvMsoB8N3Jbu9cddvg4RWJVGW11ZKpU3TPMEEfUsmuU
VITE_CONTRACT_PROFILE=AS12YWLjrReV9XNPRpSs3YNSBZk988HyGPTbYzNtt7yexsmaqwM9q
```

## 🚀 Running the Application

### Development

Start the frontend development server:

```bash
cd frontend
npm run dev
```

The app will be available at `http://localhost:5173`

### Production Build

Build the frontend for production:

```bash
cd frontend
npm run build
```

## 📱 Usage

1. **Connect Wallet**: Click "Connect Wallet" and approve the connection in Bearby
2. **Create Profile**: Complete your profile with name, bio, and role
3. **Post Jobs** (Clients): Create jobs and fund escrow
4. **Accept Jobs** (Freelancers): Browse and accept available jobs
5. **Submit Work**: Upload deliverables via IPFS CID
6. **Vote** (DAO Members): Participate in dispute resolution
7. **Withdraw**: Claim your earnings

## 🌐 Network Details

- **Network**: Buildnet
- **RPC Endpoint**: https://buildnet.massa.net/api/v2
- **Chain ID**: 77658366
- **Explorer**: https://buildnet-explorer.massa.net/

## 📄 Contract Functions

### JobContract
- `createJob(title, descriptionCID, totalPayment, deadline)`: Create a new job
- `acceptJob(jobId)`: Accept a job as freelancer
- `submitWork(jobId, submissionCID)`: Submit work for a job
- `getJob(jobId)`: Get job details
- `getClientJobs(client)`: Get all jobs by a client
- `getFreelancerJobs(freelancer)`: Get all jobs by a freelancer

### EscrowContract
- `depositEscrow(jobId, amount)`: Deposit funds to escrow
- `releaseFunds(jobId, freelancer, amount)`: Release funds to freelancer
- `refundClient(jobId, client)`: Refund client
- `withdraw()`: Withdraw available balance

### VotingContract
- `stakeTokens(amount)`: Stake tokens for voting power
- `createDispute(jobId, reasonCID)`: Create a dispute
- `vote(disputeId, side)`: Vote on a dispute
- `resolveVoting(disputeId)`: Resolve voting (auto-called)

### ProfileContract
- `createProfile(name, bioCID, role)`: Create or update profile
- `getProfile(address)`: Get profile details
- `updateReputation(address, points)`: Update reputation

## 🧪 Testing

Run contract tests:

```bash
cd contract
npm test
```

## 🔒 Security

- All funds are held in smart contract escrows
- Pull pattern for withdrawals to prevent reentrancy
- On-chain voting with stake-based weighting
- Time-locked voting periods
- Automatic resolution via deferred calls

## 📝 License

ISC

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Built on Massa Blockchain** 🚀





