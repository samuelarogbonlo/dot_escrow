import React, { useEffect } from 'react';
import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  RadioGroup,
  Radio,
  Stack,
  Text,
  Box,
  FormErrorMessage,
  FormHelperText,
  InputGroup,
  InputRightElement,
  Button,
  useClipboard,
  Flex,
  Badge,
  useColorModeValue,
} from '@chakra-ui/react';
import { EscrowFormData } from '../index';
import { FiCopy, FiCheck } from 'react-icons/fi';

interface CounterpartyDetailsProps {
  formData: EscrowFormData;
  updateFormData: (data: Partial<EscrowFormData>) => void;
  errors: Record<string, string>;
  userAddress: string;
}

const CounterpartyDetails: React.FC<CounterpartyDetailsProps> = ({
  formData,
  updateFormData,
  errors,
  userAddress,
}) => {
  const { hasCopied, onCopy } = useClipboard(userAddress);

  // Set up color mode values
  const boxBg = useColorModeValue('white', 'gray.700');
  const boxBgActive = {
    worker: useColorModeValue('blue.50', 'blue.900'),
    client: useColorModeValue('green.50', 'green.900'),
  };
  const borderColorDefault = useColorModeValue('gray.200', 'gray.600');
  const borderColorActive = {
    worker: useColorModeValue('blue.500', 'blue.400'),
    client: useColorModeValue('green.500', 'green.400'),
  };
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const addressBoxBg = useColorModeValue('gray.50', 'gray.700');

  // Validation function for counterparty address
  const validateCounterpartyAddress = (address: string): string | null => {
    if (!address.trim()) {
      return 'Address is required';
    }
    
    if (address.toLowerCase() === userAddress.toLowerCase()) {
      return 'Counterparty address cannot be the same as your address';
    }
    
    // Add additional Polkadot address format validation if needed
    // This is a basic check - you might want to add more sophisticated validation
    if (!/^[1-9A-HJ-NP-Za-km-z]{47,48}$/.test(address)) {
      return 'Please enter a valid Polkadot address';
    }
    
    return null;
  };

  // Validate on address change
  useEffect(() => {
    if (formData.counterpartyAddress) {
      const validationError = validateCounterpartyAddress(formData.counterpartyAddress);
      
      // You'll need to implement a way to update errors in your parent component
      // This assumes you have a function to update errors
      if (validationError) {
        // Signal error to parent component
        // updateErrors?.({ counterpartyAddress: validationError });
      } else {
        // Clear error if validation passes
        // updateErrors?.({ counterpartyAddress: '' });
      }
    }
  }, [formData.counterpartyAddress, userAddress]);

  const handleTypeChange = (value: 'client' | 'worker') => {
    updateFormData({ counterpartyType: value });
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAddress = e.target.value;
    updateFormData({ counterpartyAddress: newAddress });
    
    // Immediate validation feedback
    const validationError = validateCounterpartyAddress(newAddress);
    if (validationError) {
      // You'll need to implement error updating in your parent component
      console.warn('Validation error:', validationError);
    }
  };

  // Check if current address matches user address
  const hasAddressConflict = formData.counterpartyAddress && 
    formData.counterpartyAddress.toLowerCase() === userAddress.toLowerCase();

  return (
    <VStack spacing={6} align="stretch">
      <FormControl>
        <FormLabel>Your Role</FormLabel>
        <RadioGroup
          value={formData.counterpartyType}
          onChange={handleTypeChange as (value: string) => void}
        >
          <Stack direction={{ base: 'column', md: 'row' }} spacing={5}>
            <Box 
              p={4} 
              borderWidth="1px" 
              borderRadius="md" 
              borderColor={formData.counterpartyType === 'worker' ? borderColorActive.worker : borderColorDefault}
              bg={formData.counterpartyType === 'worker' ? boxBgActive.worker : boxBg}
              flex="1"
            >
              <Radio value="worker" mb={2}>
                I am <Badge colorScheme="blue">hiring someone</Badge>
              </Radio>
              <Text fontSize="sm" color={textColor} ml={6}>
                You'll be the client paying for work
              </Text>
            </Box>
            
            {/* <Box 
              p={4} 
              borderWidth="1px" 
              borderRadius="md" 
              borderColor={formData.counterpartyType === 'client' ? borderColorActive.client : borderColorDefault}
              bg={formData.counterpartyType === 'client' ? boxBgActive.client : boxBg}
              flex="1"
            >
              <Radio value="client" mb={2}>
                I am <Badge colorScheme="green">providing services</Badge>
              </Radio>
              <Text fontSize="sm" color={textColor} ml={6}>
                You'll be the worker receiving payment
              </Text>
            </Box> */}
          </Stack>
        </RadioGroup>
      </FormControl>

      <Box p={4} borderWidth="1px" borderRadius="md" bg={addressBoxBg} borderColor={borderColorDefault}>
        <Text fontWeight="medium" mb={2}>
          Your Address
        </Text>
        <Flex align="center">
          <Text fontSize="sm" fontFamily="monospace" flex="1" isTruncated>
            {userAddress || 'No wallet connected'}
          </Text>
          <Button
            size="xs"
            leftIcon={hasCopied ? <FiCheck /> : <FiCopy />}
            onClick={onCopy}
            colorScheme={hasCopied ? 'green' : 'gray'}
            variant="outline"
          >
            {hasCopied ? 'Copied' : 'Copy'}
          </Button>
        </Flex>
      </Box>

      <FormControl 
        isRequired 
        isInvalid={Boolean(errors.counterpartyAddress) || Boolean(hasAddressConflict)}
      >
        <FormLabel>
          {formData.counterpartyType === 'worker'
            ? 'Worker Address'
            : 'Client Address'}
        </FormLabel>
        <InputGroup>
          <Input
            placeholder="Enter Polkadot address"
            value={formData.counterpartyAddress}
            onChange={handleAddressChange}
            fontFamily="monospace"
            borderColor={hasAddressConflict ? 'red.300' : undefined}
          />
          <InputRightElement width="4.5rem">
            <Button
              h="1.75rem"
              size="sm"
              onClick={() => {/* Could add address book integration here */}}
              variant="ghost"
            >
              Select
            </Button>
          </InputRightElement>
        </InputGroup>
        <FormHelperText>
          Enter the Polkadot address of the {formData.counterpartyType === 'worker' ? 'worker' : 'client'}
        </FormHelperText>
        {(errors.counterpartyAddress || hasAddressConflict) && (
          <FormErrorMessage>
            {hasAddressConflict 
              ? 'Counterparty address cannot be the same as your address'
              : errors.counterpartyAddress
            }
          </FormErrorMessage>
        )}
      </FormControl>
    </VStack>
  );
};

export default CounterpartyDetails;