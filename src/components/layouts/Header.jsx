import React, { useState, useEffect } from "react";
import { Box, Typography, IconButton, Menu, MenuItem, Fade, ListItemIcon, Badge } from "@mui/material";
import {
  Menu as MenuIcon,
  KeyboardArrowDown,
  Logout,
  Brightness4,
  Brightness7,
  Check,
  Domain,
  School,
  Person,
  Notifications,
  Search
} from "@mui/icons-material";
import { InputBase } from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import ThemeToggle from "../common/Themetoggle";
import HeaderSearch from "../common/HeaderSearch";
import NotificationBell from "../common/NotificationBell";
import GlobalFeedbackPrompt from "../common/GlobalFeedbackPrompt";
import logoDarkTheme from "../../assets/Logo_Dark_theme.svg";
import universityLogoGold from "../../assets/Aditya University Gold Logo.png";
import circleLogoWhite from "../../assets/Circle_logo_white.png";
import smallLogoWhite from "../../assets/Small_logo_white.png";

const capitalizeRole = (role) => {
  if (!role) return "";
  return role.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const Header = ({ isSidebarCollapsed }) => {
  const { user, activeRole, switchRole, logout } = useAuth();
  const [imgError, setImgError] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const notifRef = React.useRef(null);
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
    //console.log("Header: handleClose called, setting anchorEl to null");
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

  const [imageSrc, setImageSrc] = useState(null);

  useEffect(() => {
    if (user?.profileImage) {
      setImageSrc(user.profileImage);
      return;
    }

    if (!user || !user.institutionId || user.institutionId === "Prime") {
      setImageSrc(null);
      return;
    }

    const checkImage = (url) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = url;
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
      });
    };

    let isMounted = true;
    const resolveHeaderImage = async () => {
      if (user.userType === "Employee") {
        const ausUrl = `https://info.aec.edu.in/aus/employeephotos/${user.institutionId}.jpg`;
        const aecUrl = `https://info.aec.edu.in/aec/employeephotos/${user.institutionId}.jpg`;
        const acetUrl = `https://info.aec.edu.in/acet/employeephotos/${user.institutionId}.jpg`;

        if (await checkImage(aecUrl)) {
          if (isMounted) setImageSrc(aecUrl);
        } else if (await checkImage(ausUrl)) {
          if (isMounted) setImageSrc(ausUrl);
        } else if (await checkImage(acetUrl)) {
          if (isMounted) setImageSrc(acetUrl);
        } else {
          if (isMounted) setImageSrc(null);
        }
      } else if (user.userType === "Student") {
        const studentUrl = `https://info.aec.edu.in/adityacentral/StudentPhotos/${user.institutionId}.jpg`;
        if (await checkImage(studentUrl)) {
          if (isMounted) setImageSrc(studentUrl);
        } else {
          if (isMounted) setImageSrc(null);
        }
      } else {
        if (isMounted) setImageSrc(null);
      }
    };

    resolveHeaderImage();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const initials = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  const open = Boolean(anchorEl);

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        pl: { xs: 0.1, md: 3 },
        pr: { xs: 1.5, md: 3 },
        py: { xs: 1.2, md: 1.2 },
        height: { xs: "70px", md: "88px" },
        boxSizing: "border-box",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        background: "var(--gradient-primary)",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      <GlobalFeedbackPrompt />
      {/* LEFT SECTION: Logo */}
      <Box sx={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
        {/* LOGO: Use short logo on mobile, long logo on desktop */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            height: { xs: 45, md: 52 },
          }}
        >
          {/* Mobile Logo (Short) */}
          <Box sx={{ display: { xs: "flex", md: "none" }, flexShrink: 0, alignItems: "center", pl: 2 }}>
            <img
              src={isDarkMode ? circleLogoWhite : logoDarkTheme}
              alt="Aditya University Logo"
              style={{
                display: "block",
                height: "50px",
                width: "48px",
                objectFit: "cover"
              }}
            />
          </Box>
          {/* Desktop Logo (Long) */}
          <Box sx={{ display: { xs: "none", md: "flex" }, flexShrink: 0, alignItems: "center" }}>
            <img
              src={isDarkMode ? smallLogoWhite : universityLogoGold}
              alt="Aditya University Logo"
              style={{
                display: "block",
                height: "60px",
                width: "auto",
                objectFit: "contain",
                marginTop: "10px",
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* CENTER SECTION: Search Bar */}
      <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", justifyContent: "center", flex: 1 }}>
        <HeaderSearch activeRole={activeRole} />
      </Box>

      {/* RIGHT SECTION: Notifications & Profile Pill */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: { xs: 1, md: 2 }, flex: 1 }}>
        <NotificationBell ref={notifRef} />

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
            maxWidth: open ? "400px" : "48px", // Collapsed = perfect circle (matches height)
            boxSizing: "border-box",
            overflow: "hidden",
            "&:hover": {
              maxWidth: "400px", // Expand on hover
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
              pl: 2,
              pr: 1,
              overflow: "hidden",
              flex: 1,
              minWidth: 0
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", overflow: "hidden", width: "100%", minWidth: 0 }}>
              <Typography noWrap sx={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1, mb: 0.2, width: "100%" }}>
                {user?.name || "System User"}
              </Typography>
              <Typography noWrap sx={{ fontSize: "0.7rem", fontWeight: 500, color: "var(--text-secondary)", lineHeight: 1, width: "100%" }}>
                {user?.designation || capitalizeRole(activeRole) || "User"}
              </Typography>
            </Box>
            <KeyboardArrowDown
              sx={{
                display: { xs: "none", sm: "block" },
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
          <Box sx={{ px: 2, pt: 1, pb: 1 }}>
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
              sx={{ display: { xs: "flex", md: "none" }, alignItems: "center", gap: 1.5, py: 1.2, px: 2, mb: 0.5, mx: 1.5, borderRadius: "10px", fontWeight: 600, fontSize: "0.85rem", color: "var(--text-secondary)", "&:hover": { background: "var(--bg-panel)" } }}
              onClick={() => {
                const pillAnchor = anchorEl;
                handleClose();
                setTimeout(() => {
                  notifRef.current?.openMobile(pillAnchor);
                }, 150); // slight delay to allow menu to unmount smoothly
              }}
            >
              <Notifications fontSize="small" sx={{ color: "var(--text-secondary)" }} />
              <Box sx={{ flexGrow: 1 }}>Notifications</Box>
              {notifRef.current?.unreadCount > 0 && (
                <Badge badgeContent={notifRef.current?.unreadCount} color="error" sx={{ mr: 2 }} />
              )}
            </MenuItem>

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
              <ThemeToggle onToggle={handleClose} />
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
