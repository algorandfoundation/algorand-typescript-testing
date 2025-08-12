import type { bytes, BytesCompat, op, uint64, Uint64Compat } from '@algorandfoundation/algorand-typescript'
import { lazyContext } from '../context-helpers/internal-context'
import { InternalError } from '../errors'
import { asUint64 } from '../util'
import type { StubBytesCompat, StubUint64Compat } from './primitives'
import { BytesCls, Uint64Cls } from './primitives'

/** @internal */
export const gloadUint64: typeof op.gloadUint64 = (a: StubUint64Compat, b: StubUint64Compat): uint64 => {
  const txn = lazyContext.activeGroup.getTransaction(asUint64(a))
  const result = txn.getScratchSlot(asUint64(b))
  if (result instanceof Uint64Cls) {
    return result.asAlgoTs()
  }
  throw new InternalError('invalid scratch slot type')
}

/** @internal */
export const gloadBytes: typeof op.gloadBytes = (a: StubUint64Compat, b: StubUint64Compat): bytes => {
  const txn = lazyContext.activeGroup.getTransaction(asUint64(a))
  const result = txn.getScratchSlot(asUint64(b))
  if (result instanceof BytesCls) {
    return result.asAlgoTs()
  }
  throw new InternalError('invalid scratch slot type')
}

/** @internal */
export const Scratch: typeof op.Scratch = {
  loadBytes: function (a: StubUint64Compat): bytes {
    const result = lazyContext.activeGroup.activeTransaction.getScratchSlot(asUint64(a))
    if (result instanceof BytesCls) {
      return result as bytes
    }
    throw new InternalError('invalid scratch slot type')
  },
  loadUint64: function (a: StubUint64Compat): uint64 {
    const result = lazyContext.activeGroup.activeTransaction.getScratchSlot(asUint64(a))
    if (result instanceof Uint64Cls) {
      return result as uint64
    }
    throw new InternalError('invalid scratch slot type')
  },
  store: function (a: StubUint64Compat, b: StubUint64Compat | StubBytesCompat): void {
    lazyContext.activeGroup.activeTransaction.setScratchSlot(asUint64(a), b as unknown as Uint64Compat | BytesCompat)
  },
}
