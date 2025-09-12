import { Bytes, Uint64 } from '@algorandfoundation/algorand-typescript'
import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import type { ARC4Encoded } from '@algorandfoundation/algorand-typescript/arc4'
import { Address, Bool, Byte, DynamicBytes, Str, Uint } from '@algorandfoundation/algorand-typescript/arc4'
import { afterEach, beforeAll, describe, expect } from 'vitest'
import type { DeliberateAny, FunctionKeys } from '../src/typescript-helpers'
import { asUint8Array } from '../src/util'
import { GlobalStateContract } from './artifacts/state-ops/contract.algo'
import { getAvmResult } from './avm-invoker'
import { createArc4TestFixture } from './test-fixture'

describe('ARC4 AppGlobal values', async () => {
  const [test, localnetFixture] = createArc4TestFixture('tests/artifacts/state-ops/contract.algo.ts', {
    GlobalStateContract: {},
  })
  const ctx = new TestExecutionContext()

  beforeAll(async () => {
    await localnetFixture.newScope()
  })

  afterEach(() => {
    ctx.reset()
  })

  const testData: DeliberateAny[] = ['_implicit_key', ''].flatMap((implicit) => [
    {
      nativeValue: 42,
      abiValue: new Uint<64>(42),
      methodName: `get${implicit}_arc4_uintn64`,
      assert: (value: ARC4Encoded, expectedValue: DeliberateAny) => {
        const arc4Value = value as Uint<64>
        expect(arc4Value).toBeInstanceOf(Uint)
        expect(arc4Value.bytes.length).toEqual(8)
        expect(arc4Value.asUint64()).toEqual(expectedValue)
      },
    },
    {
      nativeValue: 'World',
      abiValue: new Str('World'),
      methodName: `get${implicit}_arc4_str`,
      assert: (value: ARC4Encoded, expectedValue: DeliberateAny) => {
        const arc4Value = value as Str
        expect(arc4Value).toBeInstanceOf(Str)
        expect(arc4Value.native).toEqual(expectedValue)
      },
    },
    {
      nativeValue: 12,
      abiValue: new Byte(12),
      methodName: `get${implicit}_arc4_byte`,
      assert: (value: ARC4Encoded, expectedValue: DeliberateAny) => {
        const arc4Value = value as Byte
        expect(arc4Value).toBeInstanceOf(Byte)
        expect(arc4Value.asUint64()).toEqual(expectedValue)
      },
    },
    {
      nativeValue: false,
      abiValue: new Bool(false),
      methodName: `get${implicit}_arc4_bool`,
      assert: (value: ARC4Encoded, expectedValue: DeliberateAny) => {
        const arc4Value = value as Bool
        expect(arc4Value).toBeInstanceOf(Bool)
        expect(arc4Value.native).toEqual(expectedValue)
      },
    },
    {
      nativeValue: asUint8Array(Bytes.fromHex(`${'00'.repeat(31)}ff`)),
      abiValue: new Address(Bytes.fromHex(`${'00'.repeat(31)}ff`)),
      methodName: `get${implicit}_arc4_address`,
      assert: (value: ARC4Encoded, expectedValue: DeliberateAny) => {
        const arc4Value = value as Address
        expect(arc4Value).toBeInstanceOf(Address)
        expect(arc4Value.native).toEqual(expectedValue)
      },
    },
    {
      nativeValue: 2n ** 102n,
      abiValue: new Uint<128>(2n ** 102n),
      methodName: `get${implicit}_arc4_uintn128`,
      assert: (value: ARC4Encoded, expectedValue: DeliberateAny) => {
        const arc4Value = value as Uint<128>
        expect(arc4Value).toBeInstanceOf(Uint)
        expect(arc4Value.bytes.length).toEqual(16)
        expect(arc4Value.asBigUint()).toEqual(expectedValue)
      },
    },
    {
      nativeValue: asUint8Array(Bytes.fromHex(`${'00'.repeat(30)}${'ff'.repeat(2)}`)),
      abiValue: new DynamicBytes(Bytes.fromHex(`${'00'.repeat(30)}${'ff'.repeat(2)}`)),
      methodName: `get${implicit}_arc4_dynamic_bytes`,
      assert: (value: ARC4Encoded, expectedValue: DeliberateAny) => {
        const arc4Value = value as DynamicBytes
        expect(arc4Value).toBeInstanceOf(DynamicBytes)
        expect(arc4Value.native).toEqual(expectedValue)
      },
    },
  ])
  testData.push(
    {
      nativeValue: [21, asUint8Array(Bytes('Hello')), true],
      abiValue: [Uint64(21), Bytes('Hello'), true],
      methodName: `get_implicit_key_tuple`,
      assert: (value: DeliberateAny, expectedValue: DeliberateAny) => {
        expect(value).toEqual(expectedValue)
      },
    },
    {
      nativeValue: { a: 12, b: asUint8Array(Bytes('world')), c: true },
      abiValue: { a: 12, b: Bytes('world'), c: true },
      methodName: `get_implicit_key_obj`,
      assert: (value: DeliberateAny, expectedValue: DeliberateAny) => {
        expect(value).toEqual(expectedValue)
      },
    },
  )

  test.for(testData)('should be able to get arc4 state values', async (data, { appClientGlobalStateContract: appClient, testAccount }) => {
    ctx.defaultSender = Bytes.fromBase32(testAccount.addr.toString())
    const avmResult = await getAvmResult({ appClient }, data.methodName)
    const contract = ctx.contract.create(GlobalStateContract)
    const result = contract[data.methodName as FunctionKeys<GlobalStateContract>](undefined as never) as ARC4Encoded
    data.assert(result, avmResult)
  })

  test.for(testData)('should be able to set arc4 state values', async (data, { appClientGlobalStateContract: appClient, testAccount }) => {
    ctx.defaultSender = Bytes.fromBase32(testAccount.addr.toString())
    const setMethodName = data.methodName.replace('get', 'set')
    await getAvmResult({ appClient }, setMethodName, data.nativeValue)
    const contract = ctx.contract.create(GlobalStateContract)
    contract[setMethodName as FunctionKeys<GlobalStateContract>](data.abiValue as never)

    const avmResult = await getAvmResult({ appClient }, data.methodName)
    const result = (contract[data.methodName as FunctionKeys<GlobalStateContract>] as () => ARC4Encoded)() as ARC4Encoded
    data.assert(result, avmResult)
  })
})
