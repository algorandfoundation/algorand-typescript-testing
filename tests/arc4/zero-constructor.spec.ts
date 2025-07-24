import { op } from '@algorandfoundation/algorand-typescript'
import {
  Address,
  Bool,
  DynamicArray,
  DynamicBytes,
  encodeArc4,
  StaticArray,
  StaticBytes,
  Str,
  Tuple,
  UFixed,
  Uint32,
  Uint8,
} from '@algorandfoundation/algorand-typescript/arc4'
import { describe, expect, it } from 'vitest'

describe('initialising ABI values with constructor args', () => {
  it('should set correct zero values', () => {
    expect(new StaticArray<Uint8, 4>().bytes).toEqual(new StaticArray(new Uint8(0), new Uint8(0), new Uint8(0), new Uint8(0)).bytes)
    expect(new StaticArray<Bool, 4>().bytes).toEqual(
      new StaticArray(new Bool(false), new Bool(false), new Bool(false), new Bool(false)).bytes,
    )
    expect(new StaticArray<Bool, 9>().bytes).toEqual(
      new StaticArray(
        new Bool(false),
        new Bool(false),
        new Bool(false),
        new Bool(false),
        new Bool(false),
        new Bool(false),
        new Bool(false),
        new Bool(false),
        new Bool(false),
      ).bytes,
    )
    expect(new DynamicArray<Uint8>().bytes).toEqual(op.bzero(2))
    expect(new Tuple<[Bool, Bool, Bool, Bool, Bool, Bool, Bool, Bool, Bool]>().bytes).toEqual(
      encodeArc4([false, false, false, false, false, false, false, false, false]),
    )
    expect(new DynamicArray<Str>().bytes).toEqual(op.bzero(2))
    expect(new Str().bytes).toEqual(op.bzero(2))
    expect(new DynamicBytes().bytes).toEqual(op.bzero(2))
    expect(new StaticBytes<5>().bytes).toEqual(op.bzero(5))
    expect(new Address().bytes).toEqual(op.bzero(32))
    expect(new UFixed<32, 4>().bytes).toEqual(op.bzero(32 / 8))
    expect(new Bool().bytes).toEqual(op.bzero(1))
    expect(new Uint32().bytes).toEqual(op.bzero(32 / 8))
  })
})
