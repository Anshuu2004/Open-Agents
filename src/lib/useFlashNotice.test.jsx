import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useFlashNotice } from './useFlashNotice'

describe('useFlashNotice', () => {
  beforeEach(() => vi.useFakeTimers())

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('gives the latest message its full display duration', () => {
    const { result } = renderHook(() => useFlashNotice(3500))

    act(() => result.current.flash('First message'))
    act(() => vi.advanceTimersByTime(3000))
    act(() => result.current.flash('Second message'))
    act(() => vi.advanceTimersByTime(500))

    expect(result.current.notice).toBe('Second message')

    act(() => vi.advanceTimersByTime(2999))
    expect(result.current.notice).toBe('Second message')

    act(() => vi.advanceTimersByTime(1))
    expect(result.current.notice).toBeNull()
  })

  it('cancels the pending timer when the consumer unmounts', () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')
    const { result, unmount } = renderHook(() => useFlashNotice())

    act(() => result.current.flash('Leaving soon'))
    unmount()

    expect(clearTimeoutSpy).toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
    clearTimeoutSpy.mockRestore()
  })
})
