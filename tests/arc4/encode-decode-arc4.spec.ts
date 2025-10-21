import type { biguint, bytes, uint64 } from '@algorandfoundation/algorand-typescript'
import { Bytes } from '@algorandfoundation/algorand-typescript'
import type { Address, StaticArray, StaticBytes, UFixedNxM, UintN64 } from '@algorandfoundation/algorand-typescript/arc4'
import {
  arc4EncodedLength,
  Bool,
  decodeArc4,
  DynamicBytes,
  encodeArc4,
  Str,
  Struct,
  Tuple,
  UintN,
} from '@algorandfoundation/algorand-typescript/arc4'
import { describe, expect, test } from 'vitest'
import { MAX_UINT128 } from '../../src/constants'
import type { StubBytesCompat } from '../../src/impl/primitives'
import type { DeliberateAny } from '../../src/typescript-helpers'
import { asBytes } from '../../src/util'

const nativeString = 'hello'
const nativeNumber = 42
const nativeBigInt = MAX_UINT128
const nativeBool = true
const nativeBytes = Bytes('hello')

const abiString = new Str('hello')
const abiUint64 = new UintN<64>(42)
const abiUint512 = new UintN<512>(MAX_UINT128)
const abiBool = new Bool(true)
const abiBytes = new DynamicBytes(Bytes('hello'))

class Swapped1 extends Struct<{
  b: UintN<64>
  c: Bool
  d: Str
  a: Tuple<[UintN<64>, Bool, Bool]>
}> {}

const testData = [
  {
    nativeValues() {
      return [nativeNumber, nativeNumber, nativeBigInt, nativeBytes]
    },
    abiValues() {
      return [abiUint64, abiUint64, abiUint512, abiBytes] as readonly [UintN<64>, UintN<64>, UintN<512>, DynamicBytes]
    },
    arc4Value() {
      return new Tuple<[UintN<64>, UintN<64>, UintN<512>, DynamicBytes]>(abiUint64, abiUint64, abiUint512, abiBytes)
    },
    decode(value: StubBytesCompat) {
      return decodeArc4<[uint64, uint64, biguint, bytes]>(asBytes(value))
    },
  },
  {
    nativeValues() {
      return [
        [nativeBool, [nativeString, nativeBool]],
        [nativeNumber, nativeNumber],
        [nativeBigInt, nativeBytes, { b: nativeNumber, c: nativeBool, d: nativeString, a: [nativeNumber, nativeBool, nativeBool] }],
      ]
    },
    abiValues() {
      return [
        new Tuple<[Bool, Tuple<[Str, Bool]>]>(abiBool, new Tuple<[Str, Bool]>(abiString, abiBool)),
        new Tuple<[UintN<64>, UintN<64>]>(abiUint64, abiUint64),
        new Tuple<[UintN<512>, DynamicBytes, Swapped1]>(
          abiUint512,
          abiBytes,
          new Swapped1({ b: abiUint64, c: abiBool, d: abiString, a: new Tuple<[UintN<64>, Bool, Bool]>(abiUint64, abiBool, abiBool) }),
        ),
      ] as readonly [Tuple<[Bool, Tuple<[Str, Bool]>]>, Tuple<[UintN<64>, UintN<64>]>, Tuple<[UintN<512>, DynamicBytes, Swapped1]>]
    },
    arc4Value() {
      return new Tuple<[Tuple<[Bool, Tuple<[Str, Bool]>]>, Tuple<[UintN<64>, UintN<64>]>, Tuple<[UintN<512>, DynamicBytes, Swapped1]>]>(
        ...this.abiValues(),
      )
    },
    decode(value: StubBytesCompat) {
      return decodeArc4<
        [
          [boolean, [string, boolean]],
          [uint64, uint64],
          [
            biguint,
            bytes,
            {
              b: uint64
              c: boolean
              d: string
              a: [uint64, boolean, boolean]
            },
          ],
        ]
      >(asBytes(value))
    },
  },
  {
    nativeValues() {
      return { b: nativeNumber, c: nativeBool, d: nativeString, a: [nativeNumber, nativeBool, nativeBool] }
    },
    abiValues() {
      return { b: abiUint64, c: abiBool, d: abiString, a: new Tuple<[UintN<64>, Bool, Bool]>(abiUint64, abiBool, abiBool) }
    },
    arc4Value() {
      return new Swapped1(this.abiValues())
    },
    decode(value: StubBytesCompat) {
      return decodeArc4<{ b: uint64; c: boolean; d: string; a: [uint64, boolean, boolean] }>(asBytes(value))
    },
  },
]

describe('decodeArc4', () => {
  test.each(testData)('should decode ABI values', (data) => {
    const nativeValues = data.nativeValues()
    const arc4Value = data.arc4Value()

    const result = data.decode(arc4Value.bytes)

    compareNativeValues(result, nativeValues)
  })
})

describe('encodeArc4', () => {
  test.each(testData)('should encode native values', (data) => {
    const nativeValues = data.nativeValues()
    const arc4Value = data.arc4Value()

    const result = encodeArc4(nativeValues)

    expect(result).toEqual(arc4Value.bytes)
  })
})

class StaticStruct extends Struct<{
  a: UintN64
  b: StaticArray<Bool, 10>
  c: Bool
  d: StaticBytes<32>
  e: Address
  f: StaticArray<UFixedNxM<256, 16>, 10>
}> {}
describe('arc4EncodedLength', () => {
  test('should return the correct length', () => {
    expect(arc4EncodedLength<uint64>()).toEqual(8)
    expect(arc4EncodedLength<biguint>()).toEqual(64)
    expect(arc4EncodedLength<Bool>()).toEqual(1)
    expect(arc4EncodedLength<boolean>()).toEqual(8)
    expect(arc4EncodedLength<UintN<512>>()).toEqual(64)
    expect(arc4EncodedLength<[uint64, uint64, boolean]>()).toEqual(17)
    expect(arc4EncodedLength<[uint64, uint64, boolean, boolean]>()).toEqual(17)
    expect(arc4EncodedLength<Tuple<[StaticArray<Bool, 10>, Bool]>>()).toEqual(3)
    expect(arc4EncodedLength<StaticStruct>()).toEqual(395)
  })
})

const compareNativeValues = (a: DeliberateAny, b: DeliberateAny) => {
  if (Array.isArray(a)) {
    for (let i = 0; i < a.length; i++) {
      compareNativeValues(a[i], b[i])
    }
  }
  expect(a).toEqual(b)
}
