// Export components
export { RouterProvider } from './contexts/RouterProvider'
export { StackedViewGroup } from './components/StackedViewGroup'
export { StackedView } from './components/StackedView'
export { Link } from './components/Link'

// Export hooks
export { useNavigate } from './hooks/useNavigate'
export { useHref } from './hooks/useHref'
export { useView } from './hooks/useView'

// Export utils
export { mapRoutes } from './lib/mapRoutes'

// Export types
export type {
  PageComponent,
  ViewMetadata,
  RouteConfig,
  RouterConfig
} from './lib/RouterRegistry'
