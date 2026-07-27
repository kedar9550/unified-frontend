import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/data/DataTable';
import {
  fetchEventDepartments,
  createEventDepartment,
  updateEventDepartment,
  deleteEventDepartment,
} from '../../api/eventDepartmentApi';
import { toast } from 'sonner';

const DepartmentManagement = () => {
  // View state: 'list' or 'form'
  const [view, setView] = useState('list');
  const [editingDepartment, setEditingDepartment] = useState(null);

  // List state
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [status, setStatus] = useState('Active');

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);

  // ─── Fetch departments ───
  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchEventDepartments();
      setDepartments(response.data?.departments || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  // ─── Validation ───
  const validateForm = () => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Department Name is required.';
    } else if (name.length > 200) {
      newErrors.name = 'Department Name cannot exceed 200 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Form helpers ───
  const resetForm = () => {
    setName('');
    setStatus('Active');
    setErrors({});
    setEditingDepartment(null);
  };

  const openCreateForm = () => {
    resetForm();
    setView('form');
  };

  const openEditForm = (department) => {
    setEditingDepartment(department);
    setName(department.name || '');
    setStatus(department.status || 'Active');
    setErrors({});
    setView('form');
  };

  const goBackToList = () => {
    resetForm();
    setView('list');
    fetchDepartments();
  };

  // ─── Submit ───
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    const payload = {
      name,
      status
    };

    try {
      if (editingDepartment) {
        const response = await updateEventDepartment(editingDepartment._id, payload);
        if (response.data.success) {
          toast.success('Department updated successfully!');
          goBackToList();
        }
      } else {
        const response = await createEventDepartment(payload);
        if (response.data.success) {
          toast.success('Department created successfully!');
          goBackToList();
        }
      }
    } catch (error) {
      console.error('Error saving department:', error);
      toast.error(error.response?.data?.message || 'Failed to save department. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Delete ───
  const handleDeleteClick = (department) => {
    setDepartmentToDelete(department);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!departmentToDelete) return;
    try {
      const response = await deleteEventDepartment(departmentToDelete._id);
      if (response.data.success) {
        toast.success('Department deleted successfully!');
        fetchDepartments();
      }
    } catch (error) {
      console.error('Error deleting department:', error);
      toast.error(error.response?.data?.message || 'Failed to delete department.');
    } finally {
      setDeleteDialogOpen(false);
      setDepartmentToDelete(null);
    }
  };

  // ─── Table columns & rows ───
  const columns = ['#', 'Name', 'Status', 'Actions'];

  const tableRows = departments.map((department, index) => [
    index + 1,
    department.name,
    {
      value: department.status,
      display: (
        <Chip
          label={department.status}
          size="small"
          sx={{
            fontWeight: 600,
            borderRadius: '8px',
            bgcolor: department.status === 'Active' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            color: department.status === 'Active' ? '#16a34a' : '#dc2626',
            border: `1px solid ${department.status === 'Active' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          }}
        />
      ),
    },
    {
      value: '',
      display: (
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
          <IconButton
            size="small"
            onClick={() => openEditForm(department)}
            sx={{
              color: '#3b82f6',
              bgcolor: 'rgba(59, 130, 246, 0.1)',
              '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.2)' },
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDeleteClick(department)}
            sx={{
              color: '#ef4444',
              bgcolor: 'rgba(239, 68, 68, 0.1)',
              '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.2)' },
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ]);

  // ─── LIST VIEW ───
  if (view === 'list') {
    return (
      <Box sx={{ p: 3 }}>
        <PageHeader
          title="Department Management"
          subtitle="Create and manage VEDA event departments"
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openCreateForm}
              sx={{
                borderRadius: '12px',
                px: 3,
                py: 1.2,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.9rem',
                background: 'var(--gradient-primary)',
                boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)',
                '&:hover': {
                  boxShadow: '0 6px 20px rgba(59, 130, 246, 0.45)',
                },
              }}
            >
              Create Department
            </Button>
          }
        />

        <DataTable
          columns={columns}
          rows={tableRows}
          loading={loading}
          nonSortableColumns={[3]}
          alignments={['center', 'left', 'center', 'center']}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          PaperProps={{
            sx: {
              borderRadius: '16px',
              background: 'var(--bg-paper)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              p: 1,
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 700, color: 'var(--text-primary)' }}>
            Delete Department
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: 'var(--text-secondary)' }}>
              Are you sure you want to delete <strong>{departmentToDelete?.name}</strong>? This action
              cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setDeleteDialogOpen(false)}
              variant="outlined"
              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              variant="contained"
              color="error"
              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // ─── FORM VIEW (Create / Edit) ───
  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title={editingDepartment ? 'Edit Department' : 'Create Department'}
        subtitle={
          editingDepartment
            ? `Editing "${editingDepartment.name}"`
            : 'Fill in the details to create a new department'
        }
        showBack
        onBack={goBackToList}
      />

      <Card
        sx={{
          mt: 3,
          maxWidth: 800,
          mx: 'auto',
          boxShadow: 3,
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-paper)',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Department Name */}
            <Box>
              <Typography
                variant="subtitle1"
                fontWeight="600"
                mb={1}
                sx={{ color: 'var(--text-primary)' }}
              >
                Department Name *
              </Typography>
              <TextField
                fullWidth
                placeholder="Enter department name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={!!errors.name}
                helperText={errors.name || `${name.length}/200`}
                slotProps={{ htmlInput: { maxLength: 200 } }}
                variant="outlined"
              />
            </Box>

            {/* Status */}
            <Box>
              <Typography
                variant="subtitle1"
                fontWeight="600"
                mb={1}
                sx={{ color: 'var(--text-primary)' }}
              >
                Status
              </Typography>
              <FormControl fullWidth>
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  displayEmpty
                  sx={{ borderRadius: '12px' }}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Actions */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 2 }}>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={goBackToList}
                  sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  disabled={submitting}
                  size="large"
                  sx={{
                    px: 4,
                    borderRadius: '10px',
                    textTransform: 'none',
                    fontWeight: 600,
                    background: 'var(--gradient-primary)',
                    boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)',
                    '&:hover': {
                      boxShadow: '0 6px 20px rgba(59, 130, 246, 0.45)',
                    },
                  }}
                >
                  {submitting ? 'Saving...' : editingDepartment ? 'Update Department' : 'Create Department'}
                </Button>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DepartmentManagement;
