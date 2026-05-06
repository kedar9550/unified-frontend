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
  Typography,
} from "@mui/material";
import { useState, useRef, useEffect } from "react";
import API from "../../api/axios";
import {
  Download as DownloadIcon,
  FileUpload as UploadIcon,
} from "@mui/icons-material";

export default function FeedbackManagement() {
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState("");
  const [selectedPhase, setSelectedPhase] = useState("");

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
          const active = uniqueYears.find((y) => y.isActive) || uniqueYears[0];
          setSelectedYearId(active._id);
        }
      } catch (err) {
        console.error("Error fetching academic years:", err);
      }
    };
    fetchYears();
  }, []);

  // 2. Fetch Results when filters change
  const fetchResults = async () => {
    if (!selectedYearId) return;
    setLoading(true);
    try {
      const res = await API.get("/api/faculty-feedback-results", {
        params: { 
            academicYear: selectedYearId, 
            phase: selectedPhase ? Number(selectedPhase) : "" 
        },
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
  }, [selectedYearId, selectedPhase]);

  // 3. Handle Upload
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
        "/api/faculty-feedback-results/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      const { message, errors, successCount, failedCount } = res.data;
      if (errors && errors.length > 0) {
        const errorDetails = errors
          .map((e) => (typeof e === 'object' ? `• Row ${e.row || '?'}: ${e.message}` : `• ${e}`))
          .join("\n");
        alert(
          `Uploaded ${successCount || 0} rows.\n${failedCount || 0} rows failed to upload.\n\nErrors:\n${errorDetails}`
        );
      } else {
        alert(message || "Upload successful!");
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
      "subjectName",
      "subjectCode",
      "section",
      "phase",
      "semester_or_year",
      "totalStudents",
      "givenStudents",
      "percentage",
      "overallPercentage",
    ];
    const sampleRows = [
        ["FAC123", "2024-2025", "B.Tech", "CSE", "Mathematics", "MA101", "A", "1", "3", "60", "55", "91.6", "88.5"],
    ];
    const csvContent = headers.join(",") + "\n" + sampleRows.map(row => row.join(",")).join("\n") + "\n";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "feedback_bulk_upload_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Stats calculation
  const totalUploads = results.length;

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
        title="Feedback Coordinator"
        subtitle="Manage and upload student feedback reports"
        breadcrumbs={["Home", "Feedback", "Management"]}
      />

      <Box sx={{ display: "flex", gap: 3, mb: 3, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Box sx={filterBox}>
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

          <Box sx={filterBox}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", opacity: 0.9 }}>Phase</Typography>
            <Select
              variant="standard"
              disableUnderline
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value)}
              sx={{
                ml: 1.5,
                minWidth: 80,
                color: "var(--text-primary)",
                fontWeight: 600,
                fontSize: 14,
                '& .MuiSelect-icon': { color: 'var(--text-primary)', opacity: 0.7 }
              }}
            >
              <MenuItem value="">All Phases</MenuItem>
              <MenuItem value={1}>Phase 1</MenuItem>
              <MenuItem value={2}>Phase 2</MenuItem>
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
        <StatCard title="Total Records" score={totalUploads} max={""} glass />
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
        <SectionHeader title="Uploaded Feedback Records" />

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : results.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 10, color: "var(--text-secondary)" }}>
            <Typography fontSize={40}>📊</Typography>
            <Typography mt={1} fontWeight={600} sx={{ color: "var(--text-secondary)" }}>
              No feedback records found
            </Typography>
          </Box>
        ) : (
          <DataTable
            key={`${selectedYearId}-${selectedPhase}`}
            columns={[
              "Faculty ID",
              "Faculty Name",
              "Subject Name",
              "Course Code",
              "Section",
              "Sem / Year",
              "Phase",
              "Count",
              "%",
              "Overall %",
              "Uploaded At",
            ]}
            rows={results.map((r) => [
              {
                value: r.facultyId,
                display: <Box sx={{ fontWeight: 600 }}>{r.facultyId}</Box>
              },
              {
                value: r.facultyName,
                display: (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar>{r.facultyName?.charAt(0)}</Avatar>
                    <Box sx={{ fontWeight: 600 }}>{r.facultyName}</Box>
                  </Box>
                ),
              },
              {
                value: r.subjectName,
                display: <Box>{r.subjectName}</Box>,
              },
              {
                value: r.subjectCode,
                display: <Box>{r.subjectCode}</Box>,
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
                value: r.phase,
                display: <Box sx={{ fontWeight: 600 }}>{r.phase || "-"}</Box>,
              },
              {
                value: r.givenStudents,
                display: <Box>{r.givenStudents} / {r.totalStudents}</Box>,
              },
              {
                value: r.percentage,
                display: <Box sx={{ color: "var(--color-primary)", fontWeight: 700 }}>{r.percentage}%</Box>,
              },
              {
                value: r.overallPercentage,
                display: <Box sx={{ color: "#10b981", fontWeight: 700 }}>{r.overallPercentage}%</Box>,
              },
              {
                value: r.createdAt,
                display: new Date(r.createdAt).toLocaleString(),
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
  borderRadius: "12px",
  background: "var(--bg-glass)",
  border: "1px solid var(--border-color)",
};
