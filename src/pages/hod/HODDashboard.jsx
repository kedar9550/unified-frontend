import React from 'react';
import { Box, Typography } from "@mui/material";

const HODDashboard = () => (
  <Box sx={{ p: 4, bgcolor: 'rgba(255, 255, 255, 0.55)', backdropFilter: 'blur(10px)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.4)' }}>
    <Typography variant="h5" color="#1a237e" fontWeight={800}>Department Overview</Typography>
    <Typography color="textSecondary" mt={1}>Select specific modules from the sidebar to manage department details.</Typography>
  </Box>
);

export default HODDashboard;
