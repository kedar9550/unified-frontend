import React, { useState, useEffect, useRef } from 'react';
import API from '../../api/axios';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { CalendarToday, ErrorOutlined, AccessTime, Insights, Download } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

import DataTable from '../../components/data/DataTable';
import PageHeader from '../../components/common/PageHeader';
import { CircularProgress, Box, Typography, Chip, Tooltip, IconButton, Menu, MenuItem, Select, FormControl, InputLabel, TextField, Button, Grid, Paper } from '@mui/material';

const getStatusColor = (status) => {
    switch (status) {
        case 'OPEN': return 'warning';     // Orange-ish for Unassigned/Open
        case 'ASSIGNED': return 'primary'; // Blue for Assigned
        case 'IN_PROGRESS': return 'info'; // Light Blue/Cyan for In Progress
        case 'RESOLVED': return 'success'; // Green for Resolved
        case 'REJECTED': return 'error';   // Red for Rejected
        case 'CLOSED': return 'default';   // Grey for Closed
        default: return 'default';
    }
};

const getPriorityColor = (priority) => {
    switch (priority?.toUpperCase()) {
        case 'HIGH': return 'error.main';
        case 'MEDIUM': return 'warning.main';
        case 'LOW': return 'info.main';
        default: return 'text.secondary';
    }
};

