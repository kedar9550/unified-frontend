import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import AppButton from "./AppButton";

/**
 * ConfirmDialog Component
 * Standardized modal dialog for destructive or critical confirmation flows.
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Confirm Action",
  description = "Are you sure you want to proceed? This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger", // danger | primary | warning
  loading = false,
}) {
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "var(--radius-xl)",
          p: 1,
          background: "var(--bg-paper)",
          border: "1px solid var(--border-color)",
          boxShadow: "var(--shadow-lg)",
        },
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: variant === "danger" ? "rgba(239, 68, 68, 0.1)" : "var(--bg-accent-4)",
            color: variant === "danger" ? "var(--danger)" : "var(--color-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <WarningAmberIcon fontSize="small" />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
          {title}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ py: 1 }}>
        <Typography variant="body2" sx={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
          {description}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ pt: 2, px: 3, pb: 2, gap: 1 }}>
        <AppButton variant="outline" size="md" onClick={onClose} disabled={loading}>
          {cancelText}
        </AppButton>
        <AppButton variant={variant} size="md" onClick={onConfirm} loading={loading}>
          {confirmText}
        </AppButton>
      </DialogActions>
    </Dialog>
  );
}
