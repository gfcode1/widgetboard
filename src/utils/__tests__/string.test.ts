import { describe, it, expect } from 'vitest'
import { escapeHtml, truncate, slugify, stripHtml } from '../string'

describe('escapeHtml', () => {
  it('escapes ampersand', () => {
    expect(escapeHtml('a&b')).toBe('a&amp;b')
  })

  it('escapes angle brackets', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;')
  })

  it('escapes single quotes', () => {
    expect(escapeHtml("'hello'")).toBe('&#39;hello&#39;')
  })

  it('escapes double quotes', () => {
    expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;')
  })

  it('handles safe text unchanged', () => {
    expect(escapeHtml('hello world')).toBe('hello world')
  })

  it('handles empty string', () => {
    expect(escapeHtml('')).toBe('')
  })
})

describe('truncate', () => {
  it('returns text as-is when within maxLength', () => {
    expect(truncate('hello', 10)).toBe('hello')
  })

  it('truncates and appends ellipsis', () => {
    expect(truncate('hello world', 5)).toBe('hello...')
  })

  it('handles exact length boundary', () => {
    expect(truncate('hello', 5)).toBe('hello')
  })

  it('handles empty string', () => {
    expect(truncate('', 5)).toBe('')
  })
})

describe('slugify', () => {
  it('lowercases text', () => {
    expect(slugify('HELLO')).toBe('hello')
  })

  it('replaces spaces with hyphens', () => {
    expect(slugify('hello world')).toBe('hello-world')
  })

  it('removes special characters', () => {
    expect(slugify('hello!@#world')).toBe('helloworld')
  })

  it('collapses multiple hyphens', () => {
    expect(slugify('hello   world')).toBe('hello-world')
  })

  it('handles empty string', () => {
    expect(slugify('')).toBe('')
  })
})

describe('stripHtml', () => {
  it('removes simple tags', () => {
    expect(stripHtml('<p>hello</p>')).toBe('hello')
  })

  it('removes self-closing tags', () => {
    expect(stripHtml('hello<br/><b>world</b>')).toBe('helloworld')
  })

  it('handles nested tags', () => {
    expect(stripHtml('<div><span>text</span></div>')).toBe('text')
  })

  it('handles text without tags', () => {
    expect(stripHtml('plain text')).toBe('plain text')
  })
})
