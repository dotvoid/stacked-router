import { PropsWithChildren, useEffect, useState } from "react"
import { ViewContext } from "./ViewContext"
import { useRouter } from "../hooks/useRouter"
import { updateProps, updateQueryParams } from "../lib/history"

export function ViewProvider({
  id: viewId,
  width,
  layout,
  children,
  params,
  queryParams,
  props
}: PropsWithChildren & {
  id: string
  width: number // Target view width as a percentage
  layout?: string // Used layout key
  params?: Record<string, string>
  queryParams?: Record<string, string | number | boolean>
  props?: Record<string, string | number | boolean>
}) {
  const { state, close } = useRouter()
  const [isActive, setIsActive] = useState(viewId === state.id)
  const [localProps, setLocalProps] = useState(props || {})

  useEffect(() => {
    setIsActive(viewId === state.id)
  }, [state, viewId])

  return (
    <ViewContext.Provider value={{
      viewId,
      isActive,
      width,
      params,
      queryParams,
      props: localProps,
      layout,
      state,
      setProps: (partialProps, replaceAll) => {
        const newProps = (replaceAll)
          ? partialProps || {}
          : { ...props, ...partialProps }

        for (const key in newProps) {
          if (newProps[key] === undefined) {
            delete newProps[key]
          }
        }

        setLocalProps(newProps as Record<string, string | number | boolean>)
        updateProps(viewId, newProps as Record<string, string | number | boolean>)
      },
      setQueryParams: (partialQueryParams, replaceAll) => {
        const newQueryParams = (replaceAll !== true)
          ? { ...props || {} } // Use existing query params as base
          : {} // Start with empty object to replace existing params

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
        return props?.[key]
      },
      close: () => {
        close(viewId)
      }
    }}>
      {children}
    </ViewContext.Provider>
  )
}
