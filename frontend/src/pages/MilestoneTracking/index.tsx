import { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Text,
  Grid,
  GridItem,
  Card,
  CardBody,
  VStack,
  HStack,
  Badge,
  Flex,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  useColorModeValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Stat,
  StatLabel,
  StatNumber,
} from "@chakra-ui/react";
import {
  FiClock,
  FiCheckCircle,
  FiAlertTriangle,
  FiSearch,
  FiFilter,
  FiChevronDown,
  FiEye,
  FiCalendar,
} from "react-icons/fi";
import { Link as RouterLink } from "react-router-dom";
import { useWallet } from "../../hooks/useWalletContext";

// Define types
type MilestoneStatus = "Pending" | "InProgress" | "Completed" | "Disputed";

interface EvidenceFile {
  name: string;
  url: string;
  type: string;
  size: string;
}

interface Milestone {
  id: string;
  escrowId: string;
  escrowTitle: string;
  description: string;
  amount: string;
  deadline: Date | number;
  status: MilestoneStatus;
  completedAt: Date | number;
  evidenceFiles?: EvidenceFile;
  notes?: string;
  isLate?: boolean;
}

const MilestoneTracking = () => {
  // State
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [filteredMilestones, setFilteredMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<MilestoneStatus | "all">(
    "all"
  );
  const [sortField, setSortField] = useState<keyof Milestone>("deadline");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Wallet connection
  const { selectedAccount, isApiReady, isExtensionReady, listEscrows } =
    useWallet();

  // Color mode values
  const cardBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const statBg = useColorModeValue("blue.50", "blue.900");

  // Load milestones
  useEffect(() => {
    const fetchMilestones = async () => {
      if (!isExtensionReady || !selectedAccount) return;

      setIsLoading(true);
      setError(null);

      try {
        const result = await listEscrows();

        if (result.success) {
          console.log('[MilestoneTracking] Raw result:', result);
          
          // Filter escrows to show:
          // 1. All escrows where user is the creator (userAddress matches)
          // 2. Escrows where user is the counterparty AND status is "InProgress"
          const escrows = result.data || result.escrows || [];
          console.log('[MilestoneTracking] Escrows found:', escrows.length);
          
          const filteredEscrows = escrows.filter((e: any) => {
            const isUserCreator = e.creatorAddress === selectedAccount.address;
            const isUserCounterparty =
              e.counterpartyAddress === selectedAccount.address;

            // Show if user created it, OR if user is counterparty and it's active
            return isUserCreator || isUserCounterparty;
          });
          
          console.log('[MilestoneTracking] Filtered escrows:', filteredEscrows.length);
          // Extract all milestones from filtered escrows
          const allMilestones = filteredEscrows.flatMap((escrow: any) => {
            // Ensure milestones exist and is an array
            const milestones = Array.isArray(escrow.milestones) ? escrow.milestones : [];
            
            return milestones.map((milestone: any) => ({
              ...milestone,
              // Add escrow context to each milestone for reference
              escrowId: escrow.id || '',
              escrowTitle: escrow.title || 'Untitled Escrow',
              escrowDescription: escrow.description || '',
            }));
          });

          setMilestones(allMilestones);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error fetching milestones:", err);
        setError("Failed to fetch milestones. Please try again later.");
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
      result = result.filter(
        (m) =>
          m.description.toLowerCase().includes(query) ||
          m.escrowTitle.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((m) => m.status === statusFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortField === "deadline") {
        const aTime = typeof a.deadline === "number" ? a.deadline : 0;
        const bTime = typeof b.deadline === "number" ? b.deadline : 0;
        return sortDirection === "asc" ? aTime - bTime : bTime - aTime;
      } else if (sortField === "amount") {
        return sortDirection === "asc"
          ? parseFloat(a.amount) - parseFloat(b.amount)
          : parseFloat(b.amount) - parseFloat(a.amount);
      } else {
        // String comparison
        const aValue = String(a[sortField] || "").toLowerCase();
        const bValue = String(b[sortField] || "").toLowerCase();
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
    });

    setFilteredMilestones(result);
  }, [milestones, searchQuery, statusFilter, sortField, sortDirection]);

  // Calculate if milestone is late
  const calculateIsLate = (milestone: Milestone) => {
    if (milestone.status === "Completed" || !milestone.deadline) return false;
    
    const deadline = typeof milestone.deadline === "number" 
      ? milestone.deadline 
      : milestone.deadline.getTime();
    
    return deadline < Date.now();
  };

  // Calculate statistics
  const stats = {
    total: milestones.length,
    completed: milestones.filter((m) => m.status === "Completed").length,
    active: milestones.filter((m) => m.status === "InProgress").length,
    pending: milestones.filter((m) => m.status === "Pending").length,
    disputed: milestones.filter((m) => m.status === "Disputed").length,
    late: milestones.filter((m) => calculateIsLate(m)).length,
  };

  // Handle sort change
  const handleSort = (field: keyof Milestone) => {
    if (field === sortField) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New field, set to default direction
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Format date - handle both Date objects and timestamps
  const formatDate = (timestamp: Date | number) => {
    if (!timestamp) return "N/A";

    const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const getRelativeTime = (timestamp: Date | number, isPast = false) => {
    const now = new Date();
    const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
    const diffTime = Math.abs(date.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (isPast) {
      return diffDays === 0
        ? "Today"
        : `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    } else {
      if (date.getTime() < now.getTime()) {
        return `${diffDays} day${diffDays !== 1 ? "s" : ""} overdue`;
      }
      return diffDays === 0
        ? "Due today"
        : `${diffDays} day${diffDays !== 1 ? "s" : ""} remaining`;
    }
  };

  // Get status badge
  const getStatusBadge = (status: MilestoneStatus, isLate?: boolean) => {
    switch (status) {
      case "InProgress":
        return isLate ? (
          <Badge colorScheme="orange" display="flex" alignItems="center">
            <FiClock style={{ marginRight: "4px" }} /> Overdue
          </Badge>
        ) : (
          <Badge colorScheme="blue" display="flex" alignItems="center">
            <FiClock style={{ marginRight: "4px" }} /> InProgress
          </Badge>
        );
      case "Completed":
        return (
          <Badge colorScheme="green" display="flex" alignItems="center">
            <FiCheckCircle style={{ marginRight: "4px" }} /> Completed
          </Badge>
        );
      case "Disputed":
        return (
          <Badge colorScheme="orange" display="flex" alignItems="center">
            <FiAlertTriangle style={{ marginRight: "4px" }} /> Disputed
          </Badge>
        );
      case "Pending":
        return (
          <Badge colorScheme="gray" display="flex" alignItems="center">
            <FiClock style={{ marginRight: "4px" }} /> Pending
          </Badge>
        );
      default:
        return <Badge>Unknown</Badge>;
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
        <Heading size="lg" mb={4}>
          Milestone Tracking
        </Heading>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Heading size="lg" mb={6}>
        Milestone Tracking
      </Heading>

      {/* Stats Summary */}
      <Grid
        templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }}
        gap={4}
        mb={6}
      >
        <GridItem>
          <Stat bg={statBg} p={4} borderRadius="md" boxShadow="sm">
            <StatLabel>InProgress Milestones</StatLabel>
            <StatNumber>{stats.active}</StatNumber>
          </Stat>
        </GridItem>

        <GridItem>
          <Stat bg={statBg} p={4} borderRadius="md" boxShadow="sm">
            <StatLabel>Completed</StatLabel>
            <StatNumber>{stats.completed}</StatNumber>
          </Stat>
        </GridItem>

        <GridItem>
          <Stat bg={statBg} p={4} borderRadius="md" boxShadow="sm">
            <StatLabel>Issues</StatLabel>
            <StatNumber>{stats.disputed}</StatNumber>
          </Stat>
        </GridItem>
      </Grid>

      {/* Filters and Search */}
      <Card mb={6} variant="outline" bg={cardBg}>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Flex direction={{ base: "column", md: "row" }} gap={4}>
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
                  onChange={(e) =>
                    setStatusFilter(e.target.value as MilestoneStatus | "all")
                  }
                  width={{ base: "full", md: "150px" }}
                >
                  <option value="all">All Statuses</option>
                  <option value="InProgress">InProgress</option>
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                  <option value="Disputed">Disputed</option>
                </Select>

                <Menu>
                  <MenuButton
                    as={Button}
                    rightIcon={<FiChevronDown />}
                    size="md"
                    variant="outline"
                  >
                    Sort By
                  </MenuButton>
                  <MenuList>
                    <MenuItem onClick={() => handleSort("deadline")}>
                      Deadline{" "}
                      {sortField === "deadline" &&
                        (sortDirection === "asc" ? "↑" : "↓")}
                    </MenuItem>
                    <MenuItem onClick={() => handleSort("status")}>
                      Status{" "}
                      {sortField === "status" &&
                        (sortDirection === "asc" ? "↑" : "↓")}
                    </MenuItem>
                    <MenuItem onClick={() => handleSort("amount")}>
                      Amount{" "}
                      {sortField === "amount" &&
                        (sortDirection === "asc" ? "↑" : "↓")}
                    </MenuItem>
                    <MenuItem onClick={() => handleSort("escrowTitle")}>
                      Escrow Title{" "}
                      {sortField === "escrowTitle" &&
                        (sortDirection === "asc" ? "↑" : "↓")}
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
          <Tab>InProgress ({stats.active})</Tab>
          <Tab>Upcoming ({stats.pending})</Tab>
          <Tab>Completed ({stats.completed})</Tab>
          {stats.disputed > 0 && <Tab>Disputed ({stats.disputed})</Tab>}
        </TabList>

        <TabPanels>
          {/* All Milestones Panel */}
          <TabPanel p={0} pt={6}>
            {renderMilestoneList(filteredMilestones)}
          </TabPanel>

          {/* InProgress Milestones Panel */}
          <TabPanel p={0} pt={6}>
            {renderMilestoneList(
              filteredMilestones.filter((m) => m.status === "InProgress")
            )}
          </TabPanel>

          {/* Upcoming Milestones Panel */}
          <TabPanel p={0} pt={6}>
            {renderMilestoneList(
              filteredMilestones.filter((m) => m.status === "Pending")
            )}
          </TabPanel>

          {/* Completed Milestones Panel */}
          <TabPanel p={0} pt={6}>
            {renderMilestoneList(
              filteredMilestones.filter((m) => m.status === "Completed")
            )}
          </TabPanel>

          {/* Disputed Milestones Panel */}
          {stats.disputed > 0 && (
            <TabPanel p={0} pt={6}>
              {renderMilestoneList(
                filteredMilestones.filter((m) => m.status === "Disputed")
              )}
            </TabPanel>
          )}
        </TabPanels>
      </Tabs>
    </Box>
  );

  // Helper function to render milestone list
  function renderMilestoneList(milestones: Milestone[]) {
    if (milestones.length === 0) {
      return (
        <Box textAlign="center" py={10}>
          <FiFilter size={40} color="gray" />
          <Heading size="md" mt={4}>
            No milestones found
          </Heading>
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
            borderColor={
              milestone.status === "InProgress" 
                ? calculateIsLate(milestone) 
                  ? "orange.500" 
                  : "blue.500" 
                : borderColor
            }
            _hover={{ boxShadow: "md" }}
            transition="all 0.2s"
          >
            <CardBody>
              <Grid templateColumns={{ base: "1fr", md: "3fr 1fr" }} gap={4}>
                <GridItem>
                  <VStack align="start" spacing={3}>
                    <Flex
                      justifyContent="space-between"
                      width="100%"
                      alignItems="flex-start"
                    >
                      <HStack>
                        <Heading size="sm" mr={2}>
                          {milestone.description}
                        </Heading>
                        {getStatusBadge(milestone.status, calculateIsLate(milestone))}
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
                          {milestone.status === "Completed"
                            ? `Completed: ${formatDate(
                                milestone.completedAt
                              )}`
                            : `Deadline: ${formatDate(milestone.deadline)}`}
                        </Text>
                      </HStack>

                      {milestone.status === "Completed" ? (
                        <Text fontSize="sm" color="green.500">
                          {milestone.completedAt &&
                            getRelativeTime(milestone.completedAt, true)}
                        </Text>
                      ) : milestone.deadline ? (
                        <Text
                          fontSize="sm"
                          color={
                            calculateIsLate(milestone)
                              ? "red.500"
                              : (typeof milestone.deadline === "number"
                                  ? milestone.deadline
                                  : milestone.deadline.getTime()) -
                                  Date.now() <
                                3 * 24 * 60 * 60 * 1000
                              ? "orange.500"
                              : "blue.500"
                          }
                        >
                          {getRelativeTime(milestone.deadline)}
                        </Text>
                      ) : null}
                    </HStack>
                  </VStack>
                </GridItem>

                <GridItem>
                  <Flex
                    height="100%"
                    alignItems="start"
                    justifyContent={{ base: "flex-start", md: "flex-end" }}
                  >
                    <VStack spacing={2}>
                      <Button
                        size="sm"
                        leftIcon={<FiEye />}
                        colorScheme="blue"
                        variant="outline"
                        as={RouterLink}
                        to={`/milestone_detail/${milestone.escrowId}/${milestone.id}`}
                      >
                        View Milestone
                      </Button>
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
