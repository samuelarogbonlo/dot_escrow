import { useState } from "react";
import {
  Box,
  Card,
  CardBody,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Badge,
  Grid,
  GridItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Progress,
  Icon,
  Divider,
  Alert,
  AlertIcon,
  useToast,
  useColorModeValue,
  Select,
  Input,
  FormControl,
  FormLabel,
  Textarea,
  NumberInput,
  NumberInputField,
} from "@chakra-ui/react";
import {
  FiUsers,
  FiCheckCircle,
  FiEye,
  FiPlus,
  FiPause,
  FiPlay,
  FiSettings,
  FiAlertTriangle,
} from "react-icons/fi";
import { useWallet } from '../../../hooks/useWalletContext';
import { useAdminGovernance } from '../../../hooks/useAdminGovernance';

interface ActionQueueProps {
  proposals?: any[];
  onRefresh: () => void;
}

interface Proposal {
  id: string;
  type: string;
  title: string;
  description: string;
  proposer: string;
  created_at: string;
  expires_at: string;
  approvals: string[];
  required_approvals: number;
  status: string;
  data: any;
}

const ActionQueue: React.FC<ActionQueueProps> = ({ proposals, onRefresh }) => {
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [newProposalType, setNewProposalType] = useState<string>("");
  const [newProposalData, setNewProposalData] = useState<Record<string, any>>({});

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isCreateOpen,
    onOpen: onCreateOpen,
    onClose: onCreateClose,
  } = useDisclosure();

  const toast = useToast();
  const cardBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const { api, selectedAccount } = useWallet();
  const governance = useAdminGovernance({ api, account: selectedAccount as any });

  const mappedProposals: Proposal[] = (proposals || []).map((p: any) => ({
    id: String(p.id),
    type: p.type,
    title: p.title || p.type,
    description: p.description || '',
    proposer: p.proposer,
    created_at: p.created_at,
    expires_at: p.expires_at || '',
    approvals: p.approvals || [],
    required_approvals: p.required_approvals || 1,
    status: p.status,
    data: p.data,
  }));

  const getProposalIcon = (type: string | undefined) => {
    if (!type) return FiSettings;
    switch (type) {
      case "pause_contract":
        return FiPause;
      case "resume_contract":
        return FiPlay;
      case "update_fee":
        return FiSettings;
      case "emergency_withdraw":
        return FiAlertTriangle;
      case "add_signer":
        return FiUsers;
      case "remove_signer":
        return FiUsers;
      default:
        return FiSettings;
    }
  };

  const getStatusBadge = (proposal: Proposal) => {
    const progress =
      (proposal.approvals.length / proposal.required_approvals) * 100;

    if (proposal.status === "executed") {
      return <Badge colorScheme="green">Executed</Badge>;
    }
    if (proposal.status === "cancelled") {
      return <Badge colorScheme="red">Cancelled</Badge>;
    }
    if (new Date(proposal.expires_at) < new Date()) {
      return <Badge colorScheme="orange">Expired</Badge>;
    }
    if (progress >= 100) {
      return <Badge colorScheme="blue">Ready to Execute</Badge>;
    }
    return <Badge colorScheme="yellow">Pending Approvals</Badge>;
  };

  const handleApproveProposal = async (_proposalId: string) => {
    try {
      await governance.approveProposal(Number(_proposalId));
      toast({
        title: "Approval Submitted",
        description: "Your approval has been recorded.",
        status: "success",
        duration: 3000,
      });
      onRefresh();
    } catch (error: any) {
      toast({
        title: "Approval Failed",
        description: error?.message || "Unknown error occurred",
        status: "error",
        duration: 5000,
      });
    }
  };

  const handleExecuteProposal = async (_proposalId: string) => {
    try {
      await governance.executeProposal(Number(_proposalId));
      toast({
        title: "Proposal Executed",
        description: "The proposal has been successfully executed.",
        status: "success",
        duration: 3000,
      });
      onRefresh();
    } catch (error: any) {
      toast({
        title: "Execution Failed",
        description: error?.message || "Unknown error occurred",
        status: "error",
        duration: 5000,
      });
    }
  };

  const handleCreateProposal = async () => {
    try {
      switch (newProposalType) {
        case 'update_fee':
          await governance.proposeSetFee(Number(newProposalData.fee_bps));
          break;
        case 'pause_contract':
          await governance.proposePause();
          break;
        case 'resume_contract':
          await governance.proposeUnpause();
          break;
        case 'emergency_withdraw':
          await governance.proposeEmergencyWithdraw(String(newProposalData.recipient), Number(newProposalData.amount));
          break;
        case 'add_signer':
          await governance.proposeAddSigner(String(newProposalData.signer));
          break;
        case 'remove_signer':
          await governance.proposeRemoveSigner(String(newProposalData.signer));
          break;
        default:
          throw new Error('Select a valid proposal type');
      }
      toast({
        title: "Proposal Created",
        description: "New proposal has been submitted for approval.",
        status: "success",
        duration: 3000,
      });
      onCreateClose();
      setNewProposalType("");
      setNewProposalData({});
      onRefresh();
    } catch (error: any) {
      toast({
        title: "Creation Failed",
        description: error?.message || "Unknown error occurred",
        status: "error",
        duration: 5000,
      });
    }
  };

  const renderProposalDetails = (proposal: Proposal) => {
    switch (proposal.type) {
      case "update_fee":
        return (
          <VStack align="start" spacing={2}>
            <Text>
              <strong>Current Fee:</strong>{" "}
              {(proposal.data.old_fee_bps / 100).toFixed(2)}%
            </Text>
            <Text>
              <strong>Proposed Fee:</strong>{" "}
              {(proposal.data.new_fee_bps / 100).toFixed(2)}%
            </Text>
          </VStack>
        );
      case "pause_contract":
      case "resume_contract":
        return (
          <Text>
            <strong>Reason:</strong> {proposal.data.reason}
          </Text>
        );
      default:
        return <Text>View full details in the modal.</Text>;
    }
  };

  const renderNewProposalForm = () => {
    switch (newProposalType) {
      case "update_fee":
        return (
          <FormControl>
            <FormLabel>New Fee (in basis points)</FormLabel>
            <NumberInput
              value={newProposalData.fee_bps || ""}
              onChange={(val) =>
                setNewProposalData({ ...newProposalData, fee_bps: val })
              }
            >
              <NumberInputField placeholder="e.g., 200 for 2.0%" />
            </NumberInput>
          </FormControl>
        );
      case "pause_contract":
      case "resume_contract":
        return (
          <FormControl>
            <FormLabel>Reason</FormLabel>
            <Textarea
              value={newProposalData.reason || ""}
              onChange={(e) =>
                setNewProposalData({
                  ...newProposalData,
                  reason: e.target.value,
                })
              }
              placeholder="Provide a reason for this action..."
            />
          </FormControl>
        );
      case "emergency_withdraw":
        return (
          <VStack spacing={4}>
            <FormControl>
              <FormLabel>Withdrawal Amount (USDT)</FormLabel>
              <NumberInput
                value={newProposalData.amount || ""}
                onChange={(val) =>
                  setNewProposalData({ ...newProposalData, amount: val })
                }
              >
                <NumberInputField placeholder="Amount to withdraw" />
              </NumberInput>
            </FormControl>
            <FormControl>
              <FormLabel>Recipient Address</FormLabel>
              <Input
                value={newProposalData.recipient || ""}
                onChange={(e) =>
                  setNewProposalData({
                    ...newProposalData,
                    recipient: e.target.value,
                  })
                }
                placeholder="0x..."
              />
            </FormControl>
            <FormControl>
              <FormLabel>Emergency Reason</FormLabel>
              <Textarea
                value={newProposalData.reason || ""}
                onChange={(e) =>
                  setNewProposalData({
                    ...newProposalData,
                    reason: e.target.value,
                  })
                }
                placeholder="Detailed justification for emergency withdrawal..."
              />
            </FormControl>
          </VStack>
        );
      default:
        return null;
    }
  };

  return (
    <VStack spacing={6} align="stretch">
      {/* Header with Create Button */}
      <HStack justify="space-between" align="center">
        <Box>
          <Heading size="md">Pending Proposals</Heading>
          <Text color="gray.600" fontSize="sm">
            Review and approve multisig proposals
          </Text>
        </Box>
        <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={onCreateOpen}>
          New Proposal
        </Button>
      </HStack>

      {/* Proposals List */}
      {mappedProposals?.length === 0 ? (
        <Card bg={cardBg}>
          <CardBody textAlign="center" py={10}>
            <Icon as={FiCheckCircle} boxSize={12} color="green.500" mb={4} />
            <Heading size="md" mb={2}>
              No Pending Proposals
            </Heading>
            <Text color="gray.600">All proposals have been processed.</Text>
          </CardBody>
        </Card>
      ) : (
        <VStack spacing={4} align="stretch">
          {mappedProposals?.map((proposal) => {
            const progress =
              (proposal.approvals.length / proposal.required_approvals) * 100;
            const canExecute = progress >= 100 && proposal.status === "pending";

            return (
              <Card key={proposal.id} bg={cardBg} borderColor={borderColor}>
                <CardBody>
                  <Grid
                    templateColumns={{ base: "1fr", md: "1fr auto" }}
                    gap={4}
                  >
                    <GridItem>
                      <VStack align="start" spacing={3}>
                        <HStack>
                          <Icon as={getProposalIcon(proposal.type)} />
                          <Heading size="sm">{proposal.title}</Heading>
                          {getStatusBadge(proposal)}
                        </HStack>

                        <Text fontSize="sm" color="gray.600">
                          {proposal.description}
                        </Text>

                        {renderProposalDetails(proposal)}

                        <HStack spacing={4} fontSize="xs" color="gray.500">
                          <Text>Proposed by: {proposal.proposer}</Text>
                          <Text>
                            Created:{" "}
                            {new Date(proposal.created_at).toLocaleDateString()}
                          </Text>
                          <Text>
                            Expires:{" "}
                            {new Date(proposal.expires_at).toLocaleDateString()}
                          </Text>
                        </HStack>

                        <Box w="full">
                          <HStack justify="space-between" mb={1}>
                            <Text fontSize="sm">Approval Progress</Text>
                            <Text fontSize="sm">
                              {proposal.approvals.length}/
                              {proposal.required_approvals}
                            </Text>
                          </HStack>
                          <Progress
                            value={progress}
                            colorScheme="blue"
                            size="sm"
                          />
                        </Box>
                      </VStack>
                    </GridItem>

                    <GridItem>
                      <VStack spacing={2}>
                        <Button
                          size="sm"
                          leftIcon={<FiEye />}
                          variant="outline"
                          onClick={() => {
                            setSelectedProposal(proposal);
                            onOpen();
                          }}
                        >
                          Details
                        </Button>

                        {!proposal.approvals.includes(
                          "current_user_address"
                        ) && (
                          <Button
                            size="sm"
                            leftIcon={<FiCheckCircle />}
                            colorScheme="green"
                            onClick={() => handleApproveProposal(proposal.id)}
                          >
                            Approve
                          </Button>
                        )}

                        {canExecute && (
                          <Button
                            size="sm"
                            leftIcon={<FiPlay />}
                            colorScheme="blue"
                            onClick={() => handleExecuteProposal(proposal.id)}
                          >
                            Execute
                          </Button>
                        )}
                      </VStack>
                    </GridItem>
                  </Grid>
                </CardBody>
              </Card>
            );
          })}
        </VStack>
      )}

      {/* Proposal Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <Icon as={getProposalIcon(selectedProposal?.type)} />
              <Text>{selectedProposal?.title}</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedProposal && (
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontWeight="bold" mb={2}>
                    Description:
                  </Text>
                  <Text>{selectedProposal.description}</Text>
                </Box>

                <Divider />

                <Grid templateColumns="1fr 1fr" gap={4}>
                  <Box>
                    <Text fontWeight="bold" mb={1}>
                      Proposer:
                    </Text>
                    <Text fontSize="sm">{selectedProposal.proposer}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" mb={1}>
                      Type:
                    </Text>
                    <Text fontSize="sm">{selectedProposal.type}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" mb={1}>
                      Created:
                    </Text>
                    <Text fontSize="sm">
                      {new Date(selectedProposal.created_at).toLocaleString()}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" mb={1}>
                      Expires:
                    </Text>
                    <Text fontSize="sm">
                      {new Date(selectedProposal.expires_at).toLocaleString()}
                    </Text>
                  </Box>
                </Grid>

                <Divider />

                <Box>
                  <Text fontWeight="bold" mb={2}>
                    Approval Status:
                  </Text>
                  <Progress
                    value={
                      (selectedProposal.approvals.length /
                        selectedProposal.required_approvals) *
                      100
                    }
                    colorScheme="blue"
                    size="lg"
                    mb={2}
                  />
                  <Text fontSize="sm">
                    {selectedProposal.approvals.length} of{" "}
                    {selectedProposal.required_approvals} required approvals
                  </Text>
                </Box>

                <Box>
                  <Text fontWeight="bold" mb={2}>
                    Approved By:
                  </Text>
                  <VStack align="start" spacing={1}>
                    {selectedProposal.approvals.map((signer, index) => (
                      <HStack key={index}>
                        <Icon as={FiCheckCircle} color="green.500" />
                        <Text fontSize="sm">{signer}</Text>
                      </HStack>
                    ))}
                  </VStack>
                </Box>

                {selectedProposal.type === "update_fee" && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>
                      Fee Change Details:
                    </Text>
                    <HStack justify="space-between">
                      <Text>Current Fee:</Text>
                      <Text>
                        {(selectedProposal.data.old_fee_bps / 100).toFixed(2)}%
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text>New Fee:</Text>
                      <Text>
                        {(selectedProposal.data.new_fee_bps / 100).toFixed(2)}%
                      </Text>
                    </HStack>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Close
            </Button>
            {selectedProposal &&
              !selectedProposal.approvals.includes("current_user_address") && (
                <Button
                  colorScheme="green"
                  onClick={() => {
                    handleApproveProposal(selectedProposal.id);
                    onClose();
                  }}
                >
                  Approve Proposal
                </Button>
              )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Create New Proposal Modal */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Proposal</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="info">
                <AlertIcon />
                <Text fontSize="sm">
                  All proposals require multisig approval before execution.
                  Choose the action type and provide necessary details.
                </Text>
              </Alert>

              <FormControl>
                <FormLabel>Proposal Type</FormLabel>
                <Select
                  placeholder="Select action type..."
                  value={newProposalType}
                  onChange={(e) => setNewProposalType(e.target.value)}
                >
                  <option value="pause_contract">Pause Contract</option>
                  <option value="resume_contract">Resume Contract</option>
                  <option value="update_fee">Update Platform Fee</option>
                  <option value="emergency_withdraw">Emergency Withdraw</option>
                  <option value="add_signer">Add New Signer</option>
                  <option value="remove_signer">Remove Signer</option>
                </Select>
              </FormControl>

              {newProposalType && renderNewProposalForm()}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCreateClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleCreateProposal}
              isDisabled={!newProposalType}
            >
              Submit Proposal
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default ActionQueue;
