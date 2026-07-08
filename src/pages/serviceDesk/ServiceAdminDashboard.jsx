import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Paper, Chip, Avatar, Stack, Divider,
  MenuItem, Select, FormControl, Skeleton, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import {
  ConfirmationNumber, AssignmentTurnedIn, CheckCircle,
  PriorityHigh, ArrowForward, Group, ReportProblem,
  AccessTime, Schedule
} from '@mui/icons-material';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip as RechartsTooltip, Cell, PieChart, Pie, Legend
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import PageHeader from '../../components/common/PageHeader';

// ─── Status / Priority helpers ─────────────────────────────────────────────
const STATUS_META = {
  OPEN:        { label: 'Open',        color: '#3b82f6', bg: 'rgba(59,130,246,0.1)'  },
  ASSIGNED:    { label: 'Assigned',    color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  IN_PROGRESS: { label: 'In Progress', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  RESOLVED:    { label: 'Resolved',    color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  CLOSED:      { label: 'Closed',      color: '#6b7280', bg: 'rgba(107,114,128,0.1)'},
  REJECTED:    { label: 'Rejected',    color: '#ef4444', bg: 'rgba(239,68,68,0.1)'  },
};

const PRIORITY_META = {
  CRITICAL: { color: '#ef4444', label: 'Critical' },
  HIGH:     { color: '#f97316', label: 'High'     },
  MEDIUM:   { color: '#f59e0b', label: 'Medium'   },
  LOW:      { color: '#22c55e', label: 'Low'      },
};

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ─── Stat Card ────────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
const StatCard = ({ title, value, iconColor, bg, sub, icon: SIcon }) => (
  <Paper sx={{
    p: 3, borderRadius: '16px', flex: '1 1 200px', minWidth: 0,
    background: 'var(--card-bg)', boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
    border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden',
    transition: 'transform .2s', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 6px 24px rgba(0,0,0,0.1)' }
  }}>
    <Box sx={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: bg, opacity: 0.35 }} />
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative' }}>
      <Box sx={{ p: 1.5, borderRadius: '12px', background: bg, color: iconColor, display: 'flex' }}>
        <SIcon sx={{ fontSize: 24 }} />
      </Box>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</Typography>
        <Typography variant="body2" sx={{ color: 'var(--text-secondary)', fontWeight: 500, mt: 0.3 }}>{title}</Typography>
        {sub && <Typography variant="caption" sx={{ color: iconColor, fontWeight: 600 }}>{sub}</Typography>}
      </Box>
    </Box>
  </Paper>
);

// ─── Main Component ────────────────────────────────────────────────────────
const ServiceAdminDashboard = () => {
  const navigate = useNavigate();
  const [memberships, setMemberships]   = useState([]);
  const [selectedSvc, setSelectedSvc]   = useState('');
  const [tickets, setTickets]           = useState([]);
  const [team, setTeam]                 = useState([]);
  const [loading, setLoading]           = useState(true);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  // Fetch services this admin manages
  useEffect(() => {
    API.get('/api/service-desk/services/my-memberships', { withCredentials: true })
      .then(res => {
        const adminSvcs = res.data?.data?.adminOf || [];
        // adminSvcs is an array of service objects { _id, name, ... }
        setMemberships(adminSvcs);
        if (adminSvcs.length > 0) setSelectedSvc(adminSvcs[0]._id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Fetch tickets + team whenever service changes
  useEffect(() => {
    if (!selectedSvc) return;
    let active = true;
    const load = async () => {
      setTicketsLoading(true);
      try {
        const [tRes, eRes] = await Promise.all([
          API.get(`/api/service-desk/tickets/service/${selectedSvc}`, { withCredentials: true }),
          API.get(`/api/service-desk/services/${selectedSvc}/emps`, { withCredentials: true })
        ]);
        if (active) {
          setTickets(tRes.data?.data || []);
          setTeam(eRes.data?.data || []);
        }
      } catch (err) { console.error('Dashboard fetch error', err); }
      if (active) setTicketsLoading(false);
    };
    load();
    return () => { active = false; };
  }, [selectedSvc]);

  // ─── Derived stats ──────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total      = tickets.length;
    const open       = tickets.filter(t => t.status === 'OPEN').length;
    const inProgress = tickets.filter(t => ['ASSIGNED', 'IN_PROGRESS'].includes(t.status)).length;
    const resolved   = tickets.filter(t => t.status === 'RESOLVED').length;
    const closed     = tickets.filter(t => t.status === 'CLOSED').length;
    const critical   = tickets.filter(t => ['CRITICAL', 'HIGH'].includes(t.priority)).length;
    return { total, open, inProgress, resolved, closed, critical };
  }, [tickets]);

  const statusChartData = useMemo(() => (
    Object.entries(
      tickets.reduce((acc, t) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc; }, {})
    ).map(([status, count]) => ({
      name: STATUS_META[status]?.label || status, count, color: STATUS_META[status]?.color || '#64748b'
    }))
  ), [tickets]);

  const priorityChartData = useMemo(() => (
    Object.entries(
      tickets.reduce((acc, t) => { acc[t.priority] = (acc[t.priority] || 0) + 1; return acc; }, {})
    ).map(([priority, count]) => ({
      name: PRIORITY_META[priority]?.label || priority, count, color: PRIORITY_META[priority]?.color || '#64748b'
    }))
  ), [tickets]);

  const recentTickets = useMemo(() => (
    [...tickets].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6)
  ), [tickets]);

  const selectedSvcName = useMemo(() => {
    const svc = memberships.find(s => s._id === selectedSvc);
    return svc?.name || 'Service';
  }, [memberships, selectedSvc]);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={48} sx={{ mb: 3, borderRadius: 2 }} />
        <Box sx={{ display: 'flex', gap: 2 }}>
          {[1,2,3,4].map(i => <Skeleton key={i} variant="rectangular" height={100} sx={{ flex: 1, borderRadius: 2 }} />)}
        </Box>
      </Box>
    );
  }

  if (memberships.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <ReportProblem sx={{ fontSize: 64, color: '#94a3b8', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">You are not assigned as an admin to any service yet.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <PageHeader title="Service Admin Dashboard" subtitle={`Monitoring · ${selectedSvcName}`} />
        {memberships.length > 1 && (
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <Select
              value={selectedSvc}
              onChange={e => setSelectedSvc(e.target.value)}
              sx={{ borderRadius: '10px', fontSize: '0.875rem', fontWeight: 600,
                    background: 'var(--card-bg)', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border-color)' } }}
            >
              {memberships.map(svc => (
                <MenuItem key={svc._id} value={svc._id}>
                  {svc.name || 'Unknown Service'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      {/* ── Stat Cards ─────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <StatCard title="Total Tickets"  value={ticketsLoading ? '—' : stats.total}      icon={ConfirmationNumber} iconColor="#3b82f6" bg="rgba(59,130,246,0.12)" />
        <StatCard title="Open / Awaiting" value={ticketsLoading ? '—' : stats.open}      icon={Schedule}          iconColor="#f59e0b" bg="rgba(245,158,11,0.12)" sub="Need assignment" />
        <StatCard title="In Progress"    value={ticketsLoading ? '—' : stats.inProgress}  icon={AccessTime}        iconColor="#8b5cf6" bg="rgba(139,92,246,0.12)" />
        <StatCard title="Resolved"       value={ticketsLoading ? '—' : stats.resolved + stats.closed} icon={CheckCircle} iconColor="#10b981" bg="rgba(16,185,129,0.12)" sub="Resolved + Closed" />
        <StatCard title="High Priority"  value={ticketsLoading ? '—' : stats.critical}   icon={PriorityHigh}      iconColor="#ef4444" bg="rgba(239,68,68,0.12)"   sub="Critical + High" />
        <StatCard title="Team Members"   value={team.length}                              icon={Group}             iconColor="#0ea5e9" bg="rgba(14,165,233,0.12)" />
      </Box>

      {/* ── Charts Row ─────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
        {/* Status Bar Chart */}
        <Paper sx={{ flex: '1 1 340px', p: 3, borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <Typography variant="subtitle1" fontWeight={700} mb={3} color="var(--text-primary)">Tickets by Status</Typography>
          {ticketsLoading ? <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} /> : (
            statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={statusChartData} barCategoryGap="30%">
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <RechartsTooltip
                    contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 10, fontSize: 13 }}
                    formatter={(v, n, p) => [v, p.payload.name]}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {statusChartData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <Typography color="text.secondary" sx={{ textAlign: 'center', py: 6 }}>No tickets yet.</Typography>
          )}
        </Paper>

        {/* Priority Pie Chart */}
        <Paper sx={{ flex: '1 1 280px', p: 3, borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <Typography variant="subtitle1" fontWeight={700} mb={3} color="var(--text-primary)">Tickets by Priority</Typography>
          {ticketsLoading ? <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} /> : (
            priorityChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={priorityChartData}
                    dataKey="count"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {priorityChartData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                  </Pie>
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div style={{ background: '#1e293b', border: 'none', borderRadius: 10, padding: '8px 14px', boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                            <span style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 600 }}>{d.name}</span>
                          </div>
                          <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4, paddingLeft: 18 }}>Count: <strong style={{ color: '#fff' }}>{d.count}</strong></div>
                        </div>
                      );
                    }}
                  />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <Typography color="text.secondary" sx={{ textAlign: 'center', py: 6 }}>No tickets yet.</Typography>
          )}
        </Paper>
      </Box>

      {/* ── Recent Tickets ─────────────────────────────────────────── */}
      <Paper sx={{ p: 3, borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
          <Typography variant="subtitle1" fontWeight={700} color="var(--text-primary)">Recent Tickets</Typography>
          <Chip
            label="View All →"
            size="small"
            onClick={() => navigate('/service-desk/admin/services')}
            sx={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem', bgcolor: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: 'none' }}
          />
        </Box>

        {ticketsLoading ? (
          <Stack spacing={1.5}>{[1,2,3].map(i => <Skeleton key={i} height={52} sx={{ borderRadius: 2 }} />)}</Stack>
        ) : recentTickets.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>No tickets found for this service.</Typography>
        ) : (
          <TableContainer sx={{ borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <Table size="medium">
              <TableHead sx={{ background: 'var(--gradient-primary)' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#fff', py: 1.5 }}>Ticket #</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#fff', py: 1.5 }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#fff', py: 1.5 }}>Raised By</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#fff', py: 1.5 }} align="center">Priority</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#fff', py: 1.5 }} align="center">Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#fff', py: 1.5 }}>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentTickets.map((t) => {
                  const sm = STATUS_META[t.status] || {};
                  const pm = PRIORITY_META[t.priority] || {};
                  return (
                    <TableRow
                      key={t._id}
                      hover
                      onClick={() => navigate(`/service-desk/ticket/${t._id}`)}
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'var(--bg-accent-1)' }, transition: 'background .15s' }}
                    >
                      <TableCell sx={{ fontWeight: 700, color: '#3b82f6', fontFamily: 'monospace', fontSize: '0.82rem', py: 1.5 }}>{t.ticketNumber}</TableCell>
                      <TableCell sx={{ color: 'var(--text-primary)', fontWeight: 500, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', py: 1.5 }}>{t.title}</TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 26, height: 26, fontSize: '0.65rem', bgcolor: '#3b82f6' }}>{t.createdBy?.name?.[0] || '?'}</Avatar>
                          <Typography variant="body2" sx={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{t.createdBy?.name || '—'}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center" sx={{ py: 1.5 }}>
                        <Chip label={pm.label || t.priority} size="small" sx={{ bgcolor: `${pm.color}18`, color: pm.color, fontWeight: 700, fontSize: '0.7rem', height: 22 }} />
                      </TableCell>
                      <TableCell align="center" sx={{ py: 1.5 }}>
                        <Chip label={sm.label || t.status} size="small" sx={{ bgcolor: sm.bg, color: sm.color, fontWeight: 700, fontSize: '0.7rem', height: 22 }} />
                      </TableCell>
                      <TableCell sx={{ color: 'var(--text-secondary)', fontSize: '0.82rem', whiteSpace: 'nowrap', py: 1.5 }}>{formatDate(t.createdAt)}</TableCell>
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
