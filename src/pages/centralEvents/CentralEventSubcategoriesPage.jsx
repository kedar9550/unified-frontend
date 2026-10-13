import React, { useState, useEffect, useMemo } from 'react';
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
  InputAdornment,
  Card,
  Avatar,
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
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  FormatListBulleted as FormatListBulletedIcon,
  People as PeopleIcon,
  Search as SearchIcon,
  Close as CloseIcon
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
import API from '../../api/axios';
import { PageHeader, CustomTabs, ProfileCard } from '../../components/common';
import PageContainer from '../../components/common/design-system/PageContainer';
import { toast } from 'sonner';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9022';

const getImageUrl = (img) => {
  if (!img) return '';
  const pathStr = typeof img === 'string' ? img : img.url;
  if (!pathStr) return '';
  return pathStr.startsWith('http') ? pathStr : `${BACKEND_URL}${pathStr.startsWith('/') ? '' : '/'}${pathStr}`;
};

const CAMPUS_PHOTO_BASES = [
  'https://info.aec.edu.in/aus/employeephotos',
  'https://info.aec.edu.in/aec/employeephotos',
  'https://info.aec.edu.in/acet/employeephotos',
  'https://info.aec.edu.in/acoe/employeephotos',
];

function CoordinatorPhoto({ employeeCode, photoUrl, name, sx }) {
  const initials = (name || '').split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase() || 'FC';
  const placeholderSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><rect width='100%' height='100%' fill='%231e40af'/><text x='50%' y='50%' dy='.35em' text-anchor='middle' font-family='Inter, Arial, Helvetica, sans-serif' font-size='46' fill='%23ffffff'>${initials}</text></svg>`;
  const placeholderDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(placeholderSvg)}`;

  const initialUrl = photoUrl || (employeeCode ? `${CAMPUS_PHOTO_BASES[0]}/${employeeCode}.jpg` : placeholderDataUrl);
  const [attemptIndex, setAttemptIndex] = useState(photoUrl ? -1 : 0);
  const [imgSrc, setImgSrc] = useState(initialUrl);

  useEffect(() => {
    setAttemptIndex(photoUrl ? -1 : 0);
    setImgSrc(photoUrl || (employeeCode ? `${CAMPUS_PHOTO_BASES[0]}/${employeeCode}.jpg` : placeholderDataUrl));
  }, [employeeCode, photoUrl]);

  const handleError = () => {
    const nextIndex = attemptIndex + 1;
    if (nextIndex < CAMPUS_PHOTO_BASES.length) {
      setAttemptIndex(nextIndex);
      setImgSrc(`${CAMPUS_PHOTO_BASES[nextIndex]}/${employeeCode}.jpg`);
    } else {
      setImgSrc(placeholderDataUrl);
    }
  };

  return (
    <Box
      component="img"
      src={imgSrc}
      alt={`Photo of ${name || 'Coordinator'}`}
      sx={{ ...sx, objectFit: 'cover' }}
      onError={handleError}
    />
  );
}

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

  // View Tabs: 0 = List, 1 = Coordinators
  const [activeTab, setActiveTab] = useState(0);
  const [coordinatorSearch, setCoordinatorSearch] = useState('');

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

  // Multi-Coordinator Search State
  const [selectedCoordinators, setSelectedCoordinators] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

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
    setSelectedCoordinators([]);
    setSearchQuery('');
    setEmployeeOptions([]);
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

    const coords = item.coordinators?.length > 0
      ? item.coordinators
      : (item.coordinator?.empId || item.coordinator?.name ? [item.coordinator] : []);

    setSelectedCoordinators(coords);
    setEmployeeOptions(coords);
    setSearchQuery('');
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
        banner,
        coordinators: selectedCoordinators,
        coordinator: selectedCoordinators[0] || null
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

  // Extract and deduplicate coordinators from subcategories
  const coordinatorsList = useMemo(() => {
    const coordsMap = new Map();

    subcategories.forEach((sub) => {
      const list = Array.isArray(sub.coordinators) && sub.coordinators.length > 0
        ? sub.coordinators
        : (sub.coordinator?.name || sub.coordinator?.empId ? [sub.coordinator] : []);

      list.forEach((c) => {
        const id = c.empId || c.employeeId || c.institutionId;
        if (!id) return;

        if (!coordsMap.has(id)) {
          coordsMap.set(id, {
            id,
            empId: id,
            name: c.name || 'Coordinator',
            designation: c.designation || 'Coordinator',
            department: typeof c.department === 'object' ? (c.department?.name || c.department?.code || '') : (c.department || ''),
            phone: c.phone || c.mobile || 'N/A',
            email: c.email || '',
            photoUrl: c.photoUrl || c.profileImage || null,
            subcategories: []
          });
        }

        const entry = coordsMap.get(id);
        const subLabel = sub.name || '';
        if (subLabel && !entry.subcategories.includes(subLabel)) {
          entry.subcategories.push(subLabel);
        }
        if ((!entry.phone || entry.phone === 'N/A') && (c.phone || c.mobile)) {
          entry.phone = c.phone || c.mobile;
        }
        if (!entry.photoUrl && (c.photoUrl || c.profileImage)) {
          entry.photoUrl = c.photoUrl || c.profileImage;
        }
      });
    });

    return Array.from(coordsMap.values());
  }, [subcategories]);

  const filteredCoordinators = useMemo(() => {
    if (!coordinatorSearch.trim()) return coordinatorsList;
    const q = coordinatorSearch.trim().toLowerCase();
    return coordinatorsList.filter((c) =>
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.empId && c.empId.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.subcategories && c.subcategories.some((sub) => sub.toLowerCase().includes(q)))
    );
  }, [coordinatorsList, coordinatorSearch]);

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

      {/* View Mode Tabs: List and Coordinators */}
      <CustomTabs
        value={activeTab}
        onChange={(e, val) => setActiveTab(val)}
        tabs={[
          { label: 'List', icon: <FormatListBulletedIcon /> },
          { label: 'Coordinators', icon: <PeopleIcon /> }
        ]}
        sx={{ my: 3 }}
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

        {activeTab === 1 && (
          <TextField
            size="small"
            placeholder="Search coordinator by name, ID, or subcategory..."
            value={coordinatorSearch}
            onChange={(e) => setCoordinatorSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: coordinatorSearch ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setCoordinatorSearch('')}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null
            }}
            sx={{
              minWidth: 280,
              maxWidth: 400,
              flex: { xs: '1 1 100%', md: 'none' },
              ml: { xs: 0, md: 'auto' },
              '& .MuiOutlinedInput-root': { borderRadius: '12px', backgroundColor: 'var(--bg-paper)' }
            }}
          />
        )}
      </Paper>

      {/* Content Section */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : activeTab === 0 ? (
        /* List Tab: Subcategories Table Section */
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
                  <TableCell><strong>Subcategory Coordinators</strong></TableCell>
                  <TableCell><strong>Sort Order</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {subcategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
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
                              justifyContent: 'center'
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
                      <TableCell>
                        {(() => {
                          const coordsList = row.coordinators?.length > 0
                            ? row.coordinators
                            : (row.coordinator?.name ? [row.coordinator] : []);

                          if (coordsList.length === 0) {
                            return (
                              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                Unassigned
                              </Typography>
                            );
                          }

                          return (
                            <Stack spacing={0.6}>
                              {coordsList.map((c, idx) => (
                                <Box key={idx} display="flex" alignItems="center" gap={1}>
                                  <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: '#2563eb', fontWeight: 700 }}>
                                    {(c.name || 'C').charAt(0)}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="body2" fontWeight={600} lineHeight={1.2}>
                                      {c.name}
                                    </Typography>
                                    {(c.empId || c.department) && (
                                      <Typography variant="caption" color="text.secondary" display="block">
                                        {c.empId ? `(${c.empId})` : ''} {c.department ? `• ${c.department}` : ''}
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                              ))}
                            </Stack>
                          );
                        })()}
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
      ) : (
        /* Coordinators Tab: ProfileCards Grid */
        filteredCoordinators.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              py: 8,
              px: 3,
              textAlign: 'center',
              borderRadius: '20px',
              border: '1px dashed var(--border-color)',
              bgcolor: 'var(--bg-paper)'
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: 'var(--bg-accent-2, #f1f5f9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
                color: 'text.secondary'
              }}
            >
              <PeopleIcon sx={{ fontSize: 32 }} />
            </Box>
            <Typography variant="h6" fontWeight={700} color="text.primary" gutterBottom>
              No Subcategory Coordinators Found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 450, mx: 'auto' }}>
              {coordinatorSearch
                ? `No coordinators matching "${coordinatorSearch}". Try clearing your search.`
                : 'No coordinators are currently assigned to subcategories matching the selected filters.'}
            </Typography>
          </Paper>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)'
              },
              gap: 3
            }}
          >
            {filteredCoordinators.map((coord) => (
              <ProfileCard
                key={coord.id}
                name={coord.name}
                role="Coordinator"
                employeeId={coord.empId}
                phone={coord.phone}
                labels={coord.subcategories}
                avatarComponent={
                  <CoordinatorPhoto
                    employeeCode={coord.empId}
                    photoUrl={coord.photoUrl}
                    name={coord.name}
                    sx={{
                      width: 110,
                      height: 110,
                      border: '2px solid #fff',
                      borderRadius: '50%'
                    }}
                  />
                }
              />
            ))}
          </Box>
        )
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

              {/* Subcategory Coordinators (Employee Search) */}
              <Box sx={{ width: '100%' }}>
                <Typography
                  variant="subtitle2"
                  fontWeight="600"
                  mb={1}
                  sx={{ color: 'text.primary', display: 'flex', alignItems: 'center', gap: 0.8 }}
                >
                  <PersonIcon fontSize="small" color="primary" /> Subcategory Coordinators (Employees)
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
                  noOptionsText={searchQuery ? 'No coordinator found' : 'Search employee by name or ID (min 2 chars)'}
                  renderInput={(params) => {
                    const inputProps = params.InputProps || {};
                    return (
                      <TextField
                        {...params}
                        fullWidth
                        placeholder={selectedCoordinators.length === 0 ? "Search employee by name or ID..." : "Add another coordinator..."}
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
                        avatar={
                          <Avatar sx={{ bgcolor: 'primary.main', color: '#fff', fontSize: '0.75rem' }}>
                            {(option.name || 'C')[0]?.toUpperCase()}
                          </Avatar>
                        }
                        label={`${option.name || 'Coordinator'} ${option.empId ? `(${option.empId})` : ''}`}
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
