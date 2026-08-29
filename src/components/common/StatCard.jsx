import React from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

/**
 * Reusable StatCard Component
 * Premium reusable card for dashboard statistics, counts, and quick actions.
 */
export default function StatCard({
  title,
  label,
  value,
  score,
  max,
  subtitle,
  sub,
  subtext,
  icon,
  color = "#3B82F6",
  iconColor,
  bg,
  actionText,
  linkText,
  onClick,
  onActionClick,
  sx = {},
}) {
  const displayTitle = title || label;
  const displayValue = value !== undefined ? value : (score !== undefined ? score : 0);
  const displaySub = subtitle || sub || subtext || (max ? `Max Score: ${max}` : null);
  const displayLink = actionText || linkText;
  const cardColor = color || iconColor || "#3B82F6";

  const handleCardClick = (e) => {
    if (onClick) {
      onClick(e);
    }
  };

  const handleActionClick = (e) => {
    e.stopPropagation();
    if (onActionClick) {
      onActionClick(e);
    } else if (onClick) {
      onClick(e);
    }
  };

  return (
    <Paper
      elevation={0}
      onClick={handleCardClick}
      sx={{
        flex: 1,
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        p: 2.5,
        borderRadius: "20px",
        background: "var(--bg-paper)",
        border: "1px solid var(--border-color)",
        boxShadow: "var(--shadow-premium)",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        cursor: onClick || onActionClick ? "pointer" : "default",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: "165px",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 12px 35px rgba(0, 0, 0, 0.16)",
          borderColor: cardColor ? `${cardColor}60` : "var(--color-primary)",
        },
        "&::after": {
          content: '""',
          position: "absolute",
          top: 0,
          right: 0,
          width: "140px",
          height: "140px",
          background: `radial-gradient(circle at top right, ${cardColor}20, transparent 70%)`,
          zIndex: 0,
          pointerEvents: "none",
        },
        ...sx,
      }}
    >
      {/* Top Section: Icon + Text Details */}
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, zIndex: 1, position: "relative" }}>
        {icon && (
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: cardColor,
              color: "#ffffff",
              flexShrink: 0,
              boxShadow: `0 6px 16px ${cardColor}40`,
              position: "relative",
              overflow: "hidden",
              "&::after": {
                content: '""',
                position: "absolute",
                inset: 0,
                background: "linear-gradient(180deg, rgba(255,255,255,0.25), transparent)",
                borderRadius: "14px",
              },
              "& svg": {
                fontSize: 24,
                color: "#ffffff",
              },
            }}
          >
            {icon}
          </Box>
        )}

        <Box sx={{ flex: 1, minWidth: 0 }}>
          {displayTitle && (
            <Typography
              sx={{
                fontSize: "0.75rem",
                fontWeight: 800,
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                mb: 0.5,
                lineHeight: 1.25,
                wordBreak: "break-word",
              }}
            >
              {displayTitle}
            </Typography>
          )}

          <Typography
            sx={{
              fontSize: "2rem",
              fontWeight: 900,
              color: "var(--text-primary)",
              lineHeight: 1,
              my: 0.5,
            }}
          >
            {displayValue}
          </Typography>

          {displaySub && (
            <Typography
              noWrap
              sx={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--text-secondary)",
                opacity: 0.85,
                mt: 0.5,
              }}
            >
              {displaySub}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Bottom Section: Divider + Action Link */}
      {displayLink && (
        <Box
          sx={{
            mt: 2,
            pt: 1.5,
            borderTop: "1px solid var(--border-color)",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            zIndex: 1,
            position: "relative",
          }}
        >
          <Button
            size="small"
            onClick={handleActionClick}
            endIcon={<ArrowForwardIcon sx={{ fontSize: "16px !important", color: "var(--color-primary)" }} />}
            sx={{
              textTransform: "none",
              fontSize: "0.825rem",
              fontWeight: 700,
              color: "var(--color-primary)",
              p: 0,
              minWidth: 0,
              "&:hover": {
                background: "transparent",
                opacity: 0.85,
              },
            }}
          >
            {displayLink}
          </Button>
        </Box>
      )}
    </Paper>
  );
}
