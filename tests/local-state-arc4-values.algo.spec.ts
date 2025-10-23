import type { AppClient } from '@algorandfoundation/algokit-utils/types/app-client'
import { Account, Bytes } from '@algorandfoundation/algorand-typescript'
import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import type { ARC4Encoded } from '@algorandfoundation/algorand-typescript/arc4'

import { Address, Bool, Byte, DynamicBytes, Str, Uint } from '@algorandfoundation/algorand-typescript/arc4'
import { afterEach, describe, expect } from 'vitest'
import { OnApplicationComplete } from '../src/constants'

import type { DeliberateAny } from '../src/typescript-helpers'
import { LocalStateContract } from './artifacts/state-ops/contract.algo'
import { getAvmResult } from './avm-invoker'
import { createArc4TestFixture } from './test-fixture'

describe('ARC4 AppLocal values', async () => {
  const test = createArc4TestFixture('tests/artifacts/state-ops/contract.algo.ts', {
    LocalStateContract: {},
  })
  const ctx = new TestExecutionContext()

  afterEach(() => {
    ctx.reset()
  })

  const testData: DeliberateAny[] = ['_implicit_key', ''].flatMap((implicit) => [
    {
      methodName: `get${implicit}_arc4_uintn64`,
      assert: (value: ARC4Encoded, expectedValue: DeliberateAny) => {
        const arc4Value = value as Uint<64>

        expect(arc4Value).toBeInstanceOf(Uint)
        expect(arc4Value.bytes.length).toEqual(8)
        expect(arc4Value.asUint64()).toEqual(expectedValue)
      },
    },
    {
      methodName: `get${implicit}_arc4_str`,
      assert: (value: ARC4Encoded, expectedValue: DeliberateAny) => {
        const arc4Value = value as Str
        expect(arc4Value).toBeInstanceOf(Str)
        expect(arc4Value.native).toEqual(expectedValue)
      },
    },
    {
      methodName: `get${implicit}_arc4_byte`,
      assert: (value: ARC4Encoded, expectedValue: DeliberateAny) => {
        const arc4Value = value as Byte
        expect(arc4Value).toBeInstanceOf(Byte)
        expect(arc4Value.asUint64()).toEqual(expectedValue)
      },
    },
    {
      methodName: `get${implicit}_arc4_bool`,
      assert: (value: ARC4Encoded, expectedValue: DeliberateAny) => {
        const arc4Value = value as Bool
        expect(arc4Value).toBeInstanceOf(Bool)
        expect(arc4Value.native).toEqual(expectedValue)
      },
    },
    {
      methodName: `get${implicit}_arc4_address`,
      assert: (value: ARC4Encoded, expectedValue: DeliberateAny) => {
        const arc4Value = value as Address
        expect(arc4Value).toBeInstanceOf(Address)
        expect(arc4Value.native).toEqual(expectedValue)
      },
    },
    {
      methodName: `get${implicit}_arc4_uintn128`,
      assert: (value: ARC4Encoded, expectedValue: DeliberateAny) => {
        const arc4Value = value as Uint<128>
        expect(arc4Value).toBeInstanceOf(Uint)
        expect(arc4Value.bytes.length).toEqual(16)
        expect(arc4Value.asBigUint()).toEqual(expectedValue)
      },
    },
    {
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
      methodName: `get_implicit_key_tuple`,
      assert: (value: DeliberateAny, expectedValue: DeliberateAny) => {
        expect(value).toEqual(expectedValue)
      },
    },
    {
      methodName: `get_implicit_key_obj`,
      assert: (value: DeliberateAny, expectedValue: DeliberateAny) => {
        expect(value).toEqual(expectedValue)
      },
    },
  )

  test.for(testData)('should be able to get arc4 state values', async (data, { appClientLocalStateContract: appClient, testAccount }) => {
    const defaultSenderAccountAddress = Bytes.fromBase32(testAccount.addr.toString())
    ctx.defaultSender = defaultSenderAccountAddress
    await tryOptIn(appClient)

    const avmResult = await getAvmResult({ appClient }, data.methodName, testAccount.addr.toString())
    const contract = ctx.contract.create(LocalStateContract)
    contract.opt_in()
    const result = contract[data.methodName as keyof LocalStateContract](Account(defaultSenderAccountAddress)) as ARC4Encoded
    data.assert(result, avmResult)
  })
})

const tryOptIn = async (client: AppClient) => {
  try {
    await client.send.call({ method: 'opt_in', args: [], onComplete: OnApplicationComplete.OptInOC })
  } catch (e) {
    if (!(e as DeliberateAny).message.includes('has already opted in to app')) {
      throw e
    }
    // ignore error if account has already opted in
  }
}
