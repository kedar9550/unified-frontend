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
  Tooltip
} from "@mui/material";
import { Save, Add, Delete, Settings, InfoOutlined } from "@mui/icons-material";
import axiosInstance from "../../api/axios";
import { toast } from "sonner";

const AppraisalSettings = () => {
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState(null);

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
        research: config.research
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
            {/* 2.1 Journal Publication points */}
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)" }}>
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

            {/* Other Research Weights */}
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", height: "100%" }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: "var(--color-primary)" }}>
                    Guiding, Patents, & Proposal Metrics
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

                    <Grid item xs={12}>
                      <TextField
                        label="Scopus Citation rate (Points per citation)"
                        type="number"
                        fullWidth
                        size="small"
                        value={config.research.citationRate}
                        onChange={(e) => setConfig(prev => {
                          const updated = { ...prev };
                          updated.research.citationRate = Number(e.target.value);
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

        {/* Section 3: Extension / Value Addition */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: "flex", alignItems: "center", gap: 1, color: "var(--text-primary)", mt: 2 }}>
            3. Extension / Value Addition Points
          </Typography>

          <Grid container spacing={3}>
            {/* 3.1 Faculty Resource Utilization */}
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)" }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: "var(--color-primary)" }}>
                    3.1 Resource Utilization Points
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        label="Organized Event (STTP/FDP/Conf)"
                        type="number"
                        fullWidth
                        size="small"
                        value={config.valueAddition?.resourceUtilization?.organized ?? ""}
                        onChange={(e) => setConfig(prev => {
                          const updated = { ...prev };
                          if (!updated.valueAddition) updated.valueAddition = { resourceUtilization: {} };
                          if (!updated.valueAddition.resourceUtilization) updated.valueAddition.resourceUtilization = {};
                          updated.valueAddition.resourceUtilization.organized = Number(e.target.value);
                          return updated;
                        })}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Guest Lecture Coordinator"
                        type="number"
                        fullWidth
                        size="small"
                        value={config.valueAddition?.resourceUtilization?.guestLectureCoordinator ?? ""}
                        onChange={(e) => setConfig(prev => {
                          const updated = { ...prev };
                          if (!updated.valueAddition) updated.valueAddition = { resourceUtilization: {} };
                          if (!updated.valueAddition.resourceUtilization) updated.valueAddition.resourceUtilization = {};
                          updated.valueAddition.resourceUtilization.guestLectureCoordinator = Number(e.target.value);
                          return updated;
                        })}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Resource Person (per session)"
                        type="number"
                        fullWidth
                        size="small"
                        value={config.valueAddition?.resourceUtilization?.resourcePerson ?? ""}
                        onChange={(e) => setConfig(prev => {
                          const updated = { ...prev };
                          if (!updated.valueAddition) updated.valueAddition = { resourceUtilization: {} };
                          if (!updated.valueAddition.resourceUtilization) updated.valueAddition.resourceUtilization = {};
                          updated.valueAddition.resourceUtilization.resourcePerson = Number(e.target.value);
                          return updated;
                        })}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Participated (per day)"
                        type="number"
                        fullWidth
                        size="small"
                        value={config.valueAddition?.resourceUtilization?.participated ?? ""}
                        onChange={(e) => setConfig(prev => {
                          const updated = { ...prev };
                          if (!updated.valueAddition) updated.valueAddition = { resourceUtilization: {} };
                          if (!updated.valueAddition.resourceUtilization) updated.valueAddition.resourceUtilization = {};
                          updated.valueAddition.resourceUtilization.participated = Number(e.target.value);
                          return updated;
                        })}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* 3.2 Contribution/Expertise Capped Max Points */}
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", height: "100%" }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: "var(--color-primary)" }}>
                    3.2 Expertise/Recognition Capped Points
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

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
                  <Alert severity="info" sx={{ mt: 3, borderRadius: "10px", fontSize: "0.8rem" }}>
                    Capped maximum self-assessment points allowed under Faculty Expertise/Contribution section.
                  </Alert>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Section 4: Administrative Responsibilities */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: "flex", alignItems: "center", gap: 1, color: "var(--text-primary)", mt: 2 }}>
            4. Administrative Responsibilities Points
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)" }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: "var(--color-primary)" }}>
                    Administrative Responsibilities Capped Points
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

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
                  <Alert severity="info" sx={{ mt: 3, borderRadius: "10px", fontSize: "0.8rem" }}>
                    Capped maximum points allowed for Dean, HoD, Coordinator, and Incharge duties.
                  </Alert>
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
