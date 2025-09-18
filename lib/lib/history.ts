import { emit } from './events'
import { parseSearch } from './href'
import type { RouterRegistry } from './RouterRegistry'

export interface ViewDef {
  id: string
  url: string
  queryParams?: Record<string, string | number | boolean>
  props?: Record<string, string | number | boolean>
  layout?: string
  target?: '_self' | '_top' | '_blank' | '_void'
}

export interface ViewState {
  id: string,
  views: ViewDef[]
}

export type ViewTransiationMode = 'init' | 'both' | 'appear' | 'disappear'
export type ViewTransitionState = Array<{
  mode: ViewTransiationMode
  view: ViewDef
}>

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
  const newState = { ...state }

  let updateView = -1
  for (let n = 0; n < newState.views.length; n++) {
    if (newState.views[n].id === id) {
      if (!paramsAreEqual(newState.views[n].queryParams, queryParams)) {
        newState.views[n].queryParams = queryParams
        updateView = n
      }
      break
    }
  }

  if (updateView > -1) {
    const url = new URL(window.location.href)
    url.search = new URLSearchParams(
      Object.entries(queryParams).map(([key, value]) => [key, String(value)])
    ).toString()

    newState.views[updateView].url = url.toString()
    replaceHistoryState(url.toString(), newState)
  }
}

export function updateProps(
  id: string,
  props: Record<string, string | number | boolean>
) {
  const { state } = getHistoryState()
  const newState = { ...state }

  let updateView = -1
  for (let n = 0; n < newState.views.length; n++) {
    if (newState.views[n].id === id) {
      if (!paramsAreEqual(newState.views[n].props, props)) {
        newState.views[n].props = props
        updateView = n
      }
      break
    }
  }

  if (updateView > -1) {
    replaceHistoryState(window.location.href, newState)
  }
}

export function closeView(
  viewId: string | null,
  state: ViewState
) {
  const views = [...state.views].filter((view) => view.id !== viewId)

  const newState = { ...state, views }
  replaceHistoryState(views.at(-1)?.url ?? '', newState)
}

export function navigateHistory(
  registry: RouterRegistry,
  viewId: string | null,
  path: string,
  queryParams: Record<string, string | number | boolean>,
  state: ViewState,
  options: {
    append: boolean,
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

  // Find index of view if we already have this view open
  const existing = views.find((view) => {
    return url === view.url
  })

  // Don't do anything if we clicked current open url and don't force append
  if (options.target !== '_top' && !options.append && existing?.id === state.id) {
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

    // Focus the already opened view
    if (!options.append && existing) {
      replaceHistoryState(url, {
        id: existing.id,
        views
      })
      return
    }
  }

  // Append last if forced to append or if opening into a void outlet
  if (options.append || options.target === '_void') {
    views.push({
      id,
      url,
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

/**
 * Combines current views and previous views into a single array with transition modes
 */
export function getTransitionState(
  currentViews: ViewDef[],
  prevViews: ViewDef[] | null | undefined
): ViewTransitionState {
  // If there are no previous views, all current views are in 'init' mode
  if (!prevViews || prevViews.length === 0) {
    return currentViews.map(view => ({
      mode: 'init',
      view
    }))
  }

  const views: ViewTransitionState = []
  const disappearingViews: ViewTransitionState = []
  for (const prevView of prevViews) {
    const currView = currentViews.find(currView => currView.id === prevView.id)
    if (currView) {
      views.push({ view: currView, mode: 'both' })
    } else {
      disappearingViews.push({ view: prevView, mode: 'disappear' })
    }
  }

  const appearingViews: ViewTransitionState = []
  for (const currView of currentViews) {
    if (!views.find(({ view: sortedView }) => sortedView.id === currView.id)) {
      appearingViews.push({
        view: currView,
        mode: 'appear'
      })
    }
  }

  return [...views, ...disappearingViews, ...appearingViews]
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
    // If one is undefined they are not equal
    return false
  }

  if (typeof (a) === 'undefined' || typeof (b) === 'undefined') {
    // They are both the same type, if one is undfined both are
    // and they are equal (must check both for typeguard to work)
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
