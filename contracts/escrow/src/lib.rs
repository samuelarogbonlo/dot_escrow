#![cfg_attr(not(feature = "std"), no_std, no_main)]
#![allow(clippy::too_many_arguments)]
#![allow(clippy::cast_possible_truncation)]
#![allow(clippy::arithmetic_side_effects)]
#![allow(clippy::needless_borrows_for_generic_args)]
#![allow(clippy::vec_init_then_push)]

#[ink::contract]
mod escrow_contract {
    use ink::prelude::format;
    use ink::prelude::string::{String, ToString};
    use ink::prelude::vec::Vec;
    #[allow(unused_imports)]
    use ink::storage::traits::StorageLayout;
    use ink::storage::Mapping;
    use scale::{Decode, Encode};


    // PSP22 interface for USDT integration
    #[allow(dead_code)]
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

    impl From<PSP22Error> for EscrowError {
        fn from(err: PSP22Error) -> Self {
            match err {
                PSP22Error::InsufficientBalance => EscrowError::InsufficientBalance,
                PSP22Error::InsufficientAllowance => EscrowError::TokenTransferFailed,
                PSP22Error::Custom(_) => EscrowError::TokenTransferFailed,
            }
        }
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

    /// Milestone input structure for create_escrow (accepts status as String)
    /// Evidence can be provided as URLs (strings) which will be converted to Evidence structs
    #[derive(Debug, Clone, PartialEq, Eq, Encode, Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct MilestoneInput {
        pub id: String,
        pub description: String,
        pub amount: String,
        pub status: String,
        pub deadline: u64,
        pub completed_at: Option<u64>,
        pub dispute_reason: Option<String>,
        pub dispute_filed_by: Option<Address>,
        pub completion_note: Option<String>,
        pub evidence_file: Option<Vec<String>>, // Accept URLs as strings, convert to Evidence in contract
    }

    /// Milestone structure matching frontend
    #[derive(Debug, Clone, PartialEq, Eq, Encode, Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo, StorageLayout))]
    pub struct Milestone {
        pub id: String,
        pub description: String,
        pub amount: String,
        pub status: MilestoneStatus,
        pub deadline: u64,
        pub completed_at: Option<u64>,
        pub dispute_reason: Option<String>,
        pub dispute_filed_by: Option<Address>,
        pub completion_note: Option<String>,
        pub evidence_file: Option<Vec<Evidence>>,
    }

    /// Escrow data structure matching frontend
    #[derive(Debug, Clone, PartialEq, Eq, Encode, Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo, StorageLayout))]
    pub struct EscrowData {
        pub id: String,
        pub creator_address: Address,
        pub counterparty_address: Address,
        pub counterparty_type: String,
        pub title: String,
        pub description: String,
        pub total_amount: String,
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
        pub receiver_account_id: Address,
        pub payer_account_id: Address,
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

    /// Multi-signature governance structures
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

    #[derive(Encode, Decode, Debug, PartialEq, Eq, Clone)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo, StorageLayout))]
    pub struct AdminProposal {
        pub id: u64,
        pub action: ProposalAction,
        pub created_by: Address,
        pub created_at: u64,
        pub approvals: Vec<Address>,
        pub executed: bool,
        pub executed_at: Option<u64>,
    }

    /// Contract storage
    #[ink(storage)]
    pub struct EscrowContract {
        owner: Address,
        fee_bps: u16,
        fee_account: Address,
        escrow_counter: u64,
        escrows: Mapping<String, EscrowData>,
        user_escrows: Mapping<Address, Vec<String>>,
        escrow_deposits: Mapping<String, Balance>,
        paused: bool,
        usdt_token: Address,
        default_duration: u64,
        total_volume: u128,
        token_decimals: u8,
        admin_signers: Vec<Address>,
        signature_threshold: u8,
        proposal_counter: u64,
        proposals: Mapping<u64, AdminProposal>,
    }

    /// Events
    #[ink(event)]
    pub struct EscrowCreated {
        pub escrow_id: String,
        pub creator: Address,
        pub counterparty: Address,
        pub counterparty_type: String,
        pub title: String,
        pub total_amount: String,
        pub transaction_hash: Option<String>,
    }

    #[ink(event)]
    pub struct EscrowStatusChanged {
        pub escrow_id: String,
        pub old_status: EscrowStatus,
        pub new_status: EscrowStatus,
        pub transaction_hash: Option<String>,
    }

