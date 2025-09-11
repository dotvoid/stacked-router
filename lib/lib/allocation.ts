import { StackedView } from "../hooks/useViewStack"
import { ViewTransiationMode } from "./history"

export interface BreakpointWidth {
  breakpoint: number // Width in pixels where this breakpoint applies
  minVw: number     // Minimum viewport width percentage needed
}

interface View {
  id: string
  breakpoints: BreakpointWidth[]
  mode: ViewTransiationMode
}

export interface ViewAllocation {
  id: string
  vw: number // Allocated viewport width as a percentage after any transitions
}


/**
 * Calculates viewport width percentage allocation for each view based on current screen width.
 *
 * At the start of a transition appearing views should be allocated 0 width.
 * At the end of a transition disappearing views should be allocated 0 width.
 *
 * @param screenWidthPx Current screen width in pixels
 * @param views Array of views with their breakpoint definitions
 * @param transition Whether the allocations are calculated for stat or end of a transition
 * @returns Array of view allocations with viewport width percentages assigned before and after
 */
export function calculateAllocations(screenWidthPx: number, viewStack: StackedView[], transition: 'start' | 'end'): ViewAllocation[] {
  const ignoredMode = transition === 'start' ? 'appear' : 'disappear'

  const views = viewStack
    .filter((sv) => sv.mode !== ignoredMode)
    .map(v => {
      return {
        id: v.view.id,
        breakpoints: v.meta?.breakpoints || [],
        mode: v.mode
      }
    })

  const widths = calculateViewWidths(screenWidthPx, views)

  return viewStack.map(({ view }) => {
    return {
      id: view.id,
      vw: widths.find((v) => v.id === view.id)?.vw || 0
    }
  })
}

/**
 * Utility function to generate a responsive CSS width style based on vw percentage
 */
export function getViewWidthStyle(vw: number): React.CSSProperties {
  return {
    width: `${vw}vw`,
    flexBasis: `${vw}vw`,
    flexGrow: 0,
    flexShrink: 0,
  }
}


/**
 * Calculates viewport width percentage allocation for each view based on current screen width
 *
 * @param screenWidthPx Current screen width in pixels
 * @param views Array of views with their breakpoint definitions
 * @returns Array of view allocations with viewport width percentages assigned
 */
function calculateViewWidths(screenWidthPx: number, views: View[]): {
  id: string
  vw: number
}[] {
  const TOTAL_VW = 100 // Total available viewport width percentage

  // If no views, return empty array
  if (views.length === 0) {
    return []
  }

  // Calculate minimum vw needed for each view at current screen width
  const viewsWithMinVw = views.map(view => ({
    id: view.id,
    minVw: getMinimumVwForView(view, screenWidthPx)
  }))

  // Calculate total minimum vw needed
  const totalMinVw = viewsWithMinVw.reduce(
    (total, view) => total + view.minVw,
    0
  )

  // If we don't have enough viewport width, return the minimum required for each
  if (totalMinVw >= TOTAL_VW) {
    return viewsWithMinVw.map(view => ({
      id: view.id,
      vw: view.minVw
    }))
  }

  // We have extra width to distribute proportionally
  const extraVw = TOTAL_VW - totalMinVw

  // Distribute extra vw proportionally to each view's minimum requirement
  return viewsWithMinVw.map(view => {
    const proportion = view.minVw / totalMinVw
    const extraVwForView = extraVw * proportion

    return {
      id: view.id,
      vw: Number((view.minVw + extraVwForView).toFixed(0)) // Round to 0 decimal places
    }
  })
}


/**
 * Gets the minimum viewport width percentage required for a view at the current screen width
 *
 * @param view The view with breakpoint definitions
 * @param screenWidthPx Current screen width in pixels
 * @returns Minimum viewport width percentage needed
 */
function getMinimumVwForView(view: View, screenWidthPx: number): number {
  // Sort breakpoints from largest to smallest
  const sortedBreakpoints = [...view.breakpoints].sort((a, b) => b.breakpoint - a.breakpoint)

  // Find the applicable breakpoint (first one smaller than or equal to current screen width)
  const applicableBreakpoint = sortedBreakpoints.find(bp => screenWidthPx >= bp.breakpoint)

  // Return the minimum vw for the applicable breakpoint, or default to 100 if none found
  return applicableBreakpoint ? applicableBreakpoint.minVw : 100
}
