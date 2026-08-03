import Loader from "../../components/common/Loader";
import React, { useState, useEffect, useCallback } from "react";
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
  Divider,
  Tooltip,
  Tabs,
  Tab
} from "@mui/material";
import {
  Search,
  Add,
  Delete,
  CheckCircle,
  Error,
  Assignment,
  Refresh,
  Person,
  UploadFile,
  Visibility,
  Close,
  Save
} from "@mui/icons-material";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip
} from "recharts";
import axiosInstance from "../../api/axios";
import { toast } from "sonner";
import PageHeader from "../../components/common/PageHeader";
import DataTable from "../../components/data/DataTable";

const THIS_YEAR = new Date().getFullYear();

const TYPE_CONFIG = {
  citations: {
    label: "Citations",
    valueLabel: "Citations",
    color: "#10b981",
    templateHeaders: ["empid", "year", "value"],
    templateSample: ["6611", String(THIS_YEAR), "80"]
  },
  hindex: {
    label: "H-Index",
    valueLabel: "H-Index",
    color: "#4f46e5",
    templateHeaders: ["empid", "year", "value"],
    templateSample: ["6611", String(THIS_YEAR), "5"]
  }
};

// ---------------------------------------------------------------------------
// Detail Dialog: year-wise trend chart + editable year rows for one employee
// ---------------------------------------------------------------------------
function DetailDialog({ open, onClose, type, empid, onChanged }) {
  const cfg = TYPE_CONFIG[type];
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [rows, setRows] = useState([]); // [{year, value, editing, draftValue}]
  const [newYear, setNewYear] = useState("");
  const [newValue, setNewValue] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!empid) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/api/author-citations/${type}/${empid}`);
      if (res.data && res.data.success) {
        setData(res.data.data);
        setRows(
          res.data.data.history.map((h) => ({ ...h, editing: false, draftValue: String(h.value) }))
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch history.");
    } finally {
      setLoading(false);
    }
  }, [type, empid]);

  useEffect(() => {
    if (open) {
      setNewYear("");
      setNewValue("");
      fetchHistory();
    }
  }, [open, fetchHistory]);

  const startEdit = (year) => {
    setRows((prev) => prev.map((r) => (r.year === year ? { ...r, editing: true } : r)));
  };

  const cancelEdit = (year) => {
    setRows((prev) =>
      prev.map((r) => (r.year === year ? { ...r, editing: false, draftValue: String(r.value) } : r))
    );
  };

  const changeDraft = (year, val) => {
    setRows((prev) => prev.map((r) => (r.year === year ? { ...r, draftValue: val } : r)));
  };

  const saveYear = async (year) => {
    const row = rows.find((r) => r.year === year);
    if (!row || row.draftValue === "") return toast.error("Value is required.");

    setSaving(true);
    try {
      const res = await axiosInstance.post(`/api/author-citations/${type}`, {
        empid,
        year,
        value: Number(row.draftValue)
      });
      if (res.data && res.data.success) {
        toast.success(`${cfg.valueLabel} for ${year} updated.`);
        onChanged?.();
        fetchHistory();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const deleteYear = async (year) => {
    if (!window.confirm(`Delete the ${year} entry? This cannot be undone.`)) return;
    setSaving(true);
    try {
      const res = await axiosInstance.delete(`/api/author-citations/${type}/${empid}/${year}`);
      if (res.data && res.data.success) {
        toast.success(`Year ${year} entry deleted.`);
        onChanged?.();
        fetchHistory();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete.");
    } finally {
      setSaving(false);
    }
  };

  const addNewYear = async () => {
    if (!newYear || newYear === "") return toast.error("Please select a year.");
    if (Number(newYear) > THIS_YEAR) return toast.error("Future year is not allowed.");
    if (newValue === "") return toast.error("Please enter a value.");
    if (rows.some((r) => r.year === Number(newYear))) {
      return toast.error("This year already has an entry. Edit it below instead.");
    }

    setSaving(true);
    try {
      const res = await axiosInstance.post(`/api/author-citations/${type}`, {
        empid,
        year: Number(newYear),
        value: Number(newValue)
      });
      if (res.data && res.data.success) {
        toast.success(`${cfg.valueLabel} for ${newYear} added.`);
        setNewYear("");
        setNewValue("");
        onChanged?.();
        fetchHistory();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add.");
    } finally {
      setSaving(false);
    }
  };

  const chartData = rows.map((r) => ({ year: r.year, value: r.value }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth sx={{ "& .MuiDialog-paper": { borderRadius: "16px" } }}>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 800 }}>
        <Box>
          {data?.employeeName || "Employee"} — {cfg.label} History
          {data?.designation && (
            <Typography variant="caption" sx={{ display: "block", color: "var(--text-secondary)", fontWeight: 550 }}>
              {data.designation}
            </Typography>
          )}
        </Box>
        <IconButton onClick={onClose}><Close /></IconButton>
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><Loader /></Box>
        ) : (
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Trend chart */}
            {chartData.length > 0 ? (
              <Box sx={{ height: 220, width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <ChartTooltip />
                    <Line type="monotone" dataKey="value" stroke={cfg.color} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Typography variant="body2" sx={{ color: "var(--text-secondary)", textAlign: "center", py: 2 }}>
                No {cfg.label.toLowerCase()} data yet for this employee.
              </Typography>
            )}

            <Divider />

            {/* Year-wise editable rows */}
            <Box sx={{ maxHeight: 250, overflowY: "auto", pr: 1 }}>
              <Stack spacing={1.2}>
                {rows.sort((a, b) => b.year - a.year).map((r) => (
                  <Stack key={r.year} direction="row" spacing={1.5} alignItems="center" sx={{ p: 1.2, borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                    <Typography sx={{ fontWeight: 800, minWidth: 60 }}>{r.year}</Typography>
                    {r.editing ? (
                      <TextField
                        size="small"
                        type="number"
                        value={r.draftValue}
                        onChange={(e) => changeDraft(r.year, e.target.value)}
                        sx={{ flex: 1 }}
                      />
                    ) : (
                      <Typography sx={{ flex: 1, fontWeight: 700, color: cfg.color }}>{r.value}</Typography>
                    )}
                    {r.editing ? (
                      <>
                        <Tooltip title="Save">
                          <IconButton size="small" color="primary" disabled={saving} onClick={() => saveYear(r.year)}>
                            <Save fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancel">
                          <IconButton size="small" onClick={() => cancelEdit(r.year)}>
                            <Close fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    ) : (
                      <>
                        <Tooltip title="Edit this year">
                          <IconButton size="small" color="primary" onClick={() => startEdit(r.year)}>
                            <Assignment fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete this year">
                          <IconButton size="small" color="error" disabled={saving} onClick={() => deleteYear(r.year)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </Stack>
                ))}
              </Stack>
            </Box>

            <Divider />

            {/* Add a new year entry */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "var(--text-secondary)", display: "block", mb: 0.8 }}>
                Add {cfg.valueLabel} for a New Year
              </Typography>
              <Stack direction="row" spacing={1.5}>
                <TextField
                  size="small"
                  type="number"
                  placeholder="Year"
                  value={newYear}
                  onChange={(e) => setNewYear(e.target.value)}
                  inputProps={{ max: THIS_YEAR }}
                  sx={{ width: 120 }}
                />
                <TextField
                  size="small"
                  type="number"
                  placeholder={`${cfg.valueLabel} value`}
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  sx={{ flex: 1 }}
                />
                <Button variant="contained" onClick={addNewYear} disabled={saving} sx={{ textTransform: "none", fontWeight: 700, borderRadius: "10px" }}>
                  Add
                </Button>
              </Stack>
            </Box>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Add Record Dialog: verify employee, pick year (<= current year), enter value
// ---------------------------------------------------------------------------
function AddRecordDialog({ open, onClose, type, onSaved }) {
  const cfg = TYPE_CONFIG[type];
  const [empid, setEmpid] = useState("");
  const [year, setYear] = useState(String(THIS_YEAR));
  const [value, setValue] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifiedEmployee, setVerifiedEmployee] = useState(null);
  const [verificationError, setVerificationError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setEmpid("");
      setYear(String(THIS_YEAR));
      setValue("");
      setVerifiedEmployee(null);
      setVerificationError("");
    }
  }, [open]);

  const verifyEmployee = async () => {
    if (!empid.trim()) {
      setVerificationError("Please enter an Employee ID.");
      return;
    }
    setVerifying(true);
    setVerificationError("");
    setVerifiedEmployee(null);
    try {
      const localRes = await axiosInstance.get(`/api/employees/search?query=${empid}`);
      const localEmp = localRes.data?.find(
        (emp) => emp.institutionId.trim().toUpperCase() === empid.trim().toUpperCase()
      );
      if (localEmp) {
        setVerifiedEmployee({
          name: localEmp.name,
          designation: localEmp.designation || "Faculty",
          department: localEmp.coreDepartment?.name || localEmp.department?.name || "N/A",
          scopusId: localEmp.scopusId || ""
        });
        return;
      }
      const ecapRes = await axiosInstance.get(`/api/employees/staff/${empid}`);
      if (ecapRes.data && ecapRes.data.success) {
        const staff = ecapRes.data.data;
        setVerifiedEmployee({
          name: staff.employeename || staff.EmployeeName || "",
          designation: staff.designation || "Faculty",
          department: staff.department || "N/A",
          scopusId: staff.scopusId || ""
        });
      } else {
        setVerificationError("Employee not found in local database or external records.");
      }
    } catch (err) {
      setVerificationError(err.response?.data?.message || "Failed to verify Employee ID.");
    } finally {
      setVerifying(false);
    }
  };

  const handleSave = async () => {
    if (!empid.trim()) return toast.error("Employee ID is required.");
    if (!verifiedEmployee) return toast.error("Please verify the Employee ID first.");
    if (!year) return toast.error("Please select a year.");
    if (Number(year) > THIS_YEAR) return toast.error("Future year is not allowed.");
    if (value === "") return toast.error("Please enter a value.");

    setSaving(true);
    try {
      const res = await axiosInstance.post(`/api/author-citations/${type}`, {
        empid: empid.trim(),
        year: Number(year),
        value: Number(value)
      });
      if (res.data && res.data.success) {
        toast.success(res.data.message || "Saved successfully!");
        onSaved?.();
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth sx={{ "& .MuiDialog-paper": { borderRadius: "16px", p: 1 } }}>
      <DialogTitle sx={{ fontWeight: 800, fontSize: "1.4rem", display: "flex", alignItems: "center", gap: 1 }}>
        <Add sx={{ color: "var(--color-primary)" }} />
        Add {cfg.label} Record
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "var(--text-secondary)", display: "block", mb: 0.8 }}>
              Employee ID
            </Typography>
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                value={empid}
                onChange={(e) => { setEmpid(e.target.value); setVerifiedEmployee(null); }}
                placeholder="e.g. 5741"
                InputProps={{ sx: { borderRadius: "10px" } }}
              />
              <Button
                variant="outlined"
                onClick={verifyEmployee}
                disabled={verifying || !empid.trim()}
                sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, px: 3 }}
              >
                {verifying ? <Loader size={24} /> : "Verify"}
              </Button>
            </Stack>
            {verificationError && (
              <Typography variant="caption" sx={{ color: "#ef4444", fontWeight: 600, display: "flex", alignItems: "center", gap: 0.5, mt: 0.8 }}>
                <Error sx={{ fontSize: "1rem" }} />
                {verificationError}
              </Typography>
            )}
          </Box>

          {verifiedEmployee && (
            <Box sx={{ p: 2, borderRadius: "12px", border: "1px solid var(--border-color)", bgcolor: "var(--bg-accent-1)", display: "flex", gap: 1.5 }}>
              <Avatar sx={{ bgcolor: "var(--color-primary)" }}><Person /></Avatar>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                  {verifiedEmployee.name}
                </Typography>
                <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 550, display: "block" }}>
                  {verifiedEmployee.designation} | {verifiedEmployee.department}
                  {verifiedEmployee.scopusId ? ` | Scopus ID: ${verifiedEmployee.scopusId}` : " | Scopus ID not set on profile"}
                </Typography>
                <Typography variant="caption" sx={{ color: "#10b981", fontWeight: 700, display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                  <CheckCircle sx={{ fontSize: "0.95rem" }} /> Verified successfully
                </Typography>
              </Box>
            </Box>
          )}

          <Divider />

          <Stack direction="row" spacing={2}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "var(--text-secondary)", display: "block", mb: 0.8 }}>
                Year
              </Typography>
              <TextField
                fullWidth
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                inputProps={{ max: THIS_YEAR }}
                InputProps={{ sx: { borderRadius: "10px" } }}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "var(--text-secondary)", display: "block", mb: 0.8 }}>
                {cfg.valueLabel} Value
              </Typography>
              <TextField
                fullWidth
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g. 80"
                InputProps={{ sx: { borderRadius: "10px" } }}
              />
            </Box>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, gap: 1.5 }}>
        <Button onClick={onClose} sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, px: 3, border: "1px solid var(--border-color)" }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, px: 4, background: "var(--gradient-primary)", color: "white" }}
        >
          {saving ? <Loader size={24} color="inherit" /> : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// One tab's content: list + toolbar (refresh, template, bulk upload, add)
// ---------------------------------------------------------------------------
function MetricTab({ type }) {
  const cfg = TYPE_CONFIG[type];
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [detailEmpid, setDetailEmpid] = useState(null);

  const fetchRecords = useCallback(async (search = "") => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/api/author-citations/${type}?search=${search}`);
      if (res.data && res.data.success) setRecords(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch records.");
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => { fetchRecords(searchQuery); /* eslint-disable-next-line */ }, [type]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    fetchRecords(val);
  };

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
      const res = await axiosInstance.post(`/api/author-citations/${type}/bulk`, formData, {
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
    const csvContent = "data:text/csv;charset=utf-8," + [cfg.templateHeaders.join(","), cfg.templateSample.join(",")].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${type}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="flex-end" sx={{ mb: 2 }}>
        <Tooltip title="Refresh Records">
          <IconButton onClick={() => fetchRecords(searchQuery)} disabled={loading || uploading} sx={{ bgcolor: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
            <Refresh className={loading ? "spin-animation" : ""} />
          </IconButton>
        </Tooltip>
        <Button variant="outlined" onClick={downloadTemplate} startIcon={<Assignment />} sx={{ borderColor: "var(--color-primary)", color: "var(--color-primary)", fontWeight: 700, borderRadius: "10px", textTransform: "none" }}>
          Template
        </Button>
        <Button variant="outlined" component="label" disabled={uploading} startIcon={uploading ? <Loader size={20} color="inherit" /> : <UploadFile />} sx={{ borderColor: "var(--color-primary)", color: "var(--color-primary)", fontWeight: 700, borderRadius: "10px", textTransform: "none" }}>
          {uploading ? "Uploading..." : "Bulk Upload"}
          <input type="file" accept=".csv" hidden onChange={handleBulkUpload} />
        </Button>
        <Button variant="contained" startIcon={<Add />} onClick={() => setAddOpen(true)} sx={{ background: "var(--gradient-primary)", color: "white", fontWeight: 700, borderRadius: "10px", textTransform: "none", boxShadow: "0 4px 12px var(--color-primary-alpha)" }}>
          Add Record
        </Button>
      </Stack>

      <Box sx={{ mt: 2, width: "100%" }}>
        {loading && records.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <Loader color="secondary" />
          </Box>
        ) : (
          <DataTable
            columns={["EMP ID", "FACULTY NAME", "DESIGNATION", `LATEST ${cfg.valueLabel.toUpperCase()}`, "ACTIONS"]}
            rows={records.map((row) => [
              { value: row.empid, display: <Typography sx={{ fontWeight: 700, color: "var(--color-primary)" }}>{row.empid}</Typography> },
              { value: row.employeeName, display: <Typography sx={{ fontWeight: 700, color: "var(--text-primary)" }}>{row.employeeName}</Typography> },
              { value: row.designation, display: <Typography sx={{ color: "var(--text-secondary)", fontWeight: 550, fontSize: "0.85rem" }}>{row.designation}</Typography> },              { value: row.latestValue ?? 0, display: (
                <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 1 }}>
                  <Typography sx={{ fontWeight: 800, color: cfg.color, p: 1, bgcolor: "rgba(0,0,0,0.02)", borderRadius: "8px", minWidth: 40, textAlign: "center" }}>
                    {row.latestValue ?? "—"}
                  </Typography>
                  {row.latestYear && (
                    <Typography variant="caption" sx={{ color: "var(--text-secondary)" }}>({row.latestYear})</Typography>
                  )}
                </Box>
              ) },
              { value: "", display: (
                <Tooltip title="View year-wise history">
                  <IconButton onClick={() => setDetailEmpid(row.empid)} color="primary" size="small">
                    <Visibility fontSize="small" />
                  </IconButton>
                </Tooltip>
              ) }
            ])}
            alignments={["center", "left", "left", "center", "center"]}
            nonSortableColumns={[4]}
          />
        )}
      </Box>

      <AddRecordDialog open={addOpen} onClose={() => setAddOpen(false)} type={type} onSaved={() => fetchRecords(searchQuery)} />
      <DetailDialog open={!!detailEmpid} onClose={() => setDetailEmpid(null)} type={type} empid={detailEmpid} onChanged={() => fetchRecords(searchQuery)} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Main page: tabs for Citations / H-Index
// ---------------------------------------------------------------------------
const AuthorCitationsManagement = () => {
  const [tab, setTab] = useState("citations");

  return (
    <Box sx={{ pb: 6 }}>
      <PageHeader
        title="Author Citations & H-Index"
        subtitle="Year-wise Scopus metrics per faculty — Scopus ID is managed from the Employee profile"
      />

      <Box sx={{ mt: 3, mx: { xs: 2.5, sm: 4 } }}>
        <Tabs
          value={tab}
          onChange={(e, v) => setTab(v)}
          sx={{ mb: 2.5, "& .MuiTab-root": { fontWeight: 700, textTransform: "none" } }}
        >
          <Tab label="Citations" value="citations" />
          <Tab label="H-Index" value="hindex" />
        </Tabs>

        {tab === "citations" && <MetricTab type="citations" />}
        {tab === "hindex" && <MetricTab type="hindex" />}
      </Box>
    </Box>
  );
};

export default AuthorCitationsManagement;
