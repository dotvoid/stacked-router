import { PropsWithChildren, useCallback, useEffect, useRef, useState } from "react"
import { ViewContext } from "./ViewContext"
import { useRouter } from "../hooks/useRouter"
import { updateMeta, updateProps, updateQueryParams } from "../lib/history"
import type { ViewMetadata } from "../lib/RouterRegistry"

export function ViewProvider({
  id: viewId,
  vw,
  layout,
  children,
  params,
  queryParams,
  props
}: PropsWithChildren & {
  id: string
  vw: number // Target view width as a percentage
  layout?: string // Used layout key
  params?: Record<string, string>
  queryParams?: Record<string, string | number | boolean>
  props?: Record<string, string | number | boolean>
}) {
  const { state, close } = useRouter()
  const [isActive, setIsActive] = useState(viewId === state.id)
  const [localProps, setLocalProps] = useState(props || {})

  // Refs mirror the latest localProps + queryParams so the
  // setProps / setQueryParams callbacks below merge against the
  // current value, not the closure value captured at first render.
  // Without this, two setProps calls in the same tick (or after
  // an unrelated re-render) overwrite each other - the second
  // merges against the FIRST render's parent props, dropping the
  // first call's writes.
  const localPropsRef = useRef(localProps)
  useEffect(() => {
    localPropsRef.current = localProps
  }, [localProps])

  const queryParamsRef = useRef(queryParams)
  useEffect(() => {
    queryParamsRef.current = queryParams
  }, [queryParams])

  useEffect(() => {
    setIsActive(viewId === state.id)
  }, [state.id, viewId])

  // Stable across renders, so a view can list it in an effect's
  // dependencies without that effect running on every render.
  const setMeta = useCallback((meta: ViewMetadata) => {
    updateMeta(viewId, meta)
  }, [viewId])

  return (
    <ViewContext.Provider value={{
      viewId,
      isActive,
      vw,
      params,
      queryParams,
      props: localProps,
      layout,
      state,
      setProps: (partialProps, replaceAll) => {
        const base = replaceAll ? {} : (localPropsRef.current ?? {})
        const newProps = { ...base, ...(partialProps || {}) }

        for (const key in newProps) {
          if (newProps[key] === undefined) {
            delete newProps[key]
          }
        }

        setLocalProps(newProps as Record<string, string | number | boolean>)
        updateProps(viewId, newProps as Record<string, string | number | boolean>)
      },
      setQueryParams: (partialQueryParams, replaceAll) => {
        // Merge against the LATEST queryParams (via ref), not
        // props. The original code read `props` here, which is
        // (a) the wrong field entirely and (b) a stale closure.
        const newQueryParams: Record<string, string | number | boolean> = (replaceAll !== true)
          ? { ...(queryParamsRef.current ?? {}) }
          : {}

        let updateParams = false
        for (const key in partialQueryParams) {
          const value = partialQueryParams[key]

          if (typeof value !== 'undefined') {
            newQueryParams[key] = value // Set new value
            updateParams = true
          } else if (Object.prototype.hasOwnProperty.call(newQueryParams, key)) {
            delete newQueryParams[key] // Delete existing value
            updateParams = true
          }
        }

        if (updateParams || replaceAll === true) {
          updateQueryParams(viewId, newQueryParams)
        }
      },
      queryParam: (key) => {
        // Read from queryParams, not props. The original code
        // returned props[key] here which was a separate bug from
        // the merge issues above but the same root cause:
        // confusing the two field sets.
        return queryParams?.[key]
      },
      setMeta,
      close: () => {
        close(viewId)
      }
    }}>
      {children}
    </ViewContext.Provider>
  )
}
