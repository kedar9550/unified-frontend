import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Chip, Button, CircularProgress
} from '@mui/material';
import { Visibility } from '@mui/icons-material';
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

const AssignedToMe = () => {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await API.get('/api/service-desk/tickets/assigned-to-me');
                if (res.data.success) {
                    setTickets(res.data.data);
                }
            } catch (error) {
                toast.error('Failed to load assigned tickets');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <Box>
            <PageHeader title="Assigned to Me" subtitle="Manage and resolve tickets assigned to you" />

            <Box sx={{ px: 3, pb: 3 }}>
                {loading ? (
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
                            No Assigned Tickets
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary", mb: 3, maxWidth: "400px" }}>
                            You currently do not have any active tickets assigned to you.
                        </Typography>
                    </Box>
                ) : (
                    <DataTable 
                        columns={["Ticket #", "Service", "Title", "Priority", "Due Date", "Status", "Action"]}
                        alignments={["left", "left", "left", "center", "left", "center", "right"]}
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
                                value: t.dueDate, 
                                display: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'N/A' 
                            },
                            { 
                                value: t.status, 
                                display: <Chip label={t.status} color={getStatusColor(t.status)} size="small" sx={{ fontWeight: 600, borderRadius: '6px' }} /> 
                            },
                            {
                                value: '',
                                display: (
                                    <Button 
                                        size="small" 
                                        variant="outlined" 
                                        startIcon={<Visibility />}
                                        onClick={() => navigate(`/service-desk/ticket/${t._id}`)}
                                        sx={{ textTransform: 'none', borderRadius: '8px' }}
                                    >
                                        Manage
                                    </Button>
                                )
                            }
                        ])}
                    />
                )}
            </Box>
        </Box>
    );
};

export default AssignedToMe;
