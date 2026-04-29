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
export const labelStyle = { fontSize: 12, color: "#e53935", fontWeight: 600, mb: 0.5 };

// Disabled TextField style
export const disabledField = {
  "& .MuiInputBase-input.Mui-disabled": { WebkitTextFillColor: "#555", background: "#f5f5f5" },
  "& .MuiOutlinedInput-root.Mui-disabled .MuiOutlinedInput-notchedOutline": { borderColor: "#ddd" },
};

// Month options
export const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// Year options (last 10 years)
export const YEARS = Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() - i));

// NoteBox
export function NoteBox() {
  return (
    <Box sx={{ background: "#fff3e0", border: "1px solid #ffcc80", borderRadius: "6px", p: 1.5, fontSize: 12, color: "#e65100", my: 1.5 }}>
      <Box component="span" sx={{ background: "#f44336", color: "#fff", px: 0.8, py: 0.2, borderRadius: "3px", mr: 1, fontSize: 11, fontWeight: 700 }}>NOTE:</Box>
      1. Please Upload (PNG or JPG or JPEG or PDF) Only.{"  "}
      2. File Size Should not Exceed <strong>500KB</strong>
      <Box sx={{ mt: 0.5 }}>
        Optimizer Links:{" "}
        <Box component="a" href="https://www.iloveimg.com/compress-image" target="_blank" sx={{ color: "#1976d2", mr: 1 }}>1. Image Compressor</Box>
        <Box component="a" href="https://www.ilovepdf.com/compress_pdf" target="_blank" sx={{ color: "#1976d2" }}>2. PDF Compressor</Box>
      </Box>
    </Box>
  );
}

// File upload field
export function FileField({ label, name, onChange }) {
  return (
    <Box>
      <Typography sx={{ fontSize: 12, color: "#555", fontWeight: 600, mb: 0.5 }}>{label}</Typography>
      <input type="file" accept=".png,.jpg,.jpeg,.pdf" name={name} onChange={onChange}
        style={{ fontSize: 13, border: "1px solid #ccc", borderRadius: 4, padding: "5px 8px", width: "100%", background: "#fff" }} />
    </Box>
  );
}

// Submit button
export function SubmitBtn({ onClick, loading }) {
  return (
    <Box sx={{ textAlign: "center", mt: 3 }}>
      <Button variant="contained" onClick={onClick} disabled={loading}
        sx={{ background: "#29b6f6", borderRadius: "6px", px: 5, textTransform: "none", fontWeight: 600, fontSize: 14, "&:hover": { background: "#0288d1" } }}>
        {loading ? "Submitting..." : "Submit"}
      </Button>
    </Box>
  );
}

// Form card container
export function FormCard({ title, children }) {
  return (
    <Box sx={{ background: "rgba(255,255,255,0.6)", backdropFilter: "blur(12px)", borderRadius: "20px", boxShadow: "0 15px 40px rgba(0,0,0,0.08)", p: 3, mb: 3 }}>
      <Typography variant="h6" fontWeight={700} sx={{ color: "#1a237e", borderBottom: "2px solid #e8a000", pb: 1.5, mb: 2.5 }}>{title}</Typography>
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
  return <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#444", background: "#f5f5f5", px: 1.5, py: 0.8, borderRadius: "4px", my: 1.5 }}>{text}</Typography>;
}
