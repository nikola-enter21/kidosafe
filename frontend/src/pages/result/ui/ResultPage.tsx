import { Box, Button, Stack, Typography } from '@mui/material'
import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import { useGameStore } from '@/entities/game/model/gameStore'
import { getCategoryById } from '@/entities/scenario/model/categories'

export function ResultPage() {
  const { lastResult, restartCategory, goHome, goToScreen } = useGameStore()
  const firedRef = useRef(false)

  useEffect(() => {
    if (lastResult && lastResult.stars === 3 && !firedRef.current) {
      firedRef.current = true
      const end = Date.now() + 2500
      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#FFD700', '#FF6B6B', '#4ECDC4'],
        })
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#A29BFE', '#00B894', '#FD79A8'],
        })
        if (Date.now() < end) requestAnimationFrame(frame)
      }
      frame()
    }
  }, [lastResult])

  if (!lastResult) return null

  const cat = getCategoryById(lastResult.category)
  const pct = Math.round((lastResult.correctAnswers / lastResult.totalScenarios) * 100)
  const starsArr = [1, 2, 3]

  const messages: Record<number, { title: string; sub: string; gradient: string; accent: string }> = {
    3: {
      title: "Amazing! You're a Safety Hero! 🦸",
      sub: 'Perfect score! You handled every situation like a pro!',
      gradient: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
      accent: '#10b981',
    },
    2: {
      title: 'Great job, Safety Star! ⭐',
      sub: "You're doing really well. A little more practice and you'll be a hero!",
      gradient: 'linear-gradient(135deg, #fef9c3 0%, #fde68a 100%)',
      accent: '#f59e0b',
    },
    1: {
      title: 'Good try, keep learning! 💪',
      sub: 'Every superhero practises. Try again to score higher!',
      gradient: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
      accent: '#ef4444',
    },
  }
  const msg = messages[lastResult.stars]

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(145deg, #1a0533 0%, #2d1b69 35%, #6d28d9 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2.5, md: 4 },
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background glow */}
      <Box
        sx={{
          position: 'absolute',
          width: 700,
          height: 700,
          borderRadius: '50%',
          background: `radial-gradient(ellipse at center, ${msg.accent}22 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        style={{ width: '100%', maxWidth: 620, position: 'relative', zIndex: 2 }}
      >
        <Box
          sx={{
            borderRadius: 6,
            overflow: 'hidden',
            boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {/* ── Top colored section ── */}
          <Box sx={{ background: msg.gradient, p: { xs: 3.5, md: 5 }, textAlign: 'center' }}>
            {/* Category emoji */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.15 }}
            >
              <Typography sx={{ fontSize: { xs: '4rem', md: '5rem' }, lineHeight: 1, mb: 1.5 }}>
                {cat.emoji}
              </Typography>
            </motion.div>

            <Typography
              sx={{
                fontWeight: 900,
                fontSize: { xs: '1.2rem', md: '1.55rem' },
                color: '#1f2937',
                lineHeight: 1.3,
                mb: 0.75,
              }}
            >
              {msg.title}
            </Typography>
            <Typography sx={{ color: '#4b5563', fontSize: { xs: '0.9rem', md: '1rem' }, mb: 2.5 }}>
              {msg.sub}
            </Typography>

            {/* Stars */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5 }}>
              {starsArr.map(s => (
                <motion.div
                  key={s}
                  initial={{ scale: 0, rotate: -25 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3 + s * 0.18, type: 'spring', stiffness: 300 }}
                >
                  <Typography
                    sx={{
                      fontSize: { xs: '2.5rem', md: '3.2rem' },
                      filter: s <= lastResult.stars ? 'none' : 'grayscale(1) opacity(0.3)',
                      transition: 'filter 0.3s',
                    }}
                  >
                    ⭐
                  </Typography>
                </motion.div>
              ))}
            </Box>
          </Box>

          {/* ── Stats section ── */}
          <Box sx={{ bgcolor: '#fff', p: { xs: 3, md: 4 } }}>
            {/* Stats row */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-around',
                mb: { xs: 3, md: 4 },
                pb: { xs: 2.5, md: 3 },
                borderBottom: '1px solid rgba(0,0,0,0.06)',
              }}
            >
              {[
                { emoji: '✅', value: `${lastResult.correctAnswers}/${lastResult.totalScenarios}`, label: 'Correct' },
                { emoji: '📊', value: `${pct}%`, label: 'Accuracy' },
                { emoji: '⭐', value: lastResult.score, label: 'Points' },
              ].map(stat => (
                <Box key={stat.label} sx={{ textAlign: 'center' }}>
                  <Typography sx={{ fontSize: { xs: '1.75rem', md: '2rem' }, mb: 0.5 }}>
                    {stat.emoji}
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: 900,
                      fontSize: { xs: '1.5rem', md: '1.8rem' },
                      color: '#1f2937',
                      lineHeight: 1,
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography sx={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 600, mt: 0.25 }}>
                    {stat.label}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Buttons */}
            <Stack spacing={1.5}>
              <Button
                fullWidth
                variant="contained"
                onClick={restartCategory}
                sx={{
                  bgcolor: cat.color,
                  fontWeight: 800,
                  py: { xs: 1.25, md: 1.5 },
                  borderRadius: 99,
                  fontSize: { xs: '1rem', md: '1.1rem' },
                  boxShadow: `0 4px 16px ${cat.color}55`,
                  '&:hover': { bgcolor: cat.colorDark, transform: 'translateY(-2px)' },
                  transition: 'all 0.2s',
                }}
              >
                🔄 Try Again
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => goToScreen('categories')}
                sx={{
                  fontWeight: 700,
                  borderRadius: 99,
                  py: { xs: 1.25, md: 1.5 },
                  fontSize: { xs: '0.95rem', md: '1rem' },
                  borderColor: 'rgba(0,0,0,0.15)',
                  color: '#374151',
                  '&:hover': { borderColor: cat.color, color: cat.color, bgcolor: `${cat.color}08` },
                }}
              >
                🗂️ Other Categories
              </Button>
              <Button
                fullWidth
                onClick={goHome}
                sx={{ color: '#9ca3af', fontWeight: 600, fontSize: '0.95rem' }}
              >
                🏠 Home
              </Button>
            </Stack>
          </Box>
        </Box>
      </motion.div>
    </Box>
  )
}
