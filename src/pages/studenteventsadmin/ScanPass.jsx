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
  Grid
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const ScanPass = () => {
  const { activeRole, user } = useAuth();
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [scannedParticipants, setScannedParticipants] = useState([]);
  const [error, setError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const inputRef = useRef(null);
  const loadingRef = useRef(false);
  const lastScannedRef = useRef('');

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
              if (p.attended) {
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
      const response = await api.post('/api/razorpay/scan-barcode', { barcode: codeToScan.trim() });
      setScannedParticipants(prev => [{ ...response.data, scannedAt: Date.now() }, ...prev]);
      setBarcode(''); // Reset for next scan
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to scan barcode.');
      if (err.response?.data?.participant) {
         setScannedParticipants(prev => [{ ...err.response.data, scannedAt: Date.now(), isDuplicate: true }, ...prev]);
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
    processScan(barcode);
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
    <Box p={3} maxWidth="lg" mx="auto">
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <QrCodeScannerIcon fontSize="large" color="primary" />
        Scan Event Pass
      </Typography>

      <Grid container spacing={4}>
        {/* Left Side: Scanner */}
        <Grid item xs={12} md={6}>
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
        <Grid item xs={12} md={6} sx={{ maxHeight: '85vh', overflowY: 'auto', pb: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {scannedParticipants.length > 0 ? (
            <Box display="flex" flexDirection="column" gap={2}>
              {scannedParticipants.map((data, index) => (
                <Card key={data.scannedAt + '-' + index} sx={{ border: index === 0 ? '2px solid #4caf50' : '1px solid #ccc', borderRadius: 2 }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <CheckCircleIcon color={index === 0 ? (data.isDuplicate ? "warning" : "success") : "action"} fontSize="large" />
                      <Typography variant="h6" color={index === 0 ? (data.isDuplicate ? "warning.main" : "success.main") : "textPrimary"}>
                        {data.isDuplicate ? "Already Verified" : "Pass Verified"}
                      </Typography>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="textSecondary">Participant Name</Typography>
                        <Typography variant="body1" fontWeight="bold">{data.participant.name}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="textSecondary">Roll Number</Typography>
                        <Typography variant="body1">{data.participant.roll}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="textSecondary">Event</Typography>
                        <Typography variant="body1">{data.eventName}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="textSecondary">College</Typography>
                        <Typography variant="body1">
                          {data.participant.college === 'Other College' 
                            ? data.participant.otherCollege 
                            : data.participant.college}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : !error && (
            <Paper sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, bgcolor: 'transparent', border: '1px dashed grey' }} elevation={0}>
              <Typography variant="body1" color="textSecondary">
                Scanned participant details will appear here.
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default ScanPass;
