import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Paper,
    BottomNavigation,
    BottomNavigationAction,
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    IconButton,
    Divider,
    Card,
    Collapse
} from "@mui/material";
import {
    ArrowBack,
    ChevronRight,
    School,
    AutoStories,
    AccountTree,
    AssignmentInd,
    ManageAccounts,
    Analytics,
    Description,
    KeyboardArrowDown
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { ROLE_ROUTES } from "../../config/rolesNav";
import { useNavigate, useLocation } from "react-router-dom";

// Mapping for sub-item descriptions and icons
const SUB_ITEM_METADATA = {
    "Academic Management": {
        desc: "Manage academic programs, courses and curriculum",
        icon: <School />,
        color: "#EBF5FF",
        iconColor: "#1E40AF"
    },
    "Department Management": {
        desc: "Manage departments and their information",
        icon: <AccountTree />,
        color: "#F0FDF4",
        iconColor: "#166534"
    },
    "Student Data Management": {
        desc: "Update and manage student records and profiles",
        icon: <ManageAccounts />,
        color: "#FFF7ED",
        iconColor: "#9A3412"
    },
    "Assigned Students": {
        desc: "View and manage students assigned to your section",
        icon: <AssignmentInd />,
        color: "#F5F3FF",
        iconColor: "#5B21B6"
    },
    "FED to Dept Mapping": {
        desc: "Coordinate student transitions across departments",
        icon: <AccountTree />,
        color: "#FEF2F2",
        iconColor: "#991B1B"
    },
    "Text Book": { desc: "Record and manage textbook publications", icon: <AutoStories />, color: "#EBF5FF", iconColor: "#1E40AF" },
    "Book Chapter": { desc: "Manage book chapter contributions", icon: <AutoStories />, color: "#F0FDF4", iconColor: "#166534" },
    "Journal": { desc: "Track research journal submissions", icon: <Description />, color: "#FFF7ED", iconColor: "#9A3412" },
    "Patent": { desc: "Manage intellectual property and patents", icon: <Analytics />, color: "#F5F3FF", iconColor: "#5B21B6" },
    "Research": { desc: "Review and approve research submissions", icon: <Analytics />, color: "#EBF5FF", iconColor: "#1E40AF" }
};

const MobileNavbar = () => {
    const { user, activeRole } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [expandedItem, setExpandedItem] = useState(null);
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
                const current = data.current;
                const temp = Math.round(current.temperature_2m);
                const code = current.weather_code;
                const nowIdx = data.hourly.time.findIndex(t => new Date(t) > new Date()) || 0;
                const hourlyData = data.hourly.time.slice(nowIdx, nowIdx + 4).map((time, idx) => ({
                    time: new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    temp: Math.round(data.hourly.temperature_2m[nowIdx + idx]),
                    code: data.hourly.weather_code[nowIdx + idx]
                }));

                let iconUrl = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Sun.png";
                let desc = "Clear Sky";
                if (code >= 95) iconUrl = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Cloud%20with%20Lightning%20and%20Rain.png", desc = "Thunderstorm";
                else if (code >= 51) iconUrl = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Cloud%20with%20Rain.png", desc = code >= 61 ? "Rainy" : "Drizzle";
                else if (code >= 3) iconUrl = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Cloud.png", desc = "Overcast";
                else if (code >= 1) iconUrl = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Sun%20Behind%20Cloud.png", desc = "Partly Cloudy";

                setWeather({ temp: `${temp}°C`, icon: iconUrl, desc: desc, hourly: hourlyData });
            } catch (error) { console.error("Weather fetch error:", error); }
        };
        fetchWeather();
        const interval = setInterval(fetchWeather, 600000);
        return () => clearInterval(interval);
    }, [coords]);

    const effectiveRole = activeRole || (user?.roles && user.roles[0]?.role) || "STUDENT";
    const menuItems = ROLE_ROUTES[effectiveRole] || ROLE_ROUTES.STUDENT;

    const activeIndex = menuItems.findIndex(item => {
        if (item.path && location.pathname.startsWith(item.path)) return true;
        if (item.nested) {
            return item.nested.some(sub => sub.path && location.pathname.startsWith(sub.path));
        }
        return false;
    });

    const displayItems = menuItems;

    const handleNavClick = (event, newValue) => {
        const item = displayItems[newValue];
        if (item) {
            if (item.nested) {
                setExpandedItem(item);
            } else {
                navigate(item.path);
                setExpandedItem(null);
            }
        }
    };

    useEffect(() => {
        setExpandedItem(null);
    }, [location.pathname]);

    return (
        <>
            <Drawer
                anchor="bottom"
                open={Boolean(expandedItem)}
                onClose={() => setExpandedItem(null)}
                PaperProps={{
                    sx: {
                        borderRadius: '24px 24px 0 0',
                        background: 'var(--bg-main)', // Use main background to match screenshot feel
                        maxHeight: '85vh',
                        pb: 4,
                        overflow: 'hidden'
                    }
                }}
            >
                <Box sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* Sub-menu Header */}
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        p: 1.5,
                        borderBottom: '1px solid var(--border-color)',
                        background: 'var(--bg-panel)'
                    }}>
                        <IconButton
                            onClick={() => setExpandedItem(null)}
                            sx={{
                                color: 'var(--text-primary)',
                                mr: 1,
                                p: 0.8
                            }}
                        >
                            <ArrowBack sx={{ fontSize: 22 }} />
                        </IconButton>
                        <Typography sx={{
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            fontSize: '1.1rem'
                        }}>
                            {expandedItem?.text}
                        </Typography>
                    </Box>

                    <Box sx={{ px: 2, pt: 3, pb: 4, overflowY: 'auto', flex: 1 }}>
                        {expandedItem?.nested?.map((sub, idx) => {
                            const meta = SUB_ITEM_METADATA[sub.text] || {
                                desc: `Manage ${sub.text} related information`,
                                icon: expandedItem.icon,
                                color: "#F3F4F6",
                                iconColor: "#4B5563"
                            };
                            const isActive = location.pathname.startsWith(sub.path);

                            return (
                                <Card
                                    key={idx}
                                    elevation={0}
                                    onClick={() => {
                                        navigate(sub.path);
                                        setExpandedItem(null);
                                    }}
                                    sx={{
                                        borderRadius: '16px',
                                        mb: 1.5,
                                        border: '1px solid var(--border-color)',
                                        background: 'var(--bg-panel)',
                                        position: 'relative', // For absolute indicator
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        cursor: 'pointer',
                                        '&:active': { transform: 'scale(0.97)', background: 'var(--bg-accent-4)' },
                                        boxShadow: isActive ? 'var(--shadow-premium)' : '0 2px 12px rgba(0,0,0,0.03)',
                                        borderColor: isActive ? 'var(--color-primary)' : 'var(--border-color)',
                                        overflow: 'hidden'
                                    }}
                                >
                                    {/* Active Indicator Line like Sidebar */}
                                    {isActive && (
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

                                    <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center' }}>
                                        <Box sx={{
                                            width: 42,
                                            height: 42,
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: meta.color,
                                            color: meta.iconColor,
                                            mr: 2,
                                            flexShrink: 0
                                        }}>
                                            {React.cloneElement(meta.icon, { sx: { fontSize: 20 } })}
                                        </Box>

                                        <Box sx={{ flex: 1 }}>
                                            <Typography sx={{
                                                fontWeight: 700,
                                                color: 'var(--text-primary)',
                                                fontSize: '1rem',
                                            }}>
                                                {sub.text}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Card>
                            );
                        })}
                    </Box>
                </Box>
            </Drawer>

            <Paper
                sx={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1100,
                    display: { xs: 'block', md: 'none' },
                    background: 'var(--bg-nav-special)',
                    backdropFilter: 'blur(10px)',
                    borderTop: '1px solid var(--border-color)',
                    borderRadius: '12px 12px 0 0',
                    pb: 'env(safe-area-inset-bottom)',
                    boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
                    overflow: 'hidden'
                }}
                elevation={3}
            >
                <Box sx={{
                    height: 70,
                    display: 'flex',
                    alignItems: 'center',
                    background: 'transparent',
                    position: 'relative'
                }}>
                    {/* Scrollable Navigation Items */}
                    <Box sx={{
                        flex: 1,
                        display: 'flex',
                        overflowX: 'auto',
                        '&::-webkit-scrollbar': { display: 'none' },
                        msOverflowStyle: 'none',
                        scrollbarWidth: 'none',
                        height: '100%',
                        background: 'var(--bg-nav-special)'
                    }}>
                        <BottomNavigation
                            showLabels
                            value={activeIndex === -1 ? 0 : activeIndex}
                            onChange={handleNavClick}
                            sx={{
                                background: 'transparent',
                                display: 'flex',
                                height: '100%',
                                '& .MuiBottomNavigationAction-root': {
                                    minWidth: '85px',
                                    padding: '6px 0',
                                    color: 'var(--text-secondary)',
                                    transition: 'all 0.3s ease',
                                    position: 'relative',
                                    '&:not(:last-child)::after': {
                                        content: '""',
                                        position: 'absolute',
                                        right: 0,
                                        top: '25%',
                                        height: '50%',
                                        width: '1px',
                                        background: 'var(--border-color)',
                                        opacity: 0.5
                                    },
                                    '&.Mui-selected': {
                                        color: 'var(--color-primary)',
                                        '& .MuiBottomNavigationAction-label': {
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            mt: 0.5
                                        }
                                    }
                                }
                            }}
                        >
                            {displayItems.map((item, index) => (
                                <BottomNavigationAction
                                    key={index}
                                    label={item.text}
                                    icon={item.icon}
                                />
                            ))}
                        </BottomNavigation>
                    </Box>

                    {/* Fixed Weather Item */}
                    <Box sx={{
                        width: 80,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderLeft: '1px solid var(--border-color)',
                        background: 'var(--bg-nav-special)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:active': { background: 'var(--bg-accent-4)' }
                    }} onClick={() => setWeatherExpanded(!weatherExpanded)}>
                        <Box
                            component="img"
                            src={weather.icon}
                            sx={{ width: 24, height: 24, objectFit: 'contain', mb: 0.5 }}
                        />
                        <Typography sx={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)'
                        }}>
                            {weather.temp}
                        </Typography>
                    </Box>
                </Box>
            </Paper>
        </>
    );
};

export default MobileNavbar;