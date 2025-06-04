import { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
  Badge,
  Grid,
  GridItem,
  Card,
  CardHeader,
  CardBody,
  HStack,
  VStack,
  Button,
  Divider,
  Progress,
  Flex,
  Spinner,
  List,
  ListItem,
  IconButton,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorModeValue,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Textarea,
  FormControl,
  FormLabel,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";
import {
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle,
  FiChevronLeft,
  FiThumbsUp,
  FiFlag,
  FiCalendar,
  FiDollarSign,
  FiUser,
} from "react-icons/fi";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import { useWallet } from "../../hooks/useWalletContext";

// Define types
type EscrowStatus = any;
type MilestoneStatus = any;
type UserRole = any;

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

const EscrowDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  // Modals
  const releaseModal = useDisclosure();
  const disputeModal = useDisclosure();
  const cancelModal = useDisclosure();

  // State
  const [escrow, setEscrow] = useState<Escrow | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [userRole, setUserRole] = useState<UserRole>("none");

  // Wallet connection
  const {
    selectedAccount,
    getEscrow,
    updateEscrowMilestoneStatus,
    releaseMilestone,
    disputeMilestone,
    notifyCounterparty,
    isApiReady,
    isExtensionReady,
  } = useWallet();

  // Color mode values
  const cardBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const statBg = useColorModeValue("blue.50", "blue.900");

  // Fetch escrow data
  useEffect(() => {
    const fetchEscrow = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (isApiReady && isExtensionReady && selectedAccount) {
          // Uncomment to use real API when ready
          const result = await getEscrow(id || "");
          if (result.success) {
            setEscrow(result.escrow);
            setIsLoading(false);
          } else {
            setError(result.error || "Failed to fetch escrow");
          }
          console.log("all these are ready");
        } else {
          console.log("all these are not ready");
          toast({
            title: "Wallet not connected",
            description: "Please connect your wallet before",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          navigate("/connect");
        }
      } catch (err) {
        console.error("Error fetching escrow:", err);
        setError("Failed to fetch escrow details. Please try again later.");
        setIsLoading(false);
      }
    };

    fetchEscrow();
  }, [id, isApiReady, isExtensionReady, selectedAccount, getEscrow]);

  // Determine user role (client, worker, or none)
  useEffect(() => {
    if (escrow && selectedAccount) {
      if (
        escrow.counterpartyType === "client" &&
        escrow.counterpartyAddress === selectedAccount.address
      ) {
        setUserRole("client");
      } else if (
        escrow.counterpartyType === "client" &&
        escrow.userAddress === selectedAccount.address
      ) {
        setUserRole("worker");
      } else if (
        escrow.counterpartyType === "worker" &&
        escrow.counterpartyAddress === selectedAccount.address
      ) {
        setUserRole("worker");
      } else if (
        escrow.counterpartyType === "worker" &&
        escrow.userAddress === selectedAccount.address
      ) {
        setUserRole("client");
      } else {
        setUserRole("none");
      }
    }
  }, [escrow, selectedAccount]);

  // Handle milestone release
  const handleReleaseMilestone = async () => {
    if (!selectedMilestone) return;

    try {
      // Uncomment to use real API when ready
      const result = await releaseMilestone(
        escrow?.id || "",
        selectedMilestone.id
      );
      if (result.success) {
        const escrowId = result.escrowId;
        const notificationType = "Payment Released" as const; // Use a valid notification type
        const message = `Payment of 500 USDT has been released to your wallet.`;
        const type = "success" as const;
        const recipientAddress = result.recipientAddress;

        try {
          const notifyResult = await notifyCounterparty(
            escrowId,
            notificationType,
            recipientAddress,
            message,
            type
          );

          console.log("Notification sent:", notifyResult);
        } catch (notifyError) {
          console.warn("Failed to send notification:", notifyError);
          // Don't fail the entire process if notification fails
        }
        toast({
          title: "Milestone released",
          description: "The milestone has been successfully released",
          status: "success",
          duration: 5000,
        });
      } else {
        toast({
          title: "Release failed",
          description: result.error || "Failed to release milestone",
          status: "error",
          duration: 5000,
        });
      }

      // For development, simulate successful release
      toast({
        title: "Milestone released",
        description: "The milestone has been successfully released",
        status: "success",
        duration: 5000,
      });

      // Update local state for demonstration
      if (escrow) {
        const updatedMilestones = escrow.milestones.map((m) =>
          m.id === selectedMilestone.id
            ? {
                ...m,
                status: "Completed" as MilestoneStatus,
                completionDate: new Date(),
              }
            : m
        );

        setEscrow({
          ...escrow,
          milestones: updatedMilestones,
        });
      }

      releaseModal.onClose();
    } catch (err) {
      console.error("Error releasing milestone:", err);
      toast({
        title: "Release failed",
        description: "An error occurred while trying to release the milestone",
        status: "error",
        duration: 5000,
      });
    }
  };

  const handleCompleteMilestone = async (milestone: any) => {
    console.log("triggered");
    if (!selectedMilestone) return;
    console.log("further more");

    try {
      const result = await updateEscrowMilestoneStatus(
        id!,
        milestone,
        "Completed"
      );
      if (result.success) {
        const escrowId = result.escrow.id;
        const notificationType = "Milestone Ready for Review" as const; // Use a valid notification type
        const message = `A Milestone has been completed and ready for review.`;
        const type = "info" as const;
        const recipientAddress = result.escrow.userAddress;

        try {
          const notifyResult = await notifyCounterparty(
            escrowId,
            notificationType,
            recipientAddress,
            message,
            type
          );

          console.log("Notification sent:", notifyResult);
        } catch (notifyError) {
          console.warn("Failed to send notification:", notifyError);
          // Don't fail the entire process if notification fails
        }

        if (escrow) {
          const updatedMilestones = escrow.milestones.map((m) =>
            m.id === selectedMilestone.id
              ? {
                  ...m,
                  status: "Completed" as MilestoneStatus,
                  completionDate: new Date(),
                }
              : m
          );

          toast({
            title: "Milestone completed",
            description: "This milestone has been completed successfully",
            status: "success",
            duration: 5000,
          });

          setEscrow({
            ...escrow,
            milestones: updatedMilestones,
          });
        }
      } else {
        throw new Error(result.error || "Failed to confirm escrow");
      }
    } catch (error) {}
  };

  // Handle milestone dispute
  const handleDisputeMilestone = async () => {
    if (!selectedMilestone) return;

    try {
      // Uncomment to use real API when ready
      const result = await disputeMilestone(escrow?.id || '', selectedMilestone.id, disputeReason);
      if (result.success) {
        toast({
          title: 'Dispute filed',
          description: 'The milestone has been marked as disputed',
          status: 'info',
          duration: 5000,
        });
      } else {
        toast({
          title: 'Dispute failed',
          description: result.error || 'Failed to dispute milestone',
          status: 'error',
          duration: 5000,
        });
      }

    

      // Update local state for demonstration
      if (escrow) {
        const updatedMilestones = escrow.milestones.map((m) =>
          m.id === selectedMilestone.id
            ? { ...m, status: "Disputed" as MilestoneStatus }
            : m
        );

        setEscrow({
          ...escrow,
          milestones: updatedMilestones,
        });
      }

      disputeModal.onClose();
      setDisputeReason("");
    } catch (err) {
      console.error("Error disputing milestone:", err);
      toast({
        title: "Dispute failed",
        description: "An error occurred while trying to dispute the milestone",
        status: "error",
        duration: 5000,
      });
    }
  };

  // Handle escrow cancellation
  const handleCancelEscrow = async () => {
    try {
      // Simulate successful cancellation for development
      toast({
        title: "Escrow cancelled",
        description: "The escrow has been cancelled successfully",
        status: "info",
        duration: 5000,
      });

      // Update local state for demonstration
      if (escrow) {
        setEscrow({
          ...escrow,
          status: "Cancelled" as EscrowStatus,
        });
      }

      cancelModal.onClose();
      setCancelReason("");
    } catch (err) {
      console.error("Error cancelling escrow:", err);
      toast({
        title: "Cancellation failed",
        description: "An error occurred while trying to cancel the escrow",
        status: "error",
        duration: 5000,
      });
    }
  };

  const handleStartMilestone = async (milestone: any) => {
    if (!milestone) return;

    try {
      const result = await updateEscrowMilestoneStatus(
        id!,
        milestone,
        "InProgress"
      );
      if (result.success) {
        toast({
          title: "Escrow milestone updated",
          description: "The escrow milestone has started.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        // Update local state
        if (escrow) {
          const updatedMilestones = escrow.milestones.map((m) =>
            m.id === milestone.id
              ? { ...m, status: "InProgress" as MilestoneStatus }
              : m
          );

          setEscrow({
            ...escrow,
            milestones: updatedMilestones,
          });
        }
      } else {
        throw new Error(result.error || "Failed to confirm escrow");
      }
    } catch (error) {}
  };

  // Calculate progress
  const calculateProgress = () => {
    if (!escrow) return 0;

    const totalMilestones = escrow.milestones.length;
    const completedMilestones = escrow.milestones.filter(
      (m) => m.status === "Completed"
    ).length;

    return (completedMilestones / totalMilestones) * 100;
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  // Format address
  const formatAddress = (address: string) => {
    if (address.length < 10) return address;
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  // Get status badge
  const getStatusBadge = (status: EscrowStatus | MilestoneStatus) => {
    switch (status) {
      case "Active":
        return (
          <Badge colorScheme="blue" display="flex" alignItems="center">
            <FiClock style={{ marginRight: "4px" }} /> Active
          </Badge>
        );
      case "Inactive":
        return (
          <Badge colorScheme="gray" display="flex" alignItems="center">
            <FiClock style={{ marginRight: "4px" }} /> Inactive
          </Badge>
        );
      case "InProgress":
        return (
          <Badge colorScheme="yellow" display="flex" alignItems="center">
            <FiClock style={{ marginRight: "4px" }} /> In Progress
          </Badge>
        );
      case "Completed":
        return (
          <Badge colorScheme="green" display="flex" alignItems="center">
            <FiCheckCircle style={{ marginRight: "4px" }} /> Completed
          </Badge>
        );
      case "Disputed":
        return (
          <Badge colorScheme="orange" display="flex" alignItems="center">
            <FiAlertTriangle style={{ marginRight: "4px" }} /> Disputed
          </Badge>
        );
      case "Cancelled":
        return (
          <Badge colorScheme="red" display="flex" alignItems="center">
            <FiXCircle style={{ marginRight: "4px" }} /> Cancelled
          </Badge>
        );
      case "Pending":
        return (
          <Badge colorScheme="gray" display="flex" alignItems="center">
            <FiClock style={{ marginRight: "4px" }} /> Pending
          </Badge>
        );
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  // Determine if release is allowed
  const canReleaseMilestone = (milestone: Milestone) => {
    if (userRole !== "client") return false;
    if (milestone.status !== "Completed") return false;
    if (escrow?.status !== "Active") return false;
    return true;
  };

  // Determine if complete is allowed
  const canCompleteMilestone = (milestone: Milestone) => {
    if (userRole !== "worker") return false;
    if (milestone.status !== "InProgress") return false;
    if (escrow?.status !== "Active") return false;
    return true;
  };

  // Determine if dispute is allowed
  const canDisputeMilestone = (milestone: Milestone) => {
    if (userRole === "none") return false;
    if (milestone.status !== "Completed") return false;
    if (escrow?.status !== "Active") return false;
    return true;
  };
  // Determine if escrow can start is allowed
  const canStartMilestone = (milestone: Milestone) => {
    if (userRole === "none") return false;
    if (milestone.status !== "Pending") return false;
    if (escrow?.status !== "Active") return false;
    return true;
  };

  // Loading state
  if (isLoading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading escrow details...</Text>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box>
        <Heading size="lg" mb={4}>
          Escrow Details
        </Heading>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <AlertTitle>Error loading escrow</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Box>
    );
  }

  // No escrow found
  if (!escrow) {
    return (
      <Box>
        <Heading size="lg" mb={4}>
          Escrow Details
        </Heading>
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          <AlertTitle>Escrow not found</AlertTitle>
          <AlertDescription>
            The requested escrow could not be found
          </AlertDescription>
        </Alert>
        <Button
          as={RouterLink}
          to="/transactions"
          leftIcon={<FiChevronLeft />}
          mt={4}
        >
          Back to Transactions
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Flex justifyContent="space-between" alignItems="flex-start" mb={6}>
        <Box>
          <Button
            as={RouterLink}
            to="/transactions"
            leftIcon={<FiChevronLeft />}
            variant="outline"
            mb={3}
            size="sm"
          >
            Back to Transactions
          </Button>
          <Heading size="lg">{escrow.title}</Heading>
          <HStack mt={2}>
            <Text>ID: {escrow.id}</Text>
            {getStatusBadge(escrow.status)}
          </HStack>
        </Box>

        {/* Actions */}
        {escrow.status === "Active" && (
          <HStack spacing={2}>
            {/* Cancel Escrow Button - available to both parties */}
            {(userRole === "client" || userRole === "worker") && (
              <Button
                colorScheme="red"
                variant="outline"
                size="sm"
                leftIcon={<FiXCircle />}
                onClick={() => {
                  setCancelReason("");
                  cancelModal.onOpen();
                }}
              >
                Cancel Escrow
              </Button>
            )}
          </HStack>
        )}
      </Flex>

      {/* Main content grid */}
      <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={6}>
        {/* Details and Milestones */}
        <GridItem>
          {/* Escrow Details Card */}
          <Card mb={6} variant="outline" bg={cardBg}>
            <CardHeader pb={2}>
              <Heading size="md">Escrow Details</Heading>
            </CardHeader>
            <CardBody>
              <Text mb={4}>{escrow.description}</Text>

              {/* Progress Bar */}
              <Box mb={4}>
                <HStack justify="space-between" mb={1}>
                  <Text fontSize="sm" fontWeight="medium">
                    Overall Progress
                  </Text>
                  <Text fontSize="sm">{Math.round(calculateProgress())}%</Text>
                </HStack>
                <Progress
                  value={calculateProgress()}
                  colorScheme={escrow.status === "Cancelled" ? "red" : "blue"}
                  borderRadius="md"
                  size="sm"
                />
              </Box>

              <Divider my={4} />

              {/* Key Details */}
              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                <GridItem>
                  <VStack align="start" spacing={3}>
                    <HStack>
                      <FiCalendar />
                      <Text fontWeight="medium">Created:</Text>
                      <Text>{formatDate(escrow.createdAt)}</Text>
                    </HStack>
                    <HStack>
                      <FiDollarSign />
                      <Text fontWeight="medium">Total Amount:</Text>
                      <Text>{escrow.totalAmount} USDT</Text>
                    </HStack>
                  </VStack>
                </GridItem>
                <GridItem>
                  <VStack align="start" spacing={3}>
                    <HStack>
                      <FiUser />
                      <Text fontWeight="medium">Client:</Text>
                      <Text>{formatAddress(escrow.userAddress)}</Text>
                    </HStack>
                    <HStack>
                      <FiUser />
                      <Text fontWeight="medium">Worker:</Text>
                      <Text>{formatAddress(escrow.counterpartyAddress)}</Text>
                    </HStack>
                  </VStack>
                </GridItem>
              </Grid>
            </CardBody>
          </Card>

          {/* Milestones Card */}
          <Card variant="outline" bg={cardBg}>
            <CardHeader pb={2}>
              <Heading size="md">Milestones</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                {escrow.milestones.map((milestone, index) => (
                  <Card
                    key={milestone.id}
                    variant="outline"
                    borderColor={
                      milestone.status === "Active" ? "blue.500" : borderColor
                    }
                    _hover={{
                      boxShadow: "md",
                      borderColor:
                        milestone.status === "Active" ? "blue.500" : "gray.300",
                    }}
                    transition="all 0.2s"
                  >
                    <CardBody>
                      <Flex justifyContent="space-between" mb={3}>
                        <VStack align="start" spacing={1}>
                          <HStack>
                            <Text fontWeight="medium">
                              Milestone {index + 1}:
                            </Text>
                            {getStatusBadge(milestone.status)}
                          </HStack>
                          <Text>{milestone.description}</Text>
                        </VStack>
                        <Text fontWeight="bold">{milestone.amount} USDT</Text>
                      </Flex>

                      <Flex justifyContent="space-between" alignItems="center">
                        <HStack>
                          <FiCalendar size={14} />
                          <Text fontSize="sm">
                            {milestone.status === "Completed"
                              ? `Completed: ${formatDate(
                                  milestone.completionDate!
                                )}`
                              : `Deadline: ${formatDate(milestone.deadline)}`}
                          </Text>
                        </HStack>

                        {/* Milestone Actions */}
                        <HStack spacing={2}>
                          {/* Release Button - only for client and active milestones */}
                          {canReleaseMilestone(milestone) && (
                            <Button
                              size="xs"
                              colorScheme="green"
                              leftIcon={<FiThumbsUp />}
                              onClick={() => {
                                setSelectedMilestone(milestone);
                                releaseModal.onOpen();
                              }}
                            >
                              Release
                            </Button>
                          )}
                          {/* Complete Button - for worker alone to verify milestone */}
                          {canCompleteMilestone(milestone) && (
                            <Button
                              size="xs"
                              colorScheme="green"
                              leftIcon={<FiThumbsUp />}
                              onClick={() => {
                                setSelectedMilestone(milestone);
                                handleCompleteMilestone(milestone);
                              }}
                            >
                              Complete
                            </Button>
                          )}

                          {/* Dispute Button - for both parties and active milestones */}
                          {canDisputeMilestone(milestone) && (
                            <Button
                              size="xs"
                              colorScheme="orange"
                              variant="outline"
                              leftIcon={<FiFlag />}
                              onClick={() => {
                                setSelectedMilestone(milestone);
                                disputeModal.onOpen();
                              }}
                            >
                              Dispute
                            </Button>
                          )}
                          {/* Start Button - for both parties to start mileston when escrow status is active */}
                          {canStartMilestone(milestone) && (
                            <Button
                              size="xs"
                              colorScheme="orange"
                              variant="outline"
                              leftIcon={<FiThumbsUp />}
                              onClick={() => handleStartMilestone(milestone)}
                            >
                              Start milestone
                            </Button>
                          )}
                        </HStack>
                      </Flex>
                    </CardBody>
                  </Card>
                ))}
              </VStack>
            </CardBody>
          </Card>
        </GridItem>

        {/* Sidebar */}
        <GridItem>
          {/* Your Role Card */}
          <Card mb={6} variant="outline" bg={cardBg}>
            <CardHeader pb={2}>
              <Heading size="md">Your Role</Heading>
            </CardHeader>
            <CardBody>
              {userRole === "client" && (
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>You are the Client</AlertTitle>
                    <AlertDescription>
                      You can release milestone payments when work is complete
                    </AlertDescription>
                  </Box>
                </Alert>
              )}

              {userRole === "worker" && (
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>You are the Worker</AlertTitle>
                    <AlertDescription>
                      Complete the milestones to receive payment
                    </AlertDescription>
                  </Box>
                </Alert>
              )}

              {userRole === "none" && (
                <Alert status="warning" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>You are not a party to this escrow</AlertTitle>
                    <AlertDescription>
                      You can view details but cannot perform actions
                    </AlertDescription>
                  </Box>
                </Alert>
              )}
            </CardBody>
          </Card>

          {/* Summary Card */}
          <Card mb={6} variant="outline" bg={cardBg}>
            <CardHeader pb={2}>
              <Heading size="md">Escrow Summary</Heading>
            </CardHeader>
            <CardBody>
              <Grid templateColumns="1fr 1fr" gap={4}>
                <GridItem>
                  <Stat bg={statBg} p={3} borderRadius="md">
                    <StatLabel>Total Amount</StatLabel>
                    <StatNumber>{escrow.totalAmount} USDT</StatNumber>
                    <StatHelpText>Locked in escrow</StatHelpText>
                  </Stat>
                </GridItem>
                <GridItem>
                  <Stat bg={statBg} p={3} borderRadius="md">
                    <StatLabel>Milestones</StatLabel>
                    <StatNumber>{escrow.milestones.length}</StatNumber>
                    <StatHelpText>
                      {
                        escrow.milestones.filter(
                          (m) => m.status === "Completed"
                        ).length
                      }{" "}
                      completed
                    </StatHelpText>
                  </Stat>
                </GridItem>
              </Grid>

              <Divider my={4} />

              <VStack align="start" spacing={3}>
                <Heading size="sm">Timeline</Heading>
                <Box w="100%">
                  <List spacing={2}>
                    <ListItem fontSize="sm">
                      <HStack>
                        <FiCalendar size={14} />
                        <Text fontWeight="medium">Created:</Text>
                        <Text>{formatDate(escrow.createdAt)}</Text>
                      </HStack>
                    </ListItem>
                    {escrow.milestones
                      .filter((m) => m.status === "Completed")
                      .map((m) => (
                        <ListItem key={m.id} fontSize="sm">
                          <HStack>
                            <FiCheckCircle size={14} color="green" />
                            <Text fontWeight="medium">
                              Milestone Completed:
                            </Text>
                            <Text>{formatDate(m.completionDate!)}</Text>
                          </HStack>
                        </ListItem>
                      ))}
                    {escrow.status === "cancelled" && (
                      <ListItem fontSize="sm">
                        <HStack>
                          <FiXCircle size={14} color="red" />
                          <Text fontWeight="medium">Cancelled:</Text>
                          <Text>Date not available</Text>
                        </HStack>
                      </ListItem>
                    )}
                  </List>
                </Box>
              </VStack>
            </CardBody>
          </Card>

          {/* Next Steps Card */}
          {escrow.status === "Active" && (
            <Card variant="outline" bg={cardBg}>
              <CardHeader pb={2}>
                <Heading size="md">Next Steps</Heading>
              </CardHeader>
              <CardBody>
                {userRole === "client" &&
                  escrow.milestones.some((m) => m.status === "Complete") && (
                    <VStack align="start" spacing={3}>
                      <Text>
                        Review completed work and release payment for active
                        milestones.
                      </Text>
                      <Button
                        colorScheme="green"
                        size="sm"
                        leftIcon={<FiThumbsUp />}
                        onClick={() => {
                          const activeMilestone = escrow.milestones.find(
                            (m) => m.status === "Complete"
                          );
                          if (activeMilestone) {
                            setSelectedMilestone(activeMilestone);
                            releaseModal.onOpen();
                          }
                        }}
                      >
                        Release Active Milestone
                      </Button>
                    </VStack>
                  )}

                {userRole === "worker" &&
                  escrow.milestones.some((m) => m.status === "InProgress") && (
                    <VStack align="start" spacing={3}>
                      <Text>
                        Complete the active milestone and wait for the client to
                        release payment.
                      </Text>
                      <Text fontSize="sm">
                        Current active milestone:{" "}
                        {
                          escrow.milestones.find(
                            (m) => m.status === "InProgress"
                          )?.description
                        }
                      </Text>
                    </VStack>
                  )}

                {userRole === "none" && (
                  <Text>
                    You are viewing this escrow as a third party and cannot
                    perform actions.
                  </Text>
                )}

                {!escrow.milestones.some((m) => m.status === "InProgress") &&
                  userRole !== "none" && (
                    <Text>
                      All milestones are either completed or pending. No actions
                      required at this time.
                    </Text>
                  )}
              </CardBody>
            </Card>
          )}
        </GridItem>
      </Grid>

      {/* Release Milestone Modal */}
      <Modal isOpen={releaseModal.isOpen} onClose={releaseModal.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Release Milestone Payment</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="start" spacing={3}>
              <Text>
                You are about to release payment for the following milestone:
              </Text>
              <Box p={4} bg="gray.50" borderRadius="md" w="100%">
                <Text fontWeight="medium">
                  {selectedMilestone?.description}
                </Text>
                <Text mt={1}>Amount: {selectedMilestone?.amount} USDT</Text>
              </Box>
              <Alert status="info">
                <AlertIcon />
                <Text fontSize="sm">
                  By releasing this milestone, you confirm that the work has
                  been completed satisfactorily. The funds will be transferred
                  to the worker immediately and cannot be reversed.
                </Text>
              </Alert>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={releaseModal.onClose}>
              Cancel
            </Button>
            <Button colorScheme="green" onClick={handleReleaseMilestone}>
              Confirm Release
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Dispute Milestone Modal */}
      <Modal isOpen={disputeModal.isOpen} onClose={disputeModal.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Dispute Milestone</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="start" spacing={3}>
              <Text>You are disputing the following milestone:</Text>
              <Box p={4} bg="gray.50" borderRadius="md" w="100%">
                <Text fontWeight="medium">
                  {selectedMilestone?.description}
                </Text>
                <Text mt={1}>Amount: {selectedMilestone?.amount} USDT</Text>
              </Box>
              <FormControl isRequired>
                <FormLabel>Reason for dispute:</FormLabel>
                <Textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Please explain why you are disputing this milestone..."
                  rows={4}
                />
              </FormControl>
              <Alert status="warning">
                <AlertIcon />
                <Text fontSize="sm">
                  Disputes will be reviewed according to the platform's dispute
                  resolution process. Please provide clear details to help
                  resolve the issue.
                </Text>
              </Alert>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={disputeModal.onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="orange"
              onClick={handleDisputeMilestone}
              isDisabled={!disputeReason.trim()}
            >
              Submit Dispute
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Cancel Escrow Modal */}
      <Modal isOpen={cancelModal.isOpen} onClose={cancelModal.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Cancel Escrow</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="start" spacing={3}>
              <Text>You are about to cancel the entire escrow:</Text>
              <Box p={4} bg="gray.50" borderRadius="md" w="100%">
                <Text fontWeight="medium">{escrow.title}</Text>
                <Text mt={1}>Total Amount: {escrow.totalAmount} USDT</Text>
              </Box>
              <FormControl isRequired>
                <FormLabel>Reason for cancellation:</FormLabel>
                <Textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please explain why you are cancelling this escrow..."
                  rows={4}
                />
              </FormControl>
              <Alert status="error">
                <AlertIcon />
                <Text fontSize="sm">
                  Cancelling an escrow requires mutual agreement from both
                  parties. The other party will need to confirm the cancellation
                  before funds are returned.
                </Text>
              </Alert>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={cancelModal.onClose}>
              Back
            </Button>
            <Button
              colorScheme="red"
              onClick={handleCancelEscrow}
              isDisabled={!cancelReason.trim()}
            >
              Request Cancellation
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default EscrowDetails;
