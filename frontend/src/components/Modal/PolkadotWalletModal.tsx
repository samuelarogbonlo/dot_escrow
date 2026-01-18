import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Text,
  VStack,
  HStack,
  Button,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertDescription,
  Badge,
  Spinner,
  Box,
  useToast,
} from "@chakra-ui/react";
import { CheckCircleIcon } from "@chakra-ui/icons";
import { useWallet } from "@/hooks/useWalletContext";
import useTokenDistribution from "@/hooks/useTokenDistribution";

interface PolkadotWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ClaimState = "idle" | "loading" | "success" | "error";

const PolkadotWalletModal: React.FC<PolkadotWalletModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { selectedAccount, api } = useWallet();
  const [claimState, setClaimState] = useState<ClaimState>("idle");
  const [newBalance, setNewBalance] = useState<string | null>(null);

  const toast = useToast();
  const subTextColor = useColorModeValue("gray.600", "gray.300");
  const successBg = useColorModeValue("green.50", "green.900");

  const {
    isLoading,
    error,
    config,
    claimTokens,
    getTokenBalance,
    clearError,
  } = useTokenDistribution({
    api,
    selectedAccount: selectedAccount as any,
  });

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setClaimState("idle");
      setNewBalance(null);
      clearError();
    }
  }, [isOpen, clearError]);

  // Update claim state based on loading/error
  useEffect(() => {
    if (isLoading) {
      setClaimState("loading");
    } else if (error) {
      setClaimState("error");
    }
  }, [isLoading, error]);

  const handleClose = () => {
    onClose();
    setClaimState("idle");
    setNewBalance(null);
    clearError();
  };

  const handleClaim = async () => {
    if (!selectedAccount || !api) return;

    setClaimState("loading");
    clearError();

    try {
      // Claim using logged-in wallet address (no need to pass address)
      const success = await claimTokens();

      if (success) {
        // Fetch updated balance
        const balance = await getTokenBalance();
        if (balance) {
          // Format balance (assuming 12 decimals)
          const formatted = (parseInt(balance) / 1e12).toFixed(2);
          setNewBalance(formatted);
        }
        setClaimState("success");
        toast({
          title: "Tokens Claimed!",
          description: "Test tokens have been added to your wallet.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        setClaimState("error");
      }
    } catch (err) {
      console.error("Failed to claim tokens:", err);
      setClaimState("error");
    }
  };

  const formatDistributionAmount = (amount: string) => {
    // Convert from smallest unit (12 decimals) to readable format
    const num = parseInt(amount) / 1e12;
    return num.toLocaleString();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md" isCentered>
      <ModalOverlay bg="blackAlpha.900" />
      <ModalContent mx={4}>
        <ModalHeader>
          <Text fontSize="xl" fontWeight="bold">
            Claim Test Tokens
          </Text>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <VStack spacing={4}>
            {/* Success State */}
            {claimState === "success" && (
              <Box
                w="full"
                p={6}
                bg={successBg}
                borderRadius="lg"
                textAlign="center"
              >
                <VStack spacing={3}>
                  <CheckCircleIcon boxSize={12} color="green.500" />
                  <Text fontSize="lg" fontWeight="bold" color="green.500">
                    Tokens Claimed Successfully!
                  </Text>
                  {newBalance && (
                    <VStack spacing={1}>
                      <Text fontSize="sm" color={subTextColor}>
                        New Balance
                      </Text>
                      <Text fontSize="2xl" fontWeight="bold">
                        {newBalance} USDT
                      </Text>
                    </VStack>
                  )}
                </VStack>
              </Box>
            )}

            {/* Loading State */}
            {claimState === "loading" && (
              <Box w="full" p={6} textAlign="center">
                <VStack spacing={4}>
                  <Spinner size="xl" color="pink.500" thickness="4px" />
                  <Text fontSize="md" color={subTextColor}>
                    Claiming tokens...
                  </Text>
                  <Text fontSize="sm" color={subTextColor}>
                    Please approve the transaction in your wallet
                  </Text>
                </VStack>
              </Box>
            )}

            {/* Idle State - Show claim info */}
            {claimState === "idle" && (
              <>
                {/* Faucet Info */}
                {config && (
                  <Box
                    w="full"
                    p={4}
                    bg={useColorModeValue("gray.50", "gray.800")}
                    borderRadius="md"
                  >
                    <VStack spacing={3}>
                      <Text fontSize="sm" fontWeight="medium">
                        Faucet Details
                      </Text>
                      <HStack justify="space-between" w="full">
                        <Text fontSize="sm" color={subTextColor}>
                          Amount:
                        </Text>
                        <Badge colorScheme="green" fontSize="md" px={3} py={1}>
                          {formatDistributionAmount(config.distributionAmount)} USDT
                        </Badge>
                      </HStack>
                      <HStack justify="space-between" w="full">
                        <Text fontSize="sm" color={subTextColor}>
                          Recipient:
                        </Text>
                        <Text fontSize="xs" fontFamily="mono" isTruncated maxW="200px">
                          {selectedAccount?.address || "Not connected"}
                        </Text>
                      </HStack>
                    </VStack>
                  </Box>
                )}

                {/* Connection Warning */}
                {!selectedAccount && (
                  <Alert status="warning" borderRadius="md">
                    <AlertIcon />
                    <AlertDescription fontSize="sm">
                      Please connect your wallet to claim tokens.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}

            {/* Error State */}
            {claimState === "error" && error && (
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
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3} w="full">
            {claimState === "success" ? (
              <Button colorScheme="green" onClick={handleClose} flex={1}>
                Done
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  flex={1}
                  isDisabled={claimState === "loading"}
                >
                  Cancel
                </Button>
                <Button
                  colorScheme="pink"
                  onClick={handleClaim}
                  flex={1}
                  isDisabled={!selectedAccount || !api || claimState === "loading"}
                  isLoading={claimState === "loading"}
                  loadingText="Claiming..."
                >
                  Claim Tokens
                </Button>
              </>
            )}
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default PolkadotWalletModal;
