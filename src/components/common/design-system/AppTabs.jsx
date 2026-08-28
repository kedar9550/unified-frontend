import React from "react";
import { Tabs, Tab, Paper, useMediaQuery, useTheme } from "@mui/material";

/**
 * AppTabs Component
 * Standardized tabs component wrapping MUI Tabs & Tab with token-based indicator,
 * background, active state, and mobile scroll support.
 */
export default function AppTabs({
  value,
  onChange,
  tabs = [], // Array of { label, icon, value }
  variant = "standard",
  sx = {},
  className = "",
  ...props
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Paper
      className={`app-tabs-wrapper ${className}`}
      sx={{
        mb: "var(--space-6)",
        p: 1,
        background: "var(--bg-glass)",
        backdropFilter: "blur(12px)",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-sm)",
        ...sx,
      }}
    >
      <Tabs
        value={value}
        onChange={onChange}
        variant={variant === "fullWidth" || isMobile ? "fullWidth" : "standard"}
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{
          minHeight: "44px",
          "& .MuiTabs-flexContainer": { gap: { xs: 0.5, sm: 1 } },
          "& .MuiTab-root": {
            color: "var(--text-secondary)",
            fontWeight: 700,
            minHeight: "44px",
            borderRadius: "var(--radius-md)",
            transition: "all 0.3s ease",
            textTransform: "none",
            px: { xs: 1.5, sm: 3 },
            fontSize: { xs: "0.85rem", sm: "0.95rem" },
            "&:hover": {
              color: "var(--text-primary)",
              background: "var(--bg-hover)",
            },
          },
          "& .Mui-selected": {
            color: "var(--color-primary) !important",
            background: "var(--bg-accent-4) !important",
          },
          "& .MuiTabs-indicator": {
            backgroundColor: "var(--color-primary)",
            height: "3px",
            borderRadius: "3px 3px 0 0",
          },
        }}
        {...props}
      >
        {tabs.map((tab, idx) => (
          <Tab
            key={tab.value ?? idx}
            value={tab.value ?? idx}
            label={tab.label}
            icon={tab.icon}
            iconPosition={tab.iconPosition || "start"}
            disabled={tab.disabled}
          />
        ))}
      </Tabs>
    </Paper>
  );
}
