import Loader from "../../components/common/Loader";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  CircularProgress,
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
  Avatar,
  MenuItem,
  Select,
} from "@mui/material";
import {
  Close as CloseIcon,
  CheckCircle as ResolvedIcon,
  HourglassEmpty as PendingIcon,
  UploadFile as UploadIcon,
  Download as DownloadIcon,
  Cancel as RejectedIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import PageHeader from "../../components/common/PageHeader";
import SectionHeader from "../../components/common/SectionHeader";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";

// ── Status config ─────────────────────────────────────────────────────
const STATUS_CONFIG = {
  PENDING:  { label: "Pending",  color: "#F59E0B", bg: "rgba(245, 158, 11, 0.1)", icon: <PendingIcon fontSize="small" /> },
  RESOLVED: { label: "Resolved", color: "#10B981", bg: "rgba(16, 185, 129, 0.1)", icon: <ResolvedIcon fontSize="small" /> },
  REJECTED: { label: "Rejected", color: "#EF4444", bg: "rgba(239, 68, 68, 0.1)", icon: <RejectedIcon fontSize="small" /> },
};

const SECTION_LABEL = {
  FEEDBACK:   "Feedback",
};

export default function FeedbackDiscrepancies() {
  const { activeRole } = useAuth();
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [programs, setPrograms] = useState([]);

  // ── Resolve dialog state ───────────────────────────────────────────
  const [selected,      setSelected]      = useState(null);   // the discrepancy item
  const [resultData,    setResultData]    = useState([]);     // faculty feedback result rows
  const [resultLoading, setResultLoading] = useState(false);
  const [proofFile,     setProofFile]     = useState(null);
  const [submitting,    setSubmitting]    = useState(false);
  const [success,       setSuccess]       = useState(false);
  const fileRef = useRef(null);

  // ── Reject dialog state ────────────────────────────────────────────
  const [rejectItem,   setRejectItem]   = useState(null);
  const [rejectNote,   setRejectNote]   = useState("");
  const [rejecting,    setRejecting]    = useState(false);
  const [rejectDone,   setRejectDone]   = useState(false);

  // ── Fetch discrepancies ────────────────────────────────────────────
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/api/discrepancies", {
        params: { role: activeRole }
      });
      const feedbackDiscrepancies = (res.data || []).filter(item => item.section === "FEEDBACK");
      setItems(feedbackDiscrepancies);
    } catch (err) {
      console.error("Failed to fetch discrepancies:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPrograms = async () => {
    try {
        const res = await API.get("/api/academics/programs");
        setPrograms(res.data.data || []);
    } catch (err) {
        console.error("Error fetching programs:", err);
    }
  };

  const [branches, setBranches] = useState([]);

  useEffect(() => { 
    fetchItems();
    fetchPrograms();
    const fetchBranches = async () => {
        try {
            const res = await API.get("/api/academics/branches");
            setBranches(res.data.data || []);
        } catch (err) {
            console.error("Error fetching branches:", err);
        }
    };
    fetchBranches();
  }, [fetchItems]);

  // ── Open resolve dialog & fetch faculty result data ────────────────
  const openResolve = async (item) => {
    setSelected(item);
    setProofFile(null);
    setSuccess(false);
    setResultData([]);
    setResultLoading(true);

    try {
      const res = await API.get("/api/faculty-feedback-results", {
        params: {
          facultyId:    item.facultyInstitutionId,
          academicYear: item.academicYearId?._id,
          semester:     item.semesterTypeId?._id,
        },
      });
      const rows = (res.data || []).map(r => ({ 
        ...r, 
        _edited: false,
        programId: r.programId?._id || r.programId || "",
        branchId: r.branchId?._id || r.branchId || ""
      }));
      setResultData(rows);
    } catch (err) {
      console.error("Failed to fetch faculty feedback results:", err);
    } finally {
      setResultLoading(false);
    }
  };

  // ── Handle inline edit of a result row ─────────────────────────────
  const handleResultEdit = (index, field, value) => {
    setResultData(prev => {
      const updated = [...prev];
      let newRow = { ...updated[index], [field]: value, _edited: true };
      
      // If branchId changed, also sync the legacy 'branch' string
      if (field === "branchId") {
        const branchObj = branches.find(b => b._id === value);
        if (branchObj) {
          newRow.branch = branchObj.name;
        }
      }

      // Auto-recalculate percentage when givenStudents or totalStudents edits occur
      if (field === "givenStudents" || field === "totalStudents") {
        const given = Number(field === "givenStudents" ? value : newRow.givenStudents) || 0;
        const total = Number(field === "totalStudents" ? value : newRow.totalStudents) || 0;
        newRow.percentage = total > 0 ? parseFloat(((given / total) * 100).toFixed(1)) : 0;
      }
      
      updated[index] = newRow;
      return updated;
    });
  };

  // ── Add a new empty row ─────────────────────────────────────────────
  const handleAddRow = () => {
    setResultData(prev => [
      ...prev,
      {
        _tempId:        `new-${Date.now()}`,
        _isNew:         true,
        _edited:        true,
        subjectName:    "",
        subjectCode:    "",
        subjectType:    "theory",
        programId:      "",
        branchId:       "",
        branch:         "",
        section:        "",
        phase:          1,
        totalStudents:  0,
        givenStudents:  0,
        percentage:     0,
        semesterNumber: selected.semester || "",
        yearNumber:     selected.semester || "", 
      },
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

    setSubmitting(true);
    try {
      const editedRows = resultData.filter(r => r._edited && !r._isNew);
      for (const row of editedRows) {
        await API.put(`/api/faculty-feedback-results/${row._id}`, {
          subjectName:       row.subjectName,
          subjectCode:       row.subjectCode,
          subjectType:       row.subjectType,
          branch:            row.branch,
          programId:         row.programId,
          branchId:          row.branchId,
          semesterNumber:    row.semesterNumber,
          yearNumber:        row.yearNumber,
          section:           row.section,
          phase:             Number(row.phase),
          totalStudents:     Number(row.totalStudents),
          givenStudents:     Number(row.givenStudents),
          percentage:        Number(row.percentage),
        });
      }

      const newRows = resultData.filter(r => r._isNew && r.subjectName?.trim());
      for (const row of newRows) {
        const branchName = branches.find(b => b._id === row.branchId)?.name || "";
        await API.post("/api/faculty-feedback-results", {
          facultyId:         selected.facultyInstitutionId,
          facultyName:       selected.facultyName || selected.raisedBy?.name,
          subjectName:       row.subjectName,
          subjectCode:       row.subjectCode,
          subjectType:       row.subjectType,
          programId:         row.programId,
          branchId:          row.branchId,
          branch:            branchName,
          semesterNumber:    row.semesterNumber,
          yearNumber:        row.yearNumber,
          section:           row.section,
          phase:             Number(row.phase),
          academicYearId:    selected.academicYearId?._id,
          semesterTypeId:    selected.semesterTypeId?._id,
          totalStudents:     Number(row.totalStudents),
          givenStudents:     Number(row.givenStudents),
          percentage:        Number(row.percentage),
        });
      }

      const formData = new FormData();
      formData.append("proof", proofFile);
      formData.append("status", "RESOLVED");
      formData.append("resolutionNote", `Edited ${editedRows.length} feedback record(s), added ${newRows.length} new record(s).`);

      // Ensure academic identifiers are passed to satisfy backend validation
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
      toast.error(err.response?.data?.message || "Failed to resolve.");
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
      toast.error(err.response?.data?.message || "Failed to reject.");
    } finally {
      setRejecting(false);
    }
  };

  const counts = items.reduce((acc, i) => {
    acc[i.status] = (acc[i.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        title="Feedback Discrepancies"
        subtitle="Review and resolve faculty-raised feedback discrepancies" />

      {/* ── STAT PILLS ────────────────────────────────────── */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 2, mb: 4 }}>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <Box
            key={key}
            sx={{
              px: 3, py: 2.5,
              borderRadius: "20px",
              background: "var(--bg-panel)",
              border: `1.5px solid var(--border-color)`,
              display: "flex", alignItems: "center", gap: 2,
              boxShadow: "var(--shadow-premium)",
              transition: "all 0.3s ease",
              "&:hover": { transform: "translateY(-4px)", borderColor: cfg.color }
            }}
          >
            <Box sx={{ color: cfg.color, background: cfg.bg, p: 1.5, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>{cfg.icon}</Box>
            <Box>
              <Typography sx={{ fontSize: 28, fontWeight: 900, color: "var(--text-primary)", lineHeight: 1 }}>
                {counts[key] || 0}
              </Typography>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.05em", mt: 0.5 }}>
                {cfg.label}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* ── TABLE ─────────────────────────────────────────── */}
      <Box
        sx={{
          p: 3, borderRadius: "24px",
          background: "var(--bg-panel)",
          backdropFilter: "blur(20px)",
          boxShadow: "var(--shadow-premium)",
          border: "1px solid var(--border-color)",
          minHeight: 400,
        }}
      >
        <SectionHeader title="Feedback Discrepancy List" />

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <Loader />
          </Box>
        ) : items.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8, color: "var(--text-secondary)" }}>
            <Typography fontSize={40}>🎉</Typography>
            <Typography mt={1} fontWeight={700} color="var(--text-primary)">No feedback discrepancies assigned to you.</Typography>
            <Typography fontSize={13}>All clear!</Typography>
          </Box>
        ) : (
          <Paper sx={{ borderRadius: "18px", overflowX: "auto", boxShadow: "none", background: "transparent" }}>
            <Table sx={{ minWidth: 1100 }}>
              <TableHead sx={{ background: "var(--gradient-primary)" }}>
                <TableRow>
                  {["#", "Faculty", "Academic Year", "Note", "Raised At", "Status", "Action"].map(col => (
                    <TableCell key={col} sx={{ color: "#fff", fontWeight: 700, fontSize: 13, py: 2 }}>
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
                      sx={{ background: i % 2 === 0 ? "var(--bg-accent-1)" : "transparent", height: 75 }}
                    >
                      <TableCell sx={{ fontWeight: 600 }}>{i + 1}</TableCell>

                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Avatar sx={{ width: 32, height: 32 }}>{(item.facultyName || item.raisedBy?.name)?.charAt(0)}</Avatar>
                            <Box>
                                <Typography fontWeight={700} fontSize={14} color="var(--text-primary)">
                                {item.facultyName || item.raisedBy?.name || "—"}
                                </Typography>
                                <Typography fontSize={11} color="var(--text-secondary)" sx={{ opacity: 0.8 }}>
                                {item.facultyInstitutionId || item.raisedBy?.institutionId}
                                </Typography>
                            </Box>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography fontSize={13} fontWeight={700} color="var(--text-primary)">
                          {item.academicYearId?.year || "—"}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ maxWidth: 300 }}>
                        <Tooltip title={item.note} placement="top">
                          <Typography
                            fontSize={13}
                            sx={{
                              overflow: "hidden", textOverflow: "ellipsis",
                              display: "-webkit-box", WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              color: "var(--text-primary)",
                              fontWeight: 500
                            }}
                          >
                            {item.note}
                          </Typography>
                        </Tooltip>
                      </TableCell>

                      <TableCell>
                        <Typography fontSize={12} fontWeight={600} color="var(--text-primary)">
                          {new Date(item.createdAt).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                        </Typography>
                        <Typography fontSize={11} color="var(--text-secondary)" sx={{ opacity: 0.7 }}>
                          {new Date(item.createdAt).toLocaleTimeString()}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Chip
                          icon={cfg.icon}
                          label={cfg.label}
                          size="small"
                          sx={{
                            background: cfg.bg, color: cfg.color,
                            fontWeight: 700, fontSize: 11,
                            border: `1px solid ${cfg.color}33`,
                            "& .MuiChip-icon": { color: cfg.color },
                          }}
                        />
                        {item.status === "REJECTED" && item.rejectionNote && (
                          <Tooltip title={item.rejectionNote} placement="top">
                            <Typography
                              fontSize={11} color="#b71c1c" mt={0.3}
                              sx={{
                                overflow: "hidden", textOverflow: "ellipsis",
                                whiteSpace: "nowrap", maxWidth: 120,
                                fontStyle: "italic",
                              }}
                            >
                              {item.rejectionNote}
                            </Typography>
                          </Tooltip>
                        )}
                      </TableCell>

                      <TableCell>
                        {item.status === "PENDING" ? (
                          <Box sx={{ display: "flex", gap: 1, flexDirection: "column" }}>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => openResolve(item)}
                            >
                              ✓ Resolve
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => openReject(item)}
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
                                sx={{ background: "var(--bg-glass)", border: "1px solid var(--border-color)" }}
                              >
                                <DownloadIcon fontSize="small" sx={{ color: "var(--color-primary)" }} />
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
          </Paper>
        )}
      </Box>

      {/* ═══════════════════════════════════════════════════════════════
          RESOLVE DIALOG
         ═══════════════════════════════════════════════════════════════ */}
      <Dialog
        open={Boolean(selected)}
        onClose={() => !submitting && setSelected(null)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "28px",
            background: "var(--bg-panel)",
            backdropFilter: "blur(20px)",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-premium)",
          },
        }}
      >
        <DialogTitle sx={{ pb: 0 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography fontWeight={900} fontSize={20} color="var(--text-primary)">
              ✏️ Review &amp; Resolve Feedback
            </Typography>
            <IconButton size="small" onClick={() => setSelected(null)} disabled={submitting}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          {success ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <Typography fontSize={44}>✅</Typography>
              <Typography fontWeight={800} fontSize={20} mt={1} color="var(--text-primary)">Resolved Successfully!</Typography>
              <Typography fontSize={14} color="var(--text-secondary)">Data updated and proof uploaded.</Typography>
            </Box>
          ) : selected && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 2 }}>

              <Box
                sx={{
                  p: 2.5, borderRadius: "18px",
                  background: "var(--bg-glass)", border: "1px solid var(--border-color)",
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                    <Avatar sx={{ width: 48, height: 48 }}>{(selected.facultyName || selected.raisedBy?.name)?.charAt(0)}</Avatar>
                    <Box>
                        <Typography fontSize={12} color="var(--text-secondary)" fontWeight={600}>RAISED BY</Typography>
                        <Typography fontWeight={800} fontSize={18} color="var(--text-primary)">{selected.facultyName || selected.raisedBy?.name}</Typography>
                        <Typography fontSize={13} color="var(--text-secondary)">ID: {selected.facultyInstitutionId || selected.raisedBy?.institutionId}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography fontSize={12} color="var(--text-secondary)" fontWeight={600}>ACADEMIC PERIOD</Typography>
                    <Typography fontWeight={700} fontSize={15} color="var(--text-primary)">
                      {selected.academicYearId?.year} — {selected.semester ? `Sem/Year ${selected.semester}` : selected.semesterTypeId?.name}
                    </Typography>
                    <Box sx={{ mt: 1, px: 2, py: 0.5, borderRadius: "10px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", fontSize: 12, fontWeight: 700, display: "inline-block", color: "var(--text-primary)" }}>
                      💬 Feedback
                    </Box>
                  </Box>
                </Box>
                <Divider sx={{ my: 2, opacity: 0.5 }} />
                <Box sx={{ display: "flex", gap: 1.5 }}>
                    <Typography fontSize={14} color="#ef4444" fontWeight={800}>ISSUE:</Typography>
                    <Typography fontSize={14} color="var(--text-primary)" fontWeight={500} sx={{ fontStyle: "italic" }}>"{selected.note}"</Typography>
                </Box>
              </Box>

              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                    <Typography sx={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)" }}>
                    📊 Faculty Feedback Records
                    </Typography>
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={handleAddRow}
                    >
                        Add Record
                    </Button>
                </Box>

                {resultLoading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><Loader size={28} /></Box>
                ) : resultData.length === 0 ? (
                  <Box sx={{ p: 4, borderRadius: "18px", background: "var(--bg-glass)", border: "1px dashed var(--border-color)", textAlign: "center" }}>
                    <Typography fontSize={14} color="var(--text-secondary)" fontWeight={600}>No feedback records found for this period.</Typography>
                  </Box>
                ) : (
                  <Paper sx={{ borderRadius: "18px", overflow: "hidden", border: "1px solid var(--border-color)", background: "transparent", overflowX: "auto" }}>
                    <Table size="small" sx={{ minWidth: 1000 }}>
                      <TableHead sx={{ background: "var(--bg-accent-1)" }}>
                        <TableRow>
                          {["#", "Subject", "Code", "Type", "Prog", "Branch", "Sem", "Sec", "Ph", "G/T", "%", ""].map(h => (
                            <TableCell key={h} sx={{ fontWeight: 800, fontSize: 12, color: "var(--text-primary)", py: 1.5 }}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {resultData.map((row, idx) => (
                          <TableRow key={row._id || row._tempId} sx={{ background: row._isNew ? "rgba(245, 158, 11, 0.05)" : row._edited ? "rgba(16, 185, 129, 0.05)" : "transparent" }}>
                            <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>{idx + 1}</TableCell>
                            <TableCell><TextField variant="standard" value={row.subjectName} onChange={e => handleResultEdit(idx, "subjectName", e.target.value)} InputProps={{ disableUnderline: !row._edited, sx: { fontSize: 13, fontWeight: 600 } }} fullWidth /></TableCell>
                            <TableCell><TextField variant="standard" value={row.subjectCode} onChange={e => handleResultEdit(idx, "subjectCode", e.target.value)} InputProps={{ disableUnderline: !row._edited, sx: { fontSize: 13, fontWeight: 600 } }} sx={{ width: 70 }} /></TableCell>
                            <TableCell>
                                <Select 
                                    variant="standard" 
                                    value={row.subjectType || "Theory"} 
                                    onChange={e => handleResultEdit(idx, "subjectType", e.target.value)}
                                    sx={{ fontSize: 12, fontWeight: 600, minWidth: 80 }}
                                    disableUnderline={!row._edited}
                                >
                                    <MenuItem value="Theory">Theory</MenuItem>
                                    <MenuItem value="Practical">Practical</MenuItem>
                                    <MenuItem value="Integrated">Integrated</MenuItem>
                                </Select>
                            </TableCell>
                            <TableCell>
                                <Select 
                                    variant="standard" 
                                    value={row.programId} 
                                    onChange={e => handleResultEdit(idx, "programId", e.target.value)}
                                    sx={{ fontSize: 12, fontWeight: 600, minWidth: 80 }}
                                    disableUnderline={!row._edited}
                                >
                                    <MenuItem value="">—</MenuItem>
                                    {programs.map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
                                </Select>
                            </TableCell>
                            <TableCell>
                                <Select 
                                    variant="standard" 
                                    value={row.branchId} 
                                    onChange={e => handleResultEdit(idx, "branchId", e.target.value)}
                                    sx={{ fontSize: 12, fontWeight: 600, minWidth: 80 }}
                                    disableUnderline={!row._edited}
                                >
                                    <MenuItem value="">—</MenuItem>
                                    {branches.filter(b => !row.programId || b.programId?._id === row.programId || b.programId === row.programId).map(b => <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>)}
                                </Select>
                            </TableCell>
                            <TableCell>
                                <TextField 
                                    variant="standard" 
                                    value={row.semesterNumber || row.yearNumber || ""} 
                                    onChange={e => {
                                        const progObj = programs.find(p => p._id === row.programId);
                                        const isYearPattern = progObj ? progObj.programPattern === "YEAR" : false;
                                        if (isYearPattern) {
                                            handleResultEdit(idx, "yearNumber", e.target.value);
                                            handleResultEdit(idx, "semesterNumber", "");
                                        } else {
                                            handleResultEdit(idx, "semesterNumber", e.target.value);
                                            handleResultEdit(idx, "yearNumber", "");
                                        }
                                    }} 
                                    InputProps={{ disableUnderline: !row._edited, sx: { fontSize: 13, fontWeight: 600 } }} 
                                    sx={{ width: 40 }} 
                                />
                            </TableCell>
                            <TableCell><TextField variant="standard" value={row.section} onChange={e => handleResultEdit(idx, "section", e.target.value)} InputProps={{ disableUnderline: !row._edited, sx: { fontSize: 13, fontWeight: 600 } }} sx={{ width: 40 }} /></TableCell>
                            <TableCell><TextField variant="standard" type="number" value={row.phase} onChange={e => handleResultEdit(idx, "phase", e.target.value)} InputProps={{ disableUnderline: !row._edited, sx: { fontSize: 13, fontWeight: 600 } }} sx={{ width: 35 }} /></TableCell>
                            <TableCell>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                    <TextField variant="standard" type="number" value={row.givenStudents} onChange={e => handleResultEdit(idx, "givenStudents", e.target.value)} sx={{ width: 35 }} InputProps={{ sx: { fontSize: 12, fontWeight: 700 } }} />
                                    <Typography>/</Typography>
                                    <TextField variant="standard" type="number" value={row.totalStudents} onChange={e => handleResultEdit(idx, "totalStudents", e.target.value)} sx={{ width: 35 }} InputProps={{ sx: { fontSize: 12, fontWeight: 700 } }} />
                                </Box>
                            </TableCell>
                            <TableCell><TextField variant="standard" type="number" value={row.percentage} onChange={e => handleResultEdit(idx, "percentage", e.target.value)} sx={{ width: 45 }} InputProps={{ sx: { fontSize: 13, fontWeight: 800, color: "var(--color-primary)" } }} /></TableCell>
                            <TableCell>
                                {row._isNew && <IconButton size="small" onClick={() => handleRemoveRow(idx)} sx={{ color: "#ef4444" }}><CloseIcon fontSize="small" /></IconButton>}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Paper>
                )}
              </Box>

              <Box>
                <Typography sx={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)", mb: 1 }}>
                  Upload Proof Document <span style={{ color: "#ef4444" }}>*</span>
                </Typography>
                <input type="file" ref={fileRef} style={{ display: "none" }} accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e => setProofFile(e.target.files[0])} />
                <Box
                  onClick={() => fileRef.current?.click()}
                  sx={{
                    p: 3, borderRadius: "18px",
                    border: `2px dashed ${proofFile ? "#10b981" : "var(--border-color)"}`,
                    background: proofFile ? "rgba(16, 185, 129, 0.05)" : "var(--bg-glass)",
                    cursor: "pointer", textAlign: "center",
                    transition: "all 0.2s",
                    "&:hover": { borderColor: "var(--color-primary)", background: "var(--bg-accent-1)" },
                  }}
                >
                  <UploadIcon sx={{ color: proofFile ? "#10b981" : "var(--text-secondary)", fontSize: 32 }} />
                  <Typography fontSize={14} mt={1} fontWeight={700} color={proofFile ? "#10b981" : "var(--text-primary)"}>
                    {proofFile ? `✅ ${proofFile.name}` : "Click to upload PDF or image proof"}
                  </Typography>
                  <Typography fontSize={12} color="var(--text-secondary)" sx={{ opacity: 0.6 }}>Mandatory for resolution • Max 10MB</Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>

        {!success && selected && (
          <DialogActions sx={{ px: 4, pb: 4, pt: 1 }}>
            <Button 
              variant="text"
              onClick={() => setSelected(null)} 
              disabled={submitting} 
              sx={{ color: "var(--text-secondary)" }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleResolve}
              disabled={submitting || !proofFile}
            >
              {submitting ? <Loader size={20} color="inherit" /> : "✓ Submit & Resolve"}
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════
          REJECT DIALOG
         ═══════════════════════════════════════════════════════════════ */}
      <Dialog
        open={Boolean(rejectItem)}
        onClose={() => !rejecting && setRejectItem(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "28px",
            background: "var(--bg-panel)",
            backdropFilter: "blur(20px)",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-premium)",
          },
        }}
      >
        <DialogTitle sx={{ pb: 0 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography fontWeight={900} fontSize={20} color="#ef4444">
              ✕ Reject Discrepancy
            </Typography>
            <IconButton size="small" onClick={() => setRejectItem(null)} disabled={rejecting}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          {rejectDone ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <Typography fontSize={44}>❌</Typography>
              <Typography fontWeight={800} fontSize={20} mt={1} color="var(--text-primary)">Discrepancy Rejected</Typography>
            </Box>
          ) : rejectItem && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 2 }}>

              {/* Summary */}
              <Box
                sx={{
                  p: 2.5, borderRadius: "18px",
                  background: "var(--bg-glass)", border: "1px solid var(--border-color)",
                }}
              >
                <Typography fontSize={12} color="var(--text-secondary)" fontWeight={600} mb={0.5}>RAISED BY</Typography>
                <Typography fontWeight={800} fontSize={16} color="var(--text-primary)">{rejectItem.facultyName}</Typography>
                <Typography fontSize={13} color="var(--text-secondary)">
                  {rejectItem.facultyInstitutionId} · {rejectItem.academicYearId?.year}
                </Typography>
                <Divider sx={{ my: 1.5, opacity: 0.5 }} />
                <Typography fontSize={13} color="#ef4444" mt={1} fontWeight={600}>
                  Issue: <i style={{ fontWeight: 500, color: "var(--text-primary)" }}>"{rejectItem.note}"</i>
                </Typography>
              </Box>

              <Box>
                <Typography sx={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)", mb: 1 }}>
                  Reason for Rejection <span style={{ color: "#ef4444" }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Explain why this discrepancy cannot be resolved..."
                  value={rejectNote}
                  onChange={e => setRejectNote(e.target.value)}
                  sx={{ 
                    "& .MuiOutlinedInput-root": { 
                        borderRadius: "18px", 
                        background: "var(--bg-glass)",
                        fontSize: 14,
                        fontWeight: 500
                    } 
                  }}
                />
              </Box>
            </Box>
          )}
        </DialogContent>

        {!rejectDone && rejectItem && (
          <DialogActions sx={{ px: 4, pb: 4, pt: 1 }}>
            <Button
              variant="text"
              onClick={() => setRejectItem(null)}
              disabled={rejecting}
              sx={{ color: "var(--text-secondary)" }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleReject}
              disabled={rejecting || !rejectNote.trim()}
            >
              {rejecting ? <Loader size={20} color="inherit" /> : "✕ Confirm Reject"}
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </>
  );
}
