import { getABIEncodedValue } from '@algorandfoundation/algokit-utils/types/app-arc56'
import { Bytes, clone } from '@algorandfoundation/algorand-typescript'
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
  UFixed,
  Uint,
} from '@algorandfoundation/algorand-typescript/arc4'
import { encodingUtil } from '@algorandfoundation/puya-ts'
import { afterEach, describe, expect, it, test } from 'vitest'
import type { StubBytesCompat } from '../../src/impl/primitives'
import { AccountCls } from '../../src/impl/reference'
import type { DeliberateAny } from '../../src/typescript-helpers'
import { asBigUint, asBytes, asUint8Array } from '../../src/util'

const addressStaticArray = {
  abiTypeString: 'address[10]',
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
  array() {
    return new StaticArray<Address, 10>(...(this.abiValues() as []))
  },
  create(value: StubBytesCompat) {
    return interpretAsArc4<StaticArray<Address, 10>>(asBytes(value))
  },
  concat() {
    return this.array().concat(this.array())
  },
  concatABIValue() {
    return getABIEncodedValue([...this.nativeValues(), ...this.nativeValues()], 'address[]', {})
  },
  clone(original: StaticArray<Address, 10>) {
    return clone(original)
  },
}

const boolStaticArray = {
  abiTypeString: 'bool[10]',
  nativeValues() {
    return [true, true, false, true, false, true, true, false, true, false]
  },
  abiValues() {
    return this.nativeValues().map((v) => new Bool(v))
  },
  array() {
    return new StaticArray<Bool, 10>(...(this.abiValues() as []))
  },
  create(value: StubBytesCompat) {
    return interpretAsArc4<StaticArray<Bool, 10>>(asBytes(value))
  },
  concat() {
    return this.array().concat(this.array())
  },
  concatABIValue() {
    return getABIEncodedValue([...this.nativeValues(), ...this.nativeValues()], 'bool[]', {})
  },
  clone(original: StaticArray<Bool, 10>) {
    return clone(original)
  },
}

const uint256StaticArray = {
  abiTypeString: 'uint256[10]',
  nativeValues() {
    return [0n, 1n, 2n, 3n, 2n ** 8n, 2n ** 16n, 2n ** 32n, 2n ** 64n, 2n ** 128n, 2n ** 256n - 1n]
  },
  abiValues() {
    return this.nativeValues().map((v) => new Uint<256>(v))
  },
  array() {
    return new StaticArray<Uint<256>, 10>(...(this.abiValues() as []))
  },
  create(value: StubBytesCompat) {
    return interpretAsArc4<StaticArray<Uint<256>, 10>>(asBytes(value))
  },
  concat() {
    return this.array().concat(this.array())
  },
  concatABIValue() {
    return getABIEncodedValue([...this.nativeValues(), ...this.nativeValues()], 'uint256[]', {})
  },
  clone(original: StaticArray<Uint<256>, 10>) {
    return clone(original)
  },
}

const ufixedStaticArray = {
  abiTypeString: 'ufixed256x16[10]',
  nativeValues() {
    return this.abiValues().map((v) => asBigUint(v.bytes).valueOf())
  },
  abiValues() {
    return [
      new UFixed<256, 16>('0.0'),
      new UFixed<256, 16>('1.0'),
      new UFixed<256, 16>('2.0'),
      new UFixed<256, 16>('3.0'),
      new UFixed<256, 16>('255.0'),
      new UFixed<256, 16>('65536.0'),
      new UFixed<256, 16>('4294967295.0'),
      new UFixed<256, 16>('1844.6744073709551616'),
      new UFixed<256, 16>('340282366920938463463374.607431768211456'),
      new UFixed<256, 16>('11579208923731619542357098500868790785326998466564056403945758.4007913129639935'),
    ]
  },
  array() {
    return new StaticArray<UFixed<256, 16>, 10>(...(this.abiValues() as []))
  },
  create(value: StubBytesCompat) {
    return interpretAsArc4<StaticArray<UFixed<256, 16>, 10>>(asBytes(value))
  },
  concat() {
    return this.array().concat(this.array())
  },
  concatABIValue() {
    return getABIEncodedValue([...this.nativeValues(), ...this.nativeValues()], 'ufixed256x16[]', {})
  },
  clone(original: StaticArray<UFixed<256, 16>, 10>) {
    return clone(original)
  },
}

