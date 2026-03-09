import { useCallback, useState } from 'react'
import { SlotContext } from './SlotContext'

export function SlotProvider({ children }: {
  children: React.ReactNode
}) {
  // Store slots per viewId: { viewId1: { name1: content, name2: content }, viewId2: { ... } }
  const [viewSlots, setViewSlots] = useState<Record<string, Record<string, React.ReactNode>>>({})

  const setSlot = useCallback((viewId: string, name: string, content?: React.ReactNode) => {
    setViewSlots(prev => ({
      ...prev,
      [viewId]: {
        ...prev[viewId],
        [name]: content
      }
    }))
  }, [])

  const getSlots = useCallback((viewId: string): Record<string, React.ReactNode> => {
    return viewSlots[viewId] || {}
  }, [viewSlots])

  return (
    <SlotContext.Provider value={{ setSlot, getSlots }}>
      {children}
    </SlotContext.Provider>
  )
}
