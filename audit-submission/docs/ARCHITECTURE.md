# .escrow System Architecture

**Version:** 1.0.0-pre-audit
**Last Updated:** December 17, 2025

## System Overview

.escrow is a decentralized escrow platform on Polkadot enabling milestone-based payments between clients and service providers using USDT stablecoins.

## Architecture Diagram (ASCII)
```
          +--------------------+            +-------------------+
          |    User Wallets    |            |   Admin Signers   |
          | (Creator/Counter)  |            | (k-of-n multisig) |
          +---------+----------+            +---------+---------+
                    | connect/sign                     | propose/approve
                    v                                   v
             +------+--------+                +---------+--------+
             |   Frontend    |<-------------->|  Admin Panel     |
             | (React/Vite)  |  UI/API calls  |  (same frontend) |
             +------+--------+                +------------------+
                    |  Polkadot.js RPC (WS)
                    v
        +-----------+-----------------------------+
        |        Escrow Contract (ink! 6)        |
        |  - Milestones, disputes, deposits      |
        |  - Pause, fees, governance proposals   |
        |  - H160 addresses on PolkaVM           |
        +------+-----------+----------+----------+
               |           |          |
               |           | events   |
               |           v          |
               |    +------+----------+------+
               |    |   PSP22 Token (USDT)   |
               |    |   transfers/allowance  |
               |    +------+------------------+
               |           |
               |           v
               |    +------+------+
               |    | Fee Account |
               |    +------+------+
               |           ^
               |           |
               +-----------+
                    PSP22 transfers (release + fee)
```

## Architecture Components

### 1. Smart Contracts (ink! 6.0.0-beta)

**Escrow Contract** (`contracts/escrow/`)
- **Purpose:** Core escrow logic with milestone management
- **Target:** PolkaVM
- **Address Format:** H160 (20-byte Ethereum-style)
- **Deployment:** Paseo AssetHub testnet at `0x027a592ae13B21f54AB2130B1a4649a36C566ef6`

**PSP22 Token Contract** (`contracts/psp22_token/`)
- **Purpose:** USDT-compatible token for payments
- **Standard:** PSP22 (Polkadot ERC20 equivalent)
- **Deployment:** `0x06cCb9c561dE6F67830AEEC616A30e717690316a`

### 2. Frontend Application

**Technology Stack:**
- React 18 + TypeScript
- Vite build system
- Polkadot.js API for wallet integration
- Vitest for testing (151 tests, 100% passing)

**Supported Wallets:**
- Polkadot.js Extension
- SubWallet
- Talisman

## Contract Architecture

### Core Data Structures

**EscrowData**
- Unique ID, counterparty addresses, status, timestamps
- List of milestones, total amount, platform fee
- Created and completed timestamps

**Milestone**
- ID, description, amount, status, deadline
- Completion tracking (note, evidence, timestamp)
- Dispute fields (reason, filing party)

**AdminProposal** (Multisig Governance)
- Proposal ID, action type, proposer, approvals
- Status tracking, execution tracking

### Security Features

**1. Arithmetic Safety**
- All calculations use checked arithmetic operations
- Overflow protection on fees, amounts, counters
- Storage limits: 50 milestones max, 1000 char strings, 10 evidence files

**2. Access Control**
- Creator-only functions: milestone release, deposit notification
- Counterparty-only: task completion
- Both parties: dispute filing
- Multisig admin: governance operations

**3. Reentrancy Protection**
- State updates before external PSP22 calls (Checks-Effects-Interactions pattern)
- Single-phase execution model

**4. Multisig Governance**
- Admin operations require k-of-n signatures
- Proposal-approval-execution workflow
- Time-locked for critical operations

### Key Functions

**Escrow Lifecycle:**
1. `create_escrow()` - Initialize with milestones
2. `notify_deposit()` - Confirm token deposits
3. `complete_milestone_task()` - Counterparty marks work done
4. `complete_milestone()` - Creator marks as completed
5. `release_milestone()` - Transfer funds with platform fee
6. `dispute_milestone()` - Flag issues for resolution

**Governance:**
- `submit_proposal()` - Create admin action proposal
- `approve_proposal()` - Sign proposal approval
- `execute_proposal()` - Execute approved proposal
- Supported actions: pause/unpause, fee updates, token config

## Token Flow

1. **Deposit:** Creator approves and deposits USDT to contract
2. **Escrow:** Funds held in contract storage per escrow ID
3. **Release:** On milestone completion:
   - Platform fee (1% default) → fee_account
   - Remaining amount → counterparty
4. **Cross-Contract:** PSP22 `transfer()` calls with error handling

## State Management

**Storage Mappings:**
- `escrows: Mapping<String, EscrowData>` - All escrows by ID
- `user_escrows: Mapping<Address, Vec<String>>` - User's escrow IDs
- `escrow_deposits: Mapping<String, Balance>` - Tracked deposits
- `proposals: Mapping<u64, AdminProposal>` - Governance proposals

**Global State:**
- Platform fee (basis points), fee account
- Total volume, token config (address, decimals)
- Admin signers, signature threshold
- Pause flag

## Network Deployment

**Live Network:** Paseo AssetHub Testnet
- RPC: `wss://testnet-passet-hub.polkadot.io`
- Chain: Substrate with ink! v6 support
- Gas Model: Polkadot weight system

**Test Networks:**
- Local: substrate-contracts-node (PolkaVM support required)
- Alternatives: Westend, Rococo

## Frontend Integration

**API Communication:**
- Polkadot.js API connects to RPC endpoint
- Contract metadata from `.contract` files
- Event listening for transaction confirmation
- Real-time balance and status updates

**User Flow:**
1. Connect wallet
2. Create escrow with milestones
3. Deposit USDT tokens
4. Track milestone progress
5. Release payments on completion
6. Handle disputes if needed

## Testing Strategy

**Smart Contracts:** 43 unit tests (83.13% coverage)
- Constructor and initialization
- Escrow lifecycle (create, update, complete)
- Milestone state transitions
- Payment release with fees
- Multisig governance
- Error paths and edge cases

**Frontend:** 151 component tests
- Wallet connection
- Escrow creation/management
- Milestone tracking
- Modal interactions
- Search and filtering

## Security Considerations

**Mitigated Risks:**
- Integer overflow/underflow (checked math)
- Reentrancy (state-before-calls pattern)
- DoS via storage (strict limits)
- Unauthorized access (role-based checks)
- Fee manipulation (multisig governance)

**Known Limitations:**
- PSP22 transfer failures require manual retry
- No automatic arbitration (manual intervention)
- Single token support (USDT only)
- H160 address format only (ink! v6 PolkaVM requirement)

## Dependencies

**Smart Contract:**
- ink! 6.0.0-beta
- parity-scale-codec 3.x
- scale-info 2.11

**Frontend:**
- @polkadot/api
- @polkadot/extension-dapp
- React, TypeScript, Vite

## Upgrade Path

Current version uses immutable contracts. Future upgrades via:
1. Deploy new contract version
2. Migrate user data off-chain
3. Update frontend to new contract address
4. Deprecate old contract (pause new escrows)
