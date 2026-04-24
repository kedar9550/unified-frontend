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

// ── Status config ─────────────────────────────────────────────────────
const STATUS_CONFIG = {
  PENDING:  { label: "Pending",  color: "#e65100", bg: "#fff3e0", icon: <PendingIcon fontSize="small" /> },
  RESOLVED: { label: "Resolved", color: "#2e7d32", bg: "#e8f5e9", icon: <ResolvedIcon fontSize="small" /> },
  REJECTED: { label: "Rejected", color: "#b71c1c", bg: "#ffebee", icon: <RejectedIcon fontSize="small" /> },
};

const SECTION_LABEL = {
  TEACHING:   "📚 Teaching",
  PROCTORING: "👁️ Proctoring",
  FEEDBACK:   "💬 Feedback",
  OTHER:      "📎 Other",
};

export default function Discrepancies() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(false);

  // ── Resolve dialog state ───────────────────────────────────────────
  const [selected,      setSelected]      = useState(null);   // the discrepancy item
  const [resultData,    setResultData]    = useState([]);     // faculty result rows
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
      const res = await API.get("/api/discrepancies");
      setItems(res.data || []);
    } catch (err) {
      console.error("Failed to fetch discrepancies:", err);
    } finally {
      setLoading(false);
    }
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
      // Fetch faculty subject results for this emp + year + sem
      const res = await API.get("/api/faculty-subject-results", {
        params: {
          facultyId:    item.facultyInstitutionId,
          academicYear: item.academicYearId?._id,
          semester:     item.semesterTypeId?._id,
        },
      });
      // Make each row editable — clone the data
      const rows = (res.data || []).map(r => ({ ...r, _edited: false }));
      setResultData(rows);
    } catch (err) {
      console.error("Failed to fetch faculty results:", err);
    } finally {
      setResultLoading(false);
    }
  };

  // ── Handle inline edit of a result row ─────────────────────────────
  const handleResultEdit = (index, field, value) => {
    setResultData(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value, _edited: true };

      // Auto-recalculate pass %
      if (field === "appeared" || field === "passed") {
        const app = Number(field === "appeared" ? value : updated[index].appeared) || 0;
        const pas = Number(field === "passed"   ? value : updated[index].passed)   || 0;
        updated[index].passPercentage = app > 0 ? ((pas / app) * 100).toFixed(2) : "0.00";
      }
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
        branch:         "",
        appeared:       0,
        passed:         0,
        passPercentage: "0.00",
      },
    ]);
  };

  // ── Remove a new (unsaved) row ─────────────────────────────────────
  const handleRemoveRow = (index) => {
    setResultData(prev => prev.filter((_, i) => i !== index));
  };

  // ── Handle resolve submit ──────────────────────────────────────────
  const handleResolve = async () => {
    if (!proofFile) return alert("Please upload a proof document before submitting.");

    setSubmitting(true);
    try {
      // 1. Update existing edited rows
      const editedRows = resultData.filter(r => r._edited && !r._isNew);
      for (const row of editedRows) {
        await API.put(`/api/faculty-subject-results/${row._id}`, {
          appeared:       Number(row.appeared),
          passed:         Number(row.passed),
          passPercentage: Number(row.passPercentage),
          subjectName:    row.subjectName,
          subjectCode:    row.subjectCode,
          branch:         row.branch,
        });
      }

      // 2. Create new rows
      const newRows = resultData.filter(r => r._isNew && r.subjectName?.trim());
      for (const row of newRows) {
        await API.post("/api/faculty-subject-results", {
          facultyId:      selected.facultyInstitutionId,
          facultyName:    selected.facultyName,
          subjectName:    row.subjectName,
          subjectCode:    row.subjectCode,
          branch:         row.branch,
          academicYearId: selected.academicYearId?._id,
          semesterTypeId: selected.semesterTypeId?._id,
          appeared:       Number(row.appeared),
          passed:         Number(row.passed),
        });
      }

      // 3. Resolve the discrepancy with proof document
      const formData = new FormData();
      formData.append("proof", proofFile);
      formData.append("status", "RESOLVED");
      formData.append("resolutionNote", `Edited ${editedRows.length} record(s), added ${newRows.length} new record(s).`);

      await API.put(`/api/discrepancies/${selected._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess(true);
      setTimeout(() => {
        setSelected(null);
        fetchItems();
      }, 1500);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to resolve.");
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
    if (!rejectNote.trim()) return alert("Please provide a rejection note.");

    setRejecting(true);
    try {
      await API.put(`/api/discrepancies/${rejectItem._id}`, {
        status: "REJECTED",
        rejectionNote: rejectNote.trim(),
      });
      setRejectDone(true);
      setTimeout(() => {
        setRejectItem(null);
        fetchItems();
      }, 1500);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reject.");
    } finally {
      setRejecting(false);
    }
  };

  // ── Stat counts ────────────────────────────────────────────────────
  const counts = items.reduce((acc, i) => {
    acc[i.status] = (acc[i.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        title="Discrepancies"
        subtitle="Review and resolve faculty-raised discrepancies"
        breadcrumbs={["Home", "Exam Cell", "Discrepancies"]}
      />

      {/* ── STAT PILLS ────────────────────────────────────── */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <Box
            key={key}
            sx={{
              px: 3, py: 1.5,
              borderRadius: "16px",
              background: cfg.bg,
              border: `1.5px solid ${cfg.color}22`,
              display: "flex", alignItems: "center", gap: 1,
              minWidth: 130,
            }}
          >
            <Box sx={{ color: cfg.color }}>{cfg.icon}</Box>
            <Box>
              <Typography sx={{ fontSize: 20, fontWeight: 700, color: cfg.color, lineHeight: 1 }}>
                {counts[key] || 0}
              </Typography>
              <Typography sx={{ fontSize: 11, color: cfg.color, opacity: 0.8 }}>
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
          background: "linear-gradient(135deg,rgba(255,255,255,0.75),rgba(255,255,255,0.45))",
          backdropFilter: "blur(20px)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
          border: "1px solid rgba(255,255,255,0.3)",
          minHeight: 400,
        }}
      >
        <SectionHeader title="Discrepancy List" />

        {items.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8, color: "#aaa" }}>
            <Typography fontSize={40}>🎉</Typography>
            <Typography mt={1} fontWeight={600}>No discrepancies assigned to you.</Typography>
            <Typography fontSize={13}>All clear!</Typography>
          </Box>
        ) : (
          <Paper sx={{ borderRadius: "18px", overflow: "hidden", boxShadow: "none" }}>
            <Table sx={{ minWidth: 900 }}>
              <TableHead sx={{ background: "linear-gradient(135deg,#0b5299,#1c6ed5)" }}>
                <TableRow>
                  {["#", "Faculty", "Year / Sem", "Section", "Note", "Raised At", "Status", "Action"].map(col => (
                    <TableCell key={col} sx={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>
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
                      sx={{ background: i % 2 === 0 ? "#f8fbff" : "#fff", height: 70 }}
                    >
                      <TableCell sx={{ fontWeight: 600 }}>{i + 1}</TableCell>

                      {/* Faculty */}
                      <TableCell>
                        <Typography fontWeight={600} fontSize={14}>
                          {item.facultyName || item.raisedBy?.name || "—"}
                        </Typography>
                        <Typography fontSize={12} color="#888">
                          {item.facultyInstitutionId || item.raisedBy?.institutionId}
                        </Typography>
                      </TableCell>

                      {/* Year / Sem */}
                      <TableCell>
                        <Typography fontSize={13} fontWeight={500}>
                          {item.academicYearId?.year || "—"}
                        </Typography>
                        <Chip
                          label={item.semesterTypeId?.name || "—"}
                          size="small"
                          sx={{ fontSize: 11, height: 20, mt: 0.3 }}
                        />
                      </TableCell>

                      {/* Section */}
                      <TableCell>
                        <Box
                          sx={{
                            px: 1.5, py: 0.4, borderRadius: "10px",
                            background: "#eef3f9", fontSize: 12, fontWeight: 600,
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
                            sx={{
                              overflow: "hidden", textOverflow: "ellipsis",
                              display: "-webkit-box", WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            {item.note}
                          </Typography>
                        </Tooltip>
                      </TableCell>

                      {/* Raised At */}
                      <TableCell>
                        <Typography fontSize={12}>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </Typography>
                        <Typography fontSize={11} color="#888">
                          {new Date(item.createdAt).toLocaleTimeString()}
                        </Typography>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Chip
                          icon={cfg.icon}
                          label={cfg.label}
                          size="small"
                          sx={{
                            background: cfg.bg, color: cfg.color,
                            fontWeight: 600, fontSize: 12,
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

                      {/* Action */}
                      <TableCell>
                        {item.status === "PENDING" ? (
                          <Box sx={{ display: "flex", gap: 1, flexDirection: "column" }}>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => openResolve(item)}
                              sx={{
                                borderRadius: "10px", textTransform: "none",
                                fontSize: 11, px: 1.5, py: 0.4, minWidth: 0,
                                background: "linear-gradient(135deg,#0b5299,#1c6ed5)",
                              }}
                            >
                              ✓ Resolve
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => openReject(item)}
                              sx={{
                                borderRadius: "10px", textTransform: "none",
                                fontSize: 11, px: 1.5, py: 0.3, minWidth: 0,
                                color: "#b71c1c", borderColor: "#b71c1c",
                                "&:hover": { background: "#ffebee", borderColor: "#b71c1c" },
                              }}
                            >
                              ✕ Reject
                            </Button>
                          </Box>
                        ) : (
                          item.proofDocument && (
                            <Tooltip title="Download Proof">
                              <IconButton
                                size="small"
                                href={`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/uploads/discrepancies/${item.proofDocument}`}
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
          </Paper>
        )}
      </Box>

      {/* ═══════════════════════════════════════════════════════════════
          RESOLVE DIALOG — shows editable faculty result data
         ═══════════════════════════════════════════════════════════════ */}
      <Dialog
        open={Boolean(selected)}
        onClose={() => !submitting && setSelected(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "24px",
            background: "linear-gradient(135deg,rgba(255,255,255,0.97),rgba(240,245,255,0.97))",
            backdropFilter: "blur(20px)",
          },
        }}
      >
        <DialogTitle sx={{ pb: 0 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography fontWeight={700} fontSize={17}>
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
              <Typography fontWeight={600} mt={1}>Resolved Successfully!</Typography>
              <Typography fontSize={13} color="#888">Data updated and proof uploaded.</Typography>
            </Box>
          ) : (
            selected && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1.5 }}>

              {/* ── Faculty Info (read-only) ── */}
              <Box
                sx={{
                  p: 2, borderRadius: "14px",
                  background: "#f0f4fb", border: "1px solid #dde7f5",
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Box>
                    <Typography fontSize={12} color="#888">Raised by</Typography>
                    <Typography fontWeight={700} fontSize={16}>{selected.facultyName}</Typography>
                    <Typography fontSize={13} color="#666">
                      EMP ID: {selected.facultyInstitutionId}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography fontSize={12} color="#888">Period</Typography>
                    <Typography fontWeight={600} fontSize={14}>
                      {selected.academicYearId?.year} — {selected.semesterTypeId?.name}
                    </Typography>
                    <Box
                      sx={{
                        mt: 0.5, px: 1.5, py: 0.3, borderRadius: "8px",
                        background: "#eef3f9", fontSize: 12, fontWeight: 600,
                        display: "inline-block",
                      }}
                    >
                      {SECTION_LABEL[selected.section]}
                    </Box>
                  </Box>
                </Box>
                <Divider sx={{ my: 1.5 }} />
                <Typography fontSize={13} color="#d32f2f" fontWeight={500}>
                  📝 Issue: <span style={{ fontStyle: "italic", color: "#333" }}>"{selected.note}"</span>
                </Typography>
              </Box>

              {/* ── Faculty Result Data (editable table) ── */}
              <Box>
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#333", mb: 1 }}>
                  📊 Faculty Result Data
                  <span style={{ fontSize: 12, fontWeight: 400, color: "#888", marginLeft: 8 }}>
                    (Edit values below, then upload proof and submit)
                  </span>
                </Typography>

                {resultLoading ? null : resultData.length === 0 ? (
                  <Box
                    sx={{
                      p: 3, borderRadius: "14px", background: "#fff8e1",
                      border: "1px solid #ffe082", textAlign: "center",
                    }}
                  >
                    <Typography fontSize={13} color="#f57f17">
                      ⚠️ No result records found for this faculty / year / semester combination.
                    </Typography>
                  </Box>
                ) : (
                  <Paper sx={{ borderRadius: "14px", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
                    <Table size="small">
                      <TableHead sx={{ background: "#f0f4fb" }}>
                        <TableRow>
                          {["#", "Subject", "Code", "Branch", "Appeared", "Passed", "Pass %"].map(h => (
                            <TableCell key={h} sx={{ fontWeight: 600, fontSize: 12, color: "#444" }}>
                              {h}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {resultData.map((row, idx) => (
                          <TableRow
                            key={row._id || row._tempId}
                            sx={{
                              background: row._isNew ? "#fff8e1" : row._edited ? "#e3f2fd" : (idx % 2 === 0 ? "#fafcff" : "#fff"),
                              transition: "background 0.2s",
                            }}
                          >
                            <TableCell sx={{ fontWeight: 600, fontSize: 12, width: 30 }}>
                              {idx + 1}
                              {row._isNew && (
                                <Typography fontSize={9} color="#e65100" fontWeight={700}>NEW</Typography>
                              )}
                            </TableCell>

                            <TableCell>
                              <TextField
                                variant="standard"
                                value={row.subjectName || ""}
                                onChange={e => handleResultEdit(idx, "subjectName", e.target.value)}
                                InputProps={{ disableUnderline: !row._edited, sx: { fontSize: 13 } }}
                                placeholder={row._isNew ? "Subject Name" : ""}
                                fullWidth
                              />
                            </TableCell>

                            <TableCell>
                              <TextField
                                variant="standard"
                                value={row.subjectCode || ""}
                                onChange={e => handleResultEdit(idx, "subjectCode", e.target.value)}
                                InputProps={{ disableUnderline: !row._edited, sx: { fontSize: 13 } }}
                                placeholder={row._isNew ? "Code" : ""}
                                sx={{ width: 80 }}
                              />
                            </TableCell>

                            <TableCell>
                              <TextField
                                variant="standard"
                                value={row.branch || ""}
                                onChange={e => handleResultEdit(idx, "branch", e.target.value)}
                                InputProps={{ disableUnderline: !row._edited, sx: { fontSize: 13 } }}
                                placeholder={row._isNew ? "Branch" : ""}
                                sx={{ width: 80 }}
                              />
                            </TableCell>

                            <TableCell>
                              <TextField
                                variant="standard"
                                type="number"
                                value={row.appeared ?? ""}
                                onChange={e => handleResultEdit(idx, "appeared", e.target.value)}
                                InputProps={{ sx: { fontSize: 13, fontWeight: 600 } }}
                                sx={{ width: 70 }}
                              />
                            </TableCell>

                            <TableCell>
                              <TextField
                                variant="standard"
                                type="number"
                                value={row.passed ?? ""}
                                onChange={e => handleResultEdit(idx, "passed", e.target.value)}
                                InputProps={{ sx: { fontSize: 13, fontWeight: 600 } }}
                                sx={{ width: 70 }}
                              />
                            </TableCell>

                            <TableCell>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                <Typography
                                  fontSize={13}
                                  fontWeight={700}
                                  color={Number(row.passPercentage) >= 50 ? "#2e7d32" : "#e65100"}
                                >
                                  {row.passPercentage}%
                                </Typography>
                                {row._isNew && (
                                  <IconButton
                                    size="small"
                                    onClick={() => handleRemoveRow(idx)}
                                    sx={{ color: "#b71c1c", ml: 0.5, p: 0.3 }}
                                  >
                                    <CloseIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Paper>
                )}

                {/* ── Add Row Button ── */}
                {!resultLoading && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleAddRow}
                    sx={{
                      mt: 1.5, borderRadius: "10px", textTransform: "none",
                      fontSize: 12, borderStyle: "dashed",
                      color: "#1565c0", borderColor: "#90caf9",
                      "&:hover": { background: "#e3f2fd", borderColor: "#1565c0" },
                    }}
                  >
                    + Add New Row
                  </Button>
                )}
              </Box>

              {/* ── Proof Upload (required) ── */}
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#444", mb: 0.5 }}>
                  Upload Proof Document <span style={{ color: "#e53935" }}>*</span>
                </Typography>
                <input
                  type="file"
                  ref={fileRef}
                  style={{ display: "none" }}
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={e => setProofFile(e.target.files[0])}
                />
                <Box
                  onClick={() => fileRef.current?.click()}
                  sx={{
                    p: 2, borderRadius: "14px",
                    border: `2px dashed ${proofFile ? "#2e7d32" : "#b0bec5"}`,
                    background: proofFile ? "#e8f5e9" : "#f8fafd",
                    cursor: "pointer", textAlign: "center",
                    transition: "all 0.2s",
                    "&:hover": { borderColor: "#1c6ed5", background: "#f0f4fc" },
                  }}
                >
                  <UploadIcon sx={{ color: proofFile ? "#2e7d32" : "#90a4ae", fontSize: 32 }} />
                  <Typography fontSize={13} mt={0.5} color={proofFile ? "#2e7d32" : "#888"}>
                    {proofFile ? `✅ ${proofFile.name}` : "Click to upload PDF or image (required)"}
                  </Typography>
                  <Typography fontSize={11} color="#aaa">Max 10MB</Typography>
                </Box>
              </Box>
            </Box>
            )
          )}
        </DialogContent>

        {!success && selected && (
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button
              onClick={() => setSelected(null)}
              disabled={submitting}
              sx={{ borderRadius: "20px", textTransform: "none", color: "#666" }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleResolve}
              disabled={submitting || !proofFile}
              sx={{
                borderRadius: "20px", px: 4, textTransform: "none",
                fontWeight: 600,
                background: "linear-gradient(135deg,#0b5299,#1c6ed5)",
                boxShadow: "0 4px 15px rgba(11,82,153,0.3)",
              }}
            >
              ✓ Submit & Resolve
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
            borderRadius: "24px",
            background: "linear-gradient(135deg,rgba(255,255,255,0.97),rgba(255,240,240,0.97))",
            backdropFilter: "blur(20px)",
          },
        }}
      >
        <DialogTitle sx={{ pb: 0 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography fontWeight={700} fontSize={17} color="#b71c1c">
              ✕ Reject Discrepancy
            </Typography>
            <IconButton size="small" onClick={() => setRejectItem(null)} disabled={rejecting}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          {rejectDone ? (
            <Box sx={{ textAlign: "center", py: 5 }}>
              <Typography fontSize={44}>❌</Typography>
              <Typography fontWeight={600} mt={1}>Discrepancy Rejected</Typography>
            </Box>
          ) : rejectItem && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1.5 }}>

              {/* Summary */}
              <Box
                sx={{
                  p: 2, borderRadius: "14px",
                  background: "#fff5f5", border: "1px solid #fcdede",
                }}
              >
                <Typography fontSize={13} fontWeight={600} color="#444" mb={0.5}>
                  Raised by
                </Typography>
                <Typography fontWeight={700}>{rejectItem.facultyName}</Typography>
                <Typography fontSize={13} color="#666">
                  {rejectItem.facultyInstitutionId} · {rejectItem.academicYearId?.year} – {rejectItem.semesterTypeId?.name}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography fontSize={13} color="#333" fontStyle="italic">
                  "{rejectItem.note}"
                </Typography>
              </Box>

              {/* Rejection note */}
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#b71c1c", mb: 0.5 }}>
                  Rejection Reason <span style={{ color: "#e53935" }}>*</span>
                </Typography>
                <TextField
                  fullWidth multiline rows={3} size="small"
                  placeholder="Explain why this discrepancy is being rejected..."
                  value={rejectNote}
                  onChange={e => setRejectNote(e.target.value)}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "14px", background: "#fff8f8", fontSize: 14,
                      "& fieldset": { borderColor: "#f0c0c0" },
                      "&:hover fieldset": { borderColor: "#e57373" },
                      "&.Mui-focused fieldset": { borderColor: "#b71c1c" },
                    },
                  }}
                />
              </Box>
            </Box>
          )}
        </DialogContent>

        {!rejectDone && rejectItem && (
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button
              onClick={() => setRejectItem(null)}
              disabled={rejecting}
              sx={{ borderRadius: "20px", textTransform: "none", color: "#666" }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleReject}
              disabled={rejecting || !rejectNote.trim()}
              sx={{
                borderRadius: "20px", px: 4, textTransform: "none",
                fontWeight: 600,
                background: "linear-gradient(135deg,#c62828,#e53935)",
                boxShadow: "0 4px 15px rgba(183,28,28,0.3)",
                "&:hover": { background: "linear-gradient(135deg,#b71c1c,#c62828)" },
              }}
            >
              {rejecting ? <CircularProgress size={20} color="inherit" /> : "✕ Reject with Note"}
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </>
  );
}
