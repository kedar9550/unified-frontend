import React from "react";
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  FormHelperText,
  InputLabel,
} from "@mui/material";

/**
 * FormFieldWrapper Component
 * Reusable wrapper for form fields ensuring consistent labels, error state, and spacing.
 */
export function FormFieldWrapper({ label, required, error, helperText, children, sx = {} }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8, width: "100%", ...sx }}>
      {label && (
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            color: error ? "var(--danger)" : "var(--text-secondary)",
            fontSize: "0.8125rem",
            textTransform: "none",
            letterSpacing: "0.01em",
          }}
        >
          {label} {required && <Box component="span" sx={{ color: "var(--danger)" }}>*</Box>}
        </Typography>
      )}
      {children}
      {helperText && (
        <Typography
          variant="caption"
          sx={{
            color: error ? "var(--danger)" : "var(--text-secondary)",
            fontSize: "0.75rem",
            mt: 0.2,
          }}
        >
          {helperText}
        </Typography>
      )}
    </Box>
  );
}

/**
 * FormInput Component
 * Standardized text field input component.
 */
export function FormInput({
  label,
  required,
  error,
  helperText,
  size = "medium",
  sx = {},
  ...props
}) {
  return (
    <FormFieldWrapper label={label} required={required} error={error} helperText={helperText}>
      <TextField
        fullWidth
        error={Boolean(error)}
        size={size}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: "var(--radius-md)",
            background: "var(--bg-paper)",
            minHeight: "44px",
            color: "var(--text-primary)",
            transition: "all 0.3s ease",
            "& fieldset": {
              borderColor: "var(--border-color)",
            },
            "&:hover fieldset": {
              borderColor: "var(--color-primary)",
            },
            "&.Mui-focused fieldset": {
              borderColor: "var(--color-primary)",
              borderWidth: "1.5px",
            },
          },
          "& .MuiInputBase-input": {
            fontSize: "0.875rem",
            fontWeight: 500,
          },
          ...sx,
        }}
        {...props}
      />
    </FormFieldWrapper>
  );
}

/**
 * FormSelect Component
 * Standardized dropdown select component.
 */
export function FormSelect({
  label,
  required,
  error,
  helperText,
  options = [], // Array of { label, value } or string
  size = "medium",
  sx = {},
  ...props
}) {
  return (
    <FormFieldWrapper label={label} required={required} error={error} helperText={helperText}>
      <FormControl fullWidth error={Boolean(error)}>
        <Select
          size={size}
          sx={{
            borderRadius: "var(--radius-md)",
            background: "var(--bg-paper)",
            minHeight: "44px",
            color: "var(--text-primary)",
            fontSize: "0.875rem",
            fontWeight: 500,
            "& fieldset": {
              borderColor: "var(--border-color)",
            },
            "&:hover fieldset": {
              borderColor: "var(--color-primary)",
            },
            "&.Mui-focused fieldset": {
              borderColor: "var(--color-primary)",
              borderWidth: "1.5px",
            },
            ...sx,
          }}
          {...props}
        >
          {options.map((opt, idx) => {
            const val = typeof opt === "object" ? opt.value : opt;
            const lbl = typeof opt === "object" ? opt.label : opt;
            return (
              <MenuItem key={val ?? idx} value={val} sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
                {lbl}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </FormFieldWrapper>
  );
}
