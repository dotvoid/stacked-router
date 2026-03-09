import { type CSSProperties, type PropsWithChildren, useEffect, useMemo, useRef } from 'react'
import { setActiveViewId } from '../lib/history'
import { off, on } from '../lib/events'
import { useView } from '../hooks/useView'

export function StackedView({ children, style: userlandStyle = {}, className: userlandClassName }: PropsWithChildren & {
  className?: string
  style?: CSSProperties
}) {
  const { viewId } = useView()
  const ref = useRef<HTMLDivElement>(null)

  // Support vanilla css container queries on views
  const style = useMemo(() => {
    const style = { ...userlandStyle}

    if (!style.containerType) {
      style.containerType = 'size'
    }

    if (!style.containerName) {
      style.containerName = 'view'
    }

    return style
  }, [userlandStyle])

  // Support tailwind container queries on views
  const className = useMemo(() => {
    let className = userlandClassName ?? ''

    if (!className.includes('@container')) {
      className += ' @container/view'
    }

    return className
  }, [userlandClassName])

  useEffect(() => {
    if (!ref.current) {
      return
    }

    // Focus event handler
    const onMouseDown = () => {
      setActiveViewId(viewId)
    }

    const el = ref.current
    on(el, 'click', onMouseDown)
    return () => off(el, 'click', onMouseDown)
  }, [viewId, ref])

  return (
    <div ref={ref} style={style} className={className}>
      {children}
    </div >
  )
}
