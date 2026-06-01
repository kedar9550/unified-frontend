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
    KeyboardArrowDown,
    MonetizationOn,
    BusinessCenter,
    Campaign,
    Public,
    Assignment,
    Devices,
    AccountBalance,
    SupervisorAccount
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
    "Research": { desc: "Review and approve research submissions", icon: <Analytics />, color: "#EBF5FF", iconColor: "#1E40AF" },
    "Funded Project": { desc: "Track funded projects and grants", icon: <MonetizationOn />, color: "#FFFBEB", iconColor: "#B45309" },
    "Consultancy": { desc: "Manage consultancy and corporate work", icon: <BusinessCenter />, color: "#F0FDFA", iconColor: "#0F766E" },
    "Conference": { desc: "Record conference presentations", icon: <Campaign />, color: "#FDF2F8", iconColor: "#BE185D" },
    "Ph.D. Scholars": { desc: "Record and manage guided Ph.D. scholars appraisal history", icon: <School />, color: "#F5F3FF", iconColor: "#7c3aed" },
    "Novel Products / Tech": { desc: "Submit and manage novel products and technologies developed/implemented", icon: <Devices />, color: "#ECFDF5", iconColor: "#10b981" },
    "SDG's": { desc: "Track Sustainable Development Goals", icon: <Public />, color: "#ECFDF5", iconColor: "#047857" },
    "Faculty Format": { desc: "Download or view faculty-specific data formats", icon: <Assignment />, color: "rgba(124, 58, 237, 0.12)", iconColor: "#7c3aed" },
    "Students Format": { desc: "Download or view student-specific data formats", icon: <AssignmentInd />, color: "rgba(16, 185, 129, 0.12)", iconColor: "#10b981" },
    "Proctoring Verification": { desc: "Verify and approve proctoring data and allocations", icon: <SupervisorAccount />, color: "#F5F3FF", iconColor: "#7c3aed" },
    "Administration Verification": { desc: "Verify and approve administration duties and records", icon: <AccountBalance />, color: "#F5F3FF", iconColor: "#a855f7" }
};

const MobileNavbar = () => {
    const { user, activeRole } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [expandedItem, setExpandedItem] = useState(null);
    const [weather, setWeather] = useState({ temp: "--", icon: null, desc: "Loading...", hourly: [] });
    const [weatherExpanded, setWeatherExpanded] = useState(false);
    const [coords, setCoords] = useState({ lat: 17.089845, lon: 82.067751 }); // Default: Aditya University Coords
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
                const hourlyData = data.hourly.time.slice(nowIdx, nowIdx + 24).map((time, idx) => ({
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

    const getWeatherIcon = (code) => {
        if (code >= 95) return "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Cloud%20with%20Lightning%20and%20Rain.png";
        if (code >= 51) return "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Cloud%20with%20Rain.png";
        if (code >= 3) return "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Cloud.png";
        if (code >= 1) return "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Sun%20Behind%20Cloud.png";
        return "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Sun.png";
    };

    return (
        <>
            {/* Global SVG Definitions for Icons */}
            <svg width="0" height="0" style={{ position: 'absolute' }}>
                <defs>
                    <linearGradient id="mobile-nav-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: 'var(--gradient-start)' }} />
                        <stop offset="50%" style={{ stopColor: 'var(--gradient-mid)' }} />
                        <stop offset="100%" style={{ stopColor: 'var(--gradient-end)' }} />
                    </linearGradient>
                </defs>
            </svg>

            {/* Hourly Weather Callout - Paper Roll Animation */}
            <Box
                sx={{
                    position: 'fixed',
                    bottom: 85,
                    right: 15,
                    zIndex: 1090,
                    width: weatherExpanded ? 'calc(100% - 30px)' : '0px',
                    height: weatherExpanded ? 90 : 0,
                    visibility: weatherExpanded ? 'visible' : 'hidden',
                    opacity: weatherExpanded ? 1 : 0,
                    transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: 'var(--bg-glass)',
                    backdropFilter: 'blur(25px) saturate(180%)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    px: weatherExpanded ? 3 : 0,
                    border: weatherExpanded ? '1px solid rgba(255, 255, 255, 0.15)' : 'none',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
                    transformOrigin: 'right center',
                }}
            >
                {weather.hourly.slice(0, Math.max(4, Math.floor((windowWidth - 60) / 85))).map((h, i) => (
                    <Box key={i} sx={{
                        textAlign: 'center',
                        minWidth: 65,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: weatherExpanded ? 1 : 0,
                        transition: 'opacity 0.3s ease',
                        transitionDelay: weatherExpanded ? `${i * 0.1 + 0.3}s` : '0s'
                    }}>
                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                            {h.time.split(' ')[0]}
                        </Typography>
                        <Box
                            component="img"
                            src={getWeatherIcon(h.code)}
                            sx={{ width: 30, height: 30, objectFit: 'contain', my: 0.5 }}
                        />
                        <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {h.temp}°
                        </Typography>
                    </Box>
                ))}
            </Box>

            <Drawer
                anchor="bottom"
                open={Boolean(expandedItem)}
                onClose={() => setExpandedItem(null)}
                slotProps={{
                    paper: {
                        sx: {
                            borderRadius: '24px 24px 0 0',
                            background: 'var(--bg-main)', // Use main background to match screenshot feel
                            maxHeight: '85vh',
                            pb: 4,
                            overflow: 'hidden'
                        }
                    }
                }}
            >
                <Box sx={{ p: 0, display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}>
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
                        minWidth: 0,
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
                                width: 'max-content',
                                minWidth: '100%',
                                justifyContent: 'flex-start',
                                gap: '4px',
                                px: '6px',
                                '& .MuiBottomNavigationAction-root': {
                                    minWidth: '76px',
                                    flexShrink: 0,
                                    padding: '6px 10px',
                                    borderRadius: '12px',
                                    color: 'var(--text-secondary)',
                                    transition: 'all 0.25s ease',
                                    position: 'relative',
                                    '& .MuiBottomNavigationAction-label': {
                                        fontSize: '0.68rem',
                                        fontWeight: 600,
                                        whiteSpace: 'nowrap',
                                        overflow: 'visible',
                                        mt: 0.3,
                                    },
                                    '&.Mui-selected': {
                                        color: 'var(--color-primary)',
                                        background: 'transparent',
                                        '& .MuiBottomNavigationAction-label': {
                                            fontSize: '0.72rem',
                                            fontWeight: 800,
                                            mt: 0.3,
                                            background: 'var(--gradient-primary)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            whiteSpace: 'nowrap',
                                            overflow: 'visible',
                                        },
                                        '& .MuiSvgIcon-root': {
                                            fontSize: '1.5rem',
                                            transition: 'all 0.3s ease',
                                            fill: 'url(#mobile-nav-gradient)',
                                            filter: 'drop-shadow(0 0 2px var(--color-primary-alpha))'
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