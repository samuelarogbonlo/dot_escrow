import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  VStack,
  HStack,
  Grid,
  GridItem,
  Card,
  CardBody,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  List,
  ListItem,
  ListIcon,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Link,
  Image,
  Divider,
  Badge,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { 
  FiSearch, 
  FiHelpCircle, 
  FiBook, 
  FiTrendingUp, 
  FiCheck,
  FiShield,
  FiDollarSign,
  FiFileText,
  FiUser,
  FiClock,
  FiAlertTriangle,
  FiExternalLink,
  FiPlay,
} from 'react-icons/fi';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import OnboardingTour from '../../components/OnboardingTour';

// Define the search result type
interface SearchResult {
  id: string;
  title: string;
  excerpt: string;
  section: 'guides' | 'faq' | 'docs';
  url: string;
}

// Mock tour steps for the help page
const helpTourSteps = [
  {
    target: '#search-help',
    title: 'Search for Help',
    content: 'Use this search bar to quickly find answers to your questions about the platform.',
    placement: 'bottom' as const,
  },
  {
    target: '#getting-started',
    title: 'Getting Started',
    content: 'Here you\'ll find quick guides to help you get up and running with the platform.',
    placement: 'bottom' as const,
  },
  {
    target: '#faq-section',
    title: 'Frequently Asked Questions',
    content: 'Browse through common questions and answers about using the platform.',
    placement: 'left' as const,
  },
  {
    target: '#user-guides',
    title: 'User Guides',
    content: 'Detailed guides to help you make the most of each feature on the platform.',
    placement: 'right' as const,
  },
];

