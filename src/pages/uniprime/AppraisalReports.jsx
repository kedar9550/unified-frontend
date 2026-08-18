import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  IconButton,
  TablePagination,
  TableSortLabel
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import { toast } from 'sonner';
import { Visibility, Assessment, Download } from '@mui/icons-material';
import * as XLSX from 'xlsx-js-style';
import Loader from '../../components/common/Loader';

const AppraisalReports = () => {
  const navigate = useNavigate();
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [appraisals, setAppraisals] = useState([]);
  const [appraisalConfig, setAppraisalConfig] = useState(null);
  const [loading, setLoading] = useState(false);

  // Pagination and Sorting State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('empId');

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      fetchAppraisalsAndConfig(selectedYear);
    }
  }, [selectedYear]);

  const fetchAcademicYears = async () => {
    try {
      const [resYears, resActive] = await Promise.all([
        axiosInstance.get('/api/academic-years'),
        axiosInstance.get('/api/appraisal/active-year')
      ]);

      const activeAppraisalYearId = resActive.data?.data?._id || resActive.data?.data;

      if (resYears.data && resYears.data.years) {
        const years = resYears.data.years;
        if (years.length > 0) {
          const mappedYears = years.map(y => ({
            ...y,
            isAppraisalActive: activeAppraisalYearId === y._id
          }));

          const sortedYears = [...mappedYears].sort((a, b) => {
            if (a.isAppraisalActive && !b.isAppraisalActive) return -1;
            if (!a.isAppraisalActive && b.isAppraisalActive) return 1;
            return b.year.localeCompare(a.year);
          });
          setAcademicYears(sortedYears);
          setSelectedYear(sortedYears[0]._id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch academic years", error);
      toast.error("Failed to fetch academic years");
    }
  };

  const fetchAppraisalsAndConfig = async (yearId) => {
    setLoading(true);
    try {
      const [resAppraisals, resConfig] = await Promise.all([
        axiosInstance.get(`/api/appraisal/all/${yearId}`),
        axiosInstance.get(`/api/appraisal/config/${yearId}`)
      ]);

      if (resConfig.data && resConfig.data.success) {
        setAppraisalConfig(resConfig.data.data);
      } else {
        setAppraisalConfig(null);
      }

      if (resAppraisals.data && resAppraisals.data.success) {
        // Filter out drafts or non-approved ones. User said: "need only the approved ones can show hear"
        const approvedOnly = resAppraisals.data.data.filter(app => ['Pending Research Admin', 'Completed'].includes(app.status) || (app.status && app.status.startsWith('Approved')));
        setAppraisals(approvedOnly);
        setPage(0);
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
      toast.error("Failed to fetch appraisals");
    } finally {
      setLoading(false);
    }
  };



  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const getSortValue = (row, property) => {
    const type = row.eligibility?.type || 'N/A';
    const minPoints = row.eligibility?.mins?.total || 0;

    const teaching = row.teaching?.totalClaimed || 0;
    const research = row.research?.totalClaimed || 0;
    const valueAdd = row.valueAddition?.totalClaimed || 0;
    const admin = row.administration?.totalClaimed || 0;
    const interpersonal = row.hodEvaluation?.totalInterpersonalPoints || 0;
    const cappedTotal1to4 = Math.min(200, teaching + research + valueAdd + admin);
    const grandTotal = parseFloat((cappedTotal1to4 + interpersonal).toFixed(2));

    switch (property) {
      case 'empId': return row.facultyId?.institutionId?.toString().toLowerCase() || '';
      case 'facultyName': return row.facultyId?.name?.toLowerCase() || '';
      case 'type': return type.toLowerCase();
      case 'minPoints': return minPoints;
      case 'total': return grandTotal;
      default: return '';
    }
  };

  const sortedAppraisals = [...appraisals].sort((a, b) => {
    const aValue = getSortValue(a, orderBy);
    const bValue = getSortValue(b, orderBy);
    if (aValue < bValue) return order === 'asc' ? -1 : 1;
    if (aValue > bValue) return order === 'asc' ? 1 : -1;
    return 0;
  });

  const paginatedAppraisals = sortedAppraisals.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleDownloadExcel = () => {
    if (!appraisals || appraisals.length === 0) {
      toast.error("No data to download.");
      return;
    }

    const headers1 = [
      "Personal Details", "", "", "", "", "", "", "", "",
      "Teaching", "", "", "", "", "",
      "Research", "", "", "", "", "", "", "", "", "", "",
      "Value Addition", "", "", "",
      "Administration", "",
      "Interpersonal Skills", "",
      "Eligibility Status", "", "",
      "Final Totals", ""
    ];

    const headers2 = [
      "Emp ID", "Faculty Name", "Designation", "Department", "Type",
      "Date of Joining", "Highest Qualification", "Month of Pass", "Year of Pass",
      "Course pass% (1.1)", "Course Feedback (1.2)", "Proctoring pass %(1.3)", "CO attainment(1.4)", "Teaching min", "Teaching obtained",
      "Paper publication (2.1) minimum required", "Paper publication (2.1) obtained", "Guiding Ph. D Scholars(2.2)", "Books/Chapters/Scopus Conference proceedings(2.3)", "Patents(2.4)", "Novel products/Technology (2.5)", "Project/Consultancy Proposals(2.6)", "Scopus Citation score points(2.7)", "Scopus h-index score points(2.8)", "Research min", "Research obtained",
      "Faculty resource utilization(3.1)", "Faculty Contribution(3.2)", "3 minimum points", "3 obtained points",
      "Administrative Responsibilities(4) minimum", "Administrative Responsibilities(4) obtained",
      "Interpersonal Skills (5) minimum", "Interpersonal Skills (5) obtained",
      "FDP(5+days) – Recognized Institutes / Coursera (40min)", "min points in Papers Publications(2.1)", "min points in interpersonal skill",
      "Total min points", "Total obtained points"
    ];

    const yearName = academicYears.find(y => y._id === selectedYear)?.year || "N/A";
    
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
    const timestamp = `${dateStr}, ${timeStr}`;

    const topRow1 = ["CONSOLIDATED FACULTY SELF-APPRAISAL REPORT"];
    const topRow2 = [`Academic Year: ${yearName}`];
    const topRow3 = [`Generated On: ${timestamp}`];

    const exportDataAOA = [topRow1, topRow2, topRow3, headers1, headers2];

    appraisals.forEach(row => {
      const type = row.eligibility?.type || 'N/A';
      const mins = row.eligibility?.mins || {};

      // Teaching Breakdown
      const teaching = row.teaching || {};
      const coursePassPercent = teaching.passPercentage?.averagePoints || 0;
      const courseFeedback = teaching.feedback?.averagePoints || 0;
      const proctoringPassPercent = teaching.proctoring?.averagePoints || 0;
      const coAttainment = teaching.coAttainment?.averagePoints || 0;
      const teachingObtained = teaching.totalClaimed || 0;
      const teachingMin = mins.teaching || 0;

      // Research Breakdown
      const research = row.research || {};
      const r21Obtained = research.papers?.totalClaimed || 0;
      const r22 = research.phdGuiding?.totalClaimed || 0;
      const r23 = research.booksChapters?.totalClaimed || 0;
      const r24 = research.patents?.totalClaimed || 0;
      const r25 = research.novelProducts?.totalClaimed || 0;
      const r26 = research.projectsConsultancies?.totalClaimed || 0;
      const r27 = research.scopusCitationScore || 0;
      const r28 = research.scopusHIndexScore || 0;
      const researchObtained = research.totalClaimed || 0;

      const r21Min = mins.research21 || 0;
      const researchTotalMin = (mins.research21 || 0) + (mins.research22_28 || 0);

      // Value Addition & Admin & Interpersonal
      const valueAdd = row.valueAddition || {};
      const v31 = valueAdd.resourceUtilization?.totalClaimed || 0;
      const v32 = valueAdd.expertiseContribution?.totalClaimed || 0;
      const v3Obtained = v31 + v32;

      const aRaw = row.administration?.totalClaimed || 0;
      const iRaw = row.hodEvaluation?.totalInterpersonalPoints || 0;

      const rawTotal1to4 = teachingObtained + researchObtained + v3Obtained + aRaw;
      const cappedTotal1to4 = Math.min(200, rawTotal1to4);
      const grandTotal = parseFloat((cappedTotal1to4 + iRaw).toFixed(2));
      const totalMin = mins.total || 0;



      const fdpStatus = row.eligibility?.details?.fdpStatus || "Unfulfilled";
      const r21Status = row.eligibility?.details?.r21Status || "Unfulfilled";
      const interpersonalStatus = row.eligibility?.details?.interpersonalStatus || "Unfulfilled";

      // Highest Qualification Logic
      let highestQualObj = null;
      if (row.personalInfoSnapshot?.qualifications && row.personalInfoSnapshot.qualifications.length > 0) {
        const priority = { "Doctoral": 3, "PG": 2, "UG": 1 };
        highestQualObj = row.personalInfoSnapshot.qualifications.reduce((prev, current) => {
          return (priority[current.level] > (priority[prev.level] || 0)) ? current : prev;
        }, {});
      }

      const formattedDOJ = row.personalInfoSnapshot?.dateOfJoining 
        ? new Date(row.personalInfoSnapshot.dateOfJoining).toLocaleDateString('en-GB')
        : 'N/A';
      const highestQual = highestQualObj?.qualification || row.personalInfoSnapshot?.qualification || 'N/A';
      const highestQualMonth = highestQualObj?.completedMonth || 'N/A';
      const highestQualYear = highestQualObj?.completedYear || 'N/A';

      exportDataAOA.push([
        row.personalInfoSnapshot?.institutionId || row.facultyId?.institutionId || 'N/A',
        row.personalInfoSnapshot?.name || row.facultyId?.name || 'N/A',
        row.personalInfoSnapshot?.designation || row.facultyId?.designation || 'N/A',
        row.personalInfoSnapshot?.departmentName || row.facultyId?.department?.name || row.facultyId?.coreDepartment?.name || 'N/A',
        type,
        formattedDOJ,
        highestQual,
        highestQualMonth,
        highestQualYear,
        coursePassPercent,
        courseFeedback,
        proctoringPassPercent,
        coAttainment,
        teachingMin,
        teachingObtained,
        r21Min,
        r21Obtained,
        r22,
        r23,
        r24,
        r25,
        r26,
        r27,
        r28,
        researchTotalMin,
        researchObtained,
        v31,
        v32,
        mins.valueAddition || 0,
        v3Obtained,
        mins.administration || 0,
        aRaw,
        mins.interpersonalSkills || 0,
        iRaw,
        fdpStatus,
        r21Status,
        interpersonalStatus,
        totalMin,
        grandTotal
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(exportDataAOA);

    // Add multi-column merges for the top header row
    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 38 } }, // Report Title
      { s: { r: 1, c: 0 }, e: { r: 1, c: 38 } }, // Academic Year
      { s: { r: 2, c: 0 }, e: { r: 2, c: 38 } }, // Timestamp

      { s: { r: 3, c: 0 }, e: { r: 3, c: 8 } },    // Personal Details
      { s: { r: 3, c: 9 }, e: { r: 3, c: 14 } },   // Teaching
      { s: { r: 3, c: 15 }, e: { r: 3, c: 25 } },  // Research
      { s: { r: 3, c: 26 }, e: { r: 3, c: 29 } },  // Value Addition
      { s: { r: 3, c: 30 }, e: { r: 3, c: 31 } },  // Administration
      { s: { r: 3, c: 32 }, e: { r: 3, c: 33 } },  // Interpersonal Skills
      { s: { r: 3, c: 34 }, e: { r: 3, c: 36 } },  // Eligibility Status
      { s: { r: 3, c: 37 }, e: { r: 3, c: 38 } }   // Final Totals
    ];

    // Apply color styling to the headers
    const colColors = [
      // Personal Details (9 cols)
      ...Array(9).fill("4F81BD"), // Blue
      // Teaching (6 cols)
      ...Array(6).fill("9BBB59"), // Green
      // Research (11 cols)
      ...Array(11).fill("F79646"), // Orange
      // Value Addition (4 cols)
      ...Array(4).fill("8064A2"), // Purple
      // Administration (2 cols)
      ...Array(2).fill("4BACC6"), // Teal
      // Interpersonal (2 cols)
      ...Array(2).fill("C0504D"), // Red
      // Eligibility Status (3 cols)
      ...Array(3).fill("FFC000"), // Yellow
      // Final Totals (2 cols)
      ...Array(2).fill("404040")  // Dark Grey
    ];

    const borderStyle = {
      top: { style: "thin", color: { auto: 1 } },
      bottom: { style: "thin", color: { auto: 1 } },
      left: { style: "thin", color: { auto: 1 } },
      right: { style: "thin", color: { auto: 1 } }
    };

    const lightColors = {
      "4F81BD": "DCE6F1", // Blue
      "9BBB59": "EBF1DE", // Green
      "F79646": "FDE9D9", // Orange
      "8064A2": "E4DFEC", // Purple
      "4BACC6": "DAEEF3", // Teal
      "C0504D": "F2DCDB", // Red
      "FFC000": "FFF2CC", // Yellow
      "404040": "D9D9D9", // Dark Grey -> Light Grey
      "7F7F7F": "F2F2F2", // Gray -> Very Light Gray
      "1F497D": "D9E1F2"  // Dark Blue -> Very Light Blue
    };

    for (let c = 0; c < 39; c++) {
      const headerColor = colColors[c];

      // Style for the top header row (headers1)
      const styleObj1 = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: headerColor } },
        alignment: { horizontal: "center", vertical: "center" },
        border: borderStyle
      };

      const cell1Ref = XLSX.utils.encode_cell({ r: 3, c });
      if (worksheet[cell1Ref]) {
        worksheet[cell1Ref].s = styleObj1;
      }

      // Determine specific color for 'minimum' or 'obtained' columns in headers2
      let cell2Color = headerColor;
      const h2Text = (headers2[c] || "").toLowerCase();

      if (c >= 34 && c <= 36) {
        // Eligibility Status section: Keep the section color (Yellow)
        cell2Color = headerColor;
      } else if (h2Text.includes("min")) {
        cell2Color = "7F7F7F"; // Gray for Minimum Points
      } else if (h2Text.includes("obtain")) {
        cell2Color = "1F497D"; // Dark Blue for Obtained Points
      }

      // Style for the second header row (headers2)
      const styleObj2 = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: cell2Color } },
        alignment: { horizontal: "center", vertical: "center" },
        border: borderStyle
      };

      const cell2Ref = XLSX.utils.encode_cell({ r: 4, c });
      if (worksheet[cell2Ref]) {
        worksheet[cell2Ref].s = styleObj2;
      }

      // Apply light color variants to the data cells
      const dataColor = lightColors[cell2Color] || "FFFFFF";

      for (let r = 5; r < exportDataAOA.length; r++) {
        const cellDataRef = XLSX.utils.encode_cell({ r, c });
        if (worksheet[cellDataRef]) {
          worksheet[cellDataRef].s = {
            fill: { fgColor: { rgb: dataColor } },
            border: borderStyle,
            alignment: { horizontal: "center", vertical: "center" }
          };
        }
      }
    }

    // Apply styles to the new top headers across all merged columns
    const topStyleBold14 = {
      font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "1F497D" } }, // Professional Dark Blue
      alignment: { horizontal: "center", vertical: "center" }
    };
    const topStyleBold12 = {
      font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "1F497D" } },
      alignment: { horizontal: "center", vertical: "center" }
    };

    for (let c = 0; c < 39; c++) {
      const ref0 = XLSX.utils.encode_cell({ r: 0, c });
      const ref1 = XLSX.utils.encode_cell({ r: 1, c });
      const ref2 = XLSX.utils.encode_cell({ r: 2, c });
      
      if (!worksheet[ref0]) worksheet[ref0] = { t: "s", v: "" };
      worksheet[ref0].s = topStyleBold14;
      
      if (!worksheet[ref1]) worksheet[ref1] = { t: "s", v: "" };
      worksheet[ref1].s = topStyleBold12;

      if (!worksheet[ref2]) worksheet[ref2] = { t: "s", v: "" };
      worksheet[ref2].s = topStyleBold12;
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Appraisals");
    XLSX.writeFile(workbook, `Appraisal_Reports_${academicYears.find(y => y._id === selectedYear)?.year || 'Export'}.xlsx`);
  };

  return (
    <Box sx={{ p: 4, maxWidth: "1600px", margin: "0 auto" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 850, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 1.5 }}>
            <Assessment sx={{ fontSize: "2.5rem", color: "var(--color-primary)" }} />
            Appraisal Reports (Approved)
          </Typography>
          <Typography variant="subtitle1" sx={{ color: "var(--text-secondary)", mt: 0.5, fontWeight: 550 }}>
            View approved faculty performance appraisals
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl sx={{ minWidth: 250, bgcolor: "var(--bg-paper)", borderRadius: "12px" }} size="small">
            <InputLabel id="academic-year-select-label" sx={{ fontWeight: 700 }}>Academic Year</InputLabel>
            <Select
              labelId="academic-year-select-label"
              id="academic-year-select"
              value={selectedYear}
              label="Academic Year"
              onChange={(e) => setSelectedYear(e.target.value)}
              sx={{ borderRadius: "12px", fontWeight: 700 }}
            >
              {academicYears.map((year) => (
                <MenuItem key={year._id} value={year._id} sx={{ fontWeight: year.isAppraisalActive ? 800 : 500 }}>
                  {year.year} {year.isAppraisalActive ? ' (Active)' : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Tooltip title="Download Excel">
            <IconButton onClick={handleDownloadExcel} sx={{ bgcolor: "var(--bg-paper)", border: "1px solid var(--border-color)", borderRadius: "12px", width: 40, height: 40, '&:hover': { bgcolor: 'var(--bg-accent-1)' } }}>
              <Download color="primary" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Data Table */}
      <TableContainer component={Paper} sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-premium)", overflowX: "auto" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <Loader size={80} />
          </Box>
        ) : appraisals.length === 0 ? (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <Assessment sx={{ fontSize: "4rem", color: "var(--text-secondary)", opacity: 0.3, mb: 2 }} />
            <Typography variant="h6" sx={{ color: "var(--text-secondary)", fontWeight: 650 }}>
              No approved appraisals found
            </Typography>
            <Typography variant="body2" sx={{ color: "var(--text-secondary)", mt: 0.5 }}>
              Try selecting a different academic year.
            </Typography>
          </Box>
        ) : (
          <>
            <Table>
              <TableHead sx={{ background: "var(--gradient-primary)" }}>
                <TableRow>
                  {[
                    { id: 'empId', label: 'Emp ID' },
                    { id: 'facultyName', label: 'Faculty Name' },
                    { id: 'type', label: 'Type' },
                    { id: 'minPoints', label: 'Min. Points', align: 'center' },
                    { id: 'total', label: 'Total Points', align: 'center' },
                    { id: 'actions', label: 'Actions', align: 'center', sortable: false }
                  ].map(headCell => (
                    <TableCell
                      key={headCell.id}
                      align={headCell.align || 'left'}
                      sx={{
                        fontWeight: 700,
                        py: 2,
                        color: "#fff !important",
                        '& .MuiTableSortLabel-root': { color: '#fff !important', '&:hover': { color: '#e0e0e0 !important' } },
                        '& .MuiTableSortLabel-root.Mui-active': { color: '#fff !important' },
                        '& .MuiTableSortLabel-icon': { color: '#fff !important' },
                        whiteSpace: "nowrap"
                      }}
                      sortDirection={orderBy === headCell.id ? order : false}
                    >
                      {headCell.sortable !== false ? (
                        <TableSortLabel
                          active={orderBy === headCell.id}
                          direction={orderBy === headCell.id ? order : 'asc'}
                          onClick={() => handleRequestSort(headCell.id)}
                        >
                          {headCell.label}
                        </TableSortLabel>
                      ) : (
                        headCell.label
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedAppraisals.map((row) => {
                  const type = row.eligibility?.type || 'N/A';
                  const minPoints = row.eligibility?.mins?.total || 0;

                  const teaching = row.teaching?.totalClaimed || 0;
                  const research = row.research?.totalClaimed || 0;
                  const valueAdd = row.valueAddition?.totalClaimed || 0;
                  const admin = row.administration?.totalClaimed || 0;
                  const interpersonal = row.hodEvaluation?.totalInterpersonalPoints || 0;
                  const cappedTotal1to4 = Math.min(200, teaching + research + valueAdd + admin);
                  const grandTotal = parseFloat((cappedTotal1to4 + interpersonal).toFixed(2));

                  const isMet = grandTotal >= minPoints;

                  return (
                    <TableRow key={row._id} sx={{ "&:hover": { background: "var(--bg-accent-1)" }, transition: "background 0.15s", "&:last-child td, &:last-child th": { border: 0 } }}>
                      <TableCell sx={{ fontWeight: 700, color: "var(--color-primary)" }}>{row.facultyId?.institutionId || 'N/A'}</TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", flexDirection: "column" }}>
                          <Typography sx={{ fontWeight: 700, color: "var(--text-primary)" }}>{row.facultyId?.name || 'N/A'}</Typography>
                          <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 550 }}>{row.facultyId?.designation || 'N/A'}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "var(--text-secondary)" }}>{type}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>{minPoints}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800, color: isMet ? "#10b981" : "error.main", bgcolor: isMet ? "rgba(16, 185, 129, 0.05)" : "rgba(239, 68, 68, 0.05)" }}>
                        {grandTotal}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton
                            onClick={() => navigate(`/appraisal/details/${row._id}`)}
                            color="primary"
                            size="small"
                            sx={{ border: "1px solid rgba(79, 70, 229, 0.15)", bgcolor: "rgba(79, 70, 229, 0.05)" }}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={appraisals.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[5, 10, 25, 50]}
              sx={{
                borderTop: "1px solid var(--border-color)",
                color: "var(--text-secondary)",
                ".MuiTablePagination-select": { color: "var(--text-primary)" },
                ".MuiTablePagination-selectIcon": { color: "var(--text-secondary)" },
                ".MuiIconButton-root": { color: "var(--text-secondary)" },
                ".MuiIconButton-root.Mui-disabled": { opacity: 0.3 }
              }}
            />
          </>
        )}
      </TableContainer>
    </Box>
  );
};

export default AppraisalReports;
