import React, { useCallback, useEffect, useState } from 'react';
import {
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
  Autocomplete,
} from '@mui/material';
import { Add as AddIcon, ArrowDownward as ArrowDownwardIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { toast } from 'sonner';
import API from '../../api/axios';
import PageHeader from '../../components/common/PageHeader';

const initialForm = { groupName: '', status: 'Active', majorEventAdmin: null };

const FestManagement = () => {
  const [fests, setFests] = useState([]);
  const [selectedFest, setSelectedFest] = useState('');
  const [groups, setGroups] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loadingFests, setLoadingFests] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [searchingEmployees, setSearchingEmployees] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const selectedFestIndex = fests.findIndex((fest) => fest === selectedFest);

  const fetchFests = useCallback(async () => {
    setLoadingFests(true);
    try {
      const response = await API.get('/api/event-assignments/mine/fests');
      const assignedFests = [...new Map(
        (response.data?.assignments || [])
          .filter((assignment) => assignment.eventName)
          .map((assignment) => [assignment.eventName, assignment.eventName])
      ).values()];
      setFests(assignedFests);
      setSelectedFest((current) => current || assignedFests[0] || '');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load assigned fests');
    } finally {
      setLoadingFests(false);
    }
  }, []);

  const fetchGroups = useCallback(async () => {
    if (!selectedFest) {
      setGroups([]);
      return;
    }

    setLoadingGroups(true);
    try {
      const response = await API.get('/api/event-groups', { params: { festName: selectedFest } });
      setGroups(response.data?.groups || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load groups');
    } finally {
      setLoadingGroups(false);
    }
  }, [selectedFest]);

  useEffect(() => {
    fetchFests();
  }, [fetchFests]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFest || !form.groupName.trim() || !form.majorEventAdmin) {
      toast.error('Select a fest, enter a group name, and assign a major event admin');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        groupName: form.groupName.trim(),
        assignedFestName: selectedFest,
        majorEventAdmin: {
          employeeId: form.majorEventAdmin.institutionId,
          employeeName: form.majorEventAdmin.name,
          department: form.majorEventAdmin.department?.name || form.majorEventAdmin.department || 'N/A',
          designation: form.majorEventAdmin.designation || 'N/A',
        },
      };
      if (editingGroup) {
        await API.put(`/api/event-groups/${editingGroup._id}`, payload);
        toast.success('Group updated successfully');
      } else {
        await API.post('/api/event-groups', payload);
        toast.success('Group created successfully');
      }
      setForm(initialForm);
      setEditingGroup(null);
      setGroupDialogOpen(false);
      await fetchGroups();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create group');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (group) => {
    const admin = group.majorEventAdmin
      ? {
          name: group.majorEventAdmin.employeeName,
          institutionId: group.majorEventAdmin.employeeId,
          department: group.majorEventAdmin.department,
          designation: group.majorEventAdmin.designation,
        }
      : null;
    setEditingGroup(group);
    setSelectedFest(group.assignedFestName);
    setForm({ groupName: group.groupName, status: group.status, majorEventAdmin: admin });
    if (admin) setEmployeeOptions([admin]);
    setGroupDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!groupToDelete) return;
    setDeleting(true);
    try {
      await API.delete(`/api/event-groups/${groupToDelete._id}`);
      toast.success('Group deleted successfully');
      setGroupToDelete(null);
      await fetchGroups();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete group');
    } finally {
      setDeleting(false);
    }
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingGroup(null);
    setEmployeeOptions([]);
    setEmployeeSearch('');
  };

  const openCreateGroupDialog = () => {
    resetForm();
    setGroupDialogOpen(true);
  };

  const renderGroupCard = (group) => (
    <Card
      key={group._id}
      sx={{
        borderRadius: '18px',
        border: '1px solid rgba(15, 118, 110, 0.14)',
        boxShadow: '0 10px 24px rgba(15, 23, 42, 0.06)',
        overflow: 'hidden',
        height: '100%',
        minHeight: 190,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.15 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, minHeight: 54 }}>
          <Box sx={{ minWidth: 0, pt: 0.15 }}>
            <Typography variant="subtitle1" fontWeight={800} sx={{ color: '#0f172a', lineHeight: 1.2 }}>
              {group.groupName}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.2, display: 'block', lineHeight: 1.4 }}>
              Assigned Fest: {group.assignedFestName}
            </Typography>
          </Box>
          <Chip
            label={group.status}
            size="small"
            color={group.status === 'Active' ? 'success' : 'default'}
            variant={group.status === 'Active' ? 'filled' : 'outlined'}
            sx={{ fontWeight: 700, ml: 1, mt: 0.15 }}
          />
        </Box>

        <Box sx={{ display: 'grid', gap: 0.7, mt: 0.15 }}>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.45 }}>
            <strong>Major Event Admin:</strong>{' '}
            {group.majorEventAdmin?.employeeName
              ? `${group.majorEventAdmin.employeeName} (${group.majorEventAdmin.employeeId || 'N/A'})`
              : 'Not assigned'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 'auto', pt: 0.75 }}>
          <IconButton
            size="small"
            aria-label="Edit group"
            onClick={() => handleEdit(group)}
            sx={{ color: '#2563eb', bgcolor: 'rgba(37, 99, 235, 0.1)' }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            aria-label="Delete group"
            onClick={() => setGroupToDelete(group)}
            sx={{ color: '#dc2626', bgcolor: 'rgba(220, 38, 38, 0.1)' }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Fest Management"
        subtitle="Select a fest to create or manage its groups"
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
            Assigned Fest Workflow
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.25 }}>
          Select one assigned fest card to open its group workflow.
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 1.25, alignItems: 'stretch' }}>
          {fests.map((fest) => {
            const isSelected = selectedFest === fest;
            return (
              <Card
                key={fest}
                onClick={() => setSelectedFest(fest)}
                sx={{
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: isSelected ? '#0f766e' : 'divider',
                  borderRadius: '14px',
                  boxShadow: isSelected ? '0 8px 24px rgba(15, 118, 110, 0.24)' : '0 2px 8px rgba(15, 23, 42, 0.05)',
                  transform: isSelected ? 'translateY(-2px)' : 'none',
                  transition: 'all 160ms ease',
                  overflow: 'hidden',
                  bgcolor: isSelected ? 'rgba(20, 184, 166, 0.04)' : 'rgba(255,255,255,0.82)',
                }}
              >
                <CardContent sx={{ minHeight: 124, py: 2, px: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.25 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontWeight={800} sx={{ fontSize: '1rem', lineHeight: 1.3 }}>{fest}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                        Fest group setup and assignment workflow
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

        {selectedFest && (
          <Box
            aria-hidden="true"
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: `repeat(${Math.max(fests.length, 1)}, minmax(0, 1fr))` },
              height: 52,
              mt: 0,
            }}
          >
            <Box
              sx={{
                gridColumn: { xs: '1', sm: selectedFestIndex + 1 },
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
              Selected Fest Workflow
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr auto' }, gap: 1.25, alignItems: 'center' }}>
            <Box>
              <Typography variant="h5" fontWeight={900} sx={{ color: '#0f172a', lineHeight: 1.12, fontSize: { xs: '1.3rem', sm: '1.5rem' } }}>
                {selectedFest ? `${selectedFest} Group Management` : 'Choose a fest'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.45, maxWidth: 680 }}>
                Create a new group or review the group table for the selected fest.
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
                Active Fest
              </Typography>
              <Typography variant="subtitle1" fontWeight={800} sx={{ mt: 0.35, color: '#0f172a' }}>
                {selectedFest || 'No fest selected'}
              </Typography>
            </Box>
          </Box>
        </Box>
        <CardContent sx={{ p: { xs: 2.1, sm: 3.2 }, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box sx={{ p: { xs: 1.6, sm: 2.1 }, borderRadius: '14px', bgcolor: 'rgba(15, 118, 110, 0.045)', border: '1px solid rgba(15, 118, 110, 0.14)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.45)', minHeight: 220 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
              <Typography variant="subtitle1" fontWeight="700">
                {selectedFest ? `${selectedFest} Groups` : 'Groups'}
              </Typography>
            </Box>

            {loadingGroups ? (
              <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 160 }}>
                <CircularProgress size={28} />
              </Box>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 1.25, alignItems: 'stretch' }}>
                <Box
                  onClick={openCreateGroupDialog}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    px: 1.75,
                    py: 1.1,
                    borderRadius: '18px',
                    border: '1px dashed rgba(15, 118, 110, 0.5)',
                    bgcolor: 'rgba(15, 118, 110, 0.07)',
                    color: '#0f766e',
                    fontWeight: 800,
                    cursor: 'pointer',
                    minHeight: 190,
                    boxShadow: '0 6px 16px rgba(15, 23, 42, 0.05)',
                    transition: 'all 180ms ease',
                    height: '100%',
                    '&:hover': {
                      bgcolor: 'rgba(15, 118, 110, 0.13)',
                      borderColor: 'rgba(15, 118, 110, 0.75)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 24px rgba(15, 118, 110, 0.18)',
                    },
                  }}
                >
                  <AddIcon fontSize="large" />
                  <Typography variant="button" sx={{ textTransform: 'none', fontWeight: 800 }}>
                    Add Group
                  </Typography>
                </Box>

                {groups.length === 0 ? (
                  <Box sx={{ gridColumn: '1 / -1', border: '1px dashed rgba(15, 118, 110, 0.28)', borderRadius: '14px', p: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      No groups created for this fest yet.
                    </Typography>
                  </Box>
                ) : (
                  groups.map((group) => renderGroupCard(group))
                )}
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      <Dialog open={groupDialogOpen} onClose={() => !submitting && setGroupDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingGroup ? 'Edit Group' : 'Create Group'}</DialogTitle>
        <DialogContent>
          <Box component="form" id="fest-group-form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2.25, pt: 0.5 }}>
            <TextField
              label="Group Name"
              value={form.groupName}
              onChange={(event) => setForm((current) => ({ ...current, groupName: event.target.value }))}
              required
              inputProps={{ maxLength: 120 }}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel id="group-status-label">Status</InputLabel>
              <Select
                labelId="group-status-label"
                value={form.status}
                label="Status"
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
            <Autocomplete
              options={employeeOptions}
              value={form.majorEventAdmin}
              loading={searchingEmployees}
              filterOptions={(options) => options}
              isOptionEqualToValue={(option, value) => option.institutionId === value.institutionId}
              getOptionLabel={(option) => `${option.name} (${option.institutionId})`}
              onChange={(event, value) => setForm((current) => ({ ...current, majorEventAdmin: value }))}
              onInputChange={(event, value) => setEmployeeSearch(value)}
              renderOption={(props, option) => (
                <li {...props} key={option.institutionId}>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{option.name} ({option.institutionId})</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.department?.name || option.department || 'N/A'} • {option.designation || 'N/A'}
                    </Typography>
                  </Box>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Major Event Admin *"
                  placeholder="Search employee by name or ID"
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
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 0.5 }}>
          <Button onClick={() => { resetForm(); setGroupDialogOpen(false); }} disabled={submitting}>Cancel</Button>
          <Button type="submit" form="fest-group-form" variant="contained" disabled={submitting || loadingFests || !selectedFest}>
            {submitting ? 'Saving...' : editingGroup ? 'Update Group' : 'Create Group'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(groupToDelete)} onClose={() => !deleting && setGroupToDelete(null)}>
        <DialogTitle>Delete Group</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Delete the group {groupToDelete?.groupName ? `"${groupToDelete.groupName}"` : ''}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setGroupToDelete(null)} disabled={deleting}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FestManagement;
