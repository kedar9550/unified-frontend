import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  CardMedia,
  Button,
  Chip,
  Paper,
  Divider,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Alert,
  Avatar,
  CircularProgress
} from '@mui/material';
import {
  Event as EventIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  Close as CloseIcon,
  QrCode2 as QrIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { getCentralEventBySlug, registerCentralEvent } from '../../api/centralEventsApi';
import { PageHeader } from '../../components/common';
import PageContainer from '../../components/common/design-system/PageContainer';
import { toast } from 'sonner';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9022';

const getImageUrl = (img) => {
  if (!img) return '';
  const pathStr = typeof img === 'string' ? img : img.url;
  if (!pathStr) return '';
  if (pathStr.startsWith('http://') || pathStr.startsWith('https://') || pathStr.startsWith('blob:')) {
    return pathStr;
  }
  return `${BACKEND_URL}${pathStr.startsWith('/') ? '' : '/'}${pathStr}`;
};

export default function CentralEventDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  // Registration Dialog State
  const [openRegister, setOpenRegister] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [registering, setRegistering] = useState(false);

  // Registration Success / QR Modal State
  const [registrationResult, setRegistrationResult] = useState(null);
  const [openQrModal, setOpenQrModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes in seconds

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await getCentralEventBySlug(slug);
        if (res.success) setEvent(res.data);
      } catch (err) {
        toast.error('Failed to load event details');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [slug]);

  // Countdown timer for QR
  useEffect(() => {
    if (!openQrModal || !registrationResult?.data?.expiresAt) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(registrationResult.data.expiresAt).getTime();
      const diff = Math.max(0, Math.floor((expiry - now) / 1000));
      setTimeLeft(diff);

      if (diff <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [openQrModal, registrationResult]);

  const handleRegisterSubmit = async () => {
    setRegistering(true);
    try {
      const payload = {};
      if (event.participation?.type === 'TEAM') {
        if (!teamName.trim()) {
          toast.error('Team name is required');
          setRegistering(false);
          return;
        }
        payload.teamName = teamName;
      }

      const res = await registerCentralEvent(event._id, payload);
      if (res.success) {
        setOpenRegister(false);
        setRegistrationResult(res);

        if (res.data.isFree) {
          toast.success('Registration confirmed!');
        } else {
          setOpenQrModal(true);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!event) {
    return (
      <PageContainer maxWidth="md" px={3} py={6}>
        <PageHeader
          title="Event Not Found"
          subtitle="The requested central event could not be found or has been removed."
          icon={<EventIcon />}
          showBack
          backPath="/central-events"
        />
      </PageContainer>
    );
  }

  const isFree = event.fee?.amount === 0;
  const isDeadlinePassed = new Date() > new Date(event.schedule?.regDeadline);
  const isFull = event.registrationCount >= event.capacity;

  return (
    <PageContainer maxWidth="lg" px={3} py={3}>
      {/* Standard Page Header */}
      <PageHeader
        title={event.title}
        subtitle={event.organizer?.name ? `Organized by ${event.organizer.name}` : `Event Code: ${event.typeCode}`}
        icon={<EventIcon />}
        showBack
        backPath="/central-events"
      />

      {/* Main Banner Card */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '18px',
          overflow: 'hidden',
          mb: 4,
          border: '1px solid var(--border-color)',
          background: 'var(--bg-paper)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}
      >
        <CardMedia
          component="img"
          height="340"
          image={getImageUrl(event.banner)}
          alt={event.title}
        />
        <Box sx={{ p: 4 }}>
          <Stack direction="row" spacing={1} mb={2} flexWrap="wrap" gap={0.5}>
            <Chip label={event.typeCode} color="primary" sx={{ fontWeight: 700, borderRadius: '8px' }} />
            {event.categoryName && <Chip label={event.categoryName} variant="outlined" sx={{ borderRadius: '8px' }} />}
            {event.level && <Chip label={`Level: ${event.level}`} color="info" sx={{ borderRadius: '8px' }} />}
            {event.activityType && <Chip label={event.activityType} color="success" sx={{ borderRadius: '8px' }} />}
            <Chip label={event.mode} color="warning" sx={{ borderRadius: '8px' }} />
          </Stack>

          <Grid container spacing={3} sx={{ mt: 1, mb: 3 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <EventIcon color="primary" fontSize="large" />
                <Box>
                  <Typography variant="body2" color="text.secondary">From - To</Typography>
                  <Typography fontWeight={600}>
                    {new Date(event.schedule?.fromDate).toLocaleDateString()} - {new Date(event.schedule?.toDate).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <LocationIcon color="primary" fontSize="large" />
                <Box>
                  <Typography variant="body2" color="text.secondary">Venue</Typography>
                  <Typography fontWeight={600}>{event.venue?.name || event.mode}</Typography>
                </Box>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <PeopleIcon color="primary" fontSize="large" />
                <Box>
                  <Typography variant="body2" color="text.secondary">Seats Available</Typography>
                  <Typography fontWeight={600}>
                    {event.capacity - event.registrationCount} / {event.capacity} left
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box>
              <Typography variant="body2" color="text.secondary">Registration Fee</Typography>
              <Typography variant="h4" color="primary.main" fontWeight={700}>
                {isFree ? 'FREE' : `₹${event.fee.amount / 100}`}
              </Typography>
            </Box>

            <Button
              variant="contained"
              size="large"
              disabled={isDeadlinePassed || isFull || event.status !== 'PUBLISHED'}
              onClick={() => setOpenRegister(true)}
              sx={{
                px: 5,
                py: 1.5,
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '1rem',
                textTransform: 'none',
                background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
              }}
            >
              {isFull ? 'Event Full' : isDeadlinePassed ? 'Registration Closed' : 'Register Now'}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Details Grid */}
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: '18px', border: '1px solid var(--border-color)', background: 'var(--bg-paper)', mb: 4 }}>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Description & Overview
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8, color: 'var(--text-primary)' }}>
              {event.description}
            </Typography>

            {event.outcomes?.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom color="primary.main">
                  Key Outcomes
                </Typography>
                <ul>
                  {event.outcomes.map((o, i) => (
                    <li key={i}><Typography variant="body1">{o}</Typography></li>
                  ))}
                </ul>
              </Box>
            )}

            {event.rules?.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom color="primary.main">
                  Rules & Guidelines
                </Typography>
                <ol>
                  {event.rules.map((r, i) => (
                    <li key={i}><Typography variant="body1">{r}</Typography></li>
                  ))}
                </ol>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          {/* Resource Persons */}
          {event.resourcePersons?.length > 0 && (
            <Paper elevation={0} sx={{ p: 3, borderRadius: '18px', border: '1px solid var(--border-color)', background: 'var(--bg-paper)', mb: 4 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom color="primary.main">
                Resource Persons / Speakers
              </Typography>
              <Stack spacing={2} mt={2}>
                {event.resourcePersons.map((rp, i) => (
                  <Box key={i} display="flex" alignItems="center" gap={2}>
                    <Avatar src={rp.photoUrl} alt={rp.name} sx={{ width: 48, height: 48 }} />
                    <Box>
                      <Typography fontWeight={600}>{rp.name}</Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {rp.designation} - {rp.organization}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Paper>
          )}

          {/* Coordinators */}
          {event.coordinators?.faculty?.length > 0 && (
            <Paper elevation={0} sx={{ p: 3, borderRadius: '18px', border: '1px solid var(--border-color)', background: 'var(--bg-paper)', mb: 4 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom color="primary.main">
                Event Coordinators
              </Typography>
              <Stack spacing={1.5} mt={2}>
                {event.coordinators.faculty.map((c, i) => (
                  <Box key={i}>
                    <Typography fontWeight={600}>{c.name}</Typography>
                    {c.email && <Typography variant="caption" color="text.secondary" display="block">{c.email}</Typography>}
                    {c.phone && <Typography variant="caption" color="text.secondary" display="block">{c.phone}</Typography>}
                  </Box>
                ))}
              </Stack>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Registration Modal */}
      <Dialog open={openRegister} onClose={() => setOpenRegister(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '18px', p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Register for Event</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {event.title}
          </Typography>

          {event.participation?.type === 'TEAM' && (
            <TextField
              fullWidth
              label="Team Name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              margin="normal"
              required
              InputProps={{ sx: { borderRadius: '12px' } }}
            />
          )}

          <Typography variant="body2" sx={{ mt: 2 }}>
            Registration Fee: <strong>{isFree ? 'FREE' : `₹${event.fee.amount / 100}`}</strong>
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenRegister(false)} sx={{ borderRadius: '10px' }}>Cancel</Button>
          <Button variant="contained" onClick={handleRegisterSubmit} disabled={registering} sx={{ borderRadius: '10px', px: 3 }}>
            {registering ? <CircularProgress size={24} /> : 'Confirm & Proceed'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* QR Code & Payment Modal */}
      <Dialog open={openQrModal} onClose={() => setOpenQrModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '18px', p: 1 } }}>
        <DialogTitle display="flex" justifyContent="space-between" alignItems="center" sx={{ fontWeight: 700 }}>
          Scan QR to Pay via Razorpay
          <IconButton onClick={() => setOpenQrModal(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 3 }}>
          {registrationResult?.data?.payUrl && (
            <Box sx={{ my: 2, p: 2, display: 'inline-block', border: '2px solid #1976d2', borderRadius: '16px' }}>
              <QRCodeSVG value={registrationResult.data.payUrl} size={220} />
            </Box>
          )}

          <Alert severity="info" sx={{ mt: 2, borderRadius: '12px', textAlign: 'left' }}>
            Payment Token Expires in: <strong>{formatTimer(timeLeft)}</strong>
          </Alert>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Scan with your mobile camera or click below to proceed directly to the payment page.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, justifyContent: 'center' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<QrIcon />}
            onClick={() => navigate(`/pay/${registrationResult.data.payToken}`)}
            sx={{ borderRadius: '12px', px: 4, textTransform: 'none', fontWeight: 700 }}
          >
            Open Payment Checkout Page
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
