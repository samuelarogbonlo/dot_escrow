// hooks/useComments.js
import { useState, useEffect } from "react";
import { useToast } from "@chakra-ui/react";
import axios from "axios";


interface Message {
  message: string;
  senderAddress: string;
  role: "client" | "worker" | "none";
  timeStamp: number;
}


export const useComments = (escrowId: string, milestoneId?: string) => {
  const [comments, setComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const fetchComments = async () => {
  if (!escrowId) return;

  setIsLoading(true);
  try {
    const baseUrl = "https://escrowdb.up.railway.app";
    const checkUrl = `${baseUrl}/comment?escrowId=${escrowId}&milestoneId=${milestoneId}`;

    const response = await axios.get(checkUrl);


    // Check for successful HTTP status
    if (response.status === 200) {
      const conversationsArray = response.data;

      // Check if we got an array and it has at least one conversation
      if (Array.isArray(conversationsArray) && conversationsArray.length > 0) {
        // Get the first (and likely only) conversation
        const conversationData = conversationsArray[0];
        
        // Check if the conversation has messages
        if (conversationData.messages && Array.isArray(conversationData.messages)) {
          
          // Transform messages to comment format that matches your UI expectations
          const transformedComments = conversationData.messages.map((message: Message) => ({
            content: message.message,
            authorAddress: message.senderAddress,
            authorRole: message.role,
            timestamp: new Date(message.timeStamp),
            conversationId: conversationData.id,
            escrowId: conversationData.escrowId,
            milestoneId: conversationData.milestoneId
          }));

          setComments(transformedComments);
          console.log('Loaded comments:', transformedComments);
        } else {
          console.log('Conversation exists but has no messages');
          setComments([]);
        }
      } else {
        // No conversations found or empty array
        setComments([]);
      }

      return true;
    } else {
      throw new Error(`HTTP ${response.status}: Failed to fetch comments`);
    }
  } catch (error) {
    console.error('Error fetching comments:', error);


    // Only show error toast for actual errors, not 404s
    toast({
      title: "Failed to load comments",
      description: "Please try again",
      status: "error",
      duration: 3000,
      isClosable: true,
    });

    return false;
  } finally {
    setIsLoading(false);
  }
};

  // Add new comment
  const addComment = async (
  content: string,
  authorAddress: string,
  authorRole: "client" | "worker" | "none"
) => {
  if (!content.trim()) return false;

  setIsSubmitting(true);
  try {
    const baseUrl = "https://escrowdb.up.railway.app";

    // Step 1: Check if conversation already exists
    const checkUrl = `${baseUrl}/comment?escrowId=${escrowId}&milestoneId=${milestoneId}`;
    let existingConversation = null;

    try {
      const checkResponse = await axios.get(checkUrl);
      const conversationsArray = checkResponse.data;
      
      
      // Handle array response - get the first conversation if it exists
      if (Array.isArray(conversationsArray) && conversationsArray.length > 0) {
        existingConversation = conversationsArray[0];
      }
    } catch (checkError) {
      // If 404, no conversation exists yet
      console.log('No existing conversation found');
    }

    const newMessage = {
      message: content,
      senderAddress: authorAddress,
      role: authorRole,
      timeStamp: Date.now()
    };

    let response;

    if (existingConversation && existingConversation.id) {
      
      // Step 2a: Append to existing conversation
      const updateUrl = `${baseUrl}/comment/${existingConversation.id}`;
      const updateData = {
        ...existingConversation,
        messages: [...existingConversation.messages, newMessage]
      };

      response = await axios.put(updateUrl, updateData, {
        headers: {
          "Content-Type": "application/json",
        },
      });
    } else {
      
      // Step 2b: Create new conversation
      const createUrl = `${baseUrl}/comment`;
      const commentData = {
        escrowId,
        milestoneId,
        messages: [newMessage]
      };

      response = await axios.post(createUrl, commentData, {
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    console.log('Response:', response.data);

    // Step 3: Handle success and update local state
    if (response.status === 200 || response.status === 201) {
      // Create comment object for local state
      const conversationId = response.data.id || existingConversation?.id;
      
      const newComment = {
        id: `${conversationId}-msg-${Date.now()}`,
        content: content,
        authorAddress: authorAddress,
        authorRole: authorRole,
        timestamp: new Date(),
        isEdited: false,
        conversationId: conversationId,
        escrowId: escrowId,
        milestoneId: milestoneId
      };

      setComments(prevComments => [...prevComments, newComment]);

      toast({
        title: "Comment added",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      return true;
    } else {
      throw new Error("Failed to add comment");
    }

  } catch (error) {
    console.error('Error adding comment:', error);

    toast({
      title: "Failed to add comment",
      description:  "Please try again",
      status: "error",
      duration: 3000,
      isClosable: true,
    });
    return false;
  } finally {
    setIsSubmitting(false);
  }
};

  // Get comment count
  const getCommentCount = () => comments.length;


  // Auto-fetch comments when escrowId or milestoneId changes
  useEffect(() => {
    if (escrowId) {
      fetchComments();
    }
  }, [escrowId, milestoneId]);

  // Optional: Poll for new comments every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (escrowId && !isLoading && !isSubmitting) {
        fetchComments();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [escrowId, milestoneId, isLoading, isSubmitting]);

  return {
    comments,
    isLoading,
    isSubmitting,
    addComment,
    fetchComments,
    getCommentCount,
  };
};