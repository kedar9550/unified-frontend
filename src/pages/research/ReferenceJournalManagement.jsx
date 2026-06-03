import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  InputAdornment,
  TablePagination,
  Tooltip,
  Alert,
  CircularProgress,
  Stack,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Book,
  Assessment,
  CheckCircle,
  Equalizer,
  UploadFile,
  Close
} from "@mui/icons-material";
import API from "../../api/axios";
import { toast } from "sonner";
import Loader from "../../components/common/Loader";
import PageHeader from "../../components/common/PageHeader";

const ReferenceJournalManagement = () => {
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [types, setTypes] = useState(["FT50", "Scopus", "SCIE"]);
  const [selectedType, setSelectedType] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  // Tabs State
  const [activeTab, setActiveTab] = useState(0);

  // Statistics State
  const [stats, setStats] = useState({ total: 0, byType: {} });

  // Pagination State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);

  // Individual Form State
  const [form, setForm] = useState({
    title: "",
    impactFactor: "",
    type: "FT50",
    customType: ""
  });

  // Bulk Upload State
  const [csvFile, setCsvFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Edit State
  const [editingJournal, setEditingJournal] = useState(null);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(0);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const fetchJournals = async () => {
    setLoading(true);
    try {
      const res = await API.get("/api/reference-journals", {
        params: {
          type: selectedType,
          search: debouncedSearch,
          page: page + 1,
          limit: rowsPerPage
        }
      });
      if (res.data?.success) {
        setJournals(res.data.data);
        setTotalRows(res.data.pagination.total);
        if (res.data.types && res.data.types.length > 0) {
          const mergedTypes = Array.from(new Set(["FT50", "Scopus", "SCIE", ...res.data.types]));
          setTypes(mergedTypes);
        }
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      toast.error("Failed to retrieve reference journals.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJournals();
  }, [selectedType, page, rowsPerPage, debouncedSearch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setPage(0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this journal from the database?")) return;
    try {
      const res = await API.delete(`/api/reference-journals/${id}`);
      if (res.data?.success) {
        toast.success("Journal deleted successfully");
        fetchJournals();
      }
    } catch (err) {
      toast.error("Failed to delete journal.");
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const finalType = form.type === "Other" ? form.customType.trim() : form.type;
    if (!form.title.trim()) return toast.error("Journal title is required");
    if (!finalType) return toast.error("Journal type is required");

    const payload = {
      title: form.title.trim(),
      impactFactor: form.impactFactor.trim() || "NA",
      type: finalType.trim()
    };

    try {
      const res = await API.post("/api/reference-journals", payload);
      if (res.data?.success) {
        toast.success("Journal added successfully");
        setForm({
          title: "",
          impactFactor: "",
          type: "FT50",
          customType: ""
        });
        // Switch to the directory tab to see it
        setActiveTab(0);
        fetchJournals();
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to save journal.";
      toast.error(errMsg);
    }
  };

  const handleEditClick = (journal) => {
    const isCustom = !["FT50", "Scopus", "SCIE"].includes(journal.type);
    setEditingJournal({
      _id: journal._id,
      title: journal.title,
      impactFactor: journal.impactFactor,
      type: isCustom ? "Other" : journal.type,
      customType: isCustom ? journal.type : ""
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const finalType = editingJournal.type === "Other" ? editingJournal.customType.trim() : editingJournal.type;
    if (!editingJournal.title.trim()) return toast.error("Journal title is required");
    if (!finalType) return toast.error("Journal type is required");

    const payload = {
      title: editingJournal.title.trim(),
      impactFactor: editingJournal.impactFactor.trim() || "NA",
      type: finalType.trim()
    };

    try {
      const res = await API.put(`/api/reference-journals/${editingJournal._id}`, payload);
      if (res.data?.success) {
        toast.success("Journal updated successfully");
        setEditingJournal(null);
        fetchJournals();
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to update journal.";
      toast.error(errMsg);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
      setUploadResult(null);
    }
  };

  // Drag and Drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith(".csv")) {
        setCsvFile(file);
        setUploadResult(null);
      } else {
        toast.error("Please drop a valid CSV file.");
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleBulkUpload = async () => {
    if (!csvFile) return toast.error("Please choose or drag a CSV file first.");
    const formData = new FormData();
    formData.append("file", csvFile);
    formData.append("defaultType", form.type === "Other" ? form.customType : form.type);

    setUploading(true);
    try {
      const res = await API.post("/api/reference-journals/bulk", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data?.success) {
        toast.success("CSV file processed successfully!");
        setUploadResult(res.data);
        setCsvFile(null);
        fetchJournals();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to process bulk upload.");
    } finally {
      setUploading(false);
    }
  };

  const downloadSampleTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Academy of Management Journal,10.5,FT50\nAcademy of Management Review,13.9,FT50\nAccounting Organizations and Society,4,FT50\nJournal of Accounting and Economics,NA,FT50\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "reference_journals_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getChipColor = (type) => {
    const cleanType = (type || "").toUpperCase().replace(/[-_ ]/g, "");
    if (cleanType.includes("FT50")) return { bg: "rgba(59, 130, 246, 0.08)", color: "#3b82f6", border: "rgba(59, 130, 246, 0.15)" };
    if (cleanType.includes("SCOPUS")) return { bg: "rgba(16, 185, 129, 0.08)", color: "#10b981", border: "rgba(16, 185, 129, 0.15)" };
    if (cleanType.includes("SCIE") || cleanType.includes("SCI")) return { bg: "rgba(245, 158, 11, 0.08)", color: "#f59e0b", border: "rgba(245, 158, 11, 0.15)" };
    return { bg: "rgba(139, 92, 246, 0.08)", color: "#8b5cf6", border: "rgba(139, 92, 246, 0.15)" };
  };

  return (
    <Box sx={{ width: "100%", p: { xs: 1.5, sm: 2, md: 3 } }}>
      <PageHeader
        title="Reference Journals"
        subtitle="Manage the database of approved reference journals and their impact factors."
      />

      {/* Tabs Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: "var(--border-color)", mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => {
            setActiveTab(val);
            setUploadResult(null);
          }}
          sx={{
            "& .MuiTabs-indicator": {
              height: "3px",
              borderRadius: "3px",
              background: "var(--color-primary)",
            },
            "& .MuiTab-root": {
              fontWeight: 800,
              textTransform: "none",
              fontSize: "0.95rem",
              color: "var(--text-secondary)",
              minHeight: "48px",
              mr: 3,
              transition: "all 0.2s",
              "&.Mui-selected": {
                color: "var(--color-primary)",
              },
              "&:hover": {
                opacity: 0.8,
              },
            },
          }}
        >
          <Tab
            label="Journal List"
            icon={<Book sx={{ fontSize: "1.2rem", mr: 0.5 }} />}
            iconPosition="start"
          />
          <Tab
            label="Add / Upload"
            icon={<UploadIcon sx={{ fontSize: "1.2rem", mr: 0.5 }} />}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      {activeTab === 0 && (
        <Box sx={{ animation: "fadeIn 0.3s ease" }}>
          {/* Controls Bar */}
          <Paper
            sx={{
              borderRadius: "20px",
              border: "1px solid var(--border-color)",
              background: "var(--bg-panel)",
              p: 2.5,
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.01)",
              mb: 3
            }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: "var(--text-secondary)", fontWeight: 600 }}>Filter by Type</InputLabel>
                  <Select
                    value={selectedType}
                    label="Filter by Type"
                    onChange={(e) => {
                      setSelectedType(e.target.value);
                      setPage(0);
                    }}
                    sx={{
                      borderRadius: "12px",
                      background: "var(--bg-paper)",
                      color: "var(--text-primary)",
                      fontWeight: 700,
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "var(--border-color)",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "var(--color-primary)",
                      }
                    }}
                  >
                    <MenuItem value="All">All Types</MenuItem>
                    {types.map((t, idx) => (
                      <MenuItem key={idx} value={t}>{t}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={8} md={9}>
                <form onSubmit={handleSearchSubmit}>
                  <TextField
                    fullWidth
                    size="small"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title..."
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: "var(--text-secondary)", fontSize: "1.1rem" }} />
                        </InputAdornment>
                      ),
                      endAdornment: searchQuery && (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={handleClearSearch}>
                            <Close sx={{ fontSize: "1rem" }} />
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "12px",
                        background: "var(--bg-paper)",
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "var(--border-color)",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "var(--color-primary)",
                        }
                      }
                    }}
                  />
                </form>
              </Grid>
            </Grid>
          </Paper>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <Loader />
            </Box>
          ) : (
            <>
              <TableContainer 
                component={Paper} 
                sx={{ 
                  borderRadius: "20px", 
                  background: "var(--bg-paper)", 
                  border: "1px solid var(--border-color)",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.01)",
                  overflow: "hidden"
                }}
              >
                <Table size="medium">
                  <TableHead>
                    <TableRow sx={{ background: "rgba(11, 82, 153, 0.03)" }}>
                      <TableCell sx={{ fontWeight: 800, width: "70px", color: "var(--text-primary)" }}>S.No</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Journal Name</TableCell>
                      <TableCell sx={{ fontWeight: 800, width: "160px", color: "var(--text-primary)" }} align="center">Impact Factor</TableCell>
                      <TableCell sx={{ fontWeight: 800, width: "160px", color: "var(--text-primary)" }} align="center">Type</TableCell>
                      <TableCell sx={{ fontWeight: 800, width: "120px", color: "var(--text-primary)" }} align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {journals.length > 0 ? (
                      journals.map((journal, index) => {
                        const style = getChipColor(journal.type);
                        return (
                          <TableRow 
                            key={journal._id} 
                            sx={{ 
                              transition: "all 0.2s",
                              "&:hover": { 
                                background: "rgba(11, 82, 153, 0.01)",
                                boxShadow: "inset 4px 0 0 var(--color-primary)"
                              } 
                            }}
                          >
                            <TableCell sx={{ fontWeight: 600, color: "var(--text-secondary)" }}>
                              {page * rowsPerPage + index + 1}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.95rem" }}>
                              {journal.title}
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={journal.impactFactor}
                                size="small"
                                sx={{
                                  fontWeight: 800,
                                  fontSize: "0.75rem",
                                  bgcolor: journal.impactFactor === "NA" ? "var(--bg-panel)" : "rgba(16, 185, 129, 0.08)",
                                  color: journal.impactFactor === "NA" ? "var(--text-secondary)" : "#10b981",
                                  borderRadius: "8px",
                                  px: 1,
                                  border: journal.impactFactor === "NA" ? "1px solid var(--border-color)" : "1px solid rgba(16, 185, 129, 0.15)"
                                }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={journal.type}
                                size="small"
                                sx={{
                                  fontWeight: 800,
                                  fontSize: "0.75rem",
                                  bgcolor: style.bg,
                                  color: style.color,
                                  border: `1px solid ${style.border}`,
                                  borderRadius: "8px",
                                  px: 1
                                }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Stack direction="row" spacing={1} justifyContent="center">
                                <Tooltip title="Edit Details">
                                  <IconButton
                                    size="small"
                                    sx={{ 
                                      color: "var(--color-primary)",
                                      background: "rgba(11, 82, 153, 0.05)",
                                      "&:hover": { background: "rgba(11, 82, 153, 0.12)" }
                                    }}
                                    onClick={() => handleEditClick(journal)}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Remove Journal">
                                  <IconButton
                                    size="small"
                                    sx={{ 
                                      color: "#ef4444",
                                      background: "rgba(239, 68, 68, 0.05)",
                                      "&:hover": { background: "rgba(239, 68, 68, 0.12)" }
                                    }}
                                    onClick={() => handleDelete(journal._id)}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                          <Box sx={{ textContent: "center", opacity: 0.7 }}>
                            <Typography variant="body1" sx={{ fontWeight: 700, mb: 0.5, color: "var(--text-secondary)" }}>
                              No Reference Journals Found
                            </Typography>
                            <Typography variant="body2" sx={{ color: "var(--text-secondary)" }}>
                              No registries match your search criteria.
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  component="div"
                  count={totalRows}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={(e, newPage) => setPage(newPage)}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                  sx={{ 
                    color: "var(--text-primary)",
                    border: "none",
                    "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                      fontWeight: 700,
                      color: "var(--text-secondary)"
                    }
                  }}
                />
              </Box>
            </>
          )}
        </Box>
      )}

      {activeTab === 1 && (
        <Box 
          sx={{ 
            animation: "fadeIn 0.3s ease", 
            display: "flex", 
            flexDirection: { xs: "column", sm: "row" }, 
            gap: 3, 
            alignItems: "stretch" 
          }}
        >
          {/* CSV Bulk Uploader */}
          <Box
            sx={{
              flex: 1,
              borderRadius: "20px",
              border: "1px solid var(--border-color)",
              background: "var(--bg-panel)",
              boxShadow: "var(--shadow-premium)",
              p: 4,
              display: "flex",
              flexDirection: "column"
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: "var(--text-primary)" }}>
              Upload CSV File
            </Typography>
            <Typography variant="body2" sx={{ color: "var(--text-secondary)", mb: 3.5 }}>
              Upload a CSV file containing columns: Title, Impact Factor, and Type.
            </Typography>

            {/* Drag Drop zone */}
            <Box
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileInput}
              sx={{
                border: dragActive 
                  ? "2px dashed var(--color-primary)" 
                  : "2px dashed var(--border-color)",
                borderRadius: "20px",
                p: 4,
                textAlign: "center",
                background: dragActive 
                  ? "rgba(11, 82, 153, 0.05)" 
                  : "rgba(0,0,0,0.01)",
                cursor: "pointer",
                mb: 3,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": { 
                  borderColor: "var(--color-primary)",
                  background: "rgba(11, 82, 153, 0.02)"
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                hidden
                onChange={handleFileChange}
              />
              <UploadIcon sx={{ fontSize: 40, color: "var(--color-primary)", mb: 1.5, opacity: 0.8 }} />
              <Typography variant="body1" sx={{ fontWeight: 800, color: "var(--text-primary)", mb: 0.5 }}>
                {dragActive ? "Drop CSV file here" : "Drag and drop CSV here"}
              </Typography>
              <Typography variant="body2" sx={{ color: "var(--text-secondary)", mb: 1 }}>
                or click to browse
              </Typography>
            </Box>

            {csvFile && (
              <Paper
                variant="outlined"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 2,
                  borderRadius: "16px",
                  borderColor: "rgba(11, 82, 153, 0.3)",
                  background: "rgba(11, 82, 153, 0.02)",
                  mb: 3
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <UploadFile sx={{ color: "var(--color-primary)", fontSize: 24 }} />
                  <Box sx={{ textAlign: "left" }}>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                      {csvFile.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "var(--text-secondary)" }}>
                      {(csvFile.size / 1024).toFixed(1)} KB
                    </Typography>
                  </Box>
                </Box>
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setCsvFile(null);
                    setUploadResult(null);
                  }}
                  sx={{ color: "var(--text-secondary)", '&:hover': { color: '#ef4444' } }}
                >
                  <Close sx={{ fontSize: 18 }} />
                </IconButton>
              </Paper>
            )}

            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
              <Button
                fullWidth
                variant="outlined"
                size="medium"
                startIcon={<DownloadIcon />}
                onClick={downloadSampleTemplate}
                sx={{ 
                  textTransform: "none", 
                  borderRadius: "12px", 
                  fontWeight: 700,
                  borderColor: "var(--border-color)",
                  color: "var(--text-primary)",
                  "&:hover": {
                    borderColor: "var(--color-primary)",
                    background: "var(--bg-glass)"
                  }
                }}
              >
                Download Template
              </Button>
              <Button
                fullWidth
                variant="contained"
                disabled={!csvFile || uploading}
                onClick={handleBulkUpload}
                startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : <UploadIcon />}
                sx={{
                  borderRadius: "12px",
                  textTransform: "none",
                  fontWeight: 700,
                  background: "var(--gradient-primary)",
                  color: "#fff",
                  "&:hover": {
                    background: "var(--gradient-primary-hover)"
                  }
                }}
              >
                {uploading ? "Importing..." : "Upload CSV"}
              </Button>
            </Stack>

            {uploadResult && (
              <Alert
                severity="success"
                sx={{ 
                  borderRadius: "16px", 
                  fontSize: "0.85rem",
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                  background: "rgba(16, 185, 129, 0.05)"
                }}
              >
                <strong>Import Successful:</strong> Added {uploadResult.insertedCount} new journals. Skipped {uploadResult.skippedDuplicates} duplicates.
              </Alert>
            )}
          </Box>

          {/* Add Single Journal */}
          <Box
            sx={{
              flex: 1,
              borderRadius: "20px",
              border: "1px solid var(--border-color)",
              background: "var(--bg-panel)",
              boxShadow: "var(--shadow-premium)",
              p: 4,
              display: "flex",
              flexDirection: "column"
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: "var(--text-primary)" }}>
              Add Manually
            </Typography>
            <Typography variant="body2" sx={{ color: "var(--text-secondary)", mb: 3.5 }}>
              Fill out the form below to add a single journal to the list.
            </Typography>

            <Box component="form" onSubmit={handleFormSubmit} sx={{ display: "flex", flexDirection: "column", gap: 3, flexGrow: 1 }}>
              <TextField
                label="Journal Title"
                required
                fullWidth
                size="medium"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    background: "var(--bg-paper)",
                  }
                }}
              />

              <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    label="Impact Factor"
                    fullWidth
                    size="medium"
                    value={form.impactFactor}
                    onChange={(e) => setForm({ ...form, impactFactor: e.target.value })}
                    placeholder="e.g. 10.5, 4.0, NA"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "12px",
                        background: "var(--bg-paper)",
                      }
                    }}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <FormControl fullWidth size="medium">
                    <InputLabel sx={{ fontWeight: 600 }}>Journal Type</InputLabel>
                    <Select
                      value={form.type}
                      label="Journal Type"
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                      sx={{
                        borderRadius: "12px",
                        background: "var(--bg-paper)",
                      }}
                    >
                      <MenuItem value="FT50">FT50</MenuItem>
                      <MenuItem value="Scopus">Scopus</MenuItem>
                      <MenuItem value="SCIE">SCIE</MenuItem>
                      <MenuItem value="Other">Other / Custom</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              {form.type === "Other" && (
                <TextField
                  label="Custom Type Name"
                  required
                  fullWidth
                  size="medium"
                  value={form.customType}
                  onChange={(e) => setForm({ ...form, customType: e.target.value })}
                  placeholder="e.g. ABDC, Web of Science"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "12px",
                      background: "var(--bg-paper)",
                    }
                  }}
                />
              )}

              <Box sx={{ mt: "auto", pt: 2 }}>
                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={<AddIcon />}
                  sx={{
                    borderRadius: "12px",
                    textTransform: "none",
                    fontWeight: 700,
                    py: 1.5,
                    background: "var(--gradient-primary)",
                    color: "#fff",
                    "&:hover": {
                      background: "var(--gradient-primary-hover)"
                    }
                  }}
                >
                  Save Journal
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      {/* Edit Modal Dialog */}
      <Dialog
        open={!!editingJournal}
        onClose={() => setEditingJournal(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "24px",
            p: 2,
            background: "var(--bg-paper)",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-premium)"
          }
        }}
      >
        {editingJournal && (
          <Box component="form" onSubmit={handleEditSubmit}>
            <DialogTitle sx={{ fontWeight: 800, pb: 1, color: "var(--text-primary)" }}>
              Edit Journal
            </DialogTitle>
            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 2 }}>
              <TextField
                label="Journal Title"
                required
                fullWidth
                value={editingJournal.title}
                onChange={(e) => setEditingJournal({ ...editingJournal, title: e.target.value })}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                  }
                }}
              />

              <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    label="Impact Factor"
                    fullWidth
                    value={editingJournal.impactFactor}
                    onChange={(e) => setEditingJournal({ ...editingJournal, impactFactor: e.target.value })}
                    placeholder="e.g. 10.5, 4.0, NA"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "12px",
                      }
                    }}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <FormControl fullWidth>
                    <InputLabel>Journal Type</InputLabel>
                    <Select
                      value={editingJournal.type}
                      label="Journal Type"
                      onChange={(e) => setEditingJournal({ ...editingJournal, type: e.target.value })}
                      sx={{
                        borderRadius: "12px",
                      }}
                    >
                      <MenuItem value="FT50">FT50</MenuItem>
                      <MenuItem value="Scopus">Scopus</MenuItem>
                      <MenuItem value="SCIE">SCIE</MenuItem>
                      <MenuItem value="Other">Other / Custom</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              {editingJournal.type === "Other" && (
                <TextField
                  label="Custom Type Name"
                  required
                  fullWidth
                  value={editingJournal.customType}
                  onChange={(e) => setEditingJournal({ ...editingJournal, customType: e.target.value })}
                  placeholder="e.g. ABDC, Web of Science"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "12px",
                    }
                  }}
                />
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button 
                onClick={() => setEditingJournal(null)}
                sx={{ 
                  textTransform: "none", 
                  fontWeight: 700, 
                  borderRadius: "10px",
                  color: "var(--text-secondary)"
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                variant="contained"
                sx={{ 
                  textTransform: "none", 
                  fontWeight: 700, 
                  borderRadius: "10px",
                  background: "var(--gradient-primary)",
                  color: "#fff",
                  "&:hover": {
                    background: "var(--gradient-primary-hover)"
                  }
                }}
              >
                Update Journal
              </Button>
            </DialogActions>
          </Box>
        )}
      </Dialog>
    </Box>
  );
};

export default ReferenceJournalManagement;
