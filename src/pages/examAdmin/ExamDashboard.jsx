import Loader from "../../components/common/Loader";
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  Button,
  Avatar,
  Chip,
  LinearProgress,
  Paper} from "@mui/material";
import { toast } from "sonner";
import {
  People,
  AccessTime,
  CheckCircleOutlined,
  WarningAmber,
  BarChart,
  ArrowForward,
  PictureAsPdf,
  CalendarMonth
} from "@mui/icons-material";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const ExamDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalFaculties: 0,
    submittedFaculties: 0,
    pendingSubmissions: 0,
    submittedResults: 0,
    discrepanciesCount: 0,
    overallPassRate: "0.0%",
    activeYear: "N/A",
    activeSemester: "N/A",
    recentSubmissions: [],
    discrepancies: [],
    submissionChart: []
  });

  const backendUrl = import.meta.env.VITE_BACKEND_URL || "";

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const res = await API.get("/api/dashboard/exam");
        if (res.data.status === 'success') {
          setData(res.data.data);
        } else {
          toast.error("Failed to fetch dashboard metrics");
        }
      } catch (err) {
        console.error("Error fetching exam dashboard data:", err);
        toast.error("Unable to connect to the server. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const getFullAvatarUrl = (avatar, institutionId) => {
    if (avatar) {
      return avatar.startsWith('http') ? avatar : `${backendUrl}${avatar}`;
    }
    if (institutionId) {
      return `https://info.aec.edu.in/aus/employeephotos/${institutionId}.jpg`;
    }
    return "";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // if (loading) {
  //   return (
  //     <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
  //       <Loader />
  //     </Box>
  //   );
  // }

  // Top Cards Data
  const topCards = [
    { title: "Total Faculties", value: data.totalFaculties, subtitle: `100% of ${data.totalFaculties}`, icon: <People />, color: "#3B82F6", bgColor: "rgba(59, 130, 246, 0.1)", path: "/exam-result/faculty-format" },
    { title: "Pending Submissions", value: data.pendingSubmissions, subtitle: `${data.totalFaculties > 0 ? Math.round((data.pendingSubmissions / data.totalFaculties) * 100) : 0}% of ${data.totalFaculties}`, icon: <AccessTime />, color: "#F59E0B", bgColor: "rgba(245, 158, 11, 0.1)", path: "/exam-result/faculty-format" },
    { title: "Submitted Faculties", value: data.submittedFaculties, subtitle: `${data.totalFaculties > 0 ? Math.round((data.submittedFaculties / data.totalFaculties) * 100) : 0}% of ${data.totalFaculties}`, icon: <CheckCircleOutlined />, color: "#10B981", bgColor: "rgba(16, 185, 129, 0.1)", path: "/exam-result/faculty-format" },
    { title: "Discrepancies", value: data.discrepanciesCount, subtitle: "Require Action", icon: <WarningAmber />, color: "#EF4444", bgColor: "rgba(239, 68, 68, 0.1)", path: "/exam-result/discrepancies" },
    { title: "Overall Pass %", value: data.overallPassRate, subtitle: "This Semester", icon: <BarChart />, color: "#8B5CF6", bgColor: "rgba(139, 92, 246, 0.1)", path: "/exam-result/students-format" },
  ];

  // Submission Chart Data
  const submissionData = data.submissionChart.length > 0 ? data.submissionChart : [
    { name: "Submitted", value: 0, color: "#2563EB" },
    { name: "Pending", value: 0, color: "#F59E0B" },
  ];

  const donePercentage = data.totalFaculties > 0 ? Math.round((data.submittedFaculties / data.totalFaculties) * 100) : 0;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "var(--text-primary)", mb: 0.5 }}>
            Welcome back, {user?.name || "Exam Admin"}!
          </Typography>
          <Typography variant="body2" sx={{ color: "var(--text-secondary)" }}>
            Overview of exam results submission and verification.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant="outlined"
            sx={{
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
              textTransform: 'none',
              background: "var(--bg-glass)",
              backdropFilter: "blur(10px)",
              fontWeight: 600,
              "&:hover": { borderColor: "var(--color-primary)", background: "var(--bg-accent-1)" }
            }}
            startIcon={<CalendarMonth sx={{ color: "var(--color-primary)" }} />}
          >
            {data.activeYear}
          </Button>
          <Button
            variant="outlined"
            sx={{
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
              textTransform: 'none',
              background: "var(--bg-glass)",
              backdropFilter: "blur(10px)",
              fontWeight: 600,
              "&:hover": { borderColor: "var(--color-primary)", background: "var(--bg-accent-1)" }
            }}
          >
            {data.activeSemester}
          </Button>
        </Box>
      </Box>

      {/* Row 1: Summary Cards (Box System) */}
      <Box sx={{ display: "flex", gap: 2, mb: 4, flexWrap: "wrap" }}>
        {topCards.map((card, i) => (
          <Box key={i} sx={{ flex: { xs: "1 1 100%", sm: "1 1 calc(50% - 16px)", lg: 1 }, minWidth: 0 }}>
            <Card
              onClick={() => card.path && navigate(card.path)}
              sx={{
                borderRadius: "16px",
                border: "1px solid var(--border-color)",
                background: "var(--bg-panel)",
                boxShadow: "var(--shadow-premium)",
                p: 2.5,
                height: "160px",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 2,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                cursor: card.path ? "pointer" : "default",
                position: "relative",
                overflow: "hidden",
                "&:hover": {
                  transform: card.path ? "translateY(-5px)" : "none",
                  boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
                },
                "&::after": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: "120px",
                  height: "120px",
                  background: `radial-gradient(circle at top right, ${card.color}25, transparent 70%)`,
                  zIndex: 0,
                  pointerEvents: "none"
                },
                "&:hover .view-all-arrow": {
                  transform: "translateX(4px)"
                }
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, zIndex: 1 }}>
                <Box sx={{ width: 48, height: 48, borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: card.bgColor, color: card.color, flexShrink: 0 }}>
                  {card.icon}
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.02em", display: "block" }}>{card.title}</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: "var(--text-primary)", my: 0.1 }}>{card.value}</Typography>
                </Box>
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

      {/* Main Content Layout (Box System) */}
      <Box sx={{ display: "flex", gap: 3, mb: 4, flexWrap: { xs: "wrap", lg: "nowrap" }, alignItems: "stretch" }}>

        {/* Left Column: Overview & Discrepancies */}
        <Box sx={{ flex: { xs: "1 1 100%", lg: "0 0 320px" }, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Submission Overview */}
          <Card sx={{
            borderRadius: "24px",
            background: "var(--bg-panel)",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-premium)",
            p: 2.5,
            display: "flex",
            flexDirection: "column"
          }}>
            <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", mb: 3, color: "var(--text-primary)" }}>Submission Overview</Typography>

            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4, flexWrap: "wrap", justifyContent: "center" }}>
              <Box sx={{ position: "relative", width: 130, height: 130, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height={130}>
                  <PieChart>
                    <Pie data={submissionData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={60} stroke="none" paddingAngle={5}>
                      {submissionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '12px' }}
                      itemStyle={{ color: 'var(--text-primary)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
                  <Typography sx={{ fontSize: 22, fontWeight: 900, color: "var(--text-primary)", lineHeight: 1 }}>{donePercentage}%</Typography>
                  <Typography sx={{ fontSize: 8, color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase" }}>Done</Typography>
                </Box>
              </Box>

              <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1, minWidth: "120px" }}>
                {submissionData.map((item, idx) => (
                  <Box key={idx} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                      <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: item.color }} />
                      <Typography sx={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600 }}>{item.name}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--text-primary)" }}>{item.value}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 600 }}>Progress</Typography>
                <Typography variant="body2" sx={{ color: "var(--color-primary)", fontSize: "0.75rem", fontWeight: 800 }}>{data.submittedFaculties} / {data.totalFaculties}</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={donePercentage}
                sx={{
                  height: 7,
                  borderRadius: 4,
                  bgcolor: "var(--bg-accent-1)",
                  "& .MuiLinearProgress-bar": { background: "var(--gradient-primary)", borderRadius: 4 }
                }}
              />
            </Box>
          </Card>

          {/* Discrepancies */}
          <Card sx={{
            borderRadius: "24px",
            background: "var(--bg-panel)",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-premium)",
            p: 2.5
          }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--text-primary)" }}>Discrepancies</Typography>
              <Button
                onClick={() => navigate("/exam-result/discrepancies")}
                size="small"
                sx={{ textTransform: "none", fontSize: "0.8rem", color: "#EF4444", fontWeight: 700 }}
              >
                View All
              </Button>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {data.discrepancies.length === 0 ? (
                <Typography sx={{ fontSize: "0.85rem", color: "var(--text-secondary)", textAlign: "center", py: 2 }}>No pending discrepancies</Typography>
              ) : data.discrepancies.map((disc, i) => (
                <Paper key={i} elevation={0} sx={{ p: 1.8, borderRadius: "16px", border: "1px solid var(--border-color)", background: "var(--bg-glass)", transition: "all 0.2s ease", "&:hover": { borderColor: "#EF4444", transform: "translateY(-2px)" } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography noWrap sx={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>{disc.name}</Typography>
                      <Typography noWrap sx={{ fontSize: "0.75rem", color: "var(--text-secondary)", mb: 1 }}>{disc.subject}</Typography>
                      <Typography sx={{ fontSize: "0.8rem", color: "#EF4444", fontWeight: 600 }}>{disc.issue}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: "0.65rem", color: "var(--text-secondary)", fontWeight: 700, flexShrink: 0 }}>
                      {formatDate(disc.time)}
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </Box>
          </Card>
        </Box>

        {/* Right Column: Recent Submissions */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Card sx={{
            borderRadius: "24px",
            background: "var(--bg-panel)",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-premium)",
            p: 3,
            height: "100%",
            display: "flex",
            flexDirection: "column"
          }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--text-primary)" }}>Recent Submissions</Typography>
              <Button
                onClick={() => navigate("/exam-result/faculty-format")}
                size="small"
                sx={{ textTransform: "none", fontSize: "0.85rem", color: "var(--color-primary)", fontWeight: 700 }}
              >
                View All
              </Button>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
              {data.recentSubmissions.length === 0 ? (
                <Typography sx={{ fontSize: "0.9rem", color: "var(--text-secondary)", textAlign: "center", py: 4 }}>No recent submissions</Typography>
              ) : data.recentSubmissions.map((sub, i) => (
                <Box
                  key={i}
                  onClick={() => navigate("/exam-result/faculty-format")}
                  sx={{
                    p: 2,
                    borderRadius: "18px",
                    background: "var(--bg-glass)",
                    border: "1px solid var(--border-color)",
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    cursor: "pointer",
                    "&:hover": {
                      transform: "translateX(8px)",
                      borderColor: "var(--color-primary)",
                      background: "var(--bg-accent-1)"
                    }
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 1.5 }, flex: 1, minWidth: 0 }}>
                    <Avatar src={getFullAvatarUrl(sub.avatar, sub.institutionId)} sx={{ width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 }, border: "2px solid var(--bg-panel)", boxShadow: "0 0 0 1px var(--border-color)" }} />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography noWrap sx={{ fontSize: { xs: "0.8rem", sm: "0.9rem" }, fontWeight: 700, color: "var(--text-primary)" }}>{sub.name}</Typography>
                      <Typography noWrap sx={{ fontSize: "0.7rem", color: "var(--text-secondary)", opacity: 0.8 }}>{sub.dept}</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ flex: 1, display: { xs: "none", md: "block" }, minWidth: 0 }}>
                    <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", fontSize: "0.6rem", mb: 0.5, display: "block" }}>Subject / Course</Typography>
                    <Typography noWrap sx={{ fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: 600 }}>{sub.subject}</Typography>
                  </Box>

                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.5, flexShrink: 0 }}>
                    <Chip
                      label={sub.status}
                      size="small"
                      sx={{
                        height: 20, fontSize: "0.6rem", fontWeight: 800,
                        bgcolor: sub.status === "Submitted" ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
                        color: sub.status === "Submitted" ? "#10B981" : "#F59E0B",
                        border: "1px solid currentColor"
                      }}
                    />
                    <Typography sx={{ fontSize: "0.65rem", color: "var(--text-secondary)", fontWeight: 600, display: { xs: "block", sm: "none" } }}>
                      {new Date(sub.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>

                  <Box sx={{ flex: 0.8, textAlign: "right", display: { xs: "none", sm: "block" } }}>
                    <Typography sx={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                      {formatDate(sub.time)}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            <Box sx={{ mt: 3, pt: 2, borderTop: "1px solid var(--border-color)", textAlign: "center" }}>
              <Button
                onClick={() => navigate("/exam-result/faculty-format")}
                endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                sx={{ textTransform: "none", fontSize: "0.9rem", color: "var(--color-primary)", fontWeight: 700 }}
              >
                Explore All Submissions
              </Button>
            </Box>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default ExamDashboard;
