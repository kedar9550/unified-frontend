import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Divider,
  Alert,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  InputAdornment,
  Paper,
  useTheme,
  useMediaQuery
} from "@mui/material";
import {
  Save,
  Add,
  Delete,
  Settings,
  InfoOutlined,
  School,
  Science,
  WorkspacePremium,
  SupervisorAccount,
  Search,
  Close,
  MenuBook,
  EmojiEvents,
  AccountBalance,
  TrendingUp,
  BarChart,
  Stars,
  Star,
  SettingsSuggest,
  KeyboardArrowDown,
  KeyboardArrowUp,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon
} from "@mui/icons-material";
import axiosInstance from "../../api/axios";
import { toast } from "sonner";
import PageHeader from "../../components/common/PageHeader";

const AppraisalSettings = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState(null);

  // Tab control state
  const [activeTab, setActiveTab] = useState(0);

  // Administrative roles search filter state
  const [adminSearch, setAdminSearch] = useState("");

  // Per-card editing states
  const [editingCard, setEditingCard] = useState({});

  // Expand/collapse states for lists inside cards
  const [expandedCard, setExpandedCard] = useState({});

  const toggleEditCard = (cardId) => {
    setEditingCard(prev => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  const toggleExpandCard = (cardId) => {
    setExpandedCard(prev => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  // Load academic years
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const res = await axiosInstance.get("/api/academic-years");
        const yearsList = res.data?.years || [];
        setAcademicYears(yearsList);
        if (yearsList.length > 0) {
          setSelectedYear(yearsList[0]._id);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load academic years");
      }
    };
    fetchYears();
  }, []);

  // Fetch settings when year is changed
  useEffect(() => {
    if (!selectedYear) return;
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/api/appraisal/config/${selectedYear}`);
        if (res.data && res.data.success) {
          setConfig(res.data.data);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to fetch points configurations");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [selectedYear]);

  const handleSave = async () => {
    if (!config) return;
    setLoading(true);
    try {
      const res = await axiosInstance.post("/api/appraisal/config", {
        academicYearId: selectedYear,
        teaching: config.teaching,
        research: config.research,
        valueAddition: config.valueAddition,
        administration: config.administration,
        isActive: config.isActive || false
      });
      if (res.data && res.data.success) {
        toast.success("Points configurations saved successfully!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save configurations");
    } finally {
      setLoading(false);
    }
  };

  // Handler for adding/deleting point ranges
  const addRange = (type) => {
    setConfig(prev => {
      const updated = { ...prev };
      updated.teaching[type].push({ min: 0, max: 0, points: 0 });
      return updated;
    });
  };

  const deleteRange = (type, index) => {
    setConfig(prev => {
      const updated = { ...prev };
      updated.teaching[type].splice(index, 1);
      return updated;
    });
  };

  const updateRange = (type, index, field, value) => {
    setConfig(prev => {
      const updated = { ...prev };
      updated.teaching[type][index][field] = Number(value);
      return updated;
    });
  };

  const updateCoAttainment = (coKey, value) => {
    setConfig(prev => {
      const updated = { ...prev };
      updated.teaching.coAttainmentPoints[coKey] = Number(value);
      return updated;
    });
  };

  const updateResearchMetric = (category, itemKey, value) => {
    setConfig(prev => {
      const updated = { ...prev };
      updated.research[category][itemKey] = Number(value);
      return updated;
    });
  };

  const updateResourcePoint = (key, value) => {
    setConfig(prev => {
      const updated = { ...prev };
      if (!updated.valueAddition) updated.valueAddition = {};
      if (!updated.valueAddition.resourceUtilizationPoints) updated.valueAddition.resourceUtilizationPoints = {};
      updated.valueAddition.resourceUtilizationPoints[key] = Number(value);
      return updated;
    });
  };

  const updateExpertisePoint = (key, value) => {
    setConfig(prev => {
      const updated = { ...prev };
      if (!updated.valueAddition) updated.valueAddition = {};
      if (!updated.valueAddition.expertisePoints) updated.valueAddition.expertisePoints = {};
      updated.valueAddition.expertisePoints[key] = Number(value);
      return updated;
    });
  };

  const updateAdminRolePoint = (key, value) => {
    setConfig(prev => {
      const updated = { ...prev };
      if (!updated.administration) updated.administration = {};
      if (!updated.administration.rolePoints) updated.administration.rolePoints = {};
      updated.administration.rolePoints[key] = Number(value);
      return updated;
    });
  };

  // Administrative roles static schema configuration
  const adminRolesSchema = [
    { name: "Dean / Associate Dean / CoE", centralKey: "deanCentral", deptKey: null, defCentral: 20, defDept: null },
    { name: "HoD / Dy. CoE / Controller (University Office)", centralKey: "hodCentral", deptKey: "hodDept", defCentral: 15, defDept: 15 },
    { name: "Dy. HoD / Department Exam Cell Incharge", centralKey: null, deptKey: "dyHodDept", defCentral: null, defDept: 10 },
    { name: "Time Table / Project Coordinator / Curriculum Coordinator", centralKey: null, deptKey: "timetableDept", defCentral: null, defDept: 10 },
    { name: "Placement / Internship / Alumni Coordinator", centralKey: "placementCentral", deptKey: "placementDept", defCentral: 10, defDept: 10 },
    { name: "Coursera / LinkedIn Learning Coordinator / ALA", centralKey: "courseraCentral", deptKey: "courseraDept", defCentral: 10, defDept: 5 },
    { name: "EDC / IIC / IQAC Coordinator", centralKey: "edcCentral", deptKey: "edcDept", defCentral: 10, defDept: 5 },
    { name: "Course Coordinator", centralKey: null, deptKey: "courseDept", defCentral: null, defDept: 5 },
    { name: "Website Coordinator", centralKey: "websiteCentral", deptKey: null, defCentral: 10, defDept: null },
    { name: "NSS / Professional Chapter Coordinator", centralKey: "nssCentral", deptKey: "nssDept", defCentral: 10, defDept: 5 },
    { name: "Training Program Coordinator (Smart Interviews/GPP/etc.)", centralKey: "trainingCentral", deptKey: "trainingDept", defCentral: 10, defDept: 5 },
    { name: "DRC / Research Coordinator", centralKey: null, deptKey: "drcDept", defCentral: null, defDept: 5 },
    { name: "Anti-Ragging Committee Coordinator", centralKey: "antiRaggingCentral", deptKey: "antiRaggingDept", defCentral: 5, defDept: 3 },
    { name: "Any Other Remarkable Activity Coordinator", centralKey: "otherCentral", deptKey: "otherDept", defCentral: 10, defDept: 5 }
  ];

  // Filtered admin roles based on search
  const filteredAdminRoles = adminRolesSchema.filter(role =>
    role.name.toLowerCase().includes(adminSearch.toLowerCase())
  );

  if (!config) {
    return (
      <Box p={4} sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Typography variant="h6" color="var(--text-secondary)">Loading Configurations...</Typography>
      </Box>
    );
  }

  // Premium cell-style input fields (Notion/spreadsheet style hover)
  const cellInputStyle = {
    width: "85px",
    "& .MuiOutlinedInput-root": {
      borderRadius: "6px",
      backgroundColor: "var(--bg-paper)",
      transition: "all 0.2s ease",
      "& fieldset": {
        borderColor: "var(--border-color)"
      },
      "&:hover fieldset": {
        borderColor: "var(--color-primary)"
      },
      "&.Mui-focused fieldset": {
        borderColor: "var(--color-primary)",
        borderWidth: "1.5px"
      }
    },
    "& .MuiInputBase-input": {
      padding: "6px 8px",
      fontSize: "0.82rem",
      fontWeight: 700,
      textAlign: "right",
      color: "var(--text-primary)"
    }
  };

  const horizontalTabStyle = {
    textTransform: "none",
    fontWeight: 700,
    fontSize: { xs: "0.8rem", sm: "0.92rem" },
    py: { xs: 1, sm: 1.5 },
    px: { xs: 1.5, sm: 2.5 },
    minHeight: { xs: "40px", sm: "48px" },
    color: "var(--text-secondary)",
    transition: "all 0.2s ease-in-out",
    "&.Mui-selected": {
      color: "var(--color-primary) !important",
      "& .MuiSvgIcon-root": {
        color: "var(--color-primary) !important"
      }
    },
    "& .MuiSvgIcon-root": {
      color: "var(--text-secondary)",
      transition: "color 0.2s ease"
    },
    "&:hover": {
      color: "var(--color-primary)",
      "& .MuiSvgIcon-root": {
        color: "var(--color-primary)"
      }
    }
  };

  const renderSettingsCard = ({
    id,
    title,
    icon,
    items, // array of { label, value, setter, isCap }
    onAdd = null, // function (idx, field, val)
    onDelete = null, // function (idx)
    isRangeList = false,
    accentColor = "#10b981",
    accentBg = "rgba(16, 185, 129, 0.08)",
    hoverBorderColor = "rgba(16, 185, 129, 0.2)"
  }) => {
    const isEditing = !!editingCard[id];

    return (
      <Card
        variant="outlined"
        sx={{
          borderRadius: "16px",
          borderColor: "var(--border-color)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.01)",
          backgroundColor: "var(--bg-paper)",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          transition: "all 0.3s ease",
          "&:hover": {
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.03)",
            borderColor: hoverBorderColor
          }
        }}
      >
        {/* Card Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2, pb: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                backgroundColor: accentBg,
                color: accentColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}
            >
              {icon}
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.85rem" }}>
              {title}
            </Typography>
          </Box>

          <Button
            size="small"
            onClick={() => toggleEditCard(id)}
            startIcon={isEditing ? <CheckCircleIcon sx={{ fontSize: 13 }} /> : <EditIcon sx={{ fontSize: 13 }} />}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.72rem",
              borderRadius: "6px",
              px: 1.2,
              py: 0.3,
              border: "1px solid",
              borderColor: isEditing ? "success.main" : "var(--border-color)",
              color: isEditing ? "success.main" : accentColor,
              "&:hover": {
                backgroundColor: isEditing ? "rgba(46, 125, 50, 0.05)" : "rgba(0, 78, 146, 0.05)"
              }
            }}
          >
            {isEditing ? "Done" : "Edit"}
          </Button>
        </Box>

        <Divider />

        {/* Card Body */}
        <Box sx={{ p: 2, flexGrow: 1, display: "flex", flexDirection: "column", gap: 1 }}>
          {isRangeList ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Box sx={{
                border: "1px solid var(--border-color)",
                borderTop: `3px solid ${accentColor}`,
                borderRadius: "8px",
                overflow: "hidden",
                backgroundColor: "var(--bg-paper)"
              }}>
                {/* Header row */}
                <Box sx={{
                  display: (!isEditing) ? "flex" : { xs: "none", sm: "flex" },
                  justifyContent: "space-between",
                  px: { xs: 1, sm: 2 },
                  py: 1,
                  backgroundColor: "rgba(0, 0, 0, 0.015)",
                  borderBottom: "1px solid var(--border-color)"
                }}>
                  <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-secondary)", width: "30%" }}>Min (%)</Typography>
                  <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-secondary)", width: "30%" }}>Max (%)</Typography>
                  <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-secondary)", width: "30%", textAlign: "right" }}>Points</Typography>
                  {isEditing && <Box sx={{ width: "24px" }}></Box>}
                </Box>

                {/* Rows */}
                <Box sx={{ px: { xs: 1, sm: 2 }, py: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                  {items.map((range, idx) => (
                    <Box 
                      key={idx} 
                      sx={{ 
                        display: "flex", 
                        flexDirection: "row",
                        justifyContent: "space-between", 
                        alignItems: "center", 
                        py: 0.5,
                        width: "100%"
                      }}
                    >
                      {isEditing ? (
                        isMobile ? (
                          <Box sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 1.5,
                            width: "100%",
                            p: 1.5,
                            border: "1px dashed var(--border-color)",
                            borderRadius: "10px",
                            backgroundColor: "rgba(0, 0, 0, 0.01)"
                          }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color: accentColor }}>
                                Range #{idx + 1}
                              </Typography>
                              <IconButton color="error" size="small" onClick={() => onDelete(idx)} sx={{ p: 0.5 }}>
                                <Delete sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Box>
                            <Box sx={{ display: "flex", gap: 1 }}>
                              <TextField
                                type="number"
                                size="small"
                                label="Min (%)"
                                value={range.min}
                                onChange={(e) => onAdd(idx, "min", e.target.value)}
                                sx={{
                                  flex: 1,
                                  "& .MuiOutlinedInput-root": {
                                    borderRadius: "8px",
                                    backgroundColor: "var(--bg-paper)"
                                  },
                                  "& .MuiInputBase-input": {
                                    fontWeight: 700
                                  }
                                }}
                              />
                              <TextField
                                type="number"
                                size="small"
                                label="Max (%)"
                                value={range.max}
                                onChange={(e) => onAdd(idx, "max", e.target.value)}
                                sx={{
                                  flex: 1,
                                  "& .MuiOutlinedInput-root": {
                                    borderRadius: "8px",
                                    backgroundColor: "var(--bg-paper)"
                                  },
                                  "& .MuiInputBase-input": {
                                    fontWeight: 700
                                  }
                                }}
                              />
                              <TextField
                                type="number"
                                size="small"
                                label="Points"
                                value={range.points}
                                onChange={(e) => onAdd(idx, "points", e.target.value)}
                                sx={{
                                  flex: 1,
                                  "& .MuiOutlinedInput-root": {
                                    borderRadius: "8px",
                                    backgroundColor: "var(--bg-paper)"
                                  },
                                  "& .MuiInputBase-input": {
                                    fontWeight: 700
                                  }
                                }}
                              />
                            </Box>
                          </Box>
                        ) : (
                          <>
                            <TextField
                              type="number"
                              size="small"
                              value={range.min}
                              onChange={(e) => onAdd(idx, "min", e.target.value)}
                              sx={{ ...cellInputStyle, width: "28%", "& .MuiInputBase-input": { textAlign: "center" } }}
                            />
                            <TextField
                              type="number"
                              size="small"
                              value={range.max}
                              onChange={(e) => onAdd(idx, "max", e.target.value)}
                              sx={{ ...cellInputStyle, width: "28%", "& .MuiInputBase-input": { textAlign: "center" } }}
                            />
                            <TextField
                              type="number"
                              size="small"
                              value={range.points}
                              onChange={(e) => onAdd(idx, "points", e.target.value)}
                              sx={{ ...cellInputStyle, width: "28%" }}
                            />
                            <IconButton color="error" size="small" onClick={() => onDelete(idx)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </>
                        )
                      ) : (
                        <>
                          <Typography sx={{ fontSize: "0.8rem", color: "var(--text-secondary)", width: "30%", pl: 1 }}>{range.min}%</Typography>
                          <Typography sx={{ fontSize: "0.8rem", color: "var(--text-secondary)", width: "30%", pl: 1 }}>{range.max}%</Typography>
                          <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#10b981", width: "30%", textAlign: "right" }}>{range.points} pts</Typography>
                        </>
                      )}
                    </Box>
                  ))}
                </Box>
              </Box>

              {isEditing && (
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  size="small"
                  fullWidth
                  onClick={() => onAdd(null, null, null)}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    borderStyle: "dashed",
                    borderColor: accentColor,
                    color: accentColor
                  }}
                >
                  Add Point Range
                </Button>
              )}
            </Box>
          ) : (
            <Box sx={{
              border: "1px solid var(--border-color)",
              borderTop: `3px solid ${accentColor}`,
              borderRadius: "8px",
              overflow: "hidden",
              backgroundColor: "var(--bg-paper)"
            }}>
              {/* Header row */}
              <Box sx={{
                display: "flex",
                justifyContent: "space-between",
                px: 2,
                py: 1,
                backgroundColor: "rgba(0, 0, 0, 0.015)",
                borderBottom: "1px solid var(--border-color)"
              }}>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-secondary)" }}>Category / Metric</Typography>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-secondary)", textAlign: "right", pr: isEditing ? 5 : 1 }}>Points</Typography>
              </Box>

              {/* Rows */}
              <Box sx={{ px: 2, display: "flex", flexDirection: "column" }}>
                {items.map((item, idx) => {
                  const isCapRow = !!item.isCap;
                  return (
                    <Box
                      key={idx}
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 2,
                        py: 1.2,
                        px: isCapRow ? 1.5 : 0,
                        borderRadius: isCapRow ? "8px" : 0,
                        backgroundColor: isCapRow ? "rgba(139, 92, 246, 0.04)" : "transparent",
                        border: isCapRow ? "1px dashed rgba(139, 92, 246, 0.25)" : "none",
                        mt: isCapRow ? 1.5 : 0,
                        borderBottom: (isCapRow || idx === items.length - 1) ? "none" : "1px solid var(--border-color)"
                      }}
                    >
                      <Typography variant="body2" sx={{ flex: 1, fontWeight: isCapRow ? 800 : 500, color: isCapRow ? accentColor : "var(--text-secondary)", fontSize: "0.82rem", pr: 2 }}>
                        {item.label}
                      </Typography>

                      <Box sx={{ flexShrink: 0 }}>
                        {isEditing ? (
                          <TextField
                            type="number"
                            size="small"
                            value={item.value}
                            onChange={(e) => item.setter(e.target.value)}
                            sx={cellInputStyle}
                          />
                        ) : (
                          <Typography variant="body2" sx={{ fontWeight: 800, color: isCapRow ? accentColor : "#10b981", whiteSpace: "nowrap" }}>
                            {item.value} pts
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}
        </Box>
      </Card>
    );
  };

  const renderCitationsRow = () => {
    const id = "research_citations";
    const isEditing = !!editingCard[id];

    return (
      <Card
        variant="outlined"
        sx={{
          borderRadius: "16px",
          borderColor: "var(--border-color)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.01)",
          backgroundColor: "var(--bg-paper)",
          width: "100%",
          p: 3,
          mt: 3,
          "&:hover": {
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.03)"
          }
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                backgroundColor: "rgba(16, 185, 129, 0.08)",
                color: "#10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <BarChart />
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.85rem" }}>
              2.7 & 2.8 Scopus Citation & H-Index Points Settings
            </Typography>
          </Box>

          <Button
            size="small"
            onClick={() => toggleEditCard(id)}
            startIcon={isEditing ? <CheckCircleIcon sx={{ fontSize: 13 }} /> : <EditIcon sx={{ fontSize: 13 }} />}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.72rem",
              borderRadius: "6px",
              px: 1.2,
              py: 0.3,
              border: "1px solid",
              borderColor: isEditing ? "success.main" : "var(--border-color)",
              color: isEditing ? "success.main" : "var(--color-primary)",
              "&:hover": {
                backgroundColor: isEditing ? "rgba(46, 125, 50, 0.05)" : "rgba(0, 78, 146, 0.05)"
              }
            }}
          >
            {isEditing ? "Done" : "Edit"}
          </Button>
        </Box>

        <Divider sx={{ mb: 2.5 }} />

        <Grid container spacing={3}>
          {[
            {
              label: "Scopus Citation Rate (per / citation)",
              value: config.research.citationRate ?? 0.2,
              setter: (val) => setConfig(prev => ({ ...prev, research: { ...prev.research, citationRate: Number(val) } }))
            },
            {
              label: "H-Index Value (< 5)",
              value: config.research.hIndexRateLow ?? 1,
              setter: (val) => setConfig(prev => ({ ...prev, research: { ...prev.research, hIndexRateLow: Number(val) } }))
            },
            {
              label: "H-Index Value (5 to 10)",
              value: config.research.hIndexRateMid ?? 2,
              setter: (val) => setConfig(prev => ({ ...prev, research: { ...prev.research, hIndexRateMid: Number(val) } }))
            },
            {
              label: "H-Index Value (> 10)",
              value: config.research.hIndexRateHigh ?? 4,
              setter: (val) => setConfig(prev => ({ ...prev, research: { ...prev.research, hIndexRateHigh: Number(val) } }))
            }
          ].map((item, idx) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: "12px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "rgba(0, 0, 0, 0.01)",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 1
                }}
              >
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                  {item.label}
                </Typography>

                {isEditing ? (
                  <TextField
                    type="number"
                    size="small"
                    value={item.value}
                    onChange={(e) => item.setter(e.target.value)}
                    sx={{ ...cellInputStyle, width: "100%" }}
                  />
                ) : (
                  <Typography sx={{ fontSize: "1.4rem", fontWeight: 800, color: "#10b981", mt: 0.5 }}>
                    {item.value}
                  </Typography>
                )}
              </Box>
            </Grid>
          ))}
        </Grid>
      </Card>
    );
  };

  const renderAdminRolesCard = () => {
    const id = "admin_roles";
    const isEditing = !!editingCard[id];

    return (
      <Card
        variant="outlined"
        sx={{
          borderRadius: "16px",
          borderColor: "var(--border-color)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.01)",
          backgroundColor: "var(--bg-paper)",
          width: "100%",
          p: 3,
          "&:hover": {
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.03)"
          }
        }}
      >
        {/* Card Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                backgroundColor: "rgba(245, 158, 11, 0.08)",
                color: "#f59e0b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <SupervisorAccount />
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.85rem" }}>
              4.1 Administrative Roles Point Configurations
            </Typography>
          </Box>

          <Button
            size="small"
            onClick={() => toggleEditCard(id)}
            startIcon={isEditing ? <CheckCircleIcon sx={{ fontSize: 13 }} /> : <EditIcon sx={{ fontSize: 13 }} />}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.72rem",
              borderRadius: "6px",
              px: 1.2,
              py: 0.3,
              border: "1px solid",
              borderColor: isEditing ? "success.main" : "var(--border-color)",
              color: isEditing ? "success.main" : "var(--color-primary)",
              "&:hover": {
                backgroundColor: isEditing ? "rgba(46, 125, 50, 0.05)" : "rgba(0, 78, 146, 0.05)"
              }
            }}
          >
            {isEditing ? "Done" : "Edit"}
          </Button>
        </Box>

        <Divider sx={{ mb: 2.5 }} />

        {/* Search and Table */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 700 }}>
              Roles List (Overall Cap: Max {config.administration?.maxPoints ?? 20} points)
            </Typography>
            <TextField
              placeholder="Search administrative roles..."
              size="small"
              value={adminSearch}
              onChange={(e) => setAdminSearch(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: adminSearch && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setAdminSearch("")}><Close fontSize="small" /></IconButton>
                    </InputAdornment>
                  )
                }
              }}
              sx={{
                width: { xs: "100%", sm: "280px" },
                "& .MuiOutlinedInput-root": {
                  borderRadius: "10px",
                  background: "var(--bg-paper)"
                }
              }}
            />
          </Box>

          <Box sx={{ border: "1px solid var(--border-color)", borderTop: "3px solid #f59e0b", borderRadius: "12px", overflow: "hidden" }}>
            <Table size="small">
              <TableHead sx={{ position: "sticky", top: 0, zIndex: 2 }}>
                <TableRow sx={{ backgroundColor: "rgba(245, 158, 11, 0.08)" }}>
                  <TableCell sx={{ fontWeight: 800, color: "#78350f", py: 1.5, fontSize: "0.8rem" }}>Activity / Role</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#78350f", py: 1.5, fontSize: "0.8rem", width: "140px" }} align="right">Central Level (pts)</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#78350f", py: 1.5, fontSize: "0.8rem", width: "140px" }} align="right">Dept Level (pts)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAdminRoles.map((row, idx) => (
                  <TableRow
                    key={idx}
                    sx={{
                      "&:nth-of-type(even)": { backgroundColor: "rgba(245, 158, 11, 0.015)" },
                      "&:hover": { backgroundColor: "rgba(245, 158, 11, 0.05)" },
                      transition: "background-color 0.2s"
                    }}
                  >
                    <TableCell sx={{ py: 1.5, fontSize: "0.78rem", fontWeight: 600 }}>{row.name}</TableCell>
                    <TableCell sx={{ py: 0.5 }} align="right">
                      {row.centralKey ? (
                        isEditing ? (
                          <TextField
                            type="number"
                            size="small"
                            value={config.administration?.rolePoints?.[row.centralKey] ?? row.defCentral}
                            onChange={(e) => updateAdminRolePoint(row.centralKey, e.target.value)}
                            sx={cellInputStyle}
                          />
                        ) : (
                          <Typography variant="body2" sx={{ fontWeight: 700, color: "#10b981", pr: 1 }}>
                            {config.administration?.rolePoints?.[row.centralKey] ?? row.defCentral} pts
                          </Typography>
                        )
                      ) : (
                        <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.4, fontWeight: 700, pr: 2 }}>N/A</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ py: 0.5 }} align="right">
                      {row.deptKey ? (
                        isEditing ? (
                          <TextField
                            type="number"
                            size="small"
                            value={config.administration?.rolePoints?.[row.deptKey] ?? row.defDept}
                            onChange={(e) => updateAdminRolePoint(row.deptKey, e.target.value)}
                            sx={cellInputStyle}
                          />
                        ) : (
                          <Typography variant="body2" sx={{ fontWeight: 700, color: "#10b981", pr: 1 }}>
                            {config.administration?.rolePoints?.[row.deptKey] ?? row.defDept} pts
                          </Typography>
                        )
                      ) : (
                        <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.4, fontWeight: 700, pr: 2 }}>N/A</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          {/* Capped Limit Row styled in card footer */}
          <Box sx={{
            p: 2,
            borderRadius: "12px",
            background: "rgba(245, 158, 11, 0.05)",
            border: "1px dashed rgba(245, 158, 11, 0.3)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 800, color: "#78350f" }}>
                Max Administrative Capped Limit
              </Typography>
              <Typography variant="caption" color="var(--text-secondary)">
                Maximum allowable points count for section 4.
              </Typography>
            </Box>

            {isEditing ? (
              <TextField
                type="number"
                size="small"
                value={config.administration?.maxPoints ?? ""}
                onChange={(e) => setConfig(prev => {
                  const updated = { ...prev };
                  if (!updated.administration) updated.administration = {};
                  updated.administration.maxPoints = Number(e.target.value);
                  return updated;
                })}
                sx={cellInputStyle}
              />
            ) : (
              <Typography variant="body2" sx={{ fontWeight: 800, color: "#78350f" }}>
                {config.administration?.maxPoints ?? 20} pts
              </Typography>
            )}
          </Box>
        </Box>
      </Card>
    );
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1280, margin: "0 auto", animation: "fadeIn 0.5s ease" }}>
      {/* Redesigned Header using common PageHeader */}
      <PageHeader
        title="Appraisal Points Settings"
        subtitle="Manage points mapping, caps, and weightage rules for self appraisal configurations."
        action={
          <Box sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "stretch", sm: "center" },
            gap: 2,
            width: { xs: "100%", sm: "auto" }
          }}>
            {/* Group Switch and Academic Year Select side-by-side on mobile */}
            <Box sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 2,
              width: { xs: "100%", sm: "auto" },
              justifyContent: "space-between"
            }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.isActive || false}
                    onChange={(e) => setConfig(prev => ({ ...prev, isActive: e.target.checked }))}
                    color="primary"
                    sx={{
                      "& .MuiSwitch-switchBase.Mui-checked": {
                        color: "var(--color-primary)"
                      },
                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                        backgroundColor: "var(--color-primary)"
                      }
                    }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)" }}>
                    Active Config
                  </Typography>
                }
                sx={{ m: 0 }}
              />

              <FormControl variant="outlined" size="small" sx={{ minWidth: { xs: 120, sm: 160 }, flex: { xs: 1, sm: "none" } }}>
                <InputLabel id="academic-year-select-label">Academic Year</InputLabel>
                <Select
                  labelId="academic-year-select-label"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  label="Academic Year"
                  sx={{
                    borderRadius: "10px",
                    backgroundColor: "var(--bg-paper)",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "var(--border-color)"
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "var(--color-primary)"
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "var(--color-primary)"
                    }
                  }}
                >
                  {academicYears.map((ay) => (
                    <MenuItem key={ay._id} value={ay._id}>
                      {ay.year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Button
              variant="contained"
              color="primary"
              startIcon={<Save />}
              onClick={handleSave}
              disabled={loading}
              sx={{
                borderRadius: "20px",
                textTransform: "none",
                fontWeight: 700,
                px: 3,
                py: 1,
                boxShadow: "0 4px 14px rgba(59, 130, 246, 0.4)",
                background: "var(--gradient-primary)",
                color: "#fff",
                width: { xs: "100%", sm: "auto" },
                "&:hover": {
                  background: "var(--gradient-primary-hover)"
                }
              }}
            >
              Save Changes
            </Button>
          </Box>
        }
      />

      <Card
        sx={{
          mt: 3,
          borderRadius: "16px",
          background: "var(--bg-glass)",
          backdropFilter: "blur(12px) saturate(150%)",
          border: "1px solid var(--border-color)",
          boxShadow: "var(--shadow-premium)",
          overflow: "visible"
        }}
      >
        {/* Horizontal Navigation Tabs */}
        <Box sx={{ borderBottom: "1px solid var(--border-color)", px: { xs: 2, md: 3 } }}>
          <Tabs
            value={activeTab}
            onChange={(e, newTab) => setActiveTab(newTab)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              "& .MuiTabs-indicator": {
                backgroundColor: "var(--color-primary)",
                height: "3px",
                borderRadius: "3px 3px 0 0"
              }
            }}
          >
            <Tab label="1. Teaching Metrics" icon={<School fontSize="small" />} iconPosition="start" sx={horizontalTabStyle} />
            <Tab label="2. Research Rules" icon={<Science fontSize="small" />} iconPosition="start" sx={horizontalTabStyle} />
            <Tab label="3. Value Addition" icon={<WorkspacePremium fontSize="small" />} iconPosition="start" sx={horizontalTabStyle} />
            <Tab label="4. Administrative Roles" icon={<SupervisorAccount fontSize="small" />} iconPosition="start" sx={horizontalTabStyle} />
          </Tabs>
        </Box>

        {/* Tab content panel */}
        <Box sx={{ p: { xs: 2.5, md: 4 } }}>
          {/* ========================================================
              TAB 1: TEACHING METRICS
              ======================================================== */}
          {activeTab === 0 && (
            <Box sx={{ animation: "fadeIn 0.3s ease" }}>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 3 }}>
                <SettingsSuggest color="primary" />
                <Typography variant="subtitle1" fontWeight={700} color="var(--text-primary)">
                  1. Teaching & Learning Metric Settings (Overall Cap: Max 80 points)
                </Typography>
              </Box>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 calc(50% - 12px)" }, minWidth: { xs: "100%", sm: "340px" } }}>
                  {renderSettingsCard({
                    id: "teaching_1.1",
                    title: "1.1 Average Pass Percentage",
                    icon: <TrendingUp fontSize="small" />,
                    items: config.teaching.passPercentagePoints,
                    isRangeList: true,
                    onAdd: (idx, field, val) => {
                      if (idx === null) {
                        addRange("passPercentagePoints");
                      } else {
                        updateRange("passPercentagePoints", idx, field, val);
                      }
                    },
                    onDelete: (idx) => deleteRange("passPercentagePoints", idx),
                    accentColor: "#3b82f6",
                    accentBg: "rgba(59, 130, 246, 0.08)",
                    hoverBorderColor: "rgba(59, 130, 246, 0.2)"
                  })}
                </Box>

                <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 calc(50% - 12px)" }, minWidth: { xs: "100%", sm: "340px" } }}>
                  {renderSettingsCard({
                    id: "teaching_1.2",
                    title: "1.2 Faculty Course Feedback",
                    icon: <BarChart fontSize="small" />,
                    items: config.teaching.feedbackPoints,
                    isRangeList: true,
                    onAdd: (idx, field, val) => {
                      if (idx === null) {
                        addRange("feedbackPoints");
                      } else {
                        updateRange("feedbackPoints", idx, field, val);
                      }
                    },
                    onDelete: (idx) => deleteRange("feedbackPoints", idx),
                    accentColor: "#3b82f6",
                    accentBg: "rgba(59, 130, 246, 0.08)",
                    hoverBorderColor: "rgba(59, 130, 246, 0.2)"
                  })}
                </Box>

                <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 calc(50% - 12px)" }, minWidth: { xs: "100%", sm: "340px" } }}>
                  {renderSettingsCard({
                    id: "teaching_1.3",
                    title: "1.3 Proctoring Pass Percentage",
                    icon: <Stars fontSize="small" />,
                    items: config.teaching.proctoringPoints,
                    isRangeList: true,
                    onAdd: (idx, field, val) => {
                      if (idx === null) {
                        addRange("proctoringPoints");
                      } else {
                        updateRange("proctoringPoints", idx, field, val);
                      }
                    },
                    onDelete: (idx) => deleteRange("proctoringPoints", idx),
                    accentColor: "#3b82f6",
                    accentBg: "rgba(59, 130, 246, 0.08)",
                    hoverBorderColor: "rgba(59, 130, 246, 0.2)"
                  })}
                </Box>

                <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 calc(50% - 12px)" }, minWidth: { xs: "100%", sm: "340px" } }}>
                  {renderSettingsCard({
                    id: "teaching_1.4",
                    title: "1.4 Course Outcome (CO) Attainment",
                    icon: <School fontSize="small" />,
                    items: [5, 4, 3, 2].map(coVal => ({
                      label: `Attained ${coVal} Course Outcomes (COs)`,
                      value: config.teaching.coAttainmentPoints[coVal] || 0,
                      setter: (val) => updateCoAttainment(coVal, val)
                    })),
                    accentColor: "#3b82f6",
                    accentBg: "rgba(59, 130, 246, 0.08)",
                    hoverBorderColor: "rgba(59, 130, 246, 0.2)"
                  })}
                </Box>
              </Box>
            </Box>
          )}

          {/* ========================================================
              TAB 2: RESEARCH METRIC RULES
              ======================================================== */}
          {activeTab === 1 && (
            <Box sx={{ animation: "fadeIn 0.3s ease" }}>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 3 }}>
                <Science color="primary" />
                <Typography variant="subtitle1" fontWeight={700} color="var(--text-primary)">
                  2. Research Point Configurations & Rules
                </Typography>
              </Box>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                <Box sx={{ flex: "1 1 420px", minWidth: { xs: "100%", sm: "380px" } }}>
                  {renderSettingsCard({
                    id: "research_2.1",
                    title: "2.1 Paper Publication Points",
                    icon: <MenuBook fontSize="small" />,
                    items: Object.keys(config.research.journalPoints).map((quartile) => ({
                      label: quartile,
                      value: config.research.journalPoints[quartile] || 0,
                      setter: (val) => updateResearchMetric("journalPoints", quartile, val)
                    }))
                  })}
                </Box>
                <Box sx={{ flex: "1 1 420px", minWidth: { xs: "100%", sm: "380px" } }}>
                  {renderSettingsCard({
                    id: "research_2.2",
                    title: "2.2 Ph.D Guiding Points",
                    icon: <School fontSize="small" />,
                    items: [
                      { label: "Ph.D Guiding (Pursuing)", value: config.research.phdGuidingPoints.pursuing, setter: (val) => updateResearchMetric("phdGuidingPoints", "pursuing", val) },
                      { label: "Ph.D Guiding (Awarded)", value: config.research.phdGuidingPoints.awarded, setter: (val) => updateResearchMetric("phdGuidingPoints", "awarded", val) }
                    ]
                  })}
                </Box>
                <Box sx={{ flex: "1 1 420px", minWidth: { xs: "100%", sm: "380px" } }}>
                  {renderSettingsCard({
                    id: "research_2.3",
                    title: "2.3 Books, Chapters & Conferences",
                    icon: <EmojiEvents fontSize="small" />,
                    items: [
                      { label: "ISBN Book Points", value: config.research.bookConferencePoints?.isbnBook ?? "", setter: (val) => updateResearchMetric("bookConferencePoints", "isbnBook", val) },
                      { label: "ISBN Chapter Points", value: config.research.bookConferencePoints?.isbnBookChapter ?? "", setter: (val) => updateResearchMetric("bookConferencePoints", "isbnBookChapter", val) },
                      { label: "Scopus Conference", value: config.research.bookConferencePoints?.scopusConference ?? "", setter: (val) => updateResearchMetric("bookConferencePoints", "scopusConference", val) },
                      { label: "Capped Max Points", value: config.research.bookConferencePoints?.maxPoints ?? "", setter: (val) => updateResearchMetric("bookConferencePoints", "maxPoints", val) }
                    ]
                  })}
                </Box>
                <Box sx={{ flex: "1 1 420px", minWidth: { xs: "100%", sm: "380px" } }}>
                  {renderSettingsCard({
                    id: "research_2.4",
                    title: "2.4 Patents Points",
                    icon: <Stars fontSize="small" />,
                    items: [
                      { label: "Patent (Published)", value: config.research.patentPoints.published, setter: (val) => updateResearchMetric("patentPoints", "published", val) },
                      { label: "Patent (Granted)", value: config.research.patentPoints.granted, setter: (val) => updateResearchMetric("patentPoints", "granted", val) }
                    ]
                  })}
                </Box>
                <Box sx={{ flex: "1 1 420px", minWidth: { xs: "100%", sm: "380px" } }}>
                  {renderSettingsCard({
                    id: "research_2.5",
                    title: "2.5 Novel Products / Technology",
                    icon: <WorkspacePremium fontSize="small" />,
                    items: [
                      { label: "Novel Product (Developed)", value: config.research.novelProductPoints.developed, setter: (val) => updateResearchMetric("novelProductPoints", "developed", val) },
                      { label: "Novel Product (Implemented)", value: config.research.novelProductPoints.implemented, setter: (val) => updateResearchMetric("novelProductPoints", "implemented", val) }
                    ]
                  })}
                </Box>
                <Box sx={{ flex: "1 1 420px", minWidth: { xs: "100%", sm: "380px" } }}>
                  {renderSettingsCard({
                    id: "research_2.6",
                    title: "2.6 Project Proposals / Consultancies",
                    icon: <AccountBalance fontSize="small" />,
                    items: [
                      { label: "Proposals (Shortlisted)", value: config.research.projectProposalPoints.shortlisted, setter: (val) => updateResearchMetric("projectProposalPoints", "shortlisted", val) },
                      { label: "Proposals (Sanctioned / Live)", value: config.research.projectProposalPoints.sanctionedPerLakh, setter: (val) => updateResearchMetric("projectProposalPoints", "sanctionedPerLakh", val) }
                    ]
                  })}
                </Box>
              </Box>

              {renderCitationsRow()}
            </Box>
          )}

          {/* ========================================================
              TAB 3: VALUE ADDITION POINTS
              ======================================================== */}
          {activeTab === 2 && (
            <Box sx={{ animation: "fadeIn 0.3s ease" }}>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 3 }}>
                <WorkspacePremium color="primary" />
                <Typography variant="subtitle1" fontWeight={700} color="var(--text-primary)">
                  3. Extension & Value Addition Points
                </Typography>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <Box sx={{ width: "100%" }}>
                  {renderSettingsCard({
                    id: "value_3.1",
                    title: "3.1 Resource Utilization Capped Points",
                    icon: <WorkspacePremium fontSize="small" />,
                    items: [
                      { label: "Conference (Chair / Co-Chair / Finance / Reg.)", value: config.valueAddition?.resourceUtilizationPoints?.conference ?? 10, setter: (val) => updateResourcePoint("conference", val) },
                      { label: "STTP / Refresher (Convenor / Co-Convenor / Coord.)", value: config.valueAddition?.resourceUtilizationPoints?.sttp ?? 10, setter: (val) => updateResourcePoint("sttp", val) },
                      { label: "FDP / Symposium (Convenor / Co-Convenor / Coord.)", value: config.valueAddition?.resourceUtilizationPoints?.fdp ?? 10, setter: (val) => updateResourcePoint("fdp", val) },
                      { label: "Guest Lecture / WS (Coordinator)", value: config.valueAddition?.resourceUtilizationPoints?.guestLecture ?? 2, setter: (val) => updateResourcePoint("guestLecture", val) },
                      { label: "Resource Person (Per session conducted)", value: config.valueAddition?.resourceUtilizationPoints?.resourcePerson ?? 2, setter: (val) => updateResourcePoint("resourcePerson", val) },
                      { label: "Participant (Per day attended)", value: config.valueAddition?.resourceUtilizationPoints?.participated ?? 1, setter: (val) => updateResourcePoint("participated", val) },
                      {
                        label: "MAX RESOURCE UTILIZATION CAPPED LIMIT",
                        value: config.valueAddition?.resourceUtilizationMaxPoints ?? 10,
                        setter: (val) => setConfig(prev => {
                          const updated = { ...prev };
                          if (!updated.valueAddition) updated.valueAddition = {};
                          updated.valueAddition.resourceUtilizationMaxPoints = Number(val);
                          return updated;
                        }),
                        isCap: true
                      }
                    ],
                    accentColor: "#8b5cf6",
                    accentBg: "rgba(139, 92, 246, 0.08)",
                    hoverBorderColor: "rgba(139, 92, 246, 0.2)"
                  })}
                </Box>

                <Box sx={{ width: "100%" }}>
                  {renderSettingsCard({
                    id: "value_3.2",
                    title: "3.2 Expertise / Recognition Capped Points",
                    icon: <Stars fontSize="small" />,
                    items: [
                      { label: "Member of BOG/GB/AC/BOS (Outside AUS only)", value: config.valueAddition?.expertisePoints?.memberBOS ?? 5, setter: (val) => updateExpertisePoint("memberBOS", val) },
                      { label: "Editorial Board Member (SCIE / Q1 / Q2)", value: config.valueAddition?.expertisePoints?.editorialBoardSCIE ?? 5, setter: (val) => updateExpertisePoint("editorialBoardSCIE", val) },
                      { label: "Editorial Board Member (ESCI/Q3/Q4/Conf)", value: config.valueAddition?.expertisePoints?.editorialBoardESCI ?? 3, setter: (val) => updateExpertisePoint("editorialBoardESCI", val) },
                      { label: "Awards (MHRD/AICTE/UGC/State Govt./Top 2%)", value: config.valueAddition?.expertisePoints?.awardsGovt ?? 5, setter: (val) => updateExpertisePoint("awardsGovt", val) },
                      { label: "Awards (NGO / Trust / Others)", value: config.valueAddition?.expertisePoints?.awardsOthers ?? 3, setter: (val) => updateExpertisePoint("awardsOthers", val) },
                      { label: "Developed E-Content (Complete Course)", value: config.valueAddition?.expertisePoints?.developedEContent ?? 10, setter: (val) => updateExpertisePoint("developedEContent", val) },
                      { label: "Certification on New Age Tech (Min. 40 Hours)", value: config.valueAddition?.expertisePoints?.certificationNewAge ?? 5, setter: (val) => updateExpertisePoint("certificationNewAge", val) },
                      { label: "Student Shortlisted in Hackathon Finals", value: config.valueAddition?.expertisePoints?.hackathonShortlisted ?? 5, setter: (val) => updateExpertisePoint("hackathonShortlisted", val) },
                      { label: "Magazine/Newspaper Article Published", value: config.valueAddition?.expertisePoints?.newspaperArticle ?? 3, setter: (val) => updateExpertisePoint("newspaperArticle", val) },
                      { label: "Establishment/Maintenance of Research Facility", value: config.valueAddition?.expertisePoints?.researchFacility ?? 3, setter: (val) => updateExpertisePoint("researchFacility", val) },
                      { label: "NPTEL Course Completion (12 Weeks)", value: config.valueAddition?.expertisePoints?.nptel12W ?? 10, setter: (val) => updateExpertisePoint("nptel12W", val) },
                      { label: "NPTEL Course Completion (8 Weeks)", value: config.valueAddition?.expertisePoints?.nptel8W ?? 8, setter: (val) => updateExpertisePoint("nptel8W", val) },
                      { label: "NPTEL Course Completion (4 Weeks)", value: config.valueAddition?.expertisePoints?.nptel4W ?? 5, setter: (val) => updateExpertisePoint("nptel4W", val) },
                      { label: "Coursera Course Completion (Min. 40 Hours)", value: config.valueAddition?.expertisePoints?.coursera ?? 5, setter: (val) => updateExpertisePoint("coursera", val) },
                      { label: "FDP/Seminar Grant Sanctioned", value: config.valueAddition?.expertisePoints?.grantSanctioned ?? 5, setter: (val) => updateExpertisePoint("grantSanctioned", val) },
                      {
                        label: "MAX EXPERTISE CAPPED LIMIT",
                        value: config.valueAddition?.expertiseMaxPoints ?? 10,
                        setter: (val) => setConfig(prev => {
                          const updated = { ...prev };
                          if (!updated.valueAddition) updated.valueAddition = {};
                          updated.valueAddition.expertiseMaxPoints = Number(val);
                          return updated;
                        }),
                        isCap: true
                      }
                    ],
                    accentColor: "#8b5cf6",
                    accentBg: "rgba(139, 92, 246, 0.08)",
                    hoverBorderColor: "rgba(139, 92, 246, 0.2)"
                  })}
                </Box>
              </Box>
            </Box>
          )}

          {/* ========================================================
              TAB 4: ADMINISTRATIVE RESPONSIBILITIES
              ======================================================== */}
          {activeTab === 3 && (
            <Box sx={{ animation: "fadeIn 0.3s ease" }}>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 3 }}>
                <SupervisorAccount color="primary" />
                <Typography variant="subtitle1" fontWeight={700} color="var(--text-primary)">
                  4. Administrative Responsibilities Capped Points
                </Typography>
              </Box>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                <Box sx={{ flex: "1 1 100%" }}>
                  {renderAdminRolesCard()}
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </Card>

      {/* Info Banner Note */}
      <Box
        sx={{
          mt: 3,
          p: 2.2,
          borderRadius: "12px",
          background: "rgba(59, 130, 246, 0.05)",
          border: "1px solid rgba(59, 130, 246, 0.15)",
          display: "flex",
          alignItems: "center",
          gap: 2
        }}
      >
        <InfoOutlined sx={{ color: "var(--color-blue)", fontSize: "1.5rem" }} />
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.85rem", mb: 0.2 }}>
            Note
          </Typography>
          <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontSize: "0.78rem" }}>
            All point values can be customized as per institutional policy. Changes will apply to the selected academic year.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default AppraisalSettings;
