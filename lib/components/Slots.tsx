import { useContext, useEffect } from 'react'
import { SlotContext } from '../contexts/SlotContext'
import { useView } from '../main'

/**
 * Use in layout to render header slot content
 */
export function SlotHeader() {
  const { viewId } = useView()
  const { getSlots } = useContext(SlotContext)
  const slots = getSlots(viewId)
  return <>{slots.header}</>
}

/**
 * Use in layout to render the footer slot content
 */
export function SlotFooter() {
  const { viewId } = useView()
  const { getSlots } = useContext(SlotContext)
  const slots = getSlots(viewId)
  return <>{slots.footer}</>
}

/**
 * Use in view component to render content in layout header slot
 */
export function LayoutHeader({ children }: { children: React.ReactNode }) {
  const { viewId } = useView()
  const { setSlot } = useContext(SlotContext)

  useEffect(() => {
    setSlot(viewId, 'header', children)
    return () => setSlot(viewId, 'header', null)
  }, [viewId, children, setSlot])

  return null
}

/**
 * Use in view component to render content in layout footer slot
 */
export function LayoutFooter({ children }: { children: React.ReactNode }) {
  const { viewId } = useView()
  const { setSlot } = useContext(SlotContext)

  useEffect(() => {
    setSlot(viewId, 'footer', children)
    return () => setSlot(viewId, 'footer', null)
  }, [viewId, children, setSlot])

  return null
}
