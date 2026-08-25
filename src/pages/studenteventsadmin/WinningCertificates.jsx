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
  Switch,
  FormControlLabel,
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
  EmojiEvents as EmojiEventsIcon,
  FileDownload as DownloadIcon,
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

const WinningCertificates = () => {
  const navigate = useNavigate();
  const { activeRole, user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [allEvents, setAllEvents] = useState([]);
  const [departmentsDialogOpen, setDepartmentsDialogOpen] = useState(false);
  const [departmentsToView, setDepartmentsToView] = useState([]);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const eventsRes = await API.get('/api/events');
      const events = eventsRes.data?.events || [];
      setAllEvents(events);

      let allowedEventNames = null;
      if (activeRole === 'FACULTY_COORDINATOR' && user) {
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
      toast.error('Failed to fetch certificates');
    } finally {
      setLoading(false);
    }
  }, [user, activeRole]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const stats = {
    teamCount: payments.length,
    winnersCount: payments.filter(p => p.isFirstWinner || p.isSecondWinner || p.isThirdWinner).length,
    firstPrizeCount: payments.filter(p => p.isFirstWinner).length,
    secondPrizeCount: payments.filter(p => p.isSecondWinner).length,
    thirdPrizeCount: payments.filter(p => p.isThirdWinner).length,
  };

  const columns = [
    'S.No',
    'School Name',
    'Event Name',
    'Department(s)',
    'Team ID',
    'Team Size',
    'Winner Status',
    'First Prize',
    'Second Prize',
    'Third Prize',
  ];

  const handleDownloadCSV = () => {
    if (payments.length === 0) {
      toast.error('No data to download');
      return;
    }

    const headers = [
      'S.No', 'School Name', 'Event Name', 'Event Department(s)', 'Team ID', 'Team Size', 'Winner Status',
      'Participant Name', 'Gender', 'Roll Number', 'College', 'Student Department', 'Student Year', 'Mobile', 'Email'
    ];
    const csvRows = [headers.join(',')];
    let sNo = 1;

    payments.forEach((payment) => {
      const schoolCategory = payment.category || payment.schoolId || '-';
      const relatedEvent = allEvents.find(e => e._id === payment.eventId);
      let eventDepartmentStr = '-';
      if (relatedEvent && relatedEvent.department && relatedEvent.department.length > 0) {
        eventDepartmentStr = relatedEvent.department.map(d => d.name).join(', ');
      }

      const winnerStatus = payment.isFirstWinner ? 'First' : payment.isSecondWinner ? 'Second' : payment.isThirdWinner ? 'Third' : 'No';
      const teamId = payment.teamId || payment.receipt || '-';

      const teamBaseInfo = [
        `"${schoolCategory}"`,
        `"${payment.eventName || '-'}"`,
        `"${eventDepartmentStr}"`,
        `"${teamId}"`,
        payment.teamSize || 1,
        winnerStatus
      ];

      if (payment.participants && payment.participants.length > 0) {
        payment.participants.forEach((p) => {
          const participantRow = [
            sNo++,
            ...teamBaseInfo,
            `"${p.name || ''}"`,
            `"${p.gender || ''}"`,
            `"${p.roll || ''}"`,
            `"${p.college === 'Other College' && p.otherCollege ? p.otherCollege : (p.college || '')}"`,
            `"${p.department || ''}"`,
            `"${p.year || ''}"`,
            `"${p.mobile || ''}"`,
            `"${p.email || ''}"`
          ];
          csvRows.push(participantRow.join(','));
        });
      } else {
        const row = [
          sNo++,
          ...teamBaseInfo,
          '-', '-', '-', '-', '-', '-', '-', '-'
        ];
        csvRows.push(row.join(','));
      }
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Winning_Certificates_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenInvoice = (payment) => {
    setSelectedPayment(payment);
    setDialogOpen(true);
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const handleWinnerStatusChange = async (paymentId, prizeType, newStatus) => {
    try {
      const response = await API.put(`/api/razorpay/registrations/${paymentId}/winner`, {
        prizeType,
        status: newStatus
      });

      const { isFirstWinner, isSecondWinner, isThirdWinner } = response.data;

      toast.success('Winner status updated successfully');
      setPayments((prev) =>
        prev.map((p) =>
          p._id === paymentId
            ? { ...p, isFirstWinner, isSecondWinner, isThirdWinner }
            : p
        )
      );
    } catch (error) {
      console.error('Error updating winner status:', error);
      toast.error(error.response?.data?.message || 'Failed to update winner status');
    }
  };

  const rows = payments.map((payment, index) => {
    const schoolCategory = payment.category || payment.schoolId || '-';
    const relatedEvent = allEvents.find(e => e._id === payment.eventId);
    let departmentNode = '-';
    if (relatedEvent && relatedEvent.department && relatedEvent.department.length > 0) {
      if (relatedEvent.department.length > 1) {
        departmentNode = {
          value: 'All Departments',
          display: (
            <span 
              style={{ color: '#3b82f6', textDecoration: 'underline', cursor: 'pointer' }}
              onClick={() => {
                setDepartmentsToView(relatedEvent.department);
                setDepartmentsDialogOpen(true);
              }}
            >
              All Departments
            </span>
          )
        };
      } else {
        departmentNode = relatedEvent.department[0].name;
      }
    }

    return [
      index + 1,
      schoolCategory,
      payment.eventName || '-',
      departmentNode,
      {
        value: payment.teamId || payment.receipt || '-',
        display: (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">{payment.teamId || payment.receipt || '-'}</Typography>
            {payment.isFirstWinner && (
              <Chip
                icon={<EmojiEventsIcon sx={{ fontSize: '14px !important', color: '#fbbf24 !important' }} />}
                label="1st Prize"
                size="small"
                sx={{
                  height: '20px', fontSize: '0.65rem', fontWeight: 800,
                  background: 'rgba(245, 158, 11, 0.15)', color: '#d97706', border: '1px solid rgba(245, 158, 11, 0.3)'
                }}
              />
            )}
            {payment.isSecondWinner && (
              <Chip
                icon={<EmojiEventsIcon sx={{ fontSize: '14px !important', color: '#94a3b8 !important' }} />}
                label="2nd Prize"
                size="small"
                sx={{
                  height: '20px', fontSize: '0.65rem', fontWeight: 800,
                  background: 'rgba(148, 163, 184, 0.15)', color: '#64748b', border: '1px solid rgba(148, 163, 184, 0.3)'
                }}
              />
            )}
            {payment.isThirdWinner && (
              <Chip
                icon={<EmojiEventsIcon sx={{ fontSize: '14px !important', color: '#b45309 !important' }} />}
                label="3rd Prize"
                size="small"
                sx={{
                  height: '20px', fontSize: '0.65rem', fontWeight: 800,
                  background: 'rgba(180, 83, 9, 0.15)', color: '#92400e', border: '1px solid rgba(180, 83, 9, 0.3)'
                }}
              />
            )}
          </Box>
        )
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
      payment.isFirstWinner ? 'First' : payment.isSecondWinner ? 'Second' : payment.isThirdWinner ? 'Third' : 'No',
      {
        value: payment.isFirstWinner ? 'Yes' : 'No',
        display: (
          <FormControlLabel
            control={
              <Switch
                checked={payment.isFirstWinner || false}
                onChange={(e) => handleWinnerStatusChange(payment._id, 'first', e.target.checked)}
                color="success"
              />
            }
            label={payment.isFirstWinner ? 'Yes' : 'No'}
          />
        ),
      },
      {
        value: payment.isSecondWinner ? 'Yes' : 'No',
        display: (
          <FormControlLabel
            control={
              <Switch
                checked={payment.isSecondWinner || false}
                onChange={(e) => handleWinnerStatusChange(payment._id, 'second', e.target.checked)}
                color="success"
              />
            }
            label={payment.isSecondWinner ? 'Yes' : 'No'}
          />
        ),
      },
      {
        value: payment.isThirdWinner ? 'Yes' : 'No',
        display: (
          <FormControlLabel
            control={
              <Switch
                checked={payment.isThirdWinner || false}
                onChange={(e) => handleWinnerStatusChange(payment._id, 'third', e.target.checked)}
                color="success"
              />
            }
            label={payment.isThirdWinner ? 'Yes' : 'No'}
          />
        ),
      },
    ];
  });

  return (
    <Box sx={{ p: { xs: 2, md: 3, lg: 4 } }}>
      <PageHeader
        title="Winning Certificates"
        subtitle="View winning certificates for student events"
        action={
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              onClick={handleDownloadCSV}
              startIcon={<DownloadIcon />}
              sx={{ borderRadius: '12px', textTransform: 'none', px: 2.5, py: 1 }}
            >
              Export CSV
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

      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            { label: 'Total Teams', value: stats.teamCount, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', icon: <GroupIcon /> },
            { label: 'Total Winners', value: stats.winnersCount, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', icon: <CheckCircleIcon /> },
            { label: '1st Prize', value: stats.firstPrizeCount, color: '#d97706', bg: 'rgba(245, 158, 11, 0.15)', icon: <EmojiEventsIcon /> },
            { label: '2nd Prize', value: stats.secondPrizeCount, color: '#64748b', bg: 'rgba(148, 163, 184, 0.15)', icon: <EmojiEventsIcon /> },
            { label: '3rd Prize', value: stats.thirdPrizeCount, color: '#92400e', bg: 'rgba(180, 83, 9, 0.15)', icon: <EmojiEventsIcon /> },
          ].map((stat, idx) => (
            <Grid item xs={12} sm={6} md={2.4} key={idx}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: 'var(--border-color)',
                  background: `linear-gradient(135deg, var(--bg-panel, #ffffff) 0%, ${stat.bg} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2.5,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
                  }
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '14px',
                    background: stat.bg,
                    color: stat.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 4px 12px ${stat.bg}`
                  }}
                >
                  {React.cloneElement(stat.icon, { sx: { fontSize: 26 } })}
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', mb: 0.5, letterSpacing: '0.5px', fontSize: '0.7rem' }}>
                    {stat.label}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
                    {stat.value}
                  </Typography>
                </Box>

                {/* Background watermark icon */}
                <Box sx={{ position: 'absolute', right: -10, bottom: -15, opacity: 0.05, color: stat.color, transform: 'scale(2.5)' }}>
                  {React.cloneElement(stat.icon)}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

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
                nonSortableColumns={[0, 6, 7, 8]}
                alignments={['center', 'left', 'left', 'left', 'center', 'center', 'center', 'center', 'center']}
              />
            )}
          </Box>
        )}
      </Box>

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
                <GroupIcon sx={{ color: '#38bdf8' }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2, color: '#fff' }}>
                  ADITYA UNIVERSITY
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8', letterSpacing: '0.5px' }}>
                  TEAM & PARTICIPANT DETAILS
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                onClick={() => setDialogOpen(false)}
                sx={{ color: '#cbd5e1', '&:hover': { color: '#fff', background: 'rgba(255,255,255,0.1)' } }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>

          <DialogContent dividers sx={{ p: { xs: 2.5, sm: 4 }, background: 'var(--bg-panel, #ffffff)' }}>
            {/* Team and Event Info */}
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '16px', background: 'var(--bg-glass, #f8fafc)', height: '100%' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                    Team ID
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: 'monospace', color: 'var(--color-primary)', mt: 0.5, wordBreak: 'break-all', fontSize: '1.1rem' }}>
                    {selectedPayment.teamId || selectedPayment.receipt || '-'}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '16px', background: 'var(--bg-glass, #f8fafc)', height: '100%' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                    Main Group
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: 'var(--text-primary)', mt: 0.5, fontSize: '1.1rem' }}>
                    {selectedPayment.schoolId || '-'}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '16px', background: 'var(--bg-glass, #f8fafc)', height: '100%' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                    Category
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: 'var(--text-primary)', mt: 0.5, fontSize: '1.1rem' }}>
                    {selectedPayment.category || '-'}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '16px', background: 'var(--bg-glass, #f8fafc)', height: '100%' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                    Event Name
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mt: 0.5 }}>
                    <EventIcon color="primary" sx={{ mt: 0.5, fontSize: '1.1rem' }} />
                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.1rem', wordBreak: 'break-word' }}>
                      {selectedPayment.eventName || '-'}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              {/* Winner Status Card (Conditional) */}
              {(selectedPayment.isFirstWinner || selectedPayment.isSecondWinner || selectedPayment.isThirdWinner) && (
                <Grid item xs={12} sm={6} md={3}>
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '16px', background: 'var(--bg-glass, #f8fafc)', height: '100%', borderColor: selectedPayment.isFirstWinner ? '#fbbf24' : selectedPayment.isSecondWinner ? '#94a3b8' : '#b45309' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                      Winner Status
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {selectedPayment.isFirstWinner && (
                        <Chip
                          icon={<EmojiEventsIcon sx={{ fontSize: '18px !important', color: '#fbbf24 !important' }} />}
                          label="1st Prize"
                          sx={{ fontWeight: 800, background: 'rgba(245, 158, 11, 0.15)', color: '#d97706', border: '1px solid rgba(245, 158, 11, 0.3)' }}
                        />
                      )}
                      {selectedPayment.isSecondWinner && (
                        <Chip
                          icon={<EmojiEventsIcon sx={{ fontSize: '18px !important', color: '#94a3b8 !important' }} />}
                          label="2nd Prize"
                          sx={{ fontWeight: 800, background: 'rgba(148, 163, 184, 0.15)', color: '#64748b', border: '1px solid rgba(148, 163, 184, 0.3)' }}
                        />
                      )}
                      {selectedPayment.isThirdWinner && (
                        <Chip
                          icon={<EmojiEventsIcon sx={{ fontSize: '18px !important', color: '#b45309 !important' }} />}
                          label="3rd Prize"
                          sx={{ fontWeight: 800, background: 'rgba(180, 83, 9, 0.15)', color: '#92400e', border: '1px solid rgba(180, 83, 9, 0.3)' }}
                        />
                      )}
                    </Box>
                  </Paper>
                </Grid>
              )}
            </Grid>

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

          </DialogContent>

          <DialogActions sx={{ p: 2.5, px: 3, background: 'var(--bg-panel, #ffffff)' }}>
            <Button
              variant="outlined"
              onClick={handlePrintInvoice}
              startIcon={<PrintIcon />}
              sx={{ borderRadius: '10px', textTransform: 'none', px: 2.5 }}
            >
              Print Details
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

      <Dialog open={departmentsDialogOpen} onClose={() => setDepartmentsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>All Departments</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, p: 1 }}>
            {departmentsToView.map((d, i) => (
              <Chip key={i} label={d?.name || d} sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#1e40af' }} />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDepartmentsDialogOpen(false)} variant="contained" sx={{ textTransform: 'none' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WinningCertificates;
