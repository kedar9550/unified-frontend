import React, { useState, useEffect, useRef } from 'react';
import { 
    Box, Typography, Paper, Chip, Divider, Button, 
    TextField, Avatar, CircularProgress, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Select, MenuItem, FormControl, InputLabel, Rating,
    List, ListItem, ListItemAvatar, ListItemText
} from '@mui/material';
import { 
    Download as DownloadIcon, 
    Send as SendIcon,
    Assignment as AssignmentIcon,
    Cancel as CancelIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
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

const TicketDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, activeRole } = useAuth();
    const { socket } = useSocket();
    
    const [ticket, setTicket] = useState(null);
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
    const [assigning, setAssigning] = useState(false);
    
    // Reject state
    const [rejectReason, setRejectReason] = useState('');
    const [rejecting, setRejecting] = useState(false);
    
    // Feedback state
    const [feedback, setFeedback] = useState({ rating: 0, satisfaction: '', comments: '' });
    const [submittingFeedback, setSubmittingFeedback] = useState(false);

    useEffect(() => {
        fetchTicket();
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

    const fetchTicket = async () => {
        try {
            setLoading(true);
            const [ticketRes, commentsRes] = await Promise.all([
                API.get(`/api/service-desk/tickets/${id}`),
                API.get(`/api/service-desk/tickets/${id}/comments`)
            ]);
            
            if (ticketRes.data.success) {
                setTicket(ticketRes.data.data);
            }
            if (commentsRes.data.success) {
                setComments(commentsRes.data.data);
                setTimeout(() => chatEndRef.current?.scrollIntoView(), 100);
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
            const res = await API.get(`/api/service-desk/services/${ticket.service._id}/emps`);
            if (res.data.success) {
                setServiceEmps(res.data.data);
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
                employeeIds: selectedEmps
            });
            if (res.data.success) {
                toast.success('Ticket assigned successfully');
                setAssignModalOpen(false);
                setSelectedEmps([]);
                fetchTicket();
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
                fetchTicket();
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
                fetchTicket();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit feedback');
        } finally {
            setSubmittingFeedback(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }
    
    if (!ticket) return null;
    
    const isAdminView = activeRole === 'UNIPRIME' || activeRole === 'SERVICE_ADMIN';
    const isCreator = ticket.createdBy?._id === user?._id;
    const canGiveFeedback = isCreator && ticket.status === 'RESOLVED';

    return (
        <Box>
            <PageHeader title={`Ticket #${ticket.ticketNumber}`} subtitle={ticket.title} />
            
            <Box sx={{ px: 3, pb: 3, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                
                {/* Left Column: Details & Feedback/Admin Actions */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Paper sx={{ p: 3, borderRadius: '16px', background: 'var(--bg-panel)', boxShadow: 'var(--shadow-premium)' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Typography variant="h6" fontWeight={600}>Ticket Details</Typography>
                            <Chip label={ticket.status} color={getStatusColor(ticket.status)} sx={{ fontWeight: 600, borderRadius: '6px' }} />
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            <strong>Service:</strong> {ticket.service?.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            <strong>Priority:</strong> {ticket.priority}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            <strong>Created:</strong> {new Date(ticket.createdAt).toLocaleString()}
                        </Typography>
                        
                        {isAdminView && ticket.createdBy && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, p: 1.5, bgcolor: 'background.default', borderRadius: 1 }}>
                                <strong>Raised By:</strong> {ticket.createdBy.name} ({ticket.createdBy.email})
                            </Typography>
                        )}
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                            {ticket.description}
                        </Typography>
                        
                        {ticket.rejectionReason && (
                            <Box sx={{ mt: 3, p: 2, bgcolor: 'error.light', borderRadius: 2, color: 'error.contrastText' }}>
                                <Typography variant="subtitle2" fontWeight={700}>Rejection Reason:</Typography>
                                <Typography variant="body2">{ticket.rejectionReason}</Typography>
                            </Box>
                        )}
                        
                        {ticket.attachments?.length > 0 && (
                            <Box sx={{ mt: 3 }}>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>Attachments</Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {ticket.attachments.map(att => (
                                        <Chip 
                                            key={att._id}
                                            label={att.fileName}
                                            onClick={() => handleDownload(att._id, att.fileName)}
                                            icon={<DownloadIcon />}
                                            variant="outlined"
                                            sx={{ cursor: 'pointer' }}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        )}
                    </Paper>

                    {/* Admin Actions */}
                    {isAdminView && ticket.status !== 'CLOSED' && ticket.status !== 'REJECTED' && ticket.status !== 'RESOLVED' && (
                        <Paper sx={{ p: 3, borderRadius: '16px', background: 'var(--bg-panel)', boxShadow: 'var(--shadow-premium)' }}>
                            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Admin Actions</Typography>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button 
                                    variant="contained" 
                                    color="primary"
                                    startIcon={<AssignmentIcon />}
                                    onClick={openAssignModal}
                                    sx={{ textTransform: 'none', borderRadius: '8px' }}
                                >
                                    Assign Employees
                                </Button>
                                <Button 
                                    variant="outlined" 
                                    color="error"
                                    startIcon={<CancelIcon />}
                                    onClick={() => setRejectModalOpen(true)}
                                    sx={{ textTransform: 'none', borderRadius: '8px' }}
                                >
                                    Reject Ticket
                                </Button>
                            </Box>
                        </Paper>
                    )}
                    
                    {/* Assigned To Status (Per Assignee) */}
                    {ticket.assignedTo?.length > 0 && (
                        <Paper sx={{ p: 3, borderRadius: '16px', background: 'var(--bg-panel)', boxShadow: 'var(--shadow-premium)' }}>
                            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Assignments</Typography>
                            <List disablePadding>
                                {ticket.assignedTo.map((assignee, idx) => (
                                    <React.Fragment key={idx}>
                                        <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                                            <ListItemAvatar>
                                                <Avatar>{assignee.employee?.name?.charAt(0) || 'U'}</Avatar>
                                            </ListItemAvatar>
                                            <ListItemText 
                                                primary={assignee.employee?.name || 'Unknown'}
                                                secondary={
                                                    <Box sx={{ mt: 0.5 }}>
                                                        <Chip label={assignee.status} size="small" color={getStatusColor(assignee.status)} sx={{ mr: 1, fontSize: '0.7rem' }} />
                                                        <Typography variant="caption" color="text.secondary">
                                                            Assigned: {new Date(assignee.assignedAt).toLocaleString()}
                                                        </Typography>
                                                        {assignee.note && (
                                                            <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                                                                Note: {assignee.note}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                        {idx < ticket.assignedTo.length - 1 && <Divider component="li" />}
                                    </React.Fragment>
                                ))}
                            </List>
                        </Paper>
                    )}

                    {/* Feedback Form */}
                    {canGiveFeedback && (
                        <Paper sx={{ p: 3, borderRadius: '16px', background: 'var(--bg-panel)', boxShadow: 'var(--shadow-premium)', border: '1px solid', borderColor: 'warning.main' }}>
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
                                <FormControl fullWidth>
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
                         <Paper sx={{ p: 3, borderRadius: '16px', background: 'var(--bg-panel)', boxShadow: 'var(--shadow-premium)', textAlign: 'center' }}>
                            <Typography variant="h6" fontWeight={600} color="text.secondary">
                                Ticket Closed on {new Date(ticket.closedAt).toLocaleString()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Feedback has been submitted.
                            </Typography>
                         </Paper>
                    )}
                </Box>
                
                {/* Right Column: Chat */}
                {ticket.status !== 'CLOSED' && ticket.status !== 'REJECTED' && (
                    <Box sx={{ flex: 1, maxWidth: { md: '400px' }, height: { xs: '500px', md: 'auto' }, display: 'flex', flexDirection: 'column' }}>
                        <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: '16px', background: 'var(--bg-panel)', boxShadow: 'var(--shadow-premium)', overflow: 'hidden' }}>
                            <Box sx={{ p: 2, bgcolor: 'background.default', borderBottom: '1px solid var(--border-color)' }}>
                                <Typography variant="h6" fontWeight={600}>Discussion</Typography>
                            </Box>
                            
                            <Box sx={{ flex: 1, p: 2, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {comments.map((msg, idx) => {
                                    const isMe = msg.sender?._id === user?._id;
                                    return (
                                        <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, mx: 1 }}>
                                                {msg.sender?.name} • {new Date(msg.createdAt).toLocaleTimeString()}
                                            </Typography>
                                            <Box sx={{ 
                                                p: 1.5, 
                                                borderRadius: '16px', 
                                                borderBottomRightRadius: isMe ? 0 : '16px',
                                                borderBottomLeftRadius: !isMe ? 0 : '16px',
                                                bgcolor: isMe ? 'primary.main' : 'background.default',
                                                color: isMe ? 'primary.contrastText' : 'text.primary',
                                                maxWidth: '85%'
                                            }}>
                                                <Typography variant="body2">{msg.message}</Typography>
                                            </Box>
                                        </Box>
                                    );
                                })}
                                <div ref={chatEndRef} />
                            </Box>
                            
                            <Box sx={{ p: 2, borderTop: '1px solid var(--border-color)', bgcolor: 'background.default' }}>
                                {ticket.isChatActive ? (
                                    <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px' }}>
                                        <TextField 
                                            size="small"
                                            fullWidth
                                            placeholder="Type a message..."
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '20px' } }}
                                        />
                                        <IconButton 
                                            type="submit" 
                                            color="primary" 
                                            disabled={!newMessage.trim()}
                                            sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
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
                    </Box>
                )}
            </Box>

            {/* Modals */}
            <Dialog open={assignModalOpen} onClose={() => setAssignModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Assign Ticket</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 1 }}>
                        <InputLabel>Select Service Employees</InputLabel>
                        <Select
                            multiple
                            value={selectedEmps}
                            onChange={(e) => setSelectedEmps(e.target.value)}
                            label="Select Service Employees"
                        >
                            {serviceEmps.map(emp => (
                                <MenuItem key={emp.employee._id} value={emp.employee._id}>
                                    {emp.employee.name} ({emp.employee.email})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAssignModalOpen(false)}>Cancel</Button>
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
