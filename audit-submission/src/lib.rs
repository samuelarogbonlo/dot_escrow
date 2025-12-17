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
        InvalidEscrowStatus,
        ContractPaused,
        InsufficientBalance,
        TokenTransferFailed,
        DeadlineExceeded,
        AlreadyCompleted,
        InvalidAmount,
        DuplicateId,
        FeeTooHigh,
        TokenNotConfigured,
        ArithmeticOverflow,
        StorageLimitExceeded,
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

    // Storage limits to prevent DoS attacks
    const MAX_MILESTONES: usize = 50;
    const MAX_STRING_LENGTH: usize = 1000;
    const MAX_EVIDENCE_FILES: usize = 10;

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
        /// Initializes a new escrow contract instance with default configuration.
        ///
        /// Creates a new escrow contract and sets the deployer as the initial owner and admin signer.
        /// The signature threshold is set to 1, allowing single-admin operations initially.
        ///
        /// # Arguments
        ///
        /// * `usdt_token` - Address of the PSP22 token contract to be used for escrow payments
        /// * `fee_account` - Address where platform fees will be collected
        ///
        /// # Returns
        ///
        /// A new `EscrowContract` instance with:
        /// - Default fee of 1% (100 basis points)
        /// - Contract unpaused
        /// - 6 decimal places for token amounts
        /// - 90-day default escrow duration
        /// - Deployer as initial admin signer
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

        /// Creates a new escrow agreement between a creator and counterparty with milestone-based payments.
        ///
        /// This is a core security-critical function that establishes an escrow with defined milestones.
        /// Each escrow is assigned a unique ID and tracked for both creator and counterparty.
        ///
        /// # Arguments
        ///
        /// * `counterparty_address` - Address of the service provider or client in the escrow
        /// * `counterparty_type` - Type identifier (e.g., "provider", "client")
        /// * `status` - Initial escrow status as string (e.g., "Pending", "Active")
        /// * `title` - Brief title for the escrow (max 1000 characters)
        /// * `description` - Detailed description of the escrow terms (max 1000 characters)
        /// * `total_amount` - Total amount for all milestones as decimal string (e.g., "100.50")
        /// * `milestones_input` - Vector of milestones defining payment schedule (max 50 milestones)
        /// * `transaction_hash` - Optional blockchain transaction hash for deposit confirmation
        ///
        /// # Returns
        ///
        /// Returns `Ok(String)` containing the unique escrow ID on success.
        ///
        /// # Errors
        ///
        /// * `ContractPaused` - Contract operations are paused by admin
        /// * `StorageLimitExceeded` - Too many milestones (>50), title/description too long (>1000 chars), or too many evidence files (>10)
        /// * `ArithmeticOverflow` - Escrow counter overflow (unlikely with u64)
        /// * `InvalidEscrowStatus` - Invalid status string provided
        /// * `InvalidStatus` - Invalid milestone status in milestone input
        ///
        /// # Security
        ///
        /// - Validates storage limits to prevent DoS attacks
        /// - Enforces maximum milestone count, string lengths, and evidence file count
        /// - Uses checked arithmetic for counter increment
        /// - Associates escrow with both parties for bilateral access control
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

            // Validate storage limits to prevent DoS attacks
            if milestones_input.len() > MAX_MILESTONES {
                return Err(EscrowError::StorageLimitExceeded);
            }

            if title.len() > MAX_STRING_LENGTH {
                return Err(EscrowError::StorageLimitExceeded);
            }

            if description.len() > MAX_STRING_LENGTH {
                return Err(EscrowError::StorageLimitExceeded);
            }

            let caller = Self::env().caller(); // In ink! v6, caller() returns Address directly

            // Safe arithmetic: increment counter with overflow protection
            self.escrow_counter = self
                .escrow_counter
                .checked_add(1)
                .ok_or(EscrowError::ArithmeticOverflow)?;
            let escrow_id = format!("escrow_{}", self.escrow_counter);

            let escrow_status = self.parse_escrow_status(&status)?;

            // Convert MilestoneInput to Milestone by parsing status strings and converting evidence URLs
            let milestones: Result<Vec<Milestone>, EscrowError> = milestones_input
                .into_iter()
                .map(|m_input| {
                    let milestone_status = self.parse_milestone_status(&m_input.status)?;
                    
                    // Convert evidence URLs (strings) to Evidence structs
                    let evidence_file: Option<Vec<Evidence>> = m_input.evidence_file.map(|urls| {
                        // Validate evidence file count
                        if urls.len() > MAX_EVIDENCE_FILES {
                            return Err(EscrowError::StorageLimitExceeded);
                        }

                        Ok(urls.into_iter()
                            .map(|url| Evidence {
                                name: String::new(), // Empty name, frontend can set this if needed
                                url,
                            })
                            .collect())
                    }).transpose()?;
                    
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

        /// Retrieves complete escrow data by its unique identifier.
        ///
        /// # Arguments
        ///
        /// * `escrow_id` - Unique escrow identifier (format: "escrow_{counter}")
        ///
        /// # Returns
        ///
        /// Returns `Ok(EscrowData)` containing all escrow information including milestones.
        ///
        /// # Errors
        ///
        /// * `EscrowNotFound` - No escrow exists with the provided ID
        #[ink(message)]
        pub fn get_escrow(&self, escrow_id: String) -> Result<EscrowData, EscrowError> {
            self.escrows
                .get(&escrow_id)
                .ok_or(EscrowError::EscrowNotFound)
        }

        /// Retrieves detailed information for a specific milestone within an escrow.
        ///
        /// # Arguments
        ///
        /// * `escrow_id` - Unique identifier of the escrow containing the milestone
        /// * `milestone_id` - Unique identifier of the milestone to retrieve
        ///
        /// # Returns
        ///
        /// Returns `Ok(Milestone)` containing milestone details including status, amount, deadline, and evidence.
        ///
        /// # Errors
        ///
        /// * `EscrowNotFound` - No escrow exists with the provided ID
        /// * `MilestoneNotFound` - No milestone with the provided ID exists in the escrow
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

        /// Updates the status of an existing escrow agreement.
        ///
        /// Only the creator or counterparty of the escrow can update its status.
        ///
        /// # Arguments
        ///
        /// * `escrow_id` - Unique identifier of the escrow to update
        /// * `new_status` - New status as string (e.g., "Active", "Completed", "Disputed", "Cancelled")
        /// * `transaction_hash` - Optional transaction hash to associate with the status change
        ///
        /// # Returns
        ///
        /// Returns `Ok(EscrowData)` containing the updated escrow data.
        ///
        /// # Errors
        ///
        /// * `ContractPaused` - Contract operations are paused by admin
        /// * `EscrowNotFound` - No escrow exists with the provided ID
        /// * `Unauthorized` - Caller is neither the creator nor the counterparty
        /// * `InvalidEscrowStatus` - Invalid status string provided
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

        /// Updates the status of a specific milestone within an escrow.
        ///
        /// Only the creator or counterparty of the escrow can update milestone status.
        /// Automatically sets completion timestamp when status changes to "Completed".
        ///
        /// # Arguments
        ///
        /// * `escrow_id` - Unique identifier of the escrow containing the milestone
        /// * `milestone` - Current milestone data to be updated
        /// * `new_status` - New status as string (e.g., "Pending", "InProgress", "Done", "Funded", "Completed")
        ///
        /// # Returns
        ///
        /// Returns `Ok(EscrowData)` containing the updated escrow with modified milestone.
        ///
        /// # Errors
        ///
        /// * `ContractPaused` - Contract operations are paused by admin
        /// * `EscrowNotFound` - No escrow exists with the provided ID
        /// * `Unauthorized` - Caller is neither the creator nor the counterparty
        /// * `MilestoneNotFound` - Milestone ID not found in the escrow
        /// * `InvalidStatus` - Invalid milestone status string provided
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

        /// Retrieves all escrows associated with the calling account.
        ///
        /// Returns escrows where the caller is either the creator or counterparty.
        ///
        /// # Returns
        ///
        /// Returns `Ok(Vec<EscrowData>)` containing all escrows associated with the caller.
        /// Returns an empty vector if no escrows are found.
        ///
        /// # Errors
        ///
        /// * `ContractPaused` - Contract operations are paused by admin
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

        /// Records a token deposit notification for an escrow and verifies contract balance.
        ///
        /// This function validates that the contract has received the claimed deposit amount
        /// by checking the PSP22 token balance. It tracks deposits separately from escrow creation.
        ///
        /// # Arguments
        ///
        /// * `escrow_id` - Unique identifier of the escrow receiving the deposit
        /// * `amount_str` - Deposit amount as decimal string (e.g., "100.50")
        ///
        /// # Returns
        ///
        /// Returns `Ok(Balance)` containing the new total deposited amount for this escrow.
        ///
        /// # Errors
        ///
        /// * `ContractPaused` - Contract operations are paused by admin
        /// * `EscrowNotFound` - No escrow exists with the provided ID
        /// * `InvalidAmount` - Amount string cannot be parsed
        /// * `InsufficientBalance` - Contract balance is less than claimed deposit total
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

        /// Marks a milestone as completed by the counterparty with optional evidence and notes.
        ///
        /// This function allows the counterparty (service provider) to submit work completion
        /// for a milestone. The milestone must be in "InProgress" status and transitions to "Done"
        /// status, awaiting creator approval.
        ///
        /// # Arguments
        ///
        /// * `escrow_id` - Unique identifier of the escrow containing the milestone
        /// * `milestone_id` - Unique identifier of the milestone being completed
        /// * `completion_note` - Optional note describing the completed work
        /// * `evidence_file` - Optional vector of evidence documents (URLs, receipts, deliverables)
        ///
        /// # Returns
        ///
        /// Returns `Ok(())` on successful milestone completion submission.
        ///
        /// # Errors
        ///
        /// * `ContractPaused` - Contract operations are paused by admin
        /// * `EscrowNotFound` - No escrow exists with the provided ID
        /// * `Unauthorized` - Caller is not the counterparty of the escrow
        /// * `MilestoneNotFound` - Milestone ID not found in the escrow
        /// * `InvalidStatus` - Milestone is not in "InProgress" status
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

        /// Releases milestone payment to the counterparty after deducting platform fees.
        ///
        /// This is a critical security function that transfers escrowed funds to the counterparty.
        /// It deducts platform fees, validates balances, and updates escrow state. Either the
        /// creator or counterparty can initiate the release.
        ///
        /// # Arguments
        ///
        /// * `escrow_id` - Unique identifier of the escrow containing the milestone
        /// * `milestone_id` - Unique identifier of the milestone to release payment for
        ///
        /// # Returns
        ///
        /// Returns `Ok(ReleaseResponse)` containing transaction hash, status, and account details.
        ///
        /// # Errors
        ///
        /// * `ContractPaused` - Contract operations are paused by admin
        /// * `EscrowNotFound` - No escrow exists with the provided ID
        /// * `Unauthorized` - Caller is neither the creator nor the counterparty
        /// * `MilestoneNotFound` - Milestone ID not found in the escrow
        /// * `InvalidAmount` - Milestone amount string cannot be parsed
        /// * `FeeTooHigh` - Fee basis points exceed 10,000 (100%)
        /// * `ArithmeticOverflow` - Fee calculation or amount subtraction overflow
        /// * `InsufficientBalance` - Insufficient escrow deposit or contract balance
        /// * `TokenTransferFailed` - PSP22 transfer to counterparty or fee account failed
        ///
        /// # Security
        ///
        /// - Validates fee_bps is within valid range (0-10,000)
        /// - Uses checked arithmetic for all fee calculations
        /// - Verifies both escrow-specific and contract-wide balances
        /// - Transfers to counterparty first, then fee to minimize reentrancy risk
        /// - Updates storage after successful transfers
        /// - Tracks total volume with overflow protection
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

            // Safe arithmetic: calculate fee with overflow protection
            let fee = amount
                .checked_mul(self.fee_bps as u128)
                .and_then(|result| result.checked_div(10000))
                .ok_or(EscrowError::ArithmeticOverflow)?;

            let release_amount = amount
                .checked_sub(fee)
                .ok_or(EscrowError::ArithmeticOverflow)?;

            let escrow_available = self.escrow_deposits.get(&escrow_id).unwrap_or(0);
            if escrow_available < amount {
                return Err(EscrowError::InsufficientBalance);
            }

            let contract_address = self.env().address();
            let contract_balance = self.psp22_balance_of(self.usdt_token, contract_address);
            if contract_balance < amount {
                return Err(EscrowError::InsufficientBalance);
            }

            // EFFECTS: Update all state BEFORE external calls (reentrancy protection)
            escrow.milestones[milestone_index].status = MilestoneStatus::Funded;
            self.escrows.insert(&escrow_id, &escrow);

            // Safe arithmetic: update total_volume with overflow protection
            self.total_volume = self
                .total_volume
                .checked_add(amount)
                .ok_or(EscrowError::ArithmeticOverflow)?;

            let remaining = escrow_available.saturating_sub(amount);
            self.escrow_deposits.insert(&escrow_id, &remaining);

            // INTERACTIONS: External PSP22 calls last (after all state updates)
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

        /// Marks a milestone as completed after funds have been released.
        ///
        /// This function finalizes a milestone by changing its status from "Funded" to "Completed".
        /// If all milestones in the escrow are completed, the entire escrow is marked as completed.
        ///
        /// # Arguments
        ///
        /// * `escrow_id` - Unique identifier of the escrow containing the milestone
        /// * `milestone_id` - Unique identifier of the milestone to complete
        ///
        /// # Returns
        ///
        /// Returns `Ok(())` on successful milestone completion.
        ///
        /// # Errors
        ///
        /// * `ContractPaused` - Contract operations are paused by admin
        /// * `EscrowNotFound` - No escrow exists with the provided ID
        /// * `Unauthorized` - Caller is neither the creator nor the counterparty
        /// * `MilestoneNotFound` - Milestone ID not found in the escrow
        /// * `InvalidStatus` - Milestone is not in "Funded" status
        ///
        /// # Security
        ///
        /// - Requires milestone to be in "Funded" state (payment already released)
        /// - Automatically checks and updates overall escrow completion status
        /// - Emits events for audit trail
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

        /// Files a dispute against a milestone with a specified reason.
        ///
        /// Either the creator or counterparty can dispute a milestone when there are disagreements
        /// about deliverables, quality, or other terms. This changes the milestone status to "Disputed"
        /// and prevents further actions until resolution.
        ///
        /// # Arguments
        ///
        /// * `escrow_id` - Unique identifier of the escrow containing the milestone
        /// * `milestone_id` - Unique identifier of the milestone being disputed
        /// * `reason` - Explanation for the dispute (stored on-chain)
        ///
        /// # Returns
        ///
        /// Returns `Ok(DisputeResponse)` containing dispute ID, status, and message.
        ///
        /// # Errors
        ///
        /// * `ContractPaused` - Contract operations are paused by admin
        /// * `EscrowNotFound` - No escrow exists with the provided ID
        /// * `Unauthorized` - Caller is neither the creator nor the counterparty
        /// * `MilestoneNotFound` - Milestone ID not found in the escrow
        ///
        /// # Security
        ///
        /// - Records the disputing party's address for accountability
        /// - Stores dispute reason on-chain for transparency
        /// - Generates unique dispute ID for tracking
        /// - Emits event for off-chain dispute resolution systems
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

        /// Sends a notification to the counterparty about escrow events.
        ///
        /// This function emits an event that off-chain systems can monitor to send notifications
        /// (e.g., email, push notifications) to the specified recipient about escrow updates.
        ///
        /// # Arguments
        ///
        /// * `escrow_id` - Unique identifier of the escrow related to the notification
        /// * `notification_type` - Type of notification (e.g., "milestone_completed", "payment_released")
        /// * `recipient_account_id` - Address of the account to receive the notification
        /// * `_message` - Optional message content (reserved for future use)
        /// * `_notification_kind` - Optional notification kind (reserved for future use)
        ///
        /// # Returns
        ///
        /// Returns `Ok(NotificationResponse)` containing notification ID, status, and message.
        ///
        /// # Errors
        ///
        /// * `ContractPaused` - Contract operations are paused by admin
        /// * `EscrowNotFound` - No escrow exists with the provided ID
        /// * `Unauthorized` - Caller is neither the creator nor the counterparty
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

        /// Checks the status of a blockchain transaction (mock implementation).
        ///
        /// This is a placeholder function that returns mock transaction data.
        /// In production, this would integrate with chain explorers or indexers.
        ///
        /// # Arguments
        ///
        /// * `transaction_hash` - Transaction hash to query
        ///
        /// # Returns
        ///
        /// Returns `Ok(TransactionStatus)` containing hash, status ("confirmed"), confirmations (12),
        /// and current block number.
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
                _ => Err(EscrowError::InvalidEscrowStatus),
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

        /// Proposes to pause the contract through multi-signature governance.
        ///
        /// Creates a governance proposal to pause all contract operations. Requires approval
        /// from the threshold number of admin signers before execution.
        ///
        /// # Returns
        ///
        /// Returns `Ok(u64)` containing the proposal ID if successfully created.
        ///
        /// # Errors
        ///
        /// * `Unauthorized` - Caller is not an admin signer
        ///
        /// # Security
        ///
        /// - Only admin signers can create proposals
        /// - Creator's approval is counted automatically
        /// - Executes immediately if threshold is met
        #[ink(message)]
        pub fn propose_pause_contract(&mut self) -> Result<u64, EscrowError> {
            self.submit_proposal(ProposalAction::PauseContract)
        }

        /// Proposes to unpause the contract through multi-signature governance.
        ///
        /// Creates a governance proposal to resume contract operations after a pause. Requires approval
        /// from the threshold number of admin signers before execution.
        ///
        /// # Returns
        ///
        /// Returns `Ok(u64)` containing the proposal ID if successfully created.
        ///
        /// # Errors
        ///
        /// * `Unauthorized` - Caller is not an admin signer
        ///
        /// # Security
        ///
        /// - Only admin signers can create proposals
        /// - Creator's approval is counted automatically
        /// - Executes immediately if threshold is met
        #[ink(message)]
        pub fn propose_unpause_contract(&mut self) -> Result<u64, EscrowError> {
            self.submit_proposal(ProposalAction::UnpauseContract)
        }

        /// Proposes to update the platform fee through multi-signature governance.
        ///
        /// Creates a governance proposal to change the platform fee (in basis points). Requires approval
        /// from the threshold number of admin signers before execution.
        ///
        /// # Arguments
        ///
        /// * `new_fee_bps` - New fee in basis points (100 = 1%, max 10,000 = 100%)
        ///
        /// # Returns
        ///
        /// Returns `Ok(u64)` containing the proposal ID if successfully created.
        ///
        /// # Errors
        ///
        /// * `Unauthorized` - Caller is not an admin signer
        /// * `FeeTooHigh` - Fee exceeds 10,000 basis points (100%) during execution
        ///
        /// # Security
        ///
        /// - Only admin signers can create proposals
        /// - Fee validation occurs during execution phase
        /// - Creator's approval is counted automatically
        #[ink(message)]
        pub fn propose_update_fee(&mut self, new_fee_bps: u16) -> Result<u64, EscrowError> {
            self.submit_proposal(ProposalAction::SetFee(new_fee_bps))
        }

        /// Direct pause function - deprecated in favor of multi-signature governance.
        ///
        /// This function always returns `Unauthorized` to enforce the use of the proposal-based
        /// governance system via `propose_pause_contract()`.
        ///
        /// # Returns
        ///
        /// Always returns `Err(Unauthorized)`.
        ///
        /// # Errors
        ///
        /// * `Unauthorized` - Always returned to enforce governance process
        #[ink(message)]
        pub fn pause_contract(&mut self) -> Result<(), EscrowError> {
            Err(EscrowError::Unauthorized)
        }

        /// Direct unpause function - deprecated in favor of multi-signature governance.
        ///
        /// This function always returns `Unauthorized` to enforce the use of the proposal-based
        /// governance system via `propose_unpause_contract()`.
        ///
        /// # Returns
        ///
        /// Always returns `Err(Unauthorized)`.
        ///
        /// # Errors
        ///
        /// * `Unauthorized` - Always returned to enforce governance process
        #[ink(message)]
        pub fn unpause_contract(&mut self) -> Result<(), EscrowError> {
            Err(EscrowError::Unauthorized)
        }

        /// Direct fee update function - deprecated in favor of multi-signature governance.
        ///
        /// This function always returns `Unauthorized` to enforce the use of the proposal-based
        /// governance system via `propose_update_fee()`.
        ///
        /// # Arguments
        ///
        /// * `_new_fee_bps` - Ignored parameter (function is disabled)
        ///
        /// # Returns
        ///
        /// Always returns `Err(Unauthorized)`.
        ///
        /// # Errors
        ///
        /// * `Unauthorized` - Always returned to enforce governance process
        #[ink(message)]
        pub fn update_fee(&mut self, _new_fee_bps: u16) -> Result<(), EscrowError> {
            Err(EscrowError::Unauthorized)
        }

        /// Proposes to update the PSP22 token address through multi-signature governance.
        ///
        /// Creates a governance proposal to change the token contract used for escrow payments.
        /// This is a critical operation that affects all future escrows.
        ///
        /// # Arguments
        ///
        /// * `new_token_address` - Address of the new PSP22 token contract
        ///
        /// # Returns
        ///
        /// Returns `Ok(u64)` containing the proposal ID if successfully created.
        ///
        /// # Errors
        ///
        /// * `Unauthorized` - Caller is not an admin signer
        ///
        /// # Security
        ///
        /// - Only admin signers can create proposals
        /// - Requires multi-signature approval to prevent unauthorized token changes
        /// - Creator's approval is counted automatically
        #[ink(message)]
        pub fn propose_set_usdt_token(
            &mut self,
            new_token_address: Address,
        ) -> Result<u64, EscrowError> {
            self.submit_proposal(ProposalAction::SetUsdtToken(new_token_address))
        }

        /// Sets the PSP22 token address (owner-only fallback).
        ///
        /// This is a direct owner-only function that bypasses multi-signature governance.
        /// Provided as a fallback mechanism for emergency situations or initial setup.
        ///
        /// # Arguments
        ///
        /// * `new_token_address` - Address of the new PSP22 token contract
        ///
        /// # Returns
        ///
        /// Returns `Ok(())` on successful token address update.
        ///
        /// # Errors
        ///
        /// * `Unauthorized` - Caller is not the contract owner
        ///
        /// # Security
        ///
        /// - Only contract owner can call this function
        /// - Use `propose_set_usdt_token()` for normal governance operations
        /// - This bypasses multi-signature approval (use with caution)
        #[ink(message)]
        pub fn set_usdt_token(&mut self, new_token_address: Address) -> Result<(), EscrowError> {
            let caller = self.env().caller(); // In ink! v6, caller() returns Address directly

            if caller != self.owner {
                return Err(EscrowError::Unauthorized);
            }

            self.usdt_token = new_token_address;
            Ok(())
        }

        /// Retrieves the current PSP22 token address used for escrow payments.
        ///
        /// # Returns
        ///
        /// Returns the `Address` of the currently configured PSP22 token contract.
        #[ink(message)]
        pub fn get_usdt_token(&self) -> Address {
            self.usdt_token
        }

        /// Retrieves the complete token configuration including address, decimals, and fee.
        ///
        /// # Returns
        ///
        /// Returns a tuple containing:
        /// - `Address` - PSP22 token contract address
        /// - `u8` - Token decimal places (e.g., 6 for USDT)
        /// - `u16` - Platform fee in basis points (100 = 1%)
        #[ink(message)]
        pub fn get_token_config(&self) -> (Address, u8, u16) {
            (self.usdt_token, self.token_decimals, self.fee_bps)
        }

        /// Retrieves the contract's current PSP22 token balance.
        ///
        /// Queries the configured PSP22 token contract to get this contract's token balance.
        /// Useful for monitoring contract liquidity and verifying deposits.
        ///
        /// # Returns
        ///
        /// Returns `Balance` representing the contract's token balance in base units.
        #[ink(message)]
        pub fn get_token_balance(&self) -> Balance {
            let contract_address = self.env().address();
            self.psp22_balance_of(self.usdt_token, contract_address)
        }

        /// Proposes to update the token decimal places through multi-signature governance.
        ///
        /// Creates a governance proposal to change the decimal precision used for token amounts.
        /// This affects how amount strings are parsed into base units.
        ///
        /// # Arguments
        ///
        /// * `new_token_decimals` - New decimal places (e.g., 6 for USDT, 18 for most ERC20 tokens)
        ///
        /// # Returns
        ///
        /// Returns `Ok(u64)` containing the proposal ID if successfully created.
        ///
        /// # Errors
        ///
        /// * `Unauthorized` - Caller is not an admin signer
        ///
        /// # Security
        ///
        /// - Only admin signers can create proposals
        /// - Must match the actual token's decimal configuration
        /// - Creator's approval is counted automatically
        #[ink(message)]
        pub fn propose_set_token_decimals(
            &mut self,
            new_token_decimals: u8,
        ) -> Result<u64, EscrowError> {
            self.submit_proposal(ProposalAction::SetTokenDecimals(new_token_decimals))
        }

        /// Direct token decimals update function - deprecated in favor of multi-signature governance.
        ///
        /// This function always returns `Unauthorized` to enforce the use of the proposal-based
        /// governance system via `propose_set_token_decimals()`.
        ///
        /// # Arguments
        ///
        /// * `_new_token_decimals` - Ignored parameter (function is disabled)
        ///
        /// # Returns
        ///
        /// Always returns `Err(Unauthorized)`.
        ///
        /// # Errors
        ///
        /// * `Unauthorized` - Always returned to enforce governance process
        #[ink(message)]
        pub fn set_token_decimals(&mut self, _new_token_decimals: u8) -> Result<(), EscrowError> {
            Err(EscrowError::Unauthorized)
        }

        /// Direct token and decimals update function - deprecated in favor of multi-signature governance.
        ///
        /// This function always returns `Unauthorized` to enforce the use of separate proposal-based
        /// governance functions for token address and decimals updates.
        ///
        /// # Arguments
        ///
        /// * `_new_token_address` - Ignored parameter (function is disabled)
        /// * `_new_token_decimals` - Ignored parameter (function is disabled)
        ///
        /// # Returns
        ///
        /// Always returns `Err(Unauthorized)`.
        ///
        /// # Errors
        ///
        /// * `Unauthorized` - Always returned to enforce governance process
        #[ink(message)]
        pub fn set_token_and_decimals(
            &mut self,
            _new_token_address: Address,
            _new_token_decimals: u8,
        ) -> Result<(), EscrowError> {
            Err(EscrowError::Unauthorized)
        }

        /// Retrieves comprehensive contract information and statistics.
        ///
        /// # Returns
        ///
        /// Returns a tuple containing:
        /// - `Address` - Contract owner address
        /// - `u16` - Current platform fee in basis points (100 = 1%)
        /// - `bool` - Paused status (true = paused, false = active)
        /// - `u128` - Total transaction volume processed by the contract
        #[ink(message)]
        pub fn get_contract_info(&self) -> (Address, u16, bool, u128) {
            (self.owner, self.fee_bps, self.paused, self.total_volume)
        }

        /// Submits a new governance proposal for multi-signature approval.
        ///
        /// Creates a proposal for administrative actions that require multi-signature approval.
        /// The creator's signature is counted automatically. If the threshold is met immediately,
        /// the proposal is executed.
        ///
        /// # Arguments
        ///
        /// * `action` - The proposed action (pause, unpause, set fee, set token, manage signers, etc.)
        ///
        /// # Returns
        ///
        /// Returns `Ok(u64)` containing the unique proposal ID.
        ///
        /// # Errors
        ///
        /// * `Unauthorized` - Caller is not an admin signer
        ///
        /// # Security
        ///
        /// - Only admin signers can submit proposals
        /// - Proposal creator's approval is automatically recorded
        /// - Auto-executes if threshold is met (threshold can be 1 for single-admin contracts)
        /// - All proposals are permanently stored for audit trail
        /// - Emits events for off-chain monitoring
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

        /// Approves an existing governance proposal.
        ///
        /// Admin signers can approve proposals created by other signers. Once the threshold
        /// is reached, the proposal is automatically executed. Each signer can only approve once.
        ///
        /// # Arguments
        ///
        /// * `proposal_id` - Unique identifier of the proposal to approve
        ///
        /// # Returns
        ///
        /// Returns `Ok(())` on successful approval.
        ///
        /// # Errors
        ///
        /// * `Unauthorized` - Caller is not an admin signer
        /// * `EscrowNotFound` - No proposal exists with the provided ID (reused error type)
        /// * `InvalidStatus` - Proposal already executed or caller already approved
        ///
        /// # Security
        ///
        /// - Only admin signers can approve proposals
        /// - Prevents double-approval by the same signer
        /// - Cannot approve already-executed proposals
        /// - Auto-executes when threshold is reached
        /// - Emits events for each approval
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

        /// Executes a governance proposal that has met the approval threshold.
        ///
        /// This function can be called by anyone to execute a proposal that has sufficient approvals.
        /// Typically called automatically when threshold is reached, but available as a fallback.
        ///
        /// # Arguments
        ///
        /// * `proposal_id` - Unique identifier of the proposal to execute
        ///
        /// # Returns
        ///
        /// Returns `Ok(())` on successful execution.
        ///
        /// # Errors
        ///
        /// * `EscrowNotFound` - No proposal exists with the provided ID (reused error type)
        /// * `Unauthorized` - Proposal has not reached the required approval threshold
        /// * `InvalidStatus` - Proposal has already been executed
        /// * `FeeTooHigh` - For SetFee proposals, fee exceeds maximum (100%)
        /// * `InsufficientBalance` - For EmergencyWithdraw, insufficient contract balance
        ///
        /// # Security
        ///
        /// - Validates approval threshold before execution
        /// - Prevents double-execution
        /// - Validates signer count for RemoveSigner and SetThreshold actions
        /// - Emits events for all state changes
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
                ProposalAction::EmergencyWithdraw(_recipient, _amount) => {
                    // Not implemented - return error to prevent silent failure
                    return Err(EscrowError::InvalidStatus);
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

        /// Retrieves the list of current admin signers for multi-signature governance.
        ///
        /// # Returns
        ///
        /// Returns `Vec<Address>` containing all admin signer addresses.
        #[ink(message)]
        pub fn get_admin_signers(&self) -> Vec<Address> {
            self.admin_signers.clone()
        }

        /// Retrieves the current signature threshold required for proposal execution.
        ///
        /// # Returns
        ///
        /// Returns `u8` representing the minimum number of approvals needed to execute a proposal.
        #[ink(message)]
        pub fn get_signature_threshold(&self) -> u8 {
            self.signature_threshold
        }

        /// Retrieves detailed information about a specific governance proposal.
        ///
        /// # Arguments
        ///
        /// * `proposal_id` - Unique identifier of the proposal to retrieve
        ///
        /// # Returns
        ///
        /// Returns `Some(AdminProposal)` if the proposal exists, `None` otherwise.
        /// Proposal includes action, creator, approvals, execution status, and timestamps.
        #[ink(message)]
        pub fn get_proposal(&self, proposal_id: u64) -> Option<AdminProposal> {
            self.proposals.get(proposal_id)
        }

        /// Retrieves the total number of proposals created.
        ///
        /// # Returns
        ///
        /// Returns `u64` representing the current proposal counter. This is also the ID
        /// of the most recently created proposal.
        #[ink(message)]
        pub fn get_proposal_counter(&self) -> u64 {
            self.proposal_counter
        }

        /// Checks if a given account is an authorized admin signer.
        ///
        /// # Arguments
        ///
        /// * `account` - Address to check for admin signer status
        ///
        /// # Returns
        ///
        /// Returns `true` if the account is an admin signer, `false` otherwise.
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

    #[cfg(test)]
    mod tests {
        use super::*;
        use ink::env::test;

        #[ink::test]
        fn test_storage_limits_milestone_count() {
            let accounts = test::default_accounts();
            let mut contract = EscrowContract::new(accounts.frank, accounts.eve);

            // Create 51 milestones (exceeds MAX_MILESTONES = 50)
            let mut milestones = Vec::new();
            for i in 0..51 {
                milestones.push(MilestoneInput {
                    id: format!("m{}", i),
                    description: "Test".to_string(),
                    amount: "10".to_string(),
                    status: "Pending".to_string(),
                    deadline: 1000000,
                    completed_at: None,
                    dispute_reason: None,
                    dispute_filed_by: None,
                    completion_note: None,
                    evidence_file: None,
                });
            }

            let result = contract.create_escrow(
                accounts.bob,
                "provider".to_string(),
                "Pending".to_string(),
                "Test".to_string(),
                "Description".to_string(),
                "510".to_string(),
                milestones,
                None,
            );

            assert_eq!(result, Err(EscrowError::StorageLimitExceeded));
        }

        #[ink::test]
        fn test_storage_limits_string_length() {
            let accounts = test::default_accounts();
            let mut contract = EscrowContract::new(accounts.frank, accounts.eve);

            let long_title = "a".repeat(1001); // Exceeds MAX_STRING_LENGTH = 1000

            let result = contract.create_escrow(
                accounts.bob,
                "provider".to_string(),
                "Pending".to_string(),
                long_title,
                "Description".to_string(),
                "100".to_string(),
                vec![],
                None,
            );

            assert_eq!(result, Err(EscrowError::StorageLimitExceeded));
        }

        #[ink::test]
        fn test_storage_limits_evidence_files() {
            let accounts = test::default_accounts();
            let mut contract = EscrowContract::new(accounts.frank, accounts.eve);

            // Create milestone with 11 evidence files (exceeds MAX_EVIDENCE_FILES = 10)
            let mut evidence = Vec::new();
            for i in 0..11 {
                evidence.push(format!("https://example.com/file{}", i));
            }

            let milestones = vec![MilestoneInput {
                id: "m1".to_string(),
                description: "Test".to_string(),
                amount: "100".to_string(),
                status: "Pending".to_string(),
                deadline: 1000000,
                completed_at: None,
                dispute_reason: None,
                dispute_filed_by: None,
                completion_note: None,
                evidence_file: Some(evidence),
            }];

            let result = contract.create_escrow(
                accounts.bob,
                "provider".to_string(),
                "Pending".to_string(),
                "Test".to_string(),
                "Description".to_string(),
                "100".to_string(),
                milestones,
                None,
            );

            assert_eq!(result, Err(EscrowError::StorageLimitExceeded));
        }

        #[ink::test]
        fn test_arithmetic_overflow_counter() {
            let accounts = test::default_accounts();
            let mut contract = EscrowContract::new(accounts.frank, accounts.eve);

            // Set counter to near max
            contract.escrow_counter = u64::MAX - 1;

            // This should work
            let result1 = contract.create_escrow(
                accounts.bob,
                "provider".to_string(),
                "Pending".to_string(),
                "Test1".to_string(),
                "Desc".to_string(),
                "100".to_string(),
                vec![],
                None,
            );
            assert!(result1.is_ok());
            assert_eq!(contract.escrow_counter, u64::MAX);

            // Next one should fail with overflow
            let result2 = contract.create_escrow(
                accounts.bob,
                "provider".to_string(),
                "Pending".to_string(),
                "Test2".to_string(),
                "Desc".to_string(),
                "100".to_string(),
                vec![],
                None,
            );
            assert_eq!(result2, Err(EscrowError::ArithmeticOverflow));
        }

        #[ink::test]
        fn test_create_escrow_valid_limits() {
            let accounts = test::default_accounts();
            let mut contract = EscrowContract::new(accounts.frank, accounts.eve);

            // Create with exactly 50 milestones (at limit)
            let mut milestones = Vec::new();
            for i in 0..50 {
                milestones.push(MilestoneInput {
                    id: format!("m{}", i),
                    description: "Test".to_string(),
                    amount: "10".to_string(),
                    status: "Pending".to_string(),
                    deadline: 1000000,
                    completed_at: None,
                    dispute_reason: None,
                    dispute_filed_by: None,
                    completion_note: None,
                    evidence_file: None,
                });
            }

            let result = contract.create_escrow(
                accounts.bob,
                "provider".to_string(),
                "Pending".to_string(),
                "Test".to_string(),
                "Description".to_string(),
                "500".to_string(),
                milestones,
                None,
            );

            assert!(result.is_ok());
        }

        #[ink::test]
        fn test_parse_amount_edge_cases() {
            let accounts = test::default_accounts();
            let contract = EscrowContract::new(accounts.frank, accounts.eve);

            // Test zero amount
            let zero = contract.parse_amount_to_base_units("0");
            assert_eq!(zero, Ok(0));

            // Test small amount
            let small = contract.parse_amount_to_base_units("0.000001");
            assert_eq!(small, Ok(1));

            // Test large amount (but not overflow)
            let large = contract.parse_amount_to_base_units("1000000");
            assert_eq!(large, Ok(1_000_000_000_000));
        }

        #[ink::test]
        fn test_fee_calculation_no_overflow() {
            let accounts = test::default_accounts();
            let contract = EscrowContract::new(accounts.frank, accounts.eve);

            // Test fee calculation doesn't overflow for large amounts
            // fee_bps is 100 (1%), so fee = amount * 100 / 10000
            let amount: u128 = 1_000_000_000_000_000; // Large but safe amount
            let fee = amount.checked_mul(contract.fee_bps as u128)
                .and_then(|r| r.checked_div(10000));

            assert!(fee.is_some());
            assert_eq!(fee.unwrap(), 10_000_000_000_000); // 1% of amount
        }

        #[ink::test]
        fn test_description_length_validation() {
            let accounts = test::default_accounts();
            let mut contract = EscrowContract::new(accounts.frank, accounts.eve);

            let long_description = "a".repeat(1001); // Exceeds MAX_STRING_LENGTH

            let result = contract.create_escrow(
                accounts.bob,
                "provider".to_string(),
                "Pending".to_string(),
                "Title".to_string(),
                long_description,
                "100".to_string(),
                vec![],
                None,
            );

            assert_eq!(result, Err(EscrowError::StorageLimitExceeded));
        }

        #[ink::test]
        fn test_milestone_with_valid_evidence() {
            let accounts = test::default_accounts();
            let mut contract = EscrowContract::new(accounts.frank, accounts.eve);

            // Create milestone with exactly 10 evidence files (at limit)
            let mut evidence = Vec::new();
            for i in 0..10 {
                evidence.push(format!("https://example.com/file{}", i));
            }

            let milestones = vec![MilestoneInput {
                id: "m1".to_string(),
                description: "Test milestone".to_string(),
                amount: "100".to_string(),
                status: "Pending".to_string(),
                deadline: 1000000,
                completed_at: None,
                dispute_reason: None,
                dispute_filed_by: None,
                completion_note: None,
                evidence_file: Some(evidence),
            }];

            let result = contract.create_escrow(
                accounts.bob,
                "provider".to_string(),
                "Pending".to_string(),
                "Test".to_string(),
                "Description".to_string(),
                "100".to_string(),
                milestones,
                None,
            );

            assert!(result.is_ok());
        }

        #[ink::test]
        fn test_total_volume_no_overflow() {
            let accounts = test::default_accounts();
            let mut contract = EscrowContract::new(accounts.frank, accounts.eve);

            // Set total_volume to near max
            contract.total_volume = u128::MAX - 1000;

            // Try to add 500 (should succeed)
            let result = contract.total_volume.checked_add(500);
            assert!(result.is_some());
            assert_eq!(result.unwrap(), u128::MAX - 500);

            // Try to add 2000 (should fail - overflow)
            let overflow_result = contract.total_volume.checked_add(2000);
            assert!(overflow_result.is_none());
        }

        #[ink::test]
        fn test_invalid_status_parsing() {
            let accounts = test::default_accounts();
            let mut contract = EscrowContract::new(accounts.frank, accounts.eve);

            let result = contract.create_escrow(
                accounts.bob,
                "provider".to_string(),
                "InvalidStatus".to_string(), // Invalid status
                "Title".to_string(),
                "Description".to_string(),
                "100".to_string(),
                vec![],
                None,
            );

            assert_eq!(result, Err(EscrowError::InvalidEscrowStatus));
        }

        #[ink::test]
        fn test_invalid_milestone_status_parsing() {
            let accounts = test::default_accounts();
            let mut contract = EscrowContract::new(accounts.frank, accounts.eve);

            let milestones = vec![MilestoneInput {
                id: "m1".to_string(),
                description: "Test".to_string(),
                amount: "100".to_string(),
                status: "InvalidMilestoneStatus".to_string(), // Invalid status
                deadline: 1000000,
                completed_at: None,
                dispute_reason: None,
                dispute_filed_by: None,
                completion_note: None,
                evidence_file: None,
            }];

            let result = contract.create_escrow(
                accounts.bob,
                "provider".to_string(),
                "Pending".to_string(),
                "Title".to_string(),
                "Description".to_string(),
                "100".to_string(),
                milestones,
                None,
            );

            assert_eq!(result, Err(EscrowError::InvalidStatus));
        }

        #[ink::test]
        fn test_create_and_get_escrow() {
            let accounts = test::default_accounts();
            let mut contract = EscrowContract::new(accounts.frank, accounts.eve);

            let milestones = vec![MilestoneInput {
                id: "m1".to_string(),
                description: "Task 1".to_string(),
                amount: "100".to_string(),
                status: "Pending".to_string(),
                deadline: 1000000,
                completed_at: None,
                dispute_reason: None,
                dispute_filed_by: None,
                completion_note: None,
                evidence_file: None,
            }];

            let escrow_id = contract.create_escrow(
                accounts.bob,
                "provider".to_string(),
                "Active".to_string(),
                "Test Escrow".to_string(),
                "Test Description".to_string(),
                "100".to_string(),
                milestones,
                None,
            ).unwrap();

            let escrow = contract.get_escrow(escrow_id).unwrap();
            assert_eq!(escrow.title, "Test Escrow");
            assert_eq!(escrow.description, "Test Description");
            assert_eq!(escrow.milestones.len(), 1);
        }

        #[ink::test]
        fn test_list_escrows() {
            let accounts = test::default_accounts();
            let mut contract = EscrowContract::new(accounts.frank, accounts.eve);

            let milestones = vec![MilestoneInput {
                id: "m1".to_string(),
                description: "Task".to_string(),
                amount: "100".to_string(),
                status: "Pending".to_string(),
                deadline: 1000000,
                completed_at: None,
                dispute_reason: None,
                dispute_filed_by: None,
                completion_note: None,
                evidence_file: None,
            }];

            contract.create_escrow(
                accounts.bob,
                "provider".to_string(),
                "Active".to_string(),
                "Escrow 1".to_string(),
                "Desc 1".to_string(),
                "100".to_string(),
                milestones.clone(),
                None,
            ).unwrap();

            contract.create_escrow(
                accounts.alice,
                "client".to_string(),
                "Active".to_string(),
                "Escrow 2".to_string(),
                "Desc 2".to_string(),
                "200".to_string(),
                milestones,
                None,
            ).unwrap();

            let escrows = contract.list_escrows().unwrap();
            assert_eq!(escrows.len(), 2);
        }

        #[ink::test]
        fn test_get_escrow_milestone() {
            let accounts = test::default_accounts();
            let mut contract = EscrowContract::new(accounts.frank, accounts.eve);

            let milestones = vec![
                MilestoneInput {
                    id: "m1".to_string(),
                    description: "Task 1".to_string(),
                    amount: "50".to_string(),
                    status: "Pending".to_string(),
                    deadline: 1000000,
                    completed_at: None,
                    dispute_reason: None,
                    dispute_filed_by: None,
                    completion_note: None,
                    evidence_file: None,
                },
                MilestoneInput {
                    id: "m2".to_string(),
                    description: "Task 2".to_string(),
                    amount: "50".to_string(),
                    status: "Pending".to_string(),
                    deadline: 2000000,
                    completed_at: None,
                    dispute_reason: None,
                    dispute_filed_by: None,
                    completion_note: None,
                    evidence_file: None,
                }
            ];

            let escrow_id = contract.create_escrow(
                accounts.bob,
                "provider".to_string(),
                "Active".to_string(),
                "Test".to_string(),
                "Desc".to_string(),
                "100".to_string(),
                milestones,
                None,
            ).unwrap();

            let milestone = contract.get_escrow_milestone(escrow_id.clone(), "m1".to_string()).unwrap();
            assert_eq!(milestone.description, "Task 1");

            let milestone2 = contract.get_escrow_milestone(escrow_id, "m2".to_string()).unwrap();
            assert_eq!(milestone2.description, "Task 2");
        }

        #[ink::test]
        fn test_update_escrow_status() {
            let accounts = test::default_accounts();
            let mut contract = EscrowContract::new(accounts.frank, accounts.eve);

            let milestones = vec![MilestoneInput {
                id: "m1".to_string(),
                description: "Task".to_string(),
                amount: "100".to_string(),
                status: "Pending".to_string(),
                deadline: 1000000,
                completed_at: None,
                dispute_reason: None,
                dispute_filed_by: None,
                completion_note: None,
                evidence_file: None,
            }];

            let escrow_id = contract.create_escrow(
                accounts.bob,
                "provider".to_string(),
                "Active".to_string(),
                "Test".to_string(),
                "Desc".to_string(),
                "100".to_string(),
                milestones,
                None,
            ).unwrap();

            contract.update_escrow_status(escrow_id.clone(), "Completed".to_string(), None).unwrap();

            let escrow = contract.get_escrow(escrow_id).unwrap();
            assert_eq!(escrow.status, EscrowStatus::Completed);
        }

        #[ink::test]
        fn test_update_milestone_status() {
            let accounts = test::default_accounts();
            let mut contract = EscrowContract::new(accounts.frank, accounts.eve);

            let milestones = vec![MilestoneInput {
                id: "m1".to_string(),
                description: "Task".to_string(),
                amount: "100".to_string(),
                status: "Pending".to_string(),
                deadline: 1000000,
                completed_at: None,
                dispute_reason: None,
                dispute_filed_by: None,
                completion_note: None,
                evidence_file: None,
            }];

            let escrow_id = contract.create_escrow(
                accounts.bob,
                "provider".to_string(),
                "Active".to_string(),
                "Test".to_string(),
                "Desc".to_string(),
                "100".to_string(),
                milestones,
                None,
            ).unwrap();

            let milestone = contract.get_escrow_milestone(escrow_id.clone(), "m1".to_string()).unwrap();

            contract.update_escrow_milestone_status(
                escrow_id.clone(),
                milestone,
                "InProgress".to_string()
            ).unwrap();

            let updated_milestone = contract.get_escrow_milestone(escrow_id, "m1".to_string()).unwrap();
            assert_eq!(updated_milestone.status, MilestoneStatus::InProgress);
        }

        #[ink::test]
        fn test_complete_milestone_task_sets_done_and_evidence() {
            let accounts = test::default_accounts();
            test::set_caller(accounts.alice);
            let mut contract = EscrowContract::new(accounts.frank, accounts.eve);

            let milestones = vec![MilestoneInput {
                id: "m1".to_string(),
                description: "Task".to_string(),
                amount: "100".to_string(),
                status: "InProgress".to_string(),
                deadline: 1000000,
                completed_at: None,
                dispute_reason: None,
                dispute_filed_by: None,
                completion_note: None,
                evidence_file: None,
            }];

            let escrow_id = contract.create_escrow(
                accounts.bob,
                "provider".to_string(),
                "Active".to_string(),
                "Test".to_string(),
                "Desc".to_string(),
                "100".to_string(),
                milestones,
                None,
            ).unwrap();

            // Counterparty completes the milestone task
            test::set_caller(accounts.bob);
            contract.complete_milestone_task(
                escrow_id.clone(),
                "m1".to_string(),
                Some("Done".to_string()),
                Some(vec![Evidence { name: "file".to_string(), url: "ipfs://file".to_string() }])
            ).unwrap();

            let milestone = contract.get_escrow_milestone(escrow_id, "m1".to_string()).unwrap();
            assert_eq!(milestone.status, MilestoneStatus::Done);
            assert_eq!(milestone.completion_note, Some("Done".to_string()));
            assert!(milestone.completed_at.is_some());
            let evidence = milestone.evidence_file.expect("evidence saved");
            assert_eq!(evidence.len(), 1);
            assert_eq!(evidence[0].url, "ipfs://file");
        }

        #[ink::test]
        fn test_complete_milestone_sets_completed_and_updates_escrow() {
            let accounts = test::default_accounts();
            test::set_caller(accounts.alice);
            let mut contract = EscrowContract::new(accounts.frank, accounts.eve);

            let milestones = vec![MilestoneInput {
                id: "m1".to_string(),
                description: "Task".to_string(),
                amount: "100".to_string(),
                status: "Funded".to_string(),
                deadline: 1000000,
                completed_at: None,
                dispute_reason: None,
                dispute_filed_by: None,
                completion_note: None,
                evidence_file: None,
            }];

            let escrow_id = contract.create_escrow(
                accounts.bob,
                "provider".to_string(),
                "Active".to_string(),
                "Test".to_string(),
                "Desc".to_string(),
                "100".to_string(),
                milestones,
                None,
            ).unwrap();

            // Creator completes the funded milestone
            test::set_caller(accounts.alice);
            contract.complete_milestone(escrow_id.clone(), "m1".to_string()).unwrap();

            let milestone = contract.get_escrow_milestone(escrow_id.clone(), "m1".to_string()).unwrap();
            assert_eq!(milestone.status, MilestoneStatus::Completed);

            let escrow = contract.get_escrow(escrow_id).unwrap();
            assert_eq!(escrow.status, EscrowStatus::Completed);
        }

        #[ink::test]
        fn test_release_milestone_fee_too_high_short_circuits() {
            let accounts = test::default_accounts();
            test::set_caller(accounts.alice);
            let mut contract = EscrowContract::new(accounts.frank, accounts.eve);

            let milestones = vec![MilestoneInput {
                id: "m1".to_string(),
                description: "Task".to_string(),
                amount: "100".to_string(),
                status: "Pending".to_string(),
                deadline: 1000000,
                completed_at: None,
                dispute_reason: None,
                dispute_filed_by: None,
                completion_note: None,
                evidence_file: None,
            }];

            let escrow_id = contract.create_escrow(
                accounts.bob,
                "provider".to_string(),
                "Active".to_string(),
                "Test".to_string(),
                "Desc".to_string(),
                "100".to_string(),
                milestones,
                None,
            ).unwrap();

            // Push fee above 100% to trigger early guard
            contract.fee_bps = 10_001;
            let result = contract.release_milestone(escrow_id, "m1".to_string());
            assert_eq!(result, Err(EscrowError::FeeTooHigh));
        }

        #[ink::test]
        fn test_release_milestone_insufficient_deposit_stops_before_psp22() {
            let accounts = test::default_accounts();
            test::set_caller(accounts.alice);
            let mut contract = EscrowContract::new(accounts.frank, accounts.eve);

            let milestones = vec![MilestoneInput {
                id: "m1".to_string(),
                description: "Task".to_string(),
                amount: "100".to_string(),
                status: "Pending".to_string(),
                deadline: 1000000,
                completed_at: None,
                dispute_reason: None,
                dispute_filed_by: None,
                completion_note: None,
                evidence_file: None,
            }];

            let escrow_id = contract.create_escrow(
                accounts.bob,
                "provider".to_string(),
                "Active".to_string(),
                "Test".to_string(),
                "Desc".to_string(),
                "100".to_string(),
                milestones,
                None,
            ).unwrap();

            // No deposit recorded; should fail on escrow_deposits guard before any PSP22 call
            let result = contract.release_milestone(escrow_id, "m1".to_string());
            assert_eq!(result, Err(EscrowError::InsufficientBalance));
        }

        #[ink::test]
        fn test_getter_functions() {
            let accounts = test::default_accounts();
            let contract = EscrowContract::new(accounts.frank, accounts.eve);

            assert_eq!(contract.get_usdt_token(), accounts.frank);

            let (token, decimals, fee) = contract.get_token_config();
            assert_eq!(token, accounts.frank);
            assert_eq!(decimals, 6);
            assert_eq!(fee, 100);

            let (_, fee_bps, paused, _) = contract.get_contract_info();
            assert_eq!(fee_bps, 100);
            assert_eq!(paused, false);

            let signers = contract.get_admin_signers();
            assert!(signers.len() > 0);

            let threshold = contract.get_signature_threshold();
            assert!(threshold > 0); // Just verify it's > 0
            assert_eq!(contract.get_proposal_counter(), 0);
        }

        #[ink::test]
        fn test_error_not_found() {
            let accounts = test::default_accounts();
            let mut contract = EscrowContract::new(accounts.frank, accounts.eve);

            assert_eq!(
                contract.get_escrow("nonexistent".to_string()),
                Err(EscrowError::EscrowNotFound)
            );

            assert_eq!(
                contract.get_escrow_milestone("nonexistent".to_string(), "m1".to_string()),
                Err(EscrowError::EscrowNotFound)
            );

            assert_eq!(
                contract.update_escrow_status("nonexistent".to_string(), "Active".to_string(), None),
                Err(EscrowError::EscrowNotFound)
            );

            // Note: update_escrow_milestone_status requires getting the milestone first,
            // so it will fail with EscrowNotFound when getting the escrow

            assert_eq!(
                contract.notify_deposit("nonexistent".to_string(), "100".to_string()),
                Err(EscrowError::EscrowNotFound)
            );

            assert_eq!(
                contract.complete_milestone_task("nonexistent".to_string(), "m1".to_string(), None, None),
                Err(EscrowError::EscrowNotFound)
            );

            assert_eq!(
                contract.dispute_milestone("nonexistent".to_string(), "m1".to_string(), "reason".to_string()),
                Err(EscrowError::EscrowNotFound)
            );

            assert_eq!(
                contract.notify_counterparty(
                    "nonexistent".to_string(),
                    "type".to_string(),
                    accounts.bob,
                    Some("msg".to_string()),
                    None
                ),
                Err(EscrowError::EscrowNotFound)
            );
        }

        #[ink::test]
        fn test_constructor() {
            let accounts = test::default_accounts();
            test::set_caller(accounts.alice);

            let usdt_token = Address::from([0x01; 20]);
            let fee_account = Address::from([0x02; 20]);

            let contract = EscrowContract::new(usdt_token, fee_account);

            // Verify constructor initialized correctly
            assert_eq!(contract.owner, accounts.alice);
            assert_eq!(contract.usdt_token, usdt_token);
            assert_eq!(contract.fee_account, fee_account);
            assert_eq!(contract.fee_bps, 100); // Default 1.0%
            assert_eq!(contract.paused, false);
            assert_eq!(contract.escrow_counter, 0);
            assert_eq!(contract.total_volume, 0);
            assert_eq!(contract.token_decimals, 6);

            // Verify admin multisig defaults
            let signers = contract.get_admin_signers();
            assert_eq!(signers.len(), 1);
            assert_eq!(signers[0], accounts.alice);
            assert_eq!(contract.get_signature_threshold(), 1);
        }

        #[ink::test]
        fn test_multisig_propose_and_approve() {
            let accounts = test::default_accounts();
            test::set_caller(accounts.alice);

            let usdt_token = Address::from([0x01; 20]);
            let fee_account = Address::from([0x02; 20]);
            let mut contract = EscrowContract::new(usdt_token, fee_account);

            // Add two more admin signers
            contract.admin_signers.push(accounts.bob);
            contract.admin_signers.push(accounts.charlie);
            contract.signature_threshold = 2;

            // Submit pause proposal
            let result = contract.propose_pause_contract();
            assert!(result.is_ok());
            let proposal_id = result.unwrap();
            assert!(proposal_id > 0);

            // Verify proposal state
            let proposal = contract.proposals.get(&proposal_id).unwrap();
            assert_eq!(proposal.approvals.len(), 1);
            assert!(proposal.approvals.contains(&accounts.alice));
            assert_eq!(proposal.executed, false);

            // Second signer approves
            test::set_caller(accounts.bob);
            let approve_result = contract.approve_proposal(proposal_id);
            assert!(approve_result.is_ok());

            // Verify execution (threshold met)
            let proposal_after = contract.proposals.get(&proposal_id).unwrap();
            assert!(proposal_after.executed);
            assert!(contract.paused); // Pause executed
        }

        #[ink::test]
        fn test_multisig_update_fee() {
            let accounts = test::default_accounts();
            test::set_caller(accounts.alice);

            let usdt_token = Address::from([0x01; 20]);
            let fee_account = Address::from([0x02; 20]);
            let mut contract = EscrowContract::new(usdt_token, fee_account);

            // Add second signer and set threshold to 2
            contract.admin_signers.push(accounts.bob);
            contract.signature_threshold = 2;

            let old_fee = contract.fee_bps;

            // Submit fee update proposal
            let result = contract.propose_update_fee(100); // 1%
            assert!(result.is_ok());
            let proposal_id = result.unwrap();

            // Fee not changed yet (needs approval)
            assert_eq!(contract.fee_bps, old_fee);

            // Second signer approves
            test::set_caller(accounts.bob);
            let approve_result = contract.approve_proposal(proposal_id);
            assert!(approve_result.is_ok());

            // Fee updated after threshold met
            assert_eq!(contract.fee_bps, 100);
        }

        #[ink::test]
        fn test_multisig_update_threshold() {
            let accounts = test::default_accounts();
            test::set_caller(accounts.alice);

            let usdt_token = Address::from([0x01; 20]);
            let fee_account = Address::from([0x02; 20]);
            let mut contract = EscrowContract::new(usdt_token, fee_account);

            // Add two more signers
            contract.admin_signers.push(accounts.bob);
            contract.admin_signers.push(accounts.charlie);
            contract.signature_threshold = 2;

            // Propose threshold update to 3
            let result = contract.submit_proposal(ProposalAction::SetThreshold(3));
            assert!(result.is_ok());
            let proposal_id = result.unwrap();

            // Threshold still 2
            assert_eq!(contract.signature_threshold, 2);

            // Second signer approves
            test::set_caller(accounts.bob);
            let approve_result = contract.approve_proposal(proposal_id);
            assert!(approve_result.is_ok());

            // Threshold updated to 3
            assert_eq!(contract.signature_threshold, 3);
        }

        #[ink::test]
        fn test_multisig_remove_admin() {
            let accounts = test::default_accounts();
            test::set_caller(accounts.alice);

            let usdt_token = Address::from([0x01; 20]);
            let fee_account = Address::from([0x02; 20]);
            let mut contract = EscrowContract::new(usdt_token, fee_account);

            // Add two more signers
            contract.admin_signers.push(accounts.bob);
            contract.admin_signers.push(accounts.charlie);
            contract.signature_threshold = 2;

            assert_eq!(contract.admin_signers.len(), 3);

            // Propose removing charlie
            let result = contract.submit_proposal(ProposalAction::RemoveSigner(accounts.charlie));
            assert!(result.is_ok());
            let proposal_id = result.unwrap();

            // Charlie still present
            assert_eq!(contract.admin_signers.len(), 3);

            // Second signer approves
            test::set_caller(accounts.bob);
            let approve_result = contract.approve_proposal(proposal_id);
            assert!(approve_result.is_ok());

            // Charlie removed
            assert_eq!(contract.admin_signers.len(), 2);
            assert!(!contract.admin_signers.contains(&accounts.charlie));
        }

        #[ink::test]
        fn test_multisig_unpause() {
            let accounts = test::default_accounts();
            test::set_caller(accounts.alice);

            let usdt_token = Address::from([0x01; 20]);
            let fee_account = Address::from([0x02; 20]);
            let mut contract = EscrowContract::new(usdt_token, fee_account);

            contract.admin_signers.push(accounts.bob);
            contract.signature_threshold = 2;
            contract.paused = true; // Start paused

            // Propose unpause
            let result = contract.propose_unpause_contract();
            assert!(result.is_ok());
            let proposal_id = result.unwrap();

            assert!(contract.paused); // Still paused

            // Second signer approves
            test::set_caller(accounts.bob);
            let approve_result = contract.approve_proposal(proposal_id);
            assert!(approve_result.is_ok());

            // Unpaused after execution
            assert!(!contract.paused);
        }

        #[ink::test]
        fn test_multisig_duplicate_approval_fails() {
            let accounts = test::default_accounts();
            test::set_caller(accounts.alice);

            let usdt_token = Address::from([0x01; 20]);
            let fee_account = Address::from([0x02; 20]);
            let mut contract = EscrowContract::new(usdt_token, fee_account);

            contract.admin_signers.push(accounts.bob);
            contract.admin_signers.push(accounts.charlie);
            contract.signature_threshold = 3; // Requires all 3

            // Alice submits (auto-approved)
            let result = contract.propose_pause_contract();
            assert!(result.is_ok());
            let proposal_id = result.unwrap();

            // Alice tries to approve again - should fail
            let duplicate_result = contract.approve_proposal(proposal_id);
            assert!(duplicate_result.is_err());
            assert_eq!(duplicate_result.unwrap_err(), EscrowError::InvalidStatus);
        }

        #[ink::test]
        fn test_multisig_add_signer() {
            let accounts = test::default_accounts();
            test::set_caller(accounts.alice);

            let usdt_token = Address::from([0x01; 20]);
            let fee_account = Address::from([0x02; 20]);
            let mut contract = EscrowContract::new(usdt_token, fee_account);

            contract.admin_signers.push(accounts.bob);
            contract.signature_threshold = 2;

            assert_eq!(contract.admin_signers.len(), 2);

            // Propose adding charlie
            let result = contract.submit_proposal(ProposalAction::AddSigner(accounts.charlie));
            assert!(result.is_ok());
            let proposal_id = result.unwrap();

            // Charlie not yet added
            assert_eq!(contract.admin_signers.len(), 2);

            // Second signer approves
            test::set_caller(accounts.bob);
            let approve_result = contract.approve_proposal(proposal_id);
            assert!(approve_result.is_ok());

            // Charlie added
            assert_eq!(contract.admin_signers.len(), 3);
            assert!(contract.admin_signers.contains(&accounts.charlie));
        }

        #[ink::test]
        fn test_multisig_set_token_decimals() {
            let accounts = test::default_accounts();
            test::set_caller(accounts.alice);

            let usdt_token = Address::from([0x01; 20]);
            let fee_account = Address::from([0x02; 20]);
            let mut contract = EscrowContract::new(usdt_token, fee_account);

            contract.admin_signers.push(accounts.bob);
            contract.signature_threshold = 2;

            assert_eq!(contract.token_decimals, 6);

            // Propose changing decimals to 18
            let result = contract.submit_proposal(ProposalAction::SetTokenDecimals(18));
            assert!(result.is_ok());
            let proposal_id = result.unwrap();

            // Decimals still 6
            assert_eq!(contract.token_decimals, 6);

            // Second signer approves
            test::set_caller(accounts.bob);
            let approve_result = contract.approve_proposal(proposal_id);
            assert!(approve_result.is_ok());

            // Decimals updated to 18
            assert_eq!(contract.token_decimals, 18);
        }

        #[ink::test]
        fn test_multisig_non_admin_cannot_propose() {
            let accounts = test::default_accounts();
            test::set_caller(accounts.alice);

            let usdt_token = Address::from([0x01; 20]);
            let fee_account = Address::from([0x02; 20]);
            let mut contract = EscrowContract::new(usdt_token, fee_account);

            // Bob is not an admin
            test::set_caller(accounts.bob);
            let result = contract.propose_pause_contract();
            assert!(result.is_err());
            assert_eq!(result.unwrap_err(), EscrowError::Unauthorized);
        }

        #[ink::test]
        fn test_multisig_non_admin_cannot_approve() {
            let accounts = test::default_accounts();
            test::set_caller(accounts.alice);

            let usdt_token = Address::from([0x01; 20]);
            let fee_account = Address::from([0x02; 20]);
            let mut contract = EscrowContract::new(usdt_token, fee_account);

            contract.admin_signers.push(accounts.bob);
            contract.signature_threshold = 2;

            // Alice submits proposal
            let result = contract.propose_pause_contract();
            assert!(result.is_ok());
            let proposal_id = result.unwrap();

            // Charlie (not admin) tries to approve
            test::set_caller(accounts.charlie);
            let approve_result = contract.approve_proposal(proposal_id);
            assert!(approve_result.is_err());
            assert_eq!(approve_result.unwrap_err(), EscrowError::Unauthorized);
        }

        #[ink::test]
        fn test_multisig_proposal_not_found() {
            let accounts = test::default_accounts();
            test::set_caller(accounts.alice);

            let usdt_token = Address::from([0x01; 20]);
            let fee_account = Address::from([0x02; 20]);
            let mut contract = EscrowContract::new(usdt_token, fee_account);

            // Try to approve non-existent proposal
            let result = contract.approve_proposal(999);
            assert!(result.is_err());
            assert_eq!(result.unwrap_err(), EscrowError::EscrowNotFound);

            // Try to execute non-existent proposal
            let exec_result = contract.execute_proposal(999);
            assert!(exec_result.is_err());
            assert_eq!(exec_result.unwrap_err(), EscrowError::EscrowNotFound);
        }

        #[ink::test]
        fn test_milestone_task_completion() {
            let accounts = test::default_accounts();
            test::set_caller(accounts.alice);

            let usdt_token = Address::from([0x01; 20]);
            let fee_account = Address::from([0x02; 20]);
            let mut contract = EscrowContract::new(usdt_token, fee_account);

            // Create escrow with milestone
            let milestones = vec![MilestoneInput {
                id: "m1".to_string(),
                description: "Task 1".to_string(),
                amount: "100".to_string(),
                status: "InProgress".to_string(),
                deadline: 1000000,
                completed_at: None,
                dispute_reason: None,
                dispute_filed_by: None,
                completion_note: None,
                evidence_file: None,
            }];

            let result = contract.create_escrow(
                accounts.bob,
                "counterparty".to_string(),
                "Active".to_string(),
                "Test Escrow".to_string(),
                "Description".to_string(),
                "100".to_string(),
                milestones,
                None,
            );
            assert!(result.is_ok());
            let escrow_id = result.unwrap();

            // Complete milestone task as counterparty
            test::set_caller(accounts.bob);
            let evidence = vec![Evidence {
                name: "proof.pdf".to_string(),
                url: "https://example.com/proof.pdf".to_string(),
            }];

            let complete_result = contract.complete_milestone_task(
                escrow_id.clone(),
                "m1".to_string(),
                Some("Task completed successfully".to_string()),
                Some(evidence),
            );
            assert!(complete_result.is_ok());

            // Verify milestone status changed to Done
            let milestone = contract.get_escrow_milestone(escrow_id, "m1".to_string());
            assert!(milestone.is_ok());
            let m = milestone.unwrap();
            assert_eq!(m.status, MilestoneStatus::Done);
            assert_eq!(m.completion_note, Some("Task completed successfully".to_string()));
            assert!(m.completed_at.is_some());
            assert!(m.evidence_file.is_some());
        }

        #[ink::test]
        fn test_milestone_completion_updates_escrow() {
            let accounts = test::default_accounts();
            test::set_caller(accounts.alice);

            let usdt_token = Address::from([0x01; 20]);
            let fee_account = Address::from([0x02; 20]);
            let mut contract = EscrowContract::new(usdt_token, fee_account);

            // Create escrow with one milestone
            let milestones = vec![MilestoneInput {
                id: "m1".to_string(),
                description: "Task 1".to_string(),
                amount: "100".to_string(),
                status: "Funded".to_string(),
                deadline: 1000000,
                completed_at: None,
                dispute_reason: None,
                dispute_filed_by: None,
                completion_note: None,
                evidence_file: None,
            }];

            let result = contract.create_escrow(
                accounts.bob,
                "counterparty".to_string(),
                "Active".to_string(),
                "Test Escrow".to_string(),
                "Description".to_string(),
                "100".to_string(),
                milestones,
                None,
            );
            assert!(result.is_ok());
            let escrow_id = result.unwrap();

            // Update milestone to Completed
            let milestone = contract.get_escrow_milestone(escrow_id.clone(), "m1".to_string()).unwrap();
            let mut updated_milestone = milestone.clone();
            updated_milestone.status = MilestoneStatus::Completed;

            let update_result = contract.update_escrow_milestone_status(
                escrow_id.clone(),
                updated_milestone,
                "Completed".to_string(),
            );
            assert!(update_result.is_ok());

            // Check if escrow completion check was triggered
            let check_result = contract.check_and_update_escrow_completion(escrow_id.clone());
            assert!(check_result.is_ok());
            assert_eq!(check_result.unwrap(), true); // Escrow should be marked completed

            // Verify escrow status is Completed
            let escrow = contract.get_escrow(escrow_id);
            assert!(escrow.is_ok());
            assert_eq!(escrow.unwrap().status, EscrowStatus::Completed);
        }

        #[ink::test]
        fn test_dispute_milestone() {
            let accounts = test::default_accounts();
            test::set_caller(accounts.alice);
            let usdt_token = Address::from([0x01; 20]);
            let fee_account = Address::from([0x02; 20]);
            let mut contract = EscrowContract::new(usdt_token, fee_account);

            // Create escrow with milestone
            let milestones = vec![MilestoneInput {
                id: "m1".to_string(),
                description: "Task 1".to_string(),
                amount: "100".to_string(),
                status: "InProgress".to_string(),
                deadline: 1000000,
                completed_at: None,
                dispute_reason: None,
                dispute_filed_by: None,
                completion_note: None,
                evidence_file: None,
            }];

            let result = contract.create_escrow(
                accounts.bob,
                "counterparty".to_string(),
                "Active".to_string(),
                "Test Escrow".to_string(),
                "Description".to_string(),
                "100".to_string(),
                milestones,
                None,
            );
            assert!(result.is_ok());
            let escrow_id = result.unwrap();

            // Dispute milestone as creator
            let dispute_result = contract.dispute_milestone(
                escrow_id.clone(),
                "m1".to_string(),
                "Quality issue".to_string(),
            );
            assert!(dispute_result.is_ok());

            // Verify milestone status changed to Disputed
            let milestone = contract.get_escrow_milestone(escrow_id, "m1".to_string());
            assert!(milestone.is_ok());
            let m = milestone.unwrap();
            assert_eq!(m.status, MilestoneStatus::Disputed);
            assert_eq!(m.dispute_reason, Some("Quality issue".to_string()));
            assert_eq!(m.dispute_filed_by, Some(accounts.alice));
        }

        #[ink::test]
        fn test_parse_amount_empty_string() {
            let accounts = test::default_accounts();
            test::set_caller(accounts.alice);
            let usdt_token = Address::from([0x01; 20]);
            let fee_account = Address::from([0x02; 20]);
            let contract = EscrowContract::new(usdt_token, fee_account);

            // Test empty string
            let result = contract.parse_amount_to_base_units("");
            assert!(result.is_err());

            // Test whitespace only
            let result = contract.parse_amount_to_base_units("   ");
            assert!(result.is_err());
        }

        #[ink::test]
        fn test_parse_amount_invalid_format() {
            let accounts = test::default_accounts();
            test::set_caller(accounts.alice);
            let usdt_token = Address::from([0x01; 20]);
            let fee_account = Address::from([0x02; 20]);
            let contract = EscrowContract::new(usdt_token, fee_account);

            // Test too many decimal points
            let result = contract.parse_amount_to_base_units("100.50.25");
            assert!(result.is_err());

            // Test non-digit characters in integer part
            let result = contract.parse_amount_to_base_units("abc.50");
            assert!(result.is_err());

            // Test non-digit characters in fractional part
            let result = contract.parse_amount_to_base_units("100.xyz");
            assert!(result.is_err());
        }

        #[ink::test]
        fn test_parse_amount_fractional_truncation() {
            let accounts = test::default_accounts();
            test::set_caller(accounts.alice);
            let usdt_token = Address::from([0x01; 20]);
            let fee_account = Address::from([0x02; 20]);
            let contract = EscrowContract::new(usdt_token, fee_account);

            // Test fractional part longer than decimals (should truncate)
            let result = contract.parse_amount_to_base_units("100.123456789");
            assert!(result.is_ok()); // Should succeed by truncating to 6 decimals
        }

        #[ink::test]
        fn test_check_and_update_already_completed() {
            let accounts = test::default_accounts();
            test::set_caller(accounts.alice);
            let usdt_token = Address::from([0x01; 20]);
            let fee_account = Address::from([0x02; 20]);
            let mut contract = EscrowContract::new(usdt_token, fee_account);

            // Create escrow with completed milestone
            let milestones = vec![MilestoneInput {
                id: "m1".to_string(),
                description: "Task 1".to_string(),
                amount: "100".to_string(),
                status: "Completed".to_string(),
                deadline: 1000000,
                completed_at: None,
                dispute_reason: None,
                dispute_filed_by: None,
                completion_note: None,
                evidence_file: None,
            }];

            let result = contract.create_escrow(
                accounts.bob,
                "counterparty".to_string(),
                "Completed".to_string(), // Already completed
                "Test Escrow".to_string(),
                "Description".to_string(),
                "100".to_string(),
                milestones,
                None,
            );
            assert!(result.is_ok());
            let escrow_id = result.unwrap();

            // Try to check completion when already completed
            let check_result = contract.check_and_update_escrow_completion(escrow_id);
            assert!(check_result.is_ok());
            assert_eq!(check_result.unwrap(), false); // Should return false since already completed
        }

        #[ink::test]
        fn test_check_and_update_not_all_completed() {
            let accounts = test::default_accounts();
            test::set_caller(accounts.alice);
            let usdt_token = Address::from([0x01; 20]);
            let fee_account = Address::from([0x02; 20]);
            let mut contract = EscrowContract::new(usdt_token, fee_account);

            // Create escrow with incomplete milestone
            let milestones = vec![MilestoneInput {
                id: "m1".to_string(),
                description: "Task 1".to_string(),
                amount: "100".to_string(),
                status: "InProgress".to_string(),
                deadline: 1000000,
                completed_at: None,
                dispute_reason: None,
                dispute_filed_by: None,
                completion_note: None,
                evidence_file: None,
            }];

            let result = contract.create_escrow(
                accounts.bob,
                "counterparty".to_string(),
                "Active".to_string(),
                "Test Escrow".to_string(),
                "Description".to_string(),
                "100".to_string(),
                milestones,
                None,
            );
            assert!(result.is_ok());
            let escrow_id = result.unwrap();

            // Try to check completion when not all completed
            let check_result = contract.check_and_update_escrow_completion(escrow_id);
            assert!(check_result.is_ok());
            assert_eq!(check_result.unwrap(), false); // Should return false since not all completed
        }


    }

}
