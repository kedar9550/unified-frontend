import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Block, ArrowBack } from '@mui/icons-material';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        textAlign: 'center',
        p: 3,
        animation: 'fadeIn 0.5s ease',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 6,
          borderRadius: 4,
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-color)',
          maxWidth: 500,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: 'var(--shadow-premium)',
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3,
          }}
        >
          <Block sx={{ fontSize: 40, color: '#EF4444' }} />
        </Box>
        
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'var(--text-primary)', mb: 1 }}>
          Page Unavailable
        </Typography>
        
        <Typography variant="body1" sx={{ color: 'var(--text-secondary)', mb: 4, lineHeight: 1.6 }}>
          The page you are looking for is currently under maintenance, restricted, or does not exist.
        </Typography>

        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/dashboard')}
          sx={{
            background: 'var(--gradient-primary)',
            color: 'white',
            fontWeight: 700,
            textTransform: 'none',
            px: 4,
            py: 1.2,
            borderRadius: 2,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
            }
          }}
        >
          Return to Dashboard
        </Button>
      </Paper>
    </Box>
  );
};

export default NotFound;
