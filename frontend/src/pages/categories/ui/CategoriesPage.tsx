import { Box, IconButton, Typography } from '@mui/material'
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import { motion } from 'framer-motion'
import { CategoryGrid } from '@/widgets/category-grid/CategoryGrid'
import { useGameStore } from '@/entities/game/model/gameStore'
import type { CategoryId } from '@/shared/types/game'

export function CategoriesPage() {
  const { selectCategory, goToScreen } = useGameStore()

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(150deg, #0f172a 0%, #1e1b4b 40%, #312e81 100%)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Radial glow top-right */}
      <Box
        sx={{
          position: 'absolute',
          top: -200,
          right: -200,
          width: 600,
          height: 600,
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at center, rgba(139,92,246,0.2) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      {/* Radial glow bottom-left */}
      <Box
        sx={{
          position: 'absolute',
          bottom: -200,
          left: -200,
          width: 500,
          height: 500,
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at center, rgba(59,130,246,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Header ─────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: { xs: 2.5, md: 4, lg: 6 },
          py: { xs: 2, md: 3 },
          gap: 2,
          position: 'relative',
          zIndex: 2,
        }}
      >
        <IconButton
          onClick={() => goToScreen('home')}
          sx={{
            bgcolor: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: '#fff',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' },
          }}
        >
          <ArrowBackRounded />
        </IconButton>
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            🦸 KidoSafe
          </Typography>
        </motion.div>
      </Box>

      {/* ── Title section ───────────────────────────────────────────── */}
      <Box
        sx={{
          px: { xs: 2.5, md: 4, lg: 6 },
          pb: { xs: 3, md: 4 },
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
        }}
      >
        <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}>
          <Typography sx={{ fontSize: { xs: '2.5rem', md: '3rem' }, lineHeight: 1, mb: 1 }}>
            🌍
          </Typography>
          <Typography
            sx={{
              color: '#fff',
              fontWeight: 900,
              fontSize: { xs: '1.6rem', sm: '2rem', md: '2.4rem' },
              lineHeight: 1.1,
              mb: 1,
              letterSpacing: '-0.01em',
            }}
          >
            Choose Your Adventure!
          </Typography>
          <Typography
            sx={{
              color: 'rgba(255,255,255,0.55)',
              fontSize: { xs: '0.9rem', md: '1rem' },
              fontWeight: 500,
            }}
          >
            Pick a category and start your safety mission 🚀
          </Typography>
        </motion.div>
      </Box>

      {/* ── Grid ────────────────────────────────────────────────────── */}
      <Box
        sx={{
          flex: 1,
          px: { xs: 2.5, md: 4, lg: 6 },
          pb: { xs: 3, md: 5 },
          position: 'relative',
          zIndex: 2,
        }}
      >
        <CategoryGrid onSelect={(id: CategoryId) => selectCategory(id)} />
      </Box>
    </Box>
  )
}
