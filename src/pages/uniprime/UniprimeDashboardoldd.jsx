import React from "react";
import {
  Grid, Card, Typography, Box, Button, Chip,
  LinearProgress, List, ListItem, ListItemAvatar,
  Avatar, ListItemText
} from "@mui/material";

import {
  School, People, Security, CalendarMonth,
  Business, AccountTree, MenuBook,
  Event, KeyboardArrowRight, PersonAdd
} from "@mui/icons-material";

import DashboardCard from "../../components/DashboardCard";

const glass = {
  borderRadius: "20px",
  p: 2.5,
  background: "rgba(255,255,255,0.75)",
  backdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,0.5)",
  boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
};

const iconBox = (color) => ({
  p: 1.2,
  borderRadius: "10px",
  background: `${color}15`,
  color,
  display: "flex",
});

const UniprimeDashboard = () => (
  <Box
    sx={{
      p: 3,
      background: "#eef2ff7a",
      minHeight: "100vh",
    }}
  >
    <Grid container spacing={3}>

      {/* 🔷 TOP CARDS */}
      {[
        { title: "Academic Years", value: "6", icon: <CalendarMonth />, color: "#3b82f6", subtitle: "Total Years" },
        { title: "Active Year", value: "2024-25", icon: <School />, color: "#10b981", subtitle: "Active" },
        { title: "Departments", value: "12", icon: <Business />, color: "#8b5cf6", subtitle: "Total Departments" },
        { title: "Users", value: "428", icon: <People />, color: "#f59e0b", subtitle: "Total Users" },
        { title: "Roles", value: "15", icon: <Security />, color: "#ef4444", subtitle: "Total Roles" },
      ].map((card, i) => (
        <Grid item xs={12} sm={6} md={4} key={i} sx={{ width: { lg: '20%' }, flexBasis: { lg: '20%' }, maxWidth: { lg: '20%' } }}>
          <Card sx={{ ...glass, p: 2 }}>
            <Box display="flex" justifyContent="space-between">
              <Box>
                <Typography fontSize={13} color="text.secondary">
                  {card.title}
                </Typography>
                <Typography fontSize={24} fontWeight={800}>
                  {card.value}
                </Typography>
                <Typography fontSize={12} color="text.secondary">
                  {card.subtitle}
                </Typography>
              </Box>
              <Box sx={iconBox(card.color)}>{card.icon}</Box>
            </Box>
          </Card>
        </Grid>
      ))}

      {/* 🔷 ACADEMIC STRUCTURE */}
      <Grid item xs={12} lg={5} md={12}>
        <Card sx={{ ...glass, height: '100%' }}>
          <Box display="flex" justifyContent="space-between" mb={2}>
            <Typography fontWeight={700}>
              Academic Structure Overview
            </Typography>
            <Button size="small" endIcon={<KeyboardArrowRight />}>
              View Full Structure
            </Button>
          </Box>

          <Grid container spacing={2} mb={2}>
            {[
              { label: "Departments", value: 12, color: "#3b82f6" },
              { label: "Programs", value: 24, color: "#6366f1" },
              { label: "Branches", value: 48, color: "#10b981" },
            ].map((item, i) => (
              <Grid item xs={4} key={i}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: "14px",
                    bgcolor: "#f9fafb",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <Typography fontSize={12} color="text.secondary">
                    {item.label}
                  </Typography>
                  <Typography fontSize={20} fontWeight={800}>
                    {item.value}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={2}>
            {[
              ["Engineering", "Management", "Sciences"],
              ["B.Tech", "M.Tech", "MBA"],
              ["CSE", "ECE", "MECH"],
            ].map((col, i) => (
              <Grid item xs={4} key={i}>
                {col.map((item, idx) => (
                  <Box
                    key={idx}
                    display="flex"
                    justifyContent="space-between"
                    mb={1}
                  >
                    <Typography fontSize={13}>{item}</Typography>
                    <Typography fontSize={13} fontWeight={600}>
                      {[5, 2, 2, 8, 6, 2, 12, 10, 8][i * 3 + idx]}
                    </Typography>
                  </Box>
                ))}
              </Grid>
            ))}
          </Grid>
        </Card>
      </Grid>

      {/* 🔷 ACTIVE CONFIG */}
      <Grid item xs={12} lg={4} md={6}>
        <Card sx={{ ...glass, height: '100%' }}>
          <Box display="flex" justifyContent="space-between" mb={2}>
            <Typography fontWeight={700}>
              Active Academic Configuration
            </Typography>
            <Chip
              label="All Systems Operational"
              size="small"
              color="success"
            />
          </Box>

          {[
            { title: "Active Academic Year", value: "2024-25", icon: <CalendarMonth /> },
            { title: "Active Semester", value: "Semester 2", icon: <MenuBook /> },
          ].map((item, i) => (
            <Box key={i} sx={configBox}>
              <Box>
                <Typography fontSize={12} color="text.secondary">
                  {item.title}
                </Typography>
                <Typography fontWeight={700}>{item.value}</Typography>
                <Chip label="Active" size="small" color="success" />
              </Box>
              <Box sx={iconBox("#6366f1")}>{item.icon}</Box>
            </Box>
          ))}

          <Box sx={configBox}>
            <Box>
              <Typography fontSize={12}>Semester Duration</Typography>
              <Typography fontWeight={600}>
                Jan 15 - May 30
              </Typography>
              <Typography fontSize={12} color="text.secondary">
                136 days remaining
              </Typography>
              <LinearProgress
                value={60}
                variant="determinate"
                sx={{ mt: 1, height: 6, borderRadius: 3 }}
              />
            </Box>
          </Box>
        </Card>
      </Grid>

      {/* 🔷 RECENT USERS */}
      <Grid item xs={12} lg={3} md={6}>
        <Card sx={{ ...glass, height: '100%' }}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography fontWeight={700}>
              Recently Added Users
            </Typography>
            <Button size="small">View All</Button>
          </Box>

          <List>
            {["Ananya Sharma", "Rahul Verma", "Priya Singh"].map((name, i) => (
              <ListItem key={i} sx={{ px: 0 }}>
                <ListItemAvatar>
                  <Avatar>{name[0]}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={name}
                  secondary="Faculty"
                />
                <Typography fontSize={12}>2h</Typography>
              </ListItem>
            ))}
          </List>
        </Card>
      </Grid>

      {/* 🔷 USER OVERVIEW */}
      <Grid item xs={12} lg={7} md={6}>
        <Card sx={{ ...glass, height: '100%' }}>
          <Box display="flex" justifyContent="space-between" mb={2}>
            <Typography fontWeight={700}>
              User & Role Overview
            </Typography>
            <Button size="small" endIcon={<KeyboardArrowRight />}>
              View All Users
            </Button>
          </Box>

          <Grid container spacing={3} alignItems="center">
            {/* Left side: Doughnut-like visualization and stats */}
            <Grid item xs={12} sm={6}>
              <Box display="flex" alignItems="center">
                <Box
                  sx={{
                    width: 140,
                    height: 140,
                    borderRadius: "50%",
                    border: "12px solid #10b981", // Staff green
                    borderTopColor: "#3b82f6", // Faculty blue
                    borderRightColor: "#f59e0b", // Students yellow
                    borderBottomColor: "#ef4444", // Technicians red
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    mr: 3
                  }}
                >
                  <Typography fontSize={24} fontWeight={800}>428</Typography>
                  <Typography fontSize={11} color="text.secondary">Total Users</Typography>
                </Box>
                <Box flex={1}>
                  {[
                    { label: "Faculty", value: 182, percent: "42.5%", color: "#3b82f6" },
                    { label: "Staff", value: 156, percent: "36.4%", color: "#10b981" },
                    { label: "Students", value: 76, percent: "17.8%", color: "#f59e0b" },
                    { label: "Technicians", value: 14, percent: "3.3%", color: "#ef4444" },
                  ].map((item, i) => (
                    <Box key={i} display="flex" justifyContent="space-between" mb={1} alignItems="center">
                      <Box display="flex" alignItems="center">
                        <Box sx={{ w: 8, h: 8, borderRadius: '50%', bgcolor: item.color, width: 8, height: 8, mr: 1 }} />
                        <Typography fontSize={12} color="text.secondary">{item.label}</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography fontSize={12} fontWeight={600}>{item.value}</Typography>
                        <Typography fontSize={11} color="text.secondary" sx={{ width: 35, textAlign: 'right' }}>{item.percent}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Grid>

            {/* Right side: Role Distribution */}
            <Grid item xs={12} sm={6}>
              <Typography fontSize={12} color="text.secondary" mb={2}>
                Role Distribution
              </Typography>
              {[
                { label: "Super Admin", value: 2, color: "#8b5cf6" },
                { label: "Admin", value: 8, color: "#3b82f6" },
                { label: "HOD", value: 28, color: "#f59e0b" },
                { label: "Faculty", value: 182, color: "#ef4444" },
                { label: "Staff", value: 156, color: "#10b981" },
                { label: "Technician", value: 14, color: "#6366f1" },
                { label: "Student", value: 76, color: "#0ea5e9" },
              ].map((item, i) => (
                <Box key={i} display="flex" alignItems="center" mb={1.2}>
                  <Typography fontSize={12} sx={{ width: 80 }}>{item.label}</Typography>
                  <Box flex={1} mx={1}>
                    <LinearProgress
                      value={(item.value / 182) * 100} // Relative to max value
                      variant="determinate"
                      sx={{ 
                        height: 6, 
                        borderRadius: 3, 
                        bgcolor: '#f1f5f9',
                        '& .MuiLinearProgress-bar': { bgcolor: item.color }
                      }}
                    />
                  </Box>
                  <Typography fontSize={12} fontWeight={600} sx={{ width: 20, textAlign: 'right' }}>{item.value}</Typography>
                </Box>
              ))}
            </Grid>
          </Grid>
        </Card>
      </Grid>

      {/* 🔷 QUICK ACTIONS */}
      <Grid item xs={12} lg={5} md={6}>
        <Card sx={{ ...glass, height: '100%' }}>
          <Typography fontWeight={700} mb={2}>
            Quick Actions
          </Typography>

          <Grid container spacing={2}>
            {[
              { label: "Add Academic Year", icon: <CalendarMonth /> },
              { label: "Add Department", icon: <Business /> },
              { label: "Add Program", icon: <AccountTree /> },
              { label: "Add User", icon: <PersonAdd /> },
            ].map((a, i) => (
              <Grid item xs={6} key={i}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: "14px",
                    border: "1px solid #e5e7eb",
                    bgcolor: "#f9fafb",
                    cursor: "pointer",
                    transition: "0.2s",
                    "&:hover": {
                      bgcolor: "#eef2ff",
                      transform: "translateY(-3px)",
                    },
                  }}
                >
                  {a.icon}
                  <Typography fontSize={13}>{a.label}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Card>
      </Grid>

    </Grid>
  </Box>
);

const configBox = {
  p: 2,
  borderRadius: "14px",
  bgcolor: "#ffffffcc",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  mb: 2,
};

export default UniprimeDashboard;