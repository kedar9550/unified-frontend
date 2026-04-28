import React, { useState, useEffect, useCallback } from "react";
import { Box, Avatar, CircularProgress, Typography, MenuItem, Select, FormControl, InputLabel } from "@mui/material";
import PageHeader from "../../../components/common/PageHeader";
import SectionHeader from "../../../components/common/SectionHeader";
import DataTable from "../../../components/data/DataTable";
import API from "../../../api/axios";
import AcademicHierarchyFilter from "../../../components/academics/AcademicHierarchyFilter";

const Assignedstudents = () => {
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hierarchy, setHierarchy] = useState({
        program: "",
        programName: "",
        department: "",
        departmentName: "",
        branch: "",
        branchName: ""
    });
    const [filterSemester, setFilterSemester] = useState("");

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

    useEffect(() => {
        fetchAssignedStudents();
    }, []);

    const handleHierarchyChange = useCallback((val) => {
        setHierarchy(val);
    }, []);

    // Auto-apply filter whenever hierarchy or semester changes
    useEffect(() => {
        const filtered = students.filter(s => {
            const matchesProgram = hierarchy.programName ? s.academicInfo?.programName === hierarchy.programName : true;
            const matchesDept = hierarchy.departmentName ? s.academicInfo?.department?.name === hierarchy.departmentName : true;
            const matchesBranch = hierarchy.branchName ? s.academicInfo?.branch === hierarchy.branchName : true;
            const matchesSemester = filterSemester ? s.academicInfo?.semester === Number(filterSemester) : true;
            return matchesProgram && matchesDept && matchesBranch && matchesSemester;
        });
        setFilteredStudents(filtered);
    }, [hierarchy, filterSemester, students]);

    const hasActiveFilter = hierarchy.program || filterSemester;

    const handleClearFilters = () => {
        setHierarchy({
            program: "",
            programName: "",
            department: "",
            departmentName: "",
            branch: "",
            branchName: ""
        });
        setFilterSemester("");
    };

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
            />

            {/* TABLE CARD with inline filter toolbar */}
            <Box
                sx={{
                    p: 3,
                    mt: 2,
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

                <Box sx={{ flex: 1 }}>
                    {loading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <DataTable
                            columns={columns}
                            rows={formattedRows}
                            toolbarLeft={
                                <Box sx={{ display: "flex", alignItems: "flex-end", gap: 2, flexWrap: "wrap" }}>
                                    <AcademicHierarchyFilter
                                        onChange={handleHierarchyChange}
                                        initialValues={hierarchy}
                                    />
                                    {hierarchy.department && (
                                        <FormControl variant="standard" sx={{ minWidth: 120 }}>
                                            <InputLabel id="sem-filter-label" sx={{ fontSize: "0.85rem" }}>Semester</InputLabel>
                                            <Select
                                                labelId="sem-filter-label"
                                                value={filterSemester}
                                                onChange={(e) => setFilterSemester(e.target.value)}
                                                sx={{ fontSize: "0.85rem" }}
                                            >
                                                <MenuItem value=""><em>All</em></MenuItem>
                                                {[...Array(8)].map((_, i) => (
                                                    <MenuItem key={i + 1} value={i + 1}>Sem {i + 1}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    )}
                                    {hasActiveFilter && (
                                        <Box
                                            onClick={handleClearFilters}
                                            sx={{
                                                display: "flex", alignItems: "center", gap: 0.5,
                                                px: 1.5, py: 0.5, mb: 0.3,
                                                borderRadius: "20px",
                                                border: "1px solid rgba(100,116,139,0.4)",
                                                color: "#64748b",
                                                fontSize: "0.75rem",
                                                fontWeight: 600,
                                                cursor: "pointer",
                                                transition: "all 0.2s",
                                                "&:hover": { background: "#f1f5f9", color: "#e53935" }
                                            }}
                                        >
                                            ✕ Reset
                                        </Box>
                                    )}
                                </Box>
                            }
                        />
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default Assignedstudents;