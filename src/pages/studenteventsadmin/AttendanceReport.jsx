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
} from '@mui/material';
import {
  People as PeopleIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  School as SchoolIcon,
  Event as EventIcon,
  Badge as BadgeIcon,
  CheckCircle as CheckCircleIcon,
  QrCode as QrCodeIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  Groups as GroupsIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import * as XLSX from 'xlsx-js-style';
import { useNavigate, useLocation } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/data/DataTable';
import { PageContainer, EmptyState } from '../../components/common/design-system';
import StatCard from '../../components/common/StatCard';
import StatCardGrid from '../../components/common/StatCardGrid';
import API from '../../api/axios';
import { fetchEventDepartments } from '../../api/eventDepartmentApi';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import EventPassCard from '../../components/EventPass/EventPassCard';

const AttendanceReport = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeRole, user } = useAuth();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPassParticipant, setSelectedPassParticipant] = useState(null);
  const [passDialogOpen, setPassDialogOpen] = useState(false);

  const [allEvents, setAllEvents] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [departmentsDialogOpen, setDepartmentsDialogOpen] = useState(false);
  const [departmentsToView, setDepartmentsToView] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [eventFilter, setEventFilter] = useState('ALL');
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [schoolFilter, setSchoolFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [branchMap, setBranchMap] = useState({});

  const fetchAttendedParticipants = useCallback(async () => {
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
        const userEvents = fetchedEvents.filter(e => {
          const coords = e.facultyCoordinators || (e.facultyCoordinator ? [e.facultyCoordinator] : []);
          return coords.some(c =>
            c.employeeId === user.institutionId ||
            c.employeeId === user.employeeId ||
            c.employeeId === user.employeeCode
          );
        });
        allowedEventNames = userEvents.map(e => e.eventName);
      }

      // Query razorpay registrations with attended filter
      const response = await API.get('/api/razorpay/registrations?attended=true');
      let fetchedPayments = response.data?.payments || [];

      fetchedPayments = fetchedPayments.filter(p => p.paymentStatus === 'PAID' || p.verified === true);
      if (allowedEventNames) {
        fetchedPayments = fetchedPayments.filter(p => allowedEventNames.includes(p.eventName || p.category));
      }

      fetchedPayments = fetchedPayments.map(p => {
        const eventMatch = fetchedEvents.find(e => e.eventName === (p.eventName || p.category));
        return {
          ...p,
          venue: eventMatch ? (
            eventMatch.venueType === 'Indoor' && eventMatch.building && eventMatch.floor
              ? `${eventMatch.roomNo ? `Room No: ${eventMatch.roomNo}, ` : ''}${eventMatch.building.name || eventMatch.building} - ${eventMatch.floor.name || eventMatch.floor}`
              : eventMatch.venueType === 'Outdoor' && eventMatch.ground
                ? `${eventMatch.roomNo ? `Room No: ${eventMatch.roomNo}, ` : ''}${eventMatch.ground.name || eventMatch.ground}`
                : eventMatch.venue
          ) : null,
          eventGroup: eventMatch?.group?.name || eventMatch?.group || '-',
          eventCategory: eventMatch?.category?.name || eventMatch?.category || p.category || '-',
          eventSchool: eventMatch?.eventSchool?.name || p.category || p.schoolId || '-'
        };
      });

      setPayments(fetchedPayments);

      // Branch resolution for rolls missing branch
      const missingRolls = new Set();
      fetchedPayments.forEach(pay => {
        if (Array.isArray(pay.participants)) {
          pay.participants.forEach(p => {
            if (p.attended && !p.branch && p.roll && p.roll.length > 5 && (!p.college || p.college.toLowerCase().includes('aditya'))) {
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
            const studentObj = Array.isArray(data) && data.length > 0 ? data[0] : (data?.value && Array.isArray(data.value) && data.value.length > 0 ? data.value[0] : (data && typeof data === 'object' ? data : null));
            if (studentObj) {
              branch = studentObj.branch || studentObj.branch_name || studentObj.branchName || studentObj.BRANCH;
            }
            if (branch) {
              setBranchMap(prev => ({ ...prev, [roll]: String(branch).trim() }));
            }
          } catch (err) {
            console.error(`Failed to fetch branch for ${roll}`, err);
          }
        });
      }

    } catch (error) {
      console.error('Error fetching attended participants:', error);
      toast.error(error.response?.data?.message || 'Failed to load attendance report');
    } finally {
      setLoading(false);
    }
  }, [activeRole, user]);

  useEffect(() => {
    fetchAttendedParticipants();
  }, [fetchAttendedParticipants]);

  const deptLookupMap = useMemo(() => {
    const map = {};
    allDepartments.forEach(d => {
      if (d && d.name) {
        const canonical = d.name.trim();
        map[canonical.toUpperCase()] = canonical;
        if (d.alternativeNames) {
          d.alternativeNames.split(',').forEach(alt => {
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

  const resolveStudentDepartment = useCallback((p) => {
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
  }, [deptLookupMap]);

  // Extract ONLY participants who have attended (attended === true)
  const allAttendedParticipants = useMemo(() => {
    const list = [];
    payments.forEach((payment) => {
      if (Array.isArray(payment.participants)) {
        payment.participants.forEach((participant, pIdx) => {
          // Strictly filter for attended participants
          if (participant.attended === true || participant.attended === 'true' || participant.attended === 1) {
            list.push({
              ...participant,
              id: `${payment._id || payment.receipt}-${pIdx}`,
              paymentId: payment._id,
              receipt: payment.receipt,
              eventName: payment.eventName || payment.category || 'Event',
              category: payment.category,
              schoolId: payment.schoolId,
              eventId: payment.eventId,
              razorpayPaymentId: payment.razorpayPaymentId,
              razorpayOrderId: payment.razorpayOrderId,
              amount: payment.amountRupees ?? payment.amount,
              paidAt: payment.createdAt || payment.paidAt,
              venue: payment.venue,
              eventGroup: payment.eventGroup || '-',
              eventCategory: payment.eventCategory || '-',
              eventSchool: payment.eventSchool || '-',
              teamId: payment.teamId,
              computedBranch: participant.branch || branchMap[participant.roll?.toUpperCase()] || '',
            });
          }
        });
      }
    });
    return list;
  }, [payments, branchMap]);

  const uniqueEvents = useMemo(() => {
    const eventsSet = new Set();
    allAttendedParticipants.forEach((p) => {
      if (p.eventName) eventsSet.add(p.eventName);
    });
    return Array.from(eventsSet).sort();
  }, [allAttendedParticipants]);

  const uniqueSchools = useMemo(() => {
    const set = new Set();
    allAttendedParticipants.forEach(p => {
      const school = p.eventSchool || p.category || p.schoolId;
      if (school && school !== '-') set.add(school);
    });
    return Array.from(set).sort();
  }, [allAttendedParticipants]);

  const uniqueDepartments = useMemo(() => {
    const set = new Set(['AIML', 'AIDS', 'CE', 'CSE', 'ECE', 'EEE', 'FS', 'IT', 'ME', 'PT', 'MinE', 'AgE', 'BBA', 'BCA', 'MCA', 'MBA']);
    allDepartments.forEach(d => {
      if (d?.name) set.add(d.name.trim());
    });
    allAttendedParticipants.forEach(p => {
      const dept = resolveStudentDepartment(p);
      if (dept) set.add(dept);
    });
    return Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [allDepartments, allAttendedParticipants, resolveStudentDepartment]);

  const filteredParticipants = useMemo(() => {
    return allAttendedParticipants.filter((p) => {
      if (eventFilter !== 'ALL' && p.eventName !== eventFilter) return false;
      if (genderFilter !== 'ALL' && p.gender?.toLowerCase() !== genderFilter.toLowerCase()) return false;

      if (schoolFilter !== 'ALL') {
        const schoolCategory = p.eventSchool || p.category || p.schoolId;
        if (schoolCategory !== schoolFilter) return false;
      }

      if (departmentFilter !== 'ALL') {
        const dept = resolveStudentDepartment(p);
        if (!dept || dept.toUpperCase() !== departmentFilter.toUpperCase()) return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const name = (p.name || '').toLowerCase();
        const roll = (p.roll || '').toLowerCase();
        const email = (p.email || '').toLowerCase();
        const mobile = (p.mobile || '').toLowerCase();
        const college = (p.college || '').toLowerCase();
        const dept = (resolveStudentDepartment(p) || p.department || '').toLowerCase();
        const eventName = (p.eventName || '').toLowerCase();
        const receipt = (p.receipt || '').toLowerCase();
        const teamId = (p.teamId || '').toLowerCase();
        const barcode = (p.barcode || '').toLowerCase();

        return (
          name.includes(query) ||
          roll.includes(query) ||
          email.includes(query) ||
          mobile.includes(query) ||
          college.includes(query) ||
          dept.includes(query) ||
          eventName.includes(query) ||
          receipt.includes(query) ||
          teamId.includes(query) ||
          barcode.includes(query)
        );
      }

      return true;
    });
  }, [allAttendedParticipants, eventFilter, genderFilter, schoolFilter, departmentFilter, searchQuery, resolveStudentDepartment]);

  const uniqueCollegesCount = useMemo(() => {
    const set = new Set();
    allAttendedParticipants.forEach((p) => {
      if (p.college) set.add(p.college);
    });
    return set.size;
  }, [allAttendedParticipants]);

  const maleCount = useMemo(() => {
    return filteredParticipants.filter((p) => p.gender?.toLowerCase() === 'male').length;
  }, [filteredParticipants]);

  const femaleCount = useMemo(() => {
    return filteredParticipants.filter((p) => p.gender?.toLowerCase() === 'female').length;
  }, [filteredParticipants]);

  // Export to Excel with xlsx-js-style
  const handleExportExcel = () => {
    if (filteredParticipants.length === 0) {
      toast.error('No attended participants data to export.');
      return;
    }

    const headers = [
      'S.No', 'Name', 'Roll No', 'Team ID', 'School Name', 'Event Name', 'Event Department(s)',
      'College', 'Branch', 'Student Department', 'Student Year', 'Gender', 'Mobile', 'Email', 'Attended', 'Barcode'
    ];

    const colWidths = [
      { wch: 6 }, { wch: 26 }, { wch: 16 }, { wch: 16 }, { wch: 22 },
      { wch: 28 }, { wch: 32 }, { wch: 26 }, { wch: 16 }, { wch: 20 },
      { wch: 14 }, { wch: 10 }, { wch: 16 }, { wch: 28 }, { wch: 14 }, { wch: 14 }
    ];

    const applySheetStyles = (ws, headerColsCount) => {
      ws['!cols'] = colWidths;
      for (let c = 0; c < headerColsCount; c++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c });
        if (ws[cellRef]) {
          ws[cellRef].s = {
            font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
            fill: { fgColor: { rgb: '166534' } }, // Rich emerald green for Attendance Report
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
            border: {
              top: { style: 'thin', color: { rgb: 'CBD5E1' } },
              bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
              left: { style: 'thin', color: { rgb: 'CBD5E1' } },
              right: { style: 'thin', color: { rgb: 'CBD5E1' } }
            }
          };
        }
      }
    };

    const mapParticipantToRow = (p, idx) => {
      const collegeName = p.college === 'Other College' && p.otherCollege ? p.otherCollege : (p.college || '');
      const schoolCategory = p.eventSchool || p.category || p.schoolId || '-';
      const relatedEvent = allEvents.find(e => e._id === p.eventId);
      let eventDepartmentStr = '-';
      if (relatedEvent && relatedEvent.department && relatedEvent.department.length > 0) {
        eventDepartmentStr = relatedEvent.department.map(d => d.name).join(', ');
      }
      const studentDept = resolveStudentDepartment(p);

      return [
        idx + 1, p.name || '', p.roll || '', p.teamId || '', schoolCategory,
        p.eventName || '', eventDepartmentStr, collegeName, p.computedBranch || p.branch || '',
        studentDept, p.year || '', p.gender || '', p.mobile || '', p.email || '', 'Yes', p.barcode || ''
      ];
    };

    const workbook = XLSX.utils.book_new();

    // Master Sheet: All Attended Participants
    const allRows = [headers, ...filteredParticipants.map((p, idx) => mapParticipantToRow(p, idx))];
    const allWs = XLSX.utils.aoa_to_sheet(allRows);
    applySheetStyles(allWs, headers.length);
    XLSX.utils.book_append_sheet(workbook, allWs, 'All Attended');

    // Group by Student Department
    const deptMap = {};
    filteredParticipants.forEach((p) => {
      const deptKey = resolveStudentDepartment(p) || 'Other Dept';
      if (!deptMap[deptKey]) deptMap[deptKey] = [];
      deptMap[deptKey].push(p);
    });

    const usedSheetNames = new Set(['all attended']);
    const sortedDeptKeys = Object.keys(deptMap).sort((a, b) => a.localeCompare(b));

    sortedDeptKeys.forEach((deptKey) => {
      const deptParticipants = deptMap[deptKey];
      const deptRows = [headers, ...deptParticipants.map((p, idx) => mapParticipantToRow(p, idx))];
      const deptWs = XLSX.utils.aoa_to_sheet(deptRows);
      applySheetStyles(deptWs, headers.length);

      let cleanName = deptKey.replace(/[\\/?*:[\]]/g, '').trim().substring(0, 31) || 'Dept';
      let uniqueName = cleanName;
      let counter = 1;
      while (usedSheetNames.has(uniqueName.toLowerCase())) {
        uniqueName = `${cleanName.substring(0, 27)}_${counter}`;
        counter++;
      }
      usedSheetNames.add(uniqueName.toLowerCase());
      XLSX.utils.book_append_sheet(workbook, deptWs, uniqueName);
    });

    // Write file
    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `VEDA_Attendance_Report_${dateStr}.xlsx`);
    toast.success(`Attendance report exported successfully (${filteredParticipants.length} participants)`);
  };

  const columns = [
    'S.No',
    'Name',
    'Roll Number',
    'Team ID',
    'School Name',
    'EVENT NAME',
    'Department(s)',
    'College',
    'Branch & Dept / Year',
    'Contact Info',
    'Attendance',
    'Actions'
  ];

  const handleOpenDetails = (participant) => {
    setSelectedParticipant(participant);
    setDialogOpen(true);
  };

  const handleOpenPass = (participant) => {
    setSelectedPassParticipant(participant);
    setPassDialogOpen(true);
  };

  const rows = filteredParticipants.map((p, index) => {
    const schoolCategory = p.eventSchool || p.category || p.schoolId || '-';
    const relatedEvent = allEvents.find(e => e._id === p.eventId);
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
          )
        };
      } else {
        departmentNode = relatedEvent.department[0].name;
      }
    }

    const resolvedDept = resolveStudentDepartment(p);

    return [
      index + 1,
      {
        value: p.name || '-',
        display: (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              {p.name || '-'}
            </Typography>
            {p.gender ? (
              <Typography variant="caption" color="text.secondary">
                Gender: {p.gender}
              </Typography>
            ) : null}
          </Box>
        ),
      },
      p.roll ? (
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, bgcolor: 'action.hover', px: 1, py: 0.25, borderRadius: '6px', display: 'inline-block' }}>
          {p.roll}
        </Typography>
      ) : '-',
      p.teamId || '-',
      schoolCategory,
      p.eventName || '-',
      departmentNode,
      p.college ? (p.college === 'Other College' && p.otherCollege ? p.otherCollege : p.college) : '-',
      <Box>
        {p.computedBranch && (
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Branch: {p.computedBranch}
          </Typography>
        )}
        <Typography variant="body2">
          {resolvedDept ? `Dept: ${resolvedDept}${p.year ? ' | Yr: ' + p.year : ''}` : (p.year ? `Yr: ${p.year}` : '-')}
        </Typography>
      </Box>,
      <Box>
        {p.mobile ? <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>Ph: {p.mobile}</Typography> : null}
        {p.email ? <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{p.email}</Typography> : null}
      </Box>,
      {
        value: 'Attended',
        display: (
          <Chip
            icon={<CheckCircleIcon sx={{ fontSize: '16px !important' }} />}
            label="Attended"
            color="success"
            size="small"
            sx={{
              fontWeight: 700,
              borderRadius: '8px',
              px: 0.5,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)'
            }}
          />
        ),
      },
      {
        value: 'Actions',
        display: (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="View Student Profile">
              <IconButton size="small" onClick={() => handleOpenDetails(p)} sx={{ color: '#2563eb' }}>
                <ViewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="View Event Pass">
              <IconButton size="small" onClick={() => handleOpenPass(p)} sx={{ color: '#059669' }}>
                <QrCodeIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )
      }
    ];
  });

  return (
    <PageContainer>
      <PageHeader
        title="Attendance Report"
        subtitle="Report of participants who have attended the events (Attended: Yes)"
        action={
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button
              variant="contained"
              onClick={fetchAttendedParticipants}
              startIcon={<RefreshIcon />}
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                px: 2.5,
                py: 1,
                bgcolor: '#3b82f6',
                '&:hover': { bgcolor: '#2563eb' }
              }}
            >
              Refresh
            </Button>
          </Box>
        }
      />

      {/* Top Navigation Tabs Switcher */}
      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          mb: 3,
          p: 0.75,
          bgcolor: 'var(--bg-panel, #ffffff)',
          borderRadius: '14px',
          border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
          width: 'fit-content',
        }}
      >
        <Button
          variant="text"
          startIcon={<GroupsIcon />}
          onClick={() => navigate('/Eventveda/participants/all')}
          sx={{
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 600,
            px: 2,
            py: 0.75,
            color: 'text.secondary',
            '&:hover': { bgcolor: 'action.hover' }
          }}
        >
          All Participants
        </Button>
        <Button
          variant="contained"
          startIcon={<AssignmentTurnedInIcon />}
          sx={{
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 700,
            px: 2.2,
            py: 0.75,
            bgcolor: '#16a34a',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
            '&:hover': { bgcolor: '#15803d' }
          }}
        >
          Attendance Report ({allAttendedParticipants.length})
        </Button>
        <Button
          variant="text"
          startIcon={<TrophyIcon />}
          onClick={() => navigate('/Eventveda/participants/winners-report')}
          sx={{
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 600,
            px: 2,
            py: 0.75,
            color: 'text.secondary',
            '&:hover': { bgcolor: 'action.hover', color: '#f59e0b' }
          }}
        >
          Winners Report
        </Button>
      </Box>

      {/* Summary Cards */}
      <StatCardGrid sx={{ mt: 1, mb: 3 }}>
        <StatCard
          title="Total Attended"
          value={allAttendedParticipants.length}
          color="#16a34a"
          icon={<CheckCircleIcon />}
        />
        {/* <StatCard
          title="Filtered Attended"
          value={filteredParticipants.length}
          color="#d97706"
          icon={<PeopleIcon />}
        />
        <StatCard
          title="Events Represented"
          value={uniqueEvents.length}
          color="#9333ea"
          icon={<EventIcon />}
        />
        <StatCard
          title="Colleges Represented"
          value={uniqueCollegesCount}
          color="#2563eb"
          icon={<SchoolIcon />}
        /> */}
        <StatCard
          title="Male Attended"
          value={maleCount}
          color="#0284c7"
          icon={<PeopleIcon />}
        />
        <StatCard
          title="Female Attended"
          value={femaleCount}
          color="#db2777"
          icon={<PeopleIcon />}
        />
      </StatCardGrid>

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
          placeholder="Search by name, roll no, team ID, email..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ width: { xs: '100%', sm: 280 }, flex: { sm: 1 } }}
        />

        <TextField
          select
          label="Filter Event"
          size="small"
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          sx={{ width: { xs: '100%', sm: 200 } }}
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
          sx={{ width: { xs: '100%', sm: 180 } }}
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
          sx={{ width: { xs: '100%', sm: 160 } }}
        >
          <MenuItem value="ALL">All Depts</MenuItem>
          {uniqueDepartments.map((d) => (
            <MenuItem key={d} value={d}>
              {d}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Gender"
          size="small"
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value)}
          sx={{ width: { xs: '100%', sm: 140 } }}
        >
          <MenuItem value="ALL">All Genders</MenuItem>
          <MenuItem value="MALE">Male</MenuItem>
          <MenuItem value="FEMALE">Female</MenuItem>
        </TextField>

        <Box sx={{ ml: { sm: 'auto' }, width: { xs: '100%', sm: 'auto' } }}>
          <Button
            variant="contained"
            onClick={handleExportExcel}
            startIcon={<DownloadIcon />}
            disabled={filteredParticipants.length === 0}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              px: 2.5,
              py: 0.8,
              fontWeight: 700,
              width: { xs: '100%', sm: 'auto' },
              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(22, 163, 74, 0.35)',
              '&:hover': {
                background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)',
                boxShadow: '0 6px 20px rgba(22, 163, 74, 0.5)',
              },
              '&.Mui-disabled': {
                background: 'rgba(148, 163, 184, 0.12)',
                color: 'var(--text-secondary, #64748b)',
                opacity: 0.5,
              },
            }}
          >
            Download Excel ({filteredParticipants.length})
          </Button>
        </Box>
      </Paper>

      {/* DataTable */}
      {loading ? (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}>
          <CircularProgress size={36} color="success" />
        </Box>
      ) : (
        <Box sx={{ mt: 2 }}>
          {filteredParticipants.length === 0 ? (
            <EmptyState
              title="No Attended Participants Found"
              description="Either no participants have been marked as attended yet, or try adjusting your search/filter criteria."
            />
          ) : (
            <DataTable
              columns={columns}
              rows={rows}
              nonSortableColumns={[0, 10, 11]}
              alignments={['center', 'left', 'left', 'center', 'left', 'left', 'left', 'left', 'left', 'left', 'center', 'center']}
            />
          )}
        </Box>
      )}

      {/* Participant Detail Modal */}
      {selectedParticipant && (
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          fullWidth
          maxWidth="sm"
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
              <BadgeIcon sx={{ color: '#38bdf8' }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff' }}>
                Attended Participant Profile
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
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                  {selectedParticipant.name || '-'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Roll Number: <strong>{selectedParticipant.roll || '-'}</strong> | Gender: <strong>{selectedParticipant.gender || '-'}</strong>
                </Typography>
              </Box>
              <Chip
                icon={<CheckCircleIcon sx={{ fontSize: '16px !important' }} />}
                label="Attended"
                color="success"
                size="small"
                sx={{ fontWeight: 700 }}
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                  Event Name
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {selectedParticipant.eventName || '-'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                  Team ID
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace', mt: 0.5 }}>
                  {selectedParticipant.teamId || '-'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                  Receipt Number
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace', mt: 0.5 }}>
                  {selectedParticipant.receipt || '-'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                  College Name
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                  {selectedParticipant.college === 'Other College' && selectedParticipant.otherCollege ? selectedParticipant.otherCollege : (selectedParticipant.college || '-')}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                  Branch & Dept & Year
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                  {selectedParticipant.computedBranch ? `Branch: ${selectedParticipant.computedBranch} | ` : ''} {selectedParticipant.department ? `Dept: ${selectedParticipant.department}` : ''} {selectedParticipant.year ? `| Year: ${selectedParticipant.year}` : ''}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                  Mobile Number
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                  {selectedParticipant.mobile || '-'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                  Email Address
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                  {selectedParticipant.email || '-'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                  Barcode
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace', mt: 0.5 }}>
                  {selectedParticipant.barcode || '-'}
                </Typography>
              </Grid>
            </Grid>
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
              <BadgeIcon sx={{ color: '#38bdf8' }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff' }}>
                Event Pass (Attended)
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

export default AttendanceReport;
