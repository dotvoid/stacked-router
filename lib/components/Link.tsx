import { PropsWithChildren } from 'react'
import { isExternalHref, relativeUrl } from '../lib/href'
import { useView } from '../hooks/useView'
import { useRouter } from '../hooks/useRouter'

interface LinkProps {
  href?: string
  query?: Record<string, string | number | boolean>
  props?: Record<string, string | number | boolean>
  layout?: string
  className?: string
  target?: '_self' | '_top' | '_blank' | '_void'
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
}

/**
 * Link component allows giving parameters in two ways, as part of the query string
 * in the href or as a query key/value object. They will always be combined to a url.
 *
 * Automatically adds rel="noopener noreferrer" to all external links.
 * Props can be used to send arbitrary data to a view.
 *
 * ATTENTION:
 *
 * If using HeroUI, prefer using HeroUI Link component. Utilise the hooks useHref()
 * and useNavigate() to provide HeroUIProvider the necessary components.
 *
 * CAVEAT: Props is not persisted in any way  and thus only used in first load of a view.
 * When using target _blank or CMD/CTRL to open a view in a new window props will
 * not be passed to the view.
 */
export function Link({
  href,
  query = {},
  children,
  className,
  target = '_self',
  onClick,
  props,
  layout
}: PropsWithChildren & LinkProps) {
  const { navigate } = useRouter()
  const { url, queryParams } = relativeUrl(href, query)
  const { viewId } = useView()

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick(e)

      if (e.isDefaultPrevented()) {
        return
      }
    }

    if (url.startsWith('https://') || url.startsWith('http://')) {
      // Absolute urls should be handled by browser
      return
    }

    if (target === '_blank' || e.metaKey || e.ctrlKey) {
      // Target blank should open in new window/tab, handled by the browser
      return
    }

    e.preventDefault()
    navigate(viewId, url, queryParams, {
      append: e.shiftKey,
      target: target,
      props: props,
      layout: layout
    })
  }

  const rel = isExternalHref(url) ? 'noopener noreferrer' : undefined
  return (
    <a rel={rel} href={url} onClick={handleClick} className={className} target={target}>
      {children}
    </a>
  )
}
