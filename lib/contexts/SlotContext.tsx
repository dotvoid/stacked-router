import { createContext } from 'react'

// export interface Slot {
//   content?: React.ReactNode
//   onReceiveProps?: (props: unknown) => void
// }

// FIXME: header/footer should be Slot to receive props
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
