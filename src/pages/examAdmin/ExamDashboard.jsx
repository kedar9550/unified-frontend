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
    { title: "Total Faculties", value: "60", subtitle: "100% of 60", icon: <People />, color: "#3B82F6", bgColor: "rgba(59, 130, 246, 0.1)" },
    { title: "Pending Submissions", value: "15", subtitle: "25% of 60", icon: <AccessTime />, color: "#F59E0B", bgColor: "rgba(245, 158, 11, 0.1)" },
    { title: "Submitted Results", value: "42", subtitle: "70% of 60", icon: <CheckCircleOutlined />, color: "#10B981", bgColor: "rgba(16, 185, 129, 0.1)" },
    { title: "Discrepancies", value: "3", subtitle: "Require Action", icon: <WarningAmber />, color: "#EF4444", bgColor: "rgba(239, 68, 68, 0.1)" },
    { title: "Overall Pass %", value: "78.6%", subtitle: "This Semester", icon: <BarChart />, color: "#F59E0B", bgColor: "rgba(245, 158, 11, 0.1)" },
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
          <Typography variant="h4" sx={{ fontWeight: 800, color: "var(--text-primary)", mb: 0.5 }}>
            Welcome back, Exam Admin! 👋
          </Typography>
          <Typography variant="body2" sx={{ color: "var(--text-secondary)" }}>
            Overview of exam results submission and verification.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
           <Button 
            variant="outlined" 
            sx={{ 
                borderRadius: "12px", 
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
             2026-2027
           </Button>
           <Button 
            variant="outlined" 
            sx={{ 
                borderRadius: "12px", 
                borderColor: 'var(--border-color)', 
                color: 'var(--text-primary)', 
                textTransform: 'none', 
                background: "var(--bg-glass)",
                backdropFilter: "blur(10px)",
                fontWeight: 600,
                "&:hover": { borderColor: "var(--color-primary)", background: "var(--bg-accent-1)" }
            }}
           >
             ODD Semester
           </Button>
        </Box>
      </Box>

      {/* Row 1: Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {topCards.map((card, i) => (
          <Grid item key={i} xs={12} sm={6} md={4} lg sx={{ flex: "1 1 0", minWidth: 0 }}>
            <Card sx={{ borderRadius: "16px", border: "1px solid var(--border-color)", background: "var(--bg-panel)", boxShadow: "var(--shadow-premium)", p: 2, height: "100%", display: "flex", alignItems: "center", gap: 2}}>
              <Box sx={{ width: 48, height: 48, borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: card.bgColor, color: card.color, flexShrink: 0 }}>
                {card.icon}
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.02em" }}>{card.title}</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "var(--text-primary)", my: 0.1 }}>{card.value}</Typography>
                <Typography variant="caption" sx={{ color: "var(--text-secondary)", opacity: 0.8 }}>{card.subtitle}</Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Row 2: Overview & Recent Submissions */}
      <Box sx={{ display: "flex", gap: 3, flexWrap: { xs: "wrap", lg: "nowrap" }, mb: 4,alignItems: "flex-start" }}>
        {/* Submission Overview */}
        <Box sx={{ width: { xs: "100%", lg: "40%" }}}>
          <Card sx={{ borderRadius: "20px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-premium)", p: 3, width: "100%", display: "flex", flexDirection: "column" }}>
            <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", mb: 3, color: "var(--text-primary)" }}>Submission Overview</Typography>
            
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
                  <Typography sx={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.1 }}>70%</Typography>
                  <Typography sx={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>Completed</Typography>
                </Box>
              </Box>
              
              <Box sx={{ flex: 1 }}>
                {submissionData.map((item, idx) => (
                  <Box key={idx} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: item.color }} />
                      <Typography sx={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>{item.name}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{item.value} <span style={{color: "var(--text-secondary)", fontWeight: 400, fontSize: "0.75rem"}}>({item.value === 42 ? '70%' : item.value === 15 ? '25%' : '5%'})</span></Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            <Typography variant="body2" sx={{ color: "var(--text-secondary)", mb: 1.5, fontSize: "0.85rem", fontWeight: 500 }}>42 of 60 faculties have submitted results</Typography>
            <LinearProgress variant="determinate" value={70} sx={{ height: 10, borderRadius: 5, bgcolor: "var(--bg-accent-1)", "& .MuiLinearProgress-bar": { bgcolor: "#2563EB", borderRadius: 5 } }} />
          </Card>
        </Box>

        {/* Recent Submissions */}
        <Box sx={{ width: { xs: "100%", lg: "60%" }}}>
          <Card sx={{ borderRadius: "20px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-premium)", p: 3, width: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--text-primary)" }}>Recent Submissions</Typography>
              <Button size="small" sx={{ textTransform: "none", fontSize: "0.8rem", color: "var(--color-primary)", fontWeight: 700 }}>View All</Button>
            </Box>

            <Box sx={{ overflowX: "auto" }}>
              <Grid container sx={{ borderBottom: "1px solid var(--border-color)", pb: 1.5, mb: 1 }}>
                <Grid item xs={3.5}><Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", fontSize: "0.65rem" }}>Faculty</Typography></Grid>
                <Grid item xs={3.5}><Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", fontSize: "0.65rem" }}>Subject / Course</Typography></Grid>
                <Grid item xs={2.5}><Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", fontSize: "0.65rem" }}>Status</Typography></Grid>
                <Grid item xs={2.5}><Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", fontSize: "0.65rem" }}>Submitted At</Typography></Grid>
              </Grid>

              {recentSubmissions.map((sub, i) => (
                <Grid container key={i} alignItems="center" sx={{ py: 1.5, borderBottom: i < recentSubmissions.length - 1 ? "1px solid var(--bg-accent-1)" : "none" }}>
                  <Grid item xs={3.5} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Avatar src={sub.avatar} sx={{ width: 32, height: 32, border: "1px solid var(--border-color)" }} />
                    <Box>
                      <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>{sub.name}</Typography>
                      <Typography sx={{ fontSize: "0.75rem", color: "var(--text-secondary)", opacity: 0.8 }}>{sub.dept}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={3.5}>
                    <Typography sx={{ fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: 500 }}>{sub.subject}</Typography>
                  </Grid>
                  <Grid item xs={2.5}>
                    <Chip 
                        label={sub.status} 
                        size="small" 
                        sx={{ 
                            height: 24, 
                            fontSize: "0.7rem", 
                            fontWeight: 700, 
                            bgcolor: sub.status === "Submitted" ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)", 
                            color: sub.status === "Submitted" ? "#10B981" : "#F59E0B",
                            border: `1px solid ${sub.status === "Submitted" ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.2)"}`
                        }} 
                    />
                  </Grid>
                  <Grid item xs={2.5}>
                    <Typography sx={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 500 }}>{sub.time}</Typography>
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
          <Card sx={{ borderRadius: "24px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-premium)", p: 3, width: "100%" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--text-primary)" }}>Discrepancies Requiring Attention</Typography>
              <Button size="small" sx={{ textTransform: "none", fontSize: "0.8rem", color: "var(--color-primary)", fontWeight: 700 }}>View All</Button>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {discrepancies.map((disc, i) => (
                <Paper key={i} elevation={0} sx={{ p: 2, borderRadius: "16px", border: "1px solid rgba(239, 68, 68, 0.2)", background: "rgba(239, 68, 68, 0.05)" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>{disc.name}</Typography>
                      <Typography sx={{ fontSize: "0.75rem", color: "var(--text-secondary)", mb: 1 }}>{disc.subject}</Typography>
                      <Typography sx={{ fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: 500 }}>{disc.issue}</Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                        <PictureAsPdf sx={{ fontSize: 16, color: "#EF4444" }} />
                        <Typography sx={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600 }}>{disc.file}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1.5 }}>
                      <Typography sx={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontWeight: 700 }}>{disc.time}</Typography>
                      <Button variant="outlined" color="error" size="small" sx={{ textTransform: "none", fontSize: "0.75rem", px: 3, borderRadius: "50px", fontWeight: 700, borderColor: "rgba(239, 68, 68, 0.5)" }}>
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
