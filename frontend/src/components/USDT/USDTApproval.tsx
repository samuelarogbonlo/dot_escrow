// components/USDT/USDTApproval.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Text,
  Alert,
  AlertIcon,
  Progress,
  VStack,
  HStack,
  Icon,
  useColorModeValue,
  Flex,
  Badge,
  Input,
  FormControl,
  FormLabel,
  FormHelperText
} from '@chakra-ui/react';
import { FiCheck, FiAlertCircle, FiShield, FiDollarSign } from 'react-icons/fi';
import { useUSDTContract } from '../../hooks/useUSDTContract';

interface USDTApprovalProps {
  requiredAmount: string;
  onApprovalComplete?: () => void;
  onApprovalStart?: () => void;
  onError?: () => void;
  showBalance?: boolean;
}

export const USDTApproval: React.FC<USDTApprovalProps> = ({
  requiredAmount,
  onApprovalComplete,
  onApprovalStart,
  onError,
  showBalance = true
}) => {
  const {
    balance,
    allowance,
    isLoading,
    error,
    approveUSDT,
    checkSufficientBalance,
    checkSufficientAllowance,
    formatUSDT
  } = useUSDTContract();

  const [approvalAmount, setApprovalAmount] = useState(requiredAmount);
  const [isApproving, setIsApproving] = useState(false);
  const [approvalStep, setApprovalStep] = useState<'check' | 'approve' | 'complete'>('check');

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const sufficientBalance = checkSufficientBalance(requiredAmount);
  const sufficientAllowance = checkSufficientAllowance(requiredAmount);
  const needsApproval = !sufficientAllowance;

  useEffect(() => {
    if (sufficientAllowance) {
      setApprovalStep('complete');
      onApprovalComplete?.();
    
    } else if(!sufficientAllowance || !sufficientBalance) {
      onError?.()
    } else if (sufficientBalance) {
      setApprovalStep('approve');
    } else {
      setApprovalStep('check');
    }
  }, [sufficientBalance, sufficientAllowance, onApprovalComplete]);

  const handleApprove = async () => {
    if (!approvalAmount) return;

    setIsApproving(true);
    onApprovalStart?.();

    try {
      const result = await approveUSDT(approvalAmount);
      
      if (result.success) {
        setApprovalStep('complete');
        onApprovalComplete?.();
      }
    } catch (err) {
      console.error('Approval failed:', err);
    } finally {
      setIsApproving(false);
    }
  };

  const getStepProgress = () => {
    switch (approvalStep) {
      case 'check':
        return 25;
      case 'approve':
        return 50;
      case 'complete':
        return 100;
      default:
        return 0;
    }
  };

  const getStepColor = () => {
    if (!sufficientBalance) return 'red';
    if (approvalStep === 'complete') return 'green';
    return 'blue';
  };

  return (
    <Box
      p={4}
      borderWidth="1px"
      borderRadius="md"
      bg={bgColor}
      borderColor={borderColor}
    >
      <VStack spacing={4} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <HStack>
            <Icon as={FiShield} color={getStepColor() + '.500'} />
            <Text fontWeight="medium">USDT Approval</Text>
          </HStack>
          <Badge colorScheme={getStepColor()} variant="subtle">
            {approvalStep === 'complete' ? 'Approved' : needsApproval ? 'Required' : 'Ready'}
          </Badge>
        </Flex>

        {/* Progress Bar */}
        <Box>
          <Progress
            value={getStepProgress()}
            colorScheme={getStepColor()}
            size="sm"
            borderRadius="md"
          />
          <Text fontSize="xs" color="gray.600" mt={1}>
            Step {approvalStep === 'check' ? '1' : approvalStep === 'approve' ? '2' : '3'} of 3
          </Text>
        </Box>

        {/* Balance Check */}
        {showBalance && (
          <Box p={3} bg={sufficientBalance ? 'green.50' : 'red.50'} borderRadius="md">
            <HStack justify="space-between">
              <HStack>
                <Icon 
                  as={sufficientBalance ? FiCheck : FiAlertCircle} 
                  color={sufficientBalance ? 'green.500' : 'red.500'} 
                />
                <Text fontSize="sm" fontWeight="medium">
                  Balance Check
                </Text>
              </HStack>
              <Text fontSize="sm">
                {balance ? balance.formatted : '0.00'} USDT
              </Text>
            </HStack>
            
            {!sufficientBalance && (
              <Text fontSize="xs" color="red.600" mt={1}>
                Insufficient USDT balance. Required: {requiredAmount} USDT
              </Text>
            )}
          </Box>
        )}

        {/* Approval Section */}
        {sufficientBalance && needsApproval && (
          <Box>
            <FormControl mb={3}>
              <FormLabel fontSize="sm">Approval Amount</FormLabel>
              <Input
                type="number"
                value={approvalAmount}
                onChange={(e) => setApprovalAmount(e.target.value)}
                placeholder="Enter amount to approve"
                step="0.01"
              />
              <FormHelperText>
                Minimum required: {requiredAmount} USDT
                {parseFloat(approvalAmount) > parseFloat(requiredAmount) && (
                  <Text as="span" color="blue.600" ml={2}>
                    (Extra approval for future transactions)
                  </Text>
                )}
              </FormHelperText>
            </FormControl>

            <Button
              colorScheme="blue"
              onClick={handleApprove}
              isLoading={isApproving || isLoading}
              loadingText="Approving..."
              disabled={!approvalAmount || parseFloat(approvalAmount) < parseFloat(requiredAmount)}
              leftIcon={<Icon as={FiDollarSign} />}
              w="full"
            >
              Approve {approvalAmount} USDT
            </Button>
          </Box>
        )}

        {/* Success State */}
        {approvalStep === 'complete' && (
          <Alert status="success" borderRadius="md">
            <AlertIcon />
            <Box>
              <Text fontWeight="medium">Approval Complete!</Text>
              <Text fontSize="sm">
                {allowance ? `Approved: ${allowance.formatted} USDT` : 'USDT spending approved'}
              </Text>
            </Box>
          </Alert>
        )}

        {/* Error Display */}
        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <Box>
              <Text fontWeight="medium">Approval Failed</Text>
              <Text fontSize="sm">{error}</Text>
            </Box>
          </Alert>
        )}

        {/* Information */}
        <Box fontSize="xs" color="gray.600">
          <Text>
            💡 You need to approve USDT spending before creating escrows.
            This is a one-time transaction that allows the escrow contract to transfer your USDT.
          </Text>
        </Box>
      </VStack>
    </Box>
  );
};

export default USDTApproval;