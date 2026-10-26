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
  CircularProgress,
  Pagination,
  Grid
} from '@mui/material';
import {
  Users,
  Search,
  Download,
  RefreshCw,
  FileSpreadsheet,
  Calendar,
  Layers
} from 'lucide-react';
import API from '../../api/axios';
import PageContainer from '../../components/common/design-system/PageContainer';
import PageHeader from '../../components/common/PageHeader';
import { toast } from 'sonner';

export default function ActivityHubRegistrationsPage() {
  const [registrations, setRegistrations] = useState([]);
  const [activitiesList, setActivitiesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [search, setSearch] = useState('');
  const [selectedActivityId, setSelectedActivityId] = useState('All');
  const [department, setDepartment] = useState('All');

  // Load user's activities for dropdown
  useEffect(() => {
    API.get('/api/activity-hub?limit=100')
      .then((res) => {
        if (res.data?.success) {
          setActivitiesList(res.data.data || []);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch Registrations
  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        activityId: selectedActivityId !== 'All' ? selectedActivityId : undefined,
        search: search.trim() || undefined,
        department: department !== 'All' ? department : undefined
      };

      const res = await API.get('/api/activity-hub/registrations', { params });
      if (res.data?.success) {
        setRegistrations(res.data.data || []);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setTotalCount(res.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Error fetching registrations:', err);
      toast.error('Failed to load registrations.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, selectedActivityId, search, department]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  // Export to Excel handler
  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const queryParams = selectedActivityId !== 'All' ? `?activityId=${selectedActivityId}` : '';
      const response = await API.get(`/api/activity-hub/registrations/export${queryParams}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ActivityHub_Registrations_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Registration roster exported to Excel successfully!');
    } catch (err) {
      console.error('Error downloading Excel:', err);
      toast.error('Failed to export registration data to Excel.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <PageContainer maxWidth="xl" px={3} py={3}>
      <PageHeader
        title="Activity Hub — Registrations"
        subtitle="View verified student registrations for activities. Filter by activity, search roll numbers, and export official roster reports to Excel."
        icon={<Users />}
        actions={
          <Button
            variant="contained"
            startIcon={isExporting ? <CircularProgress size={16} color="inherit" /> : <FileSpreadsheet size={18} />}
            onClick={handleExportExcel}
            disabled={isExporting}
            sx={{
              borderRadius: '12px',
              bgcolor: '#16a34a',
              color: '#ffffff',
              textTransform: 'none',
              fontWeight: 700,
              px: 3,
              py: 1,
              boxShadow: '0 4px 14px rgba(22, 163, 74, 0.25)',
              '&:hover': { bgcolor: '#15803d' }
            }}
          >
            {isExporting ? 'Exporting...' : 'Export to Excel'}
          </Button>
        }
      />

      {/* Filter Bar */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: '16px', border: '1px solid #e2e8f0', mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Select Activity"
              value={selectedActivityId}
              onChange={(e) => {
                setSelectedActivityId(e.target.value);
                setPage(1);
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            >
              <MenuItem value="All">All Activities</MenuItem>
              {activitiesList.map((act) => (
                <MenuItem key={act._id} value={act._id}>
                  {act.title} ({act.activityType} — {act.registrationCount || 0} registered)
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by student roll number, name, dept..."
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

          <Grid item xs={8} md={2}>
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
              Total Records: <strong>{totalCount}</strong>
            </Typography>
          </Grid>

          <Grid item xs={4} md={1} sx={{ textAlign: 'right' }}>
            <Button
              variant="outlined"
              onClick={fetchRegistrations}
              sx={{ minWidth: 40, height: 40, p: 0, borderRadius: '10px', borderColor: '#e2e8f0' }}
            >
              <RefreshCw size={18} color="#64748b" />
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Registrations Table */}
      <Paper elevation={0} sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <TableContainer>
          <Table sx={{ minWidth: 800 }}>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem', width: 60 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>ROLL NUMBER</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>STUDENT NAME</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>DEPT / BRANCH</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>ACTIVITY TITLE</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>REGISTERED AT</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }} align="center">STATUS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                    <Typography variant="body2" sx={{ mt: 1.5, color: '#64748b' }}>
                      Loading registration records...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : registrations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Users size={40} color="#94a3b8" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#334155', mt: 1 }}>
                      No Registrations Found
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      Students will appear here once they register for enabled activities through the Student Portal.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                registrations.map((reg, idx) => (
                  <TableRow key={reg._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 600 }}>
                      {(page - 1) * limit + idx + 1}
                    </TableCell>

                    {/* Roll Number */}
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#004e92' }}>
                        {reg.rollNumber}
                      </Typography>
                    </TableCell>

                    {/* Student Name */}
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>
                        {reg.studentName || 'Student'}
                      </Typography>
                      {reg.email && (
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {reg.email}
                        </Typography>
                      )}
                    </TableCell>

                    {/* Dept / Branch */}
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#334155' }}>
                        {reg.department || reg.branch || '-'}
                      </Typography>
                      {reg.semester && (
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          Sem: {reg.semester}
                        </Typography>
                      )}
                    </TableCell>

                    {/* Activity Title */}
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                        {reg.activity?.title || 'Activity'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        {reg.activity?.activityType || ''}
                      </Typography>
                    </TableCell>

                    {/* Registered Date */}
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.85rem' }}>
                        {new Date(reg.registeredAt).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Typography>
                    </TableCell>

                    {/* Status */}
                    <TableCell align="center">
                      <Chip
                        label={reg.status || 'Registered'}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          borderRadius: '8px',
                          bgcolor: 'rgba(22, 163, 74, 0.1)',
                          color: '#16a34a'
                        }}
                      />
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
    </PageContainer>
  );
}
