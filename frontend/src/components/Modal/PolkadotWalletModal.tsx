import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  Text,
  VStack,
  HStack,
  Button,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertDescription,
  Badge,
  InputGroup,
  InputRightElement,
  Icon,
  Spinner
} from '@chakra-ui/react';
import { CheckIcon, WarningIcon } from '@chakra-ui/icons';
import { validatePolkadotAddress, ValidationResult } from '@/utils/polkadotValidator';


interface PolkadotWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PolkadotWalletModal: React.FC<PolkadotWalletModalProps> = ({ isOpen, onClose }) => {
  const [walletAddress, setWalletAddress] = useState('');
  const [validation, setValidation] = useState<ValidationResult>({ isValid: false });
  const [isValidating, setIsValidating] = useState(false);
  
  const subTextColor = useColorModeValue('gray.600', 'gray.300');
  const errorColor = useColorModeValue('red.500', 'red.300');
  const successColor = useColorModeValue('green.500', 'green.300');

  // Debounced validation
  useEffect(() => {
    if (!walletAddress.trim()) {
      setValidation({ isValid: false });
      setIsValidating(false);
      return;
    }

    setIsValidating(true);
    const timeoutId = setTimeout(() => {
      const result = validatePolkadotAddress(walletAddress);
      setValidation(result);
      setIsValidating(false);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [walletAddress]);

  const handleClose = () => {
    onClose();
    setWalletAddress('');
    setValidation({ isValid: false });
  };

  const handleSubmit = async () => {
    if (!validation.isValid) return;

    try {
      // TODO: Send address to smart contract
      console.log('Submitting wallet address:', {
        address: walletAddress,
        network: validation.network,
        normalized: validation.normalizedAddress
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert(`Address submitted successfully!\nNetwork: ${validation.network}\nAddress: ${validation.normalizedAddress || walletAddress}`);
      handleClose();
    } catch (error) {
      console.error('Failed to submit address:', error);
      alert('Failed to submit address. Please try again.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && validation.isValid) {
      handleSubmit();
    }
  };

  const getInputRightElement = () => {
    if (isValidating) {
      return <Spinner size="sm" color="gray.400" />;
    }
    if (walletAddress.trim() && validation.isValid) {
      return <Icon as={CheckIcon} color={successColor} />;
    }
    if (walletAddress.trim() && !validation.isValid) {
      return <Icon as={WarningIcon} color={errorColor} />;
    }
    return null;
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" isCentered>
      <ModalOverlay bg="blackAlpha.900" />
      <ModalContent mx={4}>
        <ModalHeader>
          <VStack align="start" spacing={2}>
            <Text fontSize="xl" fontWeight="bold">
              Enter Polkadot Wallet Address
            </Text>
            <Text fontSize="sm" color={subTextColor} fontWeight="normal">
              Please enter your Polkadot wallet address to be credited with test tokens.
            </Text>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <VStack spacing={4}>
            <FormControl isInvalid={walletAddress.trim() !== '' && !validation.isValid}>
              <FormLabel fontSize="sm" fontWeight="medium">
                Polkadot Wallet Address
              </FormLabel>
              <InputGroup>
                <Input
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your Polkadot address (e.g., 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa)"
                  size="md"
                  focusBorderColor="pink.500"
                  errorBorderColor="red.500"
                />
                <InputRightElement>
                  {getInputRightElement()}
                </InputRightElement>
              </InputGroup>
              <Text fontSize="xs" color={subTextColor} mt={2}>
                Supports Polkadot, Kusama, and other Substrate-based addresses
              </Text>
            </FormControl>

            {/* Validation Status */}
            {walletAddress.trim() && !isValidating && validation.isValid && (
              <Alert status="success" borderRadius="md">
                <AlertIcon />
                <VStack align="start" spacing={1} flex={1}>
                  <AlertDescription fontSize="sm">
                    Valid address detected!
                  </AlertDescription>
                  {validation.network && (
                    <HStack>
                      <Text fontSize="xs" color={subTextColor}>Network:</Text>
                      <Badge colorScheme="green" size="sm">{validation.network}</Badge>
                    </HStack>
                  )}
                </VStack>
              </Alert>
            )}

            {walletAddress.trim() && !isValidating && !validation.isValid && validation.error && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <AlertDescription fontSize="sm">
                  {validation.error}
                </AlertDescription>
              </Alert>
            )}

          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3} w="full">
            <Button
              variant="outline"
              onClick={handleClose}
              flex={1}
            >
              Cancel
            </Button>
            <Button
              colorScheme="pink"
              onClick={handleSubmit}
              flex={1}
              isDisabled={!validation.isValid}
              isLoading={isValidating}
              loadingText="Validating..."
            >
              Submit Address
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default PolkadotWalletModal;