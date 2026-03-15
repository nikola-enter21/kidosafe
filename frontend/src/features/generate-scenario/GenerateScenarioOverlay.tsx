import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded'
import ErrorOutlineRounded from '@mui/icons-material/ErrorOutlineRounded'
import CheckCircleOutlineRounded from '@mui/icons-material/CheckCircleOutlineRounded'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

import { generateScenario } from '@/shared/api/contentApi'
import type { Scenario } from '@/entities/scenario/model/types'
import type { CategoryId } from '@/shared/types/game'
import { getCategoryById } from '@/entities/scenario/model/categories'

// ─── Loading steps ────────────────────────────────────────────────────────────

const STEPS = [
  { emoji: '⚡', label: 'Contacting AI service…' },
  { emoji: '📝', label: 'Crafting your question…' },
  { emoji: '🎨', label: 'Generating images…' },
  { emoji: '✅', label: 'Almost done…' },
]

const STEP_DURATION_MS = 14_000 // auto-advance visual step every 14s

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'loading' | 'success' | 'error'

interface Props {
  open: boolean
  categoryId: CategoryId
  onAdd: (scenario: Scenario) => void
  onClose: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GenerateScenarioOverlay({ open, categoryId, onAdd, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>('loading')
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [stepIndex, setStepIndex] = useState(0)
  const runRef = useRef(0) // lets us cancel stale async runs

  const category = getCategoryById(categoryId)

  // ── Trigger generation whenever overlay opens ────────────────────────────
  useEffect(() => {
    if (!open) return

    const run = ++runRef.current
    setPhase('loading')
    setScenario(null)
    setErrorMsg('')
    setStepIndex(0)

    generateScenario(categoryId)
      .then(result => {
        if (run !== runRef.current) return
        setScenario(result)
        setPhase('success')
      })
      .catch((err: unknown) => {
        if (run !== runRef.current) return
        setErrorMsg(err instanceof Error ? err.message : 'Unknown error occurred.')
        setPhase('error')
      })
  }, [open, categoryId])

  // ── Auto-advance loading step indicator ──────────────────────────────────
  useEffect(() => {
    if (phase !== 'loading') return
    if (stepIndex >= STEPS.length - 1) return

    const timer = setTimeout(() => {
      setStepIndex(prev => Math.min(prev + 1, STEPS.length - 1))
    }, STEP_DURATION_MS)

    return () => clearTimeout(timer)
  }, [phase, stepIndex])

  const handleRetry = () => {
    const run = ++runRef.current
    setPhase('loading')
    setScenario(null)
    setErrorMsg('')
    setStepIndex(0)

    generateScenario(categoryId)
      .then(result => {
        if (run !== runRef.current) return
        setScenario(result)
        setPhase('success')
      })
      .catch((err: unknown) => {
        if (run !== runRef.current) return
        setErrorMsg(err instanceof Error ? err.message : 'Unknown error occurred.')
        setPhase('error')
      })
  }

  return (
    <Dialog
      open={open}
      onClose={phase === 'loading' ? undefined : onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#0b1020',
          backgroundImage: 'none',
          borderRadius: 3,
          border: '1px solid rgba(167,139,250,0.2)',
          overflow: 'hidden',
          minHeight: 420,
        },
      }}
    >
      <AnimatePresence mode="wait">
        {phase === 'loading' && (
          <LoadingPane key="loading" stepIndex={stepIndex} color={category.color} />
        )}
        {phase === 'success' && scenario && (
          <SuccessPane
            key="success"
            scenario={scenario}
            categoryLabel={category.label}
            categoryEmoji={category.emoji}
            onAdd={() => onAdd(scenario)}
            onRetry={handleRetry}
          />
        )}
        {phase === 'error' && (
          <ErrorPane
            key="error"
            message={errorMsg}
            onRetry={handleRetry}
            onClose={onClose}
          />
        )}
      </AnimatePresence>
    </Dialog>
  )
}

// ─── Loading pane ─────────────────────────────────────────────────────────────

function LoadingPane({ stepIndex, color }: { stepIndex: number; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 420, padding: 40, position: 'relative' }}
    >
      {/* Background glow */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 50% 40%, ${color}22 0%, transparent 65%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Robot emoji pulse */}
      <motion.div
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ fontSize: 72, lineHeight: 1, marginBottom: 24 }}
      >
        🤖
      </motion.div>

      <Typography
        sx={{ color: '#fff', fontWeight: 900, fontSize: '1.35rem', mb: 0.75, textAlign: 'center' }}
      >
        Generating Scenario
      </Typography>
      <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', mb: 3.5, textAlign: 'center' }}>
        This may take up to 60 seconds
      </Typography>

      <CircularProgress size={48} sx={{ color: '#a78bfa', mb: 4 }} />

      {/* Step indicators */}
      <Stack spacing={1.2} sx={{ width: '100%', maxWidth: 340 }}>
        {STEPS.map((step, i) => {
          const done = i < stepIndex
          const active = i === stepIndex
          return (
            <motion.div
              key={step.label}
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: active ? 1 : done ? 0.55 : 0.25 }}
              transition={{ delay: i * 0.08, duration: 0.35 }}
            >
              <Stack
                direction="row"
                spacing={1.25}
                alignItems="center"
                sx={{
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  bgcolor: active ? 'rgba(167,139,250,0.12)' : 'transparent',
                  border: active ? '1px solid rgba(167,139,250,0.25)' : '1px solid transparent',
                  transition: 'all 0.4s ease',
                }}
              >
                <Typography sx={{ fontSize: '1.1rem', minWidth: 24 }}>
                  {done ? '✓' : step.emoji}
                </Typography>
                <Typography
                  sx={{
                    color: active ? '#c4b5fd' : done ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.3)',
                    fontWeight: active ? 700 : 400,
                    fontSize: '0.9rem',
                    transition: 'color 0.4s ease',
                  }}
                >
                  {step.label}
                </Typography>
                {active && (
                  <Box sx={{ ml: 'auto' }}>
                    <CircularProgress size={14} sx={{ color: '#a78bfa' }} />
                  </Box>
                )}
              </Stack>
            </motion.div>
          )
        })}
      </Stack>
    </motion.div>
  )
}

