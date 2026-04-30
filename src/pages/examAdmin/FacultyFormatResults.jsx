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

  // 2. Fetch Global Semesters on Mount
  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const res = await API.get('/api/semester-types');
        const sems = res.data.data || [];
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
  }, []);

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

  const downloadTemplate = () => {
    const headers = [
      "facultyId",
      "facultyName",
      "academicYearId",
      "semester",
      "courseName",
      "courseCode",
      "courseType",
      "section",
      "noOfCos",
      "noOfCosAttained",
      "branch",
      "appeared",
      "passed",
      "passPercentage",
      "semesterTypeId",
      "uploadedBy"
    ];
    const sampleRow = [
      "FAC123",
      "John Doe",
      "2024-2025",
      "1",
      "Mathematics",
      "MA101",
      "A",
      "5",
      "4",
      "CSE",
      "60",
      "55",
      "91.67",
    ];
    const csvContent = headers.join(",") + "\n" + sampleRow.join(",") + "\n";
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
              sx={{
                background: "linear-gradient(90deg, #004e92, #000428)",
                boxShadow: "0 4px 15px rgba(0, 78, 146, 0.2)",
                "&:hover": {
                  background: "linear-gradient(90deg, #003a6d, #000214)",
                  boxShadow: "0 6px 20px rgba(0, 78, 146, 0.35)",
                }
              }}
            >
              <DownloadIcon sx={{ mr: 1 }} /> Template
            </ActionButton>

            <ActionButton
              onClick={handleUploadClick}
              disabled={uploading}
              sx={{
                background: "linear-gradient(90deg, #004e92, #000428)",
                boxShadow: "0 4px 15px rgba(0, 78, 146, 0.2)",
                "&:hover": {
                  background: "linear-gradient(90deg, #003a6d, #000214)",
                  boxShadow: "0 6px 20px rgba(0, 78, 146, 0.35)",
                }
              }}
            >
              <UploadIcon sx={{ mr: 1 }} /> Upload CSV
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
                {sem.name}
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
        ) : results.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 10, color: "#aaa" }}>
            <Typography fontSize={40}>📊</Typography>
            <Typography mt={1} fontWeight={600} color="#555">
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
              "Semester",
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
                      <Box sx={{ fontSize: 11, color: "#999" }}>
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
                value: r.semester,
                display: (
                  <Box>
                    <Box>{r.semester}</Box>
                    <Box sx={{ fontSize: 11, color: "#999" }}>{r.semesterType}</Box>
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


