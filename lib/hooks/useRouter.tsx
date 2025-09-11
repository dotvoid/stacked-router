import { useContext } from 'react'
import { RouterContext } from '../contexts/RouterContext'

export function useRouter() {
  const context = useContext(RouterContext)

  if (context === undefined) {
    throw new Error('useRouter must be used within a RouterProvider')
  }

  return context
}
