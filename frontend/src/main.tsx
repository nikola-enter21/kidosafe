import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@fontsource/manrope/400.css'
import '@fontsource/manrope/700.css'
import '@fontsource/manrope/800.css'

import { AppProviders } from '@/app/providers/AppProviders'
import { initializeContentRepository } from '@/entities/scenario/model/contentRepository'

import './index.css'
import App from './App.tsx'

async function bootstrap() {
  await initializeContentRepository()

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AppProviders>
        <App />
      </AppProviders>
    </StrictMode>,
  )
}

void bootstrap()
