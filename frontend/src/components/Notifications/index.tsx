import { useState, useEffect, useRef } from "react";
import { useWallet } from "../../hooks/useWalletContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import {
  Box,
  VStack,
  Heading,
  Text,
  Flex,
  Icon,
  useOutsideClick,
  useColorModeValue,
  Collapse,
  IconButton,
  Badge,
} from "@chakra-ui/react";
import {
  BellIcon,
  CheckCircleIcon,
  InfoIcon,
  WarningIcon,
} from "@chakra-ui/icons";

// This would typically come from a notifications slice in Redux
type Notification = {
  id: string;
  escrowId: string;
  notificationType: string;
  recipientAddress: string;
  senderAddress: string;
  message: string;
  timestamp: Date;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
};

const Notifications = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isExtensionReady, selectedAccount } = useWallet();
  const navigate = useNavigate();
  const notificationRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<Notification[]>([]);

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const toggleNotifications = () => setIsOpen(!isOpen);

  useOutsideClick({
    ref: notificationRef,
    handler: () => setIsOpen(false),
    enabled: isOpen, // Only listen when notification is open
  });

  useEffect(() => {
    const fetchNotification = async () => {
      if (!isExtensionReady || !selectedAccount) return;

      try {
        const response = await axios.get(`https://resilient-tenderness-production-4dfe.up.railway.app/notify`);

        const notificationList = response.data.filter(
          (m: any) => m.recipientAddress === selectedAccount.address
        );

        // Sort notifications in descending order by timestamp (latest first)
        const sortedNotifications = notificationList.sort((a: Notification, b: Notification) => {
          const dateA = new Date(a.timestamp);
          const dateB = new Date(b.timestamp);
          return dateB.getTime() - dateA.getTime();
        });

        setNotifications(sortedNotifications);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to get escrow details";
        return { success: false, error: errorMessage };
      }
    };

    fetchNotification();
  }, [isExtensionReady, selectedAccount]);

  const handleEscrowDetails = (escrowId: string, notificationType: string) => {
    const lowerNotificationType = notificationType.toLowerCase();

    if (lowerNotificationType.includes("escrow funded")) {
      navigate(`/confirm_escrow/${escrowId}`);
    }
    if (lowerNotificationType.includes("escrow proposal")) {
      navigate(`/confirm_escrow/${escrowId}`);
    }

    if (lowerNotificationType.includes("milestone ready")) {
      navigate(`/milestone`);
    }
    if (lowerNotificationType.includes("milestone disputed")) {
      navigate(`/milestone`);
    }

    setIsOpen(isOpen);
  };

  const markAsRead = async (id: string) => {
    try {
      // Optimistically update the UI first
      setNotifications(
        notifications.map((notification) =>
          notification.id === id
            ? { ...notification, read: true }
            : notification
        )
      );

      // Make API call to update read status on backend
      const response = await axios.patch(`https://resilient-tenderness-production-4dfe.up.railway.app/notify/${id}`, {
        read: true,
      });

      if (!response.data.success) {
        // If API call fails, revert the optimistic update
        setNotifications(
          notifications.map((notification) =>
            notification.id === id
              ? { ...notification, read: false }
              : notification
          )
        );

        console.error(
          "Failed to mark notification as read:",
          response.data.error
        );
        // Optionally show a toast notification about the error
      }
    } catch (error) {
      // If API call fails, revert the optimistic update
      setNotifications(
        notifications.map((notification) =>
          notification.id === id
            ? { ...notification, read: false }
            : notification
        )
      );

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to mark notification as read";
      console.error("Error marking notification as read:", errorMessage);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return CheckCircleIcon;
      case "warning":
        return WarningIcon;
      case "error":
        return WarningIcon;
      default:
        return InfoIcon;
    }
  };

  const getColorScheme = (type: string) => {
    switch (type) {
      case "success":
        return "green";
      case "warning":
        return "yellow";
      case "error":
        return "red";
      default:
        return "blue";
    }
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const unreadCount = notifications.filter((n) => n.read === false).length;

  return (
    <Box
      position="relative"
      height="fit-content"
      zIndex="10"
      ref={notificationRef}
    >
      <Flex direction="column" height="100%" position="relative">
        {/* Notification bell */}
        <Box position="relative">
          <IconButton
            aria-label="Notifications"
            icon={<BellIcon />}
            onClick={toggleNotifications}
            variant="ghost"
            size="lg"
          />
          {unreadCount > 0 && (
            <Badge
              position="absolute"
              top="0"
              right="0"
              colorScheme="red"
              borderRadius="full"
              fontSize="xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Box>

        {/* Notifications panel */}
        <Collapse in={isOpen} animateOpacity>
          <Box
            position="absolute"
            top="70px"
            right="0"
            width="350px"
            maxHeight="80vh"
            overflowY="auto"
            borderWidth="1px"
            borderRadius="md"
            boxShadow="lg"
            bg={bgColor}
            borderColor={borderColor}
          >
            <Flex
              justify="space-between"
              align="center"
              p={4}
              borderBottomWidth="1px"
            >
              <Heading size="sm">Notifications</Heading>
              <Text fontSize="sm" color="gray.500">
                {unreadCount} unread
              </Text>
            </Flex>

            {notifications.length > 0 ? (
              <VStack
                spacing={0}
                align="stretch"
                divider={<Box borderBottomWidth="1px" />}
              >
                {notifications.map((notification) => (
                  <Box
                    key={notification.id}
                    p={4}
                    cursor="pointer"
                    _hover={{
                      boxShadow: "md",
                      backgroundColor: "gray.100",
                    }}
                    opacity={notification.read ? 0.7 : 1}
                    onClick={() =>
                      handleEscrowDetails(
                        notification.escrowId,
                        notification.notificationType
                      )
                    }
                  >
                    <Flex justify="space-between">
                      <Flex align="center">
                        <Icon
                          as={getIcon(notification.type)}
                          color={`${getColorScheme(notification.type)}.500`}
                          mr={2}
                        />
                        <Text
                          fontWeight={notification.read ? "normal" : "bold"}
                        >
                          {notification.notificationType}
                        </Text>
                      </Flex>
                    </Flex>
                    <Text mt={1} fontSize="sm">
                      {notification.message}
                    </Text>
                    <Flex justify="space-between" mt={2}>
                      <Text fontSize="xs" color="gray.500">
                        {formatDate(notification.timestamp)}
                      </Text>
                      {!notification.read && (
                        <Text
                          fontSize="xs"
                          color="blue.500"
                          cursor="pointer"
                          onClick={() => markAsRead(notification.id)}
                        >
                          Mark as read
                        </Text>
                      )}
                    </Flex>
                  </Box>
                ))}
              </VStack>
            ) : (
              <Box p={4} textAlign="center">
                <Text color="gray.500">No notifications</Text>
              </Box>
            )}
          </Box>
        </Collapse>
      </Flex>
    </Box>
  );
};

export default Notifications;