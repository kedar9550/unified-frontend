import React, { useEffect, useState } from "react";
import API from "../../../api/axios";
import { toast } from "sonner";
import {
  Box, Typography, Paper, Chip, Grid
} from "@mui/material";
import { CheckCircle, CalendarToday } from "@mui/icons-material";
import PageHeader from "../../../components/common/PageHeader";

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const AcademicManagement = () => {
  const [years, setYears] = useState([]);

  const fetchYears = async () => {
    try {
      const res = await API.get("/api/academic-years");
      setYears(res.data.years || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch academic years");
      console.error(err);
    }
  };

  useEffect(() => {
    fetchYears();
  }, []);

  return (
    <Box>
      <PageHeader title="Academic Years" subtitle="View all academic years managed automatically by the system" />

      <Box sx={{ mt: 3 }}>
        {years.length === 0 ? (
          <Typography sx={{ textAlign: "center", color: "var(--text-secondary)", mt: 6 }}>
            No academic years found.
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {years.map((yearDoc) => (
              <Grid item xs={12} md={6} lg={4} key={yearDoc._id}>
                <Paper sx={{
                  p: 3, borderRadius: 2, background: "var(--bg-panel)", border: "1px solid var(--border-color)",
                  position: "relative", overflow: "hidden",
                  "&::after": {
                    content: '""', position: "absolute", top: 0, right: 0, width: "100px", height: "100px",
                    background: yearDoc.active ? "radial-gradient(circle at top right, rgba(16,185,129,0.2), transparent 70%)" : "radial-gradient(circle at top right, var(--color-primary-alpha), transparent 70%)",
                    zIndex: 0, pointerEvents: "none"
                  },
                  borderLeft: yearDoc.active ? "4px solid #10b981" : "4px solid var(--border-color)"
                }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <CalendarToday sx={{ color: yearDoc.active ? "#10b981" : "var(--color-primary)" }} />
                      <Typography variant="h6" sx={{ fontWeight: 700, color: "var(--text-primary)" }}>
                        {yearDoc.year}
                      </Typography>
                    </Box>
                    {yearDoc.active && (
                      <Chip size="small" icon={<CheckCircle />} label="Active" color="success" sx={{ fontWeight: 700 }} />
                    )}
                  </Box>
                  
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: "var(--text-secondary)" }}>Start Date</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--text-primary)" }}>
                        {formatDate(yearDoc.startDate)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: "var(--text-secondary)" }}>End Date</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--text-primary)" }}>
                        {formatDate(yearDoc.endDate)}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default AcademicManagement;
