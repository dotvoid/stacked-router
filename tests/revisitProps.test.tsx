import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { RouterRegistry } from '../lib/lib/RouterRegistry'
import { navigateHistory, type ViewState } from '../lib/lib/history'
import { RouterContext, type RouterState } from '../lib/contexts/RouterContext'
import { ViewProvider } from '../lib/contexts/ViewProvider'
import { useView } from '../lib/hooks/useView'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

/**
 * Revisiting a URL that is already open, with other props - the same
 * finder opened for another assignment - must hand the open view the
 * new props: in the history, and in the view's own `props`.
 */

const Noop: React.ComponentType<unknown> = () => null
const registry = new RouterRegistry({
  routes: [
    { path: '/start', component: Noop, meta: { breakpoints: [] } },
    { path: '/media/find', component: Noop, meta: { breakpoints: [] } }
  ]
})
const urlOf = (path: string) => new URL(registry.getFullPath(path), window.location.origin).toString()

function stateWith(activeId: string): ViewState {
  return {
    id: activeId,
    views: [
      { id: 'start', url: urlOf('/start'), props: {} },
      { id: 'finder', url: urlOf('/media/find'), props: { assignmentId: 'A' } }
    ]
  }
}

function historyState() {
  return window.history.state as ViewState
}

function go(state: ViewState, options: { append?: boolean, props?: Record<string, string> }) {
  navigateHistory(registry, null, '/media/find', {}, state, {
    append: options.append ?? false,
    props: options.props
  })
}

describe('navigateHistory: revisiting an open view', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/')
  })

  it('focuses the open view and hands it the new props', () => {
    go(stateWith('start'), { props: { assignmentId: 'B' } })
    const { id, views } = historyState()
    expect(id).toBe('finder')
    expect(views).toHaveLength(2)
    expect(views[1]).toMatchObject({ id: 'finder', props: { assignmentId: 'B' } })
  })

  it('hands new props to the active view too', () => {
    go(stateWith('finder'), { props: { assignmentId: 'B' } })
    expect(historyState().views[1].props).toEqual({ assignmentId: 'B' })
  })

  it('leaves the history alone when the active view gets the same props', () => {
    go(stateWith('finder'), { props: { assignmentId: 'A' } })
    expect(historyState()).toBeNull()
  })

  it('keeps the props a view has when none are given', () => {
    go(stateWith('start'), {})
    expect(historyState().views[1].props).toEqual({ assignmentId: 'A' })
  })

  it('appends a new view, leaving the open one as it was, when forced to append', () => {
    go(stateWith('start'), { append: true, props: { assignmentId: 'B' } })
    const { views } = historyState()
    expect(views).toHaveLength(3)
    expect(views[1].props).toEqual({ assignmentId: 'A' })
    expect(views[2].props).toEqual({ assignmentId: 'B' })
  })
})

describe('ViewProvider: props from the parent', () => {
  let container: HTMLDivElement
  let root: Root
  let latest: ReturnType<typeof useView>

  const router: RouterState = {
    trigger: 'load',
    state: { id: 'finder', views: [] },
    navigate: () => {},
    close: () => {}
  }

  function Probe() {
    latest = useView()
    return null
  }

  function render(props: Record<string, string>) {
    act(() => {
      root.render(
        <RouterContext.Provider value={router}>
          <ViewProvider id='finder' vw={50} props={props}>
            <Probe />
          </ViewProvider>
        </RouterContext.Provider>
      )
    })
  }

  beforeEach(() => {
    window.history.replaceState({ id: 'finder', views: [{ id: 'finder', url: '/', props: {} }] }, '', '/')
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  it('follows new props from the parent', () => {
    render({ assignmentId: 'A' })
    expect(latest.props).toEqual({ assignmentId: 'A' })
    render({ assignmentId: 'B' })
    expect(latest.props).toEqual({ assignmentId: 'B' })
  })

  it("keeps the view's own setProps writes while the parent props are unchanged", () => {
    const props = { assignmentId: 'A' }
    render(props)
    act(() => latest.setProps({ tab: 'audio' }))
    render(props)
    expect(latest.props).toEqual({ assignmentId: 'A', tab: 'audio' })
  })
})
