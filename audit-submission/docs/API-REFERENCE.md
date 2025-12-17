# 📚 .escrow Smart Contract API Reference

Complete documentation for the `.escrow` ink! smart contract API with milestone-based escrow functionality.

## 📝 **Contract Overview**

The `.escrow` contract provides decentralized escrow services with milestone tracking, multi-signature governance, and USDT token integration. All transactions are recorded on-chain with comprehensive event logging.

**🔑 Important:** This contract uses **H160 (20-byte) addresses** instead of AccountId (32-byte) to ensure compatibility with Pop Network's pallet-revive (EVM-compatible) environment. All addresses follow the Ethereum-style `0x...` format.

## 🏗️ **Core Data Structures**

### **EscrowData**
Primary structure containing all escrow information.

```rust
pub struct EscrowData {
    pub id: String,                          // Unique escrow identifier
    pub creator_address: Address,            // Escrow creator (H160/20-byte)
    pub counterparty_address: Address,       // Counterparty (H160/20-byte)
    pub counterparty_type: String,           // Role of counterparty
    pub title: String,                       // Escrow title
    pub description: String,                 // Detailed description
    pub total_amount: String,                // Total amount (string for frontend compatibility)
    pub status: EscrowStatus,                // Current status
    pub created_at: u64,                     // Creation timestamp
    pub milestones: Vec<Milestone>,          // Payment milestones
    pub transaction_hash: Option<String>,    // Associated transaction
}
```

### **MilestoneInput**
Input structure for creating milestones (accepts strings for easier frontend integration).

```rust
pub struct MilestoneInput {
    pub id: String,                          // Unique milestone ID
    pub description: String,                 // Milestone description
    pub amount: String,                      // Amount as string
    pub status: String,                      // Status as string (e.g., "Pending", "InProgress")
    pub deadline: u64,                       // Deadline timestamp
    pub completed_at: Option<u64>,           // Completion timestamp
    pub dispute_reason: Option<String>,      // Reason if disputed
    pub dispute_filed_by: Option<Address>,   // Who filed dispute (H160/20-byte)
    pub completion_note: Option<String>,     // Completion notes
    pub evidence_file: Option<Vec<String>>,  // Evidence URLs (converted to Evidence structs)
}
```

### **Milestone**
Internal milestone structure (used by contract storage).

```rust
pub struct Milestone {
    pub id: String,                          // Unique milestone ID
    pub description: String,                 // Milestone description
    pub amount: String,                      // Amount for this milestone
    pub status: MilestoneStatus,             // Current status (enum)
    pub deadline: u64,                       // Deadline timestamp
    pub completed_at: Option<u64>,           // Completion timestamp
    pub dispute_reason: Option<String>,      // Reason if disputed
    pub dispute_filed_by: Option<Address>,   // Who filed dispute (H160/20-byte)
    pub completion_note: Option<String>,     // Completion notes
    pub evidence_file: Option<Vec<Evidence>>, // Supporting evidence
}
```

### **Status Enums**

```rust
pub enum EscrowStatus {
    Active,     // Escrow is live
    Completed,  // Successfully completed
    Disputed,   // Under dispute
    Cancelled,  // Cancelled by parties
    Inactive,   // Not active
    Pending,    // Awaiting activation
    Rejected,   // Rejected
}

pub enum MilestoneStatus {
    Pending,    // Not started
    InProgress, // Work ongoing
    Completed,  // Work done
    Done,       // Finalized
    Funded,     // Payment made
    Disputed,   // Under dispute
    Overdue,    // Past deadline
}
```

## 🔧 **Constructor**

### **new**
Creates a new escrow contract instance.

```rust
#[ink(constructor)]
pub fn new(
    usdt_token: Address,       // USDT token contract (H160/20-byte)
    fee_account: Address       // Fee recipient (H160/20-byte)
) -> Self
```

**Default Values:**
- `fee_bps`: 100 (1% platform fee)
- `signature_threshold`: 1
- `admin_signers`: Caller is added as first admin
- `token_decimals`: 6 (USDT standard)

## 📋 **Core Functions**

### **create_escrow**
Creates a new milestone-based escrow.

```rust
#[ink(message)]
pub fn create_escrow(
    &mut self,
    counterparty_address: Address,           // H160/20-byte address
    counterparty_type: String,
    status: String,                          // String: "Active", "Pending", etc.
    title: String,
    description: String,
    total_amount: String,
    milestones_input: Vec<MilestoneInput>,   // Uses MilestoneInput (strings)
    transaction_hash: Option<String>
) -> Result<String, EscrowError>
```

**Returns:** Unique escrow ID (e.g., "escrow_1")

**Events:** `EscrowCreated`

**Note:** The contract automatically converts `MilestoneInput` (with string status/evidence URLs) to internal `Milestone` structs.

