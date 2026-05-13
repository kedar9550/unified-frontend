import React, { useState, useEffect, useCallback } from "react";
import { Box, Avatar, CircularProgress, Typography, MenuItem, Select, FormControl, InputLabel, Paper, Button, Grid } from "@mui/material";
import { UploadFile, PersonAdd, Download } from "@mui/icons-material";
import PageHeader from "../../../components/common/PageHeader";
import SectionHeader from "../../../components/common/SectionHeader";
import DataTable from "../../../components/data/DataTable";
import API from "../../../api/axios";
import AcademicHierarchyFilter from "../../../components/academics/AcademicHierarchyFilter";

import { useLocation } from "react-router-dom";

const Assignedstudents = () => {
    const location = useLocation();
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
    const [activeSemesterType, setActiveSemesterType] = useState(""); // "ODD" or "EVEN"

    const handleHierarchyChange = useCallback((val) => {
        setHierarchy(val);
    }, []);
    const [filterSemester, setFilterSemester] = useState("");

    useEffect(() => {
        const controller = new AbortController();

        const fetchAssignedStudents = async () => {
            setLoading(true);
            try {
                const res = await API.get("/api/student-data/assigned", {
                    signal: controller.signal,
                });
                if (res.data.success) {
                    const data = res.data.data || [];
                    setStudents(data);
                    setFilteredStudents(data);
                }
            } catch (error) {
                if (error.name !== "CanceledError" && error.code !== "ERR_CANCELED") {
                    console.error("Failed to fetch assigned students", error);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        const fetchActiveYear = async () => {
            try {
                const res = await API.get("/api/academic-years/active");
                if (res.data?.success && res.data?.data) {
                    setActiveSemesterType(res.data.data.activeSemesterTypeId?.name || "");
                }
            } catch (err) {
                console.error("Failed to fetch active year", err);
            }
        };

        fetchAssignedStudents();
        fetchActiveYear();

        return () => controller.abort(); // unmount అయినప్పుడు cancel చేస్తుంది
    }, [location.key]);

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

    const getSemYearHeader = () => {
        if (hierarchy.programName === "Pharma.D") return "Year";
        if (hierarchy.programName && hierarchy.programName !== "Pharma.D") return "Semester";
        return "Sem / Year";
    };

    const handleDownload = () => {
        if (filteredStudents.length === 0) return;

        const headers = ["Roll No", "Student Name", "Department", "Semester/Year", "Program", "Branch", "Email"];
        const rows = filteredStudents.map(s => [
            s.rollNo,
            s.personalInfo?.studentName,
            s.academicInfo?.department?.name,
            s.academicInfo?.programName === "Pharma.D" ? s.academicInfo?.yearName : s.academicInfo?.semester,
            s.academicInfo?.programName,
            s.academicInfo?.branch,
            s.contactInfo?.emailId
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(cell => `"${cell || ""}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `assigned_students_${new Date().toLocaleDateString("en-IN").replace(/\//g, "-")}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const columns = [
        "Roll No", "Name", "Assigned Dept", getSemYearHeader(), "Program", "Branch", "Email"
    ];

    const formattedRows = filteredStudents.map(s => [
        { value: s.rollNo, display: <Box sx={{ fontWeight: 600, color: "var(--color-primary)" }}>{s.rollNo}</Box> },
        {
            value: s.personalInfo?.studentName,
            display: (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: "0.875rem", bgcolor: "var(--bg-accent-1)", color: "var(--color-primary)" }}>
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
                    bgcolor: "var(--bg-accent-1)",
                    color: "var(--color-primary)",
                    fontWeight: 500,
                    fontSize: "0.75rem",
                    display: "inline-block"
                }}>
                    {s.academicInfo?.department?.name || "N/A"}
                </Box>
            )
        },
        {
            value: s.academicInfo?.semester || s.academicInfo?.yearName,
            display: (
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {s.academicInfo?.programName === "Pharma.D" 
                        ? (s.academicInfo?.yearName || "Year —") 
                        : (s.academicInfo?.semester ? `Sem ${s.academicInfo?.semester}` : "Sem —")}
                </Typography>
            )
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
                    background: "var(--bg-panel)",
                    backdropFilter: "blur(20px)",
                    boxShadow: "var(--shadow-premium)",
                    border: "1px solid var(--border-color)",
                    minHeight: "400px",
                    display: "flex",
                    flexDirection: "column"
                }}
            >
                <SectionHeader
                    title={`Assigned Student Details (${filteredStudents.length})`}
                    action={
                        <Button
                            variant="outlined"
                            startIcon={<Download />}
                            onClick={handleDownload}
                            disabled={filteredStudents.length === 0}
                            sx={{
                                borderRadius: "12px",
                                textTransform: "none",
                                fontWeight: 600,
                                borderColor: "var(--border-color)",
                                color: "var(--text-primary)",
                                "&:hover": {
                                    borderColor: "var(--color-primary)",
                                    background: "var(--bg-accent-1)"
                                }
                            }}
                        >
                            Download CSV
                        </Button>
                    }
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
                                <Box sx={{ display: "flex", alignItems: "flex-end", gap: 2, flexWrap: "nowrap" }}>
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
                                                {[...Array(8)].map((_, i) => i + 1).filter(sem => {
                                                    if (!activeSemesterType) return true;
                                                    if (activeSemesterType.toUpperCase() === "ODD") return sem % 2 !== 0;
                                                    if (activeSemesterType.toUpperCase() === "EVEN") return sem % 2 === 0;
                                                    return true;
                                                }).map((sem) => (
                                                    <MenuItem key={sem} value={sem}>Sem {sem}</MenuItem>
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
                                                border: "1px solid var(--border-color)",
                                                color: "var(--text-secondary)",
                                                fontSize: "0.75rem",
                                                fontWeight: 600,
                                                cursor: "pointer",
                                                transition: "all 0.2s",
                                                "&:hover": { background: "var(--bg-accent-1)", color: "#ef4444" }
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