import React, { useState, useEffect, useRef } from 'react';
import { Box, InputBase, Typography, Popover, List, ListItemButton, ListItemIcon, ListItemText, Dialog, IconButton, Slide } from '@mui/material';
import { Search, ArrowForwardIos, ArrowBack } from '@mui/icons-material';
import { ROLE_ROUTES } from '../../config/rolesNav';
import { useNavigate } from 'react-router-dom';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const HeaderSearch = ({ activeRole, variant = "desktop", mobileOpen, onMobileClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Handle Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto focus when mobile dialog opens
  useEffect(() => {
    if (variant === 'mobile' && mobileOpen && inputRef.current) {
      // Focus immediately to ensure mobile keyboard opens
      inputRef.current.focus();
      
      // Fallback in case Dialog transition steals focus
      const timer = setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [mobileOpen, variant]);

  // Search logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const roleRoutes = ROLE_ROUTES[activeRole] || ROLE_ROUTES.STUDENT;

    // Flatten routes
    const allRoutes = [];
    roleRoutes.forEach(item => {
      if (item.path) allRoutes.push(item);
      if (item.nested) {
        item.nested.forEach(sub => {
          if (sub.path) allRoutes.push({ ...sub, parentText: item.text, icon: sub.icon || item.icon });
        });
      }
    });

    const lowerQuery = query.toLowerCase();
    const filtered = allRoutes.filter(route =>
      route.text.toLowerCase().includes(lowerQuery) ||
      (route.parentText && route.parentText.toLowerCase().includes(lowerQuery))
    );
    setResults(filtered);
  }, [query, activeRole]);

  const handleChange = (e) => {
    setQuery(e.target.value);
    if (!anchorEl && variant !== 'mobile') {
      setAnchorEl(e.currentTarget); // Anchor popover to the input box for desktop
    }
  };

  const handleFocus = (e) => {
    if (query.trim() && variant !== 'mobile') {
      setAnchorEl(e.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNavigate = (path) => {
    navigate(path);
    if (variant === 'mobile' && onMobileClose) {
      onMobileClose();
    } else {
      handleClose();
    }
    setQuery('');
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const open = Boolean(anchorEl) && query.trim().length > 0;
  
  const isMobile = variant === "mobile";

  if (isMobile) {
    return (
      <Dialog
        fullScreen
        open={Boolean(mobileOpen)}
        onClose={() => {
          setQuery('');
          if (onMobileClose) onMobileClose();
        }}
        TransitionComponent={Transition}
        transitionDuration={{ enter: 350, exit: 250 }}
        hideBackdrop
        PaperProps={{ 
          style: { 
            backgroundColor: 'transparent',
            backgroundImage: 'none',
            boxShadow: 'none',
          } 
        }}
        sx={{ zIndex: 1200 }}
      >
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100dvh',
          backgroundColor: 'var(--bg-glass)', // Fallback
          background: 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(25px) saturate(200%)',
          WebkitBackdropFilter: 'blur(25px) saturate(200%)',
          'body.dark-mode &': {
            background: 'var(--bg-main)', // Use solid background for dark mode to prevent weird transparency issues
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
          }
        }}>
          
          {/* Search Results Area (Top) */}
          <Box 
            onClick={() => {
              if (query.trim().length === 0 && onMobileClose) onMobileClose();
            }}
            sx={{ 
            flex: 1, 
            overflowY: 'auto', 
            p: 2, 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'flex-end' 
          }}>
            {query.trim().length > 0 ? (
              results.length > 0 ? (
                <List sx={{ p: 0 }}>
                  {results.map((item, idx) => (
                    <ListItemButton
                      key={idx}
                      onClick={() => handleNavigate(item.path)}
                      sx={{
                        borderRadius: '16px',
                        mb: 1,
                        p: 1.5,
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        '&:hover': { background: 'rgba(255, 255, 255, 0.1)' }
                      }}
                    >
                      {item.icon && (
                        <ListItemIcon sx={{ minWidth: 40, color: 'var(--color-primary)' }}>
                          {React.cloneElement(item.icon, { fontSize: 'small' })}
                        </ListItemIcon>
                      )}
                      <ListItemText
                        primary={item.text}
                        secondary={item.parentText}
                        slotProps={{
                          primary: { sx: { fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' } },
                          secondary: { sx: { fontSize: '0.8rem', color: 'var(--text-secondary)', mt: 0.5 } }
                        }}
                      />
                      <ArrowForwardIos sx={{ fontSize: 14, color: 'var(--text-secondary)' }} />
                    </ListItemButton>
                  ))}
                </List>
              ) : (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 600 }}>
                    No results found for "{query}"
                  </Typography>
                </Box>
              )
            ) : (
              <Box 
                sx={{ p: 4, textAlign: 'center', opacity: 0.6, cursor: 'pointer' }}
                onClick={() => {
                  setQuery('');
                  if (onMobileClose) onMobileClose();
                }}
              >
                <Search sx={{ fontSize: 48, color: 'var(--text-secondary)', mb: 2 }} />
                <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 600 }}>
                  Tap here to cancel
                </Typography>
              </Box>
            )}
          </Box>

          {/* Search Input Area (Bottom) */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            p: 1.5, 
            pb: 'calc(12px + env(safe-area-inset-bottom))',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)', 
            background: 'transparent',
            'body.dark-mode &': {
              borderTop: '1px solid var(--border-color)',
              background: 'var(--bg-panel)',
            },
            gap: 1
          }}>
            <Box sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              px: 2,
              py: 1,
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.05)',
              'body.dark-mode &': {
                background: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
              }
            }}>
              <Search sx={{ color: 'var(--text-secondary)', mr: 1, fontSize: 22 }} />
              <InputBase
                inputRef={inputRef}
                autoFocus={true}
                type="search"
                autoComplete="off"
                placeholder="Search"
                value={query}
                onChange={handleChange}
                style={{ backgroundColor: 'transparent' }}
                sx={{
                  color: 'var(--text-primary)',
                  flex: 1,
                  fontSize: '1rem',
                  "& .MuiInputBase-input::placeholder": {
                    color: 'var(--text-secondary)',
                    opacity: 1
                  }
                }}
              />
            </Box>
          </Box>
        </Box>
      </Dialog>
    );
  }

  return (
    <>
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          alignItems: "center",
          background: "rgba(255, 255, 255, 0.1)",
          borderRadius: "20px",
          px: 2,
          py: 0.5,
          width: "280px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          transition: "all 0.3s ease",
          "&:hover, &:focus-within": {
            background: "rgba(255, 255, 255, 0.15)",
            borderColor: "rgba(255, 255, 255, 0.2)",
          }
        }}
      >
        <Search sx={{ color: "rgba(255, 255, 255, 0.6)", mr: 1, fontSize: 20 }} />
        <InputBase
          inputRef={inputRef}
          type="search"
          autoComplete="off"
          placeholder="Search anything..."
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
          style={{ backgroundColor: 'transparent' }}
          sx={{
            color: "#fff",
            flex: 1,
            fontSize: "0.85rem",
            "body.dark-mode &&": {
              backgroundColor: "transparent !important",
            },
            "body.dark-mode && .MuiInputBase-input": {
              backgroundColor: "transparent !important",
            },
            "& .MuiInputBase-input::placeholder": {
              color: "rgba(255, 255, 255, 0.6)",
              opacity: 1
            }
          }}
        />
        <Typography sx={{
          fontSize: "0.7rem",
          color: "rgba(255, 255, 255, 0.6)",
          background: "rgba(255, 255, 255, 0.1)",
          px: 1,
          py: 0.2,
          borderRadius: "4px",
          fontWeight: 600
        }}>
          Ctrl + K
        </Typography>
      </Box>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        disableAutoFocus
        disableEnforceFocus
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              width: '280px',
              maxHeight: '350px',
              background: 'var(--bg-paper)',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              border: '1px solid var(--border-color)',
              overflow: 'auto',
            }
          }
        }}
      >
        {results.length > 0 ? (
          <List sx={{ p: 1 }}>
            {results.map((item, idx) => (
              <ListItemButton
                key={idx}
                onClick={() => handleNavigate(item.path)}
                sx={{
                  borderRadius: '8px',
                  mb: 0.5,
                  p: 1,
                  '&:hover': { background: 'var(--bg-panel)' }
                }}
              >
                {item.icon && (
                  <ListItemIcon sx={{ minWidth: 32, color: 'var(--color-primary)' }}>
                    {React.cloneElement(item.icon, { fontSize: 'small' })}
                  </ListItemIcon>
                )}
                <ListItemText
                  primary={item.text}
                  secondary={item.parentText}
                  slotProps={{
                    primary: { sx: { fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' } },
                    secondary: { sx: { fontSize: '0.7rem', color: 'var(--text-secondary)' } }
                  }}
                />
                <ArrowForwardIos sx={{ fontSize: 12, color: 'var(--text-secondary)' }} />
              </ListItemButton>
            ))}
          </List>
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              No results found for "{query}"
            </Typography>
          </Box>
        )}
      </Popover>
    </>
  );
};

export default HeaderSearch;
