import { useState, useEffect } from "react";
import {
  Box, TextField, MenuItem, Select, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, Chip, Divider, Stack
} from "@mui/material";
import { toast } from "sonner";
import { Description, WorkspacePremium, Close, AddCircle, Edit, Delete, Visibility } from "@mui/icons-material";
import PageHeader from "../../components/common/PageHeader";
import {
  FormCard, Grid2, SubLabel, NoteBox, FileField, SubmitBtn, labelStyle
} from "../../components/faculty/PublicationFormFields";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";

// 13 Categories definitions
const CONTRIBUTION_CATEGORIES = [
  { id: 1, name: "Category 1: Member of BOG / GB / AC / BOS" },
  { id: 2, name: "Category 2: Editorial Board Member (SCIE / Q1 / Q2)" },
  { id: 3, name: "Category 3: Editorial Board Member (ESCI / Q3 / Q4 / Conference Proceedings)" },
  { id: 4, name: "Category 4: Awards (MHRD / AICTE / UGC / State Govt / Top Institutions)" },
  { id: 5, name: "Category 5: Awards (NGO / Trust / Others)" },
  { id: 6, name: "Category 6: Developed E-Content" },
  { id: 7, name: "Category 7: Certification on New Age Technologies" },
  { id: 8, name: "Category 8: Students Trained and Shortlisted for Finals" },
  { id: 9, name: "Category 9: Articles Published in Magazine / Newspaper" },
  { id: 10, name: "Category 10: Research Facility Establishment / Maintenance" },
  { id: 11, name: "Category 11: NPTEL Course Completion" },
  { id: 12, name: "Category 12: Coursera Course Completion" },
  { id: 13, name: "Category 13: FDP / Seminar Grant Sanctioned" }
];

