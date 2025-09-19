import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Heading,
  Text,
  Flex,
  Button,
  Step,
  StepDescription,
  StepIcon,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  useToast,
  Card,
  CardBody,
  Icon,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalCloseButton,
  ModalBody,
  ModalHeader,
  ModalContent,
  VStack,
  ModalFooter,
  Spinner,
} from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { FiCheckCircle, FiAlertTriangle } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../../hooks/useWalletContext";
import { usePSP22StablecoinContract } from "@/hooks/usePSP22StablecoinContract";
import { ESCROW_CONTRACT_ADDRESS } from "@/contractABI/EscrowABI";
import { notifyDepositContract } from "@/utils/escrowContractUtils";

// Form steps components
import BasicDetails from "./steps/BasicDetails";
import CounterpartyDetails from "./steps/CounterpartyDetails";
import MilestoneDetails from "./steps/MilestoneDetails";
import ReviewDetails from "./steps/ReviewDetails";
import PSP22StablecoinApproval from "@/components/PSP22StableCoinBalance/PSP22StablecoinApproval";

// Types
interface FormStep {
  title: string;
  description: string;
}

export interface EscrowFormData {
  title: string;
  description: string;
  totalAmount: string;
  counterpartyType: "client" | "worker";
  counterpartyAddress: string;
  milestones: {
    description: string;
    amount: string;
    status: string;
    deadline: Date | null;
  }[];
}

type ApprovalState =
  | "idle"
  | "checking"
  | "needed"
  | "approving"
  | "approved"
  | "creating";

// Constants
const defaultFormData: EscrowFormData = {
  title: "",
  description: "",
  totalAmount: "",
  counterpartyType: "worker",
  counterpartyAddress: "",
  milestones: [
    {
      description: "",
      amount: "",
      status: "",
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default to 30 days from now
    },
  ],
};

const formSteps: FormStep[] = [
  { title: "Basic Details", description: "Title and description" },
  { title: "Counterparty", description: "Select worker or client" },
  { title: "Milestones", description: "Define payment milestones" },
  { title: "Review", description: "Review escrow details" },
];

