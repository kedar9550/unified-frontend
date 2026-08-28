import React from "react";
import { Box, Typography, Button } from "@mui/material";
import ErrorIcon from "@mui/icons-material/Error";

/**
 * ErrorState Component
 * Standardized error state feedback card with retry trigger.
 */
export default function ErrorState({
  title = "Something went wrong",
  message = "Failed to load content. Please try again.",
  onRetry,
  sx = {},
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        py: 6,
        px: 3,
        borderRadius: "var(--radius-lg)",
        background: "var(--bg-panel)",
        border: "1px solid rgba(239, 68, 68, 0.2)",
        width: "100%",
        boxSizing: "border-box",
        ...sx,
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "rgba(239, 68, 68, 0.1)",
          color: "var(--danger)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 2,
        }}
      >
        <ErrorIcon sx={{ fontSize: 32 }} />
      </Box>

      <Typography variant="h6" sx={{ fontWeight: 700, color: "var(--text-primary)", mb: 0.5 }}>
        {title}
      </Typography>

      <Typography variant="body2" sx={{ color: "var(--text-secondary)", maxWidth: 420, mb: onRetry ? 2.5 : 0 }}>
        {message}
      </Typography>

      {onRetry && (
        <Button
          variant="contained"
          onClick={onRetry}
          sx={{
            borderRadius: "var(--radius-pill)",
            textTransform: "none",
            fontWeight: 700,
            background: "linear-gradient(135deg, #ef4444, #dc2626)",
            "&:hover": { background: "linear-gradient(135deg, #dc2626, #b91c1c)" },
          }}
        >
          Try Again
        </Button>
      )}
    </Box>
  );
}
