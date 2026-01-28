# .escrow - Decentralized Escrow Platform for Polkadot

[![License: MIT/Apache 2.0](https://img.shields.io/badge/License-MIT%2FApache%202.0-blue.svg)](LICENSE)
[![Milestone](https://img.shields.io/badge/Milestone-2%20Delivered-green.svg)](https://github.com/samuelarogbonlo/delivery/blob/5186fb63f1859129dbedc5b0eb1ee532ddb450ec/deliveries/.escrow-milestone-2.md)

A production-ready, USDT-based escrow platform bringing trust-minimized payment protection to freelancers, agencies, and businesses on Polkadot.

**🌐 Live Landing Page:** [http://dotescrow.vercel.app/](http://dotescrow.vercel.app/)

## 🚀 Overview

.escrow eliminates payment disputes between clients and service providers by leveraging smart contracts for automated, milestone-based fund releases. Built on Polkadot using ink! smart contracts, the platform ensures secure, transparent, and cost-effective escrow services without intermediaries.

### Key Features

- **Milestone-Based Payments**: Break projects into stages with individual payment releases
- **USDT Integration**: Stable value protection against crypto volatility
- **Multi-Signature Governance**: Decentralized admin control with k-of-n approval
- **Dispute Resolution**: Built-in arbitration system for conflict resolution
- **Wallet Support**: Compatible with Polkadot.js, SubWallet, and Talisman
- **Low Fees**: Only 0.5-1% platform fee vs 3-5% traditional escrow

## ⚠️ Development Freeze Notice

**Status:** 🔒 CODE FREEZE FOR SECURITY AUDIT

**Effective Date:** January 27, 2026

**Duration:** Until audit completion

The smart contract codebase is now frozen for PAL (Polkadot Alliance) security audit preparation. No feature changes, refactoring, or non-critical updates will be made until the audit is complete.

**Pre-Audit Checklist Status:**
- ✅ Test coverage: 83.13% (43 tests passing)
- ✅ Zero clippy warnings
- ✅ All dependencies audited
- ✅ Comprehensive documentation complete
- ✅ Deployed on Paseo testnet

**Audit Timeline:** Q1 2026

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

## 🚢 Deployment

### Live Deployment (Paseo AssetHub Testnet)
- **Network**: Paseo AssetHub Testnet
- **RPC Endpoint**: `wss://testnet-passet-hub.polkadot.io`
- **Escrow Contract**: `0x027a592ae13B21f54AB2130B1a4649a36C566ef6`
- **PSP22 Token Contract**: `0x06cCb9c561dE6F67830AEEC616A30e717690316a`
- **ink! Version**: 6.0.0-beta (PolkaVM)
- **Get Test Tokens**: [Polkadot Faucet](https://faucet.polkadot.io/)

### Network Configuration
The frontend supports multiple Polkadot networks:
- **Paseo AssetHub** - Live deployment with ink! v6
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

## 📊 Project Status

### Milestone 1 ✅ Complete
- Core smart contract functionality
- USDT integration
- Basic testing suite

### Milestone 2 ✅ Complete
- Full frontend implementation
- Wallet integration
- Milestone system

### Future Roadmap
- [ ] Cross-chain support (Q2 2025)
- [ ] Mobile application (Q3 2025)
- [ ] DAO governance (Q4 2025)
- [ ] Fiat on/off ramps (2026)

## 🤝 Contributing

Contributions are welcome! 

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
- **Website**: [http://dotescrow.vercel.app/](http://dotescrow.vercel.app/)

## 📚 Project Resources

- **Milestone 2 Delivery**: [View Submission](https://github.com/samuelarogbonlo/delivery/blob/5186fb63f1859129dbedc5b0eb1ee532ddb450ec/deliveries/.escrow-milestone-2.md)
- **Audit Submission Package**: [/audit-submission](audit-submission/)
- **Security Review**: [SECURITY_REVIEW.md](audit-submission/docs/SECURITY_REVIEW.md)

---

Built with ❤️ for the Polkadot ecosystem