const stringStaticArray = {
  abiTypeString: 'string[10]',
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
  array() {
    return new StaticArray<Str, 10>(...(this.abiValues() as []))
  },
  create(value: StubBytesCompat) {
    return interpretAsArc4<StaticArray<Str, 10>>(asBytes(value))
  },
  concat() {
    return this.array().concat(this.array())
  },
  concatABIValue() {
    return getABIEncodedValue([...this.nativeValues(), ...this.nativeValues()], 'string[]', {})
  },
  clone(original: StaticArray<Str, 10>) {
    return clone(original)
  },
}

const addressStaticArrayOfArray = {
  abiTypeString: 'address[10][2]',
  nativeValues() {
    return [addressStaticArray.nativeValues(), addressStaticArray.nativeValues().reverse()]
  },
  abiValues() {
    return this.nativeValues().map((a) => new StaticArray<Address, 10>(...(a.map((v) => new Address(Bytes(v))) as [])))
  },
  array() {
    return new StaticArray<StaticArray<Address, 10>, 2>(
      ...(this.abiValues().map((a) => new StaticArray<Address, 10>(...(a as DeliberateAny))) as []),
    )
  },
  create(value: StubBytesCompat) {
    return interpretAsArc4<StaticArray<StaticArray<Address, 10>, 2>>(asBytes(value))
  },
  concat() {
    return this.array().concat(this.array())
  },
  concatABIValue() {
    return getABIEncodedValue([...this.nativeValues(), ...this.nativeValues()], 'address[10][]', {})
  },
  clone(original: StaticArray<StaticArray<Address, 10>, 2>) {
    return clone(original)
  },
}

const boolStaticArrayOfArray = {
  abiTypeString: 'bool[10][2]',
  nativeValues() {
    return [boolStaticArray.nativeValues(), boolStaticArray.nativeValues().reverse()]
  },
  abiValues() {
    return this.nativeValues().map((a) => new StaticArray<Bool, 10>(...(a.map((v) => new Bool(v)) as [])))
  },
  array() {
    return new StaticArray<StaticArray<Bool, 10>, 2>(
      ...(this.abiValues().map((a) => new StaticArray<Bool, 10>(...(a as DeliberateAny))) as []),
    )
  },
  create(value: StubBytesCompat) {
    return interpretAsArc4<StaticArray<StaticArray<Bool, 10>, 2>>(asBytes(value))
  },
  concat() {
    return this.array().concat(this.array())
  },
  concatABIValue() {
    return getABIEncodedValue([...this.nativeValues(), ...this.nativeValues()], 'bool[10][]', {})
  },
  clone(original: StaticArray<StaticArray<Bool, 10>, 2>) {
    return clone(original)
  },
}

const uint256StaticArrayOfArray = {
  abiTypeString: 'uint256[10][2]',
  nativeValues() {
    return [uint256StaticArray.nativeValues(), uint256StaticArray.nativeValues().reverse()]
  },
  abiValues() {
    return this.nativeValues().map((a) => new StaticArray<Uint<256>, 10>(...(a.map((v) => new Uint<256>(v)) as [])))
  },
  array() {
    return new StaticArray<StaticArray<Uint<256>, 10>, 2>(
      ...(this.abiValues().map((a) => new StaticArray<Uint<256>, 10>(...(a as DeliberateAny))) as []),
    )
  },
  create(value: StubBytesCompat) {
    return interpretAsArc4<StaticArray<StaticArray<Uint<256>, 10>, 2>>(asBytes(value))
  },
  concat() {
    return this.array().concat(this.array())
  },
  concatABIValue() {
    return getABIEncodedValue([...this.nativeValues(), ...this.nativeValues()], 'uint256[10][]', {})
  },
  clone(original: StaticArray<StaticArray<Uint<256>, 10>, 2>) {
    return clone(original)
  },
}

