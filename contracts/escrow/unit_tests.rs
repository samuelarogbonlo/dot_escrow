// Unit tests for escrow contract messages and helper methods

#[cfg(test)]
mod unit_tests {
    use super::*;
    use ink::env::test;

    // Helper function to create test milestones
    fn create_test_milestones() -> Vec<Milestone> {
        vec![
            Milestone {
                id: "m1".to_string(),
                description: "Milestone 1".to_string(),
                amount: "500".to_string(),
                status: MilestoneStatus::Pending,
                deadline: 1000000,
                completed_at: None,
                dispute_reason: None,
                dispute_filed_by: None,
                completion_note: None,
                evidence_file: None,
            },
            Milestone {
                id: "m2".to_string(),
                description: "Milestone 2".to_string(),
                amount: "500".to_string(),
                status: MilestoneStatus::Pending,
                deadline: 2000000,
                completed_at: None,
                dispute_reason: None,
                dispute_filed_by: None,
                completion_note: None,
                evidence_file: None,
            },
        ]
    }

    #[ink::test]
    fn test_create_escrow_success() {
        let accounts = test::default_accounts::<Environment>();
        let mut contract = EscrowContract::new(accounts.frank, accounts.eve);

        let result = contract.create_escrow(
            accounts.bob,
            "provider".to_string(),
            "pending".to_string(),
            "Test Escrow".to_string(),
            "Test Description".to_string(),
            "1000".to_string(),
            create_test_milestones(),
            None,
        );

        assert!(result.is_ok());
        let escrow_id = result.unwrap();
        assert!(!escrow_id.is_empty());

        // Verify escrow counter incremented
        assert_eq!(contract.escrow_counter, 1);
    }

