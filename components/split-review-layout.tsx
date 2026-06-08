'use client';

import Box from '@mui/material/Box';
import { forwardRef } from 'react';

export const SplitReviewLayout = forwardRef<
  HTMLDivElement,
  {
    left: React.ReactNode;
    right: React.ReactNode;
  }
>(function SplitReviewLayout({ left, right }, ref) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
        gap: 3,
        height: { xs: 'auto', lg: '100%' },
        minHeight: { xs: 480, lg: 0 },
        overflow: { lg: 'hidden' },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          height: { lg: '100%' },
          minHeight: { lg: 0 },
          position: { lg: 'sticky' },
          top: { lg: 0 },
          alignSelf: { lg: 'start' },
          overflow: { lg: 'hidden' },
        }}
      >
        {left}
      </Box>
      <Box
        ref={ref}
        className="review-panel-scroll"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          height: { lg: '100%' },
          minHeight: { lg: 0 },
          overflowY: { lg: 'auto' },
          pr: { lg: 0.5 },
          scrollbarColor: { lg: '#000 transparent' },
          '&::-webkit-scrollbar': {
            width: 8,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#000',
            borderRadius: 4,
          },
        }}
      >
        {right}
      </Box>
    </Box>
  );
});
