import { Account, Application, Bytes, bytes, gtxn, internal, Uint64, uint64 } from '@algorandfoundation/algorand-typescript'
import { lazyContext } from '../context-helpers/internal-context'
import { asMaybeUint64Cls, asUint64 } from '../util'
import { AccountImpl } from './reference'

const resolveAppIndex = (appIdOrIndex: internal.primitives.StubUint64Compat): uint64 => {
  const input = asUint64(appIdOrIndex)
  if (input >= 1001) {
    return input
  }
  const txn = lazyContext.activeGroup.activeTransaction as gtxn.ApplicationTxn
  return txn.apps(input).id
}

export const getApp = (app: Application | internal.primitives.StubUint64Compat): Application | undefined => {
  try {
    const appId = asMaybeUint64Cls(app)
    if (appId !== undefined) {
      return lazyContext.ledger.getApplication(resolveAppIndex(appId))
    }
    return app as Application
  } catch {
    return undefined
  }
}

export const AppParams: internal.opTypes.AppParamsType = {
  appApprovalProgram(a: Application | internal.primitives.StubUint64Compat): readonly [bytes, boolean] {
    const app = getApp(a)
    return app === undefined ? [Bytes(), false] : [app.approvalProgram, true]
  },
  appClearStateProgram(a: Application | internal.primitives.StubUint64Compat): readonly [bytes, boolean] {
    const app = getApp(a)
    return app === undefined ? [Bytes(), false] : [app.clearStateProgram, true]
  },
  appGlobalNumUint(a: Application | internal.primitives.StubUint64Compat): readonly [uint64, boolean] {
    const app = getApp(a)
    return app === undefined ? [Uint64(0), false] : [app.globalNumUint, true]
  },
  appGlobalNumByteSlice(a: Application | internal.primitives.StubUint64Compat): readonly [uint64, boolean] {
    const app = getApp(a)
    return app === undefined ? [Uint64(0), false] : [app.globalNumBytes, true]
  },
  appLocalNumUint(a: Application | internal.primitives.StubUint64Compat): readonly [uint64, boolean] {
    const app = getApp(a)
    return app === undefined ? [Uint64(0), false] : [app.localNumUint, true]
  },
  appLocalNumByteSlice(a: Application | internal.primitives.StubUint64Compat): readonly [uint64, boolean] {
    const app = getApp(a)
    return app === undefined ? [Uint64(0), false] : [app.localNumBytes, true]
  },
  appExtraProgramPages(a: Application | internal.primitives.StubUint64Compat): readonly [uint64, boolean] {
    const app = getApp(a)
    return app === undefined ? [Uint64(0), false] : [app.extraProgramPages, true]
  },
  appCreator(a: Application | internal.primitives.StubUint64Compat): readonly [Account, boolean] {
    const app = getApp(a)
    return app === undefined ? [AccountImpl(), false] : [app.creator, true]
  },
  appAddress(a: Application | internal.primitives.StubUint64Compat): readonly [Account, boolean] {
    const app = getApp(a)
    return app === undefined ? [AccountImpl(), false] : [app.address, true]
  },
}
