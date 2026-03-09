import { useMemo, useRef } from 'react'
import { useRouter } from './useRouter'
import { ViewDef } from '../lib/history'
import type { ParsedRouteLayout, ViewMetadata } from '../lib/RouterRegistry'
import { viewsAreEqual } from '../lib/viewsAreEqual'

export interface StackedView {
  view: ViewDef
  meta: ViewMetadata | undefined
  Component?: React.ComponentType<unknown>
  Layouts?: ParsedRouteLayout[]
  params?: Record<string, string>
  props?: Record<string, string | number | boolean>
}

/**
 * Expose navigate function and current view stack
 */
export function useViewStack(): {
  viewStack: StackedView[]
  voidViews: StackedView[]
} {
  const { state, clientRouter } = useRouter() || {}
  const prevViewsRef = useRef<ViewDef[]>(undefined)

  // Only recompute if views have actually changed
  const actuallyChanged = !viewsAreEqual(prevViewsRef.current, state.views)

  const result = useMemo(() => {
    const regularViews: StackedView[] = []
    const voidViewsList: StackedView[] = []

    state.views.forEach((view) => {
      const url = new URL(view.url, 'http://dummy.base')
      const routeData = clientRouter?.getViewComponentByPath(url.pathname)

      // Prefer data from state (if it exists), otherwise use parsed data
      const params = view.params || routeData?.params || {}
      const meta = view.meta || routeData?.meta

      const stackedView: StackedView = {
        view,
        meta,
        Component: routeData?.Component,
        Layouts: routeData?.Layouts,
        params
      }

      if (view.target === '_void') {
        voidViewsList.push(stackedView)
      } else {
        regularViews.push(stackedView)
      }
    })

    // Update ref after computing
    prevViewsRef.current = state.views

    return {
      viewStack: regularViews,
      voidViews: voidViewsList
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actuallyChanged, clientRouter])

  return result
}
