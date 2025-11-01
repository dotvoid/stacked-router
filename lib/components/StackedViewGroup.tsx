import { type CSSProperties, useEffect, useMemo, useState } from 'react'
import { useViewStack } from '../hooks/useViewStack'
import { ViewProvider } from '../contexts/ViewProvider'
import { calculateAllocations } from '../lib/allocation'
import type { StackedView } from '../hooks/useViewStack'
import { DefaultLayout } from './DefaultLayout'
import type { ParsedRouteLayout } from '../lib/RouterRegistry'
import { SlotProvider } from '../contexts/SlotProvider'
import { ErrorBoundary } from './ErrorBoundary'

export function StackedViewGroup({
  className,
  style = {}
}: {
  className?: string
  style?: CSSProperties
}) {
  const { viewStack } = useViewStack()
  const [width, setWidth] = useState(window.innerWidth)

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Calculate allocations based on current views
  const allocs = useMemo(() => {
    return calculateAllocations(width, viewStack)
  }, [width, viewStack])

  // Calculate which views actually fit based on available width
  const visibleViews = useMemo(() => {
    let totalWidth = 0
    let startIdx = 0

    for (let i = viewStack.length - 1; i >= 0; i--) {
      totalWidth += allocs[i]?.vw || 0
      if (totalWidth > 100) {
        startIdx = i + 1
        break
      }
    }

    return viewStack.slice(startIdx)
  }, [allocs, viewStack])

  // Extract actual view widths for visible views
  const viewWidths = useMemo(() => {
    const offset = viewStack.length - visibleViews.length
    return visibleViews.map((_, i) => allocs[i + offset].vw)
  }, [allocs, viewStack.length, visibleViews])

  return (
    <RenderedViews
      views={visibleViews}
      widths={viewWidths}
      style={style}
      className={className}
    />
  )
}

function RenderedViews({
  views,
  widths,
  className,
  style = {}
}: {
  views: StackedView[]
  widths: number[]
  className?: string
  style?: CSSProperties
}) {
  return (
    <SlotProvider>
      <div className={className} style={style}>
        {views.map(({ view, params, Layouts, Component }, i) => {
          // If no component was found for requested view, render a 404 error boundary
          if (!Component) {
            return (
              <ErrorBoundary
                key={view.id}
                viewUrl={view.url}
                errorCode={404}
                error={new Error('Not found')}
              />
            )
          }

          const LayoutWrappers = (Layouts?.length)
            ? Layouts.filter(layout => layout.key === view.layout)
            : [{ component: DefaultLayout }] as ParsedRouteLayout[]

          return (
            <ErrorBoundary key={view.id} viewUrl={view.url || '/'}>
              <ViewProvider
                key={view.id}
                id={view.id}
                width={widths[i]}
                params={params}
                queryParams={view.queryParams}
                props={view.props}
              >
                {renderNestedLayouts(LayoutWrappers, Component, params)}
              </ViewProvider>
            </ErrorBoundary>
          )
        })}
      </div>
    </SlotProvider>
  )
}

// Helper function to recursively render nested layouts
function renderNestedLayouts(
  layouts: Array<{ key?: string; component: React.ComponentType<React.PropsWithChildren> }>,
  Component: React.ComponentType<unknown>,
  params?: Record<string, unknown>
): React.ReactNode {
  if (layouts.length === 0) {
    return <Component {...(params || {})} />
  }

  const [currentLayout, ...remainingLayouts] = layouts
  const CurrentLayout = currentLayout.component

  return (
    <CurrentLayout key={currentLayout.key}>
      {renderNestedLayouts(remainingLayouts, Component, params)}
    </CurrentLayout>
  )
}
