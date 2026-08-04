import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Html5QrcodeScanner } from 'html5-qrcode';
import html2pdf from 'html2pdf.js';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const ScanAccommodation = () => {
  const { activeRole, user } = useAuth();
  
  const ACCOMMODATION_DAYS = parseInt(import.meta.env.VITE_ACCOMMODATION_DAYS) || 2;
  const ACCOMMODATION_COST_PER_DAY = parseInt(import.meta.env.VITE_ACCOMMODATION_COST_PER_DAY) || 1;
  const TOTAL_ACCOMMODATION_COST = ACCOMMODATION_DAYS * ACCOMMODATION_COST_PER_DAY;

  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [scannedParticipants, setScannedParticipants] = useState([]);
  const [error, setError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const inputRef = useRef(null);
  const loadingRef = useRef(false);
  const lastScannedRef = useRef('');

  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [pendingParticipant, setPendingParticipant] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  
  // Invoice Modal State
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Auto-focus input on load for USB scanners
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Fetch all previous scans from backend
  useEffect(() => {
    const loadPreviousScans = async () => {
      try {
        let allowedEventNames = null;
        if (activeRole === 'FACULTY_COORDINATOR' && user) {
          const eventsRes = await api.get('/api/events');
          const events = eventsRes.data?.events || [];
          const userEvents = events.filter(e => {
            const coords = e.facultyCoordinators || (e.facultyCoordinator ? [e.facultyCoordinator] : []);
            return coords.some(c => 
              c.employeeId === user.institutionId || 
              c.employeeId === user.employeeId || 
              c.employeeId === user.employeeCode
            );
          });
          allowedEventNames = userEvents.map(e => e.eventName);
        }

        const response = await api.get('/api/razorpay/registrations');
        let payments = response.data.payments || [];
        
        if (allowedEventNames) {
          payments = payments.filter(p => allowedEventNames.includes(p.eventName || p.category));
        }

        const previousScans = [];
        
        payments.forEach(payment => {
          if (payment.participants && Array.isArray(payment.participants)) {
            payment.participants.forEach(p => {
              if (p.accommodationCheckedIn) {
                previousScans.push({
                  participant: p,
                  eventName: payment.eventName,
                  scannedAt: new Date(payment.updatedAt || payment.createdAt).getTime(),
                  isDuplicate: false
                });
              }
            });
          }
        });
        
        // Sort descending by simulated scannedAt (updatedAt)
        previousScans.sort((a, b) => b.scannedAt - a.scannedAt);
        setScannedParticipants(previousScans);
      } catch (err) {
        console.error('Failed to load previous scans:', err);
      }
    };

    loadPreviousScans();
  }, [activeRole, user]);

  const processScan = async (codeToScan) => {
    if (!codeToScan || !codeToScan.trim()) return;
    if (loadingRef.current) return;
    
    // Prevent immediate duplicate scans from camera
    if (lastScannedRef.current === codeToScan) return;
    lastScannedRef.current = codeToScan;

    setLoading(true);
    loadingRef.current = true;
    setError('');
    // Do not clear scannedParticipants here to keep the history

    try {
      const response = await api.post('/api/razorpay/scan-accommodation', { barcode: codeToScan.trim() });
      if (response.data.paymentRequired) {
        setPendingParticipant({ ...response.data, barcode: codeToScan.trim() });
        setPaymentModalOpen(true);
      } else {
        setScannedParticipants(prev => [{ ...response.data, scannedAt: Date.now() }, ...prev]);
        setBarcode(''); // Reset for next scan
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to scan barcode.');
      if (err.response?.data?.participant) {
         setBarcode(''); // Reset even if already scanned
      }
    } finally {
      setLoading(false);
      loadingRef.current = false;
      // Refocus input for next scan if not using camera
      if (!cameraActive && inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleScan = async (e) => {
    e.preventDefault();
    if (barcode.trim()) {
      processScan(barcode.trim());
    }
  };

  const loadRazorpay = () => {
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

  const handlePayment = async () => {
    if (!pendingParticipant) return;
    setPaymentLoading(true);
    try {
      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        alert('Razorpay SDK failed to load. Please check your connection.');
        setPaymentLoading(false);
        return;
      }

      // Create Order
      const amount = TOTAL_ACCOMMODATION_COST * 100; // converted to paise
      const orderRes = await api.post('/api/razorpay/accommodation/create-order', {
        amount,
        receipt: `receipt_${pendingParticipant.barcode}`
      });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY || 'rzp_live_Kmh34Xa4jArEXT',
        amount: orderRes.data.order.amount,
        currency: 'INR',
        name: 'Eventveda Accommodation',
        description: 'Accommodation Fee',
        order_id: orderRes.data.orderId,
        handler: async function (response) {
          try {
            const verifyRes = await api.post('/api/razorpay/accommodation/verify', {
              barcode: pendingParticipant.barcode,
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              amount: amount
            });
            
            // Payment success!
            setPaymentModalOpen(false);
            setScannedParticipants(prev => [{ ...verifyRes.data, scannedAt: Date.now() }, ...prev]);
            setBarcode('');
            alert('Payment done successfully! Participant is checked in.');
          } catch (err) {
            console.error('Payment verification failed:', err);
            alert('Payment Verification Failed!');
          }
        },
        prefill: {
          name: pendingParticipant.participant?.name || '',
          email: pendingParticipant.participant?.email || '',
          contact: pendingParticipant.participant?.mobile || ''
        },
        theme: {
          color: '#3399cc'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        alert('Payment Failed: ' + response.error.description);
      });
      rzp.open();

    } catch (err) {
      console.error('Payment init error:', err);
      alert('Error initiating payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  const downloadInvoice = () => {
    if (!selectedInvoice) return;
    const element = document.getElementById('invoice-content');
    const opt = {
      margin: 1,
      filename: `Accommodation_Invoice_${selectedInvoice.participant.roll}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  useEffect(() => {
    if (cameraActive) {
      const scanner = new Html5QrcodeScanner('reader', {
        qrbox: { width: 300, height: 150 },
        fps: 5,
        rememberLastUsedCamera: true
      });

      scanner.render(
        (decodedText) => {
          setBarcode(decodedText);
          processScan(decodedText);
        },
        (err) => {
          // ignore scan errors (they happen every frame when no barcode is found)
        }
      );

      return () => {
        scanner.clear().catch(e => console.error('Failed to clear scanner', e));
      };
    } else {
      lastScannedRef.current = '';
    }
  }, [cameraActive]);

  return (
    <Box p={3} maxWidth="xl" mx="auto">
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <QrCodeScannerIcon fontSize="large" color="primary" />
        Scan Accommodation Pass
      </Typography>

      <Grid container spacing={4}>
        {/* Left Side: Scanner */}
        <Grid item xs={12} sm={5} md={4}>
          <Paper sx={{ p: 3, mb: 4, textAlign: 'center', height: '100%' }}>
        <Typography variant="body1" color="textSecondary" mb={3}>
          Use your device camera to scan the pass, or manually enter the pass code.
        </Typography>

        <Box display="flex" justifyContent="center" mb={3}>
          <Button
            variant={cameraActive ? "outlined" : "contained"}
            color="secondary"
            onClick={() => setCameraActive(!cameraActive)}
            startIcon={<QrCodeScannerIcon />}
          >
            {cameraActive ? 'Turn Off Camera' : 'Turn On Camera'}
          </Button>
        </Box>

        {cameraActive && (
          <Box id="reader" sx={{ width: '100%', maxWidth: 500, mx: 'auto', mb: 3 }} />
        )}

        {!cameraActive && (
        <form onSubmit={handleScan} style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <TextField
            inputRef={inputRef}
            label="Barcode / Pass Code"
            variant="outlined"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            disabled={loading}
            autoFocus
            sx={{ flexGrow: 1, maxWidth: 400 }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading || !barcode.trim()}
            sx={{ minWidth: 120 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Scan'}
          </Button>
        </form>
        )}
          </Paper>
        </Grid>

        {/* Right Side: Results */}
        <Grid item xs={12} sm={7} md={8} sx={{ maxHeight: '85vh', overflowY: 'auto', pb: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {scannedParticipants.length > 0 ? (
            <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f8fafc' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f8fafc' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f8fafc' }}>Gender</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f8fafc' }}>Roll No</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f8fafc' }}>Event</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f8fafc' }}>College</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f8fafc' }}>Invoice</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {scannedParticipants.map((data, index) => (
                    <TableRow 
                      key={data.scannedAt + '-' + index}
                      sx={{ 
                        bgcolor: index === 0 ? '#f0fdf4' : 'inherit', // highlight latest scan
                        '&:hover': { bgcolor: '#f1f5f9' },
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <TableCell>
                        <Chip 
                          icon={<CheckCircleIcon />} 
                          label={data.isDuplicate ? "Already Checked-In" : "Checked-In"} 
                          color={index === 0 ? (data.isDuplicate ? "warning" : "success") : (data.isDuplicate ? "warning" : "default")}
                          variant={index === 0 ? "filled" : "outlined"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: index === 0 ? 'bold' : 'normal' }}>{data.participant.name}</TableCell>
                      <TableCell>{data.participant.gender || '-'}</TableCell>
                      <TableCell>{data.participant.roll}</TableCell>
                      <TableCell>{data.eventName}</TableCell>
                      <TableCell>
                        {data.participant.college === 'Other College' 
                          ? data.participant.otherCollege 
                          : data.participant.college}
                      </TableCell>
                      <TableCell>
                        {data.participant.accommodationPayment?.paid ? (
                          <Button 
                            variant="outlined" 
                            size="small" 
                            onClick={() => {
                               setSelectedInvoice(data);
                               setInvoiceModalOpen(true);
                            }}
                          >
                            View Invoice
                          </Button>
                        ) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : !error && (
            <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, bgcolor: 'transparent', border: '1px dashed grey' }} elevation={0}>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>Scan Accommodation Pass</Typography>
              <Typography variant="body2" color="text.secondary">
                Scan participant barcode or enter manually to mark accommodation check-in
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Payment Dialog */}
      <Dialog open={paymentModalOpen} onClose={() => setPaymentModalOpen(false)}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Accommodation Payment Required</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" gutterBottom>
            <strong>{pendingParticipant?.participant?.name}</strong> has requested accommodation but has not paid yet.
          </Typography>
          <Typography variant="body1" gutterBottom>
            Accommodation Fee: <strong>Rs. {ACCOMMODATION_COST_PER_DAY} / day</strong> for <strong>{ACCOMMODATION_DAYS} days</strong>.
          </Typography>
          <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
            Base Amount: Rs. {TOTAL_ACCOMMODATION_COST.toFixed(2)}
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
            (Gateway convenience fee will be added at checkout)
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentModalOpen(false)} disabled={paymentLoading}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handlePayment} 
            disabled={paymentLoading}
          >
            {paymentLoading ? <CircularProgress size={24} color="inherit" /> : 'Pay Now'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invoice Dialog */}
      <Dialog open={invoiceModalOpen} onClose={() => setInvoiceModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Invoice Details
          <Button variant="contained" color="primary" onClick={downloadInvoice}>
            Download PDF
          </Button>
        </DialogTitle>
        <DialogContent dividers>
          {selectedInvoice && (
            <Box id="invoice-content" sx={{ p: 2 }}>
              <Typography variant="h5" align="center" gutterBottom sx={{ fontWeight: 800 }}>
                Eventveda Accommodation
              </Typography>
              <Typography variant="subtitle1" align="center" color="textSecondary" gutterBottom>
                Payment Receipt
              </Typography>
              <Box sx={{ mt: 4 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Name</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{selectedInvoice.participant.name}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Roll No</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{selectedInvoice.participant.roll}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">College</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {selectedInvoice.participant.college === 'Other College' ? selectedInvoice.participant.otherCollege : selectedInvoice.participant.college}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Event</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{selectedInvoice.eventName}</Typography>
                  </Grid>
                </Grid>
              </Box>
              
              <Box sx={{ mt: 4, p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>Payment Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">Amount Paid</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                      Rs. {(selectedInvoice.participant.accommodationPayment.amount / 100).toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">Status</Typography>
                    <Chip label="PAID" color="success" size="small" />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">Payment ID (Razorpay)</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {selectedInvoice.participant.accommodationPayment.razorpayPaymentId}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">Order ID</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {selectedInvoice.participant.accommodationPayment.razorpayOrderId}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">Date</Typography>
                    <Typography variant="body2">
                      {new Date(selectedInvoice.participant.accommodationPayment.paidAt || selectedInvoice.scannedAt).toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInvoiceModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScanAccommodation;
