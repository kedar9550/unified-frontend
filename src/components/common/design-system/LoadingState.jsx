import React from "react";
import { Box, Typography } from "@mui/material";
import Loader from "../Loader";

/**
 * LoadingState Component
 * Standardized loading state indicator with optional message.
 */
export default function LoadingState({ message = "Loading...", minHeight = "200px", sx = {} }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight,
        width: "100%",
        gap: 2,
        ...sx,
      }}
    >
      <Loader />
      {message && (
        <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 600 }}>
          {message}
        </Typography>
      )}
    </Box>
  );
}
