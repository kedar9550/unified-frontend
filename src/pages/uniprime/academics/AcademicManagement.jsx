import React, { useEffect, useState } from "react";
import API from "../../../api/axios";
import {
  Box, Typography, Button, Card, CardContent, Chip, TextField,
  IconButton, Select, MenuItem, Paper, Tooltip, Menu, InputAdornment, Grid
} from "@mui/material";
import {
  Add, School, CheckCircle, RadioButtonUnchecked, Edit, Delete, Search, Check, Close
} from "@mui/icons-material";
import PageHeader from "../../../components/common/PageHeader";

const AcademicManagement = () => {
  const [years, setYears] = useState([]);
  const [semesterTypes, setSemesterTypes] = useState([]);
  const [allPrograms, setAllPrograms] = useState([]);

  // Create year form
  const currentYear = new Date().getFullYear();
  const minStartYear = currentYear - 1;
  const [newStartYear, setNewStartYear] = useState(currentYear);
  const [newEndYear, setNewEndYear] = useState(currentYear + 1);
  const [newProgramId, setNewProgramId] = useState("");

  const [editingYearStr, setEditingYearStr] = useState({ oldYear: null, newYear: "" });

  // Add Program Menu
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeYearForMenu, setActiveYearForMenu] = useState(null);
  const [programSearch, setProgramSearch] = useState("");

  useEffect(() => {
    fetchYears();
    fetchSemesterTypes();
    fetchAllPrograms();
  }, []);

  const fetchSemesterTypes = async () => {
    try {
      const res = await API.get("/api/semester-types");
      setSemesterTypes(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllPrograms = async () => {
    try {
      const res = await API.get("/api/academics/programs");
      setAllPrograms(res.data.data || []);
    } catch (err) {
      console.error(err);
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

  const createGlobalYear = async () => {
    if (!newStartYear || !newEndYear || !newProgramId) {
      alert("Please select Start Year, End Year, and a Program");
      return;
    }
    try {
      await API.post("/api/academic-years", {
        startYear: newStartYear,
        endYear: newEndYear,
        programId: newProgramId
      });
      setNewStartYear(currentYear);
      setNewEndYear(currentYear + 1);
      setNewProgramId("");
      fetchYears();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create academic year");
    }
  };

  const addProgramToYear = async (programId) => {
    if (!activeYearForMenu) return;
    try {
      const [start, end] = activeYearForMenu.split("-");
      await API.post("/api/academic-years", {
        startYear: start,
        endYear: end,
        programId: programId
      });
      fetchYears();
      handleCloseMenu();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add program");
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

  const setYearSemester = async (yearId, semesterTypeId) => {
    try {
      await API.put(`/api/academic-years/${yearId}/semester-type`, { semesterTypeId });
      fetchYears();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update semester");
    }
  };

  const deleteYear = async (id, nameStr) => {
    if (!window.confirm(`Delete this entry for ${nameStr}?`)) return;
    try {
      await API.delete(`/api/academic-years/${id}`);
      fetchYears();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete");
    }
  };

  const handleOpenMenu = (event, yearStr) => {
    setAnchorEl(event.currentTarget);
    setActiveYearForMenu(yearStr);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setActiveYearForMenu(null);
    setProgramSearch("");
  };

  // Group years by string (e.g. "2025-2026")
  const groupedYears = years.reduce((acc, y) => {
    if (!acc[y.year]) acc[y.year] = { programs: [] };
    if (y.programId) {
      acc[y.year].programs.push(y);
    }
    return acc;
  }, {});

  const renderSemesters = (y, programPattern, durationYears) => {
    let availableSemesters = [];
    if (programPattern === 'YEAR') {
      availableSemesters = semesterTypes.filter(st => st.name === 'YEAR');
    } else {
      availableSemesters = semesterTypes.filter(st => st.name !== 'YEAR');
    }

    if (programPattern === 'YEAR') {
      return (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Manage Years</Typography>
          <Grid container spacing={2}>
            {Array.from({ length: durationYears || 1 }).map((_, idx) => {
              // For Year pattern, we don't have multiple year semester types in DB right now, 
              // we only have 'YEAR'. So all activate the same YEAR semester type. 
              // Wait, the mockup says "Year 1", "Year 2", etc. 
              // In the backend, we only have one activeSemesterTypeId.
              // To support activating specific years, the semesterType needs to represent "Year 1", "Year 2".
              // But for now we just use the global YEAR type, and let's assume they activate the program year as a whole.
              const st = availableSemesters[0];
              if (!st) return null;
              const isActive = y.activeSemesterTypeId?._id === st._id || y.activeSemesterTypeId === st._id;

              // This is a UI approximation since the DB only has "YEAR" as a single type.
              return (
                <Grid item xs={6} sm={4} md={2} key={idx}>
                  <Paper variant="outlined" sx={{
                    p: 1.5, textAlign: 'center',
                    borderColor: isActive && y.isActive ? '#10B981' : 'var(--border-color)',
                    bgcolor: isActive && y.isActive ? '#f0fdf4' : 'transparent',
                    opacity: y.isActive ? 1 : 0.6
                  }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Year {idx + 1}</Typography>
                    {isActive ? (
                      <Chip size="small" icon={<CheckCircle />} label="Active" sx={{ bgcolor: y.isActive ? '#10B981' : '#cbd5e1', color: y.isActive ? '#fff' : '#475569' }} />
                    ) : (
                      <Button size="small" variant="text" disabled={!y.isActive} onClick={() => setYearSemester(y._id, st._id)}>Activate</Button>
                    )}
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      );
    }

    // SEMESTER pattern
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Manage Semesters</Typography>
        </Box>
        <Grid container spacing={2}>
          {availableSemesters.map(st => {
            const isActive = y.activeSemesterTypeId?._id === st._id || y.activeSemesterTypeId === st._id;
            let title = st.name;
            let subtitle = "";
            if (st.name === 'ODD') { title = "Odd Semester"; subtitle = "(1,3,5,7)"; }
            if (st.name === 'EVEN') { title = "Even Semester"; subtitle = "(2,4,6,8)"; }
            if (st.name === 'SUMMER') { title = "Summer Semester"; subtitle = "-"; }

            return (
              <Grid item xs={12} sm={4} key={st._id}>
                <Paper variant="outlined" sx={{
                  p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderColor: isActive && y.isActive ? '#10B981' : 'var(--border-color)',
                  bgcolor: isActive && y.isActive ? '#f0fdf4' : 'transparent',
                  opacity: y.isActive ? 1 : 0.6
                }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{title}</Typography>
                    <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
                  </Box>
                  {isActive ? (
                    <Chip size="small" icon={<CheckCircle />} label="Active" sx={{ bgcolor: y.isActive ? '#10B981' : '#cbd5e1', color: y.isActive ? '#fff' : '#475569' }} />
                  ) : (
                    <Button size="small" variant="text" disabled={!y.isActive} onClick={() => setYearSemester(y._id, st._id)}>Activate</Button>
                  )}
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 1 }}>
      <PageHeader
        title="Academic Management"
        subtitle="Manage academic years, programs and active semesters / years"
      />

      <Paper sx={{ p: 3, mb: 4, borderRadius: 2, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>Create Academic Year</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField size="small" type="number" label="Start Year" value={newStartYear} onChange={handleStartYearChange} sx={{ width: 120 }} />
          <TextField size="small" type="number" label="End Year" value={newEndYear} onChange={e => setNewEndYear(parseInt(e.target.value) || "")} sx={{ width: 120 }} />
          <TextField
            select
            size="small"
            label="Select Program"
            value={newProgramId}
            onChange={e => setNewProgramId(e.target.value)}
            sx={{ width: 200 }}
          >
            {allPrograms.map(p => (
              <MenuItem key={p._id} value={p._id}>{p.code} - {p.name}</MenuItem>
            ))}
          </TextField>
          <Button variant="contained" startIcon={<Add />} onClick={createGlobalYear} sx={{ borderRadius: '50px', px: 3, bgcolor: '#0f172a' }}>
            CREATE ACADEMIC YEAR
          </Button>
        </Box>
      </Paper>

      {Object.entries(groupedYears).sort((a, b) => b[0].localeCompare(a[0])).map(([yearStr, yearData]) => (
        <Paper key={yearStr} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Programs in Academic Year {yearStr}
              </Typography>
              <Chip size="small" label={`${yearData.programs.length} Programs`} color="primary" sx={{ bgcolor: '#eff6ff', color: '#3b82f6', fontWeight: 600 }} />
            </Box>
            <Button variant="outlined" startIcon={<Add />} onClick={(e) => handleOpenMenu(e, yearStr)} sx={{ borderRadius: '50px', textTransform: 'none', borderColor: '#8b5cf6', color: '#8b5cf6' }}>
              ADD PROGRAM
            </Button>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {yearData.programs.map((y) => {
              const prog = y.programId;
              const pattern = prog?.programPattern || 'SEMESTER';
              return (
                <Card key={y._id} variant="outlined" sx={{ borderRadius: 2, borderColor: 'var(--border-color)' }}>
                  <Box sx={{ p: 2, borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <School sx={{ color: '#3b82f6' }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {prog?.code} - {prog?.name}
                      </Typography>
                      <Chip size="small" label={`${pattern} WISE`} sx={{ bgcolor: pattern === 'SEMESTER' ? '#dcfce7' : '#f3e8ff', color: pattern === 'SEMESTER' ? '#166534' : '#6b21a8', fontWeight: 600, fontSize: '0.7rem' }} />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {/* <Button size="small" variant="outlined" startIcon={<Edit />} sx={{ textTransform: 'none', borderRadius: '50px' }}>
                        Edit Program
                      </Button> */}
                      <Button size="small" variant="outlined" color="error" startIcon={<Delete />} onClick={() => deleteYear(y._id, prog?.code)} sx={{ textTransform: 'none', borderRadius: '50px' }}>
                        Remove
                      </Button>
                    </Box>
                  </Box>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', gap: 6, mb: 3 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Program Type</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{pattern === 'SEMESTER' ? 'Semester Wise' : 'Year Wise'}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Duration</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{prog?.durationYears || 4} Years</Typography>
                      </Box>
                      <Box>
                        <Tooltip title="This toggle activates/deactivates the entire program for this academic year">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" color="text.secondary">Program Status</Typography>
                            {y.isActive ? (
                              <Chip size="small" icon={<CheckCircle />} label="Active" color="success" onClick={() => toggleYear(y._id, true)} sx={{ cursor: 'pointer', height: 24 }} />
                            ) : (
                              <Chip size="small" icon={<RadioButtonUnchecked />} label="Set Active" variant="outlined" onClick={() => toggleYear(y._id, false)} sx={{ cursor: 'pointer', height: 24 }} />
                            )}
                          </Box>
                        </Tooltip>
                      </Box>
                    </Box>

                    {renderSemesters(y, pattern, prog?.durationYears)}

                  </CardContent>
                </Card>
              )
            })}

            {yearData.programs.length === 0 && (
              <Box sx={{ textAlign: 'center', p: 4, bgcolor: '#f8fafc', borderRadius: 2 }}>
                <Typography color="text.secondary">No programs added to this academic year yet.</Typography>
              </Box>
            )}
          </Box>
        </Paper>
      ))}

      {years.length === 0 && (
        <Typography sx={{ textAlign: "center", color: "text.secondary", mt: 6 }}>
          No academic years found. Create one above.
        </Typography>
      )}

      {/* Add Program Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        PaperProps={{ sx: { width: 320, mt: 1, borderRadius: 2 } }}
      >
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Select Program</Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="Search programs..."
            value={programSearch}
            onChange={e => setProgramSearch(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>
            }}
          />
        </Box>
        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
          {allPrograms
            .filter(p => (p.name.toLowerCase().includes(programSearch.toLowerCase()) || p.code.toLowerCase().includes(programSearch.toLowerCase())))
            .map(p => (
              <MenuItem key={p._id} onClick={() => addProgramToYear(p._id)} sx={{ py: 1.5, borderBottom: '1px solid #f1f5f9' }}>
                <Typography variant="body2">{p.code} - {p.name}</Typography>
              </MenuItem>
            ))}
        </Box>
        <Box sx={{ p: 1 }}>
          <Button fullWidth variant="text" startIcon={<Add />} sx={{ textTransform: 'none', justifyContent: 'flex-start' }}>
            Create New Program
          </Button>
        </Box>
      </Menu>

    </Box>
  );
};

export default AcademicManagement;
