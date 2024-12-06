import { internal, uint64 } from '@algorandfoundation/algorand-typescript'
import { Bool, decodeArc4, Str, Tuple, UintN } from '@algorandfoundation/algorand-typescript/arc4'
import { ABIType } from 'algosdk'
import { describe, expect, test } from 'vitest'
import { DeliberateAny } from '../../src/typescript-helpers'
import { asBytes } from '../../src/util'

const nativeString = 'hello'
const nativeNumber = 42
const nativeBool = true
// const nativeAddress = asUint8Array(Bytes.fromHex(`${'00'.repeat(31)}ff`))

const abiString = new Str('hello')
const abiUint64 = new UintN<64>(42)
const abiBool = new Bool(true)
// const abiAddress = new Address(Bytes.fromHex(`${'00'.repeat(31)}ff`))

const testData = [
  // {
  //   abiType: ABIType.from('((bool,(string[],string,address)),(uint8,uint8[3]))'),
  //   nativeValues() {
  //     return [
  //       [nativeBool, [[nativeString, nativeString], nativeString, nativeAddress]],
  //       [nativeNumber, [nativeNumber, nativeNumber, nativeNumber]],
  //     ]
  //   },
  //   abiValues() {
  //     return [
  //       new Tuple<[Bool, Tuple<[DynamicArray<Str>, Str, Address]>]>(
  //         abiBool,
  //         new Tuple<[DynamicArray<Str>, Str, Address]>(new DynamicArray(abiString, abiString), abiString, abiAddress),
  //       ),
  //       new Tuple<[UintN<8>, StaticArray<UintN<8>, 3>]>(abiUint8, new StaticArray(abiUint8, abiUint8, abiUint8)),
  //     ] as readonly [Tuple<[Bool, Tuple<[DynamicArray<Str>, Str, Address]>]>, Tuple<[UintN<8>, StaticArray<UintN<8>, 3>]>]
  //   },
  //   arc4Value() {
  //     return new Tuple<[Tuple<[Bool, Tuple<[DynamicArray<Str>, Str, Address]>]>, Tuple<[UintN<8>, StaticArray<UintN<8>, 3>]>]>(
  //       ...this.abiValues(),
  //     )
  //   },
  //   decode(value: internal.primitives.StubBytesCompat) {
  //     return decodeArc4<[[boolean, [string[], string, bytes]], [uint64, uint64[]]]>(asBytes(value))
  //   },
  // },
  {
    abiType: ABIType.from('(uint64,uint64)'),
    nativeValues() {
      return [

        nativeNumber, nativeNumber,
      ]
    },
    abiValues() {
      return [
        abiUint64, abiUint64] as readonly [UintN<64>, UintN<64>]
    },
    arc4Value() {
      return new Tuple<[UintN<64>, UintN<64>]>(...this.abiValues())
    },
    decode(value: internal.primitives.StubBytesCompat) {
      return decodeArc4<[uint64, uint64]>(asBytes(value))
    },
  },
  {
    abiType: ABIType.from('((bool,(string,bool)),(uint64,uint64))'),
    nativeValues() {
      return [
        [nativeBool, [nativeString, nativeBool]],
        [nativeNumber, nativeNumber],
      ]
    },
    abiValues() {
      return [
        new Tuple<[Bool, Tuple<[Str, Bool]>]>(abiBool, new Tuple<[Str, Bool]>(abiString, abiBool)),
        new Tuple<[UintN<64>, UintN<64>]>(abiUint64, abiUint64),
      ] as readonly [Tuple<[Bool, Tuple<[Str, Bool]>]>, Tuple<[UintN<64>, UintN<64>]>]
    },
    arc4Value() {
      return new Tuple<[Tuple<[Bool, Tuple<[Str, Bool]>]>, Tuple<[UintN<64>, UintN<64>]>]>(...this.abiValues())
    },
    decode(value: internal.primitives.StubBytesCompat) {
      return decodeArc4<[[boolean, [string, boolean]], [uint64, uint64]]>(asBytes(value))
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

const compareNativeValues = (a: DeliberateAny, b: DeliberateAny) => {
  if (Array.isArray(a)) {
    for (let i = 0; i < a.length; i++) {
      compareNativeValues(a[i], b[i])
    }
  }
  expect(a).toEqual(b)
}

// const x = {
//   name: 'Tuple',
//   genericArgs: [
//     {
//       name: 'Tuple',
//       genericArgs: [
//         { name: 'Bool' },
//         {
//           name: 'Tuple',
//           genericArgs: [
//             { name: 'Str' },
//             { name: 'DynamicBytes', genericArgs: { elementType: { name: 'Byte', genericArgs: [{ name: '8' }] } } },
//           ],
//         },
//       ],
//     },
//     {
//       name: 'Tuple',
//       genericArgs: [
//         { name: 'UintN<64>', genericArgs: [{ name: '64' }] },
//         { name: 'UintN<64>', genericArgs: [{ name: '64' }] },
//       ],
//     },
//   ],
// }

// const y = {
//   name: 'Tuple<Tuple<boolean, Tuple<string, bytes>>, Tuple<uint64, uint64>>',
//   genericArgs: [
//     {
//       name: 'Tuple<boolean, Tuple<string, bytes>>',
//       genericArgs: [{ name: 'boolean' }, { name: 'Tuple<string, bytes>', genericArgs: [{ name: 'string' }, { name: 'bytes' }] }],
//     },
//     { name: 'Tuple<uint64, uint64>', genericArgs: [{ name: 'uint64' }, { name: 'uint64' }] },
//   ],
// }

// const a = {
//   name: 'Tuple',
//   genericArgs: [
//     {
//       name: 'Tuple',
//       genericArgs: [
//         { name: 'Bool' },
//         {
//           name: 'Tuple',
//           genericArgs: [
//             { name: 'Str' },
//             { name: 'DynamicBytes', genericArgs: { elementType: { name: 'Byte', genericArgs: [{ name: '8' }] } } },
//           ],
//         },
//       ],
//     },
//     {
//       name: 'Tuple',
//       genericArgs: [
//         { name: 'UintN<64>', genericArgs: [{ name: '64' }] },
//         { name: 'UintN<64>', genericArgs: [{ name: '64' }] },
//       ],
//     },
//   ],
// }

// const b = {
//   name: 'Tuple',
//   genericArgs: [
//     {
//       name: 'Tuple',
//       genericArgs: [
//         { name: 'Bool' },
//         {
//           name: 'Tuple',
//           genericArgs: [
//             { name: 'Str' },
//             { name: 'Address', genericArgs: { elementType: { name: 'Byte', genericArgs: [{ name: '8' }] }, size: { name: '32' } } },
//           ],
//         },
//       ],
//     },
//     {
//       name: 'Tuple',
//       genericArgs: [
//         { name: 'UintN<64>', genericArgs: [{ name: '64' }] },
//         { name: 'UintN<64>', genericArgs: [{ name: '64' }] },
//       ],
//     },
//   ],
// }
