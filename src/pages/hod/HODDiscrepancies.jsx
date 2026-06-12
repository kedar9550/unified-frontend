import Loader from "../../components/common/Loader";
import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
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
import { toast } from "sonner";

// ── Status config ─────────────────────────────────────────────────────
const STATUS_CONFIG = {
  PENDING: { label: "Pending", color: "#F59E0B", bg: "rgba(245, 158, 11, 0.1)", icon: <PendingIcon fontSize="small" /> },
  RESOLVED: { label: "Resolved", color: "#10B981", bg: "rgba(16, 185, 129, 0.1)", icon: <ResolvedIcon fontSize="small" /> },
  REJECTED: { label: "Rejected", color: "#EF4444", bg: "rgba(239, 68, 68, 0.1)", icon: <RejectedIcon fontSize="small" /> },
};

const SECTION_LABEL = {
  PROCTORING: "👁️ Proctoring",
};

export default function HODDiscrepancies() {
  const { user, activeRole } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

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
      
      // Filter discrepancies for HOD: only PROCTORING where subtype is ASSIGNED_COUNT
      const filtered = (res.data || []).filter(item => 
        item.section === "PROCTORING" && 
        item.proctoringType === "ASSIGNED_COUNT"
      );
      setItems(filtered);
    } catch (err) {
      console.error("Failed to fetch discrepancies:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // ── Open resolve dialog & fetch proctor mapping data ────────────────
  const openResolve = async (item) => {
    setSelected(item);
    setProofFile(null);
    setSuccess(false);
    setResultData([]);
    setResultLoading(true);

    try {
      // Fetch proctor mappings for this proctor + year + sem
      const res = await API.get("/api/procter-maping", {
        params: {
          proctorId: item.facultyInstitutionId,
          academicYearId: item.academicYearId?._id,
          semesterTypeId: item.semesterTypeId?._id,
        },
      });
      setResultData(res.data || []);
    } catch (err) {
      console.error("Failed to fetch resolution data:", err);
    } finally {
      setResultLoading(false);
    }
  };

  // ── Handle resolve submit ──────────────────────────────────────────
  const handleResolve = async () => {
    if (!proofFile) return toast.warning("Please upload a proof document before submitting");

    setSubmitting(true);
    try {
      // Resolve the discrepancy with proof document
      const formData = new FormData();
      formData.append("proof", proofFile);
      formData.append("status", "RESOLVED");
      formData.append("resolutionNote", "Proctoring assigned count verified by HOD.");

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
    if (!rejectNote.trim()) return toast.warning("Please provide a rejection note");

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

  // ── Stat counts ────────────────────────────────────────────────────
  const counts = items.reduce((acc, i) => {
    acc[i.status] = (acc[i.status] || 0) + 1;
    return acc;
  }, {});

  const formatDateTime = (dateStr) => {
    if (!dateStr) return { date: "—", time: "" };
    const d = new Date(dateStr);
    const date = d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const time = d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return { date, time };
  };

  return (
    <>
      <PageHeader
        title="Department Discrepancies"
        subtitle="Review and resolve proctoring discrepancies"
        breadcrumbs={["Home", "HOD", "Discrepancies"]}
      />

      {/* ── STAT PILLS ────────────────────── */}
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
              px: 3, py: 2.5,
              borderRadius: "20px",
              background: "var(--bg-panel)",
              border: `1.5px solid var(--border-color)`,
              display: "flex",
              alignItems: "center",
              gap: 2.5,
              boxShadow: `var(--shadow-premium)`,
              transition: "transform 0.2s",
              "&:hover": { transform: "translateY(-4px)" }
            }}
          >
            <Box sx={{ color: cfg.color, width: 48, height: 48, borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", background: cfg.bg }}>
              {cfg.icon}
            </Box>
            <Box>
              <Typography sx={{ fontSize: 32, fontWeight: 900, color: "var(--text-primary)", lineHeight: 1 }}>
                {counts[key] || 0}
              </Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: cfg.color, textTransform: "uppercase" }}>
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
          boxShadow: "var(--shadow-premium)",
          border: "1px solid var(--border-color)",
          minHeight: 400,
        }}
      >
        <SectionHeader title="Discrepancy List" />

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <Loader />
          </Box>
        ) : items.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 10, color: "var(--text-secondary)" }}>
            <Typography fontSize={40}>🎉</Typography>
            <Typography mt={1} fontWeight={700}>No discrepancies found.</Typography>
          </Box>
        ) : (
          <Paper sx={{ borderRadius: "18px", overflow: "hidden", background: "transparent", border: "1px solid var(--border-color)" }}>
            <Table>
              <TableHead sx={{ background: "var(--gradient-primary)" }}>
                <TableRow>
                  {["#", "Faculty", "Department", "Year / Sem", "Raised On", "Note", "Status", "Action"].map(col => (
                    <TableCell key={col} sx={{ color: "#fff", fontWeight: 700 }}>{col}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item, i) => {
                  const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDING;
                  return (
                    <TableRow key={item._id} sx={{ "&:hover": { background: "var(--bg-accent-2)" } }}>
                      <TableCell sx={{ fontWeight: 600 }}>{i + 1}</TableCell>
                      <TableCell>
                        <Typography fontWeight={700}>{item.facultyName || "—"}</Typography>
                        <Typography fontSize={12} color="text.secondary">{item.facultyInstitutionId}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography fontSize={13} fontWeight={600}>
                          {item.studentDepartmentId?.name || "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography fontSize={13}>{item.academicYearId?.year}</Typography>
                        <Chip label={item.semesterTypeId?.name} size="small" sx={{ fontSize: 10, height: 20 }} />
                      </TableCell>
                      <TableCell>
                        <Typography fontSize={13} fontWeight={700}>
                          {formatDateTime(item.createdAt).date}
                        </Typography>
                        <Typography fontSize={11} color="text.secondary">
                          {formatDateTime(item.createdAt).time}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 250 }}>
                        <Typography fontSize={13} noWrap>{item.note}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={cfg.label} size="small" sx={{ background: cfg.bg, color: cfg.color, fontWeight: 700 }} />
                      </TableCell>
                      <TableCell>
                        {item.status === "PENDING" ? (
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <Button size="small" variant="contained" onClick={() => openResolve(item)}>Resolve</Button>
                            <Button size="small" variant="outlined" color="error" onClick={() => openReject(item)}>Reject</Button>
                          </Box>
                        ) : (
                          item.proofDocument && (
                            <IconButton href={`${import.meta.env.VITE_BACKEND_URL}/uploads/discrepancies/${item.proofDocument}`} target="_blank">
                              <DownloadIcon />
                            </IconButton>
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

      {/* Resolve Dialog */}
      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: "24px" } }}>
        <DialogTitle>Resolve Discrepancy</DialogTitle>
        <DialogContent>
          {success ? (
            <Box sx={{ textAlign: "center", py: 5 }}>
              <Typography fontSize={44}>✅</Typography>
              <Typography fontWeight={700}>Resolved Successfully!</Typography>
            </Box>
          ) : selected && (
            <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 3 }}>
              <Box sx={{ p: 2, background: "#f8f9fa", borderRadius: "12px" }}>
                <Typography fontSize={13} color="text.secondary">Issue Reported:</Typography>
                <Typography fontWeight={600}>{selected.note}</Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                  Assigned Student List:
                </Typography>
                <Paper variant="outlined" sx={{ borderRadius: "12px", overflow: "hidden" }}>
                  <Table size="small">
                    <TableHead sx={{ background: "#f0f2f5" }}>
                      <TableRow>
                        {["#", "Roll No", "Student Name", "Semester"].map(h => (
                          <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {resultData.map((row, idx) => (
                        <TableRow key={row._id}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell>{row.studentId}</TableCell>
                          <TableCell>{row.studentName}</TableCell>
                          <TableCell>{row.semester}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Upload Proof Document (Required):</Typography>
                <input type="file" ref={fileRef} style={{ display: "none" }} onChange={e => setProofFile(e.target.files[0])} />
                <Button variant="outlined" fullWidth onClick={() => fileRef.current?.click()} sx={{ height: 60, borderStyle: "dashed" }}>
                  {proofFile ? `Selected: ${proofFile.name}` : "Click to select proof document"}
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        {!success && (
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setSelected(null)}>Cancel</Button>
            <Button variant="contained" disabled={!proofFile || submitting} onClick={handleResolve}>
              {submitting ? <Loader size={20} /> : "Resolve Discrepancy"}
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={Boolean(rejectItem)} onClose={() => setRejectItem(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "24px" } }}>
        <DialogTitle>Reject Discrepancy</DialogTitle>
        <DialogContent>
          {rejectDone ? (
            <Box sx={{ textAlign: "center", py: 3 }}>
              <Typography fontSize={44}>❌</Typography>
              <Typography fontWeight={700}>Rejected</Typography>
            </Box>
          ) : (
            <Box sx={{ pt: 1 }}>
              <TextField fullWidth multiline rows={3} label="Rejection Note" value={rejectNote} onChange={e => setRejectNote(e.target.value)} placeholder="Explain why this is being rejected..." />
            </Box>
          )}
        </DialogContent>
        {!rejectDone && (
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setRejectItem(null)}>Cancel</Button>
            <Button variant="contained" color="error" disabled={!rejectNote.trim() || rejecting} onClick={handleReject}>
              Confirm Reject
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </>
  );
}
