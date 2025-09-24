# Deployment & Configuration Guide

**Milestone 2 Assurance Documentation**

This guide provides complete deployment and configuration procedures for the `.escrow` platform, covering smart contract deployment, frontend setup, and production configuration.

## Overview

The `.escrow` platform consists of:
- **Smart Contract**: ink! contract deployed on Polkadot ecosystem
- **Frontend Application**: React TypeScript application
- **Token Integration**: PSP22-compliant USDT support
- **Development Tools**: Complete testing and build pipeline

---

## Smart Contract Deployment

### Prerequisites

**System Requirements:**
```bash
# Rust toolchain
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup default stable
rustup update
rustup component add rust-src

# ink! CLI
cargo install --force --locked cargo-contract --version 3.2.0

# Substrate node (for local testing)
curl https://getsubstrate.io -sSf | bash -s -- --fast
```

**Project Dependencies:**
```bash
cd contracts/escrow
cargo check  # Verify all dependencies resolve
```

### Build Process

**1. Compile Smart Contract:**
```bash
cd contracts/escrow
cargo contract build --release
```

**Expected Output:**
```
 [1/4] Building cargo project
    Compiling ink_prelude v4.3.0
    Compiling scale-info v2.11.6
    Compiling ink_storage v4.3.0
    Compiling ink_env v4.3.0
    Compiling ink v4.3.0
    Compiling escrow-contract v0.1.0
    Finished release [optimized] target(s) in XX.XXs
 [2/4] Post processing wasm file
 [3/4] Optimizing wasm file
 [4/4] Generating metadata

Original wasm size: XXX.X Kb, Optimized: XXX.X Kb

Your contract artifacts are ready. You can find them in:
contracts/escrow/target/ink/escrow_contract

  - escrow_contract.contract (code + metadata)
  - escrow_contract.wasm (the contract's code)
  - escrow_contract.json (the contract's metadata)
```

**2. Verify Build Artifacts:**
```bash
ls -la target/ink/escrow_contract/
# Should show:
# escrow_contract.contract
# escrow_contract.wasm
# escrow_contract.json
```

### Deployment Options

#### Option A: Local Development (Substrate Contracts Node)

**1. Start Local Node:**
```bash
substrate-contracts-node --dev --tmp
```

**2. Deploy Contract:**
```bash
cargo contract instantiate --constructor new \
  --args "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY" \
  --args "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty" \
  --suri //Alice \
  --dry-run
```

**3. Actual Deployment:**
```bash
cargo contract instantiate --constructor new \
  --args "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY" \
  --args "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty" \
  --suri //Alice \
  --execute
```

#### Option B: Testnet Deployment (Westend)

**1. Setup Testnet Account:**
```bash
# Create deployment account with sufficient funds
# Get testnet tokens from faucet: https://wiki.polkadot.network/docs/learn-DOT#getting-tokens-on-the-westend-testnet
```

**2. Configure Network:**
```bash
cargo contract instantiate --constructor new \
  --args "USDT_TOKEN_ADDRESS" \
  --args "FEE_ACCOUNT_ADDRESS" \
  --url wss://westend-rpc.polkadot.io \
  --suri "YOUR_SEED_PHRASE" \
  --execute
```

**3. Record Deployment Information:**
```bash
# Save the output containing:
# - Contract Address
# - Transaction Hash
# - Block Hash
```

#### Option C: Mainnet Deployment (Polkadot/Kusama)

**⚠️ Production Deployment Checklist:**
- [ ] Smart contract audited
- [ ] All tests passing (34 total tests: 24 core + 10 multi-signature governance)
- [ ] Fee structure validated
- [ ] Emergency pause mechanism tested
- [ ] Governance mechanisms in place

**Deployment Command:**
```bash
cargo contract instantiate --constructor new \
  --args "MAINNET_USDT_TOKEN_ADDRESS" \
  --args "MAINNET_FEE_ACCOUNT_ADDRESS" \
  --url wss://rpc.polkadot.io \  # or wss://kusama-rpc.polkadot.io
  --suri "SECURE_SEED_PHRASE" \
  --execute
```

### Post-Deployment Verification

**1. Verify Contract State:**
```bash
cargo contract call --contract YOUR_CONTRACT_ADDRESS \
  --message get_contract_info \
  --dry-run
```