const Reports = () => {
    const { user, activeRole } = useAuth();
    const isSuperAdmin = activeRole === 'UNIPRIME';
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [departments, setDepartments] = useState([]);
    const [containerReady, setContainerReady] = useState(false);
    
    const [exportAnchorEl, setExportAnchorEl] = useState(null);

    const [filters, setFilters] = useState({
        dateRange: 'last30days',
        startDate: '',
        endDate: '',
        serviceId: 'all',
        priority: 'all'
    });

    useEffect(() => {
        fetchStats();
        if (isSuperAdmin) {
            fetchDepartments();
        }

        const timer = setTimeout(() => {
            setContainerReady(true);
            window.dispatchEvent(new Event('resize'));
        }, 500);

        return () => clearTimeout(timer);
    }, [activeRole]);

    const fetchDepartments = async () => {
        try {
            const res = await API.get('/api/service');
            setDepartments(res.data.data || []);
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    };

    const fetchStats = async (activeFilters = filters) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (activeFilters.dateRange) params.append('dateRange', activeFilters.dateRange);
            if (activeFilters.startDate) params.append('startDate', activeFilters.startDate);
            if (activeFilters.endDate) params.append('endDate', activeFilters.endDate);
            if (activeFilters.serviceId) params.append('serviceId', activeFilters.serviceId);
            if (activeFilters.priority) params.append('priority', activeFilters.priority);

            const res = await API.get(`/api/service-desk/tickets/reports?${params.toString()}`);
            setStats(res.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
            toast.error('Failed to fetch report data');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const applyFilters = () => {
        fetchStats();
    };

    const exportToExcel = () => {
        setExportAnchorEl(null);
        if (!stats?.recentTickets?.length) {
            toast.info('No data available to export.');
            return;
        }
        try {
            const data = stats.recentTickets.map(t => ({
                'Ticket ID': t.ticketNumber,
                'Subject': t.title,
                'Assigned To': t.assignedTo || '--',
                'Status': t.status,
                'Priority': t.priority,
                'Created Date': new Date(t.createdAt).toLocaleDateString('en-GB'),
                'Closed Date': t.updatedAt && (t.status === 'CLOSED' || t.status === 'RESOLVED') ? new Date(t.updatedAt).toLocaleDateString('en-GB') : '--',
                'Due Date': t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-GB') : '--'
            }));
            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            const selectedDeptName = filters.serviceId === 'all' ? 'All Services' : (departments.find(d => d._id === filters.serviceId)?.name || 'Service Report');
            XLSX.utils.book_append_sheet(workbook, worksheet, `Report - ${selectedDeptName}`.substring(0, 31));
            XLSX.writeFile(workbook, `Tickets_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
            toast.success('Excel export initiated.');
        } catch (error) {
            console.error('Excel Export Error:', error);
            toast.error('Failed to export Excel.');
        }
    };

    const exportToPDF = () => {
        setExportAnchorEl(null);
        if (!stats?.recentTickets?.length) {
            toast.info('No data available to export.');
            return;
        }
        try {
            const doc = new jsPDF();
            const selectedDeptName = filters.serviceId === 'all' ? 'All Services' : (departments.find(d => d._id === filters.serviceId)?.name || 'Service Report');
            doc.text(`Tickets Report - ${selectedDeptName}`, 14, 15);
            const tableColumn = ['Ticket ID', 'Subject', 'Assigned To', 'Status', 'Priority', 'Created Date', 'Due Date'];
            const tableRows = stats.recentTickets.map(t => [
                t.ticketNumber,
                t.title,
                t.assignedTo || '--',
                t.status,
                t.priority,
                new Date(t.createdAt).toLocaleDateString('en-GB'),
                t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-GB') : '--'
            ]);
            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 20,
            });
            doc.save(`Tickets_Report_${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success('PDF export initiated.');
        } catch (error) {
            console.error('PDF Export Error:', error);
            toast.error('Failed to export PDF.');
        }
    };

    const { summary, trendData, statusData, recentTickets } = stats || {};

    const columns = [
        'Ticket #', 'Subject', 'Assigned To', 'Status', 'Priority', 'Created Date', 'Due Date'
    ];
    
    const rows = recentTickets?.map((t) => [
        { value: t.ticketNumber, display: <Typography fontWeight={600} color="primary" sx={{ cursor: 'pointer' }} onClick={() => navigate(`/service-desk/ticket/${t._id}`)}>#{t.ticketNumber}</Typography> },
        { value: t.title, display: t.title },
        { value: t.assignedTo || '--', display: t.assignedTo || '--' },
        { value: t.status, display: <Chip label={t.status} color={getStatusColor(t.status)} size="small" sx={{ fontWeight: 600, borderRadius: '6px' }} /> },
        { value: t.priority, display: <Typography fontSize="0.875rem" fontWeight={500} color={getPriorityColor(t.priority)}>{t.priority}</Typography> },
        { value: t.createdAt, display: new Date(t.createdAt).toLocaleDateString('en-GB').replace(/\//g, "-") },
        { 
            value: t.dueDate, 
            display: (() => {
                if (!t.dueDate) return '--';
                const isOverdue = new Date(t.dueDate) < new Date() && t.status !== 'RESOLVED' && t.status !== 'CLOSED';
                return <Typography fontSize="0.875rem" fontWeight={isOverdue ? 700 : 500} color={isOverdue ? 'error.main' : 'primary.main'}>
                    {new Date(t.dueDate).toLocaleDateString('en-GB').replace(/\//g, "-")}
                </Typography>;
            })()
        }
    ]) || [];

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ fontSize: '12px', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px' }}>
                    <p style={{ margin: 0, fontWeight: 700, marginBottom: '4px' }}>{label}</p>
                    <p style={{ margin: 0, color: '#22c55e' }}>Created: {payload[0].value}</p>
                    {payload[1] && <p style={{ margin: 0, color: '#f97316' }}>Closed: {payload[1].value}</p>}
                </div>
            );
        }
        return null;
    };

    return (
        <Box sx={{ width: '100%', flexGrow: 1, display: 'flex', flexDirection: 'column', bgcolor: '#f5f7fa', minHeight: '100vh' }}>
            <Box sx={{ px: { xs: 2, md: 3 }, pt: { xs: 2, md: 3 }, pb: 2 }}>
                <PageHeader 
                    title="Reports Dashboard" 
                    subtitle={isSuperAdmin ? (filters.serviceId === 'all' ? 'All Services' : (departments.find(d => d._id === filters.serviceId)?.name || 'Service Report')) : 'My Services'} 
                    action={
                        <Box>
                            <Button 
                                variant="contained" 
                                color="primary"
                                endIcon={<Download />}
                                onClick={(e) => setExportAnchorEl(e.currentTarget)}
                                sx={{ borderRadius: '8px', textTransform: 'none', bgcolor: '#0f4c81' }}
                            >
                                Export Report
                            </Button>
                            <Menu
                                anchorEl={exportAnchorEl}
                                open={Boolean(exportAnchorEl)}
                                onClose={() => setExportAnchorEl(null)}
                            >
                                <MenuItem onClick={exportToExcel}>Export as Excel (.xlsx)</MenuItem>
                                <MenuItem onClick={exportToPDF}>Export as PDF (.pdf)</MenuItem>
                            </Menu>
                        </Box>
                    }
                />
            </Box>

            {loading && !stats ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Box sx={{ px: 3, pb: 3 }}>
                    <Paper sx={{ p: 3, mb: 4, borderRadius: '12px', background: 'var(--bg-panel)', boxShadow: '0px 2px 10px rgba(0,0,0,0.04)', border: '1px solid var(--border-color)' }}>
                        <Typography variant="subtitle2" fontWeight={700} color="#333" mb={2}>Filter & Date Range</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end' }}>
                            <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'auto' }, flex: { md: 1 } }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>Duration</Typography>
                                <FormControl fullWidth size="small">
                                    <Select 
                                        name="dateRange" 
                                        value={filters.dateRange} 
                                        onChange={handleFilterChange} 
                                        displayEmpty 
                                        sx={{ borderRadius: '8px', bgcolor: '#fff' }}
                                        startAdornment={<CalendarToday sx={{ fontSize: 18, color: 'text.secondary', ml: 1, mr: 1 }} />}
                                    >
                                        <MenuItem value="all">All Time</MenuItem>
                                        <MenuItem value="last10days">Last 10 Days</MenuItem>
                                        <MenuItem value="last30days">Last 30 Days</MenuItem>
                                        <MenuItem value="last3months">Last 3 Months</MenuItem>
                                        <MenuItem value="last6months">Last 6 Months</MenuItem>
                                        <MenuItem value="lastyear">Last Year</MenuItem>
                                        <MenuItem value="custom">Custom Date</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                            
                            {filters.dateRange === 'custom' && (
                                <>
                                    <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'auto' }, flex: { md: 1 } }}>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>Start Date</Typography>
                                        <TextField 
                                            fullWidth size="small" type="date" 
                                            name="startDate" value={filters.startDate} onChange={handleFilterChange}
                                            InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#fff' } }}
                                        />
                                    </Box>
                                    <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'auto' }, flex: { md: 1 } }}>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>End Date</Typography>
                                        <TextField 
                                            fullWidth size="small" type="date" 
                                            name="endDate" value={filters.endDate} onChange={handleFilterChange}
                                            InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#fff' } }}
                                        />
                                    </Box>
                                </>
                            )}

                            {isSuperAdmin && (
                                <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'auto' }, flex: { md: 1 } }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>Type of Service</Typography>
                                    <FormControl fullWidth size="small">
                                        <Select name="serviceId" value={filters.serviceId} onChange={handleFilterChange} displayEmpty sx={{ borderRadius: '8px', bgcolor: '#fff' }}>
                                            <MenuItem value="all">All Services</MenuItem>
                                            {departments.map(dept => (
                                                <MenuItem key={dept._id} value={dept._id}>{dept.name}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                            )}

                            <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'auto' }, flex: { md: 1 } }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>Priority</Typography>
                                <FormControl fullWidth size="small">
                                    <Select name="priority" value={filters.priority} onChange={handleFilterChange} displayEmpty sx={{ borderRadius: '8px', bgcolor: '#fff' }}>
                                        <MenuItem value="all">All Priorities</MenuItem>
                                        <MenuItem value="low">Low</MenuItem>
                                        <MenuItem value="medium">Medium</MenuItem>
                                        <MenuItem value="high">High</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>

                            <Box sx={{ width: { xs: '100%', sm: '100%', md: 'auto' }, flexShrink: { md: 0 } }}>
                                <Button variant="contained" onClick={applyFilters} sx={{ textTransform: 'none', borderRadius: '8px', height: '40px', px: 3, width: { xs: '100%', md: 'auto' }, fontWeight: 700, fontSize: '13px', bgcolor: '#01214a', backgroundImage: 'linear-gradient(to right, #01214a, #0f4c81)', boxShadow: '0 4px 14px 0 rgba(1, 33, 74, 0.39)' }}>
                                    Apply Filters
                                </Button>
                            </Box>
                        </Box>
                    </Paper>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
                        <Box sx={{ width: { xs: '100%', md: 'calc(33.333% - 16px)' } }}>
                            <Paper sx={{ p: 3, height: '100%', borderRadius: '12px', background: 'var(--bg-panel)', boxShadow: '0px 2px 10px rgba(0,0,0,0.04)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                    <Box sx={{ width: 48, height: 48, borderRadius: '8px', bgcolor: 'rgba(245, 166, 35, 0.15)', color: '#f5a623', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Insights />
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>Resolution Rate</Typography>
                                        <Typography variant="h5" fontWeight={800} color="#333">{summary?.resolutionRate || '0%'}</Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ width: '100%', height: '4px', bgcolor: '#f0f0f0', borderRadius: '4px' }}>
                                    <Box sx={{ width: summary?.resolutionRate || '0%', height: '100%', bgcolor: '#f5a623', borderRadius: '4px' }} />
                                </Box>
                            </Paper>
                        </Box>
                        <Box sx={{ width: { xs: '100%', md: 'calc(33.333% - 16px)' } }}>
                            <Paper sx={{ p: 3, height: '100%', borderRadius: '12px', background: 'var(--bg-panel)', boxShadow: '0px 2px 10px rgba(0,0,0,0.04)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                    <Box sx={{ width: 48, height: 48, borderRadius: '8px', bgcolor: 'rgba(24, 144, 255, 0.15)', color: '#1890ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <AccessTime />
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>Avg. Handling Time</Typography>
                                        <Typography variant="h5" fontWeight={800} color="#333">{summary?.avgHandlingTime || '0 Days'}</Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ width: '100%', height: '4px', bgcolor: '#f0f0f0', borderRadius: '4px' }}>
                                    <Box sx={{ width: '60%', height: '100%', bgcolor: '#1890ff', borderRadius: '4px' }} />
                                </Box>
                            </Paper>
                        </Box>
                        <Box sx={{ width: { xs: '100%', md: 'calc(33.333% - 16px)' } }}>
                            <Paper sx={{ p: 3, height: '100%', borderRadius: '12px', background: 'var(--bg-panel)', boxShadow: '0px 2px 10px rgba(0,0,0,0.04)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                    <Box sx={{ width: 48, height: 48, borderRadius: '8px', bgcolor: 'rgba(245, 34, 45, 0.15)', color: '#f5222d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <ErrorOutlined />
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>Overdue Tickets</Typography>
                                        <Typography variant="h5" fontWeight={800} color="#333">{summary?.overdueTickets || 0}</Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ width: '100%', height: '4px', bgcolor: '#f0f0f0', borderRadius: '4px' }}>
                                    <Box sx={{ width: '100%', height: '100%', bgcolor: '#f5222d', borderRadius: '4px' }} />
                                </Box>
                            </Paper>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
                        <Box sx={{ width: { xs: '100%', lg: 'calc(66.666% - 12px)' } }}>
                            <Paper sx={{ p: 3, height: '100%', borderRadius: '12px', background: 'var(--bg-panel)', boxShadow: '0px 2px 10px rgba(0,0,0,0.04)', border: '1px solid var(--border-color)' }}>
                                <Typography variant="subtitle2" fontWeight={700} color="#333" mb={3}>Tickets Trend (Last 30 Days)</Typography>
                                <Box sx={{ height: 250, width: '100%' }}>
                                    {containerReady ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                                                    </linearGradient>
                                                    <linearGradient id="colorClosed" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="date" tick={{fontSize: 11, fill: '#888'}} tickLine={false} axisLine={false} minTickGap={20} />
                                                <YAxis tick={{fontSize: 11, fill: '#888'}} tickLine={false} axisLine={false} />
                                                <RechartsTooltip content={<CustomTooltip />} />
                                                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '10px' }} />
                                                <Area type="monotone" name="Created" dataKey="created" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorCreated)" />
                                                <Area type="monotone" name="Closed" dataKey="closed" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorClosed)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                            <CircularProgress size={24} />
                                        </Box>
                                    )}
                                </Box>
                            </Paper>
                        </Box>
                        
                        <Box sx={{ width: { xs: '100%', lg: 'calc(33.333% - 12px)' } }}>
                            <Paper sx={{ p: 3, height: '100%', borderRadius: '12px', background: 'var(--bg-panel)', boxShadow: '0px 2px 10px rgba(0,0,0,0.04)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="subtitle2" fontWeight={700} color="#333" mb={3}>Tickets by Status</Typography>
                                <Box sx={{ flexGrow: 1, height: 250, width: '100%', position: 'relative' }}>
                                    {containerReady ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={statusData}
                                                    cx="40%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={90}
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                >
                                                    {statusData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip />
                                                <Legend verticalAlign="bottom" align="right" layout="vertical" iconType="circle" wrapperStyle={{ right: 0, bottom: 20 }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                            <CircularProgress size={24} />
                                        </Box>
                                    )}
                                </Box>
                            </Paper>
                        </Box>
                    </Box>

                    <Paper sx={{ p: 3, borderRadius: '12px', background: 'var(--bg-panel)', border: '1px solid var(--border-color)' }}>
                        <Typography variant="h6" fontWeight={600} mb={3}>Detailed Report Table</Typography>
                        <DataTable 
                            columns={columns} 
                            rows={rows} 
                            alignments={['left', 'left', 'left', 'center', 'center', 'left', 'left']}
                        />
                    </Paper>

                </Box>
            )}
        </Box>
    );
};

export default Reports;
