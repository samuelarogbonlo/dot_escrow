import { Routes, Route } from "react-router-dom";
import { Box, useColorModeValue } from "@chakra-ui/react";
import Dashboard from "./pages/Dashboard";
import Layout from "./components/Layout";
import ConnectWallet from "./pages/ConnectWallet";
import EscrowDetails from "./pages/EscrowDetails";
import CreateEscrow from "./pages/CreateEscrow";
import Transactions from "./pages/Transactions";
import DisputeResolution from "./pages/DisputeResolution";
import ConfirmDetails from "./pages/ConfirmEscrow";
import Settings from "./pages/Settings";
import MilestoneTracking from "./pages/MilestoneTracking";
import MilestoneDetail from "./pages/MilestoneDetails/MilestoneDetail";

const App = () => {
  const bgColor = useColorModeValue("white", "gray.900");

  return (
    <Box minH="100vh" width="100%" bg={bgColor}>
      <Routes>
        <Route path="/connect" element={<ConnectWallet />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="escrow/create" element={<CreateEscrow />} />
          <Route path="confirm_escrow/:id" element={<ConfirmDetails />} />
          <Route path="escrow/:id" element={<EscrowDetails />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="disputes/:id" element={<DisputeResolution />} />
          <Route path="milestone" element={<MilestoneTracking />} />
          <Route path="milestone_detail/:escrowId/:milestoneId" element={<MilestoneDetail />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Box>
  );
};

export default App;
