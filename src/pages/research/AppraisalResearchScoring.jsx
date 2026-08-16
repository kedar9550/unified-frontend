import Loader from "../../components/common/Loader";
import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  TextField,
  InputAdornment,
  Avatar,
  Chip,
  Stack,
  IconButton,
  FormControl,
  FormLabel,
  Select,
  MenuItem
} from "@mui/material";
import {
  Science,
  Reply,
  CheckCircle,
  HelpOutlined,
  Person,
  Work,
  School,
  Description,
  Public,
  Fingerprint,
  Business,
  Place,
  Email,
  Phone,
  CalendarToday,
  Badge,
  ChevronLeft,
  ChevronRight,
  Edit,
  EmojiEvents,
  Save,
  Rule,
  Article,
  ShowChart,
  Shield,
  AccessTime,
  East,
  Search,
  Visibility
} from "@mui/icons-material";
import axiosInstance from "../../api/axios";
import { toast } from "sonner";
import DataTable from "../../components/data/DataTable";
// Helper to extract short department code
const getDeptCode = (deptName) => {
  if (!deptName) return "";
  if (deptName.length <= 5) return deptName;
  const common = {
    "computer science & engineering": "CSE",
    "computer science and engineering": "CSE",
    "electronics & communication engineering": "ECE",
    "electronics and communication engineering": "ECE",
    "mechanical engineering": "ME",
    "civil engineering": "CE",
    "electrical & electronics engineering": "EEE",
    "electrical and electronics engineering": "EEE",
    "information technology": "IT"
  };
  const normalized = deptName.toLowerCase().trim();
  if (common[normalized]) return common[normalized];
  return deptName.split(" ").map(w => w[0]).join("").toUpperCase();
};

// Helper to generate initials and color styling for carousel avatars
const getAvatarStyle = (name) => {
  const initials = name ? name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "JD";
  const charCodeSum = initials.charCodeAt(0) + (initials.charCodeAt(1) || 0);
  const colors = [
    { bg: "rgba(59, 130, 246, 0.08)", text: "#3b82f6" },
    { bg: "rgba(16, 185, 129, 0.08)", text: "#10b981" },
    { bg: "rgba(139, 92, 246, 0.08)", text: "#8b5cf6" },
    { bg: "rgba(245, 158, 11, 0.08)", text: "#f59e0b" },
    { bg: "rgba(239, 68, 68, 0.08)", text: "#ef4444" }
  ];
  return { initials, ...colors[charCodeSum % colors.length] };
};

// Helper for relative time representation
const getRelativeTime = (dateStr) => {
  if (!dateStr) return "Submitted 3 days ago";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours <= 0) return "Submitted today";
    return `Submitted ${diffHours} hours ago`;
  }
  return `Submitted ${diffDays} days ago`;
};

