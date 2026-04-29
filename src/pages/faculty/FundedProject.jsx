import { useState, useEffect } from "react";
import { Box, TextField, MenuItem, Select, Typography, Alert, Snackbar, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import PageHeader from "../../components/common/PageHeader";
import {
  FacultyInfoRow, FormCard, Grid2, SubLabel, NoteBox, FileField, SubmitBtn,
  labelStyle
} from "../../components/faculty/PublicationFormFields";
import API from "../../api/axios";

export default function FundedProject() {
  const [viewMode, setViewMode] = useState("list"); // 'list', 'select-year', 'form'
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [publicationsList, setPublicationsList] = useState([]);

  const [form, setForm] = useState({
    college: "", title: "", duration: "", fundingAgency: "", scheme: "",
    otherInvestigators: "", principalInvestigator: "",
    recurring: "", nonRecurring: "", sanctionedAmount: "", sanctionDate: "",
  });
  const [files, setFiles] = useState({ sanctionOrder: null });
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  useEffect(() => {
    API.get("/api/research/funded-project").then(res => {
      setPublicationsList(res.data?.data || res.data || []);
    }).catch(err => console.log("Failed to fetch funded projects", err));

    API.get("/api/academic-years").then(res => {
      setAcademicYears(res.data?.years || res.data?.data || []);
    }).catch(err => console.log("Failed to fetch academic years", err));
  }, [viewMode]);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const setFile = (k) => (e) => setFiles((p) => ({ ...p, [k]: e.target.files[0] }));

  const handleSubmit = async () => {
    if (!form.title || !form.fundingAgency) {
      setSnack({ open: true, msg: "Please fill all required fields", severity: "error" });
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (files.sanctionOrder) fd.append("sanctionOrder", files.sanctionOrder);
      fd.append("academicYear", selectedYear);

      await API.post("/api/research/funded-project", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setSnack({ open: true, msg: "Funded Project submitted successfully!", severity: "success" });
      setForm({ college: "", title: "", duration: "", fundingAgency: "", scheme: "", otherInvestigators: "", principalInvestigator: "", recurring: "", nonRecurring: "", sanctionedAmount: "", sanctionDate: "" });
      setFiles({ sanctionOrder: null });
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
        <Typography variant="h6" color="primary" fontWeight="bold">My Funded Projects</Typography>
        <Button variant="contained" onClick={() => setViewMode("select-year")} sx={{ background: "#29b6f6", "&:hover": { background: "#0288d1" } }}>
          Apply New
        </Button>
      </Box>
      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
        <Table>
          <TableHead sx={{ background: "#f5f5f5" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Funding Agency</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Sanction Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(!publicationsList || publicationsList.length === 0) ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  No previous projects found. Click "Apply New" to submit one.
                </TableCell>
              </TableRow>
            ) : (
              publicationsList.map((pub, i) => (
                <TableRow key={pub._id || i}>
                  <TableCell>{pub.title || "N/A"}</TableCell>
                  <TableCell>{pub.fundingAgency || "N/A"}</TableCell>
                  <TableCell>{pub.sanctionDate || "N/A"}</TableCell>
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
        <Typography sx={{ mb: 2, color: "#555" }}>Please select the academic year for this project submission:</Typography>
        <Select 
          fullWidth 
          size="small" 
          displayEmpty 
          value={selectedYear} 
          onChange={(e) => setSelectedYear(e.target.value)}
        >
          <MenuItem value="" disabled>Select Academic Year</MenuItem>
          {academicYears.filter(y => y.isActive).slice(0,3).map(y => (
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
    <FormCard title="Funded Projects Submission">
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="body2" sx={{ background: "#e3f2fd", color: "#1565c0", px: 2, py: 0.5, borderRadius: 1, fontWeight: 500 }}>
          Academic Year: {academicYears.find(y => y._id === selectedYear)?.year || "Selected"}
        </Typography>
        <Button size="small" variant="text" onClick={() => setViewMode("select-year")}>Change Year</Button>
      </Box>

      <FacultyInfoRow college={form.college} setCollege={(v) => setForm(p => ({ ...p, college: v }))} />

      <SubLabel text="Details of the Funded Projects:" />
      <Grid2>
        <Box>
          <Typography sx={labelStyle}>Title of the Project :</Typography>
          <TextField size="small" fullWidth value={form.title} onChange={set("title")} inputProps={{ maxLength: 30 }}
            helperText={`${30 - form.title.length} Character(s) Remaining`} />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Duration of Project :</Typography>
          <TextField size="small" fullWidth value={form.duration} onChange={set("duration")} placeholder="e.g. 2 Years" />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Funding Agency :</Typography>
          <TextField size="small" fullWidth value={form.fundingAgency} onChange={set("fundingAgency")} />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Scheme :</Typography>
          <TextField size="small" fullWidth value={form.scheme} onChange={set("scheme")} />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Name and affiliation of Other Investigators :</Typography>
          <TextField size="small" fullWidth value={form.otherInvestigators} onChange={set("otherInvestigators")} />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Are You The Principal Investigator:</Typography>
          <Select size="small" fullWidth displayEmpty value={form.principalInvestigator} onChange={set("principalInvestigator")}>
            <MenuItem value="">--Select--</MenuItem>
            <MenuItem value="Yes">Yes</MenuItem>
            <MenuItem value="No">No</MenuItem>
          </Select>
        </Box>
        <Box>
          <Typography sx={labelStyle}>Recurring :</Typography>
          <TextField size="small" fullWidth value={form.recurring} onChange={set("recurring")} placeholder="Amount" />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Non-Recurring :</Typography>
          <TextField size="small" fullWidth value={form.nonRecurring} onChange={set("nonRecurring")} placeholder="Amount" />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Sanctioned Amount :</Typography>
          <TextField size="small" fullWidth value={form.sanctionedAmount} onChange={set("sanctionedAmount")} placeholder="Amount" />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Date of Sanction :</Typography>
          <TextField size="small" fullWidth type="date" value={form.sanctionDate} onChange={set("sanctionDate")} InputLabelProps={{ shrink: true }} />
        </Box>
      </Grid2>

      <NoteBox />

      <Box sx={{ mt: 1, maxWidth: 350 }}>
        <FileField label="Sanction Order:" name="sanctionOrder" onChange={setFile("sanctionOrder")} />
      </Box>

      <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 4 }}>
        <Button variant="outlined" onClick={() => setViewMode("list")} sx={{ px: 4, borderRadius: 2 }}>Cancel</Button>
        <SubmitBtn onClick={handleSubmit} loading={loading} />
      </Box>
    </FormCard>
  );

  return (
    <>
      <PageHeader title="Funded Projects" subtitle="Manage and submit your funded project details" breadcrumbs={["Home", "Publications", "Funded Project"]} />

      {viewMode === "list" && renderList()}
      {viewMode === "select-year" && renderSelectYear()}
      {viewMode === "form" && renderForm()}

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack((p) => ({ ...p, open: false }))} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity={snack.severity} onClose={() => setSnack((p) => ({ ...p, open: false }))}>{snack.msg}</Alert>
      </Snackbar>
    </>
  );
}
