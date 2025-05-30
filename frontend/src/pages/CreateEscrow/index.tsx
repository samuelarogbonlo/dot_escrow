import { useState, useEffect } from "react";
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
} from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { FiCheckCircle, FiAlertTriangle } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../../hooks/useWalletContext";

// Form steps components
import BasicDetails from "./steps/BasicDetails";
import CounterpartyDetails from "./steps/CounterpartyDetails";
import MilestoneDetails from "./steps/MilestoneDetails";
import ReviewDetails from "./steps/ReviewDetails";

// Step interface
interface FormStep {
  title: string;
  description: string;
}

// Form data interface
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

// Default form values
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
      deadline: null,
    },
  ],
};

// Steps definition
const steps: FormStep[] = [
  { title: "Basic Details", description: "Title and description" },
  { title: "Counterparty", description: "Select worker or client" },
  { title: "Milestones", description: "Define payment milestones" },
  { title: "Review", description: "Review and create" },
];

const CreateEscrow = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<EscrowFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [walletError, setWalletError] = useState<string | null>(null);

  const { createEscrow, selectedAccount, isExtensionReady, connectExtension } =
    useWallet();
  const navigate = useNavigate();
  const toast = useToast();

  // Check wallet connection status on final step
  useEffect(() => {
    if (currentStep === 3) {
      if (!isExtensionReady) {
        setWalletError(
          "Wallet extension not connected. Please connect to create an escrow."
        );
      } else if (!selectedAccount) {
        setWalletError(
          "No account selected. Please select an account to create an escrow."
        );
      } else {
        setWalletError(null);
      }
    }
  }, [currentStep, selectedAccount, isExtensionReady]);

  // Connect wallet function
  const handleConnectWallet = async () => {
    try {
      await connectExtension();
      if (isExtensionReady && selectedAccount) {
        setWalletError(null);
      } else {
        // If we couldn't connect directly, redirect to the wallet connection page
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
      // Redirect to connect wallet page after error
      navigate("/connect-wallet");
    }
  };

  // Update form data
  const updateFormData = (data: Partial<EscrowFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  // Validate current step
  const validateStep = (): boolean => {
    const errors: Record<string, string> = {};

    if (currentStep === 0) {
      // Basic details validation
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
    } else if (currentStep === 1) {
      // Counterparty validation
      if (!formData.counterpartyAddress.trim()) {
        errors.counterpartyAddress = "Counterparty address is required";
      } else if (formData.counterpartyAddress.length < 48) {
        errors.counterpartyAddress = "Invalid Polkadot address";
      }
    } else if (currentStep === 2) {
      // Milestones validation
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
        if (!milestone.description || !milestone.description.trim()) {
          errors[`milestone_${index}_description`] = "Description is required";
        }
        if (!milestone.amount || !milestone.amount.trim()) {
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
        }
      });
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle next step
  const handleNext = () => {
    console.log("Attempting to validate step:", currentStep);
    console.log("Current form data:", formData);

    const isValid = validateStep();
    console.log("Validation result:", isValid);
    console.log("Form errors:", formErrors);

    if (isValid) {
      setCurrentStep((prev) => {
        const newStep = Math.min(prev + 1, steps.length - 1);
        console.log("Moving to step:", newStep);
        return newStep;
      });
    } else {
      console.log("Validation failed, staying on step:", currentStep);
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateStep()) return;

    if (!selectedAccount) {
      setWalletError(
        "Wallet not connected. Please connect your wallet before creating an escrow."
      );
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet before creating an escrow",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);

    console.log(formData);

    try {
      // Determine client and worker addresses based on counterpartyType
      const userAddress = selectedAccount.address;
      const counterpartyAddress = formData.counterpartyAddress;
      const counterpartyType = formData.counterpartyType;
      const status = "Inactive";

      // Format milestones for contract
      const title = formData.title;
      const description = formData.description;
      const totalAmount = formData.totalAmount;
      const milestones = formData.milestones.map((m) => ({
        id: `milestone-${Math.floor(Math.random() * 10000)}`,
        description: m.description,
        amount: m.amount,
        status: "Pending",
        deadline: m.deadline
          ? m.deadline.getTime()
          : Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now as fallback
      }));

      // Create escrow
      const result = await createEscrow(
        userAddress, 
        counterpartyAddress, 
        counterpartyType, 
        status, 
        title, 
        description, 
        totalAmount, 
        milestones
      );

      if (result.success) {
        toast({
          title: "Escrow created",
          description: `Your escrow has been created successfully with ID: ${result.escrowId}`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        navigate(`/escrow/${result.escrowId}`);
      } else {
        toast({
          title: "Error creating escrow",
          description: result.error || "An unknown error occurred",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Error creating escrow:", error);
      toast({
        title: "Error creating escrow",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render current step component
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
        {steps.map((step, index) => (
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

      {/* Wallet Error Alert */}
      {currentStep === 3 && walletError && (
        <Alert status="error" mb={6} borderRadius="md">
          <AlertIcon as={FiAlertTriangle} />
          <Box flex="1">
            <AlertTitle>Wallet Connection Required</AlertTitle>
            <AlertDescription display="block">{walletError}</AlertDescription>
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

        {currentStep < steps.length - 1 ? (
          <Button
            rightIcon={<ChevronRightIcon />}
            colorScheme="blue"
            onClick={handleNext}
          >
            Next
          </Button>
        ) : (
          <Button
            colorScheme="green"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            loadingText="Creating..."
            leftIcon={<Icon as={FiCheckCircle} />}
            isDisabled={walletError !== null}
          >
            Create Escrow
          </Button>
        )}
      </Flex>
    </Box>
  );
};

export default CreateEscrow;
