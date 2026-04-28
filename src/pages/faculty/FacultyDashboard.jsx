import React from 'react';
import { Grid, Card, Typography, Box } from "@mui/material";
import { School, People, Assessment } from "@mui/icons-material";
import DashboardCard from "../../components/DashboardCard";

const FacultyDashboard = () => (
  <Grid container spacing={3}>
    <Grid item xs={12} sm={6} md={4}>
      <DashboardCard title="Active Classes" value="4" icon={<School fontSize="large" />} color="#1976d2" />
    </Grid>
    <Grid item xs={12} sm={6} md={4}>
      <DashboardCard title="Total Students" value="180" icon={<People fontSize="large" />} color="#2e7d32" />
    </Grid>
    <Grid item xs={12} sm={6} md={4}>
      <DashboardCard title="Pending Assignments" value="12" icon={<Assessment fontSize="large" />} color="#ed6c02" />
    </Grid>
    
    <Grid item xs={12} md={8}>
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
    </Grid>
  </Grid>
);

export default FacultyDashboard;
