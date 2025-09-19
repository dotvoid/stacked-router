import { createContext } from 'react'

export interface Slots {
  header?: React.ReactNode
  footer?: React.ReactNode
}

export interface SlotContextType {
  setSlot: (viewId: string, slot: keyof Slots, content?: React.ReactNode) => void
  getSlots: (viewId: string) => Slots
}

export const SlotContext = createContext<SlotContextType>({
  setSlot: () => {},
  getSlots: () => ({})
})
