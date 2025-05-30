import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Heading,
  Text,
  Grid,
  GridItem,
  Card,
  CardHeader,
  CardBody,
  Flex,
  VStack,
  HStack,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  IconButton,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Alert,
  AlertIcon,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  FiDownload,
  FiFilter,
  FiSearch,
  FiCalendar,
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiBarChart2,
  FiPieChart,
  FiActivity,
  FiClock,
  FiChevronDown,
  FiRefreshCw,
} from 'react-icons/fi';
import { useWallet } from '../../hooks/useWalletContext';

// Types for analytics data
interface EscrowStats {
  total: number;
  active: number;
  completed: number;
  disputed: number;
  cancelled: number;
  totalValue: number;
  avgEscrowValue: number;
  avgCompletionTime: number;
  disputeRate: number;
}

interface FinancialMetrics {
  totalEarned: number;
  totalSpent: number;
  totalFees: number;
  balance: number;
  pendingAmount: number;
  projectedIncome: number;
  monthlyAvgIncome: number;
  avgTransactionValue: number;
}

interface PerformanceMetrics {
  clientSatisfactionRate: number;
  onTimeDeliveryRate: number;
  responseTime: number;
  disputeResolutionTime: number;
  avgReviewScore: number;
  successRate: number;
}

interface TimelineData {
  date: string;
  income: number;
  expenses: number;
  escrowsCreated: number;
  escrowsCompleted: number;
}

interface CategoryData {
  name: string;
  value: number;
  percentage: number;
}

interface TransactionItem {
  id: string;
  date: string;
  type: 'income' | 'expense' | 'fee';
  description: string;
  amount: number;
  escrowId?: string;
  escrowTitle?: string;
  status: 'completed' | 'pending' | 'disputed';
}

// Generate mock data for development
const generateMockData = () => {
  // Mock escrow statistics
  const escrowStats: EscrowStats = {
    total: 26,
    active: 8,
    completed: 15,
    disputed: 2,
    cancelled: 1,
    totalValue: 24500,
    avgEscrowValue: 942.31,
    avgCompletionTime: 18, // days
    disputeRate: 7.69, // percentage
  };

  // Mock financial metrics
  const financialMetrics: FinancialMetrics = {
    totalEarned: 18750,
    totalSpent: 6200,
    totalFees: 248,
    balance: 12550,
    pendingAmount: 6500,
    projectedIncome: 4800,
    monthlyAvgIncome: 3125,
    avgTransactionValue: 1562.5,
  };

  // Mock performance metrics
  const performanceMetrics: PerformanceMetrics = {
    clientSatisfactionRate: 92,
    onTimeDeliveryRate: 89,
    responseTime: 6, // hours
    disputeResolutionTime: 2.5, // days
    avgReviewScore: 4.8,
    successRate: 94, // percentage
  };

  // Mock timeline data (6 months)
  const timelineData: TimelineData[] = [];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  for (let i = 0; i < 6; i++) {
    timelineData.push({
      date: months[i],
      income: 1000 + Math.floor(Math.random() * 4000),
      expenses: 500 + Math.floor(Math.random() * 1500),
      escrowsCreated: 1 + Math.floor(Math.random() * 5),
      escrowsCompleted: 1 + Math.floor(Math.random() * 4),
    });
  }

  // Mock category data
  const categoryData: CategoryData[] = [
    { name: 'Web Development', value: 9500, percentage: 38.8 },
    { name: 'Design', value: 6200, percentage: 25.3 },
    { name: 'Marketing', value: 4300, percentage: 17.6 },
    { name: 'Content Writing', value: 3100, percentage: 12.7 },
    { name: 'Consulting', value: 1400, percentage: 5.7 },
  ];

  // Mock transaction history
  const transactions: TransactionItem[] = [
    {
      id: 'tx1',
      date: '2023-06-15',
      type: 'income',
      description: 'Milestone 3 Payment - Website Development',
      amount: 1200,
      escrowId: 'escrow123',
      escrowTitle: 'Corporate Website Redesign',
      status: 'completed',
    },
    {
      id: 'tx2',
      date: '2023-06-12',
      type: 'fee',
      description: 'Platform Fee',
      amount: 12,
      escrowId: 'escrow123',
      escrowTitle: 'Corporate Website Redesign',
      status: 'completed',
    },
    {
      id: 'tx3',
      date: '2023-06-10',
      type: 'expense',
      description: 'Payment for Logo Design',
      amount: 500,
      escrowId: 'escrow124',
      escrowTitle: 'Brand Identity Package',
      status: 'completed',
    },
    {
      id: 'tx4',
      date: '2023-06-05',
      type: 'income',
      description: 'Milestone 2 Payment - Mobile App',
      amount: 2500,
      escrowId: 'escrow125',
      escrowTitle: 'iOS App Development',
      status: 'completed',
    },
    {
      id: 'tx5',
      date: '2023-06-01',
      type: 'expense',
      description: 'Payment for Content Writing',
      amount: 350,
      escrowId: 'escrow126',
      escrowTitle: 'Blog Content Creation',
      status: 'completed',
    },
    {
      id: 'tx6',
      date: '2023-05-28',
      type: 'income',
      description: 'Final Payment - UI/UX Design',
      amount: 1800,
      escrowId: 'escrow127',
      escrowTitle: 'E-commerce Platform Design',
      status: 'completed',
    },
    {
      id: 'tx7',
      date: '2023-05-20',
      type: 'fee',
      description: 'Platform Fee',
      amount: 18,
      escrowId: 'escrow127',
      escrowTitle: 'E-commerce Platform Design',
      status: 'completed',
    },
    {
      id: 'tx8',
      date: '2023-05-15',
      type: 'income',
      description: 'Pending Payment - Consulting',
      amount: 1200,
      escrowId: 'escrow128',
      escrowTitle: 'Business Strategy Consulting',
      status: 'pending',
    },
  ];

  return {
    escrowStats,
    financialMetrics,
    performanceMetrics,
    timelineData,
    categoryData,
    transactions,
  };
};

