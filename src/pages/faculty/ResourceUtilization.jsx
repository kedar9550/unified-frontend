import { useState, useEffect } from "react";
import {
  Box, TextField, MenuItem, Select, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, Chip, Divider, Stack, useTheme, useMediaQuery
} from "@mui/material";
import { toast } from "sonner";
import { Description, WorkspacePremium, Close, AddCircle, Edit, Delete, Visibility, School, LocationOn, FilePresent, CalendarToday, Download, Info, DateRange, CheckCircle, TrackChanges, Comment, FormatQuote } from "@mui/icons-material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PageHeader from "../../components/common/PageHeader";
import NoActiveYearDialog from "../../components/common/NoActiveYearDialog";
import {
  FormCard, Grid2, SubLabel, NoteBox, FileField, SubmitBtn
} from "../../components/faculty/PublicationFormFields";
import { labelStyle } from "../../components/faculty/publicationConstants";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";

// Activity categories and types mappings
const ACTIVITY_CATEGORIES = [
  "CONFERENCE",
  "STTP",
  "Refresher Course",
  "FDP",
  "SYMPOSIUM",
  "GUEST LECTURE",
  "WORKSHOP",
  "Event"
];

const ROLES_BY_CATEGORY = {
  "CONFERENCE": [
    "Conference Chair",
    "Conference Co-Chair",
    "Conference Finance Chair",
    "Conference Publication Chair",
    "Conference Registration Chair",
    "Conference Resource Person",
    "Conference Participant"
  ],
  "STTP": [
    "Convenor",
    "Co-Convenor 1",
    "Co-Convenor 2",
    "Coordinator",
    "Resource Person",
    "Participant"
  ],
  "Refresher Course": [
    "Convenor",
    "Co-Convenor 1",
    "Co-Convenor 2",
    "Coordinator",
    "Resource Person",
    "Participant"
  ],
  "FDP": [
    "FDP Convenor",
    "FDP Co-Convenor",
    "FDP Coordinator",
    "FDP Resource Person",
    "FDP Participant"
  ],
  "SYMPOSIUM": [
    "Symposium Convenor",
    "Symposium Co-Convenor",
    "Symposium Coordinator",
    "Symposium Resource Person",
    "Symposium Participant"
  ],
  "GUEST LECTURE": [
    "Guest Lecture Coordinator",
    "Guest Lecture Resource Person"
  ],
  "WORKSHOP": [
    "Workshop Coordinator",
    "Workshop Resource Person"
  ],
  "Event": [
    "Event Coordinator",
    "Event Resource Person"
  ]
};

