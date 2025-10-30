import type { BytesBacked, StringCompat } from '@algorandfoundation/algorand-typescript'
import { lazyContext } from '../context-helpers/internal-context'

import { toBytes } from './encoded-types'
import type { StubBigUintCompat, StubBytesCompat, StubUint64Compat } from './primitives'

/** @internal */
export function log(...args: Array<StubUint64Compat | StubBytesCompat | StubBigUintCompat | StringCompat | BytesBacked>): void {
  lazyContext.txn.appendLog(args.map((a) => toBytes(a)).reduce((left, right) => left.concat(right)))
}
