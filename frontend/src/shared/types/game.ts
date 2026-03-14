export type Screen = 'home' | 'categories' | 'game' | 'result' | 'editor'

export type GameMode = 'free' | 'smart'

export interface PlayerCategoryStat {
  categoryId: CategoryId
  totalAnswers: number
  correctAnswers: number
}

export interface Player {
  id: number
  username: string
  totalPoints: number
  categoryStats: PlayerCategoryStat[]
}

export type CategoryId = 'home-alone' | 'stranger' | 'internet' | 'school'

export interface AnswerRecord {
  scenarioId: string
  choiceId: string
  isCorrect: boolean
  timeMs: number
}

export interface GameState {
  screen: Screen
  selectedCategory: CategoryId | null
  currentScenarioIndex: number
  lives: number
  score: number
  streak: number
  answers: AnswerRecord[]
}

export interface GameResult {
  category: CategoryId
  totalScenarios: number
  correctAnswers: number
  score: number
  stars: 1 | 2 | 3
  answers: AnswerRecord[]
}
