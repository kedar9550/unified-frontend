import PageHeader from "../../components/common/PageHeader";
import SectionHeader from "../../components/common/SectionHeader";
import ActionButton from "../../components/common/ActionButton";
import DataTable from "../../components/data/DataTable";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Divider,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { useState, useRef } from "react";
import API from "../../api/axios";
import {
  FileUpload as UploadIcon,
  Download as DownloadIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";

export default function UnifiedFacultyUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null); // { successCount, failedCount, errors }
  const fileInputRef = useRef(null);

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    setUploadResult(null);

    try {
      const res = await API.post(
        "/api/faculty-subject-results/upload-results",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setUploadResult(res.data);
    } catch (err) {
      console.error("Upload failed:", err);
      const message = err.response?.data?.message || "Upload failed. Please check the file format.";
      setUploadResult({
        successCount: 0,
        failedCount: 1,
        errors: [{ row: "System", message }],
      });
    } finally {
      setUploading(false);
      e.target.value = ""; // Reset file input
    }
  };

  const downloadTemplate = () => {
    const headers = [
      "facultyId",
      "facultyName",
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
      ["FAC001", "Dr. John Smith", "2024-2025", "B.Tech", "CSE", "Data Structures", "CS201", "THEORY", "3", "60", "55", "5", "4", "A"],
      ["FAC002", "Dr. Jane Doe", "2024-2025", "Pharm.D", "PHARMA", "Clinical Pharmacy", "PD101", "THEORY", "1", "40", "38", "6", "5", "1"],
      ["FAC003", "Prof. Alan Turing", "2024-2025", "B.Tech", "CSE", "Algorithms Lab", "CS202", "PRACTICAL", "25-S", "20", "19", "4", "4", "B"],
    ];
    
    const csvContent = [
      headers.join(","),
      ...sampleRows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "unified_faculty_results_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadErrorReport = () => {
    if (!uploadResult || !uploadResult.errors.length) return;

    const headers = ["Row Number", "Error Message"];
    const csvContent = [
      headers.join(","),
      ...uploadResult.errors.map(err => `${err.row},"${err.message.replace(/"/g, '""')}"`)
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `upload_errors_${new Date().getTime()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ pb: 6 }}>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept=".csv"
        onChange={handleFileChange}
      />

      <PageHeader
        title="Unified Results Upload"
        subtitle="Process faculty subject results for both Semester and Year-based programs"
        breadcrumbs={["Home", "Exam Cell", "Unified Upload"]}
      />

      <Box sx={{ display: "flex", gap: 3, mb: 4, flexWrap: "wrap" }}>
        {/* 🔹 UPLOAD CARD */}
        <Paper
          sx={{
            p: 4,
            flex: "1 1 400px",
            borderRadius: "24px",
            background: "var(--bg-panel)",
            backdropFilter: "blur(20px)",
            boxShadow: "var(--shadow-premium)",
            border: "1px solid var(--border-color)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            minHeight: 250,
            position: "relative",
            overflow: "hidden"
          }}
        >
          <Box sx={{ mb: 2, color: "var(--color-primary)", opacity: 0.8 }}>
            <UploadIcon sx={{ fontSize: 60 }} />
          </Box>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            CSV Upload
          </Typography>
          <Typography variant="body2" color="var(--text-secondary)" sx={{ mb: 3, maxWidth: 300 }}>
            Upload the faculty results CSV file. The system will automatically detect the program type and semester.
          </Typography>

          <Box sx={{ display: "flex", gap: 2 }}>
            <ActionButton
              onClick={downloadTemplate}
              sx={{
                background: "var(--bg-glass)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-color)",
                fontWeight: 700,
                px: 3,
                "&:hover": { background: "var(--bg-accent-1)" }
              }}
            >
              <DownloadIcon sx={{ mr: 1, fontSize: 20 }} /> Template
            </ActionButton>

            <ActionButton
              onClick={handleUploadClick}
              disabled={uploading}
              sx={{
                background: "var(--color-primary)",
                color: "#fff",
                fontWeight: 800,
                px: 4,
                "&:hover": { opacity: 0.9 }
              }}
            >
              {uploading ? <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} /> : <UploadIcon sx={{ mr: 1 }} />}
              {uploading ? "Processing..." : "Select File"}
            </ActionButton>
          </Box>

          {uploading && (
            <Box sx={{ 
              position: "absolute", 
              bottom: 0, 
              left: 0, 
              right: 0, 
              height: 4, 
              background: "rgba(255,255,255,0.1)" 
            }}>
              <Box sx={{ 
                height: "100%", 
                width: "60%", 
                background: "var(--color-primary)",
                animation: "pulse 2s infinite ease-in-out" 
              }} />
            </Box>
          )}
        </Paper>

        {/* 🔹 SUMMARY CARD */}
        {uploadResult && (
          <Paper
            sx={{
              p: 4,
              flex: "1 1 300px",
              borderRadius: "24px",
              background: "var(--bg-panel)",
              backdropFilter: "blur(20px)",
              boxShadow: "var(--shadow-premium)",
              border: "1px solid var(--border-color)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <SectionHeader title="Upload Summary" />
            <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <SuccessIcon sx={{ color: "#10b981" }} />
                  <Typography fontWeight={600}>Successfully Uploaded</Typography>
                </Box>
                <Typography variant="h5" fontWeight={800} color="#10b981">
                  {uploadResult.successCount}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <ErrorIcon sx={{ color: "#ef4444" }} />
                  <Typography fontWeight={600}>Failed Rows</Typography>
                </Box>
                <Typography variant="h5" fontWeight={800} color="#ef4444">
                  {uploadResult.failedCount}
                </Typography>
              </Box>

              <Divider sx={{ my: 1, borderColor: "var(--border-color)" }} />

              {uploadResult.failedCount > 0 && (
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  onClick={downloadErrorReport}
                  startIcon={<DownloadIcon />}
                  sx={{ 
                    borderRadius: "12px", 
                    textTransform: "none", 
                    fontWeight: 700,
                    borderWidth: "2px",
                    "&:hover": { borderWidth: "2px" }
                  }}
                >
                  Download Error Report
                </Button>
              )}
            </Box>
          </Paper>
        )}
      </Box>

      {/* 🔹 ERRORS TABLE */}
      {uploadResult && uploadResult.errors.length > 0 && (
        <Box
          sx={{
            p: 4,
            borderRadius: "24px",
            background: "var(--bg-panel)",
            backdropFilter: "blur(20px)",
            boxShadow: "var(--shadow-premium)",
            border: "1px solid var(--border-color)",
          }}
        >
          <SectionHeader title="Error Details" subtitle="Review and fix the following issues in your CSV file" />
          <Box sx={{ mt: 3 }}>
            <DataTable
              columns={["Row Number", "Error Message"]}
              rows={uploadResult.errors.map(err => [
                { value: err.row, display: <Typography fontWeight={700} color="var(--text-secondary)">{err.row}</Typography> },
                { value: err.message, display: <Typography color="#ef4444" sx={{ fontWeight: 500 }}>{err.message}</Typography> }
              ])}
            />
          </Box>
        </Box>
      )}

      <style>
        {`
          @keyframes pulse {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
        `}
      </style>
    </Box>
  );
}
