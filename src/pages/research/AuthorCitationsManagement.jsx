import Loader from "../../components/common/Loader";
import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Tooltip,
  Avatar
} from "@mui/material";
import {
  Search,
  Add,
  Edit,
  Delete,
  CheckCircle,
  Error,
  Assignment,
  Science,
  Refresh,
  Person,
  UploadFile
} from "@mui/icons-material";
import axiosInstance from "../../api/axios";
import { toast } from "sonner";

const AuthorCitationsManagement = () => {
  // States
  const [records, setRecords] = useState([]);
  const [meta, setMeta] = useState({
    activeAcademicYear: "N/A",
    citationYear: new Date().getFullYear(),
    hIndexYears: [new Date().getFullYear() - 1, new Date().getFullYear()]
  });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dialog Form States
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("add"); // "add" or "edit"
  const [editingId, setEditingId] = useState(null);
  
  const [formEmpid, setFormEmpid] = useState("");
  const [formScopusId, setFormScopusId] = useState("");
  const [formCitations, setFormCitations] = useState("");
  const [formHIndexPrev, setFormHIndexPrev] = useState("");
  const [formHIndexCurr, setFormHIndexCurr] = useState("");
  
  // Verification states
  const [verifying, setVerifying] = useState(false);
  const [verifiedEmployee, setVerifiedEmployee] = useState(null); // { name, department, designation, scopusId }
  const [verificationError, setVerificationError] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleBulkUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error("Please upload a valid CSV file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    const toastId = toast.loading("Uploading and processing CSV...");
    
    try {
      const res = await axiosInstance.post("/api/author-citations/bulk", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      if (res.data && res.data.success) {
        toast.success(res.data.message || "Bulk upload completed successfully!", { id: toastId });
        fetchRecords(searchQuery);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to process bulk upload.", { id: toastId });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const downloadTemplate = () => {
    const headers = ["empid", "scopusId", "citations", "hIndexPrev", "hIndexCurr"];
    const sampleRow = ["6611", "1308110063", "80", "4", "5"];
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), sampleRow.join(",")].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "author_citations_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fetch all citation records
  const fetchRecords = async (search = "") => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/api/author-citations?search=${search}`);
      if (res.data && res.data.success) {
        setRecords(res.data.data);
        if (res.data.meta) {
          setMeta(res.data.meta);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch citation records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords(searchQuery);
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    fetchRecords(val);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRecords(searchQuery);
  };

  const handleRefresh = () => {
    fetchRecords(searchQuery);
  };

  // Local & ECAP Employee Verification
  const verifyEmployee = async () => {
    if (!formEmpid.trim()) {
      setVerificationError("Please enter an Employee ID.");
      return;
    }
    setVerifying(true);
    setVerificationError("");
    setVerifiedEmployee(null);
    
    try {
      // 1. Search locally
      const localRes = await axiosInstance.get(`/api/employees/search?query=${formEmpid}`);
      const localEmp = localRes.data?.find(
        (emp) => emp.institutionId.trim().toUpperCase() === formEmpid.trim().toUpperCase()
      );
      
      if (localEmp) {
        setVerifiedEmployee({
          name: localEmp.name,
          designation: localEmp.designation || "Faculty",
          department: localEmp.coreDepartment?.name || localEmp.department?.name || "N/A",
          scopusId: localEmp.scopusId || ""
        });
        if (localEmp.scopusId) {
          setFormScopusId(localEmp.scopusId);
        }
        return;
      }
      
      // 2. Fallback to ECAP
      const ecapRes = await axiosInstance.get(`/api/employees/staff/${formEmpid}`);
      if (ecapRes.data && ecapRes.data.success) {
        const staff = ecapRes.data.data;
        setVerifiedEmployee({
          name: staff.employeename || staff.EmployeeName || "",
          designation: staff.designation || "Faculty",
          department: staff.department || "N/A",
          scopusId: staff.scopusId || ""
        });
        if (staff.scopusId) {
          setFormScopusId(staff.scopusId);
        }
      } else {
        setVerificationError("Employee not found in local database or external records.");
      }
    } catch (err) {
      setVerificationError(err.response?.data?.message || "Failed to verify Employee ID.");
    } finally {
      setVerifying(false);
    }
  };

  // Open Add Dialog
  const handleOpenAdd = () => {
    setDialogMode("add");
    setEditingId(null);
    setFormEmpid("");
    setFormScopusId("");
    setFormCitations("");
    setFormHIndexPrev("");
    setFormHIndexCurr("");
    setVerifiedEmployee(null);
    setVerificationError("");
    setOpenDialog(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (record) => {
    setDialogMode("edit");
    setEditingId(record._id);
    setFormEmpid(record.empid);
    setFormScopusId(record.scopusId || "");
    
    // Read map values for active years
    const citYear = String(meta.citationYear);
    const prevYear = String(meta.hIndexYears[0]);
    const currYear = String(meta.hIndexYears[1]);

    const citVal = record.citations?.[citYear] !== undefined 
      ? record.citations[citYear] 
      : (record.citations?.get ? record.citations.get(citYear) : "");
    const hPrevVal = record.hIndex?.[prevYear] !== undefined 
      ? record.hIndex[prevYear] 
      : (record.hIndex?.get ? record.hIndex.get(prevYear) : "");
    const hCurrVal = record.hIndex?.[currYear] !== undefined 
      ? record.hIndex[currYear] 
      : (record.hIndex?.get ? record.hIndex.get(currYear) : "");

    setFormCitations(citVal !== undefined && citVal !== null ? String(citVal) : "");
    setFormHIndexPrev(hPrevVal !== undefined && hPrevVal !== null ? String(hPrevVal) : "");
    setFormHIndexCurr(hCurrVal !== undefined && hCurrVal !== null ? String(hCurrVal) : "");
    
    setVerifiedEmployee({
      name: record.employeeName || "Registered Faculty",
      designation: record.designation || "",
      department: record.departmentName || "N/A",
      scopusId: record.scopusId || ""
    });
    setVerificationError("");
    setOpenDialog(true);
  };

  // Form Submission
  const handleSave = async () => {
    if (!formEmpid.trim()) {
      toast.error("Employee ID is required.");
      return;
    }
    if (dialogMode === "add" && !verifiedEmployee) {
      toast.error("Please verify the Employee ID first.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        empid: formEmpid.trim(),
        scopusId: formScopusId.trim(),
        citations: formCitations === "" ? 0 : Number(formCitations),
        hIndexPrev: formHIndexPrev === "" ? 0 : Number(formHIndexPrev),
        hIndexCurr: formHIndexCurr === "" ? 0 : Number(formHIndexCurr)
      };

      const res = await axiosInstance.post("/api/author-citations", payload);
      if (res.data && res.data.success) {
        toast.success(res.data.message || "Metrics saved successfully!");
        setOpenDialog(false);
        fetchRecords(searchQuery);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save metrics.");
    } finally {
      setLoading(false);
    }
  };

  // Delete Action
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record? This action cannot be undone.")) {
      return;
    }
    
    setLoading(true);
    try {
      const res = await axiosInstance.delete(`/api/author-citations/${id}`);
      if (res.data && res.data.success) {
        toast.success(res.data.message || "Record deleted successfully!");
        fetchRecords(searchQuery);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete record.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: "1600px", margin: "0 auto" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 850, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 1.5 }}>
            <Assignment sx={{ fontSize: "2.5rem", color: "var(--color-primary)" }} />
            Author Citations & H-Index
          </Typography>
          <Typography variant="subtitle1" sx={{ color: "var(--text-secondary)", mt: 0.5, fontWeight: 550 }}>
            Academic Year: <span style={{ color: "var(--color-primary)", fontWeight: 700 }}>{meta.activeAcademicYear}</span> | 
            Citations Year: <span style={{ color: "var(--color-primary)", fontWeight: 700 }}>{meta.citationYear}</span> | 
            H-Index Years: <span style={{ color: "var(--color-primary)", fontWeight: 700 }}>{meta.hIndexYears.join(" & ")}</span>
          </Typography>
        </Box>
        
        <Stack direction="row" spacing={2}>
          <Tooltip title="Refresh Records">
            <IconButton onClick={handleRefresh} disabled={loading || uploading} sx={{ bgcolor: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
              <Refresh className={loading ? "spin-animation" : ""} />
            </IconButton>
          </Tooltip>

          <Button
            variant="outlined"
            onClick={downloadTemplate}
            startIcon={<Assignment />}
            sx={{
              borderColor: "var(--color-primary)",
              color: "var(--color-primary)",
              fontWeight: 700,
              px: 3,
              py: 1.2,
              borderRadius: "12px",
              textTransform: "none",
              "&:hover": {
                borderColor: "var(--color-primary)",
                bgcolor: "var(--bg-accent-1)"
              }
            }}
          >
            Download Template
          </Button>
          <Button
            variant="outlined"
            component="label"
            disabled={uploading}
            startIcon={uploading ? <Loader size={20} color="inherit" /> : <UploadFile />}
            sx={{
              borderColor: "var(--color-primary)",
              color: "var(--color-primary)",
              fontWeight: 700,
              px: 3,
              py: 1.2,
              borderRadius: "12px",
              textTransform: "none",
              "&:hover": {
                borderColor: "var(--color-primary)",
                bgcolor: "var(--bg-accent-1)"
              }
            }}
          >
            {uploading ? "Uploading..." : "Bulk Upload"}
            <input
              type="file"
              accept=".csv"
              hidden
              onChange={handleBulkUpload}
            />
          </Button>

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenAdd}
            sx={{
              background: "var(--gradient-primary)",
              color: "white",
              fontWeight: 700,
              px: 3,
              py: 1.2,
              borderRadius: "12px",
              boxShadow: "0 4px 12px var(--color-primary-alpha)",
              "&:hover": {
                background: "var(--gradient-primary)",
                opacity: 0.9
              }
            }}
          >
            Add Record
          </Button>
        </Stack>
      </Box>

      {/* Search Card */}
      <Card sx={{ borderRadius: "16px", mb: 4, background: "var(--bg-paper)", border: "1px solid var(--border-color)", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
        <CardContent sx={{ p: "20px !important" }}>
          <form onSubmit={handleSearchSubmit}>
            <TextField
              fullWidth
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by Employee ID, name or department..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: "var(--text-secondary)" }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Button type="submit" variant="outlined" sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 700 }}>
                      Search
                    </Button>
                  </InputAdornment>
                ),
                sx: { borderRadius: "12px" }
              }}
            />
          </form>
        </CardContent>
      </Card>

      {/* Data Table */}
      <TableContainer component={Paper} sx={{ borderRadius: "16px", border: "1px solid var(--border-color)", boxShadow: "none", overflow: "hidden" }}>
        {loading && records.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <Loader color="secondary" />
          </Box>
        ) : records.length === 0 ? (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <Assignment sx={{ fontSize: "4rem", color: "var(--text-secondary)", opacity: 0.3, mb: 2 }} />
            <Typography variant="h6" sx={{ color: "var(--text-secondary)", fontWeight: 650 }}>
              No records found
            </Typography>
            <Typography variant="body2" sx={{ color: "var(--text-secondary)", mt: 0.5 }}>
              Try searching with another keyword or add a new record.
            </Typography>
          </Box>
        ) : (
          <Table>
            <TableHead sx={{ bgcolor: "var(--bg-paper)" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Emp ID</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Faculty Name</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Department</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Scopus ID</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Citations ({meta.citationYear})</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>H-Index ({meta.hIndexYears[0]})</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>H-Index ({meta.hIndexYears[1]})</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((row) => {
                const citYear = String(meta.citationYear);
                const prevYear = String(meta.hIndexYears[0]);
                const currYear = String(meta.hIndexYears[1]);

                // Fallbacks to Map key structures
                const citationsVal = row.citations?.[citYear] !== undefined 
                  ? row.citations[citYear] 
                  : (row.citations?.get ? row.citations.get(citYear) : 0);
                const hPrevVal = row.hIndex?.[prevYear] !== undefined 
                  ? row.hIndex[prevYear] 
                  : (row.hIndex?.get ? row.hIndex.get(prevYear) : 0);
                const hCurrVal = row.hIndex?.[currYear] !== undefined 
                  ? row.hIndex[currYear] 
                  : (row.hIndex?.get ? row.hIndex.get(currYear) : 0);

                return (
                  <TableRow key={row._id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                    <TableCell sx={{ fontWeight: 700, color: "var(--color-primary)" }}>{row.empid}</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", flexDirection: "column" }}>
                        <Typography sx={{ fontWeight: 700, color: "var(--text-primary)" }}>{row.employeeName || "N/A"}</Typography>
                        <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 550 }}>{row.designation}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 550, color: "var(--text-secondary)" }}>{row.departmentName || "N/A"}</TableCell>
                    <TableCell sx={{ fontFamily: "monospace", color: "var(--text-secondary)" }}>{row.scopusId || "N/A"}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: "#10b981", bgcolor: "rgba(16, 185, 129, 0.02)" }}>{citationsVal || 0}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>{hPrevVal || 0}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: "var(--color-primary)", bgcolor: "var(--bg-accent-1)" }}>{hCurrVal || 0}</TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <IconButton onClick={() => handleOpenEdit(row)} color="primary" size="small" sx={{ border: "1px solid rgba(79, 70, 229, 0.15)", bgcolor: "rgba(79, 70, 229, 0.05)" }}>
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(row._id)} color="error" size="small" sx={{ border: "1px solid rgba(239, 68, 68, 0.15)", bgcolor: "rgba(239, 68, 68, 0.05)" }}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Add / Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth sx={{ "& .MuiDialog-paper": { borderRadius: "16px", p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: "1.4rem", display: "flex", alignItems: "center", gap: 1 }}>
          {dialogMode === "add" ? <Add sx={{ color: "var(--color-primary)" }} /> : <Edit sx={{ color: "var(--color-primary)" }} />}
          {dialogMode === "add" ? "Add Citation Details" : "Edit Citation Details"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* EmpID verification */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "var(--text-secondary)", display: "block", mb: 0.8 }}>
                Employee ID
              </Typography>
              <Stack direction="row" spacing={2}>
                <TextField
                  fullWidth
                  disabled={dialogMode === "edit"}
                  value={formEmpid}
                  onChange={(e) => setFormEmpid(e.target.value)}
                  placeholder="e.g. 5741"
                  InputProps={{ sx: { borderRadius: "10px" } }}
                />
                {dialogMode === "add" && (
                  <Button
                    variant="outlined"
                    onClick={verifyEmployee}
                    disabled={verifying || !formEmpid.trim()}
                    sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, px: 3 }}
                  >
                    {verifying ? <Loader size={24} /> : "Verify"}
                  </Button>
                )}
              </Stack>
              {verificationError && (
                <Typography variant="caption" sx={{ color: "#ef4444", fontWeight: 600, display: "flex", alignItems: "center", gap: 0.5, mt: 0.8 }}>
                  <Error sx={{ fontSize: "1rem" }} />
                  {verificationError}
                </Typography>
              )}
            </Box>

            {/* Verified Employee Preview */}
            {verifiedEmployee && (
              <Box sx={{ p: 2, borderRadius: "12px", border: "1px solid var(--border-color)", bgcolor: "var(--bg-accent-1)", display: "flex", gap: 1.5 }}>
                <Avatar sx={{ bgcolor: "var(--color-primary)" }}>
                  <Person />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                    {verifiedEmployee.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 550, display: "block" }}>
                    {verifiedEmployee.designation} | {verifiedEmployee.department}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#10b981", fontWeight: 700, display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                    <CheckCircle sx={{ fontSize: "0.95rem" }} /> Verified successfully
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Scopus ID */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "var(--text-secondary)", display: "block", mb: 0.8 }}>
                Scopus Author ID
              </Typography>
              <TextField
                fullWidth
                value={formScopusId}
                onChange={(e) => setFormScopusId(e.target.value)}
                placeholder="e.g. 57218635800"
                InputProps={{ sx: { borderRadius: "10px" } }}
              />
            </Box>

            <Divider />

            {/* Metrics inputs */}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "var(--text-secondary)", display: "block", mb: 0.8 }}>
                  Scopus Citations for {meta.citationYear}
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  value={formCitations}
                  onChange={(e) => setFormCitations(e.target.value)}
                  placeholder="e.g. 150"
                  InputProps={{ sx: { borderRadius: "10px" } }}
                />
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "var(--text-secondary)", display: "block", mb: 0.8 }}>
                  H-Index for {meta.hIndexYears[0]} (Prev)
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  value={formHIndexPrev}
                  onChange={(e) => setFormHIndexPrev(e.target.value)}
                  placeholder="e.g. 8"
                  InputProps={{ sx: { borderRadius: "10px" } }}
                />
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "var(--text-secondary)", display: "block", mb: 0.8 }}>
                  H-Index for {meta.hIndexYears[1]} (Curr)
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  value={formHIndexCurr}
                  onChange={(e) => setFormHIndexCurr(e.target.value)}
                  placeholder="e.g. 10"
                  InputProps={{ sx: { borderRadius: "10px" } }}
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1.5 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, px: 3, border: "1px solid var(--border-color)" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={loading}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              px: 4,
              background: "var(--gradient-primary)",
              color: "white"
            }}
          >
            {loading ? <Loader size={24} color="inherit" /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuthorCitationsManagement;
