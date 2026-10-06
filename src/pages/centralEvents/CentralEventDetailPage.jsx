import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
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
  Download as DownloadIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  QrCode2 as QrIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { getCentralEventBySlug, registerCentralEvent } from '../../api/centralEventsApi';
import { toast } from 'sonner';

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
      <Container maxWidth="md" sx={{ py: 6, textAlign: 'center' }}>
        <Typography variant="h5" color="text.secondary">
          Event not found
        </Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/central-events')} sx={{ mt: 2 }}>
          Back to Events List
        </Button>
      </Container>
    );
  }

  const isFree = event.fee?.amount === 0;
  const isDeadlinePassed = new Date() > new Date(event.schedule?.regDeadline);
  const isFull = event.registrationCount >= event.capacity;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/central-events')} sx={{ mb: 2 }}>
        Back to Central Events
      </Button>

      {/* Main Banner */}
      <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden', mb: 4 }}>
        <CardMedia
          component="img"
          height="320"
          image={event.banner?.url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80'}
          alt={event.title}
        />
        <Box sx={{ p: 4 }}>
          <Stack direction="row" spacing={1} mb={2} flexWrap="wrap">
            <Chip label={event.typeCode} color="primary" sx={{ fontWeight: 700 }} />
            {event.categoryName && <Chip label={event.categoryName} variant="outlined" />}
            {event.level && <Chip label={`Level: ${event.level}`} color="info" />}
            {event.activityType && <Chip label={event.activityType} color="success" />}
            <Chip label={event.mode} color="warning" />
          </Stack>

          <Typography variant="h3" fontWeight={700} gutterBottom>
            {event.title}
          </Typography>

          {event.organizer?.name && (
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              Organized by <strong>{event.organizer.name}</strong>
            </Typography>
          )}

          <Grid container spacing={3} sx={{ mt: 2, mb: 3 }}>
            <Grid item xs={12} sm={4}>
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

            <Grid item xs={12} sm={4}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <LocationIcon color="primary" fontSize="large" />
                <Box>
                  <Typography variant="body2" color="text.secondary">Venue</Typography>
                  <Typography fontWeight={600}>{event.venue?.name || event.mode}</Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} sm={4}>
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
              sx={{ px: 4, py: 1.5, borderRadius: 3, fontWeight: 700 }}
            >
              {isFull ? 'Event Full' : isDeadlinePassed ? 'Registration Closed' : 'Register Now'}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Details Grid */}
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Paper elevation={1} sx={{ p: 4, borderRadius: 3, mb: 4 }}>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Description & Overview
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>
              {event.description}
            </Typography>

            {event.outcomes?.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
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
                <Typography variant="h6" fontWeight={700} gutterBottom>
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

        <Grid item xs={12} md={4}>
          {/* Resource Persons */}
          {event.resourcePersons?.length > 0 && (
            <Paper elevation={1} sx={{ p: 3, borderRadius: 3, mb: 4 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
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
            <Paper elevation={1} sx={{ p: 3, borderRadius: 3, mb: 4 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
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
      <Dialog open={openRegister} onClose={() => setOpenRegister(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Register for Event</DialogTitle>
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
            />
          )}

          <Typography variant="body2" sx={{ mt: 2 }}>
            Registration Fee: <strong>{isFree ? 'FREE' : `₹${event.fee.amount / 100}`}</strong>
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenRegister(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleRegisterSubmit} disabled={registering}>
            {registering ? <CircularProgress size={24} /> : 'Confirm & Proceed'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* QR Code & Payment Modal */}
      <Dialog open={openQrModal} onClose={() => setOpenQrModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle display="flex" justifyContent="space-between" alignItems="center">
          Scan QR to Pay via Razorpay
          <IconButton onClick={() => setOpenQrModal(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 3 }}>
          {registrationResult?.data?.payUrl && (
            <Box sx={{ my: 2, p: 2, display: 'inline-block', border: '2px solid #1976d2', borderRadius: 2 }}>
              <QRCodeSVG value={registrationResult.data.payUrl} size={220} />
            </Box>
          )}

          <Alert severity="info" sx={{ mt: 2, textAlig: 'left' }}>
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
            sx={{ borderRadius: 2, px: 4 }}
          >
            Open Payment Checkout Page
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
