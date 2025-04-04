import type {
  Account as AccountType,
  Application as ApplicationType,
  bytes,
  gtxn,
  op,
  uint64,
} from '@algorandfoundation/algorand-typescript'
import { lazyContext } from '../context-helpers/internal-context'
import { asMaybeUint64Cls, asUint64 } from '../util'
import { Bytes, Uint64, type StubUint64Compat } from './primitives'
import { Account } from './reference'

const resolveAppIndex = (appIdOrIndex: StubUint64Compat): uint64 => {
  const input = asUint64(appIdOrIndex)
  if (input >= 1001) {
    return input
  }
  const txn = lazyContext.activeGroup.activeTransaction as gtxn.ApplicationCallTxn
  return txn.apps(input).id
}

export const getApp = (app: ApplicationType | StubUint64Compat): ApplicationType | undefined => {
  try {
    const appId = asMaybeUint64Cls(app)
    if (appId !== undefined) {
      return lazyContext.ledger.getApplication(resolveAppIndex(appId))
    }
    return app as ApplicationType
  } catch {
    return undefined
  }
}

export const AppParams: typeof op.AppParams = {
  appApprovalProgram(a: ApplicationType | StubUint64Compat): readonly [bytes, boolean] {
    const app = getApp(a)
    return app === undefined ? [Bytes(), false] : [app.approvalProgram, true]
  },
  appClearStateProgram(a: ApplicationType | StubUint64Compat): readonly [bytes, boolean] {
    const app = getApp(a)
    return app === undefined ? [Bytes(), false] : [app.clearStateProgram, true]
  },
  appGlobalNumUint(a: ApplicationType | StubUint64Compat): readonly [uint64, boolean] {
    const app = getApp(a)
    return app === undefined ? [Uint64(0), false] : [app.globalNumUint, true]
  },
  appGlobalNumByteSlice(a: ApplicationType | StubUint64Compat): readonly [uint64, boolean] {
    const app = getApp(a)
    return app === undefined ? [Uint64(0), false] : [app.globalNumBytes, true]
  },
  appLocalNumUint(a: ApplicationType | StubUint64Compat): readonly [uint64, boolean] {
    const app = getApp(a)
    return app === undefined ? [Uint64(0), false] : [app.localNumUint, true]
  },
  appLocalNumByteSlice(a: ApplicationType | StubUint64Compat): readonly [uint64, boolean] {
    const app = getApp(a)
    return app === undefined ? [Uint64(0), false] : [app.localNumBytes, true]
  },
  appExtraProgramPages(a: ApplicationType | StubUint64Compat): readonly [uint64, boolean] {
    const app = getApp(a)
    return app === undefined ? [Uint64(0), false] : [app.extraProgramPages, true]
  },
  appCreator(a: ApplicationType | StubUint64Compat): readonly [AccountType, boolean] {
    const app = getApp(a)
    return app === undefined ? [Account(), false] : [app.creator, true]
  },
  appAddress(a: ApplicationType | StubUint64Compat): readonly [AccountType, boolean] {
    const app = getApp(a)
    return app === undefined ? [Account(), false] : [app.address, true]
  },
}
