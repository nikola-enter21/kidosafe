import { create } from 'zustand'

import { getCategoryScenarios, getNextCategory, getOrCreatePlayer, recordSession } from '@/shared/api/contentApi'
import { CATEGORIES } from '@/entities/scenario/model/categories'
import type { Scenario } from '@/entities/scenario/model/types'
import type {
  AnswerRecord,
  CategoryId,
  GameMode,
  GameResult,
  Player,
  PlayerCategoryStat,
  Screen,
} from '@/shared/types/game'

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

// ── Smart mode helpers ────────────────────────────────────────────────────────

/** Build ratio map from persisted stats + current session stats */
function buildRatios(
  persisted: PlayerCategoryStat[],
  session: Partial<Record<CategoryId, { correct: number; total: number }>>,
): Record<string, number> {
  const result: Record<string, number> = {}
  for (const cat of CATEGORIES) {
    const p = persisted.find(s => s.categoryId === cat.id)
    const s = session[cat.id]
    const correct = (p?.correctAnswers ?? 0) + (s?.correct ?? 0)
    const total = (p?.totalAnswers ?? 0) + (s?.total ?? 0)
    result[cat.id] = total > 0 ? correct / total : 0
  }
  return result
}

/** Fallback: category with the lowest ratio (player needs most practice there) */
function pickLowestRatioCategory(ratio: Record<string, number>): CategoryId {
  return CATEGORIES.reduce((a, b) =>
    (ratio[a.id] ?? 0) <= (ratio[b.id] ?? 0) ? a : b,
  ).id
}

/** Find any unplayed scenario across all cached categories */
function findAnyUnplayed(
  cache: Partial<Record<CategoryId, Scenario[]>>,
  played: Set<string>,
): { scenario: Scenario; categoryId: CategoryId } | null {
  for (const [catId, scenarios] of Object.entries(cache) as [CategoryId, Scenario[]][]) {
    const s = scenarios.find(sc => !played.has(sc.id))
    if (s) return { scenario: s, categoryId: catId }
  }
  return null
}

/** Build a GameResult summary for smart mode (spans multiple categories) */
function buildSmartResult(answers: AnswerRecord[], score: number): GameResult {
  const correctCount = answers.filter(a => a.isCorrect).length
  const total = answers.length || 1
  return {
    category: 'home-alone', // placeholder — smart mode spans all categories
    totalScenarios: total,
    correctAnswers: correctCount,
    score,
    stars: calcStars(correctCount, total),
    answers,
  }
}

function calcStars(correct: number, total: number): 1 | 2 | 3 {
  const pct = correct / total
  if (pct >= 0.8) return 3
  if (pct >= 0.5) return 2
  return 1
}

// ─────────────────────────────────────────────────────────────────────────────

interface GameStore {
  screen: Screen
  gameMode: GameMode
  selectedCategory: CategoryId | null
  scenarios: Scenario[]
  currentIndex: number
  lives: number
  score: number
  streak: number
  answers: AnswerRecord[]
  lastResult: GameResult | null
  isLoadingScenarios: boolean
  isLoadingNextScenario: boolean

  // Player
  playerId: number | null
  playerUsername: string | null
  playerCategoryStats: PlayerCategoryStat[]
  isSettingPlayer: boolean
  setPlayer: (username: string) => Promise<void>
  clearPlayer: () => void

  // Smart mode state
  smartPlayedScenarioIds: Set<string>
  smartCategoryCache: Partial<Record<CategoryId, Scenario[]>>
  mlSessionStats: Partial<Record<CategoryId, { correct: number; total: number }>>

  goToScreen: (screen: Screen) => void
  selectCategory: (id: CategoryId) => Promise<void>
  startSmartMode: () => void
  loadNextSmartScenario: () => Promise<void>
  submitAnswer: (choiceId: string, isCorrect: boolean, timeMs: number) => void
  nextScenario: () => void
  restartCategory: () => void
  goHome: () => void
}

