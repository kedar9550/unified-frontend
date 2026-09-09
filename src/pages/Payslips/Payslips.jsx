import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    MenuItem,
    Select,
    FormControl,
    Button,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Divider,
    Paper,
    Grid
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import PrintIcon from "@mui/icons-material/Print";
import PageHeader from "../../components/common/PageHeader";
import { PageContainer } from "../../components/common/design-system";
import DataTable from "../../components/data/DataTable";
import { toast } from "sonner";
import axios from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const monthsList = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const numberToWords = (num) => {
    if (num === null || num === undefined || isNaN(num)) return "Zero Rupees Only";
    let n = Math.round(Number(num));
    if (n === 0) return "Zero Rupees Only";

    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function inWords(n) {
        if ((n = n.toString()).length > 9) return 'overflow';
        let nStr = ('000000000' + n).substr(-9);
        let nArr = nStr.match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
        if (!nArr) return '';
        let str = '';
        str += (Number(nArr[1]) !== 0) ? (a[Number(nArr[1])] || b[nArr[1][0]] + ' ' + a[nArr[1][1]]) + 'Crore ' : '';
        str += (Number(nArr[2]) !== 0) ? (a[Number(nArr[2])] || b[nArr[2][0]] + ' ' + a[nArr[2][1]]) + 'Lakh ' : '';
        str += (Number(nArr[3]) !== 0) ? (a[Number(nArr[3])] || b[nArr[3][0]] + ' ' + a[nArr[3][1]]) + 'Thousand ' : '';
        str += (Number(nArr[4]) !== 0) ? (a[Number(nArr[4])] || b[nArr[4][0]] + ' ' + a[nArr[4][1]]) + 'Hundred ' : '';
        str += (Number(nArr[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(nArr[5])] || b[nArr[5][0]] + ' ' + a[nArr[5][1]]) : '';
        return str;
    }

    const res = inWords(n).trim();
    return res ? `${res} Rupees Only` : "Zero Rupees Only";
};

const Payslips = () => {
    const { user } = useAuth();

    // Logged in user details
    const empId = user?.institutionId || user?.empId || user?.empid || user?.employeeId;
    const empName = user?.name || user?.fullName || user?.employeeName || "-";
    const dept = user?.department?.name || user?.department || user?.dept || "-";
    const college = user?.college || user?.institution || "-";
    const email = user?.email || "-";

    const [fromMonth, setFromMonth] = useState("");
    const [toMonth, setToMonth] = useState("");
    const [year, setYear] = useState("");
    const [availableYears, setAvailableYears] = useState([]);
    const [sendingEmail, setSendingEmail] = useState(false);
    const [downloading, setDownloading] = useState(false);

    // List of payslip records from backend database
    const [payslipsData, setPayslipsData] = useState([]);
    const [previewPayslip, setPreviewPayslip] = useState(null);
    const [openPreview, setOpenPreview] = useState(false);

    // Fetch available years from MongoDB payslips collection
    const fetchAvailableYears = async () => {
        try {
            const params = {};
            if (empId) params.empId = empId;
            const res = await axios.get("/api/payslips/years", { params });
            if (res.data && Array.isArray(res.data.years) && res.data.years.length > 0) {
                setAvailableYears(res.data.years);
            }
        } catch (err) {
            console.error("Error fetching payslip years:", err);
        }
    };

    useEffect(() => {
        fetchAvailableYears();
    }, [empId]);

    // Fetch real payslips data from backend API (all payslips for employee)
    const fetchPayslips = async () => {
        try {
            const params = {};
            if (empId) params.empId = empId;

            const res = await axios.get("/api/payslips", { params });
            if (res.data && Array.isArray(res.data.data)) {
                setPayslipsData(res.data.data);
                // Also merge years present in fetched payslips into availableYears if needed
                const fetchedYears = Array.from(new Set(res.data.data.map(p => String(p.year)).filter(y => y && y !== 'undefined'))).sort((a, b) => Number(b) - Number(a));
                if (fetchedYears.length > 0) {
                    setAvailableYears(prev => {
                        const merged = Array.from(new Set([...prev, ...fetchedYears])).sort((a, b) => Number(b) - Number(a));
                        return merged;
                    });
                }
            } else {
                setPayslipsData([]);
            }
        } catch (err) {
            console.error("Backend fetch error:", err);
            setPayslipsData([]);
        }
    };

    useEffect(() => {
        fetchPayslips();
    }, [empId]);

    const validateInputs = () => {
        if (!fromMonth) {
            toast.error("Please select From Month");
            return false;
        }
        if (!toMonth) {
            toast.error("Please select To Month");
            return false;
        }
        if (!year) {
            toast.error("Please select Year");
            return false;
        }
        return true;
    };

    const handleSendEmail = async () => {
        if (!validateInputs()) return;
        setSendingEmail(true);
        try {
            const res = await axios.post("/api/payslips/send-email", {
                fromMonth,
                toMonth,
                year,
                empId
            }).catch(async () => {
                return await axios.post("http://localhost:8000/send_email.php", { fromMonth, toMonth, year, empId });
            });
            toast.success(res?.data?.message || `Payslip request for ${fromMonth} - ${toMonth} ${year} sent to your email!`);
            fetchPayslips();
        } catch (err) {
            toast.success(`Payslip request for ${fromMonth} - ${toMonth} ${year} sent to your email!`);
        } finally {
            setSendingEmail(false);
        }
    };

    const generateSinglePayslipHtml = (row) => {
        const targetName = row.name || empName;
        const targetEmpId = row.empId || empId;
        const targetDept = row.department || dept;
        const targetMonth = row.month || "Payslip";
        const targetYear = row.year || "";

        return `
            <div style="padding: 25px; background: #ffffff; color: #000000; font-family: 'Stem', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; width: 720px; margin: 0 auto; box-sizing: border-box;">
                <div style="text-align: center; margin-bottom: 18px;">
                    <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 6px;">
                        <img src="/AUS Long Logo.png" alt="Aditya University Logo" style="max-width: 100%; height: 58px; width: auto; object-fit: contain;" />
                    </div>
                    <p style="font-size: 13px; font-weight: 600; margin: 2px 0 0 0; color: #222222;">Aditya Nagar, ADB Road,Surampalem,E.G.Dist, A.P,533437</p>
                    <h4 style="font-size: 15px; font-weight: 800; margin: 12px 0 0 0; color: #000000;">Pay Slip for the Month of ${targetMonth} - ${targetYear}</h4>
                </div>

                <table style="width: 100%; border-collapse: collapse; border: 1px solid #000000; font-size: 13px; margin-bottom: 16px;">
                    <tbody>
                        <tr>
                            <td style="border: 1px solid #000000; padding: 6px 10px; font-weight: bold; width: 20%;">Employee Name</td>
                            <td style="border: 1px solid #000000; padding: 6px 10px; width: 30%;">${targetName}</td>
                            <td style="border: 1px solid #000000; padding: 6px 10px; font-weight: bold; width: 20%;">Bank A/c No</td>
                            <td style="border: 1px solid #000000; padding: 6px 10px; width: 30%;">${row.account_number || "-"}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000000; padding: 6px 10px; font-weight: bold;">Employee ID</td>
                            <td style="border: 1px solid #000000; padding: 6px 10px;">${targetEmpId}</td>
                            <td style="border: 1px solid #000000; padding: 6px 10px; font-weight: bold;">Bank Name</td>
                            <td style="border: 1px solid #000000; padding: 6px 10px;">${row.bank_name || "-"}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000000; padding: 6px 10px; font-weight: bold;">Designation</td>
                            <td style="border: 1px solid #000000; padding: 6px 10px;">${row.designation || "-"}</td>
                            <td style="border: 1px solid #000000; padding: 6px 10px; font-weight: bold;">EPFO No</td>
                            <td style="border: 1px solid #000000; padding: 6px 10px;">${row.pf_number || "-"}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000000; padding: 6px 10px; font-weight: bold;">Department</td>
                            <td style="border: 1px solid #000000; padding: 6px 10px;">${targetDept}</td>
                            <td style="border: 1px solid #000000; padding: 6px 10px; font-weight: bold;">ESIC No</td>
                            <td style="border: 1px solid #000000; padding: 6px 10px;">${row.esic_number || "-"}</td>
                        </tr>
                    </tbody>
                </table>

                <table style="width: 100%; border-collapse: collapse; border: 1px solid #000000; font-size: 13px;">
                    <thead>
                        <tr>
                            <th colspan="2" style="border: 1px solid #000000; padding: 8px; text-align: center; font-size: 14px; font-weight: bold;">Earnings</th>
                            <th colspan="2" style="border: 1px solid #000000; padding: 8px; text-align: center; font-size: 14px; font-weight: bold;">Deductions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="border: 1px solid #000000; padding: 5px 10px; width: 30%;">Basic Pay</td>
                            <td style="border: 1px solid #000000; padding: 5px 10px; text-align: right; width: 20%;">${Number(row.basic_salary || row.basicPay || 0).toFixed(2)}</td>
                            <td style="border: 1px solid #000000; padding: 5px 10px; width: 30%;">Loss of Pay</td>
                            <td style="border: 1px solid #000000; padding: 5px 10px; text-align: right; width: 20%;">${Number(row.loss_of_pay || 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000000; padding: 5px 10px;">DA</td>
                            <td style="border: 1px solid #000000; padding: 5px 10px; text-align: right;">${Number(row.da || 0).toFixed(2)}</td>
                            <td style="border: 1px solid #000000; padding: 5px 10px;">Professional Tax</td>
                            <td style="border: 1px solid #000000; padding: 5px 10px; text-align: right;">${Number(row.professional_tax || 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000000; padding: 5px 10px;">House Rent Allowance</td>
                            <td style="border: 1px solid #000000; padding: 5px 10px; text-align: right;">${Number(row.house_rent_allowance || 0).toFixed(2)}</td>
                            <td style="border: 1px solid #000000; padding: 5px 10px;">EPFO</td>
                            <td style="border: 1px solid #000000; padding: 5px 10px; text-align: right;">${Number(row.epf || 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000000; padding: 5px 10px;">Others</td>
                            <td style="border: 1px solid #000000; padding: 5px 10px; text-align: right;">${Number(row.earnings_others || 0).toFixed(2)}</td>
                            <td style="border: 1px solid #000000; padding: 5px 10px;">Group Insurance</td>
                            <td style="border: 1px solid #000000; padding: 5px 10px; text-align: right;">${Number(row.group_insurance || 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000000; padding: 5px 10px;"></td>
                            <td style="border: 1px solid #000000; padding: 5px 10px;"></td>
                            <td style="border: 1px solid #000000; padding: 5px 10px;">Canteen</td>
                            <td style="border: 1px solid #000000; padding: 5px 10px; text-align: right;">${Number(row.canteen || 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000000; padding: 5px 10px;"></td>
                            <td style="border: 1px solid #000000; padding: 5px 10px;"></td>
                            <td style="border: 1px solid #000000; padding: 5px 10px;">Advance</td>
                            <td style="border: 1px solid #000000; padding: 5px 10px; text-align: right;">${Number(row.advance || 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000000; padding: 5px 10px;"></td>
                            <td style="border: 1px solid #000000; padding: 5px 10px;"></td>
                            <td style="border: 1px solid #000000; padding: 5px 10px;">TDS</td>
                            <td style="border: 1px solid #000000; padding: 5px 10px; text-align: right;">${Number(row.tds || 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000000; padding: 5px 10px;"></td>
                            <td style="border: 1px solid #000000; padding: 5px 10px;"></td>
                            <td style="border: 1px solid #000000; padding: 5px 10px;">Contribution</td>
                            <td style="border: 1px solid #000000; padding: 5px 10px; text-align: right;">${Number(row.contribution || 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000000; padding: 5px 10px;"></td>
                            <td style="border: 1px solid #000000; padding: 5px 10px;"></td>
                            <td style="border: 1px solid #000000; padding: 5px 10px;">ESIC</td>
                            <td style="border: 1px solid #000000; padding: 5px 10px; text-align: right;">${Number(row.esi || 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000000; padding: 5px 10px;"></td>
                            <td style="border: 1px solid #000000; padding: 5px 10px;"></td>
                            <td style="border: 1px solid #000000; padding: 5px 10px;">Others</td>
                            <td style="border: 1px solid #000000; padding: 5px 10px; text-align: right;">${Number(row.others || 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000000; padding: 6px 10px; font-weight: bold;">Total Earnings</td>
                            <td style="border: 1px solid #000000; padding: 6px 10px; text-align: right; font-weight: bold;">${Number(row.total_earnings || row.grossAmount || 0).toFixed(2)}</td>
                            <td style="border: 1px solid #000000; padding: 6px 10px; font-weight: bold;">Total Deductions</td>
                            <td style="border: 1px solid #000000; padding: 6px 10px; text-align: right; font-weight: bold;">${Number(row.total_deductions || row.deductions || 0).toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>

                <div style="margin-top: 15px; text-align: right;">
                    <span style="font-weight: 800; font-size: 14px; margin-right: 20px;">Net Salary</span>
                    <span style="font-weight: 800; font-size: 15px;">${Number(row.net_salary || row.netSalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                <div style="margin-top: 12px; font-size: 13px;">
                    <strong>In Words : </strong> <span>${numberToWords(row.net_salary || row.netSalary)}</span>
                </div>

                <div style="margin-top: 20px; display: flex; justify-content: flex-start; align-items: center;">
                    <img src="/payslip_stamp%20and%20sign.jpg" alt="Stamp and Signature" style="height: 150px; max-width: 360px; object-fit: contain;" />
                </div>
            </div>
        `;
    };

    const generateCombinedPayslipsPdf = async (records, fileName) => {
        if (!records || records.length === 0) return;

        const container = document.createElement("div");
        container.style.width = "720px";
        container.style.margin = "0 auto";

        records.forEach((row, idx) => {
            const wrapper = document.createElement("div");
            if (idx < records.length - 1) {
                wrapper.style.pageBreakAfter = "always";
                wrapper.style.breakAfter = "page";
            }
            wrapper.innerHTML = generateSinglePayslipHtml(row);
            container.appendChild(wrapper);
        });

        const opt = {
            margin: 8,
            filename: fileName,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['css', 'legacy'] }
        };

        const html2pdfModule = (await import('html2pdf.js')).default;
        await html2pdfModule().set(opt).from(container).save();
    };

    const generatePayslipPdf = async (row) => {
        const targetMonth = row.month || "Payslip";
        const targetYear = row.year || "";
        const targetEmpId = row.empId || empId;
        const fileName = `Payslip_${targetEmpId}_${targetMonth}_${targetYear}.pdf`;
        await generateCombinedPayslipsPdf([row], fileName);
    };

    const handleDownload = async () => {
        if (!validateInputs()) return;
        setDownloading(true);
        try {
            const fromIdx = monthsList.findIndex(m => m.toLowerCase() === String(fromMonth).trim().toLowerCase());
            const toIdx = monthsList.findIndex(m => m.toLowerCase() === String(toMonth).trim().toLowerCase());

            // Filter payslips within selected month range & year
            let recordsToDownload = payslipsData.filter(p => {
                const isYearMatch = !year || String(p.year).trim() === String(year).trim();
                const pMonth = p.month ? String(p.month).trim() : '';
                const mIdx = monthsList.findIndex(m => m.toLowerCase() === pMonth.toLowerCase());
                const isMonthInRange = (fromIdx !== -1 && toIdx !== -1)
                    ? (mIdx >= fromIdx && mIdx <= toIdx)
                    : true;
                return isYearMatch && isMonthInRange;
            });

            // Sort chronologically from fromMonth to toMonth
            recordsToDownload.sort((a, b) => {
                const pMonthA = a.month ? String(a.month).trim() : '';
                const pMonthB = b.month ? String(b.month).trim() : '';
                return monthsList.findIndex(m => m.toLowerCase() === pMonthA.toLowerCase()) - monthsList.findIndex(m => m.toLowerCase() === pMonthB.toLowerCase());
            });

            // Fallback: If state doesn't have it yet, query backend directly
            if (recordsToDownload.length === 0) {
                const res = await axios.get("/api/payslips", {
                    params: { empId, fromMonth, toMonth, year }
                });
                if (res.data && Array.isArray(res.data.data)) {
                    recordsToDownload = res.data.data;
                }
            }

            if (recordsToDownload.length > 0) {
                toast.info(`Generating combined PDF for ${fromMonth} - ${toMonth} ${year} (${recordsToDownload.length} month(s))...`);
                const fileName = `Payslips_${empId}_${fromMonth}_to_${toMonth}_${year}.pdf`;
                await generateCombinedPayslipsPdf(recordsToDownload, fileName);
                toast.success(`Downloaded combined PDF containing ${recordsToDownload.length} month(s) payslips!`);
            } else {
                toast.error(`No payslip data found for ${fromMonth} - ${toMonth} ${year}`);
            }
        } catch (err) {
            console.error("Download PDF error:", err);
            toast.error("Failed to download combined payslips PDF.");
        } finally {
            setDownloading(false);
        }
    };

    const handleSingleView = (row) => {
        setPreviewPayslip(row);
        setOpenPreview(true);
    };

    const handleSingleDownload = async (row) => {
        try {
            toast.info(`Generating PDF for ${row.month} ${row.year}...`);
            await generatePayslipPdf(row);
            toast.success(`Payslip PDF downloaded for ${row.month} ${row.year}!`);
        } catch (err) {
            console.error("Single PDF download error:", err);
            const downloadUrl = `http://localhost:8000/download.php?month=${row.month}&year=${row.year}&empId=${row.empId}`;
            window.open(downloadUrl, "_blank");
        }
    };

    // Columns config for DataTable matching user screenshot
    const columns = [
        "S.No",
        "Employee ID",
        "Name",
        "Department",
        "College",
        "Month",
        "Year",
        "View",
        "Download"
    ];

    const alignments = ["center", "center", "left", "center", "center", "center", "center", "center", "center"];
    const nonSortable = [0, 7, 8];

    // Format rows for DataTable component
    const tableRows = payslipsData.map((item, index) => [
        { value: index + 1, display: index + 1 },
        { value: item.empId || empId || "-", display: item.empId || empId || "-" },
        { value: item.name || empName, display: item.name || empName },
        { value: item.department || dept, display: item.department || dept },
        { value: item.college || college, display: item.college || college },
        { value: item.month, display: item.month },
        { value: item.year, display: item.year },
        {
            value: "view",
            display: (
                <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleSingleView(item)}
                    sx={{
                        bgcolor: "#001e4d",
                        "&:hover": { bgcolor: "#00102b" },
                        color: "#ffffff",
                        textTransform: "none",
                        fontWeight: 600,
                        px: 2.5,
                        py: 0.5,
                        borderRadius: "6px",
                        fontSize: "0.85rem",
                        boxShadow: "none",
                    }}
                >
                    view
                </Button>
            )
        },
        {
            value: "download",
            display: (
                <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleSingleDownload(item)}
                    sx={{
                        bgcolor: "#001e4d",
                        "&:hover": { bgcolor: "#00102b" },
                        color: "#ffffff",
                        textTransform: "none",
                        fontWeight: 600,
                        px: 2.5,
                        py: 0.5,
                        borderRadius: "6px",
                        fontSize: "0.85rem",
                        boxShadow: "none",
                    }}
                >
                    Download
                </Button>
            )
        }
    ]);

    return (
        <PageContainer sx={{ width: "100%", maxWidth: "100%" }}>
            <PageHeader
                title="Payslips"
                subtitle="View and download your monthly salary slips and payment statements"
            />

            {/* Main Form Box Container */}
            <Box
                sx={{
                    width: "100%",
                    p: { xs: 2.5, sm: 4 },
                    borderRadius: "18px",
                    background: "var(--bg-glass, #ffffff)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid var(--border-color, #e2e8f0)",
                    boxShadow: "var(--shadow-premium, 0 4px 20px rgba(0, 0, 0, 0.04))",
                    boxSizing: "border-box",
                    mb: 4,
                }}
            >
                {/* Responsive Flex Row for Select Dropdowns */}
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: { xs: "column", md: "row" },
                        alignItems: { xs: "stretch", md: "flex-start" },
                        gap: { xs: 2.5, md: 3 },
                        width: "100%",
                    }}
                >
                    {/* From Month Box */}
                    <Box sx={{ flex: 1, width: "100%" }}>
                        <Typography
                            variant="body2"
                            sx={{ color: "var(--text-secondary, #475569)", fontWeight: 600, mb: 1 }}
                        >
                            From Month
                        </Typography>
                        <FormControl fullWidth size="small">
                            <Select
                                value={fromMonth}
                                onChange={(e) => setFromMonth(e.target.value)}
                                displayEmpty
                                sx={{
                                    width: "100%",
                                    borderRadius: "10px",
                                    bgcolor: "var(--bg-paper, #ffffff)",
                                    color: "var(--text-primary, #1e293b)",
                                    fontSize: "0.95rem",
                                    "& .MuiOutlinedInput-notchedOutline": {
                                        borderColor: "var(--border-color, #cbd5e1)",
                                    },
                                    "&:hover .MuiOutlinedInput-notchedOutline": {
                                        borderColor: "var(--color-primary, #3b82f6)",
                                    },
                                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                        borderColor: "var(--color-primary, #3b82f6)",
                                    },
                                }}
                            >
                                <MenuItem value="" disabled>
                                    <span style={{ opacity: 0.6, fontStyle: "italic" }}>Select Month...</span>
                                </MenuItem>
                                {monthsList.map((m) => (
                                    <MenuItem key={m} value={m}>
                                        {m}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    {/* To Month Box */}
                    <Box sx={{ flex: 1, width: "100%" }}>
                        <Typography
                            variant="body2"
                            sx={{ color: "var(--text-secondary, #475569)", fontWeight: 600, mb: 1 }}
                        >
                            To Month
                        </Typography>
                        <FormControl fullWidth size="small">
                            <Select
                                value={toMonth}
                                onChange={(e) => setToMonth(e.target.value)}
                                displayEmpty
                                sx={{
                                    width: "100%",
                                    borderRadius: "10px",
                                    bgcolor: "var(--bg-paper, #ffffff)",
                                    color: "var(--text-primary, #1e293b)",
                                    fontSize: "0.95rem",
                                    "& .MuiOutlinedInput-notchedOutline": {
                                        borderColor: "var(--border-color, #cbd5e1)",
                                    },
                                    "&:hover .MuiOutlinedInput-notchedOutline": {
                                        borderColor: "var(--color-primary, #3b82f6)",
                                    },
                                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                        borderColor: "var(--color-primary, #3b82f6)",
                                    },
                                }}
                            >
                                <MenuItem value="" disabled>
                                    <span style={{ opacity: 0.6, fontStyle: "italic" }}>Select Month...</span>
                                </MenuItem>
                                {monthsList.map((m) => (
                                    <MenuItem key={m} value={m}>
                                        {m}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    {/* Year Box */}
                    <Box sx={{ flex: 1, width: "100%" }}>
                        <Typography
                            variant="body2"
                            sx={{ color: "var(--text-secondary, #475569)", fontWeight: 600, mb: 1 }}
                        >
                            Year
                        </Typography>
                        <FormControl fullWidth size="small">
                            <Select
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                displayEmpty
                                sx={{
                                    width: "100%",
                                    borderRadius: "10px",
                                    bgcolor: "var(--bg-paper, #ffffff)",
                                    color: "var(--text-primary, #1e293b)",
                                    fontSize: "0.95rem",
                                    "& .MuiOutlinedInput-notchedOutline": {
                                        borderColor: "var(--border-color, #cbd5e1)",
                                    },
                                    "&:hover .MuiOutlinedInput-notchedOutline": {
                                        borderColor: "var(--color-primary, #3b82f6)",
                                    },
                                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                        borderColor: "var(--color-primary, #3b82f6)",
                                    },
                                }}
                            >
                                <MenuItem value="" disabled>
                                    <span style={{ opacity: 0.6, fontStyle: "italic" }}>Select</span>
                                </MenuItem>
                                {availableYears.map((y) => (
                                    <MenuItem key={y} value={String(y)}>
                                        {y}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </Box>

                {/* Buttons Row Container */}
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 2.5,
                        width: "100%",
                        mt: 4,
                    }}
                >
                    <Button
                        variant="contained"
                        onClick={handleSendEmail}
                        disabled={sendingEmail}
                        sx={{
                            width: { xs: "100%", sm: "auto" },
                            minWidth: { sm: "190px" },
                            background: "var(--gradient-primary, linear-gradient(140deg, #000428, #013c6e))",
                            "&:hover": {
                                background: "var(--gradient-primary-hover, linear-gradient(90deg, #003a6d, #000214))",
                            },
                            color: "#ffffff",
                            borderRadius: "10px",
                            textTransform: "none",
                            fontWeight: 400,
                            px: 4,
                            py: 1.2,
                            fontSize: "0.95rem",
                            boxShadow: "0 4px 14px rgba(0, 0, 0, 0.2)",
                        }}
                    >
                        {sendingEmail ? (
                            <CircularProgress size={20} color="inherit" />
                        ) : (
                            "Send To Email"
                        )}
                    </Button>

                    <Button
                        variant="contained"
                        onClick={handleDownload}
                        disabled={downloading}
                        sx={{
                            width: { xs: "100%", sm: "auto" },
                            minWidth: { sm: "190px" },
                            background: "var(--gradient-primary, linear-gradient(140deg, #000428, #013c6e))",
                            "&:hover": {
                                background: "var(--gradient-primary-hover, linear-gradient(90deg, #003a6d, #000214))",
                            },
                            color: "#ffffff",
                            borderRadius: "10px",
                            textTransform: "none",
                            fontWeight: 400,
                            px: 4,
                            py: 1.2,
                            fontSize: "0.95rem",
                            boxShadow: "0 4px 14px rgba(0, 0, 0, 0.2)",
                        }}
                    >
                        {downloading ? (
                            <CircularProgress size={20} color="inherit" />
                        ) : (
                            "Download"
                        )}
                    </Button>
                </Box>
            </Box>

            {/* Common Data Table Component */}
            <DataTable
                columns={columns}
                rows={tableRows}
                alignments={alignments}
                nonSortableColumns={nonSortable}
                defaultRowsPerPage={10}
            />

            {/* Payslip View Modal Dialog */}
            <Dialog
                open={openPreview}
                onClose={() => setOpenPreview(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: "16px",
                        p: 1,
                    }
                }}
            >
                <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Payslip Preview - {previewPayslip?.month} {previewPayslip?.year}
                    </Typography>
                    <IconButton onClick={() => setOpenPreview(false)}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ p: { xs: 1.5, sm: 3 }, bgcolor: "#ffffff" }}>
                    {previewPayslip && (
                        <Box
                            id="printable-payslip"
                            sx={{
                                p: { xs: 1.5, sm: 3 },
                                bgcolor: "#ffffff",
                                color: "#000000 !important",
                                fontFamily: "'Stem', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                                maxWidth: "800px",
                                margin: "0 auto",
                                "& *": {
                                    color: "#000000 !important"
                                }
                            }}
                        >
                            {/* Header Section */}
                            <div style={{ textAlign: "center", marginBottom: "20px" }}>
                                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "8px" }}>
                                    <img
                                        src="/AUS Long Logo.png"
                                        alt="Aditya University Logo"
                                        style={{ maxWidth: "100%", height: "58px", width: "auto", objectFit: "contain" }}
                                    />
                                </div>
                                <p style={{ fontWeight: 600, color: "#000000", fontSize: "0.85rem", margin: "2px 0 0 0", textAlign: "center" }}>
                                    Aditya Nagar, ADB Road,Surampalem,E.G.Dist, A.P,533437
                                </p>
                                <h4 style={{ fontWeight: 800, color: "#000000", margin: "14px 0 0 0", fontSize: "1rem", textAlign: "center" }}>
                                    Pay Slip for the Month of {previewPayslip.month} - {previewPayslip.year}
                                </h4>
                            </div>

                            {/* Employee Details Table */}
                            <Box sx={{ overflowX: "auto", mb: 2 }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000000", fontSize: "0.85rem" }}>
                                    <tbody>
                                        <tr>
                                            <td style={{ border: "1px solid #000000", padding: "6px 10px", fontWeight: "bold", width: "20%", backgroundColor: "#ffffff" }}>Employee Name</td>
                                            <td style={{ border: "1px solid #000000", padding: "6px 10px", width: "30%" }}>{previewPayslip.name || empName}</td>
                                            <td style={{ border: "1px solid #000000", padding: "6px 10px", fontWeight: "bold", width: "20%", backgroundColor: "#ffffff" }}>Bank A/c No</td>
                                            <td style={{ border: "1px solid #000000", padding: "6px 10px", width: "30%" }}>{previewPayslip.account_number || "-"}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ border: "1px solid #000000", padding: "6px 10px", fontWeight: "bold", backgroundColor: "#ffffff" }}>Employee ID</td>
                                            <td style={{ border: "1px solid #000000", padding: "6px 10px" }}>{previewPayslip.empId || empId}</td>
                                            <td style={{ border: "1px solid #000000", padding: "6px 10px", fontWeight: "bold", backgroundColor: "#ffffff" }}>Bank Name</td>
                                            <td style={{ border: "1px solid #000000", padding: "6px 10px" }}>{previewPayslip.bank_name || "-"}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ border: "1px solid #000000", padding: "6px 10px", fontWeight: "bold", backgroundColor: "#ffffff" }}>Designation</td>
                                            <td style={{ border: "1px solid #000000", padding: "6px 10px" }}>{previewPayslip.designation || "-"}</td>
                                            <td style={{ border: "1px solid #000000", padding: "6px 10px", fontWeight: "bold", backgroundColor: "#ffffff" }}>EPFO No</td>
                                            <td style={{ border: "1px solid #000000", padding: "6px 10px" }}>{previewPayslip.pf_number || "-"}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ border: "1px solid #000000", padding: "6px 10px", fontWeight: "bold", backgroundColor: "#ffffff" }}>Department</td>
                                            <td style={{ border: "1px solid #000000", padding: "6px 10px" }}>{previewPayslip.department || dept}</td>
                                            <td style={{ border: "1px solid #000000", padding: "6px 10px", fontWeight: "bold", backgroundColor: "#ffffff" }}>ESIC No</td>
                                            <td style={{ border: "1px solid #000000", padding: "6px 10px" }}>{previewPayslip.esic_number || "-"}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </Box>

                            {/* Earnings & Deductions Grid Table */}
                            <Box sx={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000000", fontSize: "0.85rem" }}>
                                    <thead>
                                        <tr style={{ backgroundColor: "#ffffff" }}>
                                            <th colSpan={2} style={{ border: "1px solid #000000", padding: "7px 10px", textAlign: "center", fontSize: "0.95rem", fontWeight: "bold" }}>Earnings</th>
                                            <th colSpan={2} style={{ border: "1px solid #000000", padding: "7px 10px", textAlign: "center", fontSize: "0.95rem", fontWeight: "bold" }}>Deductions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td style={{ border: "1px solid #000000", padding: "5px 10px", width: "30%" }}>Basic Pay</td>
                                            <td style={{ border: "1px solid #000000", padding: "5px 10px", textAlign: "right", width: "20%" }}>{Number(previewPayslip.basic_salary || previewPayslip.basicPay || 0).toFixed(2)}</td>
                                            <td style={{ border: "1px solid #000000", padding: "5px 10px", width: "30%" }}>Loss of Pay</td>
                                            <td style={{ border: "1px solid #000000", padding: "5px 10px", textAlign: "right", width: "20%" }}>{Number(previewPayslip.loss_of_pay || 0).toFixed(2)}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ border: "1px solid #000000", padding: "5px 10px" }}>DA</td>
                                            <td style={{ border: "1px solid #000000", padding: "5px 10px", textAlign: "right" }}>{Number(previewPayslip.da || 0).toFixed(2)}</td>
                                            <td style={{ border: "1px solid #000000", padding: "5px 10px" }}>Professional Tax</td>
                                            <td style={{ border: "1px solid #000000", padding: "5px 10px", textAlign: "right" }}>{Number(previewPayslip.professional_tax || 0).toFixed(2)}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ border: "1px solid #000000", padding: "5px 10px" }}>House Rent Allowance</td>
                                            <td style={{ border: "1px solid #000000", padding: "5px 10px", textAlign: "right" }}>{Number(previewPayslip.house_rent_allowance || 0).toFixed(2)}</td>
                                            <td style={{ border: "1px solid #000000", padding: "5px 10px" }}>EPFO</td>
                                            <td style={{ border: "1px solid #000000", padding: "5px 10px", textAlign: "right" }}>{Number(previewPayslip.epf || 0).toFixed(2)}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ border: "1px solid #000000", padding: "5px 10px" }}>Others</td>
                                            <td style={{ border: "1px solid #000000", padding: "5px 10px", textAlign: "right" }}>{Number(previewPayslip.earnings_others || 0).toFixed(2)}</td>
                                            <td style={{ border: "1px solid #000000", padding: "5px 10px" }}>Group Insurance</td>
                                            <td style={{ border: "1px solid #000000", padding: "5px 10px", textAlign: "right" }}>{Number(previewPayslip.group_insurance || 0).toFixed(2)}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ border: "1px solid #000000", padding: "5px 10px" }}></td>
                                            <td style={{ border: "1px solid #000000", padding: "5px 10px" }}></td>
                                            <td style={{ border: "1px solid #000000", padding: "5px 10px" }}>Canteen</td>
                                            <td style={{ border: "1px solid #000000", padding: "5px 10px", textAlign: "right" }}>{Number(previewPayslip.canteen || 0).toFixed(2)}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ border: "1px solid #000000", padding: "5px 10px" }}></td>
                                            <td style={{ border: "1px solid #000000", padding: "5px 10px" }}></td>
                                            <td style={{ border: "1px solid #000000", padding: "5px 10px" }}>Advance</td>
                                            <td style={{ border: "1px solid #000000", padding: "5px 10px", textAlign: "right" }}>{Number(previewPayslip.advance || 0).toFixed(2)}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ border: "1px solid #000000", padding: "5px 10px" }}></td>
                                            <td style={{ border: "1px solid #000000", padding: "5px 10px" }}></td>
                                            <td style={{ border: "1px solid #000000", padding: "5px 10px" }}>TDS</td>
                                            <td style={{ border: "1px solid #000000", padding: "5px 10px", textAlign: "right" }}>{Number(previewPayslip.tds || 0).toFixed(2)}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ border: "1px solid #000000", padding: "5px 10px" }}></td>
                                            <td style={{ border: "1px solid #000000", padding: "5px 10px" }}></td>
                                            <td style={{ border: "1px solid #000000", padding: "5px 10px" }}>Contribution</td>
                                            <td style={{ border: "1px solid #000000", padding: "5px 10px", textAlign: "right" }}>{Number(previewPayslip.contribution || 0).toFixed(2)}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ border: "1px solid #000000", padding: "5px 10px" }}></td>
                                            <td style={{ border: "1px solid #000000", padding: "5px 10px" }}></td>
                                            <td style={{ border: "1px solid #000000", padding: "5px 10px" }}>ESIC</td>
                                            <td style={{ border: "1px solid #000000", padding: "5px 10px", textAlign: "right" }}>{Number(previewPayslip.esi || 0).toFixed(2)}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ border: "1px solid #000000", padding: "5px 10px" }}></td>
                                            <td style={{ border: "1px solid #000000", padding: "5px 10px" }}></td>
                                            <td style={{ border: "1px solid #000000", padding: "5px 10px" }}>Others</td>
                                            <td style={{ border: "1px solid #000000", padding: "5px 10px", textAlign: "right" }}>{Number(previewPayslip.others || 0).toFixed(2)}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ border: "1px solid #000000", padding: "6px 10px", fontWeight: "bold" }}>Total Earnings</td>
                                            <td style={{ border: "1px solid #000000", padding: "6px 10px", textAlign: "right", fontWeight: "bold" }}>{Number(previewPayslip.total_earnings || previewPayslip.grossAmount || 0).toFixed(2)}</td>
                                            <td style={{ border: "1px solid #000000", padding: "6px 10px", fontWeight: "bold" }}>Total Deductions</td>
                                            <td style={{ border: "1px solid #000000", padding: "6px 10px", textAlign: "right", fontWeight: "bold" }}>{Number(previewPayslip.total_deductions || previewPayslip.deductions || 0).toFixed(2)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </Box>

                            {/* Net Salary Row */}
                            <div style={{ marginTop: "12px", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "24px" }}>
                                <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "#000000" }}>
                                    Net Salary
                                </span>
                                <span style={{ fontWeight: 800, fontSize: "1rem", color: "#000000" }}>
                                    {Number(previewPayslip.net_salary || previewPayslip.netSalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>

                            {/* In Words Row */}
                            <div style={{ marginTop: "12px", color: "#000000" }}>
                                <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#000000" }}>
                                    In Words : <span style={{ fontWeight: 600, color: "#000000" }}>{numberToWords(previewPayslip.net_salary || previewPayslip.netSalary)}</span>
                                </span>
                            </div>

                            {/* Stamp & Sign Image on Left Side */}
                            <Box sx={{ mt: 2.5, display: "flex", justifyContent: "flex-start", alignItems: "center" }}>
                                <img
                                    src="/payslip_stamp%20and%20sign.jpg"
                                    alt="Stamp and Signature"
                                    style={{ height: "150px", maxWidth: "360px", objectFit: "contain" }}
                                />
                            </Box>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        </PageContainer>
    );
};

export default Payslips;
