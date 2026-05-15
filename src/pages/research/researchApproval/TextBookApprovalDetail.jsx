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
import { toast } from "sonner";
import API from "../../../api/axios";

const TextBookApprovalDetail = ({ id, onBack, role }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [remarks, setRemarks] = useState("");
    const [approvedAmount, setApprovedAmount] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const isHOD = !role || role === 'HOD';
    const isDean = role === 'RESEARCH_DEAN';
    const isCoordinator = role === 'RESEARCH_COORDINATOR';
    const isResearchAdmin = isDean || isCoordinator;

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await API.get(`/api/research/textbook/${id}`);
                if (res.data?.success) {
                    setData(res.data.data);
                    // Pre-fill remarks if already approved by current stage? Usually not.
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
            toast.error('Remarks are required for rejection.');
            return;
        }

        // Incentive validation for Dean
        if (action === 'Approve' && isResearchAdmin && data.applyIncentive === 'Yes') {
            if (!approvedAmount) {
                toast.error('Please enter the approved incentive amount.');
                return;
            }
            const expected = parseFloat(data.expectedAmount?.replace(/,/g, '') || 0);
            const approved = parseFloat(approvedAmount);
            if (approved > expected) {
                toast.error(`Approved amount (₹${approved}) cannot exceed expected amount (₹${expected}).`);
                return;
            }
        }

        setActionLoading(true);
        try {
            const endpoint = isResearchAdmin ? `/api/research/textbook/rnd-action/${id}` : `/api/research/textbook/hod-action/${id}`;
            const res = await API.put(endpoint, {
                action,
                comment: remarks,
                approvedAmount: isResearchAdmin && data.applyIncentive === 'Yes' ? approvedAmount : undefined
            });
            if (res.data?.success) {
                onBack(); // Go back to list on success
            }
        } catch (error) {
            console.error("Action failed", error);
            toast.error("Action failed. Please try again.");
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

        const backendURL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "");
        let normalizedPath = filepath.replace(/\\/g, '/');
        
        // Handle legacy data or missing prefixes
        if (!normalizedPath.startsWith('http') && !normalizedPath.includes('uploads/')) {
            // Prepend textbooks path if it's a relative filename
            normalizedPath = `/uploads/textbooks/${normalizedPath.startsWith('/') ? normalizedPath.substring(1) : normalizedPath}`;
        }
        
        const cleanPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
        const fileUrl = normalizedPath.startsWith('http') ? normalizedPath : `${backendURL}${cleanPath}`;
        const isImage = /\.(jpg|jpeg|png|gif)$/i.test(normalizedPath);

        return (
            <Grid size={{ xs: 12, sm: 4 }}>
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
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-panel)",
                    borderRadius: "12px",
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    "&:hover": { borderColor: "var(--color-primary)", transform: "translateY(-4px)", boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }
                }} onClick={() => window.open(fileUrl, '_blank')}>
                    {isImage ? (
                        <img 
                            src={fileUrl} 
                            alt={title} 
                            style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                            onError={(e) => {
                                console.error(`Failed to load image: ${fileUrl}`);
                                e.target.src = "https://via.placeholder.com/400x300?text=Image+Not+Found";
                            }}
                        />
                    ) : (
                        <Box sx={{ textAlign: "center" }}>
                            <DescriptionIcon sx={{ fontSize: 40, color: "var(--text-secondary)", mb: 1 }} />
                            <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 600 }}>PDF Document</Typography>
                        </Box>
                    )}
                </Box>
            </Grid>
        );
    };

    const SectionHeader = ({ icon, title }) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
            <Box sx={{ color: "var(--color-primary)", display: "flex" }}>{icon}</Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text-primary)" }}>{title}</Typography>
        </Box>
    );

    const LabelValue = ({ label, value, chip, horizontal = false }) => (
        <Box sx={{
            p: horizontal ? "12px 16px" : 2,
            borderRadius: "14px",
            background: horizontal ? "transparent" : "rgba(255,255,255,0.02)",
            height: "100%",
            display: "flex",
            flexDirection: horizontal ? "row" : "column",
            alignItems: horizontal ? "center" : "flex-start",
            justifyContent: horizontal ? "flex-start" : "center",
            gap: horizontal ? 2 : 0.5,
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            borderBottom: horizontal ? "1px solid var(--border-color)" : "1px solid transparent",
            "&:last-child": { borderBottom: "none" },
            "&:hover": {
                borderColor: "var(--color-primary)",
                bgcolor: "rgba(190, 147, 55, 0.05)",
                transform: "translateY(-2px)",
                boxShadow: "0 8px 20px rgba(0,0,0,0.1)"
            },
            "body.dark-mode &:hover": {
                bgcolor: "rgba(190, 147, 55, 0.08)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.2)"
            }
        }}>
            <Typography variant="caption" sx={{
                flex: horizontal ? { xs: "0 0 130px", sm: "0 0 170px" } : "none",
                color: "var(--color-primary)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 800,
                fontSize: "0.7rem",
                display: "inline-block",
                mb: horizontal ? 0 : 0.5,
                opacity: 0.9
            }}>
                {label}
            </Typography>
            <Box sx={{ flex: horizontal ? 1 : "none" }}>
                {chip ? chip : (
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.92rem", wordBreak: "break-word" }}>
                        {value || "-"}
                    </Typography>
                )}
            </Box>
        </Box>
    );

    const cardStyle = {
        p: 3,
        mb: 3,
        borderRadius: "16px",
        border: "1px solid var(--border-color)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
        background: "var(--bg-glass)",
        backdropFilter: "blur(10px)"
    };

    return (
        <Box sx={{
            width: "100%", px: {
                xs: 1.5, sm: 2, md: 3
            }, pb: 5
        }}>
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={onBack}
                sx={{ mb: 3, color: "var(--color-primary)", fontWeight: 600, textTransform: "none" }}
            >
                Back to Request List
            </Button>

            {/* Title Card */}
            <Card sx={cardStyle}>
                <Box sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    justifyContent: "space-between",
                    alignItems: { xs: "center", sm: "flex-start" },
                    gap: { xs: 2, sm: 0 },
                    mb: 4
                }}>
                    <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { xs: "center", sm: "flex-start" }, gap: 2 }}>
                        <Box sx={{
                            width: 50, height: 50, borderRadius: "50%",
                            bgcolor: "rgba(25, 118, 210, 0.1)", color: "var(--color-primary)",
                            display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                            <MenuBookIcon />
                        </Box>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: "var(--text-primary)" }}>{data.title}</Typography>
                        </Box>
                    </Box>
                    <Box sx={{ textAlign: { xs: "center", sm: "right" } }}>
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
                        <Typography variant="caption" sx={{ display: "block", mt: 1, color: "var(--text-secondary)", fontWeight: 600 }}>
                            Submitted on {new Date(data.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                    <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 23%" } }}><LabelValue label="Academic Year" value={data.academicYear?.year || "-"} /></Box>
                    <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 23%" } }}><LabelValue label="Reference ID" value={`TBK-${new Date(data.createdAt).getFullYear()}-${data._id.substring(data._id.length - 6).toUpperCase()}`} /></Box>
                    <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 23%" } }}><LabelValue label="Submission Date" value={new Date(data.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} /></Box>
                    <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 23%" } }}>
                        <Box sx={{ p: 2, borderRadius: "12px", background: "transparent", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", transition: "all 0.3s ease", "&:hover": { transform: "translateY(-2px)" } }}>
                            <Typography variant="caption" sx={{
                                background: "var(--gradient-primary)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                color: "transparent",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                                fontWeight: 600,
                                display: "inline-block",
                                mb: 0.5
                            }}>
                                Status
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: statusStyle.dot, boxShadow: `0 0 8px ${statusStyle.dot}` }} />
                                <Typography variant="body2" sx={{ fontWeight: 400, color: "var(--text-primary)", fontSize: "0.95rem" }}>
                                    {data.status}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Card>            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mb: 3 }}>
                {/* Applicant Information as Table Format */}
                <Card sx={{ ...cardStyle, flex: { xs: "1 1 100%", lg: "1 1 48%" }, mb: 0 }}>
                    <SectionHeader icon={<PersonIcon />} title="Applicant Information" />
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "center" }}>
                        <Box sx={{ flexShrink: 0 }}>
                            <Box sx={{
                                width: 100, height: 100, borderRadius: "50%",
                                background: "var(--bg-panel)", overflow: "hidden", 
                                border: "1px solid var(--border-color)",
                                boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                                display: "flex", alignItems: "center", justifyContent: "center"
                            }}>
                                {facultyId?.profileImage ? (
                                    <img
                                        src={(() => {
                                            const backendURL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "");
                                            let p = facultyId.profileImage.replace(/\\/g, '/');
                                            if (!p.startsWith('http') && !p.includes('uploads/')) {
                                                p = `/uploads/profile/${p.startsWith('/') ? p.substring(1) : p}`;
                                            }
                                            return p.startsWith('http') ? p : `${backendURL}${p.startsWith('/') ? p : `/${p}`}`;
                                        })()}
                                        alt="Faculty"
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                        onError={(e) => { e.target.src = "https://via.placeholder.com/150?text=Profile"; }}
                                    />
                                ) : (
                                    <Typography sx={{ color: "var(--text-secondary)", fontWeight: 700, fontSize: 32 }}>
                                        {facultyId?.name?.charAt(0) || "F"}
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                        <Box sx={{ flexGrow: 1, width: "100%" }}>
                            <Box sx={{ display: "flex", flexDirection: "column" }}>
                                <LabelValue 
                                    label="Name" 
                                    value={facultyId?.name ? facultyId.name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : "-"} 
                                    horizontal 
                                />
                                <LabelValue label="Designation" value={facultyId?.designation} horizontal />
                                <LabelValue label="Department" value={facultyId?.coreDepartment?.name} horizontal />
                                <LabelValue label="Emp ID" value={facultyId?.institutionId} horizontal />
                                <LabelValue label="Contact" value={facultyId?.phone || facultyId?.contactNumber} horizontal />
                                <LabelValue label="College" value={facultyId?.college || "Aditya University"} horizontal />
                            </Box>
                        </Box>
                    </Box>
                </Card>
    
                {/* Publication Details as Table Format */}
                <Card sx={{ ...cardStyle, flex: { xs: "1 1 100%", lg: "1 1 48%" }, mb: 0 }}>
                    <SectionHeader icon={<MenuBookIcon />} title="Publication Details" />
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                        <LabelValue label="Publisher" value={data.publisher} horizontal />
                        <LabelValue label="ISBN" value={data.isbn} horizontal />
                        <LabelValue label="Edition" value={data.edition} horizontal />
                        <LabelValue label="Year" value={data.year} horizontal />
                        <LabelValue label="Total Authors" value={data.totalAuthors} horizontal />
                        <LabelValue label="Author Position" value={data.userAuthorPosition} horizontal />
                        <LabelValue label="Cost (₹)" value={data.cost} horizontal />
                        <LabelValue 
                            label="Incentive" 
                            horizontal 
                            chip={
                                <Chip
                                    label={data.applyIncentive}
                                    size="small"
                                    sx={{
                                        bgcolor: data.applyIncentive === 'Yes' ? "rgba(76, 175, 80, 0.1)" : "var(--bg-panel)",
                                        color: data.applyIncentive === 'Yes' ? "#4caf50" : "var(--text-secondary)",
                                        fontWeight: 700,
                                        border: "1px solid",
                                        borderColor: data.applyIncentive === 'Yes' ? "rgba(76, 175, 80, 0.3)" : "var(--border-color)"
                                    }}
                                />
                            }
                        />
                        {data.applyIncentive === 'Yes' && (
                            <LabelValue 
                                label="Expected Amount" 
                                value={`₹${data.expectedAmount}`} 
                                horizontal 
                            />
                        )}
                    </Box>
                </Card>
            </Box>

            {/* Authors & Affiliations */}
            <Card sx={{ ...cardStyle, p: 0, overflow: "hidden" }}>
                <Box sx={{ p: 3, pb: 2 }}>
                    <SectionHeader icon={<GroupsIcon />} title="Authors & Affiliations" />
                </Box>
                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: "var(--bg-panel)" }}>
                            <TableRow>
                                <TableCell sx={{ color: "var(--text-secondary)", fontWeight: 700, fontSize: "0.75rem", borderBottom: "1px solid var(--border-color)" }}>AUTHOR POSITION</TableCell>
                                <TableCell sx={{ color: "var(--text-secondary)", fontWeight: 700, fontSize: "0.75rem", borderBottom: "1px solid var(--border-color)" }}>AUTHOR NAME</TableCell>
                                <TableCell sx={{ color: "var(--text-secondary)", fontWeight: 700, fontSize: "0.75rem", borderBottom: "1px solid var(--border-color)" }}>AFFILIATION</TableCell>
                                <TableCell sx={{ color: "var(--text-secondary)", fontWeight: 700, fontSize: "0.75rem", borderBottom: "1px solid var(--border-color)" }}>EMPLOYEE ID</TableCell>
                                <TableCell sx={{ color: "var(--text-secondary)", fontWeight: 700, fontSize: "0.75rem", borderBottom: "1px solid var(--border-color)" }}>ROLE</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.authors?.map((author, idx) => (
                                <TableRow key={idx} sx={{ "&:last-child td": { borderBottom: 0 } }}>
                                    <TableCell sx={{ borderBottom: "1px solid var(--border-color)" }}>
                                        <Box sx={{
                                            width: 28, height: 28, borderRadius: "50%",
                                            bgcolor: "var(--color-primary)", color: "#fff",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: "0.85rem", fontWeight: 800,
                                            boxShadow: "0 4px 10px rgba(0, 78, 146, 0.3)"
                                        }}>
                                            {author.authorPosition}
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "var(--text-primary)", borderBottom: "1px solid var(--border-color)" }}>{author.authorName}</TableCell>
                                    <TableCell sx={{ color: "var(--text-secondary)", fontWeight: 600, borderBottom: "1px solid var(--border-color)" }}>{author.affiliationName}</TableCell>
                                    <TableCell sx={{ color: "var(--text-secondary)", fontWeight: 600, borderBottom: "1px solid var(--border-color)" }}>{author.employeeId || "-"}</TableCell>
                                    <TableCell sx={{ borderBottom: "1px solid var(--border-color)" }}>
                                        {author.isIncentiveApplicant ? (
                                            <Chip label="Incentive Applicant" size="small" sx={{ bgcolor: "rgba(76, 175, 80, 0.1)", color: "#4caf50", fontWeight: 700, border: "1px solid rgba(76, 175, 80, 0.2)" }} />
                                        ) : (
                                            <Chip label="Contributor Only" size="small" sx={{ bgcolor: "rgba(25, 118, 210, 0.05)", color: "var(--color-primary)", fontWeight: 700, border: "1px solid rgba(25, 118, 210, 0.2)" }} />
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!data.authors || data.authors.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: "var(--text-secondary)", borderBottom: "1px solid var(--border-color)" }}>No authors found.</TableCell>
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

            {/* Decision & Remarks Section */}
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mt: 3, alignItems: "stretch" }}>
                {data.hodComment && (
                    <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 0" } }}>
                        <Card sx={{ ...cardStyle, borderLeft: "4px solid #ffc107", height: "100%", mb: 0 }}>
                            <SectionHeader icon={<HistoryIcon sx={{ color: "#ffc107" }} />} title="HOD Review Remarks" />
                            <Box sx={{ p: 2, bgcolor: "rgba(255, 193, 7, 0.05)", borderRadius: "8px", border: "1px solid rgba(255, 193, 7, 0.2)" }}>
                                <Typography variant="body2" sx={{ fontStyle: "italic", color: "var(--text-secondary)", fontWeight: 600 }}>
                                    "{data.hodComment}"
                                </Typography>
                            </Box>
                        </Card>
                    </Box>
                )}

                {/* Actions Section */}
                <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 0" } }}>
                    {((isHOD && data.status === 'Pending at HOD') || (isResearchAdmin && data.status === 'Pending at R&D')) ? (
                        <Card sx={{ ...cardStyle, borderTop: "4px solid var(--color-primary)", p: 4, mb: 0, height: "100%" }}>
                            <SectionHeader icon={<GavelIcon />} title="Review Decision" />

                            <Typography variant="body2" sx={{ color: "var(--text-secondary)", mb: 2, fontWeight: 600 }}>
                                Please provide your review remarks below. Remarks are mandatory for <strong>Rejection</strong>.
                            </Typography>

                            {isResearchAdmin && data.applyIncentive === 'Yes' && (
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: "var(--color-primary)" }}>
                                        Approved Incentive Amount (₹)
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        type="number"
                                        placeholder={`Expected: ₹${data.expectedAmount}`}
                                        value={approvedAmount}
                                        onChange={(e) => setApprovedAmount(e.target.value)}
                                        sx={{
                                            maxWidth: 300,
                                            "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: "var(--bg-panel)" },
                                            "& .MuiOutlinedInput-input": { color: "var(--text-primary)", fontWeight: 600 }
                                        }}
                                        helperText={`Applicant's expected amount is ₹${data.expectedAmount}`}
                                    />
                                </Box>
                            )}

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
                                        bgcolor: "var(--bg-panel)",
                                        "& .MuiOutlinedInput-input": { color: "var(--text-primary)" },
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
                                    {isHOD ? "Approve & Forward" : "Final Approve"}
                                </Button>
                            </Box>
                        </Card>
                    ) : (
                        <Card sx={{ ...cardStyle, borderTop: "4px solid var(--text-secondary)", p: 4, textAlign: "center", mb: 0, height: "100%" }}>
                            <Typography variant="h6" color="var(--text-secondary)">
                                This request has already been processed.
                            </Typography>
                            <Typography variant="body2" sx={{ color: "var(--text-secondary)", mt: 1 }}>
                                Current Status: <strong style={{ color: "var(--text-primary)" }}>{data.status}</strong>
                            </Typography>
                            {(data.rndComment || data.hodComment) && (
                                <Box sx={{ mt: 3, p: 2, background: "transparent", border: "none", width: "100%", textAlign: { xs: "center", sm: "left" } }}>
                                    {data.hodComment && (
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="caption" sx={{ fontWeight: 700, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>HOD Remarks:</Typography>
                                            <Typography variant="body2" sx={{ color: "var(--text-primary)", fontWeight: 600, mt: 0.5 }}>"{data.hodComment}"</Typography>
                                        </Box>
                                    )}
                                    {data.rndComment && (
                                        <Box>
                                            <Typography variant="caption" sx={{ fontWeight: 700, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>R&D Remarks:</Typography>
                                            <Typography variant="body2" sx={{ color: "var(--text-primary)", fontWeight: 600, mt: 0.5 }}>"{data.rndComment}"</Typography>
                                            {data.approvedAmount && (
                                                <Typography variant="body2" sx={{ mt: 1.5, fontWeight: 800, color: "#4caf50" }}>
                                                    Approved Amount: ₹{data.approvedAmount}
                                                </Typography>
                                            )}
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </Card>
                    )}
                </Box>
            </Box>
        </Box >
    );
};

export default TextBookApprovalDetail;
