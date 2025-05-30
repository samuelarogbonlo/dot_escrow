import {
  Box,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
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
} from "@chakra-ui/react";
import {
  SearchIcon,
  MoonIcon,
  SunIcon,
  ChevronDownIcon,
  CloseIcon,
  HamburgerIcon,
} from "@chakra-ui/icons";
import { FiLogOut, FiUser } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Notifications from "../Notifications";
import { useWallet } from "../../hooks/useWalletContext";
import { useState } from "react";

interface HeaderProps {
  showMenu: () => void;
}

const Header: React.FC<HeaderProps> = ({ showMenu }) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { selectedAccount, isExtensionReady, disconnectApi } = useWallet();
  const navigate = useNavigate();
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const isMobile = useBreakpointValue({ base: true, sm: true, md: false });
  const isMobileMenu = useBreakpointValue({ base: true, sm: true, lg: false });

  const truncateAddress = (address: string | null) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
            <IconButton
              aria-label="Menu"
              icon={<HamburgerIcon />}
              onClick={showMenu}
              variant="ghost"
              size="sm"
            />
          )}

          {/* Search field or search icon (mobile toggle) */}
          {showMobileSearch ? (
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
          )}
        </HStack>

        {/* Right side icons */}
        <HStack spacing={3}>
          {/* Search icon toggle for mobile */}
          {isMobile && (
            <IconButton
              aria-label="Search"
              icon={showMobileSearch ? <CloseIcon /> : <SearchIcon />}
              onClick={() => setShowMobileSearch((prev) => !prev)}
              variant="ghost"
              size="sm"
            />
          )}

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
                  {selectedAccount.meta.name ||
                    truncateAddress(selectedAccount.address)}
                </MenuButton>
                <MenuList>
                  <MenuItem icon={<FiUser />}>
                    {truncateAddress(selectedAccount.address)}
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
