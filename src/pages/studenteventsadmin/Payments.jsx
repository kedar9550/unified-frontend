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
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/data/DataTable';
import API from '../../api/axios';
import { toast } from 'sonner';

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
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await API.get('/api/razorpay/registrations');
      setPayments(response.data?.payments || []);
    } catch (error) {
      console.error('Error fetching event payments:', error);
      toast.error(error.response?.data?.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const columns = [
    'Receipt',
    'Event Name',
    'Amount',
    'Currency',
    'Status',
    'Team Size',
    'Created At',
  ];

  const handleTeamSizeClick = (payment) => {
    setSelectedPayment(payment);
    setDialogOpen(true);
  };

  const rows = payments.map((payment) => [
    payment.receipt || '-',
    payment.eventName || payment.category || '-',
    payment.amount != null ? `₹ ${payment.amount}` : '-',
    payment.currency || 'INR',
    payment.paymentStatus || (payment.verified ? 'PAID' : 'PENDING'),
    {
      value: payment.teamSize || 1,
      display: (
        <Button
          variant="text"
          size="small"
          onClick={() => handleTeamSizeClick(payment)}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            color: 'var(--color-primary)',
          }}
        >
          {payment.teamSize || 1}
        </Button>
      ),
    },
    formatDate(payment.createdAt || payment.paidAt),
  ]);

  return (
    <Box sx={{ p: { xs: 2, md: 3, lg: 4 } }}>
      <PageHeader
        title="VEDA Event Payments"
        subtitle="View Razorpay payment registrations for student events"
        action={
          <Button
            variant="contained"
            onClick={fetchPayments}
            sx={{ borderRadius: '12px', textTransform: 'none', px: 3, py: 1.2 }}
          >
            Refresh
          </Button>
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
              nonSortableColumns={[]}
              alignments={['left', 'left', 'right', 'center', 'center', 'center', 'center']}
            />
          )}
        </Box>
      )}

      {/* Participant details dialog */}
      {selectedPayment && (
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>
            Participants — {selectedPayment.eventName || selectedPayment.receipt || 'Payment'}
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2">Receipt: {selectedPayment.receipt || '-'}</Typography>
              <Typography variant="body2">Amount: {selectedPayment.amount != null ? `₹ ${selectedPayment.amount}` : '-'}</Typography>
            </Box>

            {Array.isArray(selectedPayment.participants) && selectedPayment.participants.length > 0 ? (
              <List>
                {selectedPayment.participants.map((p, idx) => (
                  <ListItem key={idx} alignItems="flex-start" sx={{ py: 1 }}>
                    <ListItemText
                      primary={p.name || `Participant ${idx + 1}`}
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="text.primary">
                            {p.college ? `${p.college}${p.otherCollege ? ' / ' + p.otherCollege : ''}` : ''}
                          </Typography>
                          <br />
                          {p.roll ? `Roll: ${p.roll}` : ''}{p.gender ? ` ${p.gender ? '| ' + p.gender : ''}` : ''}
                          <br />
                          {p.mobile ? `Mobile: ${p.mobile}` : ''}{p.email ? ` ${p.email ? '| ' + p.email : ''}` : ''}
                          <br />
                          {p.year ? `Year: ${p.year}` : ''}{p.department ? ` ${p.department ? '| Dept: ' + p.department : ''}` : ''}
                        </>
                      }
                    />
                    {p.accommodation ? <Chip label={p.accommodation} size="small" sx={{ ml: 1 }} /> : null}
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography sx={{ py: 2 }}>No participant details available.</Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}

    </Box>
  );
};

export default Payments;
