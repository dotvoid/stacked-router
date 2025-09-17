import { type CSSProperties, useEffect, useMemo, useState } from 'react'
import { useViewStack } from '../hooks/useViewStack'
import { ViewProvider } from '../contexts/ViewProvider'
import { calculateAllocations } from '../lib/allocation'
import { StackedView } from '../hooks/useViewStack'
import { DefaultLayout } from './DefaultLayout'
import type { ParsedRouteLayout } from '../lib/RouterRegistry'

export function StackedViewGroup({ duration = 0, className, style = {} }: {
  duration?: number
  className?: string
  style?: CSSProperties
}) {
  return (
    <ViewStackContainer duration={duration} className={className} style={style} />
  )
}

function ViewStackContainer({ duration = 0, className, style = {} }: {
  duration?: number
  className?: string
  style?: CSSProperties
}) {
  const { viewStack } = useViewStack()
  const [openViews, setOpenViews] = useState<StackedView[]>(viewStack)
  const [width, setWidth] = useState(window.innerWidth)

  useEffect(() => {
    // FIXME: Should be at least a tiny bit debounced
    const onResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    // Timeout (275ms) that matches animations from css - 25ms to accomodate
    // for the gap (we want to remove the view just a tiny bit of time
    // before the the animation ends or the gap will give an ipression
    // of a slight jerkiness)
    const timeoutId = setTimeout(() => {
      const remainingViews = viewStack.filter(({ mode }) => mode !== 'disappear')
      setOpenViews(remainingViews.map((rv) => {
        return {
          ...rv,
          mode: 'both' // We reset all views to just stay as is
        }
      }))
    }, duration)

    return () => clearTimeout(timeoutId)
  }, [viewStack, width, duration])

  // Calculate allocations for start and end of transitions
  const allocs = useMemo(() => {
    // const start = calculateAllocations2(width, viewStack, 'start')
    return calculateAllocations(width, openViews, 'end')
  }, [width, openViews])

  // Calculate which views actually fit as to how much each view
  // requires of the available total 100% width.
  const views = useMemo(() => {
    let totalWidth = 0
    let startIdx = 0

    for (let i = openViews.length - 1; i >= 0; i--) {
      totalWidth += allocs[i]?.vw || 0
      if (totalWidth > 100) {
        startIdx = i + 1
        break
      }
    }

    return openViews.slice(startIdx)
  }, [allocs, openViews])

  // Extract actual view widths for all visible/rendered views
  const viewWidths = useMemo(() => {
    const viewWidths: number[] = []
    views.map((_, i) => {
      viewWidths.push(allocs[i + (openViews.length - views.length)].vw)
    })

    return viewWidths
  }, [allocs, openViews, views])

  return (
    <RenderedViews
      views={views}
      widths={viewWidths}
      style={style}
      className={className}
      duration={duration}
    />
  )
}

function RenderedViews({ views, widths, duration = 0, className, style = {} }: {
  views: StackedView[]
  widths: number[]
  duration?: number
  className?: string
  style?: CSSProperties
}) {
  return (
    <div className={className} style={style}>
      {views.map(({ view, params, Layouts, Component }, i) => {
        const LayoutWrappers = (Layouts?.length)
          ? Layouts.filter(layout => layout.key === view.layout)
          : [{ component: DefaultLayout }] as ParsedRouteLayout[]

        return (
          <ViewProvider
            key={view.id}
            id={view.id}
            width={widths[i]}
            duration={duration}
            params={params}
            queryParams={view.queryParams}
            props={view.props}
          >
            {renderNestedLayouts(LayoutWrappers, Component, params)}
          </ViewProvider>
        )
      })}
    </div>
  )
}

// Helper function to recursively render nested layouts
function renderNestedLayouts(
  layouts: Array<{ key?: string; component: React.ComponentType<React.PropsWithChildren> }>,
  Component: React.ComponentType<unknown> | undefined,
  params?: Record<string, unknown>
): React.ReactNode {
  if (layouts.length === 0) {
    // Base case: no more layouts, render the component
    return Component ? <Component {...(params || {})} /> : null
  }

  const [currentLayout, ...remainingLayouts] = layouts
  const CurrentLayout = currentLayout.component

  return (
    <CurrentLayout key={currentLayout.key}>
      {renderNestedLayouts(remainingLayouts, Component, params)}
    </CurrentLayout>
  )
}
