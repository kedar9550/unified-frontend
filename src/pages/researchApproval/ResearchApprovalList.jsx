import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import SectionHeader from "../../components/common/SectionHeader";
import DataTable from "../../components/data/DataTable";
import API from "../../api/axios";
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
    TextField,
    CircularProgress,
    Typography,
    Grid,
    InputAdornment,
    OutlinedInput
} from "@mui/material";
import {
    Visibility as ViewIcon,
    Search as SearchIcon,
    CalendarToday as CalendarTodayIcon
} from "@mui/icons-material";

const ResearchApprovalList = ({ role }) => {
    const navigate = useNavigate();

    // Determine context
    const isHOD = !role || role === 'HOD';
    const isDean = role === 'RESEARCH_DEAN';
    const isCoordinator = role === 'RESEARCH_COORDINATOR';
    const isResearchAdmin = isDean || isCoordinator;

    // Filters State
    const [typeFilter, setTypeFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("Pending");
    const [durationFilter, setDurationFilter] = useState("All");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const params = {};
            if (typeFilter !== "All") params.type = typeFilter;

            // Send status filter (including "All")
            if (statusFilter) params.status = statusFilter;

            if (durationFilter !== "All" && durationFilter !== "Custom") params.duration = durationFilter;
            if (durationFilter === "Custom" && fromDate && toDate) {
                params.fromDate = fromDate;
                params.toDate = toDate;
            }
            if (searchQuery) params.search = searchQuery;

            const res = await API.get("/api/hod/research-requests", { params });
            if (res.data?.success) {
                setData(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch research requests", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [typeFilter, statusFilter, durationFilter, fromDate, toDate, role]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchRequests();
    };

    const columns = [
        "#",
        "Faculty Name",
        "Emp ID",
        "Title of Work",
        "Type",
        "Submitted Date",
        "Status",
        "Actions"
    ];

    const getStatusColor = (status) => {
        if (/Pending/i.test(status)) return { bg: "rgba(255, 193, 7, 0.1)", color: "#ffc107", border: "rgba(255, 193, 7, 0.2)" };
        if (/Approved/i.test(status)) return { bg: "rgba(76, 175, 80, 0.1)", color: "#4caf50", border: "rgba(76, 175, 80, 0.2)" };
        if (/Rejected/i.test(status)) return { bg: "rgba(244, 67, 54, 0.1)", color: "#f44336", border: "rgba(244, 67, 54, 0.2)" };
        return { bg: "var(--bg-glass)", color: "var(--text-secondary)", border: "var(--border-color)" };
    };

    const rows = data.map((item, index) => {
        const statusStyle = getStatusColor(item.status);
        const submitDate = new Date(item.createdAt).toLocaleDateString("en-GB", {
            day: "2-digit", month: "short", year: "numeric"
        });

        const detailBase = isHOD ? "/hod/research-request" :
            isDean ? "/research-dean/request" :
                "/research-coordinator/request";

        return [
            index + 1,
            item.faculty?.name || "Unknown",
            item.faculty?.institutionId || "Unknown",
            item.title.length > 30 ? item.title.substring(0, 30) + '...' : item.title,
            item.type,
            submitDate,
            {
                value: item.status,
                display: (
                    <Chip
                        label={item.status}
                        size="small"
                        sx={{
                            bgcolor: statusStyle.bg,
                            color: statusStyle.color,
                            fontWeight: 600,
                            border: `1px solid ${statusStyle.border}`,
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
                                onClick={() => navigate(`${detailBase}/${item.type.toLowerCase().replace(/\s+/g, '')}/${item._id}`)}
                            >
                                <ViewIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                )
            }
        ];
    });

    const toolbarLeft = (
        <Box sx={{ width: "100%", mb: 1 }}>
            <Box sx={{ 
                p: { xs: 2, md: 2.5 }, 
                background: "var(--bg-panel)", 
                borderRadius: "16px", 
                border: "1px solid var(--border-color)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.04)"
            }}>
                <Grid 
                    container 
                    spacing={2} 
                    sx={{ alignItems: "center" }}
                    columns={{ xs: 12, md: durationFilter === 'Custom' ? 10 : 12 }}
                >
                    <Grid size={{ xs: 12, sm: 6, md: durationFilter === 'Custom' ? 2 : 4 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel sx={{ color: "var(--text-secondary)" }}>Research Type</InputLabel>
                            <Select
                                value={typeFilter}
                                label="Research Type"
                                onChange={(e) => setTypeFilter(e.target.value)}
                                sx={{ 
                                    borderRadius: "12px", 
                                    background: "var(--bg-glass)",
                                    color: "var(--text-primary)",
                                    "& .MuiSelect-icon": { fill: "url(#themeGradient)" }
                                }}
                                MenuProps={{ disableAriaHidden: true }}
                            >
                                <MenuItem value="All">All Types</MenuItem>
                                <MenuItem value="Journal">Journal</MenuItem>
                                <MenuItem value="Text Book">Text Book</MenuItem>
                                <MenuItem value="Patent">Patent</MenuItem>
                                <MenuItem value="Conference">Conference</MenuItem>
                                <MenuItem value="Book Chapter">Book Chapter</MenuItem>
                                <MenuItem value="Consultancy">Consultancy</MenuItem>
                                <MenuItem value="Project Grant">Project Grant</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: durationFilter === 'Custom' ? 2 : 4 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel sx={{ color: "var(--text-secondary)" }}>Status</InputLabel>
                            <Select
                                value={statusFilter}
                                label="Status"
                                onChange={(e) => setStatusFilter(e.target.value)}
                                sx={{ 
                                    borderRadius: "12px", 
                                    background: "var(--bg-glass)",
                                    color: "var(--text-primary)",
                                    "& .MuiSelect-icon": { fill: "url(#themeGradient)" }
                                }}
                                MenuProps={{ disableAriaHidden: true }}
                            >
                                <MenuItem value="All">All Status</MenuItem>
                                <MenuItem value="Pending">{isResearchAdmin ? 'Pending at R&D' : 'Pending at HOD'}</MenuItem>
                                <MenuItem value="Approved">Approved</MenuItem>
                                <MenuItem value="Rejected">Rejected</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: durationFilter === 'Custom' ? 2 : 4 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel sx={{ color: "var(--text-secondary)" }}>Date Range</InputLabel>
                            <Select
                                value={durationFilter}
                                label="Date Range"
                                onChange={(e) => setDurationFilter(e.target.value)}
                                sx={{ 
                                    borderRadius: "12px", 
                                    background: "var(--bg-glass)",
                                    color: "var(--text-primary)",
                                    "& .MuiSelect-icon": { fill: "url(#themeGradient)" }
                                }}
                                MenuProps={{ disableAriaHidden: true }}
                            >
                                <MenuItem value="All">All Time</MenuItem>
                                <MenuItem value="1month">Last 1 Month</MenuItem>
                                <MenuItem value="6months">Last 6 Months</MenuItem>
                                <MenuItem value="1year">Last 1 Year</MenuItem>
                                <MenuItem value="Custom">Custom Range</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    {durationFilter === "Custom" && (
                        <>
                            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel shrink sx={{ color: "var(--text-secondary)" }}>From</InputLabel>
                                    <OutlinedInput 
                                        type="date"
                                        label="From"
                                        notched
                                        value={fromDate}
                                        onChange={(e) => setFromDate(e.target.value)}
                                        endAdornment={
                                            <InputAdornment position="end" sx={{ pointerEvents: "none", mr: -0.5 }}>
                                                <CalendarTodayIcon sx={{ fill: "url(#themeGradient)", fontSize: "1.1rem" }} />
                                            </InputAdornment>
                                        }
                                        sx={{ 
                                            borderRadius: "12px", 
                                            background: "var(--bg-glass)",
                                            color: "var(--text-primary)",
                                            "& input::-webkit-calendar-picker-indicator": {
                                                opacity: 0,
                                                cursor: "pointer",
                                                position: "absolute",
                                                right: 0,
                                                width: "30px",
                                                height: "100%",
                                            }
                                        }}
                                    />
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel shrink sx={{ color: "var(--text-secondary)" }}>To</InputLabel>
                                    <OutlinedInput 
                                        type="date"
                                        label="To"
                                        notched
                                        value={toDate}
                                        onChange={(e) => setToDate(e.target.value)}
                                        endAdornment={
                                            <InputAdornment position="end" sx={{ pointerEvents: "none", mr: -0.5 }}>
                                                <CalendarTodayIcon sx={{ fill: "url(#themeGradient)", fontSize: "1.1rem" }} />
                                            </InputAdornment>
                                        }
                                        sx={{ 
                                            borderRadius: "12px", 
                                            background: "var(--bg-glass)",
                                            color: "var(--text-primary)",
                                            "& input::-webkit-calendar-picker-indicator": {
                                                opacity: 0,
                                                cursor: "pointer",
                                                position: "absolute",
                                                right: 0,
                                                width: "30px",
                                                height: "100%",
                                            }
                                        }}
                                    />
                                </FormControl>
                            </Grid>
                        </>
                    )}
                </Grid>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ width: "100%", p: { xs: 1.5, sm: 2, md: 3 }, mb: 3 }}>
            <svg width="0" height="0" style={{ position: 'absolute' }}>
                <defs>
                    <linearGradient id="themeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--color-primary, #f6d365)" />
                        <stop offset="100%" stopColor="var(--text-primary, #fda085)" />
                    </linearGradient>
                </defs>
            </svg>
            <Stack spacing={3} sx={{ width: "100%" }}>
                <PageHeader
                    title={isResearchAdmin ? "Research Approvals (R&D)" : "Department Research Approvals"}
                    subtitle={isResearchAdmin ? "Review and finalize research submissions across all departments" : "Approve, reject, and track department research submissions"}
                />

                <Box sx={{ width: "100%" }}>
                    <SectionHeader title="Research Requests" />
                    {/* Render filters outside DataTable for 100% full width */}
                    <Box sx={{ mb: 3 }}>
                        {toolbarLeft}
                    </Box>
                    <DataTable
                        columns={columns}
                        rows={rows}
                    />
                    {!loading && rows.length === 0 && (
                        <Typography sx={{ textAlign: "center", py: 4, color: "var(--text-secondary)" }}>
                            No research requests found for the selected filters.
                        </Typography>
                    )}
                </Box>
            </Stack>
        </Box>
    );
};

export default ResearchApprovalList;
