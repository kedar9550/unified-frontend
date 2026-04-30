import { useEffect, useState, useRef } from "react";
import {
  Box,
  Button,
  MenuItem,
  Select,
  Typography,
  CircularProgress,
} from "@mui/material";
import { Flag as FlagIcon, CloudUpload as CloudUploadIcon } from "@mui/icons-material";
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
  const [selectedYearId, setSelectedYearId] = useState("");

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
        const res = await API.get("/api/academic-years");
        const years = res.data.years || [];
        setAcademicYears(years);
        if (years.length > 0) {
          const active = years.find((y) => y.isActive) || years[0];
          setSelectedYearId(active._id);
        }
      } catch (err) {
        console.error("Error fetching academic years:", err);
      }
    };
    fetchYears();
  }, []);

  // 2. Fetch Results for this faculty when filters change
  useEffect(() => {
    if (!selectedYearId || !user?.institutionId) return;
    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await API.get("/api/faculty-subject-results", {
          params: {
            facultyId: user?.institutionId,
            academicYear: selectedYearId,
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
      setProctorLoading(true);
      try {
        const res = await API.get("/api/student-results/proctor-results", {
          params: {
            facultyId: user?.institutionId,
            academicYear: selectedYearId,
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
            academicYear: selectedYearId,
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
            academicYear: selectedYearId,
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
  }, [selectedYearId, user?.institutionId]);

  // ── CSV Upload Handler ────────────────────────────────────────────
  const handleCSVUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleCSVFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      alert("Please select a CSV file");
      return;
    }

    setUploadingCSV(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("academicYearId", selectedYearId);

      // TODO: Update this to your actual CSV upload endpoint
      const res = await API.post("/api/faculty-subject-results/upload-csv", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("CSV uploaded successfully:", res.data);
      // TODO: Add success notification/toast
      // Refresh results
      const refreshRes = await API.get("/api/faculty-subject-results", {
        params: {
          facultyId: user?.institutionId,
          academicYear: selectedYearId,
        },
      });
      setResults(refreshRes.data || []);
    } catch (err) {
      console.error("Error uploading CSV:", err);
      // TODO: Add error notification/toast
      alert("Error uploading CSV file");
    } finally {
      setUploadingCSV(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // ── Derive selected labels for display ──────────────────────────
  const selectedYear = academicYears.find((y) => y._id === selectedYearId);

  // ── Build DataTable rows ─────────────────────────────────────────
  const columns = [
    "S.NO",
    "COURSE NAME",
    "COURSE ID",
    "BRANCH",
    "SEMESTER",
    "NO. OF STUDENTS APPEARED",
    "NO. OF STUDENTS PASSED",
    "PASS PERCENTAGE",
  ];

  const rows = results.map((r, i) => [
    {
      value: i + 1,
      display: <Box sx={{ fontWeight: 600 }}>{i + 1}</Box>,
    },

    {
      value: r.courseName,
      display: <Box sx={{ fontWeight: 500 }}>{r.courseName}</Box>,
    },

    {
      value: r.courseCode,
      display: <Box>{r.courseCode}</Box>,
    },

    {
      value: r.branch,
      display: <Box>{r.branch || "—"}</Box>,
    },
    {
      value: r.semester,
      display: <Box>{r.semester || "—"}</Box>,
    },

    {
      value: r.appeared,
      display: <Box>{r.appeared}</Box>,
    },

    {
      value: r.passed,
      display: <Box>{r.passed}</Box>,
    },

    {
      value: r.passPercentage,
      display: <Box>{Number(r.passPercentage).toFixed(1)}%</Box>,
    },
  ]);

  // ── Build Feedback DataTable rows ─────────────────────────────────────────
  const feedbackColumns = [
    "S.NO",
    "COURSE NAME",
    "COURSE ID",
    "SECTION",
    "PHASE",
    "STUDENTS GIVEN",
    "PERCENTAGE",
    "OVERALL PERCENTAGE",
  ];

  const feedbackRows = feedbackResults.map((r, i) => [
    {
      value: i + 1,
      display: <Box sx={{ fontWeight: 600 }}>{i + 1}</Box>,
    },
    {
      value: r.subjectName,
      display: <Box sx={{ fontWeight: 500 }}>{r.subjectName}</Box>,
    },
    {
      value: r.subjectCode,
      display: <Box>{r.subjectCode}</Box>,
    },
    {
      value: r.section,
      display: <Box>{r.section || "—"}</Box>,
    },
    {
      value: r.phase,
      display: <Box>{r.phase || "—"}</Box>,
    },
    {
      value: r.givenStudents,
      display: <Box>{r.givenStudents} / {r.totalStudents}</Box>,
    },
    {
      value: r.percentage,
      display: <Box sx={{ color: "green", fontWeight: 600 }}>{r.percentage}%</Box>,
    },
    {
      value: r.overallPercentage,
      display: <Box sx={{ color: "blue", fontWeight: 600 }}>{r.overallPercentage}%</Box>,
    },
  ]);

  // ── Build CO Attainment DataTable rows ─────────────────────────────────────────
  const coAttainmentColumns = [
    "S.NO",
    "COURSE NAME",
    "SEM - BRANCH - SEC",
    "NO. OF COs",
    "NO. OF COs ATTAINMENT TARGET REACHED",
  ];

  const coAttainmentRows = coAttainmentResults.map((r, i) => [
    {
      value: i + 1,
      display: <Box sx={{ fontWeight: 600 }}>{i + 1}</Box>,
    },
    {
      value: r.courseName,
      display: (
        <Box>
          <Box sx={{ fontWeight: 500 }}>{r.courseName}</Box>
          <Box sx={{ fontSize: 11, color: "#999" }}>{r.courseCode}</Box>
        </Box>
      ),
    },
    {
      value: `${r.semester}-${r.branch}-${r.section}`,
      display: (
        <Box>
          {r.semester && <Box component="span">{r.semester}</Box>}
          {r.branch && <Box component="span"> — {r.branch}</Box>}
          {r.section && <Box component="span"> — {r.section}</Box>}
        </Box>
      ),
    },
    {
      value: r.noOfCos,
      display: <Box sx={{ fontWeight: 600, textAlign: "center" }}>{r.noOfCos}</Box>,
    },
    {
      value: r.noOfCosAttained,
      display: (
        <Box sx={{ fontWeight: 600, color: r.noOfCosAttained >= r.noOfCos ? "#10b981" : "#f59e0b", textAlign: "center" }}>
          {r.noOfCosAttained} / {r.noOfCos}
        </Box>
      ),
    },
  ]);

  return (
    <>
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
          flexWrap: "wrap",
        }}
      >
        {/* Academic Year */}
        <Box sx={filterBox}>
          <Typography
            sx={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", mr: 1, textTransform: "uppercase", letterSpacing: "0.05em" }}
          >
            Academic Year
          </Typography>
          <Select
            variant="standard"
            disableUnderline
            value={selectedYearId}
            onChange={(e) => setSelectedYearId(e.target.value)}
            sx={{ minWidth: 120, fontSize: 14, color: "var(--text-primary)", fontWeight: 600, "& .MuiSelect-icon": { color: "var(--text-secondary)" } }}
          >
            {academicYears.map((y) => (
              <MenuItem key={y._id} value={y._id}>
                {y.year}
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
              background: "var(--gradient-primary)", // Premium dark blue gradient
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              boxShadow: "0 4px 12px rgba(0, 78, 146, 0.2)",
              letterSpacing: "0.5px"
            }}
          >
            {selectedYear.year} — All Semesters
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

        <Typography
          variant="h6"
          fontWeight={700}
          sx={{ mb: 2, color: "var(--text-primary)", fontSize: 16 }}
        >
          Proctoring Average Pass Percentage
        </Typography>

        {proctorStats?.totalMappedStudents > 0 ? (
            <Box
            sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 3,
                justifyContent: "space-around",
                p: 3,
                border: "1px solid var(--border-color)",
                borderRadius: "16px",
                background: "var(--bg-glass)"
            }}
            >
            <Box sx={{ textAlign: "center" }}>
                <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 700, mb: 1, fontSize: "0.7rem", textTransform: "uppercase" }}>Total Students Managed</Typography>
                <Typography variant="h4" sx={{ color: "var(--color-primary)", fontWeight: 800 }}>{proctorStats.totalMappedStudents}</Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
                <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 700, mb: 1, fontSize: "0.7rem", textTransform: "uppercase" }}>Students Appeared</Typography>
                <Typography variant="h4" sx={{ color: "#f59e0b", fontWeight: 800 }}>{proctorStats.studentsAppeared}</Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
                <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 700, mb: 1, fontSize: "0.7rem", textTransform: "uppercase" }}>Students Passed</Typography>
                <Typography variant="h4" sx={{ color: "#10b981", fontWeight: 800 }}>{proctorStats.studentsPassed}</Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
                <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 700, mb: 1, fontSize: "0.7rem", textTransform: "uppercase" }}>Pass Percentage</Typography>
                <Typography variant="h4" sx={{ color: proctorStats.passPercentage >= 50 ? "#10b981" : "#ef4444", fontWeight: 800 }}>{proctorStats.passPercentage}%</Typography>
            </Box>
            </Box>
        ) : (
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
            No proctoring mapped students or results available for this selection.
            </Box>
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
        defaultYearId={selectedYearId}
      />
    </>
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
  p: 3,
  borderRadius: "20px",
  background: "var(--bg-panel)",
  backdropFilter: "blur(12px)",
  boxShadow: "var(--shadow-premium)",
  border: "1px solid var(--border-color)",
  mb: 3,
};
