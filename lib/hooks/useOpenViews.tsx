import { useMemo } from 'react'
import { useRouter } from './useRouter'
import { ViewDef } from '../lib/history'

export type OpenView = Exclude<ViewDef, 'meta'> & {
  isActive: boolean
}

/**
 * Hook to find open views that match specific criteria
 *
 * @param type - The view type to match against view.meta.type
 * @param params - Optional params to match. Only the specified params need to match (partial match)
 * @returns Array of matching views with their state
 *
 * @example
 * // Find all article views
 * const articleViews = useOpenViews('article')
 *
 * @example
 * // Find all article views for a specific article
 * const views = useOpenViews('article', { id: '123' })
 *
 * @example
 * // Find all section views for a specific section
 * const sectionViews = useOpenViews('section', { sectionId: 'sports' })
 */
export function useOpenViews(
  type: string,
  params?: Record<string, string>
): OpenView[] {
  const { state } = useRouter()

  const matchingViews = useMemo(() => {
    const matches: OpenView[] = []

    state.views.forEach((view) => {
      // Check if meta.type matches
      if (view.meta?.type !== type) {
        return
      }

      // If params are specified, check if they match (partial match)
      if (params) {
        const viewParams = view.params || {}

        // Check if all specified params match
        const paramsMatch = Object.entries(params).every(([key, value]) => {
          return viewParams[key] === value
        })

        if (!paramsMatch) {
          return
        }
      }

      // View matches criteria
      matches.push({
        id: view.id,
        url: view.url,
        params: view.params,
        queryParams: view.queryParams,
        props: view.props,
        layout: view.layout,
        target: view.target,
        isActive: view.id === state.id
      })
    })

    return matches
  }, [state.views, state.id, type, params])

  return matchingViews
}
