import { Box, VStack, Icon, Text, Flex, useColorModeValue, Divider } from '@chakra-ui/react'
import { Link, useLocation } from 'react-router-dom'
import { FiHome, FiFileText, FiDollarSign, FiAlertCircle, FiSettings } from 'react-icons/fi'

const NavItem = ({ icon, children, to }: { icon: React.ElementType; children: React.ReactNode; to: string }) => {
  const location = useLocation()
  const isActive = location.pathname === to || 
    (to !== '/' && location.pathname.startsWith(to))
  
  const activeBg = useColorModeValue('blue.50', 'blue.900')
  const activeColor = useColorModeValue('blue.600', 'blue.200')
  const inactiveColor = useColorModeValue('gray.600', 'gray.400')
  
  return (
    <Link to={to}>
      <Flex
        align="center"
        px="4"
        py="3"
        cursor="pointer"
        role="group"
        fontWeight={isActive ? "semibold" : "normal"}
        color={isActive ? activeColor : inactiveColor}
        bg={isActive ? activeBg : "transparent"}
        borderRadius="md"
        _hover={{
          bg: useColorModeValue('gray.100', 'gray.700'),
        }}
      >
        <Icon
          mr="3"
          fontSize="16"
          as={icon}
        />
        <Text fontSize="sm">{children}</Text>
      </Flex>
    </Link>
  )
}

const Sidebar = () => {
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  
  return (
    <Box
      w={{ base: 'full', md: '60' }}
      h="100vh"
      minH="full"
      bg={bgColor}
      display={{base: 'none', lg: 'block'}}
      borderRight="1px"
      borderColor={borderColor}
      position="sticky"
      top="0"
      left="0"
    >
      <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
        <Text fontSize="2xl" fontWeight="bold">.escrow</Text>
      </Flex>
      
      <VStack spacing="1" align="stretch" px="3">
        <NavItem icon={FiHome} to="/">
          Dashboard
        </NavItem>
        <NavItem icon={FiFileText} to="/escrow/create">
          Create Escrow
        </NavItem>
        <NavItem icon={FiDollarSign} to="/transactions">
          Transactions
        </NavItem>
        <NavItem icon={FiAlertCircle} to="/disputes">
          Disputes
        </NavItem>
        
        <Divider my="6" borderColor={borderColor} />
        
        <NavItem icon={FiSettings} to="/settings">
          Settings
        </NavItem>
      </VStack>
    </Box>
  )
}

export default Sidebar 