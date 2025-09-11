/**
 * Convert a relative url with params into url and its components.
 */
export function relativeUrl(
  to: string = '',
  params: Record<string, string | number | boolean> = {}
) {
  // Base ensures parsing works for relative URLs
  const url = new URL(to, 'http://dummy.base')
  const queryParams = {
    ...Object.fromEntries(url.searchParams.entries()),
    ...params
  }

  const search = new URLSearchParams(
    Object.entries(queryParams).map(([key, value]) => [key, String(value)])
  ).toString()

  // Build the final URL
  const isAbsolute = to.startsWith('http://') || to.startsWith('https://')
  const basePath = isAbsolute ? url.origin + url.pathname : url.pathname
  const path = basePath.endsWith('/') && basePath.length > 1
    ? basePath.slice(0, -1)
    : basePath

  return {
    url: search ? `${path}?${search}` : path,
    path: url.pathname,
    queryParams
  }
}

/**
 * Parse a query parameter string into a simpler record.
 */
export function parseSearch(search: string | URLSearchParams): Record<string, string | number | boolean> {
  const params: Record<string, string | number | boolean> = {}

  for (const [k, v] of new URLSearchParams(search)) {
    if (v === 'true') {
      params[k] = true
    } else if (v === 'false') {
      params[k] = false
    } else if (isNumber(v)) {
      params[k] = v.includes('.') ? parseFloat(v) : parseInt(v, 10)
    } else {
      params[k] = v
    }
  }

  return params
}

function isNumber(v: string) {
  if (isNaN(+v)) {
    return false
  }

  return parseInt(v).toString() === v || parseFloat(v).toString() === v
}

/**
 * Stringify a record of params into a href search query string
 */
export function stringifyParams(params: Record<string, string | number | boolean>): string {
  const search = new URLSearchParams()

  for (const k in params) {
    const v = params[k]

    if (typeof v === 'boolean') {
      search.append(k, v ? 'true' : 'false')
      continue
    }

    search.append(k, v as string)
  }

  return search.toString()
}


/**
 * Check whether the given url is an external url or not.
 */
export const isExternalHref = (href: string): boolean => {
  try {
    // Create URL with base as current origin
    const url = new URL(href, window.location.origin)
    return url.origin !== window.location.origin
  } catch {
    return false // If href is invalid, treat it as internal
  }
}
