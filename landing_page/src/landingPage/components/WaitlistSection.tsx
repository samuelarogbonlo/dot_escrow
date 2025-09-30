import React, { useState } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  FormErrorMessage,
  useToast,
  SimpleGrid,
  Flex,
  Icon,
} from "@chakra-ui/react";

interface FormData {
  walletAddress: string;
  email: string;
}

interface FormErrors {
  walletAddress?: string;
  email?: string;
}

const WaitlistSection: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    walletAddress: "",
    email: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  // Replace this with your actual Google Apps Script web app URL
  const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbwrXjIFMhiAoyIPTtykdIWWrfbxx99_2oadSc1yC7BgYykTa7OPGpy9tnDxYRM-ePwqPA/exec";

  // Validate Polkadot wallet address (starts with 1, 5, or specific prefixes)
  const validateWalletAddress = (address: string) => {
    // Basic Polkadot address validation (SS58 format)
    const polkadotRegex = /^[1-9A-HJ-NP-Za-km-z]{47,48}$/;
    return polkadotRegex.test(address);
  };

  // Validate email
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (): Promise<void> => {
    // Validate form
    const newErrors: FormErrors = {};

    if (!formData.walletAddress) {
      newErrors.walletAddress = "Wallet address is required";
    } else if (!validateWalletAddress(formData.walletAddress)) {
      newErrors.walletAddress = "Please enter a valid Polkadot wallet address";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit form to Google Sheets
    setIsSubmitting(true);

    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors", // Required for Google Apps Script
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: formData.walletAddress,
          email: formData.email,
        }),
      });


      // Note: With no-cors mode, we can't read the response
      // But if no error is thrown, we assume success
      toast({
        title: "Successfully joined the waitlist!",
        description: "We'll notify you when dotEscrow launches.",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top",
      });

      // Reset form
      setFormData({
        walletAddress: "",
        email: "",
      });
      setErrors({});
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Submission failed",
        description: "Please try again or contact support.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box id="waitlist" bg="gray.50" py={20} px={{ base: 4, sm: 6, lg: 8 }}>
      <Container maxW="7xl">
        <SimpleGrid
          columns={{ base: 1, lg: 2 }}
          spacing={12}
          alignItems="center"
        >
          {/* Left Side - Content */}
          <VStack spacing={6} align="start">
            <Heading
              as="h2"
              size="2xl"
              bgGradient="linear(to-r, purple.500, blue.500)"
              bgClip="text"
              lineHeight="shorter"
            >
              Join the Waitlist
            </Heading>
            <Text fontSize="xl" color="gray.600" lineHeight="tall">
              Be among the first to experience trust-minimized escrow on
              Polkadot. Sign up now and get early access when we launch.
            </Text>

            {/* Benefits List */}
            <VStack spacing={4} align="start" pt={4}>
              <Flex align="center" gap={3}>
                <Flex
                  w={10}
                  h={10}
                  bg="blue.100"
                  borderRadius="lg"
                  align="center"
                  justify="center"
                >
                  <Icon viewBox="0 0 24 24" w={5} h={5} color="blue.600">
                    <path
                      fill="currentColor"
                      d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
                    />
                  </Icon>
                </Flex>
                <Box>
                  <Text fontWeight="semibold" color="gray.800">
                    Early Access
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Get priority access to the platform
                  </Text>
                </Box>
              </Flex>

              <Flex align="center" gap={3}>
                <Flex
                  w={10}
                  h={10}
                  bg="green.100"
                  borderRadius="lg"
                  align="center"
                  justify="center"
                >
                  <Icon viewBox="0 0 24 24" w={5} h={5} color="green.600">
                    <path
                      fill="currentColor"
                      d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"
                    />
                  </Icon>
                </Flex>
                <Box>
                  <Text fontWeight="semibold" color="gray.800">
                    Exclusive Updates
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Stay informed about new features
                  </Text>
                </Box>
              </Flex>

              <Flex align="center" gap={3}>
                <Flex
                  w={10}
                  h={10}
                  bg="purple.100"
                  borderRadius="lg"
                  align="center"
                  justify="center"
                >
                  <Icon viewBox="0 0 24 24" w={5} h={5} color="purple.600">
                    <path
                      fill="currentColor"
                      d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
                    />
                  </Icon>
                </Flex>
                <Box>
                  <Text fontWeight="semibold" color="gray.800">
                    Special Perks
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Receive launch bonuses and rewards
                  </Text>
                </Box>
              </Flex>
            </VStack>
          </VStack>

          {/* Right Side - Form */}
          <Box
            bg="white"
            p={8}
            borderRadius="2xl"
            shadow="xl"
            border="1px"
            borderColor="gray.200"
          >
            <VStack spacing={6}>
              <FormControl isInvalid={!!errors.walletAddress}>
                <FormLabel fontWeight="semibold" color="gray.700">
                  Polkadot Wallet Address
                </FormLabel>
                <Input
                  name="walletAddress"
                  value={formData.walletAddress}
                  onChange={handleChange}
                  placeholder="Enter your Polkadot wallet address"
                  size="lg"
                  bg="gray.50"
                  _focus={{ bg: "white", borderColor: "blue.500" }}
                />
                <FormErrorMessage>{errors.walletAddress}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.email}>
                <FormLabel fontWeight="semibold" color="gray.700">
                  Email Address
                </FormLabel>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email address"
                  size="lg"
                  bg="gray.50"
                  _focus={{ bg: "white", borderColor: "blue.500" }}
                />
                <FormErrorMessage>{errors.email}</FormErrorMessage>
              </FormControl>

              <Button
                onClick={handleSubmit}
                colorScheme="blue"
                size="lg"
                width="full"
                isLoading={isSubmitting}
                loadingText="Joining..."
                _hover={{ transform: "translateY(-2px)", shadow: "lg" }}
                transition="all 0.2s"
              >
                Join Waitlist
              </Button>

              <Text fontSize="sm" color="gray.500" textAlign="center">
                By joining, you agree to receive updates about dotEscrow. We
                respect your privacy and won't spam you.
              </Text>
            </VStack>
          </Box>
        </SimpleGrid>
      </Container>
    </Box>
  );
};

export default WaitlistSection;