const uint256StaticArrayOfDynamicArray = {
  abiTypeString: 'uint256[][2]',
  nativeValues() {
    return [uint256StaticArray.nativeValues(), uint256StaticArray.nativeValues().reverse()]
  },
  abiValues() {
    return this.nativeValues().map((a) => new DynamicArray<Uint<256>>(...a.map((v) => new Uint<256>(v))))
  },
  array() {
    return new StaticArray<DynamicArray<Uint<256>>, 2>(...(this.abiValues().map((a) => new DynamicArray<Uint<256>>(...a)) as []))
  },
  create(value: StubBytesCompat) {
    return interpretAsArc4<StaticArray<DynamicArray<Uint<256>>, 2>>(asBytes(value))
  },
  concat() {
    return this.array().concat(this.array())
  },
  concatABIValue() {
    return getABIEncodedValue([...this.nativeValues(), ...this.nativeValues()], 'uint256[][]', {})
  },
  clone(original: StaticArray<DynamicArray<Uint<256>>, 2>) {
    return clone(original)
  },
}

const stringStaticArrayOfArray = {
  abiTypeString: 'string[10][2]',
  nativeValues() {
    return [stringStaticArray.nativeValues(), stringStaticArray.nativeValues().reverse()]
  },
  abiValues() {
    return this.nativeValues().map((a) => new StaticArray<Str, 10>(...(a.map((v) => new Str(v)) as [])))
  },
  array() {
    return new StaticArray<StaticArray<Str, 10>, 2>(
      ...(this.abiValues().map((a) => new StaticArray<Str, 10>(...(a as DeliberateAny))) as []),
    )
  },
  create(value: StubBytesCompat) {
    return interpretAsArc4<StaticArray<StaticArray<Str, 10>, 2>>(asBytes(value))
  },
  concat() {
    return this.array().concat(this.array())
  },
  concatABIValue() {
    return getABIEncodedValue([...this.nativeValues(), ...this.nativeValues()], 'string[10][]', {})
  },
  clone(original: StaticArray<StaticArray<Str, 10>, 2>) {
    return clone(original)
  },
}

const stringStaticArrayOfArrayOfArray = {
  abiTypeString: 'string[10][3][2]',
  nativeValues() {
    return [
      [stringStaticArray.nativeValues(), stringStaticArray.nativeValues().reverse(), stringStaticArray.nativeValues()],
      [stringStaticArray.nativeValues().reverse(), stringStaticArray.nativeValues(), stringStaticArray.nativeValues().reverse()],
    ]
  },
  abiValues() {
    return this.nativeValues().map(
      (x) =>
        new StaticArray<StaticArray<Str, 10>, 3>(...(x.map((y) => new StaticArray<Str, 10>(...(y.map((v) => new Str(v)) as []))) as [])),
    )
  },
  array() {
    return new StaticArray<StaticArray<StaticArray<Str, 10>, 3>, 2>(
      ...(this.abiValues().map((x) => new StaticArray<StaticArray<Str, 10>, 3>(...(x as DeliberateAny))) as []),
    )
  },
  create(value: StubBytesCompat) {
    return interpretAsArc4<StaticArray<StaticArray<StaticArray<Str, 10>, 3>, 2>>(asBytes(value))
  },
  concat() {
    return this.array().concat(this.array())
  },
  concatABIValue() {
    return getABIEncodedValue([...this.nativeValues(), ...this.nativeValues()], 'string[10][3][]', {})
  },
  clone(original: StaticArray<StaticArray<StaticArray<Str, 10>, 3>, 2>) {
    return clone(original)
  },
}

