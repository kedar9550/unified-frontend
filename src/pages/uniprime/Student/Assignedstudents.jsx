import React, { useState, useEffect } from "react";
import { Box, Avatar, CircularProgress, Typography, MenuItem, Select, FormControl, InputLabel, Collapse, Tooltip, IconButton } from "@mui/material";
import { FilterList as FilterIcon, Delete as DeleteIcon } from "@mui/icons-material";
import ActionButton from "../../../components/common/ActionButton";
import PageHeader from "../../../components/common/PageHeader";
import SectionHeader from "../../../components/common/SectionHeader";
import DataTable from "../../../components/data/DataTable";
import API from "../../../api/axios";

const Assignedstudents = () => {
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    
    // Filter State
    const [filterProgram, setFilterProgram] = useState("");
    const [filterBranch, setFilterBranch] = useState("");
    const [filterDept, setFilterDept] = useState("");
    const [filterSemester, setFilterSemester] = useState("");
    const [filterOptions, setFilterOptions] = useState({ programs: [], branches: [], departments: [] });

    const fetchAssignedStudents = async () => {
        setLoading(true);
        try {
            const res = await API.get("/api/student-data/assigned");
            if (res.data.success) {
                const data = res.data.data || [];
                setStudents(data);
                setFilteredStudents(data); // Initial state
            }
        } catch (error) {
            console.error("Failed to fetch assigned students", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFilterOptions = async () => {
        try {
            console.log("Frontend: Fetching filter options...");
            const res = await API.get("/api/student-data/filter-options");
            console.log("Frontend: Filter options response:", res.data);
            if (res.data.success) {
                setFilterOptions(res.data.data);
            }
        } catch (error) {
            console.error("Frontend: Failed to fetch filter options", error);
        }
    };

    useEffect(() => {
        fetchAssignedStudents();
        fetchFilterOptions();
    }, []);

    const handleApplyFilters = () => {
        const filtered = students.filter(s => 
            s.academicInfo?.programName === filterProgram &&
            s.academicInfo?.branch === filterBranch &&
            s.academicInfo?.department?.name === filterDept &&
            s.academicInfo?.semester === Number(filterSemester)
        );
        setFilteredStudents(filtered);
    };

    const handleClearFilters = () => {
        setFilterProgram("");
        setFilterBranch("");
        setFilterDept("");
        setFilterSemester("");
        setFilteredStudents(students);
    };

    // Use filter options from backend
    const uniquePrograms = filterOptions.programs;
    const uniqueBranches = filterOptions.branches;
    const uniqueDepts = filterOptions.departments.map(d => d.name);

    const columns = [
        "Roll No", "Name", "Assigned Dept", "Semester", "Program", "Branch", "Email"
    ];

    const formattedRows = filteredStudents.map(s => [
        { value: s.rollNo, display: <Box sx={{ fontWeight: 600, color: "#0b5299" }}>{s.rollNo}</Box> },
        {
            value: s.personalInfo?.studentName,
            display: (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: "0.875rem", bgcolor: "#84a9eb" }}>
                        {s.personalInfo?.studentName?.charAt(0)}
                    </Avatar>
                    <Box sx={{ fontWeight: 500 }}>{s.personalInfo?.studentName}</Box>
                </Box>
            )
        },
        { 
            value: s.academicInfo?.department?.name, 
            display: (
                <Box sx={{ 
                    px: 1.5, 
                    py: 0.5, 
                    borderRadius: "12px", 
                    bgcolor: "rgba(11, 82, 153, 0.1)", 
                    color: "#0b5299",
                    fontWeight: 500,
                    fontSize: "0.75rem",
                    display: "inline-block"
                }}>
                    {s.academicInfo?.department?.name || "N/A"}
                </Box>
            )
        },
        { 
            value: s.academicInfo?.semester, 
            display: <Typography variant="body2" sx={{ fontWeight: 600 }}>Sem {s.academicInfo?.semester}</Typography> 
        },
        s.academicInfo?.programName,
        s.academicInfo?.branch,
        s.contactInfo?.emailId
    ]);

    return (
        <Box sx={{ p: 3 }}>
            <PageHeader
                title="Assigned Students"
                subtitle="View and manage students assigned to departments"
                breadcrumbs={["Home", "Student Management", "Assigned Students"]}
                action={
                    <ActionButton 
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        sx={{ background: isFilterOpen ? "linear-gradient(135deg, #1e88e5, #1565c0)" : "linear-gradient(135deg, #64748b, #475569)" }}
                    >
                        <FilterIcon sx={{ mr: 1 }} /> {isFilterOpen ? "Close Filter" : "Filter"}
                    </ActionButton>
                }
            />

            {/* FILTER PANEL */}
            <Collapse in={isFilterOpen}>
                <Box
                    sx={{
                        p: 3,
                        mt: 2,
                        borderRadius: "20px",
                        background: "rgba(255, 255, 255, 0.5)",
                        backdropFilter: "blur(10px)",
                        border: "1px dashed rgba(11, 82, 153, 0.3)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 2
                    }}
                >
                    <Typography variant="subtitle2" sx={{ color: "#0b5299", fontWeight: 600 }}>
                        Filter Records
                    </Typography>

                    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "flex-end" }}>
                        <FormControl variant="standard" sx={{ minWidth: 180 }}>
                            <InputLabel id="program-filter-label">Program</InputLabel>
                            <Select
                                labelId="program-filter-label"
                                value={filterProgram}
                                onChange={(e) => {
                                    setFilterProgram(e.target.value);
                                    setFilterBranch(""); // Reset branch when program changes
                                }}
                            >
                                {uniquePrograms.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                            </Select>
                        </FormControl>

                        <FormControl variant="standard" sx={{ minWidth: 180 }}>
                            <InputLabel id="branch-filter-label">Branch</InputLabel>
                            <Select
                                labelId="branch-filter-label"
                                value={filterBranch}
                                onChange={(e) => {
                                    setFilterBranch(e.target.value);
                                    setFilterDept(""); // Reset dept when branch changes
                                }}
                            >
                                {uniqueBranches.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                            </Select>
                        </FormControl>

                        <FormControl variant="standard" sx={{ minWidth: 180 }}>
                            <InputLabel id="dept-filter-label">Department</InputLabel>
                            <Select
                                labelId="dept-filter-label"
                                value={filterDept}
                                onChange={(e) => setFilterDept(e.target.value)}
                            >
                                {uniqueDepts.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                            </Select>
                        </FormControl>

                        <FormControl variant="standard" sx={{ minWidth: 180 }}>
                            <InputLabel id="sem-filter-label">Semester</InputLabel>
                            <Select
                                labelId="sem-filter-label"
                                value={filterSemester}
                                onChange={(e) => setFilterSemester(e.target.value)}
                            >
                                {[...Array(8)].map((_, i) => (
                                    <MenuItem key={i + 1} value={i + 1}>Semester {i + 1}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {filterProgram && filterBranch && filterDept && filterSemester && (
                            <Box sx={{ display: "flex", gap: 1 }}>
                                <ActionButton 
                                    onClick={handleApplyFilters}
                                    sx={{ background: "linear-gradient(135deg, #0b5299, #1e88e5)" }}
                                >
                                    Apply
                                </ActionButton>
                                <ActionButton 
                                    onClick={handleClearFilters}
                                    sx={{ background: "#64748b" }}
                                >
                                    Clear
                                </ActionButton>
                            </Box>
                        )}
                    </Box>
                </Box>
            </Collapse>

            <Box
                sx={{
                    p: 3,
                    mt: 3,
                    borderRadius: "24px",
                    background: "linear-gradient(135deg, rgba(255,255,255,0.7), rgba(255,255,255,0.4))",
                    backdropFilter: "blur(20px)",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    minHeight: "400px",
                    display: "flex",
                    flexDirection: "column"
                }}
            >
                <SectionHeader
                    title={`Assigned Student Details (${filteredStudents.length})`}
                />

                <Box sx={{ mt: 2, flex: 1 }}>
                    {loading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <DataTable columns={columns} rows={formattedRows} />
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default Assignedstudents;