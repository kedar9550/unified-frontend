import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Chip
} from "@mui/material";
import PageHeader from "../../components/common/PageHeader";
import { PageContainer } from "../../components/common/design-system";
import ProfileCard from "../../components/common/ProfileCard";
import API from "../../api/axios";
import { toast } from "sonner";

function CoordinatorPhoto({ rollNo, name, sx }) {
  const initials = (name || "").split(" ").filter(Boolean).slice(0, 2).map(n => n[0]).join("").toUpperCase() || "SC";
  const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="100%" height="100%" fill="%231e40af"/><text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="Inter, Arial, Helvetica, sans-serif" font-size="46" fill="%23ffffff">${initials}</text></svg>`;
  const placeholderDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(placeholderSvg)}`;
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:9000";

  return (
    <Box
      component="img"
      src={rollNo ? `${backendUrl}/api/proxy/student-photo/${rollNo}` : placeholderDataUrl}
      alt={`Photo of ${name || "Coordinator"}`}
      sx={{ ...sx, objectFit: "cover" }}
      onError={(e) => { e.target.onerror = null; e.target.src = placeholderDataUrl; }}
    />
  );
}

const StudentCoordinators = () => {
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await API.get("/api/events");
      setEvents(response.data?.events || []);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to load student coordinators");
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
      const coordsList = Array.isArray(event.studentCoordinators) ? event.studentCoordinators : [];

      coordsList.forEach(c => {
        const id = c.rollNo;
        if (id) {
          if (!coordsMap.has(id)) {
            coordsMap.set(id, {
              id,
              name: c.name || "N/A",
              department: c.department || "",
              designation: c.branch || "Student",
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
        title="Student Coordinators"
        subtitle="List of all student members coordinating VEDA events"
      />

      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", py: 10 }}>
          <CircularProgress size={32} />
        </Box>
      ) : coordinators.length === 0 ? (
        <Box sx={{ mt: 4, textAlign: "center" }}>
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
              avatarComponent={
                <CoordinatorPhoto
                  rollNo={coord.id}
                  name={coord.name}
                  sx={{ width: 110, height: 110, border: '2px solid #fff', borderRadius: '50%' }}
                />
              }
              labels={coord.events}
            />
          ))}
        </Box>
      )}
    </PageContainer>
  );
};

export default StudentCoordinators;
