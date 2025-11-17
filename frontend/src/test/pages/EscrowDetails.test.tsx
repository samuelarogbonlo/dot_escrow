import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import EscrowDetails from '../../pages/EscrowDetails';
import { escrowSlice } from '../../store/slices/escrowSlice';
import { walletSlice } from '../../store/slices/walletSlice';

// Mock wallet context
const mockGetEscrow = vi.fn();
const mockReleaseMilestone = vi.fn();
const mockDisputeMilestone = vi.fn();
const mockUpdateEscrowStatus = vi.fn();

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
  getEscrow: mockGetEscrow,
  releaseMilestone: mockReleaseMilestone,
  disputeMilestone: mockDisputeMilestone,
  updateEscrowStatus: mockUpdateEscrowStatus,
  createEscrow: vi.fn(),
  notifyCounterparty: vi.fn(),
  listEscrows: vi.fn(),
  updateEscrowMilestoneStatus: vi.fn(),
  checkTransactionStatus: vi.fn(),
};

vi.mock('../../hooks/useWalletContext', () => ({
  useWallet: () => mockWalletContext,
}));

// Mock react-router-dom params
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'escrow_123' }),
    useNavigate: () => vi.fn(),
  };
});

// Sample escrow data
const sampleEscrow = {
  id: 'escrow_123',
  title: 'Website Development Project',
  description: 'Full-stack web application development',
  status: 'Active',
  totalAmount: '5000',
  creatorAddress: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
  counterpartyAddress: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
  counterpartyType: 'freelancer',
  createdAt: Date.now() - 86400000, // 1 day ago
  transactionHash: '0x123456789abcdef',
  milestones: [
    {
      id: 'milestone_1',
      description: 'Design Phase',
      amount: '2000',
      status: 'Completed',
      deadline: Date.now() + 86400000, // 1 day from now
      completed_at: Date.now() - 3600000, // 1 hour ago
    },
    {
      id: 'milestone_2',
      description: 'Development Phase',
      amount: '2000',
      status: 'InProgress',
      deadline: Date.now() + 172800000, // 2 days from now
      completed_at: null,
    },
    {
      id: 'milestone_3',
      description: 'Testing & Deployment',
      amount: '1000',
      status: 'Pending',
      deadline: Date.now() + 259200000, // 3 days from now
      completed_at: null,
    },
  ],
};

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
      <MemoryRouter initialEntries={['/escrow/escrow_123']}>
        <ChakraProvider>
          {children}
        </ChakraProvider>
      </MemoryRouter>
    </Provider>
  );
};

