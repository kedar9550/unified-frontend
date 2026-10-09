import Loader from "../../components/common/Loader";
import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

import { Box, TextField, MenuItem, Select, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Autocomplete, InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions, Stack, Grid, Card, Chip, Divider, Tooltip, TablePagination, Radio, RadioGroup, FormControlLabel } from "@mui/material";
import { toast } from "sonner";
import {
  Delete, Search, CurrencyRupee, Close, Groups, MenuBook, AttachFile, Description, Download, Visibility, Edit, CheckCircle, Cancel, AccessTime,
  School, FormatListBulleted, PersonOutlined as PersonOutline, ShowChart, CalendarMonth, Public, Person, Link, Numbers, Grass as GrassIcon, CardGiftcard, Article
} from "@mui/icons-material";
import CheckCircleOutline from "@mui/icons-material/CheckCircleOutlined";
import PageHeader from "../../components/common/PageHeader";
import { Alert, AlertTitle } from "@mui/material";
import NoActiveYearDialog from "../../components/common/NoActiveYearDialog";
import {
  FacultyInfoRow, FormCard, Grid2, SubLabel, NoteBox, FileField, SubmitBtn
} from "../../components/faculty/PublicationFormFields";
import {
  labelStyle, disabledField, MONTHS, YEARS
} from "../../components/faculty/publicationConstants"; import API from "../../api/axios";

