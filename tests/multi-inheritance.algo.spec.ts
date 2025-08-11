import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { afterEach } from 'node:test'
import { beforeAll, describe, expect } from 'vitest'
import { MultiBases } from './artifacts/multi-inheritance/contract.algo'
import { getAvmResult } from './avm-invoker'
import { createArc4TestFixture } from './test-fixture'

describe('multi-inheritance', async () => {
  const [test, localnetFixture] = createArc4TestFixture('tests/artifacts/multi-inheritance/contract.algo.ts', { MultiBases: {} })
  const ctx = new TestExecutionContext()

  beforeAll(async () => {
    await localnetFixture.newScope()
  })
  afterEach(() => ctx.reset())

  test('should be able to call methods from super classes', async ({ appClientMultiBases: appClient }) => {
    const contract = ctx.contract.create(MultiBases)

    const avmMethod1Result = await getAvmResult({ appClient }, 'methodOne')
    const avmMethod2Result = await getAvmResult({ appClient }, 'methodTwo')
    const avmMethodMultiResult = await getAvmResult({ appClient }, 'methodMulti')
    const avmMethodCallsSuperResult = await getAvmResult({ appClient }, 'methodCallsSuper')
    const avmCallB2CantOverrideResult = await getAvmResult({ appClient }, 'callB2CantOverride')
    const avmCallB2CommonResult = await getAvmResult({ appClient }, 'callB2Common')

    const method1Result = contract.methodOne()
    const method2Result = contract.methodTwo()
    const methodMultiResult = contract.methodMulti()
    const methodCallsSuperResult = contract.methodCallsSuper()
    const callB2CantOverrideResult = contract.callB2CantOverride()
    const callB2CommonResult = contract.callB2Common()

    expect(method1Result).toEqual('base-one')
    expect(method2Result).toEqual('base-two')
    expect(methodMultiResult).toEqual('multi-bases')
    expect(methodCallsSuperResult).toEqual('base-two')
    expect(callB2CantOverrideResult).toEqual('base-two')
    expect(callB2CommonResult).toEqual('common')

    expect(method1Result).toEqual(avmMethod1Result)
    expect(method2Result).toEqual(avmMethod2Result)
    expect(methodMultiResult).toEqual(avmMethodMultiResult)
    expect(methodCallsSuperResult).toEqual(avmMethodCallsSuperResult)
    expect(callB2CantOverrideResult).toEqual(avmCallB2CantOverrideResult)
    expect(callB2CommonResult).toEqual(avmCallB2CommonResult)
  })
})
