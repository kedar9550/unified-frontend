import { useState, useEffect } from "react";
import { Box, TextField, MenuItem, Select, Typography, Alert, Snackbar, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import PageHeader from "../../components/common/PageHeader";
import {
  FacultyInfoRow, FormCard, Grid2, SubLabel, NoteBox, FileField, SubmitBtn,
  labelStyle, MONTHS, YEARS
} from "../../components/faculty/PublicationFormFields";
import API from "../../api/axios";

export default function BookChapterPublication() {
  const [viewMode, setViewMode] = useState("list"); // 'list', 'select-year', 'form'
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [publicationsList, setPublicationsList] = useState([]);

  const [form, setForm] = useState({
    college: "", textBookName: "", chapterTitle: "", isbn: "", yearOfPublication: "",
    firstAuthor: "", chaptersContributed: "", publisher: "", coAuthors: "", month: "", year: "",
  });
  const [files, setFiles] = useState({ coverPage: null, authorAffiliation: null, index: null, softCopy: null });
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  useEffect(() => {
    API.get("/api/research/book-chapter").then(res => {
      setPublicationsList(res.data?.data || res.data || []);
    }).catch(err => console.log("Failed to fetch book chapters", err));

    API.get("/api/academic-years").then(res => {
      setAcademicYears(res.data?.years || res.data?.data || []);
    }).catch(err => console.log("Failed to fetch academic years", err));
  }, [viewMode]);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const setFile = (k) => (e) => setFiles((p) => ({ ...p, [k]: e.target.files[0] }));

  const handleSubmit = async () => {
    if (!form.textBookName || !form.chapterTitle) {
      setSnack({ open: true, msg: "Please fill all required fields", severity: "error" });
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      Object.entries(files).forEach(([k, v]) => { if (v) fd.append(k, v); });
      fd.append("academicYear", selectedYear);

      await API.post("/api/research/book-chapter", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setSnack({ open: true, msg: "Book Chapter submitted successfully!", severity: "success" });
      setForm({ college: "", textBookName: "", chapterTitle: "", isbn: "", yearOfPublication: "", firstAuthor: "", chaptersContributed: "", publisher: "", coAuthors: "", month: "", year: "" });
      setFiles({ coverPage: null, authorAffiliation: null, index: null, softCopy: null });
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
        <Typography variant="h6" sx={{ color: "var(--text-primary)", fontWeight: 800 }}>My Book Chapter Publications</Typography>
        <Button variant="contained" onClick={() => setViewMode("select-year")} sx={{ background: "var(--color-primary)", borderRadius: "12px", px: 3, fontWeight: 700, textTransform: "none", "&:hover": { background: "var(--color-primary)", opacity: 0.9 } }}>
          Apply New
        </Button>
      </Box>
      <TableContainer component={Paper} sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-premium)", overflow: "hidden" }}>
        <Table>
          <TableHead sx={{ background: "var(--gradient-primary)" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Text Book Name</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Chapter Title</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Publisher</TableCell>
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
                  <TableCell sx={{ color: "var(--text-primary)", fontWeight: 500, py: 2 }}>{pub.textBookName || "N/A"}</TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>{pub.chapterTitle || "N/A"}</TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>{pub.publisher || "N/A"}</TableCell>
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
    <FormCard title="Book chapter Submission">
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="body2" sx={{ background: "var(--bg-accent-1)", color: "var(--color-primary)", px: 2, py: 0.8, borderRadius: "8px", fontWeight: 700, border: "1px solid var(--border-color)" }}>
          Academic Year: {academicYears.find(y => y._id === selectedYear)?.year || "Selected"}
        </Typography>
        <Button size="small" variant="text" onClick={() => setViewMode("select-year")} sx={{ fontWeight: 700, textTransform: "none", color: "var(--color-primary)" }}>Change Year</Button>
      </Box>

      <FacultyInfoRow college={form.college} setCollege={(v) => setForm(p => ({ ...p, college: v }))} />

      <Grid2 sx={{ mt: 1 }}>
        <Box>
          <Typography sx={labelStyle}>Name of the Text Book:</Typography>
          <TextField size="small" fullWidth value={form.textBookName} onChange={set("textBookName")} inputProps={{ maxLength: 100 }}
            helperText={`${100 - form.textBookName.length} Character(s) Remaining`} />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Title of the Chapter Name:</Typography>
          <TextField size="small" fullWidth value={form.chapterTitle} onChange={set("chapterTitle")} inputProps={{ maxLength: 100 }}
            helperText={`${100 - form.chapterTitle.length} Character(s) Remaining`} />
        </Box>
        <Box>
          <Typography sx={labelStyle}>ISBN NO :</Typography>
          <TextField size="small" fullWidth value={form.isbn} onChange={set("isbn")} />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Year of Publication:</Typography>
          <Select size="small" fullWidth displayEmpty value={form.yearOfPublication} onChange={set("yearOfPublication")}>
            <MenuItem value="">Select</MenuItem>
            {YEARS.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
        </Box>
        <Box>
          <Typography sx={labelStyle}>Whether you are the first author :</Typography>
          <Select size="small" fullWidth displayEmpty value={form.firstAuthor} onChange={set("firstAuthor")}>
            <MenuItem value="">Select</MenuItem>
            <MenuItem value="Yes">Yes</MenuItem>
            <MenuItem value="No">No</MenuItem>
          </Select>
        </Box>
        <Box>
          <Typography sx={labelStyle}>Number of Chapters Contributed by the Author :</Typography>
          <TextField size="small" fullWidth type="number" value={form.chaptersContributed} onChange={set("chaptersContributed")} />
        </Box>
        <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
          <Typography sx={labelStyle}>Name of the Publisher :</Typography>
          <TextField size="small" fullWidth value={form.publisher} onChange={set("publisher")} />
        </Box>
        <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
          <Typography sx={labelStyle}>Name & affiliation of Co-Author(s) :</Typography>
          <TextField size="small" fullWidth multiline rows={3} value={form.coAuthors} onChange={set("coAuthors")} />
        </Box>
      </Grid2>

      <SubLabel text="Date of the Publication:" />
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

      <NoteBox />

      <Grid2 sx={{ mt: 1 }}>
        <FileField label="Attach CoverPage" name="coverPage" onChange={setFile("coverPage")} />
        <FileField label="Attach Page displaying author affiliation" name="authorAffiliation" onChange={setFile("authorAffiliation")} />
        <FileField label="Attach Index" name="index" onChange={setFile("index")} />
        <FileField label="Attach Soft Copy of Chapter" name="softCopy" onChange={setFile("softCopy")} />
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: "var(--color-primary)" }}>Expected Amount:</Typography>
          <TextField size="small" value="1500" disabled sx={{ "& .MuiInputBase-input.Mui-disabled": { WebkitTextFillColor: "#10b981", fontWeight: 800, background: "rgba(16, 185, 129, 0.1)", borderRadius: "8px" } }} />
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
      <PageHeader title="Book Chapter" subtitle="Manage and submit your book chapter publication details" breadcrumbs={["Home", "Publications", "Book Chapter"]} />

      {viewMode === "list" && renderList()}
      {viewMode === "select-year" && renderSelectYear()}
      {viewMode === "form" && renderForm()}

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack((p) => ({ ...p, open: false }))} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity={snack.severity} onClose={() => setSnack((p) => ({ ...p, open: false }))}>{snack.msg}</Alert>
      </Snackbar>
    </>
  );
}
