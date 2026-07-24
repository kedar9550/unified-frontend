import Loader from "../../../components/common/Loader";
import React, { useState, useEffect } from "react";
import {
    Box, Typography, Grid, Card, Button, TextField,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Stack
} from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PersonIcon from '@mui/icons-material/Person';
import DescriptionIcon from '@mui/icons-material/Description';
import GroupsIcon from '@mui/icons-material/Groups';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import HistoryIcon from '@mui/icons-material/History';
import GavelIcon from '@mui/icons-material/Gavel';
import DownloadIcon from '@mui/icons-material/Download';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { toast } from "sonner";
import API from "../../../api/axios";

const FundedProjectApprovalDetail = ({ id, onBack, role }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [remarks, setRemarks] = useState("");
    const [approvedAmount, setApprovedAmount] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [imgError, setImgError] = useState(false);

    const isHOD = !role || role === 'HOD';
    const isDean = role === 'RESEARCH_DEAN';
    const isCoordinator = role === 'RESEARCH_COORDINATOR';
    const isResearchAdmin = isDean || isCoordinator;

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await API.get(`/api/research/funded-project/${id}`);
                if (res.data?.success) {
                    setData(res.data.data);
                    if (res.data.data.rndComment) setRemarks(res.data.data.rndComment);
                    else if (res.data.data.hodComment) setRemarks(res.data.data.hodComment);
                    if (res.data.data.approvedAmount) setApprovedAmount(res.data.data.approvedAmount);
                }
            } catch (error) {
                console.error("Failed to fetch funded project details", error);
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

        setActionLoading(true);
        try {
            const endpoint = isResearchAdmin ? `/api/research/funded-project/rnd-action/${id}` : `/api/research/funded-project/hod-action/${id}`;
            const res = await API.put(endpoint, {
                action,
                comment: remarks
            });
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
            <Grid key={index} item xs={12} sm={6} md={4}>
                <Box sx={{ mb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "var(--color-primary)", fontSize: "0.75rem", textTransform: "uppercase" }}>
                        {index}. {title}
                    </Typography>
                    <IconButton size="small" href={fileUrl} download target="_blank" sx={{ color: "var(--color-primary)" }}><DownloadIcon fontSize="small" /></IconButton>
                </Box>
                <Box sx={{
                    height: 200, display: "flex", alignItems: "center", justifyContent: "center",
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
        position: "relative",
        p: 3,
        mb: 3,
        borderRadius: "20px",
        border: "1px solid var(--border-color)",
        background: "var(--bg-glass)",
        backdropFilter: "blur(10px)",
        boxShadow: "var(--shadow-premium)",
        overflow: "hidden",
        "&::after": {
            content: '""',
            position: "absolute",
            top: 0,
            right: 0,
            width: "140px",
            height: "140px",
            background: "radial-gradient(circle at top right, var(--color-primary-alpha), transparent 70%)",
            zIndex: 0
        }
    };

    return (
        <Box sx={{ width: "100%", pb: 5 }}>
            <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ mb: 2, color: "var(--color-primary)", fontWeight: 700, textTransform: "none" }}>Back to Request List</Button>

            {/* Header Card */}
            <Card sx={cardStyle}>
                <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "center", sm: "flex-start" }, gap: 2, mb: 4 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Box sx={{ width: 50, height: 50, borderRadius: "50%", bgcolor: "rgba(190, 147, 55, 0.1)", color: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}><AssignmentIcon /></Box>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>{data.title}</Typography>
                            <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 600 }}>Agency: {data.fundingAgency}</Typography>
                        </Box>
                    </Box>
                    <Box sx={{ textAlign: { xs: "center", sm: "right" } }}>
                        <Chip label="Funded Project" sx={{ bgcolor: "rgba(22, 101, 52, 0.1)", color: "#2e7d32", fontWeight: 800, borderRadius: "8px", textTransform: "uppercase", fontSize: "0.65rem" }} />
                        <Typography variant="caption" sx={{ display: "block", mt: 1, color: "var(--text-secondary)", fontWeight: 700 }}>Submitted on {new Date(data.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</Typography>
                    </Box>
                </Box>

                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, width: "100%" }}>
                    <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 23%" } }}>
                        <LabelValue label="Academic Year" value={data.academicYear?.year} />
                    </Box>
                    <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 23%" } }}>
                        <LabelValue label="Reference ID" value={`FP-${new Date(data.createdAt).getFullYear()}-${data._id.substring(data._id.length - 6).toUpperCase()}`} />
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

                {/* Project Details */}
                <Card sx={{ ...cardStyle, flex: { xs: "1 1 100%", lg: "1 1 48%" }, mb: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}><AssignmentIcon sx={{ color: "var(--color-primary)" }} /><Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Project Details</Typography></Box>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                        <LabelValue label="Funding Agency" value={data.fundingAgency} horizontal />
                        <LabelValue label="Scheme" value={data.scheme} horizontal />
                        <LabelValue label="Investigator Type" value={data.investigatorType || (data.principalInvestigator === "Yes" ? "Principal Investigator (PI)" : "Co-Principal Investigator (Co-PI)")} horizontal />
                        <LabelValue label="Date of Sanction" value={new Date(data.sanctionDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} horizontal />
                        <LabelValue label="Sanctioned Amt" value={`₹${data.sanctionedAmount}`} horizontal />
                        <LabelValue label="Recurring" value={`₹${data.recurring || "0"}`} horizontal />
                        <LabelValue label="Non-Recurring" value={`₹${data.nonRecurring || "0"}`} horizontal />
                        <LabelValue label="Seed Grant Work" value={data.applyingSeedGrant || "No"} horizontal />
                    </Box>
                </Card>
            </Box>

            {/* Co-Investigators */}
            {data.coInvestigators?.length > 0 && (
                <Card sx={{ ...cardStyle, p: 0, overflow: "hidden", mb: 3 }}>
                    <Box sx={{ p: 3, pb: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <GroupsIcon sx={{ color: "var(--color-primary)" }} />
                            <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Co-Investigators Details</Typography>
                            <Box sx={{ ml: 'auto', px: 1.5, py: 0.5, borderRadius: '20px', bgcolor: 'rgba(190,147,55,0.12)', border: '1px solid rgba(190,147,55,0.3)' }}>
                                <Typography variant="caption" sx={{ fontWeight: 900, color: 'var(--color-primary)', fontSize: '0.7rem' }}>
                                Total: {data.coInvestigators.length} Co-Investigator{data.coInvestigators.length > 1 ? 's' : ''}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                    <TableContainer>
                        <Table>
                            <TableHead sx={{ bgcolor: "var(--bg-panel)" }}>
                                <TableRow>
                                    <TableCell sx={{ color: "var(--text-secondary)", fontWeight: 800, fontSize: "0.7rem", textTransform: "uppercase", width: 60 }}>S.No</TableCell>
                                    <TableCell sx={{ color: "var(--text-secondary)", fontWeight: 800, fontSize: "0.7rem", textTransform: "uppercase" }}>NAME</TableCell>
                                    <TableCell sx={{ color: "var(--text-secondary)", fontWeight: 800, fontSize: "0.7rem", textTransform: "uppercase" }}>ROLE</TableCell>
                                    <TableCell sx={{ color: "var(--text-secondary)", fontWeight: 800, fontSize: "0.7rem", textTransform: "uppercase" }}>AFFILIATION & DETAILS</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.coInvestigators.map((ca, i) => {
                                    const roleText = ca.role || (ca.principalInvestigator === "Yes" ? "Principal Investigator" : "Co-Investigator");
                                    return (
                                        <TableRow key={i} sx={{ '&:hover': { bgcolor: 'rgba(190,147,55,0.04)' } }}>
                                            <TableCell>
                                                <Box sx={{
                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                    width: 32, height: 32, borderRadius: '50%',
                                                    bgcolor: 'rgba(190, 147, 55, 0.12)', border: '1.5px solid var(--color-primary)',
                                                    color: 'var(--color-primary)', fontWeight: 900, fontSize: '0.85rem'
                                                }}>
                                                    {i + 1}
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: "var(--text-primary)" }}>
                                                {ca.name} {ca.employeeId ? `(Code: ${ca.employeeId})` : ""}
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>
                                                <Chip 
                                                    size="small" 
                                                    label={roleText} 
                                                    color={roleText.includes("Principal") ? "primary" : "secondary"} 
                                                    variant="outlined"
                                                    sx={{ fontWeight: 700, borderRadius: "6px" }} 
                                                />
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: "var(--text-secondary)" }}>
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--text-secondary)" }}>
                                                    {ca.affiliation || "Aditya University"}
                                                </Typography>
                                                {(ca.department || ca.designation) && (
                                                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                                                        {ca.department ? `Dept: ${ca.department}` : ""} {ca.designation ? `| Desig: ${ca.designation}` : ""}
                                                    </Typography>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Card>
            )}

            {/* Documents */}
            <Card sx={cardStyle}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}><AttachFileIcon sx={{ color: "var(--color-primary)" }} /><Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Attached Documents</Typography></Box>
                <Grid container spacing={3}>
                    {renderFilePreview("Sanction Order", data.sanctionOrder, 1)}
                </Grid>
            </Card>

            {/* Actions */}
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mt: 3 }}>
                {data.hodComment && <Box sx={{ flex: 1, minWidth: 300 }}><Card sx={{ ...cardStyle, borderLeft: "4px solid #ffc107", height: "100%", mb: 0 }}><Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}><HistoryIcon sx={{ color: "#ffc107" }} /><Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>HOD Review</Typography></Box><Box sx={{ p: 2, bgcolor: "rgba(255, 193, 7, 0.05)", borderRadius: "10px", border: "1px solid #ffc10733" }}><Typography variant="body2" sx={{ fontStyle: "italic", fontWeight: 600 }}>"{data.hodComment}"</Typography></Box></Card></Box>}
                
                <Box sx={{ flex: 1, minWidth: 350 }}>
                    {((isHOD && data.status === 'Pending at HOD') || (isResearchAdmin && data.status === 'Pending at R&D')) ? (
                        <Card sx={{ ...cardStyle, borderTop: "4px solid var(--color-primary)", mb: 0 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}><GavelIcon sx={{ color: "var(--color-primary)" }} /><Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Review Decision</Typography></Box>
                            
                            {/* Incentive input removed as there is no incentive for Funded Project */}
                            <TextField fullWidth multiline rows={3} placeholder="Provide your review comments..." value={remarks} onChange={e => setRemarks(e.target.value)} sx={{ mb: 3, "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: "var(--bg-panel)" } }} />

                            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                                <Button variant="outlined" color="error" disabled={actionLoading} onClick={() => handleAction('Reject')} sx={{ px: 3 }}>Reject</Button>
                                <Button variant="contained" color="success" disabled={actionLoading} onClick={() => handleAction('Approve')} sx={{ px: 4 }}>{isHOD ? "Approve & Forward" : "Final Approve"}</Button>
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
                                    {data.approvedAmount && <Typography variant="h6" sx={{ mt: 2, fontWeight: 900, color: "#10b981" }}>Approved Amount: ₹{data.approvedAmount}</Typography>}
                                </Box>
                            )}
                        </Card>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default FundedProjectApprovalDetail;