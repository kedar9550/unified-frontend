import React, { useState, useEffect } from "react";
import { Box } from "@mui/material";
import { LightMode, DarkMode } from "@mui/icons-material";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    // Apply theme class to body and save to localStorage
    if (isDark) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const handleToggle = () => {
    setIsDark(!isDark);
  };

  return (
    <Box
      onClick={handleToggle}
      sx={{
        width: 64,
        height: 32,
        borderRadius: "16px",
        background: isDark 
          ? "linear-gradient(135deg, #1e293b, #0f172a)" 
          : "linear-gradient(135deg, #f1f5f9, #e2e8f0)",
        display: "flex",
        alignItems: "center",
        padding: "4px",
        cursor: "pointer",
        position: "relative",
        boxShadow: isDark 
          ? "inset 0 2px 6px rgba(0,0,0,0.6)" 
          : "inset 0 2px 4px rgba(0,0,0,0.1)",
        transition: "background 0.3s ease, box-shadow 0.3s ease",
      }}
    >
      {/* Background Icons (visible when thumb is on the other side) */}
      <LightMode 
        sx={{ 
          fontSize: 16, 
          color: "#94a3b8", 
          position: "absolute", 
          left: 8,
          opacity: isDark ? 0.7 : 0,
          transition: "opacity 0.3s ease"
        }} 
      />
      <DarkMode 
        sx={{ 
          fontSize: 16, 
          color: "#94a3b8", 
          position: "absolute", 
          right: 8,
          opacity: isDark ? 0 : 0.7,
          transition: "opacity 0.3s ease"
        }} 
      />

      {/* Sliding Thumb */}
      <Box
        sx={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: "#ffffff",
          boxShadow: isDark 
            ? "0 2px 8px rgba(0,0,0,0.4)" 
            : "0 2px 6px rgba(0,0,0,0.15)",
          position: "absolute",
          left: isDark ? "calc(100% - 28px)" : "4px",
          transition: "all 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55)", // Bouncy elastic transition
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2,
        }}
      >
        {isDark ? (
          <DarkMode sx={{ fontSize: 14, color: "#0f172a" }} />
        ) : (
          <LightMode sx={{ fontSize: 14, color: "#f59e0b" }} />
        )}
      </Box>
    </Box>
  );
}
