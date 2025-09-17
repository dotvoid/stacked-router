import { useEffect, useState } from 'react'
import { useRouter } from './useRouter'
import { getTransitionState, ViewDef, ViewTransiationMode } from '../lib/history'
import { usePrevious } from './usePrevious'
import type { ParsedRouteLayout, ViewMetadata } from '../lib/RouterRegistry'

export interface StackedView {
  mode: ViewTransiationMode
  view: ViewDef
  meta: ViewMetadata | undefined
  Component?: React.ComponentType<unknown>
  Layouts?: ParsedRouteLayout[]
  params?: Record<string, string>
  props?: Record<string, string | number | boolean>
}

/**
 * Expose navigate function and current view stack and
 * what triggered the stack change or load.
 */
export function useViewStack(): {
  viewStack: StackedView[],
  voidViews: StackedView[]
} {
  const { state, clientRouter } = useRouter() || {}
  const [transitionState, setTransitionsState] = useState<StackedView[]>([])
  const [voidState, setVoidState] = useState<StackedView[]>([])
  const prevViews = usePrevious(state.views)

  useEffect(() => {
    if (JSON.stringify(state.views) === JSON.stringify(prevViews)) {
      return
    }

    const previousViews = prevViews?.filter(v => v.target !== '_void')
    const stateViews: ViewDef[] = []
    const voidViews: StackedView[] = []

    state.views.forEach((view) => {
      if (view.target !== '_void') {
        stateViews.push(view)
      } else {
        const url = new URL(view.url, 'http://dummy.base') // Dummy ensure relative paths work
        const { Component, meta, Layouts, params } = clientRouter?.getViewComponentByPath(url.pathname) || {}
        voidViews.push({
          mode: 'both',
          view,
          meta,
          Component,
          Layouts,
          params
        })
      }
    })

    const transitionViews = getTransitionState(stateViews, previousViews).map(({ mode, view }) => {
      const url = new URL(view.url, 'http://dummy.base') // Dummy ensure relative paths work
      const { Component, meta, Layouts, params } = clientRouter?.getViewComponentByPath(url.pathname) || {}

      return {
        mode,
        view,
        meta,
        Component,
        Layouts,
        params
      }
    })

    setVoidState(voidViews)
    setTransitionsState(transitionViews)

    // We specifically only want the cleanState change to trigger us
    // eslint-disable-next-line
  }, [state.views])

  return {
    viewStack: transitionState,
    voidViews: voidState
  }
}
