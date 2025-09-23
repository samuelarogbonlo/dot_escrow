// This is a snippet showing the corrected unit tests to be added to lib.rs

        // ========================
        // UNIT TESTS FOR CONTRACT MESSAGES
        // ========================

        #[ink::test]
        fn test_create_escrow_unit() {
            let accounts = ink::env::test::default_accounts::<Environment>();
            let mut contract = EscrowContract::new(accounts.frank, accounts.eve);

            // Create valid milestones
            let milestones = vec![
                Milestone {
                    id: "m1".to_string(),
                    description: "First milestone".to_string(),
                    amount: "1000".to_string(),
                    status: MilestoneStatus::Pending,
                    deadline: 1000000,
                    completed_at: None,
                    dispute_reason: None,
                    dispute_filed_by: None,
                    completion_note: None,
                    evidence_file: None,
                },
            ];

            // Test successful creation
            let result = contract.create_escrow(
                accounts.bob,                    // counterparty_address
                "provider".to_string(),          // counterparty_type
                "pending".to_string(),           // status
                "Test Escrow".to_string(),       // title
                "Description".to_string(),       // description
                "1000".to_string(),             // total_amount
                milestones,                      // milestones
                None,                           // transaction_hash
            );

            assert!(result.is_ok(), "Escrow creation should succeed");
            assert_eq!(contract.escrow_counter, 1, "Counter should increment");
        }

        #[ink::test]
        fn test_contract_pause_unit() {
            let accounts = ink::env::test::default_accounts::<Environment>();
            let mut contract = EscrowContract::new(accounts.frank, accounts.eve);

            // Pause contract
            contract.paused = true;

            // Try to create escrow while paused
            let result = contract.create_escrow(
                accounts.bob,
                "provider".to_string(),
                "pending".to_string(),
                "Test".to_string(),
                "Desc".to_string(),
                "1000".to_string(),
                vec![],
                None,
            );

            assert!(result.is_err(), "Should fail when paused");
            assert_eq!(result.unwrap_err(), EscrowError::ContractPaused);
        }

        #[ink::test]
        fn test_fee_calculation_unit() {
            let accounts = ink::env::test::default_accounts::<Environment>();
            let contract = EscrowContract::new(accounts.frank, accounts.eve);

            // Test 1% fee calculation
            assert_eq!(contract.calculate_fee("10000".to_string()), 100);
            assert_eq!(contract.calculate_fee("5000".to_string()), 50);
            assert_eq!(contract.calculate_fee("100".to_string()), 1);
        }

        #[ink::test]
        fn test_escrow_counter_unit() {
            let accounts = ink::env::test::default_accounts::<Environment>();
            let mut contract = EscrowContract::new(accounts.frank, accounts.eve);

            assert_eq!(contract.escrow_counter, 0);

            // Create multiple escrows
            for i in 1..=3 {
                let result = contract.create_escrow(
                    accounts.bob,
                    "provider".to_string(),
                    "pending".to_string(),
                    format!("Escrow {}", i),
                    "Description".to_string(),
                    "1000".to_string(),
                    vec![],
                    None,
                );
                assert!(result.is_ok());
                assert_eq!(contract.escrow_counter, i);
            }
        }

        #[ink::test]
        fn test_milestone_complete_unit() {
            let accounts = ink::env::test::default_accounts::<Environment>();
            let mut contract = EscrowContract::new(accounts.frank, accounts.eve);

            let milestones = vec![
                Milestone {
                    id: "m1".to_string(),
                    description: "Milestone 1".to_string(),
                    amount: "1000".to_string(),
                    status: MilestoneStatus::Pending,
                    deadline: 1000000,
                    completed_at: None,
                    dispute_reason: None,
                    dispute_filed_by: None,
                    completion_note: None,
                    evidence_file: None,
                },
            ];

            // Create escrow
            let escrow_id = contract.create_escrow(
                accounts.bob,
                "provider".to_string(),
                "active".to_string(),
                "Test".to_string(),
                "Description".to_string(),
                "1000".to_string(),
                milestones,
                None,
            ).unwrap();

            // Complete milestone task
            let evidence = vec![Evidence {
                name: "proof.pdf".to_string(),
                url: "ipfs://proof123".to_string(),
            }];

            let result = contract.complete_milestone_task(
                escrow_id,
                "m1".to_string(),
                Some("Task completed successfully".to_string()),
                Some(evidence),
            );

            assert!(result.is_ok(), "Milestone completion should succeed");
        }

        #[ink::test]
        fn test_dispute_escrow_unit() {
            let accounts = ink::env::test::default_accounts::<Environment>();
            let mut contract = EscrowContract::new(accounts.frank, accounts.eve);

            // Create escrow
            let escrow_id = contract.create_escrow(
                accounts.bob,
                "provider".to_string(),
                "active".to_string(),
                "Test".to_string(),
                "Description".to_string(),
                "1000".to_string(),
                vec![],
                None,
            ).unwrap();

            // File dispute
            let result = contract.dispute_escrow(
                escrow_id,
                "Work not delivered as specified".to_string(),
            );

            assert!(result.is_ok(), "Dispute should be filed successfully");
        }

        #[ink::test]
        fn test_get_escrow_unit() {
            let accounts = ink::env::test::default_accounts::<Environment>();
            let mut contract = EscrowContract::new(accounts.frank, accounts.eve);

            // Create escrow
            let escrow_id = contract.create_escrow(
                accounts.bob,
                "provider".to_string(),
                "pending".to_string(),
                "Test Title".to_string(),
                "Test Description".to_string(),
                "5000".to_string(),
                vec![],
                None,
            ).unwrap();

            // Get escrow
            let result = contract.get_escrow(escrow_id.clone());
            assert!(result.is_ok());

            let escrow = result.unwrap();
            assert_eq!(escrow.title, "Test Title");
            assert_eq!(escrow.total_amount, "5000");

            // Test non-existent escrow
            let result = contract.get_escrow("nonexistent".to_string());
            assert!(result.is_err());
            assert_eq!(result.unwrap_err(), EscrowError::EscrowNotFound);
        }

        #[ink::test]
        fn test_owner_functions_unit() {
            let accounts = ink::env::test::default_accounts::<Environment>();
            let mut contract = EscrowContract::new(accounts.frank, accounts.eve);

            // Set caller as owner
            ink::env::test::set_caller::<Environment>(accounts.alice);
            contract.owner = accounts.alice;

            // Test pause
            assert!(!contract.paused);
            assert!(contract.pause().is_ok());
            assert!(contract.paused);

            // Test unpause
            assert!(contract.unpause().is_ok());
            assert!(!contract.paused);

            // Test non-owner cannot pause
            ink::env::test::set_caller::<Environment>(accounts.bob);
            assert!(contract.pause().is_err());
        }