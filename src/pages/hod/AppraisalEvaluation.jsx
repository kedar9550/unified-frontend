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
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Alert,
  Chip,
  Stack,
  IconButton
} from "@mui/material";
import { RateReview, CheckCircle, Reply, Visibility, OpenInNew } from "@mui/icons-material";
import axiosInstance from "../../api/axios";
import { toast } from "sonner";

const PARAMETERS = [
  { id: 1, text: "Commitment- Unwavering dedication to student growth and institutional progress, consistently completing all work with diligence." },
  { id: 2, text: "Ownership – Going beyond the assigned task reflects accountability, integrity, and leadership potential by anticipating challenges, taking corrective action without waiting for instructions, and consistently striving for excellence." },
  { id: 3, text: "Development- The commitment to continuous self-improvement and proactively keeping knowledge and skills up-to-date." },
  { id: 4, text: "Initiative- A self-motivated teacher who improves teaching methods and adopts new ideas independently." },
  { id: 5, text: "Responsibility- Understands duties and takes ownership of assigned tasks." },
  { id: 6, text: "Punctuality - Values others’ time by being prompt to classes, assigned duties and completing the tasks." },
  { id: 7, text: "Communication- Engaging in respectful, professional dialogue with students, colleagues, and leadership." },
  { id: 8, text: "Teamwork- Demonstrates effective collaboration and partnership with colleagues." },
  { id: 9, text: "Leadership- Mentors junior faculty, guides students, and leads institutional projects, demonstrating clear direction and active listening skills." },
  { id: 10, text: "Student Mentoring - Demonstrates empathy, approachability, and support for students’ academic and personal development." }
];

