import { useState, useEffect } from "react";
import { Box, TextField, MenuItem, Select, Typography, Alert, Snackbar, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton } from "@mui/material";
import { AddCircle, Delete } from "@mui/icons-material";
import PageHeader from "../../components/common/PageHeader";
import {
  FacultyInfoRow, FormCard, Grid2, SubLabel, NoteBox, FileField, SubmitBtn,
  labelStyle, MONTHS, YEARS
} from "../../components/faculty/PublicationFormFields";
import API from "../../api/axios";

const JOURNAL_CATEGORIES = ["Q1", "Q2", "Q3", "Q4", "WOS", "SCOPUS", "NAAS", "ASME", "ASCE", "ACM", "IEEE"];
const INCENTIVE_OPTIONS = ["National", "International"];

export default function JournalPublication() {
  const [viewMode, setViewMode] = useState("list"); // 'list', 'select-year', 'form'
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [publicationsList, setPublicationsList] = useState([]);

  const [form, setForm] = useState({
    college: "", panCard: "", incentiveApplied: "", firstAuthor: "", authorPosition: "", categoryOfJournal: "",
    papersCited: "", paperTitle: "", coAuthors: [],
    journalName: "", vol: "", issue: "", pageNos: "", month: "", year: "",
    hIndex: "", impactFactor: "", referencingNos: "", sdgs: "",
    applyIncentive: ""
  });
  const [files, setFiles] = useState({ publishedPaper: null, referencePages: null });
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  useEffect(() => {
    // Fetch previously submitted journals (adjust API path if needed)
    API.get("/api/research/journal").then(res => {
      setPublicationsList(res.data?.data || res.data || []);
    }).catch(err => console.log("Failed to fetch journals", err));

    // Fetch active academic years
    API.get("/api/academic-years").then(res => {
      setAcademicYears(res.data?.years || res.data?.data || []);
    }).catch(err => console.log("Failed to fetch academic years", err));
  }, [viewMode]); // Refetch when going back to list

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const setFile = (k) => (e) => setFiles((p) => ({ ...p, [k]: e.target.files[0] }));

  const handleAddCoAuthor = () => {
    setForm(p => ({ ...p, coAuthors: [...p.coAuthors, { name: "", affiliation: "" }] }));
  };

  const handleRemoveCoAuthor = (index) => {
    setForm(p => ({ ...p, coAuthors: p.coAuthors.filter((_, i) => i !== index) }));
  };

  const handleUpdateCoAuthor = (index, field, value) => {
    const updated = [...form.coAuthors];
    updated[index][field] = value;
    setForm(p => ({ ...p, coAuthors: updated }));
  };

  const handleSubmit = async () => {
    if (!form.paperTitle || !form.journalName) {
      setSnack({ open: true, msg: "Please fill all required fields", severity: "error" });
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === "coAuthors") {
          fd.append(k, JSON.stringify(v));
        } else {
          fd.append(k, v);
        }
      });
      Object.entries(files).forEach(([k, v]) => { if (v) fd.append(k, v); });
      fd.append("academicYear", selectedYear);

      await API.post("/api/research/journal", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setSnack({ open: true, msg: "Journal submitted successfully!", severity: "success" });
      
      // Reset form and go back to list
      setForm({ college: "", panCard: "", incentiveApplied: "", firstAuthor: "", authorPosition: "", categoryOfJournal: "", papersCited: "", paperTitle: "", coAuthors: [], journalName: "", vol: "", issue: "", pageNos: "", month: "", year: "", hIndex: "", impactFactor: "", referencingNos: "", sdgs: "", applyIncentive: "" });
      setFiles({ publishedPaper: null, referencePages: null });
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
        <Typography variant="h6" sx={{ color: "var(--text-primary)", fontWeight: 800 }}>My Journal Publications</Typography>
        <Button variant="contained" onClick={() => setViewMode("select-year")} sx={{ background: "var(--color-primary)", borderRadius: "12px", px: 3, fontWeight: 700, textTransform: "none", "&:hover": { background: "var(--color-primary)", opacity: 0.9 } }}>
          Apply New
        </Button>
      </Box>
      <TableContainer component={Paper} sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-premium)", overflow: "hidden" }}>
        <Table>
          <TableHead sx={{ background: "var(--gradient-primary)" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Journal Name</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Paper Title</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Status</TableCell>
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
                  <TableCell sx={{ color: "var(--text-primary)", fontWeight: 500, py: 2 }}>{pub.journalName || "N/A"}</TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>{pub.paperTitle || "N/A"}</TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>{pub.categoryOfJournal || "N/A"}</TableCell>
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
        <Typography sx={{ mb: 2, color: "var(--text-secondary)", fontWeight: 500 }}>Please select the academic year for this publication submission:</Typography>
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
    <FormCard title="Journal Submission">
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="body2" sx={{ background: "var(--bg-accent-1)", color: "var(--color-primary)", px: 2, py: 0.8, borderRadius: "8px", fontWeight: 700, border: "1px solid var(--border-color)" }}>
          Academic Year: {academicYears.find(y => y._id === selectedYear)?.year || "Selected"}
        </Typography>
        <Button size="small" variant="text" onClick={() => setViewMode("select-year")} sx={{ fontWeight: 700, textTransform: "none", color: "var(--color-primary)" }}>Change Year</Button>
      </Box>

      <FacultyInfoRow college={form.college} setCollege={(v) => setForm(p => ({ ...p, college: v }))} />

      <Grid2 sx={{ mt: 1 }}>
        <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
          <Typography sx={labelStyle}>Title of the Research Paper:</Typography>
          <TextField size="small" fullWidth multiline rows={2} value={form.paperTitle} onChange={set("paperTitle")} />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Pan card Number:</Typography>
          <TextField size="small" fullWidth value={form.panCard} onChange={set("panCard")} />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Whether you are the first author :</Typography>
          <Select size="small" fullWidth displayEmpty value={form.firstAuthor} onChange={set("firstAuthor")}>
            <MenuItem value="">Select</MenuItem>
            <MenuItem value="Yes">Yes</MenuItem>
            <MenuItem value="No">No</MenuItem>
          </Select>
        </Box>
        {form.firstAuthor === "No" && (
          <Box>
            <Typography sx={labelStyle}>Author Position :</Typography>
            <TextField size="small" fullWidth type="number" value={form.authorPosition} onChange={set("authorPosition")} placeholder="e.g. 2" />
          </Box>
        )}
        <Box>
          <Typography sx={labelStyle}>Category of Journal</Typography>
          <Select size="small" fullWidth displayEmpty value={form.categoryOfJournal} onChange={set("categoryOfJournal")}>
            <MenuItem value="">Select</MenuItem>
            {JOURNAL_CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </Select>
        </Box>
        <Box>
          <Typography sx={labelStyle}>Research Incentive applied for:</Typography>
          <Select size="small" fullWidth displayEmpty value={form.incentiveApplied} onChange={set("incentiveApplied")}>
            <MenuItem value="">Select</MenuItem>
            {INCENTIVE_OPTIONS.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
          </Select>
        </Box>
        <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
          <Typography sx={labelStyle}>No of papers Cited belonging to Aditya Group:</Typography>
          <TextField size="small" type="number" value={form.papersCited} onChange={set("papersCited")} sx={{ width: 200 }} />
        </Box>

        {form.firstAuthor === "No" && (
          <Box sx={{ gridColumn: { sm: "1 / -1" }, mt: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
              <Typography sx={labelStyle}>Name & affiliation of Co-Author(s):</Typography>
              <Button startIcon={<AddCircle />} onClick={handleAddCoAuthor} sx={{ textTransform: "none", fontWeight: 700, color: "var(--color-primary)" }}>Add Co-Author</Button>
            </Box>
            {form.coAuthors.map((co, idx) => (
              <Box key={idx} sx={{ display: "flex", gap: 2, mb: 2, p: 2, background: "var(--bg-accent-1)", borderRadius: "12px", alignItems: "center" }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", mb: 0.5 }}>CO-AUTHOR NAME</Typography>
                  <TextField size="small" fullWidth placeholder="Name" value={co.name} onChange={(e) => handleUpdateCoAuthor(idx, "name", e.target.value)} />
                </Box>
                <Box sx={{ flex: 2 }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", mb: 0.5 }}>AFFILIATION</Typography>
                  <TextField size="small" fullWidth placeholder="College / Organization" value={co.affiliation} onChange={(e) => handleUpdateCoAuthor(idx, "affiliation", e.target.value)} />
                </Box>
                <IconButton onClick={() => handleRemoveCoAuthor(idx)} sx={{ mt: 2, color: "var(--text-secondary)" }}><Delete /></IconButton>
              </Box>
            ))}
          </Box>
        )}
      </Grid2>

      <NoteBox />

      <Grid2 sx={{ mt: 1 }}>
        <FileField label="Published paper - 1st page" name="publishedPaper" onChange={setFile("publishedPaper")} />
        <FileField label="Upload the Reference pages with tick mark" name="referencePages" onChange={setFile("referencePages")} />
      </Grid2>

      <SubLabel text="Details of Journal:" />
      <Box sx={{ mb: 2 }}>
        <Typography sx={labelStyle}>Name of the Journal:</Typography>
        <TextField size="small" fullWidth multiline rows={2} value={form.journalName} onChange={set("journalName")} />
      </Box>
      <Grid2>
        <Box>
          <Typography sx={labelStyle}>Vol:</Typography>
          <TextField size="small" fullWidth value={form.vol} onChange={set("vol")} />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Issue:</Typography>
          <TextField size="small" fullWidth value={form.issue} onChange={set("issue")} />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Page No's:</Typography>
          <TextField size="small" fullWidth value={form.pageNos} onChange={set("pageNos")} />
        </Box>
      </Grid2>

      <SubLabel text="Date of the Journal:" />
      <Grid2>
        <Box>
          <Typography sx={labelStyle}>Month:</Typography>
          <Select size="small" fullWidth displayEmpty value={form.month} onChange={set("month")}>
            <MenuItem value="">Select</MenuItem>
            {MONTHS.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
          </Select>
        </Box>
        <Box>
          <Typography sx={labelStyle}>Year:</Typography>
          <TextField size="small" fullWidth value={form.year} onChange={set("year")} placeholder="YYYY" inputProps={{ maxLength: 4 }} />
        </Box>
      </Grid2>

      <Grid2 sx={{ mt: 2 }}>
        <Box>
          <Typography sx={labelStyle}>Journal H-Index:</Typography>
          <TextField size="small" fullWidth value={form.hIndex} onChange={set("hIndex")} />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Impact Factor:</Typography>
          <TextField size="small" fullWidth value={form.impactFactor} onChange={set("impactFactor")} />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Mention the Referencing No's that Belongs to AGEC</Typography>
          <TextField size="small" fullWidth value={form.referencingNos} onChange={set("referencingNos")} />
        </Box>
        <Box>
          <Typography sx={labelStyle}>SDGS</Typography>
          <TextField size="small" fullWidth value={form.sdgs} onChange={set("sdgs")} />
        </Box>
        <Box sx={{ mt: 1 }}>
          <Typography sx={labelStyle}>Whether you want to apply for incentive?</Typography>
          <Select size="small" fullWidth displayEmpty value={form.applyIncentive} onChange={set("applyIncentive")}>
            <MenuItem value="">Select</MenuItem>
            <MenuItem value="Yes">Yes</MenuItem>
            <MenuItem value="No">No</MenuItem>
          </Select>
        </Box>
        {form.applyIncentive === "Yes" && (
          <Box sx={{ mt: 1 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "var(--color-primary)" }}>Expected Amount:</Typography>
            <TextField size="small" value="1500" disabled sx={{ "& .MuiInputBase-input.Mui-disabled": { WebkitTextFillColor: "#10b981", fontWeight: 800, background: "rgba(16, 185, 129, 0.1)", borderRadius: "8px" } }} />
          </Box>
        )}
      </Grid2>

      <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 4 }}>
        <Button variant="outlined" onClick={() => setViewMode("list")} sx={{ px: 4, borderRadius: 2 }}>Cancel</Button>
        <SubmitBtn onClick={handleSubmit} loading={loading} />
      </Box>
    </FormCard>
  );

  return (
    <>
      <PageHeader title="Journal" subtitle="Manage and submit your journal publications" breadcrumbs={["Home", "Publications", "Journal"]} />
      
      {viewMode === "list" && renderList()}
      {viewMode === "select-year" && renderSelectYear()}
      {viewMode === "form" && renderForm()}

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack((p) => ({ ...p, open: false }))} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity={snack.severity} onClose={() => setSnack((p) => ({ ...p, open: false }))}>{snack.msg}</Alert>
      </Snackbar>
    </>
  );
}
