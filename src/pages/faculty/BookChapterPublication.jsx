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
    chaptersContributed: "", publisher: "", month: "", year: "",
    applyIncentive: "", publicationType: "National", customPublisher: "", applyingSeedGrant: "",
    totalAuthors: 1, userAuthorPosition: 1, otherAuthors: []
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

  // Handle dynamic author generation based on total authors and user position
  useEffect(() => {
    let total = parseInt(form.totalAuthors);
    if (isNaN(total) || total < 1) {
      total = 1;
      if (form.totalAuthors !== "") {
        setForm(p => ({ ...p, totalAuthors: 1 }));
      }
    }
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
    const newErrors = {};
    if (!form.textBookName) newErrors.textBookName = true;
    if (!form.chapterTitle) newErrors.chapterTitle = true;
    if (!form.isbn) newErrors.isbn = true;
    if (!form.yearOfPublication) newErrors.yearOfPublication = true;
    if (!form.publisher) newErrors.publisher = true;
    if (!form.month) newErrors.month = true;
    if (!form.year) newErrors.year = true;
    if (!form.applyIncentive) newErrors.applyIncentive = true;
    if (!form.applyingSeedGrant) newErrors.applyingSeedGrant = true;

    if (!files.coverPage) newErrors.coverPage = true;
    if (!files.authorAffiliation) newErrors.authorAffiliation = true;
    if (!files.index) newErrors.index = true;
    if (!files.softCopy) newErrors.softCopy = true;

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fill all mandatory fields and upload required documents");
      return;
    }

    const total = parseInt(form.totalAuthors) || 1;
    if (total < 1) {
      toast.error("Total number of authors must be at least 1");
      return;
    }
    
    // Validate co-authors dynamically
    if (total > 1) {
      for (const a of form.otherAuthors) {
        if (!a.affiliationType || (a.affiliationType === 'Others' && (!a.authorName || !a.affiliationName)) || (a.affiliationType === 'Aditya University' && (!a.empId || !a.authorName))) {
          toast.error(`Please complete details for Author Position ${a.authorPosition}`);
          return;
        }
      }
    }

    setLoading(true);
    try {
      const fd = new FormData();

      // Calculate firstAuthor and authorPosition
      const isFirst = (parseInt(form.userAuthorPosition) === 1) ? "Yes" : "No";
      const authPos = (isFirst === "Yes") ? "" : String(form.userAuthorPosition);

      // Map coAuthors array matching CoAuthorSchema
      const coAuthorsList = form.otherAuthors.map(a => ({
        name: a.authorName || "",
        affiliation: a.affiliationType === "Aditya University" ? "Aditya University" : (a.affiliationName || "")
      })).filter(ca => ca.name && ca.affiliation);

      fd.append("textBookName", form.textBookName);
      fd.append("chapterTitle", form.chapterTitle);
      fd.append("isbn", form.isbn);
      fd.append("yearOfPublication", form.yearOfPublication);
      fd.append("firstAuthor", isFirst);
      fd.append("authorPosition", authPos);
      fd.append("chaptersContributed", form.chaptersContributed || "");
      fd.append("publisher", form.publisher === "Others" ? form.customPublisher : form.publisher);
      fd.append("coAuthors", JSON.stringify(coAuthorsList));
      fd.append("month", form.month);
      fd.append("year", form.year);
      fd.append("applyIncentive", form.applyIncentive);
      fd.append("publicationType", form.publicationType);
      fd.append("applyingSeedGrant", form.applyingSeedGrant);
      fd.append("totalAuthors", String(total));
      fd.append("userAuthorPosition", String(form.userAuthorPosition));

      Object.entries(files).forEach(([k, v]) => { if (v) fd.append(k, v); });
      fd.append("academicYear", selectedYear);
      fd.append("college", user?.college || "");
      fd.append("panNumber", user?.panNumber || "");

      await API.post("/api/research/book-chapter", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Book Chapter submitted successfully!");
      setForm({
        textBookName: "", chapterTitle: "", isbn: "", yearOfPublication: "",
        chaptersContributed: "", publisher: "", month: "", year: "",
        applyIncentive: "", publicationType: "National", customPublisher: "", applyingSeedGrant: "",
        totalAuthors: 1, userAuthorPosition: 1, otherAuthors: []
      });
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
          <Typography sx={labelStyle}>ISBN NO :</Typography>
          <TextField size="small" fullWidth value={form.isbn} onChange={set("isbn")} error={!!errors.isbn} />
        </Box>
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
          <Typography sx={labelStyle}>Total Number of Authors : *</Typography>
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
            <Typography sx={labelStyle}>Applicant Author Position : *</Typography>
            <Select size="small" fullWidth value={form.userAuthorPosition} onChange={set("userAuthorPosition")}>
              {Array.from({ length: parseInt(form.totalAuthors) || 1 }, (_, i) => (
                <MenuItem key={i + 1} value={i + 1}>{i + 1}</MenuItem>
              ))}
            </Select>
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

        {parseInt(form.totalAuthors) > 1 && (
          <Box sx={{ gridColumn: { sm: "1 / -1" }, mt: 2, background: "var(--bg-panel)", p: 2, borderRadius: "12px", border: "1px solid var(--border-color)" }}>
            <Typography sx={{ ...labelStyle, mb: 1, fontWeight: 700 }}>Name & affiliation of Co-Author(s) :</Typography>
            {form.otherAuthors.map((ca) => (
              <Box key={ca.authorPosition} sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2, p: 2, borderRadius: "12px", border: "1px dashed var(--border-color)", background: "var(--bg-accent-1)" }}>
                <Box sx={{ display: "flex", gap: 2, flexWrap: { xs: "wrap", sm: "nowrap" }, alignItems: "center" }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: "30px", height: "30px", background: "var(--color-primary)", color: "#fff", borderRadius: "50%", fontWeight: 700, flexShrink: 0 }}>
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
          <Typography sx={labelStyle}>Applying as a Seed Grant Work? *</Typography>
          <Select size="small" fullWidth displayEmpty value={form.applyingSeedGrant} onChange={set("applyingSeedGrant")} error={!!errors.applyingSeedGrant}>
            <MenuItem value="">Select</MenuItem>
            <MenuItem value="Yes">Yes</MenuItem>
            <MenuItem value="No">No</MenuItem>
          </Select>
        </Box>
        <Box>
          <Typography sx={labelStyle}>Whether you want to apply for incentive? *</Typography>
          <Select size="small" fullWidth displayEmpty value={form.applyIncentive} onChange={set("applyIncentive")} error={!!errors.applyIncentive}>
            <MenuItem value="">Select</MenuItem>
            <MenuItem value="Yes">Yes</MenuItem>
            <MenuItem value="No">No</MenuItem>
          </Select>
        </Box>
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
    <Box>
      <PageHeader title="Book Chapter" subtitle="Manage and submit your book chapter publication details" breadcrumbs={["Home", "Publications", "Book Chapter"]} />

      {viewMode === "list" && renderList()}
      {viewMode === "select-year" && renderSelectYear()}
      {viewMode === "form" && renderForm()}

    </Box>
  );
}
