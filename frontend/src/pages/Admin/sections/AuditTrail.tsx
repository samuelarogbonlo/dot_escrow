import React, { useState } from 'react';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Badge,
  Grid,
  GridItem,
  Icon,
  Divider,
  useToast,
  useColorModeValue,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Avatar,
  Link,
  Tooltip,
  Flex,
  Spacer,
} from '@chakra-ui/react';
import {
  FiSearch,
  FiFilter,
  FiCalendar,
  FiExternalLink,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiUsers,
  FiSettings,
  FiAlertTriangle,
  FiRefreshCw,
  FiDownload,
  FiEye
} from 'react-icons/fi';

interface AuditTrailProps {
  events?: any[];
  onRefresh: () => void;
}

interface AuditEvent {
  id: string;
  type: string;
  action: string;
  initiator: string;
  initiator_alias: string;
  timestamp: string;
  status: string;
  tx_hash: string | null;
  details: any;
}

const AuditTrail: React.FC<AuditTrailProps> = ({ events, onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('all');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.600');
  const expandedBg = useColorModeValue('gray.50', 'gray.700');

  // Mock audit events if none provided
  const mockEvents: AuditEvent[] = events && events.length > 0 ? events : [
    {
      id: '1',
      type: 'proposal_created',
      action: 'Pause Contract',
      initiator: '0x1234567890123456789012345678901234567890',
      initiator_alias: 'Admin 1',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'executed',
      tx_hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      details: {
        proposal_id: 'prop_001',
        approvers: ['0x1234...5678', '0x9abc...def0', '0x5555...5555'],
        execution_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    },
    {
      id: '2',
      type: 'fee_updated',
      action: 'Update Platform Fee',
      initiator: '0x9876543210987654321098765432109876543210',
      initiator_alias: 'Admin 2',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'executed',
      tx_hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      details: {
        old_fee_bps: 300,
        new_fee_bps: 250,
        approvers: ['0x1234...5678', '0x9abc...def0']
      }
    },
    {
      id: '3',
      type: 'signer_added',
      action: 'Add New Signer',
      initiator: '0x1234567890123456789012345678901234567890',
      initiator_alias: 'Admin 1',
      timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'executed',
      tx_hash: '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
      details: {
        new_signer: '0x5555555555555555555555555555555555555555',
        approvers: ['0x1234...5678', '0x9abc...def0']
      }
    },
    {
      id: '4',
      type: 'proposal_created',
      action: 'Emergency Withdraw',
      initiator: '0x9876543210987654321098765432109876543210',
      initiator_alias: 'Admin 2',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      tx_hash: null,
      details: {
        proposal_id: 'prop_002',
        amount: '1000',
        recipient: '0x7777777777777777777777777777777777777777',
        approvers: ['0x9abc...def0']
      }
    }
  ];

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'proposal_created': return FiClock;
      case 'fee_updated': return FiSettings;
      case 'signer_added': return FiUsers;
      case 'signer_removed': return FiUsers;
      case 'threshold_changed': return FiSettings;
      case 'contract_paused': return FiAlertTriangle;
      case 'emergency_withdraw': return FiAlertTriangle;
      default: return FiSettings;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'executed':
        return <Badge colorScheme="green" display="flex" alignItems="center">
          <Icon as={FiCheckCircle} mr={1} size="12px" /> Executed
        </Badge>;
      case 'pending':
        return <Badge colorScheme="yellow" display="flex" alignItems="center">
          <Icon as={FiClock} mr={1} size="12px" /> Pending
        </Badge>;
      case 'cancelled':
        return <Badge colorScheme="red" display="flex" alignItems="center">
          <Icon as={FiXCircle} mr={1} size="12px" /> Cancelled
        </Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const truncateAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: string): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp));
  };

  const getRelativeTime = (timestamp: string): string => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));

    if (diffMinutes < 60) {
      return `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      return `${diffDays} days ago`;
    }
  };

  // Filter events based on search and filters
  const filteredEvents = mockEvents.filter(event => {
    const matchesSearch = searchQuery === '' || 
      event.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.initiator_alias.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'all' || event.type === filterType;

    const matchesDate = (() => {
      if (filterDate === 'all') return true;
      const eventDate = new Date(event.timestamp);
      const now = new Date();
      
      switch (filterDate) {
        case 'today':
          return eventDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return eventDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return eventDate >= monthAgo;
        default:
          return true;
      }
    })();

    return matchesSearch && matchesType && matchesDate;
  });

  const handleExportAudit = () => {
    // Generate CSV or JSON export
    toast({
      title: 'Export Started',
      description: 'Audit trail export is being prepared for download.',
      status: 'info',
      duration: 3000,
    });
  };

  const renderEventDetails = (event: AuditEvent) => {
    switch (event.type) {
      case 'fee_updated':
        return (
          <VStack align="start" spacing={1}>
            <Text fontSize="sm">Old Fee: {(event.details.old_fee_bps / 100).toFixed(2)}%</Text>
            <Text fontSize="sm">New Fee: {(event.details.new_fee_bps / 100).toFixed(2)}%</Text>
            <Text fontSize="sm">Approved by: {event.details.approvers.join(', ')}</Text>
          </VStack>
        );
      case 'signer_added':
        return (
          <VStack align="start" spacing={1}>
            <Text fontSize="sm">New Signer: {truncateAddress(event.details.new_signer)}</Text>
            <Text fontSize="sm">Approved by: {event.details.approvers.join(', ')}</Text>
          </VStack>
        );
      case 'proposal_created':
        return (
          <VStack align="start" spacing={1}>
            <Text fontSize="sm">Proposal ID: {event.details.proposal_id}</Text>
            {event.details.amount && (
              <Text fontSize="sm">Amount: {event.details.amount} USDT</Text>
            )}
            {event.details.recipient && (
              <Text fontSize="sm">Recipient: {truncateAddress(event.details.recipient)}</Text>
            )}
            <Text fontSize="sm">
              Approvals: {event.details.approvers.length} 
              {event.status === 'executed' && event.details.execution_time && 
                ` • Executed: ${formatDate(event.details.execution_time)}`
              }
            </Text>
          </VStack>
        );
      default:
        return <Text fontSize="sm">View transaction details for more information.</Text>;
    }
  };

  return (
    <VStack spacing={6} align="stretch">
      {/* Header with Controls */}
      <Flex align="center" wrap="wrap" gap={4}>
        <Box>
          <Heading size="md">Audit Trail</Heading>
          <Text color="gray.600" fontSize="sm">
            Complete history of admin actions and proposals
          </Text>
        </Box>
        <Spacer />
        <HStack spacing={2}>
          <Button
            leftIcon={<FiRefreshCw />}
            size="sm"
            variant="outline"
            onClick={onRefresh}
          >
            Refresh
          </Button>
          <Button
            leftIcon={<FiDownload />}
            size="sm"
            colorScheme="blue"
            variant="outline"
            onClick={handleExportAudit}
          >
            Export
          </Button>
        </HStack>
      </Flex>

      {/* Filters */}
      <Card bg={cardBg} variant="outline">
        <CardBody>
          <Grid templateColumns={{ base: "1fr", md: "2fr 1fr 1fr" }} gap={4}>
            <GridItem>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <FiSearch color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search actions, initiators, or types..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </InputGroup>
            </GridItem>
            
            <GridItem>
              <Select
                icon={<FiFilter />}
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="proposal_created">Proposals</option>
                <option value="fee_updated">Fee Updates</option>
                <option value="signer_added">Signer Changes</option>
                <option value="contract_paused">Contract Actions</option>
                <option value="emergency_withdraw">Emergency Actions</option>
              </Select>
            </GridItem>
            
            <GridItem>
              <Select
                icon={<FiCalendar />}
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </Select>
            </GridItem>
          </Grid>
        </CardBody>
      </Card>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <Card bg={cardBg}>
          <CardBody textAlign="center" py={10}>
            <Icon as={FiSearch} boxSize={12} color="gray.400" mb={4} />
            <Heading size="md" mb={2}>No Events Found</Heading>
            <Text color="gray.600">
              {searchQuery || filterType !== 'all' || filterDate !== 'all'
                ? 'Try adjusting your filters'
                : 'No admin actions have been recorded yet'
              }
            </Text>
          </CardBody>
        </Card>
      ) : (
        <Card bg={cardBg}>
          <CardHeader>
            <HStack justify="space-between">
              <Text fontWeight="bold">
                {filteredEvents.length} Event{filteredEvents.length !== 1 ? 's' : ''}
              </Text>
              <Text fontSize="sm" color="gray.500">
                Showing {filterDate === 'all' ? 'all time' : filterDate} • {filterType === 'all' ? 'all types' : filterType}
              </Text>
            </HStack>
          </CardHeader>
          <CardBody p={0}>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Action</Th>
                  <Th>Initiator</Th>
                  <Th>Date/Time</Th>
                  <Th>Status</Th>
                  <Th>Transaction</Th>
                  <Th>Details</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredEvents.map((event) => (
                  <React.Fragment key={event.id}>
                    <Tr _hover={{ bg: hoverBg }}>
                      <Td>
                        <HStack>
                          <Icon as={getEventIcon(event.type)} />
                          <Box>
                            <Text fontWeight="medium">{event.action}</Text>
                            <Text fontSize="xs" color="gray.500">{event.type}</Text>
                          </Box>
                        </HStack>
                      </Td>
                      <Td>
                        <HStack>
                          <Avatar size="sm" name={event.initiator_alias} />
                          <Box>
                            <Text fontSize="sm" fontWeight="medium">
                              {event.initiator_alias}
                            </Text>
                            <Text fontSize="xs" color="gray.500" fontFamily="mono">
                              {truncateAddress(event.initiator)}
                            </Text>
                          </Box>
                        </HStack>
                      </Td>
                      <Td>
                        <Box>
                          <Text fontSize="sm">{formatDate(event.timestamp)}</Text>
                          <Text fontSize="xs" color="gray.500">
                            {getRelativeTime(event.timestamp)}
                          </Text>
                        </Box>
                      </Td>
                      <Td>{getStatusBadge(event.status)}</Td>
                      <Td>
                        {event.tx_hash ? (
                          <Tooltip label="View on block explorer">
                            <Link
                              href={`https://etherscan.io/tx/${event.tx_hash}`}
                              isExternal
                              display="flex"
                              alignItems="center"
                              color="blue.500"
                              fontSize="sm"
                            >
                              {truncateAddress(event.tx_hash)}
                              <Icon as={FiExternalLink} ml={1} size="12px" />
                            </Link>
                          </Tooltip>
                        ) : (
                          <Text fontSize="sm" color="gray.400">Pending</Text>
                        )}
                      </Td>
                      <Td>
                        <Button
                          size="xs"
                          variant="ghost"
                          leftIcon={<FiEye />}
                          onClick={() => 
                            setExpandedEvent(expandedEvent === event.id ? null : event.id)
                          }
                        >
                          {expandedEvent === event.id ? 'Hide' : 'Show'}
                        </Button>
                      </Td>
                    </Tr>
                    {expandedEvent === event.id && (
                      <Tr>
                        <Td colSpan={6} bg={expandedBg}>
                          <Box p={4}>
                            <Text fontWeight="bold" mb={2}>Event Details</Text>
                            {renderEventDetails(event)}
                          </Box>
                        </Td>
                      </Tr>
                    )}
                  </React.Fragment>
                ))}
              </Tbody>
            </Table>
          </CardBody>
        </Card>
      )}
    </VStack>
  );
};

export default AuditTrail;