import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  Paper,
  Typography,
  CircularProgress,
  TextField,
  MenuItem,
  Alert,
  InputAdornment,
  Tooltip
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Search as SearchIcon,
  PeopleAlt as PeopleAltIcon,
  Payment as PaymentIcon,
  Event as EventIcon,
  CreditCard as CreditCardIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import { PageContainer } from '../../components/common/design-system';
import API from '../../api/axios';
import { toast } from 'sonner';

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const collegeOptions = [
  'Aditya University',
  'ACET',
  'ACOE',
  'Other College'
];

const yearOptions = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  '5th Year',
  'Alumni / Other'
];

const createEmptyParticipant = (index = 0, defaultEmail = '', defaultMobile = '') => ({
  roll: '',
  name: '',
  college: 'Aditya University',
  otherCollege: '',
  gender: '',
  mobile: index === 0 ? defaultMobile : '',
  email: index === 0 ? defaultEmail : '',
  year: '',
  department: '',
  branch: '',
  location: '',
  accommodation: 'No',
});

const ManualAdding = () => {
  const navigate = useNavigate();

  // Step 1: Payment Fetch state
  const [paymentIdInput, setPaymentIdInput] = useState('');
  const [paymentFetching, setPaymentFetching] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [existingReg, setExistingReg] = useState(null);
  const [gatewayWarning, setGatewayWarning] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [customOrderId, setCustomOrderId] = useState('');

  // Step 2: Schools & Events state
  const [schools, setSchools] = useState([]);
  const [events, setEvents] = useState([]);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [teamSize, setTeamSize] = useState(1);

  // Step 3: Participants state
  const [participants, setParticipants] = useState([createEmptyParticipant(0)]);
  const [rollLookupLoading, setRollLookupLoading] = useState({});

  // Step 4: Submission state
  const [submitting, setSubmitting] = useState(false);
  const [successDialog, setSuccessDialog] = useState(null);

  // Fetch schools and events
  useEffect(() => {
    const fetchMetadata = async () => {
      setLoadingMetadata(true);
      try {
        const [schoolsRes, eventsRes] = await Promise.all([
          API.get('/api/event-schools').catch(() => ({ data: { eventSchools: [] } })),
          API.get('/api/events').catch(() => ({ data: { events: [] } }))
        ]);

        const rawSchools = schoolsRes.data?.eventSchools || schoolsRes.data?.schools || schoolsRes.data;
        const rawEvents = eventsRes.data?.events || eventsRes.data;

        setSchools(Array.isArray(rawSchools) ? rawSchools : []);
        setEvents(Array.isArray(rawEvents) ? rawEvents : []);
      } catch (err) {
        console.error('Error loading metadata:', err);
        toast.error('Failed to load schools and events');
        setSchools([]);
        setEvents([]);
      } finally {
        setLoadingMetadata(false);
      }
    };
    fetchMetadata();
  }, []);

  // Filter events based on selected school
  const safeSchools = useMemo(() => (Array.isArray(schools) ? schools : []), [schools]);
  const safeEvents = useMemo(() => (Array.isArray(events) ? events : []), [events]);

  const filteredEvents = useMemo(() => {
    if (!selectedSchoolId) return safeEvents;

    const selectedSchoolObj = safeSchools.find(s => String(s._id) === String(selectedSchoolId));
    const selectedSchoolName = (selectedSchoolObj?.name || selectedSchoolObj?.schoolName || '').trim().toLowerCase();

    return safeEvents.filter(e => {
      // 1. Check eventSchool ObjectId or object
      const eventSchoolId = String(
        e.eventSchool?._id ||
        (typeof e.eventSchool === 'string' ? e.eventSchool : '') ||
        e.eventSchoolId?._id ||
        e.eventSchoolId ||
        e.school?._id ||
        e.school ||
        e.schoolId ||
        ''
      );

      if (eventSchoolId && eventSchoolId === String(selectedSchoolId)) {
        return true;
      }

      // 2. Check school name comparison
      const eventSchoolName = String(
        e.eventSchool?.name ||
        e.eventSchool?.schoolName ||
        e.school?.name ||
        e.category ||
        ''
      ).trim().toLowerCase();

      if (selectedSchoolName && eventSchoolName && (
        eventSchoolName === selectedSchoolName ||
        selectedSchoolName.includes(eventSchoolName) ||
        eventSchoolName.includes(selectedSchoolName)
      )) {
        return true;
      }

      return false;
    });
  }, [safeEvents, selectedSchoolId, safeSchools]);

  const selectedEvent = useMemo(() => {
    return safeEvents.find(e => String(e._id) === String(selectedEventId));
  }, [safeEvents, selectedEventId]);

  // Adjust participant list when team size changes
  const updateTeamSize = useCallback((newSize) => {
    const size = Math.max(1, Number(newSize) || 1);
    setTeamSize(size);
    setParticipants(prev => {
      const updated = [...prev];
      if (updated.length < size) {
        for (let i = updated.length; i < size; i++) {
          updated.push(createEmptyParticipant(
            i,
            paymentData?.email || '',
            paymentData?.contact ? String(paymentData.contact).replace(/^\+?91/, '') : ''
          ));
        }
      } else if (updated.length > size) {
        return updated.slice(0, size);
      }
      return updated;
    });
  }, [paymentData]);

  // When event changes, adjust team size limits
  const handleEventChange = (eId) => {
    setSelectedEventId(eId);
    const ev = safeEvents.find(e => String(e._id) === String(eId));
    if (ev) {
      const evSchoolId = String(
        ev.eventSchool?._id ||
        (typeof ev.eventSchool === 'string' ? ev.eventSchool : '') ||
        ev.eventSchoolId?._id ||
        ev.eventSchoolId ||
        ev.school?._id ||
        ev.schoolId ||
        ''
      );
      if (evSchoolId && (!selectedSchoolId || String(selectedSchoolId) !== evSchoolId)) {
        const matchingSchool = safeSchools.find(s => String(s._id) === evSchoolId);
        if (matchingSchool) setSelectedSchoolId(matchingSchool._id);
      }

      if (!customAmount) {
        const priceVal = ev.price ?? ev.fee;
        if (priceVal != null) {
          setCustomAmount(String(priceVal));
        }
      }

      const maxLimit = ev.maxTeamSize ? Number(ev.maxTeamSize) + Number(ev.extraTeamSize || 0) : 4;
      const newSize = Math.max(1, Math.min(teamSize, maxLimit));
      updateTeamSize(newSize);
    }
  };

  // Fetch payment details by ID
  const handleFetchPayment = async () => {
    const cleanId = paymentIdInput.trim();
    if (!cleanId) {
      toast.warning('Please enter a Razorpay Payment ID (e.g. pay_...) or Order ID');
      return;
    }

    setPaymentFetching(true);
    setPaymentData(null);
    setExistingReg(null);
    setGatewayWarning('');

    try {
      const res = await API.get(`/api/razorpay/payment-details/${cleanId}`);
      if (res.data?.ok) {
        const payment = res.data.payment;
        setPaymentData(payment);
        setGatewayWarning(res.data.warning || '');

        if (payment.amount) {
          setCustomAmount((payment.amount / 100).toString());
        } else {
          setCustomAmount('');
        }
        if (payment.order_id) {
          setCustomOrderId(payment.order_id);
        } else {
          setCustomOrderId('');
        }

        const email = payment.email || '';
        const phone = payment.contact ? String(payment.contact).replace(/^\+?91/, '') : '';

        // Auto-fill participant 1 email and mobile if empty
        setParticipants(prev => prev.map((p, idx) => {
          if (idx === 0) {
            return {
              ...p,
              email: p.email || email,
              mobile: p.mobile || phone
            };
          }
          return p;
        }));

        if (res.data.existingRegistration) {
          setExistingReg(res.data.existingRegistration);
          toast.info('A registration with this Payment ID already exists in the database.');
        } else if (res.data.foundOnGateway) {
          toast.success('Payment details fetched successfully from Razorpay!');
        } else {
          toast.warning(res.data.warning || 'Payment not found on active Razorpay account. You can enter the amount below and proceed.');
        }
      } else {
        toast.error(res.data?.error || 'Payment details not found');
      }
    } catch (err) {
      console.error('Error fetching payment:', err);
      toast.error(err.response?.data?.error || 'Failed to fetch payment details from Razorpay');
    } finally {
      setPaymentFetching(false);
    }
  };

  // Auto-fill from existing registration
  const handleLoadExistingRegistration = () => {
    if (!existingReg) return;
    if (existingReg.eventId) {
      setSelectedEventId(existingReg.eventId);
    }
    if (existingReg.schoolId) {
      setSelectedSchoolId(existingReg.schoolId);
    }
    if (existingReg.teamSize) {
      setTeamSize(existingReg.teamSize);
    }
    if (Array.isArray(existingReg.participants) && existingReg.participants.length > 0) {
      setParticipants(existingReg.participants.map(p => ({
        roll: p.roll || '',
        name: p.name || '',
        college: p.college || 'Aditya University',
        otherCollege: p.otherCollege || '',
        gender: p.gender || '',
        mobile: p.mobile || '',
        email: p.email || '',
        year: p.year || '',
        department: p.department || '',
        branch: p.branch || '',
        location: p.location || '',
        accommodation: p.accommodation || 'No',
        barcode: p.barcode || '',
      })));
    }
    toast.success('Loaded data from existing registration!');
  };

  // Handle participant change
  const handleParticipantChange = (index, field, value) => {
    setParticipants(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      if (field === 'college' && value !== 'Other College') {
        updated[index].otherCollege = '';
      }
      return updated;
    });
  };

  // Auto-lookup Aditya student data by roll number
  const handleLookupRoll = async (index, roll) => {
    const cleanRoll = roll?.trim().toUpperCase();
    if (!cleanRoll || cleanRoll.length < 5) return;

    setRollLookupLoading(prev => ({ ...prev, [index]: true }));
    try {
      const res = await API.get(`/api/razorpay/registrations/branch/${cleanRoll}`);
      const data = res.data;
      const student = Array.isArray(data) && data.length > 0
        ? data[0]
        : (data?.value && Array.isArray(data.value) && data.value.length > 0
          ? data.value[0]
          : (data && typeof data === 'object' ? data : null));

      if (student) {
        const studentName = student.NAME || student.student_name || student.STUDENTNAME || student.name || '';
        const branch = student.BRANCH || student.branch || student.branch_name || student.branchName || '';
        const year = student.YEAR || student.year || student.current_year || '';
        const mobile = student.STUDENTMOBILE || student.MOBILE || student.mobile || '';
        const email = student.STUDENTEMAIL || student.EMAIL || student.email || '';
        const gender = student.GENDER || student.gender || '';

        setParticipants(prev => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            name: updated[index].name || studentName,
            branch: updated[index].branch || branch,
            department: updated[index].department || branch,
            year: updated[index].year || (year ? `${year} Year` : ''),
            mobile: updated[index].mobile || mobile,
            email: updated[index].email || email,
            gender: updated[index].gender || (gender ? (gender.toUpperCase().startsWith('F') ? 'Female' : 'Male') : ''),
            college: updated[index].college || 'Aditya University'
          };
          return updated;
        });

        if (studentName) {
          toast.success(`Student found: ${studentName} (${branch || 'Aditya'})`);
        }
      }
    } catch (err) {
      console.warn('Roll lookup error:', err);
    } finally {
      setRollLookupLoading(prev => ({ ...prev, [index]: false }));
    }
  };

  // Submit manual registration
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!paymentData) {
      toast.error('Please enter a Payment ID and click "Fetch Payment Details" first');
      return;
    }

    if (!selectedEventId) {
      toast.error('Please select an Event');
      return;
    }

    // Validate participants
    for (let i = 0; i < participants.length; i++) {
      const p = participants[i];
      if (!p.roll?.trim()) {
        toast.error(`Please provide Roll Number for Participant ${i + 1}`);
        return;
      }
      if (!p.name?.trim()) {
        toast.error(`Please provide Name for Participant ${i + 1}`);
        return;
      }
      if (!p.mobile?.trim()) {
        toast.error(`Please provide Mobile number for Participant ${i + 1}`);
        return;
      }
      if (!p.email?.trim()) {
        toast.error(`Please provide Email address for Participant ${i + 1}`);
        return;
      }
      if (p.college === 'Other College' && !p.otherCollege?.trim()) {
        toast.error(`Please enter College Name for Participant ${i + 1}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const schoolObj = safeSchools.find(s => s._id === selectedSchoolId);
      const ev = safeEvents.find(e => e._id === selectedEventId);

      const parsedAmount = customAmount !== '' ? Number(customAmount) : ((paymentData.amount || 0) / 100);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        toast.error('Please enter a valid payment amount (e.g. ₹204.72)');
        setSubmitting(false);
        return;
      }

      const payload = {
        paymentId: paymentData.id || paymentIdInput.trim(),
        orderId: customOrderId || paymentData.order_id || '',
        eventId: ev?._id || selectedEventId,
        schoolId: schoolObj?._id || ev?.eventSchool?._id || (typeof ev?.eventSchool === 'string' ? ev.eventSchool : '') || ev?.schoolId || '',
        category: schoolObj?.name || schoolObj?.schoolName || ev?.eventSchool?.name || ev?.category || 'VEDA Event',
        eventName: ev?.eventName || '',
        teamSize: Number(teamSize) || participants.length,
        amount: parsedAmount,
        amountRupees: parsedAmount,
        currency: paymentData.currency || 'INR',
        participants: participants
      };

      const res = await API.post('/api/razorpay/manual-registration', payload);

      if (res.data?.ok) {
        toast.success(res.data.message || 'Registration saved successfully!');
        setSuccessDialog({
          teamId: res.data.teamId,
          eventName: ev?.eventName,
          registration: res.data.registration,
          participantsCount: participants.length
        });
      } else {
        toast.error(res.data?.error || 'Failed to complete registration');
      }
    } catch (err) {
      console.error('Error submitting manual registration:', err);
      toast.error(err.response?.data?.error || 'Failed to save manual registration');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setPaymentIdInput('');
    setPaymentData(null);
    setExistingReg(null);
    setGatewayWarning('');
    setCustomAmount('');
    setCustomOrderId('');
    setSelectedSchoolId('');
    setSelectedEventId('');
    setTeamSize(1);
    setParticipants([createEmptyParticipant(0)]);
    setSuccessDialog(null);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Manual Adding & Payment Mapping"
        subtitle="Verify Razorpay payment by ID and map participant details into the database"
        action={
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/Eventveda/payments')}
              startIcon={<PaymentIcon />}
              sx={{ borderRadius: '12px', textTransform: 'none', px: 2 }}
            >
              Payments List
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/Eventveda/registrations')}
              startIcon={<PeopleAltIcon />}
              sx={{ borderRadius: '12px', textTransform: 'none', px: 2 }}
            >
              Registrations List
            </Button>
          </Box>
        }
      />

      <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* STEP 1: PAYMENT LOOKUP */}
        <Paper
          elevation={0}
          variant="outlined"
          sx={{
            p: 3,
            borderRadius: '16px',
            bgcolor: 'var(--bg-panel, #ffffff)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Chip
              label="Step 1"
              size="small"
              sx={{ bgcolor: 'var(--color-primary, #1e3a8a)', color: '#fff', fontWeight: 700 }}
            />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Verify Razorpay Payment
            </Typography>
          </Box>

          <Grid container spacing={2} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 8 }}>
              <TextField
                fullWidth
                size="medium"
                label="Razorpay Payment ID or Order ID"
                placeholder="e.g. pay_TX2laVtmYD8Ehw or order_TVcHRbaTeLyQ8A"
                value={paymentIdInput}
                onChange={(e) => setPaymentIdInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleFetchPayment();
                  }
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <CreditCardIcon color="action" />
                      </InputAdornment>
                    ),
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleFetchPayment}
                disabled={paymentFetching || !paymentIdInput.trim()}
                startIcon={paymentFetching ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                sx={{
                  py: 1.8,
                  borderRadius: '12px',
                  fontWeight: 700,
                  textTransform: 'none',
                  background: 'var(--gradient-primary)'
                }}
              >
                {paymentFetching ? 'Fetching Payment...' : 'Fetch Payment Details'}
              </Button>
            </Grid>
          </Grid>

          {/* Payment Info Preview */}
          {paymentData && (
            <Box sx={{ mt: 3 }}>
              {gatewayWarning && (
                <Alert severity="warning" sx={{ mb: 2, borderRadius: '12px' }}>
                  {gatewayWarning}
                </Alert>
              )}

              {existingReg && (
                <Alert
                  severity="info"
                  sx={{ mb: 2, borderRadius: '12px' }}
                  action={
                    <Button
                      color="inherit"
                      size="small"
                      onClick={handleLoadExistingRegistration}
                      sx={{ fontWeight: 700, textTransform: 'none' }}
                    >
                      Load Existing Data
                    </Button>
                  }
                >
                  This Payment ID is already recorded in the database (Team ID: <strong>{existingReg.teamId}</strong> - Event: <strong>{existingReg.eventName || 'VEDA Event'}</strong>).
                </Alert>
              )}

              <Paper
                variant="outlined"
                sx={{
                  p: 2.5,
                  borderRadius: '12px',
                  bgcolor: '#f8fafc',
                  border: '1px solid #cbd5e1'
                }}
              >
                <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                      PAYMENT STATUS
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Chip
                        label={(paymentData.status || 'PAID').toUpperCase()}
                        color={paymentData.status === 'captured' || paymentData.status === 'PAID' ? 'success' : 'warning'}
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                      AMOUNT PAID (₹) *
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      placeholder="e.g. 204.72"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start">₹</InputAdornment>
                        }
                      }}
                      sx={{ mt: 0.5, bgcolor: '#ffffff' }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                      PAYMENT ID
                    </Typography>
                    <Typography variant="body2" fontFamily="monospace" fontWeight={700} sx={{ mt: 0.5, wordBreak: 'break-all' }}>
                      {paymentData.id || paymentIdInput}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                      ORDER ID (OPTIONAL)
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="e.g. order_..."
                      value={customOrderId}
                      onChange={(e) => setCustomOrderId(e.target.value)}
                      sx={{ mt: 0.5, bgcolor: '#ffffff' }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                      PAYMENT METHOD
                    </Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>
                      {paymentData.method ? paymentData.method.toUpperCase() : 'ONLINE'}
                      {paymentData.vpa ? ` (${paymentData.vpa})` : ''}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                      PAYER CONTACT
                    </Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>
                      {paymentData.contact || '-'}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                      PAYER EMAIL
                    </Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5, wordBreak: 'break-all' }}>
                      {paymentData.email || '-'}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                      PAYMENT DATE & TIME
                    </Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>
                      {paymentData.created_at ? formatDate(paymentData.created_at * 1000) : formatDate(Date.now())}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          )}
        </Paper>

        {/* STEP 2: SELECT SCHOOL & EVENT & TEAM SIZE */}
        <Paper
          elevation={0}
          variant="outlined"
          sx={{
            p: 3,
            borderRadius: '16px',
            bgcolor: 'var(--bg-panel, #ffffff)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            opacity: paymentData ? 1 : 0.6,
            pointerEvents: paymentData ? 'auto' : 'none'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Chip
              label="Step 2"
              size="small"
              sx={{ bgcolor: 'var(--color-primary, #1e3a8a)', color: '#fff', fontWeight: 700 }}
            />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Select School, Event & Team Size
            </Typography>
          </Box>

          <Grid container spacing={2.5}>
            {/* School Dropdown */}
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                select
                fullWidth
                label="School / Category"
                value={selectedSchoolId}
                onChange={(e) => {
                  setSelectedSchoolId(e.target.value);
                  setSelectedEventId('');
                }}
                disabled={loadingMetadata}
                helperText="Filter events by school"
              >
                <MenuItem value="">
                  <em>All Schools / Categories</em>
                </MenuItem>
                {safeSchools.map((school) => (
                  <MenuItem key={school._id} value={school._id}>
                    {school.name || school.schoolName}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Event Dropdown */}
            <Grid size={{ xs: 12, md: 5 }}>
              <TextField
                select
                fullWidth
                required
                label="Select Event"
                value={selectedEventId}
                onChange={(e) => handleEventChange(e.target.value)}
                disabled={loadingMetadata}
                helperText={selectedEvent ? `Fee: ₹${selectedEvent.price ?? selectedEvent.fee ?? 0} | Max Team Size: ${selectedEvent.maxTeamSize || 1}` : 'Choose the registered event'}
              >
                <MenuItem value="" disabled>
                  Select an event
                </MenuItem>
                {filteredEvents.map((event) => {
                  const schoolLabel = event.eventSchool?.name || event.category || '';
                  return (
                    <MenuItem key={event._id} value={event._id}>
                      {event.eventName} {schoolLabel ? `(${schoolLabel})` : ''}
                    </MenuItem>
                  );
                })}
              </TextField>
            </Grid>

            {/* Team Size Selector */}
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                select
                fullWidth
                label="Team Size"
                value={teamSize}
                onChange={(e) => updateTeamSize(e.target.value)}
                helperText="Number of participants"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <MenuItem key={num} value={num}>
                    {num} Participant{num > 1 ? 's' : ''}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </Paper>

        {/* STEP 3: PARTICIPANTS DETAILS */}
        <Paper
          elevation={0}
          variant="outlined"
          sx={{
            p: 3,
            borderRadius: '16px',
            bgcolor: 'var(--bg-panel, #ffffff)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            opacity: paymentData && selectedEventId ? 1 : 0.6,
            pointerEvents: paymentData && selectedEventId ? 'auto' : 'none'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Chip
                label="Step 3"
                size="small"
                sx={{ bgcolor: 'var(--color-primary, #1e3a8a)', color: '#fff', fontWeight: 700 }}
              />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Participant Details ({participants.length} {participants.length === 1 ? 'Participant' : 'Participants'})
              </Typography>
            </Box>

            {selectedEvent && (
              <Chip
                icon={<EventIcon />}
                label={`Event: ${selectedEvent.eventName}`}
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 700 }}
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {participants.map((p, idx) => (
              <Paper
                key={idx}
                elevation={0}
                variant="outlined"
                sx={{
                  p: 3,
                  borderRadius: '14px',
                  bgcolor: '#fafafa',
                  border: '1px solid #e2e8f0',
                  position: 'relative'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight={800} color="primary.main">
                    Participant {idx + 1} {idx === 0 ? '(Team Leader / Primary)' : ''}
                  </Typography>

                  <Chip
                    size="small"
                    label={p.college || 'Aditya University'}
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>

                <Grid container spacing={2}>
                  {/* Roll Number */}
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      fullWidth
                      required
                      size="small"
                      label="Roll Number *"
                      placeholder="e.g. 23P31A0525"
                      value={p.roll}
                      onChange={(e) => handleParticipantChange(idx, 'roll', e.target.value.toUpperCase())}
                      onBlur={() => handleLookupRoll(idx, p.roll)}
                      slotProps={{
                        input: {
                          endAdornment: rollLookupLoading[idx] ? (
                            <CircularProgress size={16} />
                          ) : (
                            <Tooltip title="Auto-fetch from Aditya API">
                              <IconButton
                                size="small"
                                onClick={() => handleLookupRoll(idx, p.roll)}
                                edge="end"
                              >
                                <AutoAwesomeIcon fontSize="small" color="primary" />
                              </IconButton>
                            </Tooltip>
                          ),
                        }
                      }}
                    />
                  </Grid>

                  {/* Name */}
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      fullWidth
                      required
                      size="small"
                      label="Name *"
                      placeholder="Full Name"
                      value={p.name}
                      onChange={(e) => handleParticipantChange(idx, 'name', e.target.value)}
                    />
                  </Grid>

                  {/* College Dropdown */}
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="College *"
                      value={p.college}
                      onChange={(e) => handleParticipantChange(idx, 'college', e.target.value)}
                    >
                      {collegeOptions.map((c) => (
                        <MenuItem key={c} value={c}>
                          {c}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* Other College Name (Conditional) */}
                  {p.college === 'Other College' ? (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <TextField
                        fullWidth
                        required
                        size="small"
                        label="Other College Name *"
                        placeholder="Enter College Name"
                        value={p.otherCollege}
                        onChange={(e) => handleParticipantChange(idx, 'otherCollege', e.target.value)}
                      />
                    </Grid>
                  ) : (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        label="Gender"
                        value={p.gender}
                        onChange={(e) => handleParticipantChange(idx, 'gender', e.target.value)}
                      >
                        <MenuItem value="">Select Gender</MenuItem>
                        <MenuItem value="Male">Male</MenuItem>
                        <MenuItem value="Female">Female</MenuItem>
                        <MenuItem value="Other">Other</MenuItem>
                      </TextField>
                    </Grid>
                  )}

                  {/* Mobile */}
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      fullWidth
                      required
                      size="small"
                      label="Mobile *"
                      placeholder="10-digit mobile"
                      value={p.mobile}
                      onChange={(e) => handleParticipantChange(idx, 'mobile', e.target.value)}
                    />
                  </Grid>

                  {/* Email */}
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      fullWidth
                      required
                      type="email"
                      size="small"
                      label="Email *"
                      placeholder="student@example.com"
                      value={p.email}
                      onChange={(e) => handleParticipantChange(idx, 'email', e.target.value)}
                    />
                  </Grid>

                  {/* Year of Study */}
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Year of Study"
                      value={p.year}
                      onChange={(e) => handleParticipantChange(idx, 'year', e.target.value)}
                    >
                      <MenuItem value="">Select Year</MenuItem>
                      {yearOptions.map((y) => (
                        <MenuItem key={y} value={y}>
                          {y}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* Department */}
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Department"
                      placeholder="e.g. CSE, ECE"
                      value={p.department}
                      onChange={(e) => handleParticipantChange(idx, 'department', e.target.value)}
                    />
                  </Grid>

                  {/* Branch */}
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Branch"
                      placeholder="e.g. Artificial Intelligence"
                      value={p.branch}
                      onChange={(e) => handleParticipantChange(idx, 'branch', e.target.value)}
                    />
                  </Grid>

                  {/* Location */}
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Location / City"
                      placeholder="e.g. Kakinada, Rajahmundry"
                      value={p.location}
                      onChange={(e) => handleParticipantChange(idx, 'location', e.target.value)}
                    />
                  </Grid>

                  {/* Accommodation */}
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Accommodation"
                      value={p.accommodation}
                      onChange={(e) => handleParticipantChange(idx, 'accommodation', e.target.value)}
                    >
                      <MenuItem value="No">No</MenuItem>
                      <MenuItem value="Yes">Yes</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </Box>

          {/* Submit Action */}
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={handleReset}
              disabled={submitting}
              sx={{ borderRadius: '10px', px: 3, textTransform: 'none' }}
            >
              Reset Form
            </Button>

            <Button
              variant="contained"
              size="large"
              onClick={handleSubmit}
              disabled={submitting || !paymentData || !selectedEventId}
              startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
              sx={{
                borderRadius: '10px',
                px: 4,
                py: 1.5,
                fontWeight: 700,
                textTransform: 'none',
                background: 'var(--gradient-primary)',
                boxShadow: '0 4px 14px rgba(190, 147, 55, 0.35)'
              }}
            >
              {submitting ? 'Saving Registration...' : 'Save Participants & Generate Team ID'}
            </Button>
          </Box>
        </Paper>
      </Box>

      {/* SUCCESS CONFIRMATION DIALOG */}
      {successDialog && (
        <Dialog
          open={Boolean(successDialog)}
          onClose={() => setSuccessDialog(null)}
          maxWidth="sm"
          fullWidth
          slotProps={{ paper: { sx: { borderRadius: '20px', p: 1 } } }}
        >
          <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                bgcolor: 'success.light',
                color: 'success.main',
                display: 'grid',
                placeItems: 'center',
                mx: 'auto',
                mb: 1.5
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 38 }} />
            </Box>
            <Typography variant="h5" fontWeight={800}>
              Registration Successful!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Participant details and verified payment have been saved into the database.
            </Typography>
          </DialogTitle>

          <DialogContent>
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                borderRadius: '14px',
                bgcolor: '#f8fafc',
                textAlign: 'center',
                my: 1
              }}
            >
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                GENERATED TEAM ID
              </Typography>
              <Typography variant="h4" fontWeight={900} color="primary.main" sx={{ letterSpacing: 1, my: 0.5 }}>
                {successDialog.teamId}
              </Typography>
              <Typography variant="body2" fontWeight={600} color="text.primary">
                Event: {successDialog.eventName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {successDialog.participantsCount} Participant(s) registered with attendance barcodes
              </Typography>
            </Paper>
          </DialogContent>

          <DialogActions sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={() => {
                setSuccessDialog(null);
                navigate('/Eventveda/payments');
              }}
              sx={{
                borderRadius: '10px',
                py: 1.2,
                fontWeight: 700,
                textTransform: 'none',
                background: 'var(--gradient-primary)'
              }}
            >
              View in Payments List
            </Button>

            <Button
              fullWidth
              variant="outlined"
              onClick={handleReset}
              sx={{ borderRadius: '10px', py: 1, textTransform: 'none' }}
            >
              Add Another Registration
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </PageContainer>
  );
};

export default ManualAdding;
