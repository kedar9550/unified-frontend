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
  const [selectedYearLabel, setSelectedYearLabel] = useState("");

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
          setSelectedYearLabel(active.year);
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
            academicYear: selectedYearLabel,
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
  }, [selectedYearLabel, user?.institutionId]);

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
      formData.append("academicYear", selectedYearLabel);

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
          academicYear: selectedYearLabel,
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
  const selectedYear = academicYears.find((y) => y.year === selectedYearLabel);

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
      value: r.courseType,
      display: (
        <Box sx={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
          {r.courseType || "—"}
        </Box>
      ),
    },

    {
      value: `${r.semesterDisplay || r.semester || "—"} - ${r.branch} - ${r.section}`,
      display: (
        <Box sx={{ whiteSpace: "nowrap" }}>
          <Box component="span" sx={{ fontWeight: 600 }}>{r.semesterDisplay || r.semester || "—"}</Box>
          {r.branch && <Box component="span" sx={{ color: "var(--text-secondary)" }}> — {r.branch}</Box>}
          {r.section && <Box component="span" sx={{ color: "var(--color-primary)", fontWeight: 700 }}> — {r.section}</Box>}
        </Box>
      ),
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
    "SEM - BRANCH - SEC",
    "PHASE",
    "GIVEN / TOTAL",
    "PERCENTAGE",
    "OVERALL %",
  ];

  const feedbackRows = feedbackResults.map((r, i) => [
    {
      value: i + 1,
      display: <Box sx={{ fontWeight: 600 }}>{i + 1}</Box>,
    },
    {
      value: r.subjectName,
      display: (
        <Box>
            <Box sx={{ fontWeight: 700, fontSize: 14 }}>{r.subjectName}</Box>
            <Box sx={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 500 }}>{r.subjectCode}</Box>
        </Box>
      ),
    },
    {
      value: `${r.semesterDisplay || "—"} - ${r.branch || "—"} - ${r.section || "—"}`,
      display: (
        <Box sx={{ whiteSpace: "nowrap" }}>
          <Box component="span" sx={{ fontWeight: 700, color: "var(--text-primary)" }}>{r.semesterDisplay || "—"}</Box>
          {r.branch && <Box component="span" sx={{ color: "var(--text-secondary)", fontSize: 12 }}> — {r.branch}</Box>}
          {r.section && <Box component="span" sx={{ color: "var(--color-primary)", fontWeight: 800 }}> — {r.section}</Box>}
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
      value: `${r.givenStudents} / ${r.totalStudents}`,
      display: (
        <Box sx={{ fontWeight: 700 }}>
          {r.givenStudents} <span style={{ color: "#999", fontWeight: 400 }}>/</span> {r.totalStudents}
        </Box>
      ),
    },
    {
      value: r.percentage,
      display: (
        <Box sx={{ fontWeight: 800, color: "var(--color-primary)", fontSize: 15 }}>
          {Number(r.percentage).toFixed(1)}%
        </Box>
      ),
    },
    {
      value: r.overallPercentage,
      display: (
        <Box sx={{ 
            fontWeight: 800, color: "#10b981", fontSize: 15,
            display: "flex", alignItems: "center", gap: 0.5
        }}>
          {Number(r.overallPercentage).toFixed(1)}%
        </Box>
      ),
    },
  ]);

  // ── Build CO Attainment DataTable rows ─────────────────────────────────────────
  const coAttainmentColumns = [
    "S.NO",
    "COURSE NAME",
    "SEM - BRANCH - SEC",
    "NO. OF COs",
    "COs ATTAINMENT",
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
      value: `${r.semesterDisplay || r.semester || "—"} - ${r.branch} - ${r.section}`,
      display: (
        <Box>
          <Box component="span" sx={{ fontWeight: 600 }}>{r.semesterDisplay || r.semester || "—"}</Box>
          {r.branch && <Box component="span"> — {r.branch}</Box>}
          {r.section && <Box component="span" sx={{ color: "var(--color-primary)", fontWeight: 700 }}> — {r.section}</Box>}
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
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Overall Summary if multiple semesters exist */}
            {proctorStats.details?.length > 1 && (
              <Box
                sx={{
                  p: 2,
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, rgba(0, 78, 146, 0.05), rgba(0, 4, 40, 0.05))",
                  border: "1px solid var(--border-color)",
                  textAlign: "center"
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "var(--color-primary)", mb: 1 }}>
                  OVERALL ACADEMIC YEAR SUMMARY
                </Typography>
                <Box sx={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 2 }}>
                  <Typography variant="body2">Total: <strong>{proctorStats.totalMappedStudents}</strong></Typography>
                  <Typography variant="body2">Appeared: <strong>{proctorStats.studentsAppeared}</strong></Typography>
                  <Typography variant="body2">Passed: <strong>{proctorStats.studentsPassed}</strong></Typography>
                  <Typography variant="body2">Pass %: <strong style={{ color: proctorStats.passPercentage >= 50 ? "#10b981" : "#ef4444" }}>{proctorStats.passPercentage}%</strong></Typography>
                </Box>
              </Box>
            )}

            {/* Individual Semester Summaries */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {(proctorStats.details?.length > 0 ? proctorStats.details : [proctorStats]).map((sem, idx) => (
                <Box
                  key={idx}
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 3,
                    justifyContent: "space-around",
                    p: 3,
                    border: "1px solid var(--border-color)",
                    borderRadius: "16px",
                    background: "var(--bg-glass)",
                    position: "relative"
                  }}
                >
                  {sem.semesterName && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: -10,
                        left: 20,
                        px: 1.5,
                        py: 0.5,
                        background: "var(--color-primary)",
                        color: "#fff",
                        borderRadius: "20px",
                        fontSize: "0.65rem",
                        fontWeight: 800,
                        letterSpacing: "0.05em"
                      }}
                    >
                      {sem.semesterName} SEMESTER
                    </Box>
                  )}
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 700, mb: 1, fontSize: "0.7rem", textTransform: "uppercase" }}>Total Students Managed</Typography>
                    <Typography variant="h4" sx={{ color: "var(--color-primary)", fontWeight: 800 }}>{sem.totalMappedStudents}</Typography>
                  </Box>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 700, mb: 1, fontSize: "0.7rem", textTransform: "uppercase" }}>Students Appeared</Typography>
                    <Typography variant="h4" sx={{ color: "#f59e0b", fontWeight: 800 }}>{sem.studentsAppeared}</Typography>
                  </Box>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 700, mb: 1, fontSize: "0.7rem", textTransform: "uppercase" }}>Students Passed</Typography>
                    <Typography variant="h4" sx={{ color: "#10b981", fontWeight: 800 }}>{sem.studentsPassed}</Typography>
                  </Box>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 700, mb: 1, fontSize: "0.7rem", textTransform: "uppercase" }}>Pass Percentage</Typography>
                    <Typography variant="h4" sx={{ color: sem.passPercentage >= 50 ? "#10b981" : "#ef4444", fontWeight: 800 }}>{sem.passPercentage}%</Typography>
                  </Box>
                </Box>
              ))}
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
        defaultYearId={selectedYear?._id}
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
