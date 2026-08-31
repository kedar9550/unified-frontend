import React, { useState, useEffect, useRef } from 'react';
import { Box, InputBase, Typography, Popover, List, ListItemButton, ListItemIcon, ListItemText, Dialog, IconButton, Slide } from '@mui/material';
import { Search, ArrowForwardIos, ArrowBack } from '@mui/icons-material';
import { ROLE_ROUTES } from '../../config/rolesNav';
import { useNavigate } from 'react-router-dom';

const Transition = React.forwardRef(function Transition({ TransitionComponent, PaperProps, TransitionProps, ...props }, ref) {
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

  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Auto focus when mobile dialog opens
  useEffect(() => {
    if (variant === 'mobile' && mobileOpen) {
      focusInput();

      const animationFrame = requestAnimationFrame(focusInput);
      const timer1 = setTimeout(focusInput, 50);
      const timer2 = setTimeout(focusInput, 150);
      const timer3 = setTimeout(focusInput, 350);
      const timer4 = setTimeout(focusInput, 400);

      return () => {
        cancelAnimationFrame(animationFrame);
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(timer4);
      };
    }
  }, [mobileOpen, variant]);

  const [viewportStyle, setViewportStyle] = useState({});
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Dynamic visualViewport logic for iOS Safari software keyboard
  useEffect(() => {
    if (variant !== 'mobile' || !mobileOpen) {
      setViewportStyle({});
      setIsKeyboardOpen(false);
      return;
    }

    const updateViewport = () => {
      if (!window.visualViewport) return;

      const vv = window.visualViewport;
      const windowHeight = window.innerHeight;
      const keyboardHeight = Math.max(0, windowHeight - vv.height - vv.offsetTop);

      if (keyboardHeight > 50) {
        setIsKeyboardOpen(true);
        setViewportStyle({
          height: `${vv.height}px`,
          transform: `translateY(${vv.offsetTop}px)`,
        });

        if (inputRef.current) {
          try {
            inputRef.current.scrollIntoView({ block: 'end', behavior: 'smooth' });
          } catch (err) {
            // fallback
          }
        }
      } else {
        setIsKeyboardOpen(false);
        setViewportStyle({
          height: '100dvh',
          transform: 'none',
        });
      }
    };

    const handleVisualViewportChange = () => {
      requestAnimationFrame(updateViewport);
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportChange);
      window.visualViewport.addEventListener('scroll', handleVisualViewportChange);
    }

    updateViewport();

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
        window.visualViewport.removeEventListener('scroll', handleVisualViewportChange);
      }
    };
  }, [mobileOpen, variant]);

  // Lock background page scroll when mobile search overlay is active (iOS Safari compatible)
  useEffect(() => {
    if (variant === 'mobile' && mobileOpen) {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const originalBodyPosition = document.body.style.position;
      const originalBodyTop = document.body.style.top;
      const originalBodyWidth = document.body.style.width;
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;

      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      const handleTouchMove = (e) => {
        const isScrollable = e.target.closest('.mobile-search-results-list');
        if (!isScrollable) {
          if (e.cancelable) {
            e.preventDefault();
          }
        }
      };

      document.addEventListener('touchmove', handleTouchMove, { passive: false });

      return () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.body.style.position = originalBodyPosition;
        document.body.style.top = originalBodyTop;
        document.body.style.width = originalBodyWidth;
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
        window.scrollTo(0, scrollY);
      };
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
        className="mobile-search-dialog"
        open={Boolean(mobileOpen)}
        onClose={() => {
          setQuery('');
          if (onMobileClose) onMobileClose();
        }}
        slots={{
          transition: Transition,
        }}
        slotProps={{
          paper: {
            style: { 
              backgroundColor: 'transparent',
              background: 'transparent',
              backgroundImage: 'none',
              boxShadow: 'none',
            } 
          },
          transition: {
            onEntering: focusInput,
            onEntered: focusInput,
          }
        }}
        disableAutoFocus
        hideBackdrop
        sx={{ 
          zIndex: 1400,
          '& .MuiDialog-paper': {
            backgroundColor: 'transparent !important',
            background: 'transparent !important',
            backgroundImage: 'none !important',
            boxShadow: 'none !important',
          },
          '& .MuiPaper-root': {
            backgroundColor: 'transparent !important',
            background: 'transparent !important',
            backgroundImage: 'none !important',
            boxShadow: 'none !important',
          }
        }}
      >
        <Box 
          className="mobile-search-overlay"
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100dvh',
            overscrollBehavior: 'contain',
            touchAction: 'manipulation',
            transition: 'height 0.15s ease-out, transform 0.15s ease-out',
            ...viewportStyle,
          }}
        >
          
          {/* Search Results Area (Top) */}
          <Box 
            className="mobile-search-results-list"
            onClick={() => {
              if (query.trim().length === 0 && onMobileClose) onMobileClose();
            }}
            sx={{ 
              flex: 1, 
              overflowY: 'auto', 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'flex-end',
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch',
            }}>
            {query.trim().length > 0 ? (
              results.length > 0 ? (
                <List sx={{ p: 0 }}>
                  {results.map((item, idx) => (
                    <ListItemButton
                      key={idx}
                      onClick={() => handleNavigate(item.path)}
                      sx={{
                        borderRadius: '20px',
                        mb: 1.5,
                        p: 2,
                        border: '1px solid rgba(255, 255, 255, 0.7)',
                        background: 'rgba(255, 255, 255, 0.75)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06)',
                        transition: 'all 0.2s ease-in-out',
                        '&:active': { transform: 'scale(0.98)' },
                        'body.dark-mode &': {
                          background: 'rgba(30, 41, 59, 0.75) !important',
                          border: '1px solid rgba(255, 255, 255, 0.15) !important',
                          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3) !important',
                        }
                      }}
                    >
                      {item.icon && (
                        <ListItemIcon sx={{ minWidth: 42, color: 'var(--color-primary)' }}>
                          {React.cloneElement(item.icon, { fontSize: 'small' })}
                        </ListItemIcon>
                      )}
                      <ListItemText
                        primary={item.text}
                        secondary={item.parentText}
                        slotProps={{
                          primary: { sx: { fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' } },
                          secondary: { sx: { fontSize: '0.825rem', color: 'var(--text-secondary)', mt: 0.5 } }
                        }}
                      />
                      <ArrowForwardIos sx={{ fontSize: 14, color: 'var(--text-secondary)' }} />
                    </ListItemButton>
                  ))}
                </List>
              ) : (
                <Box sx={{ 
                  p: 4, 
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.75)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '24px',
                  border: '1px solid rgba(255, 255, 255, 0.7)',
                  'body.dark-mode &': {
                    background: 'rgba(30, 41, 59, 0.75) !important',
                    borderColor: 'rgba(255, 255, 255, 0.15) !important',
                  }
                }}>
                  <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 600 }}>
                    No results found for "{query}"
                  </Typography>
                </Box>
              )
            ) : null}
          </Box>

          {/* Search Input Area (Bottom) */}
          <Box 
            onClick={focusInput}
            sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            p: 1.5, 
            pb: isKeyboardOpen ? '12px' : 'calc(12px + env(safe-area-inset-bottom))',
            background: 'transparent',
            gap: 1
          }}>
            <Box 
              onClick={focusInput}
              className="mobile-search-input-box"
              sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              borderRadius: '9999px',
              px: 2,
              py: 0.75,
              transition: 'all 0.3s ease',
            }}>
              <Search sx={{ color: 'var(--text-secondary)', mr: 1, fontSize: 20 }} />
              <InputBase
                inputRef={inputRef}
                autoFocus={true}
                type="search"
                autoComplete="off"
                placeholder="Search..."
                value={query}
                onChange={handleChange}
                onFocus={(e) => {
                  if (variant === 'mobile') {
                    setTimeout(() => {
                      if (window.visualViewport) {
                        const vv = window.visualViewport;
                        const windowHeight = window.innerHeight;
                        const kbHeight = Math.max(0, windowHeight - vv.height - vv.offsetTop);
                        if (kbHeight > 50) {
                          setIsKeyboardOpen(true);
                          setViewportStyle({
                            height: `${vv.height}px`,
                            transform: `translateY(${vv.offsetTop}px)`,
                          });
                        }
                      }
                      if (inputRef.current) {
                        try {
                          inputRef.current.scrollIntoView({ block: 'end', behavior: 'smooth' });
                        } catch (err) {}
                      }
                    }, 100);
                  }
                }}
                inputProps={{
                  enterKeyHint: 'search'
                }}
                style={{ backgroundColor: 'transparent' }}
                sx={{
                  color: 'var(--text-primary)',
                  flex: 1,
                  fontSize: '0.925rem',
                  fontWeight: 500,
                  "& .MuiInputBase-input::placeholder": {
                    color: 'var(--text-secondary)',
                    opacity: 0.8
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
