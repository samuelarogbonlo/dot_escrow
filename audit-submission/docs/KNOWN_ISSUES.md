# Known Issues and Limitations

**Project:** .escrow Smart Contract
**Version:** 1.0.0-pre-audit
**Last Updated:** December 17, 2025

## Overview

This document outlines known limitations, design trade-offs, and non-critical issues in the .escrow platform that auditors and users should be aware of.

## Smart Contract Limitations

### 1. PSP22 Cross-Contract Call Testing

**Issue:** Unit tests cannot fully validate PSP22 token transfers
**Impact:** ~19% of code coverage relies on integration testing
**Mitigation:** Live testing on Paseo testnet validates token flows
**Status:** Accepted limitation (standard for cross-contract calls)

**Lines Affected:**
- Fee calculation execution: `contracts/escrow/src/lib.rs:740-741`
- Token transfer calls: `contracts/escrow/src/lib.rs:760-775`
- Balance checks: Various PSP22 interactions

### 2. Single Token Support

**Issue:** Contract only supports one PSP22 token (USDT) at a time
**Impact:** Multi-currency escrows require separate contract instances
**Workaround:** Deploy multiple contracts for different tokens
**Future:** Multi-token support in v2.0

### 3. Manual Dispute Resolution

**Issue:** No automated arbitration system
**Impact:** Disputes require off-chain resolution and manual contract intervention
**Current Process:** Admin multisig handles dispute resolution
**Future:** DAO-based arbitration planned for 2025

### 4. H160 Address Format Only

**Issue:** Contract uses 20-byte H160 addresses (pallet-revive requirement)
**Impact:** Not compatible with standard 32-byte SS58 Polkadot addresses
**Reason:** Pop Network pallet-revive uses Ethereum-style addresses for EVM compatibility
**Workaround:** Frontend handles address conversion automatically

## Test Coverage Gaps

### Uncovered Code Paths (18.82%)

**Category 1: PSP22 Integration**
- Token balance queries
- Transfer execution paths
- Allowance checks
- Error handling from PSP22 contract

**Category 2: Complex Multisig Flows**
- Concurrent proposal approvals
- Threshold-exact approval scenarios
- Proposal execution failures

**Reason:** These require live chain state and cross-contract interactions
**Validation:** Tested on Paseo testnet deployment

## Design Trade-offs

### 1. Storage vs. Gas Efficiency

**Trade-off:** User-centric storage mapping for quick escrow lookups
**Cost:** Higher storage costs vs. iterating events
**Benefit:** Faster `list_escrows()` and better UX
**Impact:** ~10% higher deployment cost

### 2. String-based IDs

**Design:** Escrow and milestone IDs are strings, not u64
**Trade-off:** Flexibility vs. storage efficiency
**Benefit:** Human-readable IDs, frontend compatibility
**Cost:** ~5 bytes per ID vs. 8 bytes for counter

### 3. Immutable Contracts

**Design:** No upgrade mechanism built-in
**Trade-off:** Security vs. upgradeability
**Benefit:** Clear audit scope, no proxy risks
**Cost:** Migration required for major updates

## Frontend Limitations

### 1. Wallet Dependency

**Issue:** Requires Polkadot.js-compatible browser extension
**Impact:** No mobile wallet support yet
**Workaround:** Desktop browser required
**Roadmap:** Mobile app planned Q3 2025

### 2. Transaction Confirmation UX

**Issue:** Long block times (6-12 seconds) for transaction finality
**Impact:** Users wait for confirmation before next action
**Mitigation:** Loading states and progress indicators

### 3. No Fiat Pricing

**Issue:** All amounts displayed in USDT (no fiat conversion)
**Impact:** Users must know USDT amounts
**Future:** Fiat on/off ramps planned for 2026

## Deployment Considerations

### 1. Testnet Only (Current)

**Status:** Deployed on Pop Network Paseo testnet
**Mainnet:** Not yet deployed
**Requirement:** Full audit before mainnet launch
**Timeline:** Q2 2025 target

### 2. Gas Costs

**Issue:** PolkaVM gas costs not yet optimized
**Impact:** Higher transaction costs than expected
**Monitoring:** Ongoing optimization in ink! 6.0 stable releases

### 3. Testnet Token Availability

**Issue:** USDT test tokens limited by faucet
**Impact:** Testing requires faucet access
**Workaround:** PSP22 test token contract deployed for unlimited testing

## Non-Critical Issues

### 1. Event Emission

**Status:** Limited event types emitted
**Impact:** Off-chain indexing more difficult
**Severity:** Low (readable storage compensates)
**Improvement:** Enhanced events in future version

### 2. Error Message Granularity

**Status:** Some errors share same variant
**Example:** Multiple causes for `TokenTransferFailed`
**Impact:** Debugging requires log analysis
**Improvement:** More specific error types in v2.0

### 3. Deprecated Functions

**Functions:** `pause_contract()`, `unpause_contract()`, `update_fee()` (direct versions)
**Status:** Replaced by multisig proposal system
**Kept:** For backward compatibility and owner emergency actions
**Documentation:** Clearly marked as deprecated in docs

## Accepted Risks

### 1. Single Owner Bootstrap

**Risk:** Contract initialized with single admin (deployer)
**Mitigation:** Owner must immediately add multisig admins and increase threshold
**Status:** Documented in deployment guide

### 2. Fee Account Trust

**Risk:** Fee account controlled by owner
**Mitigation:** Transparent on-chain, multisig governance for changes
**Future:** Direct DAO treasury integration

### 3. No Circuit Breaker Auto-Trigger

**Risk:** Pause requires manual admin action
**Mitigation:** Multisig monitoring and rapid response procedures
**Consideration:** Auto-pause would introduce oracle dependencies

## User Education Required

1. **USDT Approval:** Users must approve tokens before deposit
2. **Gas Fees:** Separate from USDT, paid in network native token
3. **Finality:** Transactions take 1-2 blocks to confirm
4. **Disputes:** No automatic resolution, requires communication
5. **Wallet Backup:** Private keys are user responsibility

## Changelog

- **Dec 17, 2025:** Initial pre-audit documentation
- Coverage gaps documented with mitigation strategies
- Trade-offs explained for design decisions
- Deployment status and roadmap clarified
