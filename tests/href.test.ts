import { describe, it, expect } from 'vitest'
import { parseSearch, relativeUrl, stringifyParams } from '../lib/lib/href'

describe('parseSearch', () => {
  it('should parse string search parameters', () => {
    const result = parseSearch('name=John&surname=Doe')
    expect(result).toEqual({
      name: 'John',
      surname: 'Doe'
    })
  })

  it('should handle URLSearchParams input', () => {
    const params = new URLSearchParams('name=John&surname=Doe')
    const result = parseSearch(params)
    expect(result).toEqual({
      name: 'John',
      surname: 'Doe'
    })
  })

  it('should convert integer values', () => {
    const result = parseSearch('id=123&age=45')
    expect(result).toEqual({
      id: 123,
      age: 45
    })
  })

  it('should convert float values', () => {
    const result = parseSearch('price=19.99&rating=4.5')
    expect(result).toEqual({
      price: 19.99,
      rating: 4.5
    })
  })

  it('should convert boolean values', () => {
    const result = parseSearch('active=true&disabled=false')
    expect(result).toEqual({
      active: true,
      disabled: false
    })
  })

  it('should handle mixed value types', () => {
    const result = parseSearch('name=John&age=30&rating=4.5&active=true')
    expect(result).toEqual({
      name: 'John',
      age: 30,
      rating: 4.5,
      active: true
    })
  })

  it('should handle empty parameters', () => {
    const result = parseSearch('name=&age=')
    expect(result).toEqual({
      name: '',
      age: ''
    })
  })

  it('should handle parameters without values', () => {
    const result = parseSearch('filter&sort')
    expect(result).toEqual({
      filter: '',
      sort: ''
    })
  })

  it('should handle numeric strings that should not be converted', () => {
    const result = parseSearch('zip=01234&phone=%2B123456')
    expect(result).toEqual({
      zip: '01234',
      phone: '+123456'
    })
  })
})

describe('stringifyParams', () => {
  it('should stringify string parameters', () => {
    const params = {
      name: 'John',
      surname: 'Doe'
    }
    const result = stringifyParams(params)
    expect(result).toBe('name=John&surname=Doe')
  })

  it('should stringify numeric parameters', () => {
    const params = {
      id: 123,
      age: 45,
      price: 19.99
    }
    const result = stringifyParams(params)
    expect(result).toBe('id=123&age=45&price=19.99')
  })

  it('should stringify boolean parameters', () => {
    const params = {
      active: true,
      disabled: false
    }
    const result = stringifyParams(params)
    expect(result).toBe('active=true&disabled=false')
  })

  it('should stringify mixed parameter types', () => {
    const params = {
      name: 'John',
      age: 30,
      rating: 4.5,
      active: true
    }
    const result = stringifyParams(params)
    expect(result).toBe('name=John&age=30&rating=4.5&active=true')
  })

  it('should handle empty objects', () => {
    const result = stringifyParams({})
    expect(result).toBe('')
  })

  it('should handle parameter with empty string value', () => {
    const params = {
      name: ''
    }
    const result = stringifyParams(params)
    expect(result).toBe('name=')
  })

  it('should handle special characters in parameters', () => {
    const params = {
      query: 'search term with spaces',
      filter: 'category:electronics'
    }
    const result = stringifyParams(params)
    // URLSearchParams automatically encodes special characters
    expect(result).toBe('query=search+term+with+spaces&filter=category%3Aelectronics')
  })

  it('should handle zero as a numeric value', () => {
    const params = {
      count: 0
    }
    const result = stringifyParams(params)
    expect(result).toBe('count=0')
  })
})

// Test round-trip conversion
describe('round trip conversion', () => {
  it('should maintain data integrity when converting back and forth', () => {
    const originalParams = {
      name: 'John',
      age: 30,
      rating: 4.5,
      active: true,
      tags: 'one,two,three'
    }

    const searchString = stringifyParams(originalParams)
    const parsedParams = parseSearch(searchString)

    expect(parsedParams).toEqual(originalParams)
  })

  describe('relativeUrl', () => {
    it('should create a correct relative url with / and no params', () => {
      const { url } = relativeUrl('/')
      expect(url).toEqual('/')
    })

    it('should create a correct relative url with no trailing /', () => {
      const { url } = relativeUrl('/user/')
      expect(url).toEqual('/user')
    })

    it('should create a correct relative url with path and params', () => {
      const params = {
        name: 'Freya',
        age: 30,
        rating: 4.5,
        active: true,
        tags: 'one, two, three'
      }
      const { url } = relativeUrl('/user', params)
      expect(url).toEqual(
        '/user?name=Freya&age=30&rating=4.5&active=true&tags=one%2C+two%2C+three'
      )
    })
  })
})
