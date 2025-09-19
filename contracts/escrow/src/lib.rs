#![cfg_attr(not(feature = "std"), no_std, no_main)]
#![allow(clippy::too_many_arguments)]
#![allow(clippy::cast_possible_truncation)]
#![allow(clippy::arithmetic_side_effects)]
#![allow(clippy::needless_borrows_for_generic_args)]

#[ink::contract]
mod escrow_contract {
    use ink::prelude::format;
    use ink::prelude::string::{String, ToString};
    use ink::prelude::vec::Vec;
    use ink::storage::traits::StorageLayout;
    use ink::storage::Mapping;
    use scale::{Decode, Encode};

    // PSP22 interface for USDT integration
    #[allow(dead_code)]
    #[ink::trait_definition]
    pub trait PSP22 {
        // Matches PSP22 ABI selector 0x162df8c2
        #[ink(message, selector = 0x162df8c2)]
        fn total_supply(&self) -> Balance;

        // Matches PSP22 ABI selector 0x6568382f
        #[ink(message, selector = 0x6568382f)]
        fn balance_of(&self, owner: AccountId) -> Balance;

        // Matches PSP22 ABI selector 0x4d47d921
        #[ink(message, selector = 0x4d47d921)]
        fn allowance(&self, owner: AccountId, spender: AccountId) -> Balance;

        // Matches PSP22 ABI selector 0xdb20f9f5
        #[ink(message, selector = 0xdb20f9f5)]
        fn transfer(
            &mut self,
            to: AccountId,
            value: Balance,
            data: Vec<u8>,
        ) -> Result<(), PSP22Error>;

        // transfer_from is not present in provided ABI; keep for compatibility if token supports it
        #[ink(message)]
        fn transfer_from(
            &mut self,
            from: AccountId,
            to: AccountId,
            value: Balance,
            data: Vec<u8>,
        ) -> Result<(), PSP22Error>;

        // Matches PSP22 ABI selector 0xb20f1bbd
        #[ink(message, selector = 0xb20f1bbd)]
        fn approve(&mut self, spender: AccountId, value: Balance) -> Result<(), PSP22Error>;
    }

