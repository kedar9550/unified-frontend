import Loader from "../../../components/common/Loader";
import React, { useState, useEffect } from "react";
import {
    Box, Typography, Grid, Card, Button, Chip, IconButton, Stack, Table, TableHead, TableBody, TableRow, TableCell, TableContainer
} from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import DownloadIcon from '@mui/icons-material/Download';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ArticleIcon from '@mui/icons-material/Article';
import DescriptionIcon from '@mui/icons-material/Description';
import { toast } from "sonner";
import API from "../../../api/axios";
import EditResearchDetailsDialog from "./EditResearchDetailsDialog";

const PhdScholarFacultyDetail = ({ facultyId, onBack, role }) => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [facultyInfo, setFacultyInfo] = useState(null);
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [editOpen, setEditOpen] = useState(false);
    const [selectedScholar, setSelectedScholar] = useState(null);

    const isHOD = !role || role === 'HOD';
    const isDean = role === 'RESEARCH_DEAN';
    const isCoordinator = role === 'RESEARCH_COORDINATOR';
    const isResearchAdmin = isDean || isCoordinator;

    const fetchDetails = async () => {
        try {
            const res = await API.get(`/api/research/phd-scholar/by-faculty/${facultyId}`);
            if (res.data?.success) {
                setApplications(res.data.data || []);
                if (res.data.data && res.data.data.length > 0) {
                    setFacultyInfo(res.data.data[0].facultyId);
                }
            }
        } catch (error) {
            console.error("Failed to fetch Ph.D. scholars for faculty", error);
            toast.error(error.response?.data?.message || "Failed to load details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (facultyId) {
            fetchDetails();
        }
    }, [facultyId]);

    const handleAction = async (id, action) => {
        // Without modal for remarks, we might just pass a generic remark or empty for now if not strictly required, 
        // or prompt the user. For simplicity, we can use window.prompt.
        let remarks = "";
        if (action === 'Reject') {
            remarks = window.prompt("Please enter rejection remarks (Required):");
            if (!remarks) {
                toast.error('Remarks are required for rejection');
                return;
            }
        } else {
            remarks = window.prompt("Please enter approval remarks (Optional):") || "Approved";
        }

        setActionLoadingId(id);
        try {
            const endpoint = isResearchAdmin ? `/api/research/phd-scholar/rnd-action/${id}` : `/api/research/phd-scholar/hod-action/${id}`;
            const res = await API.put(endpoint, {
                action,
                comment: remarks
            });
            if (res.data?.success) {
                toast.success(`Appraisal ${action === 'Approve' ? 'Approved' : 'Rejected'} successfully`);
                fetchDetails(); // refresh list
            }
        } catch (error) {
            console.error("Action failed", error);
            toast.error(error.response?.data?.message || "Action failed. Please try again.");
        } finally {
            setActionLoadingId(null);
        }
    };

    if (loading) return null;
    if (!facultyInfo || applications.length === 0) return <Box sx={{ textAlign: 'center', p: 5 }}><Typography color="error">No records found for this faculty.</Typography><Button onClick={onBack} sx={{ mt: 2 }}>Go Back</Button></Box>;

    const getStatusStyle = (s) => {
        if (/Pending/i.test(s)) return { bg: "rgba(255, 193, 7, 0.1)", color: "#ff9800", dot: "#ff9800" };
        if (/Approved/i.test(s)) return { bg: "rgba(76, 175, 80, 0.1)", color: "#4caf50", dot: "#4caf50" };
        if (/Rejected/i.test(s)) return { bg: "rgba(244, 67, 54, 0.1)", color: "#f44336", dot: "#f44336" };
        return { bg: "#f5f5f5", color: "#666", dot: "#666" };
    };

    const cardStyle = {
        p: 3,
        mb: 3,
        borderRadius: "20px",
        border: "1px solid var(--border-color)",
        background: "var(--bg-glass)",
        backdropFilter: "blur(10px)",
        boxShadow: "var(--shadow-premium)",
    };

    const LabelValue = ({ label, value, horizontal = false }) => (
        <Box sx={{
            p: horizontal ? "10px 16px" : 2, borderRadius: "14px", background: horizontal ? "transparent" : "rgba(255,255,255,0.02)",
            height: "100%", display: "flex", flexDirection: horizontal ? "row" : "column",
            alignItems: horizontal ? "center" : "flex-start", justifyContent: horizontal ? "flex-start" : "center",
            gap: horizontal ? 2 : 0.5, transition: "all 0.3s ease",
            borderBottom: horizontal ? "1px solid var(--border-color)" : "1px solid transparent",
            "&:last-child": { borderBottom: "none" }
        }}>
            <Typography variant="caption" sx={{ flex: horizontal ? { xs: "0 0 120px", sm: "0 0 150px" } : "none", color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 900, fontSize: "0.65rem", mb: horizontal ? 0 : 0.5 }}>{label}</Typography>
            <Box sx={{ flex: horizontal ? 1 : "none" }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.9rem" }}>{value || "-"}</Typography>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ width: "100%", pb: 5 }}>
            <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ mb: 2, color: "var(--color-primary)", fontWeight: 700, textTransform: "none" }}>Back to Request List</Button>

            {/* Guide Faculty Info */}
            <Card sx={{ ...cardStyle, mb: 4 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                    <PersonIcon sx={{ color: "var(--color-primary)" }} />
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Guide Information</Typography>
                </Box>
                <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3, alignItems: { xs: "center", md: "flex-start" } }}>
                    <Box sx={{ width: 100, height: 100, borderRadius: "50%", background: "var(--bg-panel)", border: "2px solid var(--border-color)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-premium)", flexShrink: 0 }}>
                        {(() => {
                            const backendURL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "");
                            const portalImg = facultyInfo.profileImage ? (facultyInfo.profileImage.startsWith('http') ? facultyInfo.profileImage : `${backendURL}${facultyInfo.profileImage.startsWith('/') ? facultyInfo.profileImage : `/${facultyInfo.profileImage}`}`) : null;
                            const ecapImg = facultyInfo.institutionId ? `https://info.aec.edu.in/aus/employeephotos/${facultyInfo.institutionId}.jpg` : null;
                            const src = portalImg || ecapImg;

                            if (src) {
                                return (
                                    <img 
                                        src={src} 
                                        alt={facultyInfo.name} 
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                );
                            }
                            return <Typography sx={{ fontSize: 36, fontWeight: 800, color: "var(--text-secondary)" }}>{facultyInfo.name?.charAt(0).toUpperCase() || "F"}</Typography>;
                        })()}
                    </Box>
                    <Box sx={{ width: "100%", display: "flex", flexWrap: "wrap" }}>
                        <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 50%" } }}>
                            <LabelValue label="Name" value={facultyInfo.name} horizontal />
                            <LabelValue label="Emp ID" value={facultyInfo.institutionId} horizontal />
                            <LabelValue label="Parent Department" value={facultyInfo.coreDepartment?.name} horizontal />
                        </Box>
                        <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 50%" } }}>
                            <LabelValue label="Designation" value={facultyInfo.designation} horizontal />
                            <LabelValue label="College" value={facultyInfo.college || "Aditya University"} horizontal />
                        </Box>
                    </Box>
                </Box>
            </Card>

            <Typography variant="h5" sx={{ fontWeight: 800, color: "var(--text-primary)", mb: 3 }}>
                Assigned Ph.D. Scholars ({applications.length})
            </Typography>

            {applications.map((app, index) => {
                const statusStyle = getStatusStyle(app.status);
                const backendURL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "");
                const docUrl = app.document ? (app.document.startsWith('http') ? app.document : `${backendURL}${app.document}`) : null;
                const isPending = (isHOD && app.status === 'Pending at HOD') || (isResearchAdmin && app.status === 'Pending at R&D');

                return (
                    <Card key={app._id} sx={{ ...cardStyle, p: 0, overflow: 'hidden', mb: 3 }}>
                        <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "rgba(0,0,0,0.02)", borderBottom: "1px solid var(--border-color)" }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "var(--color-primary)" }}>
                                {index + 1}. {app.studentName} ({app.rollNumber})
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                {isResearchAdmin && (
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={() => {
                                            setSelectedScholar(app);
                                            setEditOpen(true);
                                        }}
                                        sx={{
                                            borderColor: "var(--color-primary)",
                                            color: "var(--color-primary)",
                                            fontWeight: 700,
                                            textTransform: "none",
                                            borderRadius: "8px",
                                            "&:hover": { bgcolor: "rgba(190, 147, 55, 0.1)", borderColor: "var(--color-primary)" }
                                        }}
                                    >
                                        Correct Info
                                    </Button>
                                )}
                                <Chip label={app.status} size="small" sx={{ bgcolor: statusStyle.bg, color: statusStyle.color, fontWeight: 700 }} />
                            </Box>
                        </Box>
                        <Grid container>
                            <Grid item xs={12} md={8} sx={{ p: 3, borderRight: { md: "1px solid var(--border-color)" } }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <LabelValue label="Course" value={app.course} />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <LabelValue label="Branch" value={app.branch || "N/A"} />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <LabelValue label="Admission / Award Date" value={new Date(app.admissionOrAwardDate).toLocaleDateString("en-GB")} />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <LabelValue label="Scholar Status" value={app.scholarStatus} />
                                    </Grid>
                                </Grid>

                                {app.hodComment && (
                                    <Box sx={{ mt: 2, p: 1.5, bgcolor: "rgba(255, 193, 7, 0.05)", borderRadius: "8px", border: "1px solid #ffc10733" }}>
                                        <Typography variant="caption" sx={{ fontWeight: 800, color: "#ffc107", display: "block" }}>HOD Review:</Typography>
                                        <Typography variant="body2" sx={{ fontStyle: "italic" }}>"{app.hodComment}"</Typography>
                                    </Box>
                                )}
                                {app.rndComment && (
                                    <Box sx={{ mt: 2, p: 1.5, bgcolor: "rgba(16, 185, 129, 0.05)", borderRadius: "8px", border: "1px solid #10b98133" }}>
                                        <Typography variant="caption" sx={{ fontWeight: 800, color: "#10b981", display: "block" }}>R&D Review:</Typography>
                                        <Typography variant="body2" sx={{ fontStyle: "italic" }}>"{app.rndComment}"</Typography>
                                    </Box>
                                )}
                            </Grid>
                            <Grid item xs={12} md={4} sx={{ p: 3, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                <Box>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: "var(--text-secondary)", mb: 1, display: "block" }}>SUPPORTING DOCUMENT</Typography>
                                    {docUrl ? (
                                        <Button
                                            variant="outlined"
                                            startIcon={<DownloadIcon />}
                                            href={docUrl}
                                            download
                                            target="_blank"
                                            fullWidth
                                        >
                                            View Document
                                        </Button>
                                    ) : (
                                        <Typography variant="body2" sx={{ color: "var(--text-secondary)" }}>No document attached</Typography>
                                    )}
                                </Box>
 
                                {isPending && (
                                    <Box sx={{ mt: 3, display: "flex", gap: 2, flexDirection: "column" }}>
                                        <Typography variant="caption" sx={{ fontWeight: 800, color: "var(--text-secondary)", mb: -1 }}>ACTIONS</Typography>
                                        <Box sx={{ display: "flex", gap: 1 }}>
                                            <Button
                                                variant="contained"
                                                color="success"
                                                fullWidth
                                                startIcon={actionLoadingId === app._id ? <Loader size={16} color="inherit" /> : <CheckIcon />}
                                                disabled={actionLoadingId !== null}
                                                onClick={() => handleAction(app._id, 'Approve')}
                                            >
                                                Approve
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                fullWidth
                                                startIcon={actionLoadingId === app._id ? <Loader size={16} color="inherit" /> : <CloseIcon />}
                                                disabled={actionLoadingId !== null}
                                                onClick={() => handleAction(app._id, 'Reject')}
                                            >
                                                Reject
                                            </Button>
                                        </Box>
                                    </Box>
                                )}
                            </Grid>
                        </Grid>
                    </Card>
                );
            })}
            {isResearchAdmin && selectedScholar && (
                <EditResearchDetailsDialog
                    open={editOpen}
                    onClose={() => {
                        setEditOpen(false);
                        setSelectedScholar(null);
                    }}
                    type="Phd Scholar"
                    currentData={selectedScholar}
                    onSave={() => {
                        fetchDetails();
                    }}
                />
            )}
        </Box>
    );
};

export default PhdScholarFacultyDetail;
