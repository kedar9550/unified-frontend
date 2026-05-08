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

      {/* Row 1: Summary Cards (Box System) */}
      <Box sx={{ display: "flex", gap: 2, mb: 4, flexWrap: "wrap" }}>
        {topCards.map((card, i) => (
          <Box key={i} sx={{ flex: { xs: "1 1 100%", sm: "1 1 calc(50% - 16px)", lg: 1 }, minWidth: 0 }}>
            <Card sx={{ borderRadius: "16px", border: "1px solid var(--border-color)", background: "var(--bg-panel)", boxShadow: "var(--shadow-premium)", p: 2, height: "100%", display: "flex", alignItems: "center", gap: 2, transition: "all 0.3s ease", "&:hover": { transform: "translateY(-4px)", borderColor: card.color } }}>
              <Box sx={{ width: 48, height: 48, borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: card.bgColor, color: card.color, flexShrink: 0 }}>
                {card.icon}
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.02em" }}>{card.title}</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "var(--text-primary)", my: 0.1 }}>{card.value}</Typography>
                <Typography variant="caption" sx={{ color: "var(--text-secondary)", opacity: 0.8 }}>{card.subtitle}</Typography>
              </Box>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Main Content Layout (Box System) */}
      <Box sx={{ display: "flex", gap: 3, mb: 4, flexWrap: { xs: "wrap", lg: "nowrap" }, alignItems: "stretch" }}>
        
        {/* Left Column: Overview & Discrepancies */}
        <Box sx={{ flex: { xs: "1 1 100%", lg: "0 0 320px" }, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Submission Overview */}
          <Card sx={{ borderRadius: "24px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-premium)", p: 2.5, display: "flex", flexDirection: "column" }}>
            <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", mb: 3, color: "var(--text-primary)" }}>Submission Overview</Typography>
            
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4, flexWrap: "wrap", justifyContent: "center" }}>
              <Box sx={{ position: "relative", width: 130, height: 130, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie data={submissionData} dataKey="value" innerRadius={45} outerRadius={60} stroke="none" paddingAngle={5}>
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
                  <Typography sx={{ fontSize: 22, fontWeight: 900, color: "var(--text-primary)", lineHeight: 1 }}>70%</Typography>
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
                    <Typography variant="body2" sx={{ color: "var(--color-primary)", fontSize: "0.75rem", fontWeight: 800 }}>42 / 60</Typography>
                </Box>
                <LinearProgress 
                    variant="determinate" 
                    value={70} 
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
          <Card sx={{ borderRadius: "24px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-premium)", p: 2.5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--text-primary)" }}>Discrepancies</Typography>
              <Button size="small" sx={{ textTransform: "none", fontSize: "0.8rem", color: "#EF4444", fontWeight: 700 }}>View All</Button>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {discrepancies.map((disc, i) => (
                <Paper key={i} elevation={0} sx={{ p: 1.8, borderRadius: "16px", border: "1px solid var(--border-color)", background: "var(--bg-glass)", transition: "all 0.2s ease", "&:hover": { borderColor: "#EF4444", transform: "translateY(-2px)" } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography noWrap sx={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>{disc.name}</Typography>
                      <Typography noWrap sx={{ fontSize: "0.75rem", color: "var(--text-secondary)", mb: 1 }}>{disc.subject}</Typography>
                      <Typography sx={{ fontSize: "0.8rem", color: "#EF4444", fontWeight: 600 }}>{disc.issue}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: "0.65rem", color: "var(--text-secondary)", fontWeight: 700, flexShrink: 0 }}>{disc.time}</Typography>
                  </Box>
                </Paper>
              ))}
            </Box>
          </Card>
        </Box>

        {/* Right Column: Recent Submissions */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Card sx={{ borderRadius: "24px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-premium)", p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--text-primary)" }}>Recent Submissions</Typography>
              <Button size="small" sx={{ textTransform: "none", fontSize: "0.85rem", color: "var(--color-primary)", fontWeight: 700 }}>View All</Button>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
              {recentSubmissions.map((sub, i) => (
                <Box 
                  key={i} 
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
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1.5 }}>
                    <Avatar src={sub.avatar} sx={{ width: 40, height: 40, border: "2px solid var(--bg-panel)", boxShadow: "0 0 0 1px var(--border-color)" }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography noWrap sx={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>{sub.name}</Typography>
                      <Typography noWrap sx={{ fontSize: "0.75rem", color: "var(--text-secondary)", opacity: 0.8 }}>{sub.dept}</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ flex: 1.5, display: { xs: "none", sm: "block" }, minWidth: 0 }}>
                    <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", fontSize: "0.6rem", mb: 0.5, display: "block" }}>Subject / Course</Typography>
                    <Typography noWrap sx={{ fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: 600 }}>{sub.subject}</Typography>
                  </Box>

                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5, flex: 0.8 }}>
                    <Chip 
                        label={sub.status} 
                        size="small" 
                        sx={{ 
                            height: 22, fontSize: "0.65rem", fontWeight: 800, 
                            bgcolor: sub.status === "Submitted" ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)", 
                            color: sub.status === "Submitted" ? "#10B981" : "#F59E0B",
                            border: "1px solid currentColor"
                        }} 
                    />
                    <Typography sx={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: { xs: "block", sm: "none" } }}>{sub.time}</Typography>
                  </Box>

                  <Box sx={{ flex: 0.8, textAlign: "right", display: { xs: "none", sm: "block" } }}>
                    <Typography sx={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>{sub.time}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            <Box sx={{ mt: 3, pt: 2, borderTop: "1px solid var(--border-color)", textAlign: "center" }}>
              <Button endIcon={<ArrowForward sx={{ fontSize: 16 }} />} sx={{ textTransform: "none", fontSize: "0.9rem", color: "var(--color-primary)", fontWeight: 700 }}>
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
