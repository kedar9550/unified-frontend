import Loader from "../../../components/common/Loader";
import React, { useState, useEffect } from "react";
import {
    Box, Typography, Grid, Card, Button, TextField,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Stack, Select, MenuItem,
    Dialog, DialogTitle, DialogContent, DialogActions
} from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import DescriptionIcon from '@mui/icons-material/Description';
import GroupsIcon from '@mui/icons-material/Groups';
import HistoryIcon from '@mui/icons-material/History';
import GavelIcon from '@mui/icons-material/Gavel';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DownloadIcon from '@mui/icons-material/Download';
import SaveIcon from '@mui/icons-material/Save';

import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Avatar from "@mui/material/Avatar";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlined";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import DonutLargeIcon from "@mui/icons-material/DonutLarge";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import LinkIcon from "@mui/icons-material/Link";
import GrassIcon from "@mui/icons-material/Grass";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import ArticleIcon from "@mui/icons-material/Article";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import CloseIcon from "@mui/icons-material/Close";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import PublicIcon from "@mui/icons-material/Public";
import EditIcon from "@mui/icons-material/Edit";

const SDG_COLOR_MAP = {
    1: { code: "SDG-1", label: "SDG-1: No Poverty", color: "#E5243B" },
    2: { code: "SDG-2", label: "SDG-2: Zero Hunger", color: "#DDA83A" },
    3: { code: "SDG-3", label: "SDG-3: Good Health & Well-Being", color: "#4C9F38" },
    4: { code: "SDG-4", label: "SDG-4: Quality Education", color: "#C5192D" },
    5: { code: "SDG-5", label: "SDG-5: Gender Equality", color: "#FF3A21" },
    6: { code: "SDG-6", label: "SDG-6: Clean Water And Sanitation", color: "#26BDE2" },
    7: { code: "SDG-7", label: "SDG-7: Affordable And Clean Energy", color: "#FCC30B" },
    8: { code: "SDG-8", label: "SDG-8: Decent Work And Economic Growth", color: "#A21942" },
    9: { code: "SDG-9", label: "SDG-9: Industry, Innovation And Infrastructure", color: "#FD6925" },
    10: { code: "SDG-10", label: "SDG-10: Reduced Inequalities", color: "#DD1367" },
    11: { code: "SDG-11", label: "SDG-11: Sustainable Cities And Communities", color: "#FD9D24" },
    12: { code: "SDG-12", label: "SDG-12: Responsible Consumption And Production", color: "#BF8B2E" },
    13: { code: "SDG-13", label: "SDG-13: Climate Action", color: "#3F7E44" },
    14: { code: "SDG-14", label: "SDG-14: Life Below Water", color: "#0A97D9" },
    15: { code: "SDG-15", label: "SDG-15: Life On Land", color: "#56C02B" },
    16: { code: "SDG-16", label: "SDG-16: Peace, Justice And Strong Institutions", color: "#00689D" },
    17: { code: "SDG-17", label: "SDG-17: Partnerships For The Goals", color: "#19486A" }
};

import { toast } from "sonner";
import API from "../../../api/axios";
import EditResearchDetailsDialog from "./EditResearchDetailsDialog";

