import { useCallback, useEffect, useRef, useState } from 'react'

interface UseTimerOptions {
  initialSeconds: number
  onExpire?: () => void
  autoStart?: boolean
}

export function useTimer({ initialSeconds, onExpire, autoStart = true }: UseTimerOptions) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds)
  const [isRunning, setIsRunning] = useState(autoStart)
  const [isExpired, setIsExpired] = useState(false)
  const startTimeRef = useRef<number>(Date.now())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    startTimeRef.current = Date.now()
    setSecondsLeft(initialSeconds)
    setIsExpired(false)
    setIsRunning(true)
  }, [initialSeconds])

  const stop = useCallback(() => {
    clear()
    setIsRunning(false)
  }, [clear])

  const getElapsedMs = useCallback(() => {
    return Date.now() - startTimeRef.current
  }, [])

  useEffect(() => {
    if (!isRunning) return

    startTimeRef.current = Date.now()

    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clear()
          setIsRunning(false)
          setIsExpired(true)
          onExpire?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return clear
  }, [isRunning, clear, onExpire])

  return { secondsLeft, isRunning, isExpired, start, stop, getElapsedMs }
}
