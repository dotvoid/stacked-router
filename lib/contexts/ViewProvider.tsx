import { PropsWithChildren, useEffect, useState } from "react"
import { ViewContext } from "./ViewContext"
import { useRouter } from "../hooks/useRouter"
import { updateQueryParams } from "../lib/history"

export function ViewProvider({
  id: viewId,
  width,
  duration,
  children,
  params,
  queryParams,
  props
}: PropsWithChildren & {
  id: string
  width: number // Target view width as a percentage
  duration: number // Animation duration in ms
  params?: Record<string, string>
  queryParams?: Record<string, string | number | boolean>
  props?: Record<string, string | number | boolean>
}) {
  const { state } = useRouter()
  const [isActive, setIsActive] = useState(viewId === state.id)

  useEffect(() => {
    setIsActive(viewId === state.id)
  }, [state, viewId])

  return (
    <ViewContext.Provider value={{
      viewId,
      isActive,
      width,
      duration,
      params,
      queryParams,
      props,
      setQueryParams: (partialQueryParams, replaceAll) => {
        const newQueryParams = (replaceAll !== true)
          ? { ...queryParams || {} } // Use existing query params as base
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
        return queryParams?.[key]
      }
    }}>
      {children}
    </ViewContext.Provider>
  )
}
