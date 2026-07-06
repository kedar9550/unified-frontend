import React, { useState, useEffect, useRef } from 'react';
import { Box, InputBase, Typography, Popover, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { Search, ArrowForwardIos } from '@mui/icons-material';
import { ROLE_ROUTES } from '../../config/rolesNav';
import { useNavigate } from 'react-router-dom';

const HeaderSearch = ({ activeRole }) => {
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
    if (!anchorEl) {
      setAnchorEl(e.currentTarget); // Anchor popover to the input box
    }
  };

  const handleFocus = (e) => {
    if (query.trim()) {
      setAnchorEl(e.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNavigate = (path) => {
    navigate(path);
    handleClose();
    setQuery('');
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const open = Boolean(anchorEl) && query.trim().length > 0;

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
          placeholder="Search anything..."
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
          sx={{
            color: "#fff",
            flex: 1,
            fontSize: "0.85rem",
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
