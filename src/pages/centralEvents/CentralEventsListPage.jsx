import React, { useState, useEffect, useMemo } from 'react';
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
  Tooltip,
  Avatar
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
  Upload as UploadIcon,
  FormatListBulleted as FormatListBulletedIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getCentralEvents, getEventTypes, getCategoriesByTypeCode, cancelCentralEvent, getAcademicYears, publishCentralEvent } from '../../api/centralEventsApi';
import { fetchEventDepartments } from '../../api/eventDepartmentApi';
import { PageHeader, CustomTabs, ProfileCard } from '../../components/common';
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

const isMongoId = (val) => {
  if (!val) return false;
  return /^[0-9a-fA-F]{24}$/.test(String(val).trim());
};

const getImageUrl = (img) => {
  if (!img) return '';
  const pathStr = typeof img === 'string' ? img : img.url;
  if (!pathStr) return '';
  if (pathStr.startsWith('http://') || pathStr.startsWith('https://') || pathStr.startsWith('blob:')) {
    return pathStr;
  }
  return `${BACKEND_URL}${pathStr.startsWith('/') ? '' : '/'}${pathStr}`;
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
  const [departmentsMap, setDepartmentsMap] = useState({});

  // View Tabs: 0 = List, 1 = Coordinators
  const [activeTab, setActiveTab] = useState(0);
  const [coordinatorSearch, setCoordinatorSearch] = useState('');

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

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleOpenEdit = (event) => {
    navigate(`/central-events/edit/${event.slug || event._id}`);
  };

  const handleOpenDelete = (event) => {
    setDeletingEvent(event);
    setDeleteDialogOpen(true);
  };

  const [publishingId, setPublishingId] = useState(null);

  const handlePublishEvent = async (event) => {
    const eventId = event._id || event.id;
    if (!eventId) return;
    setPublishingId(eventId);
    try {
      const res = await publishCentralEvent(eventId);
      if (res.success) {
        toast.success(`Event "${event.title}" published successfully!`);
        fetchEvents();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish event');
    } finally {
      setPublishingId(null);
    }
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

  useEffect(() => {
    setSelectedType(searchParams.get('typeCode') || '');
  }, [searchParams]);

  // Fetch Initial Data on Mount (Types, Academic Years, Departments)
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

  // Fetch Departments for human-readable labels
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const res = await fetchEventDepartments();
        const depts = res?.data?.data || res?.data || [];
        if (Array.isArray(depts)) {
          const map = {};
          depts.forEach((d) => {
            if (d._id) {
              map[String(d._id)] = d.name || d.code || '';
            }
          });
          setDepartmentsMap(map);
        }
      } catch (err) {
        console.error('Failed to load departments', err);
      }
    };
    loadDepartments();
  }, []);

  const formatDepartment = (dept) => {
    if (!dept) return '';
    if (typeof dept === 'object') {
      const val = dept.name || dept.code || '';
      return isMongoId(val) ? '' : val;
    }
    const str = String(dept).trim();
    if (departmentsMap[str]) {
      const mapped = departmentsMap[str];
      return isMongoId(mapped) ? '' : mapped;
    }
    if (isMongoId(str)) return '';
    return str;
  };

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
      const params = { limit: 100 };
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

  // Extract and deduplicate faculty coordinators from events
  const coordinatorsList = useMemo(() => {
    const coordsMap = new Map();

    events.forEach((event) => {
      const list = Array.isArray(event.coordinators?.faculty) && event.coordinators.faculty.length > 0
        ? event.coordinators.faculty
        : (event.facultyCoordinators?.length > 0
            ? event.facultyCoordinators
            : (event.facultyCoordinator?.employeeId || event.facultyCoordinator?.name
                ? [{
                    name: event.facultyCoordinator.employeeName || event.facultyCoordinator.name,
                    empId: event.facultyCoordinator.employeeId || event.facultyCoordinator.empId,
                    designation: event.facultyCoordinator.designation,
                    department: event.facultyCoordinator.department,
                    phone: event.facultyCoordinator.phone,
                    email: event.facultyCoordinator.email
                  }]
                : []));

      list.forEach((c) => {
        const id = c.empId || c.employeeId || c.institutionId || c.name;
        if (!id) return;

        if (!coordsMap.has(id)) {
          coordsMap.set(id, {
            id,
            empId: (c.empId && !isMongoId(c.empId)) ? c.empId : '',
            name: c.name || c.employeeName || 'Coordinator',
            designation: c.designation || 'Faculty Coordinator',
            department: formatDepartment(c.department),
            phone: c.phone || c.mobile || 'N/A',
            email: c.email || '',
            photoUrl: c.photoUrl || c.profileImage || null,
            events: []
          });
        }

        const entry = coordsMap.get(id);
        const eventLabel = event.title || '';
        if (eventLabel && !entry.events.includes(eventLabel)) {
          entry.events.push(eventLabel);
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
  }, [events, departmentsMap]);

  const filteredCoordinators = useMemo(() => {
    if (!coordinatorSearch.trim()) return coordinatorsList;
    const q = coordinatorSearch.trim().toLowerCase();
    return coordinatorsList.filter((c) =>
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.empId && c.empId.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.events && c.events.some((ev) => ev.toLowerCase().includes(q)))
    );
  }, [coordinatorsList, coordinatorSearch]);

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
            {activeTab === 1 ? (
              <TextField
                fullWidth
                size="small"
                placeholder="Search coordinator by name, ID, or event..."
                value={coordinatorSearch}
                onChange={(e) => setCoordinatorSearch(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: coordinatorSearch ? (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setCoordinatorSearch('')}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                    sx: { borderRadius: '12px', background: 'var(--bg-paper)' }
                  }
                }}
              />
            ) : (
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
                      endAdornment: searchQuery ? (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => { setSearchQuery(''); fetchEvents(); }}>
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ) : null,
                      sx: { borderRadius: '12px', background: 'var(--bg-paper)' }
                    }
                  }}
                />
              </form>
            )}
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

      {/* Events / Coordinators View */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : activeTab === 0 ? (
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
                  <TableCell><strong>Faculty Coordinators</strong></TableCell>
                  <TableCell><strong>Schedule & Location</strong></TableCell>
                  <TableCell><strong>Fee & Capacity</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
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
                        {event.subcategoryName && (
                          <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600, display: 'block' }}>
                            ↳ {event.subcategoryName}
                          </Typography>
                        )}
                        {event.level && (
                          <Chip label={event.level} size="small" variant="outlined" sx={{ borderRadius: '6px', fontSize: '0.7rem', height: 20 }} />
                        )}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const coordsList = Array.isArray(event.coordinators?.faculty) && event.coordinators.faculty.length > 0
                            ? event.coordinators.faculty
                            : (event.facultyCoordinators?.length > 0
                                ? event.facultyCoordinators
                                : (event.facultyCoordinator?.employeeId || event.facultyCoordinator?.name
                                    ? [{
                                        name: event.facultyCoordinator.employeeName || event.facultyCoordinator.name,
                                        empId: event.facultyCoordinator.employeeId || event.facultyCoordinator.empId,
                                        department: event.facultyCoordinator.department
                                      }]
                                    : []));

                          if (coordsList.length === 0) {
                            return (
                              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                Unassigned
                              </Typography>
                            );
                          }

                          return (
                            <Stack spacing={0.6}>
                              {coordsList.map((c, idx) => {
                                const empCode = c.empId && !isMongoId(c.empId) ? `(${c.empId})` : '';
                                const dept = formatDepartment(c.department);
                                const hasSubtitle = Boolean(empCode || dept);

                                return (
                                  <Box key={idx} display="flex" alignItems="center" gap={1}>
                                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: '#2563eb', fontWeight: 700 }}>
                                      {(c.name || c.employeeName || 'C').charAt(0)}
                                    </Avatar>
                                    <Box>
                                      <Typography variant="body2" fontWeight={600} lineHeight={1.2}>
                                        {c.name || c.employeeName}
                                      </Typography>
                                      {hasSubtitle && (
                                        <Typography variant="caption" color="text.secondary" display="block">
                                          {empCode} {empCode && dept ? `• ${dept}` : dept}
                                        </Typography>
                                      )}
                                    </Box>
                                  </Box>
                                );
                              })}
                            </Stack>
                          );
                        })()}
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
                        <Tooltip title={event.status === 'DRAFT' && isGlobalAdmin ? "Click to publish this event" : ""}>
                          <Chip
                            label={event.status || 'PUBLISHED'}
                            color={event.status === 'PUBLISHED' ? 'success' : event.status === 'DRAFT' ? 'warning' : 'default'}
                            size="small"
                            onClick={event.status === 'DRAFT' && isGlobalAdmin ? () => handlePublishEvent(event) : undefined}
                            sx={{
                              fontWeight: 600,
                              borderRadius: '6px',
                              cursor: event.status === 'DRAFT' && isGlobalAdmin ? 'pointer' : 'default'
                            }}
                          />
                        </Tooltip>
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
                              {event.status === 'DRAFT' && (
                                <Tooltip title="Publish Event">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    disabled={publishingId === (event._id || event.id)}
                                    onClick={() => handlePublishEvent(event)}
                                    sx={{
                                      border: '1px solid #10b981',
                                      borderRadius: '10px',
                                      bgcolor: 'rgba(16, 185, 129, 0.08)',
                                      '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.2)' }
                                    }}
                                  >
                                    {publishingId === (event._id || event.id) ? (
                                      <CircularProgress size={16} color="success" />
                                    ) : (
                                      <PublicIcon fontSize="small" />
                                    )}
                                  </IconButton>
                                </Tooltip>
                              )}

                              <Tooltip title="Edit Event">
                                <IconButton
                                  size="small"
                                  color="info"
                                  onClick={() => navigate(`/central-events/edit/${event.slug || event._id}`)}
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
              No Faculty Coordinators Found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 450, mx: 'auto' }}>
              {coordinatorSearch
                ? `No coordinators matching "${coordinatorSearch}". Try clearing your search.`
                : 'No faculty coordinators are currently assigned to events matching the selected filters.'}
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
                role="Faculty Coordinator"
                employeeId={coord.empId}
                phone={coord.phone}
                labels={coord.events}
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
