import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { RouterRegistry } from '../lib/lib/RouterRegistry'
import { closeView, navigateHistory, type ViewState, type ViewDef } from '../lib/lib/history'

/**
 * Revisiting a view that is already open but hidden off the left edge
 * (a phone shows one view) must move it after the current view as a new
 * history entry, so it appears and Back returns to where the reader
 * came from. A view that is on screen is only focused, as before.
 */

const Noop = () => null
// Full width on a phone, 40vw from 1024px: two views fit side by side
// on a desktop, one on a phone.
const meta = { breakpoints: [{ breakpoint: 0, minVw: 100 }, { breakpoint: 1024, minVw: 40 }] }
const registry = new RouterRegistry({
  routes: [
    { path: '/plannings/[id]', component: Noop, meta },
    { path: '/articles/[id]', component: Noop, meta },
    { path: '/wires/[id]', component: Noop, meta }
  ]
})
const urlOf = (path: string) => new URL(registry.getFullPath(path), window.location.origin).toString()

const planning: ViewDef = { id: 'p', url: urlOf('/plannings/1'), meta, props: { tab: 'a' } }
const article: ViewDef = { id: 'a', url: urlOf('/articles/2'), meta, props: {} }
const wire: ViewDef = { id: 'w', url: urlOf('/wires/3'), meta, props: {} }

const originalWidth = window.innerWidth
function setWidth(px: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: px })
}

function openPlanning(state: ViewState, from: string | null, props?: Record<string, string>) {
  navigateHistory(registry, from, '/plannings/1', {}, state, { append: false, props })
}

function historyState() {
  return window.history.state as ViewState
}

describe('navigateHistory: revisiting a hidden view', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/')
  })
  afterEach(() => setWidth(originalWidth))

  it('moves a hidden view after the current one, as a new history entry', () => {
    setWidth(390)
    const before = window.history.length
    openPlanning({ id: 'a', views: [planning, article] }, 'a')

    const { id, views } = historyState()
    expect(id).toBe('p')
    expect(views.map((v) => v.id)).toEqual(['a', 'p'])
    expect(window.history.length).toBe(before + 1)
  })

  it('keeps the moved view itself: same id and props', () => {
    setWidth(390)
    openPlanning({ id: 'a', views: [planning, article] }, 'a')
    const moved = historyState().views.find((v) => v.id === 'p')
    expect(moved).toEqual(planning)
  })

  it('hands a moved view new props when they differ', () => {
    setWidth(390)
    openPlanning({ id: 'a', views: [planning, article] }, 'a', { tab: 'b' })
    const moved = historyState().views.find((v) => v.id === 'p')
    expect(moved?.props).toEqual({ tab: 'b' })
  })

  it('drops the views after the current one, like any newly opened view', () => {
    setWidth(390)
    openPlanning({ id: 'a', views: [planning, article, wire] }, 'a')
    expect(historyState().views.map((v) => v.id)).toEqual(['a', 'p'])
  })

  it('appends at the end when the navigation comes from outside any view', () => {
    setWidth(390)
    openPlanning({ id: 'a', views: [planning, article] }, null)
    expect(historyState().views.map((v) => v.id)).toEqual(['a', 'p'])
  })

  it('measures a view without stored metadata by its route, as rendering does', () => {
    // The first view loaded carries no meta of its own.
    setWidth(1440)
    const before = window.history.length
    const bare: ViewDef = { id: 'p', url: urlOf('/plannings/1'), props: {} }
    openPlanning({ id: 'a', views: [bare, article] }, 'a')

    expect(historyState().views.map((v) => v.id)).toEqual(['p', 'a'])
    expect(window.history.length).toBe(before)
  })

  it('only focuses a view that is on screen, leaving the order alone', () => {
    setWidth(1440)
    const before = window.history.length
    openPlanning({ id: 'a', views: [planning, article] }, 'a')

    const { id, views } = historyState()
    expect(id).toBe('p')
    expect(views.map((v) => v.id)).toEqual(['p', 'a'])
    expect(window.history.length).toBe(before)
  })
})

describe('closeView', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/')
  })

  it('hands focus to the last open view when the active view is closed', () => {
    closeView('p', { id: 'p', views: [article, planning] })
    const { id, views } = historyState()
    expect(views.map((v) => v.id)).toEqual(['a'])
    expect(id).toBe('a')
  })

  it('keeps the active view when another view is closed', () => {
    closeView('w', { id: 'a', views: [planning, article, wire] })
    const { id, views } = historyState()
    expect(views.map((v) => v.id)).toEqual(['p', 'a'])
    expect(id).toBe('a')
  })
})
