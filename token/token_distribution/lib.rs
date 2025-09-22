#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod token_distribution {
    use ink::storage::Mapping;
    use ink::prelude::vec::Vec;
    use ink::prelude::string::String;

    /// PSP22 interface for token interactions
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
    #[derive(Debug, PartialEq, Eq)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    pub enum PSP22Error {
        InsufficientBalance,
        InsufficientAllowance,
        Custom(String),
    }

    /// Error types for the faucet contract
    #[derive(Debug, PartialEq, Eq)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    pub enum FaucetError {
        /// Address has already claimed tokens within the cooldown period
        AlreadyClaimed,
        /// Contract has insufficient token balance to distribute
        InsufficientTokenBalance,
        /// Only the owner can perform this action
        Unauthorized,
        /// Contract is paused
        ContractPaused,
        /// Invalid amount requested
        InvalidAmount,
        /// Token transfer failed
        TokenTransferFailed,
        /// Token contract not set
        TokenNotConfigured,
    }

    /// Storage for the PSP22 token distribution faucet
    #[ink(storage)]
    pub struct TokenDistribution {
        /// Contract owner who can manage the faucet
        owner: AccountId,
        /// PSP22 token contract address
        token_contract: Option<AccountId>,
        /// Amount of tokens to distribute per request (in token's smallest unit)
        distribution_amount: Balance,
        /// Cooldown period in milliseconds (24 hours = 86400000 ms)
        cooldown_period: u64,
        /// Mapping of address to last claim timestamp
        last_claim_time: Mapping<AccountId, u64>,
        /// Total tokens distributed so far
        total_distributed: Balance,
        /// Contract paused state
        paused: bool,
        /// List of addresses that have claimed (for tracking)
        claim_history: Vec<AccountId>,
    }

    /// Events emitted by the contract
    #[ink(event)]
    pub struct TokensDistributed {
        #[ink(topic)]
        recipient: AccountId,
        amount: Balance,
        timestamp: u64,
        token_contract: AccountId,
    }

    #[ink(event)]
    pub struct FaucetConfigUpdated {
        distribution_amount: Balance,
        cooldown_period: u64,
        token_contract: Option<AccountId>,
    }

    #[ink(event)]
    pub struct ContractPaused {
        paused: bool,
    }

    impl TokenDistribution {
        /// Constructor - initializes the faucet (token contract must be set separately)
        #[ink(constructor)]
        pub fn new() -> Self {
            let caller = Self::env().caller();
            Self {
                owner: caller,
                token_contract: None,
                distribution_amount: 2500 * 1_000_000_000_000, // 2500 tokens (assuming 12 decimals)
                cooldown_period: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
                last_claim_time: Mapping::default(),
                total_distributed: 0,
                paused: false,
                claim_history: Vec::new(),
            }
        }

        /// Constructor with token contract and custom parameters
        #[ink(constructor)]
        pub fn new_with_config(
            token_contract: AccountId,
            distribution_amount: Balance,
            cooldown_period_hours: u32,
        ) -> Self {
            let caller = Self::env().caller();
            Self {
                owner: caller,
                token_contract: Some(token_contract),
                distribution_amount,
                cooldown_period: (cooldown_period_hours as u64) * 60 * 60 * 1000,
                last_claim_time: Mapping::default(),
                total_distributed: 0,
                paused: false,
                claim_history: Vec::new(),
            }
        }

        /// Main function to claim test tokens
        #[ink(message)]
        pub fn claim_tokens(&mut self) -> Result<(), FaucetError> {
            if self.paused {
                return Err(FaucetError::ContractPaused);
            }

            let token_address = self.token_contract.ok_or(FaucetError::TokenNotConfigured)?;
            let caller = self.env().caller();
            let current_time = self.env().block_timestamp();

            // Check if address has claimed within cooldown period
            if let Some(last_claim) = self.last_claim_time.get(caller) {
                if current_time < last_claim + self.cooldown_period {
                    return Err(FaucetError::AlreadyClaimed);
                }
            }

            // Create reference to PSP22 token contract
            let mut token: ink::contract_ref!(PSP22) = token_address.into();

            // Check if faucet contract has sufficient token balance
            let faucet_balance = token.balance_of(self.env().account_id());
            if faucet_balance < self.distribution_amount {
                return Err(FaucetError::InsufficientTokenBalance);
            }

            // Transfer tokens to the caller
            match token.transfer(caller, self.distribution_amount, Vec::new()) {
                Ok(_) => {
                    // Update records
                    self.last_claim_time.insert(caller, &current_time);
                    self.total_distributed += self.distribution_amount;
                    
                    // Add to history if not already present
                    if !self.claim_history.contains(&caller) {
                        self.claim_history.push(caller);
                    }

                    // Emit event
                    self.env().emit_event(TokensDistributed {
                        recipient: caller,
                        amount: self.distribution_amount,
                        timestamp: current_time,
                        token_contract: token_address,
                    });

                    Ok(())
                },
                Err(_) => Err(FaucetError::TokenTransferFailed),
            }
        }

        /// Check if an address can claim tokens (not in cooldown)
        #[ink(message)]
        pub fn can_claim(&self, address: AccountId) -> bool {
            if self.paused || self.token_contract.is_none() {
                return false;
            }

            let current_time = self.env().block_timestamp();
            
            match self.last_claim_time.get(address) {
                Some(last_claim) => current_time >= last_claim + self.cooldown_period,
                None => true, // Never claimed before
            }
        }

        /// Get time remaining until address can claim again (in milliseconds)
        #[ink(message)]
        pub fn time_until_next_claim(&self, address: AccountId) -> u64 {
            let current_time = self.env().block_timestamp();
            
            match self.last_claim_time.get(address) {
                Some(last_claim) => {
                    let next_claim_time = last_claim + self.cooldown_period;
                    if current_time >= next_claim_time {
                        0 // Can claim now
                    } else {
                        next_claim_time - current_time
                    }
                },
                None => 0, // Never claimed, can claim now
            }
        }

        /// Get the last claim time for an address
        #[ink(message)]
        pub fn get_last_claim_time(&self, address: AccountId) -> Option<u64> {
            self.last_claim_time.get(address)
        }

        /// Get contract configuration
        #[ink(message)]
        pub fn get_config(&self) -> (Option<AccountId>, Balance, u64, Balance, bool) {
            (
                self.token_contract,
                self.distribution_amount,
                self.cooldown_period,
                self.total_distributed,
                self.paused,
            )
        }

        /// Get faucet's token balance from the PSP22 contract
        #[ink(message)]
        pub fn get_token_balance(&self) -> Result<Balance, FaucetError> {
            let token_address = self.token_contract.ok_or(FaucetError::TokenNotConfigured)?;
            let token: ink::contract_ref!(PSP22) = token_address.into();
            Ok(token.balance_of(self.env().account_id()))
        }

        /// Get total number of unique claimers
        #[ink(message)]
        pub fn get_unique_claimers_count(&self) -> u32 {
            self.claim_history.len() as u32
        }

        /// Check if faucet has enough tokens for distribution
        #[ink(message)]
        pub fn check_faucet_balance(&self) -> Result<(Balance, bool), FaucetError> {
            let token_address = self.token_contract.ok_or(FaucetError::TokenNotConfigured)?;
            let token: ink::contract_ref!(PSP22) = token_address.into();
            let balance = token.balance_of(self.env().account_id());
            let can_distribute = balance >= self.distribution_amount;
            Ok((balance, can_distribute))
        }

        /// Owner-only functions

        /// Set the PSP22 token contract address (owner only)
        #[ink(message)]
        pub fn set_token_contract(&mut self, token_contract: AccountId) -> Result<(), FaucetError> {
            if self.env().caller() != self.owner {
                return Err(FaucetError::Unauthorized);
            }
            
            self.token_contract = Some(token_contract);
            
            self.env().emit_event(FaucetConfigUpdated {
                distribution_amount: self.distribution_amount,
                cooldown_period: self.cooldown_period,
                token_contract: self.token_contract,
            });
            
            Ok(())
        }

        /// Update distribution amount (owner only)
        #[ink(message)]
        pub fn set_distribution_amount(&mut self, amount: Balance) -> Result<(), FaucetError> {
            if self.env().caller() != self.owner {
                return Err(FaucetError::Unauthorized);
            }
            
            self.distribution_amount = amount;
            
            self.env().emit_event(FaucetConfigUpdated {
                distribution_amount: self.distribution_amount,
                cooldown_period: self.cooldown_period,
                token_contract: self.token_contract,
            });
            
            Ok(())
        }

        /// Update cooldown period in hours (owner only)
        #[ink(message)]
        pub fn set_cooldown_period(&mut self, hours: u32) -> Result<(), FaucetError> {
            if self.env().caller() != self.owner {
                return Err(FaucetError::Unauthorized);
            }
            
            self.cooldown_period = (hours as u64) * 60 * 60 * 1000;
            
            self.env().emit_event(FaucetConfigUpdated {
                distribution_amount: self.distribution_amount,
                cooldown_period: self.cooldown_period,
                token_contract: self.token_contract,
            });
            
            Ok(())
        }

        /// Pause/unpause the contract (owner only)
        #[ink(message)]
        pub fn set_paused(&mut self, paused: bool) -> Result<(), FaucetError> {
            if self.env().caller() != self.owner {
                return Err(FaucetError::Unauthorized);
            }
            
            self.paused = paused;
            
            self.env().emit_event(ContractPaused { paused });
            
            Ok(())
        }

        /// Get owner address
        #[ink(message)]
        pub fn get_owner(&self) -> AccountId {
            self.owner
        }

        /// Get token contract address
        #[ink(message)]
        pub fn get_token_contract(&self) -> Option<AccountId> {
            self.token_contract
        }

        /// Emergency function to recover any native tokens sent to this contract
        #[ink(message)]
        pub fn withdraw_native(&mut self, amount: Balance) -> Result<(), FaucetError> {
            if self.env().caller() != self.owner {
                return Err(FaucetError::Unauthorized);
            }
            
            if self.env().transfer(self.owner, amount).is_err() {
                return Err(FaucetError::InsufficientTokenBalance);
            }
            
            Ok(())
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        #[ink::test]
        fn new_works() {
            let contract = TokenDistribution::new();
            assert_eq!(contract.distribution_amount, 2500 * 1_000_000_000_000);
            assert_eq!(contract.cooldown_period, 24 * 60 * 60 * 1000);
            assert_eq!(contract.total_distributed, 0);
            assert_eq!(contract.paused, false);
            assert_eq!(contract.token_contract, None);
        }

        #[ink::test]
        fn can_claim_returns_false_when_no_token_contract() {
            let contract = TokenDistribution::new();
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            
            // Should return false when no token contract is set
            assert!(!contract.can_claim(accounts.alice));
        }

        #[ink::test]
        fn set_token_contract_works() {
            let mut contract = TokenDistribution::new();
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            
            // Should succeed as owner
            assert_eq!(contract.set_token_contract(accounts.bob), Ok(()));
            assert_eq!(contract.token_contract, Some(accounts.bob));
        }

        #[ink::test]
        fn unauthorized_fails() {
            let mut contract = TokenDistribution::new();
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            
            // Change caller to non-owner
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.bob);
            
            // Should fail as non-owner
            assert_eq!(
                contract.set_token_contract(accounts.charlie),
                Err(FaucetError::Unauthorized)
            );
        }
    }
}