    /// PSP22 error types
    #[derive(Encode, Decode, Debug, PartialEq, Eq)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum PSP22Error {
        InsufficientBalance,
        InsufficientAllowance,
        Custom(String),
    }

    /// Contract error types
    #[derive(Encode, Decode, Debug, PartialEq, Eq)]
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
        FeeTooHigh,
        TokenNotConfigured,
    }

    /// Escrow status matching frontend
    #[derive(Debug, Clone, PartialEq, Eq, Encode, Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo, StorageLayout))]
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
    #[derive(Debug, Clone, PartialEq, Eq, Encode, Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo, StorageLayout))]
    pub enum MilestoneStatus {
        Pending,
        InProgress,
        Completed,
        Done,
        Funded,
        Disputed,
        Overdue,
    }

    /// Evidence structure matching frontend
    #[derive(Debug, Clone, PartialEq, Eq, Encode, Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo, StorageLayout))]
    pub struct Evidence {
        pub name: String,
        pub url: String,
    }

    /// Milestone structure matching frontend
    #[derive(Debug, Clone, PartialEq, Eq, Encode, Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo, StorageLayout))]
    pub struct Milestone {
        pub id: String,
        pub description: String,
        pub amount: String, // Using string to match frontend
        pub status: MilestoneStatus,
        pub deadline: u64,
        pub completed_at: Option<u64>,
        pub dispute_reason: Option<String>,
        pub dispute_filed_by: Option<AccountId>,
        pub completion_note: Option<String>,
        pub evidence_file: Option<Vec<Evidence>>,
    }

    /// Escrow data structure matching frontend
    #[derive(Debug, Clone, PartialEq, Eq, Encode, Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo, StorageLayout))]
    pub struct EscrowData {
        pub id: String,
        pub creator_address: AccountId,
        pub counterparty_address: AccountId,
        pub counterparty_type: String,
        pub title: String,
        pub description: String,
        pub total_amount: String, // Using string to match frontend
        pub status: EscrowStatus,
        pub created_at: u64,
        pub milestones: Vec<Milestone>,
        pub transaction_hash: Option<String>,
    }

    /// Response structures
    #[derive(Encode, Decode, Debug, PartialEq, Eq)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct ReleaseResponse {
        pub transaction_hash: String,
        pub status: String,
        pub message: String,
        pub receiver_address: AccountId,
        pub payer_address: AccountId,
    }

    #[derive(Encode, Decode, Debug, PartialEq, Eq)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct DisputeResponse {
        pub dispute_id: String,
        pub status: String,
        pub message: String,
    }

    #[derive(Encode, Decode, Debug, PartialEq, Eq)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct NotificationResponse {
        pub notification_id: String,
        pub status: String,
        pub message: String,
    }

    #[derive(Encode, Decode, Debug, PartialEq, Eq)]
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
        /// Mapping of escrow ID to total deposited token amount (in base units)
        escrow_deposits: Mapping<String, Balance>,
        /// Contract paused state
        paused: bool,
        /// USDT token contract address
        usdt_token: AccountId,
        /// Default escrow duration (90 days in milliseconds)
        default_duration: u64,
        /// Total volume processed
        total_volume: u128,
        /// Token decimals for converting human-readable amounts to base units
        token_decimals: u8,
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
    pub struct MilestoneTaskDone {
        #[ink(topic)]
        pub escrow_id: String,
        #[ink(topic)]
        pub milestone_id: String,
        pub completion_note: String,
        pub evidence_file: Vec<Evidence>,
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
                escrow_deposits: Mapping::new(),
                paused: false,
                usdt_token,
                default_duration: 90 * 24 * 60 * 60 * 1000, // 90 days in ms
                total_volume: 0,
                token_decimals: 6, // default to 6 (common for USDC/USDT on many chains)
            }
        }

        /// Create a new escrow
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
        ) -> Result<String, EscrowError> {
            if self.paused {
                return Err(EscrowError::ContractPaused);
            }

            let caller = self.env().caller();

            // Generate unique escrow ID
            self.escrow_counter += 1;
            let escrow_id = format!("escrow_{}", self.escrow_counter);

            // Parse status
            let escrow_status = self.parse_escrow_status(&status)?;

            // Create escrow data
            let escrow_data = EscrowData {
                id: escrow_id.clone(),
                creator_address: caller,
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
            let mut user_escrow_list = self.user_escrows.get(&caller).unwrap_or_default();
            user_escrow_list.push(escrow_id.clone());
            self.user_escrows.insert(&caller, &user_escrow_list);

            // Also add to counterparty's list
            let mut counterparty_escrow_list = self
                .user_escrows
                .get(&counterparty_address)
                .unwrap_or_default();
            counterparty_escrow_list.push(escrow_id.clone());
            self.user_escrows
                .insert(&counterparty_address, &counterparty_escrow_list);

            // Emit event
            self.env().emit_event(EscrowCreated {
                escrow_id: escrow_id.clone(),
                creator: caller,
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
            self.escrows
                .get(&escrow_id)
                .ok_or(EscrowError::EscrowNotFound)
        }

        /// Get milestone details
        #[ink(message)]
        pub fn get_escrow_milestone(
            &self,
            escrow_id: String,
            milestone_id: String,
        ) -> Result<Milestone, EscrowError> {
            let escrow = self.get_escrow(escrow_id)?;
            escrow
                .milestones
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
            let milestone_index = escrow
                .milestones
                .iter()
                .position(|m| m.id == milestone.id)
                .ok_or(EscrowError::MilestoneNotFound)?;

            let old_status = escrow.milestones[milestone_index].status.clone();
            let new_milestone_status = self.parse_milestone_status(&new_status)?;

            escrow.milestones[milestone_index].status = new_milestone_status.clone();
            if new_milestone_status == MilestoneStatus::Completed {
                escrow.milestones[milestone_index].completed_at =
                    Some(self.env().block_timestamp());
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
        pub fn list_escrows(&self) -> Result<Vec<EscrowData>, EscrowError> {
            if self.paused {
                return Err(EscrowError::ContractPaused);
            }

            let caller = self.env().caller();
            let escrow_ids = self.user_escrows.get(&caller).unwrap_or_default();

            let escrows: Vec<EscrowData> = escrow_ids
                .iter()
                .filter_map(|id| self.escrows.get(id))
                .collect();

            Ok(escrows)
        }

        /// Notify the contract about a token deposit made for a specific escrow
        /// This should be called by the depositor (or UI) after transferring tokens to the contract address
        /// `amount_str` is human-readable and will be converted using `token_decimals`
        #[ink(message)]
        pub fn notify_deposit(
            &mut self,
            escrow_id: String,
            amount_str: String,
        ) -> Result<Balance, EscrowError> {
            if self.paused {
                return Err(EscrowError::ContractPaused);
            }

            // Ensure escrow exists
            let _ = self.get_escrow(escrow_id.clone())?;

            // Parse amount to base units
            let amount = self
                .parse_amount_to_base_units(&amount_str)
                .map_err(|_| EscrowError::InvalidAmount)?;

            // Optional: verify contract actually has at least this much balance (best-effort)
            let token: ink::contract_ref!(PSP22) = self.usdt_token.into();
            let contract_balance = token.balance_of(self.env().account_id());
            let current_deposit = self.escrow_deposits.get(&escrow_id).unwrap_or(0);
            if contract_balance < current_deposit.saturating_add(amount) {
                return Err(EscrowError::InsufficientBalance);
            }

            // Update per-escrow deposit ledger
            let new_total = current_deposit.saturating_add(amount);
            self.escrow_deposits.insert(&escrow_id, &new_total);

            Ok(new_total)
        }

        /// Mark milestone as completed by counterparty
        #[ink(message)]
        pub fn complete_milestone_task(
            &mut self,
            escrow_id: String,
            milestone_id: String,
            completion_note: Option<String>,
            evidence_file: Option<Vec<Evidence>>,
        ) -> Result<(), EscrowError> {
            if self.paused {
                return Err(EscrowError::ContractPaused);
            }

            let mut escrow = self.get_escrow(escrow_id.clone())?;
            let caller = self.env().caller();

            // Only counterparty (service provider) can mark as completed
            if caller != escrow.counterparty_address {
                return Err(EscrowError::Unauthorized);
            }

            // Find milestone
            let milestone_index = escrow
                .milestones
                .iter()
                .position(|m| m.id == milestone_id)
                .ok_or(EscrowError::MilestoneNotFound)?;

            let milestone = &mut escrow.milestones[milestone_index];

            // Can only complete milestones that has is in progress
            if milestone.status != MilestoneStatus::InProgress {
                return Err(EscrowError::InvalidStatus);
            }

            // Update milestone
            milestone.status = MilestoneStatus::Done;
            milestone.completed_at = Some(self.env().block_timestamp());
            if let Some(note) = completion_note {
                milestone.completion_note = Some(note);
            }
            if let Some(files) = evidence_file {
                milestone.evidence_file = Some(files);
            }

            // Update storage
            self.escrows.insert(&escrow_id, &escrow);

            // Emit event
            self.env().emit_event(MilestoneStatusChanged {
                escrow_id,
                milestone_id,
                old_status: MilestoneStatus::InProgress,
                new_status: MilestoneStatus::Done,
            });

            Ok(())
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
            if caller != escrow.creator_address && caller != escrow.counterparty_address {
                return Err(EscrowError::Unauthorized);
            }

            // Find milestone
            let milestone_index = escrow
                .milestones
                .iter()
                .position(|m| m.id == milestone_id)
                .ok_or(EscrowError::MilestoneNotFound)?;

            // Parse amount (convert human-readable string to base units for calculation)
            let amount_str = escrow.milestones[milestone_index].amount.clone();
            let amount: Balance = self
                .parse_amount_to_base_units(&amount_str)
                .map_err(|_| EscrowError::InvalidAmount)?;

            // Validate fee configuration
            if self.fee_bps > 10_000 {
                return Err(EscrowError::FeeTooHigh);
            }

            // Calculate fee
            let fee = amount * self.fee_bps as u128 / 10000;
            let release_amount = amount - fee;

            // Create PSP22 reference for USDT token
            let mut token: ink::contract_ref!(PSP22) = self.usdt_token.into();

            // Ensure the escrow has sufficient deposited balance
            let escrow_available = self.escrow_deposits.get(&escrow_id).unwrap_or(0);
            if escrow_available < amount {
                return Err(EscrowError::InsufficientBalance);
            }

            // Optional: also ensure contract's global token balance is sufficient
            let contract_balance = token.balance_of(self.env().account_id());
            if contract_balance < amount {
                return Err(EscrowError::InsufficientBalance);
            }

            // Transfer USDT from escrow contract to provider
            let transfer_result =
                token.transfer(escrow.counterparty_address, release_amount, Vec::new());

            match transfer_result {
                Ok(_) => {
                    // Transfer fee to fee account if > 0
                    if fee > 0 {
                        let _ = token.transfer(self.fee_account, fee, Vec::new());
                    }

                    // Update milestone status
                    escrow.milestones[milestone_index].status = MilestoneStatus::Funded;

                    // Update escrow
                    self.escrows.insert(&escrow_id, &escrow);

                    // Update total volume
                    self.total_volume += amount;

                    // Deduct from escrow's deposited ledger
                    let remaining = escrow_available.saturating_sub(amount);
                    self.escrow_deposits.insert(&escrow_id, &remaining);

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

        /// Mark milestone as completed by counterparty
        #[ink(message)]
        pub fn complete_milestone(
            &mut self,
            escrow_id: String,
            milestone_id: String,
        ) -> Result<(), EscrowError> {
            if self.paused {
                return Err(EscrowError::ContractPaused);
            }

            let mut escrow = self.get_escrow(escrow_id.clone())?;
            let caller = self.env().caller();

            // Add proper authorization check - only creator or counterparty can complete
            if caller != escrow.creator_address && caller != escrow.counterparty_address {
                return Err(EscrowError::Unauthorized);
            }

            // Find milestone
            let milestone_index = escrow
                .milestones
                .iter()
                .position(|m| m.id == milestone_id)
                .ok_or(EscrowError::MilestoneNotFound)?;

            let milestone = &mut escrow.milestones[milestone_index];
            let old_status = milestone.status.clone(); // Store old status for event

            // Can only complete funded milestones
            if milestone.status != MilestoneStatus::Funded {
                return Err(EscrowError::InvalidStatus);
            }

            // Update milestone
            milestone.status = MilestoneStatus::Completed;

            // Update storage
            self.escrows.insert(&escrow_id, &escrow);

            // Emit event with correct status values
            self.env().emit_event(MilestoneStatusChanged {
                escrow_id: escrow_id.clone(),
                milestone_id: milestone_id.clone(),
                old_status, // Use stored old status
                new_status: MilestoneStatus::Completed,
            });

            // Check and auto-complete escrow if all milestones are done
            let _ = self.check_and_update_escrow_completion(escrow_id);

            Ok(())
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
            let milestone_index = escrow
                .milestones
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
        pub fn check_transaction_status(
            &self,
            transaction_hash: String,
        ) -> Result<TransactionStatus, EscrowError> {
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
                "Done" => Ok(MilestoneStatus::Done),
                "Funded" => Ok(MilestoneStatus::Funded),
                "Completed" => Ok(MilestoneStatus::Completed),
                "Disputed" => Ok(MilestoneStatus::Disputed),
                "Overdue" => Ok(MilestoneStatus::Overdue),
                _ => Err(EscrowError::InvalidStatus),
            }
        }

        /// Convert a human-readable token amount string to base units using token_decimals
        /// Accepts strings like "10", "10.5", "0.000001" and converts using self.token_decimals
        fn parse_amount_to_base_units(&self, amount_str: &str) -> Result<Balance, ()> {
            // Trim whitespace
            let s = amount_str.trim();
            if s.is_empty() {
                return Err(());
            }

            // Split on decimal point if present
            let parts: Vec<&str> = s.split('.').collect();
            if parts.len() > 2 {
                return Err(());
            }

            let integer_part = parts[0];
            let fractional_part = if parts.len() == 2 { parts[1] } else { "" };

            // Ensure only digits
            if !integer_part.chars().all(|c| c.is_ascii_digit()) {
                return Err(());
            }
            if !fractional_part.chars().all(|c| c.is_ascii_digit()) {
                return Err(());
            }

            // Pad or truncate fractional to token_decimals
            let decimals = self.token_decimals as usize;
            let mut fractional_adjusted = fractional_part.to_string();
            if fractional_adjusted.len() < decimals {
                fractional_adjusted.push_str(&"0".repeat(decimals - fractional_adjusted.len()));
            } else if fractional_adjusted.len() > decimals {
                // Truncate extra precision
                fractional_adjusted.truncate(decimals);
            }

            // Build full number string
            let full_number = if decimals == 0 {
                integer_part.to_string()
            } else {
                format!("{}{}", integer_part, fractional_adjusted)
            };

            // Remove leading zeros to avoid parse issues, but leave at least one zero
            let full_trimmed = full_number.trim_start_matches('0');
            let normalized = if full_trimmed.is_empty() {
                "0"
            } else {
                full_trimmed
            };

            normalized.parse::<Balance>().map_err(|_| ())
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
            if new_fee_bps > 10_000 {
                return Err(EscrowError::FeeTooHigh);
            }
            self.fee_bps = new_fee_bps;
            Ok(())
        }

        /// Update the PSP22 token contract address used for payments
        #[ink(message)]
        pub fn set_usdt_token(&mut self, new_token_address: AccountId) -> Result<(), EscrowError> {
            let caller = self.env().caller();
            if caller != self.owner {
                return Err(EscrowError::Unauthorized);
            }
            self.usdt_token = new_token_address;
            Ok(())
        }

        /// Get the current PSP22 token contract address
        #[ink(message)]
        pub fn get_usdt_token(&self) -> AccountId {
            self.usdt_token
        }

        /// Get token configuration (token address, decimals, fee_bps)
        #[ink(message)]
        pub fn get_token_config(&self) -> (AccountId, u8, u16) {
            (self.usdt_token, self.token_decimals, self.fee_bps)
        }

        /// Get this contract's current PSP22 token balance
        #[ink(message)]
        pub fn get_token_balance(&self) -> Balance {
            let token: ink::contract_ref!(PSP22) = self.usdt_token.into();
            token.balance_of(self.env().account_id())
        }

        /// Update token decimals used for conversions (owner-only)
        #[ink(message)]
        pub fn set_token_decimals(&mut self, new_token_decimals: u8) -> Result<(), EscrowError> {
            let caller = self.env().caller();
            if caller != self.owner {
                return Err(EscrowError::Unauthorized);
            }
            self.token_decimals = new_token_decimals;
            Ok(())
        }

        /// Atomically set token address and decimals (owner-only)
        #[ink(message)]
        pub fn set_token_and_decimals(
            &mut self,
            new_token_address: AccountId,
            new_token_decimals: u8,
        ) -> Result<(), EscrowError> {
            let caller = self.env().caller();
            if caller != self.owner {
                return Err(EscrowError::Unauthorized);
            }
            self.usdt_token = new_token_address;
            self.token_decimals = new_token_decimals;
            Ok(())
        }

        /// Helper function to check if all milestones are completed and update escrow status
        fn check_and_update_escrow_completion(
            &mut self,
            escrow_id: String,
        ) -> Result<bool, EscrowError> {
            let mut escrow = self.get_escrow(escrow_id.clone())?;

            // Skip if already completed
            if escrow.status == EscrowStatus::Completed {
                return Ok(false);
            }

            // Check if all milestones are completed
            let all_completed = escrow
                .milestones
                .iter()
                .all(|milestone| milestone.status == MilestoneStatus::Completed);

            if all_completed && !escrow.milestones.is_empty() {
                let old_status = escrow.status.clone();
                escrow.status = EscrowStatus::Completed;

                // Clone escrow_id before using it in insert to avoid move issues
                let escrow_id_for_event = escrow_id.clone();

                // Update storage
                self.escrows.insert(&escrow_id, &escrow);

                // Emit event using cloned escrow_id
                self.env().emit_event(EscrowStatusChanged {
                    escrow_id: escrow_id_for_event,
                    old_status,
                    new_status: EscrowStatus::Completed,
                    transaction_hash: None,
                });

                return Ok(true);
            }

            Ok(false)
        }

        /// Getter functions
        #[ink(message)]
        pub fn get_contract_info(&self) -> (AccountId, u16, bool, u128) {
            (self.owner, self.fee_bps, self.paused, self.total_volume)
        }

        /// Debug 1: Check token contract configuration
        #[ink(message)]
        pub fn debug_token_config(&self) -> Result<(AccountId, Balance, u8, String), EscrowError> {
            let token: ink::contract_ref!(PSP22) = self.usdt_token.into();

            // Try to get contract balance - this will fail if token address is wrong
            let balance_result = token.balance_of(self.env().account_id());

            Ok((
                self.usdt_token,     // Token contract address
                balance_result,      // Contract's token balance
                self.token_decimals, // Configured decimals
                "Token config retrieved".to_string(),
            ))
        }

        /// Debug 2: Test basic token transfer capability
        #[ink(message)]
        pub fn debug_test_transfer(
            &mut self,
            to: AccountId,
            amount_str: String,
        ) -> Result<String, EscrowError> {
            // Parse amount using contract's logic
            let amount = self
                .parse_amount_to_base_units(&amount_str)
                .map_err(|_| EscrowError::InvalidAmount)?;

            let mut token: ink::contract_ref!(PSP22) = self.usdt_token.into();

            // Check contract balance first
            let contract_balance = token.balance_of(self.env().account_id());
            if contract_balance < amount {
                return Ok(format!(
                    "Insufficient balance. Contract has: {}, Requested: {}",
                    contract_balance, amount
                ));
            }

            // Try the transfer
            match token.transfer(to, amount, Vec::new()) {
                Ok(_) => Ok("Transfer successful".to_string()),
                Err(e) => Ok(format!("Transfer failed: {:?}", e)),
            }
        }

        /// Debug 3: Check amount parsing logic
        #[ink(message)]
        pub fn debug_amount_parsing(
            &self,
            amount_str: String,
        ) -> Result<(Balance, String), EscrowError> {
            match self.parse_amount_to_base_units(&amount_str) {
                Ok(parsed) => Ok((
                    parsed,
                    format!("Parsed '{}' to {} base units", amount_str, parsed),
                )),
                Err(_) => Err(EscrowError::InvalidAmount),
            }
        }

        /// Debug 4: Check PSP22 token interface compatibility
        #[ink(message)]
        pub fn debug_token_interface(&self) -> Result<(Balance, Balance), EscrowError> {
            let token: ink::contract_ref!(PSP22) = self.usdt_token.into();
            let contract_id = self.env().account_id();

            // Test all critical PSP22 methods
            let total_supply = token.total_supply();
            let our_balance = token.balance_of(contract_id);

            Ok((total_supply, our_balance))
        }

        #[ink(message)]
        pub fn debug_escrow_deposits(
            &self,
            escrow_id: String,
        ) -> Result<(Balance, String), EscrowError> {
            let escrow_available = self.escrow_deposits.get(&escrow_id).unwrap_or(0);
            Ok((
                escrow_available,
                format!(
                    "Escrow '{}' has {} base units deposited",
                    escrow_id, escrow_available
                ),
            ))
        }

        /// Debug 5: Detailed milestone release simulation (without actual transfer)
        #[ink(message)]
        pub fn debug_milestone_release_simulation(
            &self,
            escrow_id: String,
            milestone_id: String,
        ) -> Result<String, EscrowError> {
            let escrow = self.get_escrow(escrow_id.clone())?;
            let caller = self.env().caller();

            // Check authorization
            if caller != escrow.creator_address && caller != escrow.counterparty_address {
                return Ok("FAIL: Unauthorized caller".to_string());
            }

            // Find milestone
            let milestone = escrow
                .milestones
                .iter()
                .find(|m| m.id == milestone_id)
                .ok_or(EscrowError::MilestoneNotFound)?;

            // Parse amount
            let amount = match self.parse_amount_to_base_units(&milestone.amount) {
                Ok(amt) => amt,
                Err(_) => return Ok("FAIL: Amount parsing error".to_string()),
            };

            // Check token balance
            let token: ink::contract_ref!(PSP22) = self.usdt_token.into();
            let contract_balance = token.balance_of(self.env().account_id());

            // Calculate fees
            let fee = amount * self.fee_bps as u128 / 10000;
            let release_amount = amount - fee;

            Ok(format!(
                "Simulation Results:\n\
        - Milestone Amount: {} ({})\n\
        - Parsed Amount: {}\n\
        - Contract Balance: {}\n\
        - Fee ({}bps): {}\n\
        - Release Amount: {}\n\
        - Balance Check: {}\n\
        - Recipient: {:?}",
                milestone.amount,
                amount,
                amount,
                contract_balance,
                self.fee_bps,
                fee,
                release_amount,
                if contract_balance >= amount {
                    "PASS"
                } else {
                    "FAIL"
                },
                escrow.counterparty_address
            ))
        }

        /// Debug 6: Check escrow and milestone status
        #[ink(message)]
        pub fn debug_escrow_status(&self, escrow_id: String) -> Result<String, EscrowError> {
            let escrow = self.get_escrow(escrow_id)?;

            let milestones_info = escrow
                .milestones
                .iter()
                .map(|m| format!("ID: {}, Amount: {}, Status: {:?}", m.id, m.amount, m.status))
                .collect::<Vec<_>>()
                .join("\n  ");

            Ok(format!(
                "Escrow Status:\n\
        - ID: {}\n\
        - Creator: {:?}\n\
        - Counterparty: {:?}\n\
        - Total Amount: {}\n\
        - Status: {:?}\n\
        - Milestones:\n  {}",
                escrow.id,
                escrow.creator_address,
                escrow.counterparty_address,
                escrow.total_amount,
                escrow.status,
                milestones_info
            ))
        }

        /// Debug 7: Check who can call functions
        #[ink(message)]
        pub fn debug_caller_info(&self, escrow_id: String) -> Result<String, EscrowError> {
            let escrow = self.get_escrow(escrow_id)?;
            let caller = self.env().caller();

            Ok(format!(
                "Caller Analysis:\n\
        - Current Caller: {:?}\n\
        - Escrow Creator: {:?}\n\
        - Escrow Counterparty: {:?}\n\
        - Is Creator: {}\n\
        - Is Counterparty: {}\n\
        - Can Release: {}",
                caller,
                escrow.creator_address,
                escrow.counterparty_address,
                caller == escrow.creator_address,
                caller == escrow.counterparty_address,
                caller == escrow.creator_address || caller == escrow.counterparty_address
            ))
        }

        /// Debug 8: Comprehensive diagnosis
        #[ink(message)]
        pub fn debug_comprehensive_diagnosis(
            &self,
            escrow_id: String,
            milestone_id: String,
        ) -> Result<Vec<String>, EscrowError> {
            let mut issues = Vec::new();

            // Check 1: Contract config
            let token: ink::contract_ref!(PSP22) = self.usdt_token.into();
            let contract_balance = token.balance_of(self.env().account_id());
            if contract_balance == 0 {
                issues.push("CRITICAL: Contract has zero token balance".to_string());
            }

            // Check 2: Escrow exists
            let escrow = match self.get_escrow(escrow_id.clone()) {
                Ok(e) => e,
                Err(_) => {
                    issues.push("CRITICAL: Escrow not found".to_string());
                    return Ok(issues);
                }
            };

            // Check 3: Milestone exists
            let milestone = match escrow.milestones.iter().find(|m| m.id == milestone_id) {
                Some(m) => m,
                None => {
                    issues.push("CRITICAL: Milestone not found".to_string());
                    return Ok(issues);
                }
            };

            // Check 4: Amount parsing
            let amount = match self.parse_amount_to_base_units(&milestone.amount) {
                Ok(amt) => amt,
                Err(_) => {
                    issues.push(format!(
                        "CRITICAL: Cannot parse amount '{}'",
                        milestone.amount
                    ));
                    return Ok(issues);
                }
            };

            // Check 5: Sufficient balance
            if contract_balance < amount {
                issues.push(format!(
                    "CRITICAL: Insufficient balance. Need: {}, Have: {}",
                    amount, contract_balance
                ));
            }

            // Check 6: Authorization
            let caller = self.env().caller();
            if caller != escrow.creator_address && caller != escrow.counterparty_address {
                issues.push("CRITICAL: Caller not authorized".to_string());
            }

            // Check 7: Fee calculation
            if self.fee_bps > 10_000 {
                issues.push("ERROR: Fee too high".to_string());
            }

            if issues.is_empty() {
                issues.push("All checks PASSED - release should work".to_string());
            }

            Ok(issues)
        }
    }

    /// Default implementation
    impl Default for EscrowContract {
        fn default() -> Self {
            Self::new(AccountId::from([0u8; 32]), AccountId::from([0u8; 32]))
        }
    }
}
