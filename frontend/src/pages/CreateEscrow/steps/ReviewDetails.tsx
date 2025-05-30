import React from 'react';
import {
  VStack,
  Box,
  Text,
  Heading,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Card,
  CardHeader,
  CardBody,
  Flex,
  HStack,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
} from '@chakra-ui/react';
import { EscrowFormData } from '../index';

interface ReviewDetailsProps {
  formData: EscrowFormData;
  errors: Record<string, string>;
  userAddress: string;
}

const ReviewDetails: React.FC<ReviewDetailsProps> = ({ formData, errors, userAddress }) => {
  // Colors
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const labelColor = useColorModeValue('gray.600', 'gray.400');

  // Format date
  const formatDate = (date: Date | null) => {
    if (!date) return 'No deadline';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Calculate total amount
  const totalAmount = parseFloat(formData.totalAmount) || 0;
  const totalMilestoneAmount = formData.milestones.reduce(
    (sum, m) => sum + (parseFloat(m.amount) || 0),
    0
  );

  // Determine client and worker addresses
  const isUserClient = formData.counterpartyType === 'worker';
  const clientAddress = isUserClient ? userAddress : formData.counterpartyAddress;
  const workerAddress = isUserClient ? formData.counterpartyAddress : userAddress;

  // Format address for display
  const formatAddress = (address: string) => {
    if (!address) return 'Not specified';
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  return (
    <VStack spacing={6} align="stretch">
      <Box mb={2}>
        <Text fontSize="lg" fontWeight="medium">
          Review Escrow Details
        </Text>
        <Text fontSize="sm" color="gray.500">
          Please review all details before creating the escrow
        </Text>
      </Box>

      {/* Basic Information */}
      <Card variant="outline" borderColor={borderColor} bg={cardBg}>
        <CardHeader pb={2}>
          <Heading size="sm">Basic Information</Heading>
        </CardHeader>
        <CardBody pt={0}>
          <VStack align="start" spacing={3}>
            <Flex width="100%" justify="space-between">
              <Text color={labelColor}>Title:</Text>
              <Text fontWeight="medium">{formData.title}</Text>
            </Flex>
            
            <Flex width="100%" justify="space-between" alignItems="flex-start">
              <Text color={labelColor}>Description:</Text>
              <Text fontWeight="medium" textAlign="right" maxW="60%">
                {formData.description || 'No description provided'}
              </Text>
            </Flex>
            
            <Flex width="100%" justify="space-between">
              <Text color={labelColor}>Total Amount:</Text>
              <Text fontWeight="medium">{totalAmount.toFixed(2)} USDT</Text>
            </Flex>
          </VStack>
        </CardBody>
      </Card>
      
      {/* Parties Information */}
      <Card variant="outline" borderColor={borderColor} bg={cardBg}>
        <CardHeader pb={2}>
          <Heading size="sm">Parties Information</Heading>
        </CardHeader>
        <CardBody pt={0}>
          <VStack align="start" spacing={3}>
            <Flex width="100%" justify="space-between" align="center">
              <HStack>
                <Text color={labelColor}>Client:</Text>
                <Badge colorScheme={isUserClient ? 'green' : 'gray'}>
                  {isUserClient ? 'You' : 'Counterparty'}
                </Badge>
              </HStack>
              <Text fontWeight="medium">{formatAddress(clientAddress)}</Text>
            </Flex>
            
            <Flex width="100%" justify="space-between" align="center">
              <HStack>
                <Text color={labelColor}>Worker:</Text>
                <Badge colorScheme={!isUserClient ? 'green' : 'gray'}>
                  {!isUserClient ? 'You' : 'Counterparty'}
                </Badge>
              </HStack>
              <Text fontWeight="medium">{formatAddress(workerAddress)}</Text>
            </Flex>
          </VStack>
        </CardBody>
      </Card>
      
      {/* Milestones */}
      <Card variant="outline" borderColor={borderColor} bg={cardBg}>
        <CardHeader pb={2}>
          <Heading size="sm">Milestones</Heading>
        </CardHeader>
        <CardBody pt={0}>
          {formData.milestones.length > 0 ? (
            <Box overflowX="auto">
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Description</Th>
                    <Th isNumeric>Amount (USDT)</Th>
                    <Th>Deadline</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {formData.milestones.map((milestone, index) => (
                    <Tr key={index}>
                      <Td>{milestone.description}</Td>
                      <Td isNumeric>{parseFloat(milestone.amount).toFixed(2)}</Td>
                      <Td>{formatDate(milestone.deadline)}</Td>
                    </Tr>
                  ))}
                  <Tr fontWeight="bold">
                    <Td>Total</Td>
                    <Td isNumeric>{totalMilestoneAmount.toFixed(2)}</Td>
                    <Td></Td>
                  </Tr>
                </Tbody>
              </Table>
            </Box>
          ) : (
            <Text color="red.500">No milestones defined</Text>
          )}
          
          {Math.abs(totalMilestoneAmount - totalAmount) > 0.01 && (
            <Alert status="error" mt={4} borderRadius="md">
              <AlertIcon />
              <AlertTitle fontSize="sm">
                {totalMilestoneAmount > totalAmount
                  ? `Milestone total exceeds escrow amount by ${(totalMilestoneAmount - totalAmount).toFixed(2)} USDT`
                  : `Milestone total is less than escrow amount by ${(totalAmount - totalMilestoneAmount).toFixed(2)} USDT`}
              </AlertTitle>
            </Alert>
          )}
        </CardBody>
      </Card>
      
      {/* Additional Information */}
      <Card variant="outline" borderColor={borderColor} bg={cardBg}>
        <CardHeader pb={2}>
          <Heading size="sm">Additional Information</Heading>
        </CardHeader>
        <CardBody pt={0}>
          <VStack align="start" spacing={3}>
            <Flex width="100%" justify="space-between">
              <Text color={labelColor}>Platform Fee:</Text>
              <Text fontWeight="medium">{(totalAmount * 0.01).toFixed(2)} USDT (1%)</Text>
            </Flex>
            
            <Flex width="100%" justify="space-between">
              <Text color={labelColor}>Total to Deposit:</Text>
              <Text fontWeight="bold" color="green.500">
                {(totalAmount * 1.01).toFixed(2)} USDT
              </Text>
            </Flex>
            
            <Divider />
            
            <Text fontSize="sm" color="gray.500">
              By creating this escrow, you agree to the terms and conditions of the .escrow platform.
              Once created, the escrow will be immutable on the blockchain.
            </Text>
          </VStack>
        </CardBody>
      </Card>
      
      {/* Wallet Status */}
      <Card variant="outline" borderColor={borderColor} bg={cardBg}>
        <CardHeader pb={2}>
          <Heading size="sm">Wallet Status</Heading>
        </CardHeader>
        <CardBody pt={0}>
          <VStack align="start" spacing={3}>
            <Flex width="100%" justify="space-between" align="center">
              <Text color={labelColor}>Connected Account:</Text>
              {userAddress ? (
                <HStack>
                  <Badge colorScheme="green">Connected</Badge>
                  <Text fontWeight="medium">{formatAddress(userAddress)}</Text>
                </HStack>
              ) : (
                <HStack>
                  <Badge colorScheme="red">Not Connected</Badge>
                  <Text color="red.500" fontSize="sm">Connect wallet to create escrow</Text>
                </HStack>
              )}
            </Flex>
            
            <Divider />
            
            <Text fontSize="sm" color="gray.500">
              Your wallet must be connected and authorized to create an escrow on the blockchain.
            </Text>
          </VStack>
        </CardBody>
      </Card>
      
      {/* Error Alerts */}
      {Object.keys(errors).length > 0 && (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <AlertTitle>
            Please fix the errors in previous steps before creating the escrow
          </AlertTitle>
        </Alert>
      )}
    </VStack>
  );
};

export default ReviewDetails; 