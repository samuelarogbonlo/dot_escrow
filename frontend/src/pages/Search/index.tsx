import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Heading,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Button,
  Select,
  HStack,
  VStack,
  Flex,
  Grid,
  GridItem,
  Card,
  CardBody,
  Badge,
  Tab,
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  FormControl,
  FormLabel,
  Checkbox,
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  Collapse,
  Divider,
  Tag,
  TagLabel,
  TagCloseButton,
  Spinner,
  Alert,
  AlertIcon,
  useColorModeValue,
  useDisclosure,
} from '@chakra-ui/react';
import { 
  FiSearch, 
  FiChevronDown, 
  FiChevronUp, 
  FiDollarSign,
  FiCalendar,
  FiUser
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

// Types
interface SearchFilter {
  query: string;
  type: 'all' | 'escrows' | 'milestones' | 'transactions';
  status: string[];
  dateRange: [number, number]; // 0-6 representing ranges
  amountRange: [number, number]; // in USD
  role: 'all' | 'client' | 'worker';
  category: string[];
  tags: string[];
}

interface SearchResult {
  id: string;
  title: string;
  type: 'escrow' | 'milestone' | 'transaction';
  status: string;
  date: string;
  amount: number;
  description: string;
  participants: {
    client: string;
    worker: string;
  };
  category?: string;
  tags?: string[];
}

// Utility functions
const dateRangeToText = (range: number): string => {
  switch(range) {
    case 0: return 'Last 24 hours';
    case 1: return 'Last 7 days';
    case 2: return 'Last 30 days';
    case 3: return 'Last 90 days';
    case 4: return 'Last 6 months';
    case 5: return 'Last year';
    case 6: return 'All time';
    default: return 'Custom';
  }
};

const amountToText = (amount: number): string => {
  if (amount === 0) return '$0';
  if (amount === 10000) return '$10,000+';
  return `$${amount.toLocaleString()}`;
};

// Mock data generator
const generateMockData = (): SearchResult[] => {
  const mockData: SearchResult[] = [];
  
  const statuses = ['active', 'completed', 'pending', 'disputed', 'cancelled'];
  const categories = ['Web Development', 'Design', 'Marketing', 'Writing', 'Consulting'];
  const tagOptions = ['urgent', 'high-value', 'recurring', 'new-client', 'delayed', 'milestone'];
  
  // Generate escrows
  for (let i = 1; i <= 15; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const tagCount = Math.floor(Math.random() * 3);
    const tags: string[] = [];
    
    for (let j = 0; j < tagCount; j++) {
      const tag = tagOptions[Math.floor(Math.random() * tagOptions.length)];
      if (!tags.includes(tag)) tags.push(tag);
    }
    
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 90));
    
    mockData.push({
      id: `escrow-${i}`,
      title: `${category} Project ${i}`,
      type: 'escrow',
      status,
      date: format(date, 'yyyy-MM-dd'),
      amount: 500 + Math.floor(Math.random() * 9500),
      description: `A ${category.toLowerCase()} project that includes multiple deliverables and milestones.`,
      participants: {
        client: `Client ${i}`,
        worker: `Worker ${i}`,
      },
      category,
      tags,
    });
  }
  
  // Generate milestones
  for (let i = 1; i <= 20; i++) {
    const escrowId = Math.floor(Math.random() * 15) + 1;
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const escrow = mockData.find(d => d.id === `escrow-${escrowId}`);
    const category = escrow?.category || categories[Math.floor(Math.random() * categories.length)];
    
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 60));
    
    mockData.push({
      id: `milestone-${i}`,
      title: `Milestone ${i} for ${category}`,
      type: 'milestone',
      status,
      date: format(date, 'yyyy-MM-dd'),
      amount: 100 + Math.floor(Math.random() * 1900),
      description: `A deliverable for the ${category.toLowerCase()} project.`,
      participants: escrow?.participants || {
        client: `Client ${escrowId}`,
        worker: `Worker ${escrowId}`,
      },
      category,
    });
  }
  
  // Generate transactions
  for (let i = 1; i <= 10; i++) {
    const escrowId = Math.floor(Math.random() * 15) + 1;
    const escrow = mockData.find(d => d.id === `escrow-${escrowId}`);
    const status = 'completed';
    
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    
    mockData.push({
      id: `transaction-${i}`,
      title: `Payment for ${escrow?.title || 'Project'}`,
      type: 'transaction',
      status,
      date: format(date, 'yyyy-MM-dd'),
      amount: 100 + Math.floor(Math.random() * 1900),
      description: `Payment for milestone completion.`,
      participants: escrow?.participants || {
        client: `Client ${escrowId}`,
        worker: `Worker ${escrowId}`,
      },
      category: escrow?.category,
    });
  }
  
  return mockData;
};

