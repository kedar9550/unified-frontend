import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  TextField,
  MenuItem,
  ListSubheader,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Skeleton,
  InputAdornment,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  Event as EventIcon,
  Category as CategoryIcon,
  Folder as FolderIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  Add as AddIcon,
  Public as PublicIcon,
  AccountBalance as AccountBalanceIcon,
  Visibility as VisibilityIcon,
  Image as ImageIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getCentralEvents, getEventTypes, getCategoriesByTypeCode, updateCentralEvent, cancelCentralEvent, uploadCentralEventFile, getAcademicYears } from '../../api/centralEventsApi';
import { PageHeader, CustomTabs } from '../../components/common';
import PageContainer from '../../components/common/design-system/PageContainer';
import { toast } from 'sonner';

const TYPE_COLORS = {
  VEDA: 'primary',
  COLORS: 'secondary',
  ALA: 'info',
  CLUB: 'warning',
  DEPARTMENTAL: 'success',
  UNIVERSITY: 'error'
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const getImageUrl = (img) => {
  if (!img) return '';
  const pathStr = typeof img === 'string' ? img : img.url;
  if (!pathStr) return '';
  if (pathStr.startsWith('http://') || pathStr.startsWith('https://') || pathStr.startsWith('blob:')) {
    return pathStr;
  }
  return `${BACKEND_URL}${pathStr.startsWith('/') ? '' : '/'}${pathStr}`;
};

export default function CentralEventsListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, activeRole } = useAuth();

  // Role check for GLOBAL_EVENT_ADMIN
  const userRoles = (user?.roles || []).map(r => (typeof r === 'string' ? r : (r.role?.key || r.role?.name || r.role || '')).toUpperCase());
  const isGlobalAdmin = userRoles.includes('GLOBAL_EVENT_ADMIN') || userRoles.includes('SUPER_ADMIN') || activeRole?.toUpperCase() === 'GLOBAL_EVENT_ADMIN';

  const [events, setEvents] = useState([]);
  const [types, setTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filters
  const urlTypeCode = searchParams.get('typeCode') || '';
  const [selectedType, setSelectedType] = useState(urlTypeCode);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedActivityType, setSelectedActivityType] = useState('');
  const [selectedMode, setSelectedMode] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Edit & Delete Dialog State
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    status: 'DRAFT',
    mode: 'OFFLINE',
    venueName: '',
    feeRupees: '0',
    capacity: '100',
    fromDate: '',
    toDate: '',
    regDeadline: '',
    participationType: 'SINGLE',
    minTeamSize: '1',
    maxTeamSize: '1',
    rulesText: '',
    outcomesText: '',
    inAssociationWithText: ''
  });

  const [editBanner, setEditBanner] = useState(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleOpenEdit = (event) => {
    setEditingEvent(event);
    setEditBanner(event.banner || null);
    setEditFormData({
      title: event.title || '',
      description: event.description || '',
      status: event.status || 'DRAFT',
      mode: event.mode || 'OFFLINE',
      venueName: event.venue?.name || '',
      feeRupees: event.fee?.amount !== undefined ? (event.fee.amount / 100).toString() : '0',
      capacity: event.capacity !== undefined ? event.capacity.toString() : '100',
      fromDate: event.schedule?.fromDate ? new Date(event.schedule.fromDate).toISOString().slice(0, 16) : '',
      toDate: event.schedule?.toDate ? new Date(event.schedule.toDate).toISOString().slice(0, 16) : '',
      regDeadline: event.schedule?.regDeadline ? new Date(event.schedule.regDeadline).toISOString().slice(0, 16) : '',
      participationType: event.participation?.type || 'SINGLE',
      minTeamSize: event.participation?.minTeamSize ? event.participation.minTeamSize.toString() : '1',
      maxTeamSize: event.participation?.maxTeamSize ? event.participation.maxTeamSize.toString() : '1',
      rulesText: (event.rules || []).join('\n'),
      outcomesText: (event.outcomes || []).join('\n'),
      inAssociationWithText: (event.inAssociationWith || []).join(', ')
    });
    setEditDialogOpen(true);
  };

  const handleEditBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const targetAy = editingEvent?.academicYear || selectedAcademicYear || '';
    setUploadingBanner(true);
    try {
      const res = await uploadCentralEventFile(file, { folderType: 'events', academicYear: targetAy });
      if (res.success) {
        setEditBanner(res.data);
        toast.success('Banner uploaded successfully');
      }
    } catch (err) {
      toast.error('Failed to upload banner');
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingEvent) return;
    setActionLoading(true);
    try {
      const parsedRules = editFormData.rulesText.split('\n').map((r) => r.trim()).filter(Boolean);
      const parsedOutcomes = editFormData.outcomesText.split('\n').map((o) => o.trim()).filter(Boolean);
      const parsedAssociation = editFormData.inAssociationWithText.split(',').map((a) => a.trim()).filter(Boolean);

      const payload = {
        title: editFormData.title,
        description: editFormData.description,
        status: editFormData.status,
        mode: editFormData.mode,
        venue: { name: editFormData.venueName },
        fee: { amount: Math.round(parseFloat(editFormData.feeRupees || 0) * 100), currency: 'INR' },
        capacity: parseInt(editFormData.capacity || 0, 10),
        participation: {
          type: editFormData.participationType,
          minTeamSize: parseInt(editFormData.minTeamSize || '1', 10),
          maxTeamSize: parseInt(editFormData.maxTeamSize || '1', 10)
        },
        rules: parsedRules,
        outcomes: parsedOutcomes,
        inAssociationWith: parsedAssociation,
        banner: editBanner
      };

      if (editFormData.fromDate && editFormData.toDate && editFormData.regDeadline) {
        payload.schedule = {
          fromDate: new Date(editFormData.fromDate).toISOString(),
          toDate: new Date(editFormData.toDate).toISOString(),
          regDeadline: new Date(editFormData.regDeadline).toISOString()
        };
      }

      const res = await updateCentralEvent(editingEvent._id, payload);
      if (res.success) {
        toast.success('Event updated successfully');
        setEditDialogOpen(false);
        setEditingEvent(null);
        fetchEvents();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update event');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDelete = (event) => {
    setDeletingEvent(event);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingEvent) return;
    setActionLoading(true);
    try {
      const res = await cancelCentralEvent(deletingEvent._id);
      if (res.success) {
        toast.success('Event cancelled / deleted successfully');
        setDeleteDialogOpen(false);
        setDeletingEvent(null);
        fetchEvents();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete event');
    } finally {
      setActionLoading(false);
    }
  };

  // Module Navigation Tabs
  const navTabs = [
    { key: 'all', label: 'All Central Events', icon: <EventIcon />, path: '/central-events' },
    { key: 'types', label: 'Event Types', icon: <CategoryIcon />, path: '/central-events/types' },
    { key: 'categories', label: 'Event Categories', icon: <FolderIcon />, path: '/central-events/categories' },
    { key: 'subcategories', label: 'Event Subcategories', icon: <FolderIcon />, path: '/central-events/subcategories' },
    ...(isGlobalAdmin ? [{ key: 'create', label: 'Create Event', icon: <AddIcon />, path: '/central-events/create' }] : [])
  ];

  useEffect(() => {
    setSelectedType(searchParams.get('typeCode') || '');
  }, [searchParams]);

  // Fetch Initial Data on Mount (Types and Academic Years)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [typesRes, ayRes] = await Promise.all([
          getEventTypes(),
          getAcademicYears()
        ]);
        if (typesRes.success) setTypes(typesRes.data);
        const ayList = ayRes?.years || ayRes?.data || [];
        if (Array.isArray(ayList)) {
          setAcademicYears(ayList);
          const activeAY = ayList.find(ay => ay.active)?.year || ayList[0]?.year || '';
          if (activeAY) {
            setSelectedAcademicYear(activeAY);
          }
        }
      } catch (err) {
        console.error('Failed to load initial data', err);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch Categories when Type changes
  useEffect(() => {
    if (!selectedType) {
      setCategories([]);
      setSelectedCategory('');
      return;
    }
    const fetchCats = async () => {
      try {
        const res = await getCategoriesByTypeCode(selectedType);
        if (res.success) setCategories(res.data);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    fetchCats();
  }, [selectedType]);

  // Fetch Events
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedType) params.typeCode = selectedType;
      if (selectedCategory) params.categoryId = selectedCategory;
      if (selectedLevel) params.level = selectedLevel;
      if (selectedActivityType) params.activityType = selectedActivityType;
      if (selectedMode) params.mode = selectedMode;
      if (selectedStatus) params.status = selectedStatus;
      if (selectedAcademicYear) params.academicYear = selectedAcademicYear;
      if (searchQuery) params.search = searchQuery;

      const res = await getCentralEvents(params);
      if (res.success) {
        setEvents(res.data);
      }
    } catch (err) {
      toast.error('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedType, selectedCategory, selectedLevel, selectedActivityType, selectedMode, selectedStatus, selectedAcademicYear]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEvents();
  };

  return (
    <PageContainer maxWidth="xl" px={3} py={3}>
      {/* Standard Page Header */}
      <PageHeader
        title="Central Events Hub"
        subtitle="Explore VEDA, COLORS, ALA, Club, Departmental & University Flagship Events"
        icon={<EventIcon />}
        actions={
          isGlobalAdmin && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/central-events/create')}
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
              Create Central Event
            </Button>
          )
        }
      />

      {/* Filter Bar with Standardized MUI Form Fields */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-glass)',
          backdropFilter: 'blur(10px)',
          boxShadow: 'var(--shadow-premium-soft)'
        }}
      >
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <form onSubmit={handleSearchSubmit}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: '12px', background: 'var(--bg-paper)' }
                  }
                }}
              />
            </form>
          </Grid>

          <Grid size={{ xs: 6, sm: 3, md: 2.5 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="type-select-label">Event Type & Scope</InputLabel>
              <Select
                labelId="type-select-label"
                value={selectedType}
                label="Event Type & Scope"
                onChange={(e) => setSelectedType(e.target.value)}
                sx={{ borderRadius: '12px', background: 'var(--bg-paper)' }}
              >
                <MenuItem value="">All Event Types</MenuItem>

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
          </Grid>

          <Grid size={{ xs: 6, sm: 3, md: 2.25 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="academic-year-select-label">Academic Year</InputLabel>
              <Select
                labelId="academic-year-select-label"
                value={selectedAcademicYear}
                label="Academic Year"
                onChange={(e) => setSelectedAcademicYear(e.target.value)}
                sx={{ borderRadius: '12px', background: 'var(--bg-paper)' }}
              >
                <MenuItem value="">All Academic Years</MenuItem>
                {academicYears.map((ay) => (
                  <MenuItem key={ay._id || ay.year} value={ay.year}>
                    {ay.year} {ay.active ? '(Active)' : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {categories.length > 0 && (
            <Grid size={{ xs: 6, sm: 3, md: 2.25 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="cat-select-label">Category</InputLabel>
                <Select
                  labelId="cat-select-label"
                  value={selectedCategory}
                  label="Category"
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  sx={{ borderRadius: '12px', background: 'var(--bg-paper)' }}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories.map((c) => (
                    <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          <Grid size={{ xs: 6, sm: 3, md: 2.25 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="level-select-label">Level</InputLabel>
              <Select
                labelId="level-select-label"
                value={selectedLevel}
                label="Level"
                onChange={(e) => setSelectedLevel(e.target.value)}
                sx={{ borderRadius: '12px', background: 'var(--bg-paper)' }}
              >
                <MenuItem value="">All Levels</MenuItem>
                <MenuItem value="STUDENT">Student</MenuItem>
                <MenuItem value="FACULTY">Faculty</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 6, sm: 3, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="mode-select-label">Mode</InputLabel>
              <Select
                labelId="mode-select-label"
                value={selectedMode}
                label="Mode"
                onChange={(e) => setSelectedMode(e.target.value)}
                sx={{ borderRadius: '12px', background: 'var(--bg-paper)' }}
              >
                <MenuItem value="">All Modes</MenuItem>
                <MenuItem value="OFFLINE">Offline</MenuItem>
                <MenuItem value="ONLINE">Online</MenuItem>
                <MenuItem value="HYBRID">Hybrid</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 6, sm: 3, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="status-select-label">Status</InputLabel>
              <Select
                labelId="status-select-label"
                value={selectedStatus}
                label="Status"
                onChange={(e) => setSelectedStatus(e.target.value)}
                sx={{ borderRadius: '12px', background: 'var(--bg-paper)' }}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="PUBLISHED">Published</MenuItem>
                <MenuItem value="DRAFT">Draft</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Events Tabular Table */}
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
                  <TableCell><strong>Event Title</strong></TableCell>
                  <TableCell><strong>Type</strong></TableCell>
                  <TableCell><strong>Category / Activity</strong></TableCell>
                  <TableCell><strong>Schedule & Location</strong></TableCell>
                  <TableCell><strong>Fee & Capacity</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                      <Typography variant="body1" color="text.secondary" fontWeight={500}>
                        No events found matching your criteria.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  events.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((event, index) => (
                    <TableRow key={event._id} hover>
                      <TableCell>
                        <Typography fontWeight={600} color="text.secondary">
                          {page * rowsPerPage + index + 1}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {event.banner?.url ? (
                          <img
                            src={getImageUrl(event.banner)}
                            alt={event.title}
                            style={{
                              width: 60,
                              height: 38,
                              objectFit: 'cover',
                              borderRadius: 8,
                              border: '1px solid var(--border-color)'
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: 60,
                              height: 38,
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
                      <TableCell sx={{ maxWidth: 260 }}>
                        <Typography
                          fontWeight={700}
                          color="primary.main"
                          sx={{
                            cursor: 'pointer',
                            '&:hover': { textDecoration: 'underline' }
                          }}
                          onClick={() => navigate(`/central-events/${event.slug}`)}
                        >
                          {event.title}
                        </Typography>
                        {event.organizer?.name && (
                          <Typography variant="caption" color="text.secondary" display="block" noWrap>
                            Org: {event.organizer.name}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={event.typeCode}
                          color={TYPE_COLORS[event.typeCode] || 'primary'}
                          size="small"
                          sx={{ fontWeight: 700, borderRadius: '8px' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {event.categoryName || event.activityType || 'General'}
                        </Typography>
                        {event.level && (
                          <Chip label={event.level} size="small" variant="outlined" sx={{ borderRadius: '6px', fontSize: '0.7rem', height: 20 }} />
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {new Date(event.schedule?.fromDate).toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {event.venue?.name || event.mode}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} color="success.main">
                          {event.fee?.amount === 0 ? 'FREE' : `₹${event.fee?.amount / 100}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {event.registrationCount} / {event.capacity} seats
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={event.status || 'PUBLISHED'}
                          color={event.status === 'PUBLISHED' ? 'success' : event.status === 'DRAFT' ? 'warning' : 'default'}
                          size="small"
                          sx={{ fontWeight: 600, borderRadius: '6px' }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                          <Tooltip title="View Event">
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<VisibilityIcon />}
                              onClick={() => navigate(`/central-events/${event.slug}`)}
                              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
                            >
                              View
                            </Button>
                          </Tooltip>

                          {isGlobalAdmin && (
                            <>
                              <Tooltip title="Edit Event">
                                <IconButton
                                  size="small"
                                  color="info"
                                  onClick={() => handleOpenEdit(event)}
                                  sx={{ border: '1px solid var(--border-color)', borderRadius: '10px' }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="Delete Event">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleOpenDelete(event)}
                                  sx={{ border: '1px solid var(--border-color)', borderRadius: '10px' }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={events.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </Paper>
      )}

      {/* Edit Event Modal */}
      <Dialog
        open={editDialogOpen}
        onClose={() => !actionLoading && setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '18px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          Edit Central Event
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2.5} sx={{ pt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Event Title"
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                slotProps={{ input: { sx: { borderRadius: '12px' } } }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                slotProps={{ input: { sx: { borderRadius: '12px' } } }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="edit-status-label">Status</InputLabel>
                <Select
                  labelId="edit-status-label"
                  value={editFormData.status}
                  label="Status"
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  sx={{ borderRadius: '12px' }}
                >
                  <MenuItem value="DRAFT">Draft</MenuItem>
                  <MenuItem value="PUBLISHED">Published</MenuItem>
                  <MenuItem value="CANCELLED">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="edit-mode-label">Mode</InputLabel>
                <Select
                  labelId="edit-mode-label"
                  value={editFormData.mode}
                  label="Mode"
                  onChange={(e) => setEditFormData({ ...editFormData, mode: e.target.value })}
                  sx={{ borderRadius: '12px' }}
                >
                  <MenuItem value="OFFLINE">Offline</MenuItem>
                  <MenuItem value="ONLINE">Online</MenuItem>
                  <MenuItem value="HYBRID">Hybrid</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Venue Name"
                value={editFormData.venueName}
                onChange={(e) => setEditFormData({ ...editFormData, venueName: e.target.value })}
                slotProps={{ input: { sx: { borderRadius: '12px' } } }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Fee (₹)"
                value={editFormData.feeRupees}
                onChange={(e) => setEditFormData({ ...editFormData, feeRupees: e.target.value })}
                slotProps={{ input: { sx: { borderRadius: '12px' } } }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Capacity"
                value={editFormData.capacity}
                onChange={(e) => setEditFormData({ ...editFormData, capacity: e.target.value })}
                slotProps={{ input: { sx: { borderRadius: '12px' } } }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                type="datetime-local"
                label="Start Date & Time"
                value={editFormData.fromDate}
                onChange={(e) => setEditFormData({ ...editFormData, fromDate: e.target.value })}
                slotProps={{
                  inputLabel: { shrink: true },
                  input: { sx: { borderRadius: '12px' } }
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                type="datetime-local"
                label="End Date & Time"
                value={editFormData.toDate}
                onChange={(e) => setEditFormData({ ...editFormData, toDate: e.target.value })}
                slotProps={{
                  inputLabel: { shrink: true },
                  input: { sx: { borderRadius: '12px' } }
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                type="datetime-local"
                label="Reg Deadline"
                value={editFormData.regDeadline}
                onChange={(e) => setEditFormData({ ...editFormData, regDeadline: e.target.value })}
                slotProps={{
                  inputLabel: { shrink: true },
                  input: { sx: { borderRadius: '12px' } }
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: editFormData.participationType === 'TEAM' ? 4 : 12 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="edit-participation-label">Participation Type</InputLabel>
                <Select
                  labelId="edit-participation-label"
                  value={editFormData.participationType}
                  label="Participation Type"
                  onChange={(e) => setEditFormData({ ...editFormData, participationType: e.target.value })}
                  sx={{ borderRadius: '12px' }}
                >
                  <MenuItem value="SINGLE">Individual Only</MenuItem>
                  <MenuItem value="TEAM">Team Participation</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {editFormData.participationType === 'TEAM' && (
              <>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Min Team Size"
                    value={editFormData.minTeamSize}
                    onChange={(e) => setEditFormData({ ...editFormData, minTeamSize: e.target.value })}
                    slotProps={{ input: { sx: { borderRadius: '12px' } } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Max Team Size"
                    value={editFormData.maxTeamSize}
                    onChange={(e) => setEditFormData({ ...editFormData, maxTeamSize: e.target.value })}
                    slotProps={{ input: { sx: { borderRadius: '12px' } } }}
                  />
                </Grid>
              </>
            )}

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size="small"
                label="In Association With / Collaborators"
                placeholder="e.g. IEEE Student Branch, CSI Chapter (comma separated)"
                value={editFormData.inAssociationWithText}
                onChange={(e) => setEditFormData({ ...editFormData, inAssociationWithText: e.target.value })}
                slotProps={{ input: { sx: { borderRadius: '12px' } } }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Rules & Guidelines"
                placeholder="Enter each rule on a new line"
                value={editFormData.rulesText}
                onChange={(e) => setEditFormData({ ...editFormData, rulesText: e.target.value })}
                slotProps={{ input: { sx: { borderRadius: '12px' } } }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Key Outcomes"
                placeholder="Enter each outcome on a new line"
                value={editFormData.outcomesText}
                onChange={(e) => setEditFormData({ ...editFormData, outcomesText: e.target.value })}
                slotProps={{ input: { sx: { borderRadius: '12px' } } }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mt: 1 }}>
                Event Banner Image
              </Typography>

              <Box display="flex" alignItems="center" gap={3} flexWrap="wrap">
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadIcon />}
                  disabled={uploadingBanner}
                  sx={{ borderRadius: '12px', px: 3, py: 1, textTransform: 'none', fontWeight: 600 }}
                >
                  {uploadingBanner ? 'Uploading...' : 'Upload Banner'}
                  <input type="file" hidden accept="image/*" onChange={handleEditBannerUpload} />
                </Button>

                {editBanner?.url && (
                  <Card variant="outlined" sx={{ display: 'flex', alignItems: 'center', p: 1, borderRadius: '12px' }}>
                    <img
                      src={getImageUrl(editBanner)}
                      alt="Banner Preview"
                      style={{ width: 90, height: 50, objectFit: 'cover', borderRadius: 8, marginRight: 12 }}
                    />
                    <Box mr={2}>
                      <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 180 }}>
                        {editBanner.name || 'Banner Image'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Uploaded
                      </Typography>
                    </Box>
                    <IconButton color="error" size="small" onClick={() => setEditBanner(null)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Card>
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setEditDialogOpen(false)}
            disabled={actionLoading}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveEdit}
            disabled={actionLoading}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, px: 3 }}
          >
            {actionLoading ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Event Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !actionLoading && setDeleteDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: '18px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>
          Confirm Delete Event
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to permanently delete event <strong>"{deletingEvent?.title}"</strong>?
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            This action cannot be undone. All associated data will be removed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={actionLoading}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={actionLoading}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, px: 3 }}
          >
            {actionLoading ? <CircularProgress size={20} color="inherit" /> : 'Delete Event'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
