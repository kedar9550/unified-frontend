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
    Paper
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
import { PageContainer } from "../../components/common/design-system";
import ActionButton from "../../components/common/ActionButton";
import API from "../../api/axios";
import { toast } from "sonner";

const getAlignments = (columns) => {
    return columns.map(col => {
        const lowerCol = col.toLowerCase();
        // Left align names, titles, authors, categories, organizations, agencies
        if (lowerCol.includes("name") || lowerCol.includes("title") || lowerCol.includes("author") || lowerCol.includes("inventor") || lowerCol.includes("developer") || lowerCol.includes("investigator") || lowerCol.includes("agency") || lowerCol.includes("organisation") || lowerCol.includes("publisher") || lowerCol.includes("category") || lowerCol === "dept") {
            return "left";
        }
        // Right align amounts/money
        if (lowerCol.includes("amount") || lowerCol.includes("cost")) {
            return "right";
        }
        // Center everything else (S.No, IDs, Years, Statuses, Booleans, etc.)
        return "center";
    });
};

export default function ResearchReports() {
    const [activeTab, setActiveTab] = useState(0);
    const [academicYears, setAcademicYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState("");
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState({ journals: [], textbooks: [], chapters: [], conferences: [], patents: [], products: [], projects: [], consultancy: [] });

    useEffect(() => {
        // Fetch Academic Years
        API.get("/api/academic-years").then(res => {
            const yearsList = res.data?.years || res.data?.data || [];
            setAcademicYears(yearsList);
            const active = yearsList.find(y => y.active);
            setSelectedYear(active ? active._id : "All");
        }).catch(err => {
            console.log("Failed to fetch academic years", err);
            setSelectedYear("All");
        });
    }, []);

    useEffect(() => {
        if (selectedYear) {
            fetchReportData();
        }
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

    const getYearName = () => {
        const found = academicYears.find(y => y._id === selectedYear);
        return found ? found.year : (selectedYear === "All" ? "All_Years" : selectedYear);
    };

    const downloadCSV = (type) => {
        if (type === "consolidated") {
            handleConsolidatedDownload();
            return;
        }

        const yearName = getYearName();

        let headers = [];
        let rows = [];
        let filename = "";

        if (type === "journals") {
            headers = ["S.No", "Emp Id", "Name of Faculty", "Dept", "PAN No", "Name of the Journal", "Paper Title", "Academic Year", "Amount (Rs)", "Status", "Co-Authors"];
            rows = (data.journals || []).map((item, i) => [
                i + 1,
                item.empId,
                item.facultyName,
                item.dept,
                item.panNo,
                item.journalName,
                item.paperTitle,
                item.year,
                item.amount,
                item.status,
                item.coAuthorsText || "N/A"
            ]);
            filename = `Journal_Incentives_Report_${yearName}.csv`;
        } else if (type === "textbooks") {
            headers = ["S.No", "Dept", "Name of Faculty", "Title of the Book", "Name of the Publisher", "ISBN Number", "Academic Year", "Status", "Co-Authors"];
            rows = (data.textbooks || []).map((item, i) => [
                i + 1,
                item.dept,
                item.facultyName,
                item.title,
                item.publisher,
                item.isbn,
                item.year,
                item.status,
                item.coAuthorsText || "N/A"
            ]);
            filename = `Textbooks_Report_${yearName}.csv`;
        } else if (type === "chapters") {
            headers = ["S.No", "Dept", "Name of Faculty", "Name of Book Chapter", "Name of the Book", "Name of Publisher", "Academic Year", "Month & Year", "Status", "Co-Authors"];
            rows = (data.chapters || []).map((item, i) => [
                i + 1,
                item.dept,
                item.facultyName,
                item.chapterTitle,
                item.bookName,
                item.publisher,
                item.year,
                item.month,
                item.status,
                item.coAuthorsText || "N/A"
            ]);
            filename = `Book_Chapters_Report_${yearName}.csv`;
        } else if (type === "conferences") {
            headers = ["S.No", "Emp Id", "Name of Faculty", "Dept", "PAN No", "Conference Name", "Paper Title", "Academic Year", "Amount (Rs)", "Status", "Co-Authors"];
            rows = (data.conferences || []).map((item, i) => [
                i + 1,
                item.empId,
                item.facultyName,
                item.dept,
                item.panNo,
                item.conferenceName,
                item.paperTitle,
                item.year,
                item.amount,
                item.status,
                item.coAuthorsText || "N/A"
            ]);
            filename = `Conferences_Report_${yearName}.csv`;
        } else if (type === "patents") {
            headers = ["S.No", "Emp Id", "Name of Faculty", "Dept", "PAN No", "Patent Title", "Filing No", "Academic Year", "Amount (Rs)", "Status", "Co-Inventors"];
            rows = (data.patents || []).map((item, i) => [
                i + 1,
                item.empId,
                item.facultyName,
                item.dept,
                item.panNo,
                item.title,
                item.filingNo,
                item.year,
                item.amount,
                item.status,
                item.coAuthorsText || "N/A"
            ]);
            filename = `Patents_Report_${yearName}.csv`;
        } else if (type === "products") {
            headers = ["S.No", "Emp Id", "Name of Faculty", "Dept", "PAN No", "Product Name", "Category", "Organisation", "Academic Year", "Status", "Co-Developers"];
            rows = (data.products || []).map((item, i) => [
                i + 1,
                item.empId,
                item.facultyName,
                item.dept,
                item.panNo,
                item.title,
                item.category,
                item.organization,
                item.year,
                item.status,
                item.coAuthorsText || "N/A"
            ]);
            filename = `Novel_Products_Report_${yearName}.csv`;
        } else if (type === "projects") {
            headers = ["S.No", "Emp Id", "Name of Faculty", "Dept", "PAN No", "Project Title", "Funding Agency", "Academic Year", "Sanctioned Amount (Rs)", "Incentive Amount (Rs)", "Project Status", "Status", "Co-Investigators"];
            rows = (data.projects || []).map((item, i) => [
                i + 1,
                item.empId,
                item.facultyName,
                item.dept,
                item.panNo,
                item.title,
                item.agency,
                item.year,
                item.sanctionedAmount,
                item.amount,
                item.projectStatus,
                item.status,
                item.coAuthorsText || "N/A"
            ]);
            filename = `Funded_Projects_Report_${yearName}.csv`;
        } else if (type === "consultancy") {
            headers = ["S.No", "Emp Id", "Name of Faculty", "Dept", "PAN No", "Consultancy Title", "Agency", "Academic Year", "Sanctioned Amount (Rs)", "Incentive Amount (Rs)", "Project Status", "Status", "Co-Investigators"];
            rows = (data.consultancy || []).map((item, i) => [
                i + 1,
                item.empId,
                item.facultyName,
                item.dept,
                item.panNo,
                item.title,
                item.agency,
                item.year,
                item.sanctionedAmount,
                item.amount,
                item.projectStatus,
                item.status,
                item.coAuthorsText || "N/A"
            ]);
            filename = `Consultancy_Report_${yearName}.csv`;
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
                "Serving Department",
                "PAN Number",
                "Journal Name",
                "Paper Title",
                "Academic Year",
                "Amount",
                "Status",
                "Co-Authors"
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
                    item.year,
                    item.amount,
                    item.status,
                    item.coAuthorsText || "N/A"
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
            "Serving Department",
            "PAN Number",
            "Book Title",
            "Publisher",
            "ISBN",
            "Amount",
            "Status",
            "Co-Authors"
        ].join(","));

        (data.textbooks || []).forEach((item, index) => {
            lines.push([
                index + 1,
                item.empId,
                item.facultyName,
                item.dept,
                item.panNo,
                item.title,
                item.publisher,
                item.isbn,
                item.amount || "-",
                item.status,
                item.coAuthorsText || "N/A"
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
            "Serving Department",
            "PAN Number",
            "Chapter Title",
            "Book Name",
            "Publisher",
            "Amount",
            "Status",
            "Co-Authors"
        ].join(","));

        (data.chapters || []).forEach((item, index) => {
            lines.push([
                index + 1,
                item.empId,
                item.facultyName,
                item.dept,
                item.panNo,
                item.chapterTitle,
                item.bookName,
                item.publisher,
                item.amount || "-",
                item.status,
                item.coAuthorsText || "N/A"
            ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
        });

        lines.push("");
        lines.push("");

        // ===============================
        // CONFERENCES
        // ===============================

        lines.push(`"CONFERENCE PUBLICATIONS"`);

        lines.push([
            "S.No",
            "Emp ID",
            "Faculty Name",
            "Serving Department",
            "PAN Number",
            "Conference Name",
            "Paper Title",
            "Academic Year",
            "Amount",
            "Status",
            "Co-Authors"
        ].join(","));

        (data.conferences || []).forEach((item, index) => {
            lines.push([
                index + 1,
                item.empId,
                item.facultyName,
                item.dept,
                item.panNo,
                item.conferenceName,
                item.paperTitle || "-",
                item.year,
                item.amount || "-",
                item.status,
                item.coAuthorsText || "N/A"
            ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
        });

        lines.push("");
        lines.push("");

        // ===============================
        // PATENTS
        // ===============================

        lines.push(`"PATENTS"`);

        lines.push([
            "S.No",
            "Emp ID",
            "Faculty Name",
            "Serving Department",
            "PAN Number",
            "Patent Title",
            "Filing No",
            "Academic Year",
            "Amount",
            "Status",
            "Co-Inventors"
        ].join(","));

        (data.patents || []).forEach((item, index) => {
            lines.push([
                index + 1,
                item.empId,
                item.facultyName,
                item.dept,
                item.panNo,
                item.title,
                item.filingNo || "-",
                item.year,
                item.amount || "-",
                item.status,
                item.coAuthorsText || "N/A"
            ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
        });

        lines.push("");
        lines.push("");

        // ===============================
        // NOVEL PRODUCTS
        // ===============================

        lines.push(`"NOVEL PRODUCTS"`);

        lines.push([
            "S.No",
            "Emp ID",
            "Faculty Name",
            "Serving Department",
            "PAN Number",
            "Product Name",
            "Category",
            "Organisation",
            "Academic Year",
            "Status",
            "Co-Developers"
        ].join(","));

        (data.products || []).forEach((item, index) => {
            lines.push([
                index + 1,
                item.empId,
                item.facultyName,
                item.dept,
                item.panNo,
                item.title,
                item.category || "-",
                item.organization,
                item.year,
                item.status,
                item.coAuthorsText || "N/A"
            ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
        });

        lines.push("");
        lines.push("");

        // ===============================
        // FUNDED PROJECTS
        // ===============================

        lines.push(`"FUNDED PROJECTS"`);

        lines.push([
            "S.No",
            "Emp ID",
            "Faculty Name",
            "Serving Department",
            "PAN Number",
            "Project Title",
            "Funding Agency",
            "Academic Year",
            "Sanctioned Amount",
            "Incentive Amount",
            "Project Status",
            "Status",
            "Co-Investigators"
        ].join(","));

        (data.projects || []).forEach((item, index) => {
            lines.push([
                index + 1,
                item.empId,
                item.facultyName,
                item.dept,
                item.panNo,
                item.title,
                item.agency || "-",
                item.year,
                item.sanctionedAmount,
                item.amount || "-",
                item.projectStatus,
                item.status,
                item.coAuthorsText || "N/A"
            ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
        });

        lines.push("");
        lines.push("");

        // ===============================
        // CONSULTANCY
        // ===============================

        lines.push(`"CONSULTANCY"`);

        lines.push([
            "S.No",
            "Emp ID",
            "Faculty Name",
            "Serving Department",
            "PAN Number",
            "Consultancy Title",
            "Agency",
            "Academic Year",
            "Sanctioned Amount",
            "Incentive Amount",
            "Project Status",
            "Status",
            "Co-Investigators"
        ].join(","));

        (data.consultancy || []).forEach((item, index) => {
            lines.push([
                index + 1,
                item.empId,
                item.facultyName,
                item.dept,
                item.panNo,
                item.title,
                item.agency || "-",
                item.year,
                item.sanctionedAmount,
                item.amount || "-",
                item.projectStatus,
                item.status,
                item.coAuthorsText || "N/A"
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

    const exportButtonSx = {
        width: { xs: "100%", sm: "auto" },
        textTransform: "none",
        background: "var(--gradient-primary)",
        boxShadow: "0 4px 12px rgba(190, 147, 55, 0.2)",
        "&:hover": {
            background: "var(--gradient-primary)",
            opacity: 0.9,
            boxShadow: "0 6px 16px rgba(190, 147, 55, 0.3)"
        }
    };

    const renderJournals = () => {
        const columns = ["S.No", "Emp Id", "Faculty Name", "Dept", "Journal Name", "Paper Title", "Academic Year", "Status", "Co-Authors"];
        const rows = (data.journals || []).map((item, i) => [
            i + 1,
            item.empId,
            item.facultyName,
            item.dept,
            item.journalName,
            item.paperTitle,
            item.year,
            item.status,
            item.coAuthorsText || "N/A"
        ]);
        const alignments = getAlignments(columns);
        return (
            <DataTable columns={columns} alignments={alignments} rows={rows} toolbarLeft={
                <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={() => downloadCSV("journals")}
                    sx={exportButtonSx}
                >
                    Export to Excel
                </Button>
            } />
        );
    };

    const renderTextbooks = () => {
        const columns = ["S.No", "Dept", "Faculty Name", "Book Title", "Publisher", "ISBN", "Year", "Status", "Co-Authors"];
        const rows = (data.textbooks || []).map((item, i) => [
            i + 1,
            item.dept,
            item.facultyName,
            item.title,
            item.publisher,
            item.isbn,
            item.year,
            item.status,
            item.coAuthorsText || "N/A"
        ]);
        const alignments = getAlignments(columns);
        return (
            <DataTable columns={columns} alignments={alignments} rows={rows} toolbarLeft={
                <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={() => downloadCSV("textbooks")}
                    sx={exportButtonSx}
                >
                    Export to Excel
                </Button>
            } />
        );
    };

    const renderChapters = () => {
        const columns = ["S.No", "Dept", "Faculty Name", "Chapter Title", "Book Name", "Publisher", "Year", "Status", "Co-Authors"];
        const rows = (data.chapters || []).map((item, i) => [
            i + 1,
            item.dept,
            item.facultyName,
            item.chapterTitle,
            item.bookName,
            item.publisher,
            item.year,
            item.status,
            item.coAuthorsText || "N/A"
        ]);
        const alignments = getAlignments(columns);
        return (
            <DataTable columns={columns} alignments={alignments} rows={rows} toolbarLeft={
                <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={() => downloadCSV("chapters")}
                    sx={exportButtonSx}
                >
                    Export to Excel
                </Button>
            } />
        );
    };

    const renderConferences = () => {
        const columns = ["S.No", "Emp Id", "Faculty Name", "Dept", "Conference Name", "Academic Year", "Status", "Co-Authors"];
        const rows = (data.conferences || []).map((item, i) => [
            i + 1,
            item.empId,
            item.facultyName,
            item.dept,
            item.conferenceName,
            item.year,
            item.status,
            item.coAuthorsText || "N/A"
        ]);
        const alignments = getAlignments(columns);
        return (
            <DataTable columns={columns} alignments={alignments} rows={rows} toolbarLeft={
                <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={() => downloadCSV("conferences")}
                    sx={exportButtonSx}
                >
                    Export to Excel
                </Button>
            } />
        );
    };

    const renderPatents = () => {
        const columns = ["S.No", "Emp Id", "Faculty Name", "Dept", "Patent Title", "Academic Year", "Status", "Co-Inventors"];
        const rows = (data.patents || []).map((item, i) => [
            i + 1,
            item.empId,
            item.facultyName,
            item.dept,
            item.title,
            item.year,
            item.status,
            item.coAuthorsText || "N/A"
        ]);
        const alignments = getAlignments(columns);
        return (
            <DataTable columns={columns} alignments={alignments} rows={rows} toolbarLeft={
                <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={() => downloadCSV("patents")}
                    sx={exportButtonSx}
                >
                    Export to Excel
                </Button>
            } />
        );
    };

    const renderProducts = () => {
        const columns = ["S.No", "Emp Id", "Faculty Name", "Dept", "Product Name", "Category", "Organisation", "Academic Year", "Status", "Co-Developers"];
        const rows = (data.products || []).map((item, i) => [
            i + 1,
            item.empId,
            item.facultyName,
            item.dept,
            item.title,
            item.category,
            item.organization,
            item.year,
            item.status,
            item.coAuthorsText || "N/A"
        ]);
        const alignments = getAlignments(columns);
        return (
            <DataTable columns={columns} alignments={alignments} rows={rows} toolbarLeft={
                <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={() => downloadCSV("products")}
                    sx={exportButtonSx}
                >
                    Export to Excel
                </Button>
            } />
        );
    };

    const renderProjects = () => {
        const columns = ["S.No", "Emp Id", "Faculty Name", "Dept", "Project Title", "Funding Agency", "Academic Year", "Sanctioned Amount", "Incentive Amount", "Project Status", "Status", "Co-Investigators"];
        const rows = (data.projects || []).map((item, i) => [
            i + 1,
            item.empId,
            item.facultyName,
            item.dept,
            item.title,
            item.agency || "-",
            item.year,
            item.sanctionedAmount,
            item.amount,
            item.projectStatus,
            item.status,
            item.coAuthorsText || "N/A"
        ]);
        const alignments = getAlignments(columns);
        return (
            <DataTable columns={columns} alignments={alignments} rows={rows} toolbarLeft={
                <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={() => downloadCSV("projects")}
                    sx={exportButtonSx}
                >
                    Export to Excel
                </Button>
            } />
        );
    };

    const renderConsultancy = () => {
        const columns = ["S.No", "Emp Id", "Faculty Name", "Dept", "Consultancy Title", "Agency", "Academic Year", "Sanctioned Amount", "Incentive Amount", "Project Status", "Status", "Co-Investigators"];
        const rows = (data.consultancy || []).map((item, i) => [
            i + 1,
            item.empId,
            item.facultyName,
            item.dept,
            item.title,
            item.agency || "-",
            item.year,
            item.sanctionedAmount,
            item.amount,
            item.projectStatus,
            item.status,
            item.coAuthorsText || "N/A"
        ]);
        const alignments = getAlignments(columns);
        return (
            <DataTable columns={columns} alignments={alignments} rows={rows} toolbarLeft={
                <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={() => downloadCSV("consultancy")}
                    sx={exportButtonSx}
                >
                    Export to Excel
                </Button>
            } />
        );
    };

    return (
        <PageContainer>
            <PageHeader
                title="Research & Incentive Reports"
                subtitle="Generate and export comprehensive research publication and incentive reports"
            />

            <Paper elevation={0} sx={{ borderRadius: "16px", border: "1px solid var(--border-color)", background: "var(--bg-paper)", overflow: "hidden" }}>
                {/* Toolbar Section */}
                <Box sx={{ p: 2.5, borderBottom: "1px solid var(--border-color)", background: "var(--bg-glass)" }}>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ width: "100%", alignItems: { xs: "stretch", sm: "center" } }}>
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
                            <Tab icon={<BookIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Conferences" />
                            <Tab icon={<BookIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Patents" />
                            <Tab icon={<BookIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Novel Products" />
                            <Tab icon={<BookIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Funded Projects" />
                            <Tab icon={<BookIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Consultancy" />
                        </Tabs>

                        <Box sx={{ flexGrow: 1 }} />

                        <FormControl size="small" sx={{ width: { xs: "100%", sm: "auto" }, minWidth: { xs: "100%", sm: 220 } }}>
                            <InputLabel id="academic-year-label">Academic Year</InputLabel>
                            <Select
                                labelId="academic-year-label"
                                value={selectedYear}
                                label="Academic Year"
                                onChange={(e) => setSelectedYear(e.target.value)}
                                sx={{ borderRadius: "12px", background: "var(--bg-glass)", width: "100%" }}
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
                    <Box>
                        {activeTab === 0 && renderJournals()}
                        {activeTab === 1 && renderTextbooks()}
                        {activeTab === 2 && renderChapters()}
                        {activeTab === 3 && renderConferences()}
                        {activeTab === 4 && renderPatents()}
                        {activeTab === 5 && renderProducts()}
                        {activeTab === 6 && renderProjects()}
                        {activeTab === 7 && renderConsultancy()}
                    </Box>
                </Box>
            </Paper>
        </PageContainer>
    );
}
