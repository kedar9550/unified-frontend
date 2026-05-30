import Loader from "../../components/common/Loader";
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
  Tooltip,
} from "@mui/material";
import { useState, useRef, useEffect } from "react";
import API from "../../api/axios";
import {
  Download as DownloadIcon,
  FileUpload as UploadIcon,
  PieChart as PieChartIcon,
  AssignmentTurnedIn as AssignmentIcon,
  Groups as GroupsIcon,
  Delete as DeleteIcon,
  CleaningServices as CleanIcon
} from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { toast } from "sonner";

export default function FeedbackManagement() {
  const [academicYears, setAcademicYears] = useState([]);
  const [programs, setPrograms] = useState([]);
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

    const fetchPrograms = async () => {
      try {
        const res = await API.get("/api/academics/programs");
        setPrograms(res.data.data || []);
      } catch (err) {
        console.error("Error fetching programs:", err);
      }
    };
    fetchPrograms();
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

      const { successCount, failedCount, errors } = res.data;
      
      if (errors && errors.length > 0) {
        const errorDetails = errors
          .map((e) => `Row ${e.row}: ${e.message}`)
          .join(", ");
        toast.error(`Uploaded ${successCount || 0} rows. ${failedCount || 0} rows failed.`, {
            description: errorDetails
        });
      } else {
        toast.success(`Successfully uploaded ${successCount} records!`);
      }
      fetchResults();
    } catch (err) {
      console.error("Upload failed:", err);
      const backendError = err.response?.data?.message;
      const backendDetails = err.response?.data?.errors;

      if (Array.isArray(backendDetails)) {
        const errorDetails = backendDetails
          .map((e) => (typeof e === 'object' ? `Row ${e.row || '?'}: ${e.message}` : e))
          .join(", ");
        toast.error(backendError || "Upload failed", {
            description: errorDetails
        });
      } else {
        toast.error(backendError || "Upload failed. Please check CSV format.");
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

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await API.delete(`/api/faculty-feedback-results/${id}`);
      setResults(results.filter(r => r._id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  const handleClearData = async () => {
    if (!selectedYearId) return;
    const yearText = academicYears.find(y => y._id === selectedYearId)?.year || "selected year";
    const phaseText = selectedPhase ? ` (Phase ${selectedPhase})` : "";
    
    if (!window.confirm(`Are you sure you want to CLEAR ALL feedback data for ${yearText}${phaseText}? This action cannot be undone.`)) return;
    
    const ids = results.map(r => r._id);
    if (ids.length === 0) {
        toast.info("No records to delete.");
        return;
    }

    setLoading(true);
    try {
      await API.post("/api/faculty-feedback-results/bulk-delete", { ids });
      toast.success(`Successfully deleted ${ids.length} records.`);
      fetchResults();
    } catch (err) {
      console.error("Clear data failed:", err);
      toast.error(err.response?.data?.message || "Clear data failed");
    } finally {
      setLoading(false);
    }
  };

  // Derive stats
  const totalRecords = results.length;
  const avgPercentage = totalRecords > 0 
    ? (results.reduce((acc, r) => acc + (r.percentage || 0), 0) / totalRecords).toFixed(1) 
    : 0;
  const phase1Count = results.filter(r => r.phase === 1).length;
  const phase2Count = results.filter(r => r.phase === 2).length;

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
        title="Feedback Admin"
        subtitle="Coordinate student feedback data and institutional reports"
        breadcrumbs={["Home", "Feedback", "Management"]}
        action={
          <Box sx={{ display: "flex", gap: 2 }}>
            {results.length > 0 && (
              <ActionButton
                onClick={handleClearData}
                disabled={loading || uploading}
                sx={{
                  background: "var(--bg-glass)",
                  color: "#ef4444",
                  border: "1px solid #ef4444",
                  px: 2.5,
                  "&:hover": { background: "rgba(239, 68, 68, 0.1)", borderColor: "#ef4444" }
                }}
              >
                <CleanIcon sx={{ mr: 1, fontSize: 18 }} /> Clear Selection
              </ActionButton>
            )}
            <ActionButton
              onClick={downloadTemplate}
              sx={{
                background: "var(--bg-glass)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-color)",
                px: 2.5,
              }}
            >
              <DownloadIcon sx={{ mr: 1, fontSize: 18 }} /> Template
            </ActionButton>

            <ActionButton
              onClick={handleUploadClick}
              disabled={uploading}
              sx={{
                background: "var(--gradient-primary)",
                color: "#fff",
                px: 3,
                boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
              }}
            >
              {uploading ? (
                <Loader size={18} color="inherit" />
              ) : (
                <UploadIcon sx={{ mr: 1, fontSize: 18 }} />
              )}
              {uploading ? "Uploading..." : "Upload CSV"}
            </ActionButton>
          </Box>
        }
      />

      {/* Stats Section */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 2.5, mb: 4 }}>
        <StatCard 
            title="Total Records" 
            score={totalRecords} 
            max={""} 
            icon={<AssignmentIcon sx={{ color: "#3b82f6" }}/>}
            glass 
        />
        <StatCard 
            title="Avg Feedback %" 
            score={`${avgPercentage}%`} 
            max={""} 
            icon={<PieChartIcon sx={{ color: "#10b981" }}/>}
            glass 
        />
        <StatCard 
            title="Phase 1 Data" 
            score={phase1Count} 
            max={""} 
            icon={<GroupsIcon sx={{ color: "#f59e0b" }}/>}
            glass 
        />
        <StatCard 
            title="Phase 2 Data" 
            score={phase2Count} 
            max={""} 
            icon={<GroupsIcon sx={{ color: "#8b5cf6" }}/>}
            glass 
        />
      </Box>

      {/* Filters & Table */}
      <Box sx={sectionCard}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
            <SectionHeader title="Feedback Data Repository" />
            
            <Box sx={{ display: "flex", gap: 2 }}>
                <Box sx={filterBox}>
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", mr: 1.5, textTransform: "uppercase" }}>Academic Year</Typography>
                    <Select
                        variant="standard"
                        disableUnderline
                        value={selectedYearId}
                        onChange={(e) => setSelectedYearId(e.target.value)}
                        sx={{ minWidth: 120, fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}
                    >
                        {academicYears.map((year) => (
                        <MenuItem key={year._id} value={year._id}>{year.year}</MenuItem>
                        ))}
                    </Select>
                </Box>

                <Box sx={filterBox}>
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", mr: 1.5, textTransform: "uppercase" }}>Phase</Typography>
                    <Select
                        variant="standard"
                        disableUnderline
                        value={selectedPhase}
                        onChange={(e) => setSelectedPhase(e.target.value)}
                        sx={{ minWidth: 100, fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}
                    >
                        <MenuItem value="">All Phases</MenuItem>
                        <MenuItem value={1}>Phase 1</MenuItem>
                        <MenuItem value={2}>Phase 2</MenuItem>
                    </Select>
                </Box>
            </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
            <Loader />
          </Box>
        ) : results.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 10, background: "rgba(0,0,0,0.02)", borderRadius: "16px", border: "1px dashed var(--border-color)" }}>
            <Typography variant="h5" sx={{ opacity: 0.3, mb: 1 }}>📊</Typography>
            <Typography fontWeight={600} color="var(--text-secondary)">No feedback records found for this selection</Typography>
            <Typography variant="caption" color="var(--text-secondary)">Try changing filters or upload a new CSV file.</Typography>
          </Box>
        ) : (
          <DataTable
            columns={[
              "FACULTY",
              "COURSE DETAILS",
              "SEM / YEAR",
              "PHASE",
              "COUNT (G/T)",
              "PERCENTAGE",
              "OVERALL %",
              "ACTIONS"
            ]}
            rows={results.map((r) => [
              {
                value: r.facultyName,
                display: (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: "var(--color-primary)", fontSize: 14 }}>{r.facultyName?.charAt(0)}</Avatar>
                    <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{r.facultyName}</Typography>
                        <Typography sx={{ fontSize: 11, color: "var(--text-secondary)" }}>{r.facultyId}</Typography>
                    </Box>
                  </Box>
                ),
              },
              {
                value: r.subjectName,
                display: (
                    <Box>
                        <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{r.subjectName}</Typography>
                        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                            <Typography sx={{ fontSize: 11, color: "var(--text-secondary)" }}>{r.subjectCode}</Typography>
                            <Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: "var(--border-color)" }} />
                            <Typography sx={{ fontSize: 11, color: "var(--color-primary)", fontWeight: 700 }}>Sec {r.section || "-"}</Typography>
                        </Box>
                    </Box>
                ),
              },
              {
                value: r.semesterDisplay,
                display: (
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{r.semesterDisplay}</Typography>
                    <Typography sx={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>{r.semesterType}</Typography>
                  </Box>
                ),
              },
              {
                value: r.phase,
                display: (
                    <Box sx={{ 
                        px: 1.5, py: 0.5, borderRadius: "20px", 
                        background: r.phase === 1 ? "rgba(245, 158, 11, 0.1)" : "rgba(139, 92, 246, 0.1)",
                        color: r.phase === 1 ? "#d97706" : "#7c3aed",
                        fontSize: 11, fontWeight: 800, textAlign: "center", display: "inline-block"
                    }}>
                        PH {r.phase}
                    </Box>
                ),
              },
              {
                value: r.givenStudents,
                display: (
                    <Box sx={{ fontWeight: 700 }}>
                        {r.givenStudents} <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>/</span> {r.totalStudents}
                    </Box>
                )
              },
              {
                value: r.percentage,
                display: (
                    <Box sx={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
                         <Typography sx={{ color: "var(--color-primary)", fontWeight: 800, fontSize: 15 }}>{r.percentage}%</Typography>
                    </Box>
                ),
              },
              {
                value: r.overallPercentage,
                display: <Typography sx={{ color: "#10b981", fontWeight: 800, fontSize: 15 }}>{r.overallPercentage}%</Typography>,
              },
              {
                value: "delete",
                display: (
                  <Tooltip title="Delete Record">
                    <IconButton 
                      onClick={() => handleDelete(r._id)} 
                      size="small" 
                      sx={{ color: "#ef4444" }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )
              }
            ])}
          />
        )}
      </Box>
    </>
  );
}

const sectionCard = {
  p: 3.5,
  borderRadius: "24px",
  background: "var(--bg-panel)",
  backdropFilter: "blur(20px)",
  boxShadow: "var(--shadow-premium)",
  border: "1px solid var(--border-color)",
};

const filterBox = {
  display: "flex",
  alignItems: "center",
  px: 2,
  py: 1,
  borderRadius: "14px",
  background: "var(--bg-glass)",
  border: "1px solid var(--border-color)",
};
