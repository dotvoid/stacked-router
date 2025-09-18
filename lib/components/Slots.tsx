import { useContext, useEffect } from 'react'
import { SlotContext } from '../contexts/SlotContext'

/**
 * Use in layout to render header slot content
 */
export function SlotHeader() {
  const { slots } = useContext(SlotContext)
  return <>{slots.header}</>
}

/**
 * Use in layout to render the footer slot content
 */
export function SlotFooter() {
  const { slots } = useContext(SlotContext)
  return <>{slots.footer}</>
}

/**
 * Use in view component to render content in layout header slot
 */
export function LayoutHeader({ children }: { children: React.ReactNode }) {
  const { setSlot } = useContext(SlotContext)

  useEffect(() => {
    setSlot('header', children)
    return () => setSlot('header', null)
  }, [children, setSlot])

  return null
}

/**
* Use in view component to render content in layout footer slot
 */
export function LayoutFooter({ children }: { children: React.ReactNode }) {
  const { setSlot } = useContext(SlotContext)

  useEffect(() => {
    setSlot('footer', children)
    return () => setSlot('footer', null)
  }, [children, setSlot])

  return null
}
