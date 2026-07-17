import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  TextField,
  CircularProgress,
  Button,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Chip,
  Avatar,
  AvatarGroup,
  Tooltip,
  Paper,
  InputAdornment,
  MenuItem,
  Select,
  Divider,
  Pagination
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  Groups as GroupsIcon,
  Person as PersonIcon,
  GridView as GridViewIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  MoreVert as MoreVertIcon,
  ArrowForward as ArrowForwardIcon,
  RotateLeft as ClearIcon
} from '@mui/icons-material';
import { toast } from 'sonner';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:9000";

// Gorgeous calendar illustration on the right of the header card
const CalendarIllustration = () => (
  <Box
    sx={{
      display: { xs: 'none', md: 'block' },
      position: 'relative',
      width: '140px',
      height: '110px',
      mr: 1,
      opacity: 0.95
    }}
  >
    <svg width="100%" height="100%" viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="120" cy="40" r="16" fill="#FDBA74" opacity="0.3" filter="blur(8px)" />
      
      <rect x="20" y="30" width="100" height="90" rx="16" fill="var(--bg-paper, #ffffff)" stroke="#cbd5e1" strokeWidth="2" style={{ filter: 'drop-shadow(0px 8px 16px rgba(0,0,0,0.05))' }} />
      
      <path d="M20 46C20 37.1634 27.1634 30 36 30H104C112.837 30 120 37.1634 120 46V54H20V46Z" fill="url(#headerGrad)" />
      
      <rect x="35" y="16" width="8" height="20" rx="4" fill="#64748b" />
      <rect x="60" y="16" width="8" height="20" rx="4" fill="#64748b" />
      <rect x="85" y="16" width="8" height="20" rx="4" fill="#64748b" />
      <rect x="110" y="16" width="8" height="20" rx="4" fill="#64748b" />
      
      <circle cx="40" cy="70" r="4" fill="#e2e8f0" />
      <circle cx="60" cy="70" r="4" fill="#e2e8f0" />
      <circle cx="80" cy="70" r="4" fill="#e2e8f0" />
      <circle cx="100" cy="70" r="4" fill="#e2e8f0" />
      
      <circle cx="40" cy="85" r="4" fill="#e2e8f0" />
      <circle cx="60" cy="85" r="4" fill="#e2e8f0" />
      <circle cx="80" cy="85" r="6" fill="#ec4899" />
      <circle cx="100" cy="85" r="4" fill="#e2e8f0" />
      
      <circle cx="40" cy="100" r="4" fill="#e2e8f0" />
      <circle cx="60" cy="100" r="4" fill="#e2e8f0" />
      <circle cx="80" cy="100" r="4" fill="#e2e8f0" />
      <circle cx="100" cy="100" r="4" fill="#e2e8f0" />
      
      {/* Soft blue-purple leaves branch matching the reference layout */}
      <path d="M110 110Q130 95 135 70" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
      <path d="M135 70C140 70 148 75 145 82C138 85 133 80 135 70Z" fill="#93c5fd" opacity="0.8" />
      <path d="M124 85C132 83 138 87 138 95C130 96 125 92 124 85Z" fill="#a5b4fc" opacity="0.8" />
      <path d="M115 98C122 98 128 103 125 110C118 110 114 105 115 98Z" fill="#cbd5e1" opacity="0.8" />

      {/* Sparkles */}
      <path d="M135 25L137 30L142 32L137 34L135 39L133 34L128 32L133 30L135 25Z" fill="#F59E0B" />
      <path d="M142 50L143 53L146 54L143 55L142 58L141 55L138 54L141 53L142 50Z" fill="#F59E0B" opacity="0.7" />
      
      <defs>
        <linearGradient id="headerGrad" x1="20" y1="30" x2="120" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563eb" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
    </svg>
  </Box>
);

