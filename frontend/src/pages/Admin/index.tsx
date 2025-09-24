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
import { useAdminGovernance } from '../../hooks/useAdminGovernance';
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
  const governance = useAdminGovernance({ api, account: selectedAccount as any });
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
        const userIsAdmin = await governance.isAdminSigner(selectedAccount.address);

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
      // Read from contract
      const [signers, threshold, proposals] = await Promise.all([
        governance.getAdminSigners(),
        governance.getSignatureThreshold(),
        governance.listProposals(),
      ]);

      // Try fetching summary via get_contract_info if available
      let contractState: any = {};
      try {
        if (contract?.query?.getContractInfo) {
          const q: any = await (contract as any).query.getContractInfo(selectedAccount?.address, { value: 0, gasLimit: -1 });
          const data = q?.output?.toJSON?.() ?? q?.output;
          if (Array.isArray(data) && data.length >= 4) {
            contractState = { owner: data[0], fee_bps: data[1], is_paused: data[2], total_volume: data[3] };
          }
        } else if ((contract as any)?.query?.get_contract_info) {
          const q: any = await (contract as any).query.get_contract_info(selectedAccount?.address, { value: 0, gasLimit: -1 });
          const data = q?.output?.toJSON?.() ?? q?.output;
          if (Array.isArray(data) && data.length >= 4) {
            contractState = { owner: data[0], fee_bps: data[1], is_paused: data[2], total_volume: data[3] };
          }
        }
      } catch {}

      setAdminData({
        contractState,
        pendingProposals: proposals.map((p: any) => ({
          id: p.id,
          type: typeof p.action === 'object' ? Object.keys(p.action)[0] : String(p.action),
          title: typeof p.action === 'object' ? Object.keys(p.action)[0] : String(p.action),
          description: '',
          proposer: p.created_by,
          created_at: new Date(Number(p.created_at)).toISOString(),
          expires_at: '',
          approvals: (p.approvals || []).map((a: any) => String(a)),
          required_approvals: Number(threshold),
          status: p.executed ? 'executed' : 'pending',
          data: p.action,
        })),
        signerInfo: {
          signers,
          threshold: Number(threshold),
          total_signers: signers.length,
        },
        auditHistory: [],
      });
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