describe('EscrowDetails', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetEscrow.mockResolvedValue({
      success: true,
      escrow: sampleEscrow,
    });
    mockReleaseMilestone.mockResolvedValue({
      success: true,
      transactionHash: '0xabc123',
    });
    mockDisputeMilestone.mockResolvedValue({
      success: true,
      transactionHash: '0xdef456',
    });
    mockUpdateEscrowStatus.mockResolvedValue({
      success: true,
      transactionHash: '0x789abc',
    });
  });

  it('renders escrow details page', async () => {
    render(
      <TestWrapper>
        <EscrowDetails />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockGetEscrow).toHaveBeenCalledWith('escrow_123');
      expect(screen.getByText('Website Development Project')).toBeInTheDocument();
    });
  });

  it('displays loading state while fetching escrow', () => {
    mockGetEscrow.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <TestWrapper>
        <EscrowDetails />
      </TestWrapper>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('displays escrow information correctly', async () => {
    render(
      <TestWrapper>
        <EscrowDetails />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Website Development Project')).toBeInTheDocument();
      expect(screen.getByText('Full-stack web application development')).toBeInTheDocument();
      expect(screen.getByText('5000')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  it('shows milestones with correct information', async () => {
    render(
      <TestWrapper>
        <EscrowDetails />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Design Phase')).toBeInTheDocument();
      expect(screen.getByText('Development Phase')).toBeInTheDocument();
      expect(screen.getByText('Testing & Deployment')).toBeInTheDocument();
      
      // Check milestone amounts
      expect(screen.getByText('2000')).toBeInTheDocument();
      expect(screen.getByText('1000')).toBeInTheDocument();
      
      // Check milestone statuses
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('InProgress')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });
  });

  it('allows client to release milestone funds', async () => {
    render(
      <TestWrapper>
        <EscrowDetails />
      </TestWrapper>
    );

    await waitFor(() => {
      const releaseButton = screen.getByRole('button', { name: /release.*funds/i });
      expect(releaseButton).toBeInTheDocument();
    });

    const releaseButton = screen.getByRole('button', { name: /release.*funds/i });
    await user.click(releaseButton);

    // Should open release modal
    await waitFor(() => {
      expect(screen.getByText(/confirm.*release/i)).toBeInTheDocument();
    });

    // Confirm release
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockReleaseMilestone).toHaveBeenCalledWith('escrow_123', 'milestone_2');
    });
  });

  it('allows disputing a milestone', async () => {
    render(
      <TestWrapper>
        <EscrowDetails />
      </TestWrapper>
    );

    await waitFor(() => {
      const disputeButton = screen.getByRole('button', { name: /dispute/i });
      expect(disputeButton).toBeInTheDocument();
    });

    const disputeButton = screen.getByRole('button', { name: /dispute/i });
    await user.click(disputeButton);

    // Should open dispute modal
    await waitFor(() => {
      expect(screen.getByText(/dispute.*milestone/i)).toBeInTheDocument();
    });

    // Fill dispute reason
    const reasonInput = screen.getByLabelText(/reason/i);
    await user.type(reasonInput, 'Work not completed as specified');

    const submitButton = screen.getByRole('button', { name: /submit.*dispute/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockDisputeMilestone).toHaveBeenCalledWith(
        'escrow_123',
        expect.any(String),
        'Work not completed as specified',
        expect.any(String),
        expect.any(String),
        expect.any(String)
      );
    });
  });

  it('shows different actions based on user role', async () => {
    // Test as creator (client)
    render(
      <TestWrapper>
        <EscrowDetails />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /release.*funds/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /dispute/i })).toBeInTheDocument();
    });
  });

  it('shows different actions for counterparty', async () => {
    const initialState = {
      wallet: {
        selectedAccount: {
          address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty', // Counterparty address
          meta: { name: 'Freelancer Account' },
        },
        isConnected: true,
      },
    };

    render(
      <TestWrapper initialState={initialState}>
        <EscrowDetails />
      </TestWrapper>
    );

    await waitFor(() => {
      // Counterparty should see different actions
      expect(screen.getByRole('button', { name: /mark.*complete/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /dispute/i })).toBeInTheDocument();
    });
  });

  it('handles escrow not found error', async () => {
    mockGetEscrow.mockResolvedValue({
      success: false,
      error: 'Escrow not found',
    });

    render(
      <TestWrapper>
        <EscrowDetails />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/escrow not found/i)).toBeInTheDocument();
    });
  });

  it('allows cancelling escrow', async () => {
    render(
      <TestWrapper>
        <EscrowDetails />
      </TestWrapper>
    );

    await waitFor(() => {
      const cancelButton = screen.getByRole('button', { name: /cancel.*escrow/i });
      expect(cancelButton).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /cancel.*escrow/i });
    await user.click(cancelButton);

    // Should open cancel modal
    await waitFor(() => {
      expect(screen.getByText(/cancel.*escrow/i)).toBeInTheDocument();
    });

    const confirmCancelButton = screen.getByRole('button', { name: /confirm.*cancel/i });
    await user.click(confirmCancelButton);

    await waitFor(() => {
      expect(mockUpdateEscrowStatus).toHaveBeenCalledWith('escrow_123', 'Cancelled');
    });
  });

  it('shows transaction history', async () => {
    render(
      <TestWrapper>
        <EscrowDetails />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/transaction.*history/i)).toBeInTheDocument();
      expect(screen.getByText('0x123456789abcdef')).toBeInTheDocument();
    });
  });

  it('displays milestone deadlines and progress', async () => {
    render(
      <TestWrapper>
        <EscrowDetails />
      </TestWrapper>
    );

    await waitFor(() => {
      // Should show deadline information
      expect(screen.getByText(/deadline/i)).toBeInTheDocument();
      
      // Should show progress indicator
      expect(screen.getByText(/progress/i)).toBeInTheDocument();
    });
  });

  it('handles release milestone error', async () => {
    mockReleaseMilestone.mockResolvedValue({
      success: false,
      error: 'Insufficient balance',
    });

    render(
      <TestWrapper>
        <EscrowDetails />
      </TestWrapper>
    );

    await waitFor(() => {
      const releaseButton = screen.getByRole('button', { name: /release.*funds/i });
      fireEvent.click(releaseButton);
    });

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText(/insufficient balance/i)).toBeInTheDocument();
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
        <EscrowDetails />
      </TestWrapper>
    );

    expect(screen.getByText(/connect.*wallet/i)).toBeInTheDocument();
  });

  it('refreshes data after actions', async () => {
    render(
      <TestWrapper>
        <EscrowDetails />
      </TestWrapper>
    );

    // Release a milestone
    await waitFor(() => {
      const releaseButton = screen.getByRole('button', { name: /release.*funds/i });
      fireEvent.click(releaseButton);
    });

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      // Should call getEscrow again to refresh data
      expect(mockGetEscrow).toHaveBeenCalledTimes(2);
    });
  });
});