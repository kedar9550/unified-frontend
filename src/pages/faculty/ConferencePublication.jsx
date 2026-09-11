import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

import { Box, TextField, MenuItem, Select, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Stack, Grid, Card, Chip, Divider, Tooltip, TablePagination, Radio, RadioGroup, FormControlLabel } from "@mui/material";
import { toast } from "sonner";
import { Close, Description, Download, AttachFile, Groups, School, Visibility, Edit, Article, Person, CurrencyRupee, CardGiftcard } from "@mui/icons-material";
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import SchoolIcon from '@mui/icons-material/School';
import LinkIcon from '@mui/icons-material/Link';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import GrassIcon from '@mui/icons-material/Grass';
import PublicIcon from '@mui/icons-material/Public';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PageHeader from "../../components/common/PageHeader";
import NoActiveYearDialog from "../../components/common/NoActiveYearDialog";
import {
  FacultyInfoRow, FormCard, Grid2, SubLabel, NoteBox, FileField, SubmitBtn
} from "../../components/faculty/PublicationFormFields";
import {
  labelStyle, disabledField, MONTHS, YEARS
} from "../../components/faculty/publicationConstants";
import API from "../../api/axios";

export default function ConferencePublication() {
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

  const [form, setForm] = useState({
    doi: "",
    title: "", conferenceName: "", scope: "", indexing: "",
    month: "", year: "",
    publisher: "", issnIsbn: "",
    applyIncentive: "", applyingSeedGrant: "",
    isStudentsInvolved: "No",
    totalAuthors: 1, userAuthorPosition: 1, otherAuthors: []
  });
  const [files, setFiles] = useState({ certificate: null, proceedings: null });
  const [loading, setLoading] = useState(false);
  const [doiFetching, setDoiFetching] = useState(false);
  const [doiFetched, setDoiFetched] = useState(false);
  const [doiFetchedFields, setDoiFetchedFields] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  const isFetched = (fieldName) => {
    return doiFetched && Boolean(doiFetchedFields[fieldName]);
  };

  useEffect(() => {
    API.get("/api/research/conference").then(res => {
      setPublicationsList(res.data?.data || res.data || []);
    }).catch(err => console.log("Failed to fetch conferences", err));

    API.get("/api/academic-years").then(res => {
      setAcademicYears(res.data?.years || res.data?.data || []);
    }).catch(err => console.log("Failed to fetch academic years", err));
  }, [viewMode]);

  const set = (k) => (e) => {
    const val = e.target.value;
    setForm(p => {
      const newForm = { ...p, [k]: val };
      if (k === "doi") {
        newForm.title = "";
        newForm.publisher = "";
        newForm.conferenceName = "";
        newForm.issnIsbn = "";
        newForm.year = "";
        newForm.month = "";
        newForm.indexing = "";
        setDoiFetched(false);
        setDoiFetchedFields({});
      }
      if (k === "isStudentsInvolved") {
        if (val === "No") {
          newForm.otherAuthors = newForm.otherAuthors.map(a => ({
            ...a,
            CoAuthorType: "faculty",
            studentId: "",
            authorName: a.CoAuthorType === "student" ? "" : a.authorName,
            empId: a.CoAuthorType === "student" ? "" : a.empId
          }));
          newForm.applyIncentive = "";
        } else if (val === "Yes") {
          newForm.applyIncentive = "No";
        }
      }
      return newForm;
    });
  };

  const handleEditClick = (pub) => {
    setEditMode(true);
    setEditId(pub._id);
    setSelectedYear(pub.academicYear?._id || pub.academicYear);

    const mappedAuthors = [];
    if (pub.coAuthors && pub.coAuthors.length > 0) {
      let positionCounter = 1;
      const total = parseInt(pub.totalAuthors) || 1;
      const myPos = parseInt(pub.userAuthorPosition) || 1;

      for (let i = 1; i <= total; i++) {
        if (i === myPos) continue;
        const ca = pub.coAuthors[positionCounter - 1];
        if (ca) {
          const isInternal = (ca.employeeId || ca.studentId || ca.affiliation === "Aditya University");
          mappedAuthors.push({
            authorPosition: i,
            CoAuthorType: ca.CoAuthorType || "faculty",
            studentId: ca.studentId || "",
            affiliationType: isInternal ? "Aditya University" : "Others",
            empId: isInternal && ca.employeeId ? (ca.employeeId?.institutionId || ca.employeeId) : "",
            authorName: ca.name || "",
            affiliationName: ca.affiliation || ""
          });
          positionCounter++;
        }
      }
    }

    setForm({
      doi: pub.doi || "",
      title: pub.title || "",
      conferenceName: pub.conferenceName || "",
      scope: pub.scope || pub.level || "",
      indexing: pub.indexing || "",
      month: pub.month || "",
      year: pub.year || "",
      publisher: pub.publisher || "",
      issnIsbn: pub.issnIsbn || "",
      applyIncentive: pub.applyIncentive || "",
      applyingSeedGrant: pub.applyingSeedGrant || "",
      isStudentsInvolved: pub.isStudentsInvolved || "No",
      totalAuthors: pub.totalAuthors || 1,
      userAuthorPosition: pub.userAuthorPosition || 1,
      otherAuthors: mappedAuthors
    });
    setDoiFetched(!!pub.doi);
    setDoiFetchedFields(pub.doi ? {
      title: Boolean(pub.title),
      publisher: Boolean(pub.publisher),
      issnIsbn: Boolean(pub.issnIsbn),
      conferenceName: Boolean(pub.conferenceName),
      indexing: Boolean(pub.indexing)
    } : {});
    setFiles({ certificate: null, proceedings: null });
    setViewMode("form");
  };

  // ── DOI Fetch via Backend (POST /api/research/conference/validate-doi) ───────
  // Backend calls Scopus, checks subtype === 'cp', returns structured data
  // This avoids exposing the Scopus API key in the frontend
  const fetchDOIData = async () => {
    const cleanDoi = form.doi.trim().replace(/^https?:\/\/doi\.org\//i, "");
    if (!cleanDoi) {
      toast.error("Please enter a DOI");
      return;
    }

    setDoiFetching(true);
    setDoiFetched(false);
    setDoiFetchedFields({});

    try {
      // Single call to backend — backend handles Scopus Search + Abstract Retrieval
      const res = await API.post("/api/research/conference/validate-doi", { doi: cleanDoi });
      const { data } = res.data;

      // Populate form fields from backend response
      setForm(prev => ({
        ...prev,
        title: data.title || prev.title,
        publisher: data.publisher || prev.publisher,
        conferenceName: data.conferenceName || prev.conferenceName,
        issnIsbn: data.issnIsbn || prev.issnIsbn,
        year: data.year || prev.year,
        month: data.month || prev.month,
        indexing: "Scopus Indexed",   // confirmed in Scopus as conference paper
      }));

      const fetchedObj = {};
      if (data.title) fetchedObj.title = true;
      if (data.publisher) fetchedObj.publisher = true;
      if (data.conferenceName) fetchedObj.conferenceName = true;
      if (data.issnIsbn) fetchedObj.issnIsbn = true;
      fetchedObj.indexing = true;

      setDoiFetchedFields(fetchedObj);
      setDoiFetched(true);

      // Warn user if mandatory fields couldn't be auto-filled (rare, but possible)
      const missing = [];
      if (!data.publisher) missing.push("Publisher");
      if (!data.conferenceName) missing.push("Conference Name");

      if (missing.length > 0) {
        toast.warning(`Details fetched! Please fill in manually: ${missing.join(", ")}`);
      } else {
        toast.success("Conference paper verified! Details fetched successfully.");
      }

    } catch (err) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message;

      if (status === 400) {
        toast.error(message || "A conference publication with this Title or DOI already exists.", { duration: 7000 });
      } else if (status === 422) {
        // Journal article / non-conference paper
        toast.error(message || "Only conference papers are allowed. Journal publications are not accepted.", { duration: 7000 });
      } else if (status === 404) {
        // Not in Scopus
        toast.warning(message || "This DOI was not found in Scopus. Please fill details manually.");
        setForm(prev => ({ ...prev, indexing: prev.indexing || "Not Scopus Indexed" }));
      } else if (status === 401) {
        toast.error("Scopus API key issue. Please contact admin.");
      } else if (status === 429) {
        toast.error("Scopus rate limit exceeded. Try again in a few minutes.");
      } else {
        toast.error("Failed to fetch DOI details. Please fill manually.");
      }
    } finally {
      setDoiFetching(false);
    }
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
    if (file.size > 1024 * 1024) {
      toast.error("File size exceeds 1MB limit");
      return false;
    }
    return true;
  };

  const setFile = (k) => (e) => {
    const file = e.target.files[0];
    if (file && validateFile(file)) {
      setFiles((p) => ({ ...p, [k]: file }));
    } else {
      e.target.value = null;
    }
  };

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
        const existing = form.otherAuthors.find(a => a.authorPosition === i);
        newOtherAuthors.push(existing || {
          authorPosition: i,
          CoAuthorType: "faculty",
          studentId: "",
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
            newA.authorName = "";
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

    setForm(p => ({ ...p, otherAuthors: updated }));

    if (field === "empId" && value.length >= 3) {
      const author = updated.find(a => a.authorPosition === pos);
      if (author && author.affiliationType === "Aditya University" && author.CoAuthorType !== "student") {
        fetchCoAuthorName(pos, value);
      }
    }
  };

  const handleSubmit = async () => {
    if (!form.doi) {
      toast.error("DOI is mandatory. Please enter the DOI.");
      return;
    }
    if (!form.title || !form.conferenceName || !form.scope || !form.indexing || !form.publisher || !form.applyingSeedGrant || !form.applyIncentive) {
      toast.error("Please fill all required fields");
      return;
    }

    if (form.year && form.month) {
      const selectedYear = parseInt(form.year);
      const currentYear = new Date().getFullYear();
      const currentMonthIndex = new Date().getMonth();
      const monthIdx = MONTHS.indexOf(form.month);
      if (selectedYear > currentYear || (selectedYear === currentYear && monthIdx > currentMonthIndex)) {
        toast.error("Publication date cannot be in the future");
        return;
      }
    }

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

    if (!editMode && !files.certificate) {
      toast.error("Please attach the presentation certificate");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();

      const coAuthorsList = form.otherAuthors.map(a => ({
        name: a.authorName || "",
        affiliation: a.affiliationType === "Aditya University" ? "Aditya University" : (a.affiliationName || ""),
        employeeId: (a.affiliationType === "Aditya University" && a.CoAuthorType !== "student") ? a.empId : null,
        studentId: (a.affiliationType === "Aditya University" && a.CoAuthorType === "student") ? a.studentId : null,
        CoAuthorType: form.isStudentsInvolved === "Yes" ? (a.CoAuthorType || "faculty") : "faculty",
        authorPosition: a.authorPosition
      })).filter(ca => ca.name && ca.affiliation);

      fd.append("doi", form.doi || "");
      fd.append("title", form.title);
      fd.append("conferenceName", form.conferenceName);
      fd.append("scope", form.scope);
      fd.append("indexing", form.indexing);
      fd.append("publisher", form.publisher);
      fd.append("issnIsbn", form.issnIsbn || "");
      fd.append("totalAuthors", String(total));
      fd.append("userAuthorPosition", String(form.userAuthorPosition));
      fd.append("coAuthors", JSON.stringify(coAuthorsList));
      fd.append("isStudentsInvolved", form.isStudentsInvolved || "No");
      fd.append("month", form.month);
      fd.append("year", form.year);
      fd.append("applyIncentive", form.applyIncentive);
      fd.append("applyingSeedGrant", form.applyingSeedGrant);
      fd.append("academicYear", selectedYear);
      fd.append("college", user?.college || "");
      fd.append("panNumber", user?.panNumber || "");

      if (files.certificate) fd.append("certificate", files.certificate);
      if (files.proceedings) fd.append("proceedings", files.proceedings);

      const url = editMode ? `/api/research/conference/${editId}` : "/api/research/conference";
      const method = editMode ? "put" : "post";

      await API[method](url, fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success(editMode ? "Conference paper updated successfully!" : "Conference paper submitted successfully!");
      setForm({
        doi: "",
        title: "", conferenceName: "", scope: "", indexing: "",
        month: "", year: "",
        publisher: "", issnIsbn: "",
        applyIncentive: "", applyingSeedGrant: "",
        isStudentsInvolved: "No",
        totalAuthors: 1, userAuthorPosition: 1, otherAuthors: []
      });
      setDoiFetched(false);
      setFiles({ certificate: null, proceedings: null });
      setEditMode(false);
      setEditId(null);
      setSelectedYear("");
      setViewMode("list");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  const renderList = () => (
    <Box sx={{ p: 2 }}>
      <Box sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        justifyContent: "space-between",
        alignItems: "center",
        gap: { xs: 2, sm: 0 },
        mb: 3
      }}>
        <Typography variant="h6" sx={{ color: "var(--text-primary)", fontWeight: 800, textAlign: { xs: "center", sm: "left" } }}>My Conference Publications</Typography>
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
            No Previous Conferences
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 3, maxWidth: "400px" }}>
            You haven't submitted any conference details yet. Click the "Apply New" button to submit your first entry.
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-premium)", overflowX: "auto" }}>
          <Table sx={{ minWidth: 1100 }}>
            <TableHead sx={{ background: "var(--gradient-primary)" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Paper Title</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Conference Name</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Scope</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Indexing</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Applicant</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Co-Authors</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {publicationsList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((pub, i) => (
                <TableRow key={pub._id || i} sx={{ "&:hover": { background: "rgba(var(--color-primary-rgb, 99,102,241), 0.04)", transition: "background 0.2s" } }}>
                  <TableCell sx={{ color: "var(--text-primary)", fontWeight: 500, py: 2 }}>{pub.title || "N/A"}</TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>{pub.conferenceName || "N/A"}</TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>{pub.scope || pub.level || "N/A"}</TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>{pub.indexing || "N/A"}</TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {pub.facultyId?.name || "N/A"}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: pub.visibilityRole === "Applicant" ? "var(--color-primary)" : "text.secondary" }}>
                      {pub.visibilityRole || "Applicant"}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>
                    {pub.coAuthors?.length > 0 ? (
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {pub.coAuthors.map(a => a.name).join(", ")}
                      </Typography>
                    ) : (
                      <Typography variant="body2" sx={{ fontWeight: 500, color: "text.secondary" }}>None</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Typography variant="body2" sx={{
                      color: pub.status?.includes("Rejected") ? "#ef4444" : pub.status === "Approved" ? "#10b981" : "#e8a000",
                      fontWeight: 700,
                      background: pub.status?.includes("Rejected") ? "rgba(239,68,68,0.1)" : pub.status === "Approved" ? "rgba(16,185,129,0.1)" : "rgba(232,160,0,0.1)",
                      px: 1.5, py: 0.5, borderRadius: "6px", display: "inline-block"
                    }}>
                      {pub.status || "Pending"}
                    </Typography>
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
                      {pub.status?.includes("Rejected") && pub.visibilityRole === "Applicant" && (
                        <Tooltip title="Edit & Resubmit" arrow>
                          <IconButton
                            size="small"
                            onClick={() => handleEditClick(pub)}
                            sx={{
                              color: "#eab308",
                              "&:hover": { background: "rgba(234,179,8,0.1)", transform: "scale(1.1)" },
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
          <Typography sx={{ mb: 2, color: "var(--text-secondary)", fontWeight: 500 }}>Please select the academic year for this conference submission:</Typography>
          <Select
            fullWidth
            size="small"
            displayEmpty
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <MenuItem value="" disabled>Select Academic Year</MenuItem>
            {filteredYears.map(y => (
              <MenuItem key={y._id} value={y._id}>{y.year}</MenuItem>
            ))}
          </Select>
          <Box sx={{ display: "flex", gap: 2, mt: 4, justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              onClick={() => { setViewMode("list"); setEditMode(false); setEditId(null); }}
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
    <FormCard title="Conference Submission">
      <Box sx={{ mb: 3, display: "flex", alignItems: "center" }}>
        <Typography variant="body2" sx={{ background: "var(--bg-accent-1)", color: "var(--color-primary)", px: 2, py: 0.8, borderRadius: "8px", fontWeight: 700, border: "1px solid var(--border-color)" }}>
          Academic Year: {academicYears.find(y => y._id === selectedYear)?.year || "Selected"}
        </Typography>
      </Box>

      <FacultyInfoRow />

      <SubLabel text="Details of the Conference Research Paper:" />

      {/* DOI Field */}
      <Box sx={{ mb: 2.5, p: 2.5, borderRadius: "12px", border: "2px solid var(--color-primary)", background: "var(--bg-accent-1)", boxShadow: "0 2px 12px rgba(var(--color-primary-rgb,99,102,241),0.08)" }}>
        <Typography sx={{ ...labelStyle, color: "var(--color-primary)", mb: 1 }}>
          DOI (Digital Object Identifier) : *
          <span style={{ fontWeight: 400, textTransform: "none", fontSize: 10, opacity: 0.7 }}> — Enter DOI to auto-fill details (only conference papers accepted)</span>
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
          <TextField
            size="small"
            fullWidth
            value={form.doi}
            onChange={set("doi")}
            placeholder="e.g. 10.1109/ACCESS.2024.123456"
            onKeyDown={(e) => { if (e.key === "Enter") fetchDOIData(); }}
            slotProps={{
              input: {
                sx: { background: "var(--bg-panel)" },
                endAdornment: doiFetched ? (
                  <Box component="span" sx={{ display: "flex", alignItems: "center", color: "#10b981", fontSize: 18, mr: 0.5 }}>✓</Box>
                ) : null
              }
            }}
          />
          <Button
            variant="contained"
            onClick={fetchDOIData}
            disabled={doiFetching || !form.doi.trim()}
            sx={{
              minWidth: 110,
              height: "40px",
              background: "var(--gradient-primary)",
              textTransform: "none",
              fontWeight: 700,
              flexShrink: 0,
              "&:hover": { opacity: 0.9 },
              "&.Mui-disabled": { opacity: 0.5 }
            }}
          >
            {doiFetching ? "Fetching..." : "Fetch Details"}
          </Button>
        </Box>
        {doiFetched && (
          <Typography sx={{ mt: 1, fontSize: 11, color: "#10b981", fontWeight: 700 }}>
            ✓ Details fetched successfully! Review and correct if needed.
          </Typography>
        )}
      </Box>

      <Grid2>
        <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
          <Typography sx={labelStyle}>Title of the Research Paper : *</Typography>
          <TextField size="small" fullWidth value={form.title} onChange={set("title")} placeholder="Auto-filled from DOI" disabled={true} sx={disabledField} />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Publisher : *</Typography>
          <TextField size="small" fullWidth value={form.publisher} onChange={set("publisher")} placeholder="Auto-filled from DOI" disabled={true} sx={disabledField} />
        </Box>
        <Box>
          <Typography sx={labelStyle}>ISSN / ISBN Number :</Typography>
          <TextField
            size="small"
            fullWidth
            placeholder="Auto-filled from DOI"
            value={form.issnIsbn}
            onChange={(e) => {
              const val = e.target.value;
              if (/^[0-9X-]*$/i.test(val)) setForm(p => ({ ...p, issnIsbn: val }));
            }}
            slotProps={{ htmlInput: { inputMode: 'numeric' } }}
            disabled={true}
            sx={disabledField}
          />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Year :</Typography>
          <Select size="small" fullWidth displayEmpty value={form.year} onChange={(e) => {
            setForm(p => ({ ...p, year: e.target.value, month: "" }));
          }} disabled={true} sx={disabledField}>
            <MenuItem value="">Auto-filled from DOI</MenuItem>
            {(form.year && !YEARS.includes(String(form.year))
              ? [...YEARS, String(form.year)].sort((a, b) => Number(b) - Number(a))
              : YEARS
            ).map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
        </Box>
        <Box>
          <Typography sx={labelStyle}>Month :</Typography>
          <Select size="small" fullWidth displayEmpty value={form.month} onChange={set("month")} disabled={true} sx={disabledField}>
            <MenuItem value="">Auto-filled from DOI</MenuItem>
            {(form.month && !getAvailableMonths().includes(form.month)
              ? [...getAvailableMonths(), form.month]
              : getAvailableMonths()
            ).map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
          </Select>
        </Box>
        <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
          <Typography sx={labelStyle}>Name of the Conference : *</Typography>
          <TextField size="small" fullWidth value={form.conferenceName} onChange={set("conferenceName")} placeholder="Auto-filled from DOI" disabled={true} sx={disabledField} />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Conference Scope : *</Typography>
          <Select size="small" fullWidth displayEmpty value={form.scope} onChange={set("scope")}>
            <MenuItem value="" disabled>Select Scope</MenuItem>
            <MenuItem value="National">National</MenuItem>
            <MenuItem value="International">International</MenuItem>
          </Select>
        </Box>
        <Box>
          <Typography sx={labelStyle}>Indexing : *</Typography>
          <Select size="small" fullWidth displayEmpty value={form.indexing} onChange={set("indexing")} disabled={true} sx={disabledField}>
            <MenuItem value="" disabled>Auto-filled from DOI</MenuItem>
            <MenuItem value="Scopus Indexed">Scopus Indexed</MenuItem>
            <MenuItem value="Not Scopus Indexed">Not Scopus Indexed</MenuItem>
          </Select>
        </Box>
      </Grid2>

      {/* Dynamic Author Details Block */}
      <Box sx={{ mt: 3, p: 2, borderRadius: "12px", border: "1px solid var(--border-color)", background: "var(--bg-panel)" }}>
        <Typography sx={{ fontWeight: 700, color: "var(--text-primary)", mb: 2 }}>Author Details</Typography>
        <Grid2>
          <Box sx={{ gridColumn: { sm: "1 / -1" }, mb: 1, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <Typography sx={{ ...labelStyle, mb: 0 }}>Are students involved in this work as co-authors? *</Typography>
            <RadioGroup row value={form.isStudentsInvolved || "No"} onChange={set("isStudentsInvolved")}>
              <FormControlLabel value="Yes" control={<Radio size="small" sx={{ color: "var(--color-primary)", "&.Mui-checked": { color: "var(--color-primary)" } }} />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Yes</Typography>} />
              <FormControlLabel value="No" control={<Radio size="small" sx={{ color: "var(--color-primary)", "&.Mui-checked": { color: "var(--color-primary)" } }} />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>No</Typography>} />
            </RadioGroup>
          </Box>
          <Box>
            <Typography sx={labelStyle}>Total Number of Authors :</Typography>
            <TextField size="small" fullWidth type="number" value={form.totalAuthors} onChange={set("totalAuthors")} slotProps={{ htmlInput: { min: 1 } }} />
          </Box>
          {parseInt(form.totalAuthors) > 1 && (
            <Box>
              <Typography sx={labelStyle}>Applicant Author Position :</Typography>
              <Select size="small" fullWidth value={form.userAuthorPosition} onChange={set("userAuthorPosition")}>
                {Array.from({ length: parseInt(form.totalAuthors) || 1 }, (_, i) => (
                  <MenuItem key={i + 1} value={i + 1}>{i + 1}</MenuItem>
                ))}
              </Select>
            </Box>
          )}
        </Grid2>

        {parseInt(form.totalAuthors) > 1 && (
          <Box sx={{ mt: 3 }}>
            <Typography sx={{ ...labelStyle, mb: 1 }}>Name & Affiliation of Co-Author(s) :</Typography>
            {form.otherAuthors.map((ca) => (
              <Box
                key={ca.authorPosition}
                sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2, p: 2, borderRadius: "12px", border: "1px dashed var(--border-color)", background: "var(--bg-accent-1)" }}
              >
                <Box sx={{ display: "flex", gap: 2, flexWrap: { xs: "wrap", sm: "nowrap" }, alignItems: "center" }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minWidth: "30px", height: "30px", background: "var(--color-primary)", color: "#fff", borderRadius: "50%", fontWeight: 700, fontSize: 14 }}>
                    {ca.authorPosition}
                  </Box>

                  {form.isStudentsInvolved === "Yes" && (
                    <Box sx={{ flex: 1, minWidth: { xs: "100%", sm: "130px" } }}>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>CO-AUTHOR TYPE</Typography>
                      <Select
                        size="small"
                        fullWidth
                        displayEmpty
                        value={ca.CoAuthorType || "faculty"}
                        onChange={(e) => handleCoAuthorChange(ca.authorPosition, "CoAuthorType", e.target.value)}
                      >
                        <MenuItem value="faculty">Faculty</MenuItem>
                        <MenuItem value="student">Student</MenuItem>
                      </Select>
                    </Box>
                  )}

                  <Box sx={{ flex: 1, minWidth: { xs: "100%", sm: "150px" } }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>AFFILIATION TYPE</Typography>
                    <Select
                      size="small"
                      fullWidth
                      value={ca.CoAuthorType === "student" ? "Aditya University" : ca.affiliationType}
                      onChange={(e) => handleCoAuthorChange(ca.authorPosition, "affiliationType", e.target.value)}
                      displayEmpty
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
                          <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>STUDENT NAME</Typography>
                          <TextField
                            size="small"
                            fullWidth
                            value={ca.authorName}
                            onChange={(e) => handleCoAuthorChange(ca.authorPosition, "authorName", e.target.value)}
                            placeholder="Full Name"
                          />
                        </Box>
                      </>
                    ) : (
                      <>
                        <Box sx={{ flex: 1, minWidth: { xs: "100%", sm: "120px" } }}>
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
                        <Box sx={{ flex: 2, minWidth: { xs: "100%", sm: "200px" } }}>
                          <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>CO-AUTHOR NAME</Typography>
                          <TextField
                            size="small"
                            fullWidth
                            value={ca.authorName}
                            disabled
                            placeholder="Fetched from eCap"
                            sx={{ background: "rgba(0,0,0,0.02)" }}
                          />
                        </Box>
                      </>
                    )
                  ) : (
                    <>
                      <Box sx={{ flex: 1, minWidth: { xs: "100%", sm: "180px" } }}>
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
                      <Box sx={{ flex: 2, minWidth: { xs: "100%", sm: "200px" } }}>
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

      <SubLabel text="Incentives & Grants:" />
      <Grid2>
        <Box>
          <Typography sx={labelStyle}>Applying as a Seed Grant Work? *</Typography>
          <Select size="small" fullWidth displayEmpty value={form.applyingSeedGrant} onChange={set("applyingSeedGrant")}>
            <MenuItem value="" disabled>Select</MenuItem>
            <MenuItem value="Yes">Yes</MenuItem>
            <MenuItem value="No">No</MenuItem>
          </Select>
        </Box>
        <Box>
          <Typography sx={labelStyle}>Whether you want to apply for incentive? *</Typography>
          <Select size="small" fullWidth displayEmpty value={form.applyIncentive} onChange={set("applyIncentive")} disabled={form.isStudentsInvolved === "Yes"} sx={form.isStudentsInvolved === "Yes" ? disabledField : {}}>
            <MenuItem value="" disabled>Select</MenuItem>
            <MenuItem value="Yes">Yes</MenuItem>
            <MenuItem value="No">No</MenuItem>
          </Select>
        </Box>
      </Grid2>

      <NoteBox />

      <Grid2 sx={{ mt: 2 }}>
        <FileField label="Attach Certificate of Presentation * :" name="certificate" onChange={setFile("certificate")} />
        <FileField label="Attach Copy of Proceedings / Abstract Book :" name="proceedings" onChange={setFile("proceedings")} />
      </Grid2>

      <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 4 }}>
        <Button
          variant="outlined"
          onClick={() => { setViewMode("list"); setEditMode(false); setEditId(null); }}
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
        API.get("/api/research/conference").then(r => setPublicationsList(r.data?.data || r.data || [])).catch(() => { });
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

  const renderDetailFile = (title, filepath, folder = "conferences") => {
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
    const statusColor = (() => {
      const s = data.status || "";
      if (/Pending/i.test(s)) return "#ff9800";
      if (/Approved/i.test(s)) return "#4caf50";
      if (/Rejected/i.test(s)) return "#f44336";
      return "#666";
    })();

    const formatDate = (dateStr) => {
      if (!dateStr) return "-";
      try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      } catch (e) {
        return dateStr;
      }
    };

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
            <School sx={{ color: "#fff" }} />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Conference Details</Typography>
          </Box>
          <IconButton onClick={handleCloseDetails} sx={{ color: "#fff" }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 1 }}>
          {/* Top Header Box (Journal Details Style) */}
          <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: "16px", border: "1px solid var(--border-color)", background: "var(--bg-panel)" }}>
            <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                <Box sx={{
                  width: 48, height: 48, borderRadius: "12px", bgcolor: "rgba(0, 78, 146, 0.08)",
                  color: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center",
                  border: "1px solid rgba(0, 78, 146, 0.15)", flexShrink: 0, mt: 0.5
                }}>
                  <Description sx={{ fontSize: 26 }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.3 }}>
                    {data.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 600, mt: 0.5 }}>
                    Conference: {data.conferenceName}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
                <Chip
                  icon={<AccessTimeIcon sx={{ fontSize: "16px !important", color: "inherit" }} />}
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

          {/* Main Grid: Left Column (Publication Details) + Right Column (Scope & Appraisal) */}
          <Box sx={{
            display: "grid",
            gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1.3fr) minmax(0, 0.9fr)" },
            gap: 3,
            mb: 3,
            width: "100%",
            alignItems: "flex-start"
          }}>
            {/* Left Column (Publication Details) */}
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
                    <FormatListBulletedIcon sx={{ color: "var(--color-primary)" }} />
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                      Publication Details
                    </Typography>
                  </Box>
                  <Box sx={{ width: 140, height: 3, bgcolor: "var(--color-primary)", borderRadius: "3px" }} />
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column" }}>
                  {[
                    { label: "Academic Year", value: data.academicYear?.year || "N/A", icon: <SchoolIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                    { label: "DOI", value: data.doi || "N/A", icon: <LinkIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                    { label: "Applicant Author Position", value: data.userAuthorPosition ? `${data.userAuthorPosition} / ${data.totalAuthors || 1}` : "1", icon: <PersonOutlineIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                    { label: "Indexing", value: data.indexing || "-", icon: <ShowChartIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                    { label: "Publisher", value: data.publisher || "N/A", icon: <MenuBookIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                    { label: "ISSN/ISBN", value: data.issnIsbn || "N/A", icon: <Article sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                    { label: "Month/Year", value: `${data.month || ""} ${data.year || ""}`.trim() || "-", icon: <CalendarMonthIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
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
                      <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--text-primary)", textAlign: "right", maxWidth: "55%", wordBreak: "break-word" }}>
                        {item.value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Box>

            {/* Right Column (Publication Scope & Appraisal) */}
            <Box sx={{
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: 3
            }}>
              {/* Scope, Eligibility, Claimant Card */}
              <Paper elevation={0} sx={{ p: 3, borderRadius: "16px", border: "1px solid var(--border-color)", background: "var(--bg-paper)" }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 2, borderBottom: "1px solid var(--border-color)" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <PublicIcon sx={{ color: "var(--text-secondary)", fontSize: 20 }} />
                      <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 600 }}>
                        Publication Scope
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                      {data.scope || data.level || "National"}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 2, borderBottom: "1px solid var(--border-color)" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <CheckCircleOutlineIcon sx={{ color: "var(--text-secondary)", fontSize: 20 }} />
                      <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 600 }}>
                        Article Eligibility for Appraisal
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                      {data.status === "Approved" ? (data.appraisalEligible || "Yes") : "Not yet decided"}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 0.5 }}>
                      <Person sx={{ color: "var(--text-secondary)", fontSize: 20 }} />
                      <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 600 }}>
                        Appraisal Claimant
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "right", maxWidth: "60%" }}>
                      {(() => {
                        const isApplicant = data.visibilityRole === "Applicant" || (data.facultyId && (data.facultyId === user?.userId || data.facultyId._id === user?.userId));
                        const eligibleClaimants = [
                          { _id: data.facultyId?._id, name: data.facultyId?.name, institutionId: data.facultyId?.institutionId },
                          ...((data.coAuthors || [])
                            .filter(ca => ca.employeeId)
                            .map(ca => ({
                              _id: ca.employeeId?._id || ca.employeeId,
                              name: ca.employeeId?.name || ca.name,
                              institutionId: ca.employeeId?.institutionId || ca.employeeId || ""
                            })))
                        ];
                        const uniqueClaimants = eligibleClaimants.filter((v, i, a) => v._id && a.findIndex(t => t._id.toString() === v._id.toString()) === i);

                        if (uniqueClaimants.length <= 1) {
                          return (
                            <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                              {data.facultyId?.name || user?.name || "-"} <Typography component="span" variant="caption" sx={{ fontWeight: 600, color: "var(--text-secondary)" }}>(Auto-assigned)</Typography>
                            </Typography>
                          );
                        }

                        const currentClaimantObj = uniqueClaimants.find(c =>
                          (c.institutionId && c.institutionId === (data.appraisalClaimant?.institutionId || data.appraisalClaimant || "").toString()) ||
                          (c._id && c._id.toString() === (data.appraisalClaimant?._id || data.appraisalClaimant || "").toString())
                        );

                        if (!data.appraisalClaimant && isApplicant && appraisalConfigActive && uniqueClaimants.length > 1 && data.status === "Approved" && data.appraisalEligible === "Yes") {
                          return (
                            <Select
                              size="small"
                              fullWidth
                              value=""
                              displayEmpty
                              onChange={(e) => handleResolveClaim(data._id, "Conference", e.target.value)}
                              sx={{ backgroundColor: "var(--bg-paper)", fontSize: "0.875rem" }}
                            >
                              <MenuItem value="" disabled>Select Claimant</MenuItem>
                              {uniqueClaimants.map(c => (
                                <MenuItem key={c.institutionId || c._id} value={c.institutionId || c._id}>
                                  {c.name} ({c.institutionId})
                                </MenuItem>
                              ))}
                            </Select>
                          );
                        }

                        return (
                          <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                            {currentClaimantObj ? `${currentClaimantObj.name} (${currentClaimantObj.institutionId})` : (data.status === "Approved" && data.appraisalEligible === "Yes" ? `Not Yet Designated` : `N/A - Not Eligible or Not Approved`)}
                          </Typography>
                        );
                      })()}
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Co-Authors table */}
          {data.coAuthors && data.coAuthors.length > 0 && (
            <Card sx={{ p: 0, overflow: "hidden", mb: 3, border: "1px solid var(--border-color)", background: "rgba(255,255,255,0.01)" }}>
              <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5, borderBottom: "1px solid var(--border-color)" }}>
                <Groups sx={{ color: "var(--color-primary)" }} />
                <Typography sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Co-Authors & Affiliations</Typography>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "var(--bg-panel)" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: "var(--text-secondary)", width: 80 }}>POSITION</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "var(--text-secondary)" }}>NAME</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "var(--text-secondary)" }}>AUTHOR TYPE</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "var(--text-secondary)" }}>AFFILIATION</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(() => {
                      const total = parseInt(data.totalAuthors) || 0;
                      const applicantPos = parseInt(data.userAuthorPosition) || 0;
                      const derivedPositions = total > 0
                        ? Array.from({ length: total }, (_, i) => i + 1).filter(p => p !== applicantPos)
                        : [];
                      return data.coAuthors.map((author, idx) => {
                        const pos = author.authorPosition || derivedPositions[idx] || (idx + 1);
                        return (
                          <TableRow key={idx} sx={{ '&:hover': { bgcolor: 'rgba(190,147,55,0.04)' } }}>
                            <TableCell>
                              <Box sx={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: 30, height: 30, borderRadius: '50%',
                                bgcolor: 'rgba(190, 147, 55, 0.12)', border: '1.5px solid var(--color-primary)',
                                color: 'var(--color-primary)', fontWeight: 900, fontSize: '0.85rem'
                              }}>
                                {pos}
                              </Box>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "var(--text-primary)" }}>{author.name}</TableCell>
                            <TableCell sx={{ color: "var(--text-secondary)", textTransform: "capitalize" }}>{author.CoAuthorType || "-"}</TableCell>
                            <TableCell sx={{ color: "var(--text-secondary)" }}>{author.affiliation}</TableCell>
                          </TableRow>
                        );
                      });
                    })()}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          )}

          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", mb: 2 }}>
              <AttachFile sx={{ color: "var(--color-primary)" }} />
              <Typography sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Attached Documents</Typography>
            </Box>
            <Stack direction="row" spacing={3} sx={{ flexWrap: "wrap" }} useFlexGap>
              {renderDetailFile("Presentation Certificate", data.certificate)}
              {renderDetailFile("Copy of Proceedings / Abstract Book", data.proceedings)}
            </Stack>
          </Box>

          {(data.hodComment || data.rndComment) && (
            <Box sx={{ mt: 4, display: "flex", flexDirection: "column", gap: 2 }}>
              {data.hodComment && (
                <Box sx={{ p: 2, bgcolor: "rgba(255, 193, 7, 0.05)", borderRadius: "10px", border: "1px solid rgba(255, 193, 7, 0.2)" }}>
                  <Typography variant="caption" sx={{ fontWeight: 900, color: "#ff9800", textTransform: "uppercase" }}>HOD Remarks</Typography>
                  <Typography variant="body2" sx={{ fontStyle: "italic", mt: 0.5, color: "var(--text-secondary)" }}>"{data.hodComment}"</Typography>
                </Box>
              )}
              {data.rndComment && (
                <Box sx={{ p: 2, bgcolor: "rgba(76, 175, 80, 0.05)", borderRadius: "10px", border: "1px solid rgba(76, 175, 80, 0.2)" }}>
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
        title="Conference Publications"
        subtitle="Manage and submit your conference publications"
        onBack={viewMode !== "list" ? () => setViewMode("list") : undefined}
      />

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
