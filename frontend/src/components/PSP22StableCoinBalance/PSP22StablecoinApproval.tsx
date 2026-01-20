// components/PSP22/PSP22StablecoinApproval.tsx
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
import { usePSP22StablecoinContract, PASETHUB_NETWORK_STABLECOINS } from '../../hooks/usePSP22StablecoinContract';

interface PSP22StablecoinApprovalProps {
  stablecoinKey?: keyof typeof PASETHUB_NETWORK_STABLECOINS;
  requiredAmount: string;
  onApprovalComplete?: () => void;
  onApprovalStart?: () => void;
  onError?: () => void;
  showBalance?: boolean;
}

export const PSP22StablecoinApproval: React.FC<PSP22StablecoinApprovalProps> = ({
  stablecoinKey = 'TEST_USDT',
  requiredAmount,
  onApprovalComplete,
  onApprovalStart,
  onError,
  showBalance = true
}) => {
  const {
    stablecoinConfig,
    balance,
    allowance,
    isLoading,
    error,
    approveToken,
    checkSufficientBalance,
    checkSufficientAllowance,
    formatToken
  } = usePSP22StablecoinContract(stablecoinKey);

  const [approvalAmount, setApprovalAmount] = useState(requiredAmount);
  const [isApproving, setIsApproving] = useState(false);
  const [approvalStep, setApprovalStep] = useState<'check' | 'approve' | 'complete'>('check');

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const sufficientBalance = checkSufficientBalance(requiredAmount);
  const sufficientAllowance = checkSufficientAllowance(requiredAmount);
  const needsApproval = !sufficientAllowance;

  // Determine if we're still loading (balance not yet fetched)
  const isInitializing = balance === null;

  useEffect(() => {
    // Don't run callbacks during initial load when balance is still being fetched
    if (isInitializing) {
      setApprovalStep('check');
      return;
    }

    if (sufficientAllowance) {
      setApprovalStep('complete');
      onApprovalComplete?.();
    } else if (!sufficientBalance) {
      // Only call onError for insufficient BALANCE (not allowance)
      // Insufficient allowance is expected - that's why user is on this screen
      setApprovalStep('check');
      onError?.();
    } else {
      // Has balance but needs approval - this is the normal flow
      setApprovalStep('approve');
    }
  }, [sufficientBalance, sufficientAllowance, onApprovalComplete, onError, isInitializing]);

  const handleApprove = async () => {
    if (!approvalAmount) return;

    setIsApproving(true);
    onApprovalStart?.();

    try {
      const result = await approveToken(approvalAmount);

      if (result.success) {
        setApprovalStep('complete');
        onApprovalComplete?.();
      } else {
        // Approval failed - notify parent and stay on approve step
        console.error('Approval failed:', result.error);
        setApprovalStep('approve');
        onError?.();
      }
    } catch (err) {
      console.error('Approval failed:', err);
      setApprovalStep('approve');
      onError?.();
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
            <Text fontWeight="medium">{stablecoinConfig.symbol} Approval</Text>
          </HStack>
          <Badge colorScheme={getStepColor()} variant="subtle">
            {approvalStep === 'complete' ? 'Approved' : needsApproval ? 'Required' : 'Ready'}
          </Badge>
        </Flex>

        {/* Token Info */}
        <Text fontSize="sm" color="gray.600">
          {stablecoinConfig.name}
          {stablecoinConfig.description && (
            <Text as="span" fontSize="xs" color="gray.500" ml={2}>
              • {stablecoinConfig.description}
            </Text>
          )}
        </Text>

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
          <Box p={3} bg={isInitializing ? 'gray.50' : sufficientBalance ? 'green.50' : 'red.50'} borderRadius="md">
            <HStack justify="space-between">
              <HStack>
                <Icon
                  as={isInitializing ? FiAlertCircle : sufficientBalance ? FiCheck : FiAlertCircle}
                  color={isInitializing ? 'gray.400' : sufficientBalance ? 'green.500' : 'red.500'}
                />
                <Text fontSize="sm" fontWeight="medium">
                  {isInitializing ? 'Checking Balance...' : 'Balance Check'}
                </Text>
              </HStack>
              <Text fontSize="sm">
                {balance ? balance.formatted : isInitializing ? '...' : '0.00'} {stablecoinConfig.symbol}
              </Text>
            </HStack>

            {!isInitializing && !sufficientBalance && (
              <Text fontSize="xs" color="red.600" mt={1}>
                Insufficient {stablecoinConfig.symbol} balance. Required: {requiredAmount} {stablecoinConfig.symbol}
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
                step={stablecoinConfig.decimals === 6 ? "0.000001" : "0.000000000000000001"}
              />
              <FormHelperText>
                Minimum required: {requiredAmount} {stablecoinConfig.symbol}
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
              Approve {approvalAmount} {stablecoinConfig.symbol}
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
                {allowance ? `Approved: ${allowance.formatted} ${stablecoinConfig.symbol}` : `${stablecoinConfig.symbol} spending approved`}
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
            💡 You need to approve {stablecoinConfig.symbol} spending before creating escrows.
            This is a one-time transaction that allows the escrow contract to transfer your {stablecoinConfig.symbol}.
          </Text>
        </Box>
      </VStack>
    </Box>
  );
};

export default PSP22StablecoinApproval;