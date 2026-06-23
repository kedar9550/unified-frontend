import Loader from "../../components/common/Loader";
import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Button,
  MenuItem,
  Select,
  Typography,
  CircularProgress,
  Grid,
  Card,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  IconButton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
} from "@mui/material";
import { toast } from "sonner";
import {
  Flag as FlagIcon,
  CloudUpload as CloudUploadIcon,
  SupervisorAccount,
  PeopleAlt,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from "@mui/icons-material";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import PageHeader from "../../components/common/PageHeader";
import SectionHeader from "../../components/common/SectionHeader";
import DataTable from "../../components/data/DataTable";
import RaiseDiscrepancyModal from "../../components/faculty/RaiseDiscrepancyModal";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

export default function Teaching() {
  const { user } = useAuth();

  // ── Academic Year state ──────────────────────────────────────────
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYearLabel, setSelectedYearLabel] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("ALL");

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

  // ── Results state ────────────────────────────────────────────────
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // ── Proctor state ────────────────────────────────────────────────
  const [proctorStats, setProctorStats] = useState(null);
  const [proctorLoading, setProctorLoading] = useState(false);

  // ── Feedback state ──────────────────────────────────────────────
  const [feedbackResults, setFeedbackResults] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // ── Discrepancy modal state ──────────────────────────────────────
  const [discOpen, setDiscOpen] = useState(false);

  // ── CO Attainment state ─────────────────────────────────────────
  const [coAttainmentResults, setCoAttainmentResults] = useState([]);
  const [coAttainmentLoading, setCoAttainmentLoading] = useState(false);

  const fileInputRef = useRef(null);
  const [uploadingCSV, setUploadingCSV] = useState(false);

  // ── Manual Proctoring Entry state ─────────────────────────────────
  const [manualEntries, setManualEntries] = useState([]);
  const [manualLoading, setManualLoading] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [semesterNumber, setSemesterNumber] = useState("");
  const [yearNumber, setYearNumber] = useState("");
  const [section, setSection] = useState("");
  const [totalStudents, setTotalStudents] = useState("");
  const [eligibleStudents, setEligibleStudents] = useState("");
  const [passedStudents, setPassedStudents] = useState("");
  const [submittingManual, setSubmittingManual] = useState(false);
  const [isProctorModalOpen, setIsProctorModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  // 1. Fetch Academic Years on mount
  useEffect(() => {
    const fetchYears = async () => {
      try {
        // Fetch all academic years
        const res = await API.get("/api/academic-years");
        let years = [];
        if (Array.isArray(res.data)) years = res.data;
        else if (res.data.years) years = res.data.years;
        else if (res.data.data) years = res.data.data;

        setAcademicYears(years);

        // Set active year as default if selectedYearLabel is empty
        if (years.length > 0 && !selectedYearLabel) {
          const active = years.find(y => y.isGlobalActive);
          setSelectedYearLabel(active ? active.year : years[0].year);
        }
      } catch (err) {
        console.error("Error fetching academic years:", err);
      }
    };

    const fetchPrograms = async () => {
      try {
        const res = await API.get("/api/academics/programs?status=true");
        if (res.data?.success) {
          setPrograms(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching programs:", err);
      }
    };

    fetchYears();
    fetchPrograms();
  }, []);

  // Fetch branches for selected program
  useEffect(() => {
    const fetchBranches = async () => {
      if (!selectedProgramId) {
        setBranches([]);
        setSelectedBranchId("");
        return;
      }
      try {
        const res = await API.get(`/api/academics/branches?programId=${selectedProgramId}&status=true`);
        if (res.data?.success) {
          setBranches(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching branches:", err);
      }
    };
    fetchBranches();
  }, [selectedProgramId]);


  // 2. Fetch Results for this faculty when filters change
  useEffect(() => {
    if (!selectedYearLabel || !user?.institutionId) return;
    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await API.get("/api/faculty-subject-results", {
          params: {
            facultyId: user?.institutionId,
            academicYear: selectedYearLabel,
            semester: selectedSemester === "ALL" ? undefined : selectedSemester,
          },
        });
        setResults(res.data || []);
      } catch (err) {
        console.error("Error fetching results:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchProctorStats = async () => {
      const yearDoc = academicYears.find(y => y.year === selectedYearLabel);
      if (!yearDoc?._id) return;

      setProctorLoading(true);
      try {
        const res = await API.get("/api/student-results/proctor-results", {
          params: {
            facultyId: user?.institutionId,
            academicYearId: yearDoc._id,
          },
        });
        setProctorStats(res.data);
      } catch (err) {
        console.error("Error fetching proctor stats:", err);
      } finally {
        setProctorLoading(false);
      }
    };

    const fetchFeedbackStats = async () => {
      setFeedbackLoading(true);
      try {
        const res = await API.get("/api/faculty-feedback-results", {
          params: {
            facultyId: user?.institutionId,
            academicYear: selectedYearLabel,
            semester: selectedSemester === "ALL" ? undefined : selectedSemester,
          },
        });
        setFeedbackResults(res.data || []);
      } catch (err) {
        console.error("Error fetching feedback stats:", err);
      } finally {
        setFeedbackLoading(false);
      }
    };

    const fetchCoAttainmentStats = async () => {
      setCoAttainmentLoading(true);
      try {
        const res = await API.get("/api/faculty-subject-results/co-attainment", {
          params: {
            facultyId: user?.institutionId,
            academicYear: selectedYearLabel,
            semester: selectedSemester === "ALL" ? undefined : selectedSemester,
          },
        });
        setCoAttainmentResults(res.data || []);
      } catch (err) {
        console.error("Error fetching CO attainment stats:", err);
        setCoAttainmentResults([]);
      } finally {
        setCoAttainmentLoading(false);
      }
    };

    fetchResults();
    fetchProctorStats();
    fetchFeedbackStats();
    fetchCoAttainmentStats();
    fetchManualEntries();
  }, [selectedYearLabel, user?.institutionId, selectedSemester]);

  const fetchManualEntries = async () => {
    setManualLoading(true);
    try {
      const res = await API.get("/api/faculty-proctoring/my-entries");
      if (res.data?.success) {
        setManualEntries(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching manual proctoring entries:", err);
    } finally {
      setManualLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingEntry(null);
    setSelectedProgramId("");
    setSelectedBranchId("");
    setSemesterNumber("");
    setYearNumber("");
    setSection("");
    setTotalStudents("");
    setEligibleStudents("");
    setPassedStudents("");
    setIsProctorModalOpen(true);
  };

  const handleOpenEditModal = (entry) => {
    setEditingEntry(entry);
    setSelectedProgramId(entry.programId?._id || entry.programId);
    setSelectedBranchId(entry.branchId?._id || entry.branchId);
    setSemesterNumber(entry.semesterNumber !== null && entry.semesterNumber !== undefined ? entry.semesterNumber.toString() : "");
    setYearNumber(entry.yearNumber !== null && entry.yearNumber !== undefined ? entry.yearNumber.toString() : "");
    setSection(entry.section !== null && entry.section !== undefined ? entry.section.toString() : "");
    setTotalStudents(entry.totalStudents !== null && entry.totalStudents !== undefined ? entry.totalStudents.toString() : "");
    setEligibleStudents(entry.eligibleStudents !== null && entry.eligibleStudents !== undefined ? entry.eligibleStudents.toString() : "");
    setPassedStudents(entry.passedStudents !== null && entry.passedStudents !== undefined ? entry.passedStudents.toString() : "");
    setIsProctorModalOpen(true);
  };

  const handleDeleteEntry = async (id) => {
    if (!window.confirm("Are you sure you want to delete this proctoring record?")) return;
    try {
      const res = await API.delete(`/api/faculty-proctoring/${id}`);
      if (res.data?.success) {
        toast.success("Proctoring record deleted successfully!");
        fetchManualEntries();
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error(err.response?.data?.message || "Failed to delete record.");
    }
  };

  const handleProctorModalSubmit = async (e) => {
    e.preventDefault();
    const selectedYear = academicYears.find((y) => y.year === selectedYearLabel);
    if (!selectedYear?._id) {
      toast.error("Please select a valid academic year");
      return;
    }

    if (!selectedProgramId) {
      toast.error("Please select a Program");
      return;
    }
    if (!selectedBranchId) {
      toast.error("Please select a Branch");
      return;
    }

    const program = programs.find(p => p._id === selectedProgramId);
    const semVal = program?.programPattern === "YEAR" ? null : parseInt(semesterNumber);
    const yrVal = program?.programPattern === "YEAR" ? parseInt(yearNumber) : null;

    if (program?.programPattern === "YEAR" && (yrVal === null || isNaN(yrVal))) {
      toast.error("Year number must be a valid number");
      return;
    }
    if (program?.programPattern !== "YEAR" && (semVal === null || isNaN(semVal))) {
      toast.error("Semester number must be a valid number");
      return;
    }

    const secVal = parseInt(section);
    if (isNaN(secVal) || secVal < 1) {
      toast.error("Section must be a positive number");
      return;
    }

    const total = parseInt(totalStudents);
    const eligible = parseInt(eligibleStudents);
    const passed = parseInt(passedStudents);

    if (isNaN(total) || isNaN(eligible) || isNaN(passed)) {
      toast.error("Please enter valid student counts");
      return;
    }

    if (total < 0 || eligible < 0 || passed < 0) {
      toast.error("Counts cannot be negative");
      return;
    }

    if (eligible > total) {
      toast.error("Eligible students cannot exceed total allotted students");
      return;
    }

    if (passed > eligible) {
      toast.error("Passed students cannot exceed eligible students");
      return;
    }

    setSubmittingManual(true);
    try {
      const payload = {
        academicYear: selectedYear._id,
        programId: selectedProgramId,
        branchId: selectedBranchId,
        semesterNumber: semVal,
        yearNumber: yrVal,
        section: secVal,
        totalStudents: total,
        eligibleStudents: eligible,
        passedStudents: passed
      };

      let res;
      if (editingEntry) {
        res = await API.put(`/api/faculty-proctoring/${editingEntry._id}`, payload);
      } else {
        res = await API.post("/api/faculty-proctoring", payload);
      }

      if (res.data?.success) {
        toast.success(`Proctoring statistics ${editingEntry ? "updated" : "submitted"} successfully!`);
        setIsProctorModalOpen(false);
        fetchManualEntries();
      }
    } catch (err) {
      console.error("Submit error:", err);
      toast.error(err.response?.data?.message || "Failed to submit proctoring statistics.");
    } finally {
      setSubmittingManual(false);
    }
  };

  // ── CSV Upload Handler ────────────────────────────────────────────
  const handleCSVUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleCSVFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      toast.warning("Please select a CSV file");
      return;
    }

    setUploadingCSV(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("academicYear", selectedYearLabel);

      const res = await API.post("/api/faculty-subject-results/upload-csv", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("CSV uploaded successfully!");

      // Refresh results
      const refreshRes = await API.get("/api/faculty-subject-results", {
        params: {
          facultyId: user?.institutionId,
          academicYear: selectedYearLabel,
        },
      });
      setResults(refreshRes.data || []);
    } catch (err) {
      console.error("Error uploading CSV:", err);
      toast.error(err.response?.data?.message || "Error uploading CSV file");
    } finally {
      setUploadingCSV(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // ── Derive selected labels for display ──────────────────────────
  const selectedYear = academicYears.find((y) => y.year === selectedYearLabel);

  const passPercent = proctorStats?.passPercentage ?? 0;
  const passColor = passPercent >= 80 ? "#10B981" : passPercent >= 60 ? "#F59E0B" : "#EF4444";

  const proctorStatItems = proctorStats
    ? [
      {
        label: "Total Mapped",
        value: proctorStats.totalMappedStudents,
        icon: <PeopleAlt sx={{ fontSize: 20, color: "#3B82F6" }} />,
      },
      {
        label: "Appeared",
        value: proctorStats.studentsAppeared,
        icon: <SupervisorAccount sx={{ fontSize: 20, color: "#8B5CF6" }} />,
      },
      {
        label: "Passed",
        value: proctorStats.studentsPassed,
        icon: <CheckCircleOutlinedIcon sx={{ fontSize: 20, color: "#10B981" }} />,
      },
      {
        label: "Failed",
        value: proctorStats.studentsAppeared - proctorStats.studentsPassed,
        icon: <CancelOutlinedIcon sx={{ fontSize: 20, color: "#EF4444" }} />,
      },
    ]
    : [];

  // ── Build DataTable rows ─────────────────────────────────────────
  const columns = [
    "S.NO",
    "COURSE NAME",
    "COURSE ID",
    "TYPE",
    "SEM - BRANCH - SEC",
    "APPEARED",
    "PASSED",
    "PASS %",
  ];

  const rows = results.map((r, i) => {
    const passPercent = Number(r.passPercentage);
    const color = passPercent >= 80 ? "#10B981" : passPercent >= 60 ? "#F59E0B" : "#EF4444";
    const gradient = passPercent >= 80
      ? "linear-gradient(90deg, #10B981 0%, #059669 100%)"
      : passPercent >= 60
        ? "linear-gradient(90deg, #F59E0B 0%, #D97706 100%)"
        : "linear-gradient(90deg, #EF4444 0%, #B91C1C 100%)";
    const textGradient = passPercent >= 80
      ? "linear-gradient(135deg, #10B981 0%, #059669 100%)"
      : passPercent >= 60
        ? "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
        : "linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)";

    return [
      {
        value: i + 1,
        display: <Box sx={{ fontWeight: 600 }}>{i + 1}</Box>,
      },
      {
        value: r.courseName,
        display: (
          <Box sx={{ textAlign: "start" }}>
            <Typography sx={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{r.courseName}</Typography>
            <Typography sx={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 500 }}>{r.courseCode}</Typography>
          </Box>
        ),
      },
      {
        value: r.courseCode,
        display: <Box sx={{ fontWeight: 600, color: "var(--text-secondary)" }}>{r.courseCode}</Box>,
      },
      {
        value: r.courseType,
        display: (
          <Box sx={{ px: 1.2, py: 0.5, borderRadius: '8px', bgcolor: 'var(--bg-glass)', border: '1px solid var(--border-color)', fontSize: 10, fontWeight: 800, color: "var(--text-primary)", display: 'inline-block' }}>
            {r.courseType?.toUpperCase() || "—"}
          </Box>
        ),
      },
      {
        value: `${r.semesterDisplay || r.semester || "—"} ${r.branchCode || r.branch} - SEC ${r.section}`,
        display: (
          <Box sx={{ whiteSpace: "nowrap" }}>
            <Typography sx={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>
              {r.semesterDisplay || r.semester || "—"} {r.branchCode || r.branch} - SEC {r.section}
            </Typography>
          </Box>
        ),
      },
      {
        value: r.appeared,
        display: (
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>{r.appeared}</Typography>
          </Box>
        ),
      },
      {
        value: r.passed,
        display: (
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: 16, fontWeight: 800, color: "#10B981" }}>{r.passed}</Typography>
          </Box>
        ),
      },
      {
        value: passPercent,
        display: (
          <Box sx={{ textAlign: 'center', minWidth: 100 }}>
            <Typography sx={{
              fontSize: 18, fontWeight: 900,
              background: textGradient,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              lineHeight: 1
            }}>
              {passPercent.toFixed(1)}%
            </Typography>
            <Box sx={{ mt: 1, height: 8, bgcolor: 'var(--border-color)', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative' }}>
              <Box sx={{ width: `${passPercent}%`, height: '100%', background: gradient, borderRadius: 4, transition: 'width 1s ease-in-out' }} />
              <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '50%', background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 100%)' }} />
            </Box>
          </Box>
        ),
      },
    ];
  });

  // ── Build Feedback DataTable rows ─────────────────────────────────────────
  const feedbackColumns = [
    "S.NO",
    "COURSE NAME",
    "TYPE",
    "SEM - BRANCH - SEC",
    "PHASE",
    "GIVEN / TOTAL",
    "PERCENTAGE",
  ];

  const feedbackRows = feedbackResults.map((r, i) => {
    return [
      {
        value: i + 1,
        display: <Box sx={{ fontWeight: 600 }}>{i + 1}</Box>,
      },
      {
        value: r.subjectName,
        display: (
          <Box sx={{ textAlign: "start" }}>
            <Typography sx={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{r.subjectName}</Typography>
            <Typography sx={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 500 }}>{r.subjectCode}</Typography>
          </Box>
        ),
      },
      {
        value: r.subjectType || "—",
        display: (
          <Box sx={{
            px: 1.2,
            py: 0.5,
            borderRadius: '8px',
            bgcolor: 'var(--bg-glass)',
            border: '1px solid var(--border-color)',
            fontSize: 10,
            fontWeight: 800,
            color: "var(--text-primary)",
            display: 'inline-block',
            textTransform: 'capitalize'
          }}>
            {r.subjectType || "—"}
          </Box>
        ),
      },
      {
        value: `${r.semesterDisplay || "—"} ${r.branchCode || r.branch || "—"} - SEC ${r.section || "—"}`,
        display: (
          <Box sx={{ whiteSpace: "nowrap" }}>
            <Typography sx={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>
              {r.semesterDisplay || "—"} {r.branchCode || r.branch || "—"} - SEC {r.section || "—"}
            </Typography>
          </Box>
        ),
      },
      {
        value: r.phase,
        display: (
          <Box sx={{
            px: 1.5, py: 0.3, borderRadius: "20px",
            background: r.phase === 1 ? "rgba(245, 158, 11, 0.1)" : "rgba(139, 92, 246, 0.1)",
            color: r.phase === 1 ? "#d97706" : "#7c3aed",
            fontSize: 10, fontWeight: 900, textAlign: "center", display: "inline-block"
          }}>
            PH {r.phase || "—"}
          </Box>
        ),
      },
      {
        value: r.givenStudents,
        display: (
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>{r.givenStudents}</Typography>
            <Typography sx={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 700 }}>OF {r.totalStudents}</Typography>
          </Box>
        ),
      },
      {
        value: r.percentage,
        display: (
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: 16, fontWeight: 800, color: "var(--text-secondary)" }}>{Number(r.percentage).toFixed(1)}%</Typography>
          </Box>
        ),
      },
    ];
  });

  // ── Build CO Attainment DataTable rows ─────────────────────────────────────────
  const coAttainmentColumns = [
    "S.NO",
    "COURSE NAME",
    "SEM - BRANCH - SEC",
    "NO. OF COs",
    "COs ATTAINMENT",
    "ATTAINMENT %",
  ];

  const coAttainmentRows = coAttainmentResults.map((r, i) => {
    const attainmentPercent = r.noOfCos > 0 ? (r.noOfCosAttained / r.noOfCos) * 100 : 0;
    const color = attainmentPercent >= 80 ? "#10B981" : attainmentPercent >= 60 ? "#F59E0B" : "#EF4444";
    const gradient = attainmentPercent >= 80
      ? "linear-gradient(90deg, #10B981 0%, #059669 100%)"
      : attainmentPercent >= 60
        ? "linear-gradient(90deg, #F59E0B 0%, #D97706 100%)"
        : "linear-gradient(90deg, #EF4444 0%, #B91C1C 100%)";
    const textGradient = attainmentPercent >= 80
      ? "linear-gradient(135deg, #10B981 0%, #059669 100%)"
      : attainmentPercent >= 60
        ? "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
        : "linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)";

    return [
      {
        value: i + 1,
        display: <Box sx={{ fontWeight: 600 }}>{i + 1}</Box>,
      },
      {
        value: r.courseName,
        display: (
          <Box sx={{ textAlign: "start" }}>
            <Typography sx={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{r.courseName}</Typography>
            <Typography sx={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 500 }}>{r.courseCode}</Typography>
          </Box>
        ),
      },
      {
        value: `${r.semesterDisplay || r.semester || "—"} ${r.branchCode || r.branch} - SEC ${r.section}`,
        display: (
          <Box sx={{ whiteSpace: "nowrap" }}>
            <Typography sx={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>
              {r.semesterDisplay || r.semester || "—"} {r.branchCode || r.branch} - SEC {r.section}
            </Typography>
          </Box>
        ),
      },
      {
        value: r.noOfCos,
        display: (
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>{r.noOfCos}</Typography>
          </Box>
        ),
      },
      {
        value: r.noOfCosAttained,
        display: (
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: 18, fontWeight: 800, color: "#10B981" }}>{r.noOfCosAttained}</Typography>
          </Box>
        ),
      },
      {
        value: attainmentPercent,
        display: (
          <Box sx={{ textAlign: 'center', minWidth: 100 }}>
            <Typography sx={{
              fontSize: 20, fontWeight: 900,
              background: textGradient,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              lineHeight: 1
            }}>
              {attainmentPercent.toFixed(1)}%
            </Typography>
            <Box sx={{ mt: 1, height: 8, bgcolor: 'var(--border-color)', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative' }}>
              <Box sx={{ width: `${attainmentPercent}%`, height: '100%', background: gradient, borderRadius: 4, transition: 'width 1s ease-in-out' }} />
              <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '50%', background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)' }} />
            </Box>
          </Box>
        ),
      },
    ];
  });

  // ── Build Proctoring DataTable rows ─────────────────────────────────────────
  const proctorColumns = [
    "S.NO",
    "SEMESTER PERIOD",
    "TOTAL",
    "APPEARED",
    "PASSED",
    "FAILED",
    "PASS %",
  ];

  const proctorRows = (() => {
    if (!proctorStats?.details) return [];
    const aggregated = proctorStats.details
      .filter(d => selectedSemester === "ALL" || d.semesterType === selectedSemester)
      .reduce((acc, curr) => {
        const type = curr.semesterType === "ODD" ? "ODD SEMESTER" : curr.semesterType === "EVEN" ? "EVEN SEMESTER" : "OTHER";
        if (!acc[type]) {
          acc[type] = { label: type, totalMapped: 0, appeared: 0, passed: 0, failed: 0 };
        }
        acc[type].totalMapped += (curr.totalMappedStudents || 0);
        acc[type].appeared += (curr.studentsAppeared || 0);
        acc[type].passed += (curr.studentsPassed || 0);
        acc[type].failed += (curr.studentsAppeared || 0) - (curr.studentsPassed || 0);
        return acc;
      }, {});

    return Object.values(aggregated).map((row, i) => {
      const passPercent = row.appeared > 0 ? Math.round((row.passed / row.appeared) * 100) : 0;
      const color = passPercent >= 80 ? "#10B981" : passPercent >= 60 ? "#F59E0B" : "#EF4444";
      const gradient = passPercent >= 80
        ? "linear-gradient(90deg, #10B981 0%, #059669 100%)"
        : passPercent >= 60
          ? "linear-gradient(90deg, #F59E0B 0%, #D97706 100%)"
          : "linear-gradient(90deg, #EF4444 0%, #B91C1C 100%)";
      const textGradient = passPercent >= 80
        ? "linear-gradient(135deg, #10B981 0%, #059669 100%)"
        : passPercent >= 60
          ? "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
          : "linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)";

      return [
        {
          value: i + 1,
          display: <Box sx={{ fontWeight: 600 }}>{i + 1}</Box>,
        },
        {
          value: row.label,
          display: <Typography sx={{ fontWeight: 800, fontSize: 15, color: "var(--text-primary)" }}>{row.label}</Typography>,
        },
        {
          value: row.totalMapped,
          display: (
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: 22, fontWeight: 800, color: "#3B82F6", lineHeight: 1 }}>{row.totalMapped}</Typography>
              <Typography sx={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 700, mt: 0.5 }}>STUDENTS</Typography>
            </Box>
          ),
        },
        {
          value: row.appeared,
          display: (
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: 22, fontWeight: 800, color: "#8B5CF6", lineHeight: 1 }}>{row.appeared}</Typography>
              <Typography sx={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 700, mt: 0.5 }}>STUDENTS</Typography>
            </Box>
          ),
        },
        {
          value: row.passed,
          display: (
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: 22, fontWeight: 800, color: "#10B981", lineHeight: 1 }}>{row.passed}</Typography>
              <Box sx={{ mt: 0.5, px: 1, py: 0.2, borderRadius: '10px', bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', fontWeight: 800, fontSize: 10 }}>
                PASSED
              </Box>
            </Box>
          ),
        },
        {
          value: row.failed,
          display: (
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: 22, fontWeight: 800, color: "#EF4444", lineHeight: 1 }}>{row.failed}</Typography>
              <Box sx={{ mt: 0.5, px: 1, py: 0.2, borderRadius: '10px', bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', fontWeight: 800, fontSize: 10 }}>
                FAILED
              </Box>
            </Box>
          ),
        },
        {
          value: passPercent,
          display: (
            <Box sx={{ textAlign: 'center', minWidth: 120 }}>
              <Typography sx={{
                fontSize: 22, fontWeight: 900,
                background: textGradient,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                lineHeight: 1
              }}>
                {passPercent}%
              </Typography>
              <Box sx={{ mt: 1, height: 8, bgcolor: 'var(--border-color)', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative' }}>
                <Box sx={{ width: `${passPercent}%`, height: '100%', background: gradient, borderRadius: 4, transition: 'width 1s ease-in-out' }} />
                <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '50%', background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)' }} />
              </Box>
              <Typography sx={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 700, mt: 0.5 }}>({row.passed}/{row.appeared})</Typography>
            </Box>
          ),
        },
      ];
    });
  })();

  const selectedYearDocForProctoring = academicYears.find((y) => y.year === selectedYearLabel);
  const filteredManualProctoringEntries = selectedYearDocForProctoring
    ? manualEntries.filter(
      (entry) => String(entry.academicYear?._id || entry.academicYear) === String(selectedYearDocForProctoring._id)
    )
    : [];

  const manualProctorColumns = [
    "S.NO",
    "PROGRAM",
    "SEM/YR - BRANCH - SEC",
    "TOTAL ALLOTTED",
    "ELIGIBLE (A)",
    "PASSED (B)",
    "PASS %",
  ];

  const manualProctorRows = filteredManualProctoringEntries.map((entry, i) => {
    const progName = entry.programId?.code || "—";
    const isYearProg = entry.programId?.programPattern === "YEAR";
    const branchDisplay = entry.branchId?.code || "—";
    const semYrBranchSec = isYearProg
      ? `YEAR-${entry.yearNumber || "—"} ${branchDisplay} - SEC ${entry.section}`
      : `SEM-${entry.semesterNumber || "—"} ${branchDisplay} - SEC ${entry.section}`;
    const passPct = entry.passPercentage !== undefined ? entry.passPercentage.toFixed(2) : "0.00";

    return [
      {
        value: i + 1,
        display: <Box sx={{ fontWeight: 600 }}>{i + 1}</Box>,
      },
      {
        value: progName,
        display: <Box sx={{ fontWeight: 600, color: "var(--text-primary)" }}>{progName}</Box>,
      },
      {
        value: semYrBranchSec,
        display: <Box sx={{ color: "var(--text-primary)" }}>{semYrBranchSec}</Box>,
      },
      {
        value: entry.totalStudents || 0,
        display: <Box sx={{ color: "var(--text-primary)" }}>{entry.totalStudents}</Box>,
      },
      {
        value: entry.eligibleStudents || 0,
        display: <Box sx={{ color: "#8B5CF6", fontWeight: 600 }}>{entry.eligibleStudents}</Box>,
      },
      {
        value: entry.passedStudents || 0,
        display: <Box sx={{ color: "#10B981", fontWeight: 600 }}>{entry.passedStudents}</Box>,
      },
      {
        value: parseFloat(passPct),
        display: <Box sx={{ color: "var(--color-primary)", fontWeight: 800 }}>{passPct}%</Box>,
      },
    ];
  });

  return (
    <Box>
      {/* ── PAGE HEADER ────────────────────────────────────── */}
      <PageHeader
        title="Teaching Dashboard"
        subtitle="Manage courses, performance, and student outcomes" action={
          <Button
 onClick={() => setDiscOpen(true)}
 startIcon={<FlagIcon />}
 sx={{
 
 px: 3,
 py: 1,
 textTransform: "none",
 fontWeight: 600,
 fontSize: 14,
 background: "linear-gradient(135deg,#e53935,#ff7043)",
 color: "#fff",
 boxShadow: "0 4px 15px rgba(229,57,53,0.3)",
 "&:hover": {
 background: "linear-gradient(135deg,#c62828,#e64a19)" } }}
 >
            Raise Discrepancy
          </Button>
        }
      />

      {/* ── FILTERS : Academic Year + Semester ─────────────── */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          mb: 3,
          alignItems: "center",
          justifyContent: { xs: "center", sm: "flex-start" },
          flexWrap: "wrap",
        }}
      >
        {/* Academic Year */}
        <Box sx={{ ...filterBox, width: { xs: "100%", sm: "auto" }, justifyContent: { xs: "space-between", sm: "flex-start" } }}>
          <Typography
            sx={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", mr: 1, textTransform: "uppercase", letterSpacing: "0.05em" }}
          >
            Academic Year
          </Typography>
          <Select
            variant="standard"
            disableUnderline
            value={selectedYearLabel}
            onChange={(e) => {
              setSelectedYearLabel(e.target.value);
              blurActiveElement();
            }}
            onClose={blurActiveElement}
            MenuProps={selectMenuProps}
            sx={{ minWidth: 120, fontSize: 14, color: "var(--text-primary)", fontWeight: 600, "& .MuiSelect-icon": { color: "var(--text-secondary)" } }}
          >
            {[...new Set(academicYears.map(y => y.year))].map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </Box>


        {/* Active year pill */}
        {selectedYear && (
          <Box
            sx={{
              px: 3,
              py: 0.8,
              borderRadius: "50px",
              background: "var(--gradient-primary)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              boxShadow: "0 4px 12px rgba(0, 78, 146, 0.2)",
              letterSpacing: "0.5px"
            }}
          >
            {selectedYear.year} — {selectedSemester === "ALL" ? "All Semesters" : `${selectedSemester} Semester`}
          </Box>
        )}
      </Box>

      {/* ── SECTION : Teaching ─────────────────────────────── */}
      <Box sx={sectionCard}>
        <SectionHeader title="SECTION : Teaching" />

        <Typography
          variant="h6"
          fontWeight={700}
          sx={{ mb: 2, color: "var(--text-primary)", fontSize: 16 }}
        >
          Course Average Pass Percentage
        </Typography>

        {results.length === 0 ? (
          <Box
            sx={{
              textAlign: "center",
              py: 8,
              color: "var(--text-secondary)",
              fontSize: 15,
              background: "var(--bg-glass)",
              borderRadius: "16px",
              border: "1px dashed var(--border-color)"
            }}
          >
            No results found for the selected Academic Year &amp; Semester.
            <br />
            <span style={{ fontSize: 13, opacity: 0.8, fontWeight: 500 }}>
              Results are uploaded by the Exam Admin via the Faculty Format CSV.
            </span>
          </Box>
        ) : (
          <DataTable columns={columns} rows={rows} defaultRowsPerPage={5} />
        )}
      </Box>

      {/* ── SECTION : Proctoring (Hidden for current appraisal cycle) ────────────────────────────── */}
      {/*
      <Box sx={sectionCard}>
        <SectionHeader title="SECTION : Proctoring" />

        {proctorLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
            <Loader size={32} />
          </Box>
        ) : proctorRows.length === 0 ? (
          <Box
            sx={{
              textAlign: "center",
              py: 6,
              color: "var(--text-secondary)",
              fontSize: 15,
              border: "1px dashed var(--border-color)",
              borderRadius: "16px",
              background: "var(--bg-glass)",
            }}
          >
            <Typography fontSize={36} sx={{ mb: 1 }}>👨‍🏫</Typography>
            No proctoring data available for this selection.
          </Box>
        ) : (
          <DataTable columns={proctorColumns} rows={proctorRows} />
        )}
      </Box>
      */}

      <Box sx={sectionCard}>
        <SectionHeader
          title="SECTION : Proctoring Students' Average Pass Percentage"
        />

        {manualLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
            <CircularProgress size={32} sx={{ color: "var(--color-primary)" }} />
          </Box>
        ) : filteredManualProctoringEntries.length === 0 ? (
          <Box
            sx={{
              textAlign: "center",
              py: 6,
              color: "var(--text-secondary)",
              fontSize: 15,
              border: "1px dashed var(--border-color)",
              borderRadius: "16px",
              background: "var(--bg-glass)",
              mb: 3
            }}
          >
            No proctoring records found for this academic cycle.
          </Box>
        ) : (
          <DataTable columns={manualProctorColumns} rows={manualProctorRows} defaultRowsPerPage={5} />
        )}
      </Box>




      {/* ── SECTION : Feedback ────────────────────────────── */}
      <Box sx={sectionCard}>
        <SectionHeader title="SECTION : Feedback" />

        <Typography
          variant="h6"
          fontWeight={700}
          sx={{ mb: 2, color: "var(--text-primary)", fontSize: 16 }}
        >
          Faculty Feedback Results
        </Typography>

        {feedbackLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <Loader />
          </Box>
        ) : feedbackResults.length === 0 ? (
          <Box
            sx={{
              textAlign: "center",
              py: 6,
              color: "var(--text-secondary)",
              fontSize: 15,
              border: "1px dashed var(--border-color)",
              borderRadius: "16px",
              background: "var(--bg-glass)"
            }}
          >
            No feedback results available for this selection.
          </Box>
        ) : (
          <DataTable columns={feedbackColumns} rows={feedbackRows} defaultRowsPerPage={5} />
        )}
      </Box>

      {/* ── SECTION : CO Attainment ────────────────────────── */}
      <Box sx={sectionCard}>
        <SectionHeader title="SECTION : CO Attainment" />

        <Typography
          variant="h6"
          fontWeight={700}
          sx={{ mb: 2, color: "var(--text-primary)", fontSize: 16 }}
        >
          CO Attainment Results
        </Typography>

        {coAttainmentLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <Loader />
          </Box>
        ) : coAttainmentResults.length === 0 ? (
          <Box
            sx={{
              textAlign: "center",
              py: 6,
              color: "var(--text-secondary)",
              fontSize: 15,
              border: "1px dashed var(--border-color)",
              borderRadius: "16px",
              background: "var(--bg-glass)"
            }}
          >
            No CO Attainment results available for this selection.
          </Box>
        ) : (
          <DataTable columns={coAttainmentColumns} rows={coAttainmentRows} defaultRowsPerPage={5} />
        )}
      </Box>

      {/* ── RAISE DISCREPANCY MODAL ──────────────────────── */}
      <RaiseDiscrepancyModal
        open={discOpen}
        onClose={(refresh) => setDiscOpen(false)}
        academicYears={academicYears}
        defaultYearId={selectedYear?._id}
      />
    </Box>
  );
}

// ── Styles ──────────────────────────────────────────────────────────

const filterBox = {
  display: "flex",
  alignItems: "center",
  px: 2,
  py: 1,
  borderRadius: "14px",
  background: "var(--bg-glass)",
  backdropFilter: "blur(10px)",
  boxShadow: "var(--shadow-premium)",
  border: "1px solid var(--border-color)",
  fontSize: 14,
};

const sectionCard = {
  p: { xs: 3, md: 4 },
  borderRadius: "20px",
  background: "var(--bg-panel)",
  backdropFilter: "blur(12px)",
  boxShadow: "var(--shadow-premium)",
  border: "1px solid var(--border-color)",
  mb: 3,
  position: "relative",
  overflow: "hidden",
  "&::after": {
    content: '""',
    position: "absolute",
    top: 0,
    right: 0,
    width: "140px",
    height: "140px",
    background: "radial-gradient(circle at top right, var(--color-primary-alpha, rgba(2, 132, 199, 0.1)), transparent 70%)",
    zIndex: 0,
    pointerEvents: "none"
  }
};

const tableHeaderStyle = {
  fontSize: 12,
  fontWeight: 800,
  color: "var(--text-secondary)",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

