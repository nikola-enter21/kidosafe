

let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  return ctx
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  gain = 0.3,
  delay = 0,
) {
  try {
    const audioCtx = getCtx()
    const osc = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()

    osc.connect(gainNode)
    gainNode.connect(audioCtx.destination)

    osc.type = type
    osc.frequency.setValueAtTime(frequency, audioCtx.currentTime + delay)
    gainNode.gain.setValueAtTime(gain, audioCtx.currentTime + delay)
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + duration)

    osc.start(audioCtx.currentTime + delay)
    osc.stop(audioCtx.currentTime + delay + duration)
  } catch {
    // Silently fail — audio not critical
  }
}

export const Sounds = {
  correct: () => {
    playTone(523, 0.15, 'sine', 0.3)       // C5
    playTone(659, 0.15, 'sine', 0.3, 0.15) // E5
    playTone(784, 0.3, 'sine', 0.3, 0.3)   // G5
  },
  wrong: () => {
    playTone(300, 0.1, 'sawtooth', 0.2)
    playTone(200, 0.25, 'sawtooth', 0.2, 0.12)
  },
  unlock: () => {
    playTone(880, 0.08, 'sine', 0.15)
    playTone(1100, 0.12, 'sine', 0.15, 0.1)
  },
  tick: () => {
    playTone(440, 0.05, 'square', 0.05)
  },
  levelUp: () => {
    [523, 659, 784, 1047].forEach((f, i) => {
      playTone(f, 0.15, 'sine', 0.25, i * 0.12)
    })
  },
}
