import Loader from "../../components/common/Loader";
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  Paper,
  LinearProgress,
  Chip,
  Button,
} from '@mui/material';
import {
  Description,
  CheckCircle,
  PendingActions,
  AssignmentReturn,
  Cancel,
  ArrowForward,
  Campaign,
  TrendingUp,
  AutoStories,
  School,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import API from "../../api/axios";

const RnDDeanDashboard = ({ activeRole = 'RESEARCH_DEAN' }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const basePath = activeRole === 'RESEARCH_COORDINATOR' ? '/research-coordinator' : '/research-dean';
  const displayRoleName = activeRole === 'RESEARCH_COORDINATOR' ? 'Research Coordinator' : 'Research & Development Dean';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await API.get('/api/dashboard/research-dean');
        if (res.data?.status === 'success') {
          setData(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching Research Dean dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // if (loading) {
  //   return (
  //     <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
  //       <Loader />
  //     </Box>
  //   );
  // }

  const dashboard = data || {
    totalPublications: 0,
    approved: 0,
    pendingHod: 0,
    pendingRnd: 0,
    rejected: 0,
    trendData: [],
    pieData: [],
    departments: [],
    researchImpact: [],
    announcements: []
  };

  const trendData = dashboard.trendData && dashboard.trendData.length > 0 ? dashboard.trendData : [];
  const pieData = dashboard.pieData && dashboard.pieData.length > 0 ? dashboard.pieData : [];
  const departments = dashboard.departments && dashboard.departments.length > 0 ? dashboard.departments : [];
  const announcements = dashboard.announcements && dashboard.announcements.length > 0 ? dashboard.announcements : [];
  const researchImpact = dashboard.researchImpact && dashboard.researchImpact.length > 0 ? dashboard.researchImpact : [];

  const maxDeptValue = departments.length > 0 ? Math.max(...departments.map(d => d.value), 1) : 1;

  const summaryCards = [
    { title: 'Total Publications', value: dashboard.totalPublications, subtitle: 'Total Submissions', icon: <Description />, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', path: `${basePath}/approvals` },
    { title: 'Approved', value: dashboard.approved, subtitle: 'This Academic Year', icon: <CheckCircle />, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', path: `${basePath}/approvals` },
    { title: 'Pending in HoD', value: dashboard.pendingHod, subtitle: 'Awaiting HoD Approval', icon: <PendingActions />, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', path: `${basePath}/approvals` },
    { title: 'Pending in R&D', value: dashboard.pendingRnd, subtitle: 'Awaiting R&D Approval', icon: <AssignmentReturn />, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)', path: `${basePath}/approvals` },
    { title: 'Rejected', value: dashboard.rejected, subtitle: 'This Academic Year', icon: <Cancel />, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', path: `${basePath}/approvals` },
  ];

  return (
    <Box sx={{ pb: 4 }}>
      {/* Welcome Header */}
      <Box sx={{ mb: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'var(--text-primary)', mb: 0.5 }}>
            Welcome, {displayRoleName} 👋
          </Typography>
          <Typography variant="body1" sx={{ color: 'var(--text-secondary)', opacity: 0.8 }}>
            Here's an overview of research and publication activities.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            label="Live Data"
            variant="outlined"
            sx={{ borderRadius: '10px', border: '1px solid var(--border-color)', fontWeight: 600, background: 'var(--bg-panel)', color: 'var(--color-primary)' }}
          />
        </Box>
      </Box>

      {/* Summary Cards */}
      <Box sx={{ display: "flex", gap: 2, mb: 5, flexWrap: "wrap" }}>
        {summaryCards.map((card, index) => (
          <Box key={index} sx={{ flex: { xs: "1 1 100%", sm: "1 1 calc(50% - 16px)", lg: 1 }, minWidth: 0 }}>
            <Card sx={{
              p: 2.5,
              borderRadius: '16px',
              background: 'var(--bg-panel)',
              border: '1px solid var(--border-color)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '160px',
              boxSizing: 'border-box',
              gap: 2,
              position: 'relative',
              overflow: 'hidden',
              cursor: card.path ? 'pointer' : 'default',
              '&:hover': {
                transform: card.path ? 'translateY(-5px)' : 'none',
                boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                right: 0,
                width: '120px',
                height: '120px',
                background: `radial-gradient(circle at top right, ${card.color}25, transparent 70%)`,
                zIndex: 0,
                pointerEvents: 'none'
              },
              '&:hover .view-all-arrow': {
                transform: 'translateX(4px)'
              }
            }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    backgroundColor: card.bg,
                    color: card.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {card.icon}
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{card.value}</Typography>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', mt: 0.5 }}>{card.title}</Typography>
                  </Box>
                </Box>
                <Typography sx={{ fontSize: '0.7rem', color: 'var(--text-secondary)', opacity: 0.7 }}>{card.subtitle}</Typography>
              </Box>

              {card.path && (
                <Box sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 0.8,
                  pt: 1.5,
                  borderTop: "1px solid var(--border-color)",
                  width: "100%",
                  zIndex: 1,
                  mt: "auto"
                }}>
                  <Typography
                    className="view-all-text"
                    sx={{
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      background: "var(--gradient-primary)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      display: "inline-block",
                      transition: "all 0.2s ease"
                    }}
                  >
                    View Details
                  </Typography>
                  <ArrowForward
                    className="view-all-arrow"
                    sx={{
                      fontSize: 14,
                      color: "var(--color-primary)",
                      transition: "transform 0.2s ease"
                    }}
                  />
                </Box>
              )}
            </Card>
          </Box>
        ))}
      </Box>

      {/* Charts Row */}
      <Box sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
        gap: 4,
        mb: 5
      }}>
        <Card sx={{ p: 3, borderRadius: '24px', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', height: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Publications Trend</Typography>
            <Chip label="Last 12 Months" size="small" sx={{ borderRadius: '8px', background: 'var(--bg-accent-4)', fontWeight: 600 }} />
          </Box>
          <Box sx={{ height: 320, width: '100%', minWidth: 0, position: 'relative' }}>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '16px', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-premium)' }}
                  />
                  <Line type="monotone" dataKey="publications" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--text-secondary)" }}>
                No trend data available.
              </Box>
            )}
          </Box>
        </Card>

        <Card sx={{ p: 3, borderRadius: '24px', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', height: '100%' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Publications by Type</Typography>
          {pieData.some(d => d.value > 0) ? (
            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'center',
              gap: { xs: 4, sm: 3 },
              minHeight: 320
            }}>
              {/* Chart */}
              <Box sx={{
                flex: 1.2,
                width: '100%',
                minWidth: 0,
                height: 240,
                position: 'relative'
              }}>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} cornerRadius={4} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: 'var(--text-primary)' }}>{dashboard.approved}</Typography>
                  <Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Approved</Typography>
                </Box>
              </Box>

              {/* Details Box */}
              <Box sx={{
                flex: 1,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
                px: { xs: 1, sm: 0 }
              }}>
                {pieData.map((item, i) => (
                  <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '3px', backgroundColor: item.color, flexShrink: 0 }} />
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{item.name}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 }}>
                      {item.value} <Box component="span" sx={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.75rem' }}>({dashboard.approved > 0 ? Math.round(item.value / dashboard.approved * 100) : 0}%)</Box>
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 320, color: "var(--text-secondary)" }}>
              No approved publications recorded yet.
            </Box>
          )}
        </Card>
      </Box>

      {/* Bottom Row */}
      <Box sx={{ display: "flex", gap: 4, flexWrap: "wrap", mb: 2 }}>
        {/* Top Departments */}
        <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 calc(33.33% - 27px)" }, minWidth: 0 }}>
          <Card sx={{ p: 3, borderRadius: '24px', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Top Departments by Publications</Typography>
            {departments.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.2 }}>
                {departments.map((dept, i) => (
                  <Box key={i}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.2 }}>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{dept.name}</Typography>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>{dept.value}</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(dept.value / maxDeptValue) * 100}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: 'var(--bg-accent-4)',
                        '& .MuiLinearProgress-bar': { backgroundColor: dept.color || 'var(--color-primary)', borderRadius: 4 }
                      }}
                    />
                  </Box>
                ))}
              </Box>
            ) : (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 200, color: "var(--text-secondary)" }}>
                No department data available.
              </Box>
            )}
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Button
                endIcon={<ArrowForward />}
                onClick={() => navigate(`${basePath}/reports`)}
                sx={{ textTransform: 'none', fontWeight: 700, color: 'var(--color-primary)' }}
              >
                View R&D Reports
              </Button>
            </Box>
          </Card>
        </Box>

        {/* Research Impact */}
        <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 calc(33.33% - 27px)" }, minWidth: 0 }}>
          <Card sx={{ p: 3, borderRadius: '24px', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Research Impact</Typography>
            <Typography variant="caption" sx={{ color: 'var(--text-secondary)', display: 'block', mb: 3, fontWeight: 500 }}>(All Approved Journals)</Typography>
            {researchImpact.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {researchImpact.map((item, i) => (
                  <Box key={i} sx={{
                    p: 2.5,
                    borderRadius: '20px',
                    background: 'var(--bg-accent-4)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.3s ease',
                    '&:hover': { borderColor: item.color, background: 'var(--bg-panel)' }
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                      <Box sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '12px',
                        backgroundColor: item.bg,
                        color: item.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1.2rem'
                      }}>
                        {item.icon}
                      </Box>
                      <Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1 }}>{item.value}</Typography>
                        <Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{item.label}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography sx={{ color: '#10b981', fontWeight: 800, fontSize: '0.85rem' }}>↑ {item.trend}</Typography>
                      <Typography sx={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 500 }}>vs last year</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 200, color: "var(--text-secondary)" }}>
                No impact analytics available.
              </Box>
            )}
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Button
                endIcon={<ArrowForward />}
                onClick={() => navigate(`${basePath}/reports`)}
                sx={{ textTransform: 'none', fontWeight: 700, color: 'var(--color-primary)' }}
              >
                View Research Analytics
              </Button>
            </Box>
          </Card>
        </Box>

        {/* Recent Announcements */}
        <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 calc(33.33% - 27px)" }, minWidth: 0 }}>
          <Card sx={{ p: 3, borderRadius: '24px', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
              <Campaign sx={{ color: 'var(--color-primary)' }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Recent Announcements</Typography>
            </Box>
            {announcements.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                {announcements.map((item, i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 2.5 }}>
                    <Box sx={{
                      textAlign: 'center',
                      minWidth: 64,
                      p: 1.5,
                      borderRadius: '16px',
                      background: 'var(--bg-accent-4)',
                      height: 'fit-content',
                      border: '1px solid var(--border-color)'
                    }}>
                      <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1 }}>{item.date.split(' ')[0]}</Typography>
                      <Typography sx={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', mt: 0.5 }}>{item.date.split(' ').slice(1).join(' ')}</Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, mb: 0.8, color: 'var(--text-primary)' }}>{item.title}</Typography>
                      <Typography sx={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, fontWeight: 500 }}>{item.desc}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 200, color: "var(--text-secondary)" }}>
                No recent announcements.
              </Box>
            )}
            <Box sx={{ mt: 'auto', pt: 4, textAlign: 'center' }}>
              <Button
                endIcon={<ArrowForward />}
                sx={{ textTransform: 'none', fontWeight: 700, color: 'var(--color-primary)' }}
              >
                View All Announcements
              </Button>
            </Box>
          </Card>
        </Box>
      </Box>

      {/* Quick Actions */}
      <Box sx={{ mt: 6 }}>
        <Card sx={{
          borderRadius: "24px",
          boxShadow: "var(--shadow-premium)",
          p: 4,
          background: "var(--gradient-primary)",
          color: "#fff",
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          minHeight: 180
        }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Research & Development Actions</Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2.5 }}>
            <Button
 variant="contained"
 onClick={() => navigate(`${basePath}/approvals`)}
 sx={{
 flex: 1,
 minWidth: "220px",
 background: "rgba(255,255,255,0.15)",
 backdropFilter: "blur(12px)",
 textTransform: "none",
 py: 2,
 
 fontWeight: 700,
 border: '1px solid rgba(255,255,255,0.2)',
 "&:hover": {
 background: "rgba(255,255,255,0.25)",
 transform: 'scale(1.02)'
 }
 }}
 >
              Pending Approvals
            </Button>
            <Button
 variant="contained"
 onClick={() => navigate(`${basePath}/reports`)}
 sx={{
 flex: 1,
 minWidth: "220px",
 background: "rgba(255,255,255,0.15)",
 backdropFilter: "blur(12px)",
 textTransform: "none",
 py: 2,
 
 fontWeight: 700,
 border: '1px solid rgba(255,255,255,0.2)',
 "&:hover": {
 background: "rgba(255,255,255,0.25)",
 transform: 'scale(1.02)'
 }
 }}
 >
              Publication Reports
            </Button>
            <Button
 variant="contained"
 onClick={() => navigate(`${basePath}/reports`)}
 sx={{
 flex: 1,
 minWidth: "220px",
 background: "rgba(255,255,255,0.15)",
 backdropFilter: "blur(12px)",
 textTransform: "none",
 py: 2,
 
 fontWeight: 700,
 border: '1px solid rgba(255,255,255,0.2)',
 "&:hover": {
 background: "rgba(255,255,255,0.25)",
 transform: 'scale(1.02)'
 }
 }}
 >
              Research Analytics
            </Button>
          </Box>
        </Card>
      </Box>
    </Box>
  );
};

export default RnDDeanDashboard;
