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
  TEACHING: "Course Average Pass Percentage",
  PROCTORING: "Proctoring Students' Average Pass Percentage",
  CO_ATTAINMENT: "CO Attainment",
  OTHER: "Other",
};

export default function Discrepancies() {
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

      // Filter for Exam Section: TEACHING, CO_ATTAINMENT, and OTHER
      const filtered = (res.data || []).filter(item =>
        item.section === "TEACHING" ||
        item.section === "CO_ATTAINMENT" ||
        item.section === "OTHER"
      );
      setItems(filtered);
    } catch (err) {
      console.error("Failed to fetch discrepancies:", err);
    } finally {
      setLoading(false);
    }
  }, []);

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
      let rows = [];
      const STALE_BRANCH_MAP = {
        "computer science & engineering": "cse",
        "electrical & electronics engineering": "eee",
        "electronics & communication engineering": "ece",
        "mechanical engineering": "me",
        "agricultural engineering": "ag.e",
        "b.sc": "b.sc",
        "cse": "cse",
        "eee": "eee",
        "ece": "ece",
        "me": "me",
        "ag.e": "ag.e"
      };
      const STALE_PROGRAM_MAP = {
        "6a23a992a010811886476e37": "b.tech",
        "6a26416ebced1820c520ccd4": "b.sc",
        "6a23a992a010811886476e38": "m.tech"
      };

      if (item.section === "PROCTORING") {
        const res = await API.get("/api/faculty-proctoring/all", {
          params: {
            facultyId: item.facultyInstitutionId,
            academicYearId: item.academicYearId?._id,
          },
        });
        rows = (res.data?.data || []).map(r => {
          let matchedBranchId = r.branchId?._id || r.branchId || "";
          let br = null;
          if (r.branch) {
            const normVal = r.branch.toLowerCase().trim();
            const targetCode = STALE_BRANCH_MAP[normVal] || normVal;
            br = branches.find(b => b.code.toLowerCase() === targetCode || b.name.toLowerCase() === targetCode || b.name.toLowerCase().includes(targetCode) || targetCode.includes(b.name.toLowerCase()));
            if (br) matchedBranchId = br._id;
          }

          let matchedProgramId = r.programId?._id || r.programId || "";
          const progIdStr = String(matchedProgramId);
          if (STALE_PROGRAM_MAP[progIdStr]) {
            const targetCode = STALE_PROGRAM_MAP[progIdStr];
            const prog = programs.find(p => p.code.toLowerCase() === targetCode || p.name.toLowerCase() === targetCode);
            if (prog) matchedProgramId = prog._id;
          } else if (r.programme) {
            const prog = programs.find(p => p.name.toLowerCase() === r.programme.toLowerCase() || p.code.toLowerCase() === r.programme.toLowerCase());
            if (prog) matchedProgramId = prog._id;
          }

          if (!matchedProgramId && br && br.programIds && br.programIds.length > 0) {
            matchedProgramId = br.programIds[0];
          }

          return {
            ...r,
            _edited: false,
            programId: matchedProgramId,
            branchId: matchedBranchId
          };
        });
      } else {
        // Fetch faculty subject results for this emp + year
        const res = await API.get("/api/faculty-subject-results", {
          params: {
            facultyId: item.facultyInstitutionId,
            academicYear: item.academicYearId?._id,
          },
        });
        rows = (res.data || []).map(r => {
          let matchedBranchId = r.branchId?._id || r.branchId || "";
          let br = null;
          if (r.branch) {
            const normVal = r.branch.toLowerCase().trim();
            const targetCode = STALE_BRANCH_MAP[normVal] || normVal;
            br = branches.find(b => b.code.toLowerCase() === targetCode || b.name.toLowerCase() === targetCode || b.name.toLowerCase().includes(targetCode) || targetCode.includes(b.name.toLowerCase()));
            if (br) matchedBranchId = br._id;
          }

          let matchedProgramId = r.programId?._id || r.programId || "";
          const progIdStr = String(matchedProgramId);
          if (STALE_PROGRAM_MAP[progIdStr]) {
            const targetCode = STALE_PROGRAM_MAP[progIdStr];
            const prog = programs.find(p => p.code.toLowerCase() === targetCode || p.name.toLowerCase() === targetCode);
            if (prog) matchedProgramId = prog._id;
          } else if (r.programme) {
            const prog = programs.find(p => p.name.toLowerCase() === r.programme.toLowerCase() || p.code.toLowerCase() === r.programme.toLowerCase());
            if (prog) matchedProgramId = prog._id;
          }

          if (!matchedProgramId && br && br.programIds && br.programIds.length > 0) {
            matchedProgramId = br.programIds[0];
          }

          return {
            ...r,
            _edited: false,
            programId: matchedProgramId,
            branchId: matchedBranchId
          };
        });
      }
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

      // Auto-recalculate pass % for TEACHING
      if (field === "appeared" || field === "passed") {
        const app = Number(field === "appeared" ? value : updated[index].appeared) || 0;
        const pas = Number(field === "passed" ? value : updated[index].passed) || 0;
        updated[index].passPercentage = app > 0 ? ((pas / app) * 100).toFixed(2) : "0.00";
      }

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
    if (selected?.section === "PROCTORING") {
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
    } else {
      setResultData(prev => [
        ...prev,
        {
          _tempId: `new-${Date.now()}`,
          _isNew: true,
          _edited: true,
          courseName: "",
          subjectName: "",
          courseCode: "",
          subjectCode: "",
          courseType: "THEORY",
          programId: "",
          branchId: "",
          branch: "",
          semesterNumber: "",
          section: "",
          appeared: 0,
          passed: 0,
          passPercentage: "0.00",
          noOfCos: 0,
          noOfCosAttained: 0,
        },
      ]);
    }
  };

  // ── Remove a new (unsaved) row ─────────────────────────────────────
  const handleRemoveRow = (index) => {
    setResultData(prev => prev.filter((_, i) => i !== index));
  };

  // ── Handle resolve submit ──────────────────────────────────────────
  const handleResolve = async () => {
    if (proofFile && proofFile.size > 500 * 1024) {
      toast.error("Proof document must be under 500kb");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Update existing edited rows
      const editedRows = resultData.filter(r => r._edited && !r._isNew);
      for (const row of editedRows) {
        const branchName = branches.find(b => b._id === row.branchId)?.name || row.branch || "";
        if (selected.section === "PROCTORING") {
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
        } else {
          // Both TEACHING and CO_ATTAINMENT
          await API.put(`/api/faculty-subject-results/${row._id}`, {
            courseName: row.courseName || row.subjectName,
            courseCode: row.courseCode || row.subjectCode,
            courseType: row.courseType,
            programId: row.programId,
            branchId: row.branchId,
            branch: branchName,
            semesterNumber: row.semesterNumber,
            section: row.section,
            appeared: Number(row.appeared),
            passed: Number(row.passed),
            passPercentage: Number(row.passPercentage),
            noOfCos: Number(row.noOfCos),
            noOfCosAttained: Number(row.noOfCosAttained),
          });
        }
      }

      // 2. Create new rows
      const newRows = resultData.filter(r => r._isNew && (selected.section === "PROCTORING" || r.subjectName?.trim() || r.courseName?.trim()));
      for (const row of newRows) {
        const branchName = branches.find(b => b._id === row.branchId)?.name || row.branch || "";
        if (selected.section === "PROCTORING") {
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
        } else {
          // Both TEACHING and CO_ATTAINMENT
          await API.post("/api/faculty-subject-results", {
            facultyId: selected.facultyInstitutionId,
            facultyName: selected.facultyName,
            courseName: row.courseName || row.subjectName,
            courseCode: row.courseCode || row.subjectCode,
            courseType: row.courseType,
            programId: row.programId,
            branchId: row.branchId,
            branch: branchName,
            semesterNumber: row.semesterNumber,
            section: row.section,
            academicYearId: selected.academicYearId?._id,
            semesterTypeId: selected.semesterTypeId?._id,
            appeared: Number(row.appeared),
            passed: Number(row.passed),
            noOfCos: Number(row.noOfCos),
            noOfCosAttained: Number(row.noOfCosAttained),
          });
        }
      }

      // 3. Resolve the discrepancy with proof document
      const formData = new FormData();
      if (proofFile) formData.append("proof", proofFile);
      formData.append("status", "RESOLVED");
      formData.append("resolutionNote", `Edited ${editedRows.length} record(s), added ${newRows.length} new record(s).`);

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

  // ── Stat counts ────────────────────────────────────────────────────
  const counts = items.reduce((acc, i) => {
    acc[i.status] = (acc[i.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        title="Discrepancies"
        subtitle="Review and resolve faculty-raised discrepancies" />

      {/* ── STAT PILLS (Responsive Grid) ────────────────────── */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(3, 1fr)"
          },
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
        <SectionHeader title="Discrepancy List" />

        {items.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 10, color: "var(--text-secondary)" }}>
            <Typography fontSize={40}>🎉</Typography>
            <Typography mt={1} fontWeight={700} sx={{ color: "var(--text-primary)" }}>No discrepancies assigned to you.</Typography>
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
              <Table sx={{ minWidth: { xs: 800, md: 1000 } }}>
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

                        {/* Year */}
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
                              sx={{
                                color: "var(--text-primary)",
                                fontWeight: 500,
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
                          <Typography fontSize={12} sx={{ color: "var(--text-primary)", fontWeight: 600 }}>
                            {new Date(item.createdAt).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                          </Typography>
                          <Typography fontSize={11} sx={{ color: "var(--text-secondary)", opacity: 0.8 }}>
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

      {/* ═══════════════════════════════════════════════════════════════
          RESOLVE DIALOG — shows editable faculty result data
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
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-premium)",
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
              <Typography fontSize={13} color="#888">Data updated.</Typography>
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
                {selected.section !== "OTHER" && (
                  <Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                      <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#333" }}>
                        📊 Faculty Result Data
                        <span style={{ fontSize: 12, fontWeight: 400, color: "#888", marginLeft: 8 }}>
                          (Edit values below, then upload proof and submit)
                        </span>
                      </Typography>
                      {!resultLoading && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={handleAddRow}
                        >
                          + Add New Row
                        </Button>
                      )}
                    </Box>

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
                      <Paper sx={{ borderRadius: "14px", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", overflowX: "auto" }}>
                        <Table size="small">
                          <TableHead sx={{ background: "#f0f4fb" }}>
                            <TableRow>
                              {selected.section === "PROCTORING" ? (
                                ["#", "Program", "Branch", "Sem", "Yr", "Sec", "Total Allotted", "Eligible (A)", "Passed (B)", "Pass %", ""].map(h => (
                                  <TableCell key={h} sx={{ fontWeight: 600, fontSize: 12, color: "#444" }}>{h}</TableCell>
                                ))
                              ) : selected.section === "CO_ATTAINMENT" ? (
                                ["#", "Subject", "Code", "Type", "Prog", "Branch", "Sem", "Sec", "No. of COs", "COs Attained", "Attainment %", ""].map(h => (
                                  <TableCell key={h} sx={{ fontWeight: 600, fontSize: 12, color: "#444" }}>{h}</TableCell>
                                ))
                              ) : (
                                ["#", "Subject", "Code", "Type", "Prog", "Branch", "Sem", "Sec", "Appeared", "Passed", "Pass %", ""].map(h => (
                                  <TableCell key={h} sx={{ fontWeight: 600, fontSize: 12, color: "#444" }}>{h}</TableCell>
                                ))
                              )}
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

                                {selected.section === "PROCTORING" ? (
                                  <>
                                    <TableCell>
                                      <Select
                                        variant="standard"
                                        value={row.programId || ""}
                                        onChange={e => handleResultEdit(idx, "programId", e.target.value)}
                                        sx={{ fontSize: 13, fontWeight: 600, minWidth: 80 }}
                                        disableUnderline={!row._edited}
                                      >
                                        <MenuItem value="">—</MenuItem>
                                        {programs.map(p => <MenuItem key={p._id} value={p._id}>{p.code}</MenuItem>)}
                                      </Select>
                                    </TableCell>

                                    <TableCell>
                                      <Select
                                        variant="standard"
                                        value={row.branchId || ""}
                                        onChange={e => handleResultEdit(idx, "branchId", e.target.value)}
                                        sx={{ fontSize: 13, fontWeight: 600, minWidth: 80 }}
                                        disableUnderline={!row._edited}
                                      >
                                        <MenuItem value="">—</MenuItem>
                                        {branches.filter(b => !row.programId || (b.programIds && b.programIds.some(p => (p?._id || p) === row.programId)) || (b.programId?._id || b.programId) === row.programId).map(b => (
                                          <MenuItem key={b._id} value={b._id}>{b.code}</MenuItem>
                                        ))}
                                      </Select>
                                    </TableCell>

                                    <TableCell>
                                      <TextField
                                        variant="standard"
                                        type="number"
                                        value={row.semesterNumber ?? ""}
                                        onChange={e => handleResultEdit(idx, "semesterNumber", e.target.value)}
                                        slotProps={{ input: { disableUnderline: !row._edited, sx: { fontSize: 13 } } }}
                                        placeholder="Sem"
                                        sx={{ width: 45 }}
                                      />
                                    </TableCell>

                                    <TableCell>
                                      <TextField
                                        variant="standard"
                                        type="number"
                                        value={row.yearNumber ?? ""}
                                        onChange={e => handleResultEdit(idx, "yearNumber", e.target.value)}
                                        slotProps={{ input: { disableUnderline: !row._edited, sx: { fontSize: 13 } } }}
                                        placeholder="Yr"
                                        sx={{ width: 45 }}
                                      />
                                    </TableCell>

                                    <TableCell>
                                      <TextField
                                        variant="standard"
                                        value={row.section || ""}
                                        onChange={e => handleResultEdit(idx, "section", e.target.value)}
                                        slotProps={{ input: { disableUnderline: !row._edited, sx: { fontSize: 13 } } }}
                                        placeholder="Sec"
                                        sx={{ width: 45 }}
                                      />
                                    </TableCell>

                                    <TableCell>
                                      <TextField
                                        variant="standard"
                                        type="number"
                                        value={row.totalStudents ?? ""}
                                        onChange={e => handleResultEdit(idx, "totalStudents", e.target.value)}
                                        slotProps={{ input: { sx: { fontSize: 13, fontWeight: 600 } } }}
                                        sx={{ width: 65 }}
                                      />
                                    </TableCell>

                                    <TableCell>
                                      <TextField
                                        variant="standard"
                                        type="number"
                                        value={row.eligibleStudents ?? ""}
                                        onChange={e => handleResultEdit(idx, "eligibleStudents", e.target.value)}
                                        slotProps={{ input: { sx: { fontSize: 13, fontWeight: 600 } } }}
                                        sx={{ width: 65 }}
                                      />
                                    </TableCell>

                                    <TableCell>
                                      <TextField
                                        variant="standard"
                                        type="number"
                                        value={row.passedStudents ?? ""}
                                        onChange={e => handleResultEdit(idx, "passedStudents", e.target.value)}
                                        slotProps={{ input: { sx: { fontSize: 13, fontWeight: 600 } } }}
                                        sx={{ width: 65 }}
                                      />
                                    </TableCell>

                                    <TableCell>
                                      <Typography fontSize={13} fontWeight={700} color={Number(row.passPercentage) >= 80 ? "#2e7d32" : "#e65100"}>
                                        {Number(row.passPercentage || 0).toFixed(1)}%
                                      </Typography>
                                    </TableCell>
                                  </>
                                ) : (
                                  <>
                                    <TableCell>
                                      <TextField
                                        variant="standard"
                                        value={row.courseName || row.subjectName || ""}
                                        onChange={e => handleResultEdit(idx, "courseName", e.target.value)}
                                        slotProps={{ input: { disableUnderline: !row._edited, sx: { fontSize: 13 } } }}
                                        placeholder="Course Name"
                                        fullWidth
                                      />
                                    </TableCell>

                                    <TableCell>
                                      <TextField
                                        variant="standard"
                                        value={row.courseCode || row.subjectCode || ""}
                                        onChange={e => handleResultEdit(idx, "courseCode", e.target.value)}
                                        slotProps={{ input: { disableUnderline: !row._edited, sx: { fontSize: 13 } } }}
                                        placeholder="Code"
                                        sx={{ width: 80 }}
                                      />
                                    </TableCell>

                                    <TableCell>
                                      <Select
                                        variant="standard"
                                        value={row.courseType || "THEORY"}
                                        onChange={e => handleResultEdit(idx, "courseType", e.target.value)}
                                        sx={{ fontSize: 13, fontWeight: 600 }}
                                        disableUnderline={!row._edited}
                                      >
                                        <MenuItem value="THEORY">Theory</MenuItem>
                                        <MenuItem value="PRACTICAL">Practical</MenuItem>
                                        <MenuItem value="INTEGRATED">Integrated</MenuItem>
                                      </Select>
                                    </TableCell>

                                    <TableCell>
                                      <Select
                                        variant="standard"
                                        value={row.programId || ""}
                                        onChange={e => handleResultEdit(idx, "programId", e.target.value)}
                                        sx={{ fontSize: 13, fontWeight: 600, minWidth: 80 }}
                                        disableUnderline={!row._edited}
                                      >
                                        <MenuItem value="">—</MenuItem>
                                        {programs.map(p => <MenuItem key={p._id} value={p._id}>{p.code}</MenuItem>)}
                                      </Select>
                                    </TableCell>

                                    <TableCell>
                                      <Select
                                        variant="standard"
                                        value={row.branchId || ""}
                                        onChange={e => handleResultEdit(idx, "branchId", e.target.value)}
                                        sx={{ fontSize: 13, fontWeight: 600, minWidth: 80 }}
                                        disableUnderline={!row._edited}
                                      >
                                        <MenuItem value="">—</MenuItem>
                                        {branches.filter(b => !row.programId || (b.programIds && b.programIds.some(p => (p?._id || p) === row.programId)) || (b.programId?._id || b.programId) === row.programId).map(b => (
                                          <MenuItem key={b._id} value={b._id}>{b.code}</MenuItem>
                                        ))}
                                      </Select>
                                    </TableCell>

                                    <TableCell>
                                      <TextField
                                        variant="standard"
                                        value={row.semesterNumber || ""}
                                        onChange={e => handleResultEdit(idx, "semesterNumber", e.target.value)}
                                        slotProps={{ input: { disableUnderline: !row._edited, sx: { fontSize: 13 } } }}
                                        placeholder="Sem"
                                        sx={{ width: 45 }}
                                      />
                                    </TableCell>

                                    <TableCell>
                                      <TextField
                                        variant="standard"
                                        value={row.section || ""}
                                        onChange={e => handleResultEdit(idx, "section", e.target.value)}
                                        slotProps={{ input: { disableUnderline: !row._edited, sx: { fontSize: 13 } } }}
                                        placeholder="Sec"
                                        sx={{ width: 45 }}
                                      />
                                    </TableCell>

                                                                         {selected.section !== "CO_ATTAINMENT" && (
                                       <>
                                         {/* Appeared */}
                                         <TableCell>
                                           <TextField
                                             variant="standard"
                                             type="number"
                                             value={row.appeared ?? ""}
                                             onChange={e => handleResultEdit(idx, "appeared", e.target.value)}
                                             slotProps={{ input: { sx: { fontSize: 13, fontWeight: 600 } } }}
                                             sx={{ width: 65 }}
                                           />
                                         </TableCell>

                                         {/* Passed */}
                                         <TableCell>
                                           <TextField
                                             variant="standard"
                                             type="number"
                                             value={row.passed ?? ""}
                                             onChange={e => handleResultEdit(idx, "passed", e.target.value)}
                                             slotProps={{ input: { sx: { fontSize: 13, fontWeight: 600 } } }}
                                             sx={{ width: 65 }}
                                           />
                                         </TableCell>

                                         {/* Pass % */}
                                         <TableCell>
                                           <Typography fontSize={13} fontWeight={700} color={Number(row.passPercentage) >= 80 ? "#2e7d32" : "#e65100"}>
                                             {Number(row.passPercentage || 0).toFixed(1)}%
                                           </Typography>
                                         </TableCell>
                                       </>
                                     )}

                                     {selected.section === "CO_ATTAINMENT" && (
                                       <>
                                         {/* No. of COs */}
                                         <TableCell>
                                           <TextField
                                             variant="standard"
                                             type="number"
                                             value={row.noOfCos ?? ""}
                                             onChange={e => handleResultEdit(idx, "noOfCos", e.target.value)}
                                             slotProps={{ input: { sx: { fontSize: 13, fontWeight: 600 } } }}
                                             sx={{ width: 55 }}
                                           />
                                         </TableCell>

                                         {/* COs Attained */}
                                         <TableCell>
                                           <TextField
                                             variant="standard"
                                             type="number"
                                             value={row.noOfCosAttained ?? ""}
                                             onChange={e => handleResultEdit(idx, "noOfCosAttained", e.target.value)}
                                             slotProps={{ input: { sx: { fontSize: 13, fontWeight: 600 } } }}
                                             sx={{ width: 55 }}
                                           />
                                         </TableCell>

                                         {/* Attainment % */}
                                         <TableCell>
                                           <Typography fontSize={13} fontWeight={700} color={row.noOfCos > 0 && (row.noOfCosAttained / row.noOfCos * 100) >= 80 ? "#2e7d32" : "#e65100"}>
                                             {row.noOfCos > 0 ? ((row.noOfCosAttained / row.noOfCos) * 100).toFixed(1) : "0.0"}%
                                           </Typography>
                                         </TableCell>
                                       </>
                                     )}
                                   </>
                                 )}

                                <TableCell>
                                  {row._isNew && (
                                    <IconButton
                                      size="small"
                                      onClick={() => handleRemoveRow(idx)}
                                      sx={{ color: "#b71c1c", p: 0.3 }}
                                    >
                                      <CloseIcon sx={{ fontSize: 16 }} />
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
                )}

                {/* ── Proof Upload (required) ── */}
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#444", mb: 0.5 }}>
                    Upload Proof Document
                  </Typography>
                  <input
                    type="file"
                    ref={fileRef}
                    style={{ display: "none" }}
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={e => {
                      const file = e.target.files[0];
                      if (file && file.size > 500 * 1024) {
                        toast.error("Proof document must be under 500kb");
                        e.target.value = null; // Reset selection
                        return;
                      }
                      setProofFile(file);
                    }}
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
                      {proofFile ? `✅ ${proofFile.name}` : "Click to upload PDF or image"}
                    </Typography>
                    <Typography fontSize={11} color="#aaa">Max 500KB</Typography>
                  </Box>
                </Box>
              </Box>
            )
          )}
        </DialogContent>

        {!success && selected && (
          <DialogActions sx={{ px: 3, pb: 3 }}>
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
              disabled={submitting}
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
        {!rejectDone && (
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
        )}

        <DialogContent>
          {rejectDone ? (
            <Box sx={{ textAlign: "center", py: 5, minWidth: 320 }}>
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
              {rejecting ? <Loader size={20} color="inherit" /> : "✕ Reject with Note"}
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </>
  );
}
