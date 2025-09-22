// import { useState, useEffect } from 'react';
// import {
//   Box,
//   Heading,
//   Text,
//   VStack,
//   HStack,
//   Grid,
//   GridItem,
//   Card,
//   CardHeader,
//   CardBody,
//   Flex,
//   Stack,
//   FormControl,
//   FormLabel,
//   FormHelperText,
//   Input,
//   InputGroup,
//   InputRightElement,
//   Select,
//   Switch,
//   Button,
//   IconButton,
//   Avatar,
//   AvatarBadge,
//   Divider,
//   Badge,
//   useColorMode,
//   useColorModeValue,
//   Tabs,
//   TabList,
//   TabPanels,
//   Tab,
//   TabPanel,
//   Alert,
//   AlertIcon,
//   AlertTitle,
//   AlertDescription,
//   useToast,
//   Spinner,
//   Modal,
//   ModalOverlay,
//   ModalContent,
//   ModalHeader,
//   ModalFooter,
//   ModalBody,
//   ModalCloseButton,
//   useDisclosure,
// } from '@chakra-ui/react';
// import { 
//   FiUser, 
//   FiShield, 
//   FiBell, 
//   FiDollarSign, 
//   FiGlobe, 
//   FiEye, 
//   FiEyeOff, 
//   FiEdit, 
//   FiUpload,
//   FiCheck,
//   FiX,
//   FiSave,
//   FiMoon,
//   FiSun,
//   FiLogOut,
// } from 'react-icons/fi';
// import { useWallet } from '../../hooks/useWalletContext';

// // Define types for user profile
// interface UserProfile {
//   name: string;
//   username: string;
//   email: string;
//   avatarUrl: string;
//   bio: string;
//   location: string;
//   timeZone: string;
//   language: string;
//   contactEmail: string;
//   phone?: string;
//   website?: string;
//   company?: string;
//   twoFactorEnabled: boolean;
//   notificationSettings: {
//     email: boolean;
//     browser: boolean;
//     escrowUpdates: boolean;
//     milestoneUpdates: boolean;
//     disputeUpdates: boolean;
//     marketingUpdates: boolean;
//   };
//   paymentSettings: {
//     defaultCurrency: string;
//     autoReleaseFunds: boolean;
//     defaultFeeStrategy: 'client' | 'worker' | 'split';
//   };
//   displaySettings: {
//     theme: 'light' | 'dark' | 'system';
//     compactView: boolean;
//     showAvatars: boolean;
//     reduceAnimations: boolean;
//   };
//   privacySettings: {
//     profileVisibility: 'public' | 'private' | 'escrow_only';
//     showEarnings: boolean;
//     showRealName: boolean;
//   };
// }

// // Mock data for user profile
// const mockUserProfile: UserProfile = {
//   name: 'Alex Johnson',
//   username: 'alexj',
//   email: 'alex.johnson@example.com',
//   avatarUrl: '',
//   bio: 'Freelance developer specializing in blockchain technology',
//   location: 'San Francisco, CA',
//   timeZone: 'America/Los_Angeles',
//   language: 'en',
//   contactEmail: 'alex.johnson@example.com',
//   phone: '+1 (555) 123-4567',
//   website: 'https://alexjohnson.dev',
//   company: 'Johnson Development LLC',
//   twoFactorEnabled: false,
//   notificationSettings: {
//     email: true,
//     browser: true,
//     escrowUpdates: true,
//     milestoneUpdates: true,
//     disputeUpdates: true,
//     marketingUpdates: false,
//   },
//   paymentSettings: {
//     defaultCurrency: 'USDT',
//     autoReleaseFunds: false,
//     defaultFeeStrategy: 'split',
//   },
//   displaySettings: {
//     theme: 'system',
//     compactView: false,
//     showAvatars: true,
//     reduceAnimations: false,
//   },
//   privacySettings: {
//     profileVisibility: 'escrow_only',
//     showEarnings: false,
//     showRealName: true,
//   },
// };

// // Time zone options
// const timeZones = [
//   { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
//   { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
//   { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
//   { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
//   { value: 'Europe/London', label: 'London' },
//   { value: 'Europe/Paris', label: 'Paris' },
//   { value: 'Asia/Tokyo', label: 'Tokyo' },
//   { value: 'Asia/Shanghai', label: 'Shanghai' },
//   { value: 'Australia/Sydney', label: 'Sydney' },
// ];

// // Language options
// const languages = [
//   { value: 'en', label: 'English' },
//   { value: 'es', label: 'Spanish' },
//   { value: 'fr', label: 'French' },
//   { value: 'de', label: 'German' },
//   { value: 'ja', label: 'Japanese' },
//   { value: 'zh', label: 'Chinese' },
// ];

// // Currency options
// const currencies = [
//   { value: 'USDT', label: 'USDT' },
//   { value: 'USDC', label: 'USDC' },
//   { value: 'DOT', label: 'DOT' },
//   { value: 'KSM', label: 'KSM' },
// ];

// const Settings = () => {
//   // Use color mode hook
//   const { colorMode, toggleColorMode } = useColorMode();
//   const toast = useToast();
  
