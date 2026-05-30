import React, { useState, useEffect } from "react";
import PageHeader from "../../components/common/PageHeader";
import SectionHeader from "../../components/common/SectionHeader";
import DataTable from "../../components/data/DataTable";
import API from "../../api/axios";
import { toast } from "sonner";
import {
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    IconButton,
    Chip,
    Tooltip,
    Stack,
    TextField,
    CircularProgress,
    Typography,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider
} from "@mui/material";
import {
    Visibility as ViewIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon
} from "@mui/icons-material";

const ProctoringApprovalList = () => {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState("Pending");
    const [yearFilter, setYearFilter] = useState("All");

    // Review Modal States
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [remarks, setRemarks] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const fetchEntries = async () => {
        setLoading(true);
        try {
            const res = await API.get("/api/faculty-proctoring/pending-hod");
            if (res.data?.success) {
                setEntries(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch proctoring entries:", error);
            toast.error("Failed to load proctoring data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEntries();
    }, []);

    const handleOpenReview = (entry) => {
        setSelectedEntry(entry);
        setRemarks(entry.remarks || "");
    };

    const handleCloseReview = () => {
        setSelectedEntry(null);
        setRemarks("");
    };

    const handleHODAction = async (action) => {
        if (!selectedEntry) return;

        setActionLoading(true);
        try {
            const res = await API.put(`/api/faculty-proctoring/hod-action/${selectedEntry._id}`, {
                action,
                remarks
            });

            if (res.data?.success) {
                toast.success(`Statistics ${action === "Approve" ? "Approved" : "Rejected"} successfully!`);
                fetchEntries();
                handleCloseReview();
            }
        } catch (error) {
            console.error("HOD Action error:", error);
            toast.error(error.response?.data?.message || "Failed to process approval action.");
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusColor = (status) => {
        if (status === "Pending") return { bg: "rgba(245, 158, 11, 0.1)", color: "#d97706", border: "rgba(245, 158, 11, 0.2)" };
        if (status === "Approved") return { bg: "rgba(16, 185, 129, 0.1)", color: "#10B981", border: "rgba(16, 185, 129, 0.2)" };
        if (status === "Rejected") return { bg: "rgba(239, 68, 68, 0.1)", color: "#EF4444", border: "rgba(239, 68, 68, 0.2)" };
        return { bg: "var(--bg-glass)", color: "var(--text-secondary)", border: "var(--border-color)" };
    };

    // Filter Logic
    const uniqueYears = [...new Set(entries.map(e => e.academicYear?.year).filter(Boolean))];
    const filteredEntries = entries.filter(entry => {
        const matchesStatus = statusFilter === "All" || entry.status === statusFilter;
        const matchesYear = yearFilter === "All" || entry.academicYear?.year === yearFilter;
        return matchesStatus && matchesYear;
    });

    const columns = [
        "S.NO",
        "Faculty Name",
        "Emp ID",
        "Academic Year",
        "Total Students",
        "Appeared",
        "Passed",
        "Pass %",
        "Status",
        "Actions"
    ];

    const rows = filteredEntries.map((item, index) => {
        const statusStyle = getStatusColor(item.status);
        return [
            { value: index + 1, display: <Box sx={{ fontWeight: 600 }}>{index + 1}</Box> },
            {
                value: item.facultyId?.name || "Unknown",
                display: <Typography sx={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{item.facultyId?.name || "Unknown"}</Typography>
            },
            {
                value: item.facultyId?.institutionId || "—",
                display: <Typography sx={{ fontWeight: 600, color: "var(--text-secondary)", fontSize: 13 }}>{item.facultyId?.institutionId || "—"}</Typography>
            },
            {
                value: item.academicYear?.year || "—",
                display: <Chip label={item.academicYear?.year || "—"} size="small" sx={{ fontWeight: 700, bgcolor: "var(--bg-glass)", color: "var(--text-primary)" }} />
            },
            {
                value: item.totalStudents,
                display: <Typography sx={{ fontWeight: 700, textAlign: "center" }}>{item.totalStudents}</Typography>
            },
            {
                value: item.studentsAppeared,
                display: <Typography sx={{ fontWeight: 700, color: "#8B5CF6", textAlign: "center" }}>{item.studentsAppeared}</Typography>
            },
            {
                value: item.studentsPassed,
                display: <Typography sx={{ fontWeight: 700, color: "#10B981", textAlign: "center" }}>{item.studentsPassed}</Typography>
            },
            {
                value: item.passPercentage,
                display: (
                    <Typography sx={{ fontWeight: 900, color: "var(--color-primary)", textAlign: "center" }}>
                        {item.passPercentage.toFixed(2)}%
                    </Typography>
                )
            },
            {
                value: item.status,
                display: (
                    <Chip
                        label={item.status}
                        size="small"
                        sx={{
                            bgcolor: statusStyle.bg,
                            color: statusStyle.color,
                            fontWeight: 700,
                            border: `1px solid ${statusStyle.border}`,
                            borderRadius: "8px"
                        }}
                    />
                )
            },
            {
                value: "actions",
                display: (
                    <Stack direction="row" spacing={1}>
                        <Tooltip title={item.status === "Pending" ? "Review & Action" : "View Details"}>
                            <IconButton
                                size="small"
                                sx={{ color: "var(--color-primary)" }}
                                onClick={() => handleOpenReview(item)}
                            >
                                <ViewIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                )
            }
        ];
    });

    const filterToolbar = (
        <Box
            sx={{
                p: 2.5,
                background: "var(--bg-panel)",
                borderRadius: "16px",
                border: "1px solid var(--border-color)",
                boxShadow: "var(--shadow-premium)",
                mb: 3
            }}
        >
            <Grid container spacing={2} sx={{ alignItems: "center" }}>
                <Grid item xs={12} sm={6} md={4}>
                    <FormControl fullWidth size="small">
                        <InputLabel sx={{ color: "var(--text-secondary)" }}>Status</InputLabel>
                        <Select
                            value={statusFilter}
                            label="Status"
                            onChange={(e) => setStatusFilter(e.target.value)}
                            sx={{
                                borderRadius: "12px",
                                background: "var(--bg-glass)",
                                color: "var(--text-primary)"
                            }}
                        >
                            <MenuItem value="All">All Statuses</MenuItem>
                            <MenuItem value="Pending">Pending Review</MenuItem>
                            <MenuItem value="Approved">Approved</MenuItem>
                            <MenuItem value="Rejected">Rejected</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                    <FormControl fullWidth size="small">
                        <InputLabel sx={{ color: "var(--text-secondary)" }}>Academic Year</InputLabel>
                        <Select
                            value={yearFilter}
                            label="Academic Year"
                            onChange={(e) => setYearFilter(e.target.value)}
                            sx={{
                                borderRadius: "12px",
                                background: "var(--bg-glass)",
                                color: "var(--text-primary)"
                            }}
                        >
                            <MenuItem value="All">All Academic Years</MenuItem>
                            {uniqueYears.map(year => (
                                <MenuItem key={year} value={year}>{year}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>
        </Box>
    );

    return (
        <Box sx={{ width: "100%", mb: 3 }}>
            <Stack spacing={3} sx={{ width: "100%" }}>
                <PageHeader
                    title="Faculty Proctoring Approvals"
                    subtitle="Review, approve, and track manual proctoring pass statistics for the current appraisal cycle."
                />

                <Box sx={{ width: "100%" }}>
                    <SectionHeader title="Proctoring Submissions" />
                    {filterToolbar}

                    {loading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                            <CircularProgress size={36} sx={{ color: "var(--color-primary)" }} />
                        </Box>
                    ) : rows.length === 0 ? (
                        <Box
                            sx={{
                                textAlign: "center",
                                py: 8,
                                color: "var(--text-secondary)",
                                border: "1px dashed var(--border-color)",
                                borderRadius: "16px",
                                background: "var(--bg-glass)"
                            }}
                        >
                            No proctoring statistics submissions found matching the criteria.
                        </Box>
                    ) : (
                        <DataTable columns={columns} rows={rows} />
                    )}
                </Box>
            </Stack>

            {/* Review Dialog */}
            <Dialog
                open={Boolean(selectedEntry)}
                onClose={handleCloseReview}
                maxWidth="sm"
                fullWidth
                slotProps={{
                    paper: {
                        sx: {
                            borderRadius: "20px",
                            bgcolor: "var(--bg-panel)",
                            border: "1px solid var(--border-color)",
                            backgroundImage: "none",
                            p: 1
                        }
                    }
                }}
            >
                {selectedEntry && (
                    <>
                        <DialogTitle sx={{ fontWeight: 800, fontSize: 18, color: "var(--text-primary)", pb: 1 }}>
                            Review Proctoring Statistics
                        </DialogTitle>
                        <DialogContent>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, mt: 1 }}>
                                {/* Faculty Bio */}
                                <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
                                    <Box>
                                        <Typography sx={{ fontSize: 12, fontWeight: 900, color: "var(--text-secondary)", textTransform: "uppercase" }}>
                                            Faculty Name
                                        </Typography>
                                        <Typography sx={{ fontWeight: 800, color: "var(--text-primary)", fontSize: 15 }}>
                                            {selectedEntry.facultyId?.name}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ textAlign: { xs: "left", sm: "right" } }}>
                                        <Typography sx={{ fontSize: 12, fontWeight: 900, color: "var(--text-secondary)", textTransform: "uppercase" }}>
                                            Emp ID / Year
                                        </Typography>
                                        <Typography sx={{ fontWeight: 700, color: "var(--text-secondary)", fontSize: 14 }}>
                                            {selectedEntry.facultyId?.institutionId} ({selectedEntry.academicYear?.year})
                                        </Typography>
                                    </Box>
                                </Box>

                                <Divider sx={{ borderColor: "var(--border-color)" }} />

                                {/* Entered Stats */}
                                <Grid container spacing={2}>
                                    <Grid item xs={4}>
                                        <Typography sx={{ fontSize: 11, fontWeight: 900, color: "var(--text-secondary)", textTransform: "uppercase", textAlign: "center" }}>
                                            Total Students
                                        </Typography>
                                        <Typography sx={{ fontWeight: 800, fontSize: 18, color: "var(--text-primary)", textAlign: "center", mt: 0.5 }}>
                                            {selectedEntry.totalStudents}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <Typography sx={{ fontSize: 11, fontWeight: 900, color: "var(--text-secondary)", textTransform: "uppercase", textAlign: "center" }}>
                                            Appeared
                                        </Typography>
                                        <Typography sx={{ fontWeight: 800, fontSize: 18, color: "#8B5CF6", textAlign: "center", mt: 0.5 }}>
                                            {selectedEntry.studentsAppeared}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <Typography sx={{ fontSize: 11, fontWeight: 900, color: "var(--text-secondary)", textTransform: "uppercase", textAlign: "center" }}>
                                            Passed
                                        </Typography>
                                        <Typography sx={{ fontWeight: 800, fontSize: 18, color: "#10B981", textAlign: "center", mt: 0.5 }}>
                                            {selectedEntry.studentsPassed}
                                        </Typography>
                                    </Grid>
                                </Grid>

                                {/* pass percent */}
                                <Box
                                    sx={{
                                        p: 2.5,
                                        borderRadius: "14px",
                                        bgcolor: "rgba(59, 130, 246, 0.05)",
                                        border: "1px solid rgba(59, 130, 246, 0.15)",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: 0.5
                                    }}
                                >
                                    <Typography sx={{ fontSize: 10, fontWeight: 900, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1px" }}>
                                        Evaluated Pass Percentage
                                    </Typography>
                                    <Typography
                                        variant="h4"
                                        sx={{
                                            fontWeight: 900,
                                            background: "linear-gradient(135deg, var(--color-primary) 0%, #2563eb 100%)",
                                            WebkitBackgroundClip: "text",
                                            WebkitTextFillColor: "transparent"
                                        }}
                                    >
                                        {selectedEntry.passPercentage.toFixed(2)}%
                                    </Typography>
                                </Box>

                                {/* Remarks input or view */}
                                <Box>
                                    <Typography sx={{ fontSize: 12, fontWeight: 900, color: "var(--text-secondary)", textTransform: "uppercase", mb: 1 }}>
                                        HOD Comments / Remarks {selectedEntry.status === "Pending" && "(Optional)"}
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={3}
                                        value={remarks}
                                        disabled={selectedEntry.status !== "Pending" || actionLoading}
                                        onChange={(e) => setRemarks(e.target.value)}
                                        placeholder="Add approval comments or rejection remarks..."
                                        sx={{
                                            "& .MuiOutlinedInput-root": {
                                                borderRadius: "12px",
                                                bgcolor: "rgba(255,255,255,0.01)"
                                            }
                                        }}
                                    />
                                </Box>

                                {/* Approved details if already processed */}
                                {selectedEntry.status !== "Pending" && (
                                    <Box sx={{ p: 2, borderRadius: "12px", bgcolor: "var(--bg-glass)", border: "1px solid var(--border-color)", mt: 0.5 }}>
                                        <Typography sx={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>
                                            Processed status: <strong>{selectedEntry.status}</strong>
                                        </Typography>
                                        <Typography sx={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500, mt: 0.5 }}>
                                            By: <strong>{selectedEntry.approvedBy?.name || "HOD"}</strong> on{" "}
                                            {new Date(selectedEntry.approvalDate).toLocaleString("en-GB", {
                                                day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                                            })}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </DialogContent>
                        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                            <Button
                                onClick={handleCloseReview}
                                disabled={actionLoading}
                                sx={{ textTransform: "none", fontWeight: 700, borderRadius: "10px", color: "var(--text-secondary)" }}
                            >
                                Cancel
                            </Button>
                            {selectedEntry.status === "Pending" && (
                                <>
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        disabled={actionLoading}
                                        startIcon={actionLoading ? <CircularProgress size={16} /> : <CancelIcon />}
                                        onClick={() => handleHODAction("Reject")}
                                        sx={{ textTransform: "none", fontWeight: 700, borderRadius: "10px", borderColor: "rgba(239, 68, 68, 0.4)", color: "#EF4444" }}
                                    >
                                        Reject
                                    </Button>
                                    <Button
                                        variant="contained"
                                        disabled={actionLoading}
                                        startIcon={actionLoading ? <CircularProgress size={16} /> : <CheckCircleIcon />}
                                        onClick={() => handleHODAction("Approve")}
                                        sx={{
                                            textTransform: "none",
                                            fontWeight: 700,
                                            borderRadius: "10px",
                                            background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                                            color: "#fff",
                                            boxShadow: "0 4px 15px rgba(16, 185, 129, 0.2)",
                                            "&:hover": {
                                                opacity: 0.95
                                            }
                                        }}
                                    >
                                        Approve
                                    </Button>
                                </>
                            )}
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Box>
    );
};

export default ProctoringApprovalList;
