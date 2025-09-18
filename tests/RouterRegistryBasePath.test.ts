import { describe, it, expect } from 'vitest'
import { RouterRegistry } from '../lib/lib/RouterRegistry'
import React from 'react'

// Mock React components for testing
const HomeComponent: React.ComponentType<unknown> = () => null
const UserComponent: React.ComponentType<unknown> = () => null
const UserProfileComponent: React.ComponentType<unknown> = () => null
const DefaultLayout: React.ComponentType<unknown> = () => null
const DialogLayout: React.ComponentType<unknown> = () => null
const AdminLayout: React.ComponentType<unknown> = () => null

describe('RouterRegistry BasePath Support', () => {
  describe('basePath normalization', () => {
    it('should normalize basePath with leading slash', () => {
      const config = {
        routes: [
          { path: '/', component: HomeComponent }
        ]
      }

      const registry = new RouterRegistry(config, 'my-app')
      expect(registry.basePath).toBe('/my-app')
    })

    it('should normalize basePath by removing trailing slash', () => {
      const config = {
        routes: [
          { path: '/', component: HomeComponent }
        ]
      }

      const registry = new RouterRegistry(config, '/my-app/')
      expect(registry.basePath).toBe('/my-app')
    })

    it('should handle root basePath correctly', () => {
      const config = {
        routes: [
          { path: '/', component: HomeComponent }
        ]
      }

      const registry = new RouterRegistry(config, '/')
      expect(registry.basePath).toBe('/')
    })

    it('should default to root when no basePath provided', () => {
      const config = {
        routes: [
          { path: '/', component: HomeComponent }
        ]
      }

      const registry = new RouterRegistry(config)
      expect(registry.basePath).toBe('/')
    })
  })

  describe('path matching with basePath', () => {
    it('should match root path with basePath', () => {
      const config = {
        routes: [
          { path: '/', component: HomeComponent }
        ]
      }

      const registry = new RouterRegistry(config, '/my-app')

      // Should match when given the full path with basePath
      const result = registry.getViewComponentByPath('/my-app/')
      expect(result).not.toBeNull()
      expect(result?.Component).toBe(HomeComponent)

      // Should also match when given root without basePath for internal usage
      const internalResult = registry.getViewComponentByPath('/')
      expect(internalResult).not.toBeNull()
      expect(internalResult?.Component).toBe(HomeComponent)
    })

    it('should match nested paths with basePath', () => {
      const config = {
        routes: [
          { path: '/users', component: UserComponent },
          { path: '/users/[id]', component: UserProfileComponent }
        ]
      }

      const registry = new RouterRegistry(config, '/my-app')

      // Should match full paths with basePath
      const usersResult = registry.getViewComponentByPath('/my-app/users')
      expect(usersResult?.Component).toBe(UserComponent)

      const profileResult = registry.getViewComponentByPath('/my-app/users/123')
      expect(profileResult?.Component).toBe(UserProfileComponent)
      expect(profileResult?.params).toEqual({ id: '123' })
    })

    it('should handle dynamic parameters with basePath', () => {
      const config = {
        routes: [
          { path: '/user/[id]/posts/[postId]', component: UserComponent }
        ]
      }

      const registry = new RouterRegistry(config, '/app')

      const result = registry.getViewComponentByPath('/app/user/456/posts/789')
      expect(result).not.toBeNull()
      expect(result?.Component).toBe(UserComponent)
      expect(result?.params).toEqual({ id: '456', postId: '789' })
    })

    it('should only match paths with proper basePath prefix', () => {
      const config = {
        routes: [
          { path: '/users', component: UserComponent }
        ]
      }

      const registry = new RouterRegistry(config, '/my-app')

      // Should match with correct basePath
      const correctResult = registry.getViewComponentByPath('/my-app/users')
      expect(correctResult?.Component).toBe(UserComponent)

      // Should not match if basePath is wrong
      const wrongResult = registry.getViewComponentByPath('/other-app/users')
      expect(wrongResult).toBeNull()
    })

    it('should handle trailing slashes correctly with basePath', () => {
      const config = {
        routes: [
          { path: '/users', component: UserComponent }
        ]
      }

      const registry = new RouterRegistry(config, '/my-app')

      const result1 = registry.getViewComponentByPath('/my-app/users')
      const result2 = registry.getViewComponentByPath('/my-app/users/')

      expect(result1?.Component).toBe(UserComponent)
      expect(result2?.Component).toBe(UserComponent)
    })
  })

  describe('getFullPath method', () => {
    it('should add basePath to root path', () => {
      const config = { routes: [] }
      const registry = new RouterRegistry(config, '/my-app')

      expect(registry.getFullPath('/')).toBe('/my-app')
    })

    it('should add basePath to nested paths', () => {
      const config = { routes: [] }
      const registry = new RouterRegistry(config, '/my-app')

      expect(registry.getFullPath('/users')).toBe('/my-app/users')
      expect(registry.getFullPath('/users/123')).toBe('/my-app/users/123')
    })

    it('should handle query parameters and fragments', () => {
      const config = { routes: [] }
      const registry = new RouterRegistry(config, '/my-app')

      expect(registry.getFullPath('/users?page=1')).toBe('/my-app/users?page=1')
      expect(registry.getFullPath('/users#section')).toBe('/my-app/users#section')
      expect(registry.getFullPath('/users?page=1#section')).toBe('/my-app/users?page=1#section')
    })

    it('should return path unchanged when basePath is root', () => {
      const config = { routes: [] }
      const registry = new RouterRegistry(config, '/')

      expect(registry.getFullPath('/users')).toBe('/users')
      expect(registry.getFullPath('/')).toBe('/')
    })
  })

  describe('layout resolution with basePath', () => {
    it('should resolve layouts correctly with basePath', () => {
      const config = {
        routes: [
          { path: '/admin/users', component: UserComponent }
        ],
        layouts: {
          '/': DefaultLayout,
          '/admin': AdminLayout
        }
      }

      const registry = new RouterRegistry(config, '/my-app')

      const result = registry.getViewComponentByPath('/my-app/admin/users')
      expect(result?.Layouts).toEqual([
        { key: undefined, component: DefaultLayout },
        { key: undefined, component: AdminLayout }
      ])
    })

    it('should handle layout keys with basePath', () => {
      const config = {
        routes: [
          { path: '/users', component: UserComponent }
        ],
        layouts: {
          '/#dialog': DialogLayout,
          '/users#modal': AdminLayout
        }
      }

      const registry = new RouterRegistry(config, '/app')

      const result = registry.getViewComponentByPath('/app/users')
      expect(result?.Layouts).toEqual([
        { key: 'dialog', component: DialogLayout },
        { key: 'modal', component: AdminLayout }
      ])
    })
  })

  describe('edge cases with basePath', () => {
    it('should handle empty basePath', () => {
      const config = {
        routes: [
          { path: '/users', component: UserComponent }
        ]
      }

      const registry = new RouterRegistry(config, '')
      expect(registry.basePath).toBe('/')

      const result = registry.getViewComponentByPath('/users')
      expect(result?.Component).toBe(UserComponent)
    })

    it('should handle complex basePath', () => {
      const config = {
        routes: [
          { path: '/dashboard', component: UserComponent }
        ]
      }

      const registry = new RouterRegistry(config, '/v2/api/frontend')

      const result = registry.getViewComponentByPath('/v2/api/frontend/dashboard')
      expect(result?.Component).toBe(UserComponent)
    })

    it('should handle special characters in basePath', () => {
      const config = {
        routes: [
          { path: '/test', component: UserComponent }
        ]
      }

      const registry = new RouterRegistry(config, '/my-app-v2.0')

      const result = registry.getViewComponentByPath('/my-app-v2.0/test')
      expect(result?.Component).toBe(UserComponent)
    })

    it('should handle URL-encoded characters in basePath', () => {
      const config = {
        routes: [
          { path: '/search', component: UserComponent }
        ]
      }

      const registry = new RouterRegistry(config, '/my%20app')

      const result = registry.getViewComponentByPath('/my%20app/search')
      expect(result?.Component).toBe(UserComponent)
    })
  })

  describe('basePath with existing functionality', () => {
    it('should maintain all existing functionality with basePath', () => {
      const config = {
        routes: [
          {
            path: '/',
            component: HomeComponent,
            layouts: [DefaultLayout],
            meta: { breakpoints: [{ breakpoint: 768, minVw: 50 }] }
          },
          {
            path: '/user/[id]',
            component: UserProfileComponent,
            meta: { breakpoints: [] }
          }
        ]
      }

      const registry = new RouterRegistry(config, '/my-app')

      // Test root with layouts and meta
      const homeResult = registry.getViewComponentByPath('/my-app')
      expect(homeResult?.Component).toBe(HomeComponent)
      expect(homeResult?.Layouts).toHaveLength(1) // Just DefaultLayout from route config
      expect(homeResult?.Layouts[0].component).toBe(DefaultLayout)
      expect(homeResult?.meta).toEqual({ breakpoints: [{ breakpoint: 768, minVw: 50 }] })

      // Test dynamic params
      const profileResult = registry.getViewComponentByPath('/my-app/user/123')
      expect(profileResult?.Component).toBe(UserProfileComponent)
      expect(profileResult?.params).toEqual({ id: '123' })

      // Test getAllViewComponents still works
      const allComponents = registry.getAllViewComponents()
      expect(allComponents).toHaveLength(2)
    })
  })
})
