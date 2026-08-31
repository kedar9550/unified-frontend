import React from 'react';
import { Box } from '@mui/material';

/**
 * Reusable StatCardGrid component that automatically computes optimal responsive layout.
 * - Desktop (md/lg): max 4 cards per row. If the last row has < 4 cards, they expand evenly to fit the row!
 * - Tablet (sm): 2 cards per row (odd remaining card expands evenly).
 * - Mobile (xs): 1 column (100% full width).
 */
export default function StatCardGrid({ children, columns = 4, gap = 2.5, sx = {}, item, ...props }) {
  // Determine percentage basis & minWidth based on columns prop (default 4 max per row)
  const cols = Number(columns) || 4;

  const mobileBasis = cols === 1 ? '100%' : 'calc(50% - 6px)';
  const tabletBasis = cols === 1 ? '100%' : 'calc(50% - 12px)';

  let desktopBasis = 'calc(25% - 16px)';
  if (cols === 1) desktopBasis = '100%';
  else if (cols === 2) desktopBasis = 'calc(50% - 12px)';
  else if (cols === 3) desktopBasis = 'calc(33.333% - 14px)';
  else if (cols === 4) desktopBasis = 'calc(25% - 16px)';
  else if (cols === 5) desktopBasis = 'calc(20% - 16px)';

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: { xs: 1.5, sm: gap },
        mb: 3,
        width: '100%',
        boxSizing: 'border-box',
        '& > *': {
          flex: {
            xs: `1 1 ${mobileBasis}`,
            sm: `1 1 ${tabletBasis}`,
            md: `1 1 ${desktopBasis}`,
          },
          minWidth: {
            xs: mobileBasis,
            sm: tabletBasis,
            md: desktopBasis,
          },
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
