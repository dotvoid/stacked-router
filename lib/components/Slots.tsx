import { useContext, useEffect } from 'react'
import { SlotContext } from '../contexts/SlotContext'
import { useView } from '../main'

/**
 * Use in layout to render slot content
 */
export function Outlet({ slot }: { slot: string }) {
  const { viewId } = useView()
  const { getSlots } = useContext(SlotContext)
  const slots = getSlots(viewId)
  return <>{slots[slot]}</>
}

/**
 * Use in view component to define content for a slot
 */
export function Fill({ slot, children }: {
  slot: string
  children: React.ReactNode
}) {
  const { viewId } = useView()
  const { setSlot } = useContext(SlotContext)

  useEffect(() => {
    setSlot(viewId, slot, children)
    return () => setSlot(viewId, slot, null)
  }, [viewId, slot, children, setSlot])

  return null
}
