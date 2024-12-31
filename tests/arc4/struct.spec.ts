import { getABIEncodedValue } from '@algorandfoundation/algokit-utils/types/app-arc56'
import { Bytes, internal } from '@algorandfoundation/algorand-typescript'
import { Bool, DynamicArray, interpretAsArc4, StaticArray, Str, Struct, Tuple, UintN } from '@algorandfoundation/algorand-typescript/arc4'
import { encodingUtil } from '@algorandfoundation/puya-ts'
import { describe, expect, it, test } from 'vitest'
import { AccountCls } from '../../src/impl/reference'
import { DeliberateAny } from '../../src/typescript-helpers'
import { asBytes } from '../../src/util'

const nativeString = 'hello'
const nativeNumber = 42
const nativeBool = true

const abiString = new Str('hello')
const abiUint64 = new UintN<64>(42)
const abiBool = new Bool(true)

class Swapped1 extends Struct<{
  b: UintN<64>
  c: Bool
  d: Str
  a: Tuple<[UintN<64>, Bool, Bool]>
}> {}

class Swapped2 extends Struct<{
  b: UintN<64>
  c: Bool
  d: Str
  a: Tuple<[Tuple<[UintN<64>, Bool, Bool]>, Tuple<[UintN<64>, Bool, Bool]>]>
}> {}

class Swapped3 extends Struct<{
  b: UintN<64>
  c: Bool
  d: Str
  a: Tuple<[DynamicArray<Str>, DynamicArray<Str>, Str, UintN<64>, Bool, StaticArray<UintN<64>, 3>]>
}> {}

class Swapped4 extends Struct<{
  b: UintN<64>
  c: Bool
  d: Str
  a: Tuple<[Tuple<[Bool, DynamicArray<Str>, Str]>, UintN<64>, StaticArray<UintN<64>, 3>]>
}> {}

class Swapped5 extends Struct<{
  b: UintN<64>
  c: Bool
  d: Str
  a: Tuple<[Tuple<[Bool, DynamicArray<Str>, Str]>, Tuple<[UintN<64>, StaticArray<UintN<64>, 3>]>]>
}> {}

class Swapped6 extends Struct<{
  b: UintN<64>
  c: Bool
  d: Str
  a: Tuple<[Tuple<[Bool, Tuple<[DynamicArray<Str>, Str]>]>, Tuple<[UintN<64>, StaticArray<UintN<64>, 3>]>]>
}> {}

const testData = [
  {
    abiTypeString: '(uint64,bool,string,(uint64,bool,bool))',
    nativeValues() {
      return [nativeNumber, nativeBool, nativeString, [nativeNumber, nativeBool, nativeBool]]
    },
    abiValues() {
      return { b: abiUint64, c: abiBool, d: abiString, a: new Tuple(abiUint64, abiBool, abiBool) } as Swapped1
    },
    struct() {
      return new Swapped1(this.abiValues())
    },
    create(value: internal.primitives.StubBytesCompat) {
      return interpretAsArc4<Swapped1>(asBytes(value))
    },
  },
  {
    abiTypeString: '(uint64,bool,string,((uint64,bool,bool),(uint64,bool,bool)))',
    nativeValues() {
      return [
        nativeNumber,
        nativeBool,
        nativeString,
        [
          [nativeNumber, nativeBool, nativeBool],
          [nativeNumber, nativeBool, nativeBool],
        ],
      ]
    },
    abiValues() {
      return {
        b: abiUint64,
        c: abiBool,
        d: abiString,
        a: new Tuple(new Tuple(abiUint64, abiBool, abiBool), new Tuple(abiUint64, abiBool, abiBool)),
      } as Swapped2
    },
    struct() {
      return new Swapped2(this.abiValues())
    },
    create(value: internal.primitives.StubBytesCompat) {
      return interpretAsArc4<Swapped2>(asBytes(value))
    },
  },
  {
    abiTypeString: '(uint64,bool,string,(string[],string[],string,uint64,bool,uint64[3]))',
    nativeValues() {
      return [
        nativeNumber,
        nativeBool,
        nativeString,
        [
          [nativeString, nativeString],
          [nativeString, nativeString],
          nativeString,
          nativeNumber,
          nativeBool,
          [nativeNumber, nativeNumber, nativeNumber],
        ],
      ]
    },
    abiValues() {
      return {
        b: abiUint64,
        c: abiBool,
        d: abiString,
        a: new Tuple(
          new DynamicArray<Str>(abiString, abiString),
          new DynamicArray<Str>(abiString, abiString),
          abiString,
          abiUint64,
          abiBool,
          new StaticArray<UintN<64>, 3>(abiUint64, abiUint64, abiUint64),
        ),
      } as Swapped3
    },
    struct() {
      return new Swapped3(this.abiValues())
    },
    create(value: internal.primitives.StubBytesCompat) {
      return interpretAsArc4<Swapped3>(asBytes(value))
    },
  },
  {
    abiTypeString: '(uint64,bool,string,((bool,string[],string),uint64,uint64[3]))',
    nativeValues() {
      return [
        nativeNumber,
        nativeBool,
        nativeString,
        [[nativeBool, [nativeString, nativeString], nativeString], nativeNumber, [nativeNumber, nativeNumber, nativeNumber]],
      ]
    },
    abiValues() {
      return {
        b: abiUint64,
        c: abiBool,
        d: abiString,
        a: new Tuple(
          new Tuple(abiBool, new DynamicArray<Str>(abiString, abiString), abiString),
          abiUint64,
          new StaticArray<UintN<64>, 3>(abiUint64, abiUint64, abiUint64),
        ),
      } as Swapped4
    },
    struct() {
      return new Swapped4(this.abiValues())
    },
    create(value: internal.primitives.StubBytesCompat) {
      return interpretAsArc4<Swapped4>(asBytes(value))
    },
  },
  {
    abiTypeString: '(uint64,bool,string,((bool,string[],string),(uint64,uint64[3])))',
    nativeValues() {
      return [
        nativeNumber,
        nativeBool,
        nativeString,
        [
          [nativeBool, [nativeString, nativeString], nativeString],
          [nativeNumber, [nativeNumber, nativeNumber, nativeNumber]],
        ],
      ]
    },
    abiValues() {
      return {
        b: abiUint64,
        c: abiBool,
        d: abiString,
        a: new Tuple(
          new Tuple(abiBool, new DynamicArray<Str>(abiString, abiString), abiString),
          new Tuple(abiUint64, new StaticArray<UintN<64>, 3>(abiUint64, abiUint64, abiUint64)),
        ),
      } as Swapped5
    },
    struct() {
      return new Swapped5(this.abiValues())
    },
    create(value: internal.primitives.StubBytesCompat) {
      return interpretAsArc4<Swapped5>(asBytes(value))
    },
  },
  {
    abiTypeString: '(uint64,bool,string,((bool,(string[],string)),(uint64,uint64[3])))',
    nativeValues() {
      return [
        nativeNumber,
        nativeBool,
        nativeString,
        [
          [nativeBool, [[nativeString, nativeString], nativeString]],
          [nativeNumber, [nativeNumber, nativeNumber, nativeNumber]],
        ],
      ]
    },
    abiValues() {
      return {
        b: abiUint64,
        c: abiBool,
        d: abiString,
        a: new Tuple(
          new Tuple(abiBool, new Tuple(new DynamicArray<Str>(abiString, abiString), abiString)),
          new Tuple(abiUint64, new StaticArray<UintN<64>, 3>(abiUint64, abiUint64, abiUint64)),
        ),
      } as Swapped6
    },
    struct() {
      return new Swapped6(this.abiValues())
    },
    create(value: internal.primitives.StubBytesCompat) {
      return interpretAsArc4<Swapped6>(asBytes(value))
    },
  },
]

