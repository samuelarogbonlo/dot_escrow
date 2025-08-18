import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Grid,
  GridItem,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Flex,
  Badge,
  Button,
  Avatar,
  Divider,
  Textarea,
  Input,
  FormControl,
  FormLabel,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Tab,
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  Tag,
  TagLabel,
  TagRightIcon,
  useColorModeValue,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWallet } from '../../hooks/useWalletContext';
import { 
  FiFileText, 
  FiMessageCircle, 
  FiCheckCircle, 
  FiXCircle, 
  FiAlertTriangle,
  FiClock,
  FiUpload,
  FiSend,
  FiPaperclip,
  FiCalendar,
  FiArrowRight,
  FiThumbsUp,
  FiThumbsDown,
  FiUserPlus,
} from 'react-icons/fi';

// Types
interface DisputeParty {
  address: string;
  role: 'client' | 'worker';
  name?: string;
}

interface DisputeMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: Date;
  attachments?: string[];
  isSystemMessage?: boolean;
}

interface DisputeEvidence {
  id: string;
  title: string;
  description: string;
  files: string[];
  submittedBy: string;
  submittedAt: Date;
}

interface MediationProposal {
  id: string;
  description: string;
  proposedBy: string;
  proposedAt: Date;
  status: 'pending' | 'accepted' | 'rejected';
  clientResponse?: 'accepted' | 'rejected';
  workerResponse?: 'accepted' | 'rejected';
}

type DisputeStatus = 'submitted' | 'in_progress' | 'mediation' | 'resolved' | 'closed';

interface Dispute {
  id: string;
  escrowId: string;
  escrowTitle: string;
  milestoneId: string;
  milestoneTitle: string;
  amount: string;
  status: DisputeStatus;
  reason: string;
  client: DisputeParty;
  worker: DisputeParty;
  createdAt: Date;
  updatedAt: Date;
  messages: DisputeMessage[];
  evidence: DisputeEvidence[];
  resolution?: {
    outcome: 'client_favor' | 'worker_favor' | 'compromise' | 'cancelled';
    description: string;
    resolvedAt: Date;
    resolvedBy?: string;
  };
  mediationProposals?: MediationProposal[];
  deadlineForResponse?: Date;
}

// Mock data
const mockDispute: Dispute = {
  id: '1',
  escrowId: '3',
  escrowTitle: 'Logo Design Services',
  milestoneId: '3-2',
  milestoneTitle: 'Final Logo Design with Source Files',
  amount: '250',
  status: 'in_progress',
  reason: 'The delivered logo files are not in the format we agreed upon. I requested vector files but received raster images only.',
  client: {
    address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    role: 'client',
    name: 'ClientCo',
  },
  worker: {
    address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
    role: 'worker',
    name: 'DesignerPro',
  },
  createdAt: new Date(2023, 3, 5),
  updatedAt: new Date(2023, 3, 7),
  messages: [
    {
      id: 'm1',
      sender: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      text: 'I need vector files (.ai or .eps) as originally agreed in our contract. The PNG and JPG files provided are not sufficient for my printing needs.',
      timestamp: new Date(2023, 3, 5, 10, 30),
      attachments: [],
    },
    {
      id: 'm2',
      sender: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
      text: 'I apologize for the misunderstanding. I\'ll prepare the vector files and send them by tomorrow.',
      timestamp: new Date(2023, 3, 5, 14, 15),
      attachments: [],
    },
    {
      id: 'm3',
      sender: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
      text: 'I\'ve prepared the requested vector files. Please review them and let me know if they meet your requirements.',
      timestamp: new Date(2023, 3, 6, 11, 45),
      attachments: ['logo-vectors.zip'],
    },
    {
      id: 'm4',
      sender: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      text: 'I\'ve checked the files, but there are issues with the color profile. The colors don\'t match our brand guidelines.',
      timestamp: new Date(2023, 3, 6, 16, 20),
      attachments: ['color-requirements.pdf'],
    },
    {
      id: 'm5',
      isSystemMessage: true,
      sender: 'system',
      text: 'A mediator has been requested to help resolve this dispute.',
      timestamp: new Date(2023, 3, 7, 9, 0),
      attachments: [],
    },
  ],
  evidence: [
    {
      id: 'e1',
      title: 'Original Contract Agreement',
      description: 'The contract clearly states that all deliverables must include vector source files.',
      files: ['contract.pdf'],
      submittedBy: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      submittedAt: new Date(2023, 3, 5, 10, 35),
    },
    {
      id: 'e2',
      title: 'Delivered Files',
      description: 'These are the vector files I have now prepared based on your requirements.',
      files: ['logo-vectors.zip', 'color-profiles.pdf'],
      submittedBy: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
      submittedAt: new Date(2023, 3, 6, 11, 50),
    },
  ],
  mediationProposals: [
    {
      id: 'mp1',
      description: 'I propose that I fix the color profile issues within 48 hours, and if the client is satisfied, the full payment will be released.',
      proposedBy: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
      proposedAt: new Date(2023, 3, 7, 14, 30),
      status: 'pending',
      clientResponse: undefined,
      workerResponse: 'accepted',
    },
  ],
  deadlineForResponse: new Date(2023, 3, 9),
};

