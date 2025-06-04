#![cfg_attr(not(feature = "std"), no_std)]
#![allow(clippy::new_without_default)]
#![allow(unused_imports)]

//! # Escrow Contract
//!
//! On-chain, milestone-based escrow using OpenBrush for Ownable + PSP22 transfers.

use ink::prelude::{string::String, vec::Vec};
use ink::storage::Mapping;
use ink::storage::traits::StorageLayout;
use scale::{Encode, Decode};
use scale_info::TypeInfo;

use openbrush::{
    contract,
    implementation,
    modifiers,
    traits::{AccountId, Balance, Storage, Timestamp},
    contracts::{
        ownable::{self, Ownable},
        psp22::PSP22Ref,
    },
};

use escrow_lib::{
    EscrowStatus,
    EscrowError,
    Milestone,
    MilestoneStatus,
    ReleaseConditionType,
    ReleaseCondition as LibReleaseCondition,
    MilestoneModificationProposal as LibMilestoneModificationProposal,
};

/// Make sure your escrow_lib types (`EscrowStatus`, `Milestone`,
/// `LibReleaseCondition`, `LibMilestoneModificationProposal`) also
/// `derive(StorageLayout)`!
#[implementation(Ownable)]
#[contract]
pub mod escrow {
    use super::*;

    // =========================
    // === Events =============
    // =========================

    #[ink(event)]
    pub struct EscrowCreated {
        #[ink(topic)] escrow_id: u32,
        #[ink(topic)] client: AccountId,
        #[ink(topic)] provider: AccountId,
        amount: Balance,
        token: AccountId,
        milestones_count: u32,
    }

    #[ink(event)]
    pub struct MilestoneReleased {
        #[ink(topic)] escrow_id: u32,
        milestone_id: u32,
        amount: Balance,
        #[ink(topic)] provider: AccountId,
        fee: Balance,
    }

    #[ink(event)]
    pub struct MilestoneCompleted {
        #[ink(topic)] escrow_id: u32,
        milestone_id: u32,
        #[ink(topic)] provider: AccountId,
    }

    #[ink(event)]
    pub struct EvidenceAdded {
        #[ink(topic)] escrow_id: u32,
        milestone_id: u32,
        evidence_hash: Vec<u8>,
        #[ink(topic)] provider: AccountId,
    }

    #[ink(event)]
    pub struct EscrowCancelled {
        #[ink(topic)] escrow_id: u32,
        #[ink(topic)] client: AccountId,
        #[ink(topic)] provider: AccountId,
        remaining_amount: Balance,
    }

    #[ink(event)]
    pub struct DisputeCreated {
        #[ink(topic)] dispute_id: u32,
        #[ink(topic)] escrow_id: u32,
        milestone_id: Option<u32>,
        #[ink(topic)] initiator: AccountId,
    }

    #[ink(event)]
    pub struct DisputeResolved {
        #[ink(topic)] dispute_id: u32,
        #[ink(topic)] escrow_id: u32,
        milestone_id: Option<u32>,
        in_favor_of_client: bool,
    }

    #[ink(event)]
    pub struct ContractPaused {
        #[ink(topic)] paused_by: AccountId,
    }

    #[ink(event)]
    pub struct ContractUnpaused {
        #[ink(topic)] unpaused_by: AccountId,
    }

    #[ink(event)]
    pub struct TransactionLimitUpdated {
        new_limit: Balance,
        #[ink(topic)] updated_by: AccountId,
    }

    #[ink(event)]
    pub struct FeeUpdated {
        new_fee_bps: u16,
        #[ink(topic)] updated_by: AccountId,
    }

    #[ink(event)]
    pub struct FeeAccountUpdated {
        #[ink(topic)] new_fee_account: AccountId,
        #[ink(topic)] updated_by: AccountId,
    }

    #[ink(event)]
    pub struct EmergencyWithdraw {
        #[ink(topic)] escrow_id: u32,
        #[ink(topic)] recipient: AccountId,
        amount: Balance,
        #[ink(topic)] initiated_by: AccountId,
    }

    #[ink(event)]
    pub struct ContractUpgraded {
        #[ink(topic)] old_code_hash: [u8; 32],
        #[ink(topic)] new_code_hash: [u8; 32],
        #[ink(topic)] upgraded_by: AccountId,
    }

