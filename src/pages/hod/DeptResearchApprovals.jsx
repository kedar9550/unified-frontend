import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import SectionHeader from "../../components/common/SectionHeader";
import DataTable from "../../components/data/DataTable";
import ResearchDetailedView from "../../components/common/ResearchDetailedView";
import {
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    IconButton,
    Chip,
    Tooltip,
    Stack,
    Grid,
    Card,
    Typography
} from "@mui/material";
import {
    Visibility as ViewIcon,
    FilterAlt as FilterIcon
} from "@mui/icons-material";

const DeptResearchApprovals = () => {
    const navigate = useNavigate();
    const [view, setView] = useState("table");
    const [dept, setDept] = useState("All Departments");
    const [academicYear, setAcademicYear] = useState("2025-2026");
    const [statusFilter, setStatusFilter] = useState("Pending");

    const columns = [
        "#",
        "Faculty Name",
        "Department",
        "Title of Work",
        "Type",
        "Submitted Date",
        "Status",
        "Actions"
    ];

    const data = [
        {
            id: 1,
            faculty: "Dr. R. Kameswari",
            dept: "CSE",
            title: "AI-Based Data Analysis...",
            type: "Journal",
            date: "12 May 2025",
            status: "Pending"
        },
        {
            id: 2,
            faculty: "Mr. P. Suresh",
            dept: "IT",
            title: "Secure Cloud Storage...",
            type: "Conference",
            date: "10 May 2025",
            status: "Pending"
        },
        {
            id: 3,
            faculty: "Mrs. L. Anitha",
            dept: "CSE",
            title: "Deep Learning Approaches...",
            type: "Journal",
            date: "09 May 2025",
            status: "Pending"
        },
        {
            id: 4,
            faculty: "Dr. M. Srikanth",
            dept: "AIML",
            title: "Machine Learning in Healthcare...",
            type: "Book Chapter",
            date: "08 May 2025",
            status: "Pending"
        }
    ];

    const rows = data.map((item, index) => [
        index + 1,
        item.faculty,
        item.dept,
        item.title,
        item.type,
        item.date,
        {
            value: item.status,
            display: (
                <Chip
                    label={item.status}
                    size="small"
                    sx={{
                        bgcolor: "rgba(255, 193, 7, 0.1)",
                        color: "#ffc107",
                        fontWeight: 600,
                        border: "1px solid rgba(255, 193, 7, 0.2)",
                        borderRadius: "6px"
                    }}
                />
            )
        },
        {
            value: "actions",
            display: (
                <Stack direction="row" spacing={1}>
                    <Tooltip title="View Details">
                        <IconButton
                            size="small"
                            sx={{ color: "var(--color-primary)" }}
                            onClick={() => setView("detail")}
                        >
                            <ViewIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Stack>
            )
        }
    ]);

    const toolbarLeft = (
        <Stack direction="row" spacing={2} sx={{ mb: 1, flexWrap: "wrap", gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel sx={{ color: "var(--text-secondary)" }}>Department</InputLabel>
                <Select
                    value={dept}
                    label="Department"
                    onChange={(e) => setDept(e.target.value)}
                    sx={{
                        borderRadius: "12px",
                        background: "var(--bg-glass)",
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "var(--border-color)" }
                    }}
                >
                    <MenuItem value="All Departments">All Departments</MenuItem>
                    <MenuItem value="CSE">CSE</MenuItem>
                    <MenuItem value="IT">IT</MenuItem>
                    <MenuItem value="AIML">AIML</MenuItem>
                </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel sx={{ color: "var(--text-secondary)" }}>Academic Year</InputLabel>
                <Select
                    value={academicYear}
                    label="Academic Year"
                    onChange={(e) => setAcademicYear(e.target.value)}
                    sx={{
                        borderRadius: "12px",
                        background: "var(--bg-glass)",
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "var(--border-color)" }
                    }}
                >
                    <MenuItem value="2025-2026">2025-2026</MenuItem>
                    <MenuItem value="2024-2025">2024-2025</MenuItem>
                </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel sx={{ color: "var(--text-secondary)" }}>Status</InputLabel>
                <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                    sx={{
                        borderRadius: "12px",
                        background: "var(--bg-glass)",
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "var(--border-color)" }
                    }}
                >
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="Approved">Approved</MenuItem>
                    <MenuItem value="Rejected">Rejected</MenuItem>
                </Select>
            </FormControl>

            <Button
                variant="contained"
                startIcon={<FilterIcon />}
                sx={{
                    borderRadius: "12px",
                    textTransform: "none",
                    px: 3,
                    background: "var(--gradient-primary)",
                    boxShadow: "var(--shadow-premium)"
                }}
            >
                Filter
            </Button>
        </Stack>
    );

    if (view === "detail") {
        return <ResearchDetailedView onBack={() => setView("table")} />;
    }

    return (
        <Box sx={{ width: "100%", p: { xs: 1.5, sm: 2, md: 3 }, mb: 3 }}>
            <Stack spacing={3} sx={{ width: "100%" }}>
                <PageHeader
                    title="Department Research Approvals"
                    subtitle="Approve, reject, and track department research submissions"
                />

                <Box sx={{ width: "100%" }}>
                    <SectionHeader title="Research Requests" />
                    <DataTable
                        columns={columns}
                        rows={rows}
                        toolbarLeft={toolbarLeft}
                    />
                </Box>

                {/* Sidebar Area - Moved below and made full width for better alignment */}
                <Card
                    sx={{
                        borderRadius: "24px",
                        p: 3,
                        background: "var(--gradient-primary)",
                        color: "#fff",
                        boxShadow: "var(--shadow-premium)",
                    }}
                >
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, fontSize: "1.25rem" }}>
                        Quick Actions
                    </Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={() => navigate("/hod/discrepancies")}
                            sx={{
                                bgcolor: "rgba(255,255,255,0.12)",
                                backdropFilter: "blur(12px)",
                                textTransform: "none",
                                py: 1,
                                borderRadius: "16px",
                                fontWeight: 600,
                                border: "1px solid rgba(255,255,255,0.1)",
                                "&:hover": {
                                    bgcolor: "rgba(255,255,255,0.2)",
                                    transform: "translateY(-2px)"
                                },
                                transition: "all 0.3s ease"
                            }}
                        >
                            Resolve Discrepancies
                        </Button>
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={() => navigate("/hod/protecrdataupload")}
                            sx={{
                                bgcolor: "rgba(255,255,255,0.12)",
                                backdropFilter: "blur(12px)",
                                textTransform: "none",
                                py: 1,
                                borderRadius: "16px",
                                fontWeight: 600,
                                border: "1px solid rgba(255,255,255,0.1)",
                                "&:hover": {
                                    bgcolor: "rgba(255,255,255,0.2)",
                                    transform: "translateY(-2px)"
                                },
                                transition: "all 0.3s ease"
                            }}
                        >
                            Upload Proctor Data
                        </Button>
                    </Stack>
                </Card>
            </Stack>
        </Box>
    );
};

export default DeptResearchApprovals;