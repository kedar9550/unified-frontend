import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Loader from "../../components/common/Loader";
import {
    Box, Typography, Button, Chip, Dialog, DialogTitle, DialogContent, 
    DialogActions, TextField, Autocomplete, Avatar, Divider, Paper, Select, 
    MenuItem, FormControl, InputLabel, Switch, FormControlLabel, IconButton,
    Tooltip, Alert, InputAdornment
} from '@mui/material';
import { 
    Group as GroupIcon, CheckCircle as AvailableIcon, 
    Cancel as InactiveIcon, ConfirmationNumber as TicketIcon,
    EmailOutlined as EmailIcon, PhoneOutlined as PhoneIcon,
    PersonAdd as PersonAddIcon, Build as BuildIcon,
    Edit as EditIcon, Delete as DeleteIcon,
    Search as SearchIcon, Info as InfoIcon,
    Engineering as EngineeringIcon, AdminPanelSettings as AdminIcon,
    ToggleOn as ToggleOnIcon, ToggleOff as ToggleOffIcon
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import API from '../../api/axios';
import { toast } from 'sonner';

const StatCard = ({ title, value, icon, color }) => (
    <Paper sx={{ 
        p: 2.5, 
        borderRadius: '16px', 
        display: 'flex', 
        flexDirection: 'column',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        border: '1px solid var(--border-color)',
        bgcolor: '#ffffff'
    }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            {React.cloneElement(icon, { sx: { color, fontSize: 20 } })}
            <Typography variant="body2" sx={{ color, fontWeight: 600 }}>
                {title}
            </Typography>
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'var(--text-primary)' }}>
            {value}
        </Typography>
    </Paper>
);

