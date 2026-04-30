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

const FeedbackCoordinatorDashboard = () => {
  // Top Cards Data
  const topCards = [
    { title: "Total Faculty", value: "60", subtitle: "Active Faculty", icon: <People />, color: "#3B82F6", bgColor: "#EFF6FF" },
    { title: "Pending Feedbacks", value: "12", subtitle: "Require Review", icon: <AccessTime />, color: "#F59E0B", bgColor: "#FEF3C7" },
    { title: "Processed Feedbacks", value: "48", subtitle: "Completed", icon: <CheckCircleOutlined />, color: "#10B981", bgColor: "#ECFDF5" },
    { title: "Low Ratings", value: "3", subtitle: "Require Action", icon: <WarningAmber />, color: "#EF4444", bgColor: "#FEF2F2" },
    { title: "Avg Rating", value: "4.6/5", subtitle: "This Semester", icon: <StarBorder />, color: "#8B5CF6", bgColor: "#F5F3FF" },
  ];

  // Submission Chart Data
  const feedbackData = [
    { name: "Processed", value: 48, color: "#2563EB" },
    { name: "Pending", value: 12, color: "#F59E0B" },
    { name: "Low Ratings", value: 3, color: "#EF4444" },
  ];

  const recentFeedbacks = [
    { name: "Dr. Zoya Tiwari", dept: "CSE Department", subject: "Data Structures (CSE-A)", rating: "4.8", status: "Processed", time: "10 mins ago", avatar: "" },
    { name: "Dr. Mahesh Reddy", dept: "CSE Department", subject: "Operating Systems (CSE-B)", rating: "4.5", status: "Processed", time: "30 mins ago", avatar: "" },
    { name: "Dr. Priya Sharma", dept: "ECE Department", subject: "Digital Electronics (ECE-A)", rating: "4.9", status: "Processed", time: "1 hour ago", avatar: "" },
    { name: "Dr. Arjun Verma", dept: "ME Department", subject: "Thermodynamics (ME-A)", rating: "-", status: "Pending", time: "2 hours ago", avatar: "" },
    { name: "Dr. Neha Gupta", dept: "AI & DS Department", subject: "Database Systems (AI-DS-A)", rating: "-", status: "Pending", time: "2 hours ago", avatar: "" },
  ];

  const discrepancies = [
    { name: "Dr. Prakash Rao", subject: "Compiler Design (CSE-C)", issue: "Average rating below 3.0", detail: "Multiple complaints regarding syllabus pace.", time: "1 day ago" },
    { name: "Prof. Anjali Desai", subject: "Machine Learning (AI-A)", issue: "Inconsistent feedback scores", detail: "High variance between student sections.", time: "2 days ago" },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: "#1a237e", mb: 0.5 }}>
            Welcome back, Feedback Admin! 👋
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Overview of faculty feedback collection and analysis.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
           <Button variant="outlined" sx={{ borderRadius: 2, borderColor: '#e0e0e0', color: '#424242', textTransform: 'none' }} startIcon={<CalendarMonth />}>
             2026-2027
           </Button>
           <Button variant="outlined" sx={{ borderRadius: 2, borderColor: '#e0e0e0', color: '#424242', textTransform: 'none' }}>
             ODD Semester
           </Button>
        </Box>
      </Box>

      {/* Row 1: Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {topCards.map((card, i) => (
          <Grid item key={i} xs={12} sm={6} md={4} lg sx={{ flex: "1 1 0", minWidth: 0 }}>
            <Card sx={{ borderRadius: 2, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", p: 2, height: "100%", display: "flex", alignItems: "center", gap: 2}}>
              <Box sx={{ width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: card.bgColor, color: card.color, flexShrink: 0 }}>
                {card.icon}
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "#6B7280", fontWeight: 600 }}>{card.title}</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: "#111827", my: 0.3 }}>{card.value}</Typography>
                <Typography variant="caption" sx={{ color: "#9CA3AF" }}>{card.subtitle}</Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Row 2: Overview & Recent Feedbacks */}
      <Box sx={{ display: "flex", gap: 3, flexWrap: { xs: "wrap", lg: "nowrap" }, mb: 4, alignItems: "flex-start" }}>
        {/* Feedback Overview */}
        <Box sx={{ width: { xs: "100%", lg: "40%" }}}>
          <Card sx={{ borderRadius: 2, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", p: 3, width: "100%", display: "flex", flexDirection: "column" }}>
            <Typography sx={{ fontWeight: 700, fontSize: "1.05rem", mb: 3 }}>Feedback Overview</Typography>
            
            <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 4 }}>
              <Box sx={{ position: "relative", width: 140, height: 140 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={feedbackData} dataKey="value" innerRadius={50} outerRadius={70} stroke="none">
                      {feedbackData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
                  <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#111827", lineHeight: 1.1 }}>80%</Typography>
                  <Typography sx={{ fontSize: 10, color: "#6B7280" }}>Processed</Typography>
                </Box>
              </Box>
              
              <Box sx={{ flex: 1 }}>
                {feedbackData.map((item, idx) => (
                  <Box key={idx} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: item.color }} />
                      <Typography sx={{ fontSize: 13, color: "#4B5563" }}>{item.name}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{item.value} <span style={{color: "#9CA3AF", fontWeight: 400}}>({item.value === 48 ? '80%' : item.value === 12 ? '20%' : '5%'})</span></Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            <Typography variant="body2" sx={{ color: "#4B5563", mb: 1 }}>48 of 60 faculties have been evaluated</Typography>
            <LinearProgress variant="determinate" value={80} sx={{ height: 8, borderRadius: 4, bgcolor: "#E5E7EB", "& .MuiLinearProgress-bar": { bgcolor: "#2563EB" } }} />
          </Card>
        </Box>

        {/* Recent Feedbacks */}
        <Box sx={{ width: { xs: "100%", lg: "60%" }}}>
          <Card sx={{ borderRadius: 2, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", p: 3, width: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Typography sx={{ fontWeight: 700, fontSize: "1.05rem" }}>Recent Evaluations</Typography>
              <Button size="small" sx={{ textTransform: "none", fontSize: "0.8rem", color: "#2563EB" }}>View All</Button>
            </Box>

            <TableContainer>
              <Table sx={{ minWidth: 500 }} aria-label="recent evaluations table">
                <TableHead sx={{ borderBottom: "1px solid #F3F4F6" }}>
                  <TableRow>
                    <TableCell sx={{ color: "#6B7280", fontWeight: 600, py: 1.5, borderBottom: "none" }}>Faculty</TableCell>
                    <TableCell sx={{ color: "#6B7280", fontWeight: 600, py: 1.5, borderBottom: "none" }}>Subject / Course</TableCell>
                    <TableCell sx={{ color: "#6B7280", fontWeight: 600, py: 1.5, borderBottom: "none" }}>Rating</TableCell>
                    <TableCell sx={{ color: "#6B7280", fontWeight: 600, py: 1.5, borderBottom: "none" }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentFeedbacks.map((fb, i) => (
                    <TableRow key={i} sx={{ borderBottom: i < recentFeedbacks.length - 1 ? "1px solid #F9FAFB" : "none" }}>
                      <TableCell sx={{ py: 1.5, borderBottom: "none" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Avatar src={fb.avatar} sx={{ width: 32, height: 32 }} />
                          <Box>
                            <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "#111827" }}>{fb.name}</Typography>
                            <Typography sx={{ fontSize: "0.75rem", color: "#6B7280" }}>{fb.dept}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 1.5, borderBottom: "none" }}>
                        <Typography sx={{ fontSize: "0.85rem", color: "#4B5563" }}>{fb.subject}</Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.5, borderBottom: "none" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <StarBorder sx={{ fontSize: 16, color: "#F59E0B" }} />
                          <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>{fb.rating}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 1.5, borderBottom: "none" }}>
                        <Chip label={fb.status} size="small" sx={{ height: 20, fontSize: "0.7rem", fontWeight: 600, bgcolor: fb.status === "Processed" ? "#ECFDF5" : "#FFF7ED", color: fb.status === "Processed" ? "#10B981" : "#F59E0B" }} />
                        <Typography sx={{ fontSize: "0.7rem", color: "#9CA3AF", mt: 0.5, display: 'block' }}>{fb.time}</Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: "auto", pt: 2, textAlign: "center" }}>
              <Button size="small" endIcon={<ArrowForward sx={{ fontSize: 16 }} />} sx={{ textTransform: "none", fontSize: "0.85rem", color: "#F59E0B", fontWeight: 600 }}>
                View All Evaluations
              </Button>
            </Box>
          </Card>
        </Box>
      </Box>

      {/* Row 3: Discrepancies */}
      <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", mb: 4 }}>
        <Box sx={{ width: { xs: "100%", lg: "50%" }, display: "flex" }}>
          <Card sx={{ borderRadius: 2, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", p: 3, width: "100%", bgcolor: "#FAFAFA" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Typography sx={{ fontWeight: 700, fontSize: "1.05rem", color: "#111827" }}>Feedback Alerts Requiring Attention</Typography>
              <Button size="small" sx={{ textTransform: "none", fontSize: "0.8rem", color: "#2563EB" }}>View All</Button>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {discrepancies.map((disc, i) => (
                <Paper key={i} elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #FCA5A5", bgcolor: "#FEF2F2" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "#111827" }}>{disc.name}</Typography>
                      <Typography sx={{ fontSize: "0.75rem", color: "#6B7280", mb: 1 }}>{disc.subject}</Typography>
                      <Typography sx={{ fontSize: "0.8rem", color: "#4B5563" }}>{disc.issue}</Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                        <FeedbackIcon sx={{ fontSize: 14, color: "#EF4444" }} />
                        <Typography sx={{ fontSize: "0.75rem", color: "#6B7280" }}>{disc.detail}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
                      <Typography sx={{ fontSize: "0.7rem", color: "#9CA3AF" }}>{disc.time}</Typography>
                      <Button variant="outlined" color="error" size="small" sx={{ textTransform: "none", fontSize: "0.75rem", px: 2, borderRadius: 4 }}>
                        Review
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Box>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default FeedbackCoordinatorDashboard;
