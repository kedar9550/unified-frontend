import { useState, useEffect } from "react";
import { Box, Typography, TextField, MenuItem, Select, FormControl, InputLabel, Button } from "@mui/material";
import { useAuth } from "../../context/AuthContext";

// Reusable read-only faculty info row
export function FacultyInfoRow({ college, setCollege }) {
  const { user } = useAuth();
  
  // Use local state if props are not provided
  const [localCollege, setLocalCollege] = useState(user?.college || "");
  const currentCollege = college !== undefined ? college : localCollege;
  const updateCollege = setCollege || setLocalCollege;

  const fields = [
    { label: "Name of the Faculty", value: user?.name || "" },
    { label: "Designation", value: user?.designation || "" },
    { label: "Department", value: user?.department || "" },
    { label: "Employee ID", value: user?.institutionId || "" },
    { label: "Contact Number", value: user?.contactNumber || user?.phone || "" },
  ];
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mb: 2 }}>
      {fields.map((f) => (
        <Box key={f.label}>
          <Typography sx={labelStyle}>{f.label}:</Typography>
          <TextField size="small" fullWidth value={f.value} disabled sx={disabledField} />
        </Box>
      ))}
      <Box>
        <Typography sx={labelStyle}>College:</Typography>
        <TextField 
          size="small" 
          fullWidth 
          value={currentCollege} 
          onChange={(e) => updateCollege(e.target.value)} 
          placeholder="Enter College Name"
        />
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
export const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

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
  return (
    <Box>
      <Typography sx={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 700, mb: 0.5, textTransform: "uppercase" }}>{label}</Typography>
      <input type="file" accept=".png,.jpg,.jpeg,.pdf" name={name} onChange={onChange}
        style={{ 
            fontSize: 13, 
            border: "1px solid var(--border-color)", 
            borderRadius: 8, 
            padding: "8px 12px", 
            width: "100%", 
            background: "var(--bg-glass)",
            color: "var(--text-primary)",
            outline: "none"
        }} />
    </Box>
  );
}

// Submit button
export function SubmitBtn({ onClick, loading }) {
  return (
    <Box sx={{ textAlign: "center", mt: 3 }}>
      <Button 
        variant="contained" 
        onClick={onClick} 
        disabled={loading}
        sx={{ 
            background: "var(--color-primary)", 
            borderRadius: "12px", 
            px: 6, 
            py: 1.2,
            textTransform: "none", 
            fontWeight: 800, 
            fontSize: 15,
            boxShadow: "0 8px 20px rgba(232, 160, 0, 0.2)",
            "&:hover": { background: "var(--color-primary)", opacity: 0.9, transform: "translateY(-2px)" },
            transition: "all 0.3s ease"
        }}>
        {loading ? "Submitting..." : "Submit Application"}
      </Button>
    </Box>
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
