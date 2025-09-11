import { describe, it, expect } from 'vitest'
import { RouterRegistry } from '../lib/lib/RouterRegistry'
import React from 'react'

// Mock React components for testing
const HomeComponent: React.ComponentType<unknown> = () => null
const UserComponent: React.ComponentType<unknown> = () => null
const UserProfileComponent: React.ComponentType<unknown> = () => null
const DefaultLayout: React.ComponentType<unknown> = () => null
const AdminLayout: React.ComponentType<unknown> = () => null

describe('RouterRegistry', () => {
  describe('constructor and route registration', () => {
    it('should register simple routes correctly', () => {
      const config = {
        routes: [
          {
            path: '/',
            component: HomeComponent,
            meta: { breakpoints: [] }
          },
          {
            path: '/user',
            component: UserComponent,
            meta: { breakpoints: [] }
          }
        ]
      }

      const registry = new RouterRegistry(config)

      const homeResult = registry.getViewComponentByPath('/')
      expect(homeResult).not.toBeNull()
      expect(homeResult?.Component).toBe(HomeComponent)
      expect(homeResult?.meta).toEqual({ breakpoints: [] })

      const userResult = registry.getViewComponentByPath('/user')
      expect(userResult).not.toBeNull()
      expect(userResult?.Component).toBe(UserComponent)
    })

    it('should register routes with layouts', () => {
      const config = {
        routes: [
          {
            path: '/',
            component: HomeComponent,
            layout: DefaultLayout,
            meta: { breakpoints: [] }
          }
        ],
        layouts: {
          '/': DefaultLayout
        }
      }

      const registry = new RouterRegistry(config)

      const result = registry.getViewComponentByPath('/')
      expect(result?.Layout).toBe(DefaultLayout)
    })

    it('should handle routes with dynamic parameters', () => {
      const config = {
        routes: [
          {
            path: '/user/[id]',
            component: UserProfileComponent,
            meta: { breakpoints: [] }
          },
          {
            path: '/user/[id]/posts/[postId]',
            component: UserComponent,
            meta: { breakpoints: [] }
          }
        ]
      }

      const registry = new RouterRegistry(config)

      const result1 = registry.getViewComponentByPath('/user/123')
      expect(result1).not.toBeNull()
      expect(result1?.Component).toBe(UserProfileComponent)
      expect(result1?.params).toEqual({ id: '123' })

      const result2 = registry.getViewComponentByPath('/user/456/posts/789')
      expect(result2).not.toBeNull()
      expect(result2?.Component).toBe(UserComponent)
      expect(result2?.params).toEqual({ id: '456', postId: '789' })
    })
  })

  describe('getViewComponentByPath', () => {
    it('should return null for non-matching paths', () => {
      const config = {
        routes: [
          {
            path: '/user',
            component: UserComponent,
            meta: { breakpoints: [] }
          }
        ]
      }

      const registry = new RouterRegistry(config)

      const result = registry.getViewComponentByPath('/nonexistent')
      expect(result).toBeNull()
    })

    it('should match exact paths correctly', () => {
      const config = {
        routes: [
          {
            path: '/user/profile',
            component: UserProfileComponent,
            meta: { breakpoints: [] }
          }
        ]
      }

      const registry = new RouterRegistry(config)

      const result = registry.getViewComponentByPath('/user/profile')
      expect(result?.Component).toBe(UserProfileComponent)
      expect(result?.params).toEqual({})
    })

    it('should handle multiple dynamic parameters', () => {
      const config = {
        routes: [
          {
            path: '/[category]/[subcategory]/[id]',
            component: UserComponent,
            meta: { breakpoints: [] }
          }
        ]
      }

      const registry = new RouterRegistry(config)

      const result = registry.getViewComponentByPath('/electronics/phones/123')
      expect(result?.Component).toBe(UserComponent)
      expect(result?.params).toEqual({
        category: 'electronics',
        subcategory: 'phones',
        id: '123'
      })
    })

    it('should not match partial paths', () => {
      const config = {
        routes: [
          {
            path: '/user/profile/settings',
            component: UserProfileComponent,
            meta: { breakpoints: [] }
          }
        ]
      }

      const registry = new RouterRegistry(config)

      const result1 = registry.getViewComponentByPath('/user')
      const result2 = registry.getViewComponentByPath('/user/profile')

      expect(result1).toBeNull()
      expect(result2).toBeNull()
    })
  })

  describe('layout resolution', () => {
    it('should find closest layout for nested routes', () => {
      const config = {
        routes: [
          {
            path: '/admin/users/profile',
            component: UserProfileComponent,
            meta: { breakpoints: [] }
          }
        ],
        layouts: {
          '/': DefaultLayout,
          '/admin': AdminLayout
        }
      }

      const registry = new RouterRegistry(config)

      const result = registry.getViewComponentByPath('/admin/users/profile')
      expect(result?.Layout).toBe(AdminLayout)
    })

    it('should fallback to parent layout when specific layout not found', () => {
      const config = {
        routes: [
          {
            path: '/admin/deep/nested/route',
            component: UserComponent,
            meta: { breakpoints: [] }
          }
        ],
        layouts: {
          '/': DefaultLayout,
          '/admin': AdminLayout
        }
      }

      const registry = new RouterRegistry(config)

      const result = registry.getViewComponentByPath('/admin/deep/nested/route')
      expect(result?.Layout).toBe(AdminLayout)
    })

    it('should use root layout when no specific layout found', () => {
      const config = {
        routes: [
          {
            path: '/random/path',
            component: UserComponent,
            meta: { breakpoints: [] }
          }
        ],
        layouts: {
          '/': DefaultLayout
        }
      }

      const registry = new RouterRegistry(config)

      const result = registry.getViewComponentByPath('/random/path')
      expect(result?.Layout).toBe(DefaultLayout)
    })

    it('should have no layout when none are defined', () => {
      const config = {
        routes: [
          {
            path: '/user',
            component: UserComponent,
            meta: { breakpoints: [] }
          }
        ]
      }

      const registry = new RouterRegistry(config)

      const result = registry.getViewComponentByPath('/user')
      expect(result?.Layout).toBeUndefined()
    })

    it('should prefer explicit layout over closest layout', () => {
      const config = {
        routes: [
          {
            path: '/admin/users',
            component: UserComponent,
            layout: DefaultLayout,
            meta: { breakpoints: [] }
          }
        ],
        layouts: {
          '/admin': AdminLayout
        }
      }

      const registry = new RouterRegistry(config)

      const result = registry.getViewComponentByPath('/admin/users')
      expect(result?.Layout).toBe(DefaultLayout)
    })
  })

  describe('getAllViewComponents', () => {
    it('should return all registered view components', () => {
      const config = {
        routes: [
          {
            path: '/',
            component: HomeComponent,
            layout: DefaultLayout,
            meta: { breakpoints: [] }
          },
          {
            path: '/user/[id]',
            component: UserProfileComponent,
            meta: { breakpoints: [{ breakpoint: 768, minVw: 50 }] }
          }
        ]
      }

      const registry = new RouterRegistry(config)

      const allComponents = registry.getAllViewComponents()
      expect(allComponents).toHaveLength(2)

      expect(allComponents[0]).toMatchObject({
        Component: HomeComponent,
        Layout: DefaultLayout,
        meta: { breakpoints: [] }
      })

      expect(allComponents[1]).toMatchObject({
        Component: UserProfileComponent,
        Layout: undefined,
        meta: { breakpoints: [{ breakpoint: 768, minVw: 50 }] }
      })
    })

    it('should return empty array when no routes registered', () => {
      const registry = new RouterRegistry({ routes: [] })

      const allComponents = registry.getAllViewComponents()
      expect(allComponents).toEqual([])
    })
  })

  describe('metadata handling', () => {
    it('should use provided metadata', () => {
      const meta = {
        breakpoints: [
          { breakpoint: 768, minVw: 50 },
          { breakpoint: 1024, minVw: 33 }
        ]
      }

      const config = {
        routes: [
          {
            path: '/dashboard',
            component: UserComponent,
            meta
          }
        ]
      }

      const registry = new RouterRegistry(config)

      const result = registry.getViewComponentByPath('/dashboard')
      expect(result?.meta).toEqual(meta)
    })

    it('should use default metadata when none provided', () => {
      const config = {
        routes: [
          {
            path: '/simple',
            component: UserComponent
          }
        ]
      }

      const registry = new RouterRegistry(config)

      const result = registry.getViewComponentByPath('/simple')
      expect(result?.meta).toEqual({ breakpoints: [] })
    })
  })

  describe('edge cases', () => {
    it('should handle empty route configuration', () => {
      const registry = new RouterRegistry({ routes: [] })

      const result = registry.getViewComponentByPath('/any-path')
      expect(result).toBeNull()

      const allComponents = registry.getAllViewComponents()
      expect(allComponents).toEqual([])
    })

    it('should handle root path correctly', () => {
      const config = {
        routes: [
          {
            path: '/',
            component: HomeComponent,
            meta: { breakpoints: [] }
          }
        ]
      }

      const registry = new RouterRegistry(config)

      const result = registry.getViewComponentByPath('/')
      expect(result?.Component).toBe(HomeComponent)
    })

    it('should handle paths with trailing slashes', () => {
      const config = {
        routes: [
          {
            path: '/user',
            component: UserComponent,
            meta: { breakpoints: [] }
          }
        ]
      }

      const registry = new RouterRegistry(config)

      // Should not match paths with trailing slashes
      const result = registry.getViewComponentByPath('/user/')
      expect(result).toBeNull()
    })

    it('should handle special characters in dynamic parameters', () => {
      const config = {
        routes: [
          {
            path: '/user/[id]',
            component: UserComponent,
            meta: { breakpoints: [] }
          }
        ]
      }

      const registry = new RouterRegistry(config)

      const result = registry.getViewComponentByPath('/user/user-123-special')
      expect(result?.params).toEqual({ id: 'user-123-special' })
    })
  })
})
