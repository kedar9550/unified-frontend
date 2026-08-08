import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  People as PeopleIcon,
  Groups as GroupsIcon,
  Hotel as HotelIcon,
  School as SchoolIcon,
  CurrencyRupee as CurrencyRupeeIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts';
import PageHeader from '../../components/common/PageHeader';
import API from '../../api/axios';
import { toast } from 'sonner';

/* ─── Colour palettes ──────────────────────────────────────────────────────── */
const DEPT_BAR_COLORS = { teams: '#0d9488', students: '#f59e0b' };
const YEAR_COLORS = ['#16a34a', '#f59e0b', '#1d4ed8', '#06b6d4'];
const GENDER_PIE = ['#4ade80', '#3b82f6', '#f97316'];
const ACCOMM_PIE = ['#06b6d4', '#a855f7', '#ef4444'];
const CAMPUS_GENDER_COLORS = { Male: '#ef4444', Female: '#1d4ed8', Others: '#f59e0b' };
const CAMPUS_COUNT_COLORS = ['#16a34a', '#f59e0b', '#1d4ed8'];
const REVENUE_COLOR = '#7c3aed';

/* ─── Helpers ───────────────────────────────────────────────────────────────  */
const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

const SummaryCard = ({ label, value, color, icon }) => (
  <Paper
    variant="outlined"
    sx={{
      p: 2.5,
      borderRadius: '16px',
      borderColor: `${color}33`,
      background: `linear-gradient(135deg, ${color}12 0%, ${color}06 100%)`,
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: '12px',
          background: color,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, fontSize: '0.68rem' }}>
          {label}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
          {fmt(value)}
        </Typography>
      </Box>
    </Box>
  </Paper>
);

const SectionTitle = ({ children }) => (
  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5, color: 'var(--text-primary)' }}>
    {children}
  </Typography>
);