    #[ink(event)]
    pub struct MilestoneStatusChanged {
        pub escrow_id: String,
        pub milestone_id: String,
        pub old_status: MilestoneStatus,
        pub new_status: MilestoneStatus,
    }

    #[ink(event)]
    pub struct MilestoneReleased {
        pub escrow_id: String,
        pub milestone_id: String,
        pub receiver_account_id: Address,
        pub payer_account_id: Address,
        pub amount: String,
        pub transaction_hash: String,
    }

    #[ink(event)]
    pub struct MilestoneTaskDone {
        pub escrow_id: String,
        pub milestone_id: String,
        pub completion_note: String,
        pub evidence_file: Vec<Evidence>,
    }

    #[ink(event)]
    pub struct MilestoneDisputed {
        pub escrow_id: String,
        pub milestone_id: String,
        pub filed_by: Address,
        pub reason: String,
        pub dispute_id: String,
    }

    #[ink(event)]
    pub struct CounterpartyNotified {
        pub escrow_id: String,
        pub notification_type: String,
        pub sender_account_id: Address,
        pub recipient_account_id: Address,
        pub notification_id: String,
    }

    #[ink(event)]
    pub struct ProposalCreated {
        pub proposal_id: u64,
        pub action: ProposalAction,
        pub created_by: Address,
    }

    #[ink(event)]
    pub struct ProposalApproved {
        pub proposal_id: u64,
        pub approved_by: Address,
        pub approvals_count: u8,
    }

    #[ink(event)]
    pub struct ProposalExecuted {
        pub proposal_id: u64,
        pub executed_by: Address,
    }

    #[ink(event)]
    pub struct AdminSignerAdded {
        pub signer: Address,
        pub added_by: Address,
    }

    #[ink(event)]
    pub struct AdminSignerRemoved {
        pub signer: Address,
        pub removed_by: Address,
    }

    #[ink(event)]
    pub struct ThresholdChanged {
        pub old_threshold: u8,
        pub new_threshold: u8,
        pub changed_by: Address,
    }

    impl EscrowContract {
        /// Constructor
        #[ink(constructor)]
        pub fn new(usdt_token: Address, fee_account: Address) -> Self {
            let caller = Self::env().caller(); // In ink! v6, caller() returns Address directly
            let mut admin_signers = Vec::new();
            admin_signers.push(caller);

            Self {
                owner: caller,
                fee_bps: 100,
                fee_account,
                escrow_counter: 0,
                escrows: Mapping::new(),
                user_escrows: Mapping::new(),
                escrow_deposits: Mapping::new(),
                paused: false,
                usdt_token,
                default_duration: 90 * 24 * 60 * 60 * 1000,
                total_volume: 0,
                token_decimals: 6,
                admin_signers,
                signature_threshold: 1,
                proposal_counter: 0,
                proposals: Mapping::new(),
            }
        }

        /// Helper to convert AccountId (32 bytes) to Address/H160 (20 bytes)
        /// Takes the first 20 bytes of the AccountId to match frontend conversion
        fn account_id_to_address(account_id: AccountId) -> Address {
            let account_bytes: &[u8; 32] = account_id.as_ref();
            let mut address_bytes = [0u8; 20];
            address_bytes.copy_from_slice(&account_bytes[0..20]);
            Address::from(address_bytes)
        }

