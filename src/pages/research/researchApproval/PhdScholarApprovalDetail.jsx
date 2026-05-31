import Loader from "../../../components/common/Loader";
import React, { useState, useEffect } from "react";
import {
    Box, Typography, Grid, Card, Button, TextField,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    CircularProgress, Chip, IconButton, Stack, Divider
} from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import DescriptionIcon from '@mui/icons-material/Description';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import HistoryIcon from '@mui/icons-material/History';
import GavelIcon from '@mui/icons-material/Gavel';
import DownloadIcon from '@mui/icons-material/Download';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ArticleIcon from '@mui/icons-material/Article';
import { toast } from "sonner";
import API from "../../../api/axios";

const PhdScholarApprovalDetail = ({ id, onBack, role }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [remarks, setRemarks] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [imgError, setImgError] = useState(false);

    const isHOD = !role || role === 'HOD';
    const isDean = role === 'RESEARCH_DEAN';
    const isCoordinator = role === 'RESEARCH_COORDINATOR';
    const isResearchAdmin = isDean || isCoordinator;

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await API.get(`/api/research/phd-scholar/${id}`);
                if (res.data?.success) {
                    setData(res.data.data);
                    if (res.data.data.rndComment) setRemarks(res.data.data.rndComment);
                    else if (res.data.data.hodComment) setRemarks(res.data.data.hodComment);
                }
            } catch (error) {
                console.error("Failed to fetch Ph.D. details", error);
                toast.error("Failed to load details");
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    const handleAction = async (action) => {
        if (!remarks && action === 'Reject') {
            toast.error('Remarks are required for rejection.');
            return;
        }

        setActionLoading(true);
        try {
            const endpoint = isResearchAdmin ? `/api/research/phd-scholar/rnd-action/${id}` : `/api/research/phd-scholar/hod-action/${id}`;
            const res = await API.put(endpoint, {
                action,
                comment: remarks
            });
            if (res.data?.success) {
                toast.success(`Appraisal ${action === 'Approve' ? 'Approved' : 'Rejected'} successfully`);
                onBack(); 
            }
        } catch (error) {
            console.error("Action failed", error);
            toast.error(error.response?.data?.message || "Action failed. Please try again.");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}><Loader /></Box>;
    if (!data) return <Box sx={{ textAlign: 'center', p: 5 }}><Typography color="error">Failed to load data.</Typography><Button onClick={onBack} sx={{ mt: 2 }}>Go Back</Button></Box>;

    const { facultyId } = data;
    const statusStyle = (() => {
        const s = data.status || "";
        if (/Pending/i.test(s)) return { bg: "rgba(255, 193, 7, 0.1)", color: "#ff9800", dot: "#ff9800" };
        if (/Approved/i.test(s)) return { bg: "rgba(76, 175, 80, 0.1)", color: "#4caf50", dot: "#4caf50" };
        if (/Rejected/i.test(s)) return { bg: "rgba(244, 67, 54, 0.1)", color: "#f44336", dot: "#f44336" };
        return { bg: "#f5f5f5", color: "#666", dot: "#666" };
    })();

    const renderFilePreview = (title, filepath, index) => {
        if (!filepath) return null;
        const backendURL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "");
        const fileUrl = filepath.startsWith('http') ? filepath : `${backendURL}${filepath}`;
        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(filepath);

        return (
            <Grid key={index} item xs={12} sm={6} md={4}>
                <Box sx={{ mb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "var(--color-primary)", fontSize: "0.75rem", textTransform: "uppercase" }}>
                        {title}
                    </Typography>
                    <IconButton size="small" href={fileUrl} download target="_blank" sx={{ color: "var(--color-primary)" }}><DownloadIcon fontSize="small" /></IconButton>
                </Box>
                <Box sx={{
                    height: 180, display: "flex", alignItems: "center", justifyContent: "center",
                    border: "1px solid var(--border-color)", background: "var(--bg-panel)", borderRadius: "12px",
                    overflow: "hidden", cursor: "pointer", transition: "all 0.3s ease",
                    "&:hover": { borderColor: "var(--color-primary)", transform: "translateY(-4px)", boxShadow: "var(--shadow-premium)" }
                }} onClick={() => window.open(fileUrl, '_blank')}>
                    {isImage ? <img src={fileUrl} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Box sx={{ textAlign: "center" }}><DescriptionIcon sx={{ fontSize: 40, color: "var(--text-secondary)", mb: 1 }} /><Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 700 }}>PDF View</Typography></Box>}
                </Box>
            </Grid>
        );
    };

    const LabelValue = ({ label, value, chip, horizontal = false }) => (
        <Box sx={{
            p: horizontal ? "10px 16px" : 2, borderRadius: "14px", background: horizontal ? "transparent" : "rgba(255,255,255,0.02)",
            height: "100%", display: "flex", flexDirection: horizontal ? "row" : "column",
            alignItems: horizontal ? "center" : "flex-start", justifyContent: horizontal ? "flex-start" : "center",
            gap: horizontal ? 2 : 0.5, transition: "all 0.3s ease",
            borderBottom: horizontal ? "1px solid var(--border-color)" : "1px solid transparent",
            "&:last-child": { borderBottom: "none" },
            "&:hover": { borderColor: "var(--color-primary)", bgcolor: "rgba(190, 147, 55, 0.05)", transform: "translateY(-2px)", boxShadow: "var(--shadow-premium)" }
        }}>
            <Typography variant="caption" sx={{ flex: horizontal ? { xs: "0 0 120px", sm: "0 0 150px" } : "none", color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 900, fontSize: "0.65rem", mb: horizontal ? 0 : 0.5 }}>{label}</Typography>
            <Box sx={{ flex: horizontal ? 1 : "none" }}>
                {chip ? chip : <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.9rem" }}>{value || "-"}</Typography>}
            </Box>
        </Box>
    );

    const cardStyle = {
        p: 3,
        mb: 3,
        borderRadius: "20px",
        border: "1px solid var(--border-color)",
        background: "var(--bg-glass)",
        backdropFilter: "blur(10px)",
        boxShadow: "var(--shadow-premium)",
    };

    return (
        <Box sx={{ width: "100%", pb: 5 }}>
            <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ mb: 2, color: "var(--color-primary)", fontWeight: 700, textTransform: "none" }}>Back to Request List</Button>

            {/* Header Card */}
            <Card sx={cardStyle}>
                <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "center", sm: "flex-start" }, gap: 2, mb: 4 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Box sx={{ width: 50, height: 50, borderRadius: "50%", bgcolor: "rgba(190, 147, 55, 0.1)", color: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}><PersonIcon /></Box>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>{data.studentName}</Typography>
                            <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 600 }}>Scholar Roll No: {data.rollNumber}</Typography>
                        </Box>
                    </Box>
                    <Box sx={{ textAlign: { xs: "center", sm: "right" } }}>
                        <Chip label="Ph.D. Scholar Guiding" sx={{ bgcolor: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", fontWeight: 800, borderRadius: "8px", textTransform: "uppercase", fontSize: "0.65rem" }} />
                        <Typography variant="caption" sx={{ display: "block", mt: 1, color: "var(--text-secondary)", fontWeight: 700 }}>Submitted on {new Date(data.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</Typography>
                    </Box>
                </Box>

                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, width: "100%" }}>
                    <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 23%" } }}>
                        <LabelValue label="Academic Year" value={data.academicYear?.year} />
                    </Box>
                    <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 23%" } }}>
                        <LabelValue label="Reference ID" value={`PHD-${new Date(data.createdAt).getFullYear()}-${data._id.substring(data._id.length - 6).toUpperCase()}`} />
                    </Box>
                    <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 23%" } }}>
                        <LabelValue label="Submission Date" value={new Date(data.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} />
                    </Box>
                    <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 23%" } }}>
                        <Box sx={{ 
                            p: 2, borderRadius: "14px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center",
                            background: "rgba(255,255,255,0.02)", border: "1px solid transparent",
                            "&:hover": { borderColor: "var(--color-primary)", bgcolor: "rgba(190, 147, 55, 0.05)", transform: "translateY(-2px)", boxShadow: "var(--shadow-premium)" },
                            transition: "all 0.3s ease"
                        }}>
                            <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 900, fontSize: "0.65rem", mb: 0.5 }}>Workflow Status</Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: statusStyle.dot, boxShadow: `0 0 10px ${statusStyle.dot}` }} />
                                <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)" }}>{data.status}</Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Card>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mb: 3 }}>
                {/* Guide Faculty Info */}
                <Card sx={{ ...cardStyle, flex: { xs: "1 1 100%", lg: "1 1 48%" }, mb: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}><PersonIcon sx={{ color: "var(--color-primary)" }} /><Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Guide Information</Typography></Box>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "center" }}>
                        <Box sx={{ width: 100, height: 100, borderRadius: "50%", background: "var(--bg-panel)", border: "2px solid var(--border-color)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-premium)" }}>
                            {(() => {
                                const backendURL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "");
                                const portalImg = facultyId?.profileImage ? (facultyId.profileImage.startsWith('http') ? facultyId.profileImage : `${backendURL}${facultyId.profileImage.startsWith('/') ? facultyId.profileImage : `/${facultyId.profileImage}`}`) : null;
                                const ecapImg = facultyId?.institutionId ? `https://info.aec.edu.in/aus/employeephotos/${facultyId.institutionId}.jpg` : null;
                                const src = portalImg || ecapImg;

                                if (src && !imgError) {
                                    return (
                                        <img 
                                            src={src} 
                                            alt={facultyId?.name} 
                                            style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                                            onError={() => setImgError(true)}
                                        />
                                    );
                                }
                                return <Typography sx={{ fontSize: 36, fontWeight: 800, color: "var(--text-secondary)" }}>{facultyId?.name?.charAt(0).toUpperCase() || "F"}</Typography>;
                            })()}
                        </Box>
                        <Box sx={{ width: "100%" }}>
                            <LabelValue label="Name" value={facultyId?.name} horizontal />
                            <LabelValue label="Designation" value={facultyId?.designation} horizontal />
                            <LabelValue label="Department" value={facultyId?.coreDepartment?.name} horizontal />
                            <LabelValue label="Emp ID" value={facultyId?.institutionId} horizontal />
                            <LabelValue label="College" value={facultyId?.college || "Aditya University"} horizontal />
                        </Box>
                    </Box>
                </Card>

                {/* Scholar Details */}
                <Card sx={{ ...cardStyle, flex: { xs: "1 1 100%", lg: "1 1 48%" }, mb: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}><ArticleIcon sx={{ color: "var(--color-primary)" }} /><Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Scholar Details</Typography></Box>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                        <LabelValue label="Scholar Roll Number" value={data.rollNumber} horizontal />
                        <LabelValue label="Scholar Student Name" value={data.studentName} horizontal />
                        <LabelValue label="Course Name" value={data.course} horizontal />
                        <LabelValue label="Branch" value={data.branch || "N/A"} horizontal />
                        <LabelValue 
                            label="Appraisal Status" 
                            horizontal 
                            chip={
                                <Chip 
                                    label={data.scholarStatus} 
                                    size="small" 
                                    sx={{ 
                                        bgcolor: data.scholarStatus === 'Awarded' ? "rgba(16, 185, 129, 0.15)" : "rgba(59, 130, 246, 0.15)", 
                                        color: data.scholarStatus === 'Awarded' ? "#10B981" : "#3B82F6", 
                                        fontWeight: 800 
                                    }} 
                                />
                            } 
                        />
                        <LabelValue label="Admission / Award Date" value={new Date(data.admissionOrAwardDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} horizontal />
                    </Box>
                </Card>
            </Box>

            {/* Document proof */}
            <Card sx={cardStyle}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}><AttachFileIcon sx={{ color: "var(--color-primary)" }} /><Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Attached Supporting Document</Typography></Box>
                <Grid container spacing={3}>
                    {renderFilePreview(data.scholarStatus === "Awarded" ? "Award Proceedings / Degree Award Letter" : "Admission Letter / Joining Report", data.document, 1)}
                </Grid>
            </Card>

            {/* Action panel */}
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mt: 3 }}>
                {data.hodComment && <Box sx={{ flex: 1, minWidth: 300 }}><Card sx={{ ...cardStyle, borderLeft: "4px solid #ffc107", height: "100%", mb: 0 }}><Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}><HistoryIcon sx={{ color: "#ffc107" }} /><Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>HOD Review</Typography></Box><Box sx={{ p: 2, bgcolor: "rgba(255, 193, 7, 0.05)", borderRadius: "10px", border: "1px solid #ffc10733" }}><Typography variant="body2" sx={{ fontStyle: "italic", fontWeight: 600 }}>"{data.hodComment}"</Typography></Box></Card></Box>}
                
                <Box sx={{ flex: 1, minWidth: 350 }}>
                    {((isHOD && data.status === 'Pending at HOD') || (isResearchAdmin && data.status === 'Pending at R&D')) ? (
                        <Card sx={{ ...cardStyle, borderTop: "4px solid var(--color-primary)", mb: 0 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}><GavelIcon sx={{ color: "var(--color-primary)" }} /><Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Review Decision</Typography></Box>

                            <TextField fullWidth multiline rows={3} placeholder="Provide your review comments..." value={remarks} onChange={e => setRemarks(e.target.value)} sx={{ mb: 3, "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: "var(--bg-panel)" } }} />

                            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                                <Button variant="outlined" disabled={actionLoading} onClick={() => handleAction('Reject')} sx={{ color: "#ef4444", borderColor: "#ef4444", fontWeight: 800, borderRadius: "10px", textTransform: "none", px: 3 }}>Reject</Button>
                                <Button variant="contained" disabled={actionLoading} onClick={() => handleAction('Approve')} sx={{ bgcolor: "#10b981", color: "#fff", fontWeight: 800, borderRadius: "10px", textTransform: "none", px: 4, "&:hover": { bgcolor: "#059669" } }}>{isHOD ? "Approve & Forward" : "Final Approve"}</Button>
                            </Box>
                        </Card>
                    ) : (
                        <Card sx={{ ...cardStyle, p: 4, textAlign: "center", mb: 0 }}>
                            <Typography variant="h6" color="var(--text-secondary)" sx={{ fontWeight: 800 }}>Request already processed</Typography>
                            <Typography variant="body2" sx={{ mt: 1, fontWeight: 700 }}>Current Status: <span style={{ color: statusStyle.color }}>{data.status}</span></Typography>
                            {data.rndComment && (
                                <Box sx={{ mt: 3, textAlign: "left", p: 2, bgcolor: "rgba(16, 185, 129, 0.05)", borderRadius: "10px", border: "1px solid #10b98133" }}>
                                    <Typography variant="caption" sx={{ fontWeight: 900, color: "#10b981", textTransform: "uppercase" }}>R&D Remarks:</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>"{data.rndComment}"</Typography>
                                </Box>
                            )}
                        </Card>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default PhdScholarApprovalDetail;