export default function EventCoordination() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(0); // 0: My Events, 1: All Events
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTimeline, setSelectedTimeline] = useState('');
  const [dateRangeQuery, setDateRangeQuery] = useState('');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Dialog States
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Load events and enrich with mock data to showcase the design details
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await API.get('/api/events');
      if (response.data?.success) {
        const rawEvents = response.data.events || [];
        
        // Enrich events with category, venue, dates, status, description to match screenshot
        const enriched = rawEvents.map((evt, idx) => {
          const categories = ["CULTURAL", "TECHNICAL", "ACADEMIC", "SPORTS", "WORKSHOP"];
          const venues = ["Main Auditorium", "Seminar Hall-1", "AEC Conference Room", "AU Stadium", "Decennial Block"];
          const statuses = ["Upcoming", "Ongoing", "Completed"];
          
          const category = categories[idx % categories.length];
          const venue = venues[idx % venues.length];
          const status = statuses[idx % statuses.length];
          
          const createdDate = evt.createdAt ? new Date(evt.createdAt) : new Date();
          const startDate = new Date(createdDate.getTime() + (idx + 1) * 2 * 24 * 60 * 60 * 1000);
          const endDate = new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000);
          
          const formatDateRange = (start, end) => {
            const options = { day: 'numeric', month: 'short' };
            const startStr = start.toLocaleDateString('en-US', options);
            const endStr = end.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
            return `${startStr} – ${endStr}`;
          };

          return {
            ...evt,
            category,
            venue,
            status,
            startDate,
            endDate,
            dateString: formatDateRange(startDate, endDate),
            description: evt.description || "A national level techno-cultural fest celebrating talent, innovation and creativity."
          };
        });

        setEvents(enriched);
      } else {
        toast.error('Failed to load events');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to fetch events from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedStatus('');
    setSelectedCategory('');
    setSelectedTimeline('');
    setDateRangeQuery('');
    setCurrentPage(1);
    toast.success('Filters cleared');
  };

  // Filtering logic
  const filteredEvents = events.filter(event => {
    // 1. Search Query filter (matches event name or venue)
    const matchesSearch = 
      event.eventName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.venue?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 2. Tab selection filter (My Coordinated Events vs All Events)
    let matchesTab = true;
    if (activeTab === 0) {
      matchesTab = event.conveners?.some(
        c => c.employeeId === user?.institutionId
      );
    }
    
    // 3. Status filter
    const matchesStatus = selectedStatus === '' || event.status === selectedStatus;

    // 4. Category filter
    const matchesCategory = selectedCategory === '' || event.category === selectedCategory;

    // 5. Timeline filter (Upcoming, Ongoing, Past)
    let matchesTimeline = true;
    if (selectedTimeline === 'Upcoming') {
      matchesTimeline = event.status === 'Upcoming';
    } else if (selectedTimeline === 'Ongoing') {
      matchesTimeline = event.status === 'Ongoing';
    } else if (selectedTimeline === 'Past') {
      matchesTimeline = event.status === 'Completed';
    }

    // 6. Date Range search filter
    const matchesDate = dateRangeQuery === '' || event.dateString?.toLowerCase().includes(dateRangeQuery.toLowerCase());

    return matchesSearch && matchesTab && matchesStatus && matchesCategory && matchesTimeline && matchesDate;
  });

  // Pagination calculations
  const totalItems = filteredEvents.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEvents = filteredEvents.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (event, val) => {
    setCurrentPage(val);
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Upcoming':
        return { bgcolor: '#fee2e2', color: '#991b1b' }; // light red
      case 'Ongoing':
        return { bgcolor: '#dcfce7', color: '#166534' }; // light green
      default:
        return { bgcolor: '#f3f4f6', color: '#374151' }; // light grey
    }
  };

  return (
    <Box sx={{ p: 4, width: '100%' }}>
      <Box sx={{ mb: 3 }}>
        <PageHeader
          title="Event Coordination"
          subtitle="View and manage events you are coordinating"
          showLogo={false}
          showBack={false}
          action={<CalendarIllustration />}
        />
      </Box>

      {/* Tabs and Search Bar Container */}
      <Paper
        sx={{
          p: 2,
          mb: 2,
          borderRadius: '16px',
          background: 'var(--bg-paper, #ffffff)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(e, newVal) => {
            setActiveTab(newVal);
            setCurrentPage(1);
          }}
          sx={{
            minHeight: '40px',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              minHeight: '40px',
              borderRadius: '10px',
              mr: 1,
              px: 3,
              color: 'var(--text-secondary)',
              display: 'inline-flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 1
            },
            '& .Mui-selected': {
              color: 'var(--color-primary, #2563eb) !important',
              backgroundColor: 'var(--bg-accent-1, rgba(37, 99, 235, 0.08))'
            },
            '& .MuiTabs-indicator': {
              display: 'none'
            }
          }}
        >
          <Tab icon={<PersonIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="My Events" />
          <Tab icon={<GridViewIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="All Events" />
        </Tabs>

        <TextField
          size="small"
          placeholder="Search by event name, venue..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          sx={{
            width: { xs: '100%', md: '360px' },
            background: 'var(--bg-accent-1, rgba(0,0,0,0.015))',
            borderRadius: '12px',
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              '& fieldset': { border: '1px solid var(--border-color)' },
              '&:hover fieldset': { borderColor: 'var(--color-primary, #2563eb)' },
              '&.Mui-focused fieldset': { borderWidth: '1px', borderColor: 'var(--color-primary, #2563eb)' }
            }
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              )
            }
          }}
        />
      </Paper>

      {/* Row of dropdown filters */}
      <Grid container spacing={2} sx={{ mb: 4 }} alignItems="center">
        <Grid item xs={12} sm={6} md={2.4}>
          <Select
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
            displayEmpty
            size="small"
            fullWidth
            sx={{
              background: 'var(--bg-paper, #ffffff)',
              borderRadius: '12px',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border-color)' }
            }}
          >
            <MenuItem value="">All Status</MenuItem>
            <MenuItem value="Upcoming">Upcoming</MenuItem>
            <MenuItem value="Ongoing">Ongoing</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
          </Select>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
            displayEmpty
            size="small"
            fullWidth
            sx={{
              background: 'var(--bg-paper, #ffffff)',
              borderRadius: '12px',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border-color)' }
            }}
          >
            <MenuItem value="">All Categories</MenuItem>
            <MenuItem value="CULTURAL">Cultural</MenuItem>
            <MenuItem value="TECHNICAL">Technical</MenuItem>
            <MenuItem value="ACADEMIC">Academic</MenuItem>
            <MenuItem value="SPORTS">Sports</MenuItem>
            <MenuItem value="WORKSHOP">Workshop</MenuItem>
          </Select>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Select
            value={selectedTimeline}
            onChange={(e) => { setSelectedTimeline(e.target.value); setCurrentPage(1); }}
            displayEmpty
            size="small"
            fullWidth
            sx={{
              background: 'var(--bg-paper, #ffffff)',
              borderRadius: '12px',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border-color)' }
            }}
          >
            <MenuItem value="">Upcoming</MenuItem>
            <MenuItem value="Ongoing">Ongoing</MenuItem>
            <MenuItem value="Past">Past</MenuItem>
            <MenuItem value="All">All Timelines</MenuItem>
          </Select>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <TextField
            size="small"
            placeholder="Date Range"
            value={dateRangeQuery}
            onChange={(e) => { setDateRangeQuery(e.target.value); setCurrentPage(1); }}
            fullWidth
            sx={{
              background: 'var(--bg-paper, #ffffff)',
              borderRadius: '12px',
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                '& fieldset': { borderColor: 'var(--border-color)' }
              }
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarIcon sx={{ fontSize: 18 }} color="action" />
                  </InputAdornment>
                )
              }
            }}
          />
        </Grid>

        <Grid item xs={12} sm={12} md={2.4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
          <Button
            variant="text"
            startIcon={<ClearIcon />}
            onClick={handleClearFilters}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              '&:hover': { color: 'var(--color-primary, #2563eb)' }
            }}
          >
            Clear Filters
          </Button>
        </Grid>
      </Grid>

      {/* Events List Rows */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : paginatedEvents.length === 0 ? (
        <Paper
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: '20px',
            background: 'var(--bg-paper, #ffffff)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <GroupsIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Events Found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No events match your current filter parameters. Try clearing the filters.
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {paginatedEvents.map((event, idx) => (
            <Card
              key={event._id}
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                borderRadius: '24px',
                background: 'var(--bg-paper, #ffffff)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)',
                overflow: 'hidden',
                position: 'relative',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 'var(--shadow-lg)'
                }
              }}
            >
              {/* Event Image with tag */}
              <Box sx={{ position: 'relative', width: { xs: '100%', md: '280px' }, height: { xs: '180px', md: 'auto' }, flexShrink: 0 }}>
                <CardMedia
                  component="img"
                  image={`${BASE_URL}${event.bannerImage}`}
                  alt={event.eventName}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)'
                  }}
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60';
                  }}
                />
                
                {/* Status Pill overlay at bottom-left */}
                <Box
                  sx={{
                    position: 'absolute',
                    left: 12,
                    bottom: 12,
                    px: 2,
                    py: 0.5,
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    ...getStatusStyle(event.status)
                  }}
                >
                  {event.status}
                </Box>
              </Box>

              {/* Event Details Content */}
              <CardContent sx={{ p: { xs: 3, md: 4 }, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box>
                  {/* Category Pill and dots menu */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Chip
                      label={event.category}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(37, 99, 235, 0.08)',
                        color: 'var(--color-primary, #2563eb)',
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        px: 1
                      }}
                    />
                    <IconButton size="small">
                      <MoreVertIcon sx={{ color: 'var(--text-secondary)' }} />
                    </IconButton>
                  </Box>

                  {/* Title */}
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      lineHeight: 1.3,
                      mb: 1
                    }}
                  >
                    {event.eventName}
                  </Typography>

                  {/* Description */}
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 3,
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {event.description}
                  </Typography>

                  {/* Date and Venue specs */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarIcon sx={{ fontSize: 18, color: 'var(--text-secondary)' }} />
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {event.dateString}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationIcon sx={{ fontSize: 18, color: 'var(--text-secondary)' }} />
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {event.venue}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Divider sx={{ my: 1.5 }} />

                {/* Bottom line: coordinators list and action */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <AvatarGroup
                      max={4}
                      sx={{
                        '& .MuiAvatar-root': {
                          width: 28,
                          height: 28,
                          fontSize: '0.75rem',
                          border: '2px solid var(--bg-paper, #ffffff)',
                          bgcolor: 'var(--color-primary-alpha, rgba(37,99,235,0.1))',
                          color: 'var(--color-primary, #2563eb)'
                        }
                      }}
                    >
                      {event.conveners?.map((c, idx) => (
                        <Tooltip key={idx} title={`${c.employeeName} (${c.department})`}>
                          <Avatar>
                            {c.employeeName?.charAt(0).toUpperCase()}
                          </Avatar>
                        </Tooltip>
                      ))}
                    </AvatarGroup>
                    <Typography variant="caption" sx={{ fontWeight: 650, color: 'var(--text-secondary)' }}>
                      {event.conveners?.length || 0} Coordinators
                    </Typography>
                  </Box>

                  <Button
                    variant="outlined"
                    endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                    onClick={() => {
                      setSelectedEvent(event);
                      setOpenDetailsDialog(true);
                    }}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 700,
                      borderRadius: '10px',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                      '&:hover': {
                        borderColor: 'var(--color-primary, #2563eb)',
                        bgcolor: 'var(--bg-accent-1, rgba(37,99,235,0.04))'
                      }
                    }}
                  >
                    View Details
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Pagination Footer */}
      {!loading && totalItems > 0 && (
        <Paper
          sx={{
            mt: 4,
            p: 2,
            borderRadius: '16px',
            background: 'var(--bg-paper, #ffffff)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2
          }}
          elevation={0}
        >
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            Showing {startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} {totalItems === 1 ? 'event' : 'events'}
          </Typography>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            shape="rounded"
            sx={{
              '& .MuiPaginationItem-root': {
                fontWeight: 'bold',
                borderRadius: '8px'
              }
            }}
          />
        </Paper>
      )}

      {/* Details View Dialog */}
      <Dialog
        open={openDetailsDialog}
        onClose={() => setOpenDetailsDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            bgcolor: 'var(--bg-paper, #ffffff)',
            backgroundImage: 'none'
          }
        }}
      >
        {selectedEvent && (
          <>
            <DialogTitle sx={{ m: 0, p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>Event Specifications</Typography>
              <IconButton onClick={() => setOpenDetailsDialog(false)}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 0, borderColor: 'var(--border-color)' }}>
              <Box
                component="img"
                src={`${BASE_URL}${selectedEvent.bannerImage}`}
                alt={selectedEvent.eventName}
                sx={{
                  width: '100%',
                  maxHeight: '320px',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60';
                }}
              />

              <Box sx={{ p: 4 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                  {selectedEvent.eventName}
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, my: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon color="action" />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {selectedEvent.dateString}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationIcon color="action" />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {selectedEvent.venue}
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
                  {selectedEvent.description}
                </Typography>

                <Box sx={{ mt: 4 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GroupsIcon color="primary" /> Conveners List
                  </Typography>

                  <Grid container spacing={2}>
                    {selectedEvent.conveners?.map((c, i) => (
                      <Grid item xs={12} sm={6} key={i}>
                        <Paper
                          sx={{
                            p: 2,
                            borderRadius: '16px',
                            background: 'var(--bg-accent-1, rgba(0,0,0,0.025))',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            gap: 1.5,
                            alignItems: 'center'
                          }}
                          elevation={0}
                        >
                          <Avatar sx={{ bgcolor: 'var(--color-primary, #2563eb)', color: '#fff' }}>
                            {c.employeeName?.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 700 }}>
                              {c.employeeName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              ID: {c.employeeId}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {c.designation} • {c.department}
                            </Typography>
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Box>
            </DialogContent>
            
            <DialogActions sx={{ p: 3 }}>
              <Button 
                onClick={() => setOpenDetailsDialog(false)}
                variant="outlined"
                sx={{
                  borderRadius: '12px',
                  px: 4,
                  textTransform: 'none',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)'
                }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
