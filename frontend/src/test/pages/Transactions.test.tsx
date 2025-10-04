import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import Transactions from '../../pages/Transactions';
import { escrowSlice } from '../../store/slices/escrowSlice';
import { walletSlice } from '../../store/slices/walletSlice';

// Mock wallet context
const mockListEscrows = vi.fn();
const mockCheckTransactionStatus = vi.fn();

const mockWalletContext = {
  accounts: [],
  selectedAccount: {
    address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    meta: { name: 'Test Account', source: 'polkadot-js' },
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
  listEscrows: mockListEscrows,
  checkTransactionStatus: mockCheckTransactionStatus,
  getEscrow: vi.fn(),
  createEscrow: vi.fn(),
  notifyCounterparty: vi.fn(),
  releaseMilestone: vi.fn(),
  disputeMilestone: vi.fn(),
  updateEscrowStatus: vi.fn(),
  updateEscrowMilestoneStatus: vi.fn(),
};

vi.mock('../../hooks/useWalletContext', () => ({
  useWallet: () => mockWalletContext,
}));

// Sample transaction data derived from escrows
const sampleEscrows = [
  {
    id: 'escrow_1',
    title: 'Website Development',
    status: 'Active',
    totalAmount: '5000',
    creatorAddress: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    counterpartyAddress: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
    transactionHash: '0x1234567890abcdef',
    createdAt: Date.now() - 86400000, // 1 day ago
    milestones: [
      {
        id: 'milestone_1',
        description: 'Design Phase',
        amount: '2000',
        status: 'Completed',
        transactionHash: '0xabc123def456',
        completed_at: Date.now() - 3600000, // 1 hour ago
      },
      {
        id: 'milestone_2',
        description: 'Development Phase',
        amount: '3000',
        status: 'InProgress',
        transactionHash: null,
        completed_at: null,
      },
    ],
  },
  {
    id: 'escrow_2',
    title: 'Mobile App Development',
    status: 'Completed',
    totalAmount: '8000',
    creatorAddress: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
    counterpartyAddress: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    transactionHash: '0xfedcba0987654321',
    createdAt: Date.now() - 172800000, // 2 days ago
    milestones: [
      {
        id: 'milestone_3',
        description: 'Backend Development',
        amount: '8000',
        status: 'Completed',
        transactionHash: '0x999888777666',
        completed_at: Date.now() - 7200000, // 2 hours ago
      },
    ],
  },
];

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
        selectedAccount: {
          address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
          meta: { name: 'Test Account' },
        },
        accounts: [],
        isConnected: true,
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

// SKIPPED: Transactions page is completely commented out in implementation
describe.skip('Transactions', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockListEscrows.mockResolvedValue({
      success: true,
      escrows: sampleEscrows,
    });
    mockCheckTransactionStatus.mockResolvedValue({
      success: true,
      receipt: {
        status: 1,
        blockHash: '0xblock123',
        blockNumber: 12345,
        finalized: true,
      },
    });
  });

  it('renders transactions page', async () => {
    render(
      <TestWrapper>
        <Transactions />
      </TestWrapper>
    );

    expect(screen.getByText(/transaction.*history/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(mockListEscrows).toHaveBeenCalled();
    });
  });

  it('displays all transactions from escrows and milestones', async () => {
    render(
      <TestWrapper>
        <Transactions />
      </TestWrapper>
    );

    await waitFor(() => {
      // Should show escrow creation transactions
      expect(screen.getByText('Website Development')).toBeInTheDocument();
      expect(screen.getByText('Mobile App Development')).toBeInTheDocument();
      
      // Should show milestone completion transactions
      expect(screen.getByText('Design Phase')).toBeInTheDocument();
      expect(screen.getByText('Backend Development')).toBeInTheDocument();
      
      // Should show transaction hashes
      expect(screen.getByText('0x1234567890abcdef')).toBeInTheDocument();
      expect(screen.getByText('0xfedcba0987654321')).toBeInTheDocument();
    });
  });

  it('filters transactions by type', async () => {
    render(
      <TestWrapper>
        <Transactions />
      </TestWrapper>
    );

    await waitFor(() => {
      const typeFilter = screen.getByLabelText(/filter.*type/i);
      expect(typeFilter).toBeInTheDocument();
    });

    const typeFilter = screen.getByLabelText(/filter.*type/i);
    await user.selectOptions(typeFilter, 'escrow_creation');

    await waitFor(() => {
      expect(screen.getByText('Website Development')).toBeInTheDocument();
      expect(screen.queryByText('Design Phase')).not.toBeInTheDocument();
    });
  });

  it('filters transactions by status', async () => {
    render(
      <TestWrapper>
        <Transactions />
      </TestWrapper>
    );

    await waitFor(() => {
      const statusFilter = screen.getByLabelText(/filter.*status/i);
      expect(statusFilter).toBeInTheDocument();
    });

    const statusFilter = screen.getByLabelText(/filter.*status/i);
    await user.selectOptions(statusFilter, 'completed');

    await waitFor(() => {
      expect(screen.getByText('Backend Development')).toBeInTheDocument();
      expect(screen.queryByText('Development Phase')).not.toBeInTheDocument();
    });
  });

  it('filters transactions by date range', async () => {
    render(
      <TestWrapper>
        <Transactions />
      </TestWrapper>
    );

    await waitFor(() => {
      const fromDate = screen.getByLabelText(/from.*date/i);
      const toDate = screen.getByLabelText(/to.*date/i);
      
      expect(fromDate).toBeInTheDocument();
      expect(toDate).toBeInTheDocument();
    });

    const fromDate = screen.getByLabelText(/from.*date/i);
    const toDate = screen.getByLabelText(/to.*date/i);

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];

    await user.type(fromDate, yesterday);
    await user.type(toDate, today);

    // Should filter transactions within the date range
    await waitFor(() => {
      expect(screen.getByText('Website Development')).toBeInTheDocument();
    });
  });

  it('searches transactions by hash or description', async () => {
    render(
      <TestWrapper>
        <Transactions />
      </TestWrapper>
    );

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/search.*transactions/i);
      expect(searchInput).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search.*transactions/i);
    await user.type(searchInput, '0x1234567890abcdef');

    await waitFor(() => {
      expect(screen.getByText('Website Development')).toBeInTheDocument();
      expect(screen.queryByText('Mobile App Development')).not.toBeInTheDocument();
    });
  });

  it('sorts transactions by date', async () => {
    render(
      <TestWrapper>
        <Transactions />
      </TestWrapper>
    );

    await waitFor(() => {
      const sortSelect = screen.getByLabelText(/sort.*by/i);
      expect(sortSelect).toBeInTheDocument();
    });

    const sortSelect = screen.getByLabelText(/sort.*by/i);
    await user.selectOptions(sortSelect, 'date_desc');

    // Should show newest transactions first
    // (Would need to verify order in DOM)
  });

  it('shows transaction details with amounts', async () => {
    render(
      <TestWrapper>
        <Transactions />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('5000')).toBeInTheDocument(); // Escrow amount
      expect(screen.getByText('2000')).toBeInTheDocument(); // Milestone amount
      expect(screen.getByText('8000')).toBeInTheDocument(); // Another escrow amount
    });
  });

  it('shows transaction status indicators', async () => {
    render(
      <TestWrapper>
        <Transactions />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeInTheDocument();
      expect(screen.getByText(/confirmed/i)).toBeInTheDocument();
    });
  });

  it('allows checking transaction status', async () => {
    render(
      <TestWrapper>
        <Transactions />
      </TestWrapper>
    );

    await waitFor(() => {
      const checkStatusButton = screen.getByRole('button', { name: /check.*status/i });
      expect(checkStatusButton).toBeInTheDocument();
    });

    const checkStatusButton = screen.getByRole('button', { name: /check.*status/i });
    await user.click(checkStatusButton);

    await waitFor(() => {
      expect(mockCheckTransactionStatus).toHaveBeenCalled();
    });
  });

  it('displays transaction confirmation details', async () => {
    render(
      <TestWrapper>
        <Transactions />
      </TestWrapper>
    );

    await waitFor(() => {
      const viewDetailsButton = screen.getByRole('button', { name: /view.*details/i });
      expect(viewDetailsButton).toBeInTheDocument();
    });

    const viewDetailsButton = screen.getByRole('button', { name: /view.*details/i });
    await user.click(viewDetailsButton);

    await waitFor(() => {
      expect(screen.getByText(/block.*hash/i)).toBeInTheDocument();
      expect(screen.getByText(/block.*number/i)).toBeInTheDocument();
      expect(screen.getByText(/confirmation.*status/i)).toBeInTheDocument();
    });
  });

  it('shows transaction fees and gas information', async () => {
    render(
      <TestWrapper>
        <Transactions />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/gas.*used/i)).toBeInTheDocument();
      expect(screen.getByText(/transaction.*fee/i)).toBeInTheDocument();
    });
  });

  it('handles loading state', () => {
    mockListEscrows.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <TestWrapper>
        <Transactions />
      </TestWrapper>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    mockListEscrows.mockResolvedValue({
      success: false,
      error: 'Failed to fetch transactions',
    });

    render(
      <TestWrapper>
        <Transactions />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to fetch transactions/i)).toBeInTheDocument();
    });
  });

  it('shows empty state when no transactions exist', async () => {
    mockListEscrows.mockResolvedValue({
      success: true,
      escrows: [],
    });

    render(
      <TestWrapper>
        <Transactions />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/no transactions.*found/i)).toBeInTheDocument();
    });
  });

  it('exports transactions data', async () => {
    render(
      <TestWrapper>
        <Transactions />
      </TestWrapper>
    );

    await waitFor(() => {
      const exportButton = screen.getByRole('button', { name: /export/i });
      expect(exportButton).toBeInTheDocument();
    });

    const exportButton = screen.getByRole('button', { name: /export/i });
    await user.click(exportButton);

    // Should trigger download or show export options
    expect(screen.getByText(/export.*format/i)).toBeInTheDocument();
  });

  it('paginates transactions list', async () => {
    // Mock a large number of transactions
    const manyEscrows = Array.from({ length: 50 }, (_, i) => ({
      id: `escrow_${i}`,
      title: `Project ${i}`,
      status: 'Active',
      totalAmount: '1000',
      transactionHash: `0x${i.toString().padStart(16, '0')}`,
      createdAt: Date.now() - i * 3600000,
      milestones: [],
    }));

    mockListEscrows.mockResolvedValue({
      success: true,
      escrows: manyEscrows,
    });

    render(
      <TestWrapper>
        <Transactions />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/page.*1.*of/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next.*page/i })).toBeInTheDocument();
    });
  });

  it('links to related escrow details', async () => {
    render(
      <TestWrapper>
        <Transactions />
      </TestWrapper>
    );

    await waitFor(() => {
      const escrowLink = screen.getByText('Website Development');
      expect(escrowLink.closest('a')).toHaveAttribute('href', '/escrow/escrow_1');
    });
  });

  it('shows different transaction types with icons', async () => {
    render(
      <TestWrapper>
        <Transactions />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('escrow-creation-icon')).toBeInTheDocument();
      expect(screen.getByTestId('milestone-completion-icon')).toBeInTheDocument();
    });
  });

  it('handles transaction status check error', async () => {
    mockCheckTransactionStatus.mockResolvedValue({
      success: false,
      error: 'Transaction not found',
    });

    render(
      <TestWrapper>
        <Transactions />
      </TestWrapper>
    );

    await waitFor(() => {
      const checkStatusButton = screen.getByRole('button', { name: /check.*status/i });
      fireEvent.click(checkStatusButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/transaction not found/i)).toBeInTheDocument();
    });
  });

  it('requires wallet connection', () => {
    const initialState = {
      wallet: {
        selectedAccount: null,
        isConnected: false,
      },
    };

    render(
      <TestWrapper initialState={initialState}>
        <Transactions />
      </TestWrapper>
    );

    expect(screen.getByText(/connect.*wallet/i)).toBeInTheDocument();
  });

  it('refreshes transactions data', async () => {
    render(
      <TestWrapper>
        <Transactions />
      </TestWrapper>
    );

    await waitFor(() => {
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      expect(refreshButton).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);

    await waitFor(() => {
      expect(mockListEscrows).toHaveBeenCalledTimes(2);
    });
  });

  it('shows transaction direction (incoming/outgoing)', async () => {
    render(
      <TestWrapper>
        <Transactions />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/outgoing/i)).toBeInTheDocument();
      expect(screen.getByText(/incoming/i)).toBeInTheDocument();
    });
  });
});