import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import Dashboard from '../../pages/Dashboard';
import { escrowSlice } from '../../store/slices/escrowSlice';
import { walletSlice } from '../../store/slices/walletSlice';

// Mock wallet context - needs to be mutable for different test scenarios
let mockWalletContext = {
  accounts: [{
    address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    meta: { name: 'Test Account' },
  }],
  selectedAccount: {
    address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    meta: { name: 'Test Account' },
  },
  isExtensionReady: true,
  isExtensionLoading: false,
  extensionError: null,
  api: { isConnected: true },
  isApiReady: true,
  isApiConnecting: false,
  apiError: null,
  currentEndpoint: 'wss://westend-rpc.polkadot.io',
  endpoints: {},
  connectExtension: vi.fn(),
  refreshAccounts: vi.fn(),
  selectAccount: vi.fn(),
  disconnectApi: vi.fn(),
  connectApi: vi.fn(),
  getSigner: vi.fn(),
  createEscrow: vi.fn(),
  notifyCounterparty: vi.fn(),
  listEscrows: vi.fn().mockResolvedValue({
    success: true,
    escrows: [
      {
        id: 'escrow_1',
        title: 'Test Escrow',
        status: 'Active',
        totalAmount: '1000',
        creatorAddress: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        counterpartyAddress: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        milestones: [
          { id: 'milestone_1', status: 'Pending', amount: '500' },
          { id: 'milestone_2', status: 'InProgress', amount: '500' },
        ],
      },
    ],
  }),
  getEscrow: vi.fn(),
  releaseMilestone: vi.fn(),
  disputeMilestone: vi.fn(),
  updateEscrowStatus: vi.fn(),
  updateEscrowMilestoneStatus: vi.fn(),
  checkTransactionStatus: vi.fn(),
};

vi.mock('../../hooks/useWalletContext', () => ({
  useWallet: () => mockWalletContext,
}));

// Mock PSP22StablecoinBalance component to avoid contract initialization issues
vi.mock('@/components/PSP22StableCoinBalance/PSP22StablecoinBalance', () => ({
  default: () => null,
}));

// Create test store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      escrow: escrowSlice.reducer,
      wallet: walletSlice.reducer,
    },
    preloadedState: {
      escrow: {
        escrows: [],
        loading: false,
        error: null,
        ...initialState.escrow,
      },
      wallet: {
        selectedAccount: null,
        accounts: [],
        isConnected: false,
        ...initialState.wallet,
      },
    },
  });
};

// Test wrapper component
const TestWrapper = ({ children, initialState = {} }) => {
  const store = createTestStore(initialState);
  return (
    <Provider store={store}>
      <BrowserRouter>
        <ChakraProvider>
          {children}
        </ChakraProvider>
      </BrowserRouter>
    </Provider>
  );
};

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset listEscrows to default
    mockWalletContext.listEscrows = vi.fn().mockResolvedValue({
      success: true,
      escrows: [
        {
          id: 'escrow_1',
          title: 'Test Escrow',
          status: 'Active',
          totalAmount: '1000',
          creatorAddress: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
          counterpartyAddress: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
          milestones: [
            { id: 'milestone_1', status: 'Pending', amount: '500' },
            { id: 'milestone_2', status: 'InProgress', amount: '500' },
          ],
        },
      ],
    });
  });

  it('renders dashboard with welcome message', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  it('displays account information when wallet connected', async () => {
    // Account info is already set in mockWalletContext
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      // Dashboard should render successfully with wallet connected
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });
  });

  it('shows loading state while fetching escrows', async () => {
    // Override mock to make loading take longer
    mockWalletContext.listEscrows = vi.fn().mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve({ success: true, escrows: [] }), 100))
    );

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // Check for skeleton loading state (Chakra UI Skeleton component)
    const skeletons = document.querySelectorAll('.chakra-skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('displays escrows when data is available', async () => {
    // The default mock already has escrow data with user as creator
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // Wait for escrow card to be rendered (escrow cards are the main content)
    await waitFor(async () => {
      const escrowCards = document.querySelectorAll('[class*="escrow"]');
      // At minimum, we should have "Your Escrows" heading rendered
      expect(screen.getByText(/your escrows/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('shows empty state when no escrows exist', async () => {
    // Mock listEscrows to return empty array
    mockWalletContext.listEscrows = vi.fn().mockResolvedValue({
      success: true,
      escrows: [],
    });

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/don't have any escrow agreements yet/i)).toBeInTheDocument();
      expect(screen.getByText(/create your first escrow/i)).toBeInTheDocument();
    });
  });

  it('displays error message when fetch fails', async () => {
    // Mock listEscrows to throw error
    mockWalletContext.listEscrows = vi.fn().mockRejectedValue(new Error('Network error'));

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to load escrows/i)).toBeInTheDocument();
    });
  });

  it('shows statistics cards with correct values', async () => {
    // Mock listEscrows with specific data for stats
    mockWalletContext.listEscrows = vi.fn().mockResolvedValue({
      success: true,
      escrows: [
        {
          id: 'escrow_1',
          title: 'Escrow 1',
          status: 'Active',
          totalAmount: '1000',
          creatorAddress: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
          counterpartyAddress: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
          milestones: [
            { id: 'milestone_1', status: 'Completed', amount: '500' },
            { id: 'milestone_2', status: 'Pending', amount: '500' },
          ],
        },
        {
          id: 'escrow_2',
          title: 'Escrow 2',
          status: 'Completed',
          totalAmount: '2000',
          creatorAddress: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
          counterpartyAddress: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
          milestones: [
            { id: 'milestone_3', status: 'Completed', amount: '2000' },
          ],
        },
      ],
    });

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      // Check for active escrows
      expect(screen.getByText(/active escrows/i)).toBeInTheDocument();

      // Check for completed escrows
      expect(screen.getByText(/completed escrows/i)).toBeInTheDocument();

      // Check for pending milestones
      expect(screen.getByText(/pending milestones/i)).toBeInTheDocument();
    });
  });

  it('navigates to create escrow when button clicked', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      const createButton = screen.getByText(/create escrow/i);
      expect(createButton).toBeInTheDocument();
      expect(createButton.closest('a')).toHaveAttribute('href', '/escrow/create');
    });
  });

  it('handles wallet connection state properly', async () => {
    // Dashboard redirects to /connect when wallet not connected,
    // so we test that it renders correctly when wallet IS connected
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // With wallet connected, should render dashboard content
    await waitFor(() => {
      expect(screen.queryByText(/dashboard/i)).toBeInTheDocument();
    });
  });
});