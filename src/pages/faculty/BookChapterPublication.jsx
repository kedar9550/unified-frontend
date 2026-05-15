import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

import { Box, TextField, MenuItem, Select, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Autocomplete } from "@mui/material";
import { toast } from "sonner";
import { AddCircle, Delete } from "@mui/icons-material";
import PageHeader from "../../components/common/PageHeader";
import {
  FacultyInfoRow, FormCard, Grid2, SubLabel, NoteBox, FileField, SubmitBtn,
  labelStyle, MONTHS, YEARS
} from "../../components/faculty/PublicationFormFields";
import API from "../../api/axios";

export default function BookChapterPublication() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState("list"); // 'list', 'select-year', 'form'
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [publicationsList, setPublicationsList] = useState([]);
  const [publishers, setPublishers] = useState([]);

  const [form, setForm] = useState({
    textBookName: "", chapterTitle: "", isbn: "", yearOfPublication: "",
    firstAuthor: "", authorPosition: "", chaptersContributed: "", publisher: "", coAuthors: [], month: "", year: "",
    applyIncentive: "", publicationType: "National", customPublisher: "", expectedAmount: "7,500"
  });
  const [files, setFiles] = useState({ coverPage: null, authorAffiliation: null, index: null, softCopy: null });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  useEffect(() => {
    API.get("/api/research/book-chapter").then(res => {
      setPublicationsList(res.data?.data || res.data || []);
    }).catch(err => console.log("Failed to fetch book chapters", err));

    API.get("/api/academic-years").then(res => {
      setAcademicYears(res.data?.years || res.data?.data || []);
    }).catch(err => console.log("Failed to fetch academic years", err));

    API.get("/api/publishers").then(res => {
      setPublishers(res.data?.data || []);
    }).catch(err => console.log("Failed to fetch publishers", err));
  }, [viewMode]);

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
    const newErrors = {};
    if (!form.textBookName) newErrors.textBookName = true;
    if (!form.chapterTitle) newErrors.chapterTitle = true;
    if (!form.isbn) newErrors.isbn = true;
    if (!form.yearOfPublication) newErrors.yearOfPublication = true;
    if (!form.firstAuthor) newErrors.firstAuthor = true;
    if (!form.publisher) newErrors.publisher = true;
    if (!form.month) newErrors.month = true;
    if (!form.year) newErrors.year = true;
    if (!form.applyIncentive) newErrors.applyIncentive = true;

    if (!files.coverPage) newErrors.coverPage = true;
    if (!files.authorAffiliation) newErrors.authorAffiliation = true;
    if (!files.index) newErrors.index = true;
    if (!files.softCopy) newErrors.softCopy = true;

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fill all mandatory fields and upload required documents");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === "coAuthors") {
          fd.append(k, JSON.stringify(v));
        } else if (k === "publicationType") {
          fd.append(k, form.publicationType);
        } else if (k === "publisher") {
          fd.append(k, form.publisher === "Others" ? form.customPublisher : form.publisher);
        } else if (k === "expectedAmount") {
          fd.append(k, form.expectedAmount);
        } else if (k === "customPublisher") {
          // ignore
        } else {
          fd.append(k, v);
        }
      });
      Object.entries(files).forEach(([k, v]) => { if (v) fd.append(k, v); });
      fd.append("academicYear", selectedYear);
      fd.append("college", user?.college || "");
      fd.append("panNumber", user?.panNumber || "");

      await API.post("/api/research/book-chapter", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Book Chapter submitted successfully!");
      setForm({ textBookName: "", chapterTitle: "", isbn: "", yearOfPublication: "", firstAuthor: "", authorPosition: "", chaptersContributed: "", publisher: "", coAuthors: [], month: "", year: "", applyIncentive: "", publicationType: "National", customPublisher: "" });
      setFiles({ coverPage: null, authorAffiliation: null, index: null, softCopy: null });
      setErrors({});
      setSelectedYear("");
      setViewMode("list");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  const renderList = () => (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h6" sx={{ color: "var(--text-primary)", fontWeight: 800 }}>My Book Chapter Publications</Typography>
        <Button 
          variant="contained" 
          onClick={() => setViewMode("select-year")} 
          sx={{ 
            background: "var(--gradient-primary)", 
            borderRadius: "12px", 
            px: 3, 
            fontWeight: 700, 
            textTransform: "none", 
            "&:hover": { 
              opacity: 0.9,
              transform: "translateY(-1px)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
            },
            transition: "all 0.2s ease"
          }}
        >
          Apply New
        </Button>
      </Box>
      <TableContainer component={Paper} sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-premium)", overflowX: "auto" }}>
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
          <Button 
            variant="outlined" 
            onClick={() => setViewMode("list")} 
            sx={{ 
              borderRadius: "12px", 
              textTransform: "none", 
              fontWeight: 600,
              color: "var(--text-primary)",
              borderColor: "var(--border-color)",
              "&:hover": {
                borderColor: "var(--color-primary)",
                background: "rgba(0,0,0,0.02)"
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            disabled={!selectedYear} 
            onClick={() => setViewMode("form")} 
            sx={{ 
              background: "var(--gradient-primary)", 
              borderRadius: "12px", 
              px: 4, 
              fontWeight: 700, 
              textTransform: "none", 
              "&:hover": { 
                opacity: 0.9,
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
              },
              "&.Mui-disabled": {
                background: "var(--bg-panel)",
                color: "var(--text-secondary)",
                opacity: 0.5
              },
              transition: "all 0.2s ease"
            }}
          >
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

      <FacultyInfoRow />

      <Grid2 sx={{ mt: 1 }}>
        <Box>
          <Typography sx={labelStyle}>Title of the Book:</Typography>
          <TextField size="small" fullWidth value={form.textBookName} onChange={set("textBookName")} error={!!errors.textBookName} />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Title of the Chapter:</Typography>
          <TextField size="small" fullWidth value={form.chapterTitle} onChange={set("chapterTitle")} inputProps={{ maxLength: 100 }}
            error={!!errors.chapterTitle}
            helperText={errors.chapterTitle ? "Title is required" : `${100 - form.chapterTitle.length} Character(s) Remaining`} />
        </Box>
        <Box>
          <Typography sx={labelStyle}>ISBN NO :</Typography>
          <TextField size="small" fullWidth value={form.isbn} onChange={set("isbn")} error={!!errors.isbn} />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Year of Publication:</Typography>
          <Select size="small" fullWidth displayEmpty value={form.yearOfPublication} onChange={set("yearOfPublication")} error={!!errors.yearOfPublication}>
            <MenuItem value="">Select</MenuItem>
            {YEARS.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
        </Box>
        <Box>
          <Typography sx={labelStyle}>Publication Type:</Typography>
          <Select
            fullWidth
            size="small"
            value={form.publicationType}
            onChange={(e) => setForm(p => ({ ...p, publicationType: e.target.value }))}
          >
            <MenuItem value="National">National</MenuItem>
            <MenuItem value="International">International</MenuItem>
          </Select>
        </Box>
        <Box>
          <Typography sx={labelStyle}>Whether you are the first author :</Typography>
          <Select size="small" fullWidth displayEmpty value={form.firstAuthor} onChange={set("firstAuthor")} error={!!errors.firstAuthor}>
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
        <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
          <Typography sx={labelStyle}>Name of the Publisher :</Typography>
          <Autocomplete
            options={[...publishers.filter(p => p.type === form.publicationType), { name: "Others", type: form.publicationType }]}
            groupBy={(option) => option.type}
            getOptionLabel={(option) => option.name || ""}
            value={publishers.find(p => p.name === form.publisher) || (form.publisher === "Others" ? { name: "Others", type: form.publicationType } : (form.publisher ? { name: form.publisher, type: form.publicationType || "Unknown" } : null))}
            isOptionEqualToValue={(option, value) => option.name === value.name}
            onChange={(e, newValue) => setForm(p => ({ ...p, publisher: newValue ? newValue.name : "" }))}
            freeSolo
            onInputChange={(e, newInputValue) => {
              if (e?.type === "change") {
                setForm(p => ({ ...p, publisher: newInputValue }));
              }
            }}
            renderInput={(params) => (
              <TextField {...params} size="small" fullWidth placeholder="Select or search publisher" error={!!errors.publisher} />
            )}
          />
          {form.publisher === "Others" && (
            <TextField
              size="small"
              fullWidth
              sx={{ mt: 1.5 }}
              placeholder="Enter Publisher Name"
              value={form.customPublisher}
              onChange={(e) => setForm(p => ({ ...p, customPublisher: e.target.value }))}
            />
          )}
        </Box>

        {form.firstAuthor === "No" && (
          <Box sx={{ gridColumn: { sm: "1 / -1" }, mt: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
              <Typography sx={labelStyle}>Name & affiliation of Co-Author(s) :</Typography>
              <Button startIcon={<AddCircle />} onClick={handleAddCoAuthor} sx={{ textTransform: "none", fontWeight: 700, color: "var(--color-primary)" }}>Add Co-Author</Button>
            </Box>
            {form.coAuthors.map((co, idx) => (
              <Box key={idx} sx={{ display: "flex", gap: 2, mb: 2, p: 2, background: "var(--bg-accent-1)", borderRadius: "16px", alignItems: "center", border: "1px solid var(--border-color)" }}>
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

      <SubLabel text="Date of the Publication:" />
      <Grid2>
        <Box>
          <Typography sx={labelStyle}>Month:</Typography>
          <Select size="small" fullWidth displayEmpty value={form.month} onChange={set("month")} error={!!errors.month}>
            <MenuItem value="">Select</MenuItem>
            {MONTHS.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
          </Select>
        </Box>
        <Box>
          <Typography sx={labelStyle}>Year:</Typography>
          <TextField size="small" fullWidth value={form.year} onChange={set("year")} placeholder="YYYY" inputProps={{ maxLength: 4 }} error={!!errors.year} />
        </Box>
      </Grid2>

      <NoteBox />

      <Grid2 sx={{ mt: 1 }}>
        <FileField label="Attach CoverPage" name="coverPage" onChange={setFile("coverPage")} error={!!errors.coverPage} onError={(m) => toast.error(m)} />
        <FileField label="Attach Page displaying author affiliation" name="authorAffiliation" onChange={setFile("authorAffiliation")} error={!!errors.authorAffiliation} onError={(m) => toast.error(m)} />
        <FileField label="Attach Index" name="index" onChange={setFile("index")} error={!!errors.index} onError={(m) => toast.error(m)} />
        <FileField label="Attach Soft Copy of Chapter" name="softCopy" onChange={setFile("softCopy")} error={!!errors.softCopy} onError={(m) => toast.error(m)} />
        <Box>
          <Typography sx={labelStyle}>Whether you want to apply for incentive?</Typography>
          <Select size="small" fullWidth displayEmpty value={form.applyIncentive} onChange={set("applyIncentive")} error={!!errors.applyIncentive}>
            <MenuItem value="">Select</MenuItem>
            <MenuItem value="Yes">Yes</MenuItem>
            <MenuItem value="No">No</MenuItem>
          </Select>
        </Box>
        {form.applyIncentive === "Yes" && (
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "var(--color-primary)" }}>Maximum Incentive/Claimable Amount:</Typography>
            <TextField 
                size="small" 
                value={form.expectedAmount} 
                disabled 
                sx={{ "& .MuiInputBase-root": { background: "rgba(16, 185, 129, 0.05)" }, "& .MuiInputBase-input.Mui-disabled": { WebkitTextFillColor: "#10b981", fontWeight: 800, px: 2, borderRadius: "8px" } }} 
                helperText="For Book Chapter indexed in Scopus"
            />
          </Box>
        )}
      </Grid2>

      <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 4 }}>
        <Button 
          variant="outlined" 
          onClick={() => setViewMode("list")} 
          sx={{ 
            px: 4, 
            height: "44px", 
            borderRadius: "12px", 
            textTransform: "none", 
            fontWeight: 600,
            color: "var(--text-primary)",
            borderColor: "var(--border-color)",
            "&:hover": { 
              borderColor: "#ef4444", 
              color: "#ef4444",
              background: "rgba(239, 68, 68, 0.05)" 
            },
            transition: "all 0.3s ease"
          }}
        >
          Cancel
        </Button>
        <SubmitBtn onClick={handleSubmit} loading={loading} />
      </Box>
    </FormCard>
  );

  return (
    <Box sx={{ p: { xs: 2.5, md: 4 } }}>
      <PageHeader title="Book Chapter" subtitle="Manage and submit your book chapter publication details" breadcrumbs={["Home", "Publications", "Book Chapter"]} />

      {viewMode === "list" && renderList()}
      {viewMode === "select-year" && renderSelectYear()}
      {viewMode === "form" && renderForm()}

    </Box>
  );
}