const Help = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [showTour, setShowTour] = useState(false);
  
  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const highlightBg = useColorModeValue('blue.50', 'blue.900');
  
  // Mock search function
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    // Simulate search results
    const query = searchQuery.toLowerCase();
    
    const results: SearchResult[] = [
      {
        id: 'guide-1',
        title: 'How to Create an Escrow',
        excerpt: 'Learn how to create a new escrow agreement with detailed milestones...',
        section: 'guides',
        url: '#create-escrow',
      },
      {
        id: 'faq-1',
        title: 'What fees does the platform charge?',
        excerpt: 'The platform charges a small fee of 0.5-1% on completed transactions...',
        section: 'faq',
        url: '#fees',
      },
      {
        id: 'doc-1',
        title: 'Milestone Release Process',
        excerpt: 'Understand the verification and release process for milestone payments...',
        section: 'docs',
        url: '#milestone-release',
      },
    ].filter(result => 
      result.title.toLowerCase().includes(query) || 
      result.excerpt.toLowerCase().includes(query)
    );
    
    setSearchResults(results);
  };
  
  // Start a guided tour
  const startTour = (tourName: string) => {
    setShowTour(true);
    
    toast({
      title: 'Tour Started',
      description: `Starting the ${tourName} tour. Follow along to learn about the platform.`,
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };
  
  // Visit a specific guide or section
  const goToGuide = (path: string) => {
    navigate(path);
  };
  
  return (
    <Box>
      <VStack spacing={8} align="stretch">
        {/* Help Center Header */}
        <Box
          bg={highlightBg}
          p={8}
          borderRadius="lg"
          textAlign="center"
        >
          <Heading size="xl" mb={4}>Help Center</Heading>
          <Text fontSize="lg" mb={6}>
            Find answers, guides, and support for all your escrow needs
          </Text>
          
          {/* Search Bar */}
          <Box maxW="600px" mx="auto" id="search-help">
            <form onSubmit={handleSearch}>
              <InputGroup size="lg">
                <InputLeftElement pointerEvents="none">
                  <FiSearch color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search for help, guides, and documentation..."
                  bg={cardBg}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </InputGroup>
            </form>
          </Box>
          
          {/* Help Actions */}
          <HStack spacing={4} mt={6} justify="center">
            <Button 
              leftIcon={<FiPlay />} 
              colorScheme="blue" 
              onClick={() => startTour('platform')}
            >
              Platform Tour
            </Button>
            <Button 
              leftIcon={<FiBook />} 
              variant="outline" 
              onClick={() => setActiveTab(2)}
            >
              Documentation
            </Button>
          </HStack>
        </Box>
        
        {/* Search Results */}
        {searchResults.length > 0 && (
          <Box>
            <Heading size="md" mb={4}>Search Results</Heading>
            <VStack spacing={4} align="stretch">
              {searchResults.map(result => (
                <Card key={result.id} variant="outline">
                  <CardBody>
                    <Flex justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Heading size="sm">{result.title}</Heading>
                        <Text mt={1} fontSize="sm">{result.excerpt}</Text>
                        <HStack mt={2}>
                          <Badge colorScheme={
                            result.section === 'guides' ? 'green' : 
                            result.section === 'faq' ? 'blue' : 'purple'
                          }>
                            {result.section.toUpperCase()}
                          </Badge>
                        </HStack>
                      </Box>
                      <Button 
                        size="sm" 
                        colorScheme="blue" 
                        variant="ghost"
                        rightIcon={<FiExternalLink />}
                        onClick={() => navigate(result.url)}
                      >
                        View
                      </Button>
                    </Flex>
                  </CardBody>
                </Card>
              ))}
            </VStack>
          </Box>
        )}
        
        {/* Main Help Content */}
        <Tabs 
          variant="enclosed" 
          colorScheme="blue" 
          index={activeTab} 
          onChange={setActiveTab}
          isLazy
        >
          <TabList>
            <Tab><HStack><FiTrendingUp /><Text>Getting Started</Text></HStack></Tab>
            <Tab><HStack><FiHelpCircle /><Text>FAQ</Text></HStack></Tab>
            <Tab><HStack><FiBook /><Text>User Guides</Text></HStack></Tab>
          </TabList>
          
          <TabPanels>
            {/* Getting Started Tab */}
            <TabPanel px={0} id="getting-started">
              <Heading size="md" mb={6}>Getting Started with .escrow</Heading>
              
              <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6}>
                <GridItem>
                  <Card variant="outline" height="100%">
                    <CardBody>
                      <VStack spacing={4} align="start">
                        <Box p={3} bg={highlightBg} borderRadius="full">
                          <FiUser />
                        </Box>
                        <Heading size="sm">Create Your Account</Heading>
                        <Text fontSize="sm">
                          Connect your Polkadot wallet to get started with the platform. No traditional signup required.
                        </Text>
                        <Button 
                          size="sm" 
                          colorScheme="blue" 
                          rightIcon={<FiExternalLink />}
                          onClick={() => goToGuide('/connect-wallet')}
                        >
                          Connect Wallet
                        </Button>
                      </VStack>
                    </CardBody>
                  </Card>
                </GridItem>
                
                <GridItem>
                  <Card variant="outline" height="100%">
                    <CardBody>
                      <VStack spacing={4} align="start">
                        <Box p={3} bg={highlightBg} borderRadius="full">
                          <FiFileText />
                        </Box>
                        <Heading size="sm">Create Your First Escrow</Heading>
                        <Text fontSize="sm">
                          Set up a secure escrow agreement with milestones, payments, and deadlines.
                        </Text>
                        <Button 
                          size="sm" 
                          colorScheme="blue" 
                          rightIcon={<FiExternalLink />}
                          onClick={() => goToGuide('/create-escrow')}
                        >
                          Create Escrow
                        </Button>
                      </VStack>
                    </CardBody>
                  </Card>
                </GridItem>
                
                <GridItem>
                  <Card variant="outline" height="100%">
                    <CardBody>
                      <VStack spacing={4} align="start">
                        <Box p={3} bg={highlightBg} borderRadius="full">
                          <FiDollarSign />
                        </Box>
                        <Heading size="sm">Manage Payments</Heading>
                        <Text fontSize="sm">
                          Learn how to send, receive, and manage payments through the platform.
                        </Text>
                        <Button 
                          size="sm" 
                          colorScheme="blue" 
                          rightIcon={<FiExternalLink />}
                          onClick={() => goToGuide('/payments')}
                        >
                          Payment Guide
                        </Button>
                      </VStack>
                    </CardBody>
                  </Card>
                </GridItem>
              </Grid>
              
              <Box mt={12}>
                <Heading size="md" mb={4}>Video Tutorials</Heading>
                <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
                  <GridItem>
                    <Card variant="outline">
                      <CardBody>
                        <VStack spacing={4} align="start">
                          <Box 
                            bg="gray.200" 
                            w="100%" 
                            h="150px" 
                            borderRadius="md" 
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <FiPlay size={40} />
                          </Box>
                          <Heading size="sm">Platform Overview</Heading>
                          <Text fontSize="sm">
                            A complete walkthrough of the .escrow platform and its features.
                          </Text>
                          <Badge colorScheme="green">5:32</Badge>
                        </VStack>
                      </CardBody>
                    </Card>
                  </GridItem>
                  
                  <GridItem>
                    <Card variant="outline">
                      <CardBody>
                        <VStack spacing={4} align="start">
                          <Box 
                            bg="gray.200" 
                            w="100%" 
                            h="150px" 
                            borderRadius="md" 
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <FiPlay size={40} />
                          </Box>
                          <Heading size="sm">Creating an Escrow</Heading>
                          <Text fontSize="sm">
                            Step-by-step guide to create your first escrow agreement.
                          </Text>
                          <Badge colorScheme="green">3:45</Badge>
                        </VStack>
                      </CardBody>
                    </Card>
                  </GridItem>
                </Grid>
              </Box>
            </TabPanel>
            
            {/* FAQ Tab */}
            <TabPanel px={0} id="faq-section">
              <Heading size="md" mb={6}>Frequently Asked Questions</Heading>
              
              <Accordion allowToggle>
                <AccordionItem border="1px solid" borderColor={borderColor} borderRadius="md" mb={4}>
                  <h2>
                    <AccordionButton py={4}>
                      <Box flex="1" textAlign="left" fontWeight="medium">
                        What is .escrow and how does it work?
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4}>
                    <Text mb={3}>
                      .escrow is a decentralized escrow platform built on Polkadot that enables secure, 
                      trust-minimized transactions between freelancers and clients using USDT stablecoins.
                    </Text>
                    <Text>
                      The platform works by holding funds in a secure smart contract until predefined 
                      conditions are met. This creates security for both parties: clients know their 
                      funds will only be released when work is completed, and freelancers know the funds 
                      are already secured in the contract.
                    </Text>
                  </AccordionPanel>
                </AccordionItem>
                
                <AccordionItem border="1px solid" borderColor={borderColor} borderRadius="md" mb={4}>
                  <h2>
                    <AccordionButton py={4}>
                      <Box flex="1" textAlign="left" fontWeight="medium">
                        What fees does the platform charge?
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4}>
                    <Text mb={3}>
                      The platform charges a small fee of 0.5-1% on successfully completed transactions.
                      This fee is used to maintain and improve the platform, as well as cover transaction
                      costs on the Polkadot network.
                    </Text>
                    <Text>
                      Fees can be paid by either the client, the worker, or split between both parties
                      depending on your agreement settings.
                    </Text>
                  </AccordionPanel>
                </AccordionItem>
                
                <AccordionItem border="1px solid" borderColor={borderColor} borderRadius="md" mb={4}>
                  <h2>
                    <AccordionButton py={4}>
                      <Box flex="1" textAlign="left" fontWeight="medium">
                        How are disputes handled?
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4}>
                    <Text mb={3}>
                      If a dispute arises, the platform offers a built-in dispute resolution system.
                      Both parties can submit evidence and communicate to try to reach a resolution.
                    </Text>
                    <Text mb={3}>
                      If no agreement can be reached, the dispute can be escalated to a mediator who
                      will review the evidence and make a decision. The mediator's decision is binding
                      and will determine how the escrowed funds are distributed.
                    </Text>
                    <Text>
                      We recommend clearly documenting all aspects of your work and communication to
                      simplify potential dispute resolution.
                    </Text>
                  </AccordionPanel>
                </AccordionItem>
                
                <AccordionItem border="1px solid" borderColor={borderColor} borderRadius="md" mb={4}>
                  <h2>
                    <AccordionButton py={4}>
                      <Box flex="1" textAlign="left" fontWeight="medium">
                        What currencies does .escrow support?
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4}>
                    <Text mb={3}>
                      Currently, .escrow supports USDT (Tether) stablecoins on the Polkadot network.
                      This provides stable value without the volatility of traditional cryptocurrencies.
                    </Text>
                    <Text>
                      We plan to add support for additional currencies and tokens in future updates,
                      including USDC, DOT, and KSM.
                    </Text>
                  </AccordionPanel>
                </AccordionItem>
                
                <AccordionItem border="1px solid" borderColor={borderColor} borderRadius="md">
                  <h2>
                    <AccordionButton py={4}>
                      <Box flex="1" textAlign="left" fontWeight="medium">
                        How secure is the platform?
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4}>
                    <Text mb={3}>
                      Security is our top priority. The platform uses secure smart contracts on the
                      Polkadot blockchain, which have been thoroughly audited and tested.
                    </Text>
                    <Text mb={3}>
                      All transactions are verified on the blockchain, providing transparency and
                      immutability. Funds are held in secure escrow contracts that can only be
                      released when predefined conditions are met.
                    </Text>
                    <Text>
                      In addition, we implement multi-signature requirements for critical actions,
                      transaction value limits, and emergency pause functionality for added security.
                    </Text>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
              
              <Box mt={8}>
                <Heading size="sm" mb={4}>Still have questions?</Heading>
                <Button
                  leftIcon={<FiHelpCircle />}
                  colorScheme="blue"
                  onClick={() => setActiveTab(2)}
                >
                  Browse User Guides
                </Button>
              </Box>
            </TabPanel>
            
            {/* User Guides Tab */}
            <TabPanel px={0} id="user-guides">
              <Heading size="md" mb={6}>User Guides</Heading>
              
              <Grid templateColumns={{ base: "1fr", md: "250px 1fr" }} gap={8}>
                {/* Guide Categories */}
                <GridItem>
                  <VStack spacing={4} align="start" position="sticky" top="20px">
                    <Heading size="sm" mb={2}>Categories</Heading>
                    
                    <List spacing={3} width="100%">
                      <ListItem 
                        p={2} 
                        bg={highlightBg} 
                        borderRadius="md"
                        fontWeight="medium"
                      >
                        <ListIcon as={FiUser} />
                        Getting Started
                      </ListItem>
                      <ListItem p={2}>
                        <ListIcon as={FiFileText} />
                        Escrow Management
                      </ListItem>
                      <ListItem p={2}>
                        <ListIcon as={FiClock} />
                        Milestones & Payments
                      </ListItem>
                      <ListItem p={2}>
                        <ListIcon as={FiAlertTriangle} />
                        Dispute Resolution
                      </ListItem>
                      <ListItem p={2}>
                        <ListIcon as={FiDollarSign} />
                        Fees & Payments
                      </ListItem>
                      <ListItem p={2}>
                        <ListIcon as={FiShield} />
                        Security
                      </ListItem>
                    </List>
                  </VStack>
                </GridItem>
                
                {/* Guide Content */}
                <GridItem>
                  <VStack align="start" spacing={8}>
                    <Box>
                      <Heading size="md" mb={4}>Getting Started Guides</Heading>
                      
                      <VStack spacing={6} align="start">
                        <Box>
                          <Heading size="sm" mb={2}>Connecting Your Wallet</Heading>
                          <Text mb={3}>
                            To use the .escrow platform, you'll need to connect a Polkadot-compatible wallet.
                            Follow these steps to connect your wallet:
                          </Text>
                          
                          <List spacing={3} mb={4}>
                            <ListItem>
                              <ListIcon as={FiCheck} color="green.500" />
                              Install the Polkadot.js browser extension or another compatible wallet
                            </ListItem>
                            <ListItem>
                              <ListIcon as={FiCheck} color="green.500" />
                              Click "Connect Wallet" in the .escrow navigation
                            </ListItem>
                            <ListItem>
                              <ListIcon as={FiCheck} color="green.500" />
                              Select your wallet provider and follow the connection prompts
                            </ListItem>
                            <ListItem>
                              <ListIcon as={FiCheck} color="green.500" />
                              Choose the account you want to use with .escrow
                            </ListItem>
                          </List>
                          
                          <Link as={RouterLink} to="/connect-wallet" color="blue.500">
                            View detailed wallet guide →
                          </Link>
                        </Box>
                        
                        <Divider />
                        
                        <Box>
                          <Heading size="sm" mb={2}>Creating Your First Escrow</Heading>
                          <Text mb={3}>
                            Setting up an escrow agreement is simple and secure. Here's how to create
                            your first escrow on the platform:
                          </Text>
                          
                          <List spacing={3} mb={4}>
                            <ListItem>
                              <ListIcon as={FiCheck} color="green.500" />
                              Navigate to the Dashboard and click "Create New Escrow"
                            </ListItem>
                            <ListItem>
                              <ListIcon as={FiCheck} color="green.500" />
                              Enter the basic details: title, description, and total amount
                            </ListItem>
                            <ListItem>
                              <ListIcon as={FiCheck} color="green.500" />
                              Select your role (client or worker) and enter the counterparty's address
                            </ListItem>
                            <ListItem>
                              <ListIcon as={FiCheck} color="green.500" />
                              Define milestones with descriptions, amounts, and deadlines
                            </ListItem>
                            <ListItem>
                              <ListIcon as={FiCheck} color="green.500" />
                              Review all details and confirm to create the escrow
                            </ListItem>
                          </List>
                          
                          <Link as={RouterLink} to="/create-escrow" color="blue.500">
                            View detailed escrow creation guide →
                          </Link>
                        </Box>
                        
                        <Divider />
                        
                        <Box>
                          <Heading size="sm" mb={2}>Managing Milestones</Heading>
                          <Text mb={3}>
                            Milestones are at the heart of the escrow process. Learn how to effectively
                            manage milestones for successful project completion:
                          </Text>
                          
                          <List spacing={3} mb={4}>
                            <ListItem>
                              <ListIcon as={FiCheck} color="green.500" />
                              Track milestone status through the Milestone Tracking dashboard
                            </ListItem>
                            <ListItem>
                              <ListIcon as={FiCheck} color="green.500" />
                              Submit evidence of completion when a milestone is finished
                            </ListItem>
                            <ListItem>
                              <ListIcon as={FiCheck} color="green.500" />
                              Review and approve completed work if you're the client
                            </ListItem>
                            <ListItem>
                              <ListIcon as={FiCheck} color="green.500" />
                              Release milestone payments after verification
                            </ListItem>
                          </List>
                          
                          <Link as={RouterLink} to="/milestone-management" color="blue.500">
                            View detailed milestone guide →
                          </Link>
                        </Box>
                      </VStack>
                    </Box>
                  </VStack>
                </GridItem>
              </Grid>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
      
      {/* Help Tour */}
      <OnboardingTour
        tourName="help-center"
        steps={helpTourSteps}
        isOpen={showTour}
        onClose={() => setShowTour(false)}
      />
    </Box>
  );
};

export default Help; 