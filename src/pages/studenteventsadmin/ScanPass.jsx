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
import PageHeader from '../../components/common/PageHeader';
import { PageContainer } from '../../components/common/design-system';
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
        message: err.response?.data?.message || 'Invalid or Unregistered Pass Code',
        data: null
      });
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const handleScan = (e) => {
    e.preventDefault();
    processScan(barcode);
  };

  const handleCloseDialog = () => {
    setScanResult(null);
    lastScannedRef.current = '';
    if (inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  useEffect(() => {
    if (cameraActive) {
      const scanner = new Html5QrcodeScanner('reader', {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      });

      scanner.render(
        (decodedText) => {
          processScan(decodedText);
        },
        (error) => {
          // ignore scan errors
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
    <PageContainer>
      <PageHeader
        title="Scan Event Pass"
        subtitle="Use your device camera to scan the pass, or manually enter the pass code"
      />

      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 5 },
          borderRadius: '24px',
          background: 'var(--bg-paper)',
          border: '1px solid var(--border-color)',
          textAlign: 'center',
          boxShadow: 'var(--shadow-premium)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Typography variant="body1" color="textSecondary" mb={4}>
          Use your device camera to scan the pass, or manually enter the pass code.
        </Typography>

        {/* Turn On/Off Camera Action Button */}
        <Box display="flex" justifyContent="center" sx={{ mb: 4, mt: 1 }}>
          <Button
            variant="contained"
            onClick={() => setCameraActive(!cameraActive)}
            startIcon={<QrCodeScannerIcon />}
            size="large"
            sx={{
              borderRadius: '28px',
              px: 4,
              py: 1.4,
              fontWeight: 700,
              fontSize: '1rem',
              textTransform: 'none',
              background: cameraActive
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                : 'var(--gradient-primary)',
              color: '#ffffff',
              boxShadow: cameraActive
                ? '0 6px 20px rgba(239, 68, 68, 0.4)'
                : '0 6px 20px rgba(59, 130, 246, 0.35)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: cameraActive
                  ? '0 8px 25px rgba(239, 68, 68, 0.55)'
                  : '0 8px 25px rgba(59, 130, 246, 0.5)',
              },
            }}
          >
            {cameraActive ? 'Close Camera' : 'Scan'}
          </Button>
        </Box>

        {cameraActive && (
          <Box id="reader" sx={{ width: '100%', maxWidth: 500, mx: 'auto', mb: 3 }} />
        )}

        {!cameraActive && (
          <Box
            component="form"
            onSubmit={handleScan}
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              justifyContent: 'center',
              alignItems: 'stretch',
              maxWidth: 640,
              margin: '20px auto 0',
              width: '100%',
            }}
          >
            <TextField
              inputRef={inputRef}
              label="Barcode / Pass Code"
              variant="outlined"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              disabled={loading}
              autoFocus
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '16px',
                  bgcolor: 'var(--bg-panel, rgba(15, 23, 42, 0.6))',
                  '& fieldset': {
                    borderColor: 'var(--border-color)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'var(--color-primary)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'var(--color-primary)',
                    borderWidth: '2px',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'var(--text-secondary, #94a3b8)',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: 'var(--color-primary)',
                },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={loading || !barcode.trim()}
              sx={{
                minWidth: { xs: '100%', sm: 130 },
                height: 56,
                borderRadius: '28px',
                fontWeight: 800,
                fontSize: '1rem',
                textTransform: 'none',
                background: 'var(--gradient-primary)',
                boxShadow: '0 6px 20px rgba(59, 130, 246, 0.35)',
                '&:hover': {
                  boxShadow: '0 8px 25px rgba(59, 130, 246, 0.5)',
                },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify'}
            </Button>
          </Box>
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
    </PageContainer>
  );
};

export default ScanPass;
