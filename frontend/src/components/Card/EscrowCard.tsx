import {
  Box,
  Text,
  Heading,
  Flex,
  Badge,
  Grid,
  useColorModeValue,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { EscrowData } from "../../hooks/useEscrowContract";

const EscrowCard = ({ escrow }: { escrow: EscrowData }) => {
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const navigate = useNavigate();

  const completedMilestones = escrow.milestones.filter(
    (m) => m.status === "Completed"
  ).length;
  const totalMilestones = escrow.milestones.length;
  const progress =
    totalMilestones > 0
      ? Math.round((completedMilestones / totalMilestones) * 100)
      : 0;
  const nextMilestone = escrow.milestones.find(
    (m) => m.status === "InProgress" || m.status === "Pending"
  );

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "green";
      case "Completed":
        return "blue";
      case "Disputed":
        return "red";
      case "Cancelled":
        return "gray";
      default:
        return "gray";
    }
  };

  return (
    <Box
      p={4}
      borderWidth="1px"
      borderRadius="lg"
      borderColor={borderColor}
      bg={bgColor}
      boxShadow="sm"
      onClick={() => navigate(`/escrow/${escrow.id}`)}
      cursor="pointer"
      _hover={{ boxShadow: "md", borderColor: "blue.300" }}
      transition="all 0.2s"
    >
      <Flex justify="space-between" align="start" mb={2}>
        <Heading size="sm" fontWeight="semibold" noOfLines={1}>
          {nextMilestone?.description || "Escrow Agreement"}
        </Heading>
        <Badge colorScheme={getStatusColor(escrow.status)}>
          {escrow.status}
        </Badge>
      </Flex>

      <Text fontSize="sm" color="gray.500" mb={3}>
        Created on {formatDate(escrow.createdAt)}
      </Text>

      <Grid templateColumns="1fr 1fr" gap={3} mb={3}>
        <Box>
          <Text fontSize="xs" color="gray.500">
            Amount
          </Text>
          <Text fontWeight="bold">
            {" "}
            {escrow.milestones.reduce(
              (sum, milestone) => sum + Number(milestone.amount),
              0
            )}{" "}
            USDT
          </Text>
        </Box>
        <Box>
          <Text fontSize="xs" color="gray.500">
            Progress
          </Text>
          <Text fontWeight="bold">
            {progress}% ({completedMilestones}/{totalMilestones})
          </Text>
        </Box>
      </Grid>

      {nextMilestone && (
        <Box
          mt={2}
          p={2}
          bg={useColorModeValue("gray.50", "gray.700")}
          borderRadius="md"
        >
          <Text fontSize="xs" color="gray.500">
            Next milestone due
          </Text>
          <Text fontSize="sm" fontWeight="medium">
            {formatDate(nextMilestone.deadline)}
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default EscrowCard;