// ─── Success pane ─────────────────────────────────────────────────────────────

function SuccessPane({
  scenario,
  categoryLabel,
  categoryEmoji,
  onAdd,
  onRetry,
}: {
  scenario: Scenario
  categoryLabel: string
  categoryEmoji: string
  onAdd: () => void
  onRetry: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{ padding: 32, overflowY: 'auto', maxHeight: '90vh' }}
    >
      {/* Header */}
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <AutoAwesomeRounded sx={{ color: '#a78bfa', fontSize: 28 }} />
        <Box>
          <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '1.2rem' }}>
            Scenario Generated!
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
            {categoryEmoji} {categoryLabel} · Review before adding
          </Typography>
        </Box>
      </Stack>

      {/* Images row */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 3 }}>
        {[
          { label: '📷 Question', url: scenario.imageUrl },
          { label: '✅ Correct', url: scenario.imageUrlCorrect },
          { label: '❌ Wrong', url: scenario.imageUrlWrong },
        ].map(({ label, url }) => (
          <Box key={label} sx={{ flex: 1 }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', mb: 0.75, fontWeight: 600 }}>
              {label}
            </Typography>
            <Paper
              sx={{
                bgcolor: '#1a2235',
                borderRadius: 2,
                overflow: 'hidden',
                aspectRatio: '4/3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {url ? (
                <Box
                  component="img"
                  src={url}
                  alt={label}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Typography sx={{ fontSize: '2.5rem', opacity: 0.4 }}>🖼️</Typography>
              )}
            </Paper>
          </Box>
        ))}
      </Stack>

      {/* Question */}
      <Paper
        sx={{
          bgcolor: '#121a2d',
          border: '1px solid rgba(167,139,250,0.2)',
          borderRadius: 2,
          p: 2,
          mb: 2,
        }}
      >
        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.74rem', fontWeight: 700, mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Question
        </Typography>
        <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1rem', lineHeight: 1.5 }}>
          {scenario.question}
        </Typography>
      </Paper>

      {/* Choices */}
      <Stack spacing={1} sx={{ mb: 3.5 }}>
        {scenario.choices.map((choice, i) => (
          <Paper
            key={choice.id ?? i}
            sx={{
              bgcolor: choice.isCorrect ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${choice.isCorrect ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 2,
              px: 2,
              py: 1.25,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            {choice.isCorrect ? (
              <CheckCircleOutlineRounded sx={{ color: '#10b981', fontSize: 20, flexShrink: 0 }} />
            ) : (
              <Box sx={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)', flexShrink: 0 }} />
            )}
            <Typography sx={{ color: choice.isCorrect ? '#6ee7b7' : '#fff', fontWeight: choice.isCorrect ? 700 : 400, fontSize: '0.9rem' }}>
              {choice.text}
            </Typography>
            {choice.isCorrect && (
              <Typography sx={{ ml: 'auto', color: '#10b981', fontSize: '0.75rem', fontWeight: 700 }}>
                Correct ✓
              </Typography>
            )}
          </Paper>
        ))}
      </Stack>

      {/* Actions */}
      <Stack direction="row" spacing={1.5} justifyContent="flex-end">
        <Button
          variant="outlined"
          onClick={onRetry}
          sx={{
            color: 'rgba(255,255,255,0.6)',
            borderColor: 'rgba(255,255,255,0.15)',
            '&:hover': { borderColor: 'rgba(255,255,255,0.35)', bgcolor: 'rgba(255,255,255,0.05)' },
          }}
        >
          ↺ Generate Another
        </Button>
        <Button
          variant="contained"
          onClick={onAdd}
          startIcon={<AutoAwesomeRounded />}
          sx={{
            background: 'linear-gradient(135deg, #667eea, #a78bfa)',
            fontWeight: 800,
            '&:hover': { background: 'linear-gradient(135deg, #5a67d8, #9f7aea)' },
          }}
        >
          Add to Category →
        </Button>
      </Stack>
    </motion.div>
  )
}

// ─── Error pane ───────────────────────────────────────────────────────────────

function ErrorPane({
  message,
  onRetry,
  onClose,
}: {
  message: string
  onRetry: () => void
  onClose: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 420, padding: 40 }}
    >
      <ErrorOutlineRounded sx={{ color: '#f87171', fontSize: 60, mb: 2 }} />
      <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1.2rem', mb: 1 }}>
        Generation Failed
      </Typography>
      <Typography
        sx={{
          color: 'rgba(255,255,255,0.5)',
          fontSize: '0.88rem',
          textAlign: 'center',
          maxWidth: 380,
          mb: 4,
        }}
      >
        {message || 'Could not connect to the AI service. Make sure the backend is running.'}
      </Typography>
      <Stack direction="row" spacing={1.5}>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{
            color: 'rgba(255,255,255,0.6)',
            borderColor: 'rgba(255,255,255,0.15)',
            '&:hover': { borderColor: 'rgba(255,255,255,0.35)' },
          }}
        >
          Dismiss
        </Button>
        <Button
          variant="contained"
          onClick={onRetry}
          sx={{ background: 'linear-gradient(135deg, #667eea, #a78bfa)', fontWeight: 800 }}
        >
          Retry
        </Button>
      </Stack>
    </motion.div>
  )
}
