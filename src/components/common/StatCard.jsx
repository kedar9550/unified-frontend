import React from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
import { useTheme } from "@mui/material/styles";
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
  color = "#3b82f6",
  iconColor,
  gradient,
  bg,
  actionText,
  linkText,
  onClick,
  onActionClick,
  sx = {},
}) {
  const theme = useTheme();

  const resolveColor = (c) => {
    if (c === 'primary') return theme.palette.primary.main;
    if (c === 'secondary') return theme.palette.secondary.main;
    if (c === 'success') return theme.palette.success.main;
    if (c === 'error') return theme.palette.error.main;
    if (c === 'warning') return theme.palette.warning.main;
    if (c === 'info') return theme.palette.info.main;
    return c;
  };

  const displayTitle = title || label;
  const displayValue = value !== undefined ? value : (score !== undefined ? score : 0);
  const displaySub = subtitle || sub || subtext || (max ? `Max Score: ${max}` : null);

  // If there is an actionText or linkText, we show it. 
  // If not, but there is an onClick handler, we can optionally show "View Details" to match the design pattern, 
  // but to preserve existing behavior we only show the link if text is explicitly provided or if we want a default.
  // We'll default to "View Details" if clickable, to match the modern dashboard aesthetic in the image.
  const isClickable = Boolean(onClick || onActionClick);
  const displayLink = actionText || linkText || (isClickable ? "View Details" : null);

  const rawColor = color || iconColor || "#3b82f6";
  const cardColor = resolveColor(rawColor);
  const iconGradient = gradient || `linear-gradient(135deg, ${cardColor} 0%, ${cardColor}dd 100%)`;

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
        containerType: "inline-size",
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        p: { xs: 1.5, sm: 2, lg: 2.5 },
        borderRadius: "16px",
        background: "var(--bg-panel, #ffffff)",
        border: "1px solid var(--border-color, #e2e8f0)",
        boxShadow: "var(--shadow-premium, 0 10px 30px rgba(0,0,0,0.05))",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        cursor: isClickable ? "pointer" : "default",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: { xs: "135px", sm: "160px" },
        "&:hover": {
          transform: isClickable ? "translateY(-5px)" : "none",
          boxShadow: isClickable ? "0 12px 40px rgba(0,0,0,0.12)" : "var(--shadow-premium, 0 10px 30px rgba(0,0,0,0.05))",
        },
        "&::after": {
          content: '""',
          position: "absolute",
          top: 0,
          right: 0,
          width: { xs: "90px", sm: "120px" },
          height: { xs: "90px", sm: "120px" },
          background: `radial-gradient(circle at top right, ${cardColor}25, transparent 70%)`,
          zIndex: 0,
          pointerEvents: "none",
          transition: 'all 0.5s ease',
        },
        ...sx,
      }}
    >
      {/* Top Content: Left Aligned */}
      <Box sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        gap: { xs: 1.25, sm: 1.5, lg: 2 },
        textAlign: "left",
        position: "relative",
        zIndex: 1,
        width: "100%",
        minWidth: 0
      }}>
        {icon && (
          <Box
            sx={{
              width: "clamp(48px, 16cqw, 56px)",
              height: "clamp(48px, 16cqw, 56px)",
              borderRadius: { xs: "8px", sm: "10px", lg: "12px" },
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: iconGradient,
              color: "#ffffff",
              flexShrink: 0,
              mt: 0.5,
              boxShadow: `0 8px 25px ${cardColor}35`,
              "& svg": {
                fontSize: "clamp(1.4rem, 8cqw, 2rem)"
              }
            }}
          >
            {icon}
          </Box>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", minWidth: 0, width: "100%" }}>
          {displayTitle && (
            <Typography
              variant="body2"
              title={displayTitle}
              sx={{
                fontSize: "clamp(0.65rem, 5cqw, 0.8rem)",
                fontWeight: 600,
                color: "var(--text-secondary, #475569)",
                textTransform: "capitalize",
                letterSpacing: "0.5px",
                width: "100%",
                wordBreak: "break-word",
              }}
            >
              {displayTitle}
            </Typography>
          )}
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 0.5, width: "100%", minWidth: 0 }}>
            <Typography
              title={String(displayValue)}
              sx={{
                fontWeight: 800,
                color: "var(--text-primary, #0f172a)",
                mt: 0.5,
                fontSize: String(displayValue).length > 6 ? "clamp(0.9rem, 8cqw, 1.2rem)" : "clamp(1.1rem, 10cqw, 1.6rem)",
                lineHeight: 1.1,
                width: "100%",
                wordBreak: "break-word",
              }}
            >
              {displayValue}
            </Typography>

            {displaySub && (
              <Box sx={{ mt: 0.5 }}>
                <Typography
                  sx={{
                    fontSize: "clamp(0.65rem, 4.5cqw, 0.8rem)",
                    fontWeight: 600,
                    color: "var(--text-secondary, #64748b)",
                    opacity: 0.8,
                    wordBreak: "break-word",
                  }}
                >
                  {displaySub}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* Bottom Link: Right Aligned */}
      {displayLink ? (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', position: "relative", zIndex: 1, mt: "auto", pt: 1 }}>
          <Button
            size="small"
            onClick={handleActionClick}
            endIcon={<ArrowForwardIcon sx={{ fontSize: { xs: 12, sm: 14 } }} />}
            sx={{
              textTransform: "none",
              fontSize: { xs: "0.725rem", sm: "0.8rem" },
              fontWeight: 700,
              color: "var(--color-primary, #3b82f6)",
              p: 0,
              "&:hover": { background: "transparent", opacity: 0.8 },
            }}
          >
            {displayLink}
          </Button>
        </Box>
      ) : (
        <Box sx={{ mt: "auto" }} />
      )}
    </Paper>
  );
}
