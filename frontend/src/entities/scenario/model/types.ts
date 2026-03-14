import type { CategoryId } from '@/shared/types/game'

export interface Choice {
  id: string
  text: string
  emoji: string
  isCorrect: boolean
  feedback: string
  feedbackEmoji: string
}

export interface SceneConfig {
  background: string
  emoji: string
  label: string
}

export interface Scenario {
  id: string
  category: CategoryId
  scene: SceneConfig
  question: string
  watchTime: number
  tip: string
  choices: Choice[]
  videoUrl?: string
  questionVideoUrl?: string
  wrongVideoUrl?: string
  correctVideoUrl?: string
  imageUrl?: string
}
