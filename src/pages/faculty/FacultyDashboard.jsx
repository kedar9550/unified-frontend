import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  MenuItem,
  Select,
  Tooltip as MuiTooltip,
  Skeleton,
  LinearProgress
} from "@mui/material";
import {
  MenuBook,
  Group,
  Description,
  AssignmentTurnedIn,
  Event,
  ArrowForward,
  CloudUpload,
  Feedback,
  PersonOff,
  CalendarMonth,
  Visibility,
  Science,
} from "@mui/icons-material";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import DataTable from "../../components/data/DataTable";
import ProctorStudentsModal from "../../components/faculty/ProctorStudentsModal";

import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import StatCardGrid from "../../components/common/StatCardGrid";

const FacultyDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [isProctorModalOpen, setIsProctorModalOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  const blurActiveElement = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const selectMenuProps = {
    disableAutoFocusItem: true,
    slotProps: {
      list: {
        onMouseDown: blurActiveElement,
      },
    },
  };

  // Fetch academic years for the year dropdown
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const res = await API.get("/api/academic-years");

        let years = [];

        if (Array.isArray(res.data)) {
          years = res.data;
        } else if (Array.isArray(res.data.data)) {
          years = res.data.data;
        } else if (Array.isArray(res.data.years)) {
          years = res.data.years;
        }

        // Deduplicate years by the "year" string property
        const uniqueYearsMap = new Map();
        years.forEach(y => {
          if (!uniqueYearsMap.has(y.year) || y.isActive) {
            uniqueYearsMap.set(y.year, y);
          }
        });

        const sortedUniqueYears = Array.from(uniqueYearsMap.values())
          .sort((a, b) => b.year.localeCompare(a.year));

        setAcademicYears(sortedUniqueYears);

        const active = sortedUniqueYears.find((y) => y.active);
        if (active) setSelectedYear(active.year);
        else if (sortedUniqueYears.length > 0) setSelectedYear(sortedUniqueYears[0].year);
      } catch (err) {
        console.error("Failed to fetch academic years:", err);
      }
    };
    fetchYears();
  }, []);

  const fetchDashboardData = async (year) => {
    setLoadingDashboard(true);
    try {
      const url = year ? `/api/dashboard/faculty?academicYear=${year}` : "/api/dashboard/faculty";
      const res = await API.get(url);
      setDashboardData(res.data.data);
    } catch (err) {
      console.error("Failed to fetch faculty dashboard data:", err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => {
    if (selectedYear) {
      fetchDashboardData(selectedYear);
    }
  }, [selectedYear]);

  const topCards = [
    {
      title: "Research Works",
      value: dashboardData?.totalResearch || 0,
      subtitle: `${dashboardData?.approvedResearch || 0} Approved • ${dashboardData?.pendingResearch || 0} Pending`,
      icon: <Science />,
      gradient: "linear-gradient(135deg, #3B82F6, #2563EB)",
      color: "#3B82F6",
      linkText: "Manage Research",
      onClick: () => navigate("/research/journal-publication")
    },
    {
      title: "Proctored Students",
      value: dashboardData?.proctoredStudentsCount || 0,
      subtitle: "Assigned for Mentorship",
      icon: <Group />,
      gradient: "linear-gradient(135deg, #8B5CF6, #6D28D9)",
      color: "#8B5CF6",
      linkText: "View Assignments",
      onClick: () => setIsProctorModalOpen(true)
    },
    {
      title: "Appraisal Status",
      value: dashboardData?.appraisalStatus || "Not Started",
      subtitle: `Claimed Score: ${dashboardData?.appraisalScore || 0} pts`,
      progress: Math.min(((dashboardData?.appraisalScore || 0) / 100) * 100, 100),
      icon: <AssignmentTurnedIn />,
      gradient: "linear-gradient(135deg, #F59E0B, #D97706)",
      color: "#F59E0B",
      linkText: "View Appraisal",
      onClick: () => navigate("/faculty/appraisal")
    },
    {
      title: "Value Additions",
      value: dashboardData?.activitiesCount || 0,
      subtitle: "Resource Util. & Contrib.",
      icon: <Event />,
      gradient: "linear-gradient(135deg, #EF4444, #DC2626)",
      color: "#EF4444",
      linkText: "Manage Value Add.",
      onClick: () => navigate("/value-addition/resource-utilization")
    },
  ];

  const CHART_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4"];

  const quickActions = [
    { title: "Submit Journal", desc: "Publish research paper", icon: <Science sx={{ color: "#3B82F6" }} />, onClick: () => navigate("/research/journal-publication") },
    { title: "Submit Patent", desc: "Register intellectual property", icon: <Science sx={{ color: "#10B981" }} />, onClick: () => navigate("/research/patent-publication") },
    { title: "Submit Textbook", desc: "Publish textbook details", icon: <MenuBook sx={{ color: "#3B82F6" }} />, onClick: () => navigate("/research/textbook-publication") },
    { title: "Resource Utilization", desc: "Log equipment & lab use", icon: <AssignmentTurnedIn sx={{ color: "#10B981" }} />, onClick: () => navigate("/value-addition/resource-utilization") },
    { title: "Contributions", desc: "Faculty achievements", icon: <Description sx={{ color: "#8B5CF6" }} />, onClick: () => navigate("/value-addition/contribution") },
    // { title: "Self Appraisal", desc: "Submit yearly appraisal", icon: <AssignmentTurnedIn sx={{ color: "#8B5CF6" }} />, onClick: () => navigate("/faculty/appraisal") },
    { title: "Proctoring", desc: "Assigned students list", icon: <Group sx={{ color: "#EF4444" }} />, onClick: () => setIsProctorModalOpen(true) },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* Clean Text Header (No Card Box Design) */}
      <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "var(--text-primary)", mb: 0.5 }}>
            Welcome back, {user?.name || "Faculty"}
          </Typography>
          <Typography variant="body1" sx={{ color: "var(--text-secondary)", opacity: 0.8 }}>
            Faculty Dashboard • Manage your teaching, research and academic activities
          </Typography>
        </Box>

        <Select
          size="small"
          value={selectedYear}
          onChange={(e) => {
            setSelectedYear(e.target.value);
            blurActiveElement();
          }}
          onClose={blurActiveElement}
          MenuProps={selectMenuProps}
          sx={{
            borderRadius: "var(--radius-md)",
            borderColor: "var(--border-color)",
            color: "var(--text-primary)",
            background: "var(--bg-paper)",
            backdropFilter: "blur(10px)",
            "& fieldset": { borderColor: "var(--border-color)" },
            "&:hover fieldset": { borderColor: "var(--color-primary)" },
            "&.Mui-focused fieldset": { borderColor: "var(--color-primary)" },
            minWidth: 150
          }}
        >
          {academicYears.map((y) => (
            <MenuItem key={y._id} value={y.year}>{y.year}</MenuItem>
          ))}
        </Select>
      </Box>

      {/* Main Content Area */}
      {loadingDashboard ? (
        <FacultyDashboardSkeleton />
      ) : (
        <>
          {/* Row 1: Summary Cards */}
          <StatCardGrid columns={4} sx={{ mb: 4 }}>
            {topCards.map((card, i) => (
              <Card
                key={i}
                sx={{
                  position: "relative",
                  borderRadius: "16px",
                  background: "var(--bg-panel)",
                  border: "1px solid var(--border-color)",
                  boxShadow: "var(--shadow-premium)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  overflow: "hidden",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
                  },
                  height: "100%",
                  minHeight: "175px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  p: 2.5,
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
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, position: "relative", zIndex: 1 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: card.gradient,
                      color: "#fff",
                      position: "relative",
                      overflow: "hidden",
                      flexShrink: 0,
                      boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
                      "&::after": {
                        content: '""',
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(180deg, #ffffff30, transparent)",
                        borderRadius: 1,
                      },
                    }}
                  >
                    {React.cloneElement(card.icon, { fontSize: "medium" })}
                  </Box>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.3, minWidth: 0, flex: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "var(--text-secondary)",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {card.title}
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 800,
                        color: "var(--text-primary)",
                        mt: 0.5,
                        lineHeight: 1.2,
                        wordBreak: "break-word",
                        fontSize: typeof card.value === "string" ? (card.value.length > 15 ? "1.15rem" : card.value.length > 8 ? "1.4rem" : "2rem") : "2rem"
                      }}
                    >
                      {card.value}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "var(--text-secondary)", opacity: 0.7 }}
                    >
                      {card.subtitle}
                    </Typography>
                    {card.progress !== undefined && (
                      <Box sx={{ width: '100%', mt: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={card.progress}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: `${card.color}30`,
                            '& .MuiLinearProgress-bar': {
                              bgcolor: card.color,
                              borderRadius: 3
                            }
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                </Box>
                <Box
                  sx={{
                    mt: 3,
                    pt: 2,
                    borderTop: "1px solid var(--border-color)",
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <Button
                    size="small"
                    endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                    sx={{
                      textTransform: "none",
                      fontWeight: 700,
                      color: "var(--color-primary)",
                      "&:hover": {
                        background: "transparent",
                        textDecoration: "underline",
                      },
                    }}
                    onClick={card.onClick}
                  >
                    {card.linkText}
                  </Button>
                </Box>
              </Card>
            ))}
          </StatCardGrid>

          {/* Row 2: Research Overview and Quick Actions */}
          <Box
            sx={{
              display: "flex",
              gap: 3,
              flexWrap: { xs: "wrap", xl: "nowrap" },
              mb: 4,
            }}
          >
            {/* Research Overview */}
            <Box sx={{ width: { xs: "100%", xl: "50%" }, display: "flex" }}>
              <Card
                sx={{
                  borderRadius: 2,
                  background: "var(--bg-panel)",
                  border: "1px solid var(--border-color)",
                  boxShadow: "var(--shadow-premium)",
                  p: 3,
                  height: "100%",
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
                  <Typography
                    sx={{
                      fontWeight: 800,
                      fontSize: "1.2rem",
                      color: "var(--text-primary)",
                    }}
                  >
                    Research & Publications
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
                    onClick={() => navigate("/research/journal-publication")}
                  >
                    View All Research
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
                      Submissions by Type
                    </Typography>
                    <Box sx={{ position: "relative", width: 160, height: 160, minWidth: 0 }}>
                      {dashboardData?.totalResearch > 0 ? (
                        <>
                          <ResponsiveContainer width="100%" height={160}>
                            <PieChart>
                              <Pie
                                data={dashboardData?.researchTypeDistribution || []}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={75}
                                paddingAngle={4}
                                stroke="none"
                              >
                                {(dashboardData?.researchTypeDistribution || []).map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                                  />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
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
                              {dashboardData?.totalResearch || 0}
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
                              Submissions
                            </Typography>
                          </Box>
                        </>
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.5, background: 'var(--bg-accent-1)', borderRadius: '50%' }}>
                          <Science sx={{ fontSize: 32, color: 'var(--text-secondary)', mb: 0.5 }} />
                          <Typography sx={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>No Data</Typography>
                        </Box>
                      )}
                    </Box>
                    <Box sx={{
                      mt: 2,
                      width: "100%",
                      maxWidth: 180,
                      maxHeight: 150,
                      overflowY: "auto",
                      "&::-webkit-scrollbar": { display: "none" },
                      msOverflowStyle: "none",
                      scrollbarWidth: "none"
                    }}>
                      {(dashboardData?.researchTypeDistribution || [])
                        .map((item, idx) => ({ ...item, originalIndex: idx }))
                        .filter(item => item.value > 0)
                        .map((item) => (
                          <Box
                            key={item.originalIndex}
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              mb: 1.5,
                            }}
                          >
                            <Box
                              sx={{ display: "flex", alignItems: "center", gap: 1 }}
                            >
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  bgcolor: CHART_COLORS[item.originalIndex % CHART_COLORS.length],
                                }}
                              />
                              <Typography
                                sx={{
                                  fontSize: 13,
                                  color: "var(--text-secondary)",
                                  fontWeight: 500,
                                }}
                              >
                                {item.name}
                              </Typography>
                            </Box>
                            <Typography
                              sx={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: "var(--text-primary)",
                                mr: 1.5,
                              }}
                            >
                              {item.value}
                            </Typography>
                          </Box>
                        ))}
                    </Box>
                  </Box>

                  {/* Research Status Summary */}
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
                        { label: "Total Submissions", value: dashboardData?.totalResearch || 0, icon: <Description sx={{ fontSize: 18, color: "var(--color-primary)" }} />, bgColor: "rgba(59, 130, 246, 0.1)" },
                        { label: "Approved Items", value: dashboardData?.approvedResearch || 0, icon: <AssignmentTurnedIn sx={{ fontSize: 18, color: "#10B981" }} />, bgColor: "rgba(16, 185, 129, 0.1)" },
                        { label: "Pending Verification", value: dashboardData?.pendingResearch || 0, icon: <Event sx={{ fontSize: 18, color: "#F59E0B" }} />, bgColor: "rgba(245, 158, 11, 0.1)" },
                        { label: "Rejected / Returned", value: dashboardData?.rejectedResearch || 0, icon: <PersonOff sx={{ fontSize: 18, color: "#EF4444" }} />, bgColor: "rgba(239, 68, 68, 0.1)" },
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
              <Card
                sx={{
                  position: "relative",
                  borderRadius: 2,
                  background: "var(--bg-panel)",
                  border: "1px solid var(--border-color)",
                  boxShadow: "var(--shadow-premium)",
                  p: 3,
                  height: "100%",
                  width: "100%",
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
                }}
              >
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
                  }}
                >
                  {quickActions.map((action, i) => (
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
                          borderRadius: 1,
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
                        onClick={action.onClick}
                      >
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 1,
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

          {/* Row 3: Recent Research Submissions Table */}
          <Card
            sx={{
              borderRadius: 2,
              background: "var(--bg-panel)",
              border: "1px solid var(--border-color)",
              boxShadow: "var(--shadow-premium)",
              p: 3,
              mb: 4,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
                flexWrap: "wrap",
                gap: 2
              }}
            >
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: "1.2rem",
                  color: "var(--text-primary)",
                }}
              >
                Recent Research Submissions
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
                onClick={() => navigate("/research/journal-publication")}
              >
                View All Submissions
              </Button>
            </Box>

            {(dashboardData?.recentResearchList || []).length > 0 ? (
              <DataTable
                columns={["TITLE / NAME", "TYPE", "ACADEMIC YEAR", "STATUS", "DATE SUBMITTED"]}
                alignments={["left", "center", "center", "center", "center"]}
                rows={(dashboardData?.recentResearchList || []).map(item => [
                  {
                    display: (
                      <MuiTooltip title={item.title} arrow placement="top">
                        <Typography
                          sx={{
                            maxWidth: { xs: "180px", sm: "300px", md: "450px" },
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            color: "var(--text-primary)",
                            textAlign: "left"
                          }}
                        >
                          {item.title}
                        </Typography>
                      </MuiTooltip>
                    ),
                    value: item.title
                  },
                  item.type,
                  item.year,
                  {
                    display: (
                      <Chip
                        label={item.status}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: "0.75rem",
                          bgcolor:
                            item.status === "Approved"
                              ? "#dcfce7"
                              : item.status.startsWith("Pending")
                                ? "#fef3c7"
                                : "#fee2e2",
                          color:
                            item.status === "Approved"
                              ? "#166534"
                              : item.status.startsWith("Pending")
                                ? "#92400e"
                                : "#991b1b",
                          textTransform: "capitalize"
                        }}
                      />
                    ),
                    value: item.status
                  },
                  new Date(item.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                  })
                ])}
              />
            ) : (
              <Box sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: 'var(--bg-accent-1)', borderRadius: 2, border: '1px dashed var(--border-color)' }}>
                <Science sx={{ fontSize: 64, color: 'var(--color-primary)', opacity: 0.5, mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'var(--text-primary)', mb: 1 }}>
                  No Research Submissions Found
                </Typography>
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 3, maxWidth: 400 }}>
                  Looks like you haven't published anything for this academic year yet. Click below to submit your first journal or patent!
                </Typography>
                <Button variant="contained" onClick={() => navigate("/research/journal-publication")} sx={{ borderRadius: '8px', fontWeight: 700, textTransform: 'none', px: 3, boxShadow: 'none' }}>
                  Submit Research
                </Button>
              </Box>
            )}
          </Card>
        </>
      )}

      {/* Proctoring Students Modal */}
      <ProctorStudentsModal
        open={isProctorModalOpen}
        onClose={() => setIsProctorModalOpen(false)}
        proctorId={user?.institutionId || user?.username}
      />
    </Box>
  );
};

