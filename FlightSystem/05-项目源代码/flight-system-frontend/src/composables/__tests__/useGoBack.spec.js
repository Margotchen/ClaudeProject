import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useGoBack } from '@/composables/useGoBack'

const back = vi.fn()
const replace = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({
    back,
    replace
  })
}))

describe('useGoBack', () => {
  beforeEach(() => {
    back.mockClear()
    replace.mockClear()
  })

  afterEach(() => {
    // restore default history length
    Object.defineProperty(window, 'history', {
      value: { length: 2 },
      writable: true,
      configurable: true
    })
  })

  it('calls router.back() when there is browser history', () => {
    Object.defineProperty(window, 'history', {
      value: { length: 2 },
      writable: true,
      configurable: true
    })
    const goBack = useGoBack('/fallback')
    goBack()
    expect(back).toHaveBeenCalled()
    expect(replace).not.toHaveBeenCalled()
  })

  it('falls back to router.replace() when there is no previous history', () => {
    Object.defineProperty(window, 'history', {
      value: { length: 1 },
      writable: true,
      configurable: true
    })
    const goBack = useGoBack('/fallback')
    goBack()
    expect(back).not.toHaveBeenCalled()
    expect(replace).toHaveBeenCalledWith('/fallback')
  })
})
