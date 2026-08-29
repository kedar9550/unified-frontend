import Loader from "../../components/common/Loader";
import PageHeader from "../../components/common/PageHeader";
import { PageContainer } from "../../components/common/design-system";
import SectionHeader from "../../components/common/SectionHeader";
import StatCard from "../../components/common/StatCard";
import ActionButton from "../../components/common/ActionButton";
import DataTable from "../../components/data/DataTable";
import {
  Box,
  MenuItem,
  Select,
  Avatar,
  IconButton,
  Tooltip,
  Typography,
  Menu,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
} from "@mui/material";
import { toast } from "sonner";
import { useEffect, useState, useRef } from "react";
import API from "../../api/axios";
import {
  Download as DownloadIcon,
  FileUpload as UploadIcon,
  Delete as DeleteIcon,
  DeleteSweep as ClearIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  InfoOutlined as InfoIcon,
  CleaningServices as CleanIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { Divider } from "@mui/material";

export default function FacultyFormatResults() {
  const [academicYears, setAcademicYears] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState("");
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [searchFacultyId, setSearchFacultyId] = useState("");

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [deleteMenuAnchor, setDeleteMenuAnchor] = useState(null);
  const [uploadSummary, setUploadSummary] = useState(null);

  // 1. Fetch Academic Years on Mount
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const res = await API.get("/api/academic-years", { skipGlobalLoader: true });
        const years = res.data.years || [];
        // Remove duplicates if any
        const uniqueYears = Array.from(new Set(years.map(y => y.year)))
          .map(yearName => years.find(y => y.year === yearName));

        setAcademicYears(uniqueYears);
        if (uniqueYears.length > 0) {
          // Find active or first
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
        const res = await API.get("/api/academics/programs", { skipGlobalLoader: true });
        setPrograms(res.data.data || []);
      } catch (err) {
        console.error("Error fetching programs:", err);
      }
    };
    fetchPrograms();
  }, []);

  // 2. Removed Global Semesters fetch as per user request

  // 3. Fetch Results when filters change
  const fetchResults = async () => {
    if (!selectedYearId) return;
    setLoading(true);
    try {
      const res = await API.get("/api/faculty-subject-results", {
        params: {
          academicYearId: selectedYearId,
          programId: selectedProgramId,
          facultyId: searchFacultyId
        },
        skipGlobalLoader: true,
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
  }, [selectedYearId, selectedProgramId, searchFacultyId]);

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
        "/api/faculty-subject-results/upload-results",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          skipGlobalLoader: true,
        }
      );

      if (res.data.failedCount > 0 || res.data.skippedCount > 0) {
        setUploadSummary(res.data);
      } else {
        setUploadSummary(res.data);
        toast.success("Upload successful!");
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

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await API.delete(`/api/faculty-subject-results/${id}`, { skipGlobalLoader: true });
      setResults((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
      const msg = err.response?.data?.message || "Failed to delete record.";
      toast.error(msg);
    }
  };

  const handleClear = async (mode) => {
    if (!selectedYearId) return;

    let confirmMsg = "";
    const params = { academicYearId: selectedYearId };

    if (mode === "ALL") {
      confirmMsg = "CRITICAL: This will PERMANENTLY DELETE ALL records for the selected academic year. Continue?";
    } else if (mode === "PROGRAM") {
      if (!selectedProgramId) {
        toast.warning("Please select a program first");
        return;
      }
      const progName = programs.find(p => p._id === selectedProgramId)?.name;
      confirmMsg = `This will delete ALL records for ${progName} in the selected year. Continue?`;
      params.programId = selectedProgramId;
    } else if (mode === "FACULTY") {
      if (!searchFacultyId) {
        toast.warning("Please enter a Faculty ID in the filter first");
        return;
      }
      confirmMsg = `This will delete ALL records for Faculty ID: ${searchFacultyId} in the selected year. Continue?`;
      params.facultyId = searchFacultyId;
    }

    if (!window.confirm(confirmMsg)) return;

    setLoading(true);
    try {
      await API.delete("/api/faculty-subject-results/semester", { params, skipGlobalLoader: true });
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

  const handleClearAll = async () => {
    handleClear("ALL");
  };

  const downloadTemplate = () => {
    const headers = [
      "facultyId",
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
      ["FAC123", "2024-2025", "B.Tech", "CSE", "Mathematics", "MA101", "T", "3", "60", "55", "5", "4", "A"],
      ["FAC123", "2024-2025", "B.Tech", "CSE", "Physics Lab", "PH102", "P", "3", "60", "58", "4", "4", "A"],
      ["FAC123", "2024-2025", "B.Tech", "CSE", "Programming", "CS103", "I", "3", "60", "57", "6", "5", "A"],
    ];
    const note = "# Result Type: Use T = Theory, P = Practical, I = Integrated.";
    const csvContent = headers.join(",") + "\n" + sampleRows.map(row => row.join(",")).join("\n") + "\n" + note + "\n";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "faculty_format_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };


  return (
    <PageContainer>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept=".csv"
        onChange={handleFileChange}
      />

      <PageHeader
        title="Exam Results (Faculty Format)"
        subtitle="Upload and manage exam results formatted by faculty and courses"
        action={
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <ActionButton
              variant="outlined"
              onClick={downloadTemplate}
              startIcon={<DownloadIcon sx={{ fontSize: 18 }} />}
              sx={{ fontWeight: 700, px: 2.5, height: 40 }}
            >
              Template
            </ActionButton>

            <ActionButton
              onClick={handleUploadClick}
              disabled={uploading}
              startIcon={<UploadIcon sx={{ fontSize: 18 }} />}
              sx={{ fontWeight: 800, px: 3, height: 40 }}
            >
              {uploading ? "Uploading..." : "Upload CSV"}
            </ActionButton>
          </Box>
        }
      />

      {/* Filter Options */}
      <Paper elevation={0} sx={{
        p: { xs: 1.5, md: 2.5 },
        mb: 3,
        background: { xs: "transparent", md: "var(--bg-paper)" },
        border: { xs: "none", md: "1px solid var(--border-color)" },
        boxShadow: { xs: "none", md: "var(--shadow-premium)" },
        borderRadius: { xs: "8px", md: "16px" },
        display: "flex",
        flexDirection: "column",
        gap: 2
      }}>
        {/* Info Note Banner */}
        <Box sx={{
          p: 1.5,
          px: 2,
          borderRadius: "10px",
          background: "var(--bg-glass)",
          border: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "center",
          gap: 1.5
        }}>
          <InfoIcon sx={{ color: "var(--color-primary)", fontSize: 20 }} />
          <Typography sx={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600 }}>
            Subject Type: Use <strong>T</strong> = Theory, <strong>P</strong> = Practical, <strong>I</strong> = Integrated.
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

            <Box sx={filterBox}>
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 2, opacity: 0.7 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.05em' }}>PROGRAM</Typography>
              </Box>
              <Select
                variant="standard"
                disableUnderline
                value={selectedProgramId}
                onChange={(e) => setSelectedProgramId(e.target.value)}
                sx={{ flex: 1, minWidth: 160, fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}
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

          <Box sx={{
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            width: { xs: '100%', sm: 'auto' },
            flexDirection: { xs: 'column', sm: 'row' }
          }}>
            <TextField
              placeholder="Search Faculty ID..."
              size="small"
              value={searchFacultyId}
              onChange={(e) => setSearchFacultyId(e.target.value)}
              sx={{
                width: { xs: "100%", sm: 240 },
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
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 20, color: "var(--color-primary)", opacity: 0.8 }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchFacultyId && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchFacultyId("")} sx={{ mr: 0.5, opacity: 0.6 }}>
                        <CloseIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
            />

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
              <MenuItem onClick={() => handleClear("PROGRAM")} disabled={!selectedProgramId}>
                <FilterIcon fontSize="small" sx={{ opacity: 0.6 }} /> Delete by Program
              </MenuItem>
              <MenuItem onClick={() => handleClear("FACULTY")} disabled={!searchFacultyId}>
                <SearchIcon fontSize="small" sx={{ opacity: 0.6 }} /> Delete by Faculty
              </MenuItem>
              <Divider sx={{ my: 0.5, borderStyle: 'dashed' }} />
              <MenuItem onClick={() => handleClear("ALL")} sx={{ color: "#EF4444 !important" }}>
                <ClearIcon fontSize="small" /> Clear All (Yearly)
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      </Paper>


      {/* 🔹 RESULTS TABLE */}
      <Box sx={{ width: '100%' }}>
        <SectionHeader title="Faculty Results" />

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
              📊
            </Box>
            <Typography
              variant="h6"
              fontWeight={800}
              sx={{ color: "var(--text-primary)", mb: 1 }}
            >
              No Faculty Results Found
            </Typography>
            <Typography
              sx={{ color: "var(--text-secondary)", maxWidth: 350, fontSize: 14, opacity: 0.8, lineHeight: 1.6 }}
            >
              We couldn't find any results matching your filters. Try selecting a different academic year, program, or faculty ID.
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
              Upload Faculty Results
            </ActionButton>
          </Box>
        ) : (
          <DataTable
            key={`${selectedYearId}-${selectedProgramId}-${searchFacultyId}`}
            columns={[
              "Faculty ID",
              "Faculty Name",
              "Subject Name",
              "Course Code",
              "Type",
              "Section",
              "Sem / Year",
              "Appeared",
              "Passed",
              "%",
              "Last Updated",
              "Action",
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
                      <Box sx={{ fontSize: 11, color: "var(--text-secondary)", opacity: 0.8 }}>
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
                value: r.courseType,
                display: (
                  <Box sx={{
                    fontWeight: 800,
                    background: "var(--gradient-primary)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    display: "inline-block"
                  }}>
                    {r.courseType}
                  </Box>
                ),
              },

              {
                value: r.section,
                display: <Box>{r.section || "-"}</Box>,
              },

              {
                value: r.semesterDisplay,
                display: (
                  <Box>
                    <Box sx={{ fontWeight: 600 }}>{r.semesterDisplay}</Box>
                    <Box sx={{ fontSize: 11, color: "var(--text-secondary)", opacity: 0.8 }}>{r.semesterType}</Box>
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
                  <Box sx={{ color: "#10b981", fontWeight: 700 }}>
                    {r.passPercentage}%
                  </Box>
                ),
              },

              {
                value: r.updatedAt,
                display: <Box sx={{ fontSize: 12 }}>{new Date(r.updatedAt).toLocaleDateString("en-GB")}</Box>,
              },
              {
                value: "action",
                display: (
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => handleDelete(r._id)} sx={{ color: "#EF4444" }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ),
              },
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
    </PageContainer>
  );
}

// ── Styled Components Logic ─────────────────────────────────────────

const controlItemStyle = {
  display: "flex",
  alignItems: "center",
  px: 2,
  py: 1,
  borderRadius: "12px",
  background: "var(--bg-glass)",
  border: "1px solid var(--border-color)",
  transition: "all 0.2s ease",
  "&:focus-within": {
    borderColor: "var(--color-primary)",
    boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.08)"
  }
};

const controlLabelStyle = {
  fontSize: 10,
  fontWeight: 800,
  color: "var(--text-secondary)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  mr: 1.5,
  opacity: 0.7
};

const controlSelectStyle = {
  minWidth: 100,
  color: "var(--text-primary)",
  fontWeight: 700,
  fontSize: 13,
  '& .MuiSelect-icon': { color: 'var(--text-primary)', opacity: 0.4 }
};

const controlInputStyle = {
  background: "transparent",
  border: "none",
  outline: "none",
  color: "var(--text-primary)",
  fontWeight: 700,
  fontSize: 13,
  width: "100%",
  padding: "4px 0"
};

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
  width: { xs: "100%", sm: "auto" },
  '& .MuiInputBase-root, & .MuiSelect-select': {
    background: 'transparent !important',
    backgroundColor: 'transparent !important',
  },
  '& .MuiSelect-icon': { color: 'var(--text-primary)', opacity: 0.4 }
};