//   // Wallet connection
//   const { selectedAccount, isExtensionReady } = useWallet();
  
//   // States
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [profile, setProfile] = useState<UserProfile | null>(null);
//   const [showPassword, setShowPassword] = useState(false);
//   const [currentPassword, setCurrentPassword] = useState('');
//   const [newPassword, setNewPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [avatarFile, setAvatarFile] = useState<File | null>(null);
//   const [isEditing, setIsEditing] = useState<boolean>(false);
  
//   // Modal disclosures
//   const securityModal = useDisclosure();
//   const logoutModal = useDisclosure();
  
//   // Color mode values
//   const cardBg = useColorModeValue('white', 'gray.700');
//   const borderColor = useColorModeValue('gray.200', 'gray.600');
//   const highlightColor = useColorModeValue('blue.50', 'blue.900');
  
//   // Fetch user profile
//   useEffect(() => {
//     const fetchUserProfile = async () => {
//       setIsLoading(true);
//       setError(null);
      
//       try {
//         // In a real app, we would fetch this from the API
//         // For this example, we'll use mock data with a slight delay
//         setTimeout(() => {
//           setProfile(mockUserProfile);
//           setIsLoading(false);
//         }, 1000);
//       } catch (err) {
//         console.error('Error fetching user profile:', err);
//         setError('Failed to load user profile. Please try again later.');
//         setIsLoading(false);
//       }
//     };
    
//     fetchUserProfile();
//   }, []);
  
//   // Handle profile update
//   const handleUpdateProfile = () => {
//     if (!profile) return;
    
//     setIsLoading(true);
    
//     // In a real app, we would send this data to the API
//     // For this example, we'll use a timeout to simulate an API call
//     setTimeout(() => {
//       setIsLoading(false);
//       setIsEditing(false);
      
//       toast({
//         title: 'Profile updated',
//         description: 'Your profile has been successfully updated.',
//         status: 'success',
//         duration: 5000,
//         isClosable: true,
//       });
//     }, 1000);
//   };
  
//   // Handle password update
//   const handleUpdatePassword = () => {
//     if (newPassword !== confirmPassword) {
//       toast({
//         title: 'Passwords do not match',
//         description: 'Please ensure your new password and confirmation match.',
//         status: 'error',
//         duration: 5000,
//         isClosable: true,
//       });
//       return;
//     }
    
//     // In a real app, we would send this data to the API
//     setTimeout(() => {
//       setCurrentPassword('');
//       setNewPassword('');
//       setConfirmPassword('');
//       securityModal.onClose();
      
//       toast({
//         title: 'Password updated',
//         description: 'Your password has been successfully updated.',
//         status: 'success',
//         duration: 5000,
//         isClosable: true,
//       });
//     }, 1000);
//   };
  
//   // Handle 2FA toggle
//   const handleToggle2FA = () => {
//     if (!profile) return;
    
//     setProfile(prev => {
//       if (!prev) return prev;
//       return {
//         ...prev,
//         twoFactorEnabled: !prev.twoFactorEnabled
//       };
//     });
    
//     toast({
//       title: profile.twoFactorEnabled ? '2FA Disabled' : '2FA Enabled',
//       description: profile.twoFactorEnabled 
//         ? 'Two-factor authentication has been disabled.' 
//         : 'Two-factor authentication has been enabled.',
//       status: 'info',
//       duration: 5000,
//       isClosable: true,
//     });
//   };
  
//   // Handle avatar upload
//   const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
//     if (event.target.files && event.target.files.length > 0) {
//       setAvatarFile(event.target.files[0]);
      
//       // In a real app, we would upload the file to a server
//       // For this example, we'll use a timeout to simulate an upload
//       setTimeout(() => {
//         setProfile(prev => {
//           if (!prev) return prev;
//           return {
//             ...prev,
//             avatarUrl: URL.createObjectURL(event.target.files![0])
//           };
//         });
        
//         toast({
//           title: 'Avatar updated',
//           description: 'Your avatar has been successfully updated.',
//           status: 'success',
//           duration: 5000,
//           isClosable: true,
//         });
//       }, 1000);
//     }
//   };
  
//   // Handle theme change
//   const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
//     if (!profile) return;
    
//     // Update profile setting
//     setProfile(prev => {
//       if (!prev) return prev;
//       return {
//         ...prev,
//         displaySettings: {
//           ...prev.displaySettings,
//           theme
//         }
//       };
//     });
    
//     // Apply theme change
//     if (theme === 'light') {
//       if (colorMode !== 'light') toggleColorMode();
//     } else if (theme === 'dark') {
//       if (colorMode !== 'dark') toggleColorMode();
//     } else {
//       // For 'system', we would ideally check the system preference
//       // For simplicity, we'll just toggle to match light/dark mode
//       const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
//       if (prefersDark && colorMode !== 'dark') toggleColorMode();
//       if (!prefersDark && colorMode !== 'light') toggleColorMode();
//     }
    
//     toast({
//       title: 'Theme updated',
//       description: `Your theme has been set to ${theme}.`,
//       status: 'success',
//       duration: 3000,
//       isClosable: true,
//     });
//   };
  
