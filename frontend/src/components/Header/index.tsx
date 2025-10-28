import {
  Box,
  Flex,
  Text,
  // Input,
  // InputGroup,
  // InputLeftElement,
  Button,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useColorMode,
  useBreakpointValue,
  Badge,
  useToast,
  VStack,
  Tooltip,
} from "@chakra-ui/react";
import {
  // SearchIcon,
  MoonIcon,
  SunIcon,
  ChevronDownIcon,
  CopyIcon,
  // CloseIcon,
  // HamburgerIcon,
} from "@chakra-ui/icons";
import { FiLogOut, FiUser } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Notifications from "../Notifications";
import { useWallet } from "../../hooks/useWalletContext";
import { formatSS58, formatH160 } from "../../utils/addressConversion";
// import { useState } from "react";


const Header = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { selectedAccount, selectedH160Address, isExtensionReady, disconnectApi } = useWallet();
  const navigate = useNavigate();
  const toast = useToast();
  const showMobileSearch = false; // TODO: Implement mobile search
  // const [showMobileSearch, setShowMobileSearch] = useState(false);

  // const isMobile = useBreakpointValue({ base: true, sm: true, md: false });
  const isMobileMenu = useBreakpointValue({ base: true, sm: true, lg: false });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: `${label} copied`,
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    });
  };

  const handleDisconnect = async () => {
    await disconnectApi();
    navigate("/connect");
  };

  return (
    <Box
      as="header"
      py={4}
      px={6}
      borderBottomWidth="1px"
      bg={colorMode === "dark" ? "gray.800" : "white"}
    >
      <Flex justify="space-between" align="center" w="full">
        {/* Left side */}
        <HStack spacing={3} align="center">
          {/* Menu button on mobile/tablet */}
          {isMobileMenu && !showMobileSearch && (
            <Flex
              // h="20"
              alignItems="center"
              // mx="8"
              justifyContent="space-between"
            >
              <Text fontSize="2xl" fontWeight="bold">
                .escrow
              </Text>
            </Flex>
          )}

          {/* Search field or search icon (mobile toggle) */}
          {/* {showMobileSearch ? (
            <InputGroup maxW="300px">
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search escrows..."
                borderRadius="full"
                autoFocus
              />
            </InputGroup>
          ) : (
            <InputGroup maxW="400px" display={{ base: "none", md: "block" }}>
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.400" />
              </InputLeftElement>
              <Input placeholder="Search escrows..." borderRadius="full" />
            </InputGroup>
          )} */}
        </HStack>

        {/* Right side icons */}
        <HStack spacing={3}>
          {/* Search icon toggle for mobile */}
          {/* {isMobile && (
            <IconButton
              aria-label="Search"
              icon={showMobileSearch ? <CloseIcon /> : <SearchIcon />}
              onClick={() => setShowMobileSearch((prev) => !prev)}
              variant="ghost"
              size="sm"
            />
          )} */}

          {/* Theme toggle (always visible) */}
          <IconButton
            aria-label="Toggle theme"
            icon={colorMode === "dark" ? <SunIcon /> : <MoonIcon />}
            onClick={toggleColorMode}
            variant="ghost"
            size="sm"
          />

          {/* Wallet/account options */}
          {!showMobileSearch &&
            (isExtensionReady && selectedAccount ? (
              <Menu>
                <MenuButton
                  as={Button}
                  size="sm"
                  rightIcon={<ChevronDownIcon />}
                >
                  {selectedAccount.meta.name || formatSS58(selectedAccount.address)}
                </MenuButton>
                <MenuList>
                  <MenuItem icon={<FiUser />} closeOnSelect={false}>
                    <VStack align="stretch" spacing={2} w="full">
                      {/* SS58 Address */}
                      <HStack justify="space-between" w="full">
                        <VStack align="start" spacing={0}>
                          <HStack>
                            <Text fontSize="xs" fontWeight="bold">SS58</Text>
                            <Badge colorScheme="purple" fontSize="xs">Substrate</Badge>
                          </HStack>
                          <Tooltip label={selectedAccount.address} placement="bottom">
                            <Text fontSize="sm">{formatSS58(selectedAccount.address)}</Text>
                          </Tooltip>
                        </VStack>
                        <IconButton
                          aria-label="Copy SS58 address"
                          icon={<CopyIcon />}
                          size="xs"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(selectedAccount.address, "SS58 address");
                          }}
                        />
                      </HStack>

                      {/* H160 Address */}
                      {selectedH160Address && (
                        <HStack justify="space-between" w="full" pt={2} borderTopWidth="1px">
                          <VStack align="start" spacing={0}>
                            <HStack>
                              <Text fontSize="xs" fontWeight="bold">H160</Text>
                              <Badge colorScheme="blue" fontSize="xs">Contract</Badge>
                            </HStack>
                            <Tooltip label={selectedH160Address} placement="bottom">
                              <Text fontSize="sm">{formatH160(selectedH160Address)}</Text>
                            </Tooltip>
                          </VStack>
                          <IconButton
                            aria-label="Copy H160 address"
                            icon={<CopyIcon />}
                            size="xs"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(selectedH160Address, "H160 address");
                            }}
                          />
                        </HStack>
                      )}
                    </VStack>
                  </MenuItem>
                  <MenuDivider />
                  <MenuItem icon={<FiLogOut />} onClick={handleDisconnect}>
                    Disconnect
                  </MenuItem>
                </MenuList>
              </Menu>
            ) : (
              <Button
                size="sm"
                colorScheme="blue"
                onClick={() => navigate("/connect")}
              >
                Connect Wallet
              </Button>
            ))}

          {/* Notifications (only show when not in mobile search mode) */}
          {!showMobileSearch && <Notifications />}
        </HStack>
      </Flex>
    </Box>
  );
};

export default Header;
