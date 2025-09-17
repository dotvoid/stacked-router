import { useCallback, useState } from 'react'
import { SlotContext, type Slots } from './SlotContext'

export function SlotProvider({ children }: {
  children: React.ReactNode
}) {
  const [slots, setSlots] = useState<Slots>({})

  const setSlot = useCallback((slot: keyof Slots, content?: React.ReactNode) => {
    setSlots(prev => ({ ...prev, [slot]: content }))
  }, [])

  return (
    <SlotContext.Provider value={{ setSlot, slots }}>
      {children}
    </SlotContext.Provider>
  );
}
