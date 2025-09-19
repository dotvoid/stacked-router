import { useCallback, useState } from 'react'
import { SlotContext, type Slots } from './SlotContext'

export function SlotProvider({ children }: {
  children: React.ReactNode
}) {
  // Store slots per viewId: { viewId1: { header: ..., footer: ... }, viewId2: { ... } }
  const [viewSlots, setViewSlots] = useState<Record<string, Slots>>({})

  const setSlot = useCallback((viewId: string, slot: keyof Slots, content?: React.ReactNode) => {
    setViewSlots(prev => ({
      ...prev,
      [viewId]: {
        ...prev[viewId],
        [slot]: content
      }
    }))
  }, [])

  const getSlots = useCallback((viewId: string): Slots => {
    return viewSlots[viewId] || {}
  }, [viewSlots])

  return (
    <SlotContext.Provider value={{ setSlot, getSlots }}>
      {children}
    </SlotContext.Provider>
  )
}
