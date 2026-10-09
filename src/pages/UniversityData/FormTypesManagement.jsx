import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  MenuItem,
  Button,
  Chip,
  Switch,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  InputAdornment,
  Alert,
} from '@mui/material';
import { Plus, Search, Edit, Trash2, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import API from '../../api/axios';
import { toast } from 'sonner';

export default function FormTypesManagement({ onFormTypesUpdated }) {
  const [formTypes, setFormTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [groupFilter, setGroupFilter] = useState('ALL');

  // Add / Edit Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    group: 'Form 1 – Admissions',
    collection: 'custom_collection',
    kind: 'separate',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  // Delete Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchFormTypes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/university-data/form-types');
      setFormTypes(res.data?.data || []);
    } catch (err) {
      console.error('Fetch form types error:', err);
      toast.error('Failed to load form types list.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFormTypes();
  }, [fetchFormTypes]);

  const handleToggleStatus = async (code, currentStatus) => {
    try {
      const res = await API.patch(`/api/university-data/form-types/${code}/toggle-status`);
      const newStatus = res.data?.data?.is_active;

      setFormTypes((prev) =>
        prev.map((ft) => (ft.code === code ? { ...ft, is_active: newStatus } : ft))
      );

      toast.success(`Form ${code} is now ${newStatus ? 'ACTIVE' : 'INACTIVE'}`);
      if (onFormTypesUpdated) onFormTypesUpdated();
    } catch (err) {
      console.error('Toggle status error:', err);
      toast.error('Failed to update form status.');
    }
  };

  const handleOpenAddDialog = () => {
    setEditingType(null);
    setFormData({
      code: '',
      name: '',
      group: 'Form 1 – Admissions',
      collection: '',
      kind: 'separate',
      is_active: true,
    });
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (item) => {
    setEditingType(item);
    setFormData({
      code: item.code,
      name: item.name,
      group: item.group || '',
      collection: item.collection || '',
      kind: item.kind || 'separate',
      is_active: item.is_active !== false,
    });
    setDialogOpen(true);
  };

  const handleSaveFormType = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      toast.error('Please enter both Code and Name for the form type.');
      return;
    }

    setSaving(true);
    try {
      if (editingType) {
        await API.put(`/api/university-data/form-types/${editingType.code}`, formData);
        toast.success(`Form type ${formData.code} updated successfully!`);
      } else {
        await API.post('/api/university-data/form-types', formData);
        toast.success(`New form type ${formData.code} created successfully!`);
      }

      setDialogOpen(false);
      fetchFormTypes();
      if (onFormTypesUpdated) onFormTypesUpdated();
    } catch (err) {
      console.error('Save form type error:', err);
      toast.error(err.response?.data?.message || 'Failed to save form type.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!typeToDelete) return;
    setDeleting(true);
    try {
      await API.delete(`/api/university-data/form-types/${typeToDelete.code}`);
      toast.success(`Form type ${typeToDelete.code} deleted successfully.`);
      setDeleteDialogOpen(false);
      setTypeToDelete(null);
      fetchFormTypes();
      if (onFormTypesUpdated) onFormTypesUpdated();
    } catch (err) {
      console.error('Delete form type error:', err);
      toast.error('Failed to delete form type.');
    } finally {
      setDeleting(false);
    }
  };

  // Get unique groups
  const uniqueGroups = Array.from(new Set(formTypes.map((f) => f.group).filter(Boolean)));

  // Filter form types
  const filteredTypes = formTypes.filter((ft) => {
    if (statusFilter === 'ACTIVE' && !ft.is_active) return false;
    if (statusFilter === 'INACTIVE' && ft.is_active) return false;
    if (groupFilter !== 'ALL' && ft.group !== groupFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        ft.code.toLowerCase().includes(q) ||
        ft.name.toLowerCase().includes(q) ||
        (ft.group || '').toLowerCase().includes(q) ||
        (ft.collection || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeCount = formTypes.filter((f) => f.is_active).length;
  const inactiveCount = formTypes.length - activeCount;

  return (
    <Box>
      {/* Overview Cards & Header */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: '18px',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-paper)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
              Form Types Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Control active/inactive availability of forms, edit details, or add new dynamic forms
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Chip
              icon={<CheckCircle size={14} />}
              label={`${activeCount} Active`}
              color="success"
              variant="outlined"
              sx={{ fontWeight: 600, borderRadius: '8px' }}
            />
            <Chip
              icon={<XCircle size={14} />}
              label={`${inactiveCount} Inactive`}
              color="default"
              variant="outlined"
              sx={{ fontWeight: 600, borderRadius: '8px' }}
            />
            <Button
              variant="contained"
              startIcon={<Plus size={18} />}
              onClick={handleOpenAddDialog}
              sx={{
                borderRadius: '12px',
                px: 3,
                textTransform: 'none',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
              }}
            >
              Add Form Type
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Filters Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-glass)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr 1fr auto' },
            gap: 2,
            alignItems: 'center',
          }}
        >
          <TextField
            size="small"
            label="Search Form Types"
            placeholder="Search code, name, or group..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={16} />
                </InputAdornment>
              ),
              sx: { borderRadius: '12px', background: 'var(--bg-paper)' }
            }}
          />

          <TextField
            select
            size="small"
            label="Status Filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            InputProps={{ sx: { borderRadius: '12px', background: 'var(--bg-paper)' } }}
          >
            <MenuItem value="ALL">All Statuses ({formTypes.length})</MenuItem>
            <MenuItem value="ACTIVE">Active Only ({activeCount})</MenuItem>
            <MenuItem value="INACTIVE">Inactive Only ({inactiveCount})</MenuItem>
          </TextField>

          <TextField
            select
            size="small"
            label="Group Filter"
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            InputProps={{ sx: { borderRadius: '12px', background: 'var(--bg-paper)' } }}
          >
            <MenuItem value="ALL">All Groups</MenuItem>
            {uniqueGroups.map((grp) => (
              <MenuItem key={grp} value={grp}>
                {grp}
              </MenuItem>
            ))}
          </TextField>

          <Button
            variant="outlined"
            startIcon={<RefreshCw size={16} />}
            onClick={fetchFormTypes}
            disabled={loading}
            sx={{ borderRadius: '10px', textTransform: 'none', height: 40 }}
          >
            Refresh
          </Button>
        </Box>
      </Paper>

      {/* Table Data */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '18px',
          overflow: 'hidden',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-paper)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
        }}
      >
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'var(--bg-accent-1, #f8fafc)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, width: 80 }}>Code</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Form Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Group Category</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Database Collection</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Kind</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Active Status</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={30} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Loading form types...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : filteredTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No matching form types found.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTypes.map((item) => (
                  <TableRow key={item.code} hover sx={{ opacity: item.is_active ? 1 : 0.65 }}>
                    <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>{item.code}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{item.name}</TableCell>
                    <TableCell>{item.group}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{item.collection}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.kind || 'separate'}
                        size="small"
                        color={item.kind === 'activity' ? 'info' : 'default'}
                        variant="outlined"
                        sx={{ textTransform: 'capitalize', fontSize: '0.75rem', borderRadius: '6px' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <Switch
                          size="small"
                          checked={item.is_active !== false}
                          onChange={() => handleToggleStatus(item.code, item.is_active)}
                          color="success"
                        />
                        <Chip
                          label={item.is_active !== false ? 'Active' : 'Inactive'}
                          size="small"
                          color={item.is_active !== false ? 'success' : 'default'}
                          sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, borderRadius: '6px' }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenEditDialog(item)}
                        title="Edit Form Type"
                      >
                        <Edit size={16} />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          setTypeToDelete(item);
                          setDeleteDialogOpen(true);
                        }}
                        title="Delete Form Type"
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>
      </Paper>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '18px', p: 1 } }}>
        <form onSubmit={handleSaveFormType}>
          <DialogTitle sx={{ fontWeight: 700 }}>
            {editingType ? `Edit Form Type [${editingType.code}]` : 'Add New Form Type'}
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
              <TextField
                label="Form Code (e.g. 7.1)"
                required
                fullWidth
                size="small"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                disabled={Boolean(editingType)}
                placeholder="e.g. 1.5 or 7.1"
                InputProps={{ sx: { borderRadius: '12px' } }}
              />

              <TextField
                label="Form Name"
                required
                fullWidth
                size="small"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Special Project Grants"
                InputProps={{ sx: { borderRadius: '12px' } }}
              />

              <TextField
                label="Group Category"
                required
                fullWidth
                size="small"
                value={formData.group}
                onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                placeholder="e.g. Form 1 – Admissions or Form 7 – Special"
                InputProps={{ sx: { borderRadius: '12px' } }}
              />

              <TextField
                label="Database Collection Name"
                required
                fullWidth
                size="small"
                value={formData.collection}
                onChange={(e) => setFormData({ ...formData, collection: e.target.value })}
                placeholder="e.g. special_project_grants or academic_activities"
                InputProps={{ sx: { borderRadius: '12px' } }}
              />

              <TextField
                select
                label="Kind / Storage Type"
                fullWidth
                size="small"
                value={formData.kind}
                onChange={(e) => setFormData({ ...formData, kind: e.target.value })}
                InputProps={{ sx: { borderRadius: '12px' } }}
              >
                <MenuItem value="separate">Separate Collection (Flat Document)</MenuItem>
                <MenuItem value="activity">Shared Activity Storage (academic_activities)</MenuItem>
              </TextField>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Active Status:</Typography>
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  color="success"
                />
                <Typography variant="body2" color={formData.is_active ? 'success.main' : 'text.secondary'}>
                  {formData.is_active ? 'Active (Visible in Dropdown)' : 'Inactive (Hidden from Dropdown)'}
                </Typography>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setDialogOpen(false)} disabled={saving} sx={{ borderRadius: '10px' }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving} sx={{ borderRadius: '10px', px: 3 }}>
              {saving ? <CircularProgress size={18} /> : editingType ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Form Type</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete form type <strong>[{typeToDelete?.code}] {typeToDelete?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleting}>
            {deleting ? <CircularProgress size={18} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
