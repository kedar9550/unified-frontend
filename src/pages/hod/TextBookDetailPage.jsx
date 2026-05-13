import React, { useState, useEffect } from "react";
import { 
    Box, Typography, Grid, Card, Button, TextField, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    CircularProgress, Chip, IconButton
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
import API from "../../api/axios";

const TextBookDetailPage = ({ id, onBack }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [remarks, setRemarks] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await API.get(`/api/research/textbook/${id}`);
                if (res.data?.success) {
                    setData(res.data.data);
                    setRemarks(res.data.data.hodComment || "");
                }
            } catch (error) {
                console.error("Failed to fetch textbook details", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    const handleAction = async (action) => {
        if (!remarks && action === 'Reject') {
            alert('Remarks are required for rejection.');
            return;
        }

        setActionLoading(true);
        try {
            const res = await API.put(`/api/research/textbook/hod-action/${id}`, {
                action,
                comment: remarks
            });
            if (res.data?.success) {
                onBack(); // Go back to list on success
            }
        } catch (error) {
            console.error("Action failed", error);
            alert("Action failed. Please try again.");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!data) {
        return (
            <Box sx={{ textAlign: 'center', p: 5 }}>
                <Typography color="error">Failed to load data or not found.</Typography>
                <Button onClick={onBack} sx={{ mt: 2 }}>Go Back</Button>
            </Box>
        );
    }

    const { facultyId } = data;
    
    const getStatusColor = (status) => {
        if (/Pending/i.test(status)) return { bg: "rgba(255, 193, 7, 0.1)", color: "#ff9800", dot: "#ff9800" };
        if (/Approved/i.test(status)) return { bg: "rgba(76, 175, 80, 0.1)", color: "#4caf50", dot: "#4caf50" };
        if (/Rejected/i.test(status)) return { bg: "rgba(244, 67, 54, 0.1)", color: "#f44336", dot: "#f44336" };
        return { bg: "#f5f5f5", color: "#666", dot: "#666" };
    };
    const statusStyle = getStatusColor(data.status);

    const renderFilePreview = (title, filepath, index) => {
        if (!filepath) return null;
        
        const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
        const fileUrl = filepath.startsWith('http') ? filepath : `${backendURL}${filepath}`;
        const isImage = /\.(jpg|jpeg|png|gif)$/i.test(filepath);
        
        return (
            <Grid item xs={12} sm={4}>
                <Box sx={{ mb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "var(--color-primary)", fontSize: "0.8rem", textTransform: "uppercase" }}>
                        {index}. {title}
                    </Typography>
                    <IconButton 
                        size="small" 
                        href={fileUrl} 
                        download 
                        target="_blank"
                        sx={{ color: "var(--color-primary)", bgcolor: "rgba(0,0,0,0.04)", "&:hover": { bgcolor: "rgba(0,0,0,0.08)" } }}
                    >
                        <DownloadIcon fontSize="small" />
                    </IconButton>
                </Box>
                
                <Box sx={{ 
                    height: 220, 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    border: "1px solid #e0e0e0",
                    borderRadius: "8px",
                    overflow: "hidden",
                    cursor: "pointer",
                    "&:hover": { borderColor: "var(--color-primary)" }
                }} onClick={() => window.open(fileUrl, '_blank')}>
                    {isImage ? (
                        <img src={fileUrl} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                        <Box sx={{ textAlign: "center" }}>
                            <DescriptionIcon sx={{ fontSize: 40, color: "#999", mb: 1 }} />
                            <Typography variant="body2" color="textSecondary">PDF Document</Typography>
                        </Box>
                    )}
                </Box>
            </Grid>
        );
    };

    const SectionHeader = ({ icon, title }) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
            <Box sx={{ color: "var(--color-primary)", display: "flex" }}>{icon}</Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.1rem" }}>{title}</Typography>
        </Box>
    );

    const LabelValue = ({ label, value }) => (
        <Box>
            <Typography variant="caption" sx={{ color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600, display: "block", mb: 0.5 }}>
                {label}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: "#333", fontSize: "0.95rem" }}>
                {value || "-"}
            </Typography>
        </Box>
    );

    const cardStyle = { 
        p: 3, 
        mb: 3, 
        borderRadius: "12px", 
        border: "1px solid #f0f0f0", 
        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
        background: "#fff"
    };

    return (
        <Box sx={{ maxWidth: 1000, mx: "auto", pb: 5 }}>
            <Button 
                startIcon={<ArrowBackIcon />} 
                onClick={onBack} 
                sx={{ mb: 3, color: "var(--color-primary)", fontWeight: 600, textTransform: "none" }}
            >
                Back to Request List
            </Button>

            {/* Title Card */}
            <Card sx={cardStyle}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 4 }}>
                    <Box sx={{ display: "flex", gap: 2 }}>
                        <Box sx={{ 
                            width: 50, height: 50, borderRadius: "50%", 
                            bgcolor: "rgba(25, 118, 210, 0.1)", color: "var(--color-primary)",
                            display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                            <MenuBookIcon />
                        </Box>
                        <Box>
                             <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: "#1a1a1a" }}>{data.title}</Typography>
                        </Box>
                    </Box>
                    <Box sx={{ textAlign: "right" }}>
                        <Chip 
                            label="Text Book Publication" 
                            sx={{ 
                                bgcolor: "rgba(25, 118, 210, 0.1)", 
                                color: "var(--color-primary)", 
                                fontWeight: 700, 
                                borderRadius: "6px",
                                textTransform: "uppercase",
                                fontSize: "0.7rem",
                                letterSpacing: "1px",
                                "& .MuiChip-label": { px: 2 }
                            }} 
                        />
                        <Typography variant="caption" sx={{ display: "block", mt: 1, color: "#888" }}>
                            Submitted on {new Date(data.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </Typography>
                    </Box>
                </Box>

                <Grid container spacing={3}>
                    <Grid item xs={6} sm={3}><LabelValue label="Academic Year" value={data.academicYear?.year || "-"} /></Grid>
                    <Grid item xs={6} sm={3}><LabelValue label="Reference ID" value={`TBK-${new Date(data.createdAt).getFullYear()}-${data._id.substring(data._id.length-6).toUpperCase()}`} /></Grid>
                    <Grid item xs={6} sm={3}><LabelValue label="Submission Date" value={new Date(data.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} /></Grid>
                    <Grid item xs={6} sm={3}>
                        <Box>
                            <Typography variant="caption" sx={{ color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600, display: "block", mb: 0.5 }}>
                                Status
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: statusStyle.dot }} />
                                <Typography variant="body2" sx={{ fontWeight: 600, color: "#333", fontSize: "0.95rem" }}>
                                    {data.status}
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            </Card>

            {/* Applicant Information */}
            <Card sx={cardStyle}>
                <SectionHeader icon={<PersonIcon />} title="Applicant Information" />
                <Grid container spacing={3} alignItems="flex-start">
                    <Grid item xs={12} sm="auto">
                        <Box sx={{ 
                            width: 100, height: 100, borderRadius: "50%", 
                            background: "#eee", overflow: "hidden"
                        }}>
                            {facultyId?.profileImage ? (
                                <img 
                                    src={facultyId.profileImage.startsWith('http') ? facultyId.profileImage : `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}${facultyId.profileImage}`} 
                                    alt="Faculty" 
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                                />
                            ) : (
                                <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa", fontWeight: 700, fontSize: 32 }}>
                                    {facultyId?.name?.charAt(0) || "F"}
                                </Box>
                            )}
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={4}><LabelValue label="Name of the Applicant" value={facultyId?.name} /></Grid>
                            <Grid item xs={12} sm={4}><LabelValue label="Designation" value={facultyId?.designation} /></Grid>
                            <Grid item xs={12} sm={4}><LabelValue label="Core Department" value={facultyId?.coreDepartment?.name} /></Grid>
                            <Grid item xs={12} sm={4}><LabelValue label="Employee ID" value={facultyId?.institutionId} /></Grid>
                            <Grid item xs={12} sm={4}><LabelValue label="Contact Number" value={facultyId?.phone || facultyId?.contactNumber} /></Grid>
                            <Grid item xs={12} sm={4}><LabelValue label="College" value={facultyId?.college || "Aditya University"} /></Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </Card>

            {/* Publication Details */}
            <Card sx={{ ...cardStyle, p: 0, overflow: "hidden" }}>
                <Box sx={{ p: 3, pb: 2 }}>
                    <SectionHeader icon={<MenuBookIcon />} title="Publication Details" />
                </Box>
                <TableContainer>
                    <Table size="small">
                        <TableBody>
                            {[
                                { label: "Publisher", value: data.publisher },
                                { label: "ISBN", value: data.isbn },
                                { label: "Edition", value: data.edition },
                                { label: "Year of Publication", value: data.year },
                                { label: "Total Authors", value: data.totalAuthors },
                                { label: "Applicant Author Position", value: data.userAuthorPosition },
                                { label: "Cost of the Book (₹)", value: data.cost },
                            ].map((row, i) => (
                                <TableRow key={i}>
                                    <TableCell sx={{ width: "40%", bgcolor: "#fcfcfc", color: "#888", fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", borderRight: "1px solid #f0f0f0" }}>
                                        {row.label}
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: "#333", py: 1.5 }}>
                                        {row.value || "-"}
                                    </TableCell>
                                </TableRow>
                            ))}
                            <TableRow>
                                <TableCell sx={{ bgcolor: "#fcfcfc", color: "#888", fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", borderRight: "1px solid #f0f0f0" }}>
                                    Apply for Incentive
                                </TableCell>
                                <TableCell sx={{ py: 1.5 }}>
                                    <Chip 
                                        label={data.applyIncentive} 
                                        size="small" 
                                        sx={{ 
                                            bgcolor: data.applyIncentive === 'Yes' ? "rgba(76, 175, 80, 0.1)" : "#f5f5f5", 
                                            color: data.applyIncentive === 'Yes' ? "#4caf50" : "#666", 
                                            fontWeight: 600, 
                                            height: 24 
                                        }} 
                                    />
                                </TableCell>
                            </TableRow>
                            {data.applyIncentive === 'Yes' && (
                                <TableRow>
                                    <TableCell sx={{ bgcolor: "#fcfcfc", color: "#888", fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", borderRight: "1px solid #f0f0f0" }}>
                                        Expected Amount (₹)
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: "var(--color-primary)", py: 1.5 }}>
                                        {data.expectedAmount}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* Authors & Affiliations */}
            <Card sx={{ ...cardStyle, p: 0, overflow: "hidden" }}>
                <Box sx={{ p: 3, pb: 2 }}>
                    <SectionHeader icon={<GroupsIcon />} title="Authors & Affiliations" />
                </Box>
                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: "#f9f9f9" }}>
                            <TableRow>
                                <TableCell sx={{ color: "#888", fontWeight: 600, fontSize: "0.8rem" }}>AUTHOR POSITION</TableCell>
                                <TableCell sx={{ color: "#888", fontWeight: 600, fontSize: "0.8rem" }}>AUTHOR NAME</TableCell>
                                <TableCell sx={{ color: "#888", fontWeight: 600, fontSize: "0.8rem" }}>AFFILIATION</TableCell>
                                <TableCell sx={{ color: "#888", fontWeight: 600, fontSize: "0.8rem" }}>EMPLOYEE ID</TableCell>
                                <TableCell sx={{ color: "#888", fontWeight: 600, fontSize: "0.8rem" }}>ROLE</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.authors?.map((author, idx) => (
                                <TableRow key={idx}>
                                    <TableCell>
                                        <Box sx={{ 
                                            width: 24, height: 24, borderRadius: "50%", 
                                            bgcolor: "var(--color-primary)", color: "#fff", 
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: "0.8rem", fontWeight: 700
                                        }}>
                                            {author.authorPosition}
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: "#333" }}>{author.authorName}</TableCell>
                                    <TableCell sx={{ color: "#555" }}>{author.affiliationName}</TableCell>
                                    <TableCell sx={{ color: "#555" }}>{author.employeeId || "-"}</TableCell>
                                    <TableCell>
                                        {author.isIncentiveApplicant ? (
                                            <Chip label="Incentive Applicant" size="small" sx={{ bgcolor: "rgba(76, 175, 80, 0.1)", color: "#4caf50", fontWeight: 600, height: 24, border: "1px solid rgba(76, 175, 80, 0.2)" }} />
                                        ) : (
                                            <Chip label="Contributor Only" size="small" sx={{ bgcolor: "rgba(25, 118, 210, 0.05)", color: "var(--color-primary)", fontWeight: 600, height: 24, border: "1px solid rgba(25, 118, 210, 0.2)" }} />
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!data.authors || data.authors.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 3, color: "#888" }}>No authors found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* Attached Documents */}
            <Card sx={cardStyle}>
                <SectionHeader icon={<AttachFileIcon />} title="Attached Documents" />
                <Grid container spacing={3}>
                    {renderFilePreview("Cover Page", data.coverPage, 1)}
                    {renderFilePreview("Author Affiliation", data.authorAffiliation, 2)}
                    {renderFilePreview("Index", data.index, 3)}
                </Grid>
            </Card>

            {/* Actions Section */}
            {data.status === 'Pending at HOD' && (
                <Card sx={{ ...cardStyle, borderTop: "4px solid var(--color-primary)", mt: 5, p: 4 }}>
                    <SectionHeader icon={<GavelIcon />} title="Review Decision" />
                    
                    <Typography variant="body2" sx={{ color: "#666", mb: 2 }}>
                        Please provide your review remarks below. Remarks are mandatory for <strong>Rejection</strong>.
                    </Typography>

                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        placeholder="Type your review comments here..."
                        variant="outlined"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        sx={{ 
                            mb: 4,
                            "& .MuiOutlinedInput-root": {
                                borderRadius: "12px",
                                bgcolor: "#fcfcfc",
                                "&:hover .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "var(--color-primary)",
                                }
                            }
                        }}
                    />

                    <Box sx={{ display: "flex", gap: 3, justifyContent: "flex-end" }}>
                        <Button 
                            variant="outlined" 
                            disabled={actionLoading}
                            onClick={() => handleAction('Reject')}
                            startIcon={<CloseIcon />}
                            sx={{ 
                                color: "#ef4444", 
                                borderColor: "#ef4444",
                                fontWeight: 700, 
                                px: 4, 
                                py: 1.5,
                                borderRadius: "10px",
                                textTransform: "none",
                                fontSize: "0.95rem",
                                "&:hover": { bgcolor: "rgba(239, 68, 68, 0.05)", borderColor: "#dc2626" }
                            }}
                        >
                            Reject Application
                        </Button>
                        <Button 
                            variant="contained" 
                            disabled={actionLoading}
                            onClick={() => handleAction('Approve')}
                            startIcon={<CheckIcon />}
                            sx={{ 
                                bgcolor: "#10b981", 
                                color: "#fff", 
                                fontWeight: 700, 
                                px: 5, 
                                py: 1.5,
                                borderRadius: "10px",
                                textTransform: "none",
                                fontSize: "0.95rem",
                                boxShadow: "0 8px 16px rgba(16, 185, 129, 0.2)",
                                "&:hover": { bgcolor: "#059669", boxShadow: "0 10px 20px rgba(16, 185, 129, 0.3)" }
                            }}
                        >
                            Approve & Forward
                        </Button>
                    </Box>
                </Card>
            )}
        </Box>
    );
};

export default TextBookDetailPage;
