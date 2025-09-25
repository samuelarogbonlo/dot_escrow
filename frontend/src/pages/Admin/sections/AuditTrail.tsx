import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Spinner,
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
  FiEye,
  FiPause,
  FiPlay,
  FiDollarSign
} from 'react-icons/fi';
import { useWallet } from '../../../hooks/useWalletContext';
import { useAdminGovernance } from '../../../hooks/useAdminGovernance';

interface AuditTrailProps {
  onRefresh?: () => void;
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
  proposal_id?: number;
}

const AuditTrail: React.FC<AuditTrailProps> = ({ onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('all');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.600');
  const expandedBg = useColorModeValue('gray.50', 'gray.700');
  
  const { api, selectedAccount } = useWallet();
  const governance = useAdminGovernance({ api, account: selectedAccount as any });

  // Memoize helper functions to prevent recreating on every render
  const getActionDescription = useCallback((actionType: string, actionData: any): string => {
    switch (actionType) {
      case 'SetFee':
        return `Update Platform Fee to ${((actionData || 0) / 100).toFixed(2)}%`;
      case 'AddSigner':
        return `Add Admin Signer: ${actionData ? `${actionData.slice(0, 8)}...` : 'N/A'}`;
      case 'RemoveSigner':
        return `Remove Admin Signer: ${actionData ? `${actionData.slice(0, 8)}...` : 'N/A'}`;
      case 'SetThreshold':
        return `Set Signature Threshold to ${actionData || 'N/A'}`;
      case 'PauseContract':
        return 'Pause Contract Operations';
      case 'UnpauseContract':
        return 'Resume Contract Operations';
      case 'EmergencyWithdraw':
        return Array.isArray(actionData) 
          ? `Emergency Withdraw ${actionData[1]} to ${actionData[0]?.slice(0, 8)}...`
          : 'Emergency Withdrawal';
      default:
        return actionType || 'Unknown Action';
    }
  }, []);

  const getExecutionEventType = useCallback((actionType: string): string => {
    switch (actionType) {
      case 'SetFee': return 'fee_updated';
      case 'AddSigner': return 'signer_added';
      case 'RemoveSigner': return 'signer_removed';
      case 'SetThreshold': return 'threshold_changed';
      case 'PauseContract': return 'contract_paused';
      case 'UnpauseContract': return 'contract_resumed';
      case 'EmergencyWithdraw': return 'emergency_withdraw';
      default: return 'system_action';
    }
  }, []);

  const getInitiatorAlias = useCallback((address: string): string => {
    if (!address) return 'Unknown';
    if (address === selectedAccount?.address) return 'You';
    // Could be enhanced to fetch actual aliases from contract metadata
    return `Admin ${address.slice(-4)}`;
  }, [selectedAccount?.address]); // Only depend on the address, not the whole object

  // Memoize the conversion function with stable dependencies
  const convertProposalsToAuditEvents = useMemo(() => {
    return (proposals: any[]): AuditEvent[] => {
      const events: AuditEvent[] = [];

      proposals.forEach(proposal => {
        try {
          const actionType = Object.keys(proposal.action || {})[0];
          const actionData = proposal.action?.[actionType];
          
          if (!actionType) return;

          // Create proposal created event
          const createdEvent: AuditEvent = {
            id: `proposal_${proposal.id}_created`,
            type: 'proposal_created',
            action: getActionDescription(actionType, actionData),
            initiator: proposal.createdBy || 'Unknown',
            initiator_alias: getInitiatorAlias(proposal.createdBy),
            timestamp: new Date(proposal.createdAt || Date.now()).toISOString(),
            status: proposal.executed ? 'executed' : 'pending',
            tx_hash: null,
            proposal_id: proposal.id,
            details: {
              proposal_id: proposal.id,
              action_type: actionType,
              action_data: actionData,
              approvers: proposal.approvals || [],
              approval_count: (proposal.approvals || []).length,
              required_approvals: 'N/A', // Will be populated if available
            }
          };

          events.push(createdEvent);

          // If proposal is executed, create execution event
          if (proposal.executed && proposal.executed_at) {
            const executedEvent: AuditEvent = {
              id: `proposal_${proposal.id}_executed`,
              type: getExecutionEventType(actionType),
              action: `Executed: ${getActionDescription(actionType, actionData)}`,
              initiator: 'System', // Execution is automatic
              initiator_alias: 'Multisig System',
              timestamp: new Date(proposal.executed_at).toISOString(),
              status: 'executed',
              tx_hash: null, // Could be populated from chain events
              proposal_id: proposal.id,
              details: {
                proposal_id: proposal.id,
                action_type: actionType,
                action_data: actionData,
                executed_by: 'Multisig System',
                approvers: proposal.approvals || [],
              }
            };

            events.push(executedEvent);
          }

        } catch (error) {
          console.error('Error converting proposal to audit event:', proposal, error);
        }
      });

      // Sort by timestamp descending (newest first)
      return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    };
  }, [getActionDescription, getExecutionEventType, getInitiatorAlias]); // Stable dependencies

  // Fetch audit events from contract - FIXED: Remove problematic dependencies
  const fetchAuditEvents = useCallback(async () => {
    if (!api || !selectedAccount) {
      return;
    }

    try {
      setIsLoading(true);
      console.log('Fetching audit events...');

      const proposals = await governance.listProposals();
      console.log('Raw proposals for audit:', proposals);

      const events = convertProposalsToAuditEvents(proposals || []);
      console.log('Converted audit events:', events);

      // Only update if events changed
      setAuditEvents(prevEvents => {
        const eventsChanged = JSON.stringify(prevEvents) !== JSON.stringify(events);
        return eventsChanged ? events : prevEvents;
      });

    } catch (error) {
      console.error('Error fetching audit events:', error);
      
      // Only show toast on first load failure
      setAuditEvents(prevEvents => {
        if (prevEvents.length === 0) {
          toast({
            title: "Error",
            description: "Failed to fetch audit events from contract",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
        return prevEvents;
      });
    } finally {
      setIsLoading(false);
      setHasInitialLoad(true);
    }
  }, [api, selectedAccount, governance.listProposals, convertProposalsToAuditEvents, toast]); 
  // REMOVED: isLoading, hasInitialLoad - these were causing re-renders

  // Initial load and periodic refresh
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const loadData = async () => {
      if (mounted) {
        await fetchAuditEvents();
        // Refresh every 45 seconds (longer than other components)
        timeoutId = setTimeout(() => {
          if (mounted) {
            loadData();
          }
        }, 45000);
      }
    };

    loadData();

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [fetchAuditEvents]);

  const refreshData = useCallback(async () => {
    await fetchAuditEvents();
    if (onRefresh) {
      onRefresh();
    }
  }, [fetchAuditEvents, onRefresh]);

  const getEventIcon = useCallback((type: string) => {
    const iconMap: Record<string, any> = {
      'proposal_created': FiClock,
      'fee_updated': FiDollarSign,
      'signer_added': FiUsers,
      'signer_removed': FiUsers,
      'threshold_changed': FiSettings,
      'contract_paused': FiPause,
      'contract_resumed': FiPlay,
      'emergency_withdraw': FiAlertTriangle,
      'system_action': FiSettings
    };
    return iconMap[type] || FiSettings;
  }, []);

  const getStatusBadge = useCallback((status: string) => {
    switch (status) {
      case 'executed':
        return <Badge colorScheme="green" display="flex" alignItems="center">
          <Icon as={FiCheckCircle} mr={1} boxSize="12px" /> Executed
        </Badge>;
      case 'pending':
        return <Badge colorScheme="yellow" display="flex" alignItems="center">
          <Icon as={FiClock} mr={1} boxSize="12px" /> Pending
        </Badge>;
      case 'cancelled':
        return <Badge colorScheme="red" display="flex" alignItems="center">
          <Icon as={FiXCircle} mr={1} boxSize="12px" /> Cancelled
        </Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  }, []);

  const truncateAddress = useCallback((address: string): string => {
    if (!address) return 'N/A';
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  }, []);

  const formatDate = useCallback((timestamp: string): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp));
  }, []);

  const getRelativeTime = useCallback((timestamp: string): string => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));

    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  }, []);

  // Filter events based on search and filters
  const filteredEvents = auditEvents.filter(event => {
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

  const renderEventDetails = useCallback((event: AuditEvent) => {
    const details = event.details || {};
    
    switch (event.type) {
      case 'fee_updated':
        return (
          <VStack align="start" spacing={1}>
            <Text fontSize="sm">New Fee: {((details.action_data || 0) / 100).toFixed(2)}%</Text>
            <Text fontSize="sm">Proposal ID: {details.proposal_id}</Text>
            <Text fontSize="sm">Approved by: {(details.approvers || []).length} signers</Text>
            {details.approvers && details.approvers.length > 0 && (
              <Text fontSize="sm">Signers: {details.approvers.map((addr: string) => truncateAddress(addr)).join(', ')}</Text>
            )}
          </VStack>
        );
      
      case 'signer_added':
      case 'signer_removed':
        return (
          <VStack align="start" spacing={1}>
            <Text fontSize="sm">Signer: {truncateAddress(details.action_data || 'N/A')}</Text>
            <Text fontSize="sm">Proposal ID: {details.proposal_id}</Text>
            <Text fontSize="sm">Approved by: {(details.approvers || []).length} signers</Text>
          </VStack>
        );
      
      case 'threshold_changed':
        return (
          <VStack align="start" spacing={1}>
            <Text fontSize="sm">New Threshold: {details.action_data || 'N/A'}</Text>
            <Text fontSize="sm">Proposal ID: {details.proposal_id}</Text>
            <Text fontSize="sm">Approved by: {(details.approvers || []).length} signers</Text>
          </VStack>
        );
      
      case 'proposal_created':
        return (
          <VStack align="start" spacing={1}>
            <Text fontSize="sm">Proposal ID: {details.proposal_id}</Text>
            <Text fontSize="sm">Action: {details.action_type}</Text>
            <Text fontSize="sm">Current Approvals: {details.approval_count || 0}</Text>
            {details.action_data && (
              <Text fontSize="sm">Data: {JSON.stringify(details.action_data).slice(0, 50)}...</Text>
            )}
          </VStack>
        );
      
      case 'emergency_withdraw':
        return (
          <VStack align="start" spacing={1}>
            {Array.isArray(details.action_data) && (
              <>
                <Text fontSize="sm">Recipient: {truncateAddress(details.action_data[0])}</Text>
                <Text fontSize="sm">Amount: {details.action_data[1]}</Text>
              </>
            )}
            <Text fontSize="sm">Proposal ID: {details.proposal_id}</Text>
            <Text fontSize="sm">Approved by: {(details.approvers || []).length} signers</Text>
          </VStack>
        );
      
      default:
        return (
          <VStack align="start" spacing={1}>
            <Text fontSize="sm">Proposal ID: {details.proposal_id || 'N/A'}</Text>
            <Text fontSize="sm">Type: {details.action_type || event.type}</Text>
            {details.approvers && (
              <Text fontSize="sm">Approvals: {details.approvers.length}</Text>
            )}
          </VStack>
        );
    }
  }, [truncateAddress]);

  if (isLoading && !hasInitialLoad) {
    return (
      <VStack spacing={6} align="stretch">
        <Card bg={cardBg}>
          <CardBody textAlign="center" py={10}>
            <Spinner size="xl" color="blue.500" mb={4} />
            <Text>Loading audit trail...</Text>
          </CardBody>
        </Card>
      </VStack>
    );
  }

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
                <option value="proposal_created">Proposals Created</option>
                <option value="fee_updated">Fee Updates</option>
                <option value="signer_added">Signer Added</option>
                <option value="signer_removed">Signer Removed</option>
                <option value="threshold_changed">Threshold Changes</option>
                <option value="contract_paused">Contract Paused</option>
                <option value="contract_resumed">Contract Resumed</option>
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
                  <Th>Proposal</Th>
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
                            <Text fontSize="xs" color="gray.500">{event.type.replace('_', ' ')}</Text>
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
                        {event.proposal_id ? (
                          <Text fontSize="sm" fontFamily="mono">
                            #{event.proposal_id}
                          </Text>
                        ) : (
                          <Text fontSize="sm" color="gray.400">N/A</Text>
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