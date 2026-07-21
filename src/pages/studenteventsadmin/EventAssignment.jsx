import React, { useState, useEffect, useCallback } from 'react';
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
  Delete as DeleteIcon,
  Add as AddIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/data/DataTable';
import API from '../../api/axios';
import { toast } from 'sonner';

const EventAssignment = () => {
  const [view, setView] = useState('list');
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await API.get('/api/event-assignments');
      setAssignments(response.data?.assignments || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
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

  const openCreateForm = () => {
    resetForm();
    setView('form');
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

  // --- Table Configuration ---
  const columns = ['#', 'Type', 'Target Event/Club', 'Assigned Coordinators', 'Actions'];

  const tableRows = assignments.map((assignment, index) => {
    const targetName = assignment.assignmentType === 'Club' 
        ? assignment.club?.name || 'Unknown Club' 
        : assignment.eventName;

    return [
      index + 1,
      <Chip 
        label={assignment.assignmentType} 
        size="small" 
        sx={{ 
          fontWeight: 600,
          bgcolor: 'rgba(59, 130, 246, 0.12)', 
          color: '#2563eb' 
        }} 
      />,
      targetName,
      {
        value: assignment.assignees?.length || 0,
        display: (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {assignment.assignees?.map((a, i) => (
               <Typography key={i} variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                 • {a.employeeName} ({a.roleAssigned})
               </Typography>
            ))}
          </Box>
        )
      },
      {
        value: '',
        display: (
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
            <IconButton
              size="small"
              onClick={() => openEditForm(assignment)}
              sx={{
                color: '#3b82f6',
                bgcolor: 'rgba(59, 130, 246, 0.1)',
                '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.2)' },
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleDeleteClick(assignment)}
              sx={{
                color: '#ef4444',
                bgcolor: 'rgba(239, 68, 68, 0.1)',
                '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.2)' },
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ),
      },
    ];
  });

  if (view === 'list') {
    return (
      <Box sx={{ p: 3 }}>
        <PageHeader
          title="Event Assignment"
          subtitle="Assign roles to coordinators and conveners"
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openCreateForm}
              sx={{
                borderRadius: '12px',
                px: 3,
                py: 1.2,
                fontWeight: 600,
                textTransform: 'none',
                background: 'var(--gradient-primary)',
              }}
            >
              New Assignment
            </Button>
          }
        />

        <DataTable
          columns={columns}
          rows={tableRows}
          nonSortableColumns={[3, 4]}
          alignments={['center', 'center', 'left', 'left', 'center']}
        />

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

      <Card sx={{ mt: 3, maxWidth: 800, mx: 'auto', boxShadow: 3, borderRadius: '16px' }}>
        <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
          
          <Box>
            <Typography variant="subtitle1" fontWeight="600" mb={1}>Assignment Type *</Typography>
            <FormControl fullWidth>
              <Select
                value={assignmentType}
                onChange={(e) => {
                  setAssignmentType(e.target.value);
                  setEventName('');
                  setClubId('');
                  setSelectedEmployees([]);
                  setErrors({});
                }}
                sx={{ borderRadius: '12px' }}
              >
                <MenuItem value="Fest">Fest</MenuItem>
                <MenuItem value="Club">Club</MenuItem>
                <MenuItem value="Other Event">Other Event</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {(assignmentType === 'Fest' || assignmentType === 'Other Event') && (
            <Box>
              <Typography variant="subtitle1" fontWeight="600" mb={1}>Event Name *</Typography>
              <TextField
                fullWidth
                placeholder="Enter event name"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                error={!!errors.eventName}
                helperText={errors.eventName}
              />
            </Box>
          )}

          {assignmentType === 'Club' && (
            <Box>
              <Typography variant="subtitle1" fontWeight="600" mb={1}>Select Club *</Typography>
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
            </Box>
          )}

          <Box>
            <Typography variant="subtitle1" fontWeight="600" mb={1}>
              Assignees *
            </Typography>
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
