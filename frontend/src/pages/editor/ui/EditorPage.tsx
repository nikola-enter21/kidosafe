import { Alert, Box, Button, CircularProgress, IconButton, Paper, Radio, Stack, TextField, Typography } from '@mui/material'
import AddRounded from '@mui/icons-material/AddRounded'
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import ArrowDownwardRounded from '@mui/icons-material/ArrowDownwardRounded'
import ArrowUpwardRounded from '@mui/icons-material/ArrowUpwardRounded'
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded'
import SaveRounded from '@mui/icons-material/SaveRounded'
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'

import { useGameStore } from '@/entities/game/model/gameStore'
import { CATEGORIES, getCategoryById } from '@/entities/scenario/model/categories'
import type { ContentDataset } from '@/entities/scenario/model/contentTypes'
import {
  getActiveDataset,
  importDataset,
  saveDataset,
} from '@/entities/scenario/model/contentRepository'
import type { Choice, Scenario } from '@/entities/scenario/model/types'
import type { CategoryId } from '@/shared/types/game'

const CATEGORY_IDS = CATEGORIES.map(c => c.id) as CategoryId[]

type MediaField =
  | 'videoUrl'
  | 'questionVideoUrl'
  | 'wrongVideoUrl'
  | 'correctVideoUrl'
  | 'imageUrl'
  | 'imageUrlCorrect'
  | 'imageUrlWrong'

function cloneDataset(dataset: ContentDataset): ContentDataset {
  return JSON.parse(JSON.stringify(dataset)) as ContentDataset
}

function createEmptyDataset(): ContentDataset {
  return {
    version: 1,
    categories: [...CATEGORY_IDS],
    scenariosByCategory: {
      'home-alone': [],
      stranger: [],
      internet: [],
      school: [],
    },
  }
}

function createScenarioTemplate(category: CategoryId, index: number): Scenario {
  const cat = getCategoryById(category)
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const id = `${category}-${unique}`

  const createChoice = (position: number, isCorrect: boolean): Choice => ({
    id: `${id}-c${position + 1}`,
    text: `Choice ${position + 1}`,
    emoji: ['1️⃣', '2️⃣', '3️⃣'][position] ?? '🔹',
    isCorrect,
    feedback: isCorrect
      ? 'Great choice! That is the safest option.'
      : 'Not the safest option. Try again and stay safe!',
    feedbackEmoji: isCorrect ? '🌟' : '⚠️',
  })

  return {
    id,
    category,
    order: index,
    scene: {
      background: `linear-gradient(135deg, ${cat.colorLight} 0%, ${cat.color} 100%)`,
      emoji: cat.emoji,
      label: `${cat.label} scenario ${index + 1}`,
    },
    question: `New ${cat.label} question`,
    watchTime: 4,
    tip: 'Talk to a trusted adult about the safest choice.',
    choices: [createChoice(0, true), createChoice(1, false), createChoice(2, false)],
  }
}

function renumberScenarios(list: Scenario[]): Scenario[] {
  return list.map((scenario, index) => ({
    ...scenario,
    order: index,
  }))
}

