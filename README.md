# .escrow - Decentralized Escrow Platform for Polkadot

[![License: MIT/Apache 2.0](https://img.shields.io/badge/License-MIT%2FApache%202.0-blue.svg)](LICENSE)
[![Milestone](https://img.shields.io/badge/Milestone-2%20Delivered-green.svg)](delivery/deliveries/)

A production-ready, USDT-based escrow platform bringing trust-minimized payment protection to freelancers, agencies, and businesses on Polkadot.

## 🚀 Overview

.escrow eliminates payment disputes between clients and service providers by leveraging smart contracts for automated, milestone-based fund releases. Built on Polkadot using ink! smart contracts, the platform ensures secure, transparent, and cost-effective escrow services without intermediaries.

### Key Features

- **Milestone-Based Payments**: Break projects into stages with individual payment releases
- **USDT Integration**: Stable value protection against crypto volatility
- **Multi-Signature Governance**: Decentralized admin control with k-of-n approval
- **Dispute Resolution**: Built-in arbitration system for conflict resolution
- **Wallet Support**: Compatible with Polkadot.js, SubWallet, and Talisman
- **Low Fees**: Only 0.5-1% platform fee vs 3-5% traditional escrow

## 🏗️ Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│Smart Contract│────▶│   Polkadot   │
│   (React)    │     │   (ink!)     │     │  Blockchain  │
└──────────────┘     └──────────────┘     └──────────────┘
        │                    │                     │
        └────────────────────┴─────────────────────┘
                     USDT Token Flow
```

## 🛠️ Tech Stack

| Component | Technology | Status |
|-----------|-----------|--------|
| **Smart Contract** | ink! 6.0.0-alpha (Rust, PolkaVM) | ✅ Deployed |
| **Frontend** | React 18, TypeScript, Vite | ✅ Complete |
| **Wallet Integration** | Polkadot.js API | ✅ Integrated |
| **Testing** | Vitest, Cargo Test | ✅ 90%+ Coverage |
| **Documentation** | GitBook, API Docs | ✅ Published |

## 📦 Installation

### Prerequisites

- Node.js 18+
- Rust 1.90+ (required for ink! v6)
- cargo-contract 6.0.0-alpha (for PolkaVM support)

### Quick Start

```bash
# Clone repository
git clone https://github.com/samuelarogbonlo/dot_escrow
cd dot_escrow

# Install cargo-contract v6 (for ink! v6 PolkaVM support)
cargo install cargo-contract --version 6.0.0-alpha --force

# Build smart contracts
cd contracts/escrow
cargo contract build --release

# Install frontend dependencies
cd ../../frontend
npm install

# Run development server
npm run dev
```

## 🧪 Testing

### Test Coverage Summary

| Component | Tests | Status |
|-----------|-------|--------|
| **Smart Contracts** | 34 | ✅ 100% |
| **Frontend** | 151 | ✅ 100% |
| **Total** | 185 | ✅ 100% |

### Smart Contract Tests
```bash
cd contracts/escrow
cargo test                    # Run all 34 tests (100% passing)
cargo test --release         # Run with optimizations
```

**Test Categories:**
- ✅ Core Functionality: 24 tests
- ✅ Multi-Signature Governance: 10 tests

### Frontend Tests
```bash
cd frontend
npm test                     # Run all 151 tests (100% passing)
npm run test:coverage        # Generate coverage report
```

**Test Status:**
- ✅ **151 tests passing** - All features fully tested
- ❌ **0 tests failing**

**Fully Tested Components:**
- Dashboard (9 tests)
- ConnectWallet (22 tests)
- CompleteMilestoneModal (22 tests)
- SearchBar (6 tests)
- WelcomeGuide (4 tests)
- ReleaseMilestoneModal (14 tests)
- SearchFilters (4 tests)
- CreateEscrow (5 tests)
- EscrowDetails (1 test)
- MilestoneTracking (2 tests)

See [TESTING_GUIDE.md](docs/TESTING_GUIDE.md) for comprehensive testing documentation.

## 📚 Documentation

- **[API Reference](docs/API-REFERENCE.md)** - Complete smart contract API documentation
- **[User Guide](https://dotescrow.gitbook.io/dotescrow-docs/)** - Platform usage instructions
- **[Testing Guide](docs/TESTING_GUIDE.md)** - Testing strategies and procedures
- **[Paseo Deployment Guide](PASEO_DEPLOYMENT.md)** - Step-by-step guide to deploy on Paseo testnet

## 🚢 Deployment

### Live Deployment (Pop Network - Paseo Testnet)
- **Network**: Pop Network (Paseo Testnet with pallet-revive)
- **RPC Endpoint**: `wss://rpc1.paseo.popnetwork.xyz`
- **Escrow Contract**: `0x57c0082e71f89e1feb6b56ab36f0ae271c118019`
- **PSP22 Token Contract**: `0xd10852e9a6366cfab48f52e98f896344cbbc132c`
- **ink! Version**: 6.0.0-alpha (PolkaVM)
- **Get Test Tokens**: [Polkadot Faucet](https://faucet.polkadot.io/)

**Deploy Your Own Instance:**
```bash
# Install cargo-contract v6 (required for ink! v6)
cargo install cargo-contract --version 6.0.0-alpha --force

# Build contract
cd contracts/escrow
cargo contract build --release

# Deploy to Pop Network
cargo contract instantiate \
  --constructor new \
  --args "0xd10852e9a6366cfab48f52e98f896344cbbc132c" "0x<fee_account>" \
  --url wss://rpc1.paseo.popnetwork.xyz \
  --suri "<your_seed_phrase>" \
  --skip-confirm --execute \
  target/ink/escrow_contract/escrow_contract.contract
```

**Note**: Pop Network uses H160 (20-byte Ethereum-style) addresses for pallet-revive compatibility. See [PASEO_DEPLOYMENT.md](PASEO_DEPLOYMENT.md) for detailed deployment guide.

### Local Development
```bash
# For ink! v6 local development, use substrate-contracts-node with PolkaVM support
# (Check substrate-contracts-node releases for PolkaVM-compatible version)

# Build contracts
cd contracts/escrow
cargo contract build --release

# Configure frontend (.env)
VITE_ESCROW_CONTRACT_ADDRESS=0x57c0082e71f89e1feb6b56ab36f0ae271c118019
VITE_TOKEN_CONTRACT_ADDRESS=0xd10852e9a6366cfab48f52e98f896344cbbc132c
VITE_RPC_URL=wss://rpc1.paseo.popnetwork.xyz
```

### Network Configuration
The frontend supports multiple Polkadot networks:
- **Pop Network (Paseo)** - Live deployment with pallet-revive (ink! v6)
- **Paseo Relay Chain** - Core relay chain
- Westend, Rococo, and other testnets also supported

## 🎯 Use Cases

| Industry | Application |
|----------|------------|
| **Freelancing** | Project-based work with milestone payments |
| **E-commerce** | Purchase protection for high-value items |
| **Real Estate** | Rental deposits and property transactions |
| **B2B Services** | SLA-backed service agreements |
| **Content Creation** | Commission work with staged deliverables |

## 🛡️ Security

- **Audited**: Smart contract security review completed
- **Multi-sig Admin**: No single point of failure
- **Emergency Pause**: Circuit breaker for critical issues
- **Time-locked Operations**: Protection against instant malicious actions

## 📊 Project Status

### Milestone 1 ✅ Complete
- Core smart contract functionality
- USDT integration
- Basic testing suite

### Milestone 2 ✅ Complete
- Full frontend implementation
- Wallet integration
- Milestone system
- Beta testing program

### Future Roadmap
- [ ] Cross-chain support (Q2 2025)
- [ ] Mobile application (Q3 2025)
- [ ] DAO governance (Q4 2025)
- [ ] Fiat on/off ramps (2026)

## 🤝 Contributing

Contributions are welcome! Please see our [Contributing Guidelines](CONTRIBUTING.md).

```bash
# Fork and create feature branch
git checkout -b feature/amazing-feature

# Commit changes
git commit -m 'Add amazing feature'

# Push and create PR
git push origin feature/amazing-feature
```

## 📄 License

This project is dual-licensed:
- MIT License ([LICENSE-MIT](LICENSE-MIT))
- Apache License 2.0 ([LICENSE-APACHE](LICENSE-APACHE))

## 🙏 Acknowledgments

- [Polkadot Fast Grants](https://github.com/Polkadot-Fast-Grants) - Funding support
- [ink!](https://use.ink/) - Smart contract framework
- [Polkadot.js](https://polkadot.js.org/) - JavaScript API

## 📞 Contact

- **GitHub**: [@samuelarogbonlo](https://github.com/samuelarogbonlo)
- **Documentation**: [GitBook](https://dotescrow.gitbook.io/dotescrow-docs/)
- **Email**: support@dotescrow.io

---

Built with ❤️ for the Polkadot ecosystem