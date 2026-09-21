import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Grid,
  Divider,
  Paper,
  MenuItem,
  TextField,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  MilitaryTech as MedalIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  QrCode as QrCodeIcon,
  Receipt as ReceiptIcon,
  CreditCard as CreditCardIcon,
  ArrowBack as ArrowBackIcon,
  WorkspacePremium as PremiumIcon,
} from '@mui/icons-material';
import * as XLSX from 'xlsx-js-style';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/data/DataTable';
import { PageContainer, EmptyState } from '../../components/common/design-system';
import CountBand from '../../components/common/design-system/CountBand';
import API from '../../api/axios';
import { fetchEventDepartments } from '../../api/eventDepartmentApi';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import EventPassCard from '../../components/EventPass/EventPassCard';

const ParticipantPayments = () => {
  const navigate = useNavigate();
  const { activeRole, user } = useAuth();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPassParticipant, setSelectedPassParticipant] = useState(null);
  const [passDialogOpen, setPassDialogOpen] = useState(false);

  const [allEvents, setAllEvents] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [departmentsDialogOpen, setDepartmentsDialogOpen] = useState(false);
  const [departmentsToView, setDepartmentsToView] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [prizeFilter, setPrizeFilter] = useState('ALL');
  const [eventFilter, setEventFilter] = useState('ALL');
  const [schoolFilter, setSchoolFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [branchMap, setBranchMap] = useState({});

  const fetchParticipantPayments = useCallback(async () => {
    setLoading(true);
    try {
      const [eventsRes, deptsRes] = await Promise.all([
        API.get('/api/events'),
        fetchEventDepartments().catch(() => ({ data: { departments: [] } })),
      ]);
      const fetchedEvents = eventsRes.data?.events || [];
      const fetchedDepts = deptsRes.data?.departments || [];
      setAllEvents(fetchedEvents);
      setAllDepartments(fetchedDepts);

      let allowedEventNames = null;
      if (activeRole === 'FACULTY_COORDINATOR' && user) {
        const userEvents = fetchedEvents.filter((e) => {
          const coords = e.facultyCoordinators || (e.facultyCoordinator ? [e.facultyCoordinator] : []);
          return coords.some(
            (c) =>
              c.employeeId === user.institutionId ||
              c.employeeId === user.employeeId ||
              c.employeeId === user.employeeCode
          );
        });
        allowedEventNames = userEvents.map((e) => e.eventName);
      }

      // Query all paid registrations
      const response = await API.get('/api/razorpay/registrations?paymentStatus=PAID');
      let fetchedPayments = response.data?.payments || [];

      fetchedPayments = fetchedPayments.filter((p) => {
        const isPaid = p.paymentStatus === 'PAID' || p.verified === true;
        return isPaid;
      });

      if (allowedEventNames) {
        fetchedPayments = fetchedPayments.filter((p) =>
          allowedEventNames.includes(p.eventName || p.category)
        );
      }

      fetchedPayments = fetchedPayments.map((p) => {
        const eventMatch = fetchedEvents.find(
          (e) => e.eventName === (p.eventName || p.category)
        );
        const amountInRupees =
          p.amountRupees !== undefined && p.amountRupees !== null
            ? p.amountRupees
            : p.amount
            ? p.amount > 1000
              ? p.amount / 100
              : p.amount
            : 0;

        return {
          ...p,
          amountRupees: amountInRupees,
          venue: eventMatch
            ? eventMatch.venueType === 'Indoor' && eventMatch.building && eventMatch.floor
              ? `${eventMatch.roomNo ? `Room No: ${eventMatch.roomNo}, ` : ''}${
                  eventMatch.building.name || eventMatch.building
                } - ${eventMatch.floor.name || eventMatch.floor}`
              : eventMatch.venueType === 'Outdoor' && eventMatch.ground
              ? `${eventMatch.roomNo ? `Room No: ${eventMatch.roomNo}, ` : ''}${
                  eventMatch.ground.name || eventMatch.ground
                }`
              : eventMatch.venue
            : null,
          eventGroup: eventMatch?.group?.name || eventMatch?.group || '-',
          eventCategory: eventMatch?.category?.name || eventMatch?.category || p.category || '-',
          eventSchool: eventMatch?.eventSchool?.name || p.category || p.schoolId || '-',
        };
      });

      setPayments(fetchedPayments);

      // Branch resolution for rolls missing branch
      const missingRolls = new Set();
      fetchedPayments.forEach((pay) => {
        if (Array.isArray(pay.participants)) {
          pay.participants.forEach((p) => {
            if (
              !p.branch &&
              p.roll &&
              p.roll.length > 5 &&
              (!p.college || p.college.toLowerCase().includes('aditya'))
            ) {
              missingRolls.add(p.roll.toUpperCase());
            }
          });
        }
      });

      if (missingRolls.size > 0) {
        const rollsToFetch = Array.from(missingRolls);
        rollsToFetch.forEach(async (roll) => {
          try {
            const res = await API.get(`/api/razorpay/registrations/branch/${roll}`);
            const data = res.data;
            let branch = null;
            const studentObj =
              Array.isArray(data) && data.length > 0
                ? data[0]
                : data?.value && Array.isArray(data.value) && data.value.length > 0
                ? data.value[0]
                : data && typeof data === 'object'
                ? data
                : null;
            if (studentObj) {
              branch = studentObj.branch || studentObj.branch_name || studentObj.branchName || studentObj.BRANCH;
            }
            if (branch) {
              setBranchMap((prev) => ({ ...prev, [roll]: String(branch).trim() }));
            }
          } catch (err) {
            console.error(`Failed to fetch branch for ${roll}`, err);
          }
        });
      }
    } catch (error) {
      console.error('Error fetching participant payments:', error);
      toast.error(error.response?.data?.message || 'Failed to load participant payments report');
    } finally {
      setLoading(false);
    }
  }, [activeRole, user]);

  useEffect(() => {
    fetchParticipantPayments();
  }, [fetchParticipantPayments]);

  const deptLookupMap = useMemo(() => {
    const map = {};
    allDepartments.forEach((d) => {
      if (d && d.name) {
        const canonical = d.name.trim();
        map[canonical.toUpperCase()] = canonical;
        if (d.alternativeNames) {
          d.alternativeNames.split(',').forEach((alt) => {
            const cleanAlt = alt.trim().toUpperCase();
            if (cleanAlt) {
              map[cleanAlt] = canonical;
            }
          });
        }
      }
    });
    return map;
  }, [allDepartments]);

  const resolveStudentDepartment = useCallback(
    (p) => {
      if (!p) return '';
      const rawDept = String(p.department || '').trim();
      if (rawDept && deptLookupMap[rawDept.toUpperCase()]) {
        return deptLookupMap[rawDept.toUpperCase()];
      }
      if (rawDept) return rawDept;

      const rawBranch = String(p.computedBranch || p.branch || '').trim();
      if (rawBranch && deptLookupMap[rawBranch.toUpperCase()]) {
        return deptLookupMap[rawBranch.toUpperCase()];
      }
      return rawBranch || '';
    },
    [deptLookupMap]
  );

  // Transform each payment into a team record with payment & winner info
  const paidTeams = useMemo(() => {
    return payments
      .map((payment) => {
        const participants = Array.isArray(payment.participants)
          ? payment.participants.map((p, idx) => ({
              ...p,
              id: `${payment._id || payment.receipt}-${idx}`,
              computedBranch: p.branch || branchMap[p.roll?.toUpperCase()] || '',
              resolvedDept: resolveStudentDepartment({
                ...p,
                computedBranch: p.branch || branchMap[p.roll?.toUpperCase()] || '',
              }),
            }))
          : [];

        let prizeType = 'Participant';
        let prizeRank = 99;
        if (payment.isFirstWinner) {
          prizeType = 'First Prize';
          prizeRank = 1;
        } else if (payment.isSecondWinner) {
          prizeType = 'Second Prize';
          prizeRank = 2;
        } else if (payment.isThirdWinner) {
          prizeType = 'Third Prize';
          prizeRank = 3;
        }

        const attendedCount = participants.filter((p) => p.attended).length;

        const formattedPaidDate = payment.paidAt || payment.createdAt
          ? new Date(payment.paidAt || payment.createdAt).toLocaleString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            })
          : '-';

        return {
          ...payment,
          prizeType,
          prizeRank,
          participants,
          attendedCount,
          formattedPaidDate,
          totalMembers: participants.length || payment.teamSize || 1,
        };
      })
      .sort((a, b) => {
        if (a.prizeRank !== b.prizeRank) return a.prizeRank - b.prizeRank;
        return (a.eventName || '').localeCompare(b.eventName || '');
      });
  }, [payments, branchMap, resolveStudentDepartment]);

  const uniqueEvents = useMemo(() => {
    const eventsSet = new Set();
    paidTeams.forEach((t) => {
      if (t.eventName) eventsSet.add(t.eventName);
    });
    return Array.from(eventsSet).sort();
  }, [paidTeams]);

  const uniqueSchools = useMemo(() => {
    const set = new Set();
    paidTeams.forEach((t) => {
      const school = t.eventSchool || t.category || t.schoolId;
      if (school && school !== '-') set.add(school);
    });
    return Array.from(set).sort();
  }, [paidTeams]);

  const uniqueDepartments = useMemo(() => {
    const set = new Set();
    allDepartments.forEach((d) => {
      if (d?.name) set.add(d.name.trim());
    });
    paidTeams.forEach((t) => {
      t.participants.forEach((p) => {
        if (p.resolvedDept) set.add(p.resolvedDept);
      });
    });
    return Array.from(set).filter(Boolean).sort();
  }, [allDepartments, paidTeams]);

  const filteredTeams = useMemo(() => {
    return paidTeams.filter((t) => {
      if (prizeFilter === 'FIRST' && !t.isFirstWinner) return false;
      if (prizeFilter === 'SECOND' && !t.isSecondWinner) return false;
      if (prizeFilter === 'THIRD' && !t.isThirdWinner) return false;
      if (prizeFilter === 'NON_WINNERS' && (t.isFirstWinner || t.isSecondWinner || t.isThirdWinner)) return false;

      if (eventFilter !== 'ALL' && t.eventName !== eventFilter) return false;

      if (schoolFilter !== 'ALL') {
        const schoolCategory = t.eventSchool || t.category || t.schoolId;
        if (schoolCategory !== schoolFilter) return false;
      }

      if (departmentFilter !== 'ALL') {
        const hasDept = t.participants.some(
          (p) => (p.resolvedDept || '').toUpperCase() === departmentFilter.toUpperCase()
        );
        if (!hasDept) return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const teamId = (t.teamId || '').toLowerCase();
        const receipt = (t.receipt || '').toLowerCase();
        const eventName = (t.eventName || '').toLowerCase();
        const school = (t.eventSchool || t.category || '').toLowerCase();
        const paymentId = (t.razorpayPaymentId || '').toLowerCase();
        const orderId = (t.razorpayOrderId || '').toLowerCase();

        const matchesTeam =
          teamId.includes(query) ||
          receipt.includes(query) ||
          eventName.includes(query) ||
          school.includes(query) ||
          paymentId.includes(query) ||
          orderId.includes(query);

        const matchesMember = t.participants.some((p) => {
          const name = (p.name || '').toLowerCase();
          const roll = (p.roll || '').toLowerCase();
          const email = (p.email || '').toLowerCase();
          const mobile = (p.mobile || '').toLowerCase();
          const college = (p.college || '').toLowerCase();
          const dept = (p.resolvedDept || '').toLowerCase();
          const accPayId = (p.accommodationPayment?.razorpayPaymentId || '').toLowerCase();
          return (
            name.includes(query) ||
            roll.includes(query) ||
            email.includes(query) ||
            mobile.includes(query) ||
            college.includes(query) ||
            dept.includes(query) ||
            accPayId.includes(query)
          );
        });

        return matchesTeam || matchesMember;
      }

      return true;
    });
  }, [paidTeams, prizeFilter, eventFilter, schoolFilter, departmentFilter, searchQuery]);

  // Statistics
  const firstPrizeTeams = useMemo(() => paidTeams.filter((t) => t.isFirstWinner).length, [paidTeams]);
  const secondPrizeTeams = useMemo(() => paidTeams.filter((t) => t.isSecondWinner).length, [paidTeams]);
  const thirdPrizeTeams = useMemo(() => paidTeams.filter((t) => t.isThirdWinner).length, [paidTeams]);
  const totalPaidParticipants = useMemo(() => {
    return paidTeams.reduce((acc, t) => acc + (t.participants?.length || 0), 0);
  }, [paidTeams]);

  const totalRevenueCollected = useMemo(() => {
    return paidTeams.reduce((acc, t) => acc + Number(t.amountRupees || 0), 0);
  }, [paidTeams]);

  // Export to Excel with xlsx-js-style (Includes all Paid Participants & Payment details)
  const handleExportExcel = () => {
    if (filteredTeams.length === 0) {
      toast.error('No paid participant data to export.');
      return;
    }

    const headers = [
      'S.No',
      'Prize / Status',
      'Team ID',
      'Receipt No',
      'Event Name',
      'School Name',
      'Event Department(s)',
      'Registration Fee (₹)',
      'Payment Status',
      'Razorpay Payment ID',
      'Razorpay Order ID',
      'Payment Date & Time',
      'Team Size',
      'Participant Name',
      'Roll No',
      'Gender',
      'College',
      'Branch',
      'Student Department',
      'Year',
      'Mobile',
      'Email',
      'Attended',
      'Accommodation Required',
      'Accommodation Days',
      'Acc Fee Paid (₹)',
      'Acc Payment ID',
      'Acc Paid Date',
    ];

    const colWidths = [
      { wch: 6 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 28 },
      { wch: 22 },
      { wch: 30 },
      { wch: 18 },
      { wch: 14 },
      { wch: 24 },
      { wch: 24 },
      { wch: 22 },
      { wch: 10 },
      { wch: 26 },
      { wch: 16 },
      { wch: 10 },
      { wch: 26 },
      { wch: 16 },
      { wch: 20 },
      { wch: 8 },
      { wch: 16 },
      { wch: 28 },
      { wch: 10 },
      { wch: 20 },
      { wch: 16 },
      { wch: 16 },
      { wch: 24 },
      { wch: 16 },
    ];

    const applySheetStyles = (ws, totalRowsCount, headerColsCount, headerBgRgb = '0F172A') => {
      ws['!cols'] = colWidths;
      // Header row styling
      for (let c = 0; c < headerColsCount; c++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c });
        if (ws[cellRef]) {
          ws[cellRef].s = {
            font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
            fill: { fgColor: { rgb: headerBgRgb } },
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
            border: {
              top: { style: 'thin', color: { rgb: 'CBD5E1' } },
              bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
              left: { style: 'thin', color: { rgb: 'CBD5E1' } },
              right: { style: 'thin', color: { rgb: 'CBD5E1' } },
            },
          };
        }
      }

      // Total summary row styling (last row)
      const lastRowIdx = totalRowsCount - 1;
      for (let c = 0; c < headerColsCount; c++) {
        const cellRef = XLSX.utils.encode_cell({ r: lastRowIdx, c });
        if (ws[cellRef]) {
          ws[cellRef].s = {
            font: { bold: true, color: { rgb: '0F172A' }, sz: 11 },
            fill: { fgColor: { rgb: 'E2E8F0' } },
            alignment: { horizontal: c === 7 || c === 25 ? 'right' : 'center', vertical: 'center' },
            border: {
              top: { style: 'medium', color: { rgb: '0F172A' } },
              bottom: { style: 'double', color: { rgb: '0F172A' } },
              left: { style: 'thin', color: { rgb: 'CBD5E1' } },
              right: { style: 'thin', color: { rgb: 'CBD5E1' } },
            },
          };
        }
      }
    };

    const buildRowsForTeams = (teamsList) => {
      const rows = [];
      let sNo = 1;
      teamsList.forEach((t) => {
        const schoolCategory = t.eventSchool || t.category || t.schoolId || '-';
        const relatedEvent = allEvents.find((e) => e._id === t.eventId);
        let eventDeptStr = '-';
        if (relatedEvent && relatedEvent.department && relatedEvent.department.length > 0) {
          eventDeptStr = relatedEvent.department.map((d) => d.name).join(', ');
        }

        const regFee = t.amountRupees || 0;
        const pStatus = t.paymentStatus || (t.verified ? 'PAID' : 'PENDING');
        const payId = t.razorpayPaymentId || '-';
        const orderId = t.razorpayOrderId || '-';
        const payDate = t.formattedPaidDate;

        if (t.participants && t.participants.length > 0) {
          t.participants.forEach((p, pIdx) => {
            const collegeName =
              p.college === 'Other College' && p.otherCollege
                ? p.otherCollege
                : p.college || '';
            const accReq = p.accommodation || 'No';
            const accDays = p.daysCount || p.days || p.dayscount || '-';
            const accPaidAmt = p.accommodationPayment?.amount || 0;
            const accPayId = p.accommodationPayment?.razorpayPaymentId || '-';
            const accPaidDate = p.accommodationPayment?.paidAt
              ? new Date(p.accommodationPayment.paidAt).toLocaleDateString('en-IN')
              : '-';

            // Show registration fee ONLY on the 1st participant row of each team so Excel SUM matches team total!
            const memberRegFee = pIdx === 0 ? regFee : 0;

            rows.push([
              sNo++,
              t.prizeType,
              t.teamId || t.receipt || '-',
              t.receipt || '-',
              t.eventName || '-',
              schoolCategory,
              eventDeptStr,
              memberRegFee,
              pStatus,
              payId,
              orderId,
              payDate,
              t.totalMembers,
              p.name || '',
              p.roll || '',
              p.gender || '',
              collegeName,
              p.computedBranch || p.branch || '',
              p.resolvedDept || '',
              p.year || '',
              p.mobile || '',
              p.email || '',
              p.attended ? 'Yes' : 'No',
              accReq,
              accDays,
              accPaidAmt,
              accPayId,
              accPaidDate,
            ]);
          });
        } else {
          rows.push([
            sNo++,
            t.prizeType,
            t.teamId || t.receipt || '-',
            t.receipt || '-',
            t.eventName || '-',
            schoolCategory,
            eventDeptStr,
            regFee,
            pStatus,
            payId,
            orderId,
            payDate,
            t.totalMembers,
            '-',
            '-',
            '-',
            '-',
            '-',
            '-',
            '-',
            '-',
            '-',
            '-',
            '-',
            '-',
            '-',
            '-',
            '-',
          ]);
        }
      });

      // Add TOTAL summary row
      const grandRegFee = teamsList.reduce((acc, t) => acc + Number(t.amountRupees || 0), 0);
      const grandAccFee = teamsList.reduce((acc, t) => {
        const teamAcc = t.participants?.reduce((pAcc, p) => pAcc + Number(p.accommodationPayment?.amount || 0), 0) || 0;
        return acc + teamAcc;
      }, 0);
      const totalParticipantsCount = teamsList.reduce((acc, t) => acc + (t.participants?.length || 0), 0);

      rows.push([
        'TOTAL',
        `Teams: ${teamsList.length}`,
        '',
        '',
        '',
        '',
        '',
        grandRegFee,
        '',
        '',
        '',
        '',
        `Members: ${totalParticipantsCount}`,
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        grandAccFee,
        '',
        ''
      ]);

      return rows;
    };

    const workbook = XLSX.utils.book_new();

    // 1. Master Sheet: All Paid Participants
    const allRows = [headers, ...buildRowsForTeams(filteredTeams)];
    const allWs = XLSX.utils.aoa_to_sheet(allRows);
    applySheetStyles(allWs, allRows.length, headers.length, '0F172A'); // Slate 900 header
    XLSX.utils.book_append_sheet(workbook, allWs, 'All Paid Participants');

    // 2. 1st Prize Winners Sheet
    const firstTeams = filteredTeams.filter((t) => t.isFirstWinner);
    if (firstTeams.length > 0) {
      const firstRows = [headers, ...buildRowsForTeams(firstTeams)];
      const firstWs = XLSX.utils.aoa_to_sheet(firstRows);
      applySheetStyles(firstWs, firstRows.length, headers.length, 'B45309'); // Gold/Amber
      XLSX.utils.book_append_sheet(workbook, firstWs, '1st Prize Winners');
    }

    // 3. 2nd Prize Winners Sheet
    const secondTeams = filteredTeams.filter((t) => t.isSecondWinner);
    if (secondTeams.length > 0) {
      const secondRows = [headers, ...buildRowsForTeams(secondTeams)];
      const secondWs = XLSX.utils.aoa_to_sheet(secondRows);
      applySheetStyles(secondWs, secondRows.length, headers.length, '475569'); // Silver/Slate
      XLSX.utils.book_append_sheet(workbook, secondWs, '2nd Prize Winners');
    }

    // 4. 3rd Prize Winners Sheet
    const thirdTeams = filteredTeams.filter((t) => t.isThirdWinner);
    if (thirdTeams.length > 0) {
      const thirdRows = [headers, ...buildRowsForTeams(thirdTeams)];
      const thirdWs = XLSX.utils.aoa_to_sheet(thirdRows);
      applySheetStyles(thirdWs, thirdRows.length, headers.length, '92400E'); // Bronze
      XLSX.utils.book_append_sheet(workbook, thirdWs, '3rd Prize Winners');
    }

    // 5. General Participants Sheet (Non-Winners)
    const nonWinnerTeams = filteredTeams.filter((t) => !t.isFirstWinner && !t.isSecondWinner && !t.isThirdWinner);
    if (nonWinnerTeams.length > 0) {
      const nonWinnerRows = [headers, ...buildRowsForTeams(nonWinnerTeams)];
      const nonWinnerWs = XLSX.utils.aoa_to_sheet(nonWinnerRows);
      applySheetStyles(nonWinnerWs, nonWinnerRows.length, headers.length, '1E293B');
      XLSX.utils.book_append_sheet(workbook, nonWinnerWs, 'General Participants');
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `VEDA_Participant_Payments_Report_${dateStr}.xlsx`);
    toast.success(`Participant payments report exported successfully (${filteredTeams.length} teams)`);
  };

  const getPrizeChip = (prizeType) => {
    switch (prizeType) {
      case 'First Prize':
        return (
          <Chip
            icon={<TrophyIcon sx={{ fontSize: '18px !important', color: '#fff !important' }} />}
            label="1st Prize"
            sx={{
              fontWeight: 800,
              borderRadius: '8px',
              px: 0.5,
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)',
            }}
          />
        );
      case 'Second Prize':
        return (
          <Chip
            icon={<MedalIcon sx={{ fontSize: '18px !important', color: '#fff !important' }} />}
            label="2nd Prize"
            sx={{
              fontWeight: 800,
              borderRadius: '8px',
              px: 0.5,
              background: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(100, 116, 139, 0.35)',
            }}
          />
        );
      case 'Third Prize':
        return (
          <Chip
            icon={<MedalIcon sx={{ fontSize: '18px !important', color: '#fff !important' }} />}
            label="3rd Prize"
            sx={{
              fontWeight: 800,
              borderRadius: '8px',
              px: 0.5,
              background: 'linear-gradient(135deg, #d97706 0%, #92400e 100%)',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(146, 64, 14, 0.35)',
            }}
          />
        );
      default:
        return (
          <Chip
            label="Paid Participant"
            size="small"
            sx={{
              fontWeight: 700,
              borderRadius: '8px',
              bgcolor: 'rgba(5, 150, 105, 0.1)',
              color: '#059669',
              border: '1px solid rgba(5, 150, 105, 0.2)',
            }}
          />
        );
    }
  };

  const columns = [
    'S.No',
    'Status / Winner',
    'Team ID / Receipt',
    'Event Name',
    'School Name',
    'Registration Payment Info',
    'Team Members & Details',
    'Attendance',
    'Actions',
  ];

  const handleOpenTeam = (team) => {
    setSelectedTeam(team);
    setDialogOpen(true);
  };

  const handleOpenPass = (participant, team) => {
    setSelectedPassParticipant({
      ...participant,
      eventName: team.eventName,
      teamId: team.teamId,
      receipt: team.receipt,
      eventSchool: team.eventSchool,
      category: team.category,
      eventId: team.eventId,
    });
    setPassDialogOpen(true);
  };

  const rows = filteredTeams.map((team, index) => {
    const schoolCategory = team.eventSchool || team.category || team.schoolId || '-';
    const relatedEvent = allEvents.find((e) => e._id === team.eventId);
    let departmentNode = '-';
    if (relatedEvent && relatedEvent.department && relatedEvent.department.length > 0) {
      if (relatedEvent.department.length > 1) {
        departmentNode = {
          value: 'All Departments',
          display: (
            <span
              style={{ color: '#3b82f6', textDecoration: 'underline', cursor: 'pointer' }}
              onClick={() => {
                setDepartmentsToView(relatedEvent.department);
                setDepartmentsDialogOpen(true);
              }}
            >
              All Departments
            </span>
          ),
        };
      } else {
        departmentNode = relatedEvent.department[0].name;
      }
    }

    const attendancePercentage =
      team.totalMembers > 0
        ? Math.round((team.attendedCount / team.totalMembers) * 100)
        : 0;

    return [
      index + 1,
      {
        value: team.prizeType,
        display: getPrizeChip(team.prizeType),
      },
      {
        value: team.teamId || team.receipt || '-',
        display: (
          <Box>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 800, color: '#0f172a' }}>
              {team.teamId || team.receipt || '-'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Receipt: {team.receipt || '-'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Size: {team.totalMembers} Member{team.totalMembers > 1 ? 's' : ''}
            </Typography>
          </Box>
        ),
      },
      team.eventName || '-',
      schoolCategory,
      {
        value: `${team.amountRupees} ${team.razorpayPaymentId} ${team.paymentStatus}`,
        display: (
          <Box sx={{ p: 1, borderRadius: '8px', bgcolor: 'rgba(15, 23, 42, 0.02)', border: '1px solid rgba(0,0,0,0.06)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#059669' }}>
                ₹{team.amountRupees}
              </Typography>
              <Chip
                label={team.paymentStatus || 'PAID'}
                color={team.paymentStatus === 'PAID' || team.verified ? 'success' : 'warning'}
                size="small"
                sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontFamily: 'monospace' }}>
              Pay ID: {team.razorpayPaymentId || '-'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
              Date: {team.formattedPaidDate}
            </Typography>
          </Box>
        ),
      },
      {
        value: team.participants.map((p) => p.name).join(', '),
        display: (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, maxWidth: 360 }}>
            {team.participants.map((p, pIdx) => (
              <Box
                key={pIdx}
                sx={{
                  p: 1,
                  borderRadius: '8px',
                  bgcolor: 'action.hover',
                  border: '1px solid rgba(0,0,0,0.04)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {p.name || '-'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Roll: <strong>{p.roll || '-'}</strong> | {p.college || '-'}
                  </Typography>
                  {p.resolvedDept && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Dept: {p.resolvedDept} {p.year ? `(${p.year} Yr)` : ''}
                    </Typography>
                  )}
                  {p.accommodation === 'Yes' && (
                    <Typography variant="caption" sx={{ color: '#0284c7', fontWeight: 600 }}>
                      Acc: Yes ({p.accommodationPayment?.paid ? `Paid ₹${p.accommodationPayment.amount || 0}` : 'Unpaid'})
                    </Typography>
                  )}
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                  <Chip
                    label={p.attended ? 'Attended' : 'Absent'}
                    color={p.attended ? 'success' : 'default'}
                    size="small"
                    sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => handleOpenPass(p, team)}
                    sx={{ p: 0.25, color: '#059669' }}
                    title="View Pass"
                  >
                    <QrCodeIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              </Box>
            ))}
          </Box>
        ),
      },
      {
        value: `${team.attendedCount}/${team.totalMembers}`,
        display: (
          <Box sx={{ textAlign: 'center' }}>
            <Chip
              label={`${team.attendedCount} / ${team.totalMembers} Attended`}
              color={
                attendancePercentage === 100
                  ? 'success'
                  : attendancePercentage > 0
                  ? 'warning'
                  : 'default'
              }
              size="small"
              sx={{ fontWeight: 700, borderRadius: '8px' }}
            />
            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.25 }}>
              {attendancePercentage}% Attended
            </Typography>
          </Box>
        ),
      },
      {
        value: 'Actions',
        display: (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Tooltip title="View Team & Payment Details">
              <Button
                variant="outlined"
                size="small"
                startIcon={<ViewIcon />}
                onClick={() => handleOpenTeam(team)}
                sx={{
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  py: 0.5,
                  px: 1.5,
                  borderColor: '#3b82f6',
                  color: '#2563eb',
                  '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.08)' },
                }}
              >
                Full Details
              </Button>
            </Tooltip>
          </Box>
        ),
      },
    ];
  });

  return (
    <PageContainer>
      <PageHeader
        title="Participant Payments Report"
        subtitle="All paid participants report with complete registration, event, and accommodation payment information"
        action={
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/Eventveda/participants/winners-report')}
              startIcon={<ArrowBackIcon />}
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                px: 2,
                py: 0.8,
                borderColor: '#64748b',
                color: '#475569',
                '&:hover': { bgcolor: 'rgba(100, 116, 139, 0.08)' },
              }}
            >
              Winners Report
            </Button>
            <Button
              variant="contained"
              onClick={fetchParticipantPayments}
              startIcon={<RefreshIcon />}
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                px: 2.5,
                py: 0.8,
                bgcolor: '#3b82f6',
                '&:hover': { bgcolor: '#2563eb' },
              }}
            >
              Refresh
            </Button>
          </Box>
        }
      />

      {/* Summary Cards */}
      <Box sx={{ mt: 1, mb: 3 }}>
        <CountBand
          items={[
            {
              id: 'teams',
              title: 'Total Paid Teams',
              value: paidTeams.length,
              color: 'blue',
              icon: <PeopleIcon />,
            },
            {
              id: 'participants',
              title: 'Total Paid Participants',
              value: totalPaidParticipants,
              color: 'purple',
              icon: <PeopleIcon />,
            },
            {
              id: 'revenue',
              title: 'Total Revenue Collected',
              value: `₹${totalRevenueCollected.toLocaleString('en-IN')}`,
              color: 'green',
              icon: <CreditCardIcon />,
            },
            {
              id: '1st',
              title: '1st Prize Teams',
              value: firstPrizeTeams,
              color: 'orange',
              icon: <TrophyIcon />,
            },
            {
              id: '2nd_3rd',
              title: '2nd & 3rd Prize Teams',
              value: secondPrizeTeams + thirdPrizeTeams,
              color: 'red',
              icon: <MedalIcon />,
            },
          ]}
          total={{
            title: 'Paid Registrations',
            value: paidTeams.length,
          }}
        />
      </Box>

      {/* Filter Controls Bar */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 3,
          borderRadius: '16px',
          display: 'flex',
          gap: 2,
          alignItems: 'center',
          flexWrap: 'wrap',
          background: 'var(--bg-panel, #ffffff)',
        }}
      >
        <TextField
          placeholder="Search team ID, receipt, payment ID, roll, participant..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ width: { xs: '100%', sm: 300 }, flex: { sm: 1 } }}
        />

        <TextField
          select
          label="Filter Prize / Winner Status"
          size="small"
          value={prizeFilter}
          onChange={(e) => setPrizeFilter(e.target.value)}
          sx={{ width: { xs: '100%', sm: 200 } }}
        >
          <MenuItem value="ALL">All Paid Registrations</MenuItem>
          <MenuItem value="FIRST">🥇 1st Prize Winners</MenuItem>
          <MenuItem value="SECOND">🥈 2nd Prize Winners</MenuItem>
          <MenuItem value="THIRD">🥉 3rd Prize Winners</MenuItem>
          <MenuItem value="NON_WINNERS">👥 Non-Winner Participants</MenuItem>
        </TextField>

        <TextField
          select
          label="Filter Event"
          size="small"
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          sx={{ width: { xs: '100%', sm: 190 } }}
        >
          <MenuItem value="ALL">All Events</MenuItem>
          {uniqueEvents.map((evt) => (
            <MenuItem key={evt} value={evt}>
              {evt}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Filter School"
          size="small"
          value={schoolFilter}
          onChange={(e) => setSchoolFilter(e.target.value)}
          sx={{ width: { xs: '100%', sm: 160 } }}
        >
          <MenuItem value="ALL">All Schools</MenuItem>
          {uniqueSchools.map((s) => (
            <MenuItem key={s} value={s}>
              {s}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Filter Dept"
          size="small"
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          sx={{ width: { xs: '100%', sm: 150 } }}
        >
          <MenuItem value="ALL">All Depts</MenuItem>
          {uniqueDepartments.map((d) => (
            <MenuItem key={d} value={d}>
              {d}
            </MenuItem>
          ))}
        </TextField>

        <Box sx={{ ml: { sm: 'auto' }, width: { xs: '100%', sm: 'auto' } }}>
          <Button
            variant="contained"
            onClick={handleExportExcel}
            startIcon={<DownloadIcon />}
            disabled={filteredTeams.length === 0}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              px: 2.5,
              py: 0.8,
              fontWeight: 700,
              width: { xs: '100%', sm: 'auto' },
              background: 'var(--gradient-primary)',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
              '&:hover': {
                background: 'var(--gradient-primary-hover)',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)',
              },
              '&.Mui-disabled': {
                background: 'rgba(148, 163, 184, 0.12)',
                color: 'var(--text-secondary, #64748b)',
                opacity: 0.5,
              },
            }}
          >
            Download Excel
          </Button>
        </Box>
      </Paper>

      {/* DataTable */}
      {loading ? (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}>
          <CircularProgress size={36} color="warning" />
        </Box>
      ) : (
        <Box sx={{ mt: 2 }}>
          {filteredTeams.length === 0 ? (
            <EmptyState
              title="No Paid Participants Found"
              description="No paid participant records matching the selected search or filter criteria were found."
            />
          ) : (
            <DataTable
              columns={columns}
              rows={rows}
              nonSortableColumns={[0, 6, 8]}
              alignments={['center', 'center', 'left', 'left', 'left', 'left', 'left', 'center', 'center']}
            />
          )}
        </Box>
      )}

      {/* Team & Payment Details Modal */}
      {selectedTeam && (
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          fullWidth
          maxWidth="lg"
          PaperProps={{
            sx: { borderRadius: '20px', overflow: 'hidden' },
          }}
        >
          <DialogTitle
            sx={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: '#ffffff',
              py: 2,
              px: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <ReceiptIcon sx={{ color: '#38bdf8' }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff' }}>
                Participant Payment Details ({selectedTeam.teamId || selectedTeam.receipt})
              </Typography>
            </Box>
            <IconButton
              onClick={() => setDialogOpen(false)}
              sx={{ color: '#cbd5e1', '&:hover': { color: '#fff' } }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers sx={{ p: 3, background: 'var(--bg-panel, #ffffff)' }}>
            {/* Event & Status Header */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                  {selectedTeam.eventName || '-'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  School: <strong>{selectedTeam.eventSchool || selectedTeam.category || '-'}</strong> | Team Size: <strong>{selectedTeam.totalMembers}</strong>
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {getPrizeChip(selectedTeam.prizeType)}
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Registration Payment Details Grid */}
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 1 }}>
              <ReceiptIcon sx={{ color: '#059669' }} /> Registration Payment Information
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(5, 150, 105, 0.04)' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Registration Fee Paid
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#059669' }}>
                    ₹{selectedTeam.amountRupees}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '12px' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Payment Status
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={selectedTeam.paymentStatus || 'PAID'}
                      color={selectedTeam.paymentStatus === 'PAID' || selectedTeam.verified ? 'success' : 'warning'}
                      size="small"
                      sx={{ fontWeight: 700 }}
                    />
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '12px' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Razorpay Payment ID
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace', color: '#1e293b' }}>
                    {selectedTeam.razorpayPaymentId || '-'}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '12px' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Razorpay Order ID & Date
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace', color: '#1e293b' }}>
                    {selectedTeam.razorpayOrderId || '-'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedTeam.formattedPaidDate}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Participants & Accommodation Payment Details */}
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5, color: 'var(--text-primary)' }}>
              Team Participants & Accommodation Payments ({selectedTeam.participants.length})
            </Typography>

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Roll Number</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>College & Dept</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Contact</TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Attended</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Accommodation Details</TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Pass</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedTeam.participants.map((p, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{p.name || '-'}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{p.roll || '-'}</TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {p.college === 'Other College' && p.otherCollege ? p.otherCollege : (p.college || '-')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {p.computedBranch ? `Branch: ${p.computedBranch}` : ''} {p.resolvedDept ? `| Dept: ${p.resolvedDept}` : ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ display: 'block' }}>{p.mobile || '-'}</Typography>
                        <Typography variant="caption" color="text.secondary">{p.email || '-'}</Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Chip
                          label={p.attended ? 'Yes' : 'No'}
                          color={p.attended ? 'success' : 'error'}
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell>
                        {p.accommodation === 'Yes' ? (
                          <Box sx={{ p: 0.75, borderRadius: '6px', bgcolor: 'rgba(2, 132, 199, 0.05)', border: '1px solid rgba(2, 132, 199, 0.15)' }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#0284c7', display: 'block' }}>
                              Required ({p.daysCount || p.days || p.dayscount || 1} Day{ (p.daysCount || p.days || 1) > 1 ? 's' : '' })
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              Status: <strong>{p.accommodationPayment?.paid ? 'Paid' : 'Unpaid'}</strong> | Amt: ₹{p.accommodationPayment?.amount || 0}
                            </Typography>
                            {p.accommodationPayment?.razorpayPaymentId && (
                              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.65rem', display: 'block' }}>
                                Pay ID: {p.accommodationPayment.razorpayPaymentId}
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            Not Required
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <IconButton size="small" onClick={() => handleOpenPass(p, selectedTeam)} sx={{ color: '#059669' }}>
                          <QrCodeIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>

          <DialogActions sx={{ p: 2, px: 3 }}>
            <Button variant="contained" onClick={() => setDialogOpen(false)} sx={{ borderRadius: '8px', textTransform: 'none' }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Pass Modal */}
      {selectedPassParticipant && (
        <Dialog
          open={passDialogOpen}
          onClose={() => setPassDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { borderRadius: '20px', overflow: 'hidden' },
          }}
        >
          <DialogTitle
            sx={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: '#ffffff',
              py: 2,
              px: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <QrCodeIcon sx={{ color: '#38bdf8' }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff' }}>
                Event Pass
              </Typography>
            </Box>
            <IconButton
              onClick={() => setPassDialogOpen(false)}
              sx={{ color: '#cbd5e1', '&:hover': { color: '#fff' } }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ p: 4, background: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <EventPassCard participant={selectedPassParticipant} />
          </DialogContent>
        </Dialog>
      )}

      {/* Departments Modal */}
      <Dialog open={departmentsDialogOpen} onClose={() => setDepartmentsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>All Departments</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, p: 1 }}>
            {departmentsToView.map((d, i) => (
              <Chip key={i} label={d?.name || d} sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#1e40af' }} />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDepartmentsDialogOpen(false)} variant="contained" sx={{ textTransform: 'none' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default ParticipantPayments;
