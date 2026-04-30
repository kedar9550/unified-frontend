import { useState, useEffect } from "react";
import { Box, TextField, MenuItem, Select, Typography, Alert, Snackbar, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import PageHeader from "../../components/common/PageHeader";
import {
  FacultyInfoRow, FormCard, Grid2, SubLabel, SubmitBtn,
  labelStyle, MONTHS, YEARS
} from "../../components/faculty/PublicationFormFields";
import API from "../../api/axios";

export default function ConsultancyPublication() {
  const [viewMode, setViewMode] = useState("list"); // 'list', 'select-year', 'form'
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [publicationsList, setPublicationsList] = useState([]);

  const [form, setForm] = useState({
    college: "", title: "", organization: "", amount: "", duration: "", month: "", year: "",
  });
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  useEffect(() => {
    API.get("/api/research/consultancy").then(res => {
      setPublicationsList(res.data?.data || res.data || []);
    }).catch(err => console.log("Failed to fetch consultancies", err));

    API.get("/api/academic-years").then(res => {
      setAcademicYears(res.data?.years || res.data?.data || []);
    }).catch(err => console.log("Failed to fetch academic years", err));
  }, [viewMode]);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.title || !form.organization) {
      setSnack({ open: true, msg: "Please fill all required fields", severity: "error" });
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form, academicYear: selectedYear };
      await API.post("/api/research/consultancy", payload);
      setSnack({ open: true, msg: "Consultancy submitted successfully!", severity: "success" });
      setForm({ college: "", title: "", organization: "", amount: "", duration: "", month: "", year: "" });
      setSelectedYear("");
      setViewMode("list");
    } catch (err) {
      setSnack({ open: true, msg: err?.response?.data?.message || "Submission failed", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const renderList = () => (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h6" sx={{ color: "var(--text-primary)", fontWeight: 800 }}>My Consultancy Work</Typography>
        <Button variant="contained" onClick={() => setViewMode("select-year")} sx={{ background: "var(--color-primary)", borderRadius: "12px", px: 3, fontWeight: 700, textTransform: "none", "&:hover": { background: "var(--color-primary)", opacity: 0.9 } }}>
          Apply New
        </Button>
      </Box>
      <TableContainer component={Paper} sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-premium)", overflow: "hidden" }}>
        <Table>
          <TableHead sx={{ background: "var(--gradient-primary)" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Organization</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Amount</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(!publicationsList || publicationsList.length === 0) ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  No previous consultancy work found. Click "Apply New" to submit one.
                </TableCell>
              </TableRow>
            ) : (
              publicationsList.map((pub, i) => (
                <TableRow key={pub._id || i}>
                  <TableCell sx={{ color: "var(--text-primary)", fontWeight: 500, py: 2 }}>{pub.title || "N/A"}</TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>{pub.organization || "N/A"}</TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>{pub.amount || "N/A"}</TableCell>
                  <TableCell sx={{ py: 2 }}><Typography variant="body2" sx={{ color: "#10b981", fontWeight: 700, background: "rgba(16, 185, 129, 0.1)", px: 1.5, py: 0.5, borderRadius: "6px", display: "inline-block" }}>Submitted</Typography></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderSelectYear = () => (
    <Box sx={{ maxWidth: 500, mx: "auto", mt: 5 }}>
      <FormCard title="Select Academic Year">
        <Typography sx={{ mb: 2, color: "var(--text-secondary)", fontWeight: 500 }}>Please select the academic year for this consultancy submission:</Typography>
        <Select 
          fullWidth 
          size="small" 
          displayEmpty 
          value={selectedYear} 
          onChange={(e) => setSelectedYear(e.target.value)}
        >
          <MenuItem value="" disabled>Select Academic Year</MenuItem>
          {academicYears.map(y => (
            <MenuItem key={y._id} value={y._id}>{y.year}</MenuItem>
          ))}
        </Select>
        <Box sx={{ display: "flex", gap: 2, mt: 4, justifyContent: "flex-end" }}>
          <Button variant="outlined" onClick={() => setViewMode("list")} sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" disabled={!selectedYear} onClick={() => setViewMode("form")} sx={{ background: "var(--color-primary)", borderRadius: "12px", px: 4, fontWeight: 700, textTransform: "none", "&:hover": { background: "var(--color-primary)", opacity: 0.9 } }}>
            Proceed
          </Button>
        </Box>
      </FormCard>
    </Box>
  );

  const renderForm = () => (
    <FormCard title="Consultancy Submission">
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="body2" sx={{ background: "var(--bg-accent-1)", color: "var(--color-primary)", px: 2, py: 0.8, borderRadius: "8px", fontWeight: 700, border: "1px solid var(--border-color)" }}>
          Academic Year: {academicYears.find(y => y._id === selectedYear)?.year || "Selected"}
        </Typography>
        <Button size="small" variant="text" onClick={() => setViewMode("select-year")} sx={{ fontWeight: 700, textTransform: "none", color: "var(--color-primary)" }}>Change Year</Button>
      </Box>

      <FacultyInfoRow college={form.college} setCollege={(v) => setForm(p => ({ ...p, college: v }))} />

      <SubLabel text="Details of the Consultancy:" />
      <Grid2>
        <Box>
          <Typography sx={labelStyle}>Title of the Consultancy Work :</Typography>
          <TextField size="small" fullWidth value={form.title} onChange={set("title")} inputProps={{ maxLength: 30 }}
            helperText={`${30 - form.title.length} Character(s) Remaining`} />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Organization/client :</Typography>
          <TextField size="small" fullWidth value={form.organization} onChange={set("organization")} />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Consultancy Amount :</Typography>
          <TextField size="small" fullWidth value={form.amount} onChange={set("amount")} placeholder="Amount" />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Duration of Consultancy Work :</Typography>
          <TextField size="small" fullWidth value={form.duration} onChange={set("duration")} />
        </Box>
      </Grid2>

      <SubLabel text="Date of Commencement of the Consultancy:" />
      <Grid2>
        <Box>
          <Typography sx={labelStyle}>Month :</Typography>
          <Select size="small" fullWidth displayEmpty value={form.month} onChange={set("month")}>
            <MenuItem value="">--Select--</MenuItem>
            {MONTHS.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
          </Select>
        </Box>
        <Box>
          <Typography sx={labelStyle}>Year :</Typography>
          <TextField size="small" fullWidth value={form.year} onChange={set("year")} placeholder="YYYY" inputProps={{ maxLength: 4 }} />
        </Box>
      </Grid2>

      <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 4 }}>
        <Button variant="outlined" onClick={() => setViewMode("list")} sx={{ px: 4, borderRadius: 2 }}>Cancel</Button>
        <SubmitBtn onClick={handleSubmit} loading={loading} />
      </Box>
    </FormCard>
  );

  return (
    <>
      <PageHeader title="Consultancy" subtitle="Manage and submit your consultancy work details" breadcrumbs={["Home", "Publications", "Consultancy"]} />

      {viewMode === "list" && renderList()}
      {viewMode === "select-year" && renderSelectYear()}
      {viewMode === "form" && renderForm()}

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack((p) => ({ ...p, open: false }))} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity={snack.severity} onClose={() => setSnack((p) => ({ ...p, open: false }))}>{snack.msg}</Alert>
      </Snackbar>
    </>
  );
}
