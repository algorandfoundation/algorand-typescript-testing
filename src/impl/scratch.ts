import type { bytes, op, uint64 } from '@algorandfoundation/algorand-typescript'
import { lazyContext } from '../context-helpers/internal-context'
import { InternalError } from '../errors'
import type { StubBytesCompat, StubUint64Compat } from './primitives'
import { BytesCls, Uint64Cls } from './primitives'

export const gloadUint64: typeof op.gloadUint64 = (a: StubUint64Compat, b: StubUint64Compat): uint64 => {
  const txn = lazyContext.activeGroup.getTransaction(a)
  const result = txn.getScratchSlot(b)
  if (result instanceof Uint64Cls) {
    return result.asAlgoTs()
  }
  throw new InternalError('invalid scratch slot type')
}

export const gloadBytes: typeof op.gloadBytes = (a: StubUint64Compat, b: StubUint64Compat): bytes => {
  const txn = lazyContext.activeGroup.getTransaction(a)
  const result = txn.getScratchSlot(b)
  if (result instanceof BytesCls) {
    return result.asAlgoTs()
  }
  throw new InternalError('invalid scratch slot type')
}

export const Scratch: typeof op.Scratch = {
  loadBytes: function (a: StubUint64Compat): bytes {
    const result = lazyContext.activeGroup.activeTransaction.getScratchSlot(a)
    if (result instanceof BytesCls) {
      return result as bytes
    }
    throw new InternalError('invalid scratch slot type')
  },
  loadUint64: function (a: StubUint64Compat): uint64 {
    const result = lazyContext.activeGroup.activeTransaction.getScratchSlot(a)
    if (result instanceof Uint64Cls) {
      return result as uint64
    }
    throw new InternalError('invalid scratch slot type')
  },
  store: function (a: StubUint64Compat, b: StubUint64Compat | StubBytesCompat): void {
    lazyContext.activeGroup.activeTransaction.setScratchSlot(a, b)
  },
}