const AppraisalEvaluation = () => {
  const [pendingList, setPendingList] = useState([]);
  const [selectedAppraisal, setSelectedAppraisal] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Evaluation States
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState("");

  // Detailed Section verification remarks
  const [proctoringRemarks, setProctoringRemarks] = useState("");
  const [resUtRemarks, setResUtRemarks] = useState({}); // { itemId: remarks }
  const [contRemarks, setContRemarks] = useState({}); // { itemId: remarks }
  const [adminRemarks, setAdminRemarks] = useState({}); // { roleName: remarks }

  // HOD actions on individual sections
  const handleProctoringHODAction = async (id, action, remarks) => {
    try {
      const res = await axiosInstance.put(`/api/faculty-proctoring/hod-action/${id}`, { action, remarks });
      if (res.data?.success) {
        toast.success(`Proctoring entry ${action.toLowerCase()}d successfully.`);
        setSelectedAppraisal(prev => ({
          ...prev,
          proctoringDetail: { ...prev.proctoringDetail, status: action === "Approve" ? "Approved" : "Rejected", remarks }
        }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update proctoring entry.");
    }
  };

  const handleResUtHODAction = async (id, action, comment) => {
    try {
      const res = await axiosInstance.put(`/api/value-addition/resource-utilization/hod-action/${id}`, { action, comment });
      if (res.data?.success) {
        toast.success(`Resource Utilization entry ${action.toLowerCase()}d successfully.`);
        setSelectedAppraisal(prev => ({
          ...prev,
          resourceUtilizationDetails: prev.resourceUtilizationDetails.map(item =>
            item._id === id ? { ...item, status: action === "Approve" ? "Approved" : "Rejected", hodComment: comment } : item
          )
        }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update entry.");
    }
  };

  const handleContHODAction = async (id, action, comment) => {
    try {
      const res = await axiosInstance.put(`/api/value-addition/contribution/hod-action/${id}`, { action, comment });
      if (res.data?.success) {
        toast.success(`Expertise / Contribution entry ${action.toLowerCase()}d successfully.`);
        setSelectedAppraisal(prev => ({
          ...prev,
          contributionDetails: prev.contributionDetails.map(item =>
            item._id === id ? { ...item, status: action === "Approve" ? "Approved" : "Rejected", hodComment: comment } : item
          )
        }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update entry.");
    }
  };

  const handleAdminHODAction = async (id, roleName, action, remarks) => {
    try {
      const res = await axiosInstance.put(`/api/faculty-administration/hod-action-role/${id}`, { roleName, action, remarks });
      if (res.data?.success) {
        toast.success(`Administrative role '${roleName}' ${action.toLowerCase()}d successfully.`);
        setSelectedAppraisal(prev => ({
          ...prev,
          administrationDetail: res.data.data
        }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update administrative role.");
    }
  };

  const getAppraisalValidationStatus = () => {
    if (!selectedAppraisal) return { hasPending: false, hasRejected: false };

    const hasPendingProctoring = selectedAppraisal.proctoringDetail?.status === "Pending";
    const hasRejectedProctoring = selectedAppraisal.proctoringDetail?.status === "Rejected";

    const hasPendingResUt = selectedAppraisal.resourceUtilizationDetails?.some(item => item.status === "Pending" || item.status === "Pending at HOD");
    const hasRejectedResUt = selectedAppraisal.resourceUtilizationDetails?.some(item => item.status === "Rejected");

    const hasPendingCont = selectedAppraisal.contributionDetails?.some(item => item.status === "Pending" || item.status === "Pending at HOD");
    const hasRejectedCont = selectedAppraisal.contributionDetails?.some(item => item.status === "Rejected");

    const hasPendingAdmin = selectedAppraisal.administrationDetail?.roles?.some(role => role.isResponsible && role.status === "Pending");
    const hasRejectedAdmin = selectedAppraisal.administrationDetail?.roles?.some(role => role.isResponsible && role.status === "Rejected");

    const hasPending = hasPendingProctoring || hasPendingResUt || hasPendingCont || hasPendingAdmin;
    const hasRejected = hasRejectedProctoring || hasRejectedResUt || hasRejectedCont || hasRejectedAdmin;

    return { hasPending, hasRejected };
  };

  const getStatusColor = (status) => {
    if (status === 'Approved') return { bg: "rgba(16, 185, 129, 0.1)", color: "#10b981" };
    if (status === 'Rejected') return { bg: "rgba(239, 68, 68, 0.1)", color: "#ef4444" };
    if (status === 'Pending at HOD' || status === 'Pending') return { bg: "rgba(232, 160, 0, 0.1)", color: "#e8a000" };
    return { bg: "rgba(100, 116, 139, 0.1)", color: "#64748b" }; // Draft
  };

  const getContCategoryName = (catId) => {
    const categories = {
      1: "Member of BOG / GB / AC / BOS",
      2: "Editorial Board Member (SCIE / Q1 / Q2)",
      3: "Editorial Board Member (ESCI / Q3 / Q4 / Proceedings)",
      4: "Awards (MHRD / AICTE / UGC / State / Top Inst)",
      5: "Awards (NGO / Trust / Others)",
      6: "Developed E-Content",
      7: "Certification on New Age Technologies",
      8: "Students Trained and Shortlisted for Finals",
      9: "Articles Published in Magazine / Newspaper",
      10: "Research Facility Establishment / Maintenance",
      11: "NPTEL Course Completion",
      12: "Coursera Course Completion",
      13: "FDP / Seminar Grant Sanctioned"
    };
    return categories[catId] || `Category ${catId}`;
  };

  const getContDescription = (category, item) => {
    const cat = parseInt(category);
    switch (cat) {
      case 1: return item.organizationName;
      case 2: return item.journalName;
      case 3: return item.journalConferenceName;
      case 4:
      case 5: return item.awardName;
      case 6: return item.courseName;
      case 7: return item.certificationName;
      case 8: return item.eventName;
      case 9: return item.articleTitle;
      case 10: return item.facilityName;
      case 11:
      case 12: return item.courseName;
      case 13: return item.grantName;
      default: return "";
    }
  };

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/api/appraisal/pending-hod");
      if (res.data && res.data.success) {
        setPendingList(res.data.data);
      }
    } catch (err) {
      toast.error("Failed to fetch pending appraisals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleSelectAppraisal = (appr) => {
    setSelectedAppraisal(appr);
    // Initialize ratings
    const initRatings = {};
    PARAMETERS.forEach(p => {
      initRatings[p.id] = 5; // default to 5
    });
    setRatings(initRatings);
    setComments("");
    setProctoringRemarks("");
    setResUtRemarks({});
    setContRemarks({});
    setAdminRemarks({});
  };

  const handleRatingChange = (paramId, score) => {
    setRatings(prev => ({
      ...prev,
      [paramId]: Number(score)
    }));
  };

  const calculateTotalScore = () => {
    let total = 0;
    Object.keys(ratings).forEach(k => {
      total += ratings[k];
    });
    return total;
  };

  const handleSubmitEvaluation = async (action) => {
    if (!selectedAppraisal) return;

    const formattedRatings = PARAMETERS.map(p => ({
      parameterId: p.id,
      parameterText: p.text,
      rating: ratings[p.id]
    }));

    setLoading(true);
    try {
      const res = await axiosInstance.put(`/api/appraisal/hod-evaluate/${selectedAppraisal._id}`, {
        interpersonalRatings: formattedRatings,
        comments,
        action // 'Approve' or 'Reject'
      });
      if (res.data && res.data.success) {
        toast.success(action === "Approve" ? "Appraisal approved and forwarded to R&D!" : "Appraisal sent back to faculty.");
        setSelectedAppraisal(null);
        fetchPending();
      }
    } catch (err) {
      toast.error("Failed to process appraisal action.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={4} sx={{ maxWidth: 1200, margin: "0 auto", animation: "fadeIn 0.5s ease" }}>
      
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 4, color: "var(--text-primary)" }}>
        HOD Appraisal Verification Desk
      </Typography>

      {!selectedAppraisal ? (
        <Card sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)" }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3, color: "var(--text-secondary)" }}>
              Pending Faculty Appraisals
            </Typography>

            <TableContainer component={Paper} sx={{ borderRadius: "12px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ background: "var(--bg-accent-4)" }}>
                    <TableCell sx={{ fontWeight: 700 }}>Faculty Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Employee ID</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Academic Year</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingList.length > 0 ? (
                    pendingList.map((appr) => (
                      <TableRow key={appr._id}>
                        <TableCell sx={{ fontWeight: 600 }}>{appr.facultyId?.name}</TableCell>
                        <TableCell>{appr.facultyId?.institutionId}</TableCell>
                        <TableCell>{appr.personalInfoSnapshot?.departmentName}</TableCell>
                        <TableCell>{appr.academicYearId?.year}</TableCell>
                        <TableCell align="center">
                          <Button 
                            variant="contained" 
                            size="small" 
                            startIcon={<RateReview />}
                            onClick={() => handleSelectAppraisal(appr)}
                            sx={{ textTransform: "none", fontWeight: 700 }}
                          >
                            Evaluate
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4, color: "var(--text-secondary)" }}>
                        No pending appraisals to verify.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={4}>
          
          {/* Faculty claimed points preview & Detailed Section Verification */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", mb: 4 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                    {selectedAppraisal.personalInfoSnapshot?.name}
                  </Typography>
                  <Button size="small" startIcon={<Reply />} onClick={() => setSelectedAppraisal(null)}>
                    Back to List
                  </Button>
                </Box>
                <Divider sx={{ mb: 3 }} />

                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: "var(--color-primary)" }}>
                  Self-Assessment Point Scores Summary:
                </Typography>
                {[
                  { label: "1. Teaching (Theory, Proctoring, Feedback, COs)", val: selectedAppraisal.teaching.totalClaimed, max: 80 },
                  { label: "2. Research (Publications, PhD, Books, Patents)", val: selectedAppraisal.research.totalClaimed, max: "N/A" },
                  { label: "3. Extension / Value addition", val: selectedAppraisal.valueAddition.totalClaimed, max: "N/A" },
                  { label: "4. Administrative Responsibilities", val: selectedAppraisal.administration.totalClaimed, max: 20 }
                ].map((item, idx) => (
                  <Box key={idx} sx={{ display: "flex", justifyContent: "space-between", py: 1.5, borderBottom: "1px solid var(--border-color)" }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--text-secondary)" }}>
                      {item.label}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--color-primary)" }}>
                      {item.val} {item.max !== "N/A" ? `/ ${item.max}` : ""}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>

            {/* Detailed Section Verification Card */}
            <Card sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)" }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: "var(--text-primary)" }}>
                  Detailed Section Verification
                </Typography>
                <Divider sx={{ mb: 3 }} />

                {/* 1.2 Proctoring Verification */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "var(--color-primary)", mb: 1.5 }}>
                    1.2 Proctoring Students' Pass Percentage
                  </Typography>
                  {selectedAppraisal.proctoringDetail ? (() => {
                    const proc = selectedAppraisal.proctoringDetail;
                    const statusColor = getStatusColor(proc.status);
                    return (
                      <Box sx={{ p: 2, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            Pass Percentage: {proc.passPercentage}% ({proc.studentsPassed}/{proc.studentsAppeared} passed, {proc.totalStudents} total)
                          </Typography>
                          <Chip label={proc.status} size="small" sx={{ bgcolor: statusColor.bg, color: statusColor.color, fontWeight: 800, borderRadius: "6px" }} />
                        </Box>
                        {proc.status === "Pending" ? (
                          <Box sx={{ mt: 2 }}>
                            <TextField
                              size="small"
                              fullWidth
                              placeholder="HOD feedback remarks..."
                              value={proctoringRemarks}
                              onChange={(e) => setProctoringRemarks(e.target.value)}
                              sx={{ mb: 1.5 }}
                            />
                            <Stack direction="row" spacing={2} justifyContent="flex-end">
                              <Button size="small" variant="outlined" color="error" onClick={() => handleProctoringHODAction(proc._id, "Reject", proctoringRemarks)}>Reject</Button>
                              <Button size="small" variant="contained" color="success" sx={{ color: "#fff" }} onClick={() => handleProctoringHODAction(proc._id, "Approve", proctoringRemarks)}>Approve</Button>
                            </Stack>
                          </Box>
                        ) : (
                          proc.remarks && (
                            <Typography variant="body2" sx={{ fontStyle: "italic", color: "var(--text-secondary)", mt: 1 }}>
                              HOD Remarks: "{proc.remarks}"
                            </Typography>
                          )
                        )}
                      </Box>
                    );
                  })() : (
                    <Typography variant="body2" color="var(--text-secondary)">No proctoring details claimed for this year.</Typography>
                  )}
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* 3.1 Resource Utilization Verification */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "var(--color-primary)", mb: 1.5 }}>
                    3.1 Resource Utilization Entries
                  </Typography>
                  {selectedAppraisal.resourceUtilizationDetails && selectedAppraisal.resourceUtilizationDetails.length > 0 ? (
                    selectedAppraisal.resourceUtilizationDetails.map((item, idx) => {
                      const statusColor = getStatusColor(item.status);
                      const backendURL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "");
                      const fileUrl = item.proof ? (item.proof.startsWith('http') ? item.proof : `${backendURL}${item.proof}`) : null;
                      return (
                        <Box key={item._id || idx} sx={{ p: 2, mb: 2, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                            <Typography variant="body2" sx={{ fontWeight: 800 }}>
                              {item.activityCategory} - {item.activityType}
                            </Typography>
                            <Chip label={item.status} size="small" sx={{ bgcolor: statusColor.bg, color: statusColor.color, fontWeight: 800, borderRadius: "6px" }} />
                          </Box>
                          <Typography variant="caption" color="var(--text-secondary)" display="block" mb={1}>
                            {item.activityCategory === "FDP" && item.activityType === "FDP Participant" ? "Course Name" : "Organization / Event"}: <strong>{item.organizationName}</strong> | Duration: {item.duration} Days ({new Date(item.fromDate).toLocaleDateString("en-IN")} to {new Date(item.toDate).toLocaleDateString("en-IN")})
                          </Typography>
                          {item.activityCategory === "FDP" && item.activityType === "FDP Participant" && (
                            <Box sx={{ mb: 1.5, p: 1.5, borderRadius: "6px", background: "rgba(0,0,0,0.02)", border: "1px dashed var(--border-color)" }}>
                              <Typography variant="caption" color="var(--text-secondary)" display="block">
                                Organizing Category: <strong style={{ color: "var(--color-primary)" }}>{item.organizingInstitutionCategory}</strong> | Location: <strong>{item.location}</strong>
                              </Typography>
                              {item.organizingInstitutionCategory === "MHRD R&D Lab" && item.labName && (
                                <Typography variant="caption" color="var(--text-secondary)" display="block">
                                  Lab Name: <strong>{item.labName}</strong>
                                </Typography>
                              )}
                              {item.organizingInstitutionCategory === "Govt. University" && item.universityName && (
                                <Typography variant="caption" color="var(--text-secondary)" display="block">
                                  University Name: <strong>{item.universityName}</strong>
                                </Typography>
                              )}
                              {item.organizingInstitutionCategory === "NIRF Ranked Institute (Below 200)" && item.instituteName && (
                                <Typography variant="caption" color="var(--text-secondary)" display="block">
                                  Institute Name: <strong>{item.instituteName}</strong> | NIRF Rank: <strong>{item.nirfRank}</strong>
                                </Typography>
                              )}
                            </Box>
                          )}
                          {item.sessionsConducted !== undefined && (
                            <Typography variant="caption" color="var(--text-secondary)" display="block">
                              Sessions Conducted: {item.sessionsConducted}
                            </Typography>
                          )}
                          {item.daysParticipated !== undefined && (
                            <Typography variant="caption" color="var(--text-secondary)" display="block">
                              Days Participated: {item.daysParticipated}
                            </Typography>
                          )}
                          {item.remarks && (
                            <Typography variant="body2" sx={{ mt: 1, fontSize: "0.85rem" }}>
                              Faculty Remarks: {item.remarks}
                            </Typography>
                          )}
                          {fileUrl && (
                            <Button
                              size="small"
                              startIcon={<OpenInNew />}
                              onClick={() => window.open(fileUrl, '_blank')}
                              sx={{ mt: 1, textTransform: "none", py: 0.2 }}
                            >
                              View Proof Document
                            </Button>
                          )}
                          {(item.status === "Pending" || item.status === "Pending at HOD") ? (
                            <Box sx={{ mt: 2 }}>
                              <TextField
                                size="small"
                                fullWidth
                                placeholder="HOD feedback remarks..."
                                value={resUtRemarks[item._id] || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setResUtRemarks(p => ({ ...p, [item._id]: val }));
                                }}
                                sx={{ mb: 1.5 }}
                              />
                              <Stack direction="row" spacing={2} justifyContent="flex-end">
                                <Button size="small" variant="outlined" color="error" onClick={() => handleResUtHODAction(item._id, "Reject", resUtRemarks[item._id] || "")}>Reject</Button>
                                <Button size="small" variant="contained" color="success" sx={{ color: "#fff" }} onClick={() => handleResUtHODAction(item._id, "Approve", resUtRemarks[item._id] || "")}>Approve</Button>
                              </Stack>
                            </Box>
                          ) : (
                            item.hodComment && (
                              <Typography variant="body2" sx={{ fontStyle: "italic", color: "var(--text-secondary)", mt: 1 }}>
                                HOD Remarks: "{item.hodComment}"
                              </Typography>
                            )
                          )}
                        </Box>
                      );
                    })
                  ) : (
                    <Typography variant="body2" color="var(--text-secondary)">No resource utilization entries claimed for this year.</Typography>
                  )}
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* 3.2 Contribution Verification */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "var(--color-primary)", mb: 1.5 }}>
                    3.2 Expertise / Contribution Entries
                  </Typography>
                  {selectedAppraisal.contributionDetails && selectedAppraisal.contributionDetails.length > 0 ? (
                    selectedAppraisal.contributionDetails.map((item, idx) => {
                      const statusColor = getStatusColor(item.status);
                      const backendURL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "");
                      const fileUrl = item.proof ? (item.proof.startsWith('http') ? item.proof : `${backendURL}${item.proof}`) : null;
                      return (
                        <Box key={item._id || idx} sx={{ p: 2, mb: 2, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                            <Typography variant="body2" sx={{ fontWeight: 800 }}>
                              {getContCategoryName(item.category)}
                            </Typography>
                            <Chip label={item.status} size="small" sx={{ bgcolor: statusColor.bg, color: statusColor.color, fontWeight: 800, borderRadius: "6px" }} />
                          </Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--text-secondary)" }}>
                            Detail: {getContDescription(item.category, item)}
                          </Typography>
                          {item.duration && (
                            <Typography variant="caption" color="var(--text-secondary)" display="block" mt={0.5}>
                              Duration: {item.duration}
                            </Typography>
                          )}
                          {item.fromDate && (
                            <Typography variant="caption" color="var(--text-secondary)" display="block">
                              Dates: {new Date(item.fromDate).toLocaleDateString("en-IN")} to {new Date(item.toDate).toLocaleDateString("en-IN")}
                            </Typography>
                          )}
                          {item.awardDate && (
                            <Typography variant="caption" color="var(--text-secondary)" display="block">
                              Date: {new Date(item.awardDate).toLocaleDateString("en-IN")}
                            </Typography>
                          )}
                          {item.eventDate && (
                            <Typography variant="caption" color="var(--text-secondary)" display="block">
                              Date: {new Date(item.eventDate).toLocaleDateString("en-IN")}
                            </Typography>
                          )}
                          {item.publicationDate && (
                            <Typography variant="caption" color="var(--text-secondary)" display="block">
                              Date: {new Date(item.publicationDate).toLocaleDateString("en-IN")}
                            </Typography>
                          )}
                          {item.url && (
                            <Typography variant="caption" color="var(--text-secondary)" display="block">
                              Link: <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)" }}>{item.url}</a>
                            </Typography>
                          )}
                          {fileUrl && (
                            <Button
                              size="small"
                              startIcon={<OpenInNew />}
                              onClick={() => window.open(fileUrl, '_blank')}
                              sx={{ mt: 1, textTransform: "none", py: 0.2 }}
                            >
                              View Proof Document
                            </Button>
                          )}
                          {(item.status === "Pending" || item.status === "Pending at HOD") ? (
                            <Box sx={{ mt: 2 }}>
                              <TextField
                                size="small"
                                fullWidth
                                placeholder="HOD feedback remarks..."
                                value={contRemarks[item._id] || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setContRemarks(p => ({ ...p, [item._id]: val }));
                                }}
                                sx={{ mb: 1.5 }}
                              />
                              <Stack direction="row" spacing={2} justifyContent="flex-end">
                                <Button size="small" variant="outlined" color="error" onClick={() => handleContHODAction(item._id, "Reject", contRemarks[item._id] || "")}>Reject</Button>
                                <Button size="small" variant="contained" color="success" sx={{ color: "#fff" }} onClick={() => handleContHODAction(item._id, "Approve", contRemarks[item._id] || "")}>Approve</Button>
                              </Stack>
                            </Box>
                          ) : (
                            item.hodComment && (
                              <Typography variant="body2" sx={{ fontStyle: "italic", color: "var(--text-secondary)", mt: 1 }}>
                                HOD Remarks: "{item.hodComment}"
                              </Typography>
                            )
                          )}
                        </Box>
                      );
                    })
                  ) : (
                    <Typography variant="body2" color="var(--text-secondary)">No expertise or contribution entries claimed for this year.</Typography>
                  )}
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* 4. Administrative Responsibilities Verification */}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "var(--color-primary)", mb: 1.5 }}>
                    4. Administrative Responsibilities
                  </Typography>
                  {selectedAppraisal.administrationDetail && selectedAppraisal.administrationDetail.roles?.some(r => r.isResponsible) ? (() => {
                    const admin = selectedAppraisal.administrationDetail;
                    return admin.roles.filter(r => r.isResponsible).map((role, idx) => {
                      const statusColor = getStatusColor(role.status);
                      return (
                        <Box key={idx} sx={{ p: 2, mb: 2, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                            <Typography variant="body2" sx={{ fontWeight: 800 }}>
                              {role.roleName}
                            </Typography>
                            <Chip label={role.status} size="small" sx={{ bgcolor: statusColor.bg, color: statusColor.color, fontWeight: 800, borderRadius: "6px" }} />
                          </Box>
                          <Typography variant="caption" color="var(--text-secondary)" display="block">
                            Level: <strong>{role.level}</strong>
                          </Typography>
                          {role.details && (
                            <Typography variant="body2" sx={{ mt: 1, fontSize: "0.85rem" }}>
                              Work details: {role.details}
                            </Typography>
                          )}
                          {role.status === "Pending" ? (
                            <Box sx={{ mt: 2 }}>
                              <TextField
                                size="small"
                                fullWidth
                                placeholder="HOD feedback remarks..."
                                value={adminRemarks[role.roleName] || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setAdminRemarks(p => ({ ...p, [role.roleName]: val }));
                                }}
                                sx={{ mb: 1.5 }}
                              />
                              <Stack direction="row" spacing={2} justifyContent="flex-end">
                                <Button size="small" variant="outlined" color="error" onClick={() => handleAdminHODAction(admin._id, role.roleName, "Reject", adminRemarks[role.roleName] || "")}>Reject</Button>
                                <Button size="small" variant="contained" color="success" sx={{ color: "#fff" }} onClick={() => handleAdminHODAction(admin._id, role.roleName, "Approve", adminRemarks[role.roleName] || "")}>Approve</Button>
                              </Stack>
                            </Box>
                          ) : (
                            role.remarks && (
                              <Typography variant="body2" sx={{ fontStyle: "italic", color: "var(--text-secondary)", mt: 1 }}>
                                HOD Remarks: "{role.remarks}"
                              </Typography>
                            )
                          )}
                        </Box>
                      );
                    });
                  })() : (
                    <Typography variant="body2" color="var(--text-secondary)">No administrative responsibilities declared for this year.</Typography>
                  )}
                </Box>

              </CardContent>
            </Card>
          </Grid>

          {/* HOD Evaluation card */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)" }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: "var(--text-primary)" }}>
                  II. Interpersonal Skills
                </Typography>
                <Typography variant="caption" color="var(--text-secondary)" sx={{ display: "block", mb: 3 }}>
                  Rate the faculty on a 5-point scale (5 - Best, 1 - Poorest) for each parameter.
                </Typography>
                <Divider sx={{ mb: 3 }} />

                {PARAMETERS.map((p) => (
                  <Box key={p.id} sx={{ mb: 3.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 1, color: "var(--text-primary)" }}>
                      {p.id}. {p.text}
                    </Typography>
                    <FormControl component="fieldset">
                      <RadioGroup
                        row
                        value={ratings[p.id] || 5}
                        onChange={(e) => handleRatingChange(p.id, e.target.value)}
                      >
                        {[1, 2, 3, 4, 5].map((val) => (
                          <FormControlLabel 
                            key={val} 
                            value={val} 
                            control={<Radio size="small" />} 
                            label={<Typography sx={{ fontSize: "0.85rem", fontWeight: 700 }}>{val}</Typography>}
                            sx={{ mr: 3 }}
                          />
                        ))}
                      </RadioGroup>
                    </FormControl>
                  </Box>
                ))}

                <Alert severity="info" sx={{ mb: 3, borderRadius: "10px" }}>
                  <strong>Total Interpersonal Score:</strong> {calculateTotalScore()} / 50 points.
                </Alert>

                <TextField
                  label="HOD Evaluation Remarks / Comments"
                  multiline
                  rows={3}
                  fullWidth
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  sx={{ mb: 4 }}
                />

                {(() => {
                  const validationStatus = getAppraisalValidationStatus();
                  return (
                    <>
                      {validationStatus.hasPending && (
                        <Alert severity="warning" sx={{ mb: 2, borderRadius: "10px" }}>
                          Please approve or reject all pending sections first.
                        </Alert>
                      )}
                      {validationStatus.hasRejected && (
                        <Alert severity="error" sx={{ mb: 2, borderRadius: "10px" }}>
                          Some sections have been rejected. If you reject any section, you must select "Send Back for Corrections" to send the appraisal back to the faculty member.
                        </Alert>
                      )}
                      <Box display="flex" gap={2} justifyContent="flex-end">
                        <Button 
                          variant="outlined" 
                          color="error" 
                          onClick={() => handleSubmitEvaluation("Reject")}
                          disabled={loading}
                          sx={{ textTransform: "none", fontWeight: 700 }}
                        >
                          Send Back for Corrections
                        </Button>
                        <Button 
                          variant="contained" 
                          color="success" 
                          startIcon={<CheckCircle />}
                          onClick={() => handleSubmitEvaluation("Approve")}
                          disabled={loading || validationStatus.hasPending || validationStatus.hasRejected}
                          sx={{ textTransform: "none", fontWeight: 700, color: "#fff" }}
                        >
                          Approve & Forward to R&D
                        </Button>
                      </Box>
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

    </Box>
  );
};

export default AppraisalEvaluation;
