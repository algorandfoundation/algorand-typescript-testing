import type { biguint, bytes, uint64 } from '@algorandfoundation/algorand-typescript'
import { arc4, assertMatch, Bytes } from '@algorandfoundation/algorand-typescript'
import type { StaticBytes, UFixed, Uint64 } from '@algorandfoundation/algorand-typescript/arc4'
import {
  Address,
  arc4EncodedLength,
  Bool,
  decodeArc4,
  DynamicArray,
  DynamicBytes,
  encodeArc4,
  StaticArray,
  Str,
  Struct,
  Tuple,
  Uint,
} from '@algorandfoundation/algorand-typescript/arc4'
import { itob } from '@algorandfoundation/algorand-typescript/op'
import { encodingUtil } from '@algorandfoundation/puya-ts'
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
const abiUint64 = new Uint<64>(42)
const abiUint512 = new Uint<512>(MAX_UINT128)
const abiBool = new Bool(true)
const abiBytes = new DynamicBytes(Bytes('hello'))

type TestObj = { a: Uint64; b: DynamicBytes }
class Swapped1 extends Struct<{
  b: Uint<64>
  c: Bool
  d: Str
  a: Tuple<[Uint<64>, Bool, Bool]>
}> {}

const testData = [
  {
    nativeValues() {
      return [nativeNumber, nativeNumber, nativeBigInt, nativeBytes] as readonly [uint64, uint64, biguint, bytes]
    },
    abiValues() {
      return [abiUint64, abiUint64, abiUint512, abiBytes] as readonly [Uint<64>, Uint<64>, Uint<512>, DynamicBytes]
    },
    arc4Value() {
      return new Tuple<[Uint<64>, Uint<64>, Uint<512>, DynamicBytes]>(abiUint64, abiUint64, abiUint512, abiBytes)
    },
    encode() {
      return encodeArc4(this.nativeValues())
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
      ] as readonly [
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
    },
    abiValues() {
      return [
        new Tuple<[Bool, Tuple<[Str, Bool]>]>(abiBool, new Tuple<[Str, Bool]>(abiString, abiBool)),
        new Tuple<[Uint<64>, Uint<64>]>(abiUint64, abiUint64),
        new Tuple<[Uint<512>, DynamicBytes, Swapped1]>(
          abiUint512,
          abiBytes,
          new Swapped1({ b: abiUint64, c: abiBool, d: abiString, a: new Tuple<[Uint<64>, Bool, Bool]>(abiUint64, abiBool, abiBool) }),
        ),
      ] as readonly [Tuple<[Bool, Tuple<[Str, Bool]>]>, Tuple<[Uint<64>, Uint<64>]>, Tuple<[Uint<512>, DynamicBytes, Swapped1]>]
    },
    arc4Value() {
      return new Tuple<[Tuple<[Bool, Tuple<[Str, Bool]>]>, Tuple<[Uint<64>, Uint<64>]>, Tuple<[Uint<512>, DynamicBytes, Swapped1]>]>(
        ...this.abiValues(),
      )
    },
    encode() {
      return encodeArc4(this.nativeValues())
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
      return { b: nativeNumber, c: nativeBool, d: nativeString, a: [nativeNumber, nativeBool, nativeBool] } as {
        b: uint64
        c: boolean
        d: string
        a: [uint64, boolean, boolean]
      }
    },
    abiValues() {
      return { b: abiUint64, c: abiBool, d: abiString, a: new Tuple<[Uint<64>, Bool, Bool]>(abiUint64, abiBool, abiBool) }
    },
    arc4Value() {
      return new Swapped1(this.abiValues())
    },
    encode() {
      return encodeArc4(this.nativeValues())
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
  test('should be able to decode arrays', () => {
    const a = 234234
    const aBytes = asBytes(encodingUtil.bigIntToUint8Array(234234n, 8))
    const b = true
    const bBytes = asBytes(encodingUtil.bigIntToUint8Array(128n, 1))
    const c = 340943934n
    const cBytes = asBytes(encodingUtil.bigIntToUint8Array(340943934n, 512 / 8))
    const d = 'hello world'
    const dBytes = asBytes(
      new Uint8Array([
        ...encodingUtil.bigIntToUint8Array(BigInt('hello world'.length), 2),
        ...encodingUtil.utf8ToUint8Array('hello world'),
      ]),
    )
    const e = { a: new arc4.Uint64(50n), b: new DynamicBytes(asBytes(new Uint8Array([1, 2, 3, 4, 5]))) }
    const eBytes = asBytes(new Uint8Array([...encodingUtil.bigIntToUint8Array(50n, 8), 0, 10, 0, 5, 1, 2, 3, 4, 5]))
    const f = new Address(Bytes.fromHex(`${'00'.repeat(31)}ff`))
    const fBytes = Bytes.fromHex(`${'00'.repeat(31)}ff`)
    expect(decodeArc4<uint64>(aBytes)).toEqual(a)
    expect(decodeArc4<boolean>(bBytes)).toEqual(b)
    expect(decodeArc4<biguint>(cBytes)).toEqual(c)
    expect(decodeArc4<string>(dBytes)).toEqual(d)
    assertMatch(decodeArc4<TestObj>(eBytes), e)

    const lenPrefix = itob(1).slice(6, 8)
    const offsetHeader = itob(2).slice(6, 8)
    expect(decodeArc4<uint64[]>(lenPrefix.concat(aBytes))).toEqual([a])
    expect(decodeArc4<boolean[]>(lenPrefix.concat(bBytes))).toEqual([b])
    expect(decodeArc4<biguint[]>(lenPrefix.concat(cBytes))).toEqual([c])
    expect(decodeArc4<string[]>(Bytes`${lenPrefix}${offsetHeader}${dBytes}`)).toEqual([d])
    assertMatch(decodeArc4<TestObj[]>(Bytes`${lenPrefix}${offsetHeader}${eBytes}`), [e])
    expect(JSON.stringify(decodeArc4<Address[]>(Bytes`${lenPrefix}${fBytes}`))).toEqual(JSON.stringify([f]))
  })
})

describe('encodeArc4', () => {
  test.each(testData)('should encode native values', (data) => {
    const arc4Value = data.arc4Value()

    const result = data.encode()

    expect(result).toEqual(arc4Value.bytes)
  })
  test('should be able to encode arrays', () => {
    const address = new Address(Bytes.fromHex(`${'00'.repeat(31)}ff`))
    expect(encodeArc4(address)).toEqual(address.bytes)

    expect(encodeArc4([nativeNumber])).toEqual(new StaticArray(new arc4.Uint64(nativeNumber)).bytes)
    expect(encodeArc4([nativeBool])).toEqual(new StaticArray(new Bool(nativeBool)).bytes)
    expect(encodeArc4([nativeBigInt])).toEqual(new StaticArray(new Uint<512>(nativeBigInt)).bytes)
    expect(encodeArc4([nativeBytes])).toEqual(new StaticArray(new DynamicBytes(nativeBytes)).bytes)
    expect(encodeArc4([nativeString])).toEqual(new StaticArray(new Str(nativeString)).bytes)
    expect(encodeArc4([address])).toEqual(new StaticArray(address).bytes)

    expect(encodeArc4<uint64[]>([nativeNumber])).toEqual(new DynamicArray(new arc4.Uint64(nativeNumber)).bytes)
    expect(encodeArc4<boolean[]>([nativeBool])).toEqual(new DynamicArray(new Bool(nativeBool)).bytes)
    expect(encodeArc4<biguint[]>([nativeBigInt])).toEqual(new DynamicArray(new Uint<512>(nativeBigInt)).bytes)
    expect(encodeArc4<bytes[]>([nativeBytes])).toEqual(new DynamicArray(new DynamicBytes(nativeBytes)).bytes)
    expect(encodeArc4<string[]>([nativeString])).toEqual(new DynamicArray(new Str(nativeString)).bytes)
    expect(encodeArc4<Address[]>([address])).toEqual(new DynamicArray(address).bytes)
  })
})

class StaticStruct extends Struct<{
  a: Uint64
  b: StaticArray<Bool, 10>
  c: Bool
  d: StaticBytes<32>
  e: Address
  f: StaticArray<UFixed<256, 16>, 10>
}> {}
describe('arc4EncodedLength', () => {
  test('should return the correct length', () => {
    expect(arc4EncodedLength<uint64>()).toEqual(8)
    expect(arc4EncodedLength<biguint>()).toEqual(64)
    expect(arc4EncodedLength<Bool>()).toEqual(1)
    expect(arc4EncodedLength<boolean>()).toEqual(1)
    expect(arc4EncodedLength<Uint<512>>()).toEqual(64)
    expect(arc4EncodedLength<[uint64, uint64, boolean]>()).toEqual(17)
    expect(arc4EncodedLength<[uint64, uint64, boolean, boolean]>()).toEqual(17)
    expect(arc4EncodedLength<Tuple<[StaticArray<Bool, 10>, Bool]>>()).toEqual(3)
    expect(arc4EncodedLength<StaticStruct>()).toEqual(395)
    expect(arc4EncodedLength<[StaticArray<Bool, 10>, boolean, boolean]>()).toEqual(3)
    expect(
      arc4EncodedLength<[[boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean], boolean, boolean]>(),
    ).toEqual(3)
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