// Component for displaying analytics
const Analytics = () => {
  const toast = useToast();
  const { isExtensionReady, selectedAccount } = useWallet();

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'fee'>('all');
  
  // Data states
  const [escrowStats, setEscrowStats] = useState<EscrowStats | null>(null);
  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetrics | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [timelineData, setTimelineData] = useState<TimelineData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  
  // UI Colors
  const cardBg = useColorModeValue('white', 'gray.700');
  const statBg = useColorModeValue('blue.50', 'blue.900');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const chartColors = {
    income: '#38A169',  // green
    expenses: '#E53E3E', // red
    fees: '#DD6B20',    // orange
    pending: '#3182CE',  // blue
    primary: '#3182CE', // blue
    secondary: '#805AD5', // purple
    categories: ['#3182CE', '#805AD5', '#38A169', '#DD6B20', '#E53E3E', '#D69E2E'],
  };
  
  // Load data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // In a real application, we would fetch from an API
        // For this example, we'll generate mock data
        setTimeout(() => {
          const data = generateMockData();
          setEscrowStats(data.escrowStats);
          setFinancialMetrics(data.financialMetrics);
          setPerformanceMetrics(data.performanceMetrics);
          setTimelineData(data.timelineData);
          setCategoryData(data.categoryData);
          setTransactions(data.transactions);
          setIsLoading(false);
        }, 1500);
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError('Failed to load analytics. Please try again later.');
        setIsLoading(false);
      }
    };
    
    fetchAnalyticsData();
  }, []);
  
  // Filter transactions
  const filteredTransactions = useMemo(() => {
    if (!transactions.length) return [];
    
    let filtered = [...transactions];
    
    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(tx => tx.type === filterType);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tx =>
        tx.description.toLowerCase().includes(query) ||
        (tx.escrowTitle && tx.escrowTitle.toLowerCase().includes(query))
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return sortDirection === 'asc'
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortBy === 'amount') {
        return sortDirection === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      } else {
        // Default string comparison for other fields
        const aValue = String(a[sortBy as keyof TransactionItem] || '').toLowerCase();
        const bValue = String(b[sortBy as keyof TransactionItem] || '').toLowerCase();
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
    });
    
    return filtered;
  }, [transactions, filterType, searchQuery, sortBy, sortDirection]);
  
  // Handle download CSV
  const handleDownloadCSV = () => {
    // In a real application, we would generate a CSV file with the data
    // For this example, we'll just show a toast notification
    toast({
      title: 'Report Downloaded',
      description: 'Your transaction report has been downloaded as CSV',
      status: 'success',
      duration: 3000,
    });
  };
  
  // Handle download PDF
  const handleDownloadPDF = () => {
    // In a real application, we would generate a PDF file with the data
    // For this example, we'll just show a toast notification
    toast({
      title: 'Report Downloaded',
      description: 'Your transaction report has been downloaded as PDF',
      status: 'success',
      duration: 3000,
    });
  };
  
  // Handle refresh data
  const handleRefreshData = () => {
    setIsLoading(true);
    
    // Simulate data refresh
    setTimeout(() => {
      const data = generateMockData();
      setEscrowStats(data.escrowStats);
      setFinancialMetrics(data.financialMetrics);
      setPerformanceMetrics(data.performanceMetrics);
      setTimelineData(data.timelineData);
      setCategoryData(data.categoryData);
      setTransactions(data.transactions);
      setIsLoading(false);
      
      toast({
        title: 'Data Refreshed',
        description: 'Analytics data has been updated',
        status: 'success',
        duration: 2000,
      });
    }, 1000);
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Transaction type badge
  const getTransactionTypeBadge = (type: 'income' | 'expense' | 'fee') => {
    switch (type) {
      case 'income':
        return <Badge colorScheme="green">Income</Badge>;
      case 'expense':
        return <Badge colorScheme="red">Expense</Badge>;
      case 'fee':
        return <Badge colorScheme="orange">Fee</Badge>;
      default:
        return null;
    }
  };
  
  // Transaction status badge
  const getTransactionStatusBadge = (status: 'completed' | 'pending' | 'disputed') => {
    switch (status) {
      case 'completed':
        return <Badge colorScheme="green">Completed</Badge>;
      case 'pending':
        return <Badge colorScheme="blue">Pending</Badge>;
      case 'disputed':
        return <Badge colorScheme="orange">Disputed</Badge>;
      default:
        return null;
    }
  };
  
  // Display loading state
  if (isLoading && !escrowStats) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading analytics data...</Text>
      </Box>
    );
  }
  
  // Display error state
  if (error) {
    return (
      <Box>
        <Heading size="lg" mb={4}>Analytics & Reporting</Heading>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">{error}</Text>
            <Text mt={1}>Please try refreshing the page or contact support if the issue persists.</Text>
          </Box>
        </Alert>
      </Box>
    );
  }
  
  return (
    <Box>
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Box>
          <Heading size="lg">Analytics & Reporting</Heading>
          <Text color="gray.500">Insights and financial reporting for your escrows</Text>
        </Box>
        <HStack spacing={3}>
          <Menu>
            <MenuButton as={Button} rightIcon={<FiChevronDown />} size="sm">
              Last {dateRange === '7d' ? '7 Days' : dateRange === '30d' ? '30 Days' : dateRange === '90d' ? '90 Days' : dateRange === '1y' ? '1 Year' : 'All Time'}
            </MenuButton>
            <MenuList>
              <MenuItem onClick={() => setDateRange('7d')}>Last 7 Days</MenuItem>
              <MenuItem onClick={() => setDateRange('30d')}>Last 30 Days</MenuItem>
              <MenuItem onClick={() => setDateRange('90d')}>Last 90 Days</MenuItem>
              <MenuItem onClick={() => setDateRange('1y')}>Last 1 Year</MenuItem>
              <MenuItem onClick={() => setDateRange('all')}>All Time</MenuItem>
            </MenuList>
          </Menu>
          <Menu>
            <MenuButton as={Button} rightIcon={<FiChevronDown />} size="sm" variant="outline">
              <HStack><FiDownload /><Text>Export</Text></HStack>
            </MenuButton>
            <MenuList>
              <MenuItem onClick={handleDownloadCSV}>Export as CSV</MenuItem>
              <MenuItem onClick={handleDownloadPDF}>Export as PDF</MenuItem>
            </MenuList>
          </Menu>
          <IconButton
            aria-label="Refresh data"
            icon={<FiRefreshCw />}
            size="sm"
            variant="outline"
            onClick={handleRefreshData}
            isLoading={isLoading}
          />
        </HStack>
      </Flex>
      
      {/* Overview Statistics */}
      {escrowStats && financialMetrics && (
        <Grid
          templateColumns={{ 
            base: "repeat(1, 1fr)", 
            sm: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)" 
          }}
          gap={4}
          mb={6}
        >
          <GridItem>
            <Stat bg={statBg} p={4} borderRadius="md" boxShadow="sm">
              <StatLabel><HStack><FiDollarSign /><Text>Total Earned</Text></HStack></StatLabel>
              <StatNumber>{formatCurrency(financialMetrics.totalEarned)}</StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                {Math.round((financialMetrics.totalEarned / financialMetrics.totalSpent) * 100 - 100)}% profit margin
              </StatHelpText>
            </Stat>
          </GridItem>
          
          <GridItem>
            <Stat bg={statBg} p={4} borderRadius="md" boxShadow="sm">
              <StatLabel><HStack><FiTrendingUp /><Text>Active Value</Text></HStack></StatLabel>
              <StatNumber>{formatCurrency(financialMetrics.pendingAmount)}</StatNumber>
              <StatHelpText>
                <Text>In {escrowStats.active} active escrows</Text>
              </StatHelpText>
            </Stat>
          </GridItem>
          
          <GridItem>
            <Stat bg={statBg} p={4} borderRadius="md" boxShadow="sm">
              <StatLabel><HStack><FiBarChart2 /><Text>Avg. Value</Text></HStack></StatLabel>
              <StatNumber>{formatCurrency(escrowStats.avgEscrowValue)}</StatNumber>
              <StatHelpText>
                Per escrow transaction
              </StatHelpText>
            </Stat>
          </GridItem>
          
          <GridItem>
            <Stat bg={statBg} p={4} borderRadius="md" boxShadow="sm">
              <StatLabel><HStack><FiActivity /><Text>Success Rate</Text></HStack></StatLabel>
              <StatNumber>{performanceMetrics?.successRate}%</StatNumber>
              <StatHelpText>
                {escrowStats.completed} completed, {escrowStats.disputed} disputed
              </StatHelpText>
            </Stat>
          </GridItem>
        </Grid>
      )}
      
      {/* Tab-based reporting view */}
      <Tabs isLazy variant="enclosed-colored" colorScheme="blue">
        <TabList>
          <Tab><HStack spacing={1}><FiActivity /><Text>Financial Overview</Text></HStack></Tab>
          <Tab><HStack spacing={1}><FiBarChart2 /><Text>Escrow Analytics</Text></HStack></Tab>
          <Tab><HStack spacing={1}><FiDollarSign /><Text>Transactions</Text></HStack></Tab>
        </TabList>
        
        <TabPanels>
          {/* Financial Overview Tab */}
          <TabPanel px={0} pt={4}>
            <Grid templateColumns={{ base: "1fr", md: "2fr 1fr" }} gap={6}>
              {/* Revenue/Expense Chart */}
              <GridItem>
                <Card variant="outline">
                  <CardHeader pb={0}>
                    <Heading size="md">Revenue & Expenses</Heading>
                  </CardHeader>
                  <CardBody>
                    <Box height="300px">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={timelineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <RechartsTooltip
                            formatter={(value: number) => [`${formatCurrency(value)}`, '']}
                            labelFormatter={(label) => `${label}`}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="income" 
                            stackId="1"
                            stroke={chartColors.income} 
                            fill={chartColors.income} 
                            name="Income"
                          />
                          <Area 
                            type="monotone" 
                            dataKey="expenses" 
                            stackId="2"
                            stroke={chartColors.expenses} 
                            fill={chartColors.expenses}
                            name="Expenses"
                          />
                          <Legend />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardBody>
                </Card>
              </GridItem>
              
              {/* Category Breakdown */}
              <GridItem>
                <Card variant="outline" height="100%">
                  <CardHeader pb={0}>
                    <Heading size="md">Category Breakdown</Heading>
                  </CardHeader>
                  <CardBody>
                    <Flex direction="column" height="300px">
                      <Box height="70%" width="100%">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={categoryData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              nameKey="name"
                            >
                              {categoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={chartColors.categories[index % chartColors.categories.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip
                              formatter={(value: number) => [`${formatCurrency(value)}`, '']}
                              labelFormatter={(name) => `${name}`}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </Box>
                      <VStack mt={2} spacing={1} align="stretch" overflow="auto" height="30%">
                        {categoryData.map((category, index) => (
                          <HStack key={index} justifyContent="space-between">
                            <HStack>
                              <Box 
                                width="10px" 
                                height="10px" 
                                borderRadius="full" 
                                backgroundColor={chartColors.categories[index % chartColors.categories.length]}
                              />
                              <Text fontSize="sm">{category.name}</Text>
                            </HStack>
                            <Text fontSize="sm">{category.percentage}%</Text>
                          </HStack>
                        ))}
                      </VStack>
                    </Flex>
                  </CardBody>
                </Card>
              </GridItem>
              
              {/* Financial Metrics */}
              <GridItem colSpan={{ base: 1, md: 2 }}>
                <Card variant="outline">
                  <CardHeader>
                    <Heading size="md">Financial Metrics</Heading>
                  </CardHeader>
                  <CardBody>
                    <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }} gap={4}>
                      <GridItem>
                        <VStack align="start">
                          <Text color="gray.500" fontSize="sm">Total Income</Text>
                          <Text fontWeight="bold" fontSize="lg">{formatCurrency(financialMetrics?.totalEarned || 0)}</Text>
                        </VStack>
                      </GridItem>
                      
                      <GridItem>
                        <VStack align="start">
                          <Text color="gray.500" fontSize="sm">Total Expenses</Text>
                          <Text fontWeight="bold" fontSize="lg">{formatCurrency(financialMetrics?.totalSpent || 0)}</Text>
                        </VStack>
                      </GridItem>
                      
                      <GridItem>
                        <VStack align="start">
                          <Text color="gray.500" fontSize="sm">Platform Fees</Text>
                          <Text fontWeight="bold" fontSize="lg">{formatCurrency(financialMetrics?.totalFees || 0)}</Text>
                        </VStack>
                      </GridItem>
                      
                      <GridItem>
                        <VStack align="start">
                          <Text color="gray.500" fontSize="sm">Net Balance</Text>
                          <Text fontWeight="bold" fontSize="lg" color={financialMetrics?.balance && financialMetrics.balance >= 0 ? 'green.500' : 'red.500'}>
                            {formatCurrency(financialMetrics?.balance || 0)}
                          </Text>
                        </VStack>
                      </GridItem>
                      
                      <GridItem>
                        <VStack align="start">
                          <Text color="gray.500" fontSize="sm">Pending Income</Text>
                          <Text fontWeight="bold" fontSize="lg">{formatCurrency(financialMetrics?.pendingAmount || 0)}</Text>
                        </VStack>
                      </GridItem>
                      
                      <GridItem>
                        <VStack align="start">
                          <Text color="gray.500" fontSize="sm">Projected Income</Text>
                          <Text fontWeight="bold" fontSize="lg">{formatCurrency(financialMetrics?.projectedIncome || 0)}</Text>
                        </VStack>
                      </GridItem>
                      
                      <GridItem>
                        <VStack align="start">
                          <Text color="gray.500" fontSize="sm">Monthly Average</Text>
                          <Text fontWeight="bold" fontSize="lg">{formatCurrency(financialMetrics?.monthlyAvgIncome || 0)}</Text>
                        </VStack>
                      </GridItem>
                      
                      <GridItem>
                        <VStack align="start">
                          <Text color="gray.500" fontSize="sm">Avg Transaction</Text>
                          <Text fontWeight="bold" fontSize="lg">{formatCurrency(financialMetrics?.avgTransactionValue || 0)}</Text>
                        </VStack>
                      </GridItem>
                    </Grid>
                  </CardBody>
                </Card>
              </GridItem>
            </Grid>
          </TabPanel>
          
          {/* Escrow Analytics Tab */}
          <TabPanel px={0} pt={4}>
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
              {/* Escrow Activity */}
              <GridItem>
                <Card variant="outline">
                  <CardHeader pb={0}>
                    <Heading size="md">Escrow Activity</Heading>
                  </CardHeader>
                  <CardBody>
                    <Box height="300px">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={timelineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <RechartsTooltip />
                          <Legend />
                          <Bar 
                            dataKey="escrowsCreated" 
                            name="Created" 
                            fill={chartColors.primary} 
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar 
                            dataKey="escrowsCompleted" 
                            name="Completed" 
                            fill={chartColors.secondary}
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardBody>
                </Card>
              </GridItem>
              
              {/* Performance Metrics */}
              <GridItem>
                <Card variant="outline">
                  <CardHeader pb={0}>
                    <Heading size="md">Performance Metrics</Heading>
                  </CardHeader>
                  <CardBody>
                    <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                      <GridItem>
                        <VStack align="center">
                          <Box position="relative" height="100px" width="100px">
                            <Box
                              position="absolute"
                              top="0"
                              left="0"
                              bottom="0"
                              right="0"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              <Text fontWeight="bold" fontSize="2xl">{performanceMetrics?.clientSatisfactionRate}%</Text>
                            </Box>
                            <CircularProgressBar 
                              percentage={performanceMetrics?.clientSatisfactionRate || 0} 
                              color={chartColors.primary} 
                            />
                          </Box>
                          <Text fontWeight="medium">Client Satisfaction</Text>
                        </VStack>
                      </GridItem>
                      
                      <GridItem>
                        <VStack align="center">
                          <Box position="relative" height="100px" width="100px">
                            <Box
                              position="absolute"
                              top="0"
                              left="0"
                              bottom="0"
                              right="0"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              <Text fontWeight="bold" fontSize="2xl">{performanceMetrics?.onTimeDeliveryRate}%</Text>
                            </Box>
                            <CircularProgressBar 
                              percentage={performanceMetrics?.onTimeDeliveryRate || 0} 
                              color={chartColors.secondary} 
                            />
                          </Box>
                          <Text fontWeight="medium">On-Time Delivery</Text>
                        </VStack>
                      </GridItem>
                      
                      <GridItem>
                        <VStack align="start">
                          <Text color="gray.500" fontSize="sm">Average Response Time</Text>
                          <Text fontWeight="bold" fontSize="lg">{performanceMetrics?.responseTime} hours</Text>
                        </VStack>
                      </GridItem>
                      
                      <GridItem>
                        <VStack align="start">
                          <Text color="gray.500" fontSize="sm">Dispute Resolution Time</Text>
                          <Text fontWeight="bold" fontSize="lg">{performanceMetrics?.disputeResolutionTime} days</Text>
                        </VStack>
                      </GridItem>
                      
                      <GridItem>
                        <VStack align="start">
                          <Text color="gray.500" fontSize="sm">Average Review Score</Text>
                          <Text fontWeight="bold" fontSize="lg">{performanceMetrics?.avgReviewScore}/5.0</Text>
                        </VStack>
                      </GridItem>
                      
                      <GridItem>
                        <VStack align="start">
                          <Text color="gray.500" fontSize="sm">Success Rate</Text>
                          <Text fontWeight="bold" fontSize="lg">{performanceMetrics?.successRate}%</Text>
                        </VStack>
                      </GridItem>
                    </Grid>
                  </CardBody>
                </Card>
              </GridItem>
              
              {/* Escrow Statistics */}
              <GridItem colSpan={{ base: 1, md: 2 }}>
                <Card variant="outline">
                  <CardHeader>
                    <Heading size="md">Escrow Statistics</Heading>
                  </CardHeader>
                  <CardBody>
                    <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }} gap={4}>
                      <GridItem>
                        <VStack align="start">
                          <Text color="gray.500" fontSize="sm">Total Escrows</Text>
                          <Text fontWeight="bold" fontSize="lg">{escrowStats?.total}</Text>
                        </VStack>
                      </GridItem>
                      
                      <GridItem>
                        <VStack align="start">
                          <Text color="gray.500" fontSize="sm">Active Escrows</Text>
                          <Text fontWeight="bold" fontSize="lg">{escrowStats?.active}</Text>
                        </VStack>
                      </GridItem>
                      
                      <GridItem>
                        <VStack align="start">
                          <Text color="gray.500" fontSize="sm">Completed Escrows</Text>
                          <Text fontWeight="bold" fontSize="lg">{escrowStats?.completed}</Text>
                        </VStack>
                      </GridItem>
                      
                      <GridItem>
                        <VStack align="start">
                          <Text color="gray.500" fontSize="sm">Disputed Escrows</Text>
                          <Text fontWeight="bold" fontSize="lg">{escrowStats?.disputed}</Text>
                        </VStack>
                      </GridItem>
                      
                      <GridItem>
                        <VStack align="start">
                          <Text color="gray.500" fontSize="sm">Total Value</Text>
                          <Text fontWeight="bold" fontSize="lg">{formatCurrency(escrowStats?.totalValue || 0)}</Text>
                        </VStack>
                      </GridItem>
                      
                      <GridItem>
                        <VStack align="start">
                          <Text color="gray.500" fontSize="sm">Average Value</Text>
                          <Text fontWeight="bold" fontSize="lg">{formatCurrency(escrowStats?.avgEscrowValue || 0)}</Text>
                        </VStack>
                      </GridItem>
                      
                      <GridItem>
                        <VStack align="start">
                          <Text color="gray.500" fontSize="sm">Avg. Completion Time</Text>
                          <Text fontWeight="bold" fontSize="lg">{escrowStats?.avgCompletionTime} days</Text>
                        </VStack>
                      </GridItem>
                      
                      <GridItem>
                        <VStack align="start">
                          <Text color="gray.500" fontSize="sm">Dispute Rate</Text>
                          <Text fontWeight="bold" fontSize="lg">{escrowStats?.disputeRate}%</Text>
                        </VStack>
                      </GridItem>
                    </Grid>
                  </CardBody>
                </Card>
              </GridItem>
            </Grid>
          </TabPanel>
          
          {/* Transactions Tab */}
          <TabPanel px={0} pt={4}>
            <Card variant="outline">
              <CardHeader>
                <Flex justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={3}>
                  <Heading size="md">Transaction History</Heading>
                  <HStack spacing={3}>
                    <InputGroup maxW="200px">
                      <InputLeftElement>
                        <FiSearch color="gray.400" />
                      </InputLeftElement>
                      <Input 
                        placeholder="Search..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        size="sm"
                      />
                    </InputGroup>
                    
                    <Select 
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as any)}
                      size="sm"
                      maxW="150px"
                    >
                      <option value="all">All Types</option>
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                      <option value="fee">Fee</option>
                    </Select>
                  </HStack>
                </Flex>
              </CardHeader>
              <CardBody>
                {filteredTransactions.length > 0 ? (
                  <Box overflowX="auto">
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th 
                            cursor="pointer" 
                            onClick={() => {
                              if (sortBy === 'date') {
                                setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                              } else {
                                setSortBy('date');
                                setSortDirection('desc');
                              }
                            }}
                          >
                            <HStack>
                              <Text>Date</Text>
                              {sortBy === 'date' && (
                                sortDirection === 'asc' ? <FiArrowUp /> : <FiArrowDown />
                              )}
                            </HStack>
                          </Th>
                          <Th>Type</Th>
                          <Th>Description</Th>
                          <Th 
                            cursor="pointer" 
                            onClick={() => {
                              if (sortBy === 'amount') {
                                setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                              } else {
                                setSortBy('amount');
                                setSortDirection('desc');
                              }
                            }}
                          >
                            <HStack>
                              <Text>Amount</Text>
                              {sortBy === 'amount' && (
                                sortDirection === 'asc' ? <FiArrowUp /> : <FiArrowDown />
                              )}
                            </HStack>
                          </Th>
                          <Th>Status</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {filteredTransactions.map((tx) => (
                          <Tr key={tx.id}>
                            <Td>{formatDate(tx.date)}</Td>
                            <Td>{getTransactionTypeBadge(tx.type)}</Td>
                            <Td>
                              <VStack align="start" spacing={0}>
                                <Text>{tx.description}</Text>
                                {tx.escrowTitle && (
                                  <Text fontSize="xs" color="gray.500">
                                    {tx.escrowTitle}
                                  </Text>
                                )}
                              </VStack>
                            </Td>
                            <Td>
                              <Text
                                fontWeight="medium"
                                color={tx.type === 'income' ? 'green.500' : tx.type === 'expense' || tx.type === 'fee' ? 'red.500' : undefined}
                              >
                                {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                              </Text>
                            </Td>
                            <Td>{getTransactionStatusBadge(tx.status)}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                ) : (
                  <Box textAlign="center" py={10}>
                    <Text>No transactions match your filters</Text>
                  </Box>
                )}
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

// Helper component for circular progress
const CircularProgressBar = ({ percentage, color }: { percentage: number, color: string }) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const progress = (percentage / 100) * circumference;
  const remaining = circumference - progress;
  
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100">
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke="rgba(0,0,0,0.1)"
        strokeWidth="6"
      />
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeDasharray={`${progress} ${remaining}`}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
      />
    </svg>
  );
};

export default Analytics; 