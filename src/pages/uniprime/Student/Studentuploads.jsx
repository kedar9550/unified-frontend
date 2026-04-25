import React, { useRef, useState, useEffect } from "react";
import { Box, Avatar, Checkbox, MenuItem, Select, FormControl, InputLabel, Collapse, CircularProgress, Typography, Tooltip, IconButton } from "@mui/material";
import { FileUpload as UploadIcon, CheckCircle as ConfirmIcon, Download as DownloadIcon, Delete as DeleteIcon } from "@mui/icons-material";
import PageHeader from "../../../components/common/PageHeader";
import SectionHeader from "../../../components/common/SectionHeader";
import ActionButton from "../../../components/common/ActionButton";
import DataTable from "../../../components/data/DataTable";
import API from "../../../api/axios";

const Studentuploads = () => {
    const fileInputRef = useRef(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [isProceeding, setIsProceeding] = useState(false);
    const [allDepartments, setAllDepartments] = useState([]);
    const [selectedDept, setSelectedDept] = useState("");
    const [selectedSem, setSelectedSem] = useState("");
    const [loadingDepts, setLoadingDepts] = useState(false);
    const [students, setStudents] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);

    const fetchUnassignedStudents = async () => {
        setLoadingStudents(true);
        try {
            const res = await API.get("/api/student-data/unassigned");
            if (res.data.success) {
                setStudents(res.data.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch students", error);
        } finally {
            setLoadingStudents(false);
        }
    };

    useEffect(() => {
        const fetchDepartments = async () => {
            setLoadingDepts(true);
            try {
                const res = await API.get("/api/academics/departments");
                if (res.data.success) {
                    setAllDepartments(res.data.data || []);
                }
            } catch (error) {
                console.error("Failed to fetch departments", error);
            } finally {
                setLoadingDepts(false);
            }
        };
        fetchDepartments();
        fetchUnassignedStudents();
    }, []);

    const handleUploadClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        setUploading(true);
        try {
            const res = await API.post("/api/student-data/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            if (res.data.success) {
                setUploadResult(res.data.summary);
                fetchUnassignedStudents();
            }
        } catch (error) {
            console.error("Upload failed", error);
        } finally {
            setUploading(false);
            e.target.value = null; // Reset input
        }
    };

    const handleDeleteAllUnassigned = async () => {
        if (!window.confirm("Are you sure you want to clear ALL unassigned student records? This action cannot be undone.")) return;
        try {
            const res = await API.delete("/api/student-data/all/unassigned");
            if (res.data.success) {
                fetchUnassignedStudents();
                setSelectedIds([]);
            }
        } catch (error) {
            console.error("Bulk delete failed", error);
        }
    };

    const handleConfirmAssignment = async () => {
        try {
            const res = await API.post("/api/student-data/assign", {
                studentIds: selectedIds,
                deptId: selectedDept,
                semester: selectedSem
            });
            if (res.data.success) {
                setIsProceeding(false);
                setSelectedIds([]);
                setSelectedDept("");
                setSelectedSem("");
                fetchUnassignedStudents();
                // Optional: show success message
            }
        } catch (error) {
            console.error("Assignment failed", error);
        }
    };

    const handleTemplateDownload = () => {
        const headers = ["Roll No", "Name", "Dept", "Email", "Phone", "Branch", "Program", "Department", "Semester"];
        const csvContent = headers.join(",");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `student_upload_template.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportClick = () => {
        const headers = ["Roll No", "Name", "Dept", "Email", "Phone", "Branch", "Program", "Department", "Semester"];
        const csvContent = [
            headers.join(","),
            ...students.map(s => [s.rollNo, s.name, s.dept, s.email, s.phone, s.branch, s.program, "", ""].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `unassigned_students_${new Date().toLocaleDateString()}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSelectRow = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
        setIsProceeding(false);
    };

    const getMaxSemesters = () => {
        const selectedStudents = students.filter(s => selectedIds.includes(s.rollNo));
        const isMtech = selectedStudents.some(s => s.program === "M.Tech");
        return isMtech ? 4 : 8;
    };

    const maxSem = getMaxSemesters();

    const columns = [
        <Checkbox
            size="small"
            sx={{ color: "white", "&.Mui-checked": { color: "white" } }}
            indeterminate={selectedIds.length > 0 && selectedIds.length < students.length}
            checked={students.length > 0 && selectedIds.length === students.length}
            onChange={() => {
                if (selectedIds.length === students.length) {
                    setSelectedIds([]);
                    setIsProceeding(false);
                } else {
                    setSelectedIds(students.map(s => s.rollNo));
                }
            }}
        />,
        "Roll No", "Name", "Dept", "Email", "Phone", "Branch", "Program"
    ];

    const formattedRows = students.map(s => [
        {
            value: selectedIds.includes(s.rollNo),
            display: (
                <Checkbox
                    size="small"
                    checked={selectedIds.includes(s.rollNo)}
                    onChange={() => handleSelectRow(s.rollNo)}
                />
            )
        },
        { value: s.rollNo, display: <Box sx={{ fontWeight: 600, color: "#0b5299" }}>{s.rollNo}</Box> },
        {
            value: s.name,
            display: (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: "0.875rem", bgcolor: "#84a9eb" }}>
                        {s.name?.charAt(0)}
                    </Avatar>
                    <Box sx={{ fontWeight: 500 }}>{s.name}</Box>
                </Box>
            )
        },
        s.dept,
        s.email,
        s.phone,
        s.branch,
        s.program
    ]);

    return (
        <Box sx={{ p: 3 }}>
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept=".csv"
                onChange={handleFileChange}
            />

            <PageHeader
                title="Student Management"
                subtitle="Upload and manage student records"
                breadcrumbs={["Home", "Student Management", "Student Upload"]}
                action={
                    <Box sx={{ display: "flex", gap: 2 }}>
                        <ActionButton 
                            onClick={handleTemplateDownload}
                            sx={{ background: "linear-gradient(135deg, #6a11cb, #2575fc)" }}
                        >
                            <DownloadIcon sx={{ mr: 1 }} /> Download Template
                        </ActionButton>

                        <ActionButton onClick={handleUploadClick} disabled={uploading}>
                            {uploading ? <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} /> : <UploadIcon sx={{ mr: 1 }} />}
                            Upload CSV
                        </ActionButton>
                    </Box>
                }
            />

            {/* UPLOAD RESULT CARD */}
            {uploadResult && (
                <Collapse in={!!uploadResult}>
                    <Box sx={{ 
                        mb: 3, 
                        p: 3, 
                        borderRadius: "24px", 
                        background: uploadResult.errors > 0 ? "rgba(239, 68, 68, 0.1)" : "rgba(76, 175, 80, 0.1)",
                        border: uploadResult.errors > 0 ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(76, 175, 80, 0.3)",
                        backdropFilter: "blur(10px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between"
                    }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            {uploadResult.errors > 0 ? (
                                <ConfirmIcon sx={{ color: "#d32f2f", fontSize: 40 }} />
                            ) : (
                                <ConfirmIcon sx={{ color: "#2e7d32", fontSize: 40 }} />
                            )}
                            <Box>
                                <Typography variant="h6" sx={{ color: uploadResult.errors > 0 ? "#b91c1c" : "#1b5e20", fontWeight: 700 }}>
                                    {uploadResult.errors > 0 ? "Upload Completed with Errors" : "Upload Successful!"}
                                </Typography>
                                <Typography variant="body2" sx={{ color: uploadResult.errors > 0 ? "#dc2626" : "#2e7d32" }}>
                                    Processed {uploadResult.total} students. {uploadResult.success} records updated.
                                    {uploadResult.skipped > 0 && ` ${uploadResult.skipped} skipped.`}
                                    {uploadResult.errors > 0 && ` ${uploadResult.errors} invalid rows found.`}
                                </Typography>
                            </Box>
                        </Box>
                        <ActionButton 
                            onClick={() => setUploadResult(null)}
                            sx={{ 
                                background: uploadResult.errors > 0 ? "#d32f2f" : "#2e7d32", 
                                color: "white", 
                                "&:hover": { background: uploadResult.errors > 0 ? "#b91c1c" : "#1b5e20" } 
                            }}
                        >
                            Dismiss
                        </ActionButton>
                    </Box>
                </Collapse>
            )}

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
                    title={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            Student Unassigned Details ({students.length})
                            {students.length > 0 && (
                                <Tooltip title="Clear all unassigned data" arrow placement="top">
                                    <IconButton 
                                        size="small" 
                                        onClick={handleDeleteAllUnassigned}
                                        sx={{ 
                                            color: "rgba(211, 47, 47, 0.6)",
                                            "&:hover": { color: "#d32f2f", bgcolor: "rgba(211, 47, 47, 0.1)" }
                                        }}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Box>
                    }
                    action={
                        <Tooltip 
                            title="Download the unassigned data, add the department and semester, then upload it — it will be automatically assigned to the selected department." 
                            arrow 
                            placement="top"
                        >
                            <ActionButton
                                onClick={handleExportClick}
                                sx={{
                                    py: 0.5,
                                    px: 2,
                                    minHeight: "32px",
                                    fontSize: "0.75rem",
                                    background: "linear-gradient(135deg, #6a11cb, #2575fc)"
                                }}
                            >
                                <DownloadIcon sx={{ mr: 1, fontSize: "1rem" }} /> Download
                            </ActionButton>
                        </Tooltip>
                    }
                />

                <Box sx={{ mt: 2, flex: 1 }}>
                    {loadingStudents ? (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <DataTable columns={columns} rows={formattedRows} />
                    )}
                </Box>

                {/* PROCEED ACTION BAR */}
                {selectedIds.length > 0 && (
                    <Box
                        sx={{
                            mt: 3,
                            pt: 2,
                            borderTop: "1px solid rgba(0,0,0,0.05)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                        }}
                    >
                        <Box sx={{ color: "#64748b", fontSize: "0.875rem", fontWeight: 500 }}>
                            {selectedIds.length} student{selectedIds.length > 1 ? 's' : ''} selected
                        </Box>
                        {!isProceeding && (
                            <ActionButton
                                onClick={() => setIsProceeding(true)}
                                sx={{
                                    px: 4,
                                    background: "linear-gradient(135deg, #0b5299, #1e88e5)",
                                    "&:hover": { background: "linear-gradient(135deg, #09437d, #1976d2)" }
                                }}
                            >
                                Proceed
                            </ActionButton>
                        )}
                    </Box>
                )}

                {/* SELECTION FLOW */}
                <Collapse in={isProceeding && selectedIds.length > 0}>
                    <Box sx={{
                        mt: 2,
                        p: 3,
                        borderRadius: "16px",
                        background: "rgba(255,255,255,0.5)",
                        border: "1px dashed rgba(11, 82, 153, 0.3)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 3
                    }}>
                        <Typography variant="subtitle2" sx={{ color: "#0b5299", fontWeight: 600 }}>
                            Finalize Upload Details
                        </Typography>

                        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                            <FormControl variant="standard" sx={{ minWidth: 200 }}>
                                <InputLabel id="dept-select-label">Select Department</InputLabel>
                                <Select
                                    labelId="dept-select-label"
                                    value={selectedDept}
                                    onChange={(e) => setSelectedDept(e.target.value)}
                                    label="Select Department"
                                >
                                    {loadingDepts ? (
                                        <MenuItem disabled><CircularProgress size={20} sx={{ mr: 1 }} /> Loading...</MenuItem>
                                    ) : (
                                        allDepartments
                                            .filter(dept => ![
                                                "Examination Center",
                                                "Extension Activites",
                                                "Knowledge Resource Center",
                                                "OFFICE ADMIN",
                                                "Physical Education",
                                                "Placements",
                                                "T-HUB",
                                                "Training",
                                                "IT Applications"
                                            ].includes(dept.name))
                                            .map((dept) => (
                                                <MenuItem key={dept._id} value={dept._id}>{dept.name}</MenuItem>
                                            ))
                                    )}
                                </Select>
                            </FormControl>

                            <FormControl variant="standard" sx={{ minWidth: 200 }}>
                                <InputLabel id="sem-select-label">Select Semester</InputLabel>
                                <Select
                                    labelId="sem-select-label"
                                    value={selectedSem}
                                    onChange={(e) => setSelectedSem(e.target.value)}
                                    label="Select Semester"
                                >
                                    {[...Array(maxSem)].map((_, i) => (
                                        <MenuItem key={i + 1} value={i + 1}>Semester {i + 1}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>

                        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                            <ActionButton 
                                onClick={handleConfirmAssignment}
                                disabled={!selectedDept || !selectedSem}
                                sx={{ 
                                    background: "linear-gradient(135deg, #43a047, #66bb6a)",
                                    "&:hover": { background: "linear-gradient(135deg, #388e3c, #4caf50)" }
                                }}
                            >
                                <ConfirmIcon sx={{ mr: 1 }} /> Confirm Assignment
                            </ActionButton>
                        </Box>
                    </Box>
                </Collapse>
            </Box>
        </Box>
    );
};

export default Studentuploads;