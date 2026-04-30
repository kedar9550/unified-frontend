import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  MenuItem,
  Select,
  TextField,
  Button,
  CircularProgress,
  IconButton,
  Chip,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Tooltip,
  Skeleton,
} from "@mui/material";
import {
  Close as CloseIcon,
  Flag as FlagIcon,
  History as HistoryIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { useState, useEffect } from "react";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const SECTIONS = [
  { value: "TEACHING",   label: "📚 Teaching" },
  { value: "PROCTORING", label: "👁️ Proctoring" },
  { value: "FEEDBACK",   label: "💬 Feedback" },
  { value: "OTHER",      label: "📎 Other" },
];

const SECTION_LABELS = {
  TEACHING:   "📚 Teaching",
  PROCTORING: "👁️ Proctoring",
  FEEDBACK:   "💬 Feedback",
  OTHER:      "📎 Other",
};

const ROLE_LABEL = {
  TEACHING:   "Exam Section",
  PROCTORING: "Exam Section",
  FEEDBACK:   "Feedback Coordinator",
  OTHER:      "Admin",
};

const STATUS_CONFIG = {
  PENDING: {
    label: "Pending",
    bg: "linear-gradient(135deg,#fff3cd,#ffeaa7)",
    color: "#856404",
    icon: "🕐",
  },
  RESOLVED: {
    label: "Resolved",
    bg: "linear-gradient(135deg,#d4edda,#c3e6cb)",
    color: "#155724",
    icon: "✅",
  },
  REJECTED: {
    label: "Rejected",
    bg: "linear-gradient(135deg,#f8d7da,#f5c6cb)",
    color: "#721c24",
    icon: "❌",
  },
};

export default function RaiseDiscrepancyModal({
  open,
  onClose,
  academicYears = [],
  semesterTypes = [],
  defaultYearId = "",
  defaultSemesterTypeId  = "",
}) {
  const { user } = useAuth();

  // ── Tab state ─────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState(0);

  // ── Previous discrepancies state ──────────────────────────────────
  const [discrepancies, setDiscrepancies] = useState([]);
  const [loadingDisc, setLoadingDisc]     = useState(false);

  // ── Semester types state ──────────────────────────────────────────
  const [localSemesterTypes, setLocalSemesterTypes] = useState(semesterTypes);

  useEffect(() => {
    if (open && (!semesterTypes || semesterTypes.length === 0)) {
      if (localSemesterTypes.length === 0) {
        API.get("/api/semester-types")
          .then((res) => setLocalSemesterTypes(res.data.data || []))
          .catch((err) => console.error("Error fetching semester types:", err));
      }
    } else {
      setLocalSemesterTypes(semesterTypes);
    }
  }, [open, semesterTypes?.length]);

  // ── Raise form state ──────────────────────────────────────────────
  const [yearId,   setYearId]   = useState(defaultYearId);
  const [semTypeId, setSemTypeId] = useState(defaultSemesterTypeId);
  const [section,  setSection]  = useState("TEACHING");
  const [note,     setNote]     = useState("");
  const [saving,   setSaving]   = useState(false);
  const [success,  setSuccess]  = useState(false);

  // ── Available Semester Numbers state ──────────────────────────────
  const [semesterNumbers, setSemesterNumbers] = useState([]);
  const [semesterNo,      setSemesterNo]      = useState("");
  const [loadingSems,    setLoadingSems]     = useState(false);

  // Sync defaults when modal opens
  useEffect(() => {
    if (open) {
      setYearId(defaultYearId);
      setSemTypeId(defaultSemesterTypeId);
      setSemesterNo("");
      setActiveTab(0);
      setSuccess(false);
      setNote("");
    }
  }, [open, defaultYearId, defaultSemesterTypeId]);

  // Fetch available semester numbers when yearId changes
  useEffect(() => {
    if (open && yearId && user?.institutionId) {
      fetchAvailableSemesters();
    }
  }, [open, yearId, user?.institutionId]);

  const fetchAvailableSemesters = async () => {
    setLoadingSems(true);
    try {
      const res = await API.get("/api/faculty-subject-results/available-semesters", {
        params: {
          facultyId: user?.institutionId,
          academicYear: yearId
        }
      });
      setSemesterNumbers(res.data || []);
    } catch (err) {
      console.error("Error fetching available semesters:", err);
    } finally {
      setLoadingSems(false);
    }
  };

  // Fetch previous discrepancies when modal opens or tab 0 is active
  useEffect(() => {
    if (open && activeTab === 0) {
      fetchDiscrepancies();
    }
  }, [open, activeTab]);

  const fetchDiscrepancies = async () => {
    setLoadingDisc(true);
    try {
      const res = await API.get("/api/discrepancies");
      setDiscrepancies(res.data || []);
    } catch (err) {
      console.error("Error fetching discrepancies:", err);
    } finally {
      setLoadingDisc(false);
    }
  };

  const handleSubmit = async () => {
    if (!yearId || !semTypeId || !note.trim()) return;
    setSaving(true);
    try {
      await API.post("/api/discrepancies", {
        academicYearId:       yearId,
        semesterTypeId:       semTypeId,
        semester:             semesterNo,
        section,
        note:                 note.trim(),
        facultyInstitutionId: user?.institutionId || "",
        facultyName:          user?.name           || "",
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setNote("");
        setActiveTab(0); // Switch to history tab to show the new entry
        fetchDiscrepancies();
      }, 1500);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to raise discrepancy.");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Dialog
      open={open}
      onClose={() => onClose(false)}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "24px",
          background: "linear-gradient(135deg,rgba(255,255,255,0.97),rgba(240,245,255,0.97))",
          backdropFilter: "blur(20px)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.15)",
          minHeight: 500,
        },
      }}
    >
      {/* ── HEADER ─────────────────────────────────────── */}
      <DialogTitle sx={{ pb: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: "12px",
                background: "linear-gradient(135deg,#e53935,#ff7043)",
                display: "flex",
              }}
            >
              <FlagIcon sx={{ color: "#fff", fontSize: 20 }} />
            </Box>
            <Box>
              <Typography fontWeight={700} fontSize={17} color="#1a1a2e">
                Discrepancies
              </Typography>
              <Typography fontSize={12} color="#888">
                View status of previous discrepancies or raise a new one
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => onClose(false)} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* ── TABS ─────────────────────────────────────── */}
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            mt: 2,
            "& .MuiTabs-indicator": {
              background: "linear-gradient(135deg,#0b5299,#1c6ed5)",
              height: 3,
              borderRadius: "3px",
            },
          }}
        >
          <Tab
            icon={<HistoryIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Previous Discrepancies"
            sx={tabSx}
          />
          <Tab
            icon={<AddIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Raise New"
            sx={tabSx}
          />
        </Tabs>
      </DialogTitle>

      <DialogContent sx={{ pt: 2, pb: 1 }}>
        {/* ═══════════════════════════════════════════════════════════
            TAB 0 — PREVIOUS DISCREPANCIES
           ═══════════════════════════════════════════════════════════ */}
        {activeTab === 0 && (
          <Box sx={{ mt: 1 }}>
            {loadingDisc ? (
              /* ── Loading skeleton ── */
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {[1, 2, 3].map((n) => (
                  <Skeleton
                    key={n}
                    variant="rounded"
                    height={56}
                    sx={{ borderRadius: "12px" }}
                  />
                ))}
              </Box>
            ) : discrepancies.length === 0 ? (
              /* ── Empty state ── */
              <Box
                sx={{
                  textAlign: "center",
                  py: 8,
                  color: "#aaa",
                }}
              >
                <Typography fontSize={40} mb={1}>📭</Typography>
                <Typography fontWeight={600} fontSize={16} color="#666">
                  No discrepancies raised yet
                </Typography>
                <Typography fontSize={13} color="#aaa" mt={0.5}>
                  Switch to the <strong>"Raise New"</strong> tab to flag an issue.
                </Typography>
              </Box>
            ) : (
              /* ── Discrepancy list table ── */
              <Paper
                sx={{
                  borderRadius: "16px",
                  overflow: "hidden",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                }}
              >
                <Box sx={{ overflowX: "auto" }}>
                  <Table size="small">
                    <TableHead
                      sx={{
                        background: "linear-gradient(135deg, #2a5298, #4facfe)",
                      }}
                    >
                      <TableRow>
                        {[
                          "#",
                          "Section",
                          "Year / Sem",
                          "Issue",
                          "Status",
                          "Raised On",
                          "Response",
                        ].map((col) => (
                          <TableCell
                            key={col}
                            sx={{
                              color: "#fff",
                              fontWeight: 700,
                              fontSize: 12,
                              py: 1.5,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {col}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {discrepancies.map((d, i) => {
                        const status = STATUS_CONFIG[d.status] || STATUS_CONFIG.PENDING;
                        const responseNote =
                          d.status === "RESOLVED"
                            ? d.resolutionNote
                            : d.status === "REJECTED"
                              ? d.rejectionNote
                              : null;

                        return (
                          <TableRow
                            key={d._id}
                            sx={{
                              background: i % 2 === 0 ? "#fafbff" : "#fff",
                              transition: "background 0.2s",
                              "&:hover": { background: "#f0f4ff" },
                            }}
                          >
                            {/* # */}
                            <TableCell sx={{ fontWeight: 600, fontSize: 13, color: "#555" }}>
                              {i + 1}
                            </TableCell>

                            {/* Section */}
                            <TableCell sx={{ fontSize: 13 }}>
                              {SECTION_LABELS[d.section] || d.section}
                            </TableCell>

                            {/* Year / Sem */}
                            <TableCell sx={{ fontSize: 12, color: "#555", whiteSpace: "nowrap" }}>
                              <Box>
                                {d.academicYearId?.year || "—"}
                              </Box>
                              <Box sx={{ fontSize: 11, color: "#555", fontWeight: 600 }}>
                                {d.semester ? `Sem ${d.semester}` : d.semesterTypeId?.name || "—"}
                              </Box>
                            </TableCell>

                            {/* Issue note — truncated */}
                            <TableCell sx={{ maxWidth: 200 }}>
                              <Tooltip title={d.note} arrow placement="top">
                                <Typography
                                  noWrap
                                  fontSize={13}
                                  sx={{ maxWidth: 200 }}
                                >
                                  {d.note}
                                </Typography>
                              </Tooltip>
                            </TableCell>

                            {/* Status badge */}
                            <TableCell>
                              <Chip
                                label={`${status.icon} ${status.label}`}
                                size="small"
                                sx={{
                                  background: status.bg,
                                  color: status.color,
                                  fontWeight: 700,
                                  fontSize: 11,
                                  height: 26,
                                  borderRadius: "8px",
                                }}
                              />
                            </TableCell>

                            {/* Raised On */}
                            <TableCell sx={{ fontSize: 12, color: "#666", whiteSpace: "nowrap" }}>
                              {formatDate(d.createdAt)}
                            </TableCell>

                            {/* Response note */}
                            <TableCell sx={{ maxWidth: 180 }}>
                              {responseNote ? (
                                <Tooltip title={responseNote} arrow placement="top">
                                  <Typography
                                    noWrap
                                    fontSize={12}
                                    sx={{
                                      maxWidth: 180,
                                      color: d.status === "REJECTED" ? "#c62828" : "#2e7d32",
                                      fontStyle: "italic",
                                    }}
                                  >
                                    {responseNote}
                                  </Typography>
                                </Tooltip>
                              ) : (
                                <Typography fontSize={12} color="#bbb">
                                  —
                                </Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Box>

                {/* Count footer */}
                <Box
                  sx={{
                    px: 2,
                    py: 1.2,
                    borderTop: "1px solid #eef1f8",
                    display: "flex",
                    gap: 2,
                    justifyContent: "flex-end",
                    flexWrap: "wrap",
                  }}
                >
                  {["PENDING", "RESOLVED", "REJECTED"].map((s) => {
                    const cfg = STATUS_CONFIG[s];
                    const count = discrepancies.filter((d) => d.status === s).length;
                    if (count === 0) return null;
                    return (
                      <Typography key={s} fontSize={12} fontWeight={600} color={cfg.color}>
                        {cfg.icon} {count} {cfg.label}
                      </Typography>
                    );
                  })}
                </Box>
              </Paper>
            )}
          </Box>
        )}

        {/* ═══════════════════════════════════════════════════════════
            TAB 1 — RAISE NEW DISCREPANCY
           ═══════════════════════════════════════════════════════════ */}
        {activeTab === 1 && (
          <Box sx={{ mt: 1 }}>
            {success ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography fontSize={40}>✅</Typography>
                <Typography fontWeight={600} mt={1}>
                  Discrepancy raised successfully!
                </Typography>
                <Typography fontSize={13} color="#888" mt={0.5}>
                  Routed to <strong>{ROLE_LABEL[section]}</strong> for review.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>

                {/* ── Academic Year ── */}
                <Box>
                  <Typography sx={label}>Academic Year</Typography>
                  <Select
                    fullWidth
                    size="small"
                    value={yearId}
                    onChange={e => setYearId(e.target.value)}
                    sx={selectSx}
                  >
                    {academicYears.map(y => (
                      <MenuItem key={y._id} value={y._id}>{y.year}</MenuItem>
                    ))}
                  </Select>
                </Box>

                {/* ── Semester Number ── */}
                <Box>
                  <Typography sx={label}>Semester</Typography>
                  <Select
                    fullWidth
                    size="small"
                    value={semesterNo}
                    onChange={e => {
                      const val = e.target.value;
                      setSemesterNo(val);
                      // Auto-select ODD/EVEN type based on number
                      if (val) {
                        const typeName = Number(val) % 2 === 0 ? "EVEN" : "ODD";
                        const type = localSemesterTypes.find(t => t.name === typeName);
                        if (type) setSemTypeId(type._id);
                      }
                    }}
                    displayEmpty
                    sx={selectSx}
                    disabled={loadingSems}
                  >
                    <MenuItem value="" disabled>Select Semester</MenuItem>
                    {semesterNumbers.map(n => (
                      <MenuItem key={n} value={n}>Semester {n}</MenuItem>
                    ))}
                    {semesterNumbers.length === 0 && !loadingSems && (
                      <MenuItem value="" disabled>No semesters found in data</MenuItem>
                    )}
                  </Select>
                  {loadingSems && <CircularProgress size={16} sx={{ mt: 1 }} />}
                </Box>

                {/* ── Section ── */}
                <Box>
                  <Typography sx={label}>Section</Typography>
                  <Select
                    fullWidth
                    size="small"
                    value={section}
                    onChange={e => setSection(e.target.value)}
                    sx={selectSx}
                  >
                    {SECTIONS.map(s => (
                      <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                    ))}
                  </Select>
                  <Box sx={{ mt: 1 }}>
                    <Typography fontSize={12} color="#888">
                      Will be routed to:{" "}
                      <Chip
                        label={ROLE_LABEL[section]}
                        size="small"
                        sx={{
                          fontSize: 11,
                          height: 20,
                          background: "linear-gradient(135deg,#0b5299,#1c6ed5)",
                          color: "#fff",
                          fontWeight: 600,
                        }}
                      />
                    </Typography>
                  </Box>
                </Box>

                {/* ── Note ── */}
                <Box>
                  <Typography sx={label}>Describe the Issue</Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    size="small"
                    placeholder="Explain what is incorrect and what it should be..."
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "14px",
                        background: "#f4f7fc",
                        fontSize: 14,
                      },
                    }}
                  />
                  <Typography fontSize={11} color="#aaa" mt={0.5} textAlign="right">
                    {note.length} characters
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      {/* ── ACTIONS (only for Raise New tab, when not in success state) ── */}
      {activeTab === 1 && !success && (
        <DialogActions sx={{ px: 3, pb: 3, pt: 0 }}>
          <Button
            onClick={() => onClose(false)}
            sx={{ borderRadius: "20px", textTransform: "none", color: "#666" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving || !note.trim() || !yearId || !semesterNo}
            sx={{
              borderRadius: "20px",
              px: 4,
              textTransform: "none",
              fontWeight: 600,
              background: "linear-gradient(135deg,#e53935,#ff7043)",
              boxShadow: "0 4px 15px rgba(229,57,53,0.3)",
              "&:hover": { background: "linear-gradient(135deg,#c62828,#e64a19)" },
            }}
          >
            Submit Discrepancy
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}

// ── Styles helpers ──────────────────────────────────────────────────
const label = { fontSize: 13, fontWeight: 600, color: "#444", mb: 0.5 };

const selectSx = {
  borderRadius: "14px",
  background: "#f4f7fc",
  fontSize: 14,
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#dde3ef" },
};

const tabSx = {
  textTransform: "none",
  fontWeight: 600,
  fontSize: 14,
  minHeight: 44,
  gap: 0.5,
};
