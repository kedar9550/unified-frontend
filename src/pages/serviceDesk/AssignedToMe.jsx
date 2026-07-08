import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Chip, Button, CircularProgress, Tabs, Tab, IconButton, Tooltip
} from '@mui/material';
import { Visibility } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/data/DataTable';
import API from '../../api/axios';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

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
    const { user } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    const [currentTab, setCurrentTab] = useState('active');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await API.get(`/api/service-desk/tickets/assigned-to-me?tab=${currentTab}`);
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
    }, [currentTab]);

    return (
        <Box>
            <PageHeader title="Assigned to Me" subtitle="Manage and resolve tickets assigned to you" />

            <Box sx={{ borderBottom: 1, borderColor: 'var(--border-color)', mb: 3, px: 3 }}>
                <Tabs 
                    value={currentTab} 
                    onChange={(e, newValue) => setCurrentTab(newValue)}
                    sx={{
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            color: 'text.secondary',
                            minWidth: 120,
                            '&.Mui-selected': {
                                color: 'primary.main',
                            }
                        },
                        '& .MuiTabs-indicator': {
                            borderRadius: '2px 2px 0 0',
                            height: 3
                        }
                    }}
                >
                    <Tab label="Active Assignments" value="active" />
                    <Tab label="Rejected Assignments" value="rejected" />
                </Tabs>
            </Box>

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
                        alignments={["left", "left", "left", "center", "left", "center", "center"]}
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
                                value: (() => {
                                    const myAssignment = t.assignedTo?.find(a => a.employee?.toString() === user?._id?.toString() || a.employee?._id?.toString() === user?._id?.toString());
                                    return myAssignment?.status || t.status;
                                })(), 
                                display: (() => {
                                    const myAssignment = t.assignedTo?.find(a => a.employee?.toString() === user?._id?.toString() || a.employee?._id?.toString() === user?._id?.toString());
                                    const statusToDisplay = myAssignment?.status || t.status;
                                    return <Chip label={statusToDisplay} color={getStatusColor(statusToDisplay)} size="small" sx={{ fontWeight: 600, borderRadius: '6px' }} />;
                                })()
                            },
                            {
                                value: '',
                                display: (
                                    <Tooltip title="View Ticket">
                                        <IconButton 
                                            color="primary" 
                                            onClick={() => navigate(`/service-desk/ticket/${t._id}`)} 
                                            size="small" 
                                            sx={{ background: 'var(--bg-glass)' }}
                                        >
                                            <Visibility fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
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
