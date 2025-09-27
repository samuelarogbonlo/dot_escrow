// hooks/usePolkadotApi.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';

const ENDPOINTS = {
  LOCAL: 'ws://127.0.0.1:9944',
  WESTEND: 'wss://westend-rpc.polkadot.io',
  WESTEND_ASSETHUB: 'wss://westend-asset-hub-rpc.polkadot.io',
  ALEPH_TESTNET: 'wss://testnet.azero.fans',
  ASSETHUB: 'wss://polkadot-asset-hub-rpc.polkadot.io',
  ROCOCO: 'wss://rococo-rpc.polkadot.io',
  PUBLIC: 'wss://rpc.polkadot.io',
};

const DEFAULT_ENDPOINT = ENDPOINTS.ALEPH_TESTNET;

export interface PolkadotApiStatus {
  api: ApiPromise | null;
  isReady: boolean;
  isConnecting: boolean;
  error: string | null;
  currentEndpoint: string;
  endpoints: typeof ENDPOINTS;
}

export const usePolkadotApi = () => {
  const [api, setApi] = useState<ApiPromise | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentEndpoint, setCurrentEndpoint] = useState<string>(DEFAULT_ENDPOINT);
  
  // Use refs to prevent memory leaks and stale closures
  const apiRef = useRef<ApiPromise | null>(null);
  const providerRef = useRef<WsProvider | null>(null);
  const isConnectingRef = useRef(false);

  const debugLog = useCallback((message: string, data?: any) => {
    console.log(`[PolkadotAPI] ${message}`, data || '');
  }, []);

  const disconnect = useCallback(async () => {
    debugLog('Disconnecting...');
    
    try {
      if (apiRef.current) {
        await apiRef.current.disconnect();
        apiRef.current = null;
      }
      
      if (providerRef.current) {
        await providerRef.current.disconnect();
        providerRef.current = null;
      }
      
      setApi(null);
      setIsReady(false);
      setError(null);
      isConnectingRef.current = false;
      setIsConnecting(false);
      
      debugLog('Disconnected successfully');
      return { success: true };
    } catch (err: any) {
      debugLog('Error during disconnect:', err);
      return { success: false, error: err.message };
    }
  }, [debugLog]);

  const connect = useCallback(async (newEndpoint?: string) => {
    const targetEndpoint = newEndpoint || currentEndpoint;
    
    // Prevent concurrent connections
    if (isConnectingRef.current) {
      debugLog('Connection already in progress, skipping');
      return { success: false, error: 'Connection already in progress' };
    }

    // Don't reconnect if already connected to the same endpoint
    if (isReady && currentEndpoint === targetEndpoint && apiRef.current) {
      debugLog('Already connected to this endpoint');
      return { success: true, api: apiRef.current };
    }
    
    debugLog(`Connecting to endpoint: ${targetEndpoint}`);
    
    // Set connecting state
    isConnectingRef.current = true;
    setIsConnecting(true);
    setError(null);
    setCurrentEndpoint(targetEndpoint);

    // Disconnect existing connection first
    await disconnect();

    try {
      // Create WebSocket provider with proper timeout
      const provider = new WsProvider(targetEndpoint, 10000); // 10 second timeout
      providerRef.current = provider;

      // Set up provider event handlers before creating API
      provider.on('connected', () => {
        debugLog('WebSocket connected');
      });

      provider.on('disconnected', () => {
        debugLog('WebSocket disconnected');
        if (isReady) {
          setIsReady(false);
          setError('Connection lost');
        }
      });

      provider.on('error', (error: any) => {
        debugLog('WebSocket error:', error);
        setError(`Connection error: ${error.message || 'Unknown WebSocket error'}`);
      });

      debugLog('Creating API instance...');

      // Create API instance with timeout and proper error handling
      const apiInstance = await Promise.race([
        ApiPromise.create({ 
          provider,
          throwOnConnect: false, // Don't throw on connection issues
          throwOnUnknown: false, // Don't throw on unknown types
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('API creation timeout after 30 seconds')), 30000)
        )
      ]);

      apiRef.current = apiInstance;

      debugLog('API created, waiting for ready state...');

      // Wait for the API to be ready with timeout
      await Promise.race([
        apiInstance.isReady,
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('API ready timeout after 30 seconds')), 30000)
        )
      ]);

      // Verify connection by getting basic chain info
      const [chain, nodeName, nodeVersion] = await Promise.all([
        apiInstance.rpc.system.chain(),
        apiInstance.rpc.system.name(),
        apiInstance.rpc.system.version()
      ]);

      debugLog(`Successfully connected to ${chain} using ${nodeName} v${nodeVersion}`);

      // Update state
      setApi(apiInstance);
      setIsReady(true);
      setError(null);
      
      return { 
        success: true, 
        api: apiInstance, 
        chain: chain.toString(), 
        nodeName: nodeName.toString(), 
        nodeVersion: nodeVersion.toString() 
      };

    } catch (err: any) {
      debugLog('Connection failed:', err);
      
      // Clean up failed connection
      await disconnect();
      
      // Determine error message based on error type
      let errorMessage = 'Failed to connect to the Polkadot node';
      
      if (err.message?.includes('timeout')) {
        errorMessage = 'Connection timeout - the node may be down or overloaded';
      } else if (err.message?.includes('ENOTFOUND') || err.message?.includes('network')) {
        errorMessage = 'Network error - check your internet connection';
      } else if (err.message?.includes('WebSocket')) {
        errorMessage = 'WebSocket connection failed - try a different endpoint';
      } else if (err.message?.includes('Unsupported')) {
        errorMessage = 'Unsupported network or incompatible node version';
      } else if (err.message) {
        errorMessage = `Connection error: ${err.message}`;
      }
      
      setError(errorMessage);
      setIsReady(false);
      
      return { success: false, error: errorMessage };
      
    } finally {
      isConnectingRef.current = false;
      setIsConnecting(false);
    }
  }, [currentEndpoint, isReady, disconnect, debugLog]);

  // Auto-connect on mount
  useEffect(() => {
    debugLog('Component mounted, initiating connection to default endpoint');
    connect(DEFAULT_ENDPOINT);
    
    // Cleanup on unmount
    return () => {
      debugLog('Component unmounting, cleaning up');
      disconnect();
    };
  }, []); // Empty dependency array for mount-only effect

  return {
    api,
    isReady,
    isConnecting,
    error,
    currentEndpoint,
    endpoints: ENDPOINTS,
    connect,
    disconnect,
  };
};