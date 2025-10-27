# ink! v6.0.0-alpha Research Findings & Migration Guide

**Date**: 2025-10-27
**Research Source**: Official ink! documentation, GitHub releases, and examples
**Purpose**: Authoritative reference for migrating .escrow contract to ink! v6

---

## ✅ Confirmed Key Changes in ink! v6.0.0-alpha

### 1. Major Architectural Change

**Migration to pallet-revive + PolkaVM (RISC-V)**
- ink! v6 moves from pallet-contracts + WebAssembly to pallet-revive + RISC-V (PolkaVM)
- This is a **breaking change**: ink! v6 only works with cargo-contract v6+ and chains with pallet-revive
- Focus: Ethereum/Solidity compatibility as #1 priority

### 2. Address Type Changes (CRITICAL)

#### From v5 to v6:
```rust
// OLD (v5): 32-byte AccountId
pub struct Storage {
    owner: AccountId,
    balances: Mapping<AccountId, Balance>,
}

// NEW (v6): 20-byte Address (H160)
pub struct Storage {
    owner: Address,
    balances: Mapping<Address, U256>,
}
```

#### Type Definition:
- `Address` is a **type alias for H160** defined in `ink_primitives`
- Re-exported in the `ink` crate
- Represents Ethereum-compatible 20-byte addresses (like `0x6f38a07b...`)
- Replaces 32-byte SS58 Substrate addresses

### 3. Environment API Changes

#### Caller and Contract Address:

```rust
// v5 Style (NO LONGER WORKS):
let caller: AccountId = self.env().caller();
let contract_address: AccountId = self.env().account_id();

// v6 Style (CORRECT):
let caller: Address = self.env().caller();
let contract_address: Address = self.env().address();  // CHANGED METHOD
```

**Key Changes**:
- `self.env().caller()` now returns `Address` (not `AccountId`)
- `self.env().account_id()` **REMOVED** → use `self.env().address()` instead
- `Self::env().caller()` in constructors (capital S)
- `self.env().caller()` in messages (lowercase s)

### 4. Contract Balance Type

```rust
// v6: Balance depends on context, can be U256
let balance: U256 = self.env().balance();
```

### 5. Address Mapping Requirement

**CRITICAL for deployment**:
- pallet-revive requires a **1-to-1 mapping** between `AccountId` and `Address`/`H160`
- Use `map_account`/`unmap_account` API for mapping
- New `cargo contract account` subcommand to resolve H160 ↔ AccountId

### 6. Address Derivation

- After contract instantiation, address is **no longer returned** by pallet-revive
- Must derive address from given parameters using derivation scheme
- Derivation scheme: Introduced in Polkadot SDK PR #7662

---

## ✅ Verified Examples from ink! v6 ERC20

From official ink-examples/erc20/lib.rs:

```rust
// Imports (confirmed working):
use ink::prelude::vec::Vec;
use ink::storage::Mapping;

// Storage with Address (confirmed):
#[ink(storage)]
pub struct Erc20 {
    total_supply: U256,
    balances: Mapping<Address, U256>,
    allowances: Mapping<(Address, Address), U256>,
}

// Constructor with Address (confirmed):
#[ink(constructor)]
pub fn new(total_supply: U256) -> Self {
    let mut balances = Mapping::new();
    let caller = Self::env().caller();  // Returns Address
    balances.insert(caller, &total_supply);
    // ...
}

// Message functions with Address (confirmed):
#[ink(message)]
pub fn balance_of(&self, owner: Address) -> U256 {
    self.balances.get(&owner).unwrap_or(U256::ZERO)
}

#[ink(message)]
pub fn transfer(&mut self, to: Address, value: U256) -> Result<()> {
    let from = self.env().caller();  // Returns Address
    // ...
}

// Creating Address from bytes (confirmed):
let test_address = Address::from([0x01; 20]);  // 20 bytes for H160
```

---

## ✅ Confirmed Migration Pattern

### Step 1: Update Cargo.toml

```toml
[dependencies]
ink = { version = "6.0.0-alpha", default-features = false }
scale = { package = "parity-scale-codec", version = "3", default-features = false, features = ["derive"] }
scale-info = { version = "2.6", default-features = false, features = ["derive"], optional = true }

[dev-dependencies]
ink_e2e = "6.0.0-alpha"
```

### Step 2: Import Address

```rust
// Address is re-exported from ink crate
// No need for explicit: use ink::primitives::Address;
// Just use Address directly in your contract
```

### Step 3: Replace ALL AccountId with Address

**Structs:**
```rust
// OLD
pub struct EscrowData {
    creator_address: AccountId,
    counterparty_address: AccountId,
}

// NEW
pub struct EscrowData {
    creator_address: Address,
    counterparty_address: Address,
}
```

**Storage:**
```rust
// OLD
#[ink(storage)]
pub struct Contract {
    owner: AccountId,
    users: Mapping<AccountId, Data>,
}

// NEW
#[ink(storage)]
pub struct Contract {
    owner: Address,
    users: Mapping<Address, Data>,
}
```

**Functions:**
```rust
// OLD
#[ink(message)]
pub fn transfer(&mut self, to: AccountId, amount: Balance) { }

// NEW
#[ink(message)]
pub fn transfer(&mut self, to: Address, amount: U256) { }
```

**Environment Calls:**
```rust
// OLD
let caller = self.env().caller();  // Returns AccountId
let contract = self.env().account_id();  // Returns AccountId

// NEW
let caller = self.env().caller();  // Returns Address
let contract = self.env().address();  // NEW METHOD NAME
```

### Step 4: Update Events

