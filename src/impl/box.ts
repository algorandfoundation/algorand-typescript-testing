import type { bytes, op, uint64 } from '@algorandfoundation/algorand-typescript'
import { MAX_BOX_SIZE } from '../constants'
import { lazyContext } from '../context-helpers/internal-context'
import { AvmError, InternalError } from '../errors'
import { asBytes, asBytesCls, asNumber, asUint8Array, concatUint8Arrays } from '../util'
import { toBytes } from './encoded-types'
import type { StubBytesCompat, StubUint64Compat } from './primitives'

/** @internal */
export const Box: typeof op.Box = {
  create(a: StubBytesCompat, b: StubUint64Compat): boolean {
    const name = asBytes(a)
    const size = asNumber(b)
    if (name.length === 0 || size > MAX_BOX_SIZE) {
      throw new AvmError('Invalid box name or size')
    }
    const app = lazyContext.activeApplication
    if (lazyContext.ledger.boxExists(app, name)) {
      return false
    }
    lazyContext.ledger.setBox(app, name, new Uint8Array(size))
    return true
  },
  delete(a: StubBytesCompat): boolean {
    const name = asBytes(a)
    const app = lazyContext.activeApplication
    if (!lazyContext.ledger.boxExists(app, name)) {
      return false
    }
    lazyContext.ledger.deleteBox(app, name)
    return true
  },
  extract(a: StubBytesCompat, b: StubUint64Compat, c: StubUint64Compat): bytes {
    const name = asBytes(a)
    const start = asNumber(b)
    const length = asNumber(c)
    const app = lazyContext.activeApplication
    if (!lazyContext.ledger.boxExists(app, name)) {
      throw new InternalError('Box does not exist')
    }
    const boxContent = lazyContext.ledger.getBox(app, name)
    return toBytes(boxContent.slice(start, start + length))
  },
  get(a: StubBytesCompat): readonly [bytes, boolean] {
    const name = asBytes(a)
    const app = lazyContext.activeApplication
    const boxContent = lazyContext.ledger.getBox(app, name)
    return [toBytes(boxContent), lazyContext.ledger.boxExists(app, name)]
  },
  length(a: StubBytesCompat): readonly [uint64, boolean] {
    const name = asBytes(a)
    const app = lazyContext.activeApplication
    const boxContent = lazyContext.ledger.getBox(app, name)
    const exists = lazyContext.ledger.boxExists(app, name)
    return [boxContent.length, exists]
  },
  put(a: StubBytesCompat, b: StubBytesCompat): void {
    const name = asBytes(a)
    const app = lazyContext.activeApplication
    const newContent = asBytesCls(b)
    if (lazyContext.ledger.boxExists(app, name)) {
      const boxContent = lazyContext.ledger.getBox(app, name)
      const length = boxContent.length
      if (asNumber(length) !== asNumber(newContent.length)) {
        throw new InternalError('New content length does not match existing box length')
      }
    }
    lazyContext.ledger.setBox(app, name, newContent.asUint8Array())
  },
  replace(a: StubBytesCompat, b: StubUint64Compat, c: StubBytesCompat): void {
    const name = asBytes(a)
    const start = asNumber(b)
    const newContent = asUint8Array(c)
    const app = lazyContext.activeApplication
    if (!lazyContext.ledger.boxExists(app, name)) {
      throw new InternalError('Box does not exist')
    }
    const boxContent = lazyContext.ledger.getBox(app, name)
    if (start + newContent.length > boxContent.length) {
      throw new InternalError('Replacement content exceeds box size')
    }
    const updatedContent = concatUint8Arrays(boxContent.slice(0, start), newContent, boxContent.slice(start + newContent.length))
    lazyContext.ledger.setBox(app, name, updatedContent)
  },
  resize(a: StubBytesCompat, b: StubUint64Compat): void {
    const name = asBytes(a)
    const newSize = asNumber(b)
    const app = lazyContext.activeApplication
    if (!lazyContext.ledger.boxExists(app, name)) {
      throw new InternalError('Box does not exist')
    }
    const boxContent = lazyContext.ledger.getBox(app, name)
    const size = boxContent.length
    let updatedContent
    if (newSize > size) {
      updatedContent = concatUint8Arrays(boxContent, new Uint8Array(newSize - size))
    } else {
      updatedContent = boxContent.slice(0, newSize)
    }
    lazyContext.ledger.setBox(app, name, updatedContent)
  },
  splice(a: StubBytesCompat, b: StubUint64Compat, c: StubUint64Compat, d: StubBytesCompat): void {
    const name = asBytes(a)
    const start = asNumber(b)
    const length = asNumber(c)
    const newContent = asUint8Array(d)
    const app = lazyContext.activeApplication
    if (!lazyContext.ledger.boxExists(app, name)) {
      throw new InternalError('Box does not exist')
    }
    const boxContent = lazyContext.ledger.getBox(app, name)
    const size = boxContent.length
    if (start > size) {
      throw new InternalError('Start index exceeds box size')
    }
    const end = Math.min(start + length, size)
    let updatedContent = concatUint8Arrays(boxContent.slice(0, start), newContent, boxContent.slice(end))
    //  Adjust the size if necessary
    if (updatedContent.length > size) {
      updatedContent = updatedContent.slice(0, size)
    } else if (updatedContent.length < size) {
      updatedContent = concatUint8Arrays(updatedContent, new Uint8Array(size - asNumber(updatedContent.length)))
    }
    lazyContext.ledger.setBox(app, name, updatedContent)
  },
}
