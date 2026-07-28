import { useState, useEffect, useRef } from "react";
import { Box, Typography, TextField, MenuItem, Select, FormControl, InputLabel, Button, Alert, IconButton, Dialog, DialogContent, DialogTitle, Tooltip } from "@mui/material";
import { CloudUpload, Delete, Visibility, Close } from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";

// Reusable read-only faculty info row
export function FacultyInfoRow() {
  const { user } = useAuth();

  const fields = [
    { label: "Name of the Faculty", value: user?.name || "" },
    { label: "Designation", value: user?.designation || "" },
    { label: "Serving Department", value: user?.department || "" },
    { label: "Parent Department", value: user?.coreDepartment || "" },
    { label: "Employee ID", value: user?.institutionId || "" },
    { label: "Contact Number", value: user?.phone || user?.contactNumber || "" },
    { label: "PAN Number", value: user?.panNumber || "" },
    { label: "College", value: user?.college || "" },
  ];

  const emptyFields = fields.filter(f => !f.value).map(f => f.label);

  return (
    <Box sx={{ mb: 2 }}>
      {emptyFields.length > 0 && (
        <Alert
          severity="warning"
          sx={{
            mb: 2,
            borderRadius: "16px",
            fontWeight: 600,
            background: "rgba(245, 158, 11, 0.1)",
            color: "#f59e0b",
            border: "1px solid rgba(245, 158, 11, 0.2)",
            "& .MuiAlert-icon": { color: "#f59e0b" }
          }}
        >
          Missing Profile Details: {emptyFields.join(", ")}. Please update your profile to fill these details.
        </Alert>
      )}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
        {fields.map((f) => (
          <Box key={f.label}>
            <Typography sx={labelStyle}>{f.label}:</Typography>
            <TextField size="small" fullWidth value={f.value || "Not Set"} disabled sx={disabledField} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

import { labelStyle, disabledField, MONTHS, YEARS } from "./publicationConstants";

// NoteBox
export function NoteBox() {
  return (
    <Box sx={{
      background: "rgba(245, 158, 11, 0.05)",
      border: "1px dashed rgba(245, 158, 11, 0.4)",
      borderRadius: "16px",
      p: 2,
      fontSize: 12,
      color: "var(--text-secondary)",
      my: 3,
      display: "flex",
      flexDirection: "column",
      gap: 1
    }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
        <Box component="span" sx={{ background: "#f59e0b", color: "#fff", px: 1.2, py: 0.4, borderRadius: "6px", fontSize: 10, fontWeight: 900 }}>NOTE</Box>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#f59e0b" }}>Important Upload Guidelines</Typography>
      </Box>
      <Typography variant="caption" sx={{ color: "var(--text-primary)", fontWeight: 500, fontSize: "0.8rem" }}>
        1. Please Upload (PNG or JPG or JPEG or PDF) Only.
      </Typography>
      <Typography variant="caption" sx={{ color: "var(--text-primary)", fontWeight: 500, fontSize: "0.8rem" }}>
        2. File Size Should not Exceed <strong style={{ color: "#f59e0b" }}>200KB</strong>
      </Typography>
      <Box sx={{ mt: 1, pt: 1, borderTop: "1px solid rgba(245, 158, 11, 0.1)", display: "flex", flexWrap: "wrap", gap: 2 }}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>Optimizer Links:</Typography>
        <Box component="a" href="https://www.iloveimg.com/compress-image" target="_blank" sx={{ fontSize: 11, fontWeight: 700, color: "var(--color-primary)", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>1. Image Compressor</Box>
        <Box component="a" href="https://www.ilovepdf.com/compress_pdf" target="_blank" sx={{ fontSize: 11, fontWeight: 700, color: "var(--color-primary)", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>2. PDF Compressor</Box>
      </Box>
    </Box>
  );
}

// File upload field
export function FileField({ label, name, onChange, error, onError, accept = ".png,.jpg,.jpeg,.pdf", maxSize = 200 * 1024 }) {
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState(null);
  const [fileType, setFileType] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > maxSize) {
        const sizeStr = maxSize >= 1024 * 1024 ? `${(maxSize / 1024 / 1024).toFixed(0)}MB` : `${Math.round(maxSize / 1024)}KB`;
        const msg = `${label} is too large. Max size is ${sizeStr}.`;
        if (onError) onError(msg);
        else toast.error(msg);

        e.target.value = ""; // Reset input
        setFileName("");
        setPreview(null);
        setFileType("");
        onChange({ target: { name, files: [] } });
        return;
      }
      setFileName(file.name);
      setPreview(URL.createObjectURL(file));
      setFileType(file.type);
    } else {
      setFileName("");
      setPreview(null);
      setFileType("");
    }
    onChange(e);
  };

  const handleRemove = () => {
    setFileName("");
    setPreview(null);
    setFileType("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    onChange({ target: { name, files: [] } });
  };

  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ ...labelStyle, color: error ? "#ef4444" : "var(--color-primary)" }}>{label}</Typography>
      <Box sx={{
        display: "flex",
        alignItems: "center",
        gap: 3,
        px: 3,
        minHeight: "56px",
        py: 1,
        border: "1px solid",
        borderColor: error ? "#ef4444" : "var(--border-color)",
        borderRadius: "12px",
        background: "var(--bg-glass)",
        "&:hover": { borderColor: error ? "#ef4444" : "var(--color-primary)" },
        transition: "all 0.3s ease",
        position: "relative",
        minWidth: 0
      }}>
        <Button
          component="label"
          variant="contained"
          sx={{
            background: "var(--gradient-primary)",

            textTransform: "none",
            fontWeight: 700,
            fontSize: 11,
            px: 2.5,
            height: "32px",
            boxShadow: "none",
            whiteSpace: "nowrap",
            flexShrink: 0,
            "&:hover": { opacity: 0.9, transform: "translateY(-1px)" },
            transition: "all 0.2s ease"
          }}
        >
          Choose file
          <input type="file" hidden accept={accept} name={name} onChange={handleFileChange} ref={fileInputRef} />
        </Button>

        <Tooltip title={fileName || ""} disableHoverListener={!fileName}>
          <Typography sx={{ fontSize: 14, color: "var(--text-secondary)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexGrow: 1, minWidth: 0 }}>
            {fileName || "No file chosen"}
          </Typography>
        </Tooltip>

        {fileName && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {preview && (
              <Button
                startIcon={<Visibility />}
                onClick={() => setOpenModal(true)}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  color: "var(--color-primary)",
                  fontSize: "0.8rem",
                  "&:hover": { background: "rgba(232, 160, 0, 0.1)" }
                }}
              >
                Preview
              </Button>
            )}
            <IconButton
              onClick={handleRemove}
              sx={{
                color: "#ef4444",
                background: "rgba(239, 68, 68, 0.05)",
                "&:hover": { background: "rgba(239, 68, 68, 0.15)", transform: "scale(1.1)" },
                transition: "all 0.2s ease"
              }}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Box>

      {/* Preview Modal */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth sx={{ "& .MuiPaper-root": { borderRadius: "16px" } }}>
        <DialogTitle sx={{ m: 0, p: 2, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)" }}>
          <Typography sx={{ fontWeight: 800, color: "var(--color-primary)", fontSize: 18 }}>File Preview</Typography>
          <IconButton onClick={() => setOpenModal(false)} sx={{ color: "var(--text-secondary)" }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, display: "flex", justifyContent: "center", alignItems: "center", background: "#f8fafc", minHeight: "300px", height: fileType === "application/pdf" ? "80vh" : "auto" }}>
          {preview ? (
            fileType === "application/pdf" ? (
              <iframe src={preview} width="100%" height="100%" style={{ border: "none", borderRadius: "12px", minHeight: "60vh" }} title="PDF Preview" />
            ) : fileType.startsWith("image/") ? (
              <Box
                component="img"
                src={preview}
                alt="Preview"
                sx={{
                  maxWidth: "100%",
                  maxHeight: "70vh",
                  borderRadius: "12px",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
                  border: "4px solid #fff"
                }}
              />
            ) : (
              <Typography sx={{ color: "var(--text-secondary)", fontWeight: 600 }}>Preview not available for this file type.</Typography>
            )
          ) : (
            <Typography sx={{ color: "var(--text-secondary)", fontWeight: 600 }}>No file selected.</Typography>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

// Submit button
export function SubmitBtn({ onClick, loading }) {
  return (
    <Button
      variant="contained"
      onClick={onClick}
      disabled={loading}
      sx={{
        background: "var(--gradient-primary)",

        px: 6,
        height: "44px", // Fixed height for alignment
        textTransform: "none",
        fontWeight: 800,
        fontSize: 15,
        boxShadow: "0 8px 20px rgba(0, 0, 0, 0.1)",
        "&:hover": {
          background: "var(--gradient-primary)",
          opacity: 0.9,
          transform: "translateY(-2px)",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)"
        },
        transition: "all 0.3s ease"
      }}>
      {loading ? "Submitting..." : "Submit"}
    </Button>
  );
}

// Form card container
export function FormCard({ title, children }) {
  return (
    <Box sx={{ background: "var(--bg-panel)", border: "1px solid var(--border-color)", borderRadius: "24px", boxShadow: "var(--shadow-premium)", p: 4, mb: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)", borderBottom: "2px solid var(--color-primary)", pb: 1.5, mb: 3.5 }}>{title}</Typography>
      {children}
    </Box>
  );
}

// Two-column grid box
export function Grid2({ children, sx }) {
  return <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) minmax(0, 1fr)" }, gap: 2, ...sx }}>{children}</Box>;
}

// Section label
export function SubLabel({ text }) {
  return <Typography sx={{
    fontSize: 13,
    fontWeight: 800,
    color: "var(--text-primary)",
    background: "var(--bg-accent-1)",
    px: 2,
    py: 1.2,
    borderRadius: "12px",
    my: 3,
    borderLeft: "5px solid var(--color-primary)",
    textTransform: "uppercase",
    letterSpacing: "0.03em"
  }}>{text}</Typography>;
}
