import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, CircularProgress, Tooltip, IconButton, Chip, Select, MenuItem, FormControl, InputLabel,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Autocomplete, Tabs, Tab
} from '@mui/material';
import { Visibility, AssignmentInd as AssignIcon, Block as RejectIcon, Close as CloseIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/data/DataTable';
import API from '../../api/axios';
import { toast } from 'sonner';

const getStatusColor = (status) => {
    switch (status) {
        case 'OPEN': return 'info';
        case 'ASSIGNED': return 'secondary';
        case 'IN_PROGRESS': return 'warning';
        case 'RESOLVED': return 'success';
        case 'REJECTED': return 'error';
        case 'CLOSED': return 'default';
        default: return 'default';
    }
};

const ManageTickets = () => {
    const navigate = useNavigate();
    const [loadingInit, setLoadingInit] = useState(true);
    const [adminServices, setAdminServices] = useState([]);
    const [selectedServiceId, setSelectedServiceId] = useState('');
    const [tickets, setTickets] = useState([]);
    const [loadingTickets, setLoadingTickets] = useState(false);
    const [currentTab, setCurrentTab] = useState('active');

    // Dialog: Reject Ticket
    const [openRejectDialog, setOpenRejectDialog] = useState(false);
    const [rejectTicket, setRejectTicket] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [rejecting, setRejecting] = useState(false);

    // Dialog: Assign Ticket
    const [openAssignDialog, setOpenAssignDialog] = useState(false);
    const [assignTicketTarget, setAssignTicketTarget] = useState(null);
    const [selectedAssignees, setSelectedAssignees] = useState([]);
    const [assignPriority, setAssignPriority] = useState('');
    const [assignDueDate, setAssignDueDate] = useState('');
    const [assigning, setAssigning] = useState(false);
    const [availableEmpsForAssign, setAvailableEmpsForAssign] = useState([]);

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
            fetchTickets(selectedServiceId, currentTab);
        } else {
            setTickets([]);
        }
    }, [selectedServiceId, currentTab]);

    const fetchTickets = async (serviceId, tabStr) => {
        try {
            setLoadingTickets(true);
            const res = await API.get(`/api/service-desk/tickets/service/${serviceId}?tab=${tabStr}`);
            if (res.data.success) {
                setTickets(res.data.data);
            }
        } catch (error) {
            toast.error('Failed to load tickets');
        } finally {
            setLoadingTickets(false);
        }
    };

    // --- REJECT TICKET LOGIC ---
    const handleOpenReject = (ticket) => {
        setRejectTicket(ticket);
        setRejectReason('');
        setOpenRejectDialog(true);
    };

    const submitReject = async () => {
        try {
            setRejecting(true);
            const res = await API.post(`/api/service-desk/tickets/${rejectTicket._id}/reject`, { reason: rejectReason });
            if (res.data.success) {
                toast.success('Ticket rejected');
                setOpenRejectDialog(false);
                fetchTickets(selectedServiceId, currentTab);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reject ticket');
        } finally {
            setRejecting(false);
        }
    };

    // --- ASSIGN TICKET LOGIC ---
    const handleOpenAssign = async (ticket) => {
        setAssignTicketTarget(ticket);
        setAssignPriority(ticket.priority || 'MEDIUM');
        setAssignDueDate(ticket.dueDate ? ticket.dueDate.split('T')[0] : '');
        const existingIds = ticket.assignedTo.filter(a => a.status !== 'REJECTED').map(a => a.employee._id);
        setSelectedAssignees([]); 
        setOpenAssignDialog(true);
        
        try {
            const res = await API.get(`/api/service-desk/services/${selectedServiceId}/emps`);
            if (res.data.success) {
                const emps = res.data.data.map(m => m.employee).filter(Boolean);
                setAvailableEmpsForAssign(emps);
                setSelectedAssignees(emps.filter(e => existingIds.includes(e._id)));
            }
        } catch (error) {
            toast.error('Failed to load service employees for assignment');
        }
    };

    const submitAssign = async () => {
        if (selectedAssignees.length === 0) {
            toast.error('Select at least one employee');
            return;
        }
        try {
            setAssigning(true);
            const res = await API.post(`/api/service-desk/tickets/${assignTicketTarget._id}/assign`, {
                employeeIds: selectedAssignees.map(e => e._id),
                priority: assignPriority,
                dueDate: assignDueDate || null
            });
            if (res.data.success) {
                toast.success('Ticket assigned successfully');
                setOpenAssignDialog(false);
                fetchTickets(selectedServiceId, currentTab);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to assign ticket');
        } finally {
            setAssigning(false);
        }
    };

    if (loadingInit) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
    }

    if (adminServices.length === 0) {
        return (
            <Box>
                <PageHeader title="Manage Tickets" subtitle="You are not a Service Admin for any active services." />
            </Box>
        );
    }

    const currentServiceName = adminServices.find(s => s._id === selectedServiceId)?.name || 'Service';

    return (
        <Box>
            <PageHeader 
                title="Manage Tickets" 
                subtitle={`Admin Dashboard for ${currentServiceName}`}
            />

            <Box sx={{ p: 3 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
                        <Tab label="Active Tickets" value="active" sx={{ fontWeight: 600 }} />
                        <Tab label="Reject History" value="rejected" sx={{ fontWeight: 600 }} />
                    </Tabs>

                    {adminServices.length > 1 && (
                        <Box sx={{ minWidth: 200 }}>
                            <FormControl fullWidth size="small">
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
                        </Box>
                    )}
                </Box>

                {loadingTickets ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress />
                    </Box>
                ) : tickets.length === 0 ? (
                    <Box sx={{
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        py: 8, px: 3, background: "var(--bg-panel)", borderRadius: "16px",
                        border: "1px dashed var(--border-color)", boxShadow: "var(--shadow-premium)", textAlign: "center"
                    }}>
                        <Typography variant="h6" sx={{ color: "var(--text-secondary)", fontWeight: 600, mb: 1 }}>
                            No Tickets Found
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
                            There are currently no tickets submitted for {currentServiceName}.
                        </Typography>
                    </Box>
                ) : (
                    <DataTable 
                        columns={["Ticket #", "Requester", "Title", "Priority", "Status", "Date", "Actions"]}
                        alignments={["left", "left", "left", "center", "center", "center", "center"]}
                        nonSortableColumns={[6]}
                        rows={tickets.map(t => [
                            { value: t.ticketNumber, display: <Typography fontWeight={600} color="primary">#{t.ticketNumber}</Typography> },
                            { value: t.createdBy?.name, display: t.createdBy?.name || 'Unknown' },
                            { value: t.title, display: t.title },
                            { 
                                value: t.priority, 
                                display: <Typography fontSize="0.875rem" fontWeight={500} color={t.priority === 'HIGH' ? 'error.main' : t.priority === 'MEDIUM' ? 'warning.main' : 'text.secondary'}>{t.priority}</Typography> 
                            },
                            { 
                                value: t.status, 
                                display: (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                                        <Chip label={t.status} color={getStatusColor(t.status)} size="small" sx={{ fontWeight: 600, borderRadius: '6px' }} />
                                        {t.assignedTo?.filter(a => a.status === 'REJECTED').length > 0 && currentTab === 'active' && (
                                            <Tooltip title={`${t.assignedTo.filter(a => a.status === 'REJECTED').length} assignee(s) rejected`}>
                                                <Chip 
                                                    label={`${t.assignedTo.filter(a => a.status === 'REJECTED').length} Rejected`} 
                                                    color="error" 
                                                    size="small" 
                                                    variant="outlined" 
                                                    sx={{ fontWeight: 600, borderRadius: '6px', height: '22px', fontSize: '0.7rem' }} 
                                                />
                                            </Tooltip>
                                        )}
                                    </Box>
                                )
                            },
                            {
                                value: t.createdAt,
                                display: <Typography fontSize="0.875rem" color="text.secondary">{t.createdAt ? new Date(t.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</Typography>
                            },
                            {
                                value: '',
                                display: (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                        {['OPEN', 'ASSIGNED', 'IN_PROGRESS'].includes(t.status) && (
                                            <Tooltip title="Assign Employees">
                                                <IconButton color="secondary" onClick={() => handleOpenAssign(t)} size="small" sx={{ background: 'var(--bg-glass)' }}>
                                                    <AssignIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        {['OPEN', 'ASSIGNED', 'IN_PROGRESS'].includes(t.status) && (
                                            <Tooltip title="Reject Ticket">
                                                <IconButton color="error" onClick={() => handleOpenReject(t)} size="small" sx={{ background: 'var(--bg-glass)' }}>
                                                    <RejectIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        <Tooltip title="View Ticket">
                                            <IconButton color="primary" onClick={() => navigate(`/service-desk/ticket/${t._id}`)} size="small" sx={{ background: 'var(--bg-glass)' }}>
                                                <Visibility fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                )
                            }
                        ])}
                    />
                )}
            </Box>

            {/* Reject Dialog */}
            <Dialog open={openRejectDialog} onClose={() => setOpenRejectDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Reject Ticket</DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Are you sure you want to reject ticket #{rejectTicket?.ticketNumber}? This action is permanent and will notify the requester.
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Rejection Reason (Optional)"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2, px: 3 }}>
                    <Button onClick={() => setOpenRejectDialog(false)} disabled={rejecting}>Cancel</Button>
                    <Button color="error" variant="contained" onClick={submitReject} disabled={rejecting}>
                        {rejecting ? 'Rejecting...' : 'Reject'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Assign Dialog */}
            <Dialog open={openAssignDialog} onClose={() => setOpenAssignDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Assign Ticket #{assignTicketTarget?.ticketNumber}</DialogTitle>
                <DialogContent dividers sx={{ minHeight: '300px' }}>
                    <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Priority</InputLabel>
                            <Select
                                value={assignPriority}
                                label="Priority"
                                onChange={(e) => setAssignPriority(e.target.value)}
                            >
                                <MenuItem value="LOW">Low</MenuItem>
                                <MenuItem value="MEDIUM">Medium</MenuItem>
                                <MenuItem value="HIGH">High</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            size="small"
                            type="date"
                            label="Due Date"
                            slotProps={{ 
                                inputLabel: { shrink: true },
                                htmlInput: { min: new Date().toISOString().split('T')[0] }
                            }}
                            value={assignDueDate}
                            onChange={(e) => setAssignDueDate(e.target.value)}
                        />
                    </Box>

                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Assign To</Typography>
                    <Autocomplete
                        multiple
                        fullWidth
                        options={availableEmpsForAssign}
                        getOptionLabel={(option) => `${option.name} (${option.institutionId})`}
                        isOptionEqualToValue={(option, value) => option._id === value._id}
                        value={selectedAssignees}
                        onChange={(e, newValue) => setSelectedAssignees(newValue)}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                variant="outlined"
                                placeholder="Select Employees"
                            />
                        )}
                        noOptionsText="No employees available for this service."
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2, px: 3 }}>
                    <Button onClick={() => setOpenAssignDialog(false)} disabled={assigning}>Cancel</Button>
                    <Button color="primary" variant="contained" onClick={submitAssign} disabled={assigning}>
                        {assigning ? 'Assigning...' : 'Assign'}
                    </Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
};

export default ManageTickets;
