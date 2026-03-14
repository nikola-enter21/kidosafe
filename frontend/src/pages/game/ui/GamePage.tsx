import { Box, Button, LinearProgress, Stack, Typography } from '@mui/material'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from '@/entities/game/model/gameStore'
import { useGameState } from '@/entities/game/hooks/useGameState'
import { getCategoryById } from '@/entities/scenario/model/categories'
import { SceneDisplay } from '@/entities/scenario/ui/SceneDisplay'
import { ChoiceButton } from '@/widgets/choice-list/ChoiceButton'
import { FeedbackOverlay } from '@/widgets/feedback-overlay/FeedbackOverlay'

export function GamePage() {
  const { selectedCategory, goHome, goToScreen } = useGameStore()
  const {
    currentScenario,
    currentIndex,
    totalScenarios,
    lives,
    score,
    streak,
    answerState,
    selectedChoiceId,
    choicesUnlocked,
    secondsLeft,
    watchSecondsLeft,
    handleChoiceClick,
    handleNext,
    lastResult,
  } = useGameState()

  if (!currentScenario || !selectedCategory) return null

  const cat = getCategoryById(selectedCategory)
  const progress = (currentIndex / totalScenarios) * 100
  const isAnswered = answerState !== 'idle'
  const isLastScenario = currentIndex === totalScenarios - 1
  const selectedChoice = isAnswered
    ? currentScenario.choices.find(c => c.id === selectedChoiceId)
    : null
  // Triplet = scenario has distinct question + correct + wrong media (video OR image)
  const isTriplet = Boolean(
    (currentScenario.questionVideoUrl || currentScenario.imageUrl) &&
    (currentScenario.correctVideoUrl  || currentScenario.imageUrlCorrect) &&
    (currentScenario.wrongVideoUrl    || currentScenario.imageUrlWrong),
  )
  // Active video for the current state
  const activeSceneVideoUrl = isTriplet
    ? isAnswered
      ? answerState === 'correct'
        ? currentScenario.correctVideoUrl
        : currentScenario.wrongVideoUrl
      : currentScenario.questionVideoUrl
    : currentScenario.videoUrl
  // Active image fallback for the current state (used when no video)
  const activeSceneImageUrl = isTriplet
    ? isAnswered
      ? answerState === 'correct'
        ? currentScenario.imageUrlCorrect
        : currentScenario.imageUrlWrong
      : currentScenario.imageUrl
    : currentScenario.imageUrl
  // Pause only while choices are shown but not yet answered; result media should auto-play
  const shouldPauseScene = isTriplet
    ? choicesUnlocked && !isAnswered
    : choicesUnlocked || isAnswered
  const isTimerLow = secondsLeft <= 5 && choicesUnlocked && !isAnswered
  const activeSeconds = choicesUnlocked ? secondsLeft : watchSecondsLeft
  const watchProgress =
    ((currentScenario.watchTime - watchSecondsLeft) / currentScenario.watchTime) * 100

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#0d1117',
        overflow: 'hidden',
      }}
    >
      {/* ── TOP NAVIGATION BAR ──────────────────────────────────────── */}
      <Box
        sx={{
          height: 64,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          px: 3,
          gap: 2,
          bgcolor: '#161b22',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          zIndex: 30,
        }}
      >
        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 0.5, flexShrink: 0 }}>
          <Typography sx={{ fontSize: '1.4rem', lineHeight: 1 }}>🦸</Typography>
          <Typography
            sx={{ color: '#fff', fontWeight: 900, fontSize: '1.1rem', letterSpacing: '-0.01em' }}
          >
            KiddoSafe
          </Typography>
        </Box>

        {/* Category badge */}
        <Box
          sx={{
            bgcolor: cat.color,
            color: '#fff',
            fontWeight: 800,
            fontSize: '0.72rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            px: 1.75,
            py: 0.6,
            borderRadius: 99,
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          {cat.emoji} {cat.label}
        </Box>

        {/* Progress bar — fills the middle */}
        <Box sx={{ flex: 1, mx: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8,
                borderRadius: 99,
                bgcolor: 'rgba(255,255,255,0.08)',
                '& .MuiLinearProgress-bar': {
                  background: `linear-gradient(90deg, ${cat.color}, ${cat.colorLight}cc)`,
                  borderRadius: 99,
                  transition: 'transform 0.6s ease',
                },
              }}
            />
          </Box>
          <Typography
            sx={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: '0.75rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {currentIndex + 1} / {totalScenarios}
          </Typography>
        </Box>

        {/* Stats pills */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          <StatPill label={`${'❤️'.repeat(lives)}${'🖤'.repeat(3 - lives)}`} />
          <StatPill label={`🔥 ${streak}`} />
          <StatPill label={`⭐ ${score}`} />
          <StatPill label={`⏱ ${activeSeconds}s`} isAlert={isTimerLow} />
        </Box>

        {/* Nav buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1, flexShrink: 0 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => goToScreen('categories')}
            sx={{
              borderRadius: 99,
              fontWeight: 700,
              fontSize: '0.72rem',
              py: 0.5,
              px: 1.75,
              borderColor: 'rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.55)',
              '&:hover': {
                borderColor: cat.color,
                color: cat.colorLight,
                bgcolor: `${cat.color}18`,
              },
            }}
          >
            Categories
          </Button>
          <Button
            size="small"
            onClick={goHome}
            sx={{
              color: 'rgba(255,255,255,0.4)',
              fontWeight: 700,
              fontSize: '1rem',
              minWidth: 36,
              px: 0.75,
              '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.06)' },
            }}
          >
            🏠
          </Button>
        </Box>
      </Box>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── LEFT: Video / Scene (58%) ──────────────────────────── */}
        <Box sx={{ flex: '0 0 58%', position: 'relative', overflow: 'hidden', bgcolor: '#000' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScenario.id}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              style={{ position: 'absolute', inset: 0 }}
            >

              <SceneDisplay
                scene={currentScenario.scene}
                videoUrl={activeSceneVideoUrl}
                imageUrl={activeSceneImageUrl}
                shouldPause={shouldPauseScene}
              />
            </motion.div>
          </AnimatePresence>

          {/* Status chip overlay */}
          <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 10, pointerEvents: 'none' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={isAnswered ? 'answered' : choicesUnlocked ? 'choose' : 'watch'}
                initial={{ opacity: 0, y: -8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.22 }}
              >
                <Box
                  sx={{
                    bgcolor: isAnswered
                      ? 'rgba(16,185,129,0.88)'
                      : choicesUnlocked
                      ? 'rgba(245,158,11,0.88)'
                      : 'rgba(99,102,241,0.88)',
                    backdropFilter: 'blur(12px)',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    px: 1.75,
                    py: 0.65,
                    borderRadius: 99,
                    border: '1.5px solid rgba(255,255,255,0.25)',
                  }}
                >
                  {isAnswered
                    ? isTriplet
                      ? '🎬 Result video'
                      : '✅ Answered'
                    : choicesUnlocked
                    ? '🎯 Make your choice!'
                    : `👀 Watch — ${watchSecondsLeft}s`}
                </Box>
              </motion.div>
            </AnimatePresence>
          </Box>

          {/* Vertical separator glow */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 1,
              height: '100%',
              background: `linear-gradient(to bottom, transparent, ${cat.color}44, transparent)`,
              zIndex: 5,
            }}
          />
        </Box>

        {/* ── RIGHT: Interactive Panel (42%) ───────────────────────── */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#f8faff',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Top accent line */}
          <Box
            sx={{
              height: 4,
              flexShrink: 0,
              background: `linear-gradient(90deg, ${cat.color}, ${cat.colorLight})`,
            }}
          />

          {/* Subtle dot-grid background */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              opacity: 0.025,
              backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
              backgroundSize: '28px 28px',
              pointerEvents: 'none',
            }}
          />

          {/* Scrollable content */}
          <Box
            sx={{
              flex: 1,
              overflow: 'hidden auto',
              px: { xs: 3, md: 4, lg: 5 },
              py: { xs: 3, md: 3.5, lg: 4 },
              display: 'flex',
              flexDirection: 'column',
              gap: 2.5,
              position: 'relative',
              zIndex: 1,
              '&::-webkit-scrollbar': { width: 6 },
              '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: 'rgba(0,0,0,0.12)',
                borderRadius: 99,
                '&:hover': { bgcolor: 'rgba(0,0,0,0.22)' },
              },
            }}
          >
            {/* Question card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`q-${currentScenario.id}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <Box
                  sx={{
                    bgcolor: '#fff',
                    borderRadius: 4,
                    p: { xs: 2.5, md: 3, lg: 3.5 },
                    boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
                    border: '1px solid rgba(0,0,0,0.05)',
                    borderLeft: `4px solid ${cat.color}`,
                  }}
                >
                  <Typography
                    sx={{
                      color: cat.color,
                      fontSize: '0.68rem',
                      fontWeight: 900,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      mb: 1.25,
                    }}
                  >
                    🤔 Question {currentIndex + 1} of {totalScenarios}
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: 800,
                      fontSize: 'clamp(1.05rem, 1.5vw, 1.4rem)',
                      color: '#1a1a2e',
                      lineHeight: 1.45,
                    }}
                  >
                    {currentScenario.question}
                  </Typography>
                </Box>
              </motion.div>
            </AnimatePresence>

            {/* Watch hint */}
            {!choicesUnlocked && !isAnswered && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <Box
                  sx={{
                    bgcolor: 'rgba(99,102,241,0.05)',
                    border: '2px dashed rgba(99,102,241,0.28)',
                    borderRadius: 4,
                    p: { xs: 3, md: 4 },
                    textAlign: 'center',
                  }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  >
                    <Typography sx={{ fontSize: '3rem', lineHeight: 1, mb: 1.5 }}>👀</Typography>
                  </motion.div>
                  <Typography
                    sx={{ fontWeight: 800, color: '#6366f1', fontSize: '1.1rem', mb: 0.75 }}
                  >
                    Watch the scene carefully…
                  </Typography>
                  <Typography sx={{ color: '#6b7280', fontSize: '0.9rem', mb: 2 }}>
                    Choices unlock in{' '}
                    <Box component="span" sx={{ color: '#6366f1', fontWeight: 800 }}>
                      {watchSecondsLeft}s
                    </Box>
                  </Typography>
                  {/* Watch timer progress bar */}
                  <Box
                    sx={{
                      bgcolor: 'rgba(99,102,241,0.12)',
                      borderRadius: 99,
                      height: 8,
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        height: '100%',
                        bgcolor: '#6366f1',
                        borderRadius: 99,
                        width: `${watchProgress}%`,
                        transition: 'width 1s linear',
                      }}
                    />
                  </Box>
                </Box>
              </motion.div>
            )}

            {/* Choices */}
            {choicesUnlocked && !isAnswered && (
              <Box>
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    color: '#9ca3af',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    mb: 1.75,
                  }}
                >
                  What would you do?
                </Typography>
                <Stack spacing={1.5}>
                  {currentScenario.choices.map((choice, i) => (
                    <motion.div
                      key={choice.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07, type: 'spring', stiffness: 300, damping: 26 }}
                    >
                      <ChoiceButton
                        choice={choice}
                        state="idle"
                        onClick={() => handleChoiceClick(choice.id, choice.isCorrect)}
                      />
                    </motion.div>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Feedback */}
            {isAnswered && isTriplet && (
              <Box
                sx={{
                  borderRadius: 4,
                  p: { xs: 2.5, md: 3 },
                  border: '2px solid rgba(15,23,42,0.12)',
                  background: 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)',
                  boxShadow: '0 8px 24px rgba(30,64,175,0.14)',
                }}
              >
                <Typography sx={{ fontWeight: 800, color: '#1e3a8a', mb: 0.6 }}>
                  {answerState === 'correct' ? '✅ Correct choice' : '❌ Wrong choice'}
                </Typography>
                <Typography sx={{ color: '#475569', fontSize: '0.92rem', mb: 1.8 }}>
                  {selectedChoice
        ? `${selectedChoice.feedbackEmoji} ${selectedChoice.feedback}`
        : 'The result video is now playing. Continue when you are ready.'}
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleNext}
                  sx={{
                    bgcolor: answerState === 'correct' ? '#2563eb' : '#dc2626',
                    '&:hover': { bgcolor: answerState === 'correct' ? '#1d4ed8' : '#b91c1c' },
                    borderRadius: 99,
                    fontWeight: 800,
                  }}
                >
                  {isLastScenario || !!lastResult ? '🏆 See Results!' : 'Next ➡️'}
                </Button>
              </Box>
            )}

            {isAnswered && selectedChoice && !isTriplet && (
              <FeedbackOverlay
                isCorrect={answerState === 'correct'}
                choice={selectedChoice}
                tip={currentScenario.tip}
                onNext={handleNext}
                isLastScenario={isLastScenario || !!lastResult}
              />
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

// ── StatPill ────────────────────────────────────────────────────────────────
function StatPill({ label, isAlert = false }: { label: string; isAlert?: boolean }) {
  return (
    <Box
      sx={{
        bgcolor: isAlert ? 'rgba(220,38,38,0.82)' : 'rgba(255,255,255,0.08)',
        border: `1px solid ${isAlert ? 'rgba(239,68,68,0.55)' : 'rgba(255,255,255,0.11)'}`,
        color: '#fff',
        fontWeight: 700,
        fontSize: '0.8rem',
        px: 1.5,
        py: 0.55,
        borderRadius: 99,
        whiteSpace: 'nowrap',
        transition: 'background 0.3s, border-color 0.3s',
        animation: isAlert ? 'gspulse 0.7s ease-in-out infinite' : 'none',
        '@keyframes gspulse': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.6 },
        },
      }}
    >
      {label}
    </Box>
  )
}
