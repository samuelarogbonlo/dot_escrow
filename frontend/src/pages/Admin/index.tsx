import { useState, useEffect, useMemo } from 'react';
import { ContractPromise } from "@polkadot/api-contract";

import {
  Box,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Text,
  VStack,
  useToast,
  useColorModeValue
} from '@chakra-ui/react';
import { useWallet } from '../../hooks/useWalletContext';
import { ESCROW_CONTRACT_ABI, ESCROW_CONTRACT_ADDRESS } from '../../contractABI/EscrowABI';
import { useNavigate } from 'react-router-dom';

// Import dashboard components
import Overview from './sections/Overview';
import ActionQueue from './sections/ActionQueue';
import KeyManagement from './sections/KeyManagement';
import AuditTrail from './sections/AuditTrail';

interface AdminData {
  contractState?: any;
  pendingProposals?: any[];
  signerInfo?: any;
  auditHistory?: any[];
}

const AdminDashboard = () => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const { selectedAccount, isExtensionReady, api } = useWallet();
  const navigate = useNavigate();
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.900');

  const contract = useMemo(() => {
      if (!api) return;
      return new ContractPromise(api as any, ESCROW_CONTRACT_ABI as any, ESCROW_CONTRACT_ADDRESS);
    }, [api]);

  // Check if connected wallet is an admin
  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!isExtensionReady || !selectedAccount?.address) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Call contract to get admin list
        // const response = await contract.query({
        //   get_admins: {}
        // });

        const adminList = ["5GmTdVqX6BA8hWDDjDAv6umDYogTZiwFVCbVKn2vkGYhLM6M", "5GmTdVqX6BA8hWDDjDAv6umDYogTZiwFVCbVKn2vkGYhLM6M"];
        const userIsAdmin = adminList.some(
          admin => admin.toLowerCase() === selectedAccount?.address?.toLowerCase()
        );

        if (userIsAdmin) {
          setIsAdmin(true);
          // Fetch additional admin data
          await fetchAdminData();
        } else {
          setIsAdmin(false);
          toast({
            title: 'Access Denied',
            description: 'Your wallet is not authorized for admin access.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          // Redirect to main dashboard
          setTimeout(() => navigate('/'), 2000);
        }
      } catch (error: any) {
        console.error('Error checking admin access:', error);
        toast({
          title: 'Error',
          description: error?.message || 'Failed to verify admin access. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAccess();
  }, [isExtensionReady, selectedAccount, contract, navigate, toast]);

  // Fetch comprehensive admin data
  const fetchAdminData = async (): Promise<void> => {
    try {
      // Mock data for now since contract doesn't have these methods yet
      const mockData: AdminData = {
        contractState: {
          fee_bps: 250,
          contract_balance: '15750.50',
          is_paused: false,
          total_escrows: 1247,
          active_escrows: 89,
          total_volume: '2847392.75'
        },
        pendingProposals: [],
        signerInfo: {
          signers: [],
          threshold: 1,
          total_signers: 1
        },
        auditHistory: []
      };

      setAdminData(mockData);
    } catch (error: any) {
      console.error('Error fetching admin data:', error);
      toast({
        title: 'Data Fetch Error',
        description: error?.message || 'Some admin data could not be loaded.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Refresh data function to pass to child components
  const refreshData = () => {
    fetchAdminData();
  };

  // Loading state
  if (isLoading) {
    return (
      <Box textAlign="center" py={20}>
        <Spinner size="xl" color="blue.500" />
        <Text mt={4} fontSize="lg">Verifying admin access...</Text>
      </Box>
    );
  }

  // Access denied state
  if (!isAdmin) {
    return (
      <Box maxW="600px" mx="auto" mt={20}>
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          <Box>
            <AlertTitle>Access Denied!</AlertTitle>
            <AlertDescription>
              Your wallet address is not authorized to access the admin dashboard. 
              Only multisig signers can access this area. You will be redirected shortly.
            </AlertDescription>
          </Box>
        </Alert>
      </Box>
    );
  }

  return (
    <Box bg={bgColor} minH="100vh">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2}>Admin Dashboard</Heading>
          <Text color="gray.600">
            Manage escrow contract settings, proposals, and multisig operations
          </Text>
        </Box>

        {/* Warning Banner */}
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>Admin Access Active</AlertTitle>
            <AlertDescription>
              You are accessing sensitive contract management functions. 
              All actions require multisig approval and are permanently logged.
            </AlertDescription>
          </Box>
        </Alert>

        {/* Main Dashboard Tabs */}
        <Tabs variant="enclosed" colorScheme="blue" isLazy>
          <TabList>
            <Tab>Overview</Tab>
            <Tab>
              Action Queue 
              {adminData?.pendingProposals && adminData.pendingProposals.length > 0 && (
                <Box
                  as="span"
                  ml={2}
                  px={2}
                  py={1}
                  bg="red.500"
                  color="white"
                  borderRadius="full"
                  fontSize="xs"
                >
                  {adminData.pendingProposals.length}
                </Box>
              )}
            </Tab>
            <Tab>Key Management</Tab>
            <Tab>Audit Trail</Tab>
          </TabList>

          <TabPanels>
            <TabPanel p={0} pt={6}>
              <Overview 
                data={adminData?.contractState} 
                pendingCount={adminData?.pendingProposals?.length || 0}
                onRefresh={refreshData}
              />
            </TabPanel>

            <TabPanel p={0} pt={6}>
              <ActionQueue 
                proposals={adminData?.pendingProposals || []}
                onRefresh={refreshData}
              />
            </TabPanel>

            <TabPanel p={0} pt={6}>
              <KeyManagement 
                signerInfo={adminData?.signerInfo}
                onRefresh={refreshData}
              />
            </TabPanel>

            <TabPanel p={0} pt={6}>
              <AuditTrail 
                events={adminData?.auditHistory || []}
                onRefresh={refreshData}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  );
};

export default AdminDashboard;