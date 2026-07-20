import Loader from "../../components/common/Loader";
import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  Typography,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Avatar,
  Grid,
  Divider,
  Tooltip
} from "@mui/material";
import {
  Search,
  Add,
  Edit,
  Delete,
  CheckCircle,
  Error,
  Assignment,
  Refresh,
  Person,
  UploadFile
} from "@mui/icons-material";
import axiosInstance from "../../api/axios";
import { toast } from "sonner";
import PageHeader from "../../components/common/PageHeader";
import DataTable from "../../components/data/DataTable";

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
  const [verifiedEmployee, setVerifiedEmployee] = useState(null);
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
        headers: { "Content-Type": "multipart/form-data" }
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
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), sampleRow.join(",")].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "author_citations_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchRecords = async (search = "") => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/api/author-citations?search=${search}`);
      if (res.data && res.data.success) {
        setRecords(res.data.data);
        if (res.data.meta) setMeta(res.data.meta);
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

  const handleRefresh = () => {
    fetchRecords(searchQuery);
  };

  const verifyEmployee = async () => {
    if (!formEmpid.trim()) {
      setVerificationError("Please enter an Employee ID.");
      return;
    }
    setVerifying(true);
    setVerificationError("");
    setVerifiedEmployee(null);
    
    try {
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
        if (localEmp.scopusId) setFormScopusId(localEmp.scopusId);
        return;
      }
      
      const ecapRes = await axiosInstance.get(`/api/employees/staff/${formEmpid}`);
      if (ecapRes.data && ecapRes.data.success) {
        const staff = ecapRes.data.data;
        setVerifiedEmployee({
          name: staff.employeename || staff.EmployeeName || "",
          designation: staff.designation || "Faculty",
          department: staff.department || "N/A",
          scopusId: staff.scopusId || ""
        });
        if (staff.scopusId) setFormScopusId(staff.scopusId);
      } else {
        setVerificationError("Employee not found in local database or external records.");
      }
    } catch (err) {
      setVerificationError(err.response?.data?.message || "Failed to verify Employee ID.");
    } finally {
      setVerifying(false);
    }
  };

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

  const handleOpenEdit = (record) => {
    setDialogMode("edit");
    setEditingId(record._id);
    setFormEmpid(record.empid);
    setFormScopusId(record.scopusId || "");
    
    const citYear = String(meta.citationYear);
    const prevYear = String(meta.hIndexYears[0]);
    const currYear = String(meta.hIndexYears[1]);

    const citVal = record.citations?.[citYear] !== undefined ? record.citations[citYear] : (record.citations?.get ? record.citations.get(citYear) : "");
    const hPrevVal = record.hIndex?.[prevYear] !== undefined ? record.hIndex[prevYear] : (record.hIndex?.get ? record.hIndex.get(prevYear) : "");
    const hCurrVal = record.hIndex?.[currYear] !== undefined ? record.hIndex[currYear] : (record.hIndex?.get ? record.hIndex.get(currYear) : "");

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

  const handleSave = async () => {
    if (!formEmpid.trim()) return toast.error("Employee ID is required.");
    if (dialogMode === "add" && !verifiedEmployee) return toast.error("Please verify the Employee ID first.");

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

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record? This action cannot be undone.")) return;
    
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

  const HeaderActions = (
    <Stack direction="row" spacing={1.5} alignItems="center">
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
          borderColor: "var(--color-primary)", color: "var(--color-primary)", fontWeight: 700, borderRadius: "10px", textTransform: "none"
        }}
      >
        Template
      </Button>
      <Button
        variant="outlined"
        component="label"
        disabled={uploading}
        startIcon={uploading ? <Loader size={20} color="inherit" /> : <UploadFile />}
        sx={{
          borderColor: "var(--color-primary)", color: "var(--color-primary)", fontWeight: 700, borderRadius: "10px", textTransform: "none"
        }}
      >
        {uploading ? "Uploading..." : "Bulk Upload"}
        <input type="file" accept=".csv" hidden onChange={handleBulkUpload} />
      </Button>
      <Button
        variant="contained"
        startIcon={<Add />}
        onClick={handleOpenAdd}
        sx={{
          background: "var(--gradient-primary)", color: "white", fontWeight: 700, borderRadius: "10px", textTransform: "none", boxShadow: "0 4px 12px var(--color-primary-alpha)"
        }}
      >
        Add Record
      </Button>
    </Stack>
  );

  return (
    <Box sx={{ pb: 6 }}>
      <PageHeader
        title="Author Citations & H-Index"
        subtitle={`Academic Year: ${meta.activeAcademicYear} | Citations Year: ${meta.citationYear} | H-Index Years: ${meta.hIndexYears.join(" & ")}`}
        action={HeaderActions}
      />

      <Box sx={{ mt: 3, mx: { xs: 2.5, sm: 4 } }}>
        <Card sx={{ borderRadius: "16px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", overflow: "hidden" }}>
          {loading && records.length === 0 ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <Loader color="secondary" />
            </Box>
          ) : (
            <DataTable
              columns={["EMP ID", "FACULTY NAME", "DEPARTMENT", "SCOPUS ID", `CITATIONS (${meta.citationYear})`, `H-INDEX (${meta.hIndexYears[0]})`, `H-INDEX (${meta.hIndexYears[1]})`, "ACTIONS"]}
              rows={records.map((row) => {
                const citYear = String(meta.citationYear);
                const prevYear = String(meta.hIndexYears[0]);
                const currYear = String(meta.hIndexYears[1]);

                const citationsVal = row.citations?.[citYear] !== undefined ? row.citations[citYear] : (row.citations?.get ? row.citations.get(citYear) : 0);
                const hPrevVal = row.hIndex?.[prevYear] !== undefined ? row.hIndex[prevYear] : (row.hIndex?.get ? row.hIndex.get(prevYear) : 0);
                const hCurrVal = row.hIndex?.[currYear] !== undefined ? row.hIndex[currYear] : (row.hIndex?.get ? row.hIndex.get(currYear) : 0);

                return [
                  { value: row.empid, display: <Typography sx={{ fontWeight: 700, color: "var(--color-primary)" }}>{row.empid}</Typography> },
                  { value: row.employeeName || "N/A", display: (
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                      <Typography sx={{ fontWeight: 700, color: "var(--text-primary)" }}>{row.employeeName || "N/A"}</Typography>
                      <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 550 }}>{row.designation}</Typography>
                    </Box>
                  ) },
                  { value: row.departmentName || "N/A", display: <Typography sx={{ fontWeight: 550, color: "var(--text-secondary)" }}>{row.departmentName || "N/A"}</Typography> },
                  { value: row.scopusId || "N/A", display: <Typography sx={{ fontFamily: "monospace", color: "var(--text-secondary)" }}>{row.scopusId || "N/A"}</Typography> },
                  { value: citationsVal, display: (
                    <Box sx={{ display: "flex", justifyContent: "center" }}>
                      <Typography sx={{ fontWeight: 800, color: "#10b981", p: 1, bgcolor: "rgba(16, 185, 129, 0.05)", borderRadius: "8px", minWidth: 40 }}>{citationsVal || 0}</Typography>
                    </Box>
                  ) },
                  { value: hPrevVal, display: <Typography sx={{ fontWeight: 700, color: "var(--text-primary)" }}>{hPrevVal || 0}</Typography> },
                  { value: hCurrVal, display: (
                    <Box sx={{ display: "flex", justifyContent: "center" }}>
                      <Typography sx={{ fontWeight: 800, color: "var(--color-primary)", p: 1, bgcolor: "var(--bg-accent-1)", borderRadius: "8px", minWidth: 40 }}>{hCurrVal || 0}</Typography>
                    </Box>
                  ) },
                  { value: "", display: (
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <IconButton onClick={() => handleOpenEdit(row)} color="primary" size="small" sx={{ border: "1px solid rgba(79, 70, 229, 0.15)", bgcolor: "rgba(79, 70, 229, 0.05)" }}>
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(row._id)} color="error" size="small" sx={{ border: "1px solid rgba(239, 68, 68, 0.15)", bgcolor: "rgba(239, 68, 68, 0.05)" }}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Stack>
                  ) }
                ];
              })}
              alignments={["center", "left", "left", "center", "center", "center", "center", "center"]}
              nonSortableColumns={[7]}
              toolbarLeft={(
                <TextField
                  size="small"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search Employee ID or Name..."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: "var(--text-secondary)", fontSize: "1.2rem" }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: "10px", minWidth: 280 }
                  }}
                />
              )}
            />
          )}
        </Card>
      </Box>

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
