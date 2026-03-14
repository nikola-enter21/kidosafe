/**
 * Content repository – all data comes from the Python backend.
 * No local seed file, no localStorage. Pure API calls.
 */
import { CATEGORIES } from '@/entities/scenario/model/categories'
import type { ContentDataset, ContentImportResult } from '@/entities/scenario/model/contentTypes'
import type { Scenario } from '@/entities/scenario/model/types'
import type { CategoryId } from '@/shared/types/game'
import {
  getCategoryScenarios,
  getScenario as getScenarioFromApi,
  getCategories,
  exportDatasetFromApi,
  createScenario as createScenarioApi,
  updateScenario as updateScenarioApi,
  deleteScenario as deleteScenarioApi,
} from '@/shared/api/contentApi'

const CATEGORY_IDS = CATEGORIES.map(c => c.id) as CategoryId[]

// ─────────────────────────────────────────────────────────────────────────────
// Game helpers
// ─────────────────────────────────────────────────────────────────────────────

export async function getScenariosByCategory(categoryId: CategoryId): Promise<Scenario[]> {
  return getCategoryScenarios(categoryId)
}

export async function getScenarioById(id: string): Promise<Scenario | undefined> {
  try {
    return await getScenarioFromApi(id)
  } catch {
    return undefined
  }
}

export async function getScenarioCountByCategory(categoryId: CategoryId): Promise<number> {
  const categories = await getCategories()
  return categories.find(c => c.id === categoryId)?.scenarioCount ?? 0
}

export async function getTotalScenarioCount(): Promise<number> {
  const categories = await getCategories()
  return categories.reduce((sum, c) => sum + c.scenarioCount, 0)
}

// ─────────────────────────────────────────────────────────────────────────────
// Editor helpers
// ─────────────────────────────────────────────────────────────────────────────

export async function getActiveDataset(): Promise<ContentDataset> {
  const exported = await exportDatasetFromApi()
  return {
    version: 1,
    categories: [...CATEGORY_IDS],
    scenariosByCategory: {
      'home-alone': exported.scenariosByCategory['home-alone'] ?? [],
      stranger: exported.scenariosByCategory['stranger'] ?? [],
      internet: exported.scenariosByCategory['internet'] ?? [],
      school: exported.scenariosByCategory['school'] ?? [],
    },
  }
}

export async function exportDataset(): Promise<string> {
  const exported = await exportDatasetFromApi()
  return JSON.stringify(exported, null, 2)
}

export async function saveDataset(dataset: ContentDataset): Promise<void> {
  // Fetch current backend state to diff against
  const current = await exportDatasetFromApi()

  const backendIds = new Set<string>()
  for (const catId of CATEGORY_IDS) {
    for (const s of current.scenariosByCategory[catId] ?? []) {
      backendIds.add(s.id)
    }
  }

  const newIds = new Set<string>()
  for (const catId of CATEGORY_IDS) {
    for (const s of dataset.scenariosByCategory[catId] ?? []) {
      newIds.add(s.id)
    }
  }

  // Delete scenarios that were removed
  for (const id of backendIds) {
    if (!newIds.has(id)) {
      await deleteScenarioApi(id)
    }
  }

  // Create new or update existing scenarios
  for (const catId of CATEGORY_IDS) {
    const scenarios = dataset.scenariosByCategory[catId] ?? []
    for (const scenario of scenarios) {
      if (backendIds.has(scenario.id)) {
        await updateScenarioApi(scenario.id, scenario)
      } else {
        await createScenarioApi(scenario as Parameters<typeof createScenarioApi>[0])
      }
    }
  }
}

export async function importDataset(jsonText: string): Promise<ContentImportResult> {
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    return { ok: false, error: 'Invalid JSON file.' }
  }

  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, error: 'Dataset must be a JSON object.' }
  }

  const data = parsed as Record<string, unknown>
  if (data.version !== 1) {
    return { ok: false, error: 'Unsupported dataset version. Expected 1.' }
  }
  if (!data.scenariosByCategory || typeof data.scenariosByCategory !== 'object') {
    return { ok: false, error: 'scenariosByCategory must be an object.' }
  }

  try {
    const sbC = data.scenariosByCategory as Record<string, unknown>
    const dataset: ContentDataset = {
      version: 1,
      categories: [...CATEGORY_IDS],
      scenariosByCategory: {
        'home-alone': (Array.isArray(sbC['home-alone']) ? sbC['home-alone'] : []) as Scenario[],
        stranger: (Array.isArray(sbC['stranger']) ? sbC['stranger'] : []) as Scenario[],
        internet: (Array.isArray(sbC['internet']) ? sbC['internet'] : []) as Scenario[],
        school: (Array.isArray(sbC['school']) ? sbC['school'] : []) as Scenario[],
      },
    }
    await saveDataset(dataset)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to import dataset.' }
  }
}
