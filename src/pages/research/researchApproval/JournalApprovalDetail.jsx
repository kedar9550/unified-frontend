import Loader from "../../../components/common/Loader";
import React, { useState, useEffect } from "react";
import {
    Box, Typography, Grid, Card, Button, TextField,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Stack, Select, MenuItem
} from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MenuBookIcon from '@mui/icons-material/MenuBook';
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
import { toast } from "sonner";
import API from "../../../api/axios";
import EditResearchDetailsDialog from "./EditResearchDetailsDialog";
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import SchoolIcon from '@mui/icons-material/School';
import LinkIcon from '@mui/icons-material/Link';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BarChartIcon from '@mui/icons-material/BarChart';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import GrassIcon from '@mui/icons-material/Grass';
import PublicIcon from '@mui/icons-material/Public';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

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

const getMatchedSdgBadgeList = (sdgInput) => {
    if (!sdgInput) return [SDG_COLOR_MAP[1], SDG_COLOR_MAP[11], SDG_COLOR_MAP[12], SDG_COLOR_MAP[13], SDG_COLOR_MAP[15], SDG_COLOR_MAP[2], SDG_COLOR_MAP[4], SDG_COLOR_MAP[6], SDG_COLOR_MAP[8], SDG_COLOR_MAP[9]];

    const numbers = String(sdgInput).match(/\d+/g);
    if (!numbers || numbers.length === 0) {
        return [SDG_COLOR_MAP[1], SDG_COLOR_MAP[11], SDG_COLOR_MAP[12], SDG_COLOR_MAP[13], SDG_COLOR_MAP[15], SDG_COLOR_MAP[2], SDG_COLOR_MAP[4], SDG_COLOR_MAP[6], SDG_COLOR_MAP[8], SDG_COLOR_MAP[9]];
    }

    const list = [];
    numbers.forEach(n => {
        const num = parseInt(n, 10);
        if (SDG_COLOR_MAP[num] && !list.some(item => item.code === SDG_COLOR_MAP[num].code)) {
            list.push(SDG_COLOR_MAP[num]);
        }
    });

    return list.length > 0 ? list : [SDG_COLOR_MAP[1], SDG_COLOR_MAP[11], SDG_COLOR_MAP[12], SDG_COLOR_MAP[13], SDG_COLOR_MAP[15], SDG_COLOR_MAP[2], SDG_COLOR_MAP[4], SDG_COLOR_MAP[6], SDG_COLOR_MAP[8], SDG_COLOR_MAP[9]];
};



