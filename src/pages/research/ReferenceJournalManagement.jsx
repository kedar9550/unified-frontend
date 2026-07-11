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
  const [openAddJournalModal, setOpenAddJournalModal] = useState(false);

  // JIF Tab State
  const [jifs, setJifs] = useState([]);
  const [jifLoading, setJifLoading] = useState(false);
  const [jifSearchQuery, setJifSearchQuery] = useState("");
  const [jifDebouncedSearch, setJifDebouncedSearch] = useState("");
  const [jifPage, setJifPage] = useState(0);
  const [jifRowsPerPage, setJifRowsPerPage] = useState(10);
  const [jifTotalRows, setJifTotalRows] = useState(0);
  const [editingJif, setEditingJif] = useState(null);

  // JIF Add/Upload State
  const [openAddJifModal, setOpenAddJifModal] = useState(false);
  const [jifForm, setJifForm] = useState({
    rank: "",
    journalName: "",
    abbreviatedJournal: "",
    publisher: "",
    jif: ""
  });
  const [jifCsvFile, setJifCsvFile] = useState(null);
  const [jifUploading, setJifUploading] = useState(false);
  const [jifUploadResult, setJifUploadResult] = useState(null);
  const [jifDragActive, setJifDragActive] = useState(false);
  const jifFileInputRef = useRef(null);

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

  // Debounce JIF search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setJifDebouncedSearch(jifSearchQuery);
      setJifPage(0);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [jifSearchQuery]);

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
      toast.error(err.response?.data?.message || "Failed to retrieve reference journals.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchJifs = async () => {
    setJifLoading(true);
    try {
      const res = await API.get("/api/journal-impact-factors", {
        params: {
          search: jifDebouncedSearch,
          page: jifPage + 1,
          limit: jifRowsPerPage
        }
      });
      if (res.data?.success) {
        setJifs(res.data.data);
        setJifTotalRows(res.data.pagination.total);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to retrieve journal impact factors.");
      console.error(err);
    } finally {
      setJifLoading(false);
    }
  };

  useEffect(() => {
    fetchJournals();
  }, [selectedType, page, rowsPerPage, debouncedSearch]);

  useEffect(() => {
    if (activeTab === 1) {
      fetchJifs();
    }
  }, [activeTab, jifPage, jifRowsPerPage, jifDebouncedSearch]);

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
      toast.error(err.response?.data?.message || "Failed to delete journal.");
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
        setOpenAddJournalModal(false);
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

  const handleJifClearSearch = () => {
    setJifSearchQuery("");
    setJifDebouncedSearch("");
    setJifPage(0);
  };

  const handleJifDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this journal impact factor entry?")) return;
    try {
      const res = await API.delete(`/api/journal-impact-factors/${id}`);
      if (res.data?.success) {
        toast.success("Journal impact factor entry deleted successfully");
        fetchJifs();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete journal impact factor entry.");
    }
  };

  const handleJifEditClick = (jif) => {
    setEditingJif({
      _id: jif._id,
      rank: jif.rank,
      journalName: jif.journalName,
      abbreviatedJournal: jif.abbreviatedJournal || "",
      publisher: jif.publisher || "",
      jif: jif.jif
    });
  };

  const handleJifEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingJif.journalName.trim()) return toast.error("Journal name is required");
    if (editingJif.rank === undefined || editingJif.rank === "") return toast.error("Rank is required");
    if (editingJif.jif === undefined || editingJif.jif === "") return toast.error("JIF value is required");

    const payload = {
      rank: Number(editingJif.rank),
      journalName: editingJif.journalName.trim(),
      abbreviatedJournal: editingJif.abbreviatedJournal.trim(),
      publisher: editingJif.publisher.trim(),
      jif: Number(editingJif.jif)
    };

    try {
      const res = await API.put(`/api/journal-impact-factors/${editingJif._id}`, payload);
      if (res.data?.success) {
        toast.success("Journal impact factor updated successfully");
        setEditingJif(null);
        fetchJifs();
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to update journal impact factor.";
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
        toast.error("Please drop a valid CSV file");
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleBulkUpload = async () => {
    if (!csvFile) return toast.error("Please choose or drag a CSV file first");
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

  // JIF upload handlers
  const handleJifFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setJifCsvFile(e.target.files[0]);
      setJifUploadResult(null);
    }
  };

  const handleJifDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setJifDragActive(true);
    } else if (e.type === "dragleave") {
      setJifDragActive(false);
    }
  };

  const handleJifDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setJifDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith(".csv")) {
        setJifCsvFile(file);
        setJifUploadResult(null);
      } else {
        toast.error("Please drop a valid CSV file");
      }
    }
  };

  const triggerJifFileInput = () => {
    jifFileInputRef.current.click();
  };

  const handleJifBulkUpload = async () => {
    if (!jifCsvFile) return toast.error("Please choose or drag a CSV file first");
    const formData = new FormData();
    formData.append("file", jifCsvFile);

    setJifUploading(true);
    try {
      const res = await API.post("/api/journal-impact-factors/bulk", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data?.success) {
        toast.success("JIF CSV file processed successfully!");
        setJifUploadResult(res.data);
        setJifCsvFile(null);
        fetchJifs();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to process JIF bulk upload.");
    } finally {
      setJifUploading(false);
    }
  };

  const handleJifFormSubmit = async (e) => {
    e.preventDefault();
    if (!jifForm.journalName.trim()) return toast.error("Journal name is required");
    if (jifForm.rank === undefined || jifForm.rank === "") return toast.error("Rank is required");
    if (jifForm.jif === undefined || jifForm.jif === "") return toast.error("JIF value is required");

    const payload = {
      rank: Number(jifForm.rank),
      journalName: jifForm.journalName.trim(),
      abbreviatedJournal: jifForm.abbreviatedJournal.trim(),
      publisher: jifForm.publisher.trim(),
      jif: Number(jifForm.jif)
    };

    try {
      const res = await API.post("/api/journal-impact-factors", payload);
      if (res.data?.success) {
        toast.success("Journal impact factor entry added successfully");
        setJifForm({
          rank: "",
          journalName: "",
          abbreviatedJournal: "",
          publisher: "",
          jif: ""
        });
        setOpenAddJifModal(false);
        fetchJifs();
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to save journal impact factor.";
      toast.error(errMsg);
    }
  };

  const downloadJifSampleTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Rank,Journal Name,Abbreviated Journal,Publisher,JIF\n1,ACADEMY OF MANAGEMENT JOURNAL,ACAD MANAGE J,ACAD MANAGEMENT,10.5\n2,ACADEMY OF MANAGEMENT REVIEW,ACAD MANAGE REV,ACAD MANAGEMENT,13.9\n3,ACCOUNTING ORGANIZATIONS AND SOCIETY,ACCT ORGAN SOC,PERGAMON-ELSEVIER SCIENCE LTD,4.0\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "journal_impact_factors_template.csv");
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
            setJifUploadResult(null);
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
            label="Impact Factors"
            icon={<Assessment sx={{ fontSize: "1.2rem", mr: 0.5 }} />}
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
              <Grid item xs={12} sm={3} md={2.5}>
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
              <Grid item xs={12} sm={6} md={7}>
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
              <Grid item xs={12} sm={3} md={2.5}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => {
                    setUploadResult(null);
                    setOpenAddJournalModal(true);
                  }}
                  startIcon={<AddIcon />}
                  sx={{
                    background: "var(--gradient-primary)",
                    textTransform: "none",
                    fontWeight: 700,
                    borderRadius: "12px",
                    height: "40px",
                    color: "#fff",
                    boxShadow: "0 4px 12px rgba(11, 82, 153, 0.15)",
                    "&:hover": {
                      background: "var(--gradient-primary-hover)"
                    }
                  }}
                >
                  Add / Upload
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <Loader />
            </Box>
          ) : ( */}
          <>
            <TableContainer
              component={Paper}
              sx={{
                borderRadius: "20px",
                background: "var(--bg-paper)",
                border: "1px solid var(--border-color)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.01)",
                overflowX: "auto"
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
          {/* )} */}
        </Box>
      )}

      {/* Add Journal Modal */}
      <Dialog
        open={openAddJournalModal}
        onClose={() => setOpenAddJournalModal(false)}
        maxWidth="md"
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
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
            Add / Upload Reference Journals
          </Typography>
          <IconButton onClick={() => setOpenAddJournalModal(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3, pt: 3 }}>
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
                startIcon={uploading ? <Loader size={18} color="inherit" /> : <UploadIcon />}
                sx={{
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
        </DialogContent>
      </Dialog>

      {activeTab === 1 && (
        <Box sx={{ animation: "fadeIn 0.3s ease" }}>
          {/* Controls Bar for JIF */}
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
              <Grid item xs={12} sm={9}>
                <form onSubmit={(e) => e.preventDefault()}>
                  <TextField
                    fullWidth
                    size="small"
                    value={jifSearchQuery}
                    onChange={(e) => setJifSearchQuery(e.target.value)}
                    placeholder="Search by journal name, abbreviated name, or publisher..."
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: "var(--text-secondary)", fontSize: "1.1rem" }} />
                        </InputAdornment>
                      ),
                      endAdornment: jifSearchQuery && (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={handleJifClearSearch}>
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
              <Grid item xs={12} sm={3}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => {
                    setJifUploadResult(null);
                    setOpenAddJifModal(true);
                  }}
                  startIcon={<AddIcon />}
                  sx={{
                    background: "var(--gradient-primary)",
                    textTransform: "none",
                    fontWeight: 700,
                    borderRadius: "12px",
                    height: "40px",
                    color: "#fff",
                    boxShadow: "0 4px 12px rgba(11, 82, 153, 0.15)",
                    "&:hover": {
                      background: "var(--gradient-primary-hover)"
                    }
                  }}
                >
                  Add / Upload
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {jifLoading ? (
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
                  overflowX: "auto"
                }}
              >
                <Table size="medium">
                  <TableHead>
                    <TableRow sx={{ background: "rgba(11, 82, 153, 0.03)" }}>
                      <TableCell sx={{ fontWeight: 800, width: "80px", color: "var(--text-primary)" }} align="center">Rank</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Journal Name</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Abbreviated Journal</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Publisher</TableCell>
                      <TableCell sx={{ fontWeight: 800, width: "140px", color: "var(--text-primary)" }} align="center">JIF</TableCell>
                      <TableCell sx={{ fontWeight: 800, width: "120px", color: "var(--text-primary)" }} align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {jifs.length > 0 ? (
                      jifs.map((record) => (
                        <TableRow
                          key={record._id}
                          sx={{
                            transition: "all 0.2s",
                            "&:hover": {
                              background: "rgba(11, 82, 153, 0.01)",
                              boxShadow: "inset 4px 0 0 var(--color-primary)"
                            }
                          }}
                        >
                          <TableCell align="center" sx={{ fontWeight: 700, color: "var(--text-secondary)" }}>
                            {record.rank}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.95rem" }}>
                            {record.journalName}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, color: "var(--text-secondary)" }}>
                            {record.abbreviatedJournal || "—"}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, color: "var(--text-secondary)" }}>
                            {record.publisher || "—"}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={record.jif}
                              size="small"
                              sx={{
                                fontWeight: 800,
                                fontSize: "0.8rem",
                                bgcolor: "rgba(234, 179, 8, 0.12)",
                                color: "#ca8a04",
                                borderRadius: "8px",
                                px: 1.5,
                                border: "1px solid rgba(234, 179, 8, 0.25)"
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
                                  onClick={() => handleJifEditClick(record)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Remove Record">
                                <IconButton
                                  size="small"
                                  sx={{
                                    color: "#ef4444",
                                    background: "rgba(239, 68, 68, 0.05)",
                                    "&:hover": { background: "rgba(239, 68, 68, 0.12)" }
                                  }}
                                  onClick={() => handleJifDelete(record._id)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                          <Box sx={{ textContent: "center", opacity: 0.7 }}>
                            <Typography variant="body1" sx={{ fontWeight: 700, mb: 0.5, color: "var(--text-secondary)" }}>
                              No JIF Registry Entries Found
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
                  count={jifTotalRows}
                  rowsPerPage={jifRowsPerPage}
                  page={jifPage}
                  onPageChange={(e, newPage) => setJifPage(newPage)}
                  onRowsPerPageChange={(e) => {
                    setJifRowsPerPage(parseInt(e.target.value, 10));
                    setJifPage(0);
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

      {/* JIF Edit Modal Dialog */}
      <Dialog
        open={!!editingJif}
        onClose={() => setEditingJif(null)}
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
        {editingJif && (
          <Box component="form" onSubmit={handleJifEditSubmit}>
            <DialogTitle sx={{ fontWeight: 800, pb: 1, color: "var(--text-primary)" }}>
              Edit Journal Impact Factor Details
            </DialogTitle>
            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 3 }}>
              <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
                <Box sx={{ width: "100px" }}>
                  <TextField
                    label="Rank"
                    required
                    type="number"
                    fullWidth
                    value={editingJif.rank}
                    onChange={(e) => setEditingJif({ ...editingJif, rank: e.target.value })}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "12px",
                      }
                    }}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    label="JIF"
                    required
                    type="number"
                    slotProps={{ htmlInput: { step: "any" } }}
                    fullWidth
                    value={editingJif.jif}
                    onChange={(e) => setEditingJif({ ...editingJif, jif: e.target.value })}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "12px",
                      }
                    }}
                  />
                </Box>
              </Box>

              <TextField
                label="Journal Name"
                required
                fullWidth
                value={editingJif.journalName}
                onChange={(e) => setEditingJif({ ...editingJif, journalName: e.target.value })}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                  }
                }}
              />

              <TextField
                label="Abbreviated Journal"
                fullWidth
                value={editingJif.abbreviatedJournal}
                onChange={(e) => setEditingJif({ ...editingJif, abbreviatedJournal: e.target.value })}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                  }
                }}
              />

              <TextField
                label="Publisher"
                fullWidth
                value={editingJif.publisher}
                onChange={(e) => setEditingJif({ ...editingJif, publisher: e.target.value })}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                  }
                }}
              />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button
 onClick={() => setEditingJif(null)}
 sx={{
 textTransform: "none",
 fontWeight: 700,
 
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
 
 background: "var(--gradient-primary)",
 color: "#fff",
 "&:hover": {
 background: "var(--gradient-primary-hover)"
 }
 }}
 >
                Update JIF Entry
              </Button>
            </DialogActions>
          </Box>
        )}
      </Dialog>

      {/* Add JIF Modal */}
      <Dialog
        open={openAddJifModal}
        onClose={() => setOpenAddJifModal(false)}
        maxWidth="md"
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
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
            Add / Upload Journal Impact Factors
          </Typography>
          <IconButton onClick={() => setOpenAddJifModal(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3, pt: 3 }}>
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
              Upload a CSV file containing columns: Rank, Journal Name, Abbreviated Journal, Publisher, JIF.
            </Typography>

            {/* Drag Drop zone */}
            <Box
              onDragEnter={handleJifDrag}
              onDragOver={handleJifDrag}
              onDragLeave={handleJifDrag}
              onDrop={handleJifDrop}
              onClick={triggerJifFileInput}
              sx={{
                border: jifDragActive
                  ? "2px dashed var(--color-primary)"
                  : "2px dashed var(--border-color)",
                borderRadius: "20px",
                p: 4,
                textAlign: "center",
                background: jifDragActive
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
                ref={jifFileInputRef}
                type="file"
                accept=".csv"
                hidden
                onChange={handleJifFileChange}
              />
              <UploadIcon sx={{ fontSize: 40, color: "var(--color-primary)", mb: 1.5, opacity: 0.8 }} />
              <Typography variant="body1" sx={{ fontWeight: 800, color: "var(--text-primary)", mb: 0.5 }}>
                {jifDragActive ? "Drop CSV file here" : "Drag and drop CSV here"}
              </Typography>
              <Typography variant="body2" sx={{ color: "var(--text-secondary)", mb: 1 }}>
                or click to browse
              </Typography>
            </Box>

            {jifCsvFile && (
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
                      {jifCsvFile.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "var(--text-secondary)" }}>
                      {(jifCsvFile.size / 1024).toFixed(1)} KB
                    </Typography>
                  </Box>
                </Box>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setJifCsvFile(null);
                    setJifUploadResult(null);
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
                onClick={downloadJifSampleTemplate}
                sx={{
                  textTransform: "none",
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
                disabled={!jifCsvFile || jifUploading}
                onClick={handleJifBulkUpload}
                startIcon={jifUploading ? <Loader size={18} color="inherit" /> : <UploadIcon />}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  background: "var(--gradient-primary)",
                  color: "#fff",
                  "&:hover": {
                    background: "var(--gradient-primary-hover)"
                  }
                }}
              >
                {jifUploading ? "Importing..." : "Upload CSV"}
              </Button>
            </Stack>

            {jifUploadResult && (
              <Alert
                severity="success"
                sx={{
                  borderRadius: "16px",
                  fontSize: "0.85rem",
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                  background: "rgba(16, 185, 129, 0.05)"
                }}
              >
                <strong>Import Successful:</strong> Added {jifUploadResult.insertedCount} JIF entries.
                {jifUploadResult.errorCount > 0 && ` Skipped ${jifUploadResult.errorCount} invalid rows.`}
              </Alert>
            )}
          </Box>

          {/* Add Single JIF manually */}
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
              Fill out the form below to add a single journal impact factor entry.
            </Typography>

            <Box component="form" onSubmit={handleJifFormSubmit} sx={{ display: "flex", flexDirection: "column", gap: 3, flexGrow: 1 }}>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    label="Rank"
                    required
                    type="number"
                    fullWidth
                    value={jifForm.rank}
                    onChange={(e) => setJifForm({ ...jifForm, rank: e.target.value })}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "12px",
                        background: "var(--bg-paper)",
                      }
                    }}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    label="JIF"
                    required
                    type="number"
                    slotProps={{ htmlInput: { step: "any" } }}
                    fullWidth
                    value={jifForm.jif}
                    onChange={(e) => setJifForm({ ...jifForm, jif: e.target.value })}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "12px",
                        background: "var(--bg-paper)",
                      }
                    }}
                  />
                </Box>
              </Box>

              <TextField
                label="Journal Name"
                required
                fullWidth
                value={jifForm.journalName}
                onChange={(e) => setJifForm({ ...jifForm, journalName: e.target.value })}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    background: "var(--bg-paper)",
                  }
                }}
              />

              <TextField
                label="Abbreviated Journal"
                fullWidth
                value={jifForm.abbreviatedJournal}
                onChange={(e) => setJifForm({ ...jifForm, abbreviatedJournal: e.target.value })}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    background: "var(--bg-paper)",
                  }
                }}
              />

              <TextField
                label="Publisher"
                fullWidth
                value={jifForm.publisher}
                onChange={(e) => setJifForm({ ...jifForm, publisher: e.target.value })}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    background: "var(--bg-paper)",
                  }
                }}
              />

              <Box sx={{ mt: "auto", pt: 2 }}>
                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={<AddIcon />}
                  sx={{
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
                  Save JIF Entry
                </Button>
              </Box>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ReferenceJournalManagement;