### **notify_deposit**
Notifies the contract of a USDT deposit to an escrow.

```rust
#[ink(message)]
pub fn notify_deposit(
    &mut self,
    escrow_id: String,
    amount_str: String
) -> Result<Balance, EscrowError>
```

**Returns:** Updated total deposited amount in base units

**Requirements:**
- Caller must have transferred USDT to contract beforehand
- Contract verifies token balance before accepting deposit
- Amount is specified as human-readable string (e.g., "1000" for 1000 USDT)

### **release_milestone**
Releases funds for a completed milestone.

```rust
#[ink(message)]
pub fn release_milestone(
    &mut self,
    escrow_id: String,
    milestone_id: String
) -> Result<ReleaseResponse, EscrowError>
```

**Authorization:** Creator or counterparty (based on role)

**Returns:**
```rust
pub struct ReleaseResponse {
    pub transaction_hash: String,
    pub status: String,
    pub message: String,
    pub receiver_account_id: Address,    // H160/20-byte address
    pub payer_account_id: Address,       // H160/20-byte address
}
```

### **complete_milestone_task**
Marks a milestone as completed by the counterparty (provider).

```rust
#[ink(message)]
pub fn complete_milestone_task(
    &mut self,
    escrow_id: String,
    milestone_id: String,
    completion_note: Option<String>,
    evidence_file: Option<Vec<Evidence>>
) -> Result<(), EscrowError>
```

**Authorization:** Only the counterparty can mark milestones as done
**Status Change:** InProgress → Done

## 🔍 **Query Functions**

### **get_escrow**
Retrieves escrow details by ID.

```rust
#[ink(message)]
pub fn get_escrow(&self, escrow_id: String) -> Result<EscrowData, EscrowError>
```

### **list_escrows**
Lists all escrows for the caller.

```rust
#[ink(message)]
pub fn list_escrows(&self) -> Result<Vec<EscrowData>, EscrowError>
```

### **get_escrow_milestone**
Gets specific milestone details.

```rust
#[ink(message)]
pub fn get_escrow_milestone(
    &self,
    escrow_id: String,
    milestone_id: String
) -> Result<Milestone, EscrowError>
```

### **get_token_balance**
Returns the total USDT balance held by the contract.

```rust
#[ink(message)]
pub fn get_token_balance(&self) -> Balance
```

**Note:** Use this to verify the contract has sufficient funds before releasing milestones.

## 🔄 **Status Management**

### **update_escrow_status**
Updates the overall escrow status.

```rust
#[ink(message)]
pub fn update_escrow_status(
    &mut self,
    escrow_id: String,
    new_status: String,
    transaction_hash: Option<String>
) -> Result<EscrowData, EscrowError>
```

### **update_escrow_milestone_status**
Updates a specific milestone's status.

```rust
#[ink(message)]
pub fn update_escrow_milestone_status(
    &mut self,
    escrow_id: String,
    milestone: Milestone,
    new_status: String
) -> Result<EscrowData, EscrowError>
```

## 🚨 **Dispute Resolution**

### **dispute_milestone**
Raises a dispute for a milestone.

```rust
#[ink(message)]
pub fn dispute_milestone(
    &mut self,
    escrow_id: String,
    milestone_id: String,
    reason: String
) -> Result<DisputeResponse, EscrowError>
```

### **resolve_dispute**
Resolves an existing dispute (admin only).

```rust
#[ink(message)]
pub fn resolve_dispute(
    &mut self,
    escrow_id: String,
    milestone_id: String,
    resolution: String,
    release_to_provider: bool
) -> Result<EscrowData, EscrowError>
```

## ⚙️ **Configuration Functions**

### **get_usdt_token**
Returns the configured USDT token contract address.

```rust
#[ink(message)]
pub fn get_usdt_token(&self) -> Address
```

### **get_token_config**
Returns token configuration tuple.

```rust
#[ink(message)]
pub fn get_token_config(&self) -> (Address, u8, u16)
```

**Returns:** (usdt_token_address, token_decimals, fee_bps)

### **get_contract_info**
Returns comprehensive contract information.

```rust
#[ink(message)]
pub fn get_contract_info(&self) -> (Address, u16, bool, u128)
```

**Returns:** (owner, fee_bps, paused, total_volume)

## 👑 **Multi-Signature Admin Functions**

### **create_admin_proposal**
Creates a new governance proposal.

```rust
#[ink(message)]
pub fn create_admin_proposal(
    &mut self,
    action: ProposalAction
) -> Result<u64, EscrowError>
```

**Proposal Actions:**
```rust
pub enum ProposalAction {
    SetFee(u16),                          // Change platform fee
    SetUsdtToken(Address),                // Update USDT contract (H160)
    SetTokenDecimals(u8),                 // Update token decimals
    AddSigner(Address),                   // Add admin signer (H160)
    RemoveSigner(Address),                // Remove admin signer (H160)
    SetThreshold(u8),                     // Change signature threshold
    PauseContract,                        // Pause operations
    UnpauseContract,                      // Resume operations
    EmergencyWithdraw(Address, Balance),  // Emergency withdrawal (H160)
}
```

