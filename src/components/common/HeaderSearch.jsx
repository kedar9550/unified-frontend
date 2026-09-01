import React, { useState, useEffect, useRef } from 'react';
import { Box, InputBase, Typography, Popover, List, ListItemButton, ListItemIcon, ListItemText, IconButton } from '@mui/material';
import { Search, ArrowForwardIos, Close } from '@mui/icons-material';
import { ROLE_ROUTES } from '../../config/rolesNav';
import { useNavigate } from 'react-router-dom';

const EASE_CURVE = "cubic-bezier(0.22, 1, 0.36, 1)";

const HeaderSearch = ({ activeRole, variant = "desktop", mobileOpen, onMobileOpen, onMobileClose, weatherExpanded = false }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isInputVisible, setIsInputVisible] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  const inputRef = useRef(null);
  const navigate = useNavigate();

  const isMobile = variant === "mobile";

  // Handle Ctrl+K shortcut on desktop
  useEffect(() => {
    if (isMobile) return;
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
  }, [isMobile]);

  // Immediate Focus & Input Visibility (Simultaneous Expansion & Keyboard Focus)
  useEffect(() => {
    if (!isMobile) return;

    if (mobileOpen) {
      setIsInputVisible(true);

      const triggerFocus = () => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      };

      triggerFocus();
      const rafId = requestAnimationFrame(triggerFocus);
      const timerId = setTimeout(triggerFocus, 40);

      return () => {
        cancelAnimationFrame(rafId);
        clearTimeout(timerId);
      };
    } else {
      setIsInputVisible(false);
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }
  }, [mobileOpen, isMobile]);

  // Cross-platform Virtual Viewport (iOS Safari & Android Chrome)
  useEffect(() => {
    if (!isMobile || !mobileOpen) {
      setKeyboardOffset(0);
      return;
    }

    const updateViewport = () => {
      if (!window.visualViewport) return;

      const vv = window.visualViewport;
      // On iOS Safari offsetTop can be > 0 during scroll/virtual keyboard view shift
      if (vv.offsetTop > 0) {
        setKeyboardOffset(vv.offsetTop);
      } else {
        setKeyboardOffset(0);
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
  }, [mobileOpen, isMobile]);

  // Page Scroll Lock when search overlay is active
  useEffect(() => {
    if (isMobile && mobileOpen) {
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
        if (!isScrollable && e.cancelable) {
          e.preventDefault();
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
  }, [mobileOpen, isMobile]);

  // Search filter logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const roleRoutes = ROLE_ROUTES[activeRole] || ROLE_ROUTES.STUDENT;

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
    if (!anchorEl && !isMobile) {
      setAnchorEl(e.currentTarget);
    }
  };

  const handleFocus = (e) => {
    if (query.trim() && !isMobile) {
      setAnchorEl(e.currentTarget);
    }
  };

  const handlePillClick = (e) => {
    if (!mobileOpen) {
      // Synchronous focus inside User Gesture (Mandatory for iOS Safari)
      if (inputRef.current) {
        try {
          inputRef.current.focus();
        } catch (err) {}
      }
      if (onMobileOpen) {
        onMobileOpen();
      }
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleCloseMobile = () => {
    setQuery('');
    if (inputRef.current) {
      inputRef.current.blur();
    }
    if (onMobileClose) {
      onMobileClose();
    }
  };

  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile) {
      handleCloseMobile();
    } else {
      handleClose();
      setQuery('');
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }
  };

  const open = Boolean(anchorEl) && query.trim().length > 0;

  if (isMobile) {
    const defaultClosedBottom = weatherExpanded
      ? 'calc(178px + env(safe-area-inset-bottom, 0px))'
      : 'calc(84px + env(safe-area-inset-bottom, 0px))';

    const containerBottom = mobileOpen
      ? (keyboardOffset > 0
          ? `calc(${keyboardOffset + 16}px + env(safe-area-inset-bottom, 0px))`
          : 'calc(16px + env(safe-area-inset-bottom, 0px))')
      : defaultClosedBottom;

    const resultsBottom = mobileOpen
      ? (keyboardOffset > 0
          ? `calc(${keyboardOffset + 72}px + env(safe-area-inset-bottom, 0px))`
          : 'calc(72px + env(safe-area-inset-bottom, 0px))')
      : 'calc(140px + env(safe-area-inset-bottom, 0px))';

    return (
      <>
        {/* Dark Backdrop Overlay */}
        <Box
          onClick={handleCloseMobile}
          sx={{
            display: { xs: 'block', md: 'none' },
            position: 'fixed',
            inset: 0,
            zIndex: 1390,
            background: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(4px)',
            opacity: mobileOpen ? 1 : 0,
            pointerEvents: mobileOpen ? 'auto' : 'none',
            transition: `opacity 400ms ${EASE_CURVE}`,
          }}
        />

        {/* Search Results Overlay Card */}
        {mobileOpen && query.trim().length > 0 && (
          <Box
            className="mobile-search-results-list"
            sx={{
              display: { xs: 'block', md: 'none' },
              position: 'fixed',
              bottom: resultsBottom,
              left: 16,
              right: 16,
              maxWidth: 540,
              mx: 'auto',
              maxHeight: 'calc(100dvh - 220px)',
              overflowY: 'auto',
              zIndex: 1405,
              borderRadius: '24px',
              p: 1.5,
              background: 'var(--bg-panel)',
              backdropFilter: 'blur(25px) saturate(180%)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.25)',
              opacity: mobileOpen ? 1 : 0,
              transform: mobileOpen ? 'translateY(0)' : 'translateY(12px)',
              transition: `opacity 350ms ${EASE_CURVE} 100ms, transform 350ms ${EASE_CURVE} 100ms, bottom 400ms ${EASE_CURVE}`,
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {results.length > 0 ? (
              <List sx={{ p: 0 }}>
                {results.map((item, idx) => (
                  <ListItemButton
                    key={idx}
                    onClick={() => handleNavigate(item.path)}
                    sx={{
                      borderRadius: '16px',
                      mb: 1,
                      p: 1.5,
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-glass)',
                      transition: 'all 0.2s ease',
                      '&:active': { transform: 'scale(0.98)' },
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
                        secondary: { sx: { fontSize: '0.75rem', color: 'var(--text-secondary)', mt: 0.25 } }
                      }}
                    />
                    <ArrowForwardIos sx={{ fontSize: 14, color: 'var(--text-secondary)' }} />
                  </ListItemButton>
                ))}
              </List>
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>
                  No results found for "{query}"
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Morphing Search Container (Pill <-> Input Bar) */}
        <Box
          onClick={handlePillClick}
          onTouchStart={(e) => {
            if (!mobileOpen && inputRef.current) {
              try {
                inputRef.current.focus();
              } catch (err) {}
            }
          }}
          sx={{
            position: 'fixed',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1400,
            bottom: containerBottom,
            width: mobileOpen ? 'calc(100vw - 32px)' : '84px',
            maxWidth: '540px',
            height: mobileOpen ? '46px' : '32px',
            borderRadius: mobileOpen ? '23px' : '16px',
            px: mobileOpen ? 1.75 : 1.5,
            background: mobileOpen ? 'var(--bg-panel)' : 'var(--bg-glass)',
            backdropFilter: 'blur(25px) saturate(180%)',
            boxShadow: mobileOpen
              ? '0 16px 40px rgba(0, 0, 0, 0.25)'
              : '0 8px 32px rgba(0, 0, 0, 0.15)',
            border: '1px solid var(--border-color)',
            display: { xs: 'flex', md: 'none' },
            alignItems: 'center',
            justifyContent: mobileOpen ? 'space-between' : 'center',
            transition: `width 450ms ${EASE_CURVE}, height 450ms ${EASE_CURVE}, border-radius 450ms ${EASE_CURVE}, bottom 450ms ${EASE_CURVE}, background-color 450ms ${EASE_CURVE}, box-shadow 450ms ${EASE_CURVE}`,
            boxSizing: 'border-box',
            cursor: mobileOpen ? 'text' : 'pointer',
            userSelect: 'none',
            WebkitTapHighlightColor: 'transparent',
            outline: 'none',
          }}
        >
          {/* Stable Search Icon */}
          <Search
            sx={{
              fontSize: mobileOpen ? 20 : 16,
              mr: mobileOpen ? 1 : 0.5,
              flexShrink: 0,
              color: 'var(--color-primary)',
              transition: `font-size 450ms ${EASE_CURVE}, margin-right 450ms ${EASE_CURVE}, color 450ms ${EASE_CURVE}`,
            }}
          />

          {/* Pill Label Text (Shown when closed) */}
          {!mobileOpen && (
            <Typography
              sx={{
                fontSize: '0.75rem',
                fontWeight: 600,
                background: 'var(--gradient-primary)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                whiteSpace: 'nowrap',
                opacity: mobileOpen ? 0 : 1,
                transition: 'opacity 200ms ease',
              }}
            >
              Search
            </Typography>
          )}

          {/* Input Base Element (Mounted in DOM for iOS gesture focus) */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              opacity: mobileOpen ? (isInputVisible ? 1 : 0) : 0,
              pointerEvents: mobileOpen ? 'auto' : 'none',
              transition: 'opacity 300ms ease 120ms',
              minWidth: 0,
              width: mobileOpen ? '100%' : '0px',
              overflow: 'hidden',
            }}
          >
            <InputBase
              inputRef={inputRef}
              type="search"
              autoComplete="off"
              placeholder="Search..."
              value={query}
              onChange={handleChange}
              inputProps={{ enterKeyHint: 'search' }}
              style={{ backgroundColor: 'transparent', width: '100%' }}
              sx={{
                color: 'var(--text-primary)',
                flex: 1,
                fontSize: '0.95rem',
                fontWeight: 500,
                "& .MuiInputBase-input::placeholder": {
                  color: 'var(--text-secondary)',
                  opacity: 0.8,
                },
              }}
            />
          </Box>
        </Box>
      </>
    );
  }

  // Desktop layout
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
