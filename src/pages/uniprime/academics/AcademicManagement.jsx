import React, { useEffect, useState } from "react";
import API from "../../../api/axios";
import {
  Box, Typography, Button, Grid, Card, CardContent, Chip, TextField,
  Collapse, IconButton, FormControl, Select, MenuItem, Divider, Paper, Tooltip
} from "@mui/material";
import {
  Add, ExpandMore, ExpandLess, School, Class, CheckCircle, RadioButtonUnchecked, Edit, Close, Delete
} from "@mui/icons-material";

const AcademicManagement = () => {
  const [years, setYears] = useState([]);
  const currentYear = new Date().getFullYear();
  const minStartYear = currentYear - 1;
  const [newStartYear, setNewStartYear] = useState(currentYear);
  const [newEndYear, setNewEndYear] = useState(currentYear + 1);
  const [expandedYear, setExpandedYear] = useState(null);
  const [semesterTypes, setSemesterTypes] = useState([]);
  const [editingYear, setEditingYear] = useState({ id: null, value: "" });
  const [newSemesterName, setNewSemesterName] = useState("");

  useEffect(() => {
    fetchYears();
    fetchSemesterTypes();
  }, []);

  const fetchSemesterTypes = async () => {
    try {
      const res = await API.get("/api/semester-types");
      setSemesterTypes(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const createSemesterType = async () => {
    if (!newSemesterName) return;
    try {
      await API.post("/api/semester-types", { name: newSemesterName });
      setNewSemesterName("");
      fetchSemesterTypes();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create semester type");
    }
  };

  const toggleSemesterType = async (id) => {
    try {
      await API.put(`/api/semester-types/${id}/toggle`);
      fetchSemesterTypes();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteSemesterType = async (id, name) => {
    if (!window.confirm(`Delete ${name} semester type? This might affect existing records.`)) return;
    try {
      await API.delete(`/api/semester-types/${id}`);
      fetchSemesterTypes();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete");
    }
  };

  const seedDefaults = async () => {
    try {
      await API.post("/api/semester-types/seed");
      fetchSemesterTypes();
    } catch (err) {
      alert("Failed to seed");
    }
  };

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

  const deleteYear = async (id, yearName) => {
    if (!window.confirm(`Are you sure you want to delete Academic Year ${yearName}? This will also delete all its semesters.`)) return;
    try {
      await API.delete(`/api/academic-years/${id}`);
      fetchYears();
      if (expandedYear === id) setExpandedYear(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete");
    }
  };

  const handleExpandYear = (id) => {
    setExpandedYear(expandedYear === id ? null : id);
  };

  const setYearSemester = async (yearId, semesterTypeId) => {
    try {
      await API.put(`/api/academic-years/${yearId}/semester-type`, { semesterTypeId });
      fetchYears();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update semester");
    }
  };



  return (
    <Box sx={{ p: 1 }}>
      {/* Global Semester Types Management */}
      <Paper elevation={0} sx={{
        p: 3,
        mb: 4,
        borderRadius: '24px',
        background: 'rgba(255, 255, 255, 0.00)',
        backdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Class color="primary" /> Global Semester Types
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center' }}>
          <TextField
            size="small"
            label="Semester Name (e.g. ODD)"
            value={newSemesterName}
            onChange={(e) => setNewSemesterName(e.target.value.toUpperCase())}
            sx={{ width: { xs: '100%', sm: 250 } }}
          />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, width: { xs: '100%', sm: 'auto' } }}>
            <Button variant="contained" onClick={createSemesterType} startIcon={<Add />} sx={{ borderRadius: '50px', whiteSpace: 'nowrap', background: "linear-gradient(90deg, #004e92, #000428)", boxShadow: '0 4px 12px rgba(0, 78, 146, 0.3)', transition: '0.3s', '&:hover': { background: "linear-gradient(90deg, #003a6d, #000214)", boxShadow: '0 6px 16px rgba(0, 78, 146, 0.4)' } }}>
              Add Type
            </Button>
            <Button variant="outlined" onClick={seedDefaults} size="small" sx={{ borderRadius: '50px', whiteSpace: 'nowrap', border: '1.5px solid #004e92', background: 'transparent', color: '#004e92', fontWeight: 700, px: 2, '&:hover': { background: 'rgba(0, 78, 146, 0.05)' } }}>
              Seed Defaults
            </Button>
          </Box>
        </Box>

        <Box sx={{
          display: 'flex',
          gap: { xs: 1, sm: 2 },
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {semesterTypes.map((st) => (
            <Chip
              key={st._id}
              label={st.name}
              onDelete={() => deleteSemesterType(st._id, st.name)}
              onClick={() => toggleSemesterType(st._id)}
              color={st.isActive ? "primary" : "default"}
              variant={st.isActive ? "filled" : "outlined"}
              sx={{
                fontWeight: 600,
                borderRadius: '12px',
                flex: { xs: '1 1 calc(33.33% - 8px)', sm: '0 1 auto' },
                minWidth: '80px',
                px: 1,
                background: st.isActive ? 'linear-gradient(90deg, #004e92, #000428)' : 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                color: st.isActive ? '#fff' : '#004e92',
                '& .MuiChip-deleteIcon': {
                  color: st.isActive ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.4)',
                  '&:hover': { color: st.isActive ? '#fff' : '#d32f2f' }
                }
              }}
            />
          ))}
          {semesterTypes.length === 0 && (
            <Typography variant="body2" color="textSecondary">No semester types defined. Use 'Seed Defaults' to start.</Typography>
          )}
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{
          fontWeight: 800,
          color: "#1a237e",
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          fontSize: { xs: '1.4rem', sm: '1.75rem', md: '2.125rem' },
          whiteSpace: 'nowrap'
        }}>
          <School sx={{ fontSize: { xs: 28, sm: 32, md: 40 } }} color="primary" />
          Academic Management
        </Typography>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', sm: 'auto auto auto' },
          gap: 2,
          alignItems: 'center',
          width: { xs: '100%', sm: 'auto' }
        }}>
          <TextField
            size="small"
            type="number"
            label="Start Year"
            value={newStartYear}
            onChange={handleStartYearChange}
            sx={{ width: '100%' }}
            error={newStartYear < minStartYear}
            helperText={newStartYear < minStartYear ? "Too old" : ""}
          />
          <TextField
            size="small"
            type="number"
            label="End Year"
            value={newEndYear}
            onChange={(e) => setNewEndYear(parseInt(e.target.value) || "")}
            sx={{ width: '100%' }}
          />
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={createYear}
            sx={{
              borderRadius: '50px',
              px: 3,
              height: 40,
              gridColumn: { xs: 'span 2', sm: 'span 1' },
              width: '100%',
              background: "linear-gradient(90deg, #004e92, #000428)",
              boxShadow: '0 4px 12px rgba(0, 78, 146, 0.3)',
              transition: '0.3s',
              '&:hover': {
                background: "linear-gradient(90deg, #003a6d, #000214)",
                boxShadow: '0 6px 16px rgba(0, 78, 146, 0.4)',
              }
            }}
            disabled={newStartYear < minStartYear || !newStartYear || !newEndYear}
          >
            Add Year
          </Button>
        </Box>
      </Box>

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
        gap: 3
      }}>
        {years.map((y) => (
          <Box key={y._id}>
            <Card
              sx={{
                borderRadius: '24px',
                background: y.isActive ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(20px) saturate(180%)',
                border: y.isActive ? '2px solid rgba(11, 82, 153, 0.5)' : '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: y.isActive ? '0 12px 40px rgba(11, 82, 153, 0.15)' : '0 8px 32px rgba(31, 38, 135, 0.05)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-6px)',
                  background: 'rgba(255, 255, 255, 0.35)',
                  boxShadow: '0 15px 45px rgba(31, 38, 135, 0.08)'
                }
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
                        icon={<RadioButtonUnchecked sx={{ color: '#004e92 !important' }} />}
                        label="Set Active"
                        color="default"
                        size="small"
                        onClick={() => toggleYear(y._id, false)}
                        sx={{ 
                          cursor: 'pointer', 
                          borderRadius: '50px', 
                          border: '1.5px solid #004e92', 
                          background: 'transparent',
                          color: '#004e92',
                          fontWeight: 700,
                          '&:hover': { background: 'rgba(0, 78, 146, 0.05)' } 
                        }}
                      />
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Delete Year">
                      <IconButton onClick={() => deleteYear(y._id, y.year)} sx={{ background: '#fff5f5', color: '#d32f2f', '&:hover': { background: '#ffebee' } }}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <IconButton onClick={() => handleExpandYear(y._id)} sx={{ background: '#f5f5f5' }}>
                      {expandedYear === y._id ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </Box>
                </Box>

                <Collapse in={expandedYear === y._id} timeout="auto" unmountOnExit>
                  <Box sx={{ mt: 3, p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: '#555', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Class fontSize="small" /> Semesters for {y.year}
                    </Typography>

                    {/* Semester Type Options */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {semesterTypes.map((st) => {
                        const isActive = y.activeSemesterTypeId?._id === st._id || y.activeSemesterTypeId === st._id;
                        return (
                          <Paper
                            key={st._id}
                            elevation={0}
                            sx={{
                              p: 1.5,
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              border: '1px solid #e0e0e0',
                              borderRadius: 2,
                              bgcolor: isActive ? '#f0fdf4' : '#fff'
                            }}
                          >
                            <Typography variant="body1" sx={{ fontWeight: isActive ? 700 : 500, color: isActive ? '#1b5e20' : '#444' }}>
                              {st.name} Semester
                            </Typography>
                            {isActive ? (
                              <Chip
                                size="small"
                                label="Active"
                                color="success"
                              />
                            ) : (
                              <Tooltip title={!y.isActive ? "Academic year must be active first" : ""} placement="top">
                                <span>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => setYearSemester(y._id, st._id)}
                                    disabled={!y.isActive}
                                    sx={{ 
                                      borderRadius: '50px', 
                                      textTransform: 'none', 
                                      fontWeight: 700,
                                      border: '1.5px solid #004e92', 
                                      background: 'transparent',
                                      color: '#004e92',
                                      '&:hover': { background: 'rgba(0, 78, 146, 0.05)' }
                                    }}
                                  >
                                    Activate
                                  </Button>
                                </span>
                              </Tooltip>
                            )}
                          </Paper>
                        );
                      })}
                    </Box>
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default AcademicManagement;
