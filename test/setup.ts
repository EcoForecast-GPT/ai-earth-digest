// test/setup.ts
import { afterEach, vi } from 'vitest'

// Mock browser environment globals
global.fetch = vi.fn()
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
}

// Reset all mocks after each test
afterEach(() => {
  vi.clearAllMocks()
})