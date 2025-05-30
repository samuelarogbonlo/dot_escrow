import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  List,
  ListItem,
  ListIcon,
  Image,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Step,
  StepDescription,
  StepIcon,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  useSteps,
  Checkbox,
  useColorModeValue,
  useDisclosure,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import {
  FiCheck,
  FiUser,
  FiDollarSign,
  FiFileText,
  FiClock,
  FiShield,
} from 'react-icons/fi';

interface WelcomeGuideProps {
  isOpen?: boolean;
  onClose?: () => void;
}

// Guide steps
const steps = [
  {
    title: 'Welcome to .escrow',
    description: 'The secure platform for freelance payments',
    icon: FiShield,
  },
  {
    title: 'Connect Your Wallet',
    description: 'Link your Polkadot wallet to get started',
    icon: FiUser,
  },
  {
    title: 'Create an Escrow',
    description: 'Set up secure payment agreements',
    icon: FiFileText,
  },
  {
    title: 'Manage Milestones',
    description: 'Track progress and release payments',
    icon: FiClock,
  },
  {
    title: 'Get Paid Securely',
    description: 'Receive funds directly to your wallet',
    icon: FiDollarSign,
  },
];

const WelcomeGuide = ({ isOpen: propIsOpen, onClose: propOnClose }: WelcomeGuideProps) => {
  const navigate = useNavigate();
  const { isOpen: isOpenControlled, onClose: onCloseControlled } = useDisclosure({ defaultIsOpen: true });
  const [hasSeenGuide, setHasSeenGuide] = useLocalStorage('hasSeenWelcomeGuide', false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: steps.length,
  });
  
  // Use either the controlled or uncontrolled state
  const isOpen = propIsOpen !== undefined ? propIsOpen : isOpenControlled && !hasSeenGuide;
  const onClose = propOnClose || onCloseControlled;
  
  // UI colors
  const stepBg = useColorModeValue('blue.100', 'blue.800');
  const currentStepBg = useColorModeValue('blue.500', 'blue.400');
  
  // Navigate to next step
  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    } else {
      handleComplete();
    }
  };
  
  // Navigate to previous step
  const handlePrevious = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };
  
  // Navigate to a specific step
  const handleStepClick = (index: number) => {
    setActiveStep(index);
  };
  
  // Complete the guide
  const handleComplete = () => {
    if (dontShowAgain) {
      setHasSeenGuide(true);
    }
    onClose();
  };
  
  // Skip the guide
  const handleSkip = () => {
    if (dontShowAgain) {
      setHasSeenGuide(true);
    }
    onClose();
  };
  
  // Toggle "Don't show again" checkbox
  const handleDontShowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDontShowAgain(e.target.checked);
  };
  
  // Direct navigation to specific pages
  const navigateTo = (path: string) => {
    onClose();
    navigate(path);
  };
  
  // Render step content based on active step
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <VStack spacing={6} align="start">
            <Heading size="md">Welcome to .escrow</Heading>
            <Text>
              .escrow is a decentralized escrow platform built on Polkadot that enables secure, 
              trust-minimized transactions between freelancers and clients using USDT stablecoins.
            </Text>
            <Text>
              This guide will help you understand how to use the platform effectively to create and 
              manage secure payment agreements.
            </Text>
            <Box
              w="100%"
              h="180px"
              bg="gray.100"
              borderRadius="md"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {/* Placeholder for platform logo/illustration */}
              <Text fontSize="lg" fontWeight="bold">
                .escrow
              </Text>
            </Box>
            <Text fontWeight="medium">Key benefits:</Text>
            <List spacing={2}>
              <ListItem>
                <ListIcon as={FiCheck} color="green.500" />
                Eliminate payment volatility through stablecoin usage
              </ListItem>
              <ListItem>
                <ListIcon as={FiCheck} color="green.500" />
                Reduce cross-border payment friction and costs
              </ListItem>
              <ListItem>
                <ListIcon as={FiCheck} color="green.500" />
                Create trust between parties without requiring intermediaries
              </ListItem>
              <ListItem>
                <ListIcon as={FiCheck} color="green.500" />
                Simplify milestone-based payment releases
              </ListItem>
              <ListItem>
                <ListIcon as={FiCheck} color="green.500" />
                Protection against non-payment or non-delivery
              </ListItem>
            </List>
          </VStack>
        );
      case 1:
        return (
          <VStack spacing={6} align="start">
            <Heading size="md">Connect Your Wallet</Heading>
            <Text>
              To use the .escrow platform, you need to connect a Polkadot-compatible wallet. 
              This will allow you to sign transactions and manage your funds securely.
            </Text>
            <Box
              w="100%"
              h="180px"
              bg="gray.100"
              borderRadius="md"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {/* Placeholder for wallet connection illustration */}
              <Text fontSize="lg" fontWeight="bold">
                Wallet Connection
              </Text>
            </Box>
            <Text fontWeight="medium">Steps to connect your wallet:</Text>
            <List spacing={2}>
              <ListItem>
                <ListIcon as={FiCheck} color="green.500" />
                Install the Polkadot.js browser extension or another compatible wallet
              </ListItem>
              <ListItem>
                <ListIcon as={FiCheck} color="green.500" />
                Click "Connect Wallet" in the navigation menu
              </ListItem>
              <ListItem>
                <ListIcon as={FiCheck} color="green.500" />
                Select your wallet provider from the available options
              </ListItem>
              <ListItem>
                <ListIcon as={FiCheck} color="green.500" />
                Authorize the connection when prompted by your wallet
              </ListItem>
              <ListItem>
                <ListIcon as={FiCheck} color="green.500" />
                Select the account you want to use with .escrow
              </ListItem>
            </List>
            <Button 
              colorScheme="blue" 
              size="sm" 
              onClick={() => navigateTo('/connect-wallet')}
            >
              Connect Wallet Now
            </Button>
          </VStack>
        );
      case 2:
        return (
          <VStack spacing={6} align="start">
            <Heading size="md">Create an Escrow</Heading>
            <Text>
              An escrow agreement is a secure way to manage payments for projects by holding funds 
              in a smart contract until predefined conditions are met.
            </Text>
            <Box
              w="100%"
              h="180px"
              bg="gray.100"
              borderRadius="md"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {/* Placeholder for escrow creation illustration */}
              <Text fontSize="lg" fontWeight="bold">
                Escrow Creation
              </Text>
            </Box>
            <Text fontWeight="medium">How to create an escrow:</Text>
            <List spacing={2}>
              <ListItem>
                <ListIcon as={FiCheck} color="green.500" />
                Navigate to the Dashboard and click "Create New Escrow"
              </ListItem>
              <ListItem>
                <ListIcon as={FiCheck} color="green.500" />
                Enter basic details: title, description, and total amount
              </ListItem>
              <ListItem>
                <ListIcon as={FiCheck} color="green.500" />
                Select your role (client or worker) and enter the counterparty's address
              </ListItem>
              <ListItem>
                <ListIcon as={FiCheck} color="green.500" />
                Define milestones with amounts, descriptions, and deadlines
              </ListItem>
              <ListItem>
                <ListIcon as={FiCheck} color="green.500" />
                Review details and confirm to create the escrow
              </ListItem>
            </List>
            <Button 
              colorScheme="blue" 
              size="sm" 
              onClick={() => navigateTo('/create-escrow')}
            >
              Create Escrow Now
            </Button>
          </VStack>
        );
      case 3:
        return (
          <VStack spacing={6} align="start">
            <Heading size="md">Manage Milestones</Heading>
            <Text>
              Milestones break down your project into manageable parts, each with its own deadline 
              and payment amount. They help track progress and facilitate partial payments.
            </Text>
            <Box
              w="100%"
              h="180px"
              bg="gray.100"
              borderRadius="md"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {/* Placeholder for milestone management illustration */}
              <Text fontSize="lg" fontWeight="bold">
                Milestone Management
              </Text>
            </Box>
            <Text fontWeight="medium">Managing milestones:</Text>
            <List spacing={2}>
              <ListItem>
                <ListIcon as={FiCheck} color="green.500" />
                View all your milestones in the Milestone Tracking dashboard
              </ListItem>
              <ListItem>
                <ListIcon as={FiCheck} color="green.500" />
                Workers can submit evidence when a milestone is completed
              </ListItem>
              <ListItem>
                <ListIcon as={FiCheck} color="green.500" />
                Clients can review and verify the submitted work
              </ListItem>
              <ListItem>
                <ListIcon as={FiCheck} color="green.500" />
                Once verified, the client can release the payment
              </ListItem>
              <ListItem>
                <ListIcon as={FiCheck} color="green.500" />
                If a dispute arises, use the dispute resolution system
              </ListItem>
            </List>
            <Button 
              colorScheme="blue" 
              size="sm" 
              onClick={() => navigateTo('/milestones')}
            >
              View Milestones
            </Button>
          </VStack>
        );
      case 4:
        return (
          <VStack spacing={6} align="start">
            <Heading size="md">Get Paid Securely</Heading>
            <Text>
              Once a milestone is completed and verified, the funds are released from the smart 
              contract directly to the worker's wallet. This ensures secure and timely payments.
            </Text>
            <Box
              w="100%"
              h="180px"
              bg="gray.100"
              borderRadius="md"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {/* Placeholder for payment process illustration */}
              <Text fontSize="lg" fontWeight="bold">
                Secure Payments
              </Text>
            </Box>
            <Text fontWeight="medium">The payment process:</Text>
            <List spacing={2}>
              <ListItem>
                <ListIcon as={FiCheck} color="green.500" />
                Worker submits completed work with evidence
              </ListItem>
              <ListItem>
                <ListIcon as={FiCheck} color="green.500" />
                Client reviews and verifies the work
              </ListItem>
              <ListItem>
                <ListIcon as={FiCheck} color="green.500" />
                Client releases the milestone payment
              </ListItem>
              <ListItem>
                <ListIcon as={FiCheck} color="green.500" />
                Funds are transferred to the worker's wallet
              </ListItem>
              <ListItem>
                <ListIcon as={FiCheck} color="green.500" />
                Platform fee (0.5-1%) is deducted based on agreement settings
              </ListItem>
            </List>
            <Text fontWeight="bold" mt={2}>
              You're all set to use .escrow for secure freelance payments!
            </Text>
            <Button 
              colorScheme="blue" 
              size="sm" 
              onClick={() => navigateTo('/dashboard')}
            >
              Go to Dashboard
            </Button>
          </VStack>
        );
      default:
        return null;
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent maxH="90vh">
        <ModalHeader pt={6}>Getting Started with .escrow</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <Flex direction={{ base: 'column', md: 'row' }} gap={6}>
            {/* Stepper */}
            <Box w={{ base: '100%', md: '200px' }}>
              <Stepper
                index={activeStep}
                orientation="vertical"
                colorScheme="blue"
                size="sm"
                gap={2}
              >
                {steps.map((step, index) => (
                  <Step key={index} onClick={() => handleStepClick(index)} cursor="pointer">
                    <StepIndicator
                      bg={index < activeStep ? 'green.500' : index === activeStep ? currentStepBg : stepBg}
                    >
                      {index < activeStep ? (
                        <StepIcon as={FiCheck} />
                      ) : (
                        <StepIcon as={step.icon} />
                      )}
                    </StepIndicator>
                    <Box flexShrink="0">
                      <StepTitle>{step.title}</StepTitle>
                      <StepDescription display={{ base: 'none', lg: 'block' }}>
                        {step.description}
                      </StepDescription>
                    </Box>
                    <StepSeparator />
                  </Step>
                ))}
              </Stepper>
            </Box>
            
            {/* Content */}
            <Box flex="1" pl={{ base: 0, md: 4 }}>
              {renderStepContent()}
            </Box>
          </Flex>
        </ModalBody>
        
        <ModalFooter borderTop="1px solid" borderColor="gray.100" mt={4} pt={4}>
          <Checkbox
            isChecked={dontShowAgain}
            onChange={handleDontShowChange}
            mr="auto"
            size="sm"
          >
            Don't show this guide again
          </Checkbox>
          
          <HStack spacing={2}>
            {activeStep > 0 ? (
              <Button variant="outline" onClick={handlePrevious}>
                Previous
              </Button>
            ) : (
              <Button variant="outline" onClick={handleSkip}>
                Skip
              </Button>
            )}
            
            <Button 
              colorScheme="blue" 
              onClick={handleNext}
            >
              {activeStep < steps.length - 1 ? 'Next' : 'Finish'}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default WelcomeGuide; 