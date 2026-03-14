import { Box, Chip, Stack, Typography } from '@mui/material'
import { getCategoryById } from '@/entities/scenario/model/categories'
import type { CategoryId } from '@/shared/types/game'

interface HUDProps {
  lives: number
  streak: number
  score: number
  secondsLeft: number
  category: CategoryId
  choicesUnlocked: boolean
}

export function HUD({ lives, streak, score, secondsLeft, category, choicesUnlocked }: HUDProps) {
  const cat = getCategoryById(category)
  const isLow = secondsLeft <= 5 && choicesUnlocked

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        p: 1.5,
        zIndex: 10,
        pointerEvents: 'none',
      }}
    >
      {/* Category badge */}
      <Chip
        label={cat.label.toUpperCase()}
        size="small"
        sx={{
          bgcolor: 'rgba(0,0,0,0.55)',
          color: '#fff',
          fontWeight: 800,
          fontSize: '0.65rem',
          letterSpacing: '0.08em',
          backdropFilter: 'blur(6px)',
          border: '1px solid rgba(255,255,255,0.15)',
        }}
      />

      {/* Stats row */}
      <Stack direction="row" spacing={0.75} alignItems="center">
        <StatPill label={`${'❤️'.repeat(lives)}${'🖤'.repeat(3 - lives)}`} />
        <StatPill label={`🔥 ${streak}`} />
        <StatPill label={`⭐ ${score}`} />
        <StatPill
          label={`⏱ ${secondsLeft}s`}
          sx={isLow ? { bgcolor: 'rgba(220,38,38,0.75)', animation: 'pulse 0.6s infinite' } : {}}
        />
      </Stack>
    </Box>
  )
}

function StatPill({ label, sx = {} }: { label: string; sx?: object }) {
  return (
    <Typography
      component="span"
      sx={{
        bgcolor: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(6px)',
        border: '1px solid rgba(255,255,255,0.15)',
        color: '#fff',
        fontWeight: 700,
        fontSize: '0.72rem',
        px: 1.25,
        py: 0.4,
        borderRadius: 99,
        whiteSpace: 'nowrap',
        ...sx,
      }}
    >
      {label}
    </Typography>
  )
}
