import { useState, useEffect } from "react";
import {
  Box, TextField, MenuItem, Select, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, Chip, Divider, Stack, useTheme, useMediaQuery
} from "@mui/material";
import { toast } from "sonner";
import { Description, WorkspacePremium, Close, AddCircle, Edit, Delete, Visibility } from "@mui/icons-material";
import PageHeader from "../../components/common/PageHeader";
import NoActiveYearDialog from "../../components/common/NoActiveYearDialog";
import {
  FormCard, Grid2, SubLabel, NoteBox, FileField, SubmitBtn
} from "../../components/faculty/PublicationFormFields";
import { labelStyle } from "../../components/faculty/publicationConstants";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";

// 13 Categories definitions
const CONTRIBUTION_CATEGORIES = [
  { id: 1, name: "Member of BOG / GB / AC / BOS" },
  { id: 2, name: "Editorial Board Member (SCIE / Q1 / Q2)" },
  { id: 3, name: "Editorial Board Member (ESCI / Q3 / Q4 / Conference Proceedings)" },
  { id: 4, name: "Awards (MHRD / AICTE / UGC / State Govt / Top Institutions)" },
  { id: 5, name: "Awards (NGO / Trust / Others)" },
  { id: 6, name: "Developed E-Content" },
  { id: 7, name: "Certification on New Age Technologies" },
  { id: 8, name: "Students Trained and Shortlisted for Finals" },
  { id: 9, name: "Articles Published in Magazine / Newspaper" },
  { id: 10, name: "Research Facility Establishment / Maintenance" },
  { id: 11, name: "NPTEL Course Completion" },
  { id: 12, name: "Coursera Course Completion" },
  { id: 13, name: "FDP / Seminar Grant Sanctioned" }
];

