import { Alert, Box, Button, IconButton, Paper, Radio, Stack, TextField, Typography } from '@mui/material'
import AddRounded from '@mui/icons-material/AddRounded'
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import ArrowDownwardRounded from '@mui/icons-material/ArrowDownwardRounded'
import ArrowUpwardRounded from '@mui/icons-material/ArrowUpwardRounded'
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded'
import DownloadRounded from '@mui/icons-material/DownloadRounded'
import RestartAltRounded from '@mui/icons-material/RestartAltRounded'
import SaveRounded from '@mui/icons-material/SaveRounded'
import UploadRounded from '@mui/icons-material/UploadRounded'
import { type ChangeEvent, useMemo, useRef, useState } from 'react'

import { useGameStore } from '@/entities/game/model/gameStore'
import { CATEGORIES, getCategoryById } from '@/entities/scenario/model/categories'
import type { ContentDataset } from '@/entities/scenario/model/contentTypes'
import {
  exportDataset,
  getActiveDataset,
  importDataset,
  resetDataset,
  saveDataset,
} from '@/entities/scenario/model/contentRepository'
import type { Choice, Scenario } from '@/entities/scenario/model/types'
import type { CategoryId } from '@/shared/types/game'

function cloneDataset(dataset: ContentDataset): ContentDataset {
  return JSON.parse(JSON.stringify(dataset)) as ContentDataset
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

function downloadJsonFile(content: string, fileName: string) {
  const blob = new Blob([content], { type: 'application/json' })
  const href = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(href)
}

export function EditorPage() {
  const goToScreen = useGameStore(s => s.goToScreen)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dataset, setDataset] = useState<ContentDataset>(() => getActiveDataset())
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>(() => {
    return (dataset.categories[0] as CategoryId) ?? 'home-alone'
  })
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(() => {
    const firstCategory = (dataset.categories[0] as CategoryId) ?? 'home-alone'
    return dataset.scenariosByCategory[firstCategory]?.[0]?.id ?? null
  })
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

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
      next.scenariosByCategory[categoryId] = updatedList
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

  const handleSave = () => {
    try {
      saveDataset(dataset)
      const reloaded = getActiveDataset()
      setDataset(reloaded)
      setMessage('Content saved locally.')
      setError(null)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save content.')
      setMessage(null)
    }
  }

  const handleReset = () => {
    resetDataset()
    const reloaded = getActiveDataset()
    setDataset(reloaded)
    const firstCategory = (reloaded.categories[0] as CategoryId) ?? 'home-alone'
    setSelectedCategory(firstCategory)
    setSelectedScenarioId(reloaded.scenariosByCategory[firstCategory]?.[0]?.id ?? null)
    setMessage('Dataset reset to seed JSON.')
    setError(null)
  }

  const handleExport = () => {
    const json = exportDataset()
    downloadJsonFile(
      json,
      `kidosafe-content-v1-${new Date().toISOString().slice(0, 10)}.json`,
    )
    setMessage('Dataset exported.')
    setError(null)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const text = await file.text()
    const result = importDataset(text)
    if (!result.ok) {
      setError(result.error)
      setMessage(null)
      return
    }

    const reloaded = getActiveDataset()
    setDataset(reloaded)
    const firstCategory = (reloaded.categories[0] as CategoryId) ?? 'home-alone'
    setSelectedCategory(firstCategory)
    setSelectedScenarioId(reloaded.scenariosByCategory[firstCategory]?.[0]?.id ?? null)
    setMessage('Dataset imported successfully.')
    setError(null)
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
          <Button
            startIcon={<UploadRounded />}
            variant="outlined"
            onClick={handleImportClick}
            sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }}
          >
            Import JSON
          </Button>
          <Button
            startIcon={<DownloadRounded />}
            variant="outlined"
            onClick={handleExport}
            sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }}
          >
            Export JSON
          </Button>
          <Button
            startIcon={<RestartAltRounded />}
            variant="outlined"
            onClick={handleReset}
            sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }}
          >
            Reset
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
            {categoryScenarios.map((scenario, index) => {
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
                    #{index + 1} · {scenario.id}
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
                onChange={event =>
                  updateSelectedScenario(item => {
                    const value = event.target.value.trim()
                    if (!value) {
                      const next = { ...item }
                      delete next.videoUrl
                      return next
                    }
                    return { ...item, videoUrl: value }
                  })
                }
                fullWidth
                sx={{
                  '& .MuiInputBase-root': { color: '#fff', bgcolor: 'rgba(255,255,255,0.03)' },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.65)' },
                }}
              />

              <Typography sx={{ fontWeight: 700, mt: 0.5 }}>
                Answers (exactly 3, one correct)
              </Typography>

              <Stack spacing={1.15}>
                {selectedScenario.choices.map((choice, index) => (
                  <Stack key={choice.id} direction="row" spacing={1} alignItems="center">
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
                      sx={{ color: '#fff' }}
                    />
                    <TextField
                      label={`Answer ${index + 1}`}
                      value={choice.text}
                      onChange={event =>
                        updateSelectedScenario(item => ({
                          ...item,
                          choices: item.choices.map((entry, choiceIndex) =>
                            choiceIndex === index
                              ? { ...entry, text: event.target.value }
                              : entry,
                          ),
                        }))
                      }
                      fullWidth
                      sx={{
                        '& .MuiInputBase-root': {
                          color: '#fff',
                          bgcolor: 'rgba(255,255,255,0.03)',
                        },
                        '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.65)' },
                      }}
                    />
                  </Stack>
                ))}
              </Stack>
            </Stack>
          )}
        </Paper>
      </Box>
    </Box>
  )
}
