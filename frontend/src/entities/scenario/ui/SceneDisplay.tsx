import { Box, Typography } from '@mui/material'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import type { SceneConfig } from '@/entities/scenario/model/types'

interface SceneDisplayProps {
  scene: SceneConfig
  videoUrl?: string
  imageUrl?: string
  /** When true the video freezes at its current frame — pass !choicesUnlocked */
  shouldPause?: boolean
}

export function SceneDisplay({ scene, videoUrl, imageUrl, shouldPause = false }: SceneDisplayProps) {

  if (videoUrl) {
    return (
      <VideoScene
        key={videoUrl}
        videoUrl={videoUrl}
        label={scene.label}
        shouldPause={shouldPause}
      />
    )
  }

  if (imageUrl) {
    return (
      <Box
        sx={{
          width: '100%', height: '100%',
          position: 'relative', overflow: 'hidden', bgcolor: '#111',
        }}
      >
        <Box
          component="img"
          src={imageUrl}
          alt={scene.label}
          sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        <SceneLabel label={scene.label} />
      </Box>
    )
  }


  return (
    <Box
      sx={{
        width: '100%', height: '100%',
        background: scene.background,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }}
    >
      <Box sx={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 25% 40%, rgba(255,255,255,0.22) 0%, transparent 65%)',
      }} />
      <motion.div
        key={scene.emoji}
        initial={{ scale: 0.55, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 16 }}
      >
        <Typography
          sx={{
            fontSize: 'clamp(4.5rem, 18vw, 8rem)',
            lineHeight: 1,
            filter: 'drop-shadow(0 10px 28px rgba(0,0,0,0.28))',
          }}
        >
          {scene.emoji}
        </Typography>
      </motion.div>
      <SceneLabel label={scene.label} />
    </Box>
  )
}


interface VideoSceneProps {
  videoUrl: string
  label: string
  shouldPause: boolean
}

function VideoScene({ videoUrl, label, shouldPause }: VideoSceneProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [soundBlocked, setSoundBlocked] = useState(false)

  // On mount: try to play WITH sound (user already clicked to get here)
  useEffect(() => {
    const vid = videoRef.current
    if (!vid) return

    vid.muted = false
    vid.volume = 1.0

    vid.play().catch(() => {
      // Browser blocked unmuted autoplay → fall back to muted
      vid.muted = true
      setSoundBlocked(true)
      vid.play().catch(() => {})
    })
  }, [videoUrl])

  // Pause / resume when choices unlock
  useEffect(() => {
    const vid = videoRef.current
    if (!vid) return
    if (shouldPause) {
      vid.pause()
    } else if (vid.paused) {
      vid.play().catch(() => {})
    }
  }, [shouldPause])

  const handleUnmute = () => {
    const vid = videoRef.current
    if (!vid) return
    vid.muted = false
    vid.volume = 1.0
    setSoundBlocked(false)
  }

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative', bgcolor: '#000', overflow: 'hidden' }}>
      <video
        ref={videoRef}
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      >
        <source src={videoUrl} type="video/mp4" />
        <source src={videoUrl} type="video/webm" />
      </video>

      {soundBlocked && !shouldPause && (
        <Box
          onClick={handleUnmute}
          sx={{
            position: 'absolute', top: 12, right: 12,
            bgcolor: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(6px)',
            border: '1.5px solid rgba(255,255,255,0.25)',
            borderRadius: 99,
            px: 1.5, py: 0.5,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 0.75,
            zIndex: 5,
            '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' },
          }}
        >
          <Typography sx={{ fontSize: '1rem' }}>🔇</Typography>
          <Typography sx={{ color: '#fff', fontSize: '0.72rem', fontWeight: 700 }}>
            Tap for sound
          </Typography>
        </Box>
      )}

      {shouldPause && (
        <Box
          sx={{
            position: 'absolute', inset: 0,
            bgcolor: 'rgba(0,0,0,0.2)',
            transition: 'opacity 0.4s',
          }}
        />
      )}

      <SceneLabel label={label} />
    </Box>
  )
}


function SceneLabel({ label }: { label: string }) {
  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 54,
        left: '50%',
        transform: 'translateX(-50%)',
        bgcolor: 'rgba(0,0,0,0.38)',
        backdropFilter: 'blur(6px)',
        color: 'rgba(255,255,255,0.85)',
        fontWeight: 700,
        fontSize: '0.68rem',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        px: 2, py: 0.4,
        borderRadius: 99,
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
      }}
    >
      {label}
    </Box>
  )
}
