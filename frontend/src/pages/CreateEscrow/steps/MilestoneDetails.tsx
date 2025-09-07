import React, { useState } from 'react';
import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Box,
  HStack,
  IconButton,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  FormErrorMessage,
  Alert,
  AlertIcon,
  useColorModeValue,
  Flex,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { EscrowFormData } from '../index';
import { SingleDatepicker } from 'chakra-dayzed-datepicker';

interface MilestoneDetailsProps {
  formData: EscrowFormData;
  updateFormData: (data: Partial<EscrowFormData>) => void;
  errors: Record<string, string>;
}

interface MilestoneFormState {
  description: string;
  amount: string;
  status: string;
  deadline: Date | null;
}

const MilestoneDetails: React.FC<MilestoneDetailsProps> = ({
  formData,
  updateFormData,
  errors,
}) => {
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [milestoneForm, setMilestoneForm] = useState<MilestoneFormState>({
    description: '',
    amount: '',
    status: 'Pending',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default to 30 days from now
  });

  const getBgColor = useColorModeValue('gray.50', 'gray.700');
  const getBorderColor = useColorModeValue('gray.200', 'gray.600');
  const getTextColor = useColorModeValue('gray.600', 'gray.300');

  // Calculate remaining amount
  const totalUsed = formData.milestones.reduce(
    (sum, m) => sum + (parseFloat(m.amount) || 0),
    0
  );
  const totalAmount = parseFloat(formData.totalAmount) || 0;
  const remaining = Math.max(0, totalAmount - totalUsed);

  // Handle milestone form changes
  const handleMilestoneChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setMilestoneForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle date change
  const handleDateChange = (date: Date) => {
    setMilestoneForm((prev) => ({ ...prev, deadline: date }));
  };

  // Add new milestone
  const addMilestone = () => {
    if (editIndex !== null) {
      // Update existing milestone
      const updatedMilestones = [...formData.milestones];
      updatedMilestones[editIndex] = milestoneForm;
      updateFormData({ milestones: updatedMilestones });
      setEditIndex(null);
    } else {
      // Add new milestone
      const updatedMilestones = [...formData.milestones, milestoneForm];
      updateFormData({ milestones: updatedMilestones });
    }

    // Reset form
    setMilestoneForm({
      description: '',
      amount: '',
      status: 'Pending',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
  };

  // Edit milestone
  const editMilestone = (index: number) => {
    setMilestoneForm(formData.milestones[index]);
    setEditIndex(index);
  };

  // Delete milestone
  const deleteMilestone = (index: number) => {
    const updatedMilestones = formData.milestones.filter((_, i) => i !== index);
    updateFormData({ milestones: updatedMilestones });
  };

  // Format date
  const formatDate = (date: Date | null) => {
    if (!date) return 'No deadline';
    return date.toLocaleDateString();
  };

  return (
    <VStack spacing={6} align="stretch">
      <Box mb={4}>
        <Text fontSize="lg" fontWeight="medium">
          Milestone Breakdown
        </Text>
        <Text fontSize="sm" color={getTextColor}>
          Break down your project into milestones with specific payments and deadlines
        </Text>
      </Box>

      {errors.milestones && (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {errors.milestones}
        </Alert>
      )}

      <Box
        p={4}
        borderWidth="1px"
        borderRadius="md"
        bg={getBgColor}
        borderColor={getBorderColor}
        mb={4}
      >
        <Text fontWeight="medium" mb={3}>
          {editIndex !== null ? 'Edit Milestone' : 'Add New Milestone'}
        </Text>
        <VStack spacing={4}>
          <FormControl isRequired isInvalid={!!errors[`milestone_${editIndex}_description`]}>
            <FormLabel>Description</FormLabel>
            <Input
              name="description"
              placeholder="e.g., Initial Design, Development Phase 1"
              value={milestoneForm.description}
              onChange={handleMilestoneChange}
            />
            {editIndex !== null && errors[`milestone_${editIndex}_description`] && (
              <FormErrorMessage>{errors[`milestone_${editIndex}_description`]}</FormErrorMessage>
            )}
          </FormControl>

          <HStack spacing={4} width="100%">
            <FormControl isRequired isInvalid={!!errors[`milestone_${editIndex}_amount`]}>
              <FormLabel>Amount (USDT)</FormLabel>
              <Input
                name="amount"
                type="number"
                placeholder="Amount"
                value={milestoneForm.amount}
                onChange={handleMilestoneChange}
                step="0.01"
                min="0"
              />
              {editIndex !== null && errors[`milestone_${editIndex}_amount`] && (
                <FormErrorMessage>{errors[`milestone_${editIndex}_amount`]}</FormErrorMessage>
              )}
            </FormControl>

            <FormControl isRequired isInvalid={!!errors[`milestone_${editIndex}_deadline`]}>
              <FormLabel>Deadline</FormLabel>
              <SingleDatepicker
                name="deadline"
                date={milestoneForm.deadline || new Date()}
                onDateChange={handleDateChange}
                minDate={new Date()}
                propsConfigs={{
                  dayOfMonthBtnProps: {
                    defaultBtnProps: {
                      _hover: {
                        background: 'blue.500',
                        color: 'white',
                      },
                    },
                    selectedBtnProps: {
                      background: 'blue.500',
                      color: 'white',
                    },
                  },
                }}
              />
              {editIndex !== null && errors[`milestone_${editIndex}_deadline`] && (
                <FormErrorMessage>{errors[`milestone_${editIndex}_deadline`]}</FormErrorMessage>
              )}
            </FormControl>
          </HStack>

          <HStack width="100%" justify="space-between">
            <Text fontSize="sm" color={getTextColor}>
              Remaining: {remaining.toFixed(2)} USDT
            </Text>
            <Button
              colorScheme="blue"
              onClick={addMilestone}
              leftIcon={<AddIcon />}
              disabled={!milestoneForm.description || !milestoneForm.amount || !milestoneForm.deadline}
            >
              {editIndex !== null ? 'Update Milestone' : 'Add Milestone'}
            </Button>
          </HStack>
        </VStack>
      </Box>

      {formData.milestones.length > 0 ? (
        <Box overflowX="auto">
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th width="40%">Description</Th>
                <Th width="20%">Amount (USDT)</Th>
                <Th width="25%">Deadline</Th>
                <Th width="15%">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {formData.milestones.map((milestone, index) => (
                <Tr key={index}>
                  <Td>{milestone.description}</Td>
                  <Td isNumeric>{parseFloat(milestone.amount).toFixed(2)}</Td>
                  <Td>{formatDate(milestone.deadline)}</Td>
                  <Td>
                    <HStack spacing={1}>
                      <IconButton
                        aria-label="Edit milestone"
                        icon={<EditIcon />}
                        size="sm"
                        variant="ghost"
                        onClick={() => editMilestone(index)}
                      />
                      <IconButton
                        aria-label="Delete milestone"
                        icon={<DeleteIcon />}
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => deleteMilestone(index)}
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))}
              <Tr fontWeight="bold">
                <Td>Total</Td>
                <Td isNumeric>{totalUsed.toFixed(2)}</Td>
                <Td></Td>
                <Td></Td>
              </Tr>
            </Tbody>
          </Table>
        </Box>
      ) : (
        <Flex
          direction="column"
          align="center"
          justify="center"
          p={10}
          borderWidth="1px"
          borderRadius="md"
          borderColor={getBorderColor}
          borderStyle="dashed"
        >
          <Text color={getTextColor} mb={4}>No milestones added yet</Text>
          <Text fontSize="sm" color={getTextColor} mb={4}>Add your first milestone using the form above</Text>
        </Flex>
      )}

      {totalUsed !== totalAmount && (
        <Alert status={totalUsed > totalAmount ? 'error' : 'warning'} borderRadius="md">
          <AlertIcon />
          {totalUsed > totalAmount
            ? `Total milestone amounts exceed the escrow total by ${(totalUsed - totalAmount).toFixed(2)} USDT`
            : `Total milestone amounts are less than the escrow total by ${(totalAmount - totalUsed).toFixed(2)} USDT`}
        </Alert>
      )}
    </VStack>
  );
};

export default MilestoneDetails; 