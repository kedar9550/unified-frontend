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
      {/* <Typography variant="h4" fontWeight={800} color="#1a237e" mb={3} sx={{ textTransform: 'capitalize' }}>
       Welcome back! {activeRole.toLowerCase()} 
      </Typography> */}

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