**2. Test Core Functions:**
```bash
# Test escrow creation
cargo contract call --contract YOUR_CONTRACT_ADDRESS \
  --message create_escrow \
  --args "COUNTERPARTY_ADDRESS" \
  --args "freelancer" \
  --args "Active" \
  --args "Test Escrow" \
  --args "Testing deployment" \
  --args "100.0" \
  --args "[]" \
  --args "null" \
  --dry-run
```

**3. Verify Token Integration:**
```bash
cargo contract call --contract YOUR_CONTRACT_ADDRESS \
  --message get_usdt_token \
  --dry-run
```

---

## Frontend Configuration

### Environment Setup

**1. Node.js and Dependencies:**
```bash
cd frontend
node --version  # Requires Node.js 18+
npm install     # Install all dependencies
```

**2. Environment Variables:**
Create `frontend/.env` file:
```env
# Contract Configuration
REACT_APP_ESCROW_CONTRACT_ADDRESS=YOUR_DEPLOYED_CONTRACT_ADDRESS
REACT_APP_USDT_TOKEN_ADDRESS=USDT_CONTRACT_ADDRESS
REACT_APP_NETWORK_ENDPOINT=wss://westend-rpc.polkadot.io

# Feature Flags
REACT_APP_ENABLE_DEBUG_MODE=true
REACT_APP_ENABLE_TESTNET_WARNING=true

# API Configuration
REACT_APP_BACKEND_URL=http://localhost:3006
REACT_APP_IPFS_GATEWAY=https://ipfs.io/ipfs/

# Analytics (optional)
REACT_APP_ANALYTICS_ID=your_analytics_id
```

### Contract Address Configuration

**1. Update Contract ABI:**
```bash
# Copy deployed contract metadata
cp contracts/escrow/target/ink/escrow_contract/escrow_contract.json \
   frontend/src/contractABI/EscrowABI.json
```

**2. Update Contract Address:**
```typescript
// File: frontend/src/contractABI/EscrowABI.ts
export const ESCROW_CONTRACT_ADDRESS: string = 'YOUR_DEPLOYED_CONTRACT_ADDRESS';
```

**3. Verify Integration:**
```typescript
// File: frontend/src/hooks/useEscrowContract.ts
// Ensure contract address matches deployment
console.log('Contract Address:', ESCROW_CONTRACT_ADDRESS);
```

### Build and Deployment

**1. Development Build:**
```bash
cd frontend
npm run dev     # Start development server on http://localhost:5173
```

**2. Production Build:**
```bash
cd frontend
npm run build   # Creates optimized build in dist/
```

**3. Build Verification:**
```bash
npm run preview # Test production build locally
```

**4. Linting and Type Checking:**
```bash
npm run lint    # ESLint checks
npm run build   # TypeScript compilation check
```

### Production Deployment Options

#### Option A: Static Hosting (Vercel, Netlify)

**Vercel Deployment:**
```bash
npm install -g vercel
vercel --prod
```

**Netlify Deployment:**
```bash
npm run build
# Upload dist/ folder to Netlify dashboard
# Or use Netlify CLI:
netlify deploy --prod --dir=dist
```

#### Option B: Docker Container

**Dockerfile:**
```dockerfile
# File: frontend/Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Build and Run:**
```bash
docker build -t escrow-frontend .
docker run -p 80:80 escrow-frontend
```

#### Option C: AWS S3 + CloudFront

**Deploy Script:**
```bash
#!/bin/bash
# File: scripts/deploy-aws.sh

aws s3 sync dist/ s3://your-bucket-name --delete
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

---

## Network Configuration

### Supported Networks

| Network | RPC Endpoint | Explorer | Status |
|---------|-------------|----------|--------|
| **Local Development** | `ws://127.0.0.1:9944` | - | ✅ Ready |
| **Westend Testnet** | `wss://westend-rpc.polkadot.io` | https://westend.subscan.io | ✅ Ready |
| **Polkadot Mainnet** | `wss://rpc.polkadot.io` | https://polkadot.subscan.io | 🔜 Planned |
| **Kusama Mainnet** | `wss://kusama-rpc.polkadot.io` | https://kusama.subscan.io | 🔜 Planned |

