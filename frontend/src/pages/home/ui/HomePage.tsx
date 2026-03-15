import { useState, useRef } from 'react'
import { Box, Button, CircularProgress, TextField, Typography } from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/entities/game/model/gameStore'
import { CATEGORIES } from '@/entities/scenario/model/categories'
import { useFetch } from '@/shared/api/http'
import type { ApiCategory } from '@/shared/api/contentApi'

const FLOATING = ['❤️', '⭐', '🛡️', '🎒', '💻', '🏠', '🔒', '🌟']

export function HomePage() {
  const goToScreen = useGameStore(s => s.goToScreen)
  const playerUsername = useGameStore(s => s.playerUsername)
  const isSettingPlayer = useGameStore(s => s.isSettingPlayer)
  const setPlayer = useGameStore(s => s.setPlayer)
  const clearPlayer = useGameStore(s => s.clearPlayer)
  const startSmartMode = useGameStore(s => s.startSmartMode)

  const { data: apiCategories } = useFetch<ApiCategory[]>('/api/categories/')
  const totalChallenges = apiCategories?.reduce((sum, c) => sum + c.scenarioCount, 0) ?? 0

  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleStart = async () => {
    const val = inputValue.trim()
    if (!val) return
    await setPlayer(val)
  }

  const hasPlayer = !!playerUsername

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
              {hasPlayer
                ? `Welcome back, ${playerUsername}! 🌟`
                : 'Learn how to stay safe every day with fun adventures! 🌟'}
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
                    sx={{ color: '#fff', fontWeight: 900, fontSize: '1.3rem', lineHeight: 1 }}
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

          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.52, type: 'spring', stiffness: 200 }}
          >
            <AnimatePresence mode="wait">
              {!hasPlayer ? (
                <motion.div
                  key="username-form"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <TextField
                      inputRef={inputRef}
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleStart()}
                      placeholder="Enter your name to start…"
                      variant="outlined"
                      fullWidth
                      autoFocus
                      inputProps={{ maxLength: 30 }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: 'rgba(255,255,255,0.1)',
                          borderRadius: 3,
                          color: '#fff',
                          fontSize: '1.1rem',
                          fontWeight: 700,
                          '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                          '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.6)' },
                          '&.Mui-focused fieldset': { borderColor: '#a855f7' },
                        },
                        '& input::placeholder': { color: 'rgba(255,255,255,0.4)', opacity: 1 },
                      }}
                    />
                    <Button
                      fullWidth
                      size="large"
                      onClick={handleStart}
                      disabled={!inputValue.trim() || isSettingPlayer}
                      sx={{
                        bgcolor: '#fff',
                        color: '#6d28d9',
                        fontWeight: 900,
                        fontSize: { xs: '1.1rem', md: '1.25rem' },
                        py: { xs: 1.75, md: 2 },
                        borderRadius: 99,
                        boxShadow: '0 8px 28px rgba(0,0,0,0.28)',
                        '&:hover': {
                          bgcolor: '#f5f3ff',
                          transform: 'translateY(-3px)',
                          boxShadow: '0 14px 36px rgba(0,0,0,0.35)',
                        },
                        '&:disabled': { bgcolor: 'rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.5)' },
                        transition: 'all 0.22s ease',
                      }}
                    >
                      {isSettingPlayer ? (
                        <CircularProgress size={22} sx={{ color: '#6d28d9' }} />
                      ) : (
                        '🚀 Start Adventure!'
                      )}
                    </Button>
                  </Box>
                </motion.div>
              ) : (
                <motion.div
                  key="play-buttons"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
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
                      size="large"
                      onClick={startSmartMode}
                      sx={{
                        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                        color: '#fff',
                        fontWeight: 900,
                        fontSize: { xs: '1.1rem', md: '1.25rem' },
                        py: { xs: 1.75, md: 2 },
                        borderRadius: 99,
                        boxShadow: '0 8px 28px rgba(79,70,229,0.45)',
                        border: '1.5px solid rgba(255,255,255,0.2)',
                        letterSpacing: '0.01em',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #4338ca 0%, #6d28d9 100%)',
                          transform: 'translateY(-3px)',
                          boxShadow: '0 14px 36px rgba(79,70,229,0.55)',
                        },
                        transition: 'all 0.22s ease',
                      }}
                    >
                      🤖 Smart Mode
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
                    {/* Change player */}
                    <Button
                      size="small"
                      onClick={clearPlayer}
                      sx={{
                        color: 'rgba(255,255,255,0.35)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        '&:hover': { color: 'rgba(255,255,255,0.7)' },
                      }}
                    >
                      Not {playerUsername}? Change player
                    </Button>
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>
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
