import { useCallback, useEffect, useState } from 'react'

import { useGameStore } from '@/entities/game/model/gameStore'
import { useSound } from './useSound'
import { useTimer } from './useTimer'

type AnswerState = 'idle' | 'correct' | 'wrong'

export function useGameState() {
  const store = useGameStore()
  const { play } = useSound()
  const [answerState, setAnswerState] = useState<AnswerState>('idle')
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null)
  const [choicesUnlocked, setChoicesUnlocked] = useState(false)

  const currentScenario = store.scenarios[store.currentIndex] ?? null

  const watchTime = currentScenario?.watchTime ?? 4

  const timer = useTimer({
    initialSeconds: 15,
    autoStart: false,
  })

  const watchTimer = useTimer({
    initialSeconds: watchTime,
    autoStart: false,
    onExpire: () => {
      setChoicesUnlocked(true)
      play('unlock')
      timer.start()
    },
  })

  // Reset when scenario changes
  useEffect(() => {
    if (!currentScenario) return
    setAnswerState('idle')
    setSelectedChoiceId(null)
    setChoicesUnlocked(false)
    watchTimer.start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.currentIndex, currentScenario?.id])

  const handleChoiceClick = useCallback(
    (choiceId: string, isCorrect: boolean) => {
      if (answerState !== 'idle' || !choicesUnlocked) return

      const elapsed = timer.getElapsedMs()
      timer.stop()
      watchTimer.stop()

      setSelectedChoiceId(choiceId)
      setAnswerState(isCorrect ? 'correct' : 'wrong')

      if (isCorrect) {
        play('correct')
      } else {
        play('wrong')
      }

      store.submitAnswer(choiceId, isCorrect, elapsed)
    },
    [answerState, choicesUnlocked, timer, watchTimer, play, store],
  )

  const handleNext = useCallback(() => {
    store.nextScenario()
  }, [store])

  return {
    currentScenario,
    currentIndex: store.currentIndex,
    totalScenarios: store.scenarios.length,
    lives: store.lives,
    score: store.score,
    streak: store.streak,
    lastResult: store.lastResult,
    answerState,
    selectedChoiceId,
    choicesUnlocked,
    secondsLeft: timer.secondsLeft,
    watchSecondsLeft: watchTimer.secondsLeft,
    handleChoiceClick,
    handleNext,
    goHome: store.goHome,
  }
}
