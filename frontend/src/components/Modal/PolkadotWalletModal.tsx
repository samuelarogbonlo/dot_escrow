import React, { useState, useEffect } from "react";
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
  Spinner,
  Progress,
  Box,
  useToast,
} from "@chakra-ui/react";
import { CheckIcon, WarningIcon, TimeIcon } from "@chakra-ui/icons";
import {
  validatePolkadotAddress,
  ValidationResult,
} from "@/utils/polkadotValidator";
import { useWallet } from "@/hooks/useWalletContext";
import useTokenDistribution from "@/hooks/useTokenDistribution";
import { substrateToH160 } from "@/utils/substrateToH160";

interface PolkadotWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PolkadotWalletModal: React.FC<PolkadotWalletModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { selectedAccount, api } = useWallet();
  const [walletAddress, setWalletAddress] = useState("");
  const [validation, setValidation] = useState<ValidationResult>({
    isValid: false,
  });
  const [isValidating, setIsValidating] = useState(false);
  const [claimStatus, setClaimStatus] = useState<any>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const toast = useToast();
  const subTextColor = useColorModeValue("gray.600", "gray.300");
  const errorColor = useColorModeValue("red.500", "red.300");
  const successColor = useColorModeValue("green.500", "green.300");

  const {
    isLoading,
    error,
    config,
    claimTokens,
    checkClaimStatus,
    clearError,
    formatTimeRemaining,
  } = useTokenDistribution({
    api,
    selectedAccount: selectedAccount as any,
  });

  useEffect(() => {
    if (!walletAddress.trim()) {
      setValidation({ isValid: false });
      setIsValidating(false);
      setClaimStatus(null);
      return;
    }

    setIsValidating(true);
    const timeoutId = setTimeout(async () => {
      const result = validatePolkadotAddress(walletAddress);
      setValidation(result);
      setIsValidating(false);

      // Check claim status if address is valid - DIRECT CALL
      if (result.isValid && checkClaimStatus) {
        setCheckingStatus(true);
        try {
          const addressCheck = result.normalizedAddress || walletAddress;

          const h160TargetAddressCheck = substrateToH160(addressCheck);
          const status = await checkClaimStatus(h160TargetAddressCheck);
          setClaimStatus(status);
        } catch (error) {
          console.error("Failed to check claim status:", error);
          setClaimStatus(null);
        } finally {
          setCheckingStatus(false);
        }
      } else {
        setClaimStatus(null);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [walletAddress]);
  // Clear error when modal opens
  useEffect(() => {
    if (isOpen) {
      clearError();
    }
  }, [isOpen, clearError]);

  const handleClose = () => {
    onClose();
    setWalletAddress("");
    setValidation({ isValid: false });
    setClaimStatus(null);
    clearError();
  };

  const handleSubmit = async () => {
    if (!validation.isValid || !selectedAccount || !api) return;

    try {
      const targetAddress = validation.normalizedAddress || walletAddress;
      const success = await claimTokens(targetAddress);

      if (success) {
        toast({
          title: "Tokens Claimed Successfully!",
          description: `Tokens have been sent to ${targetAddress}`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        handleClose();
      }
    } catch (error) {
      console.error("Failed to claim tokens:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && validation.isValid && !isLoading) {
      handleSubmit();
    }
  };

  const getInputRightElement = () => {
    if (isValidating || checkingStatus) {
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

  const canSubmit =
    validation.isValid &&
    claimStatus?.canClaim &&
    !isLoading &&
    selectedAccount &&
    api;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" isCentered>
      <ModalOverlay bg="blackAlpha.900" />
      <ModalContent mx={4}>
        <ModalHeader>
          <VStack align="start" spacing={2}>
            <Text fontSize="xl" fontWeight="bold">
              Claim Test Tokens
            </Text>
            <Text fontSize="sm" color={subTextColor} fontWeight="normal">
              Enter a Polkadot wallet address to receive test tokens from the
              faucet.
            </Text>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <VStack spacing={4}>
            {/* Faucet Status */}
            {config && (
              <Box
                w="full"
                p={3}
                bg={useColorModeValue("gray.50", "gray.800")}
                borderRadius="md"
              >
                <VStack spacing={2} align="start">
                  <Text fontSize="sm" fontWeight="medium">
                    Faucet Status
                  </Text>
                  <HStack justify="space-between" w="full">
                    <Text fontSize="xs" color={subTextColor}>
                      Distribution Amount:
                    </Text>
                    <Badge colorScheme="blue">
                      {config.distributionAmount} tokens
                    </Badge>
                  </HStack>
                  <HStack justify="space-between" w="full">
                    <Text fontSize="xs" color={subTextColor}>
                      Cooldown Period:
                    </Text>
                    <Badge colorScheme="orange">
                      {Math.floor(parseInt(config.cooldownPeriod) / 3600)}h
                    </Badge>
                  </HStack>
                  <HStack justify="space-between" w="full">
                    <Text fontSize="xs" color={subTextColor}>
                      Status:
                    </Text>
                    <Badge colorScheme={config.paused ? "red" : "green"}>
                      {config.paused ? "Paused" : "Active"}
                    </Badge>
                  </HStack>
                </VStack>
              </Box>
            )}

            <FormControl
              isInvalid={walletAddress.trim() !== "" && !validation.isValid}
            >
              <FormLabel fontSize="sm" fontWeight="medium">
                Recipient Wallet Address
              </FormLabel>
              <InputGroup>
                <Input
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter Polkadot address (e.g., 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa)"
                  size="md"
                  focusBorderColor="pink.500"
                  errorBorderColor="red.500"
                  isDisabled={isLoading}
                />
                <InputRightElement>{getInputRightElement()}</InputRightElement>
              </InputGroup>
              <Text fontSize="xs" color={subTextColor} mt={2}>
                Supports Polkadot, Kusama, and other Substrate-based addresses
              </Text>
            </FormControl>

            {/* Loading Progress */}
            {isLoading && (
              <Box w="full">
                <Text fontSize="sm" mb={2} color={subTextColor}>
                  Processing claim...
                </Text>
                <Progress size="sm" isIndeterminate colorScheme="pink" />
              </Box>
            )}

            {/* Error Display */}
            {error && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <VStack align="start" spacing={1} flex={1}>
                  <AlertDescription fontSize="sm" fontWeight="medium">
                    {error.message}
                  </AlertDescription>
                  <Text fontSize="xs" color={subTextColor}>
                    Error Code: {error.code}
                  </Text>
                </VStack>
              </Alert>
            )}

            {/* Validation Status */}
            {walletAddress.trim() &&
              !isValidating &&
              !checkingStatus &&
              validation.isValid &&
              claimStatus && (
                <Alert
                  status={claimStatus.canClaim ? "success" : "warning"}
                  borderRadius="md"
                >
                  <AlertIcon />
                  <VStack align="start" spacing={1} flex={1}>
                    <AlertDescription fontSize="sm">
                      {claimStatus.canClaim
                        ? "Ready to claim tokens!"
                        : "Cannot claim tokens at this time"}
                    </AlertDescription>
                    <HStack spacing={4} fontSize="xs">
                      {validation.network && (
                        <HStack>
                          <Text color={subTextColor}>Network:</Text>
                          <Badge colorScheme="green" size="sm">
                            {validation.network}
                          </Badge>
                        </HStack>
                      )}
                    </HStack>
                    {!claimStatus.canClaim &&
                      claimStatus.timeUntilNextClaim > 0 && (
                        <HStack>
                          <Icon as={TimeIcon} color={subTextColor} />
                          <Text color={subTextColor}>
                            Next claim in:{" "}
                            {formatTimeRemaining(
                              claimStatus.timeUntilNextClaim
                            )}
                          </Text>
                        </HStack>
                      )}
                  </VStack>
                </Alert>
              )}

            {/* Address Validation Error */}
            {walletAddress.trim() &&
              !isValidating &&
              !validation.isValid &&
              validation.error && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  <AlertDescription fontSize="sm">
                    {validation.error}
                  </AlertDescription>
                </Alert>
              )}

            {/* Connection Status */}
            {!selectedAccount && (
              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <AlertDescription fontSize="sm">
                  Please connect your wallet to claim tokens.
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
              isDisabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              colorScheme="pink"
              onClick={handleSubmit}
              flex={1}
              isDisabled={!canSubmit}
              isLoading={isLoading}
              loadingText="Claiming..."
            >
              {claimStatus?.canClaim === false
                ? `Wait ${formatTimeRemaining(
                    claimStatus?.timeUntilNextClaim || 0
                  )}`
                : "Claim Tokens"}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default PolkadotWalletModal;
