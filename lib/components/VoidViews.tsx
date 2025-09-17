import { type CSSProperties } from 'react'
import { useViewStack } from '../hooks/useViewStack'
import { ViewProvider } from '../contexts/ViewProvider'
import { StackedView } from '../hooks/useViewStack'
import { DefaultLayout } from './DefaultLayout'
import type { ParsedRouteLayout } from '../lib/RouterRegistry'

export function VoidViews({ className, style = {} }: {
  duration?: number
  className?: string
  style?: CSSProperties
}) {
  const { voidViews } = useViewStack()
  return (
    <RenderedViews
      views={voidViews}
      style={style}
      className={className}
    />
  )
}

function RenderedViews({ views, className, style = {} }: {
  views: StackedView[]
  className?: string
  style?: CSSProperties
}) {

  return (
    <div className={className} style={style}>
      {views.map(({ view, params, Layouts, Component }) => {
        const LayoutWrappers = (Layouts?.length)
          ? Layouts.filter(layout => layout.key === view.layout)
          : [{ component: DefaultLayout}] as ParsedRouteLayout[]

        return (
          <ViewProvider
            key={view.id}
            id={view.id}
            width={0}
            duration={0}
            params={params}
            queryParams={view.queryParams}
            props={view.props}
            layout={view.layout}
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
