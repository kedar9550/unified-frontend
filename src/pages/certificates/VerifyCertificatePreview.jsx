import React from 'react';
import { Box, Typography, Paper, Grid, Avatar, Chip } from '@mui/material';
import {
  Check as CheckIcon,
  VerifiedUser as VerifiedUserIcon,
  School as SchoolIcon,
  AccountBalance as AccountBalanceIcon,
  Event as EventIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import watermarkLogo from '../../assets/Circle_Gold.svg';

const previewData = {
  participant: {
    name: "MANTHENA VENKATA SIVA SURYA SUBRAHMANYA CHAITANYA RAJU",
    roll: "26B21EC096",
    college: "Aditya University",
  },
  payment: {
    eventName: "ROBO RACE",
    receipt: "VEDA2026-P-event-6a91253e24e42c6fe382bc6-1789061067756",
  }
};

const VerifyCertificatePreview = () => {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', background: '#f8fafc', p: { xs: 2, md: 4 }, position: 'relative', overflow: 'hidden' }}>

      <Paper
        elevation={0}
        sx={{
          position: 'relative',
          zIndex: 1,
          m: 'auto',
          borderRadius: 3,
          maxWidth: 600,
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1), 0 10px 15px -3px rgba(0,0,0,0.05)',
          overflow: 'hidden',
          background: '#ffffff'
        }}
      >
        {/* Wavy Header Section */}
        <Box sx={{ position: 'relative', pt: { xs: 3, sm: 4 }, pb: { xs: 1.5, sm: 2 }, px: { xs: 2, sm: 5 }, textAlign: 'center', overflow: 'hidden' }}>


          {/* SVG Wavy Background */}
          <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, opacity: 0.7 }}>
            <svg viewBox="0 0 1440 320" style={{ width: '100%', height: '100%', objectFit: 'cover' }} preserveAspectRatio="none">
              <path fill="#e0f2fe" fillOpacity="0.4" d="M0,128L48,138.7C96,149,192,171,288,165.3C384,160,480,128,576,133.3C672,139,768,181,864,186.7C960,192,1056,160,1152,144C1248,128,1344,128,1392,128L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
              <path fill="#dcfce7" fillOpacity="0.8" d="M0,224L48,208C96,192,192,160,288,154.7C384,149,480,171,576,192C672,213,768,235,864,224C960,213,1056,171,1152,149.3C1248,128,1344,128,1392,128L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
            </svg>
          </Box>

          {/* Custom Success Icon */}
          <Box sx={{ position: 'relative', width: { xs: 56, sm: 70 }, height: { xs: 56, sm: 70 }, mx: 'auto', mb: { xs: 1.5, sm: 2 }, zIndex: 2 }}>
            {/* Checkmark Circle */}
            <Box sx={{ width: '100%', height: '100%', borderRadius: '50%', background: '#dcfce7', display: 'grid', placeItems: 'center' }}>
              <Box sx={{ width: '75%', height: '75%', borderRadius: '50%', background: '#86efac', display: 'grid', placeItems: 'center' }}>
                <Box sx={{ width: '75%', height: '75%', borderRadius: '50%', background: '#10b981', display: 'grid', placeItems: 'center', boxShadow: '0 4px 14px rgba(16,185,129,0.4)' }}>
                  <CheckIcon sx={{ color: '#fff', fontSize: { xs: 24, sm: 32 }, strokeWidth: 2 }} />
                </Box>
              </Box>
            </Box>
          </Box>

          <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px', position: 'relative', zIndex: 2, fontSize: { xs: '1.4rem', sm: '1.75rem', md: '2.125rem' } }}>
            Certificate Verified
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1, fontSize: { xs: '0.85rem', sm: '1rem' }, position: 'relative', zIndex: 2, px: { xs: 2, sm: 0 } }}>
            This certificate is authentic and officially issued by Aditya University.
          </Typography>
        </Box>

        {/* Main Content Area */}
        <Box sx={{ px: { xs: 2, sm: 4 }, pb: { xs: 2, sm: 3 }, position: 'relative', zIndex: 2 }}>

          {/* Inner Participant Card */}
          <Paper elevation={0} sx={{ background: '#f9fafb', borderRadius: 2, p: { xs: 1.5, sm: 2.5 }, border: '1px solid #f1f5f9', mb: 2 }}>

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'center', sm: 'flex-start' }, gap: { xs: 2, sm: 4 } }}>
              <Avatar
                src={`https://info.aec.edu.in/adityacentral/StudentPhotos/${previewData.participant.roll}.jpg`}
                alt={previewData.participant.name}
                sx={{
                  width: { xs: 64, sm: 80, md: 90 },
                  height: { xs: 64, sm: 80, md: 90 },
                  border: { xs: '3px solid #ffffff', sm: '5px solid #ffffff' },
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                }}
              >
                No Photo
              </Avatar>

              <Box sx={{ textAlign: { xs: 'center', sm: 'left' }, flex: 1 }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                  Participant
                </Typography>
                <Typography
                  sx={{
                    fontWeight: 900,
                    color: '#1e293b',
                    mt: 0.5,
                    mb: 1,
                    lineHeight: 1.2,
                    wordBreak: 'break-word',
                    fontSize: { xs: '1.05rem', sm: '1.15rem', md: '1.25rem' }
                  }}
                >
                  {previewData.participant.name}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'center', sm: 'center' }, gap: { xs: 0.5, sm: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SchoolIcon sx={{ color: '#64748b', fontSize: { xs: 16, sm: 18 } }} />
                    <Typography sx={{ fontWeight: 800, color: '#334155', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                      {previewData.participant.roll}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccountBalanceIcon sx={{ color: '#94a3b8', fontSize: { xs: 16, sm: 18 } }} />
                    <Typography sx={{ color: '#64748b', fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {previewData.participant.college}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Paper>

          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <Paper elevation={0} sx={{ background: '#f9fafb', borderRadius: 4, p: { xs: 1.5, sm: 2 }, display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 }, border: '1px solid #f1f5f9', height: '100%' }}>
                <Box sx={{ width: { xs: 36, sm: 44 }, height: { xs: 36, sm: 44 }, borderRadius: 3, background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <EventIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />
                </Box>
                <Box>
                  <Typography sx={{ color: '#94a3b8', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                    Event Name
                  </Typography>
                  <Typography sx={{ fontWeight: 900, color: '#1e293b', lineHeight: 1.2, fontSize: { xs: '0.85rem', sm: '0.875rem' } }}>
                    {previewData.payment.eventName}
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Paper elevation={0} sx={{ background: '#f9fafb', borderRadius: 4, p: { xs: 1.5, sm: 2 }, display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 }, border: '1px solid #f1f5f9', height: '100%' }}>
                <Box sx={{ width: { xs: 36, sm: 44 }, height: { xs: 36, sm: 44 }, borderRadius: 3, background: '#e0f2fe', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <DescriptionIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />
                </Box>
                <Box sx={{ overflow: 'hidden' }}>
                  <Typography sx={{ color: '#94a3b8', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                    Certificate ID
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: 800,
                      color: '#1e293b',
                      lineHeight: 1.2,
                      wordBreak: 'break-all',
                      display: 'block',
                      fontSize: { xs: '0.7rem', sm: '0.75rem' }
                    }}
                  >
                    {previewData.payment.receipt}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Footer Area */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>Verified on</Typography>
                <Typography variant="subtitle2" sx={{ color: '#1e293b', fontWeight: 800 }}>
                  Sep 11, 2026
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default VerifyCertificatePreview;
