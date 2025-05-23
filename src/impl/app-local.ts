import type { Account, Application, bytes, op, uint64 } from '@algorandfoundation/algorand-typescript'
import { lazyContext } from '../context-helpers/internal-context'
import { asBytes } from '../util'
import { getAccount } from './acct-params'
import { getApp } from './app-params'
import { toBytes } from './encoded-types'
import { Bytes, Uint64, type StubBytesCompat, type StubUint64Compat } from './primitives'

export const AppLocal: typeof op.AppLocal = {
  delete: function (a: Account | StubUint64Compat, b: StubBytesCompat): void {
    const app = lazyContext.activeApplication
    const account = getAccount(a)
    lazyContext.ledger.setLocalState(app, account, b, undefined)
  },
  getBytes: function (a: Account | StubUint64Compat, b: StubBytesCompat): bytes {
    const account = getAccount(a)
    return this.getExBytes(account, 0, asBytes(b))[0]
  },
  getUint64: function (a: Account | StubUint64Compat, b: StubBytesCompat): uint64 {
    const account = getAccount(a)
    return this.getExUint64(account, 0, asBytes(b))[0]
  },
  getExBytes: function (a: Account | StubUint64Compat, b: Application | StubUint64Compat, c: StubBytesCompat): readonly [bytes, boolean] {
    const app = getApp(b)
    const account = getAccount(a)
    if (app === undefined || account === undefined) {
      return [Bytes(), false]
    }
    const [state, exists] = lazyContext.ledger.getLocalState(app, account, c)
    if (!exists) {
      return [Bytes(), false]
    }
    return [toBytes(state!.value), exists]
  },
  getExUint64: function (a: Account | StubUint64Compat, b: Application | StubUint64Compat, c: StubBytesCompat): readonly [uint64, boolean] {
    const app = getApp(b)
    const account = getAccount(a)
    if (app === undefined || account === undefined) {
      return [Uint64(0), false]
    }
    const [state, exists] = lazyContext.ledger.getLocalState(app, account, c)
    if (!exists) {
      return [Uint64(0), false]
    }
    return [state!.value as uint64, exists]
  },
  put: function (a: Account | StubUint64Compat, b: StubBytesCompat, c: uint64 | bytes): void {
    const app = lazyContext.activeApplication
    const account = getAccount(a)
    lazyContext.ledger.setLocalState(app, account, b, c)
  },
}
