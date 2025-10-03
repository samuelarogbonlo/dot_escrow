# Testing Guide

Comprehensive testing documentation for the .escrow platform covering smart contracts and frontend applications.

## 📋 Quick Start

### Running All Tests

```bash
# Smart Contract Tests
cd contracts/escrow
cargo test

# Frontend Tests
cd frontend
npm test
```

## 🔧 Smart Contract Testing

### Test Coverage
- **34 total tests** covering all contract functionality
- **100% pass rate** with <0.01s execution time
- Tests located in: `contracts/escrow/src/lib.rs` and `contracts/escrow/unit_tests.rs`

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

#### Core Functionality (24 tests)
- **Escrow Operations**: Create, update, cancel escrows
- **Milestone Management**: Complete, release, dispute milestones
- **Status Updates**: Parse and validate status transitions
- **Fee Calculations**: Test fee logic with different rates
- **Authorization**: Verify access control and permissions

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

## 💻 Frontend Testing

### Test Environment
- **Framework**: Vitest + React Testing Library
- **Location**: `frontend/src/test/`
- **Configuration**: `frontend/vite.config.ts`

### Running Frontend Tests

```bash
cd frontend

# Run unit tests
npm test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm test SearchBar
```

### Test Structure

```
frontend/src/test/
├── components/          # Component unit tests
│   ├── SearchBar.test.tsx
│   ├── SearchFilters.test.tsx
│   └── WelcomeGuide.test.tsx
├── pages/              # Page-level tests
│   ├── Dashboard.test.tsx
│   ├── DisputeResolution.test.tsx
│   └── Search.test.tsx
├── setup.ts            # Test configuration
└── utils.tsx           # Test utilities
```

### Writing Frontend Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Dashboard } from '../pages/Dashboard';

describe('Dashboard', () => {
  it('should display active escrows', () => {
    render(<Dashboard />);

    expect(screen.getByText('Active Escrows')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create escrow/i }))
      .toBeInTheDocument();
  });

  it('should navigate to create escrow', () => {
    render(<Dashboard />);

    const createButton = screen.getByRole('button', { name: /create/i });
    fireEvent.click(createButton);

    expect(window.location.pathname).toBe('/create-escrow');
  });
});
```

## 🔄 Integration Testing

### Local Integration Testing

1. **Start Local Node**:
```bash
substrate-contracts-node --dev
```

2. **Deploy Contract**:
```bash
cd contracts/escrow
cargo contract build --release
cargo contract instantiate --suri //Alice
```

3. **Configure Frontend**:
```bash
# frontend/.env.local
VITE_CONTRACT_ADDRESS=<deployed_address>
VITE_RPC_URL=ws://127.0.0.1:9944
```

4. **Run Integration Tests**:
```bash
cd frontend
npm run test:integration
```


## 🐛 Debugging Tests

### Smart Contract Debugging
```bash
# Run with debug output
RUST_LOG=debug cargo test

# Use println! in tests
cargo test -- --nocapture

# Check specific test failure
cargo test test_name -- --exact
```

### Frontend Debugging
```bash
# Run single test with debugging
npm test -- --inspect

# Interactive UI mode
npm run test:ui

# Debug in VS Code
# Add breakpoint and use "Debug: JavaScript Debug Terminal"
```

## 📊 Coverage Reports

### Generate Coverage

**Smart Contracts**:
```bash
cargo install cargo-tarpaulin
cargo tarpaulin --out Html
# Opens coverage/index.html
```

**Frontend**:
```bash
npm run test:coverage
# Check coverage/ directory for detailed report
```

### Coverage Goals
- Smart Contracts: >90% coverage
- Frontend Components: >80% coverage
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

### Frontend Tests Failing
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm test

# Check Node version
node --version  # Should be 18+
```

## 📚 Additional Resources

- [ink! Testing Guide](https://use.ink/basics/testing)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

For questions or issues, please open a GitHub issue or contact the development team.