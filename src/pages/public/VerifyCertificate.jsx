import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Paper, CircularProgress, Grid, Divider } from '@mui/material';
import API from '../../api/axios';
import { CheckCircle as CheckCircleIcon, Error as ErrorIcon } from '@mui/icons-material';

const VerifyCertificate = () => {
  const { receipt, roll } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVerification = async () => {
      try {
        const response = await API.get(`/api/razorpay/registrations?roll=${roll}`);
        const payments = response.data?.payments || [];
        
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
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', p: 3 }}>
      <Paper sx={{ p: { xs: 3, sm: 5 }, borderRadius: 4, maxWidth: 650, width: '100%', borderTop: '6px solid #10b981', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' }}>
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <CheckCircleIcon sx={{ fontSize: 72, color: '#10b981', mb: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>Certificate Verified</Typography>
          <Typography color="text.secondary" sx={{ mt: 1, fontSize: '1.1rem' }}>This certificate is authentic and officially issued by Aditya University.</Typography>
        </Box>
        
        <Divider sx={{ mb: 4 }} />

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: 4, mb: 4 }}>
          <Box 
            component="img" 
            src={`https://info.aec.edu.in/adityacentral/StudentPhotos/${data.participant.roll}.jpg`}
            onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=No+Photo'; }}
            alt="Student"
            sx={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '4px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
          />
          <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b', mb: 0.5 }}>{data.participant.name}</Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 600 }}>{data.participant.roll}</Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5, fontWeight: 500 }}>{data.participant.college}</Typography>
          </Box>
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Event Name</Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b', mt: 0.5 }}>{data.payment.eventName || data.payment.category}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Certificate ID</Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b', mt: 0.5, fontFamily: 'monospace' }}>VEDA2026-P-{data.payment.receipt}</Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default VerifyCertificate;
