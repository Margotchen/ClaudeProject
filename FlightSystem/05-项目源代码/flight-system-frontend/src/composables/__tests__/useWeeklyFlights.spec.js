import { describe, it, expect } from 'vitest'
import { getWeekRange, markLowestPrice, addDays } from '@/composables/useWeeklyFlights'

describe('useWeeklyFlights', () => {
  describe('addDays', () => {
    it('adds days without timezone drift', () => {
      expect(addDays('2026-09-04', 7)).toBe('2026-09-11')
      expect(addDays('2026-09-04', 0)).toBe('2026-09-04')
      expect(addDays('2026-09-04', -7)).toBe('2026-08-28')
    })
  })

  describe('getWeekRange', () => {
    it('returns 7 days centered on the given date', () => {
      const result = getWeekRange('2026-09-04')
      expect(result).toHaveLength(7)
      expect(result[3]).toBe('2026-09-04')
      expect(result).toEqual([
        '2026-09-01',
        '2026-09-02',
        '2026-09-03',
        '2026-09-04',
        '2026-09-05',
        '2026-09-06',
        '2026-09-07'
      ])
    })
  })

  describe('markLowestPrice', () => {
    it('marks only the lowest non-null price', () => {
      const items = [
        { date: '2026-09-01', price: 520 },
        { date: '2026-09-02', price: null },
        { date: '2026-09-03', price: 480 },
        { date: '2026-09-04', price: 500 }
      ]
      const result = markLowestPrice(items)
      expect(result[0].isLowest).toBe(false)
      expect(result[1].isLowest).toBe(false)
      expect(result[2].isLowest).toBe(true)
      expect(result[3].isLowest).toBe(false)
    })

    it('does not mark any item when all prices are null', () => {
      const items = [
        { date: '2026-09-01', price: null },
        { date: '2026-09-02', price: null }
      ]
      const result = markLowestPrice(items)
      expect(result.every(i => !i.isLowest)).toBe(true)
    })
  })
})
