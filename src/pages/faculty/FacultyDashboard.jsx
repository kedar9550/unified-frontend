import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton
} from "@mui/material";
import {
  MenuBook,
  Group,
  Description,
  AssignmentTurnedIn,
  Event,
  ArrowForward,
  CloudUpload,
  Feedback,
  PersonOff,
  CalendarMonth,
  
  Visibility
} from "@mui/icons-material";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const FacultyDashboard = () => {
  // Top Cards Data
  const topCards = [
    {
      title: "Courses Assigned",
      value: "8",
      subtitle: "This Semester",
      icon: <MenuBook />,
      gradient: "linear-gradient(135deg, #3B82F6, #2563EB)",
      linkText: "View Details",
    },
    {
      title: "Students Mentored",
      value: "120",
      subtitle: "Total Students",
      icon: <Group />,
      gradient: "linear-gradient(135deg, #10B981, #059669)",
      linkText: "View Details",
    },
    {
      title: "Publications",
      value: "12",
      subtitle: "Total Publications",
      icon: <Description />,
      gradient: "linear-gradient(135deg, #8B5CF6, #6D28D9)",
      linkText: "View Details",
    },
    {
      title: "Pending Tasks",
      value: "5",
      subtitle: "Requires Attention",
      icon: <AssignmentTurnedIn />,
      gradient: "linear-gradient(135deg, #F59E0B, #D97706)",
      linkText: "View Details",
    },
    {
      title: "Upcoming Classes",
      value: "3",
      subtitle: "Today",
      icon: <Event />,
      gradient: "linear-gradient(135deg, #EF4444, #DC2626)",
      linkText: "View Schedule",
    },
  ];

  // Course Load Chart Data
  const courseLoadData = [
    { name: "Theory Courses", value: 5 },
    { name: "Lab Courses", value: 2 },
    { name: "Tutorials", value: 1 },
  ];
  const CHART_COLORS = ["#3B82F6", "#10B981", "#F59E0B"];

  // Quick Actions Data
  const quickActions = [
    { title: "View Time Table", desc: "Check class schedule", icon: <Event sx={{ color: "#3B82F6" }} /> },
    { title: "Upload Materials", desc: "Share study materials", icon: <CloudUpload sx={{ color: "#10B981" }} /> },
    { title: "Mark Attendance", desc: "Take attendance", icon: <Group sx={{ color: "#3B82F6" }} /> },
    { title: "Student Feedback", desc: "View feedback", icon: <Feedback sx={{ color: "#10B981" }} /> },
    { title: "Academic Calendar", desc: "Important dates", icon: <CalendarMonth sx={{ color: "#8B5CF6" }} /> },
    { title: "Leave Request", desc: "Apply for leave", icon: <PersonOff sx={{ color: "#3B82F6" }} /> },
  ];

  // My Courses Data
  const myCourses = [
    { code: "MA101", name: "Mathematics", branch: "CSE", sem: "1", students: 60 },
    { code: "MA201", name: "Discrete Mathematics", branch: "CSE", sem: "3", students: 55 },
    { code: "MA301", name: "Numerical Methods", branch: "CSE", sem: "5", students: 48 },
    { code: "MA401", name: "Probability & Statistics", branch: "CSE", sem: "7", students: 45 },
    { code: "MA502", name: "Operations Research", branch: "CSE", sem: "9", students: 40 },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: "#1a237e", mb: 0.5 }}>
            Welcome back, Faculty Name! 👋
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Faculty Dashboard • Manage your teaching, research and academic activities
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
           <Button variant="outlined" sx={{ borderRadius: 2, borderColor: '#e0e0e0', color: '#424242', textTransform: 'none' }} startIcon={<CalendarMonth />}>
             2024-25
           </Button>
        </Box>
      </Box>

      {/* Row 1: Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {topCards.map((card, i) => (
          <Grid item key={i} xs={12} sm={6} md={4} lg sx={{ flex: "1 1 0", minWidth: 0 }}>
            <Card
              sx={{
                borderRadius: 2,
                boxShadow: "0 6px 20px rgba(0,0,0,0.04)",
                transition: "all 0.25s ease",
                "&:hover": { transform: "translateY(-4px)", boxShadow: "0 12px 30px rgba(0,0,0,0.08)" },
                height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", p: 2.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                <Box
                  sx={{
                    width: 52, height: 52, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center",
                    background: card.gradient, color: "#fff", position: "relative", overflow: "hidden", flexShrink: 0,
                    "&::after": { content: '""', position: "absolute", inset: 0, background: "linear-gradient(180deg, #ffffff30, transparent)", borderRadius: 2 },
                  }}>
                  {React.cloneElement(card.icon, { fontSize: "medium" })}
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.3 }}>
                  <Typography variant="body2" sx={{ color: "#6B7280", fontWeight: 600 }}>{card.title}</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: "#111827", mt: 0.5 }}>{card.value}</Typography>
                  <Typography variant="caption" sx={{ color: "#9CA3AF" }}>{card.subtitle}</Typography>
                </Box>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Button size="small" endIcon={<ArrowForward sx={{ fontSize: 16 }} />} sx={{ textTransform: "none", fontSize: "0.8rem", fontWeight: 600, color: "#2563EB", p: 0, "&:hover": { background: "transparent" } }}>
                  {card.linkText}
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Row 2: Teaching Overview and Quick Actions */}
      <Box sx={{ display: "flex", gap: 3, flexWrap: { xs: "wrap", lg: "nowrap" }, mb: 4 }}>
        {/* Teaching Overview */}
        <Box sx={{ width: { xs: "100%", lg: "50%" }, display: "flex" }}>
          <Card sx={{ borderRadius: 2, boxShadow: "0 6px 20px rgba(0,0,0,0.04)", p: 3, height: "100%", width: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
              <Typography sx={{ fontWeight: 700, fontSize: "1.1rem" }}>Teaching Overview</Typography>
              <Button size="small" endIcon={<ArrowForward sx={{ fontSize: 16 }} />} sx={{ textTransform: "none", fontSize: "0.8rem" }}>
                View All Courses
              </Button>
            </Box>

            <Box sx={{ display: "flex", gap: 3, alignItems: "center", height: "100%", flexWrap: { xs: "wrap", sm: "nowrap" } }}>
              {/* Chart */}
              <Box sx={{ width: { xs: "100%", sm: "50%" }, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Typography variant="subtitle2" sx={{ alignSelf: "flex-start", mb: 1, fontWeight: 600, color: "#4B5563" }}>Course Load</Typography>
                <Box sx={{ position: "relative", width: 160, height: 160 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={courseLoadData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={75} paddingAngle={2} stroke="none">
                        {courseLoadData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
                    <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#111827", lineHeight: 1 }}>8</Typography>
                    <Typography sx={{ fontSize: 11, color: "#6B7280", lineHeight: 1.2 }}>Courses<br/>Assigned</Typography>
                  </Box>
                </Box>
                <Box sx={{ mt: 2, width: "100%" }}>
                  {courseLoadData.map((item, idx) => (
                    <Box key={idx} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                        <Typography sx={{ fontSize: 13, color: "#4B5563" }}>{item.name}</Typography>
                      </Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{item.value}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Semester Stats */}
              <Box sx={{ width: { xs: "100%", sm: "50%" } }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: "#4B5563" }}>This Semester</Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                   <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                     <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                       <Event sx={{ fontSize: 20, color: "#8B5CF6" }} />
                       <Typography sx={{ fontSize: 14, color: "#4B5563" }}>Total Classes</Typography>
                     </Box>
                     <Typography sx={{ fontWeight: 700 }}>96</Typography>
                   </Box>
                   <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                     <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                       <Group sx={{ fontSize: 20, color: "#10B981" }} />
                       <Typography sx={{ fontSize: 14, color: "#4B5563" }}>Classes Conducted</Typography>
                     </Box>
                     <Typography sx={{ fontWeight: 700 }}>68</Typography>
                   </Box>
                   <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                     <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                       <Box sx={{ width: 20, height: 20, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #3B82F6", color: "#3B82F6", fontSize: 12, fontWeight: 700 }}>%</Box>
                       <Typography sx={{ fontSize: 14, color: "#4B5563" }}>Attendance Avg.</Typography>
                     </Box>
                     <Typography sx={{ fontWeight: 700 }}>87%</Typography>
                   </Box>
                   <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                     <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                       <Event sx={{ fontSize: 20, color: "#F59E0B" }} />
                       <Typography sx={{ fontSize: 14, color: "#4B5563" }}>Remaining Classes</Typography>
                     </Box>
                     <Typography sx={{ fontWeight: 700 }}>28</Typography>
                   </Box>
                </Box>
              </Box>
            </Box>
          </Card>
        </Box>

        {/* Quick Actions */}
        <Box sx={{ width: { xs: "100%", lg: "50%" }, display: "flex" }}>
          <Card sx={{ borderRadius: 2, boxShadow: "0 6px 20px rgba(0,0,0,0.04)", p: 3, height: "100%", width: "100%", display: "flex", flexDirection: "column" }}>
            <Typography sx={{ fontWeight: 700, fontSize: "1.1rem", mb: 3 }}>Quick Actions</Typography>
            <Grid container spacing={2}>
              {quickActions.map((action, i) => (
                <Grid item xs={12} sm={6} key={i}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2, borderRadius: 2, display: "flex", alignItems: "center", gap: 2, cursor: "pointer", height: "100%",
                      borderColor: "#F3F4F6", backgroundColor: "#fff", transition: "all 0.2s ease",
                      "&:hover": { borderColor: "#2563EB", backgroundColor: "#F9FAFB", transform: "translateY(-2px)", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" },
                    }}
                  >
                    <Box sx={{ width: 44, height: 44, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#F3F4F6", flexShrink: 0 }}>
                      {action.icon}
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 600, fontSize: "0.95rem", color: "#111827" }}>{action.title}</Typography>
                      <Typography sx={{ fontSize: "0.8rem", color: "#6B7280" }}>{action.desc}</Typography>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Card>
        </Box>
      </Box>

      {/* Row 3: My Courses */}
      <Card sx={{ borderRadius: 2, boxShadow: "0 6px 20px rgba(0,0,0,0.04)", p: 3, mb: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "1.1rem" }}>My Courses</Typography>
          <Button size="small" endIcon={<ArrowForward sx={{ fontSize: 16 }} />} sx={{ textTransform: "none", fontSize: "0.8rem" }}>
            View All Courses
          </Button>
        </Box>
        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="courses table">
            <TableHead sx={{ backgroundColor: "#F9FAFB" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: "#6B7280", py: 1.5, borderTopLeftRadius: 8, borderBottomLeftRadius: 8, borderBottom: "none" }}>COURSE CODE</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#6B7280", py: 1.5, borderBottom: "none" }}>COURSE NAME</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#6B7280", py: 1.5, borderBottom: "none" }}>BRANCH</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#6B7280", py: 1.5, borderBottom: "none" }}>SEMESTER</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#6B7280", py: 1.5, borderBottom: "none" }}>STUDENTS</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: "#6B7280", py: 1.5, borderTopRightRadius: 8, borderBottomRightRadius: 8, borderBottom: "none" }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {myCourses.map((course, index) => (
                <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 500, color: "#111827", py: 2 }}>{course.code}</TableCell>
                  <TableCell sx={{ color: "#4B5563", py: 2 }}>{course.name}</TableCell>
                  <TableCell sx={{ color: "#4B5563", py: 2 }}>{course.branch}</TableCell>
                  <TableCell sx={{ color: "#4B5563", py: 2 }}>{course.sem}</TableCell>
                  <TableCell sx={{ color: "#4B5563", py: 2 }}>{course.students}</TableCell>
                  <TableCell align="right" sx={{ py: 2 }}>
                    <IconButton size="small" sx={{ color: "#3B82F6", "&:hover": { backgroundColor: "#EFF6FF" } }}>
                      <Visibility fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default FacultyDashboard;
