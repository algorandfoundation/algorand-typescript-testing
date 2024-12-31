import { Account, BaseContract, bytes, internal, LogicSig, uint64 } from '@algorandfoundation/algorand-typescript'
import { captureMethodConfig } from './abi-metadata'
import { DEFAULT_TEMPLATE_VAR_PREFIX } from './constants'
import { DecodedLogs, LogDecoding } from './decode-logs'
import * as ops from './impl'
import {
  applicationCall as itxnApplicationCall,
  assetConfig as itxnAssetConfig,
  assetFreeze as itxnAssetFreeze,
  assetTransfer as itxnAssetTransfer,
  keyRegistration as itxnKeyRegistration,
  payment as itxnPayment,
  submitGroup as itxnSubmitGroup,
} from './impl/inner-transactions'
import { AccountImpl } from './impl/reference'
import { Box, BoxMap, BoxRef, GlobalState, LocalState } from './impl/state'
import { ContractContext } from './subcontexts/contract-context'
import { LedgerContext } from './subcontexts/ledger-context'
import { TransactionContext } from './subcontexts/transaction-context'
import { ConstructorFor, DeliberateAny } from './typescript-helpers'
import { getRandomBytes } from './util'
import { ValueGenerator } from './value-generators'

export class TestExecutionContext implements internal.ExecutionContext {
  #contractContext: ContractContext
  #ledgerContext: LedgerContext
  #txnContext: TransactionContext
  #valueGenerator: ValueGenerator
  #defaultSender: Account
  #activeLogicSigArgs: bytes[]
  #template_vars: Record<string, DeliberateAny> = {}
  #compiledApps: Array<[ConstructorFor<BaseContract>, uint64]> = []
  #compiledLogicSigs: Array<[ConstructorFor<LogicSig>, Account]> = []

  constructor(defaultSenderAddress?: bytes) {
    internal.ctxMgr.instance = this
    this.#contractContext = new ContractContext()
    this.#ledgerContext = new LedgerContext()
    this.#txnContext = new TransactionContext()
    this.#valueGenerator = new ValueGenerator()
    this.#defaultSender = AccountImpl(defaultSenderAddress ?? getRandomBytes(32).asAlgoTs())
    this.#activeLogicSigArgs = []
  }

  exportLogs<const T extends [...LogDecoding[]]>(appId: uint64, ...decoding: T): DecodedLogs<T> {
    return this.txn.exportLogs(appId, ...decoding)
  }

  /* @internal */
  get op() {
    return ops
  }
  get contract() {
    return this.#contractContext
  }

  get ledger() {
    return this.#ledgerContext
  }

  get txn() {
    return this.#txnContext
  }

  get any() {
    return this.#valueGenerator
  }

  get defaultSender(): Account {
    return this.#defaultSender
  }

  /* @internal */
  get abiMetadata() {
    return {
      captureMethodConfig,
    }
  }

  /* @internal */
  get gtxn() {
    return {
      Transaction: (index: uint64) => this.txn.activeGroup.getTransaction(index),
      PaymentTxn: (index: uint64) => this.txn.activeGroup.getPaymentTransaction(index),
      KeyRegistrationTxn: (index: uint64) => this.txn.activeGroup.getKeyRegistrationTransaction(index),
      AssetConfigTxn: (index: uint64) => this.txn.activeGroup.getAssetConfigTransaction(index),
      AssetTransferTxn: (index: uint64) => this.txn.activeGroup.getAssetTransferTransaction(index),
      AssetFreezeTxn: (index: uint64) => this.txn.activeGroup.getAssetFreezeTransaction(index),
      ApplicationTxn: (index: uint64) => this.txn.activeGroup.getApplicationTransaction(index),
    }
  }

  /* @internal */
  get itxn() {
    return {
      submitGroup: itxnSubmitGroup,
      payment: itxnPayment,
      keyRegistration: itxnKeyRegistration,
      assetConfig: itxnAssetConfig,
      assetTransfer: itxnAssetTransfer,
      assetFreeze: itxnAssetFreeze,
      applicationCall: itxnApplicationCall,
    }
  }

  /* @internal */
  get state() {
    return {
      GlobalState,
      LocalState,
      Box,
      BoxMap,
      BoxRef,
    }
  }

  get activeLogicSigArgs(): bytes[] {
    return this.#activeLogicSigArgs
  }

  get templateVars(): Record<string, DeliberateAny> {
    return this.#template_vars
  }

  executeLogicSig(logicSig: LogicSig, ...args: bytes[]): boolean | uint64 {
    this.#activeLogicSigArgs = args
    try {
      return logicSig.program()
    } finally {
      this.#activeLogicSigArgs = []
    }
  }

  setTemplateVar(name: string, value: DeliberateAny, prefix?: string) {
    this.#template_vars[(prefix ?? DEFAULT_TEMPLATE_VAR_PREFIX) + name] = value
  }

  getCompiledApp(contract: ConstructorFor<BaseContract>) {
    return this.#compiledApps.find(([c, _]) => c === contract)
  }

  setCompiledApp(c: ConstructorFor<BaseContract>, appId: uint64) {
    const existing = this.getCompiledApp(c)
    if (existing) {
      existing[1] = appId
    } else {
      this.#compiledApps.push([c, appId])
    }
  }

  getCompiledLogicSig(logicsig: ConstructorFor<LogicSig>) {
    return this.#compiledLogicSigs.find(([c, _]) => c === logicsig)
  }

  setCompiledLogicSig(c: ConstructorFor<LogicSig>, account: Account) {
    const existing = this.getCompiledLogicSig(c)
    if (existing) {
      existing[1] = account
    } else {
      this.#compiledLogicSigs.push([c, account])
    }
  }

  reset() {
    this.#contractContext = new ContractContext()
    this.#ledgerContext = new LedgerContext()
    this.#txnContext = new TransactionContext()
    this.#activeLogicSigArgs = []
    this.#template_vars = {}
    this.#compiledApps = []
    internal.ctxMgr.reset()
    internal.ctxMgr.instance = this
  }
}
