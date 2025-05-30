import React from 'react';
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

  const handleTypeChange = (value: 'client' | 'worker') => {
    updateFormData({ counterpartyType: value });
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFormData({ counterpartyAddress: e.target.value });
  };

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
            
            <Box 
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
            </Box>
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

      <FormControl isRequired isInvalid={!!errors.counterpartyAddress}>
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
        {errors.counterpartyAddress && (
          <FormErrorMessage>{errors.counterpartyAddress}</FormErrorMessage>
        )}
      </FormControl>
    </VStack>
  );
};

export default CounterpartyDetails; 