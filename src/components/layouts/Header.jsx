import React, { useState } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import {
  Menu as MenuIcon,
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { useLocation } from "react-router-dom";

const Header = ({ onMenuClick }) => {
  const { user } = useAuth();
  const [imgError, setImgError] = useState(false);

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

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0, // Removed top margin
        left: { xs: 0, md: 270 }, // Corrected back to 270 to match sidebar
        right: 0, // Removed offset to allow full-width header
        zIndex: 1100,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        px: { xs: 1.5, md: 3 }, // Adjusted padding for full-width feel
        py: { xs: 1.5, md: 1.5 },
        pointerEvents: "none",
        transition: "all 0.3s ease",
        // Unified Dark Glassmorphism background
        background: {
          xs: "rgba(255, 255, 255, 0.45)",
          md: "rgba(60, 80, 160, 0.35)" // Match sidebar exactly
        },
        backdropFilter: "blur(25px) saturate(180%)",
        WebkitBackdropFilter: "blur(25px) saturate(180%)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
        borderRadius: 0, // Removed rounded corners
        borderLeft: { xs: "none", md: "1px solid rgba(255, 255, 255, 0.15)" }
      }}
    >
      {/* LEFT SECTION: Menu Toggle (Mobile) */}
      <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, md: 2 }, pointerEvents: "auto" }}>
        <IconButton
          onClick={onMenuClick}
          sx={{
            display: { md: "none" },
            background: "rgba(11, 82, 153, 0.1)", // Light primary blue background
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(11, 82, 153, 0.2)",
            color: "#0b5299", // Primary dark blue for high contrast
            "&:hover": { background: "rgba(11, 82, 153, 0.2)" },
          }}
        >
          <MenuIcon />
        </IconButton>
      </Box>

      {/* RIGHT SECTION: Profile Pill */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, pointerEvents: "auto" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.2, // Reduced from 1.5
            px: { xs: 0, sm: 1.1 }, // Reduced from 2.2 for tighter fit
            py: { xs: 0, sm: 0.8 }, // Reduced from 0.8
            borderRadius: "999px",
            background: { xs: "transparent", sm: "rgba(255, 255, 255, 0.12)" },
            backdropFilter: { xs: "none", sm: "blur(20px)" },
            border: { xs: "none", sm: "1px solid rgba(255, 255, 255, 0.2)" },
            boxShadow: { xs: "none", sm: "0 4px 15px rgba(0,0,0,0.1)" },
            transition: "all 0.3s ease",
            "&:hover": { background: "rgba(255, 255, 255, 0.18)" }
          }}
        >
          {/* User Section */}
          <Typography
            sx={{
              display: { xs: "none", sm: "block" },
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "#fff",
              letterSpacing: "0.2px",
              textShadow: "0 1px 2px rgba(0,0,0,0.2)"
            }}
          >
            {user?.name || "User"}
          </Typography>
          <Box
            sx={{
              width: { xs: 38, sm: 42 },
              height: { xs: 38, sm: 42 },
              borderRadius: "50%",
              overflow: "hidden",
              border: "2px solid #fff",
              boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
              background: "linear-gradient(135deg, #7398e8, #5a82d8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {imageSrc && !imgError ? (
              <Box component="img" src={imageSrc} onError={() => setImgError(true)} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#fff" }}>{initials}</Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};


export default Header;
