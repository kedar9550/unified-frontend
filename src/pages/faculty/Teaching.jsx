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
} from "@mui/material";
import { toast } from "sonner";
import { 
  Flag as FlagIcon, 
  CloudUpload as CloudUploadIcon,
  SupervisorAccount,
  PeopleAlt
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

        // Set first year as default if selectedYearLabel is empty
        if (years.length > 0 && !selectedYearLabel) {
          setSelectedYearLabel(years[0].year);
        }
      } catch (err) {
        console.error("Error fetching academic years:", err);
      }
    };
    fetchYears();
  }, []);


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
  }, [selectedYearLabel, user?.institutionId, selectedSemester]);

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

      // TODO: Update this to your actual CSV upload endpoint
      const res = await API.post("/api/faculty-subject-results/upload-csv", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("CSV uploaded successfully:", res.data);
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
          <Box>
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
        value: `${r.semesterDisplay || r.semester || "—"} - ${r.branch} - ${r.section}`,
        display: (
          <Box sx={{ whiteSpace: "nowrap" }}>
            <Typography sx={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>{r.semesterDisplay || r.semester || "—"}</Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
              <Typography sx={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 600 }}>{r.branch}</Typography>
              <Typography sx={{ fontSize: 11, color: "var(--color-primary)", fontWeight: 800 }}>• SEC {r.section}</Typography>
            </Box>
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
    "SEM - BRANCH - SEC",
    "PHASE",
    "GIVEN / TOTAL",
    "PERCENTAGE",
    "OVERALL %",
  ];

  const feedbackRows = feedbackResults.map((r, i) => {
    const feedbackPercent = Number(r.overallPercentage);
    const color = feedbackPercent >= 90 ? "#10B981" : feedbackPercent >= 75 ? "#3B82F6" : feedbackPercent >= 60 ? "#F59E0B" : "#EF4444";
    const gradient = feedbackPercent >= 90 
      ? "linear-gradient(90deg, #10B981 0%, #059669 100%)"
      : feedbackPercent >= 75
        ? "linear-gradient(90deg, #3B82F6 0%, #2563EB 100%)"
        : feedbackPercent >= 60
          ? "linear-gradient(90deg, #F59E0B 0%, #D97706 100%)"
          : "linear-gradient(90deg, #EF4444 0%, #B91C1C 100%)";
    const textGradient = feedbackPercent >= 90
      ? "linear-gradient(135deg, #10B981 0%, #059669 100%)"
      : feedbackPercent >= 75
        ? "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)"
        : feedbackPercent >= 60
          ? "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
          : "linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)";
    
    return [
      {
        value: i + 1,
        display: <Box sx={{ fontWeight: 600 }}>{i + 1}</Box>,
      },
      {
        value: r.subjectName,
        display: (
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{r.subjectName}</Typography>
            <Typography sx={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 500 }}>{r.subjectCode}</Typography>
          </Box>
        ),
      },
      {
        value: `${r.semesterDisplay || "—"} - ${r.branch || "—"} - ${r.section || "—"}`,
        display: (
          <Box sx={{ whiteSpace: "nowrap" }}>
            <Typography sx={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>{r.semesterDisplay || "—"}</Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
              <Typography sx={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 600 }}>{r.branch}</Typography>
              <Typography sx={{ fontSize: 11, color: "var(--color-primary)", fontWeight: 800 }}>• SEC {r.section}</Typography>
            </Box>
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
      {
        value: feedbackPercent,
        display: (
          <Box sx={{ textAlign: 'center', minWidth: 100 }}>
            <Typography sx={{ 
                fontSize: 20, fontWeight: 900, 
                background: textGradient,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                lineHeight: 1 
            }}>
              {feedbackPercent.toFixed(1)}%
            </Typography>
            <Box sx={{ mt: 1, height: 8, bgcolor: 'var(--border-color)', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative' }}>
              <Box sx={{ width: `${feedbackPercent}%`, height: '100%', background: gradient, borderRadius: 4, transition: 'width 1s ease-in-out' }} />
              <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '50%', background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)' }} />
            </Box>
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
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{r.courseName}</Typography>
            <Typography sx={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 500 }}>{r.courseCode}</Typography>
          </Box>
        ),
      },
      {
        value: `${r.semesterDisplay || r.semester || "—"} - ${r.branch} - ${r.section}`,
        display: (
          <Box sx={{ whiteSpace: "nowrap" }}>
            <Typography sx={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>{r.semesterDisplay || r.semester || "—"}</Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
              <Typography sx={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 600 }}>{r.branch}</Typography>
              <Typography sx={{ fontSize: 11, color: "var(--color-primary)", fontWeight: 800 }}>• SEC {r.section}</Typography>
            </Box>
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

  return (
    <Box>
      {/* ── PAGE HEADER ────────────────────────────────────── */}
      <PageHeader
        title="Teaching Dashboard"
        subtitle="Manage courses, performance, and student outcomes"
        breadcrumbs={["Home", "Faculty", "Teaching"]}
        action={
          <Button
            onClick={() => setDiscOpen(true)}
            startIcon={<FlagIcon />}
            sx={{
              borderRadius: "20px",
              px: 3,
              py: 1,
              textTransform: "none",
              fontWeight: 600,
              fontSize: 14,
              background: "linear-gradient(135deg,#e53935,#ff7043)",
              color: "#fff",
              boxShadow: "0 4px 15px rgba(229,57,53,0.3)",
              "&:hover": {
                background: "linear-gradient(135deg,#c62828,#e64a19)",
              },
            }}
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
            onChange={(e) => setSelectedYearLabel(e.target.value)}
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
          <DataTable columns={columns} rows={rows} />
        )}
      </Box>

      {/* ── SECTION : Proctoring ────────────────────────────── */}
      <Box sx={sectionCard}>
        <SectionHeader title="SECTION : Proctoring" />

        {proctorLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
            <CircularProgress size={32} />
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
            <CircularProgress />
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
          <DataTable columns={feedbackColumns} rows={feedbackRows} />
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
            <CircularProgress />
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
          <DataTable columns={coAttainmentColumns} rows={coAttainmentRows} />
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
    zIndex: 0
  }
};

const tableHeaderStyle = {
  fontSize: 12,
  fontWeight: 800,
  color: "var(--text-secondary)",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

