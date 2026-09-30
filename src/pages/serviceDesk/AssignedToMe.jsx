import Loader from "../../components/common/Loader";
import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Chip, Button, Tabs, Tab, IconButton, Tooltip
} from '@mui/material';
import { Visibility, Assignment as AssignmentIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import { PageContainer } from '../../components/common/design-system';
import DataTable from '../../components/data/DataTable';
import API from '../../api/axios';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { PriorityBadge, DueCountdownBadge } from '../../utils/serviceDeskSla';
import CustomTabs from "../../components/common/CustomTabs";

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
        <PageContainer>
            <PageHeader title="Assigned to Me" subtitle="Manage and resolve tickets assigned to you" />

            <CustomTabs
                value={currentTab === 'active' ? 0 : 1}
                onChange={(e, newValue) => setCurrentTab(newValue === 0 ? 'active' : 'rejected')}
                sx={{ mb: 4, mt: 0, mx: "auto" }}
                tabs={[
                    { label: "Active Assignments", icon: <AssignmentIcon /> },
                    { label: "Rejected Assignments", icon: <CancelIcon /> }
                ]}
            />

            <Box>
                {loading ? (
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
                            No Assigned Tickets
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary", mb: 3, maxWidth: "400px" }}>
                            You currently do not have any active tickets assigned to you.
                        </Typography>
                    </Box>
                ) : (
                    <DataTable 
                        columns={["Ticket #", "Service", "Title", "Priority", "Due Date / SLA", "Status", "Action"]}
                        alignments={["left", "left", "left", "center", "center", "center", "center"]}
                        nonSortableColumns={[6]}
                        rows={tickets.map((t) => [
                            { value: t.ticketNumber, display: <Typography fontWeight={600} color="primary">#{t.ticketNumber}</Typography> },
                            { value: t.service?.name || 'Unknown', display: t.service?.name || 'Unknown' },
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
                                    </Box>
                                )
                            },
                            { 
                                value: t.priority, 
                                display: <PriorityBadge priority={t.priority} />
                            },
                            { 
                                value: t.dueDate || '', 
                                display: <DueCountdownBadge dueDate={t.dueDate} status={t.status} /> 
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
        </PageContainer>
    );
};

export default AssignedToMe;
