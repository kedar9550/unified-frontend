import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  Button,
  Avatar,
  Chip,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  People,
  AccessTime,
  CheckCircleOutlined,
  WarningAmber,
  StarBorder,
  ArrowForward,
  Feedback as FeedbackIcon,
  CalendarMonth,
  ThumbUpAlt
} from "@mui/icons-material";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";
import { CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";

const FeedbackCoordinatorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [dashboardData, setDashboardData] = React.useState({
    totalFaculties: 0,
    processedFeedbacks: 0,
    pendingFeedbacks: 0,
    lowRatings: 0,
    avgRating: "0.0/5",
    activeYear: "N/A",
    activeSemester: "N/A",
    recentFeedbacks: [],
    discrepancies: [],
    chartData: []
  });

  React.useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await API.get("/api/dashboard/feedback");
        if (res.data && res.data.data) {
          setDashboardData(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch feedback dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const topCards = [
    { title: "Total Faculty", value: dashboardData.totalFaculties, subtitle: "In System", icon: <People />, color: "#3B82F6", bgColor: "var(--bg-accent-4)", path: "/feedback-management" },
    { title: "Pending Feedbacks", value: dashboardData.pendingFeedbacks, subtitle: "Require Review", icon: <AccessTime />, color: "#F59E0B", bgColor: "var(--bg-accent-3)", path: "/feedback-management" },
    { title: "Processed Feedbacks", value: dashboardData.processedFeedbacks, subtitle: "Completed", icon: <CheckCircleOutlined />, color: "#10B981", bgColor: "var(--bg-accent-2)", path: "/feedback-management" },
    { title: "Low Ratings", value: dashboardData.lowRatings, subtitle: "Require Action", icon: <WarningAmber />, color: "#EF4444", bgColor: "var(--bg-accent-5)", path: "/feedback-management" },
    { title: "Avg Rating", value: dashboardData.avgRating, subtitle: dashboardData.activeYear, icon: <StarBorder />, color: "#8B5CF6", bgColor: "var(--bg-accent-3)", path: "/feedback-management" },
  ];

  return (
    <Box>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Header */}
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: "var(--text-primary)", mb: 0.5, letterSpacing: "-0.02em" }}>
                Welcome back, {user?.name?.split(' ')[0] || "Feedback Admin"}! 👋
              </Typography>
              <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 500 }}>
                University Faculty Feedback Analysis • {dashboardData.activeYear}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button variant="outlined" sx={{ borderRadius: "12px", borderColor: 'var(--border-color)', color: 'var(--text-primary)', textTransform: 'none', px: 2, py: 1, background: "var(--bg-panel)" }} startIcon={<CalendarMonth sx={{ color: "var(--color-primary)" }} />}>
                {dashboardData.activeYear}
              </Button>
              <Chip label={dashboardData.activeSemester} variant="outlined" sx={{ fontWeight: 700, borderRadius: "12px", border: "1px solid var(--border-color)", color: "var(--color-primary)", px: 1 }} />
            </Box>
          </Box>

          <Grid container spacing={2} sx={{ mb: 4 }}>
            {topCards.map((card, i) => (
              <Grid key={i} sx={{ flex: { xs: "1 1 100%", sm: "1 1 45%", md: "1 1 30%", lg: "1 1 0" }, minWidth: 0 }}>
                <Card 
                  onClick={() => navigate(card.path)}
                  sx={{
                  borderRadius: 1,
                  boxShadow: "var(--shadow-premium)",
                  border: "1px solid var(--border-color)",
                  p: 2.5,
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  background: "var(--bg-panel)",
                  transition: "transform 0.2s",
                  cursor: "pointer",
                  "&:hover": { transform: "translateY(-4px)" }
                }}>
                  <Box sx={{ width: 52, height: 52, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: card.bgColor, color: card.color, flexShrink: 0 }}>
                    {card.icon}
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.5px" }}>{card.title}</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: "var(--text-primary)", my: 0.2 }}>{card.value}</Typography>
                    <Typography variant="caption" sx={{ color: "var(--text-secondary)", opacity: 0.8 }}>{card.subtitle}</Typography>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>

      {/* Row 2: Overview & Recent Feedbacks */}
      <Box sx={{ display: "flex", gap: 3, flexWrap: { xs: "wrap", lg: "nowrap" }, mb: 4, alignItems: "flex-start" }}>
            {/* Feedback Overview */}
            <Box sx={{ width: { xs: "100%", lg: "40%" } }}>
              <Card 
                onClick={() => navigate("/feedback-management")}
                sx={{ borderRadius: 1, boxShadow: "var(--shadow-premium)", border: "1px solid var(--border-color)", p: 3, width: "100%", display: "flex", flexDirection: "column", background: "var(--bg-panel)", cursor: "pointer", transition: "transform 0.2s", "&:hover": { transform: "translateY(-4px)" } }}
              >
                <Typography sx={{ fontWeight: 700, fontSize: "1.1rem", mb: 3, color: "var(--text-primary)" }}>Performance Overview</Typography>

                <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 4, flexDirection: { xs: "column", sm: "row" } }}>
                  <Box sx={{ position: "relative", width: 150, height: 150, flexShrink: 0 }}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50}>
                      <PieChart>
                        <Pie data={dashboardData.chartData} dataKey="value" innerRadius={55} outerRadius={75} stroke="none">
                          {dashboardData.chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
                      <Typography sx={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>
                        {dashboardData.totalFaculties > 0 ? Math.round((dashboardData.processedFeedbacks / dashboardData.totalFaculties) * 100) : 0}%
                      </Typography>
                      <Typography sx={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 700 }}>DONE</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ flex: 1, width: "100%" }}>
                    {dashboardData.chartData.map((item, idx) => (
                      <Box key={idx} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: item.color }} />
                          <Typography sx={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>{item.name}</Typography>
                        </Box>
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{item.value}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>

                <Typography variant="body2" sx={{ color: "var(--text-secondary)", mb: 1, fontWeight: 500 }}>
                  {dashboardData.processedFeedbacks} of {dashboardData.totalFaculties} evaluations processed
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={dashboardData.totalFaculties > 0 ? (dashboardData.processedFeedbacks / dashboardData.totalFaculties) * 100 : 0}
                  sx={{ height: 10, borderRadius: 5, bgcolor: "var(--bg-accent-1)", "& .MuiLinearProgress-bar": { bgcolor: "var(--color-primary)", borderRadius: 5 } }}
                />
              </Card>
            </Box>

            {/* Recent Feedbacks */}
            <Box sx={{ width: { xs: "100%", lg: "60%" } }}>
              <Card sx={{ borderRadius: 1, boxShadow: "var(--shadow-premium)", border: "1px solid var(--border-color)", p: 3, width: "100%", display: "flex", flexDirection: "column", background: "var(--bg-panel)" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text-primary)" }}>Recent Evaluations</Typography>
                  <Button 
                    onClick={() => navigate("/feedback-management")}
                    size="small" 
                    endIcon={<ArrowForward />} 
                    sx={{ textTransform: "none", fontSize: "0.85rem", color: "var(--color-primary)", fontWeight: 700 }}
                  >
                    View All Results
                  </Button>
                </Box>

                <TableContainer>
                  <Table sx={{ minWidth: 500 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: "var(--text-secondary)", fontWeight: 700, borderBottom: "1px solid var(--border-color)", fontSize: "0.75rem" }}>FACULTY</TableCell>
                        <TableCell sx={{ color: "var(--text-secondary)", fontWeight: 700, borderBottom: "1px solid var(--border-color)", fontSize: "0.75rem" }}>SUBJECT / COURSE</TableCell>
                        <TableCell sx={{ color: "var(--text-secondary)", fontWeight: 700, borderBottom: "1px solid var(--border-color)", fontSize: "0.75rem" }}>RATING</TableCell>
                        <TableCell sx={{ color: "var(--text-secondary)", fontWeight: 700, borderBottom: "1px solid var(--border-color)", fontSize: "0.75rem" }}>STATUS</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dashboardData.recentFeedbacks.map((fb, i) => (
                        <TableRow 
                          key={i} 
                          hover 
                          onClick={() => navigate("/feedback-management")}
                          sx={{ cursor: "pointer", "&:last-child td": { borderBottom: 0 } }}
                        >
                          <TableCell sx={{ py: 2, borderBottom: "1px solid var(--border-color)" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                              <Avatar src={fb.avatar} sx={{ width: 36, height: 36, bgcolor: "var(--bg-accent-1)", color: "var(--color-primary)", fontWeight: 700 }}>{fb.name.charAt(0)}</Avatar>
                              <Box>
                                <Typography sx={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>{fb.name}</Typography>
                                <Typography sx={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{fb.dept}</Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ py: 2, borderBottom: "1px solid var(--border-color)" }}>
                            <Typography sx={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>{fb.subject}</Typography>
                          </TableCell>
                          <TableCell sx={{ py: 2, borderBottom: "1px solid var(--border-color)" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <StarBorder sx={{ fontSize: 18, color: "#F59E0B" }} />
                              <Typography sx={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--text-primary)" }}>{fb.rating}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ py: 2, borderBottom: "1px solid var(--border-color)" }}>
                            <Chip
                              label={fb.status}
                              size="small"
                              sx={{
                                fontWeight: 700,
                                fontSize: "0.7rem",
                                borderRadius: "6px",
                                bgcolor: fb.status === "Processed" ? "var(--bg-accent-2)" : "var(--bg-accent-3)",
                                color: fb.status === "Processed" ? "#10B981" : "#F59E0B",
                                height: 24
                              }}
                            />
                            <Typography sx={{ fontSize: "0.7rem", color: "var(--text-secondary)", mt: 0.5, fontWeight: 500 }}>
                              {new Date(fb.time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </Box>
      </Box>

          {/* Row 3: Discrepancies */}
          <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", mb: 4 }}>
            <Box sx={{ width: "100%", display: "flex" }}>
              <Card sx={{ borderRadius: 1, boxShadow: "var(--shadow-premium)", border: "1px solid var(--border-color)", p: 3, width: "100%", background: "var(--bg-panel)" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--text-primary)" }}>Recent Feedback Discrepancies</Typography>
                  <Button 
                    onClick={() => navigate("/feedback-management/discrepancies")}
                    size="small" 
                    endIcon={<ArrowForward />} 
                    sx={{ textTransform: "none", fontSize: "0.85rem", color: "var(--color-primary)", fontWeight: 700 }}
                  >
                    View All Discrepancies
                  </Button>
                </Box>

                <Grid container spacing={3}>
                  {dashboardData.discrepancies.length > 0 ? (
                    dashboardData.discrepancies.map((disc, i) => (
                      <Grid item xs={12} md={6} key={i}>
                        <Paper 
                          variant="outlined" 
                          onClick={() => navigate("/feedback-management/discrepancies")}
                          sx={{ p: 2.5, borderRadius: "12px", border: "1px solid var(--border-color)", background: "var(--bg-paper)", transition: "all 0.2s", cursor: "pointer", "&:hover": { borderColor: "#EF4444", transform: "scale(1.01)" } }}
                        >
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography sx={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-primary)" }}>{disc.name}</Typography>
                              <Typography sx={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600, mb: 1.5 }}>{disc.subject}</Typography>
                              <Typography sx={{ fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: 500, lineHeight: 1.4 }}>{disc.issue}</Typography>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1.5 }}>
                                <FeedbackIcon sx={{ fontSize: 16, color: "#EF4444" }} />
                                <Typography sx={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 500 }}>{disc.detail}</Typography>
                              </Box>
                            </Box>
                            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                              <Typography sx={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontWeight: 600 }}>{new Date(disc.time).toLocaleDateString()}</Typography>
                              <Button 
                                onClick={() => navigate("/feedback-management/discrepancies")}
                                variant="contained" 
                                color="error" 
                                size="small" 
                                sx={{ textTransform: "none", fontSize: "0.75rem", borderRadius: "8px", fontWeight: 700, boxShadow: "none" }}
                              >
                                Resolve
                              </Button>
                            </Box>
                          </Box>
                        </Paper>
                      </Grid>
                    ))
                  ) : (
                    <Grid item xs={12}>
                      <Box sx={{ textAlign: 'center', py: 4, bgcolor: 'var(--bg-paper)', borderRadius: 1, border: '1px dashed var(--border-color)' }}>
                        <ThumbUpAlt sx={{ fontSize: 40, color: '#10B981', mb: 1, opacity: 0.5 }} />
                        <Typography sx={{ color: 'var(--text-secondary)', fontWeight: 600 }}>No pending feedback discrepancies found.</Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Card>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

export default FeedbackCoordinatorDashboard;
