import React, { useCallback, useEffect, useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowDownward as ArrowDownwardIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { toast } from 'sonner';
import API from '../../api/axios';
import PageHeader from '../../components/common/PageHeader';

const initialForm = { eventName: '', status: 'Active', coordinator: null };

const MajorEventGroups = () => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [searchingEmployees, setSearchingEmployees] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [view, setView] = useState('list');
  const [eventToDelete, setEventToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const selectedGroupIndex = groups.findIndex((group) => group._id === selectedGroup?._id);

  const fetchGroups = useCallback(async () => {
    setLoadingGroups(true);
    try {
      const response = await API.get('/api/major-events/groups');
      const majorGroups = response.data?.event_schools || [];
      setEventSchools(majorGroups);
      setSelectedGroup((current) => current || majorGroups[0] || null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load assigned groups');
    } finally {
      setLoadingGroups(false);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    if (!selectedGroup) {
      setEvents([]);
      return;
    }

    setLoadingEvents(true);
    try {
      const response = await API.get(`/api/major-events/groups/${selectedGroup._id}/events`);
      setEvents(response.data?.events || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load group events');
    } finally {
      setLoadingEvents(false);
    }
  }, [selectedGroup]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    if (!employeeSearch.trim()) {
      setEmployeeOptions([]);
      return undefined;
    }

    const timer = setTimeout(async () => {
      setSearchingEmployees(true);
      try {
        const response = await API.get('/api/employees/search', { params: { query: employeeSearch } });
        setEmployeeOptions(Array.isArray(response.data?.users) ? response.data.users : response.data || []);
      } catch {
        setEmployeeOptions([]);
      } finally {
        setSearchingEmployees(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [employeeSearch]);

  const selectGroup = (group) => {
    setSelectedGroup(group);
    setForm(initialForm);
    setEmployeeOptions([]);
    setEmployeeSearch('');
    setEditingEvent(null);
    setView('list');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedGroup || !form.eventName.trim() || !form.coordinator) {
      toast.error('Select a group, enter an event name, and assign an event coordinator');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        groupId: selectedGroup._id,
        eventName: form.eventName.trim(),
        status: form.status,
        coordinator: {
          employeeId: form.coordinator.institutionId,
          employeeName: form.coordinator.name,
          department: form.coordinator.department?.name || form.coordinator.department || 'N/A',
          designation: form.coordinator.designation || 'N/A',
        },
      };

      if (editingEvent) {
        await API.put(`/api/major-events/events/${editingEvent._id}`, payload);
        toast.success('Event updated successfully');
      } else {
        await API.post('/api/major-events/events', payload);
        toast.success('Event created successfully');
      }

      setForm(initialForm);
      setEditingEvent(null);
      setEmployeeOptions([]);
      setEmployeeSearch('');
      setView('list');
      await fetchEvents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (event) => {
    const coordinator = event.coordinator
      ? {
          name: event.coordinator.employeeName,
          institutionId: event.coordinator.employeeId,
          department: event.coordinator.department,
          designation: event.coordinator.designation,
        }
      : null;

    setEditingEvent(event);
    setForm({ eventName: event.eventName, status: event.status, coordinator });
    if (coordinator) setEmployeeOptions([coordinator]);
    setView('form');
  };

  const openCreateEventDialog = () => {
    resetEventForm();
    setView('form');
  };

  const handleDelete = async () => {
    if (!eventToDelete) return;
    setDeleting(true);
    try {
      await API.delete(`/api/major-events/events/${eventToDelete._id}`);
      toast.success('Event deleted successfully');
      setEventToDelete(null);
      await fetchEvents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete event');
    } finally {
      setDeleting(false);
    }
  };

  const resetEventForm = () => {
    setForm(initialForm);
    setEditingEvent(null);
    setEmployeeOptions([]);
    setEmployeeSearch('');
  };

  const renderEventCard = (event) => (
    <Card
      key={event._id}
      sx={{
        borderRadius: '18px',
        border: '1px solid rgba(15, 118, 110, 0.14)',
        boxShadow: '0 10px 24px rgba(15, 23, 42, 0.06)',
        overflow: 'hidden',
        height: '100%',
        minHeight: 186,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.15 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, minHeight: 54 }}>
          <Box sx={{ minWidth: 0, pt: 0.12 }}>
            <Typography variant="subtitle1" fontWeight={800} sx={{ color: '#0f172a', lineHeight: 1.2 }}>
              {event.eventName}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.2, display: 'block', lineHeight: 1.4 }}>
              Created: {event.createdAt ? new Date(event.createdAt).toLocaleDateString('en-GB') : 'N/A'}
            </Typography>
          </Box>
          <Chip
            label={event.status}
            size="small"
            color={event.status === 'Active' ? 'success' : 'default'}
            variant={event.status === 'Active' ? 'filled' : 'outlined'}
            sx={{ fontWeight: 700, ml: 1, mt: 0.15 }}
          />
        </Box>

        <Box sx={{ display: 'grid', gap: 0.65, mt: 0.05 }}>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.45, mb: 0.05 }}>
            <strong>Event Coordinator:</strong>{' '}
            {event.coordinator?.employeeName
              ? `${event.coordinator.employeeName} (${event.coordinator.employeeId || 'N/A'})`
              : 'Not assigned'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 'auto', pt: 0.2 }}>
          <IconButton
            size="small"
            aria-label="Edit event"
            onClick={() => handleEdit(event)}
            sx={{ color: '#2563eb', bgcolor: 'rgba(37, 99, 235, 0.1)' }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            aria-label="Delete event"
            onClick={() => setEventToDelete(event)}
            sx={{ color: '#dc2626', bgcolor: 'rgba(220, 38, 38, 0.1)' }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Card>
  );

  if (view === 'list') {
    return (
      <Box sx={{ p: 3 }}>
      <PageHeader
        title="Fest Groups"
        subtitle="Select a group to create and manage its events"
      />

      <Box sx={{ mt: 3, maxWidth: 1100, mx: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75, flexWrap: 'wrap' }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              px: 1.25,
              py: 0.4,
              borderRadius: '999px',
              bgcolor: 'rgba(15, 118, 110, 0.10)',
              color: '#0f766e',
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            VEDA
          </Box>
          <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>
            Assigned Fest Group Workflow
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.25 }}>
          Select one assigned group card to open its event workflow.
        </Typography>

        {loadingGroups ? (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 1.25, alignItems: 'stretch' }}>
            {event_schools.map((group) => {
              const isSelected = selectedGroup?._id === group._id;
              return (
                <Card
                  key={group._id}
                  onClick={() => selectGroup(group)}
                  sx={{
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: isSelected ? '#0f766e' : 'divider',
                    borderRadius: '14px',
                    boxShadow: isSelected ? '0 10px 28px rgba(15, 118, 110, 0.24)' : '0 2px 8px rgba(15, 23, 42, 0.05)',
                    transform: isSelected ? 'translateY(-2px)' : 'none',
                    transition: 'all 160ms ease',
                    overflow: 'hidden',
                    bgcolor: isSelected ? 'rgba(20, 184, 166, 0.04)' : 'rgba(255,255,255,0.82)',
                    minHeight: 118,
                  }}
                >
                  <CardContent sx={{ minHeight: 118, py: 1.75, px: 2.2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.25 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={800} sx={{ fontSize: '1rem', lineHeight: 1.3 }}>{group.groupName}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                          {group.assignedFestName}
                        </Typography>
                      </Box>
                      <Chip
                        label={isSelected ? 'Selected' : 'Open'}
                        size="small"
                        sx={{
                          color: isSelected ? '#0f766e' : '#475569',
                          bgcolor: isSelected ? 'rgba(20, 184, 166, 0.12)' : 'rgba(148, 163, 184, 0.12)',
                          fontWeight: 700,
                          px: 0.5,
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}

        {selectedGroup && (
          <Box
            aria-hidden="true"
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: `repeat(${Math.max(event_schools.length, 1)}, minmax(0, 1fr))` },
              height: 52,
              mt: 0,
            }}
          >
            <Box
              sx={{
                gridColumn: { xs: '1', sm: selectedGroupIndex + 1 },
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                color: '#0f766e',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: -1,
                  bottom: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  borderLeft: '2px dotted #0f766e',
                  opacity: 0.95,
                }}
              />
              <Box
                sx={{
                  zIndex: 1,
                  width: 32,
                  height: 32,
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: 'var(--bg-primary, #f8fafc)',
                  border: '1px solid rgba(15, 118, 110, 0.24)',
                  borderRadius: '50%',
                  boxShadow: '0 2px 8px rgba(15, 118, 110, 0.12)',
                }}
              >
                <ArrowDownwardIcon fontSize="small" />
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      <Card sx={{ mt: 0.75, maxWidth: 1100, mx: 'auto', borderRadius: '15px', boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)', overflow: 'hidden', border: '1px solid rgba(15, 118, 110, 0.14)', bgcolor: 'rgba(255,255,255,0.98)' }}>
        <Box
          sx={{
            px: { xs: 2, sm: 3.2 },
            pt: { xs: 1.9, sm: 2.5 },
            pb: { xs: 1.75, sm: 2 },
            background: 'linear-gradient(135deg, rgba(15, 118, 110, 0.07), rgba(37, 99, 235, 0.05))',
            borderBottom: '1px solid rgba(15, 118, 110, 0.12)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                px: 1.1,
                py: 0.35,
                borderRadius: '999px',
                bgcolor: 'rgba(15, 118, 110, 0.12)',
                color: '#0f766e',
                fontSize: '0.68rem',
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              Selected Group Workflow
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr auto' }, gap: 1.25, alignItems: 'center' }}>
            <Box>
              <Typography variant="h5" fontWeight={900} sx={{ color: '#0f172a', lineHeight: 1.12, fontSize: { xs: '1.3rem', sm: '1.5rem' } }}>
                {selectedGroup ? `${selectedGroup.groupName} Event Management` : 'Choose a group'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.45, maxWidth: 680 }}>
                Create a new event or review the assigned event cards for the selected group.
              </Typography>
            </Box>

            <Box
              sx={{
                minWidth: { xs: '100%', sm: 230 },
                px: 1.5,
                py: 1,
                borderRadius: '12px',
                border: '1px solid rgba(15, 118, 110, 0.18)',
                bgcolor: 'rgba(255,255,255,0.9)',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)',
              }}
            >
              <Typography variant="caption" sx={{ color: '#0f766e', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Active Group
              </Typography>
              <Typography variant="subtitle1" fontWeight={800} sx={{ mt: 0.35, color: '#0f172a' }}>
                {selectedGroup?.groupName || 'No group selected'}
              </Typography>
            </Box>
          </Box>
        </Box>

        <CardContent sx={{ p: { xs: 2.1, sm: 3.2 }, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box sx={{ p: { xs: 1.6, sm: 2.1 }, borderRadius: '14px', bgcolor: 'rgba(15, 118, 110, 0.045)', border: '1px solid rgba(15, 118, 110, 0.14)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.45)', minHeight: 220 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
              <Typography variant="subtitle1" fontWeight="700">
                {selectedGroup ? `${selectedGroup.groupName} Events` : 'Events'}
              </Typography>
              {selectedGroup && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={openCreateEventDialog}
                  sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, background: 'var(--gradient-primary)' }}
                >
                  Add Event
                </Button>
              )}
            </Box>

            {loadingEvents ? (
              <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 160 }}>
                <CircularProgress size={28} />
              </Box>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 1.25, alignItems: 'stretch' }}>
                {events.length === 0 ? (
                  <Box sx={{ gridColumn: '1 / -1', border: '1px dashed rgba(15, 118, 110, 0.28)', borderRadius: '14px', p: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      No events created for this group yet.
                    </Typography>
                  </Box>
                ) : (
                  events.map((event) => renderEventCard(event))
                )}
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      <Dialog open={Boolean(eventToDelete)} onClose={() => !deleting && setEventToDelete(null)}>
        <DialogTitle>Delete Event</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Delete the event {eventToDelete?.eventName ? `"${eventToDelete.eventName}"` : ''}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEventToDelete(null)} disabled={deleting}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
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
        subtitle={editingEvent ? 'Update the details for this event' : 'Add a new event to the selected group'}
        showBack
        onBack={() => { resetEventForm(); setView('list'); }}
      />
      <Card sx={{ mt: 3, maxWidth: 800, mx: 'auto', boxShadow: 3, borderRadius: '16px', overflow: 'hidden' }}>
        <Box sx={{ px: { xs: 2.5, sm: 4 }, pt: { xs: 2.5, sm: 4 } }}>
          <Typography variant="h6" fontWeight={700}>{editingEvent ? 'Edit Event Details' : 'New Event Details'}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Fill out the event details and assign an event coordinator.
          </Typography>
        </Box>
        <CardContent sx={{ p: { xs: 2.5, sm: 4 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box component="form" id="major-event-form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2.5 }}>
            <TextField label="Selected Group Name" value={selectedGroup?.groupName || ''} fullWidth disabled />
            <TextField
              label="Event Name"
              value={form.eventName}
              onChange={(event) => setForm((current) => ({ ...current, eventName: event.target.value }))}
              inputProps={{ maxLength: 200 }}
              required
              fullWidth
            />
            <Autocomplete
              options={employeeOptions}
              value={form.coordinator}
              loading={searchingEmployees}
              filterOptions={(options) => options}
              isOptionEqualToValue={(option, value) => option.institutionId === value.institutionId}
              getOptionLabel={(option) => `${option.name} (${option.institutionId})`}
              onChange={(event, value) => setForm((current) => ({ ...current, coordinator: value }))}
              onInputChange={(event, value) => setEmployeeSearch(value)}
              renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  return (
                    <li key={key} {...otherProps}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.5 }}>
                        <Typography variant="body2" fontWeight={600}>{option.name} ({option.institutionId})</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.department?.name || option.department || 'N/A'} • {option.designation || 'N/A'}
                        </Typography>
                      </Box>
                    </li>
                  );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Assign Event Coordinator *"
                  placeholder="Search employee by name or ID"
                  required={!form.coordinator}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <React.Fragment>
                        {searchingEmployees ? <CircularProgress size={18} /> : null}
                        {params.InputProps?.endAdornment}
                      </React.Fragment>
                    ),
                  }}
                />
              )}
            />
            <FormControl fullWidth>
              <InputLabel id="major-event-status-label">Status</InputLabel>
              <Select
                labelId="major-event-status-label"
                value={form.status}
                label="Status"
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 2 }}>
            <Button onClick={() => { resetEventForm(); setView('list'); }} disabled={submitting} variant="outlined" color="inherit" sx={{ borderRadius: '10px' }}>
              Cancel
            </Button>
            <Button type="submit" form="major-event-form" variant="contained" disabled={submitting || !selectedGroup} sx={{ borderRadius: '10px', px: 4, background: 'var(--gradient-primary)' }}>
              {submitting ? 'Saving...' : editingEvent ? 'Update Event' : 'Create Event'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default MajorEventGroups;
