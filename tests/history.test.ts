import { describe, it, expect, beforeEach } from 'vitest'
import { metaIsEqual, updateMeta, updateProps, updateQueryParams } from '../lib/lib/history'
import { viewsAreEqual } from '../lib/lib/viewsAreEqual'

/**
 * Regression tests for the immutability invariant the React tree
 * depends on. The original 1.1.3 code did `const newState = { ...state }`
 * then mutated `newState.views[i].queryParams = ...` in place. Downstream
 * consumers (notably useViewStack) ref-key their cache off
 * `state.views` AND off the per-view object reference; an in-place
 * mutation produces an identical reference, the cache returns stale
 * data, and the URL bar updates while the UI freezes on the prior
 * queryParams.
 *
 * These tests don't render React - they assert directly on the
 * history state that updateQueryParams / updateProps produce. If
 * the array reference OR the touched view reference matches the
 * prior state, we've regressed back to the in-place pattern.
 */

function priorHistoryState() {
  return window.history.state as { id: string, views: Array<Record<string, unknown>> }
}

describe('updateQueryParams', () => {
  beforeEach(() => {
    window.history.replaceState({
      id: 'v1',
      views: [
        { id: 'v1', url: '/p', queryParams: { a: '1' }, props: {} },
        { id: 'v2', url: '/q', queryParams: { b: '2' }, props: {} }
      ]
    }, '', '/p')
  })

  it('produces a new views array reference', () => {
    const before = priorHistoryState().views
    updateQueryParams('v1', { a: '9' })
    const after = priorHistoryState().views
    expect(after).not.toBe(before)
  })

  it('produces a new touched-view reference', () => {
    const before = priorHistoryState().views[0]
    updateQueryParams('v1', { a: '9' })
    const after = priorHistoryState().views[0]
    expect(after).not.toBe(before)
    expect(after.queryParams).toEqual({ a: '9' })
  })

  it('leaves untouched views referentially identical', () => {
    const beforeV2 = priorHistoryState().views[1]
    updateQueryParams('v1', { a: '9' })
    const afterV2 = priorHistoryState().views[1]
    // The OTHER view's object reference should be unchanged - we
    // only clone what we touched. This is what lets downstream
    // memoisation skip re-rendering siblings.
    expect(afterV2).toBe(beforeV2)
  })

  it('no-ops when the queryParams are deep-equal', () => {
    const before = priorHistoryState().views
    updateQueryParams('v1', { a: '1' })
    const after = priorHistoryState().views
    // No change requested -> same references (we never re-wrote).
    expect(after).toBe(before)
  })
})

describe('updateProps', () => {
  beforeEach(() => {
    window.history.replaceState({
      id: 'v1',
      views: [
        { id: 'v1', url: '/p', queryParams: {}, props: { x: 'a' } }
      ]
    }, '', '/p')
  })

  it('produces a new views array reference', () => {
    const before = priorHistoryState().views
    updateProps('v1', { x: 'b' })
    const after = priorHistoryState().views
    expect(after).not.toBe(before)
  })

  it('produces a new touched-view reference', () => {
    const before = priorHistoryState().views[0]
    updateProps('v1', { x: 'b' })
    const after = priorHistoryState().views[0]
    expect(after).not.toBe(before)
    expect(after.props).toEqual({ x: 'b' })
  })
})

describe('updateMeta', () => {
  const narrow = { type: 'article', breakpoints: [{ breakpoint: 1024, minVw: 40 }] }
  const wide = { type: 'article', breakpoints: [{ breakpoint: 1024, minVw: 70 }] }

  beforeEach(() => {
    window.history.replaceState({
      id: 'v1',
      views: [
        { id: 'v1', url: '/p', meta: narrow, queryParams: {}, props: {} },
        { id: 'v2', url: '/q', queryParams: {}, props: {} }
      ]
    }, '', '/p')
  })

  it('replaces the view metadata with new references, leaving other views alone', () => {
    const before = priorHistoryState().views
    updateMeta('v1', wide)
    const after = priorHistoryState().views
    expect(after).not.toBe(before)
    expect(after[0]).not.toBe(before[0])
    expect(after[0].meta).toEqual(wide)
    expect(after[1]).toBe(before[1])
  })

  it('no-ops when the metadata is equal', () => {
    const before = priorHistoryState().views
    updateMeta('v1', { ...narrow, breakpoints: [...narrow.breakpoints] })
    expect(priorHistoryState().views).toBe(before)
  })

  it('makes views unequal when only the breakpoints changed', () => {
    const before = priorHistoryState().views as never
    updateMeta('v1', wide)
    expect(viewsAreEqual(before, priorHistoryState().views as never)).toBe(false)
  })

  it('compares type and every breakpoint', () => {
    expect(metaIsEqual(narrow, { ...narrow })).toBe(true)
    expect(metaIsEqual(narrow, wide)).toBe(false)
    expect(metaIsEqual(narrow, { ...narrow, type: 'other' })).toBe(false)
    expect(metaIsEqual(undefined, undefined)).toBe(true)
    expect(metaIsEqual(narrow, undefined)).toBe(false)
  })
})
