import { useState, useEffect } from "react";
import {
  Box, TextField, MenuItem, Select, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, Chip, Divider, Stack, useTheme, useMediaQuery
} from "@mui/material";
import { toast } from "sonner";
import { Description, WorkspacePremium, Close, AddCircle, Edit, Delete, Visibility, CheckCircle, CalendarToday, Download, Comment, FormatQuote, DateRange, School, FilePresent } from "@mui/icons-material";
import PageHeader from "../../components/common/PageHeader";
import NoActiveYearDialog from "../../components/common/NoActiveYearDialog";
import {
  FormCard, Grid2, SubLabel, NoteBox, FileField, SubmitBtn
} from "../../components/faculty/PublicationFormFields";
import { labelStyle } from "../../components/faculty/publicationConstants";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";

// Contribution Categories are now fetched from the database

export default function Contribution() {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [academicYears, setAcademicYears] = useState([]);
  const [contributionCategories, setContributionCategories] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [contributionsList, setContributionsList] = useState([]);

  const [noActiveYearAlertOpen, setNoActiveYearAlertOpen] = useState(false);
  const [selectedContributionDetails, setSelectedContributionDetails] = useState(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);

  useEffect(() => {
    let active = true;
    if (selectedContributionDetails?.proof) {
      const data = selectedContributionDetails;
      const backendURL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "");
      const fileUrl = data.proof.startsWith('http') ? data.proof : `${backendURL}${data.proof}`;
      
      fetch(fileUrl)
        .then(res => {
          if (!res.ok) throw new Error("Failed to fetch proof");
          return res.blob();
        })
        .then(blob => {
          if (active) {
            const url = URL.createObjectURL(blob);
            setPreviewBlobUrl(url);
          }
        })
        .catch(err => {
          console.error("Error loading preview:", err);
          if (active) {
            setPreviewBlobUrl(fileUrl);
          }
        });
    } else {
      setPreviewBlobUrl(null);
    }

    return () => {
      active = false;
      if (previewBlobUrl && previewBlobUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewBlobUrl);
      }
    };
  }, [selectedContributionDetails]);

  const [isDocumentRemoved, setIsDocumentRemoved] = useState(false);
  const [openFormModal, setOpenFormModal] = useState(false);

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
    certificateNumber: "",
    memberType: "",
    journalType: "",
    eventType: "",
    studentNames: "",
    existingProof: ""
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
        const active = years.find(y => y.active);
        if (active) {
          setSelectedYear(active._id);
          setForm(p => ({ ...p, academicYear: active._id }));
        }
      })
      .catch(err => console.log("Failed to fetch academic years", err));

    API.get("/api/value-addition/contribution-category")
      .then(res => setContributionCategories(res.data?.data || []))
      .catch(err => console.log("Failed to fetch contribution categories", err));
  }, []);

  const getCategoryCode = (id) => {
    if (!id) return null;
    if (typeof id === 'object' && id.code) return id.code;
    const searchId = String(typeof id === 'object' ? id._id : id);
    const isNum = /^\d+$/.test(searchId);
    const found = contributionCategories.find(c => String(c._id) === searchId || (isNum && c.code === parseInt(searchId, 10)));
    return found ? found.code : (isNum ? parseInt(searchId, 10) : null);
  };

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
    API.get(`/api/value-addition/contribution`)
      .then(res => {
        const allContributions = res.data?.data || [];
        setContributionsList(allContributions.filter(c => c.status === 'Approved' || c.status === 'Completed'));
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
    const activeYearDoc = academicYears[0];
    if (!activeYearDoc) {
      setNoActiveYearAlertOpen(true);
      return;
    }
    setEditingId(null);
    setForm({
      academicYear: activeYearDoc._id,
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
      contributionType: "",
      facilityDate: "",
      grantType: "",
      grantTitle: "",
      fundingAgency: "",
      grantAmount: "",
      sanctionDate: "",
      courseHours: "",
      certificateNumber: "",
      existingProof: ""
    });
    setIsDocumentRemoved(false);
    setProofFile(null);
    setOpenFormModal(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingId(item._id);
    const cat = item.category;
    setForm({
      academicYear: item.academicYear?._id || item.academicYear || "",
      category: cat?._id || cat || "",
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
      contributionType: item.contributionType || "",
      facilityDate: item.facilityDate ? item.facilityDate.substring(0, 10) : "",
      grantType: item.grantType || "",
      grantTitle: item.grantTitle || "",
      fundingAgency: item.fundingAgency || "",
      grantAmount: item.grantAmount || "",
      sanctionDate: item.sanctionDate ? item.sanctionDate.substring(0, 10) : "",
      courseHours: item.courseHours !== undefined ? String(item.courseHours) : "",
      certificateNumber: item.certificateNumber || "",
      memberType: item.memberType || "",
      journalType: item.journalType || "",
      eventType: item.eventType || "",
      studentNames: item.studentNames || "",
      existingProof: item.proof || ""
    });
    setIsDocumentRemoved(false);
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

    if (!proofFile && (!editingId || isDocumentRemoved)) {
      toast.error("Supporting proof upload is mandatory");
      return;
    }

    const cat = getCategoryCode(form.category);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const validateDate = (dateStr, fieldLabel, allowFuture = false) => {
      if (!dateStr) return `${fieldLabel} is required.`;
      const dateVal = new Date(dateStr);
      if (!allowFuture && dateVal > today) return `${fieldLabel} cannot be in the future.`;
      return null;
    };

    let fieldErr = null;

    // Unified check for categories that use From Date, To Date and Auto Duration: 1, 2, 3, 7, 10 (Maintenance), 12
    if ([1, 2, 3, 7, 12].includes(cat) || (cat === 10 && form.contributionType === "Maintenance")) {
      if (!form.fromDate || !form.toDate) {
        fieldErr = "From Date and To Date are required.";
      } else {
        const from = new Date(form.fromDate);
        const to = new Date(form.toDate);
        if (from > today) {
          fieldErr = "From Date cannot be in the future.";
        } else if (from > to) {
          fieldErr = "To Date must be greater than or equal to From Date.";
        } else {
          if (([7, 12].includes(cat) || cat === 10) && to > today) {
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
          else if (!form.fromDate || !form.toDate) fieldErr = "From and To dates are required.";
          else if (!form.courseHours) fieldErr = "Hours are required.";
          else if (isNaN(Number(form.courseHours)) || Number(form.courseHours) < 40) fieldErr = "Minimum 40 hours is required.";
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
          else if (!form.contributionType) fieldErr = "Contribution Type is required.";
          else if (form.contributionType === "Establishment") {
            fieldErr = validateDate(form.fromDate, "Establishment Date");
          }
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
          if (!form.grantType || !form.grantTitle || !form.fundingAgency || !form.grantAmount) {
            fieldErr = "Grant Type, Title, Funding Agency, and Amount are required.";
          } else {
            fieldErr = validateDate(form.sanctionDate, "Sanction Date");
          }
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
      fd.append("category", form.category);

      // Append From Date, To Date, Duration for categories that use them
      if ([1, 2, 3, 7, 10, 12, 13].includes(cat)) {
        fd.append("fromDate", form.fromDate);
        fd.append("toDate", form.toDate);
        fd.append("duration", form.duration);
      }

      if (cat === 1) {
        fd.append("organizationName", form.organizationName);
        if (form.memberType) fd.append("memberType", form.memberType);
      } else if (cat === 2) {
        fd.append("journalName", form.journalName);
        if (form.journalType) fd.append("journalType", form.journalType);
      } else if (cat === 3) {
        fd.append("journalConferenceName", form.journalConferenceName);
        if (form.journalType) fd.append("journalType", form.journalType);
      } else if (cat === 4 || cat === 5) {
        fd.append("awardName", form.awardName);
        if (form.awardingAgency) fd.append("awardingAgency", form.awardingAgency);
        fd.append("awardDate", form.awardDate);
      } else if (cat === 6) {
        fd.append("courseName", form.courseName);
        fd.append("url", form.url);
      } else if (cat === 7) {
        fd.append("certificationName", form.certificationName);
        fd.append("courseHours", form.courseHours);
      } else if (cat === 8) {
        fd.append("eventName", form.eventName);
        fd.append("eventDate", form.eventDate);
        if (form.eventType) fd.append("eventType", form.eventType);
        if (form.studentNames) fd.append("studentNames", form.studentNames);
      } else if (cat === 9) {
        fd.append("articleTitle", form.articleTitle);
        fd.append("publicationName", form.publicationName);
        fd.append("publicationDate", form.publicationDate);
      } else if (cat === 10) {
        fd.append("facilityName", form.facilityName);
        fd.append("contributionType", form.contributionType);
      } else if (cat === 11) {
        fd.append("courseName", form.courseName);
        fd.append("duration", form.duration);
        fd.append("certificateNumber", form.certificateNumber);
      } else if (cat === 12) {
        fd.append("courseName", form.courseName);
        fd.append("courseHours", form.courseHours);
        fd.append("certificateNumber", form.certificateNumber);
      } else if (cat === 13) {
        fd.append("grantType", form.grantType);
        fd.append("grantTitle", form.grantTitle);
        fd.append("fundingAgency", form.fundingAgency);
        fd.append("grantAmount", form.grantAmount);
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
        <Typography sx={{ fontSize: 10, color: "var(--color-primary)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>Parent Department</Typography>
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
    let found = contributionCategories.find(c => c._id === catId);
    if (!found) found = contributionCategories.find(c => c.code === parseInt(catId));
    return found ? found.name : `Category ${catId}`;
  };



  const getContributionDetailsString = (item) => {
    if (!item) return "N/A";
    const catCode = getCategoryCode(item.category);
    const catName = item.category?.name || "Unknown Category";
    const fDate = item.fromDate ? new Date(item.fromDate).toLocaleDateString('en-GB') : "";
    const tDate = item.toDate ? new Date(item.toDate).toLocaleDateString('en-GB') : "";
    
    switch (catCode) {
      case 1: {
        const typeMap = {
          'BOG': 'the Board of Governance',
          'GB': 'the Governing Body',
          'AC': 'the Academic Council',
          'BOS': 'the Board of Studies'
        };
        const mType = typeMap[item.memberType] || item.memberType || 'N/A';
        return `Member of ${mType} of ${item.organizationName || 'N/A'}. (From ${fDate} to ${tDate})`;
      }
      case 2:
      case 3: return `Member of the Editorial Board of ${item.journalName || 'N/A'} (Type: ${item.journalType || 'N/A'}) (${fDate} to ${tDate})`;
      case 4:
      case 5: return `Awarded as ${item.awardName || 'N/A'} by ${item.awardingAgency || 'N/A'} on ${item.awardDate ? new Date(item.awardDate).toLocaleDateString('en-GB') : 'N/A'}`;
      case 6: return (
        <span>
          Developed e-content for the course {item.courseName || 'N/A'}
          {item.url && (
            <>
              {" "}
              &bull;{" "}
              <a href={item.url} target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>
                View Resource
              </a>
            </>
          )}
        </span>
      );
      case 7: return `Completed the certification ${item.certificationName || 'N/A'} from ${fDate} to ${tDate} (${item.courseHours || 'N/A'} hours).`;
      case 8: return `Trained student(s) ${item.studentNames || 'N/A'} shortlisted for the finals of the ${item.eventType || 'N/A'} "${item.eventName || 'N/A'}" on ${item.eventDate ? new Date(item.eventDate).toLocaleDateString('en-GB') : 'N/A'}.`;
      case 9: return `Published the article "${item.articleTitle || 'N/A'}" in ${item.publicationName || 'N/A'} on ${item.publicationDate ? new Date(item.publicationDate).toLocaleDateString('en-GB') : 'N/A'}.`;
      case 10: return item.contributionType === "Establishment" ? `Established the research facility ${item.facilityName || 'N/A'} on ${fDate}.` : `Maintained the research facility ${item.facilityName || 'N/A'} from ${fDate} to ${tDate}.`;
      case 11: return `Completed the NPTEL course ${item.courseName || 'N/A'} with a duration of ${item.duration || 'N/A'}.`;
      case 12: return `Completed the Coursera course ${item.courseName || 'N/A'} from ${fDate} to ${tDate} (${item.courseHours || 'N/A'} hours).`;
      case 13: return `Received a ${item.grantType?.toLowerCase() || 'grant'} of ₹${item.grantAmount || 0} from ${item.fundingAgency || 'N/A'} for "${item.grantTitle || 'N/A'}" on ${item.sanctionDate ? new Date(item.sanctionDate).toLocaleDateString('en-GB') : 'N/A'}.`;
      default: return catName;
    }
  };

  const getContributionNameField = (category, data) => {
    const cat = getCategoryCode(category);
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
      case 13: return { field: 'grantTitle', value: data.grantTitle };
      default: return { field: '', value: '' };
    }
  };

  const renderDateFields = () => {
    const isFutureAllowed = [1, 2, 3].includes(getCategoryCode(form.category));
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
      </>
    );
  };

  const renderCategorySpecificFields = () => {
    const cat = getCategoryCode(form.category);
    if (isNaN(cat)) return null;

    switch (cat) {
      case 1:
        return (
          <>
            <Box>
              <Typography sx={labelStyle}>Member Type: *</Typography>
              <Select size="small" fullWidth displayEmpty value={form.memberType || ""} onChange={(e) => setForm(p => ({ ...p, memberType: e.target.value }))}>
                <MenuItem value="" disabled>--Select Role--</MenuItem>
                <MenuItem value="BOG">Board of Governance (BOG)</MenuItem>
                <MenuItem value="GB">Governing Body (GB)</MenuItem>
                <MenuItem value="AC">Academic Council (AC)</MenuItem>
                <MenuItem value="BOS">Board of Studies (BOS)</MenuItem>
              </Select>
            </Box>
            <Box>
              <Typography sx={labelStyle}>Organization Name: *</Typography>
              <TextField size="small" fullWidth value={form.organizationName || ""} onChange={setVal("organizationName")} />
            </Box>
            {renderDateFields()}
          </>
        );
      case 2:
        return (
          <>
            <Box>
              <Typography sx={labelStyle}>Journal Name: *</Typography>
              <TextField size="small" fullWidth value={form.journalName || ""} onChange={setVal("journalName")} />
            </Box>
            <Box>
              <Typography sx={labelStyle}>Journal Type: *</Typography>
              <Select size="small" fullWidth displayEmpty value={form.journalType || ""} onChange={(e) => setForm(p => ({ ...p, journalType: e.target.value }))}>
                <MenuItem value="" disabled>--Select Type--</MenuItem>
                <MenuItem value="SCIE">SCIE</MenuItem>
                <MenuItem value="Q1">Q1</MenuItem>
                <MenuItem value="Q2">Q2</MenuItem>
              </Select>
            </Box>
            {renderDateFields()}
          </>
        );
      case 3:
        return (
          <>
            <Box>
              <Typography sx={labelStyle}>Journal / Conference Name: *</Typography>
              <TextField size="small" fullWidth value={form.journalName || ""} onChange={setVal("journalName")} />
            </Box>
            <Box>
              <Typography sx={labelStyle}>Journal Type: *</Typography>
              <Select size="small" fullWidth displayEmpty value={form.journalType || ""} onChange={(e) => setForm(p => ({ ...p, journalType: e.target.value }))}>
                <MenuItem value="" disabled>--Select Type--</MenuItem>
                <MenuItem value="ESCI">ESCI</MenuItem>
                <MenuItem value="Q3">Q3</MenuItem>
                <MenuItem value="Q4">Q4</MenuItem>
                <MenuItem value="Conference proceedings">Conference proceedings</MenuItem>
              </Select>
            </Box>
            {renderDateFields()}
          </>
        );
      case 4:
      case 5:
        return (
          <>
            <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
              <Typography sx={labelStyle}>Awarding Agency: *</Typography>
              {cat === 4 ? (
                <Select size="small" fullWidth displayEmpty value={form.awardingAgency || ""} onChange={setVal("awardingAgency")}>
                  <MenuItem value="" disabled>--Select Awarding Agency--</MenuItem>
                  <MenuItem value="MHRD">MHRD</MenuItem>
                  <MenuItem value="AICTE">AICTE</MenuItem>
                  <MenuItem value="UGC">UGC</MenuItem>
                  <MenuItem value="State Govt.">State Govt.</MenuItem>
                  <MenuItem value="Top 2%">Top 2%</MenuItem>
                </Select>
              ) : (
                <TextField size="small" fullWidth value={form.awardingAgency || ""} onChange={setVal("awardingAgency")} placeholder="NGO / Trust / Other name" />
              )}
            </Box>
            <Box>
              <Typography sx={labelStyle}>Award Name: *</Typography>
              <TextField size="small" fullWidth value={form.awardName || ""} onChange={setVal("awardName")} />
            </Box>
            <Box>
              <Typography sx={labelStyle}>Award Date: *</Typography>
              <TextField size="small" fullWidth type="date" value={form.awardDate || ""} onChange={setVal("awardDate")} slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: new Date().toISOString().split("T")[0] } }} />
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
              <Typography sx={labelStyle}>Duration (Hours): *</Typography>
              <TextField type="number" size="small" fullWidth value={form.courseHours} onChange={setVal("courseHours")} placeholder="e.g. 40" />
            </Box>
            {renderDateFields()}
          </>
        );
      case 8:
        return (
          <>
            <Box>
              <Typography sx={labelStyle}>Event Type: *</Typography>
              <Select size="small" fullWidth displayEmpty value={form.eventType || ""} onChange={(e) => setForm(p => ({ ...p, eventType: e.target.value }))}>
                <MenuItem value="" disabled>--Select Event Type--</MenuItem>
                <MenuItem value="Hackathon">Hackathon</MenuItem>
                <MenuItem value="Startup">Startup</MenuItem>
                <MenuItem value="Events">Events</MenuItem>
              </Select>
            </Box>
            <Box>
              <Typography sx={labelStyle}>Event Name: *</Typography>
              <TextField size="small" fullWidth value={form.eventName || ""} onChange={setVal("eventName")} />
            </Box>
            <Box>
              <Typography sx={labelStyle}>Student Names: *</Typography>
              <TextField size="small" fullWidth value={form.studentNames || ""} onChange={setVal("studentNames")} placeholder="John, Jane, etc." />
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
              <Typography sx={labelStyle}>Contribution Type: *</Typography>
              <Select size="small" fullWidth displayEmpty value={form.contributionType || ""} onChange={(e) => setForm(p => ({ ...p, contributionType: e.target.value }))}>
                <MenuItem value="" disabled>--Select Type--</MenuItem>
                <MenuItem value="Establishment">Establishment</MenuItem>
                <MenuItem value="Maintenance">Maintenance</MenuItem>
              </Select>
            </Box>
            <Box>
              <Typography sx={labelStyle}>Facility Name: *</Typography>
              <TextField size="small" fullWidth value={form.facilityName} onChange={setVal("facilityName")} />
            </Box>
            {form.contributionType === "Establishment" && (
              <Box>
                <Typography sx={labelStyle}>Establishment Date: *</Typography>
                <TextField size="small" fullWidth type="date" value={form.fromDate} onChange={setVal("fromDate")} slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: new Date().toISOString().split("T")[0] } }} />
              </Box>
            )}
            {form.contributionType === "Maintenance" && renderDateFields()}
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
              <Typography sx={labelStyle}>Grant Type: *</Typography>
              <Select size="small" fullWidth displayEmpty value={form.grantType || ""} onChange={setVal("grantType")}>
                <MenuItem value="" disabled>--Select Type--</MenuItem>
                <MenuItem value="FDP">FDP</MenuItem>
                <MenuItem value="Seminar">Seminar</MenuItem>
              </Select>
            </Box>
            <Box>
              <Typography sx={labelStyle}>Title of FDP / Seminar: *</Typography>
              <TextField size="small" fullWidth value={form.grantTitle} onChange={setVal("grantTitle")} />
            </Box>
            <Box>
              <Typography sx={labelStyle}>Funding Agency: *</Typography>
              <TextField size="small" fullWidth value={form.fundingAgency} onChange={setVal("fundingAgency")} />
            </Box>
            <Box>
              <Typography sx={labelStyle}>Grant Amount (₹): *</Typography>
              <TextField size="small" fullWidth type="number" value={form.grantAmount} onChange={setVal("grantAmount")} />
            </Box>
            <Box>
              <Typography sx={labelStyle}>Sanction Date: *</Typography>
              <TextField size="small" fullWidth type="date" value={form.sanctionDate} onChange={setVal("sanctionDate")} slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: new Date().toISOString().split("T")[0] } }} />
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
        <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 2, alignItems: "center", mb: 3 }}>
          <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { xs: "stretch", sm: "center" }, gap: 2, width: { xs: "100%", sm: "auto" } }}>
            <Typography variant="h6" sx={{ color: "var(--text-primary)", fontWeight: 800 }}>
              Expertise / Contribution Records
            </Typography>
          </Box>
        </Box>

        {contributionsList.length === 0 ? (
          <Box sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            py: 5,
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
                        <Typography sx={{ color: "var(--text-secondary)", fontSize: "0.85rem", mt: 0.5 }}>
                          {getContributionDetailsString(item)}
                        </Typography>
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
                          {item.status === "Pending at HOD" ? "Pending at HOD / Dean" : item.status}
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
      return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    };

    // Determine what dates we have to display in the lavender card
    const hasFromToDates = data.fromDate && data.toDate;
    const singleDate = data.awardDate || data.eventDate || data.publicationDate;
    const dateLabel = data.awardDate ? "Award Date" : data.eventDate ? "Event Date" : "Publication Date";

    return (
      <Dialog
        open={!!selectedContributionDetails}
        onClose={() => setSelectedContributionDetails(null)}
        maxWidth="lg"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: "20px",
              background: "var(--bg-paper)",
              border: "1px solid var(--border-color)",
              boxShadow: "var(--shadow-premium)",
            }
          }
        }}
      >
        <DialogTitle component="div" sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "linear-gradient(90deg, #0d1b3e 0%, #0f172a 100%)",
          color: "#fff",
          py: 2.2,
          px: 3
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <WorkspacePremium sx={{ fontSize: 24, color: "#fff" }} />
            <Typography variant="h6" component="div" sx={{ fontWeight: 600, fontSize: "1.1rem" }}>Contribution Details</Typography>
          </Box>
          <IconButton onClick={() => setSelectedContributionDetails(null)} sx={{ color: "#fff" }}>
            <Close sx={{ fontSize: 20 }} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: "24px !important", px: 4, pb: 4 }}>
          {/* Header Section with Contribution Info & Large Circle Icon */}
          <Box sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2.5,
            mb: 4,
            mt: 1.5,
            flexWrap: { xs: "wrap", md: "nowrap" }
          }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, flex: 1 }}>
              {/* Left Circle Icon */}
              <Box sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                bgcolor: "#eff6ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                <School sx={{ fontSize: 32, color: "#1e3a8a" }} />
              </Box>
              
              {/* Title & Subtitle */}
              <Box>
                <Typography sx={{
                  fontSize: "0.85rem",
                  fontWeight: 800,
                  color: "#2563eb",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  mb: 0.5
                }}>
                  {getCategoryName(data.category)}
                </Typography>
                {value && (
                  <Typography sx={{
                    fontSize: "1.35rem",
                    fontWeight: 800,
                    color: "var(--text-primary)",
                    lineHeight: 1.25
                  }}>
                    {value}
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Right: Status Badge */}
            <Chip
              label={data.status === "Pending at HOD" ? "Pending at HOD / Dean" : data.status}
              icon={
                data.status === "Approved" ? (
                  <span style={{ color: "#10b981", fontWeight: "bold", marginRight: "2px" }}>✓</span>
                ) : undefined
              }
              sx={{
                bgcolor: data.status === "Approved" ? "#f0fdf4" : statusStyle.bg,
                color: data.status === "Approved" ? "#10b981" : statusStyle.color,
                border: data.status === "Approved" ? "1px solid #bbf7d0" : `1px solid ${statusStyle.color}40`,
                fontWeight: 700,
                fontSize: "0.85rem",
                px: 1.8,
                py: 2.2,
                borderRadius: "8px",
                "& .MuiChip-icon": {
                  color: "inherit"
                }
              }}
            />
          </Box>

          {/* Grid Layout containing Labeled Info Columns */}
          <Grid container spacing={4}>
            {/* Left Column: Contribution Info and Duration */}
            <Grid size={{ xs: 12, md: 7.5 }}>
              
              {/* CONTRIBUTION INFORMATION */}
              <Box sx={{ mb: 4 }}>
                <Typography sx={{ fontSize: "0.85rem", fontWeight: 800, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.05em", mb: 2.5 }}>
                  Contribution Information
                </Typography>
                
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "120px 1fr", sm: "220px 1fr" }, gap: 2 }}>
                  <Typography sx={{ color: "#0f172a", fontSize: "0.9rem", fontWeight: 600, gridColumn: "1 / -1" }}>{getContributionDetailsString(data)}</Typography>

                  <Typography sx={{ fontWeight: 600, color: "#475569", fontSize: "0.9rem" }}>Academic Year</Typography>
                  <Typography sx={{ color: "#0f172a", fontSize: "0.9rem" }}>{data.academicYear?.year || "N/A"}</Typography>
                  
                  {data.publicationName && (
                    <>
                      <Typography sx={{ fontWeight: 600, color: "#475569", fontSize: "0.9rem" }}>Publication Name</Typography>
                      <Typography sx={{ color: "#0f172a", fontSize: "0.9rem" }}>{data.publicationName}</Typography>
                    </>
                  )}
                  {data.certificateNumber && (
                    <>
                      <Typography sx={{ fontWeight: 600, color: "#475569", fontSize: "0.9rem" }}>Certificate Number</Typography>
                      <Typography sx={{ color: "#0f172a", fontSize: "0.9rem" }}>{data.certificateNumber}</Typography>
                    </>
                  )}
                  {(data.courseHours !== undefined && data.courseHours !== null) && (
                    <>
                      <Typography sx={{ fontWeight: 600, color: "#475569", fontSize: "0.9rem" }}>Course Hours</Typography>
                      <Typography sx={{ color: "#0f172a", fontSize: "0.9rem" }}>{data.courseHours} hrs</Typography>
                    </>
                  )}
                  {data.url && (
                    <>
                      <Typography sx={{ fontWeight: 600, color: "#475569", fontSize: "0.9rem" }}>URL / Reference Link</Typography>
                      <Typography sx={{ color: "#0f172a", fontSize: "0.9rem" }}>
                        <a href={data.url} target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb", textDecoration: "none" }}>{data.url}</a>
                      </Typography>
                    </>
                  )}
                </Box>
              </Box>

              {/* Horizontal line divider */}
              {(hasFromToDates || singleDate) && (
                <>
                  <Box sx={{ borderBottom: "1px solid #cbd5e1", mb: 4, opacity: 0.5 }} />

                  {/* CONTRIBUTION DURATION */}
                  <Box>
                    <Typography sx={{ fontSize: "0.85rem", fontWeight: 800, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.05em", mb: 2.5 }}>
                      Contribution Duration
                    </Typography>
                    
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1px 1.2fr" }, gap: 3.5 }}>
                      {hasFromToDates ? (
                        <Box sx={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: 2 }}>
                          <Typography sx={{ fontWeight: 600, color: "#475569", fontSize: "0.9rem" }}>From Date</Typography>
                          <Typography sx={{ color: "#0f172a", fontSize: "0.9rem" }}>{formatDate(data.fromDate)}</Typography>
                          
                          <Typography sx={{ fontWeight: 600, color: "#475569", fontSize: "0.9rem" }}>To Date</Typography>
                          <Typography sx={{ color: "#0f172a", fontSize: "0.9rem" }}>{formatDate(data.toDate)}</Typography>
                        </Box>
                      ) : (
                        <Box sx={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: 2 }}>
                          <Typography sx={{ fontWeight: 600, color: "#475569", fontSize: "0.9rem" }}>{dateLabel}</Typography>
                          <Typography sx={{ color: "#0f172a", fontSize: "0.9rem" }}>{formatDate(singleDate)}</Typography>
                        </Box>
                      )}

                      {/* Vertical Divider */}
                      <Box sx={{ display: { xs: "none", sm: "block" }, width: "1px", height: "100%", bgcolor: "#cbd5e1" }} />

                      {/* Duration details */}
                      <Box sx={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 2 }}>
                        <Typography sx={{ fontWeight: 600, color: "#475569", fontSize: "0.9rem" }}>Duration</Typography>
                        <Typography sx={{ color: "#0f172a", fontSize: "0.9rem", fontWeight: 700 }}>{data.duration || "N/A"}</Typography>
                      </Box>
                    </Box>
                  </Box>
                </>
              )}

            </Grid>

            {/* Right Column: Proof Document */}
            <Grid size={{ xs: 12, md: 4.5 }} sx={{ borderLeft: { xs: "none", md: "1px solid #cbd5e1" }, pl: { xs: 0, md: 4 } }}>
              <Typography sx={{ fontSize: "0.85rem", fontWeight: 800, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.05em", mb: 2.5 }}>
                Proof Document
              </Typography>
              
              {fileUrl ? (
                <Box sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2
                }}>
                  {/* Embedded Document Preview */}
                  <Box sx={{
                    width: "100%",
                    height: 380,
                    border: "1px solid #cbd5e1",
                    borderRadius: "12px",
                    overflow: "hidden",
                    bgcolor: "#f8fafc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    {isImage ? (
                      <img
                        src={previewBlobUrl || fileUrl || undefined}
                        alt="Proof Document"
                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                      />
                    ) : (
                      <iframe
                        src={previewBlobUrl ? `${previewBlobUrl}#toolbar=0&navpanes=0&scrollbar=0` : (fileUrl || undefined)}
                        width="100%"
                        height="100%"
                        style={{ border: "none" }}
                        title="Proof Document Preview"
                      />
                    )}
                  </Box>

                  {/* Download Action */}
                  <Button
                    variant="contained"
                    size="medium"
                    fullWidth
                    startIcon={<Download sx={{ fontSize: 18 }} />}
                    onClick={() => window.open(fileUrl, "_blank")}
                    sx={{
                      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                      "&:hover": {
                        background: "#0f172a"
                      },
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      textTransform: "none",
                      borderRadius: "10px",
                      py: 1.2
                    }}
                  >
                    Download Document
                  </Button>
                </Box>
              ) : (
                <Typography sx={{ color: "var(--text-secondary)", fontStyle: "italic" }}>No proof document uploaded</Typography>
              )}
            </Grid>
          </Grid>
          
          {/* HOD Remarks (only shown if present) */}
          {data.hodComment && (
            <Box sx={{
              mt: 4,
              p: 2.5,
              background: "#fff1f2",
              borderRadius: "12px",
              border: "1px solid #ffe4e6",
              display: "flex",
              alignItems: "center",
              gap: 2.5,
              position: "relative",
              overflow: "hidden"
            }}>
              <Box sx={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "#ffe4e6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                <WorkspacePremium sx={{ color: "#e11d48", fontSize: 22 }} />
              </Box>
              
              <Box sx={{
                width: "1px",
                height: 32,
                bgcolor: "#fda4af"
              }} />

              <Box sx={{ flex: 1, zIndex: 2 }}>
                <Typography sx={{ fontSize: "0.85rem", fontWeight: 800, color: "#be185d", mb: 0.5 }}>
                  HOD Remarks
                </Typography>
                <Typography sx={{ fontSize: "0.9rem", color: "#881337", fontStyle: "italic", fontWeight: 600 }}>
                  &quot;{data.hodComment}&quot;
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2.5, borderTop: "1px solid var(--border-color)" }}>
          <Button
            onClick={() => setSelectedContributionDetails(null)}
            variant="outlined"
            sx={{
              color: "var(--text-primary)",
              borderColor: "var(--border-color)",
              "&:hover": {
                borderColor: "var(--text-primary)",
                background: "var(--bg-panel)"
              },
              fontWeight: 700,
              textTransform: "none",
              fontSize: "0.95rem",
              borderRadius: "8px",
              px: 3
            }}
          >
            Close
          </Button>
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>Academic Year: *</Typography>
          <Select
            size="small"
            displayEmpty
            value={form.academicYear || ""}
            onChange={(e) => setForm((p) => ({ ...p, academicYear: e.target.value }))}
            disabled={!!editingId}
            sx={{ minWidth: 150, background: "var(--bg-panel)" }}
          >
            <MenuItem value="" disabled>--Select--</MenuItem>
            {academicYears.map(y => (
              <MenuItem key={y._id} value={y._id}>{y.year}</MenuItem>
            ))}
          </Select>
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
          {contributionCategories.map(cat => (
            <MenuItem key={cat._id} value={cat._id}>{cat.name}</MenuItem>
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
            {editingId && form.existingProof && !isDocumentRemoved ? (
              <Box sx={{ p: 2, border: "1px solid var(--border-color)", borderRadius: "12px", background: "var(--bg-glass)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <FilePresent sx={{ color: "var(--color-primary)" }} />
                  <Typography sx={{ fontWeight: 600, color: "var(--text-primary)" }}>Existing Document</Typography>
                  <Button size="small" href={form.existingProof.startsWith('http') ? form.existingProof : `${(import.meta.env.VITE_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")}${form.existingProof}`} target="_blank" sx={{ ml: 2, textTransform: "none" }}>View</Button>
                </Box>
                <IconButton onClick={() => setIsDocumentRemoved(true)} sx={{ color: "#ef4444" }}>
                  <Delete />
                </IconButton>
              </Box>
            ) : (
              <FileField
                label="Relevant Proof/Certificate Upload: *"
                name="proof"
                onChange={handleFileChange}
              />
            )}
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