const ConferenceApprovalDetails = ({ id, onBack, role }) => {
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
    const [sdgList, setSdgList] = useState([]);

    useEffect(() => {
        const fetchSdgs = async () => {
            try {
                const res = await API.get('/api/sdgs');
                if (res.data?.success) setSdgList(res.data.data);
            } catch (error) {
                console.error("Failed to fetch SDGs:", error);
            }
        };
        fetchSdgs();
    }, []);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await API.get(`/api/research/conference/${id}`);
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
                console.error("Failed to fetch conference details", error);
                toast.error(error.response?.data?.message || "Failed to load details");
            } finally {
                loading && setLoading(false);
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
            const endpoint = isResearchAdmin ? `/api/research/conference/rnd-action/${id}` : `/api/research/conference/hod-action/${id}`;
            const res = await API.put(endpoint, {
                action,
                comment: remarks,
                approvedAmount: isResearchAdmin && action === 'Approve' && data.applyIncentive === 'Yes' ? approvedAmount : undefined,
                appraisalEligible: isResearchAdmin && action === 'Approve' ? (appraisalEligible || undefined) : undefined
            });
            if (res.data?.success) {
                toast.success(`Request ${action === 'Approve' ? (isHOD ? 'Forwarded to R&D' : 'Approved') : 'Rejected'} successfully`);
                setDecisionMode(null);
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

    const renderFilePreview = (title, filepath, index) => {
        if (!filepath) return null;
        const backendURL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "");
        const fileUrl = filepath.startsWith('http') ? filepath : `${backendURL}${filepath}`;
        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(filepath);

        return (
            <Grid key={index} item xs={12} sm={6} md={3}>
                <Box sx={{ mb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "var(--color-primary)", fontSize: "0.75rem", textTransform: "uppercase" }}>
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
            </Grid>
        );
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



    return (
        <Box sx={{ width: "100%", pb: 5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ color: "var(--color-primary)", fontWeight: 700, textTransform: "none" }}>Back to Request List</Button>
            </Box>


            {/* Top Header Box */}
            <Card sx={{ ...cardStyle, mb: 3, p: 3 }}>
                <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                        <Box sx={{
                            width: 48, height: 48, borderRadius: "12px", bgcolor: "rgba(0, 78, 146, 0.08)",
                            color: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center",
                            border: "1px solid rgba(0, 78, 146, 0.15)", flexShrink: 0, mt: 0.5
                        }}>
                            <DescriptionIcon sx={{ fontSize: 26 }} />
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.3 }}>
                                {data.title}
                            </Typography>
                            <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 600, mt: 0.5 }}>
                                Conference: {data.conferenceName}
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0, flexWrap: "wrap" }}>
                        <Chip
                            icon={
                                /approved/i.test(data.status) ? <CheckCircleOutlineIcon sx={{ fontSize: "16px !important", color: "inherit" }} /> :
                                /reject/i.test(data.status) ? <CloseIcon sx={{ fontSize: "16px !important", color: "inherit" }} /> :
                                <AccessTimeIcon sx={{ fontSize: "16px !important", color: "inherit" }} />
                            }
                            label={data.status || "Pending at HOD"}
                            sx={{
                                bgcolor: /approved/i.test(data.status) ? "rgba(46, 125, 50, 0.1)" : /reject/i.test(data.status) ? "rgba(211, 47, 47, 0.1)" : "rgba(237, 108, 2, 0.1)",
                                color: /approved/i.test(data.status) ? "#2e7d32" : /reject/i.test(data.status) ? "#d32f2f" : "#ed6c02",
                                border: `1px solid ${/approved/i.test(data.status) ? "rgba(46, 125, 50, 0.3)" : /reject/i.test(data.status) ? "rgba(211, 47, 47, 0.3)" : "rgba(237, 108, 2, 0.3)"}`,
                                fontWeight: 700,
                                borderRadius: "20px",
                                px: 1,
                                py: 0.5
                            }}
                        />
                    </Box>
                </Box>
            </Card>

            <Accordion
                sx={{
                    mb: 3,
                    borderRadius: "16px !important",
                    border: "1px solid var(--border-color)",
                    boxShadow: "none",
                    "&:before": { display: "none" },
                    background: "var(--bg-paper)",
                    overflow: "hidden"
                }}
            >
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "var(--text-secondary)" }} />} sx={{ p: 3, pb: 2, pt: 2 }}>
                    <Box sx={{ display: "flex", alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between", width: "100%", pr: { xs: 0, sm: 2 }, flexDirection: { xs: "column", sm: "row" }, gap: { xs: 2, sm: 0 } }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
                            <Avatar sx={{ width: 52, height: 52, bgcolor: "var(--color-primary)", fontSize: "1.2rem", fontWeight: 800, flexShrink: 0 }}>
                                {data.facultyId?.name?.charAt(0) || "A"}
                            </Avatar>
                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                <Typography variant="body1" sx={{ fontWeight: 800, color: "var(--text-primary)", wordBreak: "break-word" }}>
                                    {data.facultyId?.name || "Unknown Applicant"}
                                </Typography>
                                <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 600 }}>
                                    {data.facultyId?.designation || "Applicant"}
                                </Typography>
                            </Box>
                        </Box>
                        <Chip label="Applicant Details" size="small" sx={{ alignSelf: { xs: "flex-start", sm: "auto" }, fontWeight: 600, color: "var(--color-primary)", bgcolor: "rgba(0, 78, 146, 0.1)", borderRadius: "6px" }} />
                    </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ borderTop: "1px solid var(--border-color)", p: 0 }}>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                        {[
                            { label: "Institution ID / Emp ID", value: data.facultyId?.institutionId || "-", icon: <PersonOutlineIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                            { label: "Department", value: [data.facultyId?.coreDepartment?.name ? `${data.facultyId.coreDepartment.name} (Parent)` : null, data.facultyId?.department?.name ? `${data.facultyId.department.name} (Serving)` : null].filter(Boolean).join(" / ") || "-", icon: <GroupsIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                            { label: "College", value: data.facultyId?.college || data.college || "-", icon: <SchoolIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                            { label: "PAN Number", value: data.panNumber || data.facultyId?.panNumber || "-", icon: <CreditCardIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                            { label: "Contact Number", value: data.facultyId?.phone || data.facultyId?.contactNumber || "-", icon: <PersonIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> }
                        ].map((item, idx, arr) => (
                            <Box key={idx} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 1.6, borderBottom: idx === arr.length - 1 ? "none" : "1px solid var(--border-color)", "&:hover": { bgcolor: "rgba(0,0,0,0.015)" }, transition: "background 0.2s" }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                    {item.icon}
                                    <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.875rem" }}>
                                        {item.label}
                                    </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--text-primary)", textAlign: "right" }}>
                                    {item.value}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </AccordionDetails>
            </Accordion>

            {/* Main Grid: Left Column (Publication Details) + Right Column (SDGs) */}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1.3fr) minmax(0, 0.9fr)" }, gap: 3, mb: 3, width: "100%", alignItems: "flex-start" }}>
                {/* Left Column (Conference Details) */}
                <Box sx={{ minWidth: 0 }}>
                    <Card sx={{ ...cardStyle, p: 0, overflow: "hidden", mb: 0, display: "flex", flexDirection: "column" }}>
                        <Box sx={{ p: 3, pb: 2, borderBottom: "1px solid var(--border-color)" }}>
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                    <FormatListBulletedIcon sx={{ color: "var(--color-primary)" }} />
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                                        Conference Details
                                    </Typography>
                                </Box>
                                {isResearchAdmin && (
                                    isEditingDetails ? (
                                        <Box sx={{ display: "flex", gap: 1 }}>
                                            <Button size="small" variant="outlined" color="inherit" onClick={() => setIsEditingDetails(false)} disabled={detailsSaving}>Cancel</Button>
                                            <Button 
                                                size="small" 
                                                variant="contained" 
                                                color="primary" 
                                                startIcon={<SaveIcon />} 
                                                disabled={detailsSaving}
                                                onClick={async () => {
                                                    setDetailsSaving(true);
                                                    try {
                                                        const payload = { ...editableData };
                                                        if (!payload.presentationMode || payload.location !== "Abroad") {
                                                            delete payload.presentationMode;
                                                        }
                                                        const res = await API.put(`/api/hod/research-requests/conference/${data._id}`, payload);
                                                        if (res.data?.success) {
                                                            const freshRes = await API.get(`/api/research/conference/${data._id}`);
                                                            if (freshRes.data?.success) {
                                                                setData(freshRes.data.data);
                                                            } else {
                                                                setData(res.data.data);
                                                            }
                                                            setIsEditingDetails(false);
                                                            toast.success("Conference details updated successfully");
                                                        }
                                                    } catch (err) {
                                                        toast.error("Failed to update conference details");
                                                    } finally {
                                                        setDetailsSaving(false);
                                                    }
                                                }}
                                            >
                                                Save
                                            </Button>
                                        </Box>
                                    ) : (
                                        <Button 
                                            size="small" 
                                            variant="outlined" 
                                            startIcon={<EditIcon />}
                                            onClick={() => {
                                                setEditableData({
                                                    conferenceType: data.conferenceType || "",
                                                    scopusIndexed: data.scopusIndexed || "",
                                                    presentationMode: data.presentationMode || "",
                                                    location: data.location || "",
                                                    publisher: data.publisher || "",
                                                    issnIsbn: data.issnIsbn || "",
                                                    month: data.month || "",
                                                    year: data.year || "",
                                                    applyingSeedGrant: data.applyingSeedGrant || "No",
                                                    applyIncentive: data.applyIncentive || "No",
                                                    approvedAmount: data.approvedAmount || "",
                                                    userAuthorPosition: data.userAuthorPosition || 1,
                                                    totalAuthors: data.totalAuthors || 1,
                                                    coAuthors: data.coAuthors || [],
                                                    title: data.title || "",
                                                    conferenceName: data.conferenceName || ""
                                                });
                                                setIsEditingDetails(true);
                                            }}
                                            sx={{ borderRadius: "8px", textTransform: "none" }}
                                        >
                                            Edit
                                        </Button>
                                    )
                                )}
                            </Box>
                        </Box>
                        <Box sx={{ display: "flex", flexDirection: "column" }}>
                        {[
                            { key: "academicYear", label: "Academic Year", value: data.academicYear?.year || "-", icon: <CalendarTodayIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} />, editable: false },
                            { key: "doi", label: "DOI", value: data.doi || "-", icon: <LinkIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} />, editable: false },
                            { key: "userAuthorPosition", label: "Applicant Position", value: (
                                (() => {
                                    const pos = data.userAuthorPosition || 1;
                                    const total = data.totalAuthors || 1;
                                    return (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', bgcolor: 'rgba(190, 147, 55, 0.12)', border: '1.5px solid var(--color-primary)', color: 'var(--color-primary)', fontWeight: 900, fontSize: '0.85rem' }}>{pos}</Box>
                                            {total && (
                                                <>
                                                    <Typography sx={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.9rem' }}>of</Typography>
                                                    <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', px: 1.2, height: 28, borderRadius: '8px', bgcolor: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 900, fontSize: '0.85rem' }}>{total} Authors</Box>
                                                </>
                                            )}
                                        </Box>
                                    );
                                })()
                            ), icon: <PersonOutlineIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} />, editable: true, type: "number" },
                            { key: "conferenceType", label: "Conference Type", value: data.conferenceType || "-", icon: <MenuBookIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} />, editable: true, type: "select", options: ["IEEE", "IIT", "IISc", "NIT", "IIM", "Other"] },
                            { key: "scopusIndexed", label: "Scopus Indexed", value: data.scopusIndexed || "-", icon: <CheckCircleOutlineIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} />, editable: true, type: "select", options: ["Yes", "No"] },
                            { key: "location", label: "Location", value: data.location || "-", icon: <SchoolIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} />, editable: true, type: "select", options: ["India", "Abroad"] },
                            ...((isEditingDetails ? editableData.location === "Abroad" : data.location === "Abroad") ? [{ key: "presentationMode", label: "Presentation Mode", value: data.presentationMode || "-", icon: <PersonIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} />, editable: true, type: "select", options: ["Online", "Offline"] }] : []),
                            { key: "publisher", label: "Publisher", value: data.publisher || "-", icon: <ArticleIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} />, editable: true, type: "text" },
                            { key: "issnIsbn", label: "ISSN / ISBN", value: data.issnIsbn || "-", icon: <ArticleIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} />, editable: true, type: "text" },
                            { key: "month", label: "Publishing Date", value: `${data.month || ""} ${data.year || ""}`.trim() || "-", icon: <CalendarTodayIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} />, editable: true, type: "monthYear" },
                            { key: "applyingSeedGrant", label: "Seed Grant Work", value: data.applyingSeedGrant || "No", icon: <GrassIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} />, editable: true, type: "select", options: ["Yes", "No"] },
                            { key: "applyIncentive", label: "Apply For Incentive", value: data.applyIncentive || "No", icon: <CardGiftcardIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} />, editable: true, type: "select", options: ["Yes", "No"] },
                            { key: "estimatedIncentiveAmount", label: "Estimated Incentive", value: (() => {
                                const current = isEditingDetails ? editableData : data;
                                if (current.applyIncentive === "No") return "₹0";
                                if (current.location === "Abroad") return "__";
                                if (current.conferenceType === "Other") return "₹0";
                                let baseAmount = data.estimatedIncentiveAmount || 0;
                                if (data.applyingSeedGrant === "Yes") baseAmount = baseAmount * 2;
                                if (current.applyingSeedGrant === "Yes") return `₹${baseAmount / 2}`;
                                return baseAmount > 0 ? `₹${baseAmount}` : "Research committee decision";
                            })(), icon: <CurrencyRupeeIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} />, editable: false },
                            { key: "approvedAmount", label: "Approved Incentive Amount", value: data.approvedAmount || "-", icon: <CurrencyRupeeIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} />, editable: true, type: "number" }
                        ].map((item, idx, arr) => (
                            <Box key={idx} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 1.6, borderBottom: idx === arr.length - 1 ? "none" : "1px solid var(--border-color)", "&:hover": { bgcolor: "rgba(0,0,0,0.015)" }, transition: "background 0.2s" }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                    {item.icon}
                                    <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.875rem" }}>
                                        {item.label}
                                    </Typography>
                                </Box>
                                {isEditingDetails && item.editable ? (
                                    item.type === "select" ? (
                                        <Select
                                            size="small"
                                            value={editableData[item.key] || ""}
                                            onChange={(e) => setEditableData({ ...editableData, [item.key]: e.target.value })}
                                            sx={{ minWidth: 120, height: 32, fontSize: "0.875rem" }}
                                        >
                                            {item.options.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                                        </Select>
                                    ) : item.type === "monthYear" ? (
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Select
                                                size="small"
                                                value={editableData.month || ""}
                                                onChange={(e) => setEditableData({ ...editableData, month: e.target.value })}
                                                sx={{ minWidth: 100, height: 32, fontSize: "0.875rem" }}
                                            >
                                                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                                            </Select>
                                            <Select
                                                size="small"
                                                value={editableData.year || ""}
                                                onChange={(e) => setEditableData({ ...editableData, year: e.target.value })}
                                                sx={{ minWidth: 80, height: 32, fontSize: "0.875rem" }}
                                            >
                                                {Array.from({ length: 15 }, (_, i) => String(new Date().getFullYear() - 10 + i)).map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                                            </Select>
                                        </Box>
                                    ) : (
                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                            <TextField
                                                size="small"
                                                type={item.type === "number" ? "number" : "text"}
                                                value={editableData[item.key] || ""}
                                                onChange={(e) => setEditableData({ ...editableData, [item.key]: e.target.value })}
                                                sx={{ minWidth: 120, width: item.type === "number" ? 120 : 250, "& .MuiInputBase-root": { height: 32, fontSize: "0.875rem" } }}
                                                inputProps={item.type === "number" ? { step: "any" } : {}}
                                            />
                                        </Box>
                                    )
                                ) : item.chip ? (
                                    item.chip
                                ) : (
                                    <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--text-primary)", textAlign: "right", maxWidth: "55%", wordBreak: "break-word" }}>
                                        {item.value}
                                    </Typography>
                                )}
                            </Box>
                        ))}
                        </Box>
                    </Card>
                </Box>

                {/* Right Column (SDGs) */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                    <Card sx={{ ...cardStyle, p: 0, overflow: "hidden", mb: 0, display: "flex", flexDirection: "column", height: "100%" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 2, borderBottom: "1px solid var(--border-color)", flexShrink: 0 }}>
                            <Box sx={{ width: 28, height: 28, borderRadius: "50%", background: "conic-gradient(#E5243B 0deg 21deg, #DDA83A 21deg 42deg, #4C9F38 42deg 63deg, #C5192D 63deg 84deg, #FF3A21 84deg 105deg, #26BDE2 105deg 126deg, #FCC30B 126deg 147deg, #A21942 147deg 168deg, #FD6925 168deg 189deg, #DD1367 189deg 210deg, #FD9D24 210deg 231deg, #BF8B2E 231deg 252deg, #3F7E44 252deg 273deg, #0A97D9 273deg 294deg, #56C02B 294deg 315deg, #00689D 315deg 336deg, #19486A 336deg 360deg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "var(--bg-paper)" }} />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                                SDGs Matched
                            </Typography>
                        </Box>
                        <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.25, flex: 1, minHeight: 0, overflowY: "auto",
                            "&::-webkit-scrollbar": { width: "5px" },
                            "&::-webkit-scrollbar-track": { background: "rgba(0, 0, 0, 0.03)", borderRadius: "10px" },
                            "&::-webkit-scrollbar-thumb": { background: "rgba(0, 0, 0, 0.15)", borderRadius: "10px", "&:hover": { background: "var(--color-primary)" } }
                        }}>
                            {(() => {
                                const numbers = data.sdgs ? String(data.sdgs).match(/\d+/g) : null;
                                if (!numbers) {
                                    return (
                                        <Box sx={{ p: 2, bgcolor: "var(--bg-panel)", border: "1px solid var(--border-color)", borderRadius: "12px", textAlign: "center" }}>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-secondary)" }}>
                                                No SDGs found for this conference.
                                            </Typography>
                                        </Box>
                                    );
                                }
                                const matchedNumbers = [...new Set(numbers.map(n => parseInt(n, 10)))].sort((a, b) => a - b);
                                return matchedNumbers.map((num, idx) => {
                                    const dbSdg = sdgList.find(s => {
                                        const sNum = parseInt(String(s.sdgNumber).replace(/\D/g, ''), 10);
                                        return sNum === num;
                                    });
                                    const fallback = SDG_COLOR_MAP[num] || { code: `SDG-${num}`, label: `SDG-${num}`, color: "#000" };
                                    const color = dbSdg?.backgroundColor || fallback.color;
                                    const imageUrl = dbSdg?.imageUrl ? `${API.defaults.baseURL || ''}${dbSdg.imageUrl}` : null;
                                    const label = dbSdg?.sdgTitle ? `SDG-${num}: ${dbSdg.sdgTitle}` : fallback.label;
                                    
                                    return (
                                        <Box
                                            key={idx}
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 1.5,
                                                p: 1.25,
                                                borderRadius: "10px",
                                                background: "var(--bg-panel)",
                                                border: "1px solid var(--border-color)",
                                                transition: "all 0.2s ease",
                                                "&:hover": { transform: "translateX(2px)", borderColor: color }
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: "6px",
                                                    bgcolor: color,
                                                    color: "#ffffff",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontWeight: 900,
                                                    fontSize: "0.75rem",
                                                    flexShrink: 0,
                                                    boxShadow: `0 2px 8px ${color}44`,
                                                    overflow: 'hidden'
                                                }}
                                            >
                                                {imageUrl ? (
                                                    <img src={imageUrl} alt={`SDG ${num}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <PublicIcon sx={{ fontSize: 18 }} />
                                                )}
                                            </Box>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.85rem" }}>
                                                {label}
                                            </Typography>
                                        </Box>
                                    );
                                });
                            })()}
                        </Box>
                    </Card>
                </Box>
            </Box>

            {/* Co-Authors - shown above Attached Documents */}
            {(() => {
                const applicantPos = parseInt(data.userAuthorPosition) || 1;
                const applicantName = (data.facultyId?.name || "").trim().toLowerCase();
                const applicantEmpId = (data.facultyId?.institutionId || data.facultyId?._id || "").toString().trim().toLowerCase();

                const filteredCoAuthors = (data.coAuthors || []).filter((ca, index) => {
                    const pos = ca.authorPosition;
                    if (pos && pos === applicantPos) return false;

                    const caEmpId = (ca.employeeId?.institutionId || ca.employeeId?._id || ca.employeeId || "").toString().trim().toLowerCase();
                    if (caEmpId && applicantEmpId && caEmpId === applicantEmpId) return false;

                    const caName = (ca.name || "").trim().toLowerCase();
                    if (caName && applicantName && (caName === applicantName || caName.includes(applicantName) || applicantName.includes(caName))) return false;

                    return true;
                });

                if (filteredCoAuthors.length === 0) return null;

                const total = parseInt(data.totalAuthors) || (filteredCoAuthors.length + 1);
                const derivedPositions = total > 0
                    ? Array.from({ length: total }, (_, i) => i + 1).filter(p => p !== applicantPos)
                    : [];

                return (
                    <Card sx={{ ...cardStyle, p: 0, overflow: "hidden", mb: 3 }}>
                        <Box sx={{ p: 3, pb: 2 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                <GroupsIcon sx={{ color: "var(--color-primary)" }} />
                                <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Co-Author Details</Typography>
                                <Box sx={{ ml: 'auto', px: 1.5, py: 0.5, borderRadius: '20px', bgcolor: 'rgba(190,147,55,0.12)', border: '1px solid rgba(190,147,55,0.3)' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 900, color: 'var(--color-primary)', fontSize: '0.7rem' }}>
                                        Total: {filteredCoAuthors.length} Co-Author{filteredCoAuthors.length > 1 ? 's' : ''}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                        <TableContainer>
                            <Table>
                                <TableHead sx={{ bgcolor: "var(--bg-panel)" }}>
                                    <TableRow>
                                        <TableCell sx={{ color: "var(--text-secondary)", fontWeight: 800, fontSize: "0.7rem", textTransform: "uppercase", width: 60 }}>POSITION</TableCell>
                                        <TableCell sx={{ color: "var(--text-secondary)", fontWeight: 800, fontSize: "0.7rem", textTransform: "uppercase" }}>NAME</TableCell>
                                        <TableCell sx={{ color: "var(--text-secondary)", fontWeight: 800, fontSize: "0.7rem", textTransform: "uppercase" }}>TYPE</TableCell>
                                        <TableCell sx={{ color: "var(--text-secondary)", fontWeight: 800, fontSize: "0.7rem", textTransform: "uppercase" }}>AFFILIATION</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredCoAuthors.map((ca, i) => {
                                        const pos = ca.authorPosition || derivedPositions[i] || (i + (applicantPos === 1 ? 2 : 1));
                                        return (
                                            <TableRow key={i} sx={{ '&:hover': { bgcolor: 'rgba(190,147,55,0.04)' } }}>
                                                <TableCell>
                                                    <Box sx={{
                                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                        width: 32, height: 32, borderRadius: '50%',
                                                        bgcolor: 'rgba(190, 147, 55, 0.12)', border: '1.5px solid var(--color-primary)',
                                                        color: 'var(--color-primary)', fontWeight: 900, fontSize: '0.85rem'
                                                    }}>
                                                        {pos}
                                                    </Box>
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 700, color: "var(--text-primary)" }}>{ca.name}</TableCell>
                                                <TableCell sx={{ fontWeight: 600, color: "var(--text-secondary)", textTransform: "capitalize" }}>{ca.CoAuthorType || "-"}</TableCell>
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

            {/* Attachments Section */}
            <Card sx={{ ...cardStyle, mb: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                    <AttachFileIcon sx={{ color: "var(--color-primary)" }} />
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Attached Documents</Typography>
                </Box>
                <Grid container spacing={3}>
                    {renderFilePreview("1st Page in Conference", data.firstPage, 1)}
                    {renderFilePreview("Presentation Certificate", data.certificate, 2)}
                    {renderFilePreview("Complete Document", data.completeDocument, 3)}
                    {data.flightTicket && renderFilePreview("Flight Ticket", data.flightTicket, 4)}
                </Grid>
            </Card>

            {/* Actions */}
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mt: 3 }}>
                {data.hodComment && <Box sx={{ flex: 1, minWidth: 300 }}><Card sx={{ ...cardStyle, borderLeft: "4px solid #ffc107", height: "100%", mb: 0 }}><Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}><HistoryIcon sx={{ color: "#ffc107" }} /><Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>HOD Review</Typography></Box><Box sx={{ p: 2, bgcolor: "rgba(255, 193, 7, 0.05)", borderRadius: "10px", border: "1px solid #ffc10733" }}><Typography variant="body2" sx={{ fontStyle: "italic", fontWeight: 600 }}>"{data.hodComment}"</Typography></Box></Card></Box>}
                
                <Box sx={{ flex: 1, minWidth: 350 }}>
                    {((isResearchAdmin && data.status === 'Pending at R&D') || (isHOD && data.status === 'Pending')) ? (
                        <Card sx={{ ...cardStyle, borderTop: "4px solid var(--color-primary)", mb: 0 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}><GavelIcon sx={{ color: "var(--color-primary)" }} /><Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Review Decision</Typography></Box>

                            {!decisionMode ? (
                                <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                                    <Button variant="outlined" color="error" onClick={() => setDecisionMode('Reject')} sx={{ px: 3 }}>Reject</Button>
                                    <Button variant="contained" color="success" onClick={() => setDecisionMode('Approve')} sx={{ px: 4 }}>{isHOD ? "Approve & Forward" : "Final Approve"}</Button>
                                </Box>
                            ) : (
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                    {decisionMode === 'Approve' && isResearchAdmin && (
                                        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                                            {data.applyIncentive === 'Yes' && (
                                                <Box sx={{ flex: "1 1 200px" }}>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1, color: "var(--color-primary)", fontSize: "0.75rem" }}>APPROVED INCENTIVE (₹) *</Typography>
                                                    <TextField
                                                        fullWidth size="small" type="number"
                                                        placeholder="Enter Approved Incentive Amount"
                                                        value={approvedAmount}
                                                        onChange={e => setApprovedAmount(e.target.value)}
                                                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: "var(--bg-panel)" } }}
                                                    />
                                                </Box>
                                            )}
                                            <Box sx={{ flex: "1 1 200px" }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1, color: "var(--color-primary)", fontSize: "0.75rem" }}>ARTICLE ELIGIBILITY FOR APPRAISAL *</Typography>
                                                <Select 
                                                    fullWidth size="small" 
                                                    value={appraisalEligible} 
                                                    onChange={e => setAppraisalEligible(e.target.value)} 
                                                    displayEmpty 
                                                    sx={{ borderRadius: "10px", bgcolor: "var(--bg-panel)" }}
                                                >
                                                    <MenuItem value="" disabled>Select Eligibility</MenuItem>
                                                    <MenuItem value="Yes">Yes</MenuItem>
                                                    <MenuItem value="No">No</MenuItem>
                                                </Select>
                                            </Box>
                                        </Box>
                                    )}

                                    <Box>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1, color: "var(--color-primary)", fontSize: "0.75rem" }}>REMARKS {decisionMode === 'Reject' ? '*' : ''}</Typography>
                                        <TextField fullWidth multiline rows={3} placeholder={`Provide your ${decisionMode.toLowerCase()} comments...`} value={remarks} onChange={e => setRemarks(e.target.value)} sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: "var(--bg-panel)" } }} />
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
                                    {data.approvedAmount && <Typography variant="h6" sx={{ mt: 2, fontWeight: 900, color: "#10b981" }}>Approved Amount: ₹{data.approvedAmount}</Typography>}
                                </Box>
                            )}
                        </Card>
                    )}
                </Box>
            </Box>

            {/* Edit Dialog (Removed per user request) */}
        </Box>
    );
};

export default ConferenceApprovalDetails;
