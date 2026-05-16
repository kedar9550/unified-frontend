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
} from "@mui/material";
import { toast } from "sonner";
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
                toast.success(res.data.message || "Data uploaded successfully");
                fetchUnassignedStudents();
            }
        } catch (error) {
            console.error("Operation failed", error);
            toast.error(error.response?.data?.message || "Operation failed");
        } finally {
            setUploading(false);
            e.target.value = null; // Reset input
        }
    };

    const handleBulkSyncAll = async (program = "") => {
        // Validation: If no program is selected in the main panel
        if (!program && !isBulkUpdateModalOpen && !updatingBulk) {
            // This might be the top card. Let's allow the top card to sync all.
            // But if the user strictly wants "Select Program", I'll check where it's called from.
        }

        setUpdatingBulk(true);
        try {
            const res = await API.post("/api/student-data/sync", { program });
            if (res.data.success) {
                setUploadResult(res.data.summary);

                let toastMsg = res.data.message;
                let severity = "success";

                if (res.data.summary.total === 0) {
                    toastMsg = "No data found for this program";
                    severity = "info";
                } else if (res.data.updated) {
                    toastMsg = "Data is up to date";
                    severity = "success";
                }

                toast[severity](toastMsg);
                fetchUnassignedStudents();
                setIsBulkUpdateModalOpen(false);
            }
        } catch (error) {
            console.error("Bulk sync failed", error);
            toast.error(error.response?.data?.message || "Sync failed");
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
                toast[res.data.updated ? "success" : "info"](res.data.message);
                fetchUnassignedStudents();
                setSelectedIds([]);
            }
        } catch (error) {
            console.error("Sync failed", error);
            toast.error(error.response?.data?.message || "Sync failed");
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
                toast[res.data.updated ? "success" : "info"](res.data.message);
                fetchUnassignedStudents();
            }
        } catch (error) {
            console.error("Add student failed", error);
            toast.error(error.response?.data?.message || "Failed to add student");
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
                toast.success("Students assigned successfully");
            }
        } catch (error) {
            console.error("Assignment failed", error);
            toast.error("Assignment failed");
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
        <Box sx={{ minHeight: "100vh" }}>
            <input type="file" ref={fileInputRef} style={{ display: "none" }} accept=".csv,.xlsx" onChange={handleFileChange} />

            <PageHeader
                title="Student Management"
                subtitle="Upload and manage student records"
                breadcrumbs={["Home", "Student Management", "Student Upload"]}
                action={null}
            />

            {/* Quick Action Cards (Box System) */}
            <Box sx={{ display: "flex", gap: 3, mb: 4, mt: 2, flexWrap: "wrap" }}>
                <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 calc(33.333% - 20px)" }, minWidth: 0 }}>
                    <Paper elevation={0} sx={{ p: 2, borderRadius: "24px", border: "1px solid var(--border-color)", background: "var(--bg-paper)", display: "flex", alignItems: "center", gap: 2, height: "100%", transition: "0.3s", "&:hover": { boxShadow: "var(--shadow-premium)", borderColor: "var(--color-primary)" } }}>
                        <Box sx={{ width: 48, height: 48, flexShrink: 0, borderRadius: "16px", background: "var(--bg-accent-2)", color: "#10B981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <ExcelIcon sx={{ fontSize: 24 }} />
                        </Box>
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "var(--text-primary)", fontSize: { xs: "0.85rem", md: "0.95rem" }, lineHeight: 1.2 }}>Excel Template</Typography>
                            <Typography variant="body2" sx={{ color: "var(--text-secondary)", mb: 0.5, display: { xs: "none", md: "block" }, fontSize: "0.8rem" }}>Download template and fill data.</Typography>
                            <Button
                                startIcon={<DownloadIcon sx={{ fontSize: "1rem !important" }} />}
                                onClick={handleTemplateDownload}
                                sx={{ textTransform: "none", fontWeight: 700, color: "var(--color-primary)", p: 0, minWidth: 0, fontSize: "0.8rem", "&:hover": { background: "transparent", opacity: 0.8 } }}
                            >
                                Download Template
                            </Button>
                        </Box>
                    </Paper>
                </Box>
                <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 calc(33.333% - 20px)" }, minWidth: 0 }}>
                    <Paper
                        elevation={0}
                        onClick={handleUploadClick}
                        sx={{ p: 2, borderRadius: "24px", border: "1px solid var(--border-color)", background: "var(--bg-paper)", display: "flex", alignItems: "center", gap: 2, height: "100%", transition: "0.3s", cursor: "pointer", "&:hover": { boxShadow: "var(--shadow-premium)", borderColor: "#3b82f6" } }}
                    >
                        <Box sx={{ width: 48, height: 48, flexShrink: 0, borderRadius: "16px", background: "var(--bg-accent-4)", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <UploadIcon sx={{ fontSize: 24 }} />
                        </Box>
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "var(--text-primary)", fontSize: { xs: "0.85rem", md: "0.95rem" }, lineHeight: 1.2 }}>Bulk Upload</Typography>
                            <Typography variant="body2" sx={{ color: "var(--text-secondary)", display: { xs: "none", md: "block" }, fontSize: "0.8rem" }}>Click to upload and add students.</Typography>
                        </Box>
                    </Paper>
                </Box>
                <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 calc(33.333% - 20px)" }, minWidth: 0 }}>
                    <Paper
                        elevation={0}
                        onClick={() => !updatingBulk && handleBulkSyncAll("")}
                        sx={{
                            p: 2,
                            borderRadius: "24px",
                            border: "1px solid var(--border-color)",
                            background: "var(--bg-paper)",
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            height: "100%",
                            transition: "0.3s",
                            cursor: updatingBulk ? "default" : "pointer",
                            opacity: updatingBulk ? 0.7 : 1,
                            "&:hover": {
                                boxShadow: updatingBulk ? "none" : "var(--shadow-premium)",
                                borderColor: updatingBulk ? "var(--border-color)" : "#8b5cf6"
                            }
                        }}
                    >
                        <Box sx={{
                            width: 48,
                            height: 48,
                            flexShrink: 0,
                            borderRadius: "16px",
                            background: "var(--bg-accent-3)",
                            color: "#8b5cf6",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}>
                            <SyncIcon sx={{
                                fontSize: 24,
                                animation: updatingBulk ? "spin 2s linear infinite" : "none"
                            }} />
                        </Box>
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "var(--text-primary)", fontSize: { xs: "0.85rem", md: "0.95rem" }, lineHeight: 1.2 }}>Update Data</Typography>
                            <Typography variant="body2" sx={{ color: "var(--text-secondary)", display: { xs: "none", md: "block" }, fontSize: "0.8rem" }}>
                                {updatingBulk ? "Syncing all records..." : "Click to sync overall existing records."}
                            </Typography>
                        </Box>
                    </Paper>
                </Box>
            </Box>

            {/* Main Upload Panels */}
            <Box sx={{ display: "flex", gap: 4, mb: 4, flexDirection: { xs: "column", md: "row" } }}>
                <Box sx={{ flex: 1, display: "flex" }}>
                    <Paper elevation={0} sx={{ flex: 1, p: 4, borderRadius: "24px", border: "1px solid var(--border-color)", background: "var(--bg-paper)", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", minHeight: "500px" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                            <Box sx={{ width: 48, height: 48, flexShrink: 0, borderRadius: "14px", background: "var(--bg-accent-2)", color: "#10B981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <UploadFile sx={{ fontSize: 24 }} />
                            </Box>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 800, color: "#10B981" }}>Add New Students</Typography>
                                <Typography variant="body2" sx={{ color: "var(--text-secondary)" }}>Bulk upload new student records.</Typography>
                            </Box>
                        </Box>

                        <Box sx={{ mb: 4 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: "var(--text-primary)" }}>Steps:</Typography>
                            {[
                                "Download the template",
                                "Fill in Roll Number and Department",
                                "Upload the file and we'll fetch student data"
                            ].map((step, idx) => (
                                <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1.5 }}>
                                    <Box sx={{ width: 26, height: 26, borderRadius: "50%", background: "#10B981", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 800 }}>
                                        {idx + 1}
                                    </Box>
                                    <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 500 }}>{step}</Typography>
                                </Box>
                            ))}
                        </Box>

                        <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: "var(--text-primary)" }}>Upload Excel File</Typography>
                            <Box
                                onClick={handleUploadClick}
                                sx={{
                                    flex: 1,
                                    border: "2px dashed #10B981",
                                    borderRadius: "20px",
                                    p: 4,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    textAlign: "center",
                                    cursor: "pointer",
                                    transition: "0.3s",
                                    background: uploading ? "rgba(16, 185, 129, 0.08)" : "transparent",
                                    "&:hover": { background: "rgba(16, 185, 129, 0.08)", transform: "translateY(-4px)" }
                                }}
                            >
                                <CloudUploadIcon sx={{ color: "#10B981", fontSize: 48, mb: 1 }} />
                                <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 600 }}>Drop your file here to upload</Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: "var(--text-secondary)", mt: 1.5, display: "flex", alignItems: "center", gap: 0.5, opacity: 0.8 }}>
                                Only .csv and .xlsx files are allowed <InfoIcon sx={{ fontSize: 14 }} />
                            </Typography>
                        </Box>

                        <Box sx={{ mt: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                startIcon={<PersonAddIcon />}
                                sx={{ textTransform: "none", fontWeight: 700, color: "#10B981", borderRadius: "10px", "&:hover": { background: "var(--bg-accent-2)" } }}
                            >
                                Individual Add
                            </Button>
                            {uploading && <CircularProgress size={24} sx={{ color: "#10B981" }} />}
                        </Box>
                    </Paper>
                </Box>

                <Box sx={{ flex: 1, display: "flex" }}>
                    <Paper elevation={0} sx={{ flex: 1, p: 4, borderRadius: "24px", border: "1px solid var(--border-color)", background: "var(--bg-paper)", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", minHeight: "500px" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                            <Box sx={{ width: 48, height: 48, flexShrink: 0, borderRadius: "14px", background: "var(--bg-accent-3)", color: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <SyncIcon sx={{ fontSize: 24 }} />
                            </Box>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 800, color: "#8b5cf6" }}>Update Existing Students</Typography>
                                <Typography variant="body2" sx={{ color: "var(--text-secondary)" }}>Sync and update student records.</Typography>
                            </Box>
                        </Box>

                        <Box sx={{ mb: 4 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: "var(--text-primary)" }}>Steps:</Typography>
                            {[
                                "Select the program to update (optional)",
                                "The system will fetch latest data",
                                "Sync to refresh student information"
                            ].map((step, idx) => (
                                <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1.5 }}>
                                    <Box sx={{ width: 26, height: 26, borderRadius: "50%", background: "#8b5cf6", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 800 }}>
                                        {idx + 1}
                                    </Box>
                                    <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 500 }}>{step}</Typography>
                                </Box>
                            ))}
                        </Box>

                        <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: "var(--text-primary)" }}>Select Program to Sync</Typography>
                            <FormControl fullWidth variant="outlined" sx={{ mb: 3 }}>
                                <InputLabel sx={{ color: "var(--text-secondary)", "&.Mui-focused": { color: "var(--color-primary)" } }}>Select Program</InputLabel>
                                <Select
                                    value={selectedBulkProgram}
                                    onChange={(e) => setSelectedBulkProgram(e.target.value)}
                                    label="Select Program"
                                    disabled={updatingBulk}
                                    sx={{ 
                                        borderRadius: "15px", 
                                        color: "var(--text-primary)",
                                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "var(--border-color)" },
                                        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "var(--text-primary)" },
                                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "var(--color-primary)" },
                                        "& .MuiSvgIcon-root": { color: "var(--text-secondary)" }
                                    }}
                                >
                                    <MenuItem value=""><em>All Programs</em></MenuItem>
                                    {allPrograms.map((p, i) => (
                                        <MenuItem key={i} value={p}>{p}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Box
                                onClick={() => {
                                    if (updatingBulk) return;
                                    if (!selectedBulkProgram) {
                                        toast.warning("Please select a program");
                                        return;
                                    }
                                    handleBulkSyncAll(selectedBulkProgram);
                                }}
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
                                    background: updatingBulk ? "rgba(139, 92, 246, 0.08)" : "transparent",
                                    "&:hover": { background: "rgba(139, 92, 246, 0.08)", transform: "translateY(-4px)" }
                                }}
                            >
                                <SyncIcon sx={{ color: "#8b5cf6", fontSize: 48, mb: 1, animation: updatingBulk ? "spin 2s linear infinite" : "none" }} />
                                <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 600 }}>Click here to start Program-wise bulk sync</Typography>
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
                                sx={{ textTransform: "none", fontWeight: 700, color: "#8b5cf6", borderRadius: "10px", "&:hover": { background: "var(--bg-accent-3)" } }}
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
                    <Paper elevation={0} sx={{ mt: 3, borderRadius: "24px", border: "1px solid var(--border-color)", background: "var(--bg-paper)", overflow: "hidden", position: "relative" }}>
                        {loadingStudents ? (
                            <Box sx={{ display: "flex", justifyContent: "center", p: 8 }}><CircularProgress sx={{ color: "var(--color-primary)" }} /></Box>
                        ) : (
                            <DataTable columns={columns} rows={formattedRows} />
                        )}

                        {selectedIds.length > 0 && (
                            <Box sx={{ p: 3, borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-panel)" }}>
                                <Box sx={{ display: "flex", gap: 2 }}>
                                    <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 700 }}>
                                        {selectedIds.length} students selected.
                                    </Typography>
                                    <Button size="small" startIcon={<SyncIcon />} onClick={handleSyncStudents} disabled={syncing} sx={{ textTransform: "none", fontWeight: 800, color: "var(--color-primary)" }}>
                                        {syncing ? "Syncing..." : "Sync Selected"}
                                    </Button>
                                </Box>
                                <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                                    <FormControl size="small" sx={{ minWidth: 200 }}>
                                        <InputLabel sx={{ color: "var(--text-secondary)" }}>Select Department</InputLabel>
                                        <Select
                                            value={selectedDept}
                                            onChange={(e) => setSelectedDept(e.target.value)}
                                            label="Select Department"
                                            sx={{ borderRadius: "10px", color: "var(--text-primary)", "& .MuiOutlinedInput-notchedOutline": { borderColor: "var(--border-color)" } }}
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
                                        sx={{ borderRadius: "50px", px: 4, textTransform: "none", fontWeight: 800, background: "#10B981", "&:hover": { background: "#059669", boxShadow: "0 10px 20px rgba(16, 185, 129, 0.2)" } }}
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
                slotProps={{
                    paper: {
                        sx: {
                            borderRadius: "24px",
                            p: 1,
                            background: "var(--bg-panel)",
                            backgroundImage: "none",
                            border: "1px solid var(--border-color)",
                            boxShadow: "var(--shadow-premium)"
                        }
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                    {isUpdateModalOpen ? "Update Individual Student" : "Add Individual Student"}
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: "var(--text-secondary)", mb: 3, opacity: 0.8 }}>
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
                        sx={{
                            "& .MuiOutlinedInput-root": {
                                borderRadius: "12px",
                                color: "var(--text-primary)",
                                "& fieldset": { borderColor: "var(--border-color)" },
                                "&:hover fieldset": { borderColor: "var(--color-primary)" },
                            },
                            "& .MuiInputLabel-root": { color: "var(--text-secondary)" }
                        }}
                    />
                    {!isUpdateModalOpen && (
                        <FormControl fullWidth sx={{ mt: 2 }}>
                            <InputLabel sx={{ color: "var(--text-secondary)", "&.Mui-focused": { color: "var(--color-primary)" } }}>Department (Optional)</InputLabel>
                            <Select
                                value={addDept}
                                onChange={(e) => setAddDept(e.target.value)}
                                label="Department (Optional)"
                                sx={{ 
                                    borderRadius: "12px",
                                    color: "var(--text-primary)",
                                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "var(--border-color)" },
                                    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "var(--text-primary)" },
                                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "var(--color-primary)" },
                                    "& .MuiSvgIcon-root": { color: "var(--text-secondary)" }
                                }}
                            >
                                <MenuItem value=""><em>None</em></MenuItem>
                                {allDepartments.map((dept) => (
                                    <MenuItem key={dept._id} value={dept._id}>{dept.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 4, gap: 1.5, justifyContent: "flex-end" }}>
                    <Button
                        onClick={() => (setIsAddModalOpen(false), setIsUpdateModalOpen(false))}
                        sx={{
                            fontWeight: 800,
                            textTransform: "none",
                            color: "var(--color-primary)",
                            "body.dark-mode &": { color: "#ffffff" },
                            borderRadius: "14px",
                            px: 3,
                            "&:hover": {
                                background: "var(--bg-accent-1)",
                                "body.dark-mode &": { background: "rgba(255, 255, 255, 0.1)" }
                            }
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAddStudent}
                        variant="contained"
                        disabled={addingStudent || !addRollNo}
                        sx={{
                            borderRadius: "14px",
                            px: 4,
                            py: 1.2,
                            fontWeight: 800,
                            textTransform: "none",
                            background: "var(--gradient-primary)",
                            color: "#ffffff",
                            boxShadow: "0 4px 15px rgba(0, 0, 0, 0.15)",
                            "&:hover": {
                                background: "var(--gradient-primary-hover)",
                                transform: "translateY(-2px)",
                                boxShadow: "0 6px 20px rgba(0, 0, 0, 0.2)"
                            },
                            "&.Mui-disabled": {
                                background: "var(--border-color)",
                                color: "var(--text-secondary)"
                            }
                        }}
                    >
                        {addingStudent ? <CircularProgress size={22} color="inherit" /> : (isUpdateModalOpen ? "Update Student" : "Add Student")}
                    </Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
};

export default Studentuploads;