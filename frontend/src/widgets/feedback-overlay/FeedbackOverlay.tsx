import { Box, Button, Typography } from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import type { Choice } from '@/entities/scenario/model/types'

interface FeedbackOverlayProps {
  isCorrect: boolean
  choice: Choice
  tip: string
  onNext: () => void
  isLastScenario: boolean
}

export function FeedbackOverlay({
  isCorrect,
  choice,
  tip,
  onNext,
  isLastScenario,
}: FeedbackOverlayProps) {
  const firedRef = useRef(false)

  useEffect(() => {
    if (isCorrect && !firedRef.current) {
      firedRef.current = true
      confetti({
        particleCount: 90,
        spread: 72,
        origin: { y: 0.55 },
        colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#A29BFE', '#00B894'],
      })
    }
  }, [isCorrect])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        style={{ width: '100%' }}
      >
        <Box
          sx={{
            borderRadius: 4,
            p: { xs: 2.5, md: 3 },
            background: isCorrect
              ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'
              : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
            border: `2px solid ${isCorrect ? '#10b981' : '#ef4444'}`,
            boxShadow: isCorrect
              ? '0 8px 32px rgba(16,185,129,0.18)'
              : '0 8px 32px rgba(239,68,68,0.18)',
          }}
        >
          {/* Emoji + feedback text */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 1.75 }}>
            <Typography sx={{ fontSize: { xs: '2rem', md: '2.4rem' }, lineHeight: 1, flexShrink: 0 }}>
              {choice.feedbackEmoji}
            </Typography>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: { xs: '0.92rem', md: '1rem', lg: '1.06rem' },
                color: isCorrect ? '#065f46' : '#7f1d1d',
                lineHeight: 1.45,
              }}
            >
              {choice.feedback}
            </Typography>
          </Box>

          {/* Tip box */}
          <Box
            sx={{
              bgcolor: 'rgba(255,255,255,0.65)',
              borderRadius: 3,
              p: { xs: 1.5, md: 2 },
              mb: 2,
              display: 'flex',
              gap: 1.25,
              alignItems: 'flex-start',
            }}
          >
            <Typography sx={{ fontSize: '1.1rem', flexShrink: 0, mt: 0.1 }}>💡</Typography>
            <Typography
              sx={{
                fontSize: { xs: '0.82rem', md: '0.9rem' },
                color: '#374151',
                lineHeight: 1.55,
                fontWeight: 500,
              }}
            >
              {tip}
            </Typography>
          </Box>

          {/* Next button */}
          <Button
            fullWidth
            variant="contained"
            onClick={onNext}
            sx={{
              bgcolor: isCorrect ? '#10b981' : '#ef4444',
              '&:hover': {
                bgcolor: isCorrect ? '#059669' : '#dc2626',
                transform: 'translateY(-2px)',
              },
              fontWeight: 800,
              fontSize: { xs: '0.95rem', md: '1.05rem' },
              py: { xs: 1, md: 1.25 },
              borderRadius: 99,
              boxShadow: isCorrect ? '0 4px 16px rgba(16,185,129,0.4)' : '0 4px 16px rgba(239,68,68,0.4)',
              transition: 'all 0.2s',
            }}
          >
            {isLastScenario ? '🏆 See Results!' : 'Next ➡️'}
          </Button>
        </Box>
      </motion.div>
    </AnimatePresence>
  )
}
