import { getABIEncodedValue } from '@algorandfoundation/algokit-utils/types/app-arc56'
import { Bytes } from '@algorandfoundation/algorand-typescript'
import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { Address, Bool, convertBytes, DynamicArray, StaticArray, Str, Tuple, Uint } from '@algorandfoundation/algorand-typescript/arc4'
import { encodingUtil } from '@algorandfoundation/puya-ts'
import { afterEach, describe, expect, test } from 'vitest'
import type { StubBytesCompat } from '../../src/impl/primitives'
import { AccountCls } from '../../src/impl/reference'
import type { DeliberateAny } from '../../src/typescript-helpers'
import { asBytes, asUint8Array } from '../../src/util'

const nativeString = 'hello'
const nativeNumber = 42
const nativeBool = true
const nativeAddress = asUint8Array(Bytes.fromHex(`${'00'.repeat(31)}ff`))

const otherNativeString = 'hello'
const otherNativeNumber = 42

const abiString = new Str('hello')
const abiUint8 = new Uint<8>(42)
const abiBool = new Bool(true)
const abiAddress = new Address(Bytes.fromHex(`${'00'.repeat(31)}ff`))

const otherAbiString = new Str('hello')
const otherAbiUint8 = new Uint<8>(42)

const testData = [
  {
    abiTypeString: '(bool[10],bool,bool)',
    nativeValues() {
      return [
        [nativeBool, nativeBool, nativeBool, nativeBool, nativeBool, nativeBool, nativeBool, nativeBool, nativeBool, nativeBool],
        nativeBool,
        nativeBool,
      ]
    },
    abiValues() {
      return [
        new StaticArray(abiBool, abiBool, abiBool, abiBool, abiBool, abiBool, abiBool, abiBool, abiBool, abiBool),
        abiBool,
        abiBool,
      ] as readonly [StaticArray<Bool, 10>, Bool, Bool]
    },
    tuple() {
      return new Tuple<[StaticArray<Bool, 10>, Bool, Bool]>(...this.abiValues())
    },
    create(value: StubBytesCompat) {
      return convertBytes<Tuple<[StaticArray<Bool, 10>, Bool, Bool]>>(asBytes(value), { strategy: 'unsafe-cast' })
    },
  },
  {
    abiTypeString: '(uint8,bool,bool,address)',
    nativeValues() {
      return [nativeNumber, nativeBool, nativeBool, nativeAddress]
    },
    abiValues() {
      return [abiUint8, abiBool, abiBool, abiAddress] as readonly [Uint<8>, Bool, Bool, Address]
    },
    tuple() {
      return new Tuple<[Uint<8>, Bool, Bool, Address]>(...this.abiValues())
    },
    create(value: StubBytesCompat) {
      return convertBytes<Tuple<[Uint<8>, Bool, Bool, Address]>>(asBytes(value), { strategy: 'unsafe-cast' })
    },
  },
  {
    abiTypeString: '(string,uint8,bool)',
    nativeValues() {
      return [nativeString, nativeNumber, nativeBool]
    },
    abiValues() {
      return [abiString, abiUint8, abiBool] as readonly [Str, Uint<8>, Bool]
    },
    tuple() {
      return new Tuple<[Str, Uint<8>, Bool]>(...this.abiValues())
    },
    create(value: StubBytesCompat) {
      return convertBytes<Tuple<[Str, Uint<8>, Bool]>>(asBytes(value), { strategy: 'unsafe-cast' })
    },
  },
  {
    abiTypeString: '((uint8,bool,bool),(uint8,bool,bool))',
    nativeValues() {
      return [
        [nativeNumber, nativeBool, nativeBool],
        [nativeNumber, nativeBool, nativeBool],
      ]
    },
    abiValues() {
      return [
        new Tuple<[Uint<8>, Bool, Bool]>(abiUint8, abiBool, abiBool),
        new Tuple<[Uint<8>, Bool, Bool]>(abiUint8, abiBool, abiBool),
      ] as readonly [Tuple<[Uint<8>, Bool, Bool]>, Tuple<[Uint<8>, Bool, Bool]>]
    },
    tuple() {
      return new Tuple<[Tuple<[Uint<8>, Bool, Bool]>, Tuple<[Uint<8>, Bool, Bool]>]>(...this.abiValues())
    },
    create(value: StubBytesCompat) {
      return convertBytes<Tuple<[Tuple<[Uint<8>, Bool, Bool]>, Tuple<[Uint<8>, Bool, Bool]>]>>(asBytes(value), { strategy: 'unsafe-cast' })
    },
  },
  {
    abiTypeString: '(string[],string[],string,uint8,bool,uint8[3])',
    nativeValues() {
      return [
        [nativeString, nativeString],
        [nativeString, nativeString],
        nativeString,
        nativeNumber,
        nativeBool,
        [nativeNumber, nativeNumber, nativeNumber],
      ]
    },
    abiValues() {
      return [
        new DynamicArray(abiString, abiString),
        new DynamicArray(abiString, abiString),
        abiString,
        abiUint8,
        abiBool,
        new StaticArray(abiUint8, abiUint8, abiUint8),
      ] as readonly [DynamicArray<Str>, DynamicArray<Str>, Str, Uint<8>, Bool, StaticArray<Uint<8>, 3>]
    },
    tuple() {
      return new Tuple<[DynamicArray<Str>, DynamicArray<Str>, Str, Uint<8>, Bool, StaticArray<Uint<8>, 3>]>(...this.abiValues())
    },
    create(value: StubBytesCompat) {
      return convertBytes<Tuple<[DynamicArray<Str>, DynamicArray<Str>, Str, Uint<8>, Bool, StaticArray<Uint<8>, 3>]>>(asBytes(value), {
        strategy: 'unsafe-cast',
      })
    },
  },
  {
    abiTypeString: '((bool,string[],string),uint8,uint8[3])',
    nativeValues() {
      return [[nativeBool, [nativeString, nativeString], nativeString], nativeNumber, [nativeNumber, nativeNumber, nativeNumber]]
    },
    abiValues() {
      return [
        new Tuple<[Bool, DynamicArray<Str>, Str]>(abiBool, new DynamicArray(abiString, abiString), abiString),
        abiUint8,
        new StaticArray(abiUint8, abiUint8, abiUint8),
      ] as readonly [Tuple<[Bool, DynamicArray<Str>, Str]>, Uint<8>, StaticArray<Uint<8>, 3>]
    },
    tuple() {
      return new Tuple<[Tuple<[Bool, DynamicArray<Str>, Str]>, Uint<8>, StaticArray<Uint<8>, 3>]>(...this.abiValues())
    },
    create(value: StubBytesCompat) {
      return convertBytes<Tuple<[Tuple<[Bool, DynamicArray<Str>, Str]>, Uint<8>, StaticArray<Uint<8>, 3>]>>(asBytes(value), {
        strategy: 'unsafe-cast',
      })
    },
  },
  {
    abiTypeString: '((bool,string[],string),(uint8,uint8[3]))',
    nativeValues() {
      return [
        [nativeBool, [nativeString, nativeString], nativeString],
        [nativeNumber, [nativeNumber, nativeNumber, nativeNumber]],
      ]
    },
    abiValues() {
      return [
        new Tuple<[Bool, DynamicArray<Str>, Str]>(abiBool, new DynamicArray(abiString, abiString), abiString),
        new Tuple<[Uint<8>, StaticArray<Uint<8>, 3>]>(abiUint8, new StaticArray(abiUint8, abiUint8, abiUint8)),
      ] as readonly [Tuple<[Bool, DynamicArray<Str>, Str]>, Tuple<[Uint<8>, StaticArray<Uint<8>, 3>]>]
    },
    tuple() {
      return new Tuple<[Tuple<[Bool, DynamicArray<Str>, Str]>, Tuple<[Uint<8>, StaticArray<Uint<8>, 3>]>]>(...this.abiValues())
    },
    create(value: StubBytesCompat) {
      return convertBytes<Tuple<[Tuple<[Bool, DynamicArray<Str>, Str]>, Tuple<[Uint<8>, StaticArray<Uint<8>, 3>]>]>>(asBytes(value), {
        strategy: 'unsafe-cast',
      })
    },
  },
  {
    abiTypeString: '((bool,(string[],string,address)),(uint8,uint8[3]))',
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
        new Tuple<[Uint<8>, StaticArray<Uint<8>, 3>]>(abiUint8, new StaticArray(abiUint8, abiUint8, abiUint8)),
      ] as readonly [Tuple<[Bool, Tuple<[DynamicArray<Str>, Str, Address]>]>, Tuple<[Uint<8>, StaticArray<Uint<8>, 3>]>]
    },
    tuple() {
      return new Tuple<[Tuple<[Bool, Tuple<[DynamicArray<Str>, Str, Address]>]>, Tuple<[Uint<8>, StaticArray<Uint<8>, 3>]>]>(
        ...this.abiValues(),
      )
    },
    create(value: StubBytesCompat) {
      return convertBytes<Tuple<[Tuple<[Bool, Tuple<[DynamicArray<Str>, Str, Address]>]>, Tuple<[Uint<8>, StaticArray<Uint<8>, 3>]>]>>(
        asBytes(value),
        { strategy: 'unsafe-cast' },
      )
    },
  },
]

