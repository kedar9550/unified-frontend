
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
    usersCount: 0,
    rolesCount: 0,
    departmentsList: [],
    programsList: [],
    branchesList: [],
    recentUsers: [],
    roleDistribution: []
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
            usersCount: res.data.data.usersCount || 0,
            rolesCount: res.data.data.rolesCount || 0,
            departmentsList: res.data.data.departmentsList || [],
            programsList: res.data.data.programsList || [],
            branchesList: res.data.data.branchesList || [],
            recentUsers: (res.data.data.recentUsers || []).filter(Boolean),
            roleDistribution: res.data.data.roleDistribution || []
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

  const COLORS = ["#2196f3", "#4caf50", "#ff9800", "#f44336", "#9c27b0"];

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
  ];

  const quickActions = [
    { title: "Add Academic Year", desc: "Create new year", icon: <AddBox color="primary" />, path: "/academics/management" },
    { title: "Add Department", desc: "Create new department", icon: <DomainAdd color="success" />, path: "/academics/department" },
    { title: "Add Program / Branch", desc: "Add program or branch", icon: <AccountTree color="secondary" />, path: "/academics/programs" },
    { title: "Add User", desc: "Register new user", icon: <PersonAdd sx={{ color: "#00b0ff" }} />, path: "/student/student-uploads" },
    { title: "Create Role", desc: "Define new role", icon: <VpnKey color="error" />, path: "/academics/roles" },
    { title: "Assign Role", desc: "Assign role to user", icon: <AssignmentInd color="warning" />, path: "/academics/roles" },
    { title: "Manage SDGs", desc: "Manage SDG keywords", icon: <AutoFixHighIcon sx={{ color: "#9c27b0" }} />, path: "/uniprime/sdg-management" },
  ];

  const recentUsers = dashboardData.recentUsers || [];

  const recentActivity = [
    { title: "Academic Year 2024-25 activated", by: "UniPrime", time: "10 min ago", icon: <CalendarMonth color="success" /> },
    { title: "Department 'Computer Science' added", by: "UniPrime", time: "25 min ago", icon: <AccountBalance color="primary" /> },
    { title: "12 new users registered", by: "UniPrime", time: "1 hour ago", icon: <PeopleAlt color="info" /> },
    { title: "Role 'HOD' updated", by: "UniPrime", time: "2 hours ago", icon: <Security color="warning" /> },
  ];

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
                  flex: { xs: "1 1 100%", sm: "1 1 calc(50% - 24px)", md: "1 1 calc(33.33% - 24px)", lg: "1 1 calc(20% - 24px)" },
                  display: 'flex',
                  minWidth: "200px"
                }}
              >
                <Card
                  sx={{
                    position: "relative",
                    borderRadius: 1,
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
                  borderRadius: 1,
                  boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
                  p: 2.5,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-panel)",
                }}
              >
                {/* Header */}
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
                  <Typography sx={{ fontWeight: 700 }}>
                    Academic Structure Overview
                  </Typography>
                  <Button
                    size="small"
                    sx={{ textTransform: "none", fontSize: "0.8rem", color: "var(--color-primary)" }}
                  >
                    View Full Structure →
                  </Button>
                </Box>

                {/* 3 Column Layout */}
                <Box sx={{ display: "flex", flexDirection: { xs: 'column', lg: 'row' }, gap: 2 }}>

                  {/* Departments */}
                  <Box sx={columnCard("var(--bg-accent-1)")}>
                    <TopBlock icon={<AccountBalance color="primary" />} title="Departments" value={dashboardData.departmentsCount} />
                    <Divider sx={{ my: 1 }} />
                    {dashboardData.departmentsList.slice(0, 5).map((dept, idx) => (
                      <RowItem key={dept._id || idx} label={dept.departmentName || `Dept ${idx + 1}`} value={dept.departmentCode || ""} />
                    ))}
                  </Box>

                  {/* Programs */}
                  <Box sx={columnCard("var(--bg-accent-2)")}>
                    <TopBlock icon={<School color="success" />} title="Programs" value={dashboardData.programsList.length} />
                    <Divider sx={{ my: 1 }} />
                    {dashboardData.programsList.slice(0, 5).map((prog, idx) => (
                      <RowItem key={prog._id || idx} label={prog.programName || `Program ${idx + 1}`} value={prog.programCode || ""} />
                    ))}
                  </Box>

                  {/* Branches */}
                  <Box sx={columnCard("var(--bg-accent-3)")}>
                    <TopBlock icon={<AccountTree color="secondary" />} title="Branches" value={dashboardData.branchesList.length} />
                    <Divider sx={{ my: 1 }} />
                    {dashboardData.branchesList.slice(0, 5).map((branch, idx) => (
                      <RowItem key={branch._id || idx} label={branch.branchName || `Branch ${idx + 1}`} value={branch.branchCode || ""} />
                    ))}
                  </Box>

                </Box>
              </Card>
            </Box>

            {/* Active Academic Configuration */}
            <Box sx={{ width: { xs: "100%", lg: "50%" }, display: "flex" }}>


              <Card
                sx={{
                  borderRadius: 1,
                  boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
                  p: 2.5,
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

                {/* Card 2 */}
                <Box sx={configBox}>
                  <Box>
                    <Typography sx={labelStyle}>
                      Active Semester
                    </Typography>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography sx={valueStyle}>{dashboardData.activeSemester}</Typography>
                      <Chip label="Active" size="small" sx={activeChip} />
                    </Box>
                  </Box>

                  <Box sx={iconBox("var(--bg-accent-5)")}>
                    <MenuBook sx={{ color: "#8B5CF6" }} />
                  </Box>
                </Box>

                {/* Duration */}
                <Box sx={{ ...configBox, display: "block" }}>
                  <Box sx={{ display: "flex", gap: 2, mb: 1.5, alignItems: "center" }}>
                    <CalendarMonth sx={{ color: "var(--color-primary)" }} />
                    <Box>
                      <Typography sx={labelStyle}>
                        Semester Duration
                      </Typography>
                      <Typography sx={{ fontWeight: 600 }}>
                        Jan 15, 2025 - May 30, 2025
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ width: "100%" }}>
                    <LinearProgress
                      variant="determinate"
                      value={60}
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
                      136 days remaining
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
                borderRadius: 1, 
                boxShadow: "0 2px 10px rgba(0,0,0,0.05)", 
                height: "100%", 
                width: "100%",
                display: "flex",
                flexDirection: "column",
                border: "1px solid var(--border-color)",
                background: "var(--bg-panel)",
              }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>User & Role Overview</Typography>
                    <Button size="small" sx={{ textTransform: "none", fontSize: "0.75rem", color: "var(--color-primary)" }}>View All Users &gt;</Button>
                  </Box>

                  <Box sx={{
                    display: "flex",
                    flexDirection: { xs: 'column', md: 'row' },
                    alignItems: { xs: 'stretch', md: 'center' },
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
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={2}
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
                        <Typography sx={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)" }}>
                          {dashboardData.usersCount}
                        </Typography>

                        <Typography sx={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>
                          Total Users
                        </Typography>
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: "1px solid #E5E7EB",
                        width: { xs: '100%', md: 'auto' },
                        minWidth: { md: 150 },
                        flexGrow: 1,
                      }}
                    >
                      {dashboardData.roleDistribution.map((role, idx) => {
                        const percent =
                          dashboardData.usersCount > 0
                            ? ((role.value / dashboardData.usersCount) * 100).toFixed(1)
                            : 0;

                        return (
                          <Box
                            key={idx}
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              mb: 1.5,
                            }}
                          >
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  bgcolor: COLORS[idx % COLORS.length],
                                }}
                              />
                              <Typography sx={{ fontSize: 13 }}>
                                {role.label}
                              </Typography>
                            </Box>

                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                              <Typography sx={{ fontSize: 13, fontWeight: 700, minWidth: 25, textAlign: "right", color: "var(--text-primary)" }}>
                                {role.value}
                              </Typography>
                              <Typography sx={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500, minWidth: 45, textAlign: "right" }}>
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
                borderRadius: 1, 
                boxShadow: "0 2px 10px rgba(0,0,0,0.05)", 
                height: "100%", 
                width: "100%",
                display: "flex",
                flexDirection: "column",
                border: "1px solid var(--border-color)",
                background: "var(--bg-panel)",
              }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Quick Actions</Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                    {quickActions.map((action, i) => (
                      <Box key={i} sx={{ flex: { xs: "1 1 100%", sm: "1 1 calc(50% - 8px)" }, display: 'flex' }}>
                        <Paper
                          variant="outlined"
                          onClick={() => navigate(action.path)}
                          sx={{
                            p: 2.2,
                            borderRadius: 1,
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            cursor: "pointer",
                            height: "100%",
                            width: "100%",
                            border: "1px solid var(--border-color)",
                            backgroundColor: "var(--bg-paper)",
                            transition: "all 0.25s ease",

                            "&:hover": {
                              borderColor: "var(--color-primary)",
                              backgroundColor: "var(--bg-panel)",
                              transform: "translateY(-2px)",
                              boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
                            },
                          }}
                        >
                          {/* Icon */}
                          <Box
                            sx={{
                              width: 42,
                              height: 42,
                              borderRadius: 1,
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
  borderRadius: 1,
  border: "1px solid var(--border-color)",
  background: "var(--bg-panel)",
};

const iconBox = (bg) => ({
  width: 48,
  height: 48,
  borderRadius: 1,
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
  bgcolor: "#DCFCE7",
  color: "#16A34A",
  fontSize: "0.65rem",
  height: 20,
  borderRadius: 1,
};

const roleChip = (role) => {
  const styles = {
    Faculty: {
      bgcolor: "#E0ECFF",
      color: "#2563EB",
    },
    Staff: {
      bgcolor: "#DCFCE7",
      color: "#16A34A",
    },
    Technician: {
      bgcolor: "#F3E8FF",
      color: "#7C3AED",
    },
  };

  return {
    ...styles[role],
    fontSize: "0.65rem",
    height: 20,
    borderRadius: 1,
    fontWeight: 600,
  };
};