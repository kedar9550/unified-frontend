import React from "react";
import {
    Box,
    Typography,
    Grid,
    Paper,
    Chip,
    Button,
    Stack,
    IconButton,
    Divider,
    Tooltip
} from "@mui/material";
import {
    ArrowBack,
    FileDownload,
    Person,
    Description,
    Article,
    CalendarMonth,
    Info,
    History,
    PictureAsPdf,
    FilePresent
} from "@mui/icons-material";

const DetailItem = ({ label, value, isFile }) => (
    <Box sx={{ mb: 0.5 }}>
        <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", mb: 0.5 }}>
            {label}
        </Typography>
        {isFile ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1, borderRadius: "8px", bgcolor: "rgba(var(--color-primary-rgb), 0.05)", border: "1px dashed var(--border-color)", cursor: "pointer", "&:hover": { bgcolor: "rgba(var(--color-primary-rgb), 0.1)" } }}>
                <FilePresent sx={{ color: "var(--color-primary)", fontSize: "1.2rem" }} />
                <Typography sx={{ color: "var(--color-primary)", fontWeight: 600, fontSize: "0.85rem" }}>{value}</Typography>
            </Box>
        ) : (
            <Typography variant="body1" sx={{ color: "var(--text-primary)", fontWeight: 600 }}>
                {value || "N/A"}
            </Typography>
        )}
    </Box>
);

