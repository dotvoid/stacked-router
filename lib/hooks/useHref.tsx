import { relativeUrl } from '../lib/href'

/**
 * Hook to provide a useHref function that can be used to with UI libraries.
 * Converts router hrefs to native HTML hrefs.
 *
 * @example
 * import { useHref, useNavigate } from '@/router/hooks'
 * const navigate = useNavigate()
 *
 * <HeroUIProvider useHref={useHref} navigate={navigate}>
 *  ...
 * <HeroUIProvider>
 */
export function useHref(to: string): string {
  const { url } = relativeUrl(to)
  return url
}
