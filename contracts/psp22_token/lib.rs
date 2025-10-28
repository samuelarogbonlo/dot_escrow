#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod psp22_token {
    use ink::storage::Mapping;
    use ink::prelude::string::{String, ToString};
    use ink::prelude::vec::Vec;
    use scale::{Decode, Encode};

    /// PSP22 error types
    #[derive(Debug, PartialEq, Eq, Encode, Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum PSP22Error {
        InsufficientBalance,
        InsufficientAllowance,
        Custom(String),
    }

    pub type Result<T> = core::result::Result<T, PSP22Error>;

    /// Storage for PSP22 token
    #[ink(storage)]
    pub struct Psp22Token {
        total_supply: Balance,
        balances: Mapping<Address, Balance>,
        allowances: Mapping<(Address, Address), Balance>,
        name: Option<String>,
        symbol: Option<String>,
        decimals: u8,
    }

    impl Psp22Token {
        /// Constructor that initializes with 1M tokens for testing
        #[ink(constructor)]
        pub fn new_default() -> Self {
            let caller = Self::env().caller();
            let total_supply = 1_000_000 * 10_u128.pow(12); // 1M tokens with 12 decimals

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
        pub fn balance_of(&self, owner: Address) -> Balance {
            self.balances.get(&owner).unwrap_or(0)
        }

        /// Returns the amount which spender is still allowed to withdraw from owner
        #[ink(message, selector = 0x4d47d921)]
        pub fn allowance(&self, owner: Address, spender: Address) -> Balance {
            self.allowances.get(&(owner, spender)).unwrap_or(0)
        }

        /// Transfers tokens from caller to another account
        #[ink(message, selector = 0xdb20f9f5)]
        pub fn transfer(
            &mut self,
            to: Address,
            value: Balance,
            _data: Vec<u8>,
        ) -> Result<()> {
            let from = self.env().caller();
            self.transfer_from_to(&from, &to, value)
        }

        /// Approve the passed address to spend the specified amount of tokens on behalf of caller
        #[ink(message, selector = 0xb20f1bbd)]
        pub fn approve(&mut self, spender: Address, value: Balance) -> Result<()> {
            let owner = self.env().caller();
            self.allowances.insert((owner, spender), &value);
            Ok(())
        }

        /// Transfer tokens from one account to another using allowance
        #[ink(message, selector = 0x54b3c76e)]
        pub fn transfer_from(
            &mut self,
            from: Address,
            to: Address,
            value: Balance,
            _data: Vec<u8>,
        ) -> Result<()> {
            let caller = self.env().caller();
            let allowance = self.allowance(from, caller);

            if allowance < value {
                return Err(PSP22Error::InsufficientAllowance);
            }

            self.transfer_from_to(&from, &to, value)?;
            self.allowances.insert((from, caller), &(allowance - value));
            Ok(())
        }

        /// Increase the allowance
        #[ink(message, selector = 0x96d6b57a)]
        pub fn increase_allowance(
            &mut self,
            spender: Address,
            delta_value: Balance,
        ) -> Result<()> {
            let owner = self.env().caller();
            let current = self.allowance(owner, spender);
            self.allowances.insert((owner, spender), &(current + delta_value));
            Ok(())
        }

        /// Decrease the allowance
        #[ink(message, selector = 0xfecb57d5)]
        pub fn decrease_allowance(
            &mut self,
            spender: Address,
            delta_value: Balance,
        ) -> Result<()> {
            let owner = self.env().caller();
            let current = self.allowance(owner, spender);

            if current < delta_value {
                return Err(PSP22Error::InsufficientAllowance);
            }

            self.allowances.insert((owner, spender), &(current - delta_value));
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
        pub fn mint(&mut self, to: Address, value: Balance) -> Result<()> {
            let balance = self.balance_of(to);
            self.balances.insert(to, &(balance + value));
            self.total_supply += value;
            Ok(())
        }

        /// Burn tokens (for testing purposes)
        #[ink(message)]
        pub fn burn(&mut self, from: Address, value: Balance) -> Result<()> {
            let balance = self.balance_of(from);

            if balance < value {
                return Err(PSP22Error::InsufficientBalance);
            }

            self.balances.insert(from, &(balance - value));
            self.total_supply -= value;
            Ok(())
        }

        /// Helper function to transfer tokens between accounts
        fn transfer_from_to(
            &mut self,
            from: &Address,
            to: &Address,
            value: Balance,
        ) -> Result<()> {
            let from_balance = self.balance_of(*from);

            if from_balance < value {
                return Err(PSP22Error::InsufficientBalance);
            }

            self.balances.insert(from, &(from_balance - value));
            let to_balance = self.balance_of(*to);
            self.balances.insert(to, &(to_balance + value));
            Ok(())
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        #[ink::test]
        fn new_works() {
            let token = Psp22Token::new_default();
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            assert_eq!(token.total_supply(), 1_000_000 * 10_u128.pow(12));
            assert_eq!(token.balance_of(accounts.alice), 1_000_000 * 10_u128.pow(12));
        }

        #[ink::test]
        fn transfer_works() {
            let mut token = Psp22Token::new_default();
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();

            assert_eq!(token.transfer(accounts.bob, 100, vec![]), Ok(()));
            assert_eq!(token.balance_of(accounts.alice), 1_000_000 * 10_u128.pow(12) - 100);
            assert_eq!(token.balance_of(accounts.bob), 100);
        }

        #[ink::test]
        fn transfer_fails_insufficient_balance() {
            let mut token = Psp22Token::new_default();
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();

            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.bob);
            assert_eq!(
                token.transfer(accounts.alice, 100, vec![]),
                Err(PSP22Error::InsufficientBalance)
            );
        }

        #[ink::test]
        fn approve_works() {
            let mut token = Psp22Token::new_default();
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();

            assert_eq!(token.approve(accounts.bob, 100), Ok(()));
            assert_eq!(token.allowance(accounts.alice, accounts.bob), 100);
        }

        #[ink::test]
        fn transfer_from_works() {
            let mut token = Psp22Token::new_default();
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();

            assert_eq!(token.approve(accounts.bob, 100), Ok(()));

            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.bob);
            assert_eq!(
                token.transfer_from(accounts.alice, accounts.charlie, 50, vec![]),
                Ok(())
            );

            assert_eq!(token.balance_of(accounts.alice), 1_000_000 * 10_u128.pow(12) - 50);
            assert_eq!(token.balance_of(accounts.charlie), 50);
            assert_eq!(token.allowance(accounts.alice, accounts.bob), 50);
        }
    }
}
