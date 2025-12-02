# TaskHarbor Deployment Guide

## Pre-Deployment Checklist

- [ ] Node.js 18+ installed
- [ ] Bearby wallet installed and configured
- [ ] Testnet MAS tokens obtained from faucet
- [ ] Private key saved securely
- [ ] All dependencies installed

## Deployment Steps

### 1. Contract Deployment

```bash
cd contract
npm install
npm run build
npm run deploy
```

**Important**: Save the contract address printed after deployment!

### 2. Frontend Configuration

1. Update `frontend/src/config.ts` with contract addresses
2. Build frontend: `cd frontend && npm run build`
3. Deploy to DeWeb (optional) or host on your preferred platform

### 3. Testing

1. Connect wallet on Buildnet
2. Create a test job
3. Accept job as freelancer
4. Submit work
5. Test voting (if DAO member)
6. Test withdrawal

## Contract Addresses

After deployment, update these in your frontend config:

```typescript
CONTRACTS: {
  JOB: 'AS...',
  ESCROW: 'AS...',
  VOTING: 'AS...',
  PROFILE: 'AS...',
}
```

## Network Configuration

- **Network**: Buildnet
- **RPC URL**: https://buildnet.massa.net/api/v2
- **Chain ID**: 77658366
- **Explorer**: https://buildnet-explorer.massa.net/

## Post-Deployment

1. Verify all contract functions work
2. Test all user flows
3. Monitor for errors
4. Update documentation with live addresses
5. Share with users!

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify contract addresses are correct
3. Ensure wallet is on Buildnet
4. Check RPC endpoint is accessible
5. Review contract deployment logs






