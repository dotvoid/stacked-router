import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Router imports
import { mapRoutes } from '../lib/lib/mapRoutes'
import { RouterProvider } from '../lib/contexts/RouterProvider'

// Local App imports
import { App } from './App'

// Create route config from file structure
const modules = import.meta.glob('./views/**/*.tsx', { eager: true })
const config = mapRoutes(modules, './views')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider config={ config }>
      <App />
    </RouterProvider>
  </StrictMode>,
)
