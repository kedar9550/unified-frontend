import Loader from "../../../components/common/Loader";
import React, { useState, useEffect } from "react";
import {
    Box, Typography, Grid, Card, Button, TextField,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    CircularProgress, Chip, IconButton, Stack, Select, MenuItem
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

const getSdgName = (sdgCode) => {
    const mapping = {
        "SDG-1": "SDG-1: No Poverty",
        "SDG-2": "SDG-2: Zero Hunger",
        "SDG-3": "SDG-3: Good Health and Well-being",
        "SDG-4": "SDG-4: Quality Education",
        "SDG-5": "SDG-5: Gender Equality",
        "SDG-6": "SDG-6: Clean Water and Sanitation",
        "SDG-7": "SDG-7: Affordable and Clean Energy",
        "SDG-8": "SDG-8: Decent Work and Economic Growth",
        "SDG-9": "SDG-9: Industry, Innovation and Infrastructure",
        "SDG-10": "SDG-10: Reduced Inequality",
        "SDG-11": "SDG-11: Sustainable Cities and Communities",
        "SDG-12": "SDG-12: Responsible Consumption and Production",
        "SDG-13": "SDG-13: Climate Action",
        "SDG-14": "SDG-14: Life Below Water",
        "SDG-15": "SDG-15: Life on Land",
        "SDG-16": "SDG-16: Peace, Justice and Strong Institutions",
        "SDG-17": "SDG-17: Partnerships for the Goals"
    };
    const cleanCode = (sdgCode || "").trim();
    if (mapping[cleanCode]) return mapping[cleanCode];
    if (cleanCode.startsWith("SDG-")) return cleanCode;
    const key = `SDG-${cleanCode}`;
    return mapping[key] || cleanCode;
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
    const [actionLoading, setActionLoading] = useState(false);
    const [imgError, setImgError] = useState(false);

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
                journalQuartile: isResearchAdmin ? quartile : undefined
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
                journalQuartile: quartile
            });
            if (res.data?.success) {
                toast.success("Journal metrics updated successfully");
                setData(res.data.data);
                if (res.data.data.hIndex) setHIndex(res.data.data.hIndex);
                const updatedIF = res.data.data.jcrImpactFactor || res.data.data.impactFactor;
                if (updatedIF) setJcrImpactFactor(updatedIF);
                if (res.data.data.citations) setCitations(res.data.data.citations);
                if (res.data.data.journalQuartile) setQuartile(res.data.data.journalQuartile);
            }
        } catch (error) {
            console.error("Update metrics failed", error);
            toast.error(error.response?.data?.message || "Failed to update metrics. Please try again.");
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
            <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ mb: 2, color: "var(--color-primary)", fontWeight: 700, textTransform: "none" }}>Back to Request List</Button>

            {/* Header Card */}
            <Card sx={cardStyle}>
                <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "center", sm: "flex-start" }, gap: 2, mb: 4 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Box sx={{ width: 50, height: 50, borderRadius: "50%", bgcolor: "rgba(190, 147, 55, 0.1)", color: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}><ArticleIcon /></Box>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>{data.paperTitle}</Typography>
                            <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 600 }}>In: {data.journalName}</Typography>
                        </Box>
                    </Box>
                    <Box sx={{ textAlign: { xs: "center", sm: "right" } }}>
                        <Chip label="Journal Publication" sx={{ bgcolor: "rgba(22, 101, 52, 0.1)", color: "#2e7d32", fontWeight: 800, borderRadius: "8px", textTransform: "uppercase", fontSize: "0.65rem" }} />
                        <Typography variant="caption" sx={{ display: "block", mt: 1, color: "var(--text-secondary)", fontWeight: 700 }}>Submitted on {new Date(data.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</Typography>
                    </Box>
                </Box>

                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, width: "100%" }}>
                    <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 23%" } }}>
                        <LabelValue label="Academic Year" value={data.academicYear?.year} />
                    </Box>
                    <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 23%" } }}>
                        <LabelValue label="Reference ID" value={`JP-${new Date(data.createdAt).getFullYear()}-${data._id.substring(data._id.length - 6).toUpperCase()}`} />
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

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(2, 1fr)" }, gap: 3, mb: 3 }}>
                {/* Applicant Info */}
                    <Card sx={{ ...cardStyle, height: "100%", mb: 0 }}>
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
                                <LabelValue label="Department" value={facultyId?.coreDepartment?.name} horizontal />
                                <LabelValue label="Emp ID" value={facultyId?.institutionId} horizontal />
                                <LabelValue label="Contact" value={facultyId?.phone} horizontal />
                                <LabelValue label="College" value={facultyId?.college || "Aditya University"} horizontal />
                            </Box>
                        </Box>
                    </Card>

                {/* Article Info */}
                    <Card sx={{ ...cardStyle, height: "100%", mb: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}><ArticleIcon sx={{ color: "var(--color-primary)" }} /><Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Article Information</Typography></Box>
                        <Box sx={{ display: "flex", flexDirection: "column" }}>
                            <LabelValue label="Article Title" value={data.paperTitle || "-"} horizontal />
                            <LabelValue label="DOI" value={data.doi || "-"} horizontal />
                            <LabelValue 
                                label="Applicant Author Position" 
                                value={data.userAuthorPosition ? `${data.userAuthorPosition} / ${data.totalAuthors}` : (data.firstAuthor === "Yes" ? "1" : data.authorPosition || "-")} 
                                horizontal 
                            />
                            <LabelValue label="SDGS" value={data.sdgs ? data.sdgs.split(', ').map(getSdgName).join(', ') : "-"} horizontal />
                            <LabelValue label="Seed Grant Work" value={data.applyingSeedGrant || "No"} horizontal />
                            <LabelValue label="Incentive Applied" horizontal chip={
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                    <Chip label={data.applyIncentive} size="small" sx={{ bgcolor: data.applyIncentive === 'Yes' ? "rgba(76, 175, 80, 0.1)" : "var(--bg-panel)", color: data.applyIncentive === 'Yes' ? "#4caf50" : "var(--text-secondary)", fontWeight: 800, border: "1px solid", borderColor: data.applyIncentive === 'Yes' ? "#4caf5044" : "var(--border-color)" }} />
                                    {data.applyIncentive === 'Yes' && data.status === 'Approved' && data.approvedAmount && (
                                        <Typography variant="body2" sx={{ fontWeight: 800, color: "#4caf50" }}>₹{data.approvedAmount}</Typography>
                                    )}
                                </Box>
                            } />
                        </Box>
                    </Card>

                {/* Journal Information */}
                    <Card sx={{ ...cardStyle, height: "100%", mb: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}><MenuBookIcon sx={{ color: "var(--color-primary)" }} /><Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Journal Information</Typography></Box>
                        <Box sx={{ display: "flex", flexDirection: "column" }}>
                            <LabelValue label="Journal Name" value={data.journalName || "-"} horizontal />
                            <LabelValue label="Journal Type" value={data.journalType || "-"} horizontal />
                            <LabelValue label="Publication Scope" value={data.publicationScope || "-"} horizontal />
                            <LabelValue 
                                label="Month/Year" 
                                value={`${data.publishedMonth || data.month || "-"} ${data.publishedYear || data.year || "-"}`} 
                                horizontal 
                            />
                            <LabelValue label="Volume" value={data.vol || "-"} horizontal />
                            <LabelValue label="Issue" value={data.issue || "-"} horizontal />
                        </Box>
                    </Card>

                {/* Journal and Article Metrics */}
                    <Card sx={{ ...cardStyle, height: "100%", mb: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}><HistoryIcon sx={{ color: "var(--color-primary)" }} /><Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Journal and Article Metrics</Typography></Box>
                        <Box sx={{ display: "flex", flexDirection: "column" }}>
                            <LabelValue label="Quartile" value={data.journalQuartile || data.categoryOfJournal || "-"} horizontal />
                            <LabelValue label="Journal H-Index" value={data.hIndex || "-"} horizontal />
                            <LabelValue label="Impact Factor (JCR)" value={data.jcrImpactFactor || data.impactFactor || "-"} horizontal />
                            <LabelValue label="Citations" value={data.citations || "-"} horizontal />
                            <LabelValue label="AGEC Referencing Numbers" value={data.agecReferencingNumbers || data.referencingNos || "-"} horizontal />
                            <LabelValue label="Number of References Belonging to AGEC" value={data.numberOfReferencesBelongingToAGEC !== undefined ? data.numberOfReferencesBelongingToAGEC : (data.papersCited !== undefined ? data.papersCited : "-")} horizontal />
                        </Box>
                    </Card>
            </Box>

            {/* Co-Authors */}
            {data.coAuthors?.length > 0 && (
                <Card sx={{ ...cardStyle, p: 0, overflow: "hidden" }}>
                    <Box sx={{ p: 3, pb: 2 }}><Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}><GroupsIcon sx={{ color: "var(--color-primary)" }} /><Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Co-Authors</Typography></Box></Box>
                    <TableContainer><Table><TableHead sx={{ bgcolor: "var(--bg-panel)" }}><TableRow>
                        <TableCell sx={{ color: "var(--text-secondary)", fontWeight: 800, fontSize: "0.7rem", textTransform: "uppercase" }}>#</TableCell>
                        <TableCell sx={{ color: "var(--text-secondary)", fontWeight: 800, fontSize: "0.7rem", textTransform: "uppercase" }}>NAME</TableCell>
                        <TableCell sx={{ color: "var(--text-secondary)", fontWeight: 800, fontSize: "0.7rem", textTransform: "uppercase" }}>AFFILIATION</TableCell>
                    </TableRow></TableHead><TableBody>
                        {data.coAuthors.map((ca, i) => (
                            <TableRow key={i}><TableCell sx={{ fontWeight: 800, color: "var(--color-primary)" }}>{i + 1}</TableCell><TableCell sx={{ fontWeight: 700, color: "var(--text-primary)" }}>{ca.name}</TableCell><TableCell sx={{ fontWeight: 600, color: "var(--text-secondary)" }}>{ca.affiliation}</TableCell></TableRow>
                        ))}
                    </TableBody></Table></TableContainer>
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

                            {isResearchAdmin && (
                                <Card sx={{ ...cardStyle, borderTop: "4px solid var(--color-primary)", mb: 0 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                                        <GavelIcon sx={{ color: "var(--color-primary)" }} />
                                        <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Update Journal Metrics</Typography>
                                    </Box>
                                    
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
                                            <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1, color: "var(--color-primary)", fontSize: "0.75rem" }}>IMPACT FACTOR (JCR)</Typography>
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
                                    </Box>

                                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                                        <Button 
 variant="contained" 
 disabled={actionLoading} 
 onClick={handleUpdateMetrics} 
 sx={{ bgcolor: "var(--color-primary)", color: "#fff", fontWeight: 800, textTransform: "none", px: 4, "&:hover": { opacity: 0.9 } }}
 >
                                            Update Metrics
                                        </Button>
                                    </Box>
                                </Card>
                            )}
                        </Stack>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default JournalApprovalDetail;