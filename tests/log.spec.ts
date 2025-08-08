import { arc4, Bytes, log, Uint64 } from '@algorandfoundation/algorand-typescript'
import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import {
  Bool,
  DynamicArray,
  StaticArray,
  Str,
  Tuple,
  UFixed,
  Uint,
  Uint16,
  Uint32,
  Uint8,
} from '@algorandfoundation/algorand-typescript/arc4'
import { afterEach, beforeAll, describe, expect } from 'vitest'
import { MAX_UINT512, MAX_UINT64 } from '../src/constants'
import type { ApplicationCallTransaction } from '../src/impl/transactions'
import { asBigUint, asBigUintCls, asUint8Array } from '../src/util'
import { PrimitiveOpsContract } from './artifacts/primitive-ops/contract.algo'
import { getAvmResultLog } from './avm-invoker'
import { createArc4TestFixture } from './test-fixture'

describe('log', async () => {
  const [test, localnetFixture] = createArc4TestFixture('tests/artifacts/primitive-ops/contract.algo.ts', {
    PrimitiveOpsContract: { deployParams: { createParams: { extraProgramPages: undefined } } },
  })
  const ctx = new TestExecutionContext()

  beforeAll(async () => {
    await localnetFixture.newScope()
  })
  afterEach(() => {
    ctx.reset()
  })

  test('should log different data types', async ({ appClientPrimitiveOpsContract: appClient }) => {
    const a = 'hello'
    const b = Uint64(MAX_UINT64)
    const c = Bytes('world')
    const d = BigInt(MAX_UINT512)
    const e = new Bool(true)
    const f = new Str('greetings')
    const g = new Uint<64>(42)
    const h = new Uint<256>(512)
    const i = new UFixed<32, 8>('42.94967295')
    const j = new UFixed<256, 16>('25.5')
    const k = new StaticArray<Uint8, 3>(new Uint8(1), new Uint8(2), new Uint8(3))
    const m = new DynamicArray(new Uint16(1), new Uint16(2), new Uint16(3))
    const n = new Tuple((new Uint32(1), new arc4.Uint64(2), new Str('hello')))

    const avmResult = await getAvmResultLog(
      { appClient },
      'verify_log',
      a,
      b.valueOf(),
      asUint8Array(c),
      asUint8Array(asBigUintCls(d).toBytes()),
      e.native,
      f.native,
      g.native.valueOf(),
      h.native.valueOf(),
      asBigUint(i.bytes).valueOf(),
      asBigUint(j.bytes).valueOf(),
      asUint8Array(k.bytes),
      asUint8Array(m.bytes),
      asUint8Array(n.bytes),
    )
    expect(Array.isArray(avmResult)).toBeTruthy()
    ctx.txn.createScope([ctx.any.txn.payment()]).execute(() => {
      expect(() => log(a, b, c, d, e, f, g, h, i, j, k, m, n)).toThrow('Can only add logs to ApplicationCallTransaction')
    })
    const dummyApp = ctx.any.application()
    ctx.txn.createScope([ctx.any.txn.applicationCall({ appId: dummyApp })]).execute(() => {
      log(a, b, c, d, e, f, g, h, i, j, k, m, n)
    })
    let lastTxn = ctx.txn.lastActive as ApplicationCallTransaction
    expect(lastTxn.appLogs).toEqual(avmResult)

    const contract = ctx.contract.create(PrimitiveOpsContract)
    contract.verify_log(a, b, c, asBigUintCls(d).toBytes().asAlgoTs(), e, f, g, h, i, j, k.bytes, m.bytes, n.bytes)
    lastTxn = ctx.txn.lastActive as ApplicationCallTransaction
    expect(lastTxn.appLogs).toEqual(avmResult)
  })
})
