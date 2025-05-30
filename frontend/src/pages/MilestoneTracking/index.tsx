import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Grid,
  GridItem,
  Card,
  CardHeader,
  CardBody,
  VStack,
  HStack,
  Badge,
  Flex,
  Button,
  IconButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Progress,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  useColorModeValue,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Divider,
  useToast,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Textarea,
} from '@chakra-ui/react';
import { 
  FiClock, 
  FiCheckCircle, 
  FiXCircle, 
  FiAlertTriangle, 
  FiSearch,
  FiFilter, 
  FiChevronDown, 
  FiFileText, 
  FiPaperclip, 
  FiUpload,
  FiThumbsUp,
  FiEye,
  FiFlag,
  FiCalendar,
  FiArrowRight,
  FiArrowUp,
  FiArrowDown,
} from 'react-icons/fi';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useWallet } from '../../hooks/useWalletContext';

// Define types
type MilestoneStatus = 'pending' | 'active' | 'completed' | 'disputed';
type EscrowStatus = 'active' | 'completed' | 'disputed' | 'cancelled';

interface Milestone {
  id: string;
  escrowId: string;
  escrowTitle: string;
  description: string;
  amount: string;
  deadline: Date;
  status: MilestoneStatus;
  completionDate?: Date;
  evidence?: string[];
  notes?: string;
  isLate?: boolean;
}

interface MilestoneUpload {
  milestoneId: string;
  description: string;
  files: File[];
}

// Create mock data for development
const mockMilestones: Milestone[] = [
  {
    id: '1-1',
    escrowId: '1',
    escrowTitle: 'Website Redesign Project',
    description: 'Initial Wireframes and Design Concepts',
    amount: '500',
    deadline: new Date(2023, 3, 1),
    status: 'completed',
    completionDate: new Date(2023, 2, 28),
    evidence: ['wireframe.pdf', 'design-mockups.zip'],
  },
  {
    id: '1-2',
    escrowId: '1',
    escrowTitle: 'Website Redesign Project',
    description: 'Homepage and Core Pages Development',
    amount: '1000',
    deadline: new Date(2023, 4, 1),
    status: 'active',
    notes: 'In progress. Expect completion by end of week.',
  },
  {
    id: '1-3',
    escrowId: '1',
    escrowTitle: 'Website Redesign Project',
    description: 'Responsive Implementation and Testing',
    amount: '500',
    deadline: new Date(2023, 4, 15),
    status: 'pending',
  },
  {
    id: '1-4',
    escrowId: '1',
    escrowTitle: 'Website Redesign Project',
    description: 'Final Delivery and Content Migration',
    amount: '500',
    deadline: new Date(2023, 5, 1),
    status: 'pending',
  },
  {
    id: '3-1',
    escrowId: '3',
    escrowTitle: 'Logo Design Services',
    description: 'Initial Logo Concepts',
    amount: '250',
    deadline: new Date(2023, 3, 15),
    status: 'completed',
    completionDate: new Date(2023, 3, 14),
    evidence: ['logo-concepts.pdf'],
  },
  {
    id: '3-2',
    escrowId: '3',
    escrowTitle: 'Logo Design Services',
    description: 'Final Logo Design with Source Files',
    amount: '250',
    deadline: new Date(2023, 3, 30),
    status: 'active',
    isLate: true,
  },
  {
    id: '4-2',
    escrowId: '4',
    escrowTitle: 'Content Writing',
    description: 'Blog Post Series - Part 2',
    amount: '300',
    deadline: new Date(2023, 1, 5),
    status: 'disputed',
    notes: 'Content does not meet our quality standards. Requested revisions.',
  },
];

