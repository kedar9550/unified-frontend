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
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/data/DataTable';
import API from '../../api/axios';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../../context/AuthContext';
import EventPassCard from '../../components/EventPass/EventPassCard';

const Participants = ({ mode = 'all' }) => {
  const navigate = useNavigate();
  const { activeRole, user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPassParticipant, setSelectedPassParticipant] = useState(null);
  const [passDialogOpen, setPassDialogOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [eventFilter, setEventFilter] = useState('ALL');
  const [accommodationFilter, setAccommodationFilter] = useState(
    mode === 'accommodation' ? 'YES' : mode === 'no-accommodation' ? 'NO' : 'ALL'
  );
  const [attendanceFilter, setAttendanceFilter] = useState('ALL');
  const [genderFilter, setGenderFilter] = useState('ALL');

  useEffect(() => {
    if (mode === 'accommodation') {
      setAccommodationFilter('YES');
    } else if (mode === 'no-accommodation') {
      setAccommodationFilter('NO');
    } else {
      setAccommodationFilter('ALL');
    }
  }, [mode]);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const eventsRes = await API.get('/api/events');
      const allEvents = eventsRes.data?.events || [];

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
          eventCategory: eventMatch?.category?.name || eventMatch?.category || p.category || '-'
        };
      });
      
      setPayments(fetchedPayments);
    } catch (error) {
      console.error('Error fetching event participants:', error);
      toast.error(error.response?.data?.message || 'Failed to load participants');
    } finally {
      setLoading(false);
    }
  }, [activeRole, user]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

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
            razorpayPaymentId: payment.razorpayPaymentId,
            razorpayOrderId: payment.razorpayOrderId,
            amount: payment.amountRupees ?? payment.amount,
            paidAt: payment.createdAt || payment.paidAt,
            venue: payment.venue,
            eventGroup: payment.eventGroup || '-',
            eventCategory: payment.eventCategory || '-',
          });
        });
      }
    });
    return list;
  }, [payments]);

  // Extract unique events for filter dropdown
  const uniqueEvents = useMemo(() => {
    const eventsSet = new Set();
    allParticipants.forEach((p) => {
      if (p.eventName) eventsSet.add(p.eventName);
    });
    return Array.from(eventsSet);
  }, [allParticipants]);

  // Apply filters
  const filteredParticipants = useMemo(() => {
    let filtered = allParticipants.filter((p) => {
      // Event filter
      if (eventFilter !== 'ALL' && p.eventName !== eventFilter) return false;

      // Accommodation filter
      if (accommodationFilter === 'YES' && p.accommodation?.toLowerCase() !== 'yes') return false;
      if (accommodationFilter === 'NO' && p.accommodation?.toLowerCase() === 'yes') return false;

      // Attendance filter
      if (attendanceFilter === 'PRESENT' && !p.attended) return false;
      if (attendanceFilter === 'ABSENT' && p.attended) return false;

      // Gender filter
      if (genderFilter !== 'ALL' && p.gender?.toLowerCase() !== genderFilter.toLowerCase()) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const name = (p.name || '').toLowerCase();
        const roll = (p.roll || '').toLowerCase();
        const email = (p.email || '').toLowerCase();
        const mobile = (p.mobile || '').toLowerCase();
        const college = (p.college || '').toLowerCase();
        const dept = (p.department || '').toLowerCase();
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

    if (mode === 'accommodation') {
      const grouped = {};
      filtered.forEach(p => {
        const key = p.roll || p.email || p.id;
        if (!grouped[key]) {
          grouped[key] = { 
            ...p, 
            eventNames: [p.eventName || ''], 
            eventGroups: [p.eventGroup || ''], 
            eventCategories: [p.eventCategory || ''],
            combinedGroups: [`${p.eventGroup || ''} / ${p.eventCategory || ''}`] 
          };
        } else {
          if (!grouped[key].eventNames.includes(p.eventName)) grouped[key].eventNames.push(p.eventName || '');
          if (!grouped[key].eventGroups.includes(p.eventGroup)) grouped[key].eventGroups.push(p.eventGroup || '');
          if (!grouped[key].eventCategories.includes(p.eventCategory)) grouped[key].eventCategories.push(p.eventCategory || '');
          
          const grpCat = `${p.eventGroup || ''} / ${p.eventCategory || ''}`;
          if (!grouped[key].combinedGroups.includes(grpCat)) grouped[key].combinedGroups.push(grpCat);
        }
      });
      filtered = Object.values(grouped).map(g => ({
        ...g,
        eventName: g.eventNames.filter(Boolean).join(', '),
        eventGroup: g.eventGroups.filter(Boolean).join(', '),
        eventCategory: g.eventCategories.filter(Boolean).join(', '),
        eventGroupString: g.combinedGroups.filter(Boolean).join(', ')
      }));
    }

    return filtered;
  }, [allParticipants, eventFilter, accommodationFilter, attendanceFilter, genderFilter, searchQuery, mode]);

  // Metrics
  const accommodationCount = useMemo(() => {
    return allParticipants.filter((p) => p.accommodation?.toLowerCase() === 'yes').length;
  }, [allParticipants]);

  const uniqueCollegesCount = useMemo(() => {
    const set = new Set();
    allParticipants.forEach((p) => {
      if (p.college) set.add(p.college);
    });
    return set.size;
  }, [allParticipants]);

  const presentCount = useMemo(() => {
    return allParticipants.filter((p) => p.attended).length;
  }, [allParticipants]);

  const absentCount = useMemo(() => {
    return allParticipants.filter((p) => !p.attended).length;
  }, [allParticipants]);

  const maleCount = useMemo(() => {
    return filteredParticipants.filter((p) => p.gender?.toLowerCase() === 'male').length;
  }, [filteredParticipants]);

  const femaleCount = useMemo(() => {
    return filteredParticipants.filter((p) => p.gender?.toLowerCase() === 'female').length;
  }, [filteredParticipants]);

  // CSV Export handler
  const handleExportCSV = () => {
    if (filteredParticipants.length === 0) {
      toast.error('No participants data to export.');
      return;
    }

    const headers = ['S.No', 'Name', 'Roll No', 'Group', 'Category', 'Event Name', 'College', 'Department', 'Gender', 'Contact', 'Attended'];
    const csvRows = [headers.join(',')];

    filteredParticipants.forEach((p, idx) => {
      const collegeName = p.college === 'Other College' && p.otherCollege ? p.otherCollege : (p.college || '');
      const row = [
        idx + 1,
        `"${p.name || ''}"`,
        `"${p.roll || ''}"`,
        `"${p.eventGroup || ''}"`,
        `"${p.eventCategory || ''}"`,
        `"${p.eventName || ''}"`,
        `"${collegeName}"`,
        `"${p.department || ''}"`,
        `"${p.gender || ''}"`,
        `"${p.mobile || ''}"`,
        `"${p.attended ? 'Yes' : 'No'}"`,
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VEDA_Event_Participants_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('participants data exported successfully!');
  };

  const columns = [
    'S.No',
    'Name',
    'Roll Number',
    'MAIN GROUP / CATEGORY',
    'EVENT NAME',
    'College',
    'Department / Year',
    'Contact Info',
    'Attended',
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
      p.eventGroupString ? p.eventGroupString : `${p.eventGroup} / ${p.eventCategory}`,
      p.eventName || '-',
      p.college ? (p.college === 'Other College' && p.otherCollege ? p.otherCollege : p.college) : '-',
      p.department ? `Dept: ${p.department}${p.year ? ' | Yr: ' + p.year : ''}` : (p.year ? `Yr: ${p.year}` : '-'),
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
        value: p.attended ? 'Yes' : 'No',
        display: (
          <Chip
            label={p.attended ? 'Yes' : 'No'}
            color={p.attended ? 'success' : 'error'}
            size="small"
            sx={{ fontWeight: 700, borderRadius: '6px' }}
          />
        ),
      },
    ];
  });

  return (
    <Box sx={{ p: { xs: 2, md: 3, lg: 4 } }}>
      <PageHeader
        title="Participants List"
        subtitle="View all event participants and their attendance status"
        action={
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={fetchPayments}
              startIcon={<RefreshIcon />}
              sx={{ borderRadius: '12px', textTransform: 'none', px: 2.5, py: 1 }}
            >
              Refresh
            </Button>
          </Box>
        }
      />

      {/* Summary Cards */}
      <Grid container spacing={2.5} sx={{ mt: 1, mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)',
              borderColor: 'rgba(56, 189, 248, 0.2)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  background: 'var(--color-primary, #0284c7)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PeopleIcon />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                  {mode === 'all' ? 'Total Participants' : mode === 'accommodation' ? 'Accommodation Needed' : 'No Accommodation'}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>
                  {mode === 'all' ? allParticipants.length : filteredParticipants.length}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* <Grid item xs={12} sm={6} md={3}>
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%)',
              borderColor: 'rgba(34, 197, 94, 0.2)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  background: '#16a34a',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PaymentIcon />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                  Paid participants
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>
                  {payments.length}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid> */}

        {mode === 'all' && (
          <Grid item xs={12} sm={6} md={3}>
            <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.08) 100%)',
              borderColor: 'rgba(245, 158, 11, 0.2)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  background: '#d97706',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AccommodationIcon />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                  Accommodation Needed
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>
                  {accommodationCount}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        )}

        {mode !== 'all' && (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2.5,
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(37, 99, 235, 0.08) 100%)',
                  borderColor: 'rgba(59, 130, 246, 0.2)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '12px',
                      background: '#2563eb',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <PeopleIcon />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                      Male Participants
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900 }}>
                      {maleCount}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2.5,
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.08) 0%, rgba(219, 39, 119, 0.08) 100%)',
                  borderColor: 'rgba(236, 72, 153, 0.2)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '12px',
                      background: '#db2777',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <PeopleIcon />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                      Female Participants
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900 }}>
                      {femaleCount}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </>
        )}

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(147, 51, 234, 0.08) 100%)',
              borderColor: 'rgba(168, 85, 247, 0.2)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  background: '#9333ea',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <EventIcon />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                  Events
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>
                  {uniqueEvents.length}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%)',
              borderColor: 'rgba(34, 197, 94, 0.2)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  background: '#16a34a',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircleIcon />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                  Present
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>
                  {presentCount}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(220, 38, 38, 0.08) 100%)',
              borderColor: 'rgba(239, 68, 68, 0.2)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  background: '#dc2626',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CancelIcon />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                  Absent
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>
                  {absentCount}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

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
          placeholder="Search by name, roll no, email..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ width: { xs: '100%', sm: 260 } }}
        />

        <TextField
          select
          label="Filter Event"
          size="small"
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="ALL">All Events</MenuItem>
          {uniqueEvents.map((evt) => (
            <MenuItem key={evt} value={evt}>
              {evt}
            </MenuItem>
          ))}
        </TextField>

        {mode === 'all' && (
          <TextField
            select
            label="Accommodation"
            size="small"
            value={accommodationFilter}
            onChange={(e) => setAccommodationFilter(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="ALL">All Participants</MenuItem>
            <MenuItem value="YES">Requested (Yes)</MenuItem>
            <MenuItem value="NO">No Accommodation</MenuItem>
          </TextField>
        )}

        <TextField
          select
          size="small"
          label="Attendance"
          value={attendanceFilter}
          onChange={(e) => setAttendanceFilter(e.target.value)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="ALL">All Status</MenuItem>
          <MenuItem value="PRESENT">Present</MenuItem>
          <MenuItem value="ABSENT">Absent</MenuItem>
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
            onClick={handleExportCSV}
            startIcon={<DownloadIcon />}
            sx={{ borderRadius: '10px', textTransform: 'none', px: 2 }}
          >
            Export CSV
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
            <Box
              sx={{
                p: 4,
                borderRadius: '20px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-panel)',
                textAlign: 'center',
              }}
            >
              <Typography variant="h6" sx={{ mb: 1 }}>
                No Participants found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your search query or filter criteria.
              </Typography>
            </Box>
          ) : (
            <DataTable
              columns={columns}
              rows={rows}
              nonSortableColumns={[0, 8]}
              alignments={['center', 'left', 'left', 'left', 'left', 'left', 'left', 'left', 'center']}
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
                  Department & Year
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                  {selectedParticipant.department ? `Dept: ${selectedParticipant.department}` : ''} {selectedParticipant.year ? `| Year: ${selectedParticipant.year}` : ''}
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

              <Grid item xs={12} sm={6}>
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

          <DialogActions sx={{ p: 2, px: 3, background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                window.print();
              }}
              sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600 }}
            >
              Print Pass
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default Participants;
