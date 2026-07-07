import Loader from "../../components/common/Loader";
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Button,
  Paper,
  CircularProgress,
  Chip,
  Grid,
  Avatar,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from "@mui/material";
import {
  People,
  Assignment,
  WarningAmber,
  Flag,
  ArrowForward,
  Science,
  SupervisorAccount,
  AccountBalance,
  WorkspacePremium,
  TrendingUp,
  School,
} from "@mui/icons-material";
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import API from "../../api/axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip
} from 'recharts';

const HODDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await API.get('/api/dashboard/hod');
        if (res.data?.status === 'success') {
          setData(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching HOD dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user]);

  const getStatusStyle = (status) => {
    if (/Approved/i.test(status)) return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10B981' };
    if (/Pending/i.test(status)) return { bg: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' };
    if (/Rejected/i.test(status)) return { bg: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' };
    return { bg: 'var(--bg-accent-4)', color: 'var(--text-secondary)' };
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  // if (loading) {
  //   return (
  //     <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
  //       <Loader />
  //     </Box>
  //   );
  // }

  const dashboard = data || {
    totalFaculty: 0,
    totalPrograms: 0,
    departments: [],
    pendingCounts: { research: 0, proctoring: 0, administration: 0, resourceUtilization: 0, contribution: 0, total: 0 },
    researchStats: [],
    recentActivities: [],
    topFaculty: []
  };

  const totalPublicationsCount = dashboard.researchStats.reduce((sum, item) => sum + item.value, 0);

  const topCards = [
    { title: "Department Faculty", value: dashboard.totalFaculty, subtitle: "Total Active", icon: <People />, color: "#3B82F6", bgColor: "rgba(59, 130, 246, 0.1)" },
    { title: "Academic Programs", value: dashboard.totalPrograms, subtitle: "Branches Managed", icon: <Assignment />, color: "#10B981", bgColor: "rgba(16, 185, 129, 0.1)" },
    { title: "Pending Reviews", value: dashboard.pendingCounts.total, subtitle: "Actions Required", icon: <WarningAmber />, color: "#F59E0B", bgColor: "rgba(245, 158, 11, 0.1)" },
    { title: "Total Research Work", value: totalPublicationsCount, subtitle: "Submitted & Approved", icon: <Science />, color: "#8B5CF6", bgColor: "rgba(139, 92, 246, 0.1)" },
  ];

  const pendingActions = [
    {
      title: "Research Submissions",
      count: dashboard.pendingCounts.research,
      path: "/hod/research-approvals",
      icon: <Science />,
      color: "#3B82F6",
      desc: "Review and approve faculty research publications, textbooks, chapters, patents and project proposals."
    },
    {
      title: "Proctoring Entries",
      count: dashboard.pendingCounts.proctoring,
      path: "/hod/proctoring-approvals",
      icon: <SupervisorAccount />,
      color: "#10B981",
      desc: "Verify semester examination results, GPA distributions and pass count metrics uploaded by department proctors."
    },
    {
      title: "Administration Roles",
      count: dashboard.pendingCounts.administration,
      path: "/hod/administration-approvals",
      icon: <AccountBalance />,
      color: "#8B5CF6",
      desc: "Approve declarations made by department faculty regarding their institutional duties and administrative levels."
    },
    {
      title: "Resource Utilization",
      count: dashboard.pendingCounts.resourceUtilization,
      path: "/hod/value-addition/resource-utilization",
      icon: <PlaylistAddCheckIcon />,
      color: "#EC4899",
      desc: "Approve faculty attendance or organization of short-term courses, workshops and resource person events."
    },
    {
      title: "Contribution & Awards",
      count: dashboard.pendingCounts.contribution,
      path: "/hod/value-addition/contribution",
      icon: <WorkspacePremium />,
      color: "#F59E0B",
      desc: "Review certifications, online course completions, community service details, and institutional awards."
    }
  ];

  return (
    <Box sx={{ p: { xs: 1, sm: 0 } }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "var(--text-primary)", mb: 1 }}>
            HOD Dashboard 👋
          </Typography>
          <Typography variant="body1" sx={{ color: "var(--text-secondary)", opacity: 0.8, mb: 1 }}>
            Monitor department performance, track research achievements, and review faculty declarations.
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
            {dashboard.departments.map((dept, index) => (
              <Chip
                key={index}
                label={dept}
                size="small"
                variant="outlined"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  borderColor: 'var(--border-color)',
                  background: 'var(--bg-panel)',
                  color: 'var(--color-primary)'
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>

      {/* Summary Cards Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {topCards.map((card, i) => (
          <Grid xs={12} sm={6} md={3} key={i}>
            <Card sx={{
              borderRadius: "16px",
              background: 'var(--bg-panel)',
              border: '1px solid var(--border-color)',
              p: 2.5,
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 2,
              position: "relative",
              overflow: "hidden",
              height: "160px",
              boxSizing: "border-box",
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                right: 0,
                width: '120px',
                height: '120px',
                background: `radial-gradient(circle at top right, ${card.color}20, transparent 70%)`,
                zIndex: 0,
                pointerEvents: 'none'
              }
            }}>
              <Box sx={{
                width: 56,
                height: 56,
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: card.bgColor,
                color: card.color,
                flexShrink: 0,
                zIndex: 1
              }}>
                {card.icon}
              </Box>
              <Box sx={{ textAlign: "left", zIndex: 1 }}>
                <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {card.title}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: "var(--text-primary)", my: 0.2, fontSize: '1.6rem' }}>
                  {card.value}
                </Typography>
                <Typography variant="caption" sx={{ color: "var(--text-secondary)", opacity: 0.8, fontSize: '0.7rem' }}>
                  {card.subtitle}
                </Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Grid: Pending Approval Hub & Side Stats */}
      <Grid container spacing={4}>
        {/* Left Side: Pending Actions Hub */}
        <Grid xs={12} lg={8}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)", mb: 2 }}>
              Pending Action Items Hub
            </Typography>
            <Stack spacing={2}>
              {pendingActions.map((action, i) => (
                <Paper
                  key={i}
                  sx={{
                    borderRadius: "20px",
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-panel)",
                    p: 2.5,
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                    transition: "all 0.3s ease",
                    position: "relative",
                    overflow: "hidden",
                    "&:hover": {
                      borderColor: action.color,
                      boxShadow: "var(--shadow-premium)",
                      transform: "scale(1.005)"
                    }
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, flex: 1 }}>
                    <Box sx={{
                      width: 44,
                      height: 44,
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: `${action.color}15`,
                      color: action.color,
                      flexShrink: 0,
                      mt: 0.5
                    }}>
                      {action.icon}
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "var(--text-primary)", mb: 0.5 }}>
                        {action.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "var(--text-secondary)", opacity: 0.8, fontSize: '0.8rem', lineHeight: 1.4 }}>
                        {action.desc}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 3, width: { xs: "100%", sm: "auto" }, justifyContent: "space-between" }}>
                    <Chip
                      label={action.count > 0 ? `${action.count} Pending` : "0 Pending"}
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        bgcolor: action.count > 0 ? `${action.color}20` : "var(--bg-accent-4)",
                        color: action.count > 0 ? action.color : "var(--text-secondary)",
                        border: `1px solid ${action.count > 0 ? `${action.color}35` : "var(--border-color)"}`,
                        borderRadius: "8px",
                        px: 0.5
                      }}
                    />
                    <Button
 variant="contained"
 onClick={() => navigate(action.path)}
 endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
 sx={{
 
 textTransform: "none",
 fontWeight: 700,
 px: 2.5,
 py: 1,
 bgcolor: action.count > 0 ? action.color : "var(--text-secondary)",
 color: "#fff",
 boxShadow: "none",
 "&:hover": {
 bgcolor: action.count > 0 ? `${action.color}dd` : "var(--text-primary)",
 boxShadow: "none"
 }
 }}
 >
                      Review
                    </Button>
                  </Box>
                </Paper>
              ))}
            </Stack>
          </Box>
        </Grid>

        {/* Right Side: Publications PieChart & Faculty Leaderboard */}
        <Grid xs={12} lg={4}>
          {/* Recharts PieChart Card */}
          {/* <Card sx={{
            p: 3,
            borderRadius: '24px',
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-color)',
            mb: 4,
            height: 'fit-content'
          }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)", mb: 2 }}>
              Publications by Type
            </Typography>
            {dashboard.researchStats.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Box sx={{ height: 200, width: '100%', position: 'relative' }}>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={dashboard.researchStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {dashboard.researchStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} cornerRadius={4} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{
                          borderRadius: '12px',
                          background: 'var(--bg-panel)',
                          border: '1px solid var(--border-color)',
                          boxShadow: 'var(--shadow-premium)',
                          fontSize: '0.8rem'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                      {totalPublicationsCount}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Total
                    </Typography>
                  </Box>
                </Box>
                
                
                <Stack spacing={1} sx={{ width: '100%' }}>
                  {dashboard.researchStats.map((item, i) => (
                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: item.color }} />
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          {item.name}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {item.value} ({Math.round((item.value / totalPublicationsCount) * 100)}%)
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontStyle: 'italic' }}>
                  No publication data available yet.
                </Typography>
              </Box>
            )}
          </Card> */}

          {/* Top Faculty Leaderboard */}
          {/* <Card sx={{
            p: 3,
            borderRadius: '24px',
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-color)',
          }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
              <TrendingUp sx={{ color: "var(--color-primary)" }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                Active Research Faculty
              </Typography>
            </Box>
            {dashboard.topFaculty.length > 0 ? (
              <List sx={{ p: 0 }}>
                {dashboard.topFaculty.map((fac, idx) => (
                  <React.Fragment key={fac._id}>
                    <ListItem sx={{ px: 0, py: 1.5, alignItems: 'center' }}>
                      <ListItemAvatar>
                        <Avatar
                          src={fac.profileImage ? `/uploads/profile/${fac.profileImage}` : ""}
                          sx={{
                            bgcolor: 'var(--color-primary)',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            border: '2px solid var(--border-color)'
                          }}
                        >
                          {getInitials(fac.name)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography sx={{ fontWeight: 750, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                            {fac.name}
                          </Typography>
                        }
                        secondary={
                          <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.7rem', opacity: 0.8 }}>
                            {fac.designation || 'Faculty'} • {fac.institutionId}
                          </Typography>
                        }
                      />
                      <Box sx={{ textAlign: 'right' }}>
                        <Chip
                          label={`${fac.activityCount} Work`}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            fontSize: '0.7rem',
                            bgcolor: idx === 0 ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-accent-4)',
                            color: idx === 0 ? '#F59E0B' : 'var(--text-primary)',
                            border: `1px solid ${idx === 0 ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-color)'}`
                          }}
                        />
                      </Box>
                    </ListItem>
                    {idx < dashboard.topFaculty.length - 1 && <Divider component="li" sx={{ opacity: 0.5 }} />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                No active faculty stats recorded.
              </Typography>
            )}
          </Card> */}
        </Grid>
      </Grid>

      {/* Recent Activities Log */}
      <Box sx={{ mt: 4, mb: 2 }}>
        <Card sx={{
          p: 3.5,
          borderRadius: '24px',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-color)',
        }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)", mb: 3 }}>
            Recent Activity Log
          </Typography>
          {dashboard.recentActivities.length > 0 ? (
            <List sx={{ p: 0 }}>
              {dashboard.recentActivities.map((act, idx) => {
                const statusStyle = getStatusStyle(act.status);
                const actDate = new Date(act.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                });

                return (
                  <React.Fragment key={idx}>
                    <ListItem sx={{ px: 0, py: 2.2, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                        <Avatar
                          src={act.profileImage ? `/uploads/profile/${act.profileImage}` : ""}
                          sx={{ bgcolor: 'var(--bg-accent-4)', color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.8rem', width: 36, height: 36 }}
                        >
                          {getInitials(act.facultyName)}
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                            {act.facultyName}
                          </Typography>
                          <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.75rem', opacity: 0.9, mt: 0.2 }}>
                            Submitted {act.type}: <Box component="span" sx={{ fontStyle: 'italic', color: 'var(--text-primary)', fontWeight: 500 }}>"{act.title}"</Box>
                          </Typography>
                        </Box>
                      </Box>

                      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', width: { xs: '100%', md: 'auto' }, justifyContent: { xs: 'space-between', md: 'flex-end' } }}>
                        <Typography sx={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                          {actDate}
                        </Typography>
                        <Chip
                          label={act.status}
                          size="small"
                          sx={{
                            bgcolor: statusStyle.bg,
                            color: statusStyle.color,
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            borderRadius: '6px'
                          }}
                        />
                      </Stack>
                    </ListItem>
                    {idx < dashboard.recentActivities.length - 1 && <Divider component="li" sx={{ opacity: 0.5 }} />}
                  </React.Fragment>
                );
              })}
            </List>
          ) : (
            <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontStyle: 'italic', textAlign: 'center', py: 4 }}>
              No recent activity recorded in the department.
            </Typography>
          )}
        </Card>
      </Box>
    </Box>
  );
};

export default HODDashboard;

