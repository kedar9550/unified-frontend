import Loader from "../../components/common/Loader";
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import {
  Box, Typography, Card, Chip, Stack, IconButton, Tooltip,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  FormControl, Select, MenuItem
} from '@mui/material';
import PageHeader from '../../components/common/PageHeader';
import { PageContainer } from '../../components/common/design-system';
import { Visibility as ViewIcon, Check as ApproveIcon, Close as RejectIcon, Close, PlaylistAddCheck as ResourceIcon } from '@mui/icons-material';
import DataTable from '../../components/data/DataTable';
import { toast } from 'sonner';

const LabelValueDetails = ({ label, value, chip, horizontal = false }) => (
  <Box sx={{
    p: horizontal ? "10px 16px" : 1.5,
    borderRadius: "10px",
    background: horizontal ? "transparent" : "rgba(255,255,255,0.02)",
    display: "flex",
    flexDirection: horizontal ? "row" : "column",
    alignItems: horizontal ? "center" : "justify-content",
    justifyContent: horizontal ? "flex-start" : "center",
    gap: horizontal ? 2 : 0.5,
    borderBottom: horizontal ? "1px solid var(--border-color)" : "1px solid transparent",
  }}>
    <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800, fontSize: "0.65rem", mb: horizontal ? 0 : 0.5 }}>{label}</Typography>
    <Box sx={{ flex: horizontal ? 1 : "none" }}>
      {chip ? chip : <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.85rem" }}>{value || "-"}</Typography>}
    </Box>
  </Box>
);

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getStatusStyle = (status) => {
  if (/Approved/i.test(status)) return { bg: 'rgba(16,185,129,0.1)', color: '#10B981' };
  if (/Pending/i.test(status)) return { bg: 'rgba(245,158,11,0.1)', color: '#F59E0B' };
  if (/Rejected/i.test(status)) return { bg: 'rgba(239,68,68,0.1)', color: '#EF4444' };
  return { bg: 'var(--bg-glass)', color: 'var(--text-secondary)' };
};

const ResourceUtilizationApproval = () => {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("Pending at HOD");

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/value-addition/resource-utilization/pending-hod', {
        params: { status: statusFilter }
      });
      if (res.data?.success) setRequests(res.data.data);
    } catch (err) {
      console.error('Failed to load requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const handleAction = async (action) => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await API.put(`/api/value-addition/resource-utilization/hod-action/${selected._id}`, { action, comment: '' });
      toast.success(`Request ${action} successfully`);
      fetchRequests();
      setSelected(null);
    } catch (err) {
      toast.error(`Failed to ${action} request`);
      console.error('Action failed', err);
    } finally {
      setActionLoading(false);
    }
  };

  const columns = ['#', 'Faculty Name', 'Employee ID', 'Category', 'Type', 'Role', 'Status', 'Actions'];

  const rows = requests.map((item, index) => {
    const statusStyle = getStatusStyle(item.status);
    return [
      index + 1,
      item.facultyId?.name || 'N/A',
      item.facultyId?.institutionId || 'N/A',
      item.category?.name || '-',
      item.type || '-',
      item.role || '-',
      {
        value: item.status,
        display: (
          <Chip label={item.status} size="small" sx={{ bgcolor: statusStyle.bg, color: statusStyle.color, fontWeight: 600, borderRadius: '6px' }} />
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
            {item.status.toLowerCase().includes('pending') && (
              <>
                <Tooltip title="Approve">
                  <IconButton size="small" sx={{ color: '#10B981' }} onClick={() => { setSelected(item); handleAction('Approve'); }}>
                    <ApproveIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Reject">
                  <IconButton size="small" sx={{ color: '#EF4444' }} onClick={() => { setSelected(item); handleAction('Reject'); }}>
                    <RejectIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Stack>
        ),
      },
    ];
  });

  const DetailDialog = () => {
    const statusStyle = selected ? getStatusStyle(selected.status) : { bg: 'var(--bg-glass)', color: 'var(--text-secondary)' };
    return (
      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="md" fullWidth sx={{ '& .MuiPaper-root': { borderRadius: '16px', background: 'var(--bg-panel)' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: 'var(--color-primary)' }}>Resource Utilization Details</Typography>
          <IconButton onClick={() => setSelected(null)} sx={{ color: 'var(--text-secondary)' }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selected && (
            <Grid container spacing={2}>
              <LabelValueDetails label="Faculty" value={selected.facultyId?.name || 'N/A'} horizontal />
              <LabelValueDetails label="Employee ID" value={selected.facultyId?.institutionId || 'N/A'} horizontal />
              <LabelValueDetails label="Category" value={selected.category?.name || '-'} horizontal />
              <LabelValueDetails label="Type" value={selected.type} horizontal />
              <LabelValueDetails label="Role" value={selected.role} horizontal />
              <LabelValueDetails label="Submitted" value={formatDate(selected.createdAt)} horizontal />
              {selected.proof && (
                <LabelValueDetails label="Proof" display={
                  <Button variant="outlined" size="small" onClick={() => window.open(selected.proof, '_blank')}>View Proof</Button>
                } horizontal />
              )}
              <LabelValueDetails label="Status" chip={<Chip label={selected.status} size="small" sx={{ bgcolor: statusStyle.bg, color: statusStyle.color, fontWeight: 600, borderRadius: '6px' }} />} horizontal />
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'flex-end' }}>
          <Button variant="contained" color="success" startIcon={<ApproveIcon />} onClick={() => handleAction('Approve')} disabled={actionLoading || !selected?.status.toLowerCase().includes('pending')} sx={{ mr: 1 }}>Approve</Button>
          <Button variant="contained" color="error" startIcon={<RejectIcon />} onClick={() => handleAction('Reject')} disabled={actionLoading || !selected?.status.toLowerCase().includes('pending')}>Reject</Button>
          <Button onClick={() => setSelected(null)} sx={{ textTransform: 'none' }}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <PageContainer>
      <PageHeader
        title="Department Resource Utilization Approvals"
        subtitle="Approve, reject, and track department resource utilization submissions"
        icon={<ResourceIcon />}
      />
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><Loader /></Box>
      ) : (
        <DataTable 
          columns={columns} 
          rows={rows} 
          toolbarLeft={
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.5, color: "var(--text-secondary)" }}>Status</Typography>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{
                  borderRadius: "10px",
                  background: "var(--bg-paper)",
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: "var(--border-color)" }
                }}
              >
                <MenuItem value="Pending at HOD">Pending</MenuItem>
                <MenuItem value="Approved">Approved</MenuItem>
                <MenuItem value="Rejected">Rejected</MenuItem>
                <MenuItem value="All">All Requests</MenuItem>
              </Select>
            </FormControl>
          }
        />
      )}
      {selected && <DetailDialog />}
    </PageContainer>
  );
};

export default ResourceUtilizationApproval;
