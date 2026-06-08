import { useState, useEffect } from "react";
import {
  Box, TextField, MenuItem, Select, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, Chip, Divider, Stack
} from "@mui/material";
import { toast } from "sonner";
import { Description, WorkspacePremium, Close, AddCircle, Edit, Delete, Visibility } from "@mui/icons-material";
import PageHeader from "../../components/common/PageHeader";
import {
  FormCard, Grid2, SubLabel, NoteBox, FileField, SubmitBtn, labelStyle
} from "../../components/faculty/PublicationFormFields";
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
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [activitiesList, setActivitiesList] = useState([]);
  
  const [openFormModal, setOpenFormModal] = useState(false);
  const [selectedActivityDetails, setSelectedActivityDetails] = useState(null);
  
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
    certificateNumber: ""
  });
  
  const [proofFile, setProofFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch academic years on load
  useEffect(() => {
    API.get("/api/academic-years")
      .then(res => {
        setAcademicYears(res.data?.years || res.data?.data || []);
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
    setEditingId(null);
    setForm({
      academicYear: selectedYear || "",
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
      certificateNumber: ""
    });
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
      certificateNumber: activity.certificateNumber || ""
    });
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

    if (!proofFile && !editingId) {
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
      toast.error("No draft entries found.");
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
        <Typography sx={{ fontSize: 10, color: "var(--color-primary)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>Department</Typography>
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="h6" sx={{ color: "var(--text-primary)", fontWeight: 800 }}>
              Resource Utilization Records
            </Typography>
            <Select
              size="small"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              displayEmpty
              sx={{ minWidth: 180, borderRadius: "8px", background: "var(--bg-glass)" }}
            >
              <MenuItem value="">All Academic Years</MenuItem>
              {academicYears.map(y => (
                <MenuItem key={y._id} value={y._id}>{y.year}</MenuItem>
              ))}
            </Select>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleOpenAddModal}
              startIcon={<AddCircle />}
              sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 700 }}
            >
              Add Resource Utilization
            </Button>
            <Button
              variant="contained"
              color="success"
              disabled={activeDrafts.length === 0 || loading}
              onClick={handleBulkSubmit}
              sx={{
                background: activeDrafts.length > 0 ? "var(--gradient-primary)" : "rgba(0,0,0,0.1)",
                borderRadius: "12px",
                px: 3,
                fontWeight: 800,
                textTransform: "none",
                "&:hover": { opacity: 0.9 }
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
            py: 8,
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

    return (
      <Dialog
        open={!!selectedActivityDetails}
        onClose={() => setSelectedActivityDetails(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "20px",
            background: "var(--bg-glass)",
            backdropFilter: "blur(12px)",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-premium)",
          }
        }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--gradient-primary)", color: "#fff", py: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <WorkspacePremium sx={{ color: "#fff" }} />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Activity Details</Typography>
          </Box>
          <IconButton onClick={() => setSelectedActivityDetails(null)} sx={{ color: "#fff" }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)", mb: 1 }}>{data.activityCategory} - {data.activityType}</Typography>
          {data.activityCategory === "FDP" && data.activityType === "FDP Participant" ? (
            <Typography variant="body2" sx={{ color: "var(--text-secondary)", mb: 3, fontWeight: 600 }}>Course Name: {data.courseFdpName || data.organizationName}</Typography>
          ) : (
            <Typography variant="body2" sx={{ color: "var(--text-secondary)", mb: 3, fontWeight: 600 }}>Organization / Event: {data.organizationName}</Typography>
          )}

          <Grid container spacing={2}>
            {data.activityCategory === "FDP" && data.activityType === "FDP Participant" && (
              <>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ p: 1.5, borderRadius: "10px", background: "rgba(255,255,255,0.02)" }}>
                    <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem" }}>Organizing Category</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.organizingInstitutionCategory}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ p: 1.5, borderRadius: "10px", background: "rgba(255,255,255,0.02)" }}>
                    <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem" }}>Location</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.location}</Typography>
                  </Box>
                </Grid>
                {data.organizingInstitutionCategory === "MHRD R&D Lab" && (
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ p: 1.5, borderRadius: "10px", background: "rgba(255,255,255,0.02)" }}>
                      <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem" }}>Lab Name</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.labName}</Typography>
                    </Box>
                  </Grid>
                )}
                {data.organizingInstitutionCategory === "Govt. University" && (
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ p: 1.5, borderRadius: "10px", background: "rgba(255,255,255,0.02)" }}>
                      <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem" }}>University Name</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.universityName}</Typography>
                    </Box>
                  </Grid>
                )}
                {data.organizingInstitutionCategory === "NIRF Ranked Institute (Below 200)" && (
                  <>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ p: 1.5, borderRadius: "10px", background: "rgba(255,255,255,0.02)" }}>
                        <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem" }}>Institute Name</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.instituteName}</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ p: 1.5, borderRadius: "10px", background: "rgba(255,255,255,0.02)" }}>
                        <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem" }}>NIRF Rank</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.nirfRank}</Typography>
                      </Box>
                    </Grid>
                  </>
                )}
                {data.organizingInstitutionCategory === "NPTEL" && data.certificateNumber && (
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ p: 1.5, borderRadius: "10px", background: "rgba(255,255,255,0.02)" }}>
                      <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem" }}>Certificate Number</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.certificateNumber}</Typography>
                    </Box>
                  </Grid>
                )}
              </>
            )}

            <Grid item xs={12} sm={4}>
              <Box sx={{ p: 1.5, borderRadius: "10px", background: "rgba(255,255,255,0.02)" }}>
                <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem" }}>Dates</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>
                  {new Date(data.fromDate).toLocaleDateString("en-IN")} to {new Date(data.toDate).toLocaleDateString("en-IN")}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ p: 1.5, borderRadius: "10px", background: "rgba(255,255,255,0.02)" }}>
                <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem" }}>Duration</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.duration} Days</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ p: 1.5, borderRadius: "10px", background: "rgba(255,255,255,0.02)" }}>
                <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem" }}>Status</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={data.status}
                    size="small"
                    sx={{
                      bgcolor: statusStyle.bg,
                      color: statusStyle.color,
                      fontWeight: 800,
                      borderRadius: "6px"
                    }}
                  />
                </Box>
              </Box>
            </Grid>

            {data.sessionsConducted !== undefined && (
              <Grid item xs={12} sm={4}>
                <Box sx={{ p: 1.5, borderRadius: "10px", background: "rgba(255,255,255,0.02)" }}>
                  <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem" }}>Sessions Conducted</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.sessionsConducted}</Typography>
                </Box>
              </Grid>
            )}

            {data.daysParticipated !== undefined && (
              <Grid item xs={12} sm={4}>
                <Box sx={{ p: 1.5, borderRadius: "10px", background: "rgba(255,255,255,0.02)" }}>
                  <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem" }}>Days Participated</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.daysParticipated}</Typography>
                </Box>
              </Grid>
            )}

            {data.remarks && (
              <Grid item xs={12}>
                <Box sx={{ p: 1.5, borderRadius: "10px", background: "rgba(255,255,255,0.02)" }}>
                  <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem" }}>Remarks</Typography>
                  <Typography variant="body2" sx={{ color: "var(--text-primary)", mt: 0.5 }}>{data.remarks}</Typography>
                </Box>
              </Grid>
            )}

            {data.hodComment && (
              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: "rgba(255, 193, 7, 0.05)", borderRadius: "10px", border: "1px solid rgba(255, 193, 7, 0.2)" }}>
                  <Typography variant="caption" sx={{ fontWeight: 900, color: "#ff9800", textTransform: "uppercase" }}>HOD Remarks</Typography>
                  <Typography variant="body2" sx={{ fontStyle: "italic", mt: 0.5, color: "var(--text-secondary)" }}>"{data.hodComment}"</Typography>
                </Box>
              </Grid>
            )}
          </Grid>

          <Divider sx={{ my: 3 }} />

          {fileUrl && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: "var(--color-primary)", fontSize: "0.7rem", textTransform: "uppercase", display: "block", mb: 1 }}>Proof Document</Typography>
              <Box sx={{
                height: 250, display: "flex", alignItems: "center", justifyContent: "center",
                border: "1px solid var(--border-color)", background: "var(--bg-panel)", borderRadius: "8px",
                overflow: "hidden", cursor: "pointer", transition: "all 0.2s ease",
                "&:hover": { borderColor: "var(--color-primary)", transform: "translateY(-2px)" }
              }} onClick={() => window.open(fileUrl, '_blank')}>
                {isImage ? (
                  <img src={fileUrl} alt="Proof" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : (
                  <Box sx={{ textAlign: "center" }}>
                    <Description sx={{ fontSize: 40, color: "var(--text-secondary)", mb: 0.5 }} />
                    <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 700, display: "block" }}>PDF Preview (Click to open)</Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: "1px solid var(--border-color)" }}>
          <Button onClick={() => setSelectedActivityDetails(null)} sx={{ color: "var(--text-primary)", fontWeight: 700 }}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  const renderFormModal = () => (
    <Dialog
      open={openFormModal}
      onClose={() => setOpenFormModal(false)}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: "20px" } }}
    >
      <DialogTitle sx={{ borderBottom: "1px solid var(--border-color)", pb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
          {editingId ? "Edit Resource Utilization Entry" : "Add Resource Utilization Entry"}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ p: 3, pt: 4 }}>
        <SubLabel text="Details of the Activity:" />
        <Grid2>
          <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
            <Typography sx={labelStyle}>Academic Year: *</Typography>
            <Select
              size="small"
              fullWidth
              displayEmpty
              value={form.academicYear}
              onChange={setVal("academicYear")}
            >
              <MenuItem value="" disabled>--Select Academic Year--</MenuItem>
              {academicYears.map(y => (
                <MenuItem key={y._id} value={y._id}>{y.year}</MenuItem>
              ))}
            </Select>
          </Box>

          <Box>
            <Typography sx={labelStyle}>Activity Category: *</Typography>
            <Select
              size="small"
              fullWidth
              displayEmpty
              value={form.activityCategory}
              onChange={handleCategoryChange}
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
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: new Date().toISOString().split("T")[0] }}
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
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: new Date().toISOString().split("T")[0] }}
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
          <FileField
            label={editingId ? "Upload New Proof (Optional):" : "Relevant Proof Upload: *"}
            name="proof"
            onChange={handleFileChange}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, borderTop: "1px solid var(--border-color)" }}>
        <Button
          variant="outlined"
          onClick={() => setOpenFormModal(false)}
          sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700 }}
        >
          Cancel
        </Button>
        <SubmitBtn onClick={handleSaveDraft} loading={loading} />
      </DialogActions>
    </Dialog>
  );

  return (
    <Box sx={{ width: "100%", pb: 5 }}>
      <PageHeader
        title="Faculty Resource Utilization"
        subtitle="Manage, edit drafts, and submit all FDP, workshop, refesher course, seminar and event utilization activities."
      />
      <Box sx={{ mt: 4 }}>
        {renderDashboard()}
        {renderDetailsDialog()}
        {renderFormModal()}
      </Box>
    </Box>
  );
}