const { playerId: persistedId, playerUsername: persistedUsername } = loadPersistedPlayer()

export const useGameStore = create<GameStore>((set, get) => ({
  screen: 'home',
  gameMode: 'free',
  selectedCategory: null,
  scenarios: [],
  currentIndex: 0,
  lives: MAX_LIVES,
  score: 0,
  streak: 0,
  answers: [],
  lastResult: null,
  isLoadingScenarios: false,
  isLoadingNextScenario: false,

  // ── Player ─────────────────────────────────────────────────────────────────
  playerId: persistedId,
  playerUsername: persistedUsername,
  playerCategoryStats: [],
  isSettingPlayer: false,

  // ── Smart mode state ───────────────────────────────────────────────────────
  smartPlayedScenarioIds: new Set(),
  smartCategoryCache: {},
  mlSessionStats: {},

  setPlayer: async (username: string) => {
    const trimmed = username.trim()
    if (!trimmed) return
    set({ isSettingPlayer: true })
    try {
      const player: Player = await getOrCreatePlayer(trimmed)
      localStorage.setItem(LS_PLAYER_ID, String(player.id))
      localStorage.setItem(LS_USERNAME, player.username)
      set({
        playerId: player.id,
        playerUsername: player.username,
        playerCategoryStats: player.categoryStats ?? [],
        isSettingPlayer: false,
      })
    } catch {
      set({ isSettingPlayer: false })
    }
  },

  clearPlayer: () => {
    localStorage.removeItem(LS_PLAYER_ID)
    localStorage.removeItem(LS_USERNAME)
    set({ playerId: null, playerUsername: null, playerCategoryStats: [] })
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
        gameMode: 'free',
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

  // ── Smart Mode ─────────────────────────────────────────────────────────────
  startSmartMode: () => {
    set({
      gameMode: 'smart',
      screen: 'game',
      lives: MAX_LIVES,
      score: 0,
      streak: 0,
      answers: [],
      lastResult: null,
      smartPlayedScenarioIds: new Set(),
      smartCategoryCache: {},
      mlSessionStats: {},
      isLoadingNextScenario: true,
    })
    void get().loadNextSmartScenario()
  },

  loadNextSmartScenario: async () => {
    set({ isLoadingNextScenario: true })
    const { playerCategoryStats, mlSessionStats, smartPlayedScenarioIds, smartCategoryCache } = get()

    // 1. Build ratios from persisted stats + current session answers
    const ratio = buildRatios(playerCategoryStats, mlSessionStats)

    // 2. Ask ML which category to play next
    let categoryId: CategoryId
    try {
      const res = await getNextCategory(ratio)
      categoryId = res.next_category as CategoryId
    } catch (err) {
      console.error('[SmartMode] getNextCategory failed:', err)
      categoryId = pickLowestRatioCategory(ratio)
    }

    // 3. Ensure we have scenarios cached for this category
    if (!smartCategoryCache[categoryId]) {
      try {
        const scenarios = await getCategoryScenarios(categoryId)
        set(s => ({
          smartCategoryCache: { ...s.smartCategoryCache, [categoryId]: scenarios },
        }))
      } catch (err) {
        console.error('[SmartMode] Failed to load scenarios for', categoryId, err)
        set({ isLoadingNextScenario: false })
        return
      }
    }

    // 4. Filter out already-played scenarios from the suggested category
    const cache = get().smartCategoryCache
    const played = get().smartPlayedScenarioIds
    const available = (cache[categoryId] ?? []).filter(s => !played.has(s.id))

    let pickedScenario: Scenario
    let pickedCategory: CategoryId

    if (available.length > 0) {
      // Pick randomly from the ML-suggested category
      pickedScenario = available[Math.floor(Math.random() * available.length)]
      pickedCategory = categoryId
    } else {
      // ML's category is exhausted — find any unplayed scenario across all cached categories
      const fallback = findAnyUnplayed(cache, played)
      if (!fallback) {
        // All known scenarios are exhausted — end the game gracefully
        const { answers, score } = get()
        set({
          isLoadingNextScenario: false,
          lastResult: buildSmartResult(answers, score),
          screen: 'result',
        })
        return
      }
      pickedScenario = fallback.scenario
      pickedCategory = fallback.categoryId
    }

    set({
      selectedCategory: pickedCategory,
      scenarios: [pickedScenario],
      currentIndex: 0,
      isLoadingNextScenario: false,
    })
  },

  // ── Answer submission ──────────────────────────────────────────────────────
  submitAnswer: (choiceId, isCorrect, timeMs) => {
    const { scenarios, currentIndex, score, streak, lives, selectedCategory, answers, gameMode } = get()
    const scenario = scenarios[currentIndex]

    const newStreak = isCorrect ? streak + 1 : 0
    const bonus = isCorrect && newStreak > 1 ? STREAK_BONUS * (newStreak - 1) : 0
    const newScore = isCorrect ? score + POINTS_CORRECT + bonus : score
    const newLives = isCorrect ? lives : Math.max(0, lives - 1)
    const isGameOver = newLives === 0

    const record: AnswerRecord = {
      scenarioId: scenario.id,
      choiceId,
      isCorrect,
      timeMs,
    }
    const newAnswers = [...answers, record]

    if (gameMode === 'smart') {
      // Update per-category session stats for ratio calculation
      const catId = selectedCategory!
      const prev = get().mlSessionStats[catId] ?? { correct: 0, total: 0 }
      set(s => ({
        mlSessionStats: {
          ...s.mlSessionStats,
          [catId]: {
            correct: prev.correct + (isCorrect ? 1 : 0),
            total: prev.total + 1,
          },
        },
      }))

      if (isGameOver) {
        // Lives ran out — build result and let nextScenario handle the screen transition
        set({
          lives: 0,
          score: newScore,
          streak: newStreak,
          answers: newAnswers,
          lastResult: buildSmartResult(newAnswers, newScore),
        })
      } else {
        set({ lives: newLives, score: newScore, streak: newStreak, answers: newAnswers })
      }
      return
    }

    // ── Free mode ─────────────────────────────────────────────────────────────
    const isLastScenario = currentIndex === scenarios.length - 1

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
    const { currentIndex, scenarios, lives, lastResult, playerId, score, selectedCategory, answers, gameMode } = get()

    // ── Smart mode ────────────────────────────────────────────────────────────
    if (gameMode === 'smart') {
      if (lastResult || lives === 0) {
        // Game over — record sessions per category and go to result
        if (playerId) {
          const { mlSessionStats } = get()
          for (const [catId, stats] of Object.entries(mlSessionStats) as [CategoryId, { correct: number; total: number }][]) {
            void recordSession(playerId, {
              categoryId: catId,
              correctAnswers: stats.correct,
              totalAnswers: stats.total,
              pointsEarned: 0, // score is global; per-category split not tracked separately
            })
          }
        }
        set({ screen: 'result' })
        return
      }

      // Mark this scenario as played and load the next one
      const playedId = scenarios[currentIndex]?.id
      if (playedId) {
        set(s => ({
          smartPlayedScenarioIds: new Set([...s.smartPlayedScenarioIds, playedId]),
        }))
      }
      void get().loadNextSmartScenario()
      return
    }

    // ── Free mode ─────────────────────────────────────────────────────────────
    const shouldEnd = lastResult || lives === 0 || currentIndex >= scenarios.length - 1

    if (shouldEnd) {
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
      gameMode: 'free',
      selectedCategory: null,
      scenarios: [],
      currentIndex: 0,
      lives: MAX_LIVES,
      score: 0,
      streak: 0,
      answers: [],
      lastResult: null,
      smartPlayedScenarioIds: new Set(),
      smartCategoryCache: {},
      mlSessionStats: {},
      isLoadingNextScenario: false,
    }),
}))
