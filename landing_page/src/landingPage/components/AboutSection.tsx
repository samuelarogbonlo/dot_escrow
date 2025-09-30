import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Flex,
  Icon,
  VStack,
} from "@chakra-ui/react";

const AboutSection = () => {
  return (
    <Box id="about" bg="white" py={20} px={{ base: 4, sm: 6, lg: 8 }}>
      <Container maxW="7xl">
        <VStack spacing={12} align="stretch">
          {/* Section Header */}
          <Box textAlign="center" maxW="3xl" mx="auto">
            <Heading
              as="h2"
              size="2xl"
              bgGradient="linear(to-r, purple.500, blue.500)"
              bgClip="text"
              fontWeight="extrabold"
              mb={6}
            >
              About Us
            </Heading>
            <Text fontSize="xl" color="gray.600" lineHeight="tall">
              dotEscrow is a decentralized application (DApp) designed to bring
              stable, trust-minimized escrow services to the Polkadot ecosystem.
            </Text>
          </Box>

          {/* Main Content Grid */}
          <SimpleGrid
            columns={{ base: 1, lg: 2 }}
            spacing={12}
            alignItems="center"
          >
            {/* Left Side - Image/Visual */}
            <Flex
              bg="gradient-to-br"
              bgGradient="linear(to-br, blue.500, purple.600)"
              borderRadius="2xl"
              p={12}
              minH="400px"
              align="center"
              justify="center"
              position="relative"
              overflow="hidden"
            >
              <VStack spacing={6} color="white" textAlign="center">
                <Icon viewBox="0 0 24 24" w={20} h={20}>
                  <path
                    fill="currentColor"
                    d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-4 0-7-3-7-7V8.3l7-3.11 7 3.11V13c0 4-3 7-7 7z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"
                  />
                </Icon>
                <Text fontSize="2xl" fontWeight="bold">
                  Trust-Minimized
                </Text>
                <Text fontSize="lg">Smart Contracts on Polkadot</Text>
              </VStack>
            </Flex>

            {/* Right Side - Content */}
            <VStack spacing={6} align="start">
              <Box>
                <Heading as="h3" size="lg" mb={4} color="blue.600">
                  Who We Serve
                </Heading>
                <Text fontSize="lg" color="gray.700" lineHeight="tall">
                  Freelancers, consultants, and small businesses can securely
                  lock funds in USDT stablecoins, mitigating cryptocurrency
                  volatility concerns while removing dependence on centralized
                  intermediaries.
                </Text>
              </Box>

              <Box>
                <Heading as="h3" size="lg" mb={4} color="blue.600">
                  How It Works
                </Heading>
                <Text fontSize="lg" color="gray.700" lineHeight="tall">
                  The smart contract automatically releases funds to the service
                  provider when work is confirmed complete, either by mutual
                  agreement or through predefined milestone verification.
                </Text>
              </Box>

              {/* Key Features List */}
              <VStack spacing={4} align="start" pt={4}>
                <Flex align="center" gap={3}>
                  <Box w={2} h={2} bg="blue.500" borderRadius="full" />
                  <Text fontSize="md" color="gray.700">
                    Decentralized escrow on Polkadot
                  </Text>
                </Flex>
                <Flex align="center" gap={3}>
                  <Box w={2} h={2} bg="blue.500" borderRadius="full" />
                  <Text fontSize="md" color="gray.700">
                    USDT stablecoin payments
                  </Text>
                </Flex>
                <Flex align="center" gap={3}>
                  <Box w={2} h={2} bg="blue.500" borderRadius="full" />
                  <Text fontSize="md" color="gray.700">
                    Automated milestone verification
                  </Text>
                </Flex>
                <Flex align="center" gap={3}>
                  <Box w={2} h={2} bg="blue.500" borderRadius="full" />
                  <Text fontSize="md" color="gray.700">
                    Less than 1% intermediary fees
                  </Text>
                </Flex>
              </VStack>
            </VStack>
          </SimpleGrid>

          {/* Bottom Stats */}
          <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={8} pt={12}>
            <Box textAlign="center" p={6} bg="blue.50" borderRadius="xl">
              <Heading as="h4" size="2xl" color="blue.600" mb={2}>
                100%
              </Heading>
              <Text color="gray.700" fontWeight="medium">
                Decentralized
              </Text>
            </Box>
            <Box textAlign="center" p={6} bg="green.50" borderRadius="xl">
              <Heading as="h4" size="2xl" color="green.600" mb={2}>
                1%
              </Heading>
              <Text color="gray.700" fontWeight="medium">
                Platform Fees
              </Text>
            </Box>
            <Box textAlign="center" p={6} bg="purple.50" borderRadius="xl">
              <Heading as="h4" size="2xl" color="purple.600" mb={2}>
                24/7
              </Heading>
              <Text color="gray.700" fontWeight="medium">
                Smart Contract Protection
              </Text>
            </Box>
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  );
};

export default AboutSection;
