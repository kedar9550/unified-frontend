import Loader from "../../components/common/Loader";
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Button,
  Paper,
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
    expectedAppraisals: 0,
    totalPrograms: 0,
    departments: [],
    pendingCounts: { research: 0, proctoring: 0, administration: 0, resourceUtilization: 0, contribution: 0, total: 0 },
    researchStats: [],
    recentActivities: [],
    topFaculty: []
  };

  const totalPublicationsCount = dashboard.researchStats.reduce((sum, item) => sum + item.value, 0);

  const topCards = [
    { title: "Department Faculty", value: dashboard.totalFaculty, subtitle: "Total Active", icon: <People />, color: "#3B82F6", linkText: "Manage Faculty", path: "/hod/staff" },
    { title: "Expected Appraisals", value: dashboard.expectedAppraisals !== undefined ? dashboard.expectedAppraisals : dashboard.totalFaculty, subtitle: "Total to verify", icon: <Assignment />, color: "#10B981", linkText: "View Appraisals", path: "/hod/appraisal-verification" },
    { title: "Academic Programs", value: dashboard.totalPrograms, subtitle: "Branches Managed", icon: <School />, color: "#A855F7", linkText: "View Programs", path: "/academics/programs" },
    { title: "Pending Reviews", value: dashboard.pendingCounts.total, subtitle: "Actions Required", icon: <WarningAmber />, color: "#F59E0B", linkText: "View Pending", path: "/hod/research-approvals" },
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
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        {topCards.map((card, i) => (
          <Box
            key={i}
            sx={{
              flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 24px)', md: '1 1 calc(25% - 24px)' },
              boxSizing: 'border-box'
            }}
          >
            <Card sx={{
              borderRadius: "16px",
              background: 'var(--bg-panel)',
              border: '1px solid var(--border-color)',
              p: 2.5,
              display: "flex",
              flexDirection: "column",
              position: "relative",
              overflow: "hidden",
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: "var(--shadow-premium)",
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
              }
            }}>
              {/* Top Section */}
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 3, position: "relative", zIndex: 1 }}>
                {/* Icon */}
                <Box sx={{
                  width: 48,
                  height: 48,
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: card.color,
                  color: "#fff",
                  flexShrink: 0,
                  position: "relative",
                  boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(180deg, #ffffff30, transparent)",
                    borderRadius: "12px",
                  },
                }}>
                  {card.icon}
                </Box>
                {/* Text */}
                <Box sx={{ textAlign: "left", flex: 1 }}>
                  <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block' }}>
                    {card.title}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: "var(--text-primary)", my: 0.5, fontSize: '2.125rem', lineHeight: 1 }}>
                    {card.value}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 500, fontSize: '0.75rem' }}>
                    {card.subtitle}
                  </Typography>
                </Box>
              </Box>
              
              {/* Divider */}
              <Box sx={{ borderTop: "1px solid var(--border-color)", mt: 1, pt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                {/* Bottom Link */}
                <Button
                  size="small"
                  onClick={() => card.path && navigate(card.path)}
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
                >
                  {card.linkText}
                </Button>
              </Box>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Main Container: Pending Approval Hub */}
      <Box sx={{ width: '100%' }}>
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
        </Box>

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

