import Loader from "../../components/common/Loader";
import React, { useState, useEffect, useRef } from 'react';
import { 
    Box, Typography, Paper, Chip, Divider, Button, 
    TextField, Avatar, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Select, MenuItem, FormControl, InputLabel, Rating,
    List, ListItem, ListItemAvatar, ListItemText, Grid,
    Stepper, Step, StepLabel, StepContent, Autocomplete
} from '@mui/material';
import { 
    Download as DownloadIcon, 
    Send as SendIcon,
    Assignment as AssignmentIcon,
    Cancel as CancelIcon,
    CheckCircle as CheckCircleIcon,
    RadioButtonUnchecked as RadioButtonUncheckedIcon,
    WatchLater as WatchLaterIcon,
    Person as PersonIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { toast } from 'sonner';

const getStatusColor = (status) => {
    switch (status) {
        case 'OPEN': return 'warning';
        case 'ASSIGNED': return 'secondary';
        case 'IN_PROGRESS': return 'info';
        case 'RESOLVED': return 'success';
        case 'REJECTED': return 'error';
        case 'CLOSED': return 'default';
        default: return 'default';
    }
};

const TicketDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, activeRole } = useAuth();
    const { socket } = useSocket();
    
    const [ticket, setTicket] = useState(null);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Chat state
    const [comments, setComments] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const chatEndRef = useRef(null);

    // Modals
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    
    // Assign state
    const [serviceEmps, setServiceEmps] = useState([]);
    const [selectedEmps, setSelectedEmps] = useState([]);
    const [assignPriority, setAssignPriority] = useState('');
    const [assignDueDate, setAssignDueDate] = useState('');
    const [assigning, setAssigning] = useState(false);
    
    // Reject state
    const [rejectReason, setRejectReason] = useState('');
    const [rejecting, setRejecting] = useState(false);
    
    // Feedback state
    const [feedback, setFeedback] = useState({ rating: 0, satisfaction: '', comments: '' });
    const [submittingFeedback, setSubmittingFeedback] = useState(false);

    // Emp Action state
    const [empStatusModalOpen, setEmpStatusModalOpen] = useState(false);
    const [empActionStatus, setEmpActionStatus] = useState('');
    const [empActionNote, setEmpActionNote] = useState('');
    const [updatingEmpStatus, setUpdatingEmpStatus] = useState(false);

    useEffect(() => {
        fetchTicketData();
    }, [id]);
    
    useEffect(() => {
        if (socket && ticket) {
            socket.emit('join_ticket_room', id);
            
            const handleNewMessage = (comment) => {
                setComments(prev => [...prev, comment]);
                setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            };
            
            socket.on('new_message', handleNewMessage);
            
            return () => {
                socket.off('new_message', handleNewMessage);
                socket.emit('leave_ticket_room', id);
            };
        }
    }, [socket, ticket, id]);

    const fetchTicketData = async () => {
        try {
            setLoading(true);
            const [ticketRes, commentsRes, activitiesRes] = await Promise.all([
                API.get(`/api/service-desk/tickets/${id}`),
                API.get(`/api/service-desk/tickets/${id}/comments`),
                API.get(`/api/service-desk/tickets/${id}/activities`).catch(() => ({ data: { success: false } }))
            ]);
            
            if (ticketRes.data.success) {
                setTicket(ticketRes.data.data);
            }
            if (commentsRes.data.success) {
                setComments(commentsRes.data.data);
                setTimeout(() => chatEndRef.current?.scrollIntoView(), 100);
            }
            if (activitiesRes?.data?.success) {
                setActivities(activitiesRes.data.data);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to load ticket details');
            navigate('/service-desk/my-tickets');
        } finally {
            setLoading(false);
        }
    };
    
    const handleDownload = async (fileId, fileName) => {
        try {
            const res = await API.get(`/api/service-desk/tickets/${id}/attachments/${fileId}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast.error('Failed to download file');
        }
    };
    
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !ticket?.isChatActive) return;
        
        try {
            const res = await API.post(`/api/service-desk/tickets/${id}/comments`, {
                message: newMessage
            });
            if (res.data.success) {
                setNewMessage('');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send message');
        }
    };
    
    // --- Admin Actions ---
    const openAssignModal = async () => {
        try {
            setAssignPriority(ticket.priority || 'MEDIUM');
            setAssignDueDate(ticket.dueDate ? ticket.dueDate.split('T')[0] : '');
            const existingIds = ticket.assignedTo.filter(a => a.status !== 'REJECTED').map(a => a.employee._id);
            setSelectedEmps([]);
            
            const res = await API.get(`/api/service-desk/services/${ticket.service._id}/emps`);
            if (res.data.success) {
                const emps = res.data.data.map(m => m.employee).filter(Boolean);
                setServiceEmps(emps);
                setSelectedEmps(emps.filter(e => existingIds.includes(e._id)));
                setAssignModalOpen(true);
            }
        } catch (error) {
            toast.error('Failed to fetch service employees');
        }
    };
    
    const handleAssign = async () => {
        if (selectedEmps.length === 0) {
            toast.error('Select at least one employee');
            return;
        }
        try {
            setAssigning(true);
            const res = await API.post(`/api/service-desk/tickets/${id}/assign`, {
                employeeIds: selectedEmps.map(e => e._id),
                priority: assignPriority,
                dueDate: assignDueDate || null
            });
            if (res.data.success) {
                toast.success('Ticket assigned successfully');
                setAssignModalOpen(false);
                setSelectedEmps([]);
                fetchTicketData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to assign ticket');
        } finally {
            setAssigning(false);
        }
    };
    
    const handleReject = async () => {
        if (!rejectReason.trim()) {
            toast.error('Reason is required');
            return;
        }
        try {
            setRejecting(true);
            const res = await API.post(`/api/service-desk/tickets/${id}/reject`, {
                reason: rejectReason
            });
            if (res.data.success) {
                toast.success('Ticket rejected');
                setRejectModalOpen(false);
                fetchTicketData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reject ticket');
        } finally {
            setRejecting(false);
        }
    };

    // --- Feedback Action ---
    const handleFeedbackSubmit = async () => {
        if (!feedback.rating || !feedback.satisfaction) {
            toast.error('Please provide a rating and satisfaction level');
            return;
        }
        try {
            setSubmittingFeedback(true);
            const res = await API.post(`/api/service-desk/tickets/${id}/feedback`, feedback);
            if (res.data.success) {
                toast.success('Feedback submitted successfully. Ticket closed.');
                fetchTicketData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit feedback');
        } finally {
            setSubmittingFeedback(false);
        }
    };

    const handleUpdateEmpStatus = async () => {
        try {
            setUpdatingEmpStatus(true);
            const res = await API.put(`/api/service-desk/tickets/${id}/my-status`, {
                status: empActionStatus,
                note: empActionNote
            });
            if (res.data.success) {
                toast.success(`Status updated successfully`);
                setEmpStatusModalOpen(false);
                setEmpActionNote('');
                fetchTicketData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update status');
        } finally {
            setUpdatingEmpStatus(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <Loader />
            </Box>
        );
    }
    
    if (!ticket) return null;
    
    const isAdminView = activeRole === 'UNIPRIME' || activeRole === 'SERVICE_ADMIN';
    const isCreator = ticket.createdBy?._id === user?._id || ticket.createdBy === user?._id;
    const canGiveFeedback = isCreator && ticket.status === 'RESOLVED';
    
    const myAssignment = ticket.assignedTo?.find(a => a.employee?._id === user?._id || a.employee === user?._id);
    const isAssignedToMe = !!myAssignment;
    
    const getTimelineLabel = (act) => {
        if (act.action === 'TICKET_CREATED') return 'Ticket Created';
        if (act.action === 'TICKET_ASSIGNED') return 'Assigned By';
        if (act.action === 'STATUS_UPDATED') {
            if (act.metadata?.status === 'IN_PROGRESS') return 'In Progress';
            if (act.metadata?.status === 'RESOLVED') return 'Resolved';
            if (act.metadata?.status === 'REJECTED') return 'Rejected';
        }
        if (act.action === 'TICKET_CLOSED') return 'Ticket Closed';
        if (act.action === 'TICKET_REJECTED') return 'Ticket Rejected';
        return act.action.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    };

    const getAvatarSrc = (userObj) => {
        if (!userObj) return undefined;
        if (userObj.profileImage) {
            return `/uploads/profile/${userObj.profileImage}`;
        }
        if (userObj.institutionId && userObj.institutionId !== "Prime") {
            const isEmployee = /^\d+$/.test(userObj.institutionId);
            if (isEmployee) {
                return `https://info.aec.edu.in/aec/employeephotos/${userObj.institutionId}.jpg`;
            } else {
                return `https://info.aec.edu.in/adityacentral/StudentPhotos/${userObj.institutionId}.jpg`;
            }
        }
        return undefined;
    };

    const handleBack = () => {
        if (isAdminView) {
            navigate('/service-desk/admin/services');
        } else if (activeRole === 'SERVICE_EMP') {
            navigate('/service-desk/assigned-to-me');
        } else {
            navigate('/service-desk/my-tickets');
        }
    };

    return (
        <Box>
            <Box sx={{ px: 3, pt: 2 }}>
                <Typography 
                    variant="body2" 
                    color="primary" 
                    sx={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', fontWeight: 600 }}
                    onClick={handleBack}
                >
                    ← Back to Tickets
                </Typography>
            </Box>
            
            <Box sx={{ px: 3, pb: 4, mt: 2 }}>
                {/* Main Header Card */}
                <Paper sx={{ p: 3, mb: 3, borderRadius: '12px', background: 'var(--bg-panel)', boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)', border: '1px solid var(--border-color)' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: 0.5 }}>
                                {ticket.ticketNumber}
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: 'var(--text-primary)' }}>
                                {ticket.title}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip label={ticket.priority} size="small" color="error" sx={{ fontWeight: 700, borderRadius: '4px' }} />
                            <Chip label={ticket.status} size="small" color={getStatusColor(ticket.status)} sx={{ fontWeight: 700, borderRadius: '4px' }} />
                        </Box>
                    </Box>
                    
                    <Divider sx={{ my: 2, borderColor: 'var(--border-color)' }} />
                    
                    <Grid container spacing={3}>
                        <Grid xs={6} sm={3}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>Created By</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {ticket.createdBy?.name || 'Unknown'}
                            </Typography>
                        </Grid>
                        <Grid xs={6} sm={3}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>Assigned To</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {ticket.assignedTo && ticket.assignedTo.filter(a => a.status !== 'REJECTED').length > 0 
                                    ? ticket.assignedTo.filter(a => a.status !== 'REJECTED').map(a => a.employee?.name).join(', ') 
                                    : 'Not Assigned'}
                            </Typography>
                        </Grid>
                        <Grid xs={6} sm={3}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>Created</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {new Date(ticket.createdAt).toLocaleDateString()}
                            </Typography>
                        </Grid>
                        <Grid xs={6} sm={3}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>Service Category</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {ticket.service?.name || 'N/A'}
                            </Typography>
                        </Grid>
                    </Grid>

                    {isAdminView && ticket.assignedTo?.some(a => a.status === 'REJECTED') && (
                        <Box sx={{ mt: 3, p: 2, bgcolor: '#fff1f2', borderRadius: 2, border: '1px solid #fecdd3' }}>
                            <Typography variant="subtitle2" sx={{ color: '#be123c', fontWeight: 700, mb: 1 }}>Assignment Rejections</Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {ticket.assignedTo.filter(a => a.status === 'REJECTED').map(a => (
                                    <Typography key={a.employee?._id || a._id} variant="body2" sx={{ color: '#be123c' }}>
                                        <strong>{a.employee?.name || 'Unknown Employee'}</strong>: {a.note || 'No reason provided'}
                                    </Typography>
                                ))}
                            </Box>
                        </Box>
                    )}
                </Paper>

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                    
                    {/* Left Column: Description & Comments */}
                    <Box sx={{ flex: { xs: 1, md: 2 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        
                        {/* Description Card */}
                        <Paper sx={{ p: 3, borderRadius: '12px', background: 'var(--bg-panel)', boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)', border: '1px solid var(--border-color)' }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'var(--text-primary)' }}>Description</Typography>
                            
                            <Box 
                                sx={{ 
                                    typography: 'body2', 
                                    color: 'var(--text-primary)',
                                    '& p': { mb: 2, lineHeight: 1.6, margin: 0 },
                                    '& ul, & ol': { pl: 2, mb: 2, mt: 0 },
                                    '& li': { mb: 0.5, lineHeight: 1.6 },
                                    '& strong': { fontWeight: 700 },
                                    '& img': { maxWidth: '100%', height: 'auto', borderRadius: '4px' }
                                }}
                                dangerouslySetInnerHTML={{ __html: ticket.description }}
                            />
                            
                            {ticket.rejectionReason && (
                                <Box sx={{ mt: 3, p: 2, bgcolor: 'error.light', borderRadius: 2, color: 'error.contrastText' }}>
                                    <Typography variant="subtitle2" fontWeight={700}>Rejection Reason:</Typography>
                                    <Typography variant="body2">{ticket.rejectionReason}</Typography>
                                </Box>
                            )}
                        </Paper>

                        {/* Comments Chat Interface */}
                        {ticket.status !== 'CLOSED' && ticket.status !== 'REJECTED' && (
                            <Paper sx={{ p: 0, borderRadius: '12px', background: 'var(--bg-panel)', boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                <Box sx={{ p: 2, borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                        Comments ({comments.length})
                                    </Typography>
                                </Box>
                                
                                <Box sx={{ p: 3, overflowY: 'auto', maxHeight: '500px', display: 'flex', flexDirection: 'column', gap: 3, bgcolor: 'var(--bg-dashboard)' }}>
                                    {comments.length === 0 ? (
                                        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
                                            <Typography variant="body2" color="text.secondary">No comments yet. Start the conversation!</Typography>
                                        </Box>
                                    ) : (
                                        comments.map((msg, idx) => {
                                            const isMe = msg.sender?._id === user?._id;
                                            const msgDate = new Date(msg.createdAt).toLocaleString('en-GB', { 
                                                day: 'numeric', month: 'numeric', year: 'numeric', 
                                                hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true 
                                            });
                                            const avatarUrl = getAvatarSrc(msg.sender);

                                            return (
                                                <Box key={idx} sx={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-start', gap: 2 }}>
                                                    <Avatar 
                                                        src={avatarUrl}
                                                        sx={{ width: 36, height: 36, bgcolor: isMe ? 'primary.main' : 'grey.300', color: isMe ? 'white' : 'text.primary', fontSize: '0.9rem' }}
                                                    >
                                                        {!avatarUrl && (msg.sender?.name?.charAt(0) || 'U')}
                                                    </Avatar>
                                                    <Box sx={{ 
                                                        maxWidth: '75%',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: isMe ? 'flex-end' : 'flex-start'
                                                    }}>
                                                        <Box sx={{ 
                                                            p: 2, 
                                                            pb: 1.5,
                                                            borderRadius: '12px', 
                                                            borderTopRightRadius: isMe ? 0 : '12px',
                                                            borderTopLeftRadius: !isMe ? 0 : '12px',
                                                            bgcolor: isMe ? 'primary.main' : 'var(--bg-paper)',
                                                            border: isMe ? 'none' : '1px solid var(--border-color)',
                                                            color: isMe ? 'white' : 'var(--text-primary)',
                                                            boxShadow: '0px 2px 4px rgba(0,0,0,0.02)',
                                                            display: 'flex',
                                                            flexDirection: 'column'
                                                        }}>
                                                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, mb: 1 }}>
                                                                {msg.message}
                                                            </Typography>
                                                            
                                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '100%', mt: 0.5 }}>
                                                                {!isMe && (
                                                                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                                        {msg.sender?.name}
                                                                    </Typography>
                                                                )}
                                                                <Typography variant="caption" sx={{ color: isMe ? 'rgba(255,255,255,0.8)' : 'text.secondary', fontSize: '0.65rem' }}>
                                                                    {msgDate}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            );
                                        })
                                    )}
                                    <div ref={chatEndRef} />
                                </Box>
                                
                                <Box sx={{ p: 2, borderTop: '1px solid var(--border-color)', bgcolor: 'var(--bg-panel)' }}>
                                    {ticket.isChatActive ? (
                                        <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <Avatar 
                                                src={getAvatarSrc(user)}
                                                sx={{ width: 36, height: 36, bgcolor: 'primary.main', color: 'white', fontSize: '0.9rem' }}
                                            >
                                                {!getAvatarSrc(user) && (user?.name?.charAt(0) || 'U')}
                                            </Avatar>
                                            <TextField 
                                                size="small"
                                                fullWidth
                                                placeholder="Add a comment..."
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                sx={{ 
                                                    '& .MuiOutlinedInput-root': { 
                                                        borderRadius: '8px',
                                                        bgcolor: 'var(--bg-dashboard)'
                                                    },
                                                    '& input': {
                                                        color: 'var(--text-primary)'
                                                    }
                                                }}
                                            />
                                            <IconButton 
                                                type="submit" 
                                                color="primary" 
                                                disabled={!newMessage.trim()}
                                                sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' }, borderRadius: '8px', p: 1 }}
                                            >
                                                <SendIcon fontSize="small" />
                                            </IconButton>
                                        </form>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary" align="center">
                                            Chat is disabled for this ticket.
                                        </Typography>
                                    )}
                                </Box>
                            </Paper>
                        )}
                        
                    </Box>
                    
                    {/* Right Column: Timeline, Attachments, Actions */}
                    <Box sx={{ flex: { xs: 1, md: 1 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        
                        {/* Activity Timeline */}
                        <Paper sx={{ p: 3, borderRadius: '12px', background: 'var(--bg-panel)', boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)', border: '1px solid var(--border-color)' }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'var(--text-primary)' }}>Activity Timeline</Typography>
                            
                            <Box sx={{ display: 'flex', flexDirection: 'column', mt: 1 }}>
                                {(() => {
                                    const pendingSteps = [];
                                    if (ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED' && ticket.status !== 'REJECTED') {
                                        if (ticket.status === 'OPEN') {
                                            pendingSteps.push('Assigned By', 'In Progress', 'Resolved');
                                        } else if (ticket.status === 'ASSIGNED') {
                                            pendingSteps.push('In Progress', 'Resolved');
                                        } else if (ticket.status === 'IN_PROGRESS') {
                                            pendingSteps.push('Resolved');
                                        }
                                    }

                                    const filteredActivities = activities.filter((act, index, self) => {
                                        if (act.action === 'STATUS_UPDATED' && act.metadata?.status === 'REJECTED') {
                                            return false;
                                        }
                                        if (act.action === 'TICKET_ASSIGNED') {
                                            const lastAssignIndex = self.findLastIndex(a => a.action === 'TICKET_ASSIGNED');
                                            return index === lastAssignIndex;
                                        }
                                        return true;
                                    });

                                    const allTimelineItems = [
                                        ...filteredActivities.map(act => ({ type: 'completed', act })),
                                        ...pendingSteps.map(step => ({ type: 'pending', label: step }))
                                    ];

                                    if (allTimelineItems.length === 0) {
                                        return <Typography variant="body2" color="text.secondary">No activities yet.</Typography>;
                                    }

                                    return allTimelineItems.map((item, index) => {
                                        const isLast = index === allTimelineItems.length - 1;
                                        const isCompleted = item.type === 'completed';

                                        return (
                                            <Box key={isCompleted ? item.act._id : `pending-${index}`} sx={{ display: 'flex', position: 'relative' }}>
                                                {/* Timeline Line */}
                                                {!isLast && (
                                                    <Box sx={{ 
                                                        position: 'absolute', 
                                                        left: isCompleted ? '8px' : '9px', 
                                                        top: '24px', 
                                                        bottom: 0, 
                                                        width: isCompleted ? '2px' : '1px', 
                                                        bgcolor: isCompleted ? 'var(--color-primary)' : 'var(--text-secondary)',
                                                        opacity: isCompleted ? 1 : 0.3,
                                                        zIndex: 0
                                                    }} />
                                                )}
                                                
                                                {/* Icon */}
                                                <Box sx={{ mr: 2, position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center', width: '18px', pt: '2px' }}>
                                                    {isCompleted ? (
                                                        <CheckCircleIcon sx={{ color: 'var(--color-primary)', fontSize: '20px', bgcolor: 'var(--bg-panel)', borderRadius: '50%' }} />
                                                    ) : (
                                                        <Box sx={{ width: 16, height: 16, mt: '2px', borderRadius: '50%', bgcolor: 'var(--bg-panel)', border: '1.5px solid var(--text-secondary)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                            <WatchLaterIcon sx={{ fontSize: 10, color: 'var(--text-secondary)' }} />
                                                        </Box>
                                                    )}
                                                </Box>
                                                
                                                {/* Content */}
                                                <Box sx={{ pb: 3, flex: 1 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--text-primary)', mb: isCompleted ? 0.5 : 0, fontSize: '0.9rem', pt: isCompleted ? 0 : '1px' }}>
                                                        {isCompleted ? getTimelineLabel(item.act) : item.label}
                                                    </Typography>
                                                    
                                                    {isCompleted && (
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                <PersonIcon sx={{ fontSize: '15px', color: '#64748b' }} />
                                                                <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b' }}>
                                                                    {item.act.performedBy?.name?.toUpperCase()}
                                                                </Typography>
                                                            </Box>
                                                            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem', pl: '19px' }}>
                                                                {new Date(item.act.createdAt).toLocaleString('en-GB', {
                                                                    day: 'numeric', month: 'numeric', year: 'numeric',
                                                                    hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true
                                                                })}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </Box>
                                            </Box>
                                        );
                                    });
                                })()}
                            </Box>
                        </Paper>

                        {/* Attachments Card */}
                        <Paper sx={{ p: 3, borderRadius: '12px', background: 'var(--bg-panel)', boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)', border: '1px solid var(--border-color)' }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'var(--text-primary)' }}>Attachments</Typography>
                            
                            {ticket.attachments?.length > 0 ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    {ticket.attachments.map(att => (
                                        <Box 
                                            key={att._id} 
                                            sx={{ 
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                                                p: 1.5, border: '1px solid var(--border-color)', borderRadius: '8px',
                                                bgcolor: '#f8fafc', '&:hover': { bgcolor: '#f1f5f9' },
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => handleDownload(att._id, att.fileName)}
                                        >
                                            <Typography variant="body2" sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {att.fileName}
                                            </Typography>
                                            <DownloadIcon fontSize="small" color="action" />
                                        </Box>
                                    ))}
                                </Box>
                            ) : (
                                <Typography variant="body2" color="text.secondary">No attachments provided.</Typography>
                            )}
                        </Paper>
                        {/* Employee Actions */}
                        {isAssignedToMe && ticket.status !== 'CLOSED' && ticket.status !== 'REJECTED' && (
                            <Paper sx={{ p: 3, borderRadius: '12px', background: 'var(--bg-panel)', boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)', border: '1px solid var(--border-color)', mb: 3 }}>
                                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>My Assignment Status</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="body2" sx={{ mr: 1 }}>Current Status:</Typography>
                                    <Chip label={myAssignment?.status} size="small" color={getStatusColor(myAssignment?.status)} />
                                </Box>
                                {myAssignment?.status !== 'RESOLVED' && myAssignment?.status !== 'REJECTED' && (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        {myAssignment?.status === 'ASSIGNED' && (
                                            <Button 
                                                variant="contained" 
                                                color="info"
                                                onClick={() => { setEmpActionStatus('IN_PROGRESS'); setEmpStatusModalOpen(true); }}
                                                fullWidth
                                                sx={{ textTransform: 'none', borderRadius: '8px' }}
                                            >
                                                Start Work (In Progress)
                                            </Button>
                                        )}
                                        <Button 
                                            variant="contained" 
                                            color="success"
                                            onClick={() => { setEmpActionStatus('RESOLVED'); setEmpStatusModalOpen(true); }}
                                            fullWidth
                                            sx={{ textTransform: 'none', borderRadius: '8px' }}
                                        >
                                            Mark as Resolved
                                        </Button>
                                        {myAssignment?.status === 'ASSIGNED' && (
                                            <Button 
                                                variant="outlined" 
                                                color="error"
                                                onClick={() => { setEmpActionStatus('REJECTED'); setEmpStatusModalOpen(true); }}
                                                fullWidth
                                                sx={{ textTransform: 'none', borderRadius: '8px' }}
                                            >
                                                Reject Assignment
                                            </Button>
                                        )}
                                    </Box>
                                )}
                            </Paper>
                        )}
                        
                        {/* Admin Actions */}
                        {isAdminView && ticket.status !== 'CLOSED' && ticket.status !== 'REJECTED' && ticket.status !== 'RESOLVED' && (
                            <Paper sx={{ p: 3, borderRadius: '12px', background: 'var(--bg-panel)', boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)', border: '1px solid var(--border-color)' }}>
                                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Admin Actions</Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Button 
                                        variant="contained" 
                                        color="primary"
                                        startIcon={<AssignmentIcon />}
                                        onClick={openAssignModal}
                                        fullWidth
                                        sx={{ textTransform: 'none', borderRadius: '8px', py: 1 }}
                                    >
                                        Assign Employees
                                    </Button>
                                    <Button 
                                        variant="outlined" 
                                        color="error"
                                        startIcon={<CancelIcon />}
                                        onClick={() => setRejectModalOpen(true)}
                                        fullWidth
                                        sx={{ textTransform: 'none', borderRadius: '8px', py: 1 }}
                                    >
                                        Reject Ticket
                                    </Button>
                                </Box>
                            </Paper>
                        )}
                        
                        {/* Feedback Form */}
                        {canGiveFeedback && (
                            <Paper sx={{ p: 3, borderRadius: '12px', background: 'var(--bg-panel)', boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)', border: '1px solid', borderColor: 'warning.main' }}>
                                <Typography variant="h6" fontWeight={600} color="warning.main" sx={{ mb: 2 }}>Provide Feedback to Close Ticket</Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Box>
                                        <Typography component="legend">Rating</Typography>
                                        <Rating 
                                            name="rating" 
                                            value={feedback.rating} 
                                            onChange={(event, newValue) => setFeedback({ ...feedback, rating: newValue })} 
                                            size="large"
                                        />
                                    </Box>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Satisfaction</InputLabel>
                                        <Select
                                            value={feedback.satisfaction}
                                            label="Satisfaction"
                                            onChange={(e) => setFeedback({ ...feedback, satisfaction: e.target.value })}
                                        >
                                            {['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied'].map(level => (
                                                <MenuItem key={level} value={level}>{level}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <TextField 
                                        label="Additional Comments (Optional)"
                                        multiline
                                        rows={3}
                                        size="small"
                                        value={feedback.comments}
                                        onChange={(e) => setFeedback({ ...feedback, comments: e.target.value })}
                                    />
                                    <Button 
                                        variant="contained" 
                                        color="warning"
                                        onClick={handleFeedbackSubmit}
                                        disabled={submittingFeedback}
                                        sx={{ alignSelf: 'flex-start', textTransform: 'none', borderRadius: '8px' }}
                                    >
                                        {submittingFeedback ? 'Submitting...' : 'Submit Feedback & Close'}
                                    </Button>
                                </Box>
                            </Paper>
                        )}
                        
                        {ticket.status === 'CLOSED' && ticket.closedAt && (
                             <Paper sx={{ p: 3, borderRadius: '12px', background: 'var(--bg-panel)', boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                                <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                                    Ticket Closed
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    {new Date(ticket.closedAt).toLocaleString()}
                                </Typography>
                             </Paper>
                        )}

                    </Box>
                </Box>
            </Box>

            {/* Modals */}
            <Dialog open={empStatusModalOpen} onClose={() => setEmpStatusModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Update Status to {empActionStatus}</DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Please provide a note or reason for this status update (optional).
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Note / Comments"
                        value={empActionNote}
                        onChange={(e) => setEmpActionNote(e.target.value)}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setEmpStatusModalOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleUpdateEmpStatus} disabled={updatingEmpStatus}>
                        {updatingEmpStatus ? 'Updating...' : 'Update Status'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={assignModalOpen} onClose={() => setAssignModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Assign Ticket #{ticket?.ticketNumber}</DialogTitle>
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
                        options={serviceEmps}
                        getOptionLabel={(option) => `${option.name} (${option.institutionId || option.email})`}
                        isOptionEqualToValue={(option, value) => option._id === value._id}
                        value={selectedEmps}
                        onChange={(e, newValue) => setSelectedEmps(newValue)}
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
                    <Button onClick={() => setAssignModalOpen(false)} disabled={assigning}>Cancel</Button>
                    <Button variant="contained" onClick={handleAssign} disabled={assigning || selectedEmps.length === 0}>
                        {assigning ? 'Assigning...' : 'Assign'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={rejectModalOpen} onClose={() => setRejectModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Reject Ticket</DialogTitle>
                <DialogContent>
                    <TextField 
                        autoFocus
                        margin="dense"
                        label="Reason for Rejection"
                        fullWidth
                        multiline
                        rows={3}
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        required
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRejectModalOpen(false)}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={handleReject} disabled={rejecting || !rejectReason.trim()}>
                        {rejecting ? 'Rejecting...' : 'Reject'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TicketDetail;
