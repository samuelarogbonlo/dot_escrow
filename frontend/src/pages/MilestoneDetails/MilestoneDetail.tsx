import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  Badge,
  Button,
  VStack,
  HStack,
  Divider,
  Card,
  CardBody,
  CardHeader,
  Avatar,
  IconButton,
  useToast,
  Progress,
  SimpleGrid,
  Tag,
  TagLabel,
} from "@chakra-ui/react";
import {
  FiCalendar,
  FiDollarSign,
  FiCheckCircle,
  FiFileText,
  FiDownload,
  FiFlag,
  FiThumbsUp,
  FiArrowLeft,
} from "react-icons/fi";
import { useWallet } from "@/hooks/useWalletContext";
import { useParams, useNavigate } from "react-router-dom";
import ReleaseMilestoneModal from "@/components/Modal/ReleaseMilestoneModal";
import CompleteMilestoneModal from "@/components/Modal/CompleteMilestoneModal";
import DisputeMilestoneModal from "@/components/Modal/DisputeMilestoneModal";
import CommentSection from "@/components/CommentComponent/CommentSection";
import { useDisclosure } from "@chakra-ui/react";

// Define types
type EscrowStatus = "Active" | "Completed" | "Disputed" | "Cancelled";
type MilestoneStatus = "Pending" | "InProgress" | "Completed" | "Dispute";
type UserRole = "client" | "worker" | "none";

interface Milestone {
  id: string;
  description: string;
  amount: string;
  deadline: Date;
  completionNote: string;
  status: MilestoneStatus;
  evidenceFiles: any[];
}

interface Escrow {
  id: string;
  title: string;
  creatorAddress: string;
  counterpartyType: string;
  counterpartyAddress: string;
  description: string;
  totalAmount: string;
  status: EscrowStatus;
  createdAt: Date;
  milestones: Milestone[];
}

