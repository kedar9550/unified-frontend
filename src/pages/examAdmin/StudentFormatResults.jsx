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
  IconButton,
  Tooltip,
  Menu,
  Divider,
  TextField,
  InputAdornment,
  Checkbox,
} from "@mui/material";
import { useEffect, useState, useRef } from "react";
import API from "../../api/axios";
import {
  Download as DownloadIcon,
  FileUpload as UploadIcon,
  Delete as DeleteIcon,
  DeleteSweep as ClearIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  CleaningServices as CleanIcon,
  Close as CloseIcon,
} from "@mui/icons-material";

// Programs that use marks-based year system (not grade-based semester)
const YEAR_BASED_PROGRAMS = ["Pharma.D"];

export default function StudentFormatResults() {
  const [programs, setPrograms] = useState([]);
  const [selectedProgramId, setSelectedProgramId] = useState("");

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteMenuAnchor, setDeleteMenuAnchor] = useState(null);
  const [bulkStudentId, setBulkStudentId] = useState("");
  const [selectedExamYear, setSelectedExamYear] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
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
      if (selectedExamYear) params.examYear = selectedExamYear;
      if (bulkStudentId.trim()) params.studentId = bulkStudentId.trim();
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
    setSelectedIds([]); // Clear selection when filters change
  }, [selectedProgramId, bulkStudentId, selectedExamYear]);

  // 3. Deletion Logic
  const toggleSelection = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = (resultsToSelect) => {
    const allIds = resultsToSelect.map(r => r._id);
    const areAllSelected = allIds.every(id => selectedIds.includes(id));
    
    if (areAllSelected) {
      setSelectedIds(prev => prev.filter(id => !allIds.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...allIds])]);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this specific entry?")) return;
    try {
      await API.delete(`/api/student-results/${id}`);
      fetchResults();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete record.");
    }
  };

  const handleBulkDelete = async (type) => {
    let confirmMsg = "";
    const params = {};

    if (type === "PROGRAM") {
      if (!selectedProgramId) {
        alert("Please select a program first.");
        return;
      }
      confirmMsg = `Are you sure you want to delete ALL results for ${selectedProgram?.name}?`;
      params.programId = selectedProgramId;
    } else if (type === "STUDENT") {
      if (!bulkStudentId.trim()) {
        alert("Please enter a Student ID.");
        return;
      }
      confirmMsg = `Are you sure you want to delete ALL results for Student ID: ${bulkStudentId}?`;
      params.studentId = bulkStudentId.trim();
    } else if (type === "SELECTED") {
      if (selectedIds.length === 0) {
        alert("Please select at least one record.");
        return;
      }
      confirmMsg = `Are you sure you want to delete ${selectedIds.length} selected record(s)?`;
      params.ids = selectedIds;
    } else if (type === "YEAR") {
      if (!selectedExamYear) {
        alert("Please select an Exam Year first.");
        return;
      }
      confirmMsg = `Are you sure you want to delete ALL results for Exam Year: ${selectedExamYear}?`;
      params.examYear = selectedExamYear;
    }

    if (!window.confirm(confirmMsg)) return;

    try {
      await API.delete("/api/student-results/bulk", { data: params });
      setDeleteMenuAnchor(null);
      if (type === "STUDENT") setBulkStudentId("");
      if (type === "SELECTED") setSelectedIds([]);
      if (type === "YEAR") setSelectedExamYear("");
      fetchResults();
    } catch (err) {
      console.error("Bulk delete failed:", err);
      alert(err.response?.data?.message || "Failed to perform bulk deletion.");
    }
  };

  // 4. Upload — chooses the correct endpoint based on program type
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
    "Actions"
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
    "Actions"
  ];

  const buildRows = (results) => {
    return results.map((r) => {
      if (r.yearName) {
        // YEAR program row (Pharma.D etc)
        return [
          { 
            value: "", 
            display: (
              <Checkbox 
                size="small" 
                checked={selectedIds.includes(r._id)} 
                onChange={() => toggleSelection(r._id)} 
              />
            ) 
          },
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
                  fontWeight: 800,
                  fontSize: 10,
                  bgcolor: r.result === "PASS" ? "#F0FDF4" : "#FEF2F2",
                  color: r.result === "PASS" ? "#166534" : "#991B1B",
                  border: r.result === "PASS" ? "1px solid #BBF7D0" : "1px solid #FECACA",
                }}
              />
            ),
          },
          {
            value: "actions",
            display: (
              <IconButton size="small" onClick={() => handleDelete(r._id)} sx={{ color: "#EF4444" }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            ),
          },
        ];
      } else {
        // SEM program row (B.Tech, M.Tech etc)
        return [
          { 
            value: "", 
            display: (
              <Checkbox 
                size="small" 
                checked={selectedIds.includes(r._id)} 
                onChange={() => toggleSelection(r._id)} 
              />
            ) 
          },
          { value: r.studentId, display: <Box sx={{ fontWeight: 600 }}>{r.studentId}</Box> },
          { value: r.studentName, display: <Box>{r.studentName || "—"}</Box> },
          { value: r.subjectCode, display: <Box sx={{ fontWeight: 500 }}>{r.subjectCode}</Box> },
          { value: r.subjectName, display: <Box>{r.subjectName || "—"}</Box> },
          { value: r.programId?.name, display: <Box>{r.programId?.name || "—"}</Box> },
          { value: r.branchId?.code, display: <Box>{r.branchId?.code || "—"}</Box> },
          { value: r.semester, display: <Box sx={{ fontWeight: 500 }}>{r.semester}</Box> },
          { value: r.examYear, display: <Box>{r.examYear}</Box> },
          { value: r.resultType, display: <Box>{r.resultType}</Box> },
          { value: r.subjectType, display: <Box>{r.subjectType || "—"}</Box> },
          { value: r.grade, display: <Box sx={{ fontWeight: 700 }}>{r.grade}</Box> },
          {
            value: r.result,
            display: (
              <Chip
                label={r.result}
                size="small"
                sx={{
                  fontWeight: 800,
                  fontSize: 10,
                  bgcolor: r.result === "PASS" ? "#F0FDF4" : "#FEF2F2",
                  color: r.result === "PASS" ? "#166534" : "#991B1B",
                  border: r.result === "PASS" ? "1px solid #BBF7D0" : "1px solid #FECACA",
                }}
              />
            ),
          },
          { value: r.sgpa, display: <Box>{r.sgpa}</Box> },
          { value: r.cgpa, display: <Box>{r.cgpa}</Box> },
          {
            value: "actions",
            display: (
              <IconButton size="small" onClick={() => handleDelete(r._id)} sx={{ color: "#EF4444" }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            ),
          },
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
        title="Exam Section"
        subtitle="Manage and upload student performance results"
        breadcrumbs={["Home", "Exam Cell", "Results Upload", "Student Format"]}
      />

      {/* DATA MANAGEMENT CONTROL CENTER */}
      <Box sx={{ 
        mt: 3, 
        mb: 4, 
        p: 3, 
        background: "var(--bg-panel)", 
        borderRadius: "24px", 
        border: "1px solid var(--border-color)", 
        boxShadow: "var(--shadow-premium)",
        display: "flex",
        flexDirection: "column",
        gap: 3
      }}>
        {/* Row 1: Header and Primary Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ 
              p: 1.5, 
              borderRadius: "14px", 
              background: "linear-gradient(135deg, var(--color-primary) 0%, #1e40af 100%)", 
              color: "#fff", 
              display: 'flex',
              boxShadow: "0 8px 20px rgba(59, 130, 246, 0.2)"
            }}>
              <FilterIcon />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: 20, color: "var(--text-primary)", lineHeight: 1.2 }}>
                Student Results Management
              </Typography>
              <Typography sx={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500, mt: 0.5 }}>
                {results.length} total records found in the database
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <ActionButton
              onClick={downloadTemplate}
              sx={{
                background: "transparent",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-color)",
                fontWeight: 700,
                px: 2.5,
                height: 44,
                borderRadius: "12px",
                "&:hover": { borderColor: "var(--color-primary)", color: "var(--color-primary)", background: "rgba(59, 130, 246, 0.05)" }
              }}
            >
              <DownloadIcon sx={{ mr: 1, fontSize: 18 }} /> Template
            </ActionButton>
            
            <ActionButton
              onClick={handleUploadClick}
              disabled={uploading}
              sx={{
                background: "var(--color-primary)",
                color: "#fff",
                fontWeight: 800,
                px: 3,
                height: 44,
                borderRadius: "12px",
                boxShadow: "0 8px 20px rgba(59, 130, 246, 0.3)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": { transform: "translateY(-2px)", boxShadow: "0 12px 25px rgba(59, 130, 246, 0.4)" }
              }}
            >
              <UploadIcon sx={{ mr: 1, fontSize: 18 }} /> {uploading ? "Uploading..." : "Upload CSV"}
            </ActionButton>
          </Box>
        </Box>

        <Divider sx={{ borderStyle: 'dashed', opacity: 0.5 }} />

        {/* Row 2: Filtering and Search */}
        <Box sx={{ display: "flex", gap: 3, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
          {/* Filters Group */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Box sx={filterBox}>
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 2, opacity: 0.7 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.05em' }}>PROGRAM</Typography>
              </Box>
              <Select
                variant="standard"
                disableUnderline
                value={selectedProgramId}
                onChange={(e) => setSelectedProgramId(e.target.value)}
                sx={{ minWidth: 160, fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}
                displayEmpty
              >
                <MenuItem value="">All Programs</MenuItem>
                {programs.map((p) => (
                  <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>
                ))}
              </Select>
            </Box>

            <Box sx={filterBox}>
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 2, opacity: 0.7 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.05em' }}>EXAM YEAR</Typography>
              </Box>
              <Select
                variant="standard"
                disableUnderline
                value={selectedExamYear}
                onChange={(e) => setSelectedExamYear(e.target.value)}
                sx={{ minWidth: 80, fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}
                displayEmpty
              >
                <MenuItem value="">All Years</MenuItem>
                {["2024", "2025", "2026", "2027"].map((y) => (
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
              </Select>
            </Box>

            {selectedProgram && (
              <Chip
                label={isYearBased ? "Year-based" : "Sem-based"}
                size="small"
                sx={{ 
                  fontWeight: 800, 
                  fontSize: 10, 
                  letterSpacing: '0.02em',
                  bgcolor: "rgba(59, 130, 246, 0.1)", 
                  color: "var(--color-primary)",
                  borderRadius: "8px",
                  height: 24
                }}
              />
            )}
          </Box>

          {/* Search and Bulk Actions Group */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder="Search Student ID..."
              size="small"
              value={bulkStudentId}
              onChange={(e) => setBulkStudentId(e.target.value)}
              sx={{
                width: 240,
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  fontSize: 14,
                  height: 44,
                  fontWeight: 600,
                  background: "var(--bg-glass)",
                  "& fieldset": { borderColor: "var(--border-color)" },
                  "&:hover fieldset": { borderColor: "var(--color-primary)" },
                  "&.Mui-focused fieldset": { borderColor: "var(--color-primary)" },
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 20, color: "var(--color-primary)", opacity: 0.8 }} />
                  </InputAdornment>
                ),
                endAdornment: bulkStudentId && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setBulkStudentId("")} sx={{ mr: 0.5, opacity: 0.6 }}>
                      <CloseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <Tooltip title="Wipe ALL records for this student">
                      <IconButton size="small" onClick={() => handleBulkDelete("STUDENT")} sx={{ color: "#EF4444", background: "rgba(239, 68, 68, 0.1)", "&:hover": { background: "rgba(239, 68, 68, 0.2)" } }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                )
              }}
            />

            <ActionButton
              onClick={(e) => setDeleteMenuAnchor(e.currentTarget)}
              sx={{
                background: "rgba(239, 68, 68, 0.05)",
                color: "#EF4444",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                fontWeight: 800,
                px: 2.5,
                height: 44,
                borderRadius: "12px",
                fontSize: 13,
                letterSpacing: '0.01em',
                "&:hover": { background: "rgba(239, 68, 68, 0.1)", borderColor: "#EF4444", transform: "translateY(-1px)" }
              }}
            >
              <CleanIcon sx={{ mr: 1, fontSize: 18 }} /> Bulk Actions
            </ActionButton>

            <Menu
              anchorEl={deleteMenuAnchor}
              open={Boolean(deleteMenuAnchor)}
              onClose={() => setDeleteMenuAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              PaperProps={{
                sx: {
                  borderRadius: "12px",
                  mt: 1,
                  minWidth: 220,
                  boxShadow: "var(--shadow-premium)",
                  border: "1px solid var(--border-color)",
                  p: 0.5,
                  "& .MuiMenuItem-root": {
                    fontSize: 13,
                    fontWeight: 600,
                    gap: 1.5,
                    py: 1.2,
                    borderRadius: "8px",
                    "&:hover": { background: "var(--bg-accent-1)" }
                  }
                }
              }}
            >
              <MenuItem onClick={() => handleBulkDelete("PROGRAM")} disabled={!selectedProgramId}>
                <ClearIcon fontSize="small" sx={{ color: "#EF4444" }} /> Clear Selected Program
              </MenuItem>
              <MenuItem onClick={() => handleBulkDelete("YEAR")} disabled={!selectedExamYear}>
                <DeleteIcon fontSize="small" sx={{ color: "#EF4444" }} /> Clear Selected Exam Year
              </MenuItem>
              <MenuItem onClick={() => handleBulkDelete("SELECTED")} disabled={selectedIds.length === 0}>
                <DeleteIcon fontSize="small" sx={{ color: "#EF4444" }} /> Delete Selected ({selectedIds.length})
              </MenuItem>
              <Divider sx={{ my: 0.5, borderStyle: 'dashed' }} />
              <Typography sx={{ px: 2, py: 1, fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", opacity: 0.6 }}>
                Wipe all records associated with the current program filter or selected items.
              </Typography>
            </Menu>
          </Box>
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
            sx={{ 
              textAlign: "center", 
              py: 12, 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: "var(--text-secondary)",
              background: "rgba(255,255,255,0.02)",
              borderRadius: "20px",
              border: "1px dashed var(--border-color)"
            }}
          >
            <Box sx={{ 
              fontSize: 60, 
              mb: 2, 
              filter: "drop-shadow(0 10px 15px rgba(0,0,0,0.1))",
              animation: "float 3s ease-in-out infinite"
            }}>
              📊
            </Box>
            <Typography
              variant="h6"
              fontWeight={800}
              sx={{ color: "var(--text-primary)", mb: 1 }}
            >
              No Results Found
            </Typography>
            <Typography
              sx={{ color: "var(--text-secondary)", maxWidth: 300, fontSize: 14, opacity: 0.8, lineHeight: 1.6 }}
            >
              We couldn't find any student records matching your current filters. Try adjusting your selection or uploading a new CSV.
            </Typography>
            <ActionButton
              onClick={handleUploadClick}
              sx={{ 
                mt: 4, 
                background: "rgba(59, 130, 246, 0.1)", 
                color: "var(--color-primary)",
                fontWeight: 700,
                borderRadius: "10px",
                px: 3,
                "&:hover": { background: "rgba(59, 130, 246, 0.2)" }
              }}
            >
              Upload New Results
            </ActionButton>
          </Box>
        ) : !selectedProgramId ? (
          // No filter — show two separate tables
          <>
            {semResults.length > 0 && (
              <>
                <SectionHeader title="Semester-based Results (Grade)" />
                <DataTable
                  columns={[
                    <Checkbox
                      size="small"
                      sx={{ color: '#fff', '&.Mui-checked': { color: '#fff' } }}
                      indeterminate={semResults.some(r => selectedIds.includes(r._id)) && !semResults.every(r => selectedIds.includes(r._id))}
                      checked={semResults.length > 0 && semResults.every(r => selectedIds.includes(r._id))}
                      onChange={() => toggleSelectAll(semResults)}
                    />,
                    ...semColumns
                  ]}
                  rows={buildRows(semResults)}
                />
              </>
            )}
            {yearResults.length > 0 && (
              <Box sx={{ mt: semResults.length > 0 ? 4 : 0 }}>
                <SectionHeader title="Year-based Results (Marks)" />
                <DataTable
                  columns={[
                    <Checkbox
                      size="small"
                      sx={{ color: '#fff', '&.Mui-checked': { color: '#fff' } }}
                      indeterminate={yearResults.some(r => selectedIds.includes(r._id)) && !yearResults.every(r => selectedIds.includes(r._id))}
                      checked={yearResults.length > 0 && yearResults.every(r => selectedIds.includes(r._id))}
                      onChange={() => toggleSelectAll(yearResults)}
                    />,
                    ...yearColumns
                  ]}
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
              columns={[
                <Checkbox
                  size="small"
                  sx={{ color: '#fff', '&.Mui-checked': { color: '#fff' } }}
                  indeterminate={results.some(r => selectedIds.includes(r._id)) && !results.every(r => selectedIds.includes(r._id))}
                  checked={results.length > 0 && results.every(r => selectedIds.includes(r._id))}
                  onChange={() => toggleSelectAll(results)}
                />,
                ...(isYearBased ? yearColumns : semColumns)
              ]}
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
