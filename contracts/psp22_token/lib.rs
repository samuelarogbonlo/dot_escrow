#![cfg_attr(not(feature = "std"), no_std, no_main)]
#![allow(unexpected_cfgs)]

#[ink::contract]
mod psp22_token {
    use ink::storage::Mapping;
    use ink::prelude::string::{String, ToString};
    use ink::prelude::vec::Vec;
    use scale::{Decode, Encode};
    use ink::primitives::H160;

    /// PSP22 error types
    #[derive(Debug, PartialEq, Eq, Encode, Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum PSP22Error {
        InsufficientBalance,
        InsufficientAllowance,
        #[codec(skip)]
        Custom(String),
    }

    pub type Result<T> = core::result::Result<T, PSP22Error>;

    /// Storage for PSP22 token
    #[ink(storage)]
    pub struct Psp22Token {
        total_supply: Balance,
        balances: Mapping<H160, Balance>,
        allowances: Mapping<(H160, H160), Balance>,
        name: Option<String>,
        symbol: Option<String>,
        decimals: u8,
    }

    impl Psp22Token {
        /// Constructor that initializes with 1M tokens for testing
        #[ink(constructor)]
        pub fn new_default() -> Self {
            let caller = Self::env().caller();
            // Use checked arithmetic to prevent overflow
            let total_supply = 1_000_000_u128
                .checked_mul(10_u128.pow(12))
                .expect("Total supply overflow");

            let mut balances = Mapping::new();
            balances.insert(caller, &total_supply);

            Self {
                total_supply,
                balances,
                allowances: Mapping::new(),
                name: Some("Test USDT".to_string()),
                symbol: Some("USDT".to_string()),
                decimals: 12,
            }
        }

        /// Constructor with custom parameters
        #[ink(constructor)]
        pub fn new(
            total_supply: Balance,
            name: Option<String>,
            symbol: Option<String>,
            decimals: u8,
        ) -> Self {
            let caller = Self::env().caller();

            let mut balances = Mapping::new();
            balances.insert(caller, &total_supply);

            Self {
                total_supply,
                balances,
                allowances: Mapping::new(),
                name,
                symbol,
                decimals,
            }
        }

        /// Returns the total token supply
        #[ink(message, selector = 0x162df8c2)]
        pub fn total_supply(&self) -> Balance {
            self.total_supply
        }

        /// Returns the account balance for the specified owner
        #[ink(message, selector = 0x6568382f)]
        pub fn balance_of(&self, owner: H160) -> Balance {
            self.balances.get(owner).unwrap_or(0)
        }

        /// Returns the amount which spender is still allowed to withdraw from owner
        #[ink(message, selector = 0x4d47d921)]
        pub fn allowance(&self, owner: H160, spender: H160) -> Balance {
            self.allowances.get((owner, spender)).unwrap_or(0)
        }

        /// Transfers tokens from caller to another account
        #[ink(message, selector = 0xdb20f9f5)]
        pub fn transfer(
            &mut self,
            to: H160,
            value: Balance,
            _data: Vec<u8>,
        ) -> Result<()> {
            let from = self.env().caller();
            self.transfer_from_to(&from, &to, value)
        }

        /// Approve the passed address to spend the specified amount of tokens on behalf of caller
        #[ink(message, selector = 0xb20f1bbd)]
        pub fn approve(&mut self, spender: H160, value: Balance) -> Result<()> {
            let owner = self.env().caller();
            self.allowances.insert((owner, spender), &value);
            Ok(())
        }

        /// Transfer tokens from one account to another using allowance
        #[ink(message, selector = 0x54b3c76e)]
        pub fn transfer_from(
            &mut self,
            from: H160,
            to: H160,
            value: Balance,
            _data: Vec<u8>,
        ) -> Result<()> {
            let caller = self.env().caller();
            let allowance = self.allowance(from, caller);

            if allowance < value {
                return Err(PSP22Error::InsufficientAllowance);
            }

            self.transfer_from_to(&from, &to, value)?;
            
            // Use checked subtraction to prevent underflow
            let new_allowance = allowance
                .checked_sub(value)
                .ok_or(PSP22Error::InsufficientAllowance)?;
            self.allowances.insert((from, caller), &new_allowance);
            Ok(())
        }

        /// Increase the allowance
        #[ink(message, selector = 0x96d6b57a)]
        pub fn increase_allowance(
            &mut self,
            spender: H160,
            delta_value: Balance,
        ) -> Result<()> {
            let owner = self.env().caller();
            let current = self.allowance(owner, spender);
            
            // Use checked addition to prevent overflow
            let new_allowance = current
                .checked_add(delta_value)
                .ok_or(PSP22Error::Custom("Allowance overflow".to_string()))?;
            self.allowances.insert((owner, spender), &new_allowance);
            Ok(())
        }

        /// Decrease the allowance
        #[ink(message, selector = 0xfecb57d5)]
        pub fn decrease_allowance(
            &mut self,
            spender: H160,
            delta_value: Balance,
        ) -> Result<()> {
            let owner = self.env().caller();
            let current = self.allowance(owner, spender);

            if current < delta_value {
                return Err(PSP22Error::InsufficientAllowance);
            }

            // Use checked subtraction to prevent underflow
            let new_allowance = current
                .checked_sub(delta_value)
                .ok_or(PSP22Error::InsufficientAllowance)?;
            self.allowances.insert((owner, spender), &new_allowance);
            Ok(())
        }

        /// Token name (optional)
        #[ink(message, selector = 0x3d261bd4)]
        pub fn token_name(&self) -> Option<String> {
            self.name.clone()
        }

        /// Token symbol (optional)
        #[ink(message, selector = 0x34205be5)]
        pub fn token_symbol(&self) -> Option<String> {
            self.symbol.clone()
        }

        /// Token decimals (optional)
        #[ink(message, selector = 0x7271b782)]
        pub fn token_decimals(&self) -> u8 {
            self.decimals
        }

        /// Mint tokens (for testing purposes)
        #[ink(message)]
        pub fn mint(&mut self, to: H160, value: Balance) -> Result<()> {
            let balance = self.balance_of(to);
            
            // Use checked addition to prevent overflow
            let new_balance = balance
                .checked_add(value)
                .ok_or(PSP22Error::Custom("Balance overflow".to_string()))?;
            self.balances.insert(to, &new_balance);
            
            let new_supply = self.total_supply
                .checked_add(value)
                .ok_or(PSP22Error::Custom("Supply overflow".to_string()))?;
            self.total_supply = new_supply;
            Ok(())
        }

        /// Burn tokens (for testing purposes)
        #[ink(message)]
        pub fn burn(&mut self, from: H160, value: Balance) -> Result<()> {
            let balance = self.balance_of(from);

            if balance < value {
                return Err(PSP22Error::InsufficientBalance);
            }

            // Use checked subtraction to prevent underflow
            let new_balance = balance
                .checked_sub(value)
                .ok_or(PSP22Error::InsufficientBalance)?;
            self.balances.insert(from, &new_balance);
            
            let new_supply = self.total_supply
                .checked_sub(value)
                .ok_or(PSP22Error::InsufficientBalance)?;
            self.total_supply = new_supply;
            Ok(())
        }

        /// Helper function to transfer tokens between accounts
        fn transfer_from_to(
            &mut self,
            from: &H160,
            to: &H160,
            value: Balance,
        ) -> Result<()> {
            let from_balance = self.balance_of(*from);

            if from_balance < value {
                return Err(PSP22Error::InsufficientBalance);
            }

            // Use checked arithmetic to prevent underflow/overflow
            let new_from_balance = from_balance
                .checked_sub(value)
                .ok_or(PSP22Error::InsufficientBalance)?;
            self.balances.insert(from, &new_from_balance);
            
            let to_balance = self.balance_of(*to);
            let new_to_balance = to_balance
                .checked_add(value)
                .ok_or(PSP22Error::Custom("Balance overflow".to_string()))?;
            self.balances.insert(to, &new_to_balance);
            Ok(())
        }
    }
}