    #[ink(event)]
    pub struct UpgradeApproved {
        #[ink(topic)] code_hash: [u8; 32],
        #[ink(topic)] approved_by: AccountId,
        current_approvals: u8,
        required_approvals: u8,
    }

    #[ink(event)]
    pub struct ConditionAdded {
        #[ink(topic)] escrow_id: u32,
        milestone_id: u32,
        condition_type: ReleaseConditionType,
        #[ink(topic)] added_by: AccountId,
    }

    #[ink(event)]
    pub struct ConditionVerified {
        #[ink(topic)] escrow_id: u32,
        milestone_id: u32,
        condition_index: u32,
        #[ink(topic)] verified_by: AccountId,
    }

    #[ink(event)]
    pub struct AutoMilestoneReleased {
        #[ink(topic)] escrow_id: u32,
        milestone_id: u32,
        conditions_met: u32,
    }

    #[ink(event)]
    pub struct MilestoneModificationRequested {
        #[ink(topic)] escrow_id: u32,
        milestone_id: u32,
        #[ink(topic)] requested_by: AccountId,
        #[ink(topic)] counterparty: AccountId,
    }

    #[ink(event)]
    pub struct MilestoneModificationApproved {
        #[ink(topic)] escrow_id: u32,
        milestone_id: u32,
        #[ink(topic)] approved_by: AccountId,
    }

    #[ink(event)]
    pub struct MilestoneModified {
        #[ink(topic)] escrow_id: u32,
        milestone_id: u32,
        #[ink(topic)] modified_by: AccountId,
    }

    // =========================
    // === Data definitions ===
    // =========================

    #[derive(Debug, Encode, Decode, TypeInfo, StorageLayout)]
    pub struct EscrowData {
        pub id: u32,
        pub client: AccountId,
        pub provider: AccountId,
        pub amount: Balance,
        pub token: AccountId,
        pub status: EscrowStatus,
        pub milestones: Vec<Milestone>,
        pub created_at: Timestamp,
        pub completed_at: Option<Timestamp>,
    }

    #[derive(Debug, Encode, Decode, TypeInfo, StorageLayout)]
    pub struct Dispute {
        pub id: u32,
        pub escrow_id: u32,
        pub milestone_id: Option<u32>,
        pub initiator: AccountId,
        pub reason: Vec<u8>,
        pub created_at: Timestamp,
        pub resolved_at: Option<Timestamp>,
    }

    // =========================
    // === Storage definition ==
    // =========================

    #[ink(storage)]
    #[derive(Storage)]
    pub struct EscrowContract {
        #[storage_field]
        ownable: ownable::Data,

        escrow_count: u32,
        dispute_count: u32,

        escrows: Mapping<u32, EscrowData>,
        disputes: Mapping<u32, Dispute>,
        user_escrows: Mapping<AccountId, Vec<u32>>,

        fee_bps: u16,
        fee_account: AccountId,
        max_transaction_value: Balance,

        reentrancy_status: bool,
        paused: bool,

        required_signatures: u8,
        admins: Vec<AccountId>,
        code_hash: [u8; 32],
        upgrade_approvals: Mapping<[u8;32], u8>,

        proposed_milestone_changes: Mapping<(u32,u32), LibMilestoneModificationProposal>,
        milestone_modification_initiators: Mapping<(u32,u32), AccountId>,
        milestone_modification_approvals: Mapping<(u32,u32,AccountId), bool>,
    }

    impl Default for EscrowContract {
        fn default() -> Self {
            Self {
                ownable: Default::default(),
                escrow_count: 0,
                dispute_count: 0,
                escrows: Default::default(),
                disputes: Default::default(),
                user_escrows: Default::default(),
                fee_bps: 0,
                fee_account: Self::empty_account_id(),
                max_transaction_value: 0,
                reentrancy_status: false,
                paused: false,
                required_signatures: 1,
                admins: Vec::new(),
                code_hash: [0u8; 32],
                upgrade_approvals: Default::default(),
                proposed_milestone_changes: Default::default(),
                milestone_modification_initiators: Default::default(),
                milestone_modification_approvals: Default::default(),
            }
        }
    }

    // ────────────────────────────────────────────────────────────
    // Private helper methods
    // ────────────────────────────────────────────────────────────

    impl EscrowContract {
        fn hash_to_array(hash: ink::primitives::Hash) -> [u8;32] {
            let mut buf = [0u8;32];
            buf.copy_from_slice(hash.as_ref());
            buf
        }

