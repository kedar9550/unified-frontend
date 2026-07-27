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
import DataTable from '../../components/data/DataTable';
import { fetchEventDepartments } from '../../api/eventDepartmentApi';
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
  const [departments, setDepartments] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('Active');
  const [selectedCoordinator, setSelectedCoordinator] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoError, setLogoError] = useState('');

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
      const response = await API.get('/api/groups');
      setGroups(response.data?.groups || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await fetchEventDepartments();
      const activeDepts = (response.data?.departments || []).filter(d => d.status === 'Active');
      setDepartmentsList(activeDepts);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
    fetchDepartments();
  }, [fetchGroups, fetchDepartments]);

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

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    setLogoError('');
    if (!file) return;

    const message = validateImage(file);
    if (message) {
      setLogoError(message);
      return;
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, logo: null }));
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

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setLogoError('');
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

    if (!departments || departments.length === 0) {
      newErrors.department = 'At least one department is required.';
    }

    if (!content.trim()) {
      newErrors.content = 'Content is required.';
    } else if (content.length > 5000) {
      newErrors.content = 'Content cannot exceed 5000 characters.';
    }

    if (!selectedCoordinator) {
      newErrors.eventCoordinator = 'Event Coordinator is required.';
    }

    // Images required only when creating
    if (!editingGroup && !logoFile) {
      newErrors.logo = 'Group Logo is required.';
    }
    if (!editingGroup && !bannerFile) {
      newErrors.banner = 'Banner Image is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Form helpers ───
  const resetForm = () => {
    setName('');
    setDepartments([]);
    setContent('');
    setStatus('Active');
    setSelectedCoordinator(null);
    setSearchQuery('');
    setEmployeeOptions([]);
    setLogoFile(null);
    setLogoPreview(null);
    setLogoError('');
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
    setDepartments(Array.isArray(group.department)
      ? group.department.map((dept) => dept._id || dept)
      : group.department
        ? [group.department._id || group.department]
        : []);
    setContent(group.content || '');
    setStatus(group.status || 'Active');
    setSelectedCoordinator(group.eventCoordinator ? {
      employeeId: group.eventCoordinator.employeeId || group.eventCoordinator.institutionId || group.eventCoordinator.employeeCode || '',
      institutionId: group.eventCoordinator.institutionId || group.eventCoordinator.employeeId || group.eventCoordinator.employeeCode || '',
      employeeName: group.eventCoordinator.employeeName || group.eventCoordinator.name || '',
      name: group.eventCoordinator.employeeName || group.eventCoordinator.name || '',
      department: group.eventCoordinator.department,
      designation: group.eventCoordinator.designation,
    } : null);

    setLogoFile(null);
    setLogoPreview(group.logo ? `${BACKEND_URL}${group.logo}` : null);
    setLogoError('');

    setBannerFile(null);
    setBannerPreview(group.banner ? `${BACKEND_URL}${group.banner}` : null);
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
    formData.append('department', JSON.stringify(departments));
    formData.append('content', content);
    formData.append('status', status);
    formData.append('eventCoordinator', JSON.stringify(selectedCoordinator || {}));

    if (logoFile) formData.append('logo', logoFile);
    if (bannerFile) formData.append('banner', bannerFile);

    try {
      if (editingGroup) {
        const response = await API.put(`/api/groups/${editingGroup._id}`, formData);
        if (response.data.success) {
          toast.success('Group updated successfully!');
          goBackToList();
        }
      } else {
        const response = await API.post('/api/groups', formData);
        if (response.data.success) {
          toast.success('Group created successfully!');
          goBackToList();
        }
      }
    } catch (error) {
      console.error('Error saving group:', error);
      toast.error(error.response?.data?.message || 'Failed to save group. Please try again.');
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
      const response = await API.delete(`/api/groups/${groupToDelete._id}`);
      if (response.data.success) {
        toast.success('Group deleted successfully!');
        fetchGroups();
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error(error.response?.data?.message || 'Failed to delete group.');
    } finally {
      setDeleteDialogOpen(false);
      setGroupToDelete(null);
    }
  };

  // ─── Table columns & rows ───
  const columns = ['#', 'Logo', 'Banner', 'Name', 'Department', 'Staff Coordinator', 'Status', 'Actions'];

  const tableRows = groups.map((group, index) => [
    index + 1,
    {
      value: group.name,
      display: (
        <Avatar
          src={group.logo ? (group.logo.startsWith('http') ? group.logo : `${BACKEND_URL}${group.logo}`) : ''}
          alt={group.name}
          variant="rounded"
          onClick={() => {
            if (group.logo) {
              handleImageClick(group.logo.startsWith('http') ? group.logo : `${BACKEND_URL}${group.logo}`);
            }
          }}
          sx={{ width: 48, height: 48, mx: 'auto', border: '2px solid var(--border-color)', cursor: group.logo ? 'pointer' : 'default' }}
        >
          {!group.logo && group.name?.charAt(0)}
        </Avatar>
      ),
    },
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
    Array.isArray(group.department)
      ? group.department.map((dept) => dept?.name || '').filter(Boolean).join(', ') || 'N/A'
      : group.department?.name || 'N/A',
    (() => {
      const code = group.eventCoordinator?.institutionId || group.eventCoordinator?.employeeId || group.eventCoordinator?.employeeCode || '';
      const name = group.eventCoordinator?.employeeName || 'N/A';
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
    previewAlt,
    previewMaxHeight,
    hint,
  }) => {
    if (!preview) {
      return (
        <Box
          component="label"
          sx={{
            display: 'block',
            border: '2px dashed',
            borderColor: hasError ? 'error.main' : 'grey.300',
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
        >
          <input type="file" hidden accept=".jpg,.jpeg,.png,.webp" onChange={onChange} />
          <CloudUploadIcon
            sx={{ fontSize: 48, color: hasError ? 'error.main' : 'primary.main', mb: 1 }}
          />
          <Typography variant="h6" color="text.primary" gutterBottom>
            Click or drag file to upload
          </Typography>
          <Typography variant="body2" color="text.secondary">
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
          src={preview}
          alt={previewAlt}
          style={{ maxWidth: '100%', maxHeight: `${previewMaxHeight}px`, objectFit: 'contain' }}
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
            <input type="file" hidden accept=".jpg,.jpeg,.png,.webp" onChange={onChange} />
          </Button>
          <IconButton color="error" onClick={onRemove} size="small">
            <DeleteIcon />
          </IconButton>
        </Box>
      </Box>
    );
  };

  // ─── LIST VIEW ───
  if (view === 'list') {
    return (
      <Box sx={{ p: 3 }}>
        <PageHeader
          title="Group Management"
          subtitle="Create and manage VEDA event groups"
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
              Create Group
            </Button>
          }
        />

        <DataTable
          columns={columns}
          rows={tableRows}
          loading={loading}
          nonSortableColumns={[1, 2, 7]}
          alignments={['center', 'center', 'center', 'left', 'left', 'left', 'center', 'center']}
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
            Delete Group
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
      </Box>
    );
  }

  // ─── FORM VIEW (Create / Edit) ───
  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title={editingGroup ? 'Edit Group' : 'Create Group'}
        subtitle={
          editingGroup
            ? `Editing "${editingGroup.name}"`
            : 'Fill in the details to create a new group'
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
                Group Name *
              </Typography>
              <TextField
                fullWidth
                placeholder="Enter group name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={!!errors.name}
                helperText={errors.name || `${name.length}/200`}
                slotProps={{ htmlInput: { maxLength: 200 } }}
                variant="outlined"
              />
            </Box>

            {/* Department */}
            <Box>
              <Typography
                variant="subtitle1"
                fontWeight="600"
                mb={1}
                sx={{ color: 'var(--text-primary)' }}
              >
                Department *
              </Typography>
              <FormControl fullWidth error={!!errors.department}>
                <Select
                  multiple
                  value={departments}
                  onChange={(e) => setDepartments(e.target.value)}
                  displayEmpty
                  renderValue={(selected) => {
                    if (!selected || selected.length === 0) {
                      return <em>Select department(s)</em>;
                    }
                    return selected
                      .map((deptId) => departmentsList.find((dept) => dept._id === deptId)?.name || deptId)
                      .join(', ');
                  }}
                  variant="outlined"
                  MenuProps={{
                    PaperProps: {
                      sx: { maxHeight: 300 },
                    },
                  }}
                >
                  {departmentsList.map((dept) => (
                    <MenuItem key={dept._id} value={dept._id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <input
                          type="checkbox"
                          checked={departments.includes(dept._id)}
                          readOnly
                          style={{ width: 16, height: 16 }}
                        />
                        <Typography>{dept.name}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {errors.department && (
                  <FormHelperText>{errors.department}</FormHelperText>
                )}
              </FormControl>
            </Box>

            {/* Logo Upload */}
            <Box>
              <Typography
                variant="subtitle1"
                fontWeight="600"
                mb={1}
                sx={{ color: 'var(--text-primary)' }}
              >
                Group Logo *
              </Typography>
              {renderUploader({
                preview: logoPreview,
                onChange: handleLogoChange,
                onRemove: removeLogo,
                hasError: !!errors.logo,
                previewAlt: 'Logo Preview',
                previewMaxHeight: 300,
                hint: 'Supports JPG, PNG, WebP. Max size: 5MB. Square image recommended.',
              })}
              {logoError && (
                <FormHelperText error sx={{ mt: 1, ml: 1 }}>
                  {logoError}
                </FormHelperText>
              )}
              {errors.logo && !logoPreview && (
                <FormHelperText error sx={{ mt: 1, ml: 1 }}>
                  {errors.logo}
                </FormHelperText>
              )}
            </Box>

            {/* Banner Upload */}
            <Box>
              <Typography
                variant="subtitle1"
                fontWeight="600"
                mb={1}
                sx={{ color: 'var(--text-primary)' }}
              >
                Banner Image *
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

            {/* Staff Coordinator */}
            <Box>
              <Typography
                variant="subtitle1"
                fontWeight="600"
                mb={1}
                sx={{ color: 'var(--text-primary)' }}
              >
                Staff  Coordinator *
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
                  setErrors((prev) => ({ ...prev, eventCoordinator: null }));
                }}
                inputValue={searchQuery}
                onInputChange={(_, newInputValue) => {
                  setSearchQuery(newInputValue);
                }}
                loading={isSearching}
                noOptionsText={searchQuery ? 'No matches found' : 'Type to search'}
                renderInput={(params) => {
                  const inputProps = params.InputProps || {};
                  return (
                    <TextField
                      {...params}
                      placeholder="Search by name or ID"
                      error={!!errors.eventCoordinator}
                      helperText={errors.eventCoordinator}
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
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={option.employeeId || option._id}>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body2" fontWeight={600}>{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.designation || 'Staff'} • {option.department || 'Unknown'}
                      </Typography>
                    </Box>
                  </Box>
                )}
                isOptionEqualToValue={(option, value) => option?.employeeId === value?.employeeId}
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
                  {submitting ? 'Saving...' : editingGroup ? 'Update Group' : 'Create Group'}
                </Button>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default GroupManagement;