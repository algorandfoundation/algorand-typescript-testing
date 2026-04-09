import type { bytes, uint64 } from '@algorandfoundation/algorand-typescript'
import { BigUint, Bytes, Uint64 } from '@algorandfoundation/algorand-typescript'
import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { afterEach, describe, expect, it } from 'vitest'
import {
  Address,
  Bool,
  Byte,
  DynamicArray,
  DynamicBytes,
  StaticArray,
  Str,
  Tuple,
  Uint128,
  Uint64 as ARC4Uint64,
  Uint8,
} from '@algorandfoundation/algorand-typescript/arc4'
import {
  ArgsComplex,
  NestedStruct,
  OverwriteStruct,
  SimpleNamedTuple,
  SimpleStruct,
} from '../artifacts/logic-signature/lsig-args-complex.algo'

describe('ArgsComplex LogicSig', () => {
  const ctx = new TestExecutionContext()

  afterEach(() => {
    ctx.reset()
  })

  const buildArgs = (overrides?: { arg4?: boolean; arg9?: Bool }) => {
    const arg0 = Uint64(42)
    const arg1 = Bytes('hello')
    const arg2 = BigUint(100)
    const arg3 = 'world'
    const arg4 = overrides?.arg4 ?? false
    const arg5 = new Uint8(5)
    const arg6 = new ARC4Uint64(10)
    const arg7 = new Uint128(1000)
    const arg8 = new Address('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ')
    const arg9 = overrides?.arg9 ?? new Bool(true)
    const arg10 = new Str('hello')
    const arg11 = new DynamicBytes(Bytes.fromHex('deadbeef'))
    const arg12 = new StaticArray<Byte, 4>(new Byte(0x01), new Byte(0x02), new Byte(0x03), new Byte(0x04))
    const arg13 = new SimpleStruct({ x: new ARC4Uint64(10), y: new ARC4Uint64(20) })
    const arg14 = new NestedStruct({
      header: new Uint8(1),
      data: new SimpleStruct({ x: new ARC4Uint64(30), y: new ARC4Uint64(40) }),
    })
    const arg15 = new Tuple<[Uint8, ARC4Uint64]>(new Uint8(3), new ARC4Uint64(7))
    const arg16 = new SimpleNamedTuple({ a: new Uint8(2), b: new ARC4Uint64(5) })
    const arg17: [uint64, bytes] = [Uint64(50), Bytes('data')]
    const arg18: [uint64, [bytes, uint64]] = [Uint64(60), [Bytes('nested'), Uint64(70)]]
    const arg19 = new OverwriteStruct({ value: new Uint8(9), dontOverwriteMe: new Bool(false) })
    const arg20 = new DynamicArray<Uint8>(new Uint8(1), new Uint8(2), new Uint8(3))

    return [
      arg0,
      arg1,
      arg2,
      arg3,
      arg4,
      arg5,
      arg6,
      arg7,
      arg8,
      arg9,
      arg10,
      arg11,
      arg12,
      arg13,
      arg14,
      arg15,
      arg16,
      arg17,
      arg18,
      arg19,
      arg20,
    ] as const
  }

  it('should return false when arg9 is true (negated)', () => {
    const args = buildArgs({ arg9: new Bool(true) })
    const result = ctx.executeLogicSig(new ArgsComplex(), ...args)
    expect(result).toBe(false)
  })

  it('should return true when arg9 is false (negated)', () => {
    const args = buildArgs({ arg9: new Bool(false) })
    const result = ctx.executeLogicSig(new ArgsComplex(), ...args)
    expect(result).toBe(true)
  })

  it('should include arg1 length in total when arg4 is false (mutableArg4 becomes true)', () => {
    const args = buildArgs({ arg4: false, arg9: new Bool(false) })
    // When arg4=false, mutableArg4=true, so total includes mutableArg1.length
    // This path should still succeed (all assertions pass)
    const result = ctx.executeLogicSig(new ArgsComplex(), ...args)
    expect(result).toBe(true)
  })

  it('should not include arg1 length in total when arg4 is true (mutableArg4 becomes false)', () => {
    const args = buildArgs({ arg4: true, arg9: new Bool(false) })
    // When arg4=true, mutableArg4=false, so total does not include mutableArg1.length
    const result = ctx.executeLogicSig(new ArgsComplex(), ...args)
    expect(result).toBe(true)
  })
})
