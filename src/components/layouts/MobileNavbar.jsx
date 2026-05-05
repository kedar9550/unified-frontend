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
  Card
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
  Description
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
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    '&:active': { transform: 'scale(0.97)', background: 'var(--bg-accent-4)' },
                    boxShadow: isActive ? 'var(--shadow-premium)' : '0 2px 12px rgba(0,0,0,0.03)',
                    borderColor: isActive ? 'var(--color-primary)' : 'var(--border-color)'
                  }}
                >
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
          background: 'var(--bg-panel)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid var(--border-color)',
          borderRadius: '20px 20px 0 0',
          pb: 'env(safe-area-inset-bottom)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }} 
        elevation={3}
      >
        <BottomNavigation
          showLabels
          value={activeIndex === -1 ? 0 : activeIndex}
          onChange={handleNavClick}
          sx={{
            height: 70,
            background: 'transparent',
            display: 'flex',
            overflowX: 'auto',
            justifyContent: displayItems.length > 5 ? 'flex-start' : 'space-around',
            '&::-webkit-scrollbar': { display: 'none' },
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
            '& .MuiBottomNavigationAction-root': {
              minWidth: displayItems.length > 5 ? '80px' : 'auto',
              flex: displayItems.length > 5 ? '0 0 auto' : 1,
              padding: '6px 0',
              color: 'var(--text-secondary)',
              transition: 'all 0.3s ease',
              '&.Mui-selected': {
                color: 'var(--color-primary)',
                '& .MuiTypography-root': {
                  fontWeight: 700,
                  fontSize: '0.75rem',
                },
                '& svg': {
                  transform: 'translateY(-2px) scale(1.1)',
                  filter: 'drop-shadow(0 0 8px var(--color-primary-alpha))'
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  width: '30px',
                  height: '4px',
                  background: 'var(--gradient-primary)',
                  borderRadius: '0 0 4px 4px'
                }
              }
            }
          }}
        >
          {displayItems.map((item, index) => (
            <BottomNavigationAction
              key={item.text}
              label={
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 500, mt: 0.5 }}>
                  {item.text}
                </Typography>
              }
              icon={item.icon}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </>
  );
};

export default MobileNavbar;