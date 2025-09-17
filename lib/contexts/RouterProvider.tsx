import { PropsWithChildren, useEffect, useMemo, useState } from "react"
import { RouterContext, RouterState, Trigger } from "./RouterContext"
import { off, on } from '../lib/events'
import { closeView, getHistoryState, navigateHistory } from "../lib/history"
import { RouterRegistry, RouterConfig } from "../lib/RouterRegistry"

export function RouterProvider({ config, children }: PropsWithChildren & {
  config: RouterConfig
}) {
  const [state, setState] = useState(buildState('load'))

  const clientRouter = useMemo(() => {
    return new RouterRegistry(config)
  }, [config])

  useEffect(() => {
    const onPopState = () => setState(buildState('popstate'))
    const onPushState = () => setState(buildState('pushstate'))
    const onReplaceState = () => setState(buildState('replacestate'))

    on(window, 'popstate', onPopState)
    on(window, 'pushstate', onPushState)
    on(window, 'replacestate', onReplaceState)

    return () => {
      off(window, 'popstate', onPopState)
      off(window, 'pushstate', onPushState)
      off(window, 'replacestate', onReplaceState)
    }
  }, [])

  return (
    <RouterContext.Provider value={{clientRouter, ...state}}>
      {children}
    </RouterContext.Provider>
  )
}


function buildState(trigger: Trigger): RouterState {
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
      navigateHistory(viewId, url, queryParams, state, options)
    },
    close: (viewId) => {
      closeView(viewId, state)
    }
  }
}
