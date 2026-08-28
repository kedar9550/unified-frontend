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
    return stored !== null ? stored === "true" : false;
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
            minWidth: 0,
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            px: { xs: "var(--page-padding-mobile)", md: 3 },
            pt: { xs: "calc(70px + 12px)", md: "calc(88px + 20px)" },
            pb: { xs: "calc(70px + 16px)", md: 3 },
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              borderRadius: { xs: "8px", md: "var(--radius-xl)" },
              background: "var(--bg-glass)",
              backdropFilter: "blur(2px) saturate(160%)",
              WebkitBackdropFilter: "blur(2px) saturate(160%)",
              boxShadow: "var(--shadow-premium)",
              border: "1px solid var(--border-color)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0, px: { xs: "var(--mobile-padding-x)", md: "var(--page-padding-x)" }, py: { xs: "var(--mobile-padding-y)", md: "var(--page-padding-y)" }, overflowY: "auto", overflowX: "hidden" }}>
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
