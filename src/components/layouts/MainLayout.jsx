import React from "react";
import { Box } from "@mui/material";
import Sidebar from "../layouts/Sidebar";
import Header from "../layouts/Header";
import { useAuth } from "../../context/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import Background from "../../Background";
import Footer from "../Footer";

const MainLayout = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <>
      <Background />
      {/* Floating glass header */}
      <Header onMenuClick={handleDrawerToggle} />

      <Box
        sx={{
          display: "flex",
          minHeight: "100vh",
          backgroundColor: "transparent", // Ensure global background is visible
        }}
      >
        {/* Sidebar navigation */}
        <Sidebar mobileOpen={mobileOpen} onDrawerToggle={handleDrawerToggle} />

        {/* Main Content Area */}
        <Box
          sx={{
            flexGrow: 1,
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            p: { xs: 2, md: 3 },
            pt: { xs: "80px", md: "88px" }, /* Clear the fixed header */
            transition: "all 0.3s ease",
            overflow: "hidden", // Main container doesn't scroll, inner panel does or children do
          }}
        >
          {/* INNER GLASS PANEL */}
          <Box
            sx={{
              flex: 1,
              borderRadius: "16px",
              background: "rgba(255, 255, 255, 0.25)",
              backdropFilter: "blur(2px) saturate(160%)",
              WebkitBackdropFilter: "blur(2px) saturate(160%)",
              boxShadow: "0 8px 32px rgba(31, 38, 135, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden", // Main panel doesn't scroll, content wrapper does
            }}
          >
            <Box sx={{ flex: 1, p: { xs: 2, md: 4 }, overflowY: "auto" }}>
              {children}
            </Box>
            <Footer />
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default MainLayout;
