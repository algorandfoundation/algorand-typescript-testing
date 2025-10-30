import type { Application, bytes, BytesCompat, op, uint64, Uint64Compat } from '@algorandfoundation/algorand-typescript'
import { lazyContext } from '../context-helpers/internal-context'
import { asBytes } from '../util'
import { getApp } from './app-params'
import { toBytes } from './encoded-types'
import { Bytes, Uint64, type StubBytesCompat, type StubUint64Compat } from './primitives'

/** @internal */
export const AppGlobal: typeof op.AppGlobal = {
  delete(a: StubBytesCompat): void {
    lazyContext.ledger.setGlobalState(lazyContext.activeApplication, asBytes(a), undefined)
  },
  getBytes(a: StubBytesCompat): bytes {
    const app = lazyContext.activeApplication
    return this.getExBytes(app, asBytes(a))[0]
  },
  getUint64(a: StubBytesCompat): uint64 {
    const app = lazyContext.activeApplication
    return this.getExUint64(app, asBytes(a))[0]
  },
  getExBytes(a: Application | StubUint64Compat, b: StubBytesCompat): readonly [bytes, boolean] {
    const app = getApp(a)
    if (app === undefined) {
      return [Bytes(), false]
    }
    const [state, exists] = lazyContext.ledger.getGlobalState(app, asBytes(b))
    if (!exists) {
      return [Bytes(), false]
    }
    return [toBytes(state!.value), exists]
  },
  getExUint64(a: Application | StubUint64Compat, b: StubBytesCompat): readonly [uint64, boolean] {
    const app = getApp(a)
    if (app === undefined) {
      return [Uint64(0), false]
    }
    const [state, exists] = lazyContext.ledger.getGlobalState(app, asBytes(b))
    if (!exists) {
      return [Uint64(0), false]
    }
    return [state!.value as uint64, exists]
  },
  put(a: StubBytesCompat, b: StubUint64Compat | StubBytesCompat): void {
    lazyContext.ledger.setGlobalState(lazyContext.activeApplication, asBytes(a), b as unknown as Uint64Compat | BytesCompat)
  },
}
