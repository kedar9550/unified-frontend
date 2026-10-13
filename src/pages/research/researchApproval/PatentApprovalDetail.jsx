import Loader from "../../../components/common/Loader";
import React, { useState, useEffect } from "react";
import {
    Box, Typography, Grid, Card, Button, TextField, MenuItem, Select,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Stack,
    Dialog, DialogTitle, DialogContent, DialogActions
} from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import DescriptionIcon from '@mui/icons-material/Description';
import GroupsIcon from '@mui/icons-material/Groups';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import HistoryIcon from '@mui/icons-material/History';
import GavelIcon from '@mui/icons-material/Gavel';
import DownloadIcon from '@mui/icons-material/Download';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ArticleIcon from '@mui/icons-material/Article';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { toast } from "sonner";
import API from "../../../api/axios";

const PatentApprovalDetail = ({ id, onBack, role }) => {
    const [data, setData] = useState(null);
    const r = typeof role !== 'undefined' ? role : (typeof effectiveRole !== 'undefined' ? effectiveRole : '');
    const isDean = r === 'RESEARCH_DEAN';
    const isCoordinator = r === 'RESEARCH_COORDINATOR';
    const isResearchAdmin = isDean || isCoordinator;
    const isHOD = !isResearchAdmin;
    const [loading, setLoading] = useState(true);
    const [remarks, setRemarks] = useState("");
    const [approvedAmount, setApprovedAmount] = useState("");
    const [appraisalEligible, setAppraisalEligible] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [imgError, setImgError] = useState(false);
    const [isEditingDetails, setIsEditingDetails] = useState(false);
    const [editableData, setEditableData] = useState({});
    const [detailsSaving, setDetailsSaving] = useState(false);
    const [decisionMode, setDecisionMode] = useState(null);

    const handleStartEdit = () => {
        const formatDateForInput = (d) => {
            if (!d) return "";
            try {
                const dateObj = new Date(d);
                if (isNaN(dateObj.getTime())) return "";
                return dateObj.toISOString().split('T')[0];
            } catch {
                return "";
            }
        };

        setEditableData({
            area: data.area || "",
            applicationNo: data.applicationNo || data.filingNo || "",
            dateOfFiling: formatDateForInput(data.dateOfFiling),
            patentStatus: data.patentStatus || "Published",
            publishedDate: formatDateForInput(data.published?.publisheddate || data.dateOfPublished),
            grantedDate: formatDateForInput(data.granted?.granteddate || data.dateOfGranted),
            applyIncentive: data.applyIncentive || "No",
            applyingSeedGrant: data.applyingSeedGrant || "No",
            approvedAmount: data.approvedAmount !== undefined && data.approvedAmount !== null ? data.approvedAmount : "",
        });
        setIsEditingDetails(true);
    };

    const handleSaveDetails = async () => {
        setDetailsSaving(true);
        try {
            const payload = { ...editableData };
            if (payload.applicationNo) {
                payload.filingNo = payload.applicationNo;
            }
            if (payload.publishedDate) {
                payload.publisheddate = payload.publishedDate;
                payload.dateOfPublished = payload.publishedDate;
            }
            if (payload.grantedDate) {
                payload.granteddate = payload.grantedDate;
                payload.dateOfGranted = payload.grantedDate;
            }
            if (payload.approvedAmount !== undefined && payload.approvedAmount !== "") {
                payload.approvedAmount = Number(payload.approvedAmount);
            }

            const res = await API.put(`/api/hod/research-requests/patent/${data._id}`, payload);
            if (res.data?.success) {
                const freshRes = await API.get(`/api/research/patent/${data._id}`);
                const updated = freshRes.data?.data || res.data.data;
                setData(updated);
                if (updated.approvedAmount !== undefined) {
                    setApprovedAmount(updated.approvedAmount);
                }
                setIsEditingDetails(false);
                toast.success("Patent details updated successfully");
            }
        } catch (err) {
            console.error("Failed to update patent details", err);
            toast.error(err.response?.data?.message || "Failed to update patent details");
        } finally {
            setDetailsSaving(false);
        }
    };

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await API.get(`/api/research/patent/${id}`);
                if (res.data?.success) {
                    setData(res.data.data);
                    if (isResearchAdmin) {
                        if (res.data.data.rndComment) setRemarks(res.data.data.rndComment);
                    } else {
                        if (res.data.data.hodComment) setRemarks(res.data.data.hodComment);
                    }
                    if (res.data.data.approvedAmount) setApprovedAmount(res.data.data.approvedAmount);
                    if (res.data.data.appraisalEligible) setAppraisalEligible(res.data.data.appraisalEligible);
                }
            } catch (error) {
                console.error("Failed to fetch patent details", error);
                toast.error(error.response?.data?.message || "Failed to load details");
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    const handleAction = async (action) => {
        if (!remarks && action === 'Reject') {
            toast.error('Remarks are required for rejection');
            return;
        }

        if (action === 'Approve') {
            if (isResearchAdmin && data.applyIncentive === 'Yes' && (!approvedAmount || Number(approvedAmount) <= 0)) {
                toast.error('Please enter a valid approved incentive amount');
                return;
            }
            if (isResearchAdmin && !appraisalEligible) {
                toast.error('Please select Appraisal Eligible status');
                return;
            }
        }

        setActionLoading(true);
        try {
            const endpoint = isResearchAdmin ? `/api/research/patent/rnd-action/${id}` : `/api/research/patent/hod-action/${id}`;
            const res = await API.put(endpoint, {
                action,
                comment: remarks,
                approvedAmount: isResearchAdmin && action === 'Approve' && data.applyIncentive === 'Yes' ? approvedAmount : undefined,
                appraisalEligible: isResearchAdmin && action === 'Approve' ? (appraisalEligible || undefined) : undefined
            });
            if (res.data?.success) {
                toast.success(`Request ${action === 'Approve' ? (isHOD ? 'Forwarded to R&D' : 'Approved') : 'Rejected'} successfully`);
                onBack(); 
            }
        } catch (error) {
            console.error("Action failed", error);
            toast.error(error.response?.data?.message || "Action failed. Please try again.");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return null;
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
            <Box key={index} sx={{ minWidth: 0 }}>
                <Box sx={{ mb: 1, display: "flex", justifyContent: "space-between", alignItems: "center", minWidth: 0 }}>
                    <Typography variant="subtitle2" noWrap sx={{ fontWeight: 800, color: "var(--color-primary)", fontSize: "0.75rem", textTransform: "uppercase" }}>
                        {index}. {title}
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
            </Box>
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
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ color: "var(--color-primary)", fontWeight: 700, textTransform: "none" }}>Back to Request List</Button>
            </Box>

            {/* Header Card */}
            <Card sx={cardStyle}>
                <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "center", sm: "flex-start" }, gap: 2, mb: 4 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Box sx={{ width: 50, height: 50, borderRadius: "50%", bgcolor: "rgba(190, 147, 55, 0.1)", color: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}><DescriptionIcon /></Box>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>{data.title}</Typography>

                        </Box>
                    </Box>
                    <Box sx={{ textAlign: { xs: "center", sm: "right" } }}>
                        <Box sx={{ display: "flex", gap: 1, justifyContent: { xs: "center", sm: "flex-end" }, flexWrap: "wrap", mb: 1 }}>
                            {data.isInstitutionRecord === 'Yes' && (
                                <Chip 
                                    label="Institution Record" 
                                    sx={{ 
                                        bgcolor: "rgba(2, 136, 209, 0.12)", 
                                        color: "#0288d1", 
                                        fontWeight: 800, 
                                        borderRadius: "8px", 
                                        textTransform: "uppercase", 
                                        fontSize: "0.65rem",
                                        border: "1px solid rgba(2, 136, 209, 0.3)"
                                    }} 
                                />
                            )}
                            {(data.entryType === 'Admin' || data.isDirectEntry === 'true' || data.isDirectEntry === true) && (
                                <Chip 
                                    label="R&D Direct Entry" 
                                    sx={{ 
                                        bgcolor: "rgba(124, 58, 237, 0.12)", 
                                        color: "#7c3aed", 
                                        fontWeight: 800, 
                                        borderRadius: "8px", 
                                        textTransform: "uppercase", 
                                        fontSize: "0.65rem",
                                        border: "1px solid rgba(124, 58, 237, 0.3)"
                                    }} 
                                />
                            )}
                            <Chip label="Patent Application" sx={{ bgcolor: "rgba(22, 101, 52, 0.1)", color: "#2e7d32", fontWeight: 800, borderRadius: "8px", textTransform: "uppercase", fontSize: "0.65rem" }} />
                        </Box>
                        <Typography variant="caption" sx={{ display: "block", mt: 1, color: "var(--text-secondary)", fontWeight: 700 }}>Submitted on {new Date(data.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</Typography>
                    </Box>
                </Box>

                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, width: "100%" }}>
                    <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 23%" } }}>
                        <LabelValue label="Academic Year" value={data.academicYear?.year} />
                    </Box>
                    <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 23%" } }}>
                        <LabelValue label="Reference ID" value={`PAT-${new Date(data.createdAt).getFullYear()}-${data._id.substring(data._id.length - 6).toUpperCase()}`} />
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
                            <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 900, fontSize: "0.65rem", mb: 0.5 }}>Status</Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: statusStyle.dot, boxShadow: `0 0 10px ${statusStyle.dot}` }} />
                                <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)" }}>{data.status}</Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Card>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mb: 3 }}>
                {/* Applicant Info */}
                <Card sx={{ ...cardStyle, flex: { xs: "1 1 100%", lg: "1 1 48%" }, mb: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}><PersonIcon sx={{ color: "var(--color-primary)" }} /><Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Applicant Information</Typography></Box>
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
                            <LabelValue label="Parent Department" value={facultyId?.coreDepartment?.name} horizontal />
                            <LabelValue label="Emp ID" value={facultyId?.institutionId} horizontal />
                            <LabelValue label="Contact" value={facultyId?.phone} horizontal />
                            <LabelValue label="College" value={facultyId?.college || "Aditya University"} horizontal />
                        </Box>
                    </Box>
                </Card>

                {/* Patent Details */}
                <Card sx={{ ...cardStyle, flex: { xs: "1 1 100%", lg: "1 1 48%" }, mb: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <ArticleIcon sx={{ color: "var(--color-primary)" }} />
                            <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                                Patent Details
                            </Typography>
                        </Box>
                        {isResearchAdmin && (
                            !isEditingDetails ? (
                                <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<EditIcon />}
                                    onClick={handleStartEdit}
                                    sx={{
                                        borderRadius: "8px",
                                        textTransform: "none",
                                        fontWeight: 700,
                                        borderColor: "var(--color-primary)",
                                        color: "var(--color-primary)",
                                        "&:hover": {
                                            borderColor: "var(--color-primary)",
                                            bgcolor: "rgba(190, 147, 55, 0.08)"
                                        }
                                    }}
                                >
                                    Edit
                                </Button>
                            ) : (
                                <Box sx={{ display: "flex", gap: 1 }}>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        color="error"
                                        disabled={detailsSaving}
                                        onClick={() => setIsEditingDetails(false)}
                                        sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 700 }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="contained"
                                        color="success"
                                        startIcon={<SaveIcon />}
                                        disabled={detailsSaving}
                                        onClick={handleSaveDetails}
                                        sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 700 }}
                                    >
                                        {detailsSaving ? "Saving..." : "Save"}
                                    </Button>
                                </Box>
                            )
                        )}
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                        {[
                            ...((data.entryType === 'Admin' || data.isDirectEntry === 'true' || data.isDirectEntry === true) ? [{
                                key: "entryType",
                                label: "Entry Source",
                                value: "R&D Direct Entry",
                                editable: false,
                                chip: (
                                    <Chip 
                                        label="R&D Direct Entry" 
                                        size="small" 
                                        sx={{ 
                                            bgcolor: "rgba(124, 58, 237, 0.1)", 
                                            color: "#7c3aed", 
                                            fontWeight: 800, 
                                            border: "1px solid rgba(124, 58, 237, 0.3)" 
                                        }} 
                                    />
                                )
                            }] : []),
                            { 
                                key: "isInstitutionRecord", 
                                label: "Institution Record", 
                                value: data.isInstitutionRecord || "No", 
                                editable: false, 
                                chip: (
                                    <Chip 
                                        label={data.isInstitutionRecord === 'Yes' ? 'Yes (Institution Record)' : 'No'} 
                                        size="small" 
                                        sx={{ 
                                            bgcolor: data.isInstitutionRecord === 'Yes' ? "rgba(2, 136, 209, 0.1)" : "var(--bg-panel)", 
                                            color: data.isInstitutionRecord === 'Yes' ? "#0288d1" : "var(--text-secondary)", 
                                            fontWeight: 800, 
                                            border: "1px solid", 
                                            borderColor: data.isInstitutionRecord === 'Yes' ? "rgba(2, 136, 209, 0.3)" : "var(--border-color)" 
                                        }} 
                                    />
                                )
                            },
                            { 
                                key: "patentFiledInInstitution", 
                                label: "Filed in Institution Name", 
                                value: data.patentFiledInInstitution || "Yes", 
                                editable: false, 
                                chip: (
                                    <Chip 
                                        label={data.patentFiledInInstitution === 'No' ? 'No (Personal / Individual)' : 'Yes (Institution Name)'} 
                                        size="small" 
                                        sx={{ 
                                            bgcolor: data.patentFiledInInstitution === 'No' ? "rgba(255, 152, 0, 0.1)" : "rgba(76, 175, 80, 0.1)", 
                                            color: data.patentFiledInInstitution === 'No' ? "#e65100" : "#1b5e20", 
                                            fontWeight: 800, 
                                            border: "1px solid", 
                                            borderColor: data.patentFiledInInstitution === 'No' ? "#ffe0b2" : "#c8e6c9" 
                                        }} 
                                    />
                                )
                            },
                            { 
                                key: "patentName", 
                                label: "Name of Applicant in Patent", 
                                value: data.patentName || "-", 
                                editable: false 
                            },
                            { key: "area", label: "Area of Patent", value: data.area || "-", editable: true, type: "text" },
                            { key: "applicationNo", label: "Application No", value: data.applicationNo || data.filingNo || "-", editable: true, type: "text" },
                            { 
                                key: "dateOfFiling", 
                                label: "Date of Filing", 
                                value: data.dateOfFiling ? new Date(data.dateOfFiling).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-", 
                                editable: true, 
                                type: "date" 
                            },
                            { 
                                key: "patentStatus", 
                                label: "Patent Status", 
                                value: data.patentStatus || "-", 
                                editable: true, 
                                type: "select", 
                                options: ["Published", "Granted"] 
                            },
                            ...((isEditingDetails ? (editableData.patentStatus === 'Published' || editableData.patentStatus === 'Granted') : (data.patentStatus === 'Published' || data.patentStatus === 'Granted')) ? [{
                                key: "publishedDate",
                                label: "Date of Publication",
                                value: (data.published?.publisheddate || data.dateOfPublished) ? new Date(data.published?.publisheddate || data.dateOfPublished).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-",
                                editable: true,
                                type: "date"
                            }] : []),
                            ...((isEditingDetails ? editableData.patentStatus === 'Granted' : data.patentStatus === 'Granted') ? [{
                                key: "grantedDate",
                                label: "Date of Grant",
                                value: (data.granted?.granteddate || data.dateOfGranted) ? new Date(data.granted?.granteddate || data.dateOfGranted).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-",
                                editable: true,
                                type: "date"
                            }] : []),
                            { 
                                key: "applyIncentive", 
                                label: "Incentive", 
                                value: data.applyIncentive || "No", 
                                editable: true, 
                                type: "select", 
                                options: ["Yes", "No"],
                                chip: !isEditingDetails && (
                                    <Chip 
                                        label={data.applyIncentive || "No"} 
                                        size="small" 
                                        sx={{ 
                                            bgcolor: data.applyIncentive === 'Yes' ? "rgba(76, 175, 80, 0.1)" : "var(--bg-panel)", 
                                            color: data.applyIncentive === 'Yes' ? "#4caf50" : "var(--text-secondary)", 
                                            fontWeight: 800, 
                                            border: "1px solid", 
                                            borderColor: data.applyIncentive === 'Yes' ? "#4caf5044" : "var(--border-color)" 
                                        }} 
                                    />
                                )
                            },
                            { 
                                key: "applyingSeedGrant", 
                                label: "Seed Grant Work", 
                                value: data.applyingSeedGrant || "No", 
                                editable: true, 
                                type: "select", 
                                options: ["Yes", "No"] 
                            },
                            { 
                                key: "estimatedIncentiveAmount", 
                                label: "Estimated Incentive", 
                                value: (() => {
                                    const current = isEditingDetails ? editableData : data;
                                    if (current.applyIncentive === "No" || current.isUtilityType === "No") return "₹0";
                                    let base = current.patentStatus === "Published" ? 5000 : (current.patentStatus === "Granted" ? 15000 : 0);
                                    if (!isEditingDetails) {
                                        if (current.patentStatus === "Published" && current.published?.publishedexpectedamount) {
                                            base = current.published.publishedexpectedamount;
                                        } else if (current.patentStatus === "Granted" && current.granted?.grantedexpectedamount) {
                                            base = current.granted.grantedexpectedamount;
                                        }
                                    }
                                    if (current.applyingSeedGrant === "Yes") {
                                        base = base / 2;
                                    }
                                    return base > 0 ? `₹${base.toLocaleString('en-IN')}` : "₹0";
                                })(), 
                                editable: false, 
                                type: "text" 
                            },
                            { 
                                key: "approvedAmount", 
                                label: "Approved Incentive Amount", 
                                value: data.approvedAmount ? `₹${Number(data.approvedAmount).toLocaleString('en-IN')}` : "-", 
                                editable: true, 
                                type: "number" 
                            }
                        ].map((item, idx, arr) => (
                            <Box key={idx} sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                p: "10px 16px",
                                borderBottom: idx === arr.length - 1 ? "none" : "1px solid var(--border-color)",
                                transition: "all 0.3s ease",
                                "&:hover": { bgcolor: "rgba(190, 147, 55, 0.05)" }
                            }}>
                                <Typography variant="caption" sx={{
                                    flex: { xs: "0 0 130px", sm: "0 0 170px" },
                                    color: "var(--color-primary)",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.08em",
                                    fontWeight: 900,
                                    fontSize: "0.65rem",
                                    display: "inline-block",
                                    opacity: 0.9
                                }}>
                                    {item.label}
                                </Typography>
                                <Box sx={{ flex: 1 }}>
                                    {isEditingDetails && item.editable ? (
                                        item.type === "select" ? (
                                            <Select
                                                size="small"
                                                fullWidth
                                                value={editableData[item.key] ?? ""}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    const updates = { [item.key]: val };
                                                    if (item.key === "patentFiledInInstitution" && val === "Yes" && !["Aditya University", "Aditya College of Pharmacy"].includes(editableData.patentName)) {
                                                        updates.patentName = "Aditya University";
                                                    }
                                                    setEditableData(prev => ({ ...prev, ...updates }));
                                                }}
                                                sx={{ minWidth: 120, height: 32, fontSize: "0.875rem" }}
                                            >
                                                {item.options.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                                            </Select>
                                        ) : item.type === "date" ? (
                                            <TextField
                                                size="small"
                                                fullWidth
                                                type="date"
                                                value={editableData[item.key] ?? ""}
                                                onChange={(e) => setEditableData(prev => ({ ...prev, [item.key]: e.target.value }))}
                                                InputLabelProps={{ shrink: true }}
                                                sx={{ "& .MuiInputBase-root": { height: 32, fontSize: "0.875rem" } }}
                                            />
                                        ) : (
                                            <TextField
                                                size="small"
                                                fullWidth
                                                type={item.type === "number" ? "number" : "text"}
                                                value={editableData[item.key] ?? ""}
                                                onChange={(e) => setEditableData(prev => ({ ...prev, [item.key]: e.target.value }))}
                                                sx={{ "& .MuiInputBase-root": { height: 32, fontSize: "0.875rem" } }}
                                            />
                                        )
                                    ) : (
                                        item.chip ? item.chip : (
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.9rem", wordBreak: "break-word" }}>
                                                {item.value || "-"}
                                            </Typography>
                                        )
                                    )}
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </Card>
            </Box>

            {/* Co-Inventors */}
            {(() => {
                const filteredCoInventors = (data.coInventors || []).filter((ca) => {
                    const isApplicantName = ca.name && facultyId?.name && ca.name.trim().toLowerCase() === facultyId.name.trim().toLowerCase();
                    const isApplicantEmpId = ca.empId && facultyId?.institutionId && String(ca.empId).trim() === String(facultyId.institutionId).trim();
                    return !isApplicantName && !isApplicantEmpId;
                });

                if (filteredCoInventors.length === 0) return null;

                return (
                    <Card sx={{ ...cardStyle, p: 0, overflow: "hidden", mb: 3 }}>
                        <Box sx={{ p: 3, pb: 2 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                <GroupsIcon sx={{ color: "var(--color-primary)" }} />
                                <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Co-Inventors Details</Typography>
                                <Box sx={{ ml: 'auto', px: 1.5, py: 0.5, borderRadius: '20px', bgcolor: 'rgba(190,147,55,0.12)', border: '1px solid rgba(190,147,55,0.3)' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 900, color: 'var(--color-primary)', fontSize: '0.7rem' }}>
                                        Total: {filteredCoInventors.length} Co-Inventor{filteredCoInventors.length > 1 ? 's' : ''}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                        <TableContainer>
                            <Table>
                                <TableHead sx={{ bgcolor: "var(--bg-panel)" }}>
                                    <TableRow>
                                        <TableCell sx={{ color: "var(--text-secondary)", fontWeight: 800, fontSize: "0.7rem", textTransform: "uppercase", width: 80 }}>POSITION</TableCell>
                                        <TableCell sx={{ color: "var(--text-secondary)", fontWeight: 800, fontSize: "0.7rem", textTransform: "uppercase" }}>NAME</TableCell>
                                        <TableCell sx={{ color: "var(--text-secondary)", fontWeight: 800, fontSize: "0.7rem", textTransform: "uppercase" }}>INVENTOR TYPE</TableCell>
                                        <TableCell sx={{ color: "var(--text-secondary)", fontWeight: 800, fontSize: "0.7rem", textTransform: "uppercase" }}>AFFILIATION</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredCoInventors.map((ca, i) => {
                                        const rawType = ca.CoInventorType || ca.CoAuthorType || (ca.studentId ? "student" : "faculty");
                                        const displayType = rawType.charAt(0).toUpperCase() + rawType.slice(1);
                                        const isStudent = rawType.toLowerCase() === "student";

                                        return (
                                            <TableRow key={i} sx={{ '&:hover': { bgcolor: 'rgba(190,147,55,0.04)' } }}>
                                                <TableCell>
                                                    <Box sx={{
                                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                        width: 32, height: 32, borderRadius: '50%',
                                                        bgcolor: 'rgba(190, 147, 55, 0.12)', border: '1.5px solid var(--color-primary)',
                                                        color: 'var(--color-primary)', fontWeight: 900, fontSize: '0.85rem'
                                                    }}>
                                                        {ca.inventorPosition || ca.authorPosition || (i + 1)}
                                                    </Box>
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 700, color: "var(--text-primary)" }}>{ca.name}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={displayType}
                                                        size="small"
                                                        sx={{
                                                            fontWeight: 700,
                                                            fontSize: '0.7rem',
                                                            bgcolor: isStudent ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                                            color: isStudent ? '#2563eb' : '#059669',
                                                            border: '1px solid',
                                                            borderColor: isStudent ? 'rgba(59, 130, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)'
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 600, color: "var(--text-secondary)" }}>{ca.affiliation || "-"}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Card>
                );
            })()}

            {/* Documents */}
            <Card sx={cardStyle}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}><AttachFileIcon sx={{ color: "var(--color-primary)" }} /><Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Attached Documents</Typography></Box>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" }, gap: 3 }}>
                    {renderFilePreview("e-Filing Receipt", data.cbr, 1)}
                    {renderFilePreview("Form - 1", data.form1, 2)}
                    {data.grantedCertificate && renderFilePreview("Granted Certificate", data.grantedCertificate, 3)}
                </Box>
            </Card>

            {/* Actions */}
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mt: 3 }}>
                {data.hodComment && <Box sx={{ flex: 1, minWidth: 300 }}><Card sx={{ ...cardStyle, borderLeft: "4px solid #ffc107", height: "100%", mb: 0 }}><Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}><HistoryIcon sx={{ color: "#ffc107" }} /><Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>HOD Review</Typography></Box><Box sx={{ p: 2, bgcolor: "rgba(255, 193, 7, 0.05)", borderRadius: "10px", border: "1px solid #ffc10733" }}><Typography variant="body2" sx={{ fontStyle: "italic", fontWeight: 600 }}>"{data.hodComment}"</Typography></Box></Card></Box>}
                
                <Box sx={{ flex: 1, minWidth: 350 }}>
                    {((isResearchAdmin && data.status === 'Pending at R&D') || (isHOD && data.status === 'Pending')) ? (
                        <Card sx={{ ...cardStyle, borderTop: "4px solid var(--color-primary)", mb: 0 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}><GavelIcon sx={{ color: "var(--color-primary)" }} /><Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Review Decision</Typography></Box>
                            
                            <Typography variant="body2" sx={{ color: "var(--text-secondary)", mb: 3 }}>
                                Please review the details above and choose an action to proceed with this patent submission.
                            </Typography>

                            {!decisionMode ? (
                                <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-start" }}>
                                    <Button variant="outlined" color="error" disabled={actionLoading} onClick={() => setDecisionMode('Reject')} sx={{ px: 3, textTransform: "none", fontWeight: 700, borderRadius: "10px" }}>Reject</Button>
                                    <Button variant="contained" color="success" disabled={actionLoading} onClick={() => setDecisionMode('Approve')} sx={{ px: 4, textTransform: "none", fontWeight: 700, borderRadius: "10px" }}>{isHOD ? "Approve & Forward" : "Final Approve"}</Button>
                                </Box>
                            ) : (
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                    {decisionMode === 'Approve' && isResearchAdmin && (
                                        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                                            {data.applyIncentive === 'Yes' && (
                                                <Box sx={{ flex: "1 1 200px" }}>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1, color: "var(--color-primary)", fontSize: "0.75rem" }}>APPROVED INCENTIVE AMOUNT (₹) *</Typography>
                                                    <TextField 
                                                        fullWidth size="small" type="number" 
                                                        placeholder="Enter approved incentive amount" 
                                                        value={approvedAmount} 
                                                        onChange={e => setApprovedAmount(e.target.value)} 
                                                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: "var(--bg-panel)" } }} 
                                                    />
                                                </Box>
                                            )}
                                            <Box sx={{ flex: "1 1 200px" }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1, color: "var(--color-primary)", fontSize: "0.75rem" }}>ARTICLE ELIGIBILITY FOR APPRAISAL *</Typography>
                                                <Select fullWidth size="small" value={appraisalEligible} onChange={e => setAppraisalEligible(e.target.value)} displayEmpty sx={{ borderRadius: "10px", bgcolor: "var(--bg-panel)" }}>
                                                    <MenuItem value="" disabled>Select Eligibility</MenuItem>
                                                    <MenuItem value="Yes">Yes</MenuItem>
                                                    <MenuItem value="No">No</MenuItem>
                                                </Select>
                                            </Box>
                                        </Box>
                                    )}

                                    <Box>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1, color: "var(--color-primary)", fontSize: "0.75rem" }}>REMARKS {decisionMode === 'Reject' ? '*' : '(OPTIONAL)'}</Typography>
                                        <TextField 
                                            fullWidth multiline rows={3} 
                                            placeholder={`Provide your ${decisionMode.toLowerCase()} comments...`} 
                                            value={remarks} 
                                            onChange={e => setRemarks(e.target.value)} 
                                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: "var(--bg-panel)" } }} 
                                        />
                                    </Box>

                                    <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 1 }}>
                                        <Button variant="outlined" color="inherit" onClick={() => setDecisionMode(null)} sx={{ px: 3 }}>Cancel</Button>
                                        <Button
                                            variant="contained"
                                            color={decisionMode === 'Reject' ? "error" : "success"}
                                            disabled={actionLoading}
                                            onClick={() => handleAction(decisionMode)}
                                            sx={{ px: 4 }}
                                        >
                                            {decisionMode === 'Reject' ? "Confirm Reject" : "Approve"}
                                        </Button>
                                    </Box>
                                </Box>
                            )}
                        </Card>
                    ) : (
                        <Card sx={{ ...cardStyle, p: 4, textAlign: "center", mb: 0 }}>
                            <Typography variant="h6" color="var(--text-secondary)" sx={{ fontWeight: 800 }}>Request already processed</Typography>
                            <Typography variant="body2" sx={{ mt: 1, fontWeight: 700 }}>Current Status: <span style={{ color: statusStyle.color }}>{data.status}</span></Typography>
                            {data.rndComment && (
                                <Box sx={{ mt: 3, textAlign: "left", p: 2, bgcolor: "rgba(16, 185, 129, 0.05)", borderRadius: "10px", border: "1px solid #10b98133" }}>
                                    <Typography variant="caption" sx={{ fontWeight: 900, color: "#10b981", textTransform: "uppercase" }}>R&D Remarks:</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>"{data.rndComment}"</Typography>
                                    {data.approvedAmount && <Typography variant="h6" sx={{ mt: 2, fontWeight: 900, color: "#10b981" }}>Approved: ₹{data.approvedAmount}</Typography>}
                                </Box>
                            )}
                        </Card>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default PatentApprovalDetail;
