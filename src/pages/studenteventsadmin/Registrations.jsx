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
} from '@mui/material';
import {
  People as PeopleIcon,
  Payment as PaymentIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  School as SchoolIcon,
  Hotel as AccommodationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Event as EventIcon,
  Badge as BadgeIcon,
} from '@mui/icons-material';
import * as XLSX from 'xlsx-js-style';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/data/DataTable';
import { PageContainer, EmptyState } from '../../components/common/design-system';
import ActionButton from '../../components/common/ActionButton';
import StatCard from '../../components/common/StatCard';
import StatCardGrid from '../../components/common/StatCardGrid';
import API from '../../api/axios';
import { fetchEventDepartments } from '../../api/eventDepartmentApi';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../../context/AuthContext';
import EventPassCard from '../../components/EventPass/EventPassCard';

const Registrations = () => {
  const navigate = useNavigate();
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
  const [accommodationFilter, setAccommodationFilter] = useState('ALL');
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [schoolFilter, setSchoolFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [branchMap, setBranchMap] = useState({});

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const [eventsRes, deptsRes] = await Promise.all([
        API.get('/api/events'),
        fetchEventDepartments().catch(() => ({ data: { departments: [] } })),
      ]);
      const allEvents = eventsRes.data?.events || [];
      const fetchedDepts = deptsRes.data?.departments || [];
      setAllEvents(allEvents);
      setAllDepartments(fetchedDepts);

      let allowedEventNames = null;
      if (activeRole === 'FACULTY_COORDINATOR' && user) {
        const userEvents = allEvents.filter(e => {
          const coords = e.facultyCoordinators || (e.facultyCoordinator ? [e.facultyCoordinator] : []);
          return coords.some(c =>
            c.employeeId === user.institutionId ||
            c.employeeId === user.employeeId ||
            c.employeeId === user.employeeCode
          );
        });
        allowedEventNames = userEvents.map(e => e.eventName);
      }

      const response = await API.get('/api/razorpay/registrations');
      let fetchedPayments = response.data?.payments || [];
      
      // Only display registrations with PAID status
      fetchedPayments = fetchedPayments.filter(p => p.paymentStatus === 'PAID' || p.verified === true);

      if (allowedEventNames) {
        fetchedPayments = fetchedPayments.filter(p => allowedEventNames.includes(p.eventName || p.category));
      }

      fetchedPayments = fetchedPayments.map(p => {
        const eventMatch = allEvents.find(e => e.eventName === (p.eventName || p.category));
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

      // Fetch missing branches asynchronously
      const missingRolls = new Set();
      fetchedPayments.forEach(pay => {
        if (Array.isArray(pay.participants)) {
          pay.participants.forEach(p => {
            if (!p.branch && p.roll && p.roll.length > 5 && (!p.college || p.college.toLowerCase().includes('aditya'))) {
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
      console.error('Error fetching event registrations:', error);
      toast.error(error.response?.data?.message || 'Failed to load registrations');
    } finally {
      setLoading(false);
    }
  }, [activeRole, user]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Lookup map for department names and alternative names / branch codes (e.g. "117" -> "BCA")
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

  // Helper to resolve student department from department name, branch code, or alternative names
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

  // Flatten all participants across payment registrations
  const allParticipants = useMemo(() => {
    const list = [];
    payments.forEach((payment) => {
      if (Array.isArray(payment.participants)) {
        payment.participants.forEach((participant, pIdx) => {
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
        });
      }
    });
    return list;
  }, [payments, branchMap]);

  // Extract unique events for filter dropdown
  const uniqueEvents = useMemo(() => {
    const eventsSet = new Set();
    allParticipants.forEach((p) => {
      if (p.eventName) eventsSet.add(p.eventName);
    });
    return Array.from(eventsSet).sort();
  }, [allParticipants]);

  const uniqueSchools = useMemo(() => {
    const set = new Set();
    allParticipants.forEach(p => {
      const school = p.eventSchool || p.category || p.schoolId;
      if (school && school !== '-') set.add(school);
    });
    return Array.from(set).sort();
  }, [allParticipants]);

  const uniqueDepartments = useMemo(() => {
    const set = new Set(['AIML', 'AIDS', 'CE', 'CSE', 'ECE', 'EEE', 'FS', 'IT', 'ME', 'PT', 'MinE', 'AgE', 'BBA', 'BCA', 'MCA', 'MBA']);
    allDepartments.forEach(d => {
      if (d?.name) set.add(d.name.trim());
    });
    allParticipants.forEach(p => {
      const dept = resolveStudentDepartment(p);
      if (dept) set.add(dept);
    });
    return Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [allDepartments, allParticipants, resolveStudentDepartment]);

  // Apply filters
  const filteredParticipants = useMemo(() => {
    return allParticipants.filter((p) => {
      // Event filter
      if (eventFilter !== 'ALL' && p.eventName !== eventFilter) return false;

      // Accommodation filter
      if (accommodationFilter === 'YES' && p.accommodation?.toLowerCase() !== 'yes') return false;
      if (accommodationFilter === 'NO' && p.accommodation?.toLowerCase() === 'yes') return false;

      // Gender filter
      if (genderFilter !== 'ALL' && p.gender?.toLowerCase() !== genderFilter.toLowerCase()) return false;

      // School filter
      if (schoolFilter !== 'ALL') {
        const schoolCategory = p.eventSchool || p.category || p.schoolId;
        if (schoolCategory !== schoolFilter) return false;
      }

      // Department filter
      if (departmentFilter !== 'ALL') {
        const dept = resolveStudentDepartment(p);
        if (!dept || dept.toUpperCase() !== departmentFilter.toUpperCase()) return false;
      }

      // Search query
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

        return (
          name.includes(query) ||
          roll.includes(query) ||
          email.includes(query) ||
          mobile.includes(query) ||
          college.includes(query) ||
          dept.includes(query) ||
          eventName.includes(query) ||
          receipt.includes(query)
        );
      }

      return true;
    });
  }, [allParticipants, eventFilter, accommodationFilter, genderFilter, schoolFilter, departmentFilter, searchQuery, resolveStudentDepartment]);

  // Metrics
  const accommodationCount = useMemo(() => {
    return allParticipants.filter((p) => p.accommodation?.toLowerCase() === 'yes').length;
  }, [allParticipants]);

  const maleAccommodationCount = useMemo(() => {
    return allParticipants.filter((p) => p.accommodation?.toLowerCase() === 'yes' && p.gender?.toLowerCase() === 'male').length;
  }, [allParticipants]);

  const femaleAccommodationCount = useMemo(() => {
    return allParticipants.filter((p) => p.accommodation?.toLowerCase() === 'yes' && p.gender?.toLowerCase() === 'female').length;
  }, [allParticipants]);

  const uniqueCollegesCount = useMemo(() => {
    const set = new Set();
    allParticipants.forEach((p) => {
      if (p.college) set.add(p.college);
    });
    return set.size;
  }, [allParticipants]);

  // Multi-sheet Excel Export handler with individual department sheets
  const handleExportExcel = () => {
    if (filteredParticipants.length === 0) {
      toast.error('No registrations data to export.');
      return;
    }

    const headers = [
      'S.No',
      'Name',
      'Roll No',
      'Team ID',
      'School Name',
      'Event Name',
      'Event Department(s)',
      'College',
      'Branch',
      'Student Department',
      'Student Year',
      'Gender',
      'Mobile',
      'Email'
    ];

    const colWidths = [
      { wch: 6 },
      { wch: 26 },
      { wch: 16 },
      { wch: 16 },
      { wch: 22 },
      { wch: 28 },
      { wch: 32 },
      { wch: 25 },
      { wch: 16 },
      { wch: 20 },
      { wch: 12 },
      { wch: 10 },
      { wch: 15 },
      { wch: 28 }
    ];

    const applySheetStyles = (ws, headerColsCount) => {
      ws['!cols'] = colWidths;
      for (let c = 0; c < headerColsCount; c++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c });
        if (ws[cellRef]) {
          ws[cellRef].s = {
            font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
            fill: { fgColor: { rgb: '1E3A8A' } },
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
      const relatedEvent = allEvents.find(e => e._id === p.eventId);
      const schoolCategory = relatedEvent?.school?.name || p.eventSchool || p.category || p.schoolId || '-';
      let eventDepartmentStr = '-';
      if (relatedEvent && relatedEvent.department && relatedEvent.department.length > 0) {
        eventDepartmentStr = relatedEvent.department.map(d => d.name).join(', ');
      }
      const studentDept = resolveStudentDepartment(p);

      return [
        idx + 1,
        p.name || '',
        p.roll || '',
        p.teamId || '',
        schoolCategory,
        p.eventName || '',
        eventDepartmentStr,
        collegeName,
        p.computedBranch || p.branch || '',
        studentDept,
        p.year || '',
        p.gender || '',
        p.mobile || '',
        p.email || ''
      ];
    };

    const workbook = XLSX.utils.book_new();

    // 1. Master sheet: "All Registrations"
    const allRows = [headers, ...filteredParticipants.map((p, idx) => mapParticipantToRow(p, idx))];
    const allWs = XLSX.utils.aoa_to_sheet(allRows);
    applySheetStyles(allWs, headers.length);
    XLSX.utils.book_append_sheet(workbook, allWs, 'All Registrations');

    // 2. Group by resolved Student Department for individual sheets
    const deptMap = {};
    filteredParticipants.forEach((p) => {
      const deptKey = resolveStudentDepartment(p) || 'Other Dept';
      if (!deptMap[deptKey]) {
        deptMap[deptKey] = [];
      }
      deptMap[deptKey].push(p);
    });

    const usedSheetNames = new Set(['all registrations']);
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

    const fileName = `VEDA_Event_Registrations_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    toast.success('Registrations exported to Excel with department-wise sheets successfully!');
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
    'Action',
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
    const isAccomm = p.accommodation?.toLowerCase() === 'yes';

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
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
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
        {p.mobile ? (
          <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>
            Ph: {p.mobile}
          </Typography>
        ) : null}
        {p.email ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {p.email}
          </Typography>
        ) : null}
      </Box>,
      {
        value: '',
        display: (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ViewIcon />}
              onClick={() => handleOpenDetails(p)}
              sx={{ borderRadius: '8px', textTransform: 'none' }}
            >
              Details
            </Button>
          </Box>
        ),
      },
    ];
  });

  return (
    <PageContainer>
      <PageHeader
        title="Event Registrations"
        subtitle="View and manage paid event participant registrations"
        breadcrumbs={[
          { label: 'Dashboard', path: '/' },
          { label: 'Student Event Admin', path: '/dashboard' },
          { label: 'Registrations' },
        ]}
        actions={
          <ActionButton
            label="Payments"
            icon={<PaymentIcon />}
            variant="secondary"
            onClick={() => navigate('/Eventveda/payments')}
          />
        }
      />

      {/* Metrics Cards */}
      <StatCardGrid columns={{ xs: 1, sm: 2, md: 3 }} sx={{ mb: 3 }}>
        <StatCard
          title="Total Registrations"
          value={filteredParticipants.length}
          icon={<PeopleIcon />}
          color="primary"
          subtitle={
            accommodationFilter !== 'ALL' || eventFilter !== 'ALL' || schoolFilter !== 'ALL' || departmentFilter !== 'ALL' || searchQuery
              ? `Filtered from ${allParticipants.length}`
              : 'Paid registrations'
          }
        />
        <StatCard
          title="Total Teams / Entries"
          value={payments.length}
          icon={<PaymentIcon />}
          color="success"
          subtitle="Distinct payment records"
        />
        <StatCard
          title="Events Count"
          value={uniqueEvents.length}
          icon={<EventIcon />}
          color="info"
          subtitle={allEvents.length > 0 ? `Total available events: ${allEvents.length}` : 'Unique registered events'}
        />
      </StatCardGrid>

      {/* Filter Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          bgcolor: 'var(--bg-panel)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          alignItems: 'center',
        }}
      >
        <TextField
          placeholder="Search by name, roll no, email..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ minWidth: 240, flexGrow: { xs: 1, md: 0 } }}
        />

        <TextField
          select
          label="Filter Event"
          size="small"
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="ALL">All Events</MenuItem>
          {uniqueEvents.map((ev) => (
            <MenuItem key={ev} value={ev}>
              {ev}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Filter School"
          size="small"
          value={schoolFilter}
          onChange={(e) => setSchoolFilter(e.target.value)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="ALL">All Schools</MenuItem>
          {uniqueSchools.map((sch) => (
            <MenuItem key={sch} value={sch}>
              {sch}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Department"
          size="small"
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="ALL">All Depts</MenuItem>
          {uniqueDepartments.map((dept) => (
            <MenuItem key={dept} value={dept}>
              {dept}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Gender"
          size="small"
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value)}
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="ALL">All Genders</MenuItem>
          <MenuItem value="MALE">Male</MenuItem>
          <MenuItem value="FEMALE">Female</MenuItem>
        </TextField>

        <Box sx={{ ml: 'auto' }}>
          <Button
            variant="outlined"
            onClick={handleExportExcel}
            startIcon={<DownloadIcon />}
            sx={{ borderRadius: '10px', textTransform: 'none', px: 2 }}
          >
            Export Excel
          </Button>
        </Box>
      </Paper>

      {/* DataTable */}
      {loading ? (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}>
          <CircularProgress size={32} />
        </Box>
      ) : (
        <Box sx={{ mt: 2 }}>
          {filteredParticipants.length === 0 ? (
            <EmptyState
              title="No Registrations found"
              description="Try adjusting your search query or filter criteria."
            />
          ) : (
            <DataTable
              columns={columns}
              rows={rows}
              nonSortableColumns={[0, 10]}
              alignments={['center', 'left', 'left', 'center', 'left', 'left', 'left', 'left', 'left', 'center', 'center']}
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
                Student Profile
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
            <Box sx={{ mb: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                {selectedParticipant.name || '-'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Roll Number: <strong>{selectedParticipant.roll || '-'}</strong> | Gender: <strong>{selectedParticipant.gender || '-'}</strong>
              </Typography>
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
                  Location / City
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                  {selectedParticipant.location || '-'}
                </Typography>
              </Grid>

              {/* <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                  Accommodation Requested
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={selectedParticipant.accommodation || 'No'}
                    color={selectedParticipant.accommodation?.toLowerCase() === 'yes' ? 'primary' : 'default'}
                    size="small"
                    sx={{ fontWeight: 700 }}
                  />
                </Box>
              </Grid> */}
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

export default Registrations;
