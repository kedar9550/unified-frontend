import Loader from "../../components/common/Loader";
import PageHeader from "../../components/common/PageHeader";
import SectionHeader from "../../components/common/SectionHeader";
import ActionButton from "../../components/common/ActionButton";
import DataTable from "../../components/data/DataTable";
import {
  Box,
  MenuItem,
  Select,
  IconButton,
  Tooltip,
  Typography,
  Menu,
  Divider,
} from "@mui/material";
import { toast } from "sonner";
import { useEffect, useState, useRef } from "react";
import API from "../../api/axios";
import {
  Download as DownloadIcon,
  FileUpload as UploadIcon,
  DeleteSweep as ClearIcon,
  FilterList as FilterIcon,
  InfoOutlined as InfoIcon,
  CleaningServices as CleanIcon,
} from "@mui/icons-material";

export default function ProctoringUpload() {
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState("");

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [deleteMenuAnchor, setDeleteMenuAnchor] = useState(null);

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
          const active = uniqueYears.find((y) => y.isGlobalActive) || uniqueYears[0];
          setSelectedYearId(active._id);
        }
      } catch (err) {
        console.error("Error fetching academic years:", err);
      }
    };
    fetchYears();
  }, []);

  // 2. Fetch Results when year changes
  const fetchResults = async () => {
    if (!selectedYearId) return;
    setLoading(true);
    try {
      const res = await API.get("/api/faculty-proctoring/all", {
        params: { 
          academicYearId: selectedYearId,
        },
      });
      setResults(res.data.data || []);
    } catch (err) {
      console.error("Error fetching proctoring results:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [selectedYearId]);

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
        "/api/faculty-proctoring/upload-excel",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (res.data.failedCount > 0) {
        const errorDetails = res.data.errors
          .map((err) => `Row ${err.row}: ${err.message}`)
          .join("\n");
        toast.error(`Uploaded ${res.data.successCount} rows. ${res.data.failedCount} rows failed.`, {
          description: errorDetails
        });
      } else {
        toast.success("Upload successful!");
      }
      fetchResults();
    } catch (err) {
      console.error("Upload failed:", err);
      const backendError = err.response?.data?.message;
      const backendDetails = err.response?.data?.errors;

      if (Array.isArray(backendDetails)) {
        const errorDetails = backendDetails
          .map((e) => (typeof e === 'object' ? `Row ${e.row || '?'}: ${e.message}` : e))
          .join("\n");
        toast.error(backendError || "Upload failed", {
          description: errorDetails
        });
      } else {
        toast.error(backendError || "Upload failed. Please check Excel format.");
      }
    } finally {
      setUploading(false);
      e.target.value = ""; // Reset file input
    }
  };

  const handleClear = async (mode) => {
    if (!selectedYearId) return;
    
    let confirmMsg = "";
    const params = { academicYearId: selectedYearId };

    if (mode === "ALL") {
      confirmMsg = "CRITICAL: This will PERMANENTLY DELETE ALL proctoring records for the selected academic year. Continue?";
    }

    if (!window.confirm(confirmMsg)) return;
    
    setLoading(true);
    try {
      await API.delete("/api/faculty-proctoring/clear", { params });
      toast.success("Records cleared successfully");
      setDeleteMenuAnchor(null);
      fetchResults();
    } catch (err) {
      console.error("Clear failed:", err);
      const msg = err.response?.data?.message || "Failed to clear records.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      "S.No",
      "Academic Year",
      "Emp Id",
      "Programme",
      "Branch",
      "Sem/Year",
      "Sec",
      "No. of students allotted for proctoring",
      "No. of students eligible for end exams (A)",
      "No. of students passed (B)"
    ];
    const sampleRows = [
      ["1", "2025-2026", "FAC123", "B.Tech", "CSE", "5", "A", "30", "28", "25"],
      ["2", "2025-2026", "FAC124", "B.Tech", "ECE", "3", "B", "20", "19", "18"],
      ["3", "2025-2026", "FAC125", "M.Tech", "CSE", "1", "A", "15", "15", "14"],
    ];
    const csvContent = headers.join(",") + "\n" + sampleRows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "proctoring_upload_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept=".csv,.xlsx,.xls"
        onChange={handleFileChange}
      />

      <PageHeader
        title="Proctoring Bulk Upload"
        subtitle="Upload and manage proctoring data for faculty appraisal" />

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
                Proctoring Management
              </Typography>
              <Typography sx={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500, mt: 0.5 }}>
                {results.length} records currently displayed
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1.5, width: { xs: '100%', sm: 'auto' } }}>
            <ActionButton
              variant="outlined"
              onClick={downloadTemplate}
              startIcon={<DownloadIcon sx={{ fontSize: 18 }} />}
              sx={{
                flex: 1,
                fontWeight: 700,
                px: 2.5,
                height: 44,
                whiteSpace: "nowrap",
              }}
            >
              Template
            </ActionButton>
            
            <ActionButton
              onClick={handleUploadClick}
              disabled={uploading}
              startIcon={<UploadIcon sx={{ fontSize: 18 }} />}
              sx={{
                flex: 1,
                fontWeight: 800,
                px: 3,
                height: 44,
                whiteSpace: "nowrap",
              }}
            >
              {uploading ? "Uploading..." : "Upload Excel/CSV"}
            </ActionButton>
          </Box>
        </Box>

        <Divider sx={{ borderStyle: 'dashed', opacity: 0.5 }} />

        {/* Info Note Banner */}
        <Box sx={{ 
          p: 2, 
          borderRadius: "14px", 
          background: "rgba(2, 132, 199, 0.04)", 
          border: "1px solid rgba(2, 132, 199, 0.12)",
          display: "flex",
          alignItems: "center",
          gap: 1.5
        }}>
          <InfoIcon sx={{ color: "var(--color-primary)", fontSize: 20 }} />
          <Typography sx={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>
            Upload proctoring details. The academic year will be determined by the data in your file.
          </Typography>
        </Box>

        {/* Row 2: Filtering and Search */}
        <Box sx={{ display: "flex", gap: 3, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
            <Box sx={filterBox}>
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 2, opacity: 0.7 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.05em' }}>YEAR</Typography>
              </Box>
              <Select
                variant="standard"
                disableUnderline
                value={selectedYearId}
                onChange={(e) => setSelectedYearId(e.target.value)}
                sx={{ flex: 1, minWidth: 100, fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}
              >
                {academicYears.map((year) => (
                  <MenuItem key={year._id} value={year._id}>
                    {year.year}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          </Box>

          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            alignItems: 'center',
            width: { xs: '100%', sm: 'auto' },
            flexDirection: { xs: 'column', sm: 'row' }
          }}>
            <ActionButton
              variant="outlined"
              color="error"
              onClick={(e) => setDeleteMenuAnchor(e.currentTarget)}
              sx={{
                fontWeight: 800,
                px: 2.5,
                height: 44,
                fontSize: 13,
                letterSpacing: '0.01em',
                width: { xs: "100%", sm: "auto" },
                justifyContent: "center",
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
              <MenuItem onClick={() => handleClear("ALL")} sx={{ color: "#EF4444 !important" }}>
                <ClearIcon fontSize="small" /> Clear All (Yearly)
              </MenuItem>
            </Menu>
          </Box>
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
        <SectionHeader title="Proctoring Records" />

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <Loader />
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
              👨‍🏫
            </Box>
            <Typography
              variant="h6"
              fontWeight={800}
              sx={{ color: "var(--text-primary)", mb: 1 }}
            >
              No Proctoring Records Found
            </Typography>
            <Typography
              sx={{ color: "var(--text-secondary)", maxWidth: 350, fontSize: 14, opacity: 0.8, lineHeight: 1.6 }}
            >
              We couldn't find any proctoring records for this academic year. Try uploading a new dataset.
            </Typography>
            <ActionButton
              variant="outlined"
              onClick={handleUploadClick}
              sx={{ 
                mt: 4, 
                fontWeight: 700,
                px: 3,
              }}
            >
              Upload Data
            </ActionButton>
          </Box>
        ) : (
          <DataTable
            key={`${selectedYearId}`}
            columns={[
              "Emp ID",
              "Faculty Name",
              "Program",
              "Sem/Yr - Branch - Sec",
              "Total Allotted",
              "Eligible (A)",
              "Passed (B)",
              "Pass %",
            ]}
            rows={results.map((r) => [
              {
                value: r.empId,
                display: <Box sx={{ fontWeight: 600 }}>{r.empId}</Box>,
              },
              {
                value: r.facultyName || r.facultyId?.name || "—",
                display: <Box>{r.facultyName || r.facultyId?.name || "—"}</Box>,
              },
              {
                value: r.programme,
                display: <Box sx={{ fontWeight: 600 }}>{r.programme}</Box>,
              },
              {
                value: `${r.semesterNumber ? 'SEM-' + r.semesterNumber : 'YEAR-' + r.yearNumber} ${r.branch} - SEC ${r.section}`,
                display: (
                  <Box>
                    <Box sx={{ fontWeight: 600 }}>
                      {r.semesterNumber ? `SEM-${r.semesterNumber}` : `YEAR-${r.yearNumber}`} {r.branch}
                    </Box>
                    <Box sx={{ fontSize: 11, color: "var(--text-secondary)", opacity: 0.8 }}>SEC: {r.section}</Box>
                  </Box>
                ),
              },
              {
                value: r.totalStudents,
                display: <Box>{r.totalStudents}</Box>,
              },
              {
                value: r.eligibleStudents,
                display: <Box sx={{ color: "#8B5CF6", fontWeight: 600 }}>{r.eligibleStudents}</Box>,
              },
              {
                value: r.passedStudents,
                display: <Box sx={{ color: "#10B981", fontWeight: 600 }}>{r.passedStudents}</Box>,
              },
              {
                value: r.passPercentage,
                display: (
                  <Box sx={{ color: "var(--color-primary)", fontWeight: 700 }}>
                    {r.passPercentage}%
                  </Box>
                ),
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
  height: 44,
  width: { xs: "100%", sm: "auto" }
};
