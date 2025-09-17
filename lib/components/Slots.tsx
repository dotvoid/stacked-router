import { useContext, useEffect } from 'react'
import { SlotContext } from '../contexts/SlotContext'

export function LayoutHeader() {
  const { slots } = useContext(SlotContext)
  return <>{slots.header}</>
}

export function LayoutFooter() {
  const { slots } = useContext(SlotContext)
  return <>{slots.footer}</>
}

export function ViewHeader({ children }: { children: React.ReactNode }) {
  const { setSlot } = useContext(SlotContext)

  useEffect(() => {
    setSlot('header', children)
    return () => setSlot('header', null)
  }, [children, setSlot])

  return null
}

export function ViewFooter({ children }: { children: React.ReactNode }) {
  const { setSlot } = useContext(SlotContext)

  useEffect(() => {
    setSlot('footer', children)
    return () => setSlot('footer', null)
  }, [children, setSlot])

  return null
}
