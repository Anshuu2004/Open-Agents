import { describe, expect, it } from 'vitest'
import { allocateRoundedPercentages } from './useAnalytics'

describe('allocateRoundedPercentages', () => {
  it('reconciles three equal shares to exactly one hundred', () => {
    const result = allocateRoundedPercentages([
      { name: 'a', count: 1 },
      { name: 'b', count: 1 },
      { name: 'c', count: 1 },
    ])

    expect(result.map((item) => item.pct)).toEqual([34, 33, 33])
  })

  it('handles empty and single-item distributions', () => {
    expect(allocateRoundedPercentages([])).toEqual([])
    expect(allocateRoundedPercentages([{ name: 'only', count: 7 }])).toEqual([
      { name: 'only', count: 7, pct: 100 },
    ])
  })

  it('corrects cases where independent rounding would exceed one hundred', () => {
    const result = allocateRoundedPercentages([
      { name: 'a', count: 2 },
      { name: 'b', count: 2 },
      { name: 'c', count: 2 },
      { name: 'd', count: 1 },
    ])

    expect(result.reduce((sum, item) => sum + item.pct, 0)).toBe(100)
    expect(result.map((item) => item.pct)).toEqual([29, 29, 28, 14])
  })

  it('always sums positive sample distributions to one hundred', () => {
    const samples = [
      [1, 2],
      [5, 4, 3, 2, 1],
      [99, 1, 1],
      [7, 7, 7, 7, 7, 7],
    ]

    for (const counts of samples) {
      const result = allocateRoundedPercentages(
        counts.map((count, index) => ({ name: String(index), count }))
      )
      expect(result.reduce((sum, item) => sum + item.pct, 0)).toBe(100)
    }
  })
})
