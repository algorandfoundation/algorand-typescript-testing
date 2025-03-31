import { getABIEncodedValue } from '@algorandfoundation/algokit-utils/types/app-arc56'
import { Bytes } from '@algorandfoundation/algorand-typescript'
import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import {
  Address,
  Bool,
  DynamicArray,
  interpretAsArc4,
  StaticArray,
  Str,
  Struct,
  Tuple,
  UFixedNxM,
  UintN,
} from '@algorandfoundation/algorand-typescript/arc4'
import { encodingUtil } from '@algorandfoundation/puya-ts'
import { afterEach, describe, expect, it, test } from 'vitest'
import type { StubBytesCompat } from '../../src/impl/primitives'
import { AccountCls } from '../../src/impl/reference'
import type { DeliberateAny } from '../../src/typescript-helpers'
import { asBytes, asUint8Array } from '../../src/util'

const addressDynamicArray = {
  abiTypeString: 'address[]',
  nativeValues() {
    return [
      asUint8Array(Bytes.fromHex('00'.repeat(32))),
      asUint8Array(Bytes.fromHex('01'.repeat(32))),
      asUint8Array(Bytes.fromHex('ff'.repeat(32))),
      asUint8Array(Bytes.fromHex(`${'00'.repeat(31)}ff`)),
      asUint8Array(Bytes.fromHex(`${'00'.repeat(30)}${'ff'.repeat(2)}`)),
      asUint8Array(Bytes.fromHex(`${'00'.repeat(29)}${'ff'.repeat(3)}`)),
      asUint8Array(Bytes.fromHex(`${'00'.repeat(28)}${'ff'.repeat(4)}`)),
      asUint8Array(Bytes.fromHex(`${'00'.repeat(27)}${'ff'.repeat(5)}`)),
      asUint8Array(Bytes.fromHex(`${'00'.repeat(26)}${'ff'.repeat(6)}`)),
      asUint8Array(Bytes.fromHex(`${'00'.repeat(25)}${'ff'.repeat(7)}`)),
    ]
  },
  abiValues() {
    return this.nativeValues().map((v) => new Address(Bytes(v)))
  },
  array(isEmpty = false) {
    return isEmpty ? new DynamicArray<Address>() : new DynamicArray<Address>(...this.abiValues())
  },
  create(value: StubBytesCompat) {
    return interpretAsArc4<DynamicArray<Address>>(asBytes(value))
  },
  concat() {
    return this.array().concat(this.array())
  },
  concatABIValue() {
    return getABIEncodedValue([...this.nativeValues(), ...this.nativeValues()], this.abiTypeString, {})
  },
}
const boolDynamicArray = {
  abiTypeString: 'bool[]',
  nativeValues() {
    return [true, true, false, true, false, true, true, false, true, false]
  },
  abiValues() {
    return this.nativeValues().map((v) => new Bool(v))
  },
  array(isEmpty = false) {
    return isEmpty ? new DynamicArray<Bool>() : new DynamicArray<Bool>(...this.abiValues())
  },
  create(value: StubBytesCompat) {
    return interpretAsArc4<DynamicArray<Bool>>(asBytes(value))
  },
  concat() {
    return this.array().concat(this.array())
  },
  concatABIValue() {
    return getABIEncodedValue([...this.nativeValues(), ...this.nativeValues()], this.abiTypeString, {})
  },
}
const uint256DynamicArray = {
  abiTypeString: 'uint256[]',
  nativeValues() {
    return [0n, 1n, 2n, 3n, 2n ** 8n, 2n ** 16n, 2n ** 32n, 2n ** 64n, 2n ** 128n, 2n ** 256n - 1n]
  },
  abiValues() {
    return this.nativeValues().map((v) => new UintN<256>(v))
  },
  array(isEmpty = false) {
    return isEmpty ? new DynamicArray<UintN<256>>() : new DynamicArray<UintN<256>>(...this.abiValues())
  },
  create(value: StubBytesCompat) {
    return interpretAsArc4<DynamicArray<UintN<256>>>(asBytes(value))
  },
  concat() {
    return this.array().concat(this.array())
  },
  concatABIValue() {
    return getABIEncodedValue([...this.nativeValues(), ...this.nativeValues()], this.abiTypeString, {})
  },
}
const ufixednxmDynamicArray = {
  abiTypeString: 'ufixed256x16[]',
  nativeValues() {
    return this.abiValues().map((v) => v.native.valueOf())
  },
  abiValues() {
    return [
      new UFixedNxM<256, 16>('0.0'),
      new UFixedNxM<256, 16>('1.0'),
      new UFixedNxM<256, 16>('2.0'),
      new UFixedNxM<256, 16>('3.0'),
      new UFixedNxM<256, 16>('255.0'),
      new UFixedNxM<256, 16>('65536.0'),
      new UFixedNxM<256, 16>('4294967295.0'),
      new UFixedNxM<256, 16>('1844.6744073709551616'),
      new UFixedNxM<256, 16>('340282366920938463463374.607431768211456'),
      new UFixedNxM<256, 16>('11579208923731619542357098500868790785326998466564056403945758.4007913129639935'),
    ]
  },
  array(isEmpty = false) {
    return isEmpty ? new DynamicArray<UFixedNxM<256, 16>>() : new DynamicArray<UFixedNxM<256, 16>>(...this.abiValues())
  },
  create(value: StubBytesCompat) {
    return interpretAsArc4<DynamicArray<UFixedNxM<256, 16>>>(asBytes(value))
  },
  concat() {
    return this.array().concat(this.array())
  },
  concatABIValue() {
    return getABIEncodedValue([...this.nativeValues(), ...this.nativeValues()], this.abiTypeString, {})
  },
}
const stringDynamicArray = {
  abiTypeString: 'string[]',
  nativeValues() {
    return [
      '',
      '1',
      'hello',
      'World',
      (2 ** 8).toString(),
      (2 ** 16).toString(),
      (2 ** 32).toString(),
      (2 ** 64).toString(),
      (2 ** 128).toString(),
      (2 ** 256).toString(),
    ]
  },
  abiValues() {
    return this.nativeValues().map((v) => new Str(v))
  },
  array(isEmpty = false) {
    return isEmpty ? new DynamicArray<Str>() : new DynamicArray<Str>(...this.abiValues())
  },
  create(value: StubBytesCompat) {
    return interpretAsArc4<DynamicArray<Str>>(asBytes(value))
  },
  concat() {
    return this.array().concat(this.array())
  },
  concatABIValue() {
    return getABIEncodedValue([...this.nativeValues(), ...this.nativeValues()], this.abiTypeString, {})
  },
}
const boolDynamicArrayOfArray = {
  abiTypeString: 'bool[][]',
  nativeValues() {
    return [boolDynamicArray.nativeValues(), boolDynamicArray.nativeValues().reverse()]
  },
  abiValues() {
    return this.nativeValues().map((a) => new DynamicArray<Bool>(...a.map((v) => new Bool(v))))
  },
  array(isEmpty = false) {
    return isEmpty
      ? new DynamicArray<DynamicArray<Bool>>()
      : new DynamicArray<DynamicArray<Bool>>(...this.abiValues().map((a) => new DynamicArray<Bool>(...a)))
  },
  create(value: StubBytesCompat) {
    return interpretAsArc4<DynamicArray<DynamicArray<Bool>>>(asBytes(value))
  },
  concat() {
    return this.array().concat(this.array())
  },
  concatABIValue() {
    return getABIEncodedValue([...this.nativeValues(), ...this.nativeValues()], this.abiTypeString, {})
  },
}
const addressDynamicArrayOfArray = {
  abiTypeString: 'address[][]',
  nativeValues() {
    return [addressDynamicArray.nativeValues(), addressDynamicArray.nativeValues().reverse()]
  },
  abiValues() {
    return this.nativeValues().map((a) => new DynamicArray<Address>(...a.map((v) => new Address(Bytes(v)))))
  },
  array(isEmpty = false) {
    return isEmpty
      ? new DynamicArray<DynamicArray<Address>>()
      : new DynamicArray<DynamicArray<Address>>(...this.abiValues().map((a) => new DynamicArray<Address>(...a)))
  },
  create(value: StubBytesCompat) {
    return interpretAsArc4<DynamicArray<DynamicArray<Address>>>(asBytes(value))
  },
  concat() {
    return this.array().concat(this.array())
  },
  concatABIValue() {
    return getABIEncodedValue([...this.nativeValues(), ...this.nativeValues()], this.abiTypeString, {})
  },
}
const uint256DynamicArrayOfArray = {
  abiTypeString: 'uint256[][]',
  nativeValues() {
    return [uint256DynamicArray.nativeValues(), uint256DynamicArray.nativeValues().reverse()]
  },
  abiValues() {
    return this.nativeValues().map((a) => new DynamicArray<UintN<256>>(...a.map((v) => new UintN<256>(v))))
  },
  array(isEmpty = false) {
    return isEmpty
      ? new DynamicArray<DynamicArray<UintN<256>>>()
      : new DynamicArray<DynamicArray<UintN<256>>>(...this.abiValues().map((a) => new DynamicArray<UintN<256>>(...a)))
  },
  create(value: StubBytesCompat) {
    return interpretAsArc4<DynamicArray<DynamicArray<UintN<256>>>>(asBytes(value))
  },
  concat() {
    return this.array().concat(this.array())
  },
  concatABIValue() {
    return getABIEncodedValue([...this.nativeValues(), ...this.nativeValues()], this.abiTypeString, {})
  },
}
const uint256DynamicArrayOfStaticArray = {
  abiTypeString: 'uint256[10][]',
  nativeValues() {
    return [uint256DynamicArray.nativeValues(), uint256DynamicArray.nativeValues().reverse()]
  },
  abiValues() {
    return this.nativeValues().map((a) => new StaticArray<UintN<256>, 10>(...(a.map((v) => new UintN<256>(v)) as [])))
  },
  array(isEmpty = false) {
    return isEmpty
      ? new DynamicArray<StaticArray<UintN<256>, 10>>()
      : new DynamicArray<StaticArray<UintN<256>, 10>>(
          ...this.abiValues().map((a) => new StaticArray<UintN<256>, 10>(...(a as DeliberateAny))),
        )
  },
  create(value: StubBytesCompat) {
    return interpretAsArc4<DynamicArray<StaticArray<UintN<256>, 10>>>(asBytes(value))
  },
  concat() {
    return this.array().concat(this.array())
  },
  concatABIValue() {
    return getABIEncodedValue([...this.nativeValues(), ...this.nativeValues()], this.abiTypeString, {})
  },
}
const stringDynamicArrayOfArray = {
  abiTypeString: 'string[][]',
  nativeValues() {
    return [stringDynamicArray.nativeValues(), stringDynamicArray.nativeValues().reverse()]
  },
  abiValues() {
    return this.nativeValues().map((a) => new DynamicArray<Str>(...a.map((v) => new Str(v))))
  },
  array(isEmpty = false) {
    return isEmpty
      ? new DynamicArray<DynamicArray<Str>>()
      : new DynamicArray<DynamicArray<Str>>(...this.abiValues().map((a) => new DynamicArray<Str>(...a)))
  },
  create(value: StubBytesCompat) {
    return interpretAsArc4<DynamicArray<DynamicArray<Str>>>(asBytes(value))
  },
  concat() {
    return this.array().concat(this.array())
  },
  concatABIValue() {
    return getABIEncodedValue([...this.nativeValues(), ...this.nativeValues()], this.abiTypeString, {})
  },
}
const stringDynamicArrayOfArrayOfArray = {
  abiTypeString: 'string[][][]',
  nativeValues() {
    return [
      [stringDynamicArray.nativeValues(), stringDynamicArray.nativeValues().reverse(), stringDynamicArray.nativeValues()],
      [stringDynamicArray.nativeValues().reverse(), stringDynamicArray.nativeValues(), stringDynamicArray.nativeValues().reverse()],
    ]
  },
  abiValues() {
    return this.nativeValues().map(
      (x) => new DynamicArray<DynamicArray<Str>>(...x.map((y) => new DynamicArray<Str>(...y.map((v) => new Str(v))))),
    )
  },
  array(isEmpty = false) {
    return isEmpty
      ? new DynamicArray<DynamicArray<DynamicArray<Str>>>()
      : new DynamicArray<DynamicArray<DynamicArray<Str>>>(...this.abiValues().map((x) => new DynamicArray<DynamicArray<Str>>(...x)))
  },
  create(value: StubBytesCompat) {
    return interpretAsArc4<DynamicArray<DynamicArray<DynamicArray<Str>>>>(asBytes(value))
  },
  concat() {
    return this.array().concat(this.array())
  },
  concatABIValue() {
    return getABIEncodedValue([...this.nativeValues(), ...this.nativeValues()], this.abiTypeString, {})
  },
}
const tupleDynamicArray = {
  abiTypeString: '(string[],(string[],string,uint256,address),bool,uint256[3])[]',
  nativeValues() {
    return Array(2).fill([
      stringDynamicArray.nativeValues().slice(0, 2),
      [
        stringDynamicArray.nativeValues().slice(6, 8),
        stringDynamicArray.nativeValues()[9],
        uint256DynamicArray.nativeValues()[4],
        addressDynamicArray.nativeValues()[5],
      ],
      boolDynamicArray.nativeValues()[3],
      uint256DynamicArray.nativeValues().slice(4, 7),
    ])
  },
  abiValues() {
    return Array(2).fill(
      new Tuple(
        ...[
          new DynamicArray<Str>(...stringDynamicArray.abiValues().slice(0, 2)),
          new Tuple<[DynamicArray<Str>, Str, UintN<256>, Address]>(
            new DynamicArray<Str>(...stringDynamicArray.abiValues().slice(6, 8)),
            stringDynamicArray.abiValues()[9],
            uint256DynamicArray.abiValues()[4],
            addressDynamicArray.abiValues()[5],
          ),
          boolDynamicArray.abiValues()[3],
          new StaticArray<UintN<256>, 3>(...(uint256DynamicArray.abiValues().slice(4, 7) as [])),
        ],
      ),
    )
  },
  array(isEmpty = false) {
    return isEmpty
      ? new DynamicArray<
          Tuple<[DynamicArray<Str>, Tuple<[DynamicArray<Str>, Str, UintN<256>, Address]>, Bool, StaticArray<UintN<256>, 3>]>
        >()
      : new DynamicArray<
          Tuple<[DynamicArray<Str>, Tuple<[DynamicArray<Str>, Str, UintN<256>, Address]>, Bool, StaticArray<UintN<256>, 3>]>
        >(...this.abiValues())
  },
  create(value: StubBytesCompat) {
    return interpretAsArc4<
      DynamicArray<Tuple<[DynamicArray<Str>, Tuple<[DynamicArray<Str>, Str, UintN<256>, Address]>, Bool, StaticArray<UintN<256>, 3>]>>
    >(asBytes(value))
  },
  concat() {
    return this.array().concat(this.array())
  },
  concatABIValue() {
    return getABIEncodedValue([...this.nativeValues(), ...this.nativeValues()], this.abiTypeString, {})
  },
}
class Swapped extends Struct<{
  b: UintN<256>
  c: Bool
  d: Str
  a: Tuple<[DynamicArray<Str>, DynamicArray<Str>, Str, UintN<256>, Bool, StaticArray<UintN<256>, 3>]>
}> {}
const structDynamicArray = {
  abiTypeString: '(uint256,bool,string,(string[],string[],string,uint256,bool,uint256[3]))[]',
  nativeValues() {
    return Array(2).fill([
      uint256DynamicArray.nativeValues()[0],
      boolDynamicArray.nativeValues()[1],
      stringDynamicArray.nativeValues()[2],
      [
        [stringDynamicArray.nativeValues()[3], stringDynamicArray.nativeValues()[4]],
        [stringDynamicArray.nativeValues()[5], stringDynamicArray.nativeValues()[6]],
        stringDynamicArray.nativeValues()[7],
        uint256DynamicArray.nativeValues()[1],
        boolDynamicArray.nativeValues()[2],
        [uint256DynamicArray.nativeValues()[2], uint256DynamicArray.nativeValues()[3], uint256DynamicArray.nativeValues()[4]],
      ],
    ])
  },
  abiValues() {
    return Array(2).fill(
      new Swapped({
        b: uint256DynamicArray.abiValues()[0],
        c: boolDynamicArray.abiValues()[1],
        d: stringDynamicArray.abiValues()[2],
        a: new Tuple(
          new DynamicArray<Str>(stringDynamicArray.abiValues()[3], stringDynamicArray.abiValues()[4]),
          new DynamicArray<Str>(stringDynamicArray.abiValues()[5], stringDynamicArray.abiValues()[6]),
          stringDynamicArray.abiValues()[7],
          uint256DynamicArray.abiValues()[1],
          boolDynamicArray.abiValues()[2],
          new StaticArray<UintN<256>, 3>(
            uint256DynamicArray.abiValues()[2],
            uint256DynamicArray.abiValues()[3],
            uint256DynamicArray.abiValues()[4],
          ),
        ),
      }),
    )
  },
  array(isEmpty = false) {
    return isEmpty ? new DynamicArray<Swapped>() : new DynamicArray<Swapped>(...this.abiValues())
  },
  create(value: StubBytesCompat) {
    return interpretAsArc4<DynamicArray<Swapped>>(asBytes(value))
  },
  concat() {
    return this.array().concat(this.array())
  },
  concatABIValue() {
    return getABIEncodedValue([...this.nativeValues(), ...this.nativeValues()], this.abiTypeString, {})
  },
}

