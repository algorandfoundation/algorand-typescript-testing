import type { bytes, BytesBacked, StringCompat } from '@algorandfoundation/algorand-typescript'
import { ARC4Encoded } from '@algorandfoundation/algorand-typescript/arc4'
import { lazyContext } from '../context-helpers/internal-context'
import { InternalError } from '../errors'
import { nameOfType } from '../util'
import type { StubBigUintCompat, StubBytesCompat, StubUint64Compat } from './primitives'
import { AlgoTsPrimitiveCls, BigUintCls, BytesCls, Uint64Cls } from './primitives'

const toBytes = (val: unknown): bytes => {
  if (val instanceof AlgoTsPrimitiveCls) return val.toBytes().asAlgoTs()
  if (val instanceof ARC4Encoded) return val.bytes

  switch (typeof val) {
    case 'string':
      return BytesCls.fromCompat(val).asAlgoTs()
    case 'bigint':
      return BigUintCls.fromCompat(val).toBytes().asAlgoTs()
    case 'number':
      return Uint64Cls.fromCompat(val).toBytes().asAlgoTs()
    default:
      throw new InternalError(`Unsupported arg type ${nameOfType(val)}`)
  }
}

export function log(...args: Array<StubUint64Compat | StubBytesCompat | StubBigUintCompat | StringCompat | BytesBacked>): void {
  lazyContext.txn.appendLog(args.map(toBytes).reduce((left, right) => left.concat(right)))
}
