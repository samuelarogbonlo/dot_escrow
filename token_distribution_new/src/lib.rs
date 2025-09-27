#![cfg_attr(not(feature = "std"), no_std, no_main)]
#![allow(clippy::cast_possible_truncation)]
#![allow(clippy::new_without_default)]

#[ink::contract]
mod token_distribution {
    use ink::storage::Mapping;
    use ink::prelude::vec::Vec;
    use ink::prelude::string::String;

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

    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum PSP22Error {
        InsufficientBalance,
        InsufficientAllowance,
        Custom(String),
    }

    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum FaucetError {
        AlreadyClaimed,
        InsufficientTokenBalance,
        Unauthorized,
        ContractPaused,
        InvalidAmount,
        TokenTransferFailed,
        TokenNotConfigured,
        DailyLimitExceeded,
        HourlyLimitExceeded,
    }

    #[ink(storage)]
    pub struct TokenDistribution {
        owner: AccountId,
        token_contract: Option<AccountId>,
        distribution_amount: Balance,
        cooldown_period: u64,
        last_claim_time: Mapping<AccountId, u64>,
        total_distributed: Balance,
        paused: bool,
        unique_claimers: Mapping<AccountId, bool>,
        unique_claimers_count: u32,
        daily_distributed: Balance,
        daily_reset_time: u64,
        hourly_distributed: Balance,
        hourly_reset_time: u64,
        max_daily_distribution: Balance,
        max_hourly_distribution: Balance,
    }

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
        #[ink(constructor)]
        pub fn new() -> Self {
            let caller = Self::env().caller();
            let current_time = Self::env().block_timestamp();
            Self {
                owner: caller,
                token_contract: None,
                distribution_amount: 250_000_000,
                cooldown_period: 86_400_000,
                last_claim_time: Mapping::default(),
                total_distributed: 0,
                paused: false,
                unique_claimers: Mapping::default(),
                unique_claimers_count: 0,
                daily_distributed: 0,
                daily_reset_time: current_time.saturating_add(86_400_000),
                hourly_distributed: 0,
                hourly_reset_time: current_time.saturating_add(3_600_000),
                max_daily_distribution: 100_000_000_000,
                max_hourly_distribution: 10_000_000_000,
            }
        }

        #[ink(constructor)]
        pub fn new_with_config(
            token_contract: AccountId,
            distribution_amount: Balance,
            cooldown_period_hours: u32,
        ) -> Self {
            let caller = Self::env().caller();
            let current_time = Self::env().block_timestamp();
            Self {
                owner: caller,
                token_contract: Some(token_contract),
                distribution_amount,
                cooldown_period: u64::from(cooldown_period_hours).saturating_mul(3_600_000),
                last_claim_time: Mapping::default(),
                total_distributed: 0,
                paused: false,
                unique_claimers: Mapping::default(),
                unique_claimers_count: 0,
                daily_distributed: 0,
                daily_reset_time: current_time.saturating_add(86_400_000),
                hourly_distributed: 0,
                hourly_reset_time: current_time.saturating_add(3_600_000),
                max_daily_distribution: 100_000_000_000,
                max_hourly_distribution: 10_000_000_000,
            }
        }

        #[ink(message)]
        pub fn claim_tokens_for(&mut self, recipient: AccountId) -> Result<(), FaucetError> {
            if self.paused {
                return Err(FaucetError::ContractPaused);
            }

            let token_address = self.token_contract.ok_or(FaucetError::TokenNotConfigured)?;
            let current_time = self.env().block_timestamp();

            self.reset_rate_limits_if_needed(current_time);

            if self.daily_distributed.saturating_add(self.distribution_amount) > self.max_daily_distribution {
                return Err(FaucetError::DailyLimitExceeded);
            }

            if self.hourly_distributed.saturating_add(self.distribution_amount) > self.max_hourly_distribution {
                return Err(FaucetError::HourlyLimitExceeded);
            }

            if let Some(last_claim) = self.last_claim_time.get(recipient) {
                if current_time < last_claim.saturating_add(self.cooldown_period) {
                    return Err(FaucetError::AlreadyClaimed);
                }
            }

            let mut token: ink::contract_ref!(PSP22) = token_address.into();

            let faucet_balance = token.balance_of(self.env().account_id());
            if faucet_balance < self.distribution_amount {
                return Err(FaucetError::InsufficientTokenBalance);
            }

            match token.transfer(recipient, self.distribution_amount, Vec::new()) {
                Ok(_) => {
                    self.last_claim_time.insert(recipient, &current_time);
                    self.total_distributed = self.total_distributed.saturating_add(self.distribution_amount);
                    self.daily_distributed = self.daily_distributed.saturating_add(self.distribution_amount);
                    self.hourly_distributed = self.hourly_distributed.saturating_add(self.distribution_amount);

                    if !self.unique_claimers.get(recipient).unwrap_or(false) {
                        self.unique_claimers.insert(recipient, &true);
                        self.unique_claimers_count = self.unique_claimers_count.saturating_add(1);
                    }

                    self.env().emit_event(TokensDistributed {
                        recipient,
                        amount: self.distribution_amount,
                        timestamp: current_time,
                        token_contract: token_address,
                    });

                    Ok(())
                },
                Err(_) => Err(FaucetError::TokenTransferFailed),
            }
        }

