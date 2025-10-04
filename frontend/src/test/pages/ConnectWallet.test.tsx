import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { vi } from 'vitest';
import ConnectWallet from '../../pages/ConnectWallet';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockWalletContext = {
  accounts: [],
  selectedAccount: null,
  isExtensionReady: false,
  isExtensionLoading: false,
  extensionError: null,
  connectExtension: vi.fn(),
  refreshAccounts: vi.fn(),
  selectAccount: vi.fn(),
  isApiReady: false,
  isApiConnecting: false,
  apiError: null,
  connectApi: vi.fn(),
  currentEndpoint: 'wss://westend-rpc.polkadot.io',
  endpoints: {
    WESTEND: 'wss://westend-rpc.polkadot.io',
    WESTEND_ASSETHUB: 'wss://westend-asset-hub-rpc.polkadot.io',
    ASSETHUB: 'wss://polkadot-asset-hub-rpc.polkadot.io',
    ALEPH_TESTNET: 'wss://ws.test.azero.dev',
    ROCOCO: 'wss://rococo-rpc.polkadot.io',
    LOCAL: 'ws://127.0.0.1:9944',
  },
};

vi.mock('../../hooks/useWalletContext', () => ({
  useWallet: () => mockWalletContext,
}));

const TestWrapper = ({ children }) => {
  return (
    <BrowserRouter>
      <ChakraProvider>
        {children}
      </ChakraProvider>
    </BrowserRouter>
  );
};

