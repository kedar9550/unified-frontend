import React, { useState, useEffect } from "react";
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
  CircularProgress,
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
} from "@mui/icons-material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import MenuBook from "@mui/icons-material/MenuBook";
import API from "../../api/axios";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const UniprimeDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    academicYearsCount: 0,
    activeYear: "N/A",
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
      try {
        setLoading(true);
        const res = await API.get('/api/dashboard/uniprime');

        if (res.data?.status === 'success') {
          setDashboardData({
            academicYearsCount: res.data.data.academicYearsCount || 0,
            activeYear: res.data.data.activeYear || "N/A",
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
        setLoading(false);
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
  },
  {
    title: "Active Year",
    value: dashboardData.activeYear,
    icon: <School />,
    gradient: "linear-gradient(135deg, #10B981, #059669)",
    color: "#10B981",
    bgDark: "rgba(16, 185, 129, 0.15)",
    subtitle: <Chip label="Active" size="small" color="success" />,
    linkText: "Manage Years",
  },
  {
    title: "Departments",
    value: dashboardData.departmentsCount,
    icon: <AccountBalance />,
    gradient: "linear-gradient(135deg, #8B5CF6, #6D28D9)",
    color: "#8B5CF6",
    bgDark: "rgba(139, 92, 246, 0.15)",
    linkText: "View All",
  },
  {
    title: "Users",
    value: dashboardData.usersCount,
    icon: <Group />,
    gradient: "linear-gradient(135deg, #F59E0B, #D97706)",
    color: "#F59E0B",
    bgDark: "rgba(245, 158, 11, 0.15)",
    linkText: "Manage Users",
  },
  {
    title: "Roles",
    value: dashboardData.rolesCount,
    icon: <Shield />,
    gradient: "linear-gradient(135deg, #EF4444, #DC2626)",
    color: "#EF4444",
    bgDark: "rgba(239, 68, 68, 0.15)",
    linkText: "Manage Roles",
  },
];

  const quickActions = [
    { title: "Add Academic Year", desc: "Create new year", icon: <AddBox color="primary" /> },
    { title: "Add Department", desc: "Create new department", icon: <DomainAdd color="success" /> },
    { title: "Add Program / Branch", desc: "Add program or branch", icon: <AccountTree color="secondary" /> },
    { title: "Add User", desc: "Register new user", icon: <PersonAdd sx={{ color: "#00b0ff" }} /> },
    { title: "Create Role", desc: "Define new role", icon: <VpnKey color="error" /> },
    { title: "Assign Role", desc: "Assign role to user", icon: <AssignmentInd color="warning" /> },
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
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: "#1a237e", mb: 0.5 }}>
          Welcome back, UniPrime! 👋
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Super Admin Dashboard • Monitor and manage the entire university ecosystem.
        </Typography>
      </Box>

     

      {/* Row 1: Summary Cards */}

    <Grid container spacing={3} sx={{ mb: 4 }}>
      {topCards.map((card, i) => (
        <Grid
          item
          key={i}
          xs={12}
          sm={6}
          md={4}
          lg
          sx={{
            flex: "1 1 0",
            minWidth: 0,
          }}
        >
          <Card
            sx={{
              borderRadius: 1,
              boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
               transition: "all 0.25s ease",
                "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 12px 30px rgba(0,0,0,0.1)",
                },
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              p: 2.5,
            }}
          >
       
        {/* Top Content */}
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
          
          {/* Icon */}
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: card.gradient,
              boxShadow: "0 8px 18px rgba(0,0,0,0.12)",
              color: "#fff",
              position: "relative",
              overflow: "hidden",
              "&::after": {
                content: '""',
                position: "absolute",
                inset: 0,
                background: "linear-gradient(180deg, #ffffff30, transparent)",
                borderRadius: 1,
              },
              transition: "all 0.3s ease",
              ".dark-mode &": {
                background: card.bgDark,
                color: card.color,
                boxShadow: "none",
              },
              ".dark-mode &::after": {
                display: "none",
              }
            }}>
              {React.cloneElement(card.icon, { fontSize: "medium" })}
            </Box>

          {/* Text */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.3 }}>
            <Typography
              variant="body2"
              sx={{ color: "#6B7280", fontWeight: 600 }}
            >
              {card.title}
            </Typography>

            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: "#111827", mt: 0.5 }}
            >
              {card.value}
            </Typography>

            {/* Subtitle / Badge */}
            <Box sx={{ mt: 0.8 }}>
              {typeof card.subtitle === "string" ? (
                <Typography variant="caption" sx={{ color: "#9CA3AF" }}>
                  {card.subtitle}
                </Typography>
              ) : (
                card.subtitle
              )}
            </Box>
          </Box>
        </Box>

        {/* Bottom Link */}
        <Box sx={{ mt: 2 }}>
          <Button
            size="small"
            endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
            sx={{
              textTransform: "none",
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "var(--color-primary)",
              p: 0,
              "&:hover": { background: "transparent", opacity: 0.8 },
            }}
          >
            {card.linkText}
          </Button>
        </Box>
      </Card>
    </Grid>
  ))}
