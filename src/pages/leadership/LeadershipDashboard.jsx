import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, Stack, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Button, Chip, Tabs, Tab, Paper
} from "@mui/material";
import {
  DescriptionOutlined, CheckCircleOutlined, CancelOutlined, FolderOutlined,
  ArrowForward, VisibilityOutlined, Check, Close, AssignmentTurnedIn, InsertDriveFileOutlined, AssuredWorkloadOutlined, DownloadOutlined
} from "@mui/icons-material";
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const LeadershipDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await API.get('/api/dashboard/leadership');
        if (res.data?.status === 'success') {
          setData(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching Leadership dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user]);

  const dashboard = data || {
    role: "Leadership",
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    totalHandled: 0,
    recentSubmissions: []
  };

  const topCards = [
    { 
      title: "Pending Approvals", 
      value: dashboard.pendingCount, 
      icon: <DescriptionOutlined />, 
      gradient: "linear-gradient(135deg, #3B82F6, #1D4ED8)",
      color: "#3B82F6", 
      linkText: "Review Pending",
      path: "/appraisal/management-evaluate"
    },
    { 
      title: "Approved", 
      value: dashboard.approvedCount, 
      icon: <CheckCircleOutlined />, 
      gradient: "linear-gradient(135deg, #10B981, #059669)",
      color: "#10B981", 
      linkText: "View Approved",
      path: "/appraisal-reports"
    },
    { 
      title: "Rejected", 
      value: dashboard.rejectedCount, 
      icon: <CancelOutlined />, 
      gradient: "linear-gradient(135deg, #EF4444, #DC2626)",
      color: "#EF4444", 
      linkText: "View Rejected",
      path: "/appraisal-reports"
    },
    { 
      title: "Total Appraisals", 
      value: dashboard.totalHandled, 
      icon: <FolderOutlined />, 
      gradient: "linear-gradient(135deg, #F59E0B, #D97706)",
      color: "#F59E0B", 
      linkText: "All Reports",
      path: "/appraisal-reports"
    }
  ];

  const pieData = [
    { name: 'Pending', value: dashboard.pendingCount, color: '#3B82F6' },
    { name: 'Approved', value: dashboard.approvedCount, color: '#10B981' },
    { name: 'Rejected', value: dashboard.rejectedCount, color: '#EF4444' },
    { name: 'Not Submitted', value: 0, color: '#9CA3AF' }
  ];

  const renderStatusChip = (status) => {
    let bg = '#F3F4F6';
    let textColor = '#4B5563';
    let displayStatus = status;

    if (/Approved/i.test(status)) {
      bg = '#ECFDF5'; textColor = '#10B981';
      displayStatus = 'Approved';
    } else if (/Pending/i.test(status) || /Submitted/i.test(status)) {
      bg = '#FFFBEB'; textColor = '#F59E0B';
      displayStatus = 'Pending';
    } else if (/Rejected/i.test(status)) {
      bg = '#FEF2F2'; textColor = '#EF4444';
      displayStatus = 'Rejected';
    }

    return (
      <Chip 
        label={displayStatus} 
        size="small" 
        sx={{ 
          bgcolor: bg, 
          color: textColor, 
          fontWeight: 600, 
          borderRadius: '6px',
          px: 1
        }} 
      />
    );
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: '100%', overflowX: 'hidden' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} color="var(--text-primary)" gutterBottom>
          Leadership Dashboard
        </Typography>
        <Typography variant="body1" color="var(--text-secondary)" fontWeight={500}>
         Overview of appraisal verification and team performance.
        </Typography>
      </Box>

      {/* Metric Cards */}
      <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap', width: '100%' }}>
        {topCards.map((card, idx) => (
          <Box key={idx} sx={{ flex: 1, minWidth: "220px", display: "flex" }}>
            <Card
              sx={{
                width: "100%",
                borderRadius: "16px",
                boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.03)",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                p: 2.5,
                border: "1px solid var(--border-color)",
                background: "var(--bg-panel)",
                overflow: "hidden",
                "&::after": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: "120px",
                  height: "120px",
                  background: `radial-gradient(circle at top right, ${card.color}25, transparent 70%)`,
                  zIndex: 0
                }
              }}
            >
              {/* Top Content: Left Aligned */}
              <Box sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 2,
                textAlign: "left",
                position: "relative",
                zIndex: 1
              }}>
                {/* Icon */}
                <Box
                  sx={{
                    width: 50,
                    height: 50,
                    borderRadius: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: card.gradient,
                    color: "#fff",
                    flexShrink: 0,
                    mt: 0.5,
                    boxShadow: `0 8px 25px ${card.color}35`,
                  }}>
                  {React.cloneElement(card.icon, { fontSize: "medium" })}
                </Box>

                {/* Text */}
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                  <Typography
                    variant="body2"
                    sx={{ color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.8rem", textTransform: "capitalize", letterSpacing: "0.5px" }}
                  >
                    {card.title}
                  </Typography>

                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 0.5 }}>
                    <Typography
                      sx={{
                        fontWeight: 800,
                        color: "var(--text-primary)",
                        mt: 0.5,
                        fontSize: card.value.toString().length > 6 ? "1.2rem" : "1.6rem",
                        lineHeight: 1
                      }}
                    >
                      {card.value}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Bottom Link: Right Aligned */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', position: "relative", zIndex: 1, mt: 2 }}>
                <Button
                  size="small"
                  endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
                  onClick={() => navigate(card.path)}
                  sx={{
                    textTransform: "none",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: "var(--color-primary)",
                    p: 0,
                    "&:hover": { background: "transparent", opacity: 0.8 },
                  }}
                >
                  {card.linkText}
                </Button>
              </Box>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Middle Section */}
      <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: { xs: "wrap", xl: "nowrap" }, width: "100%" }}>
        {/* Appraisal Status Overview */}
        <Box sx={{ width: { xs: "100%", xl: "50%" }, display: "flex" }}>
          <Card sx={{ 
            p: 3, 
            borderRadius: "16px", 
            border: '1px solid var(--border-color)', 
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.03)",
            height: '100%',
            width: '100%',
            display: "flex",
            flexDirection: "column",
          }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: "1.2rem",
                  color: "var(--text-primary)",
                }}
              >
                Appraisal Status Overview
              </Typography>
              <Button
                size="small"
                endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                sx={{
                  textTransform: "none",
                  fontSize: "0.8rem",
                  color: "var(--color-primary)",
                  fontWeight: 600,
                }}
                onClick={() => navigate("/appraisal-reports")}
              >
                View All Reports
              </Button>
            </Box>
            
            <Box
              sx={{
                display: "flex",
                gap: 3,
                alignItems: "flex-start",
                height: "100%",
                flexWrap: { xs: "wrap", sm: "nowrap" },
              }}
            >
              {/* Chart */}
              <Box
                sx={{
                  width: { xs: "100%", sm: "50%" },
                  display: "flex",
                  flexDirection: "column",
                  alignItems: { xs: "center", sm: "flex-start" },
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    alignSelf: "flex-start",
                    mb: 2,
                    fontWeight: 700,
                    color: "var(--text-secondary)",
                    textTransform: "uppercase",
                    fontSize: "0.7rem",
                    letterSpacing: "0.05em",
                  }}
                >
                  Appraisals by Status
                </Typography>
                
                <Box sx={{ position: "relative", width: 160, height: 160, minWidth: 0, margin: { xs: '0 auto', sm: '0' } }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Center Text (Total count) */}
                  <Box
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      textAlign: "center",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 28,
                        fontWeight: 800,
                        color: "var(--text-primary)",
                        lineHeight: 1,
                      }}
                    >
                      {dashboard.totalHandled}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: "var(--text-secondary)",
                        textTransform: "uppercase",
                        mt: 0.5,
                      }}
                    >
                      Appraisals
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Status Summary */}
              <Box sx={{ width: { xs: "100%", sm: "50%" } }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    mb: 2,
                    fontWeight: 700,
                    color: "var(--text-secondary)",
                    textTransform: "uppercase",
                    fontSize: "0.7rem",
                    letterSpacing: "0.05em",
                  }}
                >
                  Verification Status
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {[
                    { label: "Total Submissions", value: dashboard.totalHandled, icon: <DescriptionOutlined sx={{ fontSize: 18, color: "var(--color-primary)" }} />, bgColor: "rgba(59, 130, 246, 0.1)" },
                    { label: "Approved Items", value: dashboard.approvedCount, icon: <CheckCircleOutlined sx={{ fontSize: 18, color: "#10B981" }} />, bgColor: "rgba(16, 185, 129, 0.1)" },
                    { label: "Pending Verification", value: dashboard.pendingCount, icon: <AssignmentTurnedIn sx={{ fontSize: 18, color: "#F59E0B" }} />, bgColor: "rgba(245, 158, 11, 0.1)" },
                    { label: "Rejected / Returned", value: dashboard.rejectedCount, icon: <CancelOutlined sx={{ fontSize: 18, color: "#EF4444" }} />, bgColor: "rgba(239, 68, 68, 0.1)" },
                  ].map((stat, i) => (
                    <Box
                      key={i}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        p: 1.5,
                        px: 2,
                        borderRadius: "12px",
                        border: "1px solid var(--border-color)",
                        background: "var(--bg-glass)",
                        transition: "all 0.2s ease-in-out",
                        "&:hover": {
                          borderColor: "var(--color-primary-alpha)",
                          background: "var(--bg-accent-1)",
                          transform: "translateX(4px)",
                        }
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            width: 32,
                            height: 32,
                            borderRadius: "8px",
                            backgroundColor: stat.bgColor,
                          }}
                        >
                          {stat.icon}
                        </Box>
                        <Typography sx={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>
                          {stat.label}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>
                        {stat.value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </Card>
        </Box>
        
        {/* Quick Actions */}
        <Box sx={{ width: { xs: "100%", xl: "50%" }, display: "flex" }}>
          <Card sx={{ 
            position: "relative",
            p: 3, 
            borderRadius: "16px", 
            border: '1px solid var(--border-color)', 
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.03)",
            height: '100%',
            width: '100%',
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            "&::after": {
              content: '""',
              position: "absolute",
              top: 0,
              right: 0,
              width: "160px",
              height: "160px",
              background: "radial-gradient(circle at top right, var(--color-primary-alpha), transparent 70%)",
              zIndex: 0
            }
          }}>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: "1.2rem",
                mb: 3,
                color: "var(--text-primary)",
              }}
            >
              Quick Actions
            </Typography>
            
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 2,
                width: "100%",
                position: "relative",
                zIndex: 1,
              }}
            >
              {[
                { title: "Review Pending", desc: "Approve or reject", icon: <AssignmentTurnedIn sx={{ color: "#3B82F6" }} />, path: "/appraisal/management-evaluate" },
                { title: "View All Reports", desc: "Detailed reports", icon: <InsertDriveFileOutlined sx={{ color: "#10B981" }} />, path: "/appraisal-reports" },
                { title: "Department Summary", desc: "Performance overview", icon: <AssuredWorkloadOutlined sx={{ color: "#8B5CF6" }} />, path: "/appraisal-reports" },
                { title: "Download Reports", desc: "Export data", icon: <DownloadOutlined sx={{ color: "#F59E0B" }} />, path: "/appraisal-reports" },
              ].map((action, i) => (
                <Box
                  key={i}
                  sx={{
                    flex: { xs: "1 1 100%", sm: "1 1 calc(50% - 8px)" },
                    minWidth: 0,
                  }}
                >
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      cursor: "pointer",
                      height: "100%",
                      borderColor: "var(--border-color)",
                      backgroundColor: "var(--bg-glass)",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        borderColor: "var(--color-primary)",
                        backgroundColor: "var(--bg-accent-1)",
                        transform: "translateY(-4px)",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                      },
                    }}
                    onClick={() => navigate(action.path)}
                  >
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "var(--bg-accent-1)",
                        flexShrink: 0,
                      }}
                    >
                      {action.icon}
                    </Box>
                    <Box>
                      <Typography
                        sx={{
                          fontWeight: 700,
                          fontSize: "0.95rem",
                          color: "var(--text-primary)",
                        }}
                      >
                        {action.title}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "0.8rem",
                          color: "var(--text-secondary)",
                          fontWeight: 500,
                        }}
                      >
                        {action.desc}
                      </Typography>
                    </Box>
                  </Paper>
                </Box>
              ))}
            </Box>
          </Card>
        </Box>
      </Box>

      {/* Recent Appraisal Submissions */}
      <Card sx={{ borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.03)" }}>
        <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight={700} color="var(--text-primary)">Recent Appraisal Submissions</Typography>
          <Button 
            size="small"
            onClick={() => navigate('/appraisal/management-evaluate')}
            sx={{
              textTransform: "none",
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "#3b82f6",
              bgcolor: "rgba(59, 130, 246, 0.06)",
              px: 2,
              py: 0.5,
              borderRadius: "20px",
              "&:hover": { bgcolor: "rgba(59, 130, 246, 0.12)" }
            }}
          >
            View All
          </Button>
        </Box>
        
        <Divider />
        
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: 'var(--bg-panel)' }}>
              <TableRow>
                <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.8125rem', py: 1.5 }}>#</TableCell>
                <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.8125rem', py: 1.5 }}>Faculty Name</TableCell>
                <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.8125rem', py: 1.5 }}>Department</TableCell>
                <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.8125rem', py: 1.5 }}>Role</TableCell>
                <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.8125rem', py: 1.5 }}>Submitted On</TableCell>
                <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.8125rem', py: 1.5 }}>Status</TableCell>
                <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.8125rem', py: 1.5 }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dashboard.recentSubmissions.length > 0 ? (
                dashboard.recentSubmissions.map((row, idx) => (
                  <TableRow key={row._id} sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: 'var(--bg-panel)' } }}>
                    <TableCell sx={{ color: 'var(--text-secondary)', fontSize: '0.875rem', py: 1.5 }}>{idx + 1}</TableCell>
                    <TableCell sx={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.875rem', py: 1.5 }}>{row.facultyName}</TableCell>
                    <TableCell sx={{ color: 'var(--text-secondary)', fontSize: '0.875rem', py: 1.5 }}>{row.department}</TableCell>
                    <TableCell sx={{ color: 'var(--text-secondary)', fontSize: '0.875rem', py: 1.5 }}>{row.designation}</TableCell>
                    <TableCell sx={{ color: 'var(--text-secondary)', fontSize: '0.875rem', py: 1.5 }}>
                      {new Date(row.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      {renderStatusChip(row.status)}
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <IconButton 
                        size="small" 
                        onClick={() => navigate(`/appraisal/details/${row._id}`)}
                        sx={{ color: '#3B82F6', '&:hover': { bgcolor: '#EFF6FF' } }}
                      >
                        <VisibilityOutlined sx={{ fontSize: 18 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'var(--text-secondary)' }}>
                    No recent submissions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default LeadershipDashboard;
