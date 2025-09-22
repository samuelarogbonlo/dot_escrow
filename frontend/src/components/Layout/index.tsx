import { Box, Flex, useColorModeValue } from '@chakra-ui/react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../Sidebar'
import Header from '../Header'


const Layout = () => {
  const bgColor = useColorModeValue('white', 'gray.900');

  
  
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