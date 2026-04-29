import React, { useRef, useState, useEffect } from "react";
import { Box, Avatar, Checkbox, MenuItem, Select, FormControl, InputLabel, Collapse, CircularProgress, Typography, Tooltip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Grid, Paper, Snackbar, Alert } from "@mui/material";
import { FileUpload as UploadIcon, CheckCircle as ConfirmIcon, Download as DownloadIcon, Delete as DeleteIcon, PersonAdd as PersonAddIcon, Sync as SyncIcon, UploadFile, PersonAdd, Close as CloseIcon } from "@mui/icons-material";
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
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [addRollNo, setAddRollNo] = useState("");
    const [addDept, setAddDept] = useState("");
    const [addingStudent, setAddingStudent] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [updatingBulk, setUpdatingBulk] = useState(false);
    const [isUploadOptionsOpen, setIsUploadOptionsOpen] = useState(false);
    const [isUpdateOptionsOpen, setIsUpdateOptionsOpen] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

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

    const handleBulkSyncAll = async () => {
        setUpdatingBulk(true);
        try {
            const res = await API.post("/api/student-data/sync", {});
            if (res.data.success) {
                setUploadResult(res.data.summary);
                setSnackbar({
                    open: true,
                    message: res.data.message,
                    severity: res.data.updated ? "success" : "info"
                });
                fetchUnassignedStudents();
            }
        } catch (error) {
            console.error("Bulk sync failed", error);
            setSnackbar({
                open: true,
                message: error.response?.data?.message || "Sync failed",
                severity: "error"
            });
        } finally {
            setUpdatingBulk(false);
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

    const handleAddStudent = async () => {
        if (!addRollNo) return;
        setAddingStudent(true);
        try {
            const res = await API.post("/api/student-data/add", {
                rollNo: addRollNo,
                department: addDept
            });
            if (res.data.success) {
                setIsAddModalOpen(false);
                setIsUpdateModalOpen(false);
                setAddRollNo("");
                setAddDept("");
                setSnackbar({
                    open: true,
                    message: res.data.message,
                    severity: res.data.updated ? "success" : "info"
                });
                fetchUnassignedStudents();
            }
        } catch (error) {
            console.error("Add student failed", error);
            alert(error.response?.data?.message || "Failed to add student");
        } finally {
            setAddingStudent(false);
        }
    };

    const handleSyncStudents = async () => {
        if (selectedIds.length === 0) return;
        setSyncing(true);
        try {
            const res = await API.post("/api/student-data/sync", {
                rollNos: selectedIds
            });
            if (res.data.success) {
                setUploadResult(res.data.summary);
                setSnackbar({
                    open: true,
                    message: res.data.message,
                    severity: res.data.updated ? "success" : "info"
                });
                fetchUnassignedStudents();
                setSelectedIds([]);
            }
        } catch (error) {
            console.error("Sync failed", error);
            alert(error.response?.data?.message || "Failed to sync students");
        } finally {
            setSyncing(false);
        }
    };

    const handleTemplateDownload = () => {
        const headers = ["Roll No", "Dept"];
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
            ...students.map(s => [s.rollNo, s.personalInfo?.studentName, s.academicInfo?.department?.name || s.academicInfo?.department || "", s.contactInfo?.emailId, s.contactInfo?.mobileNumber, s.academicInfo?.branch, s.academicInfo?.programName, "", ""].join(","))
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
        const isMtech = selectedStudents.some(s => s.academicInfo?.programName === "M.Tech");
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
        s.academicInfo?.department?.name || s.academicInfo?.department || "N/A",
        s.contactInfo?.emailId,
        s.contactInfo?.mobileNumber,
        s.academicInfo?.branch,
        s.academicInfo?.programName
    ]);

    return (
        <Box sx={{ p: { xs: 1, md: 1.5 } }}>
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
                action={null}
            />

            {/* ADD STUDENT MODAL */}
            <Dialog open={isAddModalOpen} onClose={() => !addingStudent && setIsAddModalOpen(false)}>
                <DialogTitle>Add Individual Student</DialogTitle>
                <DialogContent sx={{ minWidth: 400 }}>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        Fetch student data from ECAP using their Roll No.
                    </Typography>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Roll Number"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={addRollNo}
                        onChange={(e) => setAddRollNo(e.target.value)}
                        disabled={addingStudent}
                        sx={{ mb: 2 }}
                    />
                    <FormControl fullWidth variant="outlined">
                        <InputLabel>Department (Optional)</InputLabel>
                        <Select
                            value={addDept}
                            onChange={(e) => setAddDept(e.target.value)}
                            label="Department (Optional)"
                            disabled={addingStudent}
                        >
                            <MenuItem value=""><em>None</em></MenuItem>
                            {allDepartments.map((dept) => (
                                <MenuItem key={dept._id} value={dept._id}>{dept.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsAddModalOpen(false)} disabled={addingStudent}>Cancel</Button>
                    <Button onClick={handleAddStudent} disabled={addingStudent || !addRollNo} variant="contained" color="primary">
                        {addingStudent ? <CircularProgress size={24} color="inherit" /> : "Add Student"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* UPDATE STUDENT MODAL */}
            <Dialog open={isUpdateModalOpen} onClose={() => !addingStudent && setIsUpdateModalOpen(false)}>
                <DialogTitle>Update Individual Student</DialogTitle>
                <DialogContent sx={{ minWidth: 400 }}>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        Sync/Update student data from ECAP using their Roll No.
                    </Typography>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Roll Number"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={addRollNo}
                        onChange={(e) => setAddRollNo(e.target.value)}
                        disabled={addingStudent}
                        sx={{ mb: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsUpdateModalOpen(false)} disabled={addingStudent}>Cancel</Button>
                    <Button onClick={handleAddStudent} disabled={addingStudent || !addRollNo} variant="contained" color="primary">
                        {addingStudent ? <CircularProgress size={24} color="inherit" /> : "Update Student"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* UPLOAD RESULT CARD */}
            {uploadResult && (
                <Collapse in={!!uploadResult}>
                    <Box sx={{
                        mb: 4,
                        p: 3,
                        borderRadius: "24px",
                        background: uploadResult.errors > 0
                            ? "linear-gradient(135deg, rgba(254, 242, 242, 0.9), rgba(254, 226, 226, 0.9))"
                            : "linear-gradient(135deg, rgba(240, 253, 244, 0.9), rgba(220, 252, 231, 0.9))",
                        border: uploadResult.errors > 0 ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid rgba(34, 197, 94, 0.2)",
                        backdropFilter: "blur(20px)",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        animation: "fadeIn 0.5s ease-out"
                    }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
                            <Box sx={{
                                width: 56,
                                height: 56,
                                borderRadius: "16px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: uploadResult.errors > 0 ? "rgba(239, 68, 68, 0.1)" : "rgba(34, 197, 94, 0.1)"
                            }}>
                                {uploadResult.errors > 0 ? (
                                    <ConfirmIcon sx={{ color: "#d32f2f", fontSize: 32 }} />
                                ) : (
                                    <ConfirmIcon sx={{ color: "#2e7d32", fontSize: 32 }} />
                                )}
                            </Box>
                            <Box>
                                <Typography variant="h6" sx={{ color: uploadResult.errors > 0 ? "#991b1b" : "#166534", fontWeight: 800, mb: 0.5 }}>
                                    {uploadResult.errors > 0 ? "Processed with some issues" : "Processing Complete!"}
                                </Typography>
                                <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                        <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600 }}>Total:</Typography>
                                        <Typography variant="body2" sx={{ color: "#1e293b", fontWeight: 700 }}>{uploadResult.total || (uploadResult.success + uploadResult.failed)}</Typography>
                                    </Box>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                        <Typography variant="body2" sx={{ color: "#16a34a", fontWeight: 600 }}>Success:</Typography>
                                        <Typography variant="body2" sx={{ color: "#15803d", fontWeight: 700 }}>{uploadResult.success}</Typography>
                                    </Box>
                                    {uploadResult.skipped > 0 && (
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                            <Typography variant="body2" sx={{ color: "#ca8a04", fontWeight: 600 }}>Skipped:</Typography>
                                            <Typography variant="body2" sx={{ color: "#a16207", fontWeight: 700 }}>{uploadResult.skipped}</Typography>
                                        </Box>
                                    )}
                                    {uploadResult.errors > 0 && (
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                            <Typography variant="body2" sx={{ color: "#dc2626", fontWeight: 600 }}>Errors:</Typography>
                                            <Typography variant="body2" sx={{ color: "#b91c1c", fontWeight: 700 }}>{uploadResult.errors}</Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        </Box>
                        <Button
                            onClick={() => setUploadResult(null)}
                            variant="text"
                            sx={{
                                color: uploadResult.errors > 0 ? "#b91c1c" : "#15803d",
                                fontWeight: 700,
                                textTransform: "none",
                                "&:hover": { background: uploadResult.errors > 0 ? "rgba(239, 68, 68, 0.05)" : "rgba(34, 197, 94, 0.05)" }
                            }}
                        >
                            Dismiss
                        </Button>
                    </Box>
                </Collapse>
            )}

            {/* Student Upload Section */}
            <Box sx={{ mb: 2 }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: 2,
                        borderRadius: "20px",
                        background: "rgba(255, 255, 255, 0.35)",
                        backdropFilter: "blur(10px) saturate(150%)",
                        border: "1px solid rgba(255, 255, 255, 0.4)",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
                        width: '100%'
                    }}
                >
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'flex-start' }, gap: 1, mb: 2 }}>
                        <Box>
                            <Typography variant="h6" fontWeight={800} color="#311b92">Student Data Upload</Typography>
                            <Typography variant="body2" color="textSecondary" fontWeight={500}>
                                Upload bulk or individual data
                            </Typography>
                        </Box>
                        <Button
                            variant="outlined"
                            startIcon={<DownloadIcon />}
                            onClick={handleTemplateDownload}
                            sx={{
                                borderRadius: "12px",
                                textTransform: "none",
                                fontWeight: 600,
                                borderColor: "rgba(11, 82, 153, 0.3)",
                                color: "#0b5299",
                                "&:hover": { background: "rgba(11, 82, 153, 0.05)", borderColor: "#0b5299" }
                            }}
                        >
                            Download Template
                        </Button>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<UploadFile />}
                            onClick={() => { setIsUploadOptionsOpen(!isUploadOptionsOpen); setIsUpdateOptionsOpen(false); }}
                            sx={{
                                flex: 1,
                                borderRadius: "12px",
                                textTransform: "none",
                                py: 1.5,
                                fontWeight: 700,
                                background: "linear-gradient(135deg, #0b5299, #1e88e5)",
                                boxShadow: "0 4px 12px rgba(11, 82, 153, 0.2)",
                                transition: '0.3s',
                                '&:hover': {
                                    background: "linear-gradient(135deg, #09437d, #1976d2)",
                                    boxShadow: "0 6px 16px rgba(11, 82, 153, 0.3)",
                                }
                            }}
                        >
                            Bulk Data Options
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={updatingBulk ? <CircularProgress size={20} color="inherit" /> : <SyncIcon />}
                            onClick={() => { setIsUpdateOptionsOpen(!isUpdateOptionsOpen); setIsUploadOptionsOpen(false); }}
                            disabled={updatingBulk}
                            sx={{
                                flex: 1,
                                borderRadius: "12px",
                                textTransform: "none",
                                py: 1.5,
                                fontWeight: 700,
                                background: "rgba(15, 92, 187, 0.9)",
                                backdropFilter: "blur(10px) saturate(150%)",
                                border: "1px solid rgba(219, 219, 219, 0.9)",
                                transition: '0.3s',
                                '&:hover': {
                                    background: "rgba(54, 138, 241, 0.9)",
                                }
                            }}
                        >
                            {updatingBulk ? "Updating..." : "Update"}
                        </Button>
                    </Box>

                    <Collapse in={isUploadOptionsOpen}>
                        <Box sx={{
                            mt: 2,
                            p: 2,
                            borderRadius: "16px",
                            background: "rgba(255, 255, 255, 0.5)",
                            border: "1px solid rgba(11, 82, 153, 0.1)",
                            position: "relative"
                        }}>
                            <IconButton
                                size="small"
                                onClick={() => setIsUploadOptionsOpen(false)}
                                sx={{ position: "absolute", right: 8, top: 8 }}
                            >
                                <CloseIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                            <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, mb: 1, display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                Create Options
                            </Typography>
                            <Box sx={{ display: "flex", gap: 1.5 }}>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<UploadIcon />}
                                    onClick={handleUploadClick}
                                    sx={{
                                        borderRadius: "10px",
                                        textTransform: "none",
                                        fontWeight: 600,
                                        borderColor: "rgba(11, 82, 153, 0.2)",
                                        background: "rgba(255,255,255,0.8)",
                                        "&:hover": { background: "#fff", borderColor: "#0b5299" }
                                    }}
                                >
                                    Bulk Upload
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<PersonAddIcon />}
                                    onClick={() => setIsAddModalOpen(true)}
                                    sx={{
                                        borderRadius: "10px",
                                        textTransform: "none",
                                        fontWeight: 600,
                                        borderColor: "rgba(11, 82, 153, 0.2)",
                                        background: "rgba(255,255,255,0.8)",
                                        "&:hover": { background: "#fff", borderColor: "#0b5299" }
                                    }}
                                >
                                    Create Individual
                                </Button>
                            </Box>
                        </Box>
                    </Collapse>
                    <Collapse in={isUpdateOptionsOpen}>
                        <Box sx={{
                            mt: 2,
                            p: 2,
                            borderRadius: "16px",
                            background: "rgba(255, 255, 255, 0.5)",
                            border: "1px solid rgba(11, 82, 153, 0.1)",
                            position: "relative"
                        }}>
                            <IconButton
                                size="small"
                                onClick={() => setIsUpdateOptionsOpen(false)}
                                sx={{ position: "absolute", right: 8, top: 8 }}
                            >
                                <CloseIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                            <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, mb: 1, display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                Update Options
                            </Typography>
                            <Box sx={{ display: "flex", gap: 1.5 }}>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<SyncIcon />}
                                    onClick={handleBulkSyncAll}
                                    sx={{
                                        borderRadius: "10px",
                                        textTransform: "none",
                                        fontWeight: 600,
                                        borderColor: "rgba(11, 82, 153, 0.2)",
                                        background: "rgba(255,255,255,0.8)",
                                        "&:hover": { background: "#fff", borderColor: "#0b5299" }
                                    }}
                                >
                                    Bulk Update
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<SyncIcon />}
                                    onClick={() => setIsUpdateModalOpen(true)}
                                    sx={{
                                        borderRadius: "10px",
                                        textTransform: "none",
                                        fontWeight: 600,
                                        borderColor: "rgba(11, 82, 153, 0.2)",
                                        background: "rgba(255,255,255,0.8)",
                                        "&:hover": { background: "#fff", borderColor: "#0b5299" }
                                    }}
                                >
                                    Individual Update
                                </Button>
                            </Box>
                        </Box>
                    </Collapse>
                </Paper>
            </Box>


            {students.length > 0 && (
                <Box
                    sx={{
                        p: 2,
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
                        title={
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                Student Unassigned Details ({students.length})
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

                    <Box sx={{ mt: 1, flex: 1 }}>
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
                                mt: 2,
                                pt: 1,
                                borderTop: "1px solid rgba(0,0,0,0.05)",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                            }}
                        >
                            <Box sx={{ color: "#64748b", fontSize: "0.875rem", fontWeight: 500 }}>
                                {selectedIds.length} student{selectedIds.length > 1 ? 's' : ''} selected
                            </Box>
                            <Box sx={{ display: "flex", gap: 1 }}>
                                <ActionButton
                                    onClick={handleSyncStudents}
                                    disabled={syncing}
                                    sx={{
                                        px: 2,
                                        background: "linear-gradient(135deg, #43a047, #66bb6a)",
                                        "&:hover": { background: "linear-gradient(135deg, #388e3c, #4caf50)" }
                                    }}
                                >
                                    {syncing ? <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} /> : <SyncIcon sx={{ mr: 1 }} />}
                                    Sync / Update
                                </ActionButton>

                                {!isProceeding && (
                                    <ActionButton
                                        onClick={() => setIsProceeding(true)}
                                        sx={{
                                            px: 3,
                                            background: "linear-gradient(135deg, #0b5299, #1e88e5)",
                                            "&:hover": { background: "linear-gradient(135deg, #09437d, #1976d2)" }
                                        }}
                                    >
                                        Proceed
                                    </ActionButton>
                                )}
                            </Box>
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
            )}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: '100%', borderRadius: '12px', fontWeight: 600 }}
                    variant="filled"
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Studentuploads;