import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  FormHelperText,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/data/DataTable';
import { fetchEventDepartments } from '../../api/eventDepartmentApi';
import API from '../../api/axios';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

const EventCreation = () => {
  const { activeRole, user } = useAuth();
  const [view, setView] = useState('list');
  const [events, setEvents] = useState([]);
  const [eventSchools, setEventSchools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [departmentsDialogOpen, setDepartmentsDialogOpen] = useState(false);
  const [departmentsToView, setDepartmentsToView] = useState([]);

  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [eventName, setEventName] = useState('');
  const [price, setPrice] = useState('');
  const [priceType, setPriceType] = useState('Per Head');
  const [maxTeamSize, setMaxTeamSize] = useState('');
  const [venue, setVenue] = useState('');
  const [venueType, setVenueType] = useState('');
  const [buildingId, setBuildingId] = useState('');
  const [floorId, setFloorId] = useState('');
  const [groundId, setGroundId] = useState('');
  const [roomNo, setRoomNo] = useState('');

  const [buildingsList, setBuildingsList] = useState([]);
  const [floorsList, setFloorsList] = useState([]);
  const [groundsList, setGroundsList] = useState([]);

  const [extraTeamSize, setExtraTeamSize] = useState('0');
  const [extraAmountPerHead, setExtraAmountPerHead] = useState('0');
  const [overview, setOverview] = useState('');
  const [rules, setRules] = useState(['']);
  const [errors, setErrors] = useState({});
  const [selectedCoordinators, setSelectedCoordinators] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [bannerError, setBannerError] = useState('');

  const fetchInfrastructure = useCallback(async () => {
    try {
      const [bRes, fRes, gRes] = await Promise.all([
        API.get('/api/infrastructure/buildings'),
        API.get('/api/infrastructure/floors'),
        API.get('/api/infrastructure/grounds'),
      ]);
      setBuildingsList(bRes.data?.data?.filter((b) => b.status?.toLowerCase() === 'active') || []);
      setFloorsList(fRes.data?.data?.filter((f) => f.status?.toLowerCase() === 'active') || []);
      setGroundsList(gRes.data?.data?.filter((g) => g.status?.toLowerCase() === 'active') || []);
    } catch (error) {
      console.error('Failed to load infrastructure data', error);
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await fetchEventDepartments();
      const activeDepts = (response.data?.departments || []).filter(d => d.status === 'Active');
      setDepartmentsList(activeDepts);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  }, []);

  const fetchSchools = useCallback(async () => {
    try {
      const response = await API.get('/api/event-schools');
      let activeGroups = (response.data?.eventSchools || []).filter((group) => group.status === 'Active');
      if (activeRole === 'SCHOOL_COORDINATOR' && user) {
        activeGroups = activeGroups.filter(school => school.coordinator?.employeeId === String(user.institutionId || user.employeeId || user.employeeCode));
      }
      setEventSchools(activeGroups);
      if (activeRole === 'SCHOOL_COORDINATOR' && activeGroups.length > 0) {
        setSelectedGroup(activeGroups[0]);
      }
    } catch (error) {
      console.error('Failed to load groups', error);
      toast.error('Failed to load groups');
    }
  }, [activeRole, user]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await API.get('/api/events');
      let fetchedEvents = response.data?.events || [];

      if (activeRole === 'FACULTY_COORDINATOR' && user) {
        fetchedEvents = fetchedEvents.filter(event => {
          const coordinators = Array.isArray(event.facultyCoordinators) && event.facultyCoordinators.length > 0
            ? event.facultyCoordinators
            : (event.facultyCoordinator ? [event.facultyCoordinator] : []);

          return coordinators.some(c =>
            c.employeeId === user.institutionId ||
            c.employeeId === user.employeeId ||
            c.employeeId === user.employeeCode
          );
        });
      }

      setEvents(fetchedEvents);
    } catch (error) {
      console.error('Failed to load events', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [activeRole, user]);

  useEffect(() => {
    fetchSchools();
    fetchEvents();
    fetchInfrastructure();
    fetchDepartments();
  }, [fetchSchools, fetchEvents, fetchInfrastructure, fetchDepartments]);

  useEffect(() => {
    if (!searchQuery || searchQuery.trim() === '') {
      setEmployeeOptions([]);
      return;
    }

    const debounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await API.get('/api/employees/search', {
          params: { query: searchQuery },
        });
        const users = response.data || [];
        setEmployeeOptions(Array.isArray(users) ? users : []);
      } catch (error) {
        console.error('Error searching employees:', error);
        setEmployeeOptions([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const resetForm = () => {
    setEditingEvent(null);
    if (activeRole === 'SCHOOL_COORDINATOR' && eventSchools.length > 0) {
      setSelectedGroup(eventSchools[0]);
    } else {
      setSelectedGroup(null);
    }
    setDepartments([]);
    setEventName('');
    setPrice('');
    setPriceType('Per Head');
    setMaxTeamSize('');
    setVenue('');
    setVenueType('');
    setBuildingId('');
    setFloorId('');
    setGroundId('');
    setRoomNo('');
    setExtraTeamSize('0');
    setExtraAmountPerHead('0');
    setOverview('');
    setRules(['']);
    setSelectedCoordinators([]);
    setSearchQuery('');
    setEmployeeOptions([]);
    setIsSearching(false);
    setBannerFile(null);
    setBannerPreview(null);
    setBannerError('');
    setErrors({});
  };

  const openCreateForm = () => {
    resetForm();
    setView('form');
  };

  const openEditForm = (event) => {
    const group = eventSchools.find((g) => String(g._id) === String(event.eventSchool?._id || event.eventSchool)) || null;
    setEditingEvent(event);
    setSelectedGroup(group || null);
    
    // Set departments (assuming event.department is now an array of ObjectIds or objects)
    const eventDepartments = Array.isArray(event.department) 
      ? event.department.map(d => d._id || d) 
      : [];
    setDepartments(eventDepartments);

    setSelectedCoordinators(event.facultyCoordinators?.length > 0 ? event.facultyCoordinators.map((coordinator) => ({
      employeeId: coordinator.employeeId || coordinator.institutionId || '',
      employeeName: coordinator.employeeName || '',
      department: coordinator.department || '',
      designation: coordinator.designation || '',
      name: coordinator.employeeName || '',
      institutionId: coordinator.employeeId || coordinator.institutionId || '',
    })) : event.facultyCoordinator ? [{
      employeeId: event.facultyCoordinator.employeeId || event.facultyCoordinator.institutionId || '',
      employeeName: event.facultyCoordinator.employeeName || '',
      department: event.facultyCoordinator.department || '',
      designation: event.facultyCoordinator.designation || '',
      name: event.facultyCoordinator.employeeName || '',
      institutionId: event.facultyCoordinator.employeeId || event.facultyCoordinator.institutionId || '',
    }] : []);
    setEventName(event.eventName || '');
    setPrice(event.price != null ? String(event.price) : '');
    setPriceType(event.priceType || 'Per Head');
    setMaxTeamSize(event.maxTeamSize != null ? String(event.maxTeamSize) : '');
    setVenueType(event.venueType || '');
    setBuildingId(event.building?._id || event.building || '');
    setFloorId(event.floor?._id || event.floor || '');
    setGroundId(event.ground?._id || event.ground || '');
    setRoomNo(event.roomNo || '');
    setExtraTeamSize(event.extraTeamSize != null ? String(event.extraTeamSize) : '0');
    setExtraAmountPerHead(event.extraAmountPerHead != null ? String(event.extraAmountPerHead) : '0');
    setOverview(event.overview || '');
    setRules(event.rules && event.rules.length > 0 ? event.rules : ['']);
    setBannerFile(null);
    setBannerPreview(event.bannerImage ? `${BACKEND_URL}${event.bannerImage}` : null);
    setBannerError('');
    setErrors({});
    setView('form');
  };

  const validateImage = (file) => {
    if (!VALID_IMAGE_TYPES.includes(file.type)) {
      return 'Please upload a valid image file (JPG, JPEG, PNG, WebP).';
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return 'Image size should not exceed 5 MB.';
    }
    return '';
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    setBannerError('');
    if (!file) return;

    const message = validateImage(file);
    if (message) {
      setBannerError(message);
      return;
    }

    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, bannerImage: null }));
  };

  const removeBanner = () => {
    setBannerFile(null);
    setBannerPreview(null);
    setBannerError('');
  };

  const validateForm = () => {
    const newErrors = {};

    if (!selectedGroup) newErrors.group = 'School is required.';
    if (!departments || departments.length === 0) newErrors.department = 'At least one department is required.';
    if (!eventName.trim()) newErrors.eventName = 'Event Name is required.';
    if (eventName.length > 200) newErrors.eventName = 'Event Name cannot exceed 200 characters.';
    if (!price || Number(price) < 0) newErrors.price = 'Enter a valid price.';
    if (!maxTeamSize || Number(maxTeamSize) <= 0) newErrors.maxTeamSize = 'Enter a valid max team size.';

    if (!venueType) {
      newErrors.venueType = 'Venue Type is required.';
    } else {
      if (venueType === 'Indoor') {
        if (!buildingId) newErrors.buildingId = 'Building is required.';
        if (!floorId) newErrors.floorId = 'Floor is required.';
      } else if (venueType === 'Outdoor') {
        if (!groundId) newErrors.groundId = 'Ground is required.';
      }
      if (!roomNo.trim()) newErrors.roomNo = 'Room No is required.';
    }

    if (!selectedCoordinators || selectedCoordinators.length === 0) newErrors.facultyCoordinator = 'At least one Faculty Coordinator is required.';
    if (extraTeamSize !== '' && Number(extraTeamSize) < 0) newErrors.extraTeamSize = 'Enter a valid extra team size (0 or more).';
    if (extraAmountPerHead !== '' && Number(extraAmountPerHead) < 0) newErrors.extraAmountPerHead = 'Enter a valid amount per head (0 or more).';
    if (!overview.trim()) newErrors.overview = 'Overview is required.';

    const ruleErrors = rules.map((rule) => !rule.trim());
    if (ruleErrors.every((isEmpty) => isEmpty)) {
      newErrors.rules = 'Add at least one regulation.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);

    const formData = new FormData();
    formData.append('eventSchoolId', selectedGroup?._id || '');
    formData.append('eventName', eventName.trim());
    formData.append('price', Number(price));
    formData.append('priceType', priceType);
    formData.append('maxTeamSize', Number(maxTeamSize));
    formData.append('venue', venue.trim());
    formData.append('venueType', venueType);
    if (buildingId) formData.append('building', buildingId);
    if (floorId) formData.append('floor', floorId);
    if (groundId) formData.append('ground', groundId);
    formData.append('roomNo', roomNo.trim());
    formData.append('extraTeamSize', Number(extraTeamSize));
    formData.append('extraAmountPerHead', Number(extraAmountPerHead));
    formData.append('overview', overview.trim());
    rules.filter((rule) => rule.trim()).forEach(rule => {
      formData.append('rules[]', rule);
    });
    formData.append('department', JSON.stringify(departments));
    formData.append('facultyCoordinators', JSON.stringify(selectedCoordinators.map((coordinator) => ({
      employeeId: coordinator?.employeeId || coordinator?.institutionId || coordinator?.employeeCode || '',
      employeeName: coordinator?.employeeName || coordinator?.name || '',
      department: coordinator?.department || '',
      designation: coordinator?.designation || '',
    }))));

    if (bannerFile) {
      formData.append('bannerImage', bannerFile);
    } else if (!bannerPreview) {
      formData.append('removeBanner', 'true');
    }

    try {
      if (editingEvent) {
        const response = await API.put(`/api/events/${editingEvent._id}`, formData);
        if (response.data.success) {
          toast.success('Event updated successfully');
          fetchEvents();
          setView('list');
        } else {
          toast.error(response.data.message || 'Failed to update event.');
        }
      } else {
        const response = await API.post('/api/events', formData);
        if (response.data.success) {
          toast.success('Event created successfully');
          fetchEvents();
          setView('list');
        } else {
          toast.error(response.data.message || 'Failed to create event.');
        }
      }
    } catch (error) {
      console.error('Failed to save event', error);
      toast.error(error.response?.data?.message || 'Failed to save event.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRuleChange = (index, value) => {
    setRules((currentRules) => currentRules.map((rule, i) => (i === index ? value : rule)));
    setErrors((prev) => ({ ...prev, rules: null }));
  };

  const addRule = () => setRules((currentRules) => [...currentRules, '']);

  const removeRule = (index) => setRules((currentRules) => currentRules.filter((_, i) => i !== index));

  const handleDeleteClick = (event) => {
    setEventToDelete(event);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!eventToDelete) return;
    try {
      const response = await API.delete(`/api/events/${eventToDelete._id}`);
      if (response.data.success) {
        toast.success('Event deleted successfully');
        fetchEvents();
      }
    } catch (error) {
      console.error('Failed to delete event', error);
      toast.error(error.response?.data?.message || 'Failed to delete event.');
    } finally {
      setDeleteDialogOpen(false);
      setEventToDelete(null);
    }
  };

  const cancelForm = () => {
    resetForm();
    setView('list');
  };

  const tableColumns = ['#', 'Event School', 'Department', 'FACULTY Coordinators', 'Event Name', 'Venue', 'Max Team Size', 'Price'];
  if (activeRole !== 'FACULTY_COORDINATOR') {
    tableColumns.push('Actions');
  }

  const tableRows = events.map((event, index) => {
    const coordinators = Array.isArray(event.facultyCoordinators) && event.facultyCoordinators.length > 0
      ? event.facultyCoordinators
      : event.facultyCoordinator ? [event.facultyCoordinator] : [];

    const coordinatorLabel = coordinators.length > 0
      ? coordinators.map((coordinator) => `${coordinator.employeeName || ''} (${coordinator.employeeId || coordinator.institutionId || ''})`).join(', ')
      : 'N/A';

    const row = [
      index + 1,
      event.eventSchool?.name || '',
      Array.isArray(event.department)
        ? (departmentsList.length > 0 && event.department.length === departmentsList.length 
            ? (
                <Typography 
                  variant="body2" 
                  sx={{ color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline' }} 
                  onClick={() => { setDepartmentsToView(event.department); setDepartmentsDialogOpen(true); }}
                >
                  All Departments
                </Typography>
              )
            : event.department.map(d => d?.name || d).join(' & ')) 
        : (event.department || 'N/A'),
      coordinatorLabel,
      event.eventName,
      event.venueType === 'Indoor' && event.building && event.floor
        ? `${event.building.name}, ${event.floor.name} (Room: ${event.roomNo})`
        : event.venueType === 'Outdoor' && event.ground
        ? `${event.ground.name} (Room: ${event.roomNo})`
        : event.venue || 'N/A',
      event.maxTeamSize || '',
      event.price != null && event.price > 0 ? `₹${event.price} (${event.priceType || 'Per Head'})` : '',
    ];

    if (activeRole !== 'FACULTY_COORDINATOR') {
      row.push({
        value: '',
        display: (
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
            <IconButton
              size="small"
              onClick={() => openEditForm(event)}
              sx={{ color: '#3b82f6', bgcolor: 'rgba(59, 130, 246, 0.1)', '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.2)' } }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleDeleteClick(event)}
              sx={{ color: '#ef4444', bgcolor: 'rgba(239, 68, 68, 0.1)', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.2)' } }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ),
      });
    }

    return row;
  });

  if (view === 'list') {
    return (
      <Box sx={{ p: 3 }}>
        <PageHeader
          title="Event Management"
          subtitle="Create and manage VEDA events"
          action={
            activeRole !== 'FACULTY_COORDINATOR' && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={openCreateForm}
                sx={{ borderRadius: '12px', px: 3, py: 1.2, textTransform: 'none' }}
              >
                Create Event
              </Button>
            )
          }
        />

        <DataTable
          columns={tableColumns}
          rows={tableRows}
          nonSortableColumns={activeRole !== 'FACULTY_COORDINATOR' ? [8] : []}
          alignments={
            activeRole !== 'FACULTY_COORDINATOR'
              ? ['center', 'left', 'left', 'left', 'left', 'center', 'center', 'center', 'center']
              : ['center', 'left', 'left', 'left', 'left', 'center', 'center', 'center']
          }
        />

        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Event</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete <strong>{eventToDelete?.eventName}</strong>?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)} variant="outlined">
              Cancel
            </Button>
            <Button onClick={confirmDelete} variant="contained" color="error">
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={departmentsDialogOpen} onClose={() => setDepartmentsDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>All Departments</DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, p: 1 }}>
              {departmentsToView.map((d, i) => (
                <Chip key={i} label={d?.name || d} sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#1e40af' }} />
              ))}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDepartmentsDialogOpen(false)} variant="contained" sx={{ textTransform: 'none' }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  const renderUploader = ({
    preview,
    onChange,
    onRemove,
    hasError,
    previewAlt,
    previewMaxHeight,
    hint,
  }) => {
    if (!preview) {
      return (
        <Box
          component="label"
          sx={{
            display: 'block',
            border: '2px dashed',
            borderColor: hasError ? 'error.main' : 'grey.300',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            bgcolor: 'background.default',
            transition: 'all 0.2s',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'action.hover',
            },
          }}
        >
          <input type="file" hidden accept=".jpg,.jpeg,.png,.webp" onChange={onChange} />
          <CloudUploadIcon
            sx={{ fontSize: 48, color: hasError ? 'error.main' : 'primary.main', mb: 1 }}
          />
          <Typography variant="h6" color="text.primary" gutterBottom>
            Click or drag file to upload
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {hint}
          </Typography>
        </Box>
      );
    }

    return (
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          borderRadius: 2,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <img
          src={preview}
          alt={previewAlt}
          style={{ maxWidth: '100%', maxHeight: `${previewMaxHeight}px`, objectFit: 'contain' }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            display: 'flex',
            gap: 1,
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            p: 0.5,
            borderRadius: 1,
            boxShadow: 1,
          }}
        >
          <Button variant="contained" component="label" size="small" color="primary">
            Replace
            <input type="file" hidden accept=".jpg,.jpeg,.png,.webp" onChange={onChange} />
          </Button>
          <IconButton color="error" onClick={onRemove} size="small">
            <DeleteIcon />
          </IconButton>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title={editingEvent ? 'Edit Event' : 'Create Event'}
        subtitle={editingEvent ? `Editing ${editingEvent.eventName}` : 'Fill in the details to create a new event'}
        showBack
        onBack={cancelForm}
      />

      <Card sx={{ mt: 3, maxWidth: 900, mx: 'auto', boxShadow: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={3}>
            <FormControl fullWidth error={!!errors.eventSchool}>
              <InputLabel id="group-label">Event School</InputLabel>
              <Select
                labelId="group-label"
                value={selectedGroup?._id || ''}
                label="School"
                disabled={activeRole === 'SCHOOL_COORDINATOR'}
                onChange={(e) => {
                  const group = eventSchools.find((g) => g._id === e.target.value) || null;
                  setSelectedGroup(group);
                }}
              >
                <MenuItem value="">Select School</MenuItem>
                {eventSchools.map((group) => (
                  <MenuItem key={group._id} value={group._id}>
                    {group.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.eventSchool && <FormHelperText>{errors.eventSchool}</FormHelperText>}
            </FormControl>

            <FormControl fullWidth error={!!errors.department}>
              <InputLabel id="department-label">Department</InputLabel>
              <Select
                labelId="department-label"
                multiple
                value={departments}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.includes('all')) {
                    if (departmentsList.length > 0 && departments.length === departmentsList.length) {
                      setDepartments([]);
                    } else {
                      setDepartments(departmentsList.map((d) => d._id));
                    }
                  } else {
                    setDepartments(value);
                  }
                }}
                label="Department"
                renderValue={(selected) => {
                  if (!selected || selected.length === 0) {
                    return <em>Select department(s)</em>;
                  }
                  if (departmentsList.length > 0 && selected.length === departmentsList.length) {
                    return 'All Departments';
                  }
                  return selected
                    .map((deptId) => departmentsList.find((dept) => dept._id === deptId)?.name || deptId)
                    .join(', ');
                }}
                MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}
              >
                {departmentsList.length > 0 && (
                  <MenuItem value="all">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <input
                        type="checkbox"
                        checked={departments.length === departmentsList.length}
                        readOnly
                        style={{ width: 16, height: 16 }}
                      />
                      <Typography sx={{ fontWeight: 'bold' }}>Select All</Typography>
                    </Box>
                  </MenuItem>
                )}
                {departmentsList.map((dept) => (
                  <MenuItem key={dept._id} value={dept._id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <input
                        type="checkbox"
                        checked={departments.includes(dept._id)}
                        readOnly
                        style={{ width: 16, height: 16 }}
                      />
                      <Typography>{dept.name}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              {errors.department && <FormHelperText>{errors.department}</FormHelperText>}
            </FormControl>
            <Autocomplete
              multiple
              options={employeeOptions}
              getOptionLabel={(option) => {
                if (!option) return '';
                const name = option.employeeName || option.name || '';
                const code = option.institutionId || option.employeeId || option.employeeCode || '';
                return code ? `${name} (${code})` : name;
              }}
              value={selectedCoordinators}
              onChange={(_, newValue) => {
                const normalized = Array.isArray(newValue)
                  ? newValue.map((item) => {
                    const code = item.institutionId || item.employeeId || item.employeeCode || '';
                    return {
                      ...item,
                      employeeId: code,
                      institutionId: code,
                      employeeName: item.employeeName || item.name || '',
                      name: item.employeeName || item.name || '',
                    };
                  })
                  : [];

                setSelectedCoordinators(normalized);
                setErrors((prev) => ({ ...prev, facultyCoordinator: null }));
              }}
              inputValue={searchQuery}
              onInputChange={(_, newInputValue) => setSearchQuery(newInputValue)}
              filterOptions={(x) => x}
              isOptionEqualToValue={(option, value) => {
                const optionCode = option.institutionId || option.employeeId || option.employeeCode || '';
                const valueCode = value.institutionId || value.employeeId || value.employeeCode || '';
                return optionCode === valueCode;
              }}
              loading={isSearching}
              noOptionsText={searchQuery ? 'No matches found' : 'Type to search'}
              renderInput={(params) => {
                const inputProps = params.InputProps || {};
                return (
                  <TextField
                    {...params}
                    label="Faculty Coordinators"
                    placeholder="Search by name or ID"
                    error={!!errors.facultyCoordinator}
                    helperText={errors.facultyCoordinator}
                    InputProps={{
                      ...inputProps,
                      endAdornment: (
                        <>
                          {isSearching ? <CircularProgress color="inherit" size={20} /> : null}
                          {inputProps.endAdornment}
                        </>
                      ),
                    }}
                    variant="outlined"
                  />
                );
              }}
              renderOption={(props, option) => (
                <Box component="li" {...props} key={option.employeeId || option._id || option.institutionId}>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="body2" fontWeight={600}>{option.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.designation || 'Staff'} • {option.department || 'Unknown'}
                    </Typography>
                  </Box>
                </Box>
              )}
              isOptionEqualToValue={(option, value) => option?.institutionId === value?.institutionId || option?.employeeId === value?.employeeId}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={`${option.employeeName || option.name || ''} (${option.employeeId || option.institutionId || ''})`}
                    {...getTagProps({ index })}
                    key={option.employeeId || option.institutionId || option._id || index}
                  />
                ))
              }
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr' }, gap: 2 }}>
              <TextField
                fullWidth
                label="Event Name"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                error={!!errors.eventName}
                helperText={errors.eventName}
              />
              <TextField
                fullWidth
                label="Price"
                type="number"
                inputProps={{ min: 0 }}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                error={!!errors.price}
                helperText={errors.price}
              />
              <FormControl fullWidth>
                <InputLabel id="price-type-label">Price Type</InputLabel>
                <Select
                  labelId="price-type-label"
                  label="Price Type"
                  value={priceType}
                  onChange={(e) => setPriceType(e.target.value)}
                >
                  <MenuItem value="Per Head">Per Head</MenuItem>
                  <MenuItem value="Per Team">Per Team</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <TextField
                fullWidth
                label="Max Team Size"
                type="number"
                inputProps={{ min: 1 }}
                value={maxTeamSize}
                onChange={(e) => setMaxTeamSize(e.target.value)}
                error={!!errors.maxTeamSize}
                helperText={errors.maxTeamSize}
              />
              <FormControl fullWidth error={!!errors.venueType}>
                <InputLabel>Venue Type</InputLabel>
                <Select
                  value={venueType}
                  label="Venue Type"
                  onChange={(e) => {
                    setVenueType(e.target.value);
                    setBuildingId('');
                    setFloorId('');
                    setGroundId('');
                    setRoomNo('');
                  }}
                >
                  <MenuItem value="Indoor">Indoor</MenuItem>
                  <MenuItem value="Outdoor">Outdoor</MenuItem>
                </Select>
                {errors.venueType && <FormHelperText>{errors.venueType}</FormHelperText>}
              </FormControl>
            </Box>

            {venueType === 'Indoor' && (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <FormControl fullWidth error={!!errors.buildingId}>
                  <InputLabel>Building</InputLabel>
                  <Select
                    value={buildingId}
                    label="Building"
                    onChange={(e) => setBuildingId(e.target.value)}
                  >
                    {buildingsList.map((b) => (
                      <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>
                    ))}
                  </Select>
                  {errors.buildingId && <FormHelperText>{errors.buildingId}</FormHelperText>}
                </FormControl>
                <FormControl fullWidth error={!!errors.floorId}>
                  <InputLabel>Floor</InputLabel>
                  <Select
                    value={floorId}
                    label="Floor"
                    onChange={(e) => setFloorId(e.target.value)}
                  >
                    {floorsList.map((f) => (
                      <MenuItem key={f._id} value={f._id}>{f.name}</MenuItem>
                    ))}
                  </Select>
                  {errors.floorId && <FormHelperText>{errors.floorId}</FormHelperText>}
                </FormControl>
              </Box>
            )}

            {venueType === 'Outdoor' && (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <FormControl fullWidth error={!!errors.groundId}>
                  <InputLabel>Ground</InputLabel>
                  <Select
                    value={groundId}
                    label="Ground"
                    onChange={(e) => setGroundId(e.target.value)}
                  >
                    {groundsList.map((g) => (
                      <MenuItem key={g._id} value={g._id}>{g.name}</MenuItem>
                    ))}
                  </Select>
                  {errors.groundId && <FormHelperText>{errors.groundId}</FormHelperText>}
                </FormControl>
                <Box />
              </Box>
            )}

            {venueType && (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <TextField
                  fullWidth
                  label="Room No"
                  value={roomNo}
                  onChange={(e) => setRoomNo(e.target.value)}
                  error={!!errors.roomNo}
                  helperText={errors.roomNo}
                />
                <Box />
              </Box>
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <TextField
                fullWidth
                label="Extra Team Size (Optional)"
                type="number"
                inputProps={{ min: 0 }}
                value={extraTeamSize}
                onChange={(e) => setExtraTeamSize(e.target.value)}
                error={!!errors.extraTeamSize}
                helperText={errors.extraTeamSize}
              />
              <TextField
                fullWidth
                label="Extra Amount Per Head (Optional)"
                type="number"
                inputProps={{ min: 0 }}
                value={extraAmountPerHead}
                onChange={(e) => setExtraAmountPerHead(e.target.value)}
                error={!!errors.extraAmountPerHead}
                helperText={errors.extraAmountPerHead}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={1}>
                Event Banner (Optional)
              </Typography>
              {renderUploader({
                preview: bannerPreview,
                onChange: handleBannerChange,
                onRemove: removeBanner,
                hasError: !!errors.bannerImage,
                previewAlt: 'Event Banner Preview',
                previewMaxHeight: 260,
                hint: 'Supports JPG, PNG, WebP. Max size: 5MB. Wide image (16:9) recommended.',
              })}
              {bannerError && (
                <FormHelperText error sx={{ mt: 1, ml: 1 }}>
                  {bannerError}
                </FormHelperText>
              )}
            </Box>

            <TextField
              fullWidth
              label="Overview"
              multiline
              minRows={4}
              value={overview}
              onChange={(e) => setOverview(e.target.value)}
              error={!!errors.overview}
              helperText={errors.overview}
            />

            <Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Rules (Enter the regulation in form of points.)
                </Typography>
              </Box>

              <Stack spacing={2}>
                {rules.map((rule, index) => (
                  <Box key={`rule-${index}`} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr auto' }, gap: 2 }}>
                    <TextField
                      fullWidth
                      label={`Regulation ${index + 1}`}
                      value={rule}
                      onChange={(e) => handleRuleChange(index, e.target.value)}
                      error={!!errors.rules && !rule.trim()}
                      helperText={index === rules.length - 1 && errors.rules ? errors.rules : ''}
                    />
                    <IconButton
                      aria-label="remove regulation"
                      onClick={() => removeRule(index)}
                      disabled={rules.length === 1}
                      sx={{ alignSelf: 'center', ml: 0.5 }}
                    >
                      <RemoveIcon />
                    </IconButton>
                  </Box>
                ))}
              </Stack>

              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={addRule}
                  sx={{
                    bgcolor: '#0d9488',
                    '&:hover': { bgcolor: '#0f766e' },
                    textTransform: 'none',
                    px: 3
                  }}
                >
                  Add Regulation
                </Button>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 1 }}>
              <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={cancelForm}>
                Back
              </Button>
              <Button variant="outlined" onClick={resetForm}>
                Clear
              </Button>
              <Button variant="contained" onClick={onSubmit} disabled={submitting}>
                {editingEvent ? 'Save Changes' : 'Create Event'}
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EventCreation;
