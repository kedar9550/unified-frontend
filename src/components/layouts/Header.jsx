import React, { useState } from "react";
import { Box, Typography, IconButton, Menu, MenuItem, Fade, ListItemIcon } from "@mui/material";
import {
  Menu as MenuIcon,
  KeyboardArrowDown,
  Logout,
  Brightness4,
  Brightness7,
  Check,
  Domain,
  School
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

const Header = ({ onMenuClick }) => {
  const { user, activeRole, switchRole, logout } = useAuth();
  const [imgError, setImgError] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleProfileClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout();
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleRoleSwitch = (newRole) => {
    if (newRole !== activeRole) {
      switchRole(newRole);
      navigate("/dashboard");
    }
    handleClose();
  };

  const getEcapImage = () => {
    if (!user || user.profileImage) return null;
    if (user.userType === "Employee") {
      return `https://info.aec.edu.in/aus/employeephotos/${user.institutionId}.jpg`;
    } else if (user.userType === "Student") {
      return `https://info.aec.edu.in/adityacentral/StudentPhotos/${user.institutionId}.jpg`;
    }
    return null;
  };

  const imageSrc = user?.profileImage || getEcapImage();
  const initials = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  const open = Boolean(anchorEl);

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: { xs: 0, md: 270 },
        right: 0,
        zIndex: 1100,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        px: { xs: 1.5, md: 3 },
        py: { xs: 1.2, md: 1.2 },
        transition: "all 0.3s ease",
        background: "#ffffff",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        borderBottom: "1px solid #e2e8f0",
      }}
    >
      {/* LEFT SECTION: Menu Toggle (Mobile) */}
      <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, md: 2 } }}>
        <IconButton
          onClick={onMenuClick}
          sx={{
            display: { md: "none" },
            background: "rgba(11, 82, 153, 0.05)",
            color: "#0b5299",
            "&:hover": { background: "rgba(11, 82, 153, 0.1)" },
          }}
        >
          <MenuIcon />
        </IconButton>
      </Box>

      {/* RIGHT SECTION: Unified Profile & Role Pill */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>

        <Box
          onClick={handleProfileClick}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            pl: 2.5,
            pr: 0.5,
            py: 0.5,
            borderRadius: "999px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            cursor: "pointer",
            transition: "all 0.2s ease",
            "&:hover": {
              background: "#f1f5f9",
              borderColor: "#cbd5e1",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
            },
            userSelect: "none"
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <Typography
              sx={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "#1e293b",
                lineHeight: 1,
                mb: 0.2
              }}
            >
              {activeRole || "User"}
            </Typography>
            <Typography
              sx={{
                fontSize: "0.7rem",
                fontWeight: 500,
                color: "#64748b",
                lineHeight: 1
              }}
            >
              {user?.name || "System User"}
            </Typography>
          </Box>

          <KeyboardArrowDown
            sx={{
              fontSize: 18,
              color: "#94a3b8",
              transition: "transform 0.2s ease",
              transform: open ? "rotate(180deg)" : "none"
            }}
          />

          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              overflow: "hidden",
              border: "2px solid #fff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              background: "linear-gradient(90deg, #004e92, #000428)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              ml: 0.5
            }}
          >
            {imageSrc && !imgError ? (
              <Box component="img" src={imageSrc} onError={() => setImgError(true)} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#fff" }}>{initials}</Typography>
            )}
          </Box>
        </Box>

        {/* Role Selection Menu */}
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          TransitionComponent={Fade}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: {
              mt: 1.5,
              minWidth: 240, // Increased width for better proportions
              borderRadius: "20px", // Smoother corners
              boxShadow: "0 15px 50px rgba(0, 0, 0, 0.15)",
              border: "1px solid rgba(255, 255, 255, 0.8)",
              px: 2, // Generous horizontal padding
              py: 2.2,   // Balanced vertical padding
            }
          }}
        >
          {/* User Info Header */}
          <Box sx={{ px: 3.2, py: 1.8, mx: 1.5, mb: 1.5, background: "linear-gradient(135deg, rgba(0, 78, 146, 0.04), rgba(0, 4, 40, 0.04))", borderRadius: "12px" }}>
            <Typography sx={{ fontSize: "0.85rem", fontWeight: 800, color: "#004e92" }}>
              {user?.name || "System User"}
            </Typography>
            <Typography sx={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 500, mt: 0.5 }}>
              {user?.email || "user@example.com"}
            </Typography>
          </Box>

          <Box sx={{ px: 2, pb: 1 }}>
            <Typography sx={{ fontSize: "0.65rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1.2px" }}>
              Switch Role
            </Typography>
          </Box>

          {/* Role Selector Card Container */}
          <Box
            sx={{
              mx: 1.5,
              mb: 1,
              p: 0.8,
              borderRadius: "16px",
              border: "1px solid #f1f5f9",
              background: "#ffffff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
            }}
          >
            {user?.roles?.map((r) => {
              const isActive = r.role === activeRole;
              const isUniprime = r.role.toUpperCase() === "UNIPRIME";

              return (
                <MenuItem
                  key={r.role}
                  onClick={() => handleRoleSwitch(r.role)}
                  selected={isActive}
                  sx={{
                    borderRadius: "12px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: isActive ? "#004e92" : "#475569",
                    background: isActive ? "#f0f7ff !important" : "transparent",
                    py: 1, // Reduced height
                    px: 1.5,
                    mb: 0.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      background: "#f8fafc",
                    },
                    "&:last-child": { mb: 0 }
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    {/* Circular Icon Badge */}
                    <Box
                      sx={{
                        width: 34, // Reduced badge size
                        height: 34,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: isActive ? "#e1effe" : "#f1f5f9",
                        color: isActive ? "#1c64f2" : "#94a3b8"
                      }}
                    >
                      {isUniprime ? <Domain sx={{ fontSize: 18 }} /> : <School sx={{ fontSize: 18 }} />}
                    </Box>
                    <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", letterSpacing: "0.3px" }}>
                      {r.role}
                    </Typography>
                  </Box>

                  {isActive && <Check sx={{ fontSize: 18, color: "#1c64f2" }} />}
                </MenuItem>
              );
            })}
          </Box>

          {/* Action Section */}
          <Box sx={{ px: 0.5 }}>
            {/* Theme Toggle */}
            <MenuItem
              onClick={toggleTheme}
              sx={{
                borderRadius: "10px",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "#475569",
                py: 1.2,
                px: 2, // Added horizontal padding
                mb: 0.5,
                mx: 1.5,
                "&:hover": { background: "#f8fafc" }
              }}
            >
              <ListItemIcon sx={{ minWidth: 35 }}>
                {isDarkMode ? <Brightness7 fontSize="small" sx={{ color: "#f59e0b" }} /> : <Brightness4 fontSize="small" sx={{ color: "#64748b" }} />}
              </ListItemIcon>
              {isDarkMode ? "Light Mode" : "Dark Mode"}
            </MenuItem>

            <Box sx={{ my: 2, mx: 2, height: "1px", background: "#aaaaaaff" }} />

            {/* Logout Button */}
            <MenuItem
              onClick={handleLogout}
              sx={{
                borderRadius: "50px",
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "#ffffff",
                py: 1.4,
                mx: 1.5,
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(0, 78, 146, 0.2)",
                transition: "all 0.4s ease",
                position: "relative",
                background: "transparent",
                overflow: "hidden",
                zIndex: 1,

                // Base Blue State Layer
                "& .blue-bg": {
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(90deg, #004e92, #000428)",
                  borderRadius: "50px",
                  zIndex: -3,
                  transition: "opacity 0.4s ease",
                  opacity: 1,
                },

                // Inner White Background for Hover
                "&::before": {
                   content: '""',
                   position: "absolute",
                   inset: 0,
                   borderRadius: "50px",
                   background: "#ffffff",
                   zIndex: -2,
                   transition: "opacity 0.4s ease",
                   opacity: 0, 
                },

                // Sharp Masked Gradient Border for Hover
                "&::after": {
                  content: '""',
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50px",
                  padding: "2px", 
                  background: "linear-gradient(90deg, #cb2d3e, #ef473a)",
                  WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                  zIndex: -1,
                  transition: "clip-path 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                  clipPath: "inset(0 100% 0 0)", 
                },

                "&:hover": {
                  color: "#cb2d3e",
                  boxShadow: "0 8px 20px rgba(203, 45, 62, 0.15)",
                  transform: "translateY(-1px)",
                  "& .blue-bg": { opacity: 0 },
                  "&::before": { opacity: 1 },
                  "&::after": { clipPath: "inset(0 0 0 0)" },
                  "& .MuiListItemIcon-root .MuiSvgIcon-root": { color: "#cb2d3e" }
                }
              }}
            >
              <Box className="blue-bg" />
              <ListItemIcon sx={{ minWidth: 30, zIndex: 2 }}>
                <Logout fontSize="small" sx={{ color: "#ffffff", transition: "color 0.4s ease" }} />
              </ListItemIcon>
              <Box component="span" sx={{ zIndex: 2, position: "relative" }}>
                Logout
              </Box>
            </MenuItem>
          </Box>
        </Menu>
      </Box>
    </Box>
  );
};

export default Header;
