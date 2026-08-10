import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CloseIcon from '@mui/icons-material/Close';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../../api/axios';

const ScanPass = () => {
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
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

  const processScan = async (codeToScan) => {
    if (!codeToScan || !codeToScan.trim()) return;
    if (loadingRef.current) return;
    
    // Prevent immediate duplicate scans from camera
    if (lastScannedRef.current === codeToScan) return;
    lastScannedRef.current = codeToScan;

    setLoading(true);
    loadingRef.current = true;

    try {
      const response = await api.post('/api/razorpay/scan-barcode', { barcode: codeToScan.trim() });
      setScanResult({ 
        type: 'success', 
        message: response.data.isDuplicate ? 'Pass Already Verified' : 'Pass Verified Successfully',
        data: response.data 
      });
      setBarcode(''); // Reset for next scan
    } catch (err) {
      setScanResult({
        type: 'error',
        message: err.response?.data?.error || 'Failed to scan barcode.',
        data: err.response?.data?.participant ? { 
            participant: err.response.data.participant, 
            eventName: err.response.data.eventName, 
            isDuplicate: true 
        } : null
      });
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
    processScan(barcode);
  };

  const handleCloseDialog = () => {
    setScanResult(null);
    lastScannedRef.current = ''; // Reset so the same barcode can be scanned again if needed
    if (!cameraActive && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
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
    <Box p={3} maxWidth="md" mx="auto">
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
        <QrCodeScannerIcon fontSize="large" color="primary" />
        Scan Event Pass
      </Typography>

      <Paper sx={{ p: 4, mt: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="textSecondary" mb={4}>
          Use your device camera to scan the pass, or manually enter the pass code.
        </Typography>

        <Box display="flex" justifyContent="center" mb={4}>
          <Button
            variant={cameraActive ? "outlined" : "contained"}
            color="secondary"
            onClick={() => setCameraActive(!cameraActive)}
            startIcon={<QrCodeScannerIcon />}
            size="large"
          >
            {cameraActive ? 'Turn Off Camera' : 'Turn On Camera'}
          </Button>
        </Box>

        {cameraActive && (
          <Box id="reader" sx={{ width: '100%', maxWidth: 500, mx: 'auto', mb: 3 }} />
        )}

        {!cameraActive && (
        <form onSubmit={handleScan} style={{ display: 'flex', gap: '1rem', justifyContent: 'center', maxWidth: 600, margin: '0 auto' }}>
          <TextField
            inputRef={inputRef}
            label="Barcode / Pass Code"
            variant="outlined"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            disabled={loading}
            autoFocus
            fullWidth
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading || !barcode.trim()}
            sx={{ minWidth: 120, height: 56 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Scan'}
          </Button>
        </form>
        )}
      </Paper>

      {/* Result Dialog */}
      <Dialog open={!!scanResult} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          Scan Result
          <IconButton onClick={handleCloseDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {scanResult && (
            <Box>
              <Alert 
                severity={scanResult.type === 'error' ? 'error' : (scanResult.data?.isDuplicate ? 'warning' : 'success')} 
                sx={{ mb: 3, fontSize: '1.1rem', py: 1 }}
              >
                {scanResult.message}
              </Alert>
              {scanResult.data && scanResult.data.participant && (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="medium">
                    <TableBody>
                      <TableRow>
                        <TableCell component="th" sx={{ fontWeight: 'bold', width: '30%', bgcolor: '#f8fafc' }}>Name</TableCell>
                        <TableCell>{scanResult.data.participant.name}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" sx={{ fontWeight: 'bold', bgcolor: '#f8fafc' }}>Roll No</TableCell>
                        <TableCell>{scanResult.data.participant.roll}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" sx={{ fontWeight: 'bold', bgcolor: '#f8fafc' }}>Event</TableCell>
                        <TableCell>{scanResult.data.eventName}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" sx={{ fontWeight: 'bold', bgcolor: '#f8fafc' }}>College</TableCell>
                        <TableCell>
                          {scanResult.data.participant.college === 'Other College' 
                            ? scanResult.data.participant.otherCollege 
                            : scanResult.data.participant.college}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button onClick={handleCloseDialog} color="primary" variant="contained" size="large" fullWidth>
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScanPass;
