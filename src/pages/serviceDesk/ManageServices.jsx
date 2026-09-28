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
    Hotel as HotelIcon,
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
        directEmployeeInvolvement: true,
        subcategories: []
    });
    const [subcatInput, setSubcatInput] = useState('');
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
        setSubcatInput('');
        if (service) {
            setEditMode(true);
            setCurrentServiceId(service._id);
            setFormData({
                name: service.name,
                description: service.description || '',
                isGlobalService: service.isGlobalService !== undefined ? service.isGlobalService : true,
                applicableBlockType: service.applicableBlockType || 'ALL',
                directEmployeeInvolvement: service.directEmployeeInvolvement !== undefined ? service.directEmployeeInvolvement : true,
                subcategories: Array.isArray(service.subcategories) ? service.subcategories : []
            });
        } else {
            setEditMode(false);
            setCurrentServiceId(null);
            setFormData({
                name: '',
                description: '',
                isGlobalService: true,
                applicableBlockType: 'ALL',
                directEmployeeInvolvement: true,
                subcategories: []
            });
        }
        setOpenDialog(true);
    };

    const handleClose = () => {
        setOpenDialog(false);
        setSubcatInput('');
        setFormData({
            name: '',
            description: '',
            isGlobalService: true,
            applicableBlockType: 'ALL',
            directEmployeeInvolvement: true,
            subcategories: []
        });
    };

    const handleAddSubcat = () => {
        const val = subcatInput.trim();
        if (!val) return;
        if ((formData.subcategories || []).some(s => s.toLowerCase() === val.toLowerCase())) {
            toast.error('Subcategory already added');
            return;
        }
        setFormData(prev => ({
            ...prev,
            subcategories: [...(prev.subcategories || []), val]
        }));
        setSubcatInput('');
    };

    const handleRemoveSubcat = (indexToRemove) => {
        setFormData(prev => ({
            ...prev,
            subcategories: prev.subcategories.filter((_, idx) => idx !== indexToRemove)
        }));
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

    const handleSelectEmployeeToAdd = (emp) => {
        setSelectedEmployeeToAdd(emp);
        if (!emp) {
            setSelectedBlocksToAdd([]);
            return;
        }
        const existing = serviceAdmins.find(a => (a.employee?._id || a.employee) === emp._id);
        if (existing && existing.blocks) {
            setSelectedBlocksToAdd(existing.blocks);
        } else {
            setSelectedBlocksToAdd([]);
        }
    };

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
                blocks: selectedBlocksToAdd.map(b => b._id || b)
            });
            if (res.data.success) {
                toast.success(res.data.message || 'Admin block assignments saved successfully');
                setSelectedEmployeeToAdd(null);
                setSelectedBlocksToAdd([]);
                setEmployeeSearchQuery('');
                setEmployeeSearchResults([]);
                fetchServiceAdmins(currentService._id);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to assign admin');
        } finally {
            setAddingAdmin(false);
        }
    };

    const handleRemoveBlockFromAdmin = async (employeeId, blockIdToRemove) => {
        const admin = serviceAdmins.find(a => (a.employee?._id || a.employee) === employeeId);
        if (!admin) return;

        const remainingBlocks = (admin.blocks || []).filter(b => (b._id || b) !== blockIdToRemove).map(b => b._id || b);
        
        try {
            const res = await API.put(`/api/service-desk/services/${currentService._id}/admins/${employeeId}/blocks`, {
                blocks: remainingBlocks
            });
            if (res.data.success) {
                toast.success('Block unassigned from admin');
                fetchServiceAdmins(currentService._id);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update admin blocks');
        }
    };

    const handleEditAdmin = (admin) => {
        setSelectedEmployeeToAdd(admin.employee);
        setSelectedBlocksToAdd(admin.blocks || []);
    };

    const handleRemoveAdmin = async (employeeId) => {
        if (window.confirm('Remove this admin from this service?')) {
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
                                value: service.isGlobalService
                                    ? 'Global'
                                    : service.applicableBlockType === 'HOSTEL'
                                        ? 'Hostel Blocks'
                                        : service.applicableBlockType === 'ACADEMIC'
                                            ? 'Academic Buildings'
                                            : 'All Blocks',
                                display: (
                                    <Chip
                                        icon={
                                            service.isGlobalService
                                                ? <PublicIcon fontSize="small" />
                                                : service.applicableBlockType === 'HOSTEL'
                                                    ? <HotelIcon fontSize="small" sx={{ color: '#db2777 !important' }} />
                                                    : <ApartmentIcon fontSize="small" />
                                        }
                                        label={
                                            service.isGlobalService
                                                ? 'Global (All Blocks)'
                                                : service.applicableBlockType === 'HOSTEL'
                                                    ? 'Hostel Blocks'
                                                    : service.applicableBlockType === 'ACADEMIC'
                                                        ? 'Academic Buildings'
                                                        : 'All Blocks'
                                        }
                                        color={
                                            service.isGlobalService
                                                ? 'primary'
                                                : service.applicableBlockType === 'HOSTEL'
                                                    ? 'secondary'
                                                    : 'info'
                                        }
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
                            rows={2}
                            size="small"
                            placeholder="Provide a clear description of the service scope..."
                        />

                        {/* Subcategories Configuration */}
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                                Subcategories (Issue Types)
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
                                Configure specific problem types for this service (e.g. Fans, Lights, Switches). "Others" is always provided automatically for users.
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                                <TextField
                                    size="small"
                                    fullWidth
                                    placeholder="Type subcategory (e.g. Fans, MCB, Power Supply)..."
                                    value={subcatInput}
                                    onChange={(e) => setSubcatInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddSubcat();
                                        }
                                    }}
                                />
                                <Button
                                    variant="outlined"
                                    onClick={handleAddSubcat}
                                    disabled={!subcatInput.trim()}
                                    sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
                                >
                                    Add
                                </Button>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', minHeight: 32, p: 1, bgcolor: 'var(--bg-glass)', borderRadius: 1.5 }}>
                                {(formData.subcategories && formData.subcategories.length > 0) ? (
                                    formData.subcategories.map((subcat, idx) => (
                                        <Chip
                                            key={idx}
                                            label={subcat}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                            onDelete={() => handleRemoveSubcat(idx)}
                                        />
                                    ))
                                ) : (
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic', m: 'auto 0' }}>
                                        No subcategories added yet. Users will be able to select "Others" and describe their issue.
                                    </Typography>
                                )}
                            </Box>
                        </Paper>

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

                            {/* If Block-Specific, configure applicable block types */}
                            {!formData.isGlobalService && (
                                <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px dashed var(--border-color)' }}>
                                    <FormControl component="fieldset">
                                        <FormLabel component="legend" sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#1e293b', mb: 0.5 }}>
                                            Target Block Category
                                        </FormLabel>
                                        <RadioGroup
                                            row
                                            name="applicableBlockType"
                                            value={formData.applicableBlockType || 'ALL'}
                                            onChange={(e) => setFormData({ ...formData, applicableBlockType: e.target.value })}
                                        >
                                            <FormControlLabel
                                                value="ACADEMIC"
                                                control={<Radio size="small" />}
                                                label={<Typography variant="body2" sx={{ fontWeight: 500 }}>Academic Buildings Only</Typography>}
                                            />
                                            <FormControlLabel
                                                value="HOSTEL"
                                                control={<Radio size="small" sx={{ color: '#db2777', '&.Mui-checked': { color: '#db2777' } }} />}
                                                label={<Typography variant="body2" sx={{ fontWeight: 600, color: '#db2777' }}>Hostel Blocks Only</Typography>}
                                            />
                                            <FormControlLabel
                                                value="ALL"
                                                control={<Radio size="small" />}
                                                label={<Typography variant="body2" sx={{ fontWeight: 500 }}>All Blocks (Both)</Typography>}
                                            />
                                        </RadioGroup>
                                        <FormHelperText sx={{ mt: 0.5 }}>
                                            {formData.applicableBlockType === 'HOSTEL'
                                                ? "Only Hostel blocks (Boys & Girls) will appear for this service."
                                                : formData.applicableBlockType === 'ACADEMIC'
                                                    ? "Only Academic buildings will appear for this service."
                                                    : "Both Academic and Hostel blocks will be available."}
                                        </FormHelperText>
                                    </FormControl>
                                </Box>
                            )}
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
                            {currentService?.isGlobalService
                                ? 'Scope: Global (Campus-wide)'
                                : `Scope: Block-Specific (${currentService?.applicableBlockType === 'HOSTEL' ? 'Hostel Blocks Only' : currentService?.applicableBlockType === 'ACADEMIC' ? 'Academic Buildings Only' : 'Academic & Hostel Blocks'})`}
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
                                onChange={(e, newValue) => handleSelectEmployeeToAdd(newValue)}
                                onInputChange={(e, newInputValue) => setEmployeeSearchQuery(newInputValue)}
                                loading={searchingEmployees}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Search Employee to Add / Manage Admin Blocks"
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
                                options={availableBlocks.filter(b => {
                                    if (!currentService) return true;
                                    if (currentService.applicableBlockType === 'HOSTEL') return b.blockType === 'HOSTEL';
                                    if (currentService.applicableBlockType === 'ACADEMIC') return (b.blockType || 'ACADEMIC') === 'ACADEMIC';
                                    return true;
                                })}
                                getOptionLabel={(option) => {
                                    const b = typeof option === 'string' ? availableBlocks.find(x => x._id === option) : option;
                                    if (!b) return '';
                                    const tag = b.blockType === 'HOSTEL'
                                        ? ` (${b.genderTag === 'GIRLS' ? 'Girls Hostel' : 'Boys Hostel'})`
                                        : '';
                                    return `${b.blockName}${tag} (${b.blockCode || ''})`;
                                }}
                                isOptionEqualToValue={(option, value) => {
                                    const optId = option?._id || option;
                                    const valId = value?._id || value;
                                    return optId?.toString() === valId?.toString();
                                }}
                                getOptionDisabled={(option) => {
                                    const otherAdmin = serviceAdmins.find(admin => {
                                        const adminEmpId = (admin.employee?._id || admin.employee)?.toString();
                                        const currentEmpId = (selectedEmployeeToAdd?._id || selectedEmployeeToAdd)?.toString();
                                        if (adminEmpId === currentEmpId) return false;
                                        return (admin.blocks || []).some(b => (b._id || b)?.toString() === (option._id || option)?.toString());
                                    });
                                    return Boolean(otherAdmin);
                                }}
                                renderOption={(props, option) => {
                                    const otherAdmin = serviceAdmins.find(admin => {
                                        const adminEmpId = (admin.employee?._id || admin.employee)?.toString();
                                        const currentEmpId = (selectedEmployeeToAdd?._id || selectedEmployeeToAdd)?.toString();
                                        if (adminEmpId === currentEmpId) return false;
                                        return (admin.blocks || []).some(b => (b._id || b)?.toString() === (option._id || option)?.toString());
                                    });
                                    const isHostel = option.blockType === 'HOSTEL';
                                    const isGirls = option.genderTag === 'GIRLS';
                                    return (
                                        <li {...props} key={option._id}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', py: 0.5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {isHostel ? (
                                                        <HotelIcon fontSize="small" sx={{ color: isGirls ? '#db2777' : '#0284c7' }} />
                                                    ) : (
                                                        <ApartmentIcon fontSize="small" sx={{ color: '#2563eb' }} />
                                                    )}
                                                    <Typography variant="body2" sx={{ fontWeight: otherAdmin ? 400 : 500 }}>
                                                        {option.blockName} ({option.blockCode})
                                                    </Typography>
                                                    {isHostel ? (
                                                        <Chip
                                                            size="small"
                                                            label={isGirls ? 'Girls Hostel' : 'Boys Hostel'}
                                                            sx={{
                                                                fontSize: '0.68rem',
                                                                height: 20,
                                                                fontWeight: 600,
                                                                bgcolor: isGirls ? 'rgba(219, 39, 119, 0.1)' : 'rgba(2, 132, 199, 0.1)',
                                                                color: isGirls ? '#db2777' : '#0284c7',
                                                            }}
                                                        />
                                                    ) : (
                                                        <Chip
                                                            size="small"
                                                            label="Academic"
                                                            variant="outlined"
                                                            sx={{ fontSize: '0.68rem', height: 20, fontWeight: 600 }}
                                                        />
                                                    )}
                                                </Box>
                                                {otherAdmin && (
                                                    <Chip
                                                        size="small"
                                                        label={`Admin: ${otherAdmin.employee?.name || 'Assigned'}`}
                                                        color="error"
                                                        variant="outlined"
                                                        sx={{ fontSize: '0.7rem', height: 22, ml: 1 }}
                                                    />
                                                )}
                                            </Box>
                                        </li>
                                    );
                                }}
                                value={selectedBlocksToAdd}
                                onChange={(e, newValue) => setSelectedBlocksToAdd(newValue)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Select Managed Blocks (Required for Block Admin)"
                                        placeholder="Pick blocks..."
                                        size="small"
                                        helperText="Each block can only have ONE Service Admin. Tickets raised in these blocks will route to this administrator."
                                    />
                                )}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => {
                                        const bObj = typeof option === 'string' ? availableBlocks.find(b => b._id === option) || { blockName: option, blockCode: '' } : option;
                                        const isHostel = bObj.blockType === 'HOSTEL';
                                        const isGirls = bObj.genderTag === 'GIRLS';
                                        const tag = isHostel ? ` [${isGirls ? 'Girls' : 'Boys'}]` : '';
                                        return (
                                            <Chip
                                                icon={isHostel ? <HotelIcon sx={{ fontSize: '0.9rem !important', color: isGirls ? '#db2777' : '#0284c7' }} /> : <ApartmentIcon sx={{ fontSize: '0.9rem !important' }} />}
                                                label={`${bObj.blockName}${tag}${bObj.blockCode ? ` (${bObj.blockCode})` : ''}`}
                                                size="small"
                                                {...getTagProps({ index })}
                                                key={bObj._id || index}
                                                sx={{
                                                    bgcolor: isHostel ? (isGirls ? 'rgba(219, 39, 119, 0.08)' : 'rgba(2, 132, 199, 0.08)') : undefined,
                                                    border: isHostel ? `1px solid ${isGirls ? 'rgba(219, 39, 119, 0.3)' : 'rgba(2, 132, 199, 0.3)'}` : undefined
                                                }}
                                            />
                                        );
                                    })
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
                                {addingAdmin
                                    ? 'Saving...'
                                    : (selectedEmployeeToAdd && serviceAdmins.some(a => (a.employee?._id || a.employee) === selectedEmployeeToAdd._id))
                                        ? 'Update Admin Blocks'
                                        : 'Assign Service Admin'}
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
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            {!currentService?.isGlobalService && (
                                                <Tooltip title="Edit / Add more blocks">
                                                    <IconButton size="small" color="primary" onClick={() => handleEditAdmin(member)}>
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            <Tooltip title="Remove Admin">
                                                <IconButton edge="end" color="error" size="small" onClick={() => handleRemoveAdmin(member.employee?._id)}>
                                                    <CloseIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </Box>

                                    {!currentService?.isGlobalService && (
                                        <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                            <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569' }}>
                                                Assigned Blocks:
                                            </Typography>
                                            {member.blocks && member.blocks.length > 0 ? (
                                                member.blocks.map(b => {
                                                    const isHostel = b.blockType === 'HOSTEL';
                                                    const isGirls = b.genderTag === 'GIRLS';
                                                    const tag = isHostel ? ` [${isGirls ? 'Girls' : 'Boys'}]` : '';
                                                    return (
                                                        <Chip
                                                            key={b._id}
                                                            icon={isHostel ? <HotelIcon fontSize="small" sx={{ color: isGirls ? '#db2777' : '#0284c7' }} /> : <ApartmentIcon fontSize="small" />}
                                                            label={`${b.blockName}${tag} (${b.blockCode})`}
                                                            size="small"
                                                            color={isHostel ? (isGirls ? "secondary" : "info") : "primary"}
                                                            variant="outlined"
                                                            onDelete={() => handleRemoveBlockFromAdmin(member.employee?._id, b._id)}
                                                            sx={{
                                                                borderColor: isHostel ? (isGirls ? '#db2777' : '#0284c7') : undefined,
                                                                color: isHostel ? (isGirls ? '#db2777' : '#0284c7') : undefined
                                                            }}
                                                        />
                                                    );
                                                })
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