export default FacultyDashboard;

const filterBox = {
  display: "flex",
  alignItems: "center",
  px: 2,
  py: 1,
  borderRadius: "14px",
  background: "var(--bg-glass)",
  color: "var(--text-primary)",
  fontWeight: 600,
  backdropFilter: "blur(10px)",
  boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
  border: "1px solid var(--border-color)",
  fontSize: 14,
};

const FacultyDashboardSkeleton = () => (
  <Box>
    {/* Row 1 Skeletons */}
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2.5, mb: 4, width: "100%" }}>
      {[1, 2, 3, 4].map((i) => (
        <Box key={i} sx={{ flex: { xs: "1 1 100%", sm: "1 1 calc(50% - 10px)", md: "1 1 calc(50% - 10px)", lg: "1 1 calc(50% - 10px)", xl: "1 1 calc(25% - 19px)" }, minWidth: 0 }}>
          <Skeleton variant="rounded" height={175} sx={{ borderRadius: "16px" }} />
        </Box>
      ))}
    </Box>
    {/* Row 2 Skeletons */}
    <Box sx={{ display: "flex", gap: 3, flexWrap: { xs: "wrap", xl: "nowrap" }, mb: 4 }}>
      <Box sx={{ width: { xs: "100%", xl: "50%" }, display: "flex" }}>
        <Skeleton variant="rounded" height={320} width="100%" sx={{ borderRadius: 2 }} />
      </Box>
      <Box sx={{ width: { xs: "100%", xl: "50%" }, display: "flex" }}>
        <Skeleton variant="rounded" height={320} width="100%" sx={{ borderRadius: 2 }} />
      </Box>
    </Box>
    {/* Row 3 Skeleton */}
    <Skeleton variant="rounded" height={250} width="100%" sx={{ borderRadius: 2 }} />
  </Box>
);
