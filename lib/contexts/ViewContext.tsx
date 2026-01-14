import { createContext } from 'react'
import type { ViewState } from '../lib/history'

export interface ViewContextType {
  viewId: string
  isActive: boolean
  vw: number
  layout?: string
  params?: Record<string, string>
  queryParams?: Record<string, string | number | boolean>
  setQueryParams: (queryParams: Record<string, string | number | boolean | undefined>, replaceAll?: boolean) => void
  queryParam: (key: string) => string | number | boolean | undefined
  props?: Record<string, string | number | boolean>
  setProps: (queryParams: Record<string, string | number | boolean | undefined>, replaceAll?: boolean) => void
  close: () => void,
  state: ViewState
}

export const ViewContext = createContext<ViewContextType>({
  viewId: '',
  isActive: false,
  vw: 0,
  queryParams: {},
  setQueryParams: () => { },
  setProps: () => { },
  queryParam: () => { return undefined },
  close: () => { },
  state: { id: '', views: [] }
})
