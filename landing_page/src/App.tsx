import { Routes, Route } from "react-router-dom";
import LandingPage from "./landingPage";
import { Box, useColorModeValue } from "@chakra-ui/react";

function App() {
  const bgColor = useColorModeValue("white", "gray.900");

  return (
    <Box minH="100vh" width="100%" bg={bgColor}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
      </Routes>
    </Box>
  );
}

export default App;
