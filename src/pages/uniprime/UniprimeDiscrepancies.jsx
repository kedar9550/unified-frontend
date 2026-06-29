import Loader from "../../components/common/Loader";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  Chip,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Divider,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tooltip,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import {
  Close as CloseIcon,
  CheckCircle as ResolvedIcon,
  HourglassEmpty as PendingIcon,
  UploadFile as UploadIcon,
  Download as DownloadIcon,
  Cancel as RejectedIcon,
} from "@mui/icons-material";
import PageHeader from "../../components/common/PageHeader";
import SectionHeader from "../../components/common/SectionHeader";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";

// ── Status config ─────────────────────────────────────────────────────
const STATUS_CONFIG = {
  PENDING: { label: "Pending", color: "#F59E0B", bg: "rgba(245, 158, 11, 0.1)", icon: <PendingIcon fontSize="small" /> },
  RESOLVED: { label: "Resolved", color: "#10B981", bg: "rgba(16, 185, 129, 0.1)", icon: <ResolvedIcon fontSize="small" /> },
  REJECTED: { label: "Rejected", color: "#EF4444", bg: "rgba(239, 68, 68, 0.1)", icon: <RejectedIcon fontSize="small" /> },
};

const SECTION_LABEL = {
  PROCTORING: "Proctoring Students' Average Pass Percentage",
};

