import type { RouteConfig, RouterConfig, PageComponent } from './RouterRegistry'

/**
 * Helper function to discover routes from import.meta.glob
 */
export function mapRoutes(
  modules: Record<string, unknown>,
  basePath: string = ''
): RouterConfig {
  const routes: RouteConfig[] = []
  const layouts: Record<string, React.ComponentType<unknown>> = {}

  Object.entries(modules).forEach(([modulePath, module]) => {
    let pathPattern = modulePath
      .replace(basePath, '')
      .replace(/\.tsx$/, '')
      .replace(/\/index$/, '')
      .replace(/([A-Z])/g, match => `/${match.toLowerCase()}`)
      .replace(/\/\//g, '/')
      .toLowerCase() || '/'

    if (pathPattern === '' || pathPattern === 'index') {
      // Handle index routes: if path is empty or 'index', make it '/'
      pathPattern = '/'
    } else if (pathPattern && !pathPattern.startsWith('/')) {
      // Ensure non-root paths start with '/'
      pathPattern = '/' + pathPattern
    }

    if (pathPattern.endsWith('/_layout')) {
      const layoutPath = pathPattern.replace(/\/_layout$/, '') || '/'
      layouts[layoutPath] = (module as PageComponent).default
    } else if (!pathPattern.includes('/_')) {
      routes.push({
        path: pathPattern,
        component: (module as PageComponent).default,
        // @ts-expect-error meta is not defined
        meta: module.default?.meta || { breakpoints: [] }
        // TODO: Get hold of exported loader function
      })
    }
  })

  return { routes, layouts }
}
