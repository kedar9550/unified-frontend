import { useState, useEffect } from "react";
import { Box, TextField, MenuItem, Select, Typography, Alert, Snackbar, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import PageHeader from "../../components/common/PageHeader";
import {
  FacultyInfoRow, FormCard, Grid2, SubLabel, NoteBox, FileField, SubmitBtn,
  labelStyle, MONTHS, YEARS
} from "../../components/faculty/PublicationFormFields";
import API from "../../api/axios";

const EDITIONS = ["1st", "2nd", "3rd", "4th", "5th"];

export default function TextbookPublication() {
  const [viewMode, setViewMode] = useState("list"); // 'list', 'select-year', 'form'
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [publicationsList, setPublicationsList] = useState([]);

  const [form, setForm] = useState({
    college: "", title: "", publisher: "", isbn: "", yearOfPublication: "", firstAuthor: "",
    chaptersContributed: "", edition: "", cost: "", coAuthors: "", month: "", year: "",
  });
  const [files, setFiles] = useState({ coverPage: null, authorAffiliation: null, index: null });
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  useEffect(() => {
    API.get("/api/research/textbook").then(res => {
      setPublicationsList(res.data?.data || res.data || []);
    }).catch(err => console.log("Failed to fetch textbooks", err));

    API.get("/api/academic-years").then(res => {
      setAcademicYears(res.data?.years || res.data?.data || []);
    }).catch(err => console.log("Failed to fetch academic years", err));
  }, [viewMode]);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const setFile = (k) => (e) => setFiles((p) => ({ ...p, [k]: e.target.files[0] }));

  const handleSubmit = async () => {
    if (!form.title || !form.publisher || !form.isbn) {
      setSnack({ open: true, msg: "Please fill all required fields", severity: "error" });
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (files.coverPage) fd.append("coverPage", files.coverPage);
      if (files.authorAffiliation) fd.append("authorAffiliation", files.authorAffiliation);
      if (files.index) fd.append("index", files.index);
      fd.append("academicYear", selectedYear);
      
      await API.post("/api/research/textbook", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setSnack({ open: true, msg: "Textbook submitted successfully!", severity: "success" });
      setForm({ college: "", title: "", publisher: "", isbn: "", yearOfPublication: "", firstAuthor: "", chaptersContributed: "", edition: "", cost: "", coAuthors: "", month: "", year: "" });
      setFiles({ coverPage: null, authorAffiliation: null, index: null });
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
        <Typography variant="h6" color="primary" fontWeight="bold">My Textbook Publications</Typography>
        <Button variant="contained" onClick={() => setViewMode("select-year")} sx={{ background: "#29b6f6", "&:hover": { background: "#0288d1" } }}>
          Apply New
        </Button>
      </Box>
      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
        <Table>
          <TableHead sx={{ background: "#f5f5f5" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Publisher</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>ISBN</TableCell>
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
                  <TableCell>{pub.publisher || "N/A"}</TableCell>
                  <TableCell>{pub.isbn || "N/A"}</TableCell>
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
    <FormCard title="Text book Submission">
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="body2" sx={{ background: "#e3f2fd", color: "#1565c0", px: 2, py: 0.5, borderRadius: 1, fontWeight: 500 }}>
          Academic Year: {academicYears.find(y => y._id === selectedYear)?.year || "Selected"}
        </Typography>
        <Button size="small" variant="text" onClick={() => setViewMode("select-year")}>Change Year</Button>
      </Box>

      <FacultyInfoRow college={form.college} setCollege={(v) => setForm(p => ({ ...p, college: v }))} />

      <SubLabel text="Details of the Text Book:" />
      <Grid2>
        <Box>
          <Typography sx={labelStyle}>Title of the Text Book :</Typography>
          <TextField size="small" fullWidth value={form.title} onChange={set("title")} inputProps={{ maxLength: 60 }}
            helperText={`${60 - form.title.length} Character(s) Remaining`} />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Name of the Publisher :</Typography>
          <TextField size="small" fullWidth value={form.publisher} onChange={set("publisher")} />
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
        <Box>
          <Typography sx={labelStyle}>Edition :</Typography>
          <Select size="small" fullWidth displayEmpty value={form.edition} onChange={set("edition")}>
            <MenuItem value="">Select</MenuItem>
            {EDITIONS.map((e) => <MenuItem key={e} value={e}>{e}</MenuItem>)}
          </Select>
        </Box>
        <Box>
          <Typography sx={labelStyle}>Cost:</Typography>
          <TextField size="small" fullWidth value={form.cost} onChange={set("cost")} placeholder="Rs. /-" />
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
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#1565c0" }}>Expected Amount:</Typography>
          <TextField size="small" value="10,000" disabled sx={{ "& .MuiInputBase-input.Mui-disabled": { WebkitTextFillColor: "#2e7d32", fontWeight: 700, background: "#e8f5e9" } }} />
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
      <PageHeader title="Text Book" subtitle="Manage and submit your textbook publication details" breadcrumbs={["Home", "Publications", "Text Book"]} />

      {viewMode === "list" && renderList()}
      {viewMode === "select-year" && renderSelectYear()}
      {viewMode === "form" && renderForm()}

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack((p) => ({ ...p, open: false }))} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity={snack.severity} onClose={() => setSnack((p) => ({ ...p, open: false }))}>{snack.msg}</Alert>
      </Snackbar>
    </>
  );
}
