# Frontend-to-Contract Integration Guide

**Milestone 2 Assurance Documentation**

This document provides a complete mapping of how the React frontend integrates with the ink! smart contract, ensuring developers understand the exact flow of data between the UI and blockchain layers.

## Overview

The `.escrow` platform uses a sophisticated integration pattern where:
- **Frontend**: React 18 with TypeScript, Chakra UI
- **Blockchain Integration**: Polkadot.js API with ink! contract interactions
- **Smart Contract**: ink! (Rust) deployed on Polkadot ecosystem
- **Token Integration**: PSP22-compliant USDT for payments

## Integration Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React UI      │◄──►│  Integration     │◄──►│  Smart Contract │
│   Components    │    │  Layer           │    │  (ink!)         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
│                      │                       │
│ • Dashboard          │ • useEscrowContract   │ • create_escrow
│ • CreateEscrow       │ • escrowContractUtils │ • list_escrows
│ • MilestoneTracking  │ • Polkadot.js API    │ • release_milestone
│ • DisputeResolution  │ • Event handling      │ • dispute_milestone
└──────────────────────┴───────────────────────┴─────────────────────
```

## Contract Configuration

**Contract Address**: `5CTJADbtMjtsWSFTNMq7vTkAcY5rUArZdvFpQkuDRoGTEggz`
**Network**: Polkadot Substrate (Westend testnet for development)
**Token**: PSP22-compliant USDT
**ABI Location**: `frontend/src/contractABI/EscrowABI.json`

## Core Frontend-to-Contract Method Mappings

### 1. Create Escrow Flow

**Frontend Call:**
```typescript
// File: frontend/src/hooks/useEscrowContract.ts:249-310
const createEscrow = async (
  creatorAddress: string,
  counterpartyAddress: string,
  counterpartyType: string,
  status: string,
  title: string,
  description: string,
  totalAmount: string,
  milestones: Milestone[],
  transactionHash?: string
) => {
  const result = await createEscrowContract(
    api, account, creatorAddress, counterpartyAddress,
    counterpartyType, status, title, description,
    totalAmount, milestones, transactionHash
  );
}
```

**Contract Integration:**
```typescript
// File: frontend/src/utils/escrowContractUtils.ts:188-406
export const createEscrowContract = async (
  api: any,
  account: InjectedAccountWithMeta,
  // ... parameters
) => {
  const contract = new ContractPromise(api, ESCROW_CONTRACT_ABI, ESCROW_CONTRACT_ADDRESS);

  const tx = contract.tx.createEscrow(
    {
      gasLimit: estimatedGas,
      storageDepositLimit: null,
    },
    counterpartyAccountId,      // AccountId
    counterpartyType,           // String
    status,                     // String
    title,                      // String
    description,                // String
    totalAmount,                // String
    contractMilestones,         // Vec<Milestone>
    transactionHash             // Option<String>
  );
}
```

**Smart Contract Method:**
```rust
// File: contracts/escrow/src/lib.rs:315-384
#[ink(message)]
pub fn create_escrow(
    &mut self,
    counterparty_address: AccountId,
    counterparty_type: String,
    status: String,
    title: String,
    description: String,
    total_amount: String,
    milestones: Vec<Milestone>,
    transaction_hash: Option<String>,
) -> Result<String, EscrowError>
```

**Data Flow:**
1. User fills form in `CreateEscrow` component
2. `useEscrowContract.createEscrow()` processes form data
3. `createEscrowContract()` converts data to contract format
4. Polkadot.js sends transaction to blockchain
5. Contract emits `EscrowCreated` event
6. Frontend updates UI with new escrow ID

---

### 2. List Escrows Flow

**Frontend Call:**
```typescript
// File: frontend/src/hooks/useEscrowContract.ts:470-497
const listEscrows = async () => {
  const result = await listEscrowsContract(api, account);
  return {
    success: true,
    escrows: result.data || []
  };
}
```

**Contract Integration:**
```typescript
// File: frontend/src/utils/escrowContractUtils.ts:535-700
export const listEscrowsContract = async (
  api: any,
  account: InjectedAccountWithMeta
) => {
  const result = await contract.query.listEscrows(
    account.address,
    {
      gasLimit: estimatedGas,
      storageDepositLimit: null,
    }
  );

  // Transform blockchain data to frontend format
  const transformedData = escrowsData.map((escrowData: any) => ({
    id: escrowData.id,
    creatorAddress: escrowData.creator_address,
    counterpartyAddress: escrowData.counterparty_address,
    title: escrowData.title,
    totalAmount: escrowData.total_amount,
    status: escrowData.status,
    milestones: escrowData.milestones?.map(transformMilestone),
    // ... more fields
  }));
}
```

**Smart Contract Method:**
```rust
// File: contracts/escrow/src/lib.rs:503-518
#[ink(message)]
pub fn list_escrows(&self) -> Result<Vec<EscrowData>, EscrowError>
```

**Data Flow:**
1. `Dashboard` component calls `listEscrows()` on mount
2. Query executes against user's associated escrows
3. Raw blockchain data gets transformed to frontend format
4. Dashboard renders escrow cards with transformed data

---

### 3. Release Milestone Flow

**Frontend Call:**
```typescript
// File: frontend/src/hooks/useEscrowContract.ts:502-542
const releaseMilestone = async (escrowId: string, milestoneId: string) => {
  const result = await releaseMilestoneContract(
    api, account, escrowId, milestoneId
  );

  return {
    success: true,
    transactionHash: result.transactionHash,
    data: result.data
  };
}
```

**Contract Integration:**
```typescript
// File: frontend/src/utils/escrowContractUtils.ts:1206-1330
export const releaseMilestoneContract = async (
  api: any,
  account: InjectedAccountWithMeta,
  escrowId: string,
  milestoneId: string
) => {
  const tx = contract.tx.releaseMilestone(
    {
      gasLimit: estimatedGas,
      storageDepositLimit: null,
    },
    escrowId,     // String
    milestoneId   // String
  );

  // Handle transaction result and extract release data
  return new Promise((resolve) => {
    tx.signAndSend(account.address, (result) => {
      if (result.status.isFinalized) {
        resolve({
          success: true,
          transactionHash: result.txHash.toHex(),
          data: {
            txHash: result.txHash.toHex(),
            blockHash: result.status.asFinalized?.toHex(),
            releaseData: null // populated when event parsing is extended
          }
        });
      }
    });
  });
}
```

**Smart Contract Method:**
```rust
// File: contracts/escrow/src/lib.rs:616-717
#[ink(message)]
pub fn release_milestone(
    &mut self,
    escrow_id: String,
    milestone_id: String,
) -> Result<ReleaseResponse, EscrowError>
```

**Data Flow:**
1. Client clicks "Release Funds" in milestone card
2. `ReleaseMilestoneModal` calls `releaseMilestone()`
3. Smart contract validates authorization and balance
4. USDT tokens transfer to service provider
5. Platform fee transferred to fee account
6. `MilestoneReleased` event emitted
7. UI updates milestone status to "Funded"

---

### 4. Notify Deposit Flow

**Frontend Call:**
```typescript
// File: frontend/src/hooks/useEscrowContract.ts (not directly exposed but used internally)
// This flow happens after USDT transfer to contract
```

**Contract Integration:**
```typescript
// File: frontend/src/utils/escrowContractUtils.ts:1335-1438
export const notifyDepositContract = async (
  api: any,
  account: InjectedAccountWithMeta,
  escrowId: string,
  amount: string
) => {
  const tx = contract.tx.notifyDeposit(
    {
      gasLimit: estimatedGas,
      storageDepositLimit: null,
    },
    escrowId,  // String
    amount     // String (human-readable, e.g., "1000.50")
  );
}
```

**Smart Contract Method:**
```rust
// File: contracts/escrow/src/lib.rs:524-554
#[ink(message)]
pub fn notify_deposit(
    &mut self,
    escrow_id: String,
    amount_str: String,
) -> Result<Balance, EscrowError>
```

**Data Flow:**
1. User transfers USDT to contract address externally
2. Frontend calls `notify_deposit` to register the deposit
3. Contract parses amount and updates escrow deposit ledger
4. Frontend can now enable milestone release functionality

---

### 5. Dispute Milestone Flow

**Frontend Call:**
```typescript
// File: frontend/src/hooks/useEscrowContract.ts:545-586
const disputeMilestone = async (
  escrowId: string,
  milestoneId: string,
  reason: string,
  filedBy: string,
  filedByRole: string,
  status: string
) => {
  const result = await disputeMilestoneContract(
    api, account, escrowId, milestoneId, reason
  );

  return {
    success: true,
    escrowId: escrowId,
    transactionHash: result.transactionHash
  };
}
```

**Contract Integration:**
```typescript
// File: frontend/src/utils/escrowContractUtils.ts:1009-1114
export const disputeMilestoneContract = async (
  api: any,
  account: InjectedAccountWithMeta,
  escrowId: string,
  milestoneId: string,
  reason: string
) => {
  const tx = contract.tx.disputeMilestone(
    {
      gasLimit: estimatedGas,
      storageDepositLimit: null,
    },
    escrowId,     // String
    milestoneId,  // String
    reason        // String
  );
}
```

**Smart Contract Method:**
```rust
// File: contracts/escrow/src/lib.rs:775-826
#[ink(message)]
pub fn dispute_milestone(
    &mut self,
    escrow_id: String,
    milestone_id: String,
    reason: String,
) -> Result<DisputeResponse, EscrowError>
```

**Data Flow:**
1. User clicks "Dispute" in milestone card
2. `DisputeMilestoneModal` collects dispute reason
3. Frontend calls `disputeMilestone()` with reason
4. Contract updates milestone status to "Disputed"
5. `MilestoneDisputed` event emitted with dispute ID
6. UI shows dispute status and reason

---

### 6. Complete Milestone Task Flow

**Frontend Call:**
```typescript
// File: frontend/src/hooks/useEscrowContract.ts:589-630
const completeMilestoneTask = async (
  escrowId: string,
  milestoneId: string,
  note: string,
  fileUrls: string[]
) => {
  const result = await completeMilestoneTaskContract(
    api, account, escrowId, milestoneId, note, fileUrls
  );

  return {
    success: true,
    transactionHash: result.transactionHash,
    data: result.data
  };
}
```

**Contract Integration:**
```typescript
// File: frontend/src/utils/escrowContractUtils.ts:1117-1204
export const completeMilestoneTaskContract = async (
  api: any,
  account: InjectedAccountWithMeta,
  escrowId: string,
  milestoneId: string,
  completionNote: string,
  evidenceData?: any[]
) => {
  const tx = contract.tx.completeMilestoneTask(
    {
      gasLimit: estimatedGas,
      storageDepositLimit: null,
    },
    escrowId,         // String
    milestoneId,      // String
    completionNote,   // String
    evidenceData      // Option<Vec<Evidence>>
  );
}
```

**Smart Contract Method:**
```rust
// File: contracts/escrow/src/lib.rs:557-613
#[ink(message)]
pub fn complete_milestone_task(
    &mut self,
    escrow_id: String,
    milestone_id: String,
    completion_note: Option<String>,
    evidence_file: Option<Vec<Evidence>>,
) -> Result<(), EscrowError>
```

**Data Flow:**
1. Service provider completes work
2. `CompleteMilestoneModal` collects completion note and evidence
3. Frontend calls `completeMilestoneTask()`
4. Contract updates milestone status to "Done"
5. Client can now review and release funds
6. `MilestoneTaskDone` event emitted

---

## Multi-Signature Governance Integration

### 7. Admin Proposal Management

**Frontend Component**: `AdminDashboard`, `ProposalManager`

```typescript
// Submit governance proposal
async function submitProposal(action: ProposalAction): Promise<{ success: boolean; proposalId?: number; error?: string }> {
  try {
    const result = await contract.tx.submitProposal(action)
      .signAndSend(account, { signer });

    return {
      success: true,
      proposalId: result.events.find(e => e.event.section === 'EscrowContract')?.event.data.proposalId
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Approve existing proposal
async function approveProposal(proposalId: number): Promise<{ success: boolean; error?: string }> {
  try {
    await contract.tx.approveProposal(proposalId)
      .signAndSend(account, { signer });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

**Contract Methods Used:**
- `submit_proposal(action: ProposalAction) -> Result<u64, EscrowError>`
- `approve_proposal(proposal_id: u64) -> Result<(), EscrowError>`
- `execute_proposal(proposal_id: u64) -> Result<(), EscrowError>`

### 8. Admin Information Queries

**Frontend Component**: `AdminDashboard`, `GovernancePanel`

```typescript
// Get current admin signers
async function getAdminSigners(): Promise<string[]> {
  const result = await contract.query.getAdminSigners();
  return result.output?.toHuman() || [];
}

// Get signature threshold
async function getSignatureThreshold(): Promise<number> {
  const result = await contract.query.getSignatureThreshold();
  return result.output?.toNumber() || 1;
}

// Get proposal details
async function getProposal(proposalId: number): Promise<AdminProposal | null> {
  const result = await contract.query.getProposal(proposalId);
  return result.output?.toHuman() || null;
}

// Check if account is admin signer
async function isAdminSigner(account: string): Promise<boolean> {
  const result = await contract.query.isAdminSigner(account);
  return result.output?.toHuman() || false;
}
```

**Contract Methods Used:**
- `get_admin_signers() -> Vec<AccountId>`
- `get_signature_threshold() -> u8`
- `get_proposal(proposal_id: u64) -> Option<AdminProposal>`
- `get_proposal_counter() -> u64`
- `is_admin_signer(account: AccountId) -> bool`

### 9. Governance Event Handling

**Frontend Component**: Event subscription service

```typescript
// Subscribe to governance events
function subscribeToGovernanceEvents() {
  api.query.system.events((events) => {
    events.forEach((record) => {
      const { event } = record;

      if (event.section === 'EscrowContract') {
        switch (event.method) {
          case 'ProposalCreated':
            handleProposalCreated(event.data);
            break;
          case 'ProposalApproved':
            handleProposalApproved(event.data);
            break;
          case 'ProposalExecuted':
            handleProposalExecuted(event.data);
            break;
          case 'AdminSignerAdded':
            handleSignerAdded(event.data);
            break;
          case 'AdminSignerRemoved':
            handleSignerRemoved(event.data);
            break;
          case 'ThresholdChanged':
            handleThresholdChanged(event.data);
            break;
        }
      }
    });
  });
}
```

**Contract Events Emitted:**
- `ProposalCreated { proposal_id: u64, action: ProposalAction, created_by: AccountId }`
- `ProposalApproved { proposal_id: u64, approved_by: AccountId, approvals_count: u8 }`
- `ProposalExecuted { proposal_id: u64, executed_by: AccountId }`
- `AdminSignerAdded { signer: AccountId, added_by: AccountId }`
- `AdminSignerRemoved { signer: AccountId, removed_by: AccountId }`
- `ThresholdChanged { old_threshold: u8, new_threshold: u8, changed_by: AccountId }`

### 10. Proposal Action Types

```typescript
// Frontend proposal action type mapping
enum ProposalAction {
  SetFee = 'SetFee',
  SetUsdtToken = 'SetUsdtToken',
  SetTokenDecimals = 'SetTokenDecimals',
  AddSigner = 'AddSigner',
  RemoveSigner = 'RemoveSigner',
  SetThreshold = 'SetThreshold',
  PauseContract = 'PauseContract',
  UnpauseContract = 'UnpauseContract',
  EmergencyWithdraw = 'EmergencyWithdraw'
}

// Frontend to contract proposal action conversion
function convertProposalAction(action: ProposalAction, params?: any) {
  switch (action) {
    case ProposalAction.SetFee:
      return { SetFee: params.feeBps };
    case ProposalAction.SetUsdtToken:
      return { SetUsdtToken: params.tokenAddress };
    case ProposalAction.AddSigner:
      return { AddSigner: params.signerAddress };
    // ... other actions
  }
}
```

---

## Data Type Transformations

### Frontend ↔ Contract Type Mapping

| Frontend Type | Contract Type | Notes |
|---------------|---------------|-------|
| `string` (escrowId) | `String` | Unique identifier like "escrow_1" |
| `string` (address) | `AccountId` | Polkadot SS58 format |
| `string` (amount) | `String` | Human-readable like "1000.50" |
| `Milestone[]` | `Vec<Milestone>` | Array of milestone structs |
| `'Active' \| 'Completed'` | `EscrowStatus` | Enum matching exactly |
| `number` (timestamp) | `u64` | Milliseconds since epoch |

### Amount Conversion Logic

**Frontend to Contract:**
```typescript
// Human-readable amounts (e.g., "1000.50") sent directly as strings
// Contract handles conversion to base units internally using token decimals
const amount = "1000.50"; // $1000.50 USDT
```

**Contract Processing:**
```rust
// File: contracts/escrow/src/lib.rs:914-964
fn parse_amount_to_base_units(&self, amount_str: &str) -> Result<Balance, ()> {
    // Converts "1000.50" to 1000500000 (6 decimal places for USDT)
    let decimals = self.token_decimals as usize; // 6 for USDT
    // Math to convert human-readable to blockchain base units
}
```

---

## Error Handling Patterns

### Frontend Error Handling
```typescript
// File: frontend/src/hooks/useEscrowContract.ts:304-309
try {
  const result = await createEscrowContract(/* ... */);
  if (result.success) {
    return { success: true, escrowId: result.escrowId };
  } else {
    return { success: false, error: result.error };
  }
} catch (error) {
  return { success: false, error: error.message };
}
```

### Contract Error Types
```rust
// File: contracts/escrow/src/lib.rs:66-82
pub enum EscrowError {
    Unauthorized,           // Caller not authorized for this action
    EscrowNotFound,        // Escrow ID doesn't exist
    MilestoneNotFound,     // Milestone ID doesn't exist in escrow
    InvalidStatus,         // Invalid status transition
    ContractPaused,        // Contract operations paused by owner
    InsufficientBalance,   // Not enough USDT balance
    TokenTransferFailed,   // PSP22 transfer failed
    // ... more error types
}
```

---

## Event Handling

### Contract Events → Frontend Updates

**Event Emission (Contract):**
```rust
// File: contracts/escrow/src/lib.rs:373-381
self.env().emit_event(EscrowCreated {
    escrow_id: escrow_id.clone(),
    creator: caller,
    counterparty: counterparty_address,
    title: title,
    total_amount: total_amount,
    transaction_hash: transaction_hash,
});
```

**Event Listening (Frontend):**
```typescript
// File: frontend/src/utils/escrowContractUtils.ts:308-352
tx.signAndSend(account.address, (result) => {
  if (result.events) {
    result.events.forEach(({ event }) => {
      if (event.section === 'contracts' && event.method === 'ContractEmitted') {
        // Extract escrow ID from EscrowCreated event
        const escrowId = extractEscrowIdFromEvent(event);
      }
    });
  }
});
```

---

## Security & Authorization Patterns

### Frontend Authorization Check
```typescript
// File: frontend/src/hooks/useEscrowContract.ts:426-428
if (caller != escrow.creator_address && caller != escrow.counterparty_address) {
    return { success: false, error: signerResult.error };
}
```

### Contract Authorization Check
```rust
// File: contracts/escrow/src/lib.rs:426-428
if caller != escrow.creator_address && caller != escrow.counterparty_address {
    return Err(EscrowError::Unauthorized);
}
```

---

## Transaction Status Monitoring

### Frontend Transaction Tracking
```typescript
// File: frontend/src/hooks/useEscrowContract.ts:86-246
const checkTransactionStatus = async (transactionHash: string) => {
  // Search recent blocks for transaction
  // Check finalization status
  // Return transaction receipt with confirmation count
}
```

### Usage in Components
```typescript
// After transaction submission
const txResult = await releaseMilestone(escrowId, milestoneId);
if (txResult.success) {
  const status = await checkTransactionStatus(txResult.transactionHash);
  // Update UI based on transaction status
}
```

---

## Testing Integration Points

### Frontend Integration Tests
```typescript
// File: frontend/src/test/hooks/useEscrowContract.test.ts
// File: frontend/src/test/utils/escrowContractUtils.test.ts
describe('Contract Integration', () => {
  it('should create escrow with proper data transformation', async () => {
    // Test frontend data → contract format transformation
  });

  it('should handle contract errors gracefully', async () => {
    // Test error handling and user feedback
  });
});
```

### Contract Integration Tests
```rust
// File: contracts/escrow/src/lib.rs:1430-1755
#[ink::test]
fn test_complete_escrow_creation_and_milestone_flow() {
    // Test full escrow lifecycle
    // Verify data consistency
    // Test error conditions
}
```

---

## Development & Deployment Checklist

### Pre-Deployment Validation
- [ ] Contract ABI matches frontend interface expectations
- [ ] All frontend methods have corresponding contract methods
- [ ] Error types are properly handled in frontend
- [ ] Event parsing works correctly
- [ ] Amount conversion logic tested with various inputs
- [ ] Authorization checks work on both layers

### Integration Testing
- [ ] End-to-end escrow creation flow
- [ ] Milestone progression through all states
- [ ] Error scenarios (unauthorized, insufficient balance, etc.)
- [ ] Event emission and frontend updates
- [ ] Transaction status monitoring

### Production Considerations
- [ ] Contract address configuration
- [ ] Gas limit optimization
- [ ] Error message user-friendliness
- [ ] Transaction retry logic
- [ ] Network failure handling

---

## Troubleshooting Common Issues

### Issue: "Transaction Failed" Error
**Frontend Check:**
- Verify account has sufficient balance for gas
- Check contract address is correct
- Ensure proper signer attachment

**Contract Check:**
- Verify caller authorization
- Check contract isn't paused
- Validate input parameters

### Issue: "Amount Parsing Error"
**Resolution:**
- Ensure amounts are strings (not numbers)
- Use proper decimal format ("1000.50", not "1,000.50")
- Check token decimals configuration matches USDT (6 decimals)

### Issue: "Event Not Detected"
**Resolution:**
- Verify contract address in event filtering
- Check event ABI definitions match contract
- Ensure transaction is finalized before reading events

---

## Future Enhancement Opportunities

1. **Batch Operations**: Support multiple milestone releases in single transaction
2. **Gasless Transactions**: Implement meta-transactions for better UX
3. **Event Caching**: Cache and sync events for offline functionality
4. **Cross-Chain Support**: Extend to multiple Polkadot parachains
5. **Advanced Error Recovery**: Automatic transaction retry with escalating gas

---

*This document serves as the definitive integration reference for Milestone 2 delivery and ongoing development.*