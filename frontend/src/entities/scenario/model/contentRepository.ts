import { CATEGORIES } from '@/entities/scenario/model/categories'
import type { ContentDataset, ContentImportResult } from '@/entities/scenario/model/contentTypes'
import type { Choice, Scenario, SceneConfig } from '@/entities/scenario/model/types'
import type { CategoryId } from '@/shared/types/game'

const DATASET_VERSION = 1
const STORAGE_KEY = 'kidosafe_content_v1'
const SEED_DATASET_URL = '/content/scenarios.v1.json'
const CHOICE_EMOJIS = ['1️⃣', '2️⃣', '3️⃣'] as const

let seedDataset: ContentDataset | null = null
let activeDataset: ContentDataset | null = null

const CATEGORY_IDS = CATEGORIES.map(c => c.id) as CategoryId[]
const CATEGORY_ID_SET = new Set<CategoryId>(CATEGORY_IDS)

function cloneDataset(dataset: ContentDataset): ContentDataset {
  return JSON.parse(JSON.stringify(dataset)) as ContentDataset
}

function createEmptyDataset(): ContentDataset {
  return {
    version: DATASET_VERSION,
    categories: [...CATEGORY_IDS],
    scenariosByCategory: {
      'home-alone': [],
      stranger: [],
      internet: [],
      school: [],
    },
  }
}

function fallbackScene(category: CategoryId): SceneConfig {
  const cat = CATEGORIES.find(c => c.id === category)
  if (!cat) {
    return {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      emoji: '🛡️',
      label: 'Safety scene',
    }
  }

  return {
    background: `linear-gradient(135deg, ${cat.colorLight} 0%, ${cat.color} 100%)`,
    emoji: cat.emoji,
    label: cat.label,
  }
}

function normalizeChoice(
  value: unknown,
  scenarioId: string,
  index: number,
): Choice | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Record<string, unknown>

  const text = typeof candidate.text === 'string' ? candidate.text.trim() : ''
  const isCorrect = candidate.isCorrect === true
  if (!text) return null

  const idCandidate =
    typeof candidate.id === 'string' && candidate.id.trim()
      ? candidate.id.trim()
      : `${scenarioId}-c${index + 1}`

  return {
    id: idCandidate,
    text,
    emoji:
      typeof candidate.emoji === 'string' && candidate.emoji.trim()
        ? candidate.emoji.trim()
        : CHOICE_EMOJIS[index] ?? '🔹',
    isCorrect,
    feedback:
      typeof candidate.feedback === 'string' && candidate.feedback.trim()
        ? candidate.feedback.trim()
        : isCorrect
        ? 'Great choice! That is the safest option.'
        : 'Not the safest option. Try again and stay safe!',
    feedbackEmoji:
      typeof candidate.feedbackEmoji === 'string' && candidate.feedbackEmoji.trim()
        ? candidate.feedbackEmoji.trim()
        : isCorrect
        ? '🌟'
        : '⚠️',
  }
}

