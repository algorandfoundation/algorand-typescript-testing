import { asUint64, asUint64BigInt } from '../util'
import type { StubUint64Compat } from './primitives'

/** @internal */
export function* urange(a: StubUint64Compat, b?: StubUint64Compat, c?: StubUint64Compat) {
  const start = b ? asUint64BigInt(a) : BigInt(0)
  const end = b ? asUint64BigInt(b) : asUint64BigInt(a)
  const step = c ? asUint64BigInt(c) : BigInt(1)
  let iterationCount = 0
  for (let i = start; i < end; i += step) {
    iterationCount++
    yield asUint64(i)
  }
  return iterationCount
}
