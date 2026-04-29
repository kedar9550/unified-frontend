import React, { useState } from "react";
import { Box, Typography, IconButton, Menu, MenuItem, Fade } from "@mui/material";
import {
  Menu as MenuIcon,
  KeyboardArrowDown
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

const Header = ({ onMenuClick }) => {
  const { user, activeRole, switchRole } = useAuth();
  const [imgError, setImgError] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleProfileClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
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
              background: "linear-gradient(135deg, #7398e8, #5a82d8)",
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
              minWidth: 180,
              borderRadius: "12px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
              border: "1px solid #e2e8f0",
              p: 0.5
            }
          }}
        >
          <Box sx={{ px: 2, py: 1, borderBottom: "1px solid #f1f5f9", mb: 0.5 }}>
            <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Switch Role
            </Typography>
          </Box>
          {user?.roles?.map((r) => (
            <MenuItem 
              key={r.role} 
              onClick={() => handleRoleSwitch(r.role)}
              selected={r.role === activeRole}
              sx={{
                borderRadius: "8px",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: r.role === activeRole ? "#3b82f6" : "#475569",
                background: r.role === activeRole ? "#eff6ff !important" : "transparent",
                py: 1,
                mb: 0.2,
                "&:hover": {
                  background: "#f8fafc"
                }
              }}
            >
              {r.role}
            </MenuItem>
          ))}
        </Menu>
      </Box>
    </Box>
  );
};

export default Header;
