import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  FormHelperText,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Avatar,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import { PageContainer } from '../../components/common/design-system';
import DataTable from '../../components/data/DataTable';
import API from '../../api/axios';
import { toast } from 'sonner';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

const ClubManagement = () => {
  // View state: 'list' or 'form'
  const [view, setView] = useState('list');
  const [editingClub, setEditingClub] = useState(null);

  // List state
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Active');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [imageError, setImageError] = useState('');

  // Assignee Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clubToDelete, setClubToDelete] = useState(null);

  // Fetch clubs
  const fetchClubs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await API.get('/api/clubs');
      setClubs(response.data?.clubs || []);
    } catch (error) {
      console.error('Error fetching clubs:', error);
      toast.error('Failed to load clubs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);

  // Employee search with debounce
  useEffect(() => {
    if (!searchQuery || searchQuery.trim() === '') {
      setEmployeeOptions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await API.get('/api/employees/search', {
          params: { query: searchQuery },
        });
        const users = response.data?.users || response.data || [];
        setEmployeeOptions(Array.isArray(users) ? users : []);
      } catch (error) {
        console.error('Error searching employees:', error);
        setEmployeeOptions([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Image handling
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageError('');

    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setImageError('Please upload a valid image file (JPG, JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image size should not exceed 5 MB.');
      return;
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, logo: null }));
  };

  const removeImage = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setImageError('');
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    if (!name.trim()) {
      newErrors.name = 'Club Name is required.';
    } else if (name.length > 200) {
      newErrors.name = 'Club Name cannot exceed 200 characters.';
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required.';
    } else if (description.length > 2000) {
      newErrors.description = 'Description cannot exceed 2000 characters.';
    }

    // Logo required only for create
    if (!editingClub && !logoFile) {
      newErrors.logo = 'Club Logo is required.';
    }

    if (selectedEmployees.length === 0) {
      newErrors.coordinators = 'At least one club coordinator is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Reset form
  const resetForm = () => {
    setName('');
    setDescription('');
    setStatus('Active');
    setLogoFile(null);
    setLogoPreview(null);
    setImageError('');
    setSelectedEmployees([]);
    setSearchQuery('');
    setErrors({});
    setEditingClub(null);
  };

  // Switch to form view
  const openCreateForm = () => {
    resetForm();
    setView('form');
  };

  const openEditForm = (club) => {
    setEditingClub(club);
    setName(club.name);
    setDescription(club.description);
    setStatus(club.status);
    setLogoFile(null);
    setLogoPreview(club.logo ? `${BACKEND_URL}${club.logo}` : null);
    setImageError('');

    if (club.coordinators && Array.isArray(club.coordinators)) {
      setSelectedEmployees(club.coordinators.map(c => ({
        institutionId: c.employeeId,
        name: c.employeeName,
        department: c.department,
        designation: c.designation
      })));
    } else {
      setSelectedEmployees([]);
    }

    setErrors({});
    setView('form');
  };

  const goBackToList = () => {
    resetForm();
    setView('list');
    fetchClubs();
  };

  // Submit form
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('status', status);

    const formattedCoordinators = selectedEmployees.map(emp => ({
      employeeId: emp.institutionId,
      employeeName: emp.name,
      department: emp.department?.name || emp.department || 'N/A',
      designation: emp.designation || 'N/A'
    }));
    formData.append('coordinators', JSON.stringify(formattedCoordinators));

    if (logoFile) {
      formData.append('logo', logoFile);
    }

    try {
      if (editingClub) {
        const response = await API.put(`/api/clubs/${editingClub._id}`, formData);
        if (response.data.success) {
          toast.success('Club updated successfully!');
          goBackToList();
        }
      } else {
        const response = await API.post('/api/clubs', formData);
        if (response.data.success) {
          toast.success('Club created successfully!');
          goBackToList();
        }
      }
    } catch (error) {
      console.error('Error saving club:', error);
      toast.error(error.response?.data?.message || 'Failed to save club. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete
  const handleDeleteClick = (club) => {
    setClubToDelete(club);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!clubToDelete) return;
    try {
      const response = await API.delete(`/api/clubs/${clubToDelete._id}`);
      if (response.data.success) {
        toast.success('Club deleted successfully!');
        fetchClubs();
      }
    } catch (error) {
      console.error('Error deleting club:', error);
      toast.error(error.response?.data?.message || 'Failed to delete club.');
    } finally {
      setDeleteDialogOpen(false);
      setClubToDelete(null);
    }
  };

  // Table columns & rows
  const columns = ['#', 'Logo', 'Name', 'Status', 'Coordinators', 'Actions'];

  const tableRows = clubs.map((club, index) => [
    index + 1,
    {
      value: club.name,
      display: (
        <Avatar
          src={`${BACKEND_URL}${club.logo}`}
          alt={club.name}
          variant="rounded"
          sx={{ width: 48, height: 48, mx: 'auto', border: '2px solid var(--border-color)' }}
        />
      ),
    },
    club.name,
    {
      value: club.status,
      display: (
        <Chip
          label={club.status}
          size="small"
          sx={{
            fontWeight: 600,
            borderRadius: '8px',
            bgcolor: club.status === 'Active' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            color: club.status === 'Active' ? '#16a34a' : '#dc2626',
            border: `1px solid ${club.status === 'Active' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          }}
        />
      ),
    },
    {
      value: club.coordinators?.length || 0,
      display: (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {club.coordinators?.map((c, i) => (
            <Typography key={i} variant="caption" sx={{ color: 'var(--text-secondary)' }}>
              • {c.employeeName}
            </Typography>
          ))}
        </Box>
      )
    },
    {
      value: '',
      display: (
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
          <IconButton
            size="small"
            onClick={() => openEditForm(club)}
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
            onClick={() => handleDeleteClick(club)}
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
      <PageContainer>
        <PageHeader
          title="Club Management"
          subtitle="Create and manage student clubs"
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
              Create Club
            </Button>
          }
        />

        <DataTable
          columns={columns}
          rows={tableRows}
          nonSortableColumns={[1, 4, 5]}
          alignments={['center', 'center', 'left', 'center', 'left', 'center']}
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
            Delete Club
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: 'var(--text-secondary)' }}>
              Are you sure you want to delete <strong>{clubToDelete?.name}</strong>? This action cannot be undone.
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
      </PageContainer>
    );
  }

  // ─── FORM VIEW (Create / Edit) ───
  return (
    <PageContainer>
      <PageHeader
        title={editingClub ? 'Edit Club' : 'Create Club'}
        subtitle={editingClub ? `Editing "${editingClub.name}"` : 'Fill in the details to create a new club'}
        showBack
        onBack={goBackToList}
      />

      <Card sx={{ mt: 3, maxWidth: 800, mx: 'auto', boxShadow: 3, borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-paper)' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Club Name */}
            <Box>
              <Typography variant="subtitle1" fontWeight="600" mb={1} sx={{ color: 'var(--text-primary)' }}>
                Club Name *
              </Typography>
              <TextField
                fullWidth
                placeholder="Enter club name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={!!errors.name}
                helperText={errors.name || `${name.length}/200`}
                slotProps={{
                  htmlInput: { maxLength: 200 },
                }}
                variant="outlined"
              />
            </Box>

            {/* Logo Upload */}
            <Box>
              <Typography variant="subtitle1" fontWeight="600" mb={1} sx={{ color: 'var(--text-primary)' }}>
                Club Logo *
              </Typography>
              {!logoPreview ? (
                <Box
                  sx={{
                    border: '2px dashed',
                    borderColor: errors.logo ? 'error.main' : 'grey.300',
                    borderRadius: 2,
                    p: 4,
                    textAlign: 'center',
                    cursor: 'pointer',
                    bgcolor: 'background.default',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'action.hover',
                    },
                  }}
                  component="label"
                >
                  <input
                    type="file"
                    hidden
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={handleImageChange}
                  />
                  <CloudUploadIcon sx={{ fontSize: 48, color: errors.logo ? 'error.main' : 'primary.main', mb: 1 }} />
                  <Typography variant="h6" color="text.primary" gutterBottom>
                    Click or drag file to upload
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Supports JPG, PNG, WebP. Max size: 5MB.
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    maxHeight: 300,
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <img
                    src={logoPreview}
                    alt="Logo Preview"
                    style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      display: 'flex',
                      gap: 1,
                      bgcolor: 'rgba(255, 255, 255, 0.9)',
                      p: 0.5,
                      borderRadius: 1,
                      boxShadow: 1,
                    }}
                  >
                    <Button variant="contained" component="label" size="small" color="primary">
                      Replace
                      <input
                        type="file"
                        hidden
                        accept=".jpg,.jpeg,.png,.webp"
                        onChange={handleImageChange}
                      />
                    </Button>
                    <IconButton color="error" onClick={removeImage} size="small">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              )}
              {imageError && (
                <FormHelperText error sx={{ mt: 1, ml: 1 }}>
                  {imageError}
                </FormHelperText>
              )}
              {errors.logo && !logoPreview && (
                <FormHelperText error sx={{ mt: 1, ml: 1 }}>
                  {errors.logo}
                </FormHelperText>
              )}
            </Box>

            {/* Description */}
            <Box>
              <Typography variant="subtitle1" fontWeight="600" mb={1} sx={{ color: 'var(--text-primary)' }}>
                Description *
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Enter club description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                error={!!errors.description}
                helperText={errors.description || `${description.length}/2000`}
                slotProps={{
                  htmlInput: { maxLength: 2000 },
                }}
                variant="outlined"
              />
            </Box>

            {/* Status */}
            <Box>
              <Typography variant="subtitle1" fontWeight="600" mb={1} sx={{ color: 'var(--text-primary)' }}>
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

            {/* Coordinators */}
            <Box>
              <Typography variant="subtitle1" fontWeight="600" mb={1} sx={{ color: 'var(--text-primary)' }}>
                Club Coordinators *
              </Typography>
              <Autocomplete
                multiple
                options={employeeOptions}
                getOptionLabel={(option) => `${option.name} (${option.institutionId})`}
                isOptionEqualToValue={(option, value) => option.institutionId === value.institutionId}
                filterOptions={(x) => x}
                loading={isSearching}
                value={selectedEmployees}
                onChange={(event, newValue) => {
                  setSelectedEmployees(newValue);
                  if (newValue.length > 0) setErrors(prev => ({ ...prev, coordinators: null }));
                }}
                onInputChange={(event, newInputValue) => setSearchQuery(newInputValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search employees by Name or ID..."
                    error={!!errors.coordinators}
                    helperText={errors.coordinators}
                    InputProps={{
                      ...(params.InputProps || {}),
                      endAdornment: (
                        <React.Fragment>
                          {isSearching ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps?.endAdornment}
                        </React.Fragment>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  return (
                    <li key={key} {...otherProps}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.5 }}>
                        <Typography variant="body1" fontWeight="500">
                          {option.name} <Typography component="span" variant="body2" color="text.secondary">({option.institutionId})</Typography>
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.department?.name || option.department} • {option.designation}
                        </Typography>
                      </Box>
                    </li>
                  );
                }}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return (
                      <Chip
                        key={key}
                        label={`${option.name} (${option.institutionId})`}
                        {...tagProps}
                        color="primary"
                        variant="outlined"
                        sx={{ m: 0.5 }}
                      />
                    );
                  })
                }
              />
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
                  {submitting ? 'Saving...' : editingClub ? 'Update Club' : 'Create Club'}
                </Button>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </PageContainer>
  );
};

export default ClubManagement;
