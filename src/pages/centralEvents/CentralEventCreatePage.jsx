import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  MenuItem,
  ListSubheader,
  Button,
  FormControl,
  InputLabel,
  Select,
  Stack,
  CircularProgress,
  IconButton,
  Card,
  CardContent,
  InputAdornment
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Category as CategoryIcon,
  Folder as FolderIcon,
  Event as EventIcon,
  Schedule as ScheduleIcon,
  Payments as PaymentsIcon,
  Description as DescriptionIcon,
  LocationOn as LocationIcon,
  CheckCircle as CheckCircleIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getEventTypes, getCategoriesByTypeCode, getOrganizers, createCentralEvent, uploadCentralEventFile } from '../../api/centralEventsApi';
import { PageHeader, CustomTabs } from '../../components/common';
import PageContainer from '../../components/common/design-system/PageContainer';
import { toast } from 'sonner';
import formRegistry from '../../config/form-registry.json';
import DynamicForm from '../UniversityData/DynamicForm';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9022';

const getImageUrl = (img) => {
  if (!img) return '';
  const pathStr = typeof img === 'string' ? img : img.url;
  if (!pathStr) return '';
  if (pathStr.startsWith('http://') || pathStr.startsWith('https://') || pathStr.startsWith('blob:')) {
    return pathStr;
  }
  return `${BACKEND_URL}${pathStr.startsWith('/') ? '' : '/'}${pathStr}`;
};

