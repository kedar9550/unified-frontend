import React from "react";
import { Paper, Tabs, Tab } from "@mui/material";

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
        borderRadius: "16px",
        border: "1px solid var(--border-color)",
        background: "var(--bg-paper)",
        overflow: "hidden",
        boxShadow: "0 2px 12px rgba(0, 0, 0, 0.03)",
        display: "flex",
        width: { xs: "100%", md: "fit-content" },
        maxWidth: "100%",
        boxSizing: "border-box",
        ...sx,
      }}
    >
      <Tabs
        value={value}
        onChange={onChange}
        variant={variant || "scrollable"}
        scrollButtons={false}
        allowScrollButtonsMobile={false}
        {...props}
        sx={{
          width: "100%",
          minHeight: { xs: "46px", sm: "52px" },
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
            minHeight: { xs: "46px", sm: "52px" },
            py: { xs: 1, sm: 1.25 },
            px: { xs: 2, sm: 2.5, md: 3.5 },
            textTransform: "none",
            fontWeight: 700,
            fontSize: { xs: "0.825rem", sm: "0.875rem", md: "0.925rem" },
            whiteSpace: "nowrap !important",
            wordBreak: "normal !important",
            lineHeight: 1.25,
            textAlign: "center !important",
            justifyContent: "center !important",
            alignItems: "center !important",
            display: "inline-flex !important",
            flexDirection: "row !important",
            color: "var(--text-secondary)",
            borderRight: "1px solid var(--border-color)",
            transition: "all 0.2s ease",
            position: "relative",
            "&:last-of-type": {
              borderRight: "none",
            },
            "& span, & div": {
              display: "inline-flex !important",
              alignItems: "center !important",
              justifyContent: "center !important",
              textAlign: "center !important",
              whiteSpace: "nowrap !important",
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
