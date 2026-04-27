import React, { useEffect, useState, useRef } from "react";
import {
  Box, Button, MenuItem, Select, Typography,
  CircularProgress, Stack, IconButton, Tooltip, TextField
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
        setPrograms(progRes.data.data || []);
        
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
      const fetchBranches = async () => {
        try {
          const res = await API.get(`/api/academics/branches?departmentId=${selectedDeptId}`);
          setBranches(res.data.data || []);
        } catch (err) {
          console.error("Error fetching branches:", err);
        }
      };
      fetchBranches();
    } else {
      setBranches([]);
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
    const acYearStr = `${currentYear}-${currentYear+1}`;

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
    <Box p={4}>
      <PageHeader
        title="Proctor Mapping Module"
        subtitle="Assign proctors to students for the current semester"
        breadcrumbs={[]}
      />

      <Box
        sx={{
          display: "flex", gap: 2, mb: 4, mt: 3, flexWrap: "wrap",
          alignItems: "center", width: "100%",
        }}
      >
        {/* Department */}
        <Box sx={filterBox}>
          <Typography sx={filterLabel}>Department</Typography>
          <Select
            variant="standard" disableUnderline value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            sx={{ minWidth: 120, fontSize: 14 }}
          >
            {departments.map((d) => (
              <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>
            ))}
          </Select>
        </Box>

        {/* Program */}
        <Box sx={filterBox}>
          <Typography sx={filterLabel}>Program</Typography>
          <Select
            variant="standard" disableUnderline value={selectedProgramName}
            onChange={(e) => setSelectedProgramName(e.target.value)}
            sx={{ minWidth: 100, fontSize: 14 }}
          >
            {programs.map((p) => (
              <MenuItem key={p._id} value={p.name}>{p.name}</MenuItem>
            ))}
          </Select>
        </Box>

        {/* Branch */}
        <Box sx={filterBox}>
          <Typography sx={filterLabel}>Branch</Typography>
          <Select
            variant="standard" disableUnderline value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            sx={{ minWidth: 100, fontSize: 14 }}
          >
            {branches.map((b) => (
              <MenuItem key={b._id} value={b.name}>{b.name}</MenuItem>
            ))}
          </Select>
        </Box>

        {/* Semester */}
        <Box sx={filterBox}>
          <Typography sx={filterLabel}>Semester</Typography>
          <Select
            variant="standard" disableUnderline value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            sx={{ minWidth: 80, fontSize: 14 }}
          >
            {semesters.map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>
        </Box>
      </Box>

      {/* CSV Controls */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, alignItems: "center" }}>
        <SectionHeader title={`Students (${students.length})`} />
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined" startIcon={<DownloadIcon />}
            onClick={downloadTemplate} disabled={students.length === 0}
            sx={{ borderRadius: "10px", textTransform: "none" }}
          >
            Download Template
          </Button>
          <Button
            onClick={handleCSVUploadClick}
            disabled={uploadingCSV || students.length === 0}
            startIcon={<CloudUploadIcon />}
            sx={{
              borderRadius: "10px", textTransform: "none", fontWeight: 600,
              background: "linear-gradient(135deg,#2e7d32,#43a047)", color: "#fff",
              "&:hover": { background: "linear-gradient(135deg,#1b5e20,#2e7d32)" }
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
        <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>
      ) : students.length > 0 ? (
        <DataTable
          columns={["Student ID", "Student Name", "Proctor ID", "Actions"]}
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
            <IconButton 
              color="primary" 
              onClick={() => handleSaveMapping(s.studentId, s.mappingId)}
            >
              <SaveIcon />
            </IconButton>
          ])}
        />
      ) : (
        <Box textAlign="center" mt={4} color="#666">
          <Typography>No students found for the selected criteria.</Typography>
        </Box>
      )}
    </Box>
  );
};

const filterBox = {
  display: "flex", alignItems: "center", px: 2, py: 1, borderRadius: "14px",
  background: "rgba(255,255,255,0.75)", backdropFilter: "blur(10px)",
  boxShadow: "0 4px 15px rgba(0,0,0,0.06)", fontSize: 14,
};

const filterLabel = { fontSize: 13, fontWeight: 600, color: "#555", mr: 1 };

export default DeptProctorUploads;
