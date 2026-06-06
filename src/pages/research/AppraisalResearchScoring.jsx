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
  Alert,
  Tooltip,
  Avatar,
  Chip,
  Stack
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
  Badge
} from "@mui/icons-material";
import axiosInstance from "../../api/axios";
import { toast } from "sonner";

const AppraisalResearchScoring = () => {
  const [pendingList, setPendingList] = useState([]);
  const [selectedAppraisal, setSelectedAppraisal] = useState(null);
  const [loading, setLoading] = useState(false);

  // Scoring States
  const [citations, setCitations] = useState("");
  const [citationPoints, setCitationPoints] = useState(0);
  const [hIndex2024, setHIndex2024] = useState("");
  const [hIndex2025, setHIndex2025] = useState("");
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
      toast.error("Failed to fetch pending appraisals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleSelectAppraisal = async (appr) => {
    setSelectedAppraisal(appr);
    
    // Load saved inputs
    setCitations(appr.research.scopusCitations !== undefined ? String(appr.research.scopusCitations) : "");
    setHIndex2024(appr.research.hIndex2024 !== undefined ? String(appr.research.hIndex2024) : "");
    setHIndex2025(appr.research.hIndex2025 !== undefined ? String(appr.research.hIndex2025) : "");
    
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
    const h24 = Number(hIndex2024) || 0;
    const h25 = Number(hIndex2025) || 0;
    const raise = h25 - h24;
    
    if (raise <= 0) {
      setHIndexPoints(0);
      return;
    }

    const lowRate = activeConfig.research?.hIndexRateLow ?? 1;
    const midRate = activeConfig.research?.hIndexRateMid ?? 2;
    const highRate = activeConfig.research?.hIndexRateHigh ?? 4;

    let rate = lowRate;
    if (h24 >= 5 && h24 <= 10) {
      rate = midRate;
    } else if (h24 > 10) {
      rate = highRate;
    }

    setHIndexPoints(raise * rate);
  }, [hIndex2024, hIndex2025, activeConfig]);

  const hIndexRaise = (() => {
    const h24 = Number(hIndex2024) || 0;
    const h25 = Number(hIndex2025) || 0;
    const diff = h25 - h24;
    return diff > 0 ? `+${diff}` : String(diff);
  })();

  const handleSaveScoring = async (isDraft = false) => {
    if (!selectedAppraisal) return;

    setLoading(true);
    try {
      const res = await axiosInstance.put(`/api/appraisal/rnd-evaluate/${selectedAppraisal._id}`, {
        scopusCitations: Number(citations) || 0,
        hIndex2024: Number(hIndex2024) || 0,
        hIndex2025: Number(hIndex2025) || 0,
        scopusCitationScore: citationPoints,
        scopusHIndexScore: hIndexPoints,
        comments,
        isDraft
      });
      if (res.data && res.data.success) {
        toast.success(isDraft ? "Appraisal draft saved successfully!" : "Appraisal finalized and completed successfully!");
        if (!isDraft) {
          setSelectedAppraisal(null);
          fetchPending();
        } else {
          // Update local selectedAppraisal with saved values so UI stays synced
          setSelectedAppraisal(prev => {
            const updated = { ...prev };
            if (!updated.research) updated.research = {};
            updated.research.scopusCitations = Number(citations) || 0;
            updated.research.hIndex2024 = Number(hIndex2024) || 0;
            updated.research.hIndex2025 = Number(hIndex2025) || 0;
            updated.research.scopusCitationScore = citationPoints;
            updated.research.scopusHIndexScore = hIndexPoints;
            if (!updated.rndEvaluation) updated.rndEvaluation = {};
            updated.rndEvaluation.comments = comments;
            return updated;
          });
        }
      }
    } catch (err) {
      toast.error(isDraft ? "Failed to save draft." : "Failed to finalize appraisal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={4} sx={{ maxWidth: 1200, margin: "0 auto", animation: "fadeIn 0.5s ease" }}>
      
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 4, color: "var(--text-primary)" }}>
        Research & Development Appraisal Evaluation Desk
      </Typography>

      {!selectedAppraisal ? (
        <Card sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)" }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3, color: "var(--text-secondary)" }}>
              Appraisals Pending R&D Evaluation
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
                            startIcon={<Science />}
                            onClick={() => handleSelectAppraisal(appr)}
                            sx={{ textTransform: "none", fontWeight: 700 }}
                          >
                            Score Research
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4, color: "var(--text-secondary)" }}>
                        No pending appraisals found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={4}>
          
          {/* Profile Card (Full Width) */}
          <Card sx={{ 
            borderRadius: "20px", 
            background: "var(--bg-panel)", 
            border: "1px solid var(--border-color)", 
            boxShadow: "var(--shadow-premium)" 
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, alignItems: "center" }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                  Faculty Profile Snapshot
                </Typography>
                <Button size="small" startIcon={<Reply />} onClick={() => setSelectedAppraisal(null)} sx={{ textTransform: "none", fontWeight: 700 }}>
                  Back to List
                </Button>
              </Box>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3} alignItems="center">
                {/* Left Column: Avatar & Basic Details */}
                <Grid item xs={12} md={7.5} sx={{ display: "flex", gap: 2.5, alignItems: "center" }}>
                  <Avatar 
                    src={selectedAppraisal.facultyId?.profileImage}
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
                    {selectedAppraisal.personalInfoSnapshot?.name?.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2 }}>
                      {selectedAppraisal.personalInfoSnapshot?.name}
                    </Typography>
                    {selectedAppraisal.personalInfoSnapshot?.designation && (
                      <Chip 
                        label={selectedAppraisal.personalInfoSnapshot.designation} 
                        size="small" 
                        sx={{ 
                          mt: 1, 
                          mb: 1, 
                          fontWeight: 700, 
                          bgcolor: "rgba(59, 130, 246, 0.08)", 
                          color: "#3b82f6",
                          border: "1px solid rgba(59, 130, 246, 0.2)"
                        }} 
                      />
                    )}
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--text-secondary)" }}>
                      {selectedAppraisal.personalInfoSnapshot?.qualification || "Faculty Member"}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontSize: "0.85rem", mt: 0.2 }}>
                      {selectedAppraisal.personalInfoSnapshot?.departmentName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "var(--text-secondary)", display: "block", mt: 0.5 }}>
                      {selectedAppraisal.facultyId?.college || "Aditya University"}
                    </Typography>
                  </Box>
                </Grid>

                {/* Right Column: Contact & Metadata */}
                <Grid item xs={12} md={4.5} sx={{ borderLeft: { md: "1px solid var(--border-color)" }, pl: { md: 3 } }}>
                  <Stack spacing={1.5}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Email sx={{ color: "#3b82f6", fontSize: "1.2rem" }} />
                      <Box>
                        <Typography variant="caption" color="var(--text-secondary)" sx={{ fontWeight: 700, display: "block", fontSize: "0.7rem", textTransform: "uppercase" }}>Email</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.85rem" }}>{selectedAppraisal.facultyId?.email || "N/A"}</Typography>
                      </Box>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Phone sx={{ color: "#10b981", fontSize: "1.2rem" }} />
                      <Box>
                        <Typography variant="caption" color="var(--text-secondary)" sx={{ fontWeight: 700, display: "block", fontSize: "0.7rem", textTransform: "uppercase" }}>Phone</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.85rem" }}>{selectedAppraisal.facultyId?.phone || "N/A"}</Typography>
                      </Box>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Badge sx={{ color: "#a855f7", fontSize: "1.2rem" }} />
                      <Box>
                        <Typography variant="caption" color="var(--text-secondary)" sx={{ fontWeight: 700, display: "block", fontSize: "0.7rem", textTransform: "uppercase" }}>Employee ID</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.85rem" }}>{selectedAppraisal.personalInfoSnapshot?.institutionId || "N/A"}</Typography>
                      </Box>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <CalendarToday sx={{ color: "#f43f5e", fontSize: "1.2rem" }} />
                      <Box>
                        <Typography variant="caption" color="var(--text-secondary)" sx={{ fontWeight: 700, display: "block", fontSize: "0.7rem", textTransform: "uppercase" }}>Submission Date</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.85rem" }}>
                          {new Date(selectedAppraisal.updatedAt || selectedAppraisal.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Info Cards Grid (Full Width) */}
          <Grid container spacing={2}>
            {[
              { 
                label: "NAME WITH EMP ID", 
                val: `${selectedAppraisal.personalInfoSnapshot?.name || "N/A"} (${selectedAppraisal.personalInfoSnapshot?.institutionId || "N/A"})`, 
                icon: <Person fontSize="small" />, 
                iconBg: "rgba(59, 130, 246, 0.08)",
                iconColor: "#3b82f6" 
              },
              { 
                label: "DESIGNATION & DEPT", 
                val: `${selectedAppraisal.personalInfoSnapshot?.designation || "N/A"}, ${selectedAppraisal.personalInfoSnapshot?.departmentName || "N/A"}`, 
                icon: <Work fontSize="small" />, 
                iconBg: "rgba(139, 92, 246, 0.08)",
                iconColor: "#8b5cf6" 
              },
              { 
                label: "QUALIFICATION", 
                val: selectedAppraisal.personalInfoSnapshot?.qualification || "N/A", 
                icon: <School fontSize="small" />, 
                iconBg: "rgba(16, 185, 129, 0.08)",
                iconColor: "#10b981" 
              },
              { 
                label: "SCOPUS ID", 
                val: selectedAppraisal.personalInfoSnapshot?.scopusId || "N/A", 
                icon: <Description fontSize="small" />, 
                iconBg: "rgba(245, 158, 11, 0.08)",
                iconColor: "#f59e0b" 
              },
              { 
                label: "WEB OF SCIENCE ID", 
                val: selectedAppraisal.personalInfoSnapshot?.wosId || "N/A", 
                icon: <Public fontSize="small" />, 
                iconBg: "rgba(239, 68, 68, 0.08)",
                iconColor: "#ef4444" 
              },
              { 
                label: "ORCID ID", 
                val: selectedAppraisal.personalInfoSnapshot?.orcidId || "N/A", 
                icon: <Fingerprint fontSize="small" />, 
                iconBg: "rgba(6, 182, 212, 0.08)",
                iconColor: "#06b6d4" 
              },
              { 
                label: "INSTITUTION", 
                val: selectedAppraisal.facultyId?.college || "Aditya University", 
                icon: <Business fontSize="small" />, 
                iconBg: "rgba(59, 130, 246, 0.08)",
                iconColor: "#3b82f6" 
              },
              { 
                label: "ADDRESS", 
                val: selectedAppraisal.facultyId?.college 
                  ? (selectedAppraisal.facultyId.college.includes("Pharm") ? "Surampalem, Kakinada District, AP, India" : "Surampalem, East Godavari, AP, India")
                  : "Surampalem, Kakinada, Andhra Pradesh, India", 
                icon: <Place fontSize="small" />, 
                iconBg: "rgba(139, 92, 246, 0.08)",
                iconColor: "#8b5cf6" 
              }
            ].map((item, idx) => (
              <Grid item xs={12} sm={6} md={3} key={idx}>
                <Card sx={{ 
                  borderRadius: "16px", 
                  background: "var(--bg-panel)", 
                  border: "1px solid var(--border-color)", 
                  boxShadow: "var(--shadow-premium)",
                  height: "100%",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 6px 20px rgba(0,0,0,0.06)"
                  }
                }}>
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                      <Box sx={{ 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center", 
                        width: 36, 
                        height: 36, 
                        borderRadius: "10px", 
                        bgcolor: item.iconBg, 
                        color: item.iconColor 
                      }}>
                        {item.icon}
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 700, fontSize: "0.65rem", letterSpacing: "0.5px" }}>
                          {item.label}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.8rem", mt: 0.2 }}>
                          {item.val}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* R&D Research Scoring Panel Grid container (2 columns) */}
          <Grid container spacing={3}>
            {/* Left Column: Citation & H-Index scoring */}
            <Grid item xs={12} md={7.5}>
              {/* Card 2.7 Scopus Citation Score Points */}
              <Card sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", mb: 3, boxShadow: "var(--shadow-premium)" }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "var(--color-primary)", mb: 2 }}>
                    2.7 Scopus Citation Score Points
                  </Typography>
                  <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Scopus Citations in 2025"
                        type="number"
                        fullWidth
                        size="small"
                        value={citations}
                        onChange={(e) => setCitations(e.target.value)}
                        placeholder="e.g. 50"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 2, background: "rgba(59, 130, 246, 0.04)", borderRadius: "12px", border: "1px solid rgba(59, 130, 246, 0.1)" }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "var(--color-primary)", display: "block" }}>
                          Citation Scoring Rule (from Appraisal Settings)
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>
                          {activeConfig?.research?.citationRate ?? 0.2} point per citation in 2025
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between", alignItems: "center", p: 2, bgcolor: "var(--bg-paper)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: "var(--text-secondary)" }}>
                        Calculated Citation Points (2.7)
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 900, color: "var(--color-primary)" }}>
                        {citationPoints.toFixed(2)} Points
                      </Typography>
                    </Box>
                    <Chip label="Auto Calculated" size="small" sx={{ fontWeight: 800, bgcolor: "rgba(59, 130, 246, 0.08)", color: "#3b82f6" }} />
                  </Box>
                </CardContent>
              </Card>

              {/* Card 2.8 Scopus h-index Score Points */}
              <Card sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-premium)" }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "var(--color-primary)", mb: 2 }}>
                    2.8 Scopus h-index Score Points
                  </Typography>

                  <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="H-index in 2024"
                        type="number"
                        fullWidth
                        size="small"
                        value={hIndex2024}
                        onChange={(e) => setHIndex2024(e.target.value)}
                        placeholder="e.g. 6"
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="H-index in 2025"
                        type="number"
                        fullWidth
                        size="small"
                        value={hIndex2025}
                        onChange={(e) => setHIndex2025(e.target.value)}
                        placeholder="e.g. 8"
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <TextField
                          label="H-index Raise"
                          type="text"
                          fullWidth
                          size="small"
                          disabled
                          value={hIndexRaise}
                        />
                        <Button variant="outlined" size="small" disabled sx={{ minWidth: "55px", textTransform: "none", fontWeight: 700, color: "var(--color-primary)" }}>
                          Auto
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Applied Rule Banner */}
                  <Box sx={{ mt: 2 }}>
                    {(() => {
                      const h24 = Number(hIndex2024) || 0;
                      const h25 = Number(hIndex2025) || 0;
                      const raise = h25 - h24;
                      const lowRate = activeConfig?.research?.hIndexRateLow ?? 1;
                      const midRate = activeConfig?.research?.hIndexRateMid ?? 2;
                      const highRate = activeConfig?.research?.hIndexRateHigh ?? 4;
                      
                      let ruleText = "";
                      let isValid = false;

                      if (raise > 0) {
                        isValid = true;
                        if (h24 >= 5 && h24 <= 10) {
                          ruleText = `H-index between 5 and 10 -> ${midRate} points per 1 raise`;
                        } else if (h24 > 10) {
                          ruleText = `H-index > 10 -> ${highRate} points per 1 raise`;
                        } else {
                          ruleText = `H-index < 5 -> ${lowRate} point per 1 raise`;
                        }
                      }

                      return isValid ? (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: "8px 16px", bgcolor: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "8px", color: "#10b981" }}>
                          <CheckCircle fontSize="small" />
                          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.85rem" }}>
                            Applied Rule: {ruleText}
                          </Typography>
                        </Box>
                      ) : (
                        <Box sx={{ p: "8px 16px", bgcolor: "var(--bg-paper)", border: "1px solid var(--border-color)", borderRadius: "8px", color: "var(--text-secondary)" }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.85rem" }}>
                            No h-index increase recorded.
                          </Typography>
                        </Box>
                      );
                    })()}
                  </Box>

                  <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between", alignItems: "center", p: 2, bgcolor: "var(--bg-paper)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: "var(--text-secondary)" }}>
                        Calculated h-index Points (2.8)
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 900, color: "var(--color-primary)" }}>
                        {hIndexPoints.toFixed(2)} Points
                      </Typography>
                    </Box>
                    <Chip label="Auto Calculated" size="small" sx={{ fontWeight: 800, bgcolor: "rgba(59, 130, 246, 0.08)", color: "#3b82f6" }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Right Column: Rules & Summary */}
            <Grid item xs={12} md={4.5}>
              {/* Card H-Index Scoring Rules */}
              <Card sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", mb: 3, boxShadow: "var(--shadow-premium)" }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#7c3aed", mb: 2 }}>
                    H-Index Scoring Rules (from Appraisal Settings)
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Stack spacing={1.5}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--text-secondary)" }}>• If h-index &lt; 5</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                        {activeConfig?.research?.hIndexRateLow ?? 1} point per raise
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--text-secondary)" }}>• If h-index &ge; 5 and &le; 10</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                        {activeConfig?.research?.hIndexRateMid ?? 2} points per raise
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--text-secondary)" }}>• If h-index &gt; 10</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                        {activeConfig?.research?.hIndexRateHigh ?? 4} points per raise
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Card R&D Research Points Summary */}
              <Card sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-premium)" }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "var(--text-primary)", mb: 2 }}>
                    R&D Research Points Summary
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Stack spacing={2} sx={{ mb: 3 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--text-secondary)" }}>Scopus Citation Points (2.7)</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                        {citationPoints.toFixed(2)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--text-secondary)" }}>Scopus h-index Points (2.8)</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                        {hIndexPoints.toFixed(2)}
                      </Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 900, color: "var(--color-primary)" }}>Total R&D Research Points</Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 900, color: "var(--color-primary)" }}>
                        {(citationPoints + hIndexPoints).toFixed(2)}
                      </Typography>
                    </Box>
                  </Stack>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 2, bgcolor: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "12px", color: "#10b981" }}>
                    <CheckCircle />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 800, fontSize: "0.85rem" }}>
                        Final R&D Research Points Added
                      </Typography>
                      <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontSize: "0.75rem", display: "block", mt: 0.2 }}>
                        These points will be added to the overall appraisal score.
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Remarks & Bottom Actions */}
          <Card sx={{ borderRadius: "20px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", p: 3, boxShadow: "var(--shadow-premium)" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: "var(--text-primary)" }}>
              Admin Remarks (Optional)
            </Typography>
            <TextField
              placeholder="Enter any remarks regarding the research scoring..."
              multiline
              rows={3}
              fullWidth
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              sx={{
                mb: 3,
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  background: "var(--bg-paper)"
                }
              }}
            />
            
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
              <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 600 }}>
                You can save as draft or finalize the appraisal.
              </Typography>
              <Box display="flex" gap={2}>
                <Button 
                  variant="outlined" 
                  onClick={() => handleSaveScoring(true)}
                  disabled={loading}
                  sx={{ textTransform: "none", fontWeight: 700, borderRadius: "10px", px: 3 }}
                >
                  Save Draft
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleSaveScoring(false)}
                  disabled={loading}
                  sx={{ textTransform: "none", fontWeight: 700, color: "#fff", background: "var(--gradient-primary)", borderRadius: "10px", px: 3 }}
                >
                  Finalize & Complete Appraisal
                </Button>
              </Box>
            </Box>
          </Card>
        </Stack>
      )}

    </Box>
  );
};

export default AppraisalResearchScoring;