const CreateEscrow = () => {
  // Form state
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<EscrowFormData>(defaultFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Approval flow state
  const [approvalState, setApprovalState] = useState<ApprovalState>("idle");
  const [isCreatingEscrow, setIsCreatingEscrow] = useState(false);

  // Modal state
  const {
    isOpen: isModalOpen,
    onOpen: openModal,
    onClose: closeModal,
  } = useDisclosure();

  // Hooks
  const navigate = useNavigate();
  const toast = useToast();

  const {
    createEscrow,
    notifyCounterparty,
    api,
    selectedAccount,
    isExtensionReady,
    connectExtension,
    checkTransactionStatus,
  } = useWallet();

  const {
    balance,
    checkSufficientBalance,
    checkSufficientAllowance,
    transferToken,
    error: usdcError,
  } = usePSP22StablecoinContract();

  const adjustedAmount = (Number(formData.totalAmount) * 1.01).toString();

  // Effects
  useEffect(() => {
    // Reset approval state when form data changes
    if (approvalState === "approved") {
      setApprovalState("idle");
    }
  }, [adjustedAmount]);

  // Helper functions
  const updateFormData = (data: Partial<EscrowFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const validateCurrentStep = (): boolean => {
    const errors: Record<string, string> = {};

    switch (currentStep) {
      case 0: // Basic Details
        if (!formData.title.trim()) {
          errors.title = "Title is required";
        }
        if (!formData.totalAmount.trim()) {
          errors.totalAmount = "Total amount is required";
        } else if (
          isNaN(Number(formData.totalAmount)) ||
          Number(formData.totalAmount) <= 0
        ) {
          errors.totalAmount = "Total amount must be a positive number";
        }
        break;

      case 1: // Counterparty
        if (!formData.counterpartyAddress.trim()) {
          errors.counterpartyAddress = "Counterparty address is required";
        } else if (formData.counterpartyAddress.length < 48) {
          errors.counterpartyAddress = "Invalid Polkadot address";
        } else if (formData.counterpartyAddress.toLowerCase() === selectedAccount?.address.toLowerCase()) {
          errors.counterpartyAddress = "Counterparty address cannot be the same as your address";
        }
        break;

      case 2: // Milestones
        const totalMilestoneAmount = formData.milestones.reduce(
          (sum, m) => sum + (Number(m.amount) || 0),
          0
        );

        if (formData.milestones.length === 0) {
          errors.milestones = "At least one milestone is required";
        } else if (
          Math.abs(totalMilestoneAmount - Number(formData.totalAmount)) > 0.01
        ) {
          errors.milestones = `Milestone amounts must sum to total: ${formData.totalAmount}`;
        }

        formData.milestones.forEach((milestone, index) => {
          if (!milestone.description?.trim()) {
            errors[`milestone_${index}_description`] =
              "Description is required";
          }
          if (!milestone.amount?.trim()) {
            errors[`milestone_${index}_amount`] = "Amount is required";
          } else if (
            isNaN(Number(milestone.amount)) ||
            Number(milestone.amount) <= 0
          ) {
            errors[`milestone_${index}_amount`] =
              "Amount must be a positive number";
          }
          if (!milestone.deadline) {
            errors[`milestone_${index}_deadline`] = "Deadline is required";
          } else if (!(milestone.deadline instanceof Date) || isNaN(milestone.deadline.getTime())) {
            errors[`milestone_${index}_deadline`] = "Invalid deadline date";
          } else if (milestone.deadline.getTime() <= Date.now()) {
            errors[`milestone_${index}_deadline`] = "Deadline must be in the future";
          }
        });
        break;

      case 3: // Review
        // Wallet checks
        if (!isExtensionReady) {
          errors.wallet = "Wallet extension not connected";
        } else if (!selectedAccount) {
          errors.wallet = "No account selected";
        }

        // WORKER creating escrow - no balance check needed
        break;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const checkApprovalStatus = async () => {
    if (!formData.totalAmount || approvalState === "checking") return;

    setApprovalState("checking");

    try {
      // Only clients (counterpartyType === "worker") need USDT approval
      if (formData.counterpartyType === "worker") {
        // CLIENT creating escrow - needs to deposit funds

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
      } else {
        // WORKER creating escrow - no payment needed, just proposal
        setApprovalState("approved");
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

  const executeUSDCTransfer = useCallback(
    async (amount: string, userAddress: string) => {
      if (!api || !selectedAccount?.address) {
        throw new Error("API or account not available");
      }

      try {
        console.log("[executeUSDCTransfer] Starting USDC transfer:", {
          amount,
          from: userAddress,
          to: ESCROW_CONTRACT_ADDRESS,
        });

        // Determine the actual recipient (escrow contract or direct recipient)
        const actualRecipient = ESCROW_CONTRACT_ADDRESS;

        // Check if user has sufficient balance
        if (!checkSufficientBalance(amount)) {
          throw new Error(
            `Insufficient USDC balance. Required: ${amount} USDC`
          );
        }

        // Use the transferUSDC function from the USDC hook
        const transferResult = await transferToken(actualRecipient, amount);

        if (!transferResult.success) {
          throw new Error(transferResult.error || "USDC transfer failed");
        }

        // Use the real transaction hash from the blockchain
        const txHash = transferResult.txHash;

        if (!txHash) {
          throw new Error("Transaction hash not available");
        }

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
    },
    [
      api,
      selectedAccount?.address,
      transferToken,
      checkSufficientBalance,
      ESCROW_CONTRACT_ADDRESS,
    ]
  );

  // Navigation handlers
  const handleNext = () => {
    if (!validateCurrentStep()) return;

    if (currentStep < formSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Last step - initiate approval process
      openModal();
      checkApprovalStatus();
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
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
      description: "You can now create the escrow contract",
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

  // Escrow creation
 const handleCreateEscrow = async () => {
  if (!selectedAccount) return;

  setIsCreatingEscrow(true);
  setApprovalState("creating");

  try {
    const creatorAddress = selectedAccount.address;
    const counterpartyAddress = formData.counterpartyAddress;
    const counterpartyType = formData.counterpartyType;

    const milestones = formData.milestones.map((m, index) => {
      let deadlineTimestamp: number;
      
      if (m.deadline && m.deadline instanceof Date && !isNaN(m.deadline.getTime())) {
        deadlineTimestamp = Math.floor(m.deadline.getTime() / 1000);
      } else {
        deadlineTimestamp = Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000);
      }
      
      return {
        id: `milestone-${Date.now()}-${index}`,
        description: m.description,
        amount: m.amount,
        status: "Pending",
        deadline: deadlineTimestamp,
      };
    });

    let result;
    let successMessage = "";
    let notificationMessage = "";
    let executeTransaction;
    let transactionHash;
    let depositNotification;

    if (counterpartyType === "worker") {
      // CLIENT is creating escrow for WORKER
      if (approvalState !== "approved") {
        throw new Error("USDC approval required for client escrow creation");
      }

      // Step 1: Execute USDC transfer transaction
      executeTransaction = await executeUSDCTransfer(
        adjustedAmount,
        creatorAddress
      );

      if (executeTransaction.success) {
        transactionHash = await checkTransactionStatus(
          executeTransaction.txHash
        );

        if (transactionHash.success === true) {
          // Step 2: Create escrow in contract
          result = await createEscrow(
            creatorAddress,
            counterpartyAddress,
            counterpartyType,
            "Active",
            formData.title,
            formData.description,
            adjustedAmount,
            milestones,
            executeTransaction.txHash
          );

          // Step 3: NEW - Notify contract about the deposit
          if (result.success === true) {
            console.log("🔔 Notifying contract about deposit...");
            
            depositNotification = await notifyDepositContract(
              api,
              selectedAccount,
              result.escrowId,
              adjustedAmount,
            );

            if (depositNotification.success) {
              console.log("✅ Deposit notification successful:", depositNotification);
              successMessage = `Escrow created and funded with ${adjustedAmount} USDC. Contract has been notified of deposit. Worker can now start work.`;
            } else {
              console.error("❌ Deposit notification failed:", depositNotification.error);
              // Don't fail the entire process, but warn the user
              successMessage = `Escrow created and funded with ${adjustedAmount} USDC. Warning: Contract deposit notification failed - release may not work until manually resolved.`;
            }
          }

          notificationMessage = `A new escrow has been created and funded with ${adjustedAmount} USDC. Worker can now start work.`;
        }
      }
    } else {
      // WORKER is creating escrow for CLIENT - no deposit needed yet
      result = await createEscrow(
        creatorAddress,
        counterpartyAddress,
        counterpartyType,
        "Inactive",
        formData.title,
        formData.description,
        adjustedAmount,
        milestones,
        ""
      );

      successMessage = `Escrow proposal sent to client. Waiting for client approval and funding.`;
      notificationMessage = `A worker has created an escrow proposal for you. Please review and approve to fund the escrow.`;
    }

    if (depositNotification?.success) {
      // Send notification
      try {
        const notificationType = counterpartyType === "worker"
          ? ("Escrow Funded" as const)
          : ("Escrow Proposal" as const);

        await notifyCounterparty(
          result.escrowId,
          notificationType,
          counterpartyAddress,
          notificationMessage,
          "info"
        );
      } catch (notifyError) {
        console.warn("Failed to send notification:", notifyError);
      }

      toast({
        title: "Escrow Created Successfully",
        description: successMessage,
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      closeModal();
      navigate(`/`);
    } else {
      throw new Error("Failed to create escrow");
    }
  } catch (error) {
    console.error("Error creating escrow:", error);
    toast({
      title: "Error Creating Escrow",
      description: error instanceof Error ? error.message : "An unknown error occurred",
      status: "error",
      duration: 5000,
      isClosable: true,
    });
    setApprovalState(
      formData.counterpartyType === "worker" ? "approved" : "idle"
    );
  } finally {
    setIsCreatingEscrow(false);
  }
};

  const handleConnectWallet = async () => {
    try {
      await connectExtension();
      if (!isExtensionReady || !selectedAccount) {
        navigate("/connect-wallet");
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      toast({
        title: "Wallet Connection Error",
        description:
          error instanceof Error
            ? error.message
            : "Unable to connect to wallet",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      navigate("/connect-wallet");
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <BasicDetails
            formData={formData}
            updateFormData={updateFormData}
            errors={formErrors}
          />
        );
      case 1:
        return (
          <CounterpartyDetails
            formData={formData}
            updateFormData={updateFormData}
            errors={formErrors}
            userAddress={selectedAccount?.address || ""}
          />
        );
      case 2:
        return (
          <MilestoneDetails
            formData={formData}
            updateFormData={updateFormData}
            errors={formErrors}
          />
        );
      case 3:
        return (
          <ReviewDetails
            formData={formData}
            errors={formErrors}
            userAddress={selectedAccount?.address || ""}
          />
        );
      default:
        return null;
    }
  };

  const renderModalContent = () => {
    const isClientCreating = formData.counterpartyType === "worker";

    switch (approvalState) {
      case "checking":
        return (
          <VStack spacing={4} py={8}>
            <Spinner size="lg" />
            <Text>
              {isClientCreating
                ? "Checking USDC balance and allowance..."
                : "Preparing escrow proposal..."}
            </Text>
          </VStack>
        );

      case "needed":
        // Only shown for clients who need to approve USDC
        return (
          <VStack align="start" spacing={4}>
            <Text color="gray.600">
              As the client, you need to approve the contract to spend your USDC
              tokens to fund this escrow.
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
              requiredAmount={adjustedAmount}
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
                <AlertTitle>
                  {isClientCreating
                    ? "Ready to Fund Escrow!"
                    : "Ready to Send Proposal!"}
                </AlertTitle>
                <AlertDescription>
                  {isClientCreating
                    ? "USDC approval complete. Funds will be deposited to the escrow contract."
                    : "Your escrow proposal will be sent to the client for approval and funding."}
                </AlertDescription>
              </Box>
            </Alert>

            <Card variant="outline" w="full">
              <CardBody>
                <VStack align="start" spacing={2}>
                  <Flex justify="space-between" w="full">
                    <Text>Escrow Amount:</Text>
                    <Text fontWeight="bold">{formData.totalAmount} USDC</Text>
                  </Flex>
                  <Flex justify="space-between" w="full">
                    <Text>{isClientCreating ? "Worker:" : "Client:"}</Text>
                    <Text fontFamily="mono" fontSize="sm">
                      {formData.counterpartyAddress.slice(0, 8)}...
                      {formData.counterpartyAddress.slice(-8)}
                    </Text>
                  </Flex>
                  <Flex justify="space-between" w="full">
                    <Text>Milestones:</Text>
                    <Text>{formData.milestones.length}</Text>
                  </Flex>
                  <Flex justify="space-between" w="full">
                    <Text>Action:</Text>
                    <Text color="green.500" fontWeight="bold">
                      {isClientCreating ? "✓ Fund Escrow" : "✓ Send Proposal"}
                    </Text>
                  </Flex>
                  {isClientCreating && (
                    <Flex justify="space-between" w="full">
                      <Text>USDC Approval:</Text>
                      <Text color="green.500" fontWeight="bold">
                        ✓ Complete
                      </Text>
                    </Flex>
                  )}
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        );

      case "creating":
        return (
          <VStack spacing={4} py={8}>
            <Spinner size="lg" />
            <Text>
              {isClientCreating
                ? "Creating and funding escrow contract..."
                : "Sending escrow proposal..."}
            </Text>
            <Text fontSize="sm" color="gray.600">
              {isClientCreating
                ? "Please wait while we deploy your contract and transfer funds"
                : "Please wait while we send your proposal to the client"}
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
    const isClientCreating = formData.counterpartyType === "worker";

    switch (approvalState) {
      case "checking":
        return isClientCreating
          ? "Checking Requirements"
          : "Preparing Proposal";
      case "needed":
        return "Approve USDC Spending";
      case "approving":
        return "Approving USDC";
      case "approved":
        return isClientCreating ? "Fund Escrow" : "Send Proposal";
      case "creating":
        return isClientCreating ? "Funding Escrow" : "Sending Proposal";
      default:
        return "Create Escrow";
    }
  };

  const getModalButtons = () => {
    const isClientCreating = formData.counterpartyType === "worker";

    switch (approvalState) {
      case "needed":
      case "approving":
        return (
          <>
            <Button
              variant="outline"
              onClick={closeModal}
              isDisabled={approvalState === "approving"}
            >
              Cancel
            </Button>
          </>
        );

      case "approved":
        return (
          <>
            <Flex justify="space-between" mt={4} gap={3}>
              <Button variant="outline" onClick={closeModal}>
                Back
              </Button>
              <Button
                colorScheme={isClientCreating ? "green" : "blue"}
                onClick={handleCreateEscrow}
                isLoading={isCreatingEscrow}
                loadingText={isClientCreating ? "Funding..." : "Sending..."}
                leftIcon={<Icon as={FiCheckCircle} />}
              >
                {isClientCreating ? "Fund Escrow" : "Send Proposal"}
              </Button>
            </Flex>
          </>
        );

      default:
        return (
          <Button variant="outline" onClick={closeModal}>
            Close
          </Button>
        );
    }
  };

  // Wallet error check
  const walletError = !isExtensionReady
    ? "Wallet extension not connected"
    : !selectedAccount
    ? "No account selected"
    : null;

  return (
    <Box>
      <Heading size="lg" mb={6}>
        Create Escrow
      </Heading>

      {/* Stepper */}
      <Stepper
        index={currentStep}
        mb={8}
        colorScheme="blue"
        size={{ base: "sm", md: "md" }}
      >
        {formSteps.map((step, index) => (
          <Step key={index}>
            <StepIndicator>
              <StepStatus
                complete={<StepIcon />}
                incomplete={<StepNumber />}
                active={<StepNumber />}
              />
            </StepIndicator>
            <Box flexShrink="0">
              <StepTitle>{step.title}</StepTitle>
              <StepDescription display={{ base: "none", md: "block" }}>
                {step.description}
              </StepDescription>
            </Box>
            <StepSeparator />
          </Step>
        ))}
      </Stepper>

      {/* Wallet Connection Alert */}
      {currentStep === 3 && walletError && (
        <Alert status="error" mb={6} borderRadius="md">
          <AlertIcon as={FiAlertTriangle} />
          <Box flex="1">
            <AlertTitle>Wallet Connection Required</AlertTitle>
            <AlertDescription>{walletError}</AlertDescription>
          </Box>
          <Button colorScheme="red" onClick={handleConnectWallet} size="sm">
            Connect Wallet
          </Button>
        </Alert>
      )}

      {/* Form Content */}
      <Card variant="outline" mb={6}>
        <CardBody>{renderStepContent()}</CardBody>
      </Card>

      {/* Navigation Buttons */}
      <Flex justify="space-between" mt={4}>
        <Button
          leftIcon={<ChevronLeftIcon />}
          onClick={handlePrevious}
          isDisabled={currentStep === 0}
          variant="outline"
        >
          Previous
        </Button>

        <Button
          rightIcon={
            currentStep < formSteps.length - 1 ? (
              <ChevronRightIcon />
            ) : undefined
          }
          colorScheme={currentStep < formSteps.length - 1 ? "blue" : "green"}
          onClick={handleNext}
          isDisabled={currentStep === 3 && walletError !== null}
        >
          {currentStep < formSteps.length - 1 ? "Next" : "Create Escrow"}
        </Button>
      </Flex>

      {/* Approval Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        closeOnOverlayClick={approvalState !== "creating"}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{getModalTitle()}</ModalHeader>
          {approvalState !== "creating" && <ModalCloseButton />}
          <ModalBody>{renderModalContent()}</ModalBody>
          <ModalFooter>{getModalButtons()}</ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default CreateEscrow;
