import PageHeader from "../../components/common/PageHeader";
import SectionHeader from "../../components/common/SectionHeader";
import StatCard from "../../components/common/StatCard";
import ActionButton from "../../components/common/ActionButton";
import DataTable from "../../components/data/DataTable";
import {
  Box,
  MenuItem,
  Select,
  Avatar,
  CircularProgress,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useState, useRef } from "react";
import API from "../../api/axios";
import {
  Download as DownloadIcon,
  FileUpload as UploadIcon,
} from "@mui/icons-material";

export default function FacultyFormatResults() {
  const [academicYears, setAcademicYears] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState("");
  const [selectedSemId, setSelectedSemId] = useState("");

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // 1. Fetch Academic Years on Mount
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const res = await API.get("/api/academic-years");
        const years = res.data.years || [];
        // Remove duplicates if any
        const uniqueYears = Array.from(new Set(years.map(y => y.year)))
          .map(yearName => years.find(y => y.year === yearName));
          
        setAcademicYears(uniqueYears);
        if (uniqueYears.length > 0) {
          // Find active or first
          const active = uniqueYears.find((y) => y.isActive) || uniqueYears[0];
          setSelectedYearId(active._id);
        }
      } catch (err) {
        console.error("Error fetching academic years:", err);
      }
    };
    fetchYears();
  }, []);

  // 2. Removed Global Semesters fetch as per user request

  // 3. Fetch Results when filters change
  const fetchResults = async () => {
    if (!selectedYearId) return;
    setLoading(true);
    try {
      const res = await API.get("/api/faculty-subject-results", {
        params: { academicYear: selectedYearId },
      });
      setResults(res.data);
    } catch (err) {
      console.error("Error fetching results:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [selectedYearId]);

  // 4. Handle Upload
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const res = await API.post(
        "/api/faculty-subject-results/upload-results",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (res.data.failedCount > 0) {
        const errorDetails = res.data.errors
          .map((e) => `• Row ${e.row}: ${e.message}`)
          .join("\n");
        alert(
          `Uploaded ${res.data.successCount} rows.\n${res.data.failedCount} rows failed to upload.\n\nErrors:\n${errorDetails}`
        );
      } else {
        alert("Upload successful!");
      }
      fetchResults();
    } catch (err) {
      console.error("Upload failed:", err);
      const backendError = err.response?.data?.message;
      const backendDetails = err.response?.data?.errors;

      if (Array.isArray(backendDetails)) {
        const errorDetails = backendDetails
          .map((e) => (typeof e === 'object' ? `• Row ${e.row || '?'}: ${e.message}` : `• ${e}`))
          .join("\n");
        alert(`${backendError || "Upload failed"}\n\nErrors:\n${errorDetails}`);
      } else {
        alert(backendError || "Upload failed. Please check CSV format.");
      }
    } finally {
      setUploading(false);
      e.target.value = ""; // Reset file input
    }
  };

  const downloadTemplate = () => {
    const headers = [
      "facultyId",
      "academicYear",
      "program",
      "branch",
      "courseName",
      "courseCode",
      "courseType",
      "semester_or_year",
      "appeared",
      "passed",
      "noOfCos",
      "noOfCosAttained",
      "section",
    ];
    const sampleRows = [
      ["FAC123", "2024-2025", "B.Tech", "CSE", "Mathematics", "MA101", "THEORY", "3", "60", "55", "5", "4", "A"],
    ];
    const csvContent = headers.join(",") + "\n" + sampleRows.map(row => row.join(",")).join("\n") + "\n";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "faculty_format_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Stats calculation
  const stats = {
    appeared: results.reduce((a, r) => a + (r.appeared || 0), 0),
    passed: results.reduce((a, r) => a + (r.passed || 0), 0),
  };

  const percentage =
    stats.appeared > 0 ? ((stats.passed / stats.appeared) * 100).toFixed(1) : 0;

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept=".csv"
        onChange={handleFileChange}
      />

      <PageHeader
        title="Exam Section"
        subtitle="Upload and manage results based on faculty and course"
        breadcrumbs={["Home", "Exam Cell", "Results Upload"]}
      />

      <Box sx={{ display: "flex", gap: 3, mb: 3, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Box sx={{
            display: "flex",
            alignItems: "center",
            px: 2,
            py: 1,
            borderRadius: "12px",
            background: "var(--bg-glass)",
            border: "1px solid var(--border-color)",
          }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", opacity: 0.9 }}>Academic Year</Typography>
            <Select
              variant="standard"
              disableUnderline
              value={selectedYearId}
              onChange={(e) => setSelectedYearId(e.target.value)}
              sx={{
                ml: 1.5,
                minWidth: 120,
                color: "var(--text-primary)",
                fontWeight: 600,
                fontSize: 14,
                '& .MuiSelect-icon': { color: 'var(--text-primary)', opacity: 0.7 }
              }}
            >
              {academicYears.map((year) => (
                <MenuItem key={year._id} value={year._id}>
                  {year.year}
                </MenuItem>
              ))}
            </Select>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 2 }}>
          <ActionButton
            onClick={downloadTemplate}
            sx={{
              background: "var(--bg-glass)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-color)",
              boxShadow: "var(--shadow-premium)",
              fontWeight: 700,
              px: 3,
              "&:hover": {
                background: "var(--bg-accent-1)",
                borderColor: "var(--color-primary)",
              }
            }}
          >
            <DownloadIcon sx={{ mr: 1, color: "var(--color-primary)" }} /> Template
          </ActionButton>

          <ActionButton
            onClick={handleUploadClick}
            disabled={uploading}
            sx={{
              background: "var(--color-primary)",
              color: "#fff",
              boxShadow: "var(--shadow-premium)",
              fontWeight: 800,
              px: 3,
              "&:hover": {
                background: "var(--color-primary)",
                opacity: 0.9,
              }
            }}
          >
            <UploadIcon sx={{ mr: 1 }} /> {uploading ? "Uploading..." : "Upload CSV"}
          </ActionButton>
        </Box>
      </Box>

      {/* 🔹 STATS */}
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <StatCard title="Appeared" score={stats.appeared} max={""} glass />
        <StatCard title="Passed" score={stats.passed} max={""} glass />
        <StatCard title="Pass %" score={`${percentage}%`} max={""} glass />
      </Box>

      {/* 🔹 RESULTS TABLE */}
      <Box
        sx={{
          p: 3,
          borderRadius: "24px",
          background: "var(--bg-panel)",
          backdropFilter: "blur(20px)",
          boxShadow: "var(--shadow-premium)",
          border: "1px solid var(--border-color)",
          minHeight: 400,
        }}
      >
        <SectionHeader title="Faculty Results" />

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : results.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 10, color: "var(--text-secondary)" }}>
            <Typography fontSize={40}>📊</Typography>
            <Typography mt={1} fontWeight={600} sx={{ color: "var(--text-secondary)" }}>
              No results found
            </Typography>
          </Box>
        ) : (
          <DataTable
            key={`${selectedYearId}-${selectedSemId}`}
            columns={[
              "Faculty ID",
              "Faculty Name",
              "Subject Name",
              "Course Code",
              "Type",
              "Section",
              "Sem / Year",
              "Appeared",
              "Passed",
              "%",
              "Last Updated",
            ]}
            rows={results.map((r) => [
              {
                value: r.facultyId,
                display: <Box sx={{ fontWeight: 600 }}>{r.facultyId}</Box>,
              },

              {
                value: r.facultyName,
                display: (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar>{r.facultyName?.charAt(0)}</Avatar>
                    <Box>
                      <Box sx={{ fontWeight: 600 }}>{r.facultyName}</Box>
                    </Box>
                  </Box>
                ),
              },

              {
                value: r.courseName,
                display: (
                  <Box>
                    <Box>{r.courseName}</Box>
                    {r.section && (
                      <Box sx={{ fontSize: 11, color: "var(--text-secondary)", opacity: 0.8 }}>
                        Sec: {r.section}
                      </Box>
                    )}
                  </Box>
                ),
              },

              {
                value: r.courseCode,
                display: <Box>{r.courseCode}</Box>,
              },

              {
                value: r.courseType,
                display: (
                  <Box sx={{ fontWeight: 600, color: "#0b5299" }}>
                    {r.courseType}
                  </Box>
                ),
              },

              {
                value: r.section,
                display: <Box>{r.section || "-"}</Box>,
              },

              {
                value: r.semesterDisplay,
                display: (
                  <Box>
                    <Box sx={{ fontWeight: 600 }}>{r.semesterDisplay}</Box>
                    <Box sx={{ fontSize: 11, color: "var(--text-secondary)", opacity: 0.8 }}>{r.semesterType}</Box>
                  </Box>
                ),
              },

              {
                value: r.appeared,
                display: <Box>{r.appeared}</Box>,
              },

              {
                value: r.passed,
                display: (
                  <Box>
                    {r.passed} / {r.appeared}
                  </Box>
                ),
              },

              {
                value: r.passPercentage,
                display: (
                  <Box sx={{ color: "#10b981", fontWeight: 700 }}>
                    {r.passPercentage}%
                  </Box>
                ),
              },

              {
                value: r.updatedAt,
                display: new Date(r.updatedAt).toLocaleString(),
              },
            ])}
          />
        )}
      </Box>
    </>
  );
}

const filterBox = {
  display: "flex",
  alignItems: "center",
  px: 2,
  py: 1,
  borderRadius: "14px",
  background: "var(--bg-glass)",
  color: "var(--text-primary)",
  fontWeight: 600,
  backdropFilter: "blur(10px)",
  boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
  border: "1px solid var(--border-color)",
  fontSize: 14,
};


