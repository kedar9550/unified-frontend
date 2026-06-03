import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  AlertTitle,
  Modal,
  TextField,
  Divider,
  Chip
} from "@mui/material";
import {
  Send,
  CloudUpload,
  Person,
  MenuBook,
  Science,
  CardMembership,
  CheckCircle,
  AssignmentTurnedIn
} from "@mui/icons-material";
import axiosInstance from "../../api/axios";
import { toast } from "sonner";

const SelfAppraisal = () => {
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [appraisal, setAppraisal] = useState(null);
  const [profileComplete, setProfileComplete] = useState(true);
  const [missingFields, setMissingFields] = useState([]);

  // Claim research publication modal states
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [undertakingFile, setUndertakingFile] = useState(null);

  // Fetch Academic Years
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const res = await axiosInstance.get("/api/academic-years");
        const yearsList = res.data?.years || [];
        setAcademicYears(yearsList);
        if (yearsList.length > 0) {
          setSelectedYear(yearsList[0]._id);
        }
      } catch (err) {
        toast.error("Failed to load academic years.");
      }
    };
    fetchYears();
  }, []);

  // Fetch/Initiate Appraisal on Academic Year change
  const fetchAppraisal = async () => {
    if (!selectedYear) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/api/appraisal/initiate/${selectedYear}`);
      if (res.data && res.data.success) {
        setAppraisal(res.data.data);
        setProfileComplete(res.data.isProfileComplete);
        setMissingFields(res.data.missingProfileFields || []);
      }
    } catch (err) {
      toast.error("Failed to fetch or calculate self appraisal.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppraisal();
  }, [selectedYear]);

  // Submit Appraisal
  const handleSubmit = async () => {
    if (!profileComplete) {
      toast.error("Please complete your faculty profile details before submitting.");
      return;
    }
    setLoading(true);
    try {
      const res = await axiosInstance.post("/api/appraisal/submit", {
        academicYearId: selectedYear
      });
      if (res.data && res.data.success) {
        toast.success("Appraisal submitted to HOD successfully!");
        fetchAppraisal(); // reload
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit appraisal.");
    } finally {
      setLoading(false);
    }
  };

  // Claim Publication Submit handler
  const handleClaimSubmit = async () => {
    if (!selectedPaper) return;
    
    const formData = new FormData();
    formData.append("researchId", selectedPaper.paperId);
    formData.append("researchType", "Journal");
    formData.append("doiOrIsbn", selectedPaper.doi);
    formData.append("academicYearId", selectedYear);
    if (undertakingFile) {
      formData.append("undertaking", undertakingFile);
    }

    setLoading(true);
    try {
      const res = await axiosInstance.post("/api/appraisal/claim-research", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data && res.data.success) {
        toast.success("Publication claimed successfully!");
        setClaimModalOpen(false);
        setUndertakingFile(null);
        fetchAppraisal(); // recalculate
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to claim publication.");
    } finally {
      setLoading(false);
    }
  };

  if (!appraisal) {
    return (
      <Box p={4} display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Typography color="var(--text-secondary)">Loading appraisal details...</Typography>
      </Box>
    );
  }

  return (
    <Box p={4} sx={{ maxWidth: 1300, margin: "0 auto", animation: "fadeIn 0.5s ease" }}>
      
      {/* Header Panel */}
      <Box 
        sx={{ 
          display: "flex", 
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between", 
          alignItems: { xs: "flex-start", md: "center" },
          mb: 4,
          p: 3,
          borderRadius: "20px",
          background: "var(--bg-panel)",
          border: "1px solid var(--border-color)",
          backdropFilter: "blur(12px)",
          gap: 2
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
            Faculty Self Appraisal Portal
          </Typography>
          <Typography variant="body2" color="var(--text-secondary)">
            Fill, review, and submit your performance appraisal form.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: { xs: "100%", md: "auto" } }}>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 200, background: "var(--bg-paper)", borderRadius: "8px" }}>
            <InputLabel>Academic Year</InputLabel>
            <Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              label="Academic Year"
            >
              {academicYears.map((ay) => (
                <MenuItem key={ay._id} value={ay._id}>
                  {ay.year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {appraisal.status === "Draft" || appraisal.status === "Rejected by HOD" ? (
            <Button
              variant="contained"
              startIcon={<Send />}
              onClick={handleSubmit}
              disabled={loading}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 700,
                px: 3,
                boxShadow: "0 4px 14px rgba(34, 197, 94, 0.4)",
                background: "var(--gradient-primary)",
                color: "#fff"
              }}
            >
              Submit to HOD
            </Button>
          ) : (
            <Chip 
              label={`Status: ${appraisal.status}`} 
              color={appraisal.status === "Completed" ? "success" : "info"} 
              icon={<AssignmentTurnedIn />} 
              sx={{ fontWeight: 700, px: 2, py: 2.2, borderRadius: "10px" }}
            />
          )}
        </Box>
      </Box>

      {/* Completeness Warning Banner */}
      {!profileComplete && (
        <Alert severity="warning" variant="filled" sx={{ mb: 4, borderRadius: "16px" }}>
          <AlertTitle sx={{ fontWeight: 700 }}>Profile Details Incomplete</AlertTitle>
          You must complete the following fields in your profile before you can submit this appraisal to HOD: 
          <strong> {missingFields.join(", ")}</strong>. Please navigate to the Profile settings to update them.
        </Alert>
      )}

      {/* Main Grid */}
      <Grid container spacing={4}>
        
        {/* Left Side: Detail Sheets */}
        <Grid item xs={12} lg={8.5}>
          {/* PART-A: Personal Information */}
          <Card sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", mb: 4 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 1.5 }}>
                <Person sx={{ color: "var(--color-primary)" }} /> PART-A: Personal Information
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Grid container spacing={2.5}>
                {[
                  { label: "Name with Emp ID", val: `${appraisal.personalInfoSnapshot?.name} (${appraisal.personalInfoSnapshot?.institutionId})` },
                  { label: "Designation & Dept", val: `${appraisal.personalInfoSnapshot?.designation} - ${appraisal.personalInfoSnapshot?.departmentName}` },
                  { label: "Scopus ID", val: appraisal.personalInfoSnapshot?.scopusId || "N/A", highlight: !appraisal.personalInfoSnapshot?.scopusId },
                  { label: "Web of Science ID", val: appraisal.personalInfoSnapshot?.wosId || "N/A", highlight: !appraisal.personalInfoSnapshot?.wosId },
                  { label: "ORCID ID", val: appraisal.personalInfoSnapshot?.orcidId || "N/A", highlight: !appraisal.personalInfoSnapshot?.orcidId }
                ].map((item, idx) => (
                  <Grid item xs={12} md={6} key={idx}>
                    <Typography variant="caption" color="var(--text-secondary)" sx={{ fontWeight: 700 }}>
                      {item.label}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontWeight: 600, 
                        color: item.highlight ? "var(--color-danger)" : "var(--text-primary)",
                        mt: 0.5 
                      }}
                    >
                      {item.val}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* PART-B: Performance Details */}
          
          {/* 1. Teaching & Learning */}
          <Card sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", mb: 4 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 1.5 }}>
                <MenuBook sx={{ color: "var(--color-primary)" }} /> 1. Teaching (Max 80 points)
              </Typography>
              <Divider sx={{ mb: 3 }} />

              {/* 1.1 Course pass percentage */}
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: "var(--color-primary)" }}>
                1.1 Course Average Pass Percentage (Theory only)
              </Typography>
              <TableContainer component={Paper} sx={{ mb: 3, borderRadius: "12px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ background: "var(--bg-accent-4)" }}>
                      <TableCell sx={{ fontWeight: 700 }}>Course Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Sem-Branch-Sec</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Appeared</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Passed</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Pass %</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Points claimed</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {appraisal.teaching.passPercentage.courses.length > 0 ? (
                      appraisal.teaching.passPercentage.courses.map((c, i) => (
                        <TableRow key={i}>
                          <TableCell sx={{ fontWeight: 500 }}>{c.courseName}</TableCell>
                          <TableCell>{c.secBranchSem}</TableCell>
                          <TableCell align="right">{c.appeared}</TableCell>
                          <TableCell align="right">{c.passed}</TableCell>
                          <TableCell align="right">{c.percentage}%</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: "var(--color-primary)" }}>{c.pointsClaimed}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center" color="var(--text-secondary)">No theory subjects result found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* 1.2 Course Feedback */}
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: "var(--color-primary)" }}>
                1.2 Course Feedback
              </Typography>
              <TableContainer component={Paper} sx={{ mb: 3, borderRadius: "12px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ background: "var(--bg-accent-4)" }}>
                      <TableCell sx={{ fontWeight: 700 }}>Course Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Sem-Branch-Sec</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Students</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Feedback %</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Points claimed</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {appraisal.teaching.feedback.courses.length > 0 ? (
                      appraisal.teaching.feedback.courses.map((c, i) => (
                        <TableRow key={i}>
                          <TableCell sx={{ fontWeight: 500 }}>{c.courseName}</TableCell>
                          <TableCell>{c.secBranchSem}</TableCell>
                          <TableCell align="right">{c.noOfStudents}</TableCell>
                          <TableCell align="right">{c.feedbackPercentage}%</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: "var(--color-primary)" }}>{c.pointsClaimed}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center">No course feedbacks found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* 1.3 Proctoring Pass % */}
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: "var(--color-primary)" }}>
                1.3 Proctoring Students' Average Pass Percentage
              </Typography>
              <TableContainer component={Paper} sx={{ mb: 3, borderRadius: "12px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ background: "var(--bg-accent-4)" }}>
                      <TableCell sx={{ fontWeight: 700 }}>Total Allotted</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Appeared (A)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Passed (B)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Pass % (B/A)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Points claimed</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {appraisal.teaching.proctoring.entries.length > 0 ? (
                      appraisal.teaching.proctoring.entries.map((e, i) => (
                        <TableRow key={i}>
                          <TableCell sx={{ fontWeight: 500 }}>{e.totalStudents}</TableCell>
                          <TableCell align="right">{e.appeared}</TableCell>
                          <TableCell align="right">{e.passed}</TableCell>
                          <TableCell align="right">{e.percentage}%</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: "var(--color-primary)" }}>{e.pointsClaimed}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center">No approved proctoring entries found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* 1.4 CO Attainment */}
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: "var(--color-primary)" }}>
                1.4 CO Attainment (Theory only)
              </Typography>
              <TableContainer component={Paper} sx={{ borderRadius: "12px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ background: "var(--bg-accent-4)" }}>
                      <TableCell sx={{ fontWeight: 700 }}>Course Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Sem-Branch-Sec</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Total COs</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">COs Attained</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Points claimed</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {appraisal.teaching.coAttainment.courses.length > 0 ? (
                      appraisal.teaching.coAttainment.courses.map((c, i) => (
                        <TableRow key={i}>
                          <TableCell sx={{ fontWeight: 500 }}>{c.courseName}</TableCell>
                          <TableCell>{c.secBranchSem}</TableCell>
                          <TableCell align="right">{c.noOfCos}</TableCell>
                          <TableCell align="right">{c.noOfCosAttained}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: "var(--color-primary)" }}>{c.pointsClaimed}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center">No CO attainment details found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* 2. Research Contributions */}
          <Card sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", mb: 4 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 1.5 }}>
                <Science sx={{ color: "var(--color-primary)" }} /> 2. Research Contributions
              </Typography>
              <Divider sx={{ mb: 3 }} />

              {/* 2.1 Papers Publication with Claims Coordination */}
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: "var(--color-primary)" }}>
                2.1 Paper Publications (Journals)
              </Typography>
              <TableContainer component={Paper} sx={{ mb: 4, borderRadius: "12px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ background: "var(--bg-accent-4)" }}>
                      <TableCell sx={{ fontWeight: 700 }}>Paper Title</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Journal Scope</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>DOI</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Claim Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Points</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {appraisal.research.papers.items.length > 0 ? (
                      appraisal.research.papers.items.map((p, i) => (
                        <TableRow key={i}>
                          <TableCell sx={{ fontWeight: 500 }}>{p.title}</TableCell>
                          <TableCell>{p.scope}</TableCell>
                          <TableCell>{p.doi}</TableCell>
                          <TableCell>
                            {p.claimStatus === "claimed_by_me" && (
                              <Chip label="Claimed by Me" color="success" size="small" />
                            )}
                            {p.claimStatus === "claimed_by_other" && (
                              <Chip label={`Claimed by: ${p.claimedBy}`} color="error" size="small" />
                            )}
                            {p.claimStatus === "auto_eligible" && (
                              <Chip label="Eligible (Single AUS Author)" color="info" size="small" />
                            )}
                            {p.claimStatus === "requires_claim_action" && (
                              <Button 
                                variant="outlined" 
                                color="warning" 
                                size="small"
                                onClick={() => {
                                  setSelectedPaper(p);
                                  setClaimModalOpen(true);
                                }}
                                disabled={appraisal.status !== "Draft" && appraisal.status !== "Rejected by HOD"}
                                sx={{ textTransform: "none", py: 0.2, fontWeight: 700 }}
                              >
                                Claim Points
                              </Button>
                            )}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: "var(--color-primary)" }}>{p.pointsClaimed}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center">No approved journals found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* PhD, Books, Patents */}
              <Grid container spacing={3}>
                {/* 2.2 PhD Guiding */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: "var(--color-primary)" }}>
                    2.2 Guiding Ph.D. Scholars
                  </Typography>
                  <TableContainer component={Paper} sx={{ borderRadius: "12px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ background: "var(--bg-accent-4)" }}>
                          <TableCell sx={{ fontWeight: 700 }}>Scholar Name</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">Points</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {appraisal.research.phdGuiding.items.length > 0 ? (
                          appraisal.research.phdGuiding.items.map((p, i) => (
                            <TableRow key={i}>
                              <TableCell>{p.name}</TableCell>
                              <TableCell>{p.status}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>{p.pointsClaimed}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} align="center">None</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                {/* 2.3 Books Chapters */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: "var(--color-primary)" }}>
                    2.3 Books / Chapters (Max 10 pts)
                  </Typography>
                  <TableContainer component={Paper} sx={{ borderRadius: "12px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ background: "var(--bg-accent-4)" }}>
                          <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>ISBN</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">Points</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {appraisal.research.booksChapters.items.length > 0 ? (
                          appraisal.research.booksChapters.items.map((b, i) => (
                            <TableRow key={i}>
                              <TableCell>{b.title}</TableCell>
                              <TableCell>{b.isbn || "N/A"}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>{b.pointsClaimed}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} align="center">None</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                {/* 2.4 Patents */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: "var(--color-primary)" }}>
                    2.4 Patents
                  </Typography>
                  <TableContainer component={Paper} sx={{ borderRadius: "12px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ background: "var(--bg-accent-4)" }}>
                          <TableCell sx={{ fontWeight: 700 }}>Patent Title</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">Points</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {appraisal.research.patents?.items?.length > 0 ? (
                          appraisal.research.patents.items.map((p, i) => (
                            <TableRow key={i}>
                              <TableCell>{p.title}</TableCell>
                              <TableCell>{p.status}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>{p.pointsClaimed}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} align="center">None</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                {/* 2.5 Novel Products / Technology */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: "var(--color-primary)" }}>
                    2.5 Novel Products / Technology
                  </Typography>
                  <TableContainer component={Paper} sx={{ borderRadius: "12px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ background: "var(--bg-accent-4)" }}>
                          <TableCell sx={{ fontWeight: 700 }}>Product Title</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">Points</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {appraisal.research.novelProducts?.items?.length > 0 ? (
                          appraisal.research.novelProducts.items.map((p, i) => (
                            <TableRow key={i}>
                              <TableCell>{p.title}</TableCell>
                              <TableCell>{p.status}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>{p.pointsClaimed}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} align="center">None</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                {/* 2.6 Project Proposals / Consultancies */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: "var(--color-primary)" }}>
                    2.6 Funded Projects & Consultancies
                  </Typography>
                  <TableContainer component={Paper} sx={{ borderRadius: "12px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ background: "var(--bg-accent-4)" }}>
                          <TableCell sx={{ fontWeight: 700 }}>Project Title</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Agency</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">Amount (Lakhs)</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">Points</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {appraisal.research.projectsConsultancies?.items?.length > 0 ? (
                          appraisal.research.projectsConsultancies.items.map((p, i) => (
                            <TableRow key={i}>
                              <TableCell sx={{ fontWeight: 500 }}>{p.title}</TableCell>
                              <TableCell>{p.projectType === 'FundedProject' ? 'Funded Project' : 'Consultancy'}</TableCell>
                              <TableCell>{p.agency || "N/A"}</TableCell>
                              <TableCell align="right">{p.amountInLakhs || 0}</TableCell>
                              <TableCell>{p.status}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>{p.pointsClaimed}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} align="center">None</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>

              {/* R&D Admin Provided Scores */}
              <Box sx={{ mt: 4, p: 2, background: "var(--bg-accent-4)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: "var(--text-primary)" }}>
                  Research & Development Admin Verified Scores
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1.5, background: "var(--bg-paper)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--text-secondary)" }}>
                        2.7 Scopus Citation Score
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--color-primary)" }}>
                        {appraisal.research.scopusCitationScore || 0} pts
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1.5, background: "var(--bg-paper)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--text-secondary)" }}>
                        2.8 Scopus h-index Score Points
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--color-primary)" }}>
                        {appraisal.research.scopusHIndexScore || 0} pts
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Right Side: Quick Points Scorecard Summary Panel */}
        <Grid item xs={12} lg={3.5}>
          <Card 
            sx={{ 
              position: "sticky", 
              top: 24, 
              borderRadius: "20px", 
              background: "linear-gradient(135deg, var(--bg-accent-4) 0%, var(--bg-panel) 100%)",
              border: "1px solid var(--border-color)",
              boxShadow: "var(--shadow-premium)"
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 1 }}>
                <CardMembership sx={{ color: "var(--color-primary)" }} /> Points Scorecard
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {[
                { label: "1. Teaching & Learning", points: appraisal.teaching.totalClaimed, max: 80 },
                { label: "2. Research Contributions", points: appraisal.research.totalClaimed, max: "N/A" },
                { label: "3. Extension / Value Addition", points: appraisal.valueAddition.totalClaimed, max: "N/A" },
                { label: "4. Administrative Duties", points: appraisal.administration.totalClaimed, max: 20 },
                { label: "HOD Interpersonal Skills", points: appraisal.hodEvaluation?.totalInterpersonalPoints || 0, max: 50 }
              ].map((m, i) => (
                <Box key={i} sx={{ display: "flex", justifyContent: "space-between", py: 1.5, borderBottom: "1px solid var(--border-color)" }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--text-secondary)" }}>{m.label}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--color-primary)" }}>
                    {m.points} {m.max !== "N/A" ? `/ ${m.max}` : ""}
                  </Typography>
                </Box>
              ))}

              <Box sx={{ mt: 3, p: 2, background: "var(--bg-paper)", borderRadius: "14px", border: "1px solid var(--border-color)", textAlign: "center" }}>
                <Typography variant="caption" color="var(--text-secondary)" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
                  Estimated Point Score
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 900, color: "var(--color-primary)", my: 0.5 }}>
                  {Number((
                    appraisal.teaching.totalClaimed + 
                    appraisal.research.totalClaimed + 
                    appraisal.valueAddition.totalClaimed + 
                    appraisal.administration.totalClaimed +
                    (appraisal.hodEvaluation?.totalInterpersonalPoints || 0)
                  ).toFixed(2))}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Co-author claims modal */}
      <Modal open={claimModalOpen} onClose={() => setClaimModalOpen(false)}>
        <Box 
          sx={{ 
            position: "absolute", 
            top: "50%", 
            left: "50%", 
            transform: "translate(-50%, -50%)", 
            width: 480, 
            background: "var(--bg-panel)", 
            border: "1px solid var(--border-color)",
            boxShadow: 24, 
            p: 4, 
            borderRadius: "16px" 
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: "var(--text-primary)" }}>
            Claim Co-Authored Research
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Typography variant="body2" color="var(--text-secondary)" sx={{ mb: 3 }}>
            Only one author from Aditya University can claim this paper. If you are <strong>not</strong> the first author, you must upload a signed <strong>Undertaking Form</strong> from other authors.
          </Typography>

          <Button
            variant="outlined"
            component="label"
            fullWidth
            startIcon={<CloudUpload />}
            sx={{ py: 1.5, borderStyle: "dashed", mb: 3, textTransform: "none", fontWeight: 700 }}
          >
            Upload Undertaking (PDF/Image)
            <input 
              type="file" 
              hidden 
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => setUndertakingFile(e.target.files[0])} 
            />
          </Button>

          {undertakingFile && (
            <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 3, borderRadius: "10px" }}>
              File selected: {undertakingFile.name}
            </Alert>
          )}

          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <Button onClick={() => setClaimModalOpen(false)} sx={{ fontWeight: 700 }}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              color="warning" 
              onClick={handleClaimSubmit} 
              disabled={loading}
              sx={{ fontWeight: 700, color: "#fff" }}
            >
              Submit Claim
            </Button>
          </Box>
        </Box>
      </Modal>

    </Box>
  );
};

export default SelfAppraisal;
