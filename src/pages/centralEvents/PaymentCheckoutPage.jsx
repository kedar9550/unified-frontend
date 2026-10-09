import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Divider,
  Chip
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  CreditCard as CardIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { getPaymentSession, verifyPaymentSignature, getRegistrationById } from '../../api/centralEventsApi';
import { PageHeader } from '../../components/common';
import PageContainer from '../../components/common/design-system/PageContainer';
import { toast } from 'sonner';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function PaymentCheckoutPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  // Verification & Polling states
  const [verifying, setVerifying] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [registrationDetail, setRegistrationDetail] = useState(null);

  useEffect(() => {
    const initSession = async () => {
      try {
        const res = await getPaymentSession(token);
        if (res.status === 'PAID') {
          setIsConfirmed(true);
          setLoading(false);
          return;
        }

        if (res.success) {
          setSessionData(res.data);
        }
      } catch (err) {
        if (err.response?.status === 410) {
          setIsExpired(true);
          setErrorMsg(err.response?.data?.message || 'Payment link has expired (15 minute limit)');
        } else {
          setErrorMsg(err.response?.data?.message || 'Failed to initialize payment session');
        }
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, [token]);

  const handleOpenCheckout = async () => {
    if (!sessionData) return;

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      toast.error('Failed to load Razorpay SDK. Check internet connection.');
      return;
    }

    const options = {
      key: sessionData.keyId,
      amount: sessionData.amount,
      currency: sessionData.currency || 'INR',
      name: 'Central Events Registration',
      description: 'Registration Payment',
      order_id: sessionData.orderId,
      handler: async (response) => {
        setVerifying(true);
        try {
          // 1. Send UX verification call
          await verifyPaymentSignature({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          });

          // 2. Poll registration endpoint for webhook confirmation (every 2.5s up to 30s)
          let attempts = 0;
          const maxAttempts = 12;

          const pollInterval = setInterval(async () => {
            attempts++;
            try {
              const regRes = await getRegistrationById(sessionData.registrationId);
              if (regRes.success && regRes.data.status === 'CONFIRMED') {
                clearInterval(pollInterval);
                setRegistrationDetail(regRes.data);
                setIsConfirmed(true);
                setVerifying(false);
                toast.success('Payment confirmed successfully!');
              } else if (attempts >= maxAttempts) {
                clearInterval(pollInterval);
                setVerifying(false);
                toast.info('Payment received! Status will update shortly.');
              }
            } catch (pollErr) {
              if (attempts >= maxAttempts) clearInterval(pollInterval);
            }
          }, 2500);

        } catch (verErr) {
          setVerifying(false);
          toast.error(verErr.response?.data?.message || 'Payment signature verification failed');
        }
      },
      prefill: {},
      theme: {
        color: '#1976d2'
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (isExpired || errorMsg) {
    return (
      <PageContainer maxWidth="sm" px={3} py={6}>
        <Paper elevation={0} sx={{ p: 4, borderRadius: '18px', textAlign: 'center', border: '1px solid var(--border-color)', background: 'var(--bg-paper)' }}>
          <ErrorIcon color="error" sx={{ fontSize: 64, mb: 2 }} />
          <Typography variant="h5" fontWeight={700} gutterBottom>
            {isExpired ? 'Payment Link Expired' : 'Unable to Process Payment'}
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {errorMsg}
          </Typography>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/central-events')}
            sx={{ mt: 2, borderRadius: '12px', textTransform: 'none', px: 3 }}
          >
            Return to Central Events
          </Button>
        </Paper>
      </PageContainer>
    );
  }

  if (isConfirmed) {
    return (
      <PageContainer maxWidth="sm" px={3} py={6}>
        <Paper elevation={0} sx={{ p: 4, borderRadius: '18px', textAlign: 'center', border: '1px solid var(--border-color)', background: 'var(--bg-paper)' }}>
          <CheckCircleIcon color="success" sx={{ fontSize: 72, mb: 2 }} />
          <Typography variant="h4" fontWeight={700} color="success.main" gutterBottom>
            Payment Confirmed!
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Your event registration has been successfully confirmed.
          </Typography>

          {registrationDetail && (
            <Box sx={{ my: 3, p: 3, bgcolor: 'var(--bg-accent-1, #f8fafc)', borderRadius: '14px', textAlign: 'left', border: '1px solid var(--border-color)' }}>
              <Typography variant="subtitle2" color="text.secondary">Event Title</Typography>
              <Typography variant="h6" fontWeight={700} mb={1}>{registrationDetail.centralEventId?.title}</Typography>

              <Typography variant="subtitle2" color="text.secondary">Status</Typography>
              <Chip label="CONFIRMED" color="success" size="small" sx={{ fontWeight: 700, mb: 1, borderRadius: '8px' }} />

              <Typography variant="subtitle2" color="text.secondary">Amount Paid</Typography>
              <Typography fontWeight={600}>₹{registrationDetail.payment?.amount / 100}</Typography>
            </Box>
          )}

          <Button
            variant="contained"
            onClick={() => navigate('/central-events')}
            sx={{ mt: 2, borderRadius: '12px', px: 4, textTransform: 'none', fontWeight: 700 }}
          >
            Explore More Events
          </Button>
        </Paper>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="sm" px={3} py={6}>
      <PageHeader
        title="Event Registration Checkout"
        subtitle="Complete your payment securely via Razorpay to confirm your event seat"
        icon={<CardIcon />}
        showBack
        backPath="/central-events"
      />

      <Paper elevation={0} sx={{ p: 4, borderRadius: '18px', textAlign: 'center', border: '1px solid var(--border-color)', background: 'var(--bg-paper)', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
        <CardIcon color="primary" sx={{ fontSize: 56, mb: 2 }} />

        <Typography variant="h5" fontWeight={700} gutterBottom>
          Registration Checkout
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Click below to trigger Razorpay secure payment processing.
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Box display="flex" justifyContent="space-between" alignItems="center" my={3}>
          <Typography variant="h6" color="text.secondary">Total Payable Amount:</Typography>
          <Typography variant="h4" color="primary.main" fontWeight={700}>
            ₹{sessionData.amount / 100}
          </Typography>
        </Box>

        {verifying ? (
          <Box sx={{ my: 3 }}>
            <CircularProgress size={36} />
            <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
              Confirming payment with Razorpay...
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Please do not refresh or close this tab.
            </Typography>
          </Box>
        ) : (
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleOpenCheckout}
            sx={{
              py: 1.8,
              borderRadius: '12px',
              fontSize: '1.1rem',
              fontWeight: 700,
              textTransform: 'none',
              background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
            }}
          >
            Pay ₹{sessionData.amount / 100} with Razorpay
          </Button>
        )}
      </Paper>
    </PageContainer>
  );
}
