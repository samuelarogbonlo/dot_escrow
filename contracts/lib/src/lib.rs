#![cfg_attr(not(feature = "std"), no_std)]

use ink::prelude::vec::Vec;
use openbrush::traits::{AccountId, Balance, Timestamp};
use openbrush::contracts::psp22::PSP22Error;
use scale::{Decode, Encode};
use scale_info::TypeInfo;

/// The status of an escrow.
#[derive(Debug, PartialEq, Eq, Encode, Decode)]
pub enum EscrowStatus {
    /// The escrow is active and funds are locked.
    Active,
    /// The escrow has been completed and funds released.
    Completed,
    /// The escrow has been cancelled and funds returned.
    Cancelled,
    /// The escrow is in dispute.
    Disputed,
}

/// The status of a milestone.
#[derive(Debug, PartialEq, Eq, Encode, Decode)]
pub enum MilestoneStatus {
    /// The milestone is pending completion.
    Pending,
    /// The milestone has been completed.
    Completed,
    /// The milestone is in dispute.
    Disputed,
}

/// Types of conditions that can trigger automatic milestone release.
#[derive(Debug, PartialEq, Eq, Encode, Decode, TypeInfo, Clone)]
pub enum ReleaseConditionType {
    /// Condition verified by a specific third-party account
    ThirdPartyVerification,
    /// Time-based condition (will release after timestamp)
    TimeBasedRelease,
    /// Oracle-based condition (external data verification)
    OracleVerification,
}

/// A condition that must be met for automatic milestone release.
#[derive(Debug, Encode, Decode)]
pub struct ReleaseCondition {
    /// The type of condition
    pub condition_type: ReleaseConditionType,
    /// The data for the condition (interpretation depends on type)
    pub condition_data: Vec<u8>,
    /// Whether the condition has been met
    pub is_met: bool,
    /// When the condition was verified (if applicable)
    pub verified_at: Option<Timestamp>,
    /// Address of the verifier (if applicable)
    pub verified_by: Option<AccountId>,
}

/// Proposal for modifying a milestone (shared between contract and client code).
#[derive(Debug, Encode, Decode)]
pub struct MilestoneModificationProposal {
    pub new_title: Option<Vec<u8>>,
    pub new_description: Option<Vec<u8>>,
    pub new_deadline: Option<Timestamp>,
    pub proposed_at: Timestamp,
}

/// A milestone for an escrow.
#[derive(Debug, Encode, Decode)]
pub struct Milestone {
    /// The title of the milestone.
    pub title: Vec<u8>,
    /// The description of the milestone.
    pub description: Vec<u8>,
    /// The percentage of the total escrow amount.
    pub percentage: u8,
    /// The amount for this milestone.
    pub amount: Balance,
    /// The status of the milestone.
    pub status: MilestoneStatus,
    /// The deadline for the milestone.
    pub deadline: Option<Timestamp>,
    /// When the milestone was completed.
    pub completed_at: Option<Timestamp>,
    /// Evidence hash for milestone completion (optional)
    pub evidence_hash: Option<Vec<u8>>,
    /// Release conditions that can trigger automatic payment
    pub conditions: Option<Vec<ReleaseCondition>>,
}

/// Errors that can occur during escrow operations.
#[derive(Debug, PartialEq, Eq, Encode, Decode)]
pub enum EscrowError {
    /// An error occurred in the PSP22 token operations.
    PSP22Error(PSP22Error),
    /// Caller is not authorized to perform this action.
    NotAuthorized,
    /// The escrow does not exist.
    EscrowNotFound,
    /// The milestone does not exist.
    MilestoneNotFound,
    /// The escrow is not in the required status.
    InvalidEscrowStatus,
    /// The milestone is not in the required status.
    InvalidMilestoneStatus,
    /// The milestone percentages do not add up to 100%.
    InvalidMilestones,
    /// The escrow amount is invalid.
    InvalidAmount,
    /// Cannot perform this action on an escrow in dispute.
    InDispute,
    /// A deadline has passed.
    DeadlinePassed,
    /// The percentage is invalid (must be between 1 and 100).
    InvalidPercentage,
    /// The provided signature is invalid.
    InvalidSignature,
    /// The operation requires multi-signature approval.
    RequiresMultiSignature,
    /// The transaction limit has been exceeded.
    TransactionLimitExceeded,
    /// The contract is paused.
    ContractPaused,
    /// Operation would cause a reentrancy.
    ReentrancyGuard,
    /// Upgrade error.
    UpgradeError,
    /// Custom error with a message.
    Custom(Vec<u8>),
}

impl From<PSP22Error> for EscrowError {
    fn from(error: PSP22Error) -> Self {
        EscrowError::PSP22Error(error)
    }
}

impl From<openbrush::contracts::ownable::OwnableError> for EscrowError {
    fn from(_: openbrush::contracts::ownable::OwnableError) -> Self {
        EscrowError::NotAuthorized
    }
}

