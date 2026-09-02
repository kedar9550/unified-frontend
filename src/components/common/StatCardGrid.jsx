import React from 'react';
import { Box } from '@mui/material';

/**
 * Reusable StatCardGrid component that automatically computes optimal responsive layout.
 * - Desktop (md/lg): max 4 cards per row. If the last row has < 4 cards, they expand evenly to fit the row!
 * - Tablet (sm): 2 cards per row (odd remaining card expands evenly).
 * - Mobile (xs): 1 column (100% full width).
 */
export default function StatCardGrid({ children, columns = 4, gap = 2, sx = {}, item, ...props }) {
  let gridCols;

  if (typeof columns === 'object' && columns !== null) {
    gridCols = {
      xs: columns.xs ? (typeof columns.xs === 'number' ? `repeat(${columns.xs}, 1fr)` : columns.xs) : '1fr',
      sm: columns.sm ? (typeof columns.sm === 'number' ? `repeat(${columns.sm}, 1fr)` : columns.sm) : undefined,
      md: columns.md ? (typeof columns.md === 'number' ? `repeat(${columns.md}, 1fr)` : columns.md) : undefined,
      lg: columns.lg ? (typeof columns.lg === 'number' ? `repeat(${columns.lg}, 1fr)` : columns.lg) : undefined,
      xl: columns.xl ? (typeof columns.xl === 'number' ? `repeat(${columns.xl}, 1fr)` : columns.xl) : undefined,
    };
  } else {
    const cols = Number(columns) || 4;
    if (cols === 1) {
      gridCols = { xs: '1fr' };
    } else if (cols === 2) {
      gridCols = { xs: '1fr', sm: 'repeat(2, 1fr)' };
    } else if (cols === 3) {
      gridCols = { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' };
    } else if (cols === 4) {
      gridCols = { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' };
    } else if (cols === 5) {
      gridCols = { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' };
    } else {
      gridCols = { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', xl: `repeat(${cols}, 1fr)` };
    }
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: gridCols,
        gap: { xs: 1.5, sm: 2, md: typeof gap === 'number' ? gap : 2.5 },
        mb: 3,
        width: '100%',
        boxSizing: 'border-box',
        '& > *': {
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
