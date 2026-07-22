import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Paper, Chip, Avatar, Stack, Skeleton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button
} from '@mui/material';
import {
  AssignmentInd, CheckCircle, HourglassTop, ReportProblem,
  PriorityHigh, TrendingUp, ArrowForward
} from '@mui/icons-material';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import PageHeader from '../../components/common/PageHeader';

// ─── Helpers ───────────────────────────────────────────────────────────────
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

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const getUrgencyColor = (priority) =>
  priority === 'CRITICAL' ? '#ef4444' : priority === 'HIGH' ? '#f97316' : '#f59e0b';

// ─── Stat Card ────────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
const StatCard = ({ title, value, iconColor, bg, sub, icon: SIcon, gradient, linkText, onClick }) => (
  <Paper sx={{
    position: "relative",
    borderRadius: "16px",
    background: "var(--bg-panel)",
    border: "1px solid var(--border-color)",
    boxShadow: "var(--shadow-premium)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    overflow: "hidden",
    "&:hover": {
      transform: "translateY(-5px)",
      boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
    },
    height: "100%",
    minHeight: "175px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    p: 2.5,
    flex: '1 1 200px', 
    minWidth: 0,
    "&::after": {
      content: '""',
      position: "absolute",
      top: 0,
      right: 0,
      width: "120px",
      height: "120px",
      background: `radial-gradient(circle at top right, ${iconColor}25, transparent 70%)`,
      zIndex: 0
    }
  }}>
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, position: "relative", zIndex: 1 }}>
      <Box
        sx={{
          width: 52,
          height: 52,
          borderRadius: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: gradient || iconColor,
          color: "#fff",
          position: "relative",
          overflow: "hidden",
          flexShrink: 0,
          boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
          "&::after": {
            content: '""',
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, #ffffff30, transparent)",
            borderRadius: 1,
          },
        }}
      >
        <SIcon sx={{ fontSize: "medium" }} />
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.3, minWidth: 0, flex: 1 }}>
        <Typography
          variant="body2"
          sx={{
            color: "var(--text-secondary)",
            fontWeight: 600,
            fontSize: "0.75rem",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            color: "var(--text-primary)",
            mt: 0.5,
            fontSize: typeof value === "string" && value.length > 8 ? "1.5rem" : "2.125rem"
          }}
        >
          {value}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: "var(--text-secondary)", opacity: 0.7 }}
        >
          {sub || '\u00A0'}
        </Typography>
      </Box>
    </Box>
    {linkText && (
      <Box
        sx={{
          mt: 3,
          pt: 2,
          borderTop: "1px solid var(--border-color)",
          display: "flex",
          justifyContent: "flex-end",
          position: "relative", zIndex: 1
        }}
      >
        <Button
          size="small"
          endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            color: "var(--color-primary)",
            "&:hover": {
              background: "transparent",
              textDecoration: "underline",
            },
          }}
          onClick={onClick}
        >
          {linkText}
        </Button>
      </Box>
    )}
  </Paper>
);

