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
} from "@mui/material";
import {
  ExpandLess,
  ExpandMore,
  Logout,
  ChevronLeft,
  School,
  Person,
  AdminPanelSettings,
  Assignment,
  Groups,
  Science,
  AccountCircle,
  KeyboardArrowDown
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { ROLE_ROUTES } from "../../config/rolesNav";
import { getHighestRole } from "../../config/rolePriority";
import { useNavigate, useLocation } from "react-router-dom";
import universityLogo from "../../assets/Small_logo_white.png";

const drawerWidth = 270;

const Sidebar = ({ mobileOpen, onDrawerToggle }) => {
  const { user, logout } = useAuth();
  const [openStates, setOpenStates] = useState({});
  const [active, setActive] = useState("Dashboard");
  const navigate = useNavigate();
  const location = useLocation();
  const [weather, setWeather] = useState({ temp: "--", icon: null, desc: "Loading..." });

  // Fetch real-time weather for Surampalem (Aditya University)
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch("https://wttr.in/Surampalem?format=j1");
        const data = await res.json();
        const current = data.current_condition[0];
        const temp = current.temp_C;
        const code = current.weatherCode;

        let iconUrl = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Sun.png";
        if (code >= 300) iconUrl = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Cloud%20with%20Rain.png";
        else if (code >= 200) iconUrl = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Cloud%20with%20Lightning%20and%20Rain.png";
        else if (code >= 116) iconUrl = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Sun%20behind%20cloud.png";

        setWeather({ temp: `${temp}°C`, icon: iconUrl, desc: current.weatherDesc[0].value || "Mostly Sunny" });
      } catch (error) {
        console.error("Weather fetch error:", error);
      }
    };
    fetchWeather();
    const interval = setInterval(fetchWeather, 600000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    let currentText = "Dashboard";
    const roles = user?.roles?.map((r) => r.role) || ["STUDENT"];
    roles.forEach((roleName) => {
      const items = ROLE_ROUTES[roleName] || ROLE_ROUTES.STUDENT;
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
    });
    setActive(currentText);
  }, [location.pathname, user]);

  const handleToggle = (text) => {
    setOpenStates((prev) => ({ ...prev, [text]: !prev[text] }));
  };

  const userRoles = user?.roles?.map((r) => r.role) || ["STUDENT"];
  const mergedMenuItems = [];
  const seenTexts = new Set();
  userRoles.forEach((roleName) => {
    const itemsForRole = ROLE_ROUTES[roleName] || ROLE_ROUTES.STUDENT;
    itemsForRole.forEach((item) => {
      if (!seenTexts.has(item.text)) {
        seenTexts.add(item.text);
        mergedMenuItems.push(item);
      }
    });
  });

  const menuItems = mergedMenuItems.length > 0 ? mergedMenuItems : ROLE_ROUTES.STUDENT;

  const navigateTo = (path, text) => {
    setActive(text);
    navigate(path);
    if (mobileOpen) onDrawerToggle();
  };

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "rgba(60, 80, 160, 0.35)",
        backdropFilter: "blur(4px) saturate(180%)",
        WebkitBackdropFilter: "blur(8px) saturate(180%)",
        color: "#fff",
        p: 2.5,
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
        },
      }}
    >
      {/* Mobile Close Button */}
      <IconButton
        onClick={onDrawerToggle}
        sx={{
          display: { xs: "flex", md: "none" },
          position: "absolute",
          top: 8,
          right: 8,
          color: "rgba(255,255,255,0.8)",
          background: "rgba(255,255,255,0.1)",
          backdropFilter: "blur(4px)",
          "&:hover": { background: "rgba(255,255,255,0.2)" },
          zIndex: 10,
          padding: "6px", // Further reduced padding for corner fit
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </IconButton>

      {/* Sidebar Header with Brand */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 4, mt: 1 }}>
        <Box
          component="img"
          src={universityLogo}
          sx={{ height: 75, width: "auto", objectFit: "contain" }}
        />
      </Box>

      {/* Role Badge Section */}
      <Box sx={{ mb: 4, display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
        {(() => {
          const highestRole = getHighestRole(userRoles);
          const roleUpper = highestRole.toUpperCase();
          const roleIcon = {
            FACULTY: <School sx={{ fontSize: "1.2rem" }} />,
            STUDENT: <Person sx={{ fontSize: "1.2rem" }} />,
            "EXAM SECTION": <Assignment sx={{ fontSize: "1.2rem" }} />,
            "DEPARTMENT HOD": <Groups sx={{ fontSize: "1.2rem" }} />,
            "UNIPRIME": <AdminPanelSettings sx={{ fontSize: "2.2rem" }} />,
            "RESEARCH FEEDBACK COMMITTEE": <Science sx={{ fontSize: "2.2rem" }} />,
          }[roleUpper] || <AccountCircle sx={{ fontSize: "2.2rem" }} />;

          return (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1.5,
                px: 3,
                py: 1.2,
                borderRadius: "999px", /* True pill shape */
                background: "rgba(255, 255, 255, 0.55)",
                backdropFilter: "blur(40px) saturate(180%)",
                WebkitBackdropFilter: "blur(40px) saturate(180%)",
                border: "1px solid rgba(255, 255, 255, 0.8)",
                color: "#1a2a6c", /* Match header text color */
                width: "90%",
                boxShadow: "0 12px 40px rgba(0, 0, 0, 0.18), 0 4px 12px rgba(111, 140, 255, 0.15)",
                mb: 1,
              }}
            >
              <Box sx={{ display: "flex", color: "#1a2a6c", opacity: 0.8 }}>{roleIcon}</Box>
              <Typography sx={{ fontSize: "0.95rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>
                {highestRole}
              </Typography>
            </Box>
          );
        })()}
      </Box>

      <Box sx={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)", mb: 2.5, mx: -2 }} />

      <List sx={{ px: 0, overflowY: "auto", flexGrow: 1, "&::-webkit-scrollbar": { width: 4 }, "&::-webkit-scrollbar-thumb": { background: "rgba(255,255,255,0.1)", borderRadius: 10 } }}>
        {menuItems.map((item) => (
          <React.Fragment key={item.text}>
            {item.nested ? (
              <>
                <ListItemButton onClick={() => handleToggle(item.text)} sx={{ borderRadius: "10px", mb: 0.5, transition: "all 0.25s ease", background: active === item.text ? "rgba(255,255,255,0.12)" : "transparent", "&:hover": { background: "rgba(255,255,255,0.1)", transform: "translateX(4px)" } }}>
                  <ListItemIcon sx={{ color: active === item.text ? "#fff" : "rgba(180,210,255,0.7)", minWidth: 40 }}>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography sx={{ fontSize: "0.875rem", fontWeight: active === item.text ? 600 : 400, color: active === item.text ? "#fff" : "rgba(220,235,255,0.85)" }}>
                        {item.text}
                      </Typography>
                    }
                  />
                  {openStates[item.text] ? <ExpandLess sx={{ color: "rgba(180,210,255,0.7)", fontSize: 18 }} /> : <ExpandMore sx={{ color: "rgba(180,210,255,0.7)", fontSize: 18 }} />}
                </ListItemButton>
                <Collapse in={openStates[item.text]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.nested.map((subItem) => (
                      <Item key={subItem.text} nested icon={subItem.icon || null} text={subItem.text} active={active} onClick={() => navigateTo(subItem.path, subItem.text)} />
                    ))}
                  </List>
                </Collapse>
              </>
            ) : (
              <Item icon={item.icon} text={item.text} active={active} onClick={() => navigateTo(item.path, item.text)} />
            )}
          </React.Fragment>
        ))}
      </List>

      <Box sx={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)", my: 2, mx: -2 }} />

      <ListItemButton
        onClick={logout}
        sx={{
          borderRadius: "10px",
          transition: "all 0.25s ease",
          background: "rgba(255,80,80,0.08)",
          border: "1px solid rgba(255,100,100,0.15)",
          mb: 0.5,
          mt: "auto",
          height: "46px", // Force standard height
          minHeight: "46px", // Force standard min-height
          flexGrow: 0,
          flexShrink: 0,
          "&:hover": {
            background: "rgba(255,80,80,0.15)",
            transform: "translateX(4px)",
            borderColor: "rgba(255,100,100,0.3)"
          }
        }}
      >
        <ListItemIcon sx={{ color: "#ff7070", minWidth: 40 }}><Logout fontSize="small" /></ListItemIcon>
        <ListItemText
          primary={
            <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "#ff9090" }}>
              Logout
            </Typography>
          }
        />
      </ListItemButton>

      {/* Weather Widget at Bottom */}
      <Box
        sx={{
          mt: 2.5,
          p: 1.5,
          borderRadius: "16px",
          background: "rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          transition: "all 0.3s ease",
          cursor: "pointer",
          "&:hover": { background: "rgba(255, 255, 255, 0.12)" }
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            component="img"
            src={weather.icon}
            sx={{ width: 38, height: 38, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.2))" }}
          />
          <Box>
            <Typography sx={{ fontSize: "1rem", fontWeight: 700, lineHeight: 1.1, color: "#fff" }}>
              {weather.temp}
            </Typography>
            <Typography sx={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.6)", fontWeight: 500, mt: 0.2, textTransform: "capitalize" }}>
              {weather.desc}
            </Typography>
          </Box>
        </Box>
        <KeyboardArrowDown sx={{ color: "rgba(255,255,255,0.4)", fontSize: 18 }} />
      </Box>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onDrawerToggle}
        ModalProps={{ keepMounted: true }} /* Better open performance on mobile */
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
            borderRight: "none",
            background: "none",
            boxShadow: "none",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
            borderRight: "1px solid rgba(255,255,255,0.12)",
            background: "none",
            boxShadow: "none",
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

const Item = ({ icon, text, active, onClick, nested }) => (
  <ListItemButton
    onClick={onClick}
    sx={{
      pl: nested ? 4 : 2,
      position: "relative",
      borderRadius: "10px",
      mb: 0.5,
      transition: "all 0.25s ease",

      background:
        active === text
          ? "rgba(255,255,255,0.13)"
          : "transparent",

      border: "1px solid rgba(255,255,255,0.08)",

      boxShadow: active === text
        ? "inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.2)"
        : "none",

      "&:hover": {
        background: "rgba(255,255,255,0.08)",
        transform: "translateX(4px)",
        border: "1px solid rgba(255,255,255,0.12)",
      },
    }}
  >
    {active === text && (
      <Box
        sx={{
          position: "absolute",
          left: 0,
          top: "18%",
          height: "64%",
          width: 3,
          borderRadius: "0 3px 3px 0",
          background: "linear-gradient(180deg, #60a5fa, #3b82f6)",
          boxShadow: "0 0 8px rgba(96,165,250,0.7)",
        }}
      />
    )}

    {icon && (
      <ListItemIcon
        sx={{
          color: active === text ? "#fff" : "rgba(180,210,255,0.7)",
          minWidth: 40,
          transition: "color 0.25s",
        }}
      >
        {icon}
      </ListItemIcon>
    )}
    <ListItemText
      primary={
        <Typography
          sx={{
            fontSize: "0.875rem",
            fontWeight: active === text ? 600 : 400,
            color: active === text ? "#fff" : "rgba(220,235,255,0.85)",
            letterSpacing: "0.2px",
          }}
        >
          {text}
        </Typography>
      }
    />
  </ListItemButton>
);

export default Sidebar;
