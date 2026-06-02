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
  Tooltip
} from "@mui/material";
import { Science, Reply, CheckCircle, HelpOutlined } from "@mui/icons-material";
import axiosInstance from "../../api/axios";
import { toast } from "sonner";

const AppraisalResearchScoring = () => {
  const [pendingList, setPendingList] = useState([]);
  const [selectedAppraisal, setSelectedAppraisal] = useState(null);
  const [loading, setLoading] = useState(false);

  // Scoring States
  const [citations, setCitations] = useState("");
  const [citationPoints, setCitationPoints] = useState(0);
  const [hIndexPoints, setHIndexPoints] = useState("");
  const [comments, setComments] = useState("");

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

  const handleSelectAppraisal = (appr) => {
    setSelectedAppraisal(appr);
    setCitations("");
    setCitationPoints(0);
    setHIndexPoints("");
    setComments("");
  };

  const handleCitationsChange = (val) => {
    const count = Number(val) || 0;
    setCitations(val);
    // Dynamic points: 0.2 points per citation as per standard
    setCitationPoints(Number((count * 0.2).toFixed(2)));
  };

  const handleFinalize = async () => {
    if (!selectedAppraisal) return;

    setLoading(true);
    try {
      const res = await axiosInstance.put(`/api/appraisal/rnd-evaluate/${selectedAppraisal._id}`, {
        scopusCitationScore: citationPoints,
        scopusHIndexScore: Number(hIndexPoints) || 0,
        comments
      });
      if (res.data && res.data.success) {
        toast.success("Appraisal finalized and completed successfully!");
        setSelectedAppraisal(null);
        fetchPending();
      }
    } catch (err) {
      toast.error("Failed to finalize appraisal.");
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
        <Grid container spacing={4}>
          
          {/* Appraisal claimed overview */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)" }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                    {selectedAppraisal.personalInfoSnapshot?.name} ({selectedAppraisal.personalInfoSnapshot?.institutionId})
                  </Typography>
                  <Button size="small" startIcon={<Reply />} onClick={() => setSelectedAppraisal(null)}>
                    Back to List
                  </Button>
                </Box>
                <Divider sx={{ mb: 3 }} />

                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: "var(--color-primary)" }}>
                  Verified Point Scores
                </Typography>
                {[
                  { label: "1. Teaching & Learning", val: selectedAppraisal.teaching.totalClaimed, max: 80 },
                  { label: "2. Research (Publications, PhD, Patents etc.)", val: selectedAppraisal.research.totalClaimed, max: "N/A" },
                  { label: "3. Extension / Value addition", val: selectedAppraisal.valueAddition.totalClaimed, max: "N/A" },
                  { label: "4. Administrative Responsibilities", val: selectedAppraisal.administration.totalClaimed, max: 20 },
                  { label: "HOD Interpersonal Rating", val: selectedAppraisal.hodEvaluation?.totalInterpersonalPoints || 0, max: 50 }
                ].map((item, idx) => (
                  <Box key={idx} sx={{ display: "flex", justifyContent: "space-between", py: 1.5, borderBottom: "1px solid var(--border-color)" }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--text-secondary)" }}>{item.label}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--color-primary)" }}>
                      {item.val} {item.max !== "N/A" ? `/ ${item.max}` : ""}
                    </Typography>
                  </Box>
                ))}

                <Box sx={{ mt: 3, p: 2, background: "var(--bg-paper)", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase" }} color="var(--text-secondary)">HOD Remarks:</Typography>
                  <Typography variant="body2" sx={{ fontStyle: "italic", mt: 0.5 }}>
                    "{selectedAppraisal.hodEvaluation?.comments || 'No comment provided.'}"
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Research points entry desk */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", height: "100%" }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: "var(--text-primary)" }}>
                  R&D Research Scoring Panel
                </Typography>
                <Typography variant="caption" color="var(--text-secondary)" sx={{ display: "block", mb: 3 }}>
                  Enter Scopus citation count and Scopus h-index rise points for the faculty member.
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      label="Total Scopus Citations in 2025 year"
                      type="number"
                      fullWidth
                      value={citations}
                      onChange={(e) => handleCitationsChange(e.target.value)}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Tooltip title="Formula: 0.2 points per citation">
                              <HelpOutlined sx={{ color: "var(--text-secondary)", cursor: "pointer" }} />
                            </Tooltip>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="Calculated Citation Points (2.7)"
                      type="number"
                      disabled
                      fullWidth
                      value={citationPoints}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="Scopus h-index Score Points (2.8)"
                      type="number"
                      fullWidth
                      value={hIndexPoints}
                      onChange={(e) => setHIndexPoints(e.target.value)}
                      placeholder="e.g. h-index points obtained"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="R&D Admin Comments / Remarks"
                      multiline
                      rows={3}
                      fullWidth
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                    />
                  </Grid>
                </Grid>

                <Alert severity="success" sx={{ mt: 3, mb: 3, borderRadius: "10px" }}>
                  <strong>Final R&D Research Points added:</strong> {Number((citationPoints + (Number(hIndexPoints) || 0)).toFixed(2))} points.
                </Alert>

                <Box display="flex" justifyContent="flex-end" gap={2}>
                  <Button 
                    variant="outlined" 
                    onClick={() => setSelectedAppraisal(null)}
                    disabled={loading}
                    sx={{ textTransform: "none", fontWeight: 700 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<CheckCircle />}
                    onClick={handleFinalize}
                    disabled={loading}
                    sx={{ textTransform: "none", fontWeight: 700, color: "#fff", background: "var(--gradient-primary)" }}
                  >
                    Finalize & Complete Appraisal
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

    </Box>
  );
};

export default AppraisalResearchScoring;
