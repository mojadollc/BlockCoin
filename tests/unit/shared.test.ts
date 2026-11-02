import { unitsToDisplay, displayToUnits } from '../../packages/shared/index'

describe('Shared utilities', () => {
  describe('unitsToDisplay', () => {
    it('converts 1000000 to 1.000000', () => {
      expect(unitsToDisplay(1_000_000n)).toBe('1.000000')
    })

    it('converts 0 to 0.000000', () => {
      expect(unitsToDisplay(0n)).toBe('0.000000')
    })

    it('converts 1 to 0.000001', () => {
      expect(unitsToDisplay(1n)).toBe('0.000001')
    })

    it('converts 100500000 to 100.500000', () => {
      expect(unitsToDisplay(100_500_000n)).toBe('100.500000')
    })

    it('converts large values correctly', () => {
      expect(unitsToDisplay(1_000_000_000_000n)).toBe('1000000.000000')
    })

    it('is exact — no floating point drift', () => {
      // 0.1 + 0.2 in floating point = 0.30000000000000004
      // In BigInt: 100000 + 200000 = 300000 exactly
      const a = 100_000n
      const b = 200_000n
      expect(unitsToDisplay(a + b)).toBe('0.300000')
    })
  })

  describe('displayToUnits', () => {
    it('converts 1.000000 to 1000000n', () => {
      expect(displayToUnits('1.000000')).toBe(1_000_000n)
    })

    it('converts 0.000001 to 1n', () => {
      expect(displayToUnits('0.000001')).toBe(1n)
    })

    it('converts 100.5 to 100500000n', () => {
      expect(displayToUnits('100.5')).toBe(100_500_000n)
    })

    it('converts integer string to units', () => {
      expect(displayToUnits('50')).toBe(50_000_000n)
    })

    it('round-trips correctly', () => {
      const original = 123_456_789n
      expect(displayToUnits(unitsToDisplay(original))).toBe(original)
    })

    it('handles 6 decimal places exactly', () => {
      expect(displayToUnits('0.123456')).toBe(123_456n)
    })
  })
})
