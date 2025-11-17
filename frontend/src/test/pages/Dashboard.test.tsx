import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import Dashboard from '../../pages/Dashboard';
import { escrowSlice } from '../../store/slices/escrowSlice';
import { walletSlice } from '../../store/slices/walletSlice';

// Mock wallet context
const mockWalletContext = {
  accounts: [],
  selectedAccount: null,
  isExtensionReady: false,
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
    const initialState = {
      wallet: {
        selectedAccount: {
          address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
          meta: { name: 'Test Account' },
        },
        isConnected: true,
      },
    };

    render(
      <TestWrapper initialState={initialState}>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/test account/i)).toBeInTheDocument();
    });
  });

  it('shows loading state while fetching escrows', async () => {
    const initialState = {
      escrow: {
        loading: true,
        escrows: [],
      },
    };

    render(
      <TestWrapper initialState={initialState}>
        <Dashboard />
      </TestWrapper>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('displays escrows when data is available', async () => {
    const initialState = {
      escrow: {
        escrows: [
          {
            id: 'escrow_1',
            title: 'Website Development',
            status: 'Active',
            totalAmount: '2000',
            creatorAddress: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
            counterpartyAddress: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
            milestones: [
              { id: 'milestone_1', status: 'Pending', amount: '1000' },
              { id: 'milestone_2', status: 'Completed', amount: '1000' },
            ],
          },
        ],
        loading: false,
      },
    };

    render(
      <TestWrapper initialState={initialState}>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/website development/i)).toBeInTheDocument();
      expect(screen.getByText(/2000/)).toBeInTheDocument();
    });
  });

  it('shows empty state when no escrows exist', async () => {
    const initialState = {
      escrow: {
        escrows: [],
        loading: false,
      },
    };

    render(
      <TestWrapper initialState={initialState}>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/no escrows/i)).toBeInTheDocument();
    });
  });

  it('displays error message when fetch fails', async () => {
    const initialState = {
      escrow: {
        escrows: [],
        loading: false,
        error: 'Failed to fetch escrows',
      },
    };

    render(
      <TestWrapper initialState={initialState}>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to fetch escrows/i)).toBeInTheDocument();
    });
  });

  it('shows statistics cards with correct values', async () => {
    const initialState = {
      escrow: {
        escrows: [
          {
            id: 'escrow_1',
            status: 'Active',
            totalAmount: '1000',
            milestones: [
              { id: 'milestone_1', status: 'Completed', amount: '500' },
              { id: 'milestone_2', status: 'Pending', amount: '500' },
            ],
          },
          {
            id: 'escrow_2',
            status: 'Completed',
            totalAmount: '2000',
            milestones: [
              { id: 'milestone_3', status: 'Completed', amount: '2000' },
            ],
          },
        ],
        loading: false,
      },
    };

    render(
      <TestWrapper initialState={initialState}>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      // Check for total escrows
      expect(screen.getByText(/total.*escrows/i)).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      
      // Check for active escrows
      expect(screen.getByText(/active.*escrows/i)).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      
      // Check for total value
      expect(screen.getByText(/total.*value/i)).toBeInTheDocument();
      expect(screen.getByText('3000')).toBeInTheDocument();
    });
  });

  it('navigates to create escrow when button clicked', async () => {
    const { getByRole } = render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    const createButton = getByRole('button', { name: /create.*escrow/i });
    expect(createButton).toBeInTheDocument();
    expect(createButton.closest('a')).toHaveAttribute('href', '/escrow/create');
  });

  it('handles wallet connection state properly', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // Should show connect wallet prompt when no wallet connected
    expect(screen.getByText(/connect.*wallet/i)).toBeInTheDocument();
  });
});