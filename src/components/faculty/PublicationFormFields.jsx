import { useState, useEffect, useRef } from "react";
import { Box, Typography, TextField, MenuItem, Select, FormControl, InputLabel, Button, Alert, IconButton, Dialog, DialogContent, DialogTitle } from "@mui/material";
import { CloudUpload, Delete, Visibility, Close } from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";

// Reusable read-only faculty info row
export function FacultyInfoRow() {
  const { user } = useAuth();

  const fields = [
    { label: "Name of the Faculty", value: user?.name || "" },
    { label: "Designation", value: user?.designation || "" },
    { label: "Department", value: user?.department || "" },
    { label: "Core Department", value: user?.coreDepartment || "" },
    { label: "Employee ID", value: user?.institutionId || "" },
    { label: "Contact Number", value: user?.phone || user?.contactNumber || "" },
    { label: "PAN Number", value: user?.panNumber || "" },
    { label: "College", value: user?.college || "" },
  ];

  const emptyFields = fields.filter(f => !f.value).map(f => f.label);

  return (
    <Box sx={{ mb: 2 }}>
      {emptyFields.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: "12px", fontWeight: 600 }}>
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

// Styled label
export const labelStyle = { fontSize: 12, color: "var(--color-primary)", fontWeight: 700, mb: 0.5, textTransform: "uppercase", letterSpacing: "0.02em" };

// Disabled TextField style
export const disabledField = {
  "& .MuiInputBase-input.Mui-disabled": { WebkitTextFillColor: "var(--text-secondary)", background: "var(--bg-accent-1)", opacity: 0.8 },
  "& .MuiOutlinedInput-root.Mui-disabled .MuiOutlinedInput-notchedOutline": { borderColor: "var(--border-color)" },
};

// Month options
export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Year options (last 10 years)
export const YEARS = Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() - i));

// NoteBox
export function NoteBox() {
  return (
    <Box sx={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "12px", p: 1.5, fontSize: 12, color: "#f59e0b", my: 1.5 }}>
      <Box component="span" sx={{ background: "#f59e0b", color: "#fff", px: 1, py: 0.3, borderRadius: "6px", mr: 1, fontSize: 11, fontWeight: 800 }}>NOTE:</Box>
      1. Please Upload (PNG or JPG or JPEG or PDF) Only.{"  "}
      2. File Size Should not Exceed <strong>500KB</strong>
      <Box sx={{ mt: 1, display: "flex", gap: 2 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 600 }}>Optimizer Links:</Typography>
        <Box component="a" href="https://www.iloveimg.com/compress-image" target="_blank" sx={{ color: "var(--color-primary)", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>1. Image Compressor</Box>
        <Box component="a" href="https://www.ilovepdf.com/compress_pdf" target="_blank" sx={{ color: "var(--color-primary)", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>2. PDF Compressor</Box>
      </Box>
    </Box>
  );
}

// File upload field
export function FileField({ label, name, onChange }) {
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState(null);
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
      setFileName(file.name);
      if (file.type.startsWith("image/")) {
        setPreview(URL.createObjectURL(file));
      } else {
        setPreview(null);
      }
    } else {
      setFileName("");
      setPreview(null);
    }
    onChange(e);
  };

  const handleRemove = () => {
    setFileName("");
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onChange({ target: { name, files: [] } });
  };

  return (
    <Box>
      <Typography sx={labelStyle}>{label}</Typography>
      <Box sx={{
        display: "flex",
        alignItems: "center",
        gap: 2.5,
        px: 2,
        minHeight: "48px",
        py: 0.5,
        border: "1px solid var(--border-color)",
        borderRadius: "12px",
        background: "var(--bg-glass)",
        "&:hover": { borderColor: "var(--color-primary)" },
        transition: "all 0.3s ease",
        position: "relative"
      }}>
        <Button
          component="label"
          variant="contained"
          sx={{
            background: "var(--gradient-primary)",
            borderRadius: "30px",
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
          <input type="file" hidden accept=".png,.jpg,.jpeg,.pdf" name={name} onChange={handleFileChange} ref={fileInputRef} />
        </Button>

        <Typography sx={{ fontSize: 14, color: "var(--text-secondary)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", flexGrow: 1 }}>
          {fileName || "No file chosen"}
        </Typography>

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
        <DialogContent sx={{ p: 3, display: "flex", justifyContent: "center", alignItems: "center", background: "#f8fafc", minHeight: "300px" }}>
          {preview ? (
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
        borderRadius: "12px",
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
  return <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, ...sx }}>{children}</Box>;
}

// Section label
export function SubLabel({ text }) {
  return <Typography sx={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", background: "var(--bg-accent-1)", px: 2, py: 1, borderRadius: "8px", my: 2, borderLeft: "4px solid var(--color-primary)" }}>{text}</Typography>;
}
