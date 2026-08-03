import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Avatar,
  Chip
} from '@mui/material';
import PageHeader from '../../components/common/PageHeader';
import API from '../../api/axios';
import { toast } from 'sonner';

const CAMPUS_PHOTO_BASES = [
  'https://info.aec.edu.in/aus/employeephotos',
  'https://info.aec.edu.in/aec/employeephotos',
  'https://info.aec.edu.in/acet/employeephotos',
  'https://info.aec.edu.in/acoe/employeephotos',
];

function CoordinatorPhoto({ employeeCode, name, sx }) {
  const initials = (name || '').split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase() || 'FC';
  const placeholderSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><rect width='100%' height='100%' fill='%231e40af'/><text x='50%' y='50%' dy='.35em' text-anchor='middle' font-family='Inter, Arial, Helvetica, sans-serif' font-size='46' fill='%23ffffff'>${initials}</text></svg>`;
  const placeholderDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(placeholderSvg)}`;

  const [attemptIndex, setAttemptIndex] = useState(0);
  const [imgSrc, setImgSrc] = useState(
    employeeCode ? `${CAMPUS_PHOTO_BASES[0]}/${employeeCode}.jpg` : placeholderDataUrl
  );

  useEffect(() => {
    setAttemptIndex(0);
    setImgSrc(employeeCode ? `${CAMPUS_PHOTO_BASES[0]}/${employeeCode}.jpg` : placeholderDataUrl);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeCode]);

  const handleError = () => {
    const nextIndex = attemptIndex + 1;
    if (nextIndex < CAMPUS_PHOTO_BASES.length) {
      setAttemptIndex(nextIndex);
      setImgSrc(`${CAMPUS_PHOTO_BASES[nextIndex]}/${employeeCode}.jpg`);
    } else {
      // All bases exhausted — show initials placeholder
      setImgSrc(placeholderDataUrl);
    }
  };

  return (
    <Box
      component="img"
      src={imgSrc}
      alt={`Photo of ${name || 'Coordinator'}`}
      sx={{ ...sx, objectFit: 'cover' }}
      onError={handleError}
    />
  );
}

const GroupCoordinators = () => {
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState([]);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const response = await API.get('/api/groups');
      setGroups(response.data?.groups || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Failed to load group coordinators');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Extract and deduplicate coordinators
  const coordinators = useMemo(() => {
    const coordsMap = new Map();
    
    groups.forEach(group => {
      if (group.eventCoordinator) {
        const c = group.eventCoordinator;
        const id = c.institutionId || c.employeeId || c.employeeCode;
        if (id) {
          let deptName = c.department || '';
          if (typeof deptName === 'object' && deptName.name) deptName = deptName.name;
          if (typeof deptName === 'string' && /^[0-9a-fA-F]{24}$/.test(deptName)) deptName = '';

          if (!coordsMap.has(id)) {
            coordsMap.set(id, {
              id,
              name: c.employeeName || c.name || 'N/A',
              department: deptName,
              designation: c.designation || 'Coordinator',
              groups: []
            });
          }
          if (!coordsMap.get(id).groups.includes(group.name)) {
            coordsMap.get(id).groups.push(group.name);
          }
        }
      }
    });

    return Array.from(coordsMap.values());
  }, [groups]);

  return (
    <Box sx={{ p: { xs: 2, md: 3, lg: 4 } }}>
      <PageHeader
        title="Group Coordinators"
        subtitle="List of all staff members coordinating VEDA event groups"
      />

      {loading ? (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}>
          <CircularProgress size={32} />
        </Box>
      ) : coordinators.length === 0 ? (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No coordinators found.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {coordinators.map(coord => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={coord.id}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }
              }}>
                <CardContent sx={{ flexGrow: 1, textAlign: 'center', pt: 4 }}>
                  <CoordinatorPhoto
                    employeeCode={coord.id}
                    name={coord.name}
                    sx={{
                      width: 80,
                      height: 80,
                      mx: 'auto',
                      mb: 2,
                      borderRadius: '50%',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      display: 'block'
                    }}
                  />
                  <Typography variant="h6" fontWeight="700" gutterBottom>
                    {coord.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {coord.designation} {coord.department && coord.department !== 'N/A' ? `- ${coord.department}` : ''}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mb: 2, color: 'text.secondary', fontWeight: 600 }}>
                    ID: {coord.id}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center', mt: 2 }}>
                    {coord.groups.map(g => (
                      <Chip 
                        key={g} 
                        label={g} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                        sx={{ borderRadius: '8px', fontWeight: 600 }} 
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default GroupCoordinators;
