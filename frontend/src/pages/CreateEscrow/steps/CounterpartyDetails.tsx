import React, { useEffect, useState } from 'react';
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
  HStack,
} from '@chakra-ui/react';
import { EscrowFormData } from '../index';
import { FiCopy, FiCheck } from 'react-icons/fi';
import { isSS58, isH160, detectAddressFormat, toH160, formatSS58, formatH160 } from '../../../utils/addressConversion';

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
  const [addressFormat, setAddressFormat] = useState<'ss58' | 'h160' | 'unknown'>('unknown');
  const [convertedAddress, setConvertedAddress] = useState<string>('');

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

  // Enhanced validation function for counterparty address (supports SS58 and H160)
  const validateCounterpartyAddress = (address: string): string | null => {
    if (!address.trim()) {
      return 'Address is required';
    }

    if (address.toLowerCase() === userAddress.toLowerCase()) {
      return 'Counterparty address cannot be the same as your address';
    }

    // Validate address format (SS58 or H160)
    const format = detectAddressFormat(address);
    if (format === 'unknown') {
      return 'Please enter a valid SS58 or H160 address';
    }

    // Try converting to validate
    try {
      if (format === 'ss58') {
        toH160(address); // Will throw if invalid
      }
      return null;
    } catch (error) {
      return 'Invalid address format';
    }
  };

  // Auto-detect address format and convert
  useEffect(() => {
    if (formData.counterpartyAddress) {
      const format = detectAddressFormat(formData.counterpartyAddress);
      setAddressFormat(format);

      // Convert to opposite format for display
      try {
        if (format === 'ss58') {
          const h160 = toH160(formData.counterpartyAddress);
          setConvertedAddress(h160);
        } else if (format === 'h160') {
          // H160 is already the format needed for contracts
          setConvertedAddress('');
        } else {
          setConvertedAddress('');
        }
      } catch (error) {
        setConvertedAddress('');
      }
    } else {
      setAddressFormat('unknown');
      setConvertedAddress('');
    }
  }, [formData.counterpartyAddress]);

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
          <HStack>
            <Text>
              {formData.counterpartyType === 'worker'
                ? 'Worker Address'
                : 'Client Address'}
            </Text>
            {addressFormat !== 'unknown' && (
              <Badge colorScheme={addressFormat === 'ss58' ? 'purple' : 'blue'}>
                {addressFormat === 'ss58' ? 'SS58' : 'H160'}
              </Badge>
            )}
          </HStack>
        </FormLabel>
        <InputGroup>
          <Input
            placeholder="Enter SS58 or H160 address"
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

        {/* Show converted address */}
        {convertedAddress && addressFormat === 'ss58' && (
          <Box mt={2} p={2} bg={addressBoxBg} borderRadius="md" borderWidth="1px">
            <Text fontSize="xs" color={textColor} mb={1}>
              H160 (Contract Format):
            </Text>
            <HStack>
              <Text fontSize="sm" fontFamily="monospace" flex="1">
                {formatH160(convertedAddress)}
              </Text>
              <Badge colorScheme="blue" fontSize="xs">Auto-converted</Badge>
            </HStack>
          </Box>
        )}

        <FormHelperText>
          Enter SS58 (Substrate) or H160 (Contract) address. Format is auto-detected.
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