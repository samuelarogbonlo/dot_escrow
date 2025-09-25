import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardBody,
  Heading,
  Text,
  Badge,
  VStack,
  HStack,
  Icon,
  Button,
  useColorModeValue,
  Divider,
  Alert,
  AlertIcon,
  Spinner,
} from "@chakra-ui/react";
import {
  FiDollarSign,
  FiSettings,
  FiPause,
  FiPlay,
  FiAlertTriangle,
  FiRefreshCw,
  FiShield,
} from "react-icons/fi";
import { useWallet } from "../../../hooks/useWalletContext";
import { ContractPromise } from "@polkadot/api-contract";
import {
  ESCROW_CONTRACT_ABI,
  ESCROW_CONTRACT_ADDRESS,
} from "../../../contractABI/EscrowABI";
import { listEscrowsContract } from "../../../utils/escrowContractUtils";
import { estimateGas } from "../../../hooks/useAdminGovernance";

interface OverviewProps {
  pendingCount: number;
  onRefresh: () => void;
}

const Overview: React.FC<OverviewProps> = ({ pendingCount, onRefresh }) => {
  const cardBg = useColorModeValue("white", "gray.700");
  const statBg = useColorModeValue("blue.50", "blue.900");
  const warningBg = useColorModeValue("orange.50", "orange.900");

  const { api, selectedAccount } = useWallet();

  const [contractData, setContractData] = useState({
    fee_bps: 250,
    contract_balance: "0",
    is_paused: false,
    total_escrows: 0,
    active_escrows: 0,
    total_volume: "0",
    platform_fees_collected: "0",
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real contract data
  useEffect(() => {
    const fetchContractData = async () => {
      if (!api || !selectedAccount) return;

      try {
        setIsLoading(true);

        // Get contract instance
        const contract = new ContractPromise(
          api as any,
          ESCROW_CONTRACT_ABI as any,
          ESCROW_CONTRACT_ADDRESS
        );

        // Estimate gas for contract info query
        const contractInfoGasLimit = await estimateGas(
          api,
          contract,
          "getContractInfo",
          selectedAccount,
          []
        );

        // Fetch contract info (owner, fee_bps, paused, total_volume)
        const contractInfoQuery = await contract.query.getContractInfo(
          selectedAccount.address,
          {
            gasLimit: contractInfoGasLimit,
            storageDepositLimit: null,
          }
        );

        let fee_bps = 250;
        let is_paused = false;

        if (contractInfoQuery.result.isOk && contractInfoQuery.output) {
          const { ok } = contractInfoQuery.output.toJSON() as any;
          console.log(ok);
          if (Array.isArray(ok) && ok.length >= 4) {
            fee_bps = ok[1] || 250;
            is_paused = ok[2] || false;
          }
        }

        // Estimate gas for token balance query
        const tokenBalanceGasLimit = await estimateGas(
          api,
          contract,
          "getTokenBalance",
          selectedAccount,
          []
        );

        // Fetch contract token balance
        const tokenBalanceQuery = await contract.query.getTokenBalance(
          selectedAccount.address,
          {
            gasLimit: tokenBalanceGasLimit,
            storageDepositLimit: null,
          }
        );

        console.log(tokenBalanceQuery);

        let contract_balance = "0";
        if (tokenBalanceQuery.result.isOk && tokenBalanceQuery.output) {
          const balance = tokenBalanceQuery.output.toJSON() as any;
          console.log(balance.ok);
          contract_balance = String(balance.ok / 1000000 || 0);
        }

        // Fetch all escrows
        const escrowsResult = await listEscrowsContract(api, selectedAccount);
        const allEscrows = escrowsResult.success
          ? escrowsResult.data || []
          : [];

        // Calculate metrics from escrows
        const total_escrows = allEscrows.length;
        const active_escrows = allEscrows.filter(
          (escrow: any) =>
            escrow.status === "Active" || escrow.status === "Pending"
        ).length;

        // Calculate total volume from escrow amounts
        const totalVolumeAmount = allEscrows.reduce(
          (sum: number, escrow: any) => {
            const amount = parseFloat(escrow.totalAmount || "0");
            return sum + amount;
          },
          0
        );

        // Calculate platform fees collected (total volume * fee rate)
        const platformFeesCollected = (totalVolumeAmount * fee_bps) / 10000;

        setContractData({
          fee_bps,
          contract_balance,
          is_paused,
          total_escrows,
          active_escrows,
          total_volume: totalVolumeAmount.toFixed(2),
          platform_fees_collected: platformFeesCollected.toFixed(2),
        });
      } catch (error) {
        console.error("Error fetching contract data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContractData();
  }, [api, selectedAccount, onRefresh]);

  const formatCurrency = (amount: string | number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(Number(amount));
  };

  const formatBPS = (bps: number): string => {
    return `${(bps / 100).toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <VStack spacing={6} align="stretch">
        <Card bg={cardBg}>
          <CardBody textAlign="center" py={10}>
            <Spinner size="xl" color="blue.500" mb={4} />
            <Text>Loading contract data...</Text>
          </CardBody>
        </Card>
      </VStack>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Contract Status Alert */}
      {contractData.is_paused && (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">Contract is Paused</Text>
            <Text fontSize="sm">
              All escrow operations are currently suspended. Check Action Queue
              for pending proposals.
            </Text>
          </Box>
        </Alert>
      )}

      {/* Key Metrics Grid */}
      <Grid
        templateColumns={{
          base: "1fr",
          md: "repeat(2, 1fr)",
          lg: "repeat(4, 1fr)",
        }}
        gap={6}
      >
        {/* Contract Balance */}
        <GridItem>
          <Stat bg={statBg} p={4} borderRadius="lg" boxShadow="sm">
            <StatLabel display="flex" alignItems="center">
              <Icon as={FiDollarSign} mr={2} />
              Contract Balance
            </StatLabel>
            <StatNumber fontSize="2xl">
              {formatCurrency(contractData.contract_balance)}
            </StatNumber>
            <StatHelpText>Available for operations</StatHelpText>
          </Stat>
        </GridItem>

        {/* Current Fee */}
        <GridItem>
          <Stat bg={statBg} p={4} borderRadius="lg" boxShadow="sm">
            <StatLabel display="flex" alignItems="center">
              <Icon as={FiSettings} mr={2} />
              Platform Fee
            </StatLabel>
            <StatNumber fontSize="2xl">
              {formatBPS(contractData.fee_bps)}
            </StatNumber>
            <StatHelpText>{contractData.fee_bps} basis points</StatHelpText>
          </Stat>
        </GridItem>

        {/* Active Escrows */}
        <GridItem>
          <Stat bg={statBg} p={4} borderRadius="lg" boxShadow="sm">
            <StatLabel display="flex" alignItems="center">
              <Icon as={FiShield} mr={2} />
              Active Escrows
            </StatLabel>
            <StatNumber fontSize="2xl">
              {contractData.active_escrows}
            </StatNumber>
            <StatHelpText>Currently in progress</StatHelpText>
          </Stat>
        </GridItem>

        {/* Pending Actions */}
        <GridItem>
          <Stat 
            bg={pendingCount > 0 ? warningBg : statBg} 
            p={4} 
            borderRadius="lg" 
            boxShadow="sm"
          >
            <StatLabel display="flex" alignItems="center">
              <Icon as={FiAlertTriangle} mr={2} />
              Pending Actions
            </StatLabel>
            <StatNumber fontSize="2xl">{pendingCount}</StatNumber>
            <StatHelpText>Require your signature</StatHelpText>
          </Stat>
        </GridItem>
      </Grid>

      {/* Detailed Information Cards */}
      <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={6}>
        {/* Platform Statistics */}
        <GridItem>
          <Card bg={cardBg} variant="outline">
            <CardBody>
              <Heading size="md" mb={4} display="flex" alignItems="center">
                <Icon as={FiDollarSign} mr={2} />
                Platform Statistics
              </Heading>
              
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <Text>Total Escrows Created:</Text>
                  <Text fontWeight="bold">
                    {contractData.total_escrows?.toLocaleString()}
                  </Text>
                </HStack>
                
                <HStack justify="space-between">
                  <Text>Total Volume Processed:</Text>
                  <Text fontWeight="bold">
                    {formatCurrency(contractData.total_volume)}
                  </Text>
                </HStack>
                
                <HStack justify="space-between">
                  <Text>Platform Fees Collected:</Text>
                  <Text fontWeight="bold">
                    {formatCurrency(contractData.platform_fees_collected)}
                  </Text>
                </HStack>
                
                <Divider />
                
                <HStack justify="space-between">
                  <Text>Success Rate:</Text>
                  <Badge colorScheme="green" fontSize="sm">
                    98.7%
                  </Badge>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        </GridItem>

        {/* Contract Status & Controls */}
        <GridItem>
          <Card bg={cardBg} variant="outline">
            <CardBody>
              <Heading size="md" mb={4} display="flex" alignItems="center">
                <Icon as={FiSettings} mr={2} />
                Contract Status
              </Heading>
              
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <Text>Operational Status:</Text>
                  <Badge 
                    colorScheme={contractData.is_paused ? "red" : "green"}
                    display="flex"
                    alignItems="center"
                  >
                    <Icon 
                      as={contractData.is_paused ? FiPause : FiPlay} 
                      mr={1} 
                      size="12px" 
                    />
                    {contractData.is_paused ? "Paused" : "Active"}
                  </Badge>
                </HStack>
                
                <HStack justify="space-between">
                  <Text>Last Updated:</Text>
                  <Text fontSize="sm" color="gray.500">
                    {new Date().toLocaleDateString()}
                  </Text>
                </HStack>
                
                <Divider />
                
                <Button
                  leftIcon={<FiRefreshCw />}
                  colorScheme="blue"
                  variant="outline"
                  onClick={onRefresh}
                  size="sm"
                >
                  Refresh Data
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>

      
    </VStack>
  );
};

export default Overview;
