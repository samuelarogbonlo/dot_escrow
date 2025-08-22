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

  it('shows retry button on failed connection attempts', () => {
    Object.assign(mockWalletContext, {
      extensionError: 'Connection failed',
    });

    render(
      <TestWrapper>
        <ConnectWallet />
      </TestWrapper>
    );

    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();
  });

  it('progresses to account selection when extension ready', () => {
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

    expect(screen.getByDisplayValue('')).toBeInTheDocument(); // Account select dropdown
    expect(screen.getByText('Test Account 1 - 5Grwva...tQY')).toBeInTheDocument();
    expect(screen.getByText('Test Account 2 - 5FHneW...94ty')).toBeInTheDocument();
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

    const accountSelect = screen.getByDisplayValue('');
    await user.selectOptions(accountSelect, '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');

    expect(mockWalletContext.selectAccount).toHaveBeenCalledWith('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');
  });

  it('shows selected account information', () => {
    Object.assign(mockWalletContext, {
      isExtensionReady: true,
      selectedAccount: {
        address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        meta: { name: 'Test Account', source: 'polkadot-js' },
      },
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

    expect(screen.getByText('Selected: Test Account')).toBeInTheDocument();
  });

  it('shows network selection when ready to connect to node', () => {
    Object.assign(mockWalletContext, {
      isExtensionReady: true,
      selectedAccount: {
        address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        meta: { name: 'Test Account', source: 'polkadot-js' },
      },
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

    expect(screen.getByText('Select Network:')).toBeInTheDocument();
    expect(screen.getByText('Westend Testnet')).toBeInTheDocument();
    expect(screen.getByText('Westend AssetHub Testnet')).toBeInTheDocument();
    expect(screen.getByText('Asset Hub')).toBeInTheDocument();
    expect(screen.getByText('Aleph Testnet')).toBeInTheDocument();
    expect(screen.getByText('Rococo Testnet')).toBeInTheDocument();
    expect(screen.getByText('Local Node')).toBeInTheDocument();
  });

  it('allows selecting different network endpoints', async () => {
    Object.assign(mockWalletContext, {
      isExtensionReady: true,
      selectedAccount: {
        address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        meta: { name: 'Test Account', source: 'polkadot-js' },
      },
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

    const assetHubRadio = screen.getByRole('radio', { name: /asset hub/i });
    await user.click(assetHubRadio);

    expect(assetHubRadio).toBeChecked();
  });

  it('calls connectApi when connect to node button clicked', async () => {
    Object.assign(mockWalletContext, {
      isExtensionReady: true,
      selectedAccount: {
        address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        meta: { name: 'Test Account', source: 'polkadot-js' },
      },
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

    const nodeConnectButtons = screen.getAllByRole('button', { name: /connect/i });
    const nodeConnectButton = nodeConnectButtons.find(button => 
      button.closest('[data-testid="node-connection-step"]') || 
      !button.closest('[data-testid="extension-connection-step"]')
    ) || nodeConnectButtons[nodeConnectButtons.length - 1];

    await user.click(nodeConnectButton);

    expect(mockWalletContext.connectApi).toHaveBeenCalledWith('wss://westend-rpc.polkadot.io');
  });

  it('shows loading state when connecting to node', () => {
    Object.assign(mockWalletContext, {
      isExtensionReady: true,
      selectedAccount: {
        address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        meta: { name: 'Test Account', source: 'polkadot-js' },
      },
      accounts: [
        {
          address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
          meta: { name: 'Test Account', source: 'polkadot-js' },
        },
      ],
      isApiConnecting: true,
    });

    render(
      <TestWrapper>
        <ConnectWallet />
      </TestWrapper>
    );

    const connectButtons = screen.getAllByRole('button', { name: /connect/i });
    const nodeConnectButton = connectButtons[connectButtons.length - 1];
    expect(nodeConnectButton).toBeDisabled();
  });

  it('shows API connection error', () => {
    Object.assign(mockWalletContext, {
      isExtensionReady: true,
      selectedAccount: {
        address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        meta: { name: 'Test Account', source: 'polkadot-js' },
      },
      accounts: [
        {
          address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
          meta: { name: 'Test Account', source: 'polkadot-js' },
        },
      ],
      apiError: 'Failed to connect to node',
    });

    render(
      <TestWrapper>
        <ConnectWallet />
      </TestWrapper>
    );

    expect(screen.getByText('Failed to connect to node')).toBeInTheDocument();
  });

  it('shows continue to dashboard button when fully connected', () => {
    Object.assign(mockWalletContext, {
      isExtensionReady: true,
      selectedAccount: {
        address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        meta: { name: 'Test Account', source: 'polkadot-js' },
      },
      accounts: [
        {
          address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
          meta: { name: 'Test Account', source: 'polkadot-js' },
        },
      ],
      isApiReady: true,
    });

    render(
      <TestWrapper>
        <ConnectWallet />
      </TestWrapper>
    );

    expect(screen.getByRole('button', { name: /continue to dashboard/i })).toBeInTheDocument();
  });

  it('navigates to dashboard when continue button clicked', async () => {
    Object.assign(mockWalletContext, {
      isExtensionReady: true,
      selectedAccount: {
        address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        meta: { name: 'Test Account', source: 'polkadot-js' },
      },
      accounts: [
        {
          address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
          meta: { name: 'Test Account', source: 'polkadot-js' },
        },
      ],
      isApiReady: true,
    });

    render(
      <TestWrapper>
        <ConnectWallet />
      </TestWrapper>
    );

    const continueButton = screen.getByRole('button', { name: /continue to dashboard/i });
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

  it('shows correct visual indicators for completed steps', () => {
    Object.assign(mockWalletContext, {
      isExtensionReady: true,
      selectedAccount: {
        address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        meta: { name: 'Test Account', source: 'polkadot-js' },
      },
      accounts: [
        {
          address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
          meta: { name: 'Test Account', source: 'polkadot-js' },
        },
      ],
      isApiReady: true,
    });

    render(
      <TestWrapper>
        <ConnectWallet />
      </TestWrapper>
    );

    // All steps should show check icons when completed
    const checkIcons = screen.getAllByTestId('check-icon') || 
                      document.querySelectorAll('[data-icon="check"]') ||
                      document.querySelectorAll('svg');
    
    // We should have visual indicators for completed steps
    expect(checkIcons.length).toBeGreaterThan(0);
  });

  it('handles account selection state correctly', async () => {
    Object.assign(mockWalletContext, {
      isExtensionReady: true,
      accounts: [
        {
          address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
          meta: { name: 'Test Account', source: 'polkadot-js' },
        },
      ],
    });

    const { rerender } = render(
      <TestWrapper>
        <ConnectWallet />
      </TestWrapper>
    );

    const accountSelect = screen.getByDisplayValue('');
    await user.selectOptions(accountSelect, '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');

    // Simulate the account being selected
    Object.assign(mockWalletContext, {
      selectedAccount: {
        address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        meta: { name: 'Test Account', source: 'polkadot-js' },
      },
    });

    rerender(
      <TestWrapper>
        <ConnectWallet />
      </TestWrapper>
    );

    expect(screen.getByText('Selected: Test Account')).toBeInTheDocument();
  });

  it('shows different error messages for local node connection', () => {
    Object.assign(mockWalletContext, {
      isExtensionReady: true,
      selectedAccount: {
        address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        meta: { name: 'Test Account', source: 'polkadot-js' },
      },
      accounts: [
        {
          address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
          meta: { name: 'Test Account', source: 'polkadot-js' },
        },
      ],
      apiError: 'Failed to connect',
    });

    render(
      <TestWrapper>
        <ConnectWallet />
      </TestWrapper>
    );

    expect(screen.getByText(/if using local node/i)).toBeInTheDocument();
  });
});