import React, { useState, useEffect } from 'react';
import Loader from "../../components/common/Loader";
import {
    Box, Button, Paper, IconButton, Dialog,
    DialogTitle, DialogContent, DialogActions, TextField, Chip,
    Tooltip, Autocomplete, List, ListItem, ListItemText, ListItemSecondaryAction, Divider, Typography,
    FormControlLabel, Switch, RadioGroup, Radio, FormControl, FormLabel, FormHelperText
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Security as SecurityIcon,
    PersonAdd as PersonAddIcon,
    Close as CloseIcon,
    Apartment as ApartmentIcon,
    Public as PublicIcon,
    Engineering as EngineeringIcon,
    AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import { PageContainer } from '../../components/common/design-system';
import DataTable from '../../components/data/DataTable';
import API from '../../api/axios';
import { toast } from 'sonner';

const ManageServices = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    const [openDialog, setOpenDialog] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentServiceId, setCurrentServiceId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        isGlobalService: true,
        directEmployeeInvolvement: true
    });
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
    const [selectedBlocksToAdd, setSelectedBlocksToAdd] = useState([]);
    const [addingAdmin, setAddingAdmin] = useState(false);

    // Blocks list for mapping
    const [availableBlocks, setAvailableBlocks] = useState([]);

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

    const fetchBlocks = async () => {
        try {
            const res = await API.get('/api/service-desk/blocks?activeOnly=true');
            if (res.data.success) {
                setAvailableBlocks(res.data.data);
            }
        } catch (error) {
            console.error('Failed to load blocks for service management');
        }
    };

    useEffect(() => {
        fetchServices();
        fetchBlocks();
    }, []);

    const handleOpen = (service = null) => {
        if (service) {
            setEditMode(true);
            setCurrentServiceId(service._id);
            setFormData({
                name: service.name,
                description: service.description || '',
                isGlobalService: service.isGlobalService !== undefined ? service.isGlobalService : true,
                directEmployeeInvolvement: service.directEmployeeInvolvement !== undefined ? service.directEmployeeInvolvement : true
            });
        } else {
            setEditMode(false);
            setCurrentServiceId(null);
            setFormData({
                name: '',
                description: '',
                isGlobalService: true,
                directEmployeeInvolvement: true
            });
        }
        setOpenDialog(true);
    };

    const handleClose = () => {
        setOpenDialog(false);
        setFormData({
            name: '',
            description: '',
            isGlobalService: true,
            directEmployeeInvolvement: true
        });
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
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
        setSelectedBlocksToAdd([]);
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
        setSelectedBlocksToAdd([]);
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
        if (!currentService.isGlobalService && selectedBlocksToAdd.length === 0) {
            toast.error('Please map at least one block for this Block-Specific service admin');
            return;
        }

        try {
            setAddingAdmin(true);
            const res = await API.post(`/api/service-desk/services/${currentService._id}/admins`, {
                employeeId: selectedEmployeeToAdd._id,
                blocks: selectedBlocksToAdd.map(b => b._id)
            });
            if (res.data.success) {
                toast.success('Admin added successfully');
                setSelectedEmployeeToAdd(null);
                setSelectedBlocksToAdd([]);
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
        <PageContainer>
            <PageHeader
                title="Manage Services"
                subtitle="Create, organize, and manage service categories for the Service Desk. Configure global/block scope, employee involvement, and assign administrators."
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

            <Box>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <Loader />
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
                        columns={["Service Name", "Description", "Scope", "Employee Involvement", "Status", "Actions"]}
                        alignments={["left", "left", "center", "center", "center", "right"]}
                        nonSortableColumns={[5]}
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
                                value: service.isGlobalService ? 'Global' : 'Block Specific',
                                display: (
                                    <Chip
                                        icon={service.isGlobalService ? <PublicIcon fontSize="small" /> : <ApartmentIcon fontSize="small" />}
                                        label={service.isGlobalService ? 'Global (All Blocks)' : 'Block Specific'}
                                        color={service.isGlobalService ? 'primary' : 'secondary'}
                                        variant="outlined"
                                        size="small"
                                        sx={{ fontWeight: 600, borderRadius: '6px' }}
                                    />
                                )
                            },
                            {
                                value: service.directEmployeeInvolvement ? 'Delegated' : 'Admin Direct',
                                display: (
                                    <Chip
                                        icon={service.directEmployeeInvolvement ? <EngineeringIcon fontSize="small" /> : <AdminIcon fontSize="small" />}
                                        label={service.directEmployeeInvolvement ? 'Field Employees' : 'Admin Direct Action'}
                                        size="small"
                                        sx={{
                                            fontWeight: 600,
                                            borderRadius: '6px',
                                            backgroundColor: service.directEmployeeInvolvement ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                            color: service.directEmployeeInvolvement ? '#2563eb' : '#d97706'
                                        }}
                                    />
                                )
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
            <Dialog open={openDialog} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 600 }}>{editMode ? 'Edit Service' : 'Add New Service'}</DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
                        <TextField
                            label="Service Name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            fullWidth
                            required
                            size="small"
                            placeholder="e.g. Hardware, Software, Electrical Maintenance"
                        />
                        <TextField
                            label="Description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            fullWidth
                            multiline
                            rows={3}
                            size="small"
                            placeholder="Provide a clear description of the service scope..."
                        />

                        {/* Global Service Option */}
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                            <FormControl component="fieldset">
                                <FormLabel component="legend" sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b', mb: 0.5 }}>
                                    Service Scope (Global vs Block-Specific)
                                </FormLabel>
                                <RadioGroup
                                    row
                                    name="isGlobalService"
                                    value={formData.isGlobalService.toString()}
                                    onChange={(e) => setFormData({ ...formData, isGlobalService: e.target.value === 'true' })}
                                >
                                    <FormControlLabel value="true" control={<Radio size="small" />} label="Global Service (Campus-wide)" />
                                    <FormControlLabel value="false" control={<Radio size="small" />} label="Block-Specific Service" />
                                </RadioGroup>
                                <FormHelperText sx={{ mt: 0.5 }}>
                                    {formData.isGlobalService
                                        ? "Ticket applies university-wide across all blocks. No block selection required."
                                        : "Ticket requires block selection by the user and routes directly to the assigned Block Admin."}
                                </FormHelperText>
                            </FormControl>
                        </Paper>

                        {/* Direct Employee Involvement Option */}
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                            <FormControl component="fieldset">
                                <FormLabel component="legend" sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b', mb: 0.5 }}>
                                    Direct Involvement of Employees
                                </FormLabel>
                                <RadioGroup
                                    row
                                    name="directEmployeeInvolvement"
                                    value={formData.directEmployeeInvolvement.toString()}
                                    onChange={(e) => setFormData({ ...formData, directEmployeeInvolvement: e.target.value === 'true' })}
                                >
                                    <FormControlLabel value="true" control={<Radio size="small" />} label="Yes (Field Employees / Technicians Assigned)" />
                                    <FormControlLabel value="false" control={<Radio size="small" />} label="No (Service Admin updates work status directly)" />
                                </RadioGroup>
                                <FormHelperText sx={{ mt: 0.5 }}>
                                    {formData.directEmployeeInvolvement
                                        ? "Service Admin assigns tickets to service employees who work on the task and update status."
                                        : "Service Admin directly takes action, marks progress, and resolves the ticket without intermediate technicians."}
                                </FormHelperText>
                            </FormControl>
                        </Paper>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, px: 3 }}>
                    <Button onClick={handleClose} disabled={saving} sx={{ textTransform: 'none' }}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={saving}
                        sx={{ background: 'var(--gradient-primary)', textTransform: 'none', borderRadius: 2, px: 3 }}
                    >
                        {saving ? 'Saving...' : 'Save Service'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Manage Admins Dialog */}
            <Dialog open={openAdminsDialog} onClose={handleCloseAdmins} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Manage Service Admins - {currentService?.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {currentService?.isGlobalService ? 'Scope: Global (Campus-wide)' : 'Scope: Block-Specific (Map admins to target blocks)'}
                        </Typography>
                    </Box>
                    <IconButton onClick={handleCloseAdmins} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                            <Autocomplete
                                fullWidth
                                options={employeeSearchResults}
                                getOptionLabel={(option) => `${option.name} (${option.institutionId}) - ${option.designation || ''}`}
                                isOptionEqualToValue={(option, value) => option._id === value._id}
                                value={selectedEmployeeToAdd}
                                onChange={(e, newValue) => setSelectedEmployeeToAdd(newValue)}
                                onInputChange={(e, newInputValue) => setEmployeeSearchQuery(newInputValue)}
                                loading={searchingEmployees}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Search Employee to Add as Admin"
                                        placeholder="Type name or ID..."
                                        size="small"
                                        InputProps={{
                                            ...(params.InputProps || {}),
                                            endAdornment: (
                                                <React.Fragment>
                                                    {searchingEmployees ? <Loader color="inherit" size={20} /> : null}
                                                    {params.InputProps?.endAdornment}
                                                </React.Fragment>
                                            ),
                                        }}
                                    />
                                )}
                            />
                        </Box>

                        {/* If Block Specific service, show block multi-select */}
                        {!currentService?.isGlobalService && (
                            <Autocomplete
                                multiple
                                options={availableBlocks}
                                getOptionLabel={(option) => `${option.blockName} (${option.blockCode})`}
                                isOptionEqualToValue={(option, value) => option._id === value._id}
                                value={selectedBlocksToAdd}
                                onChange={(e, newValue) => setSelectedBlocksToAdd(newValue)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Select Managed Blocks (Required for Block Admin)"
                                        placeholder="Pick blocks..."
                                        size="small"
                                        helperText="Tickets raised in these blocks will be routed to this administrator."
                                    />
                                )}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => (
                                        <Chip
                                            label={`${option.blockName} (${option.blockCode})`}
                                            size="small"
                                            {...getTagProps({ index })}
                                            key={option._id}
                                        />
                                    ))
                                }
                            />
                        )}

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                variant="contained"
                                disabled={!selectedEmployeeToAdd || addingAdmin}
                                onClick={handleAddAdmin}
                                sx={{ textTransform: 'none', px: 3, borderRadius: 2 }}
                            >
                                {addingAdmin ? 'Assigning...' : 'Assign Service Admin'}
                            </Button>
                        </Box>
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 2, fontWeight: 600 }}>
                        Current Service Admins ({serviceAdmins.length})
                    </Typography>

                    {loadingAdmins ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                            <Loader />
                        </Box>
                    ) : serviceAdmins.length === 0 ? (
                        <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 3 }}>
                            No admins assigned to this service yet.
                        </Typography>
                    ) : (
                        <List>
                            {serviceAdmins.map((member) => (
                                <ListItem
                                    key={member._id}
                                    sx={{
                                        bgcolor: 'var(--bg-glass)',
                                        mb: 1.5,
                                        borderRadius: 2,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        flexDirection: 'column',
                                        alignItems: 'flex-start',
                                        p: 2
                                    }}
                                >
                                    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                {member.employee?.name || 'Unknown User'}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                {member.employee?.institutionId} • {member.employee?.email || ''}
                                            </Typography>
                                        </Box>
                                        <IconButton edge="end" color="error" size="small" onClick={() => handleRemoveAdmin(member.employee?._id)}>
                                            <CloseIcon fontSize="small" />
                                        </IconButton>
                                    </Box>

                                    {!currentService?.isGlobalService && (
                                        <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                            <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569' }}>
                                                Assigned Blocks:
                                            </Typography>
                                            {member.blocks && member.blocks.length > 0 ? (
                                                member.blocks.map(b => (
                                                    <Chip
                                                        key={b._id}
                                                        icon={<ApartmentIcon fontSize="small" />}
                                                        label={`${b.blockName} (${b.blockCode})`}
                                                        size="small"
                                                        color="info"
                                                        variant="outlined"
                                                    />
                                                ))
                                            ) : (
                                                <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                                                    All blocks (Unrestricted)
                                                </Typography>
                                            )}
                                        </Box>
                                    )}
                                </ListItem>
                            ))}
                        </List>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, px: 3 }}>
                    <Button onClick={handleCloseAdmins} color="inherit" sx={{ textTransform: 'none' }}>Close</Button>
                </DialogActions>
            </Dialog>

        </PageContainer>
    );
};

export default ManageServices;
