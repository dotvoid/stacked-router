import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { RouterContext, type RouterState } from '../lib/contexts/RouterContext'
import { useViewStack } from '../lib/hooks/useViewStack'
import type { ViewDef } from '../lib/lib/history'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

type Result = ReturnType<typeof useViewStack>

function view(id: string, target?: ViewDef['target']): ViewDef {
  return { id, url: `/${id}`, target }
}

function context(views: ViewDef[]): RouterState {
  return {
    trigger: 'load',
    state: { id: 'state', views },
    navigate: () => {},
    close: () => {}
  }
}

describe('useViewStack', () => {
  let container: HTMLDivElement
  let root: Root
  let latest: Result

  function Probe() {
    latest = useViewStack()
    return null
  }

  function render(value: RouterState) {
    act(() => {
      root.render(
        <RouterContext.Provider value={value}>
          <Probe />
        </RouterContext.Provider>
      )
    })
  }

  beforeEach(() => {
    container = document.createElement('div')
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
  })

  it('splits views into regular and void stacks by target', () => {
    render(context([view('a'), view('b', '_void'), view('c')]))

    expect(latest.viewStack.map((s) => s.view.id)).toEqual(['a', 'c'])
    expect(latest.voidViews.map((s) => s.view.id)).toEqual(['b'])
  })

  it('returns a stable reference when state.views is unchanged', () => {
    const views = [view('a')]
    render(context(views))
    const first = latest

    // Re-render with a brand new context object but the same views array.
    render(context(views))

    expect(latest).toBe(first)
  })

  it('reuses the cache when views are deeply equal but a new array', () => {
    render(context([view('a'), view('b')]))
    const first = latest

    // New array, new view objects, identical content.
    render(context([view('a'), view('b')]))

    expect(latest).toBe(first)
  })

  it('reflects view changes on consecutive renders (regression)', () => {
    render(context([view('a')]))
    expect(latest.viewStack.map((s) => s.view.id)).toEqual(['a'])

    // Two genuine changes back to back. The previous useMemo-on-a-boolean
    // shape returned a stale stack on the second change.
    render(context([view('a'), view('b')]))
    expect(latest.viewStack.map((s) => s.view.id)).toEqual(['a', 'b'])

    render(context([view('a'), view('b'), view('c')]))
    expect(latest.viewStack.map((s) => s.view.id)).toEqual(['a', 'b', 'c'])
  })
})
