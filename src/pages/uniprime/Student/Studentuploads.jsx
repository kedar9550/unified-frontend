import React, { useRef, useState, useEffect } from "react";
import { 
    Box, 
    Avatar, 
    Checkbox, 
    MenuItem, 
    Select, 
    FormControl, 
    InputLabel, 
    Collapse, 
    CircularProgress, 
    Typography, 
    Tooltip, 
    IconButton, 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    TextField, 
    Button, 
    Grid, 
    Paper, 
    Snackbar, 
    Alert 
} from "@mui/material";
import { 
    FileUpload as UploadIcon, 
    CheckCircle as ConfirmIcon, 
    Download as DownloadIcon, 
    Delete as DeleteIcon, 
    PersonAdd as PersonAddIcon, 
    Sync as SyncIcon, 
    UploadFile, 
    PersonAdd, 
    Close as CloseIcon,
    Description as ExcelIcon,
    CloudUpload as CloudUploadIcon,
    InfoOutlined as InfoIcon,
    ArrowForward as ArrowForwardIcon
} from "@mui/icons-material";
import PageHeader from "../../../components/common/PageHeader";
import SectionHeader from "../../../components/common/SectionHeader";
import ActionButton from "../../../components/common/ActionButton";
import DataTable from "../../../components/data/DataTable";
import API from "../../../api/axios";
import HelpOutlinedIcon from "@mui/icons-material/HelpOutlined";

