import { emit } from './events'
import { parseSearch } from './href'
import type { RouterRegistry, ViewMetadata } from './RouterRegistry'
import { calculateAllocations, firstVisibleIndex } from './allocation'

export interface ViewDef {
  id: string
  url: string
  meta?: ViewMetadata
  params?: Record<string, string>
  queryParams?: Record<string, string | number | boolean>
  props?: Record<string, string | number | boolean>
  layout?: string
  target?: '_self' | '_top' | '_blank' | '_void'
}

export interface ViewState {
  id: string
  views: ViewDef[]
}

export function getHistoryState() {
  const { state, length } = window.history
  const { href } = window.location

  const viewState = isValidViewStateStructure(state)
    ? state
    : createInitialState(href)

  return {
    state: viewState,
    length
  }
}

function pushHistoryState(url: string, state: ViewState) {
  history.pushState(state, '', url)
  emit('pushstate', state)
}

function replaceHistoryState(url: string, state: ViewState) {
  history.replaceState(state, '', url)
  emit('replacestate', state)
}

/**
 * Focus a specific history view
 */
export function setActiveViewId(toId: string) {
  const { id, views } = getHistoryState().state
  if (id === toId) {
    return
  }

  const view = views.find(v => v.id === toId)
  if (!view) {
    return
  }

  replaceHistoryState(view.url, {
    id: view.id,
    views
  })
}

function createInitialState(url: string): ViewState {
  const id = crypto.randomUUID()
  const urlObj = new URL(url)

  const initialState = {
    id,
    views: [{
      id,
      url,
      queryParams: parseSearch(urlObj.search),
      props: {}
    }]
  }

  replaceHistoryState(url, initialState)
  return initialState
}

export function updateQueryParams(
  id: string,
  queryParams: Record<string, string | number | boolean>
) {
  const { state } = getHistoryState()

  // Clone the array AND the touched view object so the references
  // differ from the prior state. Consumers (notably useViewStack)
  // ref-key their cache off `state.views` and per-view objects; an
  // in-place mutation would update the URL bar but leave the
  // React tree showing the cached, stale queryParams.
  let updateView = -1
  for (let n = 0; n < state.views.length; n++) {
    if (state.views[n].id === id) {
      if (!paramsAreEqual(state.views[n].queryParams, queryParams)) {
        updateView = n
      }
      break
    }
  }
  if (updateView === -1) return

  const url = new URL(window.location.href)
  url.search = new URLSearchParams(
    Object.entries(queryParams).map(([key, value]) => [key, String(value)])
  ).toString()

  const nextViews = [...state.views]
  nextViews[updateView] = {
    ...state.views[updateView],
    queryParams,
    url: url.toString()
  }
  const newState: ViewState = { ...state, views: nextViews }

  replaceHistoryState(url.toString(), newState)
}

export function updateProps(
  id: string,
  props: Record<string, string | number | boolean>
) {
  const { state } = getHistoryState()

  // Same clone-on-touch pattern as updateQueryParams: array
  // reference differs + touched view reference differs, so
  // downstream caches see real change.
  let updateView = -1
  for (let n = 0; n < state.views.length; n++) {
    if (state.views[n].id === id) {
      if (!paramsAreEqual(state.views[n].props, props)) {
        updateView = n
      }
      break
    }
  }
  if (updateView === -1) return

  const nextViews = [...state.views]
  nextViews[updateView] = {
    ...state.views[updateView],
    props
  }
  const newState: ViewState = { ...state, views: nextViews }

  replaceHistoryState(window.location.href, newState)
}

/**
 * Replace a view's metadata - its type and width breakpoints - for as
 * long as the view stays in the history. A view whose layout changes
 * while it is open (a side pane opening, say) uses this to ask for the
 * width the new layout needs; the stack reallocates widths at once.
 *
 * The metadata lives in the history entry, so back and forward restore
 * it with the view. It must be structured-cloneable plain data.
 */
export function updateMeta(id: string, meta: ViewMetadata) {
  const { state } = getHistoryState()
  const index = state.views.findIndex((view) => view.id === id)
  if (index === -1 || metaIsEqual(state.views[index].meta, meta)) return

  // Clone-on-touch, as updateQueryParams does, so caches keyed on the
  // views array and view objects see the change.
  const nextViews = [...state.views]
  nextViews[index] = { ...state.views[index], meta }
  replaceHistoryState(window.location.href, { ...state, views: nextViews })
}

/** Whether two metadata objects have the same type and breakpoints. */
export function metaIsEqual(a: ViewMetadata | undefined, b: ViewMetadata | undefined): boolean {
  if (a === b) return true
  if (!a || !b || a.type !== b.type) return false
  const ab = a.breakpoints ?? []
  const bb = b.breakpoints ?? []
  return ab.length === bb.length && ab.every((x, i) =>
    x.breakpoint === bb[i].breakpoint && x.minVw === bb[i].minVw)
}

export function closeView(
  viewId: string | null,
  state: ViewState
) {
  const views = [...state.views].filter((view) => view.id !== viewId)

  // The active view stays active if it is still open. Closing the active
  // view hands focus to the last open one, so the state never points at
  // a view that is gone.
  const active = views.find((view) => view.id === state.id) ?? views.at(-1)
  const newState = { ...state, id: active?.id ?? '', views }
  replaceHistoryState(active?.url ?? '', newState)
}

