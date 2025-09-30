import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Flex,
  Circle,
  useColorModeValue,
} from '@chakra-ui/react';

const HowItWorks = () => {
  const steps = [
    {
      number: 1,
      title: 'Create & Fund Escrow',
      description: 'Client creates the escrow based on the agreement with counterparty and deposits funds securely into the smart contract.',
      icon: '🔒',
      color: 'purple.500',
    },
    {
      number: 2,
      title: 'Notification & Start',
      description: 'Once the escrow is created, counterparty receives an in-app notification and begins working on the milestone.',
      icon: '🔔',
      color: 'blue.500',
    },
    {
      number: 3,
      title: 'Milestone Completion',
      description: 'Milestone is completed. Client reviews and releases funds. Counterparty submits verification with evidence files as proof of work.',
      icon: '✓',
      color: 'green.500',
    },
    {
      number: 4,
      title: 'Funds Released',
      description: 'Funds are instantly credited to the counterparty address upon successful verification and approval.',
      icon: '💰',
      color: 'teal.500',
    },
    {
      number: 5,
      title: 'Dispute Resolution',
      description: 'If dispute issues arise, our online customer agents attend to both parties and provide resolution in less than 72 hours.',
      icon: '⚖️',
      color: 'orange.500',
    },
  ];

  const bgGradient = useColorModeValue(
    'linear(to-br, gray.900, purple.900)',
    'linear(to-br, purple.50, blue.50)'
  );
  const cardBg = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue( 'gray.700', 'gray.200');

  return (
    <Box id="how-it-works" bgGradient={bgGradient} py={20} px={4}>
      <Container maxW="container.xl">
        <VStack spacing={4} mb={16} textAlign="center">
          <Heading
            as="h2"
            size="2xl"
            bgGradient="linear(to-r, purple.500, blue.500)"
            bgClip="text"
            fontWeight="extrabold"
          >
            How It Works
          </Heading>
          <Text fontSize="xl" color="gray.600" maxW="2xl">
            A simple, secure, and transparent process that protects both parties in every transaction
          </Text>
        </VStack>

        <VStack spacing={0} position="relative">
          {/* Timeline line */}
          <Box
            position="absolute"
            left="50%"
            top="80px"
            bottom="80px"
            w="2px"
            bgGradient="linear(to-b, purple.400, blue.400)"
            transform="translateX(-50%)"
            display={{ base: 'none', md: 'block' }}
          />

          {steps.map((step, index) => (
            <Flex
              key={step.number}
              w="100%"
              justify={index % 2 === 0 ? 'flex-start' : 'flex-end'}
              mb={12}
              position="relative"
            >
              <Box
                w={{ base: '100%', md: '45%' }}
                bg={cardBg}
                borderRadius="2xl"
                p={8}
                border="1px solid"
                borderColor={borderColor}
                boxShadow="xl"
                transition="all 0.3s"
                _hover={{
                  transform: 'translateY(-8px)',
                  boxShadow: '2xl',
                }}
              >
                <HStack spacing={4} mb={4}>
                  <Circle
                    size="60px"
                    bg={step.color}
                    color="white"
                    fontSize="2xl"
                    fontWeight="bold"
                    boxShadow="lg"
                  >
                    {step.icon}
                  </Circle>
                  <Box flex={1}>
                    <Text fontSize="sm" color="gray.500" fontWeight="semibold">
                      STEP {step.number}
                    </Text>
                    <Heading as="h3" size="md" color={step.color}>
                      {step.title}
                    </Heading>
                  </Box>
                </HStack>
                <Text color="gray.600" lineHeight="tall">
                  {step.description}
                </Text>
              </Box>

              {/* Center dot for desktop */}
              <Circle
                position="absolute"
                left="50%"
                top="30px"
                transform="translateX(-50%)"
                size="20px"
                bg={step.color}
                border="4px solid"
                borderColor={cardBg}
                zIndex={2}
                display={{ base: 'none', md: 'block' }}
              />
            </Flex>
          ))}
        </VStack>

        {/* Mobile timeline */}
        <VStack spacing={8} display={{ base: 'flex', md: 'none' }} mt={8}>
          {steps.map((step) => (
            <Box
              key={step.number}
              w="100%"
              bg={cardBg}
              borderRadius="2xl"
              p={6}
              border="1px solid"
              borderColor={borderColor}
              boxShadow="lg"
              position="relative"
              _before={{
                content: '""',
                position: 'absolute',
                left: '30px',
                top: '70px',
                bottom: '-32px',
                w: '2px',
                bg: step.color,
                display: step.number === 5 ? 'none' : 'block',
              }}
            >
              <HStack spacing={4} mb={3}>
                <Circle
                  size="60px"
                  bg={step.color}
                  color="white"
                  fontSize="2xl"
                  fontWeight="bold"
                  boxShadow="md"
                >
                  {step.icon}
                </Circle>
                <Box>
                  <Text fontSize="xs" color="gray.500" fontWeight="semibold">
                    STEP {step.number}
                  </Text>
                  <Heading as="h3" size="sm" color={step.color}>
                    {step.title}
                  </Heading>
                </Box>
              </HStack>
              <Text color="gray.600" fontSize="sm" pl={16}>
                {step.description}
              </Text>
            </Box>
          ))}
        </VStack>
      </Container>
    </Box>
  );
};

export default HowItWorks;