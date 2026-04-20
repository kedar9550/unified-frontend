import React, { useEffect, useState, useRef } from "react";
import {
  Box, Button, MenuItem, Select, Typography,
  CircularProgress, Stack, IconButton, Tooltip, Grid, Avatar
} from "@mui/material";
import {
  CloudUpload as CloudUploadIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  DeleteSweep as DeleteSweepIcon,
  ArrowBack as ArrowBackIcon
} from "@mui/icons-material";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import DataTable from "../../components/data/DataTable";
import SectionHeader from "../../components/common/SectionHeader";
import API from "../../api/axios";

const DeptProctorUploads = () => {
  // ── Academic Year / Semester state ──────────────────────────────
  const [academicYears, setAcademicYears] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState("");
  const [selectedSemId, setSelectedSemId] = useState("");

  // ── CSV Upload state ──────────────────────────────────────────────
  const fileInputRef = useRef(null);
  const [uploadingCSV, setUploadingCSV] = useState(false);
  const [proctorCount, setProctorCount] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("default"); // "default", "proctors", "proctorDetail"
  const [selectedProctorId, setSelectedProctorId] = useState(null);

  const proctorDetails = React.useMemo(() => {
    const counts = {};
    mappings.forEach(m => {
      if (!counts[m.proctorId]) {
        counts[m.proctorId] = {
          id: m.proctorId,
          name: m.proctorName,
          studentCount: 0
        };
      }
      counts[m.proctorId].studentCount += 1;
    });
    return Object.values(counts);
  }, [mappings]);

  // 1. Fetch Academic Years on mount
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const res = await API.get("/api/academic-years");
        const years = res.data.years || [];
        setAcademicYears(years);
        if (years.length > 0) {
          const active = years.find((y) => y.isActive) || years[0];
          setSelectedYearId(active._id);
        }
      } catch (err) {
        console.error("Error fetching academic years:", err);
      }
    };
    fetchYears();
  }, []);

  // 2. Fetch Semesters when Academic Year changes
  useEffect(() => {
    if (!selectedYearId) return;
    const fetchSemesters = async () => {
      try {
        const res = await API.get(
          `/api/academic-years/${selectedYearId}/semesters`
        );
        const sems = res.data.semesters || [];
        setSemesters(sems);
        if (sems.length > 0) {
          const active = sems.find((s) => s.isActive) || sems[0];
          setSelectedSemId(active._id);
        } else {
          setSelectedSemId("");
        }
      } catch (err) {
        console.error("Error fetching semesters:", err);
      }
    };
    fetchSemesters();
  }, [selectedYearId]);

  // 3. Fetch Data when filters change
  const fetchProctorMappings = async () => {
    if (!selectedYearId || !selectedSemId) return;

    // Convert IDs to strings (year and type) for the backend query if needed, 
    // or the backend resolveTargetIds will handle it if we pass them.
    // My backend resolves by year/type strings or pre-existing IDs.
    const yearObj = academicYears.find(y => y._id === selectedYearId);
    const semObj = semesters.find(s => s._id === selectedSemId);

    if (!yearObj || !semObj) return;

    setLoading(true);
    try {
      const res = await API.get("/api/dept-proctor", {
        params: {
          academicYear: yearObj.year,
          semester: semObj.type
        }
      });
      const data = res.data || [];
      setMappings(data);

      // Derive counts
      const uniqueProctors = new Set(data.map(m => m.proctorId));
      const uniqueStudents = new Set(data.map(m => m.studentId));
      setProctorCount(uniqueProctors.size);
      setStudentCount(uniqueStudents.size);
    } catch (err) {
      console.error("Error fetching proctor mappings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProctorMappings();
  }, [selectedYearId, selectedSemId, academicYears, semesters]);

  // ── CSV Upload Handler ────────────────────────────────────────────
  const handleCSVUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleCSVFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      alert("Please select a CSV file");
      return;
    }

    setUploadingCSV(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await API.post("/api/dept-proctor/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert(res.data.message || "CSV uploaded successfully!");
      fetchProctorMappings(); // Refresh list and counts
    } catch (err) {
      console.error("Error uploading CSV:", err);
      alert(err.response?.data?.message || "Error uploading CSV file");
    } finally {
      setUploadingCSV(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const downloadTemplate = () => {
    const headers = ["proctorId", "proctorName", "studentId", "studentName", "academicYear", "semester"];
    const csvContent = headers.join(",") + "\n" +
      "FAC101,Dr. John Smith,20BCE001,Alice Johnson,2025-2026,EVEN\n" +
      "FAC101,Dr. John Smith,20BCE002,Bob Williams,2025-2026,EVEN";

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "proctor_mapping_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDeleteMapping = async (id) => {
    if (!window.confirm("Are you sure you want to delete this assignment?")) return;
    try {
      await API.delete(`/api/dept-proctor/${id}`);
      fetchProctorMappings();
    } catch (err) {
      alert("Failed to delete record");
    }
  };

  const handleBulkDelete = async () => {
    const yearObj = academicYears.find(y => y._id === selectedYearId);
    const semObj = semesters.find(s => s._id === selectedSemId);

    if (!window.confirm(`Are you sure you want to delete ALL mappings for ${yearObj?.year} - ${semObj?.type}?`)) return;

    try {
      await API.delete("/api/dept-proctor/semester", {
        params: {
          academicYear: yearObj.year,
          semester: semObj.type
        }
      });
      fetchProctorMappings();
    } catch (err) {
      alert("Failed to bulk delete records");
    }
  };

  // ── Derive selected labels for display ──────────────────────────
  const selectedYear = academicYears.find((y) => y._id === selectedYearId);
  const selectedSem = semesters.find((s) => s._id === selectedSemId);

  return (
    <Box p={4}>
      {viewMode === "default" && (
        <>
          <PageHeader
            title="Department Proctor Uploads"
            subtitle="Upload and manage proctor assignments for your department"
            breadcrumbs={[]}
          />

          {/* ── FILTERS : Academic Year + Semester ─────────────── */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              mb: 3,
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "stretch", sm: "center" },
              mt: 3,
              width: "100%",
            }}
          >
            {/* Academic Year */}
            <Box sx={{ ...filterBox, justifyContent: "space-between" }}>
              <Typography
                sx={{ fontSize: 13, fontWeight: 600, color: "#555", mr: 1 }}
              >
                Academic Year
              </Typography>
              <Select
                variant="standard"
                disableUnderline
                value={selectedYearId}
                onChange={(e) => setSelectedYearId(e.target.value)}
                sx={{ minWidth: 120, fontSize: 14 }}
              >
                {academicYears.map((y) => (
                  <MenuItem key={y._id} value={y._id}>
                    {y.year}
                  </MenuItem>
                ))}
              </Select>
            </Box>

            {/* Semester */}
            <Box sx={{ ...filterBox, justifyContent: "space-between" }}>
              <Typography
                sx={{ fontSize: 13, fontWeight: 600, color: "#555", mr: 1 }}
              >
                Semester
              </Typography>
              <Select
                variant="standard"
                disableUnderline
                value={selectedSemId}
                onChange={(e) => setSelectedSemId(e.target.value)}
                sx={{ minWidth: 80, fontSize: 14 }}
              >
                {semesters.map((s) => (
                  <MenuItem key={s._id} value={s._id}>
                    {s.type}
                  </MenuItem>
                ))}
              </Select>
            </Box>

            {/* Upload CSV Button */}
            <Button
              onClick={handleCSVUploadClick}
              disabled={uploadingCSV || !selectedYearId || !selectedSemId}
              startIcon={uploadingCSV ? <CircularProgress size={20} /> : <CloudUploadIcon />}
              sx={{
                width: { xs: "100%", sm: "auto" },
                borderRadius: "20px",
                px: 3,
                py: 1,
                textTransform: "none",
                fontWeight: 600,
                fontSize: 14,
                background: "linear-gradient(135deg,#2e7d32,#43a047)",
                color: "#fff",
                boxShadow: "0 4px 15px rgba(46,125,50,0.3)",
                "&:hover": {
                  background: "linear-gradient(135deg,#1b5e20,#2e7d32)",
                },
                "&:disabled": {
                  background: "rgba(0,0,0,0.2)",
                  color: "rgba(255,255,255,0.5)",
                  boxShadow: "none",
                },
              }}
            >
              {uploadingCSV ? "Uploading..." : "Upload CSV"}
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleCSVFileSelect}
              style={{ display: "none" }}
            />
          </Box>

          {/* ── STATS CARDS ────────────────────────────────────────── */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
              gap: 3,
              mt: 3,
              mb: 4,
              width: "100%"
            }}
          >
            <StatCard
              title="Total Proctors"
              score={proctorCount}
              glass
              icon={<PeopleIcon sx={{ color: "#2e7d32" }} />}
              onClick={() => {
                if (proctorCount > 0) setViewMode("proctors");
              }}
            />
            <StatCard
              title="Total Students"
              score={studentCount}
              glass
              icon={<SchoolIcon sx={{ color: "#1565c0" }} />}
            />
          </Box>

          {/* ── DEFAULT VIEW: PROCTOR ASSIGNMENT LIST ─────────────────── */}
          <Box sx={{ mt: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: { xs: "stretch", md: "center" },
                flexDirection: { xs: "column", md: "row" },
                gap: 2,
                mb: 3
              }}
            >
              <SectionHeader title="Proctor Assignment List" />

              <Stack direction="row" spacing={2} sx={{ width: { xs: "100%", md: "auto" } }}>
                <Box sx={{ flex: { xs: 1, md: "none" } }}>
                  <Tooltip title="Download CSV Template">
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={downloadTemplate}
                      sx={{ borderRadius: "10px", textTransform: "none", height: "100%" }}
                    >
                      Template
                    </Button>
                  </Tooltip>
                </Box>
                <Box sx={{ flex: { xs: 1, md: "none" } }}>
                  <Tooltip title="Bulk Delete Current Semester">
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteSweepIcon />}
                      onClick={handleBulkDelete}
                      sx={{ borderRadius: "10px", textTransform: "none", height: "100%" }}
                      disabled={mappings.length === 0}
                    >
                      Clear Data
                    </Button>
                  </Tooltip>
                </Box>
              </Stack>
            </Box>

            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ overflowX: "auto", width: "100%" }}>
                <DataTable
                  columns={["Proctor ID", "Proctor Name", "Student ID", "Student Name", "Actions"]}
                  rows={mappings.map(m => [
                    m.proctorId,
                    m.proctorName,
                    m.studentId,
                    m.studentName,
                    {
                      value: m._id,
                      display: (
                        <Stack direction="row" spacing={1}>
                          <IconButton size="small" color="primary">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteMapping(m._id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      )
                    }
                  ])}
                />
              </Box>
            )}
          </Box>
        </>
      )}

      {viewMode === "proctors" && (
        <>
          {/* ── SECONDARY VIEW: PROCTOR CARDS ────────────────────────── */}
          <PageHeader
            title="Total Proctors"
            subtitle={`View assigned student statistics for all ${proctorCount} proctors in this semester`}
            breadcrumbs={[]}
          />
          <Box mt={1}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-start",
                mb: 4
              }}
            >
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => setViewMode("default")}
                sx={{
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 600,
                  bgcolor: "rgba(255,255,255,0.7)",
                  "&:hover": { bgcolor: "rgba(255,255,255,1)" }
                }}
              >
                Back to Dashboard
              </Button>
            </Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 3,
                width: "100%"
              }}
            >
              {proctorDetails.map(proctor => (
                <Box
                  key={proctor.id}
                  onClick={() => {
                    setSelectedProctorId(proctor.id);
                    setViewMode("proctorDetail");
                  }}
                  sx={{
                    cursor: "pointer",
                    p: 3,
                    background: "rgba(255, 255, 255, 0.7)",
                    backdropFilter: "blur(12px)",
                    borderRadius: "20px",
                    boxShadow: "0 8px 32px rgba(31, 38, 135, 0.07)",
                    border: "1px solid rgba(255, 255, 255, 0.4)",
                    transition: "all 0.3s ease-in-out",
                    display: "flex",
                    flexDirection: "column",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 12px 40px rgba(31, 38, 135, 0.12)",
                      background: "rgba(255, 255, 255, 0.85)",
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Avatar
                      src={`https://info.aec.edu.in/aus/employeephotos/${proctor.id}.jpg`}
                      alt={proctor.name}
                      sx={{
                        width: 44,
                        height: 44,
                        mr: 2,
                        bgcolor: "#e3f2fd",
                        color: "#1565c0",
                        fontWeight: 'bold'
                      }}
                    >
                      <PeopleIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: "#888", fontWeight: 600, fontSize: "0.75rem" }}>
                        ID: {proctor.id}
                      </Typography>
                      <Typography variant="h6" sx={{ color: "#003366", fontWeight: 700, fontSize: "1.1rem", lineHeight: 1.2 }}>
                        {proctor.name}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mt: "auto", pt: 2, borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                    <Typography variant="body2" sx={{ color: "#555", fontWeight: 500, display: "flex", justifyContent: "space-between" }}>
                      <span>Assigned Students:</span>
                      <span style={{ color: "#2e7d32", fontWeight: 700, fontSize: "1.1rem" }}>{proctor.studentCount}</span>
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </>
      )}

      {viewMode === "proctorDetail" && (
        <>
          <PageHeader
            title="Proctor Details"
            subtitle="View student assignments for the selected proctor"
            breadcrumbs={[]}
          />
          <Box mt={1}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-start",
                mb: 4
              }}
            >
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => setViewMode("proctors")}
                sx={{
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 600,
                  bgcolor: "rgba(255,255,255,0.7)",
                  "&:hover": { bgcolor: "rgba(255,255,255,1)" }
                }}
              >
                Back to Proctors List
              </Button>
            </Box>

            {(() => {
              const proctor = proctorDetails.find(p => p.id === selectedProctorId);
              if (!proctor) return null;

              const proctorStudents = mappings.filter(m => m.proctorId === selectedProctorId);

              return (
                <Box>
                  <Box
                    sx={{
                      mb: 5,
                      p: 4,
                      borderRadius: "24px",
                      background: "rgba(255, 255, 255, 0.8)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid rgba(255, 255, 255, 0.4)",
                      boxShadow: "0 8px 32px rgba(31, 38, 135, 0.05)",
                      display: "flex",
                      alignItems: "center"
                    }}
                  >
                    <Avatar
                      src={`https://info.aec.edu.in/aus/employeephotos/${proctor.id}.jpg`}
                      alt={proctor.name}
                      sx={{
                        width: 80,
                        height: 80,
                        mr: 3,
                        bgcolor: "#e3f2fd",
                        color: "#1565c0",
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
                      }}
                    >
                      <PeopleIcon sx={{ fontSize: 40 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" sx={{ color: "#666", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", fontSize: "0.8rem", mb: 0.5 }}>
                        ID: {proctor.id}
                      </Typography>
                      <Typography variant="h3" sx={{ color: "#003366", fontWeight: 800, mb: 1, fontSize: "2rem" }}>
                        {proctor.name}
                      </Typography>
                      <Box sx={{ display: "inline-flex", alignItems: "center", bgcolor: "rgba(46, 125, 50, 0.1)", px: 2, py: 0.5, borderRadius: "20px" }}>
                        <SchoolIcon sx={{ color: "#2e7d32", fontSize: 18, mr: 1 }} />
                        <Typography variant="subtitle2" sx={{ color: "#2e7d32", fontWeight: 700 }}>
                          {proctor.studentCount} Assigned Students
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <SectionHeader title="Assigned Students List" />
                  </Box>

                  <DataTable
                    columns={["Student ID", "Student Name"]}
                    rows={proctorStudents.map(m => [
                      m.studentId,
                      m.studentName
                    ])}
                  />
                </Box>
              );
            })()}
          </Box>
        </>
      )}
    </Box>
  );
};

const filterBox = {
  display: "flex",
  alignItems: "center",
  px: 2,
  py: 1,
  borderRadius: "14px",
  background: "rgba(255,255,255,0.75)",
  backdropFilter: "blur(10px)",
  boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
  fontSize: 14,
};

export default DeptProctorUploads;
