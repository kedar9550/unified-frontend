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
    TextField,
    OutlinedInput,
    Popover,
    Chip,
    IconButton
} from "@mui/material";
import {
    Download as DownloadIcon,
    Analytics as AnalyticsIcon,
    MenuBook as BookIcon,
    Article as JournalIcon,
    DateRange as DateRangeIcon,
    Close as CloseIcon
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
        // Left align names, titles, authors, categories, organizations, agencies, dept, doi
        if (lowerCol.includes("name") || lowerCol.includes("title") || lowerCol.includes("author") || lowerCol.includes("inventor") || lowerCol.includes("developer") || lowerCol.includes("investigator") || lowerCol.includes("agency") || lowerCol.includes("organisation") || lowerCol.includes("publisher") || lowerCol.includes("category") || lowerCol === "dept" || lowerCol === "doi" || lowerCol.includes("applied")) {
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
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [tempStartDate, setTempStartDate] = useState("");
    const [tempEndDate, setTempEndDate] = useState("");
    const [datePopoverAnchor, setDatePopoverAnchor] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleOpenDatePopover = (event) => {
        setTempStartDate(startDate);
        setTempEndDate(endDate);
        setDatePopoverAnchor(event.currentTarget);
    };

    const handleCloseDatePopover = () => {
        setDatePopoverAnchor(null);
    };

    const handleApplyDateFilter = () => {
        const today = new Date().toISOString().split('T')[0];
        if (tempStartDate && tempStartDate > today) {
            toast.error("From Date cannot be in the future");
            return;
        }
        if (tempEndDate && tempEndDate > today) {
            toast.error("To Date cannot be in the future");
            return;
        }
        if (tempStartDate && tempEndDate && tempStartDate > tempEndDate) {
            toast.error("From Date cannot be after To Date");
            return;
        }
        setStartDate(tempStartDate);
        setEndDate(tempEndDate);
        setDatePopoverAnchor(null);
    };

    const handleClearDateFilter = () => {
        setTempStartDate("");
        setTempEndDate("");
        setStartDate("");
        setEndDate("");
        setDatePopoverAnchor(null);
    };

    const getDateFilterLabel = () => {
        if (startDate && endDate) return `${startDate} to ${endDate}`;
        if (startDate) return `From ${startDate}`;
        if (endDate) return `Up to ${endDate}`;
        return "Filter by Date";
    };
    const [data, setData] = useState({ journals: [], textbooks: [], chapters: [], conferences: [], patents: [], products: [], projects: [], consultancy: [] });
    const [loadedCategories, setLoadedCategories] = useState({});

    const TAB_CONFIG = [
        { key: "journals", type: "Journal" },
        { key: "textbooks", type: "Text Book" },
        { key: "chapters", type: "Book Chapter" },
        { key: "conferences", type: "Conference" },
        { key: "patents", type: "Patent" },
        { key: "products", type: "Novel Product" },
        { key: "projects", type: "Funded Project" },
        { key: "consultancy", type: "Consultancy" }
    ];

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
            setData({
                journals: [],
                textbooks: [],
                chapters: [],
                conferences: [],
                patents: [],
                products: [],
                projects: [],
                consultancy: []
            });
            setLoadedCategories({});
            fetchCategoryData(activeTab, selectedYear, false, startDate, endDate);
        }
    }, [selectedYear, startDate, endDate]);

    const fetchCategoryData = async (tabIndex, year, forceAll = false, sDate = startDate, eDate = endDate) => {
        const tab = TAB_CONFIG[tabIndex];
        if (!tab && !forceAll) return null;

        setLoading(true);
        try {
            const params = {};
            if (year !== "All") params.academicYear = year;
            if (!forceAll && tab) params.type = tab.type;
            if (sDate) params.startDate = sDate;
            if (eDate) params.endDate = eDate;

            const res = await API.get("/api/hod/research-requests/reports", { params });
            if (res.data?.success) {
                if (forceAll) {
                    setData(res.data.data);
                    const allKeys = {};
                    TAB_CONFIG.forEach(t => { allKeys[t.key] = true; });
                    setLoadedCategories(allKeys);
                    return res.data.data;
                } else {
                    setData(prev => ({
                        ...prev,
                        [tab.key]: res.data.data[tab.key] || []
                    }));
                    setLoadedCategories(prev => ({
                        ...prev,
                        [tab.key]: true
                    }));
                    return res.data.data;
                }
            }
        } catch (error) {
            toast.error("Failed to fetch report data");
            console.error(error);
        } finally {
            setLoading(false);
        }
        return null;
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
        const tab = TAB_CONFIG[newValue];
        if (tab && !loadedCategories[tab.key]) {
            fetchCategoryData(newValue, selectedYear, false, startDate, endDate);
        }
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
            headers = [
                "S.No", "Emp Id", "Faculty Name", "College", "PAN No", "Dept",
                "Is No DOI", "DOI", "Name of the Journal", "Paper Title", "Academic Year",
                "ISSN", "e-ISSN", "Is Scopus", "Is WoS", "Quartile", "WoS Journal Type", "Journal Category",
                "Vol", "Issue", "h-Index", "JCR Impact Factor", "Citations", "SDGs",
                "Corresponding Author", "Apply Incentive", "Approved Incentive Amount",
                "Appraisal Eligible", "Appraisal Claimant", "Status", "Co-Authors", "Applied At"
            ];
            rows = (data.journals || []).map((item, i) => [
                i + 1,
                item.empId,
                item.facultyName,
                item.college,
                item.panNo,
                item.dept,
                item.isNoDoi,
                item.doi,
                item.journalName,
                item.paperTitle,
                item.year,
                item.issn,
                item.eissn,
                item.isScopus,
                item.isWos,
                item.journalQuartile,
                item.journalType,
                item.journalCategory,
                item.vol,
                item.issue,
                item.hIndex,
                item.jcrImpactFactor,
                item.citations,
                item.sdgs,
                item.correspondingAuthor,
                item.applyIncentive,
                item.approvedAmount,
                item.appraisalEligible,
                item.appraisalClaimant,
                item.status,
                item.coAuthorsText || "N/A",
                item.appliedAt || "N/A"
            ]);
            filename = `Journal_Incentives_Report_${yearName}.csv`;
        } else if (type === "textbooks") {
            headers = [
                "S.No", "Emp Id", "Faculty Name", "College", "PAN No", "Dept",
                "Title of the Book", "Publisher", "ISBN Number", "Academic Year",
                "Is Scopus", "No. of Pages", "Apply Incentive", "Approved Incentive Amount",
                "Appraisal Eligible", "Appraisal Claimant", "Incentive Claimant",
                "Status", "Co-Authors", "Applied At"
            ];
            rows = (data.textbooks || []).map((item, i) => [
                i + 1,
                item.empId,
                item.facultyName,
                item.college,
                item.panNo,
                item.dept,
                item.title,
                item.publisher,
                item.isbn,
                item.year,
                item.scopusIndexed || "No",
                item.numberOfPages || "N/A",
                item.applyIncentive || "No",
                item.approvedAmount || item.amount || 0,
                item.appraisalEligible || "N/A",
                item.appraisalClaimant || "N/A",
                item.incentiveClaimant || "N/A",
                item.status,
                item.coAuthorsText || "N/A",
                item.appliedAt || "N/A"
            ]);
            filename = `Textbooks_Report_${yearName}.csv`;
        } else if (type === "chapters") {
            headers = [
                "S.No", "Emp Id", "Faculty Name", "College", "PAN No", "Dept",
                "Name of Book Chapter", "Name of the Book", "Publisher", "Academic Year",
                "Month", "No. of Pages", "Apply Incentive", "Approved Incentive Amount",
                "Appraisal Eligible", "Appraisal Claimant", "Incentive Claimant",
                "Status", "Co-Authors", "Applied At"
            ];
            rows = (data.chapters || []).map((item, i) => [
                i + 1,
                item.empId,
                item.facultyName,
                item.college,
                item.panNo,
                item.dept,
                item.chapterTitle,
                item.bookName,
                item.publisher,
                item.year,
                item.month || "N/A",
                item.numberOfPages || "N/A",
                item.applyIncentive || "No",
                item.approvedAmount || item.amount || 0,
                item.appraisalEligible || "N/A",
                item.appraisalClaimant || "N/A",
                item.incentiveClaimant || "N/A",
                item.status,
                item.coAuthorsText || "N/A",
                item.appliedAt || "N/A"
            ]);
            filename = `Book_Chapters_Report_${yearName}.csv`;
        } else if (type === "conferences") {
            headers = [
                "S.No", "Emp Id", "Faculty Name", "College", "PAN No", "Dept",
                "DOI", "Conference Name", "Paper Title", "Academic Year", "Month", "Year",
                "Location", "Conference Type", "Scopus Indexed", "ISSN/ISBN", "Publisher",
                "Students Involved", "Seed Grant Work", "Apply Incentive", "Approved Incentive Amount",
                "Appraisal Eligible", "Appraisal Claimant", "SDGs", "Status", "Co-Authors", "Applied At"
            ];
            rows = (data.conferences || []).map((item, i) => [
                i + 1,
                item.empId,
                item.facultyName,
                item.college,
                item.panNo,
                item.dept,
                item.doi,
                item.conferenceName,
                item.paperTitle,
                item.academicYear || item.year,
                item.month,
                item.publishedYear || item.year,
                item.location,
                item.conferenceType,
                item.scopusIndexed,
                item.issnIsbn,
                item.publisher,
                item.isStudentsInvolved,
                item.applyingSeedGrant,
                item.applyIncentive,
                item.approvedAmount || item.amount || 0,
                item.appraisalEligible,
                item.appraisalClaimant,
                item.sdgs,
                item.status,
                item.coAuthorsText || "N/A",
                item.appliedAt || "N/A"
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

    const handleConsolidatedDownload = async () => {
        let currentData = data;
        const allLoaded = TAB_CONFIG.every(t => loadedCategories[t.key]);
        if (!allLoaded) {
            toast.info("Preparing consolidated report export...");
            const fetched = await fetchCategoryData(activeTab, selectedYear, true);
            if (fetched) currentData = fetched;
        }

        let lines = [];

        const academicYearText =
            academicYears.find(y => y._id === selectedYear)?.year || "All Years";

        // MAIN TITLE
        lines.push(`"ADITYA UNIVERSITY"`);
        lines.push(`"RESEARCH INCENTIVE REPORT - ${academicYearText}"`);
        lines.push("");

        const q1Journals = (currentData.journals || []).filter(
            j => j.category === "Q1"
        );

        const q2Journals = (currentData.journals || []).filter(
            j => j.category === "Q2"
        );

        const scopusJournals = (currentData.journals || []).filter(
            j => j.category === "SCOPUS"
        );

        const addJournalSection = (title, journals) => {
            lines.push(`"${title}"`);

            lines.push([
                "S.No",
                "Emp ID",
                "Faculty Name",
                "College",
                "PAN Number",
                "Serving Department",
                "Is No DOI",
                "DOI",
                "Journal Name",
                "Paper Title",
                "Academic Year",
                "ISSN",
                "e-ISSN",
                "Is Scopus",
                "Is WoS",
                "Quartile",
                "WoS Journal Type",
                "Journal Category",
                "Vol",
                "Issue",
                "h-Index",
                "JCR Impact Factor",
                "Citations",
                "SDGs",
                "Corresponding Author",
                "Apply Incentive",
                "Approved Incentive Amount",
                "Appraisal Eligible",
                "Appraisal Claimant",
                "Status",
                "Co-Authors",
                "Applied At"
            ].join(","));

            journals.forEach((item, index) => {
                lines.push([
                    index + 1,
                    item.empId,
                    item.facultyName,
                    item.college,
                    item.panNo,
                    item.dept,
                    item.isNoDoi,
                    item.doi,
                    item.journalName,
                    item.paperTitle || "-",
                    item.year,
                    item.issn,
                    item.eissn,
                    item.isScopus,
                    item.isWos,
                    item.journalQuartile,
                    item.journalType,
                    item.journalCategory,
                    item.vol,
                    item.issue,
                    item.hIndex,
                    item.jcrImpactFactor,
                    item.citations,
                    item.sdgs,
                    item.correspondingAuthor,
                    item.applyIncentive,
                    item.approvedAmount,
                    item.appraisalEligible,
                    item.appraisalClaimant,
                    item.status,
                    item.coAuthorsText || "N/A",
                    item.appliedAt || "N/A"
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
            "College",
            "PAN Number",
            "Serving Department",
            "Book Title",
            "Publisher",
            "ISBN",
            "Academic Year",
            "Is Scopus",
            "No. of Pages",
            "Apply Incentive",
            "Approved Incentive Amount",
            "Appraisal Eligible",
            "Appraisal Claimant",
            "Incentive Claimant",
            "Status",
            "Co-Authors",
            "Applied At"
        ].join(","));

        (data.textbooks || []).forEach((item, index) => {
            lines.push([
                index + 1,
                item.empId,
                item.facultyName,
                item.college,
                item.panNo,
                item.dept,
                item.title,
                item.publisher,
                item.isbn,
                item.year,
                item.scopusIndexed || "No",
                item.numberOfPages || "N/A",
                item.applyIncentive || "No",
                item.approvedAmount || item.amount || "-",
                item.appraisalEligible || "N/A",
                item.appraisalClaimant || "N/A",
                item.incentiveClaimant || "N/A",
                item.status,
                item.coAuthorsText || "N/A",
                item.appliedAt || "N/A"
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
            "College",
            "PAN Number",
            "Serving Department",
            "Chapter Title",
            "Book Name",
            "Publisher",
            "Academic Year",
            "Month",
            "No. of Pages",
            "Apply Incentive",
            "Approved Incentive Amount",
            "Appraisal Eligible",
            "Appraisal Claimant",
            "Incentive Claimant",
            "Status",
            "Co-Authors",
            "Applied At"
        ].join(","));

        (data.chapters || []).forEach((item, index) => {
            lines.push([
                index + 1,
                item.empId,
                item.facultyName,
                item.college,
                item.panNo,
                item.dept,
                item.chapterTitle,
                item.bookName,
                item.publisher,
                item.year,
                item.month || "N/A",
                item.numberOfPages || "N/A",
                item.applyIncentive || "No",
                item.approvedAmount || item.amount || "-",
                item.appraisalEligible || "N/A",
                item.appraisalClaimant || "N/A",
                item.incentiveClaimant || "N/A",
                item.status,
                item.coAuthorsText || "N/A",
                item.appliedAt || "N/A"
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
            "College",
            "PAN Number",
            "Serving Department",
            "DOI",
            "Conference Name",
            "Paper Title",
            "Academic Year",
            "Month",
            "Year",
            "Location",
            "Conference Type",
            "Scopus Indexed",
            "ISSN/ISBN",
            "Publisher",
            "Students Involved",
            "Seed Grant Work",
            "Apply Incentive",
            "Approved Incentive Amount",
            "Appraisal Eligible",
            "Appraisal Claimant",
            "SDGs",
            "Status",
            "Co-Authors",
            "Applied At"
        ].join(","));

        (data.conferences || []).forEach((item, index) => {
            lines.push([
                index + 1,
                item.empId,
                item.facultyName,
                item.college,
                item.panNo,
                item.dept,
                item.doi,
                item.conferenceName,
                item.paperTitle || "-",
                item.academicYear || item.year,
                item.month,
                item.publishedYear || item.year,
                item.location,
                item.conferenceType,
                item.scopusIndexed,
                item.issnIsbn,
                item.publisher,
                item.isStudentsInvolved,
                item.applyingSeedGrant,
                item.applyIncentive,
                item.approvedAmount || item.amount || "-",
                item.appraisalEligible,
                item.appraisalClaimant,
                item.sdgs,
                item.status,
                item.coAuthorsText || "N/A",
                item.appliedAt || "N/A"
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
        const columns = [
            "S.No", "Emp Id", "Faculty Name", "College", "PAN No", "Dept",
            "Is No DOI", "DOI", "Journal Name", "Paper Title", "Academic Year",
            "ISSN", "e-ISSN", "Is Scopus", "Is WoS", "Quartile", "WoS Journal Type", "Journal Category",
            "Vol", "Issue", "h-Index", "JCR Impact Factor", "Citations", "SDGs",
            "Corresponding Author", "Apply Incentive", "Approved Incentive Amount",
            "Appraisal Eligible", "Appraisal Claimant", "Status", "Co-Authors", "Applied At"
        ];
        const rows = (data.journals || []).map((item, i) => [
            i + 1,
            item.empId,
            item.facultyName,
            item.college,
            item.panNo,
            item.dept,
            item.isNoDoi,
            item.doi,
            item.journalName,
            item.paperTitle,
            item.year,
            item.issn,
            item.eissn,
            item.isScopus,
            item.isWos,
            item.journalQuartile,
            item.journalType,
            item.journalCategory,
            item.vol,
            item.issue,
            item.hIndex,
            item.jcrImpactFactor,
            item.citations,
            item.sdgs,
            item.correspondingAuthor,
            item.applyIncentive,
            item.approvedAmount,
            item.appraisalEligible,
            item.appraisalClaimant,
            item.status,
            item.coAuthorsText || "N/A",
            item.appliedAt || "N/A"
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
        const columns = [
            "S.No", "Emp Id", "Faculty Name", "College", "PAN No", "Dept",
            "Book Title", "Publisher", "ISBN", "Academic Year", "Is Scopus",
            "No. of Pages", "Apply Incentive", "Approved Incentive Amount",
            "Appraisal Eligible", "Appraisal Claimant", "Incentive Claimant",
            "Status", "Co-Authors", "Applied At"
        ];
        const rows = (data.textbooks || []).map((item, i) => [
            i + 1,
            item.empId,
            item.facultyName,
            item.college,
            item.panNo,
            item.dept,
            item.title,
            item.publisher,
            item.isbn,
            item.year,
            item.scopusIndexed || "No",
            item.numberOfPages || "N/A",
            item.applyIncentive || "No",
            item.approvedAmount ? `₹${item.approvedAmount}` : (item.amount ? `₹${item.amount}` : "0"),
            item.appraisalEligible || "N/A",
            item.appraisalClaimant || "N/A",
            item.incentiveClaimant || "N/A",
            item.status,
            item.coAuthorsText || "N/A",
            item.appliedAt || "N/A"
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
        const columns = [
            "S.No", "Emp Id", "Faculty Name", "College", "PAN No", "Dept",
            "Chapter Title", "Book Name", "Publisher", "Academic Year",
            "No. of Pages", "Apply Incentive", "Approved Incentive Amount",
            "Appraisal Eligible", "Appraisal Claimant", "Incentive Claimant",
            "Status", "Co-Authors", "Applied At"
        ];
        const rows = (data.chapters || []).map((item, i) => [
            i + 1,
            item.empId,
            item.facultyName,
            item.college,
            item.panNo,
            item.dept,
            item.chapterTitle,
            item.bookName,
            item.publisher,
            item.year,
            item.numberOfPages || "N/A",
            item.applyIncentive || "No",
            item.approvedAmount ? `₹${item.approvedAmount}` : (item.amount ? `₹${item.amount}` : "0"),
            item.appraisalEligible || "N/A",
            item.appraisalClaimant || "N/A",
            item.incentiveClaimant || "N/A",
            item.status,
            item.coAuthorsText || "N/A",
            item.appliedAt || "N/A"
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
        const columns = [
            "S.No", "Emp Id", "Faculty Name", "College", "PAN No", "Dept",
            "DOI", "Conference Name", "Paper Title", "Academic Year", "Month", "Year",
            "Location", "Conference Type", "Scopus Indexed", "ISSN/ISBN", "Publisher",
            "Students Involved", "Seed Grant Work", "Apply Incentive", "Approved Incentive Amount",
            "Appraisal Eligible", "Appraisal Claimant", "SDGs", "Status", "Co-Authors", "Applied At"
        ];
        const rows = (data.conferences || []).map((item, i) => [
            i + 1,
            item.empId,
            item.facultyName,
            item.college,
            item.panNo,
            item.dept,
            item.doi,
            item.conferenceName,
            item.paperTitle,
            item.academicYear || item.year,
            item.month,
            item.publishedYear || item.year,
            item.location,
            item.conferenceType,
            item.scopusIndexed,
            item.issnIsbn,
            item.publisher,
            item.isStudentsInvolved,
            item.applyingSeedGrant,
            item.applyIncentive,
            item.approvedAmount ? `₹${item.approvedAmount}` : (item.amount ? `₹${item.amount}` : "0"),
            item.appraisalEligible,
            item.appraisalClaimant,
            item.sdgs,
            item.status,
            item.coAuthorsText || "N/A",
            item.appliedAt || "N/A"
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
                <Box sx={{ p: 2, borderBottom: "1px solid var(--border-color)", background: "var(--bg-glass)" }}>
                    <Box sx={{ display: "flex", flexDirection: { xs: "column", lg: "row" }, justifyContent: "space-between", alignItems: { xs: "stretch", lg: "center" }, gap: 2 }}>
                        {/* Scrollable Tabs */}
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Tabs
                                value={activeTab}
                                onChange={handleTabChange}
                                variant="scrollable"
                                scrollButtons="auto"
                                allowScrollButtonsMobile
                                sx={{
                                    minHeight: 44,
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
                                        fontSize: "0.9rem",
                                        minHeight: 44,
                                        py: 1,
                                        px: 2,
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
                                <Tab icon={<JournalIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Journals" />
                                <Tab icon={<BookIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Text Books" />
                                <Tab icon={<BookIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Book Chapters" />
                                <Tab icon={<BookIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Conferences" />
                                <Tab icon={<BookIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Patents" />
                                <Tab icon={<BookIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Novel Products" />
                                <Tab icon={<BookIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Funded Projects" />
                                <Tab icon={<BookIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Consultancy" />
                            </Tabs>
                        </Box>

                        {/* Filter Controls */}
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexShrink: 0, flexWrap: "nowrap" }}>
                            <Button
                                variant={startDate || endDate ? "contained" : "outlined"}
                                startIcon={<DateRangeIcon />}
                                onClick={handleOpenDatePopover}
                                sx={{
                                    height: 40,
                                    borderRadius: "10px",
                                    textTransform: "none",
                                    fontWeight: 700,
                                    fontSize: "0.875rem",
                                    whiteSpace: "nowrap",
                                    px: 2,
                                    borderColor: "var(--border-color)",
                                    bgcolor: startDate || endDate ? "var(--color-primary)" : "var(--bg-paper)",
                                    color: startDate || endDate ? "#fff" : "var(--text-primary)",
                                    boxShadow: "none",
                                    "&:hover": {
                                        bgcolor: startDate || endDate ? "var(--color-primary)" : "rgba(0,0,0,0.04)"
                                    }
                                }}
                            >
                                {getDateFilterLabel()}
                            </Button>

                            {(startDate || endDate) && (
                                <IconButton
                                    size="small"
                                    onClick={handleClearDateFilter}
                                    title="Clear date filter"
                                    sx={{
                                        height: 40,
                                        width: 40,
                                        borderRadius: "10px",
                                        border: "1px solid var(--border-color)",
                                        bgcolor: "var(--bg-paper)",
                                        color: "var(--text-secondary)",
                                        "&:hover": { color: "#d32f2f" }
                                    }}
                                >
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            )}

                            <FormControl size="small" sx={{ minWidth: 160 }}>
                                <InputLabel id="academic-year-label">Academic Year</InputLabel>
                                <Select
                                    labelId="academic-year-label"
                                    value={selectedYear}
                                    label="Academic Year"
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    sx={{ borderRadius: "10px", height: 40, background: "var(--bg-paper)" }}
                                >
                                    <MenuItem value="All">All Years</MenuItem>
                                    {academicYears.map(y => (
                                        <MenuItem key={y._id} value={y._id}>{y.year}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
                    </Box>
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

            {/* Date Range Popover */}
            <Popover
                open={Boolean(datePopoverAnchor)}
                anchorEl={datePopoverAnchor}
                onClose={handleCloseDatePopover}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                slotProps={{
                    paper: {
                        sx: {
                            p: 2.5,
                            width: 310,
                            borderRadius: "16px",
                            boxShadow: "var(--shadow-premium)",
                            border: "1px solid var(--border-color)",
                            background: "var(--bg-paper)",
                            mt: 1
                        }
                    }
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                        Filter by Date Range
                    </Typography>
                </Box>
                <Stack spacing={2}>
                    <FormControl size="small" fullWidth>
                        <InputLabel shrink sx={{ bgcolor: "var(--bg-paper)", px: 0.5, color: "var(--text-secondary)" }}>From Date</InputLabel>
                        <OutlinedInput
                            type="date"
                            notched
                            label="From Date"
                            value={tempStartDate}
                            onChange={(e) => setTempStartDate(e.target.value)}
                            inputProps={{ max: new Date().toISOString().split('T')[0] }}
                            sx={{ borderRadius: "10px" }}
                        />
                    </FormControl>
                    <FormControl size="small" fullWidth>
                        <InputLabel shrink sx={{ bgcolor: "var(--bg-paper)", px: 0.5, color: "var(--text-secondary)" }}>To Date</InputLabel>
                        <OutlinedInput
                            type="date"
                            notched
                            label="To Date"
                            value={tempEndDate}
                            onChange={(e) => setTempEndDate(e.target.value)}
                            inputProps={{
                                min: tempStartDate || undefined,
                                max: new Date().toISOString().split('T')[0]
                            }}
                            sx={{ borderRadius: "10px" }}
                        />
                    </FormControl>
                    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, pt: 1 }}>
                        <Button
                            size="small"
                            onClick={handleClearDateFilter}
                            sx={{ textTransform: "none", color: "var(--text-secondary)", fontWeight: 700 }}
                        >
                            Reset
                        </Button>
                        <Button
                            size="small"
                            variant="contained"
                            onClick={handleApplyDateFilter}
                            sx={{
                                textTransform: "none",
                                fontWeight: 700,
                                borderRadius: "10px",
                                background: "var(--gradient-primary)",
                                color: "#fff"
                            }}
                        >
                            Apply Filter
                        </Button>
                    </Box>
                </Stack>
            </Popover>
        </PageContainer>
    );
}
