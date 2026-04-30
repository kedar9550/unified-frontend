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
import { useNavigate, useLocation } from "react-router-dom";
import universityLogoGold from "../../assets/Aditya University Gold Logo.png";

const drawerWidth = 270;

const Sidebar = ({ mobileOpen, onDrawerToggle }) => {
  const { user, activeRole, logout } = useAuth();
  const [openStates, setOpenStates] = useState({});
  const [active, setActive] = useState("Dashboard");
  const navigate = useNavigate();
  const location = useLocation();
  const [weather, setWeather] = useState({ temp: "--", icon: null, desc: "Loading..." });

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
    setOpenStates((prev) => ({ ...prev, [text]: !prev[text] }));
  };

  const effectiveRole = activeRole || (user?.roles && user.roles[0]?.role) || "STUDENT";
  const menuItems = ROLE_ROUTES[effectiveRole] || ROLE_ROUTES.STUDENT;

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
        background: "#ffffff",
        color: "#1e293b",
        p: 2.5,
        position: "relative",
        overflow: "hidden",
        borderRight: "1px solid #e2e8f0",
      }}
    >
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

      {/* Sidebar Header with Brand */}
      <Box sx={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        mb: 4, 
        mt: 1,
      }}>
        <Box
          component="img"
          src={universityLogoGold}
          sx={{ height: 65, width: "auto", objectFit: "contain" }}
        />
      </Box>

      {/* Role Badge Section */}
      <Box sx={{ mb: 4, display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
        {(() => {
          const displayedRole = effectiveRole;
          const roleUpper = displayedRole.toUpperCase();
          const roleIcon = {
            FACULTY: <School sx={{ fontSize: "1.2rem" }} />,
            STUDENT: <Person sx={{ fontSize: "1.2rem" }} />,
            "EXAM SECTION": <Assignment sx={{ fontSize: "1.2rem" }} />,
            "DEPARTMENT HOD": <Groups sx={{ fontSize: "1.2rem" }} />,
            "UNIPRIME": <AdminPanelSettings sx={{ fontSize: "2rem" }} />,
            "RESEARCH FEEDBACK COMMITTEE": <Science sx={{ fontSize: "2rem" }} />,
          }[roleUpper] || <AccountCircle sx={{ fontSize: "2rem" }} />;

          return (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1.2,
                px: 2.5,
                py: 1,
                borderRadius: "999px",
                background: "#f1f5f9",
                border: "1px solid #e2e8f0",
                color: "#1e293b",
                width: "90%",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                mb: 1,
              }}
            >
              <Box sx={{ display: "flex", color: "#3b82f6" }}>{roleIcon}</Box>
              <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {displayedRole}
              </Typography>
            </Box>
          );
        })()}
      </Box>

      <Box sx={{ height: "1px", background: "#f1f5f9", mb: 2.5, mx: -2 }} />

      <List sx={{ px: 0, overflowY: "auto", flexGrow: 1, "&::-webkit-scrollbar": { width: 4 }, "&::-webkit-scrollbar-thumb": { background: "#e2e8f0", borderRadius: 10 } }}>
        {menuItems.map((item) => (
          <React.Fragment key={item.text}>
            {item.nested ? (
              <>
                <ListItemButton 
                  onClick={() => handleToggle(item.text)} 
                  disableRipple
                  sx={{ 
                    borderRadius: "10px", 
                    mb: 0.5, 
                    transition: "all 0.2s ease", 
                    overflow: "hidden",
                    background: active === item.text ? "#eff6ff" : "transparent", 
                    "&:hover": { 
                      background: "#f8fafc", 
                    } 
                  }}
                >
                  <ListItemIcon sx={{ color: active === item.text ? "#3b82f6" : "#64748b", minWidth: 40 }}>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography sx={{ fontSize: "0.875rem", fontWeight: active === item.text ? 600 : 500, color: active === item.text ? "#1e40af" : "#475569" }}>
                        {item.text}
                      </Typography>
                    }
                  />
                  {openStates[item.text] ? <ExpandLess sx={{ color: "#94a3b8", fontSize: 18 }} /> : <ExpandMore sx={{ color: "#94a3b8", fontSize: 18 }} />}
                </ListItemButton>
                <Collapse in={!!openStates[item.text]} timeout="auto" unmountOnExit sx={{ overflow: 'hidden' }}>
                  <List component="div" disablePadding>
                    {item.nested.map((subItem) => (
                      <Item
                        key={`${item.text}-${subItem.text}`}
                        nested
                        icon={subItem.icon || null}
                        text={subItem.text}
                        active={active}
                        onClick={() => navigateTo(subItem.path, subItem.text)}
                      />
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

      <Box sx={{ height: "1px", background: "#f1f5f9", my: 2, mx: -2 }} />

      {/* Weather Widget */}
      <Box
        sx={{
          mt: 2.5,
          p: 1.5,
          borderRadius: "16px",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          transition: "all 0.3s ease",
          cursor: "pointer",
          "&:hover": { background: "#f1f5f9" }
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            component="img"
            src={weather.icon}
            sx={{ width: 34, height: 34 }}
          />
          <Box>
            <Typography sx={{ fontSize: "0.95rem", fontWeight: 700, lineHeight: 1.1, color: "#1e293b" }}>
              {weather.temp}
            </Typography>
            <Typography sx={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 500, mt: 0.2, textTransform: "capitalize" }}>
              {weather.desc}
            </Typography>
          </Box>
        </Box>
        <KeyboardArrowDown sx={{ color: "#94a3b8", fontSize: 16 }} />
      </Box>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
            borderRight: "none",
            background: "#fff",
          },
        }}
      >
        {drawerContent}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
            borderRight: "none",
            background: "#fff",
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
    disableRipple
    sx={{
      pl: nested ? 4 : 2,
      position: "relative",
      borderRadius: "10px",
      mb: 0.5,
      transition: "all 0.2s ease",
      overflow: "hidden",
      background: active === text ? "#eff6ff" : "transparent",
      border: active === text ? "1px solid #dbeafe" : "1px solid transparent",
      "&:hover": {
        background: "#f8fafc",
      },
    }}
  >
    {active === text && (
      <Box
        sx={{
          position: "absolute",
          left: 0,
          top: "20%",
          height: "60%",
          width: 3,
          borderRadius: "0 3px 3px 0",
          background: "#3b82f6",
        }}
      />
    )}
    {icon && (
      <ListItemIcon sx={{ color: active === text ? "#3b82f6" : "#64748b", minWidth: 40 }}>
        {icon}
      </ListItemIcon>
    )}
    <ListItemText
      primary={
        <Typography sx={{ fontSize: "0.875rem", fontWeight: active === text ? 600 : 500, color: active === text ? "#1e40af" : "#475569" }}>
          {text}
        </Typography>
      }
    />
  </ListItemButton>
);

export default Sidebar;
