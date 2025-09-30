import React from 'react';
import {
  Box,
  Container,
  Text,
  VStack,
  HStack,
  Link,
  Icon,
  Divider
} from '@chakra-ui/react';

const Footer: React.FC = () => {
  return (
    <Box bg="gray.900" color="white" py={12} px={{ base: 4, sm: 6, lg: 8 }}>
      <Container maxW="7xl">
        <VStack spacing={8} align="stretch">
          {/* Main Footer Content */}
          <Box textAlign="center">
            {/* Logo/Brand */}
            <Link href="/" _hover={{ textDecoration: 'none' }}>
              <Text fontSize="3xl" fontWeight="bold" color="white" mb={4}>
                dotEscrow
              </Text>
            </Link>

            {/* Description */}
            <Text fontSize="md" color="gray.400" maxW="2xl" mx="auto" mb={6}>
              Trust-minimized escrow services on Polkadot. Secure your freelance payments with blockchain-powered smart contracts.
            </Text>

            {/* Social Links */}
            <HStack spacing={6} justify="center">
              <Link
                href="https://x.com/dotEscrow"
                isExternal
                _hover={{ color: 'blue.400', transform: 'translateY(-2px)' }}
                transition="all 0.2s"
              >
                <Icon viewBox="0 0 24 24" w={6} h={6}>
                  <path
                    fill="currentColor"
                    d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                  />
                </Icon>
              </Link>

              <Link
                href="mailto:dotescrowcontact@gmail.com"
                _hover={{ color: 'blue.400', transform: 'translateY(-2px)' }}
                transition="all 0.2s"
              >
                <Icon viewBox="0 0 24 24" w={6} h={6}>
                  <path
                    fill="currentColor"
                    d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
                  />
                </Icon>
              </Link>
            </HStack>
          </Box>

          <Divider borderColor="gray.700" />

          {/* Bottom Footer */}
          <HStack justify="space-between" flexDir={{ base: 'column', md: 'row' }} spacing={4}>
            <Text fontSize="sm" color="gray.400" textAlign={{ base: 'center', md: 'left' }}>
              © {new Date().getFullYear()} dotEscrow. All rights reserved.
            </Text>
            
          </HStack>
        </VStack>
      </Container>
    </Box>
  );
};

export default Footer;