import { create } from 'zustand'

import { getCategoryScenarios, getOrCreatePlayer, recordSession } from '@/shared/api/contentApi'
import type { AnswerRecord, CategoryId, GameResult, Player, Screen } from '@/shared/types/game'
import type { Scenario } from '@/entities/scenario/model/types'

const MAX_LIVES = 3
const POINTS_CORRECT = 100
const STREAK_BONUS = 50

const LS_PLAYER_ID = 'kidosafe_player_id'
const LS_USERNAME = 'kidosafe_username'

// ── Load persisted player from localStorage ──────────────────────────────────
function loadPersistedPlayer(): { playerId: number | null; playerUsername: string | null } {
  try {
    const id = localStorage.getItem(LS_PLAYER_ID)
    const username = localStorage.getItem(LS_USERNAME)
    if (id && username) return { playerId: Number(id), playerUsername: username }
  } catch { /* ignore */ }
  return { playerId: null, playerUsername: null }
}

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
  isLoadingScenarios: boolean

  // Player
  playerId: number | null
  playerUsername: string | null
  isSettingPlayer: boolean
  setPlayer: (username: string) => Promise<void>
  clearPlayer: () => void

  goToScreen: (screen: Screen) => void
  selectCategory: (id: CategoryId) => Promise<void>
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

const { playerId: persistedId, playerUsername: persistedUsername } = loadPersistedPlayer()

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
  isLoadingScenarios: false,

  // ── Player ─────────────────────────────────────────────────────────────────
  playerId: persistedId,
  playerUsername: persistedUsername,
  isSettingPlayer: false,

  setPlayer: async (username: string) => {
    const trimmed = username.trim()
    if (!trimmed) return
    set({ isSettingPlayer: true })
    try {
      const player: Player = await getOrCreatePlayer(trimmed)
      localStorage.setItem(LS_PLAYER_ID, String(player.id))
      localStorage.setItem(LS_USERNAME, player.username)
      set({ playerId: player.id, playerUsername: player.username, isSettingPlayer: false })
    } catch {
      set({ isSettingPlayer: false })
    }
  },

  clearPlayer: () => {
    localStorage.removeItem(LS_PLAYER_ID)
    localStorage.removeItem(LS_USERNAME)
    set({ playerId: null, playerUsername: null })
  },

  // ── Navigation ─────────────────────────────────────────────────────────────
  goToScreen: (screen) => set({ screen }),

  selectCategory: async (id) => {
    set({ isLoadingScenarios: true })
    try {
      const scenarios = await getCategoryScenarios(id)
      if (scenarios.length === 0) {
        set({ isLoadingScenarios: false })
        return
      }
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
        isLoadingScenarios: false,
      })
    } catch {
      set({ isLoadingScenarios: false })
    }
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
    const { currentIndex, scenarios, lives, lastResult, playerId, score, selectedCategory, answers } = get()
    const shouldEnd = lastResult || lives === 0 || currentIndex >= scenarios.length - 1

    if (shouldEnd) {
      // Record session to backend if player is logged in
      if (playerId && selectedCategory) {
        const correctCount = answers.filter(a => a.isCorrect).length
        void recordSession(playerId, {
          categoryId: selectedCategory,
          correctAnswers: correctCount,
          totalAnswers: answers.length,
          pointsEarned: score,
        })
      }
      set({ screen: 'result' })
      return
    }
    set({ currentIndex: currentIndex + 1 })
  },

  restartCategory: () => {
    const { selectedCategory } = get()
    if (selectedCategory) void get().selectCategory(selectedCategory)
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
