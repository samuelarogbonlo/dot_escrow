# Complete ink! v5 → v6 Migration Checklist

## Overview

This document provides a comprehensive checklist for migrating the .escrow smart contract from ink! v5 to v6. The migration addresses 71+ compile errors and requires significant changes to type system, APIs, and frontend integration.

**⚠️ WARNING**: This is a **12-16 hour** migration with **HIGH RISK**. ink! v6 is still in alpha.

---

## Table of Contents

1. [Phase 1: Core Type System](#phase-1-core-type-system-30-errors)
2. [Phase 2: Imports & Module Setup](#phase-2-imports--module-setup)
3. [Phase 3: PSP22 Trait & Cross-Contract Calls](#phase-3-psp22-trait--cross-contract-calls-15-errors)
4. [Phase 4: Environment API Changes](#phase-4-environment-api-changes-20-errors)
5. [Phase 5: Function Signatures](#phase-5-function-signatures-10-errors)
6. [Phase 6: Events](#phase-6-events-5-errors)
7. [Phase 7: String Conversions & Debug Output](#phase-7-string-conversions--debug-output)
8. [Phase 8: Unit Tests](#phase-8-unit-tests)
9. [Phase 9: Frontend/Metadata Impact](#phase-9-frontendmetadata-impact)
10. [Phase 10: Verification & Testing](#phase-10-verification--testing)
11. [Complete File Checklist](#complete-file-checklist)
12. [Time Estimates & Risks](#time-estimates--risks)

---

## Key Changes Summary

| Component | v5 (OLD) | v6 (NEW) |
|-----------|----------|----------|
| **Account Type** | `AccountId` (32 bytes) | `Address` (H160, 20 bytes) |
| **Get Caller** | `self.env().caller()` → `AccountId` | `self.env().caller()` → `Address` |
| **Get Contract Address** | `self.env().account_id()` | `self.env().address()` |
| **Address Import** | `ink::env::AccountId` | `ink::primitives::Address` |
| **Wallet Format** | SS58 (Substrate) | H160 (Ethereum-style) |

---

## Phase 1: Core Type System (30+ errors)

### 1.1 Struct Definitions

**Location**: `contracts/escrow/src/lib.rs` lines ~100-200

Update all struct fields using `AccountId`:

- [ ] **EscrowData**
  ```rust
  // OLD
  pub struct EscrowData {
      pub creator_address: AccountId,
      pub counterparty_address: AccountId,
      // ...
  }

  // NEW
  pub struct EscrowData {
      pub creator_address: Address,
      pub counterparty_address: Address,
      // ...
  }
  ```

- [ ] **Milestone**
  ```rust
  // OLD
  pub dispute_filed_by: Option<AccountId>,

  // NEW
  pub dispute_filed_by: Option<Address>,
  ```

- [ ] **AdminProposal**
  ```rust
  // OLD
  pub struct AdminProposal {
      pub proposer: AccountId,
      pub approvals: Vec<AccountId>,
      // ...
  }

  // NEW
  pub struct AdminProposal {
      pub proposer: Address,
      pub approvals: Vec<Address>,
      // ...
  }
  ```

- [ ] **ReleaseResponse**
  ```rust
  // OLD
  pub receiver_address: AccountId,
  pub payer_address: AccountId,

  // NEW
  pub receiver_address: Address,
  pub payer_address: Address,
  ```

- [ ] **DisputeResponse** (if it has address fields)
- [ ] **TransactionStatus** (if it has address fields)
- [ ] All other response/data structs with address fields

### 1.2 Enum Variants

**Location**: `contracts/escrow/src/lib.rs` lines 189-205

Update `ProposalAction` enum:

```rust
// OLD
#[derive(Encode, Decode, Debug, PartialEq, Eq, Clone)]
#[cfg_attr(feature = "std", derive(scale_info::TypeInfo, StorageLayout))]
pub enum ProposalAction {
    SetFee(u16),
    SetUsdtToken(AccountId),
    SetTokenDecimals(u8),
    AddSigner(AccountId),
    RemoveSigner(AccountId),
    SetThreshold(u8),
    PauseContract,
    UnpauseContract,
    EmergencyWithdraw(AccountId, Balance),
}

// NEW
#[derive(Encode, Decode, Debug, PartialEq, Eq, Clone)]
#[cfg_attr(feature = "std", derive(scale_info::TypeInfo, StorageLayout))]
pub enum ProposalAction {
    SetFee(u16),
    SetUsdtToken(Address),
    SetTokenDecimals(u8),
    AddSigner(Address),
    RemoveSigner(Address),
    SetThreshold(u8),
    PauseContract,
    UnpauseContract,
    EmergencyWithdraw(Address, Balance),
}
```

Checklist:
- [ ] `SetUsdtToken(AccountId)` → `SetUsdtToken(Address)`
- [ ] `AddSigner(AccountId)` → `AddSigner(Address)`
- [ ] `RemoveSigner(AccountId)` → `RemoveSigner(Address)`
- [ ] `EmergencyWithdraw(AccountId, Balance)` → `EmergencyWithdraw(Address, Balance)`

### 1.3 Event Enums

**Location**: `contracts/escrow/src/lib.rs` lines ~60

Search for event definitions and update address fields:

- [ ] `EscrowCreated` events
- [ ] `MilestoneReleased` events
- [ ] `AdminAction` events
- [ ] All event structs with address fields

Example:
```rust
// OLD
#[ink(event)]
pub struct EscrowCreated {
    pub creator: AccountId,
    pub counterparty: AccountId,
}

// NEW
#[ink(event)]
pub struct EscrowCreated {
    pub creator: Address,
    pub counterparty: Address,
}
```

### 1.4 Contract Storage

**Location**: `contracts/escrow/src/lib.rs` lines 226-244

Update storage struct:

```rust
// OLD
#[ink(storage)]
pub struct EscrowContract {
    owner: AccountId,
    fee_account: AccountId,
    usdt_token: AccountId,
    admin_signers: Vec<AccountId>,
    user_escrows: Mapping<AccountId, Vec<String>>,
    // ...
}

// NEW
#[ink(storage)]
pub struct EscrowContract {
    owner: Address,
    fee_account: Address,
    usdt_token: Address,
    admin_signers: Vec<Address>,
    user_escrows: Mapping<Address, Vec<String>>,
    // ...
}
```

Checklist:
- [ ] `owner: AccountId` → `Address`
- [ ] `fee_account: AccountId` → `Address`
- [ ] `usdt_token: AccountId` → `Address`
- [ ] `admin_signers: Vec<AccountId>` → `Vec<Address>`
- [ ] `user_escrows: Mapping<AccountId, Vec<String>>` → `Mapping<Address, Vec<String>>`

**IMPORTANT**: Search entire file for ALL instances of:
- [ ] `Mapping<AccountId, ...>`
- [ ] `Vec<AccountId>`
- [ ] Any nested collections with `AccountId`
- Check dispute mappings
- Check proposal tracking structures
- Check milestone-related storage

---

## Phase 2: Imports & Module Setup

**Location**: Top of `contracts/escrow/src/lib.rs`

### 2.1 Update Imports

```rust
// OLD
use ink::prelude::string::{String, ToString};
use ink::prelude::vec::Vec;
use ink::env::AccountId; // or similar

// NEW
use ink::prelude::string::{String, ToString};
use ink::prelude::vec::Vec;
use ink::primitives::Address;  // v6 exposes Address here

// Remove or comment out unused AccountId imports
```

Checklist:
- [ ] Add `use ink::primitives::Address;`
- [ ] Remove or update `AccountId` imports
- [ ] Verify all type imports are correct

### 2.2 Global Find/Replace

**⚠️ Use carefully - verify each replacement:**

```bash
# Search in contracts/escrow/src/lib.rs
# Find: AccountId
# Replace: Address

# But SKIP replacements in:
# - Comments explaining the migration
# - String literals
# - Documentation
```

---

## Phase 3: PSP22 Trait & Cross-Contract Calls (15+ errors)

### 3.1 PSP22 Trait Definition

**Location**: `contracts/escrow/src/lib.rs` lines 20-55

```rust
// OLD
#[ink::trait_definition]
pub trait PSP22 {
    #[ink(message, selector = 0x162df8c2)]
    fn total_supply(&self) -> Balance;

    #[ink(message, selector = 0x6568382f)]
    fn balance_of(&self, owner: AccountId) -> Balance;

    #[ink(message, selector = 0x4d47d921)]
    fn allowance(&self, owner: AccountId, spender: AccountId) -> Balance;

    #[ink(message, selector = 0xdb20f9f5)]
    fn transfer(
        &mut self,
        to: AccountId,
        value: Balance,
        data: Vec<u8>,
    ) -> Result<(), PSP22Error>;

    #[ink(message)]
    fn transfer_from(
        &mut self,
        from: AccountId,
        to: AccountId,
        value: Balance,
        data: Vec<u8>,
    ) -> Result<(), PSP22Error>;

    #[ink(message, selector = 0xb20f1bbd)]
    fn approve(&mut self, spender: AccountId, value: Balance) -> Result<(), PSP22Error>;
}

// NEW
#[ink::trait_definition]
pub trait PSP22 {
    #[ink(message, selector = 0x162df8c2)]
    fn total_supply(&self) -> Balance;

    #[ink(message, selector = 0x6568382f)]
    fn balance_of(&self, owner: Address) -> Balance;

    #[ink(message, selector = 0x4d47d921)]
    fn allowance(&self, owner: Address, spender: Address) -> Balance;

    #[ink(message, selector = 0xdb20f9f5)]
    fn transfer(
        &mut self,
        to: Address,
        value: Balance,
        data: Vec<u8>,
    ) -> Result<(), PSP22Error>;

    #[ink(message)]
    fn transfer_from(
        &mut self,
        from: Address,
        to: Address,
        value: Balance,
        data: Vec<u8>,
    ) -> Result<(), PSP22Error>;

    #[ink(message, selector = 0xb20f1bbd)]
    fn approve(&mut self, spender: Address, value: Balance) -> Result<(), PSP22Error>;
}
```

Checklist:
- [ ] `balance_of(&self, owner: AccountId)` → `owner: Address`
- [ ] `allowance(&self, owner: AccountId, spender: AccountId)` → both `Address`
- [ ] `transfer(&mut self, to: AccountId, ...)` → `to: Address`
- [ ] `transfer_from(&mut self, from: AccountId, to: AccountId, ...)` → both `Address`
- [ ] `approve(&mut self, spender: AccountId, ...)` → `spender: Address`

### 3.2 Cross-Contract Call Sites

**Location**: Line 1645 and similar

```rust
// OLD
let token: ink::contract_ref!(PSP22) = self.usdt_token.into();
// Fails because usdt_token is AccountId but PSP22 expects Address

// NEW
let token: ink::contract_ref!(PSP22) = self.usdt_token.into();
// Works because usdt_token is now Address
```

Checklist:
- [ ] Line 1645: `let token: ink::contract_ref!(PSP22) = self.usdt_token.into();`
- [ ] Verify `usdt_token` storage field is `Address` type
- [ ] Check all PSP22 method calls: `token.balance_of()`, `token.transfer()`, etc.
- [ ] Search file for all `contract_ref!` uses

---

## Phase 4: Environment API Changes (20+ errors)

### 4.1 Replace Removed Methods

**Location**: Line 1646 and similar

```rust
// OLD - This method was REMOVED in v6
let contract_address = self.env().account_id();

// NEW - Use this instead
let contract_address = self.env().address();
```

Checklist:
- [ ] Search entire file for `self.env().account_id()`
- [ ] Replace ALL with `self.env().address()`
- [ ] Line 1646 is one known location

### 4.2 Caller Now Returns Address

**Context**: `self.env().caller()` now returns `Address` instead of `AccountId`

Known error locations:
- [ ] **Line 1540**: `proposal.approvals.push(caller);`
  - `caller` is now `Address`, ensure `approvals` is `Vec<Address>`

- [ ] **Line 1546**: `approved_by: caller,`
  - Event field must expect `Address`

- [ ] **Line 1663**: `executed_by: self.env().caller(),`
  - Event field must expect `Address`

**Full Search**:
- [ ] Find ALL uses of `self.env().caller()` (likely 20+ locations)
- [ ] Verify each assignment/comparison expects `Address`
- [ ] Update any function parameters that receive caller

---

## Phase 5: Function Signatures (10+ errors)

**Location**: Throughout `lib.rs`

### Constructor

```rust
// OLD
#[ink(constructor)]
pub fn new(usdt_token: AccountId, fee_account: AccountId) -> Self {
    // ...
}

// NEW
#[ink(constructor)]
pub fn new(usdt_token: Address, fee_account: Address) -> Self {
    // ...
}
```

Checklist:
- [ ] Constructor: `new(usdt_token: Address, fee_account: Address)`

### Public Messages

Update ALL public message functions with address parameters:

```rust
// OLD
#[ink(message)]
pub fn create_escrow(
    &mut self,
    creator_address: AccountId,
    counterparty_address: AccountId,
    // ...
) -> Result<String, EscrowError>

// NEW
#[ink(message)]
pub fn create_escrow(
    &mut self,
    creator_address: Address,
    counterparty_address: Address,
    // ...
) -> Result<String, EscrowError>
```

**Function Checklist**:
- [ ] `create_escrow(creator_address: Address, counterparty_address: Address, ...)`
- [ ] `release_milestone(..., receiver: Address, ...)`
- [ ] `dispute_milestone(escrow_id: String, filed_by: Address, ...)`
- [ ] `add_admin_signer(new_signer: Address)`
- [ ] `remove_admin_signer(signer: Address)`
- [ ] `propose_action(...)` - check if proposer is a parameter
- [ ] `approve_proposal(...)` - approver typically from caller
- [ ] `emergency_withdraw(recipient: Address, amount: Balance)`
- [ ] `set_usdt_token(token_address: Address)`
- [ ] `set_fee_account(new_fee_account: Address)`
- [ ] Any getter functions returning addresses

**Search Strategy**:
```bash
# Search for function signatures with AccountId
grep -n "pub fn.*AccountId" contracts/escrow/src/lib.rs
```

---

## Phase 6: Events (5+ errors)

**Location**: Throughout `lib.rs` (event definitions and emissions)

### Event Definitions

```rust
// OLD
#[ink(event)]
pub struct EscrowCreated {
    #[ink(topic)]
    pub escrow_id: String,
    pub creator: AccountId,
    pub counterparty: AccountId,
    pub total_amount: String,
}

// NEW
#[ink(event)]
pub struct EscrowCreated {
    #[ink(topic)]
    pub escrow_id: String,
    pub creator: Address,
    pub counterparty: Address,
    pub total_amount: String,
}
```

**Event Checklist**:
- [ ] `EscrowCreated { escrow_id, creator: Address, counterparty: Address, ... }`
- [ ] `MilestoneCompleted { escrow_id, milestone_id, completed_by: Address, ... }`
- [ ] `MilestoneReleased { escrow_id, payer: Address, receiver: Address, amount, ... }`
- [ ] `MilestoneDisputed { escrow_id, filed_by: Address, reason, ... }`
- [ ] `AdminSignerAdded { signer: Address, added_by: Address }`
- [ ] `AdminSignerRemoved { signer: Address, removed_by: Address }`
- [ ] `ProposalCreated { proposal_id, proposer: Address, action, ... }`
- [ ] `ProposalApproved { proposal_id, approver: Address }`
- [ ] `ProposalExecuted { proposal_id, executed_by: Address, ... }`
- [ ] `FeeAccountChanged { old_account: Address, new_account: Address, changed_by: Address }`
- [ ] `UsdtTokenChanged { old_token: Address, new_token: Address, changed_by: Address }`
- [ ] Any other custom events with address fields

**Search Strategy**:
```bash
# Find all event definitions
grep -n "#\[ink(event)\]" contracts/escrow/src/lib.rs
```

---

## Phase 7: String Conversions & Debug Output

**Context**: `AccountId` has built-in `Display`/`Debug` traits, but `Address` (H160) needs hex encoding.

### 7.1 Address to String Conversion

```rust
// OLD - AccountId has Display trait
let msg = format!("Caller: {:?}", account_id);
let addr_string = account_id.to_string();

// NEW - Address needs hex encoding
use ink::prelude::format;

// Option 1: Using Debug (shows raw bytes)
let msg = format!("Caller: {:?}", address);

// Option 2: Hex format (Ethereum-style)
let msg = format!("Caller: {:#x}", address);

// Option 3: Manual hex encoding
let addr_string = format!("0x{}", hex::encode(address.as_ref()));
```

### 7.2 Update Locations

Search for string formatting with addresses:

**Search patterns**:
- [ ] `format!` with address variables
- [ ] `.to_string()` on address variables
- [ ] `String::from` with addresses
- [ ] Any logging/debug output with addresses

**Specific areas to check**:
- [ ] Error messages mentioning addresses
- [ ] Success messages with addresses
- [ ] Event emission (if addresses are formatted before emission)
- [ ] Debug/test output
- [ ] Return values with formatted addresses

Example locations:
```rust
// Status messages
let msg = format!("Escrow created by {:#x}", creator_address);

// Error messages
return Err(EscrowError::Custom(
    format!("Unauthorized caller: {:#x}", caller)
));

// Debug output
ink::env::debug_println!("Caller address: {:#x}", self.env().caller());
```

**Add hex crate if needed**:
```toml
# In Cargo.toml dependencies
hex = { version = "0.4", default-features = false }
```

---

## Phase 8: Unit Tests

**Location**: `contracts/escrow/unit_tests.rs`

### 8.1 Test Imports & Setup

```rust
// At top of unit_tests.rs or test module
use ink::primitives::Address;
use ink::env::test::{
    set_caller,
    set_callee,
    set_value_transferred,
    default_accounts,
    DefaultAccounts,
};
use ink::env::DefaultEnvironment;
```

### 8.2 Account Fixtures (CRITICAL)

```rust
// OLD - default_accounts returns AccountId
let accounts = ink::env::test::default_accounts::<DefaultEnvironment>();
let alice = accounts.alice;  // Type: AccountId
let bob = accounts.bob;
let charlie = accounts.charlie;

// NEW - Must convert to Address
let accounts = ink::env::test::default_accounts::<DefaultEnvironment>();
let alice = Address::from(accounts.alice);  // Convert to Address
let bob = Address::from(accounts.bob);
let charlie = Address::from(accounts.charlie);
let eve = Address::from(accounts.eve);
let frank = Address::from(accounts.frank);
```

### 8.3 Setting Test Context

```rust
// OLD
ink::env::test::set_caller::<DefaultEnvironment>(accounts.alice);

// NEW
ink::env::test::set_caller::<DefaultEnvironment>(Address::from(accounts.alice));

// Or if you already converted:
ink::env::test::set_caller::<DefaultEnvironment>(alice);
```

### 8.4 Hard-coded Test Addresses

```rust
// OLD - 32 bytes for AccountId
let test_token = AccountId::from([0x1; 32]);
let test_fee_account = AccountId::from([0x2; 32]);

// NEW - 20 bytes for Address (H160)
let test_token = Address::from([0x1; 20]);
let test_fee_account = Address::from([0x2; 20]);
```

### 8.5 Mock Data Construction

```rust
// OLD
let test_escrow = EscrowData {
    id: String::from("test-001"),
    creator_address: accounts.alice,
    counterparty_address: accounts.bob,
    // ...
};

// NEW
let test_escrow = EscrowData {
    id: String::from("test-001"),
    creator_address: Address::from(accounts.alice),
    counterparty_address: Address::from(accounts.bob),
    // ...
};
```

### 8.6 Test Case Checklist

For EACH test function:

- [ ] Convert account fixtures to `Address`
- [ ] Update `set_caller` with `Address`
- [ ] Update `set_callee` with `Address`
- [ ] Update mock escrow data
- [ ] Update mock milestone data
- [ ] Update mock proposal data
- [ ] Update assertion expectations
- [ ] Update helper functions

**Known test files**:
- [ ] `contracts/escrow/unit_tests.rs` (main test file)
- [ ] Any integration tests
- [ ] Test helper functions

**Example test update**:
```rust
// OLD
#[ink::test]
fn test_create_escrow() {
    let accounts = default_accounts::<DefaultEnvironment>();
    set_caller::<DefaultEnvironment>(accounts.alice);

    let mut contract = EscrowContract::new(
        accounts.bob,  // token
        accounts.charlie,  // fee account
    );

    let result = contract.create_escrow(
        accounts.alice,  // creator
        accounts.bob,    // counterparty
        String::from("Test Project"),
        String::from("Description"),
        String::from("1000"),
        vec![],
    );

    assert_eq!(contract.owner, accounts.alice);
}

// NEW
#[ink::test]
fn test_create_escrow() {
    let accounts = default_accounts::<DefaultEnvironment>();
    let alice = Address::from(accounts.alice);
    let bob = Address::from(accounts.bob);
    let charlie = Address::from(accounts.charlie);

    set_caller::<DefaultEnvironment>(alice);

    let mut contract = EscrowContract::new(
        bob,      // token
        charlie,  // fee account
    );

    let result = contract.create_escrow(
        alice,  // creator
        bob,    // counterparty
        String::from("Test Project"),
        String::from("Description"),
        String::from("1000"),
        vec![],
    );

    assert_eq!(contract.owner, alice);
}
```

### 8.7 Search Strategy for Tests

```bash
# Find all test functions
grep -n "#\[ink::test\]" contracts/escrow/unit_tests.rs

# Find AccountId uses in tests
grep -n "AccountId" contracts/escrow/unit_tests.rs

# Find set_caller uses
grep -n "set_caller" contracts/escrow/unit_tests.rs
```

---

## Phase 9: Frontend/Metadata Impact

**Context**: After rebuilding the contract, the ABI metadata changes. All `AccountId` fields become `Address` (20 bytes instead of 32).

### 9.1 Regenerate Contract Metadata

After successful contract build:

```bash
# Contract artifacts location
ls -la contracts/target/ink/escrow_contract/

# Files to update frontend with:
# - escrow_contract.json (new metadata)
# - escrow_contract.contract (deployment bundle)
```

Checklist:
- [ ] Copy new `escrow_contract.json` to frontend
- [ ] Update `frontend/src/contractABI/EscrowABI.ts`
- [ ] Compare old vs new metadata (diff tool)
- [ ] Note all `AccountId` → `Address` changes

### 9.2 Frontend Address Format Changes

```typescript
// OLD: 32-byte SS58 Substrate addresses
const aliceAddress = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"; // 48 chars

// NEW: 20-byte Ethereum-style H160 addresses
const aliceAddress = "0x1234567890abcdef1234567890abcdef12345678"; // 42 chars (0x + 40 hex)
```

### 9.3 Address Conversion Utilities

**⚠️ CRITICAL**: Polkadot wallets return SS58 addresses, but v6 contracts expect H160.

Create conversion utilities:

```typescript
// frontend/src/utils/addressConversion.ts

import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';
import { u8aToHex, hexToU8a } from '@polkadot/util';

/**
 * Convert SS58 (Substrate) address to H160 (Ethereum-style)
 *
 * WARNING: This is a lossy conversion!
 * Different SS58 addresses can map to the same H160.
 */
export function ss58ToH160(ss58Address: string): string {
  try {
    // Decode SS58 to 32-byte public key
    const publicKey = decodeAddress(ss58Address);

    // Take first 20 bytes for H160
    // Alternative: Take last 20 bytes, or use keccak hash
    const h160Bytes = publicKey.slice(0, 20);

    // Convert to hex string with 0x prefix
    return u8aToHex(h160Bytes);
  } catch (error) {
    console.error('Failed to convert SS58 to H160:', error);
    throw new Error(`Invalid SS58 address: ${ss58Address}`);
  }
}

/**
 * H160 → SS58 conversion (NOT REVERSIBLE)
 *
 * This creates a "pseudo" SS58 address by padding H160 to 32 bytes.
 * It will NOT match the original SS58 address!
 */
export function h160ToSS58(h160Address: string, ss58Format: number = 42): string {
  try {
    // Remove 0x prefix and convert to bytes
    const h160Bytes = hexToU8a(h160Address);

    if (h160Bytes.length !== 20) {
      throw new Error('Invalid H160 address length');
    }

    // Pad to 32 bytes (this is arbitrary - not cryptographically valid)
    const paddedBytes = new Uint8Array(32);
    paddedBytes.set(h160Bytes, 0);

    // Encode as SS58
    return encodeAddress(paddedBytes, ss58Format);
  } catch (error) {
    console.error('Failed to convert H160 to SS58:', error);
    throw new Error(`Invalid H160 address: ${h160Address}`);
  }
}

/**
 * Check if address is H160 format
 */
export function isH160(address: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

/**
 * Check if address is SS58 format (basic check)
 */
export function isSS58(address: string): boolean {
  try {
    decodeAddress(address);
    return true;
  } catch {
    return false;
  }
}
```

### 9.4 Update Contract ABI Configuration

```typescript
// frontend/src/contractABI/EscrowABI.ts

// OLD
export const ESCROW_CONTRACT_ADDRESS: string = '5Fz1QCwsGD3q2ZuVToSGUcrrDKmKr23PUh8NVi31pW6vwzSU'; // SS58

// NEW - After deploying v6 contract
export const ESCROW_CONTRACT_ADDRESS: string = '0x1234567890abcdef1234567890abcdef12345678'; // H160

// Import new metadata
import contractMetadata from './EscrowABI.json'; // Updated v6 metadata

export const ESCROW_CONTRACT_ABI = contractMetadata;
```

### 9.5 Update Contract Interaction Hooks

**File**: `frontend/src/hooks/useEscrowContract.ts`

```typescript
// Example changes needed

import { ss58ToH160, h160ToSS58 } from '../utils/addressConversion';

// When calling contract methods
const createEscrow = async (
  counterpartyAddress: string, // User provides SS58 from wallet
  // ... other params
) => {
  try {
    // Convert SS58 to H160 before sending to contract
    const counterpartyH160 = ss58ToH160(counterpartyAddress);

    // Call contract with H160 address
    await contract.tx.createEscrow(
      { value: 0, gasLimit },
      creatorH160,
      counterpartyH160,
      // ... other args
    );
  } catch (error) {
    console.error('Create escrow failed:', error);
  }
};

// When reading from contract
const getEscrow = async (escrowId: string) => {
  const result = await contract.query.getEscrow(escrowId);

  if (result.value.ok) {
    const escrow = result.value.ok;

    // Contract returns H160 addresses, convert to SS58 for display
    return {
      ...escrow,
      creatorAddress: h160ToSS58(escrow.creatorAddress),
      counterpartyAddress: h160ToSS58(escrow.counterpartyAddress),
    };
  }
};
```

### 9.6 Update Wallet Connection

**File**: `frontend/src/hooks/useWalletContext.tsx`

```typescript
// When user connects wallet
const connectWallet = async () => {
  const injector = await web3Enable('Escrow DApp');
  const accounts = await web3Accounts();

  if (accounts.length > 0) {
    const selectedAccount = accounts[0];

    // Store BOTH formats
    setWalletState({
      ss58Address: selectedAccount.address,
      h160Address: ss58ToH160(selectedAccount.address), // For contract calls
      signer: injector[0].signer,
    });
  }
};
```

### 9.7 Update UI Components

Display addresses appropriately:

```tsx
// components/EscrowCard.tsx

import { h160ToSS58 } from '../utils/addressConversion';

const EscrowCard = ({ escrow }) => {
  // Contract returns H160, convert for user-friendly display
  const displayCreator = h160ToSS58(escrow.creatorAddress);
  const displayCounterparty = h160ToSS58(escrow.counterpartyAddress);

  return (
    <Box>
      <Text>Creator: {displayCreator}</Text>
      <Text>Counterparty: {displayCounterparty}</Text>
    </Box>
  );
};
```

### 9.8 Update API/Backend Integration

If you have a backend API:

```typescript
// Update API types
interface EscrowDTO {
  id: string;
  creatorAddress: string; // Now H160 format
  counterpartyAddress: string; // Now H160 format
  // ...
}

// Update validation
const validateAddress = (address: string): boolean => {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
};
```

### 9.9 Frontend Checklist

- [ ] Install/update dependencies: `@polkadot/util`, `@polkadot/util-crypto`
- [ ] Create address conversion utilities
- [ ] Update `EscrowABI.ts` with new metadata
- [ ] Update contract address to H160 format
- [ ] Update `useEscrowContract` hook
  - [ ] Convert addresses before contract calls
  - [ ] Convert addresses when reading from contract
- [ ] Update `useWalletContext` hook
  - [ ] Store both SS58 and H160 addresses
- [ ] Update UI components
  - [ ] Display addresses in user-friendly format
  - [ ] Handle address input/validation
- [ ] Update forms/inputs
  - [ ] Address validation
  - [ ] Address formatting
- [ ] Update tests
  - [ ] Mock addresses in H160 format
  - [ ] Test address conversion utilities
- [ ] Update documentation
  - [ ] Explain address format change
  - [ ] Update examples

### 9.10 Testing Frontend Integration

```typescript
// Test address conversion
describe('Address Conversion', () => {
  it('should convert SS58 to H160', () => {
    const ss58 = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
    const h160 = ss58ToH160(ss58);

    expect(h160).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });

  it('should handle contract calls with H160', async () => {
    const wallet SS58 = '5GrwvaEF...';
    const h160 = ss58ToH160(walletSS58);

    // Mock contract call
    const result = await contract.query.getEscrow(h160);
    expect(result).toBeDefined();
  });
});
```

---

## Phase 10: Verification & Testing

### 10.1 Compilation

```bash
cd contracts/escrow
cargo contract build --release --optimization-passes=z
```

**Success Criteria**:
- [ ] **0 compilation errors** (down from 71)
- [ ] **0 warnings** (or only expected warnings)
- [ ] Contract size: ~60-70K (similar to v5)

**Expected Output**:
```
Finished `release` profile [optimized] target(s) in XX.XXs
Generating bundle
Original wasm size: XXK, Optimized: XXK
Your contract artifacts are ready at:
/Users/samuel/Documents/freelance/dot_escrow/contracts/target/ink/escrow_contract
```

### 10.2 Unit Tests

```bash
cargo test
```

**Success Criteria**:
- [ ] All 34 tests passing
- [ ] 0 test failures
- [ ] No panics or unexpected errors

**If tests fail**:
1. Check address comparison errors
2. Verify fixture conversions
3. Check event assertions
4. Review mock data types

### 10.3 Contract Size Verification

```bash
ls -lh contracts/target/ink/escrow_contract/

# Check sizes
# escrow_contract.wasm should be ~60-70K
# escrow_contract.contract should be ~170K
```

- [ ] WASM size acceptable
- [ ] Still fits deployment limits (if Passet Hub)

### 10.4 Deployment Test

#### Option A: Using Contracts UI

1. Go to https://contracts-ui.substrate.io/
2. Select network (Passet Hub or other testnet)
3. Upload `escrow_contract.contract`
4. Verify constructor shows `Address` parameters
5. Deploy with test `Address` values
6. Check deployment succeeds

Checklist:
- [ ] Contract uploads successfully
- [ ] Constructor parameters are `Address` type
- [ ] No BlobTooLarge error (if using Passet Hub)
- [ ] Deployment transaction succeeds
- [ ] Contract address received

#### Option B: Using cargo-contract CLI

```bash
cargo contract instantiate \
  --constructor new \
  --args "0x1234...token" "0x5678...feeAccount" \
  --suri "your seed phrase" \
  --url wss://rpc1.paseo.popnetwork.xyz \
  contracts/target/ink/escrow_contract/escrow_contract.contract
```

- [ ] Instantiation succeeds
- [ ] Contract address returned
- [ ] No type mismatch errors

### 10.5 Contract Interaction Test

Test basic contract functions:

```bash
# Query contract owner (should return H160 Address)
cargo contract call \
  --contract 0xYOUR_CONTRACT_ADDRESS \
  --message owner \
  --url wss://rpc1.paseo.popnetwork.xyz \
  --suri "your seed phrase" \
  --dry-run

# Create a test escrow
cargo contract call \
  --contract 0xYOUR_CONTRACT_ADDRESS \
  --message create_escrow \
  --args "0x_creator" "0x_counterparty" "Test" "Desc" "1000" "[]" \
  --url wss://rpc1.paseo.popnetwork.xyz \
  --suri "your seed phrase"
```

Checklist:
- [ ] Query functions return correct types
- [ ] Address returns are H160 format
- [ ] Transactions succeed
- [ ] Events emit correctly

### 10.6 Frontend Integration Test

1. **Update frontend with new ABI**
   ```bash
   cd frontend
   # Copy new metadata
   cp ../contracts/target/ink/escrow_contract/escrow_contract.json src/contractABI/
   ```

2. **Test address conversion**
   ```typescript
   // In browser console
   import { ss58ToH160 } from './utils/addressConversion';
   const h160 = ss58ToH160('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');
   console.log(h160); // Should show 0x...
   ```

3. **Test wallet connection**
   - [ ] Connect wallet
   - [ ] SS58 address displayed correctly
   - [ ] H160 address generated
   - [ ] Can sign transactions

4. **Test contract calls from UI**
   - [ ] Create escrow works
   - [ ] Complete milestone works
   - [ ] Release funds works
   - [ ] Dispute works
   - [ ] Events display correctly

5. **Test data display**
   - [ ] Escrows list shows correct addresses
   - [ ] Milestone details show correct addresses
   - [ ] Transaction history works
   - [ ] Admin panel works (if applicable)

### 10.7 End-to-End Flow Test

**Complete User Journey**:

1. [ ] Connect wallet (SS58 → H160 conversion)
2. [ ] View balance
3. [ ] Create new escrow with counterparty
4. [ ] Counterparty accepts escrow
5. [ ] Complete milestone
6. [ ] Creator approves milestone
7. [ ] Funds released
8. [ ] Verify balances updated
9. [ ] Check events emitted
10. [ ] Verify all addresses in H160 format

### 10.8 Edge Cases & Error Handling

- [ ] Invalid H160 address input
- [ ] Invalid SS58 address input
- [ ] Address conversion failures
- [ ] Network mismatch (SS58 format for wrong network)
- [ ] Zero address (0x0000...0000)
- [ ] Contract address conflicts
- [ ] Event parsing with address fields

### 10.9 Performance Testing

- [ ] Gas costs similar to v5
- [ ] Transaction speed acceptable
- [ ] Frontend responsiveness good
- [ ] Address conversion overhead minimal

### 10.10 Final Verification Checklist

- [ ] ✅ Contract compiles (0 errors)
- [ ] ✅ All tests pass (34/34)
- [ ] ✅ Contract deploys successfully
- [ ] ✅ Can call contract functions
- [ ] ✅ Frontend connects to contract
- [ ] ✅ Address conversion works
- [ ] ✅ Full user flow works
- [ ] ✅ Events emit correctly
- [ ] ✅ No security issues
- [ ] ✅ Documentation updated
- [ ] ✅ README updated with v6 info
- [ ] ✅ Deployment guide updated

---

## Complete File Checklist

### contracts/escrow/src/lib.rs

Search and update by section:

- [ ] **Lines 1-20**: Imports
  - [ ] Add `use ink::primitives::Address;`
  - [ ] Remove unused `AccountId` imports

- [ ] **Lines 20-55**: PSP22 Trait
  - [ ] All function parameters `AccountId` → `Address`

- [ ] **Lines ~60-80**: Event Enums
  - [ ] All address fields `AccountId` → `Address`

- [ ] **Lines 68-85**: Error Types (check for address fields)

- [ ] **Lines 86-110**: Status Enums (usually no addresses)

- [ ] **Lines 111-188**: Data Structs
  - [ ] `EscrowData`: creator, counterparty → `Address`
  - [ ] `Milestone`: dispute_filed_by → `Option<Address>`
  - [ ] `AdminProposal`: proposer, approvals → `Address`
  - [ ] `ReleaseResponse`: receiver, payer → `Address`

- [ ] **Lines 189-205**: ProposalAction Enum
  - [ ] `SetUsdtToken(Address)`
  - [ ] `AddSigner(Address)`
  - [ ] `RemoveSigner(Address)`
  - [ ] `EmergencyWithdraw(Address, Balance)`

- [ ] **Lines 206-225**: Additional Enums (check for addresses)

- [ ] **Lines 226-244**: Storage Struct
  - [ ] `owner: Address`
  - [ ] `fee_account: Address`
  - [ ] `usdt_token: Address`
  - [ ] `admin_signers: Vec<Address>`
  - [ ] `user_escrows: Mapping<Address, Vec<String>>`
  - [ ] Any other address fields

- [ ] **Lines 245-378**: Events (search for all `#[ink(event)]`)
  - [ ] Update all address fields

- [ ] **Line 379**: Constructor
  - [ ] `new(usdt_token: Address, fee_account: Address)`

- [ ] **Lines 380-1700**: Public Messages (ALL functions)
  - [ ] Search for functions with address parameters
  - [ ] Update each function signature
  - [ ] Update function bodies using `self.env().caller()`
  - [ ] Update function bodies using `self.env().account_id()` → `.address()`

- [ ] **Known Error Lines**:
  - [ ] Line 1540: `proposal.approvals.push(caller)`
  - [ ] Line 1546: `approved_by: caller`
  - [ ] Line 1645: `let token: ink::contract_ref!(PSP22) = self.usdt_token.into()`
  - [ ] Line 1646: `self.env().account_id()` → `.address()`
  - [ ] Line 1663: `executed_by: self.env().caller()`

- [ ] **String Conversions**: Search for
  - [ ] `format!` with addresses
  - [ ] `.to_string()` with addresses
  - [ ] Error messages with addresses

- [ ] **Helper Functions**: Check private functions
  - [ ] Any internal functions with address parameters

### contracts/escrow/unit_tests.rs

- [ ] **Imports**
  - [ ] Add `use ink::primitives::Address;`

- [ ] **Test Fixtures**
  - [ ] Convert all `default_accounts()` to `Address`
  - [ ] Hard-coded addresses: `[0x1; 32]` → `[0x1; 20]`

- [ ] **Each Test Function** (search for `#[ink::test]`)
  - [ ] Update account setup
  - [ ] Update `set_caller` calls
  - [ ] Update mock data
  - [ ] Update assertions

- [ ] **Helper Functions**
  - [ ] Any test utilities with address parameters

### contracts/escrow/Cargo.toml

- [ ] Verify ink version: `ink = { version = "6.0.0-alpha", default-features = false }`
- [ ] Verify ink_e2e version: `ink_e2e = "6.0.0-alpha"`
- [ ] Add hex crate if needed: `hex = { version = "0.4", default-features = false }`

### frontend/src/

- [ ] **contractABI/**
  - [ ] Copy new `escrow_contract.json`
  - [ ] Update `EscrowABI.ts` with new contract address (H160)

- [ ] **utils/**
  - [ ] Create `addressConversion.ts`
  - [ ] Implement `ss58ToH160`
  - [ ] Implement `h160ToSS58`
  - [ ] Implement `isH160`, `isSS58`

- [ ] **hooks/**
  - [ ] Update `useEscrowContract.ts`
  - [ ] Update `useWalletContext.tsx`
  - [ ] Update `usePolkadotApi.ts` (if needed)

- [ ] **components/**
  - [ ] Update any components displaying addresses
  - [ ] Update forms with address inputs
  - [ ] Update address validation

- [ ] **pages/**
  - [ ] Update CreateEscrow page
  - [ ] Update EscrowDetails page
  - [ ] Update Admin page (if applicable)

- [ ] **types/**
  - [ ] Update TypeScript interfaces for contract types

- [ ] **tests/**
  - [ ] Update test fixtures
  - [ ] Add address conversion tests

---

## Time Estimates & Risks

### Time Breakdown

| Phase | Description | Time | Difficulty |
|-------|-------------|------|------------|
| 1 | Core Type System | 3-4 hours | Mechanical but tedious |
| 2 | Imports & Setup | 30 min | Easy |
| 3 | PSP22 Trait | 1 hour | Moderate |
| 4 | Environment API | 1 hour | Easy |
| 5 | Function Signatures | 1-2 hours | Moderate |
| 6 | Events | 1 hour | Easy |
| 7 | String Conversions | 30 min | Easy |
| 8 | Unit Tests | 2-3 hours | Very tedious |
| 9 | Frontend Integration | 3-4 hours | Complex |
| 10 | Testing & Debugging | 2-3 hours | Variable |
| **TOTAL** | | **15-21 hours** | **Very High** |

### Realistic Schedule

- **Day 1**: Phases 1-7 (contract code changes) - 8-10 hours
- **Day 2**: Phases 8-9 (tests + frontend) - 6-8 hours
- **Day 3**: Phase 10 (testing + fixes) - 2-4 hours

**Minimum**: 2 full days (16 hours)
**Expected**: 2.5-3 days (20 hours)
**With complications**: 4-5 days (32+ hours)

---

## Critical Risks

### 1. ⚠️ Wallet Compatibility (HIGH RISK)

**Problem**: Polkadot wallets (Polkadot.js, SubWallet, Talisman) use SS58 (32-byte) addresses, but ink! v6 uses H160 (20-byte).

**Impact**:
- Address conversion is **not reversible**
- Different SS58 addresses can map to same H160
- May lose ability to verify signatures
- User confusion (different address formats)

**Mitigation**:
- Implement robust conversion layer
- Store mapping of SS58 ↔ H160
- Clear UX indicating address format
- Thorough testing with real wallets

### 2. ⚠️ Testnet Support (HIGH RISK)

**Problem**: Passet Hub and other testnets may not support ink! v6 alpha yet.

**Impact**:
- Cannot deploy even after migration
- Wasted migration effort
- Need to find v6-compatible testnet

**Mitigation**:
- Verify testnet compatibility BEFORE migrating
- Have backup testnet ready
- Consider staying on v5

### 3. ⚠️ Alpha Software (HIGH RISK)

**Problem**: ink! v6 is still in alpha - not production-ready.

**Impact**:
- Breaking changes in future versions
- Limited documentation
- Fewer examples/resources
- Potential bugs in ink! itself

**Mitigation**:
- Thorough testing
- Maintain v5 branch as backup
- Monitor ink! v6 release notes
- Budget extra time for unknowns

### 4. ⚠️ Frontend Breaking Changes (MEDIUM RISK)

**Problem**: Existing v5 frontend completely incompatible with v6 contract.

**Impact**:
- Need to update entire frontend
- All existing integrations break
- Testing burden increases
- Deployment coordination required

**Mitigation**:
- Feature flag for v5/v6
- Gradual rollout
- Comprehensive testing
- User migration plan

### 5. ⚠️ Size Limit Not Solved (CRITICAL)

**Problem**: Migrating to v6 **does not solve** the Passet Hub BlobTooLarge error.

**Impact**:
- Still can't deploy to Passet Hub
- All migration work may be wasted
- Back to square one

**Mitigation**:
- Deploy to different testnet (Aleph, Rococo)
- Simplify contract (remove features)
- Use v5 on larger-limit testnet

### 6. ⚠️ Data Migration (LOW-MEDIUM RISK)

**Problem**: If you have existing v5 contract with data, cannot migrate to v6.

**Impact**:
- Lose all existing escrows
- Users need to recreate data
- Complex migration script needed

**Mitigation**:
- Export data before migration
- Provide migration tools
- Clear communication to users

---

## Alternative Recommendation

### Given the Risks:

**❌ DO NOT migrate to v6 if:**
- You need to deploy ASAP (hackathon deadline)
- Passet Hub is your only testnet option
- You have limited time (< 3 days)
- Your v5 contract works fine

**✅ BETTER APPROACH**:

1. **Revert to ink! v5**
   ```bash
   cd contracts/escrow
   git checkout Cargo.toml  # Revert to v5
   ```

2. **Deploy to Aleph Zero testnet** (larger size limits)
   ```bash
   cargo contract instantiate \
     --constructor new \
     --args "..." \
     --url wss://testnet.azero.fans
   ```

3. **Keep Paseo in frontend as option**
   - Users can still select Paseo network
   - Document: "Contracts coming soon to Paseo"
   - Show roadmap for v6 migration

4. **Deploy and iterate**
   - Get working version deployed NOW
   - Test with real users
   - Migrate to v6 later when it's stable

**This gets you deployed in 30 minutes** vs **3 days of risky migration**.

---

## When to Migrate to v6

**Wait for v6 if:**
- ✅ v6 reaches stable release (not alpha)
- ✅ Testnets officially support v6
- ✅ Wallet extensions support H160
- ✅ Clear migration guides available
- ✅ Other projects successfully migrated
- ✅ You have 1-2 weeks for thorough testing

**Migrate now only if:**
- You have specific v6 features you need
- Your hackathon requires latest tech
- You have experienced ink! team
- You have 3+ days dedicated time
- You have budget for extensive testing

---

## Success Criteria

### Migration is successful when:

- [ ] ✅ Contract compiles with 0 errors
- [ ] ✅ All 34 unit tests pass
- [ ] ✅ Contract deploys to testnet
- [ ] ✅ Frontend connects successfully
- [ ] ✅ Can create escrow from UI
- [ ] ✅ Can complete milestone from UI
- [ ] ✅ Can release funds from UI
- [ ] ✅ Events display correctly
- [ ] ✅ All addresses show correctly
- [ ] ✅ Wallet signatures work
- [ ] ✅ Gas costs acceptable
- [ ] ✅ No user-facing errors
- [ ] ✅ Performance acceptable
- [ ] ✅ Security audit clean
- [ ] ✅ Documentation updated

### Migration fails if:

- ❌ Still can't deploy (size limits)
- ❌ Wallet integration broken
- ❌ Signatures don't verify
- ❌ Frontend unusable
- ❌ Data loss or corruption
- ❌ Security vulnerabilities
- ❌ Excessive gas costs
- ❌ Poor user experience

---

## Getting Help

### Resources:

- **ink! v6 Docs**: https://use.ink/docs/v6/ (limited)
- **GitHub Discussions**: https://github.com/use-ink/ink/discussions
- **Substrate Stack Exchange**: https://substrate.stackexchange.com/
- **Polkadot Forum**: https://forum.polkadot.network/
- **Discord**: ink! Smart Contracts channel

### Questions to Ask:

1. "Has anyone migrated large contracts to v6?"
2. "Which testnets support ink! v6?"
3. "How to handle SS58 ↔ H160 conversion?"
4. "Best practices for v6 wallet integration?"
5. "Known issues with v6 alpha?"

---

## Final Decision Matrix

| Factor | Stay v5 | Migrate v6 |
|--------|---------|------------|
| **Time Available** | < 3 days ✅ | 3+ days |
| **Risk Tolerance** | Low ✅ | High |
| **Testnet** | Aleph/Rococo ✅ | Paseo? |
| **Deadline** | Urgent ✅ | Flexible |
| **Experience** | Learning ✅ | Expert |
| **Resources** | Solo ✅ | Team |
| **Requirement** | Working demo ✅ | Latest tech |

**If most checkmarks in "Stay v5" column → DO NOT MIGRATE**

---

## Conclusion

This migration is **comprehensive but risky**. The 71 compile errors are just the beginning - the real challenge is frontend integration, wallet compatibility, and ensuring a smooth user experience.

**Recommendation**: Unless you have a specific requirement for v6 features or 3+ days of dedicated time, **stay on v5** and deploy to a testnet with higher size limits (Aleph Zero, Rococo, etc.).

The goal is to get a working product deployed for your hackathon reviewers, not to use the bleeding-edge technology. You can always migrate to v6 later when it's stable and you have more time.

---

## Document Version

- **Version**: 1.0
- **Date**: 2025-10-27
- **Author**: Migration Planning
- **Status**: Complete Checklist
- **Target**: ink! v5 → v6 migration for .escrow project

---

## Updates Log

| Date | Change | Reason |
|------|--------|--------|
| 2025-10-27 | Initial creation | Complete migration checklist |
| - | - | - |

---

**Good luck with your decision! 🚀**
