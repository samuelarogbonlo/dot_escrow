import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Grid,
  GridItem,
  
 
  Icon,
  Alert,
  AlertIcon,
  useToast,
  useColorModeValue,

  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Avatar,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Spinner,
} from '@chakra-ui/react';
import {
  FiUsers,
  FiShield,
  FiKey,
  FiAlertTriangle
} from 'react-icons/fi';
import { useWallet } from '../../../hooks/useWalletContext';
import { useAdminGovernance } from '../../../hooks/useAdminGovernance';

interface KeyManagementProps {
  onRefresh?: () => void;
}

interface SignerInfo {
  signers: string[];
  threshold: number;
  total_signers: number;
  current_user_is_signer: boolean;
}

const KeyManagement: React.FC<KeyManagementProps> = ({ onRefresh }) => {
  
  const [signerInfo, setSignerInfo] = useState<SignerInfo>({
    signers: [],
    threshold: 1,
    total_signers: 0,
    current_user_is_signer: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.700');
  const statBg = useColorModeValue('blue.50', 'blue.900');
  const { api, selectedAccount } = useWallet();
  const governance = useAdminGovernance({ api, account: selectedAccount as any });

  // Fetch signer information from smart contract
  const fetchSignerInfo = useCallback(async () => {
    if (!api || !selectedAccount) {
      return;
    }

    try {
    //   setIsLoading(true);

      console.log('Fetching signer info...');

      // Fetch all signer data concurrently
      const [signers, threshold, isCurrentUserSigner] = await Promise.all([
        governance.getAdminSigners(),
        governance.getSignatureThreshold(),
        governance.isAdminSigner(selectedAccount.address)
      ]);

      console.log('Signer data:', { signers, threshold, isCurrentUserSigner });

      const newSignerInfo: SignerInfo = {
        signers: Array.isArray(signers) ? signers : [],
        threshold: threshold || 1,
        total_signers: Array.isArray(signers) ? signers.length : 0,
        current_user_is_signer: Boolean(isCurrentUserSigner)
      };

      // Only update if data changed to prevent unnecessary re-renders
      setSignerInfo(prevInfo => {
        const infoChanged = JSON.stringify(prevInfo) !== JSON.stringify(newSignerInfo);
        return infoChanged ? newSignerInfo : prevInfo;
      });

    } catch (error) {
      console.error('Error fetching signer info:', error);
      
      if (!hasInitialLoad) {
        toast({
          title: "Error",
          description: "Failed to fetch signer information from contract",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } finally {
      setIsLoading(false);
      if (!hasInitialLoad) {
        setHasInitialLoad(true);
      }
    }
  }, [api, selectedAccount, governance.getAdminSigners, governance.getSignatureThreshold, governance.isAdminSigner, isLoading, hasInitialLoad, toast]);

  // Initial load and periodic refresh
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const loadData = async () => {
      if (mounted) {
        await fetchSignerInfo();
        // Refresh every 30 seconds
        timeoutId = setTimeout(() => {
          if (mounted) {
            loadData();
          }
        }, 30000);
      }
    };

    loadData();

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [fetchSignerInfo]);

  const refreshData = useCallback(async () => {
    await fetchSignerInfo();
    if (onRefresh) {
      onRefresh();
    }
  }, [fetchSignerInfo, onRefresh]);


  const truncateAddress = (address: string): string => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const getSignerAlias = (address: string, index: number): string => {
    // You could extend this to fetch actual aliases from contract metadata
    return `Admin ${index + 1}`;
  };

  const getSecurityLevel = (): { level: string; color: string } => {
    if (signerInfo.total_signers === 0) return { level: 'Unknown', color: 'gray' };
    
    const percentage = (signerInfo.threshold / signerInfo.total_signers) * 100;
    
    if (percentage >= 67) return { level: 'High', color: 'green' };
    if (percentage >= 51) return { level: 'Medium', color: 'yellow' };
    return { level: 'Low', color: 'red' };
  };


  if (isLoading && !hasInitialLoad) {
    return (
      <VStack spacing={6} align="stretch">
        <Card bg={cardBg}>
          <CardBody textAlign="center" py={10}>
            <Spinner size="xl" color="blue.500" mb={4} />
            <Text>Loading signer information...</Text>
          </CardBody>
        </Card>
      </VStack>
    );
  }

  const securityLevel = getSecurityLevel();

  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <HStack justify="space-between" align="center">
        <Box>
          <Heading size="md">Multisig Key Management</Heading>
          <Text color="gray.600" fontSize="sm">
            Manage authorized signers and threshold requirements
          </Text>
        </Box>
      
      </HStack>

      {/* Access Warning */}
      {!signerInfo.current_user_is_signer && (
        <Alert status="warning">
          <AlertIcon />
          <Text fontSize="sm">
            You are not currently an authorized signer. Key management actions are restricted to existing signers only.
          </Text>
        </Alert>
      )}

      {/* Multisig Statistics */}
      <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6}>
        <GridItem>
          <Stat bg={statBg} p={4} borderRadius="lg" boxShadow="sm">
            <StatLabel display="flex" alignItems="center">
              <Icon as={FiUsers} mr={2} />
              Total Signers
            </StatLabel>
            <StatNumber>{signerInfo.total_signers}</StatNumber>
            <StatHelpText>authorized accounts</StatHelpText>
          </Stat>
        </GridItem>

        <GridItem>
          <Stat bg={statBg} p={4} borderRadius="lg" boxShadow="sm">
            <StatLabel display="flex" alignItems="center">
              <Icon as={FiShield} mr={2} />
              Signature Threshold
            </StatLabel>
            <StatNumber>{signerInfo.threshold}</StatNumber>
            <StatHelpText>signatures required</StatHelpText>
          </Stat>
        </GridItem>

        <GridItem>
          <Stat bg={statBg} p={4} borderRadius="lg" boxShadow="sm">
            <StatLabel display="flex" alignItems="center">
              <Icon as={FiKey} mr={2} />
              Security Level
            </StatLabel>
            <StatNumber>
              <HStack>
                <Text>{signerInfo.total_signers > 0 ? Math.round((signerInfo.threshold / signerInfo.total_signers) * 100) : 0}%</Text>
                <Badge colorScheme={securityLevel.color} size="sm">
                  {securityLevel.level}
                </Badge>
              </HStack>
            </StatNumber>
            <StatHelpText>consensus required</StatHelpText>
          </Stat>
        </GridItem>
      </Grid>

      {/* Signers Table */}
      <Card bg={cardBg}>
        <CardHeader>
          <Heading size="sm">Current Signers ({signerInfo.total_signers})</Heading>
        </CardHeader>
        <CardBody>
          {signerInfo.signers.length === 0 ? (
            <Text textAlign="center" color="gray.500" py={8}>
              No signers found
            </Text>
          ) : (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Signer</Th>
                  <Th>Address</Th>
                  <Th>Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {signerInfo.signers.map((address, index) => (
                  <Tr key={address}>
                    <Td>
                      <HStack>
                        <Avatar size="sm" name={getSignerAlias(address, index)} />
                        <Box>
                          <Text fontWeight="medium">
                            {getSignerAlias(address, index)}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            Signer #{index + 1}
                          </Text>
                        </Box>
                      </HStack>
                    </Td>
                    <Td>
                      <Text fontFamily="mono" fontSize="sm">
                        {truncateAddress(address)}
                      </Text>
                    </Td>
                    <Td>
                      <HStack>
                        <Badge colorScheme="green">Active</Badge>
                        {address === selectedAccount?.address && (
                          <Badge colorScheme="blue" size="sm">You</Badge>
                        )}
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Security Recommendations */}
      <Card bg={cardBg} borderColor="orange.200">
        <CardBody>
          <HStack mb={3}>
            <Icon as={FiAlertTriangle} color="orange.500" />
            <Heading size="sm">Security Recommendations</Heading>
          </HStack>
          <VStack align="start" spacing={2}>
            <Text fontSize="sm">
              • Maintain at least 3 signers for operational resilience
            </Text>
            <Text fontSize="sm">
              • Set threshold to at least 60% of total signers for security
            </Text>
            <Text fontSize="sm">
              • Regularly review and audit signer access
            </Text>
            <Text fontSize="sm">
              • Test threshold changes carefully before implementation
            </Text>
            {signerInfo.threshold === 1 && signerInfo.total_signers > 1 && (
              <Text fontSize="sm" color="orange.600" fontWeight="medium">
                ⚠️ Consider increasing threshold above 1 for better security
              </Text>
            )}
            {signerInfo.total_signers > 0 && signerInfo.threshold >= signerInfo.total_signers && (
              <Text fontSize="sm" color="red.600" fontWeight="medium">
                ⚠️ Threshold equals total signers - consider adding more signers
              </Text>
            )}
          </VStack>
        </CardBody>
      </Card>

    
    </VStack>
  );
};

export default KeyManagement;