</Grid>

      {/* Row 2: Middle Panels */}
      <Grid container spacing={3} sx={{ mb: 3, alignItems: "stretch" }}>
        {/* Academic Structure Overview */}
        <Grid item xs={12} md={4} sx={{ display: "flex" }}>
          <Card
            sx={{
              borderRadius: 1,
              boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
              p: 2.5,
              height: "100%",   
    display: "flex",
    flexDirection: "column",
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
            <Box sx={{ display: "flex", gap: 2 }}>
              
              {/* Departments */}
              <Box sx={columnCard("var(--bg-accent-1)")}>
                <TopBlock icon={<AccountBalance color="primary" />} title="Departments" value={dashboardData.departmentsCount} />
                <Divider sx={{ my: 1 }} />
                {dashboardData.departmentsList.slice(0, 5).map((dept, idx) => (
                  <RowItem key={dept._id || idx} label={dept.departmentName || `Dept ${idx+1}`} value={dept.departmentCode || ""} />
                ))}
              </Box>

              {/* Programs */}
              <Box sx={columnCard("var(--bg-accent-2)")}>
                <TopBlock icon={<School color="success" />} title="Programs" value={dashboardData.programsList.length} />
                <Divider sx={{ my: 1 }} />
                {dashboardData.programsList.slice(0, 5).map((prog, idx) => (
                  <RowItem key={prog._id || idx} label={prog.programName || `Program ${idx+1}`} value={prog.programCode || ""} />
                ))}
              </Box>

              {/* Branches */}
              <Box sx={columnCard("var(--bg-accent-3)")}>
                <TopBlock icon={<AccountTree color="secondary" />} title="Branches" value={dashboardData.branchesList.length} />
                <Divider sx={{ my: 1 }} />
                {dashboardData.branchesList.slice(0, 5).map((branch, idx) => (
                  <RowItem key={branch._id || idx} label={branch.branchName || `Branch ${idx+1}`} value={branch.branchCode || ""} />
                ))}
              </Box>

            </Box>
          </Card>
        </Grid>

        {/* Active Academic Configuration */}

        <Grid item xs={12} md={4} sx={{ display: "flex" }}>
            <Card
              sx={{
                borderRadius: 1,
                boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
                p: 2.5,
                height: "100%",
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
                    bgcolor: "#E6F9F0",
                    color: "#059669",
                    fontWeight: 600,
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
                  <CalendarMonth sx={{ color: "#2563EB" }} />
                </Box>
              </Box>

              {/* Card 2 */}
              <Box sx={configBox}>
                <Box>
                  <Typography sx={labelStyle}>
                    Active Semester
                  </Typography>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography sx={valueStyle}>Semester 2</Typography>
                    <Chip label="Active" size="small" sx={activeChip} />
                  </Box>
                </Box>

                <Box sx={iconBox("var(--bg-accent-5)")}>
                  <MenuBook sx={{ color: "#7C3AED" }} />
                </Box>
              </Box>

              {/* Duration */}
              <Box sx={configBox}>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <CalendarMonth sx={{ color: "#2563EB", mt: 0.5 }} />

                  <Box sx={{ flex: 1 }}>
                    <Typography sx={labelStyle}>
                      Semester Duration
                    </Typography>

                    <Typography sx={{ fontWeight: 600 }}>
                      Jan 15, 2025 - May 30, 2025
                    </Typography>

                    <LinearProgress
                      variant="determinate"
                      value={60}
                      sx={{
                        mt: 1,
                        height: 5,
                        borderRadius: 2,
                        bgcolor: "#E5E7EB",
                        "& .MuiLinearProgress-bar": {
                          bgcolor: "#2563EB",
                        },
                      }}
                    />

                    <Typography
                      sx={{
                        fontSize: "0.75rem",
                        color: "#2563EB",
                        mt: 0.5,
                        fontWeight: 500,
                      }}
                    >
                      136 days remaining
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Card>
          </Grid>

        {/* Recently Added Users */}     

        {/* <Grid item xs={12} md={4} sx={{ display: "flex" }}>
        <Card
          sx={{
            borderRadius: 1,
            boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
            p: 2,
            height: "100%",
          }}
        >
       
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography sx={{ fontWeight: 700 }}>
              Recently Added Users
            </Typography>

            <Button
              size="small"
              sx={{
                textTransform: "none",
                fontSize: "0.8rem",
                color: "var(--color-primary)",
              }}
            >
              View All →
            </Button>
          </Box>

        
          <Box>
            {recentUsers.map((user, i) => (
              <Box
                key={i}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  py: 1.5,
                  borderBottom: i !== recentUsers.length - 1 ? "1px solid #F1F5F9" : "none",
                }}
              >
              
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  
                  <Avatar
                  alt={user?.name || ""}
                  src={user?.avatar}
                  sx={{
                    width: 38,
                    height: 38,
                    fontSize: "0.9rem",
                    bgcolor: "#E5E7EB",
                    color: "#374151",
                    fontWeight: 600,
                  }}
                />

                  <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: "0.9rem" }}>
                      {user?.name || "kavi"}
                    </Typography>

                    <Typography
                      sx={{
                        fontSize: "0.75rem",
                        color: "#6B7280",
                      }}
                    >
                      {user?.email || ""}
                    </Typography>
                  </Box>
                </Box>

              
                <Box sx={{ textAlign: "right" }}>
                 

                  <Chip
                    label={user?.role}
                    size="small"
                    sx={roleChip(user?.role)}
                  />

                   <Typography
                    sx={{
                      fontSize: "0.7rem",
                      color: "#9CA3AF",
                      mb: 0.5,
                    }}
                  >
                    {user?.time ? new Date(user.time).toLocaleDateString() : 'Recently'}
                  </Typography>

                </Box>
              </Box>
            ))}
          </Box>
        </Card>
      </Grid> */}

      </Grid>

      {/* Row 3: Bottom Panels */}
      <Box sx={{ display: "flex", gap: 3, flexWrap: { xs: "wrap", lg: "nowrap" } }}>
        {/* User & Role Overview */}
        <Box sx={{ width: { xs: "100%", lg: "50%" }, display: "flex" }}>
          <Card sx={{ borderRadius: 1, boxShadow: "0 2px 10px rgba(0,0,0,0.05)", height: "100%", width: "100%",
                    display: "flex",
                    flexDirection: "column" }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>User & Role Overview</Typography>
                <Button size="small" sx={{ textTransform: "none", fontSize: "0.75rem", color: "var(--color-primary)" }}>View All Users &gt;</Button>
              </Box>
              
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "nowrap", gap: 2 }}>
                {/* Chart */}
                <Box sx={{ position: "relative", width: 200, height: 200, flexShrink: 0 }}>
                  <ResponsiveContainer>
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
                    <Typography sx={{ fontSize: 28, fontWeight: 700, color: "#111827" }}>
                      {dashboardData.usersCount}
                    </Typography>

                    <Typography sx={{ fontSize: 12, color: "#6B7280" }}>
                      Total Users
                    </Typography>
                  </Box>
                </Box>
               <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: "1px solid #E5E7EB",
                    minWidth: 150,
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

                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                          {role.value} &nbsp;
                          <span style={{ color: "#6B7280", fontWeight: 400 }}>
                            {percent}%
                          </span>
                        </Typography>
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
          <Card sx={{ borderRadius: 1, boxShadow: "0 2px 10px rgba(0,0,0,0.05)", height: "100%", width: "100%",
    display: "flex",
    flexDirection: "column" }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Quick Actions</Typography>
              <Grid container spacing={1.5}>
                {quickActions.map((action, i) => (
                  <Grid item xs={6} key={i}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2.2,
                        borderRadius: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        cursor: "pointer",
                        height: "100%",
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
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Box>

        

      </Box>
        </>
      )}
    </Box>
  );
};

export default UniprimeDashboard;

const columnCard = (bg) => ({
  flex: 1,
  borderRadius: 1,
  padding: "16px",
  background: bg,
  display: "flex",
  flexDirection: "column",
  minHeight: 220,
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
      borderBottom: "1px solid #e5e7eb",
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
  color: "#6B7280",
  fontWeight: 500,
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