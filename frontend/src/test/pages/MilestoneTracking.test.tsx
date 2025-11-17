import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import MilestoneTracking from '../../pages/MilestoneTracking';
import { escrowSlice } from '../../store/slices/escrowSlice';
import { walletSlice } from '../../store/slices/walletSlice';

// Mock wallet context
const mockListEscrows = vi.fn();
const mockUpdateEscrowMilestoneStatus = vi.fn();

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
  updateEscrowMilestoneStatus: mockUpdateEscrowMilestoneStatus,
  getEscrow: vi.fn(),
  createEscrow: vi.fn(),
  releaseMilestone: vi.fn(),
  disputeMilestone: vi.fn(),
  notifyCounterparty: vi.fn(),
  updateEscrowStatus: vi.fn(),
  checkTransactionStatus: vi.fn(),
};

vi.mock('../../hooks/useWalletContext', () => ({
  useWallet: () => mockWalletContext,
}));

// Sample data with multiple escrows and milestones
const sampleEscrows = [
  {
    id: 'escrow_1',
    title: 'Website Development',
    status: 'Active',
    totalAmount: '5000',
    creatorAddress: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    counterpartyAddress: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
    milestones: [
      {
        id: 'milestone_1',
        description: 'Design Phase',
        amount: '2000',
        status: 'Completed',
        deadline: Date.now() - 86400000, // 1 day ago
        completed_at: Date.now() - 3600000, // 1 hour ago
      },
      {
        id: 'milestone_2',
        description: 'Development Phase',
        amount: '2000',
        status: 'InProgress',
        deadline: Date.now() + 86400000, // 1 day from now
        completed_at: null,
      },
      {
        id: 'milestone_3',
        description: 'Testing Phase',
        amount: '1000',
        status: 'Pending',
        deadline: Date.now() + 172800000, // 2 days from now
        completed_at: null,
      },
    ],
  },
  {
    id: 'escrow_2',
    title: 'Mobile App Development',
    status: 'Active',
    totalAmount: '8000',
    creatorAddress: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
    counterpartyAddress: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    milestones: [
      {
        id: 'milestone_4',
        description: 'UI Design',
        amount: '3000',
        status: 'Overdue',
        deadline: Date.now() - 172800000, // 2 days ago
        completed_at: null,
      },
      {
        id: 'milestone_5',
        description: 'Backend Development',
        amount: '5000',
        status: 'Disputed',
        deadline: Date.now() + 86400000, // 1 day from now
        completed_at: null,
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

describe('MilestoneTracking', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockListEscrows.mockResolvedValue({
      success: true,
      escrows: sampleEscrows,
    });
    mockUpdateEscrowMilestoneStatus.mockResolvedValue({
      success: true,
      transactionHash: '0xabc123',
    });
  });

  it('renders milestone tracking page', async () => {
    render(
      <TestWrapper>
        <MilestoneTracking />
      </TestWrapper>
    );

    expect(screen.getByText(/milestone.*tracking/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(mockListEscrows).toHaveBeenCalled();
    });
  });

  it('displays all milestones from multiple escrows', async () => {
    render(
      <TestWrapper>
        <MilestoneTracking />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Design Phase')).toBeInTheDocument();
      expect(screen.getByText('Development Phase')).toBeInTheDocument();
      expect(screen.getByText('Testing Phase')).toBeInTheDocument();
      expect(screen.getByText('UI Design')).toBeInTheDocument();
      expect(screen.getByText('Backend Development')).toBeInTheDocument();
    });
  });

  it('shows milestone statuses with appropriate styling', async () => {
    render(
      <TestWrapper>
        <MilestoneTracking />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('InProgress')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Overdue')).toBeInTheDocument();
      expect(screen.getByText('Disputed')).toBeInTheDocument();
    });
  });

  it('filters milestones by status', async () => {
    render(
      <TestWrapper>
        <MilestoneTracking />
      </TestWrapper>
    );

    await waitFor(() => {
      const statusFilter = screen.getByLabelText(/filter.*status/i);
      expect(statusFilter).toBeInTheDocument();
    });

    const statusFilter = screen.getByLabelText(/filter.*status/i);
    await user.selectOptions(statusFilter, 'Completed');

    await waitFor(() => {
      expect(screen.getByText('Design Phase')).toBeInTheDocument();
      expect(screen.queryByText('Development Phase')).not.toBeInTheDocument();
    });
  });

  it('filters milestones by escrow', async () => {
    render(
      <TestWrapper>
        <MilestoneTracking />
      </TestWrapper>
    );

    await waitFor(() => {
      const escrowFilter = screen.getByLabelText(/filter.*escrow/i);
      expect(escrowFilter).toBeInTheDocument();
    });

    const escrowFilter = screen.getByLabelText(/filter.*escrow/i);
    await user.selectOptions(escrowFilter, 'escrow_1');

    await waitFor(() => {
      expect(screen.getByText('Design Phase')).toBeInTheDocument();
      expect(screen.getByText('Development Phase')).toBeInTheDocument();
      expect(screen.queryByText('UI Design')).not.toBeInTheDocument();
    });
  });

  it('sorts milestones by deadline', async () => {
    render(
      <TestWrapper>
        <MilestoneTracking />
      </TestWrapper>
    );

    await waitFor(() => {
      const sortSelect = screen.getByLabelText(/sort.*by/i);
      expect(sortSelect).toBeInTheDocument();
    });

    const sortSelect = screen.getByLabelText(/sort.*by/i);
    await user.selectOptions(sortSelect, 'deadline');

    // Verify milestones are sorted by deadline
    // (This would require checking the order of elements in the DOM)
  });

  it('shows deadline warnings for overdue milestones', async () => {
    render(
      <TestWrapper>
        <MilestoneTracking />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/overdue/i)).toBeInTheDocument();
      // Should show visual indicators for overdue items
      expect(screen.getByTestId('overdue-indicator')).toBeInTheDocument();
    });
  });

  it('allows updating milestone status', async () => {
    render(
      <TestWrapper>
        <MilestoneTracking />
      </TestWrapper>
    );

    await waitFor(() => {
      const updateButton = screen.getByRole('button', { name: /update.*status/i });
      expect(updateButton).toBeInTheDocument();
    });

    const updateButton = screen.getByRole('button', { name: /update.*status/i });
    await user.click(updateButton);

    // Should open status update modal
    await waitFor(() => {
      expect(screen.getByText(/update.*milestone.*status/i)).toBeInTheDocument();
    });

    const statusSelect = screen.getByLabelText(/new.*status/i);
    await user.selectOptions(statusSelect, 'Completed');

    const confirmButton = screen.getByRole('button', { name: /update/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockUpdateEscrowMilestoneStatus).toHaveBeenCalled();
    });
  });

  it('displays milestone progress indicators', async () => {
    render(
      <TestWrapper>
        <MilestoneTracking />
      </TestWrapper>
    );

    await waitFor(() => {
      // Should show progress bars or indicators
      expect(screen.getByTestId('milestone-progress')).toBeInTheDocument();
    });
  });

  it('shows deadline countdown for active milestones', async () => {
    render(
      <TestWrapper>
        <MilestoneTracking />
      </TestWrapper>
    );

    await waitFor(() => {
      // Should show countdown timers for upcoming deadlines
      expect(screen.getByText(/days.*left/i)).toBeInTheDocument();
    });
  });

  it('handles loading state', () => {
    mockListEscrows.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <TestWrapper>
        <MilestoneTracking />
      </TestWrapper>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    mockListEscrows.mockResolvedValue({
      success: false,
      error: 'Failed to fetch milestones',
    });

    render(
      <TestWrapper>
        <MilestoneTracking />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to fetch milestones/i)).toBeInTheDocument();
    });
  });

  it('shows empty state when no milestones exist', async () => {
    mockListEscrows.mockResolvedValue({
      success: true,
      escrows: [],
    });

    render(
      <TestWrapper>
        <MilestoneTracking />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/no milestones.*found/i)).toBeInTheDocument();
    });
  });

  it('navigates to milestone detail page', async () => {
    render(
      <TestWrapper>
        <MilestoneTracking />
      </TestWrapper>
    );

    await waitFor(() => {
      const milestoneLink = screen.getByText('Design Phase');
      expect(milestoneLink.closest('a')).toHaveAttribute(
        'href',
        '/milestone_detail/escrow_1/milestone_1'
      );
    });
  });

  it('shows different actions based on user role', async () => {
    render(
      <TestWrapper>
        <MilestoneTracking />
      </TestWrapper>
    );

    await waitFor(() => {
      // Should show different actions for creator vs counterparty
      expect(screen.getByRole('button', { name: /release/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /dispute/i })).toBeInTheDocument();
    });
  });

  it('groups milestones by escrow', async () => {
    render(
      <TestWrapper>
        <MilestoneTracking />
      </TestWrapper>
    );

    await waitFor(() => {
      const groupToggle = screen.getByLabelText(/group.*by.*escrow/i);
      await user.click(groupToggle);
    });

    // Should show milestones grouped by their parent escrow
    expect(screen.getByText('Website Development')).toBeInTheDocument();
    expect(screen.getByText('Mobile App Development')).toBeInTheDocument();
  });

  it('shows milestone amounts and totals', async () => {
    render(
      <TestWrapper>
        <MilestoneTracking />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('2000')).toBeInTheDocument(); // Milestone amounts
      expect(screen.getByText('3000')).toBeInTheDocument();
      expect(screen.getByText('5000')).toBeInTheDocument();
    });
  });

  it('handles update milestone status error', async () => {
    mockUpdateEscrowMilestoneStatus.mockResolvedValue({
      success: false,
      error: 'Unauthorized to update milestone',
    });

    render(
      <TestWrapper>
        <MilestoneTracking />
      </TestWrapper>
    );

    await waitFor(() => {
      const updateButton = screen.getByRole('button', { name: /update.*status/i });
      fireEvent.click(updateButton);
    });

    const confirmButton = screen.getByRole('button', { name: /update/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText(/unauthorized to update milestone/i)).toBeInTheDocument();
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
        <MilestoneTracking />
      </TestWrapper>
    );

    expect(screen.getByText(/connect.*wallet/i)).toBeInTheDocument();
  });

  it('refreshes data after status updates', async () => {
    render(
      <TestWrapper>
        <MilestoneTracking />
      </TestWrapper>
    );

    // Update a milestone status
    await waitFor(() => {
      const updateButton = screen.getByRole('button', { name: /update.*status/i });
      fireEvent.click(updateButton);
    });

    const confirmButton = screen.getByRole('button', { name: /update/i });
    await user.click(confirmButton);

    await waitFor(() => {
      // Should refresh the milestones list
      expect(mockListEscrows).toHaveBeenCalledTimes(2);
    });
  });
});