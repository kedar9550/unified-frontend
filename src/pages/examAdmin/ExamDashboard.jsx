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
} from "@mui/material";
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

const ExamDashboard = () => {
  // Top Cards Data
  const topCards = [
    { title: "Total Faculties", value: "60", subtitle: "100% of 60", icon: <People />, color: "#3B82F6", bgColor: "#EFF6FF" },
    { title: "Pending Submissions", value: "15", subtitle: "25% of 60", icon: <AccessTime />, color: "#F59E0B", bgColor: "#FEF3C7" },
    { title: "Submitted Results", value: "42", subtitle: "70% of 60", icon: <CheckCircleOutlined />, color: "#10B981", bgColor: "#ECFDF5" },
    { title: "Discrepancies", value: "3", subtitle: "Require Action", icon: <WarningAmber />, color: "#EF4444", bgColor: "#FEF2F2" },
    { title: "Overall Pass %", value: "78.6%", subtitle: "This Semester", icon: <BarChart />, color: "#F59E0B", bgColor: "#FEF3C7" },
  ];

  // Submission Chart Data
  const submissionData = [
    { name: "Submitted", value: 42, color: "#2563EB" },
    { name: "Pending", value: 15, color: "#F59E0B" },
    { name: "Not Submitted", value: 3, color: "#f87070ff" },
  ];

  const recentSubmissions = [
    { name: "Dr. Zoya Tiwari", dept: "CSE Department", subject: "Data Structures (CSE-A)", status: "Submitted", time: "10 mins ago", avatar: "" },
    { name: "Dr. Mahesh Reddy", dept: "CSE Department", subject: "Operating Systems (CSE-B)", status: "Submitted", time: "30 mins ago", avatar: "" },
    { name: "Dr. Priya Sharma", dept: "ECE Department", subject: "Digital Electronics (ECE-A)", status: "Submitted", time: "1 hour ago", avatar: "" },
    { name: "Dr. Arjun Verma", dept: "ME Department", subject: "Thermodynamics (ME-A)", status: "Pending", time: "2 hours ago", avatar: "" },
    { name: "Dr. Neha Gupta", dept: "AI & DS Department", subject: "Database Systems (AI-DS-A)", status: "Pending", time: "2 hours ago", avatar: "" },
  ];

  const discrepancies = [
    { name: "Dr. Priya Sharma", subject: "Operating Systems (CSE-A)", issue: "Incorrect pass percentage", file: "proof_os_cse_a.pdf", time: "10 mins ago" },
    { name: "Dr. Arjun Verma", subject: "Data Structures (CSE-B)", issue: "Mismatch in student count", file: "proof_ds_cse_b.pdf", time: "25 mins ago" },
    { name: "Dr. Neha Gupta", subject: "Database Management (CSE-A)", issue: "Incorrect number of passes", file: "proof_dbms_cse_a.pdf", time: "35 mins ago" },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: "#1a237e", mb: 0.5 }}>
            Welcome back, Exam Admin! 👋
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Overview of exam results submission and verification.
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
              {/* borderBottom: `4px solid ${card.color}`  */}
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

      {/* Row 2: Overview & Recent Submissions */}
      <Box sx={{ display: "flex", gap: 3, flexWrap: { xs: "wrap", lg: "nowrap" }, mb: 4,alignItems: "flex-start" }}>
        {/* Submission Overview */}
        <Box sx={{ width: { xs: "100%", lg: "40%" }}}>
          <Card sx={{ borderRadius: 2, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", p: 3, width: "100%", display: "flex", flexDirection: "column" }}>
            <Typography sx={{ fontWeight: 700, fontSize: "1.05rem", mb: 3 }}>Submission Overview</Typography>
            
            <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 4 }}>
              <Box sx={{ position: "relative", width: 140, height: 140 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={submissionData} dataKey="value" innerRadius={50} outerRadius={70} stroke="none">
                      {submissionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
                  <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#111827", lineHeight: 1.1 }}>70%</Typography>
                  <Typography sx={{ fontSize: 10, color: "#6B7280" }}>Completed</Typography>
                </Box>
              </Box>
              
              <Box sx={{ flex: 1 }}>
                {submissionData.map((item, idx) => (
                  <Box key={idx} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: item.color }} />
                      <Typography sx={{ fontSize: 13, color: "#4B5563" }}>{item.name}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{item.value} <span style={{color: "#9CA3AF", fontWeight: 400}}>({item.value === 42 ? '70%' : item.value === 15 ? '25%' : '5%'})</span></Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            <Typography variant="body2" sx={{ color: "#4B5563", mb: 1 }}>42 of 60 faculties have submitted results</Typography>
            <LinearProgress variant="determinate" value={70} sx={{ height: 8, borderRadius: 4, bgcolor: "#E5E7EB", "& .MuiLinearProgress-bar": { bgcolor: "#2563EB" } }} />
          </Card>
        </Box>

        {/* Recent Submissions */}
        <Box sx={{ width: { xs: "100%", lg: "60%" }}}>
          <Card sx={{ borderRadius: 2, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", p: 3, width: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Typography sx={{ fontWeight: 700, fontSize: "1.05rem" }}>Recent Submissions</Typography>
              <Button size="small" sx={{ textTransform: "none", fontSize: "0.8rem", color: "#2563EB" }}>View All</Button>
            </Box>

            <Box sx={{ overflowX: "auto" }}>
              <Grid container sx={{ borderBottom: "1px solid #F3F4F6", pb: 1, mb: 1 }}>
                <Grid item xs={4}><Typography variant="caption" sx={{ color: "#6B7280", fontWeight: 600 }}>Faculty</Typography></Grid>
                <Grid item xs={4}><Typography variant="caption" sx={{ color: "#6B7280", fontWeight: 600 }}>Subject / Course</Typography></Grid>
                <Grid item xs={2}><Typography variant="caption" sx={{ color: "#6B7280", fontWeight: 600 }}>Status</Typography></Grid>
                <Grid item xs={2}><Typography variant="caption" sx={{ color: "#6B7280", fontWeight: 600 }}>Submitted At</Typography></Grid>
              </Grid>

              {recentSubmissions.map((sub, i) => (
                <Grid container key={i} alignItems="center" sx={{ py: 1.5, borderBottom: i < recentSubmissions.length - 1 ? "1px solid #F9FAFB" : "none" }}>
                  <Grid item xs={4} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Avatar src={sub.avatar} sx={{ width: 32, height: 32 }} />
                    <Box>
                      <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "#111827" }}>{sub.name}</Typography>
                      <Typography sx={{ fontSize: "0.75rem", color: "#6B7280" }}>{sub.dept}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography sx={{ fontSize: "0.85rem", color: "#4B5563" }}>{sub.subject}</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Chip label={sub.status} size="small" sx={{ height: 20, fontSize: "0.7rem", fontWeight: 600, bgcolor: sub.status === "Submitted" ? "#ECFDF5" : "#FFF7ED", color: sub.status === "Submitted" ? "#10B981" : "#F59E0B" }} />
                  </Grid>
                  <Grid item xs={2}>
                    <Typography sx={{ fontSize: "0.8rem", color: "#6B7280" }}>{sub.time}</Typography>
                  </Grid>
                </Grid>
              ))}
            </Box>

            <Box sx={{ mt: "auto", pt: 2, textAlign: "center" }}>
              <Button size="small" endIcon={<ArrowForward sx={{ fontSize: 16 }} />} sx={{ textTransform: "none", fontSize: "0.85rem", color: "#F59E0B", fontWeight: 600 }}>
                View All Submissions
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
              <Typography sx={{ fontWeight: 700, fontSize: "1.05rem", color: "#111827" }}>Discrepancies Requiring Attention</Typography>
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
                        <PictureAsPdf sx={{ fontSize: 14, color: "#EF4444" }} />
                        <Typography sx={{ fontSize: "0.75rem", color: "#6B7280" }}>{disc.file}</Typography>
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

export default ExamDashboard;