function normalizeScenario(
  value: unknown,
  category: CategoryId,
  index: number,
): Scenario | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Record<string, unknown>

  const id = typeof candidate.id === 'string' ? candidate.id.trim() : ''
  const question = typeof candidate.question === 'string' ? candidate.question.trim() : ''
  const tip = typeof candidate.tip === 'string' ? candidate.tip.trim() : ''
  if (!id || !question || !tip) return null

  const categoryValue =
    typeof candidate.category === 'string'
      ? (candidate.category as CategoryId)
      : category
  if (categoryValue !== category || !CATEGORY_ID_SET.has(categoryValue)) return null

  const choicesInput = Array.isArray(candidate.choices) ? candidate.choices : null
  if (!choicesInput || choicesInput.length !== 3) return null

  const choices = choicesInput
    .map((choice, choiceIndex) => normalizeChoice(choice, id, choiceIndex))
    .filter((choice): choice is Choice => Boolean(choice))
  if (choices.length !== 3) return null

  const correctCount = choices.filter(choice => choice.isCorrect).length
  if (correctCount !== 1) return null

  const sceneCandidate =
    candidate.scene && typeof candidate.scene === 'object'
      ? (candidate.scene as Record<string, unknown>)
      : null
  const scene: SceneConfig = {
    background:
      typeof sceneCandidate?.background === 'string' && sceneCandidate.background.trim()
        ? sceneCandidate.background.trim()
        : fallbackScene(category).background,
    emoji:
      typeof sceneCandidate?.emoji === 'string' && sceneCandidate.emoji.trim()
        ? sceneCandidate.emoji.trim()
        : fallbackScene(category).emoji,
    label:
      typeof sceneCandidate?.label === 'string' && sceneCandidate.label.trim()
        ? sceneCandidate.label.trim()
        : `${fallbackScene(category).label} ${index + 1}`,
  }

  const watchTimeValue = candidate.watchTime
  const watchTime =
    typeof watchTimeValue === 'number' && Number.isFinite(watchTimeValue) && watchTimeValue > 0
      ? Math.floor(watchTimeValue)
      : 4

  const videoUrl =
    typeof candidate.videoUrl === 'string' && candidate.videoUrl.trim()
      ? candidate.videoUrl.trim()
      : undefined
  const imageUrl =
    typeof candidate.imageUrl === 'string' && candidate.imageUrl.trim()
      ? candidate.imageUrl.trim()
      : undefined

  return {
    id,
    category,
    scene,
    question,
    watchTime,
    tip,
    choices,
    ...(videoUrl ? { videoUrl } : {}),
    ...(imageUrl ? { imageUrl } : {}),
  }
}

type ValidationResult =
  | { ok: true; dataset: ContentDataset }
  | { ok: false; error: string }

function validateAndNormalizeDataset(raw: unknown): ValidationResult {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'Dataset must be a JSON object.' }
  }

  const data = raw as Record<string, unknown>
  if (data.version !== DATASET_VERSION) {
    return { ok: false, error: `Unsupported dataset version. Expected ${DATASET_VERSION}.` }
  }

  if (!Array.isArray(data.categories)) {
    return { ok: false, error: 'categories must be an array.' }
  }

  const parsedCategories = data.categories.filter(
    value => typeof value === 'string',
  ) as CategoryId[]

  if (
    parsedCategories.length !== CATEGORY_IDS.length ||
    !CATEGORY_IDS.every(id => parsedCategories.includes(id))
  ) {
    return { ok: false, error: 'categories must include all supported category ids exactly once.' }
  }

  const uniqueCategoryCount = new Set(parsedCategories).size
  if (uniqueCategoryCount !== parsedCategories.length) {
    return { ok: false, error: 'categories contains duplicates.' }
  }

  if (!data.scenariosByCategory || typeof data.scenariosByCategory !== 'object') {
    return { ok: false, error: 'scenariosByCategory must be an object.' }
  }

  const scenariosByCategoryRaw = data.scenariosByCategory as Record<string, unknown>
  const rawKeys = Object.keys(scenariosByCategoryRaw)
  const hasUnknownKeys = rawKeys.some(key => !CATEGORY_ID_SET.has(key as CategoryId))
  if (hasUnknownKeys) {
    return { ok: false, error: 'scenariosByCategory contains unknown category keys.' }
  }

  const normalized: ContentDataset = {
    version: DATASET_VERSION,
    categories: [...CATEGORY_IDS],
    scenariosByCategory: {
      'home-alone': [],
      stranger: [],
      internet: [],
      school: [],
    },
  }

  const seenScenarioIds = new Set<string>()

  for (const categoryId of CATEGORY_IDS) {
    const categoryScenariosRaw = scenariosByCategoryRaw[categoryId]
    if (!Array.isArray(categoryScenariosRaw)) {
      return { ok: false, error: `scenariosByCategory.${categoryId} must be an array.` }
    }

    const normalizedScenarios: Scenario[] = []
    for (let index = 0; index < categoryScenariosRaw.length; index++) {
      const scenario = normalizeScenario(categoryScenariosRaw[index], categoryId, index)
      if (!scenario) {
        return {
          ok: false,
          error: `Invalid scenario at ${categoryId}[${index}] (required fields or answer structure invalid).`,
        }
      }
      if (seenScenarioIds.has(scenario.id)) {
        return { ok: false, error: `Duplicate scenario id "${scenario.id}".` }
      }
      seenScenarioIds.add(scenario.id)
      normalizedScenarios.push(scenario)
    }

    normalized.scenariosByCategory[categoryId] = normalizedScenarios
  }

  return { ok: true, dataset: normalized }
}

