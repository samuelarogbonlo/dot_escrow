import { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Flex,
  Text,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Checkbox,
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  Tag,
  TagLabel,
  TagCloseButton,
  Collapse,
  Divider,
  useDisclosure,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  FiSearch,
  FiFilter,
  FiChevronDown,
  FiChevronUp,
  FiCalendar,
  FiDollarSign,
} from 'react-icons/fi';

export interface FilterState {
  query: string;
  status: string[];
  dateRange: [number, number];
  amountRange: [number, number];
  category: string[];
  tags: string[];
  sortBy: string;
  sortDirection: 'asc' | 'desc';
}

interface SearchFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onSearch: () => void;
  includeSort?: boolean;
  includeCategories?: boolean;
  includeTags?: boolean;
  statusOptions?: Array<{ value: string; label: string }>;
  categoryOptions?: Array<{ value: string; label: string }>;
  tagOptions?: Array<{ value: string; label: string }>;
  sortOptions?: Array<{ value: string; label: string }>;
}

const AMOUNT_RANGES = [0, 500, 1000, 2500, 5000, 10000];
const DATE_RANGES = [7, 30, 90, 180, 365];

const SearchFilters = ({
  filters,
  onFilterChange,
  onSearch,
  includeSort = true,
  includeCategories = true,
  includeTags = true,
  statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
    { value: 'disputed', label: 'Disputed' },
    { value: 'cancelled', label: 'Cancelled' },
  ],
  categoryOptions = [
    { value: 'web-development', label: 'Web Development' },
    { value: 'design', label: 'Design' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'writing', label: 'Writing' },
    { value: 'consulting', label: 'Consulting' },
  ],
  tagOptions = [
    { value: 'urgent', label: 'Urgent' },
    { value: 'high-value', label: 'High Value' },
    { value: 'recurring', label: 'Recurring' },
    { value: 'new-client', label: 'New Client' },
  ],
  sortOptions = [
    { value: 'date-desc', label: 'Newest First' },
    { value: 'date-asc', label: 'Oldest First' },
    { value: 'amount-desc', label: 'Highest Amount' },
    { value: 'amount-asc', label: 'Lowest Amount' },
    { value: 'title-asc', label: 'Title (A-Z)' },
    { value: 'title-desc', label: 'Title (Z-A)' },
  ]
}) => {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: false });
  const [tempFilters, setTempFilters] = useState<FilterState>(filters);
  
  // UI colors
  const filterBg = useColorModeValue('gray.50', 'gray.800');
  const tagBg = useColorModeValue('blue.50', 'blue.900');
  
  // Update filter state
  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setTempFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };
  
  // Toggle a status filter
  const toggleStatus = (status: string) => {
    const currentStatuses = [...tempFilters.status];
    const index = currentStatuses.indexOf(status);
    
    if (index === -1) {
      currentStatuses.push(status);
    } else {
      currentStatuses.splice(index, 1);
    }
    
    updateFilter('status', currentStatuses);
  };
  
  // Toggle a category filter
  const toggleCategory = (category: string) => {
    const currentCategories = [...tempFilters.category];
    const index = currentCategories.indexOf(category);
    
    if (index === -1) {
      currentCategories.push(category);
    } else {
      currentCategories.splice(index, 1);
    }
    
    updateFilter('category', currentCategories);
  };
  
  // Toggle a tag filter
  const toggleTag = (tag: string) => {
    const currentTags = [...tempFilters.tags];
    const index = currentTags.indexOf(tag);
    
    if (index === -1) {
      currentTags.push(tag);
    } else {
      currentTags.splice(index, 1);
    }
    
    updateFilter('tags', currentTags);
  };
  
  // Format amount for display
  const formatAmount = (amount: number) => {
    return amount >= 10000 ? '$10k+' : `$${amount}`;
  };
  
  // Format date range for display
  const formatDateRange = (days: number) => {
    if (days <= 7) return 'Last week';
    if (days <= 30) return 'Last month';
    if (days <= 90) return 'Last 3 months';
    if (days <= 180) return 'Last 6 months';
    return 'Last year';
  };
  
  // Apply filters
  const applyFilters = () => {
    onFilterChange(tempFilters);
    onSearch();
  };
  
  // Reset filters
  const resetFilters = () => {
    const defaultFilters: FilterState = {
      query: '',
      status: [],
      dateRange: [0, 4],
      amountRange: [0, 5],
      category: [],
      tags: [],
      sortBy: 'date',
      sortDirection: 'desc',
    };
    
    setTempFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };
  
  // Handle search input
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilter('query', e.target.value);
  };
  
  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };
  
  // Handle sort change
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const [sortBy, sortDirection] = value.split('-');
    
    updateFilter('sortBy', sortBy);
    updateFilter('sortDirection', sortDirection as 'asc' | 'desc');
  };
  
  // Remove a tag filter
  const removeTag = (type: 'status' | 'category' | 'tags', value: string) => {
    const updatedFilters = { ...tempFilters };
    
    updatedFilters[type] = (updatedFilters[type] as string[]).filter(item => item !== value);
    setTempFilters(updatedFilters);
  };
  
  return (
    <Box mb={6}>
      {/* Search Input */}
      <form onSubmit={handleSearchSubmit}>
        <HStack mb={4}>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <FiSearch color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="Search..."
              value={tempFilters.query}
              onChange={handleSearchInput}
            />
          </InputGroup>
          
          <Button type="submit" colorScheme="blue">
            Search
          </Button>
          
          <Button
            leftIcon={isOpen ? <FiChevronUp /> : <FiChevronDown />}
            variant="outline"
            onClick={onToggle}
          >
            {isOpen ? 'Hide Filters' : 'Show Filters'}
          </Button>
          
          {includeSort && (
            <Select
              maxW="200px"
              value={`${tempFilters.sortBy}-${tempFilters.sortDirection}`}
              onChange={handleSortChange}
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          )}
        </HStack>
      </form>
      
      {/* Applied Filters Tags */}
      {(tempFilters.status.length > 0 || 
        tempFilters.category.length > 0 || 
        tempFilters.tags.length > 0) && (
        <Flex flexWrap="wrap" mb={4} gap={2}>
          {tempFilters.status.map(status => {
            const statusOption = statusOptions.find(opt => opt.value === status);
            return (
              <Tag
                key={status}
                borderRadius="full"
                variant="subtle"
                colorScheme="blue"
                bg={tagBg}
                size="sm"
              >
                <TagLabel>Status: {statusOption?.label || status}</TagLabel>
                <TagCloseButton onClick={() => removeTag('status', status)} />
              </Tag>
            );
          })}
          
          {tempFilters.category.map(category => {
            const categoryOption = categoryOptions.find(opt => opt.value === category);
            return (
              <Tag
                key={category}
                borderRadius="full"
                variant="subtle"
                colorScheme="green"
                bg={tagBg}
                size="sm"
              >
                <TagLabel>Category: {categoryOption?.label || category}</TagLabel>
                <TagCloseButton onClick={() => removeTag('category', category)} />
              </Tag>
            );
          })}
          
          {tempFilters.tags.map(tag => {
            const tagOption = tagOptions.find(opt => opt.value === tag);
            return (
              <Tag
                key={tag}
                borderRadius="full"
                variant="subtle"
                colorScheme="purple"
                bg={tagBg}
                size="sm"
              >
                <TagLabel>Tag: {tagOption?.label || tag}</TagLabel>
                <TagCloseButton onClick={() => removeTag('tags', tag)} />
              </Tag>
            );
          })}
          
          {(tempFilters.status.length > 0 || 
            tempFilters.category.length > 0 || 
            tempFilters.tags.length > 0) && (
            <Button size="xs" variant="link" onClick={resetFilters}>
              Clear all
            </Button>
          )}
        </Flex>
      )}
      
      {/* Expanded Filters */}
      <Collapse in={isOpen} animateOpacity>
        <Box
          p={4}
          bg={filterBg}
          borderRadius="md"
          border="1px solid"
          borderColor="gray.200"
        >
          <Flex flexWrap="wrap" gap={6}>
            {/* Status Filters */}
            <Box minW="150px" flex="1">
              <Text fontWeight="medium" mb={2}>Status</Text>
              <VStack align="start" spacing={1}>
                {statusOptions.map(option => (
                  <Checkbox
                    key={option.value}
                    isChecked={tempFilters.status.includes(option.value)}
                    onChange={() => toggleStatus(option.value)}
                    size="sm"
                  >
                    {option.label}
                  </Checkbox>
                ))}
              </VStack>
            </Box>
            
            {/* Amount Range */}
            <Box minW="200px" flex="1">
              <Text fontWeight="medium" mb={2}>
                <HStack>
                  <FiDollarSign size={14} />
                  <Text>Amount Range</Text>
                </HStack>
              </Text>
              
              <Box px={2}>
                <RangeSlider
                  value={tempFilters.amountRange}
                  min={0}
                  max={5}
                  step={1}
                  onChange={(val) => updateFilter('amountRange', val as [number, number])}
                  mb={2}
                >
                  <RangeSliderTrack>
                    <RangeSliderFilledTrack />
                  </RangeSliderTrack>
                  <RangeSliderThumb index={0} />
                  <RangeSliderThumb index={1} />
                </RangeSlider>
                
                <Flex justify="space-between">
                  <Text fontSize="xs">
                    {formatAmount(AMOUNT_RANGES[tempFilters.amountRange[0]])}
                  </Text>
                  <Text fontSize="xs">
                    {formatAmount(AMOUNT_RANGES[tempFilters.amountRange[1]])}
                  </Text>
                </Flex>
              </Box>
            </Box>
            
            {/* Date Range */}
            <Box minW="200px" flex="1">
              <Text fontWeight="medium" mb={2}>
                <HStack>
                  <FiCalendar size={14} />
                  <Text>Date Range</Text>
                </HStack>
              </Text>
              
              <Box px={2}>
                <RangeSlider
                  value={tempFilters.dateRange}
                  min={0}
                  max={4}
                  step={1}
                  onChange={(val) => updateFilter('dateRange', val as [number, number])}
                  mb={2}
                >
                  <RangeSliderTrack>
                    <RangeSliderFilledTrack />
                  </RangeSliderTrack>
                  <RangeSliderThumb index={0} />
                  <RangeSliderThumb index={1} />
                </RangeSlider>
                
                <Flex justify="space-between">
                  <Text fontSize="xs">
                    {formatDateRange(DATE_RANGES[tempFilters.dateRange[0]])}
                  </Text>
                  <Text fontSize="xs">
                    {formatDateRange(DATE_RANGES[tempFilters.dateRange[1]])}
                  </Text>
                </Flex>
              </Box>
            </Box>
            
            {/* Categories */}
            {includeCategories && (
              <Box minW="150px" flex="1">
                <Text fontWeight="medium" mb={2}>Categories</Text>
                <VStack align="start" spacing={1}>
                  {categoryOptions.map(option => (
                    <Checkbox
                      key={option.value}
                      isChecked={tempFilters.category.includes(option.value)}
                      onChange={() => toggleCategory(option.value)}
                      size="sm"
                    >
                      {option.label}
                    </Checkbox>
                  ))}
                </VStack>
              </Box>
            )}
            
            {/* Tags */}
            {includeTags && (
              <Box minW="150px" flex="1">
                <Text fontWeight="medium" mb={2}>Tags</Text>
                <VStack align="start" spacing={1}>
                  {tagOptions.map(option => (
                    <Checkbox
                      key={option.value}
                      isChecked={tempFilters.tags.includes(option.value)}
                      onChange={() => toggleTag(option.value)}
                      size="sm"
                    >
                      {option.label}
                    </Checkbox>
                  ))}
                </VStack>
              </Box>
            )}
          </Flex>
          
          <Divider my={4} />
          
          <Flex justifyContent="flex-end" gap={2}>
            <Button size="sm" variant="outline" onClick={resetFilters}>
              Reset
            </Button>
            <Button size="sm" colorScheme="blue" onClick={applyFilters}>
              Apply Filters
            </Button>
          </Flex>
        </Box>
      </Collapse>
    </Box>
  );
};

export default SearchFilters; 