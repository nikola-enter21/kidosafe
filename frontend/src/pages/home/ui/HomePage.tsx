import { Box, Button, Typography } from '@mui/material'
import { motion } from 'framer-motion'
import { useGameStore } from '@/entities/game/model/gameStore'
import { CATEGORIES } from '@/entities/scenario/model/categories'
import { getTotalScenarioCount } from '@/entities/scenario/model/contentRepository'

const FLOATING = ['❤️', '⭐', '🛡️', '🎒', '💻', '🏠', '🔒', '🌟']

export function HomePage() {
  const goToScreen = useGameStore(s => s.goToScreen)
  const totalChallenges = getTotalScenarioCount()

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(145deg, #1a0533 0%, #2d1b69 35%, #6d28d9 70%, #a855f7 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Radial glow */}
      <Box
        sx={{
          position: 'absolute',
          width: { xs: 500, md: 800 },
          height: { xs: 500, md: 800 },
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at center, rgba(168,85,247,0.28) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Floating decorative emoji */}
      {FLOATING.map((e, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            fontSize: 'clamp(1.4rem, 3vw, 2.2rem)',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
          initial={{ x: `${(i * 13 + 5) % 92}vw`, y: `${(i * 11 + 8) % 85}vh`, opacity: 0 }}
          animate={{
            y: [`${(i * 11 + 8) % 85}vh`, `${(i * 11 + 4) % 85}vh`, `${(i * 11 + 8) % 85}vh`],
            opacity: [0, 0.3, 0.3, 0],
          }}
          transition={{ duration: 5 + i * 0.7, repeat: Infinity, delay: i * 0.4 }}
        >
          {e}
        </motion.div>
      ))}

      {/* Glass card */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 160, damping: 18, delay: 0.1 }}
        style={{ position: 'relative', zIndex: 2 }}
      >
        <Box
          sx={{
            width: { xs: '92vw', sm: 520, md: 580 },
            bgcolor: 'rgba(255,255,255,0.07)',
            backdropFilter: 'blur(24px)',
            border: '1.5px solid rgba(255,255,255,0.15)',
            borderRadius: 6,
            p: { xs: 4, md: 6 },
            boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
            textAlign: 'center',
          }}
        >
          {/* Mascot */}
          <motion.div
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.25 }}
          >
            <Box
              sx={{
                width: { xs: 100, md: 120 },
                height: { xs: 100, md: 120 },
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.12)',
                border: '3px solid rgba(255,255,255,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: { xs: '3rem', md: '3.8rem' },
                mx: 'auto',
                mb: 3,
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              }}
            >
              🦸
            </Box>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Typography
              sx={{
                color: '#fff',
                fontWeight: 900,
                fontSize: { xs: '2.6rem', md: '3.4rem' },
                lineHeight: 1,
                letterSpacing: '-0.02em',
                textShadow: '0 4px 24px rgba(0,0,0,0.35)',
                mb: 1.5,
              }}
            >
              KiddoSafe
            </Typography>
            <Typography
              sx={{
                color: 'rgba(255,255,255,0.75)',
                fontWeight: 600,
                fontSize: { xs: '1rem', md: '1.15rem' },
                lineHeight: 1.55,
                maxWidth: 360,
                mx: 'auto',
                mb: 3.5,
              }}
            >
              Learn how to stay safe every day with fun adventures! 🌟
            </Typography>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                gap: { xs: 2, md: 4 },
                mb: 3.5,
              }}
            >
              {[
                { emoji: '🗂️', value: String(CATEGORIES.length), label: 'Categories' },
                { emoji: '🎯', value: String(totalChallenges), label: 'Challenges' },
                { emoji: '🏆', value: '3★', label: 'Max Stars' },
              ].map(stat => (
                <Box key={stat.label} sx={{ textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '1.5rem', mb: 0.25 }}>{stat.emoji}</Typography>
                  <Typography
                    sx={{
                      color: '#fff',
                      fontWeight: 900,
                      fontSize: '1.3rem',
                      lineHeight: 1,
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography
                    sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', fontWeight: 600 }}
                  >
                    {stat.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </motion.div>

          {/* CTA button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.52, type: 'spring', stiffness: 200 }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Button
                fullWidth
                size="large"
                onClick={() => goToScreen('categories')}
                sx={{
                  bgcolor: '#fff',
                  color: '#6d28d9',
                  fontWeight: 900,
                  fontSize: { xs: '1.1rem', md: '1.25rem' },
                  py: { xs: 1.75, md: 2 },
                  borderRadius: 99,
                  boxShadow: '0 8px 28px rgba(0,0,0,0.28)',
                  letterSpacing: '0.01em',
                  '&:hover': {
                    bgcolor: '#f5f3ff',
                    transform: 'translateY(-3px)',
                    boxShadow: '0 14px 36px rgba(0,0,0,0.35)',
                  },
                  transition: 'all 0.22s ease',
                }}
              >
                🚀 Let's Play!
              </Button>
              <Button
                fullWidth
                onClick={() => goToScreen('editor')}
                sx={{
                  color: '#fff',
                  border: '1.5px solid rgba(255,255,255,0.4)',
                  fontWeight: 800,
                  fontSize: { xs: '0.95rem', md: '1rem' },
                  py: { xs: 1.1, md: 1.2 },
                  borderRadius: 99,
                  bgcolor: 'rgba(255,255,255,0.08)',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.16)',
                    borderColor: 'rgba(255,255,255,0.6)',
                  },
                }}
              >
                🛠️ Content Studio
              </Button>
            </Box>
          </motion.div>
        </Box>
      </motion.div>

      {/* Bottom tagline */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        style={{ position: 'relative', zIndex: 2, marginTop: 24 }}
      >
        <Typography
          sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', textAlign: 'center' }}
        >
          Designed for curious minds 🧠 · Safe · Fun · Educational
        </Typography>
      </motion.div>
    </Box>
  )
}