function persistCustomDataset(dataset: ContentDataset) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dataset))
}

function clearCustomDataset() {
  localStorage.removeItem(STORAGE_KEY)
}

function readCustomDataset(): ContentDataset | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as unknown
    const result = validateAndNormalizeDataset(parsed)
    if (!result.ok) {
      clearCustomDataset()
      return null
    }
    return result.dataset
  } catch {
    clearCustomDataset()
    return null
  }
}

function ensureReady() {
  if (!activeDataset || !seedDataset) {
    throw new Error('Content repository is not initialized. Call initializeContentRepository() first.')
  }
}

async function loadSeedDataset(): Promise<ContentDataset> {
  const response = await fetch(SEED_DATASET_URL, { cache: 'no-cache' })
  if (!response.ok) {
    throw new Error(`Failed to load seed dataset from ${SEED_DATASET_URL}`)
  }

  const parsed = (await response.json()) as unknown
  const result = validateAndNormalizeDataset(parsed)
  if (!result.ok) {
    throw new Error(`Invalid seed dataset: ${result.error}`)
  }

  return result.dataset
}

export async function initializeContentRepository() {
  if (seedDataset && activeDataset) return

  try {
    seedDataset = await loadSeedDataset()
  } catch (error) {
    console.error(error)
    seedDataset = createEmptyDataset()
  }

  const customDataset = readCustomDataset()
  activeDataset = customDataset ? cloneDataset(customDataset) : cloneDataset(seedDataset)
}

export function getActiveDataset(): ContentDataset {
  ensureReady()
  return cloneDataset(activeDataset!)
}

export function getScenariosByCategory(categoryId: CategoryId): Scenario[] {
  ensureReady()
  const list = activeDataset!.scenariosByCategory[categoryId] ?? []
  return JSON.parse(JSON.stringify(list)) as Scenario[]
}

export function getScenarioById(id: string): Scenario | undefined {
  ensureReady()
  for (const categoryId of CATEGORY_IDS) {
    const scenario = activeDataset!.scenariosByCategory[categoryId].find(item => item.id === id)
    if (scenario) {
      return JSON.parse(JSON.stringify(scenario)) as Scenario
    }
  }
  return undefined
}

export function saveDataset(dataset: ContentDataset) {
  ensureReady()
  const result = validateAndNormalizeDataset(dataset)
  if (!result.ok) {
    throw new Error(result.error)
  }

  activeDataset = cloneDataset(result.dataset)
  persistCustomDataset(result.dataset)
}

export function importDataset(jsonText: string): ContentImportResult {
  ensureReady()
  try {
    const parsed = JSON.parse(jsonText) as unknown
    const result = validateAndNormalizeDataset(parsed)
    if (!result.ok) {
      return { ok: false, error: result.error }
    }

    activeDataset = cloneDataset(result.dataset)
    persistCustomDataset(result.dataset)
    return { ok: true }
  } catch {
    return { ok: false, error: 'Invalid JSON file.' }
  }
}

export function exportDataset(): string {
  ensureReady()
  return JSON.stringify(activeDataset, null, 2)
}

export function resetDataset() {
  ensureReady()
  activeDataset = cloneDataset(seedDataset!)
  clearCustomDataset()
}

export function getScenarioCountByCategory(categoryId: CategoryId): number {
  ensureReady()
  return activeDataset!.scenariosByCategory[categoryId]?.length ?? 0
}

export function getTotalScenarioCount(): number {
  ensureReady()
  return CATEGORY_IDS.reduce((sum, categoryId) => {
    return sum + (activeDataset!.scenariosByCategory[categoryId]?.length ?? 0)
  }, 0)
}
