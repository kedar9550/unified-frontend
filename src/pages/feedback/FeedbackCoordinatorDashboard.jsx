import React from 'react';
import { Box, Typography } from "@mui/material";

const FeedbackCoordinatorDashboard = () => (
  <Box sx={{ p: 4, bgcolor: 'rgba(255, 255, 255, 0.55)', backdropFilter: 'blur(10px)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.4)' }}>
    <Typography variant="h5" color="#1a237e" fontWeight={800}>Feedback Coordinator Dashboard</Typography>
    <Typography color="textSecondary" mt={1}>Manage faculty feedback and resolve discrepancies.</Typography>
  </Box>
);

export default FeedbackCoordinatorDashboard;