        /// Create a new escrow
        #[ink(message)]
        pub fn create_escrow(
            &mut self,
            counterparty_address: Address,
            counterparty_type: String,
            status: String,
            title: String,
            description: String,
            total_amount: String,
            milestones_input: Vec<MilestoneInput>,
            transaction_hash: Option<String>,
        ) -> Result<String, EscrowError> {
            if self.paused {
                return Err(EscrowError::ContractPaused);
            }

            let caller = Self::env().caller(); // In ink! v6, caller() returns Address directly

            self.escrow_counter += 1;
            let escrow_id = format!("escrow_{}", self.escrow_counter);

            let escrow_status = self.parse_escrow_status(&status)?;

            // Convert MilestoneInput to Milestone by parsing status strings and converting evidence URLs
            let milestones: Result<Vec<Milestone>, EscrowError> = milestones_input
                .into_iter()
                .map(|m_input| {
                    let milestone_status = self.parse_milestone_status(&m_input.status)?;
                    
                    // Convert evidence URLs (strings) to Evidence structs
                    let evidence_file: Option<Vec<Evidence>> = m_input.evidence_file.map(|urls| {
                        urls.into_iter()
                            .map(|url| Evidence {
                                name: String::new(), // Empty name, frontend can set this if needed
                                url,
                            })
                            .collect()
                    });
                    
                    Ok(Milestone {
                        id: m_input.id,
                        description: m_input.description,
                        amount: m_input.amount,
                        status: milestone_status,
                        deadline: m_input.deadline,
                        completed_at: m_input.completed_at,
                        dispute_reason: m_input.dispute_reason,
                        dispute_filed_by: m_input.dispute_filed_by,
                        completion_note: m_input.completion_note,
                        evidence_file,
                    })
                })
                .collect();

            let milestones = milestones?;

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

            self.escrows.insert(&escrow_id, &escrow_data);

            let mut user_escrow_list = self.user_escrows.get(&caller).unwrap_or_default();
            user_escrow_list.push(escrow_id.clone());
            self.user_escrows.insert(&caller, &user_escrow_list);

            let mut counterparty_escrow_list = self
                .user_escrows
                .get(&counterparty_address)
                .unwrap_or_default();
            counterparty_escrow_list.push(escrow_id.clone());
            self.user_escrows
                .insert(&counterparty_address, &counterparty_escrow_list);

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
            let caller = Self::env().caller(); // In ink! v6, caller() returns Address directly

            if caller != escrow.creator_address && caller != escrow.counterparty_address {
                return Err(EscrowError::Unauthorized);
            }

            let old_status = escrow.status.clone();
            let new_escrow_status = self.parse_escrow_status(&new_status)?;

            escrow.status = new_escrow_status.clone();
            if let Some(hash) = transaction_hash.clone() {
                escrow.transaction_hash = Some(hash);
            }

            self.escrows.insert(&escrow_id, &escrow);

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
            let caller = self.env().caller(); // In ink! v6, caller() returns Address directly

            if caller != escrow.creator_address && caller != escrow.counterparty_address {
                return Err(EscrowError::Unauthorized);
            }

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

            self.escrows.insert(&escrow_id, &escrow);

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

            let caller = self.env().caller(); // In ink! v6, caller() returns Address directly
            let escrow_ids = self.user_escrows.get(&caller).unwrap_or_default();

            let escrows: Vec<EscrowData> = escrow_ids
                .iter()
                .filter_map(|id| self.escrows.get(id))
                .collect();

            Ok(escrows)
        }

