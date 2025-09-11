import { useEffect, useState } from 'react'
import { useRouter } from './useRouter'
import { getTransitionState, ViewDef, ViewTransiationMode } from '../lib/history'
import { usePrevious } from './usePrevious'
import type { ViewMetadata } from '../lib/RouterRegistry'

export interface StackedView {
  mode: ViewTransiationMode
  view: ViewDef
  meta: ViewMetadata | undefined
  Component?: React.ComponentType<unknown>
  Layout?: React.ComponentType<unknown>
  params?: Record<string, string>
}

/**
 * Expose navigate function and current view stack and
 * what triggered the stack change or load.
 */
export function useViewStack(): StackedView[] {
  const { state, clientRouter } = useRouter() || {}
  const [transitionState, setTransitionsState] = useState<StackedView[]>([])

  const prevViews = usePrevious(state.views)

  useEffect(() => {
    if (JSON.stringify(state.views) === JSON.stringify(prevViews)) {
      return
    }

    const transition = getTransitionState(state.views, prevViews).map(({ mode, view }) => {
      const url = new URL(view.url, 'http://dummy.base') // Dummy ensure relative paths work
      const { Component, meta, Layout, params } = clientRouter?.getViewComponentByPath(url.pathname) || {}

      return {
        mode,
        view,
        meta,
        Component,
        Layout,
        params
      }
    })

    setTransitionsState(transition)

    // We specifically only want the cleanState change to trigger us
    // eslint-disable-next-line
  }, [state.views])

  return transitionState
}
