import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
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
  }, []);

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
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: "#1a237e", mb: 0.5 }}>
          HOD Dashboard 👋
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Monitor department performance and resolve faculty discrepancies.
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {topCards.map((card, i) => (
          <Grid item key={i} xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", p: 2.5, display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ width: 56, height: 56, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: card.bgColor, color: card.color }}>
                {card.icon}
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "#6B7280", fontWeight: 600 }}>{card.title}</Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: "#111827", my: 0.2 }}>{card.value}</Typography>
                <Typography variant="caption" sx={{ color: "#9CA3AF" }}>{card.subtitle}</Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Discrepancies Section */}
      <Box sx={{ display: "flex", gap: 3, flexWrap: { xs: "wrap", lg: "nowrap" } }}>
        <Card sx={{ borderRadius: "20px", boxShadow: "0 4px 25px rgba(0,0,0,0.05)", p: 3, flexGrow: 1, width: "100%" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#111827" }}>Recent Discrepancies</Typography>
            <Button 
              onClick={() => navigate("/hod/discrepancies")}
              endIcon={<ArrowForward />} 
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              View All
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
                      sx={{ display: "block", textTransform: "none", borderRadius: "8px", fontSize: "0.75rem" }}
                    >
                      Handle
                    </Button>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </Card>

        {/* Quick Actions Card */}
        <Card sx={{ borderRadius: "20px", boxShadow: "0 4px 25px rgba(0,0,0,0.05)", p: 3, minWidth: { lg: 350 }, background: "linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)", color: "#fff" }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Quick Actions</Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Button 
              fullWidth 
              variant="contained" 
              onClick={() => navigate("/hod/discrepancies")}
              sx={{ bgcolor: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", textTransform: "none", py: 1.5, borderRadius: "12px", "&:hover": { bgcolor: "rgba(255,255,255,0.2)" } }}
            >
              Resolve Discrepancies
            </Button>
            <Button 
              fullWidth 
              variant="contained" 
              onClick={() => navigate("/hod/protecrdataupload")}
              sx={{ bgcolor: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", textTransform: "none", py: 1.5, borderRadius: "12px", "&:hover": { bgcolor: "rgba(255,255,255,0.2)" } }}
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
