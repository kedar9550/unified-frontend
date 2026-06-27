import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from "@mui/material";

export default function NoActiveYearDialog({ open, onClose }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: "16px",
          background: "var(--bg-glass)",
          backdropFilter: "blur(12px)",
          border: "1px solid var(--border-color)",
          boxShadow: "var(--shadow-premium)",
          p: 1.5,
          maxWidth: 400
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
        No Active Academic Year
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: "var(--text-secondary)" }}>
          No academic year is active globally. Please contact the administrator to configure an active academic year before proceeding.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose} 
          sx={{ fontWeight: 700, color: "var(--color-primary)", textTransform: "none" }}
        >
          Okay
        </Button>
      </DialogActions>
    </Dialog>
  );
}
