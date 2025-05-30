import { useState, useEffect } from 'react';
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
} from '@chakra-ui/react';
import { FiPlus, FiDollarSign, FiCheckCircle, FiClock, FiAlertCircle } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';

import { useWallet } from '../../hooks/useWalletContext';
import { EscrowData } from '../../hooks/useEscrowContract';

import StatCard from '../../components/Card/StatCard';
import EscrowCard from '../../components/Card/EscrowCard';

const Dashboard = () => {
  const { isExtensionReady, selectedAccount, listEscrows } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [escrows, setEscrows] = useState<EscrowData[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isExtensionReady || !selectedAccount) {
      navigate('/connect');
    }
  }, [isExtensionReady, selectedAccount, navigate]);

  useEffect(() => {
    const fetchEscrows = async () => {
      if (!isExtensionReady || !selectedAccount) return;

      setIsLoading(true);
      setError(null);

      try {
        const result = await listEscrows();
        if (result.success) {
          setEscrows(result.escrows);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError('Failed to load escrows. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEscrows();
  }, [isExtensionReady, selectedAccount, listEscrows]);

 const stats = {
  activeEscrows: escrows.filter(e => e.status === 'Active').length,

  totalValue: escrows
    .filter(e => e.status === 'Active') // Only active escrows
    .reduce((sum, escrow) => sum + Number(escrow.totalAmount), 0)
    .toLocaleString(),

  completedEscrows: escrows.filter(e => e.status === 'Completed').length,

  pendingMilestones: escrows.reduce((sum, escrow) => {
    return (
      sum +
      escrow.milestones.filter(
        m => m.status === 'Pending' || m.status === 'InProgress'
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

      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
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
        <Heading size="md" mb={4}>Your Escrows</Heading>

        {isLoading ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {[1, 2, 3].map(i => (
              <Skeleton key={i} height="200px" borderRadius="lg" />
            ))}
          </SimpleGrid>
        ) : escrows.length > 0 ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {escrows.map(escrow => (
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