export default function TextbookPublication() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState("list"); // 'list', 'select-year', 'form'
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [noActiveYearAlertOpen, setNoActiveYearAlertOpen] = useState(false);
  const [publicationsList, setPublicationsList] = useState([]);
  const [selectedPubDetails, setSelectedPubDetails] = useState(null);
  const [appraisalConfigActive, setAppraisalConfigActive] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editions, setEditions] = useState([]);
  const [publishers, setPublishers] = useState([]);
  const [isbnFetching, setIsbnFetching] = useState(false);
  const [isbnFetched, setIsbnFetched] = useState(false);
  const [isbnFetchedFields, setIsbnFetchedFields] = useState({ title: false, publisher: false });

  const [form, setForm] = useState({
    title: "", publisher: "", isbn: "", yearOfPublication: "",
    totalAuthors: 1, userAuthorPosition: 1,
    edition: "", cost: "", month: "", year: "",
    isStudentsInvolved: "No",
    scopusIndexed: "No",
    applyIncentive: "",
    otherAuthors: [],
    publicationScope: "National",
    customPublisher: "",
    currencySymbol: "₹",
    numberOfPages: ""
  });
  const [files, setFiles] = useState({ coverPage: null, authorAffiliation: null, index: null });
  const [existingFiles, setExistingFiles] = useState({ coverPage: null, authorAffiliation: null, index: null });
  const [deleteFlags, setDeleteFlags] = useState({ coverPage: false, authorAffiliation: false, index: false });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get("/api/research/textbook").then(res => {
      setPublicationsList(res.data?.data || res.data || []);
    }).catch(err => { });

    API.get("/api/academic-years").then(res => {
      setAcademicYears(res.data?.years || res.data?.data || []);
    }).catch(err => { });

    API.get("/api/research/textbook/editions").then(res => {
      setEditions(res.data?.data || []);
    }).catch(err => { });

    API.get("/api/publishers").then(res => {
      setPublishers(res.data?.data || []);
    }).catch(err => { });
  }, [viewMode]);

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

  const set = (k) => (e) => {
    const val = e.target.value;
    setForm((p) => {
      const newForm = { ...p, [k]: val };
      if (k === "isbn") {
        newForm.title = "";
        newForm.publisher = "";
        newForm.month = "";
        newForm.year = "";
        setIsbnFetched(false);
        setIsbnFetchedFields({ title: false, publisher: false });
      }
      if (k === "isStudentsInvolved") {
        if (val === "Yes") {
          if (parseInt(newForm.totalAuthors) < 2 || isNaN(parseInt(newForm.totalAuthors))) {
            newForm.totalAuthors = 2;
          }
        } else if (val === "No") {
          newForm.otherAuthors = (newForm.otherAuthors || []).map(a => ({
            ...a,
            CoAuthorType: "faculty",
            studentId: "",
            studentQualification: "",
            authorName: a.CoAuthorType === "student" ? "" : a.authorName,
            empId: a.CoAuthorType === "student" ? "" : a.empId
          }));
          newForm.applyIncentive = "";
        }
      }
      return newForm;
    });
  };

  const handleNumericChange = (key, allowDecimal = true) => (e) => {
    const val = e.target.value;
    const regex = allowDecimal ? /^\d*\.?\d*$/ : /^\d*$/;
    if (regex.test(val)) {
      setForm(p => ({ ...p, [key]: val }));
    }
  };

  const getAvailableMonths = () => {
    const selectedYearVal = parseInt(form.year);
    const currentYear = new Date().getFullYear();
    if (selectedYearVal === currentYear) {
      const currentMonthIndex = new Date().getMonth(); // 0 to 11
      return MONTHS.filter((_, idx) => idx <= currentMonthIndex);
    }
    return MONTHS;
  };

  const validateFile = (file) => {
    if (!file) return true;
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.type)) {
      toast.error("Only PDF, JPG, and PNG files are allowed");
      return false;
    }
    if (file.size > 500 * 1024) {
      toast.error("File size exceeds 500KB limit");
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
      toast.warning("Please enter an ISBN first");
      return;
    }
    setIsbnFetching(true);
    try {
      const res = await API.get(`/api/research/textbook/isbn/${form.isbn}`);
      if (res.data?.success) {
        const data = res.data.data;
        if (!data || !data.title) {
          throw new Error("ISBN details not found. Please fill fields manually");
        }
        let newMonth = form.month;
        let newYear = form.year;

        if (data.yearOfPublication) {
          const str = String(data.yearOfPublication);
          const yearMatch = str.match(/\b(19|20)\d{2}\b/);
          if (yearMatch) newYear = yearMatch[0];

          const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
          const shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          for (let i = 0; i < 12; i++) {
            if (str.toLowerCase().includes(months[i].toLowerCase()) || str.toLowerCase().includes(shortMonths[i].toLowerCase())) {
              newMonth = months[i];
              break;
            }
          }
        }

        setForm(p => ({
          ...p,
          title: data.title || p.title,
          publisher: data.publisher || p.publisher,
          month: newMonth,
          year: newYear
        }));
        setIsbnFetched(true);
        setIsbnFetchedFields({
          title: !!data.title,
          publisher: !!data.publisher
        });
        toast.success("Book details fetched successfully!");
      } else {
        throw new Error(res.data?.message || "ISBN details not found. Please fill fields manually");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Failed to fetch ISBN details");
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
    setForm(p => {
      const updated = p.otherAuthors.map(a => {
        if (a.authorPosition === pos) {
          const newA = { ...a, [field]: value };

          if (field === "CoAuthorType") {
            if (value === "faculty") {
              newA.studentId = "";
              if (a.CoAuthorType === "student") {
                newA.authorName = "";
                newA.empId = "";
              }
            } else if (value === "student") {
              newA.empId = "";
              newA.affiliationType = "Aditya University";
              newA.affiliationName = "Aditya University";
              if (a.CoAuthorType === "faculty") {
                newA.authorName = "";
              }
            }
          }

          if (field === "affiliationType") {
            if (value === "Aditya University") {
              newA.affiliationName = "Aditya University";
              newA.authorName = ""; // clear name so it can be fetched
              newA.empId = "";
              newA.studentId = "";
            } else {
              newA.affiliationName = "";
              newA.empId = "";
              newA.authorName = "";
              newA.studentId = "";
            }
          }
          return newA;
        }
        return a;
      });

      return { ...p, otherAuthors: updated };
    });

    // Fetch name if Aditya University and Employee ID is entered (length >= 3)
    if (field === "empId" && value.length >= 3) {
      const author = form.otherAuthors.find(a => a.authorPosition === pos);
      if (author && author.affiliationType === "Aditya University" && author.CoAuthorType !== "student") {
        fetchCoAuthorName(pos, value);
      }
    }
  };

  const handleStudentsInvolvedChange = (e) => {
    const val = e.target.value;
    setForm((prev) => {
      let newForm = { ...prev, isStudentsInvolved: val };

      // If previous value was "No" and new is "Yes", increment by 1
      if (prev.isStudentsInvolved === "No" && val === "Yes") {
        if (parseInt(newForm.totalAuthors) == 1) {
          newForm.totalAuthors = parseInt(newForm.totalAuthors) + 1;
        }
      }
      // If previous value was "Yes" and new is "No", decrement by 1
      else if (prev.isStudentsInvolved === "Yes" && val === "No") {
        if (parseInt(newForm.totalAuthors) == 2) {
          newForm.totalAuthors = parseInt(newForm.totalAuthors) - 1;
        }
      }

      if (val === "Yes") {
        newForm.applyIncentive = "No";
      } else {
        newForm.applyIncentive = "";
        if (newForm.otherAuthors) {
          newForm.otherAuthors = newForm.otherAuthors.map(author => {
            const newAuthor = { ...author };
            delete newAuthor.CoAuthorType;
            delete newAuthor.studentId;
            if (author.CoAuthorType === "student" && newAuthor.affiliationType === "Aditya University") {
              newAuthor.affiliationType = "";
            }
            return newAuthor;
          });
        }
      }
      return newForm;
    });
  };

  const handleEditClick = (pub) => {
    setEditingId(pub._id);
    setSelectedYear(pub.academicYear?._id || pub.academicYear || "");
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:9000";

    setForm({
      title: pub.title || "",
      publisher: pub.publisher || "",
      isbn: pub.isbn || "",
      yearOfPublication: pub.yearOfPublication || pub.year || "",
      totalAuthors: pub.totalAuthors || 1,
      userAuthorPosition: pub.userAuthorPosition || 1,
      edition: pub.edition || "",
      cost: pub.cost || "",
      month: pub.month || "",
      year: pub.year || "",
      isStudentsInvolved: pub.isStudentsInvolved || "No",
      scopusIndexed: pub.scopusIndexed || "No",
      applyIncentive: pub.applyIncentive || "",
      otherAuthors: pub.authors ? pub.authors.filter(a => parseInt(a.authorPosition) !== parseInt(pub.userAuthorPosition || 1)).map(a => ({
        authorPosition: a.authorPosition,
        affiliationType: a.affiliationType || "",
        empId: a.employeeId || "",
        authorName: a.authorName || "",
        affiliationName: a.affiliationName || ""
      })) : [],
      publicationScope: pub.publicationScope || "National",
      customPublisher: "",
      currencySymbol: pub.currencySymbol || "₹"
    });

    setExistingFiles({
      coverPage: pub.coverPage ? `${backendUrl}${pub.coverPage}` : null,
      authorAffiliation: pub.authorAffiliation ? `${backendUrl}${pub.authorAffiliation}` : null,
      index: pub.index ? `${backendUrl}${pub.index}` : null,
    });
    setFiles({ coverPage: null, authorAffiliation: null, index: null });
    setDeleteFlags({ coverPage: false, authorAffiliation: false, index: false });
    setViewMode("form");
  };

  const handleSubmit = async () => {
    if (!user?.panNumber || user?.panNumber === "Not Set" || !user?.college || user?.college === "Not Set") {
      toast.error("Please update your profile with PAN Number and College before submitting");
      return;
    }

    if (!form.title || !form.publisher || !form.isbn || !form.month || !form.year) {
      toast.error("Please fill all required fields");
      return;
    }

    if (form.cost) {
      const numCost = Number(form.cost);
      if (isNaN(numCost) || numCost < 0) {
        toast.error("Cost must be a positive numeric value");
        return;
      }
    }

    if (form.year && form.month) {
      const selectedYearVal = parseInt(form.year);
      const currentYear = new Date().getFullYear();
      const currentMonthIndex = new Date().getMonth();
      const monthIdx = MONTHS.indexOf(form.month);
      if (selectedYearVal > currentYear || (selectedYearVal === currentYear && monthIdx > currentMonthIndex)) {
        toast.error("Publication date cannot be in the future");
        return;
      }
    }

    const isStudentInvolved = form.isStudentsInvolved === "Yes";
    const isPositionGreaterThan5 = parseInt(form.userAuthorPosition) > 5;
    const isPublisherOthers = form.publisher === "Others";
    const disableIncentive = isStudentInvolved || isPositionGreaterThan5 || isPublisherOthers;
    const computedApplyIncentive = disableIncentive ? "No" : form.applyIncentive;

    if (!computedApplyIncentive) {
      toast.error("Please select whether you want to apply for an incentive");
      return;
    }

    // Check if total authors is correctly filled
    const total = parseInt(form.totalAuthors) || 1;
    if (total < 1) {
      toast.error("Total number of authors must be at least 1");
      return;
    }
    if (total > 1) {
      for (const a of form.otherAuthors) {
        if (!a.affiliationType) {
          toast.error(`Please select affiliation type for Author Position ${a.authorPosition}`);
          return;
        }
        if (a.affiliationType === 'Others' && (!a.authorName || !a.affiliationName)) {
          toast.error(`Please complete details for Author Position ${a.authorPosition}`);
          return;
        }
        if (a.affiliationType === 'Aditya University') {
          if (a.CoAuthorType === 'student') {
            if (!a.studentId || !a.authorName) {
              toast.error(`Please provide Student Roll No and Name for Author Position ${a.authorPosition}`);
              return;
            }
          } else {
            if (!a.empId || !a.authorName) {
              toast.error(`Please provide Employee ID and verify Name for Author Position ${a.authorPosition}`);
              return;
            }
          }
        }
      }
    }

    // File uploads are no longer mandatory for textbooks

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
          if (coAuth) {
            allAuthors.push({
              authorPosition: coAuth.authorPosition,
              authorName: coAuth.authorName,
              affiliationType: coAuth.affiliationType,
              employeeId: coAuth.affiliationType === "Aditya University" ? coAuth.empId : null,
              empId: coAuth.affiliationType === "Aditya University" ? coAuth.empId : null,
              affiliationName: coAuth.affiliationType === "Aditya University" ? "Aditya University" : coAuth.affiliationName
            });
          }
        }
      }

      // Calculate estimated incentive
      let estimatedIncentiveAmount = null;
      if (computedApplyIncentive === "Yes") {
        if (submissionForm.publicationScope === "National") {
          estimatedIncentiveAmount = 10000;
        } else if (submissionForm.publicationScope === "International") {
          estimatedIncentiveAmount = 20000;
        }
      }

      // Append standard fields
      fd.append("title", submissionForm.title);
      fd.append("isbn", submissionForm.isbn);
      fd.append("yearOfPublication", submissionForm.yearOfPublication);
      fd.append("totalAuthors", submissionForm.totalAuthors);
      fd.append("userAuthorPosition", submissionForm.userAuthorPosition);
      fd.append("edition", submissionForm.edition);
      fd.append("cost", submissionForm.cost);
      fd.append("currencySymbol", submissionForm.currencySymbol || "₹");
      if (submissionForm.numberOfPages) fd.append("numberOfPages", submissionForm.numberOfPages);
      if (estimatedIncentiveAmount) fd.append("estimatedIncentiveAmount", estimatedIncentiveAmount);
      fd.append("month", submissionForm.month);
      fd.append("year", submissionForm.year);
      fd.append("publicationScope", submissionForm.publicationScope);
      fd.append("publisher", submissionForm.publisher === "Others" ? submissionForm.customPublisher : submissionForm.publisher);
      fd.append("isStudentsInvolved", submissionForm.isStudentsInvolved || "No");
      fd.append("applyIncentive", computedApplyIncentive);
      fd.append("authors", JSON.stringify(allAuthors));

      fd.append("academicYear", selectedYear);
      fd.append("college", user?.college || "");

      if (files.coverPage) fd.append("coverPage", files.coverPage);
      if (files.authorAffiliation) fd.append("authorAffiliation", files.authorAffiliation);
      if (files.index) fd.append("index", files.index);

      if (deleteFlags.coverPage) fd.append("deleteCoverPage", "true");
      if (deleteFlags.authorAffiliation) fd.append("deleteAuthorAffiliation", "true");
      if (deleteFlags.index) fd.append("deleteIndex", "true");

      if (editingId) {
        await API.put(`/api/research/textbook/${editingId}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success("Textbook resubmitted successfully!");
      } else {
        await API.post("/api/research/textbook", fd, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success("Textbook submitted successfully!");
      }

      // Reset form
      setForm({ title: "", publisher: "", isbn: "", yearOfPublication: "", totalAuthors: 1, userAuthorPosition: 1, edition: "", cost: "", month: "", year: "", isStudentsInvolved: "No", applyIncentive: "", otherAuthors: [], publicationScope: "National", currencySymbol: "₹" });
      setFiles({ coverPage: null, authorAffiliation: null, index: null });
      setExistingFiles({ coverPage: null, authorAffiliation: null, index: null });
      setDeleteFlags({ coverPage: false, authorAffiliation: false, index: false });
      setEditingId(null);
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
      <Box sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        justifyContent: "space-between",
        alignItems: "center",
        gap: { xs: 2, sm: 0 },
        mb: 3
      }}>
        <Typography variant="h6" sx={{ color: "var(--text-primary)", fontWeight: 800, textAlign: { xs: "center", sm: "left" } }}>My Textbook Publications</Typography>
        <Button
          variant="contained"
          onClick={() => {
            const activeYear = academicYears.length > 0;
            if (activeYear) {
              setSelectedYear("");
              setViewMode("select-year");
            } else {
              setNoActiveYearAlertOpen(true);
            }
          }}
          sx={{
            background: "var(--gradient-primary)",
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
      {(!publicationsList || publicationsList.length === 0) ? (
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
            No Previous Textbooks
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 3, maxWidth: "400px" }}>
            You haven't submitted any textbook details yet. Click the "Apply New" button to submit your first entry.
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-premium)", overflowX: "auto" }}>
          <Table sx={{ minWidth: 1100 }}>
            <TableHead sx={{ background: "var(--gradient-primary)" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>ISBN</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Applicant</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Author / Co-Author</TableCell>

                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Status / Remarks</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {publicationsList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((pub, i) => (
                <TableRow key={pub._id || i} sx={{ "&:hover": { background: "rgba(var(--color-primary-rgb, 99,102,241), 0.04)", transition: "background 0.2s" } }}>
                  <TableCell sx={{ color: "var(--text-primary)", fontWeight: 500, py: 2 }}>{pub.title || "N/A"}</TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>{pub.isbn || "N/A"}</TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {pub.facultyId?.name || "N/A"}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {pub.authors && pub.authors.length > 0 ? pub.authors.map(a => a.authorName).filter(Boolean).join(", ") : "N/A"}
                    </Typography>
                  </TableCell>

                  <TableCell sx={{ py: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: pub.visibilityRole === "Applicant" ? "var(--color-primary)" : "text.secondary" }}>
                      {pub.visibilityRole || "Applicant"}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                      <Chip
                        icon={
                          pub.status === 'Approved' ? <CheckCircle style={{ fontSize: 16 }} /> :
                            pub.status?.includes('Rejected') ? <Cancel style={{ fontSize: 16 }} /> :
                              <AccessTime style={{ fontSize: 16 }} />
                        }
                        label={pub.status || "Pending"}
                        size="small"
                        sx={{
                          color: pub.status?.includes('Rejected') ? "#ef4444" : pub.status === 'Approved' ? "#10b981" : "#e8a000",
                          fontWeight: 700,
                          background: pub.status?.includes('Rejected') ? "rgba(239, 68, 68, 0.1)" : pub.status === 'Approved' ? "rgba(16, 185, 129, 0.1)" : "rgba(232, 160, 0, 0.1)",
                          border: `1px solid ${pub.status?.includes('Rejected') ? "rgba(239, 68, 68, 0.3)" : pub.status === 'Approved' ? "rgba(16, 185, 129, 0.3)" : "rgba(232, 160, 0, 0.3)"}`,
                          width: "fit-content",
                          "& .MuiChip-icon": {
                            color: "inherit"
                          }
                        }}
                      />
                      {pub.status?.includes('Rejected') && (pub.rndComment || pub.hodComment) && (
                        <Tooltip title={pub.rndComment || pub.hodComment} arrow placement="top">
                          <Typography
                            variant="caption"
                            sx={{
                              color: "#ef4444",
                              fontStyle: "italic",
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                              cursor: "pointer",
                              maxWidth: 220,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis"
                            }}
                          >
                            <span>💬</span> "{pub.rndComment || pub.hodComment}"
                          </Typography>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="View Details" arrow>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDetails(pub)}
                          sx={{
                            color: "var(--color-primary)",
                            "&:hover": { background: "var(--bg-accent-1)", transform: "scale(1.1)" },
                            transition: "all 0.2s ease"
                          }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {pub.status?.includes('Rejected') && (
                        <Tooltip title="Edit & Resubmit" arrow>
                          <IconButton
                            size="small"
                            onClick={() => handleEditClick(pub)}
                            sx={{
                              color: "#ef4444",
                              "&:hover": { background: "rgba(239, 68, 68, 0.1)", transform: "scale(1.1)" },
                              transition: "all 0.2s ease"
                            }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={publicationsList.length}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[5, 10, 25]}
            sx={{ borderTop: "1px solid var(--border-color)", color: "var(--text-secondary)" }}
          />
        </TableContainer>
      )}
    </Box>
  );

  const renderSelectYear = () => {
    const activeYearDoc = academicYears.find(y => y.active) || academicYears[0];
    let priorYearStr = "";
    if (activeYearDoc && activeYearDoc.year) {
      const parts = activeYearDoc.year.split('-');
      if (parts.length === 2) {
        priorYearStr = `${parseInt(parts[0], 10) - 1}-${parseInt(parts[1], 10) - 1}`;
      }
    }

    // Only show Active and Prior year
    let filteredYears = academicYears.filter(y => y._id === activeYearDoc?._id || y.year === priorYearStr);

    // Ensure active is first
    filteredYears.sort((a, b) => {
      if (a._id === activeYearDoc?._id) return -1;
      if (b._id === activeYearDoc?._id) return 1;
      return 0;
    });

    return (
      <Box sx={{ maxWidth: 500, mx: "auto", mt: 5 }}>
        <FormCard title="Select Academic Year">
          <Typography sx={{ mb: 2, color: "var(--text-secondary)", fontWeight: 500 }}>Please select the academic year for this publication submission:</Typography>
          <Select
            fullWidth
            size="small"
            displayEmpty
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            MenuProps={{ disableScrollLock: true, disableRestoreFocus: true }}
          >
            <MenuItem value="" disabled>Select Academic Year</MenuItem>
            {filteredYears.map(y => (
              <MenuItem key={y._id} value={y._id}>{y.year}</MenuItem>
            ))}
          </Select>
          <Box sx={{ display: "flex", gap: 2, mt: 4, justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              onClick={() => setViewMode("list")}
              sx={{
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
  };

  const renderForm = () => (
    <FormCard title="Text book Submission">
      <Box sx={{ mb: 3, display: "flex", alignItems: "center" }}>
        <Typography variant="body2" sx={{ background: "var(--bg-accent-1)", color: "var(--color-primary)", px: 2, py: 0.8, borderRadius: "8px", fontWeight: 700, border: "1px solid var(--border-color)" }}>
          Academic Year: {academicYears.find(y => y._id === selectedYear)?.year || "Selected"}
        </Typography>
      </Box>

      <FacultyInfoRow />

      <SubLabel text="Details of the Text Book:" />
      <Grid2>
        <Box>
          <Typography sx={labelStyle}>Publication Scope :</Typography>
          <Select
            fullWidth
            size="small"
            value={form.publicationScope}
            onChange={(e) => {
              const val = e.target.value;
              setForm(prev => ({
                ...prev,
                publisher: "",
                publicationScope: val,
                customPublisher: "",
                currencySymbol: val === "National" ? "₹" : "$"
              }));
            }}
            MenuProps={{ disableScrollLock: true, disableRestoreFocus: true }}
          >
            <MenuItem value="National">National</MenuItem>
            <MenuItem value="International">International</MenuItem>
          </Select>
        </Box>
        <Box>
          <Typography sx={labelStyle}>ISBN NO : *</Typography>
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
              sx={{ minWidth: "100px", textTransform: "none", background: "var(--color-primary)" }}
            >
              {isbnFetching ? <Loader size={20} color="inherit" /> : "Fetch"}
            </Button>
          </Box>
        </Box>
        <Box>
          <Typography sx={labelStyle}>Title of the Text Book :</Typography>
          <TextField size="small" fullWidth value={form.title} onChange={set("title")} slotProps={{ htmlInput: { maxLength: 200 } }} disabled={isbnFetchedFields.title} sx={isbnFetchedFields.title ? disabledField : {}} />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Name of the Publisher :</Typography>
          <Autocomplete
            disabled={isbnFetchedFields.publisher}
            options={[...publishers.filter(p => p.type === form.publicationScope), { name: "Others", type: form.publicationScope }]}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.name === value?.name}
            value={publishers.find(p => p.name === form.publisher) || (form.publisher === "Others" ? { name: "Others", type: form.publicationScope } : (form.publisher ? { name: form.publisher, type: form.publicationScope || "Unknown" } : null))}
            onChange={(e, newValue) => {
              const val = newValue ? newValue.name : "";
              setForm(p => ({ ...p, publisher: val }));
            }}
            freeSolo
            onInputChange={(e, newInputValue) => {
              if (e?.type === "change") {
                setForm(p => ({ ...p, publisher: newInputValue }));
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                placeholder="Select or search publisher"
                disabled={isbnFetchedFields.publisher}
                sx={isbnFetchedFields.publisher ? disabledField : {}}
              />
            )}
          />
        </Box>
        {form.publisher === "Others" && (
          <Box>
            <Typography sx={labelStyle}>Specify Publisher : *</Typography>
            <TextField
              size="small"
              fullWidth
              placeholder="Enter Publisher Name"
              value={form.customPublisher}
              onChange={(e) => setForm(p => ({ ...p, customPublisher: e.target.value }))}
            />
          </Box>
        )}
        <Box>
          <Typography sx={labelStyle}>Edition :</Typography>
          <TextField
            fullWidth
            size="small"
            type="number"
            placeholder="Enter Edition"
            value={form.edition}
            onChange={(e) => setForm(p => ({ ...p, edition: e.target.value }))}
          />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Scopus Indexed :</Typography>
          <Select
            fullWidth
            size="small"
            value={form.scopusIndexed || "No"}
            onChange={(e) => setForm(p => ({ ...p, scopusIndexed: e.target.value }))}
            MenuProps={{ disableScrollLock: true, disableRestoreFocus: true }}
          >
            <MenuItem value="Yes">Yes</MenuItem>
            <MenuItem value="No">No</MenuItem>
          </Select>
        </Box>
        <Box>
          <Typography sx={labelStyle}>Cost:</Typography>
          <Box sx={{
            display: "flex",
            alignItems: "center",
            border: "1px solid var(--border-color)",
            borderRadius: "8px",
            height: "40px",
            background: "var(--bg-glass)",
            transition: "all 0.2s ease",
            "&:focus-within": { borderColor: "var(--color-primary)", boxShadow: "0 0 0 1px var(--color-primary)" }
          }}>
            {/* Left Side: Currency Indicator */}
            <Box sx={{
              display: "flex",
              alignItems: "center",
              px: 2,
              borderRight: "1px solid var(--border-color)",
              height: "100%",
              background: "var(--bg-accent-1)",
              borderTopLeftRadius: "8px",
              borderBottomLeftRadius: "8px"
            }}>
              <Typography sx={{ color: "var(--color-primary)", fontWeight: 500, fontSize: 16 }}>
                {form.currencySymbol}
              </Typography>
            </Box>

            {/* Center: Input Field */}
            <input
              value={form.cost}
              onChange={handleNumericChange("cost")}
              placeholder="0.00"
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                padding: "0 16px",
                background: "transparent",
                fontSize: "14px",
                color: "var(--text-primary)",
                fontWeight: 500,
                width: "100%"
              }}
            />

            {/* Right Side: Toggle Switch */}
            <Box sx={{ display: "flex", alignItems: "center", pr: 0.5 }}>
              <Box sx={{ display: "flex", border: "1px solid var(--border-color)", borderRadius: "6px", overflow: "hidden", background: "var(--bg-panel)" }}>
                <Box
                  onClick={() => setForm(p => ({ ...p, currencySymbol: "₹" }))}
                  sx={{
                    px: 1.5, py: 0.5, cursor: "pointer",
                    background: form.currencySymbol === "₹" ? "var(--color-primary)" : "transparent",
                    color: form.currencySymbol === "₹" ? "#fff" : "var(--text-secondary)",
                    fontWeight: 500, fontSize: 16, transition: "all 0.2s ease",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                  ₹
                </Box>
                <Box
                  onClick={() => setForm(p => ({ ...p, currencySymbol: "$" }))}
                  sx={{
                    px: 1.5, py: 0.5, cursor: "pointer",
                    background: form.currencySymbol === "$" ? "var(--color-primary)" : "transparent",
                    color: form.currencySymbol === "$" ? "#fff" : "var(--text-secondary)",
                    fontWeight: 500, fontSize: 16, transition: "all 0.2s ease",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                  $
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
        <Box>
          <Typography sx={labelStyle}>Number of Pages :</Typography>
          <TextField
            size="small"
            fullWidth
            type="number"
            value={form.numberOfPages}
            onChange={set("numberOfPages")}
            slotProps={{ htmlInput: { min: 1 } }}
            placeholder="e.g. 250"
          />
        </Box>

        {/* Authors Section */}
        <Box sx={{ gridColumn: { sm: "1 / -1" }, background: "var(--bg-panel)", p: 2, borderRadius: "12px", border: "1px solid var(--border-color)", mt: 2 }}>
          <Typography sx={{ fontWeight: 700, color: "var(--text-primary)", mb: 2 }}>Author Details</Typography>
          <Grid2>
            <Box sx={{ gridColumn: { sm: "1 / -1" }, mb: 1, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
              <Typography sx={{ ...labelStyle, mb: 0 }}>Are students involved in this work as co-authors? *</Typography>
              <RadioGroup row value={form.isStudentsInvolved || "No"} onChange={handleStudentsInvolvedChange}>
                <FormControlLabel value="Yes" control={<Radio size="small" sx={{ color: "var(--color-primary)", "&.Mui-checked": { color: "var(--color-primary)" } }} />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Yes</Typography>} />
                <FormControlLabel value="No" control={<Radio size="small" sx={{ color: "var(--color-primary)", "&.Mui-checked": { color: "var(--color-primary)" } }} />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>No</Typography>} />
              </RadioGroup>
            </Box>
            <Box>
              <Typography sx={labelStyle}>Total Number of Authors :</Typography>
              <TextField
                size="small"
                fullWidth
                type="number"
                value={form.totalAuthors}
                onChange={set("totalAuthors")}
                slotProps={{ htmlInput: { min: 1 } }}
              />
            </Box>
            {parseInt(form.totalAuthors) > 1 && (
              <Box>
                <Typography sx={labelStyle}>Applicant Author Position :</Typography>
                <Select size="small" fullWidth value={form.userAuthorPosition} onChange={set("userAuthorPosition")} MenuProps={{ disableScrollLock: true, disableRestoreFocus: true }}>
                  {Array.from({ length: parseInt(form.totalAuthors) || 1 }, (_, i) => (
                    <MenuItem key={i + 1} value={i + 1}>{i + 1}</MenuItem>
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
                    {/* Co-Author Type (if students are involved) */}
                    {form.isStudentsInvolved === "Yes" && (
                      <Box sx={{ flex: 1, minWidth: { xs: "100%", sm: "130px" } }}>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>CO-AUTHOR TYPE</Typography>
                        <Select
                          size="small"
                          fullWidth
                          displayEmpty
                          value={ca.CoAuthorType || "faculty"}
                          onChange={(e) => handleCoAuthorChange(ca.authorPosition, "CoAuthorType", e.target.value)}
                          MenuProps={{ disableScrollLock: true, disableRestoreFocus: true }}
                        >
                          <MenuItem value="faculty">Faculty</MenuItem>
                          <MenuItem value="student">Student</MenuItem>
                        </Select>
                      </Box>
                    )}

                    <Box sx={{ flex: 1, minWidth: "150px" }}>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>AFFILIATION TYPE</Typography>
                      <Select
                        size="small"
                        fullWidth
                        value={ca.CoAuthorType === "student" ? "Aditya University" : ca.affiliationType}
                        onChange={(e) => handleCoAuthorChange(ca.authorPosition, "affiliationType", e.target.value)}
                        displayEmpty
                        MenuProps={{ disableScrollLock: true, disableRestoreFocus: true }}
                      >
                        <MenuItem value="" disabled>Select Affiliation</MenuItem>
                        <MenuItem value="Aditya University">Aditya University</MenuItem>
                        {ca.CoAuthorType !== "student" && (
                          <MenuItem value="Others">Others</MenuItem>
                        )}
                      </Select>
                    </Box>

                    {ca.affiliationType === "Aditya University" ? (
                      ca.CoAuthorType === "student" ? (
                        <>
                          <Box sx={{ flex: 1, minWidth: { xs: "100%", sm: "120px" } }}>
                            <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>STUDENT ROLL NO</Typography>
                            <TextField
                              size="small"
                              fullWidth
                              value={ca.studentId || ""}
                              onChange={(e) => handleCoAuthorChange(ca.authorPosition, "studentId", e.target.value)}
                              placeholder="e.g. 21A91A0501"
                            />
                          </Box>
                          <Box sx={{ flex: 2, minWidth: { xs: "100%", sm: "200px" } }}>
                            <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>CO-AUTHOR NAME</Typography>
                            <TextField
                              size="small"
                              fullWidth
                              value={ca.authorName}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (!/\d/.test(val)) handleCoAuthorChange(ca.authorPosition, "authorName", val);
                              }}
                              placeholder="Student Name"
                            />
                          </Box>
                        </>
                      ) : (
                        <>
                          <Box sx={{ flex: 1, minWidth: "120px" }}>
                            <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>EMPLOYEE ID</Typography>
                            <TextField
                              size="small"
                              fullWidth
                              value={ca.empId}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (/^\d*$/.test(val)) handleCoAuthorChange(ca.authorPosition, "empId", val);
                              }}
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
                      )
                    ) : (
                      <>
                        <Box sx={{ flex: 1, minWidth: "180px" }}>
                          <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>CO-AUTHOR NAME</Typography>
                          <TextField
                            size="small"
                            fullWidth
                            value={ca.authorName}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (!/\d/.test(val)) handleCoAuthorChange(ca.authorPosition, "authorName", val);
                            }}
                            placeholder="Full Name"
                          />
                        </Box>
                        <Box sx={{ flex: 2, minWidth: "200px" }}>
                          <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>AFFILIATION</Typography>
                          <TextField
                            size="small"
                            fullWidth
                            value={ca.affiliationName}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (!/\d/.test(val)) handleCoAuthorChange(ca.authorPosition, "affiliationName", val);
                            }}
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
          <Typography sx={labelStyle}>Year: *</Typography>
          <Select size="small" fullWidth displayEmpty value={form.year} onChange={(e) => {
            setForm(p => ({ ...p, year: e.target.value, month: "" }));
          }} MenuProps={{ disableScrollLock: true, disableRestoreFocus: true }}>
            <MenuItem value="">Select Year</MenuItem>
            {(form.year && !YEARS.includes(String(form.year))
              ? [...YEARS, String(form.year)].sort((a, b) => Number(b) - Number(a))
              : YEARS
            ).map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
          {isbnFetched && !form.year && (
            <Typography variant="caption" sx={{ color: "#e8a000", fontWeight: 600, mt: 0.5, display: "block" }}>
              ⚠ Year not found from ISBN — please select manually
            </Typography>
          )}
        </Box>
        {form.year ? (
          <Box>
            <Typography sx={labelStyle}>Month: *</Typography>
            <Select size="small" fullWidth displayEmpty value={form.month} onChange={set("month")} disabled={!form.year} MenuProps={{ disableScrollLock: true, disableRestoreFocus: true }}>
              <MenuItem value="">Select Month</MenuItem>
              {getAvailableMonths().map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </Select>
            {isbnFetched && !form.month && (
              <Typography variant="caption" sx={{ color: "#e8a000", fontWeight: 600, mt: 0.5, display: "block" }}>
                ⚠ Month not found from ISBN — please select manually
              </Typography>
            )}
          </Box>
        ) : (
          <Box />
        )}
      </Grid2>

      <Box sx={{ mt: 3, p: 2, bgcolor: "rgba(232, 160, 0, 0.1)", border: "1px dashed rgba(232, 160, 0, 0.5)", borderRadius: "12px", maxWidth: { xs: "100%", md: "calc(50% - 12px)" } }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: "#b37b00" }}>
          Note: Please submit a hard copy of the textbook to the Dean R&C office.
        </Typography>
      </Box>

      <Box sx={{ mt: 3, maxWidth: { xs: "100%", md: "calc(50% - 12px)" } }}>
        {(() => {
          const isStudentInvolved = form.isStudentsInvolved === "Yes";
          const isPositionGreaterThan5 = parseInt(form.userAuthorPosition) > 5;
          const isPublisherOthers = form.publisher === "Others";
          const disableIncentive = isStudentInvolved || isPositionGreaterThan5 || isPublisherOthers;
          const currentApplyIncentive = disableIncentive ? "No" : form.applyIncentive;

          let estIncentive = "-";
          if (currentApplyIncentive === "Yes") {
            const pubObj = publishers.find(p => p.name === form.publisher);
            if (pubObj && pubObj.type) {
              if (pubObj.type.toLowerCase() === "national") {
                estIncentive = "₹10,000";
              } else if (pubObj.type.toLowerCase() === "international") {
                estIncentive = "₹20,000";
              } else {
                estIncentive = "Research committee decision";
              }
            } else {
              estIncentive = "Research committee decision";
            }
          } else if (currentApplyIncentive === "No") {
            estIncentive = "₹0";
          }

          return (
            <>
              <Typography sx={labelStyle}>Whether you want to apply for incentive?</Typography>
              <Select size="small" fullWidth displayEmpty value={currentApplyIncentive} onChange={set("applyIncentive")} disabled={disableIncentive} MenuProps={{ disableScrollLock: true, disableRestoreFocus: true }}>
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="Yes">Yes</MenuItem>
                <MenuItem value="No">No</MenuItem>
              </Select>
              {isPositionGreaterThan5 && (
                <Typography variant="caption" sx={{ color: "#ef4444", fontWeight: 600, mt: 0.5, display: "block" }}>
                  * Application for incentive is only for the first 5 author positions.
                </Typography>
              )}
              {isPublisherOthers && !isPositionGreaterThan5 && (
                <Typography variant="caption" sx={{ color: "#ef4444", fontWeight: 600, mt: 0.5, display: "block" }}>
                  * Incentive is not applicable for custom publishers.
                </Typography>
              )}
              {currentApplyIncentive === "Yes" && (
                <Box sx={{
                  gridColumn: { sm: "1 / -1" },
                  p: 2.5,
                  borderRadius: "12px",
                  bgcolor: estIncentive !== "Research committee decision" ? "rgba(16, 185, 129, 0.06)" : "rgba(239, 68, 68, 0.05)",
                  border: `1.5px dashed ${estIncentive !== "Research committee decision" ? "rgba(16, 185, 129, 0.4)" : "rgba(239, 68, 68, 0.3)"}`,
                  mt: 2
                }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
                    <Box>
                      <Typography sx={{ fontSize: "0.8rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: estIncentive !== "Research committee decision" ? "#059669" : "#dc2626" }}>
                        Estimated Research Incentive Amount
                      </Typography>
                      <Typography sx={{ fontSize: estIncentive !== "Research committee decision" ? "1.6rem" : "0.95rem", fontWeight: estIncentive !== "Research committee decision" ? 800 : 700, color: estIncentive !== "Research committee decision" ? "#047857" : "#dc2626", mt: 0.5 }}>
                        {estIncentive !== "Research committee decision" ? estIncentive : "⚠️ " + estIncentive}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}
            </>
          );
        })()}
      </Box>

      <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 4 }}>
        <Button
          variant="outlined"
          onClick={() => setViewMode("list")}
          sx={{
            px: 4,
            height: "44px",

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

  const handleOpenDetails = async (pub) => {
    setSelectedPubDetails(pub);
    try {
      const ayId = pub.academicYear?._id || pub.academicYear;
      if (ayId) {
        const res = await API.get(`/api/appraisal/config/${ayId}`);
        setAppraisalConfigActive(res.data?.data?.isActive || res.data?.data?.status === 'On');
      }
    } catch (err) {
      console.error("Failed to fetch appraisal config", err);
      setAppraisalConfigActive(false);
    }
  };

  const handleCloseDetails = () => setSelectedPubDetails(null);

  const handleResolveClaim = async (researchId, researchType, claimantId) => {
    try {
      const res = await API.post("/api/appraisal/resolve-claim", {
        researchId,
        researchType,
        claimantId
      });
      if (res.data.success) {
        setSelectedPubDetails(prev => ({ ...prev, appraisalClaimant: claimantId }));
        API.get("/api/research/textbook").then(r => setPublicationsList(r.data?.data || r.data || [])).catch(() => { });
        toast.success("Appraisal claimant successfully updated!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resolve claim");
    }
  };

  const LabelValueDetails = ({ label, value, chip, horizontal = false }) => (
    <Box sx={{
      p: 2,
      borderRadius: "16px",
      background: horizontal ? "transparent" : "linear-gradient(145deg, var(--bg-paper) 0%, var(--bg-panel) 100%)",
      border: horizontal ? "none" : "1px solid var(--border-color)",
      borderBottom: horizontal ? "1px solid var(--border-color)" : "1px solid var(--border-color)",
      display: "flex",
      flexDirection: horizontal ? "row" : "column",
      alignItems: horizontal ? "center" : "flex-start",
      justifyContent: horizontal ? "flex-start" : "center",
      gap: horizontal ? 2 : 1,
      height: "100%",
      boxShadow: horizontal ? "none" : "0 4px 20px rgba(0,0,0,0.03)",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      "&:hover": horizontal ? {} : {
        borderColor: "var(--color-primary)",
        transform: "translateY(-2px)",
        boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
      },
      "&:last-child": horizontal ? { borderBottom: "none" } : {},
    }}>
      <Typography variant="caption" sx={{ color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, fontSize: "0.65rem", display: "flex", alignItems: "center", gap: 1 }}>
        <Box component="span" sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "var(--color-primary)", opacity: 0.8 }} />
        {label}
      </Typography>
      <Box sx={{ flex: horizontal ? 1 : "none", display: "flex", alignItems: "center", mt: horizontal ? 0 : 0.5, ml: horizontal ? 0 : 1.5 }}>
        {chip ? chip : <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.95rem", wordBreak: "break-word", lineHeight: 1.4 }}>{value || "-"}</Typography>}
      </Box>
    </Box>
  );

  const renderDetailFile = (title, filepath, folder = "textbooks") => {
    if (!filepath) return null;
    const backendURL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "");
    let normalizedPath = filepath.replace(/\\/g, '/');
    if (!normalizedPath.startsWith('http') && !normalizedPath.includes('uploads/')) {
      normalizedPath = `/uploads/${folder}/${normalizedPath.startsWith('/') ? normalizedPath.substring(1) : normalizedPath}`;
    }
    const cleanPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
    const fileUrl = normalizedPath.startsWith('http') ? normalizedPath : `${backendURL}${cleanPath}`;
    const isImage = /\.(jpg|jpeg|png|gif)$/i.test(normalizedPath);

    return (
      <Box sx={{ flex: "1 1 200px" }}>
        <Typography variant="caption" sx={{ fontWeight: 800, color: "var(--color-primary)", fontSize: "0.7rem", textTransform: "uppercase", display: "block", mb: 1 }}>{title}</Typography>
        <Box sx={{
          height: 120, display: "flex", alignItems: "center", justifyContent: "center",
          border: "1px solid var(--border-color)", background: "var(--bg-panel)", borderRadius: "8px",
          overflow: "hidden", cursor: "pointer", transition: "all 0.2s ease",
          "&:hover": { borderColor: "var(--color-primary)", transform: "translateY(-2px)" }
        }} onClick={() => window.open(fileUrl, '_blank')}>
          {isImage ? <img src={fileUrl} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Box sx={{ textAlign: "center" }}><Description sx={{ fontSize: 24, color: "var(--text-secondary)", mb: 0.5 }} /><Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 700, display: "block" }}>PDF</Typography></Box>}
        </Box>
      </Box>
    );
  };

  const renderDetailsDialog = () => {
    if (!selectedPubDetails) return null;
    const data = selectedPubDetails;

    return (
      <Dialog
        open={!!selectedPubDetails}
        onClose={handleCloseDetails}
        maxWidth="lg"
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            maxWidth: { xs: "95vw", sm: "90vw", md: "85vw", lg: "1150px" },
            borderRadius: "20px",
            background: "var(--bg-paper)",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-premium)",
          }
        }}
        slotProps={{
          backdrop: {
            sx: {
              backdropFilter: "blur(4px)",
              backgroundColor: "rgba(0, 0, 0, 0.4)",
            }
          }
        }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--gradient-primary)", color: "#fff", py: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <MenuBook sx={{ color: "#fff" }} />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Text Book Details</Typography>
          </Box>
          <IconButton onClick={handleCloseDetails} sx={{ color: "#fff" }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 1 }}>
          {/* Top Banner Header */}
          <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: "16px", border: "1px solid var(--border-color)", background: "var(--bg-panel)" }}>
            <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                <Box sx={{
                  width: 48, height: 48, borderRadius: "12px", bgcolor: "rgba(0, 78, 146, 0.08)",
                  color: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center",
                  border: "1px solid rgba(0, 78, 146, 0.15)", flexShrink: 0, mt: 0.5
                }}>
                  <MenuBook sx={{ fontSize: 26 }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.3 }}>
                    {data.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 600, mt: 0.5 }}>
                    Publisher: {data.publisher}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0, flexWrap: "wrap" }}>
                {(data.entryType === 'Admin' || data.isDirectEntry === 'true' || data.isDirectEntry === true) && (
                  <Chip
                    label="R&D Direct Entry"
                    sx={{
                      bgcolor: "rgba(124, 58, 237, 0.1)",
                      color: "#7c3aed",
                      border: "1px solid rgba(124, 58, 237, 0.3)",
                      fontWeight: 700,
                      borderRadius: "20px",
                      px: 1,
                      py: 0.5
                    }}
                  />
                )}
                <Chip
                  icon={
                    /approved/i.test(data.status)
                      ? <CheckCircleOutline sx={{ fontSize: "16px !important", color: "inherit" }} />
                      : /reject/i.test(data.status)
                        ? <Close sx={{ fontSize: "16px !important", color: "inherit" }} />
                        : <AccessTime sx={{ fontSize: "16px !important", color: "inherit" }} />
                  }
                  label={data.status || "Pending at R&D"}
                  sx={{
                    bgcolor: /approved/i.test(data.status) ? "rgba(46, 125, 50, 0.1)" : /reject/i.test(data.status) ? "rgba(211, 47, 47, 0.1)" : "rgba(237, 108, 2, 0.1)",
                    color: /approved/i.test(data.status) ? "#2e7d32" : /reject/i.test(data.status) ? "#d32f2f" : "#ed6c02",
                    border: `1px solid ${/approved/i.test(data.status) ? "rgba(46, 125, 50, 0.3)" : /reject/i.test(data.status) ? "rgba(211, 47, 47, 0.3)" : "rgba(237, 108, 2, 0.3)"}`,
                    fontWeight: 700,
                    borderRadius: "20px",
                    px: 1,
                    py: 0.5
                  }}
                />
              </Box>
            </Box>
          </Paper>

          {/* Main Layout Grid */}
          <Box sx={{
            display: "grid",
            gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1.3fr) minmax(0, 0.9fr)" },
            gap: 3,
            mb: 3,
            width: "100%",
            alignItems: "flex-start"
          }}>
            {/* Left Column (Publication Details List) */}
            <Box sx={{ minWidth: 0 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 0,
                  overflow: "hidden",
                  borderRadius: "16px",
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-paper)",
                  display: "flex",
                  flexDirection: "column"
                }}
              >
                <Box sx={{ p: 3, pb: 2, borderBottom: "1px solid var(--border-color)" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                    <FormatListBulleted sx={{ color: "var(--color-primary)" }} />
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                      Publication Details
                    </Typography>
                  </Box>
                  <Box sx={{ width: 140, height: 3, bgcolor: "var(--color-primary)", borderRadius: "3px" }} />
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column" }}>
                  {[
                    { label: "Academic Year", value: data.academicYear?.year || data.academicYear || "N/A", icon: <School sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                    { label: "ISBN", value: data.isbn || "N/A", icon: <Article sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                    { label: "Publication Scope", value: data.publicationScope || "National", icon: <Public sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                    { label: "Edition", value: data.edition || "-", icon: <Numbers sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                    { label: "Scopus Indexed", value: data.scopusIndexed || "No", icon: <ShowChart sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                    { label: "Cost", value: data.cost ? `${data.currencySymbol || '₹'} ${data.cost}` : "-", icon: <CurrencyRupee sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                    { label: "No. of Pages", value: data.numberOfPages || "-", icon: <Description sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                    { label: "Published Month", value: data.month || "-", icon: <CalendarMonth sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                    { label: "Published Year", value: data.year || "-", icon: <CalendarMonth sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                    {
                      label: "Applicant Author Position",
                      chip: (
                        (() => {
                          const pos = data.userAuthorPosition || 1;
                          const total = data.totalAuthors || (data.authors ? data.authors.length : 1);
                          return (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: 32, height: 32, borderRadius: '50%',
                                bgcolor: 'rgba(190, 147, 55, 0.15)', border: '2px solid var(--color-primary)',
                                color: 'var(--color-primary)', fontWeight: 900, fontSize: '0.9rem'
                              }}>
                                {pos}
                              </Box>
                              {total && (
                                <>
                                  <Typography sx={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.85rem' }}>of</Typography>
                                  <Box sx={{
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    px: 1.2, height: 28, borderRadius: '8px',
                                    bgcolor: 'var(--bg-panel)', border: '1px solid var(--border-color)',
                                    color: 'var(--text-primary)', fontWeight: 900, fontSize: '0.85rem'
                                  }}>
                                    {total} Authors
                                  </Box>
                                </>
                              )}
                            </Box>
                          );
                        })()
                      ),
                      icon: <PersonOutline sx={{ fontSize: 18, color: "var(--text-secondary)" }} />
                    },
                    { label: "Students Involved", value: data.isStudentsInvolved || "No", icon: <Groups sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                    { label: "Seed Grant Work", value: data.applyingSeedGrant === "Yes" ? "Yes" : "No", icon: <GrassIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                    { label: "Apply For Incentive", value: data.applyIncentive === "Yes" ? "Yes" : "No", icon: <CardGiftcard sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                    { label: "Approved Incentive Amount", value: data.approvedAmount ? `₹${data.approvedAmount}` : "-", icon: <CurrencyRupee sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> }
                  ].map((item, idx, arr) => (
                    <Box
                      key={idx}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        px: 3,
                        py: 1.6,
                        borderBottom: idx === arr.length - 1 ? "none" : "1px solid var(--border-color)",
                        "&:hover": { bgcolor: "rgba(0,0,0,0.015)" },
                        transition: "background 0.2s"
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        {item.icon}
                        <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.875rem" }}>
                          {item.label}
                        </Typography>
                      </Box>
                      {item.chip ? item.chip : (
                        <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--text-primary)", textAlign: "right", maxWidth: "55%", wordBreak: "break-word" }}>
                          {item.value}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Box>

            {/* Right Column — single unified panel */}
            <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: "16px",
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-paper)",
                  overflow: "hidden"
                }}
              >
                {/* === Appraisal & Role Section Header === */}
                <Box sx={{ px: 3, py: 1.8, display: "flex", alignItems: "center", gap: 1.5, background: "var(--bg-panel)", borderBottom: "1px solid var(--border-color)" }}>
                  <CheckCircleOutline sx={{ color: "var(--color-primary)", fontSize: 18 }} />
                  <Typography sx={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.9rem" }}>Appraisal & Role</Typography>
                </Box>

                {/* Row: Role */}
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 1.7, borderBottom: "1px solid var(--border-color)", "&:hover": { bgcolor: "rgba(0,0,0,0.012)" }, transition: "background 0.2s" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Person sx={{ color: "var(--text-secondary)", fontSize: 17 }} />
                    <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.84rem" }}>Role / Designation</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>{data.visibilityRole || "Applicant"}</Typography>
                </Box>

                {/* Row: Eligibility */}
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 1.7, borderBottom: "1px solid var(--border-color)", "&:hover": { bgcolor: "rgba(0,0,0,0.012)" }, transition: "background 0.2s" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <CheckCircleOutline sx={{ color: "var(--text-secondary)", fontSize: 17 }} />
                    <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.84rem" }}>Appraisal Eligibility</Typography>
                  </Box>
                  {data.status === "Approved" ? (
                    <Chip
                      label={data.appraisalEligible || "Yes"}
                      size="small"
                      sx={{
                        height: 22, fontWeight: 800, fontSize: "0.72rem", borderRadius: "8px",
                        bgcolor: (data.appraisalEligible === "No") ? "rgba(211,47,47,0.1)" : "rgba(46,125,50,0.1)",
                        color: (data.appraisalEligible === "No") ? "#d32f2f" : "#2e7d32",
                        border: `1px solid ${(data.appraisalEligible === "No") ? "rgba(211,47,47,0.3)" : "rgba(46,125,50,0.3)"}`
                      }}
                    />
                  ) : (
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-secondary)", fontStyle: "italic", fontSize: "0.82rem" }}>Not yet decided</Typography>
                  )}
                </Box>

                {/* Row: Claimant */}
                <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", px: 3, py: 1.7, borderBottom: "2px solid var(--border-color)", "&:hover": { bgcolor: "rgba(0,0,0,0.012)" }, transition: "background 0.2s" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 0.4 }}>
                    <Person sx={{ color: "var(--text-secondary)", fontSize: 17 }} />
                    <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.84rem" }}>Appraisal Claimant</Typography>
                  </Box>
                  <Box sx={{ textAlign: "right", maxWidth: "58%" }}>
                    {(() => {
                      const isApplicant = data.visibilityRole === "Applicant" || (data.facultyId && (data.facultyId === user?.userId || data.facultyId._id === user?.userId));
                      const eligibleClaimants = [
                        { _id: data.facultyId?._id, name: data.facultyId?.name, institutionId: data.facultyId?.institutionId },
                        ...((data.authors || []).filter(a => a.employeeId).map(a => ({
                          _id: a.employeeId?._id || a.employeeId,
                          name: a.employeeId?.name || a.authorName,
                          institutionId: a.employeeId?.institutionId || a.employeeId || ""
                        })))
                      ];
                      const uniqueClaimants = eligibleClaimants.filter((v, i, a) => {
                        if (!v.name) return false;
                        return a.findIndex(t => {
                          const sameInst = v.institutionId && t.institutionId && v.institutionId.toString() === t.institutionId.toString();
                          const sameId = v._id && t._id && v._id.toString() === t._id.toString();
                          const sameName = v.name && t.name && v.name.trim().toLowerCase() === t.name.trim().toLowerCase();
                          return sameInst || sameId || sameName;
                        }) === i;
                      });
                      if (uniqueClaimants.length <= 1) {
                        return (
                          <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--text-primary)", wordBreak: "break-word" }}>
                            {data.facultyId?.name || user?.name || "-"}
                            <Typography component="span" variant="caption" sx={{ ml: 0.5, fontWeight: 600, color: "var(--text-secondary)" }}>(Auto)</Typography>
                          </Typography>
                        );
                      }
                      const currentClaimantObj = uniqueClaimants.find(c =>
                        (c.institutionId && c.institutionId === (data.appraisalClaimant?.institutionId || data.appraisalClaimant || "").toString()) ||
                        (c._id && c._id.toString() === (data.appraisalClaimant?._id || data.appraisalClaimant || "").toString())
                      );
                      if (!data.appraisalClaimant && isApplicant && appraisalConfigActive && uniqueClaimants.length > 1 && data.status === "Approved" && data.appraisalEligible === "Yes") {
                        return (
                          <Select size="small" fullWidth value="" displayEmpty onChange={(e) => handleResolveClaim(data._id, "Textbook", e.target.value)} sx={{ backgroundColor: "var(--bg-paper)", fontSize: "0.875rem" }}>
                            <MenuItem value="" disabled>Select Claimant</MenuItem>
                            {uniqueClaimants.map(c => <MenuItem key={c.institutionId || c._id} value={c.institutionId || c._id}>{c.name} ({c.institutionId})</MenuItem>)}
                          </Select>
                        );
                      }
                      return (
                        <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--text-primary)", wordBreak: "break-word" }}>
                          {currentClaimantObj ? `${currentClaimantObj.name} (${currentClaimantObj.institutionId})` : (data.status === "Approved" && data.appraisalEligible === "Yes" ? "Not Yet Designated" : "N/A")}
                        </Typography>
                      );
                    })()}
                  </Box>
                </Box>

                {/* === All Authors Section Header === */}
                <Box sx={{ px: 3, py: 1.8, display: "flex", alignItems: "center", gap: 1.5, background: "var(--bg-panel)", borderBottom: "1px solid var(--border-color)" }}>
                  <Groups sx={{ color: "var(--color-primary)", fontSize: 18 }} />
                  <Typography sx={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.9rem" }}>All Authors</Typography>
                  {data.authors && data.authors.length > 0 && (
                    <Chip label={`${data.authors.length}`} size="small" sx={{ ml: "auto", height: 20, fontSize: "0.7rem", fontWeight: 800, bgcolor: "var(--bg-glass)", border: "1px solid var(--border-color)" }} />
                  )}
                </Box>

                {/* Authors list */}
                <Box>
                  {(() => {
                    const applicantPos = parseInt(data.userAuthorPosition) || 0;
                    const allAuthors = data.authors ? [...data.authors] : [];
                    if (allAuthors.length === 0) {
                      return (
                        <Box sx={{ px: 3, py: 3, textAlign: "center" }}>
                          <Groups sx={{ color: "var(--text-secondary)", fontSize: 30, opacity: 0.35 }} />
                          <Typography variant="body2" sx={{ color: "var(--text-secondary)", mt: 1, fontStyle: "italic" }}>No authors registered</Typography>
                        </Box>
                      );
                    }
                    return allAuthors.map((author, idx) => {
                      const isMe = Boolean(
                        (author.employeeId && (
                          (typeof author.employeeId === 'string' && (
                            author.employeeId === user?.institutionId ||
                            author.employeeId === user?.employeeId ||
                            author.employeeId === user?.empId ||
                            author.employeeId === user?.userId ||
                            author.employeeId === user?._id
                          )) ||
                          (typeof author.employeeId === 'object' && (
                            author.employeeId._id === user?.userId ||
                            author.employeeId._id === user?._id ||
                            (author.employeeId.institutionId && author.employeeId.institutionId === user?.institutionId) ||
                            (author.employeeId.employeeId && author.employeeId.employeeId === user?.employeeId)
                          ))
                        )) ||
                        (author.authorName && user?.name && author.authorName.trim().toLowerCase() === user.name.trim().toLowerCase()) ||
                        (author.name && user?.name && author.name.trim().toLowerCase() === user.name.trim().toLowerCase())
                      );
                      return (
                        <Box
                          key={idx}
                          sx={{
                            display: "flex", alignItems: "center", gap: 2, px: 3, py: 1.4,
                            borderBottom: idx === allAuthors.length - 1 ? "none" : "1px solid var(--border-color)",
                            bgcolor: isMe ? "rgba(190, 147, 55, 0.04)" : "transparent",
                            "&:hover": { bgcolor: isMe ? "rgba(190, 147, 55, 0.07)" : "rgba(0,0,0,0.012)" },
                            transition: "background 0.2s"
                          }}
                        >
                          <Box sx={{
                            display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                            width: 28, height: 28, borderRadius: "50%",
                            bgcolor: isMe ? "rgba(190, 147, 55, 0.18)" : "rgba(0, 78, 146, 0.07)",
                            border: `2px solid ${isMe ? "var(--color-primary)" : "rgba(0,0,0,0.12)"}`,
                            color: isMe ? "var(--color-primary)" : "var(--text-secondary)",
                            fontWeight: 900, fontSize: "0.72rem"
                          }}>
                            {author.authorPosition || idx + 1}
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                              <Typography variant="body2" sx={{ fontWeight: isMe ? 800 : 700, color: "var(--text-primary)", fontSize: "0.84rem" }} noWrap>
                                {author.authorName}
                              </Typography>
                              {isMe && (
                                <Chip label="You" size="small" sx={{ height: 16, fontSize: "0.6rem", fontWeight: 800, bgcolor: "rgba(190, 147, 55, 0.15)", color: "var(--color-primary)", border: "1px solid rgba(190, 147, 55, 0.4)", px: 0.3 }} />
                              )}
                            </Box>
                            {author.affiliationName && (
                              <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontSize: "0.71rem" }} noWrap>{author.affiliationName}</Typography>
                            )}
                          </Box>
                        </Box>
                      );
                    });
                  })()}
                </Box>
              </Paper>
            </Box>
          </Box>

          {/* Remarks/Comments */}
          {(Boolean(data.hodComment) || Boolean(data.rndComment)) && (
            <Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 2 }}>
              {data.hodComment && (
                <Box sx={{ p: 2, bgcolor: "rgba(255, 193, 7, 0.05)", borderRadius: "12px", border: "1px solid rgba(255, 193, 7, 0.2)" }}>
                  <Typography variant="caption" sx={{ fontWeight: 900, color: "#ff9800", textTransform: "uppercase" }}>HOD Remarks</Typography>
                  <Typography variant="body2" sx={{ fontStyle: "italic", mt: 0.5, color: "var(--text-secondary)" }}>"{data.hodComment}"</Typography>
                </Box>
              )}
              {data.rndComment && (
                <Box sx={{ p: 2, bgcolor: "rgba(76, 175, 80, 0.05)", borderRadius: "12px", border: "1px solid rgba(76, 175, 80, 0.2)" }}>
                  <Typography variant="caption" sx={{ fontWeight: 900, color: "#4caf50", textTransform: "uppercase" }}>R&D Remarks</Typography>
                  <Typography variant="body2" sx={{ fontStyle: "italic", mt: 0.5, color: "var(--text-secondary)" }}>"{data.rndComment}"</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: "1px solid var(--border-color)" }}>
          <Button onClick={handleCloseDetails} sx={{ color: "var(--text-primary)", fontWeight: 700 }}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box>
      <PageHeader
        title="Textbook Publications"
        subtitle="Manage and submit your textbook publications"
        onBack={viewMode !== "list" ? () => setViewMode("list") : undefined}
      />
      {(!user?.panNumber || !user?.college) && (
        <Box sx={{ px: 3, mb: 4 }}>
          <Alert severity="warning" variant="filled" sx={{ borderRadius: "16px" }}>
            <AlertTitle sx={{ fontWeight: 700 }}>Profile Details Incomplete</AlertTitle>
            <Typography variant="body2">
              You must complete the following fields in your profile before you submit:
              <strong> PAN Number, College</strong>. Please navigate to the Profile settings to update them.
            </Typography>
          </Alert>
        </Box>
      )}
      {viewMode === "list" && renderList()}
      {viewMode === "select-year" && renderSelectYear()}
      {viewMode === "form" && renderForm()}
      {renderDetailsDialog()}
      <NoActiveYearDialog
        open={noActiveYearAlertOpen}
        onClose={() => setNoActiveYearAlertOpen(false)}
      />
    </Box>
  );
}
