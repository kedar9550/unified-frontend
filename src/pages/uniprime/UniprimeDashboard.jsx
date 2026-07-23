
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Paper,
} from "@mui/material";
import {
  CalendarToday,
  School,
  Group,
  Shield,
  CalendarMonth,
  AccountBalance,
  ArrowForward,
  AddBox,
  DomainAdd,
  AccountTree,
  PersonAdd,
  VpnKey,
  AssignmentInd,
  Update,
  History,
  PeopleAlt,
  Security,
  AutoFixHigh as AutoFixHighIcon,
  Share,
  Flag,
} from "@mui/icons-material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import MenuBook from "@mui/icons-material/MenuBook";
import API from "../../api/axios";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const UniprimeDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    academicYearsCount: 0,
    activeYear: "N/A",
    activeSemester: "N/A",
    departmentsCount: 0,
    schoolsCount: 0,
    programsCount: 0,
    branchesCount: 0,
    usersCount: 0,
    rolesCount: 0,
    discrepanciesCount: 0,
    departmentsList: [],
    programsList: [],
    branchesList: [],
    recentUsers: [],
    roleDistribution: [],
    activeYearStart: null,
    activeYearEnd: null
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      const timeout = setTimeout(() => {}, 8000);
      try {
        const res = await API.get('/api/dashboard/uniprime');

        if (res.data?.status === 'success') {
          setDashboardData({
            academicYearsCount: res.data.data.academicYearsCount || 0,
            activeYear: res.data.data.activeYear || "N/A",
            activeSemester: res.data.data.activeSemester || "N/A",
            departmentsCount: res.data.data.departmentsCount || 0,
            schoolsCount: res.data.data.schoolsCount || 0,
            programsCount: res.data.data.programsCount || 0,
            branchesCount: res.data.data.branchesCount || 0,
            usersCount: res.data.data.usersCount || 0,
            rolesCount: res.data.data.rolesCount || 0,
            discrepanciesCount: res.data.data.discrepanciesCount || 0,
            departmentsList: res.data.data.departmentsList || [],
            programsList: res.data.data.programsList || [],
            branchesList: res.data.data.branchesList || [],
            recentUsers: (res.data.data.recentUsers || []).filter(Boolean),
            roleDistribution: res.data.data.roleDistribution || [],
            activeYearStart: res.data.data.activeYearStart || null,
            activeYearEnd: res.data.data.activeYearEnd || null
          });
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        clearTimeout(timeout);
      }
    };



    fetchDashboardData();
  }, []);

  const COLORS = [
    "#3b82f6", // Blue
    "#10b981", // Emerald/Green
    "#f59e0b", // Amber/Orange
    "#ef4444", // Red
    "#8b5cf6", // Purple
    "#06b6d4", // Cyan
    "#ec4899", // Pink
    "#14b8a6", // Teal
    "#f97316", // Orange
    "#a855f7", // Violet
    "#6366f1", // Indigo
    "#84cc16", // Lime
    "#0ea5e9", // Sky Blue
    "#d946ef", // Fuchsia
    "#eab308", // Yellow
    "#22c55e", // Light Green
  ];

  // Top Row Cards Data
  const topCards = [
    {
      title: "Academic Years",
      value: dashboardData.academicYearsCount,
      icon: <CalendarToday />,
      gradient: "linear-gradient(135deg, #3B82F6, #2563EB)",
      color: "#3B82F6",
      bgDark: "rgba(59, 130, 246, 0.15)",
      linkText: "View Details",
      path: "/academics/management",
    },
    {
      title: "Active Academic Year",
      value: dashboardData.activeYear,
      icon: <CalendarMonth />,
      gradient: "linear-gradient(135deg, #10B981, #059669)",
      color: "#10B981",
      bgDark: "rgba(16, 185, 129, 0.15)",
      subtitle: null,
      linkText: "Manage Years",
      path: "/academics/management",
    },
    {
      title: "Departments",
      value: dashboardData.departmentsCount,
      icon: <AccountBalance />,
      gradient: "linear-gradient(135deg, #8B5CF6, #6D28D9)",
      color: "#8B5CF6",
      bgDark: "rgba(139, 92, 246, 0.15)",
      linkText: "View All",
      path: "/academics/department",
    },
    {
      title: "Users",
      value: dashboardData.usersCount,
      icon: <Group />,
      gradient: "linear-gradient(135deg, #F59E0B, #D97706)",
      color: "#F59E0B",
      bgDark: "rgba(245, 158, 11, 0.15)",
      linkText: "Manage Users",
      path: "/student/student-uploads",
    },
    {
      title: "Roles",
      value: dashboardData.rolesCount,
      icon: <Shield />,
      gradient: "linear-gradient(135deg, #EF4444, #DC2626)",
      color: "#EF4444",
      bgDark: "rgba(239, 68, 68, 0.15)",
      linkText: "Manage Roles",
      path: "/academics/roles",
    },
    {
      title: "Discrepancies",
      value: dashboardData.discrepanciesCount,
      icon: <Flag />,
      gradient: "linear-gradient(135deg, #F59E0B, #D97706)",
      color: "#F59E0B",
      bgDark: "rgba(245, 158, 11, 0.15)",
      linkText: "Resolve Discrepancies",
      path: "/uniprime/discrepancies",
    },
  ];

  const quickActions = [
    { title: "Add Department", desc: "Create new department", icon: <DomainAdd color="success" />, path: "/academics/department" },
    { title: "Add Program / Branch", desc: "Add program or branch", icon: <AccountTree color="secondary" />, path: "/academics/programs" },
    { title: "Add User", desc: "Register new user", icon: <PersonAdd sx={{ color: "#00b0ff" }} />, path: "/student/student-uploads" },
    { title: "Assign Role", desc: "Assign role to user", icon: <AssignmentInd color="warning" />, path: "/academics/roles" },
    { title: "Manage SDGs", desc: "Manage SDG keywords", icon: <AutoFixHighIcon sx={{ color: "#9c27b0" }} />, path: "/uniprime/sdg-management" },
  ];

  const recentUsers = dashboardData.recentUsers || [];
  const totalRoleAssignments = (dashboardData.roleDistribution || []).reduce((sum, item) => sum + item.value, 0);

  const recentActivity = [
    { 
      title: dashboardData.activeYear !== "N/A" ? `Academic Year ${dashboardData.activeYear} is active` : "Academic Configurations loaded", 
      by: "System", 
      time: "Just now", 
      icon: <CalendarMonth color="success" /> 
    },
    { 
      title: dashboardData.departmentsList[0]?.departmentName ? `Department '${dashboardData.departmentsList[0].departmentName}' onboarded` : "Academic structure updated", 
      by: "Super Admin", 
      time: "Today", 
      icon: <AccountBalance color="primary" /> 
    },
    { 
      title: dashboardData.usersCount > 0 ? `University records sync completed (${dashboardData.usersCount} users active)` : "User database initialized", 
      by: "System Cron", 
      time: "Recently", 
      icon: <PeopleAlt color="info" /> 
    },
    { 
      title: dashboardData.rolesCount > 0 ? `Access control configurations loaded (${dashboardData.rolesCount} active roles)` : "Access control synchronized", 
      by: "Security Admin", 
      time: "Yesterday", 
      icon: <Security color="warning" /> 
    },
  ];

  const calculateDurationProgress = (start, end) => {
    if (!start || !end) return { percent: 0, text: "N/A", dateString: "N/A" };
    const startDate = new Date(start);
    const endDate = new Date(end);
    const now = new Date();
    
    const dateString = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    
    if (now < startDate) return { percent: 0, text: "Not started yet", dateString };
    if (now > endDate) return { percent: 100, text: "Completed", dateString };
    
    const totalDuration = endDate - startDate;
    const elapsedDuration = now - startDate;
    const percent = Math.min(100, Math.max(0, (elapsedDuration / totalDuration) * 100));
    
    const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    return { percent, text: `${daysRemaining} days remaining`, dateString };
  };

  const durationData = calculateDurationProgress(dashboardData.activeYearStart, dashboardData.activeYearEnd);

  return (
    <Box>
      <>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: "var(--text-primary)", mb: 0.5, letterSpacing: "-0.02em" }}>
              Welcome back, UniPrime!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Super Admin Dashboard • Monitor and manage the entire university ecosystem.
            </Typography>
          </Box>



          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: { xs: 2, md: 3 },
              mb: 4,
              width: "100%",
            }}
          >
            {topCards.map((card, i) => (
              <Box
                key={i}
                sx={{
                  flex: { xs: "1 1 100%", sm: "1 1 calc(50% - 24px)", md: "1 1 calc(33.33% - 24px)", lg: "1 1 calc(16.66% - 24px)" },
                  display: 'flex',
                  minWidth: "200px"
                }}
              >
                <Card
                  sx={{
                    position: "relative",
                    borderRadius: "16px",
                    boxShadow: "var(--shadow-premium)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      transform: "translateY(-5px)",
                      boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
                    },
                    height: "160px",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    p: 2.5,
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-panel)",
                    overflow: "hidden",
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      right: 0,
                      width: "120px",
                      height: "120px",
                      background: `radial-gradient(circle at top right, ${card.color}25, transparent 70%)`,
                      zIndex: 0
                    }
                  }}
                >
                  {/* Top Content: Left Aligned */}
                  <Box sx={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 2,
                    textAlign: "left",
                    position: "relative",
                    zIndex: 1
                  }}>
                    {/* Icon */}
                    <Box
                      sx={{
                        width: 50,
                        height: 50,
                        borderRadius: "14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: card.gradient,
                        color: "#fff",
                        flexShrink: 0,
                        mt: 0.5,
                        boxShadow: `0 8px 25px ${card.color}35`,
                      }}>
                      {React.cloneElement(card.icon, { fontSize: "medium" })}
                    </Box>

                    {/* Text */}
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                      <Typography
                        variant="body2"
                        sx={{ color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.8rem", textTransform: "capitalize", letterSpacing: "0.5px" }}
                      >
                        {card.title}
                      </Typography>

                      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 0.5 }}>
                        <Typography
                          sx={{
                            fontWeight: 800,
                            color: "var(--text-primary)",
                            mt: 0.5,
                            fontSize: card.value.toString().length > 6 ? "1.2rem" : "1.6rem",
                            lineHeight: 1
                          }}
                        >
                          {card.value}
                        </Typography>

                        {card.subtitle && (
                          <Box sx={{ mt: 0.5 }}>
                            {card.subtitle}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Box>

                  {/* Bottom Link: Right Aligned */}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', position: "relative", zIndex: 1 }}>
                    <Button
                      size="small"
                      endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
                      onClick={() => navigate(card.path)}
                      sx={{
                        textTransform: "none",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        color: "var(--color-primary)",
                        p: 0,
                        "&:hover": { background: "transparent", opacity: 0.8 },
                      }}
                    >
                      {card.linkText}
                    </Button>
                  </Box>
                </Card>
              </Box>
            ))}
          </Box>

          {/* Row 2: Middle Panels */}
          <Box sx={{ display: "flex", gap: { xs: 2, md: 3 }, mb: 3, flexWrap: { xs: "wrap", lg: "nowrap" }, width: "100%" }}>
            {/* Academic Structure Overview */}
            <Box sx={{ width: { xs: "100%", lg: "50%" }, display: "flex" }}>
              <Card
                sx={{
                  borderRadius: "16px",
                  boxShadow: "var(--shadow-premium)",
                  p: 3,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                  border: "1px solid var(--border-color)",
                  position: "relative",
                  background: `linear-gradient(to bottom, var(--bg-panel), var(--bg-panel)), url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'><path fill='%23818cf8' fill-opacity='0.08' d='M0,224L120,202.7C240,181,480,139,720,138.7C960,139,1200,181,1320,202.7L1440,224L1440,320L1320,320C1200,320,960,320,720,320C480,320,240,320,120,320L0,320Z'></path></svg>")`,
                  backgroundPosition: "bottom",
                  backgroundSize: "cover",
                  backgroundRepeat: "no-repeat",
                  overflow: "hidden"
                }}
              >
                {/* Header */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4, position: "relative", zIndex: 1 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--text-primary)" }}>
                    Academic Structure Overview
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => navigate("/academics/department")}
                    sx={{
                      textTransform: "none",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "#3b82f6",
                      bgcolor: "rgba(59, 130, 246, 0.06)",
                      px: 2,
                      py: 0.5,
                      borderRadius: "20px",
                      "&:hover": { bgcolor: "rgba(59, 130, 246, 0.12)" }
                    }}
                  >
                    View All
                  </Button>
                </Box>

                {/* Hierarchical Tree Content */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3, position: "relative", zIndex: 1, pb: 2 }}>
                  
                  {/* Row 1: Schools */}
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
                    {/* Vertical Connector Line (down to Branches) */}
                    <Box sx={{ position: "absolute", left: 22, top: 22, bottom: -24, borderLeft: "2.5px dotted #818cf8", opacity: 0.8, zIndex: 0 }} />
                    
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, zIndex: 1 }}>
                      <Box sx={{ 
                        width: 44, 
                        height: 44, 
                        borderRadius: "50%", 
                        bgcolor: "rgba(129, 140, 248, 0.12)", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        border: "1.5px solid rgba(129, 140, 248, 0.25)"
                      }}>
                        <School sx={{ color: "#4f46e5", fontSize: 22 }} />
                      </Box>
                      <Typography sx={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.95rem" }}>Schools</Typography>
                    </Box>
                    <Box sx={{ bgcolor: "rgba(129, 140, 248, 0.1)", px: 2, py: 0.5, borderRadius: "20px" }}>
                      <Typography sx={{ fontWeight: 800, color: "#4f46e5", fontSize: "0.85rem" }}>{dashboardData.schoolsCount}</Typography>
                    </Box>
                  </Box>

                  {/* Row 2: Departments */}
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pl: 5, position: "relative" }}>
                    {/* Horizontal Connector Branch (from Schools vertical line) */}
                    <Box sx={{ position: "absolute", left: 22, top: 22, width: 18, borderTop: "2.5px dotted #818cf8", opacity: 0.8, zIndex: 0 }} />
                    {/* Vertical Connector Line (from Schools down to Branches/Specializations) */}
                    <Box sx={{ position: "absolute", left: 22, top: -24, bottom: -24, borderLeft: "2.5px dotted #818cf8", opacity: 0.8, zIndex: 0 }} />
                    {/* Vertical Connector Line (from Departments down to Programs) */}
                    <Box sx={{ position: "absolute", left: 62, top: 22, bottom: -24, borderLeft: "2.5px dotted #3b82f6", opacity: 0.8, zIndex: 0 }} />
                    
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, zIndex: 1 }}>
                      <Box sx={{ 
                        width: 44, 
                        height: 44, 
                        borderRadius: "50%", 
                        bgcolor: "rgba(59, 130, 246, 0.12)", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        border: "1.5px solid rgba(59, 130, 246, 0.25)"
                      }}>
                        <AccountBalance sx={{ color: "#2563eb", fontSize: 22 }} />
                      </Box>
                      <Typography sx={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.95rem" }}>Departments</Typography>
                    </Box>
                    <Box sx={{ bgcolor: "rgba(59, 130, 246, 0.1)", px: 2, py: 0.5, borderRadius: "20px" }}>
                      <Typography sx={{ fontWeight: 800, color: "#2563eb", fontSize: "0.85rem" }}>{dashboardData.departmentsCount}</Typography>
                    </Box>
                  </Box>

                  {/* Row 3: Programs */}
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pl: 10, position: "relative" }}>
                    {/* Horizontal Connector Branch (from Departments vertical line) */}
                    <Box sx={{ position: "absolute", left: 62, top: 22, width: 18, borderTop: "2.5px dotted #3b82f6", opacity: 0.8, zIndex: 0 }} />
                    {/* Vertical Connector Line segment (Departments to Programs) */}
                    <Box sx={{ position: "absolute", left: 62, top: -24, height: 46, borderLeft: "2.5px dotted #3b82f6", opacity: 0.8, zIndex: 0 }} />
                    {/* Vertical Connector Line (from Schools down to Branches/Specializations) */}
                    <Box sx={{ position: "absolute", left: 22, top: -24, bottom: -24, borderLeft: "2.5px dotted #818cf8", opacity: 0.8, zIndex: 0 }} />
                    
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, zIndex: 1 }}>
                      <Box sx={{ 
                        width: 44, 
                        height: 44, 
                        borderRadius: "50%", 
                        bgcolor: "rgba(16, 185, 129, 0.12)", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        border: "1.5px solid rgba(16, 185, 129, 0.25)"
                      }}>
                        <School sx={{ color: "#10b981", fontSize: 20 }} />
                      </Box>
                      <Typography sx={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.95rem" }}>Programs</Typography>
                    </Box>
                    <Box sx={{ bgcolor: "rgba(16, 185, 129, 0.1)", px: 2, py: 0.5, borderRadius: "20px" }}>
                      <Typography sx={{ fontWeight: 800, color: "#10b981", fontSize: "0.85rem" }}>{dashboardData.programsCount}</Typography>
                    </Box>
                  </Box>

                  {/* Row 4: Branches / Specializations */}
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pl: 5, position: "relative" }}>
                    {/* Horizontal Connector Branch (from Schools vertical line) */}
                    <Box sx={{ position: "absolute", left: 22, top: 22, width: 18, borderTop: "2.5px dotted #818cf8", opacity: 0.8, zIndex: 0 }} />
                    {/* Vertical Connector Line segment (stopping at row center) */}
                    <Box sx={{ position: "absolute", left: 22, top: -24, height: 46, borderLeft: "2.5px dotted #818cf8", opacity: 0.8, zIndex: 0 }} />
                    
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, zIndex: 1 }}>
                      <Box sx={{ 
                        width: 44, 
                        height: 44, 
                        borderRadius: "50%", 
                        bgcolor: "rgba(239, 68, 68, 0.12)", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        border: "1.5px solid rgba(239, 68, 68, 0.25)"
                      }}>
                        <Share sx={{ color: "#ef4444", fontSize: 20 }} />
                      </Box>
                      <Typography sx={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.95rem" }}>Branches / Specializations</Typography>
                    </Box>
                    <Box sx={{ bgcolor: "rgba(239, 68, 68, 0.1)", px: 2, py: 0.5, borderRadius: "20px" }}>
                      <Typography sx={{ fontWeight: 800, color: "#ef4444", fontSize: "0.85rem" }}>{dashboardData.branchesCount}</Typography>
                    </Box>
                  </Box>

                </Box>
              </Card>
            </Box>

            {/* Active Academic Configuration */}
            <Box sx={{ width: { xs: "100%", lg: "50%" }, display: "flex" }}>


              <Card
                sx={{
                  borderRadius: "16px",
                  boxShadow: "var(--shadow-premium)",
                  p: 3,
                  height: "100%",
                  width: "100%",
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-panel)",
                }}
              >
                {/* Header */}
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
                  <Typography sx={{ fontWeight: 700 }}>
                    Active Academic Configuration
                  </Typography>

                  <Chip
                    label="All Systems Operational"
                    size="small"
                    sx={{
                      bgcolor: "var(--bg-accent-2)",
                      color: "#10B981",
                      fontWeight: 700,
                      fontSize: "0.7rem",
                      borderRadius: 1,
                    }}
                  />
                </Box>

                {/* Card 1 */}
                <Box sx={configBox}>
                  <Box>
                    <Typography sx={labelStyle}>
                      Active Academic Year
                    </Typography>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography sx={valueStyle}>{dashboardData.activeYear}</Typography>
                      <Chip label="Active" size="small" sx={activeChip} />
                    </Box>
                  </Box>

                  <Box sx={iconBox("var(--bg-accent-4)")}>
                    <CalendarMonth sx={{ color: "var(--color-primary)" }} />
                  </Box>
                </Box>

                {/* Duration */}
                <Box sx={{ ...configBox, display: "block" }}>
                  <Box sx={{ display: "flex", gap: 2, mb: 1.5, alignItems: "center" }}>
                    <CalendarMonth sx={{ color: "var(--color-primary)" }} />
                    <Box>
                      <Typography sx={labelStyle}>
                        Active Academic Year Duration
                      </Typography>
                      <Typography sx={{ fontWeight: 600 }}>
                        {durationData.dateString}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ width: "100%" }}>
                    <LinearProgress
                      variant="determinate"
                      value={durationData.percent}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: "var(--border-color)",
                        "& .MuiLinearProgress-bar": {
                          background: "var(--gradient-primary)",
                          borderRadius: 3,
                        },
                      }}
                    />

                    <Typography
                      sx={{
                        fontSize: "0.75rem",
                        color: "var(--color-primary)",
                        mt: 0.5,
                        fontWeight: 600,
                      }}
                    >
                      {durationData.text}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Box>

          </Box>

          {/* Row 3: Bottom Panels */}
          <Box sx={{ display: "flex", gap: { xs: 2, md: 3 }, flexWrap: { xs: "wrap", lg: "nowrap" } }}>
            {/* User & Role Overview */}
            <Box sx={{ width: { xs: "100%", lg: "50%" }, display: "flex" }}>
              <Card sx={{
                borderRadius: "16px", 
                boxShadow: "var(--shadow-premium)", 
                height: "100%", 
                width: "100%",
                display: "flex",
                flexDirection: "column",
                border: "1px solid var(--border-color)",
                background: "var(--bg-panel)",
              }}>
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>User & Role Overview</Typography>
                    <Button 
                      onClick={() => navigate("/role-management", { state: { activeTab: 1 } })}
                      sx={{ 
                        textTransform: "none", 
                        fontSize: "0.8rem", 
                        fontWeight: 700, 
                        color: "#1d4ed8",
                        p: 0,
                        "&:hover": { background: "transparent", opacity: 0.8 }
                      }}
                    >
                      View All Users &gt;
                    </Button>
                  </Box>

                  <Box sx={{
                    display: "flex",
                    flexDirection: { xs: 'column', md: 'row' },
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 3
                  }}>
                    {/* Chart */}
                    <Box sx={{ position: "relative", width: 200, height: 200, flexShrink: 0, mx: "auto", minWidth: 0 }}>
                      <ResponsiveContainer width="100%" height={200} minWidth={1} minHeight={1} debounce={50}>
                        <PieChart>
                          <Pie
                            data={dashboardData.roleDistribution}
                            dataKey="value"
                            nameKey="label"
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={2}
                            minAngle={5}
                            stroke="none"
                          >
                            {dashboardData.roleDistribution.map((entry, index) => (
                              <Cell key={index} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>

                      <Box
                        sx={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          textAlign: "center",
                        }}
                      >
                        <Typography sx={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.1 }}>
                          {dashboardData.usersCount}
                        </Typography>

                        <Typography sx={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 600 }}>
                          Total Users
                        </Typography>
                      </Box>
                    </Box>

                    {/* Stats table */}
                    <Box
                      sx={{
                        p: 2.5,
                        borderRadius: "16px",
                        border: "1px solid var(--border-color, #e2e8f0)",
                        bgcolor: "var(--bg-glass)",
                        width: { xs: '100%', md: 'auto' },
                        minWidth: { md: 260 },
                        flexGrow: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.5,
                        maxHeight: 280,
                        overflowY: "auto",
                        pr: 1.5,
                        "&::-webkit-scrollbar": {
                          width: "6px",
                        },
                        "&::-webkit-scrollbar-track": {
                          background: "transparent",
                        },
                        "&::-webkit-scrollbar-thumb": {
                          background: "rgba(0, 0, 0, 0.1)",
                          borderRadius: "4px",
                        },
                        "&::-webkit-scrollbar-thumb:hover": {
                          background: "rgba(0, 0, 0, 0.2)",
                        },
                      }}
                    >
                      {dashboardData.roleDistribution.map((role, idx) => {
                        const percent =
                          totalRoleAssignments > 0
                            ? ((role.value / totalRoleAssignments) * 100).toFixed(1)
                            : 0;

                        return (
                          <Box
                            key={idx}
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  bgcolor: COLORS[idx % COLORS.length],
                                }}
                              />
                              <Typography sx={{ fontSize: "0.825rem", fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase" }}>
                                {role.label}
                              </Typography>
                            </Box>

                            <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
                              <Typography sx={{ fontSize: "0.85rem", fontWeight: 800, minWidth: 20, textAlign: "right", color: "var(--text-primary)" }}>
                                {role.value}
                              </Typography>
                              <Typography sx={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600, minWidth: 40, textAlign: "right" }}>
                                {percent}%
                              </Typography>
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>

                  </Box>
                </CardContent>
              </Card>
            </Box>


            {/* Quick Actions */}
            <Box sx={{ width: { xs: "100%", lg: "50%" }, display: "flex" }}>
              <Card sx={{
                borderRadius: "16px", 
                boxShadow: "var(--shadow-premium)", 
                height: "100%", 
                width: "100%",
                display: "flex",
                flexDirection: "column",
                border: "1px solid var(--border-color)",
                background: "var(--bg-panel)",
              }}>
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "var(--text-primary)", mb: 2 }}>Quick Actions</Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                    {quickActions.map((action, i) => (
                      <Box key={i} sx={{ flex: { xs: "1 1 100%", sm: "1 1 calc(50% - 8px)" }, display: 'flex' }}>
                        <Paper
                          variant="outlined"
                          onClick={() => navigate(action.path)}
                          sx={{
                            p: 2.2,
                            borderRadius: "12px",
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            cursor: "pointer",
                            height: "100%",
                            width: "100%",
                            border: "1px solid var(--border-color)",
                            backgroundColor: "var(--bg-paper)",
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",

                            "&:hover": {
                              borderColor: "var(--color-primary)",
                              backgroundColor: "var(--bg-panel)",
                              transform: "translateY(-4px)",
                              boxShadow: "0 10px 25px rgba(59, 130, 246, 0.12)",
                            },
                          }}
                        >
                          {/* Icon */}
                          <Box
                            sx={{
                              width: 42,
                              height: 42,
                              borderRadius: "10px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: "var(--bg-panel)",
                              flexShrink: 0,
                            }}
                          >
                            {action.icon}
                          </Box>

                          {/* Text */}
                          <Box>
                            <Typography
                              sx={{
                                fontWeight: 600,
                                fontSize: "0.95rem",
                                color: "var(--text-primary)",
                              }}
                            >
                              {action.title}
                            </Typography>

                            <Typography
                              sx={{
                                fontSize: "0.75rem",
                                color: "var(--text-secondary)",
                                mt: 0.5,
                              }}
                            >
                              {action.desc}
                            </Typography>
                          </Box>
                        </Paper>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Box>



          </Box>

          {/* Row 4: Recent Users & Recent Activities */}
          <Box sx={{ display: "flex", gap: { xs: 2, md: 3 }, mt: 3, flexWrap: { xs: "wrap", lg: "nowrap" } }}>
            {/* Recently Onboarded Employees */}
            {/* <Box sx={{ width: { xs: "100%", lg: "50%" }, display: "flex" }}>
              <Card sx={{
                borderRadius: "16px",
                boxShadow: "var(--shadow-premium)",
                height: "100%",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                border: "1px solid var(--border-color)",
                background: "var(--bg-panel)",
              }}>
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "var(--text-primary)", mb: 2 }}>
                    Recently Onboarded Employees
                  </Typography>
                  <List sx={{ p: 0 }}>
                    {recentUsers.length > 0 ? (
                      recentUsers.map((user, idx) => (
                        <React.Fragment key={idx}>
                          <ListItem alignItems="flex-start" sx={{ px: 0, py: 1 }}>
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: 'var(--bg-accent-2)', color: 'var(--color-primary)', fontWeight: 700 }}>
                                {user.name?.charAt(0)}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="body2" fontWeight={700} color="var(--text-primary)">
                                    {user.name}
                                  </Typography>
                                  <Chip
                                    label={user.role}
                                    size="small"
                                    sx={{
                                      height: 20,
                                      fontSize: '10px',
                                      background: "var(--gradient-primary)",
                                      color: '#fff',
                                      fontWeight: 700,
                                      borderRadius: '50px'
                                    }}
                                  />
                                </Box>
                              }
                              secondary={
                                <Box sx={{ mt: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="caption" color="textSecondary">
                                    {user.email}
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                                    {new Date(user.time).toLocaleDateString("en-GB")}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                          {idx < recentUsers.length - 1 && <Divider variant="inset" component="li" />}
                        </React.Fragment>
                      ))
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 4, color: 'text.disabled' }}>
                        <Typography variant="body2">No recently onboarded employees.</Typography>
                      </Box>
                    )}
                  </List>
                </CardContent>
              </Card>
            </Box> */}
          </Box>
        </>
    </Box >
  );
};

export default UniprimeDashboard;

const columnCard = (bg) => ({
  flex: 1,
  width: '100%',
  borderRadius: 2,
  padding: "16px",
  background: bg,
  display: "flex",
  flexDirection: "column",
  minHeight: 200,
});

const TopBlock = ({ icon, title, value }) => (
  <Box sx={{ textAlign: "center", mb: 1 }}>
    <Box sx={{ mb: 0.5 }}>{icon}</Box>
    <Typography variant="body2" sx={{ fontWeight: 600 }}>
      {title}
    </Typography>
    <Typography sx={{ fontWeight: 700, fontSize: 22 }}>
      {value}
    </Typography>
  </Box>
);

const RowItem = ({ label, value }) => (
  <Typography
    variant="caption"
    sx={{
      display: "flex",
      justifyContent: "space-between",
      py: 0.5,
      borderBottom: "1px solid var(--border-color)",
      "&:last-child": { borderBottom: "none" },
    }}
  >
    {label} <b>{value}</b>
  </Typography>
);

const configBox = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  p: 2,
  mb: 2,
  borderRadius: "12px",
  border: "1px solid var(--border-color)",
  background: "var(--bg-panel)",
};

const iconBox = (bg) => ({
  width: 48,
  height: 48,
  borderRadius: "10px",
  background: bg,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

const labelStyle = {
  fontSize: "0.75rem",
  color: "var(--text-secondary)",
  fontWeight: 600,
};

const valueStyle = {
  fontWeight: 700,
  fontSize: "1.1rem",
};

const activeChip = {
  bgcolor: "rgba(16, 185, 129, 0.12)",
  color: "#10B981",
  fontSize: "0.65rem",
  height: 20,
  borderRadius: "6px",
  fontWeight: 700,
};

const roleChip = (role) => {
  const styles = {
    Faculty: {
      bgcolor: "rgba(37, 99, 235, 0.12)",
      color: "#2563EB",
    },
    Staff: {
      bgcolor: "rgba(16, 185, 129, 0.12)",
      color: "#10B981",
    },
    TECHNICAL_STAFF: {
      bgcolor: "rgba(124, 58, 237, 0.12)",
      color: "#7C3AED",
    },
  };

  return {
    ...styles[role] || { bgcolor: "rgba(156, 163, 175, 0.12)", color: "#9CA3AF" },
    fontSize: "0.65rem",
    height: 20,
    borderRadius: "6px",
    fontWeight: 700,
  };
};