        fn empty_account_id() -> AccountId {
            AccountId::from([0u8;32])
        }

        fn ensure_not_paused(&self) -> Result<(), EscrowError> {
            if self.paused {
                return Err(EscrowError::ContractPaused);
            }
            Ok(())
        }

        fn ensure_no_reentrancy(&self) -> Result<(), EscrowError> {
            if self.reentrancy_status {
                return Err(EscrowError::ReentrancyGuard);
            }
            Ok(())
        }

        fn ensure_within_limits(&self, amount: Balance) -> Result<(), EscrowError> {
            if self.max_transaction_value > 0 && amount > self.max_transaction_value {
                return Err(EscrowError::TransactionLimitExceeded);
            }
            Ok(())
        }

        fn non_reentrant_start(&mut self) -> Result<(), EscrowError> {
            self.ensure_no_reentrancy()?;
            self.reentrancy_status = true;
            Ok(())
        }

        fn non_reentrant_end(&mut self) {
            self.reentrancy_status = false;
        }

        fn calculate_fee(&self, amount: Balance) -> Balance {
            amount * self.fee_bps as u128 / 10000
        }

        fn auto_release_milestone(
            &mut self,
            escrow_id: u32,
            milestone_id: u32,
        ) -> Result<(), EscrowError> {
            // … your auto-release logic …
            Ok(())
        }
    }

    // ────────────────────────────────────────────────────────────
    // Public constructor & messages
    // ────────────────────────────────────────────────────────────

    impl EscrowContract {
        /// Constructor
        #[ink(constructor)]
        pub fn new(fee_bps: u16, fee_account: AccountId) -> Self {
            let mut instance = Self::default();
            instance.fee_bps = fee_bps;
            instance.fee_account = fee_account;
            
            // Store caller in a temporary variable to avoid borrowing issues
            let caller = instance.env().caller();
            
            // initialize Ownable
            ownable::Internal::_init_with_owner(&mut instance, caller);
            instance.admins.push(caller);

            // record code hash
            if let Ok(hash) = instance.env().own_code_hash() {
                instance.code_hash = Self::hash_to_array(hash);
            }

            instance
        }

        /// Owner‐only: change fee bps
        #[ink(message)]
        #[modifiers(only_owner)]
        pub fn set_fee_bps(&mut self, fee_bps: u16) -> Result<(), EscrowError> {
            self.ensure_not_paused()?;
            if fee_bps > 1000 {
                return Err(EscrowError::Custom(String::from("Fee too high").into_bytes()));
            }
            self.fee_bps = fee_bps;
            self.env().emit_event(FeeUpdated {
                new_fee_bps: fee_bps,
                updated_by: self.env().caller(),
            });
            Ok(())
        }

        /// Owner‐only: change fee account
        #[ink(message)]
        #[modifiers(only_owner)]
        pub fn set_fee_account(&mut self, fee_account: AccountId) -> Result<(), EscrowError> {
            self.ensure_not_paused()?;
            self.fee_account = fee_account;
            self.env().emit_event(FeeAccountUpdated {
                new_fee_account: fee_account,
                updated_by: self.env().caller(),
            });
            Ok(())
        }

        /// Owner‐only: set max transaction
        #[ink(message)]
        #[modifiers(only_owner)]
        pub fn set_max_transaction_value(
            &mut self,
            max_value: Balance,
        ) -> Result<(), EscrowError> {
            self.ensure_not_paused()?;
            self.max_transaction_value = max_value;
            self.env().emit_event(TransactionLimitUpdated {
                new_limit: max_value,
                updated_by: self.env().caller(),
            });
            Ok(())
        }

        /// Owner‐only: pause contract
        #[ink(message)]
        #[modifiers(only_owner)]
        pub fn pause(&mut self) -> Result<(), EscrowError> {
            if self.paused {
                return Err(EscrowError::Custom(String::from("Already paused").into_bytes()));
            }
            self.paused = true;
            self.env().emit_event(ContractPaused { paused_by: self.env().caller() });
            Ok(())
        }

        /// Owner‐only: unpause contract
        #[ink(message)]
        #[modifiers(only_owner)]
        pub fn unpause(&mut self) -> Result<(), EscrowError> {
            if !self.paused {
                return Err(EscrowError::Custom(String::from("Not paused").into_bytes()));
            }
            self.paused = false;
            self.env().emit_event(ContractUnpaused { unpaused_by: self.env().caller() });
            Ok(())
        }

