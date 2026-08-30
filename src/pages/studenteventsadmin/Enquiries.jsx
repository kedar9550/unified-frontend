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
  IconButton,
  Tooltip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  FileDownload as DownloadIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  Description as SubjectIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as PendingIcon,
  CheckCircle as RepliedIcon,
  Cancel as ClosedIcon,
  Delete as DeleteIcon,
  SupportAgent as SupportAgentIcon,
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import { PageContainer, EmptyState } from '../../components/common/design-system';
import ActionButton from '../../components/common/ActionButton';
import DataTable from '../../components/data/DataTable';
import API from '../../api/axios';
import { toast } from 'sonner';
import StatCard from '../../components/common/StatCard';
import StatCardGrid from '../../components/common/StatCardGrid';

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

const getStatusChip = (status) => {
  switch (status) {
    case 'Replied':
      return <Chip label="Replied" size="small" color="success" sx={{ fontWeight: 700, borderRadius: '8px' }} />;
    case 'Closed':
      return <Chip label="Closed" size="small" color="default" sx={{ fontWeight: 700, borderRadius: '8px' }} />;
    case 'Pending':
    default:
      return <Chip label="Pending" size="small" color="warning" sx={{ fontWeight: 700, borderRadius: '8px' }} />;
  }
};

const Enquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const response = await API.get('/api/inquiry');
      const data = response.data?.data || [];
      setInquiries(data);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      toast.error('Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  const handleStatusChange = async (inquiryId, newStatus) => {
    setUpdatingStatus(true);
    try {
      await API.patch(`/api/inquiry/${inquiryId}/status`, { status: newStatus });
      toast.success(`Inquiry status updated to ${newStatus}`);
      setInquiries((prev) =>
        prev.map((item) => (item._id === inquiryId ? { ...item, status: newStatus } : item))
      );
      if (selectedInquiry && selectedInquiry._id === inquiryId) {
        setSelectedInquiry((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async (inquiryId) => {
    if (!window.confirm('Are you sure you want to delete this enquiry?')) return;
    try {
      await API.delete(`/api/inquiry/${inquiryId}`);
      toast.success('Enquiry deleted successfully');
      setInquiries((prev) => prev.filter((item) => item._id !== inquiryId));
      if (dialogOpen && selectedInquiry?._id === inquiryId) {
        setDialogOpen(false);
      }
    } catch (error) {
      console.error('Error deleting enquiry:', error);
      toast.error('Failed to delete enquiry');
    }
  };

  const handleExportCSV = () => {
    if (inquiries.length === 0) {
      toast.error('No enquiry data to export');
      return;
    }

    const headers = ['S.No', 'Name', 'Email', 'Phone', 'Subject', 'Message', 'Status', 'Submitted At'];
    const rowsCsv = inquiries.map((item, index) => [
      index + 1,
      `"${(item.name || '').replace(/"/g, '""')}"`,
      `"${(item.email || '').replace(/"/g, '""')}"`,
      `"${(item.phone || '').replace(/"/g, '""')}"`,
      `"${(item.subject || '').replace(/"/g, '""')}"`,
      `"${(item.message || '').replace(/"/g, '""')}"`,
      `"${(item.status || 'Pending').replace(/"/g, '""')}"`,
      `"${formatDate(item.createdAt)}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rowsCsv.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VEDA_Enquiries_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Enquiries exported successfully');
  };

  const stats = {
    total: inquiries.length,
    pending: inquiries.filter((i) => !i.status || i.status === 'Pending').length,
    replied: inquiries.filter((i) => i.status === 'Replied').length,
    closed: inquiries.filter((i) => i.status === 'Closed').length,
  };

  const filteredInquiries = statusFilter === 'ALL'
    ? inquiries
    : inquiries.filter((i) => (i.status || 'Pending') === statusFilter);

  const columns = [
    'S.No',
    'Name',
    'Email',
    'Phone',
    'Subject',
    'Message',
    'Status',
    'Submitted At',
    'Actions',
  ];

  const rows = filteredInquiries.map((item, index) => {
    return [
      index + 1,
      {
        value: item.name || '-',
        display: (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: 'primary.light',
                color: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '13px',
              }}
            >
              {(item.name || 'U').charAt(0).toUpperCase()}
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {item.name || '-'}
            </Typography>
          </Box>
        ),
      },
      {
        value: item.email || '-',
        display: (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography
              component="a"
              href={`mailto:${item.email}?subject=Re: [VEDA 2026] Inquiry: ${encodeURIComponent(item.subject || '')}`}
              variant="body2"
              sx={{
                color: 'primary.main',
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              {item.email || '-'}
            </Typography>
          </Box>
        ),
      },
      item.phone || '-',
      {
        value: item.subject || '-',
        display: (
          <Chip
            label={item.subject || 'General'}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 600, borderRadius: '6px' }}
          />
        ),
      },
      {
        value: item.message || '-',
        display: (
          <Tooltip title={item.message || 'No message provided'}>
            <Typography
              variant="body2"
              sx={{
                maxWidth: 220,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: 'text.secondary',
              }}
            >
              {item.message || '-'}
            </Typography>
          </Tooltip>
        ),
      },
      {
        value: item.status || 'Pending',
        display: getStatusChip(item.status || 'Pending'),
      },
      formatDate(item.createdAt),
      {
        value: 'Actions',
        display: (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ViewIcon />}
              onClick={() => {
                setSelectedInquiry(item);
                setDialogOpen(true);
              }}
              sx={{ borderRadius: '8px', textTransform: 'none' }}
            >
              View
            </Button>
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDelete(item._id)}
              title="Delete Enquiry"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ),
      },
    ];
  });

  return (
    <PageContainer>
      <PageHeader
        title="Enquiries"
        subtitle="View and manage enquiries submitted through the VEDA portal"
        action={
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="contained"
              onClick={handleExportCSV}
              startIcon={<DownloadIcon />}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                px: 2.5,
                py: 0.8,
                fontWeight: 700,
                background: 'var(--gradient-primary)',
                color: '#ffffff',
                boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
                '&:hover': {
                  boxShadow: '0 6px 20px rgba(59, 130, 246, 0.5)',
                },
              }}
            >
              Export CSV
            </Button>
            <ActionButton onClick={fetchInquiries} startIcon={<RefreshIcon />}>
              Refresh
            </ActionButton>
          </Box>
        }
      />

      <StatCardGrid columns={4} sx={{ mb: 3 }}>
        <StatCard
          title="Total Enquiries"
          value={stats.total}
          color="#3b82f6"
          icon={<EmailIcon />}
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          color="#f59e0b"
          icon={<PendingIcon />}
        />
        <StatCard
          title="Replied"
          value={stats.replied}
          color="#10b981"
          icon={<RepliedIcon />}
        />
        <StatCard
          title="Closed"
          value={stats.closed}
          color="#64748b"
          icon={<ClosedIcon />}
        />
      </StatCardGrid>

      {/* Filter Tabs */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        {[
          { label: `All (${stats.total})`, value: 'ALL' },
          { label: `Pending (${stats.pending})`, value: 'Pending' },
          { label: `Replied (${stats.replied})`, value: 'Replied' },
          { label: `Closed (${stats.closed})`, value: 'Closed' },
        ].map((tab) => (
          <Button
            key={tab.value}
            variant={statusFilter === tab.value ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setStatusFilter(tab.value)}
            sx={{
              borderRadius: '20px',
              textTransform: 'none',
              fontWeight: 600,
              px: 2,
            }}
          >
            {tab.label}
          </Button>
        ))}
      </Box>

      {loading ? (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}>
          <CircularProgress size={32} />
        </Box>
      ) : (
        <Box sx={{ mt: 2 }}>
          {filteredInquiries.length === 0 ? (
            <EmptyState
              title="No enquiries found"
              description="Any user enquiries submitted through the contact page will appear here."
            />
          ) : (
            <DataTable
              columns={columns}
              rows={rows}
              nonSortableColumns={[0, 8]}
              alignments={['center', 'left', 'left', 'center', 'center', 'left', 'center', 'center', 'center']}
            />
          )}
        </Box>
      )}

      {/* Inquiry Detail Dialog */}
      {selectedInquiry && (
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          fullWidth
          maxWidth="sm"
          slotProps={{
            paper: {
              sx: {
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              },
            },
          }}
        >
          <DialogTitle
            sx={{
              background: 'var(--gradient-primary)',
              color: '#ffffff',
              py: 2,
              px: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <EmailIcon sx={{ color: '#fff' }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff' }}>
                Enquiry Details
              </Typography>
            </Box>
            <IconButton onClick={() => setDialogOpen(false)} sx={{ color: '#fff' }} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ p: 3, pt: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
              {/* User Info Header */}
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: '12px',
                  backgroundColor: 'background.default',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '18px',
                  }}
                >
                  {(selectedInquiry.name || 'U').charAt(0).toUpperCase()}
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                    {selectedInquiry.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    Submitted on {formatDate(selectedInquiry.createdAt)}
                  </Typography>
                </Box>
                {getStatusChip(selectedInquiry.status || 'Pending')}
              </Paper>

              {/* Details grid */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <EmailIcon fontSize="inherit" /> Email Address
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                    <a
                      href={`mailto:${selectedInquiry.email}`}
                      style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                      {selectedInquiry.email || '-'}
                    </a>
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PhoneIcon fontSize="inherit" /> Phone Number
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                    {selectedInquiry.phone ? (
                      <a
                        href={`tel:${selectedInquiry.phone}`}
                        style={{ color: 'inherit', textDecoration: 'none' }}
                      >
                        {selectedInquiry.phone}
                      </a>
                    ) : (
                      'N/A'
                    )}
                  </Typography>
                </Box>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <SubjectIcon fontSize="inherit" /> Query Subject
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={selectedInquiry.subject || 'General'}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 700 }}
                  />
                </Box>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Message / Query
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    mt: 0.5,
                    borderRadius: '8px',
                    backgroundColor: 'action.hover',
                    maxHeight: 180,
                    overflowY: 'auto',
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {selectedInquiry.message || 'No additional message provided.'}
                  </Typography>
                </Paper>
              </Box>

              {/* Status Updater */}
              <Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Update Status:
                  </Typography>
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <Select
                      value={selectedInquiry.status || 'Pending'}
                      onChange={(e) => handleStatusChange(selectedInquiry._id, e.target.value)}
                      disabled={updatingStatus}
                      sx={{ borderRadius: '8px', fontWeight: 600 }}
                    >
                      <MenuItem value="Pending">Pending</MenuItem>
                      <MenuItem value="Replied">Replied</MenuItem>
                      <MenuItem value="Closed">Closed</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 2.5, px: 3, bgcolor: 'background.default', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => handleDelete(selectedInquiry._id)}
              sx={{ borderRadius: '8px', textTransform: 'none' }}
            >
              Delete
            </Button>

            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                variant="contained"
                startIcon={<EmailIcon />}
                onClick={() => {
                  window.open(
                    `mailto:${selectedInquiry.email}?subject=Re: [VEDA 2026] Inquiry: ${encodeURIComponent(
                      selectedInquiry.subject || ''
                    )}&body=Hi ${encodeURIComponent(selectedInquiry.name || '')},\n\nRegarding your inquiry: "${encodeURIComponent(
                      selectedInquiry.message || ''
                    )}"\n\n`,
                    '_blank'
                  );
                }}
                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
              >
                Reply via Email
              </Button>
              <Button
                variant="outlined"
                onClick={() => setDialogOpen(false)}
                sx={{ borderRadius: '8px', textTransform: 'none' }}
              >
                Close
              </Button>
            </Box>
          </DialogActions>
        </Dialog>
      )}
    </PageContainer>
  );
};

export default Enquiries;
