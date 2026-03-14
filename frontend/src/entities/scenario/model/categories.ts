import type { CategoryId } from '@/shared/types/game'

export interface Category {
  id: CategoryId
  label: string
  emoji: string
  color: string           // primary bg color
  colorLight: string      // light variant for cards
  colorDark: string       // dark variant for text/borders
  description: string
  scenarioCount: number
}

export const CATEGORIES: Category[] = [
  {
    id: 'home-alone',
    label: 'Home Alone',
    emoji: '🏠',
    color: '#FF6B6B',
    colorLight: '#FFE8E8',
    colorDark: '#C0392B',
    description: 'Learn to stay safe when you\'re home alone!',
    scenarioCount: 5,
  },
  {
    id: 'stranger',
    label: 'Stranger Safety',
    emoji: '🛡️',
    color: '#F7B731',
    colorLight: '#FFF8E1',
    colorDark: '#D68910',
    description: 'What to do when you meet someone you don\'t know!',
    scenarioCount: 5,
  },
  {
    id: 'internet',
    label: 'Internet Safety',
    emoji: '💻',
    color: '#4ECDC4',
    colorLight: '#E0F9F7',
    colorDark: '#1A9E96',
    description: 'Stay safe and smart online!',
    scenarioCount: 5,
  },
  {
    id: 'school',
    label: 'School Safety',
    emoji: '🎒',
    color: '#A29BFE',
    colorLight: '#EEEEFF',
    colorDark: '#6C5CE7',
    description: 'Be safe and kind at school every day!',
    scenarioCount: 5,
  },
]

export function getCategoryById(id: CategoryId): Category {
  const cat = CATEGORIES.find(c => c.id === id)
  if (!cat) throw new Error(`Category "${id}" not found`)
  return cat
}