        /// Notify deposit
        #[ink(message)]
        pub fn notify_deposit(
            &mut self,
            escrow_id: String,
            amount_str: String,
        ) -> Result<Balance, EscrowError> {
            if self.paused {
                return Err(EscrowError::ContractPaused);
            }

            let _ = self.get_escrow(escrow_id.clone())?;

            let amount = self
                .parse_amount_to_base_units(&amount_str)
                .map_err(|_| EscrowError::InvalidAmount)?;

            let contract_address = self.env().address();
            let contract_balance: Balance = self.psp22_balance_of(self.usdt_token, contract_address);
            let current_deposit = self.escrow_deposits.get(&escrow_id).unwrap_or(0);
            if contract_balance < current_deposit.saturating_add(amount) {
                return Err(EscrowError::InsufficientBalance);
            }

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
            let caller = Self::env().caller(); // In ink! v6, caller() returns Address directly

            if caller != escrow.counterparty_address {
                return Err(EscrowError::Unauthorized);
            }

            let milestone_index = escrow
                .milestones
                .iter()
                .position(|m| m.id == milestone_id)
                .ok_or(EscrowError::MilestoneNotFound)?;

            let milestone = &mut escrow.milestones[milestone_index];

            if milestone.status != MilestoneStatus::InProgress {
                return Err(EscrowError::InvalidStatus);
            }

            milestone.status = MilestoneStatus::Done;
            milestone.completed_at = Some(self.env().block_timestamp());
            if let Some(note) = completion_note {
                milestone.completion_note = Some(note);
            }
            if let Some(files) = evidence_file {
                milestone.evidence_file = Some(files);
            }

            self.escrows.insert(&escrow_id, &escrow);

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
            let caller = self.env().caller(); // In ink! v6, caller() returns Address directly

            if caller != escrow.creator_address && caller != escrow.counterparty_address {
                return Err(EscrowError::Unauthorized);
            }

            let milestone_index = escrow
                .milestones
                .iter()
                .position(|m| m.id == milestone_id)
                .ok_or(EscrowError::MilestoneNotFound)?;

            let amount_str = escrow.milestones[milestone_index].amount.clone();
            let amount: Balance = self
                .parse_amount_to_base_units(&amount_str)
                .map_err(|_| EscrowError::InvalidAmount)?;

            if self.fee_bps > 10_000 {
                return Err(EscrowError::FeeTooHigh);
            }

            let fee = amount * self.fee_bps as u128 / 10000;
            let release_amount = amount - fee;

            let escrow_available = self.escrow_deposits.get(&escrow_id).unwrap_or(0);
            if escrow_available < amount {
                return Err(EscrowError::InsufficientBalance);
            }

            let contract_address = self.env().address();
            let contract_balance = self.psp22_balance_of(self.usdt_token, contract_address);
            if contract_balance < amount {
                return Err(EscrowError::InsufficientBalance);
            }

            // Transfer to counterparty
            self.psp22_transfer(
                self.usdt_token,
                escrow.counterparty_address,
                release_amount,
                Vec::new(),
            )?;

            // Transfer fee - fee_account is already Address
            if fee > 0 {
                self.psp22_transfer(self.usdt_token, self.fee_account, fee, Vec::new())?;
            }

            escrow.milestones[milestone_index].status = MilestoneStatus::Funded;

            self.escrows.insert(&escrow_id, &escrow);

            self.total_volume += amount;

            let remaining = escrow_available.saturating_sub(amount);
            self.escrow_deposits.insert(&escrow_id, &remaining);

            let tx_hash = format!("tx_{}", self.env().block_timestamp());

            self.env().emit_event(MilestoneReleased {
                escrow_id,
                milestone_id,
                receiver_account_id: escrow.counterparty_address,
                payer_account_id: escrow.creator_address,
                amount: amount_str,
                transaction_hash: tx_hash.clone(),
            });

            Ok(ReleaseResponse {
                transaction_hash: tx_hash,
                status: "success".to_string(),
                message: "Milestone funds released successfully".to_string(),
                receiver_account_id: escrow.counterparty_address,
                payer_account_id: escrow.creator_address,
            })
        }

        /// Complete milestone
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
            let caller = self.env().caller(); // In ink! v6, caller() returns Address directly

            if caller != escrow.creator_address && caller != escrow.counterparty_address {
                return Err(EscrowError::Unauthorized);
            }

            let milestone_index = escrow
                .milestones
                .iter()
                .position(|m| m.id == milestone_id)
                .ok_or(EscrowError::MilestoneNotFound)?;

            let milestone = &mut escrow.milestones[milestone_index];
            let old_status = milestone.status.clone();

            if milestone.status != MilestoneStatus::Funded {
                return Err(EscrowError::InvalidStatus);
            }

            milestone.status = MilestoneStatus::Completed;

            self.escrows.insert(&escrow_id, &escrow);

            self.env().emit_event(MilestoneStatusChanged {
                escrow_id: escrow_id.clone(),
                milestone_id: milestone_id.clone(),
                old_status,
                new_status: MilestoneStatus::Completed,
            });

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
            let caller = self.env().caller(); // In ink! v6, caller() returns Address directly

            if caller != escrow.creator_address && caller != escrow.counterparty_address {
                return Err(EscrowError::Unauthorized);
            }

            let milestone_index = escrow
                .milestones
                .iter()
                .position(|m| m.id == milestone_id)
                .ok_or(EscrowError::MilestoneNotFound)?;

            let milestone = &mut escrow.milestones[milestone_index];

            milestone.status = MilestoneStatus::Disputed;
            milestone.dispute_reason = Some(reason.clone());
            milestone.dispute_filed_by = Some(caller);

            self.escrows.insert(&escrow_id, &escrow);

