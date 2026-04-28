import React from 'react';
import { Card, CardContent, Box, Typography } from "@mui/material";
import { KeyboardArrowRight } from "@mui/icons-material";

const DashboardCard = ({ title, value, icon, color, subtitle, actionText }) => (
  <Card sx={{ 
    borderRadius: '20px', 
    background: 'rgba(255, 255, 255, 0.55)', 
    backdropFilter: 'blur(10px) saturate(150%)', 
    border: '1px solid rgba(255, 255, 255, 0.4)',
    boxShadow: '0 8px 32px rgba(31, 38, 135, 0.05)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    '&:hover': { 
      transform: 'translateY(-5px)',
      boxShadow: `0 12px 40px ${color}20` 
    }
  }}>
    <CardContent sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
      <Box display="flex" alignItems="flex-start" gap={2} mb={2}>
        <Box sx={{ p: 1.5, borderRadius: '12px', background: `${color}15`, color: color }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="subtitle2" color="textSecondary" fontWeight={600} sx={{ lineHeight: 1.2 }}>{title}</Typography>
          <Typography variant="h4" fontWeight={800} color="#1a237e" mt={0.5}>{value}</Typography>
          {subtitle && (
            <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>{subtitle}</Typography>
          )}
        </Box>
      </Box>
      
      {(actionText || title === 'Active Year') && (
        <Box mt="auto" pt={1}>
          {actionText ? (
            <Typography variant="caption" color="primary" fontWeight={600} sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {actionText} <KeyboardArrowRight fontSize="small" />
            </Typography>
          ) : title === 'Active Year' && (
            <Typography variant="caption" color="primary" fontWeight={600} sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.5 }}>
              Manage Years <KeyboardArrowRight fontSize="small" />
            </Typography>
          )}
        </Box>
      )}
    </CardContent>
  </Card>
);

export default DashboardCard;
