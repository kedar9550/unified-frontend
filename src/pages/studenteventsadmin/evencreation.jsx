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
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/data/DataTable';
import API from '../../api/axios';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

const EventCreation = () => {
  const { activeRole, user } = useAuth();
  const [view, setView] = useState('list');
  const [events, setEvents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [departmentName, setDepartmentName] = useState('');
  const [eventName, setEventName] = useState('');
  const [price, setPrice] = useState('');
  const [maxTeamSize, setMaxTeamSize] = useState('');
  const [venue, setVenue] = useState('');
  const [extraTeamSize, setExtraTeamSize] = useState('');
  const [extraAmountPerHead, setExtraAmountPerHead] = useState('');
  const [overview, setOverview] = useState('');
  const [rules, setRules] = useState(['']);
  const [errors, setErrors] = useState({});
  const [selectedCoordinators, setSelectedCoordinators] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const fetchGroups = useCallback(async () => {
    try {
      const response = await API.get('/api/groups');
      const activeGroups = (response.data?.groups || []).filter((group) => group.status === 'Active');
      setGroups(activeGroups);
      if (activeRole === 'EVENT_COORDINATOR' && activeGroups.length > 0) {
        setSelectedGroup(activeGroups[0]);
        setDepartmentName(Array.isArray(activeGroups[0]?.department) ? activeGroups[0].department.map(d => d?.name).join(' & ') : activeGroups[0]?.department?.name || '');
      }
    } catch (error) {
      console.error('Failed to load groups', error);
      toast.error('Failed to load groups');
    }
  }, [activeRole]);

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
    fetchGroups();
    fetchEvents();
  }, [fetchGroups, fetchEvents]);

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
    if (activeRole === 'EVENT_COORDINATOR' && groups.length > 0) {
      setSelectedGroup(groups[0]);
      setDepartmentName(Array.isArray(groups[0]?.department) ? groups[0].department.map(d => d?.name).join(' & ') : groups[0]?.department?.name || '');
    } else {
      setSelectedGroup(null);
      setDepartmentName('');
    }
    setEventName('');
    setPrice('');
    setMaxTeamSize('');
    setVenue('');
    setExtraTeamSize('');
    setExtraAmountPerHead('');
    setOverview('');
    setRules(['']);
    setSelectedCoordinators([]);
    setSearchQuery('');
    setEmployeeOptions([]);
    setIsSearching(false);
    setErrors({});
  };

  const openCreateForm = () => {
    resetForm();
    setView('form');
  };

  const openEditForm = (event) => {
    const group = groups.find((g) => String(g._id) === String(event.group?._id || event.group)) || null;
    setEditingEvent(event);
    setSelectedGroup(group || null);
    setDepartmentName(Array.isArray(group?.department) ? group.department.map(d => d?.name).join(' & ') : group?.department?.name || event.department || '');
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
    setMaxTeamSize(event.maxTeamSize != null ? String(event.maxTeamSize) : '');
    setVenue(event.venue || '');
    setExtraTeamSize(event.extraTeamSize != null ? String(event.extraTeamSize) : '');
    setExtraAmountPerHead(event.extraAmountPerHead != null ? String(event.extraAmountPerHead) : '');
    setOverview(event.overview || '');
    setRules(event.rules && event.rules.length > 0 ? event.rules : ['']);
    setErrors({});
    setView('form');
  };

  const validateForm = () => {
    const newErrors = {};

    if (!selectedGroup) newErrors.group = 'Group is required.';
    if (!eventName.trim()) newErrors.eventName = 'Event Name is required.';
    if (eventName.length > 200) newErrors.eventName = 'Event Name cannot exceed 200 characters.';
    if (!price || Number(price) < 0) newErrors.price = 'Enter a valid price.';
    if (!maxTeamSize || Number(maxTeamSize) <= 0) newErrors.maxTeamSize = 'Enter a valid max team size.';
    if (!venue.trim()) newErrors.venue = 'Venue is required.';
    if (!selectedCoordinators || selectedCoordinators.length === 0) newErrors.facultyCoordinator = 'At least one Faculty Coordinator is required.';
    if (extraTeamSize === '' || Number(extraTeamSize) < 0) newErrors.extraTeamSize = 'Enter a valid extra team size.';
    if (extraAmountPerHead === '' || Number(extraAmountPerHead) < 0) newErrors.extraAmountPerHead = 'Enter a valid amount per head.';
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

    const payload = {
      groupId: selectedGroup?._id,
      eventName: eventName.trim(),
      price: Number(price),
      maxTeamSize: Number(maxTeamSize),
      venue: venue.trim(),
      extraTeamSize: Number(extraTeamSize),
      extraAmountPerHead: Number(extraAmountPerHead),
      overview: overview.trim(),
      rules: rules.filter((rule) => rule.trim()),
      facultyCoordinators: JSON.stringify(selectedCoordinators.map((coordinator) => ({
        employeeId: coordinator?.employeeId || coordinator?.institutionId || coordinator?.employeeCode || '',
        employeeName: coordinator?.employeeName || coordinator?.name || '',
        department: coordinator?.department || '',
        designation: coordinator?.designation || '',
      }))),
    };

    try {
      if (editingEvent) {
        const response = await API.put(`/api/events/${editingEvent._id}`, payload);
        if (response.data.success) {
          toast.success('Event updated successfully');
          fetchEvents();
          setView('list');
        } else {
          toast.error(response.data.message || 'Failed to update event.');
        }
      } else {
        const response = await API.post('/api/events', payload);
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

  const tableColumns = ['#', 'Group', 'Department', 'FACULTY Coordinators', 'Event Name', 'Venue', 'Max Team Size', 'Price'];
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
      event.group?.name || '',
      event.department ? event.department.replace(/,\s*/g, ' & ') : (Array.isArray(event.group?.department) ? event.group.department.map(d => d?.name).join(' & ') : event.group?.department?.name || ''),
      coordinatorLabel,
      event.eventName,
      event.venue,
      event.maxTeamSize || '',
      event.price != null && event.price > 0 ? `₹${event.price}` : '',
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
      </Box>
    );
  }

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
            <FormControl fullWidth error={!!errors.group}>
              <InputLabel id="group-label">Group</InputLabel>
              <Select
                labelId="group-label"
                value={selectedGroup?._id || ''}
                label="Group"
                disabled={activeRole === 'EVENT_COORDINATOR'}
                onChange={(e) => {
                  const group = groups.find((g) => g._id === e.target.value) || null;
                  setSelectedGroup(group);
                  setDepartmentName(Array.isArray(group?.department) ? group.department.map(d => d?.name).join(' & ') : group?.department?.name || '');
                }}
              >
                <MenuItem value="">Select Group</MenuItem>
                {groups.map((group) => (
                  <MenuItem key={group._id} value={group._id}>
                    {group.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.group && <FormHelperText>{errors.group}</FormHelperText>}
            </FormControl>

            {selectedGroup && (
              <TextField fullWidth label="Department" value={departmentName} InputProps={{ readOnly: true }} />
            )}

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

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
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
              <TextField
                fullWidth
                label="Venue"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                error={!!errors.venue}
                helperText={errors.venue}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <TextField
                fullWidth
                label="Extra Team Size"
                type="number"
                inputProps={{ min: 0 }}
                value={extraTeamSize}
                onChange={(e) => setExtraTeamSize(e.target.value)}
                error={!!errors.extraTeamSize}
                helperText={errors.extraTeamSize}
              />
              <TextField
                fullWidth
                label="Extra Amount Per Head"
                type="number"
                inputProps={{ min: 0 }}
                value={extraAmountPerHead}
                onChange={(e) => setExtraAmountPerHead(e.target.value)}
                error={!!errors.extraAmountPerHead}
                helperText={errors.extraAmountPerHead}
              />
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
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Rules (Enter the regulation in form of points.)
                </Typography>
                <Button variant="outlined" startIcon={<AddIcon />} onClick={addRule}>
                  Add Regulation
                </Button>
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
