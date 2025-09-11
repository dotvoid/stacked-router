import { createContext } from 'react'

import { type ViewState } from '../lib/history'
import type { RouterRegistry } from '../lib/RouterRegistry'
export type Trigger = 'init' | 'load' | 'popstate' | 'pushstate' | 'replacestate'

export interface RouterState {
  clientRouter?: RouterRegistry,
  trigger: Trigger
  state: ViewState
  length?: number
  hash?: string
  host?: string
  hostname?: string
  href?: string
  origin?: string
  pathname?: string
  port?: string
  protocol?: string
  search?: string
  navigate: (
    viewId: string | null,
    url: string,
    queryParams: Record<string, string | number | boolean>,
    options: {
      append: boolean
      target?: '_self' | '_top'
    }
  ) => void
}

export const RouterContext = createContext<RouterState>({
  trigger: 'init',
  state: {
    id: '',
    views: []
  },
  navigate: () => { }
})
