import type {
  RouteConfig,
  RouterConfig,
  PageComponent,
  ErrorComponentProps
} from './RouterRegistry'


/**
 * Helper function to discover routes from import.meta.glob
 */
export function mapRoutes(
  modules: Record<string, unknown>,
  basePath: string = ''
): RouterConfig {
  const routes: RouteConfig[] = []
  const layouts: Record<string, React.ComponentType<unknown>> = {}
  const errors: Record<string, React.ComponentType<ErrorComponentProps>> = {}

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

    // Check if this is an error file
    const errorMatch = pathPattern.match(/^(.*)\/(_error)$/)
    if (errorMatch) {
      const [, parentPath] = errorMatch
      const errorPath = parentPath || '/'
      console.log(`Storing error component for path: ${errorPath}`) // Debug log
      errors[errorPath] = (module as PageComponent).default as React.ComponentType<ErrorComponentProps>
      return
    }

    // Check if this is a layout file
    const layoutMatch = pathPattern.match(/^(.*)\/(_layout(?:\.([^/]+))?)$/)
    if (layoutMatch) {
      // We don't use the second desctructed value, hence empty slot
      const [, parentPath, , layoutId] = layoutMatch
      const layoutPath = parentPath || '/'

      if (layoutId) {
        // Named layout: _layout.{id}.tsx -> store as "{path}#key"
        const layoutKey = `${layoutPath}#${layoutId}`
        layouts[layoutKey] = (module as PageComponent).default
      } else {
        // Default layout: _layout.tsx -> store as "{path}"
        layouts[layoutPath] = (module as PageComponent).default
      }
    } else if (!pathPattern.includes('/_')) {
      // Regular route (not a layout or any other special file starting with _)
      routes.push({
        path: pathPattern,
        component: (module as PageComponent).default,
        // @ts-expect-error meta is not defined
        meta: module.default?.meta || { breakpoints: [] }
        // TODO: Get hold of exported loader function
      })
    }
  })

  return { routes, layouts, errors }
}