const AppraisalResearchScoring = () => {
  const [pendingList, setPendingList] = useState([]);
  const [selectedAppraisal, setSelectedAppraisal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  // Two-stage view: "list" shows the pending table, "detail" shows the evaluation UI
  const [view, setView] = useState("list");
  const [statusFilter, setStatusFilter] = useState("Pending");

  // Scoring States
  const [citations, setCitations] = useState("");
  const [citationPoints, setCitationPoints] = useState(0);
  const [hIndexPrevYear, setHIndexPrevYear] = useState("");
  const [hIndexCurrentYear, setHIndexCurrentYear] = useState("");
  const [hIndexPoints, setHIndexPoints] = useState(0);
  const [comments, setComments] = useState("");
  const [activeConfig, setActiveConfig] = useState(null);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/api/appraisal/pending-rnd");
      if (res.data && res.data.success) {
        setPendingList(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch pending appraisals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  // (Auto-select removed — user picks via Score Research button)

  const handlePrevCarousel = () => {
    setCarouselIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextCarousel = () => {
    setCarouselIndex(prev => Math.min(pendingList.length - 3, prev + 1));
  };

  const getFacultyImage = () => {
    if (selectedAppraisal?.facultyId?.profileImage) return selectedAppraisal.facultyId.profileImage;
    const empId = selectedAppraisal?.personalInfoSnapshot?.institutionId || selectedAppraisal?.facultyId?.institutionId;
    if (empId) {
      return `https://info.aec.edu.in/aus/employeephotos/${empId}.jpg`;
    }
    return null;
  };

  const handleSelectAppraisal = async (appr) => {
    setSelectedAppraisal(appr);

    // Load saved inputs
    setCitations(appr.research.scopusCitations !== undefined && appr.research.scopusCitations !== null ? String(appr.research.scopusCitations) : "");
    setHIndexPrevYear(appr.research.hIndexPrevYear !== undefined && appr.research.hIndexPrevYear !== null ? String(appr.research.hIndexPrevYear) : "");
    setHIndexCurrentYear(appr.research.hIndexCurrentYear !== undefined && appr.research.hIndexCurrentYear !== null ? String(appr.research.hIndexCurrentYear) : "");

    setCitationPoints(appr.research.scopusCitationScore || 0);
    setHIndexPoints(appr.research.scopusHIndexScore || 0);
    setComments(appr.rndEvaluation?.comments || "");

    // Fetch config for this year
    try {
      const yearId = appr.academicYearId?._id || appr.academicYearId;
      const res = await axiosInstance.get(`/api/appraisal/config/${yearId}`);
      if (res.data && res.data.success) {
        setActiveConfig(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load point configuration for selected academic year", err);
    }
  };

  // Called from the list table's "Score Research" button
  const handleScoreResearch = async (appr) => {
    await handleSelectAppraisal(appr);
    setView("detail");
  };

  // Go back to list view and refresh pending list
  const handleBackToList = () => {
    setView("list");
    setSelectedAppraisal(null);
    fetchPending();
  };


  // Dynamic Citation calculation
  useEffect(() => {
    if (!activeConfig) return;
    const citationRate = activeConfig.research?.citationRate ?? 0.2;
    const count = Number(citations) || 0;
    const points = Number((count * citationRate).toFixed(2));
    setCitationPoints(points);
  }, [citations, activeConfig]);

  // Dynamic H-Index calculation
  useEffect(() => {
    if (!activeConfig) return;
    const h24 = Number(hIndexPrevYear) || 0;
    const h25 = Number(hIndexCurrentYear) || 0;
    const raise = h25 - h24;

    if (raise <= 0) {
      setHIndexPoints(0);
      return;
    }

    const lowRate = activeConfig.research?.hIndexRateLow ?? 1;
    const midRate = activeConfig.research?.hIndexRateMid ?? 2;
    const highRate = activeConfig.research?.hIndexRateHigh ?? 4;

    let rate = lowRate;
    if (h25 >= 5 && h25 <= 10) {
      rate = midRate;
    } else if (h25 > 10) {
      rate = highRate;
    }

    setHIndexPoints(raise * rate);
  }, [hIndexPrevYear, hIndexCurrentYear, activeConfig]);

  const startYear = selectedAppraisal?.academicYearId?.year ? Number(selectedAppraisal.academicYearId.year.split('-')[0]) : 2025;
  const citationYear = startYear;
  const prevYearLabel = startYear - 1;
  const currentYearLabel = startYear;

  const hIndexRaise = (() => {
    const h24 = Number(hIndexPrevYear) || 0;
    const h25 = Number(hIndexCurrentYear) || 0;
    const diff = h25 - h24;
    return diff > 0 ? `+${diff}` : String(diff);
  })();

  const handleSaveScoring = async (isDraft = false) => {
    if (!selectedAppraisal) return;

    setLoading(true);
    try {
      const res = await axiosInstance.put(`/api/appraisal/rnd-evaluate/${selectedAppraisal._id}`, {
        scopusCitations: citations === "" ? null : Number(citations),
        hIndexPrevYear: hIndexPrevYear === "" ? null : Number(hIndexPrevYear),
        hIndexCurrentYear: hIndexCurrentYear === "" ? null : Number(hIndexCurrentYear),
        scopusCitationScore: citationPoints,
        scopusHIndexScore: hIndexPoints,
        scopusCitationStatus: "Approved",
        scopusHIndexStatus: "Approved",
        scopusCitationRemarks: "",
        scopusHIndexRemarks: "",
        comments,
        isDraft
      });
      if (res.data && res.data.success) {
        toast.success(isDraft ? "Appraisal draft saved successfully!" : "Appraisal finalized and completed successfully!");
        if (!isDraft) {
          setSelectedAppraisal(null);
          setView("list");
          fetchPending();
        } else {
          // Update local selectedAppraisal with saved values so UI stays synced
          setSelectedAppraisal(prev => {
            const updated = { ...prev };
            if (!updated.research) updated.research = {};
            updated.research.scopusCitations = citations === "" ? null : Number(citations);
            updated.research.hIndexPrevYear = hIndexPrevYear === "" ? null : Number(hIndexPrevYear);
            updated.research.hIndexCurrentYear = hIndexCurrentYear === "" ? null : Number(hIndexCurrentYear);
            updated.research.scopusCitationScore = citationPoints;
            updated.research.scopusHIndexScore = hIndexPoints;
            updated.research.scopusCitationStatus = "Approved";
            updated.research.scopusHIndexStatus = "Approved";
            updated.research.scopusCitationRemarks = "";
            updated.research.scopusHIndexRemarks = "";
            if (!updated.rndEvaluation) updated.rndEvaluation = {};
            updated.rndEvaluation.comments = comments;
            return updated;
          });
        }
      }
    } catch (err) {
      toast.error(isDraft ? (err.response?.data?.message || "Failed to save draft") : (err.response?.data?.message || "Failed to finalize appraisal"));
    } finally {
      setLoading(false);
    }
  };

  const filteredList = pendingList.filter(appr => {
    // 1. Status Filter
    if (statusFilter === "Pending") return appr.status === "Pending Research Admin";
    if (statusFilter === "Approved") return appr.status?.startsWith("Approved by");
    return true; // "All"
  });

  return (
    <Box p={{ xs: 2, md: 4 }} sx={{ maxWidth: 1200, margin: "0 auto", animation: "fadeIn 0.5s ease", pb: { xs: "80px !important", md: "100px !important" } }}>

      {/* Title Block */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: "var(--text-primary)", mb: 0.5 }}>
          Research &amp; Development Appraisal Evaluation Desk
        </Typography>
        <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 600 }}>
          Evaluate research performance and provide scores
        </Typography>
      </Box>

      {/* ─── LIST VIEW ─── */}
      {view === "list" && (
        <>
          <Card sx={{
            borderRadius: "16px",
            background: "var(--bg-panel)",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-premium)",
            p: 3,
            overflow: "hidden"
          }}>
            <Box sx={{ px: 0, pb: 2.5, borderBottom: "1px solid var(--border-color)", mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                Faculty Appraisals List
              </Typography>
            </Box>

            <DataTable
              columns={["Faculty Name", "Employee ID", "Department", "Academic Year", "Status", "Action"]}
              rows={filteredList.map((appr) => {
                const name = appr.personalInfoSnapshot?.name || appr.facultyId?.name || "N/A";
                const empId = appr.personalInfoSnapshot?.institutionId || appr.facultyId?.institutionId || "N/A";
                const dept = appr.personalInfoSnapshot?.departmentName || "N/A";
                const year = appr.academicYearId?.year || "N/A";
                const status = appr.status;
                const statusVal = status === "Pending Research Admin" ? "Pending" : status?.startsWith("Approved by") ? "Approved" : status;

                const getStatusColor = (statusVal) => {
                  if (statusVal?.startsWith('Approved by')) return { bg: "rgba(16, 185, 129, 0.1)", color: "#10b981" };
                  if (statusVal === 'Pending Research Admin') return { bg: "rgba(232, 160, 0, 0.1)", color: "#e8a000" };
                  return { bg: "rgba(100, 116, 139, 0.1)", color: "#64748b" };
                };
                const statusColor = getStatusColor(status);

                return [
                  { value: name, display: <Typography sx={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.88rem" }}>{name}</Typography> },
                  { value: empId, display: empId },
                  { value: dept, display: dept },
                  { value: year, display: year },
                  {
                    value: statusVal,
                    display: (
                      <Chip
                        label={statusVal}
                        size="small"
                        sx={{
                          bgcolor: statusColor.bg,
                          color: statusColor.color,
                          fontWeight: 800,
                          borderRadius: "6px"
                        }}
                      />
                    )
                  },
                  {
                    value: "",
                    display: (
                      <Button
 variant={status?.startsWith("Approved by") ? "outlined" : "contained"}
 size="small"
 startIcon={status?.startsWith("Approved by") ? <Visibility sx={{ fontSize: "1rem" }} /> : <Person sx={{ fontSize: "1rem" }} />}
 onClick={() => handleScoreResearch(appr)}
 disabled={loading}
 sx={{
 textTransform: "none",
 fontWeight: 700,
 fontSize: "0.8rem",
 
 px: 2,
 py: 0.8,
 bgcolor: status?.startsWith("Approved by") ? "transparent" : "#1e3a5f",
 color: status?.startsWith("Approved by") ? "var(--text-primary)" : "#fff",
 borderColor: status?.startsWith("Approved by") ? "var(--border-color)" : "transparent",
 boxShadow: "none",
 "&:hover": {
 bgcolor: status?.startsWith("Approved by") ? "var(--bg-panel)" : "#2563eb",
 borderColor: status?.startsWith("Approved by") ? "var(--text-secondary)" : "transparent",
 boxShadow: status?.startsWith("Approved by") ? "none" : "0 4px 12px rgba(59,130,246,0.25)"
 }
 }}
 >
                        {status?.startsWith("Approved by") ? "View Details" : "Score Research"}
                      </Button>
                    )
                  }
                ];
              })}
              nonSortableColumns={[5]}
              toolbarLeft={(
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.5, color: "var(--text-secondary)" }}>Status</Typography>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    sx={{
                      borderRadius: "10px",
                      background: "var(--bg-paper)",
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "var(--border-color)" }
                    }}
                  >
                    <MenuItem value="Pending">Pending Evaluation</MenuItem>
                    <MenuItem value="Approved">Approved / Completed</MenuItem>
                    <MenuItem value="All">All Requests</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </Card>
        </>
      )}

      {/* ─── DETAIL / SCORING VIEW ─── */}
      {view === "detail" && selectedAppraisal && (
        <Stack spacing={4}>

          {/* Back to List button */}
          <Box>
            <Button
              startIcon={<Reply />}
              onClick={handleBackToList}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
                px: 0,
                "&:hover": { color: "var(--text-primary)", bgcolor: "transparent" }
              }}
            >
              Back to List
            </Button>
          </Box>

          {/* Carousel Section */}
          {/* <Card sx={{
            borderRadius: "20px",
            background: "var(--bg-panel)",
            border: "1px solid var(--border-color)",
            p: 3,
            boxShadow: "var(--shadow-premium)"
          }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
              <Box sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 38,
                height: 38,
                borderRadius: "10px",
                bgcolor: "var(--bg-paper)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)"
              }}>
                <Description sx={{ fontSize: 20 }} />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                Pending Appraisals
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <IconButton
                onClick={handlePrevCarousel}
                disabled={carouselIndex === 0}
                sx={{
                  bgcolor: "var(--bg-paper)",
                  border: "1px solid var(--border-color)",
                  width: 40,
                  height: 40,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  "&:hover": { bgcolor: "var(--bg-panel)" },
                  "&.Mui-disabled": { opacity: 0.3 }
                }}
              >
                <ChevronLeft />
              </IconButton>

              <Box sx={{
                display: "flex",
                gap: 2,
                flexGrow: 1,
                overflow: "hidden",
                py: 1 // Add vertical padding to prevent hover translation clipping
              }}>
                {pendingList.map((appr, idx) => {
                  const isSelected = selectedAppraisal?._id === appr._id;
                  const name = appr.personalInfoSnapshot?.name || appr.facultyId?.name || "N/A";
                  const dept = appr.personalInfoSnapshot?.departmentName || "N/A";
                  const empId = appr.personalInfoSnapshot?.institutionId || appr.facultyId?.institutionId || "N/A";
                  const year = appr.academicYearId?.year || "N/A";
                  const avatarInfo = getAvatarStyle(name);

                  // Show up to 3 cards
                  const isVisible = idx >= carouselIndex && idx < carouselIndex + 3;

                  if (!isVisible) return null;

                  return (
                    <Card
                      key={appr._id}
                      onClick={() => handleSelectAppraisal(appr)}
                      sx={{
                        flex: { xs: "1 0 100%", sm: "1 0 calc(50% - 8px)", md: "1 0 calc(33.33% - 11px)" },
                        borderRadius: "16px",
                        background: "var(--bg-paper)",
                        border: isSelected ? "2px solid #3b82f6" : "1px solid var(--border-color)",
                        boxShadow: isSelected ? "0 4px 20px rgba(59, 130, 246, 0.1)" : "none",
                        cursor: "pointer",
                        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: isSelected ? "0 6px 24px rgba(59, 130, 246, 0.15)" : "0 4px 12px rgba(0,0,0,0.04)",
                          borderColor: isSelected ? "#3b82f6" : "var(--text-secondary)"
                        }
                      }}
                    >
                      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                          <Avatar sx={{
                            bgcolor: avatarInfo.bg,
                            color: avatarInfo.text,
                            fontWeight: 800,
                            fontSize: "0.85rem",
                            width: 38,
                            height: 38
                          }}>
                            {avatarInfo.initials}
                          </Avatar>
                          <Box sx={{
                            bgcolor: "rgba(245, 158, 11, 0.08)",
                            color: "#f59e0b",
                            px: 1,
                            py: 0.25,
                            borderRadius: "4px",
                            fontSize: "0.65rem",
                            fontWeight: 800,
                            textTransform: "uppercase"
                          }}>
                            Pending Review
                          </Box>
                        </Box>

                        <Typography sx={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.95rem", mb: 0.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {name}
                        </Typography>

                        <Typography sx={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 700, mb: 0.2 }}>
                          {empId} • {dept}
                        </Typography>

                        <Typography sx={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 500 }}>
                          Academic Year {year}
                        </Typography>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>

              <IconButton
                onClick={handleNextCarousel}
                disabled={carouselIndex >= pendingList.length - 3}
                sx={{
                  bgcolor: "var(--bg-paper)",
                  border: "1px solid var(--border-color)",
                  width: 40,
                  height: 40,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  "&:hover": { bgcolor: "var(--bg-panel)" },
                  "&.Mui-disabled": { opacity: 0.3 }
                }}
              >
                <ChevronRight />
              </IconButton>
            </Box>
          </Card> */}

          {/* Faculty Profile Card */}
          <Card sx={{
            borderRadius: "20px",
            background: "var(--bg-panel)",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-premium)",
            p: 3
          }}>
            <Grid container spacing={3} alignItems="center">
              <Grid xs={12} md={8} sx={{ display: "flex", gap: 3, alignItems: "center", flexWrap: { xs: "wrap", sm: "nowrap" } }}>
                <Avatar
                  src={getFacultyImage()}
                  imgProps={{
                    style: {
                      imageRendering: "-webkit-optimize-contrast"
                    }
                  }}
                  sx={{
                    width: 90,
                    height: 90,
                    bgcolor: "rgba(124, 58, 237, 0.08)",
                    color: "#7c3aed",
                    fontWeight: 700,
                    fontSize: "2rem",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.05)",
                    border: "3px solid var(--border-color)"
                  }}
                >
                  {selectedAppraisal.personalInfoSnapshot?.name?.charAt(0) || selectedAppraisal.facultyId?.name?.charAt(0)}
                </Avatar>

                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1, flexWrap: "wrap" }}>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2 }}>
                      {selectedAppraisal.personalInfoSnapshot?.name || selectedAppraisal.facultyId?.name}
                    </Typography>
                    <Box sx={{
                      bgcolor: selectedAppraisal.status?.startsWith("Approved by") ? "rgba(16, 185, 129, 0.08)" : "rgba(245, 158, 11, 0.08)",
                      color: selectedAppraisal.status?.startsWith("Approved by") ? "#10b981" : "#f59e0b",
                      px: 1,
                      py: 0.25,
                      borderRadius: "4px",
                      fontSize: "0.65rem",
                      fontWeight: 800,
                      textTransform: "uppercase"
                    }}>
                      {selectedAppraisal.status?.startsWith("Approved by") ? "Approved" : "Pending Review"}
                    </Box>
                  </Box>

                  <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--text-secondary)", mb: 2 }}>
                    {selectedAppraisal.personalInfoSnapshot?.designation || "Faculty Member"} • {selectedAppraisal.personalInfoSnapshot?.departmentName}
                  </Typography>

                  {/* Detail row 1 */}
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                    {[
                      { icon: <Badge sx={{ fontSize: 16 }} />, label: selectedAppraisal.personalInfoSnapshot?.institutionId || selectedAppraisal.facultyId?.institutionId || "N/A" },
                      { icon: <School sx={{ fontSize: 16 }} />, label: selectedAppraisal.personalInfoSnapshot?.qualification || "Faculty" },
                      { icon: <CalendarToday sx={{ fontSize: 16 }} />, label: `Academic Year ${selectedAppraisal.academicYearId?.year || "N/A"}` },
                      { icon: <AccessTime sx={{ fontSize: 16 }} />, label: getRelativeTime(selectedAppraisal.updatedAt || selectedAppraisal.createdAt) }
                    ].map((b, i) => (
                      <Box key={i} sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.8,
                        px: 1.5,
                        py: 0.6,
                        borderRadius: "8px",
                        border: "1px solid var(--border-color)",
                        bgcolor: "var(--bg-paper)",
                        color: "var(--text-secondary)",
                        fontSize: "0.75rem",
                        fontWeight: 700
                      }}>
                        {b.icon}
                        {b.label}
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Grid>

              {/* Contact/Metadata Grid Section */}
              <Grid xs={12} sx={{ width: "100%" }}>
                <Divider sx={{ my: 1 }} />
                <Grid container spacing={2} sx={{ pt: 1.5 }}>
                  {[
                    { icon: <Email sx={{ color: "#3b82f6" }} />, val: selectedAppraisal.facultyId?.email || "N/A", label: "Email" },
                    { icon: <Phone sx={{ color: "#10b981" }} />, val: selectedAppraisal.facultyId?.phone || "N/A", label: "Phone" },
                    { icon: <Business sx={{ color: "#a855f7" }} />, val: selectedAppraisal.facultyId?.college || "Aditya University", label: "Institution" },
                    { icon: <Place sx={{ color: "#ef4444" }} />, val: selectedAppraisal.facultyId?.college ? (selectedAppraisal.facultyId.college.includes("Pharm") ? "Surampalem, Kakinada" : "Surampalem, East Godavari") : "Surampalem, Andhra Pradesh", label: "Address" },
                    { icon: <Description sx={{ color: "#f59e0b" }} />, val: selectedAppraisal.personalInfoSnapshot?.orcidId || "N/A", label: "ORCID ID" },
                    { icon: <Science sx={{ color: "#06b6d4" }} />, val: selectedAppraisal.personalInfoSnapshot?.scopusId || "N/A", label: "Scopus ID" },
                    { icon: <Public sx={{ color: "#ef4444" }} />, val: selectedAppraisal.personalInfoSnapshot?.wosId || "N/A", label: "Web of Science ID" },
                    { icon: <School sx={{ color: "#3b82f6" }} />, val: selectedAppraisal.personalInfoSnapshot?.qualification || "N/A", label: "Qualification" }
                  ].map((item, idx) => (
                    <Grid xs={12} sm={6} md={3} key={idx}>
                      <Box sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: "12px",
                        bgcolor: "var(--bg-paper)",
                        border: "1px solid var(--border-color)",
                        height: "100%"
                      }}>
                        <Box sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 32,
                          height: 32,
                          borderRadius: "8px",
                          bgcolor: "var(--bg-panel)",
                          color: "inherit"
                        }}>
                          {item.icon}
                        </Box>
                        <Box sx={{ overflow: "hidden" }}>
                          <Typography variant="caption" sx={{ color: "var(--text-secondary)", display: "block", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase" }}>
                            {item.label}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 750, color: "var(--text-primary)", fontSize: "0.78rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {item.val}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </Card>

          {/* Grid Content for inputs and summary */}
          <Grid container spacing={3}>

            {/* Left Column: Evaluation Inputs */}
            <Grid xs={12} md={7.2}>
              <Card sx={{
                borderRadius: "20px",
                background: "var(--bg-panel)",
                border: "1px solid var(--border-color)",
                p: 3,
                boxShadow: "var(--shadow-premium)",
                height: "100%"
              }}>
                {/* Header */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4, flexWrap: "wrap", gap: 1.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      bgcolor: "rgba(124, 58, 237, 0.08)",
                      color: "#7c3aed"
                    }}>
                      <Edit fontSize="small" />
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                      Evaluation Inputs
                    </Typography>
                  </Box>
                </Box>

                {/* Citations */}
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "var(--text-primary)", mb: 0.5 }}>
                      1. Scopus Citations ({citationYear})
                    </Typography>
                    <Typography variant="caption" sx={{ color: "var(--text-secondary)", display: "block", mb: 2, fontWeight: 500 }}>
                      Enter total Scopus citations manually
                    </Typography>

                    <TextField
                      type="number"
                      value={citations}
                      onChange={(e) => setCitations(e.target.value)}
                      disabled={selectedAppraisal?.status?.startsWith("Approved by")}
                      fullWidth
                      placeholder="e.g. 120"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end" sx={{ pl: 1.5, borderLeft: "1px solid var(--border-color)", height: "30px" }}>
                            <Typography sx={{ fontWeight: 700, color: "var(--text-secondary)", mr: 1, fontSize: "0.85rem" }}>Citations</Typography>
                          </InputAdornment>
                        ),
                        sx: {
                          fontSize: "1.25rem",
                          fontWeight: 750,
                          borderRadius: "12px",
                          background: "var(--bg-paper)",
                          height: "56px"
                        }
                      }}
                    />

                    <Box sx={{
                      bgcolor: "rgba(124, 58, 237, 0.05)",
                      color: "#7c3aed",
                      p: 1.5,
                      borderRadius: "8px",
                      fontWeight: 750,
                      fontSize: "0.82rem",
                      mt: 1.5,
                      mb: 1.5
                    }}>
                      Rate: {(activeConfig?.research?.citationRate ?? 0.2).toFixed(2)} points per citation
                    </Box>


                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1.2, px: 0.5 }}>
                      <Typography sx={{ fontWeight: 700, color: "#7c3aed", fontSize: "0.95rem" }}>Citation Points</Typography>
                      <Typography sx={{ fontWeight: 850, color: "#7c3aed", fontSize: "1.15rem" }}>
                        {citationPoints.toFixed(2)} pts
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  {/* H-Index */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "var(--text-primary)", mb: 0.5 }}>
                      2. H-Index (Scopus)
                    </Typography>
                    <Typography variant="caption" sx={{ color: "var(--text-secondary)", display: "block", mb: 2, fontWeight: 500 }}>
                      Enter H-Index values manually for both years
                    </Typography>

                    <Grid container spacing={2} alignItems="center" sx={{ mt: 1 }}>
                      <Grid xs={5}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "var(--text-secondary)", display: "block", mb: 0.8 }}>H-Index {prevYearLabel}</Typography>
                        <TextField
                          type="number"
                          value={hIndexPrevYear}
                          onChange={(e) => setHIndexPrevYear(e.target.value)}
                          disabled={selectedAppraisal?.status?.startsWith("Approved by")}
                          fullWidth
                          placeholder="e.g. 8"
                          InputProps={{ sx: { borderRadius: "10px", fontWeight: 750, background: "var(--bg-paper)" } }}
                        />
                      </Grid>
                      <Grid xs={2} sx={{ display: "flex", justifyContent: "center", pt: "28px !important" }}>
                        <East sx={{ color: "var(--text-secondary)", fontSize: 20 }} />
                      </Grid>
                      <Grid xs={5}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "var(--text-secondary)", display: "block", mb: 0.8 }}>H-Index {currentYearLabel}</Typography>
                        <TextField
                          type="number"
                          value={hIndexCurrentYear}
                          onChange={(e) => setHIndexCurrentYear(e.target.value)}
                          disabled={selectedAppraisal?.status?.startsWith("Approved by")}
                          fullWidth
                          placeholder="e.g. 10"
                          InputProps={{ sx: { borderRadius: "10px", fontWeight: 750, background: "var(--bg-paper)" } }}
                        />
                      </Grid>
                    </Grid>

                    <Box sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      p: 1.8,
                      borderRadius: "10px",
                      border: "1px solid var(--border-color)",
                      bgcolor: "var(--bg-paper)",
                      mt: 2,
                      mb: 2
                    }}>
                      <Typography sx={{ fontWeight: 700, color: "var(--text-secondary)", fontSize: "0.85rem" }}>H-Index Raise</Typography>
                      <Typography sx={{ fontWeight: 850, color: "#10b981", fontSize: "1.1rem" }}>{hIndexRaise}</Typography>
                    </Box>

                    {/* Rate dynamic text */}
                    {(() => {
                      const h25 = Number(hIndexCurrentYear) || 0;
                      const lowRate = activeConfig?.research?.hIndexRateLow ?? 1;
                      const midRate = activeConfig?.research?.hIndexRateMid ?? 2;
                      const highRate = activeConfig?.research?.hIndexRateHigh ?? 4;

                      let dynamicRateText = "";
                      if (h25 >= 5 && h25 <= 10) {
                        dynamicRateText = `Rate: ${midRate} points per index (Based on ${currentYearLabel} H-Index range 5-10)`;
                      } else if (h25 > 10) {
                        dynamicRateText = `Rate: ${highRate} points per index (Based on ${currentYearLabel} H-Index range >10)`;
                      } else {
                        dynamicRateText = `Rate: ${lowRate} points per index (Based on ${currentYearLabel} H-Index range 0-4)`;
                      }

                      return (
                        <Box sx={{
                          bgcolor: "rgba(124, 58, 237, 0.05)",
                          color: "#7c3aed",
                          p: 1.5,
                          borderRadius: "8px",
                          fontWeight: 750,
                          fontSize: "0.82rem",
                          mb: 1.5
                        }}>
                          {dynamicRateText}
                        </Box>
                      );
                    })()}


                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1.2, px: 0.5 }}>
                      <Typography sx={{ fontWeight: 700, color: "#7c3aed", fontSize: "0.95rem" }}>H-Index Points</Typography>
                      <Typography sx={{ fontWeight: 850, color: "#7c3aed", fontSize: "1.15rem" }}>
                        {hIndexPoints.toFixed(2)} pts
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  {/* Evaluator Comments */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "var(--text-primary)", mb: 0.5 }}>
                      3. Evaluator Comments
                    </Typography>
                    <Typography variant="caption" sx={{ color: "var(--text-secondary)", display: "block", mb: 2, fontWeight: 500 }}>
                      Add your comments and observations
                    </Typography>

                    <Box sx={{ position: "relative" }}>
                      <TextField
                        placeholder="Enter remarks regarding the research scoring..."
                        multiline
                        rows={4}
                        fullWidth
                        value={comments}
                        onChange={(e) => setComments(e.target.value.slice(0, 1000))}
                        disabled={selectedAppraisal.status?.startsWith("Approved by")}
                        InputProps={{
                          sx: {
                            borderRadius: "12px",
                            background: "var(--bg-paper)",
                            pb: 4,
                            fontSize: "0.9rem",
                            fontWeight: 500
                          }
                        }}
                      />
                      <Typography sx={{
                        position: "absolute",
                        bottom: 10,
                        right: 12,
                        fontSize: "0.75rem",
                        color: "var(--text-secondary)",
                        fontWeight: 700
                      }}>
                        {comments.length} / 1000
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              </Card>
            </Grid>

            {/* Right Column: Score Summary & Scoring Rules */}
            <Grid xs={12} md={4.8}>
              <Stack spacing={3} sx={{ height: "100%" }}>

                {/* Score Summary */}
                <Card sx={{
                  borderRadius: "20px",
                  background: "var(--bg-panel)",
                  border: "1px solid var(--border-color)",
                  p: 3,
                  boxShadow: "var(--shadow-premium)"
                }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                    <Box sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      bgcolor: "rgba(59, 130, 246, 0.08)",
                      color: "#3b82f6"
                    }}>
                      <ShowChart fontSize="small" />
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                      Research Score Summary
                    </Typography>
                  </Box>

                  {/* Total Score Gradient Card */}
                  <Card sx={{
                    borderRadius: "16px",
                    background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                    color: "#fff",
                    position: "relative",
                    overflow: "hidden",
                    p: 3,
                    mb: 3,
                    boxShadow: "0 10px 25px rgba(59, 130, 246, 0.2)"
                  }}>
                    <EmojiEvents sx={{
                      position: "absolute",
                      right: -10,
                      bottom: -15,
                      fontSize: "7.5rem",
                      opacity: 0.15,
                      color: "#fff",
                      transform: "rotate(15deg)"
                    }} />
                    <Box sx={{ zIndex: 1, position: "relative" }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.9, letterSpacing: "0.5px", textTransform: "uppercase", fontSize: "0.7rem" }}>
                        Total Research Score
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 900, my: 1, letterSpacing: "-1px" }}>
                        {(citationPoints + hIndexPoints).toFixed(2)}
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.9, fontSize: "0.7rem" }}>
                        Total Points Earned
                      </Typography>
                    </Box>
                  </Card>

                  {/* Breakdown Rows */}
                  <Stack spacing={2.5}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 32,
                          height: 32,
                          borderRadius: "8px",
                          bgcolor: "rgba(59, 130, 246, 0.08)",
                          color: "#3b82f6"
                        }}>
                          <Article fontSize="small" />
                        </Box>
                        <Typography sx={{ fontWeight: 600, color: "var(--text-secondary)", fontSize: "0.85rem" }}>Citation Points</Typography>
                      </Box>
                      <Typography sx={{ fontWeight: 800, color: "#3b82f6", fontSize: "0.95rem" }}>
                        {citationPoints.toFixed(2)} pts
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 32,
                          height: 32,
                          borderRadius: "8px",
                          bgcolor: "rgba(139, 92, 246, 0.08)",
                          color: "#8b5cf6"
                        }}>
                          <ShowChart fontSize="small" />
                        </Box>
                        <Typography sx={{ fontWeight: 600, color: "var(--text-secondary)", fontSize: "0.85rem" }}>H-Index Points</Typography>
                      </Box>
                      <Typography sx={{ fontWeight: 800, color: "#3b82f6", fontSize: "0.95rem" }}>
                        {hIndexPoints.toFixed(2)} pts
                      </Typography>
                    </Box>

                    <Divider />

                    {/* <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 32,
                          height: 32,
                          borderRadius: "8px",
                          bgcolor: "rgba(100, 116, 139, 0.08)",
                          color: "#64748b"
                        }}>
                          <Shield fontSize="small" />
                        </Box>
                        <Typography sx={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.85rem" }}>Maximum Possible</Typography>
                      </Box>
                      <Typography sx={{ fontWeight: 850, color: "var(--text-primary)", fontSize: "0.95rem" }}>100.00 pts</Typography>
                    </Box> */}
                  </Stack>
                </Card>

                {/* Scoring Rules */}
                <Card sx={{
                  borderRadius: "20px",
                  background: "var(--bg-panel)",
                  border: "1px solid var(--border-color)",
                  p: 3,
                  boxShadow: "var(--shadow-premium)",
                  flexGrow: 1
                }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                    <Box sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      bgcolor: "rgba(16, 185, 129, 0.08)",
                      color: "#10b981"
                    }}>
                      <Rule fontSize="small" />
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                      Scoring Rules
                    </Typography>
                  </Box>

                  {/* Citation Rule */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "var(--text-primary)", mb: 0.5, fontSize: "0.85rem" }}>
                      Citation Scoring
                    </Typography>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
                      <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 500, fontSize: "0.82rem" }}>
                        Points = Citations × Rate
                      </Typography>
                      <Chip
                        label={`Rate: ${(activeConfig?.research?.citationRate ?? 0.2).toFixed(2)}`}
                        size="small"
                        sx={{
                          bgcolor: "rgba(16, 185, 129, 0.08)",
                          color: "#10b981",
                          fontWeight: 800,
                          borderRadius: "6px"
                        }}
                      />
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* H-Index Rule & Table */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "var(--text-primary)", mb: 0.5, fontSize: "0.85rem" }}>
                      H-Index Scoring <Typography component="span" sx={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600 }}>(Based on {currentYearLabel} H-Index)</Typography>
                    </Typography>

                    {/* Rules table */}
                    {(() => {
                      const h25Val = Number(hIndexCurrentYear) || 0;
                      const rowStyle = (rangeType) => {
                        let isActive = false;
                        if (rangeType === "low" && h25Val < 5) isActive = true;
                        if (rangeType === "mid" && h25Val >= 5 && h25Val <= 10) isActive = true;
                        if (rangeType === "high" && h25Val > 10) isActive = true;

                        return isActive ? {
                          bgcolor: "rgba(59, 130, 246, 0.06)",
                          "& td": {
                            color: "#3b82f6 !important",
                            fontWeight: "800 !important",
                            borderBottom: "1px solid rgba(59, 130, 246, 0.1) !important"
                          }
                        } : {};
                      };

                      const lowRate = activeConfig?.research?.hIndexRateLow ?? 1;
                      const midRate = activeConfig?.research?.hIndexRateMid ?? 2;
                      const highRate = activeConfig?.research?.hIndexRateHigh ?? 4;

                      return (
                        <TableContainer component={Paper} sx={{ mt: 1.5, borderRadius: "10px", border: "1px solid var(--border-color)", background: "var(--bg-paper)", boxShadow: "none" }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ bgcolor: "var(--bg-panel)" }}>
                                <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", color: "var(--text-secondary)" }}>{currentYearLabel} H-Index Range</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", color: "var(--text-secondary)" }}>Points per Index Raise</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              <TableRow sx={rowStyle("low")}>
                                <TableCell sx={{ fontSize: "0.78rem", py: 1.2, fontWeight: 500 }}>0 - 4</TableCell>
                                <TableCell sx={{ fontSize: "0.78rem", py: 1.2, fontWeight: 700 }}>{lowRate} Point</TableCell>
                              </TableRow>
                              <TableRow sx={rowStyle("mid")}>
                                <TableCell sx={{ fontSize: "0.78rem", py: 1.2, fontWeight: 500 }}>5 - 10</TableCell>
                                <TableCell sx={{ fontSize: "0.78rem", py: 1.2, fontWeight: 700 }}>{midRate} Points</TableCell>
                              </TableRow>
                              <TableRow sx={rowStyle("high")}>
                                <TableCell sx={{ fontSize: "0.78rem", py: 1.2, fontWeight: 500 }}>11 and above</TableCell>
                                <TableCell sx={{ fontSize: "0.78rem", py: 1.2, fontWeight: 700 }}>{highRate} Points</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </TableContainer>
                      );
                    })()}

                    <Typography sx={{ color: "var(--text-secondary)", fontSize: "0.72rem", fontWeight: 600, display: "block", mt: 1.5, textAlign: "center" }}>
                      Points = Index Raise × Applicable Rate
                    </Typography>
                  </Box>
                </Card>
              </Stack>
            </Grid>
          </Grid>

          {/* Bottom Sticky Action Bar */}
          <Box sx={{
            position: "sticky",
            bottom: -32,
            left: 0,
            right: 0,
            mx: { xs: -2, md: -4 },
            mb: { xs: -1.5, md: -4 },
            borderTop: "1px solid var(--border-color)",
            bgcolor: "var(--bg-paper)",
            p: 2.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 -4px 20px rgba(0,0,0,0.04)",
            zIndex: 1000,
            borderRadius: "0 0 16px 16px"
          }}>
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "0.68rem" }}>
                Total Score
              </Typography>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
                <Typography variant="h5" sx={{ fontWeight: 900, color: "var(--text-primary)" }}>
                  {(citationPoints + hIndexPoints).toFixed(2)}
                </Typography>
              </Box>
            </Box>

            {selectedAppraisal.status !== "Completed" ? (
              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
 variant="contained"
 startIcon={<CheckCircle sx={{ fontSize: "1.1rem" }} />}
 onClick={() => handleSaveScoring(false)}
 disabled={loading}
 sx={{
 textTransform: "none",
 fontWeight: 700,
 
 px: 3.5,
 py: 1.2,
 color: "#fff",
 bgcolor: "#3b82f6",
 fontSize: "0.85rem",
 boxShadow: "0 4px 12px rgba(59, 130, 246, 0.2)",
 "&:hover": {
 bgcolor: "#2563eb",
 boxShadow: "0 6px 16px rgba(59, 130, 246, 0.3)"
 }
 }}
 >
                  Finalize Evaluation
                </Button>
              </Box>
            ) : (
              <Box sx={{
                bgcolor: "rgba(16, 185, 129, 0.08)",
                color: "#10b981",
                px: 2,
                py: 1,
                borderRadius: "8px",
                fontWeight: 800,
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: 1
              }}>
                <CheckCircle sx={{ fontSize: "1.2rem" }} />
                This appraisal has been finalized and is read-only.
              </Box>
            )}
          </Box>
        </Stack>
      )}

    </Box>
  );
};

export default AppraisalResearchScoring;