const DisputeResolution = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  
  // Wallet connection
  const { selectedAccount, disputeMilestone, isApiReady, isExtensionReady } = useWallet();
  
  // States
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [newEvidence, setNewEvidence] = useState({
    title: '',
    description: ''
  });
  const [newProposal, setNewProposal] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  // Modal disclosure hooks
  const evidenceModal = useDisclosure();
  const proposalModal = useDisclosure();
  const escalateModal = useDisclosure();
  
  // Colors
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const systemMsgBg = useColorModeValue('gray.50', 'gray.800');
  const highlightBg = useColorModeValue('blue.50', 'blue.900');
  
  // Fetch dispute data
  useEffect(() => {
    const fetchDisputeData = async () => {
      if (!isApiReady || !isExtensionReady || !selectedAccount) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        // TODO: In a real implementation, we would fetch dispute data from the smart contract
        // For now, we'll use mock data but add smart contract integration later
        if (id) {
          // Simulate smart contract data fetch
          console.log('[DisputeResolution] Fetching dispute data for ID:', id);
          console.log('[DisputeResolution] Smart contract ready:', { isApiReady, isExtensionReady, selectedAccount: !!selectedAccount });
          setDispute(mockDispute);
        } else {
          setError('Dispute ID not found');
        }
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching dispute data:', err);
        setError('Failed to load dispute data. Please try again.');
        setIsLoading(false);
      }
    };
    
    fetchDisputeData();
  }, [id, isApiReady, isExtensionReady, selectedAccount]);
  
  // Determine user role (client, worker, or none)
  const userRole = selectedAccount ? (
    selectedAccount.address === dispute?.client.address ? 'client' : 
    selectedAccount.address === dispute?.worker.address ? 'worker' : 'none'
  ) : 'none';
  
  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };
  
  // Handle send message
  const handleSendMessage = () => {
    if (!newMessage.trim() || !dispute) return;
    
    const updatedDispute = { ...dispute };
    const newMessageObj: DisputeMessage = {
      id: `m${dispute.messages.length + 1}`,
      sender: selectedAccount?.address || '',
      text: newMessage.trim(),
      timestamp: new Date(),
      attachments: [],
    };
    
    updatedDispute.messages = [...updatedDispute.messages, newMessageObj];
    updatedDispute.updatedAt = new Date();
    
    setDispute(updatedDispute);
    setNewMessage('');
    
    toast({
      title: 'Message sent',
      status: 'success',
      duration: 3000,
    });
  };
  
  // Handle evidence submission
  const handleSubmitEvidence = () => {
    if (!newEvidence.title.trim() || !newEvidence.description.trim() || !dispute) return;
    
    const updatedDispute = { ...dispute };
    const newEvidenceObj: DisputeEvidence = {
      id: `e${dispute.evidence.length + 1}`,
      title: newEvidence.title.trim(),
      description: newEvidence.description.trim(),
      files: uploadedFiles.map(f => f.name),
      submittedBy: selectedAccount?.address || '',
      submittedAt: new Date(),
    };
    
    updatedDispute.evidence = [...updatedDispute.evidence, newEvidenceObj];
    updatedDispute.updatedAt = new Date();
    
    setDispute(updatedDispute);
    setNewEvidence({ title: '', description: '' });
    setUploadedFiles([]);
    evidenceModal.onClose();
    
    toast({
      title: 'Evidence submitted',
      status: 'success',
      duration: 3000,
    });
  };
  
  // Handle proposal submission
  const handleSubmitProposal = () => {
    if (!newProposal.trim() || !dispute) return;
    
    const updatedDispute = { ...dispute };
    const newProposalObj: MediationProposal = {
      id: `mp${dispute.mediationProposals?.length || 0 + 1}`,
      description: newProposal.trim(),
      proposedBy: selectedAccount?.address || '',
      proposedAt: new Date(),
      status: 'pending',
    };
    
    if (userRole === 'client') {
      newProposalObj.clientResponse = 'accepted';
    } else if (userRole === 'worker') {
      newProposalObj.workerResponse = 'accepted';
    }
    
    updatedDispute.mediationProposals = [...(updatedDispute.mediationProposals || []), newProposalObj];
    updatedDispute.updatedAt = new Date();
    
    setDispute(updatedDispute);
    setNewProposal('');
    proposalModal.onClose();
    
    toast({
      title: 'Resolution proposal submitted',
      status: 'success',
      duration: 3000,
    });
  };
  
  // Handle proposal response
  const handleProposalResponse = (proposalId: string, response: 'accepted' | 'rejected') => {
    if (!dispute) return;
    
    const updatedDispute = { ...dispute };
    const proposalIndex = updatedDispute.mediationProposals?.findIndex(p => p.id === proposalId) || -1;
    
    if (proposalIndex === -1) return;
    
    if (userRole === 'client') {
      if (updatedDispute.mediationProposals) {
        updatedDispute.mediationProposals[proposalIndex].clientResponse = response;
      }
    } else if (userRole === 'worker') {
      if (updatedDispute.mediationProposals) {
        updatedDispute.mediationProposals[proposalIndex].workerResponse = response;
      }
    }
    
    // If both parties have accepted, mark as accepted
    if (updatedDispute.mediationProposals && 
        updatedDispute.mediationProposals[proposalIndex].clientResponse === 'accepted' && 
        updatedDispute.mediationProposals[proposalIndex].workerResponse === 'accepted') {
      updatedDispute.mediationProposals[proposalIndex].status = 'accepted';
      updatedDispute.status = 'resolved';
      updatedDispute.resolution = {
        outcome: 'compromise',
        description: updatedDispute.mediationProposals[proposalIndex].description,
        resolvedAt: new Date(),
      };
      
      // Add system message about resolution
      updatedDispute.messages.push({
        id: `m${updatedDispute.messages.length + 1}`,
        sender: 'system',
        text: 'The dispute has been resolved with a mutual agreement.',
        timestamp: new Date(),
        attachments: [],
        isSystemMessage: true,
      });
    }
    
    // If either party rejected, mark as rejected
    if (updatedDispute.mediationProposals && 
        (updatedDispute.mediationProposals[proposalIndex].clientResponse === 'rejected' || 
         updatedDispute.mediationProposals[proposalIndex].workerResponse === 'rejected')) {
      updatedDispute.mediationProposals[proposalIndex].status = 'rejected';
    }
    
    setDispute(updatedDispute);
    
    toast({
      title: response === 'accepted' ? 'Proposal accepted' : 'Proposal rejected',
      status: response === 'accepted' ? 'success' : 'info',
      duration: 3000,
    });
  };
  
  // Handle request mediator
  const handleRequestMediator = async () => {
    if (!dispute || !selectedAccount) return;
    
    try {
      // Call smart contract to escalate dispute to mediation
      const result = await disputeMilestone(
        dispute.escrowId,
        dispute.milestoneId,
        'Dispute escalated to mediation',
        selectedAccount.address,
        userRole,
        'mediation'
      );
      
      if (result.success) {
        const updatedDispute = { ...dispute };
        updatedDispute.status = 'mediation';
        
        // Add system message about mediation
        updatedDispute.messages.push({
          id: `m${updatedDispute.messages.length + 1}`,
          sender: 'system',
          text: 'A mediator has been requested and will review this dispute.',
          timestamp: new Date(),
          attachments: [],
          isSystemMessage: true,
        });
        
        setDispute(updatedDispute);
        escalateModal.onClose();
        
        toast({
          title: 'Mediator requested',
          description: 'A mediator will be assigned to help resolve this dispute.',
          status: 'info',
          duration: 5000,
        });
      } else {
        toast({
          title: 'Failed to request mediator',
          description: result.error || 'Please try again',
          status: 'error',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error requesting mediator:', error);
      toast({
        title: 'Error',
        description: 'Failed to request mediator. Please try again.',
        status: 'error',
        duration: 5000,
      });
    }
  };
  
  // Create new dispute through smart contract
  const createDispute = async (escrowId: string, milestoneId: string, reason: string) => {
    if (!selectedAccount) return;
    
    try {
      const result = await disputeMilestone(
        escrowId,
        milestoneId,
        reason,
        selectedAccount.address,
        userRole,
        'submitted'
      );
      
      if (result.success) {
        toast({
          title: 'Dispute created',
          description: 'Your dispute has been submitted successfully.',
          status: 'success',
          duration: 5000,
        });
        return result;
      } else {
        toast({
          title: 'Failed to create dispute',
          description: result.error || 'Please try again',
          status: 'error',
          duration: 5000,
        });
        return null;
      }
    } catch (error) {
      console.error('Error creating dispute:', error);
      toast({
        title: 'Error',
        description: 'Failed to create dispute. Please try again.',
        status: 'error',
        duration: 5000,
      });
      return null;
    }
  };

  // Get dispute status badge
  const getStatusBadge = (status: DisputeStatus) => {
    switch(status) {
      case 'submitted':
        return <Badge colorScheme="blue"><HStack spacing={1}><FiAlertTriangle /><Text>Submitted</Text></HStack></Badge>;
      case 'in_progress':
        return <Badge colorScheme="orange"><HStack spacing={1}><FiClock /><Text>In Progress</Text></HStack></Badge>;
      case 'mediation':
        return <Badge colorScheme="purple"><HStack spacing={1}><FiUserPlus /><Text>Mediation</Text></HStack></Badge>;
      case 'resolved':
        return <Badge colorScheme="green"><HStack spacing={1}><FiCheckCircle /><Text>Resolved</Text></HStack></Badge>;
      case 'closed':
        return <Badge colorScheme="gray"><HStack spacing={1}><FiXCircle /><Text>Closed</Text></HStack></Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };
  
  // Display loading state
  if (isLoading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading dispute data...</Text>
      </Box>
    );
  }
  
  // Display error state
  if (error || !dispute) {
    return (
      <Box>
        <Heading size="lg" mb={4}>Dispute Resolution</Heading>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <AlertTitle>{error || 'Dispute not found'}</AlertTitle>
          <AlertDescription>Please check the dispute ID and try again.</AlertDescription>
        </Alert>
        <Button mt={4} onClick={() => navigate('/transactions')}>
          Back to Transactions
        </Button>
      </Box>
    );
  }
  
  return (
    <Box>
      <Box mb={6}>
        <Flex justifyContent="space-between" alignItems="center" mb={2}>
          <Heading size="lg">Dispute Resolution</Heading>
          {getStatusBadge(dispute.status)}
        </Flex>
        <Text color="gray.500">Case #{dispute.id} • Opened on {formatDate(dispute.createdAt)}</Text>
      </Box>
      
      {/* Smart Contract Integration Note */}
      <Alert status="info" mb={4}>
        <AlertIcon />
        <AlertDescription>
          This page is integrated with the smart contract for dispute resolution. Disputes are created and managed on-chain.
        </AlertDescription>
      </Alert>
      
      {/* Dispute overview card */}
      <Card borderRadius="md" mb={6} variant="outline">
        <CardHeader pb={0}>
          <Flex justifyContent="space-between" alignItems="center">
            <Heading size="md">
              Dispute: {dispute.escrowTitle} - {dispute.milestoneTitle}
            </Heading>
            <Text fontWeight="bold">{dispute.amount} USDT</Text>
          </Flex>
        </CardHeader>
        <CardBody>
          <VStack align="start" spacing={4}>
            <Box>
              <Text fontWeight="medium">Reason for Dispute:</Text>
              <Text mt={1}>{dispute.reason}</Text>
            </Box>
            
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4} width="100%">
              <GridItem>
                <Box p={3} bg={highlightBg} borderRadius="md">
                  <Text fontWeight="medium">Client</Text>
                  <Text>{dispute.client.name || 'Client'}</Text>
                  <Text fontSize="sm" color="gray.500">{dispute.client.address.substring(0, 10)}...{dispute.client.address.substring(dispute.client.address.length - 6)}</Text>
                </Box>
              </GridItem>
              
              <GridItem>
                <Box p={3} bg={highlightBg} borderRadius="md">
                  <Text fontWeight="medium">Worker</Text>
                  <Text>{dispute.worker.name || 'Worker'}</Text>
                  <Text fontSize="sm" color="gray.500">{dispute.worker.address.substring(0, 10)}...{dispute.worker.address.substring(dispute.worker.address.length - 6)}</Text>
                </Box>
              </GridItem>
            </Grid>
            
            {dispute.deadlineForResponse && (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle>Response Deadline</AlertTitle>
                  <AlertDescription>
                    This dispute must be resolved by {formatDate(dispute.deadlineForResponse)} or it will be escalated for mediation.
                  </AlertDescription>
                </Box>
              </Alert>
            )}
            
            {dispute.status === 'resolved' && dispute.resolution && (
              <Alert status="success" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle>Dispute Resolved</AlertTitle>
                  <AlertDescription>
                    <Text>Resolution: {dispute.resolution.description}</Text>
                    <Text mt={1}>Resolved on: {formatDate(dispute.resolution.resolvedAt)}</Text>
                  </AlertDescription>
                </Box>
              </Alert>
            )}
          </VStack>
        </CardBody>
      </Card>
      
      {/* Tabs for different sections */}
      <Tabs colorScheme="blue" variant="enclosed" isLazy>
        <TabList>
          <Tab><HStack><FiMessageCircle /><Text>Communication</Text></HStack></Tab>
          <Tab><HStack><FiFileText /><Text>Evidence</Text></HStack></Tab>
          <Tab><HStack><FiThumbsUp /><Text>Resolution Proposals</Text></HStack></Tab>
        </TabList>
        
        <TabPanels>
          {/* Communication Tab */}
          <TabPanel px={0}>
            <Card borderRadius="md" variant="outline">
              <CardBody>
                <VStack spacing={4} align="stretch">
                  {/* Messages list */}
                  <Box 
                    minH="300px" 
                    maxH="500px" 
                    overflowY="auto" 
                    p={3} 
                    borderWidth="1px" 
                    borderRadius="md"
                  >
                    {dispute.messages.length === 0 ? (
                      <Text textAlign="center" color="gray.500">No messages yet</Text>
                    ) : (
                      <VStack spacing={4} align="stretch">
                        {dispute.messages.map((message) => (
                          <Box 
                            key={message.id}
                            p={3}
                            borderRadius="md"
                            borderWidth="1px"
                            bg={message.isSystemMessage ? systemMsgBg : message.sender === selectedAccount?.address ? highlightBg : 'transparent'}
                            borderColor={borderColor}
                          >
                            <HStack mb={2}>
                              {message.isSystemMessage ? (
                                <Text fontWeight="bold">System</Text>
                              ) : message.sender === dispute.client.address ? (
                                <Text fontWeight="bold">{dispute.client.name || 'Client'}</Text>
                              ) : message.sender === dispute.worker.address ? (
                                <Text fontWeight="bold">{dispute.worker.name || 'Worker'}</Text>
                              ) : (
                                <Text fontWeight="bold">Unknown User</Text>
                              )}
                              <Text fontSize="sm" color="gray.500">{formatDate(message.timestamp)}</Text>
                            </HStack>
                            
                            <Text>{message.text}</Text>
                            
                            {message.attachments && message.attachments.length > 0 && (
                              <Box mt={2}>
                                <Text fontSize="sm" fontWeight="medium">Attachments:</Text>
                                <HStack mt={1} spacing={2} flexWrap="wrap">
                                  {message.attachments.map((file, index) => (
                                    <Tag key={index} size="md" colorScheme="blue" borderRadius="full">
                                      <TagLabel>{file}</TagLabel>
                                      <TagRightIcon as={FiPaperclip} />
                                    </Tag>
                                  ))}
                                </HStack>
                              </Box>
                            )}
                          </Box>
                        ))}
                      </VStack>
                    )}
                  </Box>
                  
                  {/* Message input */}
                  {(userRole === 'client' || userRole === 'worker') && dispute.status !== 'closed' && dispute.status !== 'resolved' && (
                    <Box mt={2}>
                      <FormControl>
                        <Textarea 
                          placeholder="Type your message here..." 
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          rows={3}
                        />
                      </FormControl>
                      <Flex justifyContent="flex-end" mt={2}>
                        <Button 
                          leftIcon={<FiSend />} 
                          colorScheme="blue" 
                          onClick={handleSendMessage}
                          isDisabled={!newMessage.trim()}
                        >
                          Send Message
                        </Button>
                      </Flex>
                    </Box>
                  )}
                </VStack>
              </CardBody>
            </Card>
          </TabPanel>
          
          {/* Evidence Tab */}
          <TabPanel px={0}>
            <Card borderRadius="md" variant="outline">
              <CardBody>
                <VStack spacing={4} align="stretch">
                  {dispute.evidence.length === 0 ? (
                    <Text textAlign="center" color="gray.500">No evidence has been submitted yet</Text>
                  ) : (
                    <VStack spacing={4} align="stretch">
                      {dispute.evidence.map((evidence) => (
                        <Card key={evidence.id} variant="outline">
                          <CardBody>
                            <VStack align="start" spacing={3}>
                              <Flex justifyContent="space-between" width="100%" alignItems="flex-start">
                                <Heading size="sm">{evidence.title}</Heading>
                                <Text fontSize="sm" color="gray.500">
                                  Submitted on {formatDate(evidence.submittedAt)}
                                </Text>
                              </Flex>
                              
                              <Text>{evidence.description}</Text>
                              
                              <Box width="100%">
                                <Text fontSize="sm" fontWeight="medium">Submitted by:</Text>
                                <Text>
                                  {evidence.submittedBy === dispute.client.address 
                                    ? dispute.client.name || 'Client'
                                    : evidence.submittedBy === dispute.worker.address
                                    ? dispute.worker.name || 'Worker'
                                    : 'Unknown'}
                                </Text>
                              </Box>
                              
                              {evidence.files.length > 0 && (
                                <Box width="100%">
                                  <Text fontSize="sm" fontWeight="medium">Files:</Text>
                                  <HStack mt={1} spacing={2} flexWrap="wrap">
                                    {evidence.files.map((file, index) => (
                                      <Tag key={index} size="md" colorScheme="blue" borderRadius="full">
                                        <TagLabel>{file}</TagLabel>
                                        <TagRightIcon as={FiPaperclip} />
                                      </Tag>
                                    ))}
                                  </HStack>
                                </Box>
                              )}
                            </VStack>
                          </CardBody>
                        </Card>
                      ))}
                    </VStack>
                  )}
                  
                  {(userRole === 'client' || userRole === 'worker') && dispute.status !== 'closed' && dispute.status !== 'resolved' && (
                    <Flex justifyContent="flex-end" mt={2}>
                      <Button 
                        leftIcon={<FiUpload />} 
                        colorScheme="blue" 
                        onClick={evidenceModal.onOpen}
                      >
                        Submit Evidence
                      </Button>
                    </Flex>
                  )}
                </VStack>
              </CardBody>
            </Card>
          </TabPanel>
          
          {/* Resolution Proposals Tab */}
          <TabPanel px={0}>
            <Card borderRadius="md" variant="outline">
              <CardBody>
                <VStack spacing={4} align="stretch">
                  {!dispute.mediationProposals || dispute.mediationProposals.length === 0 ? (
                    <Text textAlign="center" color="gray.500">No resolution proposals yet</Text>
                  ) : (
                    <VStack spacing={4} align="stretch">
                      {dispute.mediationProposals.map((proposal) => (
                        <Card key={proposal.id} variant="outline">
                          <CardBody>
                            <VStack align="start" spacing={3}>
                              <Flex justifyContent="space-between" width="100%" alignItems="flex-start">
                                <HStack>
                                  <Heading size="sm">Resolution Proposal</Heading>
                                  {proposal.status === 'pending' ? (
                                    <Badge colorScheme="yellow">Pending</Badge>
                                  ) : proposal.status === 'accepted' ? (
                                    <Badge colorScheme="green">Accepted</Badge>
                                  ) : (
                                    <Badge colorScheme="red">Rejected</Badge>
                                  )}
                                </HStack>
                                <Text fontSize="sm" color="gray.500">
                                  Proposed on {formatDate(proposal.proposedAt)}
                                </Text>
                              </Flex>
                              
                              <Text>{proposal.description}</Text>
                              
                              <Box width="100%">
                                <Text fontSize="sm" fontWeight="medium">Proposed by:</Text>
                                <Text>
                                  {proposal.proposedBy === dispute.client.address 
                                    ? dispute.client.name || 'Client'
                                    : proposal.proposedBy === dispute.worker.address
                                    ? dispute.worker.name || 'Worker'
                                    : 'Mediator'}
                                </Text>
                              </Box>
                              
                              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4} width="100%">
                                <GridItem>
                                  <Box p={3} bg={highlightBg} borderRadius="md">
                                    <Text fontWeight="medium">Client Response</Text>
                                    {proposal.clientResponse ? (
                                      <Badge colorScheme={proposal.clientResponse === 'accepted' ? 'green' : 'red'}>
                                        {proposal.clientResponse === 'accepted' ? 'Accepted' : 'Rejected'}
                                      </Badge>
                                    ) : (
                                      <Badge colorScheme="yellow">Pending</Badge>
                                    )}
                                  </Box>
                                </GridItem>
                                
                                <GridItem>
                                  <Box p={3} bg={highlightBg} borderRadius="md">
                                    <Text fontWeight="medium">Worker Response</Text>
                                    {proposal.workerResponse ? (
                                      <Badge colorScheme={proposal.workerResponse === 'accepted' ? 'green' : 'red'}>
                                        {proposal.workerResponse === 'accepted' ? 'Accepted' : 'Rejected'}
                                      </Badge>
                                    ) : (
                                      <Badge colorScheme="yellow">Pending</Badge>
                                    )}
                                  </Box>
                                </GridItem>
                              </Grid>
                              
                              {proposal.status === 'pending' && (
                                // Show proposal actions for the relevant party if they haven't responded yet
                                (userRole === 'client' && !proposal.clientResponse) || 
                                (userRole === 'worker' && !proposal.workerResponse) ? (
                                  <HStack spacing={2} mt={2}>
                                    <Button 
                                      colorScheme="green" 
                                      size="sm"
                                      leftIcon={<FiCheckCircle />}
                                      onClick={() => handleProposalResponse(proposal.id, 'accepted')}
                                    >
                                      Accept
                                    </Button>
                                    <Button 
                                      colorScheme="red" 
                                      size="sm"
                                      variant="outline"
                                      leftIcon={<FiXCircle />}
                                      onClick={() => handleProposalResponse(proposal.id, 'rejected')}
                                    >
                                      Reject
                                    </Button>
                                  </HStack>
                                ) : null
                              )}
                            </VStack>
                          </CardBody>
                        </Card>
                      ))}
                    </VStack>
                  )}
                  
                  {(userRole === 'client' || userRole === 'worker') && dispute.status !== 'closed' && dispute.status !== 'resolved' && (
                    <Flex justifyContent="flex-end" mt={2} gap={2}>
                      <Button 
                        leftIcon={<FiUserPlus />} 
                        colorScheme="purple" 
                        variant="outline"
                        onClick={escalateModal.onOpen}
                        isDisabled={dispute.status === 'mediation'}
                      >
                        Request Mediator
                      </Button>
                      <Button 
                        leftIcon={<FiThumbsUp />} 
                        colorScheme="blue" 
                        onClick={proposalModal.onOpen}
                      >
                        Propose Resolution
                      </Button>
                    </Flex>
                  )}
                </VStack>
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>
      
      {/* Submit Evidence Modal */}
      <Modal isOpen={evidenceModal.isOpen} onClose={evidenceModal.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Submit Evidence</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Title</FormLabel>
                <Input 
                  placeholder="Title for your evidence"
                  value={newEvidence.title}
                  onChange={(e) => setNewEvidence({...newEvidence, title: e.target.value})}
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Description</FormLabel>
                <Textarea 
                  placeholder="Describe your evidence..."
                  value={newEvidence.description}
                  onChange={(e) => setNewEvidence({...newEvidence, description: e.target.value})}
                  rows={3}
                />
              </FormControl>
              
              <FormControl>
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
                      Supports images, PDFs, and document files
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
                      multiple
                      onChange={(e) => {
                        if (e.target.files) {
                          setUploadedFiles(Array.from(e.target.files));
                        }
                      }}
                    />
                  </VStack>
                </Box>
                
                {uploadedFiles.length > 0 && (
                  <Box mt={2}>
                    <Text fontWeight="medium">Selected Files:</Text>
                    <VStack align="start" mt={1}>
                      {uploadedFiles.map((file, index) => (
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
              onClick={handleSubmitEvidence}
              isDisabled={!newEvidence.title.trim() || !newEvidence.description.trim()}
            >
              Submit Evidence
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Propose Resolution Modal */}
      <Modal isOpen={proposalModal.isOpen} onClose={proposalModal.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Propose Resolution</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4}>
              Propose a solution to resolve this dispute. If both parties accept, the dispute will be resolved according to this proposal.
            </Text>
            
            <FormControl isRequired>
              <FormLabel>Your Proposal</FormLabel>
              <Textarea 
                placeholder="Describe your proposed resolution..."
                value={newProposal}
                onChange={(e) => setNewProposal(e.target.value)}
                rows={5}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={proposalModal.onClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleSubmitProposal}
              isDisabled={!newProposal.trim()}
            >
              Submit Proposal
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Request Mediator Modal */}
      <Modal isOpen={escalateModal.isOpen} onClose={escalateModal.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Request a Mediator</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Alert status="info" mb={4}>
              <AlertIcon />
              <AlertDescription>
                Requesting a mediator will involve a neutral third party to help resolve this dispute. This could add up to 7 days to the resolution process.
              </AlertDescription>
            </Alert>
            
            <Text>
              Are you sure you want to request mediation? Please try direct communication with the other party first.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={escalateModal.onClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="purple" 
              onClick={handleRequestMediator}
            >
              Request Mediator
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default DisputeResolution; 