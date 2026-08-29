import React from "react";
import { Box } from "@mui/material";

/**
 * PageContainer Component
 * Reusable layout wrapper providing consistent horizontal/vertical margins, padding,
 * and maximum content width constraint across all pages and modules.
 */
export default function PageContainer({
  children,
  maxWidth = "var(--content-max-width)",
  px,
  py,
  sx = {},
  className = "",
  item,
  ...props
}) {
  return (
    <Box
      className={`page-container ${className}`}
      sx={{
        width: "100%",
        maxWidth: maxWidth,
        mx: "auto",
        px: px ?? 0,
        py: py ?? 0,
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-6)",
        boxSizing: "border-box",
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
}
