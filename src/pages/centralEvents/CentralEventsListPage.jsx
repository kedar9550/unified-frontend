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
  FormControl,
  InputLabel,
  Select,
  Stack,
  Skeleton,
  InputAdornment,
  Divider,
  Paper
} from '@mui/material';
import {
  Search as SearchIcon,
  Event as EventIcon,
  Category as CategoryIcon,
  Folder as FolderIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getCentralEvents, getEventTypes, getCategoriesByTypeCode } from '../../api/centralEventsApi';
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

  // Filters
  const urlTypeCode = searchParams.get('typeCode') || '';
  const [selectedType, setSelectedType] = useState(urlTypeCode);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedActivityType, setSelectedActivityType] = useState('');
  const [selectedMode, setSelectedMode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Module Navigation Tabs
  const navTabs = [
    { key: 'all', label: 'All Central Events', icon: <EventIcon />, path: '/central-events' },
    { key: 'types', label: 'Event Types', icon: <CategoryIcon />, path: '/central-events/types' },
    { key: 'categories', label: 'Event Categories', icon: <FolderIcon />, path: '/central-events/categories' },
    ...(isGlobalAdmin ? [{ key: 'create', label: 'Create Event', icon: <AddIcon />, path: '/central-events/create' }] : [])
  ];

  useEffect(() => {
    setSelectedType(searchParams.get('typeCode') || '');
  }, [searchParams]);

  // Fetch Types on Mount
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await getEventTypes();
        if (res.success) setTypes(res.data);
      } catch (err) {
        console.error('Failed to load event types', err);
      }
    };
    fetchTypes();
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
      const params = { status: 'PUBLISHED' };
      if (selectedType) params.typeCode = selectedType;
      if (selectedCategory) params.categoryId = selectedCategory;
      if (selectedLevel) params.level = selectedLevel;
      if (selectedActivityType) params.activityType = selectedActivityType;
      if (selectedMode) params.mode = selectedMode;
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
  }, [selectedType, selectedCategory, selectedLevel, selectedActivityType, selectedMode]);

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

      {/* Module Navigation Custom Tabs */}
      <CustomTabs
        tabs={navTabs}
        value={0}
        onChange={(e, val) => navigate(navTabs[val].path)}
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
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <form onSubmit={handleSearchSubmit}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: '12px', background: 'var(--bg-paper)' }
                }}
              />
            </form>
          </Grid>

          <Grid size={{ xs: 6, sm: 3, md: 2.25 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="type-select-label">Event Type</InputLabel>
              <Select
                labelId="type-select-label"
                value={selectedType}
                label="Event Type"
                onChange={(e) => setSelectedType(e.target.value)}
                sx={{ borderRadius: '12px', background: 'var(--bg-paper)' }}
              >
                <MenuItem value="">All Types</MenuItem>
                {types.map((t) => (
                  <MenuItem key={t.code} value={t.code}>{t.name}</MenuItem>
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

          <Grid size={{ xs: 6, sm: 3, md: 2.25 }}>
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
        </Grid>
      </Paper>

      {/* Events Grid */}
      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={n}>
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: '16px' }} />
              <Skeleton height={30} sx={{ mt: 1 }} />
              <Skeleton height={20} width="60%" />
            </Grid>
          ))}
        </Grid>
      ) : events.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-paper)' }}>
          <Typography variant="h6" color="text.secondary">
            No events found matching your criteria.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {events.map((event) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={event._id}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '18px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-paper)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
                    borderColor: 'var(--color-primary)'
                  }
                }}
              >
                <CardMedia
                  component="img"
                  height="190"
                  image={event.banner?.url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60'}
                  alt={event.title}
                  sx={{ borderTopLeftRadius: '18px', borderTopRightRadius: '18px' }}
                />
                <CardContent sx={{ flexGrow: 1, p: 3, display: 'flex', flexDirection: 'column' }}>
                  <Stack direction="row" spacing={1} mb={1.5} flexWrap="wrap" gap={0.5}>
                    <Chip
                      label={event.typeCode}
                      color={TYPE_COLORS[event.typeCode] || 'default'}
                      size="small"
                      sx={{ fontWeight: 700, borderRadius: '8px' }}
                    />
                    {event.categoryName && (
                      <Chip label={event.categoryName} size="small" variant="outlined" sx={{ borderRadius: '8px' }} />
                    )}
                    {event.level && (
                      <Chip label={event.level} size="small" color="primary" variant="outlined" sx={{ borderRadius: '8px' }} />
                    )}
                  </Stack>

                  <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: 'var(--text-primary)', lineClamp: 2 }}>
                    {event.title}
                  </Typography>

                  {event.organizer?.name && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Organizer: <strong>{event.organizer.name}</strong>
                    </Typography>
                  )}

                  <Stack spacing={1} sx={{ color: 'text.secondary', fontSize: '0.875rem', my: 2 }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <EventIcon fontSize="small" color="primary" />
                      <span>{new Date(event.schedule?.fromDate).toLocaleDateString()}</span>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LocationIcon fontSize="small" color="primary" />
                      <span>{event.venue?.name || event.mode}</span>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <PeopleIcon fontSize="small" color="primary" />
                      <span>Capacity: {event.registrationCount} / {event.capacity} seats</span>
                    </Box>
                  </Stack>

                  <Divider sx={{ my: 1.5, mt: 'auto' }} />

                  <Box display="flex" justifyContent="space-between" alignItems="center" pt={1}>
                    <Typography variant="h6" color="primary.main" fontWeight={700}>
                      {event.fee?.amount === 0 ? 'FREE' : `₹${event.fee?.amount / 100}`}
                    </Typography>
                    <Button
                      variant="contained"
                      disableElevation
                      onClick={() => navigate(`/central-events/${event.slug}`)}
                      sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, px: 2.5 }}
                    >
                      View & Register
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </PageContainer>
  );
}
