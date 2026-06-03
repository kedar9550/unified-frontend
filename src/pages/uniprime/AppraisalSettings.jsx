import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Divider,
  Alert,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow
} from "@mui/material";
import { Save, Add, Delete, Settings, InfoOutlined } from "@mui/icons-material";
import axiosInstance from "../../api/axios";
import { toast } from "sonner";

const AppraisalSettings = () => {
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState(null);
  
  // Guidelines panels toggle states
  const [show31Rules, setShow31Rules] = useState(false);
  const [show32Rules, setShow32Rules] = useState(false);
  const [show4Rules, setShow4Rules] = useState(false);

  // Load academic years
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

  // Fetch settings when year is changed
  useEffect(() => {
    if (!selectedYear) return;
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/api/appraisal/config/${selectedYear}`);
        if (res.data && res.data.success) {
          setConfig(res.data.data);
        }
      } catch (err) {
        toast.error("Failed to fetch points configurations.");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [selectedYear]);

  const handleSave = async () => {
    if (!config) return;
    setLoading(true);
    try {
      const res = await axiosInstance.post("/api/appraisal/config", {
        academicYearId: selectedYear,
        teaching: config.teaching,
        research: config.research,
        valueAddition: config.valueAddition,
        administration: config.administration
      });
      if (res.data && res.data.success) {
        toast.success("Points configurations saved successfully!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save configurations.");
    } finally {
      setLoading(false);
    }
  };

  // Handler for adding/deleting point ranges
  const addRange = (type) => {
    setConfig(prev => {
      const updated = { ...prev };
      updated.teaching[type].push({ min: 0, max: 0, points: 0 });
      return updated;
    });
  };

  const deleteRange = (type, index) => {
    setConfig(prev => {
      const updated = { ...prev };
      updated.teaching[type].splice(index, 1);
      return updated;
    });
  };

  const updateRange = (type, index, field, value) => {
    setConfig(prev => {
      const updated = { ...prev };
      updated.teaching[type][index][field] = Number(value);
      return updated;
    });
  };

  const updateCoAttainment = (coKey, value) => {
    setConfig(prev => {
      const updated = { ...prev };
      updated.teaching.coAttainmentPoints[coKey] = Number(value);
      return updated;
    });
  };

  const updateResearchMetric = (category, itemKey, value) => {
    setConfig(prev => {
      const updated = { ...prev };
      updated.research[category][itemKey] = Number(value);
      return updated;
    });
  };

  const updateResourcePoint = (key, value) => {
    setConfig(prev => {
      const updated = { ...prev };
      if (!updated.valueAddition) updated.valueAddition = {};
      if (!updated.valueAddition.resourceUtilizationPoints) updated.valueAddition.resourceUtilizationPoints = {};
      updated.valueAddition.resourceUtilizationPoints[key] = Number(value);
      return updated;
    });
  };

  const updateExpertisePoint = (key, value) => {
    setConfig(prev => {
      const updated = { ...prev };
      if (!updated.valueAddition) updated.valueAddition = {};
      if (!updated.valueAddition.expertisePoints) updated.valueAddition.expertisePoints = {};
      updated.valueAddition.expertisePoints[key] = Number(value);
      return updated;
    });
  };

  const updateAdminRolePoint = (key, value) => {
    setConfig(prev => {
      const updated = { ...prev };
      if (!updated.administration) updated.administration = {};
      if (!updated.administration.rolePoints) updated.administration.rolePoints = {};
      updated.administration.rolePoints[key] = Number(value);
      return updated;
    });
  };

  if (!config) {
    return (
      <Box p={4} sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Typography variant="h6" color="var(--text-secondary)">Loading Configurations...</Typography>
      </Box>
    );
  }

  return (
    <Box p={4} sx={{ maxWidth: 1200, margin: "0 auto", animation: "fadeIn 0.5s ease" }}>
      {/* Header section with Glassmorphic design */}
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Settings sx={{ color: "var(--color-primary)", fontSize: "2.2rem" }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
              Faculty Appraisal Settings
            </Typography>
            <Typography variant="body2" color="var(--text-secondary)">
              Define point configurations and weightage rules for self-appraisals.
            </Typography>
          </Box>
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

          <Button
            variant="contained"
            color="primary"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={loading}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              px: 3,
              boxShadow: "0 4px 14px rgba(59, 130, 246, 0.4)",
              background: "var(--gradient-primary)",
              color: "#fff"
            }}
          >
            Save Settings
          </Button>
        </Box>
      </Box>

      {/* Settings Sections */}
      <Grid container spacing={4}>
        {/* Section 1: Teaching Metrics */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: "flex", alignItems: "center", gap: 1, color: "var(--text-primary)" }}>
            1. Teaching & Learning Metric Settings (Max 80 points)
            <Tooltip title="Formulas are based on average points across all theory courses. Each category has a maximum of 20 points.">
              <InfoOutlined fontSize="small" sx={{ color: "var(--color-primary)", cursor: "pointer" }} />
            </Tooltip>
          </Typography>

          <Grid container spacing={3}>
            {/* 1.1 Course Pass Percentage Points Config */}
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)" }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: "var(--color-primary)" }}>
                    1.1 Course Average Pass Percentage Points
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  {config.teaching.passPercentagePoints.map((range, idx) => (
                    <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1.5 }}>
                      <TextField
                        label="Min %"
                        type="number"
                        size="small"
                        value={range.min}
                        onChange={(e) => updateRange("passPercentagePoints", idx, "min", e.target.value)}
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        label="Max %"
                        type="number"
                        size="small"
                        value={range.max}
                        onChange={(e) => updateRange("passPercentagePoints", idx, "max", e.target.value)}
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        label="Points"
                        type="number"
                        size="small"
                        value={range.points}
                        onChange={(e) => updateRange("passPercentagePoints", idx, "points", e.target.value)}
                        sx={{ flex: 1 }}
                      />
                      <IconButton color="error" size="small" onClick={() => deleteRange("passPercentagePoints", idx)}>
                        <Delete />
                      </IconButton>
                    </Box>
                  ))}

                  <Button
                    startIcon={<Add />}
                    size="small"
                    onClick={() => addRange("passPercentagePoints")}
                    sx={{ mt: 1, textTransform: "none", fontWeight: 700 }}
                  >
                    Add Point Range
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* 1.2 Course Feedback Points Config */}
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)" }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: "var(--color-primary)" }}>
                    1.2 Faculty Course Feedback Points
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  {config.teaching.feedbackPoints.map((range, idx) => (
                    <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1.5 }}>
                      <TextField
                        label="Min %"
                        type="number"
                        size="small"
                        value={range.min}
                        onChange={(e) => updateRange("feedbackPoints", idx, "min", e.target.value)}
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        label="Max %"
                        type="number"
                        size="small"
                        value={range.max}
                        onChange={(e) => updateRange("feedbackPoints", idx, "max", e.target.value)}
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        label="Points"
                        type="number"
                        size="small"
                        value={range.points}
                        onChange={(e) => updateRange("feedbackPoints", idx, "points", e.target.value)}
                        sx={{ flex: 1 }}
                      />
                      <IconButton color="error" size="small" onClick={() => deleteRange("feedbackPoints", idx)}>
                        <Delete />
                      </IconButton>
                    </Box>
                  ))}

                  <Button
                    startIcon={<Add />}
                    size="small"
                    onClick={() => addRange("feedbackPoints")}
                    sx={{ mt: 1, textTransform: "none", fontWeight: 700 }}
                  >
                    Add Point Range
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* 1.3 Proctoring Average Points Config */}
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)" }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: "var(--color-primary)" }}>
                    1.3 Proctoring Pass Percentage Points
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  {config.teaching.proctoringPoints.map((range, idx) => (
                    <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1.5 }}>
                      <TextField
                        label="Min %"
                        type="number"
                        size="small"
                        value={range.min}
                        onChange={(e) => updateRange("proctoringPoints", idx, "min", e.target.value)}
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        label="Max %"
                        type="number"
                        size="small"
                        value={range.max}
                        onChange={(e) => updateRange("proctoringPoints", idx, "max", e.target.value)}
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        label="Points"
                        type="number"
                        size="small"
                        value={range.points}
                        onChange={(e) => updateRange("proctoringPoints", idx, "points", e.target.value)}
                        sx={{ flex: 1 }}
                      />
                      <IconButton color="error" size="small" onClick={() => deleteRange("proctoringPoints", idx)}>
                        <Delete />
                      </IconButton>
                    </Box>
                  ))}

                  <Button
                    startIcon={<Add />}
                    size="small"
                    onClick={() => addRange("proctoringPoints")}
                    sx={{ mt: 1, textTransform: "none", fontWeight: 700 }}
                  >
                    Add Point Range
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* 1.4 CO Attainment Points Config */}
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", height: "100%" }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: "var(--color-primary)" }}>
                    1.4 CO Attainment Target Reached Points
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Grid container spacing={2}>
                    {[5, 4, 3, 2].map((coVal) => (
                      <Grid item xs={6} key={coVal}>
                        <TextField
                          label={`Attained ${coVal} COs`}
                          type="number"
                          fullWidth
                          size="small"
                          value={config.teaching.coAttainmentPoints[coVal] || 0}
                          onChange={(e) => updateCoAttainment(coVal, e.target.value)}
                        />
                      </Grid>
                    ))}
                  </Grid>
                  <Alert severity="info" sx={{ mt: 2, borderRadius: "10px", fontSize: "0.8rem" }}>
                    Points are automatically mapped depending on the number of Course Outcomes successfully reached.
                  </Alert>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Section 2: Research Metric configurations */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: "flex", alignItems: "center", gap: 1, color: "var(--text-primary)", mt: 2 }}>
            2. Research Point Rules
          </Typography>

          <Grid container spacing={3}>
            {/* 2.1 Papers Publication Points */}
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", height: "100%" }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: "var(--color-primary)" }}>
                    2.1 Papers Publication Points
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Grid container spacing={2}>
                    {Object.keys(config.research.journalPoints).map((quartile) => (
                      <Grid item xs={12} key={quartile}>
                        <TextField
                          label={quartile}
                          type="number"
                          fullWidth
                          size="small"
                          value={config.research.journalPoints[quartile] || 0}
                          onChange={(e) => updateResearchMetric("journalPoints", quartile, e.target.value)}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* 2.2 Ph.D Guiding Points */}
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", height: "100%" }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: "var(--color-primary)" }}>
                    2.2 Ph.D Guiding Points
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        label="Ph.D Guiding (Pursuing)"
                        type="number"
                        fullWidth
                        size="small"
                        value={config.research.phdGuidingPoints.pursuing}
                        onChange={(e) => updateResearchMetric("phdGuidingPoints", "pursuing", e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Ph.D Guiding (Awarded)"
                        type="number"
                        fullWidth
                        size="small"
                        value={config.research.phdGuidingPoints.awarded}
                        onChange={(e) => updateResearchMetric("phdGuidingPoints", "awarded", e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* 2.3 Books, Chapters & Conferences */}
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", height: "100%" }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: "var(--color-primary)" }}>
                    2.3 Books, Chapters & Conferences
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        label="ISBN Book (2.3)"
                        type="number"
                        fullWidth
                        size="small"
                        value={config.research.bookConferencePoints?.isbnBook ?? ""}
                        onChange={(e) => updateResearchMetric("bookConferencePoints", "isbnBook", e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="ISBN Book Chapter (2.3)"
                        type="number"
                        fullWidth
                        size="small"
                        value={config.research.bookConferencePoints?.isbnBookChapter ?? ""}
                        onChange={(e) => updateResearchMetric("bookConferencePoints", "isbnBookChapter", e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Scopus Conference (2.3)"
                        type="number"
                        fullWidth
                        size="small"
                        value={config.research.bookConferencePoints?.scopusConference ?? ""}
                        onChange={(e) => updateResearchMetric("bookConferencePoints", "scopusConference", e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Max Books/Chapters/Confs Capped (2.3)"
                        type="number"
                        fullWidth
                        size="small"
                        value={config.research.bookConferencePoints?.maxPoints ?? ""}
                        onChange={(e) => updateResearchMetric("bookConferencePoints", "maxPoints", e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* 2.4 Patents Points */}
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", height: "100%" }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: "var(--color-primary)" }}>
                    2.4 Patents Points
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        label="Patents (Published)"
                        type="number"
                        fullWidth
                        size="small"
                        value={config.research.patentPoints.published}
                        onChange={(e) => updateResearchMetric("patentPoints", "published", e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Patents (Granted)"
                        type="number"
                        fullWidth
                        size="small"
                        value={config.research.patentPoints.granted}
                        onChange={(e) => updateResearchMetric("patentPoints", "granted", e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* 2.5 Novel Products / Technology */}
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", height: "100%" }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: "var(--color-primary)" }}>
                    2.5 Novel Products / Technology
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        label="Novel Product (Developed)"
                        type="number"
                        fullWidth
                        size="small"
                        value={config.research.novelProductPoints.developed}
                        onChange={(e) => updateResearchMetric("novelProductPoints", "developed", e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Novel Product (Implemented)"
                        type="number"
                        fullWidth
                        size="small"
                        value={config.research.novelProductPoints.implemented}
                        onChange={(e) => updateResearchMetric("novelProductPoints", "implemented", e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* 2.6 Project Proposals / Consultancies Points */}
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", height: "100%" }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: "var(--color-primary)" }}>
                    2.6 Project Proposals / Consultancies Points
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        label="Project Proposals (Shortlisted)"
                        type="number"
                        fullWidth
                        size="small"
                        value={config.research.projectProposalPoints.shortlisted}
                        onChange={(e) => updateResearchMetric("projectProposalPoints", "shortlisted", e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Project Proposals (Sanctioned / Lakh)"
                        type="number"
                        fullWidth
                        size="small"
                        value={config.research.projectProposalPoints.sanctionedPerLakh}
                        onChange={(e) => updateResearchMetric("projectProposalPoints", "sanctionedPerLakh", e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Section 3: Extension / Value Addition */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: "flex", alignItems: "center", gap: 1, color: "var(--text-primary)", mt: 2 }}>
            3. Extension / Value Addition Points
          </Typography>

          <Grid container spacing={3}>
            {/* 3.1 Faculty Resource Utilization */}
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", height: "100%" }}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "var(--color-primary)" }}>
                      3.1 Resource Utilization Capped Points (Max: 10)
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />

                  <Typography variant="body2" sx={{ fontSize: "0.75rem", color: "var(--text-secondary)", mb: 2 }}>
                    Configure the points for organizing events, acting as resource persons, or participating.
                  </Typography>

                  <Box sx={{ mb: 2, border: "1px solid var(--border-color)", borderRadius: "12px", p: 1, background: "var(--bg-accent-4)" }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, py: 1, fontSize: "0.75rem" }}>Event / Category</TableCell>
                          <TableCell sx={{ fontWeight: 700, py: 1, fontSize: "0.75rem" }}>Role</TableCell>
                          <TableCell sx={{ fontWeight: 700, py: 1, fontSize: "0.75rem", width: "100px" }} align="right">Points</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell sx={{ py: 1, fontSize: "0.75rem" }}>Conference</TableCell>
                          <TableCell sx={{ py: 1, fontSize: "0.75rem" }}>Chair / Co-Chair / Finance / Publication / Registration</TableCell>
                          <TableCell sx={{ py: 0.5 }} align="right">
                            <TextField
                              type="number"
                              size="small"
                              value={config.valueAddition?.resourceUtilizationPoints?.conference ?? 10}
                              onChange={(e) => updateResourcePoint("conference", e.target.value)}
                              inputProps={{ style: { textAlign: 'right', padding: '6px' } }}
                              sx={{ width: "80px" }}
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ py: 1, fontSize: "0.75rem" }}>STTP / Refresher Course</TableCell>
                          <TableCell sx={{ py: 1, fontSize: "0.75rem" }}>Convenor / Co-Convenor / Coordinator</TableCell>
                          <TableCell sx={{ py: 0.5 }} align="right">
                            <TextField
                              type="number"
                              size="small"
                              value={config.valueAddition?.resourceUtilizationPoints?.sttp ?? 10}
                              onChange={(e) => updateResourcePoint("sttp", e.target.value)}
                              inputProps={{ style: { textAlign: 'right', padding: '6px' } }}
                              sx={{ width: "80px" }}
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ py: 1, fontSize: "0.75rem" }}>FDP / Symposium</TableCell>
                          <TableCell sx={{ py: 1, fontSize: "0.75rem" }}>Convenor / Co-Convenor / Coordinator</TableCell>
                          <TableCell sx={{ py: 0.5 }} align="right">
                            <TextField
                              type="number"
                              size="small"
                              value={config.valueAddition?.resourceUtilizationPoints?.fdp ?? 10}
                              onChange={(e) => updateResourcePoint("fdp", e.target.value)}
                              inputProps={{ style: { textAlign: 'right', padding: '6px' } }}
                              sx={{ width: "80px" }}
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ py: 1, fontSize: "0.75rem" }}>Guest Lecture / Workshop</TableCell>
                          <TableCell sx={{ py: 1, fontSize: "0.75rem" }}>Coordinator</TableCell>
                          <TableCell sx={{ py: 0.5 }} align="right">
                            <TextField
                              type="number"
                              size="small"
                              value={config.valueAddition?.resourceUtilizationPoints?.guestLecture ?? 2}
                              onChange={(e) => updateResourcePoint("guestLecture", e.target.value)}
                              inputProps={{ style: { textAlign: 'right', padding: '6px' } }}
                              sx={{ width: "80px" }}
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ py: 1, fontSize: "0.75rem" }}>Resource Person</TableCell>
                          <TableCell sx={{ py: 1, fontSize: "0.75rem" }}>Per session conducted</TableCell>
                          <TableCell sx={{ py: 0.5 }} align="right">
                            <TextField
                              type="number"
                              size="small"
                              value={config.valueAddition?.resourceUtilizationPoints?.resourcePerson ?? 2}
                              onChange={(e) => updateResourcePoint("resourcePerson", e.target.value)}
                              inputProps={{ style: { textAlign: 'right', padding: '6px' } }}
                              sx={{ width: "80px" }}
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ py: 1, fontSize: "0.75rem" }}>Participant</TableCell>
                          <TableCell sx={{ py: 1, fontSize: "0.75rem" }}>Per day attended</TableCell>
                          <TableCell sx={{ py: 0.5 }} align="right">
                            <TextField
                              type="number"
                              size="small"
                              value={config.valueAddition?.resourceUtilizationPoints?.participated ?? 1}
                              onChange={(e) => updateResourcePoint("participated", e.target.value)}
                              inputProps={{ style: { textAlign: 'right', padding: '6px' } }}
                              sx={{ width: "80px" }}
                            />
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* 3.2 Contribution/Expertise Capped Max Points */}
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", height: "100%" }}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "var(--color-primary)" }}>
                      3.2 Expertise/Recognition Capped Points (Max: 10)
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />

                  <Typography variant="body2" sx={{ fontSize: "0.75rem", color: "var(--text-secondary)", mb: 2 }}>
                    Configure the points for individual expertise, recognition, and contributions.
                  </Typography>

                  <Box sx={{ mb: 2, maxHeight: "320px", overflowY: "auto", border: "1px solid var(--border-color)", borderRadius: "12px", p: 1, background: "var(--bg-accent-4)" }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, py: 1, fontSize: "0.75rem" }}>Activity</TableCell>
                          <TableCell sx={{ fontWeight: 700, py: 1, fontSize: "0.75rem", width: "100px" }} align="right">Points</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {[
                          { key: "memberBOS", name: "Member of BOG/GB/AC/BOS (Outside AUS only)", def: 5 },
                          { key: "editorialBoardSCIE", name: "Editorial Board Member (SCIE / Q1 / Q2)", def: 5 },
                          { key: "editorialBoardESCI", name: "Editorial Board Member (ESCI/Q3/Q4/Conf)", def: 3 },
                          { key: "awardsGovt", name: "Awards (MHRD/AICTE/UGC/State Govt./Top 2%)", def: 5 },
                          { key: "awardsOthers", name: "Awards (NGO / Trust / Others)", def: 3 },
                          { key: "developedEContent", name: "Developed E-Content (Complete Course)", def: 10 },
                          { key: "certificationNewAge", name: "Certification on New Age Tech (Min. 40 Hours)", def: 5 },
                          { key: "hackathonShortlisted", name: "Student Shortlisted in Hackathon Finals", def: 5 },
                          { key: "newspaperArticle", name: "Magazine/Newspaper Article Published", def: 3 },
                          { key: "researchFacility", name: "Establishment/Maintenance of Research Facility", def: 3 },
                          { key: "nptel12W", name: "NPTEL Course Completion (12 Weeks)", def: 10 },
                          { key: "nptel8W", name: "NPTEL Course Completion (8 Weeks)", def: 8 },
                          { key: "nptel4W", name: "NPTEL Course Completion (4 Weeks)", def: 5 },
                          { key: "coursera", name: "Coursera Course Completion (Min. 40 Hours)", def: 5 },
                          { key: "grantSanctioned", name: "FDP/Seminar Grant Sanctioned", def: 5 }
                        ].map((row) => (
                          <TableRow key={row.key}>
                            <TableCell sx={{ py: 1, fontSize: "0.75rem" }}>{row.name}</TableCell>
                            <TableCell sx={{ py: 0.5 }} align="right">
                              <TextField
                                type="number"
                                size="small"
                                value={config.valueAddition?.expertisePoints?.[row.key] ?? row.def}
                                onChange={(e) => updateExpertisePoint(row.key, e.target.value)}
                                inputProps={{ style: { textAlign: 'right', padding: '6px' } }}
                                sx={{ width: "80px" }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        label="Max Expertise Points Capped (Max: 10)"
                        type="number"
                        fullWidth
                        size="small"
                        value={config.valueAddition?.expertiseMaxPoints ?? ""}
                        onChange={(e) => setConfig(prev => {
                          const updated = { ...prev };
                          if (!updated.valueAddition) updated.valueAddition = {};
                          updated.valueAddition.expertiseMaxPoints = Number(e.target.value);
                          return updated;
                        })}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Section 4: Administrative Responsibilities */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: "flex", alignItems: "center", gap: 1, color: "var(--text-primary)", mt: 2 }}>
            4. Administrative Responsibilities Capped Points (Max: 20)
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)" }}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "var(--color-primary)" }}>
                      Administrative Responsibilities Capped Points (Max: 20)
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />

                  <Typography variant="body2" sx={{ fontSize: "0.75rem", color: "var(--text-secondary)", mb: 2 }}>
                    Configure the points for Central Level and Department Level administrative roles.
                  </Typography>

                  <Box sx={{ mb: 2, maxHeight: "360px", overflowY: "auto", border: "1px solid var(--border-color)", borderRadius: "12px", p: 1, background: "var(--bg-accent-4)" }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, py: 1, fontSize: "0.75rem" }}>Activity / Role</TableCell>
                          <TableCell sx={{ fontWeight: 700, py: 1, fontSize: "0.75rem", width: "120px" }} align="right">Central Level</TableCell>
                          <TableCell sx={{ fontWeight: 700, py: 1, fontSize: "0.75rem", width: "120px" }} align="right">Dept Level</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {[
                          { name: "Dean / Associate Dean / CoE", centralKey: "deanCentral", deptKey: null, defCentral: 20, defDept: null },
                          { name: "HoD / Dy. CoE / Controller (University Office)", centralKey: "hodCentral", deptKey: "hodDept", defCentral: 15, defDept: 15 },
                          { name: "Dy. HoD / Department Exam Cell Incharge", centralKey: null, deptKey: "dyHodDept", defCentral: null, defDept: 10 },
                          { name: "Time Table / Project Coordinator / Curriculum Coordinator", centralKey: null, deptKey: "timetableDept", defCentral: null, defDept: 10 },
                          { name: "Placement / Internship / Alumni Coordinator", centralKey: "placementCentral", deptKey: "placementDept", defCentral: 10, defDept: 10 },
                          { name: "Coursera / LinkedIn Learning Coordinator / ALA", centralKey: "courseraCentral", deptKey: "courseraDept", defCentral: 10, defDept: 5 },
                          { name: "EDC / IIC / IQAC Coordinator", centralKey: "edcCentral", deptKey: "edcDept", defCentral: 10, defDept: 5 },
                          { name: "Course Coordinator", centralKey: null, deptKey: "courseDept", defCentral: null, defDept: 5 },
                          { name: "Website Coordinator", centralKey: "websiteCentral", deptKey: null, defCentral: 10, defDept: null },
                          { name: "NSS / Professional Chapter Coordinator", centralKey: "nssCentral", deptKey: "nssDept", defCentral: 10, defDept: 5 },
                          { name: "Training Program Coordinator (Smart Interviews/GPP/etc.)", centralKey: "trainingCentral", deptKey: "trainingDept", defCentral: 10, defDept: 5 },
                          { name: "DRC / Research Coordinator", centralKey: null, deptKey: "drcDept", defCentral: null, defDept: 5 },
                          { name: "Anti-Ragging Committee Coordinator", centralKey: "antiRaggingCentral", deptKey: "antiRaggingDept", defCentral: 5, defDept: 3 },
                          { name: "Any Other Remarkable Activity Coordinator", centralKey: "otherCentral", deptKey: "otherDept", defCentral: 10, defDept: 5 }
                        ].map((row, idx) => (
                          <TableRow key={idx}>
                            <TableCell sx={{ py: 1, fontSize: "0.75rem" }}>{row.name}</TableCell>
                            <TableCell sx={{ py: 0.5 }} align="right">
                              {row.centralKey ? (
                                <TextField
                                  type="number"
                                  size="small"
                                  value={config.administration?.rolePoints?.[row.centralKey] ?? row.defCentral}
                                  onChange={(e) => updateAdminRolePoint(row.centralKey, e.target.value)}
                                  inputProps={{ style: { textAlign: 'right', padding: '6px' } }}
                                  sx={{ width: "90px" }}
                                />
                              ) : "-"}
                            </TableCell>
                            <TableCell sx={{ py: 0.5 }} align="right">
                              {row.deptKey ? (
                                <TextField
                                  type="number"
                                  size="small"
                                  value={config.administration?.rolePoints?.[row.deptKey] ?? row.defDept}
                                  onChange={(e) => updateAdminRolePoint(row.deptKey, e.target.value)}
                                  inputProps={{ style: { textAlign: 'right', padding: '6px' } }}
                                  sx={{ width: "90px" }}
                                />
                              ) : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        label="Max Administrative Points Capped (Max: 20)"
                        type="number"
                        fullWidth
                        size="small"
                        value={config.administration?.maxPoints ?? ""}
                        onChange={(e) => setConfig(prev => {
                          const updated = { ...prev };
                          if (!updated.administration) updated.administration = {};
                          updated.administration.maxPoints = Number(e.target.value);
                          return updated;
                        })}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AppraisalSettings;
