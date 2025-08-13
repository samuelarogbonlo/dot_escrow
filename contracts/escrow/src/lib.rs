#![cfg_attr(not(feature = "std"), no_std, no_main)]
#![allow(clippy::too_many_arguments)]
#![allow(clippy::cast_possible_truncation)]
#![allow(clippy::arithmetic_side_effects)]
#![allow(clippy::needless_borrows_for_generic_args)]

#[ink::contract]
mod escrow_contract {
    use ink::storage::Mapping;
    use ink::prelude::vec::Vec;
    use ink::prelude::string::{String, ToString};
    use ink::prelude::format;

    // PSP22 interface for USDT integration
    #[ink::trait_definition]
    pub trait PSP22 {
        #[ink(message)]
        fn total_supply(&self) -> Balance;

        #[ink(message)]
        fn balance_of(&self, owner: AccountId) -> Balance;

        #[ink(message)]
        fn allowance(&self, owner: AccountId, spender: AccountId) -> Balance;

        #[ink(message)]
        fn transfer(&mut self, to: AccountId, value: Balance, data: Vec<u8>) -> Result<(), PSP22Error>;

        #[ink(message)]
        fn transfer_from(&mut self, from: AccountId, to: AccountId, value: Balance, data: Vec<u8>) -> Result<(), PSP22Error>;

        #[ink(message)]
        fn approve(&mut self, spender: AccountId, value: Balance) -> Result<(), PSP22Error>;
    }

