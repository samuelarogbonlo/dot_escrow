import { useState } from 'react'
import { 
  Box, 
  VStack, 
  Heading, 
  Text, 
  Flex, 
  Icon, 
  CloseButton,
  useColorModeValue,
  Collapse,
  IconButton,
  Badge
} from '@chakra-ui/react'
import { BellIcon, CheckCircleIcon, InfoIcon, WarningIcon } from '@chakra-ui/icons'

// This would typically come from a notifications slice in Redux
type Notification = {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
};

// Placeholder data - in real app, this would come from Redux store
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Escrow Created',
    message: 'Your escrow agreement with 0x123...456 has been created successfully.',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    type: 'success',
    read: false
  },
  {
    id: '2',
    title: 'Milestone Ready for Review',
    message: 'Client has marked Milestone #1 as ready for review.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    type: 'info',
    read: false
  },
  {
    id: '3',
    title: 'Payment Released',
    message: 'Payment of 500 USDT has been released to your wallet.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    type: 'success',
    read: true
  }
];

const Notifications = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  const toggleNotifications = () => setIsOpen(!isOpen);
  
  const markAsRead = (id: string) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };
  
  const removeNotification = (id: string) => {
    setNotifications(notifications.filter(notification => notification.id !== id));
  };
  
  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircleIcon;
      case 'warning': return WarningIcon;
      case 'error': return WarningIcon;
      default: return InfoIcon;
    }
  };
  
  const getColorScheme = (type: string) => {
    switch (type) {
      case 'success': return 'green';
      case 'warning': return 'yellow';
      case 'error': return 'red';
      default: return 'blue';
    }
  };
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return (
    <Box position="relative" height="fit-content" zIndex="10">
      <Flex direction="column" height="100%" position="relative">
        {/* Notification bell */}
        <Box position="relative">
          <IconButton
            aria-label="Notifications"
            icon={<BellIcon />}
            onClick={toggleNotifications}
            variant="ghost"
            position="relative"
            size="lg"
          >
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
          </IconButton>
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
            <Flex justify="space-between" align="center" p={4} borderBottomWidth="1px">
              <Heading size="sm">Notifications</Heading>
              <Text fontSize="sm" color="gray.500">
                {unreadCount} unread
              </Text>
            </Flex>
            
            {notifications.length > 0 ? (
              <VStack spacing={0} align="stretch" divider={<Box borderBottomWidth="1px" />}>
                {notifications.map(notification => (
                  <Box key={notification.id} p={4} opacity={notification.read ? 0.7 : 1}>
                    <Flex justify="space-between">
                      <Flex align="center">
                        <Icon 
                          as={getIcon(notification.type)} 
                          color={`${getColorScheme(notification.type)}.500`} 
                          mr={2} 
                        />
                        <Text fontWeight={notification.read ? "normal" : "bold"}>
                          {notification.title}
                        </Text>
                      </Flex>
                      <CloseButton size="sm" onClick={() => removeNotification(notification.id)} />
                    </Flex>
                    <Text mt={1} fontSize="sm">{notification.message}</Text>
                    <Flex justify="space-between" mt={2}>
                      <Text fontSize="xs" color="gray.500">
                        {notification.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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