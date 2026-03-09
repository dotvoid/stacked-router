import { ViewDef } from './history'

/**
 * Shallow comparison for view arrays - checks if views have actually changed
 * This helps prevent unnecessary rerenders when state object reference changes
 * but content is the same
 */
export function viewsAreEqual(
  viewsA: ViewDef[] | undefined,
  viewsB: ViewDef[] | undefined
): boolean {
  if (!viewsA || !viewsB) {
    return viewsA === viewsB
  }

  if (viewsA.length !== viewsB.length) {
    return false
  }

  for (let i = 0; i < viewsA.length; i++) {
    const a = viewsA[i]
    const b = viewsB[i]

    // Compare view properties
    if (
      a.id !== b.id ||
      a.url !== b.url ||
      a.layout !== b.layout ||
      a.target !== b.target
    ) {
      return false
    }

    // Compare params (shallow)
    if (!shallowEqual(a.params, b.params)) {
      return false
    }

    // Compare queryParams (shallow)
    if (!shallowEqual(a.queryParams, b.queryParams)) {
      return false
    }

    // Compare props (shallow)
    if (!shallowEqual(a.props, b.props)) {
      return false
    }

    // Compare meta (if present)
    if (a.meta !== b.meta) {
      if (!a.meta || !b.meta) {
        return false
      }
      // Add meta comparison if needed
      if (a.meta.type !== b.meta.type) {
        return false
      }
    }
  }

  return true
}

function shallowEqual(
  a: Record<string, unknown> | undefined,
  b: Record<string, unknown> | undefined
): boolean {
  if (a === b) {
    return true
  }

  if (!a || !b) {
    return false
  }

  const keysA = Object.keys(a)
  const keysB = Object.keys(b)

  if (keysA.length !== keysB.length) {
    return false
  }

  for (const key of keysA) {
    if (a[key] !== b[key]) {
      return false
    }
  }

  return true
}
