import { asBigInt, asUint64 } from '../util'
import type { StubUint64Compat } from './primitives'

export function* urange(a: StubUint64Compat, b?: StubUint64Compat, c?: StubUint64Compat) {
  const start = b ? asBigInt(a) : BigInt(0)
  const end = b ? asBigInt(b) : asBigInt(a)
  const step = c ? asBigInt(c) : BigInt(1)
  let iterationCount = 0
  for (let i = start; i < end; i += step) {
    iterationCount++
    yield asUint64(i)
  }
  return iterationCount
}
