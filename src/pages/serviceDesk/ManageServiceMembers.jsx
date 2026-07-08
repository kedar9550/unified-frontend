import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, CircularProgress, Chip, Dialog, DialogTitle, DialogContent, 
    DialogActions, TextField, Autocomplete, Avatar, Divider, Grid, Paper, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { 
    Group as GroupIcon, CheckCircle as AvailableIcon, 
    AccessTime as BusyIcon, ConfirmationNumber as TicketIcon,
    EmailOutlined as EmailIcon, PhoneOutlined as PhoneIcon,
    PersonAdd as PersonAddIcon
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
            <Typography variant="body2" sx={{ color, fontWeight: 500 }}>
                {title}
            </Typography>
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'var(--text-primary)' }}>
            {value}
        </Typography>
    </Paper>
);

const ManageServiceMembers = () => {
    const [loadingInit, setLoadingInit] = useState(true);
    const [adminServices, setAdminServices] = useState([]);
    const [selectedServiceId, setSelectedServiceId] = useState('');
    
    const [serviceEmps, setServiceEmps] = useState([]);
    const [loadingEmps, setLoadingEmps] = useState(false);

    // Dialog state
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
    const [employeeSearchResults, setEmployeeSearchResults] = useState([]);
    const [searchingEmployees, setSearchingEmployees] = useState(false);
    const [selectedEmployeeToAdd, setSelectedEmployeeToAdd] = useState(null);
    const [addingEmp, setAddingEmp] = useState(false);

    useEffect(() => {
        const fetchMemberships = async () => {
            try {
                const res = await API.get('/api/service-desk/services/my-memberships');
                if (res.data.success) {
                    const services = res.data.data.adminOf || [];
                    setAdminServices(services);
                    if (services.length > 0) {
                        setSelectedServiceId(services[0]._id);
                    }
                }
            } catch (error) {
                toast.error('Failed to load your services');
            } finally {
                setLoadingInit(false);
            }
        };
        fetchMemberships();
    }, []);

    useEffect(() => {
        if (selectedServiceId) {
            fetchServiceEmps(selectedServiceId);
        } else {
            setServiceEmps([]);
        }
    }, [selectedServiceId]);

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

    // Employee search autocomplete logic
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (employeeSearchQuery.trim().length >= 2) {
                setSearchingEmployees(true);
                try {
                    const res = await API.get(`/api/employees/search?query=${employeeSearchQuery}`);
                    if (Array.isArray(res.data)) setEmployeeSearchResults(res.data);
                } catch (error) {
                    console.error(error);
                } finally {
                    setSearchingEmployees(false);
                }
            } else {
                setEmployeeSearchResults([]);
            }
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [employeeSearchQuery]);

    const handleAddEmp = async () => {
        if (!selectedEmployeeToAdd) return;
        try {
            setAddingEmp(true);
            const res = await API.post(`/api/service-desk/services/${selectedServiceId}/emps`, {
                employeeId: selectedEmployeeToAdd._id
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

    if (loadingInit) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
    }

    if (adminServices.length === 0) {
        return <PageHeader title="Service Members" subtitle="You are not a Service Admin for any active services." />;
    }

    const currentServiceName = adminServices.find(s => s._id === selectedServiceId)?.name || 'Service';

    // Dummy logic for stats since backend doesn't provide it yet
    const availableCount = serviceEmps.length;
    const busyCount = 0;
    const activeTicketsTotal = 0;

    return (
        <Box sx={{ px: { xs: 2, md: 3 }, pb: 4 }}>
            <PageHeader 
                title="Service Members" 
                subtitle={`${currentServiceName} Team - View member profiles and workload`}
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
                                        <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
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
                    </Box>
                }
            />

            {/* Top Stats Grid */}
            <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, 
                gap: 3, 
                mb: 4 
            }}>
                <StatCard title="Total Members" value={serviceEmps.length} icon={<GroupIcon />} color="#1976d2" />
                <StatCard title="Available" value={availableCount} icon={<AvailableIcon />} color="#2e7d32" />
                <StatCard title="Busy" value={busyCount} icon={<BusyIcon />} color="#ed6c02" />
                <StatCard title="Active Tickets" value={activeTicketsTotal} icon={<TicketIcon />} color="#1976d2" />
            </Box>

            {/* Members Grid */}
            {loadingEmps ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
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
                            {/* Header */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                <Avatar 
                                    src={`https://info.aec.edu.in/aec/employeephotos/${member.employee?.institutionId}.jpg`}
                                    sx={{ width: 56, height: 56, bgcolor: '#e3f2fd', color: '#1976d2', fontWeight: 600 }}
                                >
                                    {member.employee?.name?.charAt(0)}
                                </Avatar>
                                <Chip 
                                    label="available" 
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

                                {/* Contact Details */}
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

                            {/* Footer Stats */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                                        Active Tickets
                                    </Typography>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                        0
                                    </Typography>
                                </Box>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                                        Completed
                                    </Typography>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#2e7d32' }}>
                                        0
                                    </Typography>
                                </Box>
                                {/* Action to remove */}
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Button 
                                        size="small" 
                                        onClick={() => handleRemoveEmp(member.employee?._id)}
                                        sx={{ 
                                            textTransform: 'none', 
                                            minWidth: 'auto', 
                                            p: 1,
                                            color: '#0d47a1',
                                            fontWeight: 700,
                                            fontSize: '0.85rem',
                                            '&:hover': { background: 'transparent', textDecoration: 'underline' }
                                        }}
                                    >
                                        Remove
                                    </Button>
                                </Box>
                            </Box>
                        </Paper>
                    ))}
                </Box>
            )}

            {/* Add Member Dialog */}
            <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add Team Member</DialogTitle>
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
        </Box>
    );
};

export default ManageServiceMembers;