const SectionHeader = ({ icon: Icon, title }) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
        <Box sx={{ p: 1, borderRadius: "10px", bgcolor: "rgba(var(--color-primary-rgb), 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon sx={{ color: "var(--color-primary)", fontSize: "1.5rem" }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, color: "var(--text-primary)" }}>{title}</Typography>
    </Box>
);

const ResearchDetailedView = ({ onBack }) => {
    const data = {
        title: "Journal of Computer Science and Engineering",
        subtitle: "Research Publication • ID: JRN-2027-000123",
        status: "Submitted",
        submittedOn: "15 May 2025, 10:30 AM",
        academicYear: "2027-2028",
        referenceId: "JRN-2027-000123",
        submissionDate: "15 May 2025",
        faculty: {
            name: "Dr. Tirukoti Sudha Rani",
            designation: "Asst. Prof. & HOD",
            department: "Computer Science & Engineering",
            employeeId: "391",
            contact: "9963742714",
            college: "Aditya Engineering College (A)"
        },
        research: {
            journalTitle: "IEEE Transactions on Pattern Analysis and Machine Intelligence",
            issn: "0162-8828",
            journalType: "International",
            category: "Scopus Indexed",
            indexed: "Scopus, Web of Science",
            publisher: "IEEE",
            impactFactor: "24.314",
            issue: "Vol. 45",
            vol: "No. 3",
            monthYear: "March 2025",
            pageNo: "1234-1250",
            link: "https://ieeexplore.ieee.org/journal/34",
            doi: "10.1109/TPAMI.2025.1234567"
        },
        history: [
            {
                dateTime: "15 May 2025, 10:30 AM",
                action: "Submitted",
                performedBy: "Dr. Tirukoti Sudha Rani",
                remarks: "Journal submitted successfully"
            }
        ]
    };

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: "1200px", margin: "0 auto" }}>
            {/* TOP ACTIONS */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={onBack}
                    sx={{ textTransform: "none", fontWeight: 700, color: "var(--color-primary)" }}
                >
                    Back to Journal
                </Button>
                <Button
                    variant="outlined"
                    startIcon={<FileDownload />}
                    sx={{
                        borderRadius: "10px",
                        textTransform: "none",
                        fontWeight: 700,
                        borderColor: "var(--border-color)",
                        color: "var(--color-primary)"
                    }}
                >
                    Download PDF
                </Button>
            </Box>

            {/* HEADER CARD */}
            <Paper sx={{ p: 3, borderRadius: "24px", mb: 3, border: "1px solid var(--border-color)", boxShadow: "var(--shadow-premium)" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 4 }}>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>{data.title}</Typography>
                        <Typography variant="body2" color="text.secondary">{data.subtitle}</Typography>
                    </Box>
                    <Box sx={{ textAlign: "right" }}>
                        <Chip
                            label={data.status}
                            size="small"
                            sx={{ bgcolor: "#dcfce7", color: "#166534", fontWeight: 700, mb: 0.5 }}
                        />
                        <Typography sx={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                            Submitted on: {data.submittedOn}
                        </Typography>
                    </Box>
                </Box>

                <Box
                    sx={{ 
                        display: "flex", 
                        flexDirection: { xs: "column", sm: "row" },
                        justifyContent: "space-between", 
                        alignItems: "flex-start",
                        width: "100%", 
                        flexWrap: "wrap",
                        gap: 3 
                    }}
                >
                    <DetailItem label="Academic Year" value={data.academicYear} />
                    <DetailItem label="Reference ID" value={data.referenceId} />
                    <DetailItem label="Submission Date" value={data.submissionDate} />
                    <DetailItem label="Status" value={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#4caf50" }} />
                            <Typography sx={{ fontSize: "0.9rem", fontWeight: 500 }}>{data.status}</Typography>
                        </Box>
                    } />
                </Box>
            </Paper>

            {/* SECTIONS */}
            <Stack spacing={3}>
                {/* Faculty Information */}
                <Paper sx={{ p: 3, borderRadius: "24px", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-premium)" }}>
                    <SectionHeader icon={Person} title="Faculty Information" />
                    <Grid container spacing={4}>
                        <Grid xs={12} sm={6} md={4}>
                            <DetailItem label="Name of the Faculty" value={data.faculty.name} />
                        </Grid>
                        <Grid xs={12} sm={6} md={4}>
                            <DetailItem label="Designation" value={data.faculty.designation} />
                        </Grid>
                        <Grid xs={12} sm={6} md={4}>
                            <DetailItem label="Department" value={data.faculty.department} />
                        </Grid>
                        <Grid xs={12} sm={6} md={4}>
                            <DetailItem label="Employee ID" value={data.faculty.employeeId} />
                        </Grid>
                        <Grid xs={12} sm={6} md={4}>
                            <DetailItem label="Contact Number" value={data.faculty.contact} />
                        </Grid>
                        <Grid xs={12} sm={6} md={4}>
                            <DetailItem label="College" value={data.faculty.college} />
                        </Grid>
                    </Grid>
                </Paper>

                {/* Journal & Publication Details */}
                <Paper sx={{ p: 3, borderRadius: "24px", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-premium)" }}>
                    <SectionHeader icon={Article} title="Journal & Publication Details" />
                    <Grid container spacing={4}>
                        <Grid xs={12} sm={6} md={4}>
                            <DetailItem label="Journal Title" value={data.research.journalTitle} />
                        </Grid>
                        <Grid xs={12} sm={6} md={4}>
                            <DetailItem label="ISSN Number" value={data.research.issn} />
                        </Grid>
                        <Grid xs={12} sm={6} md={4}>
                            <DetailItem label="Journal Type" value={data.research.journalType} />
                        </Grid>
                        <Grid xs={12} sm={6} md={4}>
                            <DetailItem label="Category" value={data.research.category} />
                        </Grid>
                        <Grid xs={12} sm={6} md={4}>
                            <DetailItem label="Journal Indexed" value={data.research.indexed} />
                        </Grid>
                        <Grid xs={12} sm={6} md={4}>
                            <DetailItem label="Publisher" value={data.research.publisher} />
                        </Grid>
                        <Grid xs={12} sm={6} md={4}>
                            <DetailItem label="Impact Factor" value={data.research.impactFactor} />
                        </Grid>
                    </Grid>
                </Paper>

                {/* Issue & Page Details */}
                <Paper sx={{ p: 3, borderRadius: "24px", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-premium)" }}>
                    <SectionHeader icon={Description} title="Issue & Page Details" />
                    <Grid container spacing={4}>
                        <Grid xs={12} sm={6} md={4}>
                            <DetailItem label="Issue" value={data.research.issue} />
                        </Grid>
                        <Grid xs={12} sm={6} md={4}>
                            <DetailItem label="Vol" value={data.research.vol} />
                        </Grid>
                        <Grid xs={12} sm={6} md={4}>
                            <DetailItem label="Month & Year" value={data.research.monthYear} />
                        </Grid>
                        <Grid xs={12} sm={6} md={4}>
                            <DetailItem label="Page No" value={data.research.pageNo} />
                        </Grid>
                        <Grid xs={12} sm={6} md={4}>
                            <DetailItem label="DOI" value={data.research.doi} />
                        </Grid>
                        <Grid xs={12} sm={6} md={4}>
                            <DetailItem label="Link" value={
                                <Typography component="a" href={data.research.link} target="_blank" sx={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: 600, "&:hover": { textDecoration: "underline" } }}>
                                    Visit Journal Link
                                </Typography>
                            } />
                        </Grid>
                    </Grid>
                </Paper>

                {/* Action History */}
                <Paper sx={{ p: 3, borderRadius: "24px", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-premium)" }}>
                    <SectionHeader icon={History} title="Action History" />
                    <Box sx={{ overflowX: "auto" }}>
                        <Box sx={{ minWidth: 600 }}>
                            <Grid container sx={{ py: 1.5, borderBottom: "1px solid var(--border-color)" }}>
                                <Grid xs={3}><Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)" }}>Date & Time</Typography></Grid>
                                <Grid xs={2}><Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)" }}>Action</Typography></Grid>
                                <Grid xs={3}><Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)" }}>Performed By</Typography></Grid>
                                <Grid xs={4}><Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)" }}>Remarks</Typography></Grid>
                            </Grid>
                            {data.history.map((h, i) => (
                                <Grid container key={i} sx={{ py: 2 }}>
                                    <Grid xs={3}><Typography sx={{ fontSize: "0.85rem", fontWeight: 500 }}>{h.dateTime}</Typography></Grid>
                                    <Grid xs={2}>
                                        <Chip label={h.action} size="small" sx={{ bgcolor: "#dcfce7", color: "#166534", fontWeight: 700, height: 20, fontSize: "0.7rem" }} />
                                    </Grid>
                                    <Grid xs={3}><Typography sx={{ fontSize: "0.85rem", fontWeight: 500 }}>{h.performedBy}</Typography></Grid>
                                    <Grid xs={4}><Typography sx={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{h.remarks}</Typography></Grid>
                                </Grid>
                            ))}
                        </Box>
                    </Box>
                </Paper>
            </Stack>
        </Box>
    );
};

export default ResearchDetailedView;