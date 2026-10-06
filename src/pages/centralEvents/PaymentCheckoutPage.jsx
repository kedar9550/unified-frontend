import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  Stack,
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
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
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
            sx={{ mt: 2, borderRadius: 2 }}
          >
            Return to Central Events
          </Button>
        </Paper>
      </Container>
    );
  }

  if (isConfirmed) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
          <CheckCircleIcon color="success" sx={{ fontSize: 72, mb: 2 }} />
          <Typography variant="h4" fontWeight={700} color="success.main" gutterBottom>
            Payment Confirmed!
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Your event registration has been successfully confirmed.
          </Typography>

          {registrationDetail && (
            <Box sx={{ my: 3, p: 3, bg: '#f8f9fa', borderRadius: 2, textAlign: 'left' }}>
              <Typography variant="subtitle2" color="text.secondary">Event Title</Typography>
              <Typography variant="h6" fontWeight={700} mb={1}>{registrationDetail.centralEventId?.title}</Typography>

              <Typography variant="subtitle2" color="text.secondary">Status</Typography>
              <Chip label="CONFIRMED" color="success" size="small" sx={{ fontWeight: 700, mb: 1 }} />

              <Typography variant="subtitle2" color="text.secondary">Amount Paid</Typography>
              <Typography fontWeight={600}>₹{registrationDetail.payment?.amount / 100}</Typography>
            </Box>
          )}

          <Button
            variant="contained"
            onClick={() => navigate('/central-events')}
            sx={{ mt: 2, borderRadius: 2, px: 4 }}
          >
            Explore More Events
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
        <CardIcon color="primary" sx={{ fontSize: 56, mb: 2 }} />

        <Typography variant="h4" fontWeight={700} gutterBottom>
          Checkout Payment
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={3}>
          Complete your payment securely via Razorpay to confirm your event seat.
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
            sx={{ py: 1.8, borderRadius: 3, fontSize: '1.1rem', fontWeight: 700 }}
          >
            Pay ₹{sessionData.amount / 100} with Razorpay
          </Button>
        )}
      </Paper>
    </Container>
  );
}
