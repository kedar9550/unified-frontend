import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
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
  LocationOn as LocationIcon,
  People as PeopleIcon,
  Add as AddIcon,
  FilterAlt as FilterIcon,
  ConfirmationNumber as TicketIcon
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getCentralEvents, getEventTypes, getCategoriesByTypeCode } from '../../api/centralEventsApi';
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

  // Filters (sync typeCode from URL if present)
  const urlTypeCode = searchParams.get('typeCode') || '';
  const [selectedType, setSelectedType] = useState(urlTypeCode);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedActivityType, setSelectedActivityType] = useState('');
  const [selectedMode, setSelectedMode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Update selectedType when URL query param changes
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
      const params = {
        status: 'PUBLISHED'
      };
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
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header Banner */}
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
          <Typography variant="h3" fontWeight={700} gutterBottom>
            Central Events Hub
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            Explore VEDA, COLORS, ALA, Club, Departmental & University Flagship Events
          </Typography>
        </Box>
        {isGlobalAdmin && (
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<AddIcon />}
              onClick={() => navigate('/central-events/create')}
              sx={{ borderRadius: 2, textTransform: 'none', px: 3, fontWeight: 600 }}
            >
              Create Central Event
            </Button>
          </Stack>
        )}

      </Paper>

      {/* Filter Bar */}
      <Paper elevation={1} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
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
                  )
                }}
              />
            </form>
          </Grid>

          <Grid item xs={6} sm={3} md={2}>
            <FormControl fullWidth size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Event Type</InputLabel>
              <Select
                value={selectedType}
                label="Event Type"
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <MenuItem value="">All Types</MenuItem>
                {types.map((t) => (
                  <MenuItem key={t.code} value={t.code}>{t.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {categories.length > 0 && (
            <Grid item xs={6} sm={3} md={2}>
              <FormControl fullWidth size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  label="Category"
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories.map((c) => (
                    <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          <Grid item xs={6} sm={3} md={2}>
            <FormControl fullWidth size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Level</InputLabel>
              <Select
                value={selectedLevel}
                label="Level"
                onChange={(e) => setSelectedLevel(e.target.value)}
              >
                <MenuItem value="">All Levels</MenuItem>
                <MenuItem value="STUDENT">Student</MenuItem>
                <MenuItem value="FACULTY">Faculty</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} sm={3} md={2}>
            <FormControl fullWidth size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Mode</InputLabel>
              <Select
                value={selectedMode}
                label="Mode"
                onChange={(e) => setSelectedMode(e.target.value)}
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
            <Grid item xs={12} sm={6} md={4} key={n}>
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
              <Skeleton height={30} sx={{ mt: 1 }} />
              <Skeleton height={20} width="60%" />
            </Grid>
          ))}
        </Grid>
      ) : events.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="h6" color="text.secondary">
            No events found matching your criteria.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {events.map((event) => (
            <Grid item xs={12} sm={6} md={4} key={event._id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 3,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6
                  }
                }}
              >
                <CardMedia
                  component="img"
                  height="180"
                  image={event.banner?.url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60'}
                  alt={event.title}
                />
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Stack direction="row" spacing={1} mb={1.5} flexWrap="wrap">
                    <Chip
                      label={event.typeCode}
                      color={TYPE_COLORS[event.typeCode] || 'default'}
                      size="small"
                      sx={{ fontWeight: 700 }}
                    />
                    {event.categoryName && (
                      <Chip label={event.categoryName} size="small" variant="outlined" />
                    )}
                    {event.level && (
                      <Chip label={event.level} size="small" color="primary" variant="outlined" />
                    )}
                  </Stack>

                  <Typography variant="h6" fontWeight={700} gutterBottom lineClamp={2}>
                    {event.title}
                  </Typography>

                  {event.organizer?.name && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Organizer: <strong>{event.organizer.name}</strong>
                    </Typography>
                  )}

                  <Stack spacing={1} sx={{ color: 'text.secondary', fontSize: '0.875rem', my: 2 }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <EventIcon fontSize="small" color="action" />
                      <span>{new Date(event.schedule?.fromDate).toLocaleDateString()}</span>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LocationIcon fontSize="small" color="action" />
                      <span>{event.venue?.name || event.mode}</span>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <PeopleIcon fontSize="small" color="action" />
                      <span>Capacity: {event.registrationCount} / {event.capacity} seats</span>
                    </Box>
                  </Stack>

                  <Divider sx={{ my: 1.5 }} />

                  <Box display="flex" justifyContent="space-between" alignItems="center" mt="auto">
                    <Typography variant="h6" color="primary.main" fontWeight={700}>
                      {event.fee?.amount === 0 ? 'FREE' : `₹${event.fee?.amount / 100}`}
                    </Typography>
                    <Button
                      variant="contained"
                      disableElevation
                      onClick={() => navigate(`/central-events/${event.slug}`)}
                      sx={{ borderRadius: 2 }}
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
    </Container>
  );
}
