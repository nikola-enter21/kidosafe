import type { CategoryId } from '@/shared/types/game'
import type { Scenario } from './types'

export interface ContentDataset {
  version: 1
  categories: CategoryId[]
  scenariosByCategory: Record<CategoryId, Scenario[]>
}

export type ContentImportResult =
  | { ok: true }
  | { ok: false; error: string }
