import React, { useEffect, useState } from "react";
import API from "../../../api/axios";
import {
  Box, Typography, Button, Card, CardContent, Chip, TextField,
  IconButton, Select, MenuItem, Paper, Tooltip, Menu, InputAdornment, Grid, Collapse
} from "@mui/material";
import {
  Add, School, CheckCircle, RadioButtonUnchecked, Delete, Search,
  ExpandMore, ExpandLess
} from "@mui/icons-material";
import PageHeader from "../../../components/common/PageHeader";

const AcademicManagement = () => {
  // years[] = [ { _id, year, programs: [ { programId:{_id,name,...}, isActive, activeSemesterTypeId } ] } ]
  const [years, setYears] = useState([]);
  const [semesterTypes, setSemesterTypes] = useState([]);
  const [allPrograms, setAllPrograms] = useState([]);

  const currentYear = new Date().getFullYear();
  const [newStartYear, setNewStartYear] = useState(currentYear);
  const [newEndYear, setNewEndYear] = useState(currentYear + 1);

  const [anchorEl, setAnchorEl] = useState(null);
  const [activeYearForMenu, setActiveYearForMenu] = useState(null); // { _id, year }
  const [programSearch, setProgramSearch] = useState("");
  const [expandedCards, setExpandedCards] = useState({});  // key: yearId-programId
  const [expandedYears, setExpandedYears] = useState({});  // key: yearId

  const toggleCard = (key) => setExpandedCards(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleYearExpand = (yearId) => setExpandedYears(prev => ({ ...prev, [yearId]: !prev[yearId] }));

  useEffect(() => {
    fetchYears();
    fetchSemesterTypes();
    fetchAllPrograms();
  }, []);

  const fetchSemesterTypes = async () => {
    try {
      const res = await API.get("/api/semester-types");
      setSemesterTypes(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchAllPrograms = async () => {
    try {
      const res = await API.get("/api/academics/programs");
      setAllPrograms(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchYears = async () => {
    try {
      const res = await API.get("/api/academic-years");
      setYears(res.data.years || []);
    } catch (err) { console.error(err); }
  };

  const handleStartYearChange = (e) => {
    const val = parseInt(e.target.value) || "";
    setNewStartYear(val);
    if (val) setNewEndYear(val + 1);
  };

  const createGlobalYear = async () => {
    if (!newStartYear || !newEndYear) { alert("Please select Start Year and End Year"); return; }
    try {
      await API.post("/api/academic-years", { startYear: newStartYear, endYear: newEndYear });
      setNewStartYear(currentYear);
      setNewEndYear(currentYear + 1);
      fetchYears();
    } catch (err) { alert(err.response?.data?.message || "Failed to create academic year"); }
  };

  const addProgramToYear = async (programId) => {
    if (!activeYearForMenu) return;
    try {
      const [start, end] = activeYearForMenu.year.split("-");
      await API.post("/api/academic-years", { startYear: start, endYear: end, programId });
      fetchYears();
      handleCloseMenu();
    } catch (err) { alert(err.response?.data?.message || "Failed to add program"); }
  };

  // Toggle isActive for one program inside a year doc
  const toggleProgramStatus = async (yearId, programId, currentState) => {
    try {
      await API.put(`/api/academic-years/${yearId}/toggle-status`, {
        isActive: !currentState,
        programId
      });
      fetchYears();
    } catch (err) { console.error(err); }
  };

  // Set activeSemesterType for one program inside a year doc
  const setProgramSemester = async (yearId, programId, semesterTypeId) => {
    try {
      await API.put(`/api/academic-years/${yearId}/semester-type`, { semesterTypeId, programId });
      fetchYears();
    } catch (err) { alert(err.response?.data?.message || "Failed to update semester"); }
  };

  // Remove a program from a year
  const removeProgram = async (yearId, programId, programCode) => {
    if (!window.confirm(`Remove ${programCode} from this academic year?`)) return;
    try {
      await API.delete(`/api/academic-years/${yearId}/program/${programId}`);
      fetchYears();
    } catch (err) { alert(err.response?.data?.message || "Failed to remove"); }
  };

  const handleOpenMenu = (event, yearDoc) => {
    setAnchorEl(event.currentTarget);
    setActiveYearForMenu(yearDoc);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setActiveYearForMenu(null);
    setProgramSearch("");
  };

  const renderSemesters = (yearId, programEntry, programPattern, durationYears) => {
    const programId = programEntry.programId?._id || programEntry.programId;
    let availableSemesters = [];
    if (programPattern === "YEAR") {
      availableSemesters = semesterTypes.filter(st => st.name === "YEAR");
    } else {
      availableSemesters = semesterTypes.filter(st => st.name !== "YEAR");
    }

    if (programPattern === "YEAR") {
      return (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: "var(--text-primary)" }}>Manage Years</Typography>
          <Grid container spacing={2}>
            {Array.from({ length: durationYears || 1 }).map((_, idx) => {
              const st = availableSemesters[0];
              if (!st) return null;
              const activeStId = programEntry.activeSemesterTypeId?._id || programEntry.activeSemesterTypeId;
              const isActive = activeStId?.toString() === st._id?.toString();
              return (
                <Grid xs={6} sm={4} md={2} key={idx}>
                  <Paper variant="outlined" sx={{
                    p: 1.5, textAlign: "center",
                    background: isActive && programEntry.isActive ? "rgba(16,185,129,0.15)" : "var(--bg-glass)",
                    borderColor: isActive && programEntry.isActive ? "var(--color-success, #10B981)" : "var(--border-color)",
                    opacity: programEntry.isActive ? 1 : 0.6
                  }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: "var(--text-primary)" }}>Year {idx + 1}</Typography>
                    {isActive ? (
                      <Chip size="small" icon={<CheckCircle />} label="Active" color="success" sx={{ fontWeight: 700 }} />
                    ) : (
                      <Button size="small" variant="text" disabled={!programEntry.isActive}
                        onClick={() => setProgramSemester(yearId, programId, st._id)}
                        sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.7rem", color: "var(--color-primary)",
                          "&:hover": { background: "transparent", opacity: 0.8 },
                          "&.Mui-disabled": { color: "var(--text-secondary)" }
                        }}>Activate</Button>
                    )}
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      );
    }

    return (
      <Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "var(--text-primary)" }}>Manage Semesters</Typography>
        </Box>
        <Grid container spacing={2}>
          {availableSemesters.map(st => {
            const activeStId = programEntry.activeSemesterTypeId?._id || programEntry.activeSemesterTypeId;
            const isActive = activeStId?.toString() === st._id?.toString();
            const totalSems = (durationYears || 4) * 2;
            const oddSems = Array.from({ length: totalSems / 2 }, (_, i) => i * 2 + 1).join(",");
            const evenSems = Array.from({ length: totalSems / 2 }, (_, i) => i * 2 + 2).join(",");
            let title = st.name, subtitle = "";
            if (st.name === "ODD") { title = "Odd Semester"; subtitle = `(${oddSems})`; }
            if (st.name === "EVEN") { title = "Even Semester"; subtitle = `(${evenSems})`; }
            if (st.name === "SUMMER") { title = "Summer Semester"; subtitle = "-"; }
            return (
              <Grid xs={12} sm={4} key={st._id}>
                <Paper variant="outlined" sx={{
                  p: 2, display: "flex", justifyContent: "space-between", alignItems: "center",
                  background: isActive && programEntry.isActive ? "rgba(16,185,129,0.15)" : "var(--bg-glass)",
                  borderColor: isActive && programEntry.isActive ? "var(--color-success, #10B981)" : "var(--border-color)",
                  opacity: programEntry.isActive ? 1 : 0.6
                }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--text-primary)" }}>{title}</Typography>
                    <Typography variant="caption" sx={{ color: "var(--text-secondary)" }}>{subtitle}</Typography>
                  </Box>
                  {isActive ? (
                    <Chip size="small" icon={<CheckCircle />} label="Active" color="success" sx={{ fontWeight: 700 }} />
                  ) : (
                    <Button size="small" variant="text" disabled={!programEntry.isActive}
                      onClick={() => setProgramSemester(yearId, programId, st._id)}
                      sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.75rem", color: "var(--color-primary)",
                        "&:hover": { background: "transparent", opacity: 0.8 },
                        "&.Mui-disabled": { color: "var(--text-secondary)" }
                      }}>Activate</Button>
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
      <PageHeader title="Academic Management" subtitle="Manage academic years, programs and active semesters / years" />

      {/* Create Year Panel */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 3, background: "var(--bg-panel)", border: "1px solid var(--border-color)" }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: "var(--text-primary)" }}>Create Academic Year</Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
          <TextField size="small" type="number" label="Start Year" value={newStartYear} onChange={handleStartYearChange} sx={{ width: 120,
            "& .MuiOutlinedInput-root": { background: "var(--bg-glass)", "& fieldset": { borderColor: "var(--border-color)" }, "&:hover fieldset": { borderColor: "var(--color-primary)" } },
            "& .MuiInputLabel-root": { color: "var(--text-secondary)" }, "& .MuiInputBase-input": { color: "var(--text-primary)" }
          }} />
          <TextField size="small" type="number" label="End Year" value={newEndYear} onChange={e => setNewEndYear(parseInt(e.target.value) || "")} sx={{ width: 120,
            "& .MuiOutlinedInput-root": { background: "var(--bg-glass)", "& fieldset": { borderColor: "var(--border-color)" }, "&:hover fieldset": { borderColor: "var(--color-primary)" } },
            "& .MuiInputLabel-root": { color: "var(--text-secondary)" }, "& .MuiInputBase-input": { color: "var(--text-primary)" }
          }} />
          <Button variant="contained" startIcon={<Add />} onClick={createGlobalYear}
            sx={{ borderRadius: "50px", px: 3, background: "var(--gradient-primary)", textTransform: "none", fontWeight: 700 }}>
            CREATE ACADEMIC YEAR
          </Button>
        </Box>
      </Paper>

      {/* Year Cards — years[] sorted newest first (API already sorts) */}
      {years.map((yearDoc) => {
        const isYearExpanded = !!expandedYears[yearDoc._id];
        return (
          <Paper key={yearDoc._id} sx={{ mb: 3, borderRadius: 2, background: "var(--bg-panel)", border: "1px solid var(--border-color)", overflow: "hidden" }}>
            {/* Year Header */}
            <Box onClick={() => toggleYearExpand(yearDoc._id)} sx={{
              p: 2.5, display: "flex", justifyContent: "space-between", alignItems: "center",
              cursor: "pointer", borderBottom: isYearExpanded ? "1px solid var(--border-color)" : "none",
              transition: "background 0.2s", "&:hover": { background: "var(--bg-glass)" }
            }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "var(--text-primary)" }}>
                  Academic Year {yearDoc.year}
                </Typography>
                <Chip size="small" label={`${yearDoc.programs.length} Programs`}
                  sx={{ bgcolor: "var(--bg-accent-1)", color: "var(--color-primary)", fontWeight: 600 }} />
              </Box>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Button variant="outlined" startIcon={<Add />}
                  onClick={(e) => { e.stopPropagation(); handleOpenMenu(e, yearDoc); }}
                  sx={{ borderRadius: "50px", textTransform: "none", fontWeight: 700, borderColor: "var(--color-primary)", color: "var(--color-primary)", "&:hover": { background: "var(--bg-glass)" } }}>
                  ADD PROGRAM
                </Button>
                <IconButton size="small" sx={{ color: "var(--text-secondary)" }}>
                  {isYearExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                </IconButton>
              </Box>
            </Box>

            {/* Collapsible Program List */}
            <Collapse in={isYearExpanded}>
              <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
                {yearDoc.programs.map((entry) => {
                  const prog = entry.programId;   // populated object
                  const progId = prog?._id?.toString() || prog?.toString();
                  const pattern = prog?.programPattern || "SEMESTER";
                  const cardKey = `${yearDoc._id}-${progId}`;
                  const isExpanded = !!expandedCards[cardKey];
                  return (
                    <Card key={progId} variant="outlined" sx={{ borderRadius: 2, borderColor: "var(--border-color)", background: "var(--bg-glass)" }}>
                      <Box onClick={() => toggleCard(cardKey)} sx={{
                        p: 2, display: "flex", justifyContent: "space-between", alignItems: "center",
                        background: "var(--bg-panel)", cursor: "pointer",
                        borderBottom: isExpanded ? "1px solid var(--border-color)" : "none",
                        borderRadius: isExpanded ? "8px 8px 0 0" : "8px",
                        transition: "background 0.2s", "&:hover": { background: "var(--bg-glass)" }
                      }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <School sx={{ color: "var(--color-primary)" }} />
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "var(--text-primary)" }}>
                            {prog?.name}
                          </Typography>
                          <Chip size="small" label={`${pattern} WISE`}
                            sx={{ bgcolor: pattern === "SEMESTER" ? "rgba(34,197,94,0.15)" : "rgba(139,92,246,0.15)",
                              color: pattern === "SEMESTER" ? "#22c55e" : "#a78bfa", fontWeight: 600, fontSize: "0.7rem" }} />
                        </Box>
                        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                          <Button size="small" variant="outlined" color="error" startIcon={<Delete />}
                            onClick={(e) => { e.stopPropagation(); removeProgram(yearDoc._id, progId, prog?.code); }}
                            sx={{ textTransform: "none", borderRadius: "50px" }}>
                            Remove
                          </Button>
                          <IconButton size="small" sx={{ color: "var(--text-secondary)" }}>
                            {isExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                          </IconButton>
                        </Box>
                      </Box>

                      <Collapse in={isExpanded}>
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: "flex", gap: 6, mb: 3 }}>
                            <Box>
                              <Typography variant="caption" sx={{ color: "var(--text-secondary)" }}>Program Type</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--text-primary)" }}>
                                {pattern === "SEMESTER" ? "Semester Wise" : "Year Wise"}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" sx={{ color: "var(--text-secondary)" }}>Duration</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--text-primary)" }}>
                                {prog?.durationYears || 4} Years
                              </Typography>
                            </Box>
                            <Box>
                              <Tooltip title="Activates/deactivates this program for this academic year">
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  <Typography variant="caption" sx={{ color: "var(--text-secondary)" }}>Program Status</Typography>
                                  {entry.isActive ? (
                                    <Chip size="small" icon={<CheckCircle />} label="Active" color="success"
                                      onClick={(e) => { e.stopPropagation(); toggleProgramStatus(yearDoc._id, progId, true); }}
                                      sx={{ cursor: "pointer", height: 24 }} />
                                  ) : (
                                    <Chip size="small" icon={<RadioButtonUnchecked />} label="Set Active" variant="outlined"
                                      onClick={(e) => { e.stopPropagation(); toggleProgramStatus(yearDoc._id, progId, false); }}
                                      sx={{ cursor: "pointer", height: 24 }} />
                                  )}
                                </Box>
                              </Tooltip>
                            </Box>
                          </Box>
                          {renderSemesters(yearDoc._id, entry, pattern, prog?.durationYears)}
                        </CardContent>
                      </Collapse>
                    </Card>
                  );
                })}

                {yearDoc.programs.length === 0 && (
                  <Box sx={{ textAlign: "center", p: 4, background: "var(--bg-glass)", borderRadius: 2, border: "1px dashed var(--border-color)" }}>
                    <Typography sx={{ color: "var(--text-secondary)" }}>No programs added to this academic year yet.</Typography>
                  </Box>
                )}
              </Box>
            </Collapse>
          </Paper>
        );
      })}

      {years.length === 0 && (
        <Typography sx={{ textAlign: "center", color: "var(--text-secondary)", mt: 6 }}>
          No academic years found. Create one above.
        </Typography>
      )}

      {/* Add Program Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}
        PaperProps={{ sx: { width: 320, mt: 1, borderRadius: 2, background: "var(--bg-panel)", border: "1px solid var(--border-color)" } }}>
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: "var(--text-primary)" }}>Select Program</Typography>
          <TextField fullWidth size="small" placeholder="Search programs..." value={programSearch}
            onChange={e => setProgramSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" sx={{ color: "var(--text-secondary)" }} /></InputAdornment> }}
            sx={{ "& .MuiOutlinedInput-root": { background: "var(--bg-glass)", "& fieldset": { borderColor: "var(--border-color)" }, "&:hover fieldset": { borderColor: "var(--color-primary)" } },
              "& .MuiInputBase-input": { color: "var(--text-primary)" } }} />
        </Box>
        <Box sx={{ maxHeight: 300, overflow: "auto" }}>
          {allPrograms
            .filter(p => p.name.toLowerCase().includes(programSearch.toLowerCase()) || p.code.toLowerCase().includes(programSearch.toLowerCase()))
            .map(p => (
              <MenuItem key={p._id} onClick={() => addProgramToYear(p._id)}
                sx={{ py: 1.5, borderBottom: "1px solid var(--border-color)", color: "var(--text-primary)", "&:hover": { background: "var(--bg-glass)" } }}>
                <Typography variant="body2">{p.name}</Typography>
              </MenuItem>
            ))}
        </Box>
      </Menu>
    </Box>
  );
};

export default AcademicManagement;
