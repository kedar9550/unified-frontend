import React, { useState, useEffect } from "react";
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
  Drawer,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  ExpandLess,
  ExpandMore,
  Logout,
  School,
  Person as PersonIcon,
  AdminPanelSettings,
  Assignment,
  Groups,
  Science,
  AccountCircle,
  KeyboardArrowDown,
  Dashboard,
  People,
  Verified,
  Flag,
  MenuBook,
  AccountBalance,
  Assessment,
  WorkspacePremium,
  SupervisorAccount,
  ChevronLeft,
  ChevronRight
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { ROLE_ROUTES } from "../../config/rolesNav";
import { useNavigate, useLocation } from "react-router-dom";
import universityLogoGold from "../../assets/Aditya University Gold Logo.png";
import universityShortLogoGold from "../../assets/Logo_Dark_theme.svg"
import {
  AutoStories,
  AccountTree,
  AssignmentInd,
  Analytics,
  Description as DescriptionIcon,
  ManageAccounts,
  MonetizationOn,
  BusinessCenter,
  Campaign,
  Public,
  Devices,
  Build,
  Link,
  QrCode,
  SupportAgent,
  ConfirmationNumber,
  ListAlt,
  Group as GroupIcon,
  AssignmentTurnedIn,
  LibraryBooks
} from "@mui/icons-material";