const testDataWithArray = [
  {
    abiTypeString: '(string[],string[],string,uint8,bool,uint8[3])',
    updatedNativeValues() {
      return [
        [otherNativeString, nativeString, otherNativeString],
        [otherNativeString, nativeString, otherNativeString],
        nativeString,
        nativeNumber,
        nativeBool,
        [otherNativeNumber, nativeNumber, otherNativeNumber],
      ]
    },
    abiValues() {
      return [
        new DynamicArray(abiString, abiString),
        new DynamicArray(abiString, abiString),
        abiString,
        abiUint8,
        abiBool,
        new StaticArray(abiUint8, abiUint8, abiUint8),
      ] as readonly [DynamicArray<Str>, DynamicArray<Str>, Str, Uint<8>, Bool, StaticArray<Uint<8>, 3>]
    },
    tuple() {
      return new Tuple<[DynamicArray<Str>, DynamicArray<Str>, Str, Uint<8>, Bool, StaticArray<Uint<8>, 3>]>(...this.abiValues())
    },
    update(value: Tuple<[DynamicArray<Str>, DynamicArray<Str>, Str, Uint<8>, Bool, StaticArray<Uint<8>, 3>]>) {
      value.native[0][0] = otherAbiString
      value.native[0].push(otherAbiString)
      value.native[1][0] = otherAbiString
      value.native[1].push(otherAbiString)
      value.native[5][0] = otherAbiUint8
      value.native[5][2] = otherAbiUint8
    },
  },
  {
    abiTypeString: '((bool,string[],string),uint8,uint8[3])',
    updatedNativeValues() {
      return [
        [nativeBool, [otherNativeString, nativeString, otherNativeString], nativeString],
        nativeNumber,
        [otherNativeNumber, nativeNumber, otherNativeNumber],
      ]
    },
    abiValues() {
      return [
        new Tuple<[Bool, DynamicArray<Str>, Str]>(abiBool, new DynamicArray(abiString, abiString), abiString),
        abiUint8,
        new StaticArray(abiUint8, abiUint8, abiUint8),
      ] as readonly [Tuple<[Bool, DynamicArray<Str>, Str]>, Uint<8>, StaticArray<Uint<8>, 3>]
    },
    tuple() {
      return new Tuple<[Tuple<[Bool, DynamicArray<Str>, Str]>, Uint<8>, StaticArray<Uint<8>, 3>]>(...this.abiValues())
    },
    update(value: Tuple<[Tuple<[Bool, DynamicArray<Str>, Str]>, Uint<8>, StaticArray<Uint<8>, 3>]>) {
      value.native[0].native[1][0] = otherAbiString
      value.native[0].native[1].push(otherAbiString)
      value.native[2][0] = otherAbiUint8
      value.native[2][2] = otherAbiUint8
    },
  },
  {
    abiTypeString: '((bool,string[],string),(uint8,uint8[3]))',
    updatedNativeValues() {
      return [
        [nativeBool, [otherNativeString, nativeString, otherNativeString], nativeString],
        [nativeNumber, [otherNativeNumber, nativeNumber, otherNativeNumber]],
      ]
    },
    abiValues() {
      return [
        new Tuple<[Bool, DynamicArray<Str>, Str]>(abiBool, new DynamicArray(abiString, abiString), abiString),
        new Tuple<[Uint<8>, StaticArray<Uint<8>, 3>]>(abiUint8, new StaticArray(abiUint8, abiUint8, abiUint8)),
      ] as readonly [Tuple<[Bool, DynamicArray<Str>, Str]>, Tuple<[Uint<8>, StaticArray<Uint<8>, 3>]>]
    },
    tuple() {
      return new Tuple<[Tuple<[Bool, DynamicArray<Str>, Str]>, Tuple<[Uint<8>, StaticArray<Uint<8>, 3>]>]>(...this.abiValues())
    },
    update(value: Tuple<[Tuple<[Bool, DynamicArray<Str>, Str]>, Tuple<[Uint<8>, StaticArray<Uint<8>, 3>]>]>) {
      value.native[0].native[1][0] = otherAbiString
      value.native[0].native[1].push(otherAbiString)
      value.native[1].native[1][0] = otherAbiUint8
      value.native[1].native[1][2] = otherAbiUint8
    },
  },
  {
    abiTypeString: '((bool,(string[],string,address)),(uint8,uint8[3]))',
    updatedNativeValues() {
      return [
        [nativeBool, [[otherNativeString, nativeString, otherNativeString], nativeString, nativeAddress]],
        [nativeNumber, [otherNativeNumber, nativeNumber, otherNativeNumber]],
      ]
    },
    abiValues() {
      return [
        new Tuple<[Bool, Tuple<[DynamicArray<Str>, Str, Address]>]>(
          abiBool,
          new Tuple<[DynamicArray<Str>, Str, Address]>(new DynamicArray(abiString, abiString), abiString, abiAddress),
        ),
        new Tuple<[Uint<8>, StaticArray<Uint<8>, 3>]>(abiUint8, new StaticArray(abiUint8, abiUint8, abiUint8)),
      ] as readonly [Tuple<[Bool, Tuple<[DynamicArray<Str>, Str, Address]>]>, Tuple<[Uint<8>, StaticArray<Uint<8>, 3>]>]
    },
    tuple() {
      return new Tuple<[Tuple<[Bool, Tuple<[DynamicArray<Str>, Str, Address]>]>, Tuple<[Uint<8>, StaticArray<Uint<8>, 3>]>]>(
        ...this.abiValues(),
      )
    },
    update(value: Tuple<[Tuple<[Bool, Tuple<[DynamicArray<Str>, Str, Address]>]>, Tuple<[Uint<8>, StaticArray<Uint<8>, 3>]>]>) {
      value.native[0].native[1].native[0][0] = otherAbiString
      value.native[0].native[1].native[0].push(otherAbiString)
      value.native[1].native[1][0] = otherAbiUint8
      value.native[1].native[1][2] = otherAbiUint8
    },
  },
]

