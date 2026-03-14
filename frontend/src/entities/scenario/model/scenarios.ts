import type { CategoryId } from '@/shared/types/game'

import {
  getScenarioById as getScenarioByIdFromRepository,
  getScenariosByCategory as getScenariosByCategoryFromRepository,
} from '@/entities/scenario/model/contentRepository'
import type { Scenario } from './types'

export function getScenariosByCategory(category: CategoryId): Scenario[] {
  return getScenariosByCategoryFromRepository(category)
}

export function getScenarioById(id: string): Scenario | undefined {
  return getScenarioByIdFromRepository(id)
}
