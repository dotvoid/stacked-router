import { useRouter } from '../hooks/useRouter'
import { relativeUrl } from '../lib/href'
import { getHistoryState } from '../lib/history'

interface NavigateOptions {
  replace?: boolean
}

/**
 * Hook to provide a navigate function that can be used to integrate with HeroUI.
 *
 * @example
 * import { useHref, useNavigate } from '@/router/hooks'
 * const navigate = useNavigate()
 *
 * <HeroUIProvider useHref={useHref} navigate={navigate}>
 *  ...
 * <HeroUIProvider>
 */
export function useNavigate() {
  const { navigate } = useRouter()

  return (href: string, options?: NavigateOptions) => {
    const { state } = getHistoryState()
    const { url, queryParams } = relativeUrl(href)

    navigate(state.id || '', url, queryParams, {
      append: false,
      target: options?.replace ? '_top' : '_self'
    })
  }
}