export default function Contribution() {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [contributionsList, setContributionsList] = useState([]);

  const [openFormModal, setOpenFormModal] = useState(false);
  const [noActiveYearAlertOpen, setNoActiveYearAlertOpen] = useState(false);
  const [selectedContributionDetails, setSelectedContributionDetails] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    academicYear: "",
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
    sanctionDate: "",
    courseHours: "",
    certificateNumber: ""
  });

  const [proofFile, setProofFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const blurActiveElement = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const selectMenuProps = {
    disableAutoFocusItem: true,
    slotProps: {
      list: {
        onMouseDown: blurActiveElement
      }
    }
  };

  // Fetch academic years on load
  useEffect(() => {
    API.get("/api/academic-years")
      .then(res => {
        const years = res.data?.years || res.data?.data || [];
        setAcademicYears(years);
        const active = years.find(y => y.isGlobalActive);
        if (active) {
          setSelectedYear(active._id);
          setForm(p => ({ ...p, academicYear: active._id }));
        }
      })
      .catch(err => console.log("Failed to fetch academic years", err));
  }, []);

  // Fetch contributions when year changes
  useEffect(() => {
    fetchContributions();
  }, [selectedYear]);

  // Recalculate duration automatically when fromDate/toDate change
  useEffect(() => {
    if (form.fromDate && form.toDate) {
      const start = new Date(form.fromDate);
      const end = new Date(form.toDate);
      if (start <= end) {
        const diffTime = Math.abs(end - start);
        const days = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
        setForm(prev => ({ ...prev, duration: `${days} Days` }));
      }
    }
  }, [form.fromDate, form.toDate]);

  const fetchContributions = () => {
    const url = selectedYear
      ? `/api/value-addition/contribution?academicYear=${selectedYear}`
      : `/api/value-addition/contribution`;
    API.get(url)
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
    setForm(prev => ({
      category: cat,
      academicYear: prev.academicYear || "",
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
      sanctionDate: "",
      courseHours: "",
      certificateNumber: ""
    }));
    setProofFile(null);
  };

  const handleOpenAddModal = () => {
    const activeYear = academicYears.find(y => y.isGlobalActive);
    if (!activeYear) {
      setNoActiveYearAlertOpen(true);
      return;
    }
    setEditingId(null);
    setForm({
      academicYear: activeYear._id,
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
      sanctionDate: "",
      courseHours: "",
      certificateNumber: ""
    });
    setProofFile(null);
    setOpenFormModal(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingId(item._id);
    const cat = item.category;
    setForm({
      academicYear: item.academicYear?._id || item.academicYear || "",
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
      sanctionDate: item.sanctionDate ? item.sanctionDate.substring(0, 10) : "",
      courseHours: item.courseHours !== undefined ? String(item.courseHours) : "",
      certificateNumber: item.certificateNumber || ""
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
    if (!form.academicYear) {
      toast.error("Academic Year is required");
      return;
    }
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

    const validateDate = (dateStr, fieldLabel, allowFuture = false) => {
      if (!dateStr) return `${fieldLabel} is required.`;
      const dateVal = new Date(dateStr);
      if (!allowFuture && dateVal > today) return `${fieldLabel} cannot be in the future.`;
      return null;
    };

    let fieldErr = null;

    // Unified check for categories that use From Date, To Date and Auto Duration: 1, 2, 3, 7, 10, 12, 13
    if ([1, 2, 3, 7, 10, 12, 13].includes(cat)) {
      if (!form.fromDate || !form.toDate) {
        fieldErr = "From Date and To Date are required.";
      } else {
        const from = new Date(form.fromDate);
        const to = new Date(form.toDate);
        if (from > today) {
          fieldErr = "From Date cannot be in the future.";
        } else if (from >= to) {
          fieldErr = "To Date must be greater than From Date.";
        } else {
          // Category 7, 10, 12, 13 do NOT allow future toDate
          if ([7, 10, 12, 13].includes(cat) && to > today) {
            fieldErr = "To Date cannot be in the future.";
          }
        }
      }
    }

    // Category-specific text field validations
    if (!fieldErr) {
      switch (cat) {
        case 1:
          if (!form.organizationName) fieldErr = "Organization Name is required.";
          break;
        case 2:
          if (!form.journalName) fieldErr = "Journal Name is required.";
          break;
        case 3:
          if (!form.journalConferenceName) fieldErr = "Journal / Conference Name is required.";
          break;
        case 4:
        case 5:
          if (!form.awardName) fieldErr = "Award Name is required.";
          else fieldErr = validateDate(form.awardDate, "Award Date");
          break;
        case 6:
          if (!form.courseName || !form.url) {
            fieldErr = "Course Name and URL are mandatory.";
          }
          break;
        case 7:
          if (!form.certificationName) fieldErr = "Certification Name is required.";
          break;
        case 8:
          if (!form.eventName) fieldErr = "Event Name is required.";
          else fieldErr = validateDate(form.eventDate, "Event Date");
          break;
        case 9:
          if (!form.articleTitle || !form.publicationName) {
            fieldErr = "Article Title and Publication Name are mandatory.";
          } else fieldErr = validateDate(form.publicationDate, "Publication Date");
          break;
        case 10:
          if (!form.facilityName) fieldErr = "Facility Name is required.";
          break;
        case 11:
          if (!form.courseName || !form.duration) {
            fieldErr = "Course Name and Duration are required.";
          } else if (!form.certificateNumber) {
            fieldErr = "Certificate Number is required for NPTEL course.";
          }
          break;
        case 12:
          if (!form.courseName) {
            fieldErr = "Course Name is required.";
          } else if (!form.courseHours) {
            fieldErr = "Course Hours is required for Coursera course.";
          } else {
            const hrs = parseFloat(form.courseHours);
            if (isNaN(hrs) || hrs <= 0) {
              fieldErr = "Course Hours must be a positive number.";
            } else if (hrs < 40) {
              fieldErr = "Coursera course must be at least 40 hours to qualify for eligibility.";
            }
          }
          if (!fieldErr && !form.certificateNumber) {
            fieldErr = "Certificate Number is required for Coursera course.";
          }
          break;
        case 13:
          if (!form.grantName) fieldErr = "Grant Name is required.";
          break;
        default:
          fieldErr = "Invalid Category.";
      }
    }

    if (fieldErr) {
      toast.error(fieldErr);
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("academicYear", form.academicYear);
      fd.append("category", String(cat));

      // Append From Date, To Date, Duration for categories that use them
      if ([1, 2, 3, 7, 10, 12, 13].includes(cat)) {
        fd.append("fromDate", form.fromDate);
        fd.append("toDate", form.toDate);
        fd.append("duration", form.duration);
      }

      if (cat === 1) {
        fd.append("organizationName", form.organizationName);
      } else if (cat === 2) {
        fd.append("journalName", form.journalName);
      } else if (cat === 3) {
        fd.append("journalConferenceName", form.journalConferenceName);
      } else if (cat === 4 || cat === 5) {
        fd.append("awardName", form.awardName);
        fd.append("awardDate", form.awardDate);
      } else if (cat === 6) {
        fd.append("courseName", form.courseName);
        fd.append("url", form.url);
      } else if (cat === 7) {
        fd.append("certificationName", form.certificationName);
      } else if (cat === 8) {
        fd.append("eventName", form.eventName);
        fd.append("eventDate", form.eventDate);
      } else if (cat === 9) {
        fd.append("articleTitle", form.articleTitle);
        fd.append("publicationName", form.publicationName);
        fd.append("publicationDate", form.publicationDate);
      } else if (cat === 10) {
        fd.append("facilityName", form.facilityName);
      } else if (cat === 11) {
        fd.append("courseName", form.courseName);
        fd.append("duration", form.duration);
        fd.append("certificateNumber", form.certificateNumber);
      } else if (cat === 12) {
        fd.append("courseName", form.courseName);
        fd.append("courseHours", form.courseHours);
        fd.append("certificateNumber", form.certificateNumber);
      } else if (cat === 13) {
        fd.append("grantName", form.grantName);
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
      toast.error("No draft entries found");
      return;
    }

    const confirmMessage = `Are you sure you want to submit all ${activeDrafts.length} draft entries? Once submitted, they will become read-only.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    try {
      await API.post("/api/value-addition/contribution/submit-academic-year", {
        academicYear: selectedYear || undefined
      });
      toast.success("Drafts submitted successfully for approval!");
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

  const getContributionNameField = (category, data) => {
    const cat = parseInt(category);
    switch (cat) {
      case 1: return { field: 'organizationName', value: data.organizationName };
      case 2: return { field: 'journalName', value: data.journalName };
      case 3: return { field: 'journalConferenceName', value: data.journalConferenceName };
      case 4:
      case 5: return { field: 'awardName', value: data.awardName };
      case 6: return { field: 'courseName', value: data.courseName };
      case 7: return { field: 'certificationName', value: data.certificationName };
      case 8: return { field: 'eventName', value: data.eventName };
      case 9: return { field: 'articleTitle', value: data.articleTitle };
      case 10: return { field: 'facilityName', value: data.facilityName };
      case 11:
      case 12: return { field: 'courseName', value: data.courseName };
      case 13: return { field: 'grantName', value: data.grantName };
      default: return { field: '', value: '' };
    }
  };

  const renderDateFields = () => {
    const isFutureAllowed = [1, 2, 3].includes(parseInt(form.category));
    const todayStr = new Date().toISOString().split("T")[0];
    return (
      <>
        <Box>
          <Typography sx={labelStyle}>From Date: *</Typography>
          <TextField
            size="small"
            fullWidth
            type="date"
            value={form.fromDate}
            onChange={setVal("fromDate")}
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: { max: todayStr }
            }}
          />
        </Box>
        <Box>
          <Typography sx={labelStyle}>To Date: *</Typography>
          <TextField
            size="small"
            fullWidth
            type="date"
            value={form.toDate}
            onChange={setVal("toDate")}
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: isFutureAllowed ? {} : { max: todayStr }
            }}
          />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Auto Duration (Days):</Typography>
          <TextField size="small" fullWidth disabled value={form.duration || ""} placeholder="Calculated automatically" />
        </Box>
      </>
    );
  };

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
            {renderDateFields()}
          </>
        );
      case 2:
        return (
          <>
            <Box>
              <Typography sx={labelStyle}>Journal Name (SCIE / Q1 / Q2): *</Typography>
              <TextField size="small" fullWidth value={form.journalName} onChange={setVal("journalName")} />
            </Box>
            {renderDateFields()}
          </>
        );
      case 3:
        return (
          <>
            <Box>
              <Typography sx={labelStyle}>Journal / Conference Name: *</Typography>
              <TextField size="small" fullWidth value={form.journalConferenceName} onChange={setVal("journalConferenceName")} />
            </Box>
            {renderDateFields()}
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
              <TextField size="small" fullWidth type="date" value={form.awardDate} onChange={setVal("awardDate")} slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: new Date().toISOString().split("T")[0] } }} />
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
            {renderDateFields()}
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
              <TextField size="small" fullWidth type="date" value={form.eventDate} onChange={setVal("eventDate")} slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: new Date().toISOString().split("T")[0] } }} />
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
              <TextField size="small" fullWidth type="date" value={form.publicationDate} onChange={setVal("publicationDate")} slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: new Date().toISOString().split("T")[0] } }} />
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
            {renderDateFields()}
          </>
        );
      case 11:
        return (
          <>
            <Box>
              <Typography sx={labelStyle}>Course Name: *</Typography>
              <TextField size="small" fullWidth value={form.courseName} onChange={setVal("courseName")} />
            </Box>
            <Box>
              <Typography sx={labelStyle}>Duration: *</Typography>
              <Select
                size="small"
                fullWidth
                value={form.duration}
                onChange={setVal("duration")}
                displayEmpty
              >
                <MenuItem value="" disabled>--Select NPTEL Duration--</MenuItem>
                <MenuItem value="12 Weeks">12 Weeks</MenuItem>
                <MenuItem value="8 Weeks">8 Weeks</MenuItem>
                <MenuItem value="4 Weeks">4 Weeks</MenuItem>
              </Select>
            </Box>
            <Box>
              <Typography sx={labelStyle}>Certificate Number: *</Typography>
              <TextField
                size="small"
                fullWidth
                value={form.certificateNumber}
                onChange={setVal("certificateNumber")}
                placeholder="e.g. NPTEL24CS01S1234"
              />
            </Box>
            <Box sx={{ gridColumn: { sm: "1 / -1" }, mt: 1, p: 2, bgcolor: "rgba(232, 160, 0, 0.08)", border: "1px solid rgba(232, 160, 0, 0.3)", borderRadius: "8px" }}>
              <Typography variant="body2" sx={{ color: "#e8a000", fontWeight: 700 }}>
                ⚠️ Note: This NPTEL certificate can only be claimed in one metric — either Metric 3.1 (Resource Utilization) or Metric 3.2 (Contribution), not both.
              </Typography>
            </Box>
          </>
        );
      case 12:
        return (
          <>
            <Box>
              <Typography sx={labelStyle}>Course Name (Coursera): *</Typography>
              <TextField size="small" fullWidth value={form.courseName} onChange={setVal("courseName")} />
            </Box>
            <Box>
              <Typography sx={labelStyle}>Course Hours: *</Typography>
              <TextField
                size="small"
                fullWidth
                type="number"
                value={form.courseHours}
                onChange={setVal("courseHours")}
                placeholder="e.g. 40"
                helperText="Minimum 40 hours required for eligibility"
              />
            </Box>
            <Box>
              <Typography sx={labelStyle}>Certificate Number: *</Typography>
              <TextField
                size="small"
                fullWidth
                value={form.certificateNumber}
                onChange={setVal("certificateNumber")}
                placeholder="e.g. ABC-XYZ-123"
              />
            </Box>
            {renderDateFields()}
          </>
        );
      case 13:
        return (
          <>
            <Box>
              <Typography sx={labelStyle}>Grant Name: *</Typography>
              <TextField size="small" fullWidth value={form.grantName} onChange={setVal("grantName")} />
            </Box>
            {renderDateFields()}
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
        <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 2, alignItems: "center", mb: 3 }}>
          <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { xs: "stretch", sm: "center" }, gap: 2, width: { xs: "100%", sm: "auto" } }}>
            <Typography variant="h6" sx={{ color: "var(--text-primary)", fontWeight: 800 }}>
              Expertise / Contribution Records
            </Typography>
            <Select
              size="small"
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                blurActiveElement();
              }}
              onClose={blurActiveElement}
              MenuProps={selectMenuProps}
              displayEmpty
              sx={{ width: { xs: "100%", sm: "auto" }, minWidth: { xs: "100%", sm: 180 }, borderRadius: "8px", background: "var(--bg-glass)" }}
            >
              <MenuItem value="">All Academic Years</MenuItem>
              {academicYears.map(y => (
                <MenuItem key={y._id} value={y._id}>{y.year}</MenuItem>
              ))}
            </Select>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ width: { xs: "100%", sm: "auto" } }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleOpenAddModal}
              startIcon={<AddCircle />}
              sx={{ textTransform: "none", fontWeight: 700, width: { xs: "100%", sm: "auto" } }}
            >
              Add Contribution
            </Button>
            <Button
              variant="contained"
              color="success"
              disabled={activeDrafts.length === 0 || loading}
              onClick={handleBulkSubmit}
              sx={{
                background: "var(--gradient-primary)",
                px: 3,
                fontWeight: 800,
                textTransform: "none",
                width: { xs: "100%", sm: "auto" },
                "&:hover": { opacity: 0.9 },
                "&.Mui-disabled": {
                  background: "var(--disabled-bg)",
                  color: "var(--disabled-text)",
                }
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
              Click the "Add Contribution" button to create your first Draft entry.
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-premium)", overflowX: "auto" }}>
            <Table>
              <TableHead sx={{ background: "var(--gradient-primary)" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Academic Year</TableCell>
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
                      <TableCell sx={{ color: "var(--text-primary)", fontWeight: 500, py: 2 }}>
                        {item.academicYear?.year || "N/A"}
                      </TableCell>
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
    const { value } = getContributionNameField(data.category, data);

    const backendURL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "");
    const fileUrl = data.proof ? (data.proof.startsWith('http') ? data.proof : `${backendURL}${data.proof}`) : null;
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(data.proof || "");

    const formatDate = (dateStr) => {
      if (!dateStr) return "-";
      return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
    };

    return (
      <Dialog
        open={!!selectedContributionDetails}
        onClose={() => setSelectedContributionDetails(null)}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: "20px",
              background: "var(--bg-paper)",
              backdropFilter: "blur(12px)",
              border: "1px solid var(--border-color)",
              boxShadow: "var(--shadow-premium)",
            }
          }
        }}
      >
        <DialogTitle component="div" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--gradient-primary)", color: "#fff", py: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <WorkspacePremium sx={{ color: "#fff" }} />
            <Typography variant="h6" component="div" sx={{ fontWeight: 800 }}>Contribution Details</Typography>
          </Box>
          <IconButton onClick={() => setSelectedContributionDetails(null)} sx={{ color: "#fff" }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2, px: 3, pb: 3, mt: 2 }}>
          <Typography variant="subtitle2" color="var(--color-primary)" sx={{ fontWeight: 800, textTransform: "uppercase" }}>
            {getCategoryName(data.category)}
          </Typography>
          {value && (
            <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)", mb: 3, mt: 0.5 }}>
              {value}
            </Typography>
          )}

          <Grid container spacing={2} sx={{ mt: value ? 0 : 2 }}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", height: "100%" }}>
                <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem" }}>Academic Year</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.academicYear?.year || "N/A"}</Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", height: "100%" }}>
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

            {/* Category specific fields */}
            {data.fromDate && data.toDate && (
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", height: "100%" }}>
                  <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem" }}>Dates</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>
                    {formatDate(data.fromDate)} to {formatDate(data.toDate)}
                  </Typography>
                </Box>
              </Grid>
            )}

            {data.duration && (
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", height: "100%" }}>
                  <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem" }}>Duration</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.duration}</Typography>
                </Box>
              </Grid>
            )}

            {data.awardDate && (
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", height: "100%" }}>
                  <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem" }}>Award Date</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{formatDate(data.awardDate)}</Typography>
                </Box>
              </Grid>
            )}

            {data.eventDate && (
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", height: "100%" }}>
                  <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem" }}>Event Date</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{formatDate(data.eventDate)}</Typography>
                </Box>
              </Grid>
            )}

            {data.publicationName && (
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", height: "100%" }}>
                  <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem" }}>Publication Name</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.publicationName}</Typography>
                </Box>
              </Grid>
            )}

            {data.publicationDate && (
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", height: "100%" }}>
                  <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem" }}>Publication Date</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{formatDate(data.publicationDate)}</Typography>
                </Box>
              </Grid>
            )}

            {data.certificateNumber && (
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", height: "100%" }}>
                  <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem" }}>Certificate Number</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.certificateNumber}</Typography>
                </Box>
              </Grid>
            )}

            {(data.courseHours !== undefined && data.courseHours !== null) && (
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", height: "100%" }}>
                  <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem" }}>Course Hours</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.courseHours} hrs</Typography>
                </Box>
              </Grid>
            )}

            {data.url && (
              <Grid size={{ xs: 12 }}>
                <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", height: "100%" }}>
                  <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem" }}>URL / Reference Link</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
                    <a href={data.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)", textDecoration: "none" }}>{data.url}</a>
                  </Typography>
                </Box>
              </Grid>
            )}

            {/* HOD Feedback / Remarks */}
            {data.hodComment && (
              <Grid size={{ xs: 12 }}>
                <Box sx={{ p: 2, bgcolor: "rgba(232, 160, 0, 0.05)", borderRadius: "12px", border: "1px solid rgba(232, 160, 0, 0.2)" }}>
                  <Typography variant="caption" sx={{ fontWeight: 900, color: "#e8a000", textTransform: "uppercase", letterSpacing: "0.05em" }}>HOD Remarks</Typography>
                  <Typography variant="body2" sx={{ fontStyle: "italic", mt: 0.5, color: "var(--text-primary)" }}>&quot;{data.hodComment}&quot;</Typography>
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


  const renderFormContent = () => (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2, mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Typography sx={{ 
          fontSize: 13, 
          fontWeight: 800, 
          color: "var(--text-primary)", 
          background: "var(--bg-accent-1)", 
          px: 2, 
          py: 1.2, 
          borderRadius: "12px", 
          borderLeft: "5px solid var(--color-primary)",
          textTransform: "uppercase",
          letterSpacing: "0.03em"
        }}>
          Details of the Contribution:
        </Typography>
        <Box sx={{ background: "var(--bg-accent-1)", color: "var(--color-primary)", px: 2, py: 1, borderRadius: "12px", fontWeight: 800, border: "1px solid var(--border-color)", fontSize: "0.85rem" }}>
          Academic Year: {academicYears.find(y => y._id === form.academicYear)?.year || "N/A"}
        </Box>
      </Box>

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
    </>
  );

  const renderFormModal = () => (
    <Dialog
      open={openFormModal}
      onClose={() => setOpenFormModal(false)}
      maxWidth="md"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: "20px" } } }}
    >
      <DialogTitle component="div" sx={{ borderBottom: "1px solid var(--border-color)", pb: 2 }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
          {editingId ? "Edit Contribution Entry" : "Add Contribution Entry"}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ p: 3, pt: 2 }}>
        {renderFormContent()}
      </DialogContent>
      <DialogActions sx={{ p: 2.5, borderTop: "1px solid var(--border-color)" }}>
        <Button
          variant="outlined"
          onClick={() => setOpenFormModal(false)}
          sx={{ textTransform: "none", fontWeight: 700 }}
        >
          Cancel
        </Button>
        <SubmitBtn onClick={handleSaveDraft} loading={loading} />
      </DialogActions>
    </Dialog>
  );

  const renderFormInline = () => (
    <FormCard title={editingId ? "Edit Contribution Entry" : "Add Contribution Entry"}>
      {renderFormContent()}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3, pt: 2.5, borderTop: "1px solid var(--border-color)" }}>
        <Button
          variant="outlined"
          onClick={() => setOpenFormModal(false)}
          sx={{ textTransform: "none", fontWeight: 700 }}
        >
          Cancel
        </Button>
        <SubmitBtn onClick={handleSaveDraft} loading={loading} />
      </Box>
    </FormCard>
  );

  const showFormInline = isMobile && openFormModal;

  return (
    <Box sx={{ width: "100%", pb: 5 }}>
      <PageHeader
        title={
          showFormInline
            ? (editingId ? "Edit Contribution" : "Add Contribution")
            : "Faculty Expertise / Recognition / Contribution"
        }
        subtitle={
          showFormInline
            ? "Provide details about your academic expertise, recognitions, or professional contributions."
            : "Manage and submit dynamic drafts of e-content, course completions, magazine articles, and awards."
        }
        onBack={showFormInline ? () => setOpenFormModal(false) : undefined}
      />
      <Box sx={{ mt: 4 }}>
        {showFormInline ? (
          renderFormInline()
        ) : (
          <>
            {renderDashboard()}
            {renderDetailsDialog()}
            {renderFormModal()}
          </>
        )}
      </Box>
      <NoActiveYearDialog
        open={noActiveYearAlertOpen}
        onClose={() => setNoActiveYearAlertOpen(false)}
      />
    </Box>
  );
}
