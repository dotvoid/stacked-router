import { useRef } from 'react'
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
 * Expose the current view stack, split into regular and `_void` views.
 *
 * A ref-backed cache lets consumers re-render for unrelated reasons
 * without rebuilding the stack every time. We recompute only when
 * `state.views` is no longer deeply equal to the views we last built
 * from, or when `clientRouter` changes reference. The cache is purely
 * derived from those inputs, so computing it during render (and a
 * discarded concurrent/StrictMode render) is safe.
 */
export function useViewStack(): {
  viewStack: StackedView[]
  voidViews: StackedView[]
} {
  const { state, clientRouter } = useRouter() || {}

  type Cache = {
    views: ViewDef[] | undefined
    clientRouter: typeof clientRouter
    result: { viewStack: StackedView[], voidViews: StackedView[] }
  }
  const cacheRef = useRef<Cache | null>(null)

  // Cheap reference check first; only fall through to the deep
  // `viewsAreEqual` check when the reference actually changed.
  const cached = cacheRef.current
  const viewsRefDiffers = cached?.views !== state.views
  const routerRefDiffers = cached?.clientRouter !== clientRouter
  const needsRecompute = !cached
    || routerRefDiffers
    || (viewsRefDiffers && !viewsAreEqual(cached.views, state.views))

  if (needsRecompute) {
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

    cacheRef.current = {
      views: state.views,
      clientRouter,
      result: { viewStack: regularViews, voidViews: voidViewsList }
    }
  } else if (viewsRefDiffers) {
    // Deeply equal but a new array reference: refresh the stored
    // reference so future cheap checks short-circuit instead of
    // re-running viewsAreEqual on every render.
    cached!.views = state.views
  }

  // Safe: either we just populated the cache, or `needsRecompute`
  // was false, which implies `cached` was non-null.
  return cacheRef.current!.result
}
