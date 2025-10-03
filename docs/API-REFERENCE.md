# 📚 .escrow Smart Contract API Reference

Complete documentation for the `.escrow` ink! smart contract API with milestone-based escrow functionality.

## 📝 **Contract Overview**

The `.escrow` contract provides decentralized escrow services with milestone tracking, multi-signature governance, and USDT token integration. All transactions are recorded on-chain with comprehensive event logging.

## 🏗️ **Core Data Structures**

### **EscrowData**
Primary structure containing all escrow information.

```rust
pub struct EscrowData {
    pub id: String,                          // Unique escrow identifier
    pub creator_address: AccountId,          // Escrow creator
    pub counterparty_address: AccountId,     // Counterparty (provider/client)
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

### **Milestone**
Individual payment milestone structure.

```rust
pub struct Milestone {
    pub id: String,                          // Unique milestone ID
    pub description: String,                 // Milestone description
    pub amount: String,                      // Amount for this milestone
    pub status: MilestoneStatus,             // Current status
    pub deadline: u64,                       // Deadline timestamp
    pub completed_at: Option<u64>,           // Completion timestamp
    pub dispute_reason: Option<String>,      // Reason if disputed
    pub dispute_filed_by: Option<AccountId>, // Who filed dispute
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
    fee_bps: u16,              // Platform fee in basis points (100 = 1%)
    fee_account: AccountId,    // Fee recipient
    usdt_token: AccountId,     // USDT token contract
    admin_signers: Vec<AccountId>, // Multi-sig admins
    signature_threshold: u8    // Required signatures
) -> Self
```

## 📋 **Core Functions**

### **create_escrow**
Creates a new milestone-based escrow.

```rust
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
    transaction_hash: Option<String>
) -> Result<String, EscrowError>
```

**Returns:** Unique escrow ID (e.g., "escrow_1")

**Events:** `EscrowCreated`

### **deposit_to_escrow**
Deposits USDT tokens into an escrow.

```rust
#[ink(message)]
pub fn deposit_to_escrow(
    &mut self,
    escrow_id: String,
    amount: Balance
) -> Result<(), EscrowError>
```

**Requirements:**
- Caller must have approved USDT spending
- Amount must match expected escrow total

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
    pub receiver_address: AccountId,
    pub payer_address: AccountId,
}
```

### **mark_milestone_as_done**
Marks a milestone as completed by the provider.

```rust
#[ink(message)]
pub fn mark_milestone_as_done(
    &mut self,
    escrow_id: String,
    milestone_id: String,
    completion_note: Option<String>,
    evidence: Option<Vec<Evidence>>
) -> Result<EscrowData, EscrowError>
```

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

### **get_deposited_amount**
Returns total deposited amount for an escrow.

```rust
#[ink(message)]
pub fn get_deposited_amount(&self, escrow_id: String) -> Balance
```

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

### **get_fee_percentage**
Returns current fee as a percentage string.

```rust
#[ink(message)]
pub fn get_fee_percentage(&self) -> String
```

### **get_total_volume**
Returns total platform volume processed.

```rust
#[ink(message)]
pub fn get_total_volume(&self) -> String
```

### **is_paused**
Check if contract is paused.

```rust
#[ink(message)]
pub fn is_paused(&self) -> bool
```

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
    SetUsdtToken(AccountId),              // Update USDT contract
    AddSigner(AccountId),                 // Add admin signer
    RemoveSigner(AccountId),              // Remove admin signer
    SetThreshold(u8),                     // Change signature threshold
    PauseContract,                        // Pause operations
    UnpauseContract,                      // Resume operations
    EmergencyWithdraw(AccountId, Balance), // Emergency withdrawal
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
    escrow_id: String,
    creator: AccountId,
    counterparty: AccountId,
    title: String,
    total_amount: String,
}
```

### **MilestoneReleased**
```rust
#[ink(event)]
pub struct MilestoneReleased {
    escrow_id: String,
    milestone_id: String,
    receiver_address: AccountId,
    amount: String,
    transaction_hash: String,
}
```

### **DisputeRaised**
```rust
#[ink(event)]
pub struct DisputeRaised {
    escrow_id: String,
    milestone_id: String,
    raised_by: AccountId,
    reason: String,
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
      amount: "1000000000", // 1000 USDT
      status: "Pending",
      deadline: Date.now() + 7 * 24 * 60 * 60 * 1000,
      // ... other fields
    }
  ];

  const result = await contract.tx.createEscrow(
    { value: 0, gasLimit: -1 },
    counterpartyAddress,
    "provider",
    "Active",
    "Website Development",
    "Full stack web application",
    "5000000000", // 5000 USDT total
    milestones,
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
**ink! Version:** 5.0.0
**Last Updated:** September 2025