const Search = () => {
  const navigate = useNavigate();
  const { isOpen: isFiltersOpen, onToggle: onFiltersToggle } = useDisclosure({ defaultIsOpen: true });
  
  // Color mode
  const cardBg = useColorModeValue('white', 'gray.700');
  const filterBg = useColorModeValue('gray.50', 'gray.800');
  const tagBg = useColorModeValue('blue.50', 'blue.900');
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [activeFilters, setActiveFilters] = useState<SearchFilter>({
    query: '',
    type: 'all',
    status: [],
    dateRange: [0, 6],
    amountRange: [0, 10000],
    role: 'all',
    category: [],
    tags: [],
  });
  const [appliedFilters, setAppliedFilters] = useState<SearchFilter>({
    query: '',
    type: 'all',
    status: [],
    dateRange: [0, 6],
    amountRange: [0, 10000],
    role: 'all',
    category: [],
    tags: [],
  });
  
  // Load data on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // In a real app, we would fetch from an API
        // For this example, we'll generate mock data
        setTimeout(() => {
          const mockData = generateMockData();
          setSearchResults(mockData);
          setIsLoading(false);
        }, 1000);
      } catch (err) {
        console.error('Error fetching search data:', err);
        setError('Failed to load search results. Please try again later.');
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Apply filters
  const handleApplyFilters = () => {
    setAppliedFilters({ ...activeFilters });
  };
  
  // Reset filters
  const handleResetFilters = () => {
    setActiveFilters({
      query: '',
      type: 'all',
      status: [],
      dateRange: [0, 6],
      amountRange: [0, 10000],
      role: 'all',
      category: [],
      tags: [],
    });
    setAppliedFilters({
      query: '',
      type: 'all',
      status: [],
      dateRange: [0, 6],
      amountRange: [0, 10000],
      role: 'all',
      category: [],
      tags: [],
    });
  };
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    handleApplyFilters();
  };
  
  // Handle filter changes
  const handleFilterChange = (
    field: keyof SearchFilter, 
    value: string | string[] | [number, number] | 'all' | 'client' | 'worker'
  ) => {
    setActiveFilters(prev => ({
      ...prev,
      [field]: value,
    }));
  };
  
  // Toggle status filter
  const toggleStatusFilter = (status: string) => {
    const currentStatuses = [...activeFilters.status];
    const index = currentStatuses.indexOf(status);
    
    if (index === -1) {
      currentStatuses.push(status);
    } else {
      currentStatuses.splice(index, 1);
    }
    
    handleFilterChange('status', currentStatuses);
  };
  
  // Toggle category filter
  const toggleCategoryFilter = (category: string) => {
    const currentCategories = [...activeFilters.category];
    const index = currentCategories.indexOf(category);
    
    if (index === -1) {
      currentCategories.push(category);
    } else {
      currentCategories.splice(index, 1);
    }
    
    handleFilterChange('category', currentCategories);
  };
  
  // Toggle tag filter
  const toggleTagFilter = (tag: string) => {
    const currentTags = [...activeFilters.tags];
    const index = currentTags.indexOf(tag);
    
    if (index === -1) {
      currentTags.push(tag);
    } else {
      currentTags.splice(index, 1);
    }
    
    handleFilterChange('tags', currentTags);
  };
  
  // Remove filter tag
  const removeFilterTag = (
    field: 'status' | 'category' | 'tags', 
    value: string
  ) => {
    const updatedFilters = { ...activeFilters };
    
    if (Array.isArray(updatedFilters[field])) {
      updatedFilters[field] = (updatedFilters[field] as string[]).filter(item => item !== value);
      setActiveFilters(updatedFilters);
      setAppliedFilters(updatedFilters);
    }
  };
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch(status.toLowerCase()) {
      case 'active':
        return <Badge colorScheme="green">Active</Badge>;
      case 'completed':
        return <Badge colorScheme="blue">Completed</Badge>;
      case 'pending':
        return <Badge colorScheme="yellow">Pending</Badge>;
      case 'disputed':
        return <Badge colorScheme="orange">Disputed</Badge>;
      case 'cancelled':
        return <Badge colorScheme="red">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  // Get type badge
  const getTypeBadge = (type: 'escrow' | 'milestone' | 'transaction') => {
    switch(type) {
      case 'escrow':
        return <Badge colorScheme="purple">Escrow</Badge>;
      case 'milestone':
        return <Badge colorScheme="teal">Milestone</Badge>;
      case 'transaction':
        return <Badge colorScheme="blue">Transaction</Badge>;
      default:
        return null;
    }
  };
  
  // Filter results based on applied filters
  const filteredResults = useMemo(() => {
    if (!searchResults.length) return [];
    
    return searchResults.filter(result => {
      // Filter by search query
      if (appliedFilters.query) {
        const query = appliedFilters.query.toLowerCase();
        const matchesQuery = 
          result.title.toLowerCase().includes(query) ||
          result.description.toLowerCase().includes(query) ||
          result.participants.client.toLowerCase().includes(query) ||
          result.participants.worker.toLowerCase().includes(query);
        
        if (!matchesQuery) return false;
      }
      
      // Filter by type
      if (appliedFilters.type !== 'all' && result.type !== appliedFilters.type.slice(0, -1)) {
        return false;
      }
      
      // Filter by status
      if (appliedFilters.status.length > 0 && !appliedFilters.status.includes(result.status)) {
        return false;
      }
      
      // Filter by date range
      if (appliedFilters.dateRange[0] !== 0 || appliedFilters.dateRange[1] !== 6) {
        const resultDate = new Date(result.date);
        const now = new Date();
        
        // Convert range values to days
        const rangeDays = [
          1, // 24 hours
          7, // 7 days
          30, // 30 days
          90, // 90 days
          180, // 6 months
          365, // 1 year
          Infinity, // All time
        ];
        
        const minDays = rangeDays[appliedFilters.dateRange[0]];
        const maxDays = rangeDays[appliedFilters.dateRange[1]];
        
        // Calculate days difference
        const daysDiff = Math.ceil((now.getTime() - resultDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff < minDays || daysDiff > maxDays) {
          return false;
        }
      }
      
      // Filter by amount range
      if (appliedFilters.amountRange[0] > 0 || appliedFilters.amountRange[1] < 10000) {
        if (result.amount < appliedFilters.amountRange[0] || result.amount > appliedFilters.amountRange[1]) {
          return false;
        }
      }
      
      // Filter by role
      if (appliedFilters.role !== 'all') {
        // In a real app, we would check if the user is client or worker for this result
        // For this demo, we'll just check if the index is even or odd to simulate different roles
        const isClient = result.id.charCodeAt(result.id.length - 1) % 2 === 0;
        if ((appliedFilters.role === 'client' && !isClient) || (appliedFilters.role === 'worker' && isClient)) {
          return false;
        }
      }
      
      // Filter by category
      if (appliedFilters.category.length > 0 && result.category) {
        if (!appliedFilters.category.includes(result.category)) {
          return false;
        }
      }
      
      // Filter by tags
      if (appliedFilters.tags.length > 0 && result.tags) {
        const hasMatchingTag = result.tags.some(tag => appliedFilters.tags.includes(tag));
        if (!hasMatchingTag) {
          return false;
        }
      }
      
      return true;
    });
  }, [searchResults, appliedFilters]);
  
  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    // Navigate to appropriate page based on result type
    switch(result.type) {
      case 'escrow':
        navigate(`/escrow/${result.id}`);
        break;
      case 'milestone':
        navigate(`/milestone/${result.id}`);
        break;
      case 'transaction':
        navigate(`/transaction/${result.id}`);
        break;
      default:
        console.error('Unknown result type');
    }
  };
  
  // Loading state
  if (isLoading && !searchResults.length) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading search results...</Text>
      </Box>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Box>
        <Heading size="lg" mb={4}>Search</Heading>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">{error}</Text>
            <Text mt={1}>Please try refreshing the page or modifying your search.</Text>
          </Box>
        </Alert>
      </Box>
    );
  }
  
  return (
    <Box>
      <Heading size="lg" mb={4}>Search</Heading>
      
      {/* Search Bar */}
      <form onSubmit={handleSearch}>
        <HStack mb={4} spacing={2}>
          <InputGroup size="md">
            <InputLeftElement pointerEvents="none">
              <FiSearch color="gray.300" />
            </InputLeftElement>
            <Input 
              placeholder="Search escrows, milestones, transactions..." 
              value={activeFilters.query}
              onChange={(e) => handleFilterChange('query', e.target.value)}
            />
          </InputGroup>
          <Button type="submit" colorScheme="blue">
            Search
          </Button>
          <Button 
            leftIcon={isFiltersOpen ? <FiChevronUp /> : <FiChevronDown />} 
            variant="outline"
            onClick={onFiltersToggle}
          >
            Filters
          </Button>
        </HStack>
      </form>
      
      {/* Filters */}
      <Collapse in={isFiltersOpen} animateOpacity>
        <Box 
          p={4} 
          bg={filterBg} 
          borderRadius="md" 
          mb={6}
          border="1px solid"
          borderColor="gray.200"
        >
          <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={4}>
            {/* Type */}
            <GridItem>
              <FormControl>
                <FormLabel fontSize="sm">Type</FormLabel>
                <Select 
                  value={activeFilters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value as any)}
                  size="sm"
                >
                  <option value="all">All Types</option>
                  <option value="escrows">Escrows</option>
                  <option value="milestones">Milestones</option>
                  <option value="transactions">Transactions</option>
                </Select>
              </FormControl>
            </GridItem>
            
            {/* Role */}
            <GridItem>
              <FormControl>
                <FormLabel fontSize="sm">Your Role</FormLabel>
                <Select 
                  value={activeFilters.role}
                  onChange={(e) => handleFilterChange('role', e.target.value as any)}
                  size="sm"
                >
                  <option value="all">All Roles</option>
                  <option value="client">Client</option>
                  <option value="worker">Worker</option>
                </Select>
              </FormControl>
            </GridItem>
            
            {/* Status */}
            <GridItem>
              <FormControl>
                <FormLabel fontSize="sm">Status</FormLabel>
                <VStack align="start" spacing={1}>
                  <Checkbox 
                    isChecked={activeFilters.status.includes('active')}
                    onChange={() => toggleStatusFilter('active')}
                    size="sm"
                  >
                    Active
                  </Checkbox>
                  <Checkbox 
                    isChecked={activeFilters.status.includes('pending')}
                    onChange={() => toggleStatusFilter('pending')}
                    size="sm"
                  >
                    Pending
                  </Checkbox>
                  <Checkbox 
                    isChecked={activeFilters.status.includes('completed')}
                    onChange={() => toggleStatusFilter('completed')}
                    size="sm"
                  >
                    Completed
                  </Checkbox>
                  <Checkbox 
                    isChecked={activeFilters.status.includes('disputed')}
                    onChange={() => toggleStatusFilter('disputed')}
                    size="sm"
                  >
                    Disputed
                  </Checkbox>
                  <Checkbox 
                    isChecked={activeFilters.status.includes('cancelled')}
                    onChange={() => toggleStatusFilter('cancelled')}
                    size="sm"
                  >
                    Cancelled
                  </Checkbox>
                </VStack>
              </FormControl>
            </GridItem>
            
            {/* Date Range */}
            <GridItem>
              <FormControl>
                <FormLabel fontSize="sm">Date Range</FormLabel>
                <Box px={2}>
                  <RangeSlider
                    defaultValue={activeFilters.dateRange}
                    min={0}
                    max={6}
                    step={1}
                    onChange={(val) => handleFilterChange('dateRange', val as [number, number])}
                  >
                    <RangeSliderTrack>
                      <RangeSliderFilledTrack />
                    </RangeSliderTrack>
                    <RangeSliderThumb index={0} />
                    <RangeSliderThumb index={1} />
                  </RangeSlider>
                  <Flex justify="space-between" mt={1}>
                    <Text fontSize="xs">{dateRangeToText(activeFilters.dateRange[0])}</Text>
                    <Text fontSize="xs">{dateRangeToText(activeFilters.dateRange[1])}</Text>
                  </Flex>
                </Box>
              </FormControl>
            </GridItem>
            
            {/* Amount Range */}
            <GridItem>
              <FormControl>
                <FormLabel fontSize="sm">Amount Range</FormLabel>
                <Box px={2}>
                  <RangeSlider
                    defaultValue={activeFilters.amountRange}
                    min={0}
                    max={10000}
                    step={500}
                    onChange={(val) => handleFilterChange('amountRange', val as [number, number])}
                  >
                    <RangeSliderTrack>
                      <RangeSliderFilledTrack />
                    </RangeSliderTrack>
                    <RangeSliderThumb index={0} />
                    <RangeSliderThumb index={1} />
                  </RangeSlider>
                  <Flex justify="space-between" mt={1}>
                    <Text fontSize="xs">{amountToText(activeFilters.amountRange[0])}</Text>
                    <Text fontSize="xs">{amountToText(activeFilters.amountRange[1])}</Text>
                  </Flex>
                </Box>
              </FormControl>
            </GridItem>
            
            {/* Categories */}
            <GridItem>
              <FormControl>
                <FormLabel fontSize="sm">Categories</FormLabel>
                <VStack align="start" spacing={1}>
                  <Checkbox 
                    isChecked={activeFilters.category.includes('Web Development')}
                    onChange={() => toggleCategoryFilter('Web Development')}
                    size="sm"
                  >
                    Web Development
                  </Checkbox>
                  <Checkbox 
                    isChecked={activeFilters.category.includes('Design')}
                    onChange={() => toggleCategoryFilter('Design')}
                    size="sm"
                  >
                    Design
                  </Checkbox>
                  <Checkbox 
                    isChecked={activeFilters.category.includes('Marketing')}
                    onChange={() => toggleCategoryFilter('Marketing')}
                    size="sm"
                  >
                    Marketing
                  </Checkbox>
                  <Checkbox 
                    isChecked={activeFilters.category.includes('Writing')}
                    onChange={() => toggleCategoryFilter('Writing')}
                    size="sm"
                  >
                    Writing
                  </Checkbox>
                  <Checkbox 
                    isChecked={activeFilters.category.includes('Consulting')}
                    onChange={() => toggleCategoryFilter('Consulting')}
                    size="sm"
                  >
                    Consulting
                  </Checkbox>
                </VStack>
              </FormControl>
            </GridItem>
          </Grid>
          
          <Divider my={4} />
          
          {/* Action Buttons */}
          <Flex justifyContent="space-between" alignItems="center">
            <HStack spacing={2} flexWrap="wrap">
              {appliedFilters.status.map(status => (
                <Tag 
                  size="sm" 
                  key={status} 
                  borderRadius="full" 
                  variant="subtle" 
                  colorScheme="blue"
                  bg={tagBg}
                >
                  <TagLabel>Status: {status}</TagLabel>
                  <TagCloseButton onClick={() => removeFilterTag('status', status)} />
                </Tag>
              ))}
              
              {appliedFilters.category.map(category => (
                <Tag 
                  size="sm" 
                  key={category} 
                  borderRadius="full" 
                  variant="subtle" 
                  colorScheme="green"
                  bg={tagBg}
                >
                  <TagLabel>Category: {category}</TagLabel>
                  <TagCloseButton onClick={() => removeFilterTag('category', category)} />
                </Tag>
              ))}
              
              {appliedFilters.tags.map(tag => (
                <Tag 
                  size="sm" 
                  key={tag} 
                  borderRadius="full" 
                  variant="subtle" 
                  colorScheme="purple"
                  bg={tagBg}
                >
                  <TagLabel>Tag: {tag}</TagLabel>
                  <TagCloseButton onClick={() => removeFilterTag('tags', tag)} />
                </Tag>
              ))}
              
              {appliedFilters.type !== 'all' && (
                <Tag 
                  size="sm" 
                  borderRadius="full" 
                  variant="subtle" 
                  colorScheme="orange"
                  bg={tagBg}
                >
                  <TagLabel>Type: {appliedFilters.type}</TagLabel>
                  <TagCloseButton onClick={() => { 
                    setActiveFilters({...activeFilters, type: 'all'});
                    setAppliedFilters({...appliedFilters, type: 'all'});
                  }} />
                </Tag>
              )}
              
              {appliedFilters.role !== 'all' && (
                <Tag 
                  size="sm" 
                  borderRadius="full" 
                  variant="subtle" 
                  colorScheme="teal"
                  bg={tagBg}
                >
                  <TagLabel>Role: {appliedFilters.role}</TagLabel>
                  <TagCloseButton onClick={() => { 
                    setActiveFilters({...activeFilters, role: 'all'});
                    setAppliedFilters({...appliedFilters, role: 'all'});
                  }} />
                </Tag>
              )}
            </HStack>
            
            <HStack>
              <Button size="sm" variant="outline" onClick={handleResetFilters}>
                Reset
              </Button>
              <Button size="sm" colorScheme="blue" onClick={handleApplyFilters}>
                Apply Filters
              </Button>
            </HStack>
          </Flex>
        </Box>
      </Collapse>
      
      {/* Results */}
      <Tabs variant="enclosed" colorScheme="blue" isLazy>
        <TabList>
          <Tab>All Results ({filteredResults.length})</Tab>
          <Tab>Escrows ({filteredResults.filter(r => r.type === 'escrow').length})</Tab>
          <Tab>Milestones ({filteredResults.filter(r => r.type === 'milestone').length})</Tab>
          <Tab>Transactions ({filteredResults.filter(r => r.type === 'transaction').length})</Tab>
        </TabList>
        
        <TabPanels>
          {/* All Results Tab */}
          <TabPanel px={0} pt={4}>
            {renderResults(filteredResults)}
          </TabPanel>
          
          {/* Escrows Tab */}
          <TabPanel px={0} pt={4}>
            {renderResults(filteredResults.filter(r => r.type === 'escrow'))}
          </TabPanel>
          
          {/* Milestones Tab */}
          <TabPanel px={0} pt={4}>
            {renderResults(filteredResults.filter(r => r.type === 'milestone'))}
          </TabPanel>
          
          {/* Transactions Tab */}
          <TabPanel px={0} pt={4}>
            {renderResults(filteredResults.filter(r => r.type === 'transaction'))}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
  
  // Helper function to render results
  function renderResults(results: SearchResult[]) {
    if (results.length === 0) {
      return (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <Text>No results found. Try adjusting your search or filters.</Text>
        </Alert>
      );
    }
    
    return (
      <VStack spacing={4} align="stretch">
        {results.map(result => (
          <Card 
            key={result.id} 
            variant="outline"
            bg={cardBg}
            _hover={{ boxShadow: 'md', cursor: 'pointer' }}
            onClick={() => handleResultClick(result)}
          >
            <CardBody>
              <Grid templateColumns={{ base: "1fr", md: "3fr 1fr" }} gap={4}>
                <GridItem>
                  <VStack align="start" spacing={2}>
                    <HStack>
                      <Heading size="sm">{result.title}</Heading>
                      {getTypeBadge(result.type)}
                      {getStatusBadge(result.status)}
                    </HStack>
                    
                    <Text fontSize="sm" noOfLines={2}>
                      {result.description}
                    </Text>
                    
                    <HStack fontSize="sm" color="gray.500" spacing={4}>
                      <HStack>
                        <FiCalendar size={14} />
                        <Text>{format(new Date(result.date), 'MMM d, yyyy')}</Text>
                      </HStack>
                      
                      <HStack>
                        <FiDollarSign size={14} />
                        <Text>${result.amount.toLocaleString()}</Text>
                      </HStack>
                      
                      <HStack>
                        <FiUser size={14} />
                        <Text>
                          {result.participants.client} / {result.participants.worker}
                        </Text>
                      </HStack>
                    </HStack>
                    
                    {result.category && (
                      <Badge colorScheme="green" variant="subtle">
                        {result.category}
                      </Badge>
                    )}
                  </VStack>
                </GridItem>
                
                {result.tags && result.tags.length > 0 && (
                  <GridItem>
                    <HStack justify="flex-end" flexWrap="wrap">
                      {result.tags.map(tag => (
                        <Tag 
                          key={tag} 
                          size="sm" 
                          colorScheme="blue" 
                          variant="subtle"
                          borderRadius="full"
                        >
                          {tag}
                        </Tag>
                      ))}
                    </HStack>
                  </GridItem>
                )}
              </Grid>
            </CardBody>
          </Card>
        ))}
      </VStack>
    );
  }
};

export default Search; 