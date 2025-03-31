import type { biguint } from '@algorandfoundation/algorand-typescript'
import { assertMatch, BigUint, Bytes, match, Uint64 } from '@algorandfoundation/algorand-typescript'
import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { afterEach, describe, expect, test } from 'vitest'
import { MAX_UINT512, MAX_UINT64 } from '../src/constants'
import { StrImpl } from '../src/impl/encoded-types'
describe('match', () => {
  const ctx = new TestExecutionContext()

  afterEach(() => {
    ctx.reset()
  })

  const numericTestData = [
    { subject: 1, test: 1, expected: true },
    { subject: 0, test: 1, expected: false },
    { subject: 1, test: 0, expected: false },
    { subject: 1, test: Uint64(1), expected: true },
    { subject: Uint64(1), test: Uint64(1), expected: true },
    { subject: Uint64(1), test: 1, expected: true },
    { subject: 42, test: MAX_UINT64, expected: false },
    { subject: Uint64(MAX_UINT64), test: Uint64(42), expected: false },
    { subject: BigUint(1), test: 1n, expected: true },
    { subject: 1n, test: BigUint(1), expected: true },
    { subject: BigUint(1), test: BigUint(1), expected: true },
    { subject: 42n, test: MAX_UINT512, expected: false },
    { subject: BigUint(MAX_UINT512), test: BigUint(42n), expected: false },
    { subject: { a: BigUint(MAX_UINT512) }, test: { a: { lessThan: MAX_UINT512 } }, expected: false },
    { subject: { a: BigUint(MAX_UINT512) }, test: { a: { lessThanEq: MAX_UINT64 } }, expected: false },
    { subject: { a: MAX_UINT64 }, test: { a: { lessThan: BigUint(MAX_UINT512) } }, expected: true },
    { subject: { a: MAX_UINT512 }, test: { a: { lessThanEq: BigUint(MAX_UINT512) } }, expected: true },
    { subject: { a: BigUint(MAX_UINT512) }, test: { a: { greaterThan: MAX_UINT512 } }, expected: false },
    { subject: { a: BigUint(MAX_UINT64) }, test: { a: { greaterThanEq: MAX_UINT512 } }, expected: false },
    { subject: { a: MAX_UINT512 }, test: { a: { greaterThan: BigUint(MAX_UINT64) } }, expected: true },
    { subject: { a: MAX_UINT512 }, test: { a: { greaterThanEq: BigUint(MAX_UINT512) } }, expected: true },
    {
      subject: { a: MAX_UINT512 },
      test: { a: { between: [BigUint(MAX_UINT64), BigUint(MAX_UINT512)] as [biguint, biguint] } },
      expected: true,
    },
    {
      subject: { a: MAX_UINT64 },
      test: { a: { between: [BigUint(MAX_UINT64), BigUint(MAX_UINT512)] as [biguint, biguint] } },
      expected: true,
    },
    { subject: { a: 42 }, test: { a: { between: [BigUint(MAX_UINT64), BigUint(MAX_UINT512)] as [biguint, biguint] } }, expected: false },
  ]

  const account1 = ctx.any.account()
  const sameAccount = ctx.ledger.getAccount(account1)
  const differentAccount = ctx.any.account()

  const app1 = ctx.any.application()
  const sameApp = ctx.ledger.getApplication(app1.id)
  const differentApp = ctx.any.application()

  const asset1 = ctx.any.asset()
  const sameAsset = ctx.ledger.getAsset(asset1.id)
  const differentAsset = ctx.any.application()

  const arc4Str1 = ctx.any.arc4.str(10)
  const sameArc4Str = new StrImpl((arc4Str1 as StrImpl).typeInfo, arc4Str1.native)
  const differentArc4Str = ctx.any.arc4.str(10)

  const testData = [
    { subject: '', test: '', expected: true },
    { subject: 'hello', test: 'hello', expected: true },
    { subject: 'hello', test: 'world', expected: false },
    { subject: '', test: 'world', expected: false },
    { subject: Bytes(), test: Bytes(), expected: true },
    { subject: Bytes('hello'), test: Bytes('hello'), expected: true },
    { subject: Bytes('hello'), test: Bytes('world'), expected: false },
    { subject: Bytes(''), test: Bytes('world'), expected: false },
    { subject: account1, test: account1, expected: true },
    { subject: account1, test: sameAccount, expected: true },
    { subject: account1, test: differentAccount, expected: false },
    { subject: app1, test: app1, expected: true },
    { subject: app1, test: sameApp, expected: true },
    { subject: app1, test: differentApp, expected: false },
    { subject: asset1, test: asset1, expected: true },
    { subject: asset1, test: sameAsset, expected: true },
    { subject: asset1, test: differentAsset, expected: false },
    { subject: arc4Str1, test: arc4Str1, expected: true },
    { subject: arc4Str1, test: sameArc4Str, expected: true },
    { subject: arc4Str1, test: differentArc4Str, expected: false },
    { subject: { a: 'hello', b: 42, c: arc4Str1 }, test: { a: 'hello', b: { lessThanEq: 42 }, c: sameArc4Str }, expected: true },
    { subject: { a: 'hello', b: 42, c: arc4Str1 }, test: { c: sameArc4Str }, expected: true },
    { subject: { a: 'hello', b: 42, c: arc4Str1 }, test: { c: differentArc4Str }, expected: false },
    { subject: ['hello', 42, arc4Str1], test: ['hello', { lessThanEq: 42 }, sameArc4Str], expected: true },
    { subject: ['hello', 42, arc4Str1], test: ['hello'], expected: true },
    { subject: ['hello', 42, arc4Str1], test: ['world'], expected: false },
  ]

  test.each(numericTestData)('should be able to match numeric data %s', (data) => {
    const { subject, test, expected } = data
    expect(match(subject, test)).toBe(expected)
  })

  test.each(testData)('should be able to match %s', (data) => {
    const { subject, test, expected } = data
    expect(match(subject, test)).toBe(expected)
  })

  test.each(numericTestData.filter((x) => x.expected))('should be able to assert match numeric data %s', (data) => {
    const { subject, test, expected } = data
    expect(assertMatch(subject, test)).toBe(expected)
  })

  test.each(testData.filter((x) => x.expected))('should be able to assert match %s', (data) => {
    const { subject, test, expected } = data
    expect(match(subject, test)).toBe(expected)
  })

  test.each(numericTestData.filter((x) => !x.expected))('should throw exception when assert match fails for numeric data %s', (data) => {
    const { subject, test } = data
    expect(() => assertMatch(subject, test)).toThrow('Assertion failed')
  })

  test.each(testData.filter((x) => !x.expected))('should throw exception when assert match fails %s', (data) => {
    const { subject, test } = data
    expect(() => assertMatch(subject, test)).toThrow('Assertion failed')
  })
})
