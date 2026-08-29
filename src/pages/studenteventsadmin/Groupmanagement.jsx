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
  Close as CloseIcon,
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import { PageContainer } from '../../components/common/design-system';
import ActionButton from '../../components/common/ActionButton';
import DataTable from '../../components/data/DataTable';
import API from '../../api/axios';
import { toast } from 'sonner';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

const GroupManagement = () => {
  // View state: 'list' or 'form'
  const [view, setView] = useState('list');
  const [editingGroup, setEditingGroup] = useState(null);

  // List state
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('Active');
  const [selectedCoordinator, setSelectedCoordinator] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);


  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [bannerError, setBannerError] = useState('');

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);

  // Image Preview dialog state
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewImageSrc, setPreviewImageSrc] = useState('');

  const handleImageClick = (src) => {
    setPreviewImageSrc(src);
    setPreviewDialogOpen(true);
  };

  // ─── Fetch groups & departments ───
  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const response = await API.get('/api/event_schools');
      setEventSchools(response.data?.event_schools || []);
    } catch (error) {
      console.error('Error fetching event_schools:', error);
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    if (!searchQuery || searchQuery.trim() === '') {
      setEmployeeOptions([]);
      return;
    }

    const debounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await API.get('/api/employees/search', {
          params: { query: searchQuery },
        });
        setEmployeeOptions(Array.isArray(response.data) ? response.data : response.data?.users || []);
      } catch (error) {
        console.error('Error searching employees:', error);
        setEmployeeOptions([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(debounce);
  }, [searchQuery]);

  // ─── Image handling (shared by logo & banner) ───
  const validateImage = (file) => {
    if (!VALID_IMAGE_TYPES.includes(file.type)) {
      return 'Please upload a valid image file (JPG, JPEG, PNG, WebP).';
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return 'Image size should not exceed 5 MB.';
    }
    return '';
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    setBannerError('');
    if (!file) return;

    const message = validateImage(file);
    if (message) {
      setBannerError(message);
      return;
    }

    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, banner: null }));
  };

  const removeBanner = () => {
    setBannerFile(null);
    setBannerPreview(null);
    setBannerError('');
  };

  // ─── Validation ───
  const validateForm = () => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Group Name is required.';
    } else if (name.length > 200) {
      newErrors.name = 'Group Name cannot exceed 200 characters.';
    }

    if (!shortName.trim()) {
      newErrors.shortName = 'Short Name is required.';
    } else if (shortName.length > 100) {
      newErrors.shortName = 'Short Name cannot exceed 100 characters.';
    }


    if (!content.trim()) {
      newErrors.content = 'Content is required.';
    } else if (content.length > 5000) {
      newErrors.content = 'Content cannot exceed 5000 characters.';
    }

    if (!selectedCoordinator) {
      newErrors.coordinator = 'Coordinator is required.';
    }

    // Banner image is optional

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Form helpers ───
  const resetForm = () => {
    setName('');
    setShortName('');
    setContent('');
    setStatus('Active');
    setSelectedCoordinator(null);
    setSearchQuery('');
    setEmployeeOptions([]);
    setBannerFile(null);
    setBannerPreview(null);
    setBannerError('');
    setErrors({});
    setEditingGroup(null);
  };

  const openCreateForm = () => {
    resetForm();
    setView('form');
  };

  const openEditForm = (group) => {
    setEditingGroup(group);
    setName(group.name || '');
    setShortName(group.shortName || '');
    setContent(group.content || '');
    setStatus(group.status || 'Active');
    setSelectedCoordinator(group.coordinator ? {
      employeeId: group.coordinator.employeeId || group.coordinator.institutionId || group.coordinator.employeeCode || '',
      institutionId: group.coordinator.institutionId || group.coordinator.employeeId || group.coordinator.employeeCode || '',
      employeeName: group.coordinator.employeeName || group.coordinator.name || '',
      name: group.coordinator.employeeName || group.coordinator.name || '',
      department: group.coordinator.department,
      designation: group.coordinator.designation,
    } : null);

    setBannerFile(null);
    const bannerUrl =
      group.banner && typeof group.banner === 'string' && group.banner.trim()
        ? group.banner.startsWith('http')
          ? group.banner
          : `${BACKEND_URL}${group.banner}`
        : null;
    setBannerPreview(bannerUrl);
    setBannerError('');

    setErrors({});
    setView('form');
  };

  const goBackToList = () => {
    resetForm();
    setView('list');
    fetchGroups();
  };

  // ─── Submit ───
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    const formData = new FormData();
    formData.append('name', name);
    formData.append('shortName', shortName);
    formData.append('content', content);
    formData.append('status', status);
    formData.append('coordinator', JSON.stringify(selectedCoordinator || {}));

    if (bannerFile) { formData.append('banner', bannerFile); } else if (!bannerPreview) { formData.append('removeBanner', 'true'); }

    try {
      if (editingGroup) {
        const response = await API.put(`/api/event_schools/${editingGroup._id}`, formData);
        if (response.data.success) {
          toast.success('School updated successfully!');
          goBackToList();
        }
      } else {
        const response = await API.post('/api/event_schools', formData);
        if (response.data.success) {
          toast.success('School created successfully!');
          goBackToList();
        }
      }
    } catch (error) {
      console.error('Error saving school:', error);
      toast.error(error.response?.data?.message || 'Failed to save school. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Delete ───
  const handleDeleteClick = (group) => {
    setGroupToDelete(group);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!groupToDelete) return;
    try {
      const response = await API.delete(`/api/event_schools/${groupToDelete._id}`);
      if (response.data.success) {
        toast.success('School deleted successfully!');
        fetchGroups();
      }
    } catch (error) {
      console.error('Error deleting school:', error);
      toast.error(error.response?.data?.message || 'Failed to delete school.');
    } finally {
      setDeleteDialogOpen(false);
      setGroupToDelete(null);
    }
  };

  // ─── Table columns & rows ───
  const columns = ['#', 'Banner', 'Name', 'Short Name', 'School Coordinator', 'Status', 'Actions'];

  const tableRows = event_schools.map((group, index) => [
    index + 1,

    {
      value: group.name,
      display: group.banner ? (
        <Box
          component="img"
          src={group.banner.startsWith('http') ? group.banner : `${BACKEND_URL}${group.banner}`}
          alt={group.name}
          onError={(e) => { e.target.style.display = 'none'; }}
          onClick={() => handleImageClick(group.banner.startsWith('http') ? group.banner : `${BACKEND_URL}${group.banner}`)}
          sx={{
            width: 80,
            height: 40,
            objectFit: 'cover',
            borderRadius: '4px',
            border: '1px solid var(--border-color)',
            mx: 'auto',
            display: 'block',
            cursor: 'pointer',
            transition: 'opacity 0.2s',
            '&:hover': { opacity: 0.8 }
          }}
        />
      ) : (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
          No Banner
        </Typography>
      ),
    },
    group.name,
    group.shortName || 'N/A',
    (() => {
      const code = group.coordinator?.institutionId || group.coordinator?.employeeId || group.coordinator?.employeeCode || '';
      const name = group.coordinator?.employeeName || 'N/A';
      return code ? `${name} (${code})` : name;
    })(),
    {
      value: group.status,
      display: (
        <Chip
          label={group.status}
          size="small"
          sx={{
            fontWeight: 600,
            borderRadius: '8px',
            bgcolor: group.status === 'Active' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            color: group.status === 'Active' ? '#16a34a' : '#dc2626',
            border: `1px solid ${group.status === 'Active' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
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
            onClick={() => openEditForm(group)}
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
            onClick={() => handleDeleteClick(group)}
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

  // ─── Reusable uploader block ───
  const renderUploader = ({
    preview,
    onChange,
    onRemove,
    hasError,
    previewAlt = 'Banner Preview',
    previewMaxHeight = 240,
    hint = 'Supports JPG, PNG, WebP. Max size: 5MB. Wide image (16:9) recommended.',
  }) => {
    if (!preview) {
      return (
        <Box
          component="label"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px dashed',
            borderColor: hasError ? 'error.main' : 'var(--border-color, rgba(0, 0, 0, 0.15))',
            borderRadius: '14px',
            p: { xs: 3, sm: 3.5 },
            textAlign: 'center',
            cursor: 'pointer',
            bgcolor: 'var(--bg-default, rgba(248, 250, 252, 0.5))',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'action.hover',
              boxShadow: '0 4px 14px rgba(59, 130, 246, 0.08)',
              transform: 'translateY(-1px)',
            },
          }}
        >
          <input type="file" hidden accept=".jpg,.jpeg,.png,.webp" onChange={onChange} />
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              bgcolor: hasError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 1.25,
            }}
          >
            <CloudUploadIcon sx={{ fontSize: 26, color: hasError ? 'error.main' : '#3b82f6' }} />
          </Box>
          <Typography variant="subtitle2" fontWeight={600} sx={{ color: 'var(--text-primary)', mb: 0.5 }}>
            Click or drag banner image to upload
          </Typography>
          <Typography variant="caption" sx={{ color: 'var(--text-secondary)', maxWidth: 420 }}>
            {hint}
          </Typography>
        </Box>
      );
    }

    return (
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          minHeight: 160,
          maxHeight: `${previewMaxHeight}px`,
          borderRadius: '14px',
          overflow: 'hidden',
          border: '1px solid var(--border-color, #e2e8f0)',
          bgcolor: '#0f172a',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
        }}
      >
        <Box
          component="img"
          src={preview}
          alt={previewAlt}
          onError={() => {
            setBannerPreview(null);
            setBannerFile(null);
          }}
          sx={{
            width: '100%',
            height: '100%',
            maxHeight: `${previewMaxHeight}px`,
            objectFit: 'cover',
            display: 'block',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            display: 'flex',
            gap: 1,
            bgcolor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            p: 0.6,
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <Button variant="contained" component="label" size="small" color="primary" sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '0.78rem' }}>
            Change
            <input type="file" hidden accept=".jpg,.jpeg,.png,.webp" onChange={onChange} />
          </Button>
          <IconButton color="error" onClick={onRemove} size="small" sx={{ bgcolor: 'rgba(239, 68, 68, 0.15)', borderRadius: '8px', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.3)' } }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    );
  };

  // ─── LIST VIEW ───
  if (view === 'list') {
    return (
      <PageContainer>
        <PageHeader
          title="School Management"
          subtitle="Create and manage VEDA event schools"
          action={
            <ActionButton
              startIcon={<AddIcon />}
              onClick={openCreateForm}
            >
              Create School
            </ActionButton>
          }
        />

        <DataTable
          columns={columns}
          rows={tableRows}
          loading={loading}
          nonSortableColumns={[1, 6]}
          alignments={['center', 'center', 'left', 'left', 'left', 'center', 'center']}
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
            Delete School
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: 'var(--text-secondary)' }}>
              Are you sure you want to delete <strong>{groupToDelete?.name}</strong>? This action
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

        {/* Image Preview Dialog */}
        <Dialog
          open={previewDialogOpen}
          onClose={() => setPreviewDialogOpen(false)}
          maxWidth="md"
          PaperProps={{
            sx: {
              background: 'transparent',
              boxShadow: 'none',
              overflow: 'hidden',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            },
          }}
        >
          <Box sx={{ position: 'relative', display: 'inline-block' }}>
            <IconButton
              onClick={() => setPreviewDialogOpen(false)}
              sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                color: 'white',
                bgcolor: 'rgba(0, 0, 0, 0.6)',
                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.8)' },
                zIndex: 10,
              }}
            >
              <CloseIcon />
            </IconButton>
            <Box
              component="img"
              src={previewImageSrc}
              alt="Preview"
              sx={{
                maxWidth: '100%',
                maxHeight: '90vh',
                objectFit: 'contain',
                borderRadius: '8px',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                display: 'block',
              }}
            />
          </Box>
        </Dialog>
      </PageContainer>
    );
  }

  // ─── FORM VIEW (Create / Edit) ───
  return (
    <PageContainer>
      <PageHeader
        title={editingGroup ? 'Edit School' : 'Create School'}
        subtitle={
          editingGroup
            ? `Editing "${editingGroup.name}"`
            : 'Fill in the details to create a new school'
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
            {/* Group Name */}
            <Box>
              <Typography
                variant="subtitle1"
                fontWeight="600"
                mb={1}
                sx={{ color: 'var(--text-primary)' }}
              >
                School Name *
              </Typography>
              <TextField
                fullWidth
                placeholder="Enter school name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={!!errors.name}
                helperText={errors.name || `${name.length}/200`}
                slotProps={{ htmlInput: { maxLength: 200 } }}
                variant="outlined"
              />
            </Box>

            {/* Short Name */}
            <Box>
              <Typography
                variant="subtitle1"
                fontWeight="600"
                mb={1}
                sx={{ color: 'var(--text-primary)' }}
              >
                Short Name *
              </Typography>
              <TextField
                fullWidth
                placeholder="Enter short name"
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                error={!!errors.shortName}
                helperText={errors.shortName || `${shortName.length}/100`}
                slotProps={{ htmlInput: { maxLength: 100 } }}
                variant="outlined"
              />
            </Box>

            {/* Banner Upload */}
            <Box>
              <Typography
                variant="subtitle1"
                fontWeight="600"
                mb={1}
                sx={{ color: 'var(--text-primary)' }}
              >
                Banner Image (Optional)
              </Typography>
              {renderUploader({
                preview: bannerPreview,
                onChange: handleBannerChange,
                onRemove: removeBanner,
                hasError: !!errors.banner,
                previewAlt: 'Banner Preview',
                previewMaxHeight: 260,
                hint: 'Supports JPG, PNG, WebP. Max size: 5MB. Wide image (16:9) recommended.',
              })}
              {bannerError && (
                <FormHelperText error sx={{ mt: 1, ml: 1 }}>
                  {bannerError}
                </FormHelperText>
              )}
              {errors.banner && !bannerPreview && (
                <FormHelperText error sx={{ mt: 1, ml: 1 }}>
                  {errors.banner}
                </FormHelperText>
              )}
            </Box>

            {/* Content */}
            <Box>
              <Typography
                variant="subtitle1"
                fontWeight="600"
                mb={1}
                sx={{ color: 'var(--text-primary)' }}
              >
                Content *
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={6}
                placeholder="Enter group content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                error={!!errors.content}
                helperText={errors.content || `${content.length}/5000`}
                slotProps={{ htmlInput: { maxLength: 5000 } }}
                variant="outlined"
              />
            </Box>

            {/* School Coordinator */}
            <Box>
              <Typography
                variant="subtitle1"
                fontWeight="600"
                mb={1}
                sx={{ color: 'var(--text-primary)' }}
              >
                School Coordinator *
              </Typography>
              <Autocomplete
                options={employeeOptions}
                getOptionLabel={(option) => {
                  if (!option) return '';
                  const name = option.employeeName || option.name || '';
                  const code = option.institutionId || option.employeeId || option.employeeCode || '';
                  return code ? `${name} (${code})` : name;
                }}
                value={selectedCoordinator}
                onChange={(_, newValue) => {
                  if (newValue) {
                    const code = newValue.institutionId || newValue.employeeId || newValue.employeeCode || '';
                    setSelectedCoordinator({
                      ...newValue,
                      employeeId: code,
                      institutionId: code,
                      employeeName: newValue.employeeName || newValue.name || '',
                    });
                  } else {
                    setSelectedCoordinator(null);
                  }
                  setErrors((prev) => ({ ...prev, coordinator: null }));
                }}
                inputValue={searchQuery}
                onInputChange={(_, newInputValue) => {
                  setSearchQuery(newInputValue);
                }}
                filterOptions={(x) => x}
                isOptionEqualToValue={(option, value) => {
                  const optionCode = option.institutionId || option.employeeId || option.employeeCode || '';
                  const valueCode = value.institutionId || value.employeeId || value.employeeCode || '';
                  return optionCode === valueCode;
                }}
                loading={isSearching}
                noOptionsText={searchQuery ? 'No matches found' : 'Type to search'}
                renderInput={(params) => {
                  const inputProps = params.InputProps || {};
                  return (
                    <TextField
                      {...params}
                      placeholder="Search by name or ID"
                      error={!!errors.coordinator}
                      helperText={errors.coordinator}
                      InputProps={{
                        ...inputProps,
                        endAdornment: (
                          <>
                            {isSearching ? <CircularProgress color="inherit" size={20} /> : null}
                            {inputProps.endAdornment}
                          </>
                        ),
                      }}
                      variant="outlined"
                    />
                  );
                }}
                renderOption={(props, option) => {
                  const { key, ...optionProps } = props;
                  return (
                    <Box
                      component="li"
                      key={key || option.institutionId || option.employeeId || option._id}
                      {...optionProps}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body2" fontWeight={600}>{option.employeeName || option.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.designation || 'Staff'} • {option.department || 'Unknown'}
                        </Typography>
                      </Box>
                    </Box>
                  );
                }}
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
                  {submitting ? 'Saving...' : editingGroup ? 'Update School' : 'Create School'}
                </Button>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </PageContainer>
  );
};

export default GroupManagement;


