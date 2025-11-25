import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import '@fortune-sheet/react/dist/index.css' // Import Fortune Sheet CSS
import App from './App.tsx'
import './i18n'
import { useThemeStore, applyTheme } from './store/themeStore'

// Apply theme on startup
const { mode, customTheme } = useThemeStore.getState();
applyTheme(mode, customTheme);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
