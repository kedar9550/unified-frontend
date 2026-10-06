import Loader from "../../components/common/Loader";
import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Tooltip, IconButton, Chip, Select, MenuItem, FormControl, InputLabel,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Autocomplete, Tabs, Tab
} from '@mui/material';
import { 
    Visibility, 
    AssignmentInd as AssignIcon, 
    Block as RejectIcon, 
    EditCalendar as EditCalendarIcon, 
    Close as CloseIcon,
    Build as BuildIcon,
    Engineering as EngineeringIcon,
    AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import { PageContainer } from '../../components/common/design-system';
import DataTable from '../../components/data/DataTable';
import API from '../../api/axios';
import { toast } from 'sonner';
import {
    PriorityBadge,
    DueCountdownBadge,
    calculateSlaDueDate,
    formatForDateTimeInput
} from '../../utils/serviceDeskSla';

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
    const [selectedWorkers, setSelectedWorkers] = useState([]);
    const [assignWorkerNote, setAssignWorkerNote] = useState('');
    const [assignPriority, setAssignPriority] = useState('MEDIUM');
    const [assignDueDate, setAssignDueDate] = useState('');
    const [assigning, setAssigning] = useState(false);
    const [availableEmpsForAssign, setAvailableEmpsForAssign] = useState([]);
    const [availableWorkersForAssign, setAvailableWorkersForAssign] = useState([]);

    // Dialog: Update SLA / Due Date directly
    const [openSlaDialog, setOpenSlaDialog] = useState(false);
    const [slaTicketTarget, setSlaTicketTarget] = useState(null);
    const [slaPriority, setSlaPriority] = useState('MEDIUM');
    const [slaDueDate, setSlaDueDate] = useState('');
    const [updatingSla, setUpdatingSla] = useState(false);

    const currentService = adminServices.find(s => s._id === selectedServiceId);
    const isDirectEmployeeService = currentService?.directEmployeeInvolvement !== false;

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
        const p = ticket.priority || 'MEDIUM';
        setAssignPriority(p);
        setAssignDueDate(formatForDateTimeInput(ticket.dueDate || calculateSlaDueDate(p, ticket.createdAt)));
        setAssignWorkerNote('');
        setSelectedAssignees([]);
        setSelectedWorkers([]);
        setOpenAssignDialog(true);
        
        if (!isDirectEmployeeService) {
            // Fetch active manual field workers
            try {
                const res = await API.get(`/api/service-desk/services/${selectedServiceId}/workers?status=ACTIVE`);
                if (res.data.success) {
                    const workers = res.data.data || [];
                    setAvailableWorkersForAssign(workers);
                    const existingWorkerIds = (ticket.assignedWorkers || []).map(w => w.worker?._id || w.worker);
                    setSelectedWorkers(workers.filter(w => existingWorkerIds.includes(w._id)));
                }
            } catch (error) {
                toast.error('Failed to load active field workers for assignment');
            }
        } else {
            // Fetch direct portal employees
            try {
                const res = await API.get(`/api/service-desk/services/${selectedServiceId}/emps?activeOnly=true`);
                if (res.data.success) {
                    const emps = res.data.data.filter(m => m.isActive !== false).map(m => m.employee).filter(Boolean);
                    setAvailableEmpsForAssign(emps);
                    const existingIds = (ticket.assignedTo || []).filter(a => a.status !== 'REJECTED').map(a => a.employee?._id || a.employee);
                    setSelectedAssignees(emps.filter(e => existingIds.includes(e._id)));
                }
            } catch (error) {
                toast.error('Failed to load service employees for assignment');
            }
        }
    };

    const handleAssignPriorityChange = (newPriority) => {
        setAssignPriority(newPriority);
        if (assignTicketTarget) {
            const newDue = calculateSlaDueDate(newPriority, assignTicketTarget.createdAt || new Date());
            setAssignDueDate(formatForDateTimeInput(newDue));
        }
    };

    const submitAssign = async () => {
        if (!isDirectEmployeeService) {
            if (selectedWorkers.length === 0) {
                toast.error('Select at least one technician / field worker');
                return;
            }
            try {
                setAssigning(true);
                const res = await API.post(`/api/service-desk/tickets/${assignTicketTarget._id}/assign-workers`, {
                    workerIds: selectedWorkers.map(w => w._id),
                    priority: assignPriority,
                    dueDate: assignDueDate ? new Date(assignDueDate) : null,
                    note: assignWorkerNote
                });
                if (res.data.success) {
                    toast.success('Field technicians assigned successfully');
                    setOpenAssignDialog(false);
                    fetchTickets(selectedServiceId, currentTab);
                }
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to assign technicians');
            } finally {
                setAssigning(false);
            }
        } else {
            if (selectedAssignees.length === 0) {
                toast.error('Select at least one employee');
                return;
            }
            try {
                setAssigning(true);
                const res = await API.post(`/api/service-desk/tickets/${assignTicketTarget._id}/assign`, {
                    employeeIds: selectedAssignees.map(e => e._id),
                    priority: assignPriority,
                    dueDate: assignDueDate ? new Date(assignDueDate) : null
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
        }
    };

    // --- SLA / DUE DATE LOGIC ---
    const handleOpenSlaModal = (ticket) => {
        setSlaTicketTarget(ticket);
        const p = ticket.priority || 'MEDIUM';
        setSlaPriority(p);
        setSlaDueDate(formatForDateTimeInput(ticket.dueDate || calculateSlaDueDate(p, ticket.createdAt)));
        setOpenSlaDialog(true);
    };

    const handleSlaPriorityChange = (newPriority) => {
        setSlaPriority(newPriority);
        if (slaTicketTarget) {
            const newDue = calculateSlaDueDate(newPriority, slaTicketTarget.createdAt || new Date());
            setSlaDueDate(formatForDateTimeInput(newDue));
        }
    };

    const submitSlaUpdate = async () => {
        try {
            setUpdatingSla(true);
            const res = await API.put(`/api/service-desk/tickets/${slaTicketTarget._id}/sla`, {
                priority: slaPriority,
                dueDate: slaDueDate ? new Date(slaDueDate) : null
            });
            if (res.data.success) {
                toast.success('Priority and Due Date updated');
                setOpenSlaDialog(false);
                fetchTickets(selectedServiceId, currentTab);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update SLA');
        } finally {
            setUpdatingSla(false);
        }
    };

    if (loadingInit) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><Loader /></Box>;
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
        <PageContainer>
            <PageHeader 
                title="Manage Tickets" 
                subtitle={`Admin Dashboard for ${currentServiceName}`}
            />

            <Box>
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
                        <Loader />
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
                        showViewModeSwitcher={true}
                        columns={["Ticket #", "Requester", "Title / Work Assignment", "Priority", "Status", "Due Date / SLA", "Created", "Actions"]}
                        alignments={["left", "left", "left", "center", "center", "center", "center", "center"]}
                        nonSortableColumns={[7]}
                        rows={tickets.map(t => [
                            { value: t.ticketNumber, display: <Typography fontWeight={600} color="primary">#{t.ticketNumber}</Typography> },
                            { 
                                value: t.creatorType === 'STUDENT' ? t.studentDetails?.studentname : t.createdBy?.name, 
                                display: t.creatorType === 'STUDENT' ? (
                                    <Box>
                                        <Typography sx={{ fontWeight: 600, color: '#1d4ed8', fontSize: '0.875rem' }}>
                                            🎓 {t.studentDetails?.studentname || 'Student'}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            {t.studentDetails?.rollno} ({t.studentDetails?.branch || 'Student'})
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                        {t.createdBy?.name || 'Staff Member'}
                                    </Typography>
                                )
                            },
                            {
                                value: t.title,
                                display: (
                                    <Box>
                                        <Typography sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.title}</Typography>
                                        {t.subcategory && t.subcategory !== t.title && (
                                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                                {t.subcategory}
                                            </Typography>
                                        )}
                                        {/* Assigned Field Workers Badge */}
                                        {t.assignedWorkers && t.assignedWorkers.length > 0 && (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                                {t.assignedWorkers.map((aw, idx) => (
                                                    <Chip
                                                        key={idx}
                                                        size="small"
                                                        icon={<BuildIcon sx={{ fontSize: '11px !important' }} />}
                                                        label={aw.worker?.name || 'Technician'}
                                                        sx={{ 
                                                            height: '20px', 
                                                            fontSize: '0.68rem', 
                                                            bgcolor: '#fef3c7', 
                                                            color: '#92400e',
                                                            fontWeight: 600
                                                        }}
                                                    />
                                                ))}
                                            </Box>
                                        )}
                                        {/* Assigned Direct Portal Employees Badge */}
                                        {isDirectEmployeeService && t.assignedTo && t.assignedTo.length > 0 && (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                                {t.assignedTo.filter(a => a.status !== 'REJECTED').map((at, idx) => (
                                                    <Chip
                                                        key={idx}
                                                        size="small"
                                                        icon={<EngineeringIcon sx={{ fontSize: '11px !important' }} />}
                                                        label={at.employee?.name || 'Assigned Staff'}
                                                        sx={{ 
                                                            height: '20px', 
                                                            fontSize: '0.68rem', 
                                                            bgcolor: '#e0f2fe', 
                                                            color: '#0369a1',
                                                            fontWeight: 600
                                                        }}
                                                    />
                                                ))}
                                            </Box>
                                        )}
                                    </Box>
                                )
                            },
                            { 
                                value: t.priority, 
                                display: <PriorityBadge priority={t.priority} />
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
                                value: t.dueDate || '',
                                display: <DueCountdownBadge dueDate={t.dueDate} status={t.status} />
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
                                            <Tooltip title={isDirectEmployeeService ? "Assign Employees" : "Assign Field Workers"}>
                                                <IconButton 
                                                    color={isDirectEmployeeService ? "secondary" : "warning"} 
                                                    onClick={() => handleOpenAssign(t)} 
                                                    size="small" 
                                                    sx={{ background: 'var(--bg-glass)' }}
                                                >
                                                    {isDirectEmployeeService ? <AssignIcon fontSize="small" /> : <BuildIcon fontSize="small" />}
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        {['OPEN', 'ASSIGNED', 'IN_PROGRESS'].includes(t.status) && (
                                            <Tooltip title="Adjust Priority & Due Date (SLA)">
                                                <IconButton color="warning" onClick={() => handleOpenSlaModal(t)} size="small" sx={{ background: 'var(--bg-glass)' }}>
                                                    <EditCalendarIcon fontSize="small" />
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
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {isDirectEmployeeService ? <AssignIcon color="primary" /> : <BuildIcon sx={{ color: '#d97706' }} />}
                    <span>{isDirectEmployeeService ? `Assign Ticket #${assignTicketTarget?.ticketNumber}` : `Assign Field Technicians - #${assignTicketTarget?.ticketNumber}`}</span>
                </DialogTitle>
                <DialogContent dividers sx={{ minHeight: '300px' }}>
                    <Box sx={{ mb: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Priority</InputLabel>
                            <Select
                                value={assignPriority}
                                label="Priority"
                                onChange={(e) => handleAssignPriorityChange(e.target.value)}
                            >
                                <MenuItem value="CRITICAL">Critical (2 Hours)</MenuItem>
                                <MenuItem value="HIGH">High (4 Hours)</MenuItem>
                                <MenuItem value="MEDIUM">Medium (24 Hours)</MenuItem>
                                <MenuItem value="LOW">Low (72 Hours)</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            size="small"
                            type="datetime-local"
                            label="Due Date & Time"
                            slotProps={{ 
                                inputLabel: { shrink: true }
                            }}
                            value={assignDueDate}
                            onChange={(e) => setAssignDueDate(e.target.value)}
                            helperText="Target resolution deadline"
                        />
                    </Box>

                    {isDirectEmployeeService ? (
                        <>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Assign To Service Employees *</Typography>
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
                        </>
                    ) : (
                        <>
                            <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: '#92400e' }}>
                                Assign Active Field Technicians / Workers *
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
                                Only active workers can be assigned. No login credentials are generated for these workers.
                            </Typography>
                            <Autocomplete
                                multiple
                                fullWidth
                                options={availableWorkersForAssign}
                                getOptionLabel={(option) => `${option.name} (${option.designation || 'Technician'})${option.phone ? ` - ${option.phone}` : ''}`}
                                isOptionEqualToValue={(option, value) => option._id === value._id}
                                value={selectedWorkers}
                                onChange={(e, newValue) => setSelectedWorkers(newValue)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        variant="outlined"
                                        placeholder="Select active workers (e.g. Plumber, Electrician)..."
                                    />
                                )}
                                noOptionsText="No active field workers available. Please add or activate workers in Service Members."
                            />

                            <TextField
                                fullWidth
                                multiline
                                rows={2}
                                size="small"
                                label="Assignment Note / Specific Instructions (Optional)"
                                placeholder="e.g. Check 3rd floor hostel room switchboard..."
                                value={assignWorkerNote}
                                onChange={(e) => setAssignWorkerNote(e.target.value)}
                                sx={{ mt: 2 }}
                            />
                        </>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, px: 3 }}>
                    <Button onClick={() => setOpenAssignDialog(false)} disabled={assigning}>Cancel</Button>
                    <Button 
                        color={isDirectEmployeeService ? "primary" : "warning"} 
                        variant="contained" 
                        onClick={submitAssign} 
                        disabled={assigning}
                        sx={{ fontWeight: 600 }}
                    >
                        {assigning ? 'Assigning...' : (isDirectEmployeeService ? 'Assign' : 'Assign Technicians')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* SLA / Due Date Adjustment Dialog */}
            <Dialog open={openSlaDialog} onClose={() => setOpenSlaDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Adjust Priority & Due Date - #{slaTicketTarget?.ticketNumber}</DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" sx={{ mb: 2.5, color: 'text.secondary' }}>
                        Set or adjust the priority level and expected completion deadline for this ticket.
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Priority</InputLabel>
                            <Select
                                value={slaPriority}
                                label="Priority"
                                onChange={(e) => handleSlaPriorityChange(e.target.value)}
                            >
                                <MenuItem value="CRITICAL">Critical (2 Hours SLA)</MenuItem>
                                <MenuItem value="HIGH">High (4 Hours SLA)</MenuItem>
                                <MenuItem value="MEDIUM">Medium (24 Hours SLA)</MenuItem>
                                <MenuItem value="LOW">Low (72 Hours SLA)</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            size="small"
                            type="datetime-local"
                            label="Target Due Date & Time"
                            slotProps={{ 
                                inputLabel: { shrink: true }
                            }}
                            value={slaDueDate}
                            onChange={(e) => setSlaDueDate(e.target.value)}
                            helperText="Calculated from priority SLA, or set custom deadline"
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, px: 3 }}>
                    <Button onClick={() => setOpenSlaDialog(false)} disabled={updatingSla}>Cancel</Button>
                    <Button color="primary" variant="contained" onClick={submitSlaUpdate} disabled={updatingSla}>
                        {updatingSla ? 'Updating...' : 'Update SLA'}
                    </Button>
                </DialogActions>
            </Dialog>

        </PageContainer>
    );
};

export default ManageTickets;

