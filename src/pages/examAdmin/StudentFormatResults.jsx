import PageHeader from "../../components/common/PageHeader";
import SectionHeader from "../../components/common/SectionHeader";
import ActionButton from "../../components/common/ActionButton";
import DataTable from "../../components/data/DataTable";
import {
  Box,
  MenuItem,
  Select,
  CircularProgress,
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
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3, alignItems: "center" }}>
        <Box sx={filterBox}>
          Filter by Program
          <Select
            variant="standard"
            disableUnderline
            value={selectedProgramId}
            onChange={(e) => setSelectedProgramId(e.target.value)}
            sx={{ ml: 2, minWidth: 180 }}
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

        {/* 🔹 Upload Specific Section */}
        <Box sx={{ display: "flex", gap: 2, ml: "auto" }}>
          <ActionButton
            onClick={downloadTemplate}
            sx={{ background: "linear-gradient(135deg, #6a11cb, #2575fc)" }}
          >
            <DownloadIcon sx={{ mr: 1 }} /> Template
          </ActionButton>

          <ActionButton onClick={handleUploadClick} disabled={uploading}>
            <UploadIcon sx={{ mr: 1 }} /> Upload CSV
          </ActionButton>
        </Box>
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
        <SectionHeader title="Student Results" />

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
