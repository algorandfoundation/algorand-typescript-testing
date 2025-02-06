import type { Account, op, uint64 } from '@algorandfoundation/algorand-typescript'
import { lazyContext } from '../context-helpers/internal-context'
import { getAccount } from './acct-params'
import type { StubUint64Compat } from './primitives'

export class VoterData {
  balance: uint64
  incentiveEligible: boolean

  constructor() {
    this.balance = 0
    this.incentiveEligible = false
  }
}

const getVoterData = (a: Account | StubUint64Compat): VoterData => {
  const acct = getAccount(a)
  return lazyContext.getVoterData(acct)
}

export const VoterParams: typeof op.VoterParams = {
  voterBalance: function (a: Account | StubUint64Compat): readonly [uint64, boolean] {
    const data = getVoterData(a)
    return [data.balance, data.balance !== 0]
  },
  voterIncentiveEligible: function (a: Account | StubUint64Compat): readonly [boolean, boolean] {
    const data = getVoterData(a)
    return [data.incentiveEligible, data.balance !== 0]
  },
}
