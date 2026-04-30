import PageHeader from "../../components/common/PageHeader";
import SectionHeader from "../../components/common/SectionHeader";
import ActionButton from "../../components/common/ActionButton";
import DataTable from "../../components/data/DataTable";
import {
  Box,
  MenuItem,
  Select,
  CircularProgress,
  Typography,
} from "@mui/material";
import { useEffect, useState, useRef } from "react";
import API from "../../api/axios";
import {
  Download as DownloadIcon,
  FileUpload as UploadIcon,
} from "@mui/icons-material";

export default function StudentFormatResults() {
  const [programs, setPrograms] = useState([]);
  const [selectedProgramId, setSelectedProgramId] = useState("");

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // 1. Fetch Programs on Mount
  useEffect(() => {
    const dataFetch = async () => {
      try {
        const progRes = await API.get("/api/academics/programs");
        const progs = progRes.data.data || [];
        setPrograms(progs);
      } catch (err) {
        console.error("Error fetching initial data:", err);
      }
    };
    dataFetch();
  }, []);

  // 2. Fetch Results when filters change
  const fetchResults = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedProgramId) params.programId = selectedProgramId;

      const res = await API.get("/api/student-results", { params });
      setResults(res.data);
    } catch (err) {
      console.error("Error fetching results:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [selectedProgramId]);

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
        "/api/student-results/upload",
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
      } else if (backendError) {
        alert(`Upload Failed: ${backendError}`);
      } else {
        alert("Upload failed. Please check your network connection and CSV format (ensure all required columns like branchcode, examyear, resulttype are present).");
      }
    } finally {
      setUploading(false);
      e.target.value = ""; // Reset file input
    }
  };

  // 5. Download Template
  const downloadTemplate = () => {
    const headers = [
      "studentid",
      "subjectcode",
      "subjectname",
      "semester",
      "examyear",
      "resulttype",
      "grade",
      "subjecttype",
      "sgpa",
      "cgpa",
    ];

    // Sample row
    const sampleRow = [
      "STU001",
      "CS101",
      "Data Structures",
      "1",
      "2025",
      "REGULAR",
      "A",
      "THEORY",
      "9.0",
      "8.5",
    ];

    const csvContent =
      headers.join(",") + "\n" + sampleRow.join(",") + "\n";

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student_result_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

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
        title="Student Results"
        subtitle="Manage and upload student performance results"
        breadcrumbs={["Home", "Exam Cell", "Results Upload", "Student Format"]}
      />

      {/* 🔹 FILTERS */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Box sx={filterBox}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", opacity: 0.9 }}>Filter by Program</Typography>
            <Select
              variant="standard"
              disableUnderline
              value={selectedProgramId}
              onChange={(e) => setSelectedProgramId(e.target.value)}
              sx={{ 
                  ml: 1.5, 
                  minWidth: 180, 
                  color: "var(--text-primary)",
                  fontWeight: 600,
                  fontSize: 14,
                  '& .MuiSelect-icon': { color: 'var(--text-primary)', opacity: 0.7 }
              }}
              displayEmpty
            >
              <MenuItem value="">All Programs</MenuItem>
              {programs.map((p) => (
                <MenuItem key={p._id} value={p._id}>
                  {p.name}
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
        <SectionHeader title="Student Results" />

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
            key={selectedProgramId}
            columns={[
              "Student ID",
              "Student Name",
              "Subject Code",
              "Subject Name",
              "Program",
              "Branch",
              "Semester",
              "Exam Year",
              "Type",
              "Subject Type",
              "Grade",
              "SGPA",
              "CGPA",
            ]}
            rows={results.map((r) => [
              {
                value: r.studentId,
                display: <Box sx={{ fontWeight: 600 }}>{r.studentId}</Box>,
              },
              {
                value: r.studentName,
                display: <Box>{r.studentName || "—"}</Box>,
              },
              {
                value: r.subjectCode,
                display: <Box sx={{ fontWeight: 500 }}>{r.subjectCode}</Box>,
              },
              {
                value: r.subjectName,
                display: <Box>{r.subjectName || "—"}</Box>,
              },
              {
                value: r.programId?.name,
                display: <Box>{r.programId?.name || "—"}</Box>,
              },
              {
                value: r.branchId?.code,
                display: <Box>{r.branchId?.code || "—"}</Box>,
              },
              {
                value: r.semester,
                display: <Box>{r.semester || "—"}</Box>,
              },
              {
                value: r.examYear,
                display: <Box>{r.examYear}</Box>,
              },
              {
                value: r.resultType,
                display: <Box>{r.resultType}</Box>,
              },
              {
                value: r.subjectType,
                display: <Box>{r.subjectType || "—"}</Box>,
              },
              {
                value: r.grade,
                display: <Box sx={{ fontWeight: 600 }}>{r.grade}</Box>,
              },
              {
                value: r.sgpa,
                display: <Box>{r.sgpa}</Box>,
              },
              {
                value: r.cgpa,
                display: <Box>{r.cgpa}</Box>,
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