const Studentuploads = () => {
    const fileInputRef = useRef(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [isProceeding, setIsProceeding] = useState(false);
    const [allDepartments, setAllDepartments] = useState([]);
    const [selectedDept, setSelectedDept] = useState("");
    const [loadingDepts, setLoadingDepts] = useState(false);
    const [students, setStudents] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [updatingBulk, setUpdatingBulk] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [addRollNo, setAddRollNo] = useState("");
    const [addDept, setAddDept] = useState("");
    const [addingStudent, setAddingStudent] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [allPrograms, setAllPrograms] = useState([]);
    const [selectedBulkProgram, setSelectedBulkProgram] = useState("");
    const [isBulkUpdateModalOpen, setIsBulkUpdateModalOpen] = useState(false);
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

        const fetchPrograms = async () => {
            try {
                const res = await API.get("/api/student-data/filter-options");
                if (res.data.success) {
                    setAllPrograms(res.data.data?.programs || []);
                }
            } catch (error) {
                console.error("Failed to fetch programs", error);
            }
        };

        fetchDepartments();
        fetchPrograms();
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
            const endpoint = "/api/student-data/upload";
            const res = await API.post(endpoint, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            if (res.data.success) {
                setUploadResult(res.data.summary);
                setSnackbar({
                    open: true,
                    message: res.data.message || "Data uploaded successfully",
                    severity: "success"
                });
                fetchUnassignedStudents();
            }
        } catch (error) {
            console.error("Operation failed", error);
            setSnackbar({
                open: true,
                message: error.response?.data?.message || "Operation failed",
                severity: "error"
            });
        } finally {
            setUploading(false);
            e.target.value = null; // Reset input
        }
    };

    const handleBulkSyncAll = async (program = "") => {
        setUpdatingBulk(true);
        try {
            const res = await API.post("/api/student-data/sync", { program });
            if (res.data.success) {
                setUploadResult(res.data.summary);
                setSnackbar({
                    open: true,
                    message: res.data.message,
                    severity: res.data.updated ? "success" : "info"
                });
                fetchUnassignedStudents();
                setIsBulkUpdateModalOpen(false);
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
            setSnackbar({
                open: true,
                message: error.response?.data?.message || "Sync failed",
                severity: "error"
            });
        } finally {
            setSyncing(false);
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
            setSnackbar({
                open: true,
                message: error.response?.data?.message || "Failed to add student",
                severity: "error"
            });
        } finally {
            setAddingStudent(false);
        }
    };

    const handleConfirmAssignment = async () => {
        if (!selectedDept || selectedIds.length === 0) return;
        try {
            const res = await API.post("/api/student-data/assign", {
                studentIds: selectedIds,
                deptId: selectedDept,
            });
            if (res.data.success) {
                setIsProceeding(false);
                setSelectedIds([]);
                setSelectedDept("");
                fetchUnassignedStudents();
                setSnackbar({
                    open: true,
                    message: "Students assigned successfully",
                    severity: "success"
                });
            }
        } catch (error) {
            console.error("Assignment failed", error);
            setSnackbar({
                open: true,
                message: "Assignment failed",
                severity: "error"
            });
        }
    };

    const handleTemplateDownload = () => {
        const headers = ["Roll Number", "Department"];
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
        link.setAttribute("download", `unassigned_students_${new Date().toLocaleDateString("en-IN").replace(/\//g, "-")}.csv`);
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
        s.academicInfo?.department?.name || s.academicInfo?.department || "N/A",
        s.contactInfo?.emailId,
        s.contactInfo?.mobileNumber,
        s.academicInfo?.branch,
        s.academicInfo?.programName
    ]);

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, background: "#f8fafc", minHeight: "100vh" }}>
            <input type="file" ref={fileInputRef} style={{ display: "none" }} accept=".csv,.xlsx" onChange={handleFileChange} />

            <PageHeader
                title="Student Management"
                subtitle="Upload and manage student records"
                breadcrumbs={["Home", "Student Management", "Student Upload"]}
                action={null}
            />

            {/* Quick Action Cards */}
            <Grid container spacing={3} sx={{ mb: 4, mt: 2 }}>
                <Grid item xs={4}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: "24px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 3, height: "100%", transition: "0.3s", "&:hover": { boxShadow: "0 10px 30px rgba(0,0,0,0.05)" } }}>
                        <Box sx={{ p: 2, borderRadius: "20px", background: "#f0fdf4" }}>
                            <ExcelIcon sx={{ color: "#22c55e", fontSize: 32 }} />
                        </Box>
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1e293b", fontSize: { xs: "0.8rem", md: "1rem" } }}>Excel Template</Typography>
                            <Typography variant="body2" sx={{ color: "#64748b", mb: 1, display: { xs: "none", md: "block" } }}>Download template and fill student data.</Typography>
                            <Button 
                                startIcon={<DownloadIcon />} 
                                onClick={handleTemplateDownload}
                                sx={{ textTransform: "none", fontWeight: 700, color: "var(--color-primary)", p: 0, minWidth: 0, fontSize: { xs: "0.7rem", md: "0.875rem" }, "&:hover": { background: "transparent", opacity: 0.8 } }}
                            >
                                Download
                            </Button>
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={4}>
                    <Paper 
                        elevation={0} 
                        onClick={handleUploadClick}
                        sx={{ p: 3, borderRadius: "24px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 3, height: "100%", transition: "0.3s", cursor: "pointer", "&:hover": { boxShadow: "0 10px 30px rgba(0,0,0,0.05)", borderColor: "#3b82f6" } }}
                    >
                        <Box sx={{ p: 2, borderRadius: "20px", background: "#eff6ff" }}>
                            <UploadIcon sx={{ color: "#3b82f6", fontSize: 32 }} />
                        </Box>
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1e293b", fontSize: { xs: "0.8rem", md: "1rem" } }}>Bulk Upload</Typography>
                            <Typography variant="body2" sx={{ color: "#64748b", display: { xs: "none", md: "block" } }}>Click to upload and add students.</Typography>
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={4}>
                    <Paper 
                        elevation={0} 
                        onClick={() => setIsBulkUpdateModalOpen(true)}
                        sx={{ p: 3, borderRadius: "24px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 3, height: "100%", transition: "0.3s", cursor: "pointer", "&:hover": { boxShadow: "0 10px 30px rgba(0,0,0,0.05)", borderColor: "#8b5cf6" } }}
                    >
                        <Box sx={{ p: 2, borderRadius: "20px", background: "#f5f3ff" }}>
                            <SyncIcon sx={{ color: "#8b5cf6", fontSize: 32 }} />
                        </Box>
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1e293b", fontSize: { xs: "0.8rem", md: "1rem" } }}>Update Data</Typography>
                            <Typography variant="body2" sx={{ color: "#64748b", display: { xs: "none", md: "block" } }}>Click to sync existing records.</Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Main Upload Panels */}
            <Box sx={{ display: "flex", gap: 4, mb: 4, flexDirection: { xs: "column", md: "row" } }}>
                <Box sx={{ flex: 1, display: "flex" }}>
                    <Paper elevation={0} sx={{ flex: 1, p: 4, borderRadius: "24px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", minHeight: "500px" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                            <Box sx={{ p: 1, borderRadius: "12px", background: "#f0fdf4", color: "#22c55e" }}>
                                <UploadFile />
                            </Box>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 800, color: "#22c55e" }}>Add New Students</Typography>
                                <Typography variant="body2" sx={{ color: "#64748b" }}>Bulk upload new student records.</Typography>
                            </Box>
                        </Box>

                        <Box sx={{ mb: 4 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: "#1e293b" }}>Steps:</Typography>
                            {[
                                "Download the template",
                                "Fill in Roll Number and Department",
                                "Upload the file and we'll fetch student data"
                            ].map((step, idx) => (
                                <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1.5 }}>
                                    <Box sx={{ width: 24, height: 24, borderRadius: "50%", background: "#22c55e", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 800 }}>
                                        {idx + 1}
                                    </Box>
                                    <Typography variant="body2" sx={{ color: "#475569", fontWeight: 500 }}>{step}</Typography>
                                </Box>
                            ))}
                        </Box>

                        <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: "#1e293b" }}>Upload Excel File</Typography>
                            <Box 
                                onClick={handleUploadClick}
                                sx={{ 
                                    flex: 1,
                                    border: "2px dashed #22c55e", 
                                    borderRadius: "20px", 
                                    p: 4, 
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    textAlign: "center", 
                                    cursor: "pointer",
                                    transition: "0.3s",
                                    background: uploading ? "rgba(34, 197, 94, 0.05)" : "transparent",
                                    "&:hover": { background: "rgba(34, 197, 94, 0.05)" }
                                }}
                            >
                                <CloudUploadIcon sx={{ color: "#22c55e", fontSize: 48, mb: 1 }} />
                                <Typography variant="body2" sx={{ color: "#64748b" }}>Drop your file here to upload</Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: "#94a3b8", mt: 1, display: "flex", alignItems: "center", gap: 0.5 }}>
                                Only .xlsx and .csv files are allowed <InfoIcon sx={{ fontSize: 14 }} />
                            </Typography>
                        </Box>

                        <Box sx={{ mt: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Button 
                                onClick={() => setIsAddModalOpen(true)}
                                startIcon={<PersonAddIcon />}
                                sx={{ textTransform: "none", fontWeight: 700, color: "#22c55e", borderRadius: "10px", "&:hover": { background: "rgba(34, 197, 94, 0.05)" } }}
                            >
                                Individual Add
                            </Button>
                            {uploading && <CircularProgress size={24} sx={{ color: "#22c55e" }} />}
                        </Box>
                    </Paper>
                </Box>

                <Box sx={{ flex: 1, display: "flex" }}>
                    <Paper elevation={0} sx={{ flex: 1, p: 4, borderRadius: "24px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", minHeight: "500px" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                            <Box sx={{ p: 1, borderRadius: "12px", background: "#f5f3ff", color: "#8b5cf6" }}>
                                <SyncIcon />
                            </Box>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 800, color: "#8b5cf6" }}>Update Existing Students</Typography>
                                <Typography variant="body2" sx={{ color: "#64748b" }}>Sync and update student records.</Typography>
                            </Box>
                        </Box>

                        <Box sx={{ mb: 4 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: "#1e293b" }}>Steps:</Typography>
                            {[
                                "Select the program to update (optional)",
                                "The system will fetch latest data",
                                "Sync to refresh student information"
                            ].map((step, idx) => (
                                <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1.5 }}>
                                    <Box sx={{ width: 24, height: 24, borderRadius: "50%", background: "#8b5cf6", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 800 }}>
                                        {idx + 1}
                                    </Box>
                                    <Typography variant="body2" sx={{ color: "#475569", fontWeight: 500 }}>{step}</Typography>
                                </Box>
                            ))}
                        </Box>

                        <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: "#1e293b" }}>Select Program to Sync</Typography>
                            <FormControl fullWidth variant="outlined" sx={{ mb: 3 }}>
                                <InputLabel>Select Program</InputLabel>
                                <Select
                                    value={selectedBulkProgram}
                                    onChange={(e) => setSelectedBulkProgram(e.target.value)}
                                    label="Select Program"
                                    disabled={updatingBulk}
                                    sx={{ borderRadius: "15px" }}
                                >
                                    <MenuItem value=""><em>All Programs</em></MenuItem>
                                    {allPrograms.map((p, i) => (
                                        <MenuItem key={i} value={p}>{p}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            
                            <Box 
                                onClick={() => !updatingBulk && handleBulkSyncAll(selectedBulkProgram)}
                                sx={{ 
                                    flex: 1,
                                    border: "2px dashed #8b5cf6", 
                                    borderRadius: "20px", 
                                    p: 4, 
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    textAlign: "center", 
                                    cursor: updatingBulk ? "default" : "pointer",
                                    transition: "0.3s",
                                    background: updatingBulk ? "rgba(139, 92, 246, 0.05)" : "transparent",
                                    "&:hover": { background: "rgba(139, 92, 246, 0.05)" }
                                }}
                            >
                                <SyncIcon sx={{ color: "#8b5cf6", fontSize: 48, mb: 1, animation: updatingBulk ? "spin 2s linear infinite" : "none" }} />
                                <Typography variant="body2" sx={{ color: "#64748b" }}>Click here to start bulk sync</Typography>
                            </Box>
                        </Box>

                        <style>{`
                            @keyframes spin {
                                from { transform: rotate(0deg); }
                                to { transform: rotate(360deg); }
                            }
                        `}</style>

                        <Box sx={{ mt: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Button 
                                onClick={() => setIsUpdateModalOpen(true)}
                                startIcon={<SyncIcon />}
                                sx={{ textTransform: "none", fontWeight: 700, color: "#8b5cf6", borderRadius: "10px", "&:hover": { background: "rgba(139, 92, 246, 0.05)" } }}
                            >
                                Individual Update
                            </Button>
                            {updatingBulk && <CircularProgress size={24} sx={{ color: "#8b5cf6" }} />}
                        </Box>
                    </Paper>
                </Box>
            </Box>
            

            {/* Results Display */}
            {uploadResult && (
                <Box sx={{ mt: 4, mb: 4 }}>
                    <Alert 
                        severity={uploadResult.errors > 0 ? "warning" : "success"} 
                        sx={{ borderRadius: "16px", fontWeight: 600 }}
                        action={
                            <IconButton size="small" onClick={() => setUploadResult(null)}>
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        }
                    >
                        {uploadResult.errors > 0 ? `Processed with ${uploadResult.errors} errors.` : "All records processed successfully!"}
                        <Box sx={{ display: "flex", gap: 3, mt: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700 }}>Total: {uploadResult.total || (uploadResult.success + uploadResult.failed)}</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: "green" }}>Success: {uploadResult.success}</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: "red" }}>Errors: {uploadResult.errors}</Typography>
                        </Box>
                    </Alert>
                </Box>
            )}

            {/* Table Section */}
            {students.length > 0 && (
                <Box sx={{ mt: 6 }}>
                    <SectionHeader 
                        title={
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                <Typography variant="h5" sx={{ fontWeight: 800 }}>Unassigned Students ({students.length})</Typography>
                                {selectedIds.length > 0 && (
                                    <Box sx={{ px: 2, py: 0.5, borderRadius: "50px", background: "var(--bg-accent-1)", color: "var(--color-primary)", fontSize: "0.875rem", fontWeight: 700 }}>
                                        {selectedIds.length} Selected
                                    </Box>
                                )}
                            </Box>
                        }
                        action={
                            <Box sx={{ display: "flex", gap: 2 }}>
                                <Button startIcon={<DownloadIcon />} onClick={handleExportClick} variant="outlined" sx={{ borderRadius: "50px", textTransform: "none", fontWeight: 700 }}>
                                    Export List
                                </Button>
                                <Button 
                                    startIcon={<PersonAddIcon />} 
                                    onClick={() => setIsAddModalOpen(true)} 
                                    variant="contained" 
                                    sx={{ borderRadius: "50px", textTransform: "none", fontWeight: 700, background: "var(--gradient-primary)" }}
                                >
                                    Add Individual
                                </Button>
                                <Button 
                                    startIcon={<SyncIcon />} 
                                    onClick={() => setIsBulkUpdateModalOpen(true)} 
                                    variant="outlined" 
                                    sx={{ borderRadius: "50px", textTransform: "none", fontWeight: 700 }}
                                >
                                    Bulk Sync
                                </Button>
                            </Box>
                        }
                    />
                    <Paper elevation={0} sx={{ mt: 3, borderRadius: "24px", border: "1px solid #e2e8f0", overflow: "hidden", position: "relative" }}>
                        {loadingStudents ? (
                            <Box sx={{ display: "flex", justifyContent: "center", p: 8 }}><CircularProgress /></Box>
                        ) : (
                            <DataTable columns={columns} rows={formattedRows} />
                        )}
                        
                        {selectedIds.length > 0 && (
                            <Box sx={{ p: 3, borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                                <Box sx={{ display: "flex", gap: 2 }}>
                                    <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600 }}>
                                        {selectedIds.length} students selected.
                                    </Typography>
                                    <Button size="small" startIcon={<SyncIcon />} onClick={handleSyncStudents} disabled={syncing} sx={{ textTransform: "none", fontWeight: 700 }}>
                                        {syncing ? "Syncing..." : "Sync Selected"}
                                    </Button>
                                </Box>
                                <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                                    <FormControl size="small" sx={{ minWidth: 200 }}>
                                        <InputLabel>Select Department</InputLabel>
                                        <Select
                                            value={selectedDept}
                                            onChange={(e) => setSelectedDept(e.target.value)}
                                            label="Select Department"
                                        >
                                            {allDepartments.map((dept) => (
                                                <MenuItem key={dept._id} value={dept._id}>{dept.name}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <Button 
                                        variant="contained" 
                                        disabled={!selectedDept}
                                        onClick={handleConfirmAssignment}
                                        sx={{ borderRadius: "50px", textTransform: "none", fontWeight: 700, background: "#22c55e", "&:hover": { background: "#16a34a" } }}
                                    >
                                        Assign Students
                                    </Button>
                                </Box>
                            </Box>
                        )}
                    </Paper>
                </Box>
            )}

            {/* Individual Add/Update Modal */}
            <Dialog 
                open={isAddModalOpen || isUpdateModalOpen} 
                onClose={() => !addingStudent && (setIsAddModalOpen(false), setIsUpdateModalOpen(false))}
                PaperProps={{ sx: { borderRadius: "24px", p: 1 } }}
            >
                <DialogTitle sx={{ fontWeight: 800 }}>{isUpdateModalOpen ? "Update Individual Student" : "Add Individual Student"}</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: "#64748b", mb: 3 }}>
                        Enter the Roll Number to fetch/update details from ECAP.
                    </Typography>
                    <TextField 
                        autoFocus 
                        margin="dense" 
                        label="Roll Number" 
                        fullWidth 
                        value={addRollNo} 
                        onChange={(e) => setAddRollNo(e.target.value)}
                        variant="outlined"
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                    />
                    {!isUpdateModalOpen && (
                        <FormControl fullWidth sx={{ mt: 2 }}>
                            <InputLabel>Department (Optional)</InputLabel>
                            <Select
                                value={addDept}
                                onChange={(e) => setAddDept(e.target.value)}
                                label="Department (Optional)"
                                sx={{ borderRadius: "12px" }}
                            >
                                <MenuItem value=""><em>None</em></MenuItem>
                                {allDepartments.map((dept) => (
                                    <MenuItem key={dept._id} value={dept._id}>{dept.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={() => (setIsAddModalOpen(false), setIsUpdateModalOpen(false))} sx={{ fontWeight: 700, textTransform: "none" }}>Cancel</Button>
                    <Button 
                        onClick={handleAddStudent} 
                        variant="contained" 
                        disabled={addingStudent || !addRollNo}
                        sx={{ borderRadius: "50px", px: 4, fontWeight: 700, textTransform: "none", background: isUpdateModalOpen ? "#8b5cf6" : "#22c55e" }}
                    >
                        {addingStudent ? <CircularProgress size={20} color="inherit" /> : (isUpdateModalOpen ? "Update Student" : "Add Student")}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={6000} 
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: "100%", borderRadius: "16px", fontWeight: 600 }} variant="filled">
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Studentuploads;