    /// PSP22 error types
    #[derive(scale::Encode, scale::Decode, Debug, PartialEq)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum PSP22Error {
        InsufficientBalance,
        InsufficientAllowance,
        Custom(String),
    }

    /// Contract error types
    #[derive(scale::Encode, scale::Decode, Debug, PartialEq)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum EscrowError {
        Unauthorized,
        EscrowNotFound,
        MilestoneNotFound,
        InvalidStatus,
        ContractPaused,
        InsufficientBalance,
        TokenTransferFailed,
        DeadlineExceeded,
        AlreadyCompleted,
        InvalidAmount,
        DuplicateId,
    }

    /// Escrow status matching frontend
    #[derive(scale::Encode, scale::Decode, Debug, PartialEq, Clone)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout))]
    pub enum EscrowStatus {
        Active,
        Completed,
        Disputed,
        Cancelled,
        Inactive,
        Pending,
        Rejected,
    }

    /// Milestone status matching frontend
    #[derive(scale::Encode, scale::Decode, Debug, PartialEq, Clone)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout))]
    pub enum MilestoneStatus {
        Pending,
        InProgress,
        Completed,
        Disputed,
        Overdue,
    }

    /// Milestone structure matching frontend
    #[derive(scale::Encode, scale::Decode, Debug, PartialEq, Clone)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout))]
    pub struct Milestone {
        pub id: String,
        pub description: String,
        pub amount: String,  // Using string to match frontend
        pub status: MilestoneStatus,
        pub deadline: u64,
        pub completed_at: Option<u64>,
        pub dispute_reason: Option<String>,
        pub dispute_filed_by: Option<AccountId>,
    }

    /// Escrow data structure matching frontend
    #[derive(scale::Encode, scale::Decode, Debug, PartialEq, Clone)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout))]
    pub struct EscrowData {
        pub id: String,
        pub creator_address: AccountId,
        pub counterparty_address: AccountId,
        pub counterparty_type: String,
        pub title: String,
        pub description: String,
        pub total_amount: String,  // Using string to match frontend
        pub status: EscrowStatus,
        pub created_at: u64,
        pub milestones: Vec<Milestone>,
        pub transaction_hash: Option<String>,
    }

    /// Response structures
    #[derive(scale::Encode, scale::Decode, Debug, PartialEq)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct ReleaseResponse {
        pub transaction_hash: String,
        pub status: String,
        pub message: String,
        pub receiver_address: AccountId,
        pub payer_address: AccountId,
    }

    #[derive(scale::Encode, scale::Decode, Debug, PartialEq)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct DisputeResponse {
        pub dispute_id: String,
        pub status: String,
        pub message: String,
    }

    #[derive(scale::Encode, scale::Decode, Debug, PartialEq)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct NotificationResponse {
        pub notification_id: String,
        pub status: String,
        pub message: String,
    }

    #[derive(scale::Encode, scale::Decode, Debug, PartialEq)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct TransactionStatus {
        pub transaction_hash: String,
        pub status: String,
        pub confirmations: u64,
        pub block_number: u64,
    }

    /// Contract storage
    #[ink(storage)]
    pub struct EscrowContract {
        /// Contract owner
        owner: AccountId,
        /// Platform fee in basis points (100 = 1%)
        fee_bps: u16,
        /// Fee recipient account
        fee_account: AccountId,
        /// Escrow counter for unique IDs
        escrow_counter: u64,
        /// Mapping of escrow ID to escrow data
        escrows: Mapping<String, EscrowData>,
        /// Mapping of user addresses to their escrow IDs
        user_escrows: Mapping<AccountId, Vec<String>>,
        /// Contract paused state
        paused: bool,
        /// USDT token contract address
        usdt_token: AccountId,
        /// Default escrow duration (90 days in milliseconds)
        default_duration: u64,
        /// Total volume processed
        total_volume: u128,
    }

    /// Events
    #[ink(event)]
    pub struct EscrowCreated {
        #[ink(topic)]
        pub escrow_id: String,
        #[ink(topic)]
        pub creator: AccountId,
        #[ink(topic)]
        pub counterparty: AccountId,
        pub counterparty_type: String,
        pub title: String,
        pub total_amount: String,
        pub transaction_hash: Option<String>,
    }

    #[ink(event)]
    pub struct EscrowStatusChanged {
        #[ink(topic)]
        pub escrow_id: String,
        pub old_status: EscrowStatus,
        pub new_status: EscrowStatus,
        pub transaction_hash: Option<String>,
    }

    #[ink(event)]
    pub struct MilestoneStatusChanged {
        #[ink(topic)]
        pub escrow_id: String,
        #[ink(topic)]
        pub milestone_id: String,
        pub old_status: MilestoneStatus,
        pub new_status: MilestoneStatus,
    }

    #[ink(event)]
    pub struct MilestoneReleased {
        #[ink(topic)]
        pub escrow_id: String,
        #[ink(topic)]
        pub milestone_id: String,
        pub receiver_address: AccountId,
        pub payer_address: AccountId,
        pub amount: String,
        pub transaction_hash: String,
    }

    #[ink(event)]
    pub struct MilestoneDisputed {
        #[ink(topic)]
        pub escrow_id: String,
        #[ink(topic)]
        pub milestone_id: String,
        pub filed_by: AccountId,
        pub reason: String,
        pub dispute_id: String,
    }

    #[ink(event)]
    pub struct CounterpartyNotified {
        #[ink(topic)]
        pub escrow_id: String,
        pub notification_type: String,
        pub sender_address: AccountId,
        pub recipient_address: AccountId,
        pub notification_id: String,
    }

    impl EscrowContract {
        /// Constructor
        #[ink(constructor)]
        pub fn new(usdt_token: AccountId, fee_account: AccountId) -> Self {
            let caller = Self::env().caller();
            Self {
                owner: caller,
                fee_bps: 100, // 1% default fee
                fee_account,
                escrow_counter: 0,
                escrows: Mapping::new(),
                user_escrows: Mapping::new(),
                paused: false,
                usdt_token,
                default_duration: 90 * 24 * 60 * 60 * 1000, // 90 days in ms
                total_volume: 0,
            }
        }

        /// Create a new escrow
        #[ink(message)]
        pub fn create_escrow(
            &mut self,
            user_address: AccountId,
            counterparty_address: AccountId,
            counterparty_type: String,
            status: String,
            title: String,
            description: String,
            total_amount: String,
            milestones: Vec<Milestone>,
            transaction_hash: Option<String>,
        ) -> Result<String, EscrowError> {
            if self.paused {
                return Err(EscrowError::ContractPaused);
            }

            let caller = self.env().caller();
            if caller != user_address {
                return Err(EscrowError::Unauthorized);
            }

            // Generate unique escrow ID
            self.escrow_counter += 1;
            let escrow_id = format!("escrow_{}", self.escrow_counter);

            // Parse status
            let escrow_status = self.parse_escrow_status(&status)?;

            // Create escrow data
            let escrow_data = EscrowData {
                id: escrow_id.clone(),
                creator_address: user_address,
                counterparty_address,
                counterparty_type: counterparty_type.clone(),
                title: title.clone(),
                description: description.clone(),
                total_amount: total_amount.clone(),
                status: escrow_status,
                created_at: self.env().block_timestamp(),
                milestones,
                transaction_hash: transaction_hash.clone(),
            };

            // Store escrow
            self.escrows.insert(&escrow_id, &escrow_data);

            // Update user escrows
            let mut user_escrow_list = self.user_escrows.get(&user_address).unwrap_or_default();
            user_escrow_list.push(escrow_id.clone());
            self.user_escrows.insert(&user_address, &user_escrow_list);

            // Also add to counterparty's list
            let mut counterparty_escrow_list = self.user_escrows.get(&counterparty_address).unwrap_or_default();
            counterparty_escrow_list.push(escrow_id.clone());
            self.user_escrows.insert(&counterparty_address, &counterparty_escrow_list);

            // Emit event
            self.env().emit_event(EscrowCreated {
                escrow_id: escrow_id.clone(),
                creator: user_address,
                counterparty: counterparty_address,
                counterparty_type,
                title,
                total_amount,
                transaction_hash,
            });

            Ok(escrow_id)
        }

        /// Get escrow by ID
        #[ink(message)]
        pub fn get_escrow(&self, escrow_id: String) -> Result<EscrowData, EscrowError> {
            self.escrows.get(&escrow_id).ok_or(EscrowError::EscrowNotFound)
        }

        /// Get milestone details
        #[ink(message)]
        pub fn get_escrow_milestone(&self, escrow_id: String, milestone_id: String) -> Result<Milestone, EscrowError> {
            let escrow = self.get_escrow(escrow_id)?;
            escrow.milestones
                .iter()
                .find(|m| m.id == milestone_id)
                .cloned()
                .ok_or(EscrowError::MilestoneNotFound)
        }

        /// Update escrow status
        #[ink(message)]
        pub fn update_escrow_status(
            &mut self,
            escrow_id: String,
            new_status: String,
            transaction_hash: Option<String>,
        ) -> Result<EscrowData, EscrowError> {
            if self.paused {
                return Err(EscrowError::ContractPaused);
            }

            let mut escrow = self.get_escrow(escrow_id.clone())?;
            let caller = self.env().caller();

            // Authorization check
            if caller != escrow.creator_address && caller != escrow.counterparty_address {
                return Err(EscrowError::Unauthorized);
            }

            let old_status = escrow.status.clone();
            let new_escrow_status = self.parse_escrow_status(&new_status)?;

            escrow.status = new_escrow_status.clone();
            if let Some(hash) = transaction_hash.clone() {
                escrow.transaction_hash = Some(hash);
            }

            // Update storage
            self.escrows.insert(&escrow_id, &escrow);

            // Emit event
            self.env().emit_event(EscrowStatusChanged {
                escrow_id,
                old_status,
                new_status: new_escrow_status,
                transaction_hash,
            });

            Ok(escrow)
        }

        /// Update milestone status
        #[ink(message)]
        pub fn update_escrow_milestone_status(
            &mut self,
            escrow_id: String,
            milestone: Milestone,
            new_status: String,
        ) -> Result<EscrowData, EscrowError> {
            if self.paused {
                return Err(EscrowError::ContractPaused);
            }

            let mut escrow = self.get_escrow(escrow_id.clone())?;
            let caller = self.env().caller();

            // Authorization check
            if caller != escrow.creator_address && caller != escrow.counterparty_address {
                return Err(EscrowError::Unauthorized);
            }

            // Find and update milestone
            let milestone_index = escrow.milestones
                .iter()
                .position(|m| m.id == milestone.id)
                .ok_or(EscrowError::MilestoneNotFound)?;

            let old_status = escrow.milestones[milestone_index].status.clone();
            let new_milestone_status = self.parse_milestone_status(&new_status)?;

            escrow.milestones[milestone_index].status = new_milestone_status.clone();
            if new_milestone_status == MilestoneStatus::Completed {
                escrow.milestones[milestone_index].completed_at = Some(self.env().block_timestamp());
            }

            // Update storage
            self.escrows.insert(&escrow_id, &escrow);

            // Emit event
            self.env().emit_event(MilestoneStatusChanged {
                escrow_id,
                milestone_id: milestone.id,
                old_status,
                new_status: new_milestone_status,
            });

            Ok(escrow)
        }

        /// List escrows for caller
        #[ink(message)]
        pub fn list_escrows(&self) -> Vec<EscrowData> {
            let caller = self.env().caller();
            let escrow_ids = self.user_escrows.get(&caller).unwrap_or_default();
            
            escrow_ids
                .iter()
                .filter_map(|id| self.escrows.get(id))
                .collect()
        }

        /// Release milestone funds
        #[ink(message)]
        pub fn release_milestone(
            &mut self,
            escrow_id: String,
            milestone_id: String,
        ) -> Result<ReleaseResponse, EscrowError> {
            if self.paused {
                return Err(EscrowError::ContractPaused);
            }

            let mut escrow = self.get_escrow(escrow_id.clone())?;
            let caller = self.env().caller();

            // Only creator (client) can release funds
            if caller != escrow.creator_address {
                return Err(EscrowError::Unauthorized);
            }

            // Find milestone
            let milestone_index = escrow.milestones
                .iter()
                .position(|m| m.id == milestone_id)
                .ok_or(EscrowError::MilestoneNotFound)?;

            // Check if milestone can be released
            if escrow.milestones[milestone_index].status == MilestoneStatus::Completed {
                return Err(EscrowError::AlreadyCompleted);
            }

            // Parse amount (convert string to Balance for calculation)
            let amount_str = escrow.milestones[milestone_index].amount.clone();
            let amount: Balance = amount_str.parse().map_err(|_| EscrowError::InvalidAmount)?;

            // Calculate fee
            let fee = amount * self.fee_bps as u128 / 10000;
            let release_amount = amount - fee;

            // Create PSP22 reference for USDT token
            let mut token: ink::contract_ref!(PSP22) = self.usdt_token.into();

            // Transfer USDT from escrow contract to provider
            let transfer_result = token.transfer(
                escrow.counterparty_address,
                release_amount,
                Vec::new(),
            );

            match transfer_result {
                Ok(_) => {
                    // Transfer fee to fee account if > 0
                    if fee > 0 {
                        let _ = token.transfer(self.fee_account, fee, Vec::new());
                    }

                    // Update milestone status
                    escrow.milestones[milestone_index].status = MilestoneStatus::Completed;
                    escrow.milestones[milestone_index].completed_at = Some(self.env().block_timestamp());

                    // Update escrow
                    self.escrows.insert(&escrow_id, &escrow);

                    // Update total volume
                    self.total_volume += amount;

                    let tx_hash = format!("tx_{}", self.env().block_timestamp());

                    // Emit event
                    self.env().emit_event(MilestoneReleased {
                        escrow_id,
                        milestone_id,
                        receiver_address: escrow.counterparty_address,
                        payer_address: escrow.creator_address,
                        amount: amount_str.clone(),
                        transaction_hash: tx_hash.clone(),
                    });

                    Ok(ReleaseResponse {
                        transaction_hash: tx_hash,
                        status: "success".to_string(),
                        message: "Milestone funds released successfully".to_string(),
                        receiver_address: escrow.counterparty_address,
                        payer_address: escrow.creator_address,
                    })
                }
                Err(_) => Err(EscrowError::TokenTransferFailed),
            }
        }

        /// Dispute a milestone
        #[ink(message)]
        pub fn dispute_milestone(
            &mut self,
            escrow_id: String,
            milestone_id: String,
            reason: String,
        ) -> Result<DisputeResponse, EscrowError> {
            if self.paused {
                return Err(EscrowError::ContractPaused);
            }

            let mut escrow = self.get_escrow(escrow_id.clone())?;
            let caller = self.env().caller();

            // Only escrow participants can dispute
            if caller != escrow.creator_address && caller != escrow.counterparty_address {
                return Err(EscrowError::Unauthorized);
            }

            // Find milestone
            let milestone_index = escrow.milestones
                .iter()
                .position(|m| m.id == milestone_id)
                .ok_or(EscrowError::MilestoneNotFound)?;

            let milestone = &mut escrow.milestones[milestone_index];

            // Update milestone status to disputed
            milestone.status = MilestoneStatus::Disputed;
            milestone.dispute_reason = Some(reason.clone());
            milestone.dispute_filed_by = Some(caller);

            // Update escrow
            self.escrows.insert(&escrow_id, &escrow);

            let dispute_id = format!("dispute_{}_{}", escrow_id, milestone_id);

            // Emit event
            self.env().emit_event(MilestoneDisputed {
                escrow_id,
                milestone_id,
                filed_by: caller,
                reason,
                dispute_id: dispute_id.clone(),
            });

            Ok(DisputeResponse {
                dispute_id,
                status: "disputed".to_string(),
                message: "Milestone has been disputed".to_string(),
            })
        }

        /// Notify counterparty
        #[ink(message)]
        pub fn notify_counterparty(
            &mut self,
            escrow_id: String,
            notification_type: String,
            recipient_address: AccountId,
            _message: Option<String>,
            _notification_kind: Option<String>,
        ) -> Result<NotificationResponse, EscrowError> {
            if self.paused {
                return Err(EscrowError::ContractPaused);
            }

            let escrow = self.get_escrow(escrow_id.clone())?;
            let caller = self.env().caller();

            // Only escrow participants can send notifications
            if caller != escrow.creator_address && caller != escrow.counterparty_address {
                return Err(EscrowError::Unauthorized);
            }

            let notification_id = format!("notif_{}_{}", escrow_id, self.env().block_timestamp());

            // Emit event
            self.env().emit_event(CounterpartyNotified {
                escrow_id,
                notification_type,
                sender_address: caller,
                recipient_address,
                notification_id: notification_id.clone(),
            });

            Ok(NotificationResponse {
                notification_id,
                status: "sent".to_string(),
                message: "Notification sent successfully".to_string(),
            })
        }

        /// Check transaction status (mock implementation)
        #[ink(message)]
        pub fn check_transaction_status(&self, transaction_hash: String) -> Result<TransactionStatus, EscrowError> {
            // This is a simplified implementation
            // In a real scenario, you'd query the blockchain for transaction details
            Ok(TransactionStatus {
                transaction_hash,
                status: "confirmed".to_string(),
                confirmations: 12,
                block_number: self.env().block_number() as u64,
            })
        }

        /// Helper function to parse escrow status
        fn parse_escrow_status(&self, status: &str) -> Result<EscrowStatus, EscrowError> {
            match status {
                "Active" => Ok(EscrowStatus::Active),
                "Completed" => Ok(EscrowStatus::Completed),
                "Disputed" => Ok(EscrowStatus::Disputed),
                "Cancelled" => Ok(EscrowStatus::Cancelled),
                "Inactive" => Ok(EscrowStatus::Inactive),
                "Pending" => Ok(EscrowStatus::Pending),
                "Rejected" => Ok(EscrowStatus::Rejected),
                _ => Err(EscrowError::InvalidStatus),
            }
        }

        /// Helper function to parse milestone status
        fn parse_milestone_status(&self, status: &str) -> Result<MilestoneStatus, EscrowError> {
            match status {
                "Pending" => Ok(MilestoneStatus::Pending),
                "InProgress" => Ok(MilestoneStatus::InProgress),
                "Completed" => Ok(MilestoneStatus::Completed),
                "Disputed" => Ok(MilestoneStatus::Disputed),
                "Overdue" => Ok(MilestoneStatus::Overdue),
                _ => Err(EscrowError::InvalidStatus),
            }
        }

        /// Owner-only functions
        #[ink(message)]
        pub fn pause_contract(&mut self) -> Result<(), EscrowError> {
            let caller = self.env().caller();
            if caller != self.owner {
                return Err(EscrowError::Unauthorized);
            }
            self.paused = true;
            Ok(())
        }

        #[ink(message)]
        pub fn unpause_contract(&mut self) -> Result<(), EscrowError> {
            let caller = self.env().caller();
            if caller != self.owner {
                return Err(EscrowError::Unauthorized);
            }
            self.paused = false;
            Ok(())
        }

        #[ink(message)]
        pub fn update_fee(&mut self, new_fee_bps: u16) -> Result<(), EscrowError> {
            let caller = self.env().caller();
            if caller != self.owner {
                return Err(EscrowError::Unauthorized);
            }
            self.fee_bps = new_fee_bps;
            Ok(())
        }

        /// Getter functions
        #[ink(message)]
        pub fn get_contract_info(&self) -> (AccountId, u16, bool, u128) {
            (self.owner, self.fee_bps, self.paused, self.total_volume)
        }
    }
}