### Network-Specific Configuration

**Local Development:**
```typescript
// File: frontend/src/config/networks.ts
export const NETWORKS = {
  local: {
    name: 'Local Development',
    rpc: 'ws://127.0.0.1:9944',
    contractAddress: 'YOUR_LOCAL_CONTRACT_ADDRESS',
    usdtAddress: 'LOCAL_USDT_ADDRESS'
  }
};
```

**Testnet Configuration:**
```typescript
westend: {
  name: 'Westend Testnet',
  rpc: 'wss://westend-rpc.polkadot.io',
  contractAddress: 'YOUR_TESTNET_CONTRACT_ADDRESS',
  usdtAddress: 'TESTNET_USDT_ADDRESS',
  explorer: 'https://westend.subscan.io'
}
```

**Mainnet Configuration:**
```typescript
polkadot: {
  name: 'Polkadot Mainnet',
  rpc: 'wss://rpc.polkadot.io',
  contractAddress: 'YOUR_MAINNET_CONTRACT_ADDRESS',
  usdtAddress: 'MAINNET_USDT_ADDRESS',
  explorer: 'https://polkadot.subscan.io'
}
```

---

## Security Configuration

### Contract Security Settings

**1. Owner Configuration:**
```bash
# Set secure owner account
cargo contract call --contract YOUR_CONTRACT_ADDRESS \
  --message get_contract_info \
  --dry-run
# Verify owner is correct secure address
```

**2. Fee Configuration:**
```bash
# Set appropriate fee (100 = 1%)
cargo contract call --contract YOUR_CONTRACT_ADDRESS \
  --message update_fee \
  --args 100 \
  --suri "OWNER_SEED" \
  --execute
```

**3. Emergency Controls:**
```bash
# Test pause mechanism
cargo contract call --contract YOUR_CONTRACT_ADDRESS \
  --message pause_contract \
  --suri "OWNER_SEED" \
  --dry-run
```

### Frontend Security

**1. Environment Variables:**
```env
# Never commit sensitive data
REACT_APP_ANALYTICS_KEY=public_key_only
# Private keys should never be in frontend code
```

**2. Content Security Policy:**
```html
<!-- File: frontend/public/index.html -->
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               connect-src 'self' wss://*.polkadot.io wss://*.parity.io;
               img-src 'self' data:;
               style-src 'self' 'unsafe-inline';">
```

**3. Wallet Integration Security:**
```typescript
// File: frontend/src/hooks/usePolkadotExtension.ts
// Always verify wallet signatures
// Never store private keys
// Use secure communication with wallet extensions
```

---

## Monitoring & Maintenance

### Health Checks

**1. Contract Health Check:**
```bash
#!/bin/bash
# File: scripts/health-check-contract.sh

CONTRACT_ADDRESS="YOUR_CONTRACT_ADDRESS"
RPC_ENDPOINT="wss://westend-rpc.polkadot.io"

# Check contract is accessible
cargo contract call --contract $CONTRACT_ADDRESS \
  --message get_contract_info \
  --url $RPC_ENDPOINT \
  --dry-run

if [ $? -eq 0 ]; then
  echo "✅ Contract is healthy"
else
  echo "❌ Contract health check failed"
  exit 1
fi
```

**2. Frontend Health Check:**
```typescript
// File: frontend/src/utils/healthCheck.ts
export const performHealthCheck = async () => {
  const checks = {
    contractConnection: await testContractConnection(),
    walletExtension: await testWalletExtension(),
    backendAPI: await testBackendConnection(),
  };

  return checks;
};
```

### Monitoring Setup

**1. Contract Event Monitoring:**
```typescript
// File: scripts/event-monitor.ts
import { ApiPromise, WsProvider } from '@polkadot/api';

const monitorEvents = async () => {
  const api = await ApiPromise.create({
    provider: new WsProvider('wss://westend-rpc.polkadot.io')
  });

  api.query.system.events((events) => {
    events.forEach(({ event }) => {
      if (event.section === 'contracts') {
        console.log('Contract event:', event);
        // Log to monitoring service
      }
    });
  });
};
```

**2. Error Tracking:**
```typescript
// File: frontend/src/utils/errorTracking.ts
export const trackError = (error: Error, context: string) => {
  console.error(`[${context}]`, error);

  // Send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Send to Sentry, LogRocket, etc.
  }
};
```

