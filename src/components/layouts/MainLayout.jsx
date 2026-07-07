import React from "react";
import { Box } from "@mui/material";
import Sidebar from "../layouts/Sidebar";
import Header from "../layouts/Header";
import { useAuth } from "../../context/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import Background from "../../Background";
import Footer from "../Footer";
import MobileNavbar from "../layouts/MobileNavbar";

const MainLayout = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    return stored !== null ? stored === "true" : true;
  });

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  };

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const sidebarWidth = isSidebarCollapsed ? 85 : 270;

  return (
    <>
      <Header isSidebarCollapsed={isSidebarCollapsed} />

      <Box
        sx={{
          display: "flex",
          minHeight: "100vh",
          backgroundColor: "var(--bg-main)",
        }}
      >
        <Sidebar isCollapsed={isSidebarCollapsed} onToggleSidebar={handleToggleSidebar} />

        <Box
          sx={{
            flexGrow: 1,
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            px: { xs: 0, md: 3 },
            pt: { xs: "calc(70px + 16px)", md: "calc(88px + 24px)" },
            pb: { xs: "calc(80px + 16px)", md: 3 },
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              flex: 1,
              borderRadius: { xs: 0, md: "16px" },
              background: "var(--bg-glass)",
              backdropFilter: "blur(2px) saturate(160%)",
              WebkitBackdropFilter: "blur(2px) saturate(160%)",
              boxShadow: { xs: "none", md: "0 8px 32px rgba(31, 38, 135, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)" },
              border: { xs: "none", md: "1px solid var(--border-color)" },
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <Box sx={{ flex: 1, px: { xs: 0.5, md: 4 }, py: { xs: 1.5, md: 4 }, overflowY: "auto" }}>
              {children}
            </Box>
            <Footer />
          </Box>
        </Box>
      </Box>

      {/* Bottom Navigation for Mobile */}
      <MobileNavbar />
    </>
  );
};

export default MainLayout;