### **approve_proposal**
Approves a pending proposal.

```rust
#[ink(message)]
pub fn approve_proposal(&mut self, proposal_id: u64) -> Result<(), EscrowError>
```

### **execute_proposal**
Executes an approved proposal.

```rust
#[ink(message)]
pub fn execute_proposal(&mut self, proposal_id: u64) -> Result<(), EscrowError>
```

## 📊 **Events**

### **EscrowCreated**
```rust
#[ink(event)]
pub struct EscrowCreated {
    pub escrow_id: String,
    pub creator: Address,                   // H160/20-byte address
    pub counterparty: Address,              // H160/20-byte address
    pub counterparty_type: String,
    pub title: String,
    pub total_amount: String,
    pub transaction_hash: Option<String>,
}
```

### **MilestoneReleased**
```rust
#[ink(event)]
pub struct MilestoneReleased {
    pub escrow_id: String,
    pub milestone_id: String,
    pub receiver_account_id: Address,       // H160/20-byte address
    pub payer_account_id: Address,          // H160/20-byte address
    pub amount: String,
    pub transaction_hash: String,
}
```

### **MilestoneDisputed**
```rust
#[ink(event)]
pub struct MilestoneDisputed {
    pub escrow_id: String,
    pub milestone_id: String,
    pub filed_by: Address,                  // H160/20-byte address
    pub reason: String,
    pub dispute_id: String,
}
```

## 🔗 **Integration Example**

### **JavaScript/TypeScript Frontend**
```javascript
import { ContractPromise } from '@polkadot/api-contract';

// Create escrow with milestones
const createEscrow = async () => {
  const milestones = [
    {
      id: "milestone_1",
      description: "Initial Design",
      amount: "1000",                    // Human-readable amount
      status: "Pending",                 // String status (not enum)
      deadline: Date.now() + 7 * 24 * 60 * 60 * 1000,
      completedAt: null,
      disputeReason: null,
      disputeFiledBy: null,
      completionNote: null,
      evidenceFile: ["https://example.com/design.pdf"], // URLs as strings
    }
  ];

  const result = await contract.tx.createEscrow(
    { value: 0, gasLimit: -1 },
    counterpartyAddress,               // H160 address (0x...)
    "provider",
    "Active",                          // String status
    "Website Development",
    "Full stack web application",
    "5000",                           // Human-readable total amount
    milestones,                       // MilestoneInput array
    null
  );

  return result;
};

// Release milestone payment
const releaseMilestone = async (escrowId, milestoneId) => {
  const result = await contract.tx.releaseMilestone(
    { value: 0, gasLimit: -1 },
    escrowId,
    milestoneId
  );

  console.log("Released:", result.output?.toHuman());
};
```

## ⚡ **Gas Limits**

| Operation | Recommended Gas |
|-----------|----------------|
| `create_escrow` | 100,000,000,000 |
| `deposit_to_escrow` | 50,000,000,000 |
| `release_milestone` | 50,000,000,000 |
| `mark_milestone_as_done` | 30,000,000,000 |
| `dispute_milestone` | 30,000,000,000 |
| Query functions | 10,000,000,000 |

## 🛡️ **Security Features**

1. **Multi-signature governance** for admin operations
2. **Authorization checks** on all state-changing functions
3. **Pause mechanism** for emergency situations
4. **Input validation** and proper error handling
5. **Event logging** for all critical operations
6. **Deadline enforcement** for milestone completion

## 🐛 **Error Types**

```rust
pub enum EscrowError {
    Unauthorized,          // Caller lacks permission
    EscrowNotFound,        // Invalid escrow ID
    MilestoneNotFound,     // Invalid milestone ID
    InvalidStatus,         // Invalid status transition
    ContractPaused,        // Contract is paused
    InsufficientBalance,   // Not enough tokens
    TokenTransferFailed,   // Transfer failed
    DeadlineExceeded,      // Past deadline
    AlreadyCompleted,      // Already done
    InvalidAmount,         // Amount mismatch
    DuplicateId,          // ID already exists
    FeeTooHigh,           // Fee exceeds limit
    TokenNotConfigured,    // USDT not set
}
```

## 📞 **Support**

For technical support or integration help:
- **GitHub**: [github.com/samuelarogbonlo/dot_escrow](https://github.com/samuelarogbonlo/dot_escrow)
- **Documentation**: [Full Documentation](https://github.com/samuelarogbonlo/dot_escrow/blob/main/README.md)

---

**Contract Version:** 1.0.0
**ink! Version:** 6.0.0-alpha (PolkaVM)
**Last Updated:** November 2025