        /// Owner‐only: add an admin
        #[ink(message)]
        #[modifiers(only_owner)]
        pub fn add_admin(&mut self, admin: AccountId) -> Result<(), EscrowError> {
            if self.admins.contains(&admin) {
                return Err(EscrowError::Custom(String::from("Already an admin").into_bytes()));
            }
            self.admins.push(admin);
            Ok(())
        }

        /// Owner‐only: remove an admin
        #[ink(message)]
        #[modifiers(only_owner)]
        pub fn remove_admin(&mut self, admin: AccountId) -> Result<(), EscrowError> {
            if !self.admins.contains(&admin) {
                return Err(EscrowError::Custom(String::from("Not an admin").into_bytes()));
            }
            if self.admins.len() <= 1 {
                return Err(EscrowError::Custom(String::from("Cannot remove last admin").into_bytes()));
            }
            self.admins.retain(|x| x != &admin);
            Ok(())
        }

        /// Owner‐only: set required signers for upgrade
        #[ink(message)]
        #[modifiers(only_owner)]
        pub fn set_required_signatures(&mut self, count: u8) -> Result<(), EscrowError> {
            if count == 0 || count as usize > self.admins.len() {
                return Err(EscrowError::Custom(String::from("Invalid signature count").into_bytes()));
            }
            self.required_signatures = count;
            Ok(())
        }

        /// Admins may call: approve code upgrade
        #[ink(message)]
        pub fn approve_upgrade(&mut self, code_hash: [u8;32]) -> Result<(), EscrowError> {
            self.ensure_not_paused()?;
            let who = self.env().caller();
            if !self.admins.contains(&who) {
                return Err(EscrowError::NotAuthorized);
            }
            let current = self.upgrade_approvals.get(&code_hash).unwrap_or(0);
            let next    = current + 1;
            self.upgrade_approvals.insert(code_hash, &next);
            self.env().emit_event(UpgradeApproved {
                code_hash,
                approved_by: who,
                current_approvals: next,
                required_approvals: self.required_signatures,
            });
            if next < self.required_signatures {
                return Err(EscrowError::Custom(format!("Need {} more", self.required_signatures - next).into_bytes()));
            }
            Ok(())
        }

        /// View approvals for a code hash
        #[ink(message)]
        pub fn get_upgrade_approvals(&self, code_hash: [u8;32]) -> u8 {
            self.upgrade_approvals.get(&code_hash).unwrap_or(0)
        }

        /// Owner resolves a dispute
        #[ink(message)]
        #[modifiers(only_owner)]
        pub fn resolve_dispute(
            &mut self,
            dispute_id: u32,
            in_favor_of_client: bool,
        ) -> Result<(), EscrowError> {
            self.ensure_not_paused()?;
            self.non_reentrant_start()?;
            // … your dispute resolution logic …
            self.non_reentrant_end();
            Ok(())
        }

        /// Emergency withdraw (only when paused)
        #[ink(message)]
        pub fn emergency_withdraw(
            &mut self,
            escrow_id: u32,
            recipient: AccountId,
        ) -> Result<(), EscrowError> {
            if !self.paused {
                return Err(EscrowError::Custom(String::from("Must be paused").into_bytes()));
            }
            self.non_reentrant_start()?;
            let escrow = self.escrows.get(escrow_id).ok_or(EscrowError::EscrowNotFound)?;
            let released: Balance = escrow
                .milestones.iter()
                .filter(|m| m.status == MilestoneStatus::Completed)
                .map(|m| m.amount)
                .sum();
            let remaining = escrow.amount - released;
            if remaining > 0 {
                PSP22Ref::transfer(&escrow.token, recipient, remaining, Vec::new())
                    .map_err(EscrowError::from)?;
                self.env().emit_event(EmergencyWithdraw {
                    escrow_id,
                    recipient,
                    amount: remaining,
                    initiated_by: self.env().caller(),
                });
            }
            self.non_reentrant_end();
            Ok(())
        }

