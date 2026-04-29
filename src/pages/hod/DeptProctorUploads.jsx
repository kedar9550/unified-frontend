import React, { useEffect, useState, useRef } from "react";
import {
  Box, Button, MenuItem, Select, Typography,
  CircularProgress, Stack, IconButton, Tooltip, TextField, Grid
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

const DeptProctorUploads = () => {
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [branches, setBranches] = useState([]);
  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [selectedProgramName, setSelectedProgramName] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingCSV, setUploadingCSV] = useState(false);
  const fileInputRef = useRef(null);

  const { user } = useAuth();

  // For manual assignment input changes
  const [manualProctors, setManualProctors] = useState({});
  const [fetchedProctors, setFetchedProctors] = useState({});
  const lookupTimers = useRef({});

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [deptRes, progRes] = await Promise.all([
          API.get("/api/academics/departments"),
          API.get("/api/academics/programs")
        ]);

        let fetchedDepts = deptRes.data.data || [];

        // Filter departments based on HOD assigned departments
        if (user && user.roles) {
          const hodRole = user.roles.find(r => r.role === 'HOD');
          if (hodRole && hodRole.departments && hodRole.departments.length > 0) {
            const assignedDeptIds = hodRole.departments.map(d => typeof d === 'object' ? d._id : d);
            fetchedDepts = fetchedDepts.filter(d => assignedDeptIds.includes(d._id));
          } else if (user.department) {
            // Fallback if roles array doesn't have departments but user object does
            const userDeptId = typeof user.department === 'object' ? user.department._id : user.department;
            fetchedDepts = fetchedDepts.filter(d => d._id === userDeptId);
          }
        }

        setDepartments(fetchedDepts);
        // Remove global program fetching from here

        if (fetchedDepts.length === 1) {
          setSelectedDeptId(fetchedDepts[0]._id);
        }
      } catch (err) {
        console.error("Error fetching academics:", err);
      }
    };
    fetchDropdowns();
  }, []);

  useEffect(() => {
    if (selectedDeptId) {
      const fetchAcademicDetails = async () => {
        try {
          const [branchRes, progRes] = await Promise.all([
            API.get(`/api/academics/branches?departmentId=${selectedDeptId}`),
            API.get(`/api/academics/programs?departmentId=${selectedDeptId}`)
          ]);
          setBranches(branchRes.data.data || []);
          setPrograms(progRes.data.data || []);
        } catch (err) {
          console.error("Error fetching academic details:", err);
        }
      };
      fetchAcademicDetails();

      // Reset dependent selections
      setSelectedProgramName("");
      setSelectedBranch("");
      setSelectedSemester("");
      setStudents([]);
    } else {
      setBranches([]);
      setPrograms([]);
    }
  }, [selectedDeptId]);

  const fetchStudents = async () => {
    if (!selectedDeptId || !selectedProgramName || !selectedBranch || !selectedSemester) return;
    setLoading(true);
    try {
      const res = await API.get("/api/dept-proctor/students", {
        params: {
          department: selectedDeptId,
          program: selectedProgramName,
          branch: selectedBranch,
          semester: selectedSemester
        }
      });
      setStudents(res.data || []);

      // Initialize manual proctors state
      const initialProctors = {};
      res.data.forEach(s => {
        initialProctors[s.studentId] = s.proctorId || "";
      });
      setManualProctors(initialProctors);
    } catch (err) {
      console.error("Error fetching students:", err);
      alert(err.response?.data?.message || "Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedDeptId, selectedProgramName, selectedBranch, selectedSemester]);

  const handleProctorChange = (studentId, value) => {
    setManualProctors(prev => ({ ...prev, [studentId]: value }));

    // Live lookup logic
    const pId = value.trim();

    // Clear existing timer for this studentId
    if (lookupTimers.current[studentId]) {
      clearTimeout(lookupTimers.current[studentId]);
    }

    if (pId.length >= 3) { // Start searching after 3 chars
      lookupTimers.current[studentId] = setTimeout(async () => {
        try {
          const res = await API.post("/api/employees/ecap-data", {
            institutionId: pId,
            role: "Employee"
          });
          if (res.data && !res.data.error) {
            const name = res.data.employeename || res.data.EmployeeName || "Unknown";
            setFetchedProctors(prev => ({ ...prev, [studentId]: `${name} (${pId})` }));
          } else {
            setFetchedProctors(prev => ({ ...prev, [studentId]: "Not Found" }));
          }
        } catch (err) {
          setFetchedProctors(prev => ({ ...prev, [studentId]: "Error" }));
        }
      }, 500); // 500ms debounce
    } else {
      setFetchedProctors(prev => ({ ...prev, [studentId]: "" }));
    }
  };

  const handleSaveMapping = async (studentId, mappingId) => {
    const proctorId = manualProctors[studentId]?.trim();
    if (!proctorId) return alert("Please enter a Proctor ID");

    try {
      if (mappingId) {
        await API.put(`/api/dept-proctor/${mappingId}`, { proctorId });
      } else {
        // Find academicYear and semesterType for active to create
        // Our backend resolveActiveIds handles it if not provided, 
        // wait, we need semester
        await API.post(`/api/dept-proctor`, {
          studentId,
          proctorId,
          semester: selectedSemester
        });
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
      if (res.data.errors && res.data.errors.length > 0) {
        // Limit to first 15 errors to avoid huge unreadable alerts
        const displayErrors = res.data.errors.slice(0, 15);
        msg += "\n\nIssues Found:\n" + displayErrors.join("\n");
        if (res.data.errors.length > 15) {
          msg += `\n...and ${res.data.errors.length - 15} more.`;
        }
      }

      alert(msg);
      fetchStudents();
    } catch (err) {
      console.error("Error uploading CSV:", err);
      alert(err.response?.data?.message || "Error uploading CSV file");
    } finally {
      setUploadingCSV(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const downloadTemplate = () => {
    if (students.length === 0) return alert("Please fetch students first to generate template.");

    // Add current active academicyear for the template automatically. 
    const currentYear = new Date().getFullYear();
    const acYearStr = `${currentYear}-${currentYear + 1}`;

    const headers = ["proctorid", "studentid", "academicyear", "semester"];
    const rows = students.map(s =>
      `${manualProctors[s.studentId] || ""},${s.studentId},${acYearStr},${selectedSemester}`
    );

    const csvContent = [headers.join(","), ...rows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `proctor_template_sem_${selectedSemester}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2 }, pt: { xs: 0.5, sm: 1 } }}>
      <PageHeader
        title="Proctor Mapping Module"
        subtitle="Assign proctors to students for the current semester"
        breadcrumbs={[]}
      />

      {/* Filters */}
      <Box sx={{ mt: 1, mb: 4 }}>
        <Box sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          width: "100%"
        }}>
          {/* Department */}
          <Box sx={{ width: { xs: "100%", md: "calc(50% - 12px)" } }}>
            <Box sx={filterBox}>
              <Typography sx={filterLabel}>Department</Typography>
              <Select
                variant="standard" disableUnderline value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                sx={{ width: "100%", fontSize: 14 }}
              >
                {departments.map((d) => (
                  <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>
                ))}
              </Select>
            </Box>
          </Box>

          {/* Program */}
          <Box sx={{ width: { xs: "100%", md: "calc(16.66% - 12px)" } }}>
            <Box sx={filterBox}>
              <Typography sx={filterLabel}>Program</Typography>
              <Select
                variant="standard" disableUnderline value={selectedProgramName}
                onChange={(e) => setSelectedProgramName(e.target.value)}
                sx={{ width: "100%", fontSize: 14 }}
              >
                {programs.map((p) => (
                  <MenuItem key={p._id} value={p.name}>{p.name}</MenuItem>
                ))}
              </Select>
            </Box>
          </Box>

          {/* Branch */}
          <Box sx={{ width: { xs: "100%", md: "calc(16.66% - 12px)" } }}>
            <Box sx={filterBox}>
              <Typography sx={filterLabel}>Branch</Typography>
              <Select
                variant="standard" disableUnderline value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                sx={{ width: "100%", fontSize: 14 }}
              >
                {branches.map((b) => (
                  <MenuItem key={b._id} value={b.name}>{b.name}</MenuItem>
                ))}
              </Select>
            </Box>
          </Box>

          {/* Semester */}
          <Box sx={{ width: { xs: "100%", md: "calc(16.66% - 12px)" } }}>
            <Box sx={filterBox}>
              <Typography sx={filterLabel}>Semester</Typography>
              <Select
                variant="standard" disableUnderline value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                sx={{ width: "100%", fontSize: 14 }}
              >
                {semesters.map((s) => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </Select>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* CSV Controls */}
      <Box sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        justifyContent: "space-between",
        mb: 2,
        alignItems: { xs: "stretch", sm: "center" },
        gap: 2
      }}>
        <SectionHeader title={`Students (${students.length})`} />
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          <Button
            variant="outlined" startIcon={<DownloadIcon />}
            onClick={downloadTemplate} disabled={students.length === 0}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              width: { xs: "100%", sm: "auto" },
              whiteSpace: "nowrap"
            }}
          >
            Download Template
          </Button>
          <Button
            onClick={handleCSVUploadClick}
            disabled={uploadingCSV || students.length === 0}
            startIcon={<CloudUploadIcon />}
            sx={{
              borderRadius: "10px", textTransform: "none", fontWeight: 600,
              background: "linear-gradient(135deg,#1e88e5,#1565c0)", color: "#fff",
              "&:hover": { background: "linear-gradient(135deg,#1565c0,#0d47a1)" },
              width: { xs: "100%", sm: "auto" },
              minWidth: { sm: "160px" },
              whiteSpace: "nowrap"
            }}
          >
            Upload CSV
          </Button>
          <input
            ref={fileInputRef} type="file" accept=".csv"
            onChange={handleCSVFileSelect} style={{ display: "none" }}
          />
        </Stack>
      </Box>

      {/* Table */}
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
              sx={{ minWidth: 150 }}
            />,
            <Typography sx={{ fontSize: 13, fontWeight: 500, color: fetchedProctors[s.studentId]?.includes("Not Found") ? "#d32f2f" : "#0b5299" }}>
              {fetchedProctors[s.studentId] || s.proctorName || "Not Assigned"}
            </Typography>,
            <IconButton
              color="primary"
              onClick={() => handleSaveMapping(s.studentId, s.mappingId)}
            >
              <SaveIcon />
            </IconButton>
          ])}
        />
      ) : (
        <Box sx={{ textAlign: "center", mt: 4, color: "#666" }}>
          <Typography>No students found for the selected criteria.</Typography>
        </Box>
      )}
    </Box>
  );
};

const filterBox = {
  display: "flex",
  flexDirection: { xs: "column", sm: "row" },
  alignItems: { xs: "flex-start", sm: "center" },
  px: 2, py: { xs: 1.5, sm: 1.2 }, borderRadius: "16px",
  background: "rgba(255, 255, 255, 0.45)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(255, 255, 255, 0.4)",
  boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.08)",
  width: "100%", minHeight: "48px",
  transition: "all 0.3s ease",
  "&:hover": {
    background: "rgba(255, 255, 255, 0.6)",
    boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.12)",
  }
};

const filterLabel = {
  fontSize: 10,
  fontWeight: 700,
  color: "#334155",
  mb: { xs: 0.5, sm: 0 },
  mr: 1,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  opacity: 0.6
};

export default DeptProctorUploads;
