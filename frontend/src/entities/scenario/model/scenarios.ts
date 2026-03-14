import type { CategoryId } from '@/shared/types/game'

import {
  getScenarioById as getScenarioByIdFromRepository,
  getScenariosByCategory as getScenariosByCategoryFromRepository,
} from '@/entities/scenario/model/contentRepository'
import type { Scenario } from './types'

export async function getScenariosByCategory(category: CategoryId): Promise<Scenario[]> {
  return getScenariosByCategoryFromRepository(category)
}

export async function getScenarioById(id: string): Promise<Scenario | undefined> {
  return getScenarioByIdFromRepository(id)
}
