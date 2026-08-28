import React from "react";
import { Box, Typography } from "@mui/material";
import InboxIcon from "@mui/icons-material/Inbox";

/**
 * EmptyState Component
 * Standardized empty state card for missing data, search results, or empty lists.
 */
export default function EmptyState({
  title = "No data found",
  description = "There are no records to display at this time.",
  icon,
  action,
  sx = {},
  className = "",
}) {
  return (
    <Box
      className={`empty-state ${className}`}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        py: { xs: "var(--space-8)", md: "var(--space-10)" },
        px: "var(--space-6)",
        borderRadius: "var(--radius-lg)",
        background: "var(--bg-panel)",
        border: "1px dashed var(--border-color)",
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
          background: "var(--bg-accent-4)",
          color: "var(--color-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 2,
        }}
      >
        {icon || <InboxIcon sx={{ fontSize: 28 }} />}
      </Box>

      <Typography variant="h6" sx={{ fontWeight: 700, color: "var(--text-primary)", mb: 0.5 }}>
        {title}
      </Typography>

      {description && (
        <Typography variant="body2" sx={{ color: "var(--text-secondary)", maxWidth: 420, mb: action ? 2.5 : 0 }}>
          {description}
        </Typography>
      )}

      {action && <Box sx={{ mt: 1 }}>{action}</Box>}
    </Box>
  );
}
