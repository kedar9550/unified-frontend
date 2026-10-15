import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TablePagination,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress
} from '@mui/material';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  Layers,
  FileText,
  Eye,
  Send,
  RotateCcw,
  CheckCircle2,
  Clock,
  Archive,
  BarChart2,
  FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';
import API from '../../api/axios';
import PageContainer from '../../components/common/design-system/PageContainer';
import PageHeader from '../../components/common/PageHeader';

export default function DynamicFormsListPage() {
  const navigate = useNavigate();

  const [forms, setForms] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [formToDelete, setFormToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchForms();
  }, [page, rowsPerPage, statusFilter]);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: search.trim() ? search.trim() : undefined
      };

      const res = await API.get('/api/forms', { params });
      if (res.data?.success) {
        setForms(res.data.data || []);
        setTotalCount(res.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Failed to load forms:', err);
      toast.error('Failed to load forms list');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchForms();
  };

  const handlePublishToggle = async (form) => {
    try {
      if (form.status === 'published') {
        const res = await API.post(`/api/forms/${form._id}/unpublish`);
        if (res.data?.success) {
          toast.success(`Form "${form.title}" unpublished`);
          fetchForms();
        }
      } else {
        const res = await API.post(`/api/forms/${form._id}/publish`);
        if (res.data?.success) {
          toast.success(`Form "${form.title}" published!`);
          fetchForms();
        }
      }
    } catch (err) {
      console.error('Publish toggle error:', err);
      toast.error(err.response?.data?.message || 'Failed to update form status');
    }
  };

  const handleDuplicate = async (form) => {
    try {
      const res = await API.post(`/api/forms/${form._id}/duplicate`);
      if (res.data?.success) {
        toast.success(`Duplicated "${form.title}"`);
        fetchForms();
      }
    } catch (err) {
      console.error('Duplicate error:', err);
      toast.error('Failed to duplicate form');
    }
  };

  const confirmDelete = async () => {
    if (!formToDelete) return;
    try {
      setDeleting(true);
      const res = await API.delete(`/api/forms/${formToDelete._id}`);
      if (res.data?.success) {
        toast.success(`Deleted "${formToDelete.title}"`);
        setDeleteModalOpen(false);
        setFormToDelete(null);
        fetchForms();
      }
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(err.response?.data?.message || 'Failed to delete form');
    } finally {
      setDeleting(false);
    }
  };

  const copyPublicLink = (slug) => {
    const url = `${window.location.origin}/forms/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Public form link copied to clipboard!');
  };

  // Metrics count
  const publishedCount = forms.filter((f) => f.status === 'published').length;
  const totalSubmissions = forms.reduce((acc, f) => acc + (f.submissionCount || 0), 0);

  return (
    <PageContainer maxWidth="xl" px={3} py={3}>
      <PageHeader
        title="Dynamic Forms Management"
        subtitle="Create, configure, publish, and manage custom drag-and-drop dynamic forms and submissions."
        icon={<Layers />}
        action={
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => navigate('/central-events/activities/generate-form')}
            sx={{
              borderRadius: '12px',
              bgcolor: '#004e92',
              color: '#ffffff',
              textTransform: 'none',
              fontWeight: 700,
              px: 2.5,
              py: 1,
              boxShadow: '0 4px 14px rgba(0, 78, 146, 0.25)',
              '&:hover': { bgcolor: '#003a6d' }
            }}
          >
            Create Dynamic Form
          </Button>
        }
      />

      {/* Metrics Row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2.5, mb: 3 }}>
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            bgcolor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <Box sx={{ width: 48, height: 48, borderRadius: '12px', bgcolor: '#eef2ff', color: '#004e92', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={24} />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Forms
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
              {totalCount}
            </Typography>
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            bgcolor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <Box sx={{ width: 48, height: 48, borderRadius: '12px', bgcolor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={24} />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              Published Forms
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#16a34a' }}>
              {publishedCount}
            </Typography>
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            bgcolor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <Box sx={{ width: 48, height: 48, borderRadius: '12px', bgcolor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart2 size={24} />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Submissions
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#d97706' }}>
              {totalSubmissions}
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* Filter and Search Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          bgcolor: '#ffffff',
          mb: 3,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          justifyContent: 'space-between',
          gap: 2
        }}
      >
        <Box
          component="form"
          onSubmit={handleSearchSubmit}
          sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, maxWidth: { md: 450 } }}
        >
          <TextField
            size="small"
            fullWidth
            placeholder="Search by title, description or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <Search size={16} color="#94a3b8" style={{ marginRight: 8 }} />
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
          <Button
            type="submit"
            variant="contained"
            size="small"
            sx={{ borderRadius: '10px', bgcolor: '#004e92', textTransform: 'none', px: 2.5, fontWeight: 600 }}
          >
            Search
          </Button>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filter Status</InputLabel>
            <Select
              value={statusFilter}
              label="Filter Status"
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              sx={{ borderRadius: '10px' }}
            >
              <MenuItem value="ALL">All Statuses</MenuItem>
              <MenuItem value="PUBLISHED">Published</MenuItem>
              <MenuItem value="DRAFT">Draft</MenuItem>
              <MenuItem value="ARCHIVED">Archived</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Forms Table */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '18px',
          border: '1px solid #e2e8f0',
          bgcolor: '#ffffff',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)'
        }}
      >
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#334155', py: 2 }}>Form Title & Slug</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Fields</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Submissions</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Created Date</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#334155', textAlign: 'right', pr: 3 }}>Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} sx={{ color: '#004e92', mb: 1 }} />
                    <Typography variant="body2" sx={{ color: '#64748b' }}>Loading forms...</Typography>
                  </TableCell>
                </TableRow>
              ) : forms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Layers size={40} color="#cbd5e1" style={{ marginBottom: 8 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                      No Forms Found
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                      {search ? 'Try clearing your search filters' : 'Create your first dynamic drag-and-drop form to get started.'}
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<Plus size={16} />}
                      onClick={() => navigate('/central-events/activities/generate-form')}
                      sx={{ borderRadius: '10px', bgcolor: '#004e92', textTransform: 'none', fontWeight: 600 }}
                    >
                      Create Form
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                forms.map((form) => (
                  <TableRow
                    key={form._id}
                    hover
                    sx={{ '&:hover': { bgcolor: '#f8fafc' } }}
                  >
                    <TableCell sx={{ py: 2 }}>
                      <Box>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 700,
                            color: '#004e92',
                            cursor: 'pointer',
                            '&:hover': { textDecoration: 'underline' }
                          }}
                          onClick={() => navigate(`/central-events/activities/generate-form/${form._id}`)}
                        >
                          {form.title}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                          <Typography variant="caption" sx={{ color: '#64748b', fontFamily: 'monospace' }}>
                            /forms/{form.slug}
                          </Typography>
                          {form.status === 'published' && (
                            <Tooltip title="Copy Public URL">
                              <IconButton
                                size="small"
                                onClick={() => copyPublicLink(form.slug)}
                                sx={{ p: 0.2, color: '#94a3b8', '&:hover': { color: '#004e92' } }}
                              >
                                <Copy size={13} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={form.status}
                        size="small"
                        sx={{
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          bgcolor:
                            form.status === 'published'
                              ? '#dcfce7'
                              : form.status === 'draft'
                              ? '#f1f5f9'
                              : '#fef3c7',
                          color:
                            form.status === 'published'
                              ? '#15803d'
                              : form.status === 'draft'
                              ? '#475569'
                              : '#d97706',
                          border: `1px solid ${
                            form.status === 'published'
                              ? '#bbf7d0'
                              : form.status === 'draft'
                              ? '#cbd5e1'
                              : '#fde68a'
                          }`
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                        {form.fields?.length || 0} fields
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                          {form.submissionCount || 0}
                        </Typography>
                        {(form.submissionCount || 0) > 0 && (
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => navigate(`/central-events/activities/forms/${form._id}/submissions`)}
                            sx={{ textTransform: 'none', fontSize: '0.75rem', p: 0, minWidth: 'auto', color: '#004e92', fontWeight: 600 }}
                          >
                            View
                          </Button>
                        )}
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        {new Date(form.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>

                    <TableCell align="right" sx={{ pr: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                        <Tooltip title="Edit Form in Builder">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/central-events/activities/generate-form/${form._id}`)}
                            sx={{ color: '#004e92', '&:hover': { bgcolor: '#eff6ff' } }}
                          >
                            <Edit size={16} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="View Submissions">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/central-events/activities/forms/${form._id}/submissions`)}
                            sx={{ color: '#059669', '&:hover': { bgcolor: '#ecfdf5' } }}
                          >
                            <FileSpreadsheet size={16} />
                          </IconButton>
                        </Tooltip>

                        {form.status === 'published' ? (
                          <Tooltip title="Open Public Form">
                            <IconButton
                              size="small"
                              component="a"
                              href={`/forms/${form.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              sx={{ color: '#2563eb', '&:hover': { bgcolor: '#eff6ff' } }}
                            >
                              <ExternalLink size={16} />
                            </IconButton>
                          </Tooltip>
                        ) : null}

                        <Tooltip title={form.status === 'published' ? 'Unpublish' : 'Publish'}>
                          <IconButton
                            size="small"
                            onClick={() => handlePublishToggle(form)}
                            sx={{
                              color: form.status === 'published' ? '#d97706' : '#16a34a',
                              '&:hover': { bgcolor: form.status === 'published' ? '#fef3c7' : '#dcfce7' }
                            }}
                          >
                            {form.status === 'published' ? <Archive size={16} /> : <Send size={16} />}
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Duplicate Form">
                          <IconButton
                            size="small"
                            onClick={() => handleDuplicate(form)}
                            sx={{ color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' } }}
                          >
                            <Copy size={16} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete Form">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setFormToDelete(form);
                              setDeleteModalOpen(true);
                            }}
                            sx={{ color: '#ef4444', '&:hover': { bgcolor: '#fee2e2' } }}
                          >
                            <Trash2 size={16} />
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

        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 20, 50]}
        />
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#0f172a' }}>
          Delete Form?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
            Are you sure you want to delete <strong>{formToDelete?.title}</strong>? This action will permanently remove the form definition and cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteModalOpen(false)}
            sx={{ textTransform: 'none', fontWeight: 600, color: '#64748b' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={deleting}
            onClick={confirmDelete}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
          >
            {deleting ? 'Deleting...' : 'Delete Form'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