const JournalApprovalDetail = ({ id, onBack, role }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [remarks, setRemarks] = useState("");
    const [approvedAmount, setApprovedAmount] = useState("");
    const [hIndex, setHIndex] = useState("");
    const [jcrImpactFactor, setJcrImpactFactor] = useState("");
    const [citations, setCitations] = useState("");
    const [quartile, setQuartile] = useState("");
    const [journalType, setJournalType] = useState("");
    const [appraisalEligible, setAppraisalEligible] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [imgError, setImgError] = useState(false);
    const [sdgMap, setSdgMap] = useState({});

    const [leftCardHeight, setLeftCardHeight] = useState(null);
    const observerRef = React.useRef(null);

    const leftCardRef = React.useCallback((node) => {
        if (observerRef.current) {
            observerRef.current.disconnect();
            observerRef.current = null;
        }
        if (node) {
            const updateHeight = () => {
                const h = node.getBoundingClientRect().height;
                if (h > 0) {
                    setLeftCardHeight(h);
                }
            };
            observerRef.current = new ResizeObserver(() => {
                updateHeight();
            });
            observerRef.current.observe(node);
            updateHeight();
        }
    }, []);

    useEffect(() => {
        API.get("/api/sdgs").then(res => {
            if (res.data?.success) {
                const map = {};
                res.data.data.forEach(sdg => {
                    const title = sdg.sdgTitle.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
                    map[sdg.sdgNumber] = `${sdg.sdgNumber}: ${title}`;
                });
                setSdgMap(map);
            }
        }).catch(err => console.error("Failed to fetch SDGs", err));
    }, []);

    const getSdgName = (sdgCode) => {
        const cleanCode = (sdgCode || "").trim();
        if (sdgMap[cleanCode]) return sdgMap[cleanCode];
        if (cleanCode.startsWith("SDG-")) return cleanCode;
        const key = `SDG-${cleanCode}`;
        return sdgMap[key] || cleanCode;
    };

    const isHOD = !role || role === 'HOD';
    const isDean = role === 'RESEARCH_DEAN';
    const isCoordinator = role === 'RESEARCH_COORDINATOR';
    const isResearchAdmin = isDean || isCoordinator;

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await API.get(`/api/research/journal/${id}`);
                if (res.data?.success) {
                    const journal = res.data.data;
                    setData(journal);
                    if (journal.rndComment) setRemarks(journal.rndComment);
                    else if (journal.hodComment) setRemarks(journal.hodComment);
                    if (journal.approvedAmount) setApprovedAmount(journal.approvedAmount);
                    if (journal.hIndex) setHIndex(journal.hIndex);
                    if (journal.citations) setCitations(journal.citations);
                    if (journal.journalQuartile) setQuartile(journal.journalQuartile);
                    else if (journal.categoryOfJournal) setQuartile(journal.categoryOfJournal);
                    if (journal.journalType) setJournalType(journal.journalType);
                    if (journal.appraisalEligible) setAppraisalEligible(journal.appraisalEligible);

                    const jcrIFValue = journal.jcrImpactFactor || journal.impactFactor;
                    if (jcrIFValue) {
                        setJcrImpactFactor(jcrIFValue);
                    } else if (journal.journalName) {
                        try {
                            const jifRes = await API.get(`/api/journal-impact-factors?search=${encodeURIComponent(journal.journalName)}`);
                            if (jifRes.data?.success && jifRes.data.data?.length > 0) {
                                const exactMatch = jifRes.data.data.find(j => j.journalName.toLowerCase() === journal.journalName.toLowerCase());
                                const matchedJif = exactMatch ? exactMatch.jif : jifRes.data.data[0].jif;
                                setJcrImpactFactor(String(matchedJif));
                            }
                        } catch (jifErr) {
                            console.error("Failed to fetch JIF from database", jifErr);
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to fetch journal details", error);
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
            if (isResearchAdmin) {
                if (!jcrImpactFactor) {
                    toast.error('Please enter the Impact Factor (JCR)');
                    return;
                }
                if (data.applyIncentive === 'Yes' && !approvedAmount) {
                    toast.error('Please enter the approved incentive amount');
                    return;
                }
                if (!appraisalEligible) {
                    toast.error('Please select Appraisal Eligible status');
                    return;
                }
            }
        }

        setActionLoading(true);
        try {
            const endpoint = isResearchAdmin ? `/api/research/journal/rnd-action/${id}` : `/api/research/journal/hod-action/${id}`;
            const payload = {
                action,
                comment: remarks,
                approvedAmount: isResearchAdmin && data.applyIncentive === 'Yes' ? approvedAmount : undefined,
                hIndex: isResearchAdmin ? hIndex : undefined,
                jcrImpactFactor: isResearchAdmin ? jcrImpactFactor : undefined,
                citations: isResearchAdmin ? citations : undefined,
                journalQuartile: isResearchAdmin ? quartile : undefined,
                journalType: isResearchAdmin ? journalType : undefined,
                appraisalEligible: isResearchAdmin ? appraisalEligible : undefined
            };
            const res = await API.put(endpoint, payload);
            if (res.data?.success) {
                toast.success(`Request ${action === 'Approve' ? 'Approved' : 'Rejected'} successfully`);
                onBack();
            }
        } catch (error) {
            console.error("Action failed", error);
            toast.error(error.response?.data?.message || "Action failed. Please try again.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateMetrics = async () => {
        setActionLoading(true);
        try {
            const res = await API.put(`/api/research/journal/update-metrics/${id}`, {
                hIndex,
                jcrImpactFactor,
                citations,
                journalQuartile: quartile,
                journalType
            });
            if (res.data?.success) {
                toast.success("Journal metrics updated successfully");
                setData(res.data.data);
                if (res.data.data.hIndex) setHIndex(res.data.data.hIndex);
                const updatedIF = res.data.data.jcrImpactFactor || res.data.data.impactFactor;
                if (updatedIF) setJcrImpactFactor(updatedIF);
                if (res.data.data.citations) setCitations(res.data.data.citations);
                if (res.data.data.journalQuartile) setQuartile(res.data.data.journalQuartile);
                if (res.data.data.journalType) setJournalType(res.data.data.journalType);
            }
        } catch (error) {
            console.error("Update metrics failed", error);
            toast.error(error.response?.data?.message || "Failed to update metrics. Please try again.");
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
                {isResearchAdmin && !/pending/i.test(data.status) && (
                    <Button variant="outlined" onClick={() => setEditOpen(true)} sx={{ borderColor: "var(--color-primary)", color: "var(--color-primary)", fontWeight: 700, textTransform: "none", borderRadius: "10px", "&:hover": { bgcolor: "rgba(190, 147, 55, 0.1)", borderColor: "var(--color-primary)" } }}>
                        Correct Research Details
                    </Button>
                )}
            </Box>

            {/* Top Header Box (Image 2 style) */}
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
                                {data.paperTitle}
                            </Typography>
                            <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 600, mt: 0.5 }}>
                                Journal: {data.journalName}
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
                        <Chip
                            icon={<AccessTimeIcon sx={{ fontSize: "16px !important", color: "inherit" }} />}
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

            {/* Main Grid: Left Column (Publication Details) + Right Column (Scope & SDGs) */}
            <Box sx={{
                display: "grid",
                gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1.3fr) minmax(0, 0.9fr)" },
                gap: 3,
                mb: 3,
                width: "100%",
                alignItems: "flex-start"
            }}>
                {/* Left Column (Publication Details) */}
                <Box sx={{ minWidth: 0 }}>
                    <Card
                        ref={leftCardRef}
                        sx={{
                            ...cardStyle,
                            p: 0,
                            overflow: "hidden",
                            mb: 0,
                            display: "flex",
                            flexDirection: "column"
                        }}
                    >
                        <Box sx={{ p: 3, pb: 2, borderBottom: "1px solid var(--border-color)" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                                <FormatListBulletedIcon sx={{ color: "var(--color-primary)" }} />
                                <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                                    Publication Details
                                </Typography>
                            </Box>
                            <Box sx={{ width: 140, height: 3, bgcolor: "var(--color-primary)", borderRadius: "3px" }} />
                        </Box>
                        <Box sx={{ display: "flex", flexDirection: "column" }}>
                            {[
                                { label: "Academic Year", value: data.academicYear?.year || "-", icon: <SchoolIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                                { label: "DOI", value: data.doi || "-", icon: <LinkIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                                { label: "Applicant Author Position", value: data.userAuthorPosition ? `${data.userAuthorPosition} / ${data.totalAuthors}` : (data.firstAuthor === "Yes" ? "1" : data.authorPosition || "-"), icon: <PersonOutlineIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                                { label: "Journal Quartile", value: data.journalQuartile || data.categoryOfJournal || "-", icon: <ShowChartIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                                { label: "Journal Type", value: data.journalType || "-", icon: <MenuBookIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                                { label: "Volume", value: data.vol || "-", icon: <MenuBookIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                                { label: "Issue", value: data.issue || "-", icon: <ArticleIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                                { label: "Published Year", value: data.publishedYear || data.year || "-", icon: <CalendarTodayIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                                { label: "Published Month", value: data.publishedMonth || data.month || "-", icon: <CalendarMonthIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                                { label: "H-Index", value: data.hIndex || "-", icon: <TrendingUpIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                                { label: "Impact Factor", value: data.jcrImpactFactor || data.impactFactor || "-", icon: <BarChartIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                                { label: "Citations", value: data.citations || "-", icon: <FormatQuoteIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                                { label: "AGEC Referencing Numbers", value: data.agecReferencingNumbers || data.referencingNos || "-", icon: <LinkIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                                { label: "Number of References Belonging to AGEC", value: data.numberOfReferencesBelongingToAGEC !== undefined ? data.numberOfReferencesBelongingToAGEC : (data.papersCited !== undefined ? data.papersCited : "-"), icon: <GroupsIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                                { label: "Seed Grant Work", value: data.applyingSeedGrant || "No", icon: <GrassIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> }
                            ].map((item, idx, arr) => (
                                <Box
                                    key={idx}
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        px: 3,
                                        py: 1.6,
                                        borderBottom: idx === arr.length - 1 ? "none" : "1px solid var(--border-color)",
                                        "&:hover": { bgcolor: "rgba(0,0,0,0.015)" },
                                        transition: "background 0.2s"
                                    }}
                                >
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                        {item.icon}
                                        <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.875rem" }}>
                                            {item.label}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--text-primary)", textAlign: "right", maxWidth: "55%", wordBreak: "break-word" }}>
                                        {item.value}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Card>
                </Box>

                {/* Right Column (Publication Scope & SDGs) */}
                <Box sx={{
                    minWidth: 0,
                    minHeight: 0,
                    height: { xs: "auto", md: leftCardHeight ? `${leftCardHeight}px` : "auto" },
                    maxHeight: { xs: "none", md: leftCardHeight ? `${leftCardHeight}px` : "none" },
                    display: "flex",
                    flexDirection: "column",
                    gap: 3
                }}>
                    {/* Top Right Card: Scope, Eligibility, Claimant */}
                    <Card sx={{ ...cardStyle, mb: 0, flexShrink: 0 }}>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 2, borderBottom: "1px solid var(--border-color)" }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                    <PublicIcon sx={{ color: "var(--text-secondary)", fontSize: 20 }} />
                                    <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 600 }}>
                                        Publication Scope
                                    </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                                    {data.publicationScope || data.incentiveApplied || "National"}
                                </Typography>
                            </Box>

                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 2, borderBottom: "1px solid var(--border-color)" }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                    <CheckCircleOutlineIcon sx={{ color: "var(--text-secondary)", fontSize: 20 }} />
                                    <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 600 }}>
                                        Article Eligibility for Appraisal
                                    </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                                    {data.status === "Approved" ? (data.appraisalEligible || "No") : "Not yet decided"}
                                </Typography>
                            </Box>

                            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 0.5 }}>
                                    <PersonIcon sx={{ color: "var(--text-secondary)", fontSize: 20 }} />
                                    <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 600 }}>
                                        Appraisal Claimant
                                    </Typography>
                                </Box>
                                <Box sx={{ textAlign: "right", maxWidth: "60%" }}>
                                    {(() => {
                                        const isApplicant = data.visibilityRole === "Applicant" || (data.facultyId && (data.facultyId === user?.userId || data.facultyId._id === user?.userId));
                                        const eligibleClaimants = [
                                            { _id: data.facultyId?._id, name: data.facultyId?.name, institutionId: data.facultyId?.institutionId },
                                            ...((data.coAuthors || [])
                                                .filter(ca => ca.employeeId)
                                                .map(ca => ({
                                                    _id: ca.employeeId?._id || ca.employeeId,
                                                    name: ca.employeeId?.name || ca.name,
                                                    institutionId: ca.employeeId?.institutionId || ca.employeeId || ""
                                                })))
                                        ];
                                        const uniqueClaimants = eligibleClaimants.filter((v, i, a) => v._id && a.findIndex(t => t._id.toString() === v._id.toString()) === i);

                                        if (uniqueClaimants.length <= 1) {
                                            return (
                                                <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                                                    {user?.name || data.facultyId?.name || "AMALAPURAPU KEDARNADH"} <Typography component="span" variant="caption" sx={{ fontWeight: 600, color: "var(--text-secondary)" }}>(Auto-assigned)</Typography>
                                                </Typography>
                                            );
                                        }

                                        const currentClaimantObj = uniqueClaimants.find(c =>
                                            (c.institutionId && c.institutionId === (data.appraisalClaimant?.institutionId || data.appraisalClaimant || "").toString()) ||
                                            (c._id && c._id.toString() === (data.appraisalClaimant?._id || data.appraisalClaimant || "").toString())
                                        );

                                        if (!data.appraisalClaimant && isApplicant && appraisalConfigActive && uniqueClaimants.length > 1 && data.status === "Approved" && data.appraisalEligible === "Yes") {
                                            return (
                                                <Select
                                                    size="small"
                                                    fullWidth
                                                    value=""
                                                    displayEmpty
                                                    onChange={(e) => handleResolveClaim(data._id, "Journal", e.target.value)}
                                                    sx={{ backgroundColor: "var(--bg-paper)", fontSize: "0.875rem" }}
                                                >
                                                    <MenuItem value="" disabled>Select Claimant</MenuItem>
                                                    {uniqueClaimants.map(c => (
                                                        <MenuItem key={c.institutionId || c._id} value={c.institutionId || c._id}>
                                                            {c.name} ({c.institutionId})
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            );
                                        }

                                        return (
                                            <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                                                {currentClaimantObj ? `${currentClaimantObj.name} (${currentClaimantObj.institutionId})` : (data.status === "Approved" && data.appraisalEligible === "Yes" ? `Not Yet Designated` : `N/A - Not Eligible or Not Approved`)}
                                            </Typography>
                                        );
                                    })()}
                                </Box>
                            </Box>
                        </Box>
                    </Card>

                    {/* Bottom Right Card: SDGs Matched with Badges */}
                    <Card sx={{ ...cardStyle, mb: 0, flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2, flexShrink: 0 }}>
                            <Box sx={{ width: 28, height: 28, borderRadius: "50%", background: "conic-gradient(#E5243B 0deg 21deg, #DDA83A 21deg 42deg, #4C9F38 42deg 63deg, #C5192D 63deg 84deg, #FF3A21 84deg 105deg, #26BDE2 105deg 126deg, #FCC30B 126deg 147deg, #A21942 147deg 168deg, #FD6925 168deg 189deg, #DD1367 189deg 210deg, #FD9D24 210deg 231deg, #BF8B2E 231deg 252deg, #3F7E44 252deg 273deg, #0A97D9 273deg 294deg, #56C02B 294deg 315deg, #00689D 315deg 336deg, #19486A 336deg 360deg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "var(--bg-paper)" }} />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                                SDGs Matched
                            </Typography>
                        </Box>

                        <Box sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 1.25,
                            flex: 1,
                            minHeight: 0,
                            overflowY: "auto",
                            pr: 1,
                            "&::-webkit-scrollbar": { width: "5px" },
                            "&::-webkit-scrollbar-track": { background: "rgba(0, 0, 0, 0.03)", borderRadius: "10px" },
                            "&::-webkit-scrollbar-thumb": { background: "rgba(0, 0, 0, 0.15)", borderRadius: "10px", "&:hover": { background: "var(--color-primary)" } }
                        }}>
                            {getMatchedSdgBadgeList(data.sdgs).map((sdg, idx) => (
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
                                        "&:hover": { transform: "translateX(2px)", borderColor: sdg.color }
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: "6px",
                                            bgcolor: sdg.color,
                                            color: "#ffffff",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontWeight: 900,
                                            fontSize: "0.75rem",
                                            flexShrink: 0,
                                            boxShadow: `0 2px 8px ${sdg.color}44`
                                        }}
                                    >
                                        <PublicIcon sx={{ fontSize: 18 }} />
                                    </Box>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.85rem" }}>
                                        {sdg.label}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Card>
                </Box>
            </Box>

            {/* Co-Authors - shown above Attached Documents */}
            {data.coAuthors?.length > 0 && (
                <Card sx={{ ...cardStyle, p: 0, overflow: "hidden" }}>
                    <Box sx={{ p: 3, pb: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <GroupsIcon sx={{ color: "var(--color-primary)" }} />
                            <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Co-Author Details</Typography>
                            <Box sx={{ ml: 'auto', px: 1.5, py: 0.5, borderRadius: '20px', bgcolor: 'rgba(190,147,55,0.12)', border: '1px solid rgba(190,147,55,0.3)' }}>
                                <Typography variant="caption" sx={{ fontWeight: 900, color: 'var(--color-primary)', fontSize: '0.7rem' }}>
                                    Total: {data.coAuthors.length} Co-Author{data.coAuthors.length > 1 ? 's' : ''}
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
                                    <TableCell sx={{ color: "var(--text-secondary)", fontWeight: 800, fontSize: "0.7rem", textTransform: "uppercase" }}>AFFILIATION</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {(() => {
                                    const total = parseInt(data.totalAuthors) || 0;
                                    const applicantPos = parseInt(data.userAuthorPosition) || (data.firstAuthor === "Yes" ? 1 : parseInt(data.authorPosition)) || 0;
                                    const derivedPositions = total > 0
                                        ? Array.from({ length: total }, (_, i) => i + 1).filter(p => p !== applicantPos)
                                        : [];
                                    return data.coAuthors.map((ca, i) => {
                                        const pos = ca.authorPosition || derivedPositions[i] || (i + 1);
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
                                                <TableCell sx={{ fontWeight: 600, color: "var(--text-secondary)" }}>{ca.affiliation || "-"}</TableCell>
                                            </TableRow>
                                        );
                                    });
                                })()}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Card>
            )}

            {/* Documents */}
            <Card sx={cardStyle}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}><AttachFileIcon sx={{ color: "var(--color-primary)" }} /><Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Attached Documents</Typography></Box>
                <Grid container spacing={3}>
                    {renderFilePreview("Published Paper (1st Page)", data.publishedPaper, 1)}
                    {renderFilePreview("Reference Pages", data.referencePages, 2)}
                    {data.completeJournal ? (
                        renderFilePreview("Complete Journal", data.completeJournal, 3)
                    ) : (
                        data.completeJournalName && (
                            <Grid item xs={12} sm={6} md={3}>
                                <Box sx={{ mb: 1 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "var(--color-primary)", fontSize: "0.75rem", textTransform: "uppercase" }}>
                                        3. Complete Journal
                                    </Typography>
                                </Box>
                                <Box sx={{
                                    height: 180, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", p: 2,
                                    border: "1px solid var(--border-color)", background: "var(--bg-panel)", borderRadius: "12px",
                                }}>
                                    <DescriptionIcon sx={{ fontSize: 40, color: "var(--text-secondary)", mb: 1 }} />
                                    <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 700, textAlign: "center", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {data.completeJournalName}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: "var(--color-primary)", fontWeight: 800, display: "block", mt: 0.5, fontSize: "0.65rem" }}>
                                        (Client-side Scanned)
                                    </Typography>
                                </Box>
                            </Grid>
                        )
                    )}
                </Grid>
            </Card>

            {/* Actions */}
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mt: 3 }}>
                {data.hodComment && <Box sx={{ flex: 1, minWidth: 300 }}><Card sx={{ ...cardStyle, borderLeft: "4px solid #ffc107", height: "100%", mb: 0 }}><Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}><HistoryIcon sx={{ color: "#ffc107" }} /><Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>HOD Review</Typography></Box><Box sx={{ p: 2, bgcolor: "rgba(255, 193, 7, 0.05)", borderRadius: "10px", border: "1px solid #ffc10733" }}><Typography variant="body2" sx={{ fontStyle: "italic", fontWeight: 600 }}>"{data.hodComment}"</Typography></Box></Card></Box>}

                <Box sx={{ flex: 1, minWidth: 350 }}>
                    {((isHOD && data.status === 'Pending at HOD') || (isResearchAdmin && data.status === 'Pending at R&D')) ? (
                        <Card sx={{ ...cardStyle, borderTop: "4px solid var(--color-primary)", mb: 0 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}><GavelIcon sx={{ color: "var(--color-primary)" }} /><Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Review Decision</Typography></Box>

                            {isResearchAdmin && (
                                <Box sx={{ display: "flex", gap: 3, mb: 3, flexWrap: "wrap" }}>
                                    <Box sx={{ flex: "1 1 150px" }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1, color: "var(--color-primary)", fontSize: "0.75rem" }}>QUARTILE</Typography>
                                        <Select fullWidth size="small" value={quartile} onChange={e => setQuartile(e.target.value)} displayEmpty sx={{ borderRadius: "10px", bgcolor: "var(--bg-panel)" }}>
                                            <MenuItem value="" disabled>Select Quartile</MenuItem>
                                            <MenuItem value="Q1">Q1</MenuItem>
                                            <MenuItem value="Q2">Q2</MenuItem>
                                            <MenuItem value="Q3">Q3</MenuItem>
                                            <MenuItem value="Q4">Q4</MenuItem>
                                        </Select>
                                    </Box>
                                    <Box sx={{ flex: "1 1 150px" }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1, color: "var(--color-primary)", fontSize: "0.75rem" }}>JOURNAL TYPE</Typography>
                                        <Select fullWidth size="small" value={journalType} onChange={e => setJournalType(e.target.value)} displayEmpty sx={{ borderRadius: "10px", bgcolor: "var(--bg-panel)" }}>
                                            <MenuItem value="" disabled>Select Type</MenuItem>
                                            <MenuItem value="SCI">SCI</MenuItem>
                                            <MenuItem value="SCIE">SCIE</MenuItem>
                                            <MenuItem value="SCOPUS">SCOPUS</MenuItem>
                                            <MenuItem value="ESCI">ESCI</MenuItem>
                                            <MenuItem value="UGC">UGC</MenuItem>
                                            <MenuItem value="Other">Other</MenuItem>
                                        </Select>
                                    </Box>
                                    <Box sx={{ flex: "1 1 150px" }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1, color: "var(--color-primary)", fontSize: "0.75rem" }}>JOURNAL H-INDEX</Typography>
                                        <TextField
                                            fullWidth size="small"
                                            placeholder="Enter Journal H-Index"
                                            value={hIndex}
                                            onChange={e => setHIndex(e.target.value)}
                                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: "var(--bg-panel)" } }}
                                        />
                                    </Box>
                                    <Box sx={{ flex: "1 1 150px" }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1, color: "var(--color-primary)", fontSize: "0.75rem" }}>IMPACT FACTOR (JCR) *</Typography>
                                        <TextField
                                            fullWidth size="small"
                                            placeholder="Enter Impact Factor (JCR)"
                                            value={jcrImpactFactor}
                                            onChange={e => setJcrImpactFactor(e.target.value)}
                                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: "var(--bg-panel)" } }}
                                        />
                                    </Box>
                                    <Box sx={{ flex: "1 1 150px" }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1, color: "var(--color-primary)", fontSize: "0.75rem" }}>CITATIONS</Typography>
                                        <TextField
                                            fullWidth size="small"
                                            placeholder="Enter Citations"
                                            value={citations}
                                            onChange={e => setCitations(e.target.value)}
                                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: "var(--bg-panel)" } }}
                                        />
                                    </Box>
                                    <Box sx={{ flex: "1 1 150px" }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1, color: "var(--color-primary)", fontSize: "0.75rem" }}>APPRAISAL ELIGIBLE *</Typography>
                                        <Select fullWidth size="small" value={appraisalEligible} onChange={e => setAppraisalEligible(e.target.value)} displayEmpty sx={{ borderRadius: "10px", bgcolor: "var(--bg-panel)" }}>
                                            <MenuItem value="" disabled>Select Eligibility</MenuItem>
                                            <MenuItem value="Yes">Yes</MenuItem>
                                            <MenuItem value="No">No</MenuItem>
                                        </Select>
                                    </Box>
                                </Box>
                            )}

                            {isResearchAdmin && data.applyIncentive === 'Yes' && (
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1, color: "var(--color-primary)", fontSize: "0.75rem" }}>APPROVED INCENTIVE (₹)</Typography>
                                    <TextField
                                        fullWidth size="small" type="number"
                                        placeholder="Enter Approved Incentive Amount"
                                        value={approvedAmount}
                                        onChange={e => setApprovedAmount(e.target.value)}
                                        sx={{ maxWidth: 250, "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: "var(--bg-panel)" } }}
                                    />
                                </Box>
                            )}

                            <TextField fullWidth multiline rows={3} placeholder="Provide your review comments..." value={remarks} onChange={e => setRemarks(e.target.value)} sx={{ mb: 3, "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: "var(--bg-panel)" } }} />

                            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                                <Button variant="outlined" color="error" disabled={actionLoading} onClick={() => handleAction('Reject')} sx={{ px: 3 }}>Reject</Button>
                                <Button variant="contained" color="success" disabled={actionLoading} onClick={() => handleAction('Approve')} sx={{ px: 4 }}>{isHOD ? "Approve & Forward" : "Final Approve"}</Button>
                            </Box>
                        </Card>
                    ) : (
                        <Stack spacing={3}>
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
                        </Stack>
                    )}
                </Box>
            </Box>
            {isResearchAdmin && (
                <EditResearchDetailsDialog
                    open={editOpen}
                    onClose={() => setEditOpen(false)}
                    type="Journal"
                    currentData={data}
                    onSave={(updated) => {
                        setData(updated);
                        if (updated.hIndex) setHIndex(updated.hIndex);
                        const updatedIF = updated.jcrImpactFactor || updated.impactFactor;
                        if (updatedIF) setJcrImpactFactor(updatedIF);
                        if (updated.citations) setCitations(updated.citations);
                        if (updated.journalQuartile) setQuartile(updated.journalQuartile);
                        if (updated.journalType) setJournalType(updated.journalType);
                        if (updated.appraisalEligible) setAppraisalEligible(updated.appraisalEligible);
                        if (updated.approvedAmount) setApprovedAmount(updated.approvedAmount);
                    }}
                />
            )}
        </Box >
    );
};

export default JournalApprovalDetail;
