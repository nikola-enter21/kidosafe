import { CssBaseline, ThemeProvider } from '@mui/material'
import { SWRConfig } from 'swr'

import { theme } from '@/app/theme/theme'

type AppProvidersProps = {
  children: React.ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SWRConfig
        value={{
          revalidateIfStale: true,
          revalidateOnFocus: true,
          revalidateOnReconnect: true,
        }}
      >
        {children}
      </SWRConfig>
    </ThemeProvider>
  )
}