import type { assertMatch, match } from '@algorandfoundation/algorand-typescript'
import { assert, internal } from '@algorandfoundation/algorand-typescript'
import { ARC4Encoded } from '@algorandfoundation/algorand-typescript/arc4'
import type { DeliberateAny } from '../typescript-helpers'
import { asBytes, asMaybeBigUintCls } from '../util'
import { BytesBackedCls, Uint64BackedCls } from './base'

export const matchImpl: typeof match = (subject, test): boolean => {
  const bigIntSubjectValue = getBigIntValue(subject)
  if (bigIntSubjectValue !== undefined) {
    const bigIntTestValue = getBigIntValue(test)
    if (bigIntTestValue !== undefined) {
      return bigIntSubjectValue === bigIntTestValue
    } else if (Object.hasOwn(test, 'lessThan')) {
      return bigIntSubjectValue < getBigIntValue((test as DeliberateAny).lessThan)!
    } else if (Object.hasOwn(test, 'greaterThan')) {
      return bigIntSubjectValue > getBigIntValue((test as DeliberateAny).greaterThan)!
    } else if (Object.hasOwn(test, 'lessThanEq')) {
      return bigIntSubjectValue <= getBigIntValue((test as DeliberateAny).lessThanEq)!
    } else if (Object.hasOwn(test, 'greaterThanEq')) {
      return bigIntSubjectValue >= getBigIntValue((test as DeliberateAny).greaterThanEq)!
    } else if (Object.hasOwn(test, 'between')) {
      const [start, end] = (test as DeliberateAny).between
      return bigIntSubjectValue >= getBigIntValue(start)! && bigIntSubjectValue <= getBigIntValue(end)!
    }
  } else if (subject instanceof internal.primitives.BytesCls) {
    return subject.equals(asBytes(test as unknown as internal.primitives.StubBytesCompat))
  } else if (typeof subject === 'string') {
    return subject === test
  } else if (subject instanceof BytesBackedCls) {
    return subject.bytes.equals((test as unknown as BytesBackedCls).bytes)
  } else if (subject instanceof Uint64BackedCls) {
    return (
      getBigIntValue(subject.uint64 as unknown as internal.primitives.Uint64Cls) ===
      getBigIntValue((test as unknown as Uint64BackedCls).uint64 as unknown as internal.primitives.Uint64Cls)
    )
  } else if (test instanceof ARC4Encoded) {
    return (subject as unknown as ARC4Encoded).bytes.equals(test.bytes)
  } else if (Array.isArray(test)) {
    return test.map((x, i) => matchImpl((subject as DeliberateAny)[i], x as DeliberateAny)).every((x) => x)
  } else if (typeof test === 'object') {
    return Object.entries(test!)
      .map(([k, v]) => matchImpl((subject as DeliberateAny)[k], v as DeliberateAny))
      .every((x) => x)
  }
  return false
}

export const assertMatchImpl: typeof assertMatch = (subject, test, message): boolean => {
  const isMatching = matchImpl(subject, test)
  assert(isMatching, message)
  return isMatching
}

const getBigIntValue = (x: unknown) => {
  return asMaybeBigUintCls(x)?.asBigInt()
}