        fn reset_rate_limits_if_needed(&mut self, current_time: u64) {
            if current_time >= self.daily_reset_time {
                self.daily_distributed = 0;
                self.daily_reset_time = current_time.saturating_add(86_400_000);
            }

            if current_time >= self.hourly_reset_time {
                self.hourly_distributed = 0;
                self.hourly_reset_time = current_time.saturating_add(3_600_000);
            }
        }

        #[ink(message)]
        pub fn claim_tokens(&mut self) -> Result<(), FaucetError> {
            let caller = self.env().caller();
            self.claim_tokens_for(caller)
        }

        #[ink(message)]
        pub fn can_claim_for(&self, recipient: AccountId) -> bool {
            if self.paused || self.token_contract.is_none() {
                return false;
            }

            let current_time = self.env().block_timestamp();

            match self.last_claim_time.get(recipient) {
                Some(last_claim) => current_time >= last_claim.saturating_add(self.cooldown_period),
                None => true,
            }
        }

        #[ink(message)]
        pub fn can_claim(&self, address: AccountId) -> bool {
            self.can_claim_for(address)
        }

        #[ink(message)]
        pub fn time_until_next_claim_for(&self, recipient: AccountId) -> u64 {
            let current_time = self.env().block_timestamp();

            match self.last_claim_time.get(recipient) {
                Some(last_claim) => {
                    let next_claim_time = last_claim.saturating_add(self.cooldown_period);
                    next_claim_time.saturating_sub(current_time)
                },
                None => 0,
            }
        }

        #[ink(message)]
        pub fn time_until_next_claim(&self, address: AccountId) -> u64 {
            self.time_until_next_claim_for(address)
        }

        #[ink(message)]
        pub fn get_last_claim_time(&self, address: AccountId) -> Option<u64> {
            self.last_claim_time.get(address)
        }

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

        #[ink(message)]
        pub fn get_token_balance(&self) -> Result<Balance, FaucetError> {
            let token_address = self.token_contract.ok_or(FaucetError::TokenNotConfigured)?;
            let token: ink::contract_ref!(PSP22) = token_address.into();
            Ok(token.balance_of(self.env().account_id()))
        }

        #[ink(message)]
        pub fn get_unique_claimers_count(&self) -> u32 {
            self.unique_claimers_count
        }

        #[ink(message)]
        pub fn check_faucet_balance(&self) -> Result<(Balance, bool), FaucetError> {
            let token_address = self.token_contract.ok_or(FaucetError::TokenNotConfigured)?;
            let token: ink::contract_ref!(PSP22) = token_address.into();
            let balance = token.balance_of(self.env().account_id());
            let can_distribute = balance >= self.distribution_amount;
            Ok((balance, can_distribute))
        }

        #[ink(message)]
        pub fn get_rate_limits(&self) -> (Balance, Balance, Balance, Balance) {
            (self.max_daily_distribution, self.daily_distributed, self.max_hourly_distribution, self.hourly_distributed)
        }

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

        #[ink(message)]
        pub fn set_cooldown_period(&mut self, hours: u32) -> Result<(), FaucetError> {
            if self.env().caller() != self.owner {
                return Err(FaucetError::Unauthorized);
            }

            self.cooldown_period = u64::from(hours).saturating_mul(3_600_000);

            self.env().emit_event(FaucetConfigUpdated {
                distribution_amount: self.distribution_amount,
                cooldown_period: self.cooldown_period,
                token_contract: self.token_contract,
            });

            Ok(())
        }

        #[ink(message)]
        pub fn set_rate_limits(&mut self, max_daily: Balance, max_hourly: Balance) -> Result<(), FaucetError> {
            if self.env().caller() != self.owner {
                return Err(FaucetError::Unauthorized);
            }

            self.max_daily_distribution = max_daily;
            self.max_hourly_distribution = max_hourly;

            Ok(())
        }

