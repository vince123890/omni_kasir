import '@testing-library/jest-dom'
import { afterEach, beforeAll, afterAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from './mocks/server'

// Mock window.location to prevent JSDOM navigation errors
// The interceptor sets window.location.href = '/login' on 401 — mock it as no-op
Object.defineProperty(window, 'location', {
  configurable: true,
  get() { return { href: 'http://localhost:5173/', assign: vi.fn(), replace: vi.fn(), reload: vi.fn() } },
  set() {},  // no-op: prevents JSDOM navigation error
})

// Override VITE_API_URL to absolute URL for test environment
// (relative URL '/api' breaks axios in Node.js/JSDOM)
Object.defineProperty(import.meta, 'env', {
  writable: true,
  value: { ...import.meta.env, VITE_API_URL: 'http://localhost:5173/api' },
})

// Mock window.matchMedia (required by antd)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver (required by antd)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Suppress antd deprecation warnings in tests
const originalWarn = console.warn
console.warn = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && args[0].includes('[antd:')) return
  originalWarn(...args)
}

const originalError = console.error
console.error = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && (
    args[0].includes('SingleObserver') ||
    args[0].includes('getComputedStyle')
  )) return
  originalError(...args)
}

// MSW server
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => { server.resetHandlers(); cleanup() })
afterAll(() => server.close())