/// Events emitted by the escrow contract (not stored in mappings)
#[derive(Debug, Encode, Decode)]
pub enum EscrowEvent {
    /// A new escrow was created
    EscrowCreated {
        escrow_id: u32,
        client: AccountId,
        provider: AccountId,
        amount: Balance,
        token: AccountId,
        milestones_count: u32,
    },
    /// Funds were released for a milestone
    MilestoneReleased {
        escrow_id: u32,
        milestone_id: u32,
        amount: Balance,
        provider: AccountId,
        fee: Balance,
    },
    /// A milestone was marked as completed by the provider
    MilestoneCompleted {
        escrow_id: u32,
        milestone_id: u32,
        provider: AccountId,
    },
    /// Evidence was added for a milestone
    EvidenceAdded {
        escrow_id: u32,
        milestone_id: u32,
        evidence_hash: Vec<u8>,
        provider: AccountId,
    },
    /// An escrow was cancelled
    EscrowCancelled {
        escrow_id: u32,
        client: AccountId,
        provider: AccountId,
        remaining_amount: Balance,
    },
    /// A dispute was created
    DisputeCreated {
        dispute_id: u32,
        escrow_id: u32,
        milestone_id: Option<u32>,
        initiator: AccountId,
    },
    /// A dispute was resolved
    DisputeResolved {
        dispute_id: u32,
        escrow_id: u32,
        milestone_id: Option<u32>,
        in_favor_of_client: bool,
    },
    /// The contract was paused
    ContractPaused {
        paused_by: AccountId,
    },
    /// The contract was unpaused
    ContractUnpaused {
        unpaused_by: AccountId,
    },
    /// A transaction limit was updated
    TransactionLimitUpdated {
        new_limit: Balance,
        updated_by: AccountId,
    },
    /// The fee percentage was updated
    FeeUpdated {
        new_fee_bps: u16,
        updated_by: AccountId,
    },
    /// The fee account was updated
    FeeAccountUpdated {
        new_fee_account: AccountId,
        updated_by: AccountId,
    },
    /// The contract was upgraded
    ContractUpgraded {
        old_code_hash: [u8; 32],
        new_code_hash: [u8; 32],
        upgraded_by: AccountId,
    },
}

/// Interface for contract upgrades
#[openbrush::trait_definition]
pub trait Upgradeable {
    /// Upgrades the contract to a new code hash
    #[ink(message)]
    fn upgrade(&mut self, new_code_hash: [u8; 32]) -> Result<(), EscrowError>;
    /// Gets the current code hash of the contract
    #[ink(message)]
    fn get_code_hash(&self) -> [u8; 32];
}

/// Interface for the escrow contract.
#[openbrush::trait_definition]
pub trait Escrow {
    /// Creates a new escrow between a client and provider.
    #[ink(message)]
    fn create_escrow(
        &mut self,
        provider: AccountId,
        amount: Balance,
        milestones: Vec<(Vec<u8>, Vec<u8>, u8, Option<Timestamp>)>,
        token_address: AccountId,
    ) -> Result<(), EscrowError>;

    /// Releases funds for a completed milestone.
    #[ink(message)]
    fn release_milestone(
        &mut self,
        escrow_id: u32,
        milestone_id: u32,
    ) -> Result<(), EscrowError>;

    /// Confirms completion of a milestone by the provider.
    #[ink(message)]
    fn confirm_milestone(
        &mut self,
        escrow_id: u32,
        milestone_id: u32,
    ) -> Result<(), EscrowError>;

    /// Adds evidence for milestone completion.
    #[ink(message)]
    fn add_milestone_evidence(
        &mut self,
        escrow_id: u32,
        milestone_id: u32,
        evidence_hash: Vec<u8>,
    ) -> Result<(), EscrowError>;

    /// Cancels an escrow.
    #[ink(message)]
    fn cancel_escrow(
        &mut self,
        escrow_id: u32,
    ) -> Result<(), EscrowError>;

    /// Creates a dispute for an escrow.
    #[ink(message)]
    fn create_dispute(
        &mut self,
        escrow_id: u32,
        milestone_id: u32,
        reason: Vec<u8>,
    ) -> Result<(), EscrowError>;

    /// Gets an escrow by ID.
    #[ink(message)]
    fn get_escrow(
        &self,
        escrow_id: u32,
    ) -> Result<Vec<u8>, EscrowError>;

    /// Gets all escrows for a user.
    #[ink(message)]
    fn get_user_escrows(
        &self,
        user: AccountId,
    ) -> Vec<u32>;

    /// Emergency withdraw when contract is paused (admin only)
    #[ink(message)]
    fn emergency_withdraw(
        &mut self,
        escrow_id: u32,
        recipient: AccountId,
    ) -> Result<(), EscrowError>;
}