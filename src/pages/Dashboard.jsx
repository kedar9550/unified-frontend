import React from 'react';
import { useAuth } from "../context/AuthContext";
import { Box, Typography } from "@mui/material";

import FacultyDashboard from "./faculty/FacultyDashboard";
import UniprimeDashboard from "./uniprime/UniprimeDashboard";
import HODDashboard from "./hod/HODDashboard";
import ExamDashboard from "./examAdmin/ExamDashboard";
import StudentDashboard from "./student/StudentDashboard";
import ResearchFeedbackDashboard from "./feedback/ResearchFeedbackDashboard";
import FeedbackCoordinatorDashboard from "./feedback/FeedbackCoordinatorDashboard";

function Dashboard() {
  const { activeRole } = useAuth();

  // If no role is active yet, show a fallback
  if (!activeRole) {
    return <Box sx={{ p: 3 }}>Loading Dashboard...</Box>;
  }

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Typography variant="h4" fontWeight={800} color="#1a237e" mb={3} sx={{ textTransform: 'capitalize' }}>
        {activeRole.toLowerCase()} Dashboard
      </Typography>

      {/* 🎯 ROLE-BASED DASHBOARD */}
      {activeRole === "FACULTY" && <FacultyDashboard />}
      {activeRole === "UNIPRIME" && <UniprimeDashboard />}
      {activeRole === "HOD" && <HODDashboard />}
      {activeRole === "EXAMSECTION" && <ExamDashboard />}
      {activeRole === "STUDENT" && <StudentDashboard />}
      {activeRole === "RESEARCH FEEDBACK COMMITTEE" && <ResearchFeedbackDashboard />}
      {activeRole === "FEEDBACK COORDINATOR" && <FeedbackCoordinatorDashboard />}
    </Box>
  );
}

export default Dashboard;

// --- Sample Dashboards ---

const DashboardCard = ({ title, value, icon, color }) => (
  <Card sx={{ 
    borderRadius: '20px', 
    background: 'rgba(255, 255, 255, 0.55)', 
    backdropFilter: 'blur(10px) saturate(150%)', 
    border: '1px solid rgba(255, 255, 255, 0.4)',
    boxShadow: '0 8px 32px rgba(31, 38, 135, 0.05)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    '&:hover': { 
      transform: 'translateY(-5px)',
      boxShadow: `0 12px 40px ${color}20` 
    }
  }}>
    <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
      <Box sx={{ p: 2.5, borderRadius: '16px', background: `${color}15`, color: color, mr: 2.5 }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="h4" fontWeight={800} color="#1a237e">{value}</Typography>
        <Typography variant="body2" color="textSecondary" fontWeight={600}>{title}</Typography>
      </Box>
    </CardContent>
  </Card>
);

const FacultyDashboard = () => (
  <Box sx={{ 
    display: 'grid', 
    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, 
    gap: 3 
  }}>
    <DashboardCard title="Active Classes" value="4" icon={<School fontSize="large" />} color="#1976d2" />
    <DashboardCard title="Total Students" value="180" icon={<People fontSize="large" />} color="#2e7d32" />
    <DashboardCard title="Pending Assignments" value="12" icon={<Assessment fontSize="large" />} color="#ed6c02" />
    
    <Box sx={{ gridColumn: { xs: '1', md: 'span 2' } }}>
      <Card sx={{ mt: 2, borderRadius: '20px', p: 3, background: 'rgba(255, 255, 255, 0.55)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.4)' }}>
        <Typography variant="h6" fontWeight={800} color="#1a237e" mb={3}>Today's Schedule</Typography>
        <Box sx={{ p: 2, bgcolor: 'rgba(25, 118, 210, 0.08)', borderRadius: '12px', mb: 2, borderLeft: '5px solid #1976d2' }}>
          <Typography fontWeight={700} color="#1976d2">Data Structures (CSE-A)</Typography>
          <Typography variant="body2" color="textSecondary" fontWeight={500}>10:00 AM - 11:30 AM | Room 402</Typography>
        </Box>
        <Box sx={{ p: 2, bgcolor: 'rgba(237, 108, 2, 0.08)', borderRadius: '12px', borderLeft: '5px solid #ed6c02' }}>
          <Typography fontWeight={700} color="#ed6c02">Algorithms Lab (CSE-B)</Typography>
          <Typography variant="body2" color="textSecondary" fontWeight={500}>1:00 PM - 3:00 PM | Lab 2</Typography>
        </Box>
      </Card>
    </Box>
  </Box>
);

