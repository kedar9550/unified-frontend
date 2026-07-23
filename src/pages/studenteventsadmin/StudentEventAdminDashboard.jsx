import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Typography,
} from '@mui/material';
import {
  Groups as GroupsIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  CheckCircle as CheckCircleIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import API from '../../api/axios';
import { toast } from 'sonner';

const StatCard = ({ title, value, subtitle, icon, accent, bgColor }) => (
  <Card
    sx={{
      height: '100%',
      borderRadius: '20px',
      border: '1px solid rgba(15, 118, 110, 0.12)',
      boxShadow: '0 12px 28px rgba(15, 23, 42, 0.06)',
      background: 'linear-gradient(180deg, rgba(255,255,255,0.99), rgba(248,250,252,0.96))',
      overflow: 'hidden',
    }}
  >
    <CardContent sx={{ p: 2.15 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: '0.10em', color: accent, fontWeight: 800 }}>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={900} sx={{ mt: 0.9, color: '#0f172a', lineHeight: 1.06 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, lineHeight: 1.45 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            width: 46,
            height: 46,
            borderRadius: '14px',
            display: 'grid',
            placeItems: 'center',
            bgcolor: bgColor,
            color: accent,
            flexShrink: 0,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)',
          }}
        >
          {React.createElement(icon, { fontSize: 'medium' })}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const StudentEventAdminDashboard = () => {
  const [clubs, setClubs] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [clubsResponse, assignmentsResponse] = await Promise.all([
        API.get('/api/clubs'),
        API.get('/api/event-assignments'),
      ]);

      setClubs(clubsResponse.data?.clubs || []);
      setAssignments(assignmentsResponse.data?.assignments || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const metrics = useMemo(() => {
    const activeClubs = clubs.filter((club) => club.status === 'Active').length;
    const totalAssignments = assignments.length;
    const activeAssignments = assignments.filter((assignment) => Array.isArray(assignment.assignees) && assignment.assignees.length > 0).length;
    const festAssignments = assignments.filter((assignment) => assignment.assignmentType === 'Fest').length;
    const clubAssignments = assignments.filter((assignment) => assignment.assignmentType === 'Club').length;
    const otherEventAssignments = assignments.filter((assignment) => assignment.assignmentType === 'Other Event').length;

    return {
      totalClubs: clubs.length,
      activeClubs,
      totalAssignments,
      activeAssignments,
      festAssignments,
      clubAssignments,
      otherEventAssignments,
    };
  }, [clubs, assignments]);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <PageHeader title="Student Event Admin Dashboard" subtitle="Loading club and event statistics" />
        <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
          <CircularProgress size={30} />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, md: 3, lg: 4 } }}>
      <PageHeader
        title="Student Event Admin Dashboard"
        subtitle="Overview of club management and event assignment statistics"
      />

      <Box
        sx={{
          mt: 3,
          p: { xs: 1.8, sm: 2.3 },
          borderRadius: '20px',
          border: '1px solid rgba(15, 118, 110, 0.12)',
          background: 'linear-gradient(135deg, rgba(15, 118, 110, 0.07), rgba(37, 99, 235, 0.05))',
          boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.4, flexWrap: 'wrap' }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              px: 1.1,
              py: 0.35,
              borderRadius: '999px',
              bgcolor: 'rgba(15, 118, 110, 0.12)',
              color: '#0f766e',
              fontSize: '0.68rem',
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            Overview
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 2.25 }}>
          <StatCard
            title="Club Management"
            value={metrics.totalClubs}
            subtitle={`${metrics.activeClubs} active clubs`}
            icon={GroupsIcon}
            accent="#2563eb"
            bgColor="rgba(37, 99, 235, 0.12)"
          />

          <StatCard
            title="Event Management"
            value={metrics.totalAssignments}
            subtitle={`${metrics.activeAssignments} assigned with employees`}
            icon={AssignmentTurnedInIcon}
            accent="#0f766e"
            bgColor="rgba(15, 118, 110, 0.13)"
          />
        </Box>
      </Box>

      <Box sx={{ mt: 3, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 2.25 }}>
        <Card sx={{ borderRadius: '18px', border: '1px solid rgba(37, 99, 235, 0.14)', boxShadow: '0 8px 20px rgba(15, 23, 42, 0.05)', background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(239,246,255,0.92))' }}>
          <CardContent sx={{ p: 2.1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25 }}>
              <GroupsIcon sx={{ color: '#2563eb' }} />
              <Typography variant="subtitle1" fontWeight={800}>Club Summary</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">Total clubs</Typography>
            <Typography variant="h5" fontWeight={800} sx={{ mt: 0.45 }}>{metrics.totalClubs}</Typography>
            <Chip label={`${metrics.activeClubs} active`} color="primary" variant="outlined" sx={{ mt: 1.6, fontWeight: 700 }} />
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: '18px', border: '1px solid rgba(15, 118, 110, 0.14)', boxShadow: '0 8px 20px rgba(15, 23, 42, 0.05)', background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(236,253,245,0.92))' }}>
          <CardContent sx={{ p: 2.1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25 }}>
              <EventIcon sx={{ color: '#0f766e' }} />
              <Typography variant="subtitle1" fontWeight={800}>Assignment Breakdown</Typography>
            </Box>
            <Box sx={{ display: 'grid', gap: 0.7 }}>
              <Typography variant="body2" color="text.secondary">Fest: <strong>{metrics.festAssignments}</strong></Typography>
              <Typography variant="body2" color="text.secondary">Club: <strong>{metrics.clubAssignments}</strong></Typography>
              <Typography variant="body2" color="text.secondary">Other Event: <strong>{metrics.otherEventAssignments}</strong></Typography>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: '18px', border: '1px solid rgba(16, 185, 129, 0.18)', boxShadow: '0 8px 20px rgba(15, 23, 42, 0.05)', background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(240,253,250,0.96))' }}>
          <CardContent sx={{ p: 2.1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25 }}>
              <CheckCircleIcon sx={{ color: '#10b981' }} />
              <Typography variant="subtitle1" fontWeight={800}>Active Coverage</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">Active clubs</Typography>
            <Typography variant="h5" fontWeight={800} sx={{ mt: 0.45 }}>{metrics.activeClubs}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>Assignments with coordinators</Typography>
            <Typography variant="h5" fontWeight={800} sx={{ mt: 0.45 }}>{metrics.activeAssignments}</Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default StudentEventAdminDashboard;
