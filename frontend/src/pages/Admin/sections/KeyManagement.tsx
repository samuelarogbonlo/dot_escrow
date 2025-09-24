import React, { useState } from 'react';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Badge,
  Grid,
  GridItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Icon,
  Alert,
  AlertIcon,
  useToast,
  useColorModeValue,
  Input,
  FormControl,
  FormLabel,
  Textarea,
  NumberInput,
  NumberInputField,
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
} from '@chakra-ui/react';
import {
  FiUsers,
  FiShield,
  FiUserPlus,
  FiUserMinus,
  FiSettings,
  FiKey,
  FiAlertTriangle
} from 'react-icons/fi';
import { useWallet } from '../../../hooks/useWalletContext';
import { useAdminGovernance } from '../../../hooks/useAdminGovernance';

interface KeyManagementProps {
  signerInfo?: any;
  onRefresh: () => void;
}

interface Signer {
  address: string;
  alias: string;
  added_date: string;
  added_by: string;
  is_active: boolean;
  last_activity: string;
}

interface SignerInfo {
  signers: Signer[];
  threshold: number;
  total_signers: number;
}

const KeyManagement: React.FC<KeyManagementProps> = ({ signerInfo, onRefresh }) => {
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, any>>({});
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.700');
  const statBg = useColorModeValue('blue.50', 'blue.900');
  const { api, selectedAccount } = useWallet();
  const governance = useAdminGovernance({ api, account: selectedAccount as any });

  const info: SignerInfo = signerInfo || { signers: [], threshold: 1, total_signers: 0 };

  const handleSubmitSignerAction = async () => {
    try {
      if (selectedAction === 'add_signer') {
        await governance.proposeAddSigner(String(formData.address));
      } else if (selectedAction === 'remove_signer') {
        await governance.proposeRemoveSigner(String(formData.address));
      } else if (selectedAction === 'change_threshold') {
        await governance.proposeSetThreshold(Number(formData.threshold));
      } else {
        throw new Error('Select a valid action');
      }

      toast({
        title: 'Proposal Submitted',
        description: 'Key management proposal has been created and is pending approval.',
        status: 'success',
        duration: 3000,
      });

      onClose();
      setSelectedAction('');
      setFormData({});
      onRefresh();
    } catch (error: any) {
      toast({
        title: 'Submission Failed',
        description: error?.message || 'Unknown error occurred',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const truncateAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getSignerStatus = (signer: Signer) => {
    const daysSinceActivity = Math.floor(
      (new Date().getTime() - new Date(signer.last_activity).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (!signer.is_active) {
      return <Badge colorScheme="red">Inactive</Badge>;
    } else if (daysSinceActivity > 30) {
      return <Badge colorScheme="orange">Inactive (30+ days)</Badge>;
    } else if (daysSinceActivity > 7) {
      return <Badge colorScheme="yellow">Low Activity</Badge>;
    } else {
      return <Badge colorScheme="green">Active</Badge>;
    }
  };

  const renderActionForm = () => {
    switch (selectedAction) {
      case 'add_signer':
        return (
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>New Signer Address</FormLabel>
              <Input
                placeholder="0x..."
                value={formData.address || ''}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Alias (Optional)</FormLabel>
              <Input
                placeholder="e.g., Admin 4, Security Team Lead"
                value={formData.alias || ''}
                onChange={(e) => setFormData({...formData, alias: e.target.value})}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Justification</FormLabel>
              <Textarea
                placeholder="Explain why this signer should be added..."
                value={formData.reason || ''}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
              />
            </FormControl>
          </VStack>
        );
      
      case 'remove_signer':
        return (
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Signer to Remove</FormLabel>
              <Input
                placeholder="0x..."
                value={formData.address || ''}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Reason for Removal</FormLabel>
              <Textarea
                placeholder="Explain why this signer should be removed..."
                value={formData.reason || ''}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
              />
            </FormControl>
            <Alert status="warning">
              <AlertIcon />
              <Text fontSize="sm">
                Removing a signer is irreversible. Ensure the remaining signers can still meet the threshold requirement.
              </Text>
            </Alert>
          </VStack>
        );
        
      case 'change_threshold':
        return (
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>New Threshold</FormLabel>
              <NumberInput
                min={1}
                max={info.total_signers}
                value={formData.threshold || ''}
                onChange={(val) => setFormData({...formData, threshold: val})}
              >
                <NumberInputField placeholder="Number of required signatures" />
              </NumberInput>
              <Text fontSize="sm" color="gray.500" mt={1}>
                Current threshold: {info.threshold} of {info.total_signers}
              </Text>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Justification</FormLabel>
              <Textarea
                placeholder="Explain why the threshold should be changed..."
                value={formData.reason || ''}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
              />
            </FormControl>
            <Alert status="info">
              <AlertIcon />
              <Text fontSize="sm">
                Threshold changes affect the security model of the multisig. 
                Lower thresholds reduce security but improve operational efficiency.
              </Text>
            </Alert>
          </VStack>
        );
        
      default:
        return null;
    }
  };

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
        <Button
          leftIcon={<FiSettings />}
          colorScheme="blue"
          onClick={onOpen}
        >
          Manage Keys
        </Button>
      </HStack>

      {/* Multisig Statistics */}
      <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6}>
        <GridItem>
          <Stat bg={statBg} p={4} borderRadius="lg" boxShadow="sm">
            <StatLabel display="flex" alignItems="center">
              <Icon as={FiUsers} mr={2} />
              Active Signers
            </StatLabel>
            <StatNumber>{info.signers.filter(s => s.is_active).length}</StatNumber>
            <StatHelpText>of {info.total_signers} total</StatHelpText>
          </Stat>
        </GridItem>

        <GridItem>
          <Stat bg={statBg} p={4} borderRadius="lg" boxShadow="sm">
            <StatLabel display="flex" alignItems="center">
              <Icon as={FiShield} mr={2} />
              Signature Threshold
            </StatLabel>
            <StatNumber>{info.threshold}</StatNumber>
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
              {info.total_signers > 0 ? Math.round((info.threshold / info.total_signers) * 100) : 0}%
            </StatNumber>
            <StatHelpText>consensus required</StatHelpText>
          </Stat>
        </GridItem>
      </Grid>

      {/* Signers Table */}
      <Card bg={cardBg}>
        <CardHeader>
          <Heading size="sm">Current Signers</Heading>
        </CardHeader>
        <CardBody>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Signer</Th>
                <Th>Address</Th>
                <Th>Added Date</Th>
                <Th>Last Activity</Th>
                <Th>Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {info.signers.map((signer, index) => (
                <Tr key={index}>
                  <Td>
                    <HStack>
                      <Avatar size="sm" name={signer.alias || `Signer ${index + 1}`} />
                      <Box>
                        <Text fontWeight="medium">
                          {signer.alias || `Admin ${index + 1}`}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          Signer #{index + 1}
                        </Text>
                      </Box>
                    </HStack>
                  </Td>
                  <Td>
                    <Text fontFamily="mono" fontSize="sm">
                      {truncateAddress(signer.address)}
                    </Text>
                  </Td>
                  <Td>
                    <Text fontSize="sm">
                      {new Date(signer.added_date).toLocaleDateString()}
                    </Text>
                  </Td>
                  <Td>
                    <Text fontSize="sm">
                      {new Date(signer.last_activity).toLocaleDateString()}
                    </Text>
                  </Td>
                  <Td>{getSignerStatus(signer)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
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
              • Maintain at least 3 active signers for operational resilience
            </Text>
            <Text fontSize="sm">
              • Set threshold to at least 60% of total signers for security
            </Text>
            <Text fontSize="sm">
              • Regularly rotate inactive signers (30+ days without activity)
            </Text>
            <Text fontSize="sm">
              • Always test threshold changes in a controlled environment first
            </Text>
          </VStack>
        </CardBody>
      </Card>

      {/* Key Management Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Key Management Actions</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color="gray.600">
                All key management actions require multisig approval and will create a new proposal.
              </Text>
              
              {!selectedAction ? (
                <VStack spacing={3}>
                  <Button
                    leftIcon={<FiUserPlus />}
                    onClick={() => setSelectedAction('add_signer')}
                    colorScheme="green"
                    variant="outline"
                    size="lg"
                    w="full"
                  >
                    Add New Signer
                  </Button>
                  
                  <Button
                    leftIcon={<FiUserMinus />}
                    onClick={() => setSelectedAction('remove_signer')}
                    colorScheme="red"
                    variant="outline"
                    size="lg"
                    w="full"
                  >
                    Remove Signer
                  </Button>
                  
                  <Button
                    leftIcon={<FiSettings />}
                    onClick={() => setSelectedAction('change_threshold')}
                    colorScheme="blue"
                    variant="outline"
                    size="lg"
                    w="full"
                  >
                    Change Signature Threshold
                  </Button>
                </VStack>
              ) : (
                <Box>
                  <HStack mb={4}>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedAction('');
                        setFormData({});
                      }}
                    >
                      ← Back
                    </Button>
                    <Text fontWeight="bold">
                      {selectedAction === 'add_signer' && 'Add New Signer'}
                      {selectedAction === 'remove_signer' && 'Remove Signer'}
                      {selectedAction === 'change_threshold' && 'Change Threshold'}
                    </Text>
                  </HStack>
                  
                  {renderActionForm()}
                </Box>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            {selectedAction && (
              <Button 
                colorScheme="blue" 
                onClick={handleSubmitSignerAction}
                isDisabled={
                  !formData.reason || 
                  (selectedAction !== 'change_threshold' && !formData.address) ||
                  (selectedAction === 'change_threshold' && !formData.threshold)
                }
              >
                Submit Proposal
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default KeyManagement;