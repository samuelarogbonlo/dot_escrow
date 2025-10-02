import React from "react";
import {
  Box,
  Flex,
  HStack,
  Link,
  IconButton,
  useDisclosure,
  Stack,
  Text,
  Button,
} from "@chakra-ui/react";
import { HamburgerIcon, CloseIcon } from "@chakra-ui/icons";

const Header: React.FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const navItems = [
    { label: "About Us", href: "#about" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Waitlist", href: "#waitlist" },
  ];

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      onClose(); // Close mobile menu after clicking
    }
  };

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
    onClose();
  };

  return (
    <Box bg="white" px={4} shadow="sm" position="sticky" top={0} zIndex={1000}>
      <Flex
        h={16}
        alignItems="center"
        justifyContent="space-between"
        maxW="7xl"
        mx="auto"
      >
        {/* Logo */}
        <Link
          href="#"
          onClick={handleLogoClick}
          _hover={{ textDecoration: "none" }}
        >
          <Text fontSize="2xl" fontWeight="bold" color="blue.600">
            dotEscrow
          </Text>
        </Link>

        {/* Desktop Navigation */}
        <HStack spacing={8} display={{ base: "none", md: "flex" }}>
          <HStack as="nav" spacing={8}>
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={(e: any) => handleNavClick(e, item.href)}
                px={3}
                py={2}
                fontSize="sm"
                fontWeight="medium"
                color="gray.700"
                _hover={{ color: "blue.600" }}
                transition="color 0.2s"
              >
                {item.label}
              </Link>
            ))}
            {/* Doc link for desktop */}
            <Link
              href="https://dotescrow.gitbook.io/dotescrow-docs/"
              isExternal
              px={3}
              py={2}
              fontSize="sm"
              fontWeight="medium"
              color="gray.700"
              _hover={{ color: "blue.600" }}
              transition="color 0.2s"
            >
              Docs
            </Link>
          </HStack>
          <Button
            as="a"
            href="https://escrow-6wpm.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            colorScheme="blue"
            size="md"
            fontWeight="medium"
          >
            Go to app
          </Button>
        </HStack>

        {/* Mobile menu button */}
        <IconButton
          size="md"
          icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
          aria-label="Toggle Navigation"
          display={{ md: "none" }}
          onClick={isOpen ? onClose : onOpen}
        />
      </Flex>

      {/* Mobile Navigation */}
      {isOpen && (
        <Box pb={4} display={{ md: "none" }}>
          <Stack as="nav" spacing={2}>
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={(e: any) => handleNavClick(e, item.href)}
                px={3}
                py={2}
                borderRadius="md"
                fontSize="base"
                fontWeight="medium"
                color="gray.700"
                _hover={{ color: "blue.600", bg: "gray.50" }}
                transition="all 0.2s"
              >
                {item.label}
              </Link>
            ))}
            {/* Doc link for mobile */}
            <Link
              href="https://dotescrow.gitbook.io/dotescrow-docs/"
              isExternal
              px={3}
              py={2}
              borderRadius="md"
              fontSize="base"
              fontWeight="medium"
              color="gray.700"
              _hover={{ color: "blue.600", bg: "gray.50" }}
              transition="all 0.2s"
            >
              Docs
            </Link>
            <Button
              as="a"
              href="https://escrow-6wpm.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              colorScheme="blue"
              width="full"
              mt={2}
            >
              Go to app
            </Button>
          </Stack>
        </Box>
      )}
    </Box>
  );
};

export default Header;