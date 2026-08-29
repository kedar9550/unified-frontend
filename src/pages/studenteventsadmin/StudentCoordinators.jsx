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
    <Box sx={{ p: { xs: 2, md: 3, lg: 4 } }}>
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
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {coordinators.map(coord => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={coord.id}>
              <Card sx={{ 
                height: "100%", 
                display: "flex", 
                flexDirection: "column",
                borderRadius: "16px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                transition: "transform 0.2s",
                "&:hover": { transform: "translateY(-4px)", boxShadow: "0 8px 30px rgba(0,0,0,0.1)" }
              }}>
                <CardContent sx={{ flexGrow: 1, textAlign: "center", pt: 4 }}>
                  <CoordinatorPhoto
                    rollNo={coord.id}
                    name={coord.name}
                    sx={{
                      width: 80,
                      height: 80,
                      mx: "auto",
                      mb: 2,
                      borderRadius: "50%",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      display: "block"
                    }}
                  />
                  <Typography variant="h6" fontWeight="700" gutterBottom>
                    {coord.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {coord.designation} {coord.department && coord.department !== "N/A" ? `- ${coord.department}` : ""}
                  </Typography>
                  <Typography variant="caption" sx={{ display: "block", mb: 2, color: "text.secondary", fontWeight: 600 }}>
                    ID: {coord.id}
                  </Typography>
                  
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, justifyContent: "center", mt: 2 }}>
                    {coord.events.map(eName => (
                      <Chip 
                        key={eName} 
                        label={eName} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                        sx={{ borderRadius: "8px", fontWeight: 600 }} 
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

export default StudentCoordinators;
