import { useState, useEffect } from "react";
import { Box, TextField, MenuItem, Select, Typography, Alert, Snackbar, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import PageHeader from "../../components/common/PageHeader";
import {
  FacultyInfoRow, FormCard, Grid2, SubLabel, NoteBox, FileField, SubmitBtn,
  labelStyle, MONTHS, YEARS
} from "../../components/faculty/PublicationFormFields";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";

const PATENT_STATUSES = ["Filed", "Published", "Granted", "Abandoned"];

export default function PatentPublication() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState("list"); // 'list', 'select-year', 'form'
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [publicationsList, setPublicationsList] = useState([]);

  const [form, setForm] = useState({
    college: "", title: "", applicantName: "", area: "", filingNo: "", dateOfFiling: "",
    status: "", coInventors: "", month: "", year: "",
  });
  const [files, setFiles] = useState({ eFilingReceipt: null, form1: null });
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  useEffect(() => {
    API.get("/api/research/patent").then(res => {
      setPublicationsList(res.data?.data || res.data || []);
    }).catch(err => console.log("Failed to fetch patents", err));

    API.get("/api/academic-years").then(res => {
      setAcademicYears(res.data?.years || res.data?.data || []);
    }).catch(err => console.log("Failed to fetch academic years", err));
  }, [viewMode]);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const setFile = (k) => (e) => setFiles((p) => ({ ...p, [k]: e.target.files[0] }));

  const handleSubmit = async () => {
    if (!form.title || !form.filingNo) {
      setSnack({ open: true, msg: "Please fill all required fields", severity: "error" });
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      Object.entries(files).forEach(([k, v]) => { if (v) fd.append(k, v); });
      fd.append("academicYear", selectedYear);

      await API.post("/api/research/patent", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setSnack({ open: true, msg: "Patent submitted successfully!", severity: "success" });
      setForm({ college: "", title: "", applicantName: "", area: "", filingNo: "", dateOfFiling: "", status: "", coInventors: "", month: "", year: "" });
      setFiles({ eFilingReceipt: null, form1: null });
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
        <Typography variant="h6" color="primary" fontWeight="bold">My Patent Publications</Typography>
        <Button variant="contained" onClick={() => setViewMode("select-year")} sx={{ background: "#29b6f6", "&:hover": { background: "#0288d1" } }}>
          Apply New
        </Button>
      </Box>
      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
        <Table>
          <TableHead sx={{ background: "#f5f5f5" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Area</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Filing No</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(!publicationsList || publicationsList.length === 0) ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  No previous publications found. Click "Apply New" to submit one.
                </TableCell>
              </TableRow>
            ) : (
              publicationsList.map((pub, i) => (
                <TableRow key={pub._id || i}>
                  <TableCell>{pub.title || "N/A"}</TableCell>
                  <TableCell>{pub.area || "N/A"}</TableCell>
                  <TableCell>{pub.filingNo || "N/A"}</TableCell>
                  <TableCell><Typography variant="body2" sx={{ color: "green", fontWeight: 500 }}>Submitted</Typography></TableCell>
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
        <Typography sx={{ mb: 2, color: "#555" }}>Please select the academic year for this publication submission:</Typography>
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
          <Button variant="outlined" onClick={() => setViewMode("list")}>Cancel</Button>
          <Button variant="contained" disabled={!selectedYear} onClick={() => setViewMode("form")} sx={{ background: "#29b6f6", "&:hover": { background: "#0288d1" } }}>
            Proceed
          </Button>
        </Box>
      </FormCard>
    </Box>
  );

  const renderForm = () => (
    <FormCard title="Patent Submission">
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="body2" sx={{ background: "#e3f2fd", color: "#1565c0", px: 2, py: 0.5, borderRadius: 1, fontWeight: 500 }}>
          Academic Year: {academicYears.find(y => y._id === selectedYear)?.year || "Selected"}
        </Typography>
        <Button size="small" variant="text" onClick={() => setViewMode("select-year")}>Change Year</Button>
      </Box>

      <FacultyInfoRow college={form.college} setCollege={(v) => setForm(p => ({ ...p, college: v }))} />

      <SubLabel text="Details of the Patent:" />
      <Grid2>
        <Box>
          <Typography sx={labelStyle}>Title of the Patent :</Typography>
          <TextField size="small" fullWidth multiline rows={2} value={form.title} onChange={set("title")} />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Name of the Applicant in Patent:</Typography>
          <Select size="small" fullWidth displayEmpty value={form.applicantName} onChange={set("applicantName")}>
            <MenuItem value="">--Select--</MenuItem>
            <MenuItem value={user?.name}>{user?.name}</MenuItem>
          </Select>
        </Box>
        <Box>
          <Typography sx={labelStyle}>Area of Patent :</Typography>
          <TextField size="small" fullWidth value={form.area} onChange={set("area")} />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Patent Filing No :</Typography>
          <TextField size="small" fullWidth value={form.filingNo} onChange={set("filingNo")} />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Date of filing :</Typography>
          <TextField size="small" fullWidth type="date" value={form.dateOfFiling} onChange={set("dateOfFiling")} InputLabelProps={{ shrink: true }} />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Status of Patent Application :</Typography>
          <Select size="small" fullWidth displayEmpty value={form.status} onChange={set("status")}>
            <MenuItem value="">--Select--</MenuItem>
            {PATENT_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </Box>
        <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
          <Typography sx={labelStyle}>Name & affiliation of Co-Inventors :</Typography>
          <TextField size="small" fullWidth multiline rows={3} value={form.coInventors} onChange={set("coInventors")} />
        </Box>
      </Grid2>

      <Grid2 sx={{ mt: 2 }}>
        <Box>
          <Typography sx={labelStyle}>Month :</Typography>
          <Select size="small" fullWidth displayEmpty value={form.month} onChange={set("month")}>
            <MenuItem value="">--Select--</MenuItem>
            {MONTHS.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
          </Select>
        </Box>
        <Box>
          <Typography sx={labelStyle}>Year :</Typography>
          <TextField size="small" fullWidth value={form.year} onChange={set("year")} placeholder="YYY" inputProps={{ maxLength: 4 }} />
        </Box>
      </Grid2>

      <NoteBox />

      <Grid2 sx={{ mt: 1 }}>
        <FileField label="e-Filing Receipt:" name="eFilingReceipt" onChange={setFile("eFilingReceipt")} />
        <FileField label="Form -1" name="form1" onChange={setFile("form1")} />
      </Grid2>

      <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 4 }}>
        <Button variant="outlined" onClick={() => setViewMode("list")} sx={{ px: 4, borderRadius: 2 }}>Cancel</Button>
        <SubmitBtn onClick={handleSubmit} loading={loading} />
      </Box>
    </FormCard>
  );

  return (
    <>
      <PageHeader title="Patent" subtitle="Manage and submit your patent application details" breadcrumbs={["Home", "Publications", "Patent"]} />

      {viewMode === "list" && renderList()}
      {viewMode === "select-year" && renderSelectYear()}
      {viewMode === "form" && renderForm()}

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack((p) => ({ ...p, open: false }))} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity={snack.severity} onClose={() => setSnack((p) => ({ ...p, open: false }))}>{snack.msg}</Alert>
      </Snackbar>
    </>
  );
}
