import { Box, Flex, useColorModeValue, Button, useDisclosure } from '@chakra-ui/react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../Sidebar'
import Header from '../Header'
import PolkadotWalletModal from '../Modal/PolkadotWalletModal'

const Layout = () => {
  const bgColor = useColorModeValue('white', 'gray.900');
  const { isOpen, onOpen, onClose } = useDisclosure();
// 
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

        {/* Fixed Bottom Left Button */}
        <Button
          position="fixed"
          bottom="20px"
          left="20px"
          colorScheme="pink"
          size="md"
          borderRadius="full"
          boxShadow="lg"
          zIndex="1001"
          onClick={onOpen}
          _hover={{ 
            boxShadow: "xl",
            transform: "translateY(-2px)"
          }}
          transition="all 0.2s"
        >
          🪙 Claim Tokens
        </Button>

        {/* Modal */}
        <PolkadotWalletModal isOpen={isOpen} onClose={onClose} />
      </Box>
    </Flex>
  )
}

export default Layout