//   // Handle notification setting change
//   const handleNotificationChange = (setting: keyof UserProfile['notificationSettings']) => {
//     if (!profile) return;
    
//     setProfile(prev => {
//       if (!prev) return prev;
//       return {
//         ...prev,
//         notificationSettings: {
//           ...prev.notificationSettings,
//           [setting]: !prev.notificationSettings[setting]
//         }
//       };
//     });
//   };
  
//   // Handle privacy setting change
//   const handlePrivacyChange = (setting: keyof UserProfile['privacySettings'], value: any) => {
//     if (!profile) return;
    
//     setProfile(prev => {
//       if (!prev) return prev;
//       return {
//         ...prev,
//         privacySettings: {
//           ...prev.privacySettings,
//           [setting]: value
//         }
//       };
//     });
//   };
  
//   // Handle logout
//   const handleLogout = () => {
//     toast({
//       title: 'Logout',
//       description: 'Please disconnect your wallet from the wallet UI.',
//       status: 'info',
//       duration: 5000,
//       isClosable: true,
//     });
//     logoutModal.onClose();
//   };
  
//   // Display loading state
//   if (isLoading && !profile) {
//     return (
//       <Box textAlign="center" py={10}>
//         <Spinner size="xl" />
//         <Text mt={4}>Loading user settings...</Text>
//       </Box>
//     );
//   }
  
//   // Display error state
//   if (error) {
//     return (
//       <Box>
//         <Heading size="lg" mb={4}>Settings</Heading>
//         <Alert status="error" borderRadius="md">
//           <AlertIcon />
//           <AlertTitle mr={2}>Error!</AlertTitle>
//           <AlertDescription>{error}</AlertDescription>
//         </Alert>
//       </Box>
//     );
//   }
  
//   return (
//     <Box>
//       <Box mb={6}>
//         <Flex justifyContent="space-between" alignItems="center">
//           <Heading size="lg">Settings</Heading>
//           <HStack spacing={2}>
//             <Button 
//               leftIcon={isEditing ? <FiSave /> : <FiEdit />} 
//               colorScheme={isEditing ? "green" : "blue"}
//               onClick={() => {
//                 if (isEditing) {
//                   handleUpdateProfile();
//                 } else {
//                   setIsEditing(true);
//                 }
//               }}
//             >
//               {isEditing ? 'Save Changes' : 'Edit Profile'}
//             </Button>
//             <Button 
//               leftIcon={<FiLogOut />} 
//               variant="outline" 
//               colorScheme="red"
//               onClick={logoutModal.onOpen}
//             >
//               Logout
//             </Button>
//           </HStack>
//         </Flex>
//         <Text color="gray.500">Manage your account settings and preferences</Text>
//       </Box>
      
//       {profile && (
//         <Tabs variant="enclosed" colorScheme="blue" isLazy>
//           <TabList>
//             <Tab><HStack spacing={1}><FiUser /><Text>Profile</Text></HStack></Tab>
//             <Tab><HStack spacing={1}><FiShield /><Text>Security</Text></HStack></Tab>
//             <Tab><HStack spacing={1}><FiBell /><Text>Notifications</Text></HStack></Tab>
//             <Tab><HStack spacing={1}><FiDollarSign /><Text>Payment</Text></HStack></Tab>
//             <Tab><HStack spacing={1}><FiGlobe /><Text>Preferences</Text></HStack></Tab>
//           </TabList>
          
//           <TabPanels>
//             {/* Profile Tab */}
//             <TabPanel px={0}>
//               <Card variant="outline" bg={cardBg}>
//                 <CardHeader pb={0}>
//                   <HStack spacing={4}>
//                     <Box position="relative">
//                       <Avatar 
//                         size="xl" 
//                         name={profile.name} 
//                         src={profile.avatarUrl || ''}
//                       >
//                         <AvatarBadge boxSize="1.25em" bg="green.500" />
//                       </Avatar>
//                       {isEditing && (
//                         <Box 
//                           position="absolute" 
//                           bottom="0" 
//                           right="0"
//                           borderRadius="full"
//                           overflow="hidden"
//                         >
//                           <IconButton
//                             aria-label="Upload avatar"
//                             icon={<FiUpload />}
//                             colorScheme="blue"
//                             size="sm"
//                             onClick={() => document.getElementById('avatar-upload')?.click()}
//                           />
//                           <Input
//                             id="avatar-upload"
//                             type="file"
//                             accept="image/*"
//                             display="none"
//                             onChange={handleAvatarUpload}
//                           />
//                         </Box>
//                       )}
//                     </Box>
//                     <VStack align="start" spacing={1}>
//                       <Heading size="md">{profile.name}</Heading>
//                       <HStack>
//                         <Text color="gray.500">@{profile.username}</Text>
//                         <Badge colorScheme="blue">Verified</Badge>
//                       </HStack>
//                       {selectedAccount && (
//                         <Text fontSize="sm" color="gray.500">
//                           Address: {selectedAccount.address.substring(0, 12)}...{selectedAccount.address.substring(selectedAccount.address.length - 8)}
//                         </Text>
//                       )}
//                     </VStack>
//                   </HStack>
//                 </CardHeader>
//                 <CardBody>
//                   <VStack spacing={5} align="stretch">
//                     <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
//                       {/* Personal Information */}
//                       <GridItem>
//                         <VStack align="start" spacing={4}>
//                           <Heading size="sm">Personal Information</Heading>
                          
