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
  Typography,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
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
  CleaningServices as CleanIcon,
  Close as CloseIcon,
  InfoOutlined as InfoIcon,
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
  const [uploadSummary, setUploadSummary] = useState(null);
  const fileInputRef = useRef(null);

  const blurActiveElement = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const selectMenuProps = {
    disableAutoFocusItem: true,
    slotProps: {
      list: {
        autoFocus: false,
        onMouseDown: blurActiveElement,
      },
    },
  };

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
          const active = uniqueYears.find((y) => y.active) || uniqueYears[0];
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

      if (res.data.failedCount > 0 || res.data.skippedCount > 0) {
        setUploadSummary(res.data);
      } else {
        setUploadSummary(res.data);
        toast.success(`Successfully uploaded ${res.data.successCount} records!`);
      }
      fetchResults();
    } catch (err) {
      console.error("Upload failed:", err);
      const backendError = err.response?.data?.message;
      const backendDetails = err.response?.data?.errors;
      const skippedDetails = err.response?.data?.skipped || [];

      if (err.response?.data) {
        setUploadSummary({
            totalRecords: err.response.data.totalRecords || 0,
            successCount: err.response.data.successCount || 0,
            skippedCount: err.response.data.skippedCount || 0,
            failedCount: err.response.data.failedCount || (Array.isArray(backendDetails) ? backendDetails.length : 1),
            errors: Array.isArray(backendDetails) ? backendDetails : [{ row: '-', message: backendError || "Upload failed" }],
            skipped: skippedDetails
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
      "subjectType",
      "section",
      "phase",
      "semester_or_year",
      "totalStudents",
      "givenStudents",
      "percentage",
    ];
    const sampleRows = [
        ["FAC123", "2024-2025", "B.Tech", "CSE", "Mathematics", "MA101", "T", "A", "1", "3", "60", "55", "90.6"],
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
        toast.info("No records to delete");
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
        subtitle="Coordinate student feedback data and institutional reports" action={
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
              variant="outlined"
              onClick={downloadTemplate}
              sx={{
                background: "var(--bg-glass)",
                color: "var(--text-primary)",
                borderColor: "var(--border-color)",
                px: 2.5,
                transition: "all 0.2s ease",
                "&:hover": {
                  background: "var(--bg-accent-1)",
                  borderColor: "var(--color-primary)",
                  color: "var(--color-primary)",
                }
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
                        onChange={(e) => {
                            setSelectedYearId(e.target.value);
                            blurActiveElement();
                        }}
                        onOpen={blurActiveElement}
                        onClose={blurActiveElement}
                        MenuProps={selectMenuProps}
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
                        onChange={(e) => {
                            setSelectedPhase(e.target.value);
                            blurActiveElement();
                        }}
                        onOpen={blurActiveElement}
                        onClose={blurActiveElement}
                        MenuProps={selectMenuProps}
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
                            {r.subjectType && (
                              <>
                                <Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: "var(--border-color)" }} />
                                <Typography sx={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 600, textTransform: "capitalize" }}>{r.subjectType}</Typography>
                              </>
                            )}
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
                value: r.givenStudents ?? 0,
                display: (
                    <Box sx={{ fontWeight: 700 }}>
                        {r.givenStudents !== null && r.givenStudents !== undefined ? r.givenStudents : "—"} <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>/</span> {r.totalStudents !== null && r.totalStudents !== undefined ? r.totalStudents : "—"}
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

      {/* Upload Summary Dialog */}
      <Dialog
        open={Boolean(uploadSummary)}
        onClose={() => setUploadSummary(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "20px",
            background: "var(--bg-panel)",
            boxShadow: "var(--shadow-premium)",
            border: "1px solid var(--border-color)",
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 2, 
          borderBottom: "1px solid var(--border-color)",
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center" 
        }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
            Upload Summary
          </Typography>
          <IconButton onClick={() => setUploadSummary(null)} size="small" sx={{ color: "var(--text-secondary)" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {uploadSummary && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {/* Summary Stats */}
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <Box sx={{ flex: 1, p: 2, borderRadius: "12px", background: "rgba(59, 130, 246, 0.05)", border: "1px solid rgba(59, 130, 246, 0.2)", textAlign: "center" }}>
                  <Typography sx={{ fontSize: 24, fontWeight: 800, color: "#3b82f6" }}>{uploadSummary.totalRecords || 0}</Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>Total</Typography>
                </Box>
                <Box sx={{ flex: 1, p: 2, borderRadius: "12px", background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.2)", textAlign: "center" }}>
                  <Typography sx={{ fontSize: 24, fontWeight: 800, color: "#10b981" }}>{uploadSummary.successCount || 0}</Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>Success</Typography>
                </Box>
                <Box sx={{ flex: 1, p: 2, borderRadius: "12px", background: "rgba(245, 158, 11, 0.05)", border: "1px solid rgba(245, 158, 11, 0.2)", textAlign: "center" }}>
                  <Typography sx={{ fontSize: 24, fontWeight: 800, color: "#f59e0b" }}>{uploadSummary.skippedCount || 0}</Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>Skipped</Typography>
                </Box>
                <Box sx={{ flex: 1, p: 2, borderRadius: "12px", background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.2)", textAlign: "center" }}>
                  <Typography sx={{ fontSize: 24, fontWeight: 800, color: "#ef4444" }}>{uploadSummary.failedCount || 0}</Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>Failed</Typography>
                </Box>
              </Box>

              {/* Failed Rows */}
              {uploadSummary.errors && uploadSummary.errors.length > 0 && (
                <Box>
                  <Typography sx={{ fontWeight: 700, color: "#ef4444", mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                    <InfoIcon fontSize="small" /> Failed Rows
                  </Typography>
                  <Box sx={{ maxHeight: 200, overflow: "auto", border: "1px solid var(--border-color)", borderRadius: "12px", background: "var(--bg-glass)" }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, width: 80 }}>Row</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {uploadSummary.errors.map((err, i) => (
                          <TableRow key={i}>
                            <TableCell sx={{ fontWeight: 600 }}>{err.row || '-'}</TableCell>
                            <TableCell sx={{ color: "var(--text-secondary)" }}>{err.message}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                </Box>
              )}

              {/* Skipped Rows */}
              {uploadSummary.skipped && uploadSummary.skipped.length > 0 && (
                <Box>
                  <Typography sx={{ fontWeight: 700, color: "#f59e0b", mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                    <InfoIcon fontSize="small" /> Skipped Rows
                  </Typography>
                  <Box sx={{ maxHeight: 200, overflow: "auto", border: "1px solid var(--border-color)", borderRadius: "12px", background: "var(--bg-glass)" }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, width: 80 }}>Row</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {uploadSummary.skipped.map((skip, i) => (
                          <TableRow key={i}>
                            <TableCell sx={{ fontWeight: 600 }}>{skip.row || '-'}</TableCell>
                            <TableCell sx={{ color: "var(--text-secondary)" }}>{skip.message}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
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
