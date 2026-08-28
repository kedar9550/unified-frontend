
import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Chip, Button, Alert, AlertTitle, IconButton, Tooltip
} from '@mui/material';
import { Visibility, Feedback as FeedbackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import { PageContainer } from '../../components/common/design-system';
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

const MyTickets = () => {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [pendingFeedback, setPendingFeedback] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [ticketsRes, feedbackRes] = await Promise.all([
                    API.get('/api/service-desk/tickets/my'),
                    API.get('/api/service-desk/tickets/feedback/pending')
                ]);
                
                if (ticketsRes.data.success) {
                    setTickets(ticketsRes.data.data);
                }
                if (feedbackRes.data.success) {
                    setPendingFeedback(feedbackRes.data.data);
                }
            } catch (error) {
                toast.error('Failed to load tickets');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <PageContainer>
            <PageHeader title="My Tickets" subtitle="View and track your Service Desk requests" />

            <Box>
                {pendingFeedback.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                        <Alert severity="warning" icon={<FeedbackIcon fontSize="inherit" />} sx={{ borderRadius: '12px' }}>
                            <AlertTitle sx={{ fontWeight: 'bold' }}>Feedback Required</AlertTitle>
                            You have {pendingFeedback.length} resolved {pendingFeedback.length === 1 ? 'ticket' : 'tickets'} pending your feedback. 
                            Providing feedback closes the ticket.
                            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {pendingFeedback.map(ticket => (
                                    <Button 
                                        key={ticket._id} 
                                        size="small" 
                                        variant="contained" 
                                        color="warning"
                                        onClick={() => navigate(`/service-desk/ticket/${ticket._id}`)}
                                        sx={{ textTransform: 'none', borderRadius: '20px' }}
                                    >
                                        #{ticket.ticketNumber} - {ticket.title}
                                    </Button>
                                ))}
                            </Box>
                        </Alert>
                    </Box>
                )}

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
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
                        <Typography variant="body2" sx={{ color: "text.secondary", mb: 3, maxWidth: "400px" }}>
                            You haven't raised any service desk tickets yet.
                        </Typography>
                        <Button 
                            variant="contained" 
                            onClick={() => navigate('/service-desk/raise')}
                            sx={{ background: "var(--gradient-primary)", textTransform: 'none', borderRadius: '8px' }}
                        >
                            Raise a Ticket
                        </Button>
                    </Box>
                ) : (
                    <DataTable 
                        columns={["Ticket #", "Service", "Title", "Priority", "Status", "Created At", "Action"]}
                        alignments={["left", "left", "left", "center", "center", "left", "right"]}
                        nonSortableColumns={[6]}
                        rows={tickets.map((t) => [
                            { value: t.ticketNumber, display: <Typography fontWeight={600} color="primary">#{t.ticketNumber}</Typography> },
                            { value: t.service?.name || 'Unknown', display: t.service?.name || 'Unknown' },
                            { value: t.title, display: t.title },
                            { 
                                value: t.priority, 
                                display: <Typography fontSize="0.875rem" fontWeight={500} color={t.priority === 'HIGH' ? 'error.main' : t.priority === 'MEDIUM' ? 'warning.main' : 'text.secondary'}>{t.priority}</Typography> 
                            },
                            { 
                                value: t.status, 
                                display: <Chip label={t.status} color={getStatusColor(t.status)} size="small" sx={{ fontWeight: 600, borderRadius: '6px' }} /> 
                            },
                            { value: new Date(t.createdAt).getTime(), display: new Date(t.createdAt).toLocaleString() },
                            {
                                value: '',
                                display: (
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                        <Tooltip title="View Ticket">
                                            <IconButton 
                                                size="small" 
                                                onClick={() => navigate(`/service-desk/ticket/${t._id}`)}
                                                sx={{ color: 'primary.main', bgcolor: 'primary.50', '&:hover': { bgcolor: 'primary.100' } }}
                                            >
                                                <Visibility fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        {t.status === 'RESOLVED' && pendingFeedback.some(pf => pf._id === t._id) && (
                                            <Tooltip title="Provide Feedback">
                                                <IconButton 
                                                    size="small" 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/service-desk/ticket/${t._id}`);
                                                    }}
                                                    sx={{ color: 'success.main', bgcolor: 'success.50', '&:hover': { bgcolor: 'success.100' } }}
                                                >
                                                    <FeedbackIcon fontSize="small" />
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
        </PageContainer>
    );
};

export default MyTickets;
