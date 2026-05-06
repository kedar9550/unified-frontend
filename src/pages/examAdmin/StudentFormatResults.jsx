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
  Chip,
} from "@mui/material";
import { useEffect, useState, useRef } from "react";
import API from "../../api/axios";
import {
  Download as DownloadIcon,
  FileUpload as UploadIcon,
} from "@mui/icons-material";

// Programs that use marks-based year system (not grade-based semester)
const YEAR_BASED_PROGRAMS = ["Pharma.D"];

export default function StudentFormatResults() {
  const [programs, setPrograms] = useState([]);
  const [selectedProgramId, setSelectedProgramId] = useState("");

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Derive whether the selected program is year-based (marks) or sem-based (grades)
  const selectedProgram = programs.find((p) => p._id === selectedProgramId);
  const isYearBased =
    selectedProgram?.programPattern === "YEAR" ||
    YEAR_BASED_PROGRAMS.includes(selectedProgram?.name || "");

  // 1. Fetch Programs on Mount
  useEffect(() => {
    const dataFetch = async () => {
      try {
        const progRes = await API.get("/api/academics/programs");
        const progs = progRes.data.data || [];
        setPrograms(progs);
      } catch (err) {
        console.error("Error fetching programs:", err);
      }
    };
    dataFetch();
  }, []);

  // 2. Fetch Results when program filter changes
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

  // 3. Upload — chooses the correct endpoint based on program type
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    // Use the correct upload route
    const uploadUrl = isYearBased
      ? "/api/student-results/upload-year"
      : "/api/student-results/upload";

    setUploading(true);
    try {
      const res = await API.post(uploadUrl, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { message, errors } = res.data;
      if (errors && errors.length > 0) {
        alert(`${message}\n\nDetails:\n${errors.join("\n")}`);
      } else {
        alert(message || "Upload successful!");
      }
      fetchResults();
    } catch (err) {
      console.error("Upload failed:", err);
      const backendError = err.response?.data?.message;
      const backendDetails = err.response?.data?.errors;

      if (backendDetails && Array.isArray(backendDetails)) {
        alert(
          `${backendError || "Upload failed"}\n\nErrors:\n${backendDetails.join("\n")}`
        );
      } else if (backendError) {
        alert(`Upload Failed: ${backendError}`);
      } else {
        alert(
          "Upload failed. Please check your network connection and CSV format."
        );
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  // 4. Download Template — different template for SEM vs YEAR programs
  const downloadTemplate = () => {
    if (isYearBased) {
      // Pharma.D marks-based template
      const headers = [
        "studentid",
        "subjectcode",
        "subjectname",
        "yearname",
        "examyear",
        "resulttype",
        "subjecttype",
        "intmarks",
        "extmarks",
        "totalmarks",
        "maxmarks",
      ];
      const sampleRow = [
        "PH001",
        "PH101",
        "Human Anatomy and Physiology",
        "I Year",
        "2025",
        "REGULAR",
        "THEORY",
        "26",
        "39",
        "65",
        "100",
      ];
      downloadCSV(
        headers,
        sampleRow,
        "student_result_template_year_pharma.csv"
      );
    } else {
      // SEM grade-based template
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
      downloadCSV(headers, sampleRow, "student_result_template_sem.csv");
    }
  };

  const downloadCSV = (headers, sampleRow, filename) => {
    const csvContent = headers.join(",") + "\n" + sampleRow.join(",") + "\n";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // 5. Build table columns based on program type
  const semColumns = [
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
    "Result",
    "SGPA",
    "CGPA",
  ];

  const yearColumns = [
    "Student ID",
    "Student Name",
    "Subject Code",
    "Subject Name",
    "Program",
    "Branch",
    "Year",
    "Exam Year",
    "Type",
    "Subject Type",
    "Int Marks",
    "Ext Marks",
    "Total",
    "Max",
    "Result",
  ];

  const buildRows = (results) => {
    return results.map((r) => {
      if (r.yearName) {
        // YEAR program row
        return [
          { value: r.studentId, display: <Box sx={{ fontWeight: 600 }}>{r.studentId}</Box> },
          { value: r.studentName, display: <Box>{r.studentName || "—"}</Box> },
          { value: r.subjectCode, display: <Box sx={{ fontWeight: 500 }}>{r.subjectCode}</Box> },
          { value: r.subjectName, display: <Box>{r.subjectName || "—"}</Box> },
          { value: r.programId?.name, display: <Box>{r.programId?.name || "—"}</Box> },
          { value: r.branchId?.code, display: <Box>{r.branchId?.code || "—"}</Box> },
          { value: r.yearName, display: <Box sx={{ fontWeight: 500 }}>{r.yearName}</Box> },
          { value: r.examYear, display: <Box>{r.examYear}</Box> },
          { value: r.resultType, display: <Box>{r.resultType}</Box> },
          { value: r.subjectType, display: <Box>{r.subjectType || "—"}</Box> },
          { value: r.intMarks, display: <Box>{r.intMarks ?? "—"}</Box> },
          { value: r.extMarks, display: <Box>{r.extMarks ?? "—"}</Box> },
          { value: r.totalMarks, display: <Box sx={{ fontWeight: 600 }}>{r.totalMarks ?? "—"}</Box> },
          { value: r.maxMarks, display: <Box>{r.maxMarks ?? "—"}</Box> },
          {
            value: r.result,
            display: (
              <Chip
                label={r.result}
                size="small"
                sx={{
                  fontWeight: 700,
                  fontSize: 11,
                  bgcolor: r.result === "PASS" ? "#DCFCE7" : "#FEE2E2",
                  color: r.result === "PASS" ? "#166534" : "#991B1B",
                }}
              />
            ),
          },
        ];
      } else {
        // SEM program row
        return [
          { value: r.studentId, display: <Box sx={{ fontWeight: 600 }}>{r.studentId}</Box> },
          { value: r.studentName, display: <Box>{r.studentName || "—"}</Box> },
          { value: r.subjectCode, display: <Box sx={{ fontWeight: 500 }}>{r.subjectCode}</Box> },
          { value: r.subjectName, display: <Box>{r.subjectName || "—"}</Box> },
          { value: r.programId?.name, display: <Box>{r.programId?.name || "—"}</Box> },
          { value: r.branchId?.code, display: <Box>{r.branchId?.code || "—"}</Box> },
          { value: r.semester, display: <Box>{r.semester || "—"}</Box> },
          { value: r.examYear, display: <Box>{r.examYear}</Box> },
          { value: r.resultType, display: <Box>{r.resultType}</Box> },
          { value: r.subjectType, display: <Box>{r.subjectType || "—"}</Box> },
          { value: r.grade, display: <Box sx={{ fontWeight: 600 }}>{r.grade || "—"}</Box> },
          {
            value: r.result,
            display: (
              <Chip
                label={r.result}
                size="small"
                sx={{
                  fontWeight: 700,
                  fontSize: 11,
                  bgcolor: r.result === "PASS" ? "#DCFCE7" : "#FEE2E2",
                  color: r.result === "PASS" ? "#166534" : "#991B1B",
                }}
              />
            ),
          },
          { value: r.sgpa, display: <Box>{r.sgpa}</Box> },
          { value: r.cgpa, display: <Box>{r.cgpa}</Box> },
        ];
      }
    });
  };

  // Separate results into SEM and YEAR for display when showing "All Programs"
  const yearResults = results.filter((r) => r.yearName);
  const semResults = results.filter((r) => !r.yearName);

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept=".csv"
        onChange={handleFileChange}
      />

      {/* HEADER */}
      <PageHeader
        title="Student Results"
        subtitle="Manage and upload student performance results"
        breadcrumbs={["Home", "Exam Cell", "Results Upload", "Student Format"]}
      />

      {/* FILTERS + ACTIONS */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          mb: 3,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Box sx={filterBox}>
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--text-primary)",
                opacity: 0.9,
              }}
            >
              Filter by Program
            </Typography>
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
                "& .MuiSelect-icon": {
                  color: "var(--text-primary)",
                  opacity: 0.7,
                },
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

          {/* Show the format badge when a program is selected */}
          {selectedProgram && (
            <Chip
              label={isYearBased ? "Marks-based (Year)" : "Grade-based (Semester)"}
              size="small"
              sx={{
                fontWeight: 700,
                fontSize: 11,
                bgcolor: isYearBased ? "#EEF2FF" : "#F0FDF4",
                color: isYearBased ? "#3730A3" : "#166534",
                border: isYearBased ? "1px solid #C7D2FE" : "1px solid #BBF7D0",
              }}
            />
          )}
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
              },
            }}
          >
            <DownloadIcon sx={{ mr: 1, color: "var(--color-primary)" }} />
            {selectedProgram
              ? isYearBased
                ? "Marks Template"
                : "Grade Template"
              : "Template"}
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
              "&:hover": { background: "var(--color-primary)", opacity: 0.9 },
            }}
          >
            <UploadIcon sx={{ mr: 1 }} />
            {uploading ? "Uploading..." : "Upload CSV"}
          </ActionButton>
        </Box>
      </Box>

      {/* RESULTS TABLE */}
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
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : results.length === 0 ? (
          <Box
            sx={{ textAlign: "center", py: 10, color: "var(--text-secondary)" }}
          >
            <Typography fontSize={40}>📊</Typography>
            <Typography
              mt={1}
              fontWeight={600}
              sx={{ color: "var(--text-secondary)" }}
            >
              No results found
            </Typography>
            <Typography
              mt={0.5}
              fontSize={13}
              sx={{ color: "var(--text-secondary)", opacity: 0.7 }}
            >
              Upload a CSV to get started
            </Typography>
          </Box>
        ) : !selectedProgramId ? (
          // No filter — show two separate tables
          <>
            {semResults.length > 0 && (
              <>
                <SectionHeader title="Semester-based Results (Grade)" />
                <DataTable
                  columns={semColumns}
                  rows={buildRows(semResults)}
                />
              </>
            )}
            {yearResults.length > 0 && (
              <Box sx={{ mt: semResults.length > 0 ? 4 : 0 }}>
                <SectionHeader title="Year-based Results (Marks)" />
                <DataTable
                  columns={yearColumns}
                  rows={buildRows(yearResults)}
                />
              </Box>
            )}
          </>
        ) : (
          // Program selected — show the correct table
          <>
            <SectionHeader
              title={
                isYearBased
                  ? "Year-based Results (Marks)"
                  : "Semester-based Results (Grade)"
              }
            />
            <DataTable
              key={selectedProgramId}
              columns={isYearBased ? yearColumns : semColumns}
              rows={buildRows(results)}
            />
          </>
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
