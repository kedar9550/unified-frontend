import React from "react";
import { Paper, Tabs, Tab, Box, IconButton, Divider } from "@mui/material";
import { ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from "@mui/icons-material";

export default function CustomTabs({
  tabs = [],
  value = 0,
  onChange,
  variant,
  sx = {},
  ...props
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        mt: 3,
        mb: 3,
        mx: { xs: 0, md: "auto" },
        borderRadius: "9999px",
        border: "1px solid var(--border-color)",
        background: "var(--bg-paper)",
        p: 0.5,
        boxShadow: "0 2px 12px rgba(0, 0, 0, 0.03)",
        display: "flex",
        width: { xs: "100%", md: "fit-content" },
        maxWidth: "100%",
        boxSizing: "border-box",
        ...sx,
      }}
    >
      {/* Mobile View */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, width: '100%', alignItems: 'center', justifyContent: 'space-between' }}>
        <IconButton size="small" onClick={(e) => onChange(e, Math.max(0, value - 1))} disabled={value <= 0} sx={{ ml: 0.5 }}>
          <ChevronLeftIcon />
        </IconButton>
        
        <Divider orientation="vertical" flexItem sx={{ my: 1, borderColor: 'var(--border-color)' }} />
        
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Box sx={{
            background: "var(--bg-accent-4)",
            color: "var(--color-primary)",
            fontWeight: 700,
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            py: { xs: 0.75, sm: 1 },
            px: { xs: 2, sm: 2.5 },
            borderRadius: "9999px",
            fontSize: { xs: "0.825rem", sm: "0.875rem" },
            display: "flex",
            alignItems: "center"
          }}>
            {tabs[value]?.icon && React.cloneElement(tabs[value].icon, {
              sx: { fontSize: 18, mr: 0.5, color: "inherit", ...(tabs[value].icon.props?.sx || {}) }
            })}
            {tabs[value]?.label}
          </Box>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ my: 1, borderColor: 'var(--border-color)' }} />
        
        <IconButton size="small" onClick={(e) => onChange(e, Math.min(tabs.length - 1, value + 1))} disabled={value >= tabs.length - 1} sx={{ mr: 0.5 }}>
          <ChevronRightIcon />
        </IconButton>
      </Box>

      {/* Desktop View */}
      <Tabs
        value={value}
        onChange={onChange}
        variant={variant || "scrollable"}
        scrollButtons={false}
        allowScrollButtonsMobile={false}
        {...props}
        sx={{
          display: { xs: 'none', md: 'flex' },
          width: "100%",
          minHeight: { xs: "36px", sm: "40px" },
          "& .MuiTabs-scroller": {
            display: "flex",
            overflowX: "auto !important",
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
          },
          "& .MuiTabs-flexContainer": {
            display: "flex",
            width: "100%",
          },
          "& .MuiTabs-indicator": {
            display: "none",
          },
          "& .MuiTabs-scrollButtons": {
            display: "none !important",
          },
          "& .MuiTab-root": {
            flex: "0 0 auto",
            flexGrow: 0,
            flexShrink: 0,
            width: "auto",
            maxWidth: "none",
            minWidth: "auto",
            minHeight: { xs: "36px", sm: "40px" },
            py: { xs: 0.75, sm: 1 },
            px: { xs: 2, sm: 2.5, md: 3 },
            textTransform: "none",
            fontWeight: 600,
            fontSize: { xs: "0.825rem", sm: "0.875rem", md: "0.9rem" },
            whiteSpace: "nowrap !important",
            wordBreak: "normal !important",
            lineHeight: 1.25,
            textAlign: "center !important",
            justifyContent: "center !important",
            alignItems: "center !important",
            display: "inline-flex !important",
            flexDirection: "row !important",
            color: "var(--text-secondary)",
            borderRadius: "9999px",
            transition: "all 0.2s ease",
            position: "relative",
            "& span, & div": {
              alignItems: "center !important",
              justifyContent: "center !important",
              textAlign: "center !important",
              whiteSpace: "nowrap !important",
            },
            "&.Mui-selected": {
              background: "var(--bg-accent-4)",
              color: "var(--color-primary)",
              fontWeight: 700,
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              "& .MuiSvgIcon-root": {
                color: "inherit",
              }
            },
            "&:hover:not(.Mui-selected)": {
              background: "var(--bg-hover)",
              color: "var(--text-primary)",
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