export default function Contribution() {
  const { user } = useAuth();
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [contributionsList, setContributionsList] = useState([]);
  
  const [openFormModal, setOpenFormModal] = useState(false);
  const [selectedContributionDetails, setSelectedContributionDetails] = useState(null);
  
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    category: "",
    organizationName: "",
    fromDate: "",
    toDate: "",
    journalName: "",
    journalConferenceName: "",
    duration: "",
    awardName: "",
    awardDate: "",
    courseName: "",
    url: "",
    certificationName: "",
    eventName: "",
    eventDate: "",
    articleTitle: "",
    publicationName: "",
    publicationDate: "",
    facilityName: "",
    facilityDate: "",
    grantName: "",
    sanctionDate: ""
  });
  
  const [proofFile, setProofFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch academic years on load
  useEffect(() => {
    API.get("/api/academic-years")
      .then(res => {
        setAcademicYears(res.data?.years || res.data?.data || []);
      })
      .catch(err => console.log("Failed to fetch academic years", err));
  }, []);

  // Fetch contributions when year changes
  useEffect(() => {
    if (selectedYear) {
      fetchContributions();
    } else {
      setContributionsList([]);
    }
  }, [selectedYear]);

  const fetchContributions = () => {
    API.get(`/api/value-addition/contribution?academicYear=${selectedYear}`)
      .then(res => {
        setContributionsList(res.data?.data || []);
      })
      .catch(err => console.log("Failed to fetch contributions", err));
  };

  const setVal = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const handleFileChange = (e) => {
    setProofFile(e.target.files[0]);
  };

  const handleCategoryChange = (e) => {
    const cat = e.target.value;
    setForm({
      category: cat,
      organizationName: "",
      fromDate: "",
      toDate: "",
      journalName: "",
      journalConferenceName: "",
      duration: "",
      awardName: "",
      awardDate: "",
      courseName: "",
      url: "",
      certificationName: "",
      eventName: "",
      eventDate: "",
      articleTitle: "",
      publicationName: "",
      publicationDate: "",
      facilityName: "",
      facilityDate: "",
      grantName: "",
      sanctionDate: ""
    });
    setProofFile(null);
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setForm({
      category: "",
      organizationName: "",
      fromDate: "",
      toDate: "",
      journalName: "",
      journalConferenceName: "",
      duration: "",
      awardName: "",
      awardDate: "",
      courseName: "",
      url: "",
      certificationName: "",
      eventName: "",
      eventDate: "",
      articleTitle: "",
      publicationName: "",
      publicationDate: "",
      facilityName: "",
      facilityDate: "",
      grantName: "",
      sanctionDate: ""
    });
    setProofFile(null);
    setOpenFormModal(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingId(item._id);
    const cat = item.category;
    setForm({
      category: cat,
      organizationName: item.organizationName || "",
      fromDate: item.fromDate ? item.fromDate.substring(0, 10) : "",
      toDate: item.toDate ? item.toDate.substring(0, 10) : "",
      journalName: item.journalName || "",
      journalConferenceName: item.journalConferenceName || "",
      duration: item.duration || "",
      awardName: item.awardName || "",
      awardDate: item.awardDate ? item.awardDate.substring(0, 10) : "",
      courseName: item.courseName || "",
      url: item.url || "",
      certificationName: item.certificationName || "",
      eventName: item.eventName || "",
      eventDate: item.eventDate ? item.eventDate.substring(0, 10) : "",
      articleTitle: item.articleTitle || "",
      publicationName: item.publicationName || "",
      publicationDate: item.publicationDate ? item.publicationDate.substring(0, 10) : "",
      facilityName: item.facilityName || "",
      facilityDate: item.facilityDate ? item.facilityDate.substring(0, 10) : "",
      grantName: item.grantName || "",
      sanctionDate: item.sanctionDate ? item.sanctionDate.substring(0, 10) : ""
    });
    setProofFile(null);
    setOpenFormModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this draft entry?")) return;
    try {
      await API.delete(`/api/value-addition/contribution/${id}`);
      toast.success("Entry deleted successfully!");
      fetchContributions();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete entry.");
    }
  };

  const handleSaveDraft = async () => {
    if (!form.category) {
      toast.error("Please select a contribution category");
      return;
    }

    if (!proofFile && !editingId) {
      toast.error("Supporting proof upload is mandatory");
      return;
    }

    const cat = parseInt(form.category);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const validateDate = (dateStr, fieldLabel) => {
      if (!dateStr) return `${fieldLabel} is required.`;
      const dateVal = new Date(dateStr);
      if (dateVal > today) return `${fieldLabel} cannot be in the future.`;
      return null;
    };

    let fieldErr = null;
    switch (cat) {
      case 1:
        if (!form.organizationName || !form.fromDate || !form.toDate) {
          fieldErr = "Organization Name, From Date, and To Date are mandatory.";
        } else {
          const from = new Date(form.fromDate);
          const to = new Date(form.toDate);
          if (from > today || to > today) fieldErr = "Dates cannot be in the future.";
          else if (from > to) fieldErr = "From Date cannot be later than To Date.";
        }
        break;
      case 2:
        if (!form.journalName || !form.duration) {
          fieldErr = "Journal Name and Duration are mandatory.";
        }
        break;
      case 3:
        if (!form.journalConferenceName || !form.duration) {
          fieldErr = "Journal / Conference Name and Duration are mandatory.";
        }
        break;
      case 4:
      case 5:
        if (!form.awardName) fieldErr = "Award Name is mandatory.";
        else fieldErr = validateDate(form.awardDate, "Award Date");
        break;
      case 6:
        if (!form.courseName || !form.url) {
          fieldErr = "Course Name and URL are mandatory.";
        }
        break;
      case 7:
        if (!form.certificationName || !form.duration) {
          fieldErr = "Certification Name and Duration are mandatory.";
        }
        break;
      case 8:
        if (!form.eventName) fieldErr = "Event Name is mandatory.";
        else fieldErr = validateDate(form.eventDate, "Event Date");
        break;
      case 9:
        if (!form.articleTitle || !form.publicationName) {
          fieldErr = "Article Title and Publication Name are mandatory.";
        } else fieldErr = validateDate(form.publicationDate, "Publication Date");
        break;
      case 10:
        if (!form.facilityName) fieldErr = "Facility Name is mandatory.";
        else fieldErr = validateDate(form.facilityDate, "Establishment Date");
        break;
      case 11:
      case 12:
        if (!form.courseName || !form.duration) {
          fieldErr = "Course Name and Duration are mandatory.";
        }
        break;
      case 13:
        if (!form.grantName) fieldErr = "Grant Name is mandatory.";
        else fieldErr = validateDate(form.sanctionDate, "Sanction Date");
        break;
      default:
        fieldErr = "Invalid Category.";
    }

    if (fieldErr) {
      toast.error(fieldErr);
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("academicYear", selectedYear);
      fd.append("category", String(cat));

      if (cat === 1) {
        fd.append("organizationName", form.organizationName);
        fd.append("fromDate", form.fromDate);
        fd.append("toDate", form.toDate);
      } else if (cat === 2) {
        fd.append("journalName", form.journalName);
        fd.append("duration", form.duration);
      } else if (cat === 3) {
        fd.append("journalConferenceName", form.journalConferenceName);
        fd.append("duration", form.duration);
      } else if (cat === 4 || cat === 5) {
        fd.append("awardName", form.awardName);
        fd.append("awardDate", form.awardDate);
      } else if (cat === 6) {
        fd.append("courseName", form.courseName);
        fd.append("url", form.url);
      } else if (cat === 7) {
        fd.append("certificationName", form.certificationName);
        fd.append("duration", form.duration);
      } else if (cat === 8) {
        fd.append("eventName", form.eventName);
        fd.append("eventDate", form.eventDate);
      } else if (cat === 9) {
        fd.append("articleTitle", form.articleTitle);
        fd.append("publicationName", form.publicationName);
        fd.append("publicationDate", form.publicationDate);
      } else if (cat === 10) {
        fd.append("facilityName", form.facilityName);
        fd.append("facilityDate", form.facilityDate);
      } else if (cat === 11 || cat === 12) {
        fd.append("courseName", form.courseName);
        fd.append("duration", form.duration);
      } else if (cat === 13) {
        fd.append("grantName", form.grantName);
        fd.append("sanctionDate", form.sanctionDate);
      }

      if (proofFile) {
        fd.append("proof", proofFile);
      }

      if (editingId) {
        await API.put(`/api/value-addition/contribution/${editingId}`, fd, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success("Draft updated successfully!");
      } else {
        await API.post("/api/value-addition/contribution", fd, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success("Draft saved successfully!");
      }

      setOpenFormModal(false);
      fetchContributions();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save draft");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSubmit = async () => {
    const activeDrafts = contributionsList.filter(a => a.status === 'Draft');
    if (activeDrafts.length === 0) {
      toast.error("No draft entries found for this academic year.");
      return;
    }

    const yearText = academicYears.find(y => y._id === selectedYear)?.year || "";
    if (!window.confirm(`Are you sure you want to submit all ${activeDrafts.length} draft contribution entries for academic year ${yearText}? Once submitted, they will become read-only.`)) {
      return;
    }

    setLoading(true);
    try {
      await API.post("/api/value-addition/contribution/submit-academic-year", {
        academicYear: selectedYear
      });
      toast.success("All drafts submitted successfully for approval!");
      fetchContributions();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  const renderFacultyInfoCard = () => (
    <Box sx={{
      background: "var(--bg-glass)",
      border: "1px solid var(--border-color)",
      borderRadius: "20px",
      p: 2.5,
      mb: 4,
      display: "grid",
      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr 1fr" },
      gap: 3,
      boxShadow: "var(--shadow-premium)"
    }}>
      <Box>
        <Typography sx={{ fontSize: 10, color: "var(--color-primary)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>Faculty Name</Typography>
        <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{user?.name || "N/A"}</Typography>
      </Box>
      <Box>
        <Typography sx={{ fontSize: 10, color: "var(--color-primary)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>Employee ID</Typography>
        <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{user?.institutionId || "N/A"}</Typography>
      </Box>
      <Box>
        <Typography sx={{ fontSize: 10, color: "var(--color-primary)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>Department</Typography>
        <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{user?.coreDepartment || user?.department || "N/A"}</Typography>
      </Box>
      <Box>
        <Typography sx={{ fontSize: 10, color: "var(--color-primary)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>Designation</Typography>
        <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{user?.designation || "N/A"}</Typography>
      </Box>
    </Box>
  );

  const getStatusColor = (status) => {
    if (status === 'Approved') return { bg: "rgba(16, 185, 129, 0.1)", color: "#10b981" };
    if (status === 'Rejected') return { bg: "rgba(239, 68, 68, 0.1)", color: "#ef4444" };
    if (status === 'Pending at HOD') return { bg: "rgba(232, 160, 0, 0.1)", color: "#e8a000" };
    return { bg: "rgba(100, 116, 139, 0.1)", color: "#64748b" }; // Draft
  };

  const getCategoryName = (catId) => {
    const found = CONTRIBUTION_CATEGORIES.find(c => c.id === catId);
    return found ? found.name : `Category ${catId}`;
  };

  const renderSelectYear = () => (
    <Box sx={{ maxWidth: 500, mx: "auto", mt: 5 }}>
      <FormCard title="Select Academic Year">
        <Typography sx={{ mb: 2, color: "var(--text-secondary)", fontWeight: 500 }}>Please select the academic year to manage contributions:</Typography>
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
      </FormCard>
    </Box>
  );

  const renderCategorySpecificFields = () => {
    const cat = parseInt(form.category);
    if (isNaN(cat)) return null;

    switch (cat) {
      case 1:
        return (
          <>
            <Box>
              <Typography sx={labelStyle}>Organization Name: *</Typography>
              <TextField size="small" fullWidth value={form.organizationName} onChange={setVal("organizationName")} />
            </Box>
            <Box>
              <Typography sx={labelStyle}>From Date: *</Typography>
              <TextField size="small" fullWidth type="date" value={form.fromDate} onChange={setVal("fromDate")} InputLabelProps={{ shrink: true }} />
            </Box>
            <Box>
              <Typography sx={labelStyle}>To Date: *</Typography>
              <TextField size="small" fullWidth type="date" value={form.toDate} onChange={setVal("toDate")} InputLabelProps={{ shrink: true }} />
            </Box>
          </>
        );
      case 2:
        return (
          <>
            <Box>
              <Typography sx={labelStyle}>Journal Name: *</Typography>
              <TextField size="small" fullWidth value={form.journalName} onChange={setVal("journalName")} />
            </Box>
            <Box>
              <Typography sx={labelStyle}>Duration (e.g. 1 Year / 6 Months): *</Typography>
              <TextField size="small" fullWidth value={form.duration} onChange={setVal("duration")} />
            </Box>
          </>
        );
      case 3:
        return (
          <>
            <Box>
              <Typography sx={labelStyle}>Journal / Conference Name: *</Typography>
              <TextField size="small" fullWidth value={form.journalConferenceName} onChange={setVal("journalConferenceName")} />
            </Box>
            <Box>
              <Typography sx={labelStyle}>Duration (e.g. 1 Year / 6 Months): *</Typography>
              <TextField size="small" fullWidth value={form.duration} onChange={setVal("duration")} />
            </Box>
          </>
        );
      case 4:
      case 5:
        return (
          <>
            <Box>
              <Typography sx={labelStyle}>Award Name: *</Typography>
              <TextField size="small" fullWidth value={form.awardName} onChange={setVal("awardName")} />
            </Box>
            <Box>
              <Typography sx={labelStyle}>Award Date: *</Typography>
              <TextField size="small" fullWidth type="date" value={form.awardDate} onChange={setVal("awardDate")} InputLabelProps={{ shrink: true }} />
            </Box>
          </>
        );
      case 6:
        return (
          <>
            <Box>
              <Typography sx={labelStyle}>Course Name: *</Typography>
              <TextField size="small" fullWidth value={form.courseName} onChange={setVal("courseName")} />
            </Box>
            <Box>
              <Typography sx={labelStyle}>E-Content URL: *</Typography>
              <TextField size="small" fullWidth value={form.url} onChange={setVal("url")} placeholder="https://example.com/course" />
            </Box>
          </>
        );
      case 7:
        return (
          <>
            <Box>
              <Typography sx={labelStyle}>Certification Name: *</Typography>
              <TextField size="small" fullWidth value={form.certificationName} onChange={setVal("certificationName")} />
            </Box>
            <Box>
              <Typography sx={labelStyle}>Duration (e.g. 4 Weeks / 2 Months): *</Typography>
              <TextField size="small" fullWidth value={form.duration} onChange={setVal("duration")} />
            </Box>
          </>
        );
      case 8:
        return (
          <>
            <Box>
              <Typography sx={labelStyle}>Event Name: *</Typography>
              <TextField size="small" fullWidth value={form.eventName} onChange={setVal("eventName")} />
            </Box>
            <Box>
              <Typography sx={labelStyle}>Event Date: *</Typography>
              <TextField size="small" fullWidth type="date" value={form.eventDate} onChange={setVal("eventDate")} InputLabelProps={{ shrink: true }} />
            </Box>
          </>
        );
      case 9:
        return (
          <>
            <Box>
              <Typography sx={labelStyle}>Article Title: *</Typography>
              <TextField size="small" fullWidth value={form.articleTitle} onChange={setVal("articleTitle")} />
            </Box>
            <Box>
              <Typography sx={labelStyle}>Publication Name: *</Typography>
              <TextField size="small" fullWidth value={form.publicationName} onChange={setVal("publicationName")} />
            </Box>
            <Box>
              <Typography sx={labelStyle}>Publication Date: *</Typography>
              <TextField size="small" fullWidth type="date" value={form.publicationDate} onChange={setVal("publicationDate")} InputLabelProps={{ shrink: true }} />
            </Box>
          </>
        );
      case 10:
        return (
          <>
            <Box>
              <Typography sx={labelStyle}>Facility Name: *</Typography>
              <TextField size="small" fullWidth value={form.facilityName} onChange={setVal("facilityName")} />
            </Box>
            <Box>
              <Typography sx={labelStyle}>Date: *</Typography>
              <TextField size="small" fullWidth type="date" value={form.facilityDate} onChange={setVal("facilityDate")} InputLabelProps={{ shrink: true }} />
            </Box>
          </>
        );
      case 11:
      case 12:
        return (
          <>
            <Box>
              <Typography sx={labelStyle}>Course Name: *</Typography>
              <TextField size="small" fullWidth value={form.courseName} onChange={setVal("courseName")} />
            </Box>
            <Box>
              <Typography sx={labelStyle}>Duration (e.g. 8 Weeks / 12 Weeks): *</Typography>
              <TextField size="small" fullWidth value={form.duration} onChange={setVal("duration")} />
            </Box>
          </>
        );
      case 13:
        return (
          <>
            <Box>
              <Typography sx={labelStyle}>Grant Name: *</Typography>
              <TextField size="small" fullWidth value={form.grantName} onChange={setVal("grantName")} />
            </Box>
            <Box>
              <Typography sx={labelStyle}>Sanction Date: *</Typography>
              <TextField size="small" fullWidth type="date" value={form.sanctionDate} onChange={setVal("sanctionDate")} InputLabelProps={{ shrink: true }} />
            </Box>
          </>
        );
      default:
        return null;
    }
  };

  const renderDashboard = () => {
    const activeDrafts = contributionsList.filter(c => c.status === 'Draft');

    return (
      <Box>
        {renderFacultyInfoCard()}

        <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 2, alignItems: "center", mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="h6" sx={{ color: "var(--text-primary)", fontWeight: 800 }}>
              Expertise / Contribution Records ({academicYears.find(y => y._id === selectedYear)?.year || "N/A"})
            </Typography>
            <Button size="small" variant="text" onClick={() => setSelectedYear("")} sx={{ fontWeight: 700, textTransform: "none", color: "var(--color-primary)" }}>
              Change Year
            </Button>
          </Box>
          
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleOpenAddModal}
              startIcon={<AddCircle />}
              sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 700 }}
            >
              Add Contribution
            </Button>
            <Button
              variant="contained"
              color="success"
              disabled={activeDrafts.length === 0 || loading}
              onClick={handleBulkSubmit}
              sx={{
                background: activeDrafts.length > 0 ? "var(--gradient-primary)" : "rgba(0,0,0,0.1)",
                borderRadius: "12px",
                px: 3,
                fontWeight: 800,
                textTransform: "none",
                "&:hover": { opacity: 0.9 }
              }}
            >
              Submit Academic Year Data ({activeDrafts.length} Drafts)
            </Button>
          </Stack>
        </Box>

        {contributionsList.length === 0 ? (
          <Box sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            py: 8,
            px: 3,
            background: "var(--bg-panel)",
            borderRadius: "16px",
            border: "1px dashed var(--border-color)",
            boxShadow: "var(--shadow-premium)",
            textAlign: "center"
          }}>
            <Typography variant="h6" sx={{ color: "var(--text-secondary)", fontWeight: 600, mb: 1 }}>
              No Records Saved
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 3, maxWidth: "450px" }}>
              There are no entries for the selected academic year. Click the "Add Contribution" button to create your first Draft entry.
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-premium)", overflowX: "auto" }}>
            <Table>
              <TableHead sx={{ background: "var(--gradient-primary)" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Date Submitted</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contributionsList.map((item, i) => {
                  const isDraft = item.status === 'Draft';
                  const submitDate = new Date(item.createdAt).toLocaleDateString("en-IN", { day: '2-digit', month: '2-digit', year: 'numeric' });
                  const statusStyle = getStatusColor(item.status);

                  return (
                    <TableRow key={item._id || i}>
                      <TableCell sx={{ color: "var(--text-primary)", fontWeight: 500, py: 2, maxWidth: 350, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {getCategoryName(item.category)}
                      </TableCell>
                      <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>{submitDate}</TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            color: statusStyle.color,
                            fontWeight: 700,
                            background: statusStyle.bg,
                            px: 1.5,
                            py: 0.5,
                            borderRadius: "6px",
                            display: "inline-block"
                          }}
                        >
                          {item.status}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Stack direction="row" spacing={1}>
                          <IconButton
                            size="small"
                            onClick={() => setSelectedContributionDetails(item)}
                            sx={{ color: "var(--color-primary)" }}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                          {isDraft && (
                            <>
                              <IconButton
                                size="small"
                                color="info"
                                onClick={() => handleOpenEditModal(item)}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDelete(item._id)}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    );
  };

  const renderDetailsDialog = () => {
    if (!selectedContributionDetails) return null;
    const data = selectedContributionDetails;
    const cat = parseInt(data.category);
    const statusStyle = getStatusColor(data.status);

    const backendURL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "");
    const fileUrl = data.proof ? (data.proof.startsWith('http') ? data.proof : `${backendURL}${data.proof}`) : null;
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(data.proof || "");

    const formatDate = (dateStr) => {
      if (!dateStr) return "-";
      return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
    };

    const renderDynamicDetailGrid = () => {
      switch (cat) {
        case 1:
          return (
            <>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem", display: "block" }}>Organization Name</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.organizationName || "-"}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem", display: "block" }}>Duration</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>
                  {formatDate(data.fromDate)} to {formatDate(data.toDate)}
                </Typography>
              </Grid>
            </>
          );
        case 2:
        case 3:
          return (
            <>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem", display: "block" }}>Journal / Conference Name</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.journalName || data.journalConferenceName || "-"}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem", display: "block" }}>Duration</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.duration || "-"}</Typography>
              </Grid>
            </>
          );
        case 4:
        case 5:
          return (
            <>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem", display: "block" }}>Award Name</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.awardName || "-"}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem", display: "block" }}>Award Date</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{formatDate(data.awardDate)}</Typography>
              </Grid>
            </>
          );
        case 6:
          return (
            <>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem", display: "block" }}>Course Name</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.courseName || "-"}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem", display: "block" }}>URL</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>
                  <a href={data.url} target="_blank" rel="noreferrer" style={{ color: "var(--color-primary)" }}>{data.url}</a>
                </Typography>
              </Grid>
            </>
          );
        case 7:
          return (
            <>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem", display: "block" }}>Certification Name</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.certificationName || "-"}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem", display: "block" }}>Duration</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.duration || "-"}</Typography>
              </Grid>
            </>
          );
        case 8:
          return (
            <>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem", display: "block" }}>Event Name</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.eventName || "-"}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem", display: "block" }}>Event Date</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{formatDate(data.eventDate)}</Typography>
              </Grid>
            </>
          );
        case 9:
          return (
            <>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem", display: "block" }}>Article Title</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.articleTitle || "-"}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem", display: "block" }}>Publication Name</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.publicationName || "-"}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem", display: "block" }}>Publication Date</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{formatDate(data.publicationDate)}</Typography>
              </Grid>
            </>
          );
        case 10:
          return (
            <>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem", display: "block" }}>Facility Name</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.facilityName || "-"}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem", display: "block" }}>Date</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{formatDate(data.facilityDate)}</Typography>
              </Grid>
            </>
          );
        case 11:
        case 12:
          return (
            <>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem", display: "block" }}>Course Name</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.courseName || "-"}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem", display: "block" }}>Duration</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.duration || "-"}</Typography>
              </Grid>
            </>
          );
        case 13:
          return (
            <>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem", display: "block" }}>Grant Name</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.grantName || "-"}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem", display: "block" }}>Sanction Date</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{formatDate(data.sanctionDate)}</Typography>
              </Grid>
            </>
          );
        default:
          return null;
      }
    };

    return (
      <Dialog
        open={!!selectedContributionDetails}
        onClose={() => setSelectedContributionDetails(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "20px",
            background: "var(--bg-glass)",
            backdropFilter: "blur(12px)",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-premium)",
          }
        }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--gradient-primary)", color: "#fff", py: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <WorkspacePremium sx={{ color: "#fff" }} />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Contribution Details</Typography>
          </Box>
          <IconButton onClick={() => setSelectedContributionDetails(null)} sx={{ color: "#fff" }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)", mb: 3 }}>
            {getCategoryName(data.category)}
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ p: 1.5, borderRadius: "10px", background: "rgba(255,255,255,0.02)" }}>
                <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem" }}>Academic Year</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.academicYear?.year || "N/A"}</Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box sx={{ p: 1.5, borderRadius: "10px", background: "rgba(255,255,255,0.02)" }}>
                <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem" }}>Status</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={data.status}
                    size="small"
                    sx={{
                      bgcolor: statusStyle.bg,
                      color: statusStyle.color,
                      fontWeight: 800,
                      borderRadius: "6px"
                    }}
                  />
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ p: 2, background: "rgba(0,0,0,0.01)", border: "1px dashed var(--border-color)", borderRadius: "12px", mt: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, color: "var(--color-primary)" }}>Category Parameters:</Typography>
                <Grid container spacing={3}>
                  {renderDynamicDetailGrid()}
                </Grid>
              </Box>
            </Grid>

            {data.hodComment && (
              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: "rgba(255, 193, 7, 0.05)", borderRadius: "10px", border: "1px solid rgba(255, 193, 7, 0.2)" }}>
                  <Typography variant="caption" sx={{ fontWeight: 900, color: "#ff9800", textTransform: "uppercase" }}>HOD Remarks</Typography>
                  <Typography variant="body2" sx={{ fontStyle: "italic", mt: 0.5, color: "var(--text-secondary)" }}>"{data.hodComment}"</Typography>
                </Box>
              </Grid>
            )}
          </Grid>

          <Divider sx={{ my: 3 }} />

          {fileUrl && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: "var(--color-primary)", fontSize: "0.7rem", textTransform: "uppercase", display: "block", mb: 1 }}>Supporting Certificate</Typography>
              <Box sx={{
                height: 250, display: "flex", alignItems: "center", justifyContent: "center",
                border: "1px solid var(--border-color)", background: "var(--bg-panel)", borderRadius: "8px",
                overflow: "hidden", cursor: "pointer", transition: "all 0.2s ease",
                "&:hover": { borderColor: "var(--color-primary)", transform: "translateY(-2px)" }
              }} onClick={() => window.open(fileUrl, '_blank')}>
                {isImage ? (
                  <img src={fileUrl} alt="Proof" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : (
                  <Box sx={{ textAlign: "center" }}>
                    <Description sx={{ fontSize: 40, color: "var(--text-secondary)", mb: 0.5 }} />
                    <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 700, display: "block" }}>PDF Preview (Click to open)</Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: "1px solid var(--border-color)" }}>
          <Button onClick={() => setSelectedContributionDetails(null)} sx={{ color: "var(--text-primary)", fontWeight: 700 }}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  const renderFormModal = () => (
    <Dialog
      open={openFormModal}
      onClose={() => setOpenFormModal(false)}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: "20px" } }}
    >
      <DialogTitle sx={{ borderBottom: "1px solid var(--border-color)", pb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
          {editingId ? "Edit Contribution Entry" : "Add Contribution Entry"}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ p: 3, pt: 4 }}>
        <SubLabel text="Details of the Contribution:" />
        
        <Box sx={{ mb: 4, maxWidth: 500 }}>
          <Typography sx={labelStyle}>Contribution Category: *</Typography>
          <Select
            size="small"
            fullWidth
            displayEmpty
            value={form.category}
            onChange={handleCategoryChange}
            disabled={!!editingId}
          >
            <MenuItem value="" disabled>--Select Category (1 to 13)--</MenuItem>
            {CONTRIBUTION_CATEGORIES.map(cat => (
              <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
            ))}
          </Select>
        </Box>

        {form.category && (
          <Grid2 sx={{ mt: 2 }}>
            {renderCategorySpecificFields()}
          </Grid2>
        )}

        {form.category && (
          <>
            <NoteBox />
            <Box sx={{ mt: 2 }}>
              <FileField
                label={editingId ? "Upload New Proof (Optional):" : "Relevant Proof/Certificate Upload: *"}
                name="proof"
                onChange={handleFileChange}
              />
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2.5, borderTop: "1px solid var(--border-color)" }}>
        <Button
          variant="outlined"
          onClick={() => setOpenFormModal(false)}
          sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700 }}
        >
          Cancel
        </Button>
        <SubmitBtn onClick={handleSaveDraft} loading={loading} />
      </DialogActions>
    </Dialog>
  );

  return (
    <Box sx={{ width: "100%", pb: 5 }}>
      <PageHeader
        title="Faculty Expertise / Recognition / Contribution"
        subtitle="Manage and submit dynamic drafts of e-content, course completions, magazine articles, and awards."
      />
      <Box sx={{ mt: 4 }}>
        {!selectedYear ? renderSelectYear() : renderDashboard()}
        {renderDetailsDialog()}
        {renderFormModal()}
      </Box>
    </Box>
  );
}
