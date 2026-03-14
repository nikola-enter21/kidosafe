export type Screen = 'home' | 'categories' | 'game' | 'result'

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
