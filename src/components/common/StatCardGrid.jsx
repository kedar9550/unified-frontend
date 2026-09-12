import React from 'react';
import { Box, useTheme } from '@mui/material';

/**
 * Reusable StatCardGrid component that automatically computes optimal responsive layout.
 * - Desktop (md/lg): max 4 cards per row. If the last row has < 4 cards, they expand evenly to fit the row!
 * - Tablet (sm): 2 cards per row (odd remaining card expands evenly).
 * - Mobile (xs): 1 column (100% full width).
 */
export default function StatCardGrid({ children, columns = 4, gap = 2.5, sx = {}, item, ...props }) {
  const theme = useTheme();
  
  // Calculate the gap in pixels to properly compute flex-basis
  const gapPx = typeof gap === 'number' ? theme.spacing(gap) : gap;

  // Helper to calculate flex-basis
  const getBasis = (cols) => {
    if (!cols) return undefined;
    if (cols === 1) return '100%';
    return `calc(${100 / cols}% - ${gapPx})`;
  };

  let breakpointsConfig = {};

  if (typeof columns === 'object' && columns !== null) {
    breakpointsConfig = {
      xs: getBasis(columns.xs) || '100%',
      sm: getBasis(columns.sm),
      md: getBasis(columns.md),
      lg: getBasis(columns.lg),
      xl: getBasis(columns.xl),
    };
  } else {
    const cols = Number(columns) || 4;
    if (cols === 1) {
      breakpointsConfig = { xs: '100%' };
    } else if (cols === 2) {
      breakpointsConfig = { xs: '100%', sm: getBasis(2) };
    } else if (cols === 3) {
      breakpointsConfig = { xs: '100%', sm: getBasis(2), md: getBasis(3) };
    } else if (cols === 4) {
      breakpointsConfig = { xs: '100%', sm: getBasis(2), md: getBasis(2), lg: getBasis(4) };
    } else if (cols === 5) {
      breakpointsConfig = { xs: '100%', sm: getBasis(2), md: getBasis(3), lg: getBasis(5) };
    } else {
      breakpointsConfig = { xs: '100%', sm: getBasis(2), md: getBasis(3), xl: getBasis(cols) };
    }
  }

  // Convert breakpoint config into explicit media queries for the nested selector
  const flexBasisStyles = { flexBasis: breakpointsConfig.xs };
  
  if (breakpointsConfig.sm) flexBasisStyles[theme.breakpoints.up('sm')] = { flexBasis: breakpointsConfig.sm };
  if (breakpointsConfig.md) flexBasisStyles[theme.breakpoints.up('md')] = { flexBasis: breakpointsConfig.md };
  if (breakpointsConfig.lg) flexBasisStyles[theme.breakpoints.up('lg')] = { flexBasis: breakpointsConfig.lg };
  if (breakpointsConfig.xl) flexBasisStyles[theme.breakpoints.up('xl')] = { flexBasis: breakpointsConfig.xl };

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: { xs: 1.5, sm: 2, md: gap },
        mb: 3,
        width: '100%',
        boxSizing: 'border-box',
        '& > *': {
          flexGrow: 1,
          flexShrink: 0,
          ...flexBasisStyles,
          minWidth: 0, // Prevents overflow blowout from large numbers/text
          maxWidth: '100%',
          boxSizing: 'border-box',
        },
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
}
