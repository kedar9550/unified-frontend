import React, { useEffect, useState, useRef } from "react";
import {
  Box, Button, MenuItem, Select, Typography,
  CircularProgress, Stack, IconButton, Tooltip, TextField, Chip
} from "@mui/material";
import {
  CloudUpload as CloudUploadIcon,
  Download as DownloadIcon,
  Save as SaveIcon
} from "@mui/icons-material";
import PageHeader from "../../components/common/PageHeader";
import DataTable from "../../components/data/DataTable";
import SectionHeader from "../../components/common/SectionHeader";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

// Pharma.D year names (from eCap semestername field)
const PHARMAD_YEARS = ["I Year", "II Year", "III Year", "IV Year", "V Year", "VI Year"];

// Regular program semesters
const REGULAR_SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

// Programs that use year-based system instead of semesters
const YEAR_BASED_PROGRAMS = ["Pharma.D"];

const DeptProctorUploads = () => {
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [branches, setBranches] = useState([]);

  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");

  // For regular programs: numeric semester (1-8)
  const [selectedSemester, setSelectedSemester] = useState("");

  // For Pharma.D: "I Year", "II Year" etc.
  const [selectedYearName, setSelectedYearName] = useState("");

  const [students, setStudents] = useState([]);
  const [activeYear, setActiveYear] = useState("");
  const [activeSemesterType, setActiveSemesterType] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingCSV, setUploadingCSV] = useState(false);
  const fileInputRef = useRef(null);

  const { user } = useAuth();

  const [manualProctors, setManualProctors] = useState({});
  const [fetchedProctors, setFetchedProctors] = useState({});
  const lookupTimers = useRef({});

  // Selected Program Object
  const selectedProgram = programs.find(p => p._id === selectedProgramId);
  const selectedProgramName = selectedProgram?.name || "";

  // Is current selected program year-based (Pharma.D)?
  const isYearBased = selectedProgram?.programPattern === 'YEAR' || YEAR_BASED_PROGRAMS.includes(selectedProgramName);

  // Dynamic Semester/Year List
  const duration = selectedProgram?.durationYears || 4;
  const dynamicSemesters = Array.from({ length: duration * 2 }, (_, i) => i + 1).filter(sem => {
    if (!activeSemesterType) return true;
    if (activeSemesterType.toUpperCase() === "ODD") return sem % 2 !== 0;
    if (activeSemesterType.toUpperCase() === "EVEN") return sem % 2 === 0;
    return true;
  });
  const dynamicYears = PHARMAD_YEARS.slice(0, duration);

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [deptRes, yearRes] = await Promise.all([
          API.get("/api/academics/departments"),
          API.get("/api/academic-years")
        ]);

        const years = yearRes.data?.years || yearRes.data?.data || [];
        // Try to find program-specific active year later (when program is selected)
        // For now just store all years
        const active = years.find(y => y.isActive && !y.program);
        if (active) {
          setActiveYear(active.year);
          setActiveSemesterType(active.activeSemesterTypeId?.name || "");
        }

        let fetchedDepts = deptRes.data.data || [];
        if (user && user.roles) {
          const hodRole = user.roles.find(r => r.role === "HOD");
          if (hodRole?.departments?.length > 0) {
            const assignedDeptIds = hodRole.departments.map(d => typeof d === "object" ? d._id : d);
            fetchedDepts = fetchedDepts.filter(d => assignedDeptIds.includes(d._id));
          } else if (user.department) {
            const userDeptId = typeof user.department === "object" ? user.department._id : user.department;
            fetchedDepts = fetchedDepts.filter(d => d._id === userDeptId);
          }
        }

        setDepartments(fetchedDepts);
        if (fetchedDepts.length === 1) setSelectedDeptId(fetchedDepts[0]._id);
      } catch (err) {
        console.error("Error fetching academics:", err);
      }
    };
    fetchDropdowns();
  }, []);

  // When department changes: fetch programs
  useEffect(() => {
    if (selectedDeptId) {
      const fetchAcademicDetails = async () => {
        try {
          const res = await API.get(`/api/academics/programs?departmentId=${selectedDeptId}`);
          setPrograms(res.data.data || []);
        } catch (err) {
          console.error("Error fetching programs:", err);
        }
      };
      fetchAcademicDetails();
      setSelectedProgramId("");
      setSelectedBranch("");
      setSelectedSemester("");
      setSelectedYearName("");
      setBranches([]); // Reset branches when dept changes
      setStudents([]);
    } else {
      setBranches([]);
      setPrograms([]);
    }
  }, [selectedDeptId]);

  // When program changes: reset selections and FETCH BRANCHES
  useEffect(() => {
    setSelectedBranch("");
    setSelectedSemester("");
    setSelectedYearName("");
    setStudents([]);

    if (selectedProgramId && selectedDeptId) {
      const fetchBranches = async () => {
        try {
          const res = await API.get(`/api/academics/branches?departmentId=${selectedDeptId}&programId=${selectedProgramId}`);
          setBranches(res.data.data || []);
        } catch (err) {
          console.error("Error fetching branches:", err);
        }
      };
      fetchBranches();
    } else {
      setBranches([]);
    }

    // Fetch program-specific active year
    if (selectedProgramId) {
      API.get(`/api/academic-years/active?programId=${selectedProgramId}`)
        .then(res => {
          if (res.data?.data?.year) {
            setActiveYear(res.data.data.year);
            setActiveSemesterType(res.data.data.activeSemesterTypeId?.name || "");
          }
        })
        .catch(() => {
          // fallback: keep global active year
        });
    }
  }, [selectedProgramId]);

  const canFetchStudents = () => {
    if (!selectedDeptId || !selectedProgramName || !selectedBranch) return false;
    if (isYearBased) return !!selectedYearName;
    return !!selectedSemester;
  };

  const fetchStudents = async () => {
    if (!canFetchStudents()) return;
    setLoading(true);
    try {
      const params = {
        department: selectedDeptId,
        program: selectedProgramName,
        branch: selectedBranch,
      };

      if (isYearBased) {
        params.yearName = selectedYearName;
      } else {
        params.semester = selectedSemester;
      }

      const res = await API.get("/api/dept-proctor/students", { params });
      setStudents(res.data || []);

      const initialProctors = {};
      res.data.forEach(s => { initialProctors[s.studentId] = s.proctorId || ""; });
      setManualProctors(initialProctors);
    } catch (err) {
      console.error("Error fetching students:", err);
      alert(err.response?.data?.message || "Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canFetchStudents()) fetchStudents();
    else setStudents([]);
  }, [selectedDeptId, selectedProgramName, selectedBranch, selectedSemester, selectedYearName]);

  const handleProctorChange = (studentId, value) => {
    setManualProctors(prev => ({ ...prev, [studentId]: value }));
    const pId = value.trim();
    if (lookupTimers.current[studentId]) clearTimeout(lookupTimers.current[studentId]);
    if (pId.length >= 3) {
      lookupTimers.current[studentId] = setTimeout(async () => {
        try {
          const res = await API.post("/api/employees/ecap-data", { institutionId: pId, role: "Employee" });
          if (res.data && !res.data.error) {
            const name = res.data.employeename || res.data.EmployeeName || "Unknown";
            setFetchedProctors(prev => ({ ...prev, [studentId]: `${name} (${pId})` }));
          } else {
            setFetchedProctors(prev => ({ ...prev, [studentId]: "Not Found" }));
          }
        } catch {
          setFetchedProctors(prev => ({ ...prev, [studentId]: "Error" }));
        }
      }, 500);
    } else {
      setFetchedProctors(prev => ({ ...prev, [studentId]: "" }));
    }
  };

  const handleSaveMapping = async (studentId, mappingId) => {
    const proctorId = manualProctors[studentId]?.trim();
    if (!proctorId) return alert("Please enter a Proctor ID");
    try {
      const payload = {
        studentId,
        proctorId,
        semester: isYearBased ? null : selectedSemester,
        yearName: isYearBased ? selectedYearName : null,
        academicYear: activeYear
      };

      if (mappingId) {
        await API.put(`/api/dept-proctor/${mappingId}`, payload);
      } else {
        await API.post(`/api/dept-proctor`, payload);
      }
      alert("Proctor assigned successfully!");
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save proctor mapping");
    }
  };

  const handleCSVUploadClick = () => fileInputRef.current?.click();

  const handleCSVFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCSV(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await API.post("/api/dept-proctor/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      let msg = res.data.message || "CSV uploaded successfully!";
      if (res.data.errors?.length > 0) {
        const displayErrors = res.data.errors.slice(0, 15);
        msg += "\n\nIssues Found:\n" + displayErrors.join("\n");
        if (res.data.errors.length > 15) msg += `\n...and ${res.data.errors.length - 15} more.`;
      }
      alert(msg);
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.message || "Error uploading CSV file");
    } finally {
      setUploadingCSV(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const downloadTemplate = () => {
    if (students.length === 0) return alert("Please fetch students first.");
    const acYearStr = activeYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

    if (isYearBased) {
      // Pharma.D CSV template: no semester column, has yearname column
      const headers = ["proctorid", "studentid", "academicyear", "semester", "yearname"];
      const rows = students.map(s =>
        `,${s.studentId},${acYearStr},,${selectedYearName}`
      );
      const csvContent = [headers.join(","), ...rows].join("\n");
      triggerDownload(csvContent, `proctor_template_pharmad_${selectedYearName.replace(" ", "_")}.csv`);
    } else {
      // Regular: has semester number
      const headers = ["proctorid", "studentid", "academicyear", "semester", "yearname"];
      const rows = students.map(s =>
        `${manualProctors[s.studentId] || ""},${s.studentId},${acYearStr},${selectedSemester},`
      );
      const csvContent = [headers.join(","), ...rows].join("\n");
      triggerDownload(csvContent, `proctor_template_sem${selectedSemester}.csv`);
    }
  };

  const triggerDownload = (content, filename) => {
    const blob = new Blob([content], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2 }, pt: { xs: 0.5, sm: 1 } }}>
      <PageHeader
        title="Proctee-Proctor Mapping"
        subtitle="Assign proctors to students for the current semester"
      />

      {/* ── Filters ──────────────────────────────────────── */}
      <Box sx={{ mt: 1, mb: 4, display: "flex", flexWrap: "wrap", gap: 2 }}>

        {/* Department */}
        <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 calc(30% - 16px)", md: "1 1 250px" } }}>
          <Box sx={filterBox}>
            <Typography sx={filterLabel}>Department</Typography>
            <Select variant="standard" disableUnderline value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)} sx={{ width: "100%", fontSize: 13, color: 'var(--text-primary)', '& .MuiSelect-icon': { color: 'var(--text-secondary)' } }}>
              {departments.map(d => <MenuItem key={d._id} value={d._id} sx={{ fontSize: 13 }}>{d.name}</MenuItem>)}
            </Select>
          </Box>
        </Box>

        {/* Program */}
        <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 calc(20% - 16px)", md: "1 1 180px" } }}>
          <Box sx={filterBox}>
            <Typography sx={filterLabel}>Program</Typography>
            <Select variant="standard" disableUnderline value={selectedProgramId}
              onChange={(e) => setSelectedProgramId(e.target.value)} sx={{ width: "100%", fontSize: 13, color: 'var(--text-primary)', '& .MuiSelect-icon': { color: 'var(--text-secondary)' } }}>
              {programs.map(p => <MenuItem key={p._id} value={p._id} sx={{ fontSize: 13 }}>{p.name}</MenuItem>)}
            </Select>
          </Box>
        </Box>

        {/* Branch */}
        <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 calc(20% - 16px)", md: "1 1 180px" } }}>
          <Box sx={{ ...filterBox, opacity: !selectedProgramId ? 0.6 : 1, pointerEvents: !selectedProgramId ? 'none' : 'auto' }}>
            <Typography sx={filterLabel}>Branch</Typography>
            <Select variant="standard" disableUnderline value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)} sx={{ width: "100%", fontSize: 13, color: 'var(--text-primary)', '& .MuiSelect-icon': { color: 'var(--text-secondary)' } }}>
              {branches.map(b => <MenuItem key={b._id} value={b.name} sx={{ fontSize: 13 }}>{b.name}</MenuItem>)}
            </Select>
          </Box>
        </Box>

        {/* Semester OR Year — depends on program */}
        <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 calc(20% - 16px)", md: "1 1 150px" } }}>
          <Box sx={{ ...filterBox, opacity: !selectedBranch ? 0.6 : 1, pointerEvents: !selectedBranch ? 'none' : 'auto' }}>
            <Typography sx={filterLabel}>
              {isYearBased ? "Year" : "Semester"}
            </Typography>
            {isYearBased ? (
              <Select variant="standard" disableUnderline value={selectedYearName}
                onChange={(e) => setSelectedYearName(e.target.value)} sx={{ width: "100%", fontSize: 13, color: 'var(--text-primary)', '& .MuiSelect-icon': { color: 'var(--text-secondary)' } }}>
                {dynamicYears.map(y => <MenuItem key={y} value={y} sx={{ fontSize: 13 }}>{y}</MenuItem>)}
              </Select>
            ) : (
              <Select variant="standard" disableUnderline value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)} sx={{ width: "100%", fontSize: 13, color: 'var(--text-primary)', '& .MuiSelect-icon': { color: 'var(--text-secondary)' } }}>
                {dynamicSemesters.map(s => <MenuItem key={s} value={s} sx={{ fontSize: 13 }}>Semester {s}</MenuItem>)}
              </Select>
            )}
          </Box>
        </Box>

        {/* Info chip — shows what's active */}
        {activeYear && selectedProgramName && (
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Chip
              label={`${selectedProgramName}: ${activeYear}`}
              variant="outlined"
              size="small"
              sx={{
                fontWeight: 700,
                color: 'var(--color-primary)',
                borderColor: 'var(--color-primary)',
                background: 'var(--bg-accent-1, rgba(201, 164, 87, 0.1))',
                borderRadius: '50px'
              }}
            />
          </Box>
        )}
      </Box>

      {/* ── CSV Controls ──────────────────────────────────── */}
      <Box sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        justifyContent: "space-between",
        mb: 2,
        alignItems: { xs: "stretch", sm: "center" },
        gap: 2
      }}>
        <SectionHeader title={`Students (${students.length})`} />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ width: { xs: "100%", sm: "auto" } }}>
          <Button
            variant="outlined" startIcon={<DownloadIcon />}
            onClick={downloadTemplate} disabled={students.length === 0}
            sx={{
              borderRadius: "10px", textTransform: "none", whiteSpace: "nowrap",
              borderColor: 'var(--border-color)', color: 'var(--text-primary)',
              '&.Mui-disabled': { color: 'var(--text-secondary)', borderColor: 'var(--border-color)', opacity: 0.5 },
              '&:hover': { borderColor: 'var(--color-primary)', background: 'var(--bg-glass)' }
            }}
          >
            Download Template
          </Button>
          <Button
            onClick={handleCSVUploadClick}
            disabled={uploadingCSV || students.length === 0}
            startIcon={<CloudUploadIcon />}
            sx={{
              borderRadius: "10px", textTransform: "none", fontWeight: 700,
              background: 'var(--gradient-primary)', color: "#fff",
              '&.Mui-disabled': { background: 'var(--bg-glass)', color: 'var(--text-secondary)', opacity: 0.5 },
              "&:hover": { boxShadow: '0 4px 15px rgba(0,0,0,0.2)' },
              whiteSpace: "nowrap"
            }}
          >
            Upload CSV
          </Button>
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleCSVFileSelect} style={{ display: "none" }} />
        </Stack>
      </Box>

      {/* ── Table ─────────────────────────────────────────── */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}><CircularProgress /></Box>
      ) : students.length > 0 ? (
        <DataTable
          columns={["Student ID", "Student Name", "Proctor ID", "Proctor Name", "Actions"]}
          rows={students.map(s => [
            s.studentId,
            s.studentName,
            <TextField
              size="small"
              placeholder="Employee ID"
              value={manualProctors[s.studentId] || ""}
              onChange={(e) => handleProctorChange(s.studentId, e.target.value)}
              sx={{
                minWidth: 150,
                '& .MuiOutlinedInput-root': { background: 'var(--bg-glass)', '& fieldset': { borderColor: 'var(--border-color)' } },
                '& .MuiInputBase-input': { color: 'var(--text-primary)', fontSize: 14 }
              }}
            />,
            <Typography sx={{
              fontSize: 13, fontWeight: 500,
              color: fetchedProctors[s.studentId]?.includes("Not Found") ? "#d32f2f" : 'var(--color-primary)'
            }}>
              {fetchedProctors[s.studentId] || s.proctorName || "Not Assigned"}
            </Typography>,
            <IconButton sx={{ color: 'var(--color-primary)' }} onClick={() => handleSaveMapping(s.studentId, s.mappingId)}>
              <SaveIcon />
            </IconButton>
          ])}
        />
      ) : (
        <Box sx={{ textAlign: "center", mt: 4, color: "var(--text-secondary)" }}>
          <Typography>
            {canFetchStudents()
              ? "No students found for the selected criteria."
              : `Please select ${isYearBased ? "Department, Program, Branch and Year" : "Department, Program, Branch and Semester"} to load students.`
            }
          </Typography>
        </Box>
      )}
    </Box>
  );
};

const filterBox = {
  display: "flex",
  flexDirection: "column", // Label above value for better space management
  alignItems: "flex-start",
  px: 2, py: 1.2, borderRadius: "16px",
  background: "var(--bg-glass)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid var(--border-color)",
  boxShadow: "0 8px 32px 0 rgba(0,0,0,0.08)",
  width: "100%", minHeight: "64px",
  transition: "all 0.3s ease",
  "&:hover": {
    background: "var(--bg-panel)",
    borderColor: "var(--color-primary)",
    boxShadow: "0 8px 32px 0 rgba(0,0,0,0.12)"
  }
};

const filterLabel = {
  fontSize: 9, fontWeight: 700, color: "var(--text-secondary)",
  mb: 0.5,
  textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.8
};

export default DeptProctorUploads;