const capitalizeRole = (role) => {
  if (!role) return "";
  return role.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

// Mapping for item metadata (Icons & Colors with theme-aware RGBA)
const ITEM_METADATA = {
  "Dashboard": { color: "rgba(30, 64, 175, 0.12)", iconColor: "#3b82f6", icon: <Dashboard /> },
  "Academics": { color: "rgba(22, 101, 52, 0.12)", iconColor: "#22c55e", icon: <School /> },
  "Academic Management": { color: "rgba(30, 64, 175, 0.12)", iconColor: "#3b82f6", icon: <School /> },
  "Department Management": { color: "rgba(22, 101, 52, 0.12)", iconColor: "#22c55e", icon: <AccountTree /> },
  "Users & Roles": { color: "rgba(154, 52, 18, 0.12)", iconColor: "#f97316", icon: <People /> },
  "Students": { color: "rgba(91, 33, 182, 0.12)", iconColor: "#a855f7", icon: <PersonIcon /> },
  "Student Data Management": { color: "rgba(154, 52, 18, 0.12)", iconColor: "#f97316", icon: <ManageAccounts /> },
  "Assigned Students": { color: "rgba(91, 33, 182, 0.12)", iconColor: "#a855f7", icon: <AssignmentInd /> },
  "FED to Dept Mapping": { color: "rgba(153, 27, 27, 0.12)", iconColor: "#ef4444", icon: <AccountTree /> },
  "Research": { color: "rgba(30, 64, 175, 0.12)", iconColor: "#3b82f6", icon: <Analytics /> },
  "Text Book": { color: "rgba(30, 64, 175, 0.12)", iconColor: "#3b82f6", icon: <AutoStories /> },
  "Book Chapter": { color: "rgba(22, 101, 52, 0.12)", iconColor: "#22c55e", icon: <AutoStories /> },
  "Journal": { color: "rgba(154, 52, 18, 0.12)", iconColor: "#f97316", icon: <DescriptionIcon /> },
  "Patent": { color: "rgba(91, 33, 182, 0.12)", iconColor: "#a855f7", icon: <Analytics /> },
  "Funded Project": { color: "rgba(180, 83, 9, 0.12)", iconColor: "#B45309", icon: <MonetizationOn /> },
  "Consultancy": { color: "rgba(15, 118, 110, 0.12)", iconColor: "#0F766E", icon: <BusinessCenter /> },
  "Conference": { color: "rgba(190, 24, 93, 0.12)", iconColor: "#BE185D", icon: <Campaign /> },
  "Ph.D. Scholars": { color: "rgba(124, 58, 237, 0.12)", iconColor: "#7c3aed", icon: <School /> },
  "Novel Products / Tech": { color: "rgba(16, 185, 129, 0.12)", iconColor: "#10b981", icon: <Devices /> },
  "SDG's": { color: "rgba(4, 120, 87, 0.12)", iconColor: "#047857", icon: <Public /> },
  "Approvals": { color: "rgba(22, 101, 52, 0.12)", iconColor: "#22c55e", icon: <Verified /> },
  "Proctordata": { color: "rgba(154, 52, 18, 0.12)", iconColor: "#f97316", icon: <People /> },
  "Discrepancies": { color: "rgba(153, 27, 27, 0.12)", iconColor: "#ef4444", icon: <Flag /> },
  "Results Upload": { color: "rgba(79, 70, 229, 0.12)", iconColor: "#4f46e5", icon: <MenuBook /> },
  "Faculty Format": { color: "rgba(124, 58, 237, 0.12)", iconColor: "#7c3aed", icon: <Assignment /> },
  "Students Format": { color: "rgba(16, 185, 129, 0.12)", iconColor: "#10b981", icon: <AssignmentInd /> },
  "Administration": { color: "rgba(91, 33, 182, 0.12)", iconColor: "#a855f7", icon: <AccountBalance /> },
  "Interpersonal": { color: "rgba(22, 101, 52, 0.12)", iconColor: "#22c55e", icon: <Groups /> },
  "Feedback Reports": { color: "rgba(30, 64, 175, 0.12)", iconColor: "#3b82f6", icon: <Analytics /> },
  "Feedback Management": { color: "rgba(22, 101, 52, 0.12)", iconColor: "#22c55e", icon: <MenuBook /> },
  "SDG Management": { color: "rgba(4, 120, 87, 0.12)", iconColor: "#047857", icon: <Public /> },
  "Reports": { color: "rgba(154, 52, 18, 0.12)", iconColor: "#f97316", icon: <Assessment /> },
  "Resource Utilization": { color: "rgba(15, 118, 110, 0.12)", iconColor: "#0f766e", icon: <Assignment /> },
  "Contribution": { color: "rgba(180, 83, 9, 0.12)", iconColor: "#b45309", icon: <WorkspacePremium /> },
  "Proctoring Verification": { color: "rgba(124, 58, 237, 0.12)", iconColor: "#7c3aed", icon: <SupervisorAccount /> },
  "Administration Verification": { color: "rgba(91, 33, 182, 0.12)", iconColor: "#a855f7", icon: <AccountBalance /> },
  "Event Coordination": { color: "rgba(236, 72, 153, 0.12)", iconColor: "#ec4899", icon: <Groups /> },
  "Self Appraisal": { color: "rgba(154, 52, 18, 0.12)", iconColor: "#f97316", icon: <DescriptionIcon /> },
  "Appraisal Settings": { color: "rgba(91, 33, 182, 0.12)", iconColor: "#a855f7", icon: <ManageAccounts /> },
  "Proctoring Upload": { color: "rgba(79, 70, 229, 0.12)", iconColor: "#4f46e5", icon: <Assignment /> },
  "Appraisal Verification": { color: "rgba(22, 101, 52, 0.12)", iconColor: "#22c55e", icon: <DescriptionIcon /> },
  "Appraisal Finalization": { color: "rgba(30, 64, 175, 0.12)", iconColor: "#3b82f6", icon: <DescriptionIcon /> },
  "Value addition": { color: "rgba(234, 179, 8, 0.12)", iconColor: "#eab308", icon: <AccountBalance /> },
  "Utilities": { color: "rgba(100, 116, 139, 0.12)", iconColor: "#64748b", icon: <Build /> },
  "Shorten URL": { color: "rgba(14, 165, 233, 0.12)", iconColor: "#0ea5e9", icon: <Link /> },
  "Generate QR Code": { color: "rgba(168, 85, 247, 0.12)", iconColor: "#a855f7", icon: <QrCode /> },
  "Manage Shorten URL": { color: "rgba(14, 165, 233, 0.12)", iconColor: "#0ea5e9", icon: <Link /> },
  "Manage QR Code": { color: "rgba(168, 85, 247, 0.12)", iconColor: "#a855f7", icon: <QrCode /> },
  "Service Desk": { color: "rgba(236, 72, 153, 0.12)", iconColor: "#ec4899", icon: <SupportAgent /> },
  "Raise Ticket": { color: "rgba(244, 63, 94, 0.12)", iconColor: "#f43f5e", icon: <ConfirmationNumber /> },
  "My Tickets": { color: "rgba(16, 185, 129, 0.12)", iconColor: "#10b981", icon: <ListAlt /> },
  "Manage Services": { color: "rgba(245, 158, 11, 0.12)", iconColor: "#f59e0b", icon: <AccountTree /> },
  "Manage Tickets": { color: "rgba(99, 102, 241, 0.12)", iconColor: "#6366f1", icon: <AssignmentTurnedIn /> },
  "Service Team": { color: "rgba(20, 184, 166, 0.12)", iconColor: "#14b8a6", icon: <GroupIcon /> },
  "Feedback Analytics": { color: "rgba(217, 70, 239, 0.12)", iconColor: "#d946ef", icon: <Analytics /> },
  "Assigned to Me": { color: "rgba(59, 130, 246, 0.12)", iconColor: "#3b82f6", icon: <AssignmentInd /> },
  "Author Citations": { color: "rgba(239, 68, 68, 0.12)", iconColor: "#ef4444", icon: <Assignment /> },
  "Reference Journals": { color: "rgba(34, 197, 94, 0.12)", iconColor: "#22c55e", icon: <LibraryBooks /> }
};

const drawerWidth = 270;

const Sidebar = ({ mobileOpen, onDrawerToggle, isCollapsed, onToggleSidebar }) => {
  const { user, activeRole, logout } = useAuth();
  const [openStates, setOpenStates] = useState({});
  const [active, setActive] = useState("Dashboard");
  const [submenuAnchor, setSubmenuAnchor] = useState(null);
  const [activeSubmenuItem, setActiveSubmenuItem] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [weather, setWeather] = useState({ temp: "--", icon: null, desc: "Loading...", hourly: [] });
  const [weatherExpanded, setWeatherExpanded] = useState(false);
  const [coords, setCoords] = useState({ lat: 17.089845, lon: 82.067751 }); // Default: Aditya University Coords

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        (err) => console.log("Location access denied, using default.")
      );
    }
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,weather_code&hourly=temperature_2m,weather_code&timezone=auto`);
        const data = await res.json();

        // Current Weather
        const current = data.current;
        const temp = Math.round(current.temperature_2m);
        const code = current.weather_code;

        // Hourly Weather (next 4 samples)
        const nowIdx = data.hourly.time.findIndex(t => new Date(t) > new Date()) || 0;
        const hourlyData = data.hourly.time.slice(nowIdx, nowIdx + 4).map((time, idx) => ({
          time: new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          temp: Math.round(data.hourly.temperature_2m[nowIdx + idx]),
          code: data.hourly.weather_code[nowIdx + idx]
        }));

        let iconUrl = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Sun.png";
        let desc = "Clear Sky";

        if (code >= 95) {
          iconUrl = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Cloud%20with%20Lightning%20and%20Rain.png";
          desc = "Thunderstorm";
        } else if (code >= 51) {
          iconUrl = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Cloud%20with%20Rain.png";
          desc = code >= 61 ? "Rainy" : "Drizzle";
        } else if (code >= 3) {
          iconUrl = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Cloud.png";
          desc = "Overcast";
        } else if (code >= 1) {
          iconUrl = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Sun%20Behind%20Cloud.png";
          desc = "Partly Cloudy";
        }

        setWeather({ temp: `${temp}°C`, icon: iconUrl, desc: desc, hourly: hourlyData });
      } catch (error) {
        console.error("Weather fetch error:", error);
      }
    };
    fetchWeather();
    const interval = setInterval(fetchWeather, 600000);
    return () => clearInterval(interval);
  }, [coords]);

  React.useEffect(() => {
    // Persistent Sub-menu: On refresh, keep the active category expanded
    const effectiveRole = activeRole || (user?.roles && user.roles[0]?.role) || "STUDENT";
    const items = ROLE_ROUTES[effectiveRole] || ROLE_ROUTES.STUDENT;

    let initialOpenStates = {};
    items.forEach((item) => {
      if (item.nested) {
        const isSubActive = item.nested.some(sub =>
          sub.path && location.pathname.startsWith(sub.path)
        );
        if (isSubActive) {
          initialOpenStates[item.text] = true;
        }
      }
    });
    setOpenStates(initialOpenStates);
  }, []); // Run only on mount

  React.useEffect(() => {
    let currentText = "Dashboard";
    const effectiveRole = activeRole || (user?.roles && user.roles[0]?.role) || "STUDENT";
    const items = ROLE_ROUTES[effectiveRole] || ROLE_ROUTES.STUDENT;
    items.forEach((item) => {
      if (item.path && location.pathname.startsWith(item.path))
        currentText = item.text;
      if (item.nested) {
        item.nested.forEach((sub) => {
          if (sub.path && location.pathname.startsWith(sub.path))
            currentText = sub.text;
        });
      }
    });
    setActive(currentText);
  }, [location.pathname, activeRole, user]);

  const handleToggle = (text) => {
    setOpenStates((prev) => ({ [text]: !prev[text] }));
  };

  const effectiveRole = activeRole || (user?.roles && user.roles[0]?.role) || "STUDENT";
  const menuItems = ROLE_ROUTES[effectiveRole] || ROLE_ROUTES.STUDENT;

  const navigateTo = (path, text, isNested = false) => {
    setActive(text);
    if (!isNested) {
      setOpenStates({});
    }
    navigate(path);
    if (mobileOpen) onDrawerToggle();
  };

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-paper)",
        color: "var(--text-primary)",
        p: isCollapsed ? 1 : 2.5,
        position: "relative",
        overflow: "visible",
        borderRight: "1px solid var(--border-color)",
        transition: "padding 0.3s ease",
      }}
    >
      {/* Floating Arrow Toggle Button for Desktop */}
      <IconButton
        onClick={onToggleSidebar}
        sx={{
          display: { xs: "none", md: "flex" },
          position: "absolute",
          right: "-14px", // Sits exactly on the sidebar border line
          top: "33px", // Centered vertically relative to the brand logo
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          background: "var(--bg-paper)",
          border: "1px solid var(--border-color)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          zIndex: 1210,
          color: "var(--text-secondary)",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          "&:hover": {
            background: "var(--bg-panel)",
            color: "var(--color-primary)",
            borderColor: "var(--color-primary)",
            boxShadow: "0 2px 12px var(--color-primary-alpha)",
          },
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {isCollapsed ? <ChevronRight sx={{ fontSize: 18 }} /> : <ChevronLeft sx={{ fontSize: 18 }} />}
      </IconButton>
      <IconButton
        onClick={onDrawerToggle}
        sx={{
          display: { xs: "flex", md: "none" },
          position: "absolute",
          top: 8,
          right: 8,
          color: "#64748b",
          background: "#f1f5f9",
          "&:hover": { background: "#e2e8f0" },
          zIndex: 10,
          padding: "6px",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </IconButton>

      {/* Sidebar Header spacing (removed logo since it's in main header) */}
      <Box sx={{
        mb: 2,
        mt: 1,
        transition: "all 0.3s ease",
      }} />

      {/* Role Badge Section */}
      <Box sx={{ mb: 4, display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
        {(() => {
          const displayedRole = effectiveRole;
          const roleUpper = displayedRole.toUpperCase();
          const roleIcon = {
            FACULTY: <School sx={{ fontSize: "1.2rem" }} />,
            STUDENT: <PersonIcon sx={{ fontSize: "1.2rem" }} />,
            "EXAM SECTION": <Assignment sx={{ fontSize: "1.2rem" }} />,
            "DEPARTMENT HOD": <Groups sx={{ fontSize: "1.2rem" }} />,
            "UNIPRIME": <AdminPanelSettings sx={{ fontSize: "2rem" }} />,
            "RESEARCH FEEDBACK COMMITTEE": <Science sx={{ fontSize: "2rem" }} />,
            "RESEARCH_DEAN": <Science sx={{ fontSize: "2rem" }} />,
            "RESEARCH_COORDINATOR": <Science sx={{ fontSize: "2rem" }} />,
          }[roleUpper] || <AccountCircle sx={{ fontSize: "2rem" }} />;

          return (
            <Tooltip title={capitalizeRole(displayedRole)} disableHoverListener={!isCollapsed} placement="right" arrow>
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: isCollapsed ? 0 : 1.2,
                  px: isCollapsed ? 1 : 2.5,
                  py: isCollapsed ? 1 : 1,
                  borderRadius: "999px",
                  background: "var(--bg-panel)",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-primary)",
                  width: isCollapsed ? "44px" : "90%",
                  height: isCollapsed ? "44px" : "auto",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  mb: 1,
                  transition: "all 0.3s ease",
                }}
              >
                <Box sx={{ display: "flex", color: "var(--color-primary)" }}>{roleIcon}</Box>
                {!isCollapsed && (
                  <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {capitalizeRole(displayedRole)}
                  </Typography>
                )}
              </Box>
            </Tooltip>
          );
        })()}
      </Box>

      <Box sx={{ height: "1px", background: "var(--border-color)", mb: 2.5, mx: -2 }} />

      <List
        className="sidebar-scrollbar"
        sx={{
          px: 0,
          overflowY: "auto",
          flexGrow: 1
        }}
      >
        {menuItems.map((item) => (
          <React.Fragment key={item.text}>
            {item.nested ? (
              <Box sx={{ width: '100%' }}>
                {(() => {
                  const isParentActive = item.nested.some(sub => active === sub.text);
                  const parentButton = (
                    <ListItemButton
                      onClick={(e) => {
                        if (isCollapsed) {
                          setSubmenuAnchor(e.currentTarget);
                          setActiveSubmenuItem(item);
                        } else {
                          handleToggle(item.text);
                        }
                      }}
                      disableRipple
                      sx={{
                        flexDirection: isCollapsed ? "column" : "row",
                        borderRadius: isCollapsed ? "16px" : "12px",
                        mb: isCollapsed ? 1.5 : 0.8,
                        mx: "auto",
                        width: isCollapsed ? "100%" : "auto",
                        aspectRatio: isCollapsed ? "1/1" : "auto",
                        height: "auto",
                        p: isCollapsed ? 1 : 1.2,
                        justifyContent: "center",
                        position: 'relative',
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        overflow: "hidden",
                        background: (active === item.text || isParentActive) ? "var(--bg-accent-4)" : "transparent",
                        border: (active === item.text || isParentActive) ? "1px solid var(--border-color)" : "1px solid transparent",
                        "&:hover": {
                          background: "var(--bg-panel)",
                        }
                      }}
                    >
                      {!isCollapsed && (active === item.text || isParentActive) && (
                        <Box
                          sx={{
                            position: "absolute",
                            left: 0,
                            top: "25%",
                            height: "50%",
                            width: 4,
                            borderRadius: "0 4px 4px 0",
                            background: "var(--color-primary)",
                            boxShadow: '0 0 8px var(--color-primary-alpha)'
                          }}
                        />
                      )}
                      <ListItemIcon sx={{ minWidth: 0, mb: isCollapsed ? 0.5 : 0, mr: isCollapsed ? 0 : 2, justifyContent: 'center' }}>
                        <Box sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: ITEM_METADATA[item.text]?.color || 'var(--bg-accent-4)',
                          color: ITEM_METADATA[item.text]?.iconColor || 'var(--color-primary)',
                          transition: 'all 0.3s ease',
                          opacity: (active === item.text || isParentActive) ? 1 : 0.8
                        }}>
                          {React.cloneElement(item.icon, { sx: { fontSize: 18 } })}
                        </Box>
                      </ListItemIcon>
                      {!isCollapsed ? (
                        <>
                          <ListItemText
                            primary={
                              <Typography sx={{
                                fontSize: "0.875rem",
                                fontWeight: (active === item.text || isParentActive) ? 700 : 500,
                                color: (active === item.text || isParentActive) ? "var(--color-primary)" : "var(--text-secondary)"
                              }}>
                                {item.text}
                              </Typography>
                            }
                          />
                          {openStates[item.text] ? <ExpandLess sx={{ color: "var(--color-primary)", fontSize: 18 }} /> : <ExpandMore sx={{ color: "#94a3b8", fontSize: 18 }} />}
                        </>
                      ) : (
                        <ListItemText
                          sx={{ m: 0, width: "100%", overflow: "hidden" }}
                          primary={
                            <Typography sx={{
                              fontSize: "0.6rem",
                              fontWeight: (active === item.text || isParentActive) ? 700 : 500,
                              color: (active === item.text || isParentActive) ? "var(--color-primary)" : "var(--text-secondary)",
                              textAlign: "center",
                              lineHeight: 1.1,
                              whiteSpace: "nowrap",
                              textOverflow: "ellipsis",
                              overflow: "hidden"
                            }}>
                              {item.text}
                            </Typography>
                          }
                        />
                      )}
                    </ListItemButton>
                  );

                  return parentButton;
                })()}
                {!isCollapsed && (
                  <Collapse
                    in={!!openStates[item.text]}
                    timeout="auto"
                    unmountOnExit
                    sx={{ overflow: 'hidden' }}
                    onEntered={(node) => {
                      node.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }}
                  >
                    <List component="div" disablePadding>
                      {item.nested.map((subItem) => (
                        <Item
                          key={`${item.text}-${subItem.text}`}
                          nested
                          icon={subItem.icon || ITEM_METADATA[subItem.text]?.icon || null}
                          text={subItem.text}
                          active={active}
                          isCollapsed={isCollapsed}
                          onClick={() => navigateTo(subItem.path, subItem.text, true)}
                        />
                      ))}
                    </List>
                  </Collapse>
                )}
              </Box>
            ) : (
              <Item icon={item.icon} text={item.text} active={active} isCollapsed={isCollapsed} onClick={() => navigateTo(item.path, item.text)} />
            )}
          </React.Fragment>
        ))}
      </List>

      <Box sx={{ height: "1px", background: "var(--border-color)", my: 2, mx: -2 }} />

      {/* Weather Widget */}
      <Box
        onClick={() => !isCollapsed && setWeatherExpanded(!weatherExpanded)}
        sx={{
          mt: 2.5,
          p: isCollapsed ? 1 : 1.5,
          borderRadius: "16px",
          background: "var(--bg-panel)",
          border: "1px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1.5,
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          cursor: isCollapsed ? "default" : "pointer",
          "&:hover": {
            background: isCollapsed ? "var(--bg-panel)" : "linear-gradient(var(--bg-panel), var(--bg-panel)) padding-box, var(--gradient-primary) border-box",
            borderColor: isCollapsed ? "var(--border-color)" : "transparent",
            boxShadow: isCollapsed ? "none" : "var(--shadow-premium)"
          }
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: isCollapsed ? "center" : "space-between", width: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: isCollapsed ? 0 : 1.5 }}>
            <Box
              component="img"
              src={weather.icon}
              onError={(e) => { e.target.src = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Sun.png"; }}
              sx={{ width: 34, height: 34, objectFit: 'contain' }}
            />
            {!isCollapsed && (
              <Box>
                <Typography sx={{ fontSize: "0.95rem", fontWeight: 700, lineHeight: 1.1, color: "var(--text-primary)" }}>
                  {weather.temp}
                </Typography>
                <Typography sx={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontWeight: 500, mt: 0.2, textTransform: "capitalize" }}>
                  {weather.desc}
                </Typography>
              </Box>
            )}
          </Box>
          {!isCollapsed && (
            <KeyboardArrowDown sx={{
              color: "#94a3b8",
              fontSize: 16,
              transition: "transform 0.4s ease",
              transform: weatherExpanded ? "rotate(180deg)" : "rotate(0deg)"
            }} />
          )}
        </Box>

        {!isCollapsed && (
          <Collapse in={weatherExpanded} timeout="auto" unmountOnExit>
            <Box sx={{
              pt: 1.5,
              borderTop: "1px solid var(--border-color)",
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 1,
              textAlign: "center"
            }}>
              {weather.hourly?.map((h, i) => (
                <Box key={i}>
                  <Typography sx={{ fontSize: "0.6rem", color: "var(--text-secondary)", fontWeight: 600 }}>{h.time}</Typography>
                  <Typography sx={{ fontSize: "0.75rem", color: "var(--text-primary)", fontWeight: 700, mt: 0.2 }}>{h.temp}°</Typography>
                </Box>
              ))}
            </Box>
          </Collapse>
        )}
      </Box>

      {/* Floating submenu popup for collapsed state */}
      <Menu
        anchorEl={submenuAnchor}
        open={Boolean(submenuAnchor)}
        onClose={() => { setSubmenuAnchor(null); setActiveSubmenuItem(null); }}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        disableScrollLock={true}
        slotProps={{
          paper: {
            sx: {
              ml: 1,
              minWidth: 200,
              borderRadius: "16px",
              border: "1px solid var(--border-color)",
              background: "var(--bg-paper)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
              p: 0.5
            }
          }
        }}
      >
        <Box sx={{ px: 2, py: 1, borderBottom: "1px solid var(--border-color)", mb: 0.5 }}>
          <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {activeSubmenuItem?.text}
          </Typography>
        </Box>
        {activeSubmenuItem?.nested?.map((subItem) => {
          const isActive = active === subItem.text;
          return (
            <MenuItem
              key={subItem.text}
              onClick={() => {
                navigateTo(subItem.path, subItem.text, true);
                setSubmenuAnchor(null);
                setActiveSubmenuItem(null);
              }}
              selected={isActive}
              sx={{
                borderRadius: "10px",
                fontSize: "0.85rem",
                fontWeight: isActive ? 700 : 500,
                color: isActive ? "var(--color-primary)" : "var(--text-secondary)",
                background: isActive ? "var(--bg-accent-4) !important" : "transparent",
                py: 1,
                px: 2,
                mb: 0.5,
                "&:hover": {
                  background: "var(--bg-panel)",
                },
                "&:last-child": { mb: 0 }
              }}
            >
              {subItem.text}
            </MenuItem>
          );
        })}
      </Menu>
    </Box>
  );

  const sidebarWidth = isCollapsed ? 85 : 270;

  return (
    <Box component="nav" sx={{ width: { md: sidebarWidth }, flexShrink: { md: 0 }, display: { xs: "none", md: "block" }, transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)", overflow: "visible" }}>
      <Drawer
        variant="permanent"
        sx={{
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: sidebarWidth,
            borderRight: "none",
            background: "var(--bg-paper)",
            overflow: "visible",
            transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            top: { xs: "70px", md: "88px" },
            height: { xs: "calc(100% - 70px)", md: "calc(100% - 88px)" }
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

const Item = ({ icon, text, active, onClick, nested, isCollapsed }) => {
  return (
    <ListItemButton
      onClick={onClick}
      disableRipple
      sx={{
        pl: isCollapsed ? 0 : (nested ? 5 : 1.2),
        justifyContent: "center",
        flexDirection: isCollapsed ? "column" : "row",
        position: "relative",
        borderRadius: isCollapsed ? "16px" : "12px",
        mb: isCollapsed ? 1.5 : 0.8,
        mx: "auto",
        width: isCollapsed ? "100%" : "auto",
        aspectRatio: isCollapsed ? "1/1" : "auto",
        height: "auto",
        p: isCollapsed ? 1 : undefined,
        py: isCollapsed ? undefined : 0.8,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "hidden",
        background: active === text ? "var(--bg-accent-4)" : "transparent",
        border: active === text ? "1px solid var(--border-color)" : "1px solid transparent",
        "&:hover": {
          background: "var(--bg-panel)",
        },
      }}
    >
      {!isCollapsed && active === text && (
        <Box
          sx={{
            position: "absolute",
            left: 0,
            top: "25%",
            height: "50%",
            width: 4,
            borderRadius: "0 4px 4px 0",
            background: "var(--color-primary)",
            boxShadow: '0 0 8px var(--color-primary-alpha)'
          }}
        />
      )}
      {icon && (
        <ListItemIcon sx={{ minWidth: 0, mb: isCollapsed ? 0.5 : 0, mr: isCollapsed ? 0 : 2, justifyContent: 'center' }}>
          <Box sx={{
            width: 32,
            height: 32,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: ITEM_METADATA[text]?.color || 'rgba(148, 163, 184, 0.1)',
            color: ITEM_METADATA[text]?.iconColor || 'var(--text-secondary)',
            transition: 'all 0.3s ease'
          }}>
            {React.cloneElement(icon, { sx: { fontSize: 18 } })}
          </Box>
        </ListItemIcon>
      )}
      
      <ListItemText
        sx={{ m: 0, width: "100%", overflow: "hidden" }}
        primary={
          <Typography sx={{
            fontSize: isCollapsed ? "0.6rem" : "0.875rem",
            fontWeight: active === text ? 700 : 500,
            color: active === text ? "var(--color-primary)" : "var(--text-secondary)",
            transition: 'all 0.2s ease',
            textAlign: isCollapsed ? "center" : "left",
            lineHeight: isCollapsed ? 1.1 : 1,
            whiteSpace: isCollapsed ? "nowrap" : "normal",
            textOverflow: isCollapsed ? "ellipsis" : "clip",
            overflow: isCollapsed ? "hidden" : "visible"
          }}>
            {text}
          </Typography>
        }
      />
    </ListItemButton>
  );
};

export default Sidebar;
