import { create } from 'zustand'

import { getScenariosByCategory } from '@/entities/scenario/model/scenarios'
import type { AnswerRecord, CategoryId, GameResult, Screen } from '@/shared/types/game'
import type { Scenario } from '@/entities/scenario/model/types'

const MAX_LIVES = 3
const POINTS_CORRECT = 100
const STREAK_BONUS = 50

interface GameStore {
  screen: Screen
  selectedCategory: CategoryId | null
  scenarios: Scenario[]
  currentIndex: number
  lives: number
  score: number
  streak: number
  answers: AnswerRecord[]
  lastResult: GameResult | null

  goToScreen: (screen: Screen) => void
  selectCategory: (id: CategoryId) => void
  submitAnswer: (choiceId: string, isCorrect: boolean, timeMs: number) => void
  nextScenario: () => void
  restartCategory: () => void
  goHome: () => void
}

function calcStars(correct: number, total: number): 1 | 2 | 3 {
  const pct = correct / total
  if (pct >= 0.8) return 3
  if (pct >= 0.5) return 2
  return 1
}

export const useGameStore = create<GameStore>((set, get) => ({
  screen: 'home',
  selectedCategory: null,
  scenarios: [],
  currentIndex: 0,
  lives: MAX_LIVES,
  score: 0,
  streak: 0,
  answers: [],
  lastResult: null,

  goToScreen: (screen) => set({ screen }),

  selectCategory: (id) => {
    const scenarios = getScenariosByCategory(id)
    set({
      selectedCategory: id,
      scenarios,
      currentIndex: 0,
      lives: MAX_LIVES,
      score: 0,
      streak: 0,
      answers: [],
      lastResult: null,
      screen: 'game',
    })
  },

  submitAnswer: (choiceId, isCorrect, timeMs) => {
    const { scenarios, currentIndex, score, streak, lives, selectedCategory, answers } = get()
    const scenario = scenarios[currentIndex]

    const newStreak = isCorrect ? streak + 1 : 0
    const bonus = isCorrect && newStreak > 1 ? STREAK_BONUS * (newStreak - 1) : 0
    const newScore = isCorrect ? score + POINTS_CORRECT + bonus : score
    const newLives = isCorrect ? lives : Math.max(0, lives - 1)

    const record: AnswerRecord = {
      scenarioId: scenario.id,
      choiceId,
      isCorrect,
      timeMs,
    }

    const newAnswers = [...answers, record]
    const isLastScenario = currentIndex === scenarios.length - 1
    const isGameOver = newLives === 0

    if (isLastScenario || isGameOver) {
      const correctCount = newAnswers.filter(a => a.isCorrect).length
      const result: GameResult = {
        category: selectedCategory!,
        totalScenarios: scenarios.length,
        correctAnswers: correctCount,
        score: newScore,
        stars: calcStars(correctCount, scenarios.length),
        answers: newAnswers,
      }
      set({ lives: newLives, score: newScore, streak: newStreak, answers: newAnswers, lastResult: result })
    } else {
      set({ lives: newLives, score: newScore, streak: newStreak, answers: newAnswers })
    }
  },

  nextScenario: () => {
    const { currentIndex, scenarios, lives, lastResult } = get()
    if (lastResult || lives === 0 || currentIndex >= scenarios.length - 1) {
      set({ screen: 'result' })
      return
    }
    set({ currentIndex: currentIndex + 1 })
  },

  restartCategory: () => {
    const { selectedCategory } = get()
    if (selectedCategory) get().selectCategory(selectedCategory)
  },

  goHome: () =>
    set({
      screen: 'home',
      selectedCategory: null,
      scenarios: [],
      currentIndex: 0,
      lives: MAX_LIVES,
      score: 0,
      streak: 0,
      answers: [],
      lastResult: null,
    }),
}))
