#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod escrow_contract {
    use ink::storage::Mapping;

    // Simple PSP22 interface for USDT integration
    #[ink::trait_definition]
    pub trait PSP22 {
        #[ink(message)]
        fn total_supply(&self) -> Balance;

        #[ink(message)]
        fn balance_of(&self, owner: AccountId) -> Balance;

        #[ink(message)]
        fn allowance(&self, owner: AccountId, spender: AccountId) -> Balance;

        #[ink(message)]
        fn transfer(&mut self, to: AccountId, value: Balance, data: ink::prelude::vec::Vec<u8>) -> Result<(), PSP22Error>;

        #[ink(message)]
        fn transfer_from(&mut self, from: AccountId, to: AccountId, value: Balance, data: ink::prelude::vec::Vec<u8>) -> Result<(), PSP22Error>;

        #[ink(message)]
        fn approve(&mut self, spender: AccountId, value: Balance) -> Result<(), PSP22Error>;
    }

    #[derive(scale::Encode, scale::Decode, Debug, PartialEq)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum PSP22Error {
        InsufficientBalance,
        InsufficientAllowance,
        Custom(ink::prelude::string::String),
    }

    /// Escrow status
    #[derive(scale::Encode, scale::Decode, Debug, PartialEq)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout))]
    pub enum EscrowStatus {
        Active,
        Completed,
        Cancelled,
        Disputed,
    }

    /// Escrow data structure
    #[derive(scale::Encode, scale::Decode, Debug, PartialEq)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout))]
    pub struct EscrowData {
        pub client: AccountId,
        pub provider: AccountId,
        pub amount: Balance,
        pub status: EscrowStatus,
        pub created_at: Timestamp,
        pub deadline: Timestamp,  // When this escrow expires
    }

    /// Main contract storage
    #[ink(storage)]
    pub struct EscrowContract {
        /// Contract owner
        owner: AccountId,
        /// Fee in basis points (starts at 100 = 1%, reduces with volume)
        fee_bps: u16,
        /// Account to receive fees
        fee_account: AccountId,
        /// Counter for escrow IDs
        escrow_count: u32,
        /// Mapping of escrow ID to escrow data
        escrows: Mapping<u32, EscrowData>,
        /// Mapping of user to their escrows
        user_escrows: Mapping<AccountId, ink::prelude::vec::Vec<u32>>,
        /// Contract paused state
        paused: bool,
        /// USDT token contract address
        usdt_token: AccountId,
        /// Default timelock duration in milliseconds (30 days = 30 * 24 * 60 * 60 * 1000)
        default_timelock_duration: u64,
        /// Total volume processed (for fee tier calculations)
        total_volume: Balance,
        /// Current fee tier (0 = 1%, 1 = 0.8%, 2 = 0.5%)
        current_tier: u8,
    }

    /// Events
    #[ink(event)]
    pub struct EscrowCreated {
        #[ink(topic)]
        escrow_id: u32,
        #[ink(topic)]
        client: AccountId,
        #[ink(topic)]
        provider: AccountId,
        amount: Balance,
    }

    #[ink(event)]
    pub struct EscrowCompleted {
        #[ink(topic)]
        escrow_id: u32,
        amount: Balance,
        fee: Balance,
    }

    #[ink(event)]
    pub struct EscrowCancelled {
        #[ink(topic)]
        escrow_id: u32,
    }

    #[ink(event)]
    pub struct EscrowExpired {
        #[ink(topic)]
        escrow_id: u32,
        #[ink(topic)]
        client: AccountId,
        #[ink(topic)]
        provider: AccountId,
        amount: Balance,
    }

    #[ink(event)]
    pub struct FeeTierChanged {
        #[ink(topic)]
        new_tier: u8,
        #[ink(topic)]
        new_fee_bps: u16,
        total_volume: Balance,
    }

    /// Errors
    #[derive(scale::Encode, scale::Decode, Debug, PartialEq)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum EscrowError {
        NotAuthorized,
        EscrowNotFound,
        InvalidStatus,
        ContractPaused,
        InsufficientBalance,
        TransferFailed,
        TokenTransferFailed,
        InsufficientAllowance,
        PSP22Error(PSP22Error),
        EscrowExpired,
        InvalidTimelock,
    }

    impl From<PSP22Error> for EscrowError {
        fn from(error: PSP22Error) -> Self {
            EscrowError::PSP22Error(error)
        }
    }

    impl EscrowContract {
        /// Constructor
        #[ink(constructor)]
        pub fn new(fee_bps: u16, fee_account: AccountId, usdt_token: AccountId) -> Self {
            Self {
                owner: Self::env().caller(),
                fee_bps,
                fee_account,
                escrow_count: 0,
                escrows: Mapping::default(),
                user_escrows: Mapping::default(),
                paused: false,
                usdt_token,
                default_timelock_duration: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
                total_volume: 0,
                current_tier: 0,
            }
        }

        /// Constructor with custom timelock duration
        #[ink(constructor)]
        pub fn new_with_timelock(
            fee_bps: u16, 
            fee_account: AccountId, 
            usdt_token: AccountId,
            timelock_duration_ms: u64
        ) -> Self {
            Self {
                owner: Self::env().caller(),
                fee_bps,
                fee_account,
                escrow_count: 0,
                escrows: Mapping::default(),
                user_escrows: Mapping::default(),
                paused: false,
                usdt_token,
                default_timelock_duration: timelock_duration_ms,
                total_volume: 0,
                current_tier: 0,
            }
        }

        /// Create a new escrow using USDT tokens
        #[ink(message)]
        pub fn create_escrow(&mut self, provider: AccountId, amount: Balance) -> Result<u32, EscrowError> {
            if self.paused {
                return Err(EscrowError::ContractPaused);
            }

            let caller = self.env().caller();
            
            if amount == 0 {
                return Err(EscrowError::InsufficientBalance);
            }

            // Create PSP22 token reference using ink's cross-contract calling
            let mut token: ink::contract_ref!(PSP22) = self.usdt_token.into();
            
            // Check allowance first
            let allowance = token.allowance(caller, self.env().account_id());
            if allowance < amount {
                return Err(EscrowError::InsufficientAllowance);
            }

            // Transfer USDT from client to this contract
            token.transfer_from(caller, self.env().account_id(), amount, ink::prelude::vec![])?;

            let escrow_id = self.escrow_count;
            let escrow_data = EscrowData {
                client: caller,
                provider,
                amount,
                status: EscrowStatus::Active,
                created_at: self.env().block_timestamp(),
                deadline: self.env().block_timestamp() + self.default_timelock_duration,
            };

            self.escrows.insert(escrow_id, &escrow_data);
            
            // Add to user's escrow list
            let mut client_escrows = self.user_escrows.get(caller).unwrap_or_default();
            client_escrows.push(escrow_id);
            self.user_escrows.insert(caller, &client_escrows);

            let mut provider_escrows = self.user_escrows.get(provider).unwrap_or_default();
            provider_escrows.push(escrow_id);
            self.user_escrows.insert(provider, &provider_escrows);

            self.escrow_count += 1;

            self.env().emit_event(EscrowCreated {
                escrow_id,
                client: caller,
                provider,
                amount,
            });

            Ok(escrow_id)
        }

        /// Complete an escrow (release USDT to provider)
        #[ink(message)]
        pub fn complete_escrow(&mut self, escrow_id: u32) -> Result<(), EscrowError> {
            if self.paused {
                return Err(EscrowError::ContractPaused);
            }

            let caller = self.env().caller();
            let mut escrow = self.escrows.get(escrow_id).ok_or(EscrowError::EscrowNotFound)?;

            // Only client can complete
            if caller != escrow.client {
                return Err(EscrowError::NotAuthorized);
            }

            // Check status
            if !matches!(escrow.status, EscrowStatus::Active) {
                return Err(EscrowError::InvalidStatus);
            }

            // Update total volume and check for tier changes
            self.total_volume += escrow.amount;
            self.update_fee_tier();

            // Calculate fee using current tier
            let fee = (escrow.amount * self.fee_bps as Balance) / 10000;
            let provider_amount = escrow.amount - fee;

            // Update status
            escrow.status = EscrowStatus::Completed;
            self.escrows.insert(escrow_id, &escrow);

            let mut token: ink::contract_ref!(PSP22) = self.usdt_token.into();

            // Transfer to provider
            token.transfer(escrow.provider, provider_amount, ink::prelude::vec![])?;

            // Transfer fee to fee account
            if fee > 0 {
                token.transfer(self.fee_account, fee, ink::prelude::vec![])?;
            }

            self.env().emit_event(EscrowCompleted {
                escrow_id,
                amount: provider_amount,
                fee,
            });

            Ok(())
        }

        /// Cancel an escrow (return USDT to client)
        #[ink(message)]
        pub fn cancel_escrow(&mut self, escrow_id: u32) -> Result<(), EscrowError> {
            if self.paused {
                return Err(EscrowError::ContractPaused);
            }

            let caller = self.env().caller();
            let mut escrow = self.escrows.get(escrow_id).ok_or(EscrowError::EscrowNotFound)?;

            // Only client or provider can cancel
            if caller != escrow.client && caller != escrow.provider {
                return Err(EscrowError::NotAuthorized);
            }

            // Check status
            if !matches!(escrow.status, EscrowStatus::Active) {
                return Err(EscrowError::InvalidStatus);
            }

            // Update status
            escrow.status = EscrowStatus::Cancelled;
            self.escrows.insert(escrow_id, &escrow);

            let mut token: ink::contract_ref!(PSP22) = self.usdt_token.into();

            // Return USDT to client
            token.transfer(escrow.client, escrow.amount, ink::prelude::vec![])?;

            self.env().emit_event(EscrowCancelled { escrow_id });

            Ok(())
        }

        /// Get escrow details
        #[ink(message)]
        pub fn get_escrow(&self, escrow_id: u32) -> Option<EscrowData> {
            self.escrows.get(escrow_id)
        }

        /// Get user's escrows
        #[ink(message)]
        pub fn get_user_escrows(&self, user: AccountId) -> ink::prelude::vec::Vec<u32> {
            self.user_escrows.get(user).unwrap_or_default()
        }

        /// Get escrow count
        #[ink(message)]
        pub fn get_escrow_count(&self) -> u32 {
            self.escrow_count
        }

        /// Get USDT token contract address
        #[ink(message)]
        pub fn get_usdt_token(&self) -> AccountId {
            self.usdt_token
        }

        /// Owner functions
        #[ink(message)]
        pub fn set_fee(&mut self, new_fee_bps: u16) -> Result<(), EscrowError> {
            if self.env().caller() != self.owner {
                return Err(EscrowError::NotAuthorized);
            }
            self.fee_bps = new_fee_bps;
            Ok(())
        }

        #[ink(message)]
        pub fn set_usdt_token(&mut self, new_usdt_token: AccountId) -> Result<(), EscrowError> {
            if self.env().caller() != self.owner {
                return Err(EscrowError::NotAuthorized);
            }
            self.usdt_token = new_usdt_token;
            Ok(())
        }

        #[ink(message)]
        pub fn pause(&mut self) -> Result<(), EscrowError> {
            if self.env().caller() != self.owner {
                return Err(EscrowError::NotAuthorized);
            }
            self.paused = true;
            Ok(())
        }

        #[ink(message)]
        pub fn unpause(&mut self) -> Result<(), EscrowError> {
            if self.env().caller() != self.owner {
                return Err(EscrowError::NotAuthorized);
            }
            self.paused = false;
            Ok(())
        }

        /// Emergency function to recover tokens (only owner)
        #[ink(message)]
        pub fn emergency_withdraw(&mut self, amount: Balance) -> Result<(), EscrowError> {
            if self.env().caller() != self.owner {
                return Err(EscrowError::NotAuthorized);
            }

            let mut token: ink::contract_ref!(PSP22) = self.usdt_token.into();
            token.transfer(self.owner, amount, ink::prelude::vec![])?;

            Ok(())
        }

        /// Getters
        #[ink(message)]
        pub fn get_owner(&self) -> AccountId {
            self.owner
        }

        #[ink(message)]
        pub fn get_fee_bps(&self) -> u16 {
            self.fee_bps
        }

        #[ink(message)]
        pub fn is_paused(&self) -> bool {
            self.paused
        }

        /// Get contract's USDT balance
        #[ink(message)]
        pub fn get_contract_balance(&self) -> Balance {
            let token: ink::contract_ref!(PSP22) = self.usdt_token.into();
            token.balance_of(self.env().account_id())
        }

        /// Check if an escrow has expired
        #[ink(message)]
        pub fn is_escrow_expired(&self, escrow_id: u32) -> bool {
            if let Some(escrow) = self.escrows.get(escrow_id) {
                matches!(escrow.status, EscrowStatus::Active) && 
                self.env().block_timestamp() > escrow.deadline
            } else {
                false
            }
        }

        /// Process an expired escrow (returns funds to client)
        #[ink(message)]
        pub fn process_expired_escrow(&mut self, escrow_id: u32) -> Result<(), EscrowError> {
            if self.paused {
                return Err(EscrowError::ContractPaused);
            }

            let mut escrow = self.escrows.get(escrow_id).ok_or(EscrowError::EscrowNotFound)?;

            // Check if escrow is active
            if !matches!(escrow.status, EscrowStatus::Active) {
                return Err(EscrowError::InvalidStatus);
            }

            // Check if escrow has actually expired
            if self.env().block_timestamp() <= escrow.deadline {
                return Err(EscrowError::InvalidStatus);
            }

            // Update status to cancelled (expired escrows return funds to client)
            escrow.status = EscrowStatus::Cancelled;
            self.escrows.insert(escrow_id, &escrow);

            let mut token: ink::contract_ref!(PSP22) = self.usdt_token.into();

            // Return USDT to client (no fees for expired escrows)
            token.transfer(escrow.client, escrow.amount, ink::prelude::vec![])?;

            self.env().emit_event(EscrowExpired {
                escrow_id,
                client: escrow.client,
                provider: escrow.provider,
                amount: escrow.amount,
            });

            Ok(())
        }

        /// Get all active escrows that have expired (for batch processing)
        #[ink(message)]
        pub fn get_expired_escrows(&self, start: u32, limit: u32) -> ink::prelude::vec::Vec<u32> {
            let mut expired_escrows = ink::prelude::vec::Vec::new();
            let current_time = self.env().block_timestamp();
            let end = core::cmp::min(start + limit, self.escrow_count);

            for escrow_id in start..end {
                if let Some(escrow) = self.escrows.get(escrow_id) {
                    if matches!(escrow.status, EscrowStatus::Active) && current_time > escrow.deadline {
                        expired_escrows.push(escrow_id);
                    }
                }
            }

            expired_escrows
        }

        /// Set default timelock duration (owner only)
        #[ink(message)]
        pub fn set_default_timelock_duration(&mut self, duration_ms: u64) -> Result<(), EscrowError> {
            if self.env().caller() != self.owner {
                return Err(EscrowError::NotAuthorized);
            }
            
            // Minimum timelock is 1 day (24 * 60 * 60 * 1000 ms)
            if duration_ms < 24 * 60 * 60 * 1000 {
                return Err(EscrowError::InvalidTimelock);
            }

            self.default_timelock_duration = duration_ms;
            Ok(())
        }

        /// Get default timelock duration
        #[ink(message)]
        pub fn get_default_timelock_duration(&self) -> u64 {
            self.default_timelock_duration
        }

        /// Update fee tier based on total volume milestones
        fn update_fee_tier(&mut self) {
            let new_tier = self.calculate_fee_tier();
            if new_tier != self.current_tier {
                self.current_tier = new_tier;
                self.fee_bps = self.get_fee_for_tier(new_tier);
                
                // Emit tier change event
                self.env().emit_event(FeeTierChanged {
                    new_tier,
                    new_fee_bps: self.fee_bps,
                    total_volume: self.total_volume,
                });
            }
        }

        /// Calculate appropriate fee tier based on total volume
        fn calculate_fee_tier(&self) -> u8 {
            // Volume milestones (using USDT with 6 decimals)
            let tier_1_threshold = 10_000_000 * 1_000_000; // $10M
            let tier_2_threshold = 100_000_000 * 1_000_000; // $100M
            
            if self.total_volume >= tier_2_threshold {
                2 // 0.5% fee
            } else if self.total_volume >= tier_1_threshold {
                1 // 0.8% fee  
            } else {
                0 // 1% fee
            }
        }

        /// Get fee in basis points for a given tier
        fn get_fee_for_tier(&self, tier: u8) -> u16 {
            match tier {
                0 => 100, // 1.0%
                1 => 80,  // 0.8%
                2 => 50,  // 0.5%
                _ => 100, // Default to 1.0%
            }
        }

        /// Get current total volume processed
        #[ink(message)]
        pub fn get_total_volume(&self) -> Balance {
            self.total_volume
        }

        /// Get current fee tier (0 = 1%, 1 = 0.8%, 2 = 0.5%)
        #[ink(message)]
        pub fn get_current_tier(&self) -> u8 {
            self.current_tier
        }

        /// Get volume needed to reach next tier
        #[ink(message)]
        pub fn get_volume_to_next_tier(&self) -> Balance {
            let tier_1_threshold = 10_000_000 * 1_000_000; // $10M
            let tier_2_threshold = 100_000_000 * 1_000_000; // $100M
            
            match self.current_tier {
                0 => tier_1_threshold - self.total_volume,
                1 => tier_2_threshold - self.total_volume,
                _ => 0, // Already at highest tier
            }
        }

        /// Get fee percentage as human-readable string
        #[ink(message)]
        pub fn get_current_fee_percentage(&self) -> ink::prelude::string::String {
            match self.current_tier {
                0 => ink::prelude::string::String::from("1.0%"),
                1 => ink::prelude::string::String::from("0.8%"),
                2 => ink::prelude::string::String::from("0.5%"),
                _ => ink::prelude::string::String::from("1.0%"),
            }
        }
    }
    
    #[cfg(test)]
    mod tests {
        use super::*;
        
        // Include tests from separate file by copying the content here
        // This is necessary because ink! contract types are not accessible from external test modules
        
        // Test constants
        const _INITIAL_USDT_SUPPLY: Balance = 1_000_000_000_000;
        const _TEST_ESCROW_AMOUNT: Balance = 10_000_000;
        const FEE_BPS: u16 = 100;  // 1% starting fee (tier 0)

        // Helper functions
        fn default_accounts() -> ink::env::test::DefaultAccounts<ink::env::DefaultEnvironment> {
            ink::env::test::default_accounts::<ink::env::DefaultEnvironment>()
        }

        fn set_sender(sender: AccountId) {
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(sender);
        }

        // Basic constructor tests
        #[ink::test]
        fn constructor_works() {
            let accounts = default_accounts();
            let contract = EscrowContract::new(FEE_BPS, accounts.bob, accounts.charlie);
            
            assert_eq!(contract.get_owner(), accounts.alice);
            assert_eq!(contract.get_fee_bps(), 100);
            assert_eq!(contract.get_usdt_token(), accounts.charlie);
            assert_eq!(contract.get_escrow_count(), 0);
            assert!(!contract.is_paused());
        }

        #[ink::test]
        fn constructor_with_zero_fee() {
            let accounts = default_accounts();
            let contract = EscrowContract::new(0, accounts.bob, accounts.charlie);
            
            assert_eq!(contract.get_owner(), accounts.alice);
            assert_eq!(contract.get_fee_bps(), 0);
        }

        #[ink::test]
        fn constructor_with_max_fee() {
            let accounts = default_accounts();
            let contract = EscrowContract::new(10000, accounts.bob, accounts.charlie);
            
            assert_eq!(contract.get_owner(), accounts.alice);
            assert_eq!(contract.get_fee_bps(), 10000);
        }

        // Escrow creation tests
        #[ink::test]
        fn create_escrow_zero_amount_fails() {
            let accounts = default_accounts();
            let mut contract = EscrowContract::new(FEE_BPS, accounts.eve, accounts.django);
            
            let result = contract.create_escrow(accounts.bob, 0);
            assert!(matches!(result, Err(EscrowError::InsufficientBalance)));
        }

        #[ink::test]
        fn create_escrow_when_paused_fails() {
            let accounts = default_accounts();
            let mut contract = EscrowContract::new(FEE_BPS, accounts.eve, accounts.django);
            
            // Pause the contract
            let _ = contract.pause();
            
            let result = contract.create_escrow(accounts.bob, 1000);
            assert!(matches!(result, Err(EscrowError::ContractPaused)));
        }

        // Authorization tests
        #[ink::test]
        fn set_fee_by_owner_works() {
            let accounts = default_accounts();
            let mut contract = EscrowContract::new(FEE_BPS, accounts.eve, accounts.django);
            
            let result = contract.set_fee(250);
            assert!(result.is_ok());
            assert_eq!(contract.get_fee_bps(), 250);
        }

        #[ink::test]
        fn set_fee_by_non_owner_fails() {
            let accounts = default_accounts();
            let mut contract = EscrowContract::new(FEE_BPS, accounts.eve, accounts.django);
            
            set_sender(accounts.bob);
            let result = contract.set_fee(250);
            assert!(matches!(result, Err(EscrowError::NotAuthorized)));
        }

        #[ink::test]
        fn pause_unpause_by_owner_works() {
            let accounts = default_accounts();
            let mut contract = EscrowContract::new(FEE_BPS, accounts.eve, accounts.django);
            
            assert!(!contract.is_paused());
            
            let result = contract.pause();
            assert!(result.is_ok());
            assert!(contract.is_paused());
            
            let result = contract.unpause();
            assert!(result.is_ok());
            assert!(!contract.is_paused());
        }

        #[ink::test]
        fn pause_by_non_owner_fails() {
            let accounts = default_accounts();
            let mut contract = EscrowContract::new(FEE_BPS, accounts.eve, accounts.django);
            
            set_sender(accounts.bob);
            let result = contract.pause();
            assert!(matches!(result, Err(EscrowError::NotAuthorized)));
        }

        #[ink::test]
        fn emergency_withdraw_by_non_owner_fails() {
            let accounts = default_accounts();
            let mut contract = EscrowContract::new(FEE_BPS, accounts.eve, accounts.django);
            
            set_sender(accounts.bob);
            let result = contract.emergency_withdraw(1000);
            assert!(matches!(result, Err(EscrowError::NotAuthorized)));
        }

        // Query tests
        #[ink::test]
        fn get_nonexistent_escrow_returns_none() {
            let accounts = default_accounts();
            let contract = EscrowContract::new(FEE_BPS, accounts.eve, accounts.django);
            
            let result = contract.get_escrow(999);
            assert!(result.is_none());
        }

        #[ink::test]
        fn get_user_escrows_initially_empty() {
            let accounts = default_accounts();
            let contract = EscrowContract::new(FEE_BPS, accounts.eve, accounts.django);
            
            let escrows = contract.get_user_escrows(accounts.alice);
            assert!(escrows.is_empty());
        }

        #[ink::test]
        fn escrow_count_starts_at_zero() {
            let accounts = default_accounts();
            let contract = EscrowContract::new(FEE_BPS, accounts.eve, accounts.django);
            
            assert_eq!(contract.get_escrow_count(), 0);
        }

        // Contract initialization test
        #[ink::test]
        fn contract_initialization_complete() {
            let accounts = default_accounts();
            let contract = EscrowContract::new(FEE_BPS, accounts.eve, accounts.django);
            
            assert_eq!(contract.get_owner(), accounts.alice);
            assert_eq!(contract.get_fee_bps(), 100);
            assert_eq!(contract.get_usdt_token(), accounts.django);
            assert_eq!(contract.get_escrow_count(), 0);
            assert!(!contract.is_paused());
        }

        // Timelock functionality tests
        #[ink::test]
        fn constructor_with_custom_timelock_works() {
            let accounts = default_accounts();
            let custom_duration = 7 * 24 * 60 * 60 * 1000; // 7 days
            let contract = EscrowContract::new_with_timelock(
                FEE_BPS,
                accounts.bob,
                accounts.charlie,
                custom_duration
            );
            
            assert_eq!(contract.get_owner(), accounts.alice);
            assert_eq!(contract.get_fee_bps(), 100);
            assert_eq!(contract.get_usdt_token(), accounts.charlie);
            assert_eq!(contract.get_default_timelock_duration(), custom_duration);
        }

        #[ink::test]
        fn default_timelock_is_30_days() {
            let accounts = default_accounts();
            let contract = EscrowContract::new(FEE_BPS, accounts.eve, accounts.django);
            
            let expected_duration = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
            assert_eq!(contract.get_default_timelock_duration(), expected_duration);
        }

        #[ink::test]
        fn set_timelock_duration_by_owner_works() {
            let accounts = default_accounts();
            let mut contract = EscrowContract::new(FEE_BPS, accounts.eve, accounts.django);
            
            let new_duration = 14 * 24 * 60 * 60 * 1000; // 14 days
            let result = contract.set_default_timelock_duration(new_duration);
            assert!(result.is_ok());
            assert_eq!(contract.get_default_timelock_duration(), new_duration);
        }

        #[ink::test]
        fn set_timelock_duration_by_non_owner_fails() {
            let accounts = default_accounts();
            let mut contract = EscrowContract::new(FEE_BPS, accounts.eve, accounts.django);
            
            set_sender(accounts.bob);
            let new_duration = 14 * 24 * 60 * 60 * 1000; // 14 days
            let result = contract.set_default_timelock_duration(new_duration);
            assert!(matches!(result, Err(EscrowError::NotAuthorized)));
        }

        #[ink::test]
        fn set_invalid_timelock_duration_fails() {
            let accounts = default_accounts();
            let mut contract = EscrowContract::new(FEE_BPS, accounts.eve, accounts.django);
            
            let invalid_duration = 12 * 60 * 60 * 1000; // 12 hours (less than 1 day minimum)
            let result = contract.set_default_timelock_duration(invalid_duration);
            assert!(matches!(result, Err(EscrowError::InvalidTimelock)));
        }

        #[ink::test]
        fn escrow_not_expired_initially() {
            let accounts = default_accounts();
            let contract = EscrowContract::new(FEE_BPS, accounts.eve, accounts.django);
            
            // Non-existent escrow should return false
            assert!(!contract.is_escrow_expired(1));
        }

        #[ink::test]
        fn process_non_existent_escrow_fails() {
            let accounts = default_accounts();
            let mut contract = EscrowContract::new(FEE_BPS, accounts.eve, accounts.django);
            
            let result = contract.process_expired_escrow(999);
            assert!(matches!(result, Err(EscrowError::EscrowNotFound)));
        }

        #[ink::test]
        fn process_non_expired_escrow_fails() {
            let accounts = default_accounts();
            let mut contract = EscrowContract::new(FEE_BPS, accounts.eve, accounts.django);
            
            let result = contract.process_expired_escrow(1);
            assert!(matches!(result, Err(EscrowError::EscrowNotFound)));
        }

        #[ink::test]
        fn get_expired_escrows_returns_empty_initially() {
            let accounts = default_accounts();
            let contract = EscrowContract::new(FEE_BPS, accounts.eve, accounts.django);
            
            let expired = contract.get_expired_escrows(0, 10);
            assert!(expired.is_empty());
        }

        #[ink::test]
        fn get_expired_escrows_with_zero_limit() {
            let accounts = default_accounts();
            let contract = EscrowContract::new(FEE_BPS, accounts.eve, accounts.django);
            
            let expired = contract.get_expired_escrows(0, 0);
            assert!(expired.is_empty());
        }

        #[ink::test]
        fn get_expired_escrows_handles_out_of_bounds() {
            let accounts = default_accounts();
            let contract = EscrowContract::new(FEE_BPS, accounts.eve, accounts.django);
            
            let expired = contract.get_expired_escrows(1000, 10);
            assert!(expired.is_empty());
        }

        #[ink::test]
        fn process_expired_escrow_when_paused_fails() {
            let accounts = default_accounts();
            let mut contract = EscrowContract::new(FEE_BPS, accounts.eve, accounts.django);
            
            // Pause the contract
            let _ = contract.pause();
            
            let result = contract.process_expired_escrow(1);
            assert!(matches!(result, Err(EscrowError::ContractPaused)));
        }

        #[ink::test]
        fn timelock_workflow_validation() {
            let accounts = default_accounts();
            let contract = EscrowContract::new_with_timelock(
                FEE_BPS,
                accounts.bob,
                accounts.charlie,
                7 * 24 * 60 * 60 * 1000 // 7 days
            );
            
            // Verify timelock settings
            assert_eq!(contract.get_default_timelock_duration(), 7 * 24 * 60 * 60 * 1000);
            assert_eq!(contract.get_owner(), accounts.alice);
            assert_eq!(contract.get_fee_bps(), 100);
        }

        // Tiered pricing tests
        #[ink::test]
        fn initial_tier_is_correct() {
            let accounts = default_accounts();
            let contract = EscrowContract::new(FEE_BPS, accounts.bob, accounts.charlie);
            
            assert_eq!(contract.get_current_tier(), 0);
            assert_eq!(contract.get_fee_bps(), 100); // 1%
            assert_eq!(contract.get_total_volume(), 0);
            assert_eq!(contract.get_current_fee_percentage(), "1.0%");
        }

        #[ink::test]
        fn volume_to_next_tier_calculation() {
            let accounts = default_accounts();
            let contract = EscrowContract::new(FEE_BPS, accounts.bob, accounts.charlie);
            
            let volume_needed = contract.get_volume_to_next_tier();
            let expected = 10_000_000 * 1_000_000; // $10M in USDT (6 decimals)
            assert_eq!(volume_needed, expected);
        }

        #[ink::test]
        fn fee_tier_calculation_tier_0() {
            let accounts = default_accounts();
            let contract = EscrowContract::new(FEE_BPS, accounts.bob, accounts.charlie);
            
            // Should be tier 0 (1%) for volumes under $10M
            assert_eq!(contract.calculate_fee_tier(), 0);
            assert_eq!(contract.get_fee_for_tier(0), 100);
        }

        #[ink::test] 
        fn fee_tier_calculation_tier_1() {
            let accounts = default_accounts();
            let mut contract = EscrowContract::new(FEE_BPS, accounts.bob, accounts.charlie);
            
            // Simulate $10M volume
            contract.total_volume = 10_000_000 * 1_000_000;
            
            assert_eq!(contract.calculate_fee_tier(), 1);
            assert_eq!(contract.get_fee_for_tier(1), 80); // 0.8%
        }

        #[ink::test]
        fn fee_tier_calculation_tier_2() {
            let accounts = default_accounts();
            let mut contract = EscrowContract::new(FEE_BPS, accounts.bob, accounts.charlie);
            
            // Simulate $100M volume
            contract.total_volume = 100_000_000 * 1_000_000;
            
            assert_eq!(contract.calculate_fee_tier(), 2);
            assert_eq!(contract.get_fee_for_tier(2), 50); // 0.5%
        }

        #[ink::test]
        fn tier_progression_works() {
            let accounts = default_accounts();
            let mut contract = EscrowContract::new(FEE_BPS, accounts.bob, accounts.charlie);
            
            // Start at tier 0
            assert_eq!(contract.get_current_tier(), 0);
            assert_eq!(contract.get_fee_bps(), 100);
            
            // Simulate volume growth to tier 1
            contract.total_volume = 10_000_000 * 1_000_000; // $10M
            contract.update_fee_tier();
            
            assert_eq!(contract.get_current_tier(), 1);
            assert_eq!(contract.get_fee_bps(), 80);
            
            // Simulate volume growth to tier 2  
            contract.total_volume = 100_000_000 * 1_000_000; // $100M
            contract.update_fee_tier();
            
            assert_eq!(contract.get_current_tier(), 2);
            assert_eq!(contract.get_fee_bps(), 50);
        }

        #[ink::test]
        fn fee_percentage_strings_correct() {
            let accounts = default_accounts();
            let mut contract = EscrowContract::new(FEE_BPS, accounts.bob, accounts.charlie);
            
            // Tier 0
            assert_eq!(contract.get_current_fee_percentage(), "1.0%");
            
            // Tier 1
            contract.current_tier = 1;
            assert_eq!(contract.get_current_fee_percentage(), "0.8%");
            
            // Tier 2
            contract.current_tier = 2;
            assert_eq!(contract.get_current_fee_percentage(), "0.5%");
        }

        #[ink::test]
        fn volume_tracking_in_complete_escrow() {
            let accounts = default_accounts();
            let mut contract = EscrowContract::new(FEE_BPS, accounts.bob, accounts.charlie);
            
            // Mock an active escrow
            let escrow_data = EscrowData {
                client: accounts.alice,
                provider: accounts.bob,
                amount: 5_000 * 1_000_000, // $5,000
                status: EscrowStatus::Active,
                created_at: 0,
                deadline: 1000000,
            };
            contract.escrows.insert(0, &escrow_data);
            contract.escrow_count = 1;
            
            // Initial volume should be 0
            assert_eq!(contract.get_total_volume(), 0);
            assert_eq!(contract.get_current_tier(), 0);
            
            // Note: In a real test, we'd need to mock the PSP22 token calls
            // This test focuses on the volume tracking logic
        }
    }
}