//                           <FormControl>
//                             <FormLabel>Full Name</FormLabel>
//                             <Input 
//                               value={profile.name} 
//                               isReadOnly={!isEditing}
//                               onChange={(e) => setProfile({...profile, name: e.target.value})}
//                             />
//                           </FormControl>
                          
//                           <FormControl>
//                             <FormLabel>Username</FormLabel>
//                             <Input 
//                               value={profile.username} 
//                               isReadOnly={!isEditing}
//                               onChange={(e) => setProfile({...profile, username: e.target.value})}
//                             />
//                           </FormControl>
                          
//                           <FormControl>
//                             <FormLabel>Email Address</FormLabel>
//                             <Input 
//                               value={profile.email} 
//                               isReadOnly={!isEditing}
//                               onChange={(e) => setProfile({...profile, email: e.target.value})}
//                             />
//                           </FormControl>
                          
//                           <FormControl>
//                             <FormLabel>Bio</FormLabel>
//                             <Input 
//                               value={profile.bio} 
//                               isReadOnly={!isEditing}
//                               onChange={(e) => setProfile({...profile, bio: e.target.value})}
//                             />
//                           </FormControl>
//                         </VStack>
//                       </GridItem>
                      
//                       {/* Contact Information */}
//                       <GridItem>
//                         <VStack align="start" spacing={4}>
//                           <Heading size="sm">Contact Information</Heading>
                          
//                           <FormControl>
//                             <FormLabel>Location</FormLabel>
//                             <Input 
//                               value={profile.location} 
//                               isReadOnly={!isEditing}
//                               onChange={(e) => setProfile({...profile, location: e.target.value})}
//                             />
//                           </FormControl>
                          
//                           <FormControl>
//                             <FormLabel>Phone Number</FormLabel>
//                             <Input 
//                               value={profile.phone || ''} 
//                               isReadOnly={!isEditing}
//                               onChange={(e) => setProfile({...profile, phone: e.target.value})}
//                             />
//                           </FormControl>
                          
//                           <FormControl>
//                             <FormLabel>Website</FormLabel>
//                             <Input 
//                               value={profile.website || ''} 
//                               isReadOnly={!isEditing}
//                               onChange={(e) => setProfile({...profile, website: e.target.value})}
//                             />
//                           </FormControl>
                          
//                           <FormControl>
//                             <FormLabel>Company</FormLabel>
//                             <Input 
//                               value={profile.company || ''} 
//                               isReadOnly={!isEditing}
//                               onChange={(e) => setProfile({...profile, company: e.target.value})}
//                             />
//                           </FormControl>
//                         </VStack>
//                       </GridItem>
//                     </Grid>
                    
//                     <Divider />
                    
//                     {/* Localization */}
//                     <VStack align="start" spacing={4}>
//                       <Heading size="sm">Localization</Heading>
                      
//                       <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6} width="100%">
//                         <GridItem>
//                           <FormControl>
//                             <FormLabel>Language</FormLabel>
//                             <Select 
//                               value={profile.language} 
//                               isDisabled={!isEditing}
//                               onChange={(e) => setProfile({...profile, language: e.target.value})}
//                             >
//                               {languages.map(lang => (
//                                 <option key={lang.value} value={lang.value}>{lang.label}</option>
//                               ))}
//                             </Select>
//                           </FormControl>
//                         </GridItem>
                        
//                         <GridItem>
//                           <FormControl>
//                             <FormLabel>Time Zone</FormLabel>
//                             <Select 
//                               value={profile.timeZone} 
//                               isDisabled={!isEditing}
//                               onChange={(e) => setProfile({...profile, timeZone: e.target.value})}
//                             >
//                               {timeZones.map(tz => (
//                                 <option key={tz.value} value={tz.value}>{tz.label}</option>
//                               ))}
//                             </Select>
//                           </FormControl>
//                         </GridItem>
//                       </Grid>
//                     </VStack>
//                   </VStack>
//                 </CardBody>
//               </Card>
//             </TabPanel>
            
//             {/* Security Tab */}
//             <TabPanel px={0}>
//               <Card variant="outline" bg={cardBg}>
//                 <CardBody>
//                   <VStack spacing={6} align="stretch">
//                     {/* Password Management */}
//                     <Box>
//                       <Heading size="sm" mb={4}>Password & Authentication</Heading>
                      
//                       <HStack justifyContent="space-between" bg={highlightColor} p={4} borderRadius="md">
//                         <VStack align="start" spacing={1}>
//                           <Text fontWeight="medium">Password</Text>
//                           <Text fontSize="sm" color="gray.500">Last changed 30 days ago</Text>
//                         </VStack>
//                         <Button 
//                           colorScheme="blue" 
//                           size="sm"
//                           onClick={securityModal.onOpen}
//                         >
//                           Change
//                         </Button>
//                       </HStack>
                      
