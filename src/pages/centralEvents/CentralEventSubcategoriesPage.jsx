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
  Card
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Category as CategoryIcon,
  Folder as FolderIcon,
  Event as EventIcon,
  CloudUpload as UploadIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getEventTypes,
  getAllCentralEventCategoriesAdmin,
  getAllCentralEventSubcategoriesAdmin,
  createCentralEventSubcategory,
  updateCentralEventSubcategory,
  deleteCentralEventSubcategory,
  uploadCentralEventFile,
  getAcademicYears
} from '../../api/centralEventsApi';
import { PageHeader } from '../../components/common';
import PageContainer from '../../components/common/design-system/PageContainer';
import { toast } from 'sonner';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9022';

const getImageUrl = (img) => {
  if (!img) return '';
  const pathStr = typeof img === 'string' ? img : img.url;
  if (!pathStr) return '';
  return pathStr.startsWith('http') ? pathStr : `${BACKEND_URL}${pathStr.startsWith('/') ? '' : '/'}${pathStr}`;
};

export default function CentralEventSubcategoriesPage() {
  const navigate = useNavigate();
  const { user, activeRole } = useAuth();

  const userRoles = (user?.roles || []).map(r => (typeof r === 'string' ? r : (r.role?.key || r.role?.name || r.role || '')).toUpperCase());
  const isGlobalAdmin = userRoles.includes('GLOBAL_EVENT_ADMIN') || userRoles.includes('SUPER_ADMIN') || activeRole?.toUpperCase() === 'GLOBAL_EVENT_ADMIN';

  const [types, setTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected Filters
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('');
  const [selectedAcademicYearFilter, setSelectedAcademicYearFilter] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');

  // Pagination State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal State
  const [openModal, setOpenModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [categoryId, setCategoryId] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);

  // Banner State
  const [banner, setBanner] = useState(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Delete Confirm Dialog State
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

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

  const fetchCategories = async () => {
    try {
      const res = await getAllCentralEventCategoriesAdmin(selectedTypeFilter, selectedAcademicYearFilter);
      if (res.success) {
        // Filter categories where hasSubcategories is true
        setCategories(res.data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchSubcategories = async () => {
    setLoading(true);
    try {
      const res = await getAllCentralEventSubcategoriesAdmin(selectedTypeFilter, selectedAcademicYearFilter, selectedCategoryFilter);
      if (res.success) {
        setSubcategories(res.data);
        setPage(0);
      }
    } catch (err) {
      toast.error('Failed to load subcategories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [selectedTypeFilter, selectedAcademicYearFilter]);

  useEffect(() => {
    fetchSubcategories();
  }, [selectedTypeFilter, selectedAcademicYearFilter, selectedCategoryFilter]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Filter categories where subcategories are enabled
  const enabledCategories = categories.filter(c => c.hasSubcategories);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setCategoryId(selectedCategoryFilter || (enabledCategories[0]?._id || ''));
    setCode('');
    setName('');
    setSortOrder('0');
    setIsActive(true);
    setBanner(null);
    setOpenModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setCategoryId(item.categoryId?._id || item.categoryId || '');
    setCode(item.code);
    setName(item.name);
    setSortOrder(String(item.sortOrder || 0));
    setIsActive(item.isActive !== undefined ? item.isActive : true);
    setBanner(item.banner || null);
    setOpenModal(true);
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const selectedCatObj = categories.find(c => String(c._id) === String(categoryId));
    const targetAy = selectedCatObj?.academicYear || selectedAcademicYearFilter || '';

    setUploadingBanner(true);
    try {
      const res = await uploadCentralEventFile(file, { folderType: 'subcategory', academicYear: targetAy });
      if (res.success) {
        setBanner(res.data);
        toast.success('Subcategory banner uploaded successfully');
      }
    } catch (err) {
      toast.error('Failed to upload banner image');
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryId) {
      toast.error('Please select a Parent Category (with subcategories enabled)');
      return;
    }
    if (!code.trim() || !name.trim()) {
      toast.error('Subcategory Code and Name are required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        categoryId,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        sortOrder: parseInt(sortOrder || '0', 10),
        isActive,
        banner
      };

      if (editingItem) {
        const targetSubId = editingItem.subId || editingItem._id;
        const res = await updateCentralEventSubcategory(targetSubId, payload);
        if (res.success) {
          toast.success('Subcategory updated successfully');
          setOpenModal(false);
          fetchSubcategories();
        }
      } else {
        const res = await createCentralEventSubcategory(payload);
        if (res.success) {
          toast.success('Subcategory created successfully');
          setOpenModal(false);
          fetchSubcategories();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save subcategory');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      const res = await deleteCentralEventSubcategory(deleteConfirmId);
      if (res.success) {
        toast.success('Subcategory deleted successfully');
        setDeleteConfirmId(null);
        fetchSubcategories();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete subcategory');
    }
  };

  const displayedSubcategories = subcategories.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <PageContainer maxWidth="xl" px={3} py={3}>
      {/* Standard Page Header */}
      <PageHeader
        title="Central Event Subcategories Management"
        subtitle="Manage subcategories, banners, status, and order numbers per parent category"
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
            Add Event Subcategory
          </Button>
        }
      />

      {/* Filter Bar */}
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
        <FormControl sx={{ minWidth: 280, maxWidth: 420 }} size="small">
          <InputLabel id="event-type-filter-label">Filter by Event Type</InputLabel>
          <Select
            labelId="event-type-filter-label"
            id="event-type-filter-select"
            value={selectedTypeFilter}
            label="Filter by Event Type"
            onChange={(e) => {
              setSelectedTypeFilter(e.target.value);
              setSelectedCategoryFilter('');
            }}
            sx={{ borderRadius: '12px', backgroundColor: 'var(--bg-paper)' }}
          >
            <MenuItem value="">
              <em>All Event Types</em>
            </MenuItem>
            {types.map((t) => (
              <MenuItem key={t.code} value={t.code}>
                {t.name} ({t.code})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 220, maxWidth: 300 }} size="small">
          <InputLabel id="academic-year-filter-label">Academic Year</InputLabel>
          <Select
            labelId="academic-year-filter-label"
            id="academic-year-filter-select"
            value={selectedAcademicYearFilter}
            label="Academic Year"
            onChange={(e) => {
              setSelectedAcademicYearFilter(e.target.value);
              setSelectedCategoryFilter('');
            }}
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

        <FormControl sx={{ minWidth: 280, maxWidth: 420 }} size="small">
          <InputLabel id="category-filter-label">Filter by Parent Category</InputLabel>
          <Select
            labelId="category-filter-label"
            id="category-filter-select"
            value={selectedCategoryFilter}
            label="Filter by Parent Category"
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            sx={{ borderRadius: '12px', backgroundColor: 'var(--bg-paper)' }}
          >
            <MenuItem value="">
              <em>All Enabled Categories</em>
            </MenuItem>
            {enabledCategories.map((cat) => (
              <MenuItem key={cat._id} value={cat._id}>
                {cat.code} – {cat.name} ({cat.typeCode})
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
                  <TableCell><strong>Parent Category</strong></TableCell>
                  <TableCell><strong>Subcategory Code</strong></TableCell>
                  <TableCell><strong>Subcategory Name</strong></TableCell>
                  <TableCell><strong>Sort Order</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {subcategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                      No subcategories found. Click "Add Event Subcategory" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedSubcategories.map((row, index) => (
                    <TableRow key={row._id || index} hover>
                      <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                      <TableCell>
                        {row.banner ? (
                          <Box
                            component="img"
                            src={getImageUrl(row.banner)}
                            alt={row.name}
                            sx={{
                              width: 60,
                              height: 36,
                              objectFit: 'cover',
                              borderRadius: '8px',
                              border: '1px solid var(--border-color)'
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: 60,
                              height: 36,
                              borderRadius: '8px',
                              bgcolor: 'var(--bg-accent-1, #f1f5f9)',
                              display: 'flex',
                              alignItems: 'center',
                              justify: 'center'
                            }}
                          >
                            <ImageIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip label={row.typeCode} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                      </TableCell>
                      <TableCell>{row.academicYear || '-'}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {row.categoryCode} – {row.categoryName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={row.code} color="primary" size="small" sx={{ fontWeight: 700 }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{row.name}</Typography>
                      </TableCell>
                      <TableCell>{row.sortOrder || 0}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.isActive ? 'Active' : 'Inactive'}
                          color={row.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenEdit(row)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteConfirmId(row.subId || row._id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={subcategories.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}

      {/* Add / Edit Subcategory Modal */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
          {editingItem ? 'Edit Event Subcategory' : 'Add Event Subcategory'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              {/* Parent Category Selection Dropdown */}
              <FormControl fullWidth required error={!categoryId && submitting}>
                <InputLabel id="parent-category-modal-label">Parent Category (Subcategories Enabled Only)</InputLabel>
                <Select
                  labelId="parent-category-modal-label"
                  id="parent-category-modal-select"
                  value={categoryId}
                  label="Parent Category (Subcategories Enabled Only)"
                  onChange={(e) => setCategoryId(e.target.value)}
                  disabled={!!editingItem}
                  sx={{ borderRadius: '12px' }}
                >
                  {enabledCategories.length === 0 ? (
                    <MenuItem value="" disabled>
                      <em>No categories found with subcategories enabled</em>
                    </MenuItem>
                  ) : (
                    enabledCategories.map((cat) => (
                      <MenuItem key={cat._id} value={cat._id}>
                        {cat.code} – {cat.name} ({cat.typeCode} • {cat.academicYear || 'All Years'})
                      </MenuItem>
                    ))
                  )}
                </Select>
                {enabledCategories.length === 0 && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    Note: Only categories with "Has Subcategories" enabled are displayed. Go to Event Categories page to enable it.
                  </Typography>
                )}
              </FormControl>

              {/* Subcategory Code & Name */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField
                  label="Subcategory Code (Unique per category)"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SINGING_SOLO"
                  fullWidth
                  InputProps={{ sx: { borderRadius: '12px' } }}
                />
                <TextField
                  label="Subcategory Name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Solo Singing"
                  fullWidth
                  InputProps={{ sx: { borderRadius: '12px' } }}
                />
              </Box>

              {/* Subcategory Banner Upload */}
              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Subcategory Banner Image (Optional)
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={uploadingBanner ? <CircularProgress size={20} /> : <UploadIcon />}
                    disabled={uploadingBanner}
                    sx={{ borderRadius: '12px', textTransform: 'none', px: 2.5, py: 1 }}
                  >
                    {uploadingBanner ? 'Uploading Banner...' : 'Upload Banner Image'}
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
                        {banner.name || 'Banner Attached'}
                      </Typography>
                      <IconButton size="small" color="error" onClick={() => setBanner(null)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Card>
                  )}
                </Stack>
              </Box>

              {/* Status and Order Number Row */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel id="sub-status-modal-label">Status</InputLabel>
                  <Select
                    labelId="sub-status-modal-label"
                    value={isActive ? 'Active' : 'Inactive'}
                    label="Status"
                    onChange={(e) => setIsActive(e.target.value === 'Active')}
                    sx={{ borderRadius: '12px' }}
                  >
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Order Number"
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  fullWidth
                  InputProps={{ sx: { borderRadius: '12px' } }}
                />
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 1 }}>
            <Button onClick={() => setOpenModal(false)} sx={{ textTransform: 'none', borderRadius: '10px' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                px: 3,
                py: 1,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)'
              }}
            >
              {submitting ? <CircularProgress size={24} color="inherit" /> : editingItem ? 'Update Subcategory' : 'Save Subcategory'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete this subcategory? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirmId(null)} sx={{ textTransform: 'none', borderRadius: '8px' }}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 700 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
