import { useGameStore } from '@/entities/game/model/gameStore'
import { CategoriesPage } from '@/pages/categories/ui/CategoriesPage'
import { EditorPage } from '@/pages/editor/ui/EditorPage'
import { GamePage } from '@/pages/game/ui/GamePage'
import { HomePage } from '@/pages/home/ui/HomePage'
import { ResultPage } from '@/pages/result/ui/ResultPage'

export function AppRouter() {
  const screen = useGameStore(s => s.screen)

  switch (screen) {
    case 'home':       return <HomePage />
    case 'categories': return <CategoriesPage />
    case 'editor':     return <EditorPage />
    case 'game':       return <GamePage />
    case 'result':     return <ResultPage />
    default:           return <HomePage />
  }
}
