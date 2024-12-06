import { bytes, Bytes, internal, uint64 } from '@algorandfoundation/algorand-typescript';
import { Address, Bool, decodeArc4, DynamicArray, StaticArray, Str, Tuple, UintN } from '@algorandfoundation/algorand-typescript/arc4';
import { ABIType } from 'algosdk';
import { describe, expect, test } from 'vitest';
import { asBytes } from '../../src/util';
import { asUint8Array } from '../util';

const nativeString = 'hello'
const nativeNumber = 42
const nativeBool = true
const nativeAddress = asUint8Array(Bytes.fromHex(`${'00'.repeat(31)}ff`))

const abiString = new Str('hello')
const abiUint8 = new UintN<8>(42)
const abiBool = new Bool(true)
const abiAddress = new Address(Bytes.fromHex(`${'00'.repeat(31)}ff`))

const testData = [
  {
    abiType: ABIType.from('((bool,(string[],string,address)),(uint8,uint8[3]))'),
    nativeValues() {
      return [
        [nativeBool, [[nativeString, nativeString], nativeString, nativeAddress]],
        [nativeNumber, [nativeNumber, nativeNumber, nativeNumber]],
      ]
    },
    abiValues() {
      return [
        new Tuple<[Bool, Tuple<[DynamicArray<Str>, Str, Address]>]>(
          abiBool,
          new Tuple<[DynamicArray<Str>, Str, Address]>(new DynamicArray(abiString, abiString), abiString, abiAddress),
        ),
        new Tuple<[UintN<8>, StaticArray<UintN<8>, 3>]>(abiUint8, new StaticArray(abiUint8, abiUint8, abiUint8)),
      ] as readonly [Tuple<[Bool, Tuple<[DynamicArray<Str>, Str, Address]>]>, Tuple<[UintN<8>, StaticArray<UintN<8>, 3>]>]
    },
    arc4Value() {
      return new Tuple<[Tuple<[Bool, Tuple<[DynamicArray<Str>, Str, Address]>]>, Tuple<[UintN<8>, StaticArray<UintN<8>, 3>]>]>(
        ...this.abiValues(),
      )
    },
    decode(value: internal.primitives.StubBytesCompat) {
      return decodeArc4<[[boolean, [string[], string, bytes]], [uint64, uint64[]]]>(asBytes(value))
    },
  },
]

describe('decodeArc4', () => {
  test.each(testData)('should decode ABI values', (data) => {
    const nativeValues = data.nativeValues()
    const arc4Value = data.arc4Value()
    const result = data.decode(arc4Value.bytes)
    expect(result).toEqual(nativeValues)
  })
})