// ─── Main Component ────────────────────────────────────────────────────────
const ServiceEmpDashboard = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/api/service-desk/tickets/assigned-to-me', { withCredentials: true })
      .then(res => setTickets(res.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ─── Derived stats ──────────────────────────────────────────────────────
  const activeTickets   = useMemo(() => tickets.filter(t => !['RESOLVED', 'CLOSED', 'REJECTED'].includes(t.status)), [tickets]);
  const resolvedTickets = useMemo(() => tickets.filter(t => ['RESOLVED', 'CLOSED'].includes(t.status)), [tickets]);
  const inProgress      = useMemo(() => tickets.filter(t => t.status === 'IN_PROGRESS'), [tickets]);
  const urgent          = useMemo(() => activeTickets.filter(t => ['CRITICAL', 'HIGH'].includes(t.priority)), [activeTickets]);

  const priorityChartData = useMemo(() => (
    Object.entries(
      activeTickets.reduce((acc, t) => { acc[t.priority] = (acc[t.priority] || 0) + 1; return acc; }, {})
    ).map(([p, c]) => ({ name: PRIORITY_META[p]?.label || p, count: c, color: PRIORITY_META[p]?.color || '#64748b' }))
  ), [activeTickets]);

  const serviceChartData = useMemo(() => (
    Object.entries(
      activeTickets.reduce((acc, t) => {
        const svc = t.service?.name || 'Unknown';
        acc[svc] = (acc[svc] || 0) + 1;
        return acc;
      }, {})
    ).map(([name, count]) => ({ name, count }))
  ), [activeTickets]);

  const sortedActiveTickets = useMemo(() => {
    const order = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    return [...activeTickets].sort((a, b) => order.indexOf(a.priority) - order.indexOf(b.priority));
  }, [activeTickets]);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={48} sx={{ mb: 3, borderRadius: 2 }} />
        <Box sx={{ display: 'flex', gap: 2 }}>
          {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="rectangular" height={100} sx={{ flex: 1, borderRadius: 2 }} />)}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <Box sx={{ mb: 3 }}>
        <PageHeader title="My Work Dashboard" subtitle="Your assigned tasks and activity overview" showBack={false} />
      </Box>

      {/* ── Stat Cards ─────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <StatCard title="Total Assigned"   value={tickets.length}          icon={AssignmentInd} iconColor="#3b82f6" bg="rgba(59,130,246,0.12)" gradient="linear-gradient(135deg, #3B82F6, #2563EB)" linkText="View Tasks" onClick={() => navigate('/service-desk/assigned-to-me')} />
        <StatCard title="Active Tasks"     value={activeTickets.length}    icon={HourglassTop}  iconColor="#f59e0b" bg="rgba(245,158,11,0.12)" gradient="linear-gradient(135deg, #F59E0B, #D97706)" sub="Need action" linkText="View Tasks" onClick={() => navigate('/service-desk/assigned-to-me')} />
        <StatCard title="In Progress"      value={inProgress.length}       icon={TrendingUp}    iconColor="#8b5cf6" bg="rgba(139,92,246,0.12)" gradient="linear-gradient(135deg, #8B5CF6, #6D28D9)" linkText="View Tasks" onClick={() => navigate('/service-desk/assigned-to-me')} />
        <StatCard title="Resolved by Me"   value={resolvedTickets.length}  icon={CheckCircle}   iconColor="#10b981" bg="rgba(16,185,129,0.12)" gradient="linear-gradient(135deg, #10B981, #059669)" linkText="View Tasks" onClick={() => navigate('/service-desk/assigned-to-me')} />
        <StatCard title="Urgent Tasks"     value={urgent.length}           icon={PriorityHigh}  iconColor="#ef4444" bg="rgba(239,68,68,0.12)" gradient="linear-gradient(135deg, #EF4444, #DC2626)" sub="Critical + High" linkText="View Tasks" onClick={() => navigate('/service-desk/assigned-to-me')} />
      </Box>

      {/* ── Charts Row ─────────────────────────────────────────────── */}
      {activeTickets.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
          {/* Priority Donut */}
          <Paper sx={{ flex: '1 1 260px', p: 3, borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <Typography variant="subtitle1" fontWeight={700} mb={2} color="var(--text-primary)">Active Tasks by Priority</Typography>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                data={priorityChartData}
                dataKey="count"
                innerRadius={55}
                outerRadius={85}
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
          </Paper>

          {/* Service Bar */}
          {serviceChartData.length > 1 && (
            <Paper sx={{ flex: '1 1 300px', p: 3, borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              <Typography variant="subtitle1" fontWeight={700} mb={2} color="var(--text-primary)">Tasks by Service</Typography>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={serviceChartData} barCategoryGap="35%">
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <RechartsTooltip
                    contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 10, fontSize: 13 }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          )}
        </Box>
      )}

      {/* ── Active Tasks Table ─────────────────────────────────────── */}
      <Paper sx={{ p: 3, borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
          <Typography variant="subtitle1" fontWeight={700} color="var(--text-primary)">My Active Tasks</Typography>
          <Chip
            label="All Assigned →"
            size="small"
            onClick={() => navigate('/service-desk/assigned-to-me')}
            sx={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem', bgcolor: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}
          />
        </Box>

        {sortedActiveTickets.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <CheckCircle sx={{ fontSize: 56, color: '#10b981', mb: 1.5 }} />
            <Typography variant="h6" fontWeight={700} color="var(--text-primary)">All caught up!</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>You have no active tasks right now. Great work!</Typography>
          </Box>
        ) : (
          <TableContainer sx={{ borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <Table size="medium">
              <TableHead sx={{ background: 'var(--gradient-primary)' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#fff', py: 1.5 }}>Ticket #</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#fff', py: 1.5 }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#fff', py: 1.5 }}>Service</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#fff', py: 1.5 }} align="center">Priority</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#fff', py: 1.5 }} align="center">Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#fff', py: 1.5 }}>Raised On</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedActiveTickets.slice(0, 10).map((t) => {
                  const sm = STATUS_META[t.status] || {};
                  const pm = PRIORITY_META[t.priority] || {};
                  const isUrgent = ['CRITICAL', 'HIGH'].includes(t.priority);
                  return (
                    <TableRow
                      key={t._id}
                      hover
                      onClick={() => navigate(`/service-desk/ticket/${t._id}`)}
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'var(--bg-accent-1)' }, transition: 'background .15s' }}
                    >
                      <TableCell sx={{ py: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {isUrgent && <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: getUrgencyColor(t.priority), flexShrink: 0 }} />}
                          <Typography sx={{ fontWeight: 700, color: '#3b82f6', fontFamily: 'monospace', fontSize: '0.82rem' }}>{t.ticketNumber}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: 'var(--text-primary)', fontWeight: 500, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', py: 1.5 }}>{t.title}</TableCell>
                      <TableCell sx={{ color: 'var(--text-secondary)', fontSize: '0.82rem', py: 1.5 }}>{t.service?.name || '—'}</TableCell>
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

export default ServiceEmpDashboard;
