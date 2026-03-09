import { createContext } from 'react'

export interface SlotContextType {
  setSlot: (viewId: string, name: string, content?: React.ReactNode) => void
  getSlots: (viewId: string) => Record<string, React.ReactNode>
}

export const SlotContext = createContext<SlotContextType>({
  setSlot: () => {},
  getSlots: () => ({})
})
