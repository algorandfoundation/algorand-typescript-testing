import type { uint64 } from '@algorandfoundation/algorand-typescript'
import { Uint64 } from '@algorandfoundation/algorand-typescript'
import { beforeAll, describe, expect } from 'vitest'
import { MAX_UINT64, UINT64_OVERFLOW_UNDERFLOW_MESSAGE } from '../../src/constants'
import { Uint64Cls } from '../../src/impl/primitives'
import { asUint64 } from '../../src/util'
import { getAvmResult } from '../avm-invoker'
import { createArc4TestFixture } from '../test-fixture'

describe('Unit64', async () => {
  const [test, localnetFixture] = createArc4TestFixture('tests/artifacts/primitive-ops/contract.algo.ts', {
    PrimitiveOpsContract: { deployParams: { createParams: { extraProgramPages: undefined } } },
  })

  beforeAll(async () => {
    await localnetFixture.newScope()
  })
  describe.each(['eq', 'ne', 'lt', 'le', 'gt', 'ge'])('logical operators', async (op) => {
    const operator = (function () {
      switch (op) {
        case 'eq':
          return '==='
        case 'ne':
          return '!=='
        case 'lt':
          return '<'
        case 'le':
          return '<='
        case 'gt':
          return '>'
        case 'ge':
          return '>='
        default:
          throw new Error(`Unknown operator: ${op}`)
      }
    })()
    describe.each([
      [0, 0],
      [0, 1],
      [0, MAX_UINT64],
      [1, 0],
      [1, 1],
      [1, MAX_UINT64],
      [13, 42],
      [MAX_UINT64, MAX_UINT64],
    ])(`${operator}`, async (a, b) => {
      const uintA = asUint64(a)
      const uintB = asUint64(b)

      const getStubResult = (a: number | bigint | uint64, b: number | bigint | uint64) => {
        switch (operator) {
          case '===':
            return a === b
          case '!==':
            return a !== b
          case '<':
            return a < b
          case '<=':
            return a <= b
          case '>':
            return a > b
          case '>=':
            return a >= b
          default:
            throw new Error(`Unknown operator: ${op}`)
        }
      }
      test(`${a} ${operator} ${b}`, async ({ appClientPrimitiveOpsContract: appClient }) => {
        const avmResult = await getAvmResult<boolean>({ appClient }, `verify_uint64_${op}`, a, b)
        let result = getStubResult(uintA, uintB)
        expect(result, `for values: ${a}, ${b}`).toBe(avmResult)

        result = getStubResult(a, uintB)
        expect(result, `for values: ${a}, ${b}`).toBe(avmResult)

        result = getStubResult(uintA, b)
        expect(result, `for values: ${a}, ${b}`).toBe(avmResult)
      })
    })
  })

  describe.each([
    [0, 0],
    [0, MAX_UINT64],
    [MAX_UINT64, 0],
    [1, 0],
    [0, 1],
    [1, 1],
    [13, 42],
    [1, MAX_UINT64 - 1n],
    [MAX_UINT64 - 1n, 1],
  ])('addition', async (a, b) => {
    test(`${a} + ${b}`, async ({ appClientPrimitiveOpsContract: appClient }) => {
      const avmResult = await getAvmResult<bigint>({ appClient }, 'verify_uint64_add', a, b)
      let result = asUint64(a) + asUint64(b)
      expect(result.valueOf(), `for values: ${a}, ${b}`).toBe(avmResult)

      if (typeof a === 'number') {
        result = a + asUint64(b)
        expect(result.valueOf(), `for values: ${a}, ${b}`).toBe(avmResult)
      }

      if (typeof b === 'number') {
        result = asUint64(a) + b
        expect(result.valueOf(), `for values: ${a}, ${b}`).toBe(avmResult)
      }
    })
  })

  describe.each([
    [1, MAX_UINT64],
    [MAX_UINT64, 1],
    [MAX_UINT64, MAX_UINT64],
  ])('addition overflow', async (a, b) => {
    test(`${a} + ${b}`, async ({ appClientPrimitiveOpsContract: appClient }) => {
      await expect(getAvmResult<bigint>({ appClient }, 'verify_uint64_add', a, b)).rejects.toThrow('+ overflowed')

      expect(() => asUint64(a) + asUint64(b)).toThrow(UINT64_OVERFLOW_UNDERFLOW_MESSAGE)

      if (typeof a === 'number') {
        expect(() => a + asUint64(b)).toThrow(UINT64_OVERFLOW_UNDERFLOW_MESSAGE)
      }

      if (typeof b === 'number') {
        expect(() => asUint64(a) + b).toThrow(UINT64_OVERFLOW_UNDERFLOW_MESSAGE)
      }
    })
  })

  describe.each([
    [0, 0],
    [1, 0],
    [1, 1],
    [42, 13],
    [MAX_UINT64, 0],
    [MAX_UINT64, 1],
    [MAX_UINT64, MAX_UINT64],
  ])('subtraction', async (a, b) => {
    test(`${a} - ${b}`, async ({ appClientPrimitiveOpsContract: appClient }) => {
      const avmResult = await getAvmResult<bigint>({ appClient }, 'verify_uint64_sub', a, b)
      let result = asUint64(a) - asUint64(b)
      expect(result.valueOf(), `for values: ${a}, ${b}`).toBe(avmResult)

      if (typeof a === 'number') {
        result = a - asUint64(b)
        expect(result.valueOf(), `for values: ${a}, ${b}`).toBe(avmResult)
      }

      if (typeof b === 'number') {
        result = asUint64(a) - b
        expect(result.valueOf(), `for values: ${a}, ${b}`).toBe(avmResult)
      }
    })
  })

  describe.each([
    [0, 1],
    [1, 2],
    [13, 42],
    [0, MAX_UINT64],
    [1, MAX_UINT64],
  ])('subtraction underflow', async (a, b) => {
    test(`${a} - ${b}`, async ({ appClientPrimitiveOpsContract: appClient }) => {
      await expect(getAvmResult<bigint>({ appClient }, 'verify_uint64_sub', a, b)).rejects.toThrow('- would result negative')

      expect(() => asUint64(a) - asUint64(b)).toThrow(UINT64_OVERFLOW_UNDERFLOW_MESSAGE)

      if (typeof a === 'number') {
        expect(() => a - asUint64(b)).toThrow(UINT64_OVERFLOW_UNDERFLOW_MESSAGE)
      }

      if (typeof b === 'number') {
        expect(() => asUint64(a) - b).toThrow(UINT64_OVERFLOW_UNDERFLOW_MESSAGE)
      }
    })
  })

  describe.each([
    [0, 0],
    [0, 1],
    [42, 13],
    [MAX_UINT64, 0],
    [MAX_UINT64, 1],
  ])('multiplication', async (a, b) => {
    test(`${a} * ${b}`, async ({ appClientPrimitiveOpsContract: appClient }) => {
      const avmResult = await getAvmResult<bigint>({ appClient }, 'verify_uint64_mul', a, b)
      let result = asUint64(a) * asUint64(b)
      expect(result.valueOf(), `for values: ${a}, ${b}`).toBe(avmResult)

      if (typeof a === 'number') {
        result = a * asUint64(b)
        expect(result.valueOf(), `for values: ${a}, ${b}`).toBe(avmResult)
      }

      if (typeof b === 'number') {
        result = asUint64(a) * b
        expect(result.valueOf(), `for values: ${a}, ${b}`).toBe(avmResult)
      }
    })
  })

  describe.each([
    [MAX_UINT64, 2],
    [MAX_UINT64, MAX_UINT64],
    [MAX_UINT64 / 2n, 3],
  ])('multiplication overflow', async (a, b) => {
    test(`${a} * ${b}`, async ({ appClientPrimitiveOpsContract: appClient }) => {
      await expect(getAvmResult<bigint>({ appClient }, 'verify_uint64_mul', a, b)).rejects.toThrow('* overflowed')

      expect(() => asUint64(a) * asUint64(b)).toThrow(UINT64_OVERFLOW_UNDERFLOW_MESSAGE)

      if (typeof a === 'number') {
        expect(() => a * asUint64(b)).toThrow(UINT64_OVERFLOW_UNDERFLOW_MESSAGE)
      }

      if (typeof b === 'number') {
        expect(() => asUint64(a) * b).toThrow(UINT64_OVERFLOW_UNDERFLOW_MESSAGE)
      }
    })
  })

  describe.each([
    [0, 1],
    [1, 1],
    [42, 13],
    [0, MAX_UINT64],
    [1, MAX_UINT64],
    [MAX_UINT64, MAX_UINT64],
  ])('division', async (a, b) => {
    test(`${a} / ${b}`, async ({ appClientPrimitiveOpsContract: appClient }) => {
      const avmResult = await getAvmResult<bigint>({ appClient }, 'verify_uint64_div', a, b)
      let result = asUint64(a) / asUint64(b)
      expect(result.valueOf(), `for values: ${a}, ${b}`).toBe(avmResult)

      if (typeof a === 'number') {
        result = a / asUint64(b)
        expect(result.valueOf(), `for values: ${a}, ${b}`).toBe(avmResult)
      }

      if (typeof b === 'number') {
        result = asUint64(a) / b
        expect(result.valueOf(), `for values: ${a}, ${b}`).toBe(avmResult)
      }
    })
  })

  describe.each([
    [0, 0],
    [1, 0],
    [MAX_UINT64, 0],
  ])('division by zero', async (a, b) => {
    test(`${a} / ${b}`, async ({ appClientPrimitiveOpsContract: appClient }) => {
      await expect(getAvmResult<bigint>({ appClient }, 'verify_uint64_div', a, b)).rejects.toThrow('/ 0')

      expect(() => asUint64(a) / asUint64(b)).toThrow('Division by zero')

      if (typeof a === 'number') {
        expect(() => a / asUint64(b)).toThrow('Division by zero')
      }

      expect(() => asUint64(a) / b).toThrow('Division by zero')
    })
  })

  describe.each([
    [0, 1],
    [1, 1],
    [42, 13],
    [0, MAX_UINT64],
    [1, MAX_UINT64],
    [MAX_UINT64, MAX_UINT64],
  ])('modulo', async (a, b) => {
    test(`${a} % ${b}`, async ({ appClientPrimitiveOpsContract: appClient }) => {
      const avmResult = await getAvmResult<bigint>({ appClient }, 'verify_uint64_mod', a, b)
      let result = asUint64(a) % asUint64(b)
      expect(result.valueOf(), `for values: ${a}, ${b}`).toBe(avmResult)

      if (typeof a === 'number') {
        result = a % asUint64(b)
        expect(result.valueOf(), `for values: ${a}, ${b}`).toBe(avmResult)
      }

      if (typeof b === 'number') {
        result = asUint64(a) % b
        expect(result.valueOf(), `for values: ${a}, ${b}`).toBe(avmResult)
      }
    })
  })

  describe.each([
    [0, 0],
    [1, 0],
    [MAX_UINT64, 0],
  ])('modulo by zero', async (a, b) => {
    test(`${a} % ${b}`, async ({ appClientPrimitiveOpsContract: appClient }) => {
      await expect(getAvmResult<bigint>({ appClient }, 'verify_uint64_mod', a, b)).rejects.toThrow('% 0')

      expect(() => asUint64(a) % asUint64(b)).toThrow('Division by zero')

      if (typeof a === 'number') {
        expect(() => a % asUint64(b)).toThrow('Division by zero')
      }

      expect(() => asUint64(a) % b).toThrow('Division by zero')
    })
  })

  describe.each([
    [0, 1],
    [1, 1],
    [1, 0],
    [0, MAX_UINT64],
    [1, MAX_UINT64],
    [MAX_UINT64, 0],
    [MAX_UINT64, 1],
    [2 ** 31, 2],
  ])('pow', async (a, b) => {
    test(`${a} ** ${b}`, async ({ appClientPrimitiveOpsContract: appClient }) => {
      const avmResult = await getAvmResult<bigint>({ appClient }, 'verify_uint64_pow', a, b)
      let result = asUint64(a) ** asUint64(b)
      expect(result.valueOf(), `for values: ${a}, ${b}`).toBe(avmResult)

      if (typeof a === 'number') {
        result = a ** asUint64(b)
        expect(result.valueOf(), `for values: ${a}, ${b}`).toBe(avmResult)
      }

      if (typeof b === 'number') {
        result = asUint64(a) ** b
        expect(result.valueOf(), `for values: ${a}, ${b}`).toBe(avmResult)
      }
    })
  })

  describe('pow undefined', async () => {
    test('0 ** 0', async ({ appClientPrimitiveOpsContract: appClient }) => {
      const a = 0,
        b = 0
      await expect(getAvmResult<bigint>({ appClient }, 'verify_uint64_pow', a, b)).rejects.toThrow('0^0 is undefined')
      expect(() => asUint64(a) ** asUint64(b)).toThrow('0 ** 0 is undefined')
    })
  })

  describe.each([
    [MAX_UINT64, 2],
    [2, 64],
    [2 ** 32, 32],
  ])('pow overflow', async (a, b) => {
    test(`${a} ** ${b}`, async ({ appClientPrimitiveOpsContract: appClient }) => {
      await expect(getAvmResult<bigint>({ appClient }, 'verify_uint64_pow', a, b)).rejects.toThrow(/\d+\^\d+ overflow/)

      expect(() => asUint64(a) ** asUint64(b)).toThrow(UINT64_OVERFLOW_UNDERFLOW_MESSAGE)

      if (typeof a === 'number') {
        expect(() => a ** asUint64(b)).toThrow(UINT64_OVERFLOW_UNDERFLOW_MESSAGE)
      }

      if (typeof b === 'number') {
        expect(() => asUint64(a) ** b).toThrow(UINT64_OVERFLOW_UNDERFLOW_MESSAGE)
      }
    })
  })

  describe.each(['and', 'or', 'xor'])('bitwise operators', async (op) => {
    describe.each([
      [0, 0],
      [MAX_UINT64, MAX_UINT64],
      [0, MAX_UINT64],
      [MAX_UINT64, 0],
      [42, MAX_UINT64],
      [MAX_UINT64, 42],
    ])(`${op}`, async (a, b) => {
      const uintA = asUint64(a)
      const uintB = asUint64(b)
      const operator = (function () {
        switch (op) {
          case 'and':
            return '&'
          case 'or':
            return '|'
          case 'xor':
            return '^'
          default:
            throw new Error(`Unknown operator: ${op}`)
        }
      })()
      const getStubResult = (a: number | uint64, b: number | uint64) => {
        switch (op) {
          case 'and':
            return a & b
          case 'or':
            return a | b
          case 'xor':
            return a ^ b
          default:
            throw new Error(`Unknown operator: ${op}`)
        }
      }
      test(`${a} ${operator} ${b}`, async ({ appClientPrimitiveOpsContract: appClient }) => {
        const avmResult = await getAvmResult<bigint>({ appClient }, `verify_uint64_${op}`, a, b)
        let result = getStubResult(uintA, uintB)
        expect(result.valueOf(), `for values: ${a}, ${b}`).toBe(avmResult)

        if (typeof a === 'number') {
          result = getStubResult(a, uintB)
          expect(result.valueOf(), `for values: ${a}, ${b}`).toBe(avmResult)
        }

        if (typeof b === 'number') {
          result = getStubResult(uintA, b)
          expect(result.valueOf(), `for values: ${a}, ${b}`).toBe(avmResult)
        }
      })
    })
  })

  describe.each([0, 1, 42, MAX_UINT64])('bitwise invert', async (a) => {
    test(`~${a}`, async ({ appClientPrimitiveOpsContract: appClient }) => {
      const avmResult = await getAvmResult<bigint>({ appClient }, 'verify_uint64_not', a)
      const result = ~asUint64(a)
      expect(result.valueOf(), `for value: ${a}`).toBe(avmResult)
    })
  })

  describe.each([
    [0, 0],
    [1, 0],
    [1, 1],
    [1, 63],
    [42, 42],
    [MAX_UINT64, 0],
    [MAX_UINT64, 1],
    [MAX_UINT64, 63],
  ])('shift operations', async (a, b) => {
    const uintA = asUint64(a)
    const uintB = asUint64(b)
    test(`${a} << ${b}`, async ({ appClientPrimitiveOpsContract: appClient }) => {
      const avmResult = await getAvmResult<bigint>({ appClient }, 'verify_uint64_lshift', a, b)
      let result = uintA << uintB
      expect(result.valueOf(), `for values: ${a}, ${b}`).toBe(avmResult)

      if (typeof a === 'number') {
        result = a << uintB
        expect(result.valueOf(), `for values: ${a}, ${b}`).toBe(avmResult)
      }

      if (typeof b === 'number') {
        result = uintA << b
        expect(result.valueOf(), `for values: ${a}, ${b}`).toBe(avmResult)
      }
    })

    test(`${a} >> ${b}`, async ({ appClientPrimitiveOpsContract: appClient }) => {
      const avmResult = await getAvmResult<bigint>({ appClient }, 'verify_uint64_rshift', a, b)
      let result = uintA >> uintB
      expect(result.valueOf(), `for values: ${a}, ${b}`).toBe(avmResult)

      if (typeof a === 'number') {
        result = a >> uintB
        expect(result.valueOf(), `for values: ${a}, ${b}`).toBe(avmResult)
      }

      if (typeof b === 'number') {
        result = uintA >> b
        expect(result.valueOf(), `for values: ${a}, ${b}`).toBe(avmResult)
      }
    })
  })

  describe('invalid shift operations', async () => {
    const a = 0,
      b = 64
    const uintA = asUint64(a)
    const uintB = asUint64(b)
    test('0 << 64', async ({ appClientPrimitiveOpsContract: appClient }) => {
      await expect(getAvmResult<bigint>({ appClient }, 'verify_uint64_lshift', a, b)).rejects.toThrow('arg too big, (64)')
      expect(() => uintA << uintB).toThrow('expected shift <= 63')
      expect(() => a << uintB).toThrow('expected shift <= 63')
      expect(() => uintA << b).toThrow('expected shift <= 63')
      expect(() => Uint64(MAX_UINT64 + 1n) << Uint64(1n)).toThrow(UINT64_OVERFLOW_UNDERFLOW_MESSAGE)
    })

    test('0 >> 64', async ({ appClientPrimitiveOpsContract: appClient }) => {
      await expect(getAvmResult<bigint>({ appClient }, 'verify_uint64_rshift', a, b)).rejects.toThrow('arg too big, (64)')
      expect(() => uintA >> uintB).toThrow('expected shift <= 63')
      expect(() => a >> uintB).toThrow('expected shift <= 63')
      expect(() => uintA >> b).toThrow('expected shift <= 63')
      expect(() => Uint64(MAX_UINT64 + 1n) >> Uint64(1n)).toThrow(UINT64_OVERFLOW_UNDERFLOW_MESSAGE)
    })
  })

  describe.each([MAX_UINT64 + 1n, MAX_UINT64 * 2n])('value too big', (a) => {
    test(`${a}`, () => {
      expect(() => Uint64(a)).toThrow(UINT64_OVERFLOW_UNDERFLOW_MESSAGE)
    })
  })

  describe.each([-1, -MAX_UINT64, -MAX_UINT64 * 2n])('value too small', (a) => {
    test(`${a}`, () => {
      expect(() => asUint64(a)).toThrow(UINT64_OVERFLOW_UNDERFLOW_MESSAGE)
    })
  })

  describe.each([
    [true, 1n],
    [false, 0n],
    [0, 0n],
    [1, 1n],
    [42, 42n],
    [0n, 0n],
    [1n, 1n],
    [42n, 42n],
    [MAX_UINT64, MAX_UINT64],
  ])('fromCompat', async (a, b) => {
    test(`${a}`, async () => {
      const result = Uint64Cls.fromCompat(a)
      expect(result.valueOf(), `for value: ${a}`).toBe(b)
    })
  })
})
