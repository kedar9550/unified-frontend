import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Chip
} from '@mui/material';
import PageHeader from '../../components/common/PageHeader';
import { PageContainer } from '../../components/common/design-system';
import ProfileCard from '../../components/common/ProfileCard';
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

const EventCoordinators = () => {
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await API.get('/api/events');
      setEvents(response.data?.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load event coordinators');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Extract and deduplicate coordinators
  const coordinators = useMemo(() => {
    const coordsMap = new Map();

    events.forEach(event => {
      const coordsList = Array.isArray(event.facultyCoordinators) && event.facultyCoordinators.length > 0
        ? event.facultyCoordinators
        : (event.facultyCoordinator ? [event.facultyCoordinator] : []);

      coordsList.forEach(c => {
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
              phone: c.phone || c.mobile || 'N/A',
              events: []
            });
          }
          if (!coordsMap.get(id).events.includes(event.eventName)) {
            coordsMap.get(id).events.push(event.eventName);
          }
        }
      });
    });

    return Array.from(coordsMap.values());
  }, [events]);

  return (
    <PageContainer>
      <PageHeader
        title="Faculty Coordinators"
        subtitle="List of all staff members coordinating VEDA events"
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
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mt: 2 }}>
          {coordinators.map(coord => (
              <ProfileCard
                key={coord.id}
                name={coord.name}
                role={`${coord.designation} ${coord.department && coord.department !== 'N/A' ? `- ${coord.department}` : ''}`}
                employeeId={coord.id}
                phone={coord.phone}
                labels={coord.events}
                avatarComponent={
                  <CoordinatorPhoto
                    employeeCode={coord.id}
                    name={coord.name}
                    sx={{ width: 110, height: 110, border: '2px solid #fff', borderRadius: '50%' }}
                  />
                }
              />
          ))}
        </Box>
      )}
    </PageContainer>
  );
};

export default EventCoordinators;
