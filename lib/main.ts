// Export components
export { RouterProvider } from './contexts/RouterProvider'
export { StackedViewGroup } from './components/StackedViewGroup'
export { VoidViews } from './components/VoidViews'
export { StackedView } from './components/StackedView'
export { Link } from './components/Link'
export { Fill, Outlet } from './components/Slots'

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
