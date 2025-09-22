#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod my_test_token {
    use ink::storage::Mapping;
    use ink::prelude::string::{String, ToString};
    use ink::prelude::vec::Vec;
    use scale::{Decode, Encode}; // Add this import

    /// PSP22 error types
    #[derive(Debug, PartialEq, Eq, Encode, Decode)] // Fixed: Use standard derive syntax
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))] // Fixed: Conditional TypeInfo derive
    pub enum PSP22Error {
        InsufficientBalance,
        InsufficientAllowance,
        Custom(String),
    }

    /// Storage for PSP22 token
    #[ink(storage)]
    pub struct MyTestToken {
        /// Total supply of tokens
        total_supply: Balance,
        /// Mapping from owner to number of owned tokens
        balances: Mapping<AccountId, Balance>,
        /// Mapping from owner to operator approvals
        allowances: Mapping<(AccountId, AccountId), Balance>,
        /// Token name
        name: Option<String>,
        /// Token symbol
        symbol: Option<String>,
        /// Token decimals
        decimals: u8,
    }

    /// Events emitted by PSP22
    #[ink(event)]
    pub struct Transfer {
        #[ink(topic)]
        from: Option<AccountId>,
        #[ink(topic)]
        to: Option<AccountId>,
        value: Balance,
    }

    #[ink(event)]
    pub struct Approval {
        #[ink(topic)]
        owner: AccountId,
        #[ink(topic)]
        spender: AccountId,
        value: Balance,
    }

    impl MyTestToken {
        /// Constructor that initializes the token with initial supply
        #[ink(constructor)]
        pub fn new(
            total_supply: Balance,
            name: Option<String>,
            symbol: Option<String>,
            decimals: u8,
        ) -> Self {
            let mut balances = Mapping::default();
            let caller = Self::env().caller();
            balances.insert(caller, &total_supply);

            Self::env().emit_event(Transfer {
                from: None,
                to: Some(caller),
                value: total_supply,
            });

            Self {
                total_supply,
                balances,
                allowances: Mapping::default(),
                name,
                symbol,
                decimals,
            }
        }

        /// Constructor with default values for testing
        #[ink(constructor)]
        pub fn new_default() -> Self {
            let total_supply = 1_000_000 * 10_u128.pow(12); // 1M tokens with 12 decimals
            Self::new(
                total_supply,
                Some("Test Token".to_string()),
                Some("TEST".to_string()),
                12,
            )
        }

        /// Returns the total supply of tokens
        #[ink(message)]
        pub fn total_supply(&self) -> Balance {
            self.total_supply
        }

        /// Returns the balance of the specified account
        #[ink(message)]
        pub fn balance_of(&self, owner: AccountId) -> Balance {
            self.balances.get(owner).unwrap_or(0)
        }

        /// Returns the allowance that spender is allowed to withdraw from owner
        #[ink(message)]
        pub fn allowance(&self, owner: AccountId, spender: AccountId) -> Balance {
            self.allowances.get((owner, spender)).unwrap_or(0)
        }

        /// Transfers `value` amount of tokens from caller to `to`
        #[ink(message)]
        pub fn transfer(
            &mut self,
            to: AccountId,
            value: Balance,
            _data: Vec<u8>,
        ) -> Result<(), PSP22Error> {
            let from = self.env().caller();
            self.transfer_from_to(from, to, value)
        }

        /// Transfers `value` tokens from `from` to `to` using allowance
        #[ink(message)]
        pub fn transfer_from(
            &mut self,
            from: AccountId,
            to: AccountId,
            value: Balance,
            _data: Vec<u8>,
        ) -> Result<(), PSP22Error> {
            let caller = self.env().caller();
            
            // Check allowance if not self-transfer
            if from != caller {
                let allowance = self.allowance(from, caller);
                if allowance < value {
                    return Err(PSP22Error::InsufficientAllowance);
                }
                
                // Update allowance
                self.allowances.insert((from, caller), &(allowance - value));
            }
            
            self.transfer_from_to(from, to, value)
        }

        /// Allows `spender` to withdraw from caller's account multiple times up to `value`
        #[ink(message)]
        pub fn approve(&mut self, spender: AccountId, value: Balance) -> Result<(), PSP22Error> {
            let owner = self.env().caller();
            self.allowances.insert((owner, spender), &value);

            self.env().emit_event(Approval {
                owner,
                spender,
                value,
            });

            Ok(())
        }

        /// Increases the allowance granted to `spender` by the caller
        #[ink(message)]
        pub fn increase_allowance(
            &mut self,
            spender: AccountId,
            delta_value: Balance,
        ) -> Result<(), PSP22Error> {
            let owner = self.env().caller();
            let allowance = self.allowance(owner, spender);
            self.approve(spender, allowance + delta_value)
        }

        /// Decreases the allowance granted to `spender` by the caller
        #[ink(message)]
        pub fn decrease_allowance(
            &mut self,
            spender: AccountId,
            delta_value: Balance,
        ) -> Result<(), PSP22Error> {
            let owner = self.env().caller();
            let allowance = self.allowance(owner, spender);
            
            if allowance < delta_value {
                return Err(PSP22Error::InsufficientAllowance);
            }
            
            self.approve(spender, allowance - delta_value)
        }

        /// Token metadata functions

        /// Returns the name of the token
        #[ink(message)]
        pub fn token_name(&self) -> Option<String> {
            self.name.clone()
        }

        /// Returns the symbol of the token
        #[ink(message)]
        pub fn token_symbol(&self) -> Option<String> {
            self.symbol.clone()
        }

        /// Returns the decimals of the token
        #[ink(message)]
        pub fn token_decimals(&self) -> u8 {
            self.decimals
        }

        /// Internal transfer function
        fn transfer_from_to(
            &mut self,
            from: AccountId,
            to: AccountId,
            value: Balance,
        ) -> Result<(), PSP22Error> {
            let from_balance = self.balance_of(from);
            if from_balance < value {
                return Err(PSP22Error::InsufficientBalance);
            }

            // Update balances
            self.balances.insert(from, &(from_balance - value));
            let to_balance = self.balance_of(to);
            self.balances.insert(to, &(to_balance + value));

            // Emit transfer event
            self.env().emit_event(Transfer {
                from: Some(from),
                to: Some(to),
                value,
            });

            Ok(())
        }

        /// Mint new tokens (only for testing purposes)
        /// In production, you might want to restrict this to specific roles
        #[ink(message)]
        pub fn mint(&mut self, account: AccountId, amount: Balance) -> Result<(), PSP22Error> {
            let balance = self.balance_of(account);
            self.balances.insert(account, &(balance + amount));
            self.total_supply += amount;

            self.env().emit_event(Transfer {
                from: None,
                to: Some(account),
                value: amount,
            });

            Ok(())
        }

        /// Burn tokens from caller's account
        #[ink(message)]
        pub fn burn(&mut self, amount: Balance) -> Result<(), PSP22Error> {
            let caller = self.env().caller();
            let balance = self.balance_of(caller);
            
            if balance < amount {
                return Err(PSP22Error::InsufficientBalance);
            }

            self.balances.insert(caller, &(balance - amount));
            self.total_supply -= amount;

            self.env().emit_event(Transfer {
                from: Some(caller),
                to: None,
                value: amount,
            });

            Ok(())
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        #[ink::test]
        fn new_works() {
            let contract = MyTestToken::new_default();
            assert_eq!(contract.total_supply(), 1_000_000 * 10_u128.pow(12));
        }

        #[ink::test]
        fn balance_works() {
            let contract = MyTestToken::new_default();
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            assert_eq!(contract.balance_of(accounts.alice), 1_000_000 * 10_u128.pow(12));
            assert_eq!(contract.balance_of(accounts.bob), 0);
        }

        #[ink::test]
        fn transfer_works() {
            let mut contract = MyTestToken::new_default();
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            
            assert_eq!(contract.transfer(accounts.bob, 1000, Vec::new()), Ok(()));
            assert_eq!(contract.balance_of(accounts.alice), 1_000_000 * 10_u128.pow(12) - 1000);
            assert_eq!(contract.balance_of(accounts.bob), 1000);
        }

        #[ink::test]
        fn allowance_works() {
            let mut contract = MyTestToken::new_default();
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            
            assert_eq!(contract.approve(accounts.bob, 1000), Ok(()));
            assert_eq!(contract.allowance(accounts.alice, accounts.bob), 1000);
        }

        #[ink::test]
        fn mint_works() {
            let mut contract = MyTestToken::new_default();
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            
            assert_eq!(contract.mint(accounts.bob, 1000), Ok(()));
            assert_eq!(contract.balance_of(accounts.bob), 1000);
            assert_eq!(contract.total_supply(), 1_000_000 * 10_u128.pow(12) + 1000);
        }
    }
}