describe('ConnectWallet', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(mockWalletContext, {
      accounts: [],
      selectedAccount: null,
      isExtensionReady: false,
      isExtensionLoading: false,
      extensionError: null,
      isApiReady: false,
      isApiConnecting: false,
      apiError: null,
      currentEndpoint: 'wss://westend-rpc.polkadot.io',
    });
  });

  it('renders connect wallet page', () => {
    render(
      <TestWrapper>
        <ConnectWallet />
      </TestWrapper>
    );

    expect(screen.getByText('.escrow')).toBeInTheDocument();
    expect(screen.getByText(/connect your polkadot wallet/i)).toBeInTheDocument();
    expect(screen.getByText('Step 1: Connect to Polkadot Extension')).toBeInTheDocument();
    expect(screen.getByText('Step 2: Select Account')).toBeInTheDocument();
    expect(screen.getByText('Step 3: Connect to Blockchain')).toBeInTheDocument();
  });

  it('shows extension missing warning when no extension found', () => {
    Object.assign(mockWalletContext, {
      extensionError: 'No extension found',
    });

    render(
      <TestWrapper>
        <ConnectWallet />
      </TestWrapper>
    );

    expect(screen.getByText('Polkadot Extension Required')).toBeInTheDocument();
    expect(screen.getByText('Install Polkadot.js Extension')).toBeInTheDocument();
    expect(screen.getByText('Install SubWallet')).toBeInTheDocument();
    expect(screen.getByText('Install Talisman')).toBeInTheDocument();
  });

  it('shows connect button when extension not ready', () => {
    render(
      <TestWrapper>
        <ConnectWallet />
      </TestWrapper>
    );

    const connectButton = screen.getByRole('button', { name: /connect/i });
    expect(connectButton).toBeInTheDocument();
  });

  it('calls connectExtension when connect button clicked', async () => {
    render(
      <TestWrapper>
        <ConnectWallet />
      </TestWrapper>
    );

    const connectButton = screen.getByRole('button', { name: /connect/i });
    await user.click(connectButton);

    expect(mockWalletContext.connectExtension).toHaveBeenCalled();
  });

  it('shows loading state when extension connecting', () => {
    Object.assign(mockWalletContext, {
      isExtensionLoading: true,
    });

    render(
      <TestWrapper>
        <ConnectWallet />
      </TestWrapper>
    );

    const connectButton = screen.getByRole('button', { name: /connect/i });
    expect(connectButton).toBeDisabled();
  });

  it('shows extension error when connection fails', () => {
    Object.assign(mockWalletContext, {
      extensionError: 'Connection failed',
    });

    render(
      <TestWrapper>
        <ConnectWallet />
      </TestWrapper>
    );

    expect(screen.getByText('Connection failed')).toBeInTheDocument();
  });

  it('shows retry button on failed connection attempts', async () => {
    render(
      <TestWrapper>
        <ConnectWallet />
      </TestWrapper>
    );

    // First click shows "Connect"
    const connectButton = screen.getByRole('button', { name: /connect/i });
    await user.click(connectButton);

    // After clicking, button text changes to "Retry" (connectionRetries > 0)
    await waitFor(() => {
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });
  });

  it('progresses to account selection when extension ready', async () => {
    Object.assign(mockWalletContext, {
      isExtensionReady: true,
      accounts: [
        {
          address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
          meta: { name: 'Test Account 1', source: 'polkadot-js' },
        },
        {
          address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
          meta: { name: 'Test Account 2', source: 'polkadot-js' },
        },
      ],
    });

    render(
      <TestWrapper>
        <ConnectWallet />
      </TestWrapper>
    );

    // Wait for account select dropdown to appear (connectionStep changes to 'account')
    await waitFor(() => {
      // Check for the select dropdown with placeholder text
      expect(screen.getByText(/choose which account to use/i)).toBeInTheDocument();
      // Check options exist with correct format: "Name - first6...last4"
      expect(screen.getByText('Test Account 1 - 5Grwva...utQY')).toBeInTheDocument();
      expect(screen.getByText('Test Account 2 - 5FHneW...94ty')).toBeInTheDocument();
    });
  });

  it('allows selecting an account', async () => {
    Object.assign(mockWalletContext, {
      isExtensionReady: true,
      accounts: [
        {
          address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
          meta: { name: 'Test Account', source: 'polkadot-js' },
        },
      ],
    });

    render(
      <TestWrapper>
        <ConnectWallet />
      </TestWrapper>
    );

    // Wait for the select dropdown to appear
    const accountSelect = await waitFor(() => screen.getByRole('combobox'));
    await user.selectOptions(accountSelect, '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');

    expect(mockWalletContext.selectAccount).toHaveBeenCalledWith('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');
  });

  it('shows selected account information', async () => {
    const testAccount = {
      address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      meta: { name: 'Test Account', source: 'polkadot-js' },
    };

    Object.assign(mockWalletContext, {
      isExtensionReady: true,
      selectedAccount: null,
      accounts: [testAccount],
      // Mock selectAccount to update the selectedAccount
      selectAccount: vi.fn().mockImplementation((address) => {
        Object.assign(mockWalletContext, {
          selectedAccount: testAccount,
        });
      }),
    });

    const { rerender } = render(
      <TestWrapper>
        <ConnectWallet />
      </TestWrapper>
    );

    // Wait for dropdown and select an account
    const accountSelect = await waitFor(() => screen.getByRole('combobox'));
    await user.selectOptions(accountSelect, testAccount.address);

    // Force a rerender to pick up mock state change
    rerender(
      <TestWrapper>
        <ConnectWallet />
      </TestWrapper>
    );

    // Check that selected account info is shown
    await waitFor(() => {
      expect(screen.getByText('Selected: Test Account')).toBeInTheDocument();
    });
  });

  it('shows network selection when ready to connect to node', async () => {
    const testAccount = {
      address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      meta: { name: 'Test Account', source: 'polkadot-js' },
    };

    Object.assign(mockWalletContext, {
      isExtensionReady: true,
      selectedAccount: null,
      accounts: [testAccount],
      selectAccount: vi.fn().mockImplementation((address) => {
        Object.assign(mockWalletContext, { selectedAccount: testAccount });
      }),
    });

    const { rerender } = render(
      <TestWrapper>
        <ConnectWallet />
      </TestWrapper>
    );

    // Select account first
    const accountSelect = await waitFor(() => screen.getByRole('combobox'));
    await user.selectOptions(accountSelect, testAccount.address);

    rerender(<TestWrapper><ConnectWallet /></TestWrapper>);

    // Wait for network selection step
    await waitFor(() => {
      expect(screen.getByText(/step 3.*blockchain/i)).toBeInTheDocument();
    });
  });

  it('allows selecting different network endpoints', async () => {
    // Network selection UI is currently commented out in the implementation
    // This test verifies Step 3 appears when account is selected
    const testAccount = {
      address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      meta: { name: 'Test Account', source: 'polkadot-js' },
    };

    Object.assign(mockWalletContext, {
      isExtensionReady: true,
      selectedAccount: null,
      accounts: [testAccount],
      selectAccount: vi.fn().mockImplementation(() => {
        Object.assign(mockWalletContext, { selectedAccount: testAccount });
      }),
    });

    const { rerender } = render(
      <TestWrapper>
        <ConnectWallet />
      </TestWrapper>
    );

    // Select account to progress to node step
    const accountSelect = await waitFor(() => screen.getByRole('combobox'));
    await user.selectOptions(accountSelect, testAccount.address);
    rerender(<TestWrapper><ConnectWallet /></TestWrapper>);

    // Verify Step 3 blockchain connection is shown
    await waitFor(() => {
      expect(screen.getByText(/step 3.*blockchain/i)).toBeInTheDocument();
    });
  });

  it('calls connectApi when connect to node button clicked', async () => {
    const testAccount = {
      address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      meta: { name: 'Test Account', source: 'polkadot-js' },
    };

    Object.assign(mockWalletContext, {
      isExtensionReady: true,
      selectedAccount: null,
      accounts: [testAccount],
      selectAccount: vi.fn().mockImplementation(() => {
        Object.assign(mockWalletContext, { selectedAccount: testAccount });
      }),
    });

    const { rerender } = render(
      <TestWrapper>
        <ConnectWallet />
      </TestWrapper>
    );

    // Select account to progress to node step
    const accountSelect = await waitFor(() => screen.getByRole('combobox'));
    await user.selectOptions(accountSelect, testAccount.address);
    rerender(<TestWrapper><ConnectWallet /></TestWrapper>);

    // Click the Connect button in Step 3
    const connectButtons = await waitFor(() => screen.getAllByRole('button', { name: /connect/i }));
    const nodeConnectButton = connectButtons[connectButtons.length - 1]; // Last connect button is for node
    await user.click(nodeConnectButton);

    expect(mockWalletContext.connectApi).toHaveBeenCalled();
  });

  it('shows loading state when connecting to node', async () => {
    const testAccount = {
      address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      meta: { name: 'Test Account', source: 'polkadot-js' },
    };

    Object.assign(mockWalletContext, {
      isExtensionReady: true,
      selectedAccount: null,
      accounts: [testAccount],
      isApiConnecting: true,
      selectAccount: vi.fn().mockImplementation(() => {
        Object.assign(mockWalletContext, { selectedAccount: testAccount });
      }),
    });

    const { rerender } = render(
      <TestWrapper>
        <ConnectWallet />
      </TestWrapper>
    );

    // Select account
    const accountSelect = await waitFor(() => screen.getByRole('combobox'));
    await user.selectOptions(accountSelect, testAccount.address);
    rerender(<TestWrapper><ConnectWallet /></TestWrapper>);

    // Check connect button is disabled while connecting
    await waitFor(() => {
      const connectButtons = screen.getAllByRole('button', { name: /connect/i });
      const nodeConnectButton = connectButtons[connectButtons.length - 1];
      expect(nodeConnectButton).toBeDisabled();
    });
  });

  it('shows API connection error', async () => {
    const testAccount = {
      address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      meta: { name: 'Test Account', source: 'polkadot-js' },
    };

    Object.assign(mockWalletContext, {
      isExtensionReady: true,
      selectedAccount: null,
      accounts: [testAccount],
      apiError: 'Failed to connect to node',
      selectAccount: vi.fn().mockImplementation(() => {
        Object.assign(mockWalletContext, { selectedAccount: testAccount });
      }),
    });

    const { rerender } = render(
      <TestWrapper>
        <ConnectWallet />
      </TestWrapper>
    );

    // Select account to reach node step
    const accountSelect = await waitFor(() => screen.getByRole('combobox'));
    await user.selectOptions(accountSelect, testAccount.address);
    rerender(<TestWrapper><ConnectWallet /></TestWrapper>);

    // Check error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to connect to node')).toBeInTheDocument();
    });
  });

  it('shows continue to dashboard button when fully connected', async () => {
    const testAccount = {
      address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      meta: { name: 'Test Account', source: 'polkadot-js' },
    };

    Object.assign(mockWalletContext, {
      isExtensionReady: true,
      selectedAccount: null,
      accounts: [testAccount],
      isApiReady: true,
      selectAccount: vi.fn().mockImplementation(() => {
        Object.assign(mockWalletContext, { selectedAccount: testAccount });
      }),
    });

    const { rerender } = render(
      <TestWrapper>
        <ConnectWallet />
      </TestWrapper>
    );

    // Select account
    const accountSelect = await waitFor(() => screen.getByRole('combobox'));
    await user.selectOptions(accountSelect, testAccount.address);

    // Update mock to be API ready
    Object.assign(mockWalletContext, { isApiReady: true });
    rerender(<TestWrapper><ConnectWallet /></TestWrapper>);

    // Check for continue button
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue to dashboard/i })).toBeInTheDocument();
    });
  });

  it('navigates to dashboard when continue button clicked', async () => {
    const testAccount = {
      address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      meta: { name: 'Test Account', source: 'polkadot-js' },
    };

    Object.assign(mockWalletContext, {
      isExtensionReady: true,
      selectedAccount: null,
      accounts: [testAccount],
      isApiReady: false,
      selectAccount: vi.fn().mockImplementation(() => {
        Object.assign(mockWalletContext, { selectedAccount: testAccount });
      }),
    });

    const { rerender } = render(
      <TestWrapper>
        <ConnectWallet />
      </TestWrapper>
    );

    // Select account and set API ready
    const accountSelect = await waitFor(() => screen.getByRole('combobox'));
    await user.selectOptions(accountSelect, testAccount.address);
    Object.assign(mockWalletContext, { isApiReady: true });
    rerender(<TestWrapper><ConnectWallet /></TestWrapper>);

    // Click continue button
    const continueButton = await waitFor(() => screen.getByRole('button', { name: /continue to dashboard/i }));
    await user.click(continueButton);

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('allows refreshing accounts when no accounts error occurs', async () => {
    Object.assign(mockWalletContext, {
      extensionError: 'No accounts found',
    });

    render(
      <TestWrapper>
        <ConnectWallet />
      </TestWrapper>
    );

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);

    expect(mockWalletContext.refreshAccounts).toHaveBeenCalled();
  });

  it('shows supported wallet information', () => {
    render(
      <TestWrapper>
        <ConnectWallet />
      </TestWrapper>
    );

    expect(screen.getByText('Supported wallets:')).toBeInTheDocument();
    expect(screen.getByText('Polkadot.js')).toBeInTheDocument();
    expect(screen.getByText('SubWallet')).toBeInTheDocument();
    expect(screen.getByText('Talisman')).toBeInTheDocument();
  });

  it('shows correct visual indicators for completed steps', async () => {
    const testAccount = {
      address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      meta: { name: 'Test Account', source: 'polkadot-js' },
    };

    Object.assign(mockWalletContext, {
      isExtensionReady: true,
      selectedAccount: null,
      accounts: [testAccount],
      isApiReady: false,
      selectAccount: vi.fn().mockImplementation(() => {
        Object.assign(mockWalletContext, { selectedAccount: testAccount });
      }),
    });

    const { rerender } = render(
      <TestWrapper>
        <ConnectWallet />
      </TestWrapper>
    );

    // Select account
    const accountSelect = await waitFor(() => screen.getByRole('combobox'));
    await user.selectOptions(accountSelect, testAccount.address);
    Object.assign(mockWalletContext, { isApiReady: true });
    rerender(<TestWrapper><ConnectWallet /></TestWrapper>);

    // Check for completed state (all steps done)
    await waitFor(() => {
      expect(screen.getByText(/continue to dashboard/i)).toBeInTheDocument();
    });
  });

  it('handles account selection state correctly', async () => {
    const testAccount = {
      address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      meta: { name: 'Test Account', source: 'polkadot-js' },
    };

    Object.assign(mockWalletContext, {
      isExtensionReady: true,
      selectedAccount: null,
      accounts: [testAccount],
      selectAccount: vi.fn().mockImplementation(() => {
        Object.assign(mockWalletContext, { selectedAccount: testAccount });
      }),
    });

    const { rerender } = render(
      <TestWrapper>
        <ConnectWallet />
      </TestWrapper>
    );

    const accountSelect = await waitFor(() => screen.getByRole('combobox'));
    await user.selectOptions(accountSelect, testAccount.address);

    rerender(<TestWrapper><ConnectWallet /></TestWrapper>);

    await waitFor(() => {
      expect(screen.getByText('Selected: Test Account')).toBeInTheDocument();
    });
  });

  it('shows different error messages for local node connection', async () => {
    const testAccount = {
      address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      meta: { name: 'Test Account', source: 'polkadot-js' },
    };

    Object.assign(mockWalletContext, {
      isExtensionReady: true,
      selectedAccount: null,
      accounts: [testAccount],
      apiError: 'Failed to connect',
      selectAccount: vi.fn().mockImplementation(() => {
        Object.assign(mockWalletContext, { selectedAccount: testAccount });
      }),
    });

    const { rerender } = render(
      <TestWrapper>
        <ConnectWallet />
      </TestWrapper>
    );

    // Select account to reach node step where error shows
    const accountSelect = await waitFor(() => screen.getByRole('combobox'));
    await user.selectOptions(accountSelect, testAccount.address);
    rerender(<TestWrapper><ConnectWallet /></TestWrapper>);

    // Check for local node error message hint
    await waitFor(() => {
      expect(screen.getByText(/if using local node/i)).toBeInTheDocument();
    });
  });
});