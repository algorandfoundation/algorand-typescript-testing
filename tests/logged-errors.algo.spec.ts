import { afterEach, describe, expect, test } from 'vitest'
import { decodeLogs } from '../src/decode-logs'
import { TestExecutionContext } from '../src/test-execution-context'
import { LoggedErrorsContract } from './artifacts/logged-errors/contract.algo'

describe('logged errors', async () => {
  const ctx = new TestExecutionContext()

  afterEach(() => {
    ctx.reset()
  })

  test.for([
    { arg: 1, expectedError: 'ERR:01' },
    { arg: 2, expectedError: 'ERR:02' },
    { arg: 3, expectedError: 'ERR:03:arg is 3' },
    { arg: 4, expectedError: 'AER:04' },
    { arg: 5, expectedError: 'AER:05:arg is 5' },
    { arg: 6, expectedError: 'ERR:06:arg is 6' },
    { arg: 7, expectedError: 'ERR:07' },
    { arg: 8, expectedError: 'ERR:08' },
    { arg: 9, expectedError: 'ERR:09:arg is 9' },
    { arg: 10, expectedError: 'AER:10' },
    { arg: 11, expectedError: 'AER:11:arg is 11' },
    { arg: 12, expectedError: 'ERR:12:arg is 12' },
  ])('should log correct error for arg $arg', ({ arg, expectedError }) => {
    const contract = ctx.contract.create(LoggedErrorsContract)
    expect(() => contract.testValid(arg)).toThrow(expectedError)
    assertLog(expectedError)
  })

  test.for([
    { arg: 1, expectedError: 'ERR:not-alnum!' },
    { arg: 2, expectedError: 'ERR:not-alnum!' },
  ])('should log error with non alphanumeric code', ({ arg, expectedError }) => {
    const contract = ctx.contract.create(LoggedErrorsContract)
    expect(() => contract.testInvalidCode(arg)).toThrow(expectedError)
    assertLog(expectedError)
  })

  test.for([
    { arg: 1, expectedError: 'ERR:MyCode' },
    { arg: 2, expectedError: 'ERR:MyCode' },
  ])('should log error with camel case code', ({ arg, expectedError }) => {
    const contract = ctx.contract.create(LoggedErrorsContract)
    expect(() => contract.testCamelCaseCode(arg)).toThrow(expectedError)
    assertLog(expectedError)
  })

  test.for([
    { arg: 1, expectedError: 'AER:01' },
    { arg: 2, expectedError: 'AER:01' },
  ])('should log error with AER prefix', ({ arg, expectedError }) => {
    const contract = ctx.contract.create(LoggedErrorsContract)
    expect(() => contract.testAERPrefix(arg)).toThrow(expectedError)
    assertLog(expectedError)
  })

  test.for([
    {
      arg: 1,
      expectedError: 'ERR:01:I will now provide a succint description of the error. I guess it all started when I was 5...',
    },
    {
      arg: 2,
      expectedError: 'ERR:01:I will now provide a succint description of the error. I guess it all started when I was 5...',
    },
  ])('should log error with long message', ({ arg, expectedError }) => {
    const contract = ctx.contract.create(LoggedErrorsContract)
    expect(() => contract.testLongMessage(arg)).toThrow(expectedError)
    assertLog(expectedError)
  })

  test.for([
    { arg: 1, expectedError: 'ERR:abcd' },
    { arg: 2, expectedError: 'ERR:abcd' },
  ])('should log error with 8 byte message', ({ arg, expectedError }) => {
    const contract = ctx.contract.create(LoggedErrorsContract)
    expect(() => contract.test8ByteMessage(arg)).toThrow(expectedError)
    assertLog(expectedError)
  })

  test.for([
    {
      arg: 1,
      expectedError: 'ERR:01:aaaaaaaaaaaaaaaaaaaaaaaaa',
    },
    {
      arg: 2,
      expectedError: 'ERR:01:aaaaaaaaaaaaaaaaaaaaaaaaa',
    },
  ])('should log error with 32 byte message', ({ arg, expectedError }) => {
    const contract = ctx.contract.create(LoggedErrorsContract)
    expect(() => contract.test32ByteMessage(arg)).toThrow(expectedError)
    assertLog(expectedError)
  })

  test('should throw error when code contains colon', () => {
    const expectedError = "error code must not contain domain separator ':'"
    const contract = ctx.contract.create(LoggedErrorsContract)
    expect(() => contract.testColonInCode(1)).toThrow(expectedError)
  })

  test('should throw error when message contains colon', () => {
    const expectedError = "error message must not contain domain separator ':'"
    const contract = ctx.contract.create(LoggedErrorsContract)
    expect(() => contract.testColonInMessage(1)).toThrow(expectedError)
  })

  test('should throw error when prefix is invalid', () => {
    const expectedError = 'error prefix must be one of AER, ERR'
    const contract = ctx.contract.create(LoggedErrorsContract)
    expect(() => contract.testInvalidPrefix(1)).toThrow(expectedError)
  })

  function assertLog(expectedError: string) {
    const appLogs = ctx.txn.activeGroup.getApplicationCallTransaction().appLogs
    const [log] = decodeLogs(appLogs, ['s'])
    expect(log).toEqual(expectedError)
  }
})
