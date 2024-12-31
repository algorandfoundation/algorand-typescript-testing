import { bytes, BytesBacked, internal, StringCompat } from '@algorandfoundation/algorand-typescript'
import { ARC4Encoded } from '@algorandfoundation/algorand-typescript/arc4'
import { lazyContext } from '../context-helpers/internal-context'
import { nameOfType } from '../util'

const toBytes = (val: unknown): bytes => {
  if (val instanceof internal.primitives.AlgoTsPrimitiveCls) return val.toBytes().asAlgoTs()
  if (val instanceof ARC4Encoded) return val.bytes

  switch (typeof val) {
    case 'string':
      return internal.primitives.BytesCls.fromCompat(val).asAlgoTs()
    case 'bigint':
      return internal.primitives.BigUintCls.fromCompat(val).toBytes().asAlgoTs()
    case 'number':
      return internal.primitives.Uint64Cls.fromCompat(val).toBytes().asAlgoTs()
    default:
      internal.errors.internalError(`Unsupported arg type ${nameOfType(val)}`)
  }
}

export function logImpl(
  ...args: Array<
    | internal.primitives.StubUint64Compat
    | internal.primitives.StubBytesCompat
    | internal.primitives.StubBigUintCompat
    | StringCompat
    | BytesBacked
  >
): void {
  lazyContext.txn.appendLog(args.map(toBytes).reduce((left, right) => left.concat(right)))
}
