import { type CSSProperties, type PropsWithChildren, useEffect, useRef } from 'react'
import { setActiveViewId } from '../lib/history'
import { off, on } from '../lib/events'
import { useView } from '../hooks/useView'

export function StackedView({ children, style = {}, className }: PropsWithChildren & {
  className?: string
  style?: CSSProperties
}) {
  const { viewId } = useView()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) {
      return
    }

    // Focus event handler
    const onMouseDown = () => {
      setActiveViewId(viewId)
    }

    const el = ref.current
    on(el, 'mousedown', onMouseDown)
    return () => off(el, 'mousedown', onMouseDown)
  }, [viewId, ref])

  return (
    <div ref={ref} style={style} className={className}>
      {children}
    </div >
  )
}
