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
  School,
  Person
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import ThemeToggle from "../common/Themetoggle";
import logoLightTheme from "../../assets/Logo_Light_theme.svg";
import logoDarkTheme from "../../assets/Logo_Dark_theme.svg";

const capitalizeRole = (role) => {
  if (!role) return "";
  return role.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const Header = ({ onMenuClick }) => {
  const { user, activeRole, switchRole, logout } = useAuth();
  const [imgError, setImgError] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.body.classList.contains("dark-mode") || localStorage.getItem("theme") === "dark";
  });

  React.useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.body.classList.contains("dark-mode"));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  const navigate = useNavigate();
  const location = useLocation();

  const handleProfileClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    // Remove focus from the active element (e.g., clicked MenuItem) before the menu hides
    // This prevents the "Blocked aria-hidden on an element because its descendant retained focus" warning.
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const handleLogout = () => {
    handleClose();
    logout();
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleRoleSwitch = (newRole) => {
    handleClose();
    if (newRole !== activeRole) {
      switchRole(newRole);
      setTimeout(() => navigate("/dashboard"), 0);
    }
  };

  const getEcapImage = () => {
    if (!user || user.profileImage || !user.institutionId || user.institutionId === "Prime") return null;
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
        justifyContent: { xs: "space-between", md: "flex-end" },
        gap: 2,
        pl: { xs: 0, md: 3 },
        pr: { xs: 1.5, md: 3 },
        py: { xs: 1.2, md: 1.2 },
        transition: "all 0.3s ease",
        background: "var(--bg-paper)",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        borderBottom: "1px solid var(--border-color)",
      }}
    >
      {/* MOBILE ONLY LOGO: dynamic based on theme */}
      <Box
        sx={{
          display: { xs: "flex", md: "none" },
          alignItems: "center",
          height: { xs: 45, sm: 52 },
          ml: -1.2, // Shift slightly left to sit perfectly flush against the edge
        }}
      >
        <Box
          component="img"
          src={isDarkMode ? logoDarkTheme : logoLightTheme}
          alt="Aditya University Logo"
          sx={{
            height: "100%",
            width: "auto",
            objectFit: "contain",
          }}
        />
      </Box>

      {/* RIGHT SECTION: Unified Profile & Role Pill */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>

        <Box
          onClick={handleProfileClick}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end", // Anchor avatar to the right
            height: 48, // Fixed height
            borderRadius: "1000px",
            background: open
              ? "linear-gradient(var(--bg-panel), var(--bg-panel)) padding-box, var(--gradient-primary) border-box"
              : "var(--bg-panel)",
            border: open ? "2px solid transparent" : "1px solid var(--border-color)",
            cursor: "pointer",
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: open ? "var(--shadow-premium)" : "none",
            maxWidth: open ? "250px" : "48px", // Collapsed = perfect circle (matches height)
            boxSizing: "border-box",
            overflow: "hidden",
            "&:hover": {
              maxWidth: "250px", // Expand on hover
              background: open
                ? "linear-gradient(var(--bg-panel), var(--bg-panel)) padding-box, var(--gradient-primary) border-box"
                : "var(--border-color)",
              borderColor: open ? "transparent" : "var(--text-secondary)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
            },
            "&:hover .profile-text-content": {
              opacity: 1,
              transform: "translateX(0)"
            },
            userSelect: "none",
            p: 0 // Remove padding so avatar fills the pill
          }}
        >
          {/* Expanding Details Section */}
          <Box
            className="profile-text-content"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              opacity: open ? 1 : 0,
              transform: open ? "translateX(0)" : "translateX(10px)",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              whiteSpace: "nowrap",
              pl: 2, // Added left padding since parent has 0
              pr: 1
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1, mb: 0.2 }}>
                {capitalizeRole(activeRole) || "User"}
              </Typography>
              <Typography sx={{ fontSize: "0.7rem", fontWeight: 500, color: "var(--text-secondary)", lineHeight: 1 }}>
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
          </Box>

          {/* Avatar Container */}
          <Box
            sx={{
              minWidth: 40,
              width: 40,
              height: 40,
              borderRadius: "60%",
              overflow: "hidden",
              border: "0px solid var(--border-color)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              background: "var(--gradient-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              mr: "3px"
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
          disableScrollLock={true}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          //profile container to change the Overall Size
          slotProps={{
            paper: {
              sx: {
                mt: 1.5,
                minWidth: 260, // Increased width for better proportions
                borderRadius: "20px", // Smoother corners
                boxShadow: "0 15px 50px rgba(0, 0, 0, 0.15)",
                border: "1px solid rgba(255, 255, 255, 0.8)",
                px: 0.5, // Generous horizontal padding
                py: 0.5,   // Balanced vertical padding
              }
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
              border: "1px solid var(--border-color)",
              background: "var(--bg-paper)",
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
                    color: isActive ? "var(--color-primary)" : "var(--text-secondary)",
                    background: isActive ? "var(--bg-accent-4) !important" : "transparent",
                    py: 1.2, // Reduced height
                    px: 1.5,
                    mb: 0.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      background: "var(--bg-panel)",
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
                        background: isActive ? "var(--bg-accent-4)" : "var(--bg-panel)",
                        color: isActive ? "var(--color-primary)" : "var(--text-secondary)"
                      }}
                    >
                      {isUniprime ? <Domain sx={{ fontSize: 18 }} /> : <School sx={{ fontSize: 18 }} />}
                    </Box>
                    <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", letterSpacing: "0.3px" }}>
                      {capitalizeRole(r.role)}
                    </Typography>
                  </Box>

                  {isActive && <Check sx={{ fontSize: 18, color: "var(--color-primary)" }} />}
                </MenuItem>
              );
            })}
          </Box>

          {/* Action Section */}
          <Box sx={{ px: 0.5 }}>
            <Typography sx={{ px: 2, mt: 1, mb: 0.5, fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Preferences
            </Typography>

            {/* Profile Link */}
            <MenuItem
              onClick={() => { handleClose(); navigate("/profile"); }}
              sx={{
                borderRadius: "10px",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--text-secondary)",
                py: 1.2,
                px: 2,
                mb: 0.5,
                mx: 1.5,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                transition: "all 0.2s ease",
                "&:hover": {
                  background: "var(--bg-panel)",
                  color: "var(--color-primary)",
                  "& .MuiSvgIcon-root": { color: "var(--color-primary)" }
                }
              }}
            >
              <Person fontSize="small" sx={{ color: "var(--text-secondary)", transition: "color 0.2s ease" }} />
              My Profile
            </MenuItem>

            {/* Theme Toggle */}
            <MenuItem
              disableRipple
              sx={{
                borderRadius: "10px",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--text-secondary)",
                py: 1.2,
                px: 2, // Added horizontal padding
                mb: 0.5,
                mx: 1.5,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                "&:hover": { background: "transparent", cursor: "default" }
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Brightness4 fontSize="small" sx={{ color: "var(--text-secondary)" }} />
                Appearance
              </Box>
              <ThemeToggle />
            </MenuItem>

            <Box sx={{ my: 2, mx: 2, height: "1px", background: "var(--border-color)" }} />

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
                  background: "var(--gradient-primary)",
                  borderRadius: "50px",
                  zIndex: -3,
                  transition: "opacity 0.4s ease",
                  opacity: 1,
                },

                // Inner Background for Hover (Adapted for dark mode)
                "&::before": {
                  content: '""',
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50px",
                  background: "var(--bg-accent-1)",
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
