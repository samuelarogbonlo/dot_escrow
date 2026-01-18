import { useState, useEffect } from 'react';
import { web3Accounts, web3Enable, web3FromAddress } from '@polkadot/extension-dapp';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import type { InjectedExtension } from '@polkadot/extension-inject/types';

const APP_NAME = '.escrow';
const WALLET_STORAGE_KEY = 'selectedWalletAddress';

export interface PolkadotExtensionStatus {
  isReady: boolean;
  accounts: InjectedAccountWithMeta[];
  error: string | null;
  selectedAccount: InjectedAccountWithMeta | null;
  isLoading: boolean;
  isTestMode: boolean;
}

export const usePolkadotExtension = () => {
  const [status, setStatus] = useState<PolkadotExtensionStatus>({
    isReady: false,
    accounts: [],
    error: null,
    selectedAccount: null,
    isLoading: false,
    isTestMode: false,
  });

  const [injected, setInjected] = useState<InjectedExtension | null>(null);

  const debugLog = (message: string, data?: any) => {
    console.log(`[PolkadotExtension] ${message}`, data || '');
  };

  const checkExtension = async (): Promise<boolean> => {
    try {
      // Check if extension is available
      const extensions = await web3Enable(APP_NAME);
      if (extensions.length > 0) {
        setInjected(extensions[0]);
        return true;
      }
      return false;
    } catch (error) {
      debugLog('Error checking extension:', error);
      return false;
    }
  };

  const loadAccounts = async (retries = 3): Promise<InjectedAccountWithMeta[]> => {
    let attempt = 0;

    while (attempt < retries) {
      try {
        debugLog(`Attempting to load accounts, attempt ${attempt + 1}`);
        const accounts = await web3Accounts();
        debugLog(`Found ${accounts.length} accounts:`, accounts.map(acc => ({
          name: acc.meta.name,
          address: acc.address.slice(0, 8) + '...'
        })));
        return accounts;
      } catch (error) {
        debugLog(`Failed to load accounts on attempt ${attempt + 1}:`, error);
        attempt++;
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }

    return [];
  };

  const connectExtension = async () => {
    setStatus(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      debugLog('Connecting to Polkadot extension...');

      const extensions = await web3Enable(APP_NAME);

      if (extensions.length === 0) {
        throw new Error('No Polkadot extension found. Please install a supported Polkadot wallet extension.');
      }

      debugLog(`Found ${extensions.length} extension(s):`, extensions.map(ext => ext.name));

      const accounts = await loadAccounts();

      // Give extension time to fully initialize
      await new Promise(resolve => setTimeout(resolve, 300));

      const finalAccounts = accounts.length === 0 ? await loadAccounts(2) : accounts;

      if (finalAccounts.length === 0) {
        throw new Error('No accounts found. Please create an account in your Polkadot wallet extension.');
      }

      debugLog('Extension connected successfully with accounts:', finalAccounts.map(acc => acc.meta.name));

      setInjected(extensions[0]);

      // Never auto-select account - always let user choose
      setStatus({
        isReady: true,
        accounts: finalAccounts,
        error: null,
        selectedAccount: null,
        isLoading: false,
        isTestMode: false,
      });

      return { success: true, accounts: finalAccounts };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to Polkadot extension';
      debugLog('Connection error:', errorMessage);
      setStatus(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      return { success: false, error: errorMessage };
    }
  };

  const refreshAccounts = async () => {
    if (!status.isReady) {
      try {
        debugLog('Extension not ready, attempting to connect...');
        return await connectExtension();
      } catch (error) {
        debugLog('Error connecting extension on refresh:', error);
        return { success: false, error: 'Failed to connect extension' };
      }
    }

    setStatus(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      debugLog('Manually refreshing accounts...');
      const accounts = await loadAccounts();

      if (accounts.length === 0) {
        const errorMsg = 'No accounts found after refresh. Please create an account in your wallet extension.';
        setStatus(prev => ({ ...prev, error: errorMsg, isLoading: false }));
        return { success: false, error: errorMsg };
      }

      // Only preserve selection if the account still exists
      const currentSelected = status.selectedAccount;
      const newSelected = currentSelected
        ? accounts.find(acc => acc.address === currentSelected.address) || null
        : null;

      debugLog('Accounts refreshed:', {
        total: accounts.length,
        previousSelection: currentSelected?.meta.name,
        newSelection: newSelected?.meta.name || 'None'
      });

      setStatus(prev => ({
        ...prev,
        accounts: accounts,
        selectedAccount: newSelected,
        isLoading: false,
        error: null,
      }));

      return { success: true, accounts };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to refresh accounts';
      debugLog('Error refreshing accounts:', error);
      setStatus(prev => ({ ...prev, error: errorMsg, isLoading: false }));
      return { success: false, error: errorMsg };
    }
  };

  const selectAccount = (address: string) => {
    const account = status.accounts.find(acc => acc.address === address);
    if (account) {
      debugLog('User manually selected account:', {
        name: account.meta.name,
        address: account.address.slice(0, 8) + '...'
      });
      // Persist selection to localStorage
      localStorage.setItem(WALLET_STORAGE_KEY, address);
      debugLog('Saved to localStorage:', WALLET_STORAGE_KEY, '=', address.slice(0, 15) + '...');

      // Verify it was saved
      const verify = localStorage.getItem(WALLET_STORAGE_KEY);
      debugLog('localStorage verification:', verify ? 'SUCCESS' : 'FAILED');

      setStatus(prev => ({
        ...prev,
        selectedAccount: account
      }));
      return true;
    }
    debugLog('Account not found for address:', address);
    return false;
  };

  // Clear selection (useful for logout or switching)
  const clearSelection = () => {
    debugLog('Clearing account selection');
    localStorage.removeItem(WALLET_STORAGE_KEY);
    setStatus(prev => ({ ...prev, selectedAccount: null }));
  };

  // Function to set a direct/test account
  const setDirectAccount = (account: InjectedAccountWithMeta) => {
    debugLog('Setting direct test account:', account.address);
    setStatus(prev => ({
      ...prev,
      accounts: [account],
      selectedAccount: account,
      isReady: true,
      isTestMode: true,
      error: null,
    }));
  };

  // Handle both real extension accounts and test accounts
  const getSigner = async (address: string) => {
    try {
      debugLog('Getting signer for address:', address.slice(0, 8) + '...');
      
      // Check if we're in test mode
      if (status.isTestMode) {
        debugLog('Test mode detected - returning mock signer');
        return { 
          success: true, 
          signer: {
            signPayload: async () => {
              throw new Error('Test mode: Cannot sign real transactions');
            },
            signRaw: async () => {
              throw new Error('Test mode: Cannot sign real transactions');
            }
          }
        };
      }

      // Only use web3FromAddress for real extension accounts
      const injector = await web3FromAddress(address);
      debugLog('Signer obtained successfully for address:', address.slice(0, 8) + '...');
      return { success: true, signer: injector.signer };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get signer';
      debugLog('Error getting signer:', errorMessage);
      setStatus(prev => ({ ...prev, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  };

  // Auto-detect extension on mount and restore session
  useEffect(() => {
    const initializeWallet = async () => {
      debugLog('=== WALLET INIT STARTED ===');

      const isAvailable = await checkExtension();
      debugLog(`Extension availability check: ${isAvailable ? 'Available' : 'Not available'}`);

      if (!isAvailable) {
        setStatus(prev => ({
          ...prev,
          error: 'No Polkadot extension detected. Please install Polkadot.js, SubWallet, or Talisman.'
        }));
        return;
      }

      // Check for previously selected account and auto-reconnect
      const savedAddress = localStorage.getItem(WALLET_STORAGE_KEY);
      debugLog('Saved address from localStorage:', savedAddress || 'NONE');

      if (savedAddress) {
        debugLog('Found saved wallet address, attempting auto-reconnect...');

        try {
          const extensions = await web3Enable(APP_NAME);
          debugLog('Extensions found:', extensions.length);

          if (extensions.length > 0) {
            setInjected(extensions[0]);
            const accounts = await loadAccounts();
            debugLog('Accounts loaded:', accounts.length, accounts.map(a => a.address.slice(0, 10)));

            if (accounts.length > 0) {
              const savedAccount = accounts.find(acc => acc.address === savedAddress);
              debugLog('Saved account found in accounts:', !!savedAccount);

              setStatus({
                isReady: true,
                accounts: accounts,
                error: null,
                selectedAccount: savedAccount || null,
                isLoading: false,
                isTestMode: false,
              });

              if (savedAccount) {
                debugLog('Auto-reconnected to saved account:', savedAccount.meta.name);
              } else {
                debugLog('Saved account not found in current accounts, clearing');
                localStorage.removeItem(WALLET_STORAGE_KEY);
              }
            } else {
              debugLog('No accounts available after loading');
            }
          } else {
            debugLog('No extensions available');
          }
        } catch (error) {
          debugLog('Auto-reconnect failed:', error);
        }
      } else {
        debugLog('No saved address, skipping auto-reconnect');
      }

      debugLog('=== WALLET INIT COMPLETED ===');
    };

    initializeWallet();
  }, []);

  // Listen for account changes from extension
  useEffect(() => {
    const handleAccountChange = () => {
      debugLog('Extension accounts may have changed, refreshing...');
      refreshAccounts();
    };

    // Some extensions emit events when accounts change
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('polkadot-extension-accounts-changed', handleAccountChange);
      
      return () => {
        window.removeEventListener('polkadot-extension-accounts-changed', handleAccountChange);
      };
    }
  }, [status.isReady]); // Add dependency to avoid stale closure

  return {
    ...status,
    connectExtension,
    refreshAccounts,
    selectAccount,
    clearSelection,
    getSigner,
    setDirectAccount,
    injected,
  };
};