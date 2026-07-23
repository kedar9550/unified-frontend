import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import {
  AccountBalance as OtherEventIcon,
  ArrowDownward as ArrowDownwardIcon,
  ChevronRight as ChevronRightIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Celebration as FestIcon,
  Edit as EditIcon,
  Groups as ClubIcon,
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import API from '../../api/axios';
import { toast } from 'sonner';

const EventAssignment = () => {
  const [view, setView] = useState('list');
  const [selectedType, setSelectedType] = useState('Fest');
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [assignments, setAssignments] = useState([]);

  // Form State
  const [assignmentType, setAssignmentType] = useState('Fest');
  const [eventName, setEventName] = useState('');
  const [clubId, setClubId] = useState('');
  const [clubs, setClubs] = useState([]);
  
  // Assignee Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);

  const assignmentTypes = [
    {
      value: 'Fest',
      label: 'Fest',
      description: 'Assign conveners to university fests.',
      role: 'CONVENER',
      icon: <FestIcon />,
      color: '#0f766e',
      background: 'rgba(20, 184, 166, 0.12)',
    },
    {
      value: 'Club',
      label: 'Club',
      description: 'Assign coordinators to student clubs.',
      role: 'CLUB COORDINATOR',
      icon: <ClubIcon />,
      color: '#2563eb',
      background: 'rgba(59, 130, 246, 0.12)',
    },
    {
      value: 'Other Event',
      label: 'Other Events',
      description: 'Assign coordinators to other events.',
      role: 'EVENT COORDINATOR',
      icon: <OtherEventIcon />,
      color: '#c2410c',
      background: 'rgba(249, 115, 22, 0.12)',
    },
  ];

  const selectedTypeMeta = assignmentTypes.find((type) => type.value === selectedType) || assignmentTypes[0];
  const formTypeMeta = assignmentTypes.find((type) => type.value === assignmentType) || assignmentTypes[0];
  const selectedTypeIndex = assignmentTypes.findIndex((type) => type.value === selectedType);

  const assignmentSummary = useMemo(() => ({
    Fest: assignments.filter((assignment) => assignment.assignmentType === 'Fest').length,
    Club: assignments.filter((assignment) => assignment.assignmentType === 'Club').length,
    'Other Event': assignments.filter((assignment) => assignment.assignmentType === 'Other Event').length,
  }), [assignments]);

  const renderSelectedAssignmentSection = () => {
    const typeAssignments = assignments.filter((assignment) => assignment.assignmentType === selectedType);

    return (
      <Box
        sx={{
          p: { xs: 2, sm: 2.5 },
          borderRadius: '16px',
          border: '1px solid',
          borderColor: selectedTypeMeta.color,
          bgcolor: selectedTypeMeta.background,
          boxShadow: `0 8px 24px ${selectedTypeMeta.color}18`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box sx={{ width: 36, height: 36, display: 'grid', placeItems: 'center', borderRadius: '50%', bgcolor: selectedTypeMeta.background, color: selectedTypeMeta.color }}>
              {selectedTypeMeta.icon}
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>{selectedTypeMeta.label} Assignments</Typography>
              <Typography variant="body2" color="text.secondary">{selectedTypeMeta.description}</Typography>
            </Box>
          </Box>
          <Chip label={`${typeAssignments.length} total`} size="small" sx={{ color: selectedTypeMeta.color, bgcolor: 'rgba(255,255,255,0.8)', fontWeight: 700 }} />
        </Box>

        {typeAssignments.length ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 1.5 }}>
            {typeAssignments.map((assignment) => {
              const targetName = assignment.assignmentType === 'Club' ? assignment.club?.name || 'Unknown Club' : assignment.eventName;
              return (
                <Box
                  key={assignment._id}
                  sx={{
                    p: 2,
                    borderRadius: '12px',
                    bgcolor: 'background.paper',
                    border: '1px solid rgba(148, 163, 184, 0.22)',
                    boxShadow: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle1" fontWeight={700} sx={{ overflowWrap: 'anywhere' }}>{targetName}</Typography>
                      <Typography variant="caption" color="text.secondary">{assignment.assignmentType}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                      <IconButton size="small" aria-label="Edit assignment" onClick={() => openEditForm(assignment)} sx={{ color: '#2563eb', bgcolor: 'rgba(37, 99, 235, 0.1)' }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" aria-label="Delete assignment" onClick={() => handleDeleteClick(assignment)} sx={{ color: '#dc2626', bgcolor: 'rgba(220, 38, 38, 0.1)' }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  <Box sx={{ mt: 1.5, pt: 1.25, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary">Assigned employees</Typography>
                    {assignment.assignees?.map((assignee) => (
                      <Typography key={assignee.employeeId} variant="body2" sx={{ mt: 0.5 }}>
                        {assignee.employeeName} ({assignee.employeeId})
                      </Typography>
                    ))}
                  </Box>
                  <Chip label={`${assignment.assignees?.length || 0} assigned`} size="small" sx={{ mt: 1.5, color: selectedTypeMeta.color, bgcolor: selectedTypeMeta.background, fontWeight: 700 }} />
                </Box>
              );
            })}
          </Box>
        ) : (
          <Box sx={{ p: 2, borderRadius: '10px', bgcolor: 'rgba(148, 163, 184, 0.08)' }}>
            <Typography variant="body2" color="text.secondary">No {selectedTypeMeta.label.toLowerCase()} assignments have been created yet.</Typography>
          </Box>
        )}
      </Box>
    );
  };

  const fetchAssignments = useCallback(async () => {
    try {
      const response = await API.get('/api/event-assignments');
      setAssignments(response.data?.assignments || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to load assignments');
    }
  }, []);

  const fetchClubs = useCallback(async () => {
    try {
      const response = await API.get('/api/clubs');
      setClubs(response.data?.clubs || []);
    } catch (error) {
      console.error('Error fetching clubs:', error);
      toast.error('Failed to load clubs');
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  useEffect(() => {
    if (assignmentType === 'Club' && clubs.length === 0) {
      fetchClubs();
    }
  }, [assignmentType, clubs.length, fetchClubs]);

  // Employee search with debounce
  useEffect(() => {
    if (!searchQuery || searchQuery.trim() === '') {
      setEmployeeOptions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await API.get('/api/employees/search', {
          params: { query: searchQuery },
        });
        const users = response.data?.users || response.data || [];
        setEmployeeOptions(Array.isArray(users) ? users : []);
      } catch (error) {
        console.error('Error searching employees:', error);
        setEmployeeOptions([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const validateForm = () => {
    const newErrors = {};
    if ((assignmentType === 'Fest' || assignmentType === 'Other Event') && !eventName.trim()) {
      newErrors.eventName = 'Event Name is required.';
    }
    if (assignmentType === 'Club' && !clubId) {
      newErrors.clubId = 'Club selection is required.';
    }
    if (selectedEmployees.length === 0) {
      newErrors.assignees = 'At least one coordinator/convener must be assigned.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setAssignmentType('Fest');
    setEventName('');
    setClubId('');
    setSelectedEmployees([]);
    setSearchQuery('');
    setErrors({});
    setEditingAssignment(null);
  };

  const openEditForm = (assignment) => {
    setEditingAssignment(assignment);
    setAssignmentType(assignment.assignmentType);
    if (assignment.assignmentType === 'Club') {
      setClubId(assignment.club?._id || assignment.club || '');
      setEventName('');
    } else {
      setEventName(assignment.eventName || '');
      setClubId('');
    }
    
    if (assignment.assignees && Array.isArray(assignment.assignees)) {
      setSelectedEmployees(assignment.assignees.map(a => ({
        institutionId: a.employeeId,
        name: a.employeeName,
        department: a.department,
        designation: a.designation
      })));
    } else {
      setSelectedEmployees([]);
    }
    
    setErrors({});
    setView('form');
  };

  const goBackToList = () => {
    resetForm();
    setView('list');
    fetchAssignments();
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    const payload = {
      assignmentType,
      eventName: assignmentType === 'Club' ? undefined : eventName,
      club: assignmentType === 'Club' ? clubId : undefined,
      assignees: selectedEmployees.map(emp => ({
        employeeId: emp.institutionId,
        employeeName: emp.name,
        department: emp.department?.name || emp.department || 'N/A',
        designation: emp.designation || 'N/A'
      }))
    };

    try {
      if (editingAssignment) {
        const response = await API.put(`/api/event-assignments/${editingAssignment._id}`, payload);
        if (response.data.success) {
          toast.success('Assignment updated successfully!');
          goBackToList();
        }
      } else {
        const response = await API.post('/api/event-assignments', payload);
        if (response.data.success) {
          toast.success('Assignment created successfully!');
          goBackToList();
        }
      }
    } catch (error) {
      console.error('Error saving assignment:', error);
      toast.error(error.response?.data?.message || 'Failed to create assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (assignment) => {
    setAssignmentToDelete(assignment);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!assignmentToDelete) return;
    try {
      const response = await API.delete(`/api/event-assignments/${assignmentToDelete._id}`);
      if (response.data.success) {
        toast.success('Assignment deleted successfully!');
        fetchAssignments();
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error(error.response?.data?.message || 'Failed to delete assignment.');
    } finally {
      setDeleteDialogOpen(false);
      setAssignmentToDelete(null);
    }
  };

  if (view === 'list') {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <PageHeader
          title="Event Assignment"
          subtitle="Choose an event type to manage its assignments"
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                resetForm();
                setAssignmentType(selectedType);
                setView('form');
              }}
              sx={{
                borderRadius: '12px',
                px: 3,
                py: 1.2,
                fontWeight: 600,
                textTransform: 'none',
                background: 'var(--gradient-primary)',
              }}
            >
              New {selectedTypeMeta.label} Assignment
            </Button>
          }
        />

        <Box sx={{ mt: 3 }}>
          

          <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>Assignment Types</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            Select a category to view and manage its assigned employees.
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
            {assignmentTypes.map((type) => {
              const count = assignments.filter((assignment) => assignment.assignmentType === type.value).length;
              const isSelected = selectedType === type.value;
              return (
                <Card
                  key={type.value}
                  onClick={() => setSelectedType(type.value)}
                  sx={{
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: isSelected ? type.color : 'divider',
                    borderRadius: '14px',
                    boxShadow: isSelected ? `0 8px 24px ${type.color}24` : 1,
                    transform: isSelected ? 'translateY(-2px)' : 'none',
                    transition: 'all 160ms ease',
                  }}
                >
                  <CardContent sx={{ minHeight: 150 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 42, height: 42, display: 'grid', placeItems: 'center', borderRadius: '50%', bgcolor: type.background, color: type.color }}>
                          {type.icon}
                        </Box>
                        <Typography fontWeight={700}>{type.label}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h5" fontWeight={800} sx={{ color: type.color }}>{count}</Typography>
                        <ChevronRightIcon sx={{ color: isSelected ? type.color : 'text.disabled' }} />
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>{type.description}</Typography>
                    <Chip label={type.role} size="small" sx={{ mt: 2, color: type.color, bgcolor: type.background, fontWeight: 700 }} />
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </Box>

        <Box
          aria-hidden="true"
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
            height: 58,
            mt: 0.5,
          }}
        >
          <Box
            sx={{
              gridColumn: { xs: '1', sm: selectedTypeIndex + 1 },
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              color: selectedTypeMeta.color,
            }}
          >
            <Box sx={{ position: 'absolute', top: 0, bottom: 0, borderLeft: `2px dotted ${selectedTypeMeta.color}` }} />
            <Box sx={{ zIndex: 1, width: 28, height: 28, display: 'grid', placeItems: 'center', bgcolor: 'var(--bg-primary, #f8fafc)', borderRadius: '50%' }}>
              <ArrowDownwardIcon fontSize="small" />
            </Box>
          </Box>
        </Box>

        <Box sx={{ mt: 4, maxWidth: 1100, mx: 'auto', display: 'grid', gap: 2.5 }}>
          {renderSelectedAssignmentSection()}
        </Box>

        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: '16px' } }}>
          <DialogTitle sx={{ fontWeight: 700 }}>Delete Assignment</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this assignment? Assigned users will retain their roles in the system until manually revoked, but this record will be deleted.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDeleteDialogOpen(false)} variant="outlined" sx={{ borderRadius: '10px' }}>Cancel</Button>
            <Button onClick={confirmDelete} variant="contained" color="error" sx={{ borderRadius: '10px' }}>Delete</Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title={editingAssignment ? 'Edit Assignment' : 'Create Assignment'}
        subtitle={editingAssignment ? 'Update the details for this assignment' : 'Assign employees to an event or club'}
        showBack
        onBack={goBackToList}
      />

      <Card sx={{ mt: 3, maxWidth: 1000, mx: 'auto', boxShadow: 3, borderRadius: '16px', overflow: 'hidden' }}>
        <Box sx={{ px: { xs: 2.5, sm: 4 }, pt: { xs: 2.5, sm: 4 } }}>
          <Typography variant="overline" sx={{ color: formTypeMeta.color, fontWeight: 800, letterSpacing: '0.12em' }}>
            Assignment workflow
          </Typography>
          <Typography variant="h6" fontWeight={700}>{formTypeMeta.label} assignment</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Select the event type, choose its target, then assign the responsible employees.
          </Typography>
        </Box>
        <CardContent sx={{ p: { xs: 2.5, sm: 4 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
          
          <Box>
            <Typography variant="subtitle1" fontWeight="700" mb={1.5}>1. Choose assignment type</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 1.5 }}>
              {assignmentTypes.map((type) => (
                <Box
                  key={type.value}
                  onClick={() => {
                    setAssignmentType(type.value);
                    setEventName('');
                    setClubId('');
                    setSelectedEmployees([]);
                    setErrors({});
                  }}
                  sx={{
                    p: 1.5,
                    border: '1px solid',
                    borderColor: assignmentType === type.value ? type.color : 'divider',
                    bgcolor: assignmentType === type.value ? type.background : 'transparent',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 160ms ease',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ color: type.color }}>{type.icon}</Box>
                    <Typography fontWeight={700}>{type.label}</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">{type.description}</Typography>
                </Box>
              ))}
            </Box>
          </Box>

          <Box sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: '14px', bgcolor: 'rgba(15, 118, 110, 0.045)', border: '1px solid rgba(15, 118, 110, 0.14)' }}>
            <Typography variant="subtitle1" fontWeight="700" mb={1.5}>2. Choose target</Typography>
            {(assignmentType === 'Fest' || assignmentType === 'Other Event') && (
              <TextField
                fullWidth
                label={assignmentType === 'Fest' ? 'Fest Name *' : 'Event Name *'}
                placeholder={assignmentType === 'Fest' ? 'Example: VEDA or COLOURS' : 'Enter event name'}
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                error={!!errors.eventName}
                helperText={errors.eventName}
              />
            )}

            {assignmentType === 'Club' && (
              <FormControl fullWidth error={!!errors.clubId}>
                <Select
                  value={clubId}
                  onChange={(e) => {
                    const newClubId = e.target.value;
                    setClubId(newClubId);
                    // Automatically select coordinators when a club is selected
                    const selectedClub = clubs.find(c => c._id === newClubId);
                    if (selectedClub && selectedClub.coordinators) {
                      const prefilled = selectedClub.coordinators.map(c => ({
                          institutionId: c.employeeId,
                          name: c.employeeName,
                          department: c.department,
                          designation: c.designation
                      }));
                      setSelectedEmployees(prefilled);
                      setErrors(prev => ({ ...prev, assignees: null, clubId: null }));
                    } else {
                      setSelectedEmployees([]);
                    }
                  }}
                  sx={{ borderRadius: '12px' }}
                  displayEmpty
                >
                  <MenuItem value="" disabled>Select a club</MenuItem>
                  {clubs.map(c => (
                    <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
                  ))}
                </Select>
                {errors.clubId && <Typography color="error" variant="caption" sx={{ ml: 2, mt: 0.5 }}>{errors.clubId}</Typography>}
              </FormControl>
            )}
          </Box>

          <Box sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: '14px', bgcolor: 'rgba(37, 99, 235, 0.045)', border: '1px solid rgba(37, 99, 235, 0.14)' }}>
            <Typography variant="subtitle1" fontWeight="700" mb={1.5}>3. Assign employees</Typography>
            <Autocomplete
              multiple
              options={employeeOptions}
              getOptionLabel={(option) => `${option.name} (${option.institutionId})`}
              isOptionEqualToValue={(option, value) => option.institutionId === value.institutionId}
              filterOptions={(x) => x}
              loading={isSearching}
              value={selectedEmployees}
              onChange={(event, newValue) => {
                setSelectedEmployees(newValue);
                if (newValue.length > 0) setErrors(prev => ({ ...prev, assignees: null }));
              }}
              onInputChange={(event, newInputValue) => setSearchQuery(newInputValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Search employees by Name or ID..."
                  error={!!errors.assignees}
                  helperText={errors.assignees}
                  InputProps={{
                    ...(params.InputProps || {}),
                    endAdornment: (
                      <React.Fragment>
                        {isSearching ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps?.endAdornment}
                      </React.Fragment>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  return (
                      <li key={key} {...otherProps}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.5 }}>
                              <Typography variant="body1" fontWeight="500">
                                  {option.name} <Typography component="span" variant="body2" color="text.secondary">({option.institutionId})</Typography>
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                  {option.department?.name || option.department} • {option.designation}
                              </Typography>
                          </Box>
                      </li>
                  );
              }}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return (
                      <Chip
                        key={key}
                        label={`${option.name} (${option.institutionId})`}
                        {...tagProps}
                        color="primary"
                        variant="outlined"
                        sx={{ m: 0.5 }}
                      />
                    );
                })
              }
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Selected employees will be assigned the role: 
              <strong>
                {assignmentType === 'Fest' ? ' CONVENER' : assignmentType === 'Club' ? ' CLUB COORDINATOR' : ' EVENT COORDINATOR'}
              </strong>
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 2 }}>
            <Button variant="outlined" color="inherit" onClick={goBackToList} sx={{ borderRadius: '10px' }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting}
              sx={{ borderRadius: '10px', px: 4, background: 'var(--gradient-primary)' }}
            >
              {submitting ? 'Saving...' : editingAssignment ? 'Update Assignment' : 'Save Assignment'}
            </Button>
          </Box>

        </CardContent>
      </Card>
    </Box>
  );
};

export default EventAssignment;
