# Testing Guide

**Comprehensive Testing Strategy for .escrow Platform - Milestone 2**

This guide covers all testing methodologies for the .escrow platform, including smart contract tests, frontend tests, integration tests, and manual QA scenarios that validate the complete platform functionality.

---

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Smart Contract Testing](#smart-contract-testing)
3. [Frontend Testing](#frontend-testing)
4. [Integration Testing](#integration-testing)
5. [Manual QA Scenarios](#manual-qa-scenarios)
6. [Performance Testing](#performance-testing)
7. [Security Testing](#security-testing)
8. [Test Automation](#test-automation)
9. [CI/CD Testing Pipeline](#cicd-testing-pipeline)
10. [Test Data Management](#test-data-management)

---

## Testing Philosophy

### Testing Pyramid Strategy

```
                    E2E Tests (Manual QA)
                   /                     \
              Integration Tests        Security Tests
             /                                       \
        Unit Tests (Contract)              Unit Tests (Frontend)
       /                                                       \
   Static Analysis                                        Type Checking
```

### Quality Assurance Goals

- **Reliability**: 99.9% uptime and transaction success rate
- **Security**: Zero vulnerability tolerance for financial operations
- **Performance**: <3 second page loads, <6 second transaction finality
- **Usability**: Comprehensive user journey validation
- **Maintainability**: Test coverage >90% for critical paths

### Test Environment Strategy

| Environment | Purpose | Smart Contract | Frontend | Data |
|-------------|---------|----------------|----------|------|
| **Local** | Development | Substrate Contracts Node | Vite Dev Server | Mock data |
| **Testnet** | Staging | Westend Deployment | Testnet Build | Real blockchain |
| **Mainnet** | Production | Polkadot Deployment | Production Build | Live data |

---

## Smart Contract Testing

### Unit Tests Overview

**Current Test Coverage:**
- ✅ 24 comprehensive tests covering contract functionality (integration & unit)
- ✅ 10 multi-signature governance tests covering proposal lifecycle
- ✅ Coverage of contract initialization and data structures
- ✅ Validation logic and fee calculations
- ✅ Token parsing and pause controls
- ✅ Authorization testing and error handling
- ✅ Multi-signature proposal submission, approval, and execution
- ✅ Administrative control validation and threshold management
- ✅ 34 total tests, all passing (cargo test shows: 34 passed; 0 failed)

### Running Smart Contract Tests

**Basic Test Execution:**
```bash
# Navigate to contract directory
cd contracts/escrow

# Run all tests
cargo test

# Run with verbose output
cargo test -- --nocapture

# Run specific test
cargo test test_basic_escrow_data_structure

# Run tests with release optimization
cargo test --release
```

**Test Categories:**

#### Integration Tests (contracts/escrow/src/lib.rs:1390-1656)
- `test_basic_escrow_data_structure` - Verifies contract initialization and data structures
- `test_status_parsing_functionality` - Tests status parsing for frontend integration
- `test_error_types_and_validation` - Validates error handling and validation logic
- `test_fee_calculation_logic` - Tests fee calculation with different rates
- `test_token_amount_parsing` - Tests parsing of various amount formats from frontend
- `test_escrow_counter_increment` - Verifies unique ID generation
- `test_contract_pause_functionality` - Tests pause/unpause functionality
- `test_integration_summary` - Summary test for all integration capabilities

#### Unit Tests (contracts/escrow/src/lib.rs:1662-2111)
**Create Escrow Tests:**
- `test_create_escrow_unit` - Tests escrow creation with proper parameters
- `test_create_escrow_paused_contract` - Tests failure when contract is paused
- `test_create_escrow_invalid_status` - Tests rejection of invalid status strings

**Complete Milestone Tests:**
- `test_complete_milestone_task_unit` - Tests successful milestone completion
- `test_complete_milestone_unauthorized` - Tests authorization validation
- `test_complete_milestone_wrong_status` - Tests milestone status validation

**Release & Dispute Tests:**
- `test_release_milestone_authorization` - Tests release authorization logic
- `test_dispute_milestone_unit` - Tests dispute filing functionality

**Contract Management Tests:**
- `test_pause_unpause_unit` - Tests owner pause/unpause functionality
- `test_pause_unauthorized` - Tests non-owner pause prevention

**Error Handling Tests:**
- `test_get_escrow_not_found` - Tests escrow lookup errors
- `test_get_escrow_milestone_not_found` - Tests milestone lookup errors

**Validation Tests:**
- `test_amount_parsing_unit` - Tests various amount format parsing
- `test_fee_calculation_unit` - Tests fee calculation logic with basis points
- `test_fee_calculation_edge_cases` - Tests fee validation and edge cases

**Multi-Signature Governance Tests:**
- `test_multisig_initialization` - Tests initial admin setup and threshold configuration
- `test_proposal_submission` - Tests proposal creation with proper authorization
- `test_unauthorized_proposal_submission` - Tests rejection of non-admin proposals
- `test_proposal_approval_and_execution` - Tests proposal lifecycle with auto-execution
- `test_multisig_threshold_requiring_multiple_approvals` - Tests k-of-n approval workflows
- `test_duplicate_approval_prevention` - Tests anti-replay protection
- `test_signer_management` - Tests adding/removing admin signers via proposals
- `test_threshold_validation` - Tests threshold validation and boundary conditions
- `test_legacy_admin_functions_blocked` - Tests that old owner functions are disabled
- `test_proposal_actions_execution` - Tests execution of different proposal types
- `test_proposal_getters` - Tests UI integration getter functions

Each test exercises a different portion of the escrow lifecycle and governance operations. New tests should follow the same pattern and live in the `integration_tests` module.

### Advanced Contract Testing

**Gas Optimization Testing:**
```bash
# Test gas consumption
cargo contract build --release
cargo contract call --contract $CONTRACT_ADDRESS \
  --message create_escrow \
  --args $ARGS \
  --dry-run \
  --verbose
```

**Stress & Upgrade Testing (Planned Enhancements):**
- High-volume escrow creation benchmarks
- Upgrade/migration simulations for future contract versions
- Automated fuzzing for edge-case discovery

### Custom Test Assertions

**Financial Accuracy:**
```rust
fn assert_fee_calculation(amount: Balance, fee_bps: u16) {
    let expected_fee = amount * fee_bps as u128 / 10000;
    let expected_release = amount - expected_fee;

    // Test calculation accuracy
    assert_eq!(calculated_fee, expected_fee);
    assert_eq!(calculated_release, expected_release);
    assert_eq!(calculated_fee + calculated_release, amount);
}
```

**Event Verification:**
```rust
fn assert_escrow_created_event(
    result: &ink_env::test::CallResult,
    expected_escrow_id: &str
) {
    // Verify event emission
    // Check event data accuracy
    // Validate event ordering
}
```

---

## Frontend Testing

### Test Setup and Configuration

**Testing Stack:**
- **Test Runner**: Vitest
- **Testing Library**: React Testing Library
- **Mocking**: MSW (Mock Service Worker)
- **E2E**: Playwright (for critical paths)

**Installation and Setup:**
```bash
cd frontend
npm install
npm run test           # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
npm run test:ui        # UI test runner
```

### Unit Tests

**Component Testing:**
```typescript
// File: frontend/src/test/components/CreateEscrow.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateEscrow } from '../components/CreateEscrow';
import { mockUseEscrowContract } from '../mocks/useEscrowContract';

describe('CreateEscrow Component', () => {
  beforeEach(() => {
    mockUseEscrowContract.mockClear();
  });

  it('should render escrow creation form', () => {
    render(<CreateEscrow />);

    expect(screen.getByLabelText('Project Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Counterparty Address')).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    render(<CreateEscrow />);

    const submitButton = screen.getByRole('button', { name: /create escrow/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
      expect(screen.getByText('Description is required')).toBeInTheDocument();
    });
  });

  it('should create escrow with valid data', async () => {
    const mockCreateEscrow = jest.fn().mockResolvedValue({
      success: true,
      escrowId: 'escrow_1'
    });

    mockUseEscrowContract.mockReturnValue({
      createEscrow: mockCreateEscrow,
      loading: false,
      error: null
    });

    render(<CreateEscrow />);

    // Fill form
    fireEvent.change(screen.getByLabelText('Project Title'), {
      target: { value: 'Test Project' }
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Test Description' }
    });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /create escrow/i }));

    await waitFor(() => {
      expect(mockCreateEscrow).toHaveBeenCalledWith({
        title: 'Test Project',
        description: 'Test Description',
        // ... other expected args
      });
    });
  });
});
```

**Hook Testing:**
```typescript
// File: frontend/src/test/hooks/useEscrowContract.test.ts
import { renderHook, act } from '@testing-library/react';
import { useEscrowContract } from '../hooks/useEscrowContract';
import { mockPolkadotApi } from '../mocks/polkadotApi';

describe('useEscrowContract Hook', () => {
  beforeEach(() => {
    mockPolkadotApi.reset();
  });

  it('should create escrow successfully', async () => {
    const { result } = renderHook(() => useEscrowContract());

    await act(async () => {
      const response = await result.current.createEscrow({
        counterpartyAddress: 'test-address',
        title: 'Test Escrow',
        description: 'Test Description',
        totalAmount: '1000',
        milestones: []
      });

      expect(response.success).toBe(true);
      expect(response.escrowId).toBe('escrow_1');
    });
  });

  it('should handle contract errors', async () => {
    mockPolkadotApi.mockContractError('Insufficient balance');

    const { result } = renderHook(() => useEscrowContract());

    await act(async () => {
      const response = await result.current.createEscrow({
        // ... escrow data
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('Insufficient balance');
    });
  });
});
```

### Integration Tests

**Contract Integration Testing:**
```typescript
// File: frontend/src/test/integration/contractIntegration.test.ts
import { setupTestEnvironment } from '../utils/testEnvironment';
import { createMockEscrow } from '../utils/mockData';

describe('Contract Integration', () => {
  let testEnv: TestEnvironment;

  beforeEach(async () => {
    testEnv = await setupTestEnvironment();
  });

  afterEach(async () => {
    await testEnv.cleanup();
  });

  it('should complete full escrow lifecycle', async () => {
    // 1. Create escrow
    const escrowData = createMockEscrow();
    const createResult = await testEnv.createEscrow(escrowData);
    expect(createResult.success).toBe(true);

    // 2. Fund escrow
    const fundResult = await testEnv.fundEscrow(createResult.escrowId, '1000');
    expect(fundResult.success).toBe(true);

    // 3. Complete milestone
    const completeResult = await testEnv.completeMilestone(
      createResult.escrowId,
      'milestone_1',
      'Work completed'
    );
    expect(completeResult.success).toBe(true);

    // 4. Release payment
    const releaseResult = await testEnv.releaseMilestone(
      createResult.escrowId,
      'milestone_1'
    );
    expect(releaseResult.success).toBe(true);

    // 5. Verify final state
    const escrow = await testEnv.getEscrow(createResult.escrowId);
    expect(escrow.milestones[0].status).toBe('Completed');
  });
});
```

### Mocking Strategies

**Polkadot API Mocking:**
```typescript
// File: frontend/src/test/mocks/polkadotApi.ts
export const mockPolkadotApi = {
  isReady: Promise.resolve(),

  connect: jest.fn().mockResolvedValue(true),

  query: {
    system: {
      account: jest.fn().mockResolvedValue({
        data: { free: 1000000000 }
      })
    }
  },

  tx: {
    balances: {
      transfer: jest.fn().mockReturnValue({
        signAndSend: jest.fn().mockResolvedValue({
          status: { isFinalized: true },
          txHash: { toHex: () => '0x123...' }
        })
      })
    }
  }
};
```

**Contract Response Mocking:**
```typescript
// File: frontend/src/test/mocks/contractResponses.ts
export const mockContractResponses = {
  createEscrow: {
    success: true,
    escrowId: 'escrow_1',
    transactionHash: '0x123...'
  },

  listEscrows: {
    success: true,
    data: [
      {
        id: 'escrow_1',
        title: 'Test Project',
        status: 'Active',
        milestones: []
      }
    ]
  },

  error: {
    success: false,
    error: 'Insufficient balance'
  }
};
```

---

## Integration Testing

### End-to-End Test Scenarios

**Critical User Journeys:**
```typescript
// File: frontend/src/test/e2e/userJourneys.test.ts
import { test, expect } from '@playwright/test';

test.describe('Complete Escrow Workflow', () => {
  test('Client creates escrow, freelancer completes work, payment released', async ({ page }) => {
    // 1. Connect wallet
    await page.goto('/');
    await page.click('[data-testid="connect-wallet"]');
    await page.click('[data-testid="polkadot-wallet"]');

    // 2. Create escrow
    await page.click('[data-testid="create-escrow"]');
    await page.fill('[data-testid="project-title"]', 'E2E Test Project');
    await page.fill('[data-testid="description"]', 'Testing the complete workflow');
    await page.fill('[data-testid="counterparty-address"]', 'test-address');
    await page.fill('[data-testid="total-amount"]', '1000');

    // Add milestone
    await page.click('[data-testid="add-milestone"]');
    await page.fill('[data-testid="milestone-description"]', 'Complete the work');
    await page.fill('[data-testid="milestone-amount"]', '1000');

    await page.click('[data-testid="create-escrow-submit"]');

    // 3. Verify escrow creation
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    const escrowId = await page.locator('[data-testid="escrow-id"]').textContent();

    // 4. Fund escrow
    await page.click(`[data-testid="fund-escrow-${escrowId}"]`);
    await page.fill('[data-testid="fund-amount"]', '1000');
    await page.click('[data-testid="confirm-funding"]');

    // 5. Switch to freelancer perspective
    await page.click('[data-testid="switch-account"]');
    await page.selectOption('[data-testid="account-selector"]', 'freelancer-account');

    // 6. Complete milestone task
    await page.click(`[data-testid="complete-milestone-${escrowId}-milestone_1"]`);
    await page.fill('[data-testid="completion-note"]', 'Work completed as requested');
    await page.click('[data-testid="submit-completion"]');

    // 7. Switch back to client
    await page.click('[data-testid="switch-account"]');
    await page.selectOption('[data-testid="account-selector"]', 'client-account');

    // 8. Release payment
    await page.click(`[data-testid="release-payment-${escrowId}-milestone_1"]`);
    await page.click('[data-testid="confirm-release"]');

    // 9. Verify completion
    await expect(page.locator(`[data-testid="milestone-status-${escrowId}-milestone_1"]`))
      .toContainText('Completed');
  });
});
```

### API Integration Tests

**Backend Integration:**
```typescript
// File: frontend/src/test/integration/api.test.ts
describe('API Integration', () => {
  const baseURL = process.env.REACT_APP_BACKEND_URL;

  it('should sync escrow data with backend', async () => {
    // Create escrow on blockchain
    const escrowData = await createTestEscrow();

    // Verify backend receives data
    const response = await fetch(`${baseURL}/escrows/${escrowData.id}`);
    const backendEscrow = await response.json();

    expect(backendEscrow.id).toBe(escrowData.id);
    expect(backendEscrow.title).toBe(escrowData.title);
  });

  it('should handle backend unavailability gracefully', async () => {
    // Mock network failure
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

    // Frontend should still work with blockchain data only
    const escrows = await listEscrows();
    expect(escrows).toBeDefined();
    expect(Array.isArray(escrows)).toBe(true);
  });
});
```

---

## Manual QA Scenarios

### Pre-Release Testing Checklist

#### User Journey Testing

**Scenario 1: Happy Path - Complete Project**
```
Prerequisites:
- Two test accounts set up (client & freelancer)
- Sufficient test tokens in both accounts
- Clean browser state

Steps:
1. [ ] Client creates escrow with 2 milestones
2. [ ] Verify escrow appears in both parties' dashboards
3. [ ] Client funds escrow with USDT
4. [ ] Verify funding status updates correctly
5. [ ] Freelancer completes milestone 1 with evidence
6. [ ] Client reviews and releases payment for milestone 1
7. [ ] Verify USDT transfer to freelancer
8. [ ] Freelancer completes milestone 2
9. [ ] Client releases final payment
10. [ ] Verify escrow status changes to "Completed"

Expected Results:
- All transactions confirm within 10 seconds
- UI updates reflect blockchain state accurately
- Payment amounts are correct (minus platform fees)
- No error messages during normal flow
```

**Scenario 2: Dispute Resolution**
```
Prerequisites:
- Escrow created and funded
- Milestone work submitted by freelancer

Steps:
1. [ ] Client disputes milestone due to quality issues
2. [ ] Verify dispute status appears for both parties
3. [ ] Both parties submit additional evidence
4. [ ] Review dispute resolution interface
5. [ ] Test different resolution outcomes

Expected Results:
- Dispute interface is clear and functional
- Evidence upload works correctly
- Status updates are accurate
- Resolution is fair and transparent
```

**Scenario 3: Error Handling**
```
Test Cases:
1. [ ] Insufficient balance for transaction
2. [ ] Invalid wallet address entry
3. [ ] Network connection loss during transaction
4. [ ] Contract interaction failure
5. [ ] Wallet rejection of transaction

Expected Results:
- Clear error messages for each scenario
- No data loss or corruption
- Graceful fallback behavior
- Retry mechanisms work properly
```

#### Browser Compatibility Testing

**Desktop Testing:**
- [ ] Chrome 90+ (Primary)
- [ ] Firefox 88+
- [ ] Safari 14+
- [ ] Edge 90+

**Mobile Testing:**
- [ ] iOS Safari
- [ ] Android Chrome
- [ ] Mobile wallet integration

**Responsive Design:**
- [ ] 1920x1080 (Desktop)
- [ ] 1366x768 (Laptop)
- [ ] 768x1024 (Tablet)
- [ ] 375x667 (Mobile)

#### Performance Testing

**Load Time Benchmarks:**
- [ ] Initial page load < 3 seconds
- [ ] Component interaction < 500ms
- [ ] Transaction confirmation < 10 seconds
- [ ] Large escrow list rendering < 2 seconds

**Stress Testing:**
- [ ] Create 50+ escrows in rapid succession
- [ ] Handle large milestone lists (20+ milestones)
- [ ] Concurrent user operations
- [ ] Network timeout scenarios

#### Security Testing

**Input Validation:**
- [ ] SQL injection attempts (should be prevented)
- [ ] XSS attack vectors (should be sanitized)
- [ ] Invalid address formats (should error gracefully)
- [ ] Excessive amount values (should validate limits)

**Wallet Security:**
- [ ] Private key never exposed in frontend
- [ ] Secure transaction signing
- [ ] Proper session management
- [ ] HTTPS enforcement

### Bug Reporting Template

**Bug Report Format:**
```
Title: [Component] Brief description of issue

Priority: High/Medium/Low
Severity: Critical/Major/Minor

Environment:
- Browser: Chrome 96.0.4664.110
- OS: macOS 12.1
- Network: Westend Testnet
- Wallet: Polkadot.js Extension 0.42.1

Steps to Reproduce:
1. Navigate to Create Escrow page
2. Fill in project details
3. Click "Create Escrow"
4. Observe error message

Expected Result:
Escrow should be created successfully

Actual Result:
Error message: "Transaction failed"

Additional Information:
- Transaction hash: 0x123...
- Console errors: [attach screenshot]
- Network activity: [attach HAR file]

Workaround:
None found / Refresh page and retry
```

---

## Performance Testing

### Metrics and Benchmarks

**Frontend Performance Targets:**
```
Metric                  Target    Current   Status
Page Load Time         < 3s      2.1s      ✅
First Contentful Paint < 1.5s    1.2s      ✅
Time to Interactive    < 4s      3.2s      ✅
Bundle Size            < 1MB     850KB     ✅
API Response Time      < 500ms   320ms     ✅
```

**Smart Contract Performance:**
```
Operation              Gas Used   Time     Target
Create Escrow          ~500K     ~6s      < 1M gas
Release Milestone      ~300K     ~6s      < 500K gas
Dispute Milestone      ~200K     ~6s      < 300K gas
List Escrows (10)      ~100K     ~2s      < 200K gas
```

### Performance Testing Tools

**Frontend Performance:**
```bash
# Lighthouse CI
npm install -g @lhci/cli
lhci autorun

# Bundle analysis
npm run build
npx vite-bundle-analyzer

# Load testing
npm install -g artillery
artillery run load-test-config.yml
```

**Smart Contract Performance:**
```bash
# Gas benchmarking
cargo contract build --release
cargo contract call --contract $CONTRACT_ADDRESS \
  --message create_escrow \
  --dry-run \
  --verbose
```

### Load Testing Configuration

**Artillery Load Test:**
```yaml
# File: load-test-config.yml
config:
  target: 'https://testnet.escrow-platform.com'
  phases:
    - duration: 60
      arrivalRate: 5
    - duration: 120
      arrivalRate: 10
    - duration: 60
      arrivalRate: 20

scenarios:
  - name: "Browse escrows"
    weight: 70
    flow:
      - get:
          url: "/"
      - get:
          url: "/dashboard"
      - get:
          url: "/escrows"

  - name: "Create escrow"
    weight: 20
    flow:
      - post:
          url: "/api/escrows"
          json:
            title: "Load Test Project"
            description: "Performance testing"

  - name: "View escrow details"
    weight: 10
    flow:
      - get:
          url: "/escrows/{{ escrowId }}"
```

---

## Security Testing

### Automated Security Scanning

**Frontend Security:**
```bash
# Dependency vulnerability scan
npm audit
npm audit fix

# OWASP ZAP security scan
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://testnet.escrow-platform.com

# Semgrep static analysis
npx @semgrep/semgrep --config=auto frontend/src/
```

**Smart Contract Security:**
```bash
# Cargo audit for known vulnerabilities
cargo install cargo-audit
cargo audit

# Custom security rules
cargo clippy -- -W clippy::integer_overflow
cargo clippy -- -W clippy::panic
```

### Manual Security Testing

**Authentication & Authorization:**
- [ ] Verify wallet-based authentication
- [ ] Test unauthorized access attempts
- [ ] Validate role-based permissions
- [ ] Check session management

**Data Protection:**
- [ ] Verify sensitive data encryption
- [ ] Test data transmission security
- [ ] Validate input sanitization
- [ ] Check for data leakage

**Smart Contract Security:**
- [ ] Test reentrancy attack prevention
- [ ] Verify integer overflow protection
- [ ] Test unauthorized function calls
- [ ] Validate emergency pause functionality

---

## Test Automation

### Continuous Integration Setup

**GitHub Actions Workflow:**
```yaml
# File: .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  contract-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
          components: rustfmt, clippy

      - name: Install ink! CLI
        run: cargo install --force --locked cargo-contract

      - name: Run contract tests
        run: |
          cd contracts/escrow
          cargo test --verbose

      - name: Check contract formatting
        run: |
          cd contracts/escrow
          cargo fmt --check

      - name: Run clippy
        run: |
          cd contracts/escrow
          cargo clippy -- -D warnings

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: |
          cd frontend
          npm ci

      - name: Run unit tests
        run: |
          cd frontend
          npm run test:coverage

      - name: Run linting
        run: |
          cd frontend
          npm run lint

      - name: Type checking
        run: |
          cd frontend
          npm run type-check

      - name: Build application
        run: |
          cd frontend
          npm run build

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install Playwright
        run: |
          cd frontend
          npm ci
          npx playwright install

      - name: Run E2E tests
        run: |
          cd frontend
          npm run test:e2e

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: frontend/playwright-report/
```

### Test Data Management

**Test Data Factory:**
```typescript
// File: frontend/src/test/utils/testDataFactory.ts
export class TestDataFactory {
  static createEscrow(overrides = {}) {
    return {
      id: 'escrow_test_1',
      title: 'Test Project',
      description: 'Test project description',
      counterpartyAddress: 'test-address',
      totalAmount: '1000.00',
      status: 'Active',
      milestones: [
        {
          id: 'milestone_1',
          description: 'Complete initial work',
          amount: '500.00',
          status: 'Pending',
          deadline: Date.now() + 86400000 // 24 hours
        },
        {
          id: 'milestone_2',
          description: 'Final delivery',
          amount: '500.00',
          status: 'Pending',
          deadline: Date.now() + 172800000 // 48 hours
        }
      ],
      createdAt: Date.now(),
      ...overrides
    };
  }

  static createAccount(role: 'client' | 'freelancer' = 'client') {
    return {
      address: `test-${role}-address`,
      name: `Test ${role}`,
      balance: '10000.00',
      type: role
    };
  }

  static createTransaction(status: 'pending' | 'confirmed' | 'failed' = 'confirmed') {
    return {
      hash: '0x' + Math.random().toString(16).substr(2, 64),
      status,
      timestamp: Date.now(),
      gasUsed: Math.floor(Math.random() * 1000000),
      blockNumber: Math.floor(Math.random() * 1000000)
    };
  }
}
```

---

## CI/CD Testing Pipeline

### Deployment Testing Strategy

**Environment Promotion:**
```
Local → Testnet → Staging → Mainnet
  ↓         ↓        ↓        ↓
Unit     Integration E2E   Smoke
Tests      Tests    Tests   Tests
```

**Automated Deployment Tests:**
```bash
#!/bin/bash
# File: scripts/deployment-test.sh

echo "🧪 Starting deployment verification..."

# 1. Health check
curl -f https://testnet.escrow-platform.com/health || exit 1

# 2. Contract accessibility
cargo contract call --contract $CONTRACT_ADDRESS \
  --message get_contract_info \
  --dry-run || exit 1

# 3. Frontend smoke test
npm run test:smoke || exit 1

# 4. Critical user journey
npm run test:critical-path || exit 1

echo "✅ Deployment verification complete"
```

### Test Reporting

**Coverage Reports:**
```bash
# Generate comprehensive coverage report
npm run test:coverage
cargo tarpaulin --out Html

# Upload to coverage service
bash <(curl -s https://codecov.io/bash)
```

**Test Result Aggregation:**
```typescript
// File: scripts/test-reporter.ts
import { generateReport } from './utils/testReporter';

const results = {
  contract: await runContractTests(),
  frontend: await runFrontendTests(),
  integration: await runIntegrationTests(),
  e2e: await runE2ETests()
};

const report = generateReport(results);
console.log(report);

// Send to monitoring service
await sendToMonitoring(report);
```

---

## Test Maintenance

### Test Review Process

**Regular Review Schedule:**
- **Weekly**: Review failing tests and flaky tests
- **Sprint End**: Update test coverage metrics
- **Release**: Comprehensive test suite review
- **Monthly**: Security test updates

**Test Quality Metrics:**
- Test execution time (target: <10 minutes full suite)
- Test flakiness rate (target: <2%)
- Coverage percentage (target: >90% critical paths)
- Test maintenance burden (time spent on test fixes)

### Test Documentation Updates

**When to Update Tests:**
- New feature development
- Bug fixes that expose test gaps
- API or contract interface changes
- Security vulnerability fixes
- Performance optimization changes

**Test Documentation Standards:**
- Clear test descriptions and intentions
- Comprehensive setup and teardown procedures
- Maintainable test data and mocking strategies
- Regular review and refactoring of test code

---

This comprehensive testing guide ensures the .escrow platform meets the highest standards of quality, security, and reliability required for financial applications. Regular execution of these tests provides confidence in platform stability and user safety.

*Last updated: [Current Date] - Review quarterly and update as platform evolves.*
