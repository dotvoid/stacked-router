import { BreakpointWidth } from "./allocation"

export interface PageComponent {
  default: React.ComponentType<unknown>
  [key: string]: unknown
}

export interface ViewMetadata {
  breakpoints: BreakpointWidth[]
}

export interface RouteConfig {
  path: string
  component: React.ComponentType<unknown>
  layout?: React.ComponentType<unknown>
  meta?: ViewMetadata
}

export interface RouterConfig {
  routes: RouteConfig[]
  layouts?: Record<string, React.ComponentType<unknown>>
}

interface ParsedRoute {
  component: React.ComponentType<unknown>
  pattern: RegExp
  paramKeys: string[]
  originalPath: string
  layout?: React.ComponentType<unknown>
  meta: ViewMetadata
}

export class RouterRegistry {
  private routes: Record<string, ParsedRoute> = {}
  private layouts: Record<string, React.ComponentType<unknown>> = {}

  constructor(config: RouterConfig) {
    this.layouts = config.layouts || {}
    this.registerRoutes(config.routes)
  }

  private registerRoutes(routes: RouteConfig[]) {
    routes.forEach(route => {
      // Parse and handle dynamic parameters in paths to views, ignoring
      // all patterns starting with _ (underscore) as they are layouts.
      const paramKeys: string[] = []
      const regexPattern = route.path.replace(/\[([^\]]+)\]/g, (_, param) => {
        paramKeys.push(param)
        return '([^/]+)'
      })

      const patternRegex = new RegExp(`^${regexPattern}$`)

      this.routes[route.path] = {
        component: route.component,
        pattern: patternRegex,
        paramKeys,
        originalPath: route.path,
        layout: route.layout || this.findClosestLayout(route.path),
        meta: route.meta || { breakpoints: [] }
      }
    })
  }

  getViewComponentByPath(path: string) {
    for (const key in this.routes) {
      const route = this.routes[key]
      const match = path.match(route.pattern)
      if (match) {
        const params = Object.fromEntries(
          route.paramKeys.map((key, i) => [key, match[i + 1]])
        )
        return {
          Component: route.component,
          Layout: route.layout,
          params,
          meta: route.meta
        }
      }
    }
    return null
  }

  getAllViewComponents() {
    return Object.values(this.routes).map(route => ({
      Component: route.component,
      Layout: route.layout,
      meta: route.meta
    }))
  }

  private findClosestLayout(path: string): React.ComponentType<unknown> | undefined {
    const segments = path.split('/')
    while (segments.length > 0) {
      const layoutPath = segments.join('/') || '/'
      if (this.layouts[layoutPath]) {
        return this.layouts[layoutPath]
      }
      segments.pop()
    }
    return undefined
  }
}
