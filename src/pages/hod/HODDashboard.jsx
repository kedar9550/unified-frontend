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
  const [discrepancies, setDiscrepancies] = useState([]);
  const [counts, setCounts] = useState({ total: 0, pending: 0, resolved: 0 });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const res = await API.get("/api/discrepancies");

        // Get HOD's assigned departments
        const hodRole = user?.roles?.find(r => r.role === 'HOD');
        const assignedDeptIds = hodRole?.departments?.map(d => typeof d === 'object' ? d._id : d) || [];
        if (assignedDeptIds.length === 0 && user?.department) {
          assignedDeptIds.push(typeof user.department === 'object' ? user.department._id : user.department);
        }

        const filtered = (res.data || []).filter(item =>
          item.section === "PROCTORING" &&
          item.proctoringType === "ASSIGNED_COUNT" &&
          assignedDeptIds.includes(item.studentDepartmentId)
        );
        setDiscrepancies(filtered.slice(0, 5)); // Show only top 5

        const pending = filtered.filter(i => i.status === "PENDING").length;
        const resolved = filtered.filter(i => i.status === "RESOLVED").length;
        setCounts({ total: filtered.length, pending, resolved });
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user]);

  const topCards = [
    { title: "Department Faculty", value: "45", subtitle: "Total Active", icon: <People />, color: "#3B82F6", bgColor: "#EFF6FF" },
    { title: "Pending Discrepancies", value: counts.pending, subtitle: "Require Action", icon: <WarningAmber />, color: "#F59E0B", bgColor: "#FEF3C7" },
    { title: "Resolved Issues", value: counts.resolved, subtitle: "This Semester", icon: <Assignment />, color: "#10B981", bgColor: "#ECFDF5" },
    { title: "Total Reports", value: counts.total, subtitle: "Raised Overall", icon: <Flag />, color: "#8B5CF6", bgColor: "#F5F3FF" },
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
          Monitor department performance and resolve faculty discrepancies.
        </Typography>
      </Box>

      {/* Summary Cards Row */}
      <Box sx={{ 
        display: "grid", 
        gridTemplateColumns: { 
          xs: "1fr", 
          sm: "repeat(2, 1fr)", 
          md: "repeat(4, 1fr)" 
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
            transition: 'all 0.3s ease',
            '&:hover': { 
              transform: 'translateY(-4px)', 
              boxShadow: 'var(--shadow-premium)',
              borderColor: 'var(--color-primary)',
              background: 'var(--bg-glass)'
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

      {/* Discrepancies & Actions Section Row */}
      <Box sx={{ 
        display: "grid", 
        gridTemplateColumns: { 
          xs: "1fr", 
          md: "9fr 3fr" 
        }, 
        gap: 3, 
        alignItems: 'stretch' 
      }}>
        <Card sx={{
          borderRadius: "24px",
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-color)',
          p: { xs: 2, sm: 3 },
          display: 'flex',
          flexDirection: 'column'
        }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Recent Discrepancies</Typography>
            <Button
              onClick={() => navigate("/hod/discrepancies")}
              endIcon={<ArrowForward />}
              sx={{ 
                textTransform: "none", 
                fontWeight: 700,
                color: 'var(--color-primary)',
                minWidth: { xs: 'auto', sm: '64px' },
                '& .MuiButton-endIcon': { m: 0 }
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, mr: 1 }}>
                View All
              </Box>
            </Button>
          </Box>

          {discrepancies.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography color="text.secondary">No recent discrepancies found.</Typography>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {discrepancies.map((disc, i) => (
                <Paper
                  key={i}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderColor: disc.status === "PENDING" ? "#FCA5A5" : "#E5E7EB",
                    background: disc.status === "PENDING" ? "#FEF2F2" : "transparent"
                  }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.95rem" }}>{disc.facultyName}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      {disc.section} • {disc.academicYearId?.year} • {disc.semesterTypeId?.name}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, color: "#4B5563" }}>{disc.note}</Typography>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Chip
                      label={disc.status}
                      size="small"
                      color={disc.status === "PENDING" ? "warning" : "success"}
                      sx={{ fontWeight: 700, fontSize: "0.7rem", mb: 1 }}
                    />
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => navigate("/hod/discrepancies")}
                      sx={{ 
                        display: "block", 
                        textTransform: "none", 
                        borderRadius: "10px", 
                        fontSize: "0.75rem",
                        background: 'var(--gradient-primary)',
                        fontWeight: 700,
                        boxShadow: 'var(--shadow-premium)',
                        '&:hover': { background: 'var(--gradient-primary)', opacity: 0.9 }
                      }}
                    >
                      Handle
                    </Button>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </Card>

        <Card sx={{
          borderRadius: "24px",
          boxShadow: "var(--shadow-premium)",
          p: 3,
          background: "var(--gradient-primary)",
          color: "#fff",
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Quick Actions</Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={() => navigate("/hod/discrepancies")}
              sx={{
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
              Resolve Discrepancies
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={() => navigate("/hod/protecrdataupload")}
              sx={{
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
              Upload Proctor Data
            </Button>
          </Box>
        </Card>
      </Box>
    </Box>
  );
};

export default HODDashboard;
