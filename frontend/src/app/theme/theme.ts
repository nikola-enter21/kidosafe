import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#667eea', dark: '#5a67d8', light: '#9f7aea' },
    secondary: { main: '#f093fb' },
    background: { default: '#f9fafb', paper: '#ffffff' },
    text: { primary: '#111827', secondary: '#6b7280' },
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: '"Nunito", "Segoe UI", sans-serif',
    h1: { fontSize: 'clamp(2.2rem, 8vw, 3.5rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em' },
    h2: { fontWeight: 800, letterSpacing: '-0.02em' },
    body1: { lineHeight: 1.7 },
    button: { fontWeight: 800, textTransform: 'none' },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 999, paddingInline: 20, fontWeight: 800 } },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiCssBaseline: {
      styleOverrides: `
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; overflow-x: hidden; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
      `,
    },
  },
})
