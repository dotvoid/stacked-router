import { PropsWithChildren, useEffect, useMemo, useState } from "react"
import { RouterContext, RouterState, Trigger } from "./RouterContext"
import { off, on } from '../lib/events'
import { closeView, getHistoryState, navigateHistory } from "../lib/history"
import { RouterRegistry, RouterConfig } from "../lib/RouterRegistry"

export function RouterProvider({ basePath, config, children }: PropsWithChildren & {
  basePath?: string
  config: RouterConfig
}) {
  const clientRouter = useMemo(() => {
    return new RouterRegistry(config, basePath)
  }, [config, basePath])

  const [state, setState] = useState(buildState('load', clientRouter))

  useEffect(() => {
    if (basePath && basePath !== '/' && window.location.pathname === '/') {
      window.history.replaceState(null, '', basePath)
    }
  }, [basePath])

  useEffect(() => {
    const onPopState = () => setState(buildState('popstate', clientRouter))
    const onPushState = () => setState(buildState('pushstate', clientRouter))
    const onReplaceState = () => setState(buildState('replacestate', clientRouter))

    on(window, 'popstate', onPopState)
    on(window, 'pushstate', onPushState)
    on(window, 'replacestate', onReplaceState)

    return () => {
      off(window, 'popstate', onPopState)
      off(window, 'pushstate', onPushState)
      off(window, 'replacestate', onReplaceState)
    }
  }, [clientRouter])

  return (
    <RouterContext.Provider value={{clientRouter, ...state}}>
      {children}
    </RouterContext.Provider>
  )
}


function buildState(trigger: Trigger, registry: RouterRegistry): RouterState {
  const { state, length } = getHistoryState()
  const { hash, host, hostname, href, origin, pathname, port, protocol, search } = window.location

  return {
    trigger,
    state,
    length,
    hash,
    host,
    hostname,
    href,
    origin,
    pathname,
    port,
    protocol,
    search,
    navigate: (viewId, url, queryParams, options) => {
      navigateHistory(registry, viewId, url, queryParams, state, options)
    },
    close: (viewId) => {
      closeView(viewId, state)
    }
  }
}
