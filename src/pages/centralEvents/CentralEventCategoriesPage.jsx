import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Stack,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Avatar,
  Card,
  Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  CloudUpload as UploadIcon,
  Image as ImageIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  getEventTypes,
  getAllCentralEventCategoriesAdmin,
  createCentralEventCategory,
  updateCentralEventCategory,
  deleteCentralEventCategory,
  uploadCentralEventFile
} from '../../api/centralEventsApi';
import API from '../../api/axios';
import { toast } from 'sonner';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9022';

const getImageUrl = (img) => {
  if (!img) return '';
  const pathStr = typeof img === 'string' ? img : img.url;
  if (!pathStr) return '';
  return pathStr.startsWith('http') ? pathStr : `${BACKEND_URL}${pathStr.startsWith('/') ? '' : '/'}${pathStr}`;
};

export default function CentralEventCategoriesPage() {
  const navigate = useNavigate();

  const [types, setTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected Type Filter
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('');

  // Pagination State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal State
  const [openModal, setOpenModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [typeId, setTypeId] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);

  // Banner State
  const [banner, setBanner] = useState(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Multi-Coordinator Search State
  const [selectedCoordinators, setSelectedCoordinators] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Delete Confirm Dialog State
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await getEventTypes();
        if (res.success) {
          setTypes(res.data);
        }
      } catch (err) {
        toast.error('Failed to load event types');
      }
    };
    fetchTypes();
  }, []);

  // Employee live search effect
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) return;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await API.get('/api/employees/search', { params: { query: searchQuery.trim() } });
        const users = res.data?.data || res.data || [];
        if (Array.isArray(users)) {
          const formatted = users.map(u => ({
            empId: u.institutionId || u.empId || u.employeeId || '',
            name: u.name || u.EMP_NAME || '',
            designation: u.designation || u.DESIGNATION || '',
            department: typeof u.department === 'object' ? (u.department?.name || u.department?.code) : (u.department || u.DEPT_NAME || ''),
            phone: u.phone || u.MOBILE || '',
            email: u.email || u.EMAIL || ''
          }));
          setEmployeeOptions(formatted);
        }
      } catch (err) {
        console.error('Error searching employees:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await getAllCentralEventCategoriesAdmin(selectedTypeFilter);
      if (res.success) {
        setCategories(res.data);
        setPage(0);
      }
    } catch (err) {
      toast.error('Failed to load central event categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [selectedTypeFilter]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setTypeId(selectedTypeFilter ? (types.find(t => t.code === selectedTypeFilter)?._id || '') : (types[0]?._id || ''));
    setCode('');
    setName('');
    setSortOrder('0');
    setIsActive(true);
    setBanner(null);
    setSelectedCoordinators([]);
    setSearchQuery('');
    setEmployeeOptions([]);
    setOpenModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setTypeId(item.typeId?._id || item.typeId || '');
    setCode(item.code);
    setName(item.name);
    setSortOrder(String(item.sortOrder || 0));
    setIsActive(item.isActive !== undefined ? item.isActive : true);
    setBanner(item.banner || null);

    const coords = item.coordinators?.length > 0
      ? item.coordinators
      : (item.coordinator?.empId ? [item.coordinator] : []);

    setSelectedCoordinators(coords);
    setEmployeeOptions(coords);
    setSearchQuery('');

    setOpenModal(true);
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingBanner(true);
    try {
      const res = await uploadCentralEventFile(file);
      if (res.success) {
        setBanner(res.data);
        toast.success('Category banner image uploaded');
      }
    } catch (err) {
      toast.error('Failed to upload banner image');
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        typeId,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        sortOrder: parseInt(sortOrder || '0', 10),
        isActive,
        banner,
        coordinators: selectedCoordinators,
        coordinator: selectedCoordinators[0] || null
      };

      if (editingItem) {
        const res = await updateCentralEventCategory(editingItem._id, payload);
        if (res.success) {
          toast.success('Category updated successfully');
          setOpenModal(false);
          fetchCategories();
        }
      } else {
        const res = await createCentralEventCategory(payload);
        if (res.success) {
          toast.success('Category created successfully');
          setOpenModal(false);
          fetchCategories();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      const res = await deleteCentralEventCategory(deleteConfirmId);
      if (res.success) {
        toast.success('Category deleted successfully');
        setDeleteConfirmId(null);
        fetchCategories();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete category');
    }
  };

  const displayedCategories = categories.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/central-events')} sx={{ mb: 2 }}>
        Back to Central Events Hub
      </Button>

      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 4,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Central Event Categories Management
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Manage categories, banners, and assigned faculty coordinators per event type
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
          sx={{ borderRadius: 2, textTransform: 'none', px: 3, py: 1.2, fontWeight: 600 }}
        >
          Add Event Category
        </Button>
      </Paper>

      {/* Filter Bar */}
      <Paper elevation={1} sx={{ p: 2.5, mb: 4, borderRadius: 3, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <FormControl sx={{ minWidth: 320, maxWidth: 480 }} size="small" variant="outlined">
          <InputLabel id="event-type-filter-label">Filter by Event Type</InputLabel>
          <Select
            labelId="event-type-filter-label"
            id="event-type-filter-select"
            value={selectedTypeFilter}
            label="Filter by Event Type"
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            sx={{ borderRadius: 2, backgroundColor: '#fff' }}
          >
            <MenuItem value="">
              <em>All Event Types</em>
            </MenuItem>
            {types.map((t) => (
              <MenuItem key={t.code} value={t.code}>
                {t.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* Table */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                <TableRow>
                  <TableCell><strong>S.No</strong></TableCell>
                  <TableCell><strong>Banner</strong></TableCell>
                  <TableCell><strong>Event Type</strong></TableCell>
                  <TableCell><strong>Category Code</strong></TableCell>
                  <TableCell><strong>Category Name</strong></TableCell>
                  <TableCell><strong>Category Coordinators</strong></TableCell>
                  <TableCell><strong>Sort Order</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      No categories found. Click "Add Event Category" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedCategories.map((row, index) => {
                    const coordsList = row.coordinators?.length > 0
                      ? row.coordinators
                      : (row.coordinator?.name ? [row.coordinator] : []);

                    return (
                      <TableRow key={row._id} hover>
                        <TableCell><Typography fontWeight={600} color="text.secondary">{page * rowsPerPage + index + 1}</Typography></TableCell>
                        <TableCell>
                          {row.banner?.url ? (
                            <img
                              src={getImageUrl(row.banner)}
                              alt={row.name}
                              style={{
                                width: 55,
                                height: 35,
                                objectFit: 'cover',
                                borderRadius: 6,
                                border: '1px solid #e2e8f0'
                              }}
                            />
                          ) : (
                            <Box
                              sx={{
                                width: 55,
                                height: 35,
                                borderRadius: 6,
                                backgroundColor: '#f1f5f9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#94a3b8'
                              }}
                            >
                              <ImageIcon fontSize="small" />
                            </Box>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={row.typeCode || row.typeId?.code}
                            color="primary"
                            size="small"
                            sx={{ fontWeight: 700 }}
                          />
                        </TableCell>
                        <TableCell><Typography fontWeight={600}>{row.code}</Typography></TableCell>
                        <TableCell><Typography>{row.name}</Typography></TableCell>
                        <TableCell>
                          {coordsList.length > 0 ? (
                            <Stack spacing={0.5}>
                              {coordsList.map((c, idx) => (
                                <Box key={idx} display="flex" alignItems="center" gap={1}>
                                  <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: '#2563eb', fontWeight: 700 }}>
                                    {(c.name || 'C').charAt(0)}
                                  </Avatar>
                                  <Typography variant="body2" fontWeight={600}>
                                    {c.name} {c.empId ? `(${c.empId})` : ''}
                                  </Typography>
                                </Box>
                              ))}
                            </Stack>
                          ) : (
                            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>Unassigned</Typography>
                          )}
                        </TableCell>
                        <TableCell>{row.sortOrder}</TableCell>
                        <TableCell>
                          <Chip
                            label={row.isActive ? 'Active' : 'Inactive'}
                            color={row.isActive ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton color="primary" onClick={() => handleOpenEdit(row)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton color="error" onClick={() => setDeleteConfirmId(row._id)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={categories.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
            {editingItem ? 'Edit Category' : 'Add New Category'}
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={3} mt={1}>
              <FormControl fullWidth required disabled={!!editingItem}>
                <InputLabel id="dialog-event-type-label">Event Type</InputLabel>
                <Select
                  labelId="dialog-event-type-label"
                  value={typeId}
                  label="Event Type"
                  onChange={(e) => setTypeId(e.target.value)}
                >
                  {types.map((t) => (
                    <MenuItem key={t._id} value={t._id}>
                      {t.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Category Code (Unique per type)"
                    placeholder="e.g. ROBOTICS, DANCE"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Category Name"
                    placeholder="e.g. Robotics & Automation"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Grid>
              </Grid>

              {/* Optional Category Banner Image */}
              <Box sx={{ border: '1px dashed #cbd5e1', p: 2, borderRadius: 2, bgcolor: '#f8fafc' }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom display="flex" alignItems="center" gap={0.8}>
                  <ImageIcon fontSize="small" color="primary" /> Category Banner Image (Optional)
                </Typography>

                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" mt={1}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<UploadIcon />}
                    disabled={uploadingBanner}
                    size="small"
                    sx={{ textTransform: 'none', borderRadius: 2 }}
                  >
                    {uploadingBanner ? 'Uploading...' : 'Upload Banner Image'}
                    <input type="file" hidden accept="image/*" onChange={handleBannerUpload} />
                  </Button>

                  {banner && (
                    <Card variant="outlined" sx={{ display: 'flex', alignItems: 'center', p: 1, borderRadius: 2 }}>
                      <img
                        src={getImageUrl(banner)}
                        alt="Banner Preview"
                        style={{ width: 70, height: 42, objectFit: 'cover', borderRadius: 4, marginRight: 8 }}
                      />
                      <Typography variant="caption" fontWeight={600} sx={{ maxWidth: 140 }} noWrap>
                        {banner.name}
                      </Typography>
                      <IconButton size="small" color="error" onClick={() => setBanner(null)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Card>
                  )}
                </Stack>
              </Box>

              {/* Category Coordinators, Status, and Order Number Row (Matching Reference Image Pattern) */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr' },
                  gap: 2.5,
                  width: '100%',
                  alignItems: 'flex-start'
                }}
              >
                {/* Category Coordinators Autocomplete */}
                <Box sx={{ width: '100%' }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight="600"
                    mb={1}
                    sx={{ color: 'text.primary' }}
                  >
                    Category Coordinators *
                  </Typography>
                  <Autocomplete
                    multiple
                    fullWidth
                    options={employeeOptions}
                    getOptionLabel={(option) => {
                      if (!option) return '';
                      const coordName = option.name || option.employeeName || '';
                      const empCode = option.empId || option.institutionId || option.employeeId || '';
                      return empCode ? `${coordName} (${empCode})` : coordName;
                    }}
                    value={selectedCoordinators}
                    onChange={(_, newValue) => {
                      if (newValue) {
                        const formattedValue = newValue.map(val => {
                          const code = val.empId || val.institutionId || val.employeeId || '';
                          return {
                            ...val,
                            empId: code,
                            institutionId: code,
                            name: val.name || val.employeeName || ''
                          };
                        });
                        setSelectedCoordinators(formattedValue);
                      } else {
                        setSelectedCoordinators([]);
                      }
                    }}
                    inputValue={searchQuery}
                    onInputChange={(_, newInputValue) => {
                      setSearchQuery(newInputValue);
                    }}
                    filterOptions={(x) => x}
                    isOptionEqualToValue={(option, val) => {
                      const optionCode = option.empId || option.institutionId || option.employeeId || '';
                      const valCode = val?.empId || val?.institutionId || val?.employeeId || '';
                      return optionCode === valCode;
                    }}
                    loading={isSearching}
                    noOptionsText={searchQuery ? 'No coordinator found' : 'Search employee by name or ID'}
                    renderInput={(params) => {
                      const inputProps = params.InputProps || {};
                      return (
                        <TextField
                          {...params}
                          fullWidth
                          placeholder="Search employee by name or ID"
                          InputProps={{
                            ...inputProps,
                            sx: { borderRadius: '12px' },
                            endAdornment: (
                              <>
                                {isSearching ? <CircularProgress color="inherit" size={20} /> : null}
                                {inputProps.endAdornment}
                              </>
                            )
                          }}
                          variant="outlined"
                        />
                      );
                    }}
                    renderOption={(props, option) => (
                      <Box
                        component="li"
                        {...props}
                        key={option.empId || option.institutionId || option.employeeId || option._id}
                        sx={{ py: 1.25, px: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}
                      >
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: 'primary.main',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                          }}
                        >
                          {(option.name || option.employeeName || 'E')[0]?.toUpperCase()}
                        </Avatar>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="body2" fontWeight={600} sx={{ color: 'text.primary' }}>
                            {option.name || option.employeeName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.designation || 'Staff'} • {option.department || 'General'}
                            {(option.empId || option.institutionId || option.employeeId) &&
                              ` • ID: ${option.empId || option.institutionId || option.employeeId}`}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          key={option.empId || index}
                          label={`${option.name || 'Coordinator'} (${option.empId || ''})`}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ borderRadius: '8px', fontWeight: 600 }}
                          {...getTagProps({ index })}
                        />
                      ))
                    }
                  />
                </Box>

                {/* Status Dropdown */}
                <Box sx={{ width: '100%' }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight="600"
                    mb={1}
                    sx={{ color: 'text.primary' }}
                  >
                    Status
                  </Typography>
                  <FormControl fullWidth>
                    <Select
                      fullWidth
                      value={isActive ? 'Active' : 'Inactive'}
                      onChange={(e) => setIsActive(e.target.value === 'Active')}
                      sx={{ borderRadius: '12px' }}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: selected === 'Active' ? '#16a34a' : '#dc2626',
                            }}
                          />
                          <Typography variant="body2" fontWeight={600}>
                            {selected}
                          </Typography>
                        </Box>
                      )}
                    >
                      <MenuItem value="Active">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CheckCircleIcon sx={{ fontSize: 18, color: '#16a34a' }} />
                          <Typography variant="body2" fontWeight={600}>Active</Typography>
                        </Box>
                      </MenuItem>
                      <MenuItem value="Inactive">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CancelIcon sx={{ fontSize: 18, color: '#dc2626' }} />
                          <Typography variant="body2" fontWeight={600}>Inactive</Typography>
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {/* Order Number Input */}
                <Box sx={{ width: '100%' }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight="600"
                    mb={1}
                    sx={{ color: 'text.primary' }}
                  >
                    Order Number
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    placeholder="e.g. 1"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    slotProps={{
                      input: { sx: { borderRadius: '12px' } }
                    }}
                    variant="outlined"
                  />
                </Box>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setOpenModal(false)}>Cancel</Button>
            <Button variant="contained" type="submit" disabled={submitting}>
              {submitting ? <CircularProgress size={24} /> : editingItem ? 'Update Category' : 'Create Category'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete this event category? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
