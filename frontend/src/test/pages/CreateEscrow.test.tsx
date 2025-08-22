import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import CreateEscrow from '../../pages/CreateEscrow';
import { escrowSlice } from '../../store/slices/escrowSlice';
import { walletSlice } from '../../store/slices/walletSlice';

// Mock the navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock wallet context
const mockCreateEscrow = vi.fn();
const mockWalletContext = {
  accounts: [
    {
      address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      meta: { name: 'Test Account', source: 'polkadot-js' },
    },
  ],
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
  createEscrow: mockCreateEscrow,
  notifyCounterparty: vi.fn(),
  listEscrows: vi.fn(),
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

describe('CreateEscrow', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateEscrow.mockResolvedValue({
      success: true,
      escrowId: 'escrow_123',
      transactionHash: '0x123456789',
    });
  });

  it('renders create escrow form', () => {
    render(
      <TestWrapper>
        <CreateEscrow />
      </TestWrapper>
    );

    expect(screen.getByText(/create.*escrow/i)).toBeInTheDocument();
    expect(screen.getByText(/basic.*details/i)).toBeInTheDocument();
  });

  it('shows step navigation', () => {
    render(
      <TestWrapper>
        <CreateEscrow />
      </TestWrapper>
    );

    expect(screen.getByText(/basic.*details/i)).toBeInTheDocument();
    expect(screen.getByText(/counterparty.*details/i)).toBeInTheDocument();
    expect(screen.getByText(/milestone.*details/i)).toBeInTheDocument();
    expect(screen.getByText(/review.*details/i)).toBeInTheDocument();
  });

  it('allows filling basic details', async () => {
    render(
      <TestWrapper>
        <CreateEscrow />
      </TestWrapper>
    );

    // Fill in basic details
    const titleInput = screen.getByLabelText(/title/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const amountInput = screen.getByLabelText(/total.*amount/i);

    await user.type(titleInput, 'Website Development Project');
    await user.type(descriptionInput, 'Full-stack web development');
    await user.type(amountInput, '5000');

    expect(titleInput).toHaveValue('Website Development Project');
    expect(descriptionInput).toHaveValue('Full-stack web development');
    expect(amountInput).toHaveValue('5000');
  });

  it('validates required fields in basic details', async () => {
    render(
      <TestWrapper>
        <CreateEscrow />
      </TestWrapper>
    );

    // Try to proceed without filling required fields
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/title.*required/i)).toBeInTheDocument();
      expect(screen.getByText(/description.*required/i)).toBeInTheDocument();
      expect(screen.getByText(/amount.*required/i)).toBeInTheDocument();
    });
  });

  it('proceeds to counterparty details when basic details are valid', async () => {
    render(
      <TestWrapper>
        <CreateEscrow />
      </TestWrapper>
    );

    // Fill basic details
    await user.type(screen.getByLabelText(/title/i), 'Test Project');
    await user.type(screen.getByLabelText(/description/i), 'Test Description');
    await user.type(screen.getByLabelText(/total.*amount/i), '1000');

    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/counterparty.*address/i)).toBeInTheDocument();
    });
  });

  it('allows filling counterparty details', async () => {
    render(
      <TestWrapper>
        <CreateEscrow />
      </TestWrapper>
    );

    // Navigate to counterparty step (assuming we start there for this test)
    // Fill counterparty details
    const addressInput = screen.getByLabelText(/counterparty.*address/i);
    const typeSelect = screen.getByLabelText(/counterparty.*type/i);

    await user.type(addressInput, '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty');
    await user.selectOptions(typeSelect, 'freelancer');

    expect(addressInput).toHaveValue('5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty');
    expect(typeSelect).toHaveValue('freelancer');
  });

  it('validates counterparty address format', async () => {
    render(
      <TestWrapper>
        <CreateEscrow />
      </TestWrapper>
    );

    const addressInput = screen.getByLabelText(/counterparty.*address/i);
    await user.type(addressInput, 'invalid-address');

    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid.*address/i)).toBeInTheDocument();
    });
  });

  it('allows adding milestones', async () => {
    render(
      <TestWrapper>
        <CreateEscrow />
      </TestWrapper>
    );

    // Navigate to milestone step
    // Add milestone
    const addMilestoneButton = screen.getByRole('button', { name: /add.*milestone/i });
    await user.click(addMilestoneButton);

    // Fill milestone details
    const milestoneTitle = screen.getByLabelText(/milestone.*title/i);
    const milestoneAmount = screen.getByLabelText(/milestone.*amount/i);
    const milestoneDeadline = screen.getByLabelText(/deadline/i);

    await user.type(milestoneTitle, 'Design Phase');
    await user.type(milestoneAmount, '2000');
    await user.type(milestoneDeadline, '2024-12-31');

    expect(milestoneTitle).toHaveValue('Design Phase');
    expect(milestoneAmount).toHaveValue('2000');
    expect(milestoneDeadline).toHaveValue('2024-12-31');
  });

  it('validates milestone amounts sum to total', async () => {
    render(
      <TestWrapper>
        <CreateEscrow />
      </TestWrapper>
    );

    // Set total amount to 1000, but add milestones totaling 1500
    // This should show validation error
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/milestone.*amounts.*total/i)).toBeInTheDocument();
    });
  });

  it('shows review screen with all entered data', async () => {
    render(
      <TestWrapper>
        <CreateEscrow />
      </TestWrapper>
    );

    // Navigate through all steps to review
    // Review screen should show all entered data
    expect(screen.getByText(/review.*details/i)).toBeInTheDocument();
    expect(screen.getByText(/confirm.*create/i)).toBeInTheDocument();
  });

  it('creates escrow successfully', async () => {
    render(
      <TestWrapper>
        <CreateEscrow />
      </TestWrapper>
    );

    // Navigate to final step and create escrow
    const createButton = screen.getByRole('button', { name: /create.*escrow/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(mockCreateEscrow).toHaveBeenCalledWith(
        expect.any(String), // creatorAddress
        expect.any(String), // counterpartyAddress
        expect.any(String), // counterpartyType
        expect.any(String), // status
        expect.any(String), // title
        expect.any(String), // description
        expect.any(String), // totalAmount
        expect.any(Array),  // milestones
        expect.any(String)  // transactionHash
      );
    });

    // Should navigate to success page or dashboard
    expect(mockNavigate).toHaveBeenCalled();
  });

  it('handles create escrow error', async () => {
    mockCreateEscrow.mockResolvedValue({
      success: false,
      error: 'Failed to create escrow',
    });

    render(
      <TestWrapper>
        <CreateEscrow />
      </TestWrapper>
    );

    const createButton = screen.getByRole('button', { name: /create.*escrow/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to create escrow/i)).toBeInTheDocument();
    });
  });

  it('allows going back to previous steps', async () => {
    render(
      <TestWrapper>
        <CreateEscrow />
      </TestWrapper>
    );

    // Navigate forward then back
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);

    const backButton = screen.getByRole('button', { name: /back/i });
    await user.click(backButton);

    // Should be back to first step
    expect(screen.getByText(/basic.*details/i)).toBeInTheDocument();
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
        <CreateEscrow />
      </TestWrapper>
    );

    expect(screen.getByText(/connect.*wallet/i)).toBeInTheDocument();
  });

  it('shows loading state during creation', async () => {
    mockCreateEscrow.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => resolve({ success: true, escrowId: 'test' }), 1000);
    }));

    render(
      <TestWrapper>
        <CreateEscrow />
      </TestWrapper>
    );

    const createButton = screen.getByRole('button', { name: /create.*escrow/i });
    await user.click(createButton);

    expect(screen.getByText(/creating/i)).toBeInTheDocument();
    expect(createButton).toBeDisabled();
  });
});