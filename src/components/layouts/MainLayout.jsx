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
            pt: { xs: "calc(70px + 8px + env(safe-area-inset-top, 0px))", md: "calc(88px + 20px)" },
            pb: { xs: "calc(70px + 18px + env(safe-area-inset-bottom, 0px))", md: 3 },
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              borderRadius: { xs: "0px", md: "var(--radius-xl)" },
              background: { xs: "transparent", md: "var(--bg-glass)" },
              backdropFilter: { xs: "none", md: "blur(2px) saturate(160%)" },
              WebkitBackdropFilter: { xs: "none", md: "blur(2px) saturate(160%)" },
              boxShadow: { xs: "none", md: "var(--shadow-premium)" },
              border: { xs: "none", md: "1px solid var(--border-color)" },
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0, px: { xs: 1, md: "var(--page-padding-x)" }, py: { xs: 1.5, md: "var(--page-padding-y)" }, overflowY: "auto", overflowX: "hidden" }}>
              {children}
            </Box>
            <Box sx={{ mt: { xs: 1.5, md: 0 } }}>
              <Footer />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Bottom Navigation for Mobile */}
      <MobileNavbar />
    </>
  );
};

export default MainLayout;
