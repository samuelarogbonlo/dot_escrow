import React, {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useEffect,
} from "react";
import { useDispatch } from "react-redux";
import { usePolkadotExtension } from "./usePolkadotExtension";
import { usePolkadotApi } from "./usePolkadotApi";
import { useEscrowContract } from "./useEscrowContract";
import { setWallet } from "../store/slices/walletSlice";

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
  getSigner: (address: string) => Promise<any>; 

  // Escrow contract
  createEscrow: (
    userAddress: string,
    counterpartyAddress: string,
    counterpartyType: string,
    status: string,
    title: string,
    description: string,
    totalAmount: string,
    milestones: any[],
    transactionHash: string
  ) => Promise<any>;
  notifyCounterparty: (
    escrowId: string,
    notificationType: string,
    recipientAddress: string,
    message?: string,
    type?: "info" | "success" | "warning"
  ) => Promise<any>;
  getEscrow: (escrowId: string) => Promise<any>;
  checkTransactionStatus: (transactionHash: string) => Promise<any>;
  updateEscrowStatus: (
    escrowId: string,
    newStatus: string,
    transactionHash?: string
  ) => Promise<any>;
  updateEscrowMilestoneStatus: (
    escrowId: string,
    escrowMilestone: any,
    newStatus: string
  ) => Promise<any>;
  listEscrows: () => Promise<any>;
  releaseMilestone: (escrowId: string, milestoneId: string) => Promise<any>;
  disputeMilestone: (
    escrowId: string,
    milestoneId: string,
    reason: string,
    filedBy: string,
    filedByRole: string,
    status: string,
  ) => Promise<any>;
  completeMilestoneTask: (
    escrowId: string,
    milestoneId: string,
    note: string,
    fileUrls: any[],   
  ) => Promise<any>;
  completeMilestone: (
    escrowId: string,
    milestoneId: string,   
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


  // Initialize escrow contract hook with extension and API data
  const escrowContract = useEscrowContract({
    api: api.api,
    account: extension.selectedAccount,
    getSigner: extension.getSigner,
  });

  // Update Redux state when API or extension changes
  useEffect(() => {
    // Only dispatch if the extension is injected and API is ready
    if (api.api && extension.isReady && extension.injected) {
      dispatch(
        setWallet({
          api: api.api,
          extension: extension.injected,
        })
      );
    } else {
      console.warn(
        "Missing required data to set wallet (extension or api not ready)"
      );
    }
  }, [api.api, extension.isReady, extension.injected, dispatch]);

  // Log important state changes
  useEffect(() => {
    
    // Debug: Log if an account gets auto-selected
    if (extension.selectedAccount && extension.accounts?.length > 0) {
      console.log("[WalletContext] Account selection detected - was this user-initiated?");
    }
  }, [extension.isReady, api.isReady, extension.selectedAccount, extension.accounts]);

  // Combine all values into a single context value
  const contextValue = useMemo(() => {
    return {
      // Extension state
      accounts: extension.accounts || [],
      selectedAccount: extension.selectedAccount,
      isExtensionReady: extension.isReady,
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
      getSigner: extension.getSigner,

      // Escrow contract
      createEscrow: escrowContract.createEscrow,
      getEscrow: escrowContract.getEscrow,
      listEscrows: escrowContract.listEscrows,
      releaseMilestone: escrowContract.releaseMilestone,
      disputeMilestone: escrowContract.disputeMilestone,
      completeMilestoneTask: escrowContract.completeMilestoneTask,
      completeMilestone: escrowContract.completeMilestone,
      notifyCounterparty: escrowContract.notifyCounterparty,
      updateEscrowStatus: escrowContract.updateEscrowStatus,
      updateEscrowMilestoneStatus: escrowContract.updateEscrowMilestoneStatus,
      checkTransactionStatus: escrowContract.checkTransactionStatus,
    };
  }, [extension, api, escrowContract]);

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