import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
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
  TableHead,
  TableRow,
  IconButton,
} from '@mui/material';
import {
  ReceiptLong as ReceiptIcon,
  Visibility as ViewIcon,
  Print as PrintIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Group as GroupIcon,
  Event as EventIcon,
  PeopleAlt as PeopleAltIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/data/DataTable';
import API from '../../api/axios';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const Payments = () => {
  const navigate = useNavigate();
  const { activeRole, user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      let allowedEventNames = null;
      if (activeRole === 'FACULTY_COORDINATOR' && user) {
        const eventsRes = await API.get('/api/events');
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

      const response = await API.get('/api/razorpay/registrations');
      let fetchedPayments = response.data?.payments || [];
      
      if (allowedEventNames) {
        fetchedPayments = fetchedPayments.filter(p => allowedEventNames.includes(p.eventName || p.category));
      }
      
      setPayments(fetchedPayments);
    } catch (error) {
      console.error('Error fetching event payments:', error);
      toast.error(error.response?.data?.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [activeRole, user]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const columns = [
    'S.No',
    'Team ID',
    'Main Group / Category',
    'Event Name',
    'Amount',
    'Currency',
    'Status',
    'Team Size',
    'Action',
  ];

  const handleOpenInvoice = (payment) => {
    setSelectedPayment(payment);
    setDialogOpen(true);
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const rows = payments.map((payment, index) => {
    const amountValue = payment.amountRupees ?? payment.amount;
    const isPaid = (payment.paymentStatus || (payment.verified ? 'PAID' : 'PENDING')) === 'PAID';
    const schoolCategory = payment.category && payment.schoolId
      ? `${payment.schoolId.toUpperCase()} / ${payment.category}`
      : (payment.category || payment.schoolId || '-');

    return [
      index + 1,
      payment.teamId || '-',
      schoolCategory,
      payment.eventName || '-',
      amountValue != null ? `₹ ${Number(amountValue).toLocaleString('en-IN')}` : '-',
      payment.currency || 'INR',
      {
        value: payment.paymentStatus || (payment.verified ? 'PAID' : 'PENDING'),
        display: (
          <Chip
            label={payment.paymentStatus || (payment.verified ? 'PAID' : 'PENDING')}
            color={isPaid ? 'success' : 'warning'}
            size="small"
            sx={{ fontWeight: 700, borderRadius: '8px' }}
          />
        ),
      },
      {
        value: payment.teamSize || 1,
        display: (
          <Chip
            icon={<GroupIcon sx={{ fontSize: 14 }} />}
            label={`${payment.teamSize || 1} Participant${(payment.teamSize || 1) > 1 ? 's' : ''}`}
            variant="outlined"
            size="small"
            onClick={() => handleOpenInvoice(payment)}
            sx={{ cursor: 'pointer', fontWeight: 600 }}
          />
        ),
      },
      {
        value: 'View Invoice',
        display: (
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleOpenInvoice(payment)}
            startIcon={<ViewIcon sx={{ fontSize: 16 }} />}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Invoice
          </Button>
        ),
      },
    ];
  });

  const getPaymentMethod = (payment) => {
    const resp = payment?.rawPaymentData?.razorpayCompleteResponse;
    if (!resp) return 'Online (Razorpay)';
    const method = resp.method ? resp.method.toUpperCase() : 'ONLINE';
    if (resp.vpa) return `${method} (${resp.vpa})`;
    if (resp.bank) return `${method} (${resp.bank})`;
    return method;
  };

  const getRrn = (payment) => {
    return payment?.rawPaymentData?.razorpayCompleteResponse?.acquirer_data?.rrn || '-';
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3, lg: 4 } }}>
      <PageHeader
        title="VEDA Event Payments"
        subtitle="View Razorpay payment registrations and invoices for student events"
        action={
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/Eventveda/participants')}
              startIcon={<PeopleAltIcon />}
              sx={{ borderRadius: '12px', textTransform: 'none', px: 2.5, py: 1 }}
            >
              Participants
            </Button>
            <Button
              variant="contained"
              onClick={fetchPayments}
              startIcon={<RefreshIcon />}
              sx={{ borderRadius: '12px', textTransform: 'none', px: 2.5, py: 1 }}
            >
              Refresh
            </Button>
          </Box>
        }
      />

      {loading ? (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}>
          <CircularProgress size={32} />
        </Box>
      ) : (
        <Box sx={{ mt: 2 }}>
          {payments.length === 0 ? (
            <Box sx={{ p: 4, borderRadius: '20px', border: '1px solid var(--border-color)', background: 'var(--bg-panel)', textAlign: 'center' }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                No payment registrations found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Payment data will appear here once registrations are created or verified.
              </Typography>
            </Box>
          ) : (
            <DataTable
              columns={columns}
              rows={rows}
              nonSortableColumns={[0, 8]}
              alignments={['center', 'center', 'left', 'left', 'right', 'center', 'center', 'center', 'center']}
            />
          )}
        </Box>
      )}

      {/* Invoice Popup Dialog */}
      {selectedPayment && (
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          fullWidth
          maxWidth="md"
          PaperProps={{
            id: 'invoice-print-container',
            sx: {
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            },
          }}
        >
          {/* Header Bar */}
          <DialogTitle
            sx={{
              background: 'var(--gradient-primary)',
              color: '#ffffff',
              py: 2.5,
              px: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ReceiptIcon sx={{ color: '#38bdf8' }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2, color: '#fff' }}>
                  ADITYA UNIVERSITY
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8', letterSpacing: '0.5px' }}>
                  VEDA EVENT PAYMENT RECEIPT / INVOICE
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                icon={<CheckCircleIcon sx={{ color: '#22c55e !important' }} />}
                label={selectedPayment.paymentStatus || 'PAID'}
                sx={{
                  background: 'rgba(34, 197, 94, 0.15)',
                  color: '#4ade80',
                  fontWeight: 700,
                  borderRadius: '8px',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                }}
              />
              <IconButton
                onClick={handlePrintInvoice}
                sx={{ color: '#cbd5e1', '&:hover': { color: '#fff', background: 'rgba(255,255,255,0.1)' } }}
                title="Print Invoice"
              >
                <PrintIcon />
              </IconButton>
              <IconButton
                onClick={() => setDialogOpen(false)}
                sx={{ color: '#cbd5e1', '&:hover': { color: '#fff', background: 'rgba(255,255,255,0.1)' } }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>

          <DialogContent dividers sx={{ p: { xs: 2.5, sm: 4 }, background: 'var(--bg-panel, #ffffff)' }}>
            {/* Invoice Meta Grid */}
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px', background: 'var(--bg-glass, #f8fafc)' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, fontSize: '0.68rem' }}>
                    Receipt Number
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, fontFamily: 'monospace', wordBreak: 'break-all', mt: 0.5 }}>
                    {selectedPayment.receipt || '-'}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px', background: 'var(--bg-glass, #f8fafc)' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, fontSize: '0.68rem' }}>
                    Payment ID (Razorpay)
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, fontFamily: 'monospace', wordBreak: 'break-all', mt: 0.5 }}>
                    {selectedPayment.razorpayPaymentId || '-'}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px', background: 'var(--bg-glass, #f8fafc)' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, fontSize: '0.68rem' }}>
                    Order ID
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, fontFamily: 'monospace', wordBreak: 'break-all', mt: 0.5 }}>
                    {selectedPayment.razorpayOrderId || '-'}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px', background: 'var(--bg-glass, #f8fafc)' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, fontSize: '0.68rem' }}>
                    Payment Date & Time
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
                    {formatDate(selectedPayment.createdAt || selectedPayment.paidAt)}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Event Summary Card */}
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                mb: 3,
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%)',
                borderColor: 'rgba(99, 102, 241, 0.2)',
              }}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={7}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <EventIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                      {selectedPayment.eventName || selectedPayment.category || 'Event Registration'}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Category: <strong>{selectedPayment.category || selectedPayment.schoolId || 'General'}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Payment Method: <strong>{getPaymentMethod(selectedPayment)}</strong> | RRN: <strong>{getRrn(selectedPayment)}</strong>
                  </Typography>
                </Grid>

                <Grid item xs={12} md={5} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                    Total Amount Paid
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: 'var(--color-primary, #0284c7)' }}>
                    ₹ {Number(selectedPayment.amountRupees ?? selectedPayment.amount ?? 0).toLocaleString('en-IN')}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* Registered Participants Section */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <GroupIcon color="action" />
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  Registered Participants ({Array.isArray(selectedPayment.participants) ? selectedPayment.participants.length : 0})
                </Typography>
              </Box>

              {Array.isArray(selectedPayment.participants) && selectedPayment.participants.length > 0 ? (
                <Paper variant="outlined" sx={{ borderRadius: '14px', overflow: 'hidden' }}>
                  <Table size="small">
                    <TableHead sx={{ background: 'var(--bg-glass, #f1f5f9)' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800, width: 50 }}>#</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Participant Name</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Roll Number</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>College & Dept</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Contact Info</TableCell>
                        <TableCell sx={{ fontWeight: 800, textAlign: 'center' }}>Accomm.</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedPayment.participants.map((p, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell sx={{ fontWeight: 700 }}>{idx + 1}</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>
                            {p.name || '-'}
                            {p.gender ? (
                              <Typography component="span" variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                Gender: {p.gender}
                              </Typography>
                            ) : null}
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{p.roll || '-'}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {p.college === 'Other College' && p.otherCollege ? p.otherCollege : (p.college || '-')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {p.department ? `Dept: ${p.department}` : ''}{p.year ? ` | Yr: ${p.year}` : ''}{p.location ? ` | Loc: ${p.location}` : ''}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>
                              {p.mobile ? `Ph: ${p.mobile}` : ''}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              {p.email || ''}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={p.accommodation || 'No'}
                              color={p.accommodation?.toLowerCase() === 'yes' ? 'primary' : 'default'}
                              size="small"
                              sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
              ) : (
                <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  No participant details available for this registration.
                </Typography>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Computer-generated official receipt issued by Aditya University Digital Services.
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                Status: Verified & Paid
              </Typography>
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 2.5, px: 3, background: 'var(--bg-panel, #ffffff)' }}>
            <Button
              variant="outlined"
              onClick={handlePrintInvoice}
              startIcon={<PrintIcon />}
              sx={{ borderRadius: '10px', textTransform: 'none', px: 2.5 }}
            >
              Print Receipt
            </Button>
            <Button
              variant="contained"
              onClick={() => setDialogOpen(false)}
              sx={{ borderRadius: '10px', textTransform: 'none', px: 3 }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}

    </Box>
  );
};

export default Payments;
