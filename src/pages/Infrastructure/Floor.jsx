import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, MenuItem, Button, IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import axios from 'axios';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/data/DataTable';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

const Floor = () => {
  const [floors, setFloors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', status: 'active' });
  const [editingId, setEditingId] = useState(null);
  
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => {
    fetchFloors();
  }, []);

  const fetchFloors = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/infrastructure/floors`);
      setFloors(response.data.data);
    } catch (error) {
      console.error('Error fetching floors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openCreateForm = () => {
    setFormData({ name: '', status: 'active' });
    setEditingId(null);
    setFormOpen(true);
  };

  const openEditForm = (item) => {
    setEditingId(item._id);
    setFormData({ name: item.name, status: item.status });
    setFormOpen(true);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${BACKEND_URL}/api/infrastructure/floors/${editingId}`, formData);
      } else {
        await axios.post(`${BACKEND_URL}/api/infrastructure/floors`, formData);
      }
      setFormOpen(false);
      fetchFloors();
    } catch (error) {
      console.error('Error saving floor:', error);
    }
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${BACKEND_URL}/api/infrastructure/floors/${itemToDelete._id}`);
      setDeleteDialogOpen(false);
      fetchFloors();
    } catch (error) {
      console.error('Error deleting floor:', error);
    }
  };

  const columns = ['#', 'Name', 'Status', 'Actions'];
  const tableRows = floors.map((item, index) => [
    index + 1,
    item.name,
    {
      value: item.status,
      display: (
        <Chip
          label={item.status}
          size="small"
          sx={{
            fontWeight: 600,
            borderRadius: '8px',
            bgcolor: item.status.toLowerCase() === 'active' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            color: item.status.toLowerCase() === 'active' ? '#16a34a' : '#dc2626',
            border: `1px solid ${item.status.toLowerCase() === 'active' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            textTransform: 'capitalize'
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
            onClick={() => openEditForm(item)}
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
            onClick={() => handleDeleteClick(item)}
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

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Floor Management"
        subtitle="Create and manage floors"
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
              background: 'var(--gradient-primary, linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%))',
              boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)',
              '&:hover': {
                boxShadow: '0 6px 20px rgba(59, 130, 246, 0.45)',
              },
            }}
          >
            Create Floor
          </Button>
        }
      />

      <DataTable
        columns={columns}
        rows={tableRows}
        loading={loading}
        nonSortableColumns={[0, 3]}
        alignments={['center', 'left', 'center', 'center']}
      />

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 700, color: 'var(--text-primary)' }}>
          {editingId ? 'Edit Floor' : 'Add Floor'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <TextField
              label="Floor Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              fullWidth
              margin="normal"
            />
            <TextField
              select
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              fullWidth
              margin="normal"
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFormOpen(false)} variant="outlined" sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}>
            {editingId ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: 'var(--text-primary)' }}>
          Delete Floor
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'var(--text-secondary)' }}>
            Are you sure you want to delete <strong>{itemToDelete?.name}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} variant="outlined" sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button onClick={confirmDelete} variant="contained" color="error" sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Floor;
