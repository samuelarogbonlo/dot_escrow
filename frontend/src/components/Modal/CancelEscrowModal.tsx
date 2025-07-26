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

interface Escrow {
  id: string;
  title: string;
  totalAmount: string;
}

interface CancelEscrowModalProps {
  isOpen: boolean;
  onClose: () => void;
  escrow: Escrow | null;
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
}

const CancelEscrowModal = ({
  isOpen,
  onClose,
  escrow,
  onConfirm,
  isLoading = false,
}: CancelEscrowModalProps) => {
  const [cancelReason, setCancelReason] = useState("");

  const handleClose = () => {
    setCancelReason("");
    onClose();
  };

  const handleConfirm = () => {
    onConfirm(cancelReason);
    setCancelReason("");
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Cancel Escrow</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="start" spacing={3}>
            <Text>You are about to cancel the entire escrow:</Text>
            <Box p={4} bg="gray.50" borderRadius="md" w="100%">
              <Text fontWeight="medium">{escrow?.title}</Text>
              <Text mt={1}>Total Amount: {escrow?.totalAmount} USDT</Text>
            </Box>
            <FormControl isRequired>
              <FormLabel>Reason for cancellation:</FormLabel>
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please explain why you are cancelling this escrow..."
                rows={4}
              />
            </FormControl>
            <Alert status="error">
              <AlertIcon />
              <Text fontSize="sm">
                Cancelling an escrow requires mutual agreement from both parties.
                The other party will need to confirm the cancellation before
                funds are returned.
              </Text>
            </Alert>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" mr={3} onClick={handleClose}>
            Back
          </Button>
          <Button
            colorScheme="red"
            onClick={handleConfirm}
            isDisabled={!cancelReason.trim()}
            isLoading={isLoading}
            loadingText="Requesting..."
          >
            Request Cancellation
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CancelEscrowModal;