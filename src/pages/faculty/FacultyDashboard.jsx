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
  CircularProgress,
  Chip,
  MenuItem,
  Select,
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
} from "@mui/icons-material";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import DataTable from "../../components/data/DataTable";
import ProctorStudentsModal from "../../components/faculty/ProctorStudentsModal";

const FacultyDashboard = () => {
  const { user } = useAuth();

  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [isProctorModalOpen, setIsProctorModalOpen] = useState(false);

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

        // Default to the active year if available
        const active = sortedUniqueYears.find((y) => y.isActive);
        if (active) setSelectedYear(active.year);
        else if (sortedUniqueYears.length > 0) setSelectedYear(sortedUniqueYears[0].year);
      } catch (err) {
        console.error("Failed to fetch academic years:", err);
      }
    };
    fetchYears();
  }, []);



  // ── Static Data (to be wired up later) ───────────────────────────────────
  const topCards = [
    {
      title: "Courses Assigned",
      value: "8",
      subtitle: "This Semester",
      icon: <MenuBook />,
      gradient: "linear-gradient(135deg, #3B82F6, #2563EB)",
      linkText: "View Details",
    },
    {
      title: "Publications",
      value: "12",
      subtitle: "Total Publications",
      icon: <Description />,
      gradient: "linear-gradient(135deg, #8B5CF6, #6D28D9)",
      linkText: "View Details",
    },
    {
      title: "Pending Tasks",
      value: "5",
      subtitle: "Requires Attention",
      icon: <AssignmentTurnedIn />,
      gradient: "linear-gradient(135deg, #F59E0B, #D97706)",
      linkText: "View Details",
    },
    {
      title: "Upcoming Classes",
      value: "3",
      subtitle: "Today",
      icon: <Event />,
      gradient: "linear-gradient(135deg, #EF4444, #DC2626)",
      linkText: "View Schedule",
    },
  ];

  const courseLoadData = [
    { name: "Theory Courses", value: 5 },
    { name: "Lab Courses", value: 2 },
    { name: "Tutorials", value: 1 },
  ];
  const CHART_COLORS = ["#3B82F6", "#10B981", "#F59E0B"];

  const quickActions = [
    { title: "View Time Table", desc: "Check class schedule", icon: <Event sx={{ color: "#3B82F6" }} /> },
    { title: "Upload Materials", desc: "Share study materials", icon: <CloudUpload sx={{ color: "#10B981" }} /> },
    { title: "Mark Attendance", desc: "Take attendance", icon: <Group sx={{ color: "#3B82F6" }} /> },
    { title: "Student Feedback", desc: "View feedback", icon: <Feedback sx={{ color: "#10B981" }} /> },
    { title: "Proctoring", desc: "Assigned students", icon: <Group sx={{ color: "#8B5CF6" }} />, onClick: () => setIsProctorModalOpen(true) },
    { title: "Academic Calendar", desc: "Important dates", icon: <CalendarMonth sx={{ color: "#8B5CF6" }} /> },
    { title: "Leave Request", desc: "Apply for leave", icon: <PersonOff sx={{ color: "#3B82F6" }} /> },
  ];

  const myCourses = [
    { code: "MA101", name: "Mathematics", branch: "CSE", sem: "1", students: 60 },
    { code: "MA201", name: "Discrete Mathematics", branch: "CSE", sem: "3", students: 55 },
    { code: "MA301", name: "Numerical Methods", branch: "CSE", sem: "5", students: 48 },
    { code: "MA401", name: "Probability & Statistics", branch: "CSE", sem: "7", students: 45 },
    { code: "MA502", name: "Operations Research", branch: "CSE", sem: "9", students: 40 },
  ];



  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
          mb: 4,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: "var(--color-primary)",
              letterSpacing: "-0.02em",
              mb: 0.5,
              fontSize: { xs: "1.75rem", sm: "2.125rem" }
            }}
          >
            Welcome back, {user?.name || "Faculty"}!
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "var(--text-secondary)", fontWeight: 500 }}
          >
            Faculty Dashboard • Manage your teaching, research and academic
            activities
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", alignSelf: { xs: "flex-end", sm: "center" } }}>
          <Button
            variant="outlined"
            sx={{
              borderRadius: "12px",
              borderColor: "var(--border-color)",
              color: "var(--text-primary)",
              textTransform: "none",
              background: "var(--bg-glass)",
              backdropFilter: "blur(10px)",
              "&:hover": {
                borderColor: "var(--color-primary)",
                background: "var(--bg-accent-1)",
              },
            }}
            startIcon={<CalendarMonth sx={{ color: "var(--color-primary)" }} />}
          >
            {selectedYear || "Academic Year"}
          </Button>
        </Box>
      </Box>

      {/* Row 1: Summary Cards */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2.5,
          mb: 4,
          width: "100%",
        }}
      >
        {topCards.map((card, i) => (
          <Box
            key={i}
            sx={{
              flex: {
                xs: "1 1 100%",
                sm: "1 1 calc(50% - 10px)",
                md: "1 1 calc(25% - 19px)",
              },
              minWidth: 0,
            }}
          >
            <Card
              sx={{
                borderRadius: 2,
                background: "var(--bg-panel)",
                border: "1px solid var(--border-color)",
                boxShadow: "var(--shadow-premium)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  transform: "translateY(-6px)",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
                  borderColor: "var(--color-primary)",
                },
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                p: 2.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                <Box
                  sx={{
                    width: 52,
                    height: 52,
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
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.3 }}>
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
                >
                  {card.linkText}
                </Button>
              </Box>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Row 2: Teaching Overview and Quick Actions */}
      <Box
        sx={{
          display: "flex",
          gap: 3,
          flexWrap: { xs: "wrap", lg: "nowrap" },
          mb: 4,
        }}
      >
        {/* Teaching Overview */}
        <Box sx={{ width: { xs: "100%", lg: "50%" }, display: "flex" }}>
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
                Teaching Overview
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
              >
                View All Courses
              </Button>
            </Box>

            <Box
              sx={{
                display: "flex",
                gap: 3,
                alignItems: "center",
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
                  alignItems: "center",
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    alignSelf: "flex-start",
                    mb: 1,
                    fontWeight: 700,
                    color: "var(--text-secondary)",
                    textTransform: "uppercase",
                    fontSize: "0.7rem",
                    letterSpacing: "0.05em",
                  }}
                >
                  Course Load
                </Typography>
                <Box sx={{ position: "relative", width: 160, height: 160, minWidth: 0 }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50}>
                    <PieChart>
                      <Pie
                        data={courseLoadData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={4}
                        stroke="none"
                      >
                        {courseLoadData.map((entry, index) => (
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
                      8
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
                      Assigned
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ mt: 2, width: "100%" }}>
                  {courseLoadData.map((item, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 1,
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: 1,
                            bgcolor: CHART_COLORS[idx % CHART_COLORS.length],
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
                        }}
                      >
                        {item.value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Semester Stats */}
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
                  Semester Stats
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {[
                    { label: "Total Classes", value: 96, icon: <Event sx={{ fontSize: 20, color: "var(--color-primary)" }} /> },
                    { label: "Classes Conducted", value: 68, icon: <Group sx={{ fontSize: 20, color: "#10B981" }} /> },
                    { label: "Attendance Avg.", value: "87%", icon: <Box sx={{ width: 20, height: 20, borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--color-primary)", color: "var(--color-primary)", fontSize: 12, fontWeight: 800 }}>%</Box> },
                    { label: "Remaining Classes", value: 28, icon: <Event sx={{ fontSize: 20, color: "#F59E0B" }} /> },
                  ].map((stat, i) => (
                    <Box key={i} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {stat.icon}
                        <Typography sx={{ fontSize: 14, color: "var(--text-secondary)", fontWeight: 500 }}>
                          {stat.label}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
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
        <Box sx={{ width: { xs: "100%", lg: "50%" }, display: "flex" }}>
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

      {/* Row 3: Courses Table */}
      <Card
        sx={{
          borderRadius: 2,
          background: "var(--bg-panel)",
          border: "1px solid var(--border-color)",
          boxShadow: "var(--shadow-premium)",
          p: 3,
          mb: 4,
          overflow: "hidden"
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
            My Courses
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
          >
            View All Courses
          </Button>
        </Box>

        <DataTable
          columns={["COURSE CODE", "COURSE NAME", "BRANCH", "SEMESTER", "STUDENTS", "ACTIONS"]}
          rows={myCourses.map(course => [
            course.code,
            course.name,
            course.branch,
            course.sem,
            course.students,
            {
              display: (
                <IconButton 
                  size="small" 
                  sx={{ 
                    color: "var(--color-primary)",
                    "&:hover": { background: "var(--bg-accent-1)" }
                  }}
                >
                  <Visibility fontSize="small" />
                </IconButton>
              ),
              value: "View"
            }
          ])}
        />
      </Card>

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
