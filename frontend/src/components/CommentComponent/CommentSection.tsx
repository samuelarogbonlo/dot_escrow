// components/CommentSection.jsx
import React, { useState } from "react";
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Textarea,
  Avatar,
  Badge,
  Divider,
  Spinner,
} from "@chakra-ui/react";
import {
  FiMessageSquare,
  FiSend,
  
} from "react-icons/fi";
import { useComments } from "@/hooks/useComments";


interface CommentSectionProps {
  escrowId: string;
  milestoneId?: string;
  currentUserAddress: string;
  currentUserRole: "client" | "worker" | "none";
}

const CommentSection: React.FC<CommentSectionProps> = ({
  escrowId,
  milestoneId,
  currentUserAddress,
  currentUserRole,
  
}) => {
  const {
    comments,
    isLoading,
    isSubmitting,
    addComment,
    getCommentCount,
  } = useComments(escrowId, milestoneId);

  const [newComment, setNewComment] = useState("");


  // Utility function to truncate address
  const truncateAddress = (address: string): string => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Format time
  const formatTime = (date: Date): string => {
    if (!date || isNaN(date.getTime())) {
      return "Invalid Date";
    }

    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Handle add comment
  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    const success = await addComment(newComment, currentUserAddress, currentUserRole)
    if (success) {
      setNewComment("");
     
    }
  };


  return (
    <Card>
      <CardHeader>
        <HStack justify="space-between">
          <Heading size="md">Discussion</Heading>
          <HStack>
            <FiMessageSquare />
            <Text color="gray.600">{getCommentCount()} comments</Text>
          </HStack>
        </HStack>
      </CardHeader>
      <CardBody>
        <VStack spacing={4} align="stretch">
          {/* Add Comment Section */}
          <Box p={4} bg="gray.50" rounded="lg">
            <VStack spacing={3}>
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                resize="vertical"
                minH="100px"
                isDisabled={isSubmitting}
              />
              <HStack w="full">
                <Button
                  leftIcon={<FiSend />}
                  colorScheme="blue"
                  size="sm"
                  onClick={handleAddComment}
                  isDisabled={!newComment.trim()}
                  isLoading={isSubmitting}
                  loadingText="Posting..."
                >
                  Post Comment
                </Button>
              </HStack>
            </VStack>
          </Box>

          <Divider />

          {/* Comments List */}
          {isLoading ? (
            <Box textAlign="center" py={8}>
              <Spinner size="md" />
              <Text mt={2}>Loading comments...</Text>
            </Box>
          ) : (
            <VStack spacing={4} align="stretch">
              {comments.length === 0 ? (
                <Box textAlign="center" py={8}>
                  <Text color="gray.500">No comments yet. Start the discussion!</Text>
                </Box>
              ) : (
                comments.map((comment) => (
                  <Box
                    key={comment.id}
                    p={4}
                    bg="white"
                    border="1px"
                    borderColor="gray.200"
                    rounded="lg"
                  >
                    {/* Comment Header */}
                    <HStack justify="space-between" mb={3}>
                      <HStack>
                        <Avatar
                          size="sm"
                          name={comment.authorAddress}
                        />
                        <VStack align="start" spacing={0}>
                          <HStack>
                            <Badge
                              size="xs"
                              colorScheme={
                                comment.authorRole === "client" ? "blue" : "green"
                              }
                            >
                              {comment.authorRole}
                            </Badge>
                            <Text fontSize="xs" color="gray.500">
                              {truncateAddress(comment.authorAddress)}
                            </Text>
                          </HStack>
                          <Text fontSize="xs" color="gray.500">
                            {formatTime(comment.timestamp)}
                          </Text>
                          <Text>
                            {comment.content}
                          </Text>
                        </VStack>
                      </HStack>
                      
                      
                    </HStack>
                    
                  </Box>
                ))
              )}
            </VStack>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
};

export default CommentSection;