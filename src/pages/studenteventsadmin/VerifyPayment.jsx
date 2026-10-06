import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Grid,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  Tooltip,
  Stack,
  Alert,
  Tabs,
  Tab,
  InputAdornment
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  FileUpload as FileUploadIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  ContentCopy as CopyIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  Verified as VerifiedIcon,
  Receipt as ReceiptIcon,
  People as PeopleIcon,
  FilterAlt as FilterIcon,
  Refresh as RefreshIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx-js-style';
import { toast } from 'sonner';
import API from '../../api/axios';
import { PageContainer } from '../../components/common/design-system';

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const VerifyPayment = () => {
  const navigate = useNavigate();

  // Input states
  const [selectedFile, setSelectedFile] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const [extractedIds, setExtractedIds] = useState([]);
  const [verifying, setVerifying] = useState(false);
  const [inputMode, setInputMode] = useState('file'); // 'file' | 'manual'

  // Results state
  const [verificationSummary, setVerificationSummary] = useState(null);
  const [results, setResults] = useState([]);
  
  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal state
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Helper to extract IDs from text or parsed sheet array
  const parseIdsFromRawData = (rows) => {
    const ids = [];
    rows.forEach((row) => {
      if (Array.isArray(row)) {
        row.forEach((cell) => {
          if (cell !== undefined && cell !== null) {
            const str = String(cell).trim();
            if (
              str &&
              !['id', 'payment_id', 'razorpay_payment_id', 'payment id', 'razorpay payment id'].includes(
                str.toLowerCase()
              )
            ) {
              ids.push(str);
            }
          }
        });
      } else if (typeof row === 'string') {
        const str = row.trim();
        if (
          str &&
          !['id', 'payment_id', 'razorpay_payment_id', 'payment id', 'razorpay payment id'].includes(
            str.toLowerCase()
          )
        ) {
          ids.push(str);
        }
      }
    });
    return Array.from(new Set(ids));
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const ids = parseIdsFromRawData(jsonRows);
        setExtractedIds(ids);

        if (ids.length === 0) {
          toast.warning('No valid payment IDs found in the file. Ensure column header is "Id" or rows contain payment IDs.');
        } else {
          toast.success(`Extracted ${ids.length} unique payment ID(s) from "${file.name}"`);
        }
      } catch (err) {
        console.error('Error parsing file:', err);
        toast.error('Failed to parse file. Please upload a valid CSV or Excel file.');
      }
    };

    reader.readAsBinaryString(file);
  };

  // Handle manual textarea input change
  const handleManualInputChange = (e) => {
    const val = e.target.value;
    setManualInput(val);
    const ids = val
      .split(/[\n,;\r]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !['id', 'payment_id'].includes(s.toLowerCase()));
    setExtractedIds(Array.from(new Set(ids)));
  };

  // Reset all state
  const handleReset = () => {
    setSelectedFile(null);
    setManualInput('');
    setExtractedIds([]);
    setVerificationSummary(null);
    setResults([]);
    setSearchQuery('');
    setStatusFilter('ALL');
  };

  // Download Sample CSV template
  const handleDownloadSample = () => {
    const sampleData = [
      ['Id'],
      ['pay_TXT8jNSfe8pWtl'],
      ['pay_TXTo2j36od8TGt'],
      ['pay_TXUrHpnea2WZwb'],
      ['pay_TXV4SqTZ8ObcUT'],
      ['pay_TXVDpJzLKRzNCd'],
      ['pay_TXVGvyxx5IWJMH']
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample_Payment_IDs');
    XLSX.writeFile(workbook, 'sample_razorpay_payment_ids.csv');
    toast.info('Sample CSV template downloaded!');
  };

  // Perform Verification Call to Backend
  const handleVerify = async () => {
    let idsToVerify = extractedIds;

    if (idsToVerify.length === 0 && manualInput.trim()) {
      const ids = manualInput
        .split(/[\n,;\r]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      idsToVerify = Array.from(new Set(ids));
    }

    if (idsToVerify.length === 0) {
      toast.error('Please upload a CSV file or paste payment IDs first');
      return;
    }

    setVerifying(true);
    try {
      const response = await API.post('/api/razorpay/registrations/verify-payment-ids', {
        paymentIds: idsToVerify
      });

      if (response.data?.ok) {
        setVerificationSummary(response.data.summary);
        setResults(response.data.results || []);
        toast.success(`Successfully verified ${response.data.summary?.totalUploaded || idsToVerify.length} payment ID(s)!`);
      } else {
        toast.error(response.data?.error || 'Failed to verify payment IDs');
      }
    } catch (err) {
      console.error('Verification error:', err);
      toast.error(err.response?.data?.error || 'Failed to process payment verification');
    } finally {
      setVerifying(false);
    }
  };

  // Filtered Results computed
  const filteredResults = useMemo(() => {
    return results.filter((item) => {
      // Status filter
      if (statusFilter === 'PAID' && item.status !== 'PAID') return false;
      if (statusFilter === 'PENDING' && item.status !== 'PENDING') return false;
      if (statusFilter === 'GATEWAY_ONLY' && item.status !== 'GATEWAY_CAPTURED' && item.status !== 'GATEWAY_FOUND') return false;
      if (statusFilter === 'NOT_FOUND' && item.status !== 'NOT_FOUND') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const desc = (item.description || '').toLowerCase();
        const pid = (item.inputPaymentId || '').toLowerCase();
        const rzpPid = (item.razorpayPaymentId || '').toLowerCase();
        const rzpOid = (item.razorpayOrderId || '').toLowerCase();
        const teamId = (item.teamId || '').toLowerCase();
        const eventName = (item.eventName || '').toLowerCase();
        const leadName = (item.leadParticipant?.name || '').toLowerCase();
        const leadRoll = (item.leadParticipant?.roll || '').toLowerCase();
        const leadCollege = (item.leadParticipant?.college || '').toLowerCase();

        const matchParticipant = item.participants?.some(
          (p) =>
            (p.name || '').toLowerCase().includes(q) ||
            (p.roll || '').toLowerCase().includes(q) ||
            (p.email || '').toLowerCase().includes(q) ||
            (p.mobile || '').toLowerCase().includes(q)
        );

        return (
          desc.includes(q) ||
          pid.includes(q) ||
          rzpPid.includes(q) ||
          rzpOid.includes(q) ||
          teamId.includes(q) ||
          eventName.includes(q) ||
          leadName.includes(q) ||
          leadRoll.includes(q) ||
          leadCollege.includes(q) ||
          matchParticipant
        );
      }

      return true;
    });
  }, [results, statusFilter, searchQuery]);

  // Download Complete Excel File
  const handleDownloadExcel = () => {
    if (results.length === 0) {
      toast.error('No verification results to download');
      return;
    }

    try {
      const workbook = XLSX.utils.book_new();

      // Sheet 1: Summary of All Verification Rows
      const summaryRows = results.map((item, index) => {
        const p = item.leadParticipant || {};
        return {
          'S.No': index + 1,
          'Input Payment ID': item.inputPaymentId || '-',
          'Razorpay Payment ID': item.razorpayPaymentId || '-',
          'Razorpay Order ID': item.razorpayOrderId || '-',
          'Description': item.description || item.eventName || '-',
          'DB Verification Status': item.status,
          'Payment Status': item.paymentStatus || '-',
          'Found in DB': item.foundInDb ? 'YES' : 'NO',
          'Found on Gateway': item.foundOnGateway ? 'YES' : 'NO',
          'Team ID': item.teamId || '-',
          'Event Name': item.eventName || '-',
          'Category': item.category || '-',
          'Lead Student Name': p.name || '-',
          'Roll Number': p.roll || '-',
          'College': p.college || '-',
          'Department': p.department || '-',
          'Mobile': p.mobile || '-',
          'Email': p.email || '-',
          'Total Team Size': item.teamSize || (item.participants ? item.participants.length : 1),
          'Amount (INR)': item.amount || 0,
          'Paid At / Date': item.paidAt ? formatDate(item.paidAt) : '-'
        };
      });

      const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Verification Summary');

      // Sheet 2: Complete Participants Breakdown
      const participantRows = [];
      let partIndex = 1;
      results.forEach((item) => {
        if (item.participants && item.participants.length > 0) {
          item.participants.forEach((p) => {
            participantRows.push({
              'S.No': partIndex++,
              'Payment ID': item.razorpayPaymentId || item.inputPaymentId || '-',
              'Order ID': item.razorpayOrderId || '-',
              'Description': item.description || item.eventName || '-',
              'Team ID': item.teamId || '-',
              'Event Name': item.eventName || '-',
              'Payment Status': item.status,
              'Student Name': p.name || '-',
              'Roll Number': p.roll || '-',
              'College': p.college || '-',
              'Other College': p.otherCollege || '-',
              'Department': p.department || '-',
              'Branch': p.branch || '-',
              'Year': p.year || '-',
              'Gender': p.gender || '-',
              'Mobile': p.mobile || '-',
              'Email': p.email || '-',
              'Accommodation': p.accommodation || 'No',
              'Barcode': p.barcode || '-',
              'Attended': p.attended ? 'YES' : 'NO'
            });
          });
        }
      });

      if (participantRows.length > 0) {
        const participantSheet = XLSX.utils.json_to_sheet(participantRows);
        XLSX.utils.book_append_sheet(workbook, participantSheet, 'All Participants Details');
      }

      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `Razorpay_Payment_Verification_Report_${dateStr}.xlsx`);
      toast.success(`Exported verification report for ${results.length} payment IDs to Excel!`);
    } catch (err) {
      console.error('Error downloading excel:', err);
      toast.error('Failed to generate Excel file');
    }
  };

  // Copy text helper
  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`Copied "${text}" to clipboard!`);
  };

  return (
    <PageContainer>
      {/* Header & Navigation */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton
              onClick={() => navigate('/Eventveda/manual-adding/pending')}
              sx={{
                bgcolor: 'action.hover',
                '&:hover': { bgcolor: 'action.selected' }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
                <VerifiedIcon sx={{ color: '#2563eb' }} /> Verify Payments
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upload CSV file with Razorpay Payment IDs to fetch complete payment details, status, and download Excel reports.
              </Typography>
            </Box>
          </Box>

          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate('/Eventveda/manual-adding/pending')}
              startIcon={<HourglassEmptyIcon />}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Pending Page
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate('/Eventveda/payments')}
              startIcon={<PaymentIcon />}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              All Payments
            </Button>
          </Stack>
        </Box>
      </Box>

      {/* Input Section */}
      <Card
        sx={{
          mb: 3.5,
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Tabs
              value={inputMode}
              onChange={(e, val) => setInputMode(val)}
              sx={{
                minHeight: '36px',
                '& .MuiTab-root': {
                  minHeight: '36px',
                  py: 0.5,
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  textTransform: 'none'
                }
              }}
            >
              <Tab icon={<CloudUploadIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Upload CSV / Excel File" value="file" />
              <Tab label="Paste Payment IDs Manually" value="manual" />
            </Tabs>

            <Button
              variant="text"
              size="small"
              color="primary"
              onClick={handleDownloadSample}
              startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
              sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.8rem' }}
            >
              Download Sample CSV
            </Button>
          </Box>

          {inputMode === 'file' ? (
            <Box
              sx={{
                border: '2px dashed',
                borderColor: selectedFile ? 'primary.main' : 'grey.300',
                borderRadius: '12px',
                bgcolor: selectedFile ? 'rgba(37, 99, 235, 0.03)' : 'grey.50',
                p: 4,
                textAlign: 'center',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'rgba(37, 99, 235, 0.02)'
                }
              }}
            >
              <CloudUploadIcon sx={{ fontSize: 48, color: selectedFile ? 'primary.main' : 'text.secondary', mb: 1 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                {selectedFile ? selectedFile.name : 'Select or Drag & Drop CSV / Excel File'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                File should contain a column header named <strong>"Id"</strong> or a list of Razorpay payment IDs (e.g. pay_TXT8jNSfe8pWtl).
              </Typography>

              <input
                type="file"
                accept=".csv, .xlsx, .xls, .txt"
                id="razorpay-file-upload"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <label htmlFor="razorpay-file-upload">
                <Button
                  variant={selectedFile ? 'outlined' : 'contained'}
                  component="span"
                  startIcon={<FileUploadIcon />}
                  sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
                >
                  {selectedFile ? 'Change File' : 'Browse CSV / Excel'}
                </Button>
              </label>

              {extractedIds.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Chip
                    color="primary"
                    size="small"
                    label={`${extractedIds.length} Payment ID(s) Extracted`}
                    sx={{ fontWeight: 700 }}
                  />
                </Box>
              )}
            </Box>
          ) : (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                Paste Razorpay payment IDs (one per line or comma separated):
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder={`pay_TXT8jNSfe8pWtl\npay_TXTo2j36od8TGt\npay_TXUrHpnea2WZwb`}
                value={manualInput}
                onChange={handleManualInputChange}
                sx={{
                  fontFamily: 'monospace',
                  '& .MuiInputBase-input': { fontSize: '0.88rem' }
                }}
              />
              {extractedIds.length > 0 && (
                <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700, mt: 0.5, display: 'block' }}>
                  Detected {extractedIds.length} unique Payment ID(s)
                </Typography>
              )}
            </Box>
          )}

          {/* Action Buttons */}
          <Box sx={{ mt: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1.5 }}>
            {(selectedFile || manualInput || results.length > 0) && (
              <Button
                variant="text"
                color="inherit"
                onClick={handleReset}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                Clear / Reset
              </Button>
            )}
            <Button
              variant="contained"
              color="primary"
              disabled={verifying || extractedIds.length === 0}
              onClick={handleVerify}
              startIcon={verifying ? <CircularProgress size={18} color="inherit" /> : <VerifiedIcon />}
              sx={{ textTransform: 'none', fontWeight: 700, px: 3, borderRadius: '8px', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)' }}
            >
              {verifying ? 'Verifying Payments...' : `Verify ${extractedIds.length > 0 ? extractedIds.length : ''} Payment IDs`}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Verification KPI Summary Cards */}
      {verificationSummary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: '14px',
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
              }}
            >
              <Box sx={{ p: 1.25, borderRadius: '10px', bgcolor: 'rgba(37, 99, 235, 0.1)', color: '#2563eb' }}>
                <ReceiptIcon sx={{ fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Total Uploaded
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                  {verificationSummary.totalUploaded}
                </Typography>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: '14px',
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
              }}
            >
              <Box sx={{ p: 1.25, borderRadius: '10px', bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                <CheckCircleIcon sx={{ fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Paid in Database
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#059669', lineHeight: 1.2 }}>
                  {verificationSummary.paidInDb}
                </Typography>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: '14px',
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'rgba(245, 158, 11, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
              }}
            >
              <Box sx={{ p: 1.25, borderRadius: '10px', bgcolor: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
                <HourglassEmptyIcon sx={{ fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Pending Registrations
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#d97706', lineHeight: 1.2 }}>
                  {verificationSummary.pendingInDb}
                </Typography>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: '14px',
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
              }}
            >
              <Box sx={{ p: 1.25, borderRadius: '10px', bgcolor: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
                <ErrorIcon sx={{ fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Not Found
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#dc2626', lineHeight: 1.2 }}>
                  {verificationSummary.notFound}
                </Typography>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: '14px',
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
              }}
            >
              <Box sx={{ p: 1.25, borderRadius: '10px', bgcolor: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>
                <PaymentIcon sx={{ fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Verified Amount
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#4f46e5', lineHeight: 1.2 }}>
                  ₹ {verificationSummary.totalAmount?.toLocaleString('en-IN') || 0}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Filter, Search & Download Bar */}
      {results.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2,
            borderRadius: '16px',
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', flex: 1 }}>
            <TextField
              size="small"
              placeholder="Search by Payment ID, Order ID, Student Name, Roll No, Event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  </InputAdornment>
                )
              }}
              sx={{ width: { xs: '100%', sm: 340 } }}
            />

            <Stack direction="row" spacing={0.5}>
              <Chip
                label={`All (${results.length})`}
                onClick={() => setStatusFilter('ALL')}
                color={statusFilter === 'ALL' ? 'primary' : 'default'}
                variant={statusFilter === 'ALL' ? 'filled' : 'outlined'}
                sx={{ fontWeight: 700, cursor: 'pointer' }}
              />
              <Chip
                label={`Paid (${results.filter((r) => r.status === 'PAID').length})`}
                onClick={() => setStatusFilter('PAID')}
                color={statusFilter === 'PAID' ? 'success' : 'default'}
                variant={statusFilter === 'PAID' ? 'filled' : 'outlined'}
                sx={{ fontWeight: 700, cursor: 'pointer' }}
              />
              <Chip
                label={`Pending (${results.filter((r) => r.status === 'PENDING').length})`}
                onClick={() => setStatusFilter('PENDING')}
                color={statusFilter === 'PENDING' ? 'warning' : 'default'}
                variant={statusFilter === 'PENDING' ? 'filled' : 'outlined'}
                sx={{ fontWeight: 700, cursor: 'pointer' }}
              />
              <Chip
                label={`Not Found (${results.filter((r) => r.status === 'NOT_FOUND').length})`}
                onClick={() => setStatusFilter('NOT_FOUND')}
                color={statusFilter === 'NOT_FOUND' ? 'error' : 'default'}
                variant={statusFilter === 'NOT_FOUND' ? 'filled' : 'outlined'}
                sx={{ fontWeight: 700, cursor: 'pointer' }}
              />
            </Stack>
          </Box>

          <Button
            variant="contained"
            color="success"
            onClick={handleDownloadExcel}
            startIcon={<DownloadIcon />}
            sx={{
              textTransform: 'none',
              fontWeight: 800,
              borderRadius: '8px',
              bgcolor: '#10b981',
              '&:hover': { bgcolor: '#059669' }
            }}
          >
            Download Excel Report
          </Button>
        </Paper>
      )}

      {/* Main Results Table */}
      {results.length > 0 ? (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            borderRadius: '16px',
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden'
          }}
        >
          <Table sx={{ minWidth: 850 }}>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, py: 1.5 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Razorpay Payment ID</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Order ID</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Team ID & Event</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Lead Student</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Team Size</TableCell>
                <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Amount (₹)</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 800, textAlign: 'center' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredResults.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No payment verification records match your search query.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredResults.map((item, index) => {
                  const lead = item.leadParticipant || {};
                  return (
                    <TableRow
                      key={item.inputPaymentId + '_' + index}
                      hover
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>{index + 1}</TableCell>
                      
                      {/* Payment ID */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography
                            variant="body2"
                            sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'text.primary' }}
                          >
                            {item.razorpayPaymentId || item.inputPaymentId}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => copyToClipboard(item.razorpayPaymentId || item.inputPaymentId)}
                            sx={{ p: 0.25 }}
                          >
                            <CopyIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Box>
                      </TableCell>

                      {/* Order ID */}
                      <TableCell>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                          {item.razorpayOrderId || '-'}
                        </Typography>
                      </TableCell>

                      {/* Description */}
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                          {item.description && item.description !== '-' ? item.description : (item.eventName || '-')}
                        </Typography>
                        {item.method && item.method !== '-' && (
                          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', display: 'block' }}>
                            Method: {item.method}
                          </Typography>
                        )}
                      </TableCell>

                      {/* Status Badge */}
                      <TableCell>
                        {item.status === 'PAID' && (
                          <Chip
                            icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
                            label="PAID (DB)"
                            size="small"
                            color="success"
                            sx={{ fontWeight: 800, fontSize: '0.72rem' }}
                          />
                        )}
                        {item.status === 'PENDING' && (
                          <Chip
                            icon={<HourglassEmptyIcon sx={{ fontSize: '14px !important' }} />}
                            label="PENDING (DB)"
                            size="small"
                            color="warning"
                            sx={{ fontWeight: 800, fontSize: '0.72rem' }}
                          />
                        )}
                        {(item.status === 'GATEWAY_CAPTURED' || item.status === 'GATEWAY_FOUND') && (
                          <Chip
                            label="GATEWAY CAPTURED"
                            size="small"
                            color="info"
                            sx={{ fontWeight: 800, fontSize: '0.72rem' }}
                          />
                        )}
                        {item.status === 'NOT_FOUND' && (
                          <Chip
                            icon={<ErrorIcon sx={{ fontSize: '14px !important' }} />}
                            label="NOT FOUND"
                            size="small"
                            color="error"
                            sx={{ fontWeight: 800, fontSize: '0.72rem' }}
                          />
                        )}
                      </TableCell>

                      {/* Team ID & Event */}
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {item.teamId && item.teamId !== '-' ? item.teamId : '-'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 180, display: 'block' }}>
                          {item.eventName || '-'}
                        </Typography>
                      </TableCell>

                      {/* Lead Student */}
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {lead.name || '-'}
                        </Typography>
                        {lead.roll && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {lead.roll} • {lead.college || ''}
                          </Typography>
                        )}
                      </TableCell>

                      {/* Team Size */}
                      <TableCell>
                        <Chip
                          icon={<PeopleIcon sx={{ fontSize: '12px !important' }} />}
                          label={`${item.teamSize || (item.participants ? item.participants.length : 1)} Student(s)`}
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                        />
                      </TableCell>

                      {/* Amount */}
                      <TableCell align="right" sx={{ fontWeight: 800, color: item.amount > 0 ? '#059669' : 'text.primary' }}>
                        ₹ {item.amount?.toLocaleString('en-IN') || 0}
                      </TableCell>

                      {/* Date */}
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(item.paidAt)}
                        </Typography>
                      </TableCell>

                      {/* View Action */}
                      <TableCell align="center">
                        <Tooltip title="View Complete Details">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {
                              setSelectedItem(item);
                              setDetailsDialogOpen(true);
                            }}
                          >
                            <ViewIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        !verifying && (
          <Paper
            elevation={0}
            sx={{
              p: 5,
              textAlign: 'center',
              borderRadius: '16px',
              border: '1px border',
              borderColor: 'divider',
              bgcolor: 'background.paper'
            }}
          >
            <VerifiedIcon sx={{ fontSize: 56, color: 'grey.300', mb: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5 }}>
              No Verification Data Loaded Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 460, mx: 'auto', mb: 2 }}>
              Upload a CSV file containing Razorpay payment IDs (column "Id") or paste them in the text box above and click "Verify Payment IDs".
            </Typography>
          </Paper>
        )
      )}

      {/* Complete Details Modal Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px', p: 1 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Payment & Registration Details
            </Typography>
          </Box>
          <IconButton onClick={() => setDetailsDialogOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ py: 2 }}>
          {selectedItem && (
            <Stack spacing={2.5}>
              {/* Summary Header */}
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: '12px', border: '1px solid', borderColor: 'divider' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                      RAZORPAY PAYMENT ID
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 800, color: 'primary.main' }}>
                      {selectedItem.razorpayPaymentId || selectedItem.inputPaymentId}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                      RAZORPAY ORDER ID
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                      {selectedItem.razorpayOrderId || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                      TEAM ID
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                      {selectedItem.teamId || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                      AMOUNT PAID
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#059669' }}>
                      ₹ {selectedItem.amount?.toLocaleString('en-IN') || 0}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                      VERIFICATION STATUS
                    </Typography>
                    <Box sx={{ mt: 0.25 }}>
                      <Chip
                        label={selectedItem.status}
                        size="small"
                        color={
                          selectedItem.status === 'PAID'
                            ? 'success'
                            : selectedItem.status === 'PENDING'
                            ? 'warning'
                            : selectedItem.status === 'NOT_FOUND'
                            ? 'error'
                            : 'info'
                        }
                        sx={{ fontWeight: 800 }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                      RAZORPAY PAYMENT DESCRIPTION
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 800, color: 'primary.main' }}>
                      {selectedItem.description && selectedItem.description !== '-' ? selectedItem.description : (selectedItem.eventName || '-')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                      EVENT NAME
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {selectedItem.eventName || '-'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Participants Section */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <PeopleIcon sx={{ fontSize: 18, color: 'primary.main' }} /> Registered Participants (
                  {selectedItem.participants ? selectedItem.participants.length : 0})
                </Typography>

                {selectedItem.participants && selectedItem.participants.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '10px' }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: 'grey.100' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Roll Number</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>College / Dept</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Mobile & Email</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Barcode</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedItem.participants.map((p, pIdx) => (
                          <TableRow key={pIdx}>
                            <TableCell sx={{ fontWeight: 700 }}>{p.name || '-'}</TableCell>
                            <TableCell sx={{ fontFamily: 'monospace' }}>{p.roll || '-'}</TableCell>
                            <TableCell>
                              <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>
                                {p.college || '-'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {p.department || p.branch || ''} {p.year ? `(${p.year})` : ''}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" sx={{ display: 'block' }}>
                                {p.mobile || '-'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {p.email || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'primary.main' }}>
                                {p.barcode || '-'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="warning" sx={{ borderRadius: '8px' }}>
                    No participant profiles found for this payment record.
                  </Alert>
                )}
              </Box>
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button variant="contained" onClick={() => setDetailsDialogOpen(false)} sx={{ textTransform: 'none', fontWeight: 700 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default VerifyPayment;