        /// Client adds a release condition
        #[ink(message)]
        pub fn add_release_condition(
            &mut self,
            escrow_id: u32,
            milestone_id: u32,
            condition_type: ReleaseConditionType,
            condition_data: Vec<u8>,
        ) -> Result<(), EscrowError> {
            self.ensure_not_paused()?;
            let who = self.env().caller();
            let mut escrow = self.escrows.get(escrow_id).ok_or(EscrowError::EscrowNotFound)?;
            if who != escrow.client {
                return Err(EscrowError::NotAuthorized);
            }
            if escrow.status != EscrowStatus::Active {
                return Err(EscrowError::InvalidEscrowStatus);
            }
            let m = &mut escrow.milestones[milestone_id as usize];
            if m.status != MilestoneStatus::Pending {
                return Err(EscrowError::InvalidMilestoneStatus);
            }
            
            // Clone the condition_type to avoid move issue
            let condition_type_for_event = condition_type.clone();
            
            let mut lib_cond = LibReleaseCondition {
                condition_type,
                condition_data: condition_data.clone(),
                is_met: false,
                verified_at: None,
                verified_by: None,
            };
            if let Some(mut conds) = m.conditions.take() {
                conds.push(lib_cond);
                m.conditions = Some(conds);
            } else {
                m.conditions = Some(vec![lib_cond]);
            }
            self.escrows.insert(escrow_id, &escrow);
            self.env().emit_event(ConditionAdded {
                escrow_id,
                milestone_id,
                condition_type: condition_type_for_event,
                added_by: who,
            });
            Ok(())
        }

        /// Verifier marks a condition as met
        #[ink(message)]
        pub fn verify_condition(
            &mut self,
            escrow_id: u32,
            milestone_id: u32,
            condition_index: u32,
            verification_data: Option<Vec<u8>>,
        ) -> Result<(), EscrowError> {
            self.ensure_not_paused()?;
            let who = self.env().caller();
            let mut escrow = self.escrows.get(escrow_id).ok_or(EscrowError::EscrowNotFound)?;
            if escrow.status != EscrowStatus::Active {
                return Err(EscrowError::InvalidEscrowStatus);
            }
            let m = &mut escrow.milestones[milestone_id as usize];
            if m.status != MilestoneStatus::Pending {
                return Err(EscrowError::InvalidMilestoneStatus);
            }
            let conds = m.conditions.as_mut().ok_or(EscrowError::Custom(String::from("No conditions").into_bytes()))?;
            if (condition_index as usize) >= conds.len() {
                return Err(EscrowError::Custom(String::from("Index OOB").into_bytes()));
            }
            // … set conds[condition_index].is_met = true, etc. …
            self.escrows.insert(escrow_id, &escrow);
            self.env().emit_event(ConditionVerified {
                escrow_id,
                milestone_id,
                condition_index,
                verified_by: who,
            });
            Ok(())
        }

        /// Client or provider requests milestone modification
        #[ink(message)]
        pub fn request_milestone_modification(
            &mut self,
            escrow_id: u32,
            milestone_id: u32,
            new_title: Option<Vec<u8>>,
            new_description: Option<Vec<u8>>,
            new_deadline: Option<Timestamp>,
        ) -> Result<(), EscrowError> {
            self.ensure_not_paused()?;
            let who = self.env().caller();
            let escrow = self.escrows.get(escrow_id).ok_or(EscrowError::EscrowNotFound)?;
            if who != escrow.client && who != escrow.provider {
                return Err(EscrowError::NotAuthorized);
            }
            if escrow.status != EscrowStatus::Active {
                return Err(EscrowError::InvalidEscrowStatus);
            }
            let m = &escrow.milestones[milestone_id as usize];
            if m.status != MilestoneStatus::Pending {
                return Err(EscrowError::InvalidMilestoneStatus);
            }
            if new_title.is_none() && new_description.is_none() && new_deadline.is_none() {
                return Err(EscrowError::Custom(String::from("No changes").into_bytes()));
            }
            let proposal = LibMilestoneModificationProposal {
                new_title: new_title.clone(),
                new_description: new_description.clone(),
                new_deadline,
                proposed_at: self.env().block_timestamp(),
            };
            self.proposed_milestone_changes.insert((escrow_id, milestone_id), &proposal);
            self.milestone_modification_initiators.insert((escrow_id, milestone_id), &who);
            let counterparty = if who == escrow.client { escrow.provider } else { escrow.client };
            self.env().emit_event(MilestoneModificationRequested {
                escrow_id,
                milestone_id,
                requested_by: who,
                counterparty,
            });
            Ok(())
        }