const tupleStaticArray = {
  abiTypeString: '(string[],(string[],string,uint256,address),bool,uint256[3])[2]',
  nativeValues() {
    return Array(2).fill([
      stringStaticArray.nativeValues().slice(0, 2),
      [
        stringStaticArray.nativeValues().slice(6, 8),
        stringStaticArray.nativeValues()[9],
        uint256StaticArray.nativeValues()[4],
        addressStaticArray.nativeValues()[5],
      ],
      boolStaticArray.nativeValues()[3],
      uint256StaticArray.nativeValues().slice(4, 7),
    ])
  },
  abiValues() {
    return Array(2).fill(
      new Tuple(
        ...[
          new DynamicArray<Str>(...stringStaticArray.abiValues().slice(0, 2)),
          new Tuple<[DynamicArray<Str>, Str, Uint<256>, Address]>(
            new DynamicArray<Str>(...stringStaticArray.abiValues().slice(6, 8)),
            stringStaticArray.abiValues()[9],
            uint256StaticArray.abiValues()[4],
            addressStaticArray.abiValues()[5],
          ),
          boolStaticArray.abiValues()[3],
          new StaticArray<Uint<256>, 3>(...(uint256StaticArray.abiValues().slice(4, 7) as [])),
        ],
      ),
    )
  },
  array() {
    return new StaticArray<
      Tuple<[DynamicArray<Str>, Tuple<[DynamicArray<Str>, Str, Uint<256>, Address]>, Bool, StaticArray<Uint<256>, 3>]>,
      2
    >(...(this.abiValues() as []))
  },
  create(value: StubBytesCompat) {
    return interpretAsArc4<
      StaticArray<Tuple<[DynamicArray<Str>, Tuple<[DynamicArray<Str>, Str, Uint<256>, Address]>, Bool, StaticArray<Uint<256>, 3>]>, 2>
    >(asBytes(value))
  },
  concat() {
    return this.array().concat(this.array())
  },
  concatABIValue() {
    return getABIEncodedValue(
      [...this.nativeValues(), ...this.nativeValues()],
      '(string[],(string[],string,uint256,address),bool,uint256[3])[]',
      {},
    )
  },
  clone(
    original: StaticArray<
      Tuple<[DynamicArray<Str>, Tuple<[DynamicArray<Str>, Str, Uint<256>, Address]>, Bool, StaticArray<Uint<256>, 3>]>,
      2
    >,
  ) {
    return clone(original)
  },
}

class Swapped extends Struct<{
  b: Uint<256>
  c: Bool
  d: Str
  a: Tuple<readonly [DynamicArray<Str>, DynamicArray<Str>, Str, Uint<256>, Bool, StaticArray<Uint<256>, 3>]>
}> {}
const structStaticArray = {
  abiTypeString: '(uint256,bool,string,(string[],string[],string,uint256,bool,uint256[3]))[2]',
  nativeValues() {
    return Array(2).fill([
      uint256StaticArray.nativeValues()[0],
      boolStaticArray.nativeValues()[1],
      stringStaticArray.nativeValues()[2],
      [
        [stringStaticArray.nativeValues()[3], stringStaticArray.nativeValues()[4]],
        [stringStaticArray.nativeValues()[5], stringStaticArray.nativeValues()[6]],
        stringStaticArray.nativeValues()[7],
        uint256StaticArray.nativeValues()[1],
        boolStaticArray.nativeValues()[2],
        [uint256StaticArray.nativeValues()[2], uint256StaticArray.nativeValues()[3], uint256StaticArray.nativeValues()[4]],
      ],
    ])
  },
  abiValues() {
    return Array(2).fill(
      new Swapped({
        b: uint256StaticArray.abiValues()[0],
        c: boolStaticArray.abiValues()[1],
        d: stringStaticArray.abiValues()[2],
        a: new Tuple(
          new DynamicArray<Str>(stringStaticArray.abiValues()[3], stringStaticArray.abiValues()[4]),
          new DynamicArray<Str>(stringStaticArray.abiValues()[5], stringStaticArray.abiValues()[6]),
          stringStaticArray.abiValues()[7],
          uint256StaticArray.abiValues()[1],
          boolStaticArray.abiValues()[2],
          new StaticArray<Uint<256>, 3>(
            uint256StaticArray.abiValues()[2],
            uint256StaticArray.abiValues()[3],
            uint256StaticArray.abiValues()[4],
          ),
        ),
      }),
    )
  },
  array() {
    return new StaticArray<Swapped, 2>(...(this.abiValues() as []))
  },
  create(value: StubBytesCompat) {
    return interpretAsArc4<StaticArray<Swapped, 2>>(asBytes(value))
  },
  concat() {
    return this.array().concat(this.array())
  },
  concatABIValue() {
    return getABIEncodedValue(
      [...this.nativeValues(), ...this.nativeValues()],
      '(uint256,bool,string,(string[],string[],string,uint256,bool,uint256[3]))[]',
      {},
    )
  },
  clone(original: StaticArray<Swapped, 2>) {
    return clone(original)
  },
}

