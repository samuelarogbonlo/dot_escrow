import React, {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useEffect,
  useState,
} from "react";
import { useDispatch } from "react-redux";
import { usePolkadotExtension } from "./usePolkadotExtension";
import { usePolkadotApi } from "./usePolkadotApi";
import { useEscrowContract } from "./useEscrowContract";
import { setWallet } from "../store/slices/walletSlice";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";

interface WalletContextType {
  // Extension state
  accounts: any[];
  selectedAccount: any;
  isExtensionReady: boolean;
  isExtensionLoading: boolean;
  extensionError: string | null;

  // Node API state
  api: any;
  isApiReady: boolean;
  isApiConnecting: boolean;
  apiError: string | null;
  currentEndpoint: string;
  endpoints: any;

  // Actions
  connectExtension: () => Promise<any>;
  refreshAccounts: () => Promise<any>;
  selectAccount: (address: string) => boolean;
  disconnectApi: () => Promise<any>;
  connectApi: (endpoint?: string) => Promise<any>;
  setDirectAccount: (account: InjectedAccountWithMeta) => void;

  // Escrow contract
  createEscrow: (
    userAddress: string,
    counterpartyAddress: string,
    counterpartyType: string,
    status: string,
    title: string,
    description: string,
    totalAmount: string,
    milestones: any[]
  ) => Promise<any>;
 notifyCounterparty: (
    escrowId: string,
    notificationType: string,
    recipientAddress: string,
    message?: string,
    type?: "info" | "success" | "warning",
  ) => Promise<any>;
  getEscrow: (escrowId: string) => Promise<any>;
  updateEscrowStatus: (escrowId: string, newStatus: string) => Promise<any>;
  updateEscrowMilestoneStatus: (escrowId: string, escrowMilestone: any, newStatus: string) => Promise<any>;
  listEscrows: () => Promise<any>;
  releaseMilestone: (escrowId: string, milestoneId: string) => Promise<any>;
  disputeMilestone: (
    escrowId: string,
    milestoneId: string,
    reason: string
  ) => Promise<any>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const dispatch = useDispatch();

  // Initialize Polkadot extension hook
  const extension = usePolkadotExtension();

  // Initialize Polkadot API hook
  const api = usePolkadotApi();

  // State for direct account mode (testing)
  const [mockAccount, setMockAccount] =
    useState<InjectedAccountWithMeta | null>(null);
  const [mockAccounts, setMockAccounts] = useState<InjectedAccountWithMeta[]>(
    []
  );

  // Set up direct account for testing
  const setDirectAccount = (account: InjectedAccountWithMeta) => {
    console.log("[WalletContext] Setting direct account:", account.address);
    setMockAccount(account);
    setMockAccounts([account]);
  };

  // Initialize escrow contract hook with extension and API data
  const escrowContract = useEscrowContract({
    api: api.api,
    account: mockAccount || extension.selectedAccount,
    getSigner: extension.getSigner,
  });

  // Update Redux state when API or extension changes
  useEffect(() => {
    const currentAccount = mockAccount || extension.selectedAccount;
  
    // Only dispatch if the extension is injected and API is ready
    if (api.api && (extension.isReady || mockAccount) && extension.injected) {
      dispatch(
        setWallet({
          api: api.api,
          extension: extension.injected, // <-- Correct object here
        })
      );
    } else {
      console.warn("Missing required data to set wallet (extension or api not ready)");
    }
  }, [api.api, extension.isReady, extension.injected, mockAccount, dispatch]);
  

  // Log important state changes
  useEffect(() => {
    const currentAccount = mockAccount || extension.selectedAccount;
    console.log("[WalletContext] Extension ready:", extension.isReady);
    console.log("[WalletContext] API ready:", api.isReady);
    console.log("[WalletContext] Selected account:", currentAccount?.address);
    console.log("[WalletContext] Using mock account:", !!mockAccount);
  }, [extension.isReady, api.isReady, extension.selectedAccount, mockAccount]);

  // Combine all values into a single context value
  const contextValue = useMemo(() => {
    // If we have a mock account, override extension status
    const accounts = mockAccount ? mockAccounts : extension.accounts;
    const selectedAccount = mockAccount || extension.selectedAccount;
    const isExtensionReady = mockAccount ? true : extension.isReady;

    return {
      // Extension state
      accounts,
      selectedAccount,
      isExtensionReady,
      isExtensionLoading: extension.isLoading,
      extensionError: extension.error,

      // Node API state
      api: api.api,
      isApiReady: api.isReady,
      isApiConnecting: api.isConnecting,
      apiError: api.error,
      currentEndpoint: api.currentEndpoint,
      endpoints: api.endpoints,

      // Actions
      connectExtension: extension.connectExtension,
      refreshAccounts: extension.refreshAccounts,
      selectAccount: extension.selectAccount,
      disconnectApi: api.disconnect,
      connectApi: api.connect,
      setDirectAccount,

      // Escrow contract
      createEscrow: escrowContract.createEscrow,
      getEscrow: escrowContract.getEscrow,
      listEscrows: escrowContract.listEscrows,
      releaseMilestone: escrowContract.releaseMilestone,
      disputeMilestone: escrowContract.disputeMilestone,
      notifyCounterparty: escrowContract.notifyCounterparty,
      updateEscrowStatus: escrowContract.updateEscrowStatus,
      updateEscrowMilestoneStatus: escrowContract.updateEscrowMilestoneStatus
    };
  }, [extension, api, escrowContract, mockAccount, mockAccounts]);

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
