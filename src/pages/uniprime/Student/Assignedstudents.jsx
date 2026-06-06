import React, { useState, useEffect, useCallback } from "react";
import { Box, Avatar, CircularProgress, Typography, MenuItem, Select, FormControl, InputLabel, Paper, Button, Grid, Checkbox } from "@mui/material";
import { UploadFile, PersonAdd, Download } from "@mui/icons-material";
import PageHeader from "../../../components/common/PageHeader";
import SectionHeader from "../../../components/common/SectionHeader";
import DataTable from "../../../components/data/DataTable";
import API from "../../../api/axios";
import AcademicHierarchyFilter from "../../../components/academics/AcademicHierarchyFilter";

import { useLocation } from "react-router-dom";
import { toast } from "sonner";

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
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [allDepartments, setAllDepartments] = useState([]);
    const [selectedDept, setSelectedDept] = useState("");
    const [movingDept, setMovingDept] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

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

        fetchAssignedStudents();

        return () => controller.abort(); // unmou
    }, [location.key, refreshTrigger]);

    // Fetch all departments for selection dropdown on mount
    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const res = await API.get("/api/academics/departments?type=Academic");
                if (res.data.success) {
                    const depts = res.data.data || [];
                    // Keep robust filtering in frontend as well
                    setAllDepartments(depts.filter(d => d.type === "Academic" || !d.type));
                }
            } catch (error) {
                console.error("Failed to fetch departments", error);
            }
        };
        fetchDepartments();
    }, []);

    // Fetch active academic year and semester type when hierarchy program changes
    useEffect(() => {
        if (!hierarchy.program) {
            setActiveSemesterType("");
            return;
        }

        const fetchActiveYear = async () => {
            try {
                const res = await API.get(`/api/academic-years/active?programId=${hierarchy.program}`);
                if (res.data?.success && res.data?.data) {
                    setActiveSemesterType(res.data.data.activeSemesterTypeId?.name || "");
                } else {
                    setActiveSemesterType("");
                }
            } catch (err) {
                console.error("Failed to fetch active year", err);
                setActiveSemesterType("");
            }
        };

        fetchActiveYear();
    }, [hierarchy.program]);

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
        setSelectedStudents([]);
    }, [hierarchy, filterSemester, students]);

    const handleSelectRow = (rollNo) => {
        setSelectedStudents(prev =>
            prev.includes(rollNo) ? prev.filter(r => r !== rollNo) : [...prev, rollNo]
        );
    };

    const handleSelectAll = () => {
        if (selectedStudents.length === filteredStudents.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(filteredStudents.map(s => s.rollNo));
        }
    };

    const handleConfirmDeptChange = async () => {
        if (!selectedDept || selectedStudents.length === 0) return;
        setMovingDept(true);
        try {
            const res = await API.post("/api/student-data/assign", {
                studentIds: selectedStudents,
                deptId: selectedDept,
            });
            if (res.data.success) {
                setSelectedStudents([]);
                setSelectedDept("");
                setRefreshTrigger(prev => prev + 1);
                toast.success("Department changed successfully");
            }
        } catch (error) {
            console.error("Failed to move department", error);
            toast.error(error.response?.data?.message || "Failed to change department");
        } finally {
            setMovingDept(false);
        }
    };

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
        <Checkbox
            size="small"
            sx={{ color: "white", "&.Mui-checked": { color: "white" } }}
            indeterminate={selectedStudents.length > 0 && selectedStudents.length < filteredStudents.length}
            checked={filteredStudents.length > 0 && selectedStudents.length === filteredStudents.length}
            onChange={handleSelectAll}
            onClick={(e) => e.stopPropagation()}
        />,
        "Roll No", "Name", "Assigned Dept", getSemYearHeader(), "Program", "Branch", "Email"
    ];

    const formattedRows = filteredStudents.map(s => [
        {
            value: "",
            display: (
                <Checkbox
                    size="small"
                    checked={selectedStudents.includes(s.rollNo)}
                    onChange={() => handleSelectRow(s.rollNo)}
                    onClick={(e) => e.stopPropagation()}
                />
            )
        },
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
                    <DataTable
                        columns={columns}
                        rows={formattedRows}
                        nonSortableColumns={[0]}
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
                </Box>

                {selectedStudents.length > 0 && (
                    <Box
                        sx={{
                            p: 3,
                            mt: 2,
                            borderRadius: "16px",
                            border: "1px solid var(--border-color)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            background: "var(--bg-paper)",
                            boxShadow: "var(--shadow-premium)",
                            flexWrap: "wrap",
                            gap: 2
                        }}
                    >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            <Typography variant="body2" sx={{ color: "var(--text-primary)", fontWeight: 700 }}>
                                {selectedStudents.length} students selected
                            </Typography>
                            <Button
                                size="small"
                                onClick={() => setSelectedStudents([])}
                                sx={{ textTransform: "none", fontWeight: 800, color: "#ef4444" }}
                            >
                                Clear Selection
                            </Button>
                        </Box>
                        <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                            <FormControl size="small" sx={{ minWidth: 220 }}>
                                <InputLabel id="dept-move-label" sx={{ color: "var(--text-secondary)" }}>Change Department</InputLabel>
                                <Select
                                    labelId="dept-move-label"
                                    value={selectedDept}
                                    onChange={(e) => setSelectedDept(e.target.value)}
                                    label="Change Department"
                                    sx={{
                                        borderRadius: "10px",
                                        color: "var(--text-primary)",
                                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "var(--border-color)" }
                                    }}
                                >
                                    {allDepartments.map((dept) => (
                                        <MenuItem key={dept._id} value={dept._id}>{dept.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Button
                                variant="contained"
                                aria-disabled={!selectedDept || movingDept}
                                onClick={() => {
                                    if (!selectedDept || movingDept) return;
                                    handleConfirmDeptChange();
                                }}
                                sx={{ 
                                    borderRadius: "50px", 
                                    px: 4, 
                                    textTransform: "none", 
                                    fontWeight: 800, 
                                    background: "var(--gradient-primary)", 
                                    color: (!selectedDept || movingDept) ? "rgba(255, 255, 255, 0.4)" : "#ffffff",
                                    opacity: (!selectedDept || movingDept) ? 0.6 : 1,
                                    cursor: (!selectedDept || movingDept) ? "not-allowed" : "pointer",
                                    pointerEvents: "auto",
                                    "&:hover": { 
                                        boxShadow: (!selectedDept || movingDept) ? "none" : "var(--shadow-premium)" 
                                    } 
                                }}
                            >
                                {movingDept ? "Moving..." : "Change Dept"}
                            </Button>
                        </Box>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default Assignedstudents;