export default function CentralEventCreatePage() {
  const navigate = useNavigate();
  const { user, activeRole } = useAuth();

  const userRoles = (user?.roles || []).map(r => (typeof r === 'string' ? r : (r.role?.key || r.role?.name || r.role || '')).toUpperCase());
  const isGlobalAdmin = userRoles.includes('GLOBAL_EVENT_ADMIN') || userRoles.includes('SUPER_ADMIN') || activeRole?.toUpperCase() === 'GLOBAL_EVENT_ADMIN';

  const [types, setTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [typeCode, setTypeCode] = useState('');
  const [selectedTypeObj, setSelectedTypeObj] = useState(null);
  const [selectedFormCode, setSelectedFormCode] = useState('2.6');
  const [categoryId, setCategoryId] = useState('');
  const [level, setLevel] = useState('');
  const [activityType, setActivityType] = useState('');
  const [organizerId, setOrganizerId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState('OFFLINE');
  const [venueName, setVenueName] = useState('');
  const [feeRupees, setFeeRupees] = useState('0');
  const [capacity, setCapacity] = useState('100');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [regDeadline, setRegDeadline] = useState('');
  const [participationType, setParticipationType] = useState('SINGLE');
  const [minTeamSize, setMinTeamSize] = useState('1');
  const [maxTeamSize, setMaxTeamSize] = useState('1');

  const [rulesText, setRulesText] = useState('');
  const [outcomesText, setOutcomesText] = useState('');

  // Uploaded Files
  const [banner, setBanner] = useState(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Grouped Activity Forms from formRegistry
  const groupedActivityForms = React.useMemo(() => {
    const groups = {};
    (formRegistry.forms || []).forEach((f) => {
      if (f.is_active === false) return;
      const grp = f.group || 'General Activities';
      if (!groups[grp]) groups[grp] = [];
      groups[grp].push(f);
    });
    return groups;
  }, []);

  const selectedActivityForm = React.useMemo(() => {
    return (formRegistry.forms || []).find((f) => f.code === selectedFormCode) || formRegistry.forms[0];
  }, [selectedFormCode]);

  const isDepartmentalOrUniversity = typeCode === 'DEPARTMENTAL' || typeCode === 'UNIVERSITY';

  const handleActivitySaveSuccess = async (savedRecord, formData) => {
    try {
      setSubmitting(true);
      const eventTitle = formData.title || formData.name || selectedActivityForm?.name || 'Departmental Event';
      const eventDesc = formData.remarks || `${selectedActivityForm?.name || 'Departmental'} activity event`;

      const payload = {
        typeCode,
        title: eventTitle,
        description: eventDesc,
        mode: mode || 'OFFLINE',
        venue: { name: venueName || 'Campus Venue' },
        fee: { amount: 0, currency: 'INR' },
        capacity: parseInt(capacity || '100', 10),
        schedule: {
          fromDate: formData.start_date || fromDate || new Date(),
          toDate: formData.end_date || toDate || new Date(),
          regDeadline: formData.start_date || regDeadline || new Date()
        },
        participation: {
          type: 'SINGLE',
          minTeamSize: 1,
          maxTeamSize: 1
        },
        level: level || 'STUDENT',
        activityType: selectedActivityForm?.code || 'WORKSHOP',
        banner
      };

      const res = await createCentralEvent(payload);
      if (res.success) {
        toast.success(`Event & Activity Record [${selectedActivityForm?.code}] created successfully!`);
        navigate('/central-events');
      }
    } catch (err) {
      console.error('Error creating central event from activity form:', err);
      toast.error('Activity record saved successfully!');
      navigate('/central-events');
    } finally {
      setSubmitting(false);
    }
  };

  // Navigation Tabs
  const navTabs = [
    { key: 'all', label: 'All Central Events', icon: <EventIcon />, path: '/central-events' },
    { key: 'types', label: 'Event Types', icon: <CategoryIcon />, path: '/central-events/types' },
    { key: 'categories', label: 'Event Categories', icon: <FolderIcon />, path: '/central-events/categories' },
    { key: 'subcategories', label: 'Event Subcategories', icon: <FolderIcon />, path: '/central-events/subcategories' },
    ...(isGlobalAdmin ? [{ key: 'create', label: 'Create Event', icon: <AddIcon />, path: '/central-events/create' }] : [])
  ];

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [typesRes, orgsRes] = await Promise.all([getEventTypes(), getOrganizers()]);
        if (typesRes.success) setTypes(typesRes.data);
        if (orgsRes.success) setOrganizers(orgsRes.data);
      } catch (err) {
        toast.error('Failed to load form metadata');
      } finally {
        setLoadingTypes(false);
      }
    };
    fetchMasterData();
  }, []);

  const handleTypeChange = async (code) => {
    setTypeCode(code);
    const tObj = types.find((t) => t.code === code);
    setSelectedTypeObj(tObj);
    setCategoryId('');
    setLevel('');
    setActivityType('');
    setOrganizerId('');

    if (tObj?.hasCategories) {
      try {
        const res = await getCategoriesByTypeCode(code);
        if (res.success) setCategories(res.data);
      } catch (err) {
        toast.error('Failed to load categories');
      }
    } else {
      setCategories([]);
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingBanner(true);
    try {
      const res = await uploadCentralEventFile(file, { folderType: 'events', academicYear: formData.academicYear });
      if (res.success) {
        setBanner(res.data);
        toast.success('Banner uploaded successfully');
      }
    } catch (err) {
      toast.error('Failed to upload banner');
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const parsedRules = rulesText.split('\n').map((r) => r.trim()).filter(Boolean);
      const parsedOutcomes = outcomesText.split('\n').map((o) => o.trim()).filter(Boolean);

      const payload = {
        typeCode,
        title,
        description,
        mode,
        venue: { name: venueName },
        fee: {
          amount: Math.round(parseFloat(feeRupees || '0') * 100), // convert rupees to paise
          currency: 'INR'
        },
        capacity: parseInt(capacity || '100', 10),
        schedule: {
          fromDate,
          toDate,
          regDeadline
        },
        participation: {
          type: participationType,
          minTeamSize: parseInt(minTeamSize, 10),
          maxTeamSize: parseInt(maxTeamSize, 10)
        },
        rules: parsedRules,
        outcomes: parsedOutcomes,
        banner
      };

      if (selectedTypeObj?.hasCategories) {
        payload.categoryId = categoryId;
      }

      if (selectedTypeObj?.hasLevels) {
        payload.level = level;
        payload.activityType = activityType;
        payload.organizer = { organizerId };
      }

      const res = await createCentralEvent(payload);
      if (res.success) {
        toast.success('Central Event created successfully (DRAFT)');
        navigate(`/central-events/${res.data.slug}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create central event');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingTypes) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <PageContainer maxWidth="lg" px={3} py={3}>
      {/* Standard Page Header */}
      <PageHeader
        title="Create New Central Event"
        subtitle="Configure event hierarchy, target levels, schedule timelines, participation rules, and fee parameters."
        icon={<EventIcon />}
        showBack
        backPath="/central-events"
      />

      <form onSubmit={handleSubmit}>
        <Stack spacing={3.5}>

          {/* Section 1: Classification & Scope */}
          <Card elevation={0} sx={{ borderRadius: '18px', border: '1px solid var(--border-color)', background: 'var(--bg-paper)' }}>
            <CardContent sx={{ p: 3.5 }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                <CategoryIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  1. Event Classification & Scope
                </Typography>
              </Box>

              <Grid container spacing={3}>
                {/* Event Type */}
                <Grid size={{ xs: 12, md: isDepartmentalOrUniversity ? 6 : (selectedTypeObj?.hasCategories ? 6 : 12) }}>
                  <FormControl fullWidth required>
                    <InputLabel id="event-type-label">Event Type</InputLabel>
                    <Select
                      labelId="event-type-label"
                      value={typeCode}
                      label="Event Type"
                      onChange={(e) => handleTypeChange(e.target.value)}
                      sx={{ borderRadius: '12px' }}
                    >
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

                {/* Activity Form Type selection for Departmental & University level events */}
                {isDepartmentalOrUniversity && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth required>
                      <InputLabel id="activity-form-type-label">Select Activity Form Type</InputLabel>
                      <Select
                        labelId="activity-form-type-label"
                        value={selectedFormCode}
                        label="Select Activity Form Type"
                        onChange={(e) => setSelectedFormCode(e.target.value)}
                        sx={{ borderRadius: '12px', fontWeight: 600 }}
                      >
                        {Object.entries(groupedActivityForms).map(([groupName, formsList]) => [
                          <ListSubheader key={groupName} sx={{ fontWeight: 700, color: 'primary.main', bgcolor: 'var(--bg-paper)' }}>
                            -- {groupName} --
                          </ListSubheader>,
                          ...formsList.map((f) => (
                            <MenuItem key={f.code} value={f.code} sx={{ pl: 3.5 }}>
                              {f.name}
                            </MenuItem>
                          ))
                        ])}
                      </Select>
                    </FormControl>
                  </Grid>
                )}

                {/* Category */}
                {!isDepartmentalOrUniversity && selectedTypeObj?.hasCategories && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth required>
                      <InputLabel id="category-label">Category</InputLabel>
                      <Select
                        labelId="category-label"
                        value={categoryId}
                        label="Category"
                        onChange={(e) => setCategoryId(e.target.value)}
                        sx={{ borderRadius: '12px' }}
                      >
                        {categories.map((c) => (
                          <MenuItem key={c._id} value={c._id}>
                            {c.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}

                {/* Levels, Activity Type & Organizer */}
                {!isDepartmentalOrUniversity && selectedTypeObj?.hasLevels && (
                  <>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormControl fullWidth required>
                        <InputLabel id="target-level-label">Target Level</InputLabel>
                        <Select
                          labelId="target-level-label"
                          value={level}
                          label="Target Level"
                          onChange={(e) => {
                            setLevel(e.target.value);
                            setActivityType('');
                          }}
                          sx={{ borderRadius: '12px' }}
                        >
                          <MenuItem value="STUDENT">Student Level</MenuItem>
                          <MenuItem value="FACULTY">Faculty Level</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormControl fullWidth required>
                        <InputLabel id="activity-type-label">Activity Type</InputLabel>
                        <Select
                          labelId="activity-type-label"
                          value={activityType}
                          label="Activity Type"
                          onChange={(e) => setActivityType(e.target.value)}
                          sx={{ borderRadius: '12px' }}
                        >
                          <MenuItem value="WORKSHOP">Workshop</MenuItem>
                          <MenuItem value="SEMINAR">Seminar / Orientation</MenuItem>
                          {level === 'FACULTY' && <MenuItem value="FDP">FDP</MenuItem>}
                          {level === 'FACULTY' && <MenuItem value="STTP">STTP</MenuItem>}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormControl fullWidth required>
                        <InputLabel id="organizer-label">Organizer</InputLabel>
                        <Select
                          labelId="organizer-label"
                          value={organizerId}
                          label="Organizer"
                          onChange={(e) => setOrganizerId(e.target.value)}
                          sx={{ borderRadius: '12px' }}
                        >
                          {organizers.map((o) => (
                            <MenuItem key={o._id} value={o._id}>
                              {o.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Conditional Rendering: Step 1 (Departmental/University Activity Form) vs Step 2 (Standard Event Details) */}
          {isDepartmentalOrUniversity ? (
            <Card elevation={0} sx={{ borderRadius: '18px', border: '1px solid var(--border-color)', background: 'var(--bg-paper)' }}>
              <CardContent sx={{ p: 3.5 }}>
                <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                  <DescriptionIcon color="primary" />
                  <Typography variant="h6" fontWeight={700}>
                    2. Complete Activity Form Details [{selectedActivityForm?.code} - {selectedActivityForm?.name}]
                  </Typography>
                </Box>
                {selectedActivityForm && (
                  <DynamicForm
                    form={selectedActivityForm}
                    onSaveSuccess={handleActivitySaveSuccess}
                  />
                )}
              </CardContent>
            </Card>
          ) : (
            <>

              {/* Section 2: General Details & Venue */}
              <Card elevation={0} sx={{ borderRadius: '18px', border: '1px solid var(--border-color)', background: 'var(--bg-paper)' }}>
                <CardContent sx={{ p: 3.5 }}>
                  <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                    <DescriptionIcon color="primary" />
                    <Typography variant="h6" fontWeight={700}>
                      2. Event Information & Location
                    </Typography>
                  </Box>

                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        required
                        label="Event Title"
                        placeholder="e.g. National Level Coding Hackathon 2026"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        slotProps={{ input: { sx: { borderRadius: '12px' } } }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        required
                        multiline
                        rows={4}
                        label="Event Description"
                        placeholder="Detailed overview of the event, objective, guidelines, and highlights..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        slotProps={{ input: { sx: { borderRadius: '12px' } } }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 5 }}>
                      <FormControl fullWidth required>
                        <InputLabel id="mode-label">Event Mode</InputLabel>
                        <Select
                          labelId="mode-label"
                          value={mode}
                          label="Event Mode"
                          onChange={(e) => setMode(e.target.value)}
                          sx={{ borderRadius: '12px' }}
                        >
                          <MenuItem value="OFFLINE">Offline (On Campus)</MenuItem>
                          <MenuItem value="ONLINE">Online (Virtual)</MenuItem>
                          <MenuItem value="HYBRID">Hybrid</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 7 }}>
                      <TextField
                        fullWidth
                        label="Venue Name / Address / Meeting Link"
                        placeholder="e.g. K.L. Rao Bhavan Auditorium / Zoom Link"
                        value={venueName}
                        onChange={(e) => setVenueName(e.target.value)}
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <LocationIcon color="action" />
                              </InputAdornment>
                            ),
                            sx: { borderRadius: '12px' }
                          }
                        }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Section 3: Schedule Timeline */}
              <Card elevation={0} sx={{ borderRadius: '18px', border: '1px solid var(--border-color)', background: 'var(--bg-paper)' }}>
                <CardContent sx={{ p: 3.5 }}>
                  <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                    <ScheduleIcon color="primary" />
                    <Typography variant="h6" fontWeight={700}>
                      3. Schedule & Deadlines
                    </Typography>
                  </Box>

                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        required
                        type="datetime-local"
                        label="Start Date & Time"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        helperText="Event start date & time"
                        slotProps={{
                          inputLabel: { shrink: true },
                          input: { sx: { borderRadius: '12px' } }
                        }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        required
                        type="datetime-local"
                        label="End Date & Time"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        helperText="Event conclusion date & time"
                        slotProps={{
                          inputLabel: { shrink: true },
                          input: { sx: { borderRadius: '12px' } }
                        }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        required
                        type="datetime-local"
                        label="Registration Deadline"
                        value={regDeadline}
                        onChange={(e) => setRegDeadline(e.target.value)}
                        helperText="Last date & time for registrations"
                        slotProps={{
                          inputLabel: { shrink: true },
                          input: { sx: { borderRadius: '12px' } }
                        }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Section 4: Participation, Fee & Capacity */}
              <Card elevation={0} sx={{ borderRadius: '18px', border: '1px solid var(--border-color)', background: 'var(--bg-paper)' }}>
                <CardContent sx={{ p: 3.5 }}>
                  <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                    <PaymentsIcon color="primary" />
                    <Typography variant="h6" fontWeight={700}>
                      4. Capacity, Fees & Participation Mode
                    </Typography>
                  </Box>

                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        required
                        type="number"
                        label="Registration Fee"
                        value={feeRupees}
                        onChange={(e) => setFeeRupees(e.target.value)}
                        slotProps={{
                          input: {
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                            sx: { borderRadius: '12px' }
                          }
                        }}
                        helperText="Enter 0 for Free Events"
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        required
                        type="number"
                        label="Seat Capacity"
                        value={capacity}
                        onChange={(e) => setCapacity(e.target.value)}
                        helperText="Max registrations allowed"
                        slotProps={{ input: { sx: { borderRadius: '12px' } } }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormControl fullWidth required>
                        <InputLabel id="participation-label">Participation Type</InputLabel>
                        <Select
                          labelId="participation-label"
                          value={participationType}
                          label="Participation Type"
                          onChange={(e) => setParticipationType(e.target.value)}
                          sx={{ borderRadius: '12px' }}
                        >
                          <MenuItem value="SINGLE">Individual Only</MenuItem>
                          <MenuItem value="TEAM">Team Participation</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    {participationType === 'TEAM' && (
                      <>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            fullWidth
                            required
                            type="number"
                            label="Min Team Size"
                            value={minTeamSize}
                            onChange={(e) => setMinTeamSize(e.target.value)}
                            slotProps={{ input: { sx: { borderRadius: '12px' } } }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            fullWidth
                            required
                            type="number"
                            label="Max Team Size"
                            value={maxTeamSize}
                            onChange={(e) => setMaxTeamSize(e.target.value)}
                            slotProps={{ input: { sx: { borderRadius: '12px' } } }}
                          />
                        </Grid>
                      </>
                    )}
                  </Grid>
                </CardContent>
              </Card>

              {/* Section 5: Media & Rules */}
              <Card elevation={0} sx={{ borderRadius: '18px', border: '1px solid var(--border-color)', background: 'var(--bg-paper)' }}>
                <CardContent sx={{ p: 3.5 }}>
                  <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                    <UploadIcon color="primary" />
                    <Typography variant="h6" fontWeight={700}>
                      5. Rules, Outcomes & Banner Image
                    </Typography>
                  </Box>

                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Rules & Guidelines"
                        placeholder="Rule 1: Plagiarism is strictly prohibited&#10;Rule 2: Laptops are mandatory"
                        value={rulesText}
                        onChange={(e) => setRulesText(e.target.value)}
                        helperText="Enter each rule on a new line"
                        slotProps={{ input: { sx: { borderRadius: '12px' } } }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Key Outcomes"
                        placeholder="Outcome 1: Practical knowledge of React & Node.js&#10;Outcome 2: Participation Certificate"
                        value={outcomesText}
                        onChange={(e) => setOutcomesText(e.target.value)}
                        helperText="Enter each outcome on a new line"
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
                          sx={{ borderRadius: '12px', px: 3, py: 1.2, textTransform: 'none', fontWeight: 600 }}
                        >
                          {uploadingBanner ? 'Uploading...' : 'Upload Banner'}
                          <input type="file" hidden accept="image/*" onChange={handleBannerUpload} />
                        </Button>

                        {banner && (
                          <Card variant="outlined" sx={{ display: 'flex', alignItems: 'center', p: 1, borderRadius: '12px' }}>
                            <img
                              src={getImageUrl(banner)}
                              alt="Banner Preview"
                              style={{ width: 100, height: 60, objectFit: 'cover', borderRadius: 8, marginRight: 12 }}
                            />
                            <Box mr={2}>
                              <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 200 }}>
                                {banner.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Uploaded
                              </Typography>
                            </Box>
                            <IconButton color="error" onClick={() => setBanner(null)}>
                              <DeleteIcon />
                            </IconButton>
                          </Card>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Form Actions */}
              <Box display="flex" justifyContent="flex-end" alignItems="center" gap={2} pt={2} pb={6}>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/central-events')}
                  sx={{ borderRadius: '12px', px: 4, py: 1.2, textTransform: 'none', fontWeight: 600 }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  type="submit"
                  size="large"
                  disabled={submitting}
                  startIcon={submitting ? null : <CheckCircleIcon />}
                  sx={{
                    borderRadius: '12px',
                    px: 5,
                    py: 1.2,
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '1rem',
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                    boxShadow: '0 8px 20px -4px rgba(37, 99, 235, 0.4)'
                  }}
                >
                  {submitting ? <CircularProgress size={24} color="inherit" /> : 'Create Event (Draft)'}
                </Button>
              </Box>
            </>
          )}

        </Stack>
      </form>
    </PageContainer>
  );
}
