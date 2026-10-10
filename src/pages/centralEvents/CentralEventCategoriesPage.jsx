import React, { useState, useEffect } from 'react';
import {
  Box,
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
  ListSubheader,
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
  Category as CategoryIcon,
  Folder as FolderIcon,
  Event as EventIcon,
  CloudUpload as UploadIcon,
  Image as ImageIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getEventTypes,
  getAllCentralEventCategoriesAdmin,
  createCentralEventCategory,
  updateCentralEventCategory,
  deleteCentralEventCategory,
  uploadCentralEventFile,
  getAcademicYears
} from '../../api/centralEventsApi';
import API from '../../api/axios';
import { PageHeader, CustomTabs } from '../../components/common';
import PageContainer from '../../components/common/design-system/PageContainer';
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
  const { user, activeRole } = useAuth();

  const userRoles = (user?.roles || []).map(r => (typeof r === 'string' ? r : (r.role?.key || r.role?.name || r.role || '')).toUpperCase());
  const isGlobalAdmin = userRoles.includes('GLOBAL_EVENT_ADMIN') || userRoles.includes('SUPER_ADMIN') || activeRole?.toUpperCase() === 'GLOBAL_EVENT_ADMIN';

  const [types, setTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected Filters
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('');
  const [selectedAcademicYearFilter, setSelectedAcademicYearFilter] = useState('');

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
  const [academicYear, setAcademicYear] = useState('');
  const [hasSubcategories, setHasSubcategories] = useState(false);
  const [subcategories, setSubcategories] = useState([]);
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [newSubBanner, setNewSubBanner] = useState(null);
  const [uploadingSubBanner, setUploadingSubBanner] = useState(false);
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

  // Navigation Tabs
  const navTabs = [
    { key: 'all', label: 'All Central Events', icon: <EventIcon />, path: '/central-events' },
    { key: 'types', label: 'Event Types', icon: <CategoryIcon />, path: '/central-events/types' },
    { key: 'categories', label: 'Event Categories', icon: <FolderIcon />, path: '/central-events/categories' },
    { key: 'subcategories', label: 'Event Subcategories', icon: <FolderIcon />, path: '/central-events/subcategories' },
    ...(isGlobalAdmin ? [{ key: 'create', label: 'Create Event', icon: <AddIcon />, path: '/central-events/create' }] : [])
  ];

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [typesRes, ayRes] = await Promise.all([
          getEventTypes(),
          getAcademicYears()
        ]);
        if (typesRes.success) {
          setTypes(typesRes.data);
        }
        const ayList = ayRes?.years || ayRes?.data || [];
        if (Array.isArray(ayList)) {
          setAcademicYears(ayList);
          const activeAY = ayList.find(ay => ay.active)?.year || ayList[0]?.year || '';
          if (activeAY) {
            setSelectedAcademicYearFilter(activeAY);
          }
        }
      } catch (err) {
        toast.error('Failed to load initial data');
      }
    };
    fetchInitialData();
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
      const res = await getAllCentralEventCategoriesAdmin(selectedTypeFilter, selectedAcademicYearFilter);
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
  }, [selectedTypeFilter, selectedAcademicYearFilter]);

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
    const defaultAY = academicYears.find(ay => ay.active)?.year || academicYears[0]?.year || '';
    setAcademicYear(defaultAY);
    setHasSubcategories(false);
    setSubcategories([]);
    setNewSubCode('');
    setNewSubName('');
    setNewSubBanner(null);
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
    const defaultAY = item.academicYear || (academicYears.find(ay => ay.active)?.year || academicYears[0]?.year || '');
    setAcademicYear(defaultAY);
    setHasSubcategories(!!item.hasSubcategories);
    setSubcategories(item.subcategories || []);
    setNewSubCode('');
    setNewSubName('');
    setNewSubBanner(null);
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

  const handleNewSubBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingSubBanner(true);
    try {
      const res = await uploadCentralEventFile(file, { folderType: 'subcategory', academicYear });
      if (res.success) {
        setNewSubBanner(res.data);
        toast.success('Subcategory banner image uploaded');
      }
    } catch (err) {
      toast.error('Failed to upload subcategory banner image');
    } finally {
      setUploadingSubBanner(false);
    }
  };

  const handleSubcategoryItemBannerUpload = async (index, e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const res = await uploadCentralEventFile(file, { folderType: 'subcategory', academicYear });
      if (res.success) {
        setSubcategories(subcategories.map((sub, i) => i === index ? { ...sub, banner: res.data } : sub));
        toast.success('Subcategory banner updated');
      }
    } catch (err) {
      toast.error('Failed to upload subcategory banner');
    }
  };

  const handleRemoveSubcategoryItemBanner = (index) => {
    setSubcategories(subcategories.map((sub, i) => i === index ? { ...sub, banner: null } : sub));
  };

  const handleAddSubcategory = () => {
    if (!newSubName.trim()) {
      toast.error('Subcategory Name is required');
      return;
    }
    const codeToUse = (newSubCode.trim() || newSubName.trim().replace(/\s+/g, '_')).toUpperCase();
    if (subcategories.some(s => s.code === codeToUse)) {
      toast.error(`Subcategory code "${codeToUse}" already added`);
      return;
    }
    setSubcategories([...subcategories, {
      code: codeToUse,
      name: newSubName.trim(),
      isActive: true,
      banner: newSubBanner
    }]);
    setNewSubCode('');
    setNewSubName('');
    setNewSubBanner(null);
  };

  const handleRemoveSubcategory = (index) => {
    setSubcategories(subcategories.filter((_, i) => i !== index));
  };

  const handleToggleSubcategoryStatus = (index) => {
    setSubcategories(subcategories.map((sub, i) => i === index ? { ...sub, isActive: !sub.isActive } : sub));
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingBanner(true);
    try {
      const res = await uploadCentralEventFile(file, { folderType: 'category', academicYear });
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
        academicYear,
        hasSubcategories,
        subcategories: hasSubcategories ? subcategories : [],
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
    <PageContainer maxWidth="xl" px={3} py={3}>
      {/* Standard Page Header */}
      <PageHeader
        title="Central Event Categories Management"
        subtitle="Manage categories, banners, assigned faculty coordinators, and subcategory features per event type"
        icon={<FolderIcon />}
        showBack
        backPath="/central-events"
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenAdd}
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              px: 3,
              py: 1.2,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
            }}
          >
            Add Event Category
          </Button>
        }
      />

      {/* Filter Bar with Standardized MUI Form Controls */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 4,
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-glass)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <FormControl sx={{ minWidth: 320, maxWidth: 480 }} size="small">
          <InputLabel id="event-type-filter-label">Filter by Event Type</InputLabel>
          <Select
            labelId="event-type-filter-label"
            id="event-type-filter-select"
            value={selectedTypeFilter}
            label="Filter by Event Type"
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            sx={{ borderRadius: '12px', backgroundColor: 'var(--bg-paper)' }}
          >
            <MenuItem value="">
              <em>All Event Types</em>
            </MenuItem>

            <ListSubheader sx={{ fontWeight: 700, color: 'info.main', lineHeight: '32px', bgcolor: 'var(--bg-paper)' }}>
              🌐 Global Level Events
            </ListSubheader>
            {types.filter(t => (t.levelGroup || 'GLOBAL') === 'GLOBAL' || ['VEDA', 'COLORS', 'ALA'].includes(t.code)).map((t) => (
              <MenuItem key={t.code} value={t.code} sx={{ pl: 3.5 }}>
                {t.name}
              </MenuItem>
            ))}

            <ListSubheader sx={{ fontWeight: 700, color: 'success.main', lineHeight: '32px', bgcolor: 'var(--bg-paper)' }}>
              🏫 Institute Level Events
            </ListSubheader>
            {types.filter(t => t.levelGroup === 'INSTITUTE' || ['CLUB', 'DEPARTMENTAL', 'UNIVERSITY'].includes(t.code)).map((t) => (
              <MenuItem key={t.code} value={t.code} sx={{ pl: 3.5 }}>
                {t.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 240, maxWidth: 320 }} size="small">
          <InputLabel id="academic-year-filter-label">Academic Year</InputLabel>
          <Select
            labelId="academic-year-filter-label"
            id="academic-year-filter-select"
            value={selectedAcademicYearFilter}
            label="Academic Year"
            onChange={(e) => setSelectedAcademicYearFilter(e.target.value)}
            sx={{ borderRadius: '12px', backgroundColor: 'var(--bg-paper)' }}
          >
            <MenuItem value="">
              <em>All Academic Years</em>
            </MenuItem>
            {academicYears.map((ay) => (
              <MenuItem key={ay._id || ay.year} value={ay.year}>
                {ay.year} {ay.active ? '(Active)' : ''}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* Table Section */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
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
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: 'var(--bg-accent-1, #f8fafc)' }}>
                <TableRow>
                  <TableCell><strong>S.No</strong></TableCell>
                  <TableCell><strong>Banner</strong></TableCell>
                  <TableCell><strong>Event Type</strong></TableCell>
                  <TableCell><strong>Academic Year</strong></TableCell>
                  <TableCell><strong>Category Code</strong></TableCell>
                  <TableCell><strong>Category Name</strong></TableCell>
                  <TableCell><strong>Has Subcategories</strong></TableCell>
                  <TableCell><strong>Category Coordinators</strong></TableCell>
                  <TableCell><strong>Sort Order</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
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
                                border: '1px solid var(--border-color)'
                              }}
                            />
                          ) : (
                            <Box
                              sx={{
                                width: 55,
                                height: 35,
                                borderRadius: 2,
                                backgroundColor: 'var(--bg-accent-2, #f1f5f9)',
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
                            sx={{ fontWeight: 700, borderRadius: '8px' }}
                          />
                        </TableCell>
                        <TableCell>
                          {row.academicYear ? (
                            <Chip label={row.academicYear} size="small" variant="outlined" sx={{ fontWeight: 600, borderRadius: '6px' }} />
                          ) : (
                            <Typography variant="caption" color="text.secondary" fontStyle="italic">-</Typography>
                          )}
                        </TableCell>
                        <TableCell><Typography fontWeight={600}>{row.code}</Typography></TableCell>
                        <TableCell><Typography>{row.name}</Typography></TableCell>
                        <TableCell>
                          <Chip
                            label={row.hasSubcategories ? 'Yes' : 'No'}
                            color={row.hasSubcategories ? 'success' : 'default'}
                            size="small"
                            variant="outlined"
                          />
                          {row.hasSubcategories && row.subcategories?.length > 0 && (
                            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                              {row.subcategories.length} subcat{row.subcategories.length === 1 ? 'egory' : 'egories'}
                            </Typography>
                          )}
                        </TableCell>
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

      {/* Add / Edit Dialog with Standardized MUI Form Controls */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '18px', p: 1 } }}>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
            {editingItem ? 'Edit Category' : 'Add New Category'}
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={3} mt={1}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, width: '100%' }}>
                <FormControl fullWidth required disabled={!!editingItem}>
                  <InputLabel id="dialog-event-type-label">Event Type</InputLabel>
                  <Select
                    labelId="dialog-event-type-label"
                    value={typeId}
                    label="Event Type"
                    onChange={(e) => setTypeId(e.target.value)}
                    sx={{ borderRadius: '12px' }}
                  >
                    {types.map((t) => (
                      <MenuItem key={t._id} value={t._id}>
                        {t.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth required>
                  <InputLabel id="dialog-academic-year-label">Academic Year</InputLabel>
                  <Select
                    labelId="dialog-academic-year-label"
                    value={academicYear}
                    label="Academic Year"
                    onChange={(e) => setAcademicYear(e.target.value)}
                    sx={{ borderRadius: '12px' }}
                  >
                    {academicYears.map((ay) => (
                      <MenuItem key={ay._id || ay.year} value={ay.year}>
                        {ay.year} {ay.active ? '(Active)' : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, width: '100%' }}>
                <TextField
                  fullWidth
                  required
                  label="Category Code (Unique per type)"
                  placeholder="e.g. ROBOTICS, DANCE"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  InputProps={{ sx: { borderRadius: '12px' } }}
                />
                <TextField
                  fullWidth
                  required
                  label="Category Name"
                  placeholder="e.g. Robotics & Automation"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  InputProps={{ sx: { borderRadius: '12px' } }}
                />
              </Box>

              {/* Optional Category Banner Image */}
              <Box sx={{ border: '1px dashed var(--border-color)', p: 2, borderRadius: '12px', bgcolor: 'var(--bg-accent-1, #f8fafc)' }}>
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
                    sx={{ textTransform: 'none', borderRadius: '10px' }}
                  >
                    {uploadingBanner ? 'Uploading...' : 'Upload Banner Image'}
                    <input type="file" hidden accept="image/*" onChange={handleBannerUpload} />
                  </Button>

                  {banner && (
                    <Card variant="outlined" sx={{ display: 'flex', alignItems: 'center', p: 1, borderRadius: '10px' }}>
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

              {/* Has Subcategories Switch */}
              <FormControlLabel
                control={
                  <Switch
                    checked={hasSubcategories}
                    onChange={(e) => {
                      setHasSubcategories(e.target.checked);
                    }}
                    color="primary"
                  />
                }
                label="Has Subcategories (SubCat1..SubCatN)"
              />

              {/* Category Coordinators, Status, and Order Number Row */}
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
                    InputProps={{ sx: { borderRadius: '12px' } }}
                    variant="outlined"
                  />
                </Box>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setOpenModal(false)} sx={{ borderRadius: '10px' }}>Cancel</Button>
            <Button variant="contained" type="submit" disabled={submitting} sx={{ borderRadius: '10px', px: 3 }}>
              {submitting ? <CircularProgress size={24} /> : editingItem ? 'Update Category' : 'Create Category'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete this event category? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirmId(null)} sx={{ borderRadius: '10px' }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} sx={{ borderRadius: '10px' }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
