import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Paper, Chip, Avatar, Stack, Divider,
  MenuItem, Select, FormControl, Skeleton, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton
} from '@mui/material';
import {
  ConfirmationNumber, CheckCircle, PriorityHigh, ArrowForward, Group, ReportProblem,
  AccessTime, Schedule, AssignmentInd, Lock, Warning, Refresh, Layers, LocationOn
} from '@mui/icons-material';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip as RechartsTooltip, Cell, PieChart, Pie, Legend
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

// ─── Status & Priority Meta ──────────────────────────────────────────────────
const STATUS_META = {
  OPEN:        { label: 'New (Unassigned)', shortLabel: 'New',         color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  ASSIGNED:    { label: 'Assigned',         shortLabel: 'Assigned',    color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  IN_PROGRESS: { label: 'In Progress',      shortLabel: 'In Progress', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  RESOLVED:    { label: 'Resolved',         shortLabel: 'Resolved',    color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  CLOSED:      { label: 'Closed',           shortLabel: 'Closed',      color: '#0284c7', bg: 'rgba(2,132,199,0.12)'  },
  REJECTED:    { label: 'Reopened',         shortLabel: 'Reopened',    color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
};

const PRIORITY_META = {
  CRITICAL: { color: '#ef4444', label: 'Critical' },
  HIGH:     { color: '#f97316', label: 'High'     },
  MEDIUM:   { color: '#3b82f6', label: 'Medium'   },
  LOW:      { color: '#22c55e', label: 'Low'      },
};

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ─── Metric Card Component ────────────────────────────────────────────────────
const StatCard = ({ title, value, iconColor, bg, sub, icon: SIcon, onClick }) => (
  <Paper
    onClick={onClick}
    sx={{
      p: 2.5, borderRadius: '16px', flex: '1 1 180px', minWidth: '180px',
      background: 'var(--card-bg)', boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
      border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-3px)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
      }
    }}
  >
    <Box sx={{ position: 'absolute', top: -15, right: -15, width: 80, height: 80, borderRadius: '50%', background: bg, opacity: 0.35 }} />
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative' }}>
      <Box sx={{ p: 1.25, borderRadius: '12px', background: bg, color: iconColor, display: 'flex' }}>
        <SIcon sx={{ fontSize: 22 }} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1, fontSize: '1.6rem' }}>
          {value}
        </Typography>
        <Typography variant="body2" sx={{ color: 'var(--text-secondary)', fontWeight: 600, mt: 0.4, fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {title}
        </Typography>
        {sub && (
          <Typography variant="caption" sx={{ color: iconColor, fontWeight: 700, fontSize: '0.7rem', display: 'block', mt: 0.2 }}>
            {sub}
          </Typography>
        )}
      </Box>
    </Box>
  </Paper>
);

// ─── Main ServiceAdminDashboard Component ─────────────────────────────────────
const ServiceAdminDashboard = ({ activeRole: propActiveRole }) => {
  const navigate = useNavigate();
  const { activeRole: authRole } = useAuth();
  const currentRole = propActiveRole || authRole || 'SERVICE_ADMIN';
  const isCSRAdmin = ['CSR_ADMIN', 'CSR ADMIN', 'CSR', 'CSR_ADMINISTRATOR'].includes(currentRole);

  const [memberships, setMemberships]     = useState([]);
  const [selectedSvc, setSelectedSvc]     = useState('ALL');
  const [tickets, setTickets]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  // Fetch admin memberships
  const fetchMemberships = () => {
    setLoading(true);
    API.get('/api/service-desk/services/my-memberships', { withCredentials: true })
      .then(res => {
        const adminSvcs = res.data?.data?.adminOf || [];
        setMemberships(adminSvcs);
        if (adminSvcs.length === 1) {
          setSelectedSvc(adminSvcs[0]._id);
        } else {
          setSelectedSvc('ALL');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMemberships();
  }, []);

  // Fetch tickets for selected service or all administered services
  const fetchTickets = async () => {
    if (memberships.length === 0) return;
    setTicketsLoading(true);
    try {
      if (selectedSvc === 'ALL') {
        const promises = memberships.map(svc =>
          API.get(`/api/service-desk/tickets/service/${svc._id}`, { withCredentials: true })
            .then(r => r.data?.data || [])
            .catch(() => [])
        );
        const results = await Promise.all(promises);
        const combined = results.flat();
        // Remove duplicates if any
        const unique = Array.from(new Map(combined.map(t => [t._id, t])).values());
        setTickets(unique);
      } else {
        const res = await API.get(`/api/service-desk/tickets/service/${selectedSvc}`, { withCredentials: true });
        setTickets(res.data?.data || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard tickets:', err);
    } finally {
      setTicketsLoading(false);
    }
  };

  useEffect(() => {
    if (memberships.length > 0) {
      fetchTickets();
    }
  }, [selectedSvc, memberships]);

  // ─── Computed Statistics ──────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total         = tickets.length;
    const newUnassigned = tickets.filter(t => t.status === 'OPEN').length;
    const assigned      = tickets.filter(t => t.status === 'ASSIGNED').length;
    const inProgress    = tickets.filter(t => t.status === 'IN_PROGRESS').length;
    const resolved      = tickets.filter(t => t.status === 'RESOLVED').length;
    const closed        = tickets.filter(t => t.status === 'CLOSED').length;
    const reopened      = tickets.filter(t => t.status === 'REJECTED').length;

    const now = new Date();
    const slaBreached = tickets.filter(t =>
      t.dueDate && new Date(t.dueDate) < now && !['RESOLVED', 'CLOSED'].includes(t.status)
    ).length;

    return { total, newUnassigned, assigned, inProgress, resolved, closed, reopened, slaBreached };
  }, [tickets]);

  // Donut 1: Complaint Status Breakdown
  const statusChartData = useMemo(() => {
    const counts = {
      OPEN: 0, ASSIGNED: 0, IN_PROGRESS: 0, RESOLVED: 0, CLOSED: 0, REJECTED: 0
    };
    tickets.forEach(t => {
      if (counts[t.status] !== undefined) counts[t.status]++;
    });

    const total = tickets.length || 1;
    return [
      { name: 'New',         count: counts.OPEN,        color: STATUS_META.OPEN.color },
      { name: 'Assigned',    count: counts.ASSIGNED,    color: STATUS_META.ASSIGNED.color },
      { name: 'In Progress', count: counts.IN_PROGRESS, color: STATUS_META.IN_PROGRESS.color },
      { name: 'Resolved',    count: counts.RESOLVED,    color: STATUS_META.RESOLVED.color },
      { name: 'Closed',      count: counts.CLOSED,      color: STATUS_META.CLOSED.color },
      { name: 'Reopened',    count: counts.REJECTED,    color: STATUS_META.REJECTED.color }
    ].map(item => ({
      ...item,
      percent: Number(((item.count / total) * 100).toFixed(1))
    }));
  }, [tickets]);

  // Bar Chart 2: Category-Wise Complaints
  const categoryChartData = useMemo(() => {
    const counts = {};
    tickets.forEach(t => {
      const cat = t.service?.name || t.subcategory || 'General';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const categoryColors = ['#f97316', '#3b82f6', '#22c55e', '#ef4444', '#a855f7', '#eab308', '#06b6d4', '#64748b'];
    return Object.entries(counts).map(([name, count], idx) => ({
      name,
      count,
      color: categoryColors[idx % categoryColors.length]
    }));
  }, [tickets]);

  // Horizontal Bar Chart 3: Top 5 Locations
  const locationChartData = useMemo(() => {
    const counts = {};
    tickets.forEach(t => {
      const loc = t.block?.blockName || t.block?.blockCode || 'Main Campus';
      counts[loc] = (counts[loc] || 0) + 1;
    });

    const sorted = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const colors = ['#f97316', '#3b82f6', '#22c55e', '#ef4444', '#a855f7'];
    return sorted.map((item, idx) => ({ ...item, color: colors[idx % colors.length] }));
  }, [tickets]);

  // Bar Chart 4: Priority-Wise Complaints
  const priorityChartData = useMemo(() => {
    const counts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    tickets.forEach(t => {
      if (counts[t.priority] !== undefined) counts[t.priority]++;
    });

    return [
      { name: 'Low',      count: counts.LOW,      color: PRIORITY_META.LOW.color },
      { name: 'Medium',   count: counts.MEDIUM,   color: PRIORITY_META.MEDIUM.color },
      { name: 'High',     count: counts.HIGH,     color: PRIORITY_META.HIGH.color },
      { name: 'Critical', count: counts.CRITICAL, color: PRIORITY_META.CRITICAL.color }
    ];
  }, [tickets]);

  // Donut 5: SLA Compliance
  const slaChartData = useMemo(() => {
    const now = new Date();
    let onTime = 0;
    let breached = 0;

    tickets.forEach(t => {
      if (t.dueDate && new Date(t.dueDate) < now && !['RESOLVED', 'CLOSED'].includes(t.status)) {
        breached++;
      } else {
        onTime++;
      }
    });

    const total = tickets.length || 1;
    const onTimePercent = Math.round((onTime / total) * 100);
    const breachedPercent = 100 - onTimePercent;

    return {
      onTimePercent,
      data: [
        { name: 'On Time', count: onTime, percent: onTimePercent, color: '#10b981' },
        { name: 'Breached', count: breached, percent: breachedPercent, color: '#ef4444' }
      ]
    };
  }, [tickets]);

  const recentTickets = useMemo(() => {
    return [...tickets].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8);
  }, [tickets]);

  const selectedSvcName = useMemo(() => {
    if (selectedSvc === 'ALL') return 'All Services';
    const svc = memberships.find(s => s._id === selectedSvc);
    return svc?.name || 'Service';
  }, [memberships, selectedSvc]);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={48} sx={{ mb: 3, borderRadius: 2 }} />
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          {[1,2,3,4,5,6,7].map(i => <Skeleton key={i} variant="rectangular" height={90} sx={{ flex: 1, borderRadius: 2 }} />)}
        </Box>
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Skeleton variant="rectangular" height={280} sx={{ flex: 1, borderRadius: 2 }} />
          <Skeleton variant="rectangular" height={280} sx={{ flex: 1, borderRadius: 2 }} />
        </Box>
      </Box>
    );
  }

  if (memberships.length === 0) {
    return (
      <Box sx={{ p: 6, textAlign: 'center', background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', my: 4 }}>
        <ReportProblem sx={{ fontSize: 64, color: '#94a3b8', mb: 2 }} />
        <Typography variant="h5" fontWeight={700} color="var(--text-primary)" mb={1}>
          Service Desk Admin Access Required
        </Typography>
        <Typography variant="body1" color="var(--text-secondary)" maxW={500} mx="auto">
          You are not currently assigned as an Admin for any Service Desk service. Please contact your system administrator to assign service privileges.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', pb: 4 }}>

      {/* ── Header Row ──────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            {isCSRAdmin ? 'Campus-Wide Dashboard' : `${selectedSvcName} Dashboard`}
          </Typography>
          <Typography variant="body1" sx={{ color: 'var(--text-secondary)', mt: 0.5, fontWeight: 500, fontSize: '0.95rem' }}>
            {isCSRAdmin
              ? 'Overview of all service requests and complaints across Aditya University'
              : `Monitoring & Performance Analytics · ${selectedSvcName}`}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          {memberships.length > 1 && (
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <Select
                value={selectedSvc}
                onChange={e => setSelectedSvc(e.target.value)}
                sx={{
                  borderRadius: '10px', fontSize: '0.875rem', fontWeight: 600,
                  background: 'var(--card-bg)', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border-color)' }
                }}
              >
                <MenuItem value="ALL">All Services ({memberships.length})</MenuItem>
                {memberships.map(svc => (
                  <MenuItem key={svc._id} value={svc._id}>
                    {svc.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Tooltip title="Refresh Dashboard">
            <IconButton
              onClick={fetchTickets}
              size="small"
              sx={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                p: 1
              }}
            >
              <Refresh sx={{ fontSize: 20, color: 'var(--text-primary)' }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* ── 7 Key Stat Cards ────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3.5 }}>
        <StatCard
          title="Total Complaints"
          value={ticketsLoading ? '—' : stats.total}
          icon={ConfirmationNumber}
          iconColor="#3b82f6"
          bg="rgba(59,130,246,0.12)"
          onClick={() => navigate('/service-desk/admin/services')}
        />
        <StatCard
          title="New (Unassigned)"
          value={ticketsLoading ? '—' : stats.newUnassigned}
          icon={Schedule}
          iconColor="#0ea5e9"
          bg="rgba(14,165,233,0.12)"
          sub="Needs action"
          onClick={() => navigate('/service-desk/admin/services')}
        />
        <StatCard
          title="Assigned"
          value={ticketsLoading ? '—' : stats.assigned}
          icon={AssignmentInd}
          iconColor="#f97316"
          bg="rgba(249,115,22,0.12)"
          onClick={() => navigate('/service-desk/admin/services')}
        />
        <StatCard
          title="In Progress"
          value={ticketsLoading ? '—' : stats.inProgress}
          icon={AccessTime}
          iconColor="#8b5cf6"
          bg="rgba(139,92,246,0.12)"
          onClick={() => navigate('/service-desk/admin/services')}
        />
        <StatCard
          title="Resolved"
          value={ticketsLoading ? '—' : stats.resolved}
          icon={CheckCircle}
          iconColor="#10b981"
          bg="rgba(16,185,129,0.12)"
          onClick={() => navigate('/service-desk/admin/services')}
        />
        <StatCard
          title="Closed"
          value={ticketsLoading ? '—' : stats.closed}
          icon={Lock}
          iconColor="#0284c7"
          bg="rgba(2,132,199,0.12)"
          onClick={() => navigate('/service-desk/admin/services')}
        />
        <StatCard
          title="SLA Breached"
          value={ticketsLoading ? '—' : stats.slaBreached}
          icon={PriorityHigh}
          iconColor="#ef4444"
          bg="rgba(239,68,68,0.12)"
          sub="Overdue"
          onClick={() => navigate('/service-desk/admin/services')}
        />
      </Box>

      {/* ── Visual Charts Row 1: Status Donut + Category Bar ───────────────── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '5fr 7fr' }, gap: 3, mb: 3 }}>

        {/* Donut Chart: Complaint Status */}
        <Paper sx={{ p: 3, borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
          <Typography variant="h6" fontWeight={700} color="var(--text-primary)" mb={2.5}>
            Complaint Status
          </Typography>

          {ticketsLoading ? (
            <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2 }} />
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
              {/* Donut Pie */}
              <Box sx={{ width: 190, height: 190, position: 'relative', mx: 'auto' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      dataKey="count"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {statusChartData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div style={{ background: '#1e293b', padding: '8px 12px', borderRadius: 8, color: '#fff', fontSize: 12 }}>
                            <strong>{d.name}</strong>: {d.count} ({d.percent}%)
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Center Badge */}
                <Box sx={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)', textAlign: 'center'
                }}>
                  <Typography variant="h5" fontWeight={800} color="var(--text-primary)" lineHeight={1}>
                    {stats.total.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="var(--text-secondary)" fontWeight={600}>
                    Total
                  </Typography>
                </Box>
              </Box>

              {/* Status Breakdown Legend Table */}
              <Stack spacing={1} sx={{ flex: 1, minWidth: 160 }}>
                {statusChartData.map((item, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: item.color, flexShrink: 0 }} />
                      <Typography variant="body2" sx={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {item.name}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                        {item.count}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.72rem', color: 'var(--text-secondary)', minWidth: 36, textAlign: 'right' }}>
                        {item.percent}%
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}
        </Paper>

        {/* Vertical Bar Chart: Category-Wise Complaints */}
        <Paper sx={{ p: 3, borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
          <Typography variant="h6" fontWeight={700} color="var(--text-primary)" mb={2.5}>
            Category-Wise Complaints
          </Typography>

          {ticketsLoading ? (
            <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2 }} />
          ) : categoryChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryChartData} barCategoryGap="25%">
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <RechartsTooltip
                  contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 10, fontSize: 13 }}
                  formatter={(v, n, p) => [v, p.payload.name]}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {categoryChartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 8 }}>
              No categories data available.
            </Typography>
          )}
        </Paper>
      </Box>

      {/* ── Visual Charts Row 2: Top Locations + Priority + SLA ────────────── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '4fr 4fr 4fr' }, gap: 3, mb: 3.5 }}>

        {/* Top 5 Locations (Horizontal Bar Chart) */}
        <Paper sx={{ p: 3, borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
          <Typography variant="h6" fontWeight={700} color="var(--text-primary)" mb={2}>
            Top 5 Locations (by Complaints)
          </Typography>

          {ticketsLoading ? (
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
          ) : locationChartData.length > 0 ? (
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              {locationChartData.map((loc, idx) => {
                const maxCount = locationChartData[0]?.count || 1;
                const widthPct = Math.max(15, Math.round((loc.count / maxCount) * 100));
                return (
                  <Box key={idx}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" fontWeight={600} color="var(--text-primary)" sx={{ fontSize: '0.8rem' }}>
                        {loc.name}
                      </Typography>
                      <Typography variant="body2" fontWeight={700} color="var(--text-primary)" sx={{ fontSize: '0.8rem' }}>
                        {loc.count}
                      </Typography>
                    </Box>
                    <Box sx={{ width: '100%', height: 10, bgcolor: 'var(--bg-accent-1)', borderRadius: 5, overflow: 'hidden' }}>
                      <Box sx={{ width: `${widthPct}%`, height: '100%', bgcolor: loc.color, borderRadius: 5, transition: 'width 0.5s' }} />
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          ) : (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 6 }}>
              No location data found.
            </Typography>
          )}
        </Paper>

        {/* Priority-Wise Complaints */}
        <Paper sx={{ p: 3, borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
          <Typography variant="h6" fontWeight={700} color="var(--text-primary)" mb={2.5}>
            Priority-Wise Complaints
          </Typography>

          {ticketsLoading ? (
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={priorityChartData} barCategoryGap="30%">
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <RechartsTooltip
                  contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 10, fontSize: 13 }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {priorityChartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Paper>

        {/* SLA Compliance (Donut) */}
        <Paper sx={{ p: 3, borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
          <Typography variant="h6" fontWeight={700} color="var(--text-primary)" mb={2}>
            SLA Compliance
          </Typography>

          {ticketsLoading ? (
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ width: 150, height: 150, position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={slaChartData.data}
                      dataKey="count"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {slaChartData.data.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                <Box sx={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)', textAlign: 'center'
                }}>
                  <Typography variant="h6" fontWeight={800} color="var(--text-primary)" lineHeight={1}>
                    {slaChartData.onTimePercent}%
                  </Typography>
                  <Typography variant="caption" color="var(--text-secondary)" fontWeight={600} sx={{ fontSize: '0.65rem' }}>
                    On Time
                  </Typography>
                </Box>
              </Box>

              <Stack direction="row" spacing={3} sx={{ mt: 1.5 }}>
                {slaChartData.data.map((item, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: item.color }} />
                    <Box>
                      <Typography variant="body2" fontWeight={700} color="var(--text-primary)" sx={{ fontSize: '0.8rem', lineHeight: 1 }}>
                        {item.name}
                      </Typography>
                      <Typography variant="caption" color="var(--text-secondary)" sx={{ fontSize: '0.7rem' }}>
                        {item.count} ({item.percent}%)
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}
        </Paper>
      </Box>

      {/* ── Recent Tickets Data Table ────────────────────────────────────── */}
      <Paper sx={{ p: 3, borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
          <Box>
            <Typography variant="h6" fontWeight={700} color="var(--text-primary)">
              Recent Complaints
            </Typography>
            <Typography variant="body2" color="var(--text-secondary)" sx={{ fontSize: '0.8rem' }}>
              Latest service requests and ticket updates
            </Typography>
          </Box>
          <Chip
            label="Manage All Tickets →"
            size="small"
            onClick={() => navigate('/service-desk/admin/services')}
            sx={{ cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem', bgcolor: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: 'none', px: 1 }}
          />
        </Box>

        {ticketsLoading ? (
          <Stack spacing={1.5}>
            {[1,2,3,4].map(i => <Skeleton key={i} height={48} sx={{ borderRadius: 2 }} />)}
          </Stack>
        ) : recentTickets.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No recent tickets found.
          </Typography>
        ) : (
          <TableContainer sx={{ borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <Table size="medium">
              <TableHead sx={{ background: 'var(--gradient-primary)' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#fff', py: 1.5 }}>Ticket ID</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#fff', py: 1.5 }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#fff', py: 1.5 }}>Category / Service</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#fff', py: 1.5 }}>Location / Block</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#fff', py: 1.5 }} align="center">Priority</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#fff', py: 1.5 }} align="center">Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#fff', py: 1.5 }}>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentTickets.map((t) => {
                  const sm = STATUS_META[t.status] || { label: t.status, color: '#64748b', bg: '#f1f5f9' };
                  const pm = PRIORITY_META[t.priority] || { label: t.priority, color: '#64748b' };
                  return (
                    <TableRow
                      key={t._id}
                      hover
                      onClick={() => navigate(`/service-desk/ticket/${t._id}`)}
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'var(--bg-accent-1)' }, transition: 'background 0.15s' }}
                    >
                      <TableCell sx={{ fontWeight: 700, color: '#3b82f6', fontFamily: 'monospace', fontSize: '0.82rem', py: 1.5 }}>
                        #{t.ticketNumber}
                      </TableCell>
                      <TableCell sx={{ color: 'var(--text-primary)', fontWeight: 600, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', py: 1.5 }}>
                        {t.title}
                      </TableCell>
                      <TableCell sx={{ color: 'var(--text-secondary)', fontSize: '0.82rem', py: 1.5 }}>
                        {t.service?.name || t.subcategory || 'General'}
                      </TableCell>
                      <TableCell sx={{ color: 'var(--text-secondary)', fontSize: '0.82rem', py: 1.5 }}>
                        {t.block?.blockName || t.block?.blockCode || 'Main Campus'}
                      </TableCell>
                      <TableCell align="center" sx={{ py: 1.5 }}>
                        <Chip
                          label={pm.label}
                          size="small"
                          sx={{ bgcolor: `${pm.color}18`, color: pm.color, fontWeight: 700, fontSize: '0.7rem', height: 22 }}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ py: 1.5 }}>
                        <Chip
                          label={sm.shortLabel || sm.label}
                          size="small"
                          sx={{ bgcolor: sm.bg, color: sm.color, fontWeight: 700, fontSize: '0.7rem', height: 22 }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: 'var(--text-secondary)', fontSize: '0.82rem', whiteSpace: 'nowrap', py: 1.5 }}>
                        {formatDate(t.createdAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default ServiceAdminDashboard;
