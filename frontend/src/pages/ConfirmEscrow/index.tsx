import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  Spinner,
  Center,
  Button,
  useToast,
} from "@chakra-ui/react";
import { useWallet } from "../../hooks/useWalletContext";

type EscrowStatus = any;
type MilestoneStatus = any;

interface Milestone {
  id: string;
  description: string;
  amount: string;
  deadline: Date;
  status: MilestoneStatus;
  completionDate?: Date;
}

interface Escrow {
  id: string;
  title: string;
  userAddress: string;
  counterpartyType: string;
  counterpartyAddress: string;
  description: string;
  totalAmount: string;
  status: EscrowStatus;
  createdAt: Date;
  milestones: Milestone[];
}

const ConfirmDetails = () => {
  const { isExtensionReady, selectedAccount, getEscrow, updateEscrowStatus } = useWallet();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const toast = useToast();

  const [escrow, setEscrow] = useState<Escrow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    if (!isExtensionReady || !selectedAccount) {
      navigate("/connect");
    }
  }, [isExtensionReady, selectedAccount, navigate]);

  useEffect(() => {
    const fetchEscrows = async (id: string) => {
      if (!isExtensionReady || !selectedAccount) return;

      setIsLoading(true);
      setError(null);

      try {
        const result = await getEscrow(id);
        if (result.success) {
         const escrowDetail = result.escrow
          setEscrow(escrowDetail);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError("Failed to load escrows. Please try again.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchEscrows(id);
    }
  }, [isExtensionReady, selectedAccount, getEscrow, id]);

  // Handle confirm escrow
  const handleConfirmEscrow = async () => {
    if (!escrow || !id) return;

    setIsConfirming(true);
    try {
      const result = await updateEscrowStatus(id, 'Active');
      if (result.success) {
        toast({
          title: "Escrow Confirmed",
          description: "The escrow has been successfully activated.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        // Update local state
        setEscrow({ ...escrow, status: 'Active' });
        // Optionally navigate to a different page
        navigate(`/escrow/${id}`);
      } else {
        throw new Error(result.error || "Failed to confirm escrow");
      }
    } catch (err) {
      toast({
        title: "Confirmation Failed",
        description: err instanceof Error ? err.message : "Failed to confirm escrow. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      console.error(err);
    } finally {
      setIsConfirming(false);
    }
  };

  // Handle reject escrow
  const handleRejectEscrow = async () => {
    if (!escrow || !id) return;

    setIsRejecting(true);
    try {
      const result = await updateEscrowStatus(id, 'Rejected');
      if (result.success) {
        toast({
          title: "Escrow Rejected",
          description: "The escrow has been rejected.",
          status: "info",
          duration: 5000,
          isClosable: true,
        });
        // Update local state
        setEscrow({ ...escrow, status: 'Rejected' });
        // Optionally navigate back to escrows list
        // navigate("/escrows");
      } else {
        throw new Error(result.error || "Failed to reject escrow");
      }
    } catch (err) {
      toast({
        title: "Rejection Failed",
        description: err instanceof Error ? err.message : "Failed to reject escrow. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      console.error(err);
    } finally {
      setIsRejecting(false);
    }
  };

  // Colors
  const cardBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const labelColor = useColorModeValue("gray.600", "gray.400");

   // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  // Format address for display
  const formatAddress = (address: string) => {
    if (!address) return "Not specified";
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  // Show loading state
  if (isLoading) {
    return (
      <Center minH="400px">
        <VStack spacing={4}>
          <Spinner size="xl" />
          <Text>Loading escrow details...</Text>
        </VStack>
      </Center>
    );
  }

  // Show error state
  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        <AlertTitle>{error}</AlertTitle>
      </Alert>
    );
  }

  // Show message if no escrow found
  if (!escrow) {
    return (
      <Alert status="warning" borderRadius="md">
        <AlertIcon />
        <AlertTitle>Escrow not found</AlertTitle>
      </Alert>
    );
  }

  // Calculate total amount (now safe since escrow is guaranteed to exist)
  const totalAmount = parseFloat(escrow.totalAmount) || 0;
  const totalMilestoneAmount = escrow.milestones.reduce(
    (sum, m) => sum + (parseFloat(m.amount) || 0),
    0
  );

  // Check if escrow can be confirmed (status is pending or inactive)
  const canConfirm = escrow.status === 'pending' || escrow.status === 'inactive' || escrow.status === 'Pending' || escrow.status === 'Inactive';

  return (
    <VStack spacing={6} align="stretch">
      <Box mb={2}>
        <Text fontSize="lg" fontWeight="medium">
          Review Escrow Details
        </Text>
        <Text fontSize="sm" color="gray.500">
          Please review all details before confirm the escrow transaction
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
              <Text fontWeight="medium">{escrow.title}</Text>
            </Flex>

            <Flex width="100%" justify="space-between" alignItems="flex-start">
              <Text color={labelColor}>Description:</Text>
              <Text fontWeight="medium" textAlign="right" maxW="60%">
                {escrow.description || "No description provided"}
              </Text>
            </Flex>

            <Flex width="100%" justify="space-between">
              <Text color={labelColor}>Total Amount:</Text>
              <Text fontWeight="medium">{totalAmount.toFixed(2)} USDT</Text>
            </Flex>

            <Flex width="100%" justify="space-between">
              <Text color={labelColor}>Status:</Text>
              <Badge 
                colorScheme={
                  escrow.status === 'Active' ? 'green' : 
                  escrow.status === 'Rejected' ? 'red' : 
                  'yellow'
                }
              >
                {escrow.status}
              </Badge>
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
                <Badge colorScheme={escrow.counterpartyType !== 'client' ? "gray"  : "green"}>
                  {escrow.counterpartyType !== 'client' ? "Counterparty" : "You" }
                </Badge>
              </HStack>
              <Text fontWeight="medium">{formatAddress(escrow.userAddress)}</Text>
            </Flex>

            <Flex width="100%" justify="space-between" align="center">
              <HStack>
                <Text color={labelColor}>Worker:</Text>
                <Badge colorScheme={escrow.counterpartyType === 'worker' ? "green" : "gray"}>
                  {escrow.counterpartyType === 'worker' ? "You" : "Counterparty"}
                </Badge>
              </HStack>
              <Text fontWeight="medium">{formatAddress(escrow.counterpartyAddress)}</Text>
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
          {escrow.milestones.length > 0 ? (
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
                  {escrow.milestones.map((milestone, index) => (
                    <Tr key={index}>
                      <Td>{milestone.description}</Td>
                      <Td isNumeric>
                        {parseFloat(milestone.amount).toFixed(2)}
                      </Td>
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
                  ? `Milestone total exceeds escrow amount by ${(
                      totalMilestoneAmount - totalAmount
                    ).toFixed(2)} USDT`
                  : `Milestone total is less than escrow amount by ${(
                      totalAmount - totalMilestoneAmount
                    ).toFixed(2)} USDT`}
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
              <Text fontWeight="medium">
                {(totalAmount * 0.01).toFixed(2)} USDT (1%)
              </Text>
            </Flex>

            <Flex width="100%" justify="space-between">
              <Text color={labelColor}>Total to Deposit:</Text>
              <Text fontWeight="bold" color="green.500">
                {(totalAmount * 1.01).toFixed(2)} USDT
              </Text>
            </Flex>

            <Divider />

            <Text fontSize="sm" color="gray.500">
              By creating this escrow, you agree to the terms and conditions of
              the .escrow platform. Once created, the escrow will be immutable
              on the blockchain.
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
              {escrow.userAddress ? (
                <HStack>
                  <Badge colorScheme="green">Connected</Badge>
                  <Text fontWeight="medium">{formatAddress(escrow.userAddress)}</Text>
                </HStack>
              ) : (
                <HStack>
                  <Badge colorScheme="red">Not Connected</Badge>
                  <Text color="red.500" fontSize="sm">
                    Connect wallet to confirm escrow
                  </Text>
                </HStack>
              )}
            </Flex>

            <Divider />

            <Text fontSize="sm" color="gray.500">
              Your wallet must be connected and authorized to create an escrow
              on the blockchain.
            </Text>
          </VStack>
        </CardBody>
      </Card>

      {/* Action Buttons */}
      {canConfirm && (
        <Flex justify="space-between" mt={6}>
          <Button
            colorScheme="red"
            variant="outline"
            size="lg"
            onClick={handleRejectEscrow}
            isLoading={isRejecting}
            loadingText="Rejecting..."
            disabled={isConfirming}
            flex={1}
            mr={4}
          >
            Reject Escrow
          </Button>
          
          <Button
            colorScheme="green"
            size="lg"
            onClick={handleConfirmEscrow}
            isLoading={isConfirming}
            loadingText="Confirming..."
            disabled={isRejecting}
            flex={1}
          >
            Confirm Escrow
          </Button>
        </Flex>
      )}

      {!canConfirm && escrow.status === 'Active' && (
        <Alert status="success" borderRadius="md">
          <AlertIcon />
          <AlertTitle>This escrow is already active</AlertTitle>
        </Alert>
      )}

      {!canConfirm && escrow.status === 'Rejected' && (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <AlertTitle>This escrow has been rejected</AlertTitle>
        </Alert>
      )}
    </VStack>
  );
};

export default ConfirmDetails;