            let dispute_id = format!("dispute_{}_{}", escrow_id, milestone_id);

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
            recipient_account_id: Address,
            _message: Option<String>,
            _notification_kind: Option<String>,
        ) -> Result<NotificationResponse, EscrowError> {
            if self.paused {
                return Err(EscrowError::ContractPaused);
            }

            let escrow = self.get_escrow(escrow_id.clone())?;
            let caller = self.env().caller(); // In ink! v6, caller() returns Address directly

            if caller != escrow.creator_address && caller != escrow.counterparty_address {
                return Err(EscrowError::Unauthorized);
            }

            let notification_id = format!("notif_{}_{}", escrow_id, self.env().block_timestamp());

            self.env().emit_event(CounterpartyNotified {
                escrow_id,
                notification_type,
                sender_account_id: caller,
                recipient_account_id,
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

        /// Convert a human-readable token amount string to base units
        fn parse_amount_to_base_units(&self, amount_str: &str) -> Result<Balance, ()> {
            let s = amount_str.trim();
            if s.is_empty() {
                return Err(());
            }

            let parts: Vec<&str> = s.split('.').collect();
            if parts.len() > 2 {
                return Err(());
            }

            let integer_part = parts[0];
            let fractional_part = if parts.len() == 2 { parts[1] } else { "" };

            if !integer_part.chars().all(|c| c.is_ascii_digit()) {
                return Err(());
            }
            if !fractional_part.chars().all(|c| c.is_ascii_digit()) {
                return Err(());
            }

            let decimals = self.token_decimals as usize;
            let mut fractional_adjusted = fractional_part.to_string();
            if fractional_adjusted.len() < decimals {
                fractional_adjusted.push_str(&"0".repeat(decimals - fractional_adjusted.len()));
            } else if fractional_adjusted.len() > decimals {
                fractional_adjusted.truncate(decimals);
            }

            let full_number = if decimals == 0 {
                integer_part.to_string()
            } else {
                format!("{}{}", integer_part, fractional_adjusted)
            };

            let full_trimmed = full_number.trim_start_matches('0');
            let normalized = if full_trimmed.is_empty() {
                "0"
            } else {
                full_trimmed
            };

            normalized.parse::<Balance>().map_err(|_| ())
        }

        /// Helper function to check if all milestones are completed
        fn check_and_update_escrow_completion(
            &mut self,
            escrow_id: String,
        ) -> Result<bool, EscrowError> {
            let mut escrow = self.get_escrow(escrow_id.clone())?;

            if escrow.status == EscrowStatus::Completed {
                return Ok(false);
            }

            let all_completed = escrow
                .milestones
                .iter()
                .all(|milestone| milestone.status == MilestoneStatus::Completed);

            if all_completed && !escrow.milestones.is_empty() {
                let old_status = escrow.status.clone();
                escrow.status = EscrowStatus::Completed;

                let escrow_id_for_event = escrow_id.clone();

                self.escrows.insert(&escrow_id, &escrow);

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

        /// Multi-signature governance functions
        #[ink(message)]
        pub fn propose_pause_contract(&mut self) -> Result<u64, EscrowError> {
            self.submit_proposal(ProposalAction::PauseContract)
        }

        #[ink(message)]
        pub fn propose_unpause_contract(&mut self) -> Result<u64, EscrowError> {
            self.submit_proposal(ProposalAction::UnpauseContract)
        }

        #[ink(message)]
        pub fn propose_update_fee(&mut self, new_fee_bps: u16) -> Result<u64, EscrowError> {
            self.submit_proposal(ProposalAction::SetFee(new_fee_bps))
        }

        #[ink(message)]
        pub fn pause_contract(&mut self) -> Result<(), EscrowError> {
            Err(EscrowError::Unauthorized)
        }

        #[ink(message)]
        pub fn unpause_contract(&mut self) -> Result<(), EscrowError> {
            Err(EscrowError::Unauthorized)
        }

        #[ink(message)]
        pub fn update_fee(&mut self, _new_fee_bps: u16) -> Result<(), EscrowError> {
            Err(EscrowError::Unauthorized)
        }

        #[ink(message)]
        pub fn propose_set_usdt_token(
            &mut self,
            new_token_address: Address,
        ) -> Result<u64, EscrowError> {
            self.submit_proposal(ProposalAction::SetUsdtToken(new_token_address))
        }

        #[ink(message)]
        pub fn set_usdt_token(&mut self, new_token_address: Address) -> Result<(), EscrowError> {
            let caller = self.env().caller(); // In ink! v6, caller() returns Address directly

            if caller != self.owner {
                return Err(EscrowError::Unauthorized);
            }

            self.usdt_token = new_token_address;
            Ok(())
        }

        #[ink(message)]
        pub fn get_usdt_token(&self) -> Address {
            self.usdt_token
        }

        #[ink(message)]
        pub fn get_token_config(&self) -> (Address, u8, u16) {
            (self.usdt_token, self.token_decimals, self.fee_bps)
        }

        #[ink(message)]
        pub fn get_token_balance(&self) -> Balance {
            let contract_address = self.env().address();
            self.psp22_balance_of(self.usdt_token, contract_address)
        }

        #[ink(message)]
        pub fn propose_set_token_decimals(
            &mut self,
            new_token_decimals: u8,
        ) -> Result<u64, EscrowError> {
            self.submit_proposal(ProposalAction::SetTokenDecimals(new_token_decimals))
        }

        #[ink(message)]
        pub fn set_token_decimals(&mut self, _new_token_decimals: u8) -> Result<(), EscrowError> {
            Err(EscrowError::Unauthorized)
        }

        #[ink(message)]
        pub fn set_token_and_decimals(
            &mut self,
            _new_token_address: Address,
            _new_token_decimals: u8,
        ) -> Result<(), EscrowError> {
            Err(EscrowError::Unauthorized)
        }

        #[ink(message)]
        pub fn get_contract_info(&self) -> (Address, u16, bool, u128) {
            (self.owner, self.fee_bps, self.paused, self.total_volume)
        }

        #[ink(message)]
        pub fn submit_proposal(&mut self, action: ProposalAction) -> Result<u64, EscrowError> {
            let caller = self.env().caller(); // In ink! v6, caller() returns Address directly

            if !self.admin_signers.contains(&caller) {
                return Err(EscrowError::Unauthorized);
            }

            self.proposal_counter += 1;
            let proposal_id = self.proposal_counter;

            let mut approvals = Vec::new();
            approvals.push(caller);

            let proposal = AdminProposal {
                id: proposal_id,
                action: action.clone(),
                created_by: caller,
                created_at: self.env().block_timestamp(),
                approvals,
                executed: false,
                executed_at: None,
            };

            self.proposals.insert(proposal_id, &proposal);

            self.env().emit_event(ProposalCreated {
                proposal_id,
                action,
                created_by: caller,
            });

            if proposal.approvals.len() >= self.signature_threshold as usize {
                let _ = self.execute_proposal_internal(proposal_id, proposal);
            }

            Ok(proposal_id)
        }

        #[ink(message)]
        pub fn approve_proposal(&mut self, proposal_id: u64) -> Result<(), EscrowError> {
            let caller = self.env().caller(); // In ink! v6, caller() returns Address directly

            if !self.admin_signers.contains(&caller) {
                return Err(EscrowError::Unauthorized);
            }

            let mut proposal = self
                .proposals
                .get(proposal_id)
                .ok_or(EscrowError::EscrowNotFound)?;

            if proposal.executed {
                return Err(EscrowError::InvalidStatus);
            }

            if proposal.approvals.contains(&caller) {
                return Err(EscrowError::InvalidStatus);
            }

            proposal.approvals.push(caller);
            self.proposals.insert(proposal_id, &proposal);

            self.env().emit_event(ProposalApproved {
                proposal_id,
                approved_by: caller,
                approvals_count: proposal.approvals.len() as u8,
            });

            if proposal.approvals.len() >= self.signature_threshold as usize {
                self.execute_proposal_internal(proposal_id, proposal)?;
            }

            Ok(())
        }

        #[ink(message)]
        pub fn execute_proposal(&mut self, proposal_id: u64) -> Result<(), EscrowError> {
            let proposal = self
                .proposals
                .get(proposal_id)
                .ok_or(EscrowError::EscrowNotFound)?;

            if proposal.approvals.len() < self.signature_threshold as usize {
                return Err(EscrowError::Unauthorized);
            }

            self.execute_proposal_internal(proposal_id, proposal)
        }

        fn execute_proposal_internal(
            &mut self,
            proposal_id: u64,
            mut proposal: AdminProposal,
        ) -> Result<(), EscrowError> {
            if proposal.executed {
                return Err(EscrowError::InvalidStatus);
            }

            match &proposal.action {
                ProposalAction::SetFee(new_fee_bps) => {
                    if *new_fee_bps > 10_000 {
                        return Err(EscrowError::FeeTooHigh);
                    }
                    self.fee_bps = *new_fee_bps;
                }
                ProposalAction::SetUsdtToken(new_token) => {
                    self.usdt_token = *new_token;
                }
                ProposalAction::SetTokenDecimals(new_decimals) => {
                    self.token_decimals = *new_decimals;
                }
                ProposalAction::AddSigner(new_signer) => {
                    if !self.admin_signers.contains(new_signer) {
                        self.admin_signers.push(*new_signer);
                        self.env().emit_event(AdminSignerAdded {
                            signer: *new_signer,
                            added_by: proposal.created_by,
                        });
                    }
                }
                ProposalAction::RemoveSigner(signer_to_remove) => {
                    if let Some(pos) = self
                        .admin_signers
                        .iter()
                        .position(|&x| x == *signer_to_remove)
                    {
                        self.admin_signers.remove(pos);
                        self.env().emit_event(AdminSignerRemoved {
                            signer: *signer_to_remove,
                            removed_by: proposal.created_by,
                        });
                    }
                    if self.admin_signers.len() < self.signature_threshold as usize {
                        return Err(EscrowError::Unauthorized);
                    }
                }
                ProposalAction::SetThreshold(new_threshold) => {
                    if *new_threshold == 0 || *new_threshold as usize > self.admin_signers.len() {
                        return Err(EscrowError::Unauthorized);
                    }
                    let old_threshold = self.signature_threshold;
                    self.signature_threshold = *new_threshold;
                    self.env().emit_event(ThresholdChanged {
                        old_threshold,
                        new_threshold: *new_threshold,
                        changed_by: proposal.created_by,
                    });
                }
                ProposalAction::PauseContract => {
                    self.paused = true;
                }
                ProposalAction::UnpauseContract => {
                    self.paused = false;
                }
                ProposalAction::EmergencyWithdraw(recipient, amount) => {
                    let contract_account_id = self.env().address();
                    let balance = self.psp22_balance_of(self.usdt_token, contract_account_id);
                    if balance < *amount {
                        return Err(EscrowError::InsufficientBalance);
                    }
                    let _ = recipient;
                }
            }

            proposal.executed = true;
            proposal.executed_at = Some(self.env().block_timestamp());
            self.proposals.insert(proposal_id, &proposal);

            let executed_by = self.env().caller(); // In ink! v6, caller() returns Address directly
            self.env().emit_event(ProposalExecuted {
                proposal_id,
                executed_by,
            });

            Ok(())
        }

        #[ink(message)]
        pub fn get_admin_signers(&self) -> Vec<Address> {
            self.admin_signers.clone()
        }

        #[ink(message)]
        pub fn get_signature_threshold(&self) -> u8 {
            self.signature_threshold
        }

        #[ink(message)]
        pub fn get_proposal(&self, proposal_id: u64) -> Option<AdminProposal> {
            self.proposals.get(proposal_id)
        }

        #[ink(message)]
        pub fn get_proposal_counter(&self) -> u64 {
            self.proposal_counter
        }

        #[ink(message)]
        pub fn is_admin_signer(&self, account: Address) -> bool {
            self.admin_signers.contains(&account)
        }

        /// PSP22 helper functions - using ink! v6 contract calls
        fn psp22_balance_of(&self, token_address: Address, owner: Address) -> Balance {
            use ink::env::call::{build_call, ExecutionInput, Selector};
            
            build_call::<ink::env::DefaultEnvironment>()
                .call(token_address)
                .exec_input(
                    ExecutionInput::new(Selector::new(ink::selector_bytes!("PSP22::balance_of")))
                        .push_arg(owner)
                )
                .returns::<Balance>()
                .invoke()
        }

        fn psp22_transfer(
            &self,
            token_address: Address,
            to: Address,
            value: Balance,
            data: Vec<u8>,
        ) -> Result<(), PSP22Error> {
            use ink::env::call::{build_call, ExecutionInput, Selector};
            
            build_call::<ink::env::DefaultEnvironment>()
                .call(token_address)
                .exec_input(
                    ExecutionInput::new(Selector::new(ink::selector_bytes!("PSP22::transfer")))
                        .push_arg(to)
                        .push_arg(value)
                        .push_arg(data)
                )
                .returns::<Result<(), PSP22Error>>()
                .invoke()
        }
    }

    /// Default implementation
    impl Default for EscrowContract {
        fn default() -> Self {
            Self::new(Address::from([0u8; 20]), Address::from([0u8; 20]))
        }
    }
}