//                       <HStack justifyContent="space-between" mt={4} p={4} borderRadius="md">
//                         <VStack align="start" spacing={1}>
//                           <Text fontWeight="medium">Two-Factor Authentication</Text>
//                           <Text fontSize="sm" color="gray.500">
//                             {profile.twoFactorEnabled 
//                               ? 'Enabled - adds an extra layer of security to your account' 
//                               : 'Disabled - enable for additional security'}
//                           </Text>
//                         </VStack>
//                         <Switch 
//                           colorScheme="blue" 
//                           isChecked={profile.twoFactorEnabled}
//                           onChange={handleToggle2FA}
//                         />
//                       </HStack>
//                     </Box>
                    
//                     <Divider />
                    
//                     {/* Login Sessions */}
//                     <Box>
//                       <Heading size="sm" mb={4}>Active Sessions</Heading>
                      
//                       <VStack spacing={3} align="stretch">
//                         <HStack justifyContent="space-between" p={3} borderWidth="1px" borderRadius="md">
//                           <VStack align="start" spacing={0}>
//                             <Text fontWeight="medium">Current Session</Text>
//                             <Text fontSize="sm">MacOS - Chrome - San Francisco, CA</Text>
//                             <Text fontSize="xs" color="gray.500">Started 2 hours ago</Text>
//                           </VStack>
//                           <Badge colorScheme="green">Active</Badge>
//                         </HStack>
                        
//                         <HStack justifyContent="space-between" p={3} borderWidth="1px" borderRadius="md">
//                           <VStack align="start" spacing={0}>
//                             <Text fontWeight="medium">Mobile App</Text>
//                             <Text fontSize="sm">iOS - iPhone 13 - San Francisco, CA</Text>
//                             <Text fontSize="xs" color="gray.500">Last active 2 days ago</Text>
//                           </VStack>
//                           <Button size="xs" colorScheme="red" variant="outline">Revoke</Button>
//                         </HStack>
//                       </VStack>
//                     </Box>
                    
//                     <Divider />
                    
//                     {/* Connected Accounts */}
//                     <Box>
//                       <Heading size="sm" mb={4}>Connected Accounts</Heading>
                      
//                       <HStack justifyContent="space-between" p={4} borderWidth="1px" borderRadius="md">
//                         <VStack align="start" spacing={1}>
//                           <Text fontWeight="medium">Polkadot Extension</Text>
//                           <Text fontSize="sm" color="gray.500">
//                             {selectedAccount 
//                               ? `Connected to ${selectedAccount.address.substring(0, 8)}...${selectedAccount.address.substring(selectedAccount.address.length - 8)}` 
//                               : 'Not connected'}
//                           </Text>
//                         </VStack>
//                         {selectedAccount ? (
//                           <Badge colorScheme="green">Connected</Badge>
//                         ) : (
//                           <Button size="sm" colorScheme="blue">Connect</Button>
//                         )}
//                       </HStack>
//                     </Box>
//                   </VStack>
//                 </CardBody>
//               </Card>
//             </TabPanel>
            
//             {/* Notifications Tab */}
//             <TabPanel px={0}>
//               <Card variant="outline" bg={cardBg}>
//                 <CardBody>
//                   <VStack spacing={6} align="stretch">
//                     {/* Notification Channels */}
//                     <Box>
//                       <Heading size="sm" mb={4}>Notification Channels</Heading>
                      
//                       <HStack justifyContent="space-between" p={4} borderWidth="1px" borderRadius="md">
//                         <VStack align="start" spacing={1}>
//                           <Text fontWeight="medium">Email Notifications</Text>
//                           <Text fontSize="sm" color="gray.500">Receive notifications via email</Text>
//                         </VStack>
//                         <Switch 
//                           colorScheme="blue" 
//                           isChecked={profile.notificationSettings.email}
//                           onChange={() => handleNotificationChange('email')}
//                         />
//                       </HStack>
                      
//                       <HStack justifyContent="space-between" mt={3} p={4} borderWidth="1px" borderRadius="md">
//                         <VStack align="start" spacing={1}>
//                           <Text fontWeight="medium">Browser Notifications</Text>
//                           <Text fontSize="sm" color="gray.500">Receive notifications in your browser</Text>
//                         </VStack>
//                         <Switch 
//                           colorScheme="blue" 
//                           isChecked={profile.notificationSettings.browser}
//                           onChange={() => handleNotificationChange('browser')}
//                         />
//                       </HStack>
//                     </Box>
                    
//                     <Divider />
                    
//                     {/* Notification Types */}
//                     <Box>
//                       <Heading size="sm" mb={4}>Notification Types</Heading>
                      
//                       <VStack spacing={3} align="stretch">
//                         <HStack justifyContent="space-between" p={3} borderWidth="1px" borderRadius="md">
//                           <VStack align="start" spacing={0}>
//                             <Text fontWeight="medium">Escrow Updates</Text>
//                             <Text fontSize="sm">Notifications about escrow creation, changes, and completion</Text>
//                           </VStack>
//                           <Switch 
//                             colorScheme="blue" 
//                             isChecked={profile.notificationSettings.escrowUpdates}
//                             onChange={() => handleNotificationChange('escrowUpdates')}
//                           />
//                         </HStack>
                        
