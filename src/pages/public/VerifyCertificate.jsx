import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Paper, CircularProgress, Grid } from '@mui/material';
import API from '../../api/axios';
import {
  Error as ErrorIcon,
  VerifiedUser as VerifiedUserIcon,
  School as SchoolIcon,
  AccountBalance as AccountBalanceIcon,
  Event as EventIcon,
  Description as DescriptionIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import watermarkLogo from '../../assets/Circle_Gold.svg';
const VerifyCertificate = () => {
  const { receipt, roll } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVerification = async () => {
      try {
        const response = await API.get(`/api/razorpay/registrations?roll=${roll}&paymentStatus=PAID`);
        let payments = (response.data?.payments || []).filter(p => {
          const status = (p.paymentStatus || p.payment || '').toString().trim().toUpperCase();
          return status === 'PAID';
        });

        // Find the matching payment by receipt
        const payment = payments.find(p => p.receipt === receipt || p.teamId === receipt);
        if (!payment) {
          setError('Certificate not found or invalid.');
          return;
        }

        const participant = payment.participants?.find(p => p.roll === roll);
        if (!participant) {
          setError('Participant not found on this certificate.');
          return;
        }

        setData({ payment, participant });
      } catch (err) {
        setError('Failed to verify certificate.');
      } finally {
        setLoading(false);
      }
    };
    fetchVerification();
  }, [receipt, roll]);

  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', height: '100vh', background: '#f8fafc' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', height: '100vh', background: '#f8fafc' }}>
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4, maxWidth: 400, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
          <ErrorIcon color="error" sx={{ fontSize: 64, mb: 2 }} />
          <Typography variant="h5" color="error" gutterBottom sx={{ fontWeight: 800 }}>Verification Failed</Typography>
          <Typography color="text.secondary">{error}</Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f8fafc', p: { xs: 2, sm: 4 }, py: { xs: 4, sm: 6 }, position: 'relative', overflow: 'hidden' }}>

      {/* Background decoration */}
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '400px', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', zIndex: 0 }} />

      <Paper
        elevation={0}
        sx={{
          position: 'relative',
          zIndex: 1,
          p: 0,
          borderRadius: 3,
          maxWidth: { xs: 380, sm: 550 },
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1), 0 10px 15px -3px rgba(0,0,0,0.05)',
          overflow: 'hidden',
          background: '#ffffff'
        }}
      >
        {/* Wavy Header Section */}
        <Box sx={{ position: 'relative', pt: 6, pb: 4, px: { xs: 3, sm: 5 }, textAlign: 'center', overflow: 'hidden' }}>
          {/* SVG Wavy Background */}
          <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, opacity: 0.7 }}>
            <svg viewBox="0 0 1440 320" style={{ width: '100%', height: '100%', objectFit: 'cover' }} preserveAspectRatio="none">
              <path fill="#e0f2fe" fillOpacity="0.4" d="M0,128L48,138.7C96,149,192,171,288,165.3C384,160,480,128,576,133.3C672,139,768,181,864,186.7C960,192,1056,160,1152,144C1248,128,1344,128,1392,128L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
              <path fill="#dcfce7" fillOpacity="0.8" d="M0,224L48,208C96,192,192,160,288,154.7C384,149,480,171,576,192C672,213,768,235,864,224C960,213,1056,171,1152,149.3C1248,128,1344,128,1392,128L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
            </svg>
          </Box>



          {/* Custom Success Icon with Confetti */}
          <Box sx={{ position: 'relative', width: 100, height: 100, mx: 'auto', mb: 3, zIndex: 2 }}>
            {/* Confetti Sparks */}
            <Box sx={{ position: 'absolute', width: 6, height: 12, background: '#60a5fa', borderRadius: 4, top: 10, left: 10, transform: 'rotate(-45deg)' }} />
            <Box sx={{ position: 'absolute', width: 6, height: 12, background: '#10b981', borderRadius: 4, bottom: 20, left: -10, transform: 'rotate(30deg)' }} />
            <Box sx={{ position: 'absolute', width: 6, height: 12, background: '#10b981', borderRadius: 4, top: 0, right: 20, transform: 'rotate(45deg)' }} />
            <Box sx={{ position: 'absolute', width: 6, height: 12, background: '#60a5fa', borderRadius: 4, bottom: 30, right: -5, transform: 'rotate(-20deg)' }} />
            <Box sx={{ position: 'absolute', width: 8, height: 8, background: '#60a5fa', borderRadius: '50%', top: -5, left: 40 }} />
            <Box sx={{ position: 'absolute', width: 8, height: 8, background: '#10b981', borderRadius: '50%', bottom: 0, right: 20 }} />

            {/* Checkmark Circle */}
            <Box sx={{ width: '100%', height: '100%', borderRadius: '50%', background: '#dcfce7', display: 'grid', placeItems: 'center' }}>
              <Box sx={{ width: '75%', height: '75%', borderRadius: '50%', background: '#86efac', display: 'grid', placeItems: 'center' }}>
                <Box sx={{ width: '75%', height: '75%', borderRadius: '50%', background: '#10b981', display: 'grid', placeItems: 'center', boxShadow: '0 4px 14px rgba(16,185,129,0.4)' }}>
                  <CheckIcon sx={{ color: '#fff', fontSize: 36, strokeWidth: 2 }} />
                </Box>
              </Box>
            </Box>
          </Box>

          <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px', position: 'relative', zIndex: 2 }}>
            Certificate Verified
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1, fontSize: '1.05rem', position: 'relative', zIndex: 2 }}>
            This certificate is authentic and officially issued by Aditya University.
          </Typography>
        </Box>

        {/* Main Content Area */}
        <Box sx={{ px: { xs: 3, sm: 5 }, pb: 5, position: 'relative', zIndex: 2 }}>

          {/* Inner Participant Card */}
          <Paper elevation={0} sx={{ background: '#f9fafb', borderRadius: 2, p: { xs: 2.5, sm: 4 }, border: '1px solid #f1f5f9', mb: 4 }}>
            
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'center', sm: 'flex-start' }, gap: { xs: 2, sm: 4 }, mb: { xs: 3, sm: 4 } }}>
              <Box
                component="img"
                src={`https://info.aec.edu.in/adityacentral/StudentPhotos/${data.participant.roll}.jpg`}
                onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=No+Photo'; }}
                alt="Student"
                sx={{ width: { xs: 100, sm: 130 }, height: { xs: 100, sm: 130 }, borderRadius: '50%', objectFit: 'cover', border: '5px solid #ffffff', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)' }}
              />
              <Box sx={{ textAlign: { xs: 'center', sm: 'left' }, pt: 1 }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>
                  Participant
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: '#1e293b', mt: 0.5, mb: 2, lineHeight: 1.3 }}>
                  {data.participant.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                  <SchoolIcon sx={{ color: '#64748b', fontSize: 20 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#334155' }}>
                    {data.participant.roll}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                  <AccountBalanceIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                  <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 500 }}>
                    {data.participant.college || 'Aditya University'}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Paper elevation={0} sx={{ background: '#ffffff', borderRadius: 2, p: 2, display: 'flex', alignItems: 'center', gap: 2, border: '1px solid #f1f5f9' }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: 2, background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <EventIcon />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                      Event Name
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>
                      {data.payment.eventName || data.payment.category}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper elevation={0} sx={{ background: '#ffffff', borderRadius: 2, p: 2, display: 'flex', alignItems: 'center', gap: 2, border: '1px solid #f1f5f9' }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: 2, background: '#e0f2fe', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <DescriptionIcon />
                  </Box>
                  <Box sx={{ overflow: 'hidden' }}>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                      Certificate ID
                    </Typography>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 800,
                        color: '#1e293b',
                        lineHeight: 1.2,
                        wordBreak: 'break-all'
                      }}
                    >
                      VEDA2026-P-{data.payment.receipt}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Paper>

          {/* Footer Area */}
          <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', position: 'relative' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>Verified on</Typography>
                <Typography variant="subtitle1" sx={{ color: '#1e293b', fontWeight: 800 }}>
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default VerifyCertificate;