describe('arc4.Tuple', () => {
  const ctx = new TestExecutionContext()
  afterEach(() => {
    ctx.reset()
  })

  test.each(testData)('should be able to get bytes representation', (data) => {
    const sdkResult = getABIEncodedValue(data.nativeValues(), data.abiTypeString, {})
    const result = data.tuple().bytes
    expect(result).toEqual(Bytes(sdkResult))
  })

  test.each(testData)('should be able to get native representation', (data) => {
    const nativeValues = data.nativeValues()
    const result = data.tuple().native
    for (let i = 0; i < nativeValues.length; i++) {
      compareARC4AndABIValue(result[i], nativeValues[i])
    }
    expect(result.length).toEqual(nativeValues.length)
  })

  test.each(testData)('create tuple from bytes', (data) => {
    const nativeValues = data.nativeValues()
    const sdkEncodedBytes = getABIEncodedValue(nativeValues, data.abiTypeString, {})

    const result = data.create(Bytes(sdkEncodedBytes))
    const tupleValues = result.native

    for (let i = 0; i < tupleValues.length; i++) {
      compareARC4AndABIValue(tupleValues[i], nativeValues[i])
    }
  })

  test.each(testDataWithArray)('update array values in tuple', (data) => {
    const sdkResult = getABIEncodedValue(data.updatedNativeValues(), data.abiTypeString, {})
    const tuple = data.tuple()
    data.update(tuple as DeliberateAny)
    const result = tuple.bytes
    expect(result).toEqual(Bytes(sdkResult))

    const tupleValues = tuple.native
    const nativeValues = data.updatedNativeValues()
    for (let i = 0; i < tupleValues.length; i++) {
      compareARC4AndABIValue(tupleValues[i], nativeValues[i])
    }
  })
})

const compareARC4AndABIValue = (arc4Value: DeliberateAny, nativeValue: DeliberateAny) => {
  if (arc4Value instanceof DynamicArray || arc4Value instanceof StaticArray) {
    for (let i = 0; i < arc4Value.length; i++) {
      compareARC4AndABIValue(arc4Value[i], nativeValue[i])
    }
  } else if (arc4Value instanceof Tuple) {
    for (let i = 0; i < arc4Value.length; i++) {
      compareARC4AndABIValue(arc4Value.at(i), nativeValue[i])
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