    #[ink::test]
    fn test_create_escrow_paused() {
        let accounts = test::default_accounts::<Environment>();
        let mut contract = EscrowContract::new(accounts.frank, accounts.eve);

        // Pause the contract
        contract.paused = true;

        let result = contract.create_escrow(
            accounts.bob,
            "provider".to_string(),
            "pending".to_string(),
            "Test".to_string(),
            "Description".to_string(),
            "1000".to_string(),
            vec![],
            None,
        );

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), EscrowError::ContractPaused);
    }

    #[ink::test]
    fn test_complete_milestone_task() {
        let accounts = test::default_accounts::<Environment>();
        let mut contract = EscrowContract::new(accounts.frank, accounts.eve);

        // Create escrow first
        let escrow_id = contract.create_escrow(
            accounts.bob,
            "provider".to_string(),
            "active".to_string(),
            "Test".to_string(),
            "Description".to_string(),
            "1000".to_string(),
            create_test_milestones(),
            None,
        ).unwrap();

        // Complete milestone task
        let result = contract.complete_milestone_task(
            escrow_id.clone(),
            "m1".to_string(),
            Some("Task completed".to_string()),
            Some(vec![Evidence {
                name: "proof".to_string(),
                url: "ipfs://proof".to_string(),
            }]),
        );

        assert!(result.is_ok());
    }

    #[ink::test]
    fn test_release_milestone() {
        let accounts = test::default_accounts::<Environment>();
        let mut contract = EscrowContract::new(accounts.frank, accounts.eve);

        // Create escrow
        let escrow_id = contract.create_escrow(
            accounts.bob,
            "provider".to_string(),
            "active".to_string(),
            "Test".to_string(),
            "Description".to_string(),
            "1000".to_string(),
            create_test_milestones(),
            None,
        ).unwrap();

        // Release milestone
        let result = contract.release_milestone(escrow_id.clone(), "m1".to_string());
        assert!(result.is_ok());
    }

    #[ink::test]
    fn test_fund_escrow() {
        let accounts = test::default_accounts::<Environment>();
        let mut contract = EscrowContract::new(accounts.frank, accounts.eve);

        let escrow_id = contract.create_escrow(
            accounts.bob,
            "provider".to_string(),
            "pending".to_string(),
            "Test".to_string(),
            "Description".to_string(),
            "1000".to_string(),
            vec![],
            None,
        ).unwrap();

        let result = contract.fund_escrow(escrow_id.clone());
        assert!(result.is_ok());
    }

    #[ink::test]
    fn test_dispute_escrow() {
        let accounts = test::default_accounts::<Environment>();
        let mut contract = EscrowContract::new(accounts.frank, accounts.eve);

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

        let result = contract.dispute_escrow(escrow_id.clone(), "Dispute reason".to_string());
        assert!(result.is_ok());
    }

    #[ink::test]
    fn test_cancel_escrow() {
        let accounts = test::default_accounts::<Environment>();
        let mut contract = EscrowContract::new(accounts.frank, accounts.eve);

        let escrow_id = contract.create_escrow(
            accounts.bob,
            "provider".to_string(),
            "pending".to_string(),
            "Test".to_string(),
            "Description".to_string(),
            "1000".to_string(),
            vec![],
            None,
        ).unwrap();

        let result = contract.cancel_escrow(escrow_id.clone());
        assert!(result.is_ok());
    }

    #[ink::test]
    fn test_pause_unpause() {
        let accounts = test::default_accounts::<Environment>();
        let mut contract = EscrowContract::new(accounts.frank, accounts.eve);

        // Set caller as owner
        test::set_caller::<Environment>(accounts.alice);
        contract.owner = accounts.alice;

        assert!(!contract.paused);

        // Pause
        let result = contract.pause();
        assert!(result.is_ok());
        assert!(contract.paused);

        // Unpause
        let result = contract.unpause();
        assert!(result.is_ok());
        assert!(!contract.paused);
    }

    #[ink::test]
    fn test_pause_not_owner() {
        let accounts = test::default_accounts::<Environment>();
        let mut contract = EscrowContract::new(accounts.frank, accounts.eve);

        // Set different caller
        test::set_caller::<Environment>(accounts.bob);

        let result = contract.pause();
        assert!(result.is_err());
    }

    #[ink::test]
    fn test_fee_calculation() {
        let accounts = test::default_accounts::<Environment>();
        let contract = EscrowContract::new(accounts.frank, accounts.eve);

        // Test 1% fee
        let fee = contract.calculate_fee("10000".to_string());
        assert_eq!(fee, 100); // 1% of 10000

        let fee = contract.calculate_fee("5000".to_string());
        assert_eq!(fee, 50); // 1% of 5000
    }

    #[ink::test]
    fn test_escrow_counter() {
        let accounts = test::default_accounts::<Environment>();
        let mut contract = EscrowContract::new(accounts.frank, accounts.eve);

        assert_eq!(contract.escrow_counter, 0);

        // Create first escrow
        contract.create_escrow(
            accounts.bob,
            "provider".to_string(),
            "pending".to_string(),
            "Test1".to_string(),
            "Description".to_string(),
            "1000".to_string(),
            vec![],
            None,
        ).unwrap();
        assert_eq!(contract.escrow_counter, 1);

        // Create second escrow
        contract.create_escrow(
            accounts.charlie,
            "client".to_string(),
            "pending".to_string(),
            "Test2".to_string(),
            "Description".to_string(),
            "2000".to_string(),
            vec![],
            None,
        ).unwrap();
        assert_eq!(contract.escrow_counter, 2);
    }

    #[ink::test]
    fn test_get_escrow() {
        let accounts = test::default_accounts::<Environment>();
        let mut contract = EscrowContract::new(accounts.frank, accounts.eve);

        let escrow_id = contract.create_escrow(
            accounts.bob,
            "provider".to_string(),
            "pending".to_string(),
            "Test".to_string(),
            "Description".to_string(),
            "1000".to_string(),
            vec![],
            None,
        ).unwrap();

        // Get existing escrow
        let result = contract.get_escrow(escrow_id.clone());
        assert!(result.is_ok());
        let escrow = result.unwrap();
        assert_eq!(escrow.title, "Test");
        assert_eq!(escrow.total_amount, "1000");

        // Try non-existent escrow
        let result = contract.get_escrow("invalid_id".to_string());
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), EscrowError::EscrowNotFound);
    }

    #[ink::test]
    fn test_list_escrows() {
        let accounts = test::default_accounts::<Environment>();
        let mut contract = EscrowContract::new(accounts.frank, accounts.eve);

        // Set caller
        test::set_caller::<Environment>(accounts.alice);

        // Create escrows
        contract.create_escrow(
            accounts.bob,
            "provider".to_string(),
            "pending".to_string(),
            "Escrow1".to_string(),
            "Description1".to_string(),
            "1000".to_string(),
            vec![],
            None,
        ).unwrap();

        contract.create_escrow(
            accounts.charlie,
            "provider".to_string(),
            "pending".to_string(),
            "Escrow2".to_string(),
            "Description2".to_string(),
            "2000".to_string(),
            vec![],
            None,
        ).unwrap();

        // List escrows
        let escrows = contract.list_escrows();
        assert_eq!(escrows.len(), 2);
    }

    #[ink::test]
    fn test_total_volume_tracking() {
        let accounts = test::default_accounts::<Environment>();
        let mut contract = EscrowContract::new(accounts.frank, accounts.eve);

        assert_eq!(contract.total_volume, 0);

        // Note: In actual implementation, total_volume should be updated
        // when payments are released, not just when escrows are created
        // This is a placeholder test for when that functionality is added
    }

    #[ink::test]
    fn test_milestone_validation() {
        let accounts = test::default_accounts::<Environment>();
        let mut contract = EscrowContract::new(accounts.frank, accounts.eve);

        // Create escrow with mismatched milestone amounts
        let milestones = vec![
            Milestone {
                id: "m1".to_string(),
                description: "Milestone 1".to_string(),
                amount: "600".to_string(), // Total: 1100 vs escrow: 1000
                status: MilestoneStatus::Pending,
                deadline: 1000000,
                completed_at: None,
                dispute_reason: None,
                dispute_filed_by: None,
                completion_note: None,
                evidence_file: None,
            },
            Milestone {
                id: "m2".to_string(),
                description: "Milestone 2".to_string(),
                amount: "500".to_string(),
                status: MilestoneStatus::Pending,
                deadline: 2000000,
                completed_at: None,
                dispute_reason: None,
                dispute_filed_by: None,
                completion_note: None,
                evidence_file: None,
            },
        ];

        // This should succeed - validation happens at funding time
        let result = contract.create_escrow(
            accounts.bob,
            "provider".to_string(),
            "pending".to_string(),
            "Test".to_string(),
            "Description".to_string(),
            "1000".to_string(),
            milestones,
            None,
        );

        assert!(result.is_ok());
    }
}