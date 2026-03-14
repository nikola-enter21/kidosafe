import { useCallback, useRef } from 'react'
import { Sounds } from '@/shared/lib/sounds'

export function useSound() {
  const enabledRef = useRef(true)

  const play = useCallback((name: keyof typeof Sounds) => {
    if (!enabledRef.current) return
    Sounds[name]()
  }, [])

  const toggleMute = useCallback(() => {
    enabledRef.current = !enabledRef.current
  }, [])

  return { play, toggleMute }
}
