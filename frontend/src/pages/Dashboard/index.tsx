import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Flex,
  Button,
  Icon,
  Skeleton,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import {
  FiPlus,
  FiDollarSign,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";

import { useWallet } from "../../hooks/useWalletContext";
import { EscrowData } from "../../hooks/useEscrowContract";

import StatCard from "../../components/Card/StatCard";
import EscrowCard from "../../components/Card/EscrowCard";
import PSP22StablecoinBalance from "@/components/PSP22StableCoinBalance/PSP22StablecoinBalance";

const Dashboard = () => {
  const { isExtensionReady, selectedAccount, listEscrows } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [escrows, setEscrows] = useState<EscrowData[]>([]);


  // Use the PSP22 hook

  const navigate = useNavigate();

  useEffect(() => {
    if (!isExtensionReady || !selectedAccount) {
      navigate("/connect");
    }
  }, [isExtensionReady, selectedAccount, navigate]);

  // Memoize the fetchEscrows function to prevent unnecessary re-renders
 const fetchEscrows = useCallback(async () => {
  if (!isExtensionReady || !selectedAccount) return;

  setIsLoading(true);
  setError(null);

  try {
    const result = await listEscrows();
    console.log('[Dashboard] listEscrows result:', result);
    
    if (result.success && result.escrows) {
      // Check if escrows is an array
      if (Array.isArray(result.escrows)) {
        // Filter escrows to show:
        // 1. All escrows where user is the creator (userAddress matches)
        // 2. Escrows where user is the counterparty AND status is "Active"
        const filteredEscrows = result.escrows.filter((e: any) => {
          const isUserCreator = e.creatorAddress === selectedAccount.address;
          const isUserCounterparty = e.counterpartyAddress === selectedAccount.address;
          const isActive = e.status === "Active";

          // Show if user created it, OR if user is counterparty and it's active
          return isUserCreator || (isUserCounterparty && isActive);
        });

        setEscrows(filteredEscrows);
      } else {
        console.warn('[Dashboard] Escrows is not an array:', result.escrows);
        setError('Invalid data format received from contract');
        setEscrows([]);
      }
    } else {
      // Handle the case where the contract call failed
      if (result.error) {
        console.error('[Dashboard] Contract error:', result.error);
        setError(`Contract error: ${result.error}`);
      } else {
        setError('No escrows data received');
      }
      setEscrows([]);
    }
  } catch (err) {
    setError("Failed to load escrows. Please try again.");
    console.error('[Dashboard] Error in fetchEscrows:', err);
    setEscrows([]);
  } finally {
    setIsLoading(false);
  }
}, [isExtensionReady, selectedAccount, listEscrows]);

  // Use the memoized function in useEffect
  useEffect(() => {
    fetchEscrows();
  }, [fetchEscrows]);

  const stats = {
    activeEscrows: escrows.filter((e) => e.status === "Active").length,

    totalValue: escrows
      .filter((e) => e.status === "Active")
      .reduce(
        (sum, escrow) => sum + Math.round(Number(escrow.totalAmount) / 1.01),
        0
      )
      .toLocaleString(),

    completedEscrows: escrows.filter((e) => e.status === "Completed").length,

    pendingMilestones: escrows.reduce((sum, escrow) => {
      return (
        sum +
        escrow.milestones.filter(
          (m) => m.status === "Pending" || m.status === "InProgress"
        ).length
      );
    }, 0),
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={8}>
        <Heading size="lg">Dashboard</Heading>
        <Button
          as={Link}
          to="/escrow/create"
          colorScheme="blue"
          leftIcon={<Icon as={FiPlus} />}
        >
          Create Escrow
        </Button>
      </Flex>

      {error && (
        <Alert status="error" mb={6} borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      )}

      <PSP22StablecoinBalance />

      <SimpleGrid columns={{ base: 2, md: 2, lg: 4 }} spacing={6} mb={8}>
        <StatCard
          label="Active Escrows"
          value={stats.activeEscrows}
          icon={FiClock}
          colorScheme="blue"
          isLoading={isLoading}
        />
        <StatCard
          label="Total Value Locked"
          value={stats.totalValue}
          icon={FiDollarSign}
          colorScheme="green"
          isLoading={isLoading}
        />
        <StatCard
          label="Completed Escrows"
          value={stats.completedEscrows}
          icon={FiCheckCircle}
          colorScheme="purple"
          isLoading={isLoading}
        />
        <StatCard
          label="Pending Milestones"
          value={stats.pendingMilestones}
          icon={FiAlertCircle}
          colorScheme="orange"
          isLoading={isLoading}
        />
      </SimpleGrid>

      <Box mb={8}>
        <Heading size="md" mb={4}>
          Your Escrows
        </Heading>

        {isLoading ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height="200px" borderRadius="lg" />
            ))}
          </SimpleGrid>
        ) : escrows.length > 0 ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {escrows.map((escrow) => (
              <EscrowCard key={escrow.id} escrow={escrow} />
            ))}
          </SimpleGrid>
        ) : (
          <>
            <Text color="gray.500">
              You don't have any escrow agreements yet.
            </Text>
            <Button
              mt={4}
              as={Link}
              to="/escrow/create"
              size="sm"
              variant="outline"
            >
              Create your first escrow
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
};

export default Dashboard;
