import { Box, Grid, Typography } from '@mui/material'
import { motion } from 'framer-motion'
import { CATEGORIES } from '@/entities/scenario/model/categories'
import { getScenarioCountByCategory } from '@/entities/scenario/model/contentRepository'
import type { CategoryId } from '@/shared/types/game'

interface CategoryGridProps {
  onSelect: (id: CategoryId) => void
}

export function CategoryGrid({ onSelect }: CategoryGridProps) {
  return (
    <Grid container spacing={{ xs: 2, md: 3 }}>
      {CATEGORIES.map((cat, i) => {
        const scenarioCount = getScenarioCountByCategory(cat.id)
        const isDisabled = scenarioCount === 0

        return (
          <Grid key={cat.id} size={{ xs: 6, md: 3 }}>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, type: 'spring', stiffness: 240, damping: 20 }}
              whileHover={isDisabled ? {} : { scale: 1.04, y: -6 }}
              whileTap={isDisabled ? {} : { scale: 0.96 }}
              onClick={() => {
                if (!isDisabled) onSelect(cat.id as CategoryId)
              }}
              style={{ cursor: isDisabled ? 'not-allowed' : 'pointer', height: '100%' }}
            >
              <Box
                sx={{
                  borderRadius: 5,
                  p: { xs: 2.5, md: 3.5, lg: 4 },
                  background: cat.colorLight,
                  border: `2.5px solid ${cat.color}`,
                  opacity: isDisabled ? 0.6 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: { xs: 1.25, md: 1.75 },
                  textAlign: 'center',
                  boxShadow: `0 6px 24px ${cat.color}44`,
                  minHeight: { xs: 150, md: 200, lg: 240 },
                  justifyContent: 'center',
                  transition: 'box-shadow 0.25s, transform 0.25s',
                  '&:hover': {
                    boxShadow: `0 16px 40px ${cat.color}77`,
                  },
                }}
              >
                <Typography
                  sx={{
                    fontSize: { xs: 'clamp(2.8rem, 9vw, 4rem)', md: 'clamp(3.5rem, 6vw, 5rem)' },
                    lineHeight: 1,
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.12))',
                  }}
                >
                  {cat.emoji}
                </Typography>
                <Typography
                  sx={{
                    fontWeight: 900,
                    fontSize: { xs: '0.9rem', md: '1.05rem', lg: '1.15rem' },
                    color: cat.colorDark,
                    lineHeight: 1.2,
                  }}
                >
                  {cat.label}
                </Typography>
                <Typography
                  sx={{
                    color: '#6b7280',
                    fontSize: { xs: '0.78rem', md: '0.85rem' },
                    fontWeight: 500,
                    lineHeight: 1.4,
                    display: { xs: 'none', md: 'block' },
                    px: 1,
                  }}
                >
                  {cat.description}
                </Typography>
                <Box
                  sx={{
                    bgcolor: cat.color,
                    color: '#fff',
                    fontSize: { xs: '0.68rem', md: '0.72rem' },
                    fontWeight: 800,
                    px: 1.5,
                    py: 0.35,
                    borderRadius: 99,
                    letterSpacing: '0.05em',
                  }}
                >
                  {scenarioCount} challenges
                </Box>
              </Box>
            </motion.div>
          </Grid>
        )
      })}
    </Grid>
  )
}
