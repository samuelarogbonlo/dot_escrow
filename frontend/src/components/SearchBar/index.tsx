import { useState } from 'react';
import {
  InputGroup,
  InputLeftElement,
  Input,
  IconButton,
  HStack,
  useColorModeValue,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Box,
  Text,
  Flex,
  Badge,
} from '@chakra-ui/react';
import { FiSearch, FiChevronRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

interface QuickSearchResult {
  id: string;
  title: string;
  type: 'escrow' | 'milestone' | 'transaction';
  status: string;
}

const SearchBar = () => {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<QuickSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // UI colors
  const inputBg = useColorModeValue('white', 'gray.800');
  const itemHoverBg = useColorModeValue('gray.50', 'gray.700');
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Perform quick search if at least 2 characters entered
    if (value.length >= 2) {
      setIsSearching(true);
      
      // Mock quick search results
      // In a real app, this would be an API call
      setTimeout(() => {
        const mockResults: QuickSearchResult[] = [
          { id: 'escrow-1', title: 'Website Development', type: 'escrow' as 'escrow', status: 'active' },
          { id: 'escrow-2', title: 'Logo Design', type: 'escrow' as 'escrow', status: 'completed' },
          { id: 'milestone-1', title: 'Homepage Design', type: 'milestone' as 'milestone', status: 'pending' },
          { id: 'transaction-1', title: 'Payment for Homepage', type: 'transaction' as 'transaction', status: 'completed' },
        ].filter(result => 
          result.title.toLowerCase().includes(value.toLowerCase())
        ).slice(0, 4); // Limit to 4 results
        
        setResults(mockResults);
        setIsSearching(false);
      }, 300);
    } else {
      setResults([]);
    }
  };
  
  // Handle view all results
  const handleViewAllResults = () => {
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    onClose();
    setSearchQuery('');
  };
  
  // Handle result click
  const handleResultClick = (result: QuickSearchResult) => {
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
    }
    onClose();
    setSearchQuery('');
  };
  
  // Handle form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      onClose();
      setSearchQuery('');
    }
  };
  
  // Get type badge
  const getTypeBadge = (type: 'escrow' | 'milestone' | 'transaction') => {
    switch(type) {
      case 'escrow':
        return <Badge colorScheme="purple" size="sm">Escrow</Badge>;
      case 'milestone':
        return <Badge colorScheme="teal" size="sm">Milestone</Badge>;
      case 'transaction':
        return <Badge colorScheme="blue" size="sm">Transaction</Badge>;
      default:
        return null;
    }
  };
  
  return (
    <>
      <HStack
        onClick={onOpen}
        bg={inputBg}
        borderRadius="md"
        py={2}
        px={4}
        w={{ base: 'full', md: '300px' }}
        cursor="pointer"
        border="1px solid"
        borderColor="gray.200"
        _hover={{ borderColor: 'gray.300' }}
        role="group"
      >
        <FiSearch color="gray.400" />
        <Text color="gray.500">Search...</Text>
      </HStack>
      
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader p={0}>
            <form onSubmit={handleSearchSubmit}>
              <InputGroup size="lg">
                <InputLeftElement pointerEvents="none">
                  <FiSearch color="gray.400" />
                </InputLeftElement>
                <Input 
                  placeholder="Search escrows, milestones, transactions..." 
                  border="none"
                  _focus={{ boxShadow: 'none' }}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  autoFocus
                />
              </InputGroup>
            </form>
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody py={4}>
            {isSearching ? (
              <Text textAlign="center" color="gray.500">Searching...</Text>
            ) : results.length > 0 ? (
              <Box>
                {results.map(result => (
                  <Flex
                    key={result.id}
                    alignItems="center"
                    justifyContent="space-between"
                    py={2}
                    px={3}
                    borderRadius="md"
                    _hover={{ bg: itemHoverBg, cursor: 'pointer' }}
                    onClick={() => handleResultClick(result)}
                  >
                    <Box>
                      <Text fontWeight="medium">{result.title}</Text>
                      <Flex alignItems="center" mt={1}>
                        {getTypeBadge(result.type)}
                        <Text fontSize="sm" color="gray.500" ml={2}>
                          {result.status}
                        </Text>
                      </Flex>
                    </Box>
                    <IconButton
                      aria-label="View result"
                      icon={<FiChevronRight />}
                      variant="ghost"
                      size="sm"
                    />
                  </Flex>
                ))}
              </Box>
            ) : searchQuery.length >= 2 ? (
              <Text textAlign="center" color="gray.500">No results found</Text>
            ) : (
              <Text textAlign="center" color="gray.500">Enter at least 2 characters to search</Text>
            )}
          </ModalBody>
          
          <ModalFooter borderTop="1px solid" borderColor="gray.100">
            <HStack w="full" justifyContent="space-between">
              <Text fontSize="sm" color="gray.500">
                Press Enter for full search
              </Text>
              <Button 
                rightIcon={<FiChevronRight />} 
                colorScheme="blue" 
                variant="link"
                onClick={handleViewAllResults}
                isDisabled={!searchQuery}
              >
                View all results
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default SearchBar; 