        /// Approve or apply a milestone modification
        #[ink(message)]
        pub fn modify_milestone(
            &mut self,
            escrow_id: u32,
            milestone_id: u32,
            new_title: Option<Vec<u8>>,
            new_description: Option<Vec<u8>>,
            new_deadline: Option<Timestamp>,
        ) -> Result<(), EscrowError> {
            self.ensure_not_paused()?;
            let who = self.env().caller();
            let mut escrow = self.escrows.get(escrow_id).ok_or(EscrowError::EscrowNotFound)?;
            if who != escrow.client && who != escrow.provider {
                return Err(EscrowError::NotAuthorized);
            }
            if escrow.status != EscrowStatus::Active {
                return Err(EscrowError::InvalidEscrowStatus);
            }
            let m = &mut escrow.milestones[milestone_id as usize];
            if m.status != MilestoneStatus::Pending {
                return Err(EscrowError::InvalidMilestoneStatus);
            }
            let initiator = self.milestone_modification_initiators
                .get((escrow_id, milestone_id))
                .ok_or(EscrowError::Custom(String::from("No proposal").into_bytes()))?;
            // first call: counterparty approval
            if who != initiator {
                self.milestone_modification_approvals.insert((escrow_id, milestone_id, initiator.clone()), &true);
                self.env().emit_event(MilestoneModificationApproved {
                    escrow_id,
                    milestone_id,
                    approved_by: who,
                });
                return Ok(())
            }
            // now initiator can apply
            if !self.milestone_modification_approvals.get((escrow_id, milestone_id, initiator.clone())).unwrap_or(false) {
                return Err(EscrowError::Custom(String::from("Waiting approval").into_bytes()));
            }
            if let Some(t)  = new_title       { m.title = t; }
            if let Some(d)  = new_description { m.description = d; }
            if let Some(dl) = new_deadline    { m.deadline = Some(dl); }
            self.escrows.insert(escrow_id, &escrow);
            self.milestone_modification_approvals.remove((escrow_id, milestone_id, initiator.clone()));
            self.milestone_modification_initiators.remove((escrow_id, milestone_id));
            self.env().emit_event(MilestoneModified {
                escrow_id,
                milestone_id,
                modified_by: who,
            });
            Ok(())
        }

        /// View the pending modification proposal
        #[ink(message)]
        pub fn get_milestone_modification_proposal(
            &self,
            escrow_id: u32,
            milestone_id: u32,
        ) -> Result<LibMilestoneModificationProposal, EscrowError> {
            self.proposed_milestone_changes
                .get((escrow_id, milestone_id))
                .ok_or(EscrowError::Custom(String::from("No proposal").into_bytes()))
        }

        /// Create a new escrow (client deposits PSP22 tokens)
        #[ink(message)]
        pub fn create_escrow(
            &mut self,
            provider: AccountId,
            amount: Balance,
            milestones: Vec<(Vec<u8>, Vec<u8>, u8, Option<Timestamp>)>,
            token_address: AccountId,
        ) -> Result<(), EscrowError> {
            self.ensure_not_paused()?;
            self.ensure_within_limits(amount)?;
            self.non_reentrant_start()?;

            let caller = self.env().caller();
            if provider == caller {
                self.non_reentrant_end();
                return Err(EscrowError::Custom(String::from("Client == provider").into_bytes()));
            }
            if amount == 0 {
                self.non_reentrant_end();
                return Err(EscrowError::InvalidAmount);
            }
            if milestones.is_empty() {
                self.non_reentrant_end();
                return Err(EscrowError::InvalidMilestones);
            }
            let total_pct: u8 = milestones.iter().map(|(_,_,p,_)| *p).sum();
            if total_pct != 100 {
                self.non_reentrant_end();
                return Err(EscrowError::InvalidMilestones);
            }

            // build Milestone structs
            let mut objs = Vec::new();
            let mut sum_amount = 0u128;
            for (i, (title, desc, pct, dl)) in milestones.iter().enumerate() {
                if *pct == 0 || *pct > 100 {
                    self.non_reentrant_end();
                    return Err(EscrowError::InvalidPercentage);
                }
                let amt = amount * (*pct as u128) / 100;
                sum_amount += amt;
                let final_amt = if i == (milestones.len() - 1) {
                    amt + (amount - sum_amount)
                } else {
                    amt
                };
                objs.push(Milestone {
                    title: title.clone(),
                    description: desc.clone(),
                    percentage: *pct,
                    amount: final_amt,
                    status: MilestoneStatus::Pending,
                    deadline: *dl,
                    completed_at: None,
                    evidence_hash: None,
                    conditions: None,
                });
            }

            // transfer tokens in
            PSP22Ref::transfer_from(&token_address, caller, Self::env().account_id(), amount, Vec::new())
                .map_err(EscrowError::from)?;

            // store escrow
            let escrow_id = self.escrow_count;
            self.escrow_count += 1;
            let data = EscrowData {
                id: escrow_id,
                client: caller,
                provider,
                amount,
                token: token_address,
                status: EscrowStatus::Active,
                milestones: objs,
                created_at: self.env().block_timestamp(),
                completed_at: None,
            };
            self.escrows.insert(escrow_id, &data);

            // index for client and provider
            let mut c_list = self.user_escrows.get(caller).unwrap_or_default();
            c_list.push(escrow_id);
            self.user_escrows.insert(caller, &c_list);
            let mut p_list = self.user_escrows.get(provider).unwrap_or_default();
            p_list.push(escrow_id);
            self.user_escrows.insert(provider, &p_list);

            self.env().emit_event(EscrowCreated {
                escrow_id,
                client: caller,
                provider,
                amount,
                token: token_address,
                milestones_count: data.milestones.len() as u32,
            });

            self.non_reentrant_end();
            Ok(())
        }

