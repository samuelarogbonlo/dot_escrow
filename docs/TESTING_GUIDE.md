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

### Current Test Status

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ **Passing** | 151 | 100% |
| ❌ **Failing** | 0 | 0% |
| **Total** | 151 | 100% |

**Note**: All features have comprehensive test coverage with 100% passing tests across all implemented functionality.

### Running Frontend Tests

```bash
cd frontend

# Run all tests (151 passing)
npm test

# Run with verbose output
npm test -- --reporter=verbose

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm test SearchBar
npm test Dashboard
npm test ConnectWallet
```

### Test Structure

```
frontend/src/test/
├── components/          # Component unit tests
│   ├── Modal/          # Modal components
│   │   ├── CompleteMilestoneModal.test.tsx (22 tests) ✅
│   │   ├── ReleaseMilestoneModal.test.tsx (14 tests) ✅
│   │   ├── DisputeMilestoneModal.test.tsx (20 tests) ✅
│   │   └── CancelEscrowModal.test.tsx (23 tests) ✅
│   ├── SearchBar.test.tsx (6 tests) ✅
│   ├── SearchFilters.test.tsx (4 tests) ✅
│   └── WelcomeGuide.test.tsx (4 tests) ✅
├── pages/              # Page-level tests
│   ├── Dashboard.test.tsx (9 tests) ✅
│   ├── ConnectWallet.test.tsx (22 tests) ✅
│   ├── CreateEscrow.test.tsx (5 tests) ✅
│   ├── EscrowDetails.test.tsx (1 test) ✅
│   └── MilestoneTracking.test.tsx (2 tests) ✅
├── utils/              # Utility tests
├── setup.ts            # Test configuration
└── utils.tsx           # Test utilities
```

### Test Suites Coverage

1. **Dashboard** (9 tests) - Main dashboard view
2. **ConnectWallet** (22 tests) - Wallet connection flow
3. **CompleteMilestoneModal** (22 tests) - Milestone completion UI
4. **SearchBar** (6 tests) - Search component
5. **WelcomeGuide** (4 tests) - Onboarding guide
6. **SearchFilters** (4 tests) - Filter component
7. **DisputeMilestoneModal** (20 tests) - Dispute modal
8. **CancelEscrowModal** (23 tests) - Cancellation modal
9. **ReleaseMilestoneModal** (14 tests) - Release modal
10. **CreateEscrow** (5 tests) - Escrow creation flow
11. **EscrowDetails** (1 test) - Escrow details view
12. **MilestoneTracking** (2 tests) - Milestone tracking
13. **Other Components** (27 tests) - Additional UI components

### Writing Frontend Tests

#### Basic Example

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

### Common Test Patterns

#### 1. Chakra UI Multiple Elements

Chakra components like Stepper and Modal render text in multiple DOM elements.

```typescript
// ❌ WRONG - Will fail with "Found multiple elements"
expect(screen.getByText('Step 1')).toBeInTheDocument();

// ✅ CORRECT - Use getAllByText
expect(screen.getAllByText('Step 1').length).toBeGreaterThan(0);

// ✅ ALTERNATIVE - Check first element
expect(screen.getAllByText('Step 1')[0]).toBeInTheDocument();
```

#### 2. Controlled Input Testing

Use `fireEvent.change` with proper `name` attribute for controlled inputs.

```typescript
// ❌ WRONG - user.type() doesn't work with controlled inputs
await user.type(titleInput, 'New Title');

// ✅ CORRECT - Use fireEvent.change
fireEvent.change(titleInput, {
  target: { name: 'title', value: 'New Title' }
});
```

#### 3. Number Input Values

Number inputs return `number` type, not `string`.

```typescript
// ❌ WRONG
expect(amountInput).toHaveValue('5000');

// ✅ CORRECT
expect(amountInput).toHaveValue(5000);
```

#### 4. Async React Router Mocking

Mock React Router with proper async/await.

```typescript
// ❌ WRONG - Missing async
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// ✅ CORRECT - Use async with await
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useNavigate: () => mockNavigate,
}));
```

#### 5. Chakra UI Focus Mock

Mock HTMLElement.prototype.focus to avoid test errors.

```typescript
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'focus', {
    configurable: true,
    writable: true,
    value: vi.fn(),
  });
});
```

#### 6. File Size Formatting

Use flexible regex patterns for formatted values.

```typescript
// ❌ WRONG - Exact match may fail
expect(screen.getByText('2.00 MB')).toBeInTheDocument();

// ✅ CORRECT - Use regex for flexibility
expect(screen.getByText(/2\.?\d* MB/i)).toBeInTheDocument();
```

#### 7. Async State Updates

Always wrap async state changes in waitFor.

```typescript
// ❌ WRONG - No wait for state update
await user.click(button);
expect(screen.getByText('Updated')).toBeInTheDocument();

// ✅ CORRECT - Wait for state update
await user.click(button);
await waitFor(() => {
  expect(screen.getByText('Updated')).toBeInTheDocument();
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

### "Found multiple elements" Error

This happens with Chakra UI components that render text multiple times.

```typescript
// Fix: Use getAllByText instead of getByText
expect(screen.getAllByText('Text').length).toBeGreaterThan(0);
```

### "Cannot set property focus" Error

Mock the focus method for Chakra UI compatibility.

```typescript
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'focus', {
    configurable: true,
    writable: true,
    value: vi.fn(),
  });
});
```

### "web3FromAddress: web3Enable needs to be called" Error

This occurs when Polkadot extension mocking is not properly configured.

```typescript
// Solution: Set up comprehensive Polkadot API mocks
beforeAll(() => {
  // Mock Polkadot extension
  global.window.injectedWeb3 = {
    'polkadot-js': {
      enable: vi.fn(),
      version: '0.44.1'
    }
  };
});
```

### Tests Pass Locally but Fail in CI

1. Check Node/npm versions match CI
2. Ensure all dependencies are in package.json (not global)
3. Review CI logs for environment-specific issues
4. Verify frontend/vite.config.ts test configuration

```bash
# Match CI environment
nvm use 18
npm ci  # Use exact versions from package-lock.json
npm test
```

## 📚 Additional Resources

- [ink! Testing Guide](https://use.ink/basics/testing)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

For questions or issues, please open a GitHub issue or contact the development team.