```rust
// OLD
#[ink(event)]
pub struct Transfer {
    #[ink(topic)]
    from: AccountId,
    #[ink(topic)]
    to: AccountId,
    value: Balance,
}

// NEW
#[ink(event)]
pub struct Transfer {
    #[ink(topic)]
    from: Address,
    #[ink(topic)]
    to: Address,
    value: U256,
}
```

### Step 5: Update Tests

```rust
// OLD
let accounts = ink::env::test::default_accounts::<DefaultEnvironment>();
let alice: AccountId = accounts.alice;
ink::env::test::set_caller::<DefaultEnvironment>(alice);

// NEW
let accounts = ink::env::test::default_accounts::<DefaultEnvironment>();
let alice: Address = Address::from(accounts.alice);  // Convert
ink::env::test::set_caller::<DefaultEnvironment>(alice);

// Hard-coded test addresses
let test_addr = Address::from([0x01; 20]);  // 20 bytes, not 32
```

---

## ✅ Complete Type Mapping Reference

| v5 Type | v6 Type | Notes |
|---------|---------|-------|
| `AccountId` | `Address` | 32 bytes → 20 bytes (H160) |
| `Balance` | `U256` (context-dependent) | May still use Balance in some contexts |
| `Hash` | `H256` | Fixed to H256 |
| `self.env().account_id()` | `self.env().address()` | Method renamed |
| `self.env().caller()` returns `AccountId` | `self.env().caller()` returns `Address` | Return type changed |

---

## ✅ What Does NOT Change

- `Balance` type for amounts (in most contexts)
- `String` type for string data
- `Vec<T>` for vectors
- `Mapping<K, V>` for mappings (just K might change from AccountId to Address)
- `Result<T, E>` for results
- Event emission patterns
- Message/constructor decorators

---

## ⚠️ Critical Warnings

### 1. **No Backward Compatibility**
- ink! v6 contracts **CANNOT** work with ink! v5 frontends
- All wallet addresses must be converted SS58 → H160
- Existing deployed v5 contracts cannot be upgraded to v6

### 2. **Testnet Compatibility**
- Only works with chains that have `pallet-revive`
- Passet Hub **may or may not** support v6 yet
- Need to verify testnet compatibility before deploying

### 3. **Wallet Integration**
- Polkadot wallets use SS58 (32-byte) addresses
- v6 contracts use H160 (20-byte) addresses
- **MUST implement conversion layer** in frontend
- Conversion is **not reversible** (different SS58 can map to same H160)

### 4. **Alpha Software**
- v6.0.0-alpha is **NOT production-ready**
- Breaking changes may occur in future alphas
- Limited documentation and examples
- Use at your own risk

---

## ✅ Deployment Strategy

### Before Deploying v6 Contract:

1. **Verify testnet supports pallet-revive**
   ```bash
   # Check if chain has pallet-revive
   cargo contract info --url wss://your-testnet-rpc
   ```

2. **Create AccountId ↔ Address mapping**
   ```bash
   # Use cargo contract account subcommand
   cargo contract account map --address <your-ss58-address>
   ```

3. **Deploy with v6 tooling**
   ```bash
   cargo contract instantiate \
     --constructor new \
     --args "<Address>" "<Address>" \
     --url wss://testnet-with-pallet-revive
   ```

---

## ✅ Frontend Integration Considerations

### Address Conversion Required:

```typescript
// Wallet gives you SS58
const walletAddress = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";

// Contract needs H160
const h160Address = convertSS58ToH160(walletAddress);
// "0x1234567890abcdef1234567890abcdef12345678"

// Display to user: Convert back (may not match original!)
const displayAddress = convertH160ToSS58(h160Address);
```

### Contract ABI Changes:

- All `AccountId` fields become `Address` in metadata
- Frontend must handle 20-byte addresses instead of 32-byte
- Event parsing needs to expect `Address` types

---

## ✅ Testing Strategy

### 1. Compilation Test
```bash
cargo contract build --release --optimization-passes=z
# Target: 0 errors
```

### 2. Unit Tests
```bash
cargo test
# Target: All tests passing
```

### 3. Deployment Test
```bash
# Deploy to testnet with pallet-revive
cargo contract instantiate ...
```

### 4. Integration Test
- Test all contract functions with Address parameters
- Verify events emit Address types correctly
- Test cross-contract calls with Address

---

## ✅ Rollback Plan

If migration fails:

```bash
# Revert Cargo.toml to v5
git checkout contracts/escrow/Cargo.toml

# Rebuild with v5
cd contracts/escrow
cargo contract build --release

# Deploy to v5-compatible testnet (Aleph Zero, Rococo, etc.)
cargo contract instantiate --url wss://testnet.azero.fans ...
```

---

## 📚 Official References

- **ink! v6 docs**: https://use.ink/docs/v6/
- **Releases**: https://github.com/paritytech/ink/releases
- **Changelog**: https://github.com/paritytech/ink/blob/master/CHANGELOG.md
- **Examples**: https://github.com/paritytech/ink-examples
- **pallet-revive tracking**: https://github.com/use-ink/ink-alliance/issues/9

---

## ✅ Migration Confidence: HIGH

Based on this research:
- ✅ Address type usage is **well-documented**
- ✅ Official examples exist (ERC20)
- ✅ Migration pattern is **clear and consistent**
- ✅ Environment API changes are **straightforward**
- ⚠️ Frontend integration requires **careful planning**
- ⚠️ Testnet compatibility must be **verified first**

---

## 🎯 Ready to Proceed?

**Recommendation**: Proceed with migration following the documented patterns.

**Estimated Completion Time**: 12-16 hours

**Risk Level**: Medium-High (due to frontend integration and testnet compatibility)

**Confidence Level**: High (based on official documentation and examples)

---

**Document Version**: 1.0
**Last Updated**: 2025-10-27
**Status**: Ready for Implementation