        /// Client releases a pending milestone
        #[ink(message)]
        pub fn release_milestone(
            &mut self,
            escrow_id: u32,
            milestone_id: u32,
        ) -> Result<(), EscrowError> {
            self.ensure_not_paused()?;
            self.non_reentrant_start()?;

            let caller = self.env().caller();
            let mut escrow = self.escrows.get(escrow_id).ok_or(EscrowError::EscrowNotFound)?;
            if caller != escrow.client {
                self.non_reentrant_end();
                return Err(EscrowError::NotAuthorized);
            }
            if escrow.status != EscrowStatus::Active {
                self.non_reentrant_end();
                return Err(EscrowError::InvalidEscrowStatus);
            }

            let m = &mut escrow.milestones[milestone_id as usize];
            if m.status != MilestoneStatus::Pending {
                self.non_reentrant_end();
                return Err(EscrowError::InvalidMilestoneStatus);
            }

            // mark completed
            m.status = MilestoneStatus::Completed;
            m.completed_at = Some(self.env().block_timestamp());

            // split fee / provider amount
            let fee = self.calculate_fee(m.amount);
            let provider_amt = m.amount - fee;
            if fee > 0 {
                PSP22Ref::transfer(&escrow.token, self.fee_account, fee, Vec::new())
                    .map_err(EscrowError::from)?;
            }
            {
                PSP22Ref::transfer(&escrow.token, escrow.provider, provider_amt, Vec::new())
                    .map_err(EscrowError::from)?;
            }

            // if all done, complete escrow
            if escrow.milestones.iter().all(|x| x.status == MilestoneStatus::Completed) {
                escrow.status = EscrowStatus::Completed;
                escrow.completed_at = Some(self.env().block_timestamp());
            }

            self.escrows.insert(escrow_id, &escrow);
            self.env().emit_event(MilestoneReleased {
                escrow_id,
                milestone_id,
                amount: provider_amt,
                provider: escrow.provider,
                fee,
            });

            self.non_reentrant_end();
            Ok(())
        }

        /// Provider confirms they've done the work
        #[ink(message)]
        pub fn confirm_milestone(
            &mut self,
            escrow_id: u32,
            milestone_id: u32,
        ) -> Result<(), EscrowError> {
            self.ensure_not_paused()?;
            let who = self.env().caller();
            let escrow = self.escrows.get(escrow_id).ok_or(EscrowError::EscrowNotFound)?;
            if who != escrow.provider {
                return Err(EscrowError::NotAuthorized);
            }
            if escrow.status != EscrowStatus::Active {
                return Err(EscrowError::InvalidEscrowStatus);
            }
            let m = &escrow.milestones[milestone_id as usize];
            if m.status != MilestoneStatus::Pending {
                return Err(EscrowError::InvalidMilestoneStatus);
            }
            self.env().emit_event(MilestoneCompleted {
                escrow_id,
                milestone_id,
                provider: who,
            });
            Ok(())
        }

