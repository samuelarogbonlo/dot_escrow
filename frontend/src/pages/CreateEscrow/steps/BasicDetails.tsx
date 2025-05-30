import React from 'react';
import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  InputGroup,
  InputRightAddon,
  FormErrorMessage,
  useColorModeValue,
  Text,
} from '@chakra-ui/react';
import { EscrowFormData } from '../index';

interface BasicDetailsProps {
  formData: EscrowFormData;
  updateFormData: (data: Partial<EscrowFormData>) => void;
  errors: Record<string, string>;
}

const BasicDetails: React.FC<BasicDetailsProps> = ({ formData, updateFormData, errors }) => {
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
  };

  const helperTextColor = useColorModeValue("gray.600", "gray.400");

  return (
    <VStack spacing={6} align="stretch">
      <Text fontSize="lg" fontWeight="medium">
        Basic Details
      </Text>
      <Text fontSize="sm" color={helperTextColor} mb={2}>
        Enter the basic information about your escrow agreement
      </Text>
      
      <FormControl isRequired isInvalid={!!errors.title}>
        <FormLabel>Title</FormLabel>
        <Input
          name="title"
          placeholder="Enter a descriptive title"
          value={formData.title}
          onChange={handleChange}
        />
        {errors.title && <FormErrorMessage>{errors.title}</FormErrorMessage>}
      </FormControl>

      <FormControl>
        <FormLabel>Description</FormLabel>
        <Textarea
          name="description"
          placeholder="Enter agreement details"
          value={formData.description}
          onChange={handleChange}
          resize="vertical"
          rows={4}
        />
      </FormControl>

      <FormControl isRequired isInvalid={!!errors.totalAmount}>
        <FormLabel>Total Amount</FormLabel>
        <InputGroup>
          <Input
            name="totalAmount"
            placeholder="Enter the total amount"
            value={formData.totalAmount}
            onChange={handleChange}
            type="number"
            min="0"
            step="0.01"
          />
          <InputRightAddon>USDT</InputRightAddon>
        </InputGroup>
        {errors.totalAmount && (
          <FormErrorMessage>{errors.totalAmount}</FormErrorMessage>
        )}
      </FormControl>
    </VStack>
  );
};

export default BasicDetails; 