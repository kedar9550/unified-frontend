import Loader from "../../../components/common/Loader";
import React, { useState, useEffect } from "react";
import {
    Box, Typography, Grid, Card, Button, TextField, Select, MenuItem,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Stack
} from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import PersonIcon from '@mui/icons-material/Person';
import DescriptionIcon from '@mui/icons-material/Description';
import HistoryIcon from '@mui/icons-material/History';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import GroupsIcon from '@mui/icons-material/Groups';
import DownloadIcon from '@mui/icons-material/Download';
import GavelIcon from '@mui/icons-material/Gavel';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { toast } from "sonner";
import API from "../../../api/axios";
import { useAuth } from "../../../context/AuthContext";
import EditInvestigatorsDialog from "./EditInvestigatorsDialog";

const consultancyTypes = [
    { value: "testing", label: "Testing" },
    { value: "design", label: "Design" },
    { value: "training", label: "Training" },
    { value: "individual", label: "Any individual faculty" },
    { value: "advisory", label: "Advisory" },
    { value: "others", label: "Others" }
];

const monthsList = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const ConsultancyApprovalDetail = ({ id, onBack, role }) => {
    const { user, activeRole } = useAuth();
    const effectiveRole = role || activeRole || user?.selectedRole || user?.role || '';
    const isDean = effectiveRole === 'RESEARCH_DEAN';
    const isCoordinator = effectiveRole === 'RESEARCH_COORDINATOR';
    const isResearchAdmin = isDean || isCoordinator;
    const isHOD = !isResearchAdmin;

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [remarks, setRemarks] = useState("");
    const [approvedAmount, setApprovedAmount] = useState("");
    const [appraisalEligible, setAppraisalEligible] = useState("");
    const [decisionMode, setDecisionMode] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [imgError, setImgError] = useState(false);

    // In-page editing states
    const [isEditingDetails, setIsEditingDetails] = useState(false);
    const [editableData, setEditableData] = useState({});
    const [detailsSaving, setDetailsSaving] = useState(false);
    const [isInvestigatorsModalOpen, setIsInvestigatorsModalOpen] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await API.get(`/api/research/consultancy/${id}`);
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
                console.error("Failed to fetch consultancy details", error);
                toast.error(error.response?.data?.message || "Failed to load details");
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id, isResearchAdmin]);

    const handleAction = async (action) => {
        if (!remarks && action === 'Reject') {
            toast.error('Remarks are required for rejection');
            return;
        }

        if (action === 'Approve' && isResearchAdmin && !appraisalEligible) {
            toast.error('Please select Appraisal Eligible status');
            return;
        }

        setActionLoading(true);
        try {
            const endpoint = isResearchAdmin ? `/api/research/consultancy/rnd-action/${id}` : `/api/research/consultancy/hod-action/${id}`;
            const res = await API.put(endpoint, {
                action,
                comment: remarks,
                appraisalEligible,
                approvedAmount
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

    const handleStartEdit = () => {
        let formattedDate = "";
        if (data.receivedAmountDate) {
            try {
                formattedDate = new Date(data.receivedAmountDate).toISOString().split('T')[0];
            } catch (e) {
                formattedDate = "";
            }
        }

        const computedTotal = data.totalInvestigators !== undefined && data.totalInvestigators !== null
            ? data.totalInvestigators
            : ((data.coInvestigators?.length || 0) + 1);

        const currentRole = data.investigatorType || (data.principalInvestigator === 'Yes' ? 'Principal Investigator (PI)' : 'Co-Principal Investigator (Co-PI)');
        const isPI = currentRole.includes('Principal Investigator (PI)') || currentRole === 'Principal Investigator';

        setEditableData({
            title: data.title || "",
            typeOfConsultancy: (data.typeOfConsultancy || "testing").toLowerCase(),
            fundingIndustry: data.fundingIndustry || "",
            amount: data.amount !== undefined ? data.amount : "",
            receivedAmount: data.receivedAmount !== undefined ? data.receivedAmount : "",
            receivedAmountDate: formattedDate,
            duration: data.duration !== undefined ? data.duration : "",
            month: data.month || "",
            year: data.year || "",
            investigatorType: currentRole,
            principalInvestigator: isPI ? "Yes" : "No",
            coPrincipalInvestigator: isPI ? "No" : "Yes",
            totalInvestigators: computedTotal,
            coInvestigators: data.coInvestigators ? JSON.parse(JSON.stringify(data.coInvestigators)) : [],
            applyIncentive: data.applyIncentive || "No"
        });
        setIsEditingDetails(true);
    };

    const handleSaveDetails = async () => {
        setDetailsSaving(true);
        try {
            const isPI = (editableData.investigatorType || '').includes('Principal Investigator (PI)') || editableData.investigatorType === 'Principal Investigator';
            const payload = {
                ...editableData,
                totalInvestigators: Number(editableData.totalInvestigators) || 1,
                principalInvestigator: isPI ? 'Yes' : 'No',
                coPrincipalInvestigator: isPI ? 'No' : 'Yes'
            };
            const res = await API.put(`/api/hod/research-requests/consultancy/${data._id}`, payload);
            if (res.data?.success) {
                const freshRes = await API.get(`/api/research/consultancy/${data._id}`);
                if (freshRes.data?.success) {
                    setData(freshRes.data.data);
                } else {
                    setData(res.data.data);
                }
                setIsEditingDetails(false);
                toast.success("Consultancy details updated successfully");
            } else {
                toast.error(res.data?.message || "Failed to update consultancy details");
            }
        } catch (err) {
            console.error("Save details error:", err);
            toast.error(err.response?.data?.message || "Failed to update consultancy details");
        } finally {
            setDetailsSaving(false);
        }
    };

    if (loading) return null;
    if (!data) return <Box sx={{ textAlign: 'center', p: 5 }}><Typography color="error">Failed to load data.</Typography><Button onClick={onBack} sx={{ mt: 2 }}>Go Back</Button></Box>;

    const { facultyId } = data;
    const mainFacultyName = facultyId?.name || "Faculty Applicant";

    const currentCoInvestigators = isEditingDetails ? (editableData.coInvestigators || []) : (data.coInvestigators || []);
    const adityaCoInvNames = currentCoInvestigators
        .filter(c => c.affiliationType === "Aditya University" || c.employeeId || c.affiliation === "Aditya University")
        .map(c => c.name)
        .filter(Boolean);
    const allClaimants = [mainFacultyName, ...adityaCoInvNames].filter((v, i, a) => v && a.indexOf(v) === i);
    const appraisalClaimantsStr = allClaimants.length > 0 ? allClaimants.join(", ") : "-";

    const currentTotalInvestigators = isEditingDetails
        ? (Number(editableData.totalInvestigators) || (currentCoInvestigators.length + 1))
        : (data.totalInvestigators !== undefined && data.totalInvestigators !== null ? data.totalInvestigators : ((data.coInvestigators?.length || 0) + 1));

    const calculatedEstimatedIncentive = (() => {
        const applyInc = isEditingDetails ? editableData.applyIncentive : data.applyIncentive;
        if (applyInc !== "Yes") return "₹0";

        if (isEditingDetails) {
            const recAmt = parseFloat(String(editableData.receivedAmount || "0").replace(/,/g, "")) || 0;
            const type = (editableData.typeOfConsultancy || "").toLowerCase().trim();
            let est = 0;
            if (type === "testing") {
                est = Math.round(recAmt * 0.50);
            } else if (type === "design") {
                est = Math.round(recAmt * 0.60);
            } else if (type === "training" || type === "individual") {
                est = Math.round(recAmt * 0.80);
            }
            return `₹${est.toLocaleString('en-IN')}`;
        }
        return data.estimatedIncentiveAmount ? `₹${Number(data.estimatedIncentiveAmount).toLocaleString('en-IN')}` : "₹0";
    })();

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
            alignItems: horizontal ? "center" : "flex-start", justifyContent: horizontal ? "space-between" : "center",
            gap: horizontal ? 2 : 0.5, transition: "all 0.3s ease",
            borderBottom: horizontal ? "1px solid var(--border-color)" : "1px solid transparent",
            "&:last-child": { borderBottom: "none" },
            "&:hover": { borderColor: "var(--color-primary)", bgcolor: "rgba(190, 147, 55, 0.05)", transform: "translateY(-2px)", boxShadow: "var(--shadow-premium)" }
        }}>
            <Typography variant="caption" sx={{ flex: horizontal ? { xs: "0 0 130px", sm: "0 0 170px" } : "none", color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 900, fontSize: "0.68rem", mb: horizontal ? 0 : 0.5 }}>{label}</Typography>
            <Box sx={{ flex: horizontal ? 1 : "none", display: horizontal ? "flex" : "block", justifyContent: horizontal ? "flex-end" : "flex-start" }}>
                {chip ? chip : <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.9rem", textAlign: horizontal ? "right" : "left" }}>{value || "-"}</Typography>}
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
                    <IconButton size="small" href={fileUrl} download target="_blank" sx={{ color: "var(--color-primary)" }}>
                        <DownloadIcon fontSize="small" />
                    </IconButton>
                </Box>
                <Box sx={{
                    height: 200, display: "flex", alignItems: "center", justifyContent: "center",
                    border: "1px solid var(--border-color)", background: "var(--bg-panel)", borderRadius: "12px",
                    overflow: "hidden", cursor: "pointer", transition: "all 0.3s ease",
                    "&:hover": { borderColor: "var(--color-primary)", transform: "translateY(-4px)", boxShadow: "var(--shadow-premium)" }
                }} onClick={() => window.open(fileUrl, '_blank')}>
                    {isImage ? (
                        <img src={fileUrl} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                        <Box sx={{ textAlign: "center" }}>
                            <DescriptionIcon sx={{ fontSize: 40, color: "var(--text-secondary)", mb: 1 }} />
                            <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 700 }}>PDF View</Typography>
                        </Box>
                    )}
                </Box>
            </Grid>
        );
    };

    const consultancyDetailsList = [
        {
            key: "title",
            label: "Title of Work",
            value: data.title || "-",
            editable: true,
            type: "text"
        },
        {
            key: "typeOfConsultancy",
            label: "Type of Consultancy",
            value: data.typeOfConsultancy ? data.typeOfConsultancy.charAt(0).toUpperCase() + data.typeOfConsultancy.slice(1) : "-",
            editable: true,
            type: "select",
            options: consultancyTypes
        },
        {
            key: "fundingIndustry",
            label: "Funding Industry",
            value: data.fundingIndustry || "-",
            editable: true,
            type: "text"
        },
        {
            key: "amount",
            label: "Consultancy Amount",
            value: `₹${data.amount || 0}`,
            editable: true,
            type: "number"
        },
        {
            key: "receivedAmount",
            label: "Received Amount",
            value: data.receivedAmount ? `₹${data.receivedAmount}` : "-",
            editable: true,
            type: "number"
        },
        {
            key: "receivedAmountDate",
            label: "Date of Amount Received",
            value: data.receivedAmountDate ? new Date(data.receivedAmountDate).toLocaleDateString() : "-",
            editable: true,
            type: "date"
        },
        {
            key: "duration",
            label: "Duration",
            value: data.duration || "-",
            editable: true,
            type: "text"
        },
        {
            key: "month",
            label: "Commencement Month",
            value: data.month || "-",
            editable: true,
            type: "select",
            options: monthsList
        },
        {
            key: "year",
            label: "Commencement Year",
            value: data.year || "-",
            editable: true,
            type: "number"
        },
        {
            key: "investigatorType",
            label: "Your Role in Consultancy",
            value: data.investigatorType || (data.principalInvestigator === 'Yes' ? 'Principal Investigator (PI)' : 'Co-Principal Investigator (Co-PI)'),
            editable: true,
            type: "select",
            options: [
                "Principal Investigator (PI)",
                "Co-Principal Investigator (Co-PI)"
            ]
        },
        {
            key: "totalInvestigators",
            label: "Total Number of Investigators",
            editable: true,
            type: "investigators",
            chip: (
                <Box sx={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    px: 1.5, height: 28, borderRadius: '8px',
                    bgcolor: 'var(--bg-panel)', border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)', fontWeight: 900, fontSize: '0.85rem'
                }}>
                    {currentTotalInvestigators} Investigator{currentTotalInvestigators > 1 ? 's' : ''}
                </Box>
            )
        },
        ...((data.entryType === 'Admin' || data.isDirectEntry === 'true' || data.isDirectEntry === true) ? [{
            key: "entryType",
            label: "Entry Type",
            value: "R&D Direct Entry",
            editable: false
        }] : []),
        {
            key: "appraisalEligible",
            label: "Appraisal Eligible?",
            value: data.status === "Approved" ? (data.appraisalEligible || "No") : "Not yet decided",
            editable: false
        },
        {
            key: "appraisalClaimants",
            label: "Appraisal Claimant(s)",
            value: appraisalClaimantsStr,
            editable: false
        },
        {
            key: "applyIncentive",
            label: "Applying for Incentive?",
            value: data.applyIncentive || "No",
            editable: true,
            type: "select",
            options: ["Yes", "No"]
        },
        ...((isEditingDetails ? editableData.applyIncentive === "Yes" : data.applyIncentive === "Yes") ? [{
            key: "estimatedIncentiveAmount",
            label: "Estimated Incentive Amount",
            value: calculatedEstimatedIncentive,
            editable: false
        }] : [])
    ];

    return (
        <Box sx={{ width: "100%", pb: 5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ color: "var(--color-primary)", fontWeight: 700, textTransform: "none" }}>Back to Request List</Button>
            </Box>

            <Card sx={cardStyle}>
                <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "center", sm: "flex-start" }, gap: 2, mb: 4 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Box sx={{ width: 50, height: 50, borderRadius: "50%", bgcolor: "rgba(190, 147, 55, 0.1)", color: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}><BusinessCenterIcon /></Box>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>{data.title}</Typography>
                            <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 600 }}>Funding Industry: {data.fundingIndustry}</Typography>
                        </Box>
                    </Box>
                    <Box sx={{ textAlign: { xs: "center", sm: "right" }, display: "flex", flexDirection: "column", alignItems: { xs: "center", sm: "flex-end" }, gap: 0.5 }}>
                        <Box sx={{ display: "flex", gap: 1 }}>
                            {(data.entryType === 'Admin' || data.isDirectEntry === 'true' || data.isDirectEntry === true) && (
                                <Chip label="R&D Direct Entry" sx={{ bgcolor: "rgba(124, 58, 237, 0.1)", color: "#7c3aed", border: "1px solid rgba(124, 58, 237, 0.3)", fontWeight: 800, borderRadius: "8px", fontSize: "0.65rem" }} />
                            )}
                            <Chip label="Consultancy Work" sx={{ bgcolor: "rgba(190, 24, 93, 0.1)", color: "#BE185D", fontWeight: 800, borderRadius: "8px", textTransform: "uppercase", fontSize: "0.65rem" }} />
                        </Box>
                        <Typography variant="caption" sx={{ display: "block", mt: 0.5, color: "var(--text-secondary)", fontWeight: 700 }}>Submitted on {new Date(data.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</Typography>
                    </Box>
                </Box>

                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, width: "100%" }}>
                    <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 23%" } }}>
                        <LabelValue label="Academic Year" value={data.academicYear?.year} />
                    </Box>
                    <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 23%" } }}>
                        <LabelValue label="Reference ID" value={`CON-${new Date(data.createdAt).getFullYear()}-${data._id.substring(data._id.length - 6).toUpperCase()}`} />
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
                            <LabelValue label="PAN Number" value={data.panNumber} horizontal />
                            <LabelValue label="College" value={data.college || "Aditya University"} horizontal />
                        </Box>
                    </Box>
                </Card>

                <Card sx={{ ...cardStyle, flex: { xs: "1 1 100%", lg: "1 1 48%" }, mb: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <BusinessCenterIcon sx={{ color: "var(--color-primary)" }} />
                            <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Consultancy Details</Typography>
                        </Box>
                        {isResearchAdmin && (
                            isEditingDetails ? (
                                <Box sx={{ display: "flex", gap: 1 }}>
                                    <Button size="small" variant="outlined" color="inherit" onClick={() => setIsEditingDetails(false)} disabled={detailsSaving} sx={{ borderRadius: "8px", textTransform: "none" }}>Cancel</Button>
                                    <Button
                                        size="small"
                                        variant="contained"
                                        color="primary"
                                        startIcon={<SaveIcon />}
                                        disabled={detailsSaving}
                                        onClick={handleSaveDetails}
                                        sx={{ borderRadius: "8px", textTransform: "none" }}
                                    >
                                        {detailsSaving ? "Saving..." : "Save Details"}
                                    </Button>
                                </Box>
                            ) : (
                                <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<EditIcon />}
                                    onClick={handleStartEdit}
                                    sx={{ borderRadius: "8px", textTransform: "none" }}
                                >
                                    Edit
                                </Button>
                            )
                        )}
                    </Box>

                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                        {consultancyDetailsList.map((item, idx, arr) => (
                            <Box
                                key={item.key || idx}
                                sx={{
                                    p: "10px 16px",
                                    borderRadius: "14px",
                                    background: "transparent",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 2,
                                    borderBottom: idx === arr.length - 1 ? "none" : "1px solid var(--border-color)",
                                    "&:hover": { borderColor: "var(--color-primary)", bgcolor: "rgba(190, 147, 55, 0.05)", transform: "translateY(-2px)", boxShadow: "var(--shadow-premium)" },
                                    transition: "all 0.3s ease"
                                }}
                            >
                                <Typography variant="caption" sx={{ flex: { xs: "0 0 130px", sm: "0 0 170px" }, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 900, fontSize: "0.68rem" }}>
                                    {item.label}
                                </Typography>

                                <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
                                    {isEditingDetails && item.editable ? (
                                        item.key === "totalInvestigators" ? (
                                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    value={editableData.totalInvestigators || ""}
                                                    onChange={(e) => setEditableData({ ...editableData, totalInvestigators: e.target.value })}
                                                    sx={{ width: 85, "& .MuiInputBase-root": { height: 34, fontSize: "0.875rem", borderRadius: "8px" }, bgcolor: "var(--bg-panel)" }}
                                                    inputProps={{ min: 1 }}
                                                />
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={() => setIsInvestigatorsModalOpen(true)}
                                                    sx={{ height: 34, textTransform: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                                                >
                                                    Edit Investigators Details
                                                </Button>
                                            </Box>
                                        ) : item.type === "select" ? (
                                            <Select
                                                size="small"
                                                value={editableData[item.key] !== undefined ? editableData[item.key] : ""}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (item.key === "investigatorType") {
                                                        const isPI = val === 'Principal Investigator (PI)' || val === 'Principal Investigator';
                                                        setEditableData(prev => ({
                                                            ...prev,
                                                            investigatorType: val,
                                                            principalInvestigator: isPI ? 'Yes' : 'No',
                                                            coPrincipalInvestigator: isPI ? 'No' : 'Yes'
                                                        }));
                                                    } else {
                                                        setEditableData(prev => ({ ...prev, [item.key]: val }));
                                                    }
                                                }}
                                                sx={{ minWidth: 160, height: 34, fontSize: "0.875rem", borderRadius: "8px", bgcolor: "var(--bg-panel)" }}
                                            >
                                                {item.options.map((opt) => {
                                                    const optVal = typeof opt === 'object' ? opt.value : opt;
                                                    const optLabel = typeof opt === 'object' ? opt.label : opt;
                                                    return <MenuItem key={optVal} value={optVal}>{optLabel}</MenuItem>;
                                                })}
                                            </Select>
                                        ) : (
                                            <TextField
                                                size="small"
                                                type={item.type === "number" ? "number" : item.type === "date" ? "date" : "text"}
                                                value={editableData[item.key] !== undefined ? editableData[item.key] : ""}
                                                onChange={(e) => setEditableData(prev => ({ ...prev, [item.key]: e.target.value }))}
                                                sx={{ minWidth: 160, "& .MuiInputBase-root": { height: 34, fontSize: "0.875rem", borderRadius: "8px" }, bgcolor: "var(--bg-panel)" }}
                                                InputLabelProps={item.type === "date" ? { shrink: true } : {}}
                                            />
                                        )
                                    ) : item.chip ? (
                                        item.chip
                                    ) : (
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.9rem", textAlign: "right", maxWidth: "65%", wordBreak: "break-word" }}>
                                            {item.value || "-"}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </Card>
            </Box>

            {currentCoInvestigators && currentCoInvestigators.length > 0 && (
                <Card sx={{ ...cardStyle, p: 0, overflow: "hidden", mb: 3 }}>
                    <Box sx={{ p: 3, pb: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <GroupsIcon sx={{ color: "var(--color-primary)" }} />
                            <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Co-Investigators Details</Typography>
                            <Box sx={{ ml: 'auto', px: 1.5, py: 0.5, borderRadius: '20px', bgcolor: 'rgba(190,147,55,0.12)', border: '1px solid rgba(190,147,55,0.3)' }}>
                                <Typography variant="caption" sx={{ fontWeight: 900, color: 'var(--color-primary)', fontSize: '0.7rem' }}>
                                    Total: {currentCoInvestigators.length} Co-Investigator{currentCoInvestigators.length !== 1 ? 's' : ''}
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
                                    <TableCell sx={{ color: "var(--text-secondary)", fontWeight: 800, fontSize: "0.7rem", textTransform: "uppercase" }}>AFFILIATION</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {currentCoInvestigators.map((ca, i) => {
                                    const roleLabel = ca.role || (ca.principalInvestigator === 'Yes' ? 'Principal Investigator' : 'Co-Investigator');
                                    return (
                                        <TableRow key={i} sx={{ '&:hover': { bgcolor: 'rgba(190,147,55,0.04)' } }}>
                                            <TableCell>
                                                <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', bgcolor: 'rgba(190,147,55,0.12)', border: '1.5px solid var(--color-primary)', color: 'var(--color-primary)', fontWeight: 900, fontSize: '0.85rem' }}>{i + 1}</Box>
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: "var(--text-primary)" }}>
                                                {ca.name || "-"}
                                                {ca.employeeId && <Typography variant="caption" sx={{ display: 'block', color: 'var(--text-secondary)', fontWeight: 600 }}>Staff Code: {ca.employeeId}</Typography>}
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={roleLabel} size="small" color={roleLabel === 'Principal Investigator' ? 'primary' : 'secondary'} variant="outlined" sx={{ fontWeight: 700, borderRadius: '6px', fontSize: '0.7rem' }} />
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: "var(--text-secondary)" }}>
                                                {ca.affiliation || 'Aditya University'}
                                                {ca.department && <Typography variant="caption" sx={{ display: 'block', color: 'var(--text-secondary)', fontWeight: 600 }}>{ca.department}</Typography>}
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
            {(data.sanctionLetter || data.mou) && (
                <Card sx={cardStyle}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                        <AttachFileIcon sx={{ color: "var(--color-primary)" }} />
                        <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Attached Documents</Typography>
                    </Box>
                    <Grid container spacing={3}>
                        {data.sanctionLetter && renderFilePreview("Account In-charge approval certificate", data.sanctionLetter, 1)}
                        {data.mou && renderFilePreview("MOU Document", data.mou, 2)}
                    </Grid>
                </Card>
            )}

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mt: 3 }}>
                {data.hodComment && <Box sx={{ flex: 1, minWidth: 300 }}><Card sx={{ ...cardStyle, borderLeft: "4px solid #ffc107", height: "100%", mb: 0 }}><Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}><HistoryIcon sx={{ color: "#ffc107" }} /><Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>HOD Review</Typography></Box><Box sx={{ p: 2, bgcolor: "rgba(255, 193, 7, 0.05)", borderRadius: "10px", border: "1px solid #ffc10733" }}><Typography variant="body2" sx={{ fontStyle: "italic", fontWeight: 600 }}>"{data.hodComment}"</Typography></Box></Card></Box>}

                <Box sx={{ flex: 1, minWidth: 350 }}>
                    {((isResearchAdmin && /pending/i.test(data.status)) || (isHOD && data.status === 'Pending')) ? (
                        <Card sx={{ ...cardStyle, borderTop: "4px solid var(--color-primary)", mb: 0 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}><GavelIcon sx={{ color: "var(--color-primary)" }} /><Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Review Decision</Typography></Box>

                            {!decisionMode ? (
                                <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", position: "relative", zIndex: 1 }}>
                                    <Button variant="outlined" color="error" onClick={() => setDecisionMode('Reject')} sx={{ px: 3, cursor: "pointer" }}>Reject</Button>
                                    <Button variant="contained" color="success" onClick={() => setDecisionMode('Approve')} sx={{ px: 4, cursor: "pointer" }}>{isHOD ? "Approve & Forward" : "Final Approve"}</Button>
                                </Box>
                            ) : (
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                    {decisionMode === 'Approve' && isResearchAdmin && (
                                        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                                            <Box sx={{ flex: "1 1 200px" }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1, color: "var(--color-primary)", fontSize: "0.75rem" }}>CONSULTANCY ELIGIBILITY FOR APPRAISAL *</Typography>
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
                                            {decisionMode === 'Reject' ? (actionLoading ? "Rejecting..." : "Confirm Reject") : (actionLoading ? "Saving..." : "Approve")}
                                        </Button>
                                    </Box>
                                </Box>
                            )}
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
                                        {data.approvedAmount && <Typography variant="h6" sx={{ mt: 2, fontWeight: 900, color: "#10b981" }}>Approved Amount: ₹{data.approvedAmount}</Typography>}
                                    </Box>
                                )}
                            </Card>
                        </Stack>
                    )}
                </Box>
            </Box>

            <EditInvestigatorsDialog
                open={isInvestigatorsModalOpen}
                onClose={() => setIsInvestigatorsModalOpen(false)}
                coInvestigators={editableData.coInvestigators || []}
                totalInvestigators={editableData.totalInvestigators || 1}
                investigatorType={editableData.investigatorType || "Principal Investigator (PI)"}
                onSave={(invData) => {
                    const isPI = invData.investigatorType === 'Principal Investigator (PI)' || invData.investigatorType === 'Principal Investigator';
                    setEditableData(prev => ({
                        ...prev,
                        coInvestigators: invData.coInvestigators,
                        totalInvestigators: invData.totalInvestigators,
                        investigatorType: invData.investigatorType,
                        principalInvestigator: isPI ? 'Yes' : 'No',
                        coPrincipalInvestigator: isPI ? 'No' : 'Yes'
                    }));
                }}
            />
        </Box>
    );
};

export default ConsultancyApprovalDetail;
