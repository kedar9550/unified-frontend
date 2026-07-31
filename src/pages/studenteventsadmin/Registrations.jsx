import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  MenuItem,
  TextField,
  IconButton,
} from '@mui/material';
import {
  People as PeopleIcon,
  Payment as PaymentIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  School as SchoolIcon,
  Hotel as AccommodationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Event as EventIcon,
  Badge as BadgeIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/data/DataTable';
import API from '../../api/axios';
import { toast } from 'sonner';

const Registrations = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [eventFilter, setEventFilter] = useState('ALL');
  const [accommodationFilter, setAccommodationFilter] = useState('ALL');

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await API.get('/api/razorpay/registrations');
      setPayments(response.data?.payments || []);
    } catch (error) {
      console.error('Error fetching event registrations:', error);
      toast.error(error.response?.data?.message || 'Failed to load registrations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Flatten all participants across payment registrations
  const allParticipants = useMemo(() => {
    const list = [];
    payments.forEach((payment) => {
      if (Array.isArray(payment.participants)) {
        payment.participants.forEach((participant, pIdx) => {
          list.push({
            ...participant,
            id: `${payment._id || payment.receipt}-${pIdx}`,
            paymentId: payment._id,
            receipt: payment.receipt,
            eventName: payment.eventName || payment.category || 'Event',
            category: payment.category,
            schoolId: payment.schoolId,
            razorpayPaymentId: payment.razorpayPaymentId,
            razorpayOrderId: payment.razorpayOrderId,
            amount: payment.amountRupees ?? payment.amount,
            paidAt: payment.createdAt || payment.paidAt,
          });
        });
      }
    });
    return list;
  }, [payments]);

  // Extract unique events for filter dropdown
  const uniqueEvents = useMemo(() => {
    const eventsSet = new Set();
    allParticipants.forEach((p) => {
      if (p.eventName) eventsSet.add(p.eventName);
    });
    return Array.from(eventsSet);
  }, [allParticipants]);

  // Apply filters
  const filteredParticipants = useMemo(() => {
    return allParticipants.filter((p) => {
      // Event filter
      if (eventFilter !== 'ALL' && p.eventName !== eventFilter) return false;

      // Accommodation filter
      if (accommodationFilter === 'YES' && p.accommodation?.toLowerCase() !== 'yes') return false;
      if (accommodationFilter === 'NO' && p.accommodation?.toLowerCase() === 'yes') return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const name = (p.name || '').toLowerCase();
        const roll = (p.roll || '').toLowerCase();
        const email = (p.email || '').toLowerCase();
        const mobile = (p.mobile || '').toLowerCase();
        const college = (p.college || '').toLowerCase();
        const dept = (p.department || '').toLowerCase();
        const eventName = (p.eventName || '').toLowerCase();
        const receipt = (p.receipt || '').toLowerCase();

        return (
          name.includes(query) ||
          roll.includes(query) ||
          email.includes(query) ||
          mobile.includes(query) ||
          college.includes(query) ||
          dept.includes(query) ||
          eventName.includes(query) ||
          receipt.includes(query)
        );
      }

      return true;
    });
  }, [allParticipants, eventFilter, accommodationFilter, searchQuery]);

  // Metrics
  const accommodationCount = useMemo(() => {
    return allParticipants.filter((p) => p.accommodation?.toLowerCase() === 'yes').length;
  }, [allParticipants]);

  const uniqueCollegesCount = useMemo(() => {
    const set = new Set();
    allParticipants.forEach((p) => {
      if (p.college) set.add(p.college);
    });
    return set.size;
  }, [allParticipants]);

  // CSV Export handler
  const handleExportCSV = () => {
    if (filteredParticipants.length === 0) {
      toast.error('No registrations data to export.');
      return;
    }

    const headers = ['S.No', 'Name', 'Roll No', 'Event Name', 'College', 'Other College', 'Department', 'Year', 'Gender', 'Mobile', 'Email', 'Accommodation', 'Receipt No'];
    const csvRows = [headers.join(',')];

    filteredParticipants.forEach((p, idx) => {
      const row = [
        idx + 1,
        `"${p.name || ''}"`,
        `"${p.roll || ''}"`,
        `"${p.eventName || ''}"`,
        `"${p.college || ''}"`,
        `"${p.otherCollege || ''}"`,
        `"${p.department || ''}"`,
        `"${p.year || ''}"`,
        `"${p.gender || ''}"`,
        `"${p.mobile || ''}"`,
        `"${p.email || ''}"`,
        `"${p.accommodation || 'No'}"`,
        `"${p.receipt || ''}"`,
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VEDA_Event_Participants_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('registrations data exported successfully!');
  };

  const columns = [
    'S.No',
    'Name',
    'Roll Number',
    'Event Name',
    'College',
    'Department / Year',
    'Contact Info',
    'Accommodation',
    'Action',
  ];

  const handleOpenDetails = (participant) => {
    setSelectedParticipant(participant);
    setDialogOpen(true);
  };

  const rows = filteredParticipants.map((p, index) => {
    const isAccomm = p.accommodation?.toLowerCase() === 'yes';

    return [
      index + 1,
      {
        value: p.name || '-',
        display: (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              {p.name || '-'}
            </Typography>
            {p.gender ? (
              <Typography variant="caption" color="text.secondary">
                Gender: {p.gender}
              </Typography>
            ) : null}
          </Box>
        ),
      },
      p.roll ? (
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
          {p.roll}
        </Typography>
      ) : '-',
      p.eventName || '-',
      p.college ? `${p.college}${p.otherCollege ? ' (' + p.otherCollege + ')' : ''}` : '-',
      p.department ? `Dept: ${p.department}${p.year ? ' | Yr: ' + p.year : ''}` : (p.year ? `Yr: ${p.year}` : '-'),
      <Box>
        {p.mobile ? (
          <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>
            Ph: {p.mobile}
          </Typography>
        ) : null}
        {p.email ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {p.email}
          </Typography>
        ) : null}
      </Box>,
      {
        value: p.accommodation || 'No',
        display: (
          <Chip
            label={isAccomm ? 'Requested' : 'No'}
            color={isAccomm ? 'primary' : 'default'}
            size="small"
            sx={{ fontWeight: 700, borderRadius: '6px' }}
          />
        ),
      },
      {
        value: 'Details',
        display: (
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleOpenDetails(p)}
            startIcon={<ViewIcon sx={{ fontSize: 16 }} />}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Details
          </Button>
        ),
      },
    ];
  });

  return (
    <Box sx={{ p: { xs: 2, md: 3, lg: 4 } }}>
      <PageHeader
        title="VEDA Event Registrations"
        subtitle="View and manage all registered student event registrations"
        action={
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/Eventveda/payments')}
              startIcon={<PaymentIcon />}
              sx={{ borderRadius: '12px', textTransform: 'none', px: 2.5, py: 1 }}
            >
              View Payments
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

      {/* Summary Cards */}
      <Grid container spacing={2.5} sx={{ mt: 1, mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)',
              borderColor: 'rgba(56, 189, 248, 0.2)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  background: 'var(--color-primary, #0284c7)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PeopleIcon />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                  Total Registrations
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>
                  {allParticipants.length}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* <Grid item xs={12} sm={6} md={3}>
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%)',
              borderColor: 'rgba(34, 197, 94, 0.2)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  background: '#16a34a',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PaymentIcon />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                  Paid Registrations
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>
                  {payments.length}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid> */}

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.08) 100%)',
              borderColor: 'rgba(245, 158, 11, 0.2)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  background: '#d97706',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AccommodationIcon />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                  Accommodation Needed
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>
                  {accommodationCount}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(147, 51, 234, 0.08) 100%)',
              borderColor: 'rgba(168, 85, 247, 0.2)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  background: '#9333ea',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SchoolIcon />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                  Colleges Represented
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>
                  {uniqueCollegesCount}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Filter Controls Bar */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 3,
          borderRadius: '16px',
          display: 'flex',
          gap: 2,
          alignItems: 'center',
          flexWrap: 'wrap',
          background: 'var(--bg-panel, #ffffff)',
        }}
      >
        <TextField
          placeholder="Search by name, roll no, email..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ width: { xs: '100%', sm: 260 } }}
        />

        <TextField
          select
          label="Filter Event"
          size="small"
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="ALL">All Events</MenuItem>
          {uniqueEvents.map((evt) => (
            <MenuItem key={evt} value={evt}>
              {evt}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Accommodation"
          size="small"
          value={accommodationFilter}
          onChange={(e) => setAccommodationFilter(e.target.value)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="ALL">All Registrations</MenuItem>
          <MenuItem value="YES">Requested (Yes)</MenuItem>
          <MenuItem value="NO">No Accommodation</MenuItem>
        </TextField>

        <Box sx={{ ml: 'auto' }}>
          <Button
            variant="outlined"
            onClick={handleExportCSV}
            startIcon={<DownloadIcon />}
            sx={{ borderRadius: '10px', textTransform: 'none', px: 2 }}
          >
            Export CSV
          </Button>
        </Box>
      </Paper>

      {/* DataTable */}
      {loading ? (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}>
          <CircularProgress size={32} />
        </Box>
      ) : (
        <Box sx={{ mt: 2 }}>
          {filteredParticipants.length === 0 ? (
            <Box
              sx={{
                p: 4,
                borderRadius: '20px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-panel)',
                textAlign: 'center',
              }}
            >
              <Typography variant="h6" sx={{ mb: 1 }}>
                No Registrations found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your search query or filter criteria.
              </Typography>
            </Box>
          ) : (
            <DataTable
              columns={columns}
              rows={rows}
              nonSortableColumns={[0, 8]}
              alignments={['center', 'left', 'left', 'left', 'left', 'left', 'left', 'center', 'center']}
            />
          )}
        </Box>
      )}

      {/* Participant Detail Modal */}
      {selectedParticipant && (
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: { borderRadius: '20px', overflow: 'hidden' },
          }}
        >
          <DialogTitle
            sx={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: '#ffffff',
              py: 2,
              px: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BadgeIcon sx={{ color: '#38bdf8' }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff' }}>
                Student Profile
              </Typography>
            </Box>
            <IconButton
              onClick={() => setDialogOpen(false)}
              sx={{ color: '#cbd5e1', '&:hover': { color: '#fff' } }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers sx={{ p: 3, background: 'var(--bg-panel, #ffffff)' }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                {selectedParticipant.name || '-'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Roll Number: <strong>{selectedParticipant.roll || '-'}</strong> | Gender: <strong>{selectedParticipant.gender || '-'}</strong>
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                  Event Name
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {selectedParticipant.eventName || '-'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                  Receipt Number
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace', mt: 0.5 }}>
                  {selectedParticipant.receipt || '-'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                  College Name
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                  {selectedParticipant.college || '-'}{selectedParticipant.otherCollege ? ` (${selectedParticipant.otherCollege})` : ''}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                  Department & Year
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                  {selectedParticipant.department ? `Dept: ${selectedParticipant.department}` : ''} {selectedParticipant.year ? `| Year: ${selectedParticipant.year}` : ''}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                  Mobile Number
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                  {selectedParticipant.mobile || '-'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                  Email Address
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                  {selectedParticipant.email || '-'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                  Location / City
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                  {selectedParticipant.location || '-'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                  Accommodation Requested
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={selectedParticipant.accommodation || 'No'}
                    color={selectedParticipant.accommodation?.toLowerCase() === 'yes' ? 'primary' : 'default'}
                    size="small"
                    sx={{ fontWeight: 700 }}
                  />
                </Box>
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ p: 2, px: 3 }}>
            <Button variant="contained" onClick={() => setDialogOpen(false)} sx={{ borderRadius: '8px', textTransform: 'none' }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default Registrations;
