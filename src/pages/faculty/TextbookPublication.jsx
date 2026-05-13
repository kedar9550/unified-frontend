import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

import { Box, TextField, MenuItem, Select, Typography, Alert, Snackbar, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, CircularProgress, Autocomplete } from "@mui/material";
import { Delete, Search } from "@mui/icons-material";
import PageHeader from "../../components/common/PageHeader";
import {
  FacultyInfoRow, FormCard, Grid2, SubLabel, NoteBox, FileField, SubmitBtn,
  labelStyle, MONTHS, YEARS
} from "../../components/faculty/PublicationFormFields";
import API from "../../api/axios";

export default function TextbookPublication() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState("list"); // 'list', 'select-year', 'form'
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [publicationsList, setPublicationsList] = useState([]);
  const [editions, setEditions] = useState([]);
  const [isbnFetching, setIsbnFetching] = useState(false);

  const [form, setForm] = useState({
    title: "", publisher: "", isbn: "", yearOfPublication: "", 
    totalAuthors: 1, userAuthorPosition: 1, 
    edition: "", cost: "", month: "", year: "",
    applyIncentive: "", expectedAmount: "10,000",
    otherAuthors: []
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
    
    API.get("/api/research/textbook/editions").then(res => {
      setEditions(res.data?.data || []);
    }).catch(err => console.log("Failed to fetch editions", err));
  }, [viewMode]);

  // Handle dynamic author generation based on total authors and user position
  useEffect(() => {
    const total = parseInt(form.totalAuthors) || 1;
    const pos = parseInt(form.userAuthorPosition) || 1;
    
    // Auto-adjust if position is greater than total
    if (pos > total) {
      setForm(p => ({ ...p, userAuthorPosition: total }));
      return;
    }

    if (total === 1) {
      setForm(p => ({ ...p, otherAuthors: [] }));
      return;
    }

    let newOtherAuthors = [];
    for (let i = 1; i <= total; i++) {
        if (i !== pos) {
            // Keep existing data if available
            const existing = form.otherAuthors.find(a => a.authorPosition === i);
            newOtherAuthors.push(existing || {
                authorPosition: i,
                affiliationType: "",
                empId: "",
                authorName: "",
                affiliationName: ""
            });
        }
    }
    setForm(p => ({ ...p, otherAuthors: newOtherAuthors }));
  }, [form.totalAuthors, form.userAuthorPosition]);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  
  const validateFile = (file) => {
    if (!file) return true;
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.type)) {
      setSnack({ open: true, msg: "Only PDF, JPG, and PNG files are allowed.", severity: "error" });
      return false;
    }
    if (file.size > 500 * 1024) {
      setSnack({ open: true, msg: "File size exceeds 500KB limit.", severity: "error" });
      return false;
    }
    return true;
  };

  const setFile = (k) => (e) => {
    const file = e.target.files[0];
    if (file && validateFile(file)) {
      setFiles((p) => ({ ...p, [k]: file }));
    } else {
      e.target.value = null; // reset
    }
  };

  const fetchISBNData = async () => {
    if (!form.isbn) {
        setSnack({ open: true, msg: "Please enter an ISBN first.", severity: "warning" });
        return;
    }
    setIsbnFetching(true);
    try {
        const res = await API.get(`/api/research/textbook/isbn/${form.isbn}`);
        if (res.data?.success) {
            const data = res.data.data;
            setForm(p => ({ 
                ...p, 
                title: data.title || p.title, 
                publisher: data.publisher || p.publisher
            }));
            setSnack({ open: true, msg: "Book details fetched successfully!", severity: "success" });
        }
    } catch (err) {
        setSnack({ open: true, msg: err?.response?.data?.message || "Failed to fetch ISBN details.", severity: "error" });
    } finally {
        setIsbnFetching(false);
    }
  };

  const fetchCoAuthorName = async (pos, empId) => {
    try {
      const res = await API.get(`/api/employees/staff/${empId}`);
      if (res.data && res.data.success) {
        const staff = res.data.data;
        const name = staff.employeename || staff.EmployeeName || "";
        
        setForm(prev => {
          const updated = prev.otherAuthors.map(a => {
            if (a.authorPosition === pos) {
              return { ...a, authorName: name, affiliationName: "Aditya University" };
            }
            return a;
          });
          return { ...prev, otherAuthors: updated };
        });
      }
    } catch (err) {
      console.error("Failed to fetch staff data", err);
    }
  };

  const handleCoAuthorChange = (pos, field, value) => {
    const updated = form.otherAuthors.map(a => {
        if (a.authorPosition === pos) {
            const newA = { ...a, [field]: value };
            if (field === "affiliationType") {
                if (value === "Aditya University") {
                    newA.affiliationName = "Aditya University";
                    newA.authorName = ""; // clear name so it can be fetched
                } else {
                    newA.affiliationName = "";
                    newA.empId = "";
                    newA.authorName = "";
                }
            }
            return newA;
        }
        return a;
    });

    setForm(p => ({ ...p, otherAuthors: updated }));

    // Fetch name if Aditya University and Employee ID is entered (length >= 3)
    if (field === "empId" && value.length >= 3) {
      const author = updated.find(a => a.authorPosition === pos);
      if (author && author.affiliationType === "Aditya University") {
        fetchCoAuthorName(pos, value);
      }
    }
  };

  const handleSubmit = async () => {
    if (!user?.panNumber || user?.panNumber === "Not Set" || !user?.college || user?.college === "Not Set") {
      setSnack({ open: true, msg: "Please update your profile with PAN Number and College before submitting.", severity: "error" });
      return;
    }

    if (!form.title || !form.publisher || !form.isbn) {
      setSnack({ open: true, msg: "Please fill all required fields", severity: "error" });
      return;
    }
    
    if (!form.applyIncentive) {
      setSnack({ open: true, msg: "Please select whether you want to apply for an incentive", severity: "error" });
      return;
    }
    
    // Check if total authors is correctly filled
    const total = parseInt(form.totalAuthors);
    if (total > 1) {
      for (const a of form.otherAuthors) {
        if (!a.affiliationType || (a.affiliationType === 'Others' && (!a.authorName || !a.affiliationName)) || (a.affiliationType === 'Aditya University' && (!a.empId || !a.authorName))) {
          setSnack({ open: true, msg: `Please complete details for Author Position ${a.authorPosition}`, severity: "error" });
          return;
        }
      }
    }

    setLoading(true);
    try {
      const fd = new FormData();
      const submissionForm = { ...form };
      if (!submissionForm.yearOfPublication) submissionForm.yearOfPublication = form.year;

      // Construct final authors array for backend
      const allAuthors = [];
      const userPos = parseInt(form.userAuthorPosition);
      for (let i = 1; i <= total; i++) {
         if (i === userPos) {
             allAuthors.push({ authorPosition: i }); // Backend will fill user details
         } else {
             const coAuth = form.otherAuthors.find(a => a.authorPosition === i);
             if (coAuth) allAuthors.push(coAuth);
         }
      }

      // Append standard fields
      fd.append("title", submissionForm.title);
      fd.append("publisher", submissionForm.publisher);
      fd.append("isbn", submissionForm.isbn);
      fd.append("yearOfPublication", submissionForm.yearOfPublication);
      fd.append("totalAuthors", submissionForm.totalAuthors);
      fd.append("userAuthorPosition", submissionForm.userAuthorPosition);
      fd.append("edition", submissionForm.edition);
      fd.append("cost", submissionForm.cost);
      fd.append("month", submissionForm.month);
      fd.append("year", submissionForm.year);
      fd.append("applyIncentive", submissionForm.applyIncentive);
      fd.append("authors", JSON.stringify(allAuthors));
      
      fd.append("academicYear", selectedYear);
      fd.append("college", user?.college || "");
      if (form.applyIncentive === "Yes") fd.append("expectedAmount", "10,000");

      if (files.coverPage) fd.append("coverPage", files.coverPage);
      if (files.authorAffiliation) fd.append("authorAffiliation", files.authorAffiliation);
      if (files.index) fd.append("index", files.index);

      await API.post("/api/research/textbook", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setSnack({ open: true, msg: "Textbook submitted successfully!", severity: "success" });
      
      // Reset form
      setForm({ title: "", publisher: "", isbn: "", yearOfPublication: "", totalAuthors: 1, userAuthorPosition: 1, edition: "", cost: "", month: "", year: "", applyIncentive: "", expectedAmount: "10,000", otherAuthors: [] });
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
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h6" sx={{ color: "var(--text-primary)", fontWeight: 800 }}>My Textbook Publications</Typography>
        <Button variant="contained" onClick={() => setViewMode("select-year")} sx={{ background: "var(--color-primary)", borderRadius: "12px", px: 3, fontWeight: 700, textTransform: "none", "&:hover": { background: "var(--color-primary)", opacity: 0.9 } }}>
          Apply New
        </Button>
      </Box>
      <TableContainer component={Paper} sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-premium)", overflowX: "auto" }}>
        <Table>
          <TableHead sx={{ background: "var(--gradient-primary)" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>ISBN</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Applicant</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Academic Year</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(!publicationsList || publicationsList.length === 0) ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  No previous publications found. Click "Apply New" to submit one.
                </TableCell>
              </TableRow>
            ) : (
              publicationsList.map((pub, i) => (
                <TableRow key={pub._id || i}>
                  <TableCell sx={{ color: "var(--text-primary)", fontWeight: 500, py: 2 }}>{pub.title || "N/A"}</TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>{pub.isbn || "N/A"}</TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>{pub.facultyId?.name || "N/A"}</TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>{pub.academicYear?.year || "N/A"}</TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: pub.visibilityRole === "Applicant" ? "var(--color-primary)" : "text.secondary" }}>
                      {pub.visibilityRole || "Applicant"}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: pub.status?.includes('Rejected') ? "#ef4444" : pub.status === 'Approved' ? "#10b981" : "#e8a000",
                        fontWeight: 700,
                        background: pub.status?.includes('Rejected') ? "rgba(239, 68, 68, 0.1)" : pub.status === 'Approved' ? "rgba(16, 185, 129, 0.1)" : "rgba(232, 160, 0, 0.1)",
                        px: 1.5,
                        py: 0.5,
                        borderRadius: "6px",
                        display: "inline-block"
                      }}
                    >
                      {pub.status || "Pending"}
                    </Typography>
                  </TableCell>
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
    <FormCard title="Text book Submission">
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="body2" sx={{ background: "var(--bg-accent-1)", color: "var(--color-primary)", px: 2, py: 0.8, borderRadius: "8px", fontWeight: 700, border: "1px solid var(--border-color)" }}>
          Academic Year: {academicYears.find(y => y._id === selectedYear)?.year || "Selected"}
        </Typography>
        <Button size="small" variant="text" onClick={() => setViewMode("select-year")} sx={{ fontWeight: 700, textTransform: "none", color: "var(--color-primary)" }}>Change Year</Button>
      </Box>

      <FacultyInfoRow />

      <SubLabel text="Details of the Text Book:" />
      <Grid2>
        <Box>
          <Typography sx={labelStyle}>ISBN NO :</Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField 
                size="small" 
                fullWidth 
                value={form.isbn} 
                onChange={set("isbn")} 
                placeholder="Enter ISBN to auto-fetch"
            />
            <Button 
                variant="contained" 
                onClick={fetchISBNData} 
                disabled={!form.isbn || isbnFetching}
                sx={{ minWidth: "100px", textTransform: "none", borderRadius: "8px", background: "var(--color-primary)" }}
            >
                {isbnFetching ? <CircularProgress size={20} color="inherit" /> : "Fetch"}
            </Button>
          </Box>
        </Box>
        <Box>
          <Typography sx={labelStyle}>Title of the Text Book :</Typography>
          <TextField size="small" fullWidth value={form.title} onChange={set("title")} inputProps={{ maxLength: 200 }} />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Name of the Publisher :</Typography>
          <TextField size="small" fullWidth value={form.publisher} onChange={set("publisher")} />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Edition :</Typography>
          <Autocomplete
            freeSolo
            options={editions.map(e => e.name)}
            value={form.edition}
            onChange={(e, newValue) => setForm(p => ({...p, edition: newValue || ""}))}
            onInputChange={(e, newInputValue) => setForm(p => ({...p, edition: newInputValue}))}
            renderInput={(params) => <TextField {...params} size="small" placeholder="Select or type Edition (e.g. 1st Edition)" />}
          />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Cost:</Typography>
          <TextField size="small" fullWidth value={form.cost} onChange={set("cost")} placeholder="Rs. /-" />
        </Box>
        <Box></Box>

        {/* Authors Section */}
        <Box sx={{ gridColumn: { sm: "1 / -1" }, background: "var(--bg-panel)", p: 2, borderRadius: "12px", border: "1px solid var(--border-color)", mt: 2 }}>
            <Typography sx={{ fontWeight: 700, color: "var(--text-primary)", mb: 2 }}>Author Details</Typography>
            <Grid2>
                <Box>
                    <Typography sx={labelStyle}>Total Number of Authors :</Typography>
                    <TextField 
                        size="small" 
                        fullWidth 
                        type="number" 
                        value={form.totalAuthors} 
                        onChange={set("totalAuthors")}
                        inputProps={{ min: 1 }}
                    />
                </Box>
                {parseInt(form.totalAuthors) > 1 && (
                    <Box>
                        <Typography sx={labelStyle}>Your Author Position :</Typography>
                        <Select size="small" fullWidth value={form.userAuthorPosition} onChange={set("userAuthorPosition")}>
                            {Array.from({ length: parseInt(form.totalAuthors) || 1 }, (_, i) => (
                                <MenuItem key={i+1} value={i+1}>{i+1}</MenuItem>
                            ))}
                        </Select>
                    </Box>
                )}
            </Grid2>

            {parseInt(form.totalAuthors) > 1 && (
                <Box sx={{ mt: 3 }}>
                    <Typography sx={{ ...labelStyle, mb: 1 }}>Name & affiliation of Co-Author(s) :</Typography>
                    {form.otherAuthors.map((ca, index) => (
                        <Box key={ca.authorPosition} sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2, p: 2, borderRadius: "12px", border: "1px dashed var(--border-color)", background: "var(--bg-accent-1)", position: "relative" }}>
                            <Box sx={{ display: "flex", gap: 2, flexWrap: { xs: "wrap", sm: "nowrap" }, alignItems: "center" }}>
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: "30px", height: "30px", background: "var(--color-primary)", color: "#fff", borderRadius: "50%", fontWeight: 700 }}>
                                    {ca.authorPosition}
                                </Box>
                                <Box sx={{ flex: 1, minWidth: "150px" }}>
                                    <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>AFFILIATION TYPE</Typography>
                                    <Select
                                        size="small"
                                        fullWidth
                                        value={ca.affiliationType}
                                        onChange={(e) => handleCoAuthorChange(ca.authorPosition, "affiliationType", e.target.value)}
                                        displayEmpty
                                    >
                                        <MenuItem value="" disabled>Select Affiliation</MenuItem>
                                        <MenuItem value="Aditya University">Aditya University</MenuItem>
                                        <MenuItem value="Others">Others</MenuItem>
                                    </Select>
                                </Box>

                                {ca.affiliationType === "Aditya University" ? (
                                    <>
                                        <Box sx={{ flex: 1, minWidth: "120px" }}>
                                            <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>EMPLOYEE ID</Typography>
                                            <TextField
                                                size="small"
                                                fullWidth
                                                value={ca.empId}
                                                onChange={(e) => handleCoAuthorChange(ca.authorPosition, "empId", e.target.value)}
                                                placeholder="e.g. 5741"
                                            />
                                        </Box>
                                        <Box sx={{ flex: 2, minWidth: "200px" }}>
                                            <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>CO-AUTHOR NAME</Typography>
                                            <TextField
                                                size="small"
                                                fullWidth
                                                value={ca.authorName}
                                                disabled
                                                placeholder="Fetched from API"
                                                sx={{ background: "rgba(0,0,0,0.02)" }}
                                            />
                                        </Box>
                                    </>
                                ) : (
                                    <>
                                        <Box sx={{ flex: 1, minWidth: "180px" }}>
                                            <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>CO-AUTHOR NAME</Typography>
                                            <TextField
                                                size="small"
                                                fullWidth
                                                value={ca.authorName}
                                                onChange={(e) => handleCoAuthorChange(ca.authorPosition, "authorName", e.target.value)}
                                                placeholder="Full Name"
                                            />
                                        </Box>
                                        <Box sx={{ flex: 2, minWidth: "200px" }}>
                                            <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>AFFILIATION</Typography>
                                            <TextField
                                                size="small"
                                                fullWidth
                                                value={ca.affiliationName}
                                                onChange={(e) => handleCoAuthorChange(ca.authorPosition, "affiliationName", e.target.value)}
                                                placeholder="College / Organization"
                                            />
                                        </Box>
                                    </>
                                )}
                            </Box>
                        </Box>
                    ))}
                </Box>
            )}
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

      <Box sx={{ background: "rgba(232, 160, 0, 0.05)", border: "1px solid rgba(232, 160, 0, 0.2)", borderRadius: "12px", p: 2, mt: 3, display: "flex", gap: 1.5, alignItems: "flex-start" }}>
        <Typography sx={{ fontSize: 12, fontWeight: 800, color: "#e8a000", background: "rgba(232, 160, 0, 0.15)", px: 1, py: 0.2, borderRadius: "4px" }}>NOTE</Typography>
        <Typography sx={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
          1. Please Upload (PNG or JPG or JPEG or PDF) Only.<br/>
          2. File Size Should not Exceed <strong>500KB</strong>.<br/>
        </Typography>
      </Box>

      <Grid2 sx={{ mt: 3 }}>
        <FileField label="Attach CoverPage" name="coverPage" onChange={setFile("coverPage")} />
        <FileField label="Attach Page displaying author affiliation" name="authorAffiliation" onChange={setFile("authorAffiliation")} />
        <FileField label="Attach Index" name="index" onChange={setFile("index")} />
        <Box>
          <Typography sx={labelStyle}>Whether you want to apply for incentive?</Typography>
          <Select size="small" fullWidth displayEmpty value={form.applyIncentive} onChange={set("applyIncentive")}>
            <MenuItem value="">Select</MenuItem>
            <MenuItem value="Yes">Yes</MenuItem>
            <MenuItem value="No">No</MenuItem>
          </Select>
        </Box>
        {form.applyIncentive === "Yes" && (
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "var(--color-primary)" }}>Expected Amount:</Typography>
            <TextField size="small" value="10,000" disabled sx={{ "& .MuiInputBase-input.Mui-disabled": { WebkitTextFillColor: "#10b981", fontWeight: 800, background: "rgba(16, 185, 129, 0.1)", borderRadius: "8px" } }} />
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
    <Box sx={{ p: { xs: 2.5, md: 4 } }}>
      <PageHeader title="Text Book" subtitle="Manage and submit your textbook publication details" breadcrumbs={["Home", "Publications", "Text Book"]} />

      {viewMode === "list" && renderList()}
      {viewMode === "select-year" && renderSelectYear()}
      {viewMode === "form" && renderForm()}

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack((p) => ({ ...p, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snack.severity} onClose={() => setSnack((p) => ({ ...p, open: false }))} sx={{ boxShadow: "var(--shadow-premium)" }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