export function navigateHistory(
  registry: RouterRegistry,
  viewId: string | null,
  path: string,
  queryParams: Record<string, string | number | boolean>,
  state: ViewState,
  options: {
    append: boolean
    target?: '_self' | '_top' | '_blank' | '_void'
    props?: Record<string, string | number | boolean>
    layout?: string
  }
) {
  const views = [...state.views]
  const id = crypto.randomUUID()

  // Add basePath to the URL for navigation
  const fullUrl = registry.getFullPath(path)

  // Create full URL with query params
  const urlWithParams = new URL(fullUrl, window.location.origin)
  Object.entries(queryParams).forEach(([key, value]) => {
    urlWithParams.searchParams.set(key, String(value))
  })
  const url = urlWithParams.toString()

  // Parse route params from the path
  const parsedRoute = registry.getViewComponentByPath(urlWithParams.pathname)
  const params = parsedRoute?.params || {}

  // Find index of view if we already have this view open
  const found = views.find((view) => {
    return url === view.url
  })

  // Revisiting an open view with props hands it the new props: the URL
  // is the same, but what the view is scoped to (an assignment, say)
  // is not. Without props, the view keeps those it has. A new view is
  // appended rather than revisited when `append` is set.
  let existing = found
  if (found && !options.append && options.props !== undefined
    && !paramsAreEqual(found.props, options.props)) {
    existing = { ...found, props: options.props }
    views[views.indexOf(found)] = existing
  }

  // Clicking the current open url only passes on new props, if any,
  // unless forced to append
  if (options.target !== '_top' && !options.append && existing?.id === state.id) {
    if (existing !== found) {
      replaceHistoryState(url, { id: existing.id, views })
    }
    return
  }

  if (!options.append) {
    if (options.target === '_top') {
      // Takeover the whole app
      const takeoverView = (existing)
        ? existing
        : {
          id,
          url,
          meta: parsedRoute?.meta ?? undefined,
          params,
          queryParams,
          props: options.props,
          target: options?.target,
          layout: options?.layout
        }
      pushHistoryState(url, {
        id: takeoverView.id,
        views: [takeoverView]
      })
      return
    }

    // An already opened view that is on screen is focused where it is.
    // One that is hidden off the left edge (a narrow screen showing a
    // single view, say) is moved instead: taken out of its place and
    // opened after the current view, as a new history entry. It then
    // appears where a newly opened view would, Back returns to where
    // the reader came from, and the view keeps its state.
    if (!options.append && existing) {
      if (isViewVisible(registry, views, existing.id)) {
        replaceHistoryState(url, {
          id: existing.id,
          views
        })
        return
      }

      const remaining = views.filter((view) => view.id !== existing.id)
      const currIndex = remaining.findIndex((view) => view.id === viewId)
      const movedViews = currIndex < 0
        ? [...remaining, existing]
        : [...remaining.slice(0, currIndex + 1), existing]
      pushHistoryState(url, {
        id: existing.id,
        views: movedViews
      })
      return
    }
  }

  // Append last if forced to append or if opening into a void outlet
  if (options.append || options.target === '_void') {
    views.push({
      id,
      url,
      meta: parsedRoute?.meta ?? undefined,
      params,
      queryParams,
      props: options.props,
      target: options?.target,
      layout: options?.layout
    })
    pushHistoryState(url, {
      id,
      views
    })
    return
  }

  // Default to push new view on the stack
  const currIndex = views.findIndex((view) => {
    return view.id === viewId
  })

  const newViews = views.slice(0, currIndex + 1)
  newViews.push({
    id,
    url,
    meta: parsedRoute?.meta ?? undefined,
    params,
    queryParams,
    props: options.props,
    target: options?.target,
    layout: options?.layout
  })

  pushHistoryState(url, {
    id,
    views: newViews
  })
}

function isValidViewStateStructure(value: unknown): value is ViewState {
  if (!value || typeof value !== 'object') {
    return false
  }

  return ('id' in value && 'views' in value && Array.isArray(value.views))
}

export function paramsAreEqual(
  a: Record<string, string | number | boolean | undefined> | undefined,
  b: Record<string, string | number | boolean | undefined> | undefined
): boolean {
  if (typeof (a) !== typeof (b)) {
    return false
  }

  if (typeof (a) === 'undefined' || typeof (b) === 'undefined') {
    return true
  }

  if (Object.keys(a).length !== Object.keys(b).length) {
    return false
  }

  for (const key in a) {
    if (!(key in b) || a[key] !== b[key] || typeof a[key] !== typeof b[key]) {
      return false
    }
  }

  return true
}

/**
 * Whether a view is on screen at the current window width, by the same
 * rule the stacked views are rendered with: only the right-most views
 * that fit are shown. Views opened into a void outlet take no width and
 * are not part of the stack. A view without stored metadata (the first
 * one loaded, say) is measured by its route's, as rendering does.
 */
function isViewVisible(registry: RouterRegistry, views: ViewDef[], id: string): boolean {
  const stack = views.filter((view) => view.target !== '_void')
  const index = stack.findIndex((view) => view.id === id)
  if (index < 0) return false
  const widths = calculateAllocations(
    window.innerWidth,
    stack.map((view) => ({ view, meta: view.meta || routeMeta(registry, view.url) }))
  ).map((a) => a.vw)
  return index >= firstVisibleIndex(widths)
}

/** The route's metadata for a view's URL, the fallback rendering uses. */
function routeMeta(registry: RouterRegistry, url: string): ViewMetadata | undefined {
  try {
    return registry.getViewComponentByPath(new URL(url, window.location.origin).pathname)?.meta
  } catch {
    return undefined
  }
}
