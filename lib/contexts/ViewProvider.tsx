import { PropsWithChildren, useEffect, useState } from "react"
import { ViewContext } from "./ViewContext"
import { useRouter } from "../hooks/useRouter"
import { updateProps, updateQueryParams } from "../lib/history"

export function ViewProvider({
  id: viewId,
  width,
  duration,
  layout,
  children,
  params,
  queryParams,
  props
}: PropsWithChildren & {
  id: string
  width: number // Target view width as a percentage
  duration: number // Animation duration in ms
  layout?: string // Used layout key
  params?: Record<string, string>
  queryParams?: Record<string, string | number | boolean>
  props?: Record<string, string | number | boolean>
}) {
  const { state, close } = useRouter()
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
      layout,
      setProps: (partialProps, replaceAll) => {
        const newProps = (replaceAll !== true)
          ? { ...props || {} } // Use existing props as base
          : {} // Start with empty object to replace existing props

        let update = false
        for (const key in partialProps) {
          const value = partialProps[key]

          if (typeof value !== 'undefined') {
            newProps[key] = value // Set new value
            update = true
          } else if (Object.prototype.hasOwnProperty.call(newProps, key)) {
            delete newProps[key] // Delete existing value
            update = true
          }
        }

        if (update || replaceAll === true) {
          updateProps(viewId, newProps)
        }
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
