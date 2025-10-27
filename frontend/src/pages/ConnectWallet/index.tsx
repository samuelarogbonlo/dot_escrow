import { useState, useEffect } from 'react'
import { Box, Button, Flex, Heading, Text, Icon, VStack, HStack, Divider, useColorModeValue, Alert, AlertIcon, Select, AlertDescription, RadioGroup, Radio, Stack } from '@chakra-ui/react'
import { FiCheck, FiRefreshCw, FiDownload } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../../hooks/useWalletContext'

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
  } = useWallet();

  const [connectionStep, setConnectionStep] = useState<'extension' | 'account' | 'node' | 'complete'>('extension');
  const [connectionRetries, setConnectionRetries] = useState(0);
  const [selectedEndpoint, setSelectedEndpoint] = useState(currentEndpoint);
  const [userHasSelectedAccount, setUserHasSelectedAccount] = useState(false);
  const navigate = useNavigate();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Check if we can proceed to the next step
  useEffect(() => {
    if (isExtensionReady && accounts.length > 0 && !userHasSelectedAccount) {
      setConnectionStep('account');
    } else if (isExtensionReady && selectedAccount && userHasSelectedAccount && !isApiReady) {
      setConnectionStep('node');
    } else if (isExtensionReady && selectedAccount && userHasSelectedAccount && isApiReady) {
      setConnectionStep('complete');
    }
  }, [isExtensionReady, accounts, selectedAccount, isApiReady, userHasSelectedAccount]);

  // Reset user selection flag when extension reconnects or accounts change
  useEffect(() => {
    if (!isExtensionReady || accounts.length === 0) {
      setUserHasSelectedAccount(false);
      setConnectionStep('extension');
    }
  }, [isExtensionReady, accounts.length]);
  
  // Handle wallet connection
  const handleConnectExtension = async () => {
    setConnectionRetries(prev => prev + 1);
    console.log(`Attempting extension connection (attempt ${connectionRetries + 1})...`);
    await connectExtension();
  };
  
  // Handle account selection
  const handleAccountSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const address = e.target.value;
    if (address) {
      selectAccount(address);
      setUserHasSelectedAccount(true);
    }
  };
  
  // Handle manual account refresh
  const handleRefreshAccounts = async () => {
    console.log('Manually refreshing accounts...');
    setUserHasSelectedAccount(false); // Reset selection when refreshing
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

  // Check if extension error indicates no extension installed
  const isExtensionMissing = extensionError?.includes('No extension') || 
                             extensionError?.includes('not found') || 
                             extensionError?.includes('not installed');
  
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
          
          {/* No Extension Warning */}
          {isExtensionMissing && (
            <Alert status="warning" borderRadius="md">
              <AlertIcon />
              <Box flex="1">
                <AlertDescription>
                  <Text fontWeight="bold" mb={2}>Polkadot Extension Required</Text>
                  <Text fontSize="sm" mb={3}>
                    You need a Polkadot wallet extension to use this platform. Please install one of the supported extensions:
                  </Text>
                  <VStack spacing={2} align="stretch">
                    <Button 
                      as="a" 
                      href="https://polkadot.js.org/extension/" 
                      target="_blank"
                      size="sm" 
                      leftIcon={<FiDownload />}
                      colorScheme="orange"
                      variant="outline"
                    >
                      Install Polkadot.js Extension
                    </Button>
                    <Button 
                      as="a" 
                      href="https://www.subwallet.app/" 
                      target="_blank"
                      size="sm" 
                      leftIcon={<FiDownload />}
                      colorScheme="orange"
                      variant="outline"
                    >
                      Install SubWallet
                    </Button>
                    <Button 
                      as="a" 
                      href="https://www.talisman.xyz/" 
                      target="_blank"
                      size="sm" 
                      leftIcon={<FiDownload />}
                      colorScheme="orange"
                      variant="outline"
                    >
                      Install Talisman
                    </Button>
                  </VStack>
                  <Text fontSize="xs" mt={3} color="gray.600">
                    After installing, refresh this page and click "Connect" to continue.
                  </Text>
                </AlertDescription>
              </Box>
            </Alert>
          )}
          
          {/* Step 1: Connect Extension */}
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
                connectionStep === 'extension' && !isExtensionMissing && (
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
            
            {extensionError && connectionStep === 'extension' && !isExtensionMissing && (
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
          
          {/* Step 2: Select Account */}
          <Box w="full" position="relative">
            <Flex 
              w="full" 
              p={4} 
              borderWidth="1px" 
              borderRadius="md" 
              alignItems="center"
              justifyContent="space-between"
              bg={connectionStep === 'account' ? 'blue.50' : (selectedAccount && userHasSelectedAccount) ? 'green.50' : 'gray.50'}
              borderColor={connectionStep === 'account' ? 'blue.200' : (selectedAccount && userHasSelectedAccount) ? 'green.200' : 'gray.200'}
              opacity={connectionStep === 'extension' ? 0.5 : 1}
            >
              <VStack align="start" spacing={1}>
                <Text fontWeight="bold">Step 2: Select Account</Text>
                <Text fontSize="sm" color="gray.600">Choose which account to use</Text>
                {selectedAccount && userHasSelectedAccount && (
                  <Text fontSize="xs" color="green.600">
                    Selected: {selectedAccount.meta.name}
                  </Text>
                )}
              </VStack>
              {selectedAccount && userHasSelectedAccount ? (
                <Icon as={FiCheck} color="green.500" boxSize={5} />
              ) : (
                connectionStep === 'account' && (
                  <Select 
                    placeholder="Select account" 
                    size="sm" 
                    width="200px" 
                    onChange={handleAccountSelect}
                    isDisabled={accounts.length === 0}
                    value={selectedAccount?.address || ''}
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
              opacity={(connectionStep === 'extension' || connectionStep === 'account') ? 0.5 : 1}
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
                      <Radio value={endpoints?.PASEO_POP || 'wss://rpc1.paseo.popnetwork.xyz'}>
                        Paseo Testnet (Pop Network) - Recommended
                      </Radio>
                      <Radio value={endpoints?.PASEO_RELAY || 'wss://paseo.rpc.amforc.com:443'}>
                        Paseo Relay Chain
                      </Radio>
                      <Radio value={endpoints?.WESTEND || 'wss://westend-rpc.polkadot.io'}>
                        Westend Testnet
                      </Radio>
                      <Radio value={endpoints?.WESTEND_ASSETHUB || 'wss://westend-asset-hub-rpc.polkadot.io'}>
                        Westend AssetHub Testnet
                      </Radio>
                      <Radio value={endpoints?.ALEPH_TESTNET || 'wss://testnet.azero.fans'}>
                        Aleph Testnet
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
          {/* {process.env.NODE_ENV === 'development' && (
            <Box mt={4} p={3} bg="gray.50" borderRadius="md" w="full" fontSize="xs">
              <Text fontWeight="bold">Debug Info:</Text>
              <Text>Extension Ready: {String(isExtensionReady)}</Text>
              <Text>Accounts: {accounts.length}</Text>
              <Text>Selected Account: {selectedAccount?.address ? `${selectedAccount.meta.name} (${selectedAccount.address.slice(0, 6)}...)` : 'None'}</Text>
              <Text>User Has Selected: {String(userHasSelectedAccount)}</Text>
              <Text>Connection Step: {connectionStep}</Text>
              <Text>API Ready: {String(isApiReady)}</Text>
              <Text>Current Endpoint: {currentEndpoint}</Text>
              <Text>Selected Endpoint: {selectedEndpoint}</Text>
            </Box>
          )} */}
        </VStack>
      </Box>
    </Flex>
  )
}

export default ConnectWallet