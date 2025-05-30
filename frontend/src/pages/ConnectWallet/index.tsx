import { useState, useEffect } from 'react'
import { Box, Button, Flex, Heading, Text, Icon, VStack, HStack, Divider, useColorModeValue, Spinner, Alert, AlertIcon, Select, AlertDescription, RadioGroup, Radio, Stack, Input, Checkbox, FormControl, FormLabel } from '@chakra-ui/react'
import { FiAlertCircle, FiCheck, FiRefreshCw } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../../hooks/useWalletContext'
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';

// Mock account for direct address input

function createMockAccount(address: string): InjectedAccountWithMeta {
  return {
    address,
    meta: {
      name: 'Test Account',
      source: 'mock'
    },
    type: 'sr25519' 
  };
}



const ConnectWallet = () => {
  const {
    accounts,
    selectedAccount,
    isExtensionReady,
    isExtensionLoading,
    extensionError,
    connectExtension,
    refreshAccounts,
    selectAccount,
    isApiReady,
    isApiConnecting,
    apiError,
    connectApi,
    currentEndpoint,
    endpoints,
    setDirectAccount, // Will implement this in useWalletContext
  } = useWallet();

  const [connectionStep, setConnectionStep] = useState<'extension' | 'account' | 'node' | 'complete'>('extension');
  const [connectionRetries, setConnectionRetries] = useState(0);
  const [selectedEndpoint, setSelectedEndpoint] = useState(currentEndpoint);
  const [useDirectAddress, setUseDirectAddress] = useState(false);
  const [directAddress, setDirectAddress] = useState('');
  const [directAddressError, setDirectAddressError] = useState('');
  const navigate = useNavigate();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Handle direct address input
  const handleUseDirectAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUseDirectAddress(e.target.checked);
    
    // Clear any extension errors when switching to direct mode
    if (e.target.checked) {
      setConnectionStep('node');
    } else {
      setConnectionStep('extension');
    }
  };
  
  const handleDirectAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDirectAddress(e.target.value);
    setDirectAddressError('');
  };
  
  const handleSubmitDirectAddress = () => {
    // Basic validation for Polkadot address format
    if (!directAddress || directAddress.length < 40) {
      setDirectAddressError('Please enter a valid Polkadot address');
      return;
    }
    
    // Create mock account and set it as selected
    // const mockAccount = createMockAccount(directAddress);
    // if (setDirectAccount) {
    //   setDirectAccount(directAddress);
    //   setConnectionStep('node');
    // }
  };
  
  // Check if we can proceed to the next step
  useEffect(() => {
    // Skip extension connection if using direct address
    if (useDirectAddress) {
      if (selectedAccount && !isApiReady) {
        setConnectionStep('node');
      } else if (selectedAccount && isApiReady) {
        setConnectionStep('complete');
      }
    } else {
      if (isExtensionReady && accounts.length > 0 && !selectedAccount) {
        setConnectionStep('account');
      } else if (isExtensionReady && selectedAccount && !isApiReady) {
        setConnectionStep('node');
      } else if (isExtensionReady && selectedAccount && isApiReady) {
        setConnectionStep('complete');
      }
    }
  }, [isExtensionReady, accounts, selectedAccount, isApiReady, useDirectAddress]);
  
  // Handle wallet connection
  const handleConnectExtension = async () => {
    setConnectionRetries(prev => prev + 1);
    console.log(`Attempting extension connection (attempt ${connectionRetries + 1})...`);
    await connectExtension();
  };
  
  // Handle account selection
  const handleAccountSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const address = e.target.value;
    selectAccount(address);
  };
  
  // Handle manual account refresh
  const handleRefreshAccounts = async () => {
    console.log('Manually refreshing accounts...');
    await refreshAccounts();
  };
  
  // Handle node connection
  const handleConnectNode = async () => {
    await connectApi(selectedEndpoint);
  };

  // Handle endpoint selection
  const handleEndpointChange = (value: string) => {
    setSelectedEndpoint(value);
  };
  
  // Handle completion and navigation to dashboard
  const handleComplete = () => {
    navigate('/');
  };
  
  return (
    <Flex p={10} minH="100vh" align="center" justify="center" bg={useColorModeValue('gray.50', 'gray.900')}>
      <Box 
        w="full" 
        maxW="md" 
        borderWidth="1px" 
        borderRadius="lg" 
        p={8}
        boxShadow="lg"
        bg={bgColor}
        borderColor={borderColor}
      >
        <VStack spacing={6}>
          <Heading fontSize="2xl" textAlign="center">.escrow</Heading>
          <Text textAlign="center" color="gray.600">
            Connect your Polkadot wallet to access the escrow platform
          </Text>
          
          {/* Development Option: Direct address entry */}
          <Box w="full">
            <Flex mb={2} justifyContent="flex-start">
              <Checkbox isChecked={useDirectAddress} onChange={handleUseDirectAddressChange}>
                Test Mode (Enter Address Directly)
              </Checkbox>
            </Flex>
            
            {useDirectAddress && (
              <Box 
                p={4} 
                borderWidth="1px" 
                borderRadius="md" 
                borderColor="purple.200"
                bg="purple.50"
                mb={4}
              >
                <FormControl isInvalid={!!directAddressError}>
                  <FormLabel fontSize="sm">Enter Polkadot Address:</FormLabel>
                  <Flex>
                    <Input 
                      value={directAddress} 
                      onChange={handleDirectAddressChange} 
                      placeholder="5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty"
                      mr={2}
                    />
                    <Button onClick={handleSubmitDirectAddress} colorScheme="purple" size="md">
                      Use
                    </Button>
                  </Flex>
                  {directAddressError && (
                    <Text color="red.500" fontSize="sm" mt={1}>
                      {directAddressError}
                    </Text>
                  )}
                  <Text fontSize="xs" mt={2} color="gray.600">
                    * Test mode bypasses extension for development purposes
                  </Text>
                </FormControl>
              </Box>
            )}
          </Box>
          
          {/* Step 1: Connect Extension */}
          {!useDirectAddress && (
            <Box w="full" position="relative">
              <Flex 
                w="full" 
                p={4} 
                borderWidth="1px" 
                borderRadius="md" 
                alignItems="center"
                justifyContent="space-between"
                bg={connectionStep === 'extension' ? 'blue.50' : isExtensionReady ? 'green.50' : 'gray.50'}
                borderColor={connectionStep === 'extension' ? 'blue.200' : isExtensionReady ? 'green.200' : 'gray.200'}
              >
                <VStack align="start" spacing={1}>
                  <Text fontWeight="bold">Step 1: Connect to Polkadot Extension</Text>
                  <Text fontSize="sm" color="gray.600">Allow .escrow to access your wallet</Text>
                </VStack>
                {isExtensionReady ? (
                  <Icon as={FiCheck} color="green.500" boxSize={5} />
                ) : (
                  connectionStep === 'extension' && (
                    <Button 
                      size="sm"
                      colorScheme="blue"
                      onClick={handleConnectExtension}
                      isLoading={isExtensionLoading}
                      leftIcon={connectionRetries > 0 ? <FiRefreshCw /> : undefined}
                    >
                      {connectionRetries > 0 ? 'Retry' : 'Connect'}
                    </Button>
                  )
                )}
              </Flex>
              
              {extensionError && connectionStep === 'extension' && (
                <Alert status="error" mt={2} borderRadius="md">
                  <AlertIcon />
                  <Box flex="1">
                    <AlertDescription>
                      {extensionError}
                    </AlertDescription>
                  </Box>
                  {extensionError.includes('No accounts found') && (
                    <Button
                      size="sm"
                      leftIcon={<FiRefreshCw />}
                      onClick={handleRefreshAccounts}
                      ml={2}
                      colorScheme="red"
                      variant="outline"
                    >
                      Refresh
                    </Button>
                  )}
                </Alert>
              )}
            </Box>
          )}
          
          {/* Step 2: Select Account */}
          {!useDirectAddress && (
            <Box w="full" position="relative">
              <Flex 
                w="full" 
                p={4} 
                borderWidth="1px" 
                borderRadius="md" 
                alignItems="center"
                justifyContent="space-between"
                bg={connectionStep === 'account' ? 'blue.50' : selectedAccount ? 'green.50' : 'gray.50'}
                borderColor={connectionStep === 'account' ? 'blue.200' : selectedAccount ? 'green.200' : 'gray.200'}
                opacity={connectionStep === 'extension' ? 0.5 : 1}
              >
                <VStack align="start" spacing={1}>
                  <Text fontWeight="bold">Step 2: Select Account</Text>
                  <Text fontSize="sm" color="gray.600">Choose which account to use</Text>
                </VStack>
                {selectedAccount ? (
                  <Icon as={FiCheck} color="green.500" boxSize={5} />
                ) : (
                  connectionStep === 'account' && (
                    <Select 
                      placeholder="Select account" 
                      size="sm" 
                      width="auto" 
                      onChange={handleAccountSelect}
                      isDisabled={accounts.length === 0}
                    >
                      {accounts.map((acc) => (
                        <option key={acc.address} value={acc.address}>
                          {acc.meta.name} - {acc.address.slice(0, 6)}...{acc.address.slice(-4)}
                        </option>
                      ))}
                    </Select>
                  )
                )}
              </Flex>
            </Box>
          )}
          
          {/* Step 3: Connect to Polkadot Node */}
          <Box w="full" position="relative">
            <Flex 
              direction="column"
              w="full" 
              p={4} 
              borderWidth="1px" 
              borderRadius="md"
              bg={connectionStep === 'node' ? 'blue.50' : isApiReady ? 'green.50' : 'gray.50'}
              borderColor={connectionStep === 'node' ? 'blue.200' : isApiReady ? 'green.200' : 'gray.200'}
              opacity={(connectionStep === 'extension' || connectionStep === 'account') && !useDirectAddress ? 0.5 : 1}
            >
              <Flex justifyContent="space-between" alignItems="center" mb={connectionStep === 'node' ? 4 : 0}>
                <VStack align="start" spacing={1}>
                  <Text fontWeight="bold">Step 3: Connect to Blockchain</Text>
                  <Text fontSize="sm" color="gray.600">Connect to the Polkadot network</Text>
                </VStack>
                {isApiReady ? (
                  <Icon as={FiCheck} color="green.500" boxSize={5} />
                ) : (
                  connectionStep === 'node' && (
                    <Button 
                      size="sm"
                      colorScheme="blue"
                      onClick={handleConnectNode}
                      isLoading={isApiConnecting}
                    >
                      Connect
                    </Button>
                  )
                )}
              </Flex>

              {connectionStep === 'node' && !isApiReady && (
                <Box mt={2}>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>Select Network:</Text>
                  <RadioGroup onChange={handleEndpointChange} value={selectedEndpoint}>
                    <Stack direction="column" spacing={2}>
                      <Radio value={endpoints?.WESTEND || 'wss://westend-rpc.polkadot.io'}>
                        Westend Testnet
                      </Radio>
                      <Radio value={endpoints?.ROCOCO || 'wss://rococo-rpc.polkadot.io'}>
                        Rococo Testnet
                      </Radio>
                      <Radio value={endpoints?.LOCAL || 'ws://127.0.0.1:9944'}>
                        Local Node
                      </Radio>
                    </Stack>
                  </RadioGroup>
                </Box>
              )}
            </Flex>
            
            {apiError && connectionStep === 'node' && (
              <Alert status="error" mt={2} borderRadius="md">
                <AlertIcon />
                <Box flex="1">
                  <AlertDescription>
                    {apiError}
                    {apiError?.includes('Failed to connect') && (
                      <Text fontSize="sm" mt={1}>
                        If using Local Node, make sure your node is running. Otherwise, try a different network.
                      </Text>
                    )}
                  </AlertDescription>
                </Box>
              </Alert>
            )}
          </Box>
          
          {connectionStep === 'complete' && (
            <Button
              w="full"
              colorScheme="green"
              size="lg"
              onClick={handleComplete}
              leftIcon={<FiCheck />}
            >
              Continue to Dashboard
            </Button>
          )}
          
          <Divider />
          
          <VStack spacing={3} w="full">
            <Text fontSize="sm" fontWeight="bold">Supported wallets:</Text>
            <HStack justify="center" w="full" spacing={6}>
              <Box p={3} borderWidth="1px" borderRadius="md" textAlign="center">
                <Text fontSize="sm">Polkadot.js</Text>
              </Box>
              <Box p={3} borderWidth="1px" borderRadius="md" textAlign="center">
                <Text fontSize="sm">SubWallet</Text>
              </Box>
              <Box p={3} borderWidth="1px" borderRadius="md" textAlign="center">
                <Text fontSize="sm">Talisman</Text>
              </Box>
            </HStack>
          </VStack>
          
          {/* Add debug info in development */}
          {process.env.NODE_ENV === 'development' && (
            <Box mt={4} p={3} bg="gray.50" borderRadius="md" w="full" fontSize="xs">
              <Text fontWeight="bold">Debug Info:</Text>
              <Text>Extension Ready: {String(isExtensionReady)}</Text>
              <Text>Accounts: {accounts.length}</Text>
              <Text>Selected Account: {selectedAccount?.address ? `${selectedAccount.meta.name} (${selectedAccount.address.slice(0, 6)}...)` : 'None'}</Text>
              <Text>Connection Step: {connectionStep}</Text>
              <Text>API Ready: {String(isApiReady)}</Text>
              <Text>Current Endpoint: {currentEndpoint}</Text>
              <Text>Selected Endpoint: {selectedEndpoint}</Text>
              <Text>Using Direct Address: {String(useDirectAddress)}</Text>
            </Box>
          )}
        </VStack>
      </Box>
    </Flex>
  )
}

export default ConnectWallet 