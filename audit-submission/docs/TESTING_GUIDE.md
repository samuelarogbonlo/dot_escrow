# Smart Contract Testing Guide

**Project:** .escrow Smart Contract
**Framework:** ink! 6.0.0-beta
**Target:** PolkaVM (RISC-V)
**Last Updated:** December 17, 2025

## 📋 Quick Start

```bash
# Smart Contract Tests
cd contracts/escrow
cargo test
```

## 🔧 Smart Contract Testing

### Test Coverage
- **43 total tests** covering all contract functionality
- **100% pass rate** with <0.01s execution time
- **83.13% line coverage** (138/166 lines)
- Tests located in: `contracts/escrow/src/lib.rs`

### Running Contract Tests

```bash
cd contracts/escrow

# Run all tests
cargo test

# Run with verbose output
cargo test -- --nocapture

# Run specific test
cargo test test_create_escrow

# Run with optimizations
cargo test --release
```

### Test Categories

#### Core Functionality (33 tests)
- **Escrow Operations**: Create, update, cancel escrows
- **Milestone Management**: Complete, release, dispute milestones
- **Status Updates**: Parse and validate status transitions
- **Fee Calculations**: Test fee logic with different rates
- **Authorization**: Verify access control and permissions
- **Edge Cases**: String length limits, evidence file limits, overflow protection
- **Storage DoS Protection**: Max milestones, max string length validation

#### Multi-Signature Governance (10 tests)
- **Proposal Lifecycle**: Create, approve, execute proposals
- **Admin Management**: Add/remove signers
- **Threshold Validation**: K-of-N approval requirements
- **Security**: Anti-replay and authorization checks

### Example Test

```rust
#[ink::test]
fn test_create_escrow() {
    let mut contract = EscrowContract::new(/* params */);

    // Create escrow
    let result = contract.create_escrow(
        counterparty,
        "provider",
        "Active",
        "Test Project",
        "Description",
        "1000",
        vec![],
        None
    );

    assert!(result.is_ok());
    assert_eq!(result.unwrap(), "escrow_1");
}
```

## 🔄 Integration Testing

### Testnet Integration Testing (Pop Network - Paseo)

1. **Build Contract**:
```bash
cd contracts/escrow
cargo contract build --release
```

2. **Deploy to Paseo Testnet**:
- Network: Pop Network (Paseo)
- RPC: `wss://rpc1.paseo.popnetwork.xyz`
- Deployed Escrow: `0x57c0082e71f89e1feb6b56ab36f0ae271c118019`
- Deployed PSP22: `0xd10852e9a6366cfab48f52e98f896344cbbc132c`

3. **Test via Frontend**:
```bash
cd frontend
npm run dev
# Test escrow creation, milestones, payments on testnet
```

**Note**: ink! 6.0.0-beta targets PolkaVM (RISC-V), not WASM. Local node testing requires pallet-revive support.


## 🐛 Debugging Tests

### Smart Contract Debugging
```bash
# From contracts/escrow directory
cd contracts/escrow

# Run with debug output
RUST_LOG=debug cargo test

# Use println! in tests
cargo test -- --nocapture

# Check specific test failure
cargo test test_name -- --exact

# From project root (using package name)
cargo test -p escrow-contract
```

## 📊 Coverage Reports

### Generate Coverage

**Smart Contracts**:
```bash
cargo install cargo-tarpaulin
cargo tarpaulin -p escrow-contract --out Html
# Opens tarpaulin-report.html
```

### Coverage Goals
- Smart Contracts: ≥80% coverage (83.13% achieved)
- Critical User Paths: 100% coverage

## 📝 Best Practices

### Writing Good Tests
1. **Descriptive Names**: Use clear, specific test names
2. **Single Responsibility**: Test one thing per test
3. **Arrange-Act-Assert**: Structure tests clearly
4. **Mock External Dependencies**: Isolate unit tests
5. **Test Edge Cases**: Include boundary conditions

### Test Maintenance
- Review and update tests with code changes
- Remove redundant or obsolete tests
- Keep tests fast and deterministic
- Document complex test scenarios

## 🆘 Common Issues

### Smart Contract Tests Failing
```bash
# Clean build artifacts
cargo clean
cargo build --release
cargo test

# Check Rust version
rustup update
cargo --version  # Should be 1.70+
```

## 📚 Additional Resources

- [ink! Testing Guide](https://use.ink/basics/testing)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

**Note**: Frontend testing documentation is available in `/docs/FE_TESTING_GUIDE.md` (out of scope for this audit).