### Backup & Recovery

**1. Contract State Backup:**
```bash
#!/bin/bash
# File: scripts/backup-contract-state.sh

# Query all escrows and save to backup
cargo contract call --contract $CONTRACT_ADDRESS \
  --message list_escrows \
  --dry-run > "backup-$(date +%Y%m%d-%H%M%S).json"
```

**2. Configuration Backup:**
```bash
# Backup all configuration files
tar -czf "config-backup-$(date +%Y%m%d).tar.gz" \
  frontend/.env \
  frontend/src/contractABI/ \
  contracts/escrow/Cargo.toml
```

---

## Troubleshooting

### Common Deployment Issues

**Issue: Contract Build Fails**
```bash
# Solution: Update Rust and dependencies
rustup update
cargo clean
cargo contract build --release
```

**Issue: "Insufficient Balance" During Deployment**
```bash
# Solution: Check account balance
cargo contract call --contract YOUR_ADDRESS --message balance_of --dry-run
# Get testnet tokens from faucet if needed
```

**Issue: Frontend Can't Connect to Contract**
```javascript
// Solution: Verify network configuration
console.log('Network:', process.env.REACT_APP_NETWORK_ENDPOINT);
console.log('Contract:', process.env.REACT_APP_ESCROW_CONTRACT_ADDRESS);
```

### Performance Optimization

**1. Contract Gas Optimization:**
```rust
// Use efficient data structures
// Minimize storage operations
// Batch operations where possible
```

**2. Frontend Performance:**
```bash
# Analyze bundle size
npm run build
npx vite-bundle-analyzer dist/

# Optimize images and assets
# Enable compression in web server
# Implement code splitting
```

### Rollback Procedures

**1. Contract Rollback:**
```bash
# Deploy new version and migrate state
# Or use contract upgrade patterns
# Update frontend to use new contract address
```

**2. Frontend Rollback:**
```bash
# Revert to previous commit
git revert HEAD
npm run build
# Redeploy previous version
```

---

## Production Checklist

### Pre-Launch Security Audit
- [ ] Smart contract professionally audited
- [ ] All tests passing (100% test suite)
- [ ] Security vulnerabilities addressed
- [ ] Emergency procedures documented
- [ ] Owner keys secured in hardware wallet

### Performance Validation
- [ ] Gas costs optimized and documented
- [ ] Frontend load times < 3 seconds
- [ ] Transaction success rate > 99%
- [ ] Error handling covers all scenarios
- [ ] Mobile responsiveness verified

### Operational Readiness
- [ ] Monitoring and alerting configured
- [ ] Backup and recovery procedures tested
- [ ] Support documentation complete
- [ ] Team training completed
- [ ] Incident response plan prepared

### Legal & Compliance
- [ ] Terms of service reviewed
- [ ] Privacy policy updated
- [ ] Regulatory compliance verified
- [ ] Insurance coverage obtained
- [ ] User safety measures implemented

---

## Configuration Templates

### Environment Template
```env
# Copy to .env and fill in values
REACT_APP_ESCROW_CONTRACT_ADDRESS=
REACT_APP_USDT_TOKEN_ADDRESS=
REACT_APP_NETWORK_ENDPOINT=
REACT_APP_BACKEND_URL=
REACT_APP_ENABLE_DEBUG_MODE=false
```

### Docker Compose Template
```yaml
# File: docker-compose.yml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    environment:
      - REACT_APP_ESCROW_CONTRACT_ADDRESS=${CONTRACT_ADDRESS}
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "3006:3006"
    environment:
      - DATABASE_URL=${DATABASE_URL}
```

### CI/CD Pipeline Template
```yaml
# File: .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Test Contract
        run: |
          cd contracts/escrow
          cargo test
      - name: Test Frontend
        run: |
          cd frontend
          npm ci
          npm run test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Build Contract
        run: cargo contract build --release
      - name: Build Frontend
        run: |
          cd frontend
          npm run build
      - name: Deploy
        run: ./scripts/deploy.sh
```

---

*This guide provides comprehensive deployment and configuration procedures for successful Milestone 2 delivery and ongoing platform operation.*