//                         <HStack justifyContent="space-between" p={3} borderWidth="1px" borderRadius="md">
//                           <VStack align="start" spacing={0}>
//                             <Text fontWeight="medium">Milestone Updates</Text>
//                             <Text fontSize="sm">Notifications about milestone deadlines and completions</Text>
//                           </VStack>
//                           <Switch 
//                             colorScheme="blue" 
//                             isChecked={profile.notificationSettings.milestoneUpdates}
//                             onChange={() => handleNotificationChange('milestoneUpdates')}
//                           />
//                         </HStack>
                        
//                         <HStack justifyContent="space-between" p={3} borderWidth="1px" borderRadius="md">
//                           <VStack align="start" spacing={0}>
//                             <Text fontWeight="medium">Dispute Updates</Text>
//                             <Text fontSize="sm">Notifications about disputes and resolutions</Text>
//                           </VStack>
//                           <Switch 
//                             colorScheme="blue" 
//                             isChecked={profile.notificationSettings.disputeUpdates}
//                             onChange={() => handleNotificationChange('disputeUpdates')}
//                           />
//                         </HStack>
                        
//                         <HStack justifyContent="space-between" p={3} borderWidth="1px" borderRadius="md">
//                           <VStack align="start" spacing={0}>
//                             <Text fontWeight="medium">Marketing Updates</Text>
//                             <Text fontSize="sm">Notifications about new features and platform updates</Text>
//                           </VStack>
//                           <Switch 
//                             colorScheme="blue" 
//                             isChecked={profile.notificationSettings.marketingUpdates}
//                             onChange={() => handleNotificationChange('marketingUpdates')}
//                           />
//                         </HStack>
//                       </VStack>
//                     </Box>
//                   </VStack>
//                 </CardBody>
//               </Card>
//             </TabPanel>
            
//             {/* Payment Tab */}
//             <TabPanel px={0}>
//               <Card variant="outline" bg={cardBg}>
//                 <CardBody>
//                   <VStack spacing={6} align="stretch">
//                     {/* Payment Settings */}
//                     <Box>
//                       <Heading size="sm" mb={4}>Payment Settings</Heading>
                      
//                       <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
//                         <GridItem>
//                           <FormControl>
//                             <FormLabel>Default Currency</FormLabel>
//                             <Select 
//                               value={profile.paymentSettings.defaultCurrency} 
//                               isDisabled={!isEditing}
//                               onChange={(e) => setProfile({
//                                 ...profile, 
//                                 paymentSettings: {
//                                   ...profile.paymentSettings,
//                                   defaultCurrency: e.target.value
//                                 }
//                               })}
//                             >
//                               {currencies.map(currency => (
//                                 <option key={currency.value} value={currency.value}>{currency.label}</option>
//                               ))}
//                             </Select>
//                             <FormHelperText>The default currency for your escrows</FormHelperText>
//                           </FormControl>
//                         </GridItem>
                        
//                         <GridItem>
//                           <FormControl>
//                             <FormLabel>Default Fee Strategy</FormLabel>
//                             <Select 
//                               value={profile.paymentSettings.defaultFeeStrategy} 
//                               isDisabled={!isEditing}
//                               onChange={(e) => setProfile({
//                                 ...profile, 
//                                 paymentSettings: {
//                                   ...profile.paymentSettings,
//                                   defaultFeeStrategy: e.target.value as any
//                                 }
//                               })}
//                             >
//                               <option value="client">Paid by Client</option>
//                               <option value="worker">Paid by Worker</option>
//                               <option value="split">Split Between Parties</option>
//                             </Select>
//                             <FormHelperText>How platform fees are handled by default</FormHelperText>
//                           </FormControl>
//                         </GridItem>
//                       </Grid>
                      
//                       <HStack justifyContent="space-between" mt={4} p={4} borderWidth="1px" borderRadius="md">
//                         <VStack align="start" spacing={1}>
//                           <Text fontWeight="medium">Auto-Release Funds</Text>
//                           <Text fontSize="sm" color="gray.500">
//                             Automatically release funds when milestones are marked as complete
//                           </Text>
//                         </VStack>
//                         <Switch 
//                           colorScheme="blue" 
//                           isChecked={profile.paymentSettings.autoReleaseFunds}
//                           isDisabled={!isEditing}
//                           onChange={() => setProfile({
//                             ...profile,
//                             paymentSettings: {
//                               ...profile.paymentSettings,
//                               autoReleaseFunds: !profile.paymentSettings.autoReleaseFunds
//                             }
//                           })}
//                         />
//                       </HStack>
//                     </Box>
                    
//                     <Divider />
                    
//                     {/* Transaction History */}
//                     <Box>
//                       <Heading size="sm" mb={4}>Transaction History</Heading>
                      
//                       <HStack justifyContent="space-between" mb={3}>
//                         <Text color="gray.500">Recent transactions</Text>
//                         <Button size="sm" colorScheme="blue" variant="link">View All</Button>
//                       </HStack>
                      
