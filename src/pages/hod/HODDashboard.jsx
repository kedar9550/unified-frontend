import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Button,
  Paper,
  CircularProgress,
  Chip,
} from "@mui/material";
import {
  People,
  Assignment,
  WarningAmber,
  Flag,
  ArrowForward,
} from "@mui/icons-material";
import API from "../../api/axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const HODDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [facultyCount, setFacultyCount] = useState(45); // Static or fetch later

  useEffect(() => {
    // Removed discrepancy fetch as it's disabled for HOD
  }, [user]);

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    const date = d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const time = d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return `${date} • ${time}`;
  };

  const topCards = [
    { title: "Department Faculty", value: facultyCount, subtitle: "Total Active", icon: <People />, color: "#3B82F6", bgColor: "#EFF6FF" },
    { title: "Academic Programs", value: "8", subtitle: "Active Branches", icon: <Assignment />, color: "#10B981", bgColor: "#ECFDF5" },
    { title: "Department Students", value: "840", subtitle: "Total Enrolled", icon: <Flag />, color: "#8B5CF6", bgColor: "#F5F3FF" },
  ];

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 0 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: "var(--text-primary)", mb: 0.5 }}>
          HOD Dashboard 👋
        </Typography>
        <Typography variant="body1" sx={{ color: "var(--text-secondary)", opacity: 0.8 }}>
          Monitor department performance and manage faculty data.
        </Typography>
      </Box>

      {/* Summary Cards Row */}
      <Box sx={{ 
        display: "grid", 
        gridTemplateColumns: { 
          xs: "1fr", 
          sm: "repeat(2, 1fr)", 
          md: "repeat(3, 1fr)" 
        }, 
        gap: 2.5, 
        mb: 4 
      }}>
        {topCards.map((card, i) => (
          <Card key={i} sx={{
            borderRadius: "24px",
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-color)',
            p: { xs: 2, sm: 2.5 },
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 2,
            position: "relative",
            overflow: "hidden",
            transition: 'all 0.3s ease',
            '&:hover': { 
              transform: 'translateY(-4px)', 
              boxShadow: 'var(--shadow-premium)',
              borderColor: 'var(--color-primary)',
              background: 'var(--bg-glass)',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              right: 0,
              width: '120px',
              height: '120px',
              background: `radial-gradient(circle at top right, ${card.color}25, transparent 70%)`,
              zIndex: 0
            }
          }}>
            <Box sx={{
              width: { xs: 44, sm: 56 },
              height: { xs: 44, sm: 56 },
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: card.bgColor,
              color: card.color,
              flexShrink: 0
            }}>
              {card.icon}
            </Box>
            <Box sx={{ textAlign: "left" }}>
              <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 700, fontSize: { xs: 10, sm: 12 }, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {card.title}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: "var(--text-primary)", my: 0.1, fontSize: { xs: '1.2rem', sm: '1.8rem' } }}>
                {card.value}
              </Typography>
              <Typography variant="caption" sx={{ color: "var(--text-secondary)", opacity: 0.8, fontSize: { xs: 9, sm: 11 } }}>
                {card.subtitle}
              </Typography>
            </Box>
          </Card>
        ))}
      </Box>

      {/* Actions Section Row */}
      <Box sx={{ mt: 2 }}>
        <Card sx={{
          borderRadius: "24px",
          boxShadow: "var(--shadow-premium)",
          p: 3,
          background: "var(--gradient-primary)",
          color: "#fff",
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          minHeight: 180
        }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Department Actions</Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            <Button
              variant="contained"
              onClick={() => navigate("/hod/protecrdataupload")}
              sx={{
                flex: 1,
                minWidth: "200px",
                background: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(12px)",
                textTransform: "none",
                py: 1.8,
                borderRadius: "14px",
                fontWeight: 700,
                border: '1px solid rgba(255,255,255,0.2)',
                "&:hover": { 
                  background: "rgba(255,255,255,0.25)",
                  transform: 'scale(1.02)'
                }
              }}
            >
              Manage Proctor Data
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate("/hod/research-approvals")}
              sx={{
                flex: 1,
                minWidth: "200px",
                background: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(12px)",
                textTransform: "none",
                py: 1.8,
                borderRadius: "14px",
                fontWeight: 700,
                border: '1px solid rgba(255,255,255,0.2)',
                "&:hover": { 
                  background: "rgba(255,255,255,0.25)",
                  transform: 'scale(1.02)'
                }
              }}
            >
              Research Approvals
            </Button>
          </Box>
        </Card>
      </Box>
    </Box>
  );
};

export default HODDashboard;