describe('arc4.DynamicArray', () => {
  const ctx = new TestExecutionContext()
  afterEach(() => {
    ctx.reset()
  })

  test.each([
    addressDynamicArray,
    boolDynamicArray,
    uint256DynamicArray,
    ufixednxmDynamicArray,
    stringDynamicArray,
    addressDynamicArrayOfArray,
    boolDynamicArrayOfArray,
    uint256DynamicArrayOfArray,
    uint256DynamicArrayOfStaticArray,
    stringDynamicArrayOfArray,
    stringDynamicArrayOfArrayOfArray,
    tupleDynamicArray,
    structDynamicArray,
  ])('should be able to get bytes representation', (data) => {
    const sdkResult = getABIEncodedValue(data.nativeValues(), data.abiTypeString, {})
    const result = data.array().bytes
    expect(result).toEqual(sdkResult)
  })

  test.each([
    addressDynamicArray,
    boolDynamicArray,
    uint256DynamicArray,
    ufixednxmDynamicArray,
    stringDynamicArray,
    addressDynamicArrayOfArray,
    boolDynamicArrayOfArray,
    uint256DynamicArrayOfArray,
    uint256DynamicArrayOfStaticArray,
    stringDynamicArrayOfArray,
    stringDynamicArrayOfArrayOfArray,
    tupleDynamicArray,
    structDynamicArray,
  ])('copy dynamic array', (data) => {
    const sdkResult = getABIEncodedValue(data.nativeValues(), data.abiTypeString, {})
    const original = data.array()
    const copy = original.copy()
    const result = copy.bytes
    expect(copy.length).toEqual(original.length)
    expect(result).toEqual(sdkResult)
  })

  test.each([
    addressDynamicArray,
    boolDynamicArray,
    uint256DynamicArray,
    ufixednxmDynamicArray,
    stringDynamicArray,
    addressDynamicArrayOfArray,
    boolDynamicArrayOfArray,
    uint256DynamicArrayOfArray,
    uint256DynamicArrayOfStaticArray,
    stringDynamicArrayOfArray,
    stringDynamicArrayOfArrayOfArray,
    tupleDynamicArray,
    structDynamicArray,
  ])('concat dynamic array', (data) => {
    const sdkResult = data.concatABIValue()
    const original = data.array()
    const concatenated = data.concat()
    const result = concatenated.bytes

    expect(concatenated.length).toEqual(original.length * 2)
    expect(result).toEqual(asBytes(sdkResult))
  })

  test.each([
    addressDynamicArray,
    boolDynamicArray,
    uint256DynamicArray,
    ufixednxmDynamicArray,
    stringDynamicArray,
    addressDynamicArrayOfArray,
    boolDynamicArrayOfArray,
    uint256DynamicArrayOfArray,
    uint256DynamicArrayOfStaticArray,
    stringDynamicArrayOfArray,
    stringDynamicArrayOfArrayOfArray,
    tupleDynamicArray,
    structDynamicArray,
  ])('get item from dynamic array', (data) => {
    const dynamicArray = data.array()
    const nativeValues = data.nativeValues()
    for (let i = 0; i < dynamicArray.length; i++) {
      compareARC4AndABIValue(dynamicArray[i], nativeValues[i])
    }
    expect(dynamicArray.length).toEqual(nativeValues.length)
  })

  test.each([
    addressDynamicArray,
    boolDynamicArray,
    uint256DynamicArray,
    ufixednxmDynamicArray,
    stringDynamicArray,
    addressDynamicArrayOfArray,
    boolDynamicArrayOfArray,
    uint256DynamicArrayOfArray,
    uint256DynamicArrayOfStaticArray,
    stringDynamicArrayOfArray,
    stringDynamicArrayOfArrayOfArray,
    tupleDynamicArray,
    structDynamicArray,
  ])('set item in dynamic array', (data) => {
    const nativeValues = data.nativeValues()
    const nativeValuesCopy = [...nativeValues]
    const nativeTemp = nativeValuesCopy.at(-1)!
    nativeValuesCopy[nativeValuesCopy.length - 1] = nativeValuesCopy[0]
    nativeValuesCopy[0] = nativeTemp

    const dynamicArray = data.array()
    const dynamicArrayCopy = dynamicArray.copy()
    const arrayTemp = dynamicArrayCopy.at(-1)
    dynamicArrayCopy[dynamicArrayCopy.length - 1] = dynamicArrayCopy[0]
    dynamicArrayCopy[0] = arrayTemp

    const sdkResult = getABIEncodedValue(nativeValuesCopy, data.abiTypeString, {})
    const result = dynamicArrayCopy.bytes
    expect(result).toEqual(Bytes(sdkResult))
  })

  test.each([
    addressDynamicArray,
    boolDynamicArray,
    uint256DynamicArray,
    ufixednxmDynamicArray,
    stringDynamicArray,
    addressDynamicArrayOfArray,
    boolDynamicArrayOfArray,
    uint256DynamicArrayOfArray,
    uint256DynamicArrayOfStaticArray,
    stringDynamicArrayOfArray,
    stringDynamicArrayOfArrayOfArray,
    tupleDynamicArray,
    structDynamicArray,
  ])('create dynamic array from bytes', (data) => {
    const sdkEncodedBytes = getABIEncodedValue(data.nativeValues(), data.abiTypeString, {})
    const result = data.create(Bytes(sdkEncodedBytes))
    const nativeValues = data.nativeValues()
    for (let i = 0; i < result.length; i++) {
      compareARC4AndABIValue(result[i], nativeValues[i])
    }
  })

  test.each([
    addressDynamicArray,
    boolDynamicArray,
    uint256DynamicArray,
    ufixednxmDynamicArray,
    stringDynamicArray,
    addressDynamicArrayOfArray,
    boolDynamicArrayOfArray,
    uint256DynamicArrayOfArray,
    uint256DynamicArrayOfStaticArray,
    stringDynamicArrayOfArray,
    stringDynamicArrayOfArrayOfArray,
    tupleDynamicArray,
    structDynamicArray,
  ])('push item to dynamic array', (data) => {
    const nativeValues = data.nativeValues()
    const nativeValuesCopy = [...nativeValues]
    nativeValuesCopy.push(nativeValues.at(-1)!)
    nativeValuesCopy.push(nativeValues[0])

    const dynamicArray = data.array()
    const dynamicArrayCopy = dynamicArray.copy()
    dynamicArrayCopy.push(dynamicArray.at(-1) as never, dynamicArray[0] as never)

    const sdkResult = getABIEncodedValue(nativeValuesCopy, data.abiTypeString, {})
    const result = dynamicArrayCopy.bytes
    expect(result).toEqual(Bytes(sdkResult))
  })

  test.each([
    addressDynamicArray,
    boolDynamicArray,
    uint256DynamicArray,
    ufixednxmDynamicArray,
    stringDynamicArray,
    addressDynamicArrayOfArray,
    boolDynamicArrayOfArray,
    uint256DynamicArrayOfArray,
    uint256DynamicArrayOfStaticArray,
    stringDynamicArrayOfArray,
    stringDynamicArrayOfArrayOfArray,
    tupleDynamicArray,
    structDynamicArray,
  ])('push item to empty dynamic array', (data) => {
    const nativeValues = data.nativeValues()
    const sdkResult = getABIEncodedValue(nativeValues, data.abiTypeString, {})

    const emptyArray = data.array(true)
    data.abiValues().forEach((v) => emptyArray.push(v as never))
    expect(emptyArray.length).toEqual(nativeValues.length)
    expect(emptyArray.bytes).toEqual(sdkResult)
  })

  test.each([
    addressDynamicArray,
    boolDynamicArray,
    uint256DynamicArray,
    ufixednxmDynamicArray,
    stringDynamicArray,
    addressDynamicArrayOfArray,
    boolDynamicArrayOfArray,
    uint256DynamicArrayOfArray,
    uint256DynamicArrayOfStaticArray,
    stringDynamicArrayOfArray,
    stringDynamicArrayOfArrayOfArray,
    tupleDynamicArray,
    structDynamicArray,
  ])('push item to empty dynamic array created from bytes', (data) => {
    const nativeValues = data.nativeValues()
    const sdkResult = getABIEncodedValue(nativeValues, data.abiTypeString, {})

    const emptyArray = data.create(Bytes(getABIEncodedValue([], data.abiTypeString, {})))
    data.abiValues().forEach((v) => emptyArray.push(v as never))
    expect(emptyArray.length).toEqual(nativeValues.length)
    expect(emptyArray.bytes).toEqual(sdkResult)
  })

  test.each([
    addressDynamicArray,
    boolDynamicArray,
    uint256DynamicArray,
    ufixednxmDynamicArray,
    stringDynamicArray,
    addressDynamicArrayOfArray,
    boolDynamicArrayOfArray,
    uint256DynamicArrayOfArray,
    uint256DynamicArrayOfStaticArray,
    stringDynamicArrayOfArray,
    stringDynamicArrayOfArrayOfArray,
    tupleDynamicArray,
    structDynamicArray,
  ])('pop item from dynamic array', (data) => {
    const nativeValues = data.nativeValues()
    const nativeValuesCopy = [...nativeValues]
    const nativeValue1 = nativeValuesCopy.pop()
    const nativeValue2 = nativeValuesCopy.pop()

    const dynamicArray = data.array()
    const dynamicArrayCopy = dynamicArray.copy()
    const value1 = dynamicArrayCopy.pop()
    const value2 = dynamicArrayCopy.pop()

    compareARC4AndABIValue(value1, nativeValue1)
    compareARC4AndABIValue(value2, nativeValue2)

    const sdkResult = getABIEncodedValue(nativeValuesCopy, data.abiTypeString, {})
    const result = dynamicArrayCopy.bytes
    expect(result).toEqual(Bytes(sdkResult))
  })

  it('set item in nested dynamic array', () => {
    const data = stringDynamicArrayOfArrayOfArray
    const nativeValues = data.nativeValues()
    nativeValues[0][0][0] = 'new value'

    const dynamicArray = data.array()
    dynamicArray[0][0][0] = new Str('new value')

    const sdkResult = getABIEncodedValue(nativeValues, data.abiTypeString, {})
    const result = dynamicArray.bytes
    expect(result).toEqual(Bytes(sdkResult))
  })

  it('set item in nested dynamic array created from bytes', () => {
    const data = stringDynamicArrayOfArrayOfArray
    const nativeValues = data.nativeValues()
    nativeValues[0][0][0] = 'new value'

    const sdkEncodedBytes = getABIEncodedValue(data.nativeValues(), data.abiTypeString, {})
    const dynamicArray = data.create(Bytes(sdkEncodedBytes))
    dynamicArray[0][0][0] = new Str('new value')

    const sdkResult = getABIEncodedValue(nativeValues, data.abiTypeString, {})
    const result = dynamicArray.bytes
    expect(result).toEqual(Bytes(sdkResult))
  })
})

const compareARC4AndABIValue = (arc4Value: DeliberateAny, nativeValue: DeliberateAny) => {
  if (arc4Value instanceof DynamicArray || arc4Value instanceof StaticArray) {
    for (let i = 0; i < arc4Value.length; i++) {
      compareARC4AndABIValue(arc4Value[i], nativeValue[i])
    }
  } else if (arc4Value instanceof Tuple) {
    const tupleValues = arc4Value.native
    for (let i = 0; i < arc4Value.length; i++) {
      compareARC4AndABIValue(tupleValues[i], nativeValue[i])
    }
  } else if (arc4Value instanceof Struct) {
    const structValues = Object.values(arc4Value.items)
    for (let i = 0; i < structValues.length; i++) {
      compareARC4AndABIValue(structValues[i], nativeValue[i])
    }
  } else if (arc4Value.native !== undefined) {
    if (arc4Value.native instanceof AccountCls) {
      expect(arc4Value.native.bytes).toEqual(nativeValue)
    } else {
      expect(arc4Value.native).toEqual(nativeValue)
    }
  } else {
    expect(arc4Value.bytes).toEqual(encodingUtil.bigIntToUint8Array(arc4Value, arc4Value.bytes.length))
  }
}
