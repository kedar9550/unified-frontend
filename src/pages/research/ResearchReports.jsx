import Loader from "../../components/common/Loader";
import React, { useState, useEffect } from "react";
import {
    Box,
    Tabs,
    Tab,
    Typography,
    Button,
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Paper,
    CircularProgress
} from "@mui/material";
import {
    Download as DownloadIcon,
    Analytics as AnalyticsIcon,
    MenuBook as BookIcon,
    Article as JournalIcon
} from "@mui/icons-material";
import PageHeader from "../../components/common/PageHeader";
import SectionHeader from "../../components/common/SectionHeader";
import DataTable from "../../components/data/DataTable";
import API from "../../api/axios";
import { toast } from "sonner";

export default function ResearchReports() {
    const [activeTab, setActiveTab] = useState(0);
    const [academicYears, setAcademicYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState("All");
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState({ journals: [], textbooks: [], chapters: [] });

    useEffect(() => {
        // Fetch Academic Years
        API.get("/api/academic-years").then(res => {
            setAcademicYears(res.data?.years || res.data?.data || []);
        }).catch(err => console.log("Failed to fetch academic years", err));

        fetchReportData();
    }, [selectedYear]);

    const fetchReportData = async () => {
        setLoading(true);
        try {
            const params = {};
            if (selectedYear !== "All") params.academicYear = selectedYear;

            const res = await API.get("/api/hod/research-requests/reports", { params });
            if (res.data?.success) {
                setData(res.data.data);
            }
        } catch (error) {
            toast.error("Failed to fetch report data");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const downloadCSV = (type) => {
        if (type === "consolidated") {
            handleConsolidatedDownload();
            return;
        }

        let headers = [];
        let rows = [];
        let filename = "";

        if (type === "journals") {
            headers = ["S.No", "Emp Id", "Name of Faculty", "Dept", "PAN No", "Name of the Journal", "Amount (Rs)"];
            rows = data.journals.map((item, i) => [
                i + 1,
                item.empId,
                item.facultyName,
                item.dept,
                item.panNo,
                item.journalName,
                item.amount
            ]);
            filename = `Journal_Incentives_Report_${selectedYear}.csv`;
        } else if (type === "textbooks") {
            headers = ["S.No", "Dept", "Name of Faculty", "Title of the Book", "Name of the Publisher", "ISBN Number", "Academic Year"];
            rows = data.textbooks.map((item, i) => [
                i + 1,
                item.dept,
                item.facultyName,
                item.title,
                item.publisher,
                item.isbn,
                item.year
            ]);
            filename = `Textbooks_Report_${selectedYear}.csv`;
        } else if (type === "chapters") {
            headers = ["S.No", "Dept", "Name of Faculty", "Name of Book Chapter", "Name of the Book", "Name of Publisher", "Academic Year", "Month & Year"];
            rows = data.chapters.map((item, i) => [
                i + 1,
                item.dept,
                item.facultyName,
                item.chapterTitle,
                item.bookName,
                item.publisher,
                item.year,
                item.month
            ]);
            filename = `Book_Chapters_Report_${selectedYear}.csv`;
        }

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        ].join("\n");

        triggerDownload(csvContent, filename);
    };

    const handleConsolidatedDownload = () => {
        let lines = [];

        const academicYearText =
            academicYears.find(y => y._id === selectedYear)?.year || "All Years";

        // MAIN TITLE
        lines.push(`"ADITYA UNIVERSITY"`);
        lines.push(`"RESEARCH INCENTIVE REPORT - ${academicYearText}"`);
        lines.push("");

        const q1Journals = data.journals.filter(
            j => j.category === "Q1"
        );

        const q2Journals = data.journals.filter(
            j => j.category === "Q2"
        );

        const scopusJournals = data.journals.filter(
            j => j.category === "SCOPUS"
        );

        const addJournalSection = (title, journals) => {
            lines.push(`"${title}"`);

            lines.push([
                "S.No",
                "Emp ID",
                "Faculty Name",
                "Department",
                "PAN Number",
                "Journal Name",
                "Paper Title",
                "Amount"
            ].join(","));

            journals.forEach((item, index) => {
                lines.push([
                    index + 1,
                    item.empId,
                    item.facultyName,
                    item.dept,
                    item.panNo,
                    item.journalName,
                    item.paperTitle || "-",
                    item.amount
                ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
            });

            lines.push("");
            lines.push("");
        };

        // Q1
        addJournalSection("Q1 JOURNAL PUBLICATIONS", q1Journals);

        // Q2
        addJournalSection("Q2 JOURNAL PUBLICATIONS", q2Journals);

        // Scopus
        addJournalSection("SCOPUS JOURNAL PUBLICATIONS", scopusJournals);

        // ===============================
        // TEXT BOOKS
        // ===============================

        lines.push(`"TEXT BOOK PUBLICATIONS"`);

        lines.push([
            "S.No",
            "Emp ID",
            "Faculty Name",
            "Department",
            "PAN Number",
            "Book Title",
            "Publisher",
            "ISBN",
            "Amount"
        ].join(","));

        data.textbooks.forEach((item, index) => {
            lines.push([
                index + 1,
                item.empId,
                item.facultyName,
                item.dept,
                item.panNo,
                item.title,
                item.publisher,
                item.isbn,
                item.amount || "-"
            ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
        });

        lines.push("");
        lines.push("");

        // ===============================
        // BOOK CHAPTERS
        // ===============================

        lines.push(`"BOOK CHAPTER PUBLICATIONS"`);

        lines.push([
            "S.No",
            "Emp ID",
            "Faculty Name",
            "Department",
            "PAN Number",
            "Chapter Title",
            "Book Name",
            "Publisher",
            "Amount"
        ].join(","));

        data.chapters.forEach((item, index) => {
            lines.push([
                index + 1,
                item.empId,
                item.facultyName,
                item.dept,
                item.panNo,
                item.chapterTitle,
                item.bookName,
                item.publisher,
                item.amount || "-"
            ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
        });

        triggerDownload(
            lines.join("\n"),
            `Research_Report_${academicYearText}.csv`
        );
    };

    const triggerDownload = (content, filename) => {
        const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderJournals = () => {
        const columns = ["S.No", "Emp Id", "Faculty Name", "Dept", "Journal Name"];
        const rows = data.journals.map((item, i) => [
            i + 1,
            item.empId,
            item.facultyName,
            item.dept,
            item.journalName
        ]);
        return (
            <DataTable columns={columns} rows={rows} toolbarLeft={
                <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={() => downloadCSV("journals")}
                    sx={{
                        borderRadius: "12px",
                        textTransform: "none",
                        background: "var(--gradient-primary)",
                        boxShadow: "0 4px 12px rgba(190, 147, 55, 0.2)",
                        "&:hover": {
                            background: "var(--gradient-primary)",
                            opacity: 0.9,
                            boxShadow: "0 6px 16px rgba(190, 147, 55, 0.3)"
                        }
                    }}
                >
                    Export to Excel
                </Button>
            } />
        );
    };

    const renderTextbooks = () => {
        const columns = ["S.No", "Dept", "Faculty Name", "Book Title", "Publisher", "ISBN", "Year"];
        const rows = data.textbooks.map((item, i) => [
            i + 1,
            item.dept,
            item.facultyName,
            item.title,
            item.publisher,
            item.isbn,
            item.year
        ]);
        return (
            <DataTable columns={columns} rows={rows} toolbarLeft={
                <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={() => downloadCSV("textbooks")}
                    sx={{
                        borderRadius: "12px",
                        textTransform: "none",
                        background: "var(--gradient-primary)",
                        boxShadow: "0 4px 12px rgba(190, 147, 55, 0.2)",
                        "&:hover": {
                            background: "var(--gradient-primary)",
                            opacity: 0.9,
                            boxShadow: "0 6px 16px rgba(190, 147, 55, 0.3)"
                        }
                    }}
                >
                    Export to Excel
                </Button>
            } />
        );
    };

    const renderChapters = () => {
        const columns = ["S.No", "Dept", "Faculty Name", "Chapter Title", "Book Name", "Publisher", "Year"];
        const rows = data.chapters.map((item, i) => [
            i + 1,
            item.dept,
            item.facultyName,
            item.chapterTitle,
            item.bookName,
            item.publisher,
            item.year
        ]);
        return (
            <DataTable columns={columns} rows={rows} toolbarLeft={
                <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={() => downloadCSV("chapters")}
                    sx={{
                        borderRadius: "12px",
                        textTransform: "none",
                        background: "var(--gradient-primary)",
                        boxShadow: "0 4px 12px rgba(190, 147, 55, 0.2)",
                        "&:hover": {
                            background: "var(--gradient-primary)",
                            opacity: 0.9,
                            boxShadow: "0 6px 16px rgba(190, 147, 55, 0.3)"
                        }
                    }}
                >
                    Export to Excel
                </Button>
            } />
        );
    };

    return (
        <Box sx={{ width: "100%", p: { xs: 1.5, sm: 2, md: 3 } }}>
            <Stack spacing={3}>
                <PageHeader
                    title="Research & Incentive Reports"
                    subtitle="Generate and export comprehensive research publication and incentive reports"
                />

                <Paper sx={{ borderRadius: "16px", border: "1px solid var(--border-color)", background: "var(--bg-panel)", overflow: "hidden" }}>
                    {/* Toolbar Section */}
                    <Box sx={{ p: 2.5, borderBottom: "1px solid var(--border-color)", background: "rgba(0,0,0,0.02)" }}>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={3} sx={{ width: "100%", alignItems: "center" }}>
                            <Tabs
                                value={activeTab}
                                onChange={handleTabChange}
                                variant="scrollable"
                                scrollButtons="auto"
                                allowScrollButtonsMobile
                                sx={{
                                    width: "100%",
                                    maxWidth: "100%",
                                    minHeight: 48,
                                    "& .MuiTabs-scrollButtons.Mui-disabled": {
                                        width: 0,
                                        opacity: 0,
                                        overflow: "hidden"
                                    },
                                    "& .MuiTabs-indicator": {
                                        height: 3,
                                        borderRadius: "3px",
                                        background: "var(--gradient-primary) !important"
                                    },
                                    "& .MuiTab-root": {
                                        textTransform: "none",
                                        fontWeight: 700,
                                        fontSize: "0.95rem",
                                        minHeight: 48,
                                        py: 1.5,
                                        color: "var(--text-secondary)",
                                        transition: "all 0.2s ease",
                                        "&.Mui-selected": {
                                            color: "var(--color-primary) !important",
                                        },
                                        "&.Mui-selected svg": {
                                            color: "var(--color-primary) !important"
                                        }
                                    }
                                }}
                            >
                                <Tab icon={<JournalIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Journals" />
                                <Tab icon={<BookIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Text Books" />
                                <Tab icon={<BookIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Book Chapters" />
                                <Tab icon={<AnalyticsIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Consolidated" />
                            </Tabs>

                            <Box sx={{ flexGrow: 1 }} />

                            <FormControl size="small" sx={{ minWidth: 220 }}>
                                <InputLabel id="academic-year-label">Academic Year</InputLabel>
                                <Select
                                    labelId="academic-year-label"
                                    value={selectedYear}
                                    label="Academic Year"
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    sx={{ borderRadius: "12px", background: "var(--bg-glass)" }}
                                >
                                    <MenuItem value="All">All Years</MenuItem>
                                    {academicYears.map(y => (
                                        <MenuItem key={y._id} value={y._id}>{y.year}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
                    </Box>

                    {/* Content Section */}
                    <Box sx={{ p: 2.5 }}>

                        {/* {loading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
                            <Loader sx={{ color: "var(--color-primary)" }} />
                        </Box>
                    ) : ( */}
                        <Box>
                            {activeTab === 0 && renderJournals()}
                            {activeTab === 1 && renderTextbooks()}
                            {activeTab === 2 && renderChapters()}
                            {activeTab === 3 && (
                                <Box sx={{ textAlign: "center", py: 5 }}>
                                    <AnalyticsIcon sx={{ fontSize: 60, color: "var(--color-primary-alpha)", mb: 2 }} />
                                    <Typography variant="h6" sx={{ color: "var(--text-primary)", mb: 1 }}>Download Consolidated Report</Typography>
                                    <Typography variant="body2" sx={{ color: "var(--text-secondary)", mb: 3 }}>
                                        This will generate a single file containing all research categories.
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        size="large"
                                        startIcon={<DownloadIcon />}
                                        onClick={() => downloadCSV("consolidated")}
                                        sx={{
                                            borderRadius: "12px",
                                            textTransform: "none",
                                            px: 4,
                                            py: 1.5,
                                            background: "var(--gradient-primary)",
                                            boxShadow: "0 4px 12px rgba(190, 147, 55, 0.2)",
                                            "&:hover": {
                                                background: "var(--gradient-primary)",
                                                opacity: 0.9,
                                                boxShadow: "0 6px 16px rgba(190, 147, 55, 0.3)"
                                            }
                                        }}
                                    >
                                        Download Consolidated Report (.csv)
                                    </Button>
                                </Box>
                            )}
                        </Box>
                        {/* )} */}
                    </Box>
                </Paper>
            </Stack>
        </Box>
    );
}
