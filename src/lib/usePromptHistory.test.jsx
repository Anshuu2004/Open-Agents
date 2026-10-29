import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePromptHistory } from './usePromptHistory'

const STORAGE_KEY = 'oa_prompt_history'

describe('usePromptHistory', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('records trimmed prompts newest first and preserves metadata', () => {
    const { result } = renderHook(() => usePromptHistory())

    vi.spyOn(Date, 'now').mockReturnValueOnce(100).mockReturnValueOnce(100)
    act(() => {
      result.current.savePrompt({
        text: '  First prompt  ',
        agentId: 'writer',
        agentName: 'Writer',
      })
    })
    vi.spyOn(Date, 'now').mockReturnValueOnce(200).mockReturnValueOnce(200)
    act(() => result.current.savePrompt({ text: 'Second prompt' }))

    expect(result.current.prompts.map((prompt) => prompt.text)).toEqual([
      'Second prompt',
      'First prompt',
    ])
    expect(result.current.prompts[1]).toMatchObject({
      id: 'prompt_100',
      agentId: 'writer',
      agentName: 'Writer',
      favorite: false,
    })
  })

  it('ignores blank input and consecutive duplicates', () => {
    const { result } = renderHook(() => usePromptHistory())

    act(() => {
      expect(result.current.savePrompt({ text: '   ' })).toBeNull()
      result.current.savePrompt({ text: 'Keep one' })
      result.current.savePrompt({ text: 'Keep one' })
    })

    expect(result.current.prompts).toHaveLength(1)
  })

  it('caps history at 100 while preserving favorites over older regular entries', () => {
    const existing = Array.from({ length: 100 }, (_, index) => ({
      id: `old-${index}`,
      text: `Old ${index}`,
      favorite: index === 99,
      createdAt: 100 - index,
    }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
    const { result } = renderHook(() => usePromptHistory())

    vi.spyOn(Date, 'now').mockReturnValue(1000)
    act(() => result.current.savePrompt({ text: 'Newest' }))

    expect(result.current.prompts).toHaveLength(100)
    expect(result.current.prompts[0].text).toBe('Newest')
    expect(result.current.prompts.some((prompt) => prompt.id === 'old-99')).toBe(true)
    expect(result.current.prompts.some((prompt) => prompt.id === 'old-98')).toBe(false)
  })

  it('keeps favorites when history is cleared', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        { id: 'favorite', text: 'Keep', favorite: true, createdAt: 2 },
        { id: 'regular', text: 'Remove', favorite: false, createdAt: 1 },
      ])
    )
    const { result } = renderHook(() => usePromptHistory())

    act(() => result.current.clearHistory())

    expect(result.current.prompts.map((prompt) => prompt.id)).toEqual(['favorite'])
  })

  it('reloads persisted prompts in a new hook instance', () => {
    const first = renderHook(() => usePromptHistory())
    act(() => first.result.current.savePrompt({ text: 'Persist me' }))
    first.unmount()

    const second = renderHook(() => usePromptHistory())
    expect(second.result.current.prompts.map((prompt) => prompt.text)).toEqual(['Persist me'])
  })

  it('treats empty and corrupt storage as an empty history', () => {
    const empty = renderHook(() => usePromptHistory())
    expect(empty.result.current.prompts).toEqual([])
    empty.unmount()

    localStorage.setItem(STORAGE_KEY, '{not-json')
    const corrupt = renderHook(() => usePromptHistory())
    expect(corrupt.result.current.prompts).toEqual([])
  })
})
