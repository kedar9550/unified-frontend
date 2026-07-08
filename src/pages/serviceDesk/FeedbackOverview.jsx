import React, { useState, useEffect, useMemo } from 'react';
import { 
    Box, Typography, TextField, MenuItem, Select, FormControl, 
    InputAdornment, Paper, Button, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, TablePagination
} from '@mui/material';
import { 
    Star, Smile, MessageSquare, Search, Download, 
    ShieldCheck
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/common/Loader';

const getSatisfactionColor = (satisfaction) => {
    switch (satisfaction) {
        case "Very Satisfied": return "bg-success text-white";
        case "Satisfied": return "bg-primary text-white";
        case "Neutral": return "bg-warning text-dark";
        case "Dissatisfied": return "bg-orange text-white";
        case "Very Dissatisfied": return "bg-danger text-white";
        default: return "bg-secondary text-white";
    }
};

// eslint-disable-next-line no-unused-vars
const StatCard = ({ title, value, icon: Icon, trend, subtitle, color, progress, bgIcon: BgIcon, valueVariant = "h4" }) => (
    <Paper sx={{
        p: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '16px',
        background: 'var(--card-bg)',
        boxShadow: '0px 2px 10px rgba(0,0,0,0.04)',
        position: 'relative',
        overflow: 'hidden',
        border: 'none',
        transition: 'transform 0.2s',
        '&:hover': { transform: 'translateY(-2px)' }
    }}>
        {BgIcon && (
            <Box sx={{ position: 'absolute', right: -20, top: -20, opacity: 0.05, transform: 'rotate(-15deg)', zIndex: 0 }}>
                <BgIcon size={120} color={color} />
            </Box>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, position: 'relative', zIndex: 1 }}>
            <Box sx={{ p: 1.2, borderRadius: '12px', bgcolor: `${color}15`, color: color }}>
                <Icon size={24} strokeWidth={2.5} />
            </Box>
        </Box>
        
        <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography variant={valueVariant} sx={{ fontWeight: 800, color: 'var(--text-color)', mb: 0.5, letterSpacing: valueVariant !== 'h4' ? '-0.5px' : 'normal' }}>
                {value}
            </Typography>
            <Typography variant="body2" sx={{ color: 'var(--secondary-color)', fontWeight: 500, mb: progress !== undefined ? 2 : 0 }}>
                {title}
            </Typography>
        </Box>

        {progress !== undefined && (
            <Box sx={{ width: '100%', height: '4px', bgcolor: '#f0f0f0', borderRadius: '4px', position: 'relative', zIndex: 1, mt: 'auto' }}>
                <Box sx={{ width: `${progress}%`, height: '100%', bgcolor: color, borderRadius: '4px' }} />
            </Box>
        )}
        
        {subtitle && (
            <Box sx={{ position: 'relative', zIndex: 1, mt: progress !== undefined ? 1.5 : 'auto' }}>
                <Typography variant="caption" sx={{ color: 'var(--secondary-color)', display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 500 }}>
                    {trend && (
                        <span style={{ color: typeof trend === 'number' && trend > 0 ? '#22c55e' : '#ef4444', display: 'flex', alignItems: 'center', fontWeight: 700 }}>
                            {typeof trend === 'number' ? (trend > 0 ? '↑' : '↓') : ''} {typeof trend === 'number' ? Math.abs(trend) : trend}
                        </span>
                    )}
                    {subtitle}
                </Typography>
            </Box>
        )}
    </Paper>
);


const FeedbackOverview = () => {
    const { activeRole } = useAuth();
    const isSA = activeRole === 'UNIPRIME';

    const [feedbackData, setFeedbackData] = useState([]);
    const [summary, setSummary] = useState(null);
    const [trendData, setTrendData] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [serviceFilter, setServiceFilter] = useState("All Services");
    const [ratingFilter, setRatingFilter] = useState("All Ratings");
    const [statusFilter, setStatusFilter] = useState("All Status");
    
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [allServicesList, setAllServicesList] = useState([]);

    const fetchFeedback = async () => {
        try {
            setLoading(true);
            const [feedbackRes, servicesRes] = await Promise.all([
                API.get('/api/service-desk/tickets/feedback/analytics', { withCredentials: true }),
                API.get('/api/service-desk/services', { withCredentials: true })
            ]);

            if (feedbackRes.data.success) {
                const result = feedbackRes.data.data;
                setFeedbackData(result.feedbacks || []);
                const ratingDist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
                (result.feedbacks || []).forEach(f => {
                    const r = Math.round(Number(f.rating));
                    if (ratingDist[r] !== undefined) {
                        ratingDist[r]++;
                    }
                });

                setSummary({
                    totalFeedback: result.totalCount,
                    averageRating: result.averageRating,
                    satisfactionDistribution: result.satisfactionDistribution,
                    ratingDistribution: ratingDist
                });
                
                const formattedTrend = (result.trend || []).map(t => ({
                    date: t.month,
                    count: t.count
                }));
                setTrendData(formattedTrend);
            }

            if (Array.isArray(servicesRes.data)) {
                setAllServicesList(servicesRes.data);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeedback();
    }, []);

    useEffect(() => {
        setPage(0);
    }, [search, serviceFilter, ratingFilter, statusFilter]);

    const uniqueServices = useMemo(() => {
        if (isSA) {
            const serviceNames = allServicesList.map(s => s.name).filter(Boolean);
            return ["All Services", ...new Set(serviceNames)];
        } else {
            const serviceNames = feedbackData.map(f => f.ticket?.service?.name).filter(Boolean);
            const uniqueNames = [...new Set(serviceNames)];
            return uniqueNames.length > 1 ? ["All Services", ...uniqueNames] : uniqueNames;
        }
    }, [allServicesList, isSA, feedbackData]);

    useEffect(() => {
        if (uniqueServices.length > 0 && !uniqueServices.includes(serviceFilter)) {
            setServiceFilter(uniqueServices[0]);
        }
    }, [uniqueServices, serviceFilter]);

    const filteredRows = useMemo(() => {
        return feedbackData.filter(f => {
            const matchesSearch = !search || 
                f.submittedBy?.name?.toLowerCase().includes(search.toLowerCase()) ||
                f.ticket?.ticketNumber?.toLowerCase().includes(search.toLowerCase()) ||
                f.ticket?.title?.toLowerCase().includes(search.toLowerCase());
            
            const matchesService = serviceFilter === "All Services" || f.ticket?.service?.name === serviceFilter;
            const matchesRating = ratingFilter === "All Ratings" || Number(f.rating) === Number(ratingFilter);
            const matchesStatus = statusFilter === "All Status" || f.satisfaction === statusFilter;

            return matchesSearch && matchesService && matchesRating && matchesStatus;
        });
    }, [feedbackData, search, serviceFilter, ratingFilter, statusFilter]);

    const handleExport = () => {
        const csvContent = "data:text/csv;charset=utf-8," 
            + "User,Service,Ticket,Rating,Satisfaction,Comments,Date\n"
            + filteredRows.map(r => `"${r.submittedBy?.name}","${r.ticket?.service?.name}","${r.ticket?.ticketNumber}","${r.rating}","${r.satisfaction}","${(r.comments || '').replace(/"/g, '""')}","${new Date(r.createdAt).toLocaleDateString()}"`).join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "feedback_report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const satisfactionRate = useMemo(() => {
        if (!feedbackData.length) return 0;
        const positive = feedbackData.filter(f => ["Satisfied", "Very Satisfied"].includes(f.satisfaction)).length;
        return Math.round((positive / feedbackData.length) * 100);
    }, [feedbackData]);

    const responseQuality = useMemo(() => {
        const avg = Number(summary?.averageRating || 0);
        if (avg >= 4.5) return { label: "Excellent", color: "#22c55e", msg: "Exceptional service standards!" };
        if (avg >= 4) return { label: "Good", color: "#34d399", msg: "Maintain the good work!" };
        if (avg >= 3) return { label: "Average", color: "#fbbf24", msg: "There is room for improvement." };
        return { label: "Poor", color: "#ef4444", msg: "Needs immediate attention!" };
    }, [summary]);

    const satisfactionColors = {
        "Very Satisfied": "#22c55e",
        "Satisfied": "#84cc16",
        "Neutral": "#eab308",
        "Dissatisfied": "#f97316",
        "Very Dissatisfied": "#ef4444"
    };

    const satisfactionData = summary?.satisfactionDistribution ? 
        Object.entries(summary.satisfactionDistribution).map(([name, value]) => ({
            name,
            value,
            color: satisfactionColors[name] || "#CBD5E1"
        })).filter(d => d.value > 0) : [];

    if (loading) return <Loader />;

    return (
        <Box sx={{ width: '100%', flexGrow: 1, display: 'flex', flexDirection: 'column', bgcolor: '#f5f7fa', minHeight: '100vh' }}>
            <Box sx={{ px: { xs: 2, md: 3 }, pt: { xs: 2, md: 3 }, pb: 2 }}>
                <PageHeader title="Feedback Overview" subtitle="Analyze user satisfaction and service quality trends" />
            </Box>

            <Box sx={{ px: 3, pb: 3 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
                    <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', lg: 'calc(25% - 18px)' } }}>
                        <StatCard 
                            title="Average Rating" 
                            value={summary?.averageRating || "0.0"} 
                            icon={Star} 
                            subtitle="Out of 5" 
                            color="#f5a623"
                            bgIcon={Star}
                        />
                    </Box>
                    <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', lg: 'calc(25% - 18px)' } }}>
                        <StatCard 
                            title="Satisfaction Rate" 
                            value={`${satisfactionRate}%`} 
                            icon={Smile} 
                            progress={satisfactionRate}
                            color="#22c55e"
                            bgIcon={Smile}
                        />
                    </Box>
                    <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', lg: 'calc(25% - 18px)' } }}>
                        <StatCard 
                            title="Total Feedback" 
                            value={summary?.totalFeedback || 0} 
                            icon={MessageSquare} 
                            color="#3b82f6"
                            bgIcon={MessageSquare}
                        />
                    </Box>
                    <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', lg: 'calc(25% - 18px)' } }}>
                        <StatCard 
                            title="Response Quality" 
                            value={responseQuality.label} 
                            icon={ShieldCheck} 
                            subtitle={responseQuality.msg} 
                            color={responseQuality.color}
                            bgIcon={ShieldCheck}
                            valueVariant="h5"
                        />
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
                    <Box sx={{ width: { xs: '100%', lg: 'calc(33.333% - 16px)' } }}>
                        <Paper sx={{ p: { xs: 3, md: 4 }, height: '100%', borderRadius: '16px', background: 'var(--card-bg)', boxShadow: '0px 2px 10px rgba(0,0,0,0.04)', border: 'none', display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="subtitle1" fontWeight={700} mb={4}>Rating Distribution</Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, justifyContent: 'center', minHeight: '200px' }}>
                                {[5, 4, 3, 2, 1].map(rating => {
                                    const count = summary?.ratingDistribution?.[rating] || 0;
                                    const percentage = summary?.totalFeedback > 0 ? ((count / summary.totalFeedback) * 100).toFixed(1) : 0;
                                    return (
                                        <Box key={rating} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Typography variant="caption" fontWeight={700} sx={{ minWidth: "45px", color: "var(--text-color)" }}>{rating} Star</Typography>
                                            <Box sx={{ flexGrow: 1, borderRadius: 5, overflow: 'hidden', height: "8px", backgroundColor: "var(--border-color)" }}>
                                                <Box sx={{ height: '100%', borderRadius: 5, width: `${percentage}%`, backgroundColor: rating >= 4 ? "#22c55e" : rating === 3 ? "#eab308" : "#ef4444", transition: "width 1s ease-in-out" }} />
                                            </Box>
                                            <Typography variant="caption" sx={{ minWidth: "65px", color: "var(--secondary-color)" }}>{count} ({percentage}%)</Typography>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Paper>
                    </Box>
                    <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)', lg: 'calc(33.333% - 16px)' } }}>
                        <Paper sx={{ p: { xs: 3, md: 4 }, height: '100%', borderRadius: '16px', background: 'var(--card-bg)', boxShadow: '0px 2px 10px rgba(0,0,0,0.04)', border: 'none', display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="subtitle1" fontWeight={700} mb={4}>Satisfaction Level</Typography>
                            <Box sx={{ height: "200px", width: "100%", position: "relative" }}>
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie data={satisfactionData} innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                                            {satisfactionData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                        </Pie>
                                        <Tooltip content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (
                                                    <Box sx={{ p: 1.5, bgcolor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', minWidth: '120px' }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 700, color: data.color || "var(--text-primary)", mb: 0.5 }}>
                                                            {data.name}
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                                                            Count: {data.value}
                                                        </Typography>
                                                    </Box>
                                                );
                                            }
                                            return null;
                                        }} />
                                        <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ fontSize: "12px", color: "var(--text-color)" }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </Paper>
                    </Box>
                    <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)', lg: 'calc(33.333% - 16px)' } }}>
                        <Paper sx={{ p: { xs: 3, md: 4 }, height: '100%', borderRadius: '16px', background: 'var(--card-bg)', boxShadow: '0px 2px 10px rgba(0,0,0,0.04)', border: 'none', display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="subtitle1" fontWeight={700} mb={4}>Feedback Trend</Typography>
                            <Box sx={{ height: "200px", width: "100%", position: "relative" }}>
                                <ResponsiveContainer width="100%" height={200}>
                                    <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorFeedbackOverview" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="date" tick={{fontSize: 10, fill: "var(--secondary-color)"}} tickLine={false} axisLine={false} minTickGap={20} />
                                        <YAxis tick={{fontSize: 10, fill: "var(--secondary-color)"}} tickLine={false} axisLine={false} />
                                        <Tooltip content={({ active, payload, label }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="p-2 border rounded shadow-sm" style={{ fontSize: "11px", backgroundColor: "var(--card-bg)", color: "var(--text-color)", borderColor: "var(--border-color)", borderRadius: '8px' }}>
                                                        <p className="mb-1 fw-bold">{label}</p>
                                                        <p className="mb-0 text-primary">Feedback: {payload[0].value}</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }} />
                                        <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorFeedbackOverview)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </Box>
                        </Paper>
                    </Box>
                </Box>

                <Paper sx={{ p: 3, mb: 4, borderRadius: '16px', background: 'var(--card-bg)', boxShadow: '0px 2px 10px rgba(0,0,0,0.04)', border: 'none' }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center' }}>
                        <Box sx={{ flexGrow: 1, minWidth: { xs: '100%', lg: '300px' } }}>
                            <TextField
                                fullWidth
                                placeholder="Search by user, service or ticket..."
                                variant="outlined"
                                size="small"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Search size={18} color="var(--secondary-color)" />
                                            </InputAdornment>
                                        )
                                    }
                                }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'var(--bg-color)' } }}
                            />
                        </Box>
                        <Box sx={{ width: { xs: 'calc(50% - 12px)', lg: '150px' } }}>
                            <FormControl fullWidth size="small">
                                <Select
                                    value={serviceFilter}
                                    onChange={(e) => setServiceFilter(e.target.value)}
                                    sx={{ borderRadius: '12px', bgcolor: 'var(--bg-color)', color: 'var(--text-color)' }}
                                >
                                    {uniqueServices.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ width: { xs: 'calc(50% - 12px)', lg: '150px' } }}>
                            <FormControl fullWidth size="small">
                                <Select
                                    value={ratingFilter}
                                    onChange={(e) => setRatingFilter(e.target.value)}
                                    sx={{ borderRadius: '12px', bgcolor: 'var(--bg-color)', color: 'var(--text-color)' }}
                                >
                                    <MenuItem value="All Ratings">All Ratings</MenuItem>
                                    {[5, 4, 3, 2, 1].map(r => <MenuItem key={r} value={r}>{r} Stars</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ width: { xs: '100%', lg: '150px' } }}>
                            <FormControl fullWidth size="small">
                                <Select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    sx={{ borderRadius: '12px', bgcolor: 'var(--bg-color)', color: 'var(--text-color)' }}
                                >
                                    <MenuItem value="All Status">All Status</MenuItem>
                                    <MenuItem value="Very Satisfied">Very Satisfied</MenuItem>
                                    <MenuItem value="Satisfied">Satisfied</MenuItem>
                                    <MenuItem value="Neutral">Neutral</MenuItem>
                                    <MenuItem value="Dissatisfied">Dissatisfied</MenuItem>
                                    <MenuItem value="Very Dissatisfied">Very Dissatisfied</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ width: { xs: '100%', lg: 'auto' } }}>
                            <Button 
                                variant="outlined" 
                                color="primary"
                                fullWidth
                                startIcon={<Download size={18} />}
                                sx={{ borderRadius: '12px', height: '40px', textTransform: 'none', fontWeight: 600 }}
                                onClick={handleExport}
                            >
                                Export
                            </Button>
                        </Box>
                    </Box>
                </Paper>

                <Box mb={5}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-color)' }}>
                            Detailed History
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'var(--secondary-color)' }}>
                            Showing {filteredRows.length} results
                        </Typography>
                    </Box>

                    <TableContainer component={Paper} sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-premium)", overflowX: "auto" }}>
                        <Table size="medium" sx={{ minWidth: 1100 }}>
                            <TableHead sx={{ background: "var(--gradient-primary)" }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700, width: "60px", color: "#fff", py: 2 }}>S.No</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }} align="center">User Name</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Service Name</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Ticket ID</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Title</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }} align="center">Rating</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }} align="center">Satisfaction</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Comments</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Submitted On</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredRows.length > 0 ? (
                                    filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((feedback, index) => (
                                        <TableRow 
                                            key={feedback._id} 
                                            sx={{ "&:hover": { background: "var(--bg-accent-1)" }, transition: "background 0.15s" }}
                                        >
                                            <TableCell sx={{ fontWeight: 600, color: "var(--text-secondary)" }}>
                                                {page * rowsPerPage + index + 1}
                                            </TableCell>
                                            <TableCell sx={{ py: 2 }} align="center">
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                                    {feedback.submittedBy?.name || 'Unknown User'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 2, color: 'var(--text-secondary)' }}>
                                                {feedback.ticket?.service?.name || "Unknown Service"}
                                            </TableCell>
                                            <TableCell sx={{ py: 2 }}>
                                                <Link to={`/ticketdetails/${feedback.ticket?._id}`} style={{ textDecoration: 'none', color: 'var(--primary-color)', fontWeight: 600 }}>
                                                    #{feedback.ticket?.ticketNumber || "N/A"}
                                                </Link>
                                            </TableCell>
                                            <TableCell sx={{ py: 2, color: 'var(--text-secondary)' }}>
                                                {feedback.ticket?.title || "No Title"}
                                            </TableCell>
                                            <TableCell align="center" sx={{ py: 2 }}>
                                                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                                    <Typography sx={{ fontWeight: 800, color: '#f5a623', fontSize: '0.95rem' }}>
                                                        {Number(feedback.rating)}
                                                    </Typography>
                                                    <Star size={14} fill="#f5a623" color="#f5a623" />
                                                </Box>
                                            </TableCell>
                                            <TableCell align="center" sx={{ py: 2 }}>
                                                <span className={`badge rounded-pill ${getSatisfactionColor(feedback.satisfaction)}`} style={{ fontSize: '11px', padding: '6px 12px' }}>
                                                    {feedback.satisfaction}
                                                </span>
                                            </TableCell>
                                            <TableCell sx={{ py: 2, color: 'var(--text-secondary)' }}>
                                                <Typography variant="body2" sx={{ fontStyle: !feedback.comments ? 'italic' : 'normal' }}>
                                                    {feedback.comments || 'No comments provided.'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 2, color: 'var(--text-secondary)', fontSize: 12 }}>
                                                {new Date(feedback.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                                            <Typography sx={{ color: 'var(--secondary-color)', fontWeight: 500 }}>No Feedback found</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <TablePagination
                        component="div"
                        count={filteredRows.length}
                        page={page}
                        onPageChange={(e, newPage) => setPage(newPage)}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={(e) => {
                            setRowsPerPage(parseInt(e.target.value, 10));
                            setPage(0);
                        }}
                        rowsPerPageOptions={[5, 10, 25]}
                        sx={{
                            borderTop: "1px solid var(--border-color)",
                            color: "var(--text-secondary)",
                            ".MuiTablePagination-select": { color: "var(--text-primary)" },
                            ".MuiTablePagination-selectIcon": { color: "var(--text-secondary)" },
                            ".MuiIconButton-root": { color: "var(--text-secondary)" },
                            ".MuiIconButton-root.Mui-disabled": { opacity: 0.3 }
                        }}
                    />
                </Box>
            </Box>
        </Box>
    );
};

export default FeedbackOverview;
