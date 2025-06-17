// components/USDT/USDTBalance.tsx
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
import { useUSDTContract } from "../../hooks/useUSDTContract";

interface USDTBalanceProps {
  showRefresh?: boolean;
  showApprovalStatus?: boolean;
  requiredAmount?: string;
  compact?: boolean;
}

export const USDTBalance: React.FC<USDTBalanceProps> = ({
  showRefresh = true,
  showApprovalStatus = false,
  requiredAmount,
  compact = false,
}) => {
  const {
    balance,
    allowance,
    isLoading,
    error,
    getBalance,
    getAllowance,
    checkSufficientBalance,
  
    checkSufficientAllowance,
  } = useUSDTContract();

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

  if (compact) {
    return (
      <Flex align="center" gap={2}>
        <Icon as={FiDollarSign} color="green.500" />
        {isLoading ? (
          <Skeleton height="20px" width="60px" />
        ) : (
          <Text fontWeight="medium">
            {balance ? `${balance.formatted} USDT` : "0.00 USDT"}
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
          USDT Balance
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
        {isLoading ? (
          <Skeleton height="24px" width="100px" />
        ) : (
          <Text fontSize="xl" fontWeight="bold">
            {balance ? balance.formatted : "0.00"} USDT
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
          Required: {requiredAmount} USDT
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
                  ? `Approved: ${allowance.formatted} USDT`
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

export default USDTBalance;
