import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  MenuItem,
  Grid,
  Paper,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Calendar,
  Layers,
  Sparkles,
  Info,
  CheckCircle2
} from 'lucide-react';
import API from '../../api/axios';
import { toast } from 'sonner';

export const ACTIVITY_TYPES = [
  'Workshop',
  'Guest Lecture',
  'Industrial Visit',
  'Value Added Course',
  'Capacity Development',
  'Professional Body Activity',
  'Alumni Interaction',
  'FDP/PDP',
  'Club Activity',
  'Extension & Outreach',
  'Entrepreneurship Event'
];

export default function ActivityFormModal({ open, onClose, onSaved, initialData = null }) {
  const isEditing = Boolean(initialData);

  // Core Fields
  const [title, setTitle] = useState('');
  const [activityType, setActivityType] = useState('Workshop');
  const [academicYear, setAcademicYear] = useState('');
  const [academicYearName, setAcademicYearName] = useState('');
  const [department, setDepartment] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(0);
  const [description, setDescription] = useState('');

  // Dynamic Type Details
  const [typeDetails, setTypeDetails] = useState({});

  // Options & Status
  const [academicYears, setAcademicYears] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Load Academic Years & Departments
  useEffect(() => {
    if (open) {
      loadDropdowns();
    }
  }, [open]);

  const loadDropdowns = async () => {
    setIsLoadingDropdowns(true);
    try {
      const [ayRes, deptRes] = await Promise.all([
        API.get('/api/academic-years').catch(() => ({ data: [] })),
        API.get('/api/event-departments').catch(() => ({ data: [] }))
      ]);

      const ayList = Array.isArray(ayRes.data)
        ? ayRes.data
        : (ayRes.data?.data || ayRes.data?.academicYears || []);
      const deptList = Array.isArray(deptRes.data)
        ? deptRes.data
        : (deptRes.data?.data || deptRes.data?.departments || []);

      setAcademicYears(ayList);
      setDepartments(deptList);
    } catch (err) {
      console.error('Error fetching academic years/departments:', err);
    } finally {
      setIsLoadingDropdowns(false);
    }
  };

  // Populate fields on edit or initialize for new activity
  useEffect(() => {
    if (!open) return;

    if (initialData) {
      setTitle(initialData.title || '');
      setActivityType(initialData.activityType || 'Workshop');
      setAcademicYear(initialData.academicYear?._id || initialData.academicYear || '');
      setAcademicYearName(initialData.academicYearName || '');
      setDepartment(initialData.department?._id || initialData.department || '');
      setDepartmentName(initialData.departmentName || '');
      setStartDate(initialData.startDate ? initialData.startDate.slice(0, 10) : '');
      setEndDate(initialData.endDate ? initialData.endDate.slice(0, 10) : '');
      setRegistrationDeadline(initialData.registrationDeadline ? initialData.registrationDeadline.slice(0, 10) : '');
      setMaxParticipants(initialData.maxParticipants || 0);
      setDescription(initialData.description || '');
      setTypeDetails(initialData.typeDetails || {});
    } else {
      setTitle('');
      setActivityType('Workshop');
      if (academicYears.length > 0) {
        const activeAy = academicYears.find((y) => y.active) || academicYears[0];
        setAcademicYear(activeAy._id);
        setAcademicYearName(activeAy.year || activeAy.academicYear || activeAy.name || '');
      }
      if (departments.length > 0) {
        setDepartment(departments[0]._id);
        setDepartmentName(departments[0].name || '');
      }
      const today = new Date().toISOString().slice(0, 10);
      setStartDate(today);
      setEndDate(today);
      setRegistrationDeadline(today);
      setMaxParticipants(0);
      setDescription('');
      setTypeDetails({ contactHours: 6, resourcePerson: '' });
    }
    setErrors({});
  }, [initialData, open, academicYears, departments]);

  const handleTypeChange = (newType) => {
    setActivityType(newType);
    let defaults = {};
    switch (newType) {
      case 'Workshop':
        defaults = { contactHours: 6, resourcePerson: '' };
        break;
      case 'Guest Lecture':
        defaults = { speakerResourcePerson: '' };
        break;
      case 'Industrial Visit':
        defaults = { industry: '', place: '', semester: '', classSection: '' };
        break;
      case 'Value Added Course':
        defaults = { contactHours: 30, resourcePerson: '' };
        break;
      case 'Capacity Development':
        defaults = { category: 'Soft Skills', resourcePerson: '' };
        break;
      case 'Professional Body Activity':
        defaults = { professionalBody: 'IEEE', resourcePerson: '' };
        break;
      case 'Alumni Interaction':
        defaults = { alumniName: '', organization: '', designation: '' };
        break;
      case 'FDP/PDP':
        defaults = { programTitle: '', duration: '5 Days', organization: '', mode: 'Offline' };
        break;
      case 'Club Activity':
        defaults = { clubName: '', eventDetails: '' };
        break;
      case 'Extension & Outreach':
        defaults = { unit: 'NSS', venue: '' };
        break;
      case 'Entrepreneurship Event':
        defaults = { eventType: 'Ideathon', organizer: '', outcome: '' };
        break;
      default:
        defaults = {};
    }
    setTypeDetails(defaults);
  };

  const handleTypeFieldChange = (field, value) => {
    setTypeDetails((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const errs = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (!activityType) errs.activityType = 'Activity type is required';
    if (!startDate) errs.startDate = 'Start date is required';
    if (!endDate) errs.endDate = 'End date is required';
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      errs.endDate = 'End date cannot be earlier than start date';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fill in all mandatory fields before saving.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: title.trim(),
        activityType,
        academicYear: academicYear || null,
        academicYearName,
        department: department || null,
        departmentName,
        startDate,
        endDate,
        registrationDeadline: registrationDeadline || endDate,
        maxParticipants: Number(maxParticipants) || 0,
        description: description.trim(),
        typeDetails
      };

      if (isEditing) {
        const res = await API.put(`/api/activity-hub/${initialData._id}`, payload);
        toast.success('Activity updated successfully.');
        if (onSaved) onSaved(res.data.data);
      } else {
        const res = await API.post('/api/activity-hub', payload);
        toast.success('Activity created successfully as disabled draft.');
        if (onSaved) onSaved(res.data.data);
      }
      onClose();
    } catch (error) {
      console.error('Error saving activity:', error);
      const msg = error.response?.data?.error || error.response?.data?.message || 'Failed to save activity.';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Render Dynamic Fields per Activity Type
  const renderDynamicFields = () => {
    switch (activityType) {
      case 'Workshop':
      case 'Value Added Course':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Contact Hours *"
                value={typeDetails.contactHours ?? 6}
                onChange={(e) => handleTypeFieldChange('contactHours', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                size="small"
                label="Resource Person (Name, Designation, Org) *"
                value={typeDetails.resourcePerson || ''}
                onChange={(e) => handleTypeFieldChange('resourcePerson', e.target.value)}
              />
            </Grid>
          </Grid>
        );

      case 'Guest Lecture':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Speaker / Resource Person Details *"
                value={typeDetails.speakerResourcePerson || ''}
                onChange={(e) => handleTypeFieldChange('speakerResourcePerson', e.target.value)}
              />
            </Grid>
          </Grid>
        );

      case 'Industrial Visit':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Industry / Company Name *"
                value={typeDetails.industry || ''}
                onChange={(e) => handleTypeFieldChange('industry', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Place / Location *"
                value={typeDetails.place || ''}
                onChange={(e) => handleTypeFieldChange('place', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Semester"
                value={typeDetails.semester || ''}
                onChange={(e) => handleTypeFieldChange('semester', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Class & Section"
                value={typeDetails.classSection || ''}
                onChange={(e) => handleTypeFieldChange('classSection', e.target.value)}
              />
            </Grid>
          </Grid>
        );

      case 'Capacity Development':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Development Category *"
                value={typeDetails.category || 'Soft Skills'}
                onChange={(e) => handleTypeFieldChange('category', e.target.value)}
              >
                <MenuItem value="Soft Skills">Soft Skills</MenuItem>
                <MenuItem value="Language and Communication">Language and Communication</MenuItem>
                <MenuItem value="Life Skills">Life Skills (Yoga, Physical Fitness, Hygiene)</MenuItem>
                <MenuItem value="ICT / Computing Skills">ICT / Computing Skills</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Trainer / Resource Person"
                value={typeDetails.resourcePerson || ''}
                onChange={(e) => handleTypeFieldChange('resourcePerson', e.target.value)}
              />
            </Grid>
          </Grid>
        );

      case 'Professional Body Activity':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Professional Body *"
                value={typeDetails.professionalBody || 'IEEE'}
                onChange={(e) => handleTypeFieldChange('professionalBody', e.target.value)}
              >
                <MenuItem value="IEEE">IEEE</MenuItem>
                <MenuItem value="ACM">ACM</MenuItem>
                <MenuItem value="CSI">CSI</MenuItem>
                <MenuItem value="ISTE">ISTE</MenuItem>
                <MenuItem value="IEI">IEI</MenuItem>
                <MenuItem value="ASME">ASME</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Resource Person / Lead"
                value={typeDetails.resourcePerson || ''}
                onChange={(e) => handleTypeFieldChange('resourcePerson', e.target.value)}
              />
            </Grid>
          </Grid>
        );

      case 'Alumni Interaction':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Alumni Name *"
                value={typeDetails.alumniName || ''}
                onChange={(e) => handleTypeFieldChange('alumniName', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Organization / Company"
                value={typeDetails.organization || ''}
                onChange={(e) => handleTypeFieldChange('organization', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Designation"
                value={typeDetails.designation || ''}
                onChange={(e) => handleTypeFieldChange('designation', e.target.value)}
              />
            </Grid>
          </Grid>
        );

      case 'FDP/PDP':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Program Title *"
                value={typeDetails.programTitle || ''}
                onChange={(e) => handleTypeFieldChange('programTitle', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Organizing Body / Institution"
                value={typeDetails.organization || ''}
                onChange={(e) => handleTypeFieldChange('organization', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Duration (e.g. 5 Days)"
                value={typeDetails.duration || '5 Days'}
                onChange={(e) => handleTypeFieldChange('duration', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Delivery Mode"
                value={typeDetails.mode || 'Offline'}
                onChange={(e) => handleTypeFieldChange('mode', e.target.value)}
              >
                <MenuItem value="Offline">Offline</MenuItem>
                <MenuItem value="Online">Online</MenuItem>
                <MenuItem value="Hybrid">Hybrid</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        );

      case 'Club Activity':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Club Name *"
                value={typeDetails.clubName || ''}
                onChange={(e) => handleTypeFieldChange('clubName', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Activity Focus / Details"
                value={typeDetails.eventDetails || ''}
                onChange={(e) => handleTypeFieldChange('eventDetails', e.target.value)}
              />
            </Grid>
          </Grid>
        );

      case 'Extension & Outreach':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Unit / Body *"
                value={typeDetails.unit || 'NSS'}
                onChange={(e) => handleTypeFieldChange('unit', e.target.value)}
              >
                <MenuItem value="NSS">NSS (National Service Scheme)</MenuItem>
                <MenuItem value="NCC">NCC</MenuItem>
                <MenuItem value="Red Cross">Youth Red Cross</MenuItem>
                <MenuItem value="Rotaract">Rotaract / Leo Club</MenuItem>
                <MenuItem value="Community Service">Community Service Cell</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Venue / Village / Location"
                value={typeDetails.venue || ''}
                onChange={(e) => handleTypeFieldChange('venue', e.target.value)}
              />
            </Grid>
          </Grid>
        );

      case 'Entrepreneurship Event':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                size="small"
                label="Event Type *"
                value={typeDetails.eventType || 'Ideathon'}
                onChange={(e) => handleTypeFieldChange('eventType', e.target.value)}
              >
                <MenuItem value="Ideathon">Ideathon</MenuItem>
                <MenuItem value="Hackathon">Hackathon</MenuItem>
                <MenuItem value="Boot Camp">Boot Camp</MenuItem>
                <MenuItem value="Pitching Event">Pitching Session</MenuItem>
                <MenuItem value="Startup Workshop">Startup Workshop</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Organized by / Cell"
                value={typeDetails.organizer || 'T-Hub / ED Cell'}
                onChange={(e) => handleTypeFieldChange('organizer', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Target Outcome"
                value={typeDetails.outcome || 'Prototype / Pitch'}
                onChange={(e) => handleTypeFieldChange('outcome', e.target.value)}
              />
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          py: 2.5,
          px: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              bgcolor: 'rgba(0, 78, 146, 0.1)',
              color: '#004e92',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Layers size={24} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
              {isEditing ? 'Edit Activity' : 'Create New Activity'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              University activity form • Students self-register once activity is enabled
            </Typography>
          </Box>
        </Box>
        <Button
          onClick={onClose}
          sx={{
            minWidth: 36,
            height: 36,
            p: 0,
            borderRadius: '50%',
            color: '#94a3b8',
            '&:hover': { bgcolor: '#f1f5f9', color: '#1e293b' }
          }}
        >
          ✕
        </Button>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: '#f8fafc' }}>
        {/* Enable/Disable Reminder Alert */}
        <Alert
          severity="info"
          icon={<Info size={18} />}
          sx={{
            mb: 3,
            borderRadius: '12px',
            bgcolor: '#eff6ff',
            color: '#1e40af',
            border: '1px solid #bfdbfe',
            '& .MuiAlert-icon': { color: '#2563eb' }
          }}
        >
          <Typography variant="body2" sx={{ fontSize: '0.825rem' }}>
            <strong>Note:</strong> Newly created activities are <strong>disabled by default</strong>. You can review all details and enable the activity whenever you are ready to open registrations to students.
          </Typography>
        </Alert>

        {/* Section 1: Core Details */}
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: '16px', border: '1px solid #e2e8f0', bgcolor: '#ffffff', mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b', mb: 2 }}>
            1. Core Information
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(12, 1fr)' },
              gap: 2
            }}
          >
            <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 8' } }}>
              <TextField
                fullWidth
                size="small"
                label="Activity Title *"
                placeholder="e.g. Two-Day National Workshop on Applied Cloud & DevOps"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                error={Boolean(errors.title)}
                helperText={errors.title}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />
            </Box>

            <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 4' } }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Activity Type *"
                value={activityType}
                onChange={(e) => handleTypeChange(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              >
                {ACTIVITY_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 6' } }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Academic Year *"
                value={academicYear}
                onChange={(e) => {
                  setAcademicYear(e.target.value);
                  const yObj = academicYears.find((y) => y._id === e.target.value);
                  if (yObj) setAcademicYearName(yObj.year || yObj.academicYear || yObj.name || '');
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              >
                {academicYears.map((ay) => {
                  const label = ay.year || ay.academicYear || ay.name || 'Unknown Year';
                  return (
                    <MenuItem key={ay._id} value={ay._id}>
                      {label} {ay.active ? ' (Active)' : ''}
                    </MenuItem>
                  );
                })}
              </TextField>
            </Box>

            <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 6' } }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Host Department"
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  const dObj = departments.find((d) => d._id === e.target.value);
                  if (dObj) setDepartmentName(dObj.name || '');
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              >
                {departments.map((dept) => (
                  <MenuItem key={dept._id} value={dept._id}>
                    {dept.name} ({dept.code || 'Dept'})
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 4' } }}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Start Date *"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                error={Boolean(errors.startDate)}
                helperText={errors.startDate}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />
            </Box>

            <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 4' } }}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="End Date *"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                error={Boolean(errors.endDate)}
                helperText={errors.endDate}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />
            </Box>

            <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 4' } }}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Registration Deadline"
                value={registrationDeadline}
                onChange={(e) => setRegistrationDeadline(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />
            </Box>

            <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 12' } }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Max Participant Capacity (0 for Unlimited)"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                helperText="Leave as 0 if there is no seat limit for this activity"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />
            </Box>

            <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 12' } }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description & Objectives"
                placeholder="Brief summary of the activity scope, learning outcomes, and prerequisites..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />
            </Box>
          </Box>
        </Paper>

        {/* Section 2: Dynamic Type Fields */}
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: '16px', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Sparkles size={18} color="#004e92" />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }}>
              2. {activityType} Details
            </Typography>
          </Box>
          {renderDynamicFields()}
        </Paper>
      </DialogContent>

      <DialogActions
        sx={{
          p: 2.5,
          bgcolor: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between'
        }}
      >
        <Button
          onClick={onClose}
          disabled={isSaving}
          sx={{ color: '#64748b', textTransform: 'none', fontWeight: 600 }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSaving}
          startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <CheckCircle2 size={18} />}
          sx={{
            borderRadius: '12px',
            bgcolor: '#004e92',
            color: '#ffffff',
            textTransform: 'none',
            fontWeight: 700,
            px: 3,
            py: 1,
            boxShadow: '0 4px 14px rgba(0, 78, 146, 0.25)',
            '&:hover': { bgcolor: '#003a6d' }
          }}
        >
          {isSaving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Activity')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
