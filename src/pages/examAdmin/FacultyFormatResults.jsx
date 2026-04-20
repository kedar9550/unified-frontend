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
        setAcademicYears(years);
        if (years.length > 0) {
          // Find active or first
          const active = years.find((y) => y.isActive) || years[0];
          setSelectedYearId(active._id);
        }
      } catch (err) {
        console.error("Error fetching academic years:", err);
      }
    };
    fetchYears();
  }, []);

  // 2. Fetch Semesters when Academic Year changes
  useEffect(() => {
    if (!selectedYearId) return;

    const fetchSemesters = async () => {
      try {
        const res = await API.get(
          `/api/academic-years/${selectedYearId}/semesters`,
        );
        const sems = res.data.semesters || [];
        setSemesters(sems);
        if (sems.length > 0) {
          const active = sems.find((s) => s.isActive) || sems[0];
          setSelectedSemId(active._id);
        } else {
          setSelectedSemId("");
        }
      } catch (err) {
        console.error("Error fetching semesters:", err);
      }
    };
    fetchSemesters();
  }, [selectedYearId]);

  // 3. Fetch Results when filters change
  const fetchResults = async () => {
    if (!selectedYearId || !selectedSemId) return;
    setLoading(true);
    try {
      const res = await API.get("/api/faculty-subject-results", {
        params: { academicYear: selectedYearId, semester: selectedSemId },
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
  }, [selectedYearId, selectedSemId]);

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
        "/api/faculty-subject-results/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      const { message, errors } = res.data;
      if (errors && errors.length > 0) {
        alert(`${message}\n\nDetails:\n${errors.join("\n")}`);
      } else {
        alert(message || "Upload successful!");
      }
      fetchResults(); // Refresh table
    } catch (err) {
      console.error("Upload failed:", err);
      const backendError = err.response?.data?.message;
      const backendDetails = err.response?.data?.errors;

      if (backendDetails && Array.isArray(backendDetails)) {
        alert(
          `${backendError || "Upload failed"}\n\nErrors:\n${backendDetails.join("\n")}`,
        );
      } else {
        alert(backendError || "Upload failed. Please check CSV format.");
      }
    } finally {
      setUploading(false);
      e.target.value = ""; // Reset file input
    }
  };

  // 5. Download Template
  const downloadTemplate = () => {
    const headers = [
      "facultyId",
      "facultyName",
      "academicYear",
      "semester",
      "subjectName",
      "subjectCode",
      "branch",
      "appeared",
      "passed",
      "passPercentage",
    ];
    const csvContent = headers.join(",") + "\n";
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

      {/* 🔹 HEADER */}
      <PageHeader
        title="Exam Section"
        subtitle="Upload and manage results based on faculty and course"
        breadcrumbs={["Home", "Exam Cell", "Results Upload"]}
        action={
          <Box sx={{ display: "flex", gap: 2 }}>
            <ActionButton
              onClick={downloadTemplate}
              sx={{ background: "linear-gradient(135deg, #6a11cb, #2575fc)" }}
            >
              <DownloadIcon sx={{ mr: 1 }} /> Template
            </ActionButton>

            <ActionButton onClick={handleUploadClick} disabled={uploading}>
              {uploading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <>
                  <UploadIcon sx={{ mr: 1 }} /> Upload CSV
                </>
              )}
            </ActionButton>
          </Box>
        }
      />

      {/* 🔹 FILTERS */}
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <Box sx={filterBox}>
          Academic Year
          <Select
            variant="standard"
            disableUnderline
            value={selectedYearId}
            onChange={(e) => setSelectedYearId(e.target.value)}
            sx={{ ml: 2, minWidth: 120 }}
          >
            {academicYears.map((year) => (
              <MenuItem key={year._id} value={year._id}>
                {year.year}
              </MenuItem>
            ))}
          </Select>
        </Box>

        <Box sx={filterBox}>
          Semester
          <Select
            variant="standard"
            disableUnderline
            value={selectedSemId}
            onChange={(e) => setSelectedSemId(e.target.value)}
            sx={{ ml: 2, minWidth: 80 }}
          >
            {semesters.map((sem) => (
              <MenuItem key={sem._id} value={sem._id}>
                {sem.type}
              </MenuItem>
            ))}
          </Select>
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
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.7), rgba(255,255,255,0.4))",
          backdropFilter: "blur(20px)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
          border: "1px solid rgba(255,255,255,0.3)",
          minHeight: 400,
        }}
      >
        <SectionHeader title="Faculty Results" />

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <DataTable
            key={`${selectedYearId}-${selectedSemId}`}
            columns={[
              "Faculty ID",
              "Faculty Name",
              "Subject Name",
              "Course Code",
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
                      {/* <Box sx={{ fontSize: 12, color: "#777" }}>
                        {r.subjectName}
                      </Box> */}
                    </Box>
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
                  <Box sx={{ color: "green", fontWeight: 600 }}>
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
  background: "rgba(255,255,255,0.6)",
  backdropFilter: "blur(10px)",
  boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
  fontSize: 14,
};

// const chip = {
//   px: 2,
//   py: 0.5,
//   borderRadius: "10px",
//   background: "rgba(255,255,255,0.7)",
//   backdropFilter: "blur(10px)",
//   textAlign: "center",
//   minWidth: 50,
//   fontSize: 14,
// };
