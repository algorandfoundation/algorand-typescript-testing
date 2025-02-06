import type { Application, bytes, op, uint64 } from '@algorandfoundation/algorand-typescript'
import { lazyContext } from '../context-helpers/internal-context'
import { toBytes } from '../encoders'
import { asBytes } from '../util'
import { getApp } from './app-params'
import { Bytes, Uint64, type StubBytesCompat, type StubUint64Compat } from './primitives'

export const AppGlobal: typeof op.AppGlobal = {
  delete(a: StubBytesCompat): void {
    lazyContext.ledger.setGlobalState(lazyContext.activeApplication, a, undefined)
  },
  getBytes(a: StubBytesCompat): bytes {
    return this.getExBytes(0, asBytes(a))[0]
  },
  getUint64(a: StubBytesCompat): uint64 {
    return this.getExUint64(0, asBytes(a))[0]
  },
  getExBytes(a: Application | StubUint64Compat, b: StubBytesCompat): readonly [bytes, boolean] {
    const app = getApp(a)
    if (app === undefined) {
      return [Bytes(), false]
    }
    const [state, exists] = lazyContext.ledger.getGlobalState(app, b)
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
    const [state, exists] = lazyContext.ledger.getGlobalState(app, b)
    if (!exists) {
      return [Uint64(0), false]
    }
    return [state!.value as uint64, exists]
  },
  put(a: StubBytesCompat, b: StubUint64Compat | StubBytesCompat): void {
    lazyContext.ledger.setGlobalState(lazyContext.activeApplication, a, b)
  },
}
