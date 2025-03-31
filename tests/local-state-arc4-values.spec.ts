import type { AppClient } from '@algorandfoundation/algokit-utils/types/app-client'
import { Account, Bytes } from '@algorandfoundation/algorand-typescript'
import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import type {
  AddressImpl,
  BoolImpl,
  ByteImpl,
  DynamicBytesImpl,
  StrImpl,
} from '@algorandfoundation/algorand-typescript-testing/runtime-helpers'
import { UintNImpl } from '@algorandfoundation/algorand-typescript-testing/runtime-helpers'
import type { ARC4Encoded, BitSize } from '@algorandfoundation/algorand-typescript/arc4'
import { Address, Bool, Byte, DynamicBytes, Str, UintN } from '@algorandfoundation/algorand-typescript/arc4'
import { afterEach, beforeAll, describe, expect } from 'vitest'
import { OnApplicationComplete } from '../src/constants'
import type { DeliberateAny } from '../src/typescript-helpers'
import { LocalStateContract } from './artifacts/state-ops/contract.algo'
import { getAvmResult } from './avm-invoker'
import { createArc4TestFixture } from './test-fixture'

describe('ARC4 AppLocal values', async () => {
  const [test, localnetFixture] = createArc4TestFixture('tests/artifacts/state-ops/contract.algo.ts', {
    LocalStateContract: {},
  })
  const ctx = new TestExecutionContext()

  beforeAll(async () => {
    await localnetFixture.newScope()
  })

  afterEach(() => {
    ctx.reset()
  })

  const testData = ['_implicit_key', ''].flatMap((implicit) => [
    {
      methodName: `get${implicit}_arc4_uintn64`,
      assert: (value: ARC4Encoded, expectedValue: DeliberateAny) => {
        const arc4Value = value as UintNImpl<BitSize>
        const bitSize = UintNImpl.getMaxBitsLength(arc4Value.typeInfo)
        expect(arc4Value).toBeInstanceOf(UintN)
        expect(bitSize).toEqual(64)
        expect(arc4Value.native).toEqual(expectedValue)
      },
    },
    {
      methodName: `get${implicit}_arc4_str`,
      assert: (value: ARC4Encoded, expectedValue: DeliberateAny) => {
        const arc4Value = value as StrImpl
        expect(arc4Value).toBeInstanceOf(Str)
        expect(arc4Value.native).toEqual(expectedValue)
      },
    },
    {
      methodName: `get${implicit}_arc4_byte`,
      assert: (value: ARC4Encoded, expectedValue: DeliberateAny) => {
        const arc4Value = value as ByteImpl
        expect(arc4Value).toBeInstanceOf(Byte)
        expect(arc4Value.native).toEqual(expectedValue)
      },
    },
    {
      methodName: `get${implicit}_arc4_bool`,
      assert: (value: ARC4Encoded, expectedValue: DeliberateAny) => {
        const arc4Value = value as BoolImpl
        expect(arc4Value).toBeInstanceOf(Bool)
        expect(arc4Value.native).toEqual(expectedValue)
      },
    },
    {
      methodName: `get${implicit}_arc4_address`,
      assert: (value: ARC4Encoded, expectedValue: DeliberateAny) => {
        const arc4Value = value as AddressImpl
        expect(arc4Value).toBeInstanceOf(Address)
        expect(arc4Value.native).toEqual(expectedValue)
      },
    },
    {
      methodName: `get${implicit}_arc4_uintn128`,
      assert: (value: ARC4Encoded, expectedValue: DeliberateAny) => {
        const arc4Value = value as UintNImpl<BitSize>
        const bitSize = UintNImpl.getMaxBitsLength(arc4Value.typeInfo)
        expect(arc4Value).toBeInstanceOf(UintN)
        expect(bitSize).toEqual(128)
        expect(arc4Value.native).toEqual(expectedValue)
      },
    },
    {
      methodName: `get${implicit}_arc4_dynamic_bytes`,
      assert: (value: ARC4Encoded, expectedValue: DeliberateAny) => {
        const arc4Value = value as DynamicBytesImpl
        expect(arc4Value).toBeInstanceOf(DynamicBytes)
        expect(arc4Value.native).toEqual(expectedValue)
      },
    },
  ])

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
