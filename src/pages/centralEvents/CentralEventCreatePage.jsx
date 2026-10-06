import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Divider,
  CircularProgress,
  IconButton,
  Card,
  CardContent,
  InputAdornment,
  FormHelperText,
  Chip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Category as CategoryIcon,
  Event as EventIcon,
  Schedule as ScheduleIcon,
  Payments as PaymentsIcon,
  Description as DescriptionIcon,
  Groups as GroupsIcon,
  LocationOn as LocationIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getEventTypes, getCategoriesByTypeCode, getOrganizers, createCentralEvent, uploadCentralEventFile } from '../../api/centralEventsApi';
import { toast } from 'sonner';

export default function CentralEventCreatePage() {
  const navigate = useNavigate();

  const [types, setTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [typeCode, setTypeCode] = useState('');
  const [selectedTypeObj, setSelectedTypeObj] = useState(null);
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
      const res = await uploadCentralEventFile(file);
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Top Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/central-events')}
          sx={{ mb: 2, textTransform: 'none', color: 'text.secondary', fontWeight: 600 }}
        >
          Back to Central Events
        </Button>

        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
            color: 'white',
            boxShadow: '0 10px 25px -5px rgba(30, 58, 138, 0.3)'
          }}
        >
          <Box display="flex" alignItems="center" gap={2} mb={1}>
            <EventIcon sx={{ fontSize: 36, opacity: 0.9 }} />
            <Typography variant="h4" fontWeight={700}>
              Create New Central Event
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ opacity: 0.9, maxW: '750px' }}>
            Configure event hierarchy, target levels, schedule timelines, participation rules, and fee parameters.
          </Typography>
        </Paper>
      </Box>

      <form onSubmit={handleSubmit}>
        <Stack spacing={4}>

          {/* Section 1: Classification & Scope */}
          <Card elevation={1} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                <CategoryIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  1. Event Classification & Scope
                </Typography>
              </Box>

              <Grid container spacing={3}>
                {/* Event Type */}
                <Grid item xs={12} md={selectedTypeObj?.hasCategories ? 6 : 12}>
                  <FormControl fullWidth required sx={{ minWidth: 220 }}>
                    <InputLabel id="event-type-label">Event Type</InputLabel>
                    <Select
                      labelId="event-type-label"
                      value={typeCode}
                      label="Event Type"
                      onChange={(e) => handleTypeChange(e.target.value)}
                    >
                      {types.map((t) => (
                        <MenuItem key={t.code} value={t.code}>
                          {t.name} ({t.code})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Category */}
                {selectedTypeObj?.hasCategories && (
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required sx={{ minWidth: 220 }}>
                      <InputLabel id="category-label">Category</InputLabel>
                      <Select
                        labelId="category-label"
                        value={categoryId}
                        label="Category"
                        onChange={(e) => setCategoryId(e.target.value)}
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
                {selectedTypeObj?.hasLevels && (
                  <>
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth required sx={{ minWidth: 180 }}>
                        <InputLabel id="target-level-label">Target Level</InputLabel>
                        <Select
                          labelId="target-level-label"
                          value={level}
                          label="Target Level"
                          onChange={(e) => {
                            setLevel(e.target.value);
                            setActivityType('');
                          }}
                        >
                          <MenuItem value="STUDENT">Student Level</MenuItem>
                          <MenuItem value="FACULTY">Faculty Level</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth required sx={{ minWidth: 180 }}>
                        <InputLabel id="activity-type-label">Activity Type</InputLabel>
                        <Select
                          labelId="activity-type-label"
                          value={activityType}
                          label="Activity Type"
                          onChange={(e) => setActivityType(e.target.value)}
                        >
                          <MenuItem value="WORKSHOP">Workshop</MenuItem>
                          <MenuItem value="SEMINAR">Seminar / Orientation</MenuItem>
                          {level === 'FACULTY' && <MenuItem value="FDP">FDP</MenuItem>}
                          {level === 'FACULTY' && <MenuItem value="STTP">STTP</MenuItem>}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth required sx={{ minWidth: 180 }}>
                        <InputLabel id="organizer-label">Organizer</InputLabel>
                        <Select
                          labelId="organizer-label"
                          value={organizerId}
                          label="Organizer"
                          onChange={(e) => setOrganizerId(e.target.value)}
                        >
                          {organizers.map((o) => (
                            <MenuItem key={o._id} value={o._id}>
                              [{o.scope}] {o.name}
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

          {/* Section 2: General Details & Venue */}
          <Card elevation={1} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                <DescriptionIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  2. Event Information & Location
                </Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label="Event Title"
                    placeholder="e.g. National Level Coding Hackathon 2026"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    multiline
                    rows={4}
                    label="Event Description"
                    placeholder="Detailed overview of the event, objective, guidelines, and highlights..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} sm={5}>
                  <FormControl fullWidth required sx={{ minWidth: 180 }}>
                    <InputLabel id="mode-label">Event Mode</InputLabel>
                    <Select
                      labelId="mode-label"
                      value={mode}
                      label="Event Mode"
                      onChange={(e) => setMode(e.target.value)}
                    >
                      <MenuItem value="OFFLINE">Offline (On Campus)</MenuItem>
                      <MenuItem value="ONLINE">Online (Virtual)</MenuItem>
                      <MenuItem value="HYBRID">Hybrid</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={7}>
                  <TextField
                    fullWidth
                    label="Venue Name / Address / Meeting Link"
                    placeholder="e.g. K.L. Rao Bhavan Auditorium / Zoom Link"
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationIcon color="action" />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Section 3: Schedule Timeline */}
          <Card elevation={1} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                <ScheduleIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  3. Schedule & Deadlines
                </Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    required
                    type="datetime-local"
                    label="Start Date & Time"
                    InputLabelProps={{ shrink: true }}
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    helperText="Event start date & time"
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    required
                    type="datetime-local"
                    label="End Date & Time"
                    InputLabelProps={{ shrink: true }}
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    helperText="Event conclusion date & time"
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    required
                    type="datetime-local"
                    label="Registration Deadline"
                    InputLabelProps={{ shrink: true }}
                    value={regDeadline}
                    onChange={(e) => setRegDeadline(e.target.value)}
                    helperText="Last date & time for registrations"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Section 4: Participation, Fee & Capacity */}
          <Card elevation={1} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                <PaymentsIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  4. Capacity, Fees & Participation Mode
                </Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    required
                    type="number"
                    label="Registration Fee"
                    value={feeRupees}
                    onChange={(e) => setFeeRupees(e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>
                    }}
                    helperText="Enter 0 for Free Events"
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    required
                    type="number"
                    label="Seat Capacity"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    helperText="Max registrations allowed"
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth required>
                    <InputLabel id="participation-label">Participation Type</InputLabel>
                    <Select
                      labelId="participation-label"
                      value={participationType}
                      label="Participation Type"
                      onChange={(e) => setParticipationType(e.target.value)}
                    >
                      <MenuItem value="SINGLE">Individual Only</MenuItem>
                      <MenuItem value="TEAM">Team Participation</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {participationType === 'TEAM' && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        required
                        type="number"
                        label="Min Team Size"
                        value={minTeamSize}
                        onChange={(e) => setMinTeamSize(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        required
                        type="number"
                        label="Max Team Size"
                        value={maxTeamSize}
                        onChange={(e) => setMaxTeamSize(e.target.value)}
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Section 5: Media & Rules */}
          <Card elevation={1} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                <UploadIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  5. Rules, Outcomes & Banner Image
                </Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Rules & Guidelines"
                    placeholder="Rule 1: Plagiarism is strictly prohibited&#10;Rule 2: Laptops are mandatory"
                    value={rulesText}
                    onChange={(e) => setRulesText(e.target.value)}
                    helperText="Enter each rule on a new line"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Key Outcomes"
                    placeholder="Outcome 1: Practical knowledge of React & Node.js&#10;Outcome 2: Participation Certificate"
                    value={outcomesText}
                    onChange={(e) => setOutcomesText(e.target.value)}
                    helperText="Enter each outcome on a new line"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mt: 1 }}>
                    Event Banner Image
                  </Typography>

                  <Box display="flex" alignItems="center" gap={3} flexWrap="wrap">
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<UploadIcon />}
                      disabled={uploadingBanner}
                      sx={{ borderRadius: 2, px: 3, py: 1.2, textTransform: 'none', fontWeight: 600 }}
                    >
                      {uploadingBanner ? 'Uploading...' : 'Upload Banner'}
                      <input type="file" hidden accept="image/*" onChange={handleBannerUpload} />
                    </Button>

                    {banner && (
                      <Card variant="outlined" sx={{ display: 'flex', alignItems: 'center', p: 1, borderRadius: 2 }}>
                        <img
                          src={banner.url}
                          alt="Banner Preview"
                          style={{ width: 100, height: 60, objectFit: 'cover', borderRadius: 6, marginRight: 12 }}
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
              sx={{ borderRadius: 2.5, px: 4, py: 1.2, textTransform: 'none', fontWeight: 600 }}
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
                borderRadius: 2.5,
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

        </Stack>
      </form>
    </Container>
  );
}
