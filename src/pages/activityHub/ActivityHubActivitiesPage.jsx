import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Switch,
  Tooltip,
  CircularProgress,
  Pagination,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  Layers,
  Plus,
  Search,
  Calendar,
  CheckCircle2,
  XCircle,
  Eye,
  Edit,
  Users,
  RefreshCw,
  Building,
  GraduationCap
} from 'lucide-react';
import API from '../../api/axios';
import PageContainer from '../../components/common/design-system/PageContainer';
import PageHeader from '../../components/common/PageHeader';
import ActivityFormModal, { ACTIVITY_TYPES } from './ActivityFormModal';
import { toast } from 'sonner';

export default function ActivityHubActivitiesPage() {
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({ total: 0, enabled: 0, disabled: 0, totalRegistrations: 0 });
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [search, setSearch] = useState('');
  const [activityType, setActivityType] = useState('All');
  const [academicYear, setAcademicYear] = useState('All');
  const [isEnabled, setIsEnabled] = useState('All');

  // Dropdown options
  const [academicYears, setAcademicYears] = useState([]);

  // Modal State
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  // Fetch dropdown data once
  useEffect(() => {
    API.get('/api/academic-years')
      .then((res) => {
        const list = Array.isArray(res.data)
          ? res.data
          : (res.data?.data || res.data?.academicYears || []);
        setAcademicYears(list);
      })
      .catch(() => {});
  }, []);

  // Fetch KPI Stats
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await API.get('/api/activity-hub/stats');
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch Activities
  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search: search.trim() || undefined,
        activityType: activityType !== 'All' ? activityType : undefined,
        academicYear: academicYear !== 'All' ? academicYear : undefined,
        isEnabled: isEnabled !== 'All' ? isEnabled : undefined
      };

      const res = await API.get('/api/activity-hub', { params });
      if (res.data?.success) {
        setActivities(res.data.data || []);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setTotalCount(res.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
      toast.error('Failed to load activities list.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, activityType, academicYear, isEnabled]);

  useEffect(() => {
    fetchActivities();
    fetchStats();
  }, [fetchActivities]);

  // Toggle Enable / Disable
  const handleToggleStatus = async (activity) => {
    setTogglingId(activity._id);
    try {
      const res = await API.patch(`/api/activity-hub/${activity._id}/toggle-status`);
      if (res.data?.success) {
        const newStatus = res.data.data.isEnabled;
        toast.success(
          newStatus
            ? `"${activity.title}" is now Enabled and visible to students.`
            : `"${activity.title}" is now Disabled and closed for registration.`
        );
        fetchActivities();
        fetchStats();
      }
    } catch (err) {
      console.error('Error toggling activity status:', err);
      toast.error(err.response?.data?.message || 'Failed to toggle status.');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <PageContainer maxWidth="xl" px={3} py={3}>
      <PageHeader
        title="Activity Hub — Activities"
        subtitle="Create, configure, and manage university activities. Enable activities to publish them to the Student Portal for self-service registration."
        icon={<Layers />}
        actions={
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => {
              setEditingActivity(null);
              setFormModalOpen(true);
            }}
            sx={{
              borderRadius: '12px',
              bgcolor: '#004e92',
              color: '#ffffff',
              textTransform: 'none',
              fontWeight: 700,
              px: 3,
              py: 1,
              boxShadow: '0 4px 14px rgba(0, 78, 146, 0.25)',
              '&:hover': { bgcolor: '#003a6d' }
            }}
          >
            Create Activity
          </Button>
        }
      />

      {/* KPI Stats Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', p: 1 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  bgcolor: 'rgba(0, 78, 146, 0.1)',
                  color: '#004e92',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Layers size={24} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Total Activities
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  {statsLoading ? '...' : stats.total}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', p: 1 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  bgcolor: 'rgba(22, 163, 74, 0.1)',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CheckCircle2 size={24} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Enabled & Published
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#16a34a' }}>
                  {statsLoading ? '...' : stats.enabled}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', p: 1 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  bgcolor: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <XCircle size={24} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Disabled Drafts
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#ef4444' }}>
                  {statsLoading ? '...' : stats.disabled}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', p: 1 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  bgcolor: 'rgba(14, 165, 233, 0.1)',
                  color: '#0ea5e9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Users size={24} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Student Registrations
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0ea5e9' }}>
                  {statsLoading ? '...' : stats.totalRegistrations}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter & Search Bar */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: '16px', border: '1px solid #e2e8f0', mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by title, faculty, department..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              InputProps={{
                startAdornment: <Search size={18} color="#94a3b8" style={{ marginRight: 8 }} />
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
          </Grid>

          <Grid item xs={6} sm={4} md={2.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Activity Type"
              value={activityType}
              onChange={(e) => {
                setActivityType(e.target.value);
                setPage(1);
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            >
              <MenuItem value="All">All Types</MenuItem>
              {ACTIVITY_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={6} sm={4} md={2.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Academic Year"
              value={academicYear}
              onChange={(e) => {
                setAcademicYear(e.target.value);
                setPage(1);
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            >
              <MenuItem value="All">All Years</MenuItem>
              {academicYears.map((ay) => {
                const label = ay.year || ay.academicYear || ay.name || 'Unknown Year';
                return (
                  <MenuItem key={ay._id} value={label}>
                    {label} {ay.active ? ' (Active)' : ''}
                  </MenuItem>
                );
              })}
            </TextField>
          </Grid>

          <Grid item xs={6} sm={4} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Status"
              value={isEnabled}
              onChange={(e) => {
                setIsEnabled(e.target.value);
                setPage(1);
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            >
              <MenuItem value="All">All Status</MenuItem>
              <MenuItem value="true">Enabled (Published)</MenuItem>
              <MenuItem value="false">Disabled (Draft)</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={6} sm={12} md={1} sx={{ textAlign: 'right' }}>
            <Button
              variant="outlined"
              onClick={() => {
                fetchActivities();
                fetchStats();
              }}
              sx={{ minWidth: 40, height: 40, p: 0, borderRadius: '10px', borderColor: '#e2e8f0' }}
            >
              <RefreshCw size={18} color="#64748b" />
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Activities Table */}
      <Paper elevation={0} sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <TableContainer>
          <Table sx={{ minWidth: 800 }}>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>ACTIVITY</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>TYPE</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>DEPT & YEAR</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>DATES</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }} align="center">REGISTRATIONS</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }} align="center">ENABLED (PUBLISHED)</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }} align="center">ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                    <Typography variant="body2" sx={{ mt: 1.5, color: '#64748b' }}>
                      Loading activities...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : activities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Layers size={40} color="#94a3b8" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#334155', mt: 1 }}>
                      No Activities Found
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      Create a new activity to get started. Activities remain disabled until published.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                activities.map((act) => (
                  <TableRow key={act._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    {/* Title */}
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                        {act.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        Created by {act.createdByName || 'Faculty'}
                      </Typography>
                    </TableCell>

                    {/* Type Badge */}
                    <TableCell>
                      <Chip
                        label={act.activityType}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          borderRadius: '8px',
                          bgcolor: 'rgba(0, 78, 146, 0.08)',
                          color: '#004e92'
                        }}
                      />
                    </TableCell>

                    {/* Dept & Year */}
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                        {act.departmentName || 'All Departments'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        {act.academicYearName || '-'}
                      </Typography>
                    </TableCell>

                    {/* Dates */}
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.85rem' }}>
                        {new Date(act.startDate).toLocaleDateString('en-IN')} — {new Date(act.endDate).toLocaleDateString('en-IN')}
                      </Typography>
                    </TableCell>

                    {/* Registrations Count */}
                    <TableCell align="center">
                      <Chip
                        icon={<Users size={14} />}
                        label={`${act.registrationCount || 0}${act.maxParticipants > 0 ? ` / ${act.maxParticipants}` : ''}`}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          borderRadius: '8px',
                          bgcolor: act.registrationCount > 0 ? '#eff6ff' : '#f1f5f9',
                          color: act.registrationCount > 0 ? '#1d4ed8' : '#64748b'
                        }}
                      />
                    </TableCell>

                    {/* Enabled Switch */}
                    <TableCell align="center">
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                        <Switch
                          checked={Boolean(act.isEnabled)}
                          disabled={togglingId === act._id}
                          onChange={() => handleToggleStatus(act)}
                          color="success"
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 700,
                            color: act.isEnabled ? '#16a34a' : '#94a3b8',
                            minWidth: 54
                          }}
                        >
                          {act.isEnabled ? 'Enabled' : 'Disabled'}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Actions */}
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        <Tooltip title="Edit Activity">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditingActivity(act);
                              setFormModalOpen(true);
                            }}
                            sx={{ color: '#0284c7', '&:hover': { bgcolor: '#f0f9ff' } }}
                          >
                            <Edit size={17} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0' }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(e, val) => setPage(val)}
              color="primary"
              size="small"
            />
          </Box>
        )}
      </Paper>

      {/* Creation / Edit Modal */}
      {formModalOpen && (
        <ActivityFormModal
          open={formModalOpen}
          onClose={() => setFormModalOpen(false)}
          onSaved={() => {
            fetchActivities();
            fetchStats();
          }}
          initialData={editingActivity}
        />
      )}
    </PageContainer>
  );
}
