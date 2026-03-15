/**
 * Content API – all calls to the Django REST backend.
 * Base URL is controlled by VITE_API_BASE_URL (default: http://localhost:8000).
 */
import { del, get, post, put } from '@/shared/api/http'
import { ML_API_URL } from '@/shared/config/urls'
import type { Scenario, Choice } from '@/entities/scenario/model/types'
import type { CategoryId, Player } from '@/shared/types/game'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiCategory {
  id: CategoryId
  label: string
  emoji: string
  color: string
  colorLight: string
  colorDark: string
  description: string
  scenarioCount: number
}

export interface ExportDataset {
  version: number
  categories: CategoryId[]
  scenariosByCategory: Record<CategoryId, Scenario[]>
}

// ─────────────────────────────────────────────────────────────────────────────
// Categories
// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/categories/ */
export const getCategories = () =>
  get<ApiCategory[]>('/api/categories/')

/** GET /api/categories/{id}/scenarios/ – full Scenario objects with choices */
export const getCategoryScenarios = (catId: CategoryId) =>
  get<Scenario[]>(`/api/categories/${catId}/scenarios/`)

// ─────────────────────────────────────────────────────────────────────────────
// Scenarios
// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/scenarios/{id}/ */
export const getScenario = (id: string) =>
  get<Scenario>(`/api/scenarios/${id}/`)

/** POST /api/scenarios/ – create with optional nested choices */
export const createScenario = (data: Omit<Scenario, 'id'> & { id?: string }) =>
  post<Scenario>('/api/scenarios/', data)

/** PUT /api/scenarios/{id}/ – full replace (choices array replaces all existing) */
export const updateScenario = (id: string, data: Partial<Scenario>) =>
  put<Scenario>(`/api/scenarios/${id}/`, data)

/** PATCH /api/scenarios/{id}/ – partial update */
export const patchScenario = (id: string, data: Partial<Scenario>) =>
  put<Scenario>(`/api/scenarios/${id}/`, data)   // reuse PUT for simplicity

/** DELETE /api/scenarios/{id}/ */
export const deleteScenario = (id: string) =>
  del(`/api/scenarios/${id}/`)

/** GET /api/scenarios/export – full dataset for JSON download */
export const exportDatasetFromApi = () =>
  get<ExportDataset>('/api/scenarios/export')

/** GET /api/categories/{id}/generate_scenario/ – AI-generated scenario */
export const generateScenario = (categoryId: CategoryId) =>
  get<Scenario>(`/api/categories/${categoryId}/generate_scenario/`)

// ─────────────────────────────────────────────────────────────────────────────
// Choices
// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/scenarios/{id}/choices/ */
export const getScenarioChoices = (scenarioId: string) =>
  get<Choice[]>(`/api/scenarios/${scenarioId}/choices/`)

/** POST /api/scenarios/{id}/choices/ – add single choice */
export const addChoice = (scenarioId: string, data: Partial<Choice>) =>
  post<Choice>(`/api/scenarios/${scenarioId}/choices/`, data)

/** PUT /api/scenarios/{id}/choices/bulk – replace ALL choices at once */
export const bulkReplaceChoices = (scenarioId: string, choices: Partial<Choice>[]) =>
  put<Choice[]>(`/api/scenarios/${scenarioId}/choices/bulk`, choices)

/** PUT /api/choices/{id}/ */
export const updateChoice = (id: string, data: Partial<Choice>) =>
  put<Choice>(`/api/choices/${id}/`, data)

/** DELETE /api/choices/{id}/ */
export const deleteChoice = (id: string) =>
  del(`/api/choices/${id}/`)

// ─────────────────────────────────────────────────────────────────────────────
// Players
// ─────────────────────────────────────────────────────────────────────────────

/** POST /api/players/ → get_or_create by username */
export const getOrCreatePlayer = (username: string) =>
  post<Player>('/api/players/', { username })

export interface RecordSessionPayload {
  categoryId: CategoryId
  correctAnswers: number
  totalAnswers: number
  pointsEarned: number
}

/** POST /api/players/{id}/record-session/ */
export const recordSession = (playerId: number, data: RecordSessionPayload) =>
  post<Player>(`/api/players/${playerId}/record-session/`, data)

// ─────────────────────────────────────────────────────────────────────────────
// ML Service
// ─────────────────────────────────────────────────────────────────────────────

/** POST {ML_API_URL}/get_next_category – returns the recommended next category */
export const getNextCategory = (ratio: Record<string, number>) =>
  post<{ next_category: string }>(ML_API_URL + '/get_next_category', { ratio })