export default function ResourceUtilization() {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [activitiesList, setActivitiesList] = useState([]);

  const [openFormModal, setOpenFormModal] = useState(false);
  const [noActiveYearAlertOpen, setNoActiveYearAlertOpen] = useState(false);
  const [selectedActivityDetails, setSelectedActivityDetails] = useState(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);

  useEffect(() => {
    let active = true;
    if (selectedActivityDetails?.proof) {
      const data = selectedActivityDetails;
      const backendURL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "");
      const fileUrl = data.proof.startsWith('http') ? data.proof : `${backendURL}${data.proof}`;
      
      fetch(fileUrl)
        .then(res => {
          if (!res.ok) throw new Error("Failed to fetch proof");
          return res.blob();
        })
        .then(blob => {
          if (active) {
            const url = URL.createObjectURL(blob);
            setPreviewBlobUrl(url);
          }
        })
        .catch(err => {
          console.error("Error loading preview:", err);
          if (active) {
            setPreviewBlobUrl(fileUrl);
          }
        });
    } else {
      setPreviewBlobUrl(null);
    }

    return () => {
      active = false;
      if (previewBlobUrl && previewBlobUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewBlobUrl);
      }
    };
  }, [selectedActivityDetails]);

  const [isDocumentRemoved, setIsDocumentRemoved] = useState(false);

  const [editingId, setEditingId] = useState(null); // stores ID when editing
  const [form, setForm] = useState({
    academicYear: "",
    activityCategory: "",
    activityType: "",
    organizationName: "",
    fromDate: "",
    toDate: "",
    duration: "",
    remarks: "",
    sessionsConducted: "",
    daysParticipated: "",
    courseFdpName: "",
    organizingInstitutionCategory: "",
    location: "",
    labName: "",
    universityName: "",
    instituteName: "",
    nirfRank: "",
    certificateNumber: "",
    existingProof: ""
  });

  const [proofFile, setProofFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const blurActiveElement = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const selectMenuProps = {
    disableAutoFocusItem: true,
    slotProps: {
      list: {
        onMouseDown: blurActiveElement
      }
    }
  };

  // Fetch academic years on load
  useEffect(() => {
    API.get("/api/academic-years")
      .then(res => {
        const years = res.data?.years || res.data?.data || [];
        setAcademicYears(years);
        const active = years.find(y => y.isGlobalActive);
        if (active) {
          setSelectedYear(active._id);
          setForm(p => ({ ...p, academicYear: active._id }));
        }
      })
      .catch(err => console.log("Failed to fetch academic years", err));
  }, []);

  // Fetch activities when year changes
  useEffect(() => {
    fetchActivities();
  }, [selectedYear]);

  // Recalculate duration automatically when fromDate/toDate change
  useEffect(() => {
    if (form.fromDate && form.toDate) {
      const start = new Date(form.fromDate);
      const end = new Date(form.toDate);
      if (start <= end) {
        const diffTime = Math.abs(end - start);
        const days = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
        setForm(prev => ({ ...prev, duration: String(days) }));
      }
    }
  }, [form.fromDate, form.toDate]);

  const fetchActivities = () => {
    const url = selectedYear
      ? `/api/value-addition/resource-utilization?academicYear=${selectedYear}`
      : `/api/value-addition/resource-utilization`;
    API.get(url)
      .then(res => {
        setActivitiesList(res.data?.data || []);
      })
      .catch(err => console.log("Failed to fetch activities", err));
  };

  const setVal = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleFileChange = (e) => {
    setProofFile(e.target.files[0]);
  };

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setForm(prev => ({
      ...prev,
      activityCategory: category,
      activityType: "",
      sessionsConducted: "",
      daysParticipated: "",
      courseFdpName: "",
      organizingInstitutionCategory: "",
      location: "",
      labName: "",
      universityName: "",
      instituteName: "",
      nirfRank: "",
      certificateNumber: ""
    }));
  };

  const handleRoleChange = (e) => {
    const role = e.target.value;
    setForm(prev => ({
      ...prev,
      activityType: role,
      sessionsConducted: "",
      daysParticipated: "",
      courseFdpName: "",
      organizingInstitutionCategory: "",
      location: "",
      labName: "",
      universityName: "",
      instituteName: "",
      nirfRank: "",
      certificateNumber: ""
    }));
  };

  const showSessionsField = form.activityType?.includes("Resource Person");
  const showDaysField = form.activityType?.includes("Participant");

  const handleOpenAddModal = () => {
    const activeYearDoc = academicYears[0];
    if (!activeYearDoc) {
      setNoActiveYearAlertOpen(true);
      return;
    }
    setEditingId(null);
    setForm({
      academicYear: activeYearDoc._id,
      activityCategory: "",
      activityType: "",
      organizationName: "",
      fromDate: "",
      toDate: "",
      duration: "",
      remarks: "",
      sessionsConducted: "",
      daysParticipated: "",
      courseFdpName: "",
      organizingInstitutionCategory: "",
      location: "",
      labName: "",
      universityName: "",
      instituteName: "",
      nirfRank: "",
      certificateNumber: "",
      existingProof: ""
    });
    setIsDocumentRemoved(false);
    setProofFile(null);
    setOpenFormModal(true);
  };

  const handleOpenEditModal = (activity) => {
    setEditingId(activity._id);
    setForm({
      academicYear: activity.academicYear?._id || activity.academicYear || "",
      activityCategory: activity.activityCategory,
      activityType: activity.activityType,
      organizationName: activity.organizationName,
      fromDate: activity.fromDate ? activity.fromDate.substring(0, 10) : "",
      toDate: activity.toDate ? activity.toDate.substring(0, 10) : "",
      duration: String(activity.duration),
      remarks: activity.remarks || "",
      sessionsConducted: activity.sessionsConducted !== undefined ? String(activity.sessionsConducted) : "",
      daysParticipated: activity.daysParticipated !== undefined ? String(activity.daysParticipated) : "",
      courseFdpName: activity.courseFdpName || "",
      organizingInstitutionCategory: activity.organizingInstitutionCategory || "",
      location: activity.location || "",
      labName: activity.labName || "",
      universityName: activity.universityName || "",
      instituteName: activity.instituteName || "",
      nirfRank: activity.nirfRank !== undefined ? String(activity.nirfRank) : "",
      certificateNumber: activity.certificateNumber || "",
      existingProof: activity.proof || ""
    });
    setIsDocumentRemoved(false);
    setProofFile(null);
    setOpenFormModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this draft activity?")) return;
    try {
      await API.delete(`/api/value-addition/resource-utilization/${id}`);
      toast.success("Activity deleted successfully!");
      fetchActivities();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete activity.");
    }
  };

  const handleSaveDraft = async () => {
    const isFdpParticipant = form.activityCategory === "FDP" && form.activityType === "FDP Participant";
    const basicFieldsValid = isFdpParticipant
      ? (form.academicYear && form.activityCategory && form.activityType && form.courseFdpName && form.fromDate && form.toDate)
      : (form.academicYear && form.activityCategory && form.activityType && form.organizationName && form.fromDate && form.toDate);

    if (!basicFieldsValid) {
      toast.error("Please fill all required fields");
      return;
    }

    if (isFdpParticipant) {
      if (!form.organizingInstitutionCategory) {
        toast.error("Organizing Institution Category is required");
        return;
      }
      if (!form.location) {
        toast.error("Location is required");
        return;
      }
      if (form.organizingInstitutionCategory === "MHRD R&D Lab" && !form.labName) {
        toast.error("Lab Name is required");
        return;
      }
      if (form.organizingInstitutionCategory === "Govt. University" && !form.universityName) {
        toast.error("University Name is required");
        return;
      }
      if (form.organizingInstitutionCategory === "NIRF Ranked Institute (Below 200)") {
        if (!form.instituteName) {
          toast.error("Institute Name is required");
          return;
        }
        if (!form.nirfRank) {
          toast.error("NIRF Rank is required");
          return;
        }
        const rank = parseInt(form.nirfRank);
        if (isNaN(rank) || rank <= 0 || rank >= 200) {
          toast.error("NIRF Rank must be a positive integer less than 200");
          return;
        }
      }
    }

    if (showSessionsField && !form.sessionsConducted) {
      toast.error("Number of Sessions Conducted is required for Resource Person role");
      return;
    }

    if (showDaysField && !form.daysParticipated) {
      toast.error("Number of Days Participated is required for Participant role");
      return;
    }

    if (!proofFile && (!editingId || isDocumentRemoved)) {
      toast.error("Supporting proof upload is mandatory");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const from = new Date(form.fromDate);
    const to = new Date(form.toDate);

    if (from > today || to > today) {
      toast.error("Activity dates cannot be in the future");
      return;
    }

    if (from >= to) {
      toast.error("To Date must be greater than From Date");
      return;
    }

    const durationDays = parseInt(form.duration, 10) || 0;
    if (form.activityCategory === "STTP" || form.activityCategory === "Refresher Course") {
      if (durationDays < 10) {
        toast.error(`${form.activityCategory} must have a minimum duration of 10 days.`);
        return;
      }
    } else if (form.activityCategory === "FDP" || form.activityCategory === "SYMPOSIUM") {
      if (durationDays < 5) {
        toast.error(`${form.activityCategory} must have a minimum duration of 5 days.`);
        return;
      }
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("academicYear", form.academicYear);
      fd.append("activityCategory", form.activityCategory);
      fd.append("activityType", form.activityType);
      fd.append("fromDate", form.fromDate);
      fd.append("toDate", form.toDate);
      fd.append("duration", form.duration);
      fd.append("remarks", form.remarks || "");

      if (isFdpParticipant) {
        fd.append("courseFdpName", form.courseFdpName);
        fd.append("organizingInstitutionCategory", form.organizingInstitutionCategory);
        fd.append("location", form.location);
        fd.append("organizationName", form.courseFdpName);
        if (form.organizingInstitutionCategory === "MHRD R&D Lab") {
          fd.append("labName", form.labName);
        } else if (form.organizingInstitutionCategory === "Govt. University") {
          fd.append("universityName", form.universityName);
        } else if (form.organizingInstitutionCategory === "NIRF Ranked Institute (Below 200)") {
          fd.append("instituteName", form.instituteName);
          fd.append("nirfRank", form.nirfRank);
        } else if (form.organizingInstitutionCategory === "NPTEL" && form.certificateNumber) {
          fd.append("certificateNumber", form.certificateNumber);
        }
      } else {
        fd.append("organizationName", form.organizationName);
      }

      if (showSessionsField && form.sessionsConducted) {
        fd.append("sessionsConducted", form.sessionsConducted);
      }
      if (showDaysField && form.daysParticipated) {
        fd.append("daysParticipated", form.daysParticipated);
      }

      if (proofFile) {
        fd.append("proof", proofFile);
      }

      if (editingId) {
        await API.put(`/api/value-addition/resource-utilization/${editingId}`, fd, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success("Draft updated successfully!");
      } else {
        await API.post("/api/value-addition/resource-utilization", fd, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success("Draft saved successfully!");
      }

      setOpenFormModal(false);
      fetchActivities();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save draft");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSubmit = async () => {
    const activeDrafts = activitiesList.filter(a => a.status === 'Draft');
    if (activeDrafts.length === 0) {
      toast.error("No draft entries found");
      return;
    }

    const confirmMessage = `Are you sure you want to submit all ${activeDrafts.length} draft entries? Once submitted, they will become read-only.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    try {
      await API.post("/api/value-addition/resource-utilization/submit-academic-year", {
        academicYear: selectedYear || undefined
      });
      toast.success("Drafts submitted successfully for approval!");
      fetchActivities();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  const renderFacultyInfoCard = () => (
    <Box sx={{
      background: "var(--bg-glass)",
      border: "1px solid var(--border-color)",
      borderRadius: "20px",
      p: 2.5,
      mb: 4,
      display: "grid",
      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr 1fr" },
      gap: 3,
      boxShadow: "var(--shadow-premium)"
    }}>
      <Box>
        <Typography sx={{ fontSize: 10, color: "var(--color-primary)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>Faculty Name</Typography>
        <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{user?.name || "N/A"}</Typography>
      </Box>
      <Box>
        <Typography sx={{ fontSize: 10, color: "var(--color-primary)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>Employee ID</Typography>
        <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{user?.institutionId || "N/A"}</Typography>
      </Box>
      <Box>
        <Typography sx={{ fontSize: 10, color: "var(--color-primary)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>Parent Department</Typography>
        <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{user?.coreDepartment || user?.department || "N/A"}</Typography>
      </Box>
      <Box>
        <Typography sx={{ fontSize: 10, color: "var(--color-primary)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>Designation</Typography>
        <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{user?.designation || "N/A"}</Typography>
      </Box>
    </Box>
  );

  const getStatusColor = (status) => {
    if (status === 'Approved') return { bg: "rgba(16, 185, 129, 0.1)", color: "#10b981" };
    if (status === 'Rejected') return { bg: "rgba(239, 68, 68, 0.1)", color: "#ef4444" };
    if (status === 'Pending at HOD') return { bg: "rgba(232, 160, 0, 0.1)", color: "#e8a000" };
    return { bg: "rgba(100, 116, 139, 0.1)", color: "#64748b" }; // Draft
  };

  const renderDashboard = () => {
    const activeDrafts = activitiesList.filter(a => a.status === 'Draft');

    return (
      <Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 2, alignItems: "center", mb: 3 }}>
          <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { xs: "stretch", sm: "center" }, gap: 2, width: { xs: "100%", sm: "auto" } }}>
            <Typography variant="h6" sx={{ color: "var(--text-primary)", fontWeight: 800 }}>
              Resource Utilization Records
            </Typography>
            <Select
              size="small"
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                blurActiveElement();
              }}
              onClose={blurActiveElement}
              displayEmpty
              MenuProps={selectMenuProps}
              sx={{ width: { xs: "100%", sm: "auto" }, minWidth: { xs: "100%", sm: 180 }, borderRadius: "8px", background: "var(--bg-glass)" }}
            >
              <MenuItem value="">All Academic Years</MenuItem>
              {academicYears.map(y => (
                <MenuItem key={y._id} value={y._id}>{y.year}</MenuItem>
              ))}
            </Select>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ width: { xs: "100%", sm: "auto" } }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleOpenAddModal}
              startIcon={<AddCircle />}
              sx={{ textTransform: "none", fontWeight: 700, width: { xs: "100%", sm: "auto" } }}
            >
              Add Resource Utilization
            </Button>
            <Button
              variant="contained"
              color="success"
              disabled={activeDrafts.length === 0 || loading}
              onClick={handleBulkSubmit}
              sx={{
                background: "var(--gradient-primary)",
                px: 3,
                fontWeight: 800,
                textTransform: "none",
                width: { xs: "100%", sm: "auto" },
                "&:hover": { opacity: 0.9 },
                "&.Mui-disabled": {
                  background: "var(--disabled-bg)",
                  color: "var(--disabled-text)",
                }
              }}
            >
              Submit Academic Year Data ({activeDrafts.length} Drafts)
            </Button>
          </Stack>
        </Box>

        {activitiesList.length === 0 ? (
          <Box sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            py: 5,
            px: 3,
            background: "var(--bg-panel)",
            borderRadius: "16px",
            border: "1px dashed var(--border-color)",
            boxShadow: "var(--shadow-premium)",
            textAlign: "center"
          }}>
            <Typography variant="h6" sx={{ color: "var(--text-secondary)", fontWeight: 600, mb: 1 }}>
              No Records Saved
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 3, maxWidth: "450px" }}>
              Click the "Add Resource Utilization" button to create your first Draft entry.
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-premium)", overflowX: "auto" }}>
            <Table>
              <TableHead sx={{ background: "var(--gradient-primary)" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Academic Year</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Role / Type</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Organization / Event</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Dates</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Duration</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activitiesList.map((activity, i) => {
                  const isDraft = activity.status === 'Draft';
                  const fromDateFormatted = new Date(activity.fromDate).toLocaleDateString("en-IN", { day: '2-digit', month: '2-digit', year: 'numeric' });
                  const toDateFormatted = new Date(activity.toDate).toLocaleDateString("en-IN", { day: '2-digit', month: '2-digit', year: 'numeric' });
                  const statusStyle = getStatusColor(activity.status);

                  return (
                    <TableRow key={activity._id || i}>
                      <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>{activity.academicYear?.year || "N/A"}</TableCell>
                      <TableCell sx={{ color: "var(--text-primary)", fontWeight: 500, py: 2 }}>{activity.activityCategory}</TableCell>
                      <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>{activity.activityType}</TableCell>
                      <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>{activity.organizationName}</TableCell>
                      <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>{fromDateFormatted} - {toDateFormatted}</TableCell>
                      <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>{activity.duration} Days</TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            color: statusStyle.color,
                            fontWeight: 700,
                            background: statusStyle.bg,
                            px: 1.5,
                            py: 0.5,
                            borderRadius: "6px",
                            display: "inline-block"
                          }}
                        >
                          {activity.status}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Stack direction="row" spacing={1}>
                          <IconButton
                            size="small"
                            onClick={() => setSelectedActivityDetails(activity)}
                            sx={{ color: "var(--color-primary)" }}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                          {isDraft && (
                            <>
                              <IconButton
                                size="small"
                                color="info"
                                onClick={() => handleOpenEditModal(activity)}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDelete(activity._id)}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    );
  };

  const renderDetailsDialog = () => {
    if (!selectedActivityDetails) return null;
    const data = selectedActivityDetails;
    const statusStyle = getStatusColor(data.status);

    const backendURL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "");
    const fileUrl = data.proof ? (data.proof.startsWith('http') ? data.proof : `${backendURL}${data.proof}`) : null;
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(data.proof || "");

    // Calculate resource utilization score
    const calculateScore = () => {
      let score = 0;
      let rule = "";
      const role = (data.activityType || "").toLowerCase();
      const category = (data.activityCategory || "").toLowerCase();
      const sessions = Number(data.sessionsConducted) || 0;
      // Use server-auto-calculated duration as authoritative; daysParticipated is manually entered fallback
      const days = Number(data.duration) || Number(data.daysParticipated) || 0;

      if (role.includes("resource person") || role.includes("resourceperson")) {
        score = sessions * 2;
        rule = "2 Points / Session";
      } else if (role.includes("participant") || role.includes("participated")) {
        if (category.includes("guest lecture") || category.includes("workshop") || category.includes("event")) {
          score = 0;
          rule = "NA for Guest Lecture / Workshop / Event participants";
        } else {
          score = days * 1;
          rule = "1 Point / Day";
        }
      } else {
        if (category.includes("conference")) {
          score = 10;
          rule = "10 Points for chair/co-chair/finance/publication/registration roles";
        } else if (category.includes("sttp") || category.includes("refresher")) {
          score = 10;
          rule = "10 Points for convenor/co-convenor/coordinator";
        } else if (category.includes("fdp") || category.includes("symposium")) {
          score = 10;
          rule = "10 Points for convenor/co-convenor/coordinator";
        } else if (category.includes("guest lecture") || category.includes("workshop") || category.includes("event")) {
          score = 2;
          rule = "2 Points for coordinator";
        }
      }

      return { score, rule };
    };

    const { score, rule } = calculateScore();

    return (
      <Dialog
        open={!!selectedActivityDetails}
        onClose={() => setSelectedActivityDetails(null)}
        maxWidth="lg"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: "20px",
              background: "var(--bg-paper)",
              border: "1px solid var(--border-color)",
              boxShadow: "var(--shadow-premium)",
            }
          }
        }}
      >
        <DialogTitle component="div" sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "linear-gradient(90deg, #0d1b3e 0%, #0f172a 100%)",
          color: "#fff",
          py: 2.2,
          px: 3
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <School sx={{ fontSize: 24, color: "#fff" }} />
            <Typography variant="h6" component="div" sx={{ fontWeight: 600, fontSize: "1.1rem" }}>Activity Details</Typography>
          </Box>
          <IconButton onClick={() => setSelectedActivityDetails(null)} sx={{ color: "#fff" }}>
            <Close sx={{ fontSize: 20 }} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: "24px !important", px: 4, pb: 4 }}>
          {/* Header Section with Activity Info & Large Circle Icon */}
          <Box sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2.5,
            mb: 4,
            mt: 1.5,
            flexWrap: { xs: "wrap", md: "nowrap" }
          }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, flex: 1 }}>
              {/* Left Circle Icon */}
              <Box sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                bgcolor: "#eff6ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                <School sx={{ fontSize: 32, color: "#1e3a8a" }} />
              </Box>
              
              {/* Title & Subtitle */}
              <Box>
                <Typography sx={{
                  fontSize: "1.35rem",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  lineHeight: 1.25,
                  mb: 0.5
                }}>
                  {data.activityCategory} - {data.activityType}
                </Typography>
                <Typography sx={{
                  fontSize: "0.95rem",
                  color: "var(--text-secondary)",
                  fontWeight: 500
                }}>
                  {data.activityCategory === "FDP" && data.activityType === "FDP Participant"
                    ? data.courseFdpName || data.organizationName
                    : data.organizationName}
                </Typography>
              </Box>
            </Box>

            {/* Right: Status Badge */}
            <Chip
              label={data.status === "Pending at HOD" ? "Pending at HOD / Dean" : data.status}
              icon={
                data.status === "Approved" ? (
                  <span style={{ color: "#10b981", fontWeight: "bold", marginRight: "2px" }}>✓</span>
                ) : undefined
              }
              sx={{
                bgcolor: data.status === "Approved" ? "#f0fdf4" : statusStyle.bg,
                color: data.status === "Approved" ? "#10b981" : statusStyle.color,
                border: data.status === "Approved" ? "1px solid #bbf7d0" : `1px solid ${statusStyle.color}40`,
                fontWeight: 700,
                fontSize: "0.85rem",
                px: 1.8,
                py: 2.2,
                borderRadius: "8px",
                "& .MuiChip-icon": {
                  color: "inherit"
                }
              }}
            />
          </Box>

          {/* Grid Layout containing Labeled Info Columns */}
          <Grid container spacing={4}>
            {/* Left Column: Activity Info and Activity Duration */}
            <Grid size={{ xs: 12, md: 7.5 }}>
              
              {/* ACTIVITY INFORMATION */}
              <Box sx={{ mb: 4 }}>
                <Typography sx={{ fontSize: "0.85rem", fontWeight: 800, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.05em", mb: 2.5 }}>
                  Activity Information
                </Typography>
                
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "120px 1fr", sm: "220px 1fr" }, gap: 2 }}>
                  <Typography sx={{ fontWeight: 600, color: "#475569", fontSize: "0.9rem" }}>Activity Category</Typography>
                  <Typography sx={{ color: "#0f172a",fontWeight: 600, fontSize: "0.9rem" }}>{data.activityCategory}</Typography>
                  
                  <Typography sx={{ fontWeight: 600, color: "#475569", fontSize: "0.9rem" }}>Activity Role / Type</Typography>
                  <Typography sx={{ color: "#0f172a", fontWeight: 600, fontSize: "0.9rem" }}>{data.activityType}</Typography>
                  
                  <Typography sx={{ fontWeight: 600, color: "#475569", fontSize: "0.9rem" }}>Organization / Event Name</Typography>
                  <Typography sx={{ color: "#0f172a",fontWeight: 600, fontSize: "0.9rem" }}>
                    {data.activityCategory === "FDP" && data.activityType === "FDP Participant"
                      ? data.courseFdpName || data.organizationName
                      : data.organizationName}
                  </Typography>

                  {/* FDP organizing category or location details */}
                  {data.activityCategory === "FDP" && data.activityType === "FDP Participant" && (
                    <>
                      <Typography sx={{ fontWeight: 600, color: "#475569", fontSize: "0.9rem" }}>Organizing Institution Category</Typography>
                      <Typography sx={{ color: "#0f172a",fontWeight: 600, fontSize: "0.9rem" }}>{data.organizingInstitutionCategory || "N/A"}</Typography>
                      
                      <Typography sx={{ fontWeight: 600, color: "#475569", fontSize: "0.9rem" }}>Location</Typography>
                      <Typography sx={{ color: "#0f172a",fontWeight: 600, fontSize: "0.9rem" }}>{data.location || "N/A"}</Typography>
                    </>
                  )}
                  {data.certificateNumber && (
                    <>
                      <Typography sx={{ fontWeight: 600, color: "#475569", fontSize: "0.9rem" }}>Certificate Number</Typography>
                      <Typography sx={{ color: "#0f172a", fontSize: "0.9rem" }}>{data.certificateNumber}</Typography>
                    </>
                  )}
                </Box>
              </Box>

              {/* Horizontal line divider */}
              <Box sx={{ borderBottom: "1px solid #cbd5e1", mb: 4, opacity: 0.5 }} />

              {/* ACTIVITY DURATION */}
              <Box>
                <Typography sx={{ fontSize: "0.85rem", fontWeight: 800, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.05em", mb: 2.5 }}>
                  Activity Duration
                </Typography>
                
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1px 1.2fr" }, gap: 3.5 }}>
                  {/* From & To Dates */}
                  <Box sx={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: 2 }}>
                    <Typography sx={{ fontWeight: 600, color: "#475569", fontSize: "0.9rem" }}>From Date</Typography>
                    <Typography sx={{ color: "#0f172a", fontSize: "0.9rem" }}>
                      {new Date(data.fromDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </Typography>
                    
                    <Typography sx={{ fontWeight: 600, color: "#475569", fontSize: "0.9rem" }}>To Date</Typography>
                    <Typography sx={{ color: "#0f172a", fontSize: "0.9rem" }}>
                      {new Date(data.toDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </Typography>
                  </Box>

                  {/* Vertical Divider */}
                  <Box sx={{ display: { xs: "none", sm: "block" }, width: "1px", height: "100%", bgcolor: "#cbd5e1" }} />

                  {/* Duration & Days Participated */}
                  <Box sx={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 2 }}>
                    <Typography sx={{ fontWeight: 600, color: "#475569", fontSize: "0.9rem" }}>Duration (Days)</Typography>
                    <Typography sx={{ color: "#0f172a", fontSize: "0.9rem", fontWeight: 700 }}>{data.duration || 0} Days</Typography>
                    
                    {data.activityType?.includes("Participant") && data.daysParticipated && (
                      <>
                        <Typography sx={{ fontWeight: 600, color: "#475569", fontSize: "0.9rem" }}>Number of Days Participated</Typography>
                        <Typography sx={{ color: "#0f172a", fontSize: "0.9rem", fontWeight: 700 }}>{data.daysParticipated} Days</Typography>
                      </>
                    )}
                  </Box>
                </Box>
              </Box>

            </Grid>

            {/* Right Column: Proof Document */}
            <Grid size={{ xs: 12, md: 4.5 }} sx={{ borderLeft: { xs: "none", md: "1px solid #cbd5e1" }, pl: { xs: 0, md: 4 } }}>
              <Typography sx={{ fontSize: "0.85rem", fontWeight: 800, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.05em", mb: 2.5 }}>
                Proof Document
              </Typography>
              
              {fileUrl ? (
                <Box sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2
                }}>
                  {/* Embedded Document Preview */}
                  <Box sx={{
                    width: "100%",
                    height: 380,
                    border: "1px solid #cbd5e1",
                    borderRadius: "12px",
                    overflow: "hidden",
                    bgcolor: "#f8fafc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    {/\.(jpg|jpeg|png|gif|webp)$/i.test(data.proof || "") ? (
                      <img
                        src={previewBlobUrl || fileUrl}
                        alt="Proof Document"
                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                      />
                    ) : (
                      <iframe
                        src={previewBlobUrl ? `${previewBlobUrl}#toolbar=0&navpanes=0&scrollbar=0` : ""}
                        width="100%"
                        height="100%"
                        style={{ border: "none" }}
                        title="Proof Document Preview"
                      />
                    )}
                  </Box>

                  {/* Download Action */}
                  <Button
                    variant="contained"
                    size="medium"
                    fullWidth
                    startIcon={<Download sx={{ fontSize: 18 }} />}
                    onClick={() => window.open(fileUrl, "_blank")}
                    sx={{
                      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                      "&:hover": {
                        background: "#0f172a"
                      },
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      textTransform: "none",
                      borderRadius: "10px",
                      py: 1.2
                    }}
                  >
                    Download Document
                  </Button>
                </Box>
              ) : (
                <Typography sx={{ color: "var(--text-secondary)", fontStyle: "italic" }}>No proof document uploaded</Typography>
              )}
            </Grid>
          </Grid>
          
          {/* HOD Remarks (only shown if present) */}
          {data.hodComment && (
            <Box sx={{
              mt: 4,
              p: 2.5,
              background: "#fff1f2",
              borderRadius: "12px",
              border: "1px solid #ffe4e6",
              display: "flex",
              alignItems: "center",
              gap: 2.5,
              position: "relative",
              overflow: "hidden"
            }}>
              <Box sx={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "#ffe4e6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                <WorkspacePremium sx={{ color: "#e11d48", fontSize: 22 }} />
              </Box>
              
              <Box sx={{
                width: "1px",
                height: 32,
                bgcolor: "#fda4af"
              }} />

              <Box sx={{ flex: 1, zIndex: 2 }}>
                <Typography sx={{ fontSize: "0.85rem", fontWeight: 800, color: "#be185d", mb: 0.5 }}>
                  HOD Remarks
                </Typography>
                <Typography sx={{ fontSize: "0.9rem", color: "#881337", fontStyle: "italic", fontWeight: 600 }}>
                  &quot;{data.hodComment}&quot;
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2.5, borderTop: "1px solid var(--border-color)" }}>
          <Button
            onClick={() => setSelectedActivityDetails(null)}
            variant="outlined"
            sx={{
              color: "var(--text-primary)",
              borderColor: "var(--border-color)",
              "&:hover": {
                borderColor: "var(--text-primary)",
                background: "var(--bg-panel)"
              },
              fontWeight: 700,
              textTransform: "none",
              fontSize: "0.95rem",
              borderRadius: "8px",
              px: 3
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const renderFormContent = () => (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2, mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Typography sx={{
          fontSize: 13,
          fontWeight: 800,
          color: "var(--text-primary)",
          background: "var(--bg-accent-1)",
          px: 2,
          py: 1.2,
          borderRadius: "12px",
          borderLeft: "5px solid var(--color-primary)",
          textTransform: "uppercase",
          letterSpacing: "0.03em"
        }}>
          Details of the Activity:
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>Academic Year: *</Typography>
          <Select
            size="small"
            displayEmpty
            value={form.academicYear || ""}
            onChange={setVal("academicYear")}
            disabled={!!editingId}
            sx={{ minWidth: 150, background: "var(--bg-panel)" }}
          >
            <MenuItem value="" disabled>--Select--</MenuItem>
            {academicYears.map(y => (
              <MenuItem key={y._id} value={y._id}>{y.year}</MenuItem>
            ))}
          </Select>
        </Box>
      </Box>
      <Grid2>

        <Box>
          <Typography sx={labelStyle}>Activity Category: *</Typography>
          <Select
            size="small"
            fullWidth
            displayEmpty
            value={form.activityCategory}
            onChange={handleCategoryChange}
            onClose={blurActiveElement}
            MenuProps={selectMenuProps}
          >
            <MenuItem value="" disabled>--Select Category--</MenuItem>
            {ACTIVITY_CATEGORIES.map(cat => (
              <MenuItem key={cat} value={cat}>{cat}</MenuItem>
            ))}
          </Select>
        </Box>

        <Box>
          <Typography sx={labelStyle}>Activity Role / Type: *</Typography>
          <Select
            size="small"
            fullWidth
            displayEmpty
            value={form.activityType}
            onChange={handleRoleChange}
            disabled={!form.activityCategory}
            onClose={blurActiveElement}
            MenuProps={selectMenuProps}
          >
            <MenuItem value="" disabled>--Select Role--</MenuItem>
            {form.activityCategory && ROLES_BY_CATEGORY[form.activityCategory]?.map(role => (
              <MenuItem key={role} value={role}>{role}</MenuItem>
            ))}
          </Select>
        </Box>

        {form.activityCategory === "FDP" && form.activityType === "FDP Participant" ? (
          <>
            <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
              <Typography sx={labelStyle}>Course Name: *</Typography>
              <TextField
                size="small"
                fullWidth
                value={form.courseFdpName}
                onChange={setVal("courseFdpName")}
                placeholder="Enter Course Name"
              />
            </Box>

            <Box>
              <Typography sx={labelStyle}>Organizing Institution Category: *</Typography>
              <Select
                size="small"
                fullWidth
                displayEmpty
                value={form.organizingInstitutionCategory}
                onChange={setVal("organizingInstitutionCategory")}
                onClose={blurActiveElement}
                MenuProps={selectMenuProps}
              >
                <MenuItem value="" disabled>--Select Category--</MenuItem>
                {[
                  "UGC",
                  "AICTE",
                  "IIT",
                  "IIM",
                  "NIT",
                  "MHRD R&D Lab",
                  "NITTTR",
                  "NIPER",
                  "ICMR",
                  "Govt. University",
                  "NIRF Ranked Institute (Below 200)",
                  "NPTEL"
                ].map(opt => (
                  <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                ))}
              </Select>
            </Box>

            <Box>
              <Typography sx={labelStyle}>Location (City, State): *</Typography>
              <TextField
                size="small"
                fullWidth
                value={form.location}
                onChange={setVal("location")}
                placeholder="e.g. Hyderabad, Telangana"
              />
            </Box>

            {form.organizingInstitutionCategory === "MHRD R&D Lab" && (
              <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                <Typography sx={labelStyle}>Lab Name: *</Typography>
                <TextField
                  size="small"
                  fullWidth
                  value={form.labName}
                  onChange={setVal("labName")}
                  placeholder="Enter Lab Name"
                />
              </Box>
            )}

            {form.organizingInstitutionCategory === "Govt. University" && (
              <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                <Typography sx={labelStyle}>University Name: *</Typography>
                <TextField
                  size="small"
                  fullWidth
                  value={form.universityName}
                  onChange={setVal("universityName")}
                  placeholder="Enter University Name"
                />
              </Box>
            )}

            {form.organizingInstitutionCategory === "NIRF Ranked Institute (Below 200)" && (
              <>
                <Box>
                  <Typography sx={labelStyle}>Institute Name: *</Typography>
                  <TextField
                    size="small"
                    fullWidth
                    value={form.instituteName}
                    onChange={setVal("instituteName")}
                    placeholder="Enter Institute Name"
                  />
                </Box>
                <Box>
                  <Typography sx={labelStyle}>NIRF Rank: *</Typography>
                  <TextField
                    size="small"
                    fullWidth
                    type="number"
                    value={form.nirfRank}
                    onChange={setVal("nirfRank")}
                    placeholder="e.g. 45"
                  />
                </Box>
              </>
            )}

            {form.organizingInstitutionCategory === "NPTEL" && (
              <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                <Typography sx={labelStyle}>NPTEL Certificate Number: *</Typography>
                <TextField
                  size="small"
                  fullWidth
                  value={form.certificateNumber}
                  onChange={setVal("certificateNumber")}
                  placeholder="e.g. NPTEL24CS01S1234"
                  helperText="Required to prevent duplicate claims in Metric 3.2 (Contribution)"
                />
              </Box>
            )}
          </>
        ) : (
          <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
            <Typography sx={labelStyle}>Organization / Event Name: *</Typography>
            <TextField
              size="small"
              fullWidth
              value={form.organizationName}
              onChange={setVal("organizationName")}
              placeholder="Enter Name of Event or Organization"
            />
          </Box>
        )}

        <Box>
          <Typography sx={labelStyle}>From Date: *</Typography>
          <TextField
            size="small"
            fullWidth
            type="date"
            value={form.fromDate}
            onChange={setVal("fromDate")}
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: { max: new Date().toISOString().split("T")[0] }
            }}
          />
        </Box>

        <Box>
          <Typography sx={labelStyle}>To Date: *</Typography>
          <TextField
            size="small"
            fullWidth
            type="date"
            value={form.toDate}
            onChange={setVal("toDate")}
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: { max: new Date().toISOString().split("T")[0] }
            }}
          />
        </Box>

        <Box>
          <Typography sx={labelStyle}>Duration (Days): *</Typography>
          <TextField
            size="small"
            fullWidth
            disabled
            value={form.duration || ""}
            placeholder="Calculated automatically"
          />
        </Box>

        {showSessionsField && (
          <Box>
            <Typography sx={labelStyle}>Number of Sessions Conducted: *</Typography>
            <TextField
              size="small"
              fullWidth
              type="number"
              value={form.sessionsConducted}
              onChange={setVal("sessionsConducted")}
              placeholder="e.g. 3"
            />
          </Box>
        )}

        {showDaysField && (
          <Box>
            <Typography sx={labelStyle}>Number of Days Participated: *</Typography>
            <TextField
              size="small"
              fullWidth
              type="number"
              value={form.daysParticipated}
              onChange={setVal("daysParticipated")}
              placeholder="e.g. 5"
            />
          </Box>
        )}

        <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
          <Typography sx={labelStyle}>Remarks (Optional):</Typography>
          <TextField
            size="small"
            fullWidth
            multiline
            rows={2}
            value={form.remarks}
            onChange={setVal("remarks")}
            placeholder="Any additional remarks..."
          />
        </Box>
      </Grid2>

      <NoteBox />

      <Box sx={{ mt: 2 }}>
        {editingId && form.existingProof && !isDocumentRemoved ? (
          <Box sx={{ p: 2, border: "1px solid var(--border-color)", borderRadius: "12px", background: "var(--bg-glass)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              {form.existingProof.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                 <a href={form.existingProof.startsWith('http') ? form.existingProof : `${(import.meta.env.VITE_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")}${form.existingProof}`} target="_blank" rel="noreferrer">
                   <img 
                     src={form.existingProof.startsWith('http') ? form.existingProof : `${(import.meta.env.VITE_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")}${form.existingProof}`} 
                     alt="Proof Document"
                     style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px", border: "1px solid var(--border-color)" }}
                   />
                 </a>
              ) : (
                 <FilePresent sx={{ color: "var(--color-primary)", fontSize: 40 }} />
              )}
              <Box>
                <Typography sx={{ fontWeight: 600, color: "var(--text-primary)" }}>Existing Document</Typography>
                {!form.existingProof.match(/\.(jpeg|jpg|gif|png)$/i) && (
                  <Button size="small" href={form.existingProof.startsWith('http') ? form.existingProof : `${(import.meta.env.VITE_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")}${form.existingProof}`} target="_blank" sx={{ mt: 0.5, textTransform: "none", p: 0, minWidth: "auto" }}>View PDF</Button>
                )}
              </Box>
            </Box>
            <IconButton onClick={() => setIsDocumentRemoved(true)} sx={{ color: "#ef4444" }}>
              <Delete />
            </IconButton>
          </Box>
        ) : (
          <FileField
            label="Relevant Proof Upload: *"
            name="proof"
            onChange={handleFileChange}
          />
        )}
      </Box>
    </>
  );

  const renderFormModal = () => (
    <Dialog
      open={openFormModal}
      onClose={() => setOpenFormModal(false)}
      maxWidth="md"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: "20px" } } }}
    >
      <DialogTitle component="div" sx={{ borderBottom: "1px solid var(--border-color)", pb: 2 }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
          {editingId ? "Edit Faculty Resource Utilization Entry" : "Add Faculty Resource Utilization Entry"}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ p: 3, pt: 2 }}>
        {renderFormContent()}
      </DialogContent>
      <DialogActions sx={{ p: 2.5, borderTop: "1px solid var(--border-color)" }}>
        <Button
          variant="outlined"
          onClick={() => setOpenFormModal(false)}
          sx={{ textTransform: "none", fontWeight: 700 }}
        >
          Cancel
        </Button>
        <SubmitBtn onClick={handleSaveDraft} loading={loading} />
      </DialogActions>
    </Dialog>
  );

  const renderFormInline = () => (
    <FormCard title={editingId ? "Edit Faculty Resource Utilization Entry" : "Add Faculty Resource Utilization Entry"}>
      {renderFormContent()}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3, pt: 2.5, borderTop: "1px solid var(--border-color)" }}>
        <Button
          variant="outlined"
          onClick={() => setOpenFormModal(false)}
          sx={{ textTransform: "none", fontWeight: 700 }}
        >
          Cancel
        </Button>
        <SubmitBtn onClick={handleSaveDraft} loading={loading} />
      </Box>
    </FormCard>
  );

  const showFormInline = isMobile && openFormModal;

  return (
    <Box sx={{ width: "100%", pb: 5 }}>
      <PageHeader
        title={
          showFormInline
            ? (editingId ? "Edit Resource Utilization" : "Add Resource Utilization")
            : "Faculty Resource Utilization"
        }
        subtitle={
          showFormInline
            ? "Provide the details of your FDP, workshop, refresher course, or other activity utilization."
            : "Manage, edit drafts, and submit all FDP, workshop, refesher course, seminar and event utilization activities."
        }
        onBack={showFormInline ? () => setOpenFormModal(false) : undefined}
      />
      <Box sx={{ mt: 4 }}>
        {showFormInline ? (
          renderFormInline()
        ) : (
          <>
            {renderDashboard()}
            {renderDetailsDialog()}
            {renderFormModal()}
          </>
        )}
      </Box>
      <NoActiveYearDialog
        open={noActiveYearAlertOpen}
        onClose={() => setNoActiveYearAlertOpen(false)}
      />
    </Box>
  );
}
