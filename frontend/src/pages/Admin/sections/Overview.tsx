import React from 'react';
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
} from '@chakra-ui/react';
import {
  FiDollarSign,
  FiSettings,
  FiPause,
  FiPlay,
  FiAlertTriangle,
  FiRefreshCw,
  FiShield
} from 'react-icons/fi';

interface OverviewProps {
  data?: any;
  pendingCount: number;
  onRefresh: () => void;
}

const Overview: React.FC<OverviewProps> = ({ data, pendingCount, onRefresh }) => {
  const cardBg = useColorModeValue('white', 'gray.700');
  const statBg = useColorModeValue('blue.50', 'blue.900');
  const warningBg = useColorModeValue('orange.50', 'orange.900');

  // Mock data if none provided (for development)
  const contractData = data || {
    fee_bps: 250, // 2.5%
    contract_balance: '15750.50',
    is_paused: false,
    total_escrows: 1247,
    active_escrows: 89,
    total_volume: '2847392.75'
  };

  const formatCurrency = (amount: string | number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(Number(amount));
  };

  const formatBPS = (bps: number): string => {
    return `${(bps / 100).toFixed(2)}%`;
  };

  return (
    <VStack spacing={6} align="stretch">
      {/* Contract Status Alert */}
      {contractData.is_paused && (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">Contract is Paused</Text>
            <Text fontSize="sm">
              All escrow operations are currently suspended. Check Action Queue for pending proposals.
            </Text>
          </Box>
        </Alert>
      )}

      {/* Key Metrics Grid */}
      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={6}>
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
            <StatNumber fontSize="2xl">{contractData.active_escrows}</StatNumber>
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
                  <Text fontWeight="bold">{contractData.total_escrows?.toLocaleString()}</Text>
                </HStack>
                
                <HStack justify="space-between">
                  <Text>Total Volume Processed:</Text>
                  <Text fontWeight="bold">{formatCurrency(contractData.total_volume)}</Text>
                </HStack>
                
                <HStack justify="space-between">
                  <Text>Platform Fees Collected:</Text>
                  <Text fontWeight="bold">
                    {formatCurrency((contractData.total_volume * contractData.fee_bps) / 10000)}
                  </Text>
                </HStack>
                
                <Divider />
                
                <HStack justify="space-between">
                  <Text>Success Rate:</Text>
                  <Badge colorScheme="green" fontSize="sm">98.7%</Badge>
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

      {/* Quick Actions */}
      <Card bg={cardBg} variant="outline">
        <CardBody>
          <Heading size="md" mb={4}>Quick Actions</Heading>
          <Text fontSize="sm" color="gray.600" mb={4}>
            Common administrative tasks. All actions require multisig approval.
          </Text>
          
          <HStack spacing={4} flexWrap="wrap">
            <Button
              colorScheme={contractData.is_paused ? "green" : "orange"}
              leftIcon={<Icon as={contractData.is_paused ? FiPlay : FiPause} />}
            >
              {contractData.is_paused ? "Resume Contract" : "Pause Contract"}
            </Button>
            
            <Button
              colorScheme="blue"
              variant="outline"
              leftIcon={<Icon as={FiSettings} />}
            >
              Update Fee Rate
            </Button>
            
            <Button
              colorScheme="purple"
              variant="outline"
              leftIcon={<Icon as={FiShield} />}
            >
              Emergency Withdraw
            </Button>
          </HStack>
        </CardBody>
      </Card>
    </VStack>
  );
};

export default Overview;