import {
  Box,
  VStack,
  HStack,
  Icon,
  Text,
  Flex,
  useColorModeValue,
  Divider,
} from "@chakra-ui/react";
import { Link, useLocation } from "react-router-dom";
import { FiHome, FiFileText, FiTarget, FiSettings } from "react-icons/fi";
import { useState, useEffect } from "react";
import { useWallet } from "../../hooks/useWalletContext";
import { useAdminGovernance } from "../../hooks/useAdminGovernance";

const NavItem = ({
  icon,
  children,
  to,
  isMobile = false,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
  to: string;
  isMobile?: boolean;
}) => {
  const location = useLocation();
  const isActive =
    location.pathname === to ||
    (to !== "/" && location.pathname.startsWith(to));

  const activeBg = useColorModeValue("blue.50", "blue.900");
  const activeColor = useColorModeValue("blue.600", "blue.200");
  const inactiveColor = useColorModeValue("gray.600", "gray.400");

  if (isMobile) {
    return (
      <Link to={to} style={{ flex: 1 }}>
        <Flex
          align="center"
          justify="center"
          py="3"
          cursor="pointer"
          role="group"
          color={isActive ? activeColor : inactiveColor}
          bg={isActive ? activeBg : "transparent"}
          borderRadius="md"
          direction="column"
          _hover={{
            bg: useColorModeValue("gray.100", "gray.700"),
          }}
        >
          <Icon fontSize="20" as={icon} />
        </Flex>
      </Link>
    );
  }

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
          bg: useColorModeValue("gray.100", "gray.700"),
        }}
      >
        <Icon mr="3" fontSize="16" as={icon} />
        <Text fontSize="sm">{children}</Text>
      </Flex>
    </Link>
  );
};

const Sidebar = () => {
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckLoading, setAdminCheckLoading] = useState(true);

  const { selectedAccount, isExtensionReady, api } = useWallet();
  const governance = useAdminGovernance({ api, account: selectedAccount as any });
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!isExtensionReady || !selectedAccount?.address || !api) {
        setIsAdmin(false);
        setAdminCheckLoading(false);
        return;
      }

      try {
        setAdminCheckLoading(true);
        console.log("admin checking")
        const isSigner = await governance.isAdminSigner(selectedAccount.address);
        console.log(Boolean(isSigner))
        setIsAdmin(isSigner);
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setAdminCheckLoading(false);
      }
    };

    checkAdminStatus();
  }, [isExtensionReady, selectedAccount, api, isAdmin]);

  return (
    <>
      {/* Desktop Sidebar */}
      <Box
        w={{ base: "full", md: "60" }}
        h="100vh"
        minH="full"
        bg={bgColor}
        display={{ base: "none", lg: "block" }}
        borderRight="1px"
        borderColor={borderColor}
        position="sticky"
        top="0"
        left="0"
      >
        <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
          <Text fontSize="2xl" fontWeight="bold">
            .escrow
          </Text>
        </Flex>

        <VStack spacing="1" align="stretch" px="3">
          <NavItem icon={FiHome} to="/">
            Dashboard
          </NavItem>
          <NavItem icon={FiFileText} to="/escrow/create">
            Create Escrow
          </NavItem>
          <NavItem icon={FiTarget} to="/milestone">
            Milestones
          </NavItem>

          {/* Only show admin nav if user is authorized and not still loading */}
          {isAdmin && (
            <NavItem icon={FiSettings} to="/admin">
              Admin
            </NavItem>
          )}

          <Divider my="6" borderColor={borderColor} />
        </VStack>
      </Box>

      {/* Mobile/Tablet Bottom Navigation */}
      <Box
        position="fixed"
        bottom="0"
        left="0"
        right="0"
        bg={bgColor}
        borderTop="1px"
        borderColor={borderColor}
        display={{ base: "block", lg: "none" }}
        zIndex={10}
      >
        <HStack spacing="0" align="stretch">
          <NavItem icon={FiHome} to="/" isMobile>
            Dashboard
          </NavItem>
          <NavItem icon={FiFileText} to="/escrow/create" isMobile>
            Create Escrow
          </NavItem>
          <NavItem icon={FiTarget} to="/milestone" isMobile>
            Milestones
          </NavItem>

          {/* Only show admin nav if user is authorized and not still loading */}
          {!adminCheckLoading && isAdmin && (
            <NavItem icon={FiSettings} to="/admin" isMobile>
              Admin
            </NavItem>
          )}
        </HStack>
      </Box>
    </>
  );
};

export default Sidebar;
