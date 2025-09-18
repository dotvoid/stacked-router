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
  layouts?: React.ComponentType<React.PropsWithChildren>[]
  meta?: ViewMetadata
}

export interface RouterConfig {
  routes: RouteConfig[]
  layouts?: Record<string, React.ComponentType<React.PropsWithChildren>>
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

  constructor(config: RouterConfig, basePath?: string) {
    this.#basePath = basePath || this.#basePath
    this.#layouts = config.layouts || {}
    this.#registerRoutes(config.routes)
  }

  #registerRoutes(routes: RouteConfig[]) {
    routes.forEach(route => {
      // Parse and handle dynamic parameters in paths to views, ignoring
      // all patterns starting with _ (underscore) as they are layouts.
      const paramKeys: string[] = []
      const regexPattern = route.path.replace(/\[([^\]]+)\]/g, (_, param) => {
        paramKeys.push(param)
        return '([^/]+)'
      })

      const patternRegex = new RegExp(`^${regexPattern}$`)

      this.#routes[route.path] = {
        component: route.component,
        pattern: patternRegex,
        paramKeys,
        originalPath: route.path,
        layouts: (route.layouts?.length)
          ? route.layouts.map((l) => { return {component: l} }) // Component specified routes
          : this.constructLayoutList(route.path), // Path found routes
        meta: route.meta || { breakpoints: [] }
      }
    })
  }

  getViewComponentByPath(givenPath: string) {
    const path = (givenPath.length > 1 && givenPath.at(-1) === '/')
      ? givenPath.substring(0, givenPath.length - 1)
      : givenPath

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

  getAllViewComponents() {
    return Object.values(this.#routes).map(route => ({
      Component: route.component,
      Layouts: route.layouts,
      meta: route.meta
    }))
  }

  private constructLayoutList(routePath: string): ParsedRouteLayout[] {
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
