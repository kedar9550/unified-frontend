import React, { useEffect, useState } from "react";
import API from "../../../api/axios";
import {
  Box, Typography, Button, Grid, Card, CardContent, Chip, TextField,
  Collapse, IconButton, FormControl, Select, MenuItem, Divider, Paper, Tooltip
} from "@mui/material";
import {
  Add, ExpandMore, ExpandLess, School, Class, CheckCircle, RadioButtonUnchecked, Edit, Close
} from "@mui/icons-material";

const AcademicManagement = () => {
  const [years, setYears] = useState([]);
  const currentYear = new Date().getFullYear();
  const minStartYear = currentYear - 1;
  const [newStartYear, setNewStartYear] = useState(currentYear);
  const [newEndYear, setNewEndYear] = useState(currentYear + 1);
  const [expandedYear, setExpandedYear] = useState(null);
  const [semesters, setSemesters] = useState([]);
  const [newSemesterType, setNewSemesterType] = useState("ODD");
  const [editingYear, setEditingYear] = useState({ id: null, value: "" });

  useEffect(() => {
    fetchYears();
  }, []);

  const fetchYears = async () => {
    try {
      const res = await API.get("/api/academic-years");
      setYears(res.data.years || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartYearChange = (e) => {
    const val = parseInt(e.target.value) || "";
    setNewStartYear(val);
    if (val) setNewEndYear(val + 1);
  };

  const createYear = async () => {
    if (!newStartYear || !newEndYear) return;
    try {
      await API.post("/api/academic-years", { startYear: newStartYear, endYear: newEndYear });
      setNewStartYear(currentYear);
      setNewEndYear(currentYear + 1);
      fetchYears();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create");
    }
  };

  const toggleYear = async (id, currentState) => {
    try {
      await API.put(`/api/academic-years/${id}/toggle-status`, { isActive: !currentState });
      fetchYears();
      if (expandedYear === id) fetchSemesters(id);
    } catch (err) {
      console.error(err);
    }
  };

  const saveYearEdit = async (id) => {
    if (!editingYear.value) return;
    try {
      await API.put(`/api/academic-years/${id}`, { year: editingYear.value });
      setEditingYear({ id: null, value: "" });
      fetchYears();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update");
    }
  };

  const handleExpandYear = async (id) => {
    if (expandedYear === id) {
      setExpandedYear(null);
      return;
    }
    setExpandedYear(id);
    fetchSemesters(id);
  };

  const fetchSemesters = async (yearId) => {
    try {
      const res = await API.get(`/api/academic-years/${yearId}/semesters`);
      setSemesters(res.data.semesters || []);
    } catch (err) {
      console.error(err);
    }
  };

  const createSemester = async (yearId) => {
    try {
      await API.post(`/api/academic-years/${yearId}/semesters`, { type: newSemesterType });
      fetchSemesters(yearId);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create semester");
    }
  };

  const toggleSemester = async (yearId, semId, currentState) => {
    try {
      await API.put(`/api/academic-years/${yearId}/semesters/${semId}/toggle-status`, { isActive: !currentState });
      fetchSemesters(yearId);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to toggle semester");
    }
  };

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: "#1a237e", display: 'flex', alignItems: 'center', gap: 1 }}>
          <School fontSize="large" color="primary" />
          Academic Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            type="number"
            label="Start Year"
            value={newStartYear}
            onChange={handleStartYearChange}
            sx={{ width: 120 }}
            error={newStartYear < minStartYear}
            helperText={newStartYear < minStartYear ? "Too old" : ""}
          />
          <TextField
            size="small"
            type="number"
            label="End Year"
            value={newEndYear}
            onChange={(e) => setNewEndYear(parseInt(e.target.value) || "")}
            sx={{ width: 120 }}
          />
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={createYear}
            sx={{ borderRadius: 8, px: 3, height: 40 }}
            disabled={newStartYear < minStartYear || !newStartYear || !newEndYear}
          >
            Add Year
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {years.map((y) => (
          <Grid item xs={12} md={6} lg={4} key={y._id}>
            <Card
              sx={{
                borderRadius: 1,
                boxShadow: y.isActive ? '0 8px 32px rgba(46, 125, 50, 0.2)' : '0 4px 12px rgba(0,0,0,0.05)',
                border: y.isActive ? '2px solid #0D233B' : '2px solid transparent',
                transition: 'all 0.3s ease',
                '&:hover': { transform: 'translateY(-4px)' }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    {editingYear.id === y._id ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <TextField
                          size="small"
                          value={editingYear.value}
                          onChange={e => setEditingYear({ ...editingYear, value: e.target.value })}
                          autoFocus
                        />
                        <IconButton size="small" color="primary" onClick={() => saveYearEdit(y._id)}>
                          <CheckCircle fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => setEditingYear({ id: null, value: "" })}>
                          <Close fontSize="small" />
                        </IconButton>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: "#333" }}>
                          {y.year}
                        </Typography>
                        <IconButton size="small" onClick={() => setEditingYear({ id: y._id, value: y.year })}>
                          <Edit fontSize="small" color="action" />
                        </IconButton>
                      </Box>
                    )}

                    {y.isActive ? (
                      <Chip
                        icon={<CheckCircle />}
                        label="Active Year"
                        color="success"
                        size="small"
                        onClick={() => toggleYear(y._id, true)}
                        sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                      />
                    ) : (
                      <Chip
                        icon={<RadioButtonUnchecked />}
                        label="Set Active"
                        color="default"
                        size="small"
                        onClick={() => toggleYear(y._id, false)}
                        sx={{ cursor: 'pointer', '&:hover': { backgroundColor: '#e0e0e0' } }}
                      />
                    )}
                  </Box>
                  <IconButton onClick={() => handleExpandYear(y._id)} sx={{ background: '#f5f5f5' }}>
                    {expandedYear === y._id ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                </Box>

                <Collapse in={expandedYear === y._id} timeout="auto" unmountOnExit>
                  <Box sx={{ mt: 3, p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: '#555', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Class fontSize="small" /> Semesters for {y.year}
                    </Typography>

                    {/* Add Semester Form */}
                    <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                      <FormControl size="small" fullWidth>
                        <Select
                          value={newSemesterType}
                          onChange={(e) => setNewSemesterType(e.target.value)}
                        >
                          <MenuItem value="ODD">ODD</MenuItem>
                          <MenuItem value="EVEN">EVEN</MenuItem>
                          <MenuItem value="SUMMER">SUMMER</MenuItem>
                        </Select>
                      </FormControl>
                      <Button variant="outlined" size="small" color="primary" onClick={() => createSemester(y._id)}>
                        Add
                      </Button>
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    {/* Semesters List */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {semesters.length === 0 && (
                        <Typography variant="body2" color="text.secondary" textAlign="center">No semesters found</Typography>
                      )}
                      {semesters.map((sem) => (
                        <Paper key={sem._id} elevation={0} sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e0e0e0', borderRadius: 2, bgcolor: sem.isActive ? '#f0fdf4' : '#fff' }}>
                          <Typography variant="body1" sx={{ fontWeight: sem.isActive ? 700 : 500, color: sem.isActive ? '#1b5e20' : '#444' }}>
                            {sem.type} Semester
                          </Typography>
                          {sem.isActive ? (
                            <Chip
                              size="small"
                              label="Active"
                              color="success"
                              onClick={() => toggleSemester(y._id, sem._id, true)}
                              sx={{ cursor: 'pointer' }}
                            />
                          ) : (
                            <Tooltip title={!y.isActive ? "Academic year must be active first" : ""} placement="top">
                              <span>
                                <Button
                                  size="small"
                                  variant="text"
                                  color="inherit"
                                  onClick={() => toggleSemester(y._id, sem._id, false)}
                                  disabled={!y.isActive}
                                >
                                  Activate
                                </Button>
                              </span>
                            </Tooltip>
                          )}
                        </Paper>
                      ))}
                    </Box>
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default AcademicManagement;
