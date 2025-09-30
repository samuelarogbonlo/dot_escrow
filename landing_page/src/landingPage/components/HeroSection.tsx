import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  Stack,
  SimpleGrid,
  Flex,
  Icon,
  Badge,
} from "@chakra-ui/react";

const HeroSection = () => {
  return (
    <Box
      bgGradient="linear(to-br, blue.50, white, purple.50)"
      py={20}
      px={{ base: 4, sm: 6, lg: 8 }}
    >
      <Container maxW="7xl">
        <Stack
          spacing={8}
          align="center"
          textAlign="center"
          maxW="4xl"
          mx="auto"
        >
          {/* Badge */}
          <Badge
            colorScheme="blue"
            px={4}
            py={2}
            borderRadius="full"
            fontSize="sm"
            display="inline-flex"
            alignItems="center"
            gap={2}
          >
            <Box
              w={2}
              h={2}
              bg="blue.500"
              borderRadius="full"
              animation="pulse 2s infinite"
            />
            Built on Polkadot
          </Badge>

          {/* Main Heading */}
          <Heading
            as="h1"
            size="3xl"
            fontSize={{ base: "4xl", sm: "5xl", lg: "6xl" }}
            fontWeight="bold"
            lineHeight="tight"
          >
            Trust-Minimized Escrow for the{" "}
            <Text
              as="span"
              bgGradient="linear(to-r, blue.600, purple.600)"
              bgClip="text"
            >
              Decentralized World
            </Text>
          </Heading>

          {/* Subheading */}
          <Text
            fontSize={{ base: "xl", sm: "2xl" }}
            color="gray.600"
            lineHeight="relaxed"
          >
            Secure your freelance payments with blockchain-powered escrow. No
            middlemen, no volatility risks, just reliable USDT transactions on
            Polkadot.
          </Text>

          {/* Description
          <Text fontSize="lg" color="gray.700" maxW="3xl" lineHeight="relaxed">
            dotEscrow brings stable, trust-minimized escrow services to
            freelancers, consultants, and small businesses. Lock funds in USDT
            stablecoins and let smart contracts automatically release payments
            when work is verified—either by mutual agreement or through
            predefined milestones.
          </Text> */}

          {/* CTA Buttons */}
          <Stack
            direction={{ base: "column", sm: "row" }}
            spacing={4}
            w={{ base: "full", sm: "auto" }}
          >
            <Button
              as="a"
              href="https://escrow-6wpm.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              colorScheme="blue"
              size="lg"
              px={8}
              py={6}
              fontSize="lg"
              fontWeight="semibold"
              shadow="lg"
              _hover={{ transform: "scale(1.05)", shadow: "xl" }}
              transition="all 0.2s"
            >
              Get Started
            </Button>
          </Stack>

          {/* Why dotEscrow Section */}
          <Box mt={20} w="full">
            <Heading as="h2" size="xl" mb={4}>
              Why dotEscrow?
            </Heading>
            <Text fontSize="lg" color="gray.600" mb={10} maxW="2xl" mx="auto">
              Built for the modern freelance economy, dotEscrow eliminates trust
              issues and payment risks with blockchain technology.
            </Text>
          </Box>

          {/* Features Grid */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} w="full">
            <Box
              bg="white"
              p={6}
              borderRadius="xl"
              shadow="md"
              _hover={{ shadow: "lg" }}
              transition="all 0.2s"
            >
              <Flex
                w={12}
                h={12}
                bg="blue.100"
                borderRadius="lg"
                align="center"
                justify="center"
                mb={4}
                mx="auto"
              >
                <Icon viewBox="0 0 24 24" w={6} h={6} color="blue.600">
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </Icon>
              </Flex>
              <Heading as="h3" size="md" mb={2}>
                Secure & Decentralized
              </Heading>
              <Text color="gray.600" fontSize="sm">
                No central authority. Your funds are protected by smart
                contracts on Polkadot.
              </Text>
            </Box>

            <Box
              bg="white"
              p={6}
              borderRadius="xl"
              shadow="md"
              _hover={{ shadow: "lg" }}
              transition="all 0.2s"
            >
              <Flex
                w={12}
                h={12}
                bg="green.100"
                borderRadius="lg"
                align="center"
                justify="center"
                mb={4}
                mx="auto"
              >
                <Icon viewBox="0 0 24 24" w={6} h={6} color="green.600">
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </Icon>
              </Flex>
              <Heading as="h3" size="md" mb={2}>
                Stable Payments
              </Heading>
              <Text color="gray.600" fontSize="sm">
                Use USDT stablecoins to eliminate cryptocurrency volatility from
                your transactions.
              </Text>
            </Box>

            <Box
              bg="white"
              p={6}
              borderRadius="xl"
              shadow="md"
              _hover={{ shadow: "lg" }}
              transition="all 0.2s"
            >
              <Flex
                w={12}
                h={12}
                bg="purple.100"
                borderRadius="lg"
                align="center"
                justify="center"
                mb={4}
                mx="auto"
              >
                <Icon viewBox="0 0 24 24" w={6} h={6} color="purple.600">
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </Icon>
              </Flex>
              <Heading as="h3" size="md" mb={2}>
                Instant Release
              </Heading>
              <Text color="gray.600" fontSize="sm">
                Automated smart contracts release funds immediately upon
                milestone completion.
              </Text>
            </Box>
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
};

export default HeroSection;
