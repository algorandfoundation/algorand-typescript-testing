import type { BytesBacked, StringCompat } from '@algorandfoundation/algorand-typescript'
import { lazyContext } from '../context-helpers/internal-context'

import { toBytes } from './encoded-types'
import type { StubBigUintCompat, StubBytesCompat, StubUint64Compat } from './primitives'

export function log(...args: Array<StubUint64Compat | StubBytesCompat | StubBigUintCompat | StringCompat | BytesBacked>): void {
  lazyContext.txn.appendLog(args.map(toBytes).reduce((left, right) => left.concat(right)))
}
