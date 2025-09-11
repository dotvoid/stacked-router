import { describe, it, expect } from 'vitest'
import { mapRoutes } from '../lib/lib/mapRoutes'
import React from 'react'

const MockComponent: React.ComponentType = () => null
const MockLayout: React.ComponentType = () => null

const createMockModule = (component: React.ComponentType, meta?: unknown) => {
  const mockModule = {
    default: component
  }
  if (meta) {
    // @ts-expect-error Adding meta to default for testing
    mockModule.default.meta = meta
  }
  return mockModule
}

describe('mapRoutes', () => {
  it('should map simple routes correctly', () => {
    const modules = {
      '/pages/Home.tsx': createMockModule(MockComponent),
      '/pages/About.tsx': createMockModule(MockComponent),
    }

    const result = mapRoutes(modules, '/pages/')

    expect(result.routes).toHaveLength(2)
    expect(result.routes[0]).toMatchObject({
      path: '/home',
      component: MockComponent,
      meta: { breakpoints: [] }
    })
    expect(result.routes[1]).toMatchObject({
      path: '/about',
      component: MockComponent,
      meta: { breakpoints: [] }
    })
  })

  it('should handle index routes correctly', () => {
    const modules = {
      'pages/index.tsx': createMockModule(MockComponent),
      'pages/users/index.tsx': createMockModule(MockComponent),
    }

    const result = mapRoutes(modules, 'pages/')

    expect(result.routes).toHaveLength(2)
    expect(result.routes[0].path).toBe('/')
    expect(result.routes[1].path).toBe('/users')
  })

  it('should handle layouts correctly', () => {
    const modules = {
      'pages/_layout.tsx': createMockModule(MockLayout),
      'pages/admin/_layout.tsx': createMockModule(MockLayout),
      'pages/Home.tsx': createMockModule(MockComponent),
    }

    const result = mapRoutes(modules, 'pages/')

    // Only Home should be a route now, layouts are properly filtered out
    expect(result.routes).toHaveLength(1)
    expect(result.routes[0].path).toBe('/home')
    expect(result.layouts).toEqual({
      '/': MockLayout,
      '/admin': MockLayout
    })
  })

  it('should handle routes with metadata', () => {
    const meta = { breakpoints: [{ breakpoint: 768, minVw: 50 }] }
    const modules = {
      'pages/Dashboard.tsx': createMockModule(MockComponent, meta),
    }

    const result = mapRoutes(modules, 'pages/')

    expect(result.routes).toHaveLength(1)
    expect(result.routes[0]).toMatchObject({
      path: '/dashboard',
      component: MockComponent,
      meta
    })
  })

  it('should handle empty modules object', () => {
    const result = mapRoutes({})

    expect(result.routes).toHaveLength(0)
    expect(result.layouts).toEqual({})
  })

  it('should convert PascalCase to kebab-case paths', () => {
    const modules = {
      'pages/UserProfile.tsx': createMockModule(MockComponent),
      'pages/AdminPanel.tsx': createMockModule(MockComponent),
    }

    const result = mapRoutes(modules, 'pages/')

    expect(result.routes).toHaveLength(2)
    expect(result.routes[0].path).toBe('/user/profile')
    expect(result.routes[1].path).toBe('/admin/panel')
  })

  it('should work without basePath parameter', () => {
    const modules = {
      'Home.tsx': createMockModule(MockComponent),
      'About.tsx': createMockModule(MockComponent),
    }

    const result = mapRoutes(modules)

    expect(result.routes).toHaveLength(2)
    expect(result.routes[0].path).toBe('/home')
    expect(result.routes[1].path).toBe('/about')
  })
})