describe('arc4.StaticArray', () => {
  const ctx = new TestExecutionContext()
  afterEach(() => {
    ctx.reset()
  })

  test.each([
    addressStaticArray,
    boolStaticArray,
    uint256StaticArray,
    ufixedStaticArray,
    stringStaticArray,
    addressStaticArrayOfArray,
    boolStaticArrayOfArray,
    uint256StaticArrayOfArray,
    uint256StaticArrayOfDynamicArray,
    stringStaticArrayOfArray,
    stringStaticArrayOfArrayOfArray,
    tupleStaticArray,
    structStaticArray,
  ])('should be able to get bytes representation', (data) => {
    const sdkResult = getABIEncodedValue(data.nativeValues(), data.abiTypeString, {})
    const result = data.array().bytes
    expect(result).toEqual(Bytes(sdkResult))
  })

  test.each([
    addressStaticArray,
    boolStaticArray,
    uint256StaticArray,
    ufixedStaticArray,
    stringStaticArray,
    addressStaticArrayOfArray,
    boolStaticArrayOfArray,
    uint256StaticArrayOfArray,
    uint256StaticArrayOfDynamicArray,
    stringStaticArrayOfArray,
    stringStaticArrayOfArrayOfArray,
    tupleStaticArray,
    structStaticArray,
  ])('copy static array', (data) => {
    const sdkResult = getABIEncodedValue(data.nativeValues(), data.abiTypeString, {})
    const original = data.array()
    const copy = data.clone(original as DeliberateAny)
    const result = copy.bytes
    expect(copy.length).toEqual(original.length)
    expect(result).toEqual(sdkResult)
  })

  test.each([
    addressStaticArray,
    boolStaticArray,
    uint256StaticArray,
    ufixedStaticArray,
    stringStaticArray,
    addressStaticArrayOfArray,
    boolStaticArrayOfArray,
    uint256StaticArrayOfArray,
    uint256StaticArrayOfDynamicArray,
    stringStaticArrayOfArray,
    stringStaticArrayOfArrayOfArray,
    tupleStaticArray,
    structStaticArray,
  ])('concat static array', (data) => {
    const sdkResult = data.concatABIValue()
    const original = data.array()
    const concatenated = data.concat()
    const result = concatenated.bytes

    expect(concatenated.length).toEqual(original.length * 2)
    expect(result).toEqual(asBytes(sdkResult))
  })

  test.each([
    addressStaticArray,
    boolStaticArray,
    uint256StaticArray,
    ufixedStaticArray,
    stringStaticArray,
    addressStaticArrayOfArray,
    boolStaticArrayOfArray,
    uint256StaticArrayOfArray,
    uint256StaticArrayOfDynamicArray,
    stringStaticArrayOfArray,
    stringStaticArrayOfArrayOfArray,
    tupleStaticArray,
    structStaticArray,
  ])('get item from static array', (data) => {
    const staticArray = data.array()
    const nativeValues = data.nativeValues()
    for (let i = 0; i < staticArray.length; i++) {
      compareARC4AndABIValue(staticArray[i], nativeValues[i])
    }
    expect(staticArray.length).toEqual(nativeValues.length)
  })

  test.each([
    addressStaticArray,
    boolStaticArray,
    uint256StaticArray,
    ufixedStaticArray,
    stringStaticArray,
    addressStaticArrayOfArray,
    boolStaticArrayOfArray,
    uint256StaticArrayOfArray,
    uint256StaticArrayOfDynamicArray,
    stringStaticArrayOfArray,
    stringStaticArrayOfArrayOfArray,
    tupleStaticArray,
    structStaticArray,
  ])('set item in static array', (data) => {
    const nativeValues = data.nativeValues()
    const nativeValuesCopy = [...nativeValues]
    const nativeTemp = nativeValuesCopy.at(-1)!
    nativeValuesCopy[nativeValuesCopy.length - 1] = nativeValuesCopy[0]
    nativeValuesCopy[0] = nativeTemp

    const staticArray = data.array()
    const staticArrayCopy = data.clone(staticArray as DeliberateAny)
    const arrayTemp = staticArrayCopy.at(-1)
    staticArrayCopy[staticArrayCopy.length - 1] = staticArrayCopy[0]
    staticArrayCopy[0] = arrayTemp

    const sdkResult = getABIEncodedValue(nativeValuesCopy, data.abiTypeString, {})
    const result = staticArrayCopy.bytes
    expect(result).toEqual(Bytes(sdkResult))
  })

  test.each([
    addressStaticArray,
    boolStaticArray,
    uint256StaticArray,
    ufixedStaticArray,
    stringStaticArray,
    addressStaticArrayOfArray,
    boolStaticArrayOfArray,
    uint256StaticArrayOfArray,
    uint256StaticArrayOfDynamicArray,
    stringStaticArrayOfArray,
    stringStaticArrayOfArrayOfArray,
    tupleStaticArray,
    structStaticArray,
  ])('create static array from bytes', (data) => {
    const sdkEncodedBytes = getABIEncodedValue(data.nativeValues(), data.abiTypeString, {})
    const result = data.create(Bytes(sdkEncodedBytes))
    const nativeValues = data.nativeValues()
    for (let i = 0; i < result.length; i++) {
      compareARC4AndABIValue(result[i], nativeValues[i])
    }
  })

  test.each([
    addressStaticArray,
    boolStaticArray,
    uint256StaticArray,
    ufixedStaticArray,
    stringStaticArray,
    addressStaticArrayOfArray,
    boolStaticArrayOfArray,
    uint256StaticArrayOfArray,
    uint256StaticArrayOfDynamicArray,
    stringStaticArrayOfArray,
    stringStaticArrayOfArrayOfArray,
    tupleStaticArray,
    structStaticArray,
  ])('get item from static array created from bytes', (data) => {
    const nativeValues = data.nativeValues()
    const sdkEncodedBytes = getABIEncodedValue(data.nativeValues(), data.abiTypeString, {})
    const staticArray = data.create(Bytes(sdkEncodedBytes))
    for (let i = 0; i < staticArray.length; i++) {
      compareARC4AndABIValue(staticArray[i], nativeValues[i])
    }
    expect(staticArray.length).toEqual(nativeValues.length)
  })

  test.each([
    addressStaticArray,
    boolStaticArray,
    uint256StaticArray,
    ufixedStaticArray,
    stringStaticArray,
    addressStaticArrayOfArray,
    boolStaticArrayOfArray,
    uint256StaticArrayOfArray,
    uint256StaticArrayOfDynamicArray,
    stringStaticArrayOfArray,
    stringStaticArrayOfArrayOfArray,
    tupleStaticArray,
    structStaticArray,
  ])('set item in static array created from bytes', (data) => {
    const nativeValues = data.nativeValues()
    const nativeValuesCopy = [...nativeValues]
    const nativeTemp = nativeValuesCopy.at(-1)!
    nativeValuesCopy[nativeValuesCopy.length - 1] = nativeValuesCopy[0]
    nativeValuesCopy[0] = nativeTemp

    const sdkEncodedBytes = getABIEncodedValue(data.nativeValues(), data.abiTypeString, {})
    const staticArray = data.create(Bytes(sdkEncodedBytes))
    const staticArrayCopy = data.clone(staticArray as DeliberateAny)
    const arrayTemp = staticArrayCopy.at(-1)
    staticArrayCopy[staticArrayCopy.length - 1] = staticArrayCopy[0]
    staticArrayCopy[0] = arrayTemp

    const sdkResult = getABIEncodedValue(nativeValuesCopy, data.abiTypeString, {})
    const result = staticArrayCopy.bytes
    expect(result).toEqual(Bytes(sdkResult))
  })

  it('set item in nested static array', () => {
    const data = stringStaticArrayOfArrayOfArray
    const nativeValues = data.nativeValues()
    nativeValues[0][0][0] = 'new value'

    const staticArray = data.array()
    staticArray[0][0][0] = new Str('new value')

    const sdkResult = getABIEncodedValue(nativeValues, data.abiTypeString, {})
    const result = staticArray.bytes
    expect(result).toEqual(Bytes(sdkResult))
  })

  it('set item in nested static array create from bytes', () => {
    const data = stringStaticArrayOfArrayOfArray
    const nativeValues = data.nativeValues()
    nativeValues[0][0][0] = 'new value'

    const sdkEncodedBytes = getABIEncodedValue(data.nativeValues(), data.abiTypeString, {})
    const staticArray = data.create(Bytes(sdkEncodedBytes))
    staticArray[0][0][0] = new Str('new value')

    const sdkResult = getABIEncodedValue(nativeValues, data.abiTypeString, {})
    const result = staticArray.bytes
    expect(result).toEqual(Bytes(sdkResult))
  })
})

const compareARC4AndABIValue = (arc4Value: DeliberateAny, nativeValue: DeliberateAny) => {
  if (arc4Value instanceof StaticArray || arc4Value instanceof DynamicArray) {
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