//                       <VStack spacing={3} align="stretch">
//                         <HStack justifyContent="space-between" p={3} borderWidth="1px" borderRadius="md">
//                           <VStack align="start" spacing={0}>
//                             <Text fontWeight="medium">Logo Design Project</Text>
//                             <Text fontSize="sm">Milestone 2 Payment</Text>
//                             <Text fontSize="xs" color="gray.500">March 15, 2023</Text>
//                           </VStack>
//                           <Text fontWeight="bold" color="green.500">+250 USDT</Text>
//                         </HStack>
                        
//                         <HStack justifyContent="space-between" p={3} borderWidth="1px" borderRadius="md">
//                           <VStack align="start" spacing={0}>
//                             <Text fontWeight="medium">Website Redesign</Text>
//                             <Text fontSize="sm">Milestone 1 Payment</Text>
//                             <Text fontSize="xs" color="gray.500">February 28, 2023</Text>
//                           </VStack>
//                           <Text fontWeight="bold" color="green.500">+500 USDT</Text>
//                         </HStack>
                        
//                         <HStack justifyContent="space-between" p={3} borderWidth="1px" borderRadius="md">
//                           <VStack align="start" spacing={0}>
//                             <Text fontWeight="medium">Platform Fee</Text>
//                             <Text fontSize="sm">Escrow #1234</Text>
//                             <Text fontSize="xs" color="gray.500">February 28, 2023</Text>
//                           </VStack>
//                           <Text fontWeight="bold" color="red.500">-5 USDT</Text>
//                         </HStack>
//                       </VStack>
//                     </Box>
//                   </VStack>
//                 </CardBody>
//               </Card>
//             </TabPanel>
            
//             {/* Preferences Tab */}
//             <TabPanel px={0}>
//               <Card variant="outline" bg={cardBg}>
//                 <CardBody>
//                   <VStack spacing={6} align="stretch">
//                     {/* Display Settings */}
//                     <Box>
//                       <Heading size="sm" mb={4}>Display Settings</Heading>
                      
//                       <VStack spacing={4} align="stretch">
//                         <HStack justifyContent="space-between" p={4} borderWidth="1px" borderRadius="md">
//                           <VStack align="start" spacing={1}>
//                             <Text fontWeight="medium">Theme</Text>
//                             <Text fontSize="sm" color="gray.500">
//                               Choose between light, dark, or system theme
//                             </Text>
//                           </VStack>
//                           <HStack spacing={2}>
//                             <IconButton
//                               aria-label="Light Mode"
//                               icon={<FiSun />}
//                               colorScheme={profile.displaySettings.theme === 'light' ? 'yellow' : 'gray'}
//                               variant={profile.displaySettings.theme === 'light' ? 'solid' : 'outline'}
//                               onClick={() => handleThemeChange('light')}
//                             />
//                             <IconButton
//                               aria-label="Dark Mode"
//                               icon={<FiMoon />}
//                               colorScheme={profile.displaySettings.theme === 'dark' ? 'purple' : 'gray'}
//                               variant={profile.displaySettings.theme === 'dark' ? 'solid' : 'outline'}
//                               onClick={() => handleThemeChange('dark')}
//                             />
//                             <Button
//                               size="sm"
//                               colorScheme={profile.displaySettings.theme === 'system' ? 'blue' : 'gray'}
//                               variant={profile.displaySettings.theme === 'system' ? 'solid' : 'outline'}
//                               onClick={() => handleThemeChange('system')}
//                             >
//                               System
//                             </Button>
//                           </HStack>
//                         </HStack>
                        
//                         <HStack justifyContent="space-between" p={4} borderWidth="1px" borderRadius="md">
//                           <VStack align="start" spacing={1}>
//                             <Text fontWeight="medium">Compact View</Text>
//                             <Text fontSize="sm" color="gray.500">
//                               Use compact layout to show more content on screen
//                             </Text>
//                           </VStack>
//                           <Switch 
//                             colorScheme="blue" 
//                             isChecked={profile.displaySettings.compactView}
//                             onChange={() => setProfile({
//                               ...profile,
//                               displaySettings: {
//                                 ...profile.displaySettings,
//                                 compactView: !profile.displaySettings.compactView
//                               }
//                             })}
//                           />
//                         </HStack>
                        
//                         <HStack justifyContent="space-between" p={4} borderWidth="1px" borderRadius="md">
//                           <VStack align="start" spacing={1}>
//                             <Text fontWeight="medium">Reduce Animations</Text>
//                             <Text fontSize="sm" color="gray.500">
//                               Minimize motion for a more static experience
//                             </Text>
//                           </VStack>
//                           <Switch 
//                             colorScheme="blue" 
//                             isChecked={profile.displaySettings.reduceAnimations}
//                             onChange={() => setProfile({
//                               ...profile,
//                               displaySettings: {
//                                 ...profile.displaySettings,
//                                 reduceAnimations: !profile.displaySettings.reduceAnimations
//                               }
//                             })}
//                           />
//                         </HStack>
//                       </VStack>
//                     </Box>
                    
