import type { Account as AccountType, bytes, op, uint64 } from '@algorandfoundation/algorand-typescript'
import { lazyContext } from '../context-helpers/internal-context'
import { asUint64, getRandomBytes } from '../util'
import { Uint64, type StubUint64Compat } from './primitives'
import { Account } from './reference'

export class BlockData {
  seed: bytes
  timestamp: uint64
  proposer: AccountType
  feesCollected: uint64
  bonus: uint64
  branch: bytes
  feeSink: AccountType
  protocol: bytes
  txnCounter: uint64
  proposerPayout: uint64

  constructor() {
    this.seed = getRandomBytes(32).asAlgoTs()
    this.timestamp = asUint64(Date.now())
    this.proposer = Account()
    this.feesCollected = Uint64(0)
    this.bonus = Uint64(0)
    this.branch = getRandomBytes(32).asAlgoTs()
    this.feeSink = Account()
    this.protocol = getRandomBytes(32).asAlgoTs()
    this.txnCounter = Uint64(0)
    this.proposerPayout = Uint64(0)
  }
}

export const Block: typeof op.Block = {
  blkSeed: function (a: StubUint64Compat): bytes {
    return lazyContext.ledger.getBlockData(a).seed
  },
  blkTimestamp: function (a: StubUint64Compat): uint64 {
    return lazyContext.ledger.getBlockData(a).timestamp
  },
  blkProposer: function (a: uint64): AccountType {
    return lazyContext.ledger.getBlockData(a).proposer
  },
  blkFeesCollected: function (a: uint64): uint64 {
    return lazyContext.ledger.getBlockData(a).feesCollected
  },
  blkBonus: function (a: uint64): uint64 {
    return lazyContext.ledger.getBlockData(a).bonus
  },
  blkBranch: function (a: uint64): bytes {
    return lazyContext.ledger.getBlockData(a).branch
  },
  blkFeeSink: function (a: uint64): AccountType {
    return lazyContext.ledger.getBlockData(a).feeSink
  },
  blkProtocol: function (a: uint64): bytes {
    return lazyContext.ledger.getBlockData(a).protocol
  },
  blkTxnCounter: function (a: uint64): uint64 {
    return lazyContext.ledger.getBlockData(a).txnCounter
  },
  blkProposerPayout: function (a: uint64): uint64 {
    return lazyContext.ledger.getBlockData(a).proposerPayout
  },
}
