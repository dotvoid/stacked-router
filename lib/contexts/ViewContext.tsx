import { createContext } from 'react'
import type { ViewState } from '../lib/history'
import type { ViewMetadata } from '../lib/RouterRegistry'

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
  /**
   * Replace this view's metadata while it is open - for a view whose
   * layout changes and needs other widths (a side pane opening). Pass
   * the full metadata; the view's route metadata is the usual base.
   */
  setMeta: (meta: ViewMetadata) => void
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
  setMeta: () => { },
  queryParam: () => { return undefined },
  close: () => { },
  state: { id: '', views: [] }
})