describe('arc4.Struct', async () => {
  test.each(testData)('should be able to get bytes representation', async (data) => {
    const sdkResult = getABIEncodedValue(data.nativeValues(), data.abiTypeString, {})
    const result = data.struct()
    expect(result.bytes).toEqual(sdkResult)
  })

  test.each(testData)('create struct from bytes', async (data) => {
    const nativeValues = data.nativeValues()
    const sdkResult = getABIEncodedValue(nativeValues, data.abiTypeString, {})
    const result = data.create(Bytes(sdkResult))

    let i = 0
    compareARC4AndABIValue(result.b, nativeValues[i++])
    compareARC4AndABIValue(result.c, nativeValues[i++])
    compareARC4AndABIValue(result.d, nativeValues[i++])
    compareARC4AndABIValue(result.a, nativeValues[i++])
  })

  it('set item in struct', async () => {
    const data = testData[5]
    const nativeValues = data.nativeValues() as DeliberateAny
    nativeValues[0] = 43
    nativeValues[2] = 'world'
    nativeValues[3][0][1][0][1] = 'hello, world'
    nativeValues[3][0][1][0].push('test')
    nativeValues[3][1][1][0] = 24
    const sdkResult = getABIEncodedValue(nativeValues, data.abiTypeString, {})

    const abiValues = data.struct() as Swapped6
    abiValues.b = new UintN<64>(43)
    abiValues.d = new Str('world')
    abiValues.a.at(0).at(1).at(0)[1] = new Str('hello, world')
    abiValues.a.at(0).at(1).at(0).push(new Str('test'))
    abiValues.a.at(1).at(1)[0] = new UintN<64>(24)
    const result = abiValues.bytes

    expect(result).toEqual(Bytes(sdkResult))
  })

  it('set item in struct created from bytes', async () => {
    const data = testData[5]
    const nativeValues = data.nativeValues() as DeliberateAny
    nativeValues[0] = 43
    nativeValues[2] = 'world'
    nativeValues[3][0][1][0][1] = 'hello, world'
    nativeValues[3][0][1][0].push('test')
    nativeValues[3][1][1][0] = 24
    const sdkResult = getABIEncodedValue(nativeValues, data.abiTypeString, {})

    const bytes = Bytes(getABIEncodedValue(data.nativeValues(), data.abiTypeString, {}))
    const abiValues = data.create(bytes) as Swapped6
    abiValues.b = new UintN<64>(43)
    abiValues.d = new Str('world')
    abiValues.a.at(0).at(1).at(0)[1] = new Str('hello, world')
    abiValues.a.at(0).at(1).at(0).push(new Str('test'))
    abiValues.a.at(1).at(1)[0] = new UintN<64>(24)
    const result = abiValues.bytes

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
