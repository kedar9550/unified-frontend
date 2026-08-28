import React from "react";
import { Paper } from "@mui/material";

/**
 * ModuleCard Component
 * Reusable card component sharing uniform background, border, radius, padding,
 * and hover animations across all modules.
 */
export default function ModuleCard({
  children,
  elevation = 0,
  hoverable = true,
  p,
  sx = {},
  className = "",
  ...props
}) {
  return (
    <Paper
      className={`module-card ${className}`}
      elevation={elevation}
      sx={{
        width: "100%",
        p: p ?? { xs: "var(--space-4)", sm: "var(--space-6)" },
        borderRadius: "var(--radius-lg)",
        background: "var(--bg-panel)",
        border: "1px solid var(--border-color)",
        boxShadow: "var(--shadow-premium)",
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        ...(hoverable && {
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
          },
        }),
        ...sx,
      }}
      {...props}
    >
      {children}
    </Paper>
  );
}
