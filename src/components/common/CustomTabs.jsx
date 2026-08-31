import React from "react";
import { Paper, Tabs, Tab } from "@mui/material";

export default function CustomTabs({
  tabs = [],
  value = 0,
  onChange,
  variant = "fullWidth",
  sx = {},
  ...props
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        mt: 3,
        mb: 3,
        borderRadius: "16px",
        border: "1px solid var(--border-color)",
        background: "var(--bg-paper)",
        overflow: "hidden",
        boxShadow: "0 2px 12px rgba(0, 0, 0, 0.03)",
        ...sx,
      }}
    >
      <Tabs
        value={value}
        onChange={onChange}
        variant={variant}
        scrollButtons="auto"
        allowScrollButtonsMobile
        {...props}
        sx={{
          minHeight: { xs: "50px", sm: "56px" },
          "& .MuiTabs-indicator": {
            display: "none",
          },
          "& .MuiTab-root": {
            minHeight: { xs: "50px", sm: "56px" },
            py: { xs: 1, sm: 1.5 },
            px: { xs: 1, sm: 2, md: 3 },
            textTransform: "none",
            fontWeight: 700,
            fontSize: { xs: "0.75rem", sm: "0.85rem", md: "0.925rem" },
            whiteSpace: { xs: "normal", md: "nowrap" },
            lineHeight: 1.25,
            textAlign: "center",
            wordBreak: "break-word",
            color: "var(--text-secondary)",
            borderRight: "1px solid var(--border-color)",
            transition: "all 0.2s ease",
            position: "relative",
            "&:last-of-type": {
              borderRight: "none",
            },
            "&.Mui-selected": {
              background: "var(--bg-accent-4)",
              fontWeight: 800,
              "&::after": {
                content: '""',
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "3.5px",
                background: "var(--gradient-primary)",
                borderRadius: "3px 3px 0 0",
              },
              "& .MuiSvgIcon-root": {
                color: "var(--color-primary)",
              },
              "&, & span": {
                background: "var(--gradient-primary)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              },
            },
            "&:hover:not(.Mui-selected)": {
              background: "var(--bg-hover)",
            },
          },
        }}
      >
        {tabs.map((tab, idx) => (
          <Tab
            key={tab.key || idx}
            label={tab.label}
            icon={
              tab.icon ? (
                React.cloneElement(tab.icon, {
                  sx: {
                    fontSize: { xs: 18, sm: 22, md: 24 },
                    mr: { xs: 0.5, sm: 1 },
                    color: value === idx ? "var(--color-primary)" : "var(--text-secondary)",
                    ...(tab.icon.props?.sx || {}),
                  },
                })
              ) : undefined
            }
            iconPosition={tab.iconPosition || "start"}
            disabled={tab.disabled}
          />
        ))}
      </Tabs>
    </Paper>
  );
}
