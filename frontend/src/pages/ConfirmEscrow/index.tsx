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
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalCloseButton,
  ModalBody,
  ModalHeader,
  ModalContent,
  ModalFooter,
  Icon,
  AlertDescription,
} from "@chakra-ui/react";
import { FiCheckCircle } from "react-icons/fi";
import { useWallet } from "../../hooks/useWalletContext";
import { usePSP22StablecoinContract } from "@/hooks/usePSP22StablecoinContract";
import PSP22StablecoinApproval from "@/components/PSP22StableCoinBalance/PSP22StablecoinApproval";

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

type ApprovalState =
  | "idle"
  | "checking"
  | "needed"
  | "approving"
  | "approved"
  | "confirming";

const ConfirmDetails = () => {
  const {
    isExtensionReady,
    selectedAccount,
    getEscrow,
    updateEscrowStatus,
    checkTransactionStatus,
  } = useWallet();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const toast = useToast();

  const [escrow, setEscrow] = useState<Escrow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  // Payment flow state
  const [approvalState, setApprovalState] = useState<ApprovalState>("idle");

  // Modal state
  const {
    isOpen: isModalOpen,
    onOpen: openModal,
    onClose: closeModal,
  } = useDisclosure();

  // USDC contract hook
  const {
    balance,
    allowance,
    checkSufficientBalance,
    checkSufficientAllowance,
    transferToken,
    ESCROW_CONTRACT_ADDRESS,
    isLoading: usdcLoading,
    error: usdcError,
  } = usePSP22StablecoinContract();

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
          const escrowDetail = result.escrow;
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

  // Check if client needs to pay (worker created the escrow)
  const isClientConfirming = escrow?.counterpartyType === "client";

  // USDC Transfer function
  const executeUSDCTransfer = async (amount: string, userAddress: string) => {
    if (!selectedAccount?.address) {
      throw new Error("Account not available");
    }

    try {
      console.log("[executeUSDCTransfer] Starting USDC transfer:", {
        amount,
        from: userAddress,
        to: ESCROW_CONTRACT_ADDRESS,
      });

      // Check if user has sufficient balance
      if (!checkSufficientBalance(amount)) {
        throw new Error(`Insufficient USDC balance. Required: ${amount} USDC`);
      }

      // Use the transferToken function from the USDC hook
      const transferResult = await transferToken(
        ESCROW_CONTRACT_ADDRESS,
        amount
      );

      if (!transferResult.success) {
        throw new Error(transferResult.error || "USDC transfer failed");
      }

      // Generate a transaction hash (in real implementation, this would come from the blockchain)
      const txHash = `0x${Date.now().toString(16)}${Math.random()
        .toString(16)
        .slice(2, 10)}`;

      console.log("[executeUSDCTransfer] USDC transfer successful:", txHash);
      return { success: true, txHash };
    } catch (error) {
      console.error(
        "[executeUSDCTransfer] Error executing USDC transfer:",
        error
      );

      // Re-throw with more specific error messages
      if (error instanceof Error) {
        if (error.message.includes("Insufficient")) {
          throw new Error(
            `Insufficient USDC balance. Required: ${amount} USDC`
          );
        } else if (
          error.message.includes("rejected") ||
          error.message.includes("cancelled")
        ) {
          throw new Error("Transaction was cancelled by user");
        } else {
          throw error;
        }
      }

      throw new Error("Failed to execute USDC transfer");
    }
  };

  // Check approval status for payment
  const checkApprovalStatus = async () => {
    if (!escrow || !isClientConfirming || approvalState === "checking") return;

    setApprovalState("checking");

    try {
      // Calculate amount with 1% markup
      const adjustedAmount = (Number(escrow.totalAmount) * 1.01).toString();

      const hasBalance = checkSufficientBalance(adjustedAmount);
      const hasAllowance = checkSufficientAllowance(adjustedAmount);

      if (!hasBalance) {
        throw new Error(
          `Insufficient USDC balance. Required: ${adjustedAmount} USDC`
        );
      }

      if (hasAllowance) {
        setApprovalState("approved");
      } else {
        setApprovalState("needed");
      }
    } catch (error) {
      toast({
        title: "Balance Check Failed",
        description:
          error instanceof Error ? error.message : "Failed to check balance",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setApprovalState("idle");
    }
  };

  // Handle confirm escrow with payment logic
  const handleConfirmEscrow = async () => {
    if (!escrow || !id) return;

    // If client is confirming (worker created escrow), show payment modal
    if (isClientConfirming) {
      openModal();
      checkApprovalStatus();
      return;
    }

    // For non-payment confirmations (worker confirming client's escrow)
    setIsConfirming(true);
    try {
      const result = await updateEscrowStatus(id, "Active");
      if (result.success) {
        toast({
          title: "Escrow Confirmed",
          description: "The escrow has been successfully activated.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        setEscrow({ ...escrow, status: "Active" });
        navigate(`/escrow/${id}`);
      } else {
        throw new Error(result.error || "Failed to confirm escrow");
      }
    } catch (err) {
      toast({
        title: "Confirmation Failed",
        description:
          err instanceof Error
            ? err.message
            : "Failed to confirm escrow. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      console.error(err);
    } finally {
      setIsConfirming(false);
    }
  };

  // Handle confirm with payment
  const handleConfirmWithPayment = async () => {
    if (!escrow || !id || !selectedAccount) return;

    setIsConfirming(true);
    setApprovalState("confirming");

    try {
      const userAddress = selectedAccount.address;

      // Calculate amount with 1% markup
      const adjustedAmount = (Number(escrow.totalAmount) * 1.01).toString();

      // Execute USDC transfer
      const executeTransaction = await executeUSDCTransfer(
        adjustedAmount,
        userAddress
      );

      if (executeTransaction.success) {
        const transactionHash = await checkTransactionStatus(
          executeTransaction.txHash
        );

        if (transactionHash.success === true) {
          // Update escrow status to Active
          const result = await updateEscrowStatus(
            id,
            "Active",
            executeTransaction.txHash
          );

          if (result.success) {
            toast({
              title: "Escrow Confirmed and Funded",
              description: `Escrow funded with ${escrow.totalAmount} USDC. Worker can now start work.`,
              status: "success",
              duration: 5000,
              isClosable: true,
            });

            setEscrow({ ...escrow, status: "Active" });
            closeModal();
            navigate(`/escrow/${id}`);
          } else {
            throw new Error(result.error || "Failed to update escrow status");
          }
        } else {
          throw new Error("Transaction failed");
        }
      }
    } catch (error) {
      console.error("Error confirming escrow with payment:", error);
      toast({
        title: "Confirmation Failed",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setApprovalState("approved"); // Reset to approved state
    } finally {
      setIsConfirming(false);
    }
  };

  // Handle reject escrow
  const handleRejectEscrow = async () => {
    if (!escrow || !id) return;

    setIsRejecting(true);
    try {
      const result = await updateEscrowStatus(id, "Rejected");
      if (result.success) {
        toast({
          title: "Escrow Rejected",
          description: "The escrow has been rejected.",
          status: "info",
          duration: 5000,
          isClosable: true,
        });
        setEscrow({ ...escrow, status: "Rejected" });
      } else {
        throw new Error(result.error || "Failed to reject escrow");
      }
    } catch (err) {
      toast({
        title: "Rejection Failed",
        description:
          err instanceof Error
            ? err.message
            : "Failed to reject escrow. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      console.error(err);
    } finally {
      setIsRejecting(false);
    }
  };

  // Approval handlers
  const handleApprovalStart = () => {
    setApprovalState("approving");
    toast({
      title: "Approval Transaction Started",
      description: "Please confirm the transaction in your wallet",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  const handleApprovalComplete = () => {
    setApprovalState("approved");
    toast({
      title: "USDC Approval Complete",
      description: "You can now fund the escrow contract",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const handleApprovalError = () => {
    setApprovalState("needed");
    toast({
      title: "Approval Failed",
      status: "error",
      duration: 5000,
      isClosable: true,
    });
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

  // Modal content rendering
  const renderModalContent = () => {
    if (!escrow) return null;

    switch (approvalState) {
      case "checking":
        return (
          <VStack spacing={4} py={8}>
            <Spinner size="lg" />
            <Text>Checking USDC balance and allowance...</Text>
          </VStack>
        );

      case "needed":
        return (
          <VStack align="start" spacing={4}>
            <Text color="gray.600">
              You need to approve the contract to spend your USDC tokens to fund
              this escrow.
            </Text>

            {balance && (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Box>
                  <Text fontWeight="medium">Your USDC Balance</Text>
                  <Text fontSize="sm">{balance.formatted} USDC</Text>
                </Box>
              </Alert>
            )}

            <PSP22StablecoinApproval
              requiredAmount={escrow.totalAmount}
              onApprovalComplete={handleApprovalComplete}
              onApprovalStart={handleApprovalStart}
              onError={handleApprovalError}
              showBalance={true}
            />

            {usdcError && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle>USDC Error</AlertTitle>
                  <AlertDescription>{usdcError}</AlertDescription>
                </Box>
              </Alert>
            )}
          </VStack>
        );

      case "approving":
        return (
          <VStack spacing={4} py={8}>
            <Spinner size="lg" />
            <Text>Approving USDC spending...</Text>
            <Text fontSize="sm" color="gray.600">
              Please confirm the transaction in your wallet
            </Text>
          </VStack>
        );

      case "approved":
        return (
          <VStack align="start" spacing={4}>
            <Alert status="success" borderRadius="md">
              <AlertIcon as={FiCheckCircle} />
              <Box>
                <AlertTitle>Ready to Fund Escrow!</AlertTitle>
                <AlertDescription>
                  USDC approval complete. Funds will be deposited to the escrow
                  contract.
                </AlertDescription>
              </Box>
            </Alert>

            <Card variant="outline" w="full">
              <CardBody>
                <VStack align="start" spacing={2}>
                  <Flex justify="space-between" w="full">
                    <Text>Escrow Amount:</Text>
                    <Text fontWeight="bold">{escrow.totalAmount} USDC</Text>
                  </Flex>
                  <Flex justify="space-between" w="full">
                    <Text>Platform Fee (1%):</Text>
                    <Text fontWeight="bold">
                      {(Number(escrow.totalAmount) * 0.01).toFixed(2)} USDC
                    </Text>
                  </Flex>
                  <Flex justify="space-between" w="full">
                    <Text>Total to Pay:</Text>
                    <Text fontWeight="bold" color="green.500">
                      {(Number(escrow.totalAmount) * 1.01).toFixed(2)} USDC
                    </Text>
                  </Flex>
                  <Flex justify="space-between" w="full">
                    <Text>Worker:</Text>
                    <Text fontFamily="mono" fontSize="sm">
                      {escrow.counterpartyAddress.slice(0, 8)}...
                      {escrow.counterpartyAddress.slice(-8)}
                    </Text>
                  </Flex>
                  <Flex justify="space-between" w="full">
                    <Text>USDC Approval:</Text>
                    <Text color="green.500" fontWeight="bold">
                      ✓ Complete
                    </Text>
                  </Flex>
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        );

      case "confirming":
        return (
          <VStack spacing={4} py={8}>
            <Spinner size="lg" />
            <Text>Confirming and funding escrow contract...</Text>
            <Text fontSize="sm" color="gray.600">
              Please wait while we transfer funds and activate the escrow
            </Text>
          </VStack>
        );

      default:
        return (
          <VStack spacing={4} py={8}>
            <Text>Initializing...</Text>
          </VStack>
        );
    }
  };

  const getModalTitle = () => {
    switch (approvalState) {
      case "checking":
        return "Checking Requirements";
      case "needed":
        return "Approve USDC Spending";
      case "approving":
        return "Approving USDC";
      case "approved":
        return "Fund Escrow";
      case "confirming":
        return "Confirming Escrow";
      default:
        return "Confirm Escrow";
    }
  };

  const getModalButtons = () => {
    switch (approvalState) {
      case "needed":
      case "approving":
        return (
          <Button
            variant="outline"
            onClick={closeModal}
            isDisabled={approvalState === "approving"}
          >
            Cancel
          </Button>
        );

      case "approved":
        return (
          <Flex justify="space-between" mt={4} gap={3}>
            <Button variant="outline" onClick={closeModal}>
              Back
            </Button>
            <Button
              colorScheme="green"
              onClick={handleConfirmWithPayment}
              isLoading={isConfirming}
              loadingText="Funding..."
              leftIcon={<Icon as={FiCheckCircle} />}
            >
              Fund Escrow
            </Button>
          </Flex>
        );

      default:
        return (
          <Button variant="outline" onClick={closeModal}>
            Close
          </Button>
        );
    }
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
  const canConfirm =
    escrow.status === "pending" ||
    escrow.status === "inactive" ||
    escrow.status === "Pending" ||
    escrow.status === "Inactive";

  return (
    <VStack spacing={6} align="stretch">
      <Box mb={2}>
        <Text fontSize="lg" fontWeight="medium">
          Review Escrow Details
        </Text>
        <Text fontSize="sm" color="gray.500">
          Please review all details before{" "}
          {isClientConfirming ? "funding" : "confirming"} the escrow transaction
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
                  escrow.status === "Active"
                    ? "green"
                    : escrow.status === "Rejected"
                    ? "red"
                    : "yellow"
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
                <Badge
                  colorScheme={
                    escrow.counterpartyType !== "client" ? "gray" : "green"
                  }
                >
                  {escrow.counterpartyType !== "client"
                    ? "Counterparty"
                    : "You"}
                </Badge>
              </HStack>
              <Text fontWeight="medium">
                {formatAddress(escrow.userAddress)}
              </Text>
            </Flex>

            <Flex width="100%" justify="space-between" align="center">
              <HStack>
                <Text color={labelColor}>Worker:</Text>
                <Badge
                  colorScheme={
                    escrow.counterpartyType === "worker" ? "green" : "gray"
                  }
                >
                  {escrow.counterpartyType === "worker"
                    ? "You"
                    : "Counterparty"}
                </Badge>
              </HStack>
              <Text fontWeight="medium">
                {formatAddress(escrow.counterpartyAddress)}
              </Text>
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

            {isClientConfirming && (
              <Flex width="100%" justify="space-between">
                <Text color={labelColor}>Total to Pay:</Text>
                <Text fontWeight="bold" color="green.500">
                  {(totalAmount * 1.01).toFixed(2)} USDT
                </Text>
              </Flex>
            )}

            <Divider />

            <Text fontSize="sm" color="gray.500">
              By {isClientConfirming ? "funding" : "confirming"} this escrow,
              you agree to the terms and conditions of the .escrow platform.
              Once {isClientConfirming ? "funded" : "confirmed"}, the escrow
              will be active on the blockchain.
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
                  <Text fontWeight="medium">
                    {formatAddress(escrow.userAddress)}
                  </Text>
                </HStack>
              ) : (
                <HStack>
                  <Badge colorScheme="red">Not Connected</Badge>
                  <Text color="red.500" fontSize="sm">
                    Connect wallet to {isClientConfirming ? "fund" : "confirm"}{" "}
                    escrow
                  </Text>
                </HStack>
              )}
            </Flex>

            <Divider />

            <Text fontSize="sm" color="gray.500">
              Your wallet must be connected and authorized to{" "}
              {isClientConfirming ? "fund" : "confirm"} an escrow on the
              blockchain.
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
            loadingText={isClientConfirming ? "Processing..." : "Confirming..."}
            disabled={isRejecting}
            flex={1}
          >
            {isClientConfirming ? "Fund Escrow" : "Confirm Escrow"}
          </Button>
        </Flex>
      )}

      {!canConfirm && escrow.status === "Active" && (
        <Alert status="success" borderRadius="md">
          <AlertIcon />
          <AlertTitle>This escrow is already active</AlertTitle>
        </Alert>
      )}

      {!canConfirm && escrow.status === "Rejected" && (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <AlertTitle>This escrow has been rejected</AlertTitle>
        </Alert>
      )}

      {/* Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        closeOnOverlayClick={approvalState !== "confirming"}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{getModalTitle()}</ModalHeader>
          {approvalState !== "confirming" && <ModalCloseButton />}

          <ModalBody>{renderModalContent()}</ModalBody>
          <ModalFooter>{getModalButtons()}</ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default ConfirmDetails;