const MilestoneDetail = () => {
  // State
  const [escrow, setEscrow] = useState<Escrow | null>(null);
  const [milestoneData, setMilestoneData] = useState<Milestone | null>(null);
  const [userRole, setUserRole] = useState<UserRole>("none");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const toast = useToast();
  const navigate = useNavigate();

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

  const { escrowId, milestoneId } = useParams();

  // Modals
  const releaseModal = useDisclosure();
  const disputeModal = useDisclosure();
  const completeModal = useDisclosure();

  // Fetch escrow data
  useEffect(() => {
    const fetchEscrow = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (isApiReady && isExtensionReady && selectedAccount) {
          const result = await getEscrow(escrowId || "");
          if (result.success) {
            setEscrow(result.escrow);
            setIsLoading(false);
          } else {
            setError(result.error || "Failed to fetch escrow");
          }
        } else {
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
        setError("Failed to fetch escrow details. Please try again later.");
        setIsLoading(false);
      }
    };

    fetchEscrow();
  }, [
    escrowId,
    isApiReady,
    isExtensionReady,
    selectedAccount,
    getEscrow,
    toast,
    navigate,
  ]);

  useEffect(() => {
    console.log("Filtering milestone with ID:", milestoneId);
    console.log("Available milestones:", escrow?.milestones);

    if (!milestoneId || !escrow?.milestones || escrow.milestones.length === 0) {
      return;
    }

    // Filter to find the specific milestone
    const foundMilestone = escrow.milestones.find(
      (milestone) => milestone.id === milestoneId
    );

    if (foundMilestone) {
      setMilestoneData(foundMilestone);
    } else {
      setMilestoneData(null);
    }
  }, [milestoneId, escrow]);

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
        escrow.creatorAddress === selectedAccount.address
      ) {
        setUserRole("worker");
      } else if (
        escrow.counterpartyType === "worker" &&
        escrow.counterpartyAddress === selectedAccount.address
      ) {
        setUserRole("worker");
      } else if (
        escrow.counterpartyType === "worker" &&
        escrow.creatorAddress === selectedAccount.address
      ) {
        setUserRole("client");
      } else {
        setUserRole("none");
      }
    }
  }, [escrow, selectedAccount]);

  const handleDownloadFile = async (file: any) => {
    try {
      // Show loading toast
      const loadingToast = toast({
        title: "Downloading...",
        description: `Preparing ${file.name} for download`,
        status: "info",
        duration: null, // Keep it open until we close it
        isClosable: false,
      });

      // Fetch the file from Cloudinary
      const response = await fetch(file.url);

      if (!response.ok) {
        throw new Error("Failed to download file");
      }

      // Get the file blob
      const blob = await response.blob();

      // Create a download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = file.name; // Use the original filename

      // Append to document, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the object URL
      window.URL.revokeObjectURL(downloadUrl);

      // Close loading toast and show success
      toast.close(loadingToast);
      toast({
        title: "Download successful",
        description: `${file.name} has been downloaded`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download failed",
        description: "Failed to download the file. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Utility function to truncate address
  const truncateAddress = (address: string): string => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Get client and vendor addresses
  const getClientAddress = (): string => {
    if (!escrow) return "";
    return escrow.counterpartyType === "client"
      ? escrow.counterpartyAddress
      : escrow.creatorAddress;
  };

  const getVendorAddress = (): string => {
    if (!escrow) return "";
    return escrow.counterpartyType === "worker"
      ? escrow.counterpartyAddress
      : escrow.creatorAddress;
  };

  const getStatusColor = (status: MilestoneStatus): string => {
    switch (status) {
      case "Completed":
        return "green";
      case "InProgress":
        return "blue";
      case "Pending":
        return "yellow";
      case "Dispute":
        return "red";
      default:
        return "gray";
    }
  };

  // Handle milestone release
  const handleReleaseMilestone = async () => {
    if (!milestoneData) return;

    try {
      const result = await releaseMilestone(escrow?.id || "", milestoneData.id);
      if (result.success) {
        const escrowId = result.escrowId;
        const notificationType = "Payment Released" as const;
        const message = `Payment of ${milestoneData.amount} USDC has been released to your wallet.`;
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

          if (notifyResult.success) {
            toast({
              title: "Milestone released",
              description:
                "The milestone has been successfully released and counterparty will get notified",
              status: "success",
              duration: 5000,
            });
          }
        } catch (notifyError) {
          console.warn("Failed to send notification:", notifyError);
        }

        // Update local state
        if (escrow) {
          const updatedMilestones = escrow.milestones.map((m) =>
            m.id === milestoneData.id
              ? {
                  ...m,
                  status: "Completed" as MilestoneStatus,
                }
              : m
          );

          setEscrow({
            ...escrow,
            milestones: updatedMilestones,
          });
        }
      } else {
        toast({
          title: "Release failed",
          description: result.error || "Failed to release milestone",
          status: "error",
          duration: 5000,
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

  const handleCompleteMilestone = async (
    note: string,
    files: Array<{ name: string; url: string; type: string; size: number }>
  ) => {
    if (!milestoneData) {
      console.log("No milestone selected");
      return;
    }

    try {
      const milestone = {
        ...milestoneData,
        completionNote: note,
        completionDate: Date.now(),
        evidenceFiles: files,
      };

      const result = await updateEscrowMilestoneStatus(
        milestoneId!,
        milestone,
        "Completed"
      );

      if (result.success) {
        const milestoneId = milestoneData.id;
        const notificationType = "Milestone Ready" as const;
        const message = `A Milestone has been completed and ready for review.`;
        const type = "info" as const;
        const recipientAddress = result.escrow.userAddress;

        try {
          const notifyResult = await notifyCounterparty(
            milestoneId,
            notificationType,
            recipientAddress,
            message,
            type
          );

          if (notifyResult.success) {
            toast({
              title: "Milestone completed",
              description:
                "This milestone has been completed successfully and Client will get notified",
              status: "success",
              duration: 5000,
            });
          }
        } catch (notifyError) {
          console.warn("Failed to send notification:", notifyError);
        }

        if (escrow) {
          const updatedMilestones = escrow.milestones.map((m) =>
            m.id === milestoneData.id
              ? {
                  ...m,
                  status: "Completed" as MilestoneStatus,
                }
              : m
          );

          setEscrow({
            ...escrow,
            milestones: updatedMilestones,
          });

          completeModal.onClose();
        }
      } else {
        throw new Error(result.error || "Failed to complete milestone");
      }
    } catch (error) {
      console.error("Error completing milestone:", error);
      toast({
        title: "Completion failed",
        description: "An error occurred while completing the milestone",
        status: "error",
        duration: 5000,
      });
    }
  };

  // Handle milestone dispute
  const handleDisputeMilestone = async (disputeReason: string) => {
    if (!milestoneData || !selectedAccount || !escrow) return;

    try {
      // Determine the role of the person filing the dispute based on their wallet address
      let filedByRole: string;

      if (selectedAccount.address === escrow.counterpartyAddress) {
        // The person filing is the counterparty
        filedByRole = escrow.counterpartyType; // This will be either "worker" or "client"
      } else if (selectedAccount.address === escrow.creatorAddress) {
        // The person filing is the creator
        // If counterparty is "worker", then creator is "client", and vice versa
        filedByRole =
          escrow.counterpartyType === "worker" ? "client" : "worker";
      } else {
        // This shouldn't happen if permissions are correct, but handle it
        filedByRole = "unknown";
        console.warn(
          "Selected account doesn't match either party in the escrow"
        );
      }


      const result = await disputeMilestone(
        escrow.id,
        milestoneData.id,
        disputeReason,
        selectedAccount.address, // The address filing the dispute
        filedByRole, // The role determined above
        "Open" // Status
      );

      if (result.success) {
        console.log("send notification now")
        // Determine recipient for notification (the other party)
        const recipientAddress =
          selectedAccount.address === escrow.creatorAddress
            ? escrow.counterpartyAddress
            : escrow.creatorAddress;

        // Notify the other party
        try {
          await notifyCounterparty(
            escrow.id,
            "Milestone Disputed",
            recipientAddress,
            `A milestone has been disputed. Reason: ${disputeReason}`,
            "warning"
          );
        } catch (notifyError) {
          console.warn("Failed to send dispute notification:", notifyError);
          // Don't fail the dispute if notification fails
        }

        toast({
          title: "Dispute filed",
          description: `The milestone has been disputed as ${filedByRole}`,
          status: "info",
          duration: 5000,
        });

        // Update local state
        if (escrow) {
          const updatedMilestones = escrow.milestones.map((m) =>
            m.id === milestoneData.id
              ? { ...m, status: "Dispute" as MilestoneStatus }
              : m
          );

          setEscrow({
            ...escrow,
            milestones: updatedMilestones,
          });
        }
      } else {
        toast({
          title: "Dispute failed",
          description: result.error || "Failed to dispute milestone",
          status: "error",
          duration: 5000,
        });
      }

      disputeModal.onClose();
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

  // Permission checks
  const canReleaseMilestone = (milestone: Milestone) => {
    if (userRole !== "client") return false;
    if (milestone.status !== "Completed") return false;
    if (escrow?.status !== "Active") return false;
    return true;
  };

  const canCompleteMilestone = (milestone: Milestone) => {
    if (userRole !== "worker") return false;
    if (milestone.status !== "InProgress") return false;
    if (escrow?.status !== "Active") return false;
    return true;
  };

  const canDisputeMilestone = (milestone: Milestone) => {
    if (userRole === "none") return false;
    if (milestone?.status !== "Completed") return false;
    if (escrow?.status !== "Active") return false;
    return true;
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  // Early return with loading state
  if (isLoading) {
    return (
      <Container maxW="6xl" py={8}>
        <VStack spacing={4}>
          <Progress size="sm" isIndeterminate w="full" />
          <Text>Loading milestone details...</Text>
        </VStack>
      </Container>
    );
  }

  // Early return with error state
  if (error) {
    return (
      <Container maxW="6xl" py={8}>
        <VStack spacing={4}>
          <Text color="red.500" fontSize="lg">
            Error: {error}
          </Text>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </VStack>
      </Container>
    );
  }

  // Early return if no data
  if (!escrow) {
    return (
      <Container maxW="6xl" py={8}>
        <VStack spacing={4}>
          <Text>Escrow not found</Text>
          <Button onClick={handleGoBack}>Go Back</Button>
        </VStack>
      </Container>
    );
  }

  // Early return if milestone not found
  if (!milestoneData) {
    return (
      <Container maxW="6xl" py={8}>
        <VStack spacing={4}>
          <Text>Milestone not found</Text>
          <Button onClick={handleGoBack}>Go Back</Button>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="6xl" py={8}>
      {/* Header */}
      <HStack mb={6}>
        <IconButton
          icon={<FiArrowLeft />}
          variant="ghost"
          aria-label="Go back"
          onClick={handleGoBack}
        />
        <VStack align="start" spacing={1}>
          <Heading size="lg">
            {milestoneData?.description || "Milestone Details"}
          </Heading>
          <Text color="gray.600">{escrow?.title || "Project"}</Text>
        </VStack>
      </HStack>

      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
        {/* Main Content */}
        <Box gridColumn={{ base: 1, lg: "1 / 3" }}>
          {/* Milestone Overview */}
          <Card mb={6}>
            <CardHeader>
              <Heading size="md">Milestone Overview</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <HStack>
                    <FiDollarSign />
                    <Text fontWeight="semibold">Amount:</Text>
                  </HStack>
                  <Text fontSize="xl" fontWeight="bold" color="green.500">
                    ${milestoneData?.amount || "0"}
                  </Text>
                </HStack>

                <HStack justify="space-between">
                  <HStack>
                    <FiCalendar />
                    <Text fontWeight="semibold">Deadline:</Text>
                  </HStack>
                  <Text>{formatDate(milestoneData?.deadline)}</Text>
                </HStack>

                <HStack justify="space-between">
                  <HStack>
                    <FiCheckCircle />
                    <Text fontWeight="semibold">Status:</Text>
                  </HStack>
                  <Badge
                    colorScheme={getStatusColor(
                      milestoneData?.status || "Pending"
                    )}
                    size="lg"
                  >
                    {milestoneData?.status
                      ? milestoneData.status.charAt(0).toUpperCase() +
                        milestoneData.status.slice(1)
                      : "Pending"}
                  </Badge>
                </HStack>

                <HStack justify="space-between" align="start">
                  <HStack>
                    <FiFileText />
                    <Text fontWeight="semibold">Completion Note:</Text>
                  </HStack>
                  <Box flex="1" ml={4}>
                    {milestoneData?.completionNote ? (
                      <Text
                        color="gray.700"
                        textAlign="left"
                        fontSize="sm"
                        lineHeight="1.5"
                        p={3}
                        bg="gray.50"
                        rounded="md"
                        border="1px"
                        borderColor="gray.200"
                      >
                        {milestoneData.completionNote}
                      </Text>
                    ) : (
                      <Text
                        color="gray.500"
                        textAlign="right"
                        fontSize="sm"
                        fontStyle="italic"
                        py={2}
                      >
                        No completion note provided yet
                      </Text>
                    )}
                  </Box>
                </HStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Evidence/Deliverables */}
          <Card mb={6}>
            <CardHeader>
              <HStack justify="space-between">
                <Heading size="md">Deliverables</Heading>
                <Tag size="sm" colorScheme="blue">
                  <TagLabel>
                    {milestoneData?.evidenceFiles?.length || 0} files
                  </TagLabel>
                </Tag>
              </HStack>
            </CardHeader>
            <CardBody>
              <VStack spacing={3} align="stretch">
                {milestoneData?.evidenceFiles &&
                milestoneData?.evidenceFiles.length > 0 ? (
                  milestoneData.evidenceFiles.map((file, index) => (
                    <HStack
                      key={index}
                      justify="space-between"
                      p={3}
                      bg="gray.50"
                      rounded="md"
                    >
                      <HStack>
                        <FiFileText />
                        <Text>{file.name}</Text>
                      </HStack>
                      <IconButton
                        icon={<FiDownload />}
                        size="sm"
                        variant="ghost"
                        aria-label="Download file"
                        onClick={() => handleDownloadFile(file)}
                      />
                    </HStack>
                  ))
                ) : (
                  <Text color="gray.500" textAlign="center" py={4}>
                    No deliverables uploaded yet
                  </Text>
                )}
              </VStack>
            </CardBody>
          </Card>

          {/* Comments Section - Using the CommentSection component */}
          <CommentSection
            escrowId={escrow.id}
            milestoneId={milestoneData.id}
            currentUserAddress={selectedAccount?.address || ""}
            currentUserRole={userRole}
          />
        </Box>

        {/* Sidebar */}
        <Box>
          {/* Project Info */}
          <Card mb={6}>
            <CardHeader>
              <Heading size="md">Project Details</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={3} align="stretch">
                <HStack justify="space-between">
                  <Text fontWeight="semibold">Escrow ID:</Text>
                  <Text fontSize="sm">{escrow?.id || "N/A"}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontWeight="semibold">Milestone ID:</Text>
                  <Text fontSize="sm">
                    {truncateAddress(milestoneData?.id) || "N/A"}
                  </Text>
                </HStack>
                <Divider />
                <HStack justify="space-between">
                  <Text fontWeight="semibold">Client:</Text>
                  <HStack>
                    <Avatar size="xs" name={getClientAddress()} />
                    <Text fontSize="sm">
                      {truncateAddress(getClientAddress())}
                    </Text>
                  </HStack>
                </HStack>
                <HStack justify="space-between">
                  <Text fontWeight="semibold">Vendor:</Text>
                  <HStack>
                    <Avatar size="xs" name={getVendorAddress()} />
                    <Text fontSize="sm">
                      {truncateAddress(getVendorAddress())}
                    </Text>
                  </HStack>
                </HStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <Heading size="md">Actions</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={3}>
                {/* Release Button - only for client and completed milestones */}
                {canReleaseMilestone(milestoneData) && (
                  <Button
                    colorScheme="green"
                    leftIcon={<FiThumbsUp />}
                    onClick={() => {
                      setMilestoneData(milestoneData);
                      releaseModal.onOpen();
                    }}
                    w="full"
                  >
                    Approve & Release
                  </Button>
                )}

                {/* Complete Button - for worker to mark milestone as completed */}
                {canCompleteMilestone(milestoneData) && (
                  <Button
                    colorScheme="blue"
                    leftIcon={<FiCheckCircle />}
                    onClick={() => {
                      setMilestoneData(milestoneData);
                      completeModal.onOpen();
                    }}
                    w="full"
                  >
                    Mark Complete
                  </Button>
                )}

                {/* Dispute Button - for both parties on completed milestones */}
                {canDisputeMilestone(milestoneData) && (
                  <Button
                    colorScheme="orange"
                    variant="outline"
                    leftIcon={<FiFlag />}
                    onClick={() => {
                      setMilestoneData(milestoneData);
                      disputeModal.onOpen();
                    }}
                    w="full"
                  >
                    Dispute
                  </Button>
                )}
              </VStack>
            </CardBody>
          </Card>
        </Box>
      </SimpleGrid>

      {/* Modals */}
      <ReleaseMilestoneModal
        isOpen={releaseModal.isOpen}
        onClose={releaseModal.onClose}
        milestone={milestoneData}
        onConfirm={handleReleaseMilestone}
      />

      <DisputeMilestoneModal
        isOpen={disputeModal.isOpen}
        onClose={disputeModal.onClose}
        milestone={milestoneData}
        onConfirm={handleDisputeMilestone}
      />

      <CompleteMilestoneModal
        isOpen={completeModal.isOpen}
        onClose={completeModal.onClose}
        milestone={milestoneData}
        onConfirm={handleCompleteMilestone}
        isLoading={isLoading}
      />
    </Container>
  );
};

export default MilestoneDetail;
