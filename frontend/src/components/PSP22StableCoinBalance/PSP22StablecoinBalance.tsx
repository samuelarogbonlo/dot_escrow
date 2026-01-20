// components/PSP22/PSP22StablecoinBalance.tsx
import React from "react";
import {
  Box,
  Text,
  Button,
  Flex,
  Skeleton,
  Alert,
  AlertIcon,
  Badge,
  Icon,
  Tooltip,
  useColorModeValue,
} from "@chakra-ui/react";
import { FiRefreshCw, FiDollarSign, FiShield } from "react-icons/fi";
import { usePSP22StablecoinContract, PASETHUB_NETWORK_STABLECOINS } from "../../hooks/usePSP22StablecoinContract";

interface PSP22StablecoinBalanceProps {
  stablecoinKey?: keyof typeof PASETHUB_NETWORK_STABLECOINS;
  showRefresh?: boolean;
  showApprovalStatus?: boolean;
  requiredAmount?: string;
  compact?: boolean;
}

// Utility function to format numbers with commas and 2 decimal places
const formatNumberWithCommas = (value: string | number): string => {
  const num = typeof value === 'number' ? value : parseFloat(value);
  // Format with 2 decimal places
  const formatted = num.toFixed(2);
  const parts = formatted.split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${integerPart}.${parts[1]}`;
};

export const PSP22StablecoinBalance: React.FC<PSP22StablecoinBalanceProps> = ({
  stablecoinKey = 'TEST_USDT',
  showRefresh = true,
  showApprovalStatus = false,
  requiredAmount,
  compact = false,
}) => {
  const {
    stablecoinConfig,
    balance,
    allowance,
    isLoading,
    error,
    getBalance,
    getAllowance,
    checkSufficientBalance,
    checkSufficientAllowance,
    contractExists,
  } = usePSP22StablecoinContract(stablecoinKey);

  // Show loading state while contract is initializing (balance is null and no error)
  const isInitializing = balance === null && !error && contractExists !== false;

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const handleRefresh = async () => {
    await Promise.all([getBalance(), getAllowance()]);
  };

  const sufficientBalance = requiredAmount
    ? checkSufficientBalance(requiredAmount)
    : true;
  const sufficientAllowance = requiredAmount
    ? checkSufficientAllowance(requiredAmount)
    : true;

  // Format balance for display
  const formattedBalance = balance 
    ? formatNumberWithCommas(balance.formatted) 
    : "0.00";

  // Format required amount for display
  const formattedRequiredAmount = requiredAmount 
    ? formatNumberWithCommas(requiredAmount) 
    : null;

  // Format allowance for display
  const formattedAllowance = allowance?.formatted 
    ? formatNumberWithCommas(allowance.formatted) 
    : "0.00";


  if (compact) {
    return (
      <Flex align="center" gap={2}>
        <Icon as={FiDollarSign} color="green.500" />
        {isLoading || isInitializing ? (
          <Skeleton height="20px" width="60px" />
        ) : (
          <Text fontWeight="medium">
            {formattedBalance} {stablecoinConfig.symbol}
          </Text>
        )}
        {showRefresh && (
          <Button
            size="xs"
            variant="ghost"
            onClick={handleRefresh}
            isLoading={isLoading}
          >
            <Icon as={FiRefreshCw} />
          </Button>
        )}
      </Flex>
    );
  }

  return (
    <Box
      p={4}
      mb={8}
      borderWidth="1px"
      borderRadius="md"
      bg={bgColor}
      borderColor={borderColor}
    >
      <Flex justify="space-between" align="center" mb={3}>
        <Text fontSize="sm" fontWeight="medium" color="gray.600">
          {stablecoinConfig.name} Balance
        </Text>
        {showRefresh && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRefresh}
            isLoading={isLoading}
            leftIcon={<Icon as={FiRefreshCw} />}
          />
        )}
      </Flex>

      {error && (
        <Alert status="error" size="sm" mb={3} borderRadius="md">
          <AlertIcon />
          <Text fontSize="sm">{error}</Text>
        </Alert>
      )}

      <Flex align="center" justify="space-between" mb={2}>
        {isLoading || isInitializing ? (
          <Skeleton height="24px" width="100px" />
        ) : (
          <Text fontSize="xl" fontWeight="bold">
            {formattedBalance} {stablecoinConfig.symbol}
          </Text>
        )}

        {requiredAmount && (
          <Badge
            colorScheme={sufficientBalance ? "green" : "red"}
            variant="subtle"
          >
            {sufficientBalance ? "Sufficient" : "Insufficient"}
          </Badge>
        )}
      </Flex>

      {requiredAmount && (
        <Text fontSize="sm" color="gray.600" mb={2}>
          Required: {formattedRequiredAmount} {stablecoinConfig.symbol}
        </Text>
      )}

      {/* Display token info if available */}
      {stablecoinConfig.description && (
        <Text fontSize="xs" color="gray.500" mb={2}>
          {stablecoinConfig.description}
        </Text>
      )}

      {showApprovalStatus && (
        <Box mt={3} pt={3} borderTopWidth="1px" borderColor={borderColor}>
          <Flex align="center" justify="space-between">
            <Flex align="center" gap={2}>
              <Icon
                as={FiShield}
                color={allowance?.isApproved ? "green.500" : "orange.500"}
              />
              <Text fontSize="sm" fontWeight="medium">
                Approval Status
              </Text>
            </Flex>

            <Tooltip
              label={
                allowance?.isApproved
                  ? `Approved: ${formattedAllowance} ${stablecoinConfig.symbol}`
                  : "Not approved for escrow contract"
              }
            >
              <Badge
                colorScheme={allowance?.isApproved ? "green" : "orange"}
                variant="subtle"
                cursor="help"
              >
                {allowance?.isApproved ? "Approved" : "Not Approved"}
              </Badge>
            </Tooltip>
          </Flex>

          {requiredAmount && !sufficientAllowance && allowance?.isApproved && (
            <Text fontSize="xs" color="orange.600" mt={1}>
              Approved amount insufficient for transaction
            </Text>
          )}
        </Box>
      )}
    </Box>
  );
};

export default PSP22StablecoinBalance;