import React from "react";
import { Button, CircularProgress } from "@mui/material";

/**
 * AppButton Component
 * Standardized button system supporting variants (primary, secondary, outline, ghost, danger, success),
 * min 44px touch height on mobile, loading indicator, and accessible focus states.
 */
export default function AppButton({
  children,
  variant = "primary", // primary | secondary | outline | ghost | danger | success
  size = "md",         // sm | md | lg
  loading = false,
  disabled = false,
  startIcon,
  endIcon,
  sx = {},
  className = "",
  ...props
}) {
  // Map size tokens
  const sizeStyles = {
    sm: { py: 0.8, px: 2, fontSize: "0.8125rem", minHeight: "36px" },
    md: { py: 1.2, px: 3, fontSize: "0.875rem", minHeight: "44px" },
    lg: { py: 1.5, px: 4, fontSize: "1rem", minHeight: "48px" },
  };

  // Map variant styles
  const variantStyles = {
    primary: {
      background: "var(--gradient-primary)",
      color: "#ffffff",
      border: "none",
      boxShadow: "0 4px 14px rgba(0, 78, 146, 0.25)",
      "&:hover": {
        background: "var(--gradient-primary-hover)",
        boxShadow: "0 6px 20px rgba(0, 78, 146, 0.35)",
        transform: "translateY(-1px)",
      },
    },
    secondary: {
      background: "var(--bg-accent-4)",
      color: "var(--color-primary)",
      border: "1px solid var(--border-color)",
      "&:hover": {
        background: "var(--bg-accent-1)",
        transform: "translateY(-1px)",
      },
    },
    outline: {
      background: "transparent",
      color: "var(--text-primary)",
      border: "1px solid var(--border-color)",
      "&:hover": {
        background: "var(--bg-panel)",
        borderColor: "var(--color-primary)",
        color: "var(--color-primary)",
      },
    },
    ghost: {
      background: "transparent",
      color: "var(--text-secondary)",
      border: "none",
      "&:hover": {
        background: "var(--bg-panel)",
        color: "var(--text-primary)",
      },
    },
    danger: {
      background: "linear-gradient(135deg, #ef4444, #dc2626)",
      color: "#ffffff",
      border: "none",
      boxShadow: "0 4px 14px rgba(239, 68, 68, 0.25)",
      "&:hover": {
        background: "linear-gradient(135deg, #dc2626, #b91c1c)",
        boxShadow: "0 6px 20px rgba(239, 68, 68, 0.35)",
        transform: "translateY(-1px)",
      },
    },
    success: {
      background: "linear-gradient(135deg, #10b981, #059669)",
      color: "#ffffff",
      border: "none",
      boxShadow: "0 4px 14px rgba(16, 185, 129, 0.25)",
      "&:hover": {
        background: "linear-gradient(135deg, #059669, #047857)",
        boxShadow: "0 6px 20px rgba(16, 185, 129, 0.35)",
        transform: "translateY(-1px)",
      },
    },
  };

  return (
    <Button
      className={`app-button variant-${variant} size-${size} ${className}`}
      disabled={disabled || loading}
      startIcon={!loading ? startIcon : null}
      endIcon={!loading ? endIcon : null}
      sx={{
        borderRadius: "var(--radius-pill)",
        fontWeight: 700,
        textTransform: "none",
        letterSpacing: "0.01em",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...sx,
      }}
      {...props}
    >
      {loading ? (
        <CircularProgress size={20} color="inherit" sx={{ mr: children ? 1 : 0 }} />
      ) : null}
      {children}
    </Button>
  );
}
