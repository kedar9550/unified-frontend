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

  // ── Academic Year / Semester state ──────────────────────────────
  const [academicYears, setAcademicYears] = useState([]);
  const [semesterTypes, setSemesterTypes] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState("");
  const [selectedSemTypeId, setSelectedSemTypeId] = useState("");

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

  // ── CSV Upload state ──────────────────────────────────────────────
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

  // 2. Fetch Semester Types on mount (or when needed)
  useEffect(() => {
    const fetchSemesterTypes = async () => {
      try {
        const res = await API.get("/api/semester-types");
        const sems = res.data.data || [];
        setSemesterTypes(sems);
        if (sems.length > 0) {
          // Default to the first one or a specific active one if we had that logic
          setSelectedSemTypeId(sems[0]._id);
        }
      } catch (err) {
        console.error("Error fetching semester types:", err);
      }
    };
    fetchSemesterTypes();
  }, []);

  // 3. Fetch Results for this faculty when filters change
  useEffect(() => {
    if (!selectedYearId || !selectedSemTypeId) return;
    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await API.get("/api/faculty-subject-results", {
          params: {
            facultyId: user?.institutionId, // institutional ID e.g. FAC2024001
            academicYear: selectedYearId,
            semester: selectedSemTypeId,
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
            semester: selectedSemTypeId,
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
            semester: selectedSemTypeId,
          },
        });
        setFeedbackResults(res.data || []);
      } catch (err) {
        console.error("Error fetching feedback stats:", err);
      } finally {
        setFeedbackLoading(false);
      }
    };

    fetchResults();
    fetchProctorStats();
    fetchFeedbackStats();
  }, [selectedYearId, selectedSemTypeId]);

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
      formData.append("semesterTypeId", selectedSemTypeId);

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
          semester: selectedSemTypeId,
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
  const selectedSem = semesterTypes.find((s) => s._id === selectedSemTypeId);

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
      value: r.subjectName,
      display: <Box sx={{ fontWeight: 500 }}>{r.subjectName}</Box>,
    },

    {
      value: r.subjectCode,
      display: <Box>{r.subjectCode}</Box>,
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
            sx={{ fontSize: 13, fontWeight: 600, color: "#555", mr: 1 }}
          >
            Academic Year
          </Typography>
          <Select
            variant="standard"
            disableUnderline
            value={selectedYearId}
            onChange={(e) => setSelectedYearId(e.target.value)}
            sx={{ minWidth: 120, fontSize: 14 }}
          >
            {academicYears.map((y) => (
              <MenuItem key={y._id} value={y._id}>
                {y.year}
              </MenuItem>
            ))}
          </Select>
        </Box>

        {/* Semester */}
        <Box sx={filterBox}>
          <Typography
            sx={{ fontSize: 13, fontWeight: 600, color: "#555", mr: 1 }}
          >
            Semester
          </Typography>
          <Select
            variant="standard"
            disableUnderline
            value={selectedSemTypeId}
            onChange={(e) => setSelectedSemTypeId(e.target.value)}
            sx={{ minWidth: 80, fontSize: 14 }}
          >
            {semesterTypes.map((s) => (
              <MenuItem key={s._id} value={s._id}>
                {s.name}
              </MenuItem>
            ))}
          </Select>
        </Box>

        {/* Active label pill */}
        {selectedYear && selectedSem && (
          <Box
            sx={{
              px: 2,
              py: 0.6,
              borderRadius: "20px",
              background: "linear-gradient(135deg,#0b5299,#1c6ed5)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {selectedYear.year} — {selectedSem.name}
          </Box>
        )}
      </Box>

      {/* ── SECTION : Teaching ─────────────────────────────── */}
      <Box sx={sectionCard}>
        <SectionHeader title="SECTION : Teaching" />

        <Typography
          variant="h6"
          fontWeight={600}
          sx={{ mb: 2, color: "#0D233B", fontSize: 16 }}
        >
          Course Average Pass Percentage
        </Typography>

        {results.length === 0 ? (
          <Box
            sx={{
              textAlign: "center",
              py: 6,
              color: "#aaa",
              fontSize: 15,
            }}
          >
            No results found for the selected Academic Year &amp; Semester.
            <br />
            <span style={{ fontSize: 13 }}>
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
          fontWeight={600}
          sx={{ mb: 2, color: "#0D233B", fontSize: 16 }}
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
                border: "1.5px solid #e2e8f0",
                borderRadius: "14px",
                background: "#f8fafc"
            }}
            >
            <Box sx={{ textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary" fontWeight={600} mb={1}>Total Students Managed</Typography>
                <Typography variant="h4" color="primary" fontWeight={700}>{proctorStats.totalMappedStudents}</Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary" fontWeight={600} mb={1}>Students Passed</Typography>
                <Typography variant="h4" color="#10b981" fontWeight={700}>{proctorStats.studentsPassed}</Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary" fontWeight={600} mb={1}>Pass Percentage</Typography>
                <Typography variant="h4" color={proctorStats.passPercentage >= 50 ? "#10b981" : "#ef4444"} fontWeight={700}>{proctorStats.passPercentage}%</Typography>
            </Box>
            </Box>
        ) : (
            <Box
            sx={{
                textAlign: "center",
                py: 6,
                color: "#aaa",
                fontSize: 15,
                border: "1.5px dashed #d0d9e8",
                borderRadius: "14px",
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
          fontWeight={600}
          sx={{ mb: 2, color: "#0D233B", fontSize: 16 }}
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
                color: "#aaa",
                fontSize: 15,
                border: "1.5px dashed #d0d9e8",
                borderRadius: "14px",
              }}
            >
              No feedback results available for this selection.
            </Box>
        ) : (
            <DataTable columns={feedbackColumns} rows={feedbackRows} />
        )}
      </Box>

      {/* ── RAISE DISCREPANCY MODAL ──────────────────────── */}
      <RaiseDiscrepancyModal
        open={discOpen}
        onClose={(refresh) => setDiscOpen(false)}
        academicYears={academicYears}
        semesterTypes={semesterTypes}
        defaultYearId={selectedYearId}
        defaultSemesterTypeId={selectedSemTypeId}
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
  background: "rgba(255,255,255,0.75)",
  backdropFilter: "blur(10px)",
  boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
  fontSize: 14,
};

const sectionCard = {
  p: 3,
  borderRadius: "20px",
  background: "rgba(255,255,255,0.6)",
  backdropFilter: "blur(12px)",
  boxShadow: "0 15px 40px rgba(0,0,0,0.08)",
  mb: 3,
};