        #[ink(message)]
        pub fn set_paused(&mut self, paused: bool) -> Result<(), FaucetError> {
            if self.env().caller() != self.owner {
                return Err(FaucetError::Unauthorized);
            }

            self.paused = paused;

            self.env().emit_event(ContractPaused { paused });

            Ok(())
        }

        #[ink(message)]
        pub fn transfer_ownership(&mut self, new_owner: AccountId) -> Result<(), FaucetError> {
            if self.env().caller() != self.owner {
                return Err(FaucetError::Unauthorized);
            }

            self.owner = new_owner;
            Ok(())
        }

        #[ink(message)]
        pub fn get_owner(&self) -> AccountId {
            self.owner
        }

        #[ink(message)]
        pub fn get_token_contract(&self) -> Option<AccountId> {
            self.token_contract
        }

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
            assert_eq!(contract.distribution_amount, 250_000_000);
            assert_eq!(contract.cooldown_period, 86_400_000);
            assert_eq!(contract.total_distributed, 0);
            assert_eq!(contract.paused, false);
            assert_eq!(contract.token_contract, None);
            assert_eq!(contract.unique_claimers_count, 0);
        }

        #[ink::test]
        fn new_with_config_works() {
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            let contract = TokenDistribution::new_with_config(
                accounts.bob,
                1_000_000,
                48,
            );
            assert_eq!(contract.token_contract, Some(accounts.bob));
            assert_eq!(contract.distribution_amount, 1_000_000);
            assert_eq!(contract.cooldown_period, 48_u64.saturating_mul(3_600_000));
        }

        #[ink::test]
        fn can_claim_returns_false_when_no_token_contract() {
            let contract = TokenDistribution::new();
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            assert!(!contract.can_claim_for(accounts.alice));
        }

        #[ink::test]
        fn can_claim_returns_false_when_paused() {
            let mut contract = TokenDistribution::new();
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            contract.set_token_contract(accounts.bob).unwrap();
            contract.set_paused(true).unwrap();
            assert!(!contract.can_claim_for(accounts.alice));
        }

        #[ink::test]
        fn set_token_contract_works() {
            let mut contract = TokenDistribution::new();
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            assert_eq!(contract.set_token_contract(accounts.bob), Ok(()));
            assert_eq!(contract.token_contract, Some(accounts.bob));
        }

        #[ink::test]
        fn set_token_contract_fails_for_non_owner() {
            let mut contract = TokenDistribution::new();
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.bob);
            assert_eq!(contract.set_token_contract(accounts.charlie), Err(FaucetError::Unauthorized));
        }

        #[ink::test]
        fn set_distribution_amount_works() {
            let mut contract = TokenDistribution::new();
            let new_amount = 5_000_000;
            assert_eq!(contract.set_distribution_amount(new_amount), Ok(()));
            assert_eq!(contract.distribution_amount, new_amount);
        }

        #[ink::test]
        fn set_distribution_amount_fails_for_non_owner() {
            let mut contract = TokenDistribution::new();
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.bob);
            assert_eq!(contract.set_distribution_amount(1000), Err(FaucetError::Unauthorized));
        }

        #[ink::test]
        fn set_cooldown_period_works() {
            let mut contract = TokenDistribution::new();
            assert_eq!(contract.set_cooldown_period(48), Ok(()));
            assert_eq!(contract.cooldown_period, 48_u64.saturating_mul(3_600_000));
        }

        #[ink::test]
        fn set_cooldown_period_fails_for_non_owner() {
            let mut contract = TokenDistribution::new();
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.bob);
            assert_eq!(contract.set_cooldown_period(48), Err(FaucetError::Unauthorized));
        }

        #[ink::test]
        fn set_paused_works() {
            let mut contract = TokenDistribution::new();
            assert_eq!(contract.set_paused(true), Ok(()));
            assert_eq!(contract.paused, true);
            assert_eq!(contract.set_paused(false), Ok(()));
            assert_eq!(contract.paused, false);
        }

        #[ink::test]
        fn set_paused_fails_for_non_owner() {
            let mut contract = TokenDistribution::new();
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.bob);
            assert_eq!(contract.set_paused(true), Err(FaucetError::Unauthorized));
        }

        #[ink::test]
        fn set_rate_limits_works() {
            let mut contract = TokenDistribution::new();
            let new_daily = 200_000_000_000;
            let new_hourly = 20_000_000_000;
            assert_eq!(contract.set_rate_limits(new_daily, new_hourly), Ok(()));
            assert_eq!(contract.max_daily_distribution, new_daily);
            assert_eq!(contract.max_hourly_distribution, new_hourly);
        }

        #[ink::test]
        fn set_rate_limits_fails_for_non_owner() {
            let mut contract = TokenDistribution::new();
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.bob);
            assert_eq!(contract.set_rate_limits(1000, 500), Err(FaucetError::Unauthorized));
        }

        #[ink::test]
        fn transfer_ownership_works() {
            let mut contract = TokenDistribution::new();
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            assert_eq!(contract.transfer_ownership(accounts.bob), Ok(()));
            assert_eq!(contract.owner, accounts.bob);
        }

        #[ink::test]
        fn transfer_ownership_fails_for_non_owner() {
            let mut contract = TokenDistribution::new();
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.bob);
            assert_eq!(contract.transfer_ownership(accounts.charlie), Err(FaucetError::Unauthorized));
        }

        #[ink::test]
        fn get_config_works() {
            let contract = TokenDistribution::new();
            let (token, amount, cooldown, distributed, paused) = contract.get_config();
            assert_eq!(token, None);
            assert_eq!(amount, 250_000_000);
            assert_eq!(cooldown, 86_400_000);
            assert_eq!(distributed, 0);
            assert_eq!(paused, false);
        }

        #[ink::test]
        fn get_rate_limits_works() {
            let contract = TokenDistribution::new();
            let (max_daily, daily, max_hourly, hourly) = contract.get_rate_limits();
            assert_eq!(max_daily, 100_000_000_000);
            assert_eq!(daily, 0);
            assert_eq!(max_hourly, 10_000_000_000);
            assert_eq!(hourly, 0);
        }

        #[ink::test]
        fn get_owner_works() {
            let contract = TokenDistribution::new();
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            assert_eq!(contract.get_owner(), accounts.alice);
        }

        #[ink::test]
        fn get_unique_claimers_count_starts_at_zero() {
            let contract = TokenDistribution::new();
            assert_eq!(contract.get_unique_claimers_count(), 0);
        }

        #[ink::test]
        fn time_until_next_claim_returns_zero_for_new_address() {
            let contract = TokenDistribution::new();
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            assert_eq!(contract.time_until_next_claim_for(accounts.alice), 0);
        }

        #[ink::test]
        fn get_last_claim_time_returns_none_for_new_address() {
            let contract = TokenDistribution::new();
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            assert_eq!(contract.get_last_claim_time(accounts.alice), None);
        }

        #[ink::test]
        fn claim_tokens_fails_when_paused() {
            let mut contract = TokenDistribution::new();
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            contract.set_token_contract(accounts.bob).unwrap();
            contract.set_paused(true).unwrap();
            assert_eq!(contract.claim_tokens(), Err(FaucetError::ContractPaused));
        }

        #[ink::test]
        fn claim_tokens_fails_when_token_not_configured() {
            let mut contract = TokenDistribution::new();
            assert_eq!(contract.claim_tokens(), Err(FaucetError::TokenNotConfigured));
        }

        #[ink::test]
        fn get_token_balance_fails_when_token_not_configured() {
            let contract = TokenDistribution::new();
            assert_eq!(contract.get_token_balance(), Err(FaucetError::TokenNotConfigured));
        }

        #[ink::test]
        fn check_faucet_balance_fails_when_token_not_configured() {
            let contract = TokenDistribution::new();
            assert_eq!(contract.check_faucet_balance(), Err(FaucetError::TokenNotConfigured));
        }

        #[ink::test]
        fn can_claim_for_different_recipient() {
            let mut contract = TokenDistribution::new();
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            contract.set_token_contract(accounts.bob).unwrap();
            assert!(contract.can_claim_for(accounts.charlie));
        }
    }

    #[cfg(all(test, feature = "e2e-tests"))]
    mod e2e_tests {
        use super::*;
        use ink_e2e::build_message;

        type E2EResult<T> = std::result::Result<T, Box<dyn std::error::Error>>;

        #[ink_e2e::test]
        async fn e2e_new_works(mut client: ink_e2e::Client<C, E>) -> E2EResult<()> {
            let constructor = TokenDistributionRef::new();
            let contract_account_id = client
                .instantiate("token_distribution_new", &ink_e2e::alice(), constructor, 0, None)
                .await
                .expect("instantiate failed")
                .account_id;

            let get_config = build_message::<TokenDistributionRef>(contract_account_id.clone())
                .call(|contract| contract.get_config());
            let get_config_result = client.call_dry_run(&ink_e2e::alice(), &get_config, 0, None).await;

            let (token, amount, cooldown, distributed, paused) = get_config_result.return_value();
            assert_eq!(token, None);
            assert_eq!(amount, 250_000_000);
            assert_eq!(cooldown, 86_400_000);
            assert_eq!(distributed, 0);
            assert_eq!(paused, false);

            Ok(())
        }

        #[ink_e2e::test]
        async fn e2e_set_token_contract_works(mut client: ink_e2e::Client<C, E>) -> E2EResult<()> {
            let constructor = TokenDistributionRef::new();
            let contract_account_id = client
                .instantiate("token_distribution_new", &ink_e2e::alice(), constructor, 0, None)
                .await
                .expect("instantiate failed")
                .account_id;

            let set_token = build_message::<TokenDistributionRef>(contract_account_id.clone())
                .call(|contract| contract.set_token_contract(ink_e2e::account_id(ink_e2e::AccountKeyring::Bob)));
            let _set_result = client
                .call(&ink_e2e::alice(), set_token, 0, None)
                .await
                .expect("set_token_contract failed");

            let get_token = build_message::<TokenDistributionRef>(contract_account_id.clone())
                .call(|contract| contract.get_token_contract());
            let get_result = client.call_dry_run(&ink_e2e::alice(), &get_token, 0, None).await;

            assert_eq!(get_result.return_value(), Some(ink_e2e::account_id(ink_e2e::AccountKeyring::Bob)));

            Ok(())
        }

        #[ink_e2e::test]
        async fn e2e_pause_unpause_works(mut client: ink_e2e::Client<C, E>) -> E2EResult<()> {
            let constructor = TokenDistributionRef::new();
            let contract_account_id = client
                .instantiate("token_distribution_new", &ink_e2e::alice(), constructor, 0, None)
                .await
                .expect("instantiate failed")
                .account_id;

            let set_paused = build_message::<TokenDistributionRef>(contract_account_id.clone())
                .call(|contract| contract.set_paused(true));
            let _pause_result = client
                .call(&ink_e2e::alice(), set_paused, 0, None)
                .await
                .expect("set_paused failed");

            let get_config = build_message::<TokenDistributionRef>(contract_account_id.clone())
                .call(|contract| contract.get_config());
            let config_result = client.call_dry_run(&ink_e2e::alice(), &get_config, 0, None).await;

            let (_, _, _, _, paused) = config_result.return_value();
            assert_eq!(paused, true);

            Ok(())
        }

        #[ink_e2e::test]
        async fn e2e_transfer_ownership_works(mut client: ink_e2e::Client<C, E>) -> E2EResult<()> {
            let constructor = TokenDistributionRef::new();
            let contract_account_id = client
                .instantiate("token_distribution_new", &ink_e2e::alice(), constructor, 0, None)
                .await
                .expect("instantiate failed")
                .account_id;

            let transfer_ownership = build_message::<TokenDistributionRef>(contract_account_id.clone())
                .call(|contract| contract.transfer_ownership(ink_e2e::account_id(ink_e2e::AccountKeyring::Bob)));
            let _transfer_result = client
                .call(&ink_e2e::alice(), transfer_ownership, 0, None)
                .await
                .expect("transfer_ownership failed");

            let get_owner = build_message::<TokenDistributionRef>(contract_account_id.clone())
                .call(|contract| contract.get_owner());
            let owner_result = client.call_dry_run(&ink_e2e::alice(), &get_owner, 0, None).await;

            assert_eq!(owner_result.return_value(), ink_e2e::account_id(ink_e2e::AccountKeyring::Bob));

            Ok(())
        }

        #[ink_e2e::test]
        async fn e2e_unauthorized_fails(mut client: ink_e2e::Client<C, E>) -> E2EResult<()> {
            let constructor = TokenDistributionRef::new();
            let contract_account_id = client
                .instantiate("token_distribution_new", &ink_e2e::alice(), constructor, 0, None)
                .await
                .expect("instantiate failed")
                .account_id;

            let set_paused = build_message::<TokenDistributionRef>(contract_account_id.clone())
                .call(|contract| contract.set_paused(true));
            let result = client
                .call(&ink_e2e::bob(), set_paused, 0, None)
                .await;

            assert!(result.is_err());

            Ok(())
        }
    }
}