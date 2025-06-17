import { useState, useEffect } from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';

// Default endpoint options
const ENDPOINTS = {
  // Local development node
  LOCAL: 'ws://127.0.0.1:9944',
  // Public Polkadot testnet nodes
  WESTEND: 'wss://westend-rpc.polkadot.io',
  WESTEND_ASSETHUB: 'wss://westend-asset-hub-rpc.polkadot.io',
  ALEPH_TESTNET: 'wss://ws.test.azero.dev',
  ASSETHUB: 'wss://polkadot-asset-hub-rpc.polkadot.io',
  ROCOCO: 'wss://rococo-rpc.polkadot.io',
  // For testing, use public Polkadot node
  PUBLIC: 'wss://rpc.polkadot.io',
  // Auto will first try local, then fall back to public
  AUTO: 'auto'
};

// Default to testing with Westend testnet
const DEFAULT_ENDPOINT = ENDPOINTS.ALEPH_TESTNET;

export interface PolkadotApiStatus {
  api: ApiPromise | null;
  isReady: boolean;
  isConnecting: boolean;
  error: string | null;
  currentEndpoint: string;
  endpoints: typeof ENDPOINTS;
}

export const usePolkadotApi = (endpoint: string = DEFAULT_ENDPOINT) => {
  const [status, setStatus] = useState<PolkadotApiStatus>({
    api: null,
    isReady: false,
    isConnecting: false,
    error: null,
    currentEndpoint: endpoint,
    endpoints: ENDPOINTS,
  });

  // Debug logging
  const debugLog = (message: string, data?: any) => {
    console.log(`[PolkadotAPI] ${message}`, data || '');
  };

  // Check if an endpoint is available
  const checkEndpoint = async (wsEndpoint: string, timeout = 3000): Promise<boolean> => {
    if (wsEndpoint === 'auto') return true; // Skip check for auto
    
    try {
      debugLog(`Checking endpoint ${wsEndpoint}...`);
      
      // Create provider with timeout
      const provider = new WsProvider(wsEndpoint);
      
      // Wait for connection with timeout
      const result = await Promise.race([
        provider.isReady,
        new Promise<boolean>((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), timeout)
        )
      ]);
      
      // Clean up
      if (provider.isConnected) {
        await provider.disconnect();
      }
      
      return !!result;
    } catch (error) {
      debugLog(`Endpoint ${wsEndpoint} check failed:`, error);
      return false;
    }
  };

  // Handle auto endpoint selection
  const resolveAutoEndpoint = async (): Promise<string> => {
    debugLog('Resolving auto endpoint...');
    
    // Try local first
    if (await checkEndpoint(ENDPOINTS.LOCAL, 1000)) {
      debugLog('Local endpoint available, using it');
      return ENDPOINTS.LOCAL;
    }
    
    // Fall back to Westend testnet
    debugLog('Local endpoint not available, using Westend testnet');
    return ENDPOINTS.WESTEND;
  };

  // Connect to the API
  const connect = async (newEndpoint?: string) => {
    const reqEndpoint = newEndpoint || status.currentEndpoint;
    let wsEndpoint = reqEndpoint;
    
    // Don't reconnect if already connecting or ready with same endpoint
    if (
      status.isConnecting || 
      (status.isReady && status.currentEndpoint === reqEndpoint && status.api)
    ) {
      return { success: true, api: status.api };
    }
    
    setStatus(prev => ({ 
      ...prev, 
      isConnecting: true, 
      error: null,
      currentEndpoint: reqEndpoint
    }));
    
    try {
      debugLog(`Connecting to endpoint: ${reqEndpoint}`);
      
      // Handle auto endpoint
      if (reqEndpoint === 'auto') {
        wsEndpoint = await resolveAutoEndpoint();
        debugLog(`Auto resolved to: ${wsEndpoint}`);
      }
      
      // Disconnect from existing API if it exists
      if (status.api && status.api.isConnected) {
        debugLog('Disconnecting from existing API');
        await status.api.disconnect();
      }
      
      // Create a new WebSocket provider
      debugLog(`Creating provider for ${wsEndpoint}`);
      const provider = new WsProvider(wsEndpoint);
      
      // Create the API
      debugLog('Creating API instance');
      const api = await ApiPromise.create({ 
        provider,
        throwOnConnect: true,
        throwOnUnknown: true
      });
      
      // Wait for API to be ready
      debugLog('Waiting for API to be ready');
      await api.isReady;
      
      // Get chain information for verification
      const [chain, nodeName, nodeVersion] = await Promise.all([
        api.rpc.system.chain(),
        api.rpc.system.name(),
        api.rpc.system.version()
      ]);
      
      debugLog(`Connected to chain ${chain} using ${nodeName} v${nodeVersion}`);
      
      setStatus({
        api,
        isReady: true,
        isConnecting: false,
        error: null,
        currentEndpoint: wsEndpoint,
        endpoints: ENDPOINTS,
      });
      
      return { success: true, api, chain, nodeName, nodeVersion };
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to connect to the Polkadot node';
        
      debugLog(`Connection error: ${errorMessage}`, error);
        
      setStatus(prev => ({
        ...prev,
        api: null,
        isReady: false,
        isConnecting: false,
        error: errorMessage,
      }));
      
      return { success: false, error: errorMessage };
    }
  };

  // Disconnect from the API
  const disconnect = async () => {
    if (status.api && status.api.isConnected) {
      try {
        debugLog('Disconnecting from API');
        await status.api.disconnect();
        setStatus({
          api: null,
          isReady: false,
          isConnecting: false,
          error: null,
          currentEndpoint: status.currentEndpoint,
          endpoints: ENDPOINTS,
        });
        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Failed to disconnect from the Polkadot node';
          
        debugLog(`Disconnect error: ${errorMessage}`);
          
        setStatus(prev => ({
          ...prev,
          error: errorMessage,
        }));
        
        return { success: false, error: errorMessage };
      }
    }
    return { success: true };
  };

  // Auto-connect on component mount
  useEffect(() => {
    debugLog('Component mounted, initiating connection');
    connect();
    
    // Cleanup on unmount
    return () => {
      if (status.api && status.api.isConnected) {
        debugLog('Component unmounting, disconnecting API');
        // No need to await this since component is unmounting
        status.api.disconnect().catch(err => 
          console.error('Error disconnecting on unmount:', err)
        );
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ...status,
    connect,
    disconnect,
  };
}; 