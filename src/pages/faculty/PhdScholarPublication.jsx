import Loader from "../../components/common/Loader";
import { useState, useEffect } from "react";
import { Box, TextField, MenuItem, Select, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Stack, Grid, Card, Chip, Divider, TablePagination, Tooltip } from "@mui/material";
import { toast } from "sonner";
import {
  AddCircle, Delete, Close, Description, Download, AttachFile, Groups, WorkspacePremium,
  CheckCircle, Visibility, AccessTime, School, MenuBook, AccountTree, Person, CalendarToday,
  Business, FormatListBulleted, Edit
} from "@mui/icons-material";
import PageHeader from "../../components/common/PageHeader";
import NoActiveYearDialog from "../../components/common/NoActiveYearDialog";
import {
  FacultyInfoRow, FormCard, Grid2, SubLabel, NoteBox, FileField, SubmitBtn
} from "../../components/faculty/PublicationFormFields";
import { labelStyle, disabledField } from "../../components/faculty/publicationConstants";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";

const SCHOLAR_STATUSES = ["Pursuing", "Awarded"];

export default function PhdScholarPublication() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState("list"); // 'list', 'select-year', 'form'
  const [academicYears, setAcademicYears] = useState([]);
  const [noActiveYearAlertOpen, setNoActiveYearAlertOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState("");
  const [publicationsList, setPublicationsList] = useState([]);
  const [selectedPubDetails, setSelectedPubDetails] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Edit and resubmit state
  const [editingId, setEditingId] = useState(null);
  const [existingFiles, setExistingFiles] = useState({ document: null });

  // Milestone Progression State (Pursuing -> Awarded)
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);
  const [milestoneScholar, setMilestoneScholar] = useState(null);
  const [milestoneAcademicYear, setMilestoneAcademicYear] = useState("");
  const [milestoneAwardDate, setMilestoneAwardDate] = useState("");
  const [milestoneFile, setMilestoneFile] = useState(null);
  const [milestoneLoading, setMilestoneLoading] = useState(false);

  // Form state
  const [rollNumberInput, setRollNumberInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const [form, setForm] = useState({
    rollNumber: "",
    studentName: "",
    course: "Ph.D.",
    branch: "",
    scholarStatus: "",
    admissionOrAwardDate: "",
    scholarType: "",
    type: "",
    universitySelect: "Aditya University",
    universityText: ""
  });

  const [files, setFiles] = useState({ document: null });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get("/api/research/phd-scholar").then(res => {
      setPublicationsList(res.data?.data || res.data || []);
    }).catch(err => console.log("Failed to fetch Ph.D. scholars", err));

    API.get("/api/academic-years").then(res => {
      setAcademicYears(res.data?.years || res.data?.data || []);
    }).catch(err => console.log("Failed to fetch academic years", err));
  }, [viewMode]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const setFile = (k) => (e) => setFiles((p) => ({ ...p, [k]: e.target.files[0] }));

  // Dynamic eCap Student verification handler
  const handleVerifyRollNumber = async () => {
    const rollNo = rollNumberInput.trim().toUpperCase();
    if (!rollNo) {
      toast.error("Please enter a student roll number");
      return;
    }

    setIsVerifying(true);
    setIsVerified(false);
    try {
      const res = await API.get(`/api/research/phd-scholar/validate/${rollNo}`);
      if (res.data?.success) {
        const student = res.data.data;
        if (!student || !student.studentName) {
          throw new Error("Scholar details not found");
        }
        setForm(prev => ({
          ...prev,
          rollNumber: rollNo,
          studentName: student.studentName,
          course: student.course,
          branch: student.branch || "N/A"
        }));
        setIsVerified(true);
        toast.success(`Scholar ${rollNo} verified successfully!`);
      } else {
        throw new Error(res.data?.message || "Verification failed");
      }
    } catch (err) {
      const errMsg = err?.response?.data?.message || err.message || "Verification failed. Student not found or not a Ph.D. Scholar.";
      toast.error(errMsg);
      setForm(prev => ({
        ...prev,
        rollNumber: "",
        studentName: "",
        course: "Ph.D.",
        branch: ""
      }));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleUniversityChange = (e) => {
    const val = e.target.value;
    setForm(prev => ({
      ...prev,
      universitySelect: val,
      universityText: "",
      rollNumber: "",
      studentName: "",
      course: "Ph.D.",
      branch: "",
      type: ""
    }));
    setRollNumberInput("");
    setIsVerified(false);
  };

  const handleEditClick = (pub) => {
    setEditingId(pub._id);
    setSelectedYear(pub.academicYear?._id || pub.academicYear || "");

    const isAditya = !pub.university || pub.university === "Aditya University";
    setForm({
      rollNumber: pub.rollNumber || "",
      studentName: pub.studentName || "",
      course: pub.course || "Ph.D.",
      branch: pub.branch || "",
      scholarStatus: pub.scholarStatus || "Pursuing",
      admissionOrAwardDate: pub.admissionOrAwardDate ? pub.admissionOrAwardDate.split("T")[0] : "",
      scholarType: pub.scholarType || "Full-Time",
      type: pub.type || "guide",
      universitySelect: isAditya ? "Aditya University" : "Other",
      universityText: isAditya ? "" : (pub.university || "")
    });

    setRollNumberInput(pub.rollNumber || "");
    setIsVerified(true);
    setExistingFiles({ document: pub.document || null });
    setFiles({ document: null });
    setViewMode("form");
  };

  const hasAwardedRecord = (scholar) => {
    if (!scholar) return false;
    return publicationsList.some(p =>
      p.rollNumber?.toUpperCase() === scholar.rollNumber?.toUpperCase() &&
      (p.type || 'guide').toLowerCase() === (scholar.type || 'guide').toLowerCase() &&
      p.scholarStatus === 'Awarded' &&
      !p.status?.includes('Rejected')
    );
  };

  const handleOpenMilestoneModal = (scholar) => {
    setMilestoneScholar(scholar);
    const activeYearDoc = academicYears.find(y => y.active) || academicYears[0];
    setMilestoneAcademicYear(activeYearDoc?._id || "");
    setMilestoneAwardDate("");
    setMilestoneFile(null);
    setMilestoneDialogOpen(true);
  };

  const handleMilestoneSubmit = async () => {
    if (!milestoneAcademicYear) {
      toast.error("Please select the Academic Year");
      return;
    }
    if (!milestoneAwardDate) {
      toast.error("Please specify the Degree Award Date");
      return;
    }

    const awardDate = new Date(milestoneAwardDate);
    awardDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (awardDate > today) {
      toast.error("Ph.D. Award Date cannot be in the future");
      return;
    }

    if (milestoneScholar?.admissionOrAwardDate) {
      const admissionDate = new Date(milestoneScholar.admissionOrAwardDate);
      admissionDate.setHours(0, 0, 0, 0);
      if (awardDate <= admissionDate) {
        toast.error(`Ph.D. Award Date must be after the Admission Date (${formatDate(milestoneScholar.admissionOrAwardDate)})`);
        return;
      }
    }

    if (!milestoneFile) {
      toast.error("Please upload the Award Proceedings / Degree Award Letter");
      return;
    }

    if (milestoneFile.size > 200 * 1024) {
      toast.error("Award Proceedings file size exceeds 200KB limit");
      return;
    }

    setMilestoneLoading(true);
    try {
      const fd = new FormData();
      fd.append("rollNumber", milestoneScholar.rollNumber.trim().toUpperCase());
      fd.append("studentName", milestoneScholar.studentName.trim());
      fd.append("course", milestoneScholar.course || "Ph.D.");
      fd.append("branch", milestoneScholar.branch || "N/A");
      fd.append("scholarStatus", "Awarded");
      fd.append("scholarType", milestoneScholar.scholarType || "Full-Time");
      fd.append("type", milestoneScholar.type || "guide");
      fd.append("university", milestoneScholar.university || "Aditya University");
      fd.append("admissionOrAwardDate", milestoneAwardDate);
      fd.append("document", milestoneFile);
      fd.append("academicYear", milestoneAcademicYear);

      await API.post("/api/research/phd-scholar", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      toast.success("Ph.D. Awarded milestone submitted successfully! It has been sent for approval.");

      // Refresh list
      const res = await API.get("/api/research/phd-scholar");
      setPublicationsList(res.data?.data || res.data || []);

      setMilestoneDialogOpen(false);
      setSelectedPubDetails(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to submit Awarded milestone");
    } finally {
      setMilestoneLoading(false);
    }
  };

  const handleSubmit = async () => {
    const finalUniversity = form.universitySelect === "Aditya University"
      ? "Aditya University"
      : form.universityText.trim();

    if (!finalUniversity) {
      toast.error("Please specify the University");
      return;
    }

    if (!form.type) {
      toast.error("Please select Guide or Co-Guide");
      return;
    }

    if (!form.scholarType) {
      toast.error("Please select the scholar type (Full-Time / Part-Time)");
      return;
    }

    if (form.universitySelect === "Aditya University") {
      if (!isVerified || !form.rollNumber) {
        toast.error("Please verify a valid scholar roll number first");
        return;
      }
    } else {
      if (!form.rollNumber.trim()) {
        toast.error("Please enter the student Roll Number / ID");
        return;
      }
      if (!form.studentName.trim()) {
        toast.error("Please enter the student Name");
        return;
      }
    }

    if (!form.scholarStatus) {
      toast.error("Please select the scholar status");
      return;
    }
    if (!form.admissionOrAwardDate) {
      toast.error("Please specify the Admission/Award Date");
      return;
    }

    // Future date validation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selDate = new Date(form.admissionOrAwardDate);
    selDate.setHours(0, 0, 0, 0);
    if (selDate > today) {
      toast.error("Admission or Award date cannot be in the future");
      return;
    }

    if (!editingId) {
      if (!files.document) {
        toast.error("At least one supporting document/proof is mandatory");
        return;
      }
    } else {
      if (!files.document && !existingFiles.document) {
        toast.error("At least one supporting document/proof is mandatory");
        return;
      }
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("rollNumber", form.rollNumber.trim().toUpperCase());
      fd.append("studentName", form.studentName.trim());
      fd.append("course", form.course || "Ph.D.");
      fd.append("branch", form.branch || "N/A");
      fd.append("scholarStatus", form.scholarStatus);
      fd.append("scholarType", form.scholarType);
      fd.append("type", form.type || "guide");
      fd.append("university", finalUniversity);
      fd.append("admissionOrAwardDate", form.admissionOrAwardDate);
      if (files.document) {
        fd.append("document", files.document);
      }
      fd.append("academicYear", selectedYear);

      if (editingId) {
        await API.put(`/api/research/phd-scholar/${editingId}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success("Successfully updated and resubmitted Ph.D. scholar appraisal!");
      } else {
        await API.post("/api/research/phd-scholar", fd, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success("Successfully submitted Ph.D. scholar appraisal!");
      }

      // Refresh list
      const res = await API.get("/api/research/phd-scholar");
      setPublicationsList(res.data?.data || res.data || []);

      // Reset state
      setForm({
        rollNumber: "",
        studentName: "",
        course: "Ph.D.",
        branch: "",
        scholarStatus: "",
        admissionOrAwardDate: "",
        scholarType: "",
        type: "",
        universitySelect: "Aditya University",
        universityText: ""
      });
      setRollNumberInput("");
      setFiles({ document: null });
      setExistingFiles({ document: null });
      setEditingId(null);
      setIsVerified(false);
      setSelectedYear("");
      setViewMode("list");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Appraisal submission failed");
    } finally {
      setLoading(false);
    }
  };

  const renderList = () => (
    <Box>
      <Box sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        justifyContent: "space-between",
        alignItems: "center",
        gap: { xs: 2, sm: 0 },
        mb: 3
      }}>
        <Typography variant="h6" sx={{ color: "var(--text-primary)", fontWeight: 800, textAlign: { xs: "center", sm: "left" } }}>My Guided Ph.D. Scholars</Typography>
        <Button
          variant="contained"
          onClick={() => {
            const activeYear = academicYears.length > 0;
            if (activeYear) {
              setEditingId(null);
              setExistingFiles({ document: null });
              setSelectedYear("");
              setViewMode("select-year");
            } else {
              setNoActiveYearAlertOpen(true);
            }
          }}
          sx={{
            background: "var(--gradient-primary)",

            px: 3,
            fontWeight: 700,
            textTransform: "none",
            "&:hover": {
              opacity: 0.9,
              transform: "translateY(-1px)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
            },
            transition: "all 0.2s ease"
          }}
        >
          Add New
        </Button>
      </Box>
      {(!publicationsList || publicationsList.length === 0) ? (
        <Box sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          py: 8,
          px: 3,
          background: "var(--bg-panel)",
          borderRadius: "16px",
          border: "1px dashed var(--border-color)",
          boxShadow: "var(--shadow-premium)",
          textAlign: "center"
        }}>
          <Typography variant="h6" sx={{ color: "var(--text-secondary)", fontWeight: 600, mb: 1 }}>
            No Scholar Submissions
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 3, maxWidth: "400px" }}>
            You haven't submitted any Ph.D. Scholar guiding details yet. Click the "Add New" button to submit your first entry.
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-premium)", overflowX: "auto" }}>
          <Table sx={{ minWidth: 1100 }}>
            <TableHead sx={{ background: "var(--gradient-primary)" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Scholar Roll No</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Student Name</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Branch / Specialization</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Scholar Status</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Academic Year</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Approval Status</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2, textAlign: "center" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {publicationsList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((pub, i) => (
                <TableRow key={pub._id || i} sx={{ "&:hover": { background: "var(--bg-accent-1)" }, transition: "background 0.15s" }}>
                  <TableCell sx={{ color: "var(--text-primary)", fontWeight: 600, py: 2 }}>{pub.rollNumber || "N/A"}</TableCell>
                  <TableCell sx={{ color: "var(--text-primary)", fontWeight: 500, py: 2 }}>{pub.studentName || "N/A"}</TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>{pub.branch || "—"}</TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Chip
                      label={pub.type === 'co-guide' ? 'Co-Guide' : 'Guide'}
                      size="small"
                      sx={{
                        fontWeight: 800,
                        bgcolor: pub.type === 'co-guide' ? 'rgba(124, 58, 237, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                        color: pub.type === 'co-guide' ? '#7c3aed' : '#3b82f6',
                        borderRadius: '6px'
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Chip
                      label={pub.scholarStatus}
                      size="small"
                      sx={{
                        fontWeight: 800,
                        bgcolor: pub.scholarStatus === "Awarded" ? "rgba(16, 185, 129, 0.1)" : "rgba(59, 130, 246, 0.1)",
                        color: pub.scholarStatus === "Awarded" ? "#10B981" : "#3B82F6",
                        borderRadius: "6px"
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>{pub.academicYear?.year || "N/A"}</TableCell>
                  <TableCell sx={{ py: 2, maxWidth: 220 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: pub.status?.includes('Rejected') ? "#ef4444" : pub.status === 'Approved' ? "#10b981" : "#e8a000",
                        fontWeight: 700,
                        background: pub.status?.includes('Rejected') ? "rgba(239, 68, 68, 0.1)" : pub.status === 'Approved' ? "rgba(16, 185, 129, 0.1)" : "rgba(232, 160, 0, 0.1)",
                        px: 1.5,
                        py: 0.5,
                        borderRadius: "6px",
                        display: "inline-block"
                      }}
                    >
                      {pub.status || "Pending at R&D"}
                    </Typography>
                    {pub.status?.includes("Rejected") && (pub.rndComment || pub.hodComment) && (
                      <Typography
                        variant="caption"
                        sx={{
                          display: "block",
                          mt: 0.8,
                          color: "#ef4444",
                          fontStyle: "italic",
                          fontWeight: 500,
                          lineHeight: 1.4,
                          maxWidth: 200,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}
                      >
                        <Tooltip title={pub.rndComment || pub.hodComment} arrow placement="top">
                          <span>💬 "{pub.rndComment || pub.hodComment}"</span>
                        </Tooltip>
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ py: 2, textAlign: "center" }}>
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="View Details" arrow>
                        <IconButton
                          size="small"
                          onClick={() => setSelectedPubDetails(pub)}
                          sx={{
                            color: "var(--color-primary)",
                            border: "1px solid var(--color-primary)",
                            borderRadius: "8px",
                            p: "5px",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              background: "var(--bg-accent-1)",
                              transform: "scale(1.1)",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                            }
                          }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {pub.status === 'Approved' && pub.scholarStatus === 'Pursuing' && !hasAwardedRecord(pub) && (
                        <Tooltip title="Mark as Awarded (Submit Degree Completion)" arrow>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenMilestoneModal(pub)}
                            sx={{
                              color: "#10b981",
                              border: "1px solid #10b981",
                              borderRadius: "8px",
                              p: "5px",
                              transition: "all 0.2s ease",
                              "&:hover": {
                                background: "rgba(16, 185, 129, 0.1)",
                                transform: "scale(1.1)",
                                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.25)"
                              }
                            }}
                          >
                            <WorkspacePremium fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {pub.status?.includes("Rejected") && (
                        <Tooltip title="Edit & Resubmit" arrow>
                          <IconButton
                            size="small"
                            onClick={() => handleEditClick(pub)}
                            sx={{
                              color: "#ef4444",
                              border: "1px solid #ef4444",
                              borderRadius: "8px",
                              p: "5px",
                              transition: "all 0.2s ease",
                              "&:hover": {
                                background: "rgba(239, 68, 68, 0.1)",
                                transform: "scale(1.1)",
                                boxShadow: "0 2px 8px rgba(239, 68, 68, 0.2)"
                              }
                            }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={publicationsList.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[5, 10, 25]}
            sx={{
              borderTop: "1px solid var(--border-color)",
              color: "var(--text-secondary)",
              ".MuiTablePagination-select": { color: "var(--text-primary)" },
              ".MuiTablePagination-selectIcon": { color: "var(--text-secondary)" },
              ".MuiIconButton-root": { color: "var(--text-secondary)" },
              ".MuiIconButton-root.Mui-disabled": { opacity: 0.3 }
            }}
          />
        </TableContainer>
      )}
    </Box>
  );

  const renderSelectYear = () => {
    const activeYearDoc = academicYears.find(y => y.active) || academicYears[0];
    let priorYearStr = "";
    if (activeYearDoc && activeYearDoc.year) {
      const parts = activeYearDoc.year.split('-');
      if (parts.length === 2) {
        priorYearStr = `${parseInt(parts[0], 10) - 1}-${parseInt(parts[1], 10) - 1}`;
      }
    }

    // Only show Active and Prior year
    let filteredYears = academicYears.filter(y => y._id === activeYearDoc?._id || y.year === priorYearStr);

    // Ensure active is first
    filteredYears.sort((a, b) => {
      if (a._id === activeYearDoc?._id) return -1;
      if (b._id === activeYearDoc?._id) return 1;
      return 0;
    });

    return (
      <Box sx={{ maxWidth: 500, mx: "auto", mt: 5 }}>
        <FormCard title="Select Academic Year">
          <Typography sx={{ mb: 2, color: "var(--text-secondary)", fontWeight: 500 }}>Please select the academic year for this scholar submission:</Typography>
          <Select
            fullWidth
            size="small"
            displayEmpty
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <MenuItem value="" disabled>Select Academic Year</MenuItem>
            {filteredYears.map(y => (
              <MenuItem key={y._id} value={y._id}>{y.year}</MenuItem>
            ))}
          </Select>
          <Box sx={{ display: "flex", gap: 2, mt: 4, justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              onClick={() => {
                setViewMode("list");
              }}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                color: "var(--text-primary)",
                borderColor: "var(--border-color)",
                "&:hover": {
                  borderColor: "var(--color-primary)",
                  background: "rgba(0,0,0,0.02)"
                }
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              disabled={!selectedYear}
              onClick={() => setViewMode("form")}
              sx={{
                background: "var(--gradient-primary)",
                px: 4,
                fontWeight: 700,
                textTransform: "none",
                "&:hover": {
                  opacity: 0.9,
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                },
                "&.Mui-disabled": {
                  background: "var(--bg-panel)",
                  color: "var(--text-secondary)",
                  opacity: 0.5
                },
                transition: "all 0.2s ease"
              }}
            >
              Proceed
            </Button>
          </Box>
        </FormCard>
      </Box>
    );
  };

  const renderForm = () => (
    <FormCard title={editingId ? "Edit & Resubmit Ph.D. Scholar" : "Ph.D. Scholar Entry"}>
      <Box sx={{ mb: 3, display: "flex", alignItems: "center" }}>
        <Typography variant="body2" sx={{ background: "var(--bg-accent-1)", color: "var(--color-primary)", px: 2, py: 0.8, borderRadius: "8px", fontWeight: 700, border: "1px solid var(--border-color)" }}>
          Academic Year: {academicYears.find(y => y._id === selectedYear)?.year || "Selected"}
        </Typography>
      </Box>

      <FacultyInfoRow />

      <SubLabel text="University & Supervision Details" />
      <Grid2>
        <Box>
          <Typography sx={labelStyle}>University : *</Typography>
          <Select size="small" fullWidth value={form.universitySelect} onChange={handleUniversityChange}>
            <MenuItem value="Aditya University">Aditya University</MenuItem>
            <MenuItem value="Other">Other University</MenuItem>
          </Select>
        </Box>
        <Box>
          <Typography sx={labelStyle}>Guide / Co-Guide : *</Typography>
          <Select size="small" fullWidth displayEmpty value={form.type} onChange={set("type")}>
            <MenuItem value="" disabled>--Select--</MenuItem>
            <MenuItem value="guide">Guide</MenuItem>
            <MenuItem value="co-guide">Co-Guide</MenuItem>
          </Select>
        </Box>
        <Box>
          <Typography sx={labelStyle}>Scholar Type : *</Typography>
          <Select size="small" fullWidth displayEmpty value={form.scholarType} onChange={set("scholarType")}>
            <MenuItem value="" disabled>--Select--</MenuItem>
            <MenuItem value="Full-Time">Full-Time (FT)</MenuItem>
            <MenuItem value="Part-Time">Part-Time (PT)</MenuItem>
          </Select>
        </Box>
        {form.universitySelect === "Other" && (
          <Box>
            <Typography sx={labelStyle}>Specify University Name : *</Typography>
            <TextField
              size="small"
              fullWidth
              placeholder="Enter university name"
              value={form.universityText}
              onChange={set("universityText")}
            />
          </Box>
        )}
      </Grid2>

      {form.universitySelect === "Aditya University" ? (
        <>
          <SubLabel text="Student Verification (ECAP API)" />
          <Box sx={{ background: "var(--bg-panel)", p: 3, borderRadius: "16px", border: "1px solid var(--border-color)", mb: 3 }}>
            <Typography sx={{ ...labelStyle, color: "var(--color-primary)" }}>Student Roll Number *</Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 1, mb: 2, maxWidth: 500 }}>
              <TextField
                size="small"
                fullWidth
                value={rollNumberInput}
                onChange={(e) => setRollNumberInput(e.target.value)}
                disabled={isVerifying || loading}
                placeholder="e.g. 21A91A0501"
              />
              <Button
                variant="contained"
                onClick={handleVerifyRollNumber}
                disabled={isVerifying || !rollNumberInput.trim() || loading}
                startIcon={isVerifying ? <Loader size={16} color="inherit" /> : <CheckCircle />}
                sx={{
                  background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",

                  px: 3,
                  fontWeight: 700,
                  textTransform: "none",
                  color: "#fff"
                }}
              >
                Verify
              </Button>
            </Stack>

            {isVerified && (
              <Box sx={{ mt: 2, p: 2, bgcolor: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "12px" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#10B981", display: "flex", alignItems: "center", gap: 1 }}>
                  <CheckCircle fontSize="small" /> Scholar Details Validated Successfully
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 2, mt: 1 }}>
                  <Box sx={{ gridColumn: { xs: "span 12", sm: "span 4" } }}>
                    <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 700 }}>STUDENT NAME</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{form.studentName}</Typography>
                  </Box>
                  <Box sx={{ gridColumn: { xs: "span 12", sm: "span 4" } }}>
                    <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 700 }}>COURSE / PROGRAM</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{form.course || "Ph.D."}</Typography>
                  </Box>
                  <Box sx={{ gridColumn: { xs: "span 12", sm: "span 4" } }}>
                    <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 700 }}>BRANCH / SPECIALIZATION</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{form.branch || "N/A"}</Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </>
      ) : (
        <>
          <SubLabel text="Student Details (Manual Entry)" />
          <Box sx={{ background: "var(--bg-panel)", p: 3, borderRadius: "16px", border: "1px solid var(--border-color)", mb: 3 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 2 }}>
              <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                <Typography sx={labelStyle}>Scholar Roll Number / ID *</Typography>
                <TextField
                  size="small"
                  fullWidth
                  value={form.rollNumber}
                  onChange={set("rollNumber")}
                  placeholder="e.g. Scholar ID or Roll Number"
                />
              </Box>
              <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                <Typography sx={labelStyle}>Student Name *</Typography>
                <TextField
                  size="small"
                  fullWidth
                  value={form.studentName}
                  onChange={set("studentName")}
                  placeholder="Enter student name"
                />
              </Box>
              <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                <Typography sx={labelStyle}>Course / Program *</Typography>
                <TextField
                  size="small"
                  fullWidth
                  disabled
                  value={form.course || "Ph.D."}
                  sx={disabledField}
                />
              </Box>
              <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                <Typography sx={labelStyle}>Branch / Specialization</Typography>
                <TextField
                  size="small"
                  fullWidth
                  value={form.branch}
                  onChange={set("branch")}
                  placeholder="e.g. CSE / Specialization"
                />
              </Box>
            </Box>
          </Box>
        </>
      )}

      {(form.universitySelect === "Other" || isVerified) && (
        <>
          <SubLabel text="Scholar Status & Admission Details:" />
          <Grid2>
            <Box>
              <Typography sx={labelStyle}>Scholar Status : *</Typography>
              <Select size="small" fullWidth displayEmpty value={form.scholarStatus} onChange={set("scholarStatus")}>
                <MenuItem value="" disabled>--Select--</MenuItem>
                {SCHOLAR_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </Box>
            <Box>
              <Typography sx={labelStyle}>{form.scholarStatus === "Awarded" ? "Award Date" : form.scholarStatus === "Pursuing" ? "Admission Date" : "Admission / Award Date"} : *</Typography>
              <TextField
                size="small"
                fullWidth
                type="date"
                value={form.admissionOrAwardDate}
                onChange={set("admissionOrAwardDate")}
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: { max: new Date().toISOString().split("T")[0] }
                }}
              />
            </Box>
          </Grid2>

          <NoteBox />

          <Box sx={{ mt: 3, maxWidth: 500 }}>
            <FileField
              label={
                form.scholarStatus === "Awarded"
                  ? "Award Proceedings / Degree Award Letter : *"
                  : "PhD Admission Letter / Joining Report : *"
              }
              name="document"
              onChange={setFile("document")}
              existingFileUrl={!files.document ? existingFiles.document : null}
              existingFileName={existingFiles.document ? existingFiles.document.split('/').pop() : ""}
              onRemoveExisting={() => setExistingFiles(prev => ({ ...prev, document: null }))}
            />
          </Box>
        </>
      )}

      <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 5 }}>
        <Button
          variant="outlined"
          onClick={() => {
            setForm({
              rollNumber: "",
              studentName: "",
              course: "Ph.D.",
              branch: "",
              scholarStatus: "",
              admissionOrAwardDate: "",
              scholarType: "",
              type: "",
              universitySelect: "Aditya University",
              universityText: ""
            });
            setRollNumberInput("");
            setFiles({ document: null });
            setExistingFiles({ document: null });
            setEditingId(null);
            setIsVerified(false);
            setViewMode("list");
          }}
          sx={{
            px: 4,
            height: "44px",
            textTransform: "none",
            fontWeight: 600,
            color: "var(--text-primary)",
            borderColor: "var(--border-color)",
            "&:hover": {
              borderColor: "#ef4444",
              color: "#ef4444",
              background: "rgba(239, 68, 68, 0.05)"
            },
            transition: "all 0.3s ease"
          }}
        >
          Cancel
        </Button>
        {(form.universitySelect === "Other" || isVerified) && (
          <SubmitBtn label={editingId ? "Update & Resubmit" : "Submit Scholar Details"} onClick={handleSubmit} loading={loading} />
        )}
      </Box>
    </FormCard>
  );

  const handleCloseDetails = () => setSelectedPubDetails(null);

  const renderDetailFile = (title, filepath, folder = "phdScholars") => {
    if (!filepath) {
      return (
        <Box sx={{ p: 2.5, textAlign: "center", background: "var(--bg-panel)", borderRadius: "10px", border: "1px dashed var(--border-color)" }}>
          <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontStyle: "italic", fontWeight: 600 }}>
            No document attached
          </Typography>
        </Box>
      );
    }
    const backendURL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "");
    let normalizedPath = filepath.replace(/\\/g, '/');
    if (!normalizedPath.startsWith('http') && !normalizedPath.includes('uploads/')) {
      normalizedPath = `/uploads/${folder}/${normalizedPath.startsWith('/') ? normalizedPath.substring(1) : normalizedPath}`;
    }
    const cleanPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
    const fileUrl = normalizedPath.startsWith('http') ? normalizedPath : `${backendURL}${cleanPath}`;
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(normalizedPath);

    return (
      <Box sx={{ width: "100%" }}>
        <Typography variant="caption" sx={{ fontWeight: 800, color: "var(--color-primary)", fontSize: "0.75rem", textTransform: "uppercase", display: "block", mb: 1.5 }}>
          {title}
        </Typography>
        <Box
          sx={{
            height: 140,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid var(--border-color)",
            background: "var(--bg-panel)",
            borderRadius: "12px",
            overflow: "hidden",
            cursor: "pointer",
            transition: "all 0.25s ease",
            "&:hover": {
              borderColor: "var(--color-primary)",
              transform: "translateY(-2px)",
              boxShadow: "0 6px 16px rgba(0,0,0,0.08)"
            }
          }}
          onClick={() => window.open(fileUrl, '_blank')}
        >
          {isImage ? (
            <img src={fileUrl} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <Box sx={{ textAlign: "center", p: 2 }}>
              <Description sx={{ fontSize: 36, color: "var(--color-primary)", mb: 0.5 }} />
              <Typography variant="caption" sx={{ color: "var(--text-primary)", fontWeight: 800, display: "block" }}>
                PDF DOCUMENT
              </Typography>
              <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 600, display: "block", fontSize: "0.7rem", mt: 0.5 }}>
                Click to open / download
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  const renderDetailsDialog = () => {
    if (!selectedPubDetails) return null;
    const data = selectedPubDetails;

    const formatDate = (dateStr) => {
      if (!dateStr) return "-";
      try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      } catch (e) {
        return dateStr;
      }
    };

    return (
      <Dialog
        open={!!selectedPubDetails}
        onClose={handleCloseDetails}
        maxWidth="lg"
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            maxWidth: { xs: "95vw", sm: "90vw", md: "85vw", lg: "1150px" },
            borderRadius: "20px",
            background: "var(--bg-paper)",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-premium)",
          }
        }}
        slotProps={{
          backdrop: {
            sx: {
              backdropFilter: "blur(4px)",
              backgroundColor: "rgba(0, 0, 0, 0.4)",
            }
          }
        }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--gradient-primary)", color: "#fff", py: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <School sx={{ color: "#fff" }} />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Ph.D. Scholar Details</Typography>
          </Box>
          <IconButton onClick={handleCloseDetails} sx={{ color: "#fff" }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 1 }}>
          {/* Top Header Box (Journal Style) */}
          <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: "16px", border: "1px solid var(--border-color)", background: "var(--bg-panel)" }}>
            <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                <Box sx={{
                  width: 48, height: 48, borderRadius: "12px", bgcolor: "rgba(0, 78, 146, 0.08)",
                  color: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center",
                  border: "1px solid rgba(0, 78, 146, 0.15)", flexShrink: 0, mt: 0.5
                }}>
                  <School sx={{ fontSize: 26 }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.3 }}>
                    {data.studentName}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 600, mt: 0.5 }}>
                    Scholar Roll Number: {data.rollNumber}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0, flexWrap: "wrap" }}>
                {(data.entryType === 'Admin' || data.isDirectEntry === 'true' || data.isDirectEntry === true) && (
                  <Chip
                    label="R&D Direct Entry"
                    sx={{
                      bgcolor: "rgba(124, 58, 237, 0.1)",
                      color: "#7c3aed",
                      border: "1px solid rgba(124, 58, 237, 0.3)",
                      fontWeight: 700,
                      borderRadius: "20px",
                      px: 1,
                      py: 0.5
                    }}
                  />
                )}
                <Chip
                  icon={
                    /approved/i.test(data.status) ? <CheckCircle sx={{ fontSize: "16px !important", color: "inherit" }} /> :
                    /reject/i.test(data.status) ? <Close sx={{ fontSize: "16px !important", color: "inherit" }} /> :
                    <AccessTime sx={{ fontSize: "16px !important", color: "inherit" }} />
                  }
                  label={data.status || "Pending at R&D"}
                  sx={{
                    bgcolor: /approved/i.test(data.status) ? "rgba(46, 125, 50, 0.1)" : /reject/i.test(data.status) ? "rgba(211, 47, 47, 0.1)" : "rgba(237, 108, 2, 0.1)",
                    color: /approved/i.test(data.status) ? "#2e7d32" : /reject/i.test(data.status) ? "#d32f2f" : "#ed6c02",
                    border: `1px solid ${/approved/i.test(data.status) ? "rgba(46, 125, 50, 0.3)" : /reject/i.test(data.status) ? "rgba(211, 47, 47, 0.3)" : "rgba(237, 108, 2, 0.3)"}`,
                    fontWeight: 700,
                    borderRadius: "20px",
                    px: 1,
                    py: 0.5
                  }}
                />
              </Box>
            </Box>
          </Paper>

          {/* Main Grid: Left Column (Scholar & Program Details) + Right Column (University & Supporting Document) */}
          <Box sx={{
            display: "grid",
            gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1.3fr) minmax(0, 0.9fr)" },
            gap: 3,
            mb: 3,
            width: "100%",
            alignItems: "flex-start"
          }}>
            {/* Left Column (Scholar & Program Details) */}
            <Box sx={{ minWidth: 0 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 0,
                  overflow: "hidden",
                  borderRadius: "16px",
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-paper)",
                  display: "flex",
                  flexDirection: "column"
                }}
              >
                <Box sx={{ p: 3, pb: 2, borderBottom: "1px solid var(--border-color)" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                    <FormatListBulleted sx={{ color: "var(--color-primary)" }} />
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                      Scholar & Program Details
                    </Typography>
                  </Box>
                  <Box sx={{ width: 140, height: 3, bgcolor: "var(--color-primary)", borderRadius: "3px" }} />
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column" }}>
                  {[
                    { label: "Academic Year", value: data.academicYear?.year || "-", icon: <School sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                    { label: "Course / Program", value: data.course || "Ph.D.", icon: <MenuBook sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                    { label: "Branch / Specialization", value: data.branch || "-", icon: <AccountTree sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                    {
                      label: "Guide / Co-Guide Role",
                      chip: (
                        <Chip
                          label={data.type === 'co-guide' ? 'Co-Guide' : 'Guide'}
                          size="small"
                          sx={{
                            bgcolor: data.type === 'co-guide' ? "rgba(124, 58, 237, 0.1)" : "rgba(0, 78, 146, 0.1)",
                            color: data.type === 'co-guide' ? "#7c3aed" : "var(--color-primary)",
                            fontWeight: 800,
                            borderRadius: "6px"
                          }}
                        />
                      ),
                      icon: <Person sx={{ fontSize: 18, color: "var(--text-secondary)" }} />
                    },
                    {
                      label: "Scholar Status",
                      chip: (
                        <Chip
                          label={data.scholarStatus}
                          size="small"
                          sx={{
                            bgcolor: data.scholarStatus === "Awarded" ? "rgba(16, 185, 129, 0.15)" : "rgba(59, 130, 246, 0.15)",
                            color: data.scholarStatus === "Awarded" ? "#10b981" : "#3b82f6",
                            fontWeight: 800,
                            borderRadius: "6px"
                          }}
                        />
                      ),
                      icon: <WorkspacePremium sx={{ fontSize: 18, color: "var(--text-secondary)" }} />
                    },
                    { label: "Scholar Type", value: data.scholarType || "Full-Time", icon: <Groups sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                    { label: data.scholarStatus === "Awarded" ? "Award Date" : "Admission Date", value: formatDate(data.admissionOrAwardDate), icon: <CalendarToday sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                  ].map((item, idx, arr) => (
                    <Box
                      key={idx}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        px: 3,
                        py: 1.6,
                        borderBottom: idx === arr.length - 1 ? "none" : "1px solid var(--border-color)",
                        "&:hover": { bgcolor: "rgba(0,0,0,0.015)" },
                        transition: "background 0.2s"
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        {item.icon}
                        <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.875rem" }}>
                          {item.label}
                        </Typography>
                      </Box>
                      {item.chip ? (
                        item.chip
                      ) : (
                        <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--text-primary)", textAlign: "right", maxWidth: "55%", wordBreak: "break-word" }}>
                          {item.value}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Box>

            {/* Right Column (University & Supporting Document) */}
            <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
              {/* University & Affiliation Info */}
              <Paper elevation={0} sx={{ p: 3, borderRadius: "16px", border: "1px solid var(--border-color)", background: "var(--bg-paper)" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2, pb: 1.5, borderBottom: "1px solid var(--border-color)" }}>
                  <Business sx={{ color: "var(--color-primary)", fontSize: 20 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                    University & Milestone
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1.5, borderBottom: "1px solid var(--border-color)" }}>
                    <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 600 }}>University</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--text-primary)", textAlign: "right" }}>{data.university || "Aditya University"}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 600 }}>Milestone Track</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: data.scholarStatus === "Awarded" ? "#10b981" : "var(--color-primary)" }}>
                      {data.scholarStatus === "Awarded" ? "Ph.D. Degree Awarded" : "Ph.D. Work In-Progress"}
                    </Typography>
                  </Box>

                  {data.status === 'Approved' && data.scholarStatus === 'Pursuing' && !hasAwardedRecord(data) && (
                    <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px dashed var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                      <Box>
                        <Typography variant="caption" sx={{ color: "#10b981", fontWeight: 800, display: "block" }}>
                          Degree Completed?
                        </Typography>
                        <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>
                          Submit degree completion milestone
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<WorkspacePremium />}
                        onClick={() => handleOpenMilestoneModal(data)}
                        sx={{
                          background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                          fontWeight: 700,
                          fontSize: "0.75rem",
                          textTransform: "none",
                          borderRadius: "8px",
                          px: 1.8,
                          py: 0.6,
                          whiteSpace: "nowrap",
                          boxShadow: "0 2px 8px rgba(16, 185, 129, 0.25)",
                          "&:hover": {
                            background: "linear-gradient(135deg, #059669 0%, #047857 100%)"
                          }
                        }}
                      >
                        Mark as Awarded
                      </Button>
                    </Box>
                  )}
                  {data.status === 'Approved' && data.scholarStatus === 'Pursuing' && hasAwardedRecord(data) && (
                    <Box sx={{ mt: 1, pt: 1, borderTop: "1px dashed var(--border-color)" }}>
                      <Chip
                        icon={<CheckCircle sx={{ fontSize: "16px !important" }} />}
                        label="Awarded milestone already submitted"
                        size="small"
                        sx={{
                          bgcolor: "rgba(16, 185, 129, 0.1)",
                          color: "#10b981",
                          fontWeight: 700,
                          fontSize: "0.75rem"
                        }}
                      />
                    </Box>
                  )}
                </Box>
              </Paper>

              {/* Supporting Document */}
              <Paper elevation={0} sx={{ p: 3, borderRadius: "16px", border: "1px solid var(--border-color)", background: "var(--bg-paper)" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                  <AttachFile sx={{ color: "var(--color-primary)", fontSize: 20 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                    Supporting Document
                  </Typography>
                </Box>
                {renderDetailFile(
                  data.scholarStatus === "Awarded" ? "Award Proceedings / Degree Award Letter" : "Admission Letter / Joining Report",
                  data.document
                )}
              </Paper>

              {/* Remarks/Comments if available */}
              {(data.hodComment || data.rndComment) && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {data.hodComment && (
                    <Box sx={{ p: 2, bgcolor: "rgba(255, 193, 7, 0.05)", borderRadius: "10px", border: "1px solid rgba(255, 193, 7, 0.2)" }}>
                      <Typography variant="caption" sx={{ fontWeight: 900, color: "#ff9800", textTransform: "uppercase" }}>HOD Remarks</Typography>
                      <Typography variant="body2" sx={{ fontStyle: "italic", mt: 0.5, color: "var(--text-secondary)" }}>"{data.hodComment}"</Typography>
                    </Box>
                  )}
                  {data.rndComment && (
                    <Box sx={{ p: 2, bgcolor: "rgba(76, 175, 80, 0.05)", borderRadius: "10px", border: "1px solid rgba(76, 175, 80, 0.2)" }}>
                      <Typography variant="caption" sx={{ fontWeight: 900, color: "#4caf50", textTransform: "uppercase" }}>R&D Remarks</Typography>
                      <Typography variant="body2" sx={{ fontStyle: "italic", mt: 0.5, color: "var(--text-secondary)" }}>"{data.rndComment}"</Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {data.status === 'Approved' && data.scholarStatus === 'Pursuing' && !hasAwardedRecord(data) ? (
            <Button
              variant="contained"
              startIcon={<WorkspacePremium />}
              onClick={() => handleOpenMilestoneModal(data)}
              sx={{
                background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                fontWeight: 700,
                textTransform: "none",
                borderRadius: "8px",
                px: 2.5,
                color: "#fff",
                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.25)",
                "&:hover": {
                  background: "linear-gradient(135deg, #059669 0%, #047857 100%)"
                }
              }}
            >
              Mark as Awarded
            </Button>
          ) : <Box />}
          <Button onClick={handleCloseDetails} sx={{ color: "var(--text-primary)", fontWeight: 700 }}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  const renderMilestoneDialog = () => {
    if (!milestoneDialogOpen || !milestoneScholar) return null;
    const scholar = milestoneScholar;

    return (
      <Dialog
        open={milestoneDialogOpen}
        onClose={() => !milestoneLoading && setMilestoneDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: "20px",
            background: "var(--bg-paper)",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-premium)",
            overflow: "hidden"
          }
        }}
        slotProps={{
          backdrop: {
            sx: {
              backdropFilter: "blur(4px)",
              backgroundColor: "rgba(0, 0, 0, 0.4)",
            }
          }
        }}
      >
        <DialogTitle sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--gradient-primary)",
          color: "#fff",
          py: 2.2,
          px: 3
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <WorkspacePremium sx={{ color: "#fff", fontSize: 26 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>
                Mark Scholar as Awarded
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>
                Progress {scholar.studentName} to Ph.D. Degree Awarded milestone
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={() => !milestoneLoading && setMilestoneDialogOpen(false)}
            sx={{ color: "#fff", "&:hover": { bgcolor: "rgba(255,255,255,0.15)" } }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3, pt: 4 }}>
          {/* Summary Card */}
          <Paper elevation={0} sx={{ p: 2.5, mt: 1, mb: 3, borderRadius: "16px", border: "1px solid var(--border-color)", background: "var(--bg-panel)" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 2, pb: 1, borderBottom: "1px solid var(--border-color)" }}>
              <School sx={{ color: "var(--color-primary)", fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Scholar Information (Carried Over)
              </Typography>
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 600 }}>Scholar Roll No</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>{scholar.rollNumber}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 600 }}>Student Name</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>{scholar.studentName}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 600 }}>University</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>{scholar.university || "Aditya University"}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 600 }}>Admission Date</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--color-primary)" }}>
                  {formatDate(scholar.admissionOrAwardDate)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 600 }}>Supervision Role</Typography>
                <Box sx={{ mt: 0.3 }}>
                  <Chip
                    label={scholar.type === 'co-guide' ? 'Co-Guide' : 'Guide'}
                    size="small"
                    sx={{
                      fontWeight: 800,
                      fontSize: "0.75rem",
                      bgcolor: scholar.type === 'co-guide' ? 'rgba(124, 58, 237, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                      color: scholar.type === 'co-guide' ? '#7c3aed' : '#3b82f6',
                      borderRadius: '6px'
                    }}
                  />
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 600 }}>Scholar Type</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>{scholar.scholarType || "Full-Time"}</Typography>
              </Box>
            </Box>
          </Paper>

          {/* New Milestone Inputs */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Box>
              <Typography sx={labelStyle}>Awarded Academic Year : *</Typography>
              <Select
                size="small"
                fullWidth
                value={milestoneAcademicYear}
                displayEmpty
                inputProps={{ readOnly: true }}
              >
                <MenuItem value="" disabled>-- Select Academic Year --</MenuItem>
                {academicYears.filter((y) => y.active).map((y) => (
                  <MenuItem key={y._id} value={y._id}>{y.year} (Active)</MenuItem>
                ))}
              </Select>
            </Box>

            <Box>
              <Typography sx={labelStyle}>Ph.D. Award Date : *</Typography>
              <TextField
                size="small"
                fullWidth
                type="date"
                value={milestoneAwardDate}
                onChange={(e) => setMilestoneAwardDate(e.target.value)}
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: {
                    max: new Date().toISOString().split("T")[0],
                    min: scholar.admissionOrAwardDate ? new Date(new Date(scholar.admissionOrAwardDate).getTime() + 86400000).toISOString().split("T")[0] : undefined
                  }
                }}
              />
              {scholar.admissionOrAwardDate && (
                <Typography variant="caption" sx={{ color: "var(--text-secondary)", mt: 0.5, display: "block", fontWeight: 500 }}>
                  Must be strictly after the scholar's Admission Date: <strong>{formatDate(scholar.admissionOrAwardDate)}</strong>
                </Typography>
              )}
            </Box>

            <Box>
              <FileField
                label="Award Proceedings / Degree Award Letter *"
                name="milestoneProof"
                maxSize={200 * 1024}
                onChange={(e) => setMilestoneFile(e.target.files?.[0] || null)}
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, px: 3, borderTop: "1px solid var(--border-color)" }}>
          <Button
            onClick={() => setMilestoneDialogOpen(false)}
            disabled={milestoneLoading}
            sx={{ color: "var(--text-secondary)", fontWeight: 700, textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleMilestoneSubmit}
            disabled={milestoneLoading}
            startIcon={milestoneLoading ? <Loader size={16} color="inherit" /> : <WorkspacePremium />}
            sx={{
              background: "var(--gradient-primary)",
              fontWeight: 700,
              textTransform: "none",
              borderRadius: "10px",
              px: 3.5,
              py: 1,
              color: "#fff",
              boxShadow: "var(--shadow-btn)",
              "&:hover": {
                opacity: 0.9,
                transform: "translateY(-1px)"
              },
              transition: "all 0.2s ease"
            }}
          >
            {milestoneLoading ? "Submitting..." : "Submit Awarded Milestone"}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box sx={{ width: "100%", pb: 5 }}>
      <PageHeader
        title="Guided Ph.D. Scholars"
        subtitle="Manage and submit details of your guided scholars for annual appraisal cycles"
        onBack={viewMode !== "list" ? () => setViewMode("list") : undefined}
      />
      <Box sx={{ mt: 3 }}>
        {viewMode === "list" && renderList()}
        {viewMode === "select-year" && renderSelectYear()}
        {viewMode === "form" && renderForm()}
      </Box>
      {renderDetailsDialog()}
      {renderMilestoneDialog()}
      <NoActiveYearDialog
        open={noActiveYearAlertOpen}
        onClose={() => setNoActiveYearAlertOpen(false)}
      />
    </Box>
  );
}
