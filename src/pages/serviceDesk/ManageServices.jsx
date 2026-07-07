import React, { useState, useEffect } from 'react';
import {
    Box, Button, Paper, IconButton, Dialog,
    DialogTitle, DialogContent, DialogActions, TextField, Chip, CircularProgress,
    Tooltip, Autocomplete, List, ListItem, ListItemText, ListItemSecondaryAction, Divider, Typography
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Security as SecurityIcon, PersonAdd as PersonAddIcon, Close as CloseIcon } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/data/DataTable';
import API from '../../api/axios';
import { toast } from 'sonner';

const ManageServices = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    const [openDialog, setOpenDialog] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentServiceId, setCurrentServiceId] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [saving, setSaving] = useState(false);

    // Admin Assignment State
    const [openAdminsDialog, setOpenAdminsDialog] = useState(false);
    const [currentService, setCurrentService] = useState(null);
    const [serviceAdmins, setServiceAdmins] = useState([]);
    const [loadingAdmins, setLoadingAdmins] = useState(false);
    const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
    const [employeeSearchResults, setEmployeeSearchResults] = useState([]);
    const [searchingEmployees, setSearchingEmployees] = useState(false);
    const [selectedEmployeeToAdd, setSelectedEmployeeToAdd] = useState(null);
    const [addingAdmin, setAddingAdmin] = useState(false);

    const fetchServices = async () => {
        try {
            setLoading(true);
            const res = await API.get('/api/service-desk/services');
            if (res.data.success) {
                setServices(res.data.data);
            }
        } catch (error) {
            toast.error('Failed to load services');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const handleOpen = (service = null) => {
        if (service) {
            setEditMode(true);
            setCurrentServiceId(service._id);
            setFormData({ name: service.name, description: service.description });
        } else {
            setEditMode(false);
            setCurrentServiceId(null);
            setFormData({ name: '', description: '' });
        }
        setOpenDialog(true);
    };

    const handleClose = () => {
        setOpenDialog(false);
        setFormData({ name: '', description: '' });
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        if (!formData.name) {
            toast.error('Service Name is required');
            return;
        }

        try {
            setSaving(true);
            if (editMode) {
                const res = await API.put(`/api/service-desk/services/${currentServiceId}`, formData);
                if (res.data.success) {
                    toast.success('Service updated successfully');
                    fetchServices();
                    handleClose();
                }
            } else {
                const res = await API.post('/api/service-desk/services', formData);
                if (res.data.success) {
                    toast.success('Service created successfully');
                    fetchServices();
                    handleClose();
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to deactivate this service?')) {
            try {
                const res = await API.delete(`/api/service-desk/services/${id}`);
                if (res.data.success) {
                    toast.success('Service deactivated');
                    fetchServices();
                }
            } catch (error) {
                toast.error('Failed to deactivate service');
            }
        }
    };

    // --- Admin Assignment Logic ---

    const handleOpenAdmins = async (service) => {
        setCurrentService(service);
        setOpenAdminsDialog(true);
        fetchServiceAdmins(service._id);
    };

    const handleCloseAdmins = () => {
        setOpenAdminsDialog(false);
        setCurrentService(null);
        setServiceAdmins([]);
        setEmployeeSearchQuery('');
        setEmployeeSearchResults([]);
        setSelectedEmployeeToAdd(null);
    };

    const fetchServiceAdmins = async (serviceId) => {
        try {
            setLoadingAdmins(true);
            const res = await API.get(`/api/service-desk/services/${serviceId}/admins`);
            if (res.data.success) {
                setServiceAdmins(res.data.data);
            }
        } catch (error) {
            toast.error('Failed to load admins');
        } finally {
            setLoadingAdmins(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (employeeSearchQuery.trim().length >= 2) {
                setSearchingEmployees(true);
                try {
                    const res = await API.get(`/api/employees/search?query=${employeeSearchQuery}`);
                    // Search endpoint returns array directly
                    if (Array.isArray(res.data)) {
                        setEmployeeSearchResults(res.data);
                    }
                } catch (error) {
                    console.error('Error searching employees', error);
                } finally {
                    setSearchingEmployees(false);
                }
            } else {
                setEmployeeSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [employeeSearchQuery]);

    const handleAddAdmin = async () => {
        if (!selectedEmployeeToAdd) return;
        try {
            setAddingAdmin(true);
            const res = await API.post(`/api/service-desk/services/${currentService._id}/admins`, {
                employeeId: selectedEmployeeToAdd._id
            });
            if (res.data.success) {
                toast.success('Admin added successfully');
                setSelectedEmployeeToAdd(null);
                setEmployeeSearchQuery('');
                setEmployeeSearchResults([]);
                fetchServiceAdmins(currentService._id);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add admin');
        } finally {
            setAddingAdmin(false);
        }
    };

    const handleRemoveAdmin = async (employeeId) => {
        if (window.confirm('Remove this admin?')) {
            try {
                const res = await API.delete(`/api/service-desk/services/${currentService._id}/admins/${employeeId}`);
                if (res.data.success) {
                    toast.success('Admin removed');
                    fetchServiceAdmins(currentService._id);
                }
            } catch (error) {
                toast.error('Failed to remove admin');
            }
        }
    };

    return (
        <Box>
            <PageHeader
                title="Manage Services"
                subtitle="Create, organize, and manage service categories for the Service Desk. Assign administrators to each service and control their availability for ticket requests."
                action={
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpen()}
                        sx={{ background: 'var(--gradient-primary)' }}
                    >
                        Add Service
                    </Button>
                }
            />

            <Box sx={{ p: 3 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress />
                    </Box>
                ) : services.length === 0 ? (
                    <Box sx={{
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        py: 8, px: 3, background: "var(--bg-panel)", borderRadius: "16px",
                        border: "1px dashed var(--border-color)", boxShadow: "var(--shadow-premium)", textAlign: "center"
                    }}>
                        <Typography variant="h6" sx={{ color: "var(--text-secondary)", fontWeight: 600, mb: 1 }}>
                            No Services Found
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary", mb: 3, maxWidth: "400px" }}>
                            Create your first Service Desk category to get started.
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={() => handleOpen()}
                            sx={{ background: "var(--gradient-primary)", textTransform: 'none', borderRadius: '8px' }}
                        >
                            Add Service
                        </Button>
                    </Box>
                ) : (
                    <DataTable
                        columns={["Service Name", "Description", "Status", "Actions"]}
                        alignments={["left", "left", "center", "right"]}
                        nonSortableColumns={[3]}
                        rows={services.map(service => [
                            {
                                value: service.name,
                                display: <Typography sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>{service.name}</Typography>
                            },
                            {
                                value: service.description || '',
                                display: <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>{service.description || '--'}</Typography>
                            },
                            {
                                value: service.isActive ? 'Active' : 'Inactive',
                                display: (
                                    <Chip
                                        label={service.isActive ? 'Active' : 'Inactive'}
                                        color={service.isActive ? 'success' : 'default'}
                                        size="small"
                                        sx={{ fontWeight: 600, borderRadius: '6px' }}
                                    />
                                )
                            },
                            {
                                value: '',
                                display: (
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                        {service.isActive && (
                                            <Tooltip title="Manage Admins">
                                                <IconButton color="info" onClick={() => handleOpenAdmins(service)} size="small" sx={{ background: 'var(--bg-glass)' }}>
                                                    <SecurityIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        <Tooltip title="Edit Service">
                                            <IconButton color="primary" onClick={() => handleOpen(service)} size="small" sx={{ background: 'var(--bg-glass)' }}>
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        {service.isActive && (
                                            <Tooltip title="Deactivate">
                                                <IconButton color="error" onClick={() => handleDelete(service._id)} size="small" sx={{ background: 'var(--bg-glass)' }}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </Box>
                                )
                            }
                        ])}
                    />
                )}
            </Box>

            {/* Create/Edit Dialog */}
            <Dialog open={openDialog} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>{editMode ? 'Edit Service' : 'Add New Service'}</DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                        <TextField
                            label="Service Name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            fullWidth
                            required
                        />
                        <TextField
                            label="Description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            fullWidth
                            multiline
                            rows={3}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, px: 3 }}>
                    <Button onClick={handleClose} disabled={saving}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={saving}
                        sx={{ background: 'var(--gradient-primary)' }}
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Manage Admins Dialog */}
            <Dialog open={openAdminsDialog} onClose={handleCloseAdmins} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Manage Admins - {currentService?.name}
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                        <Autocomplete
                            fullWidth
                            options={employeeSearchResults}
                            getOptionLabel={(option) => `${option.name} (${option.institutionId})`}
                            isOptionEqualToValue={(option, value) => option._id === value._id}
                            value={selectedEmployeeToAdd}
                            onChange={(e, newValue) => setSelectedEmployeeToAdd(newValue)}
                            onInputChange={(e, newInputValue) => setEmployeeSearchQuery(newInputValue)}
                            loading={searchingEmployees}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Search Employee to Add"
                                    placeholder="Type name or ID..."
                                    InputProps={{
                                        ...(params.InputProps || {}),
                                        endAdornment: (
                                            <React.Fragment>
                                                {searchingEmployees ? <CircularProgress color="inherit" size={20} /> : null}
                                                {params.InputProps?.endAdornment}
                                            </React.Fragment>
                                        ),
                                    }}
                                />
                            )}
                        />
                        <Button
                            variant="contained"
                            disabled={!selectedEmployeeToAdd || addingAdmin}
                            onClick={handleAddAdmin}
                            sx={{ height: '56px', px: 3 }}
                        >
                            {addingAdmin ? <CircularProgress size={24} color="inherit" /> : 'Add'}
                        </Button>
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 2 }}>
                        Current Admins ({serviceAdmins.length})
                    </Typography>

                    {loadingAdmins ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                            <CircularProgress />
                        </Box>
                    ) : serviceAdmins.length === 0 ? (
                        <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 3 }}>
                            No admins assigned to this service yet.
                        </Typography>
                    ) : (
                        <List>
                            {serviceAdmins.map((member) => (
                                <ListItem key={member._id} sx={{ bgcolor: 'var(--bg-glass)', mb: 1, borderRadius: 1 }}>
                                    <ListItemText
                                        primary={member.employee?.name || 'Unknown User'}
                                        secondary={member.employee?.institutionId || ''}
                                    />
                                    <ListItemSecondaryAction>
                                        <IconButton edge="end" color="error" onClick={() => handleRemoveAdmin(member.employee?._id)}>
                                            <CloseIcon />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, px: 3 }}>
                    <Button onClick={handleCloseAdmins} color="inherit">Close</Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
};

export default ManageServices;