/* ─── Main Component ─────────────────────────────────────────────────────── */
const StudentEventAdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState('ALL');

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/razorpay/stats');
      setStats(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  /* ── Derived chart data ───────────────────────────────────────────────── */
  const deptBarData = useMemo(() => {
    if (!stats?.departmentStats) return [];
    const filtered =
      deptFilter === 'ALL'
        ? stats.departmentStats
        : stats.departmentStats.filter((d) => d.dept === deptFilter);
    return filtered.map((d) => ({
      name: d.dept,
      'Teams count': d.teamCount,
      'Student count': d.studentCount,
    }));
  }, [stats, deptFilter]);

  const deptTeamBarData = useMemo(() => {
    if (!stats?.departmentStats) return [];
    return stats.departmentStats.map((d) => ({ name: d.dept, 'Team count': d.teamCount }));
  }, [stats]);

  const campusYearData = useMemo(() => {
    if (!stats?.campusWise) return [];
    return Object.entries(stats.campusWise).map(([campus, data]) => ({
      name: campus,
      'I-Years': data.I,
      'II-Years': data.II,
      'III-Years': data.III,
      'IV-Years': data.IV,
    }));
  }, [stats]);

  const genderPieData = useMemo(() => {
    if (!stats?.genderStats) return [];
    return Object.entries(stats.genderStats).map(([key, val]) => ({ name: key, value: val }));
  }, [stats]);

  const accommPieData = useMemo(() => {
    if (!stats?.accommodation) return [];
    const { genderBreakdown } = stats.accommodation;
    return Object.entries(genderBreakdown).map(([key, val]) => ({ name: key, value: val }));
  }, [stats]);

  const campusGenderLineData = useMemo(() => {
    if (!stats?.campusGenderStats) return [];
    return Object.entries(stats.campusGenderStats).map(([campus, g]) => ({
      campus,
      Male: g.male,
      Female: g.female,
      Others: g.others,
    }));
  }, [stats]);

  const campusCountPieData = useMemo(() => {
    if (!stats?.campusWise) return [];
    return Object.entries(stats.campusWise).map(([campus, data]) => ({
      name: campus,
      value: data.total,
    }));
  }, [stats]);

  const deptOptions = useMemo(
    () => ['ALL', ...(stats?.departmentStats?.map((d) => d.dept) || [])],
    [stats]
  );

  const revenueByDateData = useMemo(
    () => (stats?.revenue?.byDate || []).map((d) => ({ date: d.date, '₹ Revenue': d.revenue })),
    [stats]
  );

  const revenueByEventData = useMemo(
    () => (stats?.revenue?.byEvent || []).slice(0, 10).map((d) => ({ event: d.event, '₹ Revenue': d.revenue, Teams: d.teams })),
    [stats]
  );

  const revenueByDeptData = useMemo(
    () => (stats?.departmentStats || []).map((d) => ({ name: d.dept, '₹ Revenue': d.revenue })).sort((a, b) => b['₹ Revenue'] - a['₹ Revenue']),
    [stats]
  );

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <PageHeader title="Veda Event Admin Dashboard" subtitle="Loading event analytics..." />
        <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
          <CircularProgress size={32} />
        </Box>
      </Box>
    );
  }

  const yearLabels = ['First Years', 'Second Years', 'Third Years', 'Fourth Years'];
  const yearKeys = ['1', '2', '3', '4'];

  return (
    <Box sx={{ p: { xs: 1.5, md: 3, lg: 4 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <PageHeader
        title="Veda Event Admin Dashboard"
        subtitle="Overview of VEDA event participation and registration analytics"
      />

      {/* ── Summary Cards ─────────────────────────────────────────────── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, 1fr)' }, gap: 2 }}>
        <SummaryCard label="Total Teams" value={stats?.totalTeams} color="#0d9488" icon={<GroupsIcon />} />
        <SummaryCard label="Total Students" value={stats?.totalStudents} color="#2563eb" icon={<PeopleIcon />} />
        <SummaryCard label="Total Attended" value={stats?.totalAttended} color="#16a34a" icon={<PeopleIcon />} />
        <SummaryCard label="Total Revenue (₹)" value={stats?.revenue?.total} color="#7c3aed" icon={<CurrencyRupeeIcon />} />
        <SummaryCard label="Accommodation Needed" value={stats?.accommodation?.yes} color="#d97706" icon={<HotelIcon />} />
        <SummaryCard label="Accom. Checked In" value={stats?.accommodation?.checkedIn} color="#059669" icon={<HotelIcon />} />
        <SummaryCard label="Departments" value={stats?.departmentStats?.length} color="#9333ea" icon={<SchoolIcon />} />
      </Box>

      {/* ── Section 1: Dept filter + Teams & Students per Dept ───────── */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: '16px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <SectionTitle>Teams & Students Count by Department</SectionTitle>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Choose Department</InputLabel>
            <Select value={deptFilter} label="Choose Department" onChange={(e) => setDeptFilter(e.target.value)}>
              {deptOptions.map((d) => (
                <MenuItem key={d} value={d}>{d}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={deptBarData} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-30} textAnchor="end" tick={{ fontSize: 11 }} interval={0} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: 8 }} />
            <Bar dataKey="Teams count" fill={DEPT_BAR_COLORS.teams} radius={[4, 4, 0, 0]} />
            <Bar dataKey="Student count" fill={DEPT_BAR_COLORS.students} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <Box sx={{ mt: 1, textAlign: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            Team count : {fmt(stats?.totalTeams)}&nbsp;&nbsp;&nbsp;Student count : {fmt(stats?.totalStudents)}
          </Typography>
        </Box>
      </Paper>

      {/* ── Section 2: Year cards + Campus-wise Years ─────────────────── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '280px 1fr' }, gap: 2 }}>
        {/* Year cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, alignContent: 'start' }}>
          {yearKeys.map((yr, idx) => (
            <Paper
              key={yr}
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: '14px',
                borderColor: `${YEAR_COLORS[idx]}55`,
                background: `linear-gradient(135deg, ${YEAR_COLORS[idx]}15 0%, ${YEAR_COLORS[idx]}08 100%)`,
              }}
            >
              <Box
                sx={{
                  display: 'inline-block',
                  px: 1.5,
                  py: 0.4,
                  borderRadius: '8px',
                  background: YEAR_COLORS[idx],
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  mb: 0.8,
                }}
              >
                {yearLabels[idx]}
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a' }}>
                {fmt(stats?.yearCounts?.[yr])}
              </Typography>
            </Paper>
          ))}
        </Box>

        {/* Campus-wise years bar */}
        <Paper variant="outlined" sx={{ p: 3, borderRadius: '16px' }}>
          <SectionTitle>Campus wise Years</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={campusYearData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="I-Years" fill={YEAR_COLORS[0]} radius={[4, 4, 0, 0]} />
              <Bar dataKey="II-Years" fill={YEAR_COLORS[1]} radius={[4, 4, 0, 0]} />
              <Bar dataKey="III-Years" fill={YEAR_COLORS[2]} radius={[4, 4, 0, 0]} />
              <Bar dataKey="IV-Years" fill={YEAR_COLORS[3]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Box>

      {/* ── Section 3: Department-wise Team count ─────────────────────── */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: '16px' }}>
        <SectionTitle>Department wise Team count</SectionTitle>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={deptTeamBarData} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-30} textAnchor="end" tick={{ fontSize: 11 }} interval={0} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="Team count" fill="#0d9488" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      {/* ── Section 4: Overall Synopsis Table ─────────────────────────── */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: '16px' }}>
        <SectionTitle>Overall Synopsis</SectionTitle>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ background: 'var(--bg-glass, #f8fafc)' }}>
                {['Departments', 'Event Count', 'AUS', 'ACET', 'Other', 'Total Teams Registered', 'Total Students Registered', 'Participated Students'].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {(stats?.departmentStats || []).map((row, idx) => (
                <TableRow key={idx} hover>
                  <TableCell sx={{ fontWeight: 700, color: 'var(--color-primary, #0d9488)' }}>{row.dept}</TableCell>
                  <TableCell>{row.eventCount}</TableCell>
                  <TableCell>{fmt(row.aus)}</TableCell>
                  <TableCell>{fmt(row.acet)}</TableCell>
                  <TableCell>{fmt(row.other)}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'var(--color-primary, #0d9488)' }}>{fmt(row.teamCount)}</TableCell>
                  <TableCell>{fmt(row.studentCount)}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#d97706' }}>{fmt(row.participatedStudents)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Paper>

      {/* ── Section 5: Gender + Accommodation charts ──────────────────── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        {/* Gender Pie */}
        <Paper variant="outlined" sx={{ p: 3, borderRadius: '16px' }}>
          <SectionTitle>Gender Chart</SectionTitle>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={genderPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${(percent * 100).toFixed(1)}%`}>
                {genderPieData.map((_, i) => (
                  <Cell key={i} fill={GENDER_PIE[i % GENDER_PIE.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Paper>

        {/* Accommodation Donut */}
        <Paper variant="outlined" sx={{ p: 3, borderRadius: '16px' }}>
          <SectionTitle>Accommodation YES Chart (by Gender)</SectionTitle>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={accommPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} label={({ name, percent }) => `${(percent * 100).toFixed(1)}%`}>
                {accommPieData.map((_, i) => (
                  <Cell key={i} fill={ACCOMM_PIE[i % ACCOMM_PIE.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      </Box>

      {/* ── Section 6: Campus Wise Gender (line) + Campus Wise Count (pie) */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2 }}>
        {/* Campus gender line */}
        <Paper variant="outlined" sx={{ p: 3, borderRadius: '16px' }}>
          <SectionTitle>Campus Wise Gender</SectionTitle>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={campusGenderLineData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="campus" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              {Object.keys(CAMPUS_GENDER_COLORS).map((key) => (
                <Line key={key} type="monotone" dataKey={key} stroke={CAMPUS_GENDER_COLORS[key]} strokeWidth={2} dot={{ r: 5 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Paper>

        {/* Campus count pie */}
        <Paper variant="outlined" sx={{ p: 3, borderRadius: '16px' }}>
          <SectionTitle>Campus Wise Count</SectionTitle>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={campusCountPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name }) => name}>
                {campusCountPieData.map((_, i) => (
                  <Cell key={i} fill={CAMPUS_COUNT_COLORS[i % CAMPUS_COUNT_COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      </Box>

      {/* ── Section 7: Revenue Charts ─────────────────────────────── */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: '16px', borderColor: `${REVENUE_COLOR}33` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <TrendingUpIcon sx={{ color: REVENUE_COLOR }} />
          <SectionTitle>Revenue Overview</SectionTitle>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          {/* Revenue Trend Line */}
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1.5, color: 'text.secondary' }}>Daily Revenue Trend (₹)</Typography>
            {revenueByDateData.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                <Typography variant="body2">No date-wise revenue data available yet.</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={revenueByDateData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" angle={-30} textAnchor="end" tick={{ fontSize: 10 }} interval={0} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip formatter={(v) => [`₹${v}`, 'Revenue']} />
                  <Line type="monotone" dataKey="₹ Revenue" stroke={REVENUE_COLOR} strokeWidth={2} dot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Box>

          {/* Revenue by Department */}
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1.5, color: 'text.secondary' }}>Revenue by Department (₹)</Typography>
            {revenueByDeptData.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                <Typography variant="body2">No department revenue data available yet.</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={revenueByDeptData} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-30} textAnchor="end" tick={{ fontSize: 10 }} interval={0} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip formatter={(v) => [`₹${v}`, 'Revenue']} />
                  <Bar dataKey="₹ Revenue" fill={REVENUE_COLOR} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Box>
        </Box>

        {/* Revenue by Event */}
        {revenueByEventData.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1.5, color: 'text.secondary' }}>Revenue by Event (₹) — Top 10</Typography>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={revenueByEventData} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="event" angle={-30} textAnchor="end" tick={{ fontSize: 10 }} interval={0} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip formatter={(v, name) => [name === 'Teams' ? v : `₹${v}`, name]} />
                <Legend />
                <Bar dataKey="₹ Revenue" fill={REVENUE_COLOR} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Teams" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default StudentEventAdminDashboard;