//                     <Divider />
                    
//                     {/* Privacy Settings */}
//                     <Box>
//                       <Heading size="sm" mb={4}>Privacy Settings</Heading>
                      
//                       <VStack spacing={4} align="stretch">
//                         <FormControl>
//                           <FormLabel>Profile Visibility</FormLabel>
//                           <Select
//                             value={profile.privacySettings.profileVisibility}
//                             onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
//                           >
//                             <option value="public">Public - Visible to everyone</option>
//                             <option value="escrow_only">Escrow Only - Visible only to escrow partners</option>
//                             <option value="private">Private - Minimal visibility</option>
//                           </Select>
//                           <FormHelperText>Control who can see your profile information</FormHelperText>
//                         </FormControl>
                        
//                         <HStack justifyContent="space-between" p={4} borderWidth="1px" borderRadius="md">
//                           <VStack align="start" spacing={1}>
//                             <Text fontWeight="medium">Show Earnings</Text>
//                             <Text fontSize="sm" color="gray.500">
//                               Display your earnings on your public profile
//                             </Text>
//                           </VStack>
//                           <Switch 
//                             colorScheme="blue" 
//                             isChecked={profile.privacySettings.showEarnings}
//                             onChange={() => handlePrivacyChange('showEarnings', !profile.privacySettings.showEarnings)}
//                           />
//                         </HStack>
                        
//                         <HStack justifyContent="space-between" p={4} borderWidth="1px" borderRadius="md">
//                           <VStack align="start" spacing={1}>
//                             <Text fontWeight="medium">Show Real Name</Text>
//                             <Text fontSize="sm" color="gray.500">
//                               Display your real name instead of username
//                             </Text>
//                           </VStack>
//                           <Switch 
//                             colorScheme="blue" 
//                             isChecked={profile.privacySettings.showRealName}
//                             onChange={() => handlePrivacyChange('showRealName', !profile.privacySettings.showRealName)}
//                           />
//                         </HStack>
//                       </VStack>
//                     </Box>
//                   </VStack>
//                 </CardBody>
//               </Card>
//             </TabPanel>
//           </TabPanels>
//         </Tabs>
//       )}
      
//       {/* Change Password Modal */}
//       <Modal isOpen={securityModal.isOpen} onClose={securityModal.onClose}>
//         <ModalOverlay />
//         <ModalContent>
//           <ModalHeader>Change Password</ModalHeader>
//           <ModalCloseButton />
//           <ModalBody>
//             <VStack spacing={4}>
//               <FormControl isRequired>
//                 <FormLabel>Current Password</FormLabel>
//                 <InputGroup>
//                   <Input
//                     type={showPassword ? 'text' : 'password'}
//                     value={currentPassword}
//                     onChange={(e) => setCurrentPassword(e.target.value)}
//                   />
//                   <InputRightElement width="4.5rem">
//                     <IconButton
//                       h="1.75rem"
//                       size="sm"
//                       aria-label={showPassword ? 'Hide password' : 'Show password'}
//                       icon={showPassword ? <FiEyeOff /> : <FiEye />}
//                       onClick={() => setShowPassword(!showPassword)}
//                     />
//                   </InputRightElement>
//                 </InputGroup>
//               </FormControl>
              
//               <FormControl isRequired>
//                 <FormLabel>New Password</FormLabel>
//                 <Input
//                   type="password"
//                   value={newPassword}
//                   onChange={(e) => setNewPassword(e.target.value)}
//                 />
//                 <FormHelperText>
//                   Password must be at least 8 characters and include a mix of letters, numbers, and symbols
//                 </FormHelperText>
//               </FormControl>
              
//               <FormControl isRequired>
//                 <FormLabel>Confirm New Password</FormLabel>
//                 <Input
//                   type="password"
//                   value={confirmPassword}
//                   onChange={(e) => setConfirmPassword(e.target.value)}
//                 />
//               </FormControl>
//             </VStack>
//           </ModalBody>
//           <ModalFooter>
//             <Button variant="outline" mr={3} onClick={securityModal.onClose}>
//               Cancel
//             </Button>
//             <Button 
//               colorScheme="blue" 
//               onClick={handleUpdatePassword}
//               isDisabled={!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
//             >
//               Update Password
//             </Button>
//           </ModalFooter>
//         </ModalContent>
//       </Modal>
      
//       {/* Logout Confirmation Modal */}
//       <Modal isOpen={logoutModal.isOpen} onClose={logoutModal.onClose}>
//         <ModalOverlay />
//         <ModalContent>
//           <ModalHeader>Confirm Logout</ModalHeader>
//           <ModalCloseButton />
//           <ModalBody>
//             <Text>Are you sure you want to log out? You will need to reconnect your wallet to access your account again.</Text>
//           </ModalBody>
//           <ModalFooter>
//             <Button variant="outline" mr={3} onClick={logoutModal.onClose}>
//               Cancel
//             </Button>
//             <Button colorScheme="red" onClick={handleLogout}>
//               Logout
//             </Button>
//           </ModalFooter>
//         </ModalContent>
//       </Modal>
//     </Box>
//   );
// };

// export default Settings; 