const ManageServiceMembers = () => {
    const [loadingInit, setLoadingInit] = useState(true);
    const [adminServices, setAdminServices] = useState([]);
    const [selectedServiceId, setSelectedServiceId] = useState('');
    
    // Type A: Direct Employee Involvement States
    const [serviceEmps, setServiceEmps] = useState([]);
    const [loadingEmps, setLoadingEmps] = useState(false);
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
    const [employeeSearchResults, setEmployeeSearchResults] = useState([]);
    const [searchingEmployees, setSearchingEmployees] = useState(false);
    const [selectedEmployeeToAdd, setSelectedEmployeeToAdd] = useState(null);
    const [addingEmp, setAddingEmp] = useState(false);

    // Type B: Manual Workers / Field Technicians States
    const [workers, setWorkers] = useState([]);
    const [loadingWorkers, setLoadingWorkers] = useState(false);
    const [workerSearchQuery, setWorkerSearchQuery] = useState('');
    const [workerStatusFilter, setWorkerStatusFilter] = useState('ALL'); // ALL, ACTIVE, INACTIVE

    // Worker Modals
    const [openAddWorkerDialog, setOpenAddWorkerDialog] = useState(false);
    const [openEditWorkerDialog, setOpenEditWorkerDialog] = useState(false);
    const [savingWorker, setSavingWorker] = useState(false);
    const [workerFormData, setWorkerFormData] = useState({
        _id: '',
        name: '',
        phone: '',
        designation: '',
        notes: '',
        status: 'ACTIVE'
    });

    const location = useLocation();
    const isWorkersRoute = location.pathname.includes('/workers');

    useEffect(() => {
        const fetchMemberships = async () => {
            try {
                const res = await API.get('/api/service-desk/services/my-memberships');
                if (res.data.success) {
                    const services = res.data.data.adminOf || [];
                    setAdminServices(services);
                    if (services.length > 0) {
                        if (isWorkersRoute) {
                            const manualService = services.find(s => s.directEmployeeInvolvement === false);
                            setSelectedServiceId(manualService ? manualService._id : services[0]._id);
                        } else {
                            const directService = services.find(s => s.directEmployeeInvolvement !== false);
                            setSelectedServiceId(directService ? directService._id : services[0]._id);
                        }
                    }
                }
            } catch (error) {
                toast.error('Failed to load your services');
            } finally {
                setLoadingInit(false);
            }
        };
        fetchMemberships();
    }, [isWorkersRoute]);

    const currentService = adminServices.find(s => s._id === selectedServiceId);
    const isDirectEmployeeService = currentService?.directEmployeeInvolvement !== false;

    useEffect(() => {
        if (selectedServiceId) {
            if (isDirectEmployeeService) {
                fetchServiceEmps(selectedServiceId);
            } else {
                fetchServiceWorkers(selectedServiceId);
            }
        } else {
            setServiceEmps([]);
            setWorkers([]);
        }
    }, [selectedServiceId, isDirectEmployeeService]);

    // Fetch Direct Portal Employees
    const fetchServiceEmps = async (serviceId) => {
        try {
            setLoadingEmps(true);
            const res = await API.get(`/api/service-desk/services/${serviceId}/emps`);
            if (res.data.success) {
                setServiceEmps(res.data.data);
            }
        } catch (error) {
            toast.error('Failed to load employees');
        } finally {
            setLoadingEmps(false);
        }
    };

    // Fetch Manual Field Workers
    const fetchServiceWorkers = async (serviceId) => {
        try {
            setLoadingWorkers(true);
            const res = await API.get(`/api/service-desk/services/${serviceId}/workers`);
            if (res.data.success) {
                setWorkers(res.data.data || []);
            }
        } catch (error) {
            toast.error('Failed to load field workers');
        } finally {
            setLoadingWorkers(false);
        }
    };

    // Direct Employee Search Autocomplete
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            const queryTrimmed = employeeSearchQuery.trim();
            if (queryTrimmed.length >= 2) {
                setSearchingEmployees(true);
                try {
                    const res = await API.get(`/api/employees/search?query=${encodeURIComponent(queryTrimmed)}`);
                    if (Array.isArray(res.data)) {
                        setEmployeeSearchResults(res.data);
                        if (res.data.length === 1 && !selectedEmployeeToAdd) {
                            setSelectedEmployeeToAdd(res.data[0]);
                        }
                    }
                } catch (error) {
                    console.error(error);
                } finally {
                    setSearchingEmployees(false);
                }
            } else {
                setEmployeeSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [employeeSearchQuery]);

    // Add Direct Employee
    const handleAddEmp = async () => {
        let emp = selectedEmployeeToAdd;
        if (!emp && employeeSearchResults.length === 1) {
            emp = employeeSearchResults[0];
            setSelectedEmployeeToAdd(emp);
        }
        const empIdentifier = emp?._id || emp?.institutionId || employeeSearchQuery.trim();
        if (!empIdentifier) {
            toast.error('Please enter or select an employee');
            return;
        }
        try {
            setAddingEmp(true);
            const res = await API.post(`/api/service-desk/services/${selectedServiceId}/emps`, {
                employeeId: empIdentifier
            });
            if (res.data.success) {
                toast.success('Team member added successfully');
                setOpenAddDialog(false);
                setSelectedEmployeeToAdd(null);
                setEmployeeSearchQuery('');
                setEmployeeSearchResults([]);
                fetchServiceEmps(selectedServiceId);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add team member');
        } finally {
            setAddingEmp(false);
        }
    };

    // Remove Direct Employee
    const handleRemoveEmp = async (employeeId) => {
        if (window.confirm('Remove this employee from the service team?')) {
            try {
                const res = await API.delete(`/api/service-desk/services/${selectedServiceId}/emps/${employeeId}`);
                if (res.data.success) {
                    toast.success('Team member removed');
                    fetchServiceEmps(selectedServiceId);
                }
            } catch (error) {
                toast.error('Failed to remove team member');
            }
        }
    };

    // -------------------------------------------------------------
    // Manual Worker Handlers
    // -------------------------------------------------------------
    const handleOpenAddWorker = () => {
        setWorkerFormData({
            _id: '',
            name: '',
            phone: '',
            designation: '',
            notes: '',
            status: 'ACTIVE'
        });
        setOpenAddWorkerDialog(true);
    };

    const handleOpenEditWorker = (worker) => {
        setWorkerFormData({
            _id: worker._id,
            name: worker.name,
            phone: worker.phone || '',
            designation: worker.designation || '',
            notes: worker.notes || '',
            status: worker.status || 'ACTIVE'
        });
        setOpenEditWorkerDialog(true);
    };

    const handleSaveWorker = async (isEdit = false) => {
        if (!workerFormData.name.trim()) {
            toast.error('Please enter the technician / worker name');
            return;
        }

        try {
            setSavingWorker(true);
            if (isEdit) {
                const res = await API.put(`/api/service-desk/services/${selectedServiceId}/workers/${workerFormData._id}`, {
                    name: workerFormData.name,
                    phone: workerFormData.phone,
                    designation: workerFormData.designation,
                    notes: workerFormData.notes,
                    status: workerFormData.status
                });
                if (res.data.success) {
                    toast.success('Worker details updated successfully');
                    setOpenEditWorkerDialog(false);
                    fetchServiceWorkers(selectedServiceId);
                }
            } else {
                const res = await API.post(`/api/service-desk/services/${selectedServiceId}/workers`, {
                    name: workerFormData.name,
                    phone: workerFormData.phone,
                    designation: workerFormData.designation,
                    notes: workerFormData.notes
                });
                if (res.data.success) {
                    toast.success('Field worker added successfully');
                    setOpenAddWorkerDialog(false);
                    fetchServiceWorkers(selectedServiceId);
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save worker');
        } finally {
            setSavingWorker(false);
        }
    };

    const handleToggleWorkerStatus = async (worker) => {
        const nextStatus = worker.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        try {
            const res = await API.patch(`/api/service-desk/services/${selectedServiceId}/workers/${worker._id}/status`, {
                status: nextStatus
            });
            if (res.data.success) {
                toast.success(`${worker.name} is now ${nextStatus === 'ACTIVE' ? 'Active' : 'Deactivated'}`);
                fetchServiceWorkers(selectedServiceId);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    const handleDeleteWorker = async (worker) => {
        if (worker.totalTickets > 0) {
            toast.error(`Cannot delete ${worker.name} because they are linked to ${worker.totalTickets} ticket(s). You can deactivate them instead.`);
            return;
        }

        if (window.confirm(`Are you sure you want to delete ${worker.name}? This action cannot be undone.`)) {
            try {
                const res = await API.delete(`/api/service-desk/services/${selectedServiceId}/workers/${worker._id}`);
                if (res.data.success) {
                    toast.success(`${worker.name} deleted successfully`);
                    fetchServiceWorkers(selectedServiceId);
                }
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to delete worker');
            }
        }
    };

    if (loadingInit) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><Loader /></Box>;
    }

    if (adminServices.length === 0) {
        return <PageHeader title="Service Members" subtitle="You are not a Service Admin for any active services." />;
    }

    const currentServiceName = currentService?.name || 'Service';

    // Filter Manual Workers
    const filteredWorkers = workers.filter(w => {
        if (workerStatusFilter !== 'ALL' && w.status !== workerStatusFilter) return false;
        if (workerSearchQuery.trim()) {
            const q = workerSearchQuery.toLowerCase().trim();
            const matchName = w.name?.toLowerCase().includes(q);
            const matchDesignation = w.designation?.toLowerCase().includes(q);
            const matchPhone = w.phone?.toLowerCase().includes(q);
            if (!matchName && !matchDesignation && !matchPhone) return false;
        }
        return true;
    });

    const activeWorkersCount = workers.filter(w => w.status === 'ACTIVE').length;
    const inactiveWorkersCount = workers.filter(w => w.status === 'INACTIVE').length;
    const totalActiveAssignedTickets = workers.reduce((sum, w) => sum + (w.activeTickets || 0), 0);

    return (
        <Box sx={{ px: { xs: 2, md: 3 }, pb: 4 }}>
            <PageHeader 
                title={isDirectEmployeeService ? "Service Members (Portal Employees)" : "Field Workers & Technicians"} 
                subtitle={`${currentServiceName} Team - Manage staff and workload`}
                action={
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        {adminServices.length > 1 && (
                            <FormControl size="small" sx={{ minWidth: 200, bgcolor: 'background.paper' }}>
                                <InputLabel>Select Service</InputLabel>
                                <Select
                                    value={selectedServiceId}
                                    label="Select Service"
                                    onChange={(e) => setSelectedServiceId(e.target.value)}
                                >
                                    {adminServices.map(s => (
                                        <MenuItem key={s._id} value={s._id}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {s.directEmployeeInvolvement === false ? (
                                                    <AdminIcon sx={{ fontSize: 16, color: '#f59e0b' }} />
                                                ) : (
                                                    <EngineeringIcon sx={{ fontSize: 16, color: '#3b82f6' }} />
                                                )}
                                                <span>{s.name}</span>
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                        {isDirectEmployeeService ? (
                            <Button 
                                variant="contained" 
                                startIcon={<PersonAddIcon />} 
                                onClick={() => setOpenAddDialog(true)}
                                sx={{ 
                                    background: 'var(--gradient-primary)',
                                    textTransform: 'none',
                                    borderRadius: '8px',
                                    px: 3,
                                    fontWeight: 600
                                }}
                            >
                                Add Team Member
                            </Button>
                        ) : (
                            <Button 
                                variant="contained" 
                                startIcon={<BuildIcon />} 
                                onClick={handleOpenAddWorker}
                                sx={{ 
                                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                    color: '#ffffff',
                                    textTransform: 'none',
                                    borderRadius: '8px',
                                    px: 3,
                                    fontWeight: 700,
                                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                                    }
                                }}
                            >
                                Add Field Worker
                            </Button>
                        )}
                    </Box>
                }
            />

            {/* Mode Banner for Manual Workers */}
            {!isDirectEmployeeService && (
                <Alert 
                    severity="info" 
                    icon={<AdminIcon />}
                    sx={{ 
                        mb: 3, 
                        borderRadius: '12px',
                        border: '1px solid rgba(245, 158, 11, 0.2)',
                        bgcolor: 'rgba(245, 158, 11, 0.05)',
                        color: '#92400e',
                        '& .MuiAlert-icon': { color: '#d97706' }
                    }}
                >
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        Admin Direct Management Mode
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.2, fontSize: '0.85rem' }}>
                        For <strong>{currentServiceName}</strong>, field workers (technicians, plumbers, electricians, etc.) are managed manually. 
                        <strong> No portal login or credentials are created for these workers.</strong> The Service Admin directly updates ticket statuses, while assigning tickets to active workers for internal delegation and tracking.
                    </Typography>
                </Alert>
            )}

            {/* Top Stats Grid */}
            <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, 
                gap: 3, 
                mb: 4 
            }}>
                {isDirectEmployeeService ? (
                    <>
                        <StatCard title="Total Members" value={serviceEmps.length} icon={<GroupIcon />} color="#1976d2" />
                        <StatCard title="Active Members" value={serviceEmps.length} icon={<AvailableIcon />} color="#2e7d32" />
                        <StatCard title="Service Type" value="Delegated" icon={<EngineeringIcon />} color="#3b82f6" />
                        <StatCard title="Active Tickets" value={0} icon={<TicketIcon />} color="#1976d2" />
                    </>
                ) : (
                    <>
                        <StatCard title="Total Technicians" value={workers.length} icon={<BuildIcon />} color="#d97706" />
                        <StatCard title="Active Workers" value={activeWorkersCount} icon={<AvailableIcon />} color="#2e7d32" />
                        <StatCard title="Deactivated / Inactive" value={inactiveWorkersCount} icon={<InactiveIcon />} color="#94a3b8" />
                        <StatCard title="Active Assigned Tasks" value={totalActiveAssignedTickets} icon={<TicketIcon />} color="#2563eb" />
                    </>
                )}
            </Box>

            {/* ----------------------------------------------------------------- */}
            {/* VIEW A: DIRECT PORTAL EMPLOYEES (directEmployeeInvolvement: true) */}
            {/* ----------------------------------------------------------------- */}
            {isDirectEmployeeService ? (
                loadingEmps ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><Loader /></Box>
                ) : serviceEmps.length === 0 ? (
                    <Paper sx={{ p: 5, textAlign: 'center', borderRadius: '16px', border: '1px dashed var(--border-color)' }}>
                        <Typography variant="body1" color="textSecondary">No team members found for this service.</Typography>
                    </Paper>
                ) : (
                    <Box sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, 
                        gap: 3 
                    }}>
                        {serviceEmps.map((member) => (
                            <Paper key={member._id} sx={{ 
                                p: 3, 
                                borderRadius: '16px', 
                                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                                border: '1px solid var(--border-color)',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Avatar 
                                        src={`https://info.aec.edu.in/aec/employeephotos/${member.employee?.institutionId}.jpg`}
                                        sx={{ width: 56, height: 56, bgcolor: '#e3f2fd', color: '#1976d2', fontWeight: 600 }}
                                    >
                                        {member.employee?.name?.charAt(0)}
                                    </Avatar>
                                    <Chip 
                                        label="active" 
                                        size="small" 
                                        sx={{ 
                                            bgcolor: '#e8f5e9', 
                                            color: '#2e7d32', 
                                            fontWeight: 600, 
                                            fontSize: '0.7rem',
                                            borderRadius: '6px' 
                                        }} 
                                    />
                                </Box>
                                
                                <Box sx={{ mb: 2.5, flexGrow: 1 }}>
                                    <Typography 
                                        variant="subtitle1" 
                                        sx={{ 
                                            fontWeight: 700, 
                                            lineHeight: 1.3, 
                                            mb: 0.5, 
                                            fontSize: '1.05rem', 
                                            color: 'var(--text-primary)',
                                            wordBreak: 'break-word'
                                        }}
                                    >
                                        {member.employee?.name || 'Unknown'}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem', mb: 1.5 }}>
                                        Emp ID: {member.employee?.institutionId || 'N/A'}
                                    </Typography>

                                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 1 }}>
                                        <EmailIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                                        <Typography variant="body2" sx={{ color: 'text.secondary', wordBreak: 'break-all', fontSize: '0.85rem' }}>
                                            {member.employee?.email || 'N/A'}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                        <PhoneIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                                            {member.employee?.phone || 'N/A'}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Divider sx={{ mb: 2 }} />

                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                                    <Button 
                                        size="small" 
                                        color="error"
                                        onClick={() => handleRemoveEmp(member.employee?._id)}
                                        sx={{ 
                                            textTransform: 'none', 
                                            fontWeight: 700,
                                            fontSize: '0.85rem'
                                        }}
                                    >
                                        Remove Member
                                    </Button>
                                </Box>
                            </Paper>
                        ))}
                    </Box>
                )
            ) : (
                /* ----------------------------------------------------------------- */
                /* VIEW B: MANUAL FIELD WORKERS (directEmployeeInvolvement: false)   */
                /* ----------------------------------------------------------------- */
                <Box>
                    {/* Filter & Search Bar */}
                    <Paper sx={{ p: 2, mb: 3, borderRadius: '12px', display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border-color)' }}>
                        <TextField
                            size="small"
                            placeholder="Search worker by name, skill, phone..."
                            value={workerSearchQuery}
                            onChange={(e) => setWorkerSearchQuery(e.target.value)}
                            sx={{ minWidth: 280 }}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                        </InputAdornment>
                                    )
                                }
                            }}
                        />

                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip 
                                label={`All (${workers.length})`}
                                clickable
                                color={workerStatusFilter === 'ALL' ? 'primary' : 'default'}
                                variant={workerStatusFilter === 'ALL' ? 'filled' : 'outlined'}
                                onClick={() => setWorkerStatusFilter('ALL')}
                                sx={{ fontWeight: 600 }}
                            />
                            <Chip 
                                label={`Active (${activeWorkersCount})`}
                                clickable
                                color={workerStatusFilter === 'ACTIVE' ? 'success' : 'default'}
                                variant={workerStatusFilter === 'ACTIVE' ? 'filled' : 'outlined'}
                                onClick={() => setWorkerStatusFilter('ACTIVE')}
                                sx={{ fontWeight: 600 }}
                            />
                            <Chip 
                                label={`Deactivated (${inactiveWorkersCount})`}
                                clickable
                                color={workerStatusFilter === 'INACTIVE' ? 'default' : 'default'}
                                variant={workerStatusFilter === 'INACTIVE' ? 'filled' : 'outlined'}
                                onClick={() => setWorkerStatusFilter('INACTIVE')}
                                sx={{ fontWeight: 600 }}
                            />
                        </Box>
                    </Paper>

                    {loadingWorkers ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><Loader /></Box>
                    ) : filteredWorkers.length === 0 ? (
                        <Paper sx={{ p: 5, textAlign: 'center', borderRadius: '16px', border: '1px dashed var(--border-color)' }}>
                            <BuildIcon sx={{ fontSize: 48, color: '#94a3b8', mb: 1 }} />
                            <Typography variant="h6" sx={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                No field workers found
                            </Typography>
                            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                                {workerSearchQuery || workerStatusFilter !== 'ALL' 
                                    ? 'No workers match your filter criteria.' 
                                    : 'Add field technicians, plumbers, electricians, or maintenance workers for this service.'}
                            </Typography>
                            {!workerSearchQuery && workerStatusFilter === 'ALL' && (
                                <Button 
                                    variant="contained" 
                                    startIcon={<BuildIcon />}
                                    onClick={handleOpenAddWorker}
                                    sx={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', textTransform: 'none', borderRadius: '8px' }}
                                >
                                    Add First Field Worker
                                </Button>
                            )}
                        </Paper>
                    ) : (
                        <Box sx={{ 
                            display: 'grid', 
                            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, 
                            gap: 3 
                        }}>
                            {filteredWorkers.map((worker) => {
                                const isActive = worker.status === 'ACTIVE';
                                return (
                                    <Paper key={worker._id} sx={{ 
                                        p: 3, 
                                        borderRadius: '16px', 
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                                        border: isActive ? '1px solid var(--border-color)' : '1px dashed #cbd5e1',
                                        bgcolor: isActive ? '#ffffff' : '#f8fafc',
                                        opacity: isActive ? 1 : 0.85,
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        position: 'relative'
                                    }}>
                                        {/* Top Header */}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                            <Avatar 
                                                sx={{ 
                                                    width: 52, 
                                                    height: 52, 
                                                    bgcolor: isActive ? '#fef3c7' : '#e2e8f0', 
                                                    color: isActive ? '#d97706' : '#64748b', 
                                                    fontWeight: 800,
                                                    fontSize: '1.2rem'
                                                }}
                                            >
                                                {worker.name?.charAt(0)?.toUpperCase()}
                                            </Avatar>
                                            
                                            {/* Status Badge */}
                                            <Chip 
                                                label={isActive ? "Active" : "Deactivated"} 
                                                size="small" 
                                                sx={{ 
                                                    bgcolor: isActive ? '#dcfce7' : '#f1f5f9', 
                                                    color: isActive ? '#15803d' : '#64748b', 
                                                    fontWeight: 700, 
                                                    fontSize: '0.72rem',
                                                    borderRadius: '6px' 
                                                }} 
                                            />
                                        </Box>

                                        {/* Worker Info */}
                                        <Box sx={{ mb: 2, flexGrow: 1 }}>
                                            <Typography 
                                                variant="subtitle1" 
                                                sx={{ 
                                                    fontWeight: 700, 
                                                    lineHeight: 1.3, 
                                                    mb: 0.5, 
                                                    fontSize: '1.05rem', 
                                                    color: 'var(--text-primary)',
                                                    wordBreak: 'break-word'
                                                }}
                                            >
                                                {worker.name}
                                            </Typography>
                                            
                                            {/* Designation / Skill */}
                                            <Chip 
                                                label={worker.designation || 'Field Technician'} 
                                                size="small"
                                                icon={<BuildIcon sx={{ fontSize: '13px !important' }} />}
                                                sx={{ 
                                                    mb: 1.5,
                                                    bgcolor: '#f1f5f9', 
                                                    color: '#334155', 
                                                    fontWeight: 600, 
                                                    fontSize: '0.75rem',
                                                    borderRadius: '6px'
                                                }}
                                            />

                                            {/* Phone */}
                                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 1 }}>
                                                <PhoneIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                                                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem', fontWeight: 500 }}>
                                                    {worker.phone || 'No phone provided'}
                                                </Typography>
                                            </Box>

                                            {/* Notes / Specialization */}
                                            {worker.notes && (
                                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontStyle: 'italic', mt: 0.5 }}>
                                                    "{worker.notes}"
                                                </Typography>
                                            )}
                                        </Box>

                                        <Divider sx={{ mb: 2 }} />

                                        {/* Workload Stats */}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', mb: 2, bgcolor: '#f8fafc', py: 1, borderRadius: '8px' }}>
                                            <Box sx={{ textAlign: 'center' }}>
                                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                                    Active Tasks
                                                </Typography>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: worker.activeTickets > 0 ? '#2563eb' : 'text.primary' }}>
                                                    {worker.activeTickets || 0}
                                                </Typography>
                                            </Box>
                                            <Divider orientation="vertical" flexItem />
                                            <Box sx={{ textAlign: 'center' }}>
                                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                                    Total Linked
                                                </Typography>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                                                    {worker.totalTickets || 0}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        {/* Actions Row */}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            {/* Active / Deactivate Toggle Button */}
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                color={isActive ? "warning" : "success"}
                                                onClick={() => handleToggleWorkerStatus(worker)}
                                                sx={{ 
                                                    textTransform: 'none', 
                                                    borderRadius: '6px', 
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    py: 0.4
                                                }}
                                            >
                                                {isActive ? "Deactivate" : "Activate"}
                                            </Button>

                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                <Tooltip title="Edit Details">
                                                    <IconButton 
                                                        size="small" 
                                                        onClick={() => handleOpenEditWorker(worker)}
                                                        sx={{ color: '#2563eb', bgcolor: '#eff6ff', '&:hover': { bgcolor: '#dbeafe' } }}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>

                                                <Tooltip title={worker.totalTickets > 0 ? `Cannot delete (${worker.totalTickets} tickets linked)` : "Delete Worker"}>
                                                    <span>
                                                        <IconButton 
                                                            size="small" 
                                                            disabled={worker.totalTickets > 0}
                                                            onClick={() => handleDeleteWorker(worker)}
                                                            sx={{ 
                                                                color: '#dc2626', 
                                                                bgcolor: worker.totalTickets > 0 ? '#f1f5f9' : '#fef2f2', 
                                                                '&:hover': { bgcolor: '#fee2e2' } 
                                                            }}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                            </Box>
                                        </Box>
                                    </Paper>
                                );
                            })}
                        </Box>
                    )}
                </Box>
            )}

            {/* ------------------------------------------------------------- */}
            {/* MODAL 1: Add Direct Employee (Portal Staff)                   */}
            {/* ------------------------------------------------------------- */}
            <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add Team Member (University Employee)</DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                            Search for an employee by name or ID to add them to {currentServiceName}'s Service Desk team.
                        </Typography>
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
                                    label="Search Employee"
                                    placeholder="Type name or ID..."
                                    slotProps={{
                                        input: {
                                            ...(params.InputProps || {}),
                                            endAdornment: (
                                                <React.Fragment>
                                                    {searchingEmployees ? <Loader color="inherit" size={20} /> : null}
                                                    {params.InputProps?.endAdornment}
                                                </React.Fragment>
                                            ),
                                        }
                                    }}
                                />
                            )}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, px: 3 }}>
                    <Button onClick={() => setOpenAddDialog(false)} color="inherit">Cancel</Button>
                    <Button
                        variant="contained"
                        disabled={!selectedEmployeeToAdd || addingEmp}
                        onClick={handleAddEmp}
                        sx={{ px: 4, background: 'var(--gradient-primary)' }}
                    >
                        {addingEmp ? 'Adding...' : 'Add Member'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ------------------------------------------------------------- */}
            {/* MODAL 2: Add Manual Field Worker (No Login)                   */}
            {/* ------------------------------------------------------------- */}
            <Dialog open={openAddWorkerDialog} onClose={() => setOpenAddWorkerDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BuildIcon sx={{ color: '#d97706' }} />
                    <span>Add Manual Field Worker / Technician</span>
                </DialogTitle>
                <DialogContent dividers>
                    <Alert severity="info" sx={{ mb: 2.5, borderRadius: '8px', fontSize: '0.85rem' }}>
                        This worker will be added for internal ticket assignments. No login account or password will be created.
                    </Alert>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
                        <TextField
                            fullWidth
                            required
                            label="Worker Full Name"
                            placeholder="e.g. Ramesh Kumar"
                            value={workerFormData.name}
                            onChange={(e) => setWorkerFormData({ ...workerFormData, name: e.target.value })}
                        />

                        <TextField
                            fullWidth
                            label="Phone / Mobile Number"
                            placeholder="e.g. 9876543210"
                            value={workerFormData.phone}
                            onChange={(e) => setWorkerFormData({ ...workerFormData, phone: e.target.value })}
                        />

                        <TextField
                            fullWidth
                            label="Designation / Skill / Trade"
                            placeholder="e.g. Electrician, Plumber, Carpenter, AC Tech, Cleaner"
                            value={workerFormData.designation}
                            onChange={(e) => setWorkerFormData({ ...workerFormData, designation: e.target.value })}
                        />

                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Notes / Specialization (Optional)"
                            placeholder="e.g. Handles hostel wiring, works general shift, contractor technician..."
                            value={workerFormData.notes}
                            onChange={(e) => setWorkerFormData({ ...workerFormData, notes: e.target.value })}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, px: 3 }}>
                    <Button onClick={() => setOpenAddWorkerDialog(false)} color="inherit">Cancel</Button>
                    <Button
                        variant="contained"
                        disabled={!workerFormData.name.trim() || savingWorker}
                        onClick={() => handleSaveWorker(false)}
                        sx={{ 
                            px: 4, 
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            fontWeight: 700
                        }}
                    >
                        {savingWorker ? 'Saving...' : 'Add Worker'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ------------------------------------------------------------- */}
            {/* MODAL 3: Edit Manual Field Worker                             */}
            {/* ------------------------------------------------------------- */}
            <Dialog open={openEditWorkerDialog} onClose={() => setOpenEditWorkerDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EditIcon sx={{ color: '#2563eb' }} />
                    <span>Edit Field Worker Details</span>
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
                        <TextField
                            fullWidth
                            required
                            label="Worker Full Name"
                            value={workerFormData.name}
                            onChange={(e) => setWorkerFormData({ ...workerFormData, name: e.target.value })}
                        />

                        <TextField
                            fullWidth
                            label="Phone / Mobile Number"
                            value={workerFormData.phone}
                            onChange={(e) => setWorkerFormData({ ...workerFormData, phone: e.target.value })}
                        />

                        <TextField
                            fullWidth
                            label="Designation / Skill / Trade"
                            value={workerFormData.designation}
                            onChange={(e) => setWorkerFormData({ ...workerFormData, designation: e.target.value })}
                        />

                        <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={workerFormData.status}
                                label="Status"
                                onChange={(e) => setWorkerFormData({ ...workerFormData, status: e.target.value })}
                            >
                                <MenuItem value="ACTIVE">🟢 Active (Available for assignments)</MenuItem>
                                <MenuItem value="INACTIVE">⚪ Inactive / Deactivated (Cannot be assigned)</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Notes / Specialization"
                            value={workerFormData.notes}
                            onChange={(e) => setWorkerFormData({ ...workerFormData, notes: e.target.value })}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, px: 3 }}>
                    <Button onClick={() => setOpenEditWorkerDialog(false)} color="inherit">Cancel</Button>
                    <Button
                        variant="contained"
                        disabled={!workerFormData.name.trim() || savingWorker}
                        onClick={() => handleSaveWorker(true)}
                        sx={{ px: 4, background: 'var(--gradient-primary)', fontWeight: 700 }}
                    >
                        {savingWorker ? 'Saving...' : 'Update Worker'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ManageServiceMembers;
