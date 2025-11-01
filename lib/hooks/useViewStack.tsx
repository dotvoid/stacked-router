import { useEffect, useState } from 'react'
import { useRouter } from './useRouter'
import { ViewDef } from '../lib/history'
import type { ParsedRouteLayout, ViewMetadata } from '../lib/RouterRegistry'

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
  const [viewStack, setViewStack] = useState<StackedView[]>([])
  const [voidViews, setVoidViews] = useState<StackedView[]>([])

  useEffect(() => {
    const regularViews: StackedView[] = []
    const voidViewsList: StackedView[] = []

    state.views.forEach((view) => {
      const url = new URL(view.url, 'http://dummy.base')
      const routeData = clientRouter?.getViewComponentByPath(url.pathname)

      // Prefer params from state (if they exist), otherwise use parsed params
      const params = view.params || routeData?.params || {}

      const stackedView: StackedView = {
        view,
        meta: routeData?.meta,
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

    setViewStack(regularViews)
    setVoidViews(voidViewsList)
  }, [state.views, clientRouter])

  return {
    viewStack,
    voidViews: voidViews
  }
}
