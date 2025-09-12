import { createContext } from 'react'

export interface ViewContextType {
  viewId: string
  isActive: boolean
  width: number
  duration: number
  params?: Record<string, string>
  queryParams?: Record<string, string | number | boolean>
  setQueryParams: (queryParams: Record<string, string | number | boolean | undefined>, replaceAll?: boolean) => void
  queryParam: (key: string) => string | number | boolean | undefined
  props?: Record<string, string | number | boolean>
  setProps: (queryParams: Record<string, string | number | boolean | undefined>, replaceAll?: boolean) => void
}

export const ViewContext = createContext<ViewContextType>({
  viewId: '',
  isActive: false,
  width: 0,
  duration: 0,
  queryParams: {},
  setQueryParams: () => { },
  setProps: () => { },
  queryParam: () => { return undefined }
})
