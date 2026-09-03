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
        p: { xs: 2, sm: 2.5 },
        borderRadius: { xs: "16px", sm: "24px" },
        background: `linear-gradient(135deg, ${cardColor}12 0%, ${cardColor}03 100%)`,
        backdropFilter: 'blur(12px)',
        border: `1px solid ${cardColor}25`,
        boxShadow: `0 8px 32px -8px ${cardColor}20`,
        position: "relative",
        overflow: "hidden",
        transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        cursor: onClick || onActionClick ? "pointer" : "default",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: { xs: "120px", sm: "140px" },
        "&:hover": {
          transform: "translateY(-6px) scale(1.02)",
          boxShadow: `0 20px 40px -12px ${cardColor}40`,
          borderColor: `${cardColor}50`,
          background: `linear-gradient(135deg, ${cardColor}18 0%, ${cardColor}08 100%)`,
        },
        "&::after": {
          content: '""',
          position: "absolute",
          top: -30,
          right: -30,
          width: "140px",
          height: "140px",
          background: `radial-gradient(circle, ${cardColor}25 0%, transparent 70%)`,
          zIndex: 0,
          pointerEvents: "none",
          transition: 'all 0.5s ease',
        },
        "&:hover::after": {
          transform: 'scale(1.5)',
          opacity: 0.9,
        },
        ...sx,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: 'space-between', zIndex: 1, position: "relative", mb: 2 }}>
        <Box sx={{ flex: 1, minWidth: 0, pr: 2 }}>
           {displayTitle && (
             <Typography
                noWrap
                title={displayTitle}
                sx={{
                  fontSize: { xs: "0.75rem", sm: "0.85rem" },
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  mb: 0.5,
                }}
              >
                {displayTitle}
              </Typography>
           )}
            <Typography
              noWrap
              title={String(displayValue)}
              sx={{
                fontSize: { xs: "1.5rem", sm: "1.85rem", md: "2.1rem" },
                fontWeight: 900,
                color: "var(--text-primary)",
                lineHeight: 1.1,
                textShadow: `0 2px 10px ${cardColor}20`,
                display: 'flex',
                alignItems: 'baseline',
                gap: 0.5
              }}
            >
              {displayValue}
            </Typography>
        </Box>
        
        {icon && (
          <Box
            sx={{
              width: { xs: 48, sm: 56 },
              height: { xs: 48, sm: 56 },
              borderRadius: { xs: "14px", sm: "18px" },
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: `linear-gradient(135deg, ${cardColor} 0%, ${cardColor}dd 100%)`,
              color: "#ffffff",
              flexShrink: 0,
              boxShadow: `0 8px 24px ${cardColor}50, inset 0 2px 0 rgba(255,255,255,0.2)`,
              position: "relative",
              overflow: "hidden",
              transition: 'transform 0.3s ease',
              "&:hover": {
                transform: 'rotate(5deg) scale(1.05)'
              },
              "& svg": {
                fontSize: { xs: 24, sm: 28 },
                color: "#ffffff",
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
              },
            }}
          >
            {icon}
          </Box>
        )}
      </Box>

      {(displaySub || displayLink) && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            zIndex: 1,
            position: "relative",
            mt: 'auto',
          }}
        >
          <Box>
            {displaySub && (
              <Typography
                noWrap
                sx={{
                  fontSize: { xs: "0.75rem", sm: "0.8rem" },
                  fontWeight: 700,
                  color: cardColor,
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: `${cardColor}15`,
                  px: 1.25,
                  py: 0.5,
                  borderRadius: '8px'
                }}
              >
                {displaySub}
              </Typography>
            )}
          </Box>
          {displayLink && (
            <Button
              size="small"
              onClick={handleActionClick}
              endIcon={<ArrowForwardIcon sx={{ fontSize: "16px !important" }} />}
              sx={{
                textTransform: "none",
                fontSize: { xs: "0.8rem", sm: "0.875rem" },
                fontWeight: 700,
                color: cardColor,
                p: 0,
                minWidth: 0,
                "&:hover": {
                  background: "transparent",
                  transform: 'translateX(4px)',
                },
                transition: 'transform 0.2s',
              }}
            >
              {displayLink}
            </Button>
          )}
        </Box>
      )}
    </Paper>
  );
}
