import { Box, Typography } from '@mui/material'
import { motion } from 'framer-motion'
import type { Choice } from '@/entities/scenario/model/types'

interface ChoiceButtonProps {
  choice: Choice
  state: 'idle' | 'selected-correct' | 'selected-wrong' | 'unselected' | 'locked'
  onClick: () => void
}

const stateStyles = {
  idle: {
    bg: '#ffffff',
    border: '2px solid rgba(0,0,0,0.07)',
    color: '#1a1a2e',
    shadow: '0 2px 16px rgba(0,0,0,0.07)',
    hoverShadow: '0 6px 24px rgba(0,0,0,0.12)',
  },
  'selected-correct': {
    bg: '#d1fae5',
    border: '2px solid #10b981',
    color: '#065f46',
    shadow: '0 0 0 4px rgba(16,185,129,0.18)',
    hoverShadow: '0 0 0 4px rgba(16,185,129,0.18)',
  },
  'selected-wrong': {
    bg: '#fee2e2',
    border: '2px solid #ef4444',
    color: '#7f1d1d',
    shadow: '0 0 0 4px rgba(239,68,68,0.18)',
    hoverShadow: '0 0 0 4px rgba(239,68,68,0.18)',
  },
  unselected: {
    bg: 'rgba(255,255,255,0.45)',
    border: '2px solid rgba(0,0,0,0.04)',
    color: '#9ca3af',
    shadow: 'none',
    hoverShadow: 'none',
  },
  locked: {
    bg: 'rgba(255,255,255,0.35)',
    border: '2px solid rgba(0,0,0,0.04)',
    color: '#9ca3af',
    shadow: 'none',
    hoverShadow: 'none',
  },
}

export function ChoiceButton({ choice, state, onClick }: ChoiceButtonProps) {
  const s = stateStyles[state]
  const isClickable = state === 'idle'

  return (
    <motion.div
      whileHover={isClickable ? { scale: 1.02, y: -2 } : {}}
      whileTap={isClickable ? { scale: 0.98 } : {}}
      onClick={isClickable ? onClick : undefined}
      style={{ cursor: isClickable ? 'pointer' : 'default', width: '100%' }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          px: { xs: 2, md: 2.5 },
          py: { xs: 1.75, md: 2 },
          borderRadius: 3,
          background: s.bg,
          border: s.border,
          boxShadow: s.shadow,
          transition: 'all 0.18s ease',
          userSelect: 'none',
          '&:hover': isClickable ? { boxShadow: s.hoverShadow } : {},
        }}
      >
        {/*<Typography*/}
        {/*  sx={{ fontSize: { xs: '1.6rem', md: '1.9rem' }, lineHeight: 1, flexShrink: 0 }}*/}
        {/*>*/}
        {/*  {choice.emoji}*/}
        {/*</Typography>*/}
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: { xs: '0.88rem', md: '0.97rem', lg: '1.02rem' },
            color: s.color,
            lineHeight: 1.35,
            flex: 1,
          }}
        >
          {choice.text}
        </Typography>
        {state === 'selected-correct' && (
          <Typography sx={{ ml: 'auto', fontSize: '1.4rem', flexShrink: 0 }}>✅</Typography>
        )}
        {state === 'selected-wrong' && (
          <Typography sx={{ ml: 'auto', fontSize: '1.4rem', flexShrink: 0 }}>❌</Typography>
        )}
      </Box>
    </motion.div>
  )
}
