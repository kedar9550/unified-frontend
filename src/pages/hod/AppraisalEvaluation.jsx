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
  Alert
} from "@mui/material";
import { RateReview, CheckCircle, Reply } from "@mui/icons-material";
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
          
          {/* Faculty claimed points preview */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)" }}>
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
                  Self-Assessment Point Scores:
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
                    disabled={loading}
                    sx={{ textTransform: "none", fontWeight: 700, color: "#fff" }}
                  >
                    Approve & Forward to R&D
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

export default AppraisalEvaluation;
