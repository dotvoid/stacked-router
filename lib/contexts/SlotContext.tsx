import { createContext } from 'react'

export interface Slots {
  header?: React.ReactNode
  footer?: React.ReactNode
}

export interface SlotContextType {
  setSlot: (slot: keyof Slots, content?: React.ReactNode) => void
  slots: Slots
}

export const SlotContext = createContext<SlotContextType>({
  setSlot: () => {},
  slots: {}
})
