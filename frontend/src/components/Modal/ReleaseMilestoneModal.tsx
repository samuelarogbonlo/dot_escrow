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
} from "@chakra-ui/react";

interface Milestone {
  id: string;
  description: string;
  amount: string;
  deadline: number;
  status: any;
  completionDate?: number;
}

interface ReleaseMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestone: Milestone | null;
  onConfirm: () => void;
  isLoading?: boolean;
}

const ReleaseMilestoneModal = ({
  isOpen,
  onClose,
  milestone,
  onConfirm,
  isLoading = false,
}: ReleaseMilestoneModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Release Milestone Payment</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="start" spacing={3}>
            <Text>
              You are about to release payment for the following milestone:
            </Text>
            <Box p={4} bg="gray.50" borderRadius="md" w="100%">
              <Text fontWeight="medium">{milestone?.description}</Text>
              <Text mt={1}>Amount: {milestone?.amount} USDT</Text>
            </Box>
            <Alert status="info">
              <AlertIcon />
              <Text fontSize="sm">
                By releasing this milestone, you confirm that the work has been
                completed satisfactorily. The funds will be transferred to the
                worker immediately and cannot be reversed.
              </Text>
            </Alert>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="green"
            onClick={onConfirm}
            isLoading={isLoading}
            loadingText="Releasing..."
          >
            Confirm Release
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ReleaseMilestoneModal;