const MilestoneTracking = () => {
  const navigate = useNavigate();
  const toast = useToast();
  
  // State
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [filteredMilestones, setFilteredMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<MilestoneStatus | 'all'>('all');
  const [sortField, setSortField] = useState<keyof Milestone>('deadline');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Selected milestone for actions
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  
  // Evidence upload state
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  
  // Modals
  const evidenceModal = useDisclosure();
  const viewEvidenceModal = useDisclosure();
  const releaseModal = useDisclosure();
  const disputeModal = useDisclosure();
  const [disputeReason, setDisputeReason] = useState('');
  
  // Wallet connection
  const { 
    selectedAccount, 
    isApiReady, 
    isExtensionReady, 
    releaseMilestone,
    disputeMilestone,
  } = useWallet();
  
  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const statBg = useColorModeValue('blue.50', 'blue.900');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  
  // Load milestones
  useEffect(() => {
    const fetchMilestones = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // For development, use mock data with a delay to simulate loading
        setTimeout(() => {
          setMilestones(mockMilestones);
          setIsLoading(false);
        }, 1000);
        
        // When API is ready, uncomment this code
        // if (isApiReady && isExtensionReady && selectedAccount) {
        //   const response = await api.listMilestones();
        //   if (response.success) {
        //     setMilestones(response.milestones);
        //   } else {
        //     setError(response.error || 'Failed to fetch milestones');
        //     setMilestones(mockMilestones); // Fallback to mock data
        //   }
        // }
      } catch (err) {
        console.error('Error fetching milestones:', err);
        setError('Failed to fetch milestones. Please try again later.');
        setMilestones(mockMilestones); // Fallback to mock data
        setIsLoading(false);
      }
    };
    
    fetchMilestones();
  }, [isApiReady, isExtensionReady, selectedAccount]);
  
  // Apply filters and sorting
  useEffect(() => {
    let result = [...milestones];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(m => 
        m.description.toLowerCase().includes(query) || 
        m.escrowTitle.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(m => m.status === statusFilter);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      if (sortField === 'deadline' || sortField === 'completionDate') {
        const aDate = a[sortField] instanceof Date ? (a[sortField] as Date).getTime() : 0;
        const bDate = b[sortField] instanceof Date ? (b[sortField] as Date).getTime() : 0;
        
        return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
      } else if (sortField === 'amount') {
        return sortDirection === 'asc'
          ? parseFloat(a.amount) - parseFloat(b.amount)
          : parseFloat(b.amount) - parseFloat(a.amount);
      } else {
        // String comparison
        const aValue = String(a[sortField]).toLowerCase();
        const bValue = String(b[sortField]).toLowerCase();
        
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
    });
    
    setFilteredMilestones(result);
  }, [milestones, searchQuery, statusFilter, sortField, sortDirection]);
  
  // Calculate statistics
  const stats = {
    total: milestones.length,
    completed: milestones.filter(m => m.status === 'completed').length,
    active: milestones.filter(m => m.status === 'active').length,
    pending: milestones.filter(m => m.status === 'pending').length,
    disputed: milestones.filter(m => m.status === 'disputed').length,
    late: milestones.filter(m => m.isLate).length,
    upcomingDeadlines: milestones.filter(m => 
      m.status === 'active' && 
      m.deadline && 
      m.deadline.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
    ).length,
  };
  
  // Handle sort change
  const handleSort = (field: keyof Milestone) => {
    if (field === sortField) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, set to default direction
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Format date
  const formatDate = (date?: Date) => {
    if (!date) return 'N/A';
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };
  
  // Get relative time (e.g., 3 days ago, 2 days remaining)
  const getRelativeTime = (date: Date, isPast = false) => {
    const now = new Date();
    const diffTime = Math.abs(date.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (isPast) {
      return diffDays === 0 ? 'Today' : `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      if (date.getTime() < now.getTime()) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} overdue`;
      }
      return diffDays === 0 ? 'Due today' : `${diffDays} day${diffDays !== 1 ? 's' : ''} remaining`;
    }
  };
  
  // Get status badge
  const getStatusBadge = (status: MilestoneStatus, isLate?: boolean) => {
    switch(status) {
      case 'active':
        return isLate 
          ? <Badge colorScheme="orange" display="flex" alignItems="center"><FiClock style={{ marginRight: '4px' }} /> Overdue</Badge>
          : <Badge colorScheme="blue" display="flex" alignItems="center"><FiClock style={{ marginRight: '4px' }} /> Active</Badge>;
      case 'completed':
        return <Badge colorScheme="green" display="flex" alignItems="center"><FiCheckCircle style={{ marginRight: '4px' }} /> Completed</Badge>;
      case 'disputed':
        return <Badge colorScheme="orange" display="flex" alignItems="center"><FiAlertTriangle style={{ marginRight: '4px' }} /> Disputed</Badge>;
      case 'pending':
        return <Badge colorScheme="gray" display="flex" alignItems="center"><FiClock style={{ marginRight: '4px' }} /> Pending</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };
  
  // Handle evidence upload
  const handleEvidenceUpload = async () => {
    if (!selectedMilestone) return;
    
    try {
      // Simulate successful upload
      toast({
        title: 'Evidence uploaded',
        description: 'Your work evidence was successfully uploaded',
        status: 'success',
        duration: 5000,
      });
      
      // Update local state for demonstration
      const updatedMilestones = milestones.map(m => 
        m.id === selectedMilestone.id 
          ? { 
              ...m, 
              evidence: [...(m.evidence || []), ...evidenceFiles.map(f => f.name)],
              notes: evidenceDescription,
            } 
          : m
      );
      
      setMilestones(updatedMilestones);
      
      // Reset form
      setEvidenceDescription('');
      setEvidenceFiles([]);
      evidenceModal.onClose();
    } catch (err) {
      console.error('Error uploading evidence:', err);
      toast({
        title: 'Upload failed',
        description: 'There was an error uploading your evidence',
        status: 'error',
        duration: 5000,
      });
    }
  };
  
  // Handle milestone release
  const handleReleaseMilestone = async () => {
    if (!selectedMilestone) return;
    
    try {
      // For development, simulate successful release
      toast({
        title: 'Milestone released',
        description: 'Payment has been released for this milestone',
        status: 'success',
        duration: 5000,
      });
      
      // Update local state for demonstration
      const updatedMilestones = milestones.map(m => 
        m.id === selectedMilestone.id 
          ? { ...m, status: 'completed' as MilestoneStatus, completionDate: new Date() } 
          : m
      );
      
      setMilestones(updatedMilestones);
      releaseModal.onClose();
    } catch (err) {
      console.error('Error releasing milestone:', err);
      toast({
        title: 'Release failed',
        description: 'There was an error releasing the payment',
        status: 'error',
        duration: 5000,
      });
    }
  };
  
  // Handle milestone dispute
  const handleDisputeMilestone = async () => {
    if (!selectedMilestone) return;
    
    try {
      // For development, simulate successful dispute
      toast({
        title: 'Dispute filed',
        description: 'Your dispute has been submitted for review',
        status: 'info',
        duration: 5000,
      });
      
      // Update local state for demonstration
      const updatedMilestones = milestones.map(m => 
        m.id === selectedMilestone.id 
          ? { ...m, status: 'disputed' as MilestoneStatus, notes: disputeReason } 
          : m
      );
      
      setMilestones(updatedMilestones);
      setDisputeReason('');
      disputeModal.onClose();
    } catch (err) {
      console.error('Error disputing milestone:', err);
      toast({
        title: 'Dispute failed',
        description: 'There was an error filing your dispute',
        status: 'error',
        duration: 5000,
      });
    }
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading milestone data...</Text>
      </Box>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Box>
        <Heading size="lg" mb={4}>Milestone Tracking</Heading>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      </Box>
    );
  }
  
  return (
    <Box>
      <Heading size="lg" mb={6}>Milestone Tracking</Heading>
      
      {/* Stats Summary */}
      <Grid 
        templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }} 
        gap={4}
        mb={6}
      >
        <GridItem>
          <Stat bg={statBg} p={4} borderRadius="md" boxShadow="sm">
            <StatLabel>Active Milestones</StatLabel>
            <StatNumber>{stats.active}</StatNumber>
            <StatHelpText>
              {stats.late > 0 && (
                <Text color="orange.500">{stats.late} overdue</Text>
              )}
            </StatHelpText>
          </Stat>
        </GridItem>
        
        <GridItem>
          <Stat bg={statBg} p={4} borderRadius="md" boxShadow="sm">
            <StatLabel>Completed</StatLabel>
            <StatNumber>{stats.completed}</StatNumber>
            <StatHelpText>
              {milestones.length > 0 && (
                <Text>{Math.round((stats.completed / milestones.length) * 100)}% of total</Text>
              )}
            </StatHelpText>
          </Stat>
        </GridItem>
        
        <GridItem>
          <Stat bg={statBg} p={4} borderRadius="md" boxShadow="sm">
            <StatLabel>Upcoming Deadlines</StatLabel>
            <StatNumber>{stats.upcomingDeadlines}</StatNumber>
            <StatHelpText>Within 7 days</StatHelpText>
          </Stat>
        </GridItem>
        
        <GridItem>
          <Stat bg={statBg} p={4} borderRadius="md" boxShadow="sm">
            <StatLabel>Issues</StatLabel>
            <StatNumber>{stats.disputed}</StatNumber>
            <StatHelpText>Disputed milestones</StatHelpText>
          </Stat>
        </GridItem>
      </Grid>
      
      {/* Filters and Search */}
      <Card mb={6} variant="outline" bg={cardBg}>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
              <InputGroup flex={1}>
                <InputLeftElement pointerEvents="none">
                  <FiSearch color="gray.400" />
                </InputLeftElement>
                <Input 
                  placeholder="Search milestones..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </InputGroup>
              
              <HStack spacing={2}>
                <Select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value as MilestoneStatus | 'all')}
                  width={{ base: 'full', md: '150px' }}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="disputed">Disputed</option>
                </Select>
                
                <Menu>
                  <MenuButton as={Button} rightIcon={<FiChevronDown />} size="md" variant="outline">
                    Sort By
                  </MenuButton>
                  <MenuList>
                    <MenuItem onClick={() => handleSort('deadline')}>
                      Deadline {sortField === 'deadline' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </MenuItem>
                    <MenuItem onClick={() => handleSort('status')}>
                      Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </MenuItem>
                    <MenuItem onClick={() => handleSort('amount')}>
                      Amount {sortField === 'amount' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </MenuItem>
                    <MenuItem onClick={() => handleSort('escrowTitle')}>
                      Escrow Title {sortField === 'escrowTitle' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </MenuItem>
                  </MenuList>
                </Menu>
              </HStack>
            </Flex>
          </VStack>
        </CardBody>
      </Card>
      
      {/* Milestone Tabs */}
      <Tabs variant="enclosed" colorScheme="blue" isLazy>
        <TabList>
          <Tab>All Milestones ({filteredMilestones.length})</Tab>
          <Tab>Active ({stats.active})</Tab>
          <Tab>Upcoming ({stats.pending})</Tab>
          <Tab>Completed ({stats.completed})</Tab>
          {stats.disputed > 0 && <Tab>Disputed ({stats.disputed})</Tab>}
        </TabList>
        
        <TabPanels>
          {/* All Milestones Panel */}
          <TabPanel p={0} pt={6}>
            {renderMilestoneList(filteredMilestones)}
          </TabPanel>
          
          {/* Active Milestones Panel */}
          <TabPanel p={0} pt={6}>
            {renderMilestoneList(filteredMilestones.filter(m => m.status === 'active'))}
          </TabPanel>
          
          {/* Upcoming Milestones Panel */}
          <TabPanel p={0} pt={6}>
            {renderMilestoneList(filteredMilestones.filter(m => m.status === 'pending'))}
          </TabPanel>
          
          {/* Completed Milestones Panel */}
          <TabPanel p={0} pt={6}>
            {renderMilestoneList(filteredMilestones.filter(m => m.status === 'completed'))}
          </TabPanel>
          
          {/* Disputed Milestones Panel */}
          {stats.disputed > 0 && (
            <TabPanel p={0} pt={6}>
              {renderMilestoneList(filteredMilestones.filter(m => m.status === 'disputed'))}
            </TabPanel>
          )}
        </TabPanels>
      </Tabs>
      
      {/* Evidence Upload Modal */}
      <Modal isOpen={evidenceModal.isOpen} onClose={evidenceModal.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Upload Work Evidence</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text>
                Milestone: <strong>{selectedMilestone?.description}</strong>
              </Text>
              
              <FormControl isRequired>
                <FormLabel>Evidence Description</FormLabel>
                <Textarea 
                  value={evidenceDescription}
                  onChange={(e) => setEvidenceDescription(e.target.value)}
                  placeholder="Describe what you're submitting as evidence of work completion..."
                  rows={4}
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Upload Files</FormLabel>
                <Box
                  border="2px dashed"
                  borderColor="gray.300"
                  borderRadius="md"
                  p={6}
                  textAlign="center"
                >
                  <VStack spacing={2}>
                    <FiUpload size={24} />
                    <Text>Drag files here or click to browse</Text>
                    <Text fontSize="xs" color="gray.500">
                      Supports images, PDFs, and zip files up to 50MB
                    </Text>
                    <Input
                      type="file"
                      height="100%"
                      width="100%"
                      position="absolute"
                      top="0"
                      left="0"
                      opacity="0"
                      aria-hidden="true"
                      accept="image/*,.pdf,.zip"
                      multiple
                      onChange={(e) => {
                        if (e.target.files) {
                          setEvidenceFiles(Array.from(e.target.files));
                        }
                      }}
                    />
                  </VStack>
                </Box>
                
                {evidenceFiles.length > 0 && (
                  <Box mt={2}>
                    <Text fontWeight="medium">Selected Files:</Text>
                    <VStack align="start" mt={1}>
                      {evidenceFiles.map((file, index) => (
                        <HStack key={index}>
                          <FiPaperclip />
                          <Text fontSize="sm">{file.name}</Text>
                        </HStack>
                      ))}
                    </VStack>
                  </Box>
                )}
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={evidenceModal.onClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleEvidenceUpload}
              isDisabled={!evidenceDescription || evidenceFiles.length === 0}
            >
              Upload Evidence
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* View Evidence Modal */}
      <Modal isOpen={viewEvidenceModal.isOpen} onClose={viewEvidenceModal.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Work Evidence</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedMilestone && (
              <VStack spacing={4} align="stretch">
                <Text>
                  Milestone: <strong>{selectedMilestone.description}</strong>
                </Text>
                
                {selectedMilestone.notes && (
                  <Box>
                    <Text fontWeight="medium">Notes:</Text>
                    <Text mt={1}>{selectedMilestone.notes}</Text>
                  </Box>
                )}
                
                {selectedMilestone.evidence && selectedMilestone.evidence.length > 0 ? (
                  <Box>
                    <Text fontWeight="medium">Uploaded Files:</Text>
                    <VStack align="start" mt={2}>
                      {selectedMilestone.evidence.map((file, index) => (
                        <HStack key={index}>
                          <FiPaperclip />
                          <Text>{file}</Text>
                          <Button size="xs" leftIcon={<FiDownload />} variant="ghost">
                            Download
                          </Button>
                        </HStack>
                      ))}
                    </VStack>
                  </Box>
                ) : (
                  <Alert status="info">
                    <AlertIcon />
                    <AlertTitle>No evidence files uploaded</AlertTitle>
                  </Alert>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={viewEvidenceModal.onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Release Milestone Modal */}
      <Modal isOpen={releaseModal.isOpen} onClose={releaseModal.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Release Milestone Payment</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedMilestone && (
              <VStack align="start" spacing={3}>
                <Text>You are about to release payment for the following milestone:</Text>
                <Box p={4} bg="gray.50" borderRadius="md" w="100%">
                  <Text fontWeight="medium">{selectedMilestone.description}</Text>
                  <Text mt={1}>Amount: {selectedMilestone.amount} USDT</Text>
                  <Text mt={1}>Escrow: {selectedMilestone.escrowTitle}</Text>
                </Box>
                <Alert status="info">
                  <AlertIcon />
                  <Text fontSize="sm">
                    By releasing this milestone, you confirm that the work has been completed satisfactorily.
                    The funds will be transferred to the worker immediately and cannot be reversed.
                  </Text>
                </Alert>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={releaseModal.onClose}>
              Cancel
            </Button>
            <Button colorScheme="green" onClick={handleReleaseMilestone}>
              Confirm Release
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Dispute Milestone Modal */}
      <Modal isOpen={disputeModal.isOpen} onClose={disputeModal.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Dispute Milestone</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedMilestone && (
              <VStack align="start" spacing={3}>
                <Text>You are disputing the following milestone:</Text>
                <Box p={4} bg="gray.50" borderRadius="md" w="100%">
                  <Text fontWeight="medium">{selectedMilestone.description}</Text>
                  <Text mt={1}>Amount: {selectedMilestone.amount} USDT</Text>
                  <Text mt={1}>Escrow: {selectedMilestone.escrowTitle}</Text>
                </Box>
                <FormControl isRequired>
                  <FormLabel>Reason for dispute:</FormLabel>
                  <Textarea 
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    placeholder="Please explain why you are disputing this milestone..."
                    rows={4}
                  />
                </FormControl>
                <Alert status="warning">
                  <AlertIcon />
                  <Text fontSize="sm">
                    Disputes will be reviewed according to the platform's dispute resolution process.
                    Please provide clear details to help resolve the issue.
                  </Text>
                </Alert>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={disputeModal.onClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="orange" 
              onClick={handleDisputeMilestone} 
              isDisabled={!disputeReason.trim()}
            >
              Submit Dispute
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
  
  // Helper function to render milestone list
  function renderMilestoneList(milestones: Milestone[]) {
    if (milestones.length === 0) {
      return (
        <Box textAlign="center" py={10}>
          <FiFilter size={40} color="gray" />
          <Heading size="md" mt={4}>No milestones found</Heading>
          <Text>Try adjusting your filters or create a new escrow</Text>
        </Box>
      );
    }
    
    return (
      <VStack spacing={4} align="stretch">
        {milestones.map((milestone) => (
          <Card 
            key={milestone.id} 
            variant="outline" 
            borderColor={milestone.status === 'active' ? 'blue.500' : borderColor}
            _hover={{ boxShadow: 'md' }}
            transition="all 0.2s"
          >
            <CardBody>
              <Grid templateColumns={{ base: "1fr", md: "3fr 1fr" }} gap={4}>
                <GridItem>
                  <VStack align="start" spacing={3}>
                    <Flex justifyContent="space-between" width="100%" alignItems="flex-start">
                      <HStack>
                        <Heading size="sm" mr={2}>{milestone.description}</Heading>
                        {getStatusBadge(milestone.status, milestone.isLate)}
                      </HStack>
                      <Text fontWeight="bold">{milestone.amount} USDT</Text>
                    </Flex>
                    
                    <Text fontSize="sm" color="gray.500">
                      Escrow: {milestone.escrowTitle}
                    </Text>
                    
                    <HStack spacing={4}>
                      <HStack>
                        <FiCalendar size={14} />
                        <Text fontSize="sm">
                          {milestone.status === 'completed' 
                            ? `Completed: ${formatDate(milestone.completionDate)}` 
                            : `Deadline: ${formatDate(milestone.deadline)}`}
                        </Text>
                      </HStack>
                      
                      {milestone.status === 'completed' ? (
                        <Text fontSize="sm" color="green.500">
                          {milestone.completionDate && getRelativeTime(milestone.completionDate, true)}
                        </Text>
                      ) : milestone.deadline ? (
                        <Text 
                          fontSize="sm" 
                          color={milestone.isLate ? "red.500" : 
                            (milestone.deadline.getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000 ? "orange.500" : "blue.500")}
                        >
                          {getRelativeTime(milestone.deadline)}
                        </Text>
                      ) : null}
                    </HStack>
                    
                    {milestone.notes && (
                      <Text fontSize="sm" fontStyle="italic">
                        Note: {milestone.notes}
                      </Text>
                    )}
                    
                    {milestone.evidence && milestone.evidence.length > 0 && (
                      <HStack>
                        <FiPaperclip size={14} />
                        <Text fontSize="sm">{milestone.evidence.length} file(s) attached</Text>
                        <Button 
                          size="xs" 
                          leftIcon={<FiEye />} 
                          variant="ghost"
                          onClick={() => {
                            setSelectedMilestone(milestone);
                            viewEvidenceModal.onOpen();
                          }}
                        >
                          View
                        </Button>
                      </HStack>
                    )}
                  </VStack>
                </GridItem>
                
                <GridItem>
                  <Flex height="100%" alignItems="center" justifyContent={{ base: "flex-start", md: "flex-end" }}>
                    <VStack spacing={2} align={{ base: "start", md: "end" }}>
                      {/* Show appropriate actions based on milestone status */}
                      {milestone.status === 'active' && (
                        <>
                          <Button 
                            size="sm" 
                            leftIcon={<FiUpload />} 
                            colorScheme="blue"
                            onClick={() => {
                              setSelectedMilestone(milestone);
                              setEvidenceDescription('');
                              setEvidenceFiles([]);
                              evidenceModal.onOpen();
                            }}
                          >
                            Upload Evidence
                          </Button>
                          
                          <Button 
                            size="sm" 
                            leftIcon={<FiThumbsUp />} 
                            colorScheme="green"
                            onClick={() => {
                              setSelectedMilestone(milestone);
                              releaseModal.onOpen();
                            }}
                          >
                            Release Payment
                          </Button>
                          
                          <Button 
                            size="sm" 
                            leftIcon={<FiFlag />} 
                            colorScheme="orange"
                            variant="outline"
                            onClick={() => {
                              setSelectedMilestone(milestone);
                              setDisputeReason('');
                              disputeModal.onOpen();
                            }}
                          >
                            Dispute
                          </Button>
                        </>
                      )}
                      
                      {milestone.status === 'pending' && (
                        <Button 
                          size="sm" 
                          leftIcon={<FiArrowRight />} 
                          colorScheme="blue"
                          variant="outline"
                          as={RouterLink}
                          to={`/escrow/${milestone.escrowId}`}
                        >
                          View Escrow
                        </Button>
                      )}
                      
                      {milestone.status === 'completed' && (
                        <VStack spacing={2} align={{ base: "start", md: "end" }}>
                          {milestone.evidence && milestone.evidence.length > 0 ? (
                            <Button 
                              size="sm" 
                              leftIcon={<FiEye />} 
                              colorScheme="blue"
                              variant="outline"
                              onClick={() => {
                                setSelectedMilestone(milestone);
                                viewEvidenceModal.onOpen();
                              }}
                            >
                              View Evidence
                            </Button>
                          ) : (
                            <Text fontSize="sm" fontStyle="italic">No evidence uploaded</Text>
                          )}
                          
                          <Button 
                            size="sm" 
                            leftIcon={<FiArrowRight />} 
                            colorScheme="blue"
                            variant="outline"
                            as={RouterLink}
                            to={`/escrow/${milestone.escrowId}`}
                          >
                            View Escrow
                          </Button>
                        </VStack>
                      )}
                      
                      {milestone.status === 'disputed' && (
                        <VStack spacing={2} align={{ base: "start", md: "end" }}>
                          <Button 
                            size="sm" 
                            leftIcon={<FiArrowRight />} 
                            colorScheme="orange"
                            as={RouterLink}
                            to={`/disputes/${milestone.id}`}
                          >
                            View Dispute
                          </Button>
                          
                          <Button 
                            size="sm" 
                            leftIcon={<FiArrowRight />} 
                            variant="outline"
                            as={RouterLink}
                            to={`/escrow/${milestone.escrowId}`}
                          >
                            View Escrow
                          </Button>
                        </VStack>
                      )}
                    </VStack>
                  </Flex>
                </GridItem>
              </Grid>
            </CardBody>
          </Card>
        ))}
      </VStack>
    );
  }
};

export default MilestoneTracking; 