export default function UniprimeDiscrepancies() {
  const { activeRole } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // ── Programs & Branches State ──────────────────────────────────────
  const [programs, setPrograms] = useState([]);
  const [branches, setBranches] = useState([]);

  // ── Resolve dialog state ───────────────────────────────────────────
  const [selected, setSelected] = useState(null);   // the discrepancy item
  const [resultData, setResultData] = useState([]);     // faculty result rows
  const [resultLoading, setResultLoading] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef(null);

  // ── Reject dialog state ────────────────────────────────────────────
  const [rejectItem, setRejectItem] = useState(null);
  const [rejectNote, setRejectNote] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [rejectDone, setRejectDone] = useState(false);

  // ── Fetch discrepancies ────────────────────────────────────────────
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/api/discrepancies", {
        params: { role: activeRole }
      });

      // Filter for Uniprime: only PROCTORING where subtype is PASS_COUNT (raised by faculty)
      const filtered = (res.data || []).filter(item =>
        item.section === "PROCTORING" && item.proctoringType === "PASS_COUNT"
      );
      setItems(filtered);
    } catch (err) {
      console.error("Failed to fetch discrepancies:", err);
      toast.error("Failed to fetch discrepancies");
    } finally {
      setLoading(false);
    }
  }, [activeRole]);

  // ── Fetch programs & branches ────────────────────────────────────────
  useEffect(() => {
    const fetchAcademics = async () => {
      try {
        const [progRes, branchRes] = await Promise.all([
          API.get("/api/academics/programs"),
          API.get("/api/academics/branches")
        ]);
        setPrograms(progRes.data?.data || progRes.data || []);
        setBranches(branchRes.data?.data || branchRes.data || []);
      } catch (err) {
        console.error("Failed to fetch programs/branches:", err);
      }
    };
    fetchAcademics();
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // ── Open resolve dialog & fetch faculty result data ────────────────
  const openResolve = async (item) => {
    setSelected(item);
    setProofFile(null);
    setSuccess(false);
    setResultData([]);
    setResultLoading(true);

    try {
      const res = await API.get("/api/faculty-proctoring/all", {
        params: {
          facultyId: item.facultyInstitutionId,
          academicYearId: item.academicYearId?._id,
        },
      });
      const rows = (res.data?.data || []).map(r => ({
        ...r,
        _edited: false,
        programId: r.programId?._id || r.programId || "",
        branchId: r.branchId?._id || r.branchId || ""
      }));
      setResultData(rows);
    } catch (err) {
      console.error("Failed to fetch faculty results:", err);
      toast.error("Failed to fetch proctoring details");
    } finally {
      setResultLoading(false);
    }
  };

  // ── Handle inline edit of a result row ─────────────────────────────
  const handleResultEdit = (index, field, value) => {
    setResultData(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value, _edited: true };

      // Auto-recalculate pass % for PROCTORING
      if (field === "eligibleStudents" || field === "passedStudents") {
        const eligible = Number(field === "eligibleStudents" ? value : updated[index].eligibleStudents) || 0;
        const passed = Number(field === "passedStudents" ? value : updated[index].passedStudents) || 0;
        updated[index].passPercentage = eligible > 0 ? ((passed / eligible) * 100).toFixed(2) : "0.00";
      }

      return updated;
    });
  };

  // ── Add a new empty row ─────────────────────────────────────────────
  const handleAddRow = () => {
    setResultData(prev => [
      ...prev,
      {
        _tempId: `new-${Date.now()}`,
        _isNew: true,
        _edited: true,
        programId: "",
        branchId: "",
        branch: "",
        semesterNumber: "",
        yearNumber: "",
        section: "",
        totalStudents: 0,
        eligibleStudents: 0,
        passedStudents: 0,
        passPercentage: "0.00",
      }
    ]);
  };

  // ── Remove a new (unsaved) row ─────────────────────────────────────
  const handleRemoveRow = (index) => {
    setResultData(prev => prev.filter((_, i) => i !== index));
  };

  // ── Handle resolve submit ──────────────────────────────────────────
  const handleResolve = async () => {
    if (!proofFile) {
      toast.warning("Please upload a proof document before submitting");
      return;
    }
    if (proofFile.size > 500 * 1024) {
      toast.error("Proof document must be under 500kb");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Update existing edited rows
      const editedRows = resultData.filter(r => r._edited && !r._isNew);
      for (const row of editedRows) {
        const branchName = branches.find(b => b._id === row.branchId)?.name || row.branch || "";
        await API.put(`/api/faculty-proctoring/${row._id}`, {
          programId: row.programId,
          branchId: row.branchId,
          branch: branchName,
          semesterNumber: row.semesterNumber ? Number(row.semesterNumber) : null,
          yearNumber: row.yearNumber ? Number(row.yearNumber) : null,
          section: row.section,
          totalStudents: Number(row.totalStudents),
          eligibleStudents: Number(row.eligibleStudents),
          passedStudents: Number(row.passedStudents),
        });
      }

      // 2. Create new rows
      const newRows = resultData.filter(r => r._isNew);
      for (const row of newRows) {
        const branchName = branches.find(b => b._id === row.branchId)?.name || row.branch || "";
        await API.post("/api/faculty-proctoring", {
          facultyId: selected.raisedBy?._id || selected.raisedBy,
          empId: selected.facultyInstitutionId,
          facultyName: selected.facultyName,
          academicYear: selected.academicYearId?._id || selected.academicYearId,
          programId: row.programId,
          branchId: row.branchId,
          semesterNumber: row.semesterNumber ? Number(row.semesterNumber) : null,
          yearNumber: row.yearNumber ? Number(row.yearNumber) : null,
          section: row.section,
          totalStudents: Number(row.totalStudents),
          eligibleStudents: Number(row.eligibleStudents),
          passedStudents: Number(row.passedStudents),
        });
      }

      // 3. Resolve the discrepancy with proof document
      const formData = new FormData();
      formData.append("proof", proofFile);
      formData.append("status", "RESOLVED");
      formData.append("resolutionNote", `Edited ${editedRows.length} record(s), added ${newRows.length} new record(s).`);

      const yearId = selected.academicYearId?._id || selected.academicYearId;
      const semId = selected.semesterTypeId?._id || selected.semesterTypeId;
      if (yearId) formData.append("academicYearId", yearId);
      if (semId) formData.append("semesterTypeId", semId);

      await API.put(`/api/discrepancies/${selected._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess(true);
      setTimeout(() => {
        setSelected(null);
        fetchItems();
      }, 1500);
    } catch (err) {
      console.error("Failed to resolve:", err);
      toast.error(err.response?.data?.message || "Failed to resolve discrepancy");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Open reject dialog ─────────────────────────────────────────────
  const openReject = (item) => {
    setRejectItem(item);
    setRejectNote("");
    setRejectDone(false);
  };

  // ── Handle reject submit ───────────────────────────────────────────
  const handleReject = async () => {
    if (!rejectNote.trim()) {
      toast.warning("Please provide a rejection note");
      return;
    }

    setRejecting(true);
    try {
      const yearId = rejectItem.academicYearId?._id || rejectItem.academicYearId;
      const semId = rejectItem.semesterTypeId?._id || rejectItem.semesterTypeId;

      await API.put(`/api/discrepancies/${rejectItem._id}`, {
        status: "REJECTED",
        rejectionNote: rejectNote.trim(),
        academicYearId: yearId,
        semesterTypeId: semId,
      });
      setRejectDone(true);
      setTimeout(() => {
        setRejectItem(null);
        fetchItems();
      }, 1500);
    } catch (err) {
      console.error("Failed to reject:", err);
      toast.error(err.response?.data?.message || "Failed to reject discrepancy");
    } finally {
      setRejecting(false);
    }
  };

  // ── Stat counts ────────────────────────────────────────────────────
  const counts = items.reduce((acc, i) => {
    acc[i.status] = (acc[i.status] || 0) + 1;
    return acc;
  }, { PENDING: 0, RESOLVED: 0, REJECTED: 0 });

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: "100vh", background: "var(--bg-dashboard)" }}>
      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <PageHeader
        title="Proctoring Discrepancies"
        subtitle="Review and resolve faculty-raised proctoring discrepancies"
      />

        <>
          {/* ── STAT PILLS ─────────────────────────────────────────── */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
              gap: 2,
              mb: 4
            }}
          >
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <Box
                key={key}
                sx={{
                  px: { xs: 2.5, md: 3.5 },
                  py: { xs: 2, md: 2.5 },
                  borderRadius: "20px",
                  background: "var(--bg-panel)",
                  border: `1.5px solid var(--border-color)`,
                  display: "flex",
                  alignItems: "center",
                  gap: 2.5,
                  transition: "all 0.3s ease",
                  boxShadow: `var(--shadow-premium)`,
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: `var(--shadow-premium)`,
                    borderColor: cfg.color,
                    "& .icon-box": { background: cfg.bg }
                  }
                }}
              >
                <Box
                  className="icon-box"
                  sx={{
                    color: cfg.color,
                    background: "var(--bg-glass)",
                    width: 48,
                    height: 48,
                    borderRadius: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid var(--border-color)",
                    transition: "all 0.3s ease"
                  }}
                >
                  {cfg.icon}
                </Box>
                <Box>
                  <Typography
                    sx={{
                      fontSize: { xs: 26, md: 32 },
                      fontWeight: 900,
                      color: "var(--text-primary)",
                      lineHeight: 1
                    }}
                  >
                    {counts[key] || 0}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: cfg.color,
                      textTransform: "uppercase",
                      mt: 0.5,
                      letterSpacing: "0.08em"
                    }}
                  >
                    {cfg.label}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>

          {/* ── TABLE ───────────────────────────────────────────────── */}
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
            <SectionHeader title="Discrepancy List" />

            {items.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 10, color: "var(--text-secondary)" }}>
                <Typography fontSize={40}>🎉</Typography>
                <Typography mt={1} fontWeight={700} sx={{ color: "var(--text-primary)" }}>No discrepancies found.</Typography>
                <Typography fontSize={13} sx={{ opacity: 0.8 }}>All clear!</Typography>
              </Box>
            ) : (
              <Paper
                sx={{
                  borderRadius: "18px",
                  overflow: "hidden",
                  boxShadow: "none",
                  background: "transparent",
                  border: "1px solid var(--border-color)"
                }}
              >
                <Box sx={{ width: "100%", overflowX: "auto" }}>
                  <Table sx={{ minWidth: 800 }}>
                    <TableHead sx={{ background: "var(--gradient-primary)" }}>
                      <TableRow>
                        {["#", "Faculty", "Academic Year", "Section", "Note", "Raised At", "Status", "Action"].map(col => (
                          <TableCell
                            key={col}
                            sx={{
                              color: "#fff",
                              fontWeight: 700,
                              fontSize: { xs: 11, md: 13 },
                              py: 2,
                              whiteSpace: "nowrap"
                            }}
                          >
                            {col}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.map((item, i) => {
                        const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDING;
                        return (
                          <TableRow
                            key={item._id}
                            sx={{
                              background: i % 2 === 0 ? "var(--bg-accent-1)" : "transparent",
                              height: 70,
                              "&:hover": { background: "var(--bg-accent-2)" }
                            }}
                          >
                            <TableCell sx={{ fontWeight: 600 }}>{i + 1}</TableCell>

                            {/* Faculty */}
                            <TableCell>
                              <Typography fontWeight={700} fontSize={14} sx={{ color: "var(--text-primary)" }}>
                                {item.facultyName || item.raisedBy?.name || "—"}
                              </Typography>
                              <Typography fontSize={12} sx={{ color: "var(--text-secondary)", opacity: 0.8 }}>
                                {item.facultyInstitutionId || item.raisedBy?.institutionId}
                              </Typography>
                            </TableCell>

                            {/* Year / Sem */}
                            <TableCell>
                              <Typography fontSize={13} fontWeight={700} sx={{ color: "var(--text-primary)" }}>
                                {item.academicYearId?.year || "—"}
                              </Typography>
                            </TableCell>

                            {/* Section */}
                            <TableCell>
                              <Box
                                sx={{
                                  px: 1.5, py: 0.4, borderRadius: "10px",
                                  background: "var(--bg-glass)",
                                  border: "1px solid var(--border-color)",
                                  fontSize: 12, fontWeight: 700,
                                  color: "var(--text-primary)",
                                  display: "inline-block",
                                }}
                              >
                                {SECTION_LABEL[item.section] || item.section}
                              </Box>
                            </TableCell>

                            {/* Note */}
                            <TableCell sx={{ maxWidth: 220 }}>
                              <Tooltip title={item.note} placement="top">
                                <Typography
                                  fontSize={13}
                                  noWrap
                                  sx={{ color: "var(--text-primary)", fontWeight: 500 }}
                                >
                                  {item.note}
                                </Typography>
                              </Tooltip>
                            </TableCell>

                            {/* Raised At */}
                            <TableCell sx={{ fontSize: 12, color: "var(--text-secondary)" }}>
                              {new Date(item.createdAt).toLocaleString("en-IN")}
                            </TableCell>

                            {/* Status */}
                            <TableCell>
                              <Chip
                                label={cfg.label}
                                size="small"
                                sx={{
                                  fontWeight: 800,
                                  fontSize: 11,
                                  color: cfg.color,
                                  background: cfg.bg,
                                  borderRadius: "10px",
                                  px: 0.5
                                }}
                              />
                            </TableCell>

                            {/* Action */}
                            <TableCell>
                              {item.status === "PENDING" ? (
                                <Box sx={{ display: "flex", gap: 1, flexDirection: "column" }}>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() => openResolve(item)}
                                    sx={{ textTransform: "none", borderRadius: "8px", fontWeight: 700 }}
                                  >
                                    ✓ Resolve
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    onClick={() => openReject(item)}
                                    sx={{ textTransform: "none", borderRadius: "8px", fontWeight: 700 }}
                                  >
                                    ✕ Reject
                                  </Button>
                                </Box>
                              ) : (
                                item.proofDocument && (
                                  <Tooltip title="Download Proof">
                                    <IconButton
                                      size="small"
                                      href={`${import.meta.env.VITE_BACKEND_URL}/uploads/discrepancies/${item.proofDocument}`}
                                      target="_blank"
                                    >
                                      <DownloadIcon fontSize="small" sx={{ color: "#2e7d32" }} />
                                    </IconButton>
                                  </Tooltip>
                                )
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Box>
              </Paper>
            )}
          </Box>
        </>
    

      {/* ── RESOLVE DIALOG ─────────────────────────────────────────── */}
      <Dialog
        open={Boolean(selected)}
        onClose={() => !submitting && setSelected(null)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "28px",
            background: "var(--bg-panel)",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-premium)",
            backdropFilter: "blur(20px)",
          },
        }}
      >
        <DialogTitle sx={{ pb: 0 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography fontWeight={700} fontSize={17} sx={{ color: "var(--text-primary)" }}>
              ✏️ Review &amp; Resolve Discrepancy
            </Typography>
            <IconButton size="small" onClick={() => setSelected(null)} disabled={submitting}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          {success ? (
            <Box sx={{ textAlign: "center", py: 5 }}>
              <Typography fontSize={44}>✅</Typography>
              <Typography fontWeight={600} mt={1} sx={{ color: "var(--text-primary)" }}>Resolved Successfully!</Typography>
              <Typography fontSize={13} color="text.secondary">Data updated and proof uploaded.</Typography>
            </Box>
          ) : (
            selected && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1.5 }}>
                {/* Faculty Info */}
                <Box
                  sx={{
                    p: 2,
                    borderRadius: "14px",
                    background: "var(--bg-accent-1)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                      <Typography fontSize={12} color="text.secondary">Raised by</Typography>
                      <Typography fontWeight={700} fontSize={16} sx={{ color: "var(--text-primary)" }}>{selected.facultyName}</Typography>
                      <Typography fontSize={13} color="text.secondary">
                        EMP ID: {selected.facultyInstitutionId}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "right" }}>
                      <Typography fontSize={12} color="text.secondary">Period</Typography>
                      <Typography fontWeight={600} fontSize={14} sx={{ color: "var(--text-primary)" }}>
                        {selected.academicYearId?.year} — {selected.semesterTypeId?.name}
                      </Typography>
                      <Box
                        sx={{
                          mt: 0.5, px: 1.5, py: 0.3, borderRadius: "8px",
                          background: "var(--bg-accent-2)", fontSize: 12, fontWeight: 600,
                          color: "var(--text-primary)", display: "inline-block",
                        }}
                      >
                        {SECTION_LABEL[selected.section] || selected.section}
                      </Box>
                    </Box>
                  </Box>
                  <Divider sx={{ my: 1.5, borderColor: "var(--border-color)" }} />
                  <Typography fontSize={13} color="error" fontWeight={500}>
                    📝 Issue: <span style={{ fontStyle: "italic", color: "var(--text-primary)" }}>"{selected.note}"</span>
                  </Typography>
                </Box>

                {/* Proctoring Result Data */}
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography sx={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                      📊 Faculty Proctoring Data
                      <span style={{ fontSize: 12, fontWeight: 400, color: "text.secondary", marginLeft: 8 }}>
                        (Edit values below, then upload proof and submit)
                      </span>
                    </Typography>
                    {!resultLoading && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={handleAddRow}
                        sx={{ textTransform: "none", borderRadius: "8px", fontWeight: 700 }}
                      >
                        + Add New Row
                      </Button>
                    )}
                  </Box>

                  {resultLoading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : resultData.length === 0 ? (
                    <Box
                      sx={{
                        p: 3, borderRadius: "14px", background: "rgba(245, 158, 11, 0.08)",
                        border: "1px solid rgba(245, 158, 11, 0.3)", textAlign: "center",
                      }}
                    >
                      <Typography fontSize={13} color="warning.main">
                        ⚠️ No proctoring records found for this faculty / year.
                      </Typography>
                    </Box>
                  ) : (
                    <Paper sx={{ borderRadius: "14px", overflow: "hidden", border: "1px solid var(--border-color)", background: "transparent", overflowX: "auto" }}>
                      <Table size="small">
                        <TableHead sx={{ background: "var(--bg-accent-1)" }}>
                          <TableRow>
                            {["#", "Program", "Branch", "Sem", "Yr", "Sec", "Total Allotted", "Eligible (A)", "Passed (B)", "Pass %", ""].map(h => (
                              <TableCell key={h} sx={{ fontWeight: 600, fontSize: 12, color: "var(--text-primary)", borderColor: "var(--border-color)" }}>{h}</TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {resultData.map((row, idx) => (
                            <TableRow
                              key={row._id || row._tempId}
                              sx={{
                                background: row._isNew ? "rgba(245, 158, 11, 0.05)" : row._edited ? "rgba(33, 150, 243, 0.05)" : "transparent",
                                transition: "background 0.2s",
                              }}
                            >
                              <TableCell sx={{ fontWeight: 600, fontSize: 12, width: 30, borderColor: "var(--border-color)" }}>
                                {idx + 1}
                                {row._isNew && (
                                  <Typography fontSize={9} color="warning.main" fontWeight={700}>NEW</Typography>
                                )}
                              </TableCell>

                              <TableCell sx={{ borderColor: "var(--border-color)" }}>
                                <Select
                                  variant="standard"
                                  value={row.programId || ""}
                                  onChange={e => handleResultEdit(idx, "programId", e.target.value)}
                                  sx={{ fontSize: 13, fontWeight: 600, minWidth: 80, color: "var(--text-primary)" }}
                                  disableUnderline={!row._edited}
                                >
                                  <MenuItem value="">—</MenuItem>
                                  {programs.map(p => <MenuItem key={p._id} value={p._id}>{p.code}</MenuItem>)}
                                </Select>
                              </TableCell>

                              <TableCell sx={{ borderColor: "var(--border-color)" }}>
                                <Select
                                  variant="standard"
                                  value={row.branchId || ""}
                                  onChange={e => handleResultEdit(idx, "branchId", e.target.value)}
                                  sx={{ fontSize: 13, fontWeight: 600, minWidth: 80, color: "var(--text-primary)" }}
                                  disableUnderline={!row._edited}
                                >
                                  <MenuItem value="">—</MenuItem>
                                  {branches.filter(b => !row.programId || b.programId?._id === row.programId || b.programId === row.programId).map(b => (
                                    <MenuItem key={b._id} value={b._id}>{b.code}</MenuItem>
                                  ))}
                                </Select>
                              </TableCell>

                              <TableCell sx={{ borderColor: "var(--border-color)" }}>
                                <TextField
                                  variant="standard"
                                  type="number"
                                  value={row.semesterNumber ?? ""}
                                  onChange={e => handleResultEdit(idx, "semesterNumber", e.target.value)}
                                  InputProps={{ disableUnderline: !row._edited, sx: { fontSize: 13, color: "var(--text-primary)" } }}
                                  placeholder="Sem"
                                  sx={{ width: 45 }}
                                />
                              </TableCell>

                              <TableCell sx={{ borderColor: "var(--border-color)" }}>
                                <TextField
                                  variant="standard"
                                  type="number"
                                  value={row.yearNumber ?? ""}
                                  onChange={e => handleResultEdit(idx, "yearNumber", e.target.value)}
                                  InputProps={{ disableUnderline: !row._edited, sx: { fontSize: 13, color: "var(--text-primary)" } }}
                                  placeholder="Yr"
                                  sx={{ width: 45 }}
                                />
                              </TableCell>

                              <TableCell sx={{ borderColor: "var(--border-color)" }}>
                                <TextField
                                  variant="standard"
                                  value={row.section || ""}
                                  onChange={e => handleResultEdit(idx, "section", e.target.value)}
                                  InputProps={{ disableUnderline: !row._edited, sx: { fontSize: 13, color: "var(--text-primary)" } }}
                                  placeholder="Sec"
                                  sx={{ width: 45 }}
                                />
                              </TableCell>

                              <TableCell sx={{ borderColor: "var(--border-color)" }}>
                                <TextField
                                  variant="standard"
                                  type="number"
                                  value={row.totalStudents ?? ""}
                                  onChange={e => handleResultEdit(idx, "totalStudents", e.target.value)}
                                  InputProps={{ disableUnderline: !row._edited, sx: { fontSize: 13, fontWeight: 600, color: "var(--text-primary)" } }}
                                  sx={{ width: 65 }}
                                />
                              </TableCell>

                              <TableCell sx={{ borderColor: "var(--border-color)" }}>
                                <TextField
                                  variant="standard"
                                  type="number"
                                  value={row.eligibleStudents ?? ""}
                                  onChange={e => handleResultEdit(idx, "eligibleStudents", e.target.value)}
                                  InputProps={{ disableUnderline: !row._edited, sx: { fontSize: 13, fontWeight: 600, color: "var(--text-primary)" } }}
                                  sx={{ width: 65 }}
                                />
                              </TableCell>

                              <TableCell sx={{ borderColor: "var(--border-color)" }}>
                                <TextField
                                  variant="standard"
                                  type="number"
                                  value={row.passedStudents ?? ""}
                                  onChange={e => handleResultEdit(idx, "passedStudents", e.target.value)}
                                  InputProps={{ disableUnderline: !row._edited, sx: { fontSize: 13, fontWeight: 600, color: "var(--text-primary)" } }}
                                  sx={{ width: 65 }}
                                />
                              </TableCell>

                              <TableCell sx={{ borderColor: "var(--border-color)" }}>
                                <Typography fontSize={13} fontWeight={700} color={Number(row.passPercentage) >= 80 ? "success.main" : "warning.main"}>
                                  {Number(row.passPercentage || 0).toFixed(1)}%
                                </Typography>
                              </TableCell>

                              <TableCell sx={{ borderColor: "var(--border-color)", width: 40 }}>
                                {row._isNew && (
                                  <IconButton size="small" onClick={() => handleRemoveRow(idx)} color="error">
                                    <CloseIcon fontSize="small" />
                                  </IconButton>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Paper>
                  )}
                </Box>

                {/* Proof Document Upload */}
                <Box
                  sx={{
                    mt: 3, p: 3, borderRadius: "18px",
                    background: "var(--bg-accent-1)",
                    border: "2px dashed var(--border-color)",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    "&:hover": { borderColor: "var(--color-primary)", background: "var(--bg-accent-2)" },
                  }}
                  onClick={() => fileRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileRef}
                    style={{ display: "none" }}
                    onChange={e => setProofFile(e.target.files?.[0] || null)}
                    accept=".pdf,.png,.jpg,.jpeg"
                  />
                  <UploadIcon sx={{ fontSize: 32, color: "var(--color-primary)", mb: 1 }} />
                  <Typography fontSize={14} fontWeight={700} sx={{ color: "var(--text-primary)" }}>
                    {proofFile ? `Selected: ${proofFile.name}` : "Upload Resolution Proof / Signed Memo"}
                  </Typography>
                  <Typography fontSize={12} color="text.secondary" mt={0.5}>
                    PDF, PNG, or JPG under 500kb. Required to resolve.
                  </Typography>
                </Box>
              </Box>
            )
          )}
        </DialogContent>

        {!success && selected && (
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setSelected(null)} disabled={submitting} sx={{ textTransform: "none", fontWeight: 600 }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              disabled={submitting || !proofFile}
              onClick={handleResolve}
              sx={{ textTransform: "none", borderRadius: "10px", fontWeight: 700, px: 3 }}
            >
              {submitting ? "Submitting..." : "Resolve & Update"}
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* ── REJECT DIALOG ──────────────────────────────────────────── */}
      <Dialog
        open={Boolean(rejectItem)}
        onClose={() => !rejecting && setRejectItem(null)}
        PaperProps={{
          sx: {
            borderRadius: "20px",
            background: "var(--bg-panel)",
            border: "1px solid var(--border-color)",
          },
        }}
      >
        <DialogTitle sx={{ pb: 0 }}>
          <Typography fontWeight={800} fontSize={18} sx={{ color: "var(--text-primary)" }}>
            Reject Discrepancy
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          {rejectDone ? (
            <Box sx={{ textAlign: "center", py: 3 }}>
              <Typography fontSize={40}>❌</Typography>
              <Typography fontWeight={700} mt={1} sx={{ color: "var(--text-primary)" }}>Discrepancy Rejected</Typography>
              <Typography fontSize={13} color="text.secondary">Resolution cancelled.</Typography>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1.5, minWidth: 320 }}>
              <Typography fontSize={13} color="text.secondary">
                Provide a reason for rejecting this discrepancy. The faculty will be able to see this note.
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Rejection Note / Feedback"
                variant="outlined"
                value={rejectNote}
                onChange={e => setRejectNote(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                  },
                }}
              />
            </Box>
          )}
        </DialogContent>

        {!rejectDone && (
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setRejectItem(null)} disabled={rejecting} sx={{ textTransform: "none", fontWeight: 600 }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              disabled={rejecting || !rejectNote.trim()}
              onClick={handleReject}
              sx={{ textTransform: "none", borderRadius: "10px", fontWeight: 700 }}
            >
              {rejecting ? "Rejecting..." : "Reject Discrepancy"}
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </Box>
  );
}
