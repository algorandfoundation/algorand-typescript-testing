import { AppSpec } from '@algorandfoundation/algokit-utils/types/app-spec'
import { arc4, BigUint, biguint, Bytes, bytes, emit, Uint64, uint64 } from '@algorandfoundation/algorand-typescript'
import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { afterEach, describe, expect, it } from 'vitest'
import { MAX_UINT512, MAX_UINT64 } from '../../src/constants'
import appSpecJson from '../artifacts/arc4-primitive-ops/data/Arc4PrimitiveOpsContract.arc32.json'
import { getAlgorandAppClient, getAvmResultLog } from '../avm-invoker'

import { asBigUintCls, asNumber, asUint8Array } from '../../src/util'

class Swapped {
  a: string
  b: biguint
  c: uint64
  d: bytes
  e: uint64
  f: boolean
  g: bytes
  h: string

  constructor(a: string, b: biguint, c: uint64, d: bytes, e: uint64, f: boolean, g: bytes, h: string) {
    this.a = a
    this.b = b
    this.c = c
    this.d = d
    this.e = e
    this.f = f
    this.g = g
    this.h = h
  }
}
class SwappedArc4 extends arc4.Struct<{
  m: arc4.UintN<64>
  n: arc4.UintN<256>
  o: arc4.UFixedNxM<32, 8>
  p: arc4.UFixedNxM<256, 16>
  q: arc4.Bool
  r: arc4.StaticArray<arc4.UintN8, 3>
  s: arc4.DynamicArray<arc4.UintN16>
  t: arc4.Tuple<[arc4.UintN32, arc4.UintN64, arc4.Str]>
}> {}

describe('arc4.emit', async () => {
  const appClient = await getAlgorandAppClient(appSpecJson as AppSpec)
  const ctx = new TestExecutionContext()

  afterEach(() => {
    ctx.reset()
  })

  it('should emit the correct values', async () => {
    const test_data = new Swapped('hello', BigUint(MAX_UINT512), Uint64(MAX_UINT64), Bytes('world'), 16, false, Bytes('test'), 'greetings')

    const test_data_arc4 = new SwappedArc4({
      m: new arc4.UintN64(42),
      n: new arc4.UintN256(512),
      o: new arc4.UFixedNxM<32, 8>('42.94967295'),
      p: new arc4.UFixedNxM<256, 16>('25.5'),
      q: new arc4.Bool(true),
      r: new arc4.StaticArray(new arc4.UintN8(1), new arc4.UintN8(2), new arc4.UintN8(3)),
      s: new arc4.DynamicArray(new arc4.UintN16(1), new arc4.UintN16(2), new arc4.UintN16(3)),
      t: new arc4.Tuple(new arc4.UintN32(1), new arc4.UintN64(2), new arc4.Str('hello')),
    })
    const avm_result = await getAvmResultLog(
      { appClient },
      'verify_emit',
      test_data.a,
      test_data.b.valueOf(),
      test_data.c.valueOf(),
      asUint8Array(test_data.d),
      test_data.e,
      test_data.f,
      asUint8Array(test_data.g),
      test_data.h,
      test_data_arc4.m.native.valueOf(),
      test_data_arc4.n.native.valueOf(),
      asBigUintCls(test_data_arc4.o.bytes).asBigInt(),
      asBigUintCls(test_data_arc4.p.bytes).asBigInt(),
      test_data_arc4.q.native,
      asUint8Array(test_data_arc4.r.bytes),
      asUint8Array(test_data_arc4.s.bytes),
      asUint8Array(test_data_arc4.t.bytes),
    )

    expect(avm_result).toBeInstanceOf(Array)
    const avmLogs = avm_result?.map(Bytes)

    const dummy_app = ctx.any.application()
    const app_txn = ctx.any.txn.applicationCall({ appId: dummy_app })
    ctx.txn.createScope([app_txn]).execute(() => {
      emit(test_data_arc4)
      emit(
        'Swapped',
        test_data.a,
        test_data.b,
        test_data.c,
        test_data.d,
        test_data.e,
        test_data.f,
        test_data.g,
        test_data.h,
        test_data_arc4.m,
        test_data_arc4.n,
        test_data_arc4.o,
        test_data_arc4.p,
        test_data_arc4.q,
        test_data_arc4.r,
        test_data_arc4.s,
        test_data_arc4.t,
      )
      emit(
        'Swapped(string,uint512,uint64,byte[],uint64,bool,byte[],string,uint64,uint256,ufixed32x8,ufixed256x16,bool,uint8[3],uint16[],(uint32,uint64,string))',
        test_data.a,
        test_data.b,
        test_data.c,
        test_data.d,
        test_data.e,
        test_data.f,
        test_data.g,
        test_data.h,
        test_data_arc4.m,
        test_data_arc4.n,
        test_data_arc4.o,
        test_data_arc4.p,
        test_data_arc4.q,
        test_data_arc4.r,
        test_data_arc4.s,
        test_data_arc4.t,
      )
      const arc4_result = [...Array(asNumber(app_txn.numLogs)).keys()].fill(0).map((_, i) => app_txn.logs(i))

      expect(arc4_result[0]).toEqual(avmLogs![0])
      expect(arc4_result[1]).toEqual(avmLogs![1])
      expect(arc4_result[1]).toEqual(arc4_result[2])
      expect(arc4_result[2]).toEqual(avmLogs![2])
    })
  })
})
