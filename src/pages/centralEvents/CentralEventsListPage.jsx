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
  Close as CloseIcon,
  Download as DownloadIcon,
  ContentCopy as ContentCopyIcon,
  OpenInNew as OpenInNewIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Payment as PaymentIcon,
  ContactMail as ContactMailIcon
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getCentralEvents, getAlaRegistrations, getEventTypes, getCategoriesByTypeCode, cancelCentralEvent, getAcademicYears, publishCentralEvent } from '../../api/centralEventsApi';
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

  // ALA Specific State & Helpers
  const [selectedAlaRecord, setSelectedAlaRecord] = useState(null);
  const isAlaView = selectedType === 'ALA';

  const handleCopy = (text, label = 'Content') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleExportAlaCsv = () => {
    if (!events.length) {
      toast.error('No ALA registration records to export');
      return;
    }
    const headers = [
      'Application ID', 'Participant Name', 'Salutation', 'Designation', 'Event Name',
      'Event Amount', 'Department', 'College Name', 'College Address', 'State',
      'Email', 'Contact No', 'WhatsApp No', 'WhatsApp Link', 'Payment Status',
      'UTR', 'Order ID', 'Payment ID', 'Created Date'
    ];
    const rows = events.map(e => [
      `"${e.applicationId || ''}"`,
      `"${(e.participantName || '').replace(/"/g, '""')}"`,
      `"${e.salutation || ''}"`,
      `"${e.designation || ''}"`,
      `"${(e.event_name || '').replace(/"/g, '""')}"`,
      `"${e.event_amount || e.amount || 0}"`,
      `"${(e.department || '').replace(/"/g, '""')}"`,
      `"${(e.collegeName || '').replace(/"/g, '""')}"`,
      `"${(e.collegeAddress || '').replace(/"/g, '""')}"`,
      `"${(e.state || '').replace(/"/g, '""')}"`,
      `"${e.email || ''}"`,
      `"${e.contactNo || ''}"`,
      `"${e.whatsappNo || ''}"`,
      `"${(e.whatsappLink || '').replace(/"/g, '""')}"`,
      `"${e.payment_status || ''}"`,
      `"${e.utr || ''}"`,
      `"${e.order_id || ''}"`,
      `"${e.payment_id || ''}"`,
      `"${e.createdAtDate || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ALA_Registrations_${selectedAcademicYear || 'All'}_${selectedLevel || 'All'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('ALA registrations exported to CSV');
  };

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

  // Reset page when any filter or search changes
  useEffect(() => {
    setPage(0);
  }, [selectedType, selectedCategory, selectedLevel, selectedActivityType, selectedMode, selectedStatus, selectedAcademicYear, searchQuery]);

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

      let res;
      if (selectedType === 'ALA') {
        res = await getAlaRegistrations(params);
      } else {
        res = await getCentralEvents(params);
      }

      if (res.success) {
        setEvents(res.data || []);
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

      {/* ALA Banner when ALA is selected */}
      {isAlaView && (
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.08) 0%, rgba(59, 130, 246, 0.04) 100%)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={800} color="primary.main">
              ALA Literary & Arts Festival Registrations
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Displaying all registration records from central_event_ala_registrations
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5} flexWrap="wrap" alignItems="center">
            <Chip
              label={`Total: ${events.length}`}
              color="primary"
              size="small"
              sx={{ fontWeight: 700, borderRadius: '8px' }}
            />
            <Chip
              label={`Students: ${events.filter(e => /student/i.test(e.designation)).length}`}
              color="info"
              size="small"
              sx={{ fontWeight: 700, borderRadius: '8px' }}
            />
            <Chip
              label={`Faculty / Professors: ${events.filter(e => !/student/i.test(e.designation)).length}`}
              color="secondary"
              size="small"
              sx={{ fontWeight: 700, borderRadius: '8px' }}
            />
            {selectedAcademicYear && (
              <Chip
                label={`AY: ${selectedAcademicYear}`}
                variant="outlined"
                size="small"
                sx={{ fontWeight: 600, borderRadius: '8px' }}
              />
            )}
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={handleExportAlaCsv}
              disabled={events.length === 0}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 700,
                background: 'var(--bg-paper)'
              }}
            >
              Export CSV
            </Button>
          </Stack>
        </Paper>
      )}

      {/* Events Tabular Table */}
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
          <TableContainer sx={{ overflowX: 'auto', width: '100%' }}>
            <Table sx={{ minWidth: isAlaView ? 1220 : 1000, tableLayout: 'auto' }}>
              <TableHead sx={{ backgroundColor: 'var(--bg-accent-1, #f8fafc)' }}>
                {isAlaView ? (
                  <TableRow>
                    <TableCell sx={{ width: 60, whiteSpace: 'nowrap' }}><strong>S.No</strong></TableCell>
                    <TableCell sx={{ width: 140, whiteSpace: 'nowrap' }}><strong>Application ID</strong></TableCell>
                    <TableCell sx={{ minWidth: 180, whiteSpace: 'nowrap' }}><strong>Participant & Designation</strong></TableCell>
                    <TableCell sx={{ minWidth: 170, whiteSpace: 'nowrap' }}><strong>Event Name</strong></TableCell>
                    <TableCell sx={{ minWidth: 220, whiteSpace: 'nowrap' }}><strong>Institution & Dept</strong></TableCell>
                    <TableCell sx={{ minWidth: 200, whiteSpace: 'nowrap' }}><strong>Contact Info</strong></TableCell>
                    <TableCell sx={{ minWidth: 110, whiteSpace: 'nowrap' }}><strong>Fee & Status</strong></TableCell>
                    <TableCell sx={{ minWidth: 120, whiteSpace: 'nowrap' }}><strong>Registration Date</strong></TableCell>
                    <TableCell align="right" sx={{ minWidth: 90, whiteSpace: 'nowrap' }}><strong>Actions</strong></TableCell>
                  </TableRow>
                ) : (
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
                )}
              </TableHead>
              <TableBody>
                {events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                      <Typography variant="body1" color="text.secondary" fontWeight={500}>
                        {isAlaView ? 'No ALA registrations found matching your criteria.' : 'No events found matching your criteria.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : isAlaView ? (
                  events.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item, index) => {
                    const isStudent = /student/i.test(item.designation);
                    return (
                      <TableRow key={item._id || index} hover>
                        <TableCell sx={{ width: 60, whiteSpace: 'nowrap' }}>
                          <Typography fontWeight={600} color="text.secondary">
                            {page * rowsPerPage + index + 1}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ width: 140, whiteSpace: 'nowrap' }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              color: 'primary.main',
                              cursor: 'pointer'
                            }}
                            onClick={() => setSelectedAlaRecord(item)}
                          >
                            {item.applicationId || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ minWidth: 180, maxWidth: 220 }}>
                          <Tooltip title={`${item.salutation ? `${item.salutation}. ` : ''}${item.participantName || ''}`} arrow>
                            <Typography
                              variant="body2"
                              fontWeight={700}
                              sx={{
                                cursor: 'pointer',
                                '&:hover': { color: 'primary.main', textDecoration: 'underline' },
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                              onClick={() => setSelectedAlaRecord(item)}
                            >
                              {item.salutation ? `${item.salutation}. ` : ''}{item.participantName || 'N/A'}
                            </Typography>
                          </Tooltip>
                          <Box sx={{ mt: 0.5 }}>
                            <Chip
                              label={item.designation || (isStudent ? 'Student' : 'Faculty')}
                              color={isStudent ? 'info' : 'secondary'}
                              size="small"
                              sx={{
                                fontWeight: 700,
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                height: 22
                              }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell sx={{ minWidth: 170, maxWidth: 220 }}>
                          <Tooltip title={item.event_name || 'ALA Event'} arrow>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                lineHeight: 1.35
                              }}
                            >
                              {item.event_name || 'ALA Event'}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell sx={{ minWidth: 220, maxWidth: 260 }}>
                          <Typography variant="body2" fontWeight={700} color="primary.main" noWrap>
                            {item.department || 'General'}
                          </Typography>
                          <Tooltip title={item.collegeName || 'N/A'} arrow>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                lineHeight: 1.35,
                                mt: 0.3,
                                wordBreak: 'break-word'
                              }}
                            >
                              {item.collegeName || 'N/A'}
                            </Typography>
                          </Tooltip>
                          {item.state && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
                              📍 {item.state}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ minWidth: 200, maxWidth: 230 }}>
                          <Tooltip title={item.email || 'N/A'} arrow>
                            <Typography
                              variant="body2"
                              sx={{
                                fontSize: '0.8rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'block'
                              }}
                            >
                              {item.email || 'N/A'}
                            </Typography>
                          </Tooltip>
                          {(item.contactNo || item.whatsappNo) && (
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.3 }}>
                              📞 {item.contactNo || item.whatsappNo}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ minWidth: 110, whiteSpace: 'nowrap' }}>
                          <Typography variant="body2" fontWeight={800} color="success.main">
                            ₹{item.event_amount || item.amount || 0}
                          </Typography>
                          <Chip
                            label={item.payment_status || 'Success'}
                            color={item.payment_status?.toLowerCase() === 'success' ? 'success' : 'default'}
                            size="small"
                            sx={{ borderRadius: '6px', height: 20, fontSize: '0.68rem', fontWeight: 700, mt: 0.3 }}
                          />
                          {item.utr && (
                            <Tooltip title={`UTR: ${item.utr}`} arrow>
                              <Typography
                                variant="caption"
                                display="block"
                                sx={{
                                  fontFamily: 'monospace',
                                  color: 'text.secondary',
                                  fontSize: '0.65rem',
                                  maxWidth: 105,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  mt: 0.2
                                }}
                              >
                                UTR: {item.utr}
                              </Typography>
                            </Tooltip>
                          )}
                        </TableCell>
                        <TableCell sx={{ minWidth: 120, whiteSpace: 'nowrap' }}>
                          <Typography variant="body2" fontWeight={600}>
                            {item.createdAtDate || (item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A')}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ minWidth: 90, whiteSpace: 'nowrap' }}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<VisibilityIcon />}
                            onClick={() => setSelectedAlaRecord(item)}
                            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
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
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
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
              No Coordinators Found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 450, mx: 'auto' }}>
              {coordinatorSearch
                ? `No coordinators matching "${coordinatorSearch}". Try clearing your search.`
                : 'No coordinators are currently assigned to events matching the selected filters.'}
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
                role={coord.designation || 'Faculty Coordinator'}
                employeeId={coord.empId}
                department={coord.department}
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

      {/* ALA Registration Details Dialog */}
      <Dialog
        open={Boolean(selectedAlaRecord)}
        onClose={() => setSelectedAlaRecord(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            p: 1,
            boxShadow: 'var(--shadow-premium-soft)'
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 1,
            borderBottom: '1px solid var(--border-color)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}
            >
              <EventIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={800}>
                ALA Registration Details
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Application #{selectedAlaRecord?.applicationId || 'N/A'}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setSelectedAlaRecord(null)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          {selectedAlaRecord && (
            <Grid container spacing={2.5}>
              {/* Participant Information */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" fontWeight={800} color="primary.main" sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Participant Information
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px' }}>
                  <Typography variant="caption" color="text.secondary" display="block">Full Name & Salutation</Typography>
                  <Typography variant="body1" fontWeight={700}>
                    {selectedAlaRecord.salutation ? `${selectedAlaRecord.salutation}. ` : ''}{selectedAlaRecord.participantName || 'N/A'}
                  </Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px' }}>
                  <Typography variant="caption" color="text.secondary" display="block">Designation</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={selectedAlaRecord.designation || 'N/A'}
                      color={/student/i.test(selectedAlaRecord.designation) ? 'info' : 'secondary'}
                      size="small"
                      sx={{ fontWeight: 700, borderRadius: '8px' }}
                    />
                  </Box>
                </Paper>
              </Grid>

              {/* Event & Academic Details */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" fontWeight={800} color="primary.main" sx={{ mt: 1, mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Event & Institution
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px' }}>
                  <Typography variant="caption" color="text.secondary" display="block">Event Name</Typography>
                  <Typography variant="body1" fontWeight={700}>{selectedAlaRecord.event_name || 'N/A'}</Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px' }}>
                  <Typography variant="caption" color="text.secondary" display="block">Department</Typography>
                  <Typography variant="body1" fontWeight={700}>{selectedAlaRecord.department || 'N/A'}</Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, sm: 8 }}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px' }}>
                  <Typography variant="caption" color="text.secondary" display="block">College Name & Address</Typography>
                  <Typography variant="body2" fontWeight={600}>{selectedAlaRecord.collegeName || 'N/A'}</Typography>
                  {selectedAlaRecord.collegeAddress && (
                    <Typography variant="caption" color="text.secondary" display="block">{selectedAlaRecord.collegeAddress}</Typography>
                  )}
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px' }}>
                  <Typography variant="caption" color="text.secondary" display="block">State</Typography>
                  <Typography variant="body1" fontWeight={700}>{selectedAlaRecord.state || 'N/A'}</Typography>
                </Paper>
              </Grid>

              {/* Contact Information */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" fontWeight={800} color="primary.main" sx={{ mt: 1, mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Contact Information
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Email Address</Typography>
                    <Typography variant="body2" fontWeight={700}>{selectedAlaRecord.email || 'N/A'}</Typography>
                  </Box>
                  {selectedAlaRecord.email && (
                    <IconButton size="small" onClick={() => handleCopy(selectedAlaRecord.email, 'Email')}>
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  )}
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Contact Number / WhatsApp</Typography>
                    <Typography variant="body2" fontWeight={700}>{selectedAlaRecord.contactNo || selectedAlaRecord.whatsappNo || 'N/A'}</Typography>
                  </Box>
                  {(selectedAlaRecord.contactNo || selectedAlaRecord.whatsappNo) && (
                    <IconButton size="small" onClick={() => handleCopy(selectedAlaRecord.contactNo || selectedAlaRecord.whatsappNo, 'Phone')}>
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  )}
                </Paper>
              </Grid>
              {selectedAlaRecord.whatsappLink && (
                <Grid size={{ xs: 12 }}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <Typography variant="caption" color="text.secondary" display="block">WhatsApp Group Link</Typography>
                      <Typography variant="body2" noWrap sx={{ color: 'primary.main', fontWeight: 600 }}>
                        {selectedAlaRecord.whatsappLink}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<OpenInNewIcon />}
                      onClick={() => window.open(selectedAlaRecord.whatsappLink.trim(), '_blank')}
                      sx={{ borderRadius: '8px', ml: 2, textTransform: 'none', flexShrink: 0 }}
                    >
                      Open Link
                    </Button>
                  </Paper>
                </Grid>
              )}

              {/* Payment & Transaction Information */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" fontWeight={800} color="primary.main" sx={{ mt: 1, mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Payment & Transaction Details
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px' }}>
                  <Typography variant="caption" color="text.secondary" display="block">Fee Amount</Typography>
                  <Typography variant="h6" fontWeight={800} color="success.main">
                    ₹{selectedAlaRecord.event_amount || selectedAlaRecord.amount || 0}
                  </Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px' }}>
                  <Typography variant="caption" color="text.secondary" display="block">Payment Status</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={selectedAlaRecord.payment_status || 'Success'}
                      color={selectedAlaRecord.payment_status?.toLowerCase() === 'success' ? 'success' : 'default'}
                      size="small"
                      sx={{ fontWeight: 700, borderRadius: '6px' }}
                    />
                  </Box>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">UTR Number</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                      {selectedAlaRecord.utr || 'N/A'}
                    </Typography>
                  </Box>
                  {selectedAlaRecord.utr && (
                    <IconButton size="small" onClick={() => handleCopy(selectedAlaRecord.utr, 'UTR')}>
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  )}
                </Paper>
              </Grid>
              {selectedAlaRecord.order_id && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px' }}>
                    <Typography variant="caption" color="text.secondary" display="block">Order ID</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{selectedAlaRecord.order_id}</Typography>
                  </Paper>
                </Grid>
              )}
              {selectedAlaRecord.payment_id && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px' }}>
                    <Typography variant="caption" color="text.secondary" display="block">Payment ID</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{selectedAlaRecord.payment_id}</Typography>
                  </Paper>
                </Grid>
              )}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px' }}>
                  <Typography variant="caption" color="text.secondary" display="block">Registration Date (createdAtDate)</Typography>
                  <Typography variant="body2" fontWeight={700}>{selectedAlaRecord.createdAtDate || 'N/A'}</Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px' }}>
                  <Typography variant="caption" color="text.secondary" display="block">Created Timestamp</Typography>
                  <Typography variant="body2">
                    {selectedAlaRecord.createdAt ? new Date(selectedAlaRecord.createdAt).toLocaleString() : 'N/A'}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid var(--border-color)' }}>
          <Button
            variant="contained"
            onClick={() => setSelectedAlaRecord(null)}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, px: 3 }}
          >
            Close
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