        /// Provider attaches evidence
        #[ink(message)]
        pub fn add_milestone_evidence(
            &mut self,
            escrow_id: u32,
            milestone_id: u32,
            evidence_hash: Vec<u8>,
        ) -> Result<(), EscrowError> {
            self.ensure_not_paused()?;
            let who = self.env().caller();
            let mut escrow = self.escrows.get(escrow_id).ok_or(EscrowError::EscrowNotFound)?;
            if who != escrow.provider {
                return Err(EscrowError::NotAuthorized);
            }
            if escrow.status != EscrowStatus::Active {
                return Err(EscrowError::InvalidEscrowStatus);
            }
            let m = &mut escrow.milestones[milestone_id as usize];
            m.evidence_hash = Some(evidence_hash.clone());
            self.escrows.insert(escrow_id, &escrow);
            self.env().emit_event(EvidenceAdded {
                escrow_id,
                milestone_id,
                evidence_hash,
                provider: who,
            });
            Ok(())
        }

        /// Cancel escrow & refund remainder
        #[ink(message)]
        pub fn cancel_escrow(&mut self, escrow_id: u32) -> Result<(), EscrowError> {
            self.ensure_not_paused()?;
            self.non_reentrant_start()?;

            let who = self.env().caller();
            let mut escrow = self.escrows.get(escrow_id).ok_or(EscrowError::EscrowNotFound)?;
            if who != escrow.client && who != escrow.provider {
                self.non_reentrant_end();
                return Err(EscrowError::NotAuthorized);
            }
            if escrow.status != EscrowStatus::Active {
                self.non_reentrant_end();
                return Err(EscrowError::InvalidEscrowStatus);
            }

            let released: Balance = escrow
                .milestones.iter()
                .filter(|m| m.status == MilestoneStatus::Completed)
                .map(|m| m.amount)
                .sum();
            let remaining = escrow.amount - released;
            if remaining > 0 {
                PSP22Ref::transfer(&escrow.token, escrow.client, remaining, Vec::new())
                    .map_err(EscrowError::from)?;
            }

            escrow.status = EscrowStatus::Cancelled;
            escrow.completed_at = Some(self.env().block_timestamp());
            self.escrows.insert(escrow_id, &escrow);
            self.env().emit_event(EscrowCancelled {
                escrow_id,
                client: escrow.client,
                provider: escrow.provider,
                remaining_amount: remaining,
            });

            self.non_reentrant_end();
            Ok(())
        }

        /// Create a dispute on a milestone
        #[ink(message)]
        pub fn create_dispute(
            &mut self,
            escrow_id: u32,
            milestone_id: u32,
            reason: Vec<u8>,
        ) -> Result<(), EscrowError> {
            self.ensure_not_paused()?;
            let who = self.env().caller();
            let mut escrow = self.escrows.get(escrow_id).ok_or(EscrowError::EscrowNotFound)?;
            if who != escrow.client && who != escrow.provider {
                return Err(EscrowError::NotAuthorized);
            }
            if escrow.status != EscrowStatus::Active {
                return Err(EscrowError::InvalidEscrowStatus);
            }
            escrow.status = EscrowStatus::Disputed;
            escrow.milestones[milestone_id as usize].status = MilestoneStatus::Disputed;

            let dispute_id = self.dispute_count;
            self.dispute_count += 1;
            let dispute = Dispute {
                id: dispute_id,
                escrow_id,
                milestone_id: Some(milestone_id),
                initiator: who,
                reason: reason.clone(),
                created_at: self.env().block_timestamp(),
                resolved_at: None,
            };
            self.disputes.insert(dispute_id, &dispute);
            self.escrows.insert(escrow_id, &escrow);
            self.env().emit_event(DisputeCreated {
                dispute_id,
                escrow_id,
                milestone_id: Some(milestone_id),
                initiator: who,
            });
            Ok(())
        }

        /// Query raw encoded escrow
        #[ink(message)]
        pub fn get_escrow(&self, escrow_id: u32) -> Result<Vec<u8>, EscrowError> {
            let e = self.escrows.get(escrow_id).ok_or(EscrowError::EscrowNotFound)?;
            Ok(Encode::encode(&e))
        }

        /// List all escrows for a user
        #[ink(message)]
        pub fn get_user_escrows(&self, user: AccountId) -> Vec<u32> {
            self.user_escrows.get(user).unwrap_or_default()
        }
    }
}
