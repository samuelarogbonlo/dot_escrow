import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  Button,
  Flex,
  Spinner,
  HStack,
  VStack,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Card,
  CardBody,
  Divider,
} from '@chakra-ui/react';
import { 
  FiSearch, 
  FiEye, 
  FiFilter, 
  FiChevronDown, 
  FiClock, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiAlertTriangle,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';
import { useWallet } from '../../hooks/useWalletContext';

// Transaction status types
type TransactionStatus = 'active' | 'completed' | 'disputed' | 'cancelled';
type TransactionType = 'incoming' | 'outgoing' | 'both';

// Transaction interface
interface Transaction {
  id: string;
  title: string;
  description: string;
  amount: string;
  date: Date;
  status: TransactionStatus;
  counterparty: {
    address: string;
    name?: string;
  };
  type: 'incoming' | 'outgoing';
  milestoneCount: number;
  completedMilestones: number;
}

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<TransactionType>('both');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Sorting
  const [sortField, setSortField] = useState<keyof Transaction>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const { selectedAccount, listEscrows, isApiReady, isExtensionReady } = useWallet();
  
  // Determine background and text colors based on color mode
  const cardBg = useColorModeValue('white', 'gray.700');
  const tableBg = useColorModeValue('white', 'gray.800');
  const tableBorderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  
  // Mock data for development
  const mockTransactions: Transaction[] = [
    {
      id: '1',
      title: 'Website Redesign',
      description: 'Complete redesign of company website with new brand identity',
      amount: '2500',
      date: new Date(2023, 2, 15),
      status: 'active',
      counterparty: {
        address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        name: 'DesignStudio',
      },
      type: 'outgoing',
      milestoneCount: 3,
      completedMilestones: 1,
    },
    {
      id: '2',
      title: 'Mobile App Development',
      description: 'iOS and Android app development for marketplace platform',
      amount: '5000',
      date: new Date(2023, 1, 20),
      status: 'completed',
      counterparty: {
        address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
      },
      type: 'outgoing',
      milestoneCount: 4,
      completedMilestones: 4,
    },
    {
      id: '3',
      title: 'Logo Design Services',
      description: 'Professional logo design with multiple iterations',
      amount: '500',
      date: new Date(2023, 3, 5),
      status: 'active',
      counterparty: {
        address: '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y',
        name: 'CreativeCo',
      },
      type: 'incoming',
      milestoneCount: 2,
      completedMilestones: 1,
    },
    {
      id: '4',
      title: 'Content Writing',
      description: 'Blog posts and SEO content writing services',
      amount: '1200',
      date: new Date(2023, 0, 10),
      status: 'disputed',
      counterparty: {
        address: '5DAAnrj7VHTznn2C8LTXDs5azfPTLD7m4oDxUcnvTfTvVis6',
      },
      type: 'incoming',
      milestoneCount: 6,
      completedMilestones: 3,
    },
    {
      id: '5',
      title: 'Server Migration',
      description: 'Migration of existing servers to the cloud',
      amount: '1800',
      date: new Date(2023, 4, 1),
      status: 'cancelled',
      counterparty: {
        address: '5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw',
        name: 'CloudTech',
      },
      type: 'outgoing',
      milestoneCount: 2,
      completedMilestones: 0,
    },
  ];
  
  // Fetch transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // If we have a real API connection, use it
        if (isApiReady && isExtensionReady && selectedAccount) {
          // Uncomment to use real API when ready
          // const result = await listEscrows();
          // if (result.success) {
          //   setTransactions(result.escrows);
          // } else {
          //   setError(result.error || 'Failed to fetch escrows');
          //   setTransactions(mockTransactions); // Fallback to mock data
          // }
          
          // For now, just use mock data after a delay to simulate loading
          setTimeout(() => {
            setTransactions(mockTransactions);
            setIsLoading(false);
          }, 1000);
        } else {
          // Use mock data for development
          setTimeout(() => {
            setTransactions(mockTransactions);
            setIsLoading(false);
          }, 1000);
        }
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError('Failed to fetch transactions. Please try again later.');
        setTransactions(mockTransactions); // Fallback to mock data
        setIsLoading(false);
      }
    };
    
    fetchTransactions();
  }, [isApiReady, isExtensionReady, selectedAccount, listEscrows]);
  
  // Apply filters, sorting, and pagination
  useEffect(() => {
    let result = [...transactions];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(tx => 
        tx.title.toLowerCase().includes(query) || 
        tx.description.toLowerCase().includes(query) ||
        tx.counterparty.name?.toLowerCase().includes(query) ||
        tx.counterparty.address.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(tx => tx.status === statusFilter);
    }
    
    // Apply type filter
    if (typeFilter !== 'both') {
      result = result.filter(tx => tx.type === typeFilter);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      if (sortField === 'date') {
        return sortDirection === 'asc' 
          ? a[sortField].getTime() - b[sortField].getTime()
          : b[sortField].getTime() - a[sortField].getTime();
      } else if (sortField === 'amount') {
        return sortDirection === 'asc'
          ? parseFloat(a[sortField]) - parseFloat(b[sortField])
          : parseFloat(b[sortField]) - parseFloat(a[sortField]);
      } else {
        // String comparison
        const aValue = String(a[sortField]).toLowerCase();
        const bValue = String(b[sortField]).toLowerCase();
        
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
    });
    
    setFilteredTransactions(result);
  }, [transactions, searchQuery, statusFilter, typeFilter, sortField, sortDirection]);
  
  // Pagination calculations
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredTransactions.length);
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);
  
  // Handle sort change
  const handleSort = (field: keyof Transaction) => {
    if (field === sortField) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, set to default direction
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  // Status badge mapper
  const getStatusBadge = (status: TransactionStatus) => {
    switch(status) {
      case 'active':
        return <Badge colorScheme="blue" display="flex" alignItems="center"><FiClock style={{ marginRight: '4px' }} /> Active</Badge>;
      case 'completed':
        return <Badge colorScheme="green" display="flex" alignItems="center"><FiCheckCircle style={{ marginRight: '4px' }} /> Completed</Badge>;
      case 'disputed':
        return <Badge colorScheme="orange" display="flex" alignItems="center"><FiAlertTriangle style={{ marginRight: '4px' }} /> Disputed</Badge>;
      case 'cancelled':
        return <Badge colorScheme="red" display="flex" alignItems="center"><FiAlertCircle style={{ marginRight: '4px' }} /> Cancelled</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };
  
  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };
  
  // Format address
  const formatAddress = (address: string) => {
    if (address.length < 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading transactions...</Text>
      </Box>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Box>
        <Heading size="lg" mb={4}>Transactions</Heading>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      </Box>
    );
  }
  
  return (
    <Box>
      <Heading size="lg" mb={4}>Transactions</Heading>
      
      {/* Filters */}
      <Card mb={6} variant="outline" bg={cardBg}>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
              <InputGroup flex={1}>
                <InputLeftElement pointerEvents="none">
                  <FiSearch color="gray.400" />
                </InputLeftElement>
                <Input 
                  placeholder="Search transactions..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </InputGroup>
              
              <HStack spacing={2}>
                <Select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value as TransactionStatus | 'all')}
                  width={{ base: 'full', md: '150px' }}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="disputed">Disputed</option>
                  <option value="cancelled">Cancelled</option>
                </Select>
                
                <Select 
                  value={typeFilter} 
                  onChange={(e) => setTypeFilter(e.target.value as TransactionType)}
                  width={{ base: 'full', md: '150px' }}
                >
                  <option value="both">All Types</option>
                  <option value="incoming">Incoming</option>
                  <option value="outgoing">Outgoing</option>
                </Select>
              </HStack>
            </Flex>
            
            <Flex justifyContent="space-between" alignItems="center">
              <Text fontSize="sm" color="gray.500">
                Showing {startIndex + 1}-{endIndex} of {filteredTransactions.length} transactions
              </Text>
              
              <Menu>
                <MenuButton as={Button} rightIcon={<FiChevronDown />} size="sm" variant="outline">
                  Sort: {sortField} ({sortDirection})
                </MenuButton>
                <MenuList>
                  <MenuItem onClick={() => handleSort('date')}>Date</MenuItem>
                  <MenuItem onClick={() => handleSort('amount')}>Amount</MenuItem>
                  <MenuItem onClick={() => handleSort('status')}>Status</MenuItem>
                  <MenuItem onClick={() => handleSort('title')}>Title</MenuItem>
                </MenuList>
              </Menu>
            </Flex>
          </VStack>
        </CardBody>
      </Card>
      
      {/* Transaction Table */}
      {currentTransactions.length > 0 ? (
        <Box overflowX="auto">
          <Table variant="simple" bg={tableBg} borderWidth="1px" borderColor={tableBorderColor} borderRadius="md">
            <Thead>
              <Tr>
                <Th>Title</Th>
                <Th>Date</Th>
                <Th>Amount (USDT)</Th>
                <Th>Counterparty</Th>
                <Th>Status</Th>
                <Th>Progress</Th>
                <Th width="80px">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {currentTransactions.map((tx) => (
                <Tr 
                  key={tx.id} 
                  _hover={{ bg: hoverBg }} 
                  cursor="pointer"
                  transition="background-color 0.2s"
                  onClick={() => {/* Can add row click handler */}}
                >
                  <Td>
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="medium">{tx.title}</Text>
                      <Text fontSize="xs" color="gray.500" noOfLines={1}>{tx.description}</Text>
                    </VStack>
                  </Td>
                  <Td>{formatDate(tx.date)}</Td>
                  <Td isNumeric fontWeight="medium">
                    <Text color={tx.type === 'incoming' ? 'green.500' : undefined}>
                      {tx.type === 'incoming' ? '+' : '-'}{tx.amount}
                    </Text>
                  </Td>
                  <Td>
                    <VStack align="start" spacing={0}>
                      {tx.counterparty.name && (
                        <Text fontWeight="medium">{tx.counterparty.name}</Text>
                      )}
                      <Text fontSize="xs" fontFamily="monospace">{formatAddress(tx.counterparty.address)}</Text>
                    </VStack>
                  </Td>
                  <Td>{getStatusBadge(tx.status)}</Td>
                  <Td>
                    <Text fontSize="sm">
                      {tx.completedMilestones} of {tx.milestoneCount} milestones
                    </Text>
                  </Td>
                  <Td>
                    <IconButton
                      as={RouterLink}
                      to={`/escrow/${tx.id}`}
                      aria-label="View details"
                      icon={<FiEye />}
                      size="sm"
                      variant="ghost"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Flex justifyContent="center" mt={6}>
              <HStack>
                <Button
                  leftIcon={<FiChevronLeft />}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  isDisabled={currentPage === 1}
                  size="sm"
                >
                  Previous
                </Button>
                <Text>
                  Page {currentPage} of {totalPages}
                </Text>
                <Button
                  rightIcon={<FiChevronRight />}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  isDisabled={currentPage === totalPages}
                  size="sm"
                >
                  Next
                </Button>
              </HStack>
            </Flex>
          )}
        </Box>
      ) : (
        <Card variant="outline" p={6} textAlign="center">
          <VStack spacing={4}>
            <FiFilter size={40} color="gray" />
            <Heading size="md">No transactions found</Heading>
            <Text>Try adjusting your filters or create a new escrow</Text>
            <Button
              as={RouterLink}
              to="/escrow/create"
              colorScheme="blue"
              mt={2}
            >
              Create Escrow
            </Button>
          </VStack>
        </Card>
      )}
    </Box>
  );
};

export default Transactions; 