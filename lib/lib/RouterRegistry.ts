import { ErrorInfo } from 'react'
import { BreakpointWidth } from './allocation'

export interface PageComponent {
  default: React.ComponentType<unknown>
  [key: string]: unknown
}

export interface ErrorComponentProps {
  error: Error
  errorCode?: number
  errorInfo?: ErrorInfo
  reset: () => void
}

export interface ViewMetadata {
  type?: string
  breakpoints?: BreakpointWidth[]
}

export interface RouteConfig {
  path: string
  component: React.ComponentType<unknown>
  layouts?: React.ComponentType<React.PropsWithChildren>[]
  meta?: ViewMetadata
}

export interface RouterConfig {
  routes: RouteConfig[]
  layouts?: Record<string, React.ComponentType<React.PropsWithChildren>>
  errors?: Record<string, React.ComponentType<{ error: Error; reset: () => void }>>
}

export interface ParsedRouteLayout {
  key?: string
  component: React.ComponentType<React.PropsWithChildren>
}

interface ParsedRoute {
  component: React.ComponentType<unknown>
  pattern: RegExp
  paramKeys: string[]
  originalPath: string
  layouts: ParsedRouteLayout[]
  meta: ViewMetadata
}

export class RouterRegistry {
  #basePath: string = '/'
  #routes: Record<string, ParsedRoute> = {}
  #layouts: Record<string, React.ComponentType<React.PropsWithChildren>> = {}
  #errors: Record<string, React.ComponentType<ErrorComponentProps>> = {}

  constructor(config: RouterConfig, basePath?: string) {
    this.#basePath = basePath ? this.#normalizePath(basePath) : '/'
    this.#layouts = config.layouts || {}
    this.#errors = config.errors || {}
    this.registerRoutes(config.routes)
  }

  registerRoutes(routes: RouteConfig[], throwErrors = false) {
    routes.forEach(route => {
      // Parse and handle dynamic parameters in paths to views, ignoring
      // all patterns starting with _ (underscore) as they are layouts.
      const paramKeys: string[] = []
      const regexPattern = route.path.replace(/\[([^\]]+)\]/g, (_, param) => {
        paramKeys.push(param)
        return '([^/]+)'
      })

      const patternRegex = new RegExp(`^${regexPattern}$`)

      // Handle invalid components
      if (!route.component || route.component instanceof Function !== true || route.path[0] !== '/') {
        if (throwErrors) {
          throw new Error(`Invalid component for route ${route.path || 'undefined path'}`)
        }

        return
      }

      this.#routes[route.path] = {
        component: route.component,
        pattern: patternRegex,
        paramKeys,
        originalPath: route.path,
        layouts: (route.layouts?.length)
          ? route.layouts.map((l) => { return { component: l } }) // Component specified routes
          : this.#constructLayoutList(route.path), // Path found routes
        meta: route.meta || { breakpoints: [] }
      }
    })
  }

  #normalizePath(path: string): string {
    // Ensure basePath starts with / and doesn't end with / (unless it's just '/')
    if (!path.startsWith('/')) {
      path = '/' + path
    }

    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1)
    }

    return path
  }

  #stripBasePath(fullPath: string): string {
    // Remove basePath from the beginning of the path (unless it's just '/')
    if (this.#basePath === '/') {
      return fullPath
    }

    if (fullPath.startsWith(this.#basePath)) {
      return fullPath.slice(this.#basePath.length) || '/'
    }

    return fullPath
  }

  getViewComponentByPath(givenPath: string) {
    // Strip basePath from the given path before matching
    const strippedPath = this.#stripBasePath(givenPath)
    const path = (strippedPath.length > 1 && strippedPath.at(-1) === '/')
      ? strippedPath.substring(0, strippedPath.length - 1)
      : strippedPath

    for (const key in this.#routes) {
      const route = this.#routes[key]
      const match = path.match(route.pattern)

      if (match) {
        const params = Object.fromEntries(
          route.paramKeys.map((key, i) => [key, match[i + 1]])
        )

        return {
          Component: route.component,
          Layouts: route.layouts,
          params,
          meta: route.meta
        }
      }
    }

    return null
  }

  getErrorComponentByPath(givenPath: string): React.ComponentType<ErrorComponentProps> | null {
    // Strip basePath from the given path before matching
    const strippedPath = this.#stripBasePath(givenPath)
    const path = (strippedPath.length > 1 && strippedPath.at(-1) === '/')
      ? strippedPath.substring(0, strippedPath.length - 1)
      : strippedPath

    // First, try to find exact path match
    if (this.#errors[path]) {
      return this.#errors[path]
    }

    // Then walk up the directory tree
    const segments = path.split('/').filter(Boolean)
    console.log('Path segments:', segments)

    // Check from most specific to least specific path
    for (let i = segments.length; i >= 1; i--) {
      const checkPath = '/' + segments.slice(0, i).join('/')

      if (this.#errors[checkPath]) {
        return this.#errors[checkPath]
      }
    }

    // Finally check root level
    if (this.#errors['/']) {
      return this.#errors['/']
    }

    console.log('No error component found')
    return null
  }

  get basePath(): string {
    return this.#basePath
  }

  getFullPath(routePath: string): string {
    // Add basePath to the beginning of the path
    if (this.#basePath === '/') {
      return routePath
    }

    if (routePath === '/') {
      return this.#basePath
    }

    // Check if path already starts with basePath
    if (routePath.startsWith(this.#basePath)) {
      return routePath
    }

    return this.#basePath + routePath
  }

  getPathFromUrl(fullUrl: string): string {
    try {
      // Extract pathname from URL object
      const url = new URL(fullUrl)
      let pathname = url.pathname

      // Strip basePath if it exists
      pathname = this.#stripBasePath(pathname)

      // Remove trailing slash (unless it's the root)
      if (pathname.length > 1 && pathname.endsWith('/')) {
        pathname = pathname.slice(0, -1)
      }

      return pathname
    } catch (ex) { // eslint-disable-line
      // If URL parsing fails, assume it's already a path
      return this.#stripBasePath(fullUrl)
    }
  }

  getAllViewComponents() {
    return Object.values(this.#routes).map(route => ({
      Component: route.component,
      Layouts: route.layouts,
      meta: route.meta
    }))
  }

  #constructLayoutList(routePath: string): ParsedRouteLayout[] {
    const layouts: ParsedRouteLayout[] = []

    // Segment the view path (e.g ['/', 'user', 'profile'])
    const segments = ['/', ...routePath.match(/[^/]+/g) || []]

    let path = segments[0]
    for (let n = 0; n < segments.length; n++) {
      const segmentLayouts = []

      for (const layoutId in this.#layouts) {
        const [layoutPath, key] = layoutId.split('#')

        if (layoutPath === path) {
          segmentLayouts.push({
            key,
            component: this.#layouts[layoutId]
          })
        }
      }

      layouts.push(...segmentLayouts)
      path += segments[n + 1]
    }

    return layouts
  }
}
