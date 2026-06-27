import React from 'react';
import { Box, Typography } from "@mui/material";

const ResearchFeedbackDashboard = () => (
  <Box sx={{ 
    p: 4, 
    bgcolor: 'var(--bg-glass)', 
    backdropFilter: 'blur(10px)', 
    borderRadius: '20px', 
    border: '1px solid var(--border-color)',
    position: "relative",
    overflow: "hidden",
    "&::after": {
      content: '""',
      position: "absolute",
      top: 0,
      right: 0,
      width: "120px",
      height: "120px",
      background: "radial-gradient(circle at top right, var(--color-primary-alpha), transparent 70%)",
      zIndex: 0
    }
  }}>
    <Box sx={{ position: "relative", zIndex: 1 }}>
      <Typography variant="h5" color="var(--text-primary)" fontWeight={800}>Research Feedback Overview</Typography>
      <Typography color="textSecondary" mt={1}>Access feedback reports from the sidebar.</Typography>
    </Box>
  </Box>
);

export default ResearchFeedbackDashboard;