export function EditorPage() {
  const goToScreen = useGameStore(s => s.goToScreen)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [dataset, setDataset] = useState<ContentDataset>(createEmptyDataset)
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('home-alone')
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getActiveDataset()
      .then(data => {
        setDataset(data)
        const firstCategory = (data.categories[0] as CategoryId) ?? 'home-alone'
        setSelectedCategory(firstCategory)
        setSelectedScenarioId(data.scenariosByCategory[firstCategory]?.[0]?.id ?? null)
      })
      .catch(() => setError('Failed to load content from server.'))
      .finally(() => setLoading(false))
  }, [])

  const categoryScenarios = dataset.scenariosByCategory[selectedCategory] ?? []
  const selectedScenarioIndex = categoryScenarios.findIndex(s => s.id === selectedScenarioId)
  const selectedScenario =
    selectedScenarioIndex >= 0 ? categoryScenarios[selectedScenarioIndex] : null

  const datasetStats = useMemo(() => {
    const total = dataset.categories.reduce((sum, categoryId) => {
      return sum + (dataset.scenariosByCategory[categoryId]?.length ?? 0)
    }, 0)
    return { categories: dataset.categories.length, total }
  }, [dataset])

  const updateCategoryScenarios = (
    categoryId: CategoryId,
    updater: (list: Scenario[]) => Scenario[],
  ) => {
    setDataset(prev => {
      const next = cloneDataset(prev)
      const updatedList = updater(next.scenariosByCategory[categoryId] ?? [])
      next.scenariosByCategory[categoryId] = renumberScenarios(updatedList)
      return next
    })
  }

  const selectCategory = (categoryId: CategoryId) => {
    setSelectedCategory(categoryId)
    const list = dataset.scenariosByCategory[categoryId] ?? []
    setSelectedScenarioId(list[0]?.id ?? null)
  }

  const updateSelectedScenario = (updater: (scenario: Scenario) => Scenario) => {
    if (!selectedScenario) return
    updateCategoryScenarios(selectedCategory, list =>
      list.map(item => (item.id === selectedScenario.id ? updater(item) : item)),
    )
  }

  const updateOptionalMediaField = (field: MediaField, rawValue: string) => {
    updateSelectedScenario(item => {
      const value = rawValue.trim()
      if (value) {
        return { ...item, [field]: value }
      }

      const next = { ...item } as Scenario & Record<string, unknown>
      delete next[field]
      return next as Scenario
    })
  }

  const updateChoiceField = (
    index: number,
    field: keyof Pick<Choice, 'text' | 'feedback' | 'feedbackEmoji'>,
    value: string,
  ) => {
    updateSelectedScenario(item => ({
      ...item,
      choices: item.choices.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry,
      ),
    }))
  }

  const handleAddScenario = () => {
    setError(null)
    setMessage(null)
    const nextScenario = createScenarioTemplate(selectedCategory, categoryScenarios.length)
    updateCategoryScenarios(selectedCategory, list => [...list, nextScenario])
    setSelectedScenarioId(nextScenario.id)
  }

  const handleDeleteScenario = (scenarioId: string) => {
    setError(null)
    setMessage(null)
    const removedIndex = categoryScenarios.findIndex(item => item.id === scenarioId)
    if (removedIndex < 0) return

    const nextList = categoryScenarios.filter(item => item.id !== scenarioId)
    updateCategoryScenarios(selectedCategory, () => nextList)

    if (nextList.length === 0) {
      setSelectedScenarioId(null)
      return
    }

    const fallbackIndex = Math.max(0, removedIndex - 1)
    setSelectedScenarioId(nextList[fallbackIndex]?.id ?? nextList[0].id)
  }

  const handleMoveScenario = (scenarioId: string, direction: 'up' | 'down') => {
    const currentIndex = categoryScenarios.findIndex(item => item.id === scenarioId)
    if (currentIndex < 0) return

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= categoryScenarios.length) return

    setError(null)
    setMessage(null)
    updateCategoryScenarios(selectedCategory, list => {
      const next = [...list]
      const [moved] = next.splice(currentIndex, 1)
      next.splice(targetIndex, 0, moved)
      return next
    })
    setSelectedScenarioId(scenarioId)
  }

  const handleSave = async () => {
    try {
      await saveDataset(dataset)
      const reloaded = await getActiveDataset()
      setDataset(reloaded)
      setMessage('Content saved to server.')
      setError(null)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save content.')
      setMessage(null)
    }
  }

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const text = await file.text()
    const result = await importDataset(text)
    if (!result.ok) {
      setError(result.error)
      setMessage(null)
      return
    }

    const reloaded = await getActiveDataset()
    setDataset(reloaded)
    const firstCategory = (reloaded.categories[0] as CategoryId) ?? 'home-alone'
    setSelectedCategory(firstCategory)
    setSelectedScenarioId(reloaded.scenariosByCategory[firstCategory]?.[0]?.id ?? null)
    setMessage('Dataset imported successfully.')
    setError(null)
  }

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: '#0b1020',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress sx={{ color: '#a78bfa' }} />
      </Box>
    )
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#0b1020',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          p: { xs: 2, md: 2.5 },
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
          flexWrap: 'wrap',
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <IconButton
            onClick={() => goToScreen('home')}
            sx={{
              bgcolor: 'rgba(255,255,255,0.08)',
              color: '#fff',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' },
            }}
          >
            <ArrowBackRounded />
          </IconButton>
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: { xs: '1.25rem', md: '1.45rem' } }}>
              🛠️ Content Studio
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.62)', fontSize: '0.82rem' }}>
              {datasetStats.categories} categories · {datasetStats.total} scenarios
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
          <Button startIcon={<SaveRounded />} variant="contained" onClick={handleSave}>
            Save
          </Button>
        </Stack>
      </Box>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={handleImportFile}
      />

      <Box sx={{ px: { xs: 2, md: 2.5 }, pt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 1.5 }}>
            {error}
          </Alert>
        )}
        {message && (
          <Alert severity="success" sx={{ mb: 1.5 }}>
            {message}
          </Alert>
        )}
      </Box>

      <Box
        sx={{
          flex: 1,
          p: { xs: 2, md: 2.5 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '240px 330px 1fr' },
          gap: 2,
        }}
      >
        <Paper sx={{ bgcolor: '#121a2d', color: '#fff', p: 2, borderRadius: 3 }}>
          <Typography sx={{ fontWeight: 800, mb: 1.5 }}>Categories</Typography>
          <Stack spacing={1}>
            {CATEGORIES.map(category => {
              const count = dataset.scenariosByCategory[category.id]?.length ?? 0
              const active = category.id === selectedCategory
              return (
                <Button
                  key={category.id}
                  onClick={() => selectCategory(category.id)}
                  sx={{
                    justifyContent: 'space-between',
                    px: 1.5,
                    py: 1,
                    bgcolor: active ? `${category.color}33` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${active ? category.color : 'rgba(255,255,255,0.1)'}`,
                    color: '#fff',
                    borderRadius: 2,
                    '&:hover': { bgcolor: `${category.color}22` },
                  }}
                >
                  <span>{category.emoji} {category.label}</span>
                  <span>{count}</span>
                </Button>
              )
            })}
          </Stack>
        </Paper>

        <Paper sx={{ bgcolor: '#121a2d', color: '#fff', p: 2, borderRadius: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.25 }}>
            <Typography sx={{ fontWeight: 800 }}>Scenarios</Typography>
            <Button size="small" startIcon={<AddRounded />} onClick={handleAddScenario}>
              Add
            </Button>
          </Stack>

          <Stack spacing={1.1}>
            {categoryScenarios.map((scenario) => {
              const isSelected = scenario.id === selectedScenarioId
              return (
                <Paper
                  key={scenario.id}
                  sx={{
                    p: 1.25,
                    borderRadius: 2,
                    bgcolor: isSelected ? 'rgba(102,126,234,0.22)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${isSelected ? 'rgba(159,122,234,0.7)' : 'rgba(255,255,255,0.08)'}`,
                    cursor: 'pointer',
                    color: '#ffffff',
                  }}
                  onClick={() => setSelectedScenarioId(scenario.id)}
                >
                  <Typography sx={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.55)', mb: 0.4 }}>
                    #{scenario.order + 1} · {scenario.id}
                  </Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', lineHeight: 1.35 }}>
                    {scenario.question}
                  </Typography>
                  <Stack direction="row" spacing={0.4} sx={{ mt: 0.9 }}>
                    <IconButton
                      size="small"
                      onClick={(event) => {
                        event.stopPropagation()
                        handleMoveScenario(scenario.id, 'up')
                      }}
                      sx={{ color: '#fff' }}
                    >
                      <ArrowUpwardRounded fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(event) => {
                        event.stopPropagation()
                        handleMoveScenario(scenario.id, 'down')
                      }}
                      sx={{ color: '#fff' }}
                    >
                      <ArrowDownwardRounded fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(event) => {
                        event.stopPropagation()
                        handleDeleteScenario(scenario.id)
                      }}
                      sx={{ color: '#ff9aa2' }}
                    >
                      <DeleteOutlineRounded fontSize="small" />
                    </IconButton>
                  </Stack>
                </Paper>
              )
            })}
            {categoryScenarios.length === 0 && (
              <Typography sx={{ color: 'rgba(255,255,255,0.56)', fontSize: '0.9rem' }}>
                No scenarios in this category. Add one to start.
              </Typography>
            )}
          </Stack>
        </Paper>

        <Paper sx={{ bgcolor: '#121a2d', color: '#fff', p: 2.25, borderRadius: 3 }}>
          {!selectedScenario && (
            <Typography sx={{ color: 'rgba(255,255,255,0.62)' }}>
              Select a scenario to edit it.
            </Typography>
          )}

          {selectedScenario && (
            <Stack spacing={2}>
              <Typography sx={{ fontWeight: 800, fontSize: '1.05rem' }}>
                Edit Scenario
              </Typography>

              <TextField
                label="Question"
                multiline
                minRows={2}
                value={selectedScenario.question}
                onChange={event =>
                  updateSelectedScenario(item => ({ ...item, question: event.target.value }))
                }
                fullWidth
                sx={{
                  '& .MuiInputBase-root': { color: '#fff', bgcolor: 'rgba(255,255,255,0.03)' },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.65)' },
                }}
              />

              <TextField
                label="Tip"
                multiline
                minRows={2}
                value={selectedScenario.tip}
                onChange={event =>
                  updateSelectedScenario(item => ({ ...item, tip: event.target.value }))
                }
                fullWidth
                sx={{
                  '& .MuiInputBase-root': { color: '#fff', bgcolor: 'rgba(255,255,255,0.03)' },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.65)' },
                }}
              />

              <TextField
                label="Video URL / Path"
                placeholder="/videos/my-video.mp4 or https://..."
                value={selectedScenario.videoUrl ?? ''}
                onChange={event => updateOptionalMediaField('videoUrl', event.target.value)}
                fullWidth
                sx={{
                  '& .MuiInputBase-root': { color: '#fff', bgcolor: 'rgba(255,255,255,0.03)' },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.65)' },
                }}
              />
              <Typography sx={{ color: 'rgba(255,255,255,0.62)', fontSize: '0.78rem', mt: -1 }}>
                Legacy single video flow (optional).
              </Typography>

              <TextField
                label="Question video URL / Path (part_1)"
                placeholder="/homealone/kontakt/new_style_part_1.mp4"
                value={selectedScenario.questionVideoUrl ?? ''}
                onChange={event => updateOptionalMediaField('questionVideoUrl', event.target.value)}
                fullWidth
                sx={{
                  '& .MuiInputBase-root': { color: '#fff', bgcolor: 'rgba(255,255,255,0.03)' },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.65)' },
                }}
              />
              <TextField
                label="Wrong answer video URL / Path (part_2)"
                placeholder="/homealone/kontakt/new_style_part_2.mp4"
                value={selectedScenario.wrongVideoUrl ?? ''}
                onChange={event => updateOptionalMediaField('wrongVideoUrl', event.target.value)}
                fullWidth
                sx={{
                  '& .MuiInputBase-root': { color: '#fff', bgcolor: 'rgba(255,255,255,0.03)' },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.65)' },
                }}
              />
              <TextField
                label="Correct answer video URL / Path (part_3)"
                placeholder="/homealone/kontakt/new_style_part_3.mp4"
                value={selectedScenario.correctVideoUrl ?? ''}
                onChange={event => updateOptionalMediaField('correctVideoUrl', event.target.value)}
                fullWidth
                sx={{
                  '& .MuiInputBase-root': { color: '#fff', bgcolor: 'rgba(255,255,255,0.03)' },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.65)' },
                }}
              />
              <Typography sx={{ color: 'rgba(255,255,255,0.62)', fontSize: '0.78rem', mt: -1 }}>
                Triplet video flow requires all 3 fields: question + wrong + correct.
              </Typography>

              {/* ── Description ───────────────────────────────────────── */}
              <TextField
                label="Description"
                multiline
                minRows={2}
                placeholder="Describe what happens in this scenario (used for AI matching)"
                value={selectedScenario.description ?? ''}
                onChange={event =>
                  updateSelectedScenario(item => ({
                    ...item,
                    description: event.target.value || undefined,
                  }))
                }
                fullWidth
                sx={{
                  '& .MuiInputBase-root': { color: '#fff', bgcolor: 'rgba(255,255,255,0.03)' },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.65)' },
                }}
              />

              {/* ── Image triplet fields ──────────────────────────────── */}
              <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>
                🖼️ Image URLs (optional — shown when no video is set)
              </Typography>
              <TextField
                label="Question Image URL / Path"
                placeholder="/images/scenario-question.jpg"
                value={selectedScenario.imageUrl ?? ''}
                onChange={event => updateOptionalMediaField('imageUrl', event.target.value)}
                fullWidth
                sx={{
                  '& .MuiInputBase-root': { color: '#fff', bgcolor: 'rgba(255,255,255,0.03)' },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.65)' },
                }}
              />
              <TextField
                label="Wrong answer Image URL / Path"
                placeholder="/images/scenario-wrong.jpg"
                value={selectedScenario.imageUrlWrong ?? ''}
                onChange={event => updateOptionalMediaField('imageUrlWrong', event.target.value)}
                fullWidth
                sx={{
                  '& .MuiInputBase-root': { color: '#fff', bgcolor: 'rgba(255,255,255,0.03)' },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.65)' },
                }}
              />
              <TextField
                label="Correct answer Image URL / Path"
                placeholder="/images/scenario-correct.jpg"
                value={selectedScenario.imageUrlCorrect ?? ''}
                onChange={event => updateOptionalMediaField('imageUrlCorrect', event.target.value)}
                fullWidth
                sx={{
                  '& .MuiInputBase-root': { color: '#fff', bgcolor: 'rgba(255,255,255,0.03)' },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.65)' },
                }}
              />
              <Typography sx={{ color: 'rgba(255,255,255,0.62)', fontSize: '0.78rem', mt: -1 }}>
                Image triplet flow — fallback when no video URL is set for that state.
              </Typography>

              <Typography sx={{ fontWeight: 700, mt: 0.5 }}>
                Answers <Typography component="span" sx={{ fontWeight: 400, fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>(select radio = correct answer)</Typography>
              </Typography>

              <Stack spacing={2}>
                {selectedScenario.choices.map((choice, index) => (
                  <Box
                    key={choice.id}
                    sx={{
                      bgcolor: choice.isCorrect
                        ? 'rgba(16,185,129,0.07)'
                        : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${choice.isCorrect ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: 2,
                      p: 1.5,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                    }}
                  >
                    {/* Row 1: Radio + Answer text + Feedback emoji */}
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Radio
                        checked={choice.isCorrect}
                        onChange={() =>
                          updateSelectedScenario(item => ({
                            ...item,
                            choices: item.choices.map((entry, choiceIndex) => ({
                              ...entry,
                              isCorrect: choiceIndex === index,
                            })),
                          }))
                        }
                        sx={{ color: choice.isCorrect ? '#10b981' : 'rgba(255,255,255,0.5)', p: 0.5 }}
                      />
                      <TextField
                        label={`Answer ${index + 1}`}
                        value={choice.text}
                        onChange={event => updateChoiceField(index, 'text', event.target.value)}
                        fullWidth
                        sx={{
                          '& .MuiInputBase-root': { color: '#fff', bgcolor: 'rgba(255,255,255,0.03)' },
                          '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.65)' },
                        }}
                      />
                      {/*<TextField*/}
                      {/*  label="Emoji"*/}
                      {/*  value={choice.feedbackEmoji}*/}
                      {/*  onChange={event => updateChoiceField(index, 'feedbackEmoji', event.target.value)}*/}
                      {/*  sx={{*/}
                      {/*    width: 86,*/}
                      {/*    flexShrink: 0,*/}
                      {/*    '& .MuiInputBase-root': { color: '#fff', bgcolor: 'rgba(255,255,255,0.03)', fontSize: '1.2rem' },*/}
                      {/*    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.65)' },*/}
                      {/*  }}*/}
                      {/*  inputProps={{ maxLength: 4 }}*/}
                      {/*/>*/}
                    </Stack>

                    {/* Row 2: Feedback message */}
                    <Box sx={{ pl: '44px' }}>
                      <TextField
                        label={`Feedback — ${choice.isCorrect ? 'Correct ✅' : 'Wrong ❌'}`}
                        multiline
                        minRows={2}
                        value={choice.feedback}
                        onChange={event => updateChoiceField(index, 'feedback', event.target.value)}
                        fullWidth
                        placeholder={
                          choice.isCorrect
                            ? 'Great choice! That is the safest option.'
                            : 'Not the safest option. Think about what could happen.'
                        }
                        sx={{
                          '& .MuiInputBase-root': { color: '#fff', bgcolor: 'rgba(255,255,255,0.03)' },
                          '& .MuiInputLabel-root': {
                            color: choice.isCorrect ? 'rgba(52,211,153,0.85)' : 'rgba(252,165,165,0.85)',
                          },
                        }}
                      />
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Stack>
          )}
        </Paper>
      </Box>
    </Box>
  )
}