const AdminDashboard = () => (
  <Box sx={{ 
    display: 'grid', 
    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, 
    gap: 3 
  }}>
    <DashboardCard title="Total Users" value="4,250" icon={<People fontSize="large" />} color="#9c27b0" />
    <DashboardCard title="Active Faculties" value="320" icon={<School fontSize="large" />} color="#1976d2" />
    <DashboardCard title="System Alerts" value="3" icon={<Notifications fontSize="large" />} color="#d32f2f" />
    <DashboardCard title="Events Today" value="5" icon={<Event fontSize="large" />} color="#2e7d32" />
    
    <Box sx={{ gridColumn: { xs: '1', md: 'span 3' } }}>
      <Card sx={{ mt: 2, borderRadius: '20px', p: 3, minHeight: '280px', background: 'rgba(255, 255, 255, 0.55)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.4)' }}>
        <Typography variant="h6" fontWeight={800} color="#1a237e" mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AdminPanelSettings color="primary" /> System Overview
        </Typography>
        <Typography color="textSecondary" fontWeight={500} sx={{ lineHeight: 1.6 }}>
          Welcome to the Uniprime administrative console. Here you can monitor overall system health, manage roles, and track institutional metrics. Select an option from the sidebar to begin managing the institution.
        </Typography>
      </Card>
    </Box>
  </Box>
);

const HODDashboard = () => (
  <Box sx={{ p: 4, bgcolor: 'rgba(255, 255, 255, 0.55)', backdropFilter: 'blur(10px)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.4)' }}>
    <Typography variant="h5" color="#1a237e" fontWeight={800}>Department Overview</Typography>
    <Typography color="textSecondary" mt={1}>Select specific modules from the sidebar to manage department details.</Typography>
  </Box>
);

const ExamDashboard = () => (
  <Box sx={{ p: 4, bgcolor: 'rgba(255, 255, 255, 0.55)', backdropFilter: 'blur(10px)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.4)' }}>
    <Typography variant="h5" color="#1a237e" fontWeight={800}>Examination Control</Typography>
    <Typography color="textSecondary" mt={1}>Manage results uploads and discrepancies from the left menu.</Typography>
  </Box>
);

const StudentDashboard = () => (
  <Box sx={{ p: 4, bgcolor: 'rgba(255, 255, 255, 0.55)', backdropFilter: 'blur(10px)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.4)' }}>
    <Typography variant="h5" color="#1a237e" fontWeight={800}>Student Portal</Typography>
    <Typography color="textSecondary" mt={1}>Welcome to your academic dashboard.</Typography>
  </Box>
);

const ResearchFeedbackDashboard = () => (
  <Box sx={{ p: 4, bgcolor: 'rgba(255, 255, 255, 0.55)', backdropFilter: 'blur(10px)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.4)' }}>
    <Typography variant="h5" color="#1a237e" fontWeight={800}>Research Feedback Overview</Typography>
    <Typography color="textSecondary" mt={1}>Access feedback reports from the sidebar.</Typography>
  </Box>
);

const FeedbackCoordinatorDashboard = () => (
  <Box sx={{ p: 4, bgcolor: 'rgba(255, 255, 255, 0.55)', backdropFilter: 'blur(10px)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.4)' }}>
    <Typography variant="h5" color="#1a237e" fontWeight={800}>Feedback Coordinator Dashboard</Typography>
    <Typography color="textSecondary" mt={1}>Manage faculty feedback and resolve discrepancies.</Typography>
  </Box>
);
