import { Box, Flex, useColorModeValue, Text, VStack, Icon, useBreakpointValue } from '@chakra-ui/react'
import { Outlet } from 'react-router-dom'
import { FiMonitor } from 'react-icons/fi'
import Sidebar from '../Sidebar'
import Header from '../Header'

const Layout = () => {
  const bgColor = useColorModeValue('white', 'gray.900');
  
  // Check if we're on mobile/tablet (anything smaller than 'lg' breakpoint)
  const isMobileOrTablet = useBreakpointValue({ base: true, md: true, lg: false });
  
  // Mobile warning component
  if (isMobileOrTablet) {
    return (
      <Flex 
        minHeight="100vh" 
        width="100%" 
        bg={bgColor}
        alignItems="center"
        justifyContent="center"
        p={6}
      >
        <VStack spacing={6} textAlign="center" maxW="400px">
          <Icon as={FiMonitor} boxSize={16} color="blue.500" />
          <VStack spacing={3}>
            <Text fontSize="xl" fontWeight="bold">
              Desktop Experience Required
            </Text>
            <Text color="gray.600" lineHeight="1.6">
              Please open this application with a browser on your laptop or desktop computer. 
              Mobile and tablet support is not ready yet.
            </Text>
          </VStack>
        </VStack>
      </Flex>
    );
  }

  return (
    <Flex minHeight="100vh" width="100%" bg={bgColor}>
      <Sidebar />
      <Box flex="1" bg={bgColor}>
        {/* Sticky Header */}
        <Box
          position="sticky"
          top="0"
          zIndex="1000"
          bg={bgColor}
          boxShadow="sm"
        >
          <Header />
        </Box>

        {/* Main Scrollable Content */}
        <Box as="main" p={4} maxW="1400px" mx="auto" overflowY="auto">
          <Outlet />
        </Box>
      </Box>
    </Flex>
  )
}

export default Layout