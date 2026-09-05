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
  Tabs,
  Tab,
  Typography,
} from '@mui/material';
import {
  People as PeopleIcon,
  Groups as GroupsIcon,
  School as SchoolIcon,
  Business as BusinessIcon,
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
  LabelList,
} from 'recharts';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import StatCardGrid from '../../components/common/StatCardGrid';
import API from '../../api/axios';
import { toast } from 'sonner';

/* ─── Colour palettes ──────────────────────────────────────────────────────── */
const DEPT_BAR_COLORS = { teams: '#0d9488', students: '#f59e0b', events: '#3b82f6' };
const YEAR_COLORS = ['#16a34a', '#f59e0b', '#1d4ed8', '#06b6d4'];
const GENDER_PIE = ['#4ade80', '#3b82f6', '#f97316'];
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
  const [globalDeptFilter, setGlobalDeptFilter] = useState('ALL');
  const [schoolFilter, setSchoolFilter] = useState('ALL');
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

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
  const deptStats = useMemo(() => {
    return stats?.departmentStats || [];
  }, [stats]);

  const schoolStats = useMemo(() => {
    return stats?.schoolStats || [];
  }, [stats]);

  const deptOptions = useMemo(
    () => ['ALL', ...deptStats.map((d) => d.name || d.dept)],
    [deptStats]
  );

  const schoolOptions = useMemo(
    () => ['ALL', ...schoolStats.map((g) => g.name || g.shortName || g.group)],
    [schoolStats]
  );

  // Department Bar Data
  const deptBarData = useMemo(() => {
    if (!deptStats.length) return [];
    const filtered =
      deptFilter === 'ALL'
        ? deptStats
        : deptStats.filter((d) => (d.name === deptFilter || d.dept === deptFilter));
    return filtered.map((d) => ({
      name: d.name || d.dept,
      'Teams count': d.teamCount,
      'Student count': d.studentCount,
      'Events count': d.eventCount,
      '₹ Revenue': d.revenue,
    }));
  }, [deptStats, deptFilter]);

  // Compute global stats based on filter
  const globalSummary = useMemo(() => {
    if (globalDeptFilter === 'ALL' || !deptStats.length) {
      return {
        teams: stats?.totalTeams || 0,
        students: stats?.totalStudents || 0,
        attended: stats?.totalAttended || 0,
        revenue: stats?.revenue?.total || 0,
        schools: schoolStats?.length || 0,
        departments: deptStats?.length || 0
      };
    }
    const dStats = deptStats.find(d => (d.name === globalDeptFilter || d.dept === globalDeptFilter)) || {};
    return {
      teams: dStats.teamCount || 0,
      students: dStats.studentCount || 0,
      attended: dStats.participatedStudents || 0,
      revenue: dStats.revenue || 0,
      schools: '-',
      departments: 1
    };
  }, [globalDeptFilter, stats, deptStats, schoolStats]);

  // Group Bar Data
  const groupBarData = useMemo(() => {
    if (!schoolStats.length) return [];
    const filtered =
      schoolFilter === 'ALL'
        ? schoolStats
        : schoolStats.filter((g) => (g.name === schoolFilter || g.shortName === schoolFilter || g.group === schoolFilter));
    return filtered.map((g) => ({
      name: g.name || g.shortName || g.group,
      'Teams count': g.teamCount,
      'Student count': g.studentCount,
      'Events count': g.eventCount,
      '₹ Revenue': g.revenue,
    }));
  }, [schoolStats, schoolFilter]);

  const deptRevenueData = useMemo(() => {
    if (!deptStats.length) return [];
    const filtered =
      deptFilter === 'ALL'
        ? deptStats
        : deptStats.filter((d) => (d.name === deptFilter || d.dept === deptFilter));
    return filtered.map((d) => ({
      name: d.name || d.dept,
      '₹ Revenue': d.revenue,
      'Events count': d.eventCount,
      'Teams count': d.teamCount,
    })).sort((a, b) => b['₹ Revenue'] - a['₹ Revenue']);
  }, [deptStats, deptFilter]);

  const groupRevenueData = useMemo(() => {
    if (!schoolStats.length) return [];
    const filtered =
      schoolFilter === 'ALL'
        ? schoolStats
        : schoolStats.filter((g) => (g.name === schoolFilter || g.shortName === schoolFilter || g.group === schoolFilter));
    return filtered.map((g) => ({
      name: g.name || g.shortName || g.group,
      '₹ Revenue': g.revenue,
      'Events count': g.eventCount,
      'Teams count': g.teamCount,
    })).sort((a, b) => b['₹ Revenue'] - a['₹ Revenue']);
  }, [schoolStats, schoolFilter]);

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

  const revenueByDateData = useMemo(
    () => (stats?.revenue?.byDate || []).map((d) => ({ date: d.date, '₹ Revenue': d.revenue })),
    [stats]
  );

  const revenueByEventData = useMemo(
    () => (stats?.revenue?.byEvent || []).map((d) => ({ event: d.event, '₹ Revenue': d.revenue, Teams: d.teams })),
    [stats]
  );

  const yearLabels = ['First Years', 'Second Years', 'Third Years', 'Fourth Years'];
  const yearKeys = ['1', '2', '3', '4'];

  const yearDataMap = useMemo(() => {
    const raw = stats?.yearWise || stats?.yearCounts;
    if (raw && (raw['1'] !== undefined || raw['2'] !== undefined || raw['3'] !== undefined || raw['4'] !== undefined)) {
      if ((raw['1'] || 0) + (raw['2'] || 0) + (raw['3'] || 0) + (raw['4'] || 0) > 0) {
        return raw;
      }
    }
    // Fallback: Aggregate from campusWise if available
    if (stats?.campusWise) {
      const counts = { '1': 0, '2': 0, '3': 0, '4': 0 };
      Object.values(stats.campusWise).forEach((c) => {
        counts['1'] += c.I || 0;
        counts['2'] += c.II || 0;
        counts['3'] += c.III || 0;
        counts['4'] += c.IV || 0;
      });
      return counts;
    }
    return raw || {};
  }, [stats]);

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

  const filteredEventsTotal = deptBarData.reduce((acc, curr) => acc + (curr['Events count'] || 0), 0);
  const filteredTeamsTotal = deptBarData.reduce((acc, curr) => acc + (curr['Teams count'] || 0), 0);
  const filteredStudentsTotal = deptBarData.reduce((acc, curr) => acc + (curr['Student count'] || 0), 0);
  const filteredRevenueTotal = deptBarData.reduce((acc, curr) => acc + (curr['₹ Revenue'] || 0), 0);

  const groupFilteredTeamsTotal = groupBarData.reduce((acc, curr) => acc + (curr['Teams count'] || 0), 0);
  const groupFilteredStudentsTotal = groupBarData.reduce((acc, curr) => acc + (curr['Student count'] || 0), 0);
  const groupFilteredRevenueTotal = groupBarData.reduce((acc, curr) => acc + (curr['₹ Revenue'] || 0), 0);

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: 3, boxSizing: 'border-box' }}>
      <PageHeader
        title="Veda Event Admin Dashboard"
        subtitle="Overview of paid VEDA event participation, department/school analytics and registration metrics"
      />


      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, px: { xs: 2, sm: 0 } }}>
        <Tabs value={currentTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile sx={{ '& .MuiTab-root': { fontWeight: 600, fontSize: '1rem', textTransform: 'none' } }}>
          <Tab label="All" />
          <Tab label="Schools" />
          <Tab label="Departments" />
          <Tab label="Events" />
        </Tabs>
      </Box>

      {/* ── TAB 0: ALL ─────────────────────────────────────────────── */}
      {currentTab === 0 && (
        <>
          {/* ── Summary Cards ─────────────────────────────────────────────── */}
          <StatCardGrid columns={{ xs: 1, sm: 2, md: 3 }}>
            <StatCard title="Total Teams" value={globalSummary.teams} color="#0d9488" icon={<GroupsIcon />} />
            <StatCard title="Total Students" value={globalSummary.students} color="#2563eb" icon={<PeopleIcon />} />
            <StatCard title="Total Revenue" value={`₹${fmt(globalSummary.revenue)}`} color="#7c3aed" icon={<CurrencyRupeeIcon />} />
            <StatCard title="Total Attended" value={globalSummary.attended} color="#16a34a" icon={<PeopleIcon />} />
            <StatCard title="Schools (Groups)" value={globalSummary.schools} color="#ea580c" icon={<SchoolIcon />} />
            <StatCard title="Departments" value={globalSummary.departments} color="#9333ea" icon={<BusinessIcon />} />
          </StatCardGrid>


          {/* ── Section 3: Year cards + Campus-wise Years ─────────────────── */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '400px 1fr' }, gap: 2, alignItems: 'stretch', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
            {/* Year cards */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gridTemplateRows: { lg: '1fr 1fr', xs: 'auto' }, gap: 2, height: '100%', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
              {yearKeys.map((yr, idx) => (
                <Paper
                  key={yr}
                  elevation={0}
                  sx={{
                    p: { xs: 2, sm: 2.5 },
                    borderRadius: '16px',
                    border: `1px solid ${YEAR_COLORS[idx]}44`,
                    background: `linear-gradient(135deg, ${YEAR_COLORS[idx]}18 0%, ${YEAR_COLORS[idx]}08 100%)`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    height: '100%',
                    width: '100%',
                    maxWidth: '100%',
                    minWidth: 0,
                    boxSizing: 'border-box',
                    boxShadow: 'var(--shadow-premium)',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'translateY(-2px)' },
                  }}
                >
                  <Box
                    sx={{
                      display: 'inline-block',
                      alignSelf: 'flex-start',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: '8px',
                      background: YEAR_COLORS[idx],
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      letterSpacing: '0.03em',
                      boxShadow: `0 4px 12px ${YEAR_COLORS[idx]}40`,
                      mb: 1.5,
                    }}
                  >
                    {yearLabels[idx]}
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: 'var(--text-primary)', mb: 0.5, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                    {fmt(yearDataMap?.[yr] ?? 0)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Total registered participants
                  </Typography>
                </Paper>
              ))}
            </Box>

            {/* Campus-wise Years chart */}
            <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: '16px', background: 'var(--bg-paper)', border: '1px solid var(--border-color)', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
              <SectionTitle>Campus-wise Years Distribution</SectionTitle>
              <Box sx={{ overflowX: 'auto', pb: 1, width: '100%', maxWidth: '100%', minWidth: 0, display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ width: '100%', maxWidth: '100%', minWidth: { xs: 280, sm: '100%' }, mx: 'auto' }}>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={campusYearData} margin={{ top: 25, right: 15, left: -20, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} domain={[0, (dataMax) => Math.ceil(dataMax * 1.15)]} />
                      <Tooltip />
                      <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: 10 }} />
                      <Bar dataKey="I-Years" fill="#16a34a" radius={[3, 3, 0, 0]}>
                        <LabelList dataKey="I-Years" position="top" formatter={(v) => (v > 0 ? fmt(v) : '')} fill="var(--text-primary)" fontSize={10} fontWeight={600} />
                      </Bar>
                      <Bar dataKey="II-Years" fill="#f59e0b" radius={[3, 3, 0, 0]}>
                        <LabelList dataKey="II-Years" position="top" formatter={(v) => (v > 0 ? fmt(v) : '')} fill="var(--text-primary)" fontSize={10} fontWeight={600} />
                      </Bar>
                      <Bar dataKey="III-Years" fill="#1d4ed8" radius={[3, 3, 0, 0]}>
                        <LabelList dataKey="III-Years" position="top" formatter={(v) => (v > 0 ? fmt(v) : '')} fill="var(--text-primary)" fontSize={10} fontWeight={600} />
                      </Bar>
                      <Bar dataKey="IV-Years" fill="#06b6d4" radius={[3, 3, 0, 0]}>
                        <LabelList dataKey="IV-Years" position="top" formatter={(v) => (v > 0 ? fmt(v) : '')} fill="var(--text-primary)" fontSize={10} fontWeight={600} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Box>
            </Paper>
          </Box>


          {/* ── Section 6: Gender chart ──────────────────── */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2, width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
            {/* Gender Pie */}
            <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: '16px', background: 'var(--bg-paper)', border: '1px solid var(--border-color)', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
              <SectionTitle>Gender Chart</SectionTitle>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
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
              </Box>
            </Paper>
          </Box>


          {/* ── Section 7: Campus Wise Gender (line) + Campus Wise Count (pie) */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2, mb: 2, width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
            {/* Campus gender line */}
            <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: '16px', background: 'var(--bg-paper)', border: '1px solid var(--border-color)', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
              <SectionTitle>Campus Wise Gender</SectionTitle>
              <Box sx={{ overflowX: 'auto', pb: 1, width: '100%', maxWidth: '100%', minWidth: 0, display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ width: '100%', maxWidth: '100%', minWidth: { xs: 280, sm: '100%' }, mx: 'auto' }}>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={campusGenderLineData} margin={{ top: 20, right: 15, left: -20, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="campus" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} domain={[0, (dataMax) => Math.ceil(dataMax * 1.15)]} />
                      <Tooltip />
                      <Legend />
                      {Object.keys(CAMPUS_GENDER_COLORS).map((key) => (
                        <Line key={key} type="monotone" dataKey={key} stroke={CAMPUS_GENDER_COLORS[key]} strokeWidth={2} dot={{ r: 5 }}>
                          <LabelList dataKey={key} position="top" formatter={(v) => (v > 0 ? fmt(v) : '')} fill={CAMPUS_GENDER_COLORS[key]} fontSize={10} fontWeight={600} />
                        </Line>
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Box>
            </Paper>

            {/* Campus count pie */}
            <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: '16px', background: 'var(--bg-paper)', border: '1px solid var(--border-color)', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
              <SectionTitle>Campus Wise Count</SectionTitle>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={campusCountPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${fmt(value)}`}>
                      {campusCountPieData.map((_, i) => (
                        <Cell key={i} fill={CAMPUS_COUNT_COLORS[i % CAMPUS_COUNT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Box>



          <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: '16px', background: 'var(--bg-paper)', border: '1px solid var(--border-color)', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <TrendingUpIcon sx={{ color: REVENUE_COLOR }} />
              <SectionTitle>Daily Revenue Trend</SectionTitle>
            </Box>
            {/* Revenue Trend Line */}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 1.5, color: 'text.secondary' }}>Daily Revenue Trend (₹)</Typography>
              {revenueByDateData.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                  <Typography variant="body2">No date-wise revenue data available yet.</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={revenueByDateData} margin={{ top: 25, right: 20, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" angle={-30} textAnchor="end" tick={{ fontSize: 10 }} interval={0} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} domain={[0, (dataMax) => Math.ceil(dataMax * 1.15)]} />
                    <Tooltip formatter={(v) => [`₹${v}`, 'Revenue']} />
                    <Line type="monotone" dataKey="₹ Revenue" stroke={REVENUE_COLOR} strokeWidth={2} dot={{ r: 5 }}>
                      <LabelList dataKey="₹ Revenue" position="top" formatter={(v) => (v > 0 ? `₹${fmt(v)}` : '')} fill={REVENUE_COLOR} fontSize={10} fontWeight={700} />
                    </Line>
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>
        </>
      )}

      {/* ── TAB 1: SCHOOLS ─────────────────────────────────────────────── */}
      {currentTab === 1 && (
        <>
          {/* ── Section 2: School filter + Teams, Students & Events per School ───────── */}
          <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: '16px', background: 'var(--bg-paper)', border: '1px solid var(--border-color)', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
            <Box sx={{ display: 'flex', alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2 }}>
              <Box>
                <SectionTitle>Teams, Students & Events Count by School</SectionTitle>
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                  Aggregated across all event schools
                </Typography>
              </Box>
              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 240 } }}>
                <InputLabel>Choose School</InputLabel>
                <Select value={schoolFilter} label="Choose School" onChange={(e) => setSchoolFilter(e.target.value)}>
                  {schoolOptions.map((g) => (
                    <MenuItem key={g} value={g}>{g}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ width: '100%', maxWidth: '100%' }}>
              <ResponsiveContainer width="100%" height={Math.max(340, (groupBarData.length || 0) * 55)}>
                <BarChart layout="vertical" data={groupBarData} margin={{ top: 10, right: 45, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                  <YAxis type="category" dataKey="name" width={220} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} interval={0} />
                  <Tooltip formatter={(val, name) => [name === '₹ Revenue' ? `₹${fmt(val)}` : fmt(val), name]} />
                  <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: 15 }} />
                  <Bar dataKey="Teams count" fill={DEPT_BAR_COLORS.teams} radius={[0, 4, 4, 0]}>
                    <LabelList dataKey="Teams count" position="right" formatter={(v) => (v > 0 ? fmt(v) : '')} fill="var(--text-primary)" fontSize={10} fontWeight={600} />
                  </Bar>
                  <Bar dataKey="Student count" fill={DEPT_BAR_COLORS.students} radius={[0, 4, 4, 0]}>
                    <LabelList dataKey="Student count" position="right" formatter={(v) => (v > 0 ? fmt(v) : '')} fill="var(--text-primary)" fontSize={10} fontWeight={600} />
                  </Bar>
                  <Bar dataKey="Events count" fill={DEPT_BAR_COLORS.events} radius={[0, 4, 4, 0]}>
                    <LabelList dataKey="Events count" position="right" formatter={(v) => (v > 0 ? fmt(v) : '')} fill="var(--text-primary)" fontSize={10} fontWeight={600} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
            <Box sx={{ mt: 2, textAlign: 'center', p: 1.5, borderRadius: '12px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                Filtered Teams: {fmt(groupFilteredTeamsTotal)}&nbsp;&nbsp;|&nbsp;&nbsp;Filtered Students: {fmt(groupFilteredStudentsTotal)}&nbsp;&nbsp;|&nbsp;&nbsp;Filtered Revenue: ₹{fmt(groupFilteredRevenueTotal)}
              </Typography>
            </Box>
          </Paper>


          {/* ── Section 5: Overall School Synopsis Table ─────────────────────────── */}
          <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: '16px', background: 'var(--bg-paper)', border: '1px solid var(--border-color)' }}>
            <SectionTitle>Overall School Synopsis</SectionTitle>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ background: 'var(--bg-glass)' }}>
                    {['School Name', 'Events Count', 'Revenue (₹)', 'AUS', 'ACET', 'Other', 'Total Teams Registered', 'Total Students Registered', 'Participated Students'].map((h) => (
                      <TableCell key={h} sx={{ fontWeight: 800, whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {schoolStats.map((row, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell sx={{ fontWeight: 700, color: '#ea580c' }}>{row.name}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{row.eventCount}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#7c3aed' }}>₹{fmt(row.revenue)}</TableCell>
                      <TableCell>{fmt(row.aus)}</TableCell>
                      <TableCell>{fmt(row.acet)}</TableCell>
                      <TableCell>{fmt(row.other)}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#ea580c' }}>{fmt(row.teamCount)}</TableCell>
                      <TableCell>{fmt(row.studentCount)}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#d97706' }}>{fmt(row.participatedStudents)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>


          <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: '16px', background: 'var(--bg-paper)', border: '1px solid var(--border-color)', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <TrendingUpIcon sx={{ color: REVENUE_COLOR }} />
              <SectionTitle>Revenue by School</SectionTitle>
            </Box>
            {/* Revenue by Group (filtered by schoolFilter) */}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 1.5, color: 'text.secondary' }}>
                Revenue by School (₹) {schoolFilter !== 'ALL' ? `— ${schoolFilter}` : ''}
              </Typography>
              {groupRevenueData.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                  <Typography variant="body2">No group revenue data available.</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={270}>
                  <BarChart data={groupRevenueData} margin={{ top: 25, right: 20, left: 0, bottom: 45 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" angle={-15} textAnchor="end" tick={{ fontSize: 10 }} interval={0} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} domain={[0, (dataMax) => Math.ceil(dataMax * 1.15)]} />
                    <Tooltip formatter={(v, name) => [`₹${fmt(v)}`, name]} />
                    <Bar dataKey="₹ Revenue" fill={REVENUE_COLOR} radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="₹ Revenue" position="top" formatter={(v) => `₹${fmt(v)}`} fill="var(--text-primary)" fontSize={11} fontWeight={700} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>
        </>
      )}

      {/* ── TAB 2: DEPARTMENTS ─────────────────────────────────────────────── */}
      {currentTab === 2 && (
        <>
          {/* ── Section 1: Department filter + Teams, Students & Events per Department ───────── */}
          <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: '16px', background: 'var(--bg-paper)', border: '1px solid var(--border-color)', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
            <Box sx={{ display: 'flex', alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2 }}>
              <Box>
                <SectionTitle>Events Count by Department</SectionTitle>
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                  Aggregated across all departments from the event departments collection
                </Typography>
              </Box>
              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 220 } }}>
                <InputLabel>Choose Department</InputLabel>
                <Select value={deptFilter} label="Choose Department" onChange={(e) => setDeptFilter(e.target.value)}>
                  {deptOptions.map((d) => (
                    <MenuItem key={d} value={d}>{d}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ width: '100%', maxWidth: '100%' }}>
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={deptBarData} margin={{ top: 25, right: 15, left: -10, bottom: 65 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" angle={-30} textAnchor="end" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} interval={0} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} domain={[0, (dataMax) => Math.ceil(dataMax * 1.15)]} />
                  <Tooltip formatter={(val, name) => [fmt(val), name]} />
                  <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: 10 }} />
                  <Bar dataKey="Events count" fill={DEPT_BAR_COLORS.events} radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="Events count" position="top" formatter={(v) => (v > 0 ? fmt(v) : '')} fill="var(--text-primary)" fontSize={10} fontWeight={700} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
            <Box sx={{ mt: 2, textAlign: 'center', p: 1.5, borderRadius: '12px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                Filtered Events: {fmt(filteredEventsTotal)}&nbsp;&nbsp;|&nbsp;&nbsp;Filtered Teams: {fmt(filteredTeamsTotal)}&nbsp;&nbsp;|&nbsp;&nbsp;Filtered Students: {fmt(filteredStudentsTotal)}&nbsp;&nbsp;|&nbsp;&nbsp;Filtered Revenue: ₹{fmt(filteredRevenueTotal)}
              </Typography>
            </Box>
          </Paper>


          {/* ── Section 4: Overall Department Synopsis Table ─────────────────────────── */}
          <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: '16px', background: 'var(--bg-paper)', border: '1px solid var(--border-color)' }}>
            <SectionTitle>Overall Department Synopsis</SectionTitle>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ background: 'var(--bg-glass)' }}>
                    {['Department', 'Events Count', 'AUS', 'ACET', 'Other', 'Total Teams Registered', 'Total Students Registered', 'Participated Students'].map((h) => (
                      <TableCell key={h} sx={{ fontWeight: 800, whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deptStats.map((row, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell sx={{ fontWeight: 700, color: 'var(--color-primary)' }}>{row.name || row.dept}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{row.eventCount}</TableCell>
                      <TableCell>{fmt(row.aus)}</TableCell>
                      <TableCell>{fmt(row.acet)}</TableCell>
                      <TableCell>{fmt(row.other)}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'var(--color-primary)' }}>{fmt(row.teamCount)}</TableCell>
                      <TableCell>{fmt(row.studentCount)}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#d97706' }}>{fmt(row.participatedStudents)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </>
      )}

      {/* ── TAB 3: EVENTS ─────────────────────────────────────────────── */}
      {currentTab === 3 && (
        <>
          <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: '16px', background: 'var(--bg-paper)', border: '1px solid var(--border-color)', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <TrendingUpIcon sx={{ color: REVENUE_COLOR }} />
              <SectionTitle>Revenue by Event</SectionTitle>
            </Box>
            {/* Revenue by Event */}
            {revenueByEventData.length > 0 && (
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 1.5, color: 'text.secondary' }}>Revenue by Event (₹)</Typography>
                <ResponsiveContainer width="100%" height={Math.max(360, revenueByEventData.length * 36)}>
                  <BarChart layout="vertical" data={revenueByEventData} margin={{ top: 10, right: 65, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} tickFormatter={(v) => `₹${v}`} />
                    <YAxis type="category" dataKey="event" width={220} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} interval={0} />
                    <Tooltip formatter={(v, name) => [name === 'Teams' ? v : `₹${v}`, name]} />
                    <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: 15 }} />
                    <Bar dataKey="₹ Revenue" fill={REVENUE_COLOR} radius={[0, 4, 4, 0]}>
                      <LabelList dataKey="₹ Revenue" position="right" formatter={(v) => (v > 0 ? `₹${fmt(v)}` : '')} fill={REVENUE_COLOR} fontSize={10} fontWeight={700} />
                    </Bar>
                    <Bar dataKey="Teams" fill="#0d9488" radius={[0, 4, 4, 0]}>
                      <LabelList dataKey="Teams" position="right" formatter={(v) => (v > 0 ? fmt(v) : '')} fill="#0d9488" fontSize={10} fontWeight={600} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>
        </>
      )}

    </Box>
  );
};

export default StudentEventAdminDashboard;
