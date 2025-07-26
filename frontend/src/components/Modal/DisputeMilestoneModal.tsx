import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  Text,
  Box,
  Alert,
  AlertIcon,
  FormControl,
  FormLabel,
  Textarea,
} from "@chakra-ui/react";
import { useState } from "react";

interface Milestone {
  id: string;
  description: string;
  amount: string;
  deadline: Date;
  status: any;
  completionDate?: Date;
}

interface DisputeMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestone: Milestone | null;
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
}

const DisputeMilestoneModal = ({
  isOpen,
  onClose,
  milestone,
  onConfirm,
  isLoading = false,
}: DisputeMilestoneModalProps) => {
  const [disputeReason, setDisputeReason] = useState("");

  const handleClose = () => {
    setDisputeReason("");
    onClose();
  };

  const handleConfirm = () => {
    onConfirm(disputeReason);
    setDisputeReason("");
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Dispute Milestone</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="start" spacing={3}>
            <Text>You are disputing the following milestone:</Text>
            <Box p={4} bg="gray.50" borderRadius="md" w="100%">
              <Text fontWeight="medium">{milestone?.description}</Text>
              <Text mt={1}>Amount: {milestone?.amount} USDT</Text>
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
                Disputes will be reviewed according to the platform's dispute
                resolution process. Please provide clear details to help resolve
                the issue.
              </Text>
            </Alert>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" mr={3} onClick={handleClose}>
            Cancel
          </Button>
          <Button
            colorScheme="orange"
            onClick={handleConfirm}
            isDisabled={!disputeReason.trim()}
            isLoading={isLoading}
            loadingText="Submitting..."
          >
            Submit Dispute
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DisputeMilestoneModal;