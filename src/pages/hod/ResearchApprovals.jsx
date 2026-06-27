import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import {
  Box,
  Typography,
  Card,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  CircularProgress,
  Close,
} from '@mui/material';
import { Visibility as ViewIcon, Check as ApproveIcon, Close as RejectIcon } from '@mui/icons-material';
import DataTable from '../../components/data/DataTable';
const LabelValueDetails = ({ label, value, chip, horizontal = false }) => (
  <Box sx={{
    p: horizontal ? "10px 16px" : 1.5,
    borderRadius: "10px",
    background: horizontal ? "transparent" : "rgba(255,255,255,0.02)",
    display: "flex",
    flexDirection: horizontal ? "row" : "column",
    alignItems: horizontal ? "center" : "flex-start",
    justifyContent: horizontal ? "flex-start" : "center",
    gap: horizontal ? 2 : 0.5,
    borderBottom: horizontal ? "1px solid var(--border-color)" : "1px solid transparent",
    "&:last-child": { borderBottom: "none" },
  }}>
    <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 800, fontSize: "0.65rem", mb: horizontal ? 0 : 0.5 }}>{label}</Typography>
    <Box sx={{ flex: horizontal ? 1 : "none" }}>
      {chip ? chip : <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.85rem" }}>{value || "-"}</Typography>}
    </Box>
  </Box>
);

// Helper to format dates consistently
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// Helper to get status chip style
const getStatusStyle = (status) => {
  if (/Approved/i.test(status)) return { bg: 'rgba(16,185,129,0.1)', color: '#10B981' };
  if (/Pending/i.test(status)) return { bg: 'rgba(245,158,11,0.1)', color: '#F59E0B' };
  if (/Rejected/i.test(status)) return { bg: 'rgba(239,68,68,0.1)', color: '#EF4444' };
  return { bg: 'var(--bg-glass)', color: 'var(--text-secondary)' };
};

const ResearchApprovals = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null); // request object for detail dialog
  const [actionLoading, setActionLoading] = useState(false);

  // ---------------------------------------------------------------------
  // Fetch pending research requests for HOD
  // ---------------------------------------------------------------------
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/hod/research-requests');
      if (res.data?.success) setRequests(res.data.data);
    } catch (err) {
      console.error('Failed to load research requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------
  // Approve / Reject actions
  // ---------------------------------------------------------------------
  const handleApprove = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await API.post(`/api/hod/research-approvals/${selected._id}/approve`);
      fetchRequests();
      setSelected(null);
    } catch (err) {
      console.error('Approve failed', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await API.post(`/api/hod/research-approvals/${selected._id}/reject`);
      fetchRequests();
      setSelected(null);
    } catch (err) {
      console.error('Reject failed', err);
    } finally {
      setActionLoading(false);
    }
  };

  // ---------------------------------------------------------------------
  // Table configuration
  // ---------------------------------------------------------------------
  const columns = [
    '#',
    'Faculty Name',
    'Employee ID',
    'Title',
    'Type',
    'Submitted',
    'Status',
    'Actions',
  ];

  const rows = requests.map((item, index) => {
    const statusStyle = (() => {
      if (/Approved/i.test(item.status)) return { bg: 'rgba(16,185,129,0.1)', color: '#10B981' };
      if (/Pending/i.test(item.status)) return { bg: 'rgba(245,158,11,0.1)', color: '#F59E0B' };
      if (/Rejected/i.test(item.status)) return { bg: 'rgba(239,68,68,0.1)', color: '#EF4444' };
      return { bg: 'var(--bg-glass)', color: 'var(--text-secondary)' };
    })();

    return [
      index + 1,
      item.faculty?.name || 'N/A',
      item.faculty?.institutionId || 'N/A',
      item.title.length > 30 ? `${item.title.substring(0, 30)}...` : item.title,
      item.type,
      formatDate(item.createdAt),
      {
        value: item.status,
        display: (
          <Chip
            label={item.status}
            size="small"
            sx={{
              bgcolor: statusStyle.bg,
              color: statusStyle.color,
              fontWeight: 600,
              border: `1px solid ${statusStyle.bg.replace('0.1', '0.2')}`,
              borderRadius: '6px',
            }}
          />
        ),
      },
      {
        value: 'actions',
        display: (
          <Stack direction="row" spacing={1}>
            <Tooltip title="View Details">
              <IconButton size="small" sx={{ color: 'var(--color-primary)' }} onClick={() => setSelected(item)}>
                <ViewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {item.status.toLowerCase() === 'pending' && (
              <Tooltip title="Approve">
                <IconButton size="small" sx={{ color: '#10B981' }} onClick={handleApprove}>
                  <ApproveIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {item.status.toLowerCase() === 'pending' && (
              <Tooltip title="Reject">
                <IconButton size="small" sx={{ color: '#EF4444' }} onClick={handleReject}>
                  <RejectIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        ),
      },
    ];
  });

  // ---------------------------------------------------------------------
  // Detail dialog for a single request
  // ---------------------------------------------------------------------
  const DetailDialog = () => {
    const statusStyle = selected ? getStatusStyle(selected.status) : { bg: 'var(--bg-glass)', color: 'var(--text-secondary)' };
    return (
      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="md" fullWidth sx={{
        '& .MuiPaper-root': { borderRadius: '16px', background: 'var(--bg-panel)' },
      }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: 'var(--color-primary)' }}>
            Research Request Details
          </Typography>
          <IconButton onClick={() => setSelected(null)} sx={{ color: 'var(--text-secondary)' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selected && (
            <Grid container spacing={2}>
              <LabelValueDetails label="Faculty" value={selected.faculty?.name || 'N/A'} horizontal />
              <LabelValueDetails label="Employee ID" value={selected.faculty?.institutionId || 'N/A'} horizontal />
              <LabelValueDetails label="Title" value={selected.title} horizontal />
              <LabelValueDetails label="Type" value={selected.type} horizontal />
              <LabelValueDetails label="Submitted" value={formatDate(selected.createdAt)} horizontal />
              <LabelValueDetails
                label="Status"
                chip={
                  <Chip
                    label={selected.status}
                    size="small"
                    sx={{ bgcolor: statusStyle.bg, color: statusStyle.color, fontWeight: 600, borderRadius: '6px' }}
                  />
                }
                horizontal
              />
              {/* Additional fields (e.g., abstract, documents) can be added here */}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="success"
            startIcon={<ApproveIcon />}
            onClick={handleApprove}
            disabled={actionLoading || (selected && selected.status.toLowerCase() !== 'pending')}
            sx={{ mr: 1 }}
          >
            Approve
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<RejectIcon />}
            onClick={handleReject}
            disabled={actionLoading || (selected && selected.status.toLowerCase() !== 'pending')}
          >
            Reject
          </Button>
          <Button onClick={() => setSelected(null)} sx={{ textTransform: 'none' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // ---------------------------------------------------------------------
  // Render component
  // ---------------------------------------------------------------------
  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Card sx={{ p: 3, borderRadius: '20px', background: 'var(--bg-panel)', border: '1px solid var(--border-color)' }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: 'var(--text-primary)', mb: 2 }}>
          Pending Research Approvals
        </Typography>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <DataTable columns={columns} rows={rows} />
        )}
      </Card>

      {selected && <DetailDialog />}
    </